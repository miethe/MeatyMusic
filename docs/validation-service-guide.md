# Validation Service Guide

## Overview

The Validation Service is the core validation engine for the MeatyMusic AMCS workflow. It provides comprehensive validation across three critical dimensions:

1. **Schema Validation** - Validates SDS and all entity specs against JSON schemas
2. **Tag Conflict Detection** - Detects and resolves conflicting style tags
3. **Policy Compliance** - Enforces profanity, PII, and artist normalization rules
4. **Rubric Scoring** - Evaluates artifacts against quality metrics

The service integrates all these components into a unified validation interface used by the VALIDATE and FIX workflow nodes.

## Architecture

### Component Diagram

```
ValidationService
├── Schema Validator (JSON Draft-07)
│   ├── SDS validation
│   ├── Style validation
│   ├── Lyrics validation
│   ├── Producer notes validation
│   └── Composed prompt validation
├── Conflict Detector
│   ├── Tag conflict detection
│   ├── Multiple resolution strategies
│   └── Detailed violation reports
├── Policy Guards
│   ├── Profanity Filter (with variation handling)
│   ├── PII Detector (email, phone, SSN, etc.)
│   └── Artist Normalizer (living artist references)
└── Rubric Scorer
    ├── 5 independent metrics
    ├── Genre-specific weights
    ├── Threshold validation
    └── Improvement suggestions
```

### Key Components

#### 1. Schema Validation

Validates all entities against JSON schemas located in `/schemas/`:
- **sds.schema.json** - Song Design Spec structure
- **style.schema.json** - Style entity with tags and metadata
- **lyrics.schema.json** - Lyrics with sections and lines
- **producer_notes.schema.json** - Producer arrangement notes
- **composed_prompt.schema.json** - Final composed prompt for rendering

Schemas use JSON Draft-07 with comprehensive error formatting.

#### 2. Tag Conflict Detection

Detects contradictory style tags using the conflict matrix from `/taxonomies/conflict_matrix.json`.

**Example conflicts:**
- "whisper" ↔ "anthemic" (vocal intensity contradiction)
- "minimalist" ↔ "orchestral" (instrumentation contradiction)
- "acoustic" ↔ "synth-heavy" (instrumentation contradiction)

Provides multiple resolution strategies for automatic remediation.

#### 3. Policy Guards

**Profanity Filter**
- Detects profanity across severity levels (mild, moderate, strong, extreme)
- Handles variations (leetspeak, spacing, masking)
- Whitelist support for context-aware filtering
- Returns structured violation reports with confidence scores

**PII Detector**
- Detects personally identifiable information (emails, phones, SSNs, credit cards, URLs, addresses, names)
- Automatic redaction to placeholders ([EMAIL], [PHONE], etc.)
- Confidence scoring for each detection
- Allowlist for safe terms (e.g., "Main Street")

**Artist Normalizer**
- Detects living artist references (e.g., "style of Taylor Swift")
- Normalizes to generic descriptions for public release compliance
- Multiple policy modes (strict, warn, permissive)
- Fuzzy matching for artist name variations

#### 4. Rubric Scorer

Computes 5 independent quality metrics:
- **hook_density** - Repeated phrases relative to total lines
- **singability** - Syllable consistency and word complexity
- **rhyme_tightness** - Rhyme scheme consistency
- **section_completeness** - Required sections present and formatted
- **profanity_score** - Percentage of clean lines (inverse of violations)

Applies genre-specific weights to compute weighted composite score and checks threshold compliance.

## Usage Guide

### Quick Start

