# PRD – Song Design Spec (SDS)

## 1. Purpose

The **Song Design Spec (SDS)** aggregates all entity definitions into a single specification.  It provides the Claude Code workflow with every detail needed to plan, generate and evaluate a song.  The SDS ensures deterministic behaviour and reproducibility.

## 2. Schema (JSON v1.0)

```
{
  "$id": "amcs://schemas/sds-1.0.json",
  "type": "object",
  "required": [
    "title", "blueprint_ref", "style", "lyrics",
    "producer_notes", "sources", "prompt_controls",
    "render", "seed"
  ],
  "properties": {
    "title": {"type": "string"},
    "blueprint_ref": {
      "type": "object",
      "required": ["genre", "version"],
      "properties": {
        "genre": {"type": "string"},
        "version": {"type": "string"}
      }
    },
    "style": {"$ref": "amcs://schemas/style-1.0.json"},
    "lyrics": {"$ref": "amcs://schemas/lyrics-1.0.json"},
    "producer_notes": {"$ref": "amcs://schemas/producer-notes-1.0.json"},
    "persona_id": {"type": ["string", "null"]},
    "sources": {"type": "array", "items": {"$ref": "amcs://schemas/source-1.0.json"}},
    "prompt_controls": {
      "type": "object",
      "properties": {
        "positive_tags": {"type": "array", "items": {"type": "string"}},
        "negative_tags": {"type": "array", "items": {"type": "string"}},
        "max_style_chars": {"type": "integer"},
        "max_prompt_chars": {"type": "integer"}
      }
    },
    "render": {
      "type": "object",
      "properties": {
        "engine": {"type": "string", "enum": ["suno", "none", "external"]},
        "model": {"type": ["string", "null"]},
        "num_variations": {"type": "integer", "minimum": 1, "maximum": 8, "default": 2}
      }
    },
    "seed": {"type": "integer"}
  }
}
```

## 3. Field Descriptions

* **title** – Name of the song.  Required.
* **blueprint_ref** – References the blueprint version applicable for this song.  Both genre and version are required.
* **style** – A fully populated **Style** object.
* **lyrics** – A **Lyrics** object with structural and stylistic constraints.
* **producer_notes** – A **Producer Notes** object.
* **persona_id** – UUID of the persona used for this song.  `null` if no persona is associated.
* **sources** – Array of **Source** objects used during retrieval‑augmented lyric generation.
* **prompt_controls** – Contains additional tags and character limits for prompt composition.
* **render** – Specifies the target music engine, model and number of variations to generate.
* **seed** – Global seed ensuring deterministic behaviour.

## 4. Validation Rules

* All required properties must be present.  Omitting `style`, `lyrics` or `producer_notes` yields a validation error.
* If `render.engine = "suno"`, ensure that `prompt_controls.max_style_chars` and `max_prompt_chars` are set.  These correspond to model‑specific limits.
* `sources` weights are normalised so they sum to 1.  Negative or zero weights are not allowed.
* `seed` must be a non‑negative integer.

## 5. UI & Workflow

* The front‑end collects inputs across the style, lyrics, producer notes, persona and sources editors.  The SDS preview appears on the final step before submission.  
* Users can expand each section to view nested JSON.  Editing any entity updates the SDS preview in real time.
* Submitting the SDS triggers a Claude Code run.  Real‑time status updates are available via WebSocket.
* After completion, the SDS is stored with the resulting prompts and assets.  Users can clone the SDS for further experimentation.

## 6. Example

The following is a sample SDS combining style, lyrics, producer notes and sources:

```
{
  "title": "Elf On Overtime",
  "blueprint_ref": {"genre": "Christmas Pop", "version": "2025.11"},
  "style": {
    "genre_detail": {"primary": "Christmas Pop", "subgenres": ["Big Band Pop"], "fusions": ["Electro Swing"]},
    "tempo_bpm": [116, 124],
    "key": {"primary": "C major", "modulations": ["E major"]},
    "mood": ["upbeat", "cheeky", "warm"],
    "energy": "anthemic",
    "instrumentation": ["brass", "upright bass", "handclaps", "sleigh bells"],
    "tags": ["Era:2010s", "Rhythm:four-on-the-floor", "Mix:modern-bright"],
    "negative_tags": ["muddy low-end"]
  },
  "lyrics": {
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
    "section_order": ["Intro", "Verse", "PreChorus", "Chorus", "Verse", "PreChorus", "Chorus", "Bridge", "Chorus"],
    "constraints": {
      "explicit": false,
      "max_lines": 120,
      "section_requirements": {"Chorus": {"min_lines": 6, "must_end_with_hook": true}}
    },
    "source_citations": [
      {"source_id": "uuid-family", "weight": 0.6},
      {"source_id": "uuid-asoiaf", "weight": 0.4}
    ]
  },
  "producer_notes": {
    "structure": "Intro–Verse–Pre-Chorus–Chorus–Verse–Pre-Chorus–Chorus–Bridge–Chorus",
    "hooks": 2,
    "instrumentation": ["sleigh bells", "upright bass", "brass stabs"],
    "section_meta": {
      "Intro": {"tags": ["instrumental", "low energy"], "target_duration_sec": 10},
      "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
      "PreChorus": {"tags": ["build-up", "handclaps"], "target_duration_sec": 15},
      "Chorus": {"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25},
      "Bridge": {"tags": ["minimal", "dramatic"], "target_duration_sec": 20},
      "Outro": {"tags": ["fade-out"], "target_duration_sec": 10}
    },
    "mix": {"lufs": -12.0, "space": "lush", "stereo_width": "wide"}
  },
  "persona_id": null,
  "sources": [
    {
      "name": "Family History Document",
      "kind": "file",
      "config": {"file_path": "/documents/family_story.md"},
      "scopes": ["family", "memories"],
      "weight": 0.6,
      "allow": ["grandmother", "thanksgiving"],
      "deny": ["divorce"],
      "provenance": true,
      "mcp_server_id": "family-docs-server"
    },
    {
      "name": "Game of Thrones API",
      "kind": "api",
      "config": {"base_url": "https://anapioficeandfire.com/api"},
      "scopes": ["characters", "houses"],
      "weight": 0.4,
      "provenance": true,
      "mcp_server_id": "asoiaf-server"
    }
  ],
  "prompt_controls": {
    "positive_tags": [],
    "negative_tags": ["muddy low-end"],
    "max_style_chars": 1000,
    "max_prompt_chars": 5000
  },
  "render": {"engine": "none", "model": null, "num_variations": 2},
  "seed": 42
}
```

## 7. Acceptance Tests

* **Missing Entity** – Assembling an SDS without a `producer_notes` object results in a validation error.
* **Weight Normalisation** – When sources have weights that do not sum to 1.0, the SDS generator normalises them.
* **Determinism** – Running two workflows with the same SDS and seed produces identical outputs.  Changing the seed yields different results.
* **Engine Limits** – If `render.engine = "suno"` and the composed prompt exceeds `max_prompt_chars`, the composer must truncate or adjust tags until it fits.

## 8. References

Meta tags define sections, vocal types, instruments and sound effects【290562151583449†L313-L333】.  Effective prompts include BPM, mood and special elements【76184295849824†L412-L418】.  The SDS draws together these principles, ensuring that they are applied uniformly across the workflow.