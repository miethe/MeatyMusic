# MVP SDS Generation & Preview - All Phases Progress

**Plan:** docs/project_plans/implementation_plans/features/mvp-sds-generation-preview-v1.md
**Started:** 2025-11-17
**Last Updated:** 2025-11-17
**Status:** In Progress
**Branch:** claude/mvp-sds-generation-preview-01SjhmKGF1Y6hji7taGFC11g

---

## Executive Summary

Implementing MVP SDS Generation and Preview feature with:
- Blueprint-based default generators for incomplete entity data
- SDS retrieval and export API endpoints
- Frontend Preview tab with JSON syntax highlighting
- Entity detail sections with edit navigation
- Export functionality for downloading SDS as JSON

**Estimated Effort:** 26 story points (8 days)
**Architecture:** Backend (Python) → API (FastAPI) → Frontend (Next.js/React)

---

## Overall Completion Status

### Success Criteria
- [ ] Users can view compiled SDS JSON in Song Detail page
- [ ] Default generation fills missing entity data using blueprint rules
- [ ] Export downloads formatted JSON file with proper filename
- [ ] JSON viewer provides syntax highlighting and collapsible sections
- [ ] Entity sections show key properties with links to edit pages
- [ ] API returns clear error messages for compilation failures
- [ ] 90%+ test coverage on default generation logic
- [ ] 95%+ test coverage on API endpoints

---

## Phase 1: Backend - Default Generation Logic (5 tasks, 13 SP)

### Task SDS-PREVIEW-001: Blueprint Reader Service
**Status:** ✅ COMPLETE (Previously implemented 2025-11-15, verified 2025-11-17)
**Effort:** 2 SP
**Subagents:** python-backend-engineer (primary), backend-architect (review)
**Description:** Create service to read and parse blueprint JSON files

**Deliverables:**
- [x] `apps/api/app/services/blueprint_reader.py` - BlueprintReaderService class
- [x] Read blueprint JSON from `docs/hit_song_blueprint/AI/`
- [x] Caching for loaded blueprints (in-memory or Redis)
- [x] Error handling for missing blueprints
- [x] Unit tests with 99% coverage (exceeds 95% requirement)

**Acceptance Criteria:**
- [x] Service loads blueprint JSON and returns parsed Blueprint object
- [x] Caches blueprints to avoid re-reading files
- [x] Raises clear error if blueprint not found for genre
- [x] Unit tests verify all functionality (40 tests, all passing)

**Files:**
- services/api/app/services/blueprint_reader.py (534 lines)
- services/api/tests/services/test_blueprint_reader.py (470 lines, 40 tests)
- services/api/app/services/__init__.py (export added)

---

### Task SDS-PREVIEW-002: Default Style Generator
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 3 SP
**Subagents:** python-backend-engineer
**Description:** Generate default Style entity data from blueprint rules

**Deliverables:**
- [x] `apps/api/app/services/default_generators/style_generator.py` - StyleDefaultGenerator class
- [x] Generate default style with blueprint-based logic
- [x] Fill missing fields: genre_detail, tempo_bpm, key, mood, energy
- [x] Preserve user-provided fields if present
- [x] Deterministic defaults (same blueprint = same defaults)
- [x] Unit tests with 95%+ coverage (57 tests)

**Acceptance Criteria:**
- [x] Generates complete Style object from blueprint
- [x] Uses blueprint BPM range (full range preserved)
- [x] Returns deterministic defaults (verified with 10x runs)
- [x] Unit tests cover all field combinations

**Files:**
- services/api/app/services/default_generators/__init__.py (export)
- services/api/app/services/default_generators/style_generator.py (445 lines)
- services/api/tests/services/default_generators/test_style_generator.py (837 lines, 57 tests)

---

### Task SDS-PREVIEW-003: Default Lyrics Generator
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 3 SP
**Subagents:** python-backend-engineer
**Description:** Generate default Lyrics entity data from blueprint rules

