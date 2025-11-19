# Rubric Integration Guide: VALIDATE and FIX Workflow Nodes

This guide documents how the rubric scoring system integrates with the VALIDATE and FIX workflow nodes in the AMCS pipeline.

## Overview

The rubric integration provides **automated quality scoring** and **actionable feedback** for song artifacts (lyrics, style, producer notes). It enforces genre-specific quality thresholds and generates targeted improvement suggestions for the FIX workflow node.

## Architecture

```
Workflow Flow:
LYRICS/STYLE/PRODUCER → COMPOSE → VALIDATE → [FIX]* → COMPOSE → VALIDATE → RENDER

Components:
- RubricScorer: Calculates 5 metrics + weighted composite score
- ValidationService: Orchestrates rubric scoring + threshold validation
- ActionableReport: Structured output for FIX node consumption
```

## Core Components

### 1. RubricScorer

**Location**: `services/api/app/services/rubric_scorer.py`

**Responsibilities**:
- Calculate 5 independent metrics (hook_density, singability, rhyme_tightness, section_completeness, profanity_score)
- Apply genre-specific weights from blueprints
- Compute weighted composite score
- Validate threshold compliance (min_total, max_profanity)
- Generate improvement suggestions

**Key Methods**:

```python
# Calculate all metrics and composite score
score_report = rubric_scorer.score_artifacts(
    lyrics=lyrics_dict,
    style=style_dict,
    producer_notes=producer_notes_dict,
    genre="pop",
    explicit_allowed=False,
    blueprint_version="latest"
)

# Validate thresholds and get decision
decision, margin, suggestions = rubric_scorer.validate_thresholds(
    score_report=score_report,
    blueprint=blueprint
)
```

### 2. ValidationService

**Location**: `services/api/app/services/validation_service.py`

**Responsibilities**:
- Provide high-level API for workflow nodes
- Orchestrate RubricScorer operations
- Build ActionableReport for FIX node
- Identify specific metrics that need improvement

**Key Methods**:

```python
# Score artifacts (wraps RubricScorer)
score_report = validation_service.score_artifacts(
    lyrics=lyrics,
    style=style,
    producer_notes=producer_notes,
    genre="pop",
    explicit_allowed=False
)

# Evaluate compliance and get actionable report
passed, actionable_report = validation_service.evaluate_compliance(
    score_report=score_report,
    genre="pop"
)
```

### 3. ActionableReport

**Dataclass**: Structured output for FIX node

```python
@dataclass
class ActionableReport:
    passed: bool                           # True if all thresholds met
    decision: ThresholdDecision           # PASS, FAIL, or BORDERLINE
    score_report: ScoreReport             # Full scoring details
    margin: float                          # Distance from threshold
    improvement_suggestions: List[str]     # Actionable suggestions
    should_trigger_fix: bool              # True if FIX should run
    fix_targets: List[str]                # Specific metrics to improve
```

## Threshold Validation

### ThresholdDecision Enum

- **PASS**: Score exceeds threshold with comfortable margin (>5%)
- **FAIL**: Score does not meet threshold
- **BORDERLINE**: Score meets threshold but within 5% margin (may fluctuate on retry)

### Threshold Logic

```python
# Extract thresholds from blueprint
min_total = blueprint.eval_rubric["thresholds"]["min_total"]  # e.g., 0.75
max_profanity = blueprint.eval_rubric["thresholds"]["max_profanity"]  # e.g., 0.1

# Calculate margins
total_margin = score_report.total - min_total
profanity_violation_ratio = 1.0 - score_report.profanity_score
profanity_margin = max_profanity - profanity_violation_ratio

# Determine decision
if total_passes and profanity_passes:
    if within_5_percent_of_threshold:
        decision = BORDERLINE  # Trigger FIX to improve margin
    else:
        decision = PASS
else:
    decision = FAIL  # Trigger FIX
```

## Workflow Integration Patterns

### VALIDATE Node Pattern

**Purpose**: Score artifacts and determine if FIX is needed

