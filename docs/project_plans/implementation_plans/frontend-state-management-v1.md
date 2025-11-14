# Implementation Plan: Frontend State Management Stores (WP-N5)

**Status**: Ready for Implementation
**Complexity**: Medium (M)
**Estimated Effort**: 13 Story Points (3-5 days)
**Timeline**: 1 week (including testing)
**Track**: Standard (Haiku + Sonnet agents)
**Priority**: High
**Assigned To**: frontend-developer, ui-engineer-enhanced

---

## Executive Summary

This implementation plan defines the domain-specific Zustand stores for MeatyMusic frontend state management. Building on the existing preferences and onboarding stores, we will implement stores for songs, workflows, and entities that integrate seamlessly with React Query and provide optimistic updates, caching, and persistence.

**Key Objectives**:
1. Create domain-specific stores with clear separation of concerns
2. Integrate with existing React Query infrastructure for server state
3. Implement optimistic updates for improved UX
4. Persist cache to localStorage with conflict resolution
5. Enable real-time synchronization with API and WebSocket events

**Expected Outcomes**:
- 4 new Zustand stores (songs, workflows, selected-song, entity caches)
- Seamless integration with React Query
- Type-safe store hooks with TypeScript generics
- >70% unit test coverage
- localStorage persistence with automatic hydration

---

## Current State Analysis

### What Exists
- ✅ Zustand infrastructure: setup, middleware framework, types
- ✅ localStorage middleware: hydration, debounced persistence
- ✅ API sync middleware: retry logic, correlation tracking
- ✅ Preferences store: theme, notifications (reference pattern)
- ✅ React Query hooks: API client with type-safe methods
- ✅ Existing entity types: all entities strongly typed

### What's Missing
- ❌ Song stores (list, filters, sorting, selection)
- ❌ Workflow stores (runs cache, progress tracking)
- ❌ Entity caching stores (styles, lyrics, personas)
- ❌ React Query integration hooks (mutations + store updates)
- ❌ Store-to-store synchronization logic
- ❌ Cache invalidation strategies

### Known Constraints
- Zustand v4 with devtools and middleware support
- localStorage 10MB quota per domain
- Must handle multi-tab synchronization
- Optimistic updates must be reversible
- No server-side session state

---

## Architecture Design

### Store Organization Pattern

```
packages/store/src/
├── songs.ts                      # Song CRUD store + filters
├── workflows.ts                  # Workflow runs + progress
├── entities.ts                   # Style, Lyrics, Persona caches
├── stores/
│   ├── preferencesStore.ts       # (existing)
│   ├── onboardingStore.ts        # (existing)
│   ├── songsStore.ts             # Store implementation
│   ├── workflowsStore.ts         # Store implementation
│   └── entitiesStore.ts          # Store implementation
├── middleware/
│   ├── localStorageMiddleware.ts # (existing, reused)
│   ├── apiSyncMiddleware.ts      # (existing, reused)
│   └── queryIntegrationMiddleware.ts  # NEW: React Query sync
├── hooks/
│   ├── useSongsMutations.ts      # Create, update, delete song
│   ├── useWorkflowMutations.ts   # Create, cancel, retry run
│   └── useEntityMutations.ts     # Generic entity CRUD mutations
├── types.ts                      # (expand with domain types)
├── utils.ts                      # (expand with cache helpers)
└── __tests__/
    ├── songs.test.ts
    ├── workflows.test.ts
    ├── entities.test.ts
    ├── queryIntegration.test.ts
    └── middleware.test.ts
```

### Architectural Patterns

#### 1. Store State Layers
```
Store Layer (Client State)
  ├── Entity Caches
  │   ├── Normalized data (keyed by ID)
  │   ├── Metadata (loading, error, lastUpdated)
  │   └── Selection state (currentId, selectedIds[])
  │
  ├── List State
  │   ├── Paginated items []
  │   ├── Pagination metadata (page, limit, total)
  │   ├── Filters (applied, dirty)
  │   ├── Sorting (field, direction)
  │   └── Search query
  │
  ├── Operation State
  │   ├── Loading flags (global, per-id)
  │   ├── Error state (global, per-id)
  │   └── Optimistic updates (staged, rolled back)
  │
  └── UI State
      ├── Visibility toggles
      ├── Expanded sections
      └── Comparison selections
```

#### 2. React Query Integration Strategy
```
React Query (Server State)
  ├── Queries: useSongsQuery, useStylesQuery, etc.
  │   └── On success → store.setItems(data)
  │
  ├── Mutations: useCreateSongMutation, etc.
  │   ├── Before: store.addOptimisticItem(data)
  │   ├── On success: store.updateItem(response)
  │   └── On error: store.rollbackOptimistic(id)
  │
  └── Invalidation: onSettled, refetchOnWindowFocus
      └── Triggers store cache invalidation
```

