# State Management Guide

Comprehensive guide to state management in MeatyMusic AMCS using React Query and Zustand.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [React Query Conventions](#react-query-conventions)
3. [Zustand Stores](#zustand-stores)
4. [State Boundaries](#state-boundaries)
5. [Common Patterns](#common-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

## Architecture Overview

MeatyMusic uses a hybrid state management approach:

- **React Query**: Server state (API data, caching, synchronization)
- **Zustand**: Client state (UI state, WebSocket events, workflow state)

```
┌─────────────────────────────────────────────────┐
│                  Frontend App                    │
├─────────────────────────────────────────────────┤
│  React Query (Server State)                     │
│  - Songs, Styles, Lyrics, etc.                  │
│  - Automatic caching & refetching               │
│  - Optimistic updates                           │
│  - Background synchronization                   │
├─────────────────────────────────────────────────┤
│  Zustand (Client State)                         │
│  - UI state (theme, sidebar)                    │
│  - Workflow real-time state                     │
│  - WebSocket connection state                   │
└─────────────────────────────────────────────────┘
```

### When to Use What

**Use React Query when:**
- Data comes from API
- Needs caching and synchronization
- Requires optimistic updates
- Benefits from automatic refetching

**Use Zustand when:**
- Pure UI state (theme, modals, sidebar)
- Real-time data (WebSocket events)
- Complex client-side state machines
- Needs to persist across route changes

## React Query Conventions

### Query Key Structure

All query keys follow a hierarchical structure defined in `lib/query/config.ts`:

```typescript
// Hierarchy: [entity] → [operation] → [identifier] → [filters]

queryKeys.songs.all              // ['songs']
queryKeys.songs.lists()          // ['songs', 'list']
queryKeys.songs.list(filters)    // ['songs', 'list', { status: ['draft'] }]
queryKeys.songs.details()        // ['songs', 'detail']
queryKeys.songs.detail(id)       // ['songs', 'detail', 'abc-123']
```

**Entity Key Structures:**

```typescript
// Songs
queryKeys.songs.all              // Base key
queryKeys.songs.lists()          // All lists
queryKeys.songs.list({ status: ['draft'] })  // Filtered list
queryKeys.songs.detail(id)       // Single song
queryKeys.songs.entities(id)     // Related entities
queryKeys.songs.runs(id)         // Workflow runs

// Styles
queryKeys.styles.all
queryKeys.styles.list({ genre: 'pop' })
queryKeys.styles.detail(id)

// Lyrics
queryKeys.lyrics.all
queryKeys.lyrics.list()
queryKeys.lyrics.detail(id)

// Workflows
queryKeys.workflows.all
queryKeys.workflows.detail(runId)
queryKeys.workflows.progress(runId)
```

### Stale Time Configuration

Different entity types have optimized stale times:

```typescript
const STALE_TIME = {
  SONGS: 30_000,              // 30 seconds
  ENTITIES: 120_000,          // 2 minutes
  BLUEPRINTS: 300_000,        // 5 minutes
  WORKFLOWS_ACTIVE: 10_000,   // 10 seconds
  WORKFLOWS_INACTIVE: 300_000, // 5 minutes
};
```

**Example:**

```tsx
import { useSongs } from '@/hooks/api';

// Songs have 30s stale time - refetches after 30s of inactivity
const { data: songs } = useSongs();

// During workflow execution, polls every 10s
const { data: run } = useWorkflowRun(runId);
```

### Cache Invalidation Patterns

#### Automatic Invalidation

Mutations automatically invalidate related queries:

```tsx
const createSong = useCreateSong();

createSong.mutate(songData, {
  onSuccess: (song) => {
    // Automatically invalidates:
    // - queryKeys.songs.lists() (all song lists)
    // Toast notification shown
  },
});
```

#### Manual Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/config';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate specific query
    queryClient.invalidateQueries({
      queryKey: queryKeys.songs.detail(songId),
    });

    // Invalidate all song lists
    queryClient.invalidateQueries({
      queryKey: queryKeys.songs.lists(),
    });

    // Invalidate everything
    queryClient.invalidateQueries();
  };
}
```

#### Selective Invalidation

```tsx
// Invalidate only draft songs
queryClient.invalidateQueries({
  queryKey: queryKeys.songs.list({ status: ['draft'] }),
});

// Invalidate all lists but not details
queryClient.invalidateQueries({
  queryKey: queryKeys.songs.lists(),
  exact: false, // Matches all descendants
});
```

### Optimistic Updates

Mutations include optimistic updates for instant UI feedback:

```tsx
const updateSong = useUpdateSong(songId);

// Optimistic update happens automatically
updateSong.mutate({ title: 'New Title' });

// UI updates immediately, rolls back on error
```

**Custom Optimistic Update:**

```tsx
const mutation = useMutation({
  mutationFn: updateSongApi,

  onMutate: async (update) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: queryKeys.songs.detail(songId),
    });

    // Snapshot previous value
    const previous = queryClient.getQueryData(
      queryKeys.songs.detail(songId)
    );

    // Optimistically update cache
    queryClient.setQueryData(
      queryKeys.songs.detail(songId),
      (old) => ({ ...old, ...update })
    );

    return { previous };
  },

  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      queryKeys.songs.detail(songId),
      context.previous
    );
  },

  onSuccess: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({
      queryKey: queryKeys.songs.detail(songId),
    });
  },
});
```

### Background Synchronization

React Query automatically refetches stale data:

```tsx
// Refetch on window focus (disabled by default)
const { data } = useSongs({
  refetchOnWindowFocus: true,
});

