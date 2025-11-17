# MVP SDS Generation & Preview - Working Context

**Purpose:** Token-efficient context for resuming work across AI turns and subagent coordination

---

## Current State

**Branch:** claude/mvp-sds-generation-preview-01SjhmKGF1Y6hji7taGFC11g
**Last Commit:** 0ac59c6 (fix: resolve database and security context errors in song endpoints)
**Current Phase:** Phase 0 - Initialization
**Current Task:** Setting up tracking infrastructure

---

## Phase Scope Overview

This implementation adds SDS preview and export capabilities to the web interface:

1. **Backend (Phases 1-3)**: Default generators for incomplete entities + SDS retrieval/export APIs
2. **Frontend (Phases 4-6)**: Preview tab with JSON viewer + entity detail sections + export button
3. **Testing (Phase 7)**: Comprehensive unit, integration, and E2E tests + documentation

**Success Metric:** Users can view and export SDS JSON even when entities are incomplete (using blueprint-based defaults)

---

## Key Architecture Decisions

### Backend Default Generation Strategy
- **Blueprint-Based:** All defaults derived from genre blueprint rules
- **Deterministic:** Same blueprint + partial data → same defaults (no randomness)
- **Layered:** Blueprint Reader → Default Generators → SDS Compiler → API
- **Optional:** `use_defaults` parameter allows disabling default generation

### Frontend Component Strategy
- **Reusable JsonViewer:** Generic component for syntax-highlighted JSON display
- **Entity Sections:** Card-based grid layout showing 3-5 key properties per entity
- **React Query:** SDS data fetching with automatic caching
- **Download Pattern:** Blob API + a.download for cross-browser compatibility

### Testing Strategy
- **Backend:** 95%+ coverage on generators and compiler, 95%+ on APIs
- **Frontend:** 90%+ coverage on components, mock API calls
- **E2E:** Playwright/Cypress for complete user flows

---

## Important Technical Constraints

### Blueprint Loading
- Blueprints located at: `docs/hit_song_blueprint/AI/{genre}_blueprint.md`
- Must implement caching (in-memory or Redis) to avoid repeated file reads
- Validate blueprint JSON on startup or first access

### Default Generation Rules
- **Style:** Use blueprint tempo range, default key "C major", genre-specific mood
- **Lyrics:** Standard section order (Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro), AABB rhyme
- **Persona:** Return None if not needed (most common), genre-specific vocal range
- **Producer Notes:** Derive structure from lyrics section_order, sensible section_meta

### API Response Headers (Export)
```
Content-Type: application/json; charset=utf-8
Content-Disposition: attachment; filename="{title}_sds_{timestamp}.json"
```

