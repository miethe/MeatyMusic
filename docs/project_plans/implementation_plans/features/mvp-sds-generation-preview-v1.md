# MVP SDS Generation & Preview - Implementation Plan v1

**Version**: 1.0
**Created**: 2025-11-15
**Category**: Features
**Complexity**: Medium (M)
**Track**: Standard
**Estimated Effort**: 22-26 story points (1 week with 1-2 engineers)
**Timeline**: 5-7 business days
**Priority**: HIGH (Enables user preview and export workflows)

---

## Executive Summary

This implementation plan delivers the MVP SDS Generation and Preview feature, enabling users to view and export compiled Song Design Specs from the web interface. This feature builds on the existing SDS Compilation backend (from `sds-aggregation-implementation-v1.md`) and focuses on:

1. **Default Generation Logic**: Blueprint-based defaults for incomplete entity data
2. **SDS Retrieval API**: Endpoint to fetch compiled SDS JSON for songs
3. **Export Functionality**: Download SDS as formatted JSON file
4. **Song Detail UI Enhancement**: Add Preview tab with JSON viewer
5. **Entity Display**: Show entity details with edit links

### Goals

1. **Backend Default Generators**: Implement blueprint-based defaults for Style, Lyrics, Persona, and ProducerNotes
2. **SDS Preview API**: New `GET /songs/{id}/sds` endpoint for retrieval
3. **SDS Export API**: New `GET /songs/{id}/export` endpoint with download headers
4. **Frontend Preview Tab**: JSON syntax-highlighted viewer in Song Detail page
5. **Frontend Export Button**: Download SDS as `.json` file
6. **Entity Detail Sections**: Display entity summaries with navigation to edit pages

### Current State

**Completed Components** (Dependencies):
- Database models: `Song`, `Style`, `Lyrics`, `Persona`, `ProducerNotes`, `Blueprint`, `Source`
- Repository layer: Entity repositories with RLS
- SDS Compiler Service: `SDSCompilerService` (from Phase 2 implementation)
- Validation services: Blueprint validator, tag conflict resolver
- Base API: `/songs` CRUD operations
- Song Detail UI: Basic tabs structure at `/songs/[id]`

**Missing Components** (This Implementation):
- Default generation logic for entities
- Blueprint-based default generators
- `GET /songs/{id}/sds` API endpoint
- `GET /songs/{id}/export` API endpoint
- Preview tab with JSON viewer component
- Export button with file download
- Entity detail display sections

### Success Criteria

- Users can view compiled SDS JSON in Song Detail page
- Default generation fills missing entity data using blueprint rules
- Export downloads formatted JSON file with proper filename
- JSON viewer provides syntax highlighting and collapsible sections
- Entity sections show key properties with links to edit pages
- API returns clear error messages for compilation failures
- 90%+ test coverage on default generation logic
- 95%+ test coverage on API endpoints

---

## Implementation Strategy

### Layered Architecture Approach

Following MeatyMusic's established patterns:

1. **Phase 1**: Backend - Default Generation Logic (blueprint readers, entity generators)
2. **Phase 2**: Backend - SDS Compilation Enhancement (integrate defaults, validation)
3. **Phase 3**: API - SDS Endpoints (retrieval and export)
4. **Phase 4**: Frontend - Song Detail Page Enhancement (tabs, entity displays)
5. **Phase 5**: Frontend - Preview Tab (JSON viewer, syntax highlighting)
6. **Phase 6**: Frontend - Export Functionality (download button, file generation)
7. **Phase 7**: Testing & Validation (unit tests, integration tests, E2E tests)

### Parallel Work Streams

**Week 1 (Days 1-2)**: Backend Foundation
- Stream A: Default generation service and blueprint readers
- Stream B: Entity default generators (Style, Lyrics, Persona, Producer)
- Stream C: SDS compiler enhancement to use defaults

**Week 1 (Days 3-4)**: API & Frontend Core
- Stream A: API endpoints for SDS retrieval and export
- Stream B: Frontend JSON viewer component
- Stream C: Frontend entity detail components

**Week 1 (Days 5-7)**: Integration & Testing
- Stream A: Integration testing (API + frontend)
- Stream B: E2E testing (complete flow)
- Stream C: Documentation and polish

### Critical Path

```
Blueprint Readers → Default Generators → SDS Compiler Enhancement → API Endpoints → Frontend Components → Testing
```

Dependencies flow left-to-right; frontend components can start after API contracts are defined.

---

## Phase Overview

| Phase | Component | Effort (SP) | Duration | Dependencies | Subagents |
|-------|-----------|-------------|----------|--------------|-----------|
| 1 | Default Generation Service | 5 | 1.5 days | SDS Compiler | python-backend-engineer, backend-architect |
| 2 | SDS Compilation Enhancement | 3 | 1 day | Phase 1 | python-backend-engineer |
| 3 | API Endpoints | 4 | 1 day | Phase 2 | python-backend-engineer |
| 4 | Song Detail Enhancement | 3 | 1 day | Phase 3 | ui-engineer-enhanced, frontend-developer |
| 5 | Preview Tab & JSON Viewer | 4 | 1 day | Phase 3 | frontend-developer |
| 6 | Export Functionality | 2 | 0.5 day | Phase 3 | frontend-developer |
| 7 | Testing & Documentation | 5 | 1.5 days | Phase 1-6 | testing-specialist, documentation-writer |
| **Total** | | **26** | **8 days** | | |

---

## Detailed Task Breakdown

### Phase 1: Backend - Default Generation Logic

**Objective**: Implement blueprint-based default generators for entities with incomplete data.

#### Task SDS-PREVIEW-001: Blueprint Reader Service

**Description**: Create service to read and parse blueprint JSON files.

**Deliverables**:
- `apps/api/app/services/blueprint_reader.py`
  - `BlueprintReaderService` class
  - `read_blueprint(genre: str) -> Blueprint` method
  - Caching for loaded blueprints (in-memory or Redis)
  - Error handling for missing blueprints

