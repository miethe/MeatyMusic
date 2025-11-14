# MeatyMusic PRD Requirements Summary

**Purpose:** Consolidated requirements extraction from all PRDs for AI agent consumption. This document enables agents to understand implementation gaps and requirements at a glance.

**Last Updated:** 2025-11-13
**Status:** MVP Phase (Phase 2 - Schema & Entity Implementation)

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Claude Code Orchestration Workflow](#claude-code-orchestration-workflow)
3. [Website Application Requirements](#website-application-requirements)
4. [Entity Schemas & Requirements](#entity-schemas--requirements)
5. [API Contracts & Endpoints](#api-contracts--endpoints)
6. [Validation Rules & Constraints](#validation-rules--constraints)
7. [Acceptance Criteria & Quality Gates](#acceptance-criteria--quality-gates)
8. [Dependencies Between Components](#dependencies-between-components)
9. [Future Extensions (Post-MVP)](#future-extensions-post-mvp)

---

## System Architecture Overview

### Core Mission
Deterministically convert **Song Design Spec (SDS)** → validated musical artifacts (style, lyrics, producer notes, composed prompt) → optional music rendering.

### Key Principles
- **Determinism:** Same inputs + seed = identical outputs every time
- **Constraint Fidelity:** Honor blueprint rules before rendering
- **Composable:** Engines (Suno, etc.) are pluggable connectors, not core
- **Traceability:** Every decision carries provenance, hashes, scores
- **Compact Power:** Minimal, high-information-density tags

### High-Level Data Flow

```
SDS Input
  ↓
PLAN (expand into work targets)
  ↓
STYLE, LYRICS, PRODUCER (parallel generation)
  ↓
COMPOSE (merge into render-ready prompt)
  ↓
VALIDATE (score vs rubric; if fail → FIX loop ≤3)
  ↓
RENDER (optional; engine-dependent)
  ↓
REVIEW (finalize artifacts, emit events)
  ↓
Output: Prompts, Lyrics, Scores, Citations, Audio Assets
```

### Technology Stack
- **Frontend:** React/Next.js, TypeScript, Tailwind, Zustand, React Query
- **Backend:** FastAPI (Python), SQLAlchemy ORM
- **Database:** PostgreSQL + pgvector extension
- **Storage:** S3 for artifacts, Redis for queues/cache
- **Observability:** OpenTelemetry logging, metrics, tracing
- **Authentication:** OAuth2 / Clerk JWT with RLS

---

## Claude Code Orchestration Workflow

### Workflow Graph (DAG)

**Nodes (Skills) in Execution Order:**

1. **PLAN** - Expand SDS into ordered work targets
   - Input: SDS
   - Output: Plan (section order, target word counts, evaluation targets)
   - Determinism: YES
   - Seed: `seed + 0`

2. **STYLE** - Generate style specification
   - Input: SDS.style, Plan, Blueprint
   - Output: Style (tempo, key, mood, tags, instrumentation)
   - Determinism: YES
   - Policies: enforce_tempo_range, tag_conflict_check, profanity_filter
   - Seed: `seed + 1`

3. **LYRICS** - Generate lyrics with sources
   - Input: SDS.lyrics, Plan, Style, Sources, Blueprint
   - Output: Lyrics text, Citations (with hashes), Metrics (rhyme_tightness, singability, hook_density)
   - Determinism: YES (pinned retrieval by content hash)
   - Policies: profanity_filter, lexicon_enforcement, section_requirements
   - Seed: `seed + 2`

4. **PRODUCER** - Create production notes
   - Input: SDS.producer_notes, Plan, Style
   - Output: Producer Notes (structure, hooks, instrumentation, section tags, mix)
   - Determinism: YES
   - Seed: `seed + 3`

5. **COMPOSE** - Merge artifacts into composed prompt
   - Input: Style, Lyrics, Producer Notes, Engine Limits
   - Output: Composed Prompt (text + meta)
   - Determinism: YES
   - Policies: char_limit_check, tag_conflict_check, normalize_influences
   - Seed: `seed + 4`

6. **VALIDATE** - Score against blueprint rubric
   - Input: Lyrics, Style, Producer Notes, Blueprint, Rubric
   - Output: Scores (hook_density, singability, rhyme_tightness, section_completeness, profanity_score, total), Issues list
   - Determinism: YES
   - Decision: if `total ≥ min_total` && `profanity ≤ max_profanity` → RENDER, else → FIX

7. **FIX** (Loop ≤3 times) - Apply targeted repairs
   - Input: Issues, Style, Lyrics, Producer Notes, Blueprint
   - Output: Patched Style, Patched Lyrics, Patched Producer Notes
   - Determinism: YES
   - Back to: COMPOSE

8. **RENDER** (Conditional) - Submit to music engine
   - Input: Engine, Model, Composed Prompt, Num Variations
   - Output: Job ID, Asset URI(s)
   - Determinism: FALSE (external engine)
   - Condition: `render.engine ≠ "none"` && feature flag enabled
   - Seed: passed to engine; results recorded for replay

9. **REVIEW** - Finalize and emit completion events
   - Input: All artifacts, scores, citations, assets
   - Output: Final summary JSON, WebSocket events
   - Determinism: YES

### Run Manifest Schema

```json
{
  "song_id": "<uuid>",
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

### Determinism Requirements

- **Seed Propagation:** Each node uses `seed + node_index`
- **Pinned Retrieval:** Source chunks identified by content hash; `citations.json` records `chunk_hash`, `source_id`, `text`
- **Decoder Parameters:** Temperature ≤ 0.3, top_p ≤ 0.9, all parameters recorded
- **Reproducibility Target:** ≥99% identical outputs across 10 replays with frozen inputs

### Observability

All nodes emit structured events:
```json
{
  "ts": "2025-11-13T00:00:00Z",
  "run_id": "uuid",
  "node": "LYRICS",
  "phase": "start|end|fail",
  "duration_ms": 1234,
  "metrics": {},
  "issues": []
}
```

Events exposed via WebSocket at `/events`.

---

## Website Application Requirements

### Information Architecture

**Main Sections (Side Navigation):**
1. **Home** - Dashboard with recent songs, pending jobs, quick actions
2. **Styles** - Library of style definitions (filters: genre, mood, date)
3. **Lyrics** - Library of lyric specs (filters: language, POV, reading level)
4. **Personas** - Library of personas (search, group by artist/band)
5. **Blueprints** - Genre blueprints and rubrics
6. **Sources** - External source management
7. **Workflows** - Launch and monitor Claude Code runs (step status display)
8. **Settings** - Global settings, taxonomies, API keys, feature flags

### User Personas

1. **Songwriter** - Creates songs for personal/commercial use; non-technical
2. **Producer** - Technical user; wants custom production notes, data integration
3. **Editor/Reviewer** - Reviews, adjusts fields; ensures compliance before release

### User Flow: Create a New Song

1. **Start:** Click "New Song" → choose template or scratch
2. **Style Editor:** Genre, tempo (range), key (with modulations), mood (chips), energy, instrumentation, tags
   - Validation: Real-time conflict warnings (e.g., "very slow" + "high energy")
3. **Lyrics Editor:** Verses, choruses, bridges in separate fields
   - Settings: Rhyme scheme, meter, syllable target, POV, tense, hook strategy, repetition policy, imagery density
   - Sources: Select and weight sources (weights normalized to 1.0)
   - Profanity: Flagged if `explicit = false`
4. **Persona Selector:** Link existing persona or create new one
   - Vocal range, delivery, influences
   - Falls back to default generic voice if none selected
5. **Producer Notes:** Structure (template or custom), hooks count, instrumentation, per-section tags, mix prefs
6. **Summary:** Preview aggregated SDS JSON; review and edit any section; download or submit to workflow
7. **Execution:** Click "Generate" → Claude Code workflow runs
8. **Results:** Receive prompts, final lyrics, producer notes, composed prompt
9. **Render:** Optional submit to render engine or copy prompt manually (MVP)

### UI Component Requirements

**Inputs:**
- **Multi-select chips:** Mood, instrumentation, tags, sources, delivery styles
- **Sliders:** Tempo range (min/max handles), imagery density, weight distribution
- **Dropdowns:** Genre, key, energy level, persona kind, hook strategy, repetition policy
- **Text areas:** Lyrics per section, tags (with token chips for deny/allow lists)
- **Number inputs:** Hooks count, syllables per line, target duration per section, BPM
- **Toggles:** Source enable/disable, explicit content, public release policy
- **Autocomplete:** Influences, artist names, source scopes

**Panels & Displays:**
- Real-time JSON preview of spec being built
- Live syllable counter per line (highlight deviations from target)
- Character counter for prompt (show overflow; highlight truncation needed)
- Inline validation messages with corrective suggestions
- Section alignment warnings (structure ↔ section_order)
- Tag conflict detector with resolution hints

**Theme:**
- Dark background (#0f0f1c), purple/blue highlights
- Rounded cards with subtle shadows, semi-transparent accents
- Modern sans-serif typography
- Responsive, mobile-friendly

### Design Patterns (Reuse from MediPrompts)
- Card-list layouts with filters and search
- Skeleton loaders for async content
- Stepper/Accordion components to collapse optional sections
- Navigation drawers, breadcrumbs
- Toast notifications for validation errors, render job updates

---

## Entity Schemas & Requirements

### 1. Style Entity

**Purpose:** Encapsulates the musical identity (genre, tempo, key, mood, energy, instrumentation, tags).

**Schema Version:** 1.0

**Required Fields:**
- `genre_detail.primary` (string) - Core genre (e.g., "Pop", "Hip-Hop")
- `tempo_bpm` (integer or [min, max] array, 40-220) - BPM or range
- `key.primary` (string, format: `^[A-G](#|b)?\s?(major|minor)$`) - Musical key
- `mood` (array of strings) - Mood descriptors (e.g., "upbeat", "melancholic")
- `tags` (array of strings) - Taxonomized tags (limit 1-2 per category)

**Optional Fields:**
- `genre_detail.subgenres` (array) - Sub-genres (e.g., "Big Band Pop")
- `genre_detail.fusions` (array) - Genres to blend
- `time_signature` (string, default "4/4")
- `key.modulations` (array) - Keys for modulations
- `energy` (enum: "low", "medium", "high", "anthemic")
- `instrumentation` (array, max 3 items) - Instruments to highlight
- `vocal_profile` (string) - Vocal performer description
- `negative_tags` (array) - Tags to exclude

**Validation Rules:**
- If `tempo_bpm` is range: first ≤ second
- `energy` must align with tempo and instrumentation (flag slow BPM + high energy conflict)
- Tags from different categories must not conflict (use conflict matrix from taxonomy)
- Instrumentation limited to 3 items max

**UI Controls:**
- Multi-select chips for mood, instrumentation, tags (with search/autocomplete)
- Slider for tempo_bpm (min/max handles; collapse to single point if fixed)
- Dropdown for key with multiselect for modulations
- Radio buttons/select for energy level
- Live JSON preview

**Example:**
```json
{
  "genre_detail": {
    "primary": "Christmas Pop",
    "subgenres": ["Big Band Pop"],
    "fusions": ["Electro Swing"]
  },
  "tempo_bpm": [116, 124],
  "time_signature": "4/4",
  "key": {"primary": "C major", "modulations": ["E major"]},
  "mood": ["upbeat", "cheeky", "warm"],
  "energy": "anthemic",
  "instrumentation": ["brass", "upright bass", "handclaps", "sleigh bells"],
  "vocal_profile": "male/female duet, crooner + bright pop",
  "tags": ["Era:2010s", "Rhythm:four-on-the-floor", "Mix:modern-bright"],
  "negative_tags": ["muddy low-end"]
}
```

---

### 2. Lyrics Entity

**Purpose:** Defines textual content and structural constraints (sections, rhyme, meter, hook strategy, sources).

**Schema Version:** 1.0

**Required Fields:**
- `language` (string, default "en")
- `section_order` (array of strings) - Must include at least one "Chorus"
- `constraints` (object) - See below

**Optional Fields:**
- `pov` (enum: "1st", "2nd", "3rd")
- `tense` (enum: "past", "present", "future", "mixed")
- `themes` (array) - Narrative themes (e.g., "holiday hustle", "family")
- `rhyme_scheme` (string) - e.g., "AABB", "ABAB"
- `meter` (string) - e.g., "4/4 pop", "6/8 ballad"
- `syllables_per_line` (integer, 4-16)
- `hook_strategy` (enum: "melodic", "lyrical", "call-response", "chant")
- `repetition_policy` (enum: "sparse", "moderate", "hook-heavy")
- `imagery_density` (number, 0-1) - How metaphorical/descriptive
- `reading_level` (string) - e.g., "grade 4", "college"
- `source_citations` (array of {source_id, weight})

**Constraints Object:**
```json
{
  "explicit": false,
  "max_lines": 120,
  "section_requirements": {
    "Chorus": {
      "min_lines": 6,
      "max_lines": 10,
      "must_end_with_hook": true
    }
  }
}
```

**Validation Rules:**
- `section_order` MUST contain at least one "Chorus"
- If `hook_strategy ∈ ["lyrical", "chant"]`: require ≥2 chorus sections
- `source_citations.weight` must sum to ≤1.0; defaults to equal distribution
- If `repetition_policy = "hook-heavy"`: Chorus `min_lines` ≥ 6
- If `explicit = false`: profanity filter applied
- `syllables_per_line` deviations flagged for revision

**UI Controls:**
- Separate text areas for each section (Verse, Chorus, Bridge); collapsible panels
- Dropdowns/radio for pov, tense, hook_strategy, repetition_policy
- Slider for imagery_density
- Live syllable counter per line; highlight deviations
- Source selector with checkboxes and weight sliders

**Example:**
```json
{
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
  "reading_level": "grade 6",
  "section_order": ["Intro", "Verse", "PreChorus", "Chorus", "Verse", "PreChorus", "Chorus", "Bridge", "Chorus"],
  "constraints": {
    "explicit": false,
    "max_lines": 120,
    "section_requirements": {
      "Chorus": {"min_lines": 6, "max_lines": 10, "must_end_with_hook": true}
    }
  },
  "source_citations": [
    {"source_id": "uuid-family", "weight": 0.6},
    {"source_id": "uuid-asoiaf", "weight": 0.4}
  ]
}
```

---

### 3. Persona Entity

**Purpose:** Models the performing artist/band with identity, vocal characteristics, influences, and policy settings.

**Schema Version:** 1.0

**Required Fields:**
- `name` (string, unique per workspace)
- `kind` (enum: "artist", "band")

**Optional Fields:**
- `bio` (string) - Biographical text
- `voice` (string) - Timbre/character description (e.g., "airy soprano")
- `vocal_range` (string) - e.g., "soprano", "baritone"
- `delivery` (array) - e.g., ["crooning", "belting", "rap", "whispered"]
- `influences` (array) - Artists/genres influencing the persona
- `style_defaults` - Reference to default Style spec
- `lyrics_defaults` - Reference to default Lyrics spec
- `policy` (object):
  - `public_release` (boolean, default false) - Can be used for public releases
  - `disallow_named_style_of` (boolean, default true) - Prohibit "style of [Living Artist]"

**Validation Rules:**
- `name` must be unique and non-empty
- When `public_release = true`: automatically sanitize influences (remove specific living artist names; convert to generic descriptions)
- `delivery` cannot mix mutually exclusive styles (e.g., "whispered" + "belting" → warning)

**UI Controls:**
- Tabs: **Identity**, **Vocal**, **Influences**, **Defaults** (collapsible)
- Dropdown for `kind` (artist or band); for band, allow adding group member names
- Multi-select chips for `delivery` (with tooltips)
- Autocomplete for `influences` (with warning for living artists on public releases)
- Live preview card: name, voice, influences, avatar placeholder

**Example:**
```json
{
  "name": "North Pole Duo",
  "kind": "band",
  "bio": "A charming husband-and-wife team who perform festive songs with a modern twist.",
  "voice": "smooth male lead with playful female harmonies",
  "vocal_range": "baritone + mezzo-soprano",
  "delivery": ["crooning", "belting"],
  "influences": ["Bublé", "modern pop"],
  "style_defaults": { /* Style object */ },
  "lyrics_defaults": { /* Lyrics object */ },
  "policy": {
    "public_release": true,
    "disallow_named_style_of": true
  }
}
```

---

### 4. Producer Notes Entity

**Purpose:** Defines structural and production aspects (arrangement, hooks, instrumentation, per-section tags, mix).

**Schema Version:** 1.0

**Required Fields:**
- `structure` (string) - e.g., "Intro–Verse–Pre-Chorus–Chorus–Verse–Pre-Chorus–Chorus–Bridge–Chorus"
- `hooks` (integer, ≥0) - Number of hooks (memorable phrases)

**Optional Fields:**
- `instrumentation` (array) - Additional instrument notes beyond style
- `section_meta` (object) - Map keyed by section name:
  - `tags` (array) - Section-specific tags (e.g., "anthemic", "stripped-down")
  - `target_duration_sec` (integer, positive) - Desired section length
- `mix` (object):
  - `lufs` (number) - Target loudness (Loudness Units relative to Full Scale)
  - `space` (string) - Reverb description (e.g., "lush", "roomy")
  - `stereo_width` (enum: "narrow", "normal", "wide")

**Validation Rules:**
- `hooks` ≥ 0 (warn if zero; may lack memorability)
- `structure` must include at least one section from lyrics' `section_order`; warn on mismatch
- Section names in `section_meta` must appear in `structure`; extra entries ignored with log
- `target_duration_sec` must be positive; sum should be ±30 sec from SDS `constraints.duration_sec`

**UI Controls:**
- Editable list for `structure` (reorder, add, remove sections); templates (ABAB, ABABCBB)
- Number input/stepper for `hooks` (with explanatory text, blueprint guidelines)
- Multi-select chips for `section_meta.tags` (filtered by taxonomy)
- Sliders/inputs for `target_duration_sec`; show running total
- Advanced section for `mix` settings (with tooltips)

**Example:**
```json
{
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
  "mix": {
    "lufs": -12.0,
    "space": "lush",
    "stereo_width": "wide"
  }
}
```

---

### 5. Source Entity

**Purpose:** Registers external knowledge bases (files, APIs, MCP servers) for retrieval-augmented lyric generation.

**Schema Version:** 1.0

**Required Fields:**
- `name` (string, unique per workspace) - Human-readable identifier
- `kind` (enum: "file", "web", "api") - Source type
- `mcp_server_id` (string) - MCP server hosting retrieval functions

**Optional Fields:**
- `config` (object) - Source-specific config (file_path, base_url, auth tokens, etc.)
- `scopes` (array) - Categories/topics available (e.g., "characters", "family_history")
- `weight` (number, 0-1, default 0.5) - Relative contribution during retrieval
- `allow` (array) - Terms/patterns explicitly allowed from source
- `deny` (array) - Terms/patterns to exclude (profanity, spoilers)
- `provenance` (boolean, default true) - Return text snippets with metadata (doc ID, hash)

**Validation Rules:**
- `name` must be unique
- `allow` and `deny` lists cannot overlap; overlaps removed from `allow` with warning
- `weight` values normalized across all citations in a lyrics spec (sum to 1.0)
- `scopes` must be valid for associated MCP server

**UI Controls:**
- Card list with icons (file, web, api)
- Toggle enable/disable per source
- Multi-select for `scopes` (checkboxes/chips); verify support with MCP server
- Weight slider (0-1); show normalized distribution
- Text areas for `allow` and `deny` (token chips; conflict warnings)

**Example:**
```json
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
}
```

---

### 6. Blueprint Entity

**Purpose:** Encodes algorithmic rules and scoring rubric for a genre (tempo ranges, required sections, banned terms, lexicon, weights, thresholds).

**Schema Version:** 1.0

**Required Fields:**
- `genre` (string) - Genre name (e.g., "Christmas Pop")
- `version` (string) - Version identifier (e.g., "2025.11")
- `rules` (object) - Structural rules
- `eval_rubric` (object) - Scoring rubric

**Rules Object:**
```json
{
  "tempo_bpm": [100, 130],
  "required_sections": ["Verse", "Chorus", "Bridge"],
  "banned_terms": ["explicit expletives"],
  "lexicon_positive": ["snow", "holly", "mistletoe"],
  "lexicon_negative": ["sadness", "pain"],
  "section_lines": {
    "Verse": {"min": 8, "max": 16},
    "Chorus": {"min": 6, "max": 10}
  }
}
```

**Eval Rubric Object:**
```json
{
  "weights": {
    "hook_density": 0.25,
    "singability": 0.25,
    "rhyme_tightness": 0.20,
    "section_completeness": 0.20,
    "profanity_score": 0.10
  },
  "thresholds": {
    "min_total": 0.85,
    "max_profanity": 0.05
  }
}
```

**Validation Rules:**
- `tempo_bpm` must be [min, max] with min ≤ max
- `weights` must sum to 1.0 (UI normalizes)
- `min_total` and `max_profanity` must be 0-1
- `required_sections` must be non-empty

**UI Controls:**
- **Rules Tab:** Tempo range slider, required sections multi-select, banned terms text area, positive/negative lexicon inputs
- **Rubric Tab:** Weight sliders (auto-normalize to sum 1.0), threshold inputs, line count guidance (per-section sliders)
- Preview charts of expected vs. actual line counts

**Example:**
```json
{
  "genre": "Christmas Pop",
  "version": "2025.11",
  "rules": { /* See above */ },
  "eval_rubric": { /* See above */ }
}
```

---

### 7. Song Design Spec (SDS) Entity

**Purpose:** Master aggregator combining all entities into a single specification for the Claude Code workflow.

**Schema Version:** 1.0

**Required Fields:**
- `title` (string)
- `blueprint_ref` (object with `genre`, `version`)
- `style` - Full Style object
- `lyrics` - Full Lyrics object
- `producer_notes` - Full Producer Notes object
- `sources` (array) - Array of Source objects
- `prompt_controls` (object)
- `render` (object)
- `seed` (integer, ≥0)

**Optional Fields:**
- `persona_id` (string or null)

**Prompt Controls Object:**
```json
{
  "positive_tags": [],
  "negative_tags": ["muddy low-end"],
  "max_style_chars": 1000,
  "max_prompt_chars": 5000
}
```

**Render Object:**
```json
{
  "engine": "suno" | "none" | "external",
  "model": "chirp-v3-5" | null,
  "num_variations": 2 (1-8, default 2)
}
```

**Validation Rules:**
- All required properties must be present
- If `render.engine = "suno"`: ensure `prompt_controls.max_style_chars` and `max_prompt_chars` are set
- `sources` weights normalized to sum 1.0 (negative/zero weights disallowed)
- `seed` non-negative

**UI Workflow:**
1. Collect inputs across style, lyrics, producer notes, persona, sources editors
2. SDS preview on final step before submission (expandable sections show nested JSON)
3. Users can edit any entity; SDS preview updates in real time
4. Submit triggers Claude Code run; real-time status via WebSocket
5. After completion: SDS stored with resulting prompts and assets
6. Clone SDS for further experimentation

**Example:**
```json
{
  "title": "Elf On Overtime",
  "blueprint_ref": {"genre": "Christmas Pop", "version": "2025.11"},
  "style": { /* Style object */ },
  "lyrics": { /* Lyrics object */ },
  "producer_notes": { /* Producer Notes object */ },
  "persona_id": null,
  "sources": [ /* Array of Source objects */ ],
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

---

### 8. Composed Prompt Entity

**Purpose:** Final text + metadata sent to music engine; merges style, lyrics, producer notes with character limits.

**Schema Version:** 0.2

**Required Fields:**
- `text` (string) - Full prompt for music engine
- `meta` (object) - Metadata

**Meta Object:**
```json
{
  "title": "Elf On Overtime",
  "genre": "Christmas Pop",
  "tempo_bpm": 120 | [120, 124],
  "structure": "Intro–Verse–Pre-Chorus–Chorus...",
  "style_tags": ["Era:2010s", "Genre:Christmas Pop", "Energy:anthemic"],
  "negative_tags": ["muddy low-end"],
  "section_tags": {
    "Intro": ["instrumental", "low energy"],
    "Chorus": ["anthemic", "hook-forward"]
  },
  "model_limits": {
    "style_max": 1000,
    "prompt_max": 5000
  }
}
```

**Composition Process:**
1. Title & Metadata: `Title: {title}, Genre/Style: {genre} | BPM: {tempo_bpm} | Mood: {primary mood(s)}`
2. Style Description: Comma-separated `style_tags` (one per category: era → genre → energy → instr → rhythm → vocal → mix)
3. Structure & Voice: Mention `structure` and vocal profile from persona/style
4. Lyrics with Meta Tags: Include lyrics text, prefix each section with its tags
5. Production Notes: Summarize instrumentation, mix, hook count
6. Constraints & Policy: Indicate explicit content allowed, language
7. Check Limits: Verify `style_tags` length ≤ `style_max`, entire prompt ≤ `prompt_max`

**Validation Rules:**
- Enforce model character limits; truncate/simplify if exceeded
- `section_tags` keys must match sections in `structure` and lyrics
- Conflict matrix prevents contradictory tags; drop lower-priority on conflicts
- Avoid "style of [living artist]" in public prompts; convert using persona policy

**UI Controls:**
- Read-only preview of composed prompt
- Copy-to-clipboard button
- Character counters (style and full prompt); highlight overflow
- Accordion for advanced details (negative_tags, per-section tags; hide for novices)
- Export as JSON + text

**Example:**
```json
{
  "text": "Title: Elf On Overtime\nGenre/Style: Christmas Pop | BPM: 120 | Mood: upbeat, cheeky\n...",
  "meta": { /* See above */ }
}
```

---

### 9. Render Job Entity

**Purpose:** Represents a request to a music rendering engine (Suno, etc.).

**Schema Version:** 1.0

**Required Fields:**
- `engine` (string) - "suno-v5", "manual", "external"
- `model` (string) - "chirp-v3-5", etc.
- `composed_prompt` - Full Prompt object
- `num_variations` (integer, 1-8)
- `seed` (integer)

**Optional Fields:**
- `callbacks` (object):
  - `webhook` (string) - HTTPS URL for completion callback
  - `events` (boolean) - Stream progress via WebSocket

**Validation Rules:**
- `engine` cannot be empty; if `engine = "manual"`, `model` may be omitted
- `num_variations` must be 1-8; capped by engine support
- `callbacks.webhook` must be valid HTTPS URL if provided

**Workflow:**
1. **Submission:** User clicks "Render"; app creates render job with engine/model, composed prompt, num_variations
2. **Queueing:** Render connector queues job, returns job ID
3. **Polling & Updates:** Backend polls engine API or streams events; updates via WebSocket (queued, processing, rendered)
4. **Completion:** Job status = "complete"; audio assets stored in assets table
5. **Webhook:** If `callbacks.webhook` set, results POSTed to URL; retry with exponential backoff (max 3)
6. **Failure Handling:** On error, job status = "failed"; user can retry

**UI Flow:**
- Display job status in **Workflows** page with progress bars
- Show audio assets with playback controls, download, delete buttons
- Notifications on completion/failure with retry option

---

## API Contracts & Endpoints

### Orchestration Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/runs` | Create new run | `{song_id, sds_id, manifest, seed}` | `{run_id}` |
| `GET` | `/runs/{run_id}` | Fetch run status | - | `{run_id, status, node, progress, outputs, issues}` |
| `POST` | `/runs/{run_id}/retry` | Retry failed node | `{node_id}` | `{run_id, status}` |
| `POST` | `/runs/{run_id}/cancel` | Cancel in-progress run | - | `{run_id, status}` |
| `WS` | `/events` | WebSocket channel | - | `{ts, run_id, node, phase, duration_ms, metrics, issues}` |

### Entity CRUD Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/styles` | Create style | `{Style object}` | `{id, ...Style}` |
| `GET` | `/styles/{id}` | Retrieve style | - | `{Style object}` |
| `PUT` | `/styles/{id}` | Update style | `{Style object}` | `{id, ...Style}` |
| `DELETE` | `/styles/{id}` | Delete style | - | `{status}` |
| `GET` | `/styles` | List styles | `?genre=&mood=&page=` | `{items: [Style], total, page}` |
| `POST` | `/lyrics` | Create lyrics | `{Lyrics object}` | `{id, ...Lyrics}` |
| `GET` | `/lyrics/{id}` | Retrieve lyrics | - | `{Lyrics object}` |
| `PUT` | `/lyrics/{id}` | Update lyrics | `{Lyrics object}` | `{id, ...Lyrics}` |
| `DELETE` | `/lyrics/{id}` | Delete lyrics | - | `{status}` |
| `POST` | `/personas` | Create persona | `{Persona object}` | `{id, ...Persona}` |
| `GET` | `/personas/{id}` | Retrieve persona | - | `{Persona object}` |
| `PUT` | `/personas/{id}` | Update persona | `{Persona object}` | `{id, ...Persona}` |
| `DELETE` | `/personas/{id}` | Delete persona | - | `{status}` |
| `POST` | `/producer_notes` | Create producer notes | `{ProducerNotes object}` | `{id, ...ProducerNotes}` |
| `GET` | `/producer_notes/{id}` | Retrieve producer notes | - | `{ProducerNotes object}` |
| `PUT` | `/producer_notes/{id}` | Update producer notes | `{ProducerNotes object}` | `{id, ...ProducerNotes}` |
| `DELETE` | `/producer_notes/{id}` | Delete producer notes | - | `{status}` |
| `POST` | `/sources` | Create source | `{Source object}` | `{id, ...Source}` |
| `GET` | `/sources/{id}` | Retrieve source | - | `{Source object}` |
| `PUT` | `/sources/{id}` | Update source | `{Source object}` | `{id, ...Source}` |
| `DELETE` | `/sources/{id}` | Delete source | - | `{status}` |
| `POST` | `/blueprints` | Create blueprint | `{Blueprint object}` | `{id, ...Blueprint}` |
| `GET` | `/blueprints/{id}` | Retrieve blueprint | - | `{Blueprint object}` |
| `PUT` | `/blueprints/{id}` | Update blueprint | `{Blueprint object}` | `{id, ...Blueprint}` |
| `GET` | `/blueprints` | List blueprints | `?genre=` | `{items: [Blueprint], total}` |
| `POST` | `/prompts` | Create composed prompt | `{ComposedPrompt object}` | `{id, ...ComposedPrompt}` |
| `GET` | `/prompts/{id}` | Retrieve composed prompt | - | `{ComposedPrompt object}` |
| `POST` | `/songs` | Create song with SDS | `{SDS object}` | `{song_id, sds_id}` |
| `GET` | `/songs/{song_id}` | Retrieve song + SDS | - | `{song_id, title, sds: {...}, artifacts: {...}}` |
| `POST` | `/songs/{song_id}/runs` | Launch workflow | `{blueprint_genre, seed, flags}` | `{run_id}` |
| `GET` | `/songs` | List songs | `?page=&created_after=` | `{items: [Song], total, page}` |
| `POST` | `/render_jobs` | Create render job | `{RenderJob object}` | `{job_id, status}` |
| `GET` | `/render_jobs/{job_id}` | Retrieve render job | - | `{RenderJob object}` |
| `GET` | `/render_jobs` | List render jobs | `?status=&song_id=` | `{items: [RenderJob], total}` |

### Common Response Envelope

All endpoint responses follow:
```json
{
  "data": { /* response payload */ },
  "errors": null,
  "meta": {
    "request_id": "uuid",
    "timestamp": "2025-11-13T00:00:00Z",
    "elapsed_ms": 123
  }
}
```

**Error Responses:**
```json
{
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "FORBIDDEN",
      "message": "Human-readable error",
      "field": "optional_field_name",
      "details": {}
    }
  ],
  "meta": {}
}
```

---

## Validation Rules & Constraints

### Global Constraints

| Constraint | Value | Applies To |
|-----------|-------|-----------|
| **Determinism Requirement** | ≥99% identical outputs on replay | All PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX nodes |
| **Seed Propagation** | `seed + node_index` | Each node |
| **Decoder Temp** | ≤0.3 | All text generation |
| **Decoder Top-P** | ≤0.9 | All text generation |
| **Min BPM** | 40 | All tempos |
| **Max BPM** | 220 | All tempos |
| **Max Instruments** | 3 | Style.instrumentation |
| **Syllables Per Line** | 4-16 | Lyrics |
| **Profanity Threshold** | ≤ eval_rubric.thresholds.max_profanity | All lyrics |
| **Min Total Score** | ≥ eval_rubric.thresholds.min_total | Validation pass/fail decision |
| **Max Fix Cycles** | 3 | Auto-fix loop |
| **Max Render Variations** | 1-8 | Render job |
| **Source Weight Sum** | ≤ 1.0 | Source citations |
| **Rubric Weights Sum** | 1.0 | Blueprint.eval_rubric.weights |

### Conflict Matrix (Tag Categories)

Tag conflicts are defined per taxonomy:

**Example Conflicts:**
- `Era:1970s` ↔ `Era:2020s` → Cannot both be selected
- `Energy:very slow` ↔ `Energy:high energy` → Flag as conflict
- `Mood:melancholic` ↔ `Energy:anthemic` → Warn but allow

**Enforcement Locations:**
- Style.tags validation (UI)
- Prompt composition tag selection (prevent conflicting tags from appearing together)

### Determinism Assurance Checklist

**In LYRICS node specifically:**
- [ ] All source chunks identified by content hash
- [ ] `citations.json` records `{chunk_hash, source_id, text}`
- [ ] On re-run, same chunks loaded by hash
- [ ] Retrieval results sorted lexicographically (not by relevance score)
- [ ] Fixed top-k for each source (no dynamic trimming)

---

## Acceptance Criteria & Quality Gates

### Functional Acceptance Criteria

#### Website Application
- [ ] Users can **create, edit, clone, delete** all entities (Style, Lyrics, Persona, Producer Notes, Source) via UI
- [ ] Forms correctly **enforce required fields** and show validation errors inline
- [ ] System can **compile SDS** and start Claude Code run with one click
- [ ] Each workflow step (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER) is **recorded and visible** in Workflows page
- [ ] **Error notifications** show details when steps fail; users can retry failed nodes
- [ ] Generated prompts and outputs **adhere to blueprint rubric** (≥95% pass rate)
- [ ] **99% of runs are deterministic** (identical outputs with same seed + inputs)

#### Orchestration & Workflow
- [ ] Orchestrator executes graph in order, respecting dependencies and conditions
- [ ] All node outputs **stored in database** and accessible via API
- [ ] Deterministic nodes produce **identical outputs** for same SDS + seed across runs
- [ ] Non-deterministic nodes (RENDER) **record responses** for replay
- [ ] Validations **enforce blueprint constraints** and policy rules
- [ ] ≥95% of compositions **pass validation** without manual edits on test suite
- [ ] Failed nodes **trigger fix loop** (≤3 cycles); after fix, re-enter COMPOSE
- [ ] Events **emitted for node start/end/fail** with accurate timestamps and metrics
- [ ] **WebSocket stream** reconnects gracefully
- [ ] **Runs can be cancelled and retried** via API; cancellation stops further execution
- [ ] **Orchestrator gracefully handles agent errors**, logs them, surfaces issues to UI

#### Claude Code Skills (Determinism)
- [ ] **PLAN:** Same SDS + seed → identical plan outputs
- [ ] **STYLE:** Same style input + plan + blueprint + seed → identical style output
- [ ] **LYRICS:** Same lyrics input + plan + style + sources + seed → identical lyrics + citations
  - Retrieval must use pinned chunks (by hash), fixed top-k, lexicographic sort
- [ ] **PRODUCER:** Same input + seed → identical producer notes
- [ ] **COMPOSE:** Same artifacts + engine limits + seed → identical composed prompt
- [ ] **VALIDATE:** Same inputs → identical scores and issues
- [ ] **FIX:** Same issues + inputs + seed → identical patches
- [ ] **RENDER:** External response recorded; replay uses recorded result

### Acceptance Gate Thresholds

**Gate A: Rubric Compliance**
- [ ] Rubric pass rate ≥ 95% on 200-song synthetic test set
- [ ] All weights sum to 1.0
- [ ] All required sections present

**Gate B: Determinism Reproducibility**
- [ ] Determinism reproducibility ≥ 99% across 10 replays
- [ ] Same seed + SDS → byte-for-byte identical outputs (excluding timestamps)
- [ ] Citation hashes match across replays

**Gate C: Security & Policy**
- [ ] MCP allow-list audit clean (no unauthorized scope access)
- [ ] No PII leakage from sources
- [ ] Profanity filter effective (no banned terms in public outputs)
- [ ] Influence normalization working (no "style of [Living Artist]" in public prompts)

**Gate D: Latency & Performance**
- [ ] Plan → Composed Prompt latency P95 ≤ 60s (excluding render)
- [ ] Per-node latency tracked and acceptable
- [ ] Database queries optimized (proper indexes on run_id, song_id, created_at)

### Performance Targets (MVP)

| Metric | Target |
|--------|--------|
| **Plan → Prompt Latency (P95)** | ≤ 60 seconds (excluding render) |
| **Rubric Pass Rate** | ≥ 95% without manual edits |
| **Repro Rate** | ≥ 99% identical across 10 replays |
| **Security** | Zero high-severity MCP violations |
| **Availability** | 99.5% uptime |

---

## Dependencies Between Components

### PRD Dependency Graph

```
Claude Code Orchestration PRD
├── PLAN node → uses SDS PRD
├── STYLE node → uses Style PRD, Blueprint PRD
├── LYRICS node → uses Lyrics PRD, Sources PRD, Blueprint PRD
├── PRODUCER node → uses Producer Notes PRD, Style PRD
├── COMPOSE node → uses Prompt PRD, Style PRD, Lyrics PRD, Producer Notes PRD
├── VALIDATE node → uses Blueprint PRD, Prompt PRD
├── FIX node → uses Lyrics PRD, Style PRD, Producer Notes PRD, Blueprint PRD
├── RENDER node → uses Render Job PRD, Prompt PRD
└── REVIEW node → aggregates all outputs

Website App PRD
├── SDS Editor → aggregates Style, Lyrics, Persona, Producer Notes, Sources, Blueprints
├── Styles Library → CRUD Style entity
├── Lyrics Library → CRUD Lyrics entity
├── Personas Library → CRUD Persona entity
├── Producer Notes Editor → CRUD Producer Notes entity
├── Sources Manager → CRUD Source entity
├── Blueprints Manager → CRUD Blueprint entity
├── Workflows Page → monitors Claude Code Orchestration runs
└── Render Jobs Page → tracks Render Job entities

SDS PRD (aggregator)
├── depends on Style PRD
├── depends on Lyrics PRD
├── depends on Persona PRD (optional)
├── depends on Producer Notes PRD
├── depends on Sources PRD (array)
└── depends on Blueprint PRD (reference)

Style PRD (entity)
└── used by: Claude Code (STYLE node), SDS, Website (Style Editor)

Lyrics PRD (entity)
├── used by: Claude Code (LYRICS node), SDS, Website (Lyrics Editor)
└── depends on: Sources PRD

Persona PRD (entity)
├── used by: SDS (optional), Website (Persona Selector)
└── optional in SDS; falls back to default generic voice

Producer Notes PRD (entity)
├── used by: Claude Code (PRODUCER node), SDS, Website (Producer Notes Editor)
└── coordinates with Lyrics (section_order alignment)

Sources PRD (entity)
├── used by: Lyrics (retrieval-augmented generation), SDS
└── depends on: MCP servers for retrieval

Blueprint PRD (entity)
├── used by: Claude Code (STYLE, LYRICS, COMPOSE, VALIDATE, FIX nodes), SDS
└── genre-specific rules and rubrics

Prompt PRD (entity)
├── produced by: Claude Code (COMPOSE node)
├── used by: Render Job, Website (Prompt Preview)
└── depends on: Style, Lyrics, Producer Notes (merged inputs)

Render Job PRD (entity)
├── created by: Website (Render Page), Claude Code (RENDER node)
├── uses: Prompt (composed_prompt field)
└── optional in MVP (manual copy-paste to Suno)
```

### Data Flow Dependencies

```
User Input (Website App)
  ↓
SDS Assembly (aggregates Style, Lyrics, Persona, Producer Notes, Sources)
  ↓
Store SDS in Database
  ↓
Create Run Manifest
  ↓
Orchestrator executes Claude Code Graph:
  ↓
  PLAN
    ↓ (outputs: plan.json)
  ┌─────────────────────────────────┐
  ├→ STYLE (uses plan, blueprint)
  ├→ LYRICS (uses plan, style, sources, blueprint)
  └→ PRODUCER (uses plan, style)
    ↓ (all outputs complete)
  COMPOSE (uses style, lyrics, producer notes, engine limits)
    ↓ (outputs: composed_prompt)
  VALIDATE (uses lyrics, style, producer notes, blueprint rubric)
    ↓
  [if score ≥ min_total: RENDER]
  [if score < min_total: FIX → COMPOSE → VALIDATE (loop ≤3)]
    ↓
  RENDER (conditional; uses composed_prompt, engine)
    ↓ (outputs: job_id, asset_uris)
  REVIEW (aggregates all artifacts)
    ↓
Store run artifacts in Database
  ↓
Emit completion events via WebSocket
  ↓
Website displays results (prompts, lyrics, scores, audio assets)
```

### Schema Inheritance & Composition

```
SDS
├── Style (v1.0)
├── Lyrics (v1.0)
│   └── source_citations: Source[] (v1.0)
├── Persona (v1.0) [optional]
│   ├── style_defaults: Style (v1.0)
│   └── lyrics_defaults: Lyrics (v1.0)
├── ProducerNotes (v1.0)
├── Sources[]: Source (v1.0)
├── Blueprint (v1.0)
│   ├── rules (tempo_bpm, required_sections, banned_terms, lexicon, section_lines)
│   └── eval_rubric (weights, thresholds)
└── ComposedPrompt (v0.2)
    ├── text: final prompt string
    └── meta: structured metadata
        ├── style_tags
        ├── section_tags
        ├── model_limits
        └── ...
```

---

## Future Extensions (Post-MVP)

### 2.1 Direct Music Engine Integration

**Feature Flag:** `render.suno.enabled`

**Components:**
- API Connector service (manages auth, rate limits, job polling, error handling)
- `/render_jobs` endpoint for programmatic submission
- Job tracking in database (pending, running, completed, failed)
- Real-time UI updates via WebSocket
- Model awareness (check supported models, max prompt length)
- Fallback: manual copy-paste when feature disabled

**Dependencies:**
- Render Job PRD (already defined)
- Suno API documentation and rate limits

---

### 2.2 Analytics and Tracking

**Components:**
- Manual data entry form (release date, platforms, URLs, stats)
- Automated ingestion (Spotify for Artists, Apple Music API with OAuth)
- Analytics dashboards (trends, comparisons, aggregations by persona/genre)
- Notifications (milestones, threshold alerts)
- CSV export capability

**Dependencies:**
- New Analytics entity PRD (to be created)
- Third-party platform API integrations

---

### 2.3 Direct Claude Code Invocation

**Goal:** Move Claude Code closer to front-end via hosted APIs or client-side runners.

**Components:**
- Hosted skill endpoints (HTTP-callable)
- Optional WebAssembly/serverless client-side components
- JWT token authorization
- Request throttling
- Event streaming back to client

**Dependencies:**
- Claude Code infrastructure enhancements

---

### 2.4 Collaborative Editing

**Components:**
- CRDT or operational transform for JSON document sync
- WebSocket-based real-time propagation
- User presence indicators (avatars, cursors)
- Inline comments and change tracking
- History & versioning (revert, diffs)
- Extended RBAC (view, edit, comment, admin)

**Dependencies:**
- New CRDT/sync library integration
- Database schema for edit history
- User/permission schema extensions

---

### 2.5 Plugin Ecosystem

**Components:**
- Plugin API with hooks (beforeStyle, afterLyrics, customEval)
- Plugin manifest format
- Sandbox execution (containers or serverless)
- Allow-list for external network access
- Marketplace/listing page
- Semantic versioning and auto-updates

**Dependencies:**
- Plugin architecture specification PRD
- Container/serverless deployment infrastructure

---

### 2.6 Advanced Features

**Stem Export & DAW Integration**
- Multi-track output from music engine
- Project files for DAWs (Ableton, FL Studio)
- Advanced Producer Notes schema supporting per-stem details

**AI Feedback & Coaching**
- Post-generation AI critique (e.g., "chorus could be catchier")
- Improvement suggestions based on analytics
- User feedback loops

**Marketplace & Community Sharing**
- User-generated content sharing (styles, lyrics, personas, songs)
- Rating systems and leaderboards
- Moderation requirements
- ToS updates for content sharing

---

## Implementation Roadmap (Phases)

### Phase 1: Bootstrap ✓ (Complete)
- [x] Repository setup and infrastructure copied from MeatyPrompts
- [x] Configuration and secrets management
- [x] Documentation scaffolding

### Phase 2: Database Schema & Core Entities (In Progress)
- [ ] SQLAlchemy models for all entities (Style, Lyrics, Persona, Producer Notes, Sources, Blueprint, SDS, Composed Prompt, Render Job)
- [ ] Repository layer CRUD operations
- [ ] Service layer business logic
- [ ] API endpoints (all entity CRUD + orchestration endpoints)
- [ ] Database migrations and seeding

### Phase 3: Claude Code Orchestration
- [ ] Implement skill contracts (plan.generate, style.generate, lyrics.generate, producer.generate, prompt.compose, validate.evaluate, fix.apply, render.submit)
- [ ] Build workflow orchestrator (DAG runner, determinism enforcement, event emission)
- [ ] WebSocket event streaming
- [ ] Run persistence and recovery

### Phase 4: Frontend Application
- [ ] React/Next.js setup with Tailwind and component library
- [ ] Entity editor pages (Style, Lyrics, Persona, Producer Notes, Sources, Blueprints)
- [ ] SDS aggregator and preview
- [ ] Workflow monitor page
- [ ] Results display and prompt export

### Phase 5: Integration & Testing
- [ ] E2E tests (full workflow from SDS creation to output generation)
- [ ] Determinism validation tests
- [ ] Performance benchmarking
- [ ] Security audit (PII, profanity, influence normalization)

### Phase 6: Launch & Monitoring
- [ ] Manual render support (copy-paste prompts to Suno)
- [ ] Production deployment
- [ ] User feedback collection
- [ ] Bug fixes and iteration

### Phase 7+: Future Extensions (Post-MVP)
- [ ] Direct engine integration
- [ ] Analytics tracking
- [ ] Collaborative editing
- [ ] Plugin ecosystem
- [ ] Advanced features (stems, DAW export, marketplace)

---

## Key Metrics & Thresholds

### Quality Metrics

| Metric | Target | Gate |
|--------|--------|------|
| Rubric Pass Rate | ≥ 95% | Gate A |
| Determinism Reproducibility | ≥ 99% | Gate B |
| Security Audit | Zero high-severity violations | Gate C |
| Latency (Plan→Prompt, P95) | ≤ 60s | Gate D |
| API Response Time (p50) | ≤ 500ms | Monitoring |
| API Response Time (p95) | ≤ 2000ms | Monitoring |
| Database Query Time (p95) | ≤ 200ms | Monitoring |
| Error Rate | < 0.1% | Monitoring |

### Acceptance Test Coverage

| Category | Min Coverage |
|----------|--------------|
| Happy Path Workflows | 100% |
| Edge Cases (boundary values) | ≥ 90% |
| Error Scenarios | ≥ 85% |
| Determinism Tests | 100% |
| Security Tests | ≥ 95% |

---

## Glossary

| Term | Definition |
|------|-----------|
| **SDS** | Song Design Spec — master aggregator combining all entities |
| **Blueprint** | Genre-specific rules and scoring rubric |
| **Rubric** | Evaluation weights and pass/fail thresholds |
| **Determinism** | Identical outputs given same inputs + seed |
| **Pinned Retrieval** | Source chunks identified by content hash for reproducibility |
| **Composer** | Claude Code skill that merges artifacts into final prompt |
| **Connector** | Pluggable adapter for render engines (e.g., Suno) |
| **Run Manifest** | Configuration specifying which nodes to execute and parameters |
| **Meta Tags** | Structural tags (`[Intro]`, `[Verse]`), vocal tags, instrument tags, effect tags |
| **Hook** | Memorable phrase or melody that recurs in a song |
| **Citations** | Record of source chunks used during generation (includes hash for determinism) |
| **Provenance** | Metadata about source origin and authenticity |

---

## Notes for Agents

1. **Before implementing any feature**, consult the relevant PRD and this summary.
2. **Determinism is non-negotiable:** All PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX nodes must be 100% deterministic.
3. **Database schema** must include: `id` (UUID), `created_at`, `updated_at`, `version`, `status` on all entity tables.
4. **Foreign keys** establish relationships: song → persona, lyrics → sources[], sds → blueprint, run → sds.
5. **Validation is multi-layered:** UI validation (real-time feedback), API validation (schema + business rules), orchestration validation (blueprint constraints, policy guards).
6. **Events are critical:** Emit WebSocket events for every major state change to keep UI in sync.
7. **Error handling:** Gracefully handle agent failures, log comprehensively, surface user-friendly messages.
8. **Testing:** Write determinism tests early; they validate the most critical requirement.

---

**Document Version:** 1.0
**Last Reviewed:** 2025-11-13
**Maintained By:** Documentation Team
**Status:** APPROVED FOR AGENT CONSUMPTION
