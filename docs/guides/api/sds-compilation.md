# SDS Compilation API Documentation

## Overview

The SDS Compilation API provides endpoints for creating songs and compiling Song Design Specs (SDS). When you create a song, MeatyMusic automatically aggregates your style, lyrics, producer notes, and blueprint entity references into a validated, deterministic SDS JSON dictionary.

The SDS is the single source of truth for all song data and serves as input to the orchestration workflow for music generation.

### What is an SDS?

A Song Design Spec (SDS) is a complete, validated JSON dictionary containing all the information needed to compose and render a song:

- **Style**: Genre, BPM, key, mood, instrumentation, and production tags
- **Lyrics**: Sections (verse, chorus, etc.), rhyme scheme, POV, and imagery
- **Producer Notes**: Arrangement, structure, and mix targets
- **Blueprint**: Genre-specific constraints and rules
- **Sources**: External knowledge base references with weights and permissions
- **Render Configuration**: Render engine, model, and variation count

### SDS Compilation Flow

1. **Input**: You provide entity references (style_id, lyrics_id, etc.)
2. **Aggregation**: MeatyMusic fetches all referenced entities from the database
3. **Validation**: The SDS is validated against:
   - JSON schema structure
   - Blueprint-specific constraints (BPM, sections, lexicon)
   - Cross-entity consistency (genre matching, section alignment)
4. **Normalization**: Source weights are normalized to sum to 1.0
5. **Storage**: The compiled SDS is stored in the song's metadata
6. **Output**: Complete SDS JSON dictionary is returned

---

## POST /songs - Create Song with SDS Compilation

### Endpoint

```
POST /api/v1/songs
```

### Description

Creates a new song and automatically compiles its Song Design Spec from referenced entities. The endpoint performs comprehensive validation of the SDS against blueprint constraints and cross-entity consistency rules before storing the compiled SDS in the song record.

If any validation fails, the song creation is rolled back and an error is returned to the client.

### Authentication

Requires valid authentication (Clerk JWT token). RLS enforces that users can only create songs in their own tenant.

### Request

#### Headers

```
Content-Type: application/json
Authorization: Bearer {token}
```

#### Body

```typescript
interface CreateSongRequest {
  // Required fields
  title: string;              // Song title (1-500 chars)
  global_seed: number;        // Random seed for determinism (≥ 0)
  blueprint_id: UUID;         // Reference to Blueprint entity (required for SDS compilation)

  // Optional entity references
  style_id?: UUID;            // Reference to Style entity (required for SDS compilation)
  persona_id?: UUID;          // Reference to Persona entity (optional)

  // Optional configuration
  sds_version?: string;       // SDS schema version (default: "1.0.0")
  status?: SongStatus;        // Initial song status (default: "draft")
  render_config?: {           // Render engine configuration
    engine?: "suno" | "udio" | "none" | "external";
    model?: string;
    num_variations?: number;
  };
  feature_flags?: {};         // Feature flag overrides
  extra_metadata?: {};        // Additional metadata (arbitrary JSON)
}
```

### Request Examples

#### Minimal Example (Required Fields Only)

```bash
curl -X POST http://localhost:8000/api/v1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "title": "Midnight Dreams",
    "global_seed": 42,
    "blueprint_id": "550e8400-e29b-41d4-a716-446655440000",
    "style_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

#### Complete Example (All Fields)

```bash
curl -X POST http://localhost:8000/api/v1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "title": "Midnight Dreams",
    "global_seed": 42,
    "blueprint_id": "550e8400-e29b-41d4-a716-446655440000",
    "style_id": "550e8400-e29b-41d4-a716-446655440001",
    "persona_id": "550e8400-e29b-41d4-a716-446655440002",
    "sds_version": "1.0.0",
    "status": "draft",
    "render_config": {
      "engine": "suno",
      "model": "v4",
      "num_variations": 2
    },
    "feature_flags": {
      "auto_fix_enabled": true
    },
    "extra_metadata": {
      "client_version": "2.1.0",
      "ui_context": "web_editor"
    }
  }'
```

### Response

#### Success Response (201 Created)

```typescript
interface CreateSongResponse {
  id: UUID;                           // Song ID
  title: string;                      // Song title
  global_seed: number;                // Global seed used
  status: string;                     // Song status
  sds_version: string;                // SDS version
  style_id: UUID | null;              // Style entity reference
  blueprint_id: UUID | null;          // Blueprint entity reference
  persona_id: UUID | null;            // Persona entity reference
  tenant_id: UUID;                    // Tenant ID (set from auth context)
  owner_id: UUID;                     // Owner ID (set from auth context)

