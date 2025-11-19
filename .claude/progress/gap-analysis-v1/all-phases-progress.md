# All-Phases Progress: MeatyMusic Gap Analysis Implementation

**Status**: IN PROGRESS
**Last Updated**: 2025-11-19
**Branch**: claude/execute-gap-analysis-01BcVuD2AqnXSUL5Dcj5gzWY
**Source**: docs/IMPLEMENTATION_GAP_ANALYSIS.md

## Overview

Implementing critical gaps identified in MeatyMusic gap analysis to achieve MVP readiness. Tasks organized by priority (P0-P3) and executed in parallel where possible.

## Phase Overview

| Phase | Priority | Title | Effort | Status | Completion |
|-------|----------|-------|--------|--------|-----------|
| 1 | P0 | Blueprint Seeder & Parser | 13 pts | ✅ COMPLETE | 100% |
| 2 | P0 | MCP Server Integration | 13 pts | NOT STARTED | 0% |
| 3 | P0 | Frontend Form Enhancements | 21 pts | NOT STARTED | 0% |
| 4 | P0 | Import Feature Completion | 13 pts | NOT STARTED | 0% |
| 5 | P0 | Dark Mode Design System | 21 pts | NOT STARTED | 0% |
| 6 | P1 | Frontend Filters & Search | 13 pts | NOT STARTED | 0% |
| 7 | P1 | SDS Preview Enhancement | 5 pts | NOT STARTED | 0% |
| 8 | P1 | Workflow Visualization | 13 pts | NOT STARTED | 0% |
| 9 | P1 | Determinism Tests | 8 pts | NOT STARTED | 0% |
| 10 | P1 | Profanity Filter Completion | 5 pts | NOT STARTED | 0% |
| 11 | P2 | Admin RBAC | 8 pts | NOT STARTED | 0% |
| 12 | P2 | Bulk Operations | 8 pts | NOT STARTED | 0% |
| 13 | P2 | Auto-save & Entity Export | 8 pts | NOT STARTED | 0% |
| 14 | P3 | Render Job Entity | 13 pts | NOT STARTED | 0% |
| 15 | P3 | Feature Flag UI & Polish | 13 pts | NOT STARTED | 0% |

**Total Effort**: 175 story points

---

## Phase 1: Blueprint Seeder & Parser (P0)

**Priority**: P0 - Blocking MVP
**Effort**: 13 pts
**Status**: ✅ COMPLETE
**Assigned Subagent(s)**: python-backend-engineer

### Completion Checklist

