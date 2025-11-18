# Blueprint - JSON Specification

## Overview

A **Blueprint** is the algorithmic template for generating hit songs in a given genre. It defines strict rules (tempo ranges, required sections, banned terms, lexicon) and a scoring rubric (weights and thresholds for evaluation metrics). Blueprints ensure that outputs adhere to genre conventions and help the validator score and auto-fix drafts.

## Schema

### Field: `genre`
- **Type**: `string`
- **Description**: Name of the genre (e.g., "Christmas Pop", "Hip-Hop", "Country").
- **Required**: Yes
- **Constraints**: Non-empty string

### Field: `version`
- **Type**: `string`
- **Description**: Version identifier enabling updates over time (e.g., "2025.11").
- **Required**: Yes
- **Constraints**: Non-empty string

### Field: `rules`
- **Type**: `object`
- **Description**: Container for all algorithmic rules governing the genre.
- **Required**: Yes
- **Constraints**: Must contain all sub-properties

#### Field: `rules.tempo_bpm`
- **Type**: `array` of two `integer` values
- **Description**: Allowed BPM range for the genre. First element is minimum, second is maximum.
- **Required**: Yes
- **Constraints**: Exactly 2 integers; first ≤ second (e.g., [100, 130])

#### Field: `rules.required_sections`
- **Type**: `array` of `string`
- **Description**: Sections that must appear in the song (e.g., "Verse", "Chorus", "Bridge").
- **Required**: Yes
- **Constraints**: Non-empty array; each element is a section name

#### Field: `rules.banned_terms`
- **Type**: `array` of `string`
- **Description**: Words or phrases forbidden in lyrics. Profanity filter references this list.
- **Required**: No
- **Constraints**: Array of terms to exclude

#### Field: `rules.lexicon_positive`
- **Type**: `array` of `string`
- **Description**: Terms that should appear in lyrics to capture genre flavor (e.g., "snow", "holly" for Christmas Pop).
- **Required**: No
- **Constraints**: Array of encouraged terms

#### Field: `rules.lexicon_negative`
- **Type**: `array` of `string`
- **Description**: Terms to avoid because they clash with the genre aesthetic.
- **Required**: No
- **Constraints**: Array of discouraged terms

#### Field: `rules.section_lines`
- **Type**: `object` (properties: section names with min/max line counts)
- **Description**: Per-section line count guidance. Each section contains `min` and `max` properties.
- **Required**: No
- **Constraints**: Keys are section names (must match `required_sections`); each has `{"min": integer, "max": integer}`

### Field: `eval_rubric`
- **Type**: `object`
- **Description**: Container for evaluation scoring configuration.
- **Required**: Yes
- **Constraints**: Must contain `weights` and `thresholds` sub-objects

#### Field: `eval_rubric.weights`
- **Type**: `object`
- **Description**: Weights for each scoring category. Values sum to 1.0.
- **Required**: Yes
- **Constraints**: All values must sum to exactly 1.0

##### Field: `eval_rubric.weights.hook_density`
- **Type**: `number`
- **Description**: Weight for hook density scoring (0.0-1.0).
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

##### Field: `eval_rubric.weights.singability`
- **Type**: `number`
- **Description**: Weight for singability scoring (0.0-1.0).
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

##### Field: `eval_rubric.weights.rhyme_tightness`
- **Type**: `number`
- **Description**: Weight for rhyme quality and tightness scoring (0.0-1.0).
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

##### Field: `eval_rubric.weights.section_completeness`
- **Type**: `number`
- **Description**: Weight for section structure and completeness scoring (0.0-1.0).
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

##### Field: `eval_rubric.weights.profanity_score`
- **Type**: `number`
- **Description**: Weight for profanity and policy compliance scoring (0.0-1.0).
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

#### Field: `eval_rubric.thresholds`
- **Type**: `object`
- **Description**: Pass/fail thresholds for validation.
- **Required**: Yes
- **Constraints**: Must contain `min_total` and `max_profanity`

##### Field: `eval_rubric.thresholds.min_total`
- **Type**: `number`
- **Description**: Minimum passing score. Songs below this threshold trigger auto-fix routine.
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

##### Field: `eval_rubric.thresholds.max_profanity`
- **Type**: `number`
- **Description**: Maximum allowed profanity score. Violations trigger auto-fix.
- **Required**: Yes
- **Constraints**: 0.0 ≤ value ≤ 1.0

## Example

```json
{
  "genre": "Christmas Pop",
  "version": "2025.11",
  "rules": {
    "tempo_bpm": [100, 130],
    "required_sections": ["Verse", "Chorus", "Bridge"],
    "banned_terms": ["explicit expletives", "dark imagery"],
    "lexicon_positive": ["snow", "holly", "mistletoe", "jingle", "sparkle", "warmth"],
    "lexicon_negative": ["sadness", "pain", "darkness", "sorrow"],
    "section_lines": {
      "Verse": {
        "min": 8,
        "max": 16
      },
      "Chorus": {
        "min": 6,
        "max": 10
      },
      "Bridge": {
        "min": 4,
        "max": 8
      }
    }
  },
  "eval_rubric": {
    "weights": {
      "hook_density": 0.25,
      "singability": 0.25,
      "rhyme_tightness": 0.20,
      "section_completeness": 0.20,
      "profanity_score": 0.10
    },
    "thresholds": {
      "min_total": 0.85,
      "max_profanity": 0.05
    }
  }
}
```