### Frontend JSON Viewer Styling
- Keys: Purple/blue (#8b5cf6)
- Strings: Green (#22c55e)
- Numbers: Orange (#f97316)
- Booleans: Yellow (#eab308)
- Null: Gray (#6b7280)
- Background: Dark panel (#1a1a2e)

---

## MeatyMusic Architecture Patterns

### Backend (Python/FastAPI)
- **Layered:** router → service → repository → DB
- **DTOs:** Separate schemas from ORM models (app/schemas vs app/models)
- **Error Handling:** ErrorResponse envelope for all errors
- **Pagination:** Cursor pagination for lists
- **Telemetry:** Structured JSON logs with trace_id, span_id

### Frontend (Next.js/React)
- **UI Components:** Import from @meaty/ui only (no direct Radix)
- **Data Fetching:** React Query for server state
- **Error Handling:** Error boundaries around components
- **Accessibility:** WCAG 2.1 AA compliance, keyboard nav, ARIA labels
- **Responsive:** Mobile-first, 2-col desktop → 1-col mobile

---

## Quick Reference

### Run Backend Tests
```bash
# All tests
uv run --project apps/api pytest

# Specific test file
uv run --project apps/api pytest app/tests/services/test_blueprint_reader.py -v

# With coverage
uv run --project apps/api pytest --cov=app --cov-report=html
```

### Run Frontend Tests
```bash
# All tests
pnpm --filter "./apps/web" test

# Specific pattern
pnpm --filter "./apps/web" test -- --testPathPattern="JsonViewer"

# With coverage
pnpm --filter "./apps/web" test -- --coverage
```

### Run Development Servers
```bash
# API
cd apps/api && uv run uvicorn app.main:app --reload

# Web
pnpm --filter "./apps/web" dev
```

---

## Key Files by Phase

### Phase 1 (Backend - Default Generators)
- `apps/api/app/services/blueprint_reader.py` - Blueprint file reader
- `apps/api/app/services/default_generators/style_generator.py` - Style defaults
- `apps/api/app/services/default_generators/lyrics_generator.py` - Lyrics defaults
- `apps/api/app/services/default_generators/persona_generator.py` - Persona defaults
- `apps/api/app/services/default_generators/producer_generator.py` - Producer defaults

### Phase 2 (Backend - SDS Enhancement)
- `apps/api/app/services/sds_compiler.py` - Integration point for defaults

### Phase 3 (API Endpoints)
- `apps/api/app/api/v1/endpoints/songs.py` - Add `/sds` and `/export` routes

### Phases 4-6 (Frontend)
- `apps/web/src/components/songs/EntityDetailSection.tsx` - Entity cards
- `apps/web/src/components/common/JsonViewer.tsx` - JSON viewer
- `apps/web/src/app/(dashboard)/songs/[id]/page.tsx` - Preview tab integration
- `apps/web/src/hooks/api/useSDS.ts` - React Query hook

### Phase 7 (Testing)
- `tests/services/default_generators/test_*.py` - Backend unit tests
- `tests/api/v1/test_songs_sds.py` - API integration tests
- `apps/web/src/__tests__/**/*.test.tsx` - Frontend component tests
- `tests/e2e/songs/sds-preview.spec.ts` - E2E tests

---

## Common Gotchas

### Blueprint Caching
**Issue:** Re-reading blueprint files on every SDS compilation is slow
**Solution:** Implement in-memory cache with TTL or Redis caching
**Pattern:** Singleton service with lazy-loaded blueprints dict

### Determinism in Default Generation
**Issue:** Non-deterministic defaults break reproducibility
**Solution:** No random values, always use blueprint rules or hardcoded defaults
**Test:** Verify `generate_default_X(blueprint, partial) == generate_default_X(blueprint, partial)` for all generators

### React Query Caching vs Freshness
**Issue:** SDS might be stale if entities updated
**Solution:** Use `staleTime` and `cacheTime` appropriately, or invalidate on entity mutations
**Pattern:** Invalidate `songs/${id}/sds` query when any entity is updated

### Export Filename Extraction
**Issue:** Content-Disposition header parsing is browser-specific
**Solution:** Use regex to extract filename: `filename=([^;]+)` or fallback to `sds_{songId}.json`
**Test:** Verify in Chrome, Firefox, Safari

---

## Dependencies & Prerequisites

### Completed (Available Now)
- ✅ Database models: Song, Style, Lyrics, Persona, ProducerNotes, Blueprint
- ✅ Repository layer with RLS
- ✅ SDS Compiler Service (base implementation)
- ✅ Song Detail page with tabs structure
- ✅ Entity CRUD APIs

### External Libraries (Frontend)
- Need to install: `react-json-view` or `react-syntax-highlighter` (Phase 5)
- Already available: `react-query`, `@meaty/ui`, toast library

### Blueprint Files
- Location: `docs/hit_song_blueprint/AI/`
- Genres: pop, country, hip-hop, rock, r&b, electronic, indie, christmas, ccm, kpop, latin, afrobeats, hyperpop, pop-punk
- Format: Markdown with structured sections (rules, rubric, examples)

---

## Subagent Coordination Strategy

### Sequential Phases (1 → 2 → 3 → 4-6 parallel → 7)
- **Phase 1-3:** Backend work must complete before frontend (API contracts needed)
- **Phase 4-6:** Frontend tasks can run in parallel once API available
- **Phase 7:** Testing can overlap with late-stage frontend work

### Subagent Assignments
- **python-backend-engineer:** Phases 1-3 (all backend work)
- **backend-architect:** Review Phase 1 Task 001, Phase 2 Task 006
- **ui-engineer-enhanced:** Phase 4 Task 009 (entity sections)
- **frontend-developer:** Phases 4-6 (all other frontend work)
- **testing-specialist:** Phase 7 coordination and E2E tests
- **documentation-writer:** Phase 7 Task 017 (all documentation)

### Handoff Points
1. After Phase 1: Backend architect reviews default generation architecture
2. After Phase 3: Frontend can begin with API contracts defined
3. After Phase 6: Testing specialist runs comprehensive E2E tests
4. After all phases: Documentation writer creates final docs

---

## Success Criteria Checklist

### Functional
- [ ] SDS preview works for 100% of songs (with defaults if needed)
- [ ] Export success rate ≥99%
- [ ] SDS compilation latency P95 ≤2s
- [ ] Default generation is deterministic (99%+ identical across runs)

### Quality
- [ ] Backend unit test coverage ≥95%
- [ ] Frontend unit test coverage ≥90%
- [ ] Integration test coverage ≥95%
- [ ] E2E test pass rate 100%
- [ ] Zero high-severity bugs

### UX
- [ ] Preview tab loads in <2s (P95)
- [ ] JSON viewer renders large SDS (<5000 lines) in <1s
- [ ] Export completes in <1s (P95)
- [ ] Zero user-reported errors in first week

---

## Next Steps (Current Session)

1. Begin Phase 1 Task 001: Blueprint Reader Service
   - Delegate to python-backend-engineer
   - Ensure caching strategy is defined
   - Review with backend-architect

2. After Task 001 complete:
   - Continue with Tasks 002-005 (default generators) in sequence
   - Each generator builds on blueprint reader
   - Maintain 95%+ test coverage throughout

3. Phase gate check after Phase 1:
   - All 5 generators functional and tested
   - Determinism verified
   - Blueprint reader robust

---

**Last Updated:** 2025-11-17
**Session:** 1
**Next Review:** After Phase 1 completion
