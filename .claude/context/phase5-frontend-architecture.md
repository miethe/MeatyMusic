# Phase 5: Frontend Architecture Decision Document

**Project**: MeatyMusic AMCS
**Phase**: Wave 1A - Architecture Foundation
**Date**: 2025-11-13
**Status**: Draft

## Executive Summary

This document defines the frontend architecture migration strategy from MeatyPrompts to MeatyMusic, establishing patterns for Wave 2 implementation. The migration leverages 70% infrastructure reuse while adapting UI patterns from prompt management to song workflow orchestration.

**Key Decisions**:
- Preserve React Query + Zustand separation pattern
- Adapt PromptCard → SongCard with workflow state visualization
- Implement dedicated WebSocket layer for real-time workflow updates
- Use Next.js App Router with parallel route groups
- Maintain modal-based editing patterns with workflow-specific adaptations

## Table of Contents

1. [System Context](#1-system-context)
2. [Component Migration Strategy](#2-component-migration-strategy)
3. [Routing Architecture](#3-routing-architecture)
4. [State Management Architecture](#4-state-management-architecture)
5. [WebSocket Integration](#5-websocket-integration)
6. [API Client Patterns](#6-api-client-patterns)
7. [Component Inventory](#7-component-inventory)
8. [Design Patterns](#8-design-patterns)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. System Context

### 1.1 Core Transformation

**From: MeatyPrompts** (Prompt Library Management)
- Entity: Prompt (versioned, executable text)
- Flow: Create → Edit → Execute → View Results
- Real-time: Execution status updates

**To: MeatyMusic** (Song Workflow Orchestration)
- Entity: Song (SDS + artifacts: Style, Lyrics, Persona, ProducerNotes)
- Flow: Design → Plan → Generate (Style/Lyrics/Producer) → Compose → Validate → Fix → Render → Review
- Real-time: Multi-step workflow progress with node-level status

### 1.2 Preserved Infrastructure (70%)

From MeatyPrompts, we preserve:
- Next.js 14 App Router with route groups
- React Query for server state (queries + mutations)
- Zustand for client state (UI preferences, selections)
- Axios client with interceptors (auth, telemetry, error handling)
- Component library structure (@meaty/ui)
- Authentication layer (Clerk integration)
- Observability (OpenTelemetry, structured logging)

### 1.3 New Requirements (30%)

For MeatyMusic AMCS:
- Multi-entity editors (Style, Lyrics, Persona, ProducerNotes, Sources, Blueprints)
- Workflow visualization (DAG status display)
- Real-time workflow events via WebSocket (`/events` endpoint)
- Entity relationship management (Song → entities)
- Artifact preview and comparison
- Blueprint-driven validation UI

---

## 2. Component Migration Strategy

### 2.1 Core Component Mappings

| MeatyPrompts Component | MeatyMusic Adaptation | Migration Type | Priority |
|------------------------|----------------------|----------------|----------|
| `PromptCard` | `SongCard` | Adapt | High |
| `PromptList` | `SongList` | Adapt | High |
| `PromptDetailClient` | `SongDetailClient` | Adapt | High |
| `EditPromptModal` | `SongWizard` (multi-step) | Redesign | High |
| `RunHistoryList` | `WorkflowRunList` | Adapt | Medium |
| `RunDetail` | `WorkflowNodeDetail` | Adapt | Medium |
| `StatusBadge` | `WorkflowNodeBadge` | Adapt | High |
| `PromptCardWrapper` | `SongCardWrapper` | Adapt | High |
| `BulkActionBar` | `BulkActionBar` | Preserve | Low |
| `ActiveFilterChips` | `ActiveFilterChips` | Preserve | Low |

### 2.2 Component Adaptation Details

#### 2.2.1 PromptCard → SongCard

**Preserved Features**:
- Card size variants (compact, standard, xl)
- Bulk selection with checkboxes
- Metrics display (runs, success rate, cost, time)
- Hover states and keyboard shortcuts
- Error boundaries
- Accessibility (ARIA labels, keyboard navigation)

**Adaptations**:
```tsx
// NEW: Workflow state visualization
interface SongCardProps extends Omit<PromptCardProps, 'promptType' | 'bodyPreview'> {
  // Replace prompt-specific fields
  genre?: string;              // Primary genre badge
  mood?: string[];             // Mood chips (max 3)
  status?: 'draft' | 'processing' | 'complete' | 'failed';

  // NEW: Workflow state
  workflowState?: {
    currentNode?: 'PLAN' | 'STYLE' | 'LYRICS' | 'PRODUCER' | 'COMPOSE' | 'VALIDATE' | 'FIX' | 'RENDER' | 'REVIEW';
    completedNodes: string[];
    failedNodes: string[];
    progress?: number;          // 0-100
  };

  // NEW: Entity links
  entities?: {
    style?: { id: string; name: string };
    lyrics?: { id: string; name: string };
    persona?: { id: string; name: string };
    producer?: { id: string; name: string };
  };

  // Callbacks
  onViewWorkflow?: () => void;   // View workflow graph
  onEditEntity?: (type: 'style' | 'lyrics' | 'persona' | 'producer') => void;
}
```

**Visual Adaptations**:
- **Header**: Title + Genre badge (replaces version badge)
- **Meta Strip**: Mood chips (max 3) + Status badge
- **Body Preview**: Entity summary cards (4 slots: Style, Lyrics, Persona, Producer)
- **Workflow Progress**: Linear progress bar with node indicators (XL size only)
- **Actions**: "View Workflow", "Edit", "Clone" (replaces "Run", "Edit", "Fork")

#### 2.2.2 PromptList → SongList

**Preserved**:
- Infinite scroll with React Query
- Bulk selection hook (`useBulkSelection`)
- Empty states with contextual messaging
- Filter integration
- Keyboard shortcuts (Cmd+A, Escape)

**Adaptations**:
```tsx
interface SongListProps {
  filters?: Omit<SongFilters, 'cursor'>;  // NEW: Song-specific filters
}

interface SongFilters {
  q?: string;                   // Full-text search
  genres?: string[];            // Filter by genre
  moods?: string[];             // Filter by mood
  status?: ('draft' | 'processing' | 'complete' | 'failed')[];
  hasStyle?: boolean;           // Filter by entity presence
  hasLyrics?: boolean;
  hasPersona?: boolean;
  favorite?: boolean;
  archived?: boolean;
  // Pagination
  cursor?: string;
  limit?: number;
}
```

**Empty States**:
- "No songs yet" → "Create Your First Song"
- "No filter results" → "Adjust Filters"
- "No favorites" → "Star Your Favorites"
- "No complete songs" → "Start a Workflow"

#### 2.2.3 EditPromptModal → SongWizard (Multi-Step)

**Major Redesign Required**

MeatyPrompts uses a single-entity modal editor with tabs (Overview, Blocks, Runs, Provenance). MeatyMusic needs a **multi-step wizard** for song creation.

**Wizard Steps**:
1. **Song Info** (name, description, genre, mood)
2. **Style Editor** (tempo, key, instrumentation, tags)
3. **Lyrics Editor** (sections, rhyme scheme, sources)
4. **Persona Selector** (choose existing or create new)
5. **Producer Notes** (structure, hooks, mix parameters)
6. **Review & Launch** (preview SDS, configure workflow)

**Pattern**: Use `react-hook-form` with Zod validation (preserves MP pattern)

```tsx
// apps/web/src/components/songs/SongWizard/SongWizard.tsx
interface SongWizardProps {
  mode: 'create' | 'edit';
  songId?: string;
  onComplete: (song: Song) => void;
  onCancel: () => void;
}

// Each step is a separate component with shared form context
// Steps: SongInfoStep, StyleEditorStep, LyricsEditorStep, PersonaSelectorStep, ProducerNotesStep, ReviewStep
```

#### 2.2.4 RunHistoryList → WorkflowRunList

**Adaptations**:
```tsx
interface WorkflowRunListProps {
  songId: string;
  filters?: WorkflowRunFilters;
}

interface WorkflowRun {
  id: string;
  song_id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;

  // NEW: Workflow-specific
  nodes: WorkflowNode[];        // Status per node
  artifacts: WorkflowArtifacts; // Generated outputs
  scores?: Record<string, number>; // Validation scores
  fix_attempts?: number;         // Number of FIX cycles
}

interface WorkflowNode {
  id: 'PLAN' | 'STYLE' | 'LYRICS' | 'PRODUCER' | 'COMPOSE' | 'VALIDATE' | 'FIX' | 'RENDER' | 'REVIEW';
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  error?: string;
}
```

**UI Changes**:
- Display workflow DAG status (node indicators)
- Show fix attempt count
- Display validation scores
- Link to generated artifacts

### 2.3 New Components Required

| Component | Purpose | Inspiration Source | Priority |
|-----------|---------|-------------------|----------|
| `SongWizard` | Multi-step song creation | `EditPromptModal` + custom | High |
| `StyleEditor` | Style spec form | `PromptBlocks` pattern | High |
| `LyricsEditor` | Lyrics with section management | `PromptBlocks` + Lexical | High |
| `PersonaSelector` | Choose/create persona | `AttachContextDialog` | High |
| `ProducerNotesEditor` | Structure + mix params | Custom | Medium |
| `WorkflowGraphVisualization` | DAG status display | New (Recharts/D3) | Medium |
| `ArtifactViewer` | Preview generated outputs | `RunDetail` pattern | Medium |
| `BlueprintRubricDisplay` | Show validation scores | New | Low |
| `EntityLinkManager` | Manage song↔entity relations | New | Low |

---

## 3. Routing Architecture

### 3.1 Route Structure

Based on `website_app.prd.md` requirements, we adopt MeatyPrompts' route group pattern:

```
apps/web/src/app/
├── (auth)/                     # Public routes
│   ├── sign-in/
│   └── sign-up/
├── (marketing)/                # Landing pages
│   └── page.tsx
├── (app)/                      # Protected app routes
│   ├── layout.tsx             # AppShell with sidebar
│   ├── dashboard/
│   │   └── page.tsx           # Home dashboard
│   ├── songs/                  # Song routes
│   │   ├── page.tsx           # Song list (filters in searchParams)
│   │   ├── new/               # Song wizard
│   │   │   └── page.tsx
│   │   └── [id]/              # Song detail
│   │       ├── page.tsx       # Overview + workflow status
│   │       ├── edit/          # Full-page editor
│   │       │   └── page.tsx
│   │       ├── edit-modal/    # Modal editor (parallel route)
│   │       │   └── @modal/
│   │       ├── workflow/      # Workflow graph view
│   │       │   └── page.tsx
│   │       └── runs/          # Workflow run history
│   │           ├── page.tsx
│   │           └── [runId]/
│   ├── styles/                 # Style library
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   ├── lyrics/                 # Lyrics library
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   ├── personas/               # Persona library
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   ├── blueprints/             # Blueprint library
│   │   ├── page.tsx
│   │   └── [id]/
│   ├── sources/                # Source management
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   └── settings/               # Settings
│       └── page.tsx
└── api/                        # API routes (if needed)
```

### 3.2 Navigation Hierarchy

**Sidebar Navigation** (Primary):
```tsx
// apps/web/src/components/layouts/AppSidebar.tsx
const navigation = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Songs', href: '/songs', icon: MusicIcon },
  {
    name: 'Library',
    icon: FolderIcon,
    children: [
      { name: 'Styles', href: '/styles' },
      { name: 'Lyrics', href: '/lyrics' },
      { name: 'Personas', href: '/personas' },
      { name: 'Blueprints', href: '/blueprints' },
      { name: 'Sources', href: '/sources' },
    ]
  },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];
```

**Breadcrumbs** (Secondary navigation in Header):
- `/songs` → "Songs"
- `/songs/[id]` → "Songs / Song Name"
- `/songs/[id]/workflow` → "Songs / Song Name / Workflow"
- `/styles/[id]` → "Styles / Style Name"

### 3.3 Route Protection Pattern

Preserve MeatyPrompts auth pattern:

```tsx
// apps/web/src/app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();  // Clerk hook

  useOnboardingCheck();  // Redirect to onboarding if needed

  if (isLoading) return <LoadingStates.FullPage />;

  return (
    <AppShell>{children}</AppShell>
  );
}
```

### 3.4 Modal Routes (Parallel Routes)

Follow MP pattern for edit modals:

```
songs/[id]/
├── @modal/
│   └── (.)edit/          # Intercept route for modal
│       └── page.tsx
└── edit/                 # Fallback for direct navigation
    └── page.tsx
```

**Usage**: Opens edit UI in modal when navigating from song list, but supports direct URL navigation to full-page editor.

---

## 4. State Management Architecture

### 4.1 State Management Boundaries

Following MeatyPrompts established pattern, we define clear boundaries:

**React Query** (Server State):
- All API data (songs, entities, runs)
- Caching with stale time policies
- Optimistic updates for mutations
- Automatic refetching on window focus/reconnect

**Zustand** (Client State):
- UI preferences (theme, sidebar collapsed)
- Transient selections (bulk selection IDs)
- Editor drafts (local persistence)
- WebSocket connection state

**React Context** (Component-local State):
- Form state within wizards (react-hook-form)
- Active tab/step in multi-step flows
- Transient UI state (hover, focus)

### 4.2 Zustand Store Architecture

Preserve MP pattern with new domain stores:

```tsx
// apps/web/src/stores/index.ts
export { useThemeStore } from './theme';
export { useSidebarStore } from './sidebar';
export { useSongEditorStore } from './songEditor';        // NEW
export { useWorkflowStore } from './workflow';            // NEW
export { useBulkSelectionStore } from './bulkSelection';  // Preserve MP pattern
```

#### 4.2.1 Song Editor Store

```tsx
// apps/web/src/stores/songEditor.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SongEditorState {
  // Active song being edited
  songId: string | null;

  // Entity drafts (unsaved changes)
  drafts: {
    style?: Partial<StyleSpec>;
    lyrics?: Partial<LyricsSpec>;
    persona?: Partial<PersonaSpec>;
    producer?: Partial<ProducerNotesSpec>;
  };

  // Wizard state
  currentStep: number;
  completedSteps: number[];

  // Dirty state
  isDirty: boolean;
  lastSaved: Date | null;
}

interface SongEditorActions {
  setActiveSong: (id: string) => void;
  updateDraft: (entity: 'style' | 'lyrics' | 'persona' | 'producer', data: any) => void;
  clearDrafts: () => void;
  setCurrentStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  markDirty: () => void;
  markSaved: () => void;
  reset: () => void;
}

export const useSongEditorStore = create<SongEditorState & SongEditorActions>()(
  persist(
    (set) => ({
      // Initial state
      songId: null,
      drafts: {},
      currentStep: 0,
      completedSteps: [],
      isDirty: false,
      lastSaved: null,

      // Actions
      setActiveSong: (id) => set({ songId: id }),

      updateDraft: (entity, data) => set((state) => ({
        drafts: {
          ...state.drafts,
          [entity]: { ...state.drafts[entity], ...data },
        },
        isDirty: true,
      })),

      clearDrafts: () => set({ drafts: {}, isDirty: false }),

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) => set((state) => ({
        completedSteps: [...new Set([...state.completedSteps, step])],
      })),

      markDirty: () => set({ isDirty: true }),
      markSaved: () => set({ isDirty: false, lastSaved: new Date() }),
      reset: () => set({
        songId: null,
        drafts: {},
        currentStep: 0,
        completedSteps: [],
        isDirty: false,
        lastSaved: null,
      }),
    }),
    {
      name: 'song-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        isDirty: state.isDirty,
        lastSaved: state.lastSaved,
        // Don't persist songId or step state (reset on reload)
      }),
    }
  )
);
```

#### 4.2.2 Workflow Store (WebSocket State)

```tsx
// apps/web/src/stores/workflow.ts
import { create } from 'zustand';

interface WorkflowState {
  // WebSocket connection
  isConnected: boolean;
  connectionError: string | null;

  // Active workflow runs (keyed by run_id)
  activeRuns: Map<string, {
    songId: string;
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
    currentNode?: string;
    nodes: Map<string, WorkflowNode>;
    events: WorkflowEvent[];
    lastUpdate: Date;
  }>;
}

interface WorkflowActions {
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  addRun: (runId: string, songId: string) => void;
  updateRunStatus: (runId: string, status: any) => void;
  updateNodeStatus: (runId: string, nodeId: string, status: any) => void;
  addEvent: (runId: string, event: WorkflowEvent) => void;
  clearRun: (runId: string) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState & WorkflowActions>((set) => ({
  // Initial state
  isConnected: false,
  connectionError: null,
  activeRuns: new Map(),

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),

  addRun: (runId, songId) => set((state) => {
    const newRuns = new Map(state.activeRuns);
    newRuns.set(runId, {
      songId,
      status: 'queued',
      nodes: new Map(),
      events: [],
      lastUpdate: new Date(),
    });
    return { activeRuns: newRuns };
  }),

  updateRunStatus: (runId, status) => set((state) => {
    const newRuns = new Map(state.activeRuns);
    const run = newRuns.get(runId);
    if (run) {
      newRuns.set(runId, { ...run, ...status, lastUpdate: new Date() });
    }
    return { activeRuns: newRuns };
  }),

  updateNodeStatus: (runId, nodeId, status) => set((state) => {
    const newRuns = new Map(state.activeRuns);
    const run = newRuns.get(runId);
    if (run) {
      const newNodes = new Map(run.nodes);
      newNodes.set(nodeId, { ...newNodes.get(nodeId), ...status });
      newRuns.set(runId, { ...run, nodes: newNodes, lastUpdate: new Date() });
    }
    return { activeRuns: newRuns };
  }),

  addEvent: (runId, event) => set((state) => {
    const newRuns = new Map(state.activeRuns);
    const run = newRuns.get(runId);
    if (run) {
      newRuns.set(runId, {
        ...run,
        events: [...run.events, event],
        lastUpdate: new Date(),
      });
    }
    return { activeRuns: newRuns };
  }),

  clearRun: (runId) => set((state) => {
    const newRuns = new Map(state.activeRuns);
    newRuns.delete(runId);
    return { activeRuns: newRuns };
  }),

  reset: () => set({
    isConnected: false,
    connectionError: null,
    activeRuns: new Map()
  }),
}));
```

### 4.3 React Query Configuration

Preserve MP query client config with domain-specific stale times:

```tsx
// apps/web/src/lib/api/client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 min default
      gcTime: 1000 * 60 * 10,        // 10 min
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
      structuralSharing: true,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});
```

**Entity-specific stale times**:
- Songs: 30s (frequently updated during workflows)
- Entities (Style/Lyrics/Persona): 2 min (moderately updated)
- Blueprints: 5 min (rarely change)
- Workflow runs: 10s during active run, 5 min after completion

### 4.4 Query Key Structure

Follow MP hierarchical pattern:

```tsx
// apps/web/src/hooks/queries/useSongs.ts
export const songQueryKeys = {
  all: ['songs'] as const,
  lists: () => [...songQueryKeys.all, 'list'] as const,
  list: (filters?: SongFilters) => [...songQueryKeys.lists(), filters] as const,
  details: () => [...songQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...songQueryKeys.details(), id] as const,

  // Entity relations
  entities: (id: string) => [...songQueryKeys.detail(id), 'entities'] as const,
  entity: (id: string, type: string) => [...songQueryKeys.entities(id), type] as const,

  // Workflow runs
  runs: (id: string) => [...songQueryKeys.detail(id), 'runs'] as const,
  run: (id: string, runId: string) => [...songQueryKeys.runs(id), runId] as const,
};
```

---

## 5. WebSocket Integration

### 5.1 WebSocket Architecture

Real-time workflow events require a robust WebSocket layer. Follow MeatyPrompts observability patterns but add workflow-specific features.

**Connection Endpoint**: `ws://api.meatymusic.local/events`

**Event Format** (from `claude_code_orchestration.prd.md`):
```json
{
  "ts": "2025-11-11T13:00:00Z",
  "run_id": "uuid",
  "node": "LYRICS",
  "phase": "start|end|fail",
  "duration_ms": 1234,
  "metrics": {...},
  "issues": [...]
}
```

### 5.2 WebSocket Hook

```tsx
// apps/web/src/hooks/useWorkflowWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useWorkflowStore } from '@/stores/workflow';
import { useQueryClient } from '@tanstack/react-query';
import { songQueryKeys } from './queries/useSongs';

export interface WorkflowEvent {
  ts: string;
  run_id: string;
  node: string;
  phase: 'start' | 'end' | 'fail';
  duration_ms?: number;
  metrics?: Record<string, any>;
  issues?: any[];
}

interface UseWorkflowWebSocketOptions {
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  onEvent?: (event: WorkflowEvent) => void;
  onError?: (error: Error) => void;
}

export function useWorkflowWebSocket(options: UseWorkflowWebSocketOptions = {}) {
  const {
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onEvent,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const { setConnected, setConnectionError, updateRunStatus, updateNodeStatus, addEvent } = useWorkflowStore();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/events';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WorkflowEvent = JSON.parse(event.data);

          // Update workflow store
          addEvent(data.run_id, data);

          // Update node status based on phase
          if (data.phase === 'start') {
            updateNodeStatus(data.run_id, data.node, {
              status: 'running',
              started_at: new Date(data.ts),
            });
          } else if (data.phase === 'end') {
            updateNodeStatus(data.run_id, data.node, {
              status: 'success',
              completed_at: new Date(data.ts),
              duration_ms: data.duration_ms,
            });
          } else if (data.phase === 'fail') {
            updateNodeStatus(data.run_id, data.node, {
              status: 'failed',
              completed_at: new Date(data.ts),
              error: data.issues?.[0] || 'Unknown error',
            });
          }

          // Invalidate relevant queries
          queryClient.invalidateQueries({
            queryKey: songQueryKeys.runs(data.run_id),
          });

          // Call custom handler
          onEvent?.(data);

        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        const errorObj = new Error('WebSocket connection error');
        setConnectionError(errorObj.message);
        onError?.(errorObj);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);
        wsRef.current = null;

        // Attempt reconnect
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`[WebSocket] Reconnecting (attempt ${reconnectAttemptsRef.current})...`);
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
        } else {
          setConnectionError('Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setConnectionError((error as Error).message);
      onError?.(error as Error);
    }
  }, [enabled, reconnectDelay, maxReconnectAttempts, setConnected, setConnectionError, updateNodeStatus, addEvent, queryClient, onEvent, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected: useWorkflowStore((state) => state.isConnected),
    connectionError: useWorkflowStore((state) => state.connectionError),
    disconnect,
    reconnect: connect,
  };
}
```

### 5.3 WebSocket Usage in Components

```tsx
// apps/web/src/app/(app)/songs/[id]/workflow/page.tsx
'use client';

import { useWorkflowWebSocket } from '@/hooks/useWorkflowWebSocket';
import { useWorkflowStore } from '@/stores/workflow';

export default function WorkflowPage({ params }: { params: { id: string } }) {
  const { isConnected, connectionError } = useWorkflowWebSocket({
    enabled: true,
    onEvent: (event) => {
      console.log('[Workflow Event]', event);
      // Optional: Show toast notification for key events
    },
  });

  const activeRun = useWorkflowStore((state) =>
    Array.from(state.activeRuns.values()).find(run => run.songId === params.id)
  );

  return (
    <div>
      {!isConnected && (
        <Alert variant="warning">
          WebSocket disconnected. Workflow updates may be delayed.
        </Alert>
      )}

      {activeRun && (
        <WorkflowGraphVisualization run={activeRun} />
      )}
    </div>
  );
}
```

---

## 6. API Client Patterns

### 6.1 API Client Structure

Preserve MP axios client pattern with domain-specific namespaces:

```tsx
// apps/web/src/lib/api/songs.ts
export const songsApi = {
  list: async (filters?: SongFilters): Promise<SongListResponse> => { ... },
  get: async (id: string): Promise<Song> => { ... },
  create: async (data: SongCreate): Promise<Song> => { ... },
  update: async (id: string, data: SongUpdate): Promise<Song> => { ... },
  delete: async (id: string): Promise<void> => { ... },

  // Entity management
  getEntities: async (id: string): Promise<SongEntities> => { ... },
  updateEntity: async (id: string, entity: 'style' | 'lyrics' | 'persona' | 'producer', data: any): Promise<any> => { ... },

  // Workflow operations
  startWorkflow: async (id: string, config: WorkflowConfig): Promise<WorkflowRun> => { ... },
  getWorkflowRuns: async (id: string, filters?: RunFilters): Promise<WorkflowRunList> => { ... },
  getWorkflowRun: async (id: string, runId: string): Promise<WorkflowRun> => { ... },
  cancelWorkflowRun: async (id: string, runId: string): Promise<void> => { ... },
};
```

### 6.2 React Query Hooks

```tsx
// apps/web/src/hooks/queries/useSongs.ts
export function useSongs(filters?: SongFilters) {
  return useQuery({
    queryKey: songQueryKeys.list(filters),
    queryFn: () => songsApi.list(filters),
    staleTime: 30 * 1000,  // 30s for active songs
  });
}

export function useSong(id: string | undefined) {
  return useQuery({
    queryKey: songQueryKeys.detail(id!),
    queryFn: () => songsApi.get(id!),
    enabled: !!id,
  });
}

// apps/web/src/hooks/mutations/useSongMutations.ts
export function useCreateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SongCreate) => songsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songQueryKeys.lists() });
    },
  });
}

export function useStartWorkflow() {
  const queryClient = useQueryClient();
  const { addRun } = useWorkflowStore();

  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: WorkflowConfig }) =>
      songsApi.startWorkflow(id, config),
    onSuccess: (run) => {
      // Add to active runs in workflow store
      addRun(run.id, run.song_id);

      // Invalidate song and runs queries
      queryClient.invalidateQueries({ queryKey: songQueryKeys.detail(run.song_id) });
      queryClient.invalidateQueries({ queryKey: songQueryKeys.runs(run.song_id) });
    },
  });
}
```

### 6.3 Optimistic Updates

Follow MP pattern for optimistic UI updates:

```tsx
export function useUpdateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SongUpdate }) =>
      songsApi.update(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: songQueryKeys.detail(id) });

      // Snapshot previous value
      const previousSong = queryClient.getQueryData<Song>(songQueryKeys.detail(id));

      // Optimistically update cache
      if (previousSong) {
        queryClient.setQueryData<Song>(songQueryKeys.detail(id), {
          ...previousSong,
          ...data,
        });
      }

      return { previousSong };
    },

    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousSong) {
        queryClient.setQueryData(songQueryKeys.detail(id), context.previousSong);
      }
    },

    onSuccess: (_newSong, { id }) => {
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: songQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: songQueryKeys.lists() });
    },
  });
}
```

---

## 7. Component Inventory

### 7.1 Preserve As-Is (70%)

Components that require minimal or no changes:

| Component | Location | Purpose | Changes |
|-----------|----------|---------|---------|
| `AppShell` | `layouts/AppShell.tsx` | Main layout container | None |
| `AppSidebar` | `layouts/AppSidebar.tsx` | Sidebar navigation | Update nav items |
| `Header` | `layouts/Header.tsx` | Top bar | None |
| `Card` | `@meaty/ui/Card` | Base card component | None |
| `Badge` | `@meaty/ui/Badge` | Status badges | None |
| `Button` | `@meaty/ui/Button` | Action buttons | None |
| `EmptyState` | `@meaty/ui/EmptyState` | Empty state display | None |
| `LoadingStates` | `shared/LoadingStates` | Loading skeletons | None |
| `BulkActionBar` | `prompts/BulkActionBar` | Bulk actions toolbar | Adapt actions |
| `ActiveFilterChips` | `prompts/ActiveFilterChips` | Active filters display | None |
| `StatusBadge` | `runs/StatusBadge` | Run status badge | Adapt for workflow nodes |

### 7.2 Adapt (20%)

Components requiring moderate changes:

| Component | New Name | Key Adaptations |
|-----------|----------|-----------------|
| `PromptCard` | `SongCard` | Add workflow state, genre/mood display, entity links |
| `PromptList` | `SongList` | Update filters, empty states |
| `PromptCardWrapper` | `SongCardWrapper` | Update navigation, click handlers |
| `RunHistoryList` | `WorkflowRunList` | Display workflow nodes, scores |
| `RunHistoryItem` | `WorkflowRunItem` | Show node status, fix attempts |
| `RunDetail` | `WorkflowNodeDetail` | Display node outputs, artifacts |
| `RunMetadata` | `WorkflowMetadata` | Add node metrics, citations |

### 7.3 Create New (10%)

New components for AMCS workflows:

| Component | Purpose | Complexity | Priority |
|-----------|---------|------------|----------|
| `SongWizard` | Multi-step song creation | High | High |
| `StyleEditor` | Style spec form | Medium | High |
| `LyricsEditor` | Lyrics with sections | High | High |
| `PersonaSelector` | Persona picker | Medium | High |
| `ProducerNotesEditor` | Producer notes form | Medium | Medium |
| `WorkflowGraphVisualization` | DAG status display | High | Medium |
| `WorkflowNodeIndicator` | Node status icon | Low | High |
| `ArtifactViewer` | Preview generated outputs | Medium | Medium |
| `BlueprintRubricDisplay` | Validation scores | Low | Low |
| `EntityLinkCard` | Entity summary card | Low | Medium |
| `SongDashboardWidget` | Recent songs widget | Low | Medium |

---

## 8. Design Patterns

### 8.1 Component Composition

Preserve MP component composition patterns:

**Example: SongCard Sections**
```tsx
// Follow PromptCard pattern with sections/
<SongCard>
  <Header title={song.title} genre={song.genre} />
  <MetaStrip moods={song.moods} status={song.status} />
  <EntitySummary entities={song.entities} />
  <WorkflowProgress state={song.workflowState} />
  <Actions onViewWorkflow={...} onEdit={...} />
</SongCard>
```

### 8.2 Hook Patterns

**Custom Hooks Structure**:
```
hooks/
├── queries/                # React Query hooks
│   ├── useSongs.ts
│   ├── useStyles.ts
│   ├── useLyrics.ts
│   ├── usePersonas.ts
│   └── useWorkflowRuns.ts
├── mutations/              # Mutation hooks
│   ├── useSongMutations.ts
│   ├── useStyleMutations.ts
│   └── useWorkflowMutations.ts
├── useWorkflowWebSocket.ts # WebSocket hook
├── useBulkSelection.ts     # Bulk selection logic (preserve MP)
└── useSongFilters.ts       # URL-based filter management
```

### 8.3 Form Patterns

Use `react-hook-form` + Zod (MP pattern):

```tsx
// apps/web/src/components/songs/SongWizard/steps/StyleEditorStep.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { styleSchema } from '@/schemas/style';

export function StyleEditorStep() {
  const form = useForm<StyleInput>({
    resolver: zodResolver(styleSchema),
    defaultValues: { ... },
  });

  return (
    <Form {...form}>
      <FormField name="genre" control={form.control} render={...} />
      <FormField name="tempo_min" control={form.control} render={...} />
      {/* ... */}
    </Form>
  );
}
```

### 8.4 Error Handling

Preserve MP error boundary and toast patterns:

```tsx
// Error boundaries for component-level errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <SongWizard />
</ErrorBoundary>

// Toast notifications for action feedback
import { toast } from '@meaty/ui/toast';

const { mutate } = useStartWorkflow();
mutate(
  { id: songId, config },
  {
    onSuccess: () => toast.success('Workflow started'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
  }
);
```

### 8.5 Accessibility

Maintain MP accessibility standards:

- **Keyboard Navigation**: All interactive elements have keyboard shortcuts
- **ARIA Labels**: Descriptive labels for screen readers
- **Focus Management**: Proper focus trap in modals
- **Live Regions**: Status updates announced via `aria-live`
- **Color Contrast**: WCAG AA compliance (4.5:1 for text)

---

## 9. Implementation Roadmap

### Wave 2A: Core Song Management (Week 1)

**Goal**: Basic song CRUD with simplified UI

- [ ] Create `SongCard` component (adapted from `PromptCard`)
- [ ] Create `SongList` component with filters
- [ ] Implement song API client (`songs.ts`)
- [ ] Create React Query hooks (`useSongs`, `useSong`)
- [ ] Create mutation hooks (`useCreateSong`, `useUpdateSong`)
- [ ] Set up routing (`/songs`, `/songs/[id]`)
- [ ] Create basic `SongDetailClient` page
- [ ] Add sidebar navigation items

**Acceptance**:
- Can create, view, edit, delete songs
- Song list displays with filters (genre, mood, status)
- Bulk actions work (archive, delete)

### Wave 2B: Entity Editors (Week 2)

**Goal**: Style, Lyrics, Persona editors functional

- [ ] Create `StyleEditor` component
- [ ] Create `LyricsEditor` component (with section management)
- [ ] Create `PersonaSelector` component
- [ ] Create `ProducerNotesEditor` component
- [ ] Implement entity API clients
- [ ] Create entity React Query hooks
- [ ] Set up entity routes (`/styles`, `/lyrics`, `/personas`)
- [ ] Integrate editors into `SongWizard`

**Acceptance**:
- Can create and edit Style specs
- Can create and edit Lyrics with sections
- Can select/create Personas
- Can create and edit Producer Notes

### Wave 2C: Workflow Integration (Week 3)

**Goal**: Workflow execution and visualization

- [ ] Implement `useWorkflowWebSocket` hook
- [ ] Create `useWorkflowStore` Zustand store
- [ ] Create `WorkflowGraphVisualization` component
- [ ] Create `WorkflowRunList` component
- [ ] Create `WorkflowNodeDetail` component
- [ ] Implement workflow API client
- [ ] Create workflow mutation hooks (`useStartWorkflow`)
- [ ] Add workflow routes (`/songs/[id]/workflow`, `/songs/[id]/runs`)
- [ ] Integrate WebSocket events into UI

**Acceptance**:
- Can start workflows from song detail page
- Workflow progress updates in real-time
- Can view workflow graph with node status
- Can view workflow run history
- Can view node-level details and artifacts

### Wave 2D: Polish & Optimization (Week 4)

**Goal**: Production-ready UI with optimizations

- [ ] Add loading skeletons for all components
- [ ] Implement error boundaries
- [ ] Add optimistic updates for mutations
- [ ] Optimize React Query cache strategies
- [ ] Add toast notifications for all actions
- [ ] Implement keyboard shortcuts
- [ ] Add accessibility audit (a11y testing)
- [ ] Add E2E tests for critical flows
- [ ] Performance audit (Lighthouse)
- [ ] Add analytics tracking

**Acceptance**:
- All components have loading states
- All mutations have optimistic updates
- No console errors or warnings
- Lighthouse score > 90
- All critical flows have E2E coverage
- Accessibility audit passes

---

## Appendices

### A. Component File Structure

```
apps/web/src/components/
├── songs/                          # Song-specific components
│   ├── SongCard.tsx
│   ├── SongList.tsx
│   ├── SongCardWrapper.tsx
│   ├── SongWizard/
│   │   ├── SongWizard.tsx
│   │   ├── steps/
│   │   │   ├── SongInfoStep.tsx
│   │   │   ├── StyleEditorStep.tsx
│   │   │   ├── LyricsEditorStep.tsx
│   │   │   ├── PersonaSelectorStep.tsx
│   │   │   ├── ProducerNotesStep.tsx
│   │   │   └── ReviewStep.tsx
│   │   └── types.ts
│   └── filters/
│       ├── GenreFilter.tsx
│       ├── MoodFilter.tsx
│       └── StatusFilter.tsx
├── styles/                         # Style editor components
│   ├── StyleEditor.tsx
│   ├── StyleCard.tsx
│   └── StyleList.tsx
├── lyrics/                         # Lyrics editor components
│   ├── LyricsEditor.tsx
│   ├── SectionEditor.tsx
│   └── LyricsCard.tsx
├── personas/                       # Persona components
│   ├── PersonaSelector.tsx
│   ├── PersonaCard.tsx
│   └── PersonaList.tsx
├── producer/                       # Producer notes components
│   ├── ProducerNotesEditor.tsx
│   └── StructureBuilder.tsx
├── workflows/                      # Workflow visualization
│   ├── WorkflowGraphVisualization.tsx
│   ├── WorkflowNodeIndicator.tsx
│   ├── WorkflowRunList.tsx
│   ├── WorkflowRunItem.tsx
│   └── WorkflowNodeDetail.tsx
├── artifacts/                      # Artifact viewers
│   ├── ArtifactViewer.tsx
│   └── ArtifactPreview.tsx
├── layouts/                        # Layouts (preserve MP)
│   ├── AppShell.tsx
│   ├── AppSidebar.tsx
│   └── Header.tsx
└── shared/                         # Shared components (preserve MP)
    ├── LoadingStates.tsx
    ├── EmptyState.tsx
    └── ErrorFallback.tsx
```

### B. Type Definitions

```tsx
// apps/web/src/types/songs.ts
export interface Song {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  genre: string;
  mood: string[];
  status: 'draft' | 'processing' | 'complete' | 'failed';
  created_at: Date;
  updated_at: Date;

  // Entity references
  style_id?: string;
  lyrics_id?: string;
  persona_id?: string;
  producer_notes_id?: string;

  // Workflow state
  current_workflow_run_id?: string;
  last_workflow_status?: 'queued' | 'running' | 'success' | 'failed';
  workflow_progress?: number;
}

export interface SongCreate {
  name: string;
  description?: string;
  genre: string;
  mood?: string[];
}

export interface SongUpdate {
  name?: string;
  description?: string;
  genre?: string;
  mood?: string[];
  status?: 'draft' | 'processing' | 'complete' | 'failed';
}

export interface SongFilters {
  q?: string;
  genres?: string[];
  moods?: string[];
  status?: ('draft' | 'processing' | 'complete' | 'failed')[];
  hasStyle?: boolean;
  hasLyrics?: boolean;
  hasPersona?: boolean;
  favorite?: boolean;
  archived?: boolean;
  cursor?: string;
  limit?: number;
}

export interface WorkflowRun {
  id: string;
  song_id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  nodes: WorkflowNode[];
  artifacts?: WorkflowArtifacts;
  scores?: Record<string, number>;
  fix_attempts?: number;
}

export interface WorkflowNode {
  id: 'PLAN' | 'STYLE' | 'LYRICS' | 'PRODUCER' | 'COMPOSE' | 'VALIDATE' | 'FIX' | 'RENDER' | 'REVIEW';
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  error?: string;
}

export interface WorkflowArtifacts {
  plan?: any;
  style?: any;
  lyrics?: any;
  producer_notes?: any;
  composed_prompt?: any;
  render_job?: any;
}
```

### C. References

**MeatyPrompts Files Referenced**:
- `/apps/web/src/components/prompts/PromptList.tsx`
- `/apps/web/src/hooks/queries/usePrompts.ts`
- `/apps/web/src/lib/api/prompts.ts`
- `/apps/web/src/lib/api/client.ts`
- `/apps/web/src/stores/editorStore.ts`
- `/apps/web/src/app/(app)/layout.tsx`
- `/apps/web/src/components/layouts/AppShell.tsx`
- `/packages/ui/src/components/PromptCard/PromptCard.tsx`

**MeatyMusic PRDs Referenced**:
- `/docs/project_plans/PRDs/website_app.prd.md`
- `/docs/project_plans/PRDs/claude_code_orchestration.prd.md`
- `/docs/project_plans/PRDs/style.prd.md`
- `/docs/project_plans/PRDs/lyrics.prd.md`
- `/docs/project_plans/PRDs/persona.prd.md`

**Architecture Patterns**:
- React Query: https://tanstack.com/query/latest/docs/react/overview
- Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction
- Next.js App Router: https://nextjs.org/docs/app/building-your-application/routing
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## Changelog

- **2025-11-13**: Initial draft created
- **Wave 2 Start**: Review and update based on implementation feedback

---

**Approval Status**: Pending Wave 2 review

**Next Steps**: Begin Wave 2A implementation following this architecture.