```python
from app.services.validation_service import ValidationService

# Initialize
service = ValidationService()

# Validate SDS
is_valid, errors = service.validate_sds(sds_dict)
if not is_valid:
    print(f"SDS validation failed: {errors}")

# Validate tags for conflicts
is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
    tags=["whisper", "anthemic", "upbeat"],
    context="style",
    strategy="keep-first"
)
if not is_valid:
    print(f"Conflicts detected: {report['conflicts']}")
    print(f"Cleaned tags: {cleaned_tags}")

# Validate policies
is_valid, report = service.validate_all_policies(
    content={
        "style": "style of Taylor Swift",
        "lyrics": {"text": "Contact me at email@example.com"}
    },
    explicit_allowed=False,
    public_release=True
)

# Score artifacts
score_report = service.score_artifacts(
    lyrics=lyrics_dict,
    style=style_dict,
    producer_notes=producer_dict,
    genre="pop",
    explicit_allowed=False
)

# Evaluate compliance
passed, actionable_report = service.evaluate_compliance(
    score_report=score_report,
    genre="pop"
)
```

### Schema Validation

#### Validate SDS

```python
is_valid, errors = service.validate_sds({
    "title": "My Song",
    "genre": "pop",
    "bpm": 120,
    # ... other SDS fields
})

if is_valid:
    print("SDS is valid")
else:
    for error in errors:
        print(f"  - {error}")
```

#### Validate Individual Entities

```python
# Style validation
is_valid, errors = service.validate_style(style_dict)

# Lyrics validation
is_valid, errors = service.validate_lyrics(lyrics_dict)

# Producer notes validation
is_valid, errors = service.validate_producer_notes(producer_notes_dict)

# Composed prompt validation
is_valid, errors = service.validate_composed_prompt(composed_prompt_dict)
```

### Tag Conflict Validation

#### Detect Conflicts

```python
is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
    tags=["whisper", "anthemic", "upbeat"],
    context="style",
    strategy="keep-first"
)

print(f"Valid: {is_valid}")
print(f"Conflicts found: {report['conflict_count']}")
for conflict in report['conflicts']:
    print(f"  - {conflict['tag_a']} ↔ {conflict['tag_b']}")
    print(f"    Reason: {conflict['reason']}")
    print(f"    Category: {conflict['category']}")

print(f"Cleaned tags: {cleaned_tags}")
print(f"Removed: {report['removed_tags']}")
```

#### Resolution Strategies

```python
# Strategy 1: Keep-first (default)
# Keeps the first conflicting tag, removes later ones
cleaned = service.conflict_detector.resolve_conflicts(
    tags=["whisper", "anthemic", "upbeat"],
    strategy="keep-first"
)
# Result: ["whisper", "upbeat"]

# Strategy 2: Remove-lowest-priority
# Removes tags with lowest priority values
cleaned = service.conflict_detector.resolve_conflicts(
    tags=["whisper", "anthemic", "upbeat"],
    strategy="remove-lowest-priority",
    tag_priorities={
        "whisper": 0.5,
        "anthemic": 0.8,
        "upbeat": 0.6
    }
)
# Result: ["anthemic", "upbeat"]

# Strategy 3: Remove-highest-priority
# Removes tags with highest priority values (inverse)
cleaned = service.conflict_detector.resolve_conflicts(
    tags=["whisper", "anthemic", "upbeat"],
    strategy="remove-highest-priority",
    tag_priorities={
        "whisper": 0.5,
        "anthemic": 0.8,
        "upbeat": 0.6
    }
)
# Result: ["whisper", "upbeat"]
```

### Policy Validation

#### Profanity Validation

```python
is_valid, report = service.validate_profanity(
    text="Some lyrics text",
    explicit_allowed=False,
    context="lyrics"
)

print(f"Valid: {is_valid}")
print(f"Violations: {report['violation_count']}")
print(f"Profanity score: {report['profanity_score']:.2f}")

for violation in report['violations']:
    print(f"  - {violation['term']} (severity: {violation['severity']})")
    print(f"    Position: {violation['position']}")
    print(f"    Context: {violation['context']}")
```

#### PII Detection

```python
has_pii, redacted_text, report = service.validate_pii(
    text="Contact me at john@example.com or 555-123-4567",
    context="lyrics"
)

print(f"Has PII: {has_pii}")
print(f"Redacted: {redacted_text}")

for pii_item in report['pii_found']:
    print(f"  - Type: {pii_item['type']}")
    print(f"    Confidence: {pii_item['confidence']}")
    print(f"    Context: {pii_item['context']}")
```