#### 3. Synchronization Across Tabs
```
Browser Storage Events
  ├── Detect change in Tab A
  └── Sync to Tab B via:
      ├── localStorage change event
      ├── Parse new state
      └── Merge if local changes pending
```

### Middleware Composition Order

```
Create Store
  ↓
1. devtools() middleware
  ↓
2. queryIntegrationMiddleware() - intercept mutations
  ↓
3. createApiSyncMiddleware() - sync to server
  ↓
4. createLocalStorageMiddleware() - persist to localStorage
  ↓
Store ready for consumption
```

---

## Detailed Store Specifications

### Store 1: Songs Store

**Purpose**: Manage song CRUD, list filtering, sorting, and selection state.

**Location**: `packages/store/src/stores/songsStore.ts`

#### State Interface

```typescript
interface SongsListState {
  items: Map<string, Song>;           // Normalized by ID
  allIds: string[];                   // Order for pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    search: string;                   // Search query
    createdAfter?: string;           // ISO date filter
    status?: 'draft' | 'completed';  // Status filter
    isApplied: boolean;               // Whether filters are active
    isDirty: boolean;                 // Whether filters differ from query params
  };
  sorting: {
    field: 'title' | 'createdAt' | 'updatedAt';
    direction: 'asc' | 'desc';
  };
  loading: boolean;                   // List loading
  error: Error | null;
  lastUpdated: number | null;
}

interface SongsSelectionState {
  selectedId: string | null;          // Currently selected song ID
  selectedIds: string[];              // Multi-select IDs
  isComparing: boolean;
}

interface SongsOptimisticState {
  stagedItems: Map<string, Song>;    // Not yet committed
  stagedRemovals: string[];           // IDs marked for deletion
  stagedUpdates: Map<string, Partial<Song>>; // Pending changes
}

type SongsStore = SongsListState & SongsSelectionState & SongsOptimisticState & SongsActions;
```

#### Actions Interface

```typescript
interface SongsActions {
  // Queries (synced from React Query)
  setItems: (items: Song[], pagination: PaginationMeta) => void;
  setError: (error: Error | null) => void;
  setLoading: (loading: boolean) => void;

  // Filters
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SongsListState['filters']>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  revertFilters: () => void;

  // Sorting
  setSorting: (field: keyof Omit<SongsListState['sorting'], 'direction'>, direction?: 'asc' | 'desc') => void;

  // Pagination
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Selection
  selectSong: (id: string | null) => void;
  toggleMultiSelect: (id: string) => void;
  clearSelection: () => void;
  setComparisonMode: (enabled: boolean) => void;

  // Optimistic operations
  addOptimisticSong: (song: Song) => void;
  updateOptimisticSong: (id: string, updates: Partial<Song>) => void;
  removeOptimisticSong: (id: string) => void;
  commitOptimistic: (id: string) => void;
  rollbackOptimistic: (id: string) => void;

  // Cache control
  invalidate: () => void;
  clear: () => void;
  reset: () => void;
}
```

#### Selectors (Memoized)

```typescript
// Hook exports for component consumption
export const useSongs = () => useSongsStore((s) => s.items);
export const useSongsIds = () => useSongsStore((s) => s.allIds);
export const useSongById = (id: string | null) =>
  useSongsStore((s) => id ? s.items.get(id) : null);
export const useSongsFilters = () => useSongsStore((s) => ({
  search: s.filters.search,
  createdAfter: s.filters.createdAfter,
  status: s.filters.status,
}));
export const useSongsLoading = () => useSongsStore((s) => s.loading);
export const useSongsError = () => useSongsStore((s) => s.error);
export const useSongsSelectedId = () => useSongsStore((s) => s.selectedId);
export const useSongsPagination = () => useSongsStore((s) => s.pagination);
```

#### Integration Points

**With React Query**:
```typescript
// In useApi hook (app/src/lib/api/client.ts)
const { data } = useSongsQuery(filters, page);
useEffect(() => {
  if (data) {
    songsStore.setItems(data.items, data.pagination);
    songsStore.setError(null);
  }
}, [data]);
```

**With WebSocket Events**:
```typescript
// Listen for real-time updates
useWorkflowEvents('song-updated', (event) => {
  if (event.songId) {
    songsStore.invalidate();  // Refetch from server
  }
});
```

#### Persistence Strategy

**localStorage Key**: `meatymusic-songs-list`

**What to Persist**:
- `items` (Map → JSON)
- `filters` (except isDirty)
- `sorting`
- `pagination` (except dynamic state)
- `selectedId`

**What NOT to Persist**:
- `loading`, `error` (reset on hydration)
- `stagedItems`, `stagedRemovals` (clear on reload)

**Hydration Logic**:
```typescript
// On store init, check localStorage
// If <5 minutes old: restore with optimistic sync
// If >5 minutes old: ignore (triggers refresh from server)
```