  extra_metadata: {
    compiled_sds: {                   // Complete compiled SDS dictionary
      title: string;
      blueprint_ref: {
        genre: string;
        version: string;
      };
      style: StyleSpec;
      lyrics: LyricsSpec;
      producer_notes: ProducerNotesSpec;
      persona_id: string | null;
      sources: SourceSpec[];
      prompt_controls: PromptControls;
      render: RenderConfig;
      seed: number;
      _computed_hash?: string;        // SHA-256 hash for determinism verification
    };
    sds_hash?: string;                // Hash of compiled SDS
    compilation_version?: string;     // SDS compilation version
  };

  created_at: string;                 // ISO 8601 timestamp
  updated_at: string;                 // ISO 8601 timestamp
  deleted_at: string | null;          // Soft delete timestamp
  render_config?: {
    engine: string;
    model?: string;
    num_variations?: number;
  };
  feature_flags: {};                  // Feature flags
}
```

#### Success Response Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "title": "Midnight Dreams",
  "global_seed": 42,
  "status": "draft",
  "sds_version": "1.0.0",
  "style_id": "550e8400-e29b-41d4-a716-446655440001",
  "blueprint_id": "550e8400-e29b-41d4-a716-446655440000",
  "persona_id": "550e8400-e29b-41d4-a716-446655440002",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440100",
  "owner_id": "550e8400-e29b-41d4-a716-446655440101",
  "extra_metadata": {
    "compiled_sds": {
      "title": "Midnight Dreams",
      "blueprint_ref": {
        "genre": "Pop",
        "version": "2025.11"
      },
      "style": {
        "genre_detail": {
          "primary": "Pop",
          "secondary": ["Electronic"]
        },
        "tempo_bpm": 120,
        "key": "C Major",
        "mood": ["Dreamy", "Melancholic"],
        "production_style": "Synthetic",
        "instrumentation": ["Synth", "Drums", "Bass"],
        "tags": ["atmospheric", "dreamy", "electronic"],
        "energy_level": 7
      },
      "lyrics": {
        "theme": "Lost love in the night",
        "pov": "First person",
        "section_order": ["Verse", "Pre-Chorus", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
        "constraints": {
          "explicit": false,
          "rhyme_scheme": "AABB"
        },
        "source_citations": [
          {
            "section": "Chorus",
            "source_id": "memory_snippets",
            "confidence": 0.95
          }
        ]
      },
      "producer_notes": {
        "structure": "Verse – Pre-Chorus – Chorus – Verse – Pre-Chorus – Chorus – Bridge – Chorus",
        "arrangement_notes": "Start sparse with synth, build with drums in second verse",
        "mix_targets": {
          "vocals": -3,
          "drums": -6,
          "bass": -9
        }
      },
      "persona_id": "550e8400-e29b-41d4-a716-446655440002",
      "sources": [
        {
          "name": "memory_snippets",
          "kind": "vector",
          "config": {
            "collection": "user_memories",
            "embedding_model": "text-embedding-3-large"
          },
          "scopes": ["lyrics", "theme"],
          "weight": 0.5,
          "allow": ["emotional_words", "metaphors"],
          "deny": ["explicit_content"],
          "provenance": true,
          "mcp_server_id": "vector-db-1"
        },
        {
          "name": "hit_song_reference",
          "kind": "web",
          "config": {
            "url": "https://music.example.com/api"
          },
          "scopes": ["structure", "production"],
          "weight": 0.5,
          "allow": ["composition_techniques"],
          "deny": ["copyright_protected_content"],
          "provenance": true,
          "mcp_server_id": null
        }
      ],
      "prompt_controls": {
        "positive_tags": ["atmospheric", "dreamy"],
        "negative_tags": ["harsh", "loud"],
        "max_style_chars": 1000,
        "max_prompt_chars": 5000
      },
      "render": {
        "engine": "suno",
        "model": "v4",
        "num_variations": 2
      },
      "seed": 42,
      "_computed_hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
    },
    "sds_hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "compilation_version": "1.0"
  },
  "created_at": "2025-11-14T15:30:00Z",
  "updated_at": "2025-11-14T15:30:00Z",
  "deleted_at": null,
  "render_config": {
    "engine": "suno",
    "model": "v4",
    "num_variations": 2
  },
  "feature_flags": {
    "auto_fix_enabled": true
  }
}
```