```python
def validate_node(artifacts: Dict[str, Any], sds: Dict[str, Any]) -> Dict[str, Any]:
    """VALIDATE workflow node implementation."""

    # Step 1: Score artifacts
    score_report = validation_service.score_artifacts(
        lyrics=artifacts["lyrics"],
        style=artifacts["style"],
        producer_notes=artifacts["producer_notes"],
        genre=sds["blueprint_ref"]["genre"],
        explicit_allowed=sds["constraints"]["explicit"]
    )

    # Step 2: Evaluate compliance
    passed, actionable_report = validation_service.evaluate_compliance(
        score_report=score_report,
        genre=sds["blueprint_ref"]["genre"]
    )

    # Step 3: Determine next action
    if passed:
        # All thresholds met - proceed to RENDER
        return {
            "status": "validated",
            "scores": score_report.to_dict(),
            "next_node": "RENDER"
        }

    elif actionable_report.should_trigger_fix:
        # Trigger FIX loop (max 3 iterations)
        return {
            "status": "needs_fix",
            "fix_targets": actionable_report.fix_targets,
            "improvement_suggestions": actionable_report.improvement_suggestions,
            "scores": score_report.to_dict(),
            "next_node": "FIX"
        }

    else:
        # Hard failure - cannot fix
        raise ValidationError(
            "Artifacts failed validation without fixable issues",
            scores=score_report.to_dict()
        )
```

### FIX Node Pattern

**Purpose**: Apply targeted improvements based on fix_targets

```python
def fix_node(
    artifacts: Dict[str, Any],
    fix_targets: List[str],
    suggestions: List[str],
    iteration: int
) -> Dict[str, Any]:
    """FIX workflow node implementation."""

    # Track applied fixes
    applied_fixes = []

    # Apply fixes based on targets
    for target in fix_targets:
        if target == "hook_density":
            # Duplicate/condense chorus hooks
            artifacts["lyrics"] = add_repeated_hooks(
                artifacts["lyrics"],
                suggestions=suggestions
            )
            applied_fixes.append("chorus_hook_duplication")

        elif target == "singability":
            # Simplify phrasing, reduce complex words
            artifacts["lyrics"] = simplify_lyrics(
                artifacts["lyrics"],
                suggestions=suggestions
            )
            applied_fixes.append("lyric_simplification")

        elif target == "rhyme_tightness":
            # Tighten rhyme scheme
            artifacts["lyrics"] = improve_rhyme_scheme(
                artifacts["lyrics"],
                suggestions=suggestions
            )
            applied_fixes.append("rhyme_scheme_adjustment")

        elif target == "section_completeness":
            # Add missing sections or expand lines
            artifacts["lyrics"] = complete_sections(
                artifacts["lyrics"],
                suggestions=suggestions
            )
            applied_fixes.append("section_completion")

        elif target == "profanity_score":
            # Remove profanity violations
            artifacts["lyrics"] = remove_profanity(
                artifacts["lyrics"],
                explicit_allowed=False
            )
            applied_fixes.append("profanity_removal")

    # Return to COMPOSE to regenerate composed_prompt
    return {
        "status": "fixed",
        "applied_fixes": applied_fixes,
        "iteration": iteration + 1,
        "artifacts": artifacts,
        "next_node": "COMPOSE"
    }
```

### Complete Workflow Integration

```python
def run_validation_fix_loop(
    artifacts: Dict[str, Any],
    sds: Dict[str, Any],
    max_fix_iterations: int = 3
) -> Dict[str, Any]:
    """Run VALIDATE → FIX loop with max iterations."""

    iteration = 0

    while iteration < max_fix_iterations:
        # VALIDATE
        score_report = validation_service.score_artifacts(
            lyrics=artifacts["lyrics"],
            style=artifacts["style"],
            producer_notes=artifacts["producer_notes"],
            genre=sds["blueprint_ref"]["genre"],
            explicit_allowed=sds["constraints"]["explicit"]
        )

        passed, actionable_report = validation_service.evaluate_compliance(
            score_report=score_report,
            genre=sds["blueprint_ref"]["genre"]
        )

        if passed:
            # Success - exit loop
            logger.info(
                "validation.passed",
                iteration=iteration,
                total_score=score_report.total,
                margin=actionable_report.margin
            )
            return {
                "status": "validated",
                "scores": score_report.to_dict(),
                "iterations": iteration
            }

        if not actionable_report.should_trigger_fix:
            # Hard failure - cannot fix
            raise ValidationError(
                f"Validation failed after {iteration} fix iterations",
                scores=score_report.to_dict(),
                suggestions=actionable_report.improvement_suggestions
            )

        # FIX
        logger.info(
            "validation.triggering_fix",
            iteration=iteration,
            fix_targets=actionable_report.fix_targets,
            suggestion_count=len(actionable_report.improvement_suggestions)
        )

        artifacts = fix_node(
            artifacts=artifacts,
            fix_targets=actionable_report.fix_targets,
            suggestions=actionable_report.improvement_suggestions,
            iteration=iteration
        )["artifacts"]

        iteration += 1

    # Max iterations reached - return best effort
    logger.warning(
        "validation.max_iterations_reached",
        iterations=max_fix_iterations,
        final_score=score_report.total
    )

    return {
        "status": "max_iterations_reached",
        "scores": score_report.to_dict(),
        "iterations": iteration,
        "artifacts": artifacts
    }
```