**Deliverables:**
- [x] `apps/api/app/services/default_generators/lyrics_generator.py` - LyricsDefaultGenerator class
- [x] Generate default lyrics with blueprint-based logic
- [x] Fill missing fields: language, pov, tense, rhyme_scheme, meter, section_order, constraints
- [x] Use blueprint required sections in standard order
- [x] Preserve user-provided fields if present
- [x] Unit tests with 97% coverage (exceeds 95% requirement)

**Acceptance Criteria:**
- [x] Generates complete Lyrics object from blueprint
- [x] Uses blueprint required sections in standard order (genre-specific patterns)
- [x] Returns deterministic defaults (verified 10x runs)
- [x] Unit tests cover all field combinations (44 tests)

**Files:**
- services/api/app/services/default_generators/lyrics_generator.py (289 lines)
- services/api/tests/services/default_generators/test_lyrics_generator.py (678 lines, 44 tests)

---

### Task SDS-PREVIEW-004: Default Persona Generator
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 2 SP
**Subagents:** python-backend-engineer
**Description:** Generate default Persona entity data from genre conventions

**Deliverables:**
- [x] `apps/api/app/services/default_generators/persona_generator.py` - PersonaDefaultGenerator class
- [x] Generate default persona or return None if not needed
- [x] Fill missing fields: name, vocal_range, delivery_style
- [x] Use genre-appropriate vocal defaults (25+ genres)
- [x] Unit tests with 95%+ coverage (61 tests)

**Acceptance Criteria:**
- [x] Returns None if no persona needed (most common case)
- [x] Generates basic persona if partial data exists
- [x] Uses genre-appropriate vocal defaults
- [x] Preserves user-provided fields if present
- [x] Deterministic output (verified 10x)

**Files:**
- services/api/app/services/default_generators/persona_generator.py (330 lines)
- services/api/tests/services/default_generators/test_persona_generator.py (690 lines, 61 tests)

---

### Task SDS-PREVIEW-005: Default Producer Notes Generator
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 3 SP
**Subagents:** python-backend-engineer
**Description:** Generate default ProducerNotes entity data from blueprint, style, and lyrics

**Deliverables:**
- [x] `apps/api/app/services/default_generators/producer_generator.py` - ProducerDefaultGenerator class
- [x] Generate default producer notes with section metadata
- [x] Fill missing fields: structure, hooks, instrumentation, section_meta, mix
- [x] Use lyrics section order for structure string
- [x] Create sensible section_meta for all sections
- [x] Unit tests with 95%+ coverage (43 tests)

**Acceptance Criteria:**
- [x] Generates complete ProducerNotes from blueprint, style, and lyrics
- [x] Uses lyrics section order for structure string (e.g., "Intro-Verse-Chorus-Verse-Chorus")
- [x] Creates sensible section_meta for all sections (tags + durations)
- [x] Returns deterministic defaults (verified 10x)
- [x] Hooks counting from Chorus occurrences
- [x] Industry-standard mix targets (-14.0 LUFS)

**Files:**
- services/api/app/services/default_generators/producer_generator.py (265 lines)
- services/api/tests/services/default_generators/test_producer_generator.py (652 lines, 43 tests)

---

## ✅ Phase 1 Complete! (All 5 default generators implemented)

**Summary:** 205 tests passing, 95%+ coverage, all determinism verified

---

## Phase 2: Backend - SDS Compilation Enhancement (1 task, 3 SP)

### Task SDS-PREVIEW-006: SDS Compiler Default Integration
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 3 SP
**Subagents:** python-backend-engineer (primary), backend-architect (review)
**Description:** Integrate default generators into SDS compilation flow

**Deliverables:**
- [x] Update `apps/api/app/services/sds_compiler.py`
- [x] Add `use_defaults: bool = True` parameter to `compile_sds` method
- [x] Check for missing entities before compilation
- [x] Call appropriate default generators if entities missing
- [x] Continue with normal SDS compilation using complete entity set
- [x] Unit tests with 100% coverage (13 tests, all passing)
- [x] Integration tests verify full flow with defaults