**Acceptance Criteria**:
- Service loads blueprint JSON from `docs/hit_song_blueprint/AI/`
- Returns parsed `Blueprint` object with all rules and rubric
- Caches blueprints to avoid re-reading files
- Raises clear error if blueprint not found for genre
- Unit tests with 95%+ coverage

**Effort**: 2 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/blueprint_reader.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/test_blueprint_reader.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md`

---

#### Task SDS-PREVIEW-002: Default Style Generator

**Description**: Generate default Style entity data from blueprint rules.

**Deliverables**:
- `apps/api/app/services/default_generators/style_generator.py`
  - `StyleDefaultGenerator` class
  - `generate_default_style(blueprint: Blueprint, partial_style: Style | None) -> Style` method
  - Logic to fill missing fields:
    - `genre_detail.primary` from blueprint genre
    - `tempo_bpm` from blueprint `rules.tempo_bpm` range
    - `key.primary` default to "C major" (most common)
    - `mood` default to ["neutral"] or blueprint-appropriate defaults
    - `energy` default to "medium"
    - `instrumentation` empty array (user should specify)
    - `tags` empty array (user should specify)

**Acceptance Criteria**:
- Generates complete Style object from blueprint
- Preserves user-provided fields if present
- Uses blueprint BPM range (midpoint if single value needed)
- Returns deterministic defaults (same blueprint = same defaults)
- Unit tests with 95%+ coverage for all field combinations

**Effort**: 3 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/default_generators/__init__.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/default_generators/style_generator.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/default_generators/test_style_generator.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/style.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md`

---

#### Task SDS-PREVIEW-003: Default Lyrics Generator

**Description**: Generate default Lyrics entity data from blueprint rules.

**Deliverables**:
- `apps/api/app/services/default_generators/lyrics_generator.py`
  - `LyricsDefaultGenerator` class
  - `generate_default_lyrics(blueprint: Blueprint, partial_lyrics: Lyrics | None) -> Lyrics` method
  - Logic to fill missing fields:
    - `language` default to "en"
    - `pov` default to "1st"
    - `tense` default to "present"
    - `themes` empty array (user should specify)
    - `rhyme_scheme` default to "AABB" (most common pop pattern)
    - `meter` default to "4/4 pop"
    - `syllables_per_line` default to 8
    - `hook_strategy` default to "repetition"
    - `repetition_policy` default to "moderate"
    - `imagery_density` default to 0.5
    - `section_order` from blueprint `rules.required_sections` (standard order)
    - `constraints.explicit` default to False
    - `constraints.max_lines` default to 120
    - `constraints.section_requirements` from blueprint `rules.section_lines`

**Acceptance Criteria**:
- Generates complete Lyrics object from blueprint
- Uses blueprint required sections in standard order (Intro, Verse, Chorus, Verse, Chorus, Bridge, Chorus, Outro)
- Preserves user-provided fields if present
- Returns deterministic defaults
- Unit tests with 95%+ coverage

**Effort**: 3 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/default_generators/lyrics_generator.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/default_generators/test_lyrics_generator.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/lyrics.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md`

---

#### Task SDS-PREVIEW-004: Default Persona Generator

**Description**: Generate default Persona entity data from genre conventions.

**Deliverables**:
- `apps/api/app/services/default_generators/persona_generator.py`
  - `PersonaDefaultGenerator` class
  - `generate_default_persona(blueprint: Blueprint, partial_persona: Persona | None) -> Persona | None` method
  - Logic to fill missing fields (or return None if no persona needed):
    - `name` default to "Generic Artist"
    - `vocal_range` default to "medium" or genre-appropriate
    - `delivery_style` default to genre-typical (e.g., "crooner" for jazz, "rap" for hip-hop)
    - `influences` empty array (user should specify)
  - Note: Persona is optional in SDS (`persona_id` can be null)

**Acceptance Criteria**:
- Returns None if no persona needed (most common case)
- Generates basic persona if partial data exists
- Uses genre-appropriate vocal defaults
- Preserves user-provided fields if present
- Unit tests with 95%+ coverage

**Effort**: 2 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/default_generators/persona_generator.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/default_generators/test_persona_generator.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/persona.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md`

---

#### Task SDS-PREVIEW-005: Default Producer Notes Generator

**Description**: Generate default ProducerNotes entity data from blueprint and style.

**Deliverables**:
- `apps/api/app/services/default_generators/producer_generator.py`
  - `ProducerDefaultGenerator` class
  - `generate_default_producer_notes(blueprint: Blueprint, style: Style, lyrics: Lyrics, partial_producer: ProducerNotes | None) -> ProducerNotes` method
  - Logic to fill missing fields:
    - `structure` from lyrics `section_order` (e.g., "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus")
    - `hooks` default to 1 (single main hook)
    - `instrumentation` from style `instrumentation`
    - `section_meta` default metadata for each section:
      - Intro: `{"tags": ["instrumental"], "target_duration_sec": 10}`
      - Verse: `{"tags": ["storytelling"], "target_duration_sec": 30}`
      - Chorus: `{"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25}`
      - Bridge: `{"tags": ["minimal"], "target_duration_sec": 20}`
      - Outro: `{"tags": ["fade-out"], "target_duration_sec": 10}`
    - `mix.lufs` default to -14.0 (streaming standard)
    - `mix.space` default to "balanced"
    - `mix.stereo_width` default to "medium"

**Acceptance Criteria**:
- Generates complete ProducerNotes from blueprint, style, and lyrics
- Uses lyrics section order for structure string
- Creates sensible section_meta for all sections
- Preserves user-provided fields if present
- Returns deterministic defaults
- Unit tests with 95%+ coverage

