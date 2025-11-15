# MeatyMusic Store Usage Guide

Complete reference for using the frontend state management system in MeatyMusic.

## Overview

MeatyMusic uses a sophisticated state management architecture combining:

- **Zustand** for reactive state management with minimal boilerplate
- **React Query** for server synchronization and cache management
- **localStorage** for persistence with multi-tab synchronization
- **TypeScript** for type-safe stores and selectors

The system manages four core domains:

1. **Songs Store** - Song catalog with list, pagination, filtering, and optimistic updates
2. **Workflows Store** - Execution tracking with progress, scoring, and artifacts
3. **Entities Store** - Reusable components (Styles, Lyrics, Personas, ProducerNotes, Sources)
4. **Preferences Store** - User preferences and settings
5. **Onboarding Store** - First-time user experience tracking

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  React Components                                            │
│  ├── useSongs, useSongById, useSongsFilters, etc.          │
│  ├── useStyles, usePersonas, useLyrics, etc.               │
│  └── usePreferences, useOnboarding                          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Integration Hooks (React Query + Store)                    │
│  ├── useSongsWithStore() - Sync query → store              │
│  ├── useWorkflowsWithStore() - Sync query → store          │
│  ├── useEntitiesWithStore() - Sync query → store           │
│  └── Mutation hooks with optimistic updates                 │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Zustand Stores with Middleware                             │
│  ├── Devtools (dev only)                                    │
│  ├── localStorage Persistence (debounced)                   │
│  ├── Multi-Tab Sync (storage events)                        │
│  └── Map Serialization (for complex data)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Server State (React Query)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Store Usage

```typescript
// Get all songs as a Map
const songs = useSongs();

// Get single song by ID
const song = useSongById(songId);

// Get paginated list state
const pagination = useSongsPagination();

// Get filter state
const filters = useSongsFilters();

// Update filters
const store = useSongsStore();
store.setSearchQuery('My Song');
store.applyFilters();
```

### With React Query

```typescript
import { useSongsWithStore } from '@/lib/hooks';

function SongsList() {
  const { data, isLoading, error } = useSongsWithStore({
    q: 'search text',
    status: ['draft', 'validated'],
    limit: 20
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data is synced to store automatically
  return (
    <div>
      {data?.items.map(song => (
        <div key={song.id}>{song.title}</div>
      ))}
    </div>
  );
}
```

### Optimistic Updates

```typescript
import { useCreateSongMutation } from '@/lib/hooks';

function CreateSongForm() {
  const mutation = useCreateSongMutation();

  async function handleSubmit(formData) {
    try {
      // Optimistic update happens automatically
      await mutation.mutateAsync({
        title: formData.title,
        global_seed: formData.seed,
        // ... other fields
      });
      // Show success
    } catch (error) {
      // Rollback happens automatically
      console.error('Failed to create song:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Store API Reference

### Songs Store

The Songs Store manages the song catalog with full list management capabilities.

#### State

```typescript
interface SongsListState {
  items: Map<string, Song>;              // Normalized songs by ID
  allIds: string[];                       // Ordered song IDs
  pagination: SongsPagination;            // Current pagination state
  filters: SongsFilters;                  // Active and staged filters
  sorting: SongsSorting;                  // Sort field and direction
  loading: boolean;                       // Loading state
  error: Error | null;                    // Error state
  lastUpdated: number | null;             // Last update timestamp
}

interface SongsSelectionState {
  selectedId: string | null;              // Currently selected song
  selectedIds: string[];                  // Multi-select IDs
  isComparing: boolean;                   // Comparison mode flag
}

interface SongsOptimisticState {
  stagedItems: Map<string, Song>;         // Created but uncommitted
  stagedUpdates: Map<string, Partial<Song>>; // Updated but uncommitted
  stagedRemovals: string[];               // Deleted but uncommitted
}
```

#### Query Sync Actions

```typescript
// Set items from API response
setItems(items: Song[], pagination: Partial<SongsPagination>): void

// Set loading state
setLoading(loading: boolean): void

// Set error state
setError(error: Error | null): void
```

#### Filter Actions

```typescript
// Update search query
setSearchQuery(query: string): void

