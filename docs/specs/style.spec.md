# Style - JSON Specification

## Overview

The **Style** entity encapsulates the musical identity for a song. It specifies genre and sub-genres, tempo range, time signature, key with optional modulations, mood, energy level, instrumentation, vocal profile and tags. Style serves as the foundation for lyrics, producer notes and prompt composition.

## Schema

### Field: `genre_detail`
- **Type**: Object
- **Description**: Defines the primary genre with optional sub-genres and fusion genres.
- **Required**: Yes
- **Constraints**: Must contain `primary` genre string; `subgenres` and `fusions` are optional arrays of strings.

### Field: `genre_detail.primary`
- **Type**: String
- **Description**: The core genre (e.g., Pop, Hip-Hop, Jazz, Country, Rock).
- **Required**: Yes
- **Constraints**: Must be a valid genre identifier.

### Field: `genre_detail.subgenres`
- **Type**: Array of strings
- **Description**: List of sub-genres to further classify the musical style (e.g., Big Band Pop, Electro Swing).
- **Required**: No
- **Constraints**: None.

### Field: `genre_detail.fusions`
- **Type**: Array of strings
- **Description**: Genres to blend with the primary genre (e.g., Pop + Reggaeton).
- **Required**: No
- **Constraints**: None.

### Field: `tempo_bpm`
- **Type**: Integer (40–220) or Array of 2 integers
- **Description**: Either a single BPM value or a range [min, max] allowing flexibility in tempo selection.
- **Required**: Yes
- **Constraints**: Single value: 40–220 BPM. Range: first element ≤ second element.

### Field: `time_signature`
- **Type**: String
- **Description**: Musical time signature (e.g., 4/4, 6/8, 3/4).
- **Required**: No
- **Constraints**: Defaults to "4/4" if not specified.

### Field: `key`
- **Type**: Object
- **Description**: Specifies the primary musical key and any key modulations.
- **Required**: Yes
- **Constraints**: Must contain `primary` key; `modulations` is optional array.

### Field: `key.primary`
- **Type**: String
- **Description**: Musical key in the format "[A-G][#|b]? [major|minor]" (e.g., C major, F# minor).
- **Required**: Yes
- **Constraints**: Must match pattern `^[A-G](#|b)?\s?(major|minor)$`.

### Field: `key.modulations`
- **Type**: Array of strings
- **Description**: List of keys for modulations or key changes within the song.
- **Required**: No
- **Constraints**: None.

### Field: `mood`
- **Type**: Array of strings
- **Description**: Mood descriptors (e.g., upbeat, cheeky, melancholic, warm). Multiple selections encourage nuance.
- **Required**: Yes
- **Constraints**: None.

### Field: `energy`
- **Type**: String
- **Description**: Overall intensity level of the song, guiding arrangement and production decisions.
- **Required**: No
- **Constraints**: Enum: "low", "medium", "high", "anthemic".

### Field: `instrumentation`
- **Type**: Array of strings
- **Description**: Instruments to highlight (e.g., brass, synth pads, handclaps). Limit to 1–3 instruments to avoid conflicting cues.
- **Required**: No
- **Constraints**: Maximum 3 instruments recommended; more triggers a warning.

### Field: `vocal_profile`
- **Type**: String
- **Description**: Text description of the vocal performer or delivery style (e.g., female/male duet, crooner, rap). Can be overridden by persona vocal range.
- **Required**: No
- **Constraints**: None.

### Field: `tags`
- **Type**: Array of strings
- **Description**: Free-form tags from predefined taxonomies (Era, Rhythm, Mix, Mood & Atmosphere, etc.). Limit to 1–2 per category to avoid over-specification.
- **Required**: Yes
- **Constraints**: Tags must not conflict with each other; consult conflict matrix in taxonomy config.

### Field: `negative_tags`
- **Type**: Array of strings
- **Description**: Tags to exclude from the composition (e.g., muddy low-end, over-compressed). Helps build negative prompts.
- **Required**: No
- **Constraints**: None.

## Example

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