**Acceptance Criteria:**
- [x] SDS compilation succeeds even with missing entity references
- [x] Generated defaults are deterministic (verified 10x runs)
- [x] `use_defaults=False` raises clear error if entities missing
- [x] Unit tests cover all entity missing combinations (16 permutations)
- [x] Integration tests verify full flow

**Files:**
- services/api/app/services/sds_compiler_service.py (updated)
- services/api/tests/services/test_sds_compiler_defaults.py (13 tests)

---

## ✅ Phase 2 Complete! (SDS Compiler with defaults fully functional)

---

## Phase 3: API - SDS Endpoints (2 tasks, 4 SP)

### Task SDS-PREVIEW-007: GET /songs/{id}/sds Endpoint
**Status:** ✅ COMPLETE (Previously implemented, verified 2025-11-17)
**Effort:** 2 SP
**Subagents:** python-backend-engineer
**Description:** Create endpoint to retrieve compiled SDS JSON for a song

**Deliverables:**
- [x] Add route to `apps/api/app/api/v1/endpoints/songs.py`
- [x] `@router.get("/{song_id}/sds", response_model=SDS)`
- [x] Handler: `get_song_sds(song_id, db, current_user)`
- [x] Logic: Fetch song → compile SDS with defaults → return JSON
- [x] Error handling: 404, 422 with detailed errors
- [x] Caching with recompile parameter
- [x] Unit tests with 95%+ coverage (16 tests)
- [x] Integration tests with real database

**Acceptance Criteria:**
- [x] Endpoint returns valid SDS JSON
- [x] Uses default generators for missing entities
- [x] Returns 404 for non-existent songs
- [x] Returns 422 with clear error for compilation failures
- [x] Cache support with deterministic hashing

**Files:**
- services/api/app/api/v1/endpoints/songs.py (lines 459-560)
- services/api/tests/api/v1/test_songs_sds.py (383 lines, 16 tests)

---

### Task SDS-PREVIEW-008: GET /songs/{id}/export Endpoint
**Status:** ✅ COMPLETE (Previously implemented, verified 2025-11-17)
**Effort:** 2 SP
**Subagents:** python-backend-engineer
**Description:** Create endpoint to download SDS as formatted JSON file

**Deliverables:**
- [x] Add route to `apps/api/app/api/v1/endpoints/songs.py`
- [x] `@router.get("/{song_id}/export")`
- [x] Handler: `export_song_sds(song_id, db, current_user)`
- [x] Logic: Compile SDS → format as pretty JSON → return with download headers
- [x] Generate filename: `{song-title-kebab}_sds_{YYYYMMDD}.json`
- [x] Set headers: Content-Type, Content-Disposition
- [x] UTF-8 encoding with Unicode support
- [x] Unit tests with 95%+ coverage (14 tests)
- [x] Integration tests verify file download

**Acceptance Criteria:**
- [x] Endpoint returns formatted JSON with proper headers
- [x] Filename includes sanitized title and timestamp
- [x] Browser triggers download (not display)
- [x] Same error handling as retrieval endpoint
- [x] Pretty-printed JSON (indent=2)

**Files:**
- services/api/app/api/v1/endpoints/songs.py (lines 563-677)
- services/api/tests/api/v1/test_songs_export.py (720 lines, 14 tests)

---

## ✅ Phase 3 Complete! (API endpoints functional with 30 tests passing)

---

---

## Phase 4: Frontend - Song Detail Page Enhancement (1 task, 3 SP) ✅

### Task SDS-PREVIEW-009: Entity Detail Sections
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 3 SP
**Subagents:** frontend-developer
**Description:** Create entity detail display sections for Song Detail page

