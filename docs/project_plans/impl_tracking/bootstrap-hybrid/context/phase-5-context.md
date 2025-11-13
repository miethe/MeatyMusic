# Phase 5 Context: UI Adaptation

## Current State

**Branch**: `feat/project-init`
**Last Commit**: `46dc81f docs(phase4): add comprehensive Phase 4 completion summary`
**Current Task**: Phase 5 - UI Adaptation (Not started)
**Previous Phase**: Phase 4 - Workflow Skills (Complete)

## Phase Scope

### Primary Objective

Adapt MeatyPrompts UI components to AMCS workflows with workflow visualization, entity editors, and real-time status display.

### Core Deliverables

1. **Workflow Dashboard**: Visual display of workflow graph execution with real-time updates
2. **Entity Editors**: Functional editors for Song, Style, Lyrics, Persona, ProducerNotes, Blueprint
3. **Route Implementation**: All routes from website_app.prd.md
4. **WebSocket Integration**: Real-time workflow status updates
5. **Analytics Display**: Dashboard showing metrics and analytics

### What You'll Do

1. Adapt MeatyPrompts UI components to AMCS workflows
2. Build workflow visualization dashboard
3. Create entity editor components
4. Implement real-time workflow status display

## Key Decisions

_Implementation decisions will be documented here as work progresses_

## Important Learnings

_Key insights and patterns discovered during implementation_

## Quick Reference

### Environment Setup

```bash
# Start development environment
docker-compose up -d

# Frontend dev server
cd apps/web && npm run dev

# Backend dev server
cd apps/api && uvicorn main:app --reload
```

### Key PRD References

- **Primary**: `docs/project_plans/PRDs/website_app.prd.md` (routes, screens, components)
- **Entity PRDs**: All entity PRDs for editor requirements
- **Requirements Validation**: `docs/project_plans/phases/phase-4-frontend.md`

### MeatyPrompts Reference Patterns

**Component Locations**:
- Source: `/apps/web/src/components/prompts/` → Target: `/components/songs/`
- Source: `/apps/web/src/components/editor/` → Target: `/components/workflow/`
- Reuse: `/apps/web/src/components/runs/` for workflow runs

**UI Infrastructure** (preserve):
- `/apps/web/src/lib/api/` - API client utilities
- `/apps/web/src/hooks/queries/` - React Query patterns
- `/apps/web/src/hooks/mutations/` - mutation patterns
- `/packages/ui/` - shared component library

### Design Guidance

**Architecture**: Follow MeatyPrompts patterns (hooks + contexts)
**State Management**:
- React Query for server state
- Zustand for client state

**Real-time**: WebSocket integration for workflow events
**Design System**: Preserve MeatyPrompts design tokens

### Validation Requirements

Phase complete when:
- All routes from website_app.prd.md implemented
- Entity editors functional
- Workflow visualization works
- Real-time updates via WebSocket
- Dashboard analytics display
- E2E tests pass for critical flows

### File Locations

**Component Source** (MeatyPrompts):
- `meatyprompts/apps/web/src/components/`
- `meatyprompts/packages/ui/`

**Component Target** (MeatyMusic):
- `apps/web/src/components/`
- `packages/ui/`

**API Integration**:
- Client: `apps/web/src/lib/api/`
- Hooks: `apps/web/src/hooks/`

**Tests**:
- Component: `apps/web/src/components/**/*.test.tsx`
- E2E: `apps/web/e2e/`

## Technical Constraints

- Component architecture must follow MeatyPrompts patterns
- Design tokens and component library must be preserved
- WebSocket integration required for real-time updates
- All API integrations must use React Query
- Client state must use Zustand
- E2E tests required for critical flows

## Success Metrics

- All routes functional
- Entity editors working
- Workflow visualization accurate
- Real-time updates <500ms latency
- Component tests >80% coverage
- E2E tests pass for critical flows