// Set multiple filter fields
setFilters(filters: Partial<SongsFilters>): void

// Reset all filters
clearFilters(): void

// Commit pending filter changes
applyFilters(): void

// Discard pending filter changes
revertFilters(): void
```

#### Sorting & Pagination

```typescript
// Set sort field and direction
setSorting(field: 'title' | 'createdAt' | 'updatedAt', direction?: 'asc' | 'desc'): void

// Set current page
setPage(page: number): void

// Move to next page (if available)
nextPage(): void

// Move to previous page (if on page > 1)
previousPage(): void
```

#### Selection

```typescript
// Select single song
selectSong(id: string | null): void

// Add/remove from multi-select
toggleMultiSelect(id: string): void

// Clear all selections
clearSelection(): void

// Toggle comparison mode
setComparisonMode(enabled: boolean): void
```

#### Optimistic Operations

```typescript
// Stage a new song (not yet in server)
addOptimisticSong(song: Song): void

// Stage updates to existing song
updateOptimisticSong(id: string, updates: Partial<Song>): void

// Stage removal of a song
removeOptimisticSong(id: string): void

// Commit staged changes (after server confirmation)
commitOptimistic(id: string): void

// Discard staged changes (on error)
rollbackOptimistic(id: string): void
```

#### Cache Control

```typescript
// Mark cache as invalid (triggers refetch)
invalidate(): void

// Clear all songs from memory
clear(): void

// Full reset to initial state
reset(): void
```

### Workflows Store

Tracks workflow execution progress, scores, and artifacts.

#### State

```typescript
interface WorkflowsListState {
  items: Map<string, WorkflowRun>;        // Normalized runs by ID
  allIds: string[];                       // Ordered run IDs
  filters: WorkflowsFilters;              // Status/song filters
  sorting: WorkflowsSorting;              // Sort config
  pagination: WorkflowsPagination;        // Pagination state
  loading: boolean;                       // Loading state
  error: Error | null;                    // Error state
}

interface WorkflowProgressState {
  activeRunId: string | null;             // Currently tracked run
  nodeEvents: Map<string, WorkflowEvent[]>; // Events by run ID
  scores: Map<string, ScoreSummary>;      // Scores by run ID
  artifacts: Map<string, ArtifactMap>;    // Artifacts by run ID
}
```

#### Progress Tracking

```typescript
// Track overall run progress
trackRunProgress(runId: string, progress: number, currentNode: string): void

// Record a node event (start/end/fail)
trackNodeEvent(runId: string, event: WorkflowEvent): void

// Clear all details for a run
clearRunDetails(runId: string): void

// Get node events for a run
useNodeEvents(runId: string): WorkflowEvent[]

// Get scores for a run
useRunScores(runId: string): ScoreSummary | null

// Get artifacts for a run
useRunArtifacts(runId: string): ArtifactMap | null
```

#### Optimistic Operations

```typescript
// Mark run as cancelled (before server confirmation)
optimisticCancel(runId: string): void

// Confirm cancellation succeeded
commitCancel(runId: string): void

// Revert optimistic cancellation
rollbackCancel(runId: string): void

// Mark node as retrying
optimisticRetry(runId: string, nodeId: string): void

// Confirm retry succeeded
commitRetry(runId: string): void
```

### Entities Store

Manages reusable domain entities with individual caches and selection state.

#### Entity Types

```typescript
type EntityType = 'style' | 'lyrics' | 'persona' | 'producerNotes' | 'source';

interface EntityCache<T> {
  items: Map<string, T>;                  // Normalized items
  allIds: string[];                       // Ordered IDs
  metadata: {
    lastUpdated: number;                  // Cache freshness
    version: string;                      // Cache version
  };
  loading: boolean;                       // Loading state
  error: Error | null;                    // Error state
}
```

#### Style Operations

```typescript
// Load styles from API
setStyles(styles: Style[]): void

// Add single style
addStyle(style: Style): void

// Update style
updateStyle(id: string, updates: Partial<Style>): void

// Remove style
removeStyle(id: string): void