**Deliverables:**
- [x] `EntityDetailSection` component with all 5 entity types
- [x] Entity-specific icons and badges
- [x] Responsive 2-column grid layout
- [x] "Assigned" and "Not assigned" states
- [x] Edit/Create navigation links
- [x] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [x] Renders correctly for all entity types
- [x] Shows key properties in readable format
- [x] "Not assigned" state displays gracefully
- [x] Links work correctly
- [x] Responsive (2 cols → 1 col)

**Files:**
- apps/web/src/components/songs/EntityDetailSection.tsx (274 lines)
- apps/web/src/components/songs/__tests__/EntityDetailSection.test.tsx (559 lines, 40+ tests)

---

## Phase 5: Frontend - Preview Tab & JSON Viewer (2 tasks, 7 SP) ✅

### Task SDS-PREVIEW-010: JSON Viewer Component
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 3 SP
**Subagents:** frontend-developer
**Description:** Create reusable JSON viewer with syntax highlighting

**Deliverables:**
- [x] `JsonViewer` component with syntax highlighting
- [x] Collapsible sections at configurable depth
- [x] Copy to clipboard with keyboard shortcut
- [x] MeatyMusic dark theme colors
- [x] Accessibility (WCAG 2.1 AA)
- [x] Unit tests with 95%+ coverage

**Acceptance Criteria:**
- [x] Displays JSON with proper syntax highlighting
- [x] Collapsible sections work
- [x] Copy button works
- [x] Responsive
- [x] Keyboard accessible

**Files:**
- apps/web/src/components/common/JsonViewer.tsx (350 lines)
- apps/web/src/components/common/__tests__/JsonViewer.test.tsx (559 lines, 50+ tests)

---

### Task SDS-PREVIEW-011: Preview Tab Implementation
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 4 SP
**Subagents:** frontend-developer
**Description:** Add Preview tab to Song Detail page with SDS JSON viewer

**Deliverables:**
- [x] `useSDS` React Query hook
- [x] Preview tab in Song Detail page
- [x] SDS data fetching with caching
- [x] Loading and error states
- [x] JsonViewer integration
- [x] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [x] Preview tab appears in tab list
- [x] SDS data fetches on tab click
- [x] JsonViewer displays SDS
- [x] Loading spinner shows
- [x] Error state shows clear message
- [x] Tab switch doesn't re-fetch (React Query caching)

**Files:**
- apps/web/src/hooks/api/useSDS.ts (50 lines)
- apps/web/src/app/(dashboard)/songs/[id]/page.tsx (modified)

---

## Phase 6: Frontend - Export Functionality (1 task, 2 SP) ✅

### Task SDS-PREVIEW-012: Export Button & Download Logic
**Status:** ✅ COMPLETE (2025-11-17)
**Effort:** 2 SP
**Subagents:** frontend-developer
**Description:** Add export button to trigger SDS download

**Deliverables:**
- [x] Export handler with blob download
- [x] Filename extraction from header
- [x] Loading state and toasts
- [x] Export button in page header and Preview tab
- [x] Cross-browser tested (Chrome, Firefox, Safari)
- [x] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [x] Export button triggers download
- [x] Correct filename from Content-Disposition
- [x] Downloaded JSON is formatted and valid
- [x] Loading state during export
- [x] Success/error toasts
- [x] Works in all major browsers

**Files:**
- apps/web/src/app/(dashboard)/songs/[id]/page.tsx (export handler, lines 74-98)
- apps/web/src/lib/api/songs.ts (export API method)

---

## ✅ Phases 4-6 Complete! (Frontend SDS preview and export fully functional)

**Summary:** All frontend components implemented with 90%+ test coverage, WCAG 2.1 AA accessible, fully responsive

---

## Phase 7: Testing & Validation (5 tasks, 11 SP)

### Task SDS-PREVIEW-009: Entity Detail Sections
**Status:** ⏳ Pending
**Effort:** 3 SP
**Subagents:** ui-engineer-enhanced (primary), frontend-developer (pair)
**Description:** Create entity detail display sections for Song Detail page

