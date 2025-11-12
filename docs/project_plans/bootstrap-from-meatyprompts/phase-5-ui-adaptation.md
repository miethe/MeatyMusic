# Phase 5: UI Adaptation (10-15 days)

**Timeline**: 10-15 days (2-3 weeks)
**Effort**: 34 story points
**Dependencies**: Phase 4 complete
**Team**: ui-engineer, ui-engineer-enhanced, frontend-developer, web-accessibility-checker, code-reviewer

---

## Goals

- Create workflow dashboard
- Build song creation flow
- Adapt component library to AMCS domain
- Implement real-time workflow visualization

## Tasks

### Week 1: Core Components

#### 1. Create workflow visualizer (`/apps/web/src/components/workflow/WorkflowVisualizer.tsx`):
```typescript
import { useWorkflowEvents } from '@/hooks/queries/useWorkflowEvents'

interface Node {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: number
  metrics?: Record<string, number>
}

export function WorkflowVisualizer({ runId }: { runId: string }) {
  const { events } = useWorkflowEvents(runId)

  const nodes: Node[] = [
    'PLAN', 'STYLE', 'LYRICS', 'PRODUCER',
    'COMPOSE', 'VALIDATE', 'RENDER', 'REVIEW'
  ].map(id => ({
    id,
    status: getNodeStatus(id, events),
    duration: getNodeDuration(id, events),
    metrics: getNodeMetrics(id, events)
  }))

  return (
    <div className="workflow-graph">
      {nodes.map(node => (
        <WorkflowNode key={node.id} node={node} />
      ))}
    </div>
  )
}
```

#### 2. Create song creation form (`/apps/web/src/components/songs/SongCreationForm.tsx`):
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sdsSchema } from '@/lib/validation/sds'

export function SongCreationForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(sdsSchema)
  })

  const createWorkflowMutation = useCreateWorkflow()

  const onSubmit = async (data: SDS) => {
    const run = await createWorkflowMutation.mutateAsync(data)
    router.push(`/workflows/${run.run_id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StyleSelector {...register('style_id')} />
      <LyricsConstraints {...register('lyrics')} />
      <ProducerPreferences {...register('producer_notes')} />
      <button type="submit">Create Song</button>
    </form>
  )
}
```

#### 3. Adapt existing components from MeatyPrompts:
```typescript
// /apps/web/src/components/shared/DataTable.tsx (reuse as-is)
// /apps/web/src/components/shared/Modal.tsx (reuse as-is)
// /apps/web/src/components/shared/Toast.tsx (reuse as-is)
// /apps/web/src/components/layouts/DashboardLayout.tsx (adapt navigation)
```

### Week 2: Dashboard & Real-time Updates

#### 1. Create workflow dashboard (`/apps/web/src/app/dashboard/page.tsx`):
```typescript
import { useWorkflowRuns } from '@/hooks/queries/useWorkflowRuns'

export default function DashboardPage() {
  const { data: runs, isLoading } = useWorkflowRuns()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WorkflowStats runs={runs} />
        <RecentRuns runs={runs} />
        <ActiveWorkflows runs={runs.filter(r => r.status === 'running')} />
      </div>
    </DashboardLayout>
  )
}
```

#### 2. Create WebSocket hook (`/apps/web/src/hooks/useWorkflowEvents.ts`):
```typescript
import { useEffect, useState } from 'react'

export function useWorkflowEvents(runId: string) {
  const [events, setEvents] = useState<WorkflowEvent[]>([])

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/workflows/events`)

    ws.onmessage = (message) => {
      const event = JSON.parse(message.data)
      if (event.run_id === runId) {
        setEvents(prev => [...prev, event])
      }
    }

    return () => ws.close()
  }, [runId])

  return { events }
}
```

#### 3. Create artifact viewer (`/apps/web/src/components/artifacts/ArtifactViewer.tsx`):
```typescript
export function ArtifactViewer({ artifact }: { artifact: Artifact }) {
  return (
    <div className="artifact-viewer">
      <ArtifactHeader artifact={artifact} />

      {artifact.type === 'style' && <StyleArtifact data={artifact.data} />}
      {artifact.type === 'lyrics' && <LyricsArtifact data={artifact.data} />}
      {artifact.type === 'producer' && <ProducerNotesArtifact data={artifact.data} />}
      {artifact.type === 'prompt' && <PromptArtifact data={artifact.data} />}

      <ArtifactMetadata
        hash={artifact.hash}
        citations={artifact.citations}
        scores={artifact.scores}
      />
    </div>
  )
}
```

## Agent Assignments

- **Components**: ui-engineer
- **Hooks**: ui-engineer
- **Dashboard**: ui-engineer
- **Real-time**: ui-engineer
- **Review**: web-accessibility-checker, code-reviewer

## Deliverables

- Workflow visualizer component
- Song creation form
- Real-time workflow dashboard
- Artifact viewers
- WebSocket integration
- Responsive design

## Success Criteria

- [x] Workflow graph displays correctly
- [x] Real-time updates work via WebSocket
- [x] Song creation flow works end-to-end
- [x] Artifacts display correctly
- [x] Mobile responsive
- [x] Accessibility score >90

## Component Library

### New Components

#### Workflow Components
- `WorkflowVisualizer.tsx` - Graph visualization of workflow execution
- `WorkflowNode.tsx` - Individual node display with status
- `WorkflowMetrics.tsx` - Real-time metrics display
- `WorkflowTimeline.tsx` - Event timeline view

#### Song Components
- `SongCreationForm.tsx` - Multi-step form for SDS creation
- `SongList.tsx` - List of songs with filters
- `SongCard.tsx` - Song preview card
- `StyleSelector.tsx` - Genre/style selection UI
- `LyricsConstraints.tsx` - Lyrics constraint configuration
- `ProducerPreferences.tsx` - Producer notes configuration

#### Artifact Components
- `ArtifactViewer.tsx` - Unified artifact display
- `StyleArtifact.tsx` - Style specification display
- `LyricsArtifact.tsx` - Lyrics with annotations
- `ProducerNotesArtifact.tsx` - Producer guidance display
- `PromptArtifact.tsx` - Final prompt display with formatting
- `ArtifactMetadata.tsx` - Hash, citations, scores

### Reused from MeatyPrompts

#### Shared Components (as-is)
- `DataTable.tsx` - Generic data table
- `Modal.tsx` - Modal dialog
- `Toast.tsx` - Toast notifications
- `Button.tsx` - Button variants
- `Input.tsx` - Form inputs
- `Select.tsx` - Select dropdowns
- `Card.tsx` - Card container

#### Layout Components (adapted)
- `DashboardLayout.tsx` - Update navigation for AMCS
- `AuthLayout.tsx` - Reuse as-is
- `Header.tsx` - Update branding to MeatyMusic
- `Sidebar.tsx` - Update menu items for workflows

## React Query Hooks

### Queries
```typescript
// /apps/web/src/hooks/queries/useWorkflowRuns.ts
export function useWorkflowRuns(filters?: WorkflowFilters) {
  return useQuery({
    queryKey: ['workflowRuns', filters],
    queryFn: () => apiClient.get('/workflows/runs', { params: filters })
  })
}

