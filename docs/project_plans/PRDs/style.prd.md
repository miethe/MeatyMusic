# PRD – Style Entity

## 1. Purpose

The **Style** entity encapsulates the musical identity for a song.  It specifies genre and sub‑genres, tempo range, time signature, key with optional modulations, mood, energy level, instrumentation, vocal profile and tags.  It serves as the foundation for lyrics, producer notes and prompt composition.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/style-1.0.json",
  "type": "object",
  "required": ["genre_detail", "tempo_bpm", "key", "mood", "tags"],
  "properties": {
    "genre_detail": {
      "type": "object",
      "required": ["primary"],
      "properties": {
        "primary": {"type": "string"},
        "subgenres": {"type": "array", "items": {"type": "string"}},
        "fusions": {"type": "array", "items": {"type": "string"}}
      }
    },
    "tempo_bpm": {
      "oneOf": [
        {"type": "integer", "minimum": 40, "maximum": 220},
        {
          "type": "array",
          "items": {"type": "integer"},
          "minItems": 2,
          "maxItems": 2
        }
      ]
    },
    "time_signature": {"type": "string", "default": "4/4"},
    "key": {
      "type": "object",
      "required": ["primary"],
      "properties": {
        "primary": {
          "type": "string",
          "pattern": "^[A-G](#|b)?\\s?(major|minor)$"
        },
        "modulations": {"type": "array", "items": {"type": "string"}}
      }
    },
    "mood": {"type": "array", "items": {"type": "string"}},
    "energy": {"type": "string", "enum": ["low", "medium", "high", "anthemic"]},
    "instrumentation": {"type": "array", "items": {"type": "string"}},
    "vocal_profile": {"type": "string"},
    "tags": {"type": "array", "items": {"type": "string"}},
    "negative_tags": {"type": "array", "items": {"type": "string"}}
  }
}
```

## 3. Field Descriptions

* **genre_detail.primary** – The core genre (e.g., *Pop*, *Hip‑Hop*, *Jazz*).  Required.
* **genre_detail.subgenres** – A list of sub‑genres (e.g., *Big Band Pop*, *Electro Swing*).  Optional.
* **genre_detail.fusions** – Genres to blend (e.g., *Pop* + *Reggaeton*).  Optional.
* **tempo_bpm** – Either a single BPM or an array `[min, max]` allowing the algorithm to vary within a range.
* **time_signature** – Default `4/4`, but can be changed (e.g., `6/8` for waltz feel).
* **key.primary** – Musical key (e.g., *C major*).  Required.
* **key.modulations** – List of keys for modulations or key changes.  Optional.
* **mood** – An array of mood descriptors (e.g., *upbeat*, *cheeky*, *melancholic*).  Multiple selections encourage nuance.
* **energy** – Overall intensity of the song.  Helps the orchestrator decide arrangement and production.
* **instrumentation** – Array of instruments to highlight (e.g., *brass*, *synth pads*, *handclaps*).  Use multiple selections sparingly to avoid conflicting cues.
* **vocal_profile** – Text description of the vocal performer or delivery style (e.g., *female/male duet*, *crooner*, *rap*).  Optional; can be overridden by a persona’s vocal range.
* **tags** – Free‑form tags from predefined taxonomies (Era, Rhythm, Mix, Mood & Atmosphere, etc.).  Limit to 1–2 per category to avoid over‑specification.
* **negative_tags** – Tags to exclude (e.g., *muddy low‑end*, *over‑compressed*).  Helps the prompt composer build negative prompts.

## 4. Validation Rules

* If `tempo_bpm` is a range, the first element must be less than or equal to the second.
* `energy` value must align with the tempo range and instrumentation.  A high‑energy tag with a very slow BPM is flagged as conflicting.
* Tags from different categories should not conflict (e.g., `Era:1970s` with `Era:2020s`).  A conflict matrix is defined in the taxonomy config.
* Limit the number of instruments to no more than 3 to avoid dilution of the mix.

## 5. UI Controls & Hints

* Use a **multi‑select chip picker** for `mood`, `instrumentation` and `tags`.  Provide search and auto‑suggest features.  Display selected chips with remove icons.
* For `tempo_bpm`, provide a slider with min/max handles.  When the user selects a single value, the range collapses to a single point.
* The `key` field includes a dropdown for the primary key and a multiselect for modulations.  Validate the format and suggest common modulations.
* The `energy` field uses radio buttons or a select menu.  Descriptive tooltips explain each level.
* Show a live preview of the JSON spec to reinforce the structure.

## 6. Example

```json
{
  "genre_detail": {
    "primary": "Christmas Pop",
    "subgenres": ["Big Band Pop"],
    "fusions": ["Electro Swing"]
  },
  "tempo_bpm": [116, 124],
  "time_signature": "4/4",
  "key": {
    "primary": "C major",
    "modulations": ["E major"]
  },
  "mood": ["upbeat", "cheeky", "warm"],
  "energy": "anthemic",
  "instrumentation": ["brass", "upright bass", "handclaps", "sleigh bells"],
  "vocal_profile": "male/female duet, crooner + bright pop",
  "tags": ["Era:2010s", "Rhythm:four-on-the-floor", "Mix:modern-bright"],
  "negative_tags": ["muddy low-end"]
}
```

## 7. Acceptance Tests

1. **Multi‑Select** – The form allows the user to pick multiple values for mood, instrumentation and tags.  Attempting to add more than 3 instruments displays a warning.
2. **Conflict Detection** – Selecting `energy = anthemic` and `tempo_bpm = [60, 70]` prompts a conflict warning because a high‑energy song rarely fits with a slow BPM.
3. **JSON Preview** – Changes in the UI instantly update the JSON preview, ensuring determinism when saved.
4. **Schema Validation** – Serializing the spec and validating it against the schema yields no errors.

## 8. References

Meta tags can be used to define sections, voices, instruments and effects when composing prompts for Suno【290562151583449†L313-L333】.  Best practices recommend concise prompts that include BPM, mood and special elements【76184295849824†L412-L418】.