**Effort**: 3 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/default_generators/producer_generator.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/default_generators/test_producer_generator.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/producer_notes.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md`

---

### Phase 2: Backend - SDS Compilation Enhancement

**Objective**: Enhance SDS Compiler to use default generators for missing entity data.

#### Task SDS-PREVIEW-006: SDS Compiler Default Integration

**Description**: Integrate default generators into SDS compilation flow.

**Deliverables**:
- Update `apps/api/app/services/sds_compiler.py`
  - Add `use_defaults: bool = True` parameter to `compile_sds` method
  - Before compilation, check for missing entities (style_id, lyrics_id, etc.)
  - If missing and `use_defaults=True`, call appropriate default generator
  - Store generated defaults in database (optional: flag as `is_default=True`)
  - Continue with normal SDS compilation using complete entity set

**Logic Flow**:
```python
def compile_sds(song: Song, use_defaults: bool = True) -> SDS:
    blueprint = blueprint_reader.read_blueprint(song.genre)

    # Fetch or generate Style
    if song.style_id:
        style = style_repo.get(song.style_id)
    elif use_defaults:
        style = style_generator.generate_default_style(blueprint, None)
    else:
        raise ValueError("No style_id and defaults disabled")

    # Repeat for Lyrics, Persona, ProducerNotes...

    # Continue with normal SDS compilation
    return super().compile_sds_with_entities(style, lyrics, producer_notes, ...)
```

**Acceptance Criteria**:
- SDS compilation succeeds even with missing entity references
- Generated defaults are deterministic (same blueprint + song = same defaults)
- `use_defaults=False` raises clear error if entities missing
- Default entities optionally stored in database
- Unit tests cover all entity missing combinations
- Integration tests verify full flow with defaults

**Effort**: 3 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/services/sds_compiler.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/test_sds_compiler_defaults.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md`

---

### Phase 3: API - SDS Endpoints

**Objective**: Create API endpoints for SDS retrieval and export.

#### Task SDS-PREVIEW-007: GET /songs/{id}/sds Endpoint

**Description**: Create endpoint to retrieve compiled SDS JSON for a song.

**Deliverables**:
- `apps/api/app/api/v1/endpoints/songs.py`
  - New route: `@router.get("/{song_id}/sds", response_model=SDS)`
  - Handler: `get_song_sds(song_id: UUID, db: Session, current_user: User)`
  - Logic:
    1. Fetch song from database
    2. Call `sds_compiler.compile_sds(song, use_defaults=True)`
    3. Return SDS JSON
  - Error handling:
    - 404 if song not found
    - 403 if user doesn't have access (RLS)
    - 422 if SDS compilation fails (with detailed error)

**API Contract**:
```yaml
GET /api/v1/songs/{song_id}/sds
Responses:
  200:
    description: Compiled SDS JSON
    content:
      application/json:
        schema: SDS
  404:
    description: Song not found
  403:
    description: Access denied
  422:
    description: SDS compilation failed
    content:
      application/json:
        example:
          detail: "Missing required entity: blueprint_id is null and no blueprint found for genre 'Unknown'"
```

**Acceptance Criteria**:
- Endpoint returns valid SDS JSON
- Uses default generators for missing entities
- Returns 404 for non-existent songs
- Returns 403 for unauthorized access
- Returns 422 with clear error for compilation failures
- Unit tests with 95%+ coverage
- Integration tests with real database

**Effort**: 2 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/api/v1/endpoints/songs.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/api/v1/test_songs_sds.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md`

---

#### Task SDS-PREVIEW-008: GET /songs/{id}/export Endpoint

**Description**: Create endpoint to download SDS as formatted JSON file.

**Deliverables**:
- `apps/api/app/api/v1/endpoints/songs.py`
  - New route: `@router.get("/{song_id}/export")`
  - Handler: `export_song_sds(song_id: UUID, db: Session, current_user: User)`
  - Logic:
    1. Fetch song from database
    2. Call `sds_compiler.compile_sds(song, use_defaults=True)`
    3. Format SDS as pretty JSON (indent=2)
    4. Generate filename: `{song_title}_sds_{timestamp}.json`
    5. Return file response with:
       - `Content-Type: application/json`
       - `Content-Disposition: attachment; filename="{filename}"`
  - Error handling: Same as SDS retrieval endpoint

**API Contract**:
```yaml
GET /api/v1/songs/{song_id}/export
Responses:
  200:
    description: SDS JSON file download
    content:
      application/json:
        schema: string (formatted JSON)
    headers:
      Content-Disposition:
        schema: string
        example: 'attachment; filename="elf_on_overtime_sds_20251115.json"'
  404:
    description: Song not found
  403:
    description: Access denied
  422:
    description: SDS compilation failed
```

**Example Response Headers**:
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="my_song_sds_20251115_143022.json"
```

**Acceptance Criteria**:
- Endpoint returns formatted JSON with proper headers
- Filename includes song title and timestamp
- Browser triggers download (not display)
- Same error handling as retrieval endpoint
- Unit tests with 95%+ coverage
- Integration tests verify file download

**Effort**: 2 story points
**Subagent**: python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/api/app/api/v1/endpoints/songs.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/api/v1/test_songs_export.py`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md`

---

### Phase 4: Frontend - Song Detail Page Enhancement

**Objective**: Enhance Song Detail page with entity displays and tab structure.

#### Task SDS-PREVIEW-009: Entity Detail Sections

**Description**: Create entity detail display sections for Song Detail page.

**Deliverables**:
- `apps/web/src/components/songs/EntityDetailSection.tsx`
  - Component to display single entity details
  - Props: `entityType`, `entityId`, `entityData`, `editHref`
  - Shows:
    - Entity type icon
    - Entity ID (if exists)
    - Key properties (3-5 important fields)
    - "View/Edit" link to entity edit page
    - "Not assigned" state if entityId is null
  - Styling: Card component with proper spacing

