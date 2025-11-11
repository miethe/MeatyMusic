# PRD – Lyrics Entity

## 1. Purpose

The **Lyrics** entity defines the textual content of a song along with structural and stylistic constraints.  It captures sections (intro, verse, chorus, bridge, outro), rhyme scheme, meter, syllable targets, point of view, tense, hook strategy, repetition policy, imagery density, reading level and explicit content settings.  It also records which external sources contributed to the lyrics and their relative weights.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/lyrics-1.0.json",
  "type": "object",
  "required": ["language", "section_order", "constraints"],
  "properties": {
    "language": {"type": "string", "default": "en"},
    "pov": {"type": "string", "enum": ["1st", "2nd", "3rd"]},
    "tense": {"type": "string", "enum": ["past", "present", "future", "mixed"]},
    "themes": {"type": "array", "items": {"type": "string"}},
    "rhyme_scheme": {"type": "string"},
    "meter": {"type": "string"},
    "syllables_per_line": {"type": "integer"},
    "hook_strategy": {"type": "string", "enum": ["melodic", "lyrical", "call-response", "chant"]},
    "repetition_policy": {"type": "string", "enum": ["sparse", "moderate", "hook-heavy"]},
    "imagery_density": {"type": "number", "minimum": 0, "maximum": 1},
    "reading_level": {"type": "string"},
    "section_order": {"type": "array", "items": {"type": "string"}},
    "constraints": {
      "type": "object",
      "properties": {
        "explicit": {"type": "boolean", "default": false},
        "max_lines": {"type": "integer"},
        "section_requirements": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "min_lines": {"type": "integer"},
              "max_lines": {"type": "integer"},
              "must_end_with_hook": {"type": "boolean"}
            }
          }
        }
      }
    },
    "source_citations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "source_id": {"type": "string"},
          "weight": {"type": "number", "minimum": 0, "maximum": 1}
        }
      }
    }
  }
}
```

## 3. Field Descriptions

* **language** – The language of the lyrics (e.g., `en`, `es`).  Default is English.
* **pov** – Point of view: 1st (I/we), 2nd (you) or 3rd (he/she/they).  Influences pronoun usage and perspective.
* **tense** – Verb tense used in the song (past, present, future or mixed).
* **themes** – List of narrative themes (e.g., *holiday hustle*, *family*, *heartbreak*).
* **rhyme_scheme** – Structure of end rhymes (e.g., `AABB`, `ABAB`, `AAA`).
* **meter** – Meter or time feel (e.g., `4/4 pop`, `6/8 ballad`).  Helps maintain rhythmic flow.
* **syllables_per_line** – Target number of syllables per line.  Used by evaluators for singability.
* **hook_strategy** – Approach to creating hooks: melodic, lyrical, call‑and‑response or chant.
* **repetition_policy** – Determines how often phrases repeat.  `hook-heavy` emphasises repeated choruses, while `sparse` minimises repetition.
* **imagery_density** – A number between 0 and 1 indicating how metaphorical or descriptive the lyrics should be; higher values encourage vivid imagery.
* **reading_level** – Approximate reading difficulty (e.g., *grade 4* or *college*).  Allows matching target audiences.
* **section_order** – Ordered list of song sections (e.g., `["Intro", "Verse", "PreChorus", "Chorus", "Bridge", "Chorus"]`).  All songs must include at least one `Chorus`.
* **constraints.explicit** – Indicates whether explicit content is allowed.  If `false`, profanity is removed or replaced.
* **constraints.max_lines** – Maximum total lines across all sections.
* **constraints.section_requirements** – Per‑section minimum and maximum lines and whether the section must end with a hook (useful for chorus).
* **source_citations** – List of external sources used for retrieval‑augmented lyrics generation.  Each entry has a `source_id` and a `weight` (0–1).  Weights allow balancing contributions from multiple sources.

## 4. Validation Rules

* `section_order` must contain at least one `Chorus`.  If the hook strategy is `lyrical` or `chant`, require at least two chorus sections.
* `source_citations.weight` values must sum to 1.0 or less; unspecified weights default to equal distribution.
* If `repetition_policy = hook-heavy`, the chorus `min_lines` must be ≥ 6 lines.
* `explicit = false` triggers a profanity filter.  Offending words are replaced or removed.
* `syllables_per_line` must be within a reasonable range (4–16).  Lines that deviate are flagged for revision.

## 5. UI Controls & Hints

* Provide separate text areas for each section (verse, chorus, bridge).  Collapsible panels allow users to focus on one section at a time.
* Use dropdowns or radio controls for `pov`, `tense`, `hook_strategy` and `repetition_policy`.
* Offer a slider for `imagery_density`.  A lower value produces simple, straightforward lyrics; a higher value yields more poetic content.
* Visualise syllable counts per line with a live counter next to each line.  Highlight lines that deviate from the target.
* Provide a list of sources with checkboxes and weight sliders.  For example, the user might combine a family document (weight 0.6) with information from an API like *An API of Ice and Fire* (weight 0.4).

## 6. Example

```json
{
  "language": "en",
  "pov": "1st",
  "tense": "present",
  "themes": ["holiday hustle", "family"],
  "rhyme_scheme": "AABB",
  "meter": "4/4 pop",
  "syllables_per_line": 8,
  "hook_strategy": "chant",
  "repetition_policy": "hook-heavy",
  "imagery_density": 0.6,
  "reading_level": "grade 6",
  "section_order": ["Intro", "Verse", "PreChorus", "Chorus", "Verse", "PreChorus", "Chorus", "Bridge", "Chorus"],
  "constraints": {
    "explicit": false,
    "max_lines": 120,
    "section_requirements": {
      "Chorus": {"min_lines": 6, "max_lines": 10, "must_end_with_hook": true}
    }
  },
  "source_citations": [
    {"source_id": "uuid-family", "weight": 0.6},
    {"source_id": "uuid-asoiaf", "weight": 0.4}
  ]
}
```

## 7. Acceptance Tests

1. **Section Presence** – Attempt to create a lyrics spec without a `Chorus` section.  The system should reject it and request at least one `Chorus`.
2. **Profanity Filter** – Set `explicit` to `false` and enter lyrics containing swear words.  The profanity filter should replace them with `[[REDACTED]]` or safe substitutes.
3. **Syllable Validation** – Write lines longer than the target `syllables_per_line`; a warning appears suggesting edits.  The final metrics reflect singability.
4. **Source Weights** – Provide weights that do not sum to 1.  The application normalises them or displays an error if negative values are present.

## 8. References

Meta tags help refine song structure, vocal style and effects.  Structural tags like `[Intro]`, `[Verse]`, `[Chorus]`, `[Bridge]` and `[Outro]` define sections, while vocal and instrument tags adjust the voice and instrumentation【290562151583449†L313-L333】.  Best practices for prompts include mentioning tempo and mood and adding special elements for uniqueness【76184295849824†L412-L418】.