#### Artist Reference Validation

```python
is_valid, normalized_text, report = service.validate_artist_references(
    text="style of Taylor Swift with catchy hooks",
    public_release=True,
    policy_mode="strict"
)

print(f"Valid: {is_valid}")
print(f"Normalized: {normalized_text}")

for reference in report['references']:
    print(f"  - Artist: {reference['artist_name']}")
    print(f"    Matched: {reference['matched_text']}")
    print(f"    Generic: {reference['generic_replacement']}")
```

#### All Policies at Once

```python
is_valid, report = service.validate_all_policies(
    content={
        "style": "style of Taylor Swift",
        "lyrics": {"text": "Contact me at email@example.com"},
        "producer_notes": "damn good track"
    },
    explicit_allowed=False,
    public_release=True,
    policy_mode="strict"
)

print(f"Valid: {is_valid}")
print(f"Total violations: {report['summary']['total_violations']}")
print(f"  - Profanity: {report['summary']['profanity_count']}")
print(f"  - PII: {report['summary']['pii_count']}")
print(f"  - Artist refs: {report['summary']['artist_reference_count']}")

print(f"Suggestions:")
for suggestion in report['suggestions']:
    print(f"  - {suggestion}")

print(f"Redacted content:")
for field, redacted in report['redacted_content'].items():
    print(f"  - {field}: {redacted}")

print(f"Normalized content:")
for field, normalized in report['normalized_content'].items():
    print(f"  - {field}: {normalized}")
```

### Rubric Scoring

#### Score Artifacts

```python
score_report = service.score_artifacts(
    lyrics=lyrics_dict,
    style=style_dict,
    producer_notes=producer_dict,
    genre="pop",
    explicit_allowed=False
)

print(f"Total Score: {score_report.total:.2f}")
print(f"Meets Threshold: {score_report.meets_threshold}")
print(f"Margin: {score_report.margin:.2f}")

print("\nMetrics:")
print(f"  - Hook Density: {score_report.hook_density:.2f}")
print(f"  - Singability: {score_report.singability:.2f}")
print(f"  - Rhyme Tightness: {score_report.rhyme_tightness:.2f}")
print(f"  - Section Completeness: {score_report.section_completeness:.2f}")
print(f"  - Profanity Score: {score_report.profanity_score:.2f}")

print("\nExplanations:")
for metric, explanation in score_report.explanations.items():
    print(f"  - {metric}: {explanation}")
```

#### Evaluate Compliance

```python
passed, actionable_report = service.evaluate_compliance(
    score_report=score_report,
    genre="pop"
)

print(f"Passed: {passed}")
print(f"Decision: {actionable_report.decision.value}")
print(f"Margin: {actionable_report.margin:.2f}")

if not passed and actionable_report.should_trigger_fix:
    print(f"\nShould trigger FIX loop")
    print(f"Fix targets:")
    for target in actionable_report.fix_targets:
        print(f"  - {target}")

    print(f"\nImprovement suggestions:")
    for suggestion in actionable_report.improvement_suggestions:
        print(f"  - {suggestion}")
```

## Integration Patterns

### VALIDATE Workflow Node