- Update `apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
  - Fetch entity data for song (style, lyrics, persona, blueprint, producer_notes)
  - Use `EntityDetailSection` components in Entities tab
  - Show 4-6 entity sections in grid layout

**Component API**:
```typescript
interface EntityDetailSectionProps {
  entityType: 'style' | 'lyrics' | 'persona' | 'blueprint' | 'producer_notes';
  entityId: string | null;
  entityData?: Record<string, any>; // Partial entity data to display
  editHref: string; // Link to edit page
  createHref: string; // Link to create page if entityId is null
}

// Usage
<EntityDetailSection
  entityType="style"
  entityId={song.style_id}
  entityData={styleData}
  editHref={ROUTES.ENTITIES.STYLE_EDIT(song.style_id)}
  createHref={ROUTES.ENTITIES.STYLE_NEW}
/>
```

**Display Fields by Entity Type**:
- **Style**: genre, tempo_bpm, key.primary, mood (first 3), energy
- **Lyrics**: language, pov, rhyme_scheme, section_order (count)
- **Persona**: name, vocal_range, delivery_style
- **Blueprint**: genre, version, required_sections (count)
- **Producer Notes**: structure, hooks, mix.lufs

**Acceptance Criteria**:
- EntityDetailSection component renders correctly for all entity types
- Shows key properties in readable format
- Displays "Not assigned" state gracefully
- Links to edit pages work correctly
- Grid layout responsive (2 cols desktop, 1 col mobile)
- Unit tests with 90%+ coverage (Vitest + React Testing Library)

**Effort**: 3 story points
**Subagent**: ui-engineer-enhanced, frontend-developer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/components/songs/EntityDetailSection.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/components/songs/EntityDetailSection.test.tsx`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md`

---

### Phase 5: Frontend - Preview Tab & JSON Viewer

**Objective**: Create Preview tab with syntax-highlighted JSON viewer.

#### Task SDS-PREVIEW-010: JSON Viewer Component

**Description**: Create reusable JSON viewer component with syntax highlighting.

**Deliverables**:
- `apps/web/src/components/common/JsonViewer.tsx`
  - Component to display formatted JSON with syntax highlighting
  - Features:
    - Syntax highlighting for keys, values, brackets
    - Collapsible sections (expand/collapse objects and arrays)
    - Line numbers (optional)
    - Copy to clipboard button
    - Search/filter (optional for MVP)
  - Library: Use `react-json-view` or `react-syntax-highlighter` + custom collapsing logic
  - Props: `data: object`, `collapsed?: boolean | number`, `theme?: 'light' | 'dark'`

**Component API**:
```typescript
interface JsonViewerProps {
  data: object;
  collapsed?: boolean | number; // true = all collapsed, false = all expanded, number = depth to collapse
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
  enableClipboard?: boolean;
}

// Usage
<JsonViewer
  data={sdsData}
  collapsed={1} // Collapse after 1 level
  theme="dark"
  enableClipboard={true}
/>
```

**Styling**:
- Use MeatyMusic dark theme colors
- Keys: Purple/blue (#8b5cf6)
- Strings: Green (#22c55e)
- Numbers: Orange (#f97316)
- Booleans: Yellow (#eab308)
- Null: Gray (#6b7280)
- Background: Dark panel (#1a1a2e or similar)

**Acceptance Criteria**:
- Component displays JSON with proper syntax highlighting
- Collapsible sections work (click to expand/collapse)
- Copy button copies entire JSON to clipboard
- Responsive on mobile (horizontal scroll if needed)
- Accessible (keyboard navigation)
- Unit tests with 90%+ coverage

**Effort**: 3 story points
**Subagent**: frontend-developer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/components/common/JsonViewer.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/components/common/JsonViewer.test.tsx`

**Dependencies**:
- `npm install react-json-view` or `npm install react-syntax-highlighter @types/react-syntax-highlighter`

---

#### Task SDS-PREVIEW-011: Preview Tab Implementation

**Description**: Add Preview tab to Song Detail page with SDS JSON viewer.

**Deliverables**:
- Update `apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
  - Add "Preview" tab to existing tabs (Overview, Entities, Workflow, History, **Preview**)
  - Fetch SDS data: `GET /api/v1/songs/{id}/sds`
  - Display SDS using `JsonViewer` component
  - Show loading state while fetching
  - Show error state if SDS compilation fails
  - Add "Export SDS" button at top of preview

- Create React Query hook for SDS fetching:
  - `apps/web/src/hooks/api/useSDS.ts`
  - `useSDS(songId: string)` hook
  - Returns: `{ data: SDS, isLoading, error }`

**Tab Content Structure**:
```tsx
<TabsContent value="preview" className="mt-6">
  <Card className="p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Song Design Spec (SDS)</h3>
      <Button onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export SDS
      </Button>
    </div>

    {isLoading && <Loader />}
    {error && <ErrorAlert message={error.message} />}
    {sdsData && (
      <JsonViewer
        data={sdsData}
        collapsed={1}
        theme="dark"
        enableClipboard={true}
      />
    )}
  </Card>
</TabsContent>
```

**Acceptance Criteria**:
- Preview tab appears in tab list
- SDS data fetches on tab click
- JsonViewer displays SDS with syntax highlighting
- Loading state shows spinner
- Error state shows clear error message
- Export button triggers download (see Phase 6)
- Tab switch doesn't re-fetch (React Query caching)
- Unit tests with 90%+ coverage

**Effort**: 4 story points
**Subagent**: frontend-developer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/hooks/api/useSDS.ts`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/hooks/api/useSDS.test.ts`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongDetailPreviewTab.test.tsx`

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md`

---

### Phase 6: Frontend - Export Functionality

**Objective**: Implement SDS export as downloadable JSON file.

#### Task SDS-PREVIEW-012: Export Button & Download Logic

**Description**: Add export button to trigger SDS download.

**Deliverables**:
- Update `apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
  - Add `handleExport` function
  - Fetch from `GET /api/v1/songs/{id}/export`
  - Trigger browser download using blob + `a.download`
  - Show loading state during export
  - Show success/error toast notification