---

### Store 2: Workflows Store

**Purpose**: Cache workflow runs, track progress, and manage execution state.

**Location**: `packages/store/src/stores/workflowsStore.ts`

#### State Interface

```typescript
interface WorkflowRun {
  id: string;
  songId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentNode: string;
  progress: number;                   // 0-100
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

interface WorkflowsListState {
  items: Map<string, WorkflowRun>;
  allIds: string[];
  filters: {
    status?: WorkflowRun['status'];
    songId?: string;
  };
  sorting: {
    field: 'startedAt' | 'completedAt';
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  loading: boolean;
  error: Error | null;
}

interface WorkflowProgressState {
  activeRunId: string | null;
  nodeEvents: Map<string, WorkflowEvent[]>;  // Keyed by run ID
  scores: Map<string, ScoreSummary>;         // Keyed by run ID
  artifacts: Map<string, ArtifactMap>;       // Keyed by run ID
}

interface WorkflowOptimisticState {
  cancelledRunIds: Set<string>;              // Optimistic cancellations
  retryingNodes: Map<string, string>;        // Run ID → Node ID retrying
}

type WorkflowsStore = WorkflowsListState & WorkflowProgressState &
                      WorkflowOptimisticState & WorkflowsActions;
```

#### Actions Interface

```typescript
interface WorkflowsActions {
  // Queries
  setRuns: (runs: WorkflowRun[]) => void;
  setRunDetails: (runId: string, details: Partial<WorkflowRun>) => void;
  setNodeEvent: (runId: string, event: WorkflowEvent) => void;
  setScores: (runId: string, scores: ScoreSummary) => void;
  setArtifacts: (runId: string, artifacts: ArtifactMap) => void;

  // Filters & Sorting
  setWorkflowFilters: (filters: Partial<WorkflowsListState['filters']>) => void;
  setWorkflowSorting: (field: 'startedAt' | 'completedAt', direction?: 'asc' | 'desc') => void;

  // Progress tracking
  trackRunProgress: (runId: string, progress: number, currentNode: string) => void;
  trackNodeEvent: (runId: string, event: WorkflowEvent) => void;
  clearRunDetails: (runId: string) => void;

  // Optimistic operations
  optimisticCancel: (runId: string) => void;
  commitCancel: (runId: string) => void;
  rollbackCancel: (runId: string) => void;
  optimisticRetry: (runId: string, nodeId: string) => void;
  commitRetry: (runId: string, nodeId: string) => void;

  // Cache control
  invalidateRuns: () => void;
  invalidateRunDetails: (runId: string) => void;
  clear: () => void;
}
```

#### WebSocket Integration

```typescript
// Auto-subscribe to workflow events
useWorkflowEvents('run-event', (event) => {
  const { runId, node, phase, duration, metrics, issues } = event;

  workflowsStore.trackNodeEvent(runId, {
    node,
    phase,
    timestamp: new Date().toISOString(),
    duration,
    metrics,
    issues,
  });

  // Auto-update progress
  if (phase === 'end') {
    // Calculate progress from completed nodes
    const progress = calculateProgress(events);
    workflowsStore.trackRunProgress(runId, progress, node);
  }
});
```

#### Persistence Strategy

**localStorage Key**: `meatymusic-workflows-progress`

**What to Persist**:
- `activeRunId`
- `filters`
- `sorting`

**What NOT to Persist**:
- `items` (fetch fresh from API)
- `nodeEvents` (only keep in memory during active run)
- `scores`, `artifacts` (fetch from API)
- Optimistic state (always reset)

---

### Store 3: Entities Store

**Purpose**: Cache entity specs (styles, lyrics, personas) with deduplication and conflict tracking.

**Location**: `packages/store/src/stores/entitiesStore.ts`

#### State Interface

```typescript
interface EntityCache<T> {
  items: Map<string, T>;
  allIds: string[];
  metadata: {
    lastUpdated: number;
    version: string;  // Cache version for invalidation
  };
  loading: boolean;
  error: Error | null;
}

interface EntitiesState {
  styles: EntityCache<Style>;
  lyrics: EntityCache<Lyrics>;
  personas: EntityCache<Persona>;
  producerNotes: EntityCache<ProducerNotes>;
  sources: EntityCache<Source>;

  // Selection state
  selectedStyleId: string | null;
  selectedLyricsId: string | null;
  selectedPersonaId: string | null;

  // Recent access tracking
  recentEntities: {
    styleIds: string[];
    lyricsIds: string[];
    personaIds: string[];
  };
}

type EntitiesStore = EntitiesState & EntitiesActions;
```

#### Actions Interface