## Improvement Suggestions

The `suggest_improvements()` method generates actionable suggestions for each metric:

### Hook Density

```
"Improve hook density by 0.10 (currently 0.65, need 0.75). Add more repeated phrases or strengthen chorus hooks."
```

**Actions**:
- Duplicate chorus hook phrases
- Add repeated catchphrases in verses
- Condense core message into memorable phrase

### Singability

```
"Improve singability by 0.15 (currently 0.60, target 0.75). Simplify phrasing, reduce complex words, or improve syllable consistency."
```

**Actions**:
- Replace complex words with simpler alternatives
- Ensure syllable counts are consistent within sections
- Reduce line length variance

### Rhyme Tightness

```
"Improve rhyme tightness by 0.20 (currently 0.55, target 0.75). Tighten rhyme scheme or add more end rhymes."
```

**Actions**:
- Ensure AABB or ABAB rhyme patterns
- Strengthen end rhymes
- Add internal rhymes

### Section Completeness

```
"Complete missing sections: chorus. Section completeness: 0.50"
```

**Actions**:
- Add missing required sections (Verse, Chorus)
- Ensure minimum line counts per section
- Expand incomplete sections

### Profanity Score

```
"Reduce profanity violations by 3 lines (currently 3/20 lines have violations, max allowed: 2). Remove or replace flagged content."
```

**Actions**:
- Remove profanity words
- Replace with clean alternatives
- Adjust explicit_allowed flag if appropriate

## Determinism Guarantees

The rubric scoring system is **fully deterministic**:

1. **Metric Calculation**: All metrics use deterministic algorithms (no randomness)
2. **Weight Application**: Weights from blueprint are fixed per genre/version
3. **Threshold Validation**: Decision logic is purely mathematical
4. **Suggestion Generation**: Generated from fixed templates based on scores

**Same inputs → Same scores → Same decision → Same suggestions**

## Testing

Comprehensive tests in `test_validation_service.py`:

```python
# Test scoring
def test_score_artifacts_integration(service):
    score_report = service.score_artifacts(...)
    assert 0.0 <= score_report.total <= 1.0

# Test compliance evaluation
def test_evaluate_compliance_pass(service):
    passed, report = service.evaluate_compliance(...)
    assert passed == report.passed

# Test threshold decisions
def test_evaluate_compliance_borderline(service):
    passed, report = service.evaluate_compliance(...)
    assert report.decision in (PASS, FAIL, BORDERLINE)

# Test fix targets
def test_fix_targets_identification(service):
    passed, report = service.evaluate_compliance(...)
    assert all(t in valid_metrics for t in report.fix_targets)
```

## Logging

Structured logging at key points:

```python
# Score artifacts
logger.info("validation_service.score_artifacts_complete",
    genre=genre,
    total_score=score_report.total,
    meets_threshold=score_report.meets_threshold,
    margin=score_report.margin
)

# Threshold validation
logger.warning("threshold_validation.fail",
    total_score=score_report.total,
    min_total=min_total,
    total_margin=total_margin,
    suggestion_count=len(suggestions)
)

# Compliance evaluation
logger.info("validation_service.evaluate_compliance_complete",
    genre=genre,
    passed=passed,
    decision=decision.value,
    margin=margin,
    should_trigger_fix=should_trigger_fix,
    fix_target_count=len(fix_targets)
)
```