### Error Responses

#### 400 Bad Request - SDS Compilation Failed

**Cause**: Entity reference validation failed or entity not found in database.

```bash
curl -X POST http://localhost:8000/api/v1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "title": "Test Song",
    "global_seed": 42,
    "blueprint_id": "550e8400-e29b-41d4-a716-446655440000",
    "style_id": "00000000-0000-0000-0000-000000000000"
  }'
```

Response:

```json
{
  "error": {
    "code": "SDS_COMPILATION_FAILED",
    "message": "SDS compilation failed: Style specification is required but not found"
  },
  "request_id": "req_uuid_here"
}
```

**How to Fix**: Verify that all entity IDs (style_id, blueprint_id) exist and are accessible in your tenant:
- Check the entity exists: `GET /api/v1/styles/{style_id}`
- Verify you own the entity
- Use correct UUID format

#### 400 Bad Request - Blueprint Validation Failed

**Cause**: SDS violates blueprint-specific constraints (BPM range, required sections, etc.).

```bash
curl -X POST http://localhost:8000/api/v1/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "title": "Too Fast",
    "global_seed": 42,
    "blueprint_id": "pop_blueprint_id",
    "style_id": "style_id_with_180bpm"
  }'
```

Response:

```json
{
  "error": {
    "code": "BLUEPRINT_VALIDATION_FAILED",
    "message": "Blueprint validation failed: BPM 180 outside blueprint range [60, 140]; Missing required sections: Pre-Chorus"
  },
  "request_id": "req_uuid_here"
}
```

**How to Fix**: Adjust your entities to comply with the blueprint:
- **BPM violations**: Change the style's tempo_bpm to be within the blueprint's range
- **Missing sections**: Add the required section to your lyrics
- **Banned terms**: Remove banned terms from lyrics if explicit content is not allowed

#### 400 Bad Request - Cross-Entity Validation Failed

**Cause**: Entities are inconsistent with each other.

```json
{
  "error": {
    "code": "CROSS_ENTITY_VALIDATION_FAILED",
    "message": "Cross-entity validation failed: Genre mismatch: blueprint 'Pop' != style 'Rock'; Producer notes references section 'Bridge' not in lyrics"
  },
  "request_id": "req_uuid_here"
}
```

**How to Fix**:
- **Genre mismatch**: Change the style's primary genre to match the blueprint's genre
- **Section alignment**: Ensure all sections mentioned in producer notes exist in lyrics
- **Source citations**: Verify all cited sources are in the sources list

#### 404 Not Found - Entity Not Found

**Cause**: Referenced entity (style, blueprint, etc.) doesn't exist or is not accessible.

```json
{
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "Style 550e8400-e29b-41d4-a716-999999999999 not found"
  },
  "request_id": "req_uuid_here"
}
```

**How to Fix**: Verify the entity ID exists and belongs to your organization.

---

## GET /songs/{song_id}/sds - Retrieve Compiled SDS

### Endpoint

```
GET /api/v1/songs/{song_id}/sds
```

### Description

Retrieves the compiled Song Design Spec for a song. By default, returns the cached SDS from the song's metadata if available. Optionally forces recompilation from the current entity state.

### Authentication

Requires valid authentication (Clerk JWT token). RLS enforces that users can only retrieve their own songs.

### Path Parameters

```typescript
interface GetSongSDSParams {
  song_id: UUID;  // Song UUID
}
```

### Query Parameters

```typescript
interface GetSongSDSQuery {
  recompile?: boolean;  // Force recompilation (default: false)
}
```

### Query Parameter Details

- **recompile** (optional, default: false)
  - `false`: Return cached SDS from `song.extra_metadata.compiled_sds` if available
  - `true`: Force recompilation from current entity state
  - Use `true` when you've updated referenced entities and want the latest SDS

### Request Examples

#### Get Cached SDS

```bash
curl -X GET http://localhost:8000/api/v1/songs/550e8400-e29b-41d4-a716-446655440010/sds \
  -H "Authorization: Bearer your_token_here"
```

#### Force Recompilation

