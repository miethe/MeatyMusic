# Render Job - JSON Specification

## Overview

The **Render Job** entity represents a request to a music rendering engine. It encapsulates all necessary information to submit a composed prompt to an engine (such as Suno) for audio generation. During MVP, render jobs are optional; users primarily copy prompts manually. In later releases, the app will create render jobs programmatically and submit them to supported rendering APIs with callback support and event streaming.

## Schema

### Field: `engine`
- **Type**: `string`
- **Description**: Name of the rendering engine (e.g., `suno-v5`, `suno-v4`, or `manual`). The `manual` value indicates the user will render outside the app.
- **Required**: Yes
- **Constraints**: Cannot be empty. When `engine` is `manual`, the `model` field may be omitted.

### Field: `model`
- **Type**: `string`
- **Description**: Specific model version to use within the engine (e.g., `chirp-v3-5`, `v4.5`). Required when engine is not `manual`.
- **Required**: Conditional (required if `engine` != `manual`)
- **Constraints**: Cannot be empty when required. Must be a supported model for the specified engine.

### Field: `composed_prompt`
- **Type**: `object` (references `amcs://schemas/composed-prompt-0.2.json`)
- **Description**: The complete Prompt entity containing the final prompt text and metadata. Includes song title, genre, tempo, structure, style tags, and production notes.
- **Required**: Yes
- **Constraints**: Must conform to composed-prompt schema with `text` and `meta` fields. The prompt text must not exceed the engine's character limits as specified in `meta.model_limits`.

### Field: `num_variations`
- **Type**: `integer`
- **Description**: Number of variations to request from the engine. More variations typically cost more credits.
- **Required**: Yes
- **Constraints**: Minimum 1, maximum 8. The orchestrator will cap the value if the engine supports fewer variations.

### Field: `seed`
- **Type**: `integer`
- **Description**: Seed value for deterministic rendering. When the engine supports seeded generation, passing the same seed reproduces identical output.
- **Required**: Yes
- **Constraints**: Must be a valid integer. Used for reproducibility across multiple render attempts.

### Field: `callbacks`
- **Type**: `object`
- **Description**: Optional callback configuration for job completion notifications and event streaming.
- **Required**: No
- **Constraints**: If provided, must contain valid `webhook` URL (HTTPS) and/or boolean `events` flag.

### Field: `callbacks.webhook`
- **Type**: `string` (valid HTTPS URL)
- **Description**: HTTPS URL for an HTTP callback upon job completion. The backend posts render results to this URL.
- **Required**: No
- **Constraints**: Must be a valid HTTPS URL. Invalid URLs are rejected during validation.

### Field: `callbacks.events`
- **Type**: `boolean`
- **Description**: When true, progress events are streamed to the client via WebSockets (e.g., `queued`, `processing`, `rendered`).
- **Required**: No
- **Constraints**: Defaults to false if not specified.

## Example

```json
{
  "engine": "suno-v5",
  "model": "chirp-v3-5",
  "composed_prompt": {
    "text": "Title: Elf On Overtime\nGenre/Style: Christmas Pop | BPM: 120 | Mood: upbeat, cheeky\nInfluences: big band, modern pop, electro swing\nStructure: Intro–Verse–Pre‑Chorus–Chorus–Verse–Pre‑Chorus–Chorus–Bridge–Chorus\nVocal: male/female duet, crooner + bright pop\nHooks: 2\n\nLyrics:\n[Intro: Soft piano and sleigh bells]\nElf on overtime, never seen the light\nStacking presents high into the midnight\nSanta's warehouse working round the clock\nChecking off the list, not a single knock\n\n[Chorus: Uplifting orchestral arrangement with handclaps]\nElf on overtime, burning bright\nMaking magic through the silent night\n\nProduction Notes:\n- Arrangement: sleigh bells, upright bass, brass stabs, handclaps\n- Mix: lush, wide stereo, modern-bright\n- Clean = TRUE; Language = en",
    "meta": {
      "title": "Elf On Overtime",
      "genre": "Christmas Pop",
      "tempo_bpm": 120,
      "structure": "Intro–Verse–Pre‑Chorus–Chorus–Verse–Pre‑Chorus–Chorus–Bridge–Chorus",
      "style_tags": [
        "Era:2010s",
        "Genre:Christmas Pop",
        "Energy:anthemic",
        "Instr:brass",
        "Rhythm:four-on-the-floor",
        "Vocal:duet",
        "Mix:modern-bright"
      ],
      "negative_tags": [
        "muddy low-end",
        "overcompressed"
      ],
      "section_tags": {
        "Intro": ["instrumental", "low energy"],
        "Verse": ["conversational", "rhythmic"],
        "Pre-Chorus": ["building", "hook-forward"],
        "Chorus": ["anthemic", "hook-forward", "call-and-response"],
        "Bridge": ["sparse", "reflective"]
      },
      "model_limits": {
        "style_max": 1000,
        "prompt_max": 5000
      }
    }
  },
  "num_variations": 4,
  "seed": 42857391,
  "callbacks": {
    "webhook": "https://myapp.example.com/webhooks/render-complete",
    "events": true
  }
}
```