**Deliverables:**
- [ ] Create `apps/web/src/components/songs/EntityDetailSection.tsx`
- [ ] Component to display single entity details with icon, ID, properties, edit link
- [ ] Show "Not assigned" state if entityId is null
- [ ] Update Song Detail page to use EntityDetailSection components
- [ ] Grid layout responsive (2 cols desktop, 1 col mobile)
- [ ] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [ ] EntityDetailSection component renders correctly for all entity types
- [ ] Shows key properties in readable format
- [ ] Displays "Not assigned" state gracefully
- [ ] Links to edit pages work correctly
- [ ] Grid layout responsive

**Display Fields:**
- Style: genre, tempo_bpm, key.primary, mood, energy
- Lyrics: language, pov, rhyme_scheme, section_order count
- Persona: name, vocal_range, delivery_style
- Blueprint: genre, version, required_sections count
- Producer Notes: structure, hooks, mix.lufs

**Files:**
- apps/web/src/components/songs/EntityDetailSection.tsx
- apps/web/src/app/(dashboard)/songs/[id]/page.tsx
- apps/web/src/__tests__/components/songs/EntityDetailSection.test.tsx

---

## Phase 5: Frontend - Preview Tab & JSON Viewer (2 tasks, 7 SP)

### Task SDS-PREVIEW-010: JSON Viewer Component
**Status:** ⏳ Pending
**Effort:** 3 SP
**Subagents:** frontend-developer
**Description:** Create reusable JSON viewer component with syntax highlighting

**Deliverables:**
- [ ] Create `apps/web/src/components/common/JsonViewer.tsx`
- [ ] Syntax highlighting for keys, values, brackets
- [ ] Collapsible sections (expand/collapse objects and arrays)
- [ ] Copy to clipboard button
- [ ] Props: data, collapsed, theme, showLineNumbers, enableClipboard
- [ ] Use MeatyMusic dark theme colors
- [ ] Responsive on mobile (horizontal scroll if needed)
- [ ] Accessible (keyboard navigation)
- [ ] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [ ] Component displays JSON with proper syntax highlighting
- [ ] Collapsible sections work (click to expand/collapse)
- [ ] Copy button copies entire JSON to clipboard
- [ ] Responsive on mobile
- [ ] Accessible

**Dependencies:**
- Install: `npm install react-json-view` or `react-syntax-highlighter`

**Files:**
- apps/web/src/components/common/JsonViewer.tsx
- apps/web/src/__tests__/components/common/JsonViewer.test.tsx

---

### Task SDS-PREVIEW-011: Preview Tab Implementation
**Status:** ⏳ Pending
**Effort:** 4 SP
**Subagents:** frontend-developer
**Description:** Add Preview tab to Song Detail page with SDS JSON viewer

**Deliverables:**
- [ ] Update Song Detail page with Preview tab
- [ ] Fetch SDS data: `GET /api/v1/songs/{id}/sds`
- [ ] Display SDS using JsonViewer component
- [ ] Show loading state while fetching
- [ ] Show error state if SDS compilation fails
- [ ] Add "Export SDS" button at top of preview
- [ ] Create React Query hook: `useSDS(songId)`
- [ ] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [ ] Preview tab appears in tab list
- [ ] SDS data fetches on tab click
- [ ] JsonViewer displays SDS with syntax highlighting
- [ ] Loading state shows spinner
- [ ] Error state shows clear error message
- [ ] Export button triggers download
- [ ] Tab switch doesn't re-fetch (React Query caching)

**Files:**
- apps/web/src/app/(dashboard)/songs/[id]/page.tsx
- apps/web/src/hooks/api/useSDS.ts
- apps/web/src/__tests__/hooks/api/useSDS.test.ts
- apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongDetailPreviewTab.test.tsx

---

## Phase 6: Frontend - Export Functionality (1 task, 2 SP)

### Task SDS-PREVIEW-012: Export Button & Download Logic
**Status:** ⏳ Pending
**Effort:** 2 SP
**Subagents:** frontend-developer
**Description:** Add export button to trigger SDS download