```bash
curl -X GET http://localhost:8000/api/v1/songs/550e8400-e29b-41d4-a716-446655440010/sds?recompile=true \
  -H "Authorization: Bearer your_token_here"
```

### Response

#### Success Response (200 OK)

Returns the complete SDS dictionary (see structure in POST response example above).

```typescript
interface SDS {
  title: string;
  blueprint_ref: BlueprintRef;
  style: StyleSpec;
  lyrics: LyricsSpec;
  producer_notes: ProducerNotesSpec;
  persona_id: string | null;
  sources: SourceSpec[];
  prompt_controls: PromptControls;
  render: RenderConfig;
  seed: number;
  _computed_hash?: string;
}
```

#### Success Response Example

```json
{
  "title": "Midnight Dreams",
  "blueprint_ref": {
    "genre": "Pop",
    "version": "2025.11"
  },
  "style": {
    "genre_detail": {
      "primary": "Pop",
      "secondary": ["Electronic"]
    },
    "tempo_bpm": 120,
    "key": "C Major",
    "mood": ["Dreamy", "Melancholic"],
    "production_style": "Synthetic",
    "instrumentation": ["Synth", "Drums", "Bass"],
    "tags": ["atmospheric", "dreamy", "electronic"],
    "energy_level": 7
  },
  "lyrics": {
    "theme": "Lost love in the night",
    "pov": "First person",
    "section_order": ["Verse", "Pre-Chorus", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]
  },
  "producer_notes": {
    "structure": "Verse – Pre-Chorus – Chorus – Verse – Pre-Chorus – Chorus – Bridge – Chorus",
    "arrangement_notes": "Start sparse with synth, build with drums in second verse"
  },
  "persona_id": "550e8400-e29b-41d4-a716-446655440002",
  "sources": [
    {
      "name": "memory_snippets",
      "kind": "vector",
      "weight": 0.5,
      "scopes": ["lyrics", "theme"]
    },
    {
      "name": "hit_song_reference",
      "kind": "web",
      "weight": 0.5,
      "scopes": ["structure", "production"]
    }
  ],
  "prompt_controls": {
    "positive_tags": ["atmospheric", "dreamy"],
    "negative_tags": ["harsh", "loud"],
    "max_style_chars": 1000,
    "max_prompt_chars": 5000
  },
  "render": {
    "engine": "suno",
    "model": "v4",
    "num_variations": 2
  },
  "seed": 42,
  "_computed_hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

### Error Responses

#### 404 Not Found - Song Not Found

**Cause**: Song with the specified ID doesn't exist or is not accessible.

```bash
curl -X GET http://localhost:8000/api/v1/songs/00000000-0000-0000-0000-000000000000/sds \
  -H "Authorization: Bearer your_token_here"
```

Response:

```json
{
  "error": {
    "code": "SONG_NOT_FOUND",
    "message": "Song 00000000-0000-0000-0000-000000000000 not found"
  },
  "request_id": "req_uuid_here"
}
```

#### 400 Bad Request - SDS Compilation Failed

**Cause**: Recompilation requested but entity references are invalid or missing.

```bash
curl -X GET http://localhost:8000/api/v1/songs/550e8400-e29b-41d4-a716-446655440010/sds?recompile=true \
  -H "Authorization: Bearer your_token_here"
