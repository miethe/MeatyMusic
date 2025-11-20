# Gap Analysis P2 Implementation - All Phases Progress

**Status**: IN PROGRESS
**Started**: 2025-11-20
**Last Updated**: 2025-11-20
**Completion**: 0% (0 of 42 story points)

## Phase Overview

| Phase | Title | Effort | Status | Completion |
|-------|-------|--------|--------|-----------|
| 1 | Admin RBAC System | 8 pts | NOT STARTED | 0% |
| 2 | Blueprint Markdown Parser | 10 pts | NOT STARTED | 0% |
| 3 | Bulk Operations API | 8 pts | NOT STARTED | 0% |
| 4 | Entity Export API | 5 pts | NOT STARTED | 0% |
| 5 | Frontend Auto-save | 5 pts | NOT STARTED | 0% |
| 6 | Frontend Bulk Operations | 3 pts | NOT STARTED | 0% |
| 7 | Frontend Entity Export | 3 pts | NOT STARTED | 0% |

---

## Phase 1: Admin RBAC System (8 pts)

**Assigned Subagent(s)**: backend-typescript-architect, data-layer-expert, python-backend-engineer

### Completion Checklist
- [ ] RBAC-001: Add role field to User model (1 pt)
      Assigned Subagent(s): data-layer-expert
- [ ] RBAC-002: Create role enum (user, admin) (1 pt)
      Assigned Subagent(s): python-backend-engineer
- [ ] RBAC-003: Create role dependency for protected routes (2 pts)
      Assigned Subagent(s): backend-typescript-architect
- [ ] RBAC-004: Apply admin-only protection to blueprint endpoints (2 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] RBAC-005: Update frontend auth context with role (1 pt)
      Assigned Subagent(s): frontend-developer
- [ ] RBAC-006: Add RBAC tests (1 pt)
      Assigned Subagent(s): python-backend-engineer

### Success Criteria
- [ ] User model has role field with enum values
- [ ] Blueprint endpoints protected with admin-only decorator
- [ ] Non-admin users receive 403 on blueprint access
- [ ] Frontend hides blueprint nav for non-admin users
- [ ] All RBAC tests passing

### Key Files
- `services/api/app/models/user.py`
- `services/api/app/core/auth.py`
- `services/api/app/api/v1/endpoints/blueprints.py`
- `apps/web/src/contexts/AuthContext.tsx`

---

## Phase 2: Blueprint Markdown Parser (10 pts)

**Assigned Subagent(s)**: python-backend-engineer, data-layer-expert

### Completion Checklist
- [ ] PARSER-001: Create blueprint markdown parser module (3 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] PARSER-002: Extract genre rules, tempo, sections from markdown (3 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] PARSER-003: Create blueprint seeder script (2 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] PARSER-004: Update skills to load from DB instead of hardcoded data (2 pts)
      Assigned Subagent(s): python-backend-engineer

### Success Criteria
- [ ] Parser extracts all blueprint sections from markdown
- [ ] Seeder populates database with all 15 genre blueprints
- [ ] Skills (PLAN, STYLE, VALIDATE) load blueprint data from DB
- [ ] All workflow tests passing with DB blueprints

### Key Files
- `services/api/app/utils/blueprint_parser.py` (new)
- `services/api/scripts/seed_blueprints.py` (new)
- `services/api/app/skills/plan.py`
- `services/api/app/skills/style.py`
- `services/api/app/skills/validate.py`
- `docs/hit_song_blueprint/AI/*.md` (source files)

---

## Phase 3: Bulk Operations API (8 pts)

**Assigned Subagent(s)**: python-backend-engineer, backend-architect

### Completion Checklist
- [ ] BULK-001: Create bulk delete endpoint for songs (2 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] BULK-002: Create bulk export endpoint (ZIP) for songs (3 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] BULK-003: Add bulk operations to all entity endpoints (2 pts)
      Assigned Subagent(s): python-backend-engineer
- [ ] BULK-004: Add bulk operation tests (1 pt)
      Assigned Subagent(s): python-backend-engineer

### Success Criteria
- [ ] Bulk delete accepts array of IDs and deletes all
- [ ] Bulk export creates ZIP with all selected entities as JSON
- [ ] All entity endpoints support bulk operations
- [ ] Proper error handling for partial failures
- [ ] All bulk operation tests passing

### Key Files
- `services/api/app/api/v1/endpoints/songs.py`
- `services/api/app/api/v1/endpoints/styles.py`
- `services/api/app/api/v1/endpoints/lyrics.py`
- `services/api/app/api/v1/endpoints/personas.py`
- `services/api/app/api/v1/endpoints/producer_notes.py`
- `services/api/app/services/bulk_operations_service.py` (new)

---

## Phase 4: Entity Export API (5 pts)

**Assigned Subagent(s)**: python-backend-engineer

### Completion Checklist
- [ ] EXPORT-001: Add export endpoint to styles (1 pt)
      Assigned Subagent(s): python-backend-engineer
- [ ] EXPORT-002: Add export endpoint to lyrics (1 pt)
      Assigned Subagent(s): python-backend-engineer