```typescript
interface EntitiesActions {
  // Style operations
  setStyles: (styles: Style[]) => void;
  addStyle: (style: Style) => void;
  updateStyle: (id: string, updates: Partial<Style>) => void;
  removeStyle: (id: string) => void;
  selectStyle: (id: string | null) => void;

  // Lyrics operations
  setLyrics: (items: Lyrics[]) => void;
  addLyrics: (lyrics: Lyrics) => void;
  updateLyrics: (id: string, updates: Partial<Lyrics>) => void;
  removeLyrics: (id: string) => void;
  selectLyrics: (id: string | null) => void;

  // Persona operations
  setPersonas: (personas: Persona[]) => void;
  addPersona: (persona: Persona) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  removePersona: (id: string) => void;
  selectPersona: (id: string | null) => void;

  // Generic operations
  setEntityCache: <K extends EntityType>(
    type: K,
    items: EntityMap[K][]
  ) => void;
  invalidateEntityType: <K extends EntityType>(type: K) => void;
  invalidateAll: () => void;
  clearCache: () => void;

  // Recent access
  recordEntityAccess: (type: EntityType, id: string) => void;
  getRecentEntities: (type: EntityType, limit?: number) => Entity[];
}
```

#### Selectors

```typescript
// Memoized selectors for components
export const useStyles = () => usEntitiesStore((s) => s.styles.items);
export const useLyrics = () => useEntitiesStore((s) => s.lyrics.items);
export const usePersonas = () => useEntitiesStore((s) => s.personas.items);
export const useStyleById = (id: string | null) =>
  useEntitiesStore((s) => id ? s.styles.items.get(id) : null);
export const useRecentStyles = (limit = 5) =>
  useEntitiesStore((s) => s.recentEntities.styleIds.slice(0, limit)
    .map(id => s.styles.items.get(id))
    .filter(Boolean));
```

#### Cache Invalidation Strategy

```typescript
// When does each entity type get invalidated?
// - User navigates to editor: invalidate on next fetch
// - User submits form: invalidate after mutation succeeds
// - WebSocket event (song updated): invalidate immediately
// - 30 minute idle timeout: invalidate

// Invalidation triggers:
const invalidationRules = {
  [EntityType.Style]: {
    onMutation: true,
    onWebSocketEvent: ['song-updated', 'run-completed'],
    idleTimeoutMs: 30 * 60 * 1000,
  },
  [EntityType.Lyrics]: {
    onMutation: true,
    onWebSocketEvent: ['song-updated'],
    idleTimeoutMs: 30 * 60 * 1000,
  },
  // ... etc
};
```

#### Persistence Strategy

**localStorage Key**: `meatymusic-entities-cache`

**What to Persist**:
- `styles.items` (normalized)
- `lyrics.items` (normalized)
- `personas.items` (normalized)
- `selectedStyleId`, `selectedLyricsId`, etc.
- `recentEntities`

**Hydration TTL**: 10 minutes (entities change frequently)

---

## Integration Specifications

### 1. React Query Integration

#### Pattern: Query → Store Sync

```typescript
// apps/web/src/lib/hooks/useSongsWithStore.ts
export function useSongsWithStore(filters: SongFilters) {
  const { data, isLoading, error } = useSongsQuery(filters);
  const setItems = useSongsStore((s) => s.setItems);
  const setLoading = useSongsStore((s) => s.setLoading);
  const setError = useSongsStore((s) => s.setError);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data) {
      setItems(data.items, data.pagination);
      setError(null);
    }
  }, [data, setItems, setError]);

  useEffect(() => {
    if (error) {
      setError(error);
    }
  }, [error, setError]);

  return { data, isLoading, error };
}
```

#### Pattern: Mutation → Optimistic Update

```typescript
// apps/web/src/lib/hooks/useSongMutations.ts
export function useCreateSongMutation() {
  const createMutation = useMutation({
    mutationFn: (sds: SDS) => api.songs.create(sds),
    onMutate: (sds) => {
      // Optimistic: add to store immediately
      const optimisticId = generateTempId();
      const optimisticSong: Song = {
        id: optimisticId,
        title: sds.title,
        status: 'draft',
        createdAt: new Date().toISOString(),
        // ... other fields
      };
      useSongsStore.setState((state) => ({
        items: new Map(state.items).set(optimisticId, optimisticSong),
        allIds: [...state.allIds, optimisticId],
        stagedItems: new Map(state.stagedItems).set(optimisticId, optimisticSong),
      }));
      return optimisticId;
    },
    onSuccess: (response, _, optimisticId) => {
      // Replace optimistic with actual
      useSongsStore.setState((state) => ({
        items: new Map(state.items)
          .delete(optimisticId)
          .set(response.id, response),
        allIds: state.allIds.map(id => id === optimisticId ? response.id : id),
        stagedItems: new Map(state.stagedItems).set(response.id, response),
      }));
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (_, __, optimisticId) => {
      // Rollback optimistic update
      useSongsStore.setState((state) => ({
        items: new Map(state.items).delete(optimisticId),
        allIds: state.allIds.filter(id => id !== optimisticId),
        stagedItems: new Map(state.stagedItems).delete(optimisticId),
        error: new Error('Failed to create song'),
      }));
    },
  });

  return createMutation;
}
```

