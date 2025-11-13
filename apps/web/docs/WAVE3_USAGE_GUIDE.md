# Wave 3 Integration Usage Guide

This guide shows how to use the Wave 3 integration layer in your components.

## Table of Contents

1. [State Management](#state-management)
2. [API Integration](#api-integration)
3. [WebSocket Events](#websocket-events)
4. [Common Patterns](#common-patterns)
5. [Error Handling](#error-handling)

## State Management

### UI Store

Global UI state for theme, sidebar, and toasts.

```tsx
import { useUIStore } from '@/stores';

function MyComponent() {
  // Individual selectors (optimized)
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

### Workflow Store

Client-side workflow state for real-time updates.

```tsx
import { useWorkflowStore } from '@/stores';

function WorkflowMonitor({ runId }: { runId: string }) {
  // Get workflow run state
  const run = useWorkflowStore(state => state.getRun(runId));
  const isConnected = useWorkflowStore(state => state.isConnected);

  if (!run) return <div>Workflow not found</div>;

  return (
    <div>
      <div>Status: {run.status}</div>
      <div>Current Node: {run.currentNode}</div>
      <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
    </div>
  );
}
```

## API Integration

### Query Hooks (Read Operations)

```tsx
import { useSongs, useSong, useStyles } from '@/hooks/api';

function SongsList() {
  // List songs with filters
  const { data, isLoading, error } = useSongs({
    status: ['draft', 'validated'],
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.items.map(song => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );
}

function SongDetail({ id }: { id: string }) {
  // Single song
  const { data: song, isLoading } = useSong(id);

  if (isLoading) return <div>Loading...</div>;
  if (!song) return <div>Not found</div>;

  return <div>{song.title}</div>;
}
```

### Mutation Hooks (Write Operations)

```tsx
import { useCreateSong, useUpdateSong, useDeleteSong } from '@/hooks/api';

function CreateSongForm() {
  const createSong = useCreateSong();

  const handleSubmit = async (data: SongCreate) => {
    createSong.mutate(data, {
      onSuccess: (song) => {
        console.log('Song created:', song.id);
        // Toast notification happens automatically
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={createSong.isPending}
      >
        {createSong.isPending ? 'Creating...' : 'Create Song'}
      </button>
    </form>
  );
}

function EditSongForm({ id }: { id: string }) {
  const updateSong = useUpdateSong(id);
  const { data: song } = useSong(id);

  const handleUpdate = (updates: SongUpdate) => {
    updateSong.mutate(updates);
    // Optimistic update happens automatically
    // Toast notification on success/error
  };

  return (
    <button onClick={() => handleUpdate({ title: 'New Title' })}>
      Update Title
    </button>
  );
}
```

### All Available Entity Hooks

```tsx
// Songs
import {
  useSongs,
  useSong,
  useCreateSong,
  useUpdateSong,
  useDeleteSong,
} from '@/hooks/api';

// Styles
import {
  useStyles,
  useStyle,
  useCreateStyle,
  useUpdateStyle,
  useDeleteStyle,
} from '@/hooks/api';

// Lyrics
import {
  useLyricsList,
  useLyrics,
  useCreateLyrics,
  useUpdateLyrics,
  useDeleteLyrics,
} from '@/hooks/api';

// Personas
import {
  usePersonas,
  usePersona,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
} from '@/hooks/api';

// Producer Notes
import {
  useProducerNotesList,
  useProducerNotes,
  useCreateProducerNotes,
  useUpdateProducerNotes,
  useDeleteProducerNotes,
} from '@/hooks/api';

// Blueprints
import {
  useBlueprints,
  useBlueprint,
  useCreateBlueprint,
  useUpdateBlueprint,
  useDeleteBlueprint,
} from '@/hooks/api';

// Workflows
import {
  useWorkflowRuns,
  useWorkflowRun,
  useWorkflowProgress,
  useWorkflowSummary,
  useStartWorkflow,
  useCancelWorkflow,
} from '@/hooks/api';
```

## WebSocket Events

### Basic Usage

```tsx
import { useWorkflowWebSocket } from '@/hooks';

function WorkflowPage() {
  const { isConnected, connectionError, disconnect, reconnect } = useWorkflowWebSocket({
    enabled: true, // Enable/disable WebSocket
    onEvent: (event) => {
      console.log('Workflow event:', event);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onConnect: () => {
      console.log('WebSocket connected');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
  });

  return (
    <div>
      <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {connectionError && <div>Error: {connectionError}</div>}
      <button onClick={reconnect}>Reconnect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### Event-Driven UI Updates

```tsx
import { useWorkflowWebSocket } from '@/hooks';
import { useWorkflowStore } from '@/stores';

function WorkflowMonitor({ songId }: { songId: string }) {
  // Get workflow run for this song
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  // Connect to WebSocket and handle events
  useWorkflowWebSocket({
    enabled: true,
    onEvent: (event) => {
      // Event is automatically processed by workflow store
      // Just handle custom UI updates here
      if (event.node_name === 'VALIDATE' && event.phase === 'end') {
        const scores = event.data?.scores;
        console.log('Validation scores:', scores);
      }
    },
  });

  return (
    <div>
      {run && (
        <div>
          <div>Status: {run.status}</div>
          <div>Current Node: {run.currentNode}</div>
          <div>Events: {run.events.length}</div>
        </div>
      )}
    </div>
  );
}
```

## Common Patterns

### List with Filters

```tsx
import { useSongs } from '@/hooks/api';
import { useState } from 'react';

function FilteredSongList() {
  const [filters, setFilters] = useState({
    status: ['draft'],
    limit: 20,
  });

  const { data, isLoading } = useSongs(filters);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div>
      <select onChange={(e) => handleFilterChange({ status: [e.target.value] })}>
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

### Master-Detail Pattern

```tsx
import { useSongs, useSong } from '@/hooks/api';
import { useState } from 'react';

function SongMasterDetail() {
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const { data: songs } = useSongs();
  const { data: selectedSong } = useSong(selectedId);

  return (
    <div style={{ display: 'flex' }}>
      {/* Master (List) */}
      <div style={{ width: '300px' }}>
        {songs?.items.map(song => (
          <div
            key={song.id}
            onClick={() => setSelectedId(song.id)}
            style={{
              background: selectedId === song.id ? '#eee' : 'white',
            }}
          >
            {song.title}
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, padding: '20px' }}>
        {selectedSong ? (
          <div>
            <h1>{selectedSong.title}</h1>
            <p>Status: {selectedSong.status}</p>
            {/* More details */}
          </div>
        ) : (
          <div>Select a song</div>
        )}
      </div>
    </div>
  );
}
```

### Workflow Execution

```tsx
import { useStartWorkflow, useCancelWorkflow, useWorkflowRun } from '@/hooks/api';
import { useWorkflowWebSocket } from '@/hooks';
import { useWorkflowStore } from '@/stores';

function WorkflowExecutor({ songId }: { songId: string }) {
  const startWorkflow = useStartWorkflow();
  const cancelWorkflow = useCancelWorkflow();

  // Get active run for this song
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  // Connect WebSocket
  useWorkflowWebSocket({ enabled: true });

  const handleStart = () => {
    startWorkflow.mutate({
      song_id: songId,
      global_seed: Math.floor(Math.random() * 1000000),
    });
  };

  const handleCancel = () => {
    if (run) {
      cancelWorkflow.mutate(run.songId);
    }
  };

  return (
    <div>
      {!run ? (
        <button onClick={handleStart} disabled={startWorkflow.isPending}>
          {startWorkflow.isPending ? 'Starting...' : 'Start Workflow'}
        </button>
      ) : (
        <div>
          <div>Status: {run.status}</div>
          <div>Current Node: {run.currentNode}</div>
          <button onClick={handleCancel}>Cancel Workflow</button>
        </div>
      )}
    </div>
  );
}
```

### Form with Optimistic Updates

```tsx
import { useUpdateSong } from '@/hooks/api';
import { useState } from 'react';

function SongTitleEditor({ songId, initialTitle }: { songId: string; initialTitle: string }) {
  const [title, setTitle] = useState(initialTitle);
  const updateSong = useUpdateSong(songId);

  const handleSave = () => {
    updateSong.mutate({ title });
    // UI updates optimistically before server response
  };

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleSave} disabled={updateSong.isPending}>
        Save
      </button>
      {updateSong.isPending && <span>Saving...</span>}
    </div>
  );
}
```

## Error Handling

### Automatic Error Handling

Most errors are handled automatically via toast notifications:

```tsx
const createSong = useCreateSong();
// On error, a toast is shown automatically
// No need for manual error handling in most cases
```

### Custom Error Handling

```tsx
const createSong = useCreateSong();

createSong.mutate(data, {
  onError: (error) => {
    // Custom error handling
    if (error.code === 'DUPLICATE_TITLE') {
      console.log('Title already exists');
    }
  },
  onSuccess: (song) => {
    // Custom success handling
    navigate(`/songs/${song.id}`);
  },
});
```

### Error Display

```tsx
function SongsList() {
  const { data, isLoading, error, refetch } = useSongs();

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  // ...
}
```

## Advanced Patterns

### Infinite Scroll

```tsx
// TODO: Implement with cursor-based pagination
// Will be added in future wave
```

### Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/config';
import { songsApi } from '@/lib/api';

function SongListItem({ song }: { song: Song }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch song details on hover
    queryClient.prefetchQuery({
      queryKey: queryKeys.songs.detail(song.id),
      queryFn: () => songsApi.get(song.id),
    });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {song.title}
    </div>
  );
}
```

### Manual Cache Updates

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/config';

function MyComponent() {
  const queryClient = useQueryClient();

  const updateCache = () => {
    // Update cache directly
    queryClient.setQueryData(
      queryKeys.songs.detail('song-id'),
      (oldData) => ({
        ...oldData,
        title: 'New Title',
      })
    );

    // Invalidate cache to refetch
    queryClient.invalidateQueries({
      queryKey: queryKeys.songs.lists(),
    });
  };

  return <button onClick={updateCache}>Update</button>;
}
```

## Best Practices

1. **Use Selectors**: Always use selectors with Zustand for optimal performance
   ```tsx
   // Good
   const theme = useUIStore(state => state.theme);

   // Bad (causes unnecessary re-renders)
   const { theme } = useUIStore();
   ```

2. **Handle Loading States**: Always show loading states for better UX
   ```tsx
   if (isLoading) return <Skeleton />;
   if (error) return <Error error={error} />;
   ```

3. **Use Optimistic Updates**: For better perceived performance
   ```tsx
   // updateSong hook already has optimistic updates built-in
   const updateSong = useUpdateSong(id);
   ```

4. **Cleanup WebSocket**: Disable when not needed
   ```tsx
   useWorkflowWebSocket({
     enabled: isWorkflowPage, // Only enable on workflow pages
   });
   ```

5. **Proper Error Boundaries**: Wrap components in error boundaries
   ```tsx
   <ErrorBoundary fallback={<ErrorFallback />}>
     <MyComponent />
   </ErrorBoundary>
   ```

## Type Safety

All hooks are fully typed. Use TypeScript for best experience:

```tsx
import type { Song, SongCreate, SongUpdate } from '@/types/api';

const song: Song = useSong(id).data!;
const createData: SongCreate = { title: 'New Song', global_seed: 123 };
const updateData: SongUpdate = { title: 'Updated' };
```

## Next Steps

- Integrate these hooks into Wave 2 components
- Add error boundaries to pages
- Implement loading skeletons
- Add E2E tests for critical flows

## Support

For issues or questions, refer to:
- Architecture Guide: `.claude/context/phase5-frontend-architecture.md`
- Wave 3 Summary: `.claude/context/wave3-implementation-summary.md`
- API Types: `apps/web/src/types/api/`
