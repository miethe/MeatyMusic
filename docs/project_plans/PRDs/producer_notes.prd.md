# PRD – Producer Notes Entity

## 1. Purpose

The **Producer Notes** entity defines the structural and production‑oriented aspects of a song that are not covered by the style or lyrics specs.  It determines the song’s section sequence, the number of hooks, instrumentation hints, per‑section tags, mix preferences and other audio engineering parameters.  These notes inform both the arrangement generation and the final prompt composition.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/producer-notes-1.0.json",
  "type": "object",
  "required": ["structure", "hooks"],
  "properties": {
    "structure": {"type": "string"},
    "hooks": {"type": "integer", "minimum": 0},
    "instrumentation": {"type": "array", "items": {"type": "string"}},
    "section_meta": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "tags": {"type": "array", "items": {"type": "string"}},
          "target_duration_sec": {"type": "integer"}
        }
      }
    },
    "mix": {
      "type": "object",
      "properties": {
        "lufs": {"type": "number"},
        "space": {"type": "string"},
        "stereo_width": {"type": "string", "enum": ["narrow", "normal", "wide"]}
      }
    }
  }
}
```

## 3. Field Descriptions

* **structure** – A free‑form string indicating the arrangement of song sections, e.g., `Intro–Verse–Pre‑Chorus–Chorus–Verse–Chorus–Bridge–Chorus`.  This informs the orchestrator of how to order the lyrics and assign tags.
* **hooks** – Number of hooks in the song.  A hook is a memorable phrase or melody that recurs.  Setting `hooks = 2` means the algorithm should generate at least two hooks.
* **instrumentation** – Additional instrumentation notes beyond those specified in the style.  Useful for introducing or highlighting specific instruments in certain sections (e.g., *guitar solo in the bridge*).
* **section_meta** – A map keyed by section name (e.g., `Intro`, `Verse`, `PreChorus`, `Chorus`, `Bridge`, `Outro`).  Each entry can define:
  * **tags** – Category‑aware tags that modify the mood, energy or arrangement for that section (e.g., `anthemic`, `stripped-down`, `build-up`).
  * **target_duration_sec** – Desired duration for the section.  Helps the renderer maintain overall song length.
* **mix.lufs** – Target loudness in LUFS (Loudness Units relative to Full Scale).  Informational; used by audio post‑processing tools.
* **mix.space** – Description of space/reverb (e.g., `dry`, `roomy`, `lush`, `vintage tape`).
* **mix.stereo_width** – Desired stereo spread.  Influences final mix width.

## 4. Validation Rules

* `hooks` must be ≥ 0.  If zero, the system warns that the song may lack memorability.
* `structure` must include at least one section defined in the lyrics’ `section_order`.  If there is a mismatch, a warning prompts the user to reconcile the arrangement.
* Section names in `section_meta` must appear in the `structure` string.  Extra entries are ignored with a log message.
* For each `section_meta` entry, `target_duration_sec` must be positive.  The sum across all sections should be within ± 30 seconds of the `constraints.duration_sec` in the SDS.

## 5. UI Controls & Hints

* Represent the `structure` as an editable list where users can reorder, add or remove sections.  Provide templates for common song forms (e.g., **ABAB**, **ABABCBB**).
* Use number inputs or steppers to set the `hooks` count.  Display explanatory text about hooks and provide guidelines from the blueprint on recommended hook density.
* For `section_meta.tags`, use multi‑select chips filtered by the tag taxonomy.  For example, tags like `anthemic`, `low energy`, `crowd chant` are associated with the **Chorus**.
* Provide sliders or input boxes for `target_duration_sec`.  Show a running total and compare with the SDS duration constraint.
* `mix` settings can appear in an advanced section.  Include tooltips explaining LUFS and stereo width for non‑technical users.

## 6. Example

```json
{
  "structure": "Intro–Verse–Pre‑Chorus–Chorus–Verse–Pre‑Chorus–Chorus–Bridge–Chorus",
  "hooks": 2,
  "instrumentation": ["sleigh bells", "upright bass", "brass stabs"],
  "section_meta": {
    "Intro": {"tags": ["instrumental", "low energy"], "target_duration_sec": 10},
    "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
    "Pre‑Chorus": {"tags": ["build-up", "handclaps"], "target_duration_sec": 15},
    "Chorus": {"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25},
    "Bridge": {"tags": ["minimal", "dramatic"], "target_duration_sec": 20},
    "Outro": {"tags": ["fade-out"], "target_duration_sec": 10}
  },
  "mix": {
    "lufs": -12.0,
    "space": "lush",
    "stereo_width": "wide"
  }
}
```

## 7. Acceptance Tests

1. **Section Alignment** – Creating a producer notes spec with a `structure` that conflicts with the lyric’s `section_order` triggers a warning and a suggestion to adjust one or the other.
2. **Hook Count** – Setting `hooks = 0` displays a tooltip that songs without hooks may fail the rubric.  Setting a negative number is rejected.
3. **Duration Budget** – If the sum of `target_duration_sec` values deviates from the SDS `constraints.duration_sec` by more than ± 30 seconds, the UI flags a discrepancy and asks the user to adjust durations.
4. **Tag Validation** – Selecting tags from the wrong category (e.g., `instrument` tag in section meta meant for mood) is disallowed.  Only tags from the appropriate category are permitted.

## 8. References

Meta tags such as `[Intro]`, `[Verse]`, `[Chorus]` and `[Bridge]` guide Suno’s song structure【290562151583449†L313-L333】.  Sound effect tags (e.g., `[Applause]`, `[Phone ringing]`) and instrument tags (e.g., `[Acoustic guitar]`) can be attached to specific sections to refine the arrangement【290562151583449†L313-L333】.