## Example Usage

### Simple Validation

```python
# Initialize service
validation_service = ValidationService()

# Score artifacts
score_report = validation_service.score_artifacts(
    lyrics={"sections": [...]},
    style={"tags": ["upbeat", "catchy"]},
    producer_notes={"structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus"},
    genre="pop",
    explicit_allowed=False
)

# Check compliance
passed, actionable_report = validation_service.evaluate_compliance(
    score_report=score_report,
    genre="pop"
)

if passed:
    print(f"✓ Validation passed! Score: {score_report.total:.2f}")
else:
    print(f"✗ Validation failed. Score: {score_report.total:.2f}")
    print(f"Margin: {actionable_report.margin:.2f}")
    print("\nFix targets:")
    for target in actionable_report.fix_targets:
        print(f"  - {target}")
    print("\nSuggestions:")
    for suggestion in actionable_report.improvement_suggestions:
        print(f"  - {suggestion}")
```

### Workflow Integration

```python
# In VALIDATE node
def validate_artifacts(artifacts, sds):
    service = ValidationService()

    # Score
    score_report = service.score_artifacts(
        lyrics=artifacts["lyrics"],
        style=artifacts["style"],
        producer_notes=artifacts["producer_notes"],
        genre=sds["blueprint_ref"]["genre"],
        explicit_allowed=sds["constraints"]["explicit"]
    )

    # Evaluate
    passed, actionable_report = service.evaluate_compliance(
        score_report=score_report,
        genre=sds["blueprint_ref"]["genre"]
    )

    # Return workflow decision
    return {
        "passed": passed,
        "should_trigger_fix": actionable_report.should_trigger_fix,
        "fix_targets": actionable_report.fix_targets,
        "suggestions": actionable_report.improvement_suggestions,
        "scores": score_report.to_dict()
    }
```

## Blueprint Configuration

Blueprints specify weights and thresholds in `eval_rubric`:

```json
{
  "genre": "Pop",
  "version": "2025.01",
  "eval_rubric": {
    "weights": {
      "hook_density": 0.25,
      "singability": 0.20,
      "rhyme_tightness": 0.15,
      "section_completeness": 0.20,
      "profanity_score": 0.20
    },
    "thresholds": {
      "min_total": 0.75,
      "max_profanity": 0.1
    }
  }
}
```

## Configuration and Tuning

### Overview

The rubric scoring system supports **configurable weights and thresholds** without code changes, enabling:
- Genre-specific tuning beyond blueprint defaults
- A/B testing different threshold values
- Runtime configuration updates
- Comprehensive logging for analysis

### Configuration File

**Location**: `/configs/rubric_overrides.json`

**Structure**:

```json
{
  "overrides": {
    "pop": {
      "weights": {
        "hook_density": 0.30,
        "singability": 0.20,
        "rhyme_tightness": 0.15,
        "section_completeness": 0.15,
        "profanity_score": 0.20
      },
      "thresholds": {
        "min_total": 0.75,
        "max_profanity": 0.10
      }
    },
    "hip-hop": {
      "weights": {
        "hook_density": 0.25,
        "singability": 0.15,
        "rhyme_tightness": 0.30,
        "section_completeness": 0.10,
        "profanity_score": 0.20
      },
      "thresholds": {
        "min_total": 0.70,
        "max_profanity": 0.20
      }
    }
  },
  "ab_tests": {
    "experiment_1": {
      "name": "Stricter Hook Density for Pop",
      "enabled": false,
      "genres": ["pop", "country"],
      "overrides": {
        "weights": {
          "hook_density": 0.35
        },
        "thresholds": {
          "min_total": 0.80
        }
      }
    }
  },
  "logging": {
    "log_threshold_decisions": true,
    "log_improvement_suggestions": true,
    "log_config_source": true,
    "log_ab_test_participation": true
  },
  "validation": {
    "require_weights_sum_to_one": true,
    "weight_sum_tolerance": 0.01,
    "require_all_metrics": true
  }
}
```

### Configuration Precedence

The system applies configuration in this order (highest to lowest precedence):