// Refetch on reconnect (enabled by default)
const { data } = useSongs({
  refetchOnReconnect: true,
});

// Poll at interval
const { data } = useWorkflowRun(runId, {
  refetchInterval: (data) => {
    // Poll every 10s while running
    return data?.status === 'running' ? 10_000 : false;
  },
});
```

### Pagination

```tsx
import { useState } from 'react';
import { useSongs } from '@/hooks/api';

function PaginatedSongs() {
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const { data, isLoading } = useSongs({
    offset: page * limit,
    limit,
  });

  return (
    <div>
      {data?.items.map(song => <SongCard key={song.id} song={song} />)}

      <div>
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.has_more}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/config';
import { songsApi } from '@/lib/api';

function SongListItem({ song }: { song: Song }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch details on hover
    queryClient.prefetchQuery({
      queryKey: queryKeys.songs.detail(song.id),
      queryFn: () => songsApi.get(song.id),
      staleTime: 60_000, // Consider fresh for 1 minute
    });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {song.title}
    </div>
  );
}
```

## Zustand Stores

### UI Store

Global UI state for theme, sidebar, and toasts.

**Location:** `stores/uiStore.ts`

**State:**

```typescript
interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  toasts: Toast[];
}
```

**Usage:**

```tsx
import { useUIStore } from '@/stores';