**Export Logic**:
```typescript
const handleExport = async () => {
  setExporting(true);
  try {
    const response = await fetch(`/api/v1/songs/${songId}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || `sds_${songId}.json`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('SDS exported successfully');
  } catch (error) {
    toast.error('Failed to export SDS');
  } finally {
    setExporting(false);
  }
};
```

**UI Updates**:
- Export button shows loading spinner when `exporting === true`
- Button disabled during export
- Toast notifications for success/error
- Optional: Show download progress (if API supports chunked responses)

**Acceptance Criteria**:
- Export button triggers download
- Downloaded file has correct filename (from Content-Disposition header)
- Downloaded JSON is formatted and valid
- Loading state shows during export
- Success toast appears on completion
- Error toast appears on failure
- Works in Chrome, Firefox, Safari
- Unit tests with 90%+ coverage

**Effort**: 2 story points
**Subagent**: frontend-developer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongExport.test.tsx`

**Dependencies**:
- Toast library (likely already in project, e.g., `react-hot-toast` or `sonner`)

**Related PRDs**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md`

---

### Phase 7: Testing & Validation

**Objective**: Comprehensive testing of all components and integration.

#### Task SDS-PREVIEW-013: Backend Unit Tests

**Description**: Unit tests for default generators and SDS compilation.

**Deliverables**:
- Unit tests for all default generators (Tasks 001-005)
  - Test each generator with various blueprint configurations
  - Test partial entity data preservation
  - Test determinism (same inputs = same outputs)
  - Test error cases (invalid blueprints, missing data)

- Unit tests for SDS compiler enhancement (Task 006)
  - Test default integration logic
  - Test with all combinations of missing entities
  - Test `use_defaults=True/False` behavior
  - Test error messages

**Coverage Target**: 95%+

**Acceptance Criteria**:
- All unit tests pass
- Code coverage ≥95% for default generators
- Code coverage ≥90% for SDS compiler
- Tests run in CI/CD pipeline
- Tests use realistic blueprint and entity fixtures

**Effort**: 2 story points
**Subagent**: testing-specialist, python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/default_generators/test_*.py` (5 files)
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/services/test_sds_compiler_defaults.py`

---

#### Task SDS-PREVIEW-014: API Integration Tests

**Description**: Integration tests for SDS retrieval and export endpoints.

**Deliverables**:
- Integration tests for `GET /songs/{id}/sds` (Task 007)
  - Test successful SDS retrieval
  - Test with missing entities (defaults used)
  - Test 404 for non-existent songs
  - Test 403 for unauthorized access
  - Test 422 for compilation errors

- Integration tests for `GET /songs/{id}/export` (Task 008)
  - Test successful export with correct headers
  - Test filename generation
  - Test same error cases as retrieval

**Coverage Target**: 95%+

**Acceptance Criteria**:
- All integration tests pass
- Tests use real database (test DB)
- Tests verify API contracts (status codes, headers, body structure)
- Tests run in CI/CD pipeline

**Effort**: 2 story points
**Subagent**: testing-specialist, python-backend-engineer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/api/v1/test_songs_sds.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/api/v1/test_songs_export.py`

---

#### Task SDS-PREVIEW-015: Frontend Component Tests

**Description**: Unit tests for React components.

**Deliverables**:
- Unit tests for `EntityDetailSection` component (Task 009)
  - Test rendering for all entity types
  - Test "not assigned" state
  - Test links to edit/create pages
  - Test responsive layout

- Unit tests for `JsonViewer` component (Task 010)
  - Test JSON rendering
  - Test syntax highlighting
  - Test collapse/expand functionality
  - Test copy to clipboard

- Unit tests for Preview tab (Task 011)
  - Test tab rendering
  - Test SDS data fetching (mock API)
  - Test loading and error states
  - Test export button click

- Unit tests for export functionality (Task 012)
  - Test download trigger
  - Test filename extraction
  - Test error handling

**Coverage Target**: 90%+

**Acceptance Criteria**:
- All component tests pass
- Tests use Vitest + React Testing Library
- Tests mock API calls appropriately
- Tests verify user interactions (clicks, renders)
- Tests run in CI/CD pipeline

**Effort**: 3 story points
**Subagent**: testing-specialist, frontend-developer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/components/songs/EntityDetailSection.test.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/components/common/JsonViewer.test.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongDetailPreviewTab.test.tsx`
- `/Users/miethe/dev/homelab/development/MeatyMusic/apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongExport.test.tsx`

---

#### Task SDS-PREVIEW-016: E2E Tests

**Description**: End-to-end tests for complete user flow.

**Deliverables**:
- E2E test: "User views SDS preview for song"
  - Navigate to song detail page
  - Click Preview tab
  - Verify SDS JSON displays
  - Verify entity data shown correctly

- E2E test: "User exports SDS"
  - Navigate to song detail page
  - Click Preview tab
  - Click Export button
  - Verify file downloads
  - Verify file content is valid JSON

- E2E test: "User views song with missing entities (defaults used)"
  - Create song without style_id
  - Navigate to song detail page
  - Verify Preview tab shows SDS with defaults
  - Verify no errors displayed

**Tool**: Playwright or Cypress

**Acceptance Criteria**:
- All E2E tests pass
- Tests run against local dev environment
- Tests verify full user interaction flow
- Tests run in CI/CD pipeline (optional for MVP)

**Effort**: 2 story points
**Subagent**: testing-specialist
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/e2e/songs/sds-preview.spec.ts`
- `/Users/miethe/dev/homelab/development/MeatyMusic/tests/e2e/songs/sds-export.spec.ts`

---

#### Task SDS-PREVIEW-017: Documentation

**Description**: Document new features and APIs.

**Deliverables**:
- API documentation updates:
  - Add `GET /songs/{id}/sds` to API docs
  - Add `GET /songs/{id}/export` to API docs
  - Include example requests/responses

- User guide section:
  - How to view SDS preview
  - How to export SDS
  - Understanding default generation

- Developer guide section:
  - Default generator architecture
  - How to add new default generators
  - Blueprint-based default logic

