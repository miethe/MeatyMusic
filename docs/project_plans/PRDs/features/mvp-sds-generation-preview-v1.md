# PRD - MVP Song Design Spec (SDS) Generation and Preview

## 1. Purpose

This PRD defines the **MVP Song Design Spec (SDS) Generation and Preview** feature, which enables users to create songs with partial entity data and automatically generate a complete, valid SDS JSON with intelligent blueprint-driven defaults. The feature provides multiple viewing and export options for the generated SDS.

**Goals:**

* Allow users to create songs with minimal required input, automatically filling gaps with deterministic defaults
* Generate complete, schema-valid SDS JSON from user-provided and defaulted entity data
* Display SDS JSON in-app with formatting and syntax highlighting
* Enable export of SDS JSON for external use or archival
* Show comprehensive song details including all related entities

**Non-Goals (out of scope for MVP):**

* Claude Code workflow execution with GenAI content generation
* Real-time WebSocket updates during generation
* AI-powered content generation for lyrics or other entities
* Suno or other render engine integration
* Collaborative editing or versioning

## 2. Background and Context

MeatyMusic's Agentic Music Creation System (AMCS) uses the Song Design Spec (SDS) as the canonical specification for deterministic music generation. The SDS aggregates all entity definitions (style, lyrics, persona, producer notes, sources, blueprint reference) into a single JSON document that serves as input to the workflow orchestrator.

**Current State:**

* Phase 1 bootstrap complete (infrastructure validated)
* Entity schemas defined in `/schemas/*.schema.json`
* PRDs exist for all entities and SDS structure
* Database models and UI scaffolding in place

**Gap:**

Users cannot yet create complete SDS documents through the UI. The system needs a way to:
1. Accept partial entity data from users
2. Apply genre-specific blueprint defaults for missing fields
3. Compile a valid SDS JSON
4. Display and export the SDS

**User Value:**

* Enables rapid song creation without requiring expertise in every musical domain
* Provides transparency into the complete specification
* Allows external tools to consume MeatyMusic specifications
* Serves as foundation for future workflow orchestration

## 3. Related PRDs and References

This PRD builds upon and integrates with:

* **`sds.prd.md`** - SDS schema and aggregation contract
* **`style.prd.md`** - Style entity schema and validation rules
* **`lyrics.prd.md`** - Lyrics entity schema and constraints
* **`persona.prd.md`** - Persona/band entity structure
* **`producer_notes.prd.md`** - Producer notes and arrangement guidance
* **`blueprint.prd.md`** - Genre-specific rules and defaults
* **`sources.prd.md`** - External knowledge source definitions
* **`website_app.prd.md`** - UI routes, screens, and component patterns

**Blueprint References:**

* `/docs/hit_song_blueprint/AI/*.md` - Genre-specific hit song blueprints
* Blueprints define tempo ranges, required sections, mood vocabularies, and structural patterns per genre

## 4. User Personas

1. **Songwriter (Primary)** - Wants to quickly create song specifications without deep technical knowledge. Expects intelligent defaults to guide their creative decisions.

2. **Producer (Secondary)** - Needs to generate complete specifications for experimentation. Values transparency and ability to export/share specs.

3. **Developer/Integrator (Tertiary)** - Wants to consume MeatyMusic SDS JSON in external tools or pipelines.

## 5. Functional Requirements

### FR-1: Song Creation Workflow with Intelligent Defaults

**FR-1.1: Partial Entity Input**

* User can create a song by providing:
  * **Required:** Title, primary genre (for blueprint selection)
  * **Optional:** Any subset of style, lyrics, persona, producer notes, sources, prompt controls, render settings
* UI forms allow skipping optional fields with clear indication that defaults will be applied
* Form validation enforces only truly required fields per entity schemas

**FR-1.2: Blueprint-Driven Default Generation**

When user submits song with partial data:

* **Style Defaults** (if style entity missing or incomplete):
  * Select blueprint matching user's chosen genre
  * Apply blueprint's `tempo_bpm` range as default tempo
  * Set `time_signature` to `"4/4"` unless blueprint specifies otherwise
  * Use blueprint's recommended key for genre (e.g., C major for Pop)
  * Derive `mood` from blueprint's genre profile (e.g., `["upbeat", "energetic"]` for Pop)
  * Set `energy` based on tempo range: < 90 BPM → "low", 90-120 → "medium", 120-140 → "high", > 140 → "anthemic"
  * Apply blueprint's recommended instrumentation (limited to 3 items max per validation rules)
  * Set `vocal_profile` to `"unspecified"` or generic description from blueprint
  * Apply default `tags` from blueprint's genre lexicon (1-2 tags per category)
  * Leave `negative_tags` empty unless blueprint defines genre-specific exclusions