```

Response:

```json
{
  "error": {
    "code": "SDS_COMPILATION_FAILED",
    "message": "SDS compilation failed: Style specification is required but not found"
  },
  "request_id": "req_uuid_here"
}
```

**How to Fix**: Verify that all referenced entities still exist and are valid.

---

## SDS Structure Documentation

The SDS is a comprehensive JSON dictionary containing all music generation inputs. This section documents each field in detail.

### Root Level Fields

```typescript
interface SDS {
  title: string;                        // Song title (1-500 chars)
  blueprint_ref: BlueprintRef;          // Reference to blueprint constraints
  style: StyleSpec;                     // Complete style specification
  lyrics: LyricsSpec;                   // Complete lyrics specification
  producer_notes: ProducerNotesSpec;    // Arrangement and mix guidance
  persona_id: string | null;            // Optional artist persona UUID
  sources: SourceSpec[];                // External knowledge sources (weights normalized to 1.0)
  prompt_controls: PromptControls;      // Positive/negative tags and limits
  render: RenderConfig;                 // Render engine configuration
  seed: number;                         // Global seed for determinism
  _computed_hash?: string;              // SHA-256 hash for reproducibility (auto-generated)
}
```

### BlueprintRef

Reference to the genre blueprint that defined the constraints used in SDS compilation.

```typescript
interface BlueprintRef {
  genre: string;    // Genre name (e.g., "Pop", "Hip-Hop", "Rock")
  version: string;  // Version in YYYY.MM format (e.g., "2025.11")
}
```

### StyleSpec

Complete musical style specification with genre, tempo, instrumentation, and production tags.

```typescript
interface StyleSpec {
  genre_detail: {
    primary: string;        // Primary genre
    secondary?: string[];   // Secondary genres
  };
  tempo_bpm: number | number[];  // BPM (single value or range)
  key: string;              // Musical key (e.g., "C Major", "Am")
  mood: string[];           // Mood descriptors (e.g., ["Dreamy", "Melancholic"])
  production_style: string; // Production approach (e.g., "Synthetic", "Organic")
  instrumentation: string[]; // Instruments used
  tags: string[];           // Production tags (filtered for conflicts)
  energy_level: number;     // 1-10 scale

