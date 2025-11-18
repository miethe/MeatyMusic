# MeatyMusic Store Examples

Practical integration examples for common state management patterns.

## Table of Contents

1. [Basic Store Operations](#basic-store-operations)
2. [React Query Integration](#react-query-integration)
3. [Optimistic Updates](#optimistic-updates)
4. [Multi-Tab Synchronization](#multi-tab-synchronization)
5. [Complex Workflows](#complex-workflows)
6. [Entity Management](#entity-management)
7. [Component Patterns](#component-patterns)

## Basic Store Operations

### Reading Store State

```typescript
import { useSongsStore, useSongById, useSongs } from '@meatymusic/store';

export function SongDetail({ songId }: { songId: string }) {
  // Get single song
  const song = useSongById(songId);

  // Get entire songs map
  const songsMap = useSongs();

  // Get pagination state
  const pagination = useSongsPagination();

  // Get current filters
  const filters = useSongsFilters();

  if (!song) return <div>Song not found</div>;

  return (
    <div>
      <h1>{song.title}</h1>
      <p>Status: {song.status}</p>
      <p>Seed: {song.global_seed}</p>
      <p>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</p>
    </div>
  );
}
```

### Updating Store State

```typescript
import { useSongsStore } from '@meatymusic/store';

export function SongsFilter() {
  const store = useSongsStore();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (query: string) => {
    store.setSearchQuery(query);
  };

  const handleFilter = () => {
    store.setFilters({
      status: 'draft',
      createdAfter: '2025-01-01T00:00:00Z',
    });
    // Reset to first page when filters change
    store.applyFilters();
  };

  const handleSort = () => {
    // Toggle between ascending/descending for 'createdAt'
    store.setSorting('createdAt');
  };

  const handleReset = () => {
    store.clearFilters();
  };

  return (
    <div>
      <input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onBlur={() => handleSearch(searchInput)}
        placeholder="Search songs..."
      />
      <button onClick={handleFilter}>Apply Filters</button>
      <button onClick={handleSort}>Sort by Created</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}
```

### Selection State

```typescript
import { useSongsStore, useSongsSelectedId } from '@meatymusic/store';

export function SongsList() {
  const store = useSongsStore();
  const selectedId = useSongsSelectedId();
  const songs = useSongs();

  return (
    <div>
      {Array.from(songs.entries()).map(([id, song]) => (
        <div
          key={id}
          onClick={() => store.selectSong(id)}
          style={{
            backgroundColor: selectedId === id ? '#e0e0e0' : 'transparent',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          {song.title}
        </div>
      ))}

      <div>
        {selectedId && (
          <button onClick={() => store.selectSong(null)}>
            Deselect
          </button>
        )}
      </div>
    </div>
  );
}
```

### Pagination

```typescript
import {
  useSongsStore,
  useSongs,
  useSongsPagination,
} from '@meatymusic/store';

export function PaginatedSongsList() {
  const store = useSongsStore();
  const songs = useSongs();
  const pagination = useSongsPagination();

  return (
    <div>
      <div>
        {Array.from(songs.values()).map((song) => (
          <div key={song.id}>{song.title}</div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => store.previousPage()}
          disabled={pagination.page === 1}
        >
          Previous
        </button>

        <span style={{ margin: '0 20px' }}>
          Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
        </span>

        <button
          onClick={() => store.nextPage()}
          disabled={!pagination.hasMore}
        >
          Next
        </button>

        <input
          type="number"
          min="1"
          value={pagination.page}
          onChange={(e) => store.setPage(parseInt(e.target.value, 10))}
          style={{ marginLeft: '20px', width: '60px' }}
        />
      </div>
    </div>
  );
}
```

## React Query Integration

### Query Synchronization

```typescript
import { useSongsWithStore } from '@/lib/hooks';
import { useSongsFilters } from '@meatymusic/store';

export function SongsWithSync() {
  const filters = useSongsFilters();

  const { data, isLoading, error } = useSongsWithStore({
    q: filters.search,
    status: filters.status ? [filters.status] : undefined,
    limit: 20,
  });

  if (isLoading) return <div>Loading songs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data.items are automatically synced to store
  return (
    <div>
      <h2>Songs ({data?.page_info.total_count || 0} total)</h2>
      {data?.items.map((song) => (
        <div key={song.id}>
          <strong>{song.title}</strong>
          <p>Status: {song.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Workflow Progress Tracking

```typescript
import {
  useWorkflowProgressWithStore,
  usePrefetchWorkflow,
} from '@/lib/hooks';
import { useRunScores, useNodeEvents } from '@meatymusic/store';

export function WorkflowProgressPanel({ runId }: { runId: string }) {
  const { data: progress, isLoading } = useWorkflowProgressWithStore(runId);
  const scores = useRunScores(runId);
  const events = useNodeEvents(runId);
  const prefetchWorkflow = usePrefetchWorkflow();

  // Prefetch workflow details when progress changes
  useEffect(() => {
    if (progress && progress.progress_percentage === 100) {
      prefetchWorkflow(runId);
    }
  }, [progress?.progress_percentage, runId, prefetchWorkflow]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div>Progress: {progress?.progress_percentage || 0}%</div>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              width: `${progress?.progress_percentage || 0}%`,
              height: '100%',
              backgroundColor: '#4caf50',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      <div>
        <h3>Current Node: {progress?.current_node || 'None'}</h3>
      </div>

      <div>
        <h3>Scores</h3>
        {scores ? (
          <ul>
            <li>Hook Density: {scores.hook_density?.toFixed(2) || 'N/A'}</li>
            <li>Singability: {scores.singability?.toFixed(2) || 'N/A'}</li>
            <li>Rhyme: {scores.rhyme_tightness?.toFixed(2) || 'N/A'}</li>
            <li>Total: {scores.total?.toFixed(2) || 'N/A'}</li>
          </ul>
        ) : (
          <p>No scores yet</p>
        )}
      </div>

      <div>
        <h3>Events ({events.length})</h3>
        {events.length > 0 ? (
          <ul>
            {events.slice(-5).map((event, i) => (
              <li key={i}>
                {event.node}: {event.phase} ({event.duration}ms)
              </li>
            ))}
          </ul>
        ) : (
          <p>No events yet</p>
        )}
      </div>
    </div>
  );
}
```

### Prefetching for Performance

```typescript
import { usePrefetchSongs, usePrefetchSong } from '@/lib/hooks';

export function SongsGrid() {
  const prefetchSongs = usePrefetchSongs();
  const prefetchSong = usePrefetchSong();

  const handleHoverRow = (songId: string) => {
    // Prefetch song details on row hover
    prefetchSong(songId);
  };

  const handleNavigateToArchive = () => {
    // Prefetch archived songs before navigation
    prefetchSongs({ status: 'archived' });
  };

  return (
    <div>
      <button onClick={handleNavigateToArchive}>
        View Archive
      </button>
      {/* grid rows */}
      <div onMouseEnter={() => handleHoverRow('song-123')}>
        Song Details (hover to prefetch)
      </div>
    </div>
  );
}
```

## Optimistic Updates

### Creating Songs with Optimistic UI

```typescript
import { useCreateSongMutation } from '@/lib/hooks';
import { useSongs } from '@meatymusic/store';

export function CreateSongForm() {
  const mutation = useCreateSongMutation();
  const songs = useSongs();
  const [formData, setFormData] = useState({
    title: '',
    global_seed: 12345,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newSong = await mutation.mutateAsync({
        title: formData.title,
        global_seed: formData.global_seed,
      });

      // Show success message
      console.log('Song created:', newSong.id);
      setFormData({ title: '', global_seed: 12345 });
    } catch (error) {
      // Error handling - rollback is automatic
      console.error('Failed to create song:', error);
    }
  };

  // Show optimistic song in list while loading
  const optimisticSongs = Array.from(songs.values());

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Song title"
        />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : 'Create Song'}
        </button>
      </form>

      {mutation.error && (
        <div style={{ color: 'red' }}>
          Error: {mutation.error.message}
        </div>
      )}

      <h3>Songs</h3>
      {optimisticSongs.map((song) => (
        <div key={song.id} style={{ opacity: song.id.startsWith('temp-') ? 0.6 : 1 }}>
          {song.title}
          {song.id.startsWith('temp-') && ' (pending...)'}
        </div>
      ))}
    </div>
  );
}
```

### Updating with Optimistic Changes

```typescript
import { useUpdateSongMutation } from '@/lib/hooks';
import { useSongById } from '@meatymusic/store';

export function EditSongForm({ songId }: { songId: string }) {
  const mutation = useUpdateSongMutation();
  const song = useSongById(songId);
  const [title, setTitle] = useState(song?.title ?? '');

  if (!song) return <div>Song not found</div>;

  const handleSave = async () => {
    try {
      // Optimistic update happens automatically
      await mutation.mutateAsync({
        id: songId,
        updates: { title },
      });
      console.log('Song updated');
    } catch (error) {
      // Rollback is automatic
      console.error('Failed to update:', error);
    }
  };

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Song title"
      />
      <button onClick={handleSave} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>

      {/* Show pending status */}
      {mutation.isPending && <p>Saving changes...</p>}
      {mutation.error && <p style={{ color: 'red' }}>Error: {mutation.error.message}</p>}
    </div>
  );
}
```

### Deleting with Optimistic Removal

```typescript
import { useDeleteSongMutation } from '@/lib/hooks';
import { useSongs, useSongById } from '@meatymusic/store';

export function DeleteSongButton({ songId }: { songId: string }) {
  const mutation = useDeleteSongMutation();
  const song = useSongById(songId);

  if (!song) return null;

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${song.title}"?`)) return;

    try {
      // Song is optimistically removed from store
      await mutation.mutateAsync(songId);
      console.log('Song deleted');
    } catch (error) {
      // Song is restored to store
      console.error('Failed to delete:', error);
    }
  };

  return (
    <button onClick={handleDelete} disabled={mutation.isPending}>
      {mutation.isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

## Multi-Tab Synchronization

### Detecting Changes from Other Tabs

```typescript
import { useEffect, useState } from 'react';
import { useSongsStore, useSongs } from '@meatymusic/store';

export function MultiTabIndicator() {
  const [hasRemoteChange, setHasRemoteChange] = useState(false);
  const songs = useSongs();

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = useSongsStore.subscribe(
      (state) => state.items,
      (items) => {
        // Highlight when items change (from other tab)
        setHasRemoteChange(true);
        const timer = setTimeout(() => setHasRemoteChange(false), 3000);
        return () => clearTimeout(timer);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <div>
      {hasRemoteChange && (
        <div style={{
          padding: '8px',
          backgroundColor: '#fff3cd',
          borderLeft: '4px solid #ff9800',
        }}>
          Changes detected from another tab
        </div>
      )}
    </div>
  );
}
```

### Syncing Selection Across Tabs

```typescript
import { useEffect } from 'react';
import { useSongsStore, useSongsSelectedId } from '@meatymusic/store';

export function SyncedSongSelection() {
  const store = useSongsStore();
  const selectedId = useSongsSelectedId();

  // Listen for selection changes
  useEffect(() => {
    const unsubscribe = useSongsStore.subscribe(
      (state) => state.selectedId,
      (newSelectedId) => {
        // You can react to selection changes from other tabs
        if (newSelectedId) {
          console.log('Song selected in another tab:', newSelectedId);
        }
      }
    );

    return unsubscribe;
  }, []);

  return (
    <div>
      {selectedId ? (
        <p>Selected: {selectedId}</p>
      ) : (
        <p>No selection</p>
      )}
    </div>
  );
}
```

## Complex Workflows

### Complete Song Creation Workflow

```typescript
import { useState } from 'react';
import { useCreateSongMutation, useSongsWithStore } from '@/lib/hooks';
import { useSongs, useSongsStore } from '@meatymusic/store';

export function CompleteWorkflow() {
  const [step, setStep] = useState<'create' | 'configure' | 'confirm'>('create');
  const [formData, setFormData] = useState({
    title: '',
    global_seed: Math.floor(Math.random() * 1000000),
  });

  const createMutation = useCreateSongMutation();
  const { refetch } = useSongsWithStore();
  const songs = useSongs();

  const handleCreateClick = async () => {
    setStep('configure');
  };

  const handleConfirm = async () => {
    try {
      const newSong = await createMutation.mutateAsync({
        title: formData.title,
        global_seed: formData.global_seed,
      });

      // Workflow complete
      setStep('create');
      setFormData({
        title: '',
        global_seed: Math.floor(Math.random() * 1000000),
      });

      // Refetch to ensure server state is current
      await refetch();
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  if (step === 'create') {
    return (
      <div>
        <h2>Create New Song</h2>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Song title"
        />
        <button onClick={handleCreateClick} disabled={!formData.title}>
          Next
        </button>
      </div>
    );
  }

  if (step === 'configure') {
    return (
      <div>
        <h2>Configure Song</h2>
        <div>
          <label>
            Seed:
            <input
              type="number"
              value={formData.global_seed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  global_seed: parseInt(e.target.value, 10),
                })
              }
            />
          </label>
        </div>
        <button onClick={() => setStep('confirm')}>Review & Create</button>
        <button onClick={() => setStep('create')}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Confirm Song Creation</h2>
      <div>
        <p>Title: {formData.title}</p>
        <p>Seed: {formData.global_seed}</p>
      </div>
      <button
        onClick={handleConfirm}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Song'}
      </button>
      <button onClick={() => setStep('configure')}>Back</button>

      {createMutation.error && (
        <div style={{ color: 'red' }}>
          Error: {createMutation.error.message}
        </div>
      )}

      <h3>Recent Songs ({songs.size})</h3>
      <ul>
        {Array.from(songs.values())
          .slice(-5)
          .map((song) => (
            <li key={song.id}>{song.title}</li>
          ))}
      </ul>
    </div>
  );
}
```

### Workflow Progress with Real-Time Updates

```typescript
import { useWorkflowProgressWithStore, useWorkflowSummaryWithStore } from '@/lib/hooks';
import { useRunScores, useRunArtifacts, useNodeEvents } from '@meatymusic/store';

export function RealTimeWorkflowMonitor({ runId }: { runId: string }) {
  const { data: progress } = useWorkflowProgressWithStore(runId);
  const { data: summary } = useWorkflowSummaryWithStore(runId);
  const scores = useRunScores(runId);
  const artifacts = useRunArtifacts(runId);
  const events = useNodeEvents(runId);

  const getNodeStatus = (nodeName: string) => {
    const nodeEvent = events.find((e) => e.node === nodeName);
    if (!nodeEvent) return 'pending';
    if (nodeEvent.phase === 'end') return 'completed';
    if (nodeEvent.phase === 'fail') return 'failed';
    return 'running';
  };

  const WORKFLOW_NODES = [
    'PLAN',
    'STYLE',
    'LYRICS',
    'PRODUCER',
    'COMPOSE',
    'VALIDATE',
    'RENDER',
    'REVIEW',
  ];

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px' }}>
      <h2>Workflow Progress: {progress?.progress_percentage || 0}%</h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          width: '100%',
          height: '24px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              width: `${progress?.progress_percentage || 0}%`,
              height: '100%',
              backgroundColor: '#4caf50',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      <div>
        <h3>Nodes</h3>
        {WORKFLOW_NODES.map((node) => {
          const status = getNodeStatus(node);
          const color =
            status === 'completed'
              ? '#4caf50'
              : status === 'failed'
                ? '#f44336'
                : status === 'running'
                  ? '#2196f3'
                  : '#ccc';

          return (
            <div
              key={node}
              style={{
                padding: '8px',
                margin: '4px 0',
                backgroundColor: color,
                color: 'white',
                borderRadius: '4px',
              }}
            >
              {node}: {status}
            </div>
          );
        })}
      </div>

      {scores && (
        <div style={{ marginTop: '20px' }}>
          <h3>Validation Scores</h3>
          <table>
            <tbody>
              <tr>
                <td>Hook Density:</td>
                <td>{scores.hook_density?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Singability:</td>
                <td>{scores.singability?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Rhyme:</td>
                <td>{scores.rhyme_tightness?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Section:</td>
                <td>{scores.section_completeness?.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Total:</td>
                <td style={{ fontWeight: 'bold' }}>
                  {scores.total?.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {artifacts && (
        <div style={{ marginTop: '20px' }}>
          <h3>Artifacts</h3>
          {artifacts.style && (
            <div>Style ID: {artifacts.style.id}</div>
          )}
          {artifacts.lyrics && (
            <div>Lyrics ID: {artifacts.lyrics.id}</div>
          )}
          {artifacts.producerNotes && (
            <div>Producer Notes ID: {artifacts.producerNotes.id}</div>
          )}
          {artifacts.composedPrompt && (
            <div>Prompt ID: {artifacts.composedPrompt.id}</div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Entity Management

### Style Selection with Recent Access

```typescript
import {
  useStyles,
  useSelectedStyleId,
  useRecentStyles,
  useEntitiesStore,
} from '@meatymusic/store';

export function StyleSelector() {
  const store = useEntitiesStore();
  const styles = useStyles();
  const selectedId = useSelectedStyleId();
  const recentStyles = useRecentStyles(5); // Last 5 accessed

  return (
    <div>
      <h3>Recent Styles</h3>
      <div>
        {recentStyles.length > 0 ? (
          recentStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => store.selectStyle(style.id)}
              style={{
                backgroundColor: selectedId === style.id ? '#2196f3' : '#f5f5f5',
                color: selectedId === style.id ? 'white' : 'black',
                padding: '8px 12px',
                margin: '4px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {style.name} ({style.genre})
            </button>
          ))
        ) : (
          <p>No recent styles</p>
        )}
      </div>

      <h3>All Styles ({styles.size})</h3>
      <select onChange={(e) => store.selectStyle(e.target.value || null)}>
        <option value="">-- Select a style --</option>
        {Array.from(styles.values()).map((style) => (
          <option key={style.id} value={style.id}>
            {style.name} ({style.genre})
          </option>
        ))}
      </select>

      {selectedId && (
        <button onClick={() => store.selectStyle(null)}>
          Deselect
        </button>
      )}
    </div>
  );
}
```

### Multi-Entity Synchronization

```typescript
import { useEntitiesWithStore } from '@/lib/hooks';
import {
  useStyleById,
  usePersonaById,
  useLyricsById,
} from '@meatymusic/store';

export function SongConfiguration({
  songId,
  styleId,
  personaId,
  lyricsId,
}: {
  songId: string;
  styleId: string;
  personaId: string;
  lyricsId: string;
}) {
  // Load all entities from API
  useEntitiesWithStore('style');
  useEntitiesWithStore('persona');
  useEntitiesWithStore('lyrics');

  // Get them from store
  const style = useStyleById(styleId);
  const persona = usePersonaById(personaId);
  const lyrics = useLyricsById(lyricsId);

  if (!style || !persona || !lyrics) {
    return <div>Loading entities...</div>;
  }

  return (
    <div>
      <h2>Song Configuration</h2>

      <section>
        <h3>Style</h3>
        <p>Name: {style.name}</p>
        <p>Genre: {style.genre}</p>
        <p>BPM: {style.bpm_min} - {style.bpm_max}</p>
      </section>

      <section>
        <h3>Persona</h3>
        <p>Name: {persona.name}</p>
        <p>Voice: {persona.voice}</p>
        <p>Vocal Range: {persona.vocal_range}</p>
      </section>

      <section>
        <h3>Lyrics</h3>
        <p>Language: {lyrics.language}</p>
        <p>Rhyme Scheme: {lyrics.rhyme_scheme}</p>
        <p>Meter: {lyrics.meter}</p>
      </section>
    </div>
  );
}
```

## Component Patterns

### Controlled Form with Store

```typescript
import { useState } from 'react';
import { useSongsStore } from '@meatymusic/store';

export function ControlledFilterForm() {
  const store = useSongsStore();
  const [tempSearch, setTempSearch] = useState('');
  const [tempStatus, setTempStatus] = useState<string>('');

  const handleApply = () => {
    store.setSearchQuery(tempSearch);
    if (tempStatus) {
      store.setFilters({ status: tempStatus as any });
    }
    store.applyFilters();
  };

  const handleReset = () => {
    setTempSearch('');
    setTempStatus('');
    store.clearFilters();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleApply();
      }}
    >
      <input
        type="text"
        value={tempSearch}
        onChange={(e) => setTempSearch(e.target.value)}
        placeholder="Search songs..."
      />

      <select
        value={tempStatus}
        onChange={(e) => setTempStatus(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="validated">Validated</option>
        <option value="rendered">Rendered</option>
      </select>

      <button type="submit">Apply Filters</button>
      <button type="button" onClick={handleReset}>
        Reset
      </button>
    </form>
  );
}
```

### Uncontrolled Component Reading Store

```typescript
import { useSongs, useSongsStore } from '@meatymusic/store';

export function UncontrolledSongList() {
  const store = useSongsStore();
  const songs = useSongs();

  return (
    <div>
      <button
        onClick={() => {
          store.setSearchQuery('popular');
          store.applyFilters();
        }}
      >
        Show Popular Songs
      </button>

      <ul>
        {Array.from(songs.values()).map((song) => (
          <li
            key={song.id}
            onClick={() => store.selectSong(song.id)}
          >
            {song.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Custom Hook Composition

```typescript
import { useEffect, useState } from 'react';
import { useSongsWithStore } from '@/lib/hooks';
import {
  useSongsFilters,
  useSongsLoading,
  useSongsError,
} from '@meatymusic/store';

/**
 * Composite hook combining query and store operations
 */
export function useSongsWithAutoRefresh(
  autoRefreshIntervalMs = 30000
) {
  const { refetch } = useSongsWithStore();
  const filters = useSongsFilters();
  const isLoading = useSongsLoading();
  const error = useSongsError();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, autoRefreshIntervalMs);

    return () => clearInterval(interval);
  }, [refetch, autoRefreshIntervalMs]);

  return {
    filters,
    isLoading,
    error,
    refetch,
  };
}

// Usage
export function AutoRefreshingSongsList() {
  const { filters, isLoading, error } = useSongsWithAutoRefresh(10000);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Songs are automatically refreshed every 10 seconds</div>;
}
```

### Performance-Optimized List

```typescript
import { useSongs, useSongsStore } from '@meatymusic/store';
import { useMemo } from 'react';

export function OptimizedSongsList() {
  const songs = useSongs();
  const store = useSongsStore();

  // Only recompute when songs.size changes
  const sortedSongs = useMemo(() => {
    return Array.from(songs.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [songs.size]); // Use size as dependency, not songs Map itself

  return (
    <div>
      {sortedSongs.map((song) => (
        <SongRow
          key={song.id}
          song={song}
          onSelect={() => store.selectSong(song.id)}
        />
      ))}
    </div>
  );
}

// Memoized row component to prevent re-renders
const SongRow = React.memo(
  ({ song, onSelect }: { song: Song; onSelect: () => void }) => (
    <div onClick={onSelect}>
      {song.title}
    </div>
  )
);
```

## Related Documentation

- [STORE-USAGE.md](./STORE-USAGE.md) - Complete API reference
- [STORE-TROUBLESHOOTING.md](./STORE-TROUBLESHOOTING.md) - Common issues and solutions