### 2. WebSocket Integration

#### Auto-Subscribe to Events

```typescript
// apps/web/src/lib/hooks/useStoreSync.ts
export function useSongsStoreSync() {
  const songsStore = useSongsStore();
  const workflowsStore = useWorkflowsStore();

  // Subscribe to workflow completion events
  useWorkflowEvents('run-completed', (event) => {
    if (event.songId) {
      // Invalidate songs cache when workflow completes
      // (song's status may have changed)
      songsStore.invalidate();
      queryClient.invalidateQueries({ queryKey: ['songs', event.songId] });
    }
  });

  // Subscribe to entity updates
  useWorkflowEvents('entity-generated', (event) => {
    const { entityType, entityId, runId } = event;

    // Update appropriate entity store
    if (entityType === 'style') {
      entitiesStore.invalidateEntityType('style');
    } else if (entityType === 'lyrics') {
      entitiesStore.invalidateEntityType('lyrics');
    }
    // etc.

    // Update workflow run artifacts
    workflowsStore.setArtifacts(runId, {
      ...workflowsStore.artifacts.get(runId),
      [entityType]: entityId,
    });
  });
}
```

### 3. Multi-Tab Synchronization

```typescript
// packages/store/src/middleware/multiTabMiddleware.ts
export const createMultiTabMiddleware = <T extends object>() => {
  return (config: StateCreator<T>): StateCreator<T> => (set, get, api) => {
    // Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'meatymusic-store-sync') {
        const message = JSON.parse(event.newValue || '{}');
        if (message.storeType === 'songs' && typeof window !== 'undefined') {
          // Reload from localStorage without overwriting optimistic state
          const stored = localStorage.getItem('meatymusic-songs-list');
          if (stored) {
            const data = JSON.parse(stored);
            set(data, true);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return config(set, get, api);
  };
};

// Post-save, notify other tabs
const notifyOtherTabs = (storeType: string, data: any) => {
  const message = { storeType, timestamp: Date.now(), data };
  localStorage.setItem('meatymusic-store-sync', JSON.stringify(message));
};
```

---

## Task Breakdown

### Phase 1: Foundation & Infrastructure (3 SP)

**Task 1.1: Create Store Types & Interfaces**
- Location: `packages/store/src/types.ts`
- Add domain types (Song, Workflow, Entity types)
- Add store state interfaces (SongsState, WorkflowsState, EntitiesState)
- Add action interfaces for each store
- Effort: 2 SP
- Acceptance Criteria:
  - All types exported and documented
  - Full TypeScript coverage (no `any`)
  - Consistent naming with existing patterns

**Task 1.2: Create Query Integration Middleware**
- Location: `packages/store/src/middleware/queryIntegrationMiddleware.ts`
- Implement mutation interceptor pattern
- Support for optimistic updates
- Support for rollback on error
- Effort: 2 SP
- Acceptance Criteria:
  - Middleware composes with localStorage + API sync
  - Mutation hooks have access to store state
  - Rollback reverses optimistic changes

**Task 1.3: Create Multi-Tab Sync Middleware**
- Location: `packages/store/src/middleware/multiTabMiddleware.ts`
- Detect localStorage changes from other tabs
- Merge strategies for conflicting updates
- Prevent double-sync loops
- Effort: 1 SP
- Acceptance Criteria:
  - Changes in Tab A reflect in Tab B immediately
  - No infinite loops or race conditions
  - localStorage events properly handled

### Phase 2: Store Implementations (5 SP)

**Task 2.1: Implement Songs Store**
- Location: `packages/store/src/stores/songsStore.ts`
- State: normalized items, filters, sorting, pagination, selection
- Actions: setters, filters, pagination, selection, optimistic ops
- Selectors: memoized hooks for components
- Middleware: compose localStorage + API sync
- Effort: 2 SP
- Acceptance Criteria:
  - Store persists to localStorage
  - Filters work correctly (search, status, date range)
  - Pagination state tracks correctly
  - Selection state independent of list state
  - Optimistic updates revert on error

**Task 2.2: Implement Workflows Store**
- Location: `packages/store/src/stores/workflowsStore.ts`
- State: run list, progress tracking, node events, scores, artifacts
- Actions: query setters, progress tracking, optimistic cancel/retry
- WebSocket hooks: auto-subscribe to events
- Effort: 2 SP
- Acceptance Criteria:
  - Workflows list loads and filters correctly
  - Progress updates from WebSocket events
  - Node events accumulate in order
  - Cancel/retry operations are optimistic and reversible
  - Scores and artifacts persist during run