// Select style (records access)
selectStyle(id: string | null): void

// Get selected style ID
useSelectedStyleId(): string | null

// Get recent styles (with optional limit)
useRecentStyles(limit?: number): Style[]

// Get single style by ID
useStyleById(id: string): Style | null
```

#### Lyrics, Personas, and ProducerNotes

Similar patterns as Style:

```typescript
// Lyrics operations
setLyrics(), addLyrics(), updateLyrics(), removeLyrics(), selectLyrics()
useLyricsIds(), useLyricsById(), useSelectedLyricsId(), useRecentLyrics()

// Persona operations
setPersonas(), addPersona(), updatePersona(), removePersona(), selectPersona()
usePersonaIds(), usePersonaById(), useSelectedPersonaId(), useRecentPersonas()

// ProducerNotes operations (no selection)
setProducerNotes(), addProducerNotes(), updateProducerNotes(), removeProducerNotes()
useProducerNotesIds(), useProducerNotesById()

// Source operations (no selection)
setSources(), addSource(), updateSource(), removeSource()
useSourceIds(), useSourceById()
```

#### Generic Operations

```typescript
// Set cache for any entity type
setEntityCache<K extends EntityType>(type: K, items: EntityTypeMap[K][]): void

// Invalidate single entity type (marks stale, triggers refetch)
invalidateEntityType(type: EntityType): void

// Invalidate all entity caches
invalidateAll(): void

// Clear all entities from memory
clearCache(): void

// Record entity access (for recent tracking)
recordEntityAccess(type: EntityType, id: string): void

// Get recent entities of a type
getRecentEntities<K extends EntityType>(type: K, limit?: number): EntityTypeMap[K][]
```

#### Status Queries

```typescript
// Check if entity type is loading
useEntityLoading(type: EntityType): boolean

// Get error for entity type
useEntityError(type: EntityType): Error | null

// Get cache metadata
useEntityMetadata(type: EntityType): { lastUpdated: number; version: string }
```

### Preferences Store

User settings and preferences.

#### State

```typescript
interface PreferencesState {
  theme: 'light' | 'dark' | 'ocean' | 'sand';
  communicationOptIn: boolean;
  notifications: {
    email_updates: boolean;
    prompt_shares: boolean;
  };
}
```

#### Actions

```typescript
// Set theme
setTheme(theme: 'light' | 'dark' | 'ocean' | 'sand'): void

// Update notification preferences
updateNotifications(partial: Partial<Preferences['notifications']>): void

// Toggle communication opt-in
toggleCommunicationOptIn(): void
```

### Onboarding Store

First-time user experience tracking.

#### State

```typescript
interface OnboardingState {
  isActive: boolean;        // Onboarding visible
  currentStep: number;      // Current step (1-indexed)
  totalSteps: number;       // Total step count
  isCompleted: boolean;     // User finished onboarding
  isDismissed: boolean;     // User dismissed onboarding
  completedAt: string | null; // ISO timestamp when completed
}
```

#### Actions

```typescript
// Set current step
setOnboardingStep(step: number, totalSteps?: number): void

// Mark as completed
completeOnboarding(): void

// User dismissed (don't show again this session)
dismissOnboarding(): void

// Reset to initial state
resetOnboarding(): void
```

## Selector Hooks

All stores export memoized selectors for optimal performance:

```typescript
// Songs selectors
useSongs()              // Map<string, Song>
useSongsIds()          // string[]
useSongById(id)        // Song | null
useSongsFilters()      // SongsFilters
useSongsLoading()      // boolean
useSongsError()        // Error | null
useSongsSelectedId()   // string | null
useSongsPagination()   // SongsPagination

// Workflows selectors
useWorkflows()              // Map<string, WorkflowRun>
useWorkflowIds()           // string[]
useWorkflowById(id)        // WorkflowRun | null
useWorkflowsFilters()      // WorkflowsFilters
useWorkflowsSorting()      // WorkflowsSorting
useWorkflowsPagination()   // WorkflowsPagination
useWorkflowsLoading()      // boolean
useWorkflowsError()        // Error | null
useActiveRunId()           // string | null
useNodeEvents(runId)       // WorkflowEvent[]
useRunScores(runId)        // ScoreSummary | null
useRunArtifacts(runId)     // ArtifactMap | null
useIsRunCancelled(runId)   // boolean
useRetryingNode(runId)     // string | null