* **Lyrics Defaults** (if lyrics entity missing or incomplete):
  * Set `language` to `"en"` (English)
  * Set `pov` to `"1st"` (first person)
  * Set `tense` to `"present"`
  * Derive `themes` as empty array (no assumptions without user input)
  * Set `rhyme_scheme` to `"AABB"` (simple couplet pattern)
  * Set `meter` to `"4/4 pop"` (standard pop meter)
  * Set `syllables_per_line` to `8` (typical for pop/rock)
  * Set `hook_strategy` to `"lyrical"` (default safe choice)
  * Set `repetition_policy` to `"moderate"`
  * Set `imagery_density` to `0.5` (balanced)
  * Set `reading_level` to `"grade-8"` (accessible)
  * Apply blueprint's `required_sections` as `section_order` (e.g., `["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]`)
  * Set `constraints.explicit` to `false` (safe default)
  * Set `constraints.max_lines` to `120` (typical 3-minute song)
  * Apply blueprint's `section_lines` rules to `constraints.section_requirements`
  * Set `source_citations` to empty array (no sources by default)

* **Producer Notes Defaults** (if producer notes missing or incomplete):
  * Derive `structure` from lyrics `section_order` (e.g., `"Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"`)
  * Set `hooks` to `2` (standard for pop structure)
  * Copy `instrumentation` from style entity or apply blueprint defaults
  * Generate `section_meta` for each section in structure:
    * Intro: `{"tags": ["instrumental", "build"], "target_duration_sec": 10}`
    * Verse: `{"tags": ["storytelling"], "target_duration_sec": 30}`
    * Chorus: `{"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25}`
    * Bridge: `{"tags": ["contrast", "dynamic"], "target_duration_sec": 20}`
    * Outro: `{"tags": ["fade-out"], "target_duration_sec": 10}`
  * Set `mix.lufs` to `-14.0` (streaming standard)
  * Set `mix.space` to `"balanced"` (neutral default)
  * Set `mix.stereo_width` to `"normal"`

* **Sources Defaults:**
  * Set `sources` to empty array `[]` (no external sources by default)

* **Prompt Controls Defaults:**
  * Set `positive_tags` to empty array
  * Copy style `negative_tags` to `negative_tags`
  * Set `max_style_chars` to `1000` (Suno limit)
  * Set `max_prompt_chars` to `5000` (Suno limit)

* **Render Defaults:**
  * Set `engine` to `"none"` (MVP does not include rendering)
  * Set `model` to `null`
  * Set `num_variations` to `2`

* **Seed Generation:**
  * Generate deterministic seed from timestamp + user_id hash: `seed = (timestamp_ms + hash(user_id)) % 2^31`
  * Ensures different users get different seeds but same user/time yields reproducible seed

**FR-1.3: Deterministic Default Logic**

All default generation must be:

* **Deterministic:** Same missing fields + same blueprint → same defaults
* **Rule-based:** No AI/LLM calls; pure algorithmic logic
* **Blueprint-aligned:** Defaults must satisfy blueprint's validation rules
* **Schema-compliant:** Generated SDS must validate against `sds.schema.json`

### FR-2: SDS Compilation and Validation

**FR-2.1: SDS Assembly**

Backend service compiles SDS by:

1. Loading user-provided entity data from song creation form
2. Loading selected blueprint by genre and version (default to latest if version unspecified)
3. Applying defaults using logic defined in FR-1.2 for missing/incomplete fields
4. Constructing SDS JSON matching `sds.schema.json` structure
5. Normalizing source weights to sum to 1.0 if sources provided
6. Sorting arrays lexicographically for deterministic hashing (tags, instrumentation, etc.)

**FR-2.2: Schema Validation**

Before persisting SDS:

* Validate entire SDS against `/schemas/sds.schema.json` using JSON Schema validator
* If validation fails, return detailed error response with:
  * List of validation errors (field path, expected type/format, actual value)
  * HTTP 400 status
* If validation succeeds, persist SDS to database and return song record

**FR-2.3: Conflict Detection (Warnings)**

After validation, run soft checks for potential issues:

* Check tempo vs energy alignment (high energy with slow BPM → warning)
* Check for tag conflicts using blueprint's conflict matrix
* Check section order vs blueprint's required sections
* Return warnings in response but do not block creation
* Display warnings in UI with suggestions for improvement

### FR-3: Song Detail Page with SDS Display

**FR-3.1: Song Detail Page Structure**

Route: `/songs/{song_id}`

Page layout with three tabs:

1. **Overview Tab** (default):
   * Song metadata (title, created date, updated date, status)
   * Blueprint reference (genre, version, link to blueprint detail)
   * Quick stats (sections count, estimated duration, seed)
   * Action buttons: Edit, Clone, Export SDS, Delete