**Files to Update**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/API.md` (or create if doesn't exist)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/USER_GUIDE.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/DEVELOPER_GUIDE.md`

**Acceptance Criteria**:
- API docs include new endpoints with examples
- User guide explains Preview tab and Export
- Developer guide explains default generation architecture
- All code snippets are accurate
- Documentation reviewed and approved

**Effort**: 2 story points
**Subagent**: documentation-writer
**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/API.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/USER_GUIDE.md`
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/DEVELOPER_GUIDE.md`

---

## Risk Assessment & Mitigation

### High-Risk Areas

**Risk 1**: Default Generation Logic Complexity
- **Impact**: Medium
- **Probability**: Medium
- **Mitigation**:
  - Start with simple defaults (use blueprint midpoints)
  - Extensive unit testing with edge cases
  - Review blueprint PRDs for all genre-specific rules
  - Allow users to override defaults easily

**Risk 2**: JSON Viewer Performance
- **Impact**: Low
- **Probability**: Low
- **Mitigation**:
  - Use battle-tested library (`react-json-view`)
  - Lazy-load large SDS objects
  - Implement virtualization if SDS exceeds 1000 lines

**Risk 3**: Cross-Browser Export Compatibility
- **Impact**: Medium
- **Probability**: Low
- **Mitigation**:
  - Test on Chrome, Firefox, Safari
  - Use standard Blob API (widely supported)
  - Fallback to opening JSON in new tab if download fails

**Risk 4**: Blueprint File Loading
- **Impact**: High
- **Probability**: Low
- **Mitigation**:
  - Cache blueprints in memory/Redis
  - Validate blueprint JSON on application startup
  - Provide clear error if blueprint missing for genre

---

## Quality Gates

### Phase 1 Gate: Default Generation
- [ ] All 5 default generators implemented
- [ ] Unit tests pass with 95%+ coverage
- [ ] Default generation is deterministic (verified via tests)
- [ ] Blueprint reader loads all genre blueprints successfully

### Phase 2 Gate: SDS Compilation Enhancement
- [ ] SDS compiler uses defaults for missing entities
- [ ] Integration tests pass
- [ ] Error messages are clear and actionable
- [ ] Determinism maintained with defaults

### Phase 3 Gate: API Endpoints
- [ ] Both endpoints (`/sds` and `/export`) functional
- [ ] API contracts match specification
- [ ] Error handling tested (404, 403, 422)
- [ ] Integration tests pass with 95%+ coverage

### Phase 4-6 Gate: Frontend Components
- [ ] Song Detail page enhanced with Preview tab
- [ ] JSON viewer displays SDS correctly
- [ ] Entity detail sections show key properties
- [ ] Export button downloads valid JSON file
- [ ] Component tests pass with 90%+ coverage

### Phase 7 Gate: Testing & Documentation
- [ ] All unit tests pass (backend + frontend)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Documentation complete and reviewed
- [ ] Code review approved

---

## Success Metrics

### Functional Metrics
- Users can view SDS preview for 100% of songs (with defaults if needed)
- Export success rate ≥99% (excluding network failures)
- SDS compilation latency P95 ≤2s
- Default generation is deterministic (99%+ identical across runs)

### Quality Metrics
- Backend unit test coverage ≥95%
- Frontend unit test coverage ≥90%
- Integration test coverage ≥95%
- E2E test pass rate 100%
- Zero high-severity bugs in production

### User Experience Metrics
- Preview tab loads in <2s (P95)
- JSON viewer renders large SDS (<5000 lines) in <1s
- Export completes in <1s (P95)
- Zero user-reported errors in first week

---

## Dependencies & Blockers

### External Dependencies
- **Completed**: SDS Aggregation implementation (`sds-aggregation-implementation-v1.md`)
  - Required: SDS Compiler Service, Blueprint Validator
- **Completed**: Entity CRUD APIs
  - Required: Style, Lyrics, Persona, ProducerNotes, Blueprint endpoints
- **Completed**: Song Detail page structure
  - Required: Tabs component, basic layout

### Blockers
- None (all dependencies completed in Phase 1-2)

### Optional Enhancements (Post-MVP)
- Real-time SDS preview during song creation
- SDS diff viewer (compare versions)
- SDS validation warnings in UI
- Import SDS from JSON file
- SDS templates library

---

## Subagent Assignments

### Backend Team
**python-backend-engineer** (Primary):
- Tasks 001-008 (Default generators, SDS enhancement, API endpoints)
- Unit tests (Task 013)
- Integration tests (Task 014)

**backend-architect** (Reviewer):
- Review default generation architecture (Task 001)
- Review SDS compiler enhancement (Task 006)

**data-layer-expert** (Consultant):
- Advise on blueprint caching strategy
- Review database queries for entity fetching

### Frontend Team
**frontend-developer** (Primary):
- Tasks 009-012 (Components, Preview tab, Export)
- Component tests (Task 015)

**ui-engineer-enhanced** (Pair):
- Task 009 (Entity detail sections - design + implementation)
- Review JSON viewer UX (Task 010)

### Testing Team
**testing-specialist**:
- Backend tests coordination (Tasks 013-014)
- Frontend tests coordination (Task 015)
- E2E tests (Task 016)

### Documentation Team
**documentation-writer**:
- Task 017 (API docs, user guide, developer guide)

---

## Timeline & Milestones

### Week 1 Breakdown

**Days 1-2: Backend Foundation**
- Mon AM: Kickoff, blueprint reader (Task 001)
- Mon PM: Default style generator (Task 002)
- Tue AM: Default lyrics generator (Task 003)
- Tue PM: Default persona & producer generators (Tasks 004-005)

**Day 3: Backend Integration**
- Wed AM: SDS compiler enhancement (Task 006)
- Wed PM: API endpoints (Tasks 007-008)

**Day 4: Frontend Core**
- Thu AM: Entity detail sections (Task 009)
- Thu PM: JSON viewer component (Task 010)

