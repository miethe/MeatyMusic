# Phase 5 Wave 1A - Architecture Foundation Summary

## Deliverables Completed

1. **Architecture Decision Document**: `/Users/miethe/dev/homelab/development/MeatyMusic/.claude/context/phase5-frontend-architecture.md`
   - 63KB comprehensive guide covering all architectural decisions
   - Component migration strategy with detailed mappings
   - State management boundaries (React Query + Zustand)
   - WebSocket integration patterns
   - Complete implementation roadmap

## Key Architectural Decisions

### 1. Component Migration Strategy

**Preserve (70%)**:
- Base infrastructure: AppShell, Header, Sidebar, Card, Button, Badge
- Bulk selection patterns
- Error handling and loading states
- API client structure with interceptors

**Adapt (20%)**:
- PromptCard → SongCard (add workflow state, genre/mood, entity links)
- PromptList → SongList (song-specific filters)
- RunHistory → WorkflowRuns (multi-node visualization)

**Create New (10%)**:
- SongWizard (multi-step creation flow)
- StyleEditor, LyricsEditor, PersonaSelector, ProducerNotesEditor
- WorkflowGraphVisualization (DAG status display)
- ArtifactViewer (preview generated outputs)

### 2. Routing Architecture

**Pattern**: Next.js App Router with route groups (preserves MP pattern)

```
(app)/
├── dashboard/
├── songs/
│   ├── page.tsx            # List with filters
│   ├── new/                # Creation wizard
│   └── [id]/
│       ├── page.tsx        # Detail + workflow status
│       ├── workflow/       # DAG visualization
│       └── runs/           # Run history
├── styles/                 # Entity libraries
├── lyrics/
├── personas/
├── blueprints/
└── sources/
```

**Key Features**:
- Modal-based editing with parallel routes
- Breadcrumb navigation in header
- Protected routes with auth middleware
- URL-based filter state

### 3. State Management Boundaries

**React Query** (Server State):
- Songs, entities, workflow runs
- Stale times: Songs (30s), Entities (2min), Blueprints (5min)
- Optimistic updates for mutations
- Automatic cache invalidation

**Zustand** (Client State):
- `useSongEditorStore`: Draft management, wizard state
- `useWorkflowStore`: WebSocket state, active runs
- `useThemeStore`, `useSidebarStore`: UI preferences (preserve MP)

**React Context** (Component-local):
- Form state (react-hook-form)
- Active wizard step
- Transient UI state

### 4. WebSocket Integration

**Architecture**:
- Custom `useWorkflowWebSocket` hook
- Connects to `/events` endpoint
- Automatic reconnection (max 5 attempts, 3s delay)
- Updates Zustand workflow store + React Query cache

**Event Flow**:
```
WebSocket Event → Workflow Store → Query Cache Invalidation → UI Update
```

**Features**:
- Real-time node status updates
- Automatic query invalidation
- Connection error handling
- Custom event callbacks

### 5. API Client Patterns

**Structure**:
```tsx
// Domain-specific namespaces
songsApi.{list, get, create, update, delete, getEntities, startWorkflow}
stylesApi.{...}
lyricsApi.{...}
workflowsApi.{...}
```

**Features**:
- Axios with interceptors (auth, telemetry, error handling)
- Optimistic updates with rollback
- Hierarchical query keys
- Retry logic with exponential backoff

## Component Inventory

### High Priority (Wave 2A)
- SongCard (adapt PromptCard)
- SongList (adapt PromptList)
- SongDetailClient (adapt PromptDetailClient)
- Song API client + React Query hooks

### Medium Priority (Wave 2B)
- StyleEditor
- LyricsEditor (with section management)
- PersonaSelector
- ProducerNotesEditor
- Entity API clients

### Medium Priority (Wave 2C)
- WorkflowGraphVisualization (NEW)
- WorkflowRunList (adapt RunHistoryList)
- WorkflowNodeDetail (adapt RunDetail)
- useWorkflowWebSocket hook
- Workflow store

## Implementation Roadmap

### Wave 2A: Core Song Management (Week 1)
- Create SongCard, SongList, SongDetailClient
- Implement song API client + hooks
- Set up routing (/songs, /songs/[id])
- Basic CRUD functionality

**Acceptance**: Can create, view, edit, delete songs with filters

### Wave 2B: Entity Editors (Week 2)
- Create Style, Lyrics, Persona, Producer editors
- Implement entity API clients + hooks
- Set up entity routes
- Integrate into SongWizard

**Acceptance**: Can create/edit all entity types

### Wave 2C: Workflow Integration (Week 3)
- Implement WebSocket hook + store
- Create workflow visualization components
- Add workflow routes
- Real-time status updates

**Acceptance**: Can start workflows, view real-time progress, inspect runs

### Wave 2D: Polish & Optimization (Week 4)
- Loading states, error boundaries
- Optimistic updates
- Keyboard shortcuts
- Accessibility audit
- E2E tests

**Acceptance**: Production-ready UI, Lighthouse >90, a11y compliant

## Design Patterns to Follow

1. **Component Composition**: Section-based components (Header, Body, Actions)
2. **Hook Patterns**: Separate queries/ and mutations/ directories
3. **Form Patterns**: react-hook-form + Zod validation
4. **Error Handling**: Error boundaries + toast notifications
5. **Accessibility**: ARIA labels, keyboard nav, live regions

## Key Files Created

- `/Users/miethe/dev/homelab/development/MeatyMusic/.claude/context/phase5-frontend-architecture.md` (63KB)

## Next Actions for Wave 2A

1. Create `apps/web/src/components/songs/SongCard.tsx` (adapt from PromptCard)
2. Create `apps/web/src/lib/api/songs.ts` (follow prompts.ts pattern)
3. Create `apps/web/src/hooks/queries/useSongs.ts` (follow usePrompts.ts pattern)
4. Create `apps/web/src/app/(app)/songs/page.tsx` (list view)
5. Update sidebar navigation in `AppSidebar.tsx`

## Success Criteria

- Clear migration path for all MP components
- Routing strategy supports all website_app.prd.md requirements
- State management boundaries well-defined
- WebSocket architecture designed for real-time workflow updates
- Design patterns documented for Wave 2 implementation

---

**Status**: Wave 1A COMPLETE
**Ready for**: Wave 2A implementation
**Document Version**: 1.0
**Last Updated**: 2025-11-13