2. **Entities Tab:**
   * Expandable sections for each entity:
     * **Style** - Display genre, tempo, key, mood, energy, instrumentation, tags (read-only formatted view)
     * **Lyrics** - Display language, POV, themes, rhyme scheme, section order, constraints (read-only formatted view)
     * **Persona** - Display persona name/details if linked, otherwise "No persona" (link to persona detail if exists)
     * **Producer Notes** - Display structure, hooks, instrumentation, section metadata, mix settings (read-only formatted view)
     * **Sources** - List of sources with names, kinds, weights (links to source detail pages)
     * **Prompt Controls** - Display positive/negative tags, character limits
     * **Render Settings** - Display engine, model, variations
   * Each section has "Edit" link to edit that entity (navigates to entity edit form with pre-filled values)

3. **Preview Tab:**
   * Full SDS JSON displayed with:
     * Syntax highlighting (using library like `react-syntax-highlighter` or `prism.js`)
     * Line numbers
     * Collapsible sections for each top-level entity
     * Copy-to-clipboard button for entire JSON
     * Download button for JSON file export
     * Dark theme code display matching app theme

**FR-3.2: Export SDS Functionality**

Export button triggers download:

* Filename format: `{song_title_kebab-case}_sds_{YYYYMMDD}.json`
* Content-Type: `application/json`
* Content includes complete, formatted SDS JSON (indented, pretty-printed)
* Includes UTF-8 BOM for compatibility

**FR-3.3: Copy to Clipboard**

Copy button in Preview tab:

* Copies entire SDS JSON to system clipboard
* Shows toast notification: "SDS copied to clipboard"
* Format: Pretty-printed JSON (2-space indent)

### FR-4: Song List Page Enhancement

**FR-4.1: Song List Display**

Route: `/songs`

Display table/grid of songs with columns:

* Title (link to song detail)
* Genre (from blueprint_ref)
* Created Date
* Status (Draft, Valid, Invalid)
* Actions (View, Edit, Clone, Delete)

**FR-4.2: Filtering and Search**

* Search by title (fuzzy search)
* Filter by genre (dropdown from available blueprints)
* Filter by status (Draft, Valid, Invalid)
* Sort by: Created Date (desc default), Title (asc), Genre (asc)

**FR-4.3: Bulk Actions**

