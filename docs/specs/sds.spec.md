# Song Design Spec (SDS) - JSON Specification

## Overview

The **Song Design Spec (SDS)** is a single, unified JSON specification that aggregates all entity definitions needed for the MeatyMusic workflow. It provides the Claude Code orchestration system with complete information to plan, generate, style, arrange, and validate a song. The SDS ensures deterministic behavior and full reproducibility—the same SDS with the same seed will always produce identical outputs.

The SDS is submitted by the frontend after collecting inputs across style, lyrics, producer notes, persona, and sources editors. Once submitted, it triggers a complete workflow run that progresses through PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → (FIX)* → RENDER → REVIEW.

## Schema

### Root Properties

#### Field: `title`
- **Type**: `string`
- **Description**: The name of the song being composed.
- **Required**: Yes
- **Constraints**: Non-empty string

#### Field: `blueprint_ref`
- **Type**: `object`
- **Description**: Reference to the genre blueprint and its version that governs this song's composition.
- **Required**: Yes
- **Sub-properties**:
  - `genre` (string, required): The primary genre (e.g., "Pop", "Country", "Hip-Hop", "Christmas Pop")
  - `version` (string, required): Semantic version of the blueprint (e.g., "2025.11")
- **Constraints**: Both genre and version must be present; blueprint must exist in the system

#### Field: `style`
- **Type**: `object` (Style entity)
- **Description**: Complete style specification covering genre, tempo, key, mood, energy, instrumentation, and tags that define the sonic characteristics of the song.
- **Required**: Yes
- **Sub-properties** (from style schema):
  - `genre_detail` (object): Primary genre, subgenres, and fusions
  - `tempo_bpm` (array): [min, max] BPM range
  - `key` (object): Primary key and modulations
  - `mood` (array): Emotional/contextual descriptors (e.g., "upbeat", "introspective")
  - `energy` (string): Overall energy level (e.g., "anthemic", "intimate")
  - `instrumentation` (array): List of instruments
  - `tags` (array): Structured tags (e.g., "Era:2010s", "Rhythm:four-on-the-floor")
  - `negative_tags` (array): Tags to explicitly avoid (e.g., "muddy low-end")

#### Field: `lyrics`
- **Type**: `object` (Lyrics entity)
- **Description**: Structural and stylistic constraints for lyric generation, including language, POV, rhyme scheme, meter, hook strategy, and section requirements.
- **Required**: Yes
- **Sub-properties** (from lyrics schema):
  - `language` (string): ISO 639-1 language code (e.g., "en", "es", "fr")
  - `pov` (string): Point of view ("1st", "2nd", "3rd", "collective")
  - `tense` (string): Narrative tense ("past", "present", "future")
  - `themes` (array): Lyrical themes and topics
  - `rhyme_scheme` (string): Pattern (e.g., "AABB", "ABAB", "AABCCB")
  - `meter` (string): Time signature and style (e.g., "4/4 pop", "3/4 waltz")
  - `syllables_per_line` (integer): Target syllable count
  - `hook_strategy` (string): Approach to hooks ("chant", "melodic", "call-response")
  - `repetition_policy` (string): Repetition guidelines ("hook-heavy", "varied", "minimal")
  - `imagery_density` (number): 0.0–1.0 scale for lyrical imagery
  - `section_order` (array): Ordered sequence of sections (e.g., ["Intro", "Verse", "Chorus", "Bridge"])
  - `constraints` (object): Explicit content flag, max lines, section-specific requirements
  - `source_citations` (array): Weighted references to source documents for RAG

#### Field: `producer_notes`
- **Type**: `object` (Producer Notes entity)
- **Description**: Arrangement, instrumentation, section-specific guidance, and mix targets for production.
- **Required**: Yes
- **Sub-properties** (from producer notes schema):
  - `structure` (string): Human-readable arrangement structure (e.g., "Intro–Verse–Pre-Chorus–Chorus–Bridge–Outro")
  - `hooks` (integer): Number of distinct hooks to emphasize
  - `instrumentation` (array): Key instruments for the track
  - `section_meta` (object): Per-section metadata (tags, target duration, instrumentation)
  - `mix` (object): Mix targets (LUFS, space/reverb, stereo width)

#### Field: `persona_id`
- **Type**: `string | null`
- **Description**: UUID of an optional artist persona that influences vocal characteristics, influences, and stylistic choices. `null` if no persona is associated.
- **Required**: No (optional, can be null)
- **Constraints**: If provided, must reference an existing persona record

#### Field: `sources`
- **Type**: `array` of objects (Source entities)
- **Description**: Array of retrieval-augmented generation (RAG) sources—files, APIs, or MCP servers—that provide context and references for lyric generation.
- **Required**: Yes
- **Sub-properties** (for each source):
  - `name` (string): Human-readable source name
  - `kind` (string): Type of source ("file", "api", "web", "mcp")
  - `config` (object): Source-specific configuration (file path, base URL, etc.)
  - `scopes` (array): Semantic scopes or categories within the source
  - `weight` (number): Relative importance (0.0–1.0); weights across all sources are normalized to sum to 1.0
  - `allow` (array): Inclusion list of keywords/entities to retrieve
  - `deny` (array): Exclusion list of keywords/entities to avoid
  - `provenance` (boolean): Whether to include source hashes and citations in output
  - `mcp_server_id` (string): Identifier for the MCP server managing this source