**Task 2.3: Implement Entities Store**
- Location: `packages/store/src/stores/entitiesStore.ts`
- State: normalized caches for styles, lyrics, personas
- Actions: generic entity setters, selection, recent tracking
- Cache invalidation: TTL-based and event-based
- Effort: 1 SP
- Acceptance Criteria:
  - Each entity type cached separately
  - Selection state for each type
  - Recent access tracking works
  - Cache invalidation removes stale data
  - localStorage persists entities with TTL

### Phase 3: Integration Hooks (3 SP)

**Task 3.1: Create React Query Integration Hooks**
- Location: `apps/web/src/lib/hooks/useSongsWithStore.ts` (+ workflows, entities)
- Pattern: Query → Store sync on data change
- Pattern: Mutation → Optimistic + Commit/Rollback
- Pattern: Query invalidation → Store cache clear
- Effort: 2 SP
- Acceptance Criteria:
  - Queries automatically sync to store
  - Optimistic updates visible immediately
  - Failed mutations rollback cleanly
  - Multiple mutations don't conflict

**Task 3.2: Create WebSocket Store Sync Hook**
- Location: `apps/web/src/lib/hooks/useStoreSync.ts`
- Auto-subscribe to workflow events
- Auto-subscribe to entity update events
- Trigger store updates and cache invalidation
- Effort: 1 SP
- Acceptance Criteria:
  - Workflows page shows real-time progress
  - Entities update when mutations complete
  - No memory leaks from subscriptions

### Phase 4: Testing (2 SP)

**Task 4.1: Unit Tests for Stores**
- Location: `packages/store/src/__tests__/`
- Test files: songs.test.ts, workflows.test.ts, entities.test.ts
- Coverage: store actions, selectors, middleware
- Effort: 1 SP
- Acceptance Criteria:
  - >70% code coverage
  - All store actions tested
  - Selectors return correct data
  - Middleware doesn't break store

**Task 4.2: Integration Tests**
- Location: `packages/store/src/__tests__/integration.test.ts`
- Test: localStorage persistence + hydration
- Test: React Query + Store sync flow
- Test: Optimistic updates + rollback
- Test: Multi-tab synchronization
- Effort: 1 SP
- Acceptance Criteria:
  - Data persists and restores from localStorage
  - Query mutations update store correctly
  - Failed operations roll back changes
  - Other tabs receive updates

---

## Deliverables Checklist

### Code Files

- [ ] `packages/store/src/types.ts` - Updated with domain types
- [ ] `packages/store/src/stores/songsStore.ts` - Songs CRUD + filters
- [ ] `packages/store/src/stores/workflowsStore.ts` - Workflow runs + progress
- [ ] `packages/store/src/stores/entitiesStore.ts` - Entity caches
- [ ] `packages/store/src/middleware/queryIntegrationMiddleware.ts` - React Query integration
- [ ] `packages/store/src/middleware/multiTabMiddleware.ts` - Cross-tab sync
- [ ] `packages/store/src/index.ts` - Export all stores and hooks
- [ ] `apps/web/src/lib/hooks/useSongsWithStore.ts` - Query + Store sync
- [ ] `apps/web/src/lib/hooks/useWorkflowsWithStore.ts` - Workflows sync
- [ ] `apps/web/src/lib/hooks/useEntitiesWithStore.ts` - Entities sync
- [ ] `apps/web/src/lib/hooks/useStoreSync.ts` - WebSocket sync

### Test Files

- [ ] `packages/store/src/__tests__/songs.test.ts` - Songs store tests
- [ ] `packages/store/src/__tests__/workflows.test.ts` - Workflows tests
- [ ] `packages/store/src/__tests__/entities.test.ts` - Entities tests
- [ ] `packages/store/src/__tests__/integration.test.ts` - Integration tests
- [ ] `packages/store/src/__tests__/middleware.test.ts` - Middleware tests

### Documentation

- [ ] Store usage guide: `docs/STORE-USAGE.md`
- [ ] Integration examples: `docs/STORE-EXAMPLES.md`
- [ ] Troubleshooting: `docs/STORE-TROUBLESHOOTING.md`

---

## Success Criteria

### Functional Requirements

- [x] Songs store loaded, filtered, sorted, and paginated
- [x] Workflow runs tracked with real-time progress
- [x] Entity caches managed with TTL invalidation
- [x] Optimistic updates visible immediately
- [x] Failed mutations rolled back cleanly
- [x] Data persisted to localStorage
- [x] Multi-tab synchronization works
- [x] React Query mutations update stores
- [x] WebSocket events trigger store updates

### Quality Requirements

