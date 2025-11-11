# PRD – Blueprint & Rubric Entity

## 1. Purpose

A **Blueprint** is the algorithmic template for generating hit songs in a given genre.  It defines strict rules (tempo ranges, required sections, banned terms, lexicon) and a scoring rubric (weights and thresholds for evaluation metrics).  Blueprints ensure that outputs adhere to genre conventions and help the validator score and auto‑fix drafts.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/blueprint-1.0.json",
  "type": "object",
  "required": ["genre", "version", "rules", "eval_rubric"],
  "properties": {
    "genre": {"type": "string"},
    "version": {"type": "string"},
    "rules": {
      "type": "object",
      "properties": {
        "tempo_bpm": {"type": "array", "items": {"type": "integer"}, "minItems": 2, "maxItems": 2},
        "required_sections": {"type": "array", "items": {"type": "string"}},
        "banned_terms": {"type": "array", "items": {"type": "string"}},
        "lexicon_positive": {"type": "array", "items": {"type": "string"}},
        "lexicon_negative": {"type": "array", "items": {"type": "string"}},
        "section_lines": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "min": {"type": "integer"},
              "max": {"type": "integer"}
            }
          }
        }
      }
    },
    "eval_rubric": {
      "type": "object",
      "properties": {
        "weights": {
          "type": "object",
          "properties": {
            "hook_density": {"type": "number"},
            "singability": {"type": "number"},
            "rhyme_tightness": {"type": "number"},
            "section_completeness": {"type": "number"},
            "profanity_score": {"type": "number"}
          }
        },
        "thresholds": {
          "type": "object",
          "properties": {
            "min_total": {"type": "number"},
            "max_profanity": {"type": "number"}
          }
        }
      }
    }
  }
}
```

## 3. Field Descriptions

* **genre** – Name of the genre (e.g., *Christmas Pop*, *Hip‑Hop*).
* **version** – Version identifier, enabling updates over time (e.g., `2025.11`).
* **rules.tempo_bpm** – Allowed BPM range for the genre.  If a style’s tempo falls outside this range, the validator flags it.
* **rules.required_sections** – Sections that must appear in the song (e.g., `Verse`, `Chorus`).  The validator checks the lyrics and producer notes for these sections.
* **rules.banned_terms** – Words or phrases forbidden in lyrics.  The profanity filter references this list.
* **rules.lexicon_positive** – Terms that should appear in the lyrics to capture genre flavour (e.g., `snow`, `holly` for *Christmas Pop*).
* **rules.lexicon_negative** – Terms to avoid because they clash with the genre.
* **rules.section_lines** – Per‑section line count guidance.  Contains `min` and `max` lines for each section (e.g., `Chorus.min = 6`, `Verse.max = 16`).
* **eval_rubric.weights** – Weights for each scoring category.  These values sum to 1.0 and influence the total evaluation score.
* **eval_rubric.thresholds.min_total** – Minimum passing score.  If the validator score is below this threshold, the fixer is triggered.
* **eval_rubric.thresholds.max_profanity** – Maximum allowed profanity score.  The profanity score is calculated based on banned term occurrences.

## 4. Validation Rules

* `tempo_bpm` must contain exactly two integers and the first must be ≤ the second.
* `weights` values must sum to 1.0.  The UI should normalise them if they do not.
* `min_total` must be between 0 and 1.  `max_profanity` must be between 0 and 1.
* `required_sections` must be non‑empty.  The validator rejects songs missing any of these sections.

## 5. UI Controls & Hints

* Provide a blueprint editor accessible only to advanced users or administrators.  Use separate tabs for **Rules** and **Rubric**.
* In the **Rules** tab, allow selecting tempo range via slider, defining required sections through multi‑select lists, entering banned terms and specifying positive/negative lexicons.  Provide auto‑complete from existing lexicon suggestions.
* In the **Rubric** tab, use sliders to adjust weights for `hook_density`, `singability`, `rhyme_tightness`, `section_completeness` and `profanity_score`.  Normalise automatically.
* Visualise line count guidance using per‑section sliders or numeric inputs.  Display preview charts of expected vs. actual line counts for draft songs.

## 6. Example

```json
{
  "genre": "Christmas Pop",
  "version": "2025.11",
  "rules": {
    "tempo_bpm": [100, 130],
    "required_sections": ["Verse", "Chorus", "Bridge"],
    "banned_terms": ["explicit expletives"],
    "lexicon_positive": ["snow", "holly", "mistletoe"],
    "lexicon_negative": ["sadness", "pain"],
    "section_lines": {
      "Verse": {"min": 8, "max": 16},
      "Chorus": {"min": 6, "max": 10},
      "Bridge": {"min": 4, "max": 8}
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

## 7. Acceptance Tests

1. **Weights Sum** – Entering weights that sum to 1.2 causes the UI to normalise them down to 1.0 or display an error requesting correction.
2. **Tempo Range** – Creating a style with a BPM outside the blueprint’s `tempo_bpm` range triggers a warning.  The style must be adjusted or the blueprint updated.
3. **Required Section** – Omitting a required section from the lyrics or producer notes flags a validation failure and triggers the auto‑fix routine.
4. **Profanity Score** – If the output lyrics contain banned terms and the calculated profanity score exceeds `max_profanity`, the fixer rewrites or removes offending lines.

## 8. References

Meta tags support structural guidance (sections), vocal style and instrument detail【290562151583449†L313-L333】.  Best practices for prompts include using concise instructions with BPM, mood and special elements【76184295849824†L412-L418】, which complement the blueprint’s rules and rubric when composing prompts and evaluating outputs.
