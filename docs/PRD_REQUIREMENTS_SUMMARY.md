# MeatyMusic PRD Requirements Summary

**Last Updated:** 2025-11-19
**Audience:** AI agents, developers, project managers
**Status:** Complete codebase analysis from 15 PRDs

---

## Table of Contents

1. [Overview](#overview)
2. [Core Entity PRDs](#core-entity-prds)
3. [System/Orchestration PRDs](#systomorchestration-prds)
4. [UI/Website App PRD](#uiwebsite-app-prd)
5. [Feature/Enhancement PRDs](#featureenhancement-prds)
6. [Future Expansions](#future-expansions)
7. [Acceptance Criteria & Quality Gates Summary](#acceptance-criteria--quality-gates-summary)

---

## Overview

MeatyMusic is the **Agentic Music Creation System (AMCS)**, a deterministic, constraint-driven music composition system that transforms structured creative intent (Song Design Spec) into validated artifacts with full traceability.

**Key System Principles:**
- Determinism: Same inputs + seed = same outputs
- Constraint Fidelity: Blueprint/rubric + policy constraints always satisfied
- Composable & Swappable: Modular, replaceable engines
- Traceability: Full provenance and scoring
- Token-Efficient: Minimal, high-density tags

---

## Core Entity PRDs

### 1. PRD – Song Design Spec (SDS)

**Purpose:** Aggregates all entity definitions into a single specification for the Claude Code workflow.

#### Feature Requirements
- **SDS v1.0 JSON Schema** containing all required and optional fields
- Aggregation of: style, lyrics, persona, producer notes, sources, prompt controls, render settings, and seed
- Real-time SDS preview in UI as users edit entities
- Download and export functionality for SDS JSON
- Support for cloning/reusing existing SDS

#### Technical Specifications
- **Required Fields:** title, blueprint_ref, style, lyrics, producer_notes, sources, prompt_controls, render, seed
- **Validation Rules:**
  - All required properties must be present
  - Source weights normalized to sum to 1.0
  - Seed must be non-negative integer
  - If `render.engine = "suno"`, enforce `max_style_chars` and `max_prompt_chars`
  - Engine-specific character limits enforced (e.g., Suno: 5000 char limit)

#### Data Model
```json
{
  "title": "string",
  "blueprint_ref": {"genre": "string", "version": "string"},
  "style": "style-1.0.json ref",
  "lyrics": "lyrics-1.0.json ref",
  "producer_notes": "producer-notes-1.0.json ref",
  "persona_id": "uuid | null",
  "sources": ["source-1.0.json array"],
  "prompt_controls": {
    "positive_tags": ["array"],
    "negative_tags": ["array"],
    "max_style_chars": "integer",
    "max_prompt_chars": "integer"
  },
  "render": {
    "engine": "suno | none | external",
    "model": "string | null",
    "num_variations": "integer (1-8)"
  },
  "seed": "integer"
}
```

#### Acceptance Tests
- Missing entity validation (cannot omit required entities)
- Weight normalization (automatic normalization of source weights)
- Determinism (same SDS + seed = identical outputs)
- Engine limits enforcement (prompts truncated/adjusted to fit limits)

---

### 2. PRD – Style Entity

**Purpose:** Encapsulates musical identity (genre, tempo, key, mood, energy, instrumentation, tags).

#### Feature Requirements
- Multi-genre support with subgenres and fusions
- Tempo specification as single value or range [min, max]
- Key specification with optional modulations
- Multi-select mood picker
- Energy level classification (low, medium, high, anthemic)
- Instrumentation list (max 3 recommended)
- Tag system with conflict detection
- UI with real-time JSON preview

#### Technical Specifications
- **Tempo Range:** 40-220 BPM (single or range)
- **Time Signature:** Default 4/4, customizable
- **Key Format:** Regex pattern `^[A-G](#|b)?\s?(major|minor)$`
- **Instrument Limit:** Warn if > 3 to avoid mix dilution
- **Tag Conflict Matrix:** Enforces non-conflicting tag combinations
- **Energy-Tempo Alignment:** Flag misalignments (e.g., "anthemic" with very slow BPM)

#### Data Model
```json
{
  "genre_detail": {
    "primary": "string (required)",
    "subgenres": ["array"],
    "fusions": ["array"]
  },
  "tempo_bpm": "integer | [integer, integer]",
  "time_signature": "string (default: 4/4)",
  "key": {
    "primary": "string (required, pattern validation)",
    "modulations": ["array"]
  },
  "mood": ["array of strings"],
  "energy": "low | medium | high | anthemic",
  "instrumentation": ["array, max 3"],
  "vocal_profile": "string (optional)",
  "tags": ["array from taxonomies"],
  "negative_tags": ["array"]
}
```

#### Acceptance Tests
- Multi-select functionality (mood, instrumentation, tags)
- Conflict detection with warnings
- JSON preview updates in real-time
- Schema validation passes

---

### 3. PRD – Lyrics Entity

**Purpose:** Defines textual content with structural and stylistic constraints (sections, rhyme, meter, hooks, imagery, citations).

#### Feature Requirements
- Multi-section support with collapsible panels per section
- Rhyme scheme specification (AABB, ABAB, AAA, etc.)
- Meter definition with syllable per line targets
- Point of view selection (1st, 2nd, 3rd)
- Tense selection (past, present, future, mixed)
- Hook strategy (melodic, lyrical, call-response, chant)
- Repetition policy (sparse, moderate, hook-heavy)
- Imagery density slider (0-1)
- Profanity filter with explicit content toggle
- Source citation weighting with live counter
- Section requirements (min/max lines, must-end-with-hook)

#### Technical Specifications
- **Required Fields:** language, section_order, constraints
- **Section Order:** Must contain at least one Chorus
- **Syllable Range:** 4-16 lines (flagged if outside range)
- **Hook Requirements:** If hook_strategy = "lyrical" or "chant", minimum 2 chorus sections
- **Repetition Policy:** If "hook-heavy", chorus min_lines >= 6
- **Profanity:** If explicit = false, filter and replace offending words
- **Weight Normalization:** Source weights sum to 1.0 or less
- **Reading Level:** Support grade-based assessment

#### Data Model
```json
{
  "language": "string (default: en)",
  "pov": "1st | 2nd | 3rd",
  "tense": "past | present | future | mixed",
  "themes": ["array"],
  "rhyme_scheme": "string",
  "meter": "string",
  "syllables_per_line": "integer",
  "hook_strategy": "melodic | lyrical | call-response | chant",
  "repetition_policy": "sparse | moderate | hook-heavy",
  "imagery_density": "number (0-1)",
  "reading_level": "string",
  "section_order": ["array of section names"],
  "constraints": {
    "explicit": "boolean (default: false)",
    "max_lines": "integer",
    "section_requirements": {
      "SectionName": {
        "min_lines": "integer",
        "max_lines": "integer",
        "must_end_with_hook": "boolean"
      }
    }
  },
  "source_citations": [
    {"source_id": "string", "weight": "number (0-1)"}
  ]
}
```

#### Acceptance Tests
- Section presence validation (reject without Chorus)
- Profanity filter functionality
- Syllable validation with warnings
- Source weight normalization

---

### 4. PRD – Persona Entity

**Purpose:** Models performing artist/band with identity, vocal characteristics, influences, and default creative preferences.

#### Feature Requirements
- Artist vs. band distinction
- Biographical text for marketing/backstory
- Voice timbre description
- Vocal range classification
- Delivery style multi-select (crooning, belting, rap, whispered)
- Influence tracking (with policy for public releases)
- Default style and lyrics specs inheritance
- Public release policy with "disallow named style of" flag
- Live preview card with avatar placeholder
- Delivery conflict detection (whispered + belting)

#### Technical Specifications
- **Name Uniqueness:** Unique within workspace
- **Public Release Sanitization:** Living artist names converted to generic descriptions
- **Delivery Conflicts:** Warn on mutually exclusive styles
- **Kind:** "artist" or "band" (influences pronoun usage)
- **Policy Settings:**
  - `public_release`: boolean (false = private outputs only)
  - `disallow_named_style_of`: boolean (true = prevent "style of [living artist]")

#### Data Model
```json
{
  "name": "string (required, unique)",
  "kind": "artist | band",
  "bio": "string (optional)",
  "voice": "string (timbre description)",
  "vocal_range": "soprano | mezzo-soprano | baritone | etc.",
  "delivery": ["array of delivery styles"],
  "influences": ["array of artist names/genres"],
  "style_defaults": "style-1.0.json ref (optional)",
  "lyrics_defaults": "lyrics-1.0.json ref (optional)",
  "policy": {
    "public_release": "boolean (default: false)",
    "disallow_named_style_of": "boolean (default: true)"
  }
}
```

#### Acceptance Tests
- Unique name validation
- Public policy sanitization (living artists converted)
- Delivery conflict detection
- Default inheritance functionality

---

### 5. PRD – Producer Notes Entity

**Purpose:** Defines structural and production aspects (arrangement, hooks, instrumentation, mix, per-section tags).

#### Feature Requirements
- Structure specification as editable list with templates (ABAB, ABABCBB)
- Hooks count with stepper (warn if 0)
- Instrumentation hints list
- Per-section metadata with tags and target duration
- Mix settings (LUFS, space, stereo width)
- Section alignment validation with lyrics
- Duration budget checking (±30 seconds tolerance)

#### Technical Specifications
- **Structure:** Free-form string showing arrangement (e.g., "Intro–Verse–Pre‑Chorus–Chorus–Bridge–Chorus")
- **Hooks:** Minimum 0, warn if 0 (may lack memorability)
- **Section Metadata Keys:** Must appear in structure string
- **Target Duration:** Positive integer, sum must align with SDS duration ±30 seconds
- **Section Tags:** Category-aware, must be valid from taxonomy
- **Mix.LUFS:** Loudness in LUFS (informational for post-processing)
- **Mix.stereo_width:** narrow | normal | wide

#### Data Model
```json
{
  "structure": "string (free-form section sequence)",
  "hooks": "integer (minimum 0)",
  "instrumentation": ["array of instruments"],
  "section_meta": {
    "SectionName": {
      "tags": ["array of category-aware tags"],
      "target_duration_sec": "integer (positive)"
    }
  },
  "mix": {
    "lufs": "number (e.g., -14.0)",
    "space": "string (dry, roomy, lush, vintage tape)",
    "stereo_width": "narrow | normal | wide"
  }
}
```

#### Acceptance Tests
- Section alignment check (structure vs. lyrics section_order)
- Hook count validation (warn if 0)
- Duration budget check (±30 second tolerance)
- Tag category validation

---

### 6. PRD – Blueprint & Rubric Entity

**Purpose:** Genre-specific algorithmic template with rules and scoring rubric for evaluation and auto-fix.

#### Feature Requirements
- Genre-specific rules (tempo ranges, required sections, banned terms, lexicon)
- Scoring rubric with weighted metrics
- Pass/fail thresholds
- Section-specific line count guidance
- Conflict matrix for tag validation
- Admin-only editor with separate Rules and Rubric tabs
- Per-genre fingerprints and patterns

#### Technical Specifications
- **Tempo Range:** [min, max] integers, first <= second
- **Required Sections:** Non-empty array (e.g., ["Verse", "Chorus", "Bridge"])
- **Banned Terms:** Words/phrases forbidden in lyrics
- **Lexicon:** Positive (should appear) and negative (should avoid) terms
- **Section Lines:** Min and max line counts per section
- **Weights:** Sum to 1.0 (normalized by UI)
- **Thresholds:**
  - `min_total`: 0-1 (minimum passing score)
  - `max_profanity`: 0-1 (maximum allowed profanity score)
- **Evaluation Metrics:** hook_density, singability, rhyme_tightness, section_completeness, profanity_score

#### Data Model
```json
{
  "genre": "string",
  "version": "string (e.g., 2025.11)",
  "rules": {
    "tempo_bpm": "[min, max] integers",
    "required_sections": ["array"],
    "banned_terms": ["array"],
    "lexicon_positive": ["array"],
    "lexicon_negative": ["array"],
    "section_lines": {
      "SectionName": {"min": "integer", "max": "integer"}
    }
  },
  "eval_rubric": {
    "weights": {
      "hook_density": "number",
      "singability": "number",
      "rhyme_tightness": "number",
      "section_completeness": "number",
      "profanity_score": "number"
    },
    "thresholds": {
      "min_total": "number (0-1)",
      "max_profanity": "number (0-1)"
    }
  }
}
```

#### Acceptance Tests
- Weights sum to 1.0 (normalized)
- Tempo range validation (min <= max)
- Required sections validation
- Profanity scoring enforcement

---

### 7. PRD – Prompt Composition Entity

**Purpose:** Represents final prompt text for music engines (merges style, lyrics, producer notes).

#### Feature Requirements
- Assembled prompt text from style, lyrics, and producer notes
- Section-specific meta tags ([Intro], [Verse], [Chorus], etc.)
- Voice and instrument tags
- Meta information (title, genre, tempo, structure)
- Character limit enforcement per engine
- Conflict resolution (drop lower priority tags)
- Public policy enforcement (no living artists in public prompts)
- Read-only preview with character counter
- Copy-to-clipboard and download buttons

#### Technical Specifications
- **Text Field:** Complete prompt ≤ `max_prompt_chars`
- **Style Tags:** ≤ `max_style_chars`
- **Meta Tags:** Ordered list (era → genre → energy → instrument → rhythm → vocal → mix)
- **Negative Tags:** Exclude certain qualities
- **Section Tags:** Dictionary mapping sections to tags
- **Conflict Matrix:** Prevents contradictory tags
- **Model Limits:** Engine-specific constraints (Suno v5: 1000 style, 5000 prompt)

#### Data Model
```json
{
  "text": "string (final prompt, ≤ max_prompt_chars)",
  "meta": {
    "title": "string",
    "genre": "string",
    "tempo_bpm": "integer | [integer, integer]",
    "structure": "string",
    "style_tags": ["ordered array of tags"],
    "negative_tags": ["array"],
    "section_tags": {
      "SectionName": ["array of tags"]
    },
    "model_limits": {
      "style_max": "integer",
      "prompt_max": "integer"
    }
  }
}
```

#### Acceptance Tests
- Character limit enforcement (truncation/simplification if needed)
- Tag conflict resolution
- Section tag alignment
- Public policy enforcement

---

### 8. PRD – Source Entity

**Purpose:** Registers external knowledge bases (files, APIs, MCP servers) for retrieval-augmented lyric generation.

#### Feature Requirements
- Multiple source types (file, web, api)
- Scope specification for fine-grained content selection
- Allow/deny lists for content filtering
- Weight assignment (0-1) with normalization
- Provenance tracking (hashes, citations)
- MCP server integration
- Card list UI with enable/disable toggles
- Weight slider with normalized distribution display
- Allow vs. deny conflict detection

#### Technical Specifications
- **Name Uniqueness:** Unique within workspace
- **Kind:** file | web | api
- **Config:** Source-specific configuration (file_path, base_url, auth tokens, etc.)
- **Scopes:** Categories/topics available in source (e.g., characters, family_history)
- **Weight:** 0-1, normalized across all citations to sum to 1.0
- **Allow/Deny:** Cannot overlap (overlapping terms removed from allow list)
- **Provenance:** If true, return chunk hashes and metadata for determinism
- **MCP Server:** Required, implements `search` and `get_context` tools

#### Data Model
```json
{
  "name": "string (required, unique)",
  "kind": "file | web | api",
  "config": "object (source-specific)",
  "scopes": ["array of valid scopes"],
  "weight": "number (0-1, default: 0.5)",
  "allow": ["array of allowed terms/patterns"],
  "deny": ["array of denied terms/patterns"],
  "provenance": "boolean (default: true)",
  "mcp_server_id": "string (required)"
}
```

#### Acceptance Tests
- Unique name validation
- Weight normalization across citations
- Allow vs. deny list conflict handling
- Scope validation with MCP server

---

### 9. PRD – Render Job Entity

**Purpose:** Represents request to music rendering engine (optional for MVP; manual rendering via Suno).

#### Feature Requirements
- Engine and model specification
- Composed prompt attachment
- Number of variations (1-8)
- Seed for deterministic rendering
- Optional webhook callbacks
- Optional WebSocket event streaming
- Job status tracking (pending, processing, rendered, failed)
- Polling and completion handling
- Fallback to manual copy-paste for MVP

#### Technical Specifications
- **Engine:** suno-v5, none (MVP), external
- **Model:** Specific model version (e.g., chirp-v3-5)
- **Composed Prompt:** Full composed-prompt-0.2.json ref
- **Num Variations:** 1-8, capped by engine support
- **Seed:** Non-negative integer for deterministic output
- **Webhook:** Valid HTTPS URL, retried with exponential backoff (max 3 attempts)
- **Events:** Boolean flag to enable WebSocket event streaming

#### Data Model
```json
{
  "engine": "string (suno-v5, none, external)",
  "model": "string",
  "composed_prompt": "composed-prompt-0.2.json ref",
  "num_variations": "integer (1-8)",
  "seed": "integer",
  "callbacks": {
    "webhook": "string (valid HTTPS URL, optional)",
    "events": "boolean (optional)"
  }
}
```

#### Workflow
1. User submits render job (or copies prompt manually for MVP)
2. Job queued with status = "pending"
3. Backend polls engine API
4. Status updates streamed via WebSocket
5. On completion, status = "complete", audio assets stored
6. If webhook provided, results posted to URL with retry logic

#### Acceptance Tests
- Invalid model validation
- Queue handling (concurrent limits)
- Webhook delivery with retry logic

---

## System/Orchestration PRDs

### 10. PRD – Claude Code Orchestration Workflow

**Purpose:** Defines deterministic workflow to transform SDS into validated artifacts (style, lyrics, producer notes, prompt, scores, events).

#### System Workflow
```
Input: SDS + Seed
  ↓
PLAN → Derive ordered objectives, section targets, word counts
  ↓
STYLE, LYRICS, PRODUCER (can run in parallel)
  ↓
COMPOSE → Merge artifacts into render-ready prompt
  ↓
VALIDATE → Score against blueprint rubric
  ├─ Pass → RENDER (if enabled) → REVIEW → Output
  └─ Fail → FIX (≤3 iterations) → COMPOSE → VALIDATE
  ↓
REVIEW → Finalize outputs, emit events, persist artifacts
  ↓
Output: Validated artifacts + scores + citations + optional audio
```

#### Feature Requirements

**PLAN Node:**
- Expand SDS into ordered objectives
- Derive section targets and word count budgets
- Deterministic, no external calls
- Output: `plan.json`

**STYLE Node:**
- Generate detailed style spec from SDS style + blueprint + plan
- Enforce blueprint tempo ranges and tag conflict matrix
- Output: `style.json` with tempo, key, mood, tags, instrumentation

**LYRICS Node:**
- Generate lyrics with retrieval-augmented generation from sources
- Enforce rhyme scheme, meter, syllables, hooks, repetition policy
- Pin retrieval to source chunk hashes for determinism
- Output: `lyrics.txt` and `citations.json`
- Metrics: rhyme_tightness, singability, hook_density

**PRODUCER Node:**
- Generate production notes: structure, hooks, instrumentation, mix, per-section tags
- Derive from SDS producer notes + style + plan
- Output: `producer_notes.json`

**COMPOSE Node:**
- Merge style, lyrics, producer notes into `composed_prompt.json`
- Assemble section meta tags ([Intro], [Verse], [Chorus], etc.)
- Include BPM, mood, instrumentation in text
- Enforce model character limits
- Resolve tag conflicts
- Output: `composed_prompt.json` with text + meta

**VALIDATE Node:**
- Score against blueprint rubric
- Metrics: hook_density, singability, rhyme_tightness, section_completeness, profanity_score
- Weighted total score compared to `min_total` threshold
- Output: scores + issues list

**FIX Node (≤3 iterations):**
- Apply targeted modifications to lowest-scoring component
- Strategies:
  - Low hook density → insert hook lines
  - Weak rhyme → adjust scheme/syllables
  - Tag conflicts → drop lowest-weight tag
- Output: patched style/lyrics/producer notes

**RENDER Node (optional, feature-flagged):**
- Submit composed_prompt to render connector (e.g., Suno API)
- Return job ID and eventual audio asset URL
- Skip if `render.engine = "none"`

**REVIEW Node:**
- Collect all artifacts, scores, citations
- Persist to database
- Emit completion events
- Output: final summary JSON

#### Technical Specifications

**Determinism Requirements:**
- Seed propagation: Each node uses `seed + node_index`
- Pinned retrieval: Source chunks identified by content hash
- Low temperature: ≤ 0.3, top-p ≤ 0.9
- Lexicographic sorting: Arrays sorted by hash for determinism

**Skill Contracts:**
Each node is a skill with defined I/O contracts:

```yaml
# Example: style.generate
name: amcs.style.generate
inputs:
  sds_style: amcs://schemas/style-1.0.json
  plan: amcs://schemas/plan-1.0.json
  blueprint: amcs://schemas/blueprint-1.0.json
outputs:
  style: amcs://schemas/style-1.0.json
policies:
  - enforce_tempo_range
  - tag_conflict_check
  - profanity_filter
determinism: true
```

#### API Endpoints (Orchestrator)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/runs` | Create new run (song_id, sds_id, manifest, seed) → run_id |
| GET | `/runs/{run_id}` | Get run status, current node, outputs, issues |
| POST | `/runs/{run_id}/retry` | Retry failed node or entire run |
| POST | `/runs/{run_id}/cancel` | Cancel in-progress run |
| WS | `/events` | WebSocket for run events (ts, node, phase, duration, metrics, issues) |

#### Run Manifest
```json
{
  "song_id": "uuid",
  "seed": 42,
  "graph": [
    {"id": "PLAN"},
    {"id": "STYLE", "inputs": ["PLAN"]},
    {"id": "LYRICS", "inputs": ["PLAN"]},
    {"id": "PRODUCER", "inputs": ["PLAN"]},
    {"id": "COMPOSE", "inputs": ["STYLE", "LYRICS", "PRODUCER"]},
    {"id": "VALIDATE"},
    {"id": "FIX", "on": "fail", "max_retries": 3},
    {"id": "RENDER", "cond": "pass && flags.render"}
  ],
  "flags": {"render": true}
}
```

#### Acceptance Criteria
- DAG execution in order, respecting dependencies
- All node outputs stored in database, accessible via API
- Deterministic nodes produce identical outputs for same SDS + seed
- 95%+ of compositions pass validation (automated tests)
- Events emitted for node start/end/fail with metrics
- Graceful error handling, issues surfaced to UI
- Runs cancellable and retryable through API

---

### 11. PRD – Music Creation App (Website)

**Purpose:** Full-stack web application serving as main interface for AMCS (React front-end, FastAPI back-end).

#### Core Entities Managed
| Entity | Purpose |
|--------|---------|
| Style | Genre, tempo, key, mood, energy, instrumentation, tags |
| Lyrics | Textual content with structural/stylistic constraints |
| Persona | Artist/band identity with vocal characteristics, influences |
| Producer Notes | Song structure, hooks, instrumentation, mix |
| Source | External knowledge bases (files, APIs, MCP servers) |
| Blueprint | Genre-specific rules and evaluation rubrics |
| Prompt | Final assembled prompt for music engines |
| Song (SDS) | Master aggregation of all entities |
| Render Job | Request to music rendering engine |

#### Feature Requirements

**Dashboard:**
- Overview of recent songs, pending render jobs, quick actions
- Quick action buttons (new style, new lyrics, etc.)
- System status indicators
- Getting started guide

**Entity Management:**
- **Styles Library:** Filter by genre, mood, creation date
- **Lyrics Library:** Filter by language, POV, reading level
- **Personas Library:** Search and group by artist/band
- **Blueprints Library:** Genre templates and rubrics
- **Sources Library:** Manage external knowledge bases
- Detail views with JSON spec, timestamps, associated songs

**Song Creation Workflow:**
1. **Basic Info** - Title, genre selection
2. **Style Editor** - Fill out genre, tempo, key, mood, energy, instrumentation, tags
3. **Lyrics Editor** - Write lyrics, set rhyme scheme, meter, sources, constraints
4. **Persona Selector** - Link persona or create new
5. **Producer Notes** - Structure, hooks, instrumentation, mix preferences
6. **Sources Selection** - Add/manage sources and weights
7. **Summary/Preview** - Review SDS JSON, edit any section, submit

**Workflow Monitoring:**
- **Workflows Page:** Monitor Claude Code runs
- **Status Tracking:** Real-time updates (Plan, Style, Lyrics, Producer, Compose, Validate, Fix, Render, Review)
- **Metrics Display:** Scores, issues, duration
- **Artifact Preview:** View generated artifacts
- **Retry Controls:** Retry failed steps

**Settings:**
- Global app settings, taxonomies, API keys, feature flags

#### User Flows

**Create New Song:**
1. Dashboard → "New Song" or main nav
2. Wizard stepper through 7 steps
3. Form validation before next step
4. Local storage auto-save for recovery
5. Final review with SDS preview
6. Submit triggers POST /songs with SDS
7. Redirect to song detail page

**Edit Existing Song:**
1. Navigate to entity library (Styles, Lyrics, etc.)
2. Click row to open detail view
3. View JSON spec, metadata, associated songs
4. Click Edit to modify
5. Validation and dependent SDS updates

**Submit to Workflow:**
1. Song creation complete → review SDS
2. Click "Generate Music" or similar
3. Orchestrator called with SDS + manifest
4. Real-time status updates via WebSocket
5. Artifact preview on completion

#### Technical Specifications

**Front-End Stack:**
- React 18.3+ with Next.js 14.2 App Router
- TypeScript for type safety
- Zustand for state management
- React Query for data fetching
- Tailwind CSS for styling
- lucide-react for icons

**Back-End Stack:**
- FastAPI (Python)
- SQLAlchemy for ORM
- PostgreSQL with pgvector
- Redis for queuing/caching
- OpenTelemetry for observability

**Database:**
- PostgreSQL with JSONB fields
- Tables mirror entity schemas
- Foreign keys for relationships
- UUID primary keys
- Timestamps (created_at, updated_at)
- Version field for soft versioning

**Storage:**
- S3-compatible bucket for files, assets, prompts
- Signed URLs for secure access

#### API Contracts

**Entity CRUD Endpoints:**
```
POST   /api/v1/styles              Create style
GET    /api/v1/styles/{id}         Retrieve style
PUT    /api/v1/styles/{id}         Update style
DELETE /api/v1/styles/{id}         Delete style
GET    /api/v1/styles              List styles (with filters)

[Repeat for /lyrics, /personas, /producer_notes, /sources, /blueprints]
```

**Song/SDS Endpoints:**
```
POST   /api/v1/songs               Create song with SDS
GET    /api/v1/songs/{id}          Get song with SDS
GET    /api/v1/songs               List songs (paginated, filters)
GET    /api/v1/songs/{id}/sds/export  Download SDS as JSON
```

**Workflow Endpoints:**
```
POST   /api/v1/runs                Create run from SDS
GET    /api/v1/runs/{id}           Get run status
GET    /api/v1/runs/{id}/events    Get event history
POST   /api/v1/runs/{id}/retry     Retry run/node
POST   /api/v1/runs/{id}/cancel    Cancel run
WS     /events                     WebSocket event stream
```

#### UI Components

**Design System:**
- Dark theme with purple-blue accents (#0f0f1c background)
- Card-based layouts with elevation
- Typography hierarchy
- Spacing scale (4px base unit)
- Shadow/elevation system
- Motion system with smooth transitions

**Form Components:**
- Chip selectors (multi-select mood, instrumentation, tags)
- Range sliders (tempo, imagery density)
- Dropdowns with search (key, genre)
- Toggle switches (source enable/disable)
- Text areas with line counters
- Collapsible panels

**Data Display:**
- JSON preview with syntax highlighting
- Formatted entity displays (StyleDisplay, LyricsDisplay, etc.)
- Tables/grids with sorting and filtering
- Workflow step visualization
- Metrics/scores cards
- Loading states and empty states

#### Acceptance Criteria
- Users can CRUD all entity types via UI
- Forms enforce required fields and validation
- SDS compiled and workflow started successfully
- 95%+ pass rate on blueprint rubric
- 99%+ determinism on same seed
- Feature flags enable/disable experimental features
- Real-time status updates via WebSocket

---

## Feature/Enhancement PRDs

### 12. PRD – Entity Import Feature

**Purpose:** Enable users to import entity definitions (Style, Lyrics, Persona, ProducerNotes, Blueprint) via JSON file upload.

#### Feature Requirements
- Import from dashboard with entity type selector
- Import from entity list pages (pre-selected entity type)
- Import from song creation workflow (inline with form)
- Drag-drop or click file upload
- Client-side JSON parsing with preview
- Server-side schema validation with detailed errors
- Import metadata tracking (timestamp, filename)

#### Technical Specifications
- **File Format:** JSON only, max 10MB
- **Content-Type:** `multipart/form-data`
- **Validation:** Client-side preview, server-side schema check
- **Endpoints:** `POST /api/v1/[entities]/import` for each entity type
- **Metadata Fields (nullable):**
  - `imported_at`: ISO 8601 timestamp
  - `import_source_filename`: Original filename

#### API Contract
```
POST /api/v1/styles/import
Content-Type: multipart/form-data

Request: file (JSON)
Response 201: {
  "id": "uuid",
  "name": "...",
  "imported_at": "2025-11-17T10:30:00Z",
  "import_source_filename": "my_style.json",
  ...fields
}

Response 400: {
  "detail": "Validation failed",
  "errors": [
    {"field": "tempo", "message": "must be between 40 and 200"}
  ]
}
```

#### UI Components
- **FileUpload Component:** Drag-drop zone, file type validation, size limits
- **ImportPreview Component:** Pretty-printed JSON, field-level validation status
- **ImportModal Component:** Entity type dropdown, file upload, preview, error display

#### Acceptance Criteria
- Import available on dashboard, entity pages, workflow
- Client-side JSON validation
- Server-side schema validation
- Import metadata persisted
- Success/error toasts displayed
- Query invalidation refreshes lists
- Success rate > 95% for valid JSON
- Import time < 2 seconds per entity

---

### 13. PRD – UI/UX Redesign - Dark Mode Design System

**Purpose:** Transform from basic light-mode admin interface to sophisticated dark-mode creative application.

#### Feature Requirements

**Design System Foundation:**
- Dark mode as default/primary theme
- Color system (base #0f0f1c, surface #1a1625, panel #252137)
- Text colors (strong #e2e4f5, base #b4b7d6, muted #8286a8)
- Primary gradient (#5b4cfa → #6366f1)
- Semantic colors (success, warning, danger, info)
- State colors (hover, active, disabled, focus)

**Typography System:**
- Inter font family
- 8-level hierarchy: Display (48px) to Caption (12px)
- Weights: 400, 500, 600, 700
- Line heights and letter spacing per level

**Spacing System:**
- 4px base unit
- Scale: xs(4px), sm(8px), md(12px), lg(16px), xl(20px), 2xl(24px), 3xl(32px), 4xl(48px), 5xl(64px)

**Elevation/Shadow System:**
- 5 shadow levels (elevation-1 through elevation-5)
- Accent glow effect for primary actions
- Proper z-index layering

**Motion System:**
- Transition durations: micro(70ms), ui(150ms), panel(250ms), modal(300ms)
- Easing functions: enter (ease-out), exit (ease-in)
- Animation patterns: fade-in, slide-up, scale-in

**Component Library:**
- Buttons: Primary (gradient), Secondary (solid), Ghost (transparent), Outline (border)
- Cards: Default, Elevated, Gradient
- Inputs: Text, Select, Checkbox, Radio, Toggle, Chip selector
- Navigation: Sidebar, Top bar, Breadcrumbs, Tabs
- Feedback: Badges, Toasts, Skeleton loaders, Empty states
- Modal/Dialog with backdrop blur

**Layout System:**
- Dashboard layout with sidebar and top bar
- Responsive breakpoints: Mobile (<640px), Tablet (640-1023px), Desktop (1024-1279px), Large (≥1280px)
- Container system with max-widths
- Grid system implementation

**Screen Implementations:**
- Dashboard with metric cards, recent songs, quick actions
- Song creation workflow with stepper
- Entity list pages (Styles, Lyrics, Personas, Producer Notes, Blueprints, Sources)
- Entity editor pages
- Workflow visualization pages
- Settings page

#### Technical Specifications
- All colors from design tokens (no hardcoded values)
- All spacing from design scale
- All typography from hierarchy
- All shadows from elevation system
- All animations from motion system
- Component reuse 80%+ across screens

#### Non-Functional Requirements
- WCAG AA compliance maintained (contrast 15.2:1 text, 10.5:1 interactive)
- FCP < 2s, LCP < 3s
- All animations 60fps
- CSS bundle increase < 10%
- JavaScript bundle increase < 10%
- Keyboard navigation support
- Screen reader support
- Browser support: Chrome/Edge 90+, Firefox 88+, Safari 14+

#### Acceptance Criteria
- All design tokens implemented in Tailwind
- Button, Card, Input, Navigation, Modal components per specs
- AppShell responsive at all breakpoints
- All 11 screens redesigned and functional
- WCAG AA compliance verified
- Performance metrics met
- No accessibility regressions

---

### 14. PRD – MVP SDS Generation and Preview

**Purpose:** Enable users to create songs with partial entity data and automatically generate complete valid SDS with blueprint-driven defaults.

#### Feature Requirements

**Partial Entity Input:**
- Users can create with only title + genre (both required)
- All other fields optional
- Forms allow skipping optional sections with clear defaults indication

**Blueprint-Driven Defaults:**
When user submits with partial data:

**Style Defaults:**
- Tempo: Blueprint's tempo_bpm range
- Time Signature: 4/4 (or blueprint-specific)
- Key: Blueprint-recommended key
- Mood: Blueprint's genre mood profile
- Energy: Derived from tempo (< 90 → "low", 90-120 → "medium", 120-140 → "high", > 140 → "anthemic")
- Instrumentation: Blueprint defaults (max 3)
- Vocal Profile: "unspecified" or generic from blueprint
- Tags: Blueprint lexicon defaults (1-2 per category)
- Negative Tags: Empty or blueprint genre exclusions

**Lyrics Defaults:**
- Language: "en"
- POV: "1st"
- Tense: "present"
- Themes: [] (empty)
- Rhyme Scheme: "AABB"
- Meter: "4/4 pop"
- Syllables Per Line: 8
- Hook Strategy: "lyrical"
- Repetition Policy: "moderate"
- Imagery Density: 0.5
- Reading Level: "grade-8"
- Section Order: Blueprint's required_sections + standard structure
- Explicit: false
- Max Lines: 120
- Section Requirements: From blueprint's section_lines rules
- Source Citations: [] (empty)

**Producer Notes Defaults:**
- Structure: Derived from section_order
- Hooks: 2
- Instrumentation: Copy from style or blueprint
- Section Meta: Standard tags for each section type:
  - Intro: ["instrumental", "build"], 10 seconds
  - Verse: ["storytelling"], 30 seconds
  - Chorus: ["anthemic", "hook-forward"], 25 seconds
  - Bridge: ["contrast", "dynamic"], 20 seconds
  - Outro: ["fade-out"], 10 seconds
- Mix:
  - LUFS: -14.0 (streaming standard)
  - Space: "balanced"
  - Stereo Width: "normal"

**Other Defaults:**
- Sources: [] (empty)
- Prompt Controls:
  - Positive Tags: []
  - Negative Tags: Copy from style
  - Max Style Chars: 1000
  - Max Prompt Chars: 5000
- Render:
  - Engine: "none" (MVP)
  - Model: null
  - Num Variations: 2
- Seed: Deterministic from `(timestamp_ms + hash(user_id)) % 2^31`

**SDS Compilation:**
- Backend service loads blueprint, applies defaults, constructs SDS
- Normalizes source weights to sum to 1.0
- Sorts arrays lexicographically for deterministic hashing
- Validates entire SDS against sds.schema.json

**Conflict Detection (Warnings):**
- Tempo vs energy alignment (high energy with slow BPM)
- Tag conflicts using blueprint's conflict matrix
- Section order vs blueprint's required_sections
- Returns warnings but doesn't block creation

**Song Detail Page:**
- **Overview Tab:** Metadata, blueprint, stats, action buttons
- **Entities Tab:** Expandable sections for each entity (read-only formatted view)
- **Preview Tab:** Full SDS JSON with syntax highlighting, line numbers, copy/download

**Song List Page:**
- Table/grid with title, genre, created date, status
- Search by title (fuzzy)
- Filter by genre and status
- Bulk export as ZIP
- Bulk delete with confirmation

#### API Endpoints

```
POST /api/songs
Request: {
  "title": "string (required)",
  "blueprint": {"genre": "string", "version": "string (optional)"},
  "style": {...partial or complete...},
  "lyrics": {...partial or complete...},
  "persona_id": "uuid | null",
  "producer_notes": {...partial or complete...},
  "sources": [...],
  "prompt_controls": {...},
  "render": {...}
}
Response 201: {
  "song_id": "uuid",
  "title": "string",
  "sds": {...complete SDS with defaults...},
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [...]
  },
  "created_at": "ISO 8601"
}

GET /api/songs/{song_id}
Response 200: {
  "song_id": "uuid",
  "title": "string",
  "sds": {...complete SDS...},
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}

GET /api/songs/{song_id}/sds/export
Response 200: application/json file, pretty-printed

GET /api/songs?genre={genre}&status={status}&search={query}&sort={field}&order={asc|desc}
Response 200: Paginated list
```

#### UI Components
- **Song Creation Wizard:** Multi-step stepper with 7 steps
  - Step 1: Basic Info (title, genre)
  - Step 2: Style (with "Use defaults" checkbox)
  - Step 3: Lyrics (with "Use defaults" checkbox)
  - Step 4: Persona (selection or create)
  - Step 5: Producer Notes (with "Use defaults" checkbox)
  - Step 6: Sources (optional)
  - Step 7: Review & Generate (SDS preview with applied defaults)
- **SDSPreview Component:** Syntax highlighting, line numbers, copy, download, full-screen
- **Entity Display Components:** StyleDisplay, LyricsDisplay, ProducerNotesDisplay, SourceDisplay
- **Song Detail Page:** 3-tab interface

#### Acceptance Criteria
- User creates song with only title + genre → valid SDS generated
- Generated SDS validates against sds.schema.json
- Defaults follow blueprint rules
- Determinism: Same input + blueprint → identical SDS across 100 runs
- Song detail page displays 3 tabs
- SDS export downloads with correct filename
- Copy button copies SDS to clipboard
- Song list shows all songs with filtering
- SDS generation < 500ms P95
- Song detail loads < 1s P95
- JSON rendering < 200ms

---

## Future Expansions

### 15. PRD – Future Extensions

**Out of Scope for MVP but planned:**

#### 2.1 Direct Music Engine Integration
- Connector service for third-party APIs (Suno, etc.)
- `/render_jobs` endpoints
- Job tracking (pending, running, completed, failed)
- Model awareness (constraints per model)
- User feedback (playback, download, deletion)
- Fallback copy-paste when disabled (feature flag)

#### 2.2 Analytics and Tracking
- Manual data entry: release date, platforms, URLs, stats
- Automated ingestion: Spotify for Artists, Apple Music for Artists APIs
- Analytics dashboards: trends, comparisons, aggregations
- Notifications: milestones, threshold alerts
- Export options (CSV, reports)

#### 2.3 Direct Claude Code Invocation
- Hosted skills as callable APIs
- Client-side runner (optional, for limited tasks)
- Security: signed JWT tokens, request throttling, encryption
- Observability: event streaming, local caching

#### 2.4 Collaborative Editing
- Real-time sync (CRDTs or operational transforms)
- User presence (avatars, cursors)
- Inline commenting and notifications
- Changelog and versioning
- Permission management (view/edit/comment roles)

#### 2.5 Plugin Ecosystem
- Plugin API with hooks (beforeStyle, afterLyrics, customEval)
- Manifest format and registration
- Sandbox isolation (containers, serverless functions)
- Allow-list for external access
- Marketplace with discovery, ratings, reviews
- Semantic versioning and auto-updates

#### 2.6 Advanced Features
- Stem export and DAW integration
- AI feedback and coaching
- Marketplace and community sharing

---

## Acceptance Criteria & Quality Gates Summary

### Determinism & Reproducibility
- **Target:** 99%+ identical outputs across 10+ replays with same seed
- **Enforcement:**
  - Seed propagation (seed + node_index per node)
  - Pinned retrieval (source chunks by hash)
  - Low-variance decoding (temperature ≤ 0.3, top-p ≤ 0.9)
  - Lexicographic sorting (arrays for deterministic hashing)

### Rubric Pass Rate
- **Target:** ≥ 95% of compositions pass validation without manual edits
- **Measurement:** On automated test suite (200+ songs)
- **Enforcement:**
  - Validation scoring per blueprint rubric
  - Auto-fix loop (≤3 iterations) for failures
  - Quality gates before release

### Performance Targets (MVP)
- **Plan→Prompt Latency:** P95 ≤ 60s (excluding external rendering)
- **SDS Generation:** < 500ms P95
- **Song Detail Load:** < 1s P95
- **JSON Rendering:** < 200ms
- **Export Initiation:** < 100ms
- **FCP:** < 2s
- **LCP:** < 3s

### Security & Compliance
- **PII Redaction:** No public release outputs with PII
- **Living Artists:** No "style of <living artist>" in public prompts
- **Profanity:** Strict enforcement per constraints.explicit
- **Source Access:** Only via allowed MCP scopes with provenance hashes
- **MCP Allow-List:** Zero high-severity violations

### Acceptance Gates (Release Promotion)
- **Gate A:** Rubric pass ≥ 95% on 200-song synthetic set
- **Gate B:** Determinism reproducibility ≥ 99%
- **Gate C:** Security MCP allow-list audit clean
- **Gate D:** Latency P95 ≤ 60s (excluding render)

### Accessibility Compliance
- **WCAG AA:** Contrast ratios (text 15.2:1, interactive 10.5:1)
- **Keyboard Navigation:** All interactions keyboard-accessible
- **Screen Readers:** ARIA labels, semantic HTML
- **Focus Indicators:** Clearly visible on all interactive elements

### Data Validation
- **Schema Compliance:** 100% of generated SDS validates against sds.schema.json
- **Conflict Detection:** All known conflicts detected and warned
- **Blueprint Constraints:** All defaults satisfy blueprint rules
- **Weight Normalization:** Source weights sum to 1.0

---

## Implementation Priority

### Phase 1 (MVP Foundation)
1. Core entity schemas and database models
2. SDS compilation and validation
3. Basic UI forms for entity creation
4. Orchestration workflow (PLAN → COMPOSE → VALIDATE → FIX)
5. Workflow monitoring and status tracking

### Phase 2 (Enhanced UI/UX)
1. Dark mode design system implementation
2. Song detail and list pages
3. SDS preview and export
4. Entity import functionality
5. Responsive design across all breakpoints

### Phase 3 (Workflow Execution)
1. Claude Code skill deployment
2. Full workflow execution (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE)
3. Real-time event streaming
4. Artifact persistence and retrieval
5. Error handling and retry logic

### Phase 4 (Advanced Features)
1. Direct Suno rendering integration
2. Analytics dashboard
3. Collaborative editing
4. Plugin ecosystem

---

**Document Complete**

This summary covers all 15 PRD files and provides comprehensive requirements for implementation, testing, and deployment of the MeatyMusic AMCS system.
