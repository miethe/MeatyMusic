# Rubric Scoring Guide

## Overview

The Rubric Scorer is the quality evaluation engine for the MeatyMusic AMCS workflow. It measures how well generated artifacts (lyrics, style, producer notes) meet quality standards using 5 independent metrics, applies genre-specific weights, and checks threshold compliance.

The scorer is used by the VALIDATE workflow node to:
- Compute quality metrics
- Compare against genre blueprints
- Determine if artifacts pass quality gates
- Suggest improvements for the FIX node
- Track quality trends across runs

## Quick Start

```python
from app.services.rubric_scorer import RubricScorer
from app.services.blueprint_service import BlueprintService

# Initialize
blueprint_service = BlueprintService()
scorer = RubricScorer(blueprint_service)

# Score artifacts
score_report = scorer.score_artifacts(
    lyrics={
        "sections": [
            {"name": "verse", "lines": ["Line 1", "Line 2"]},
            {"name": "chorus", "lines": ["Chorus line"]},
        ]
    },
    style={"tags": ["upbeat", "catchy"]},
    producer_notes={"structure": "Verse-Chorus-Verse"},
    genre="pop",
    explicit_allowed=False
)

# Check compliance
decision, margin, suggestions = scorer.validate_thresholds(
    score_report=score_report,
    blueprint=blueprint_service.get_blueprint("pop")
)

print(f"Total Score: {score_report.total:.2f}")
print(f"Decision: {decision.value}")
print(f"Suggestions: {suggestions}")
```

## Metrics Explained

### 1. Hook Density (0.0-1.0)

**What it measures:** How memorable your song is through repeated phrases.

A "hook" is a memorable phrase or line that appears multiple times in the song. Hooks make songs catchy and easy to remember.

**Calculation:**
```
Hook Density = (# repeated lines) / (# total lines)

With chorus weighting:
- Chorus hook lines count as 1.5x
- Verse hook lines count as 1.0x
```

**Example:**
```
Song structure:
- Verse: "Lost in the moment", "Can't turn around"
- Chorus: "I'm falling for you" (repeated 3x)
- Verse: "Feel it inside", "Hold it right"
- Chorus: "I'm falling for you" (repeated 3x)

Calculation:
- Total lines: 8
- "I'm falling for you" appears in 2 chorus occurrences = 1.5x weight = 3.0 lines
- Hook density = 3.0 / 8 = 0.375
```

**How to improve:**
- Add memorable repeated phrases to the chorus
- Make chorus hooks shorter and punchier
- Repeat hook lines 2-3 times per chorus
- Use pre-chorus for additional hooks
- Condense and strengthen main melodies

**Target scores:**
- 0.7+ = Strong hook presence
- 0.5-0.7 = Moderate hook presence
- Below 0.5 = Weak hook presence (needs work)

### 2. Singability (0.0-1.0)

**What it measures:** How easy the lyrics are to sing and remember.

Singability depends on syllable consistency, word complexity, and line length patterns. Songs that are easy to sing are more memorable and engaging.

**Calculation:**
```
Singability = (Syllable Consistency × 0.4) +
              (Word Complexity × 0.3) +
              (Line Length Consistency × 0.3)

Where:
- Syllable Consistency: Low variance in syllables per line
- Word Complexity: Ratio of simple vs. complex words
- Line Length Consistency: Consistent character count per line
```

**Example:**
```
Good singability (similar syllables per line):
"I'm lost in the moment" (6 syllables)
"Can't find my way back home" (6 syllables)
"Feel your embrace tonight" (6 syllables)

Poor singability (inconsistent):
"I'm lost in the moment" (6 syllables)
"Can't find my way" (4 syllables)
"Feel your embrace tonight my love" (8 syllables)
```

**How to improve:**
- Aim for 8-12 syllables per line in verses
- Aim for 6-10 syllables per line in choruses
- Use simple, single-syllable words
- Avoid multi-syllable words (pneumonia, elephant, etc.)
- Keep lines similar length within sections
- Use repeating syllable patterns

**Target scores:**
- 0.7+ = Highly singable
- 0.5-0.7 = Moderately singable
- Below 0.5 = Difficult to sing (needs simplification)

### 3. Rhyme Tightness (0.0-1.0)

**What it measures:** How consistent and strong the rhyme scheme is.

A good rhyme scheme makes lyrics feel cohesive. Common schemes are AABB (couplets) or ABAB (alternating).