```python
async def validate_node(state):
    """VALIDATE workflow node."""

    # 1. Validate schema compliance
    sds_valid, sds_errors = service.validate_sds(state.sds)
    if not sds_valid:
        return {
            "validation_passed": False,
            "validation_error": f"SDS schema invalid: {sds_errors}"
        }

    # 2. Validate all policies
    policies_valid, policy_report = service.validate_all_policies(
        content={
            "style": state.style.to_dict(),
            "lyrics": state.lyrics.to_dict(),
            "producer_notes": state.producer_notes.to_dict()
        },
        explicit_allowed=state.sds.explicit_content,
        public_release=state.sds.public_release
    )

    if not policies_valid:
        return {
            "validation_passed": False,
            "validation_error": f"Policy violations: {policy_report['suggestions']}"
        }

    # 3. Score artifacts
    score_report = service.score_artifacts(
        lyrics=state.lyrics.to_dict(),
        style=state.style.to_dict(),
        producer_notes=state.producer_notes.to_dict(),
        genre=state.sds.genre,
        explicit_allowed=state.sds.explicit_content
    )

    # 4. Evaluate compliance
    passed, actionable_report = service.evaluate_compliance(
        score_report=score_report,
        genre=state.sds.genre
    )

    return {
        "validation_passed": passed,
        "score_report": score_report,
        "actionable_report": actionable_report,
        "should_fix": actionable_report.should_trigger_fix and not passed
    }
```

### FIX Workflow Node

```python
async def fix_node(state):
    """FIX workflow node - applies targeted improvements."""

    actionable_report = state.actionable_report

    # Apply fixes based on targets
    fixes = []

    if "hook_density" in actionable_report.fix_targets:
        # Add chorus hook lines
        state.lyrics = add_hook_lines(state.lyrics)
        fixes.append("Added hook density")

    if "profanity_score" in actionable_report.fix_targets:
        # Remove/replace profanity
        report = service.validate_profanity(
            text=state.lyrics.to_string(),
            explicit_allowed=state.sds.explicit_content
        )
        state.lyrics = remove_profanity(state.lyrics, report)
        fixes.append("Removed profanity")

    if "rhyme_tightness" in actionable_report.fix_targets:
        # Tighten rhyme scheme
        state.lyrics = improve_rhyme_scheme(state.lyrics)
        fixes.append("Improved rhyme scheme")

    return {
        "fixes_applied": fixes,
        "next_action": "revalidate"  # Will trigger another VALIDATE
    }
```

## Configuration

### Blueprint Overrides

Genre-specific weights and thresholds can be overridden via `/configs/rubric_overrides.json`:

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
        "min_total": 0.80,
        "max_profanity": 0.05
      }
    }
  },
  "ab_tests": {
    "test_001": {
      "name": "Higher hook density weight",
      "enabled": false,
      "genres": ["pop"],
      "overrides": {
        "weights": {
          "hook_density": 0.40,
          "singability": 0.15,
          "rhyme_tightness": 0.10,
          "section_completeness": 0.15,
          "profanity_score": 0.20
        }
      }
    }
  }
}
```

### Profanity Filter Configuration

Edit `/taxonomies/profanity_list.json`:

```json
{
  "categories": {
    "mild": ["damn", "hell"],
    "moderate": ["shit", "piss"],
    "strong": ["fuck", "cunt"],
    "extreme": [...]
  },
  "severity_weights": {
    "mild": 0.25,
    "moderate": 0.5,
    "strong": 0.75,
    "extreme": 1.0
  },
  "thresholds": {
    "clean": {
      "max_mild_count": 0,
      "max_moderate_count": 0,
      "max_strong_count": 0,
      "max_extreme_count": 0,
      "max_score": 0.0
    },
    "explicit": {
      "max_mild_count": -1,
      "max_moderate_count": -1,
      "max_strong_count": -1,
      "max_extreme_count": -1,
      "max_score": 1.0
    }
  },
  "whitelist": {
    "terms": ["assessment", "classic", "Scunthorpe"]
  },
  "variations": {
    "leetspeak_patterns": {
      "a": ["@", "4"],
      "e": ["3"],
      "i": ["!", "1"],
      "o": ["0"]
    }
  }
}
```

## Troubleshooting

### Issue: Schema Validation Fails

**Symptoms:**
- "SDS schema not loaded" error
- "Missing required field" errors

**Causes:**
1. Schema files missing from `/schemas/`
2. Schema path incorrect
3. Invalid JSON in schema files

**Solution:**
```bash
# Check schema directory exists
ls -la /home/user/MeatyMusic/schemas/

