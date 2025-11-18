# Persona - JSON Specification

## Overview

The **Persona** entity represents the performing artist or band for a song. It stores identity information, vocal characteristics, influences, and default creative preferences. Personas are reusable across songs, enabling consistent vocal profiles and stylistic biases. Policy settings determine how names and influences are handled in public releases.

## Schema

### Field: `name`
- **Type**: string
- **Description**: Display name of the persona (artist or band). Must be unique within a user's workspace.
- **Required**: Yes
- **Constraints**: Non-empty string; must be unique per workspace

### Field: `kind`
- **Type**: string (enum)
- **Description**: Classification of the persona as either a solo `artist` or a musical `band`. Influences presentation and pronoun usage.
- **Required**: Yes
- **Constraints**: Must be one of: `"artist"` or `"band"`

### Field: `bio`
- **Type**: string
- **Description**: Biographical text used in marketing or as a creative backstory. Provides context about the persona's history and style.
- **Required**: No
- **Constraints**: Free-form text

### Field: `voice`
- **Type**: string
- **Description**: Free-text description of the voice timbre or character (e.g., "airy soprano", "gritty baritone", "smooth male lead with playful female harmonies").
- **Required**: No
- **Constraints**: Descriptive text; helpful for vocal characterization

### Field: `vocal_range`
- **Type**: string
- **Description**: Range classification for pitch and key selection (e.g., "soprano", "mezzo-soprano", "tenor", "baritone"). For bands, may combine multiple ranges.
- **Required**: No
- **Constraints**: Standard vocal range classifications; may list multiple ranges for bands separated by "+"

### Field: `delivery`
- **Type**: array of strings
- **Description**: List of vocal delivery styles (e.g., "crooning", "belting", "rap", "whispered"). Supports multiple simultaneous styles.
- **Required**: No
- **Constraints**: Each element is a string describing a delivery technique; warn if mutually exclusive styles (e.g., "whispered" + "belting") are selected

### Field: `influences`
- **Type**: array of strings
- **Description**: List of artists or genres influencing the persona. When releasing publicly, references to living artists are automatically sanitized to generic descriptions.
- **Required**: No
- **Constraints**: Array of influence names; living artists should be sanitized for public releases per policy

### Field: `style_defaults`
- **Type**: object (references Style schema)
- **Description**: A default Style spec that biases new songs toward a particular genre, tempo, key, mood, and instrumentation. Optional fallback for stylistic consistency.
- **Required**: No
- **Constraints**: Must conform to the Style schema (amcs://schemas/style-1.0.json); includes genre_detail, tempo_bpm, key, mood, energy, instrumentation, and tags

### Field: `lyrics_defaults`
- **Type**: object (references Lyrics schema)
- **Description**: A default Lyrics spec for section structure, rhyme scheme, and hook strategy. Enables consistent lyrical approach across songs.
- **Required**: No
- **Constraints**: Must conform to the Lyrics schema (amcs://schemas/lyrics-1.0.json); includes section_order, rhyme_scheme, hook_strategy, and repetition_policy

### Field: `policy.public_release`
- **Type**: boolean
- **Description**: Indicates whether the persona may be used for publicly released songs. If false, all outputs remain private.
- **Required**: No (defaults to false)
- **Constraints**: Boolean; default value is `false`

### Field: `policy.disallow_named_style_of`
- **Type**: boolean
- **Description**: When true, prohibits explicit "style of [Living Artist]" references in render prompts. Forces the composer to convert such instructions into generic influence language.
- **Required**: No (defaults to true)
- **Constraints**: Boolean; default value is `true`

## Example

```json
{
  "name": "North Pole Duo",
  "kind": "band",
  "bio": "A charming husband-and-wife team who perform festive songs with a modern twist.",
  "voice": "smooth male lead with playful female harmonies",
  "vocal_range": "baritone + mezzo-soprano",
  "delivery": [
    "crooning",
    "belting"
  ],
  "influences": [
    "Bublé",
    "modern pop",
    "contemporary holiday classics"
  ],
  "style_defaults": {
    "genre_detail": {
      "primary": "Christmas Pop"
    },
    "tempo_bpm": 120,
    "key": {
      "primary": "C major"
    },
    "mood": [
      "upbeat",
      "warm"
    ],
    "energy": "high",
    "instrumentation": [
      "sleigh bells",
      "brass",
      "upright bass"
    ],
    "tags": [
      "Era:2000s",
      "Mix:vintage"
    ]
  },
  "lyrics_defaults": {
    "section_order": [
      "Verse",
      "Chorus",
      "Verse",
      "Chorus",
      "Bridge",
      "Chorus"
    ],
    "rhyme_scheme": "AABB",
    "hook_strategy": "lyrical",
    "repetition_policy": "hook-heavy"
  },
  "policy": {
    "public_release": true,
    "disallow_named_style_of": true
  }
}
```