**Day 5: Frontend Integration**
- Fri AM: Preview tab implementation (Task 011)
- Fri PM: Export functionality (Task 012)

**Days 6-7: Testing & Polish**
- Sat: Backend tests (Tasks 013-014), Frontend tests (Task 015)
- Sun: E2E tests (Task 016), Documentation (Task 017)

### Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| M1: Backend Complete | Day 3 EOD | Tasks 001-008 functional |
| M2: Frontend Complete | Day 5 EOD | Tasks 009-012 functional |
| M3: Testing Complete | Day 6 EOD | Tasks 013-016 pass |
| M4: Documentation Complete | Day 7 EOD | Task 017 reviewed |
| M5: Feature Release | Day 8 | Deploy to staging/production |

---

## Acceptance Criteria Summary

### User Stories

**As a user, I want to**:
1. **View SDS preview** for my song so I can understand the complete specification before running workflows
   - Acceptance: Preview tab shows formatted JSON with syntax highlighting

2. **Export SDS as JSON file** so I can store it locally or share with collaborators
   - Acceptance: Export button downloads valid JSON file with proper filename

3. **See default values for missing entities** so I can quickly preview SDS even if I haven't created all entities yet
   - Acceptance: SDS preview works for songs with missing style/lyrics/etc., using blueprint defaults

4. **Understand what entities are assigned** to my song so I can navigate to edit them if needed
   - Acceptance: Entity detail sections show key properties with links to edit pages

### Technical Acceptance

**Backend**:
- [ ] All 5 default generators functional and deterministic
- [ ] SDS compiler uses defaults for missing entities
- [ ] `GET /songs/{id}/sds` returns valid SDS JSON
- [ ] `GET /songs/{id}/export` triggers file download
- [ ] Unit test coverage ≥95%
- [ ] Integration test coverage ≥95%

**Frontend**:
- [ ] Preview tab displays SDS with syntax highlighting
- [ ] Export button downloads JSON file
- [ ] Entity detail sections show key properties
- [ ] All components responsive (mobile + desktop)
- [ ] Component test coverage ≥90%

**Integration**:
- [ ] E2E tests pass for preview and export flows
- [ ] API contracts validated
- [ ] Error handling tested (404, 403, 422)
- [ ] Performance targets met (P95 latency ≤2s)

---

## Related Documents

### PRDs
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md` - SDS entity specification
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md` - Web app architecture
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md` - Blueprint rules and rubric
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/style.prd.md` - Style entity
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/lyrics.prd.md` - Lyrics entity
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/persona.prd.md` - Persona entity
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/producer_notes.prd.md` - Producer notes entity

### Implementation Plans
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/implementation_plans/sds-aggregation-implementation-v1.md` - SDS compilation backend (prerequisite)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/implementation_plans/backend-entity-services-v1.md` - Entity services
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/implementation_plans/frontend-state-management-v1.md` - Frontend state management

### Architecture Docs
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/amcs-overview.md` - System overview
- `/Users/miethe/dev/homelab/development/MeatyMusic/CLAUDE.md` - Development guidelines

---

## Appendix A: Default Generation Algorithms

### Style Defaults Algorithm

```python
def generate_default_style(blueprint: Blueprint, partial: Style | None) -> Style:
    """
    Generate default style using blueprint rules.

    Priority:
    1. User-provided values (from partial)
    2. Blueprint-specific defaults
    3. Global defaults
    """
    # Extract blueprint rules
    tempo_range = blueprint.rules.tempo_bpm  # [min, max]

    return Style(
        genre_detail={
            "primary": partial?.genre_detail?.primary or blueprint.genre,
            "subgenres": partial?.genre_detail?.subgenres or [],
            "fusions": partial?.genre_detail?.fusions or []
        },
        tempo_bpm=partial?.tempo_bpm or tempo_range,  # Use full range
        time_signature=partial?.time_signature or "4/4",
        key={
            "primary": partial?.key?.primary or "C major",
            "modulations": partial?.key?.modulations or []
        },
        mood=partial?.mood or get_genre_default_mood(blueprint.genre),
        energy=partial?.energy or "medium",
        instrumentation=partial?.instrumentation or [],
        vocal_profile=partial?.vocal_profile or None,
        tags=partial?.tags or [],
        negative_tags=partial?.negative_tags or []
    )

def get_genre_default_mood(genre: str) -> list[str]:
    """Get default mood for genre."""
    mood_map = {
        "Christmas Pop": ["upbeat", "warm"],
        "Hip-Hop": ["energetic", "confident"],
        "Jazz": ["smooth", "sophisticated"],
        "Rock": ["energetic", "rebellious"],
        # ... etc
    }
    return mood_map.get(genre, ["neutral"])
```

### Lyrics Defaults Algorithm

```python
def generate_default_lyrics(blueprint: Blueprint, partial: Lyrics | None) -> Lyrics:
    """Generate default lyrics using blueprint rules."""

    # Standard pop section order
    default_section_order = ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"]

    # Filter to required sections if blueprint specifies
    if blueprint.rules.required_sections:
        # Ensure all required sections present
        section_order = ensure_required_sections(
            default_section_order,
            blueprint.rules.required_sections
        )
    else:
        section_order = default_section_order

    return Lyrics(
        language=partial?.language or "en",
        pov=partial?.pov or "1st",
        tense=partial?.tense or "present",
        themes=partial?.themes or [],
        rhyme_scheme=partial?.rhyme_scheme or "AABB",
        meter=partial?.meter or "4/4 pop",
        syllables_per_line=partial?.syllables_per_line or 8,
        hook_strategy=partial?.hook_strategy or "repetition",
        repetition_policy=partial?.repetition_policy or "moderate",
        imagery_density=partial?.imagery_density or 0.5,
        section_order=partial?.section_order or section_order,
        constraints={
            "explicit": partial?.constraints?.explicit or False,
            "max_lines": partial?.constraints?.max_lines or 120,
            "section_requirements": partial?.constraints?.section_requirements or
                blueprint.rules.section_lines or {}
        },
        source_citations=partial?.source_citations or []
    )
