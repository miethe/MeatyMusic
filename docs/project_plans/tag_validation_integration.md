# Tag Validation Integration Guide

**Version**: 1.0
**Last Updated**: 2025-11-19
**Status**: Phase 2, Task 2.3 - Tag Validation Integration

## Overview

This document describes how workflow nodes (STYLE, COMPOSE, VALIDATE) should integrate tag conflict validation using the ValidationService. Tag conflict validation ensures that contradictory or incompatible tags are detected and resolved before artifacts are composed or rendered.

## Integration Architecture

```
┌─────────────┐
│ Workflow    │
│ Node        │
│ (STYLE,     │
│  COMPOSE,   │
│  VALIDATE)  │
└──────┬──────┘
       │
       ├──────────────────────────────────────────┐
       │                                          │
       v                                          v
┌─────────────────┐                      ┌──────────────────┐
│ValidationService│                      │ConflictDetector  │
│                 │                      │                  │
│validate_tags_   │─────────────────────>│detect_conflicts()│
│for_conflicts()  │                      │resolve_conflicts()│
└─────────────────┘                      └──────────────────┘
       │                                          │
       │                                          v
       v                                  ┌──────────────────┐
┌─────────────────┐                      │Conflict Matrix   │
│ Cleaned Tags    │                      │(JSON)            │
│ + Report        │                      └──────────────────┘
└─────────────────┘
```

## ValidationService API

### Method Signature

```python
def validate_tags_for_conflicts(
    self,
    tags: List[str],
    context: Optional[str] = None,
    strategy: str = "keep-first",
    tag_priorities: Optional[Dict[str, float]] = None
) -> Tuple[bool, List[str], Dict[str, Any]]:
    """Validate tags for conflicts and optionally resolve them.

    Args:
        tags: List of tags to validate
        context: Optional context string for logging (e.g., "style", "prompt", "section")
        strategy: Resolution strategy to use:
            - "keep-first": Keep first occurrence, remove later conflicting tags (default)
            - "remove-lowest-priority": Remove tags with lowest priority values
            - "remove-highest-priority": Remove tags with highest priority values
        tag_priorities: Optional priority values for each tag (required for priority strategies)

    Returns:
        Tuple of (is_valid, cleaned_tags, report):
        - is_valid: True if no conflicts found, False if conflicts exist
        - cleaned_tags: List of tags after conflict resolution
        - report: Dictionary with conflict details and remediation options
    """
```

### Report Structure

```python
report = {
    "conflict_count": 1,  # Number of conflicts detected
    "conflicts": [  # List of conflict details
        {
            "tag_a": "whisper",
            "tag_b": "anthemic",
            "reason": "vocal intensity contradiction",
            "category": "vocal_style"
        }
    ],
    "removed_tags": ["anthemic"],  # Tags removed during resolution
    "strategy_used": "keep-first",  # Strategy applied
    "suggestions": {  # Alternative resolution options
        "keep_first": ["whisper", "upbeat"],
        "remove_whisper": ["anthemic", "upbeat"],
        "remove_anthemic": ["whisper", "upbeat"]
    }
}
```

## Integration Points

### 1. STYLE Node Integration

**Location**: `.claude/skills/workflow/style/implementation.py`

**Integration Pattern**:

```python
from app.services.validation_service import ValidationService

async def run_skill(inputs: Dict[str, Any], context: WorkflowContext) -> Dict[str, Any]:
    """STYLE skill with tag conflict validation."""

    # Initialize services
    validation_service = ValidationService()

    # Extract user tags from SDS
    user_tags = inputs["sds"].get("style", {}).get("tags", [])

    # Step 1: Validate tags for conflicts
    is_valid, cleaned_tags, report = validation_service.validate_tags_for_conflicts(
        tags=user_tags,
        context="style",
        strategy="keep-first"  # Use deterministic keep-first strategy
    )

    # Step 2: Log conflict resolution if needed
    warnings = []
    if not is_valid:
        logger.warning(
            "style.tags_conflicts_resolved",
            run_id=str(context.run_id),
            original_count=len(user_tags),
            cleaned_count=len(cleaned_tags),
            removed_tags=report["removed_tags"],
            conflict_count=report["conflict_count"]
        )

        # Add warnings to output
        for conflict in report["conflicts"]:
            warning_msg = (
                f"Removed '{conflict['tag_b']}' due to conflict with "
                f"'{conflict['tag_a']}' ({conflict['reason']})"
            )
            warnings.append(warning_msg)

    # Step 3: Use cleaned tags in style spec
    style = {
        "genre": genre_primary,
        "bpm": tempo_bpm,
        "key": key_primary,
        "tags": cleaned_tags,  # Use conflict-free tags
        "mood": mood,
        "instrumentation": instrumentation,
        # ... other fields
    }

    # Step 4: Return output with warnings
    return {
        "style": style,
        "conflicts_resolved": warnings
    }
```

**Key Points**:
- Always use `strategy="keep-first"` for determinism
- Log all conflicts at WARNING level with full details
- Add conflict warnings to `conflicts_resolved` output list
- Use cleaned tags in final style spec
- Never allow conflicting tags to reach downstream nodes