  // Optional fields
  vocal_style?: string;
  effects?: string[];
  references?: string[];    // Influence references
}
```

### LyricsSpec

Lyrics structure with sections, constraints, and source citations.

```typescript
interface LyricsSpec {
  theme: string;                      // Song theme/concept
  pov: string;                        // Point of view (e.g., "First person")
  imagery: string;                    // Imagery style
  section_order: string[];            // Section sequence (e.g., ["Verse", "Chorus", "Bridge"])
  constraints: {
    explicit: boolean;                // Whether explicit content allowed
    rhyme_scheme?: string;            // Rhyme pattern (e.g., "AABB")
    meter?: string;                   // Poetic meter
    syllables_per_line?: number;      // Expected syllable count
    section_requirements?: {
      [section: string]: {
        min_lines?: number;
        max_lines?: number;
        rhyme_scheme?: string;
      };
    };
  };
  source_citations: Array<{
    section?: string;                 // Section where citation applies
    source_id: string;                // Source name
    confidence?: number;              // 0-1 confidence score
  }>;
}
```

### ProducerNotesSpec

Arrangement, structure, and mix guidance.

```typescript
interface ProducerNotesSpec {
  structure: string;                   // Section sequence (e.g., "Verse – Chorus – Bridge – Chorus")
  arrangement_notes: string;           // Instrumentation and arrangement guidance
  mix_targets?: {                      // Approximate dB levels
    vocals?: number;
    drums?: number;
    bass?: number;
    synth?: number;
    other?: number;
  };
  dynamics?: string;                   // Dynamic progression notes
  transitions?: string;                // Transition techniques
}
```

### SourceSpec

External knowledge source for RAG (Retrieval Augmented Generation).

```typescript
interface SourceSpec {
  name: string;                    // Source identifier (e.g., "memory_snippets")
  kind: "vector" | "web" | "api" | "file" | "mcp";  // Source type
  config?: Record<string, any>;    // Source-specific configuration
  scopes: string[];               // Usage scopes (e.g., ["lyrics", "structure"])
  weight: number;                 // Normalized weight (sum of all weights = 1.0)
  allow?: string[];               // Allowed term categories
  deny?: string[];                // Disallowed term categories
  provenance: boolean;            // Whether citations required
  mcp_server_id?: string;         // MCP server ID if applicable
}
```

### PromptControls

Tags and character limits for prompt generation.

```typescript
interface PromptControls {
  positive_tags: string[];           // Tags to emphasize
  negative_tags: string[];           // Tags to avoid
  max_style_chars: number;           // Max chars for style section (default: 1000)
  max_prompt_chars: number;          // Max chars for complete prompt (default: 5000)
}
```

### RenderConfig

Render engine configuration.

```typescript
interface RenderConfig {
  engine: "suno" | "udio" | "none" | "external";  // Target render engine
  model?: string;                    // Engine-specific model (e.g., "v4" for Suno)
  num_variations?: number;           // Number of variations to generate (default: 2)
}
```

---

## Validation Rules Reference

This section documents all validation rules applied during SDS compilation.

### 1. JSON Schema Validation

All SDS data must conform to the JSON schema defined in `/schemas/sds.schema.json`. This validates:

- **Required fields**: All root-level required fields must be present
- **Type constraints**: Each field has a defined type and constraints
- **Value constraints**:
  - `title`: 1-500 characters
  - `global_seed`: integer ≥ 0
  - `tempo_bpm`: varies by genre
  - `energy_level`: 1-10
  - Source weights: sum to 1.0 (automatically normalized)

### 2. Blueprint Constraints

Validated against the blueprint's rules. Blueprint defines:

- **BPM Range**: Valid tempo range for the genre
- **Required Sections**: Sections that must appear in lyrics
- **Banned Terms**: Terms not allowed (applies only if `explicit=false`)
- **Section Requirements**: Min/max lines and rhyme schemes per section
- **Lexicon Constraints**: Allowed and disallowed terms

**Example Blueprint Rules (Pop)**:

```json
{
  "genre": "Pop",
  "rules": {
    "tempo_bpm": [80, 140],
    "required_sections": ["Verse", "Chorus", "Bridge"],
    "section_lines": {
      "Verse": { "min": 4, "max": 8 },
      "Chorus": { "min": 4, "max": 8 },
      "Pre-Chorus": { "min": 2, "max": 4 }
    },
    "banned_terms": ["explicit_word_1", "explicit_word_2"]
  }
}
```

### 3. Tag Conflict Resolution

The style tags are validated against the conflict matrix. Conflicting tags are automatically resolved by:

1. Loading the conflict matrix from `/taxonomies/conflict_matrix.json`
2. Identifying all conflicting tag pairs
3. Dropping lower-weight tags to resolve conflicts

**Example Conflicts**:

```json
{
  "conflicts": [
    { "tag_a": "whisper", "tag_b": "anthemic" },
    { "tag_a": "acoustic", "tag_b": "heavily_produced" },
    { "tag_a": "melancholic", "tag_b": "uplifting" }
  ]
}
```

Tags are kept in weight-descending order. If "whisper" (weight 0.3) and "anthemic" (weight 0.8) conflict, "anthemic" is kept and "whisper" is dropped.

### 4. Cross-Entity Consistency

Validates that entities are internally consistent:

#### Genre Consistency

```
blueprint.genre == style.genre_detail.primary
```

Example: If blueprint is "Pop", style's primary genre must be "Pop".

#### Section Alignment

All sections mentioned in `producer_notes.structure` must exist in `lyrics.section_order`.

Example:
- Producer notes: "Verse – Pre-Chorus – Chorus – Bridge – Chorus"
- Lyrics must have sections: ["Verse", "Pre-Chorus", "Chorus", "Bridge"]

#### Source Citations

All sources cited in `lyrics.source_citations[].source_id` must exist in `sds.sources[].name`.

Example:
- Citation: `{ "source_id": "memory_snippets", ... }`
- Sources must include: `{ "name": "memory_snippets", ... }`

### 5. Source Weight Normalization

Source weights are automatically normalized to sum to 1.0:

**Formula**:
```
w_normalized = w / sum(all_weights)
```

**Example**:
```
Input weights:  [0.5, 0.5, 1.0]  (sum = 2.0)
Output weights: [0.25, 0.25, 0.5]  (sum = 1.0)
```

**Edge Cases**:
- **All zero weights**: Equal distribution (weight = 1.0 / num_sources)
- **Negative weights**: Treated as zero
- **Single source**: Weight automatically set to 1.0

---

## Error Messages Guide

### Compilation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Style specification is required but not found` | style_id references non-existent or inaccessible Style | Verify style_id exists: `GET /api/v1/styles/{style_id}` |
| `Blueprint is required but not found` | blueprint_id references non-existent or inaccessible Blueprint | Verify blueprint_id exists: `GET /api/v1/blueprints/{blueprint_id}` |
| `Lyrics specification is required but not found` | No lyrics associated with song | Create lyrics and associate with song |
| `Producer notes is required but not found` | No producer notes associated with song | Create producer notes and associate with song |
| `SDS validation failed: ...` | Compiled SDS fails JSON schema validation | See validation error details for specific field |

### Blueprint Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `BPM {value} outside blueprint range [{min}, {max}]` | Style's BPM not in range | Adjust style.tempo_bpm to be within range |
| `Missing required sections: {list}` | Lyrics missing blueprint-required sections | Add missing sections to lyrics.section_order |
| `Section '{name}' requires line count constraints (min: {value})` | Section has too few lines | Expand section in lyrics to meet minimum |