#### Field: `prompt_controls`
- **Type**: `object`
- **Description**: Additional instructions and character limits for final prompt composition, including positive/negative tags and model-specific limits.
- **Required**: Yes
- **Sub-properties**:
  - `positive_tags` (array): Additional tags to include in the final prompt
  - `negative_tags` (array): Additional tags to exclude from the final prompt
  - `max_style_chars` (integer): Character limit for style section of composed prompt
  - `max_prompt_chars` (integer): Total character limit for the complete prompt

#### Field: `render`
- **Type**: `object`
- **Description**: Configuration for the target music rendering engine, including which engine to use, model variant, and number of variations to generate.
- **Required**: Yes
- **Sub-properties**:
  - `engine` (string): Target render engine; one of "suno", "none", or "external"
  - `model` (string | null): Optional model variant for the engine (e.g., "v3", "v4")
  - `num_variations` (integer): Number of variations to generate; range 1–8, default 2

#### Field: `seed`
- **Type**: `integer`
- **Description**: Global seed for deterministic behavior; ensures that the same SDS and seed always produce identical outputs.
- **Required**: Yes
- **Constraints**: Must be a non-negative integer; each workflow node uses `seed` or `seed + node_index`

## Validation Rules

- **All Required Fields**: `title`, `blueprint_ref`, `style`, `lyrics`, `producer_notes`, `sources`, `prompt_controls`, `render`, and `seed` must be present.
- **Nested Requirements**: `blueprint_ref.genre` and `blueprint_ref.version` are both required.
- **Source Weight Normalization**: Weights across all sources must sum to 1.0. If provided weights do not sum to 1.0, the system normalizes them automatically. Negative or zero weights are not allowed for individual sources.
- **Engine Limits**: If `render.engine = "suno"`, `prompt_controls.max_style_chars` and `prompt_controls.max_prompt_chars` must be set to match Suno's model limits.
- **Seed Validity**: `seed` must be a non-negative integer.
- **Num Variations**: Must be between 1 and 8.

## Example

```json
{
  "title": "Elf On Overtime",
  "blueprint_ref": {
    "genre": "Christmas Pop",
    "version": "2025.11"
  },
  "style": {
    "genre_detail": {
      "primary": "Christmas Pop",
      "subgenres": ["Big Band Pop"],
      "fusions": ["Electro Swing"]
    },
    "tempo_bpm": [116, 124],
    "key": {
      "primary": "C major",
      "modulations": ["E major"]
    },
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
      "section_requirements": {
        "Chorus": {
          "min_lines": 6,
          "must_end_with_hook": true
        }
      }
    },
    "source_citations": [
      {
        "source_id": "uuid-family",
        "weight": 0.6
      },
      {
        "source_id": "uuid-asoiaf",
        "weight": 0.4
      }
    ]
  },
  "producer_notes": {
    "structure": "Intro–Verse–Pre-Chorus–Chorus–Verse–Pre-Chorus–Chorus–Bridge–Chorus",
    "hooks": 2,
    "instrumentation": ["sleigh bells", "upright bass", "brass stabs"],
    "section_meta": {
      "Intro": {
        "tags": ["instrumental", "low energy"],
        "target_duration_sec": 10
      },
      "Verse": {
        "tags": ["storytelling"],
        "target_duration_sec": 30
      },
      "PreChorus": {
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
  },
  "persona_id": null,
  "sources": [
    {
      "name": "Family History Document",
      "kind": "file",
      "config": {
        "file_path": "/documents/family_story.md"
      },
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
      "config": {
        "base_url": "https://anapioficeandfire.com/api"
      },
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
  "render": {
    "engine": "none",
    "model": null,
    "num_variations": 2
  },
  "seed": 42
}
```

## Integration Notes

- **Frontend**: The SDS preview is shown in the final step before submission. Users can expand each section to view nested JSON and edit any entity in real time; the SDS preview updates automatically.
- **Workflow**: Submitting the SDS triggers a complete Claude Code workflow run. Real-time status updates are available via WebSocket at `/events`.
- **Storage**: After workflow completion, the SDS is persisted with the resulting style, lyric, producer, and composed prompts, along with rubric scores, citations, and audio assets.
- **Cloning**: Users can clone any completed SDS to experiment with variations, changing individual fields or the seed to explore alternative compositions.

## References

- **Blueprint**: For genre-specific rules, constraints, and scoring thresholds, see the appropriate blueprint in `docs/hit_song_blueprint/AI/` (e.g., `pop_blueprint.md`, `country_blueprint.md`).
- **Style PRD**: `docs/project_plans/PRDs/style.prd.md`
- **Lyrics PRD**: `docs/project_plans/PRDs/lyrics.prd.md`
- **Producer Notes PRD**: `docs/project_plans/PRDs/producer_notes.prd.md`
- **Sources PRD**: `docs/project_plans/PRDs/sources.prd.md`
- **Orchestration**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`
