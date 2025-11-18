# PLAN Skill Implementation

**Status**: ✅ Complete (Phase 1.1)
**Node Index**: 1 (First node in AMCS workflow)
**Determinism**: 100% (No RNG, purely deterministic from SDS structure)

## Overview

The PLAN skill transforms a Song Design Spec (SDS) into a deterministic execution plan that guides all downstream workflow nodes (STYLE, LYRICS, PRODUCER, COMPOSE).

## Key Responsibilities

1. **Section Structure Extraction**: Parse and validate section order from SDS
2. **Word Count Calculation**: Compute target word counts per section based on constraints
3. **Evaluation Target Definition**: Load blueprint and define validation thresholds
4. **Work Objective Creation**: Generate ordered objectives for downstream nodes
5. **Provenance Tracking**: Hash all outputs for reproducibility validation

## Input Contract

```python
{
    "sds": {
        "title": str,
        "genre": str,
        "style": {
            "genre_detail": {"primary": str},
            "tempo": {"min": int, "max": int},
            "key": {"primary": str},
            "mood": List[str]
        },
        "lyrics": {
            "section_order": List[str],  # REQUIRED: Must include ≥1 "Chorus"
            "hook_strategy": str,
            "rhyme_scheme": str,
            "meter": str,
            "constraints": {
                "max_lines": int,
                "section_requirements": Dict[str, Dict]
            }
        },
        "producer_notes": {
            "hooks": int,
            "structure": str
        },
        "constraints": {
            "max_lines": int,
            "duration_sec": int,
            "explicit": bool,
            "render_engine": str
        }
    }
}
```

## Output Contract

```python
{
    "plan": {
        "section_order": List[str],
        "target_word_counts": Dict[str, int],
        "evaluation_targets": {
            "hook_density": float,
            "singability": float,
            "rhyme_tightness": float,
            "section_completeness": float,
            "profanity_score": float,
            "total": float
        },
        "work_objectives": List[Dict],
        "total_word_count": int,
        "_hash": str  # SHA-256 for provenance
    }
}
```

## Validation Rules

### Section Order
- **MUST** include at least one "Chorus" section
- If `hook_strategy` is "lyrical" or "chant", **MUST** have ≥2 Chorus sections
- Cannot be empty

### Word Counts
- Total word count **MUST** be ≤ `max_lines * 6` words
- If total exceeds limit, all sections are proportionally reduced
- Each section gets word count based on `section_requirements`

### Evaluation Targets
- All metrics in range [0.0, 1.0]
- `profanity_score` = 0.0 if `explicit=False`, else 1.0
- Genre-specific thresholds applied (e.g., Pop needs higher `hook_density`)

## Determinism Guarantee

The PLAN skill is **100% deterministic**:
- Same SDS + seed → Same plan output with identical hash
- No random operations (no RNG calls)
- No time-dependent operations (no `datetime.now()`)
- Blueprint loading is deterministic (same file, same result)
- All dictionary iteration uses sorted keys for consistent order

**Reproducibility Target**: ≥99% identical outputs across 10 runs (target: 100%)

## Usage Example

```python
from app.workflows.skill import WorkflowContext
from .claude.skills.workflow.plan import run_skill

# Create workflow context
context = WorkflowContext(
    run_id=uuid4(),
    song_id=uuid4(),
    seed=42,
    node_index=0,
    node_name="PLAN"
)

# Execute PLAN skill
result = await run_skill(
    inputs={"sds": sds_dict},
    context=context
)

# Access plan
plan = result["plan"]
print(f"Plan hash: {plan['_hash']}")
print(f"Section count: {len(plan['section_order'])}")
print(f"Total word count: {plan['total_word_count']}")
```

## Testing

Run tests with:

```bash
pytest tests/unit/skills/test_plan_skill.py -v
```

### Test Coverage

- ✅ Basic plan generation
- ✅ Section validation (Chorus requirement)
- ✅ Hook strategy validation (chant requires ≥2 Chorus)
- ✅ Determinism verification (same seed → same hash)
- ✅ Word count calculation and max_lines constraint
- ✅ Evaluation target definition
- ✅ Work objective creation with correct dependencies
- ✅ Profanity score respects explicit flag

## Common Issues

### ValueError: "At least one Chorus section is required"
**Cause**: `section_order` doesn't include any "Chorus" sections
**Fix**: Add at least one Chorus section to `section_order`

### ValueError: "Hook strategy 'chant' requires at least 2 Chorus sections"
**Cause**: `hook_strategy` is "lyrical" or "chant" but only 1 Chorus exists
**Fix**: Add more Chorus sections or change `hook_strategy`

### Word counts too high
**Cause**: Total word count exceeds `max_lines * 6`
**Fix**: PLAN automatically scales down all sections proportionally

## Implementation Notes

### Blueprint Loading
- Uses `BlueprintReaderService` to load genre-specific blueprints
- Falls back to default evaluation targets if blueprint not found
- Blueprint data is cached for performance

### Section Name Normalization
- "Verse1", "Verse2" → "Verse" for lookup in `section_requirements`
- Trailing numbers stripped to find section type

### Work Objective Dependencies
- STYLE: No dependencies (first to execute)
- LYRICS: Depends on STYLE
- PRODUCER: Depends on STYLE
- COMPOSE: Depends on STYLE, LYRICS, PRODUCER

## Phase 0 Integration

The PLAN skill integrates with Phase 0 infrastructure:
- ✅ Uses `@workflow_skill` decorator for telemetry and validation
- ✅ Uses `compute_hash()` from `app.workflows.skill` for provenance
- ✅ Uses `BlueprintReaderService` for genre defaults
- ✅ Emits structured logs via `structlog`
- ✅ Returns workflow-compatible output format

## Next Steps (Phase 1.2+)

- ✅ Task 1.1: Core implementation (COMPLETE)
- 🔲 Task 1.2: Input validation edge cases
- 🔲 Task 1.3: Event emission integration
- 🔲 Task 1.4: Determinism testing (10-run verification)
- 🔲 Task 1.5: Integration with workflow orchestrator

## References

- Specification: `.claude/skills/workflow/plan/SKILL.md`
- Template: `.claude/skills/amcs-template/implementation.py`
- Contracts: `services/api/app/schemas/skill_contracts.py`
- Tests: `tests/unit/skills/test_plan_skill.py`