1. **A/B Test Overrides** (if enabled and genre matches)
2. **Genre-Specific Overrides** (from `overrides` section)
3. **Blueprint Defaults** (from blueprint `eval_rubric`)

**Example**:

```python
# Blueprint has: hook_density = 0.25
# Override has: hook_density = 0.30
# A/B test has: hook_density = 0.35 (enabled for "pop")

# For genre "pop": Uses 0.35 (A/B test wins)
# For genre "rock": Uses 0.25 (blueprint default, no override)
# For genre "country": Uses override if present, else blueprint
```

### Genre-Specific Overrides

To override weights or thresholds for a specific genre:

```json
{
  "overrides": {
    "country": {
      "weights": {
        "hook_density": 0.25,
        "singability": 0.25,
        "rhyme_tightness": 0.20,
        "section_completeness": 0.15,
        "profanity_score": 0.15
      },
      "thresholds": {
        "min_total": 0.75,
        "max_profanity": 0.05
      }
    }
  }
}
```

**Rules**:
- Weights must sum to 1.0 (within tolerance)
- All required metrics must be present
- Values must be in range [0.0, 1.0]
- Genre names are case-insensitive

### A/B Testing

To run experiments comparing different thresholds:

```json
{
  "ab_tests": {
    "stricter_hooks": {
      "name": "Test Stricter Hook Requirements",
      "description": "Evaluate if higher hook density improves chart performance",
      "enabled": true,
      "genres": ["pop", "rock"],
      "overrides": {
        "weights": {
          "hook_density": 0.40
        },
        "thresholds": {
          "min_total": 0.80
        }
      }
    }
  }
}
```

**Workflow**:
1. Set `enabled: true` to activate test
2. System logs A/B test participation
3. Overrides apply only to matching genres
4. Only first matching test is applied
5. Analyze logs to compare performance

**Example Log Output**:

```
rubric_scorer.ab_test_applied
  test_id: stricter_hooks
  test_name: Test Stricter Hook Requirements
  genre: pop
  weight_overrides: {"hook_density": 0.40}
  threshold_overrides: {"min_total": 0.80}
```

### Configuration Validation

The system validates configurations on load:

**Checks**:
- ✓ Weights sum to 1.0 (within tolerance)
- ✓ All required metrics present
- ✓ Weight values in range [0.0, 1.0]
- ✓ Threshold values in range [0.0, 1.0]
- ✓ A/B test structure valid

**Invalid Configuration Example**:

```json
{
  "overrides": {
    "pop": {
      "weights": {
        "hook_density": 0.50,
        "singability": 0.30,
        "rhyme_tightness": 0.30
      }
    }
  }
}
```

**Result**: Config rejected (weights sum to 1.10, not 1.0)

### Enhanced Logging

The configuration system logs all decisions for analysis:

**Threshold Decisions**:

```python
logger.info("threshold_validation.pass",
    genre="pop",
    decision="pass",
    total_score=0.82,
    min_total=0.75,
    margin=0.07,
    weights_source="override",
    thresholds_source="blueprint"
)
```

**Weight Resolution**:

```python
logger.debug("rubric_scorer.weights_resolved",
    genre="pop",
    source="ab_test",
    weights={"hook_density": 0.35, ...},
    ab_test_applied=True
)
```

**Improvement Suggestions**:

```python
logger.debug("improvements.suggested",
    genre="pop",
    suggestion_count=3,
    total_score=0.72,
    weights_applied={...},
    suggestions=[...]
)
```

### Using Custom Configuration

**Default Behavior** (uses `/configs/rubric_overrides.json`):

```python
validation_service = ValidationService()
# Automatically loads default config if present
```

**Custom Config Path**:

```python
# Create custom RubricScorer with specific config
scorer = RubricScorer(
    blueprint_service=blueprint_service,
    profanity_filter=profanity_filter,
    config_path="/path/to/custom_config.json"
)

# Use in ValidationService
validation_service = ValidationService(blueprint_service=blueprint_service)
validation_service.rubric_scorer = scorer
```

### Configuration Hot Reload

To update configuration without restarting:

1. Edit `/configs/rubric_overrides.json`
2. Create new `ValidationService` instance (loads fresh config)
3. Configuration changes apply immediately to new scorers

