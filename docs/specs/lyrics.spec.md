# Lyrics - JSON Specification

## Overview

The **Lyrics** entity defines the textual content of a song along with structural and stylistic constraints. It captures song sections (intro, verse, chorus, bridge, outro), rhyme scheme, meter, syllable targets, point of view, tense, hook strategy, and repetition policy. It includes external source citations with weighted contributions for retrieval-augmented generation and policies for explicit content.

## Schema

### Field: `language`
- **Type**: `string`
- **Description**: The language of the lyrics. Uses ISO 639-1 codes (e.g., "en" for English, "es" for Spanish).
- **Required**: Yes
- **Constraints**: Default is "en"; typical values are ISO 639-1 codes

### Field: `pov`
- **Type**: `string` (enum)
- **Description**: Point of view perspective for the lyrics. Influences pronoun usage and narrative perspective.
- **Required**: No
- **Constraints**: Must be one of: "1st" (I/we), "2nd" (you), "3rd" (he/she/they)

### Field: `tense`
- **Type**: `string` (enum)
- **Description**: Verb tense used throughout the song for narrative consistency.
- **Required**: No
- **Constraints**: Must be one of: "past", "present", "future", "mixed"

### Field: `themes`
- **Type**: `array` of `string`
- **Description**: List of narrative themes or subject matter for the song (e.g., "holiday hustle", "family", "heartbreak").
- **Required**: No
- **Constraints**: Array of thematic tags; no length limits specified

### Field: `rhyme_scheme`
- **Type**: `string`
- **Description**: Structure of end rhymes defining the rhyming pattern across lines (e.g., "AABB", "ABAB", "AAA").
- **Required**: No
- **Constraints**: Standard rhyme scheme notation; no predefined enum

### Field: `meter`
- **Type**: `string`
- **Description**: Rhythmic time feel or meter of the song to maintain singable flow (e.g., "4/4 pop", "6/8 ballad").
- **Required**: No
- **Constraints**: Common music time signatures; examples include 4/4, 6/8, 3/4

### Field: `syllables_per_line`
- **Type**: `integer`
- **Description**: Target number of syllables per line for the lyrics. Used by evaluators to assess singability.
- **Required**: No
- **Constraints**: Must be within range 4–16; lines deviating from target are flagged for revision

### Field: `hook_strategy`
- **Type**: `string` (enum)
- **Description**: Approach to creating memorable hooks or catchiest parts of the song.
- **Required**: No
- **Constraints**: Must be one of: "melodic" (hook relies on melody), "lyrical" (memorable words/phrases), "call-response" (call-and-response pattern), "chant" (repeated chant-like elements)

### Field: `repetition_policy`
- **Type**: `string` (enum)
- **Description**: Determines how frequently phrases and sections repeat throughout the song.
- **Required**: No
- **Constraints**: Must be one of: "sparse" (minimal repetition), "moderate" (balanced repetition), "hook-heavy" (emphasis on repeated choruses)

### Field: `imagery_density`
- **Type**: `number`
- **Description**: Controls how metaphorical and descriptive the lyrics should be. Lower values produce straightforward lyrics; higher values yield more poetic and vivid content.
- **Required**: No
- **Constraints**: Must be between 0 and 1 (inclusive)

### Field: `reading_level`
- **Type**: `string`
- **Description**: Approximate reading difficulty level for the lyrics to match target audience literacy (e.g., "grade 4", "grade 10", "college").
- **Required**: No
- **Constraints**: No predefined enum; examples use grade levels or descriptive terms

### Field: `section_order`
- **Type**: `array` of `string`
- **Description**: Ordered list of song sections defining the structure (e.g., ["Intro", "Verse", "PreChorus", "Chorus", "Bridge", "Outro"]). Determines the sequence and flow of sections.
- **Required**: Yes
- **Constraints**: Must contain at least one "Chorus" section; if hook_strategy is "lyrical" or "chant", require at least two chorus sections

### Field: `constraints`
- **Type**: `object`
- **Description**: Container for global and per-section constraints on the lyrics.
- **Required**: Yes
- **Constraints**: Must include nested `explicit` and `section_requirements` properties

### Field: `constraints.explicit`
- **Type**: `boolean`
- **Description**: Indicates whether explicit (profanity-containing) content is allowed in the lyrics.
- **Required**: No (in constraints)
- **Constraints**: Default is `false`; if false, profanity is filtered or replaced