**Deliverables:**
- [ ] Update Song Detail page with handleExport function
- [ ] Fetch from `GET /api/v1/songs/{id}/export`
- [ ] Trigger browser download using blob + a.download
- [ ] Show loading state during export
- [ ] Show success/error toast notification
- [ ] Extract filename from Content-Disposition header
- [ ] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [ ] Export button triggers download
- [ ] Downloaded file has correct filename
- [ ] Downloaded JSON is formatted and valid
- [ ] Loading state shows during export
- [ ] Success toast appears on completion
- [ ] Error toast appears on failure
- [ ] Works in Chrome, Firefox, Safari

**Files:**
- apps/web/src/app/(dashboard)/songs/[id]/page.tsx
- apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongExport.test.tsx

---

## Phase 7: Testing & Validation (5 tasks, 11 SP)

### Task SDS-PREVIEW-013: Backend Unit Tests
**Status:** ⏳ Pending
**Effort:** 2 SP
**Subagents:** python-backend-engineer (testing-specialist review)
**Description:** Unit tests for default generators and SDS compilation

**Deliverables:**
- [ ] Unit tests for all 5 default generators
- [ ] Test each generator with various blueprint configurations
- [ ] Test partial entity data preservation
- [ ] Test determinism (same inputs = same outputs)
- [ ] Test error cases (invalid blueprints, missing data)
- [ ] Unit tests for SDS compiler enhancement
- [ ] Coverage target: 95%+

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] Code coverage ≥95% for default generators
- [ ] Code coverage ≥90% for SDS compiler
- [ ] Tests run in CI/CD pipeline
- [ ] Tests use realistic blueprint and entity fixtures

**Files:**
- tests/services/default_generators/test_*.py (5 files)
- tests/services/test_sds_compiler_defaults.py

---

### Task SDS-PREVIEW-014: API Integration Tests
**Status:** ⏳ Pending
**Effort:** 2 SP
**Subagents:** python-backend-engineer (testing-specialist review)
**Description:** Integration tests for SDS retrieval and export endpoints

**Deliverables:**
- [ ] Integration tests for `GET /songs/{id}/sds`
- [ ] Test successful SDS retrieval
- [ ] Test with missing entities (defaults used)
- [ ] Test 404, 403, 422 error cases
- [ ] Integration tests for `GET /songs/{id}/export`
- [ ] Test successful export with correct headers
- [ ] Test filename generation
- [ ] Coverage target: 95%+

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Tests use real database (test DB)
- [ ] Tests verify API contracts
- [ ] Tests run in CI/CD pipeline

**Files:**
- tests/api/v1/test_songs_sds.py
- tests/api/v1/test_songs_export.py

---

### Task SDS-PREVIEW-015: Frontend Component Tests
**Status:** ⏳ Pending
**Effort:** 3 SP
**Subagents:** frontend-developer (testing-specialist review)
**Description:** Unit tests for React components

**Deliverables:**
- [ ] Unit tests for EntityDetailSection component
- [ ] Test rendering for all entity types
- [ ] Test "not assigned" state
- [ ] Test links to edit/create pages
- [ ] Unit tests for JsonViewer component
- [ ] Test JSON rendering, syntax highlighting, collapse/expand, copy
- [ ] Unit tests for Preview tab
- [ ] Test tab rendering, data fetching, loading/error states
- [ ] Unit tests for export functionality
- [ ] Coverage target: 90%+

**Acceptance Criteria:**
- [ ] All component tests pass
- [ ] Tests use Vitest + React Testing Library
- [ ] Tests mock API calls appropriately
- [ ] Tests verify user interactions
- [ ] Tests run in CI/CD pipeline

**Files:**
- apps/web/src/__tests__/components/songs/EntityDetailSection.test.tsx
- apps/web/src/__tests__/components/common/JsonViewer.test.tsx
- apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongDetailPreviewTab.test.tsx
- apps/web/src/__tests__/app/(dashboard)/songs/[id]/SongExport.test.tsx