- [x] BP-001: Create Blueprint Markdown Parser (5 pts)
      Parse /docs/hit_song_blueprint/AI/*.md files
      Extract: genre rules, tempo ranges, section requirements, lexicon, rubric weights
      Assigned Subagent(s): python-backend-engineer
      **Completed**: services/api/app/services/blueprint_parser_service.py (489 lines)

- [x] BP-002: Create Blueprint Seeder Script (5 pts)
      Populate blueprints table from parsed markdown
      Handle all 15 genre blueprints
      Assigned Subagent(s): python-backend-engineer
      **Completed**: services/api/scripts/seed_blueprints.py (349 lines, idempotent)

- [x] BP-003: Update Skills to Use DB Blueprints (3 pts)
      Modify PLAN, STYLE, VALIDATE skills
      Remove hardcoded blueprint data
      Add DB lookups via BlueprintService
      Assigned Subagent(s): python-backend-engineer
      **Completed**: Updated plan.py, style.py, validate.py

### Success Criteria

- [x] All 15 genre blueprints loaded in database
- [x] Markdown parser handles all blueprint sections
- [x] Skills load blueprint data from DB, not hardcoded
- [x] Seeder script is idempotent and can be re-run

### Key Files

- Services: `services/api/app/services/blueprint_parser_service.py` (new)
- Scripts: `services/api/scripts/seed_blueprints.py` (new)
- Skills: `services/api/app/skills/plan.py`, `style.py`, `validate.py`
- Blueprints: `docs/hit_song_blueprint/AI/*.md` (source)

---

## Phase 2: MCP Server Integration (P0)

**Priority**: P0 - Blocking MVP
**Effort**: 13 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: backend-architect, python-backend-engineer

### Completion Checklist

- [ ] MCP-001: Create MCP Client Wrapper Service (5 pts)
      Implement basic MCP client
      Support search and get_context tools
      Assigned Subagent(s): backend-architect, python-backend-engineer

- [ ] MCP-002: Integrate MCP in LYRICS Skill (5 pts)
      Add RAG retrieval with chunk hash tracking
      Implement pinned retrieval for determinism
      Assigned Subagent(s): python-backend-engineer

- [ ] MCP-003: Add Scope Validation (3 pts)
      Validate source scopes against MCP server
      Track provenance hashes
      Assigned Subagent(s): python-backend-engineer

### Success Criteria

- [ ] MCP client can call search and get_context tools
- [ ] LYRICS skill uses MCP for RAG retrieval
- [ ] Chunk hashes tracked for determinism
- [ ] Scope validation enforced

### Key Files

- Services: `services/api/app/services/mcp_client_service.py` (new)
- Skills: `services/api/app/skills/lyrics.py`
- Models: `services/api/app/models/source.py`

---

## Phase 3: Frontend Form Enhancements (P0)

**Priority**: P0 - Blocking MVP
**Effort**: 21 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: ui-engineer-enhanced, frontend-developer

### Completion Checklist

- [ ] FORM-001: Create Multi-Select Chip Component (8 pts)
      Reusable chip selector for mood, tags, instrumentation, delivery
      Add/remove chips, visual states
      Assigned Subagent(s): ui-engineer-enhanced

- [ ] FORM-002: Lyrics Multi-Section Editor (8 pts)
      Collapsible panels for each section
      Section reordering
      Assigned Subagent(s): ui-engineer-enhanced, frontend-developer

- [ ] FORM-003: Producer Notes Per-Section Editor (5 pts)
      Section structure with tags/duration
      Structure template dropdown (ABAB, ABABCBB, etc.)
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] Multi-select chip component in @meaty/ui package
- [ ] Chip selector integrated in Style, Lyrics, Persona, Producer Notes forms
- [ ] Lyrics editor has collapsible section panels
- [ ] Producer notes has per-section editor with templates

### Key Files

- Components: `packages/ui/src/components/chip-selector.tsx` (new)
- Forms: `apps/web/src/app/(dashboard)/entities/lyrics/[id]/edit/page.tsx`
- Forms: `apps/web/src/app/(dashboard)/entities/producer-notes/[id]/edit/page.tsx`

---

## Phase 4: Import Feature Completion (P0)

**Priority**: P0 - Blocking MVP
**Effort**: 13 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: python-backend-engineer, frontend-developer

### Completion Checklist

- [ ] IMP-001: Add Import Endpoints (8 pts)
      POST /lyrics/import
      POST /personas/import
      POST /producer_notes/import
      POST /blueprints/import
      POST /sources/import
      Assigned Subagent(s): python-backend-engineer

- [ ] IMP-002: Add Import UI for All Entities (5 pts)
      File upload UI (reuse Styles pattern)
      Client-side validation
      Import preview modal
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] All entities have import endpoints
- [ ] Import UI follows Styles pattern
- [ ] Import preview shows validation before confirming
- [ ] Server-side schema validation enforced

### Key Files

- API: `services/api/app/api/v1/endpoints/lyrics.py` (add import)
- API: `services/api/app/api/v1/endpoints/personas.py` (add import)
- API: `services/api/app/api/v1/endpoints/producer_notes.py` (add import)
- API: `services/api/app/api/v1/endpoints/blueprints.py` (add import)
- API: `services/api/app/api/v1/endpoints/sources.py` (add import)
- UI: `apps/web/src/app/(dashboard)/entities/*/import/` (new pages)

---

## Phase 5: Dark Mode Design System (P0)

**Priority**: P0 - Blocking MVP
**Effort**: 21 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: ui-designer, ui-engineer-enhanced

### Completion Checklist

- [ ] DS-001: Implement Design Token System (8 pts)
      Full color system per PRD spec
      8-level typography hierarchy
      4px base spacing scale
      5-level elevation/shadow system
      Motion system with duration tokens
      Assigned Subagent(s): ui-designer, ui-engineer-enhanced

- [ ] DS-002: Create Component Variants (8 pts)
      Button: Primary, Secondary, Ghost, Outline
      Card: Default, Elevated, Gradient
      Input: Full form library
      Assigned Subagent(s): ui-engineer-enhanced

- [ ] DS-003: Apply Design System to Entity Pages (5 pts)
      Update all CRUD pages with new components
      Apply typography and spacing
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] Design tokens defined in CSS variables
- [ ] All component variants implemented
- [ ] Entity pages styled per PRD spec
- [ ] Dark mode fully functional

### Key Files

- Tokens: `packages/ui/src/styles/tokens.css` (new)
- Components: `packages/ui/src/components/button.tsx` (update)
- Components: `packages/ui/src/components/card.tsx` (update)
- Components: `packages/ui/src/components/input.tsx` (update)
- Pages: `apps/web/src/app/(dashboard)/entities/**/*.tsx` (update)

---

## Phase 6: Frontend Filters & Search (P1)

**Priority**: P1 - Critical for MVP
**Effort**: 13 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: frontend-developer, ui-engineer-enhanced

### Completion Checklist

- [ ] FILT-001: Implement Filter UI Components (8 pts)
      Genre, mood, date range, language filters
      Multi-select dropdowns
      Clear all filters button
      Assigned Subagent(s): ui-engineer-enhanced

- [ ] FILT-002: Add Fuzzy Search for Songs (3 pts)
      Search by title with fuzzy matching
      Search debouncing
      Assigned Subagent(s): frontend-developer

- [ ] FILT-003: Add Sorting Controls (2 pts)
      Sort by created_at, updated_at, title
      Ascending/descending toggle
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] All entity libraries have functional filters
- [ ] Fuzzy search works for song titles
- [ ] Sorting controls in all list pages
- [ ] Filters persist in URL params

### Key Files

- Components: `apps/web/src/components/filters/*.tsx` (new)
- Pages: `apps/web/src/app/(dashboard)/songs/page.tsx` (update)
- Pages: `apps/web/src/app/(dashboard)/entities/*/page.tsx` (update)

---

## Phase 7: SDS Preview Enhancement (P1)

**Priority**: P1 - Critical for MVP
**Effort**: 5 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: frontend-developer

### Completion Checklist

- [ ] SDS-001: Add Syntax Highlighting (2 pts)
      Use syntax highlighter for JSON
      Assigned Subagent(s): frontend-developer

- [ ] SDS-002: Add Copy/Download Buttons (2 pts)
      Copy to clipboard
      Download as JSON file
      Assigned Subagent(s): frontend-developer

- [ ] SDS-003: Add Character Counter (1 pt)
      Show character count for composed prompt
      Visual indicator near engine limits
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] JSON preview has syntax highlighting
- [ ] Copy to clipboard works
- [ ] Download button generates JSON file
- [ ] Character counter shows engine limits

### Key Files

- Components: `apps/web/src/components/sds-preview.tsx` (new)
- Pages: `apps/web/src/app/(dashboard)/songs/[id]/page.tsx` (update)

---

## Phase 8: Workflow Visualization (P1)

**Priority**: P1 - Critical for MVP
**Effort**: 13 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: frontend-developer, ui-designer

### Completion Checklist

- [ ] VIZ-001: Create Progress Bar Component (3 pts)
      Visual progress indicator
      Show current node
      Assigned Subagent(s): ui-engineer-enhanced

- [ ] VIZ-002: Create DAG Visualization (8 pts)
      Node diagram showing workflow steps
      Dependency arrows
      Node status colors
      Assigned Subagent(s): frontend-developer, ui-designer

- [ ] VIZ-003: Create Metrics Display Cards (2 pts)
      Visual score indicators (gauges, bars)
      Metrics cards with icons
      Assigned Subagent(s): ui-engineer-enhanced

### Success Criteria

- [ ] Progress bar shows workflow progress
- [ ] DAG diagram visualizes workflow steps
- [ ] Metrics have visual indicators
- [ ] Workflow page shows real-time updates via WebSocket

### Key Files

- Components: `apps/web/src/components/workflow-progress.tsx` (new)
- Components: `apps/web/src/components/workflow-dag.tsx` (new)
- Components: `apps/web/src/components/metrics-card.tsx` (new)
- Pages: `apps/web/src/app/workflows/[id]/page.tsx` (update)

---

## Phase 9: Determinism Tests (P1)

**Priority**: P1 - Critical for MVP
**Effort**: 8 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: python-backend-engineer, testing specialist

### Completion Checklist

- [ ] DET-001: Create Synthetic Test Set (3 pts)
      Generate 200-song test dataset
      Cover all genres
      Assigned Subagent(s): python-backend-engineer

- [ ] DET-002: Implement Reproducibility Tests (3 pts)
      Same SDS + seed = same output
      Run 10x per song, validate identical
      Assigned Subagent(s): python-backend-engineer

- [ ] DET-003: Create Rubric Pass Rate Tests (2 pts)
      Validate ≥95% pass rate on test set
      Track metrics per genre
      Assigned Subagent(s): python-backend-engineer

### Success Criteria

- [ ] 200-song synthetic test set created
- [ ] Reproducibility ≥99% (same seed = same output)
- [ ] Rubric pass rate ≥95%
- [ ] Automated test suite runs in CI

### Key Files

- Tests: `services/api/tests/test_determinism.py` (new)
- Tests: `services/api/tests/test_rubric_pass_rate.py` (new)
- Fixtures: `services/api/tests/fixtures/synthetic_songs.json` (new)

---

## Phase 10: Profanity Filter Completion (P1)

**Priority**: P1 - Critical for MVP
**Effort**: 5 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: python-backend-engineer

### Completion Checklist

- [ ] PROF-001: Complete Profanity Word Lists (3 pts)
      Expand word lists for all supported languages
      Add severity ratings
      Assigned Subagent(s): python-backend-engineer

- [ ] PROF-002: Enhance Profanity Filter Logic (2 pts)
      Context-aware filtering
      Respect constraints.explicit setting
      Assigned Subagent(s): python-backend-engineer

### Success Criteria

- [ ] Profanity word lists comprehensive
- [ ] Filter respects explicit constraints
- [ ] Context-aware filtering implemented
- [ ] Tests cover edge cases

### Key Files

- Services: `services/api/app/services/profanity_filter_service.py` (update)
- Data: `services/api/app/data/profanity_lists/*.txt` (new)
- Skills: `services/api/app/skills/lyrics.py` (update)

---

## Phase 11: Admin RBAC (P2)

**Priority**: P2 - Important for MVP
**Effort**: 8 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: backend-architect, python-backend-engineer

### Completion Checklist

- [ ] RBAC-001: Implement Role System (5 pts)
      User roles: admin, user
      Role-based permissions
      Assigned Subagent(s): backend-architect, python-backend-engineer

- [ ] RBAC-002: Protect Admin Routes (3 pts)
      Blueprints admin-only
      Middleware for role checks
      Assigned Subagent(s): python-backend-engineer

### Success Criteria

- [ ] Role system implemented
- [ ] Admin-only routes protected
- [ ] Non-admin users cannot access blueprints
- [ ] Frontend hides admin UI for non-admin users

### Key Files

- Models: `services/api/app/models/user.py` (add role field)
- Middleware: `services/api/app/middleware/rbac.py` (new)
- API: `services/api/app/api/v1/endpoints/blueprints.py` (protect)

---

## Phase 12: Bulk Operations (P2)

**Priority**: P2 - Important for MVP
**Effort**: 8 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: python-backend-engineer, frontend-developer

### Completion Checklist

- [ ] BULK-001: Add Bulk Export Endpoint (3 pts)
      POST /songs/export (multiple IDs)
      Generate ZIP file
      Assigned Subagent(s): python-backend-engineer

- [ ] BULK-002: Add Bulk Delete Endpoint (3 pts)
      DELETE /songs (multiple IDs)
      Confirmation required
      Assigned Subagent(s): python-backend-engineer

- [ ] BULK-003: Add Bulk UI Controls (2 pts)
      Checkbox selection in list pages
      Bulk action buttons
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] Bulk export generates ZIP
- [ ] Bulk delete with confirmation
- [ ] UI supports multi-select
- [ ] Works for all entity types

### Key Files

- API: `services/api/app/api/v1/endpoints/songs.py` (add bulk ops)
- UI: `apps/web/src/components/bulk-actions.tsx` (new)

---

## Phase 13: Auto-save & Entity Export (P2)

**Priority**: P2 - Important for MVP
**Effort**: 8 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: frontend-developer

### Completion Checklist

- [ ] AUTO-001: Implement Auto-save (5 pts)
      Local storage recovery for forms
      Periodic auto-save (every 30s)
      Restore on page reload
      Assigned Subagent(s): frontend-developer

- [ ] AUTO-002: Add Entity Export (3 pts)
      Export individual entities as JSON
      Download button in detail pages
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] Forms auto-save to local storage
- [ ] Users can recover unsaved work
- [ ] Individual entities can be exported
- [ ] Export filename follows naming convention

### Key Files

- Hooks: `apps/web/src/hooks/use-auto-save.ts` (new)
- Components: `apps/web/src/components/export-button.tsx` (new)

---

## Phase 14: Render Job Entity (P3)

**Priority**: P3 - Nice to Have
**Effort**: 13 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: data-layer-expert, python-backend-engineer, frontend-developer

### Completion Checklist

- [ ] REND-001: Create RenderJob Model (3 pts)
      Database model, migration
      Assigned Subagent(s): data-layer-expert

- [ ] REND-002: Add Render Job API (5 pts)
      CRUD endpoints, status tracking
      Assigned Subagent(s): python-backend-engineer

- [ ] REND-003: Add Render Job UI (5 pts)
      Job tracking page, status display
      Assigned Subagent(s): frontend-developer

### Success Criteria

- [ ] RenderJob model in database
- [ ] API supports job tracking
- [ ] UI shows render job status
- [ ] Webhook support for callbacks

### Key Files

- Models: `services/api/app/models/render_job.py` (new)
- API: `services/api/app/api/v1/endpoints/render_jobs.py` (new)
- UI: `apps/web/src/app/render-jobs/page.tsx` (new)

---

## Phase 15: Feature Flag UI & Polish (P3)

**Priority**: P3 - Nice to Have
**Effort**: 13 pts
**Status**: NOT STARTED
**Assigned Subagent(s)**: frontend-developer, ui-engineer-enhanced

### Completion Checklist

- [ ] FF-001: Create Feature Flag Service (3 pts)
      Centralized feature flag management
      Assigned Subagent(s): python-backend-engineer

- [ ] FF-002: Add Feature Flag Settings UI (3 pts)
      Settings page to toggle flags
      Assigned Subagent(s): frontend-developer

- [ ] FF-003: Add Skeleton Loaders (3 pts)
      Loading states for all pages
      Assigned Subagent(s): ui-engineer-enhanced

- [ ] FF-004: Add Empty State Illustrations (2 pts)
      Polished empty states for all lists
      Assigned Subagent(s): ui-designer

- [ ] FF-005: Complete Living Artist DB (2 pts)
      Database of living artists for policy enforcement
      Assigned Subagent(s): python-backend-engineer

### Success Criteria

- [ ] Feature flags can be toggled in UI
- [ ] Skeleton loaders on all pages
- [ ] Empty states have illustrations
- [ ] Living artist DB enforces policy

### Key Files

- Services: `services/api/app/services/feature_flag_service.py` (new)
- UI: `apps/web/src/app/settings/feature-flags/page.tsx` (new)
- Components: `packages/ui/src/components/skeleton.tsx` (new)
- Components: `packages/ui/src/components/empty-state.tsx` (new)

---

## Work Log

### 2025-11-19 - Session 1

**Status**: P0 Implementation In Progress
**Current Phase**: Phase 1 Complete, Starting Phases 2-5

**Completed:**
- ✅ Created tracking directories
- ✅ Created all-phases-progress.md with full task breakdown
- ✅ Created all-phases-context.md with implementation guidance
- ✅ **Phase 1: Blueprint Seeder & Parser (13 pts)**
  - Created blueprint_parser_service.py (489 lines)
  - Created seed_blueprints.py script (349 lines, idempotent)
  - Updated plan.py, style.py, validate.py to use DB blueprints
  - Added comprehensive tests
  - All 3 tasks complete, all success criteria met

**Subagents Used:**
- @python-backend-engineer - Blueprint parser, seeder, skills updates

**Files Created (Phase 1):**
- services/api/app/services/blueprint_parser_service.py
- services/api/scripts/seed_blueprints.py
- services/api/tests/test_blueprint_parser.py
- services/api/scripts/test_parser.py

**Files Modified (Phase 1):**
- services/api/app/skills/plan.py
- services/api/app/skills/style.py
- services/api/app/skills/validate.py

**Next Steps:**
- Commit Phase 1 implementation
- Start Phase 2 (MCP Integration) and Phase 3 (Frontend Forms) in parallel
- Continue with remaining P0 tasks