function MyComponent() {
  // Selector pattern (optimal - only re-renders on theme change)
  const theme = useUIStore(state => state.theme);

  // Multiple selectors
  const theme = useUIStore(state => state.theme);
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);

  // Actions
  const { setTheme, toggleSidebar, addToast } = useUIStore();

  const handleAction = () => {
    addToast('Action completed!', 'success');
  };

  return (
    <div>
      <button onClick={toggleSidebar}>Toggle Sidebar</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

**Actions:**

```typescript
// Theme
setTheme(theme: 'light' | 'dark' | 'system'): void

// Sidebar
toggleSidebar(): void
setSidebarCollapsed(collapsed: boolean): void

// Toasts
addToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void
removeToast(id: string): void
clearToasts(): void
```

### Workflow Store

Client-side workflow state for real-time updates.

**Location:** `stores/workflowStore.ts`

**State:**

```typescript
interface WorkflowState {
  isConnected: boolean;
  connectionError: string | null;
  activeRuns: Map<string, WorkflowRunState>;
  selectedNodeId: WorkflowNode | null;
  isGraphExpanded: boolean;
}

interface WorkflowRunState {
  songId: string;
  status: WorkflowRunStatus;
  currentNode?: WorkflowNode;
  nodes: Map<WorkflowNode, NodeState>;
  events: WorkflowEvent[];
  lastUpdate: Date;
}
```

**Usage:**

```tsx
import { useWorkflowStore } from '@/stores';

function WorkflowMonitor({ runId }: { runId: string }) {
  // Get specific run
  const run = useWorkflowStore(state => state.getRun(runId));

  // Get run by song ID
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  // Connection state
  const isConnected = useWorkflowStore(state => state.isConnected);
  const error = useWorkflowStore(state => state.connectionError);

  if (!run) return <div>No workflow running</div>;

  return (
    <div>
      <div>Status: {run.status}</div>
      <div>Current Node: {run.currentNode}</div>
      <div>Events: {run.events.length}</div>
      <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
    </div>
  );
}
```

**Actions:**

```typescript
// Connection management
setConnected(connected: boolean): void
setConnectionError(error: string | null): void

// Run management
addRun(runId: string, songId: string): void
updateRunStatus(runId: string, status: Partial<WorkflowRunState>): void
updateNodeStatus(runId: string, nodeId: WorkflowNode, status: NodeState): void
addEvent(runId: string, event: WorkflowEvent): void
clearRun(runId: string): void

// UI actions
selectNode(nodeId: WorkflowNode | null): void
toggleGraphExpanded(): void

// Utilities
getRun(runId: string): WorkflowRunState | undefined
getRunBySongId(songId: string): WorkflowRunState | undefined
reset(): void
```

**Node Status Tracking:**

```tsx
function NodeStatusDisplay({ runId, nodeId }: Props) {
  const run = useWorkflowStore(state => state.getRun(runId));
  const nodeState = run?.nodes.get(nodeId);

  if (!nodeState) return null;

  return (
    <div>
      <div>Status: {nodeState.status}</div>
      {nodeState.startedAt && (
        <div>Started: {nodeState.startedAt.toLocaleString()}</div>
      )}
      {nodeState.durationMs && (
        <div>Duration: {nodeState.durationMs}ms</div>
      )}
      {nodeState.error && (
        <div className="text-red-500">Error: {nodeState.error}</div>
      )}
    </div>
  );
}
```

## State Boundaries

### Clear Separation

**Server State (React Query):**
- Songs, Styles, Lyrics, Personas, Producer Notes
- Blueprints, Sources
- Workflow run metadata (historical)

**Client State (Zustand):**
- UI preferences (theme, sidebar)
- Toast notifications
- Real-time workflow updates (WebSocket)
- Selected node in workflow graph
- Transient UI state

### Derived State

Compute derived state in components, not in stores:

```tsx
// Good: Derive in component
function WorkflowProgress({ runId }: { runId: string }) {
  const run = useWorkflowStore(state => state.getRun(runId));

  // Derive progress from node states
  const progress = useMemo(() => {
    if (!run) return 0;
    const totalNodes = 8; // PLAN → REVIEW
    const completedNodes = Array.from(run.nodes.values())
      .filter(node => node.status === 'success').length;
    return (completedNodes / totalNodes) * 100;
  }, [run]);

  return <Progress value={progress} />;
}

// Bad: Store progress in state
// Don't add 'progress' field to WorkflowRunState
```

### Cross-Store Communication

Use React Query cache for coordination:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { useWorkflowStore } from '@/stores';

function WorkflowIntegration({ runId }: { runId: string }) {
  const queryClient = useQueryClient();
  const run = useWorkflowStore(state => state.getRun(runId));

  useEffect(() => {
    // When workflow completes, invalidate related queries
    if (run?.status === 'completed') {
      queryClient.invalidateQueries({
        queryKey: queryKeys.songs.detail(run.songId),
      });
    }
  }, [run?.status, run?.songId, queryClient]);
}
```

## Common Patterns

### List with Filters

```tsx
import { useState } from 'react';
import { useSongs } from '@/hooks/api';

function FilteredSongList() {
  const [filters, setFilters] = useState({
    status: ['draft', 'validated'],
    genre: undefined,
    limit: 20,
  });

  const { data, isLoading } = useSongs(filters);

  return (
    <div>
      <select
        value={filters.status[0]}
        onChange={(e) => setFilters(f => ({
          ...f,
          status: [e.target.value],
        }))}
      >
        <option value="draft">Draft</option>
        <option value="validated">Validated</option>
        <option value="rendered">Rendered</option>
      </select>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        data?.items.map(song => <SongCard key={song.id} song={song} />)
      )}
    </div>
  );
}
```

### Master-Detail

```tsx
import { useState } from 'react';
import { useSongs, useSong } from '@/hooks/api';