**Example**:

```python
# Before: Using old thresholds
service_old = ValidationService()

# Edit config file: Increase min_total from 0.75 to 0.80

# After: New instance uses updated thresholds
service_new = ValidationService()
```

### Genre-Specific Tuning Guide

**Pop**:
- High hook density (catchy, memorable)
- Moderate singability (accessible)
- Lower profanity tolerance

**Hip-Hop**:
- High rhyme tightness (lyrical focus)
- Lower singability requirements (complex wordplay)
- Higher profanity tolerance

**Country**:
- High singability (storytelling clarity)
- Balanced hook and rhyme
- Very low profanity tolerance

**Rock**:
- High hook density (anthemic choruses)
- Moderate rhyme requirements
- Moderate profanity tolerance

### Best Practices

1. **Start with Blueprint Defaults**: Only override when needed
2. **Test A/B Changes**: Use A/B tests before permanent changes
3. **Monitor Logs**: Track configuration source in threshold decisions
4. **Validate Weights**: Ensure weights sum to 1.0
5. **Document Changes**: Add descriptions to A/B test configs
6. **Gradual Tuning**: Adjust thresholds by ≤0.05 increments
7. **Genre Consistency**: Keep similar genres aligned

### Troubleshooting

**Config Not Loading**:

```
rubric_scorer.config_not_found
  path: /configs/rubric_overrides.json
  message: Override config not found, using blueprint defaults
```

**Solution**: Verify config file exists and path is correct

**Config Validation Failed**:

```
rubric_scorer.config_validation_failed
  genre: pop
  reason: weights_sum_invalid
  weight_sum: 1.15
  expected: 1.0
```

**Solution**: Adjust weights to sum to 1.0

**A/B Test Not Applied**:

```
rubric_scorer.ab_test_applied
  (no log output)
```

**Solution**: Check `enabled: true` and genre matches test criteria

### Testing Configuration

**Test Override Loading**:

```python
def test_config_override():
    """Verify override precedence."""
    scorer = RubricScorer(
        blueprint_service=blueprint_service,
        config_path="configs/rubric_overrides.json"
    )

    weights = scorer._get_weights("pop", blueprint)

    # Should use override value, not blueprint
    assert weights["hook_density"] == 0.30  # Override
    assert blueprint.eval_rubric["weights"]["hook_density"] == 0.25  # Blueprint
```

**Test A/B Test Application**:

```python
def test_ab_test_enabled():
    """Verify A/B test applies to matching genre."""
    scorer = RubricScorer(
        blueprint_service=blueprint_service,
        config_path="configs/rubric_overrides.json"
    )

    # Enable test in config
    scorer.ab_tests["experiment_1"]["enabled"] = True

    weights = scorer._get_weights("pop", blueprint)

    # Should use A/B test value
    assert weights["hook_density"] == 0.35  # A/B test
```

## Error Handling

```python
try:
    score_report = validation_service.score_artifacts(...)
except NotFoundError:
    # Blueprint not found for genre
    logger.error("Blueprint not found", genre=genre)
    raise

try:
    passed, report = validation_service.evaluate_compliance(...)
except Exception as e:
    # Unexpected error during validation
    logger.error("Validation error", error=str(e), exc_info=True)
    raise
```

## Performance Considerations

- **Caching**: Blueprints are cached in BlueprintService
- **Lazy Loading**: Profanity filter and other components initialized once
- **No External Calls**: All calculations are local (no API calls)
- **Deterministic**: No retries or randomness

**Expected Latency**: <100ms for typical song artifacts

## Future Enhancements

1. **Custom Metric Weights**: Allow per-song weight overrides
2. **Dynamic Thresholds**: Adjust thresholds based on genre confidence
3. **Multi-Genre Scoring**: Score against multiple blueprints simultaneously
4. **Trend Analysis**: Track metric improvements across FIX iterations
5. **Confidence Scores**: Add confidence intervals to metric scores

---

**Last Updated**: 2025-11-19
**Version**: 1.1
**Authors**: AMCS Team

**Changelog**:
- v1.1 (2025-11-19): Added configuration and A/B testing support
- v1.0 (2025-11-19): Initial rubric integration documentation
