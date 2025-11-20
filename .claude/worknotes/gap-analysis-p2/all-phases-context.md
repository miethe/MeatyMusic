# Gap Analysis P2 - Working Context

**Purpose**: Token-efficient context for P2 implementation tasks

---

## Current State

**Branch**: claude/execute-gap-analysis-p2-01GuRFjRSJbh3EzdWwjhCxwU
**Current Task**: Phase 1 - Admin RBAC System
**Status**: Starting implementation

---

## Key Decisions

- **Architecture**: Following MP layered architecture (routers → services → repositories → DB)
- **RBAC Approach**: Simple role enum (user, admin) for MVP - defer complex RBAC to future
- **Blueprint Parser**: Will handle markdown format variations gracefully with error handling
- **Auto-save Interval**: 30 seconds as reasonable default for form data
- **Bulk Operations**: Use ZIP format for multi-file exports, JSON array for metadata

---

## Important Learnings

- **Blueprint Loading**: Skills currently use hardcoded data - need DB integration
- **Entity Import**: Only Styles has import feature - need to replicate pattern for others
- **Frontend Forms**: Need consistent auto-save pattern across all entity forms

---

## Quick Reference

### Environment Setup
```bash
# API
export PYTHONPATH="$PWD/services/api"
cd services/api && uv run pytest

# Web
pnpm --filter "./apps/web" dev

# Tests
pnpm --filter "./apps/web" test
```

### Key Files

**RBAC**:
- Model: services/api/app/models/user.py
- Auth: services/api/app/core/auth.py
- Endpoints: services/api/app/api/v1/endpoints/blueprints.py

**Blueprint Parser**:
- Parser: services/api/app/utils/blueprint_parser.py (new)
- Seeder: services/api/scripts/seed_blueprints.py (new)
- Skills: services/api/app/skills/{plan,style,validate}.py
- Source: docs/hit_song_blueprint/AI/*.md

**Bulk Operations**:
- Service: services/api/app/services/bulk_operations_service.py (new)
- Endpoints: services/api/app/api/v1/endpoints/*.py

**Frontend Auto-save**:
- Hook: apps/web/src/hooks/useAutoSave.ts (new)
- Forms: apps/web/src/app/(dashboard)/**/[id]/page.tsx

---

## Phase Scope

**Goal**: Implement P2 priority tasks from gap analysis to improve MVP completeness.

**Success Metrics**:
- Admin users can access blueprints, regular users cannot
- All 15 genre blueprints loaded from markdown to DB
- Bulk operations work for all entities
- Forms auto-save and restore data on refresh
- All entities have individual export functionality