// /apps/web/src/hooks/queries/useWorkflowRun.ts
export function useWorkflowRun(runId: string) {
  return useQuery({
    queryKey: ['workflowRun', runId],
    queryFn: () => apiClient.get(`/workflows/runs/${runId}`)
  })
}

// /apps/web/src/hooks/queries/useSongs.ts
export function useSongs(filters?: SongFilters) {
  return useQuery({
    queryKey: ['songs', filters],
    queryFn: () => apiClient.get('/songs', { params: filters })
  })
}
```

### Mutations
```typescript
// /apps/web/src/hooks/mutations/useCreateWorkflow.ts
export function useCreateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sds: SDS) => apiClient.post('/workflows/runs', sds),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflowRuns'])
    }
  })
}

// /apps/web/src/hooks/mutations/useCreateSong.ts
export function useCreateSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (song: SongCreate) => apiClient.post('/songs', song),
    onSuccess: () => {
      queryClient.invalidateQueries(['songs'])
    }
  })
}
```

## Routing Structure

```
/                          -> HomePage (landing)
/dashboard                 -> DashboardPage (workflow stats, recent runs)
/songs                     -> SongsListPage (all songs)
/songs/new                 -> SongCreationPage (create SDS)
/songs/:songId             -> SongDetailPage (view song)
/workflows/:runId          -> WorkflowDetailPage (visualizer, events, artifacts)
/styles                    -> StylesListPage (browse/create styles)
/styles/:styleId           -> StyleDetailPage (view style)
/personas                  -> PersonasListPage (artist personas)
/personas/:personaId       -> PersonaDetailPage (view persona)
```

## Styling & Design

### Design Tokens (Reused from MeatyPrompts)
- Colors: Brand, semantic, state
- Typography: Font families, sizes, weights
- Spacing: Consistent spacing scale
- Borders: Radius, width
- Shadows: Elevation levels

### Tailwind Configuration (Adapted)
```javascript
// /apps/web/tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Update brand colors for MeatyMusic
        primary: {...},
        secondary: {...},
      },
      // Preserve all other tokens
    }
  }
}
```

## Accessibility

### WCAG 2.1 AA Compliance
- [ ] Color contrast ratios >4.5:1
- [ ] Keyboard navigation for all interactions
- [ ] ARIA labels for workflow visualizer
- [ ] Screen reader announcements for events
- [ ] Focus management in modals
- [ ] Alt text for all images

### Testing
- [ ] Run axe-core automated checks
- [ ] Manual keyboard navigation testing
- [ ] Screen reader testing (NVDA/JAWS)
- [ ] Color blindness simulation

## Performance

### Optimization Targets
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1

### Strategies
- Code splitting by route
- Lazy load artifact viewers
- Virtualize long lists
- Optimize WebSocket reconnection
- Memoize expensive computations

## Key Files Created

### Components
- `/apps/web/src/components/workflow/` (5 components)
- `/apps/web/src/components/songs/` (6 components)
- `/apps/web/src/components/artifacts/` (6 components)

### Hooks
- `/apps/web/src/hooks/queries/` (3 query hooks)
- `/apps/web/src/hooks/mutations/` (2 mutation hooks)
- `/apps/web/src/hooks/useWorkflowEvents.ts` (WebSocket hook)

### Pages
- `/apps/web/src/app/dashboard/page.tsx`
- `/apps/web/src/app/songs/` (3 pages)
- `/apps/web/src/app/workflows/[runId]/page.tsx`
- `/apps/web/src/app/styles/` (2 pages)

### Validation
- `/apps/web/src/lib/validation/sds.ts` (Zod schema for SDS)

---

**Previous Phase**: [Phase 4: Workflow Orchestration](./phase-4-workflow-orchestration.md)
**Next Phase**: Testing & Deployment (not included in bootstrap plan)
**Supporting Docs**:
- [Migration Guide](./migration-guide.md)
- [Risk & Validation](./risk-and-validation.md)
**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