**Calculation:**
```
Rhyme Tightness = (# matched rhyme pairs) / (# expected rhyme pairs)

Expected rhymes = # lines / 2  (assumes every other line rhymes)
```

**Example:**
```
AABB scheme (strong):
"I'm falling for you" (A)
"Every single thing you do" (A)  ✓ Rhymes with line 1
"Looking in your eyes so true" (B)
"Wondering if you're falling too" (B)  ✓ Rhymes with line 3

Rhyme tightness = 2/2 = 1.0

Broken scheme (weak):
"I'm falling for you" (A)
"Every single night" (B)  ✗ No rhyme
"Looking in your eyes" (B)  ✓ Rhymes with line 2
"Wondering what's right" (B)

Rhyme tightness = 1/2 = 0.5
```

**How to improve:**
- Use end rhymes (last word of line rhymes)
- Match rhyme consistency (all AABB or all ABAB)
- Use true rhymes, not near-rhymes
- Avoid forced or awkward rhymes
- Use rhyming dictionaries to find alternatives
- Plan rhyme scheme before writing

**Target scores:**
- 0.7+ = Strong rhyme scheme
- 0.5-0.7 = Moderate rhymes present
- Below 0.5 = Inconsistent or missing rhymes

### 4. Section Completeness (0.0-1.0)

**What it measures:** Whether all required sections are present and properly formatted.

A complete song structure includes verses, chorus, and optional bridge. Each section needs minimum content.

**Calculation:**
```
Section Completeness = (# present required sections) / (# required sections)

Penalties:
- Missing section: -1 point per section
- Section with <2 lines: -0.1 per section
```

**Example:**
```
Pop song requirements: Verse, Chorus, Bridge

Present sections:
- Verse_1: 8 lines ✓
- Verse_2: 8 lines ✓
- Chorus: 4 lines ✓
- Bridge: 4 lines ✓

Section completeness = 4/3 = 1.0 (all required + extra)

Missing bridge:
- Verse_1: 8 lines ✓
- Verse_2: 8 lines ✓
- Chorus: 4 lines ✓
- Bridge: MISSING ✗

Section completeness = 2/3 = 0.67
```

**How to improve:**
- Ensure all required sections present
- Add minimum 2 lines per section
- Use blueprint requirements for genre
- Expand short sections (add lines)
- Include bridge for longer songs
- Pre-plan structure before writing

**Target scores:**
- 1.0 = All required sections complete
- 0.67 = 2 of 3 required sections
- Below 0.67 = Missing critical sections

### 5. Profanity Score (0.0-1.0)

**What it measures:** How clean the lyrics are (inverse of violations).

This score represents the percentage of lines without profanity. Higher scores mean cleaner content.

**Calculation:**
```
Profanity Score = 1.0 - (# violation lines / # total lines)

Examples:
- 0 violations in 20 lines = 1.0 (perfect)
- 2 violations in 20 lines = 0.9 (90% clean)
- 5 violations in 20 lines = 0.75 (75% clean)
- 10 violations in 20 lines = 0.5 (50% clean)
```

**Example:**
```
Lyrics:
"Verse 1 line 1" (clean)      ✓
"Verse 1 line 2" (clean)      ✓
"Can't wait to see you" (clean) ✓
"This damn good song" (violation) ✗
"Feel the beat" (clean)       ✓
"I'm so damn happy" (violation) ✗

Violations = 2/6 lines
Profanity Score = 1.0 - (2/6) = 0.67
```

**Explicit Content Flag:**
- If `explicit_allowed=True`: violations allowed
- If `explicit_allowed=False`: violations not allowed
- Severity levels matter: mild < moderate < strong < extreme

**How to improve:**
- Replace profanity with alternatives
- Use euphemisms or suggested replacements
- Remove unnecessary profanity
- Check profanity filter violations

**Target scores:**
- 1.0 = No profanity (clean)
- 0.9+ = Minimal violations
- 0.75-0.9 = Some violations
- Below 0.75 = Significant violations

## Weighted Scoring

### How Weights Work

The total score is a weighted average of the 5 metrics:

```
Total Score = (hook_density × weight_hook) +
              (singability × weight_sing) +
              (rhyme_tightness × weight_rhyme) +
              (section_completeness × weight_section) +
              (profanity_score × weight_profanity)

Where all weights sum to 1.0:
weight_hook + weight_sing + weight_rhyme + weight_section + weight_profanity = 1.0
```

### Default Weights (by Genre)

