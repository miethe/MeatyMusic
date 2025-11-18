# Composed Prompt - JSON Specification

## Overview

The **Composed Prompt** entity represents the final prompt text sent to a music rendering engine (e.g., Suno). It merges the style specification, lyrics with section-specific meta tags, and producer notes into a single structured artifact. The prompt is guaranteed to respect engine-specific character limits and incorporates conflict resolution to ensure musical coherence.

## Schema

### Field: `text`
- **Type**: `string`
- **Description**: The complete prompt string sent to the music engine. Includes title, genre/style, structure, lyrics with meta tags, and production notes.
- **Required**: Yes
- **Constraints**: Must not exceed `meta.model_limits.prompt_max` characters. Composer truncates or simplifies tags if necessary.

### Field: `meta`
- **Type**: `object`
- **Description**: Metadata about the prompt including genre, tempo, and engine constraints.
- **Required**: Yes
- **Constraints**: Contains all tracking information for prompt composition and reproducibility.

### Field: `meta.title`
- **Type**: `string`
- **Description**: Song title from the style specification.
- **Required**: No (recommended)
- **Constraints**: Should match the title in the style and lyrics entities.

### Field: `meta.genre`
- **Type**: `string`
- **Description**: Primary genre from the style specification (e.g., "Pop", "Hip-Hop", "Christmas Pop").
- **Required**: No
- **Constraints**: Should match a valid genre in the style entity.

### Field: `meta.tempo_bpm`
- **Type**: `integer` or `array` of two integers
- **Description**: Tempo in beats per minute. Can be a single value or a range [min, max].
- **Required**: No
- **Constraints**: Copied from style specification. Range format: `[90, 110]` for BPM range.

### Field: `meta.structure`
- **Type**: `string`
- **Description**: Song structure as a string of sections separated by hyphens or dashes (e.g., "Intro–Verse–Pre-Chorus–Chorus–Bridge–Chorus").
- **Required**: No
- **Constraints**: Keys in `section_tags` must correspond to sections in this structure.

### Field: `meta.style_tags`
- **Type**: `array` of strings
- **Description**: Ordered list of style tags selected for the prompt. Categories include Era, Genre, Energy, Instrumentation, Rhythm, Vocal, and Mix.
- **Required**: No
- **Constraints**: One or two tags maximum per category. No contradictory tags (e.g., "very slow" and "high energy" together). Must not exceed `meta.model_limits.style_max` characters when formatted.

### Field: `meta.negative_tags`
- **Type**: `array` of strings
- **Description**: Tags instructing the engine to avoid certain qualities (e.g., "muddy low-end", "overcompressed", "robotic").
- **Required**: No
- **Constraints**: Applied as exclusion hints to the music engine; not counted in main style description.

### Field: `meta.section_tags`
- **Type**: `object` with string keys and array values
- **Description**: Dictionary mapping each song section to tags that shape its mood and energy. Keys should match sections in the structure.
- **Required**: No
- **Constraints**: Each value is an array of strings. All keys must correspond to sections present in `meta.structure`.

### Field: `meta.model_limits`
- **Type**: `object`
- **Description**: Engine-specific character limits enforced during composition.
- **Required**: No
- **Constraints**: Object containing `style_max` and `prompt_max` properties.

### Field: `meta.model_limits.style_max`
- **Type**: `integer`
- **Description**: Maximum characters allowed for the style/tags portion of the prompt (e.g., 1000 for Suno v5).
- **Required**: No
- **Constraints**: Positive integer. Composer truncates style tags if this limit is exceeded.

### Field: `meta.model_limits.prompt_max`
- **Type**: `integer`
- **Description**: Maximum characters for the entire prompt (e.g., 5000 for Suno v5).
- **Required**: No
- **Constraints**: Positive integer. Must be larger than `style_max`. Composer ensures full prompt does not exceed this limit.

## Example

```json
{
  "text": "Title: Elf On Overtime\nGenre/Style: Christmas Pop | BPM: 120 | Mood: upbeat, cheeky\nInfluences: big band, modern pop, electro swing\nStructure: Intro–Verse–Pre-Chorus–Chorus–Verse–Pre-Chorus–Chorus–Bridge–Chorus\nVocal: male/female duet, crooner + bright pop\nHooks: 2\n\nLyrics:\n[Intro: Soft piano and sleigh bells]\nWorking late on Christmas Eve, wrapping up another score,\nElf on the shelf's been watching me, but I'm too busy for the folklore.\n\n[Verse 1: Upbeat, punchy rhythm]\nFancy socks and name tags, this job keeps me running,\nSanta's workshop's overtime, and the metrics are stunning.\n\n[Pre-Chorus: Building energy]\nBut when the bells start ringing and the carolers appear,\nI remember why I'm here.\n\n[Chorus: Uplifting orchestral arrangement with handclaps]\nElfing on overtime, making Christmas bright,\nElfing on overtime, through the holy night,\nSleigh bells and spreadsheets, metrics and cheer,\nElf on overtime, Christmas is here!\n\n[Bridge: Stripped back, intimate]\nWhen the world gets dark and cold, and the season seems too long,\nI'll keep shining my light, keep singing this song.\n\nProduction Notes:\n- Arrangement: sleigh bells, upright bass, brass stabs, orchestral strings\n- Mix: lush, wide stereo, bright mid-range\n- Handclaps in pre-chorus, reverb on vocals\n- Clean = TRUE; Language = en",
  "meta": {
    "title": "Elf On Overtime",
    "genre": "Christmas Pop",
    "tempo_bpm": 120,
    "structure": "Intro–Verse–Pre-Chorus–Chorus–Verse–Pre-Chorus–Chorus–Bridge–Chorus",
    "style_tags": [
      "Era:2010s",
      "Genre:Christmas Pop",
      "Energy:anthemic",
      "Instrumentation:brass",
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
      "Verse": ["narrative-driven", "moderate energy"],
      "Pre-Chorus": ["building", "punchy"],
      "Chorus": ["anthemic", "hook-forward", "cheerful"],
      "Bridge": ["intimate", "stripped-back"]
    },
    "model_limits": {
      "style_max": 1000,
      "prompt_max": 5000
    }
  }
}
```