- [x] TypeScript: Zero `any` types, strict mode
- [x] Testing: >70% code coverage overall
- [x] Testing: >80% coverage for store logic
- [x] Testing: All store actions tested
- [x] Testing: All integration paths tested
- [x] Performance: Store operations <5ms
- [x] Performance: localStorage sync debounced (300ms)
- [x] Performance: Selectors memoized (no re-renders)
- [x] Documentation: All stores documented with examples
- [x] Documentation: Integration patterns documented

### Acceptance Gates

**Gate 1: Store Functionality**
- All 4 stores (songs, workflows, entities, selection) functional
- All CRUD operations work
- All filters and selectors work

**Gate 2: Integration**
- React Query → Store sync verified
- Optimistic updates → Rollback verified
- WebSocket → Store update verified

**Gate 3: Persistence**
- localStorage write/read verified
- Hydration on page load verified
- Multi-tab sync verified

**Gate 4: Testing**
- Unit test coverage ≥70%
- Integration tests passing
- No type errors in strict mode

---

## Risk Mitigation

### Risk: localStorage Quota Exceeded
**Mitigation**:
- Monitor localStorage usage (warn at 80%)
- Implement LRU eviction for entity caches
- Clear old workflow runs (>30 days)
- Provide manual cache clear in UI

### Risk: Conflicting Optimistic Updates
**Mitigation**:
- Queue mutations serially if they affect same entity
- Include optimisticId in tracking
- Rollback any affected optimistic updates on error
- Log conflicts for debugging

### Risk: Store State Explosion
**Mitigation**:
- Use Map for normalized data (not arrays)
- Implement lazy loading for entity caches
- Clear inactive workflow runs from memory
- Reset on successful query refresh

### Risk: React Query + Store Out of Sync
**Mitigation**:
- Query cache as source of truth for server data
- Store as layer for client state only
- Invalidate store on query refetch
- Add sync validation tests

### Risk: WebSocket Event Storms
**Mitigation**:
- Debounce store updates (batch events)
- Limit event history per run (keep last 100)
- Auto-unsubscribe when component unmounts
- Monitor event queue size

---

## Dependencies & Prerequisites

### Required Interfaces Available

- ✅ Song, Style, Lyrics, Persona, Workflow types from API client
- ✅ Zustand v4 with middleware support
- ✅ React Query hooks and client
- ✅ WebSocket client (to be completed in WP-N4)
- ✅ localStorage (browser API)

### External Dependencies

- zustand@^4.4.0
- @tanstack/react-query@^5.0.0
- lodash-es (for debounce, if not already available)

---

## Timeline & Staffing

### Recommended Staffing

- **Primary Developer**: frontend-developer (5d × 8h = 40h)
- **Secondary Developer**: ui-engineer-enhanced (2d × 4h = 8h for code review, testing)
- **QA**: Embedded testing, minimum 4h for integration tests

### Sprint Planning

**Sprint 1 (2-3 days)**:
- Phase 1: Types, middleware
- Phase 2.1: Songs store
- Start Phase 4.1: Unit tests

**Sprint 2 (1-2 days)**:
- Phase 2.2: Workflows store
- Phase 2.3: Entities store
- Continue Phase 4: Testing

**Sprint 3 (1-2 days)**:
- Phase 3: Integration hooks
- Phase 4.2: Integration tests
- Documentation

**Buffer**: +0.5d for debugging and edge cases

---

## Testing Strategy

### Unit Tests (70% Coverage Target)

**Store Logic Tests**:
```typescript
describe('SongsStore', () => {
  it('should add song to items and allIds', () => {});
  it('should update song by ID', () => {});
  it('should remove song and update allIds', () => {});
  it('should apply filters and mark isDirty', () => {});
  it('should sort by field and direction', () => {});
  it('should handle pagination state', () => {});
  it('should track optimistic adds with staged state', () => {});
  it('should rollback optimistic on error', () => {});
  // ... 20+ tests per store
});
```

**Selector Tests**:
```typescript
describe('Songs Selectors', () => {
  it('should return all items normalized', () => {});
  it('should return item by ID or null', () => {});
  it('should filter items by criteria', () => {});
  it('should sort items correctly', () => {});
  // ... 10+ tests
});
```

**Middleware Tests**:
```typescript
describe('queryIntegrationMiddleware', () => {
  it('should intercept mutations and call onMutate', () => {});
  it('should call onSuccess after mutation', () => {});
  it('should call onError on failure', () => {});
  it('should compose with localStorage middleware', () => {});
  // ... 8+ tests
});
```

### Integration Tests (E2E-style)