### Field: `constraints.max_lines`
- **Type**: `integer`
- **Description**: Maximum total number of lines across all song sections combined.
- **Required**: No (in constraints)
- **Constraints**: Positive integer; used to enforce length limits

### Field: `constraints.section_requirements`
- **Type**: `object` (dynamic properties)
- **Description**: Per-section configuration specifying minimum/maximum lines and hook requirements. Keys are section names (e.g., "Chorus", "Verse").
- **Required**: No (in constraints)
- **Constraints**: Each section entry contains min_lines, max_lines, and must_end_with_hook

### Field: `constraints.section_requirements[section_name].min_lines`
- **Type**: `integer`
- **Description**: Minimum number of lines required for this section.
- **Required**: No
- **Constraints**: Non-negative integer

### Field: `constraints.section_requirements[section_name].max_lines`
- **Type**: `integer`
- **Description**: Maximum number of lines allowed for this section.
- **Required**: No
- **Constraints**: Non-negative integer; must be >= min_lines if both specified

### Field: `constraints.section_requirements[section_name].must_end_with_hook`
- **Type**: `boolean`
- **Description**: Indicates whether this section must end with a hook or memorable phrase.
- **Required**: No
- **Constraints**: Useful for enforcing hook placement in chorus sections

### Field: `source_citations`
- **Type**: `array` of `object`
- **Description**: External sources used for retrieval-augmented generation of lyrics. Each entry includes a source identifier and relative weight.
- **Required**: No
- **Constraints**: Weights should sum to 1.0 or less; unspecified weights default to equal distribution

### Field: `source_citations[].source_id`
- **Type**: `string`
- **Description**: Unique identifier for an external source (e.g., UUID, API reference, document ID).
- **Required**: Yes (if source_citations is present)
- **Constraints**: Non-empty string; typically a UUID or versioned identifier

### Field: `source_citations[].weight`
- **Type**: `number`
- **Description**: Relative weight or influence of this source (0–1). Higher values indicate greater contribution to the generated lyrics.
- **Required**: No
- **Constraints**: Must be between 0 and 1 (inclusive); collection should sum to ≤1.0

## Example

```json
{
  "language": "en",
  "pov": "1st",
  "tense": "present",
  "themes": ["holiday hustle", "family", "joy"],
  "rhyme_scheme": "AABB",
  "meter": "4/4 pop",
  "syllables_per_line": 8,
  "hook_strategy": "chant",
  "repetition_policy": "hook-heavy",
  "imagery_density": 0.6,
  "reading_level": "grade 6",
  "section_order": [
    "Intro",
    "Verse",
    "PreChorus",
    "Chorus",
    "Verse",
    "PreChorus",
    "Chorus",
    "Bridge",
    "Chorus",
    "Outro"
  ],
  "constraints": {
    "explicit": false,
    "max_lines": 120,
    "section_requirements": {
      "Chorus": {
        "min_lines": 6,
        "max_lines": 10,
        "must_end_with_hook": true
      },
      "Verse": {
        "min_lines": 4,
        "max_lines": 8,
        "must_end_with_hook": false
      },
      "Bridge": {
        "min_lines": 4,
        "max_lines": 8,
        "must_end_with_hook": false
      }
    }
  },
  "source_citations": [
    {
      "source_id": "family-doc-uuid-12345",
      "weight": 0.6
    },
    {
      "source_id": "asoiaf-api-uuid-67890",
      "weight": 0.4
    }
  ]
}
```

## Validation Rules

1. **Section Requirements**: `section_order` must contain at least one "Chorus" section. If hook_strategy is "lyrical" or "chant", at least two chorus sections are required.

2. **Source Weights**: `source_citations.weight` values must sum to 1.0 or less; unspecified weights default to equal distribution.

3. **Hook-Heavy Constraint**: If `repetition_policy` is "hook-heavy", the chorus `min_lines` must be ≥ 6 lines.

4. **Profanity Filtering**: When `explicit` is false, profanity is filtered or replaced to maintain content appropriateness.

5. **Syllable Validity**: `syllables_per_line` must be within range 4–16. Lines deviating from the target are flagged for revision during evaluation.