### 2. COMPOSE Node Integration

**Location**: `.claude/skills/workflow/compose/implementation.py` (when created)

**Integration Pattern**:

```python
from app.services.validation_service import ValidationService

async def run_skill(inputs: Dict[str, Any], context: WorkflowContext) -> Dict[str, Any]:
    """COMPOSE skill with tag conflict validation."""

    validation_service = ValidationService()

    # Extract all tags from style + producer notes + section_meta
    style_tags = inputs["style"].get("tags", [])
    producer_tags = inputs["producer_notes"].get("tags", [])
    section_tags = []

    for section, meta in inputs["producer_notes"].get("section_meta", {}).items():
        section_tags.extend(meta.get("tags", []))

    # Combine all tags (style + producer + section)
    all_tags = style_tags + producer_tags + section_tags

    # Validate combined tags
    is_valid, cleaned_tags, report = validation_service.validate_tags_for_conflicts(
        tags=all_tags,
        context="compose",
        strategy="keep-first"
    )

    # If conflicts found, emit warning event
    if not is_valid:
        logger.warning(
            "compose.tags_conflicts_detected",
            run_id=str(context.run_id),
            original_count=len(all_tags),
            cleaned_count=len(cleaned_tags),
            conflicts=report["conflicts"]
        )

    # Build composed prompt with cleaned tags
    composed_prompt = {
        "text": prompt_text,
        "meta": {
            "style_tags": cleaned_tags,  # Use conflict-free tags
            # ... other meta fields
        }
    }

    return {
        "composed_prompt": composed_prompt,
        "tag_conflicts": report["conflicts"]  # Include in output for logging
    }
```

**Key Points**:
- Validate ALL tags from all sources (style + producer + sections)
- Use `keep-first` to maintain deterministic order
- Include conflict report in output for observability
- Never compose prompts with conflicting tags

### 3. VALIDATE Node Integration

**Location**: `.claude/skills/workflow/validate/implementation.py` (when created)

**Integration Pattern**:

```python
from app.services.validation_service import ValidationService

async def run_skill(inputs: Dict[str, Any], context: WorkflowContext) -> Dict[str, Any]:
    """VALIDATE skill with tag conflict validation."""

    validation_service = ValidationService()

    # Extract composed prompt tags
    prompt_tags = inputs["composed_prompt"].get("meta", {}).get("style_tags", [])

    # Validate tags (should have no conflicts if earlier nodes worked correctly)
    is_valid, cleaned_tags, report = validation_service.validate_tags_for_conflicts(
        tags=prompt_tags,
        context="validate",
        strategy="keep-first"
    )

    # Build validation scores
    scores = {
        "hook_density": 0.85,
        "singability": 0.90,
        # ... other scores
    }

    # Add tag conflict check to validation
    if not is_valid:
        # FAIL validation if conflicts found at this stage
        # (This should not happen if STYLE and COMPOSE worked correctly)
        logger.error(
            "validate.tag_conflicts_found",
            run_id=str(context.run_id),
            conflicts=report["conflicts"],
            message="Tag conflicts found in VALIDATE stage - upstream nodes failed"
        )

        scores["tag_conflicts"] = 0.0  # Fail this validation dimension
    else:
        scores["tag_conflicts"] = 1.0  # Pass

    # Calculate total score
    total_score = calculate_weighted_score(scores)

    # Determine if validation passes
    passes = total_score >= threshold and scores["tag_conflicts"] == 1.0

    return {
        "scores": scores,
        "total": total_score,
        "passes": passes,
        "issues": report["conflicts"] if not is_valid else []
    }
```

**Key Points**:
- VALIDATE should detect conflicts as a safety check
- If conflicts found at VALIDATE stage, it indicates upstream failure
- Log conflicts at ERROR level in VALIDATE
- Fail validation if any conflicts detected
- Include conflict details in validation report

## Resolution Strategies

### keep-first (Default - Deterministic)

**When to use**: Always, for deterministic behavior

**Behavior**:
- Process tags in order
- Keep first occurrence of each tag
- Remove later tags that conflict with kept tags
- Maintains original order

**Example**:
```python
tags = ["whisper", "anthemic", "upbeat"]
# Result: ["whisper", "upbeat"]
# Removed: "anthemic" (conflicts with "whisper")
```

### remove-lowest-priority

**When to use**: When tag priorities are known and you want to keep more important tags

**Behavior**:
- Requires `tag_priorities` dict
- Keeps tags with higher priority values
- Removes tags with lower priority values in conflicts

**Example**:
```python
tags = ["whisper", "anthemic", "upbeat"]
priorities = {"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.6}
# Result: ["anthemic", "upbeat"]
# Removed: "whisper" (lowest priority = 0.5)
```

### remove-highest-priority

**When to use**: Rarely - when you want to penalize high-priority conflicting tags

**Behavior**:
- Requires `tag_priorities` dict
- Keeps tags with lower priority values
- Removes tags with higher priority values in conflicts