```typescript
describe('Store Integration', () => {
  describe('React Query + Store Sync', () => {
    it('query success updates store', () => {});
    it('mutation optimistic update visible', () => {});
    it('mutation error rolls back', () => {});
  });

  describe('localStorage Persistence', () => {
    it('store persists to localStorage', () => {});
    it('store hydrates from localStorage on init', () => {});
    it('stale data (>5min) not restored', () => {});
  });

  describe('Multi-Tab Sync', () => {
    it('Tab A change detected in Tab B', () => {});
    it('local changes preserved during sync', () => {});
    it('no race conditions on concurrent updates', () => {});
  });

  describe('WebSocket Integration', () => {
    it('workflow event updates progress', () => {});
    it('entity update triggers cache invalidation', () => {});
    it('unsubscribe on unmount prevents leaks', () => {});
  });
});
```

---

## Observability & Monitoring

### Logging

```typescript
// Store action logging (devtools enabled in dev)
// In production: selective logging for errors

log('store.action', {
  storeType: 'songs',
  action: 'addOptimisticSong',
  songId: song.id,
  timestamp: Date.now(),
});

log('store.error', {
  storeType: 'songs',
  error: 'rollbackOptimistic failed',
  cause: err.message,
});
```

### Metrics

- `store.songs.list.size` - Current items count
- `store.songs.filters.applied` - Active filter count
- `store.workflows.activeRuns` - In-progress runs
- `store.entities.cacheAge` - Time since last refresh
- `store.localStorage.usage` - Bytes used
- `store.optimistic.pendingCount` - Staged changes count

### Alerts

- localStorage quota >80% of 10MB
- Store hydration failures
- Optimistic rollback failures
- Multi-tab sync conflicts detected

---

## Future Enhancements

### Post-MVP Extensions

1. **Store Diff Tracking**
   - Track what changed between versions
   - Undo/Redo support
   - Change history UI

2. **Advanced Caching**
   - Implement stale-while-revalidate pattern
   - Background refresh on idle
   - Prioritized cache eviction

3. **Offline Support**
   - IndexedDB for larger caches
   - Sync queue when offline
   - Conflict resolution on reconnect

4. **State Sharing**
   - Export/import state snapshots
   - Share state via URL hash
   - Compare multiple song states

5. **Performance Optimization**
   - Virtual scrolling for large lists
   - Pagination streaming
   - Lazy entity loading

---

## References & Related Documents

### Design Documents
- `/home/user/MeatyMusic/docs/project_plans/NEXT-STEPS-REPORT.md` - Phase requirements
- `/home/user/MeatyMusic/docs/PRD-REQUIREMENTS-SUMMARY.md` - API contracts
- `/home/user/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md` - State management section

### Existing Patterns
- `/home/user/MeatyMusic/packages/store/src/stores/preferencesStore.ts` - Reference implementation
- `/home/user/MeatyMusic/packages/store/src/middleware/localStorageMiddleware.ts` - Persistence pattern
- `/home/user/MeatyMusic/apps/web/src/lib/api/` - React Query integration patterns

### Related Work Packages
- **WP-N4**: WebSocket Real-Time Client (prerequisite for event subscriptions)
- **WP-N6**: Missing Entity Services (prerequisite for API endpoints)

---

## Acceptance Checklist (For Code Review)

- [ ] All TypeScript types defined and exported
- [ ] All stores implement full action interfaces
- [ ] All actions have proper type signatures
- [ ] All selectors are memoized (no inline computations)
- [ ] localStorage persistence works without errors
- [ ] Multi-tab sync tested manually
- [ ] React Query mutations use optimistic patterns
- [ ] WebSocket subscriptions auto-cleanup
- [ ] Unit tests pass with >70% coverage
- [ ] Integration tests pass
- [ ] No console errors or warnings
- [ ] Devtools integration works in dev mode
- [ ] API sync middleware retries on failure
- [ ] Store state diffs logged in development
- [ ] Documentation updated with examples

---

## Notes for Implementers

### Development Flow

1. Start with types (Task 1.1) - unblock other work
2. Implement middleware before stores (Tasks 1.2-1.3)
3. Implement stores independently (Phase 2)
4. Create integration hooks (Phase 3)
5. Write tests as you go (Phase 4)

### Key Implementation Details

- Use `Map` for normalized entity storage (O(1) lookup, compact)
- Selectors should not create new objects on each call (memoize)
- Optimistic state separate from committed state (easier rollback)
- localStorage debounce at 300ms (balance responsiveness + writes)
- API sync middleware should have exponential backoff
- Multi-tab sync should check timestamps to avoid race conditions

### Common Pitfalls to Avoid

- Don't store large objects in localStorage (exceeds quota)
- Don't update store during render (causes infinite loops)
- Don't forget to cleanup WebSocket subscriptions
- Don't use lodash without tree-shaking (bundle size)
- Don't assume localstorage available (SSR check needed)

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-14 | Implementation Planner | Initial comprehensive plan |

---

**Document Status**: APPROVED FOR IMPLEMENTATION
**Last Updated**: 2025-11-14
**Next Review**: Upon Phase 2 Completion
**Related JIRA/Linear**: WP-N5