```
Pop (balanced across all metrics):
- hook_density: 0.25      (Catchy melodies matter)
- singability: 0.20       (Radio-friendly vocals)
- rhyme_tightness: 0.15   (Rhyme scheme important)
- section_completeness: 0.20  (Structure matters)
- profanity_score: 0.20   (Clean content preferred)
Total: 1.0

Country (storytelling focus):
- hook_density: 0.20      (Less emphasis on hooks)
- singability: 0.25       (Vocal quality important)
- rhyme_tightness: 0.25   (Strong narrative rhymes)
- section_completeness: 0.15  (Flexible structure)
- profanity_score: 0.15   (Narratively authentic)
Total: 1.0

Hip-hop (rhythm and flow):
- hook_density: 0.30      (Catchy hooks critical)
- singability: 0.10       (Less vocal consistency)
- rhyme_tightness: 0.30   (Tight rhymes essential)
- section_completeness: 0.15  (Section variety)
- profanity_score: 0.15   (Explicit content common)
Total: 1.0
```

### Example: Computing Total Score

```python
# Metrics
hook_density = 0.65
singability = 0.72
rhyme_tightness = 0.80
section_completeness = 1.0
profanity_score = 0.95

# Pop weights
weights = {
    "hook_density": 0.25,
    "singability": 0.20,
    "rhyme_tightness": 0.15,
    "section_completeness": 0.20,
    "profanity_score": 0.20
}

# Calculation
total = (0.65 * 0.25) + (0.72 * 0.20) + (0.80 * 0.15) +
        (1.0 * 0.20) + (0.95 * 0.20)
      = 0.1625 + 0.144 + 0.12 + 0.20 + 0.19
      = 0.7965

print(f"Total Score: {total:.2f}")  # 0.80
```

## Thresholds

### Threshold Types

**1. min_total** - Minimum composite score required

```
Default: 0.75

Interpretation:
- Score >= 0.75: PASS
- Score 0.70-0.75: BORDERLINE (within 5% margin)
- Score < 0.70: FAIL
```

**2. max_profanity** - Maximum allowed profanity violations

```
Default: 0.1 (10% of lines can have violations)

Interpretation:
- Violations <= 10%: PASS
- Violations 10-15%: BORDERLINE
- Violations > 15%: FAIL
```

### Threshold by Genre

```json
{
  "pop": {
    "min_total": 0.75,
    "max_profanity": 0.1
  },
  "country": {
    "min_total": 0.72,
    "max_profanity": 0.15
  },
  "hiphop": {
    "min_total": 0.75,
    "max_profanity": 0.25
  },
  "rock": {
    "min_total": 0.73,
    "max_profanity": 0.20
  }
}
```

### PASS, FAIL, BORDERLINE Decisions

```python
from app.services.rubric_scorer import ThresholdDecision

# PASS - Score well above threshold
if score >= (threshold + 0.05):
    decision = ThresholdDecision.PASS
    action = "Proceed to render"

# BORDERLINE - Within 5% of threshold
elif abs(score - threshold) <= 0.05:
    decision = ThresholdDecision.BORDERLINE
    action = "Trigger FIX loop to improve"

# FAIL - Below threshold
else:
    decision = ThresholdDecision.FAIL
    action = "Trigger FIX loop"
```

## Genre-Specific Tuning

### Adjusting Weights for Genre

Edit `/configs/rubric_overrides.json`:

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
    },
    "country": {
      "weights": {
        "hook_density": 0.20,
        "singability": 0.25,
        "rhyme_tightness": 0.25,
        "section_completeness": 0.15,
        "profanity_score": 0.15
      },
      "thresholds": {
        "min_total": 0.75,
        "max_profanity": 0.15
      }
    }
  }
}
```

### When to Adjust Weights

**Increase weight for metric if:**
- Genre emphasizes that quality
- Metric consistently low in good songs
- User feedback emphasizes importance

**Decrease weight for metric if:**
- Metric not relevant to genre
- Metric causes false failures
- Genre accepts lower scores

## Improvement Suggestions

The scorer provides actionable suggestions to fix low metrics:

```python
# After scoring
if not score_report.meets_threshold:
    suggestions = scorer.suggest_improvements(
        score_report=score_report,
        blueprint=blueprint
    )

    for suggestion in suggestions:
        print(f"- {suggestion}")
```

### Example Suggestions

**Low hook density:**
```
"Improve hook density by 0.10 (currently 0.65, target 0.75).
 Add more repeated phrases or strengthen chorus hooks."