* Select multiple songs via checkboxes
* Bulk export SDS (downloads zip file with all selected songs' SDS JSON files)
* Bulk delete (with confirmation)

### FR-5: API Endpoints

**FR-5.1: Create Song with SDS Generation**

```
POST /api/songs

Request Body:
{
  "title": "string (required)",
  "blueprint": {
    "genre": "string (required)",
    "version": "string (optional, defaults to latest)"
  },
  "style": { /* partial or complete style entity */ },
  "lyrics": { /* partial or complete lyrics entity */ },
  "persona_id": "uuid | null",
  "producer_notes": { /* partial or complete producer notes entity */ },
  "sources": [ /* array of source entities */ ],
  "prompt_controls": { /* partial or complete prompt controls */ },
  "render": { /* partial or complete render settings */ }
}

Response (201 Created):
{
  "song_id": "uuid",
  "title": "string",
  "sds": { /* complete SDS JSON with defaults applied */ },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": [ /* array of warning objects */ ]
  },
  "created_at": "ISO 8601 timestamp"
}

Response (400 Bad Request if validation fails):
{
  "song_id": null,
  "validation": {
    "valid": false,
    "errors": [
      {
        "field": "style.tempo_bpm",
        "message": "Must be integer or array of 2 integers",
        "expected": "integer | [integer, integer]",
        "actual": "string"
      }
    ],
    "warnings": []
  }
}
```

**FR-5.2: Get Song with SDS**

```
GET /api/songs/{song_id}

Response (200 OK):
{
  "song_id": "uuid",
  "title": "string",
  "sds": { /* complete SDS JSON */ },
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**FR-5.3: Export SDS**

```
GET /api/songs/{song_id}/sds/export

Response (200 OK):
Content-Type: application/json
Content-Disposition: attachment; filename="{song_title}_sds_{date}.json"

{ /* complete SDS JSON, pretty-printed */ }
```

**FR-5.4: List Songs**

```
GET /api/songs?genre={genre}&status={status}&search={query}&sort={field}&order={asc|desc}&page={n}&limit={n}

Response (200 OK):
{
  "songs": [
    {
      "song_id": "uuid",
      "title": "string",
      "genre": "string",
      "created_at": "ISO 8601 timestamp",
      "status": "Draft | Valid | Invalid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### FR-6: UI Components

**FR-6.1: Song Creation Form (Multi-Step Wizard)**

Steps:

1. **Basic Info** - Title, genre selection
2. **Style** - Style entity form (with "Use defaults" checkbox to skip)
3. **Lyrics** - Lyrics entity form (with "Use defaults" checkbox to skip)
4. **Persona** - Persona selection or skip
5. **Producer Notes** - Producer notes form (with "Use defaults" checkbox to skip)
6. **Sources** - Source selection/creation (optional, can skip)
7. **Review & Generate** - Show preview of SDS with applied defaults, allow final edits, submit

Each step:

* Shows progress indicator (step N of 7)
* Has "Next", "Back", "Skip" buttons
* Validates input before allowing Next
* Saves draft progress to local storage (recovery on browser refresh)

**FR-6.2: SDS Preview Component**

Reusable component for displaying SDS JSON:

* Props: `sds` (JSON object), `collapsible` (boolean), `showActions` (boolean)
* Features:
  * Syntax highlighting with dark theme
  * Line numbers
  * Collapsible sections (if `collapsible=true`)
  * Copy and download buttons (if `showActions=true`)
  * Full-screen mode toggle
  * Search within JSON (highlight matches)

Used in:

* Song creation wizard (final review step)
* Song detail page (Preview tab)
* Export modal/dialog

**FR-6.3: Entity Display Components**

Read-only formatted display components for each entity type:

* `<StyleDisplay style={styleData} />` - Displays style entity in human-readable format
* `<LyricsDisplay lyrics={lyricsData} />` - Displays lyrics entity with sections, constraints
* `<ProducerNotesDisplay notes={notesData} />` - Displays producer notes with structure visualization
* `<SourceDisplay source={sourceData} />` - Displays source details with kind badge

Each component:

* Uses design system components (cards, badges, typography)
* Shows fields in logical groupings
* Highlights important values (tempo, key, sections)
* Provides tooltips for technical fields
* Has optional "Edit" action button

## 6. Non-Functional Requirements

### NFR-1: Performance

* **NFR-1.1:** SDS generation (with defaults applied) completes in < 500ms P95
* **NFR-1.2:** Song detail page loads in < 1s P95 (including SDS rendering)
* **NFR-1.3:** JSON syntax highlighting renders in < 200ms for typical SDS (< 50KB)
* **NFR-1.4:** Export download initiates within 100ms of button click

### NFR-2: Data Validation and Integrity

* **NFR-2.1:** 100% of generated SDS must validate against `sds.schema.json`
* **NFR-2.2:** Deterministic defaults: Same input + blueprint → byte-identical SDS across 100 runs
* **NFR-2.3:** All generated default values must satisfy blueprint validation rules
* **NFR-2.4:** Blueprint constraint violations flagged as warnings (not blocking errors)

### NFR-3: Usability

* **NFR-3.1:** Users can complete song creation with only title + genre selection (all other fields optional)
* **NFR-3.2:** Default values must be clearly indicated in UI (e.g., grayed text "Default: 120 BPM")
* **NFR-3.3:** Warnings and errors presented with actionable guidance (what's wrong, how to fix)
* **NFR-3.4:** JSON export filename must be descriptive and include date for easy identification

### NFR-4: Maintainability

* **NFR-4.1:** Default generation logic isolated in dedicated service module (`DefaultGenerator`)
* **NFR-4.2:** Blueprint loading abstracted behind repository interface (easy to swap storage)
* **NFR-4.3:** All default rules documented in code with references to blueprint PRD
* **NFR-4.4:** Unit tests for all default generation paths (100% coverage target)

### NFR-5: Compatibility

* **NFR-5.1:** Exported SDS JSON valid for future Claude Code workflow orchestrator
* **NFR-5.2:** SDS schema version tracked in `sds.schema.json` `$id` field
* **NFR-5.3:** Future schema updates must include migration path for existing SDS records

## 7. Implementation Phases

### Phase 1: Backend SDS Generation Service (Days 1-3)

**Objective:** Implement backend logic for SDS generation with intelligent defaults

**Tasks:**

| ID | Task | Acceptance Criteria | Estimate |
|----|------|---------------------|----------|
| BE-001 | Create `DefaultGenerator` service module | Module exports `generateDefaults(entity, blueprint)` functions | 4h |
| BE-002 | Implement style defaults logic | Function generates valid style entity from blueprint + partial input | 4h |
| BE-003 | Implement lyrics defaults logic | Function generates valid lyrics entity from blueprint + partial input | 4h |
| BE-004 | Implement producer notes defaults logic | Function generates valid producer notes from blueprint + partial input | 3h |
| BE-005 | Implement prompt controls & render defaults | Functions generate valid defaults for these entities | 2h |
| BE-006 | Create `SDSCompiler` service | Service assembles complete SDS from entities + defaults | 4h |
| BE-007 | Integrate JSON Schema validation | Service validates SDS against `sds.schema.json` before persist | 2h |
| BE-008 | Implement conflict detection (warnings) | Service checks tempo/energy, tag conflicts, returns warnings | 3h |
| BE-009 | Write unit tests for defaults | 100% coverage of all default generation paths | 6h |
| BE-010 | Write integration tests for SDS compilation | Test end-to-end SDS generation with various input combinations | 4h |

**Quality Gates:**

* All unit tests pass (100% coverage target)
* Integration tests demonstrate deterministic SDS generation
* Generated SDS validates against schema in all test cases
* Blueprint constraints satisfied by defaults

### Phase 2: Database Models and API Endpoints (Days 4-5)

**Objective:** Persist songs with SDS and expose API endpoints

**Tasks:**

| ID | Task | Acceptance Criteria | Estimate |
|----|------|---------------------|----------|
| DB-001 | Create `songs` table migration | Table with `id`, `title`, `sds` (JSONB), `blueprint_genre`, `blueprint_version`, timestamps | 2h |
| DB-002 | Create SQLAlchemy `Song` model | Model with relationships to blueprints, validation hooks | 2h |
| DB-003 | Create `SongRepository` | CRUD operations for songs with SDS | 3h |
| API-001 | Implement `POST /api/songs` endpoint | Accepts partial entities, returns song with complete SDS | 4h |
| API-002 | Implement `GET /api/songs/{id}` endpoint | Returns song with SDS | 1h |
| API-003 | Implement `GET /api/songs/{id}/sds/export` endpoint | Returns downloadable SDS JSON file | 2h |
| API-004 | Implement `GET /api/songs` endpoint | Returns paginated song list with filters | 3h |
| API-005 | Write API integration tests | Test all endpoints with various payloads | 4h |

**Quality Gates:**

* All API endpoints return correct status codes
* Integration tests cover success and error cases
* Database constraints enforce data integrity
* Endpoints respond within performance targets (NFR-1)

### Phase 3: UI Components (Days 6-8)

**Objective:** Build reusable UI components for SDS display and song forms

**Tasks:**

| ID | Task | Acceptance Criteria | Estimate |
|----|------|---------------------|----------|
| UI-001 | Create `SDSPreview` component | Component displays SDS with syntax highlighting, copy, download | 4h |
| UI-002 | Create `StyleDisplay` component | Component displays style entity in readable format | 2h |
| UI-003 | Create `LyricsDisplay` component | Component displays lyrics entity in readable format | 2h |
| UI-004 | Create `ProducerNotesDisplay` component | Component displays producer notes in readable format | 2h |
| UI-005 | Create `SourceDisplay` component | Component displays source details | 1h |
| UI-006 | Create song creation wizard stepper | Multi-step form with progress indicator, navigation | 4h |
| UI-007 | Create style entity form step | Form for style input with "Use defaults" option | 3h |
| UI-008 | Create lyrics entity form step | Form for lyrics input with "Use defaults" option | 3h |
| UI-009 | Create producer notes form step | Form for producer notes input with "Use defaults" option | 3h |
| UI-010 | Create review & generate step | Shows preview of SDS with defaults applied | 2h |
| UI-011 | Integrate API client for song creation | Wire up form submission to `POST /api/songs` | 2h |
| UI-012 | Write component tests | Unit tests for all components | 4h |

**Quality Gates:**

* All components render without errors
* Forms validate input before submission
* Default indicators clearly visible in forms
* Component tests achieve > 80% coverage

### Phase 4: Song Detail and List Pages (Days 9-10)

**Objective:** Build song detail page and song list page

**Tasks:**

| ID | Task | Acceptance Criteria | Estimate |
|----|------|---------------------|----------|
| PAGE-001 | Create song detail page route `/songs/{id}` | Page renders with three tabs: Overview, Entities, Preview | 4h |
| PAGE-002 | Implement Overview tab | Displays song metadata, blueprint, stats, action buttons | 2h |
| PAGE-003 | Implement Entities tab | Displays all entities using display components | 3h |
| PAGE-004 | Implement Preview tab | Displays SDS using `SDSPreview` component | 1h |
| PAGE-005 | Implement export SDS functionality | Export button triggers download with correct filename | 2h |
| PAGE-006 | Implement copy to clipboard | Copy button copies SDS JSON to clipboard with toast | 1h |
| PAGE-007 | Create song list page route `/songs` | Page displays table/grid of songs | 3h |
| PAGE-008 | Implement filtering and search | Filters work correctly, search returns relevant results | 3h |
| PAGE-009 | Implement bulk actions | Bulk export and delete work correctly | 3h |
| PAGE-010 | Write E2E tests for pages | Test complete user flows (create, view, export, list) | 4h |

**Quality Gates:**

* All pages render correctly on desktop and mobile
* Navigation between pages works smoothly
* Export and copy functions work reliably
* E2E tests cover primary user journeys

### Phase 5: Testing, Documentation, and Polish (Days 11-12)

**Objective:** Comprehensive testing, documentation, and final polish

**Tasks:**

| ID | Task | Acceptance Criteria | Estimate |
|----|------|---------------------|----------|
| TEST-001 | Determinism validation tests | Run 100 SDS generations with same input, verify byte-identical outputs | 3h |
| TEST-002 | Schema compliance tests | Test all default combinations validate against `sds.schema.json` | 2h |
| TEST-003 | Blueprint constraint tests | Verify defaults satisfy all blueprint rules for each genre | 3h |
| TEST-004 | Performance benchmarks | Measure and verify NFR-1 targets (< 500ms generation, < 1s page load) | 2h |
| TEST-005 | Cross-browser testing | Test in Chrome, Firefox, Safari | 2h |
| TEST-006 | Accessibility audit | Run axe-core, fix issues, verify keyboard navigation | 2h |
| DOC-001 | Update API documentation | Document all new endpoints with examples | 2h |
| DOC-002 | Write user guide for song creation | Step-by-step guide with screenshots | 2h |
| DOC-003 | Document default generation logic | Inline code comments + markdown doc explaining rules | 3h |
| DOC-004 | Update README with new features | Add song creation workflow to main README | 1h |
| POLISH-001 | UI/UX polish pass | Refine spacing, colors, animations, loading states | 3h |
| POLISH-002 | Error message improvements | Make error/warning messages more helpful and actionable | 2h |

**Quality Gates:**

* All tests pass (unit, integration, E2E)
* Determinism verified at 100% (byte-identical outputs)
* Performance targets met
* Documentation complete and accurate
* No critical accessibility issues

## 8. Acceptance Criteria

### AC-1: SDS Generation with Defaults

* **AC-1.1:** User creates song with only title + genre → complete valid SDS generated
* **AC-1.2:** Generated SDS validates against `sds.schema.json`
* **AC-1.3:** Defaults follow blueprint rules for selected genre
* **AC-1.4:** Same input + blueprint → identical SDS across 100 runs (determinism)

### AC-2: Song Detail Page

* **AC-2.1:** Song detail page displays three tabs: Overview, Entities, Preview
* **AC-2.2:** Overview tab shows metadata, blueprint, stats, actions
* **AC-2.3:** Entities tab displays all entities in readable format with edit links
* **AC-2.4:** Preview tab shows SDS JSON with syntax highlighting, line numbers, collapsible sections

### AC-3: SDS Export

* **AC-3.1:** Export button downloads SDS JSON file with correct filename format
* **AC-3.2:** Downloaded JSON is valid, pretty-printed, UTF-8 encoded
* **AC-3.3:** Copy button copies SDS to clipboard and shows confirmation toast

### AC-4: Song List Page

* **AC-4.1:** Song list displays all songs with title, genre, created date, status
* **AC-4.2:** Search by title returns relevant results
* **AC-4.3:** Filter by genre and status work correctly
* **AC-4.4:** Bulk export downloads zip file with all selected songs' SDS JSON

### AC-5: API Endpoints

* **AC-5.1:** `POST /api/songs` with partial entities returns 201 with complete SDS
* **AC-5.2:** `POST /api/songs` with invalid data returns 400 with detailed errors
* **AC-5.3:** `GET /api/songs/{id}` returns 200 with song and SDS
* **AC-5.4:** `GET /api/songs/{id}/sds/export` returns downloadable JSON file
* **AC-5.5:** `GET /api/songs` returns paginated list with filters working

### AC-6: Performance

* **AC-6.1:** SDS generation completes in < 500ms P95
* **AC-6.2:** Song detail page loads in < 1s P95
* **AC-6.3:** JSON syntax highlighting renders in < 200ms
* **AC-6.4:** Export initiates within 100ms of click

### AC-7: Validation and Warnings

* **AC-7.1:** Schema validation errors returned with field path and expected format
* **AC-7.2:** Conflict warnings (tempo/energy mismatch, tag conflicts) displayed in UI
* **AC-7.3:** Warnings include actionable suggestions for resolution
* **AC-7.4:** Warnings do not block song creation (soft checks only)

## 9. Default Generation Rules Reference

### Style Entity Defaults

| Field | Default Value | Source |
|-------|---------------|--------|
| `genre_detail.primary` | User selection (required) | User input |
| `genre_detail.subgenres` | `[]` | Empty if not provided |
| `genre_detail.fusions` | `[]` | Empty if not provided |
| `tempo_bpm` | Blueprint's `rules.tempo_bpm` range | Blueprint |
| `time_signature` | `"4/4"` | Standard default |
| `key.primary` | Blueprint-recommended key (genre-specific) | Blueprint |
| `key.modulations` | `[]` | Empty if not provided |
| `mood` | Blueprint's genre mood profile | Blueprint lexicon |
| `energy` | Derived from tempo: < 90 → "low", 90-120 → "medium", 120-140 → "high", > 140 → "anthemic" | Algorithmic |
| `instrumentation` | Blueprint's genre instrumentation (max 3) | Blueprint |
| `vocal_profile` | `"unspecified"` | Default |
| `tags` | Blueprint's default tags (1-2 per category) | Blueprint lexicon |
| `negative_tags` | `[]` or blueprint genre exclusions | Blueprint |

### Lyrics Entity Defaults

| Field | Default Value | Source |
|-------|---------------|--------|
| `language` | `"en"` | Standard default |
| `pov` | `"1st"` | Common for pop/rock |
| `tense` | `"present"` | Common for pop/rock |
| `themes` | `[]` | Empty (no assumptions) |
| `rhyme_scheme` | `"AABB"` | Simple couplet pattern |
| `meter` | `"4/4 pop"` | Standard pop meter |
| `syllables_per_line` | `8` | Typical for pop/rock |
| `hook_strategy` | `"lyrical"` | Safe default |
| `repetition_policy` | `"moderate"` | Balanced |
| `imagery_density` | `0.5` | Balanced |
| `reading_level` | `"grade-8"` | Accessible |
| `section_order` | Blueprint's `required_sections` + standard structure | Blueprint |
| `constraints.explicit` | `false` | Safe default |
| `constraints.max_lines` | `120` | Typical 3-minute song |
| `constraints.section_requirements` | From blueprint's `rules.section_lines` | Blueprint |
| `source_citations` | `[]` | Empty (no sources) |

### Producer Notes Defaults

| Field | Default Value | Source |
|-------|---------------|--------|
| `structure` | Derived from `section_order` | Lyrics entity |
| `hooks` | `2` | Standard for pop |
| `instrumentation` | Copy from style or blueprint | Style or blueprint |
| `section_meta.Intro` | `{"tags": ["instrumental", "build"], "target_duration_sec": 10}` | Standard |
| `section_meta.Verse` | `{"tags": ["storytelling"], "target_duration_sec": 30}` | Standard |
| `section_meta.Chorus` | `{"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25}` | Standard |
| `section_meta.Bridge` | `{"tags": ["contrast", "dynamic"], "target_duration_sec": 20}` | Standard |
| `section_meta.Outro` | `{"tags": ["fade-out"], "target_duration_sec": 10}` | Standard |
| `mix.lufs` | `-14.0` | Streaming standard |
| `mix.space` | `"balanced"` | Neutral |
| `mix.stereo_width` | `"normal"` | Standard |

### Other Defaults

| Entity | Field | Default Value |
|--------|-------|---------------|
| Sources | `sources` | `[]` (empty array) |
| Prompt Controls | `positive_tags` | `[]` |
| Prompt Controls | `negative_tags` | Copy from style `negative_tags` |
| Prompt Controls | `max_style_chars` | `1000` |
| Prompt Controls | `max_prompt_chars` | `5000` |
| Render | `engine` | `"none"` |
| Render | `model` | `null` |
| Render | `num_variations` | `2` |
| SDS | `seed` | `(timestamp_ms + hash(user_id)) % 2^31` |

## 10. UI/UX Mockups and Flow

### Song Creation Flow

```
1. Dashboard → "Create Song" button
2. Song Creation Wizard:
   Step 1: Basic Info
     - Input: Title (required)
     - Select: Genre (dropdown from blueprints, required)
     - Button: Next

   Step 2: Style
     - Checkbox: "Use default style for [Genre]" (checked by default)
     - If unchecked, show style entity form
     - Buttons: Back, Skip, Next

   Step 3: Lyrics
     - Checkbox: "Use default lyrics structure for [Genre]" (checked by default)
     - If unchecked, show lyrics entity form
     - Buttons: Back, Skip, Next

   Step 4: Persona
     - Radio: "No persona" (default) | "Select existing" | "Create new"
     - If "Select existing": dropdown of user's personas
     - Buttons: Back, Skip, Next

   Step 5: Producer Notes
     - Checkbox: "Use default producer notes for [Genre]" (checked by default)
     - If unchecked, show producer notes form
     - Buttons: Back, Skip, Next

   Step 6: Sources (Optional)
     - List: Selected sources (empty by default)
     - Button: "Add source" → source selection modal
     - Buttons: Back, Skip, Next

   Step 7: Review & Generate
     - Preview: SDS JSON with defaults applied (read-only)
     - Warnings: Display any validation warnings with suggestions
     - Buttons: Back, Edit [Entity], Create Song

3. On "Create Song" → API call → Success:
   - Redirect to song detail page
   - Toast: "Song created successfully"

4. On API error:
   - Display errors inline
   - Allow user to fix and retry
```

### Song Detail Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ [<- Back to Songs]    Song: "My Song Title"            │
│                                                          │
│ [Overview] [Entities] [Preview]  [Edit] [Clone] [Export SDS] [Delete]
│─────────────────────────────────────────────────────────│
│                                                          │
│ [Content area - depends on active tab]                  │
│                                                          │
│ OVERVIEW TAB:                                            │
│  ┌────────────────┐  ┌────────────────┐                │
│  │ Title          │  │ Blueprint       │                │
│  │ My Song Title  │  │ Pop (2025.11)  │                │
│  └────────────────┘  └────────────────┘                │
│  ┌────────────────┐  ┌────────────────┐                │
│  │ Created        │  │ Seed           │                │
│  │ Nov 15, 2025   │  │ 1234567890     │                │
│  └────────────────┘  └────────────────┘                │
│                                                          │
│ ENTITIES TAB:                                            │
│  [> Style] (expandable)                                 │
│    Genre: Pop                                            │
│    Tempo: 120-130 BPM                                    │
│    Key: C major                                          │
│    ...                                            [Edit] │
│  [> Lyrics] (expandable)                                │
│    Language: English                                     │
│    POV: 1st person                                       │
│    ...                                            [Edit] │
│  [> Producer Notes] (expandable)                        │
│  [> Sources] (expandable)                               │
│                                                          │
│ PREVIEW TAB:                                             │
│  [Copy to Clipboard] [Download JSON] [Full Screen]      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1  {                                            │  │
│  │  2    "title": "My Song Title",                  │  │
│  │  3    "blueprint_ref": {                         │  │
│  │  4      "genre": "Pop",                          │  │
│  │  5      "version": "2025.11"                     │  │
│  │  6    },                                         │  │
│  │  7    "style": { ... },                          │  │
│  │  ...                                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 11. Testing Strategy

### Unit Tests

* All default generation functions (style, lyrics, producer notes, etc.)
* SDS compiler assembly logic
* Schema validation integration
* Conflict detection logic
* Seed generation algorithm

### Integration Tests

* API endpoint handlers (POST /songs, GET /songs, etc.)
* Database operations (CRUD for songs)
* Complete SDS generation flow (input → defaults → validation → persist)

### End-to-End Tests

* Song creation flow (wizard → submission → redirect)
* Song detail page rendering (all tabs)
* Export SDS functionality
* Song list page with filters
* Bulk operations

### Validation Tests

* Determinism: 100 runs with same input → byte-identical SDS
* Schema compliance: All default combinations validate
* Blueprint constraints: Defaults satisfy all rules per genre
* Conflict detection: Known conflicts trigger warnings

### Performance Tests

* SDS generation latency (target < 500ms P95)
* Page load times (target < 1s P95)
* JSON rendering (target < 200ms)
* Export initiation (target < 100ms)

## 12. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Default logic becomes complex and hard to maintain | High | Medium | Isolate in dedicated service, comprehensive unit tests, clear documentation |
| Blueprint data incomplete or inconsistent | High | Low | Validate blueprint schema on load, provide sensible fallbacks, log warnings |
| Large SDS JSON slow to render in UI | Medium | Medium | Use virtualized rendering for large JSON, lazy-load sections, optimize syntax highlighter |
| Users confused by auto-applied defaults | Medium | Medium | Clearly indicate defaults in UI, provide tooltips, allow easy override |
| Schema changes break existing SDS | High | Low | Version schemas, include migration logic, test backwards compatibility |
| Performance targets not met | Medium | Low | Benchmark early, optimize hot paths, use caching where appropriate |

## 13. Future Enhancements (Post-MVP)

**Out of scope for MVP but planned for future releases:**

1. **AI-Generated Content:** Replace deterministic defaults with GenAI-generated style/lyrics/notes using Claude Code workflow
2. **Workflow Execution:** Integrate SDS generation with Claude Code orchestrator for full PLAN → STYLE → LYRICS → COMPOSE flow
3. **Real-Time Preview:** Show live preview of musical elements as user fills form (e.g., play sample with selected tempo/key)
4. **Template Library:** Save and reuse common SDS patterns as templates
5. **Collaborative Editing:** Allow multiple users to edit song/SDS together
6. **Version History:** Track changes to SDS over time, allow rollback
7. **Advanced Validation:** Deeper blueprint constraint checking (lexicon scoring, banned terms detection)
8. **Export Formats:** Support exporting SDS in formats beyond JSON (YAML, TOML, etc.)
9. **Bulk Import:** Upload CSV/JSON to create multiple songs at once
10. **SDS Diff Viewer:** Compare two SDS versions side-by-side

## 14. References

* **SDS Schema:** `/schemas/sds.schema.json`
* **Style Schema:** `/schemas/style.schema.json`
* **Lyrics Schema:** `/schemas/lyrics.schema.json`
* **Producer Notes Schema:** `/schemas/producer_notes.schema.json`
* **Blueprint Schema:** `/schemas/blueprint.schema.json`
* **Source Schema:** `/schemas/source.schema.json`
* **AMCS Overview:** `/docs/amcs-overview.md`
* **Website App PRD:** `/docs/project_plans/PRDs/website_app.prd.md`
* **Blueprint PRD:** `/docs/project_plans/PRDs/blueprint.prd.md`
* **SDS PRD:** `/docs/project_plans/PRDs/sds.prd.md`
* **Claude Code Orchestration PRD:** `/docs/project_plans/PRDs/claude_code_orchestration.prd.md`

---

**Document Metadata:**

* **Category:** features
* **File Name:** `mvp-sds-generation-preview-v1.md`
* **Created:** 2025-11-15
* **Status:** Published
* **Version:** 1.0
* **Audience:** AI agents, developers
* **Tags:** mvp, sds, song-creation, defaults, preview, export