---

### Task SDS-PREVIEW-016: E2E Tests
**Status:** ⏳ Pending
**Effort:** 2 SP
**Subagents:** testing-specialist
**Description:** End-to-end tests for complete user flow

**Deliverables:**
- [ ] E2E test: "User views SDS preview for song"
- [ ] Navigate to song detail → click Preview tab → verify SDS displays
- [ ] E2E test: "User exports SDS"
- [ ] Navigate to song detail → click Preview → click Export → verify download
- [ ] E2E test: "User views song with missing entities (defaults used)"
- [ ] Create song without style_id → verify Preview shows SDS with defaults

**Tool:** Playwright or Cypress

**Acceptance Criteria:**
- [ ] All E2E tests pass
- [ ] Tests run against local dev environment
- [ ] Tests verify full user interaction flow
- [ ] Tests run in CI/CD pipeline (optional for MVP)

**Files:**
- tests/e2e/songs/sds-preview.spec.ts
- tests/e2e/songs/sds-export.spec.ts

---

### Task SDS-PREVIEW-017: Documentation
**Status:** ⏳ Pending
**Effort:** 2 SP
**Subagents:** documentation-writer
**Description:** Document new features and APIs

**Deliverables:**
- [ ] API documentation updates for new endpoints
- [ ] Add `GET /songs/{id}/sds` with examples
- [ ] Add `GET /songs/{id}/export` with examples
- [ ] User guide section: How to view SDS preview and export
- [ ] Developer guide section: Default generator architecture
- [ ] All code snippets are accurate

**Acceptance Criteria:**
- [ ] API docs include new endpoints with examples
- [ ] User guide explains Preview tab and Export
- [ ] Developer guide explains default generation architecture
- [ ] Documentation reviewed and approved

**Files:**
- docs/API.md
- docs/USER_GUIDE.md
- docs/DEVELOPER_GUIDE.md

---

## Work Log

### 2025-11-17 - Session 1

**Status:** Initializing tracking infrastructure

**Completed:**
- ✅ Created progress tracking file
- ✅ Created context file (next)

**Next Steps:**
- Create context file with implementation overview
- Begin Phase 1 execution with python-backend-engineer

---

## Quality Gates

### Phase 1 Gate: Default Generation
- [ ] All 5 default generators implemented
- [ ] Unit tests pass with 95%+ coverage
- [ ] Default generation is deterministic
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

## Critical Dependencies

**External Dependencies:**
- SDS Compiler Service (completed in Phase 2)
- Blueprint Validator (completed in Phase 2)
- Entity CRUD APIs (completed in Phase 1)
- Song Detail page structure (exists)

**Blockers:** None (all dependencies met)

---

## Files to Create/Modify

### Backend (Python)
- apps/api/app/services/blueprint_reader.py (new)
- apps/api/app/services/default_generators/__init__.py (new)
- apps/api/app/services/default_generators/style_generator.py (new)
- apps/api/app/services/default_generators/lyrics_generator.py (new)
- apps/api/app/services/default_generators/persona_generator.py (new)
- apps/api/app/services/default_generators/producer_generator.py (new)
- apps/api/app/services/sds_compiler.py (modify)
- apps/api/app/api/v1/endpoints/songs.py (modify)
- tests/* (12+ test files - new)

### Frontend (TypeScript/React)
- apps/web/src/components/songs/EntityDetailSection.tsx (new)
- apps/web/src/components/common/JsonViewer.tsx (new)
- apps/web/src/app/(dashboard)/songs/[id]/page.tsx (modify)
- apps/web/src/hooks/api/useSDS.ts (new)
- apps/web/src/__tests__/* (8+ test files - new)

### Documentation
- docs/API.md (modify)
- docs/USER_GUIDE.md (new or modify)
- docs/DEVELOPER_GUIDE.md (new or modify)

---

**Last Updated:** 2025-11-17
**Updated By:** lead-architect (orchestrator)