// Entities selectors
useStyles()                 // Map<string, Style>
useStyleIds()              // string[]
useStyleById(id)           // Style | null
useSelectedStyleId()       // string | null
useRecentStyles(limit)     // Style[]
// ... similar for lyrics, personas, etc.

// Preferences selectors (use directly)
const store = usePreferencesStore();
store.theme           // 'light' | 'dark' | 'ocean' | 'sand'
store.notifications   // { email_updates: boolean; prompt_shares: boolean }

// Onboarding selectors (use directly)
const store = useOnboardingStore();
store.isActive        // boolean
store.currentStep     // number
store.isCompleted     // boolean
```

## Middleware & Persistence

### localStorage Persistence

- **Key**: Unique per store (e.g., `meatymusic-songs-list`)
- **Debounce**: 300-600ms to avoid excessive writes
- **Hydration**: Automatic on store creation
- **Limitations**: 5-10MB per domain; not suitable for large datasets

```typescript
// Persistence is automatic
const store = useSongsStore();
store.setSearchQuery('test'); // Persisted after 300ms
```

### Multi-Tab Synchronization

- **Storage Events**: Triggered in other tabs when localStorage changes
- **Merge Strategies**: `'replace'` or `'merge'` (configurable per store)
- **Timestamp-Based**: Prevents race conditions with last-write-wins
- **Function Preservation**: Methods/actions not serialized; automatically restored

```typescript
// Multi-tab sync is automatic
// Tab A: store.selectSong('123');
// Tab B: Automatically receives and applies the update

// Merge strategy example:
// 'replace' - other tab's state completely replaces ours
// 'merge'   - shallow merge; other tab's fields win conflicts
```

### Devtools

Redux DevTools integration enabled in development:

```typescript
// In browser DevTools:
// 1. Open Redux DevTools extension
// 2. Select store from dropdown
// 3. Inspect state, actions, time-travel debug
```

## Map Serialization

Stores using Maps (Songs, Workflows, Entities) handle serialization automatically:

```typescript
// Under the hood:
// items Map is converted to array: [[id, item], [id, item], ...]
// On hydration, array is converted back to Map
// TypeScript ensures this is transparent

const songs = useSongs(); // Still a Map in runtime
songs.get(id);            // Fully functional Map methods
songs.size;               // Works as expected
```

## Type Safety

Full TypeScript support throughout:

```typescript
// Type-safe store access
const store = useSongsStore();
const songs = store.items; // Map<string, Song>
const ids = store.allIds;  // string[]

// Type-safe selectors
const song = useSongById(id); // Song | null
song?.title; // Type-safe access

// Type-safe mutations
store.setSearchQuery('test'); // ✓ Correct
store.setSearchQuery(123);    // ✗ TypeScript error

// Generic entity operations
const styles = useStyles(); // Map<string, Style>
store.selectStyle(styleId); // ✓
store.selectStyle(null);    // ✓ Deselect
// Type-safe with discriminated unions for entity types
```

## Performance Considerations

### Selector Optimization

Selectors use memoization to prevent unnecessary re-renders:

```typescript
// Good: Memoized selector
const songs = useSongs(); // Only re-renders if songs.items changes

// Also good: Extract Map key
const songById = useSongById(id); // Only re-renders if this song changes

// Avoid: Creating new objects in selectors
const allSongs = useWorkflows((s) => Array.from(s.items.values()));
// Re-renders on every state change! Use hook instead:
const songs = useSongs();
const arr = Array.from(songs.values());
```

### Pagination

Use pagination to load data incrementally:

```typescript
// Load first page
const { data } = useSongsWithStore({ limit: 20, page: 1 });

// Load next page
const store = useSongsStore();
store.nextPage();

// Or jump to specific page
store.setPage(5);
```

### Normalization

Songs and Workflows stores use normalized data (Map + allIds):

```typescript
// Good: Direct lookup by ID is O(1)
const song = useSongById(id);