```

### Producer Notes Defaults Algorithm

```python
def generate_default_producer_notes(
    blueprint: Blueprint,
    style: Style,
    lyrics: Lyrics,
    partial: ProducerNotes | None
) -> ProducerNotes:
    """Generate default producer notes from blueprint, style, and lyrics."""

    # Structure from lyrics section order
    structure = "-".join(lyrics.section_order)

    # Section metadata defaults
    section_meta = {}
    for section in set(lyrics.section_order):
        section_meta[section] = {
            "tags": get_default_section_tags(section),
            "target_duration_sec": get_default_section_duration(section)
        }

    return ProducerNotes(
        structure=partial?.structure or structure,
        hooks=partial?.hooks or 1,
        instrumentation=partial?.instrumentation or style.instrumentation,
        section_meta=partial?.section_meta or section_meta,
        mix={
            "lufs": partial?.mix?.lufs or -14.0,  # Streaming standard
            "space": partial?.mix?.space or "balanced",
            "stereo_width": partial?.mix?.stereo_width or "medium"
        }
    )

def get_default_section_tags(section: str) -> list[str]:
    """Get default tags for section type."""
    tag_map = {
        "Intro": ["instrumental", "low energy"],
        "Verse": ["storytelling"],
        "Chorus": ["anthemic", "hook-forward"],
        "Bridge": ["minimal", "dramatic"],
        "Outro": ["fade-out"]
    }
    return tag_map.get(section, [])

def get_default_section_duration(section: str) -> int:
    """Get default duration for section type (seconds)."""
    duration_map = {
        "Intro": 10,
        "Verse": 30,
        "PreChorus": 15,
        "Chorus": 25,
        "Bridge": 20,
        "Outro": 10
    }
    return duration_map.get(section, 20)
```

---

## Appendix B: API Examples

### GET /songs/{id}/sds

**Request**:
```http
GET /api/v1/songs/550e8400-e29b-41d4-a716-446655440000/sds HTTP/1.1
Host: api.meatymusic.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
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
    "source_citations": []
  },
  "producer_notes": {
    "structure": "Intro-Verse-PreChorus-Chorus-Verse-PreChorus-Chorus-Bridge-Chorus",
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
      "Chorus": {
        "tags": ["anthemic", "hook-forward"],
        "target_duration_sec": 25
      }
    },
    "mix": {
      "lufs": -12.0,
      "space": "lush",
      "stereo_width": "wide"
    }
  },
  "persona_id": null,
  "sources": [],
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

**Response (422 Unprocessable Entity)**:
```json
{
  "detail": "SDS compilation failed: Missing required entity: blueprint_id is null and no blueprint found for genre 'Unknown Genre'"
}
```

### GET /songs/{id}/export

**Request**:
```http
GET /api/v1/songs/550e8400-e29b-41d4-a716-446655440000/export HTTP/1.1
Host: api.meatymusic.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="elf_on_overtime_sds_20251115_143022.json"
Content-Length: 2847

{
  "title": "Elf On Overtime",
  ... (same as GET /sds, but pretty-printed with indent=2)
}
```

---

## Appendix C: Component Mockups

### Preview Tab Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Overview] [Entities] [Workflow] [History] [Preview]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Song Design Spec (SDS)          [Export SDS ↓]     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │  {                                                  │   │
│  │    "title": "Elf On Overtime",                      │   │
│  │    "blueprint_ref": {                               │   │
│  │      "genre": "Christmas Pop",                      │   │
│  │      "version": "2025.11"                           │   │
│  │    },                                               │   │
│  │    "style": { ... } ▸                               │   │
│  │    "lyrics": { ... } ▸                              │   │
│  │    "producer_notes": { ... } ▸                      │   │
│  │    "persona_id": null,                              │   │
│  │    "sources": [],                                   │   │
│  │    "prompt_controls": { ... } ▸                     │   │
│  │    "render": { ... } ▸                              │   │
│  │    "seed": 42                                       │   │
│  │  }                                                  │   │
│  │                                                     │   │
│  │  [Copy to Clipboard]                                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Entity Detail Section

```
┌─────────────────────────────────────────────────────────────┐
│ [Overview] [Entities] [Workflow] [History] [Preview]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ 🎨 Style           │  │ 📝 Lyrics          │            │
│  ├────────────────────┤  ├────────────────────┤            │
│  │ Genre: Christmas   │  │ Language: en       │            │
│  │       Pop          │  │ POV: 1st           │            │
│  │ Tempo: 116-124 BPM │  │ Rhyme: AABB        │            │
│  │ Key: C major       │  │ Sections: 9        │            │
│  │ Mood: upbeat,      │  │                    │            │
│  │       cheeky, warm │  │ [View/Edit →]      │            │
│  │ Energy: anthemic   │  │                    │            │
│  │                    │  │                    │            │
│  │ [View/Edit →]      │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ 👤 Persona         │  │ 🎛️ Producer Notes  │            │
│  ├────────────────────┤  ├────────────────────┤            │
│  │ No persona         │  │ Structure:         │            │
│  │ assigned           │  │   Intro-Verse-...  │            │
│  │                    │  │ Hooks: 2           │            │
│  │ [Create Persona]   │  │ LUFS: -12.0        │            │
│  │                    │  │                    │            │
│  │                    │  │ [View/Edit →]      │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Document Status

**Version**: 1.0
**Created**: 2025-11-15
**Status**: READY FOR IMPLEMENTATION
**Approval**: Ready for technical lead review
**Dependencies**: SDS Aggregation implementation (complete)
**Next Steps**: Assign agents, create feature branch, begin Phase 1

---

**Last Updated**: 2025-11-15
**Maintained By**: Implementation Planning Orchestrator (Haiku 4.5)
**Review Frequency**: Daily during active development