### Cross-Entity Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Genre mismatch: blueprint '{genre1}' != style '{genre2}'` | Blueprint and style genres differ | Change style.genre_detail.primary to match blueprint |
| `Producer notes references sections not in lyrics: {list}` | Producer notes mentions sections that don't exist | Remove section from producer_notes.structure or add to lyrics |
| `Lyrics cites source '{name}' which is not in sources list` | Citation references non-existent source | Add source to song's sources or update citation |

### Common HTTP Errors

| Status | Error Code | Meaning |
|--------|-----------|---------|
| 400 | SDS_COMPILATION_FAILED | Entity reference missing or invalid |
| 400 | BLUEPRINT_VALIDATION_FAILED | SDS violates blueprint constraints |
| 400 | CROSS_ENTITY_VALIDATION_FAILED | Entities inconsistent with each other |
| 404 | SONG_NOT_FOUND | Song with ID doesn't exist |
| 404 | ENTITY_NOT_FOUND | Referenced entity (style, blueprint, etc.) doesn't exist |
| 403 | FORBIDDEN | User doesn't have access to entity (RLS) |

---

## Determinism & Reproducibility

The SDS includes a `_computed_hash` field for verifying reproducibility. This SHA-256 hash is computed from the canonical JSON representation of the SDS (with sorted keys).

### Using the Hash

```typescript
// First compilation
const sds1 = await fetch(`/api/v1/songs/{id}/sds`);
const hash1 = sds1._computed_hash;

// Second compilation with same inputs
const sds2 = await fetch(`/api/v1/songs/{id}/sds?recompile=true`);
const hash2 = sds2._computed_hash;

// Should be identical
console.assert(hash1 === hash2, "SDS not reproducible!");
```

### Determinism Guarantees

- **Same seed + same entities** → same SDS (100% reproducibility)
- **Different seed** → different SDS (seeded randomness in prompts)
- **Different entity state** → different SDS (reflects current state)

---

## Rate Limiting

The SDS API endpoints are subject to rate limiting:

- **Rate Limit**: 100 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

Example headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1731523800
```

When rate limited (429 Too Many Requests):
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

---

## Best Practices

### 1. Always Check Cache Before Recompiling

```bash
# First call - compiles and caches
GET /api/v1/songs/{id}/sds

# Subsequent calls - uses cache
GET /api/v1/songs/{id}/sds

# Only recompile when entities changed
GET /api/v1/songs/{id}/sds?recompile=true
```

### 2. Verify Error Details

Always read error messages carefully. They tell you exactly what validation failed:

```bash
# This error message tells you exactly what's wrong
"BPM 180 outside blueprint range [80, 140]; Missing required sections: Pre-Chorus"
```

### 3. Validate Entities Before Creating Song

Before creating a song, verify entities exist:

```bash
# Check style exists
GET /api/v1/styles/{style_id}

# Check blueprint exists
GET /api/v1/blueprints/{blueprint_id}

# Then create song
POST /api/v1/songs
```

### 4. Use Consistent Seeds

For reproducible tests, use the same `global_seed`:

```bash
# Both will produce identical SDS
POST /api/v1/songs { ..., "global_seed": 42, ... }
POST /api/v1/songs { ..., "global_seed": 42, ... }
```

### 5. Handle Rollback Explicitly

When a song creation fails, the song is automatically deleted. Handle this in your client:

```typescript
try {
  const response = await fetch('/api/v1/songs', {
    method: 'POST',
    body: JSON.stringify(songData)
  });

  if (!response.ok) {
    const error = await response.json();
    // Song was rolled back, user should fix data
    console.error('Song creation failed:', error.error.message);
    // Don't try to fetch the song - it doesn't exist
    return;
  }

  const song = await response.json();
  // Song exists with compiled SDS
  console.log('Song created:', song.id);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## See Also

- **SDS Schema**: `/schemas/sds.schema.json` - Complete JSON schema
- **Blueprint PRD**: `docs/project_plans/PRDs/blueprint.prd.md` - Blueprint specification
- **Style PRD**: `docs/project_plans/PRDs/style.prd.md` - Style entity definition
- **Lyrics PRD**: `docs/project_plans/PRDs/lyrics.prd.md` - Lyrics entity definition
- **Orchestration**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md` - Workflow integration