// Avoid: Linear search through array
const songs = Array.from(useSongs().values());
const found = songs.find(s => s.id === id); // O(n)
```

## React Query Integration

### Query Keys

Consistent query key structure for cache management:

```typescript
import { songsKeys, workflowsKeys } from '@/lib/hooks';

// Query key for list
songsKeys.list(filters);
// Result: ['songs', 'list', filters]

// Query key for detail
songsKeys.detail(id);
// Result: ['songs', 'detail', id]

// Invalidate all songs queries
queryClient.invalidateQueries({ queryKey: songsKeys.all });

// Invalidate list queries with specific filters
queryClient.invalidateQueries({ queryKey: songsKeys.list(filters) });
```

### Stale Times

Default stale times per data freshness:

```typescript
// Songs: 30 seconds (static lists)
useSongsWithStore() // staleTime: 30000

// Song detail: 1 minute (can change)
useSongWithStore(id) // staleTime: 60000

// Workflows: 10 seconds (active lists)
useWorkflowsWithStore() // staleTime: 10000

// Workflow detail: 5 seconds (actively changing)
useWorkflowDetailsWithStore() // staleTime: 5000

// Progress: 3 seconds (actively polled)
useWorkflowProgressWithStore() // staleTime: 3000
```

## Best Practices

### 1. Use Integration Hooks

Always use the integration hooks, not direct store access for server data:

```typescript
// Good: Data synced from API to store
const { data } = useSongsWithStore({ q: 'test' });

// Avoid: Directly querying store (stale data)
const songs = useSongs(); // Might not have latest data
```

### 2. Commit Optimistic Updates

Always commit or rollback optimistic changes:

```typescript
// Good: Handle success/error
try {
  const song = await createSong.mutateAsync(data);
  store.commitOptimistic(song.id);
} catch {
  store.rollbackOptimistic(tempId);
}

// The mutation hooks handle this automatically
```

### 3. Select Specific Fields

Use selectors instead of entire state:

```typescript
// Good: Only re-renders when pagination changes
const pagination = useSongsPagination();

// Avoid: Re-renders on any state change
const { pagination } = useSongsStore();
```

### 4. Debounce Filter Changes

Apply filters after user finishes typing:

```typescript
// Good: Debounce in component
const [search, setSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    store.setSearchQuery(search);
    store.applyFilters();
  }, 300);

  return () => clearTimeout(timer);
}, [search]);

// Or use react-use/useDebounce
```

### 5. Clear Selection on Navigation

Prevent state from persisting across route changes:

```typescript
useEffect(() => {
  return () => {
    // Clean up when component unmounts
    store.clearSelection();
  };
}, []);
```

## Debugging

### Development Tools

Enable Redux DevTools in development:

```typescript
// Automatic in development mode
// Open: Redux DevTools Chrome extension

// In browser console:
// Track a specific store
window.__REDUX_DEVTOOLS_EXTENSION__?.open();

// Export current state
JSON.stringify(useWorkflowsStore.getState(), null, 2);
```

### Console Logging

Middleware logs detailed information in development:

```
store.hydrate: { key: 'meatymusic-songs-list' }
middleware.sync.start: { key: 'meatymusic-songs-list' }
middleware.sync.success: { key: 'meatymusic-songs-list' }
multiTab.sync.success: { key: '...', timestamp: 1234567890 }
```

### Common Debug Patterns

```typescript
// Check current state
const state = useSongsStore.getState();
console.log('State:', state);

// Subscribe to changes
const unsubscribe = useSongsStore.subscribe(
  (state) => console.log('New state:', state)
);

// Get action history (devtools only)
// Redux DevTools shows full action/state timeline
```

## Related Documentation

- [STORE-EXAMPLES.md](./STORE-EXAMPLES.md) - Practical integration examples
- [STORE-TROUBLESHOOTING.md](./STORE-TROUBLESHOOTING.md) - Common issues and solutions
- [API Documentation](./api) - Server API endpoints
- [Architecture Overview](./amcs-overview.md) - System architecture