**Example**:
```python
tags = ["whisper", "anthemic", "upbeat"]
priorities = {"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.6}
# Result: ["whisper", "upbeat"]
# Removed: "anthemic" (highest priority = 0.8)
```

## Error Handling

### Graceful Degradation

If tag validation fails due to errors (e.g., missing conflict matrix):

```python
try:
    is_valid, cleaned_tags, report = validation_service.validate_tags_for_conflicts(
        tags=tags,
        context="style"
    )
except Exception as e:
    logger.error(
        "style.tag_validation_error",
        error=str(e),
        run_id=str(context.run_id)
    )
    # Fall back to original tags if validation fails
    cleaned_tags = tags
    is_valid = True  # Assume valid on error (graceful degradation)
    report = {"error": str(e)}
```

### Logging Requirements

All workflow nodes MUST log:
- Tag validation start (DEBUG level)
- Conflicts detected (WARNING level)
- Conflicts at VALIDATE stage (ERROR level)
- All removed tags with reasons

**Example log structure**:
```python
logger.warning(
    "style.tags_conflicts_resolved",
    run_id=str(context.run_id),
    node="STYLE",
    original_count=len(user_tags),
    cleaned_count=len(cleaned_tags),
    removed_tags=report["removed_tags"],
    conflict_count=report["conflict_count"],
    conflicts=[
        f"{c['tag_a']} ↔ {c['tag_b']} ({c['reason']})"
        for c in report["conflicts"]
    ]
)
```

## Testing Requirements

### Unit Tests

Each workflow node integration MUST have tests for:

1. **No conflicts case**:
   ```python
   def test_style_tags_no_conflicts(self):
       tags = ["melodic", "catchy", "upbeat"]
       # Should pass through unchanged
   ```

2. **Simple conflict case**:
   ```python
   def test_style_tags_simple_conflict(self):
       tags = ["whisper", "anthemic", "upbeat"]
       # Should resolve to ["whisper", "upbeat"]
   ```

3. **Multiple conflicts case**:
   ```python
   def test_style_tags_multiple_conflicts(self):
       tags = ["acoustic", "electronic", "whisper", "anthemic"]
       # Should resolve all conflicts
   ```

4. **Determinism test**:
   ```python
   def test_style_tags_deterministic(self):
       tags = ["whisper", "anthemic", "upbeat"]
       # Run 10 times, verify identical results
   ```

### Integration Tests

Test complete workflow with conflicting tags:

```python
def test_workflow_style_to_compose_conflict_resolution(self):
    """Test that conflicts are resolved in STYLE and don't propagate to COMPOSE."""

    # SDS with conflicting tags
    sds = {
        "style": {
            "tags": ["whisper", "anthemic", "upbeat"]
        }
    }

    # Run STYLE
    style_output = await run_style_skill(sds, context)
    assert "anthemic" not in style_output["style"]["tags"]

    # Run COMPOSE
    compose_output = await run_compose_skill(style_output, context)
    # Should have no conflicts
    assert compose_output["tag_conflicts"] == []
```

## Acceptance Criteria

Integration is complete when:

1. ✅ ValidationService.validate_tags_for_conflicts() implemented
2. ✅ Comprehensive tests written and passing
3. ✅ Integration pattern documented (this file)
4. ⏳ STYLE node integrates validation (when node exists)
5. ⏳ COMPOSE node integrates validation (when node exists)
6. ⏳ VALIDATE node integrates validation (when node exists)
7. ⏳ All integration tests pass
8. ⏳ Logging is comprehensive across all nodes
9. ⏳ Conflict resolution is deterministic (same input → same output)

## Future Enhancements

### Phase 3 Considerations

1. **Soft vs Hard Conflicts**:
   - Currently all conflicts are hard (blocking)
   - Future: Support soft conflicts (warnings only)
   - Add `conflict_severity` field to conflict matrix

2. **Context-Aware Validation**:
   - Different conflict rules for different contexts
   - E.g., section-specific tag rules
   - Add `context` filtering to conflict matrix

3. **Conflict Priority Metadata**:
   - Store priority metadata in taxonomy
   - Auto-derive priorities from blueprint
   - Reduce need for manual priority specification

4. **Real-time Validation API**:
   - Expose validation endpoint for UI
   - Pre-flight tag validation before SDS submission
   - Live feedback during tag selection

## References

- **PRD**: `docs/project_plans/PRDs/style.prd.md` (tag conflict matrix)
- **Implementation**: `services/api/app/services/validation_service.py`
- **Detector**: `services/api/app/services/conflict_detector.py`
- **Conflict Matrix**: `taxonomies/conflict_matrix.json`
- **Tests**: `services/api/app/tests/test_services/test_validation_service.py`
- **Workflow PRD**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`

## Questions & Support

For questions about tag validation integration:
1. Review this document first
2. Check existing STYLE node implementation in `.claude/skills/workflow/style/`
3. Reference ConflictDetector tests for usage examples
4. Consult CLAUDE.md for AMCS architecture context

---

**Document Owner**: AMCS Phase 2 Task Force
**Review Cycle**: After each workflow node implementation
**Next Update**: After COMPOSE node integration