```

**Low singability:**
```
"Improve singability by 0.15 (currently 0.60, target 0.75).
 Simplify phrasing, reduce complex words, or improve syllable consistency."
```

**Low rhyme tightness:**
```
"Improve rhyme tightness by 0.20 (currently 0.55, target 0.75).
 Tighten rhyme scheme or add more end rhymes."
```

**Missing sections:**
```
"Complete missing sections: bridge.
 Section completeness: 0.67. All required sections needed."
```

**Profanity violations:**
```
"Reduce profanity violations by 2 lines
 (currently 2/20 lines have violations, max allowed: 2).
 Remove or replace flagged content."
```

## Configuration

### Default Config Path

```
/configs/rubric_overrides.json
```

### Config Structure

```json
{
  "overrides": {
    "genre_name": {
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
  },
  "ab_tests": {
    "test_id": {
      "name": "Test description",
      "enabled": true,
      "genres": ["pop"],
      "overrides": {
        "weights": {
          "hook_density": 0.40
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

### Loading Custom Config

```python
scorer = RubricScorer(
    blueprint_service=blueprint_service,
    config_path="/path/to/rubric_overrides.json"
)
```

## A/B Testing

### Running an A/B Test

```json
{
  "ab_tests": {
    "test_001": {
      "name": "Higher hook density weight",
      "enabled": true,
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

### Analyzing Results

```python
# Track metrics before and after
baseline = {
    "mean_score": 0.75,
    "pass_rate": 0.85,
    "avg_hook_density": 0.65
}

test_variant = {
    "mean_score": 0.78,
    "pass_rate": 0.88,
    "avg_hook_density": 0.72
}

improvement = (test_variant["mean_score"] - baseline["mean_score"]) / baseline["mean_score"]
print(f"Score improvement: {improvement:.1%}")  # +4.0%
```

## Troubleshooting

### Issue: Score Below Threshold

**Symptoms:**
- Consistently failing validation
- "Score 0.70 below threshold 0.75"

**Diagnosis:**
```python
# Check individual metrics
print(f"Hook density: {score.hook_density:.2f}")
print(f"Singability: {score.singability:.2f}")
print(f"Rhyme tightness: {score.rhyme_tightness:.2f}")
print(f"Section completeness: {score.section_completeness:.2f}")
print(f"Profanity score: {score.profanity_score:.2f}")

# Find weakest metrics
metrics = {
    "hook_density": score.hook_density,
    "singability": score.singability,
    "rhyme_tightness": score.rhyme_tightness,
    "section_completeness": score.section_completeness,
    "profanity_score": score.profanity_score
}

weakest = min(metrics, key=metrics.get)
print(f"Weakest metric: {weakest} ({metrics[weakest]:.2f})")
```

**Solutions:**
1. Improve weakest metric using FIX loop
2. Lower threshold for genre
3. Adjust weights to deprioritize weak metric

### Issue: Threshold Too Strict

**Symptoms:**
- Artifacts should pass but don't
- Threshold settings unrealistic

**Solution:**
```json
{
  "overrides": {
    "pop": {
      "thresholds": {
        "min_total": 0.70,
        "max_profanity": 0.15
      }
    }
  }
}
```

### Issue: Weight Sum Invalid

**Symptoms:**
- "Config validation failed: weights_sum_invalid"
- Error loading configuration

**Solution:**
```json
{
  "overrides": {
    "pop": {
      "weights": {
        "hook_density": 0.25,      // Sum must be 1.0
        "singability": 0.20,
        "rhyme_tightness": 0.15,
        "section_completeness": 0.20,
        "profanity_score": 0.20    // 0.25+0.20+0.15+0.20+0.20 = 1.0
      }
    }
  }
}
```

## Best Practices

1. **Understand the metrics** - Know what each measures
2. **Use suggestions** - FIX node follows improvement guidance
3. **Genre-specific tuning** - Adjust weights for your genre
4. **Monitor trends** - Track scores across runs
5. **Test thresholds** - Find right balance of strict/lenient
6. **Document overrides** - Explain why you changed defaults

## See Also

- [Validation Service Guide](validation-service-guide.md) - Using the scorer
- [Policy Guards Guide](policy-guards-guide.md) - Profanity details
- [Determinism Validation Guide](determinism-validation-guide.md) - Reproducible scores
- [CLAUDE.md](../CLAUDE.md) - Project architecture
