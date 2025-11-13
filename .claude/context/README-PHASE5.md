# Phase 5: UI Adaptation for MeatyMusic AMCS

## Overview

This directory contains the complete architecture documentation for Phase 5 (Frontend Migration), which adapts the MeatyPrompts UI infrastructure to support the MeatyMusic Agentic Music Creation System (AMCS) workflows.

## Documentation Index

### Quick Start (5 min)

**Start Here**: `phase5-wave1a-summary.md`
- High-level overview of architectural decisions
- Component inventory by priority
- Implementation roadmap summary

### Component Reference (10 min)

**Visual Guide**: `phase5-component-mapping.md`
- Before/after component mappings with code examples
- Visual layout diagrams
- Quick reference table of all components

### Complete Architecture (30 min)

**Deep Dive**: `phase5-frontend-architecture.md`
- Component migration strategy (70% preserve, 20% adapt, 10% new)
- Routing architecture (Next.js App Router patterns)
- State management boundaries (React Query + Zustand)
- WebSocket integration for real-time workflow updates
- API client patterns with optimistic updates
- Complete component inventory
- Design patterns and best practices
- 4-week implementation roadmap

### Design Specifications (20 min)

**Design Guide**: `phase5-design-specs.md`
- Detailed component specifications
- Visual design mockups (text-based)
- Interaction patterns
- Accessibility requirements

### Implementation Guide (15 min)

**Developer Guide**: `wave2-quick-start.md`
- Step-by-step first implementation tasks
- Code templates for each step
- Common patterns reference
- Troubleshooting guide
- Success metrics checklist

## File Summary

| File | Size | Purpose | Audience |
|------|------|---------|----------|
| `phase5-wave1a-summary.md` | 6KB | Executive overview | PMs, Tech Leads |
| `phase5-component-mapping.md` | 14KB | Visual component mappings | Developers |
| `phase5-frontend-architecture.md` | 44KB | Complete architecture | Architects, Senior Devs |
| `phase5-design-specs.md` | 60KB | Design specifications | Designers, Frontend Devs |
| `wave2-quick-start.md` | 10KB | Implementation guide | Developers |
| `PHASE5_WAVE1A_COMPLETE.md` | 8KB | Completion summary | All stakeholders |

**Total**: 142KB of documentation

## Key Architectural Decisions

### 1. Component Migration Strategy

- **Preserve (70%)**: AppShell, Sidebar, Header, base UI components, bulk selection, error handling
- **Adapt (20%)**: PromptCard → SongCard, PromptList → SongList, RunHistory → WorkflowRuns
- **Create New (10%)**: SongWizard, Entity editors, WorkflowGraphVisualization

### 2. State Management Boundaries

**React Query** (Server State):
- All API data (songs, entities, workflow runs)
- Stale times: Songs (30s), Entities (2min), Blueprints (5min)
- Optimistic updates with rollback

**Zustand** (Client State):
- `useSongEditorStore`: Draft management, wizard state
- `useWorkflowStore`: WebSocket state, active runs
- UI preferences (theme, sidebar)

### 3. Routing Architecture

Next.js App Router with route groups:
```
(app)/
├── dashboard/
├── songs/              # Song management
├── styles/             # Entity libraries
├── lyrics/
├── personas/
├── blueprints/
└── sources/
```

### 4. WebSocket Integration

Real-time workflow updates:
- Custom `useWorkflowWebSocket` hook
- Connects to `/events` endpoint
- Automatic reconnection (max 5 attempts)
- Updates Zustand store + invalidates React Query cache

## Implementation Roadmap

### Wave 2A: Core Song Management (Week 1)
**Goal**: Basic song CRUD with simplified UI
**Time**: 6-8 hours
**Acceptance**: Can create, view, edit, delete songs with filters

### Wave 2B: Entity Editors (Week 2)
**Goal**: Style, Lyrics, Persona editors functional
**Time**: 20-24 hours
**Acceptance**: Can create/edit all entity types

### Wave 2C: Workflow Integration (Week 3)
**Goal**: Workflow execution and visualization
**Time**: 20-24 hours
**Acceptance**: Can start workflows, view real-time progress, inspect runs

### Wave 2D: Polish & Optimization (Week 4)
**Goal**: Production-ready UI with optimizations
**Time**: 16-20 hours
**Acceptance**: Lighthouse >90, a11y compliant, E2E coverage

## Quick Navigation

### For Product Managers
1. Read `phase5-wave1a-summary.md` (5 min)
2. Review implementation roadmap
3. Track progress against acceptance criteria

### For Tech Leads
1. Read `phase5-wave1a-summary.md` (5 min)
2. Review `phase5-frontend-architecture.md` (30 min)
3. Understand key architectural decisions
4. Plan team assignments based on roadmap

### For Frontend Developers
1. Read `wave2-quick-start.md` (15 min)
2. Reference `phase5-component-mapping.md` for visual guides
3. Use `phase5-frontend-architecture.md` as implementation reference
4. Follow step-by-step guide in quick start

### For Designers
1. Read `phase5-design-specs.md` (20 min)
2. Review component visual layouts
3. Understand interaction patterns
4. Validate accessibility requirements

## Success Criteria

All Wave 1A criteria achieved:
- [x] Clear migration path for all MeatyPrompts components
- [x] Routing strategy supports all website_app.prd.md requirements
- [x] State management boundaries well-defined
- [x] WebSocket architecture designed for real-time workflow updates
- [x] Design patterns documented for Wave 2 implementation
- [x] Implementation roadmap with time estimates
- [x] Quick start guide for developers

## Next Steps

1. **Review Documentation**: Start with `wave2-quick-start.md`
2. **Start Wave 2A**: Create song API client (Step 1, ~30 min)
3. **Day 1 Goal**: Basic song CRUD working
4. **Week 1 Goal**: Wave 2A complete (song management functional)

## References

### MeatyPrompts Source Files
- `/apps/web/src/lib/api/prompts.ts` - API client pattern
- `/apps/web/src/hooks/queries/usePrompts.ts` - Query hooks pattern
- `/apps/web/src/components/prompts/PromptList.tsx` - List component pattern
- `/packages/ui/src/components/PromptCard/PromptCard.tsx` - Card component pattern

### MeatyMusic PRDs
- `docs/project_plans/PRDs/website_app.prd.md` - Frontend requirements
- `docs/project_plans/PRDs/claude_code_orchestration.prd.md` - Workflow specification
- `docs/project_plans/PRDs/style.prd.md` - Style entity schema
- `docs/project_plans/PRDs/lyrics.prd.md` - Lyrics entity schema
- `docs/project_plans/PRDs/persona.prd.md` - Persona entity schema

### External Resources
- React Query: https://tanstack.com/query/latest/docs/react/overview
- Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction
- Next.js App Router: https://nextjs.org/docs/app/building-your-application/routing
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

## Questions & Feedback

For questions about architecture decisions or implementation guidance:
1. Review relevant documentation first
2. Check troubleshooting section in `wave2-quick-start.md`
3. Reference MeatyPrompts source files for patterns
4. Consult PRDs for business requirements

## Document History

- **2025-11-13**: Wave 1A complete - All architecture documentation created
- **Next Review**: After Wave 2A completion (Week 1)

---

**Status**: Wave 1A COMPLETE
**Ready for**: Wave 2A implementation
**Total Documentation**: 142KB across 6 files
**Estimated Implementation**: 4 weeks (62-76 hours)