# Check schema file format
python -m json.tool /home/user/MeatyMusic/schemas/sds.schema.json

# Reinitialize service
service = ValidationService()
```

### Issue: Tag Conflicts Not Detected

**Symptoms:**
- Conflicting tags not caught
- Report shows "no conflicts"

**Causes:**
1. Conflict matrix not loaded
2. Tags not in conflict matrix
3. Tag names case sensitivity

**Solution:**
```python
# Check conflict matrix
print(service.conflict_detector.conflict_matrix_data)

# Reload conflict matrix
service.conflict_detector.reload_conflict_matrix()

# Verify tag capitalization
print(f"Looking for: {tag.lower()}")
```

### Issue: Profanity Not Detected

**Symptoms:**
- Profanity passes validation
- No violations reported

**Causes:**
1. Profanity list missing terms
2. Variation patterns not matching
3. Whitelisted terms blocking detection

**Solution:**
```python
# Test profanity detection directly
filter = service.profanity_filter
has_violations, violations = filter.detect_profanity(
    text="some damn text",
    explicit_allowed=False
)
print(f"Violations: {violations}")

# Check if term is in taxonomy
print(f"Categories: {filter.categories}")

# Check whitelist
print(f"Whitelist: {filter.whitelist}")
```

### Issue: PII Detection Has False Positives

**Symptoms:**
- Innocent text flagged as PII
- Email addresses flagged incorrectly

**Causes:**
1. Patterns too broad
2. Missing allowlist entries
3. Confidence threshold too low

**Solution:**
```python
# Check PII detection
detector = service.pii_detector
has_pii, violations = detector.detect_pii(
    text="Your company@example.com"
)
print(f"PII found: {violations}")

# Add to allowlist in pii_patterns.json
# Update validation config
detector.validation_config['min_confidence_threshold'] = 0.8
```

### Issue: Artist Normalization Not Working

**Symptoms:**
- Artist references not detected
- Normalization not applied

**Causes:**
1. Artist not in taxonomy
2. Pattern not matching
3. Fuzzy matching disabled

**Solution:**
```python
# Check artist index
normalizer = service.artist_normalizer
print(f"Artists: {normalizer._artist_index.keys()}")

# Check pattern matching
has_refs, refs = normalizer.detect_artist_references(
    text="style of Taylor Swift"
)
print(f"References: {refs}")

# Enable fuzzy matching in taxonomy
normalizer.fuzzy_config['enabled'] = True
```

### Issue: Score Below Threshold

**Symptoms:**
- "Score {score:.2f} below threshold {threshold:.2f}"
- Validation fails consistently

**Causes:**
1. Metrics are legitimately low
2. Thresholds too strict
3. Weights not reflecting importance

**Solution:**
```python
# Check individual metrics
print(f"Hook density: {score_report.hook_density:.2f}")
print(f"Singability: {score_report.singability:.2f}")
print(f"Rhyme tightness: {score_report.rhyme_tightness:.2f}")
print(f"Section completeness: {score_report.section_completeness:.2f}")
print(f"Profanity score: {score_report.profanity_score:.2f}")

# Apply override to threshold
overrides = {
    "pop": {
        "thresholds": {
            "min_total": 0.70  # Lower threshold
        }
    }
}

# Or adjust weights to deprioritize weak metrics
overrides = {
    "pop": {
        "weights": {
            "hook_density": 0.20,  # Lower from 0.25
            "singability": 0.20,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.20,
            "profanity_score": 0.25   # Higher from 0.20
        }
    }
}
```

## See Also

- [Determinism Validation Guide](determinism-validation-guide.md) - Ensuring reproducible outputs
- [Rubric Scoring Guide](rubric-scoring-guide.md) - Understanding the scoring metrics
- [Policy Guards Guide](policy-guards-guide.md) - Detailed policy enforcement
- [CLAUDE.md](../CLAUDE.md) - Project architecture and patterns
