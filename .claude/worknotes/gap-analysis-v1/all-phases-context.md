# Gap Analysis Implementation - Working Context

**Purpose**: Token-efficient context for gap analysis implementation

---

## Current State

**Branch**: claude/execute-gap-analysis-01BcVuD2AqnXSUL5Dcj5gzWY
**Status**: Phase 0 - Initialization Complete
**Current Task**: Ready to begin P0 tasks
**Progress File**: `.claude/progress/gap-analysis-v1/all-phases-progress.md`

---

## Key Decisions

- **Execution Strategy**: Execute by priority level (P0→P1→P2→P3), parallel where possible
- **Subagent Delegation**: Use specialized agents for each domain (backend, frontend, UI)
- **Documentation**: Only ai-artifacts-engineer creates tracking docs per CLAUDE.md
- **Architecture**: Follow AMCS patterns (routers → services → repositories → DB)

---

## Scope Summary

**Source**: docs/IMPLEMENTATION_GAP_ANALYSIS.md

**Total Effort**: 175 story points across 15 phases

**Priority Breakdown**:
- P0 (Blocking MVP): 81 pts - Blueprint Seeder, MCP Integration, Forms, Import, Design System
- P1 (Critical): 44 pts - Filters, SDS Preview, Workflow Viz, Determinism Tests, Profanity
- P2 (Important): 24 pts - RBAC, Bulk Ops, Auto-save, Export
- P3 (Nice to Have): 26 pts - Render Jobs, Feature Flags, Polish

**Success Metric**: All P0 and P1 tasks complete for MVP readiness

---

## Quick Reference

### Environment Setup

```bash
# API
export PYTHONPATH="$PWD/services/api"
uv run --project services/api pytest

# Web
pnpm --filter "./apps/web" dev
pnpm --filter "./apps/web" test

# UI Package
pnpm --filter "./packages/ui" storybook
```

### Key Directories

- Blueprints: `docs/hit_song_blueprint/AI/*.md` (15 genre blueprints)
- Schemas: `schemas/*.schema.json` (entity schemas)
- Taxonomies: `taxonomies/conflict_matrix.json`
- Skills: `services/api/app/skills/*.py` (workflow nodes)
- Models: `services/api/app/models/*.py` (database)
- API: `services/api/app/api/v1/endpoints/*.py`
- UI Components: `packages/ui/src/components/*.tsx`
- Web Pages: `apps/web/src/app/(dashboard)/**/*.tsx`

---

## Parallel Execution Opportunities

**P0 Tasks (Can Run in Parallel)**:
- Phase 1: Blueprint Seeder (backend) || Phase 3: Form Enhancements (frontend)
- Phase 2: MCP Integration (backend) || Phase 4: Import Features (full-stack)
- Phase 5: Design System (frontend, independent)

**P1 Tasks (Can Run in Parallel)**:
- Phase 6: Filters (frontend) || Phase 9: Determinism Tests (backend)
- Phase 7: SDS Preview (frontend) || Phase 10: Profanity Filter (backend)
- Phase 8: Workflow Viz (frontend, independent)

---

## Critical Dependencies

- Phase 1 (Blueprint Seeder) → Phase 2 may benefit from real blueprints
- Phase 3 (Form Enhancements) → Phase 5 (Design System) for component variants
- Phase 4 (Import) → Uses schema validation (already exists)
- Phase 6 (Filters) → Needs Phase 5 (Design System) components
- Phase 7 (SDS Preview) → Needs Phase 5 (Design System) components

**Recommended Sequence**:
1. Start P0: Phase 1 (Blueprint), Phase 2 (MCP), Phase 3 (Forms) in parallel
2. After Phase 3 completes, start Phase 4 (Import) and Phase 5 (Design System)
3. After Phase 5 completes, start P1: Phase 6, 7, 8 in parallel
4. Start P1: Phase 9, 10 in parallel (backend-focused)
5. Then P2, then P3

---

## AMCS Determinism Requirements

All implementations must maintain:
- **Global seed propagation**: Use Song.global_seed + node_index
- **Pinned retrieval**: Track chunk hashes for RAG
- **Low temperature**: ≤0.3 for LLM calls
- **Content hashing**: SHA-256 for outputs
- **Lexicographic sorting**: Arrays sorted before hashing

Particularly critical for:
- Phase 2 (MCP Integration) - chunk hash pinning
- Phase 9 (Determinism Tests) - validate 99% reproducibility

---

## Import Learnings

From existing Styles import implementation:
- Pattern: POST /{entity}/import with multipart/form-data
- Validation: Server-side schema validation
- Metadata: imported_at, import_source_filename fields
- UI: File upload button, client-side validation, preview modal
- Reuse this pattern for Phase 4 (other entities)

---

## Design System Requirements

From PRD (Phase 5):
- **Color System**: Dark theme with accent colors
- **Typography**: 8-level hierarchy
- **Spacing**: 4px base scale
- **Elevation**: 5-level shadow system with accent glow
- **Components**: Button (4 variants), Card (3 variants), Input (full library)
- **Motion**: Transition duration tokens

---

## Test Coverage Requirements

- **Unit Tests**: Business logic, services
- **Integration Tests**: API endpoints, workflows
- **E2E Tests**: Critical user paths
- **Determinism Tests** (Phase 9): 99% reproducibility target
- **Rubric Tests** (Phase 9): 95% pass rate target

---

## Notes

- **Documentation Policy**: Only ai-artifacts-engineer creates docs (per CLAUDE.md)
- **Observation Log**: Keep brief notes in this file for non-PRD learnings
- **Commit Frequency**: Commit after each logical unit of work
- **Validation**: Use task-completion-validator after major tasks
