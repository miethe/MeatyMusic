# Producer Notes - JSON Specification

## Overview

The Producer Notes entity defines the structural and production-oriented aspects of a song, including section sequence, hook count, instrumentation hints, per-section tags, and mix preferences. These notes inform both arrangement generation and final prompt composition, bridging the gap between style and lyrics specifications.

## Schema

### Field: `structure`
- **Type**: string
- **Description**: A free-form string indicating the arrangement of song sections (e.g., `Intro–Verse–Pre-Chorus–Chorus–Verse–Chorus–Bridge–Chorus`). Informs the orchestrator of section ordering and tag assignment.
- **Required**: Yes
- **Constraints**: Must include at least one section defined in the lyrics' `section_order`. Section names must match those used in `section_meta`.

### Field: `hooks`
- **Type**: integer
- **Description**: Number of memorable phrases or melodies that recur throughout the song. Guides the algorithm to generate at least this many hooks.
- **Required**: Yes
- **Constraints**: Must be ≥ 0. If zero, system warns that the song may lack memorability.

### Field: `instrumentation`
- **Type**: array of strings
- **Description**: Additional instrumentation notes beyond those specified in the style spec. Useful for introducing or highlighting specific instruments in certain sections.
- **Required**: No
- **Constraints**: Each entry should be a concise instrument description (e.g., `guitar solo`, `sleigh bells`, `brass stabs`).

### Field: `section_meta`
- **Type**: object (map of section names to section objects)
- **Description**: Map keyed by section name (e.g., `Intro`, `Verse`, `PreChorus`, `Chorus`, `Bridge`, `Outro`). Each section can define mood, energy, and arrangement modifications.
- **Required**: No
- **Constraints**: Section names must appear in the `structure` string. Extra entries are logged but not rejected.

#### Field: `section_meta.{section_name}.tags`
- **Type**: array of strings
- **Description**: Category-aware tags that modify the mood, energy, or arrangement for that specific section (e.g., `anthemic`, `stripped-down`, `build-up`, `crowd chant`).
- **Required**: No
- **Constraints**: Tags must belong to appropriate categories (mood/energy/arrangement tags only). Invalid category tags are rejected.

#### Field: `section_meta.{section_name}.target_duration_sec`
- **Type**: integer
- **Description**: Desired duration in seconds for this section. Helps maintain overall song length and supports the renderer in section timing.
- **Required**: No
- **Constraints**: Must be positive. Sum across all sections should be within ± 30 seconds of the SDS `constraints.duration_sec`.

### Field: `mix`
- **Type**: object
- **Description**: Mix and audio engineering preferences that inform post-processing tools.
- **Required**: No
- **Constraints**: All sub-fields are optional.

#### Field: `mix.lufs`
- **Type**: number
- **Description**: Target loudness in LUFS (Loudness Units relative to Full Scale). Informs audio post-processing.
- **Required**: No
- **Constraints**: Typical values range from -14 to -8 LUFS for streaming platforms.

#### Field: `mix.space`
- **Type**: string
- **Description**: Description of space and reverb character (e.g., `dry`, `roomy`, `lush`, `vintage tape`). Influences the perceived acoustic environment.
- **Required**: No
- **Constraints**: Free-form string; should be descriptive and concise.

#### Field: `mix.stereo_width`
- **Type**: string
- **Description**: Desired stereo spread of the mix. Influences final mix width and spatial perception.
- **Required**: No
- **Constraints**: Must be one of: `narrow`, `normal`, `wide`.

## Example

```json
{
  "structure": "Intro–Verse–Pre-Chorus–Chorus–Verse–Pre-Chorus–Chorus–Bridge–Chorus–Outro",
  "hooks": 2,
  "instrumentation": ["sleigh bells", "upright bass", "brass stabs", "guitar solo in bridge"],
  "section_meta": {
    "Intro": {
      "tags": ["instrumental", "low energy"],
      "target_duration_sec": 10
    },
    "Verse": {
      "tags": ["storytelling"],
      "target_duration_sec": 30
    },
    "Pre-Chorus": {
      "tags": ["build-up", "handclaps"],
      "target_duration_sec": 15
    },
    "Chorus": {
      "tags": ["anthemic", "hook-forward"],
      "target_duration_sec": 25
    },
    "Bridge": {
      "tags": ["minimal", "dramatic"],
      "target_duration_sec": 20
    },
    "Outro": {
      "tags": ["fade-out"],
      "target_duration_sec": 10
    }
  },
  "mix": {
    "lufs": -12.0,
    "space": "lush",
    "stereo_width": "wide"
  }
}
```