function SongMasterDetail() {
  const [selectedId, setSelectedId] = useState<string>();

  const { data: songs } = useSongs();
  const { data: selectedSong, isLoading } = useSong(selectedId);

  return (
    <div className="flex">
      {/* Master (List) */}
      <div className="w-80 border-r">
        {songs?.items.map(song => (
          <button
            key={song.id}
            onClick={() => setSelectedId(song.id)}
            className={selectedId === song.id ? 'bg-blue-100' : ''}
          >
            {song.title}
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : selectedSong ? (
          <div>
            <h1>{selectedSong.title}</h1>
            <p>Status: {selectedSong.status}</p>
          </div>
        ) : (
          <div>Select a song</div>
        )}
      </div>
    </div>
  );
}
```

### Real-Time Updates

```tsx
import { useWorkflowWebSocket } from '@/hooks';
import { useWorkflowStore } from '@/stores';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/config';

function RealTimeWorkflow({ songId }: { songId: string }) {
  const queryClient = useQueryClient();
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  // Connect to WebSocket
  useWorkflowWebSocket({
    enabled: true,
    onEvent: (event) => {
      // Custom handling if needed
      if (event.phase === 'end' && !event.node_name) {
        // Workflow completed
        queryClient.invalidateQueries({
          queryKey: queryKeys.songs.detail(songId),
        });
      }
    },
  });

  return (
    <div>
      {run ? (
        <div>
          <div>Status: {run.status}</div>
          <div>Current: {run.currentNode}</div>
        </div>
      ) : (
        <div>No active workflow</div>
      )}
    </div>
  );
}
```

### Form with Auto-Save

```tsx
import { useEffect } from 'react';
import { useUpdateSong } from '@/hooks/api';
import { useDebounce } from '@/hooks';

function AutoSaveSongForm({ songId }: { songId: string }) {
  const [title, setTitle] = useState('');
  const debouncedTitle = useDebounce(title, 1000);
  const updateSong = useUpdateSong(songId);

  useEffect(() => {
    if (debouncedTitle) {
      updateSong.mutate({ title: debouncedTitle });
    }
  }, [debouncedTitle]);

  return (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Song title"
    />
  );
}
```

## Performance Optimization

### Selector Optimization

```tsx
// Bad: Re-renders on any store change
const { theme, sidebarCollapsed } = useUIStore();

// Good: Only re-renders when theme changes
const theme = useUIStore(state => state.theme);
const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);

// Also good: Multiple specific selectors
const theme = useUIStore(state => state.theme);
const setTheme = useUIStore(state => state.setTheme);
```

### Query Deduplication

React Query automatically deduplicates requests:

```tsx
// Both components request the same data simultaneously
// Only one API call is made
function ComponentA() {
  const { data } = useSong('song-123');
}

function ComponentB() {
  const { data } = useSong('song-123'); // Uses same query
}
```

### Structural Sharing

React Query uses structural sharing to prevent unnecessary re-renders:

```tsx
// Even if API returns new object, component only re-renders
// if actual data values changed
const { data: song } = useSong(songId);
```

### Query Cancellation

```tsx
import { useQuery } from '@tanstack/react-query';

function SearchSongs({ query }: { query: string }) {
  const { data } = useQuery({
    queryKey: ['songs', 'search', query],
    queryFn: async ({ signal }) => {
      // Pass abort signal to fetch
      const response = await fetch(`/api/songs?q=${query}`, { signal });
      return response.json();
    },
    enabled: query.length > 2,
  });
}
```

## Error Handling

### Automatic Error Toasts

Mutations show error toasts automatically:

```tsx
const createSong = useCreateSong();

// Error toast shown automatically
createSong.mutate(songData);
```

### Custom Error Handling

```tsx
const createSong = useCreateSong();

createSong.mutate(songData, {
  onError: (error) => {
    if (error.code === 'DUPLICATE_TITLE') {
      // Custom handling
      setFieldError('title', 'Title already exists');
    }
    // Toast still shown automatically
  },
});
```

### Query Error Display

```tsx
function SongsList() {
  const { data, error, isError, refetch } = useSongs();

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <div>{/* Render songs */}</div>;
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function MyApp() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Testing

### Testing Queries

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSongs } from '@/hooks/api';

test('useSongs fetches songs', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useSongs(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(5);
});
```

### Testing Zustand Stores

```tsx
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '@/stores';

test('toggleSidebar updates state', () => {
  const { result } = renderHook(() => useUIStore());

  const initialState = result.current.sidebarCollapsed;

  act(() => {
    result.current.toggleSidebar();
  });

  expect(result.current.sidebarCollapsed).toBe(!initialState);
});
```

## See Also

- [Component Usage Guide](./COMPONENTS.md) - Component patterns
- [WebSocket Integration Guide](./WEBSOCKET.md) - Real-time updates
- [Development Guide](./DEVELOPMENT.md) - Development workflow

## References

- React Query docs: https://tanstack.com/query/latest/docs/react/overview
- Zustand docs: https://docs.pmnd.rs/zustand/getting-started/introduction
- Wave 3 Integration: `.claude/context/wave3-implementation-summary.md`
- Architecture: `.claude/context/phase5-frontend-architecture.md`