- [ ] EXPORT-003: Add export endpoint to personas (1 pt)
      Assigned Subagent(s): python-backend-engineer
- [ ] EXPORT-004: Add export endpoint to producer notes (1 pt)
      Assigned Subagent(s): python-backend-engineer
- [ ] EXPORT-005: Add export tests (1 pt)
      Assigned Subagent(s): python-backend-engineer

### Success Criteria
- [ ] All entities have GET /{id}/export endpoint
- [ ] Export returns JSON with proper Content-Disposition header
- [ ] Filename format: {entity-type}-{name}-{timestamp}.json
- [ ] All export tests passing

### Key Files
- `services/api/app/api/v1/endpoints/styles.py`
- `services/api/app/api/v1/endpoints/lyrics.py`
- `services/api/app/api/v1/endpoints/personas.py`
- `services/api/app/api/v1/endpoints/producer_notes.py`

---

## Phase 5: Frontend Auto-save (5 pts)

**Assigned Subagent(s)**: frontend-developer, ui-engineer-enhanced

### Completion Checklist
- [ ] AUTO-001: Create useAutoSave custom hook (2 pts)
      Assigned Subagent(s): frontend-developer
- [ ] AUTO-002: Integrate auto-save in song creation wizard (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced
- [ ] AUTO-003: Integrate auto-save in all entity forms (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced
- [ ] AUTO-004: Add auto-save indicator UI (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced

### Success Criteria
- [ ] Form data saved to localStorage every 30 seconds
- [ ] Auto-saved data restored on page refresh
- [ ] Auto-save indicator shows "Saved" / "Saving..." status
- [ ] localStorage cleared after successful submit
- [ ] All auto-save tests passing

### Key Files
- `apps/web/src/hooks/useAutoSave.ts` (new)
- `apps/web/src/app/(dashboard)/songs/new/page.tsx`
- `apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/lyrics/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/[id]/page.tsx`

---

## Phase 6: Frontend Bulk Operations (3 pts)

**Assigned Subagent(s)**: frontend-developer, ui-engineer-enhanced

### Completion Checklist
- [ ] BULK-UI-001: Add multi-select checkboxes to entity lists (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced
- [ ] BULK-UI-002: Add bulk action toolbar (Delete, Export) (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced
- [ ] BULK-UI-003: Add confirmation dialog for bulk delete (1 pt)
      Assigned Subagent(s): frontend-developer

### Success Criteria
- [ ] Users can select multiple items with checkboxes
- [ ] Bulk action toolbar appears when items selected
- [ ] Bulk delete shows confirmation with item count
- [ ] Bulk export downloads ZIP file
- [ ] All bulk operation UI tests passing

### Key Files
- `apps/web/src/app/(dashboard)/songs/page.tsx`
- `apps/web/src/app/(dashboard)/entities/styles/page.tsx`
- `apps/web/src/components/BulkActionToolbar.tsx` (new)

---

## Phase 7: Frontend Entity Export (3 pts)

**Assigned Subagent(s)**: frontend-developer, ui-engineer-enhanced

### Completion Checklist
- [ ] EXPORT-UI-001: Add export button to entity detail pages (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced
- [ ] EXPORT-UI-002: Add export option to entity list actions (1 pt)
      Assigned Subagent(s): ui-engineer-enhanced
- [ ] EXPORT-UI-003: Handle export download and errors (1 pt)
      Assigned Subagent(s): frontend-developer

### Success Criteria
- [ ] Export button visible on all entity detail pages
- [ ] Export action available in entity list dropdown
- [ ] File downloads with correct filename format
- [ ] Error handling for failed exports
- [ ] All export UI tests passing

### Key Files
- `apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/lyrics/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/producer-notes/[id]/page.tsx`

---

## Work Log

### 2025-11-20 - Session 1

**Completed:**
- Created progress tracking structure

**Next Steps:**
- Begin Phase 1: Admin RBAC implementation

---

## Decisions Log

- **[2025-11-20]** Using simple role enum (user, admin) for MVP, defer complex RBAC to future phase
- **[2025-11-20]** Blueprint parser will handle markdown format variations gracefully
- **[2025-11-20]** Auto-save interval set to 30 seconds as reasonable default

---

## Files to Create

### Backend (New)
- `services/api/app/utils/blueprint_parser.py` - Markdown parser
- `services/api/scripts/seed_blueprints.py` - Seeder script
- `services/api/app/services/bulk_operations_service.py` - Bulk ops service

### Frontend (New)
- `apps/web/src/hooks/useAutoSave.ts` - Auto-save hook
- `apps/web/src/components/BulkActionToolbar.tsx` - Bulk action UI

### Files to Modify
- `services/api/app/models/user.py` - Add role field
- `services/api/app/core/auth.py` - Add role dependency
- `services/api/app/api/v1/endpoints/blueprints.py` - Add admin protection
- `services/api/app/api/v1/endpoints/*.py` - Add bulk and export endpoints
- `services/api/app/skills/*.py` - Load blueprints from DB
- `apps/web/src/contexts/AuthContext.tsx` - Add role to context
- `apps/web/src/app/(dashboard)/**/page.tsx` - Add auto-save, bulk ops, export
