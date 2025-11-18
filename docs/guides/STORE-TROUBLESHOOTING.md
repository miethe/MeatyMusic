# MeatyMusic Store Troubleshooting Guide

Solutions for common state management issues and debugging strategies.

## Table of Contents

1. [localStorage Issues](#localstorage-issues)
2. [Optimistic Update Problems](#optimistic-update-problems)
3. [Multi-Tab Synchronization Issues](#multi-tab-synchronization-issues)
4. [React Query Integration Issues](#react-query-integration-issues)
5. [Performance Problems](#performance-problems)
6. [TypeScript Errors](#typescript-errors)
7. [Data Consistency Issues](#data-consistency-issues)
8. [Testing Issues](#testing-issues)
9. [Debugging Strategies](#debugging-strategies)

## localStorage Issues

### Issue: "QuotaExceededError: DOM Exception 22"

**Problem**: localStorage has reached its 5-10 MB limit

**Causes**:
- Store contains too much data (Maps with thousands of items)
- Images or large objects stored in localStorage
- Persistence not properly cleaned up

**Solutions**:

1. **Clear old data**
```typescript
// In browser console or component
localStorage.removeItem('meatymusic-songs-list');
localStorage.removeItem('meatymusic-entities-cache');
localStorage.removeItem('meatymusic-workflows-progress');
```

2. **Implement cleanup in store**
```typescript
// Only persist UI state, not data
const withMinimalPersistence = (config: StateCreator<WorkflowsStore>) => {
  return (set, get, api) => {
    const originalSet = set;
    const customSet: typeof set = (partial, replace) => {
      originalSet(partial, replace);

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const state = get();
          // Only persist UI fields, not data
          const uiState = {
            activeRunId: state.activeRunId,
            filters: state.filters,
            sorting: state.sorting,
          };
          window.localStorage.setItem('key', JSON.stringify(uiState));
        } catch (error) {
          if (error instanceof DOMException && error.code === 22) {
            console.warn('localStorage quota exceeded');
            // Clear old data
            localStorage.clear();
          }
        }
      }
    };
    (api as any).setState = customSet;
    return config(set, get, api);
  };
};
```

3. **Paginate data instead of storing all**
```typescript
// Don't load all 10,000 songs at once
const { data } = useSongsWithStore({
  limit: 50,
  page: 1
});

// Load more as user navigates
const handleNextPage = () => {
  store.nextPage();
  // Refetch with new page number
};
```

4. **Exclude large data from persistence**
```typescript
// Configure what gets persisted
const withSelectivePersistence = (config: StateCreator<MyStore>) => {
  return (set, get, api) => {
    const originalSet = set;
    const customSet: typeof set = (partial, replace) => {
      originalSet(partial, replace);

      // Only persist small fields
      const { largeData, ...persistable } = get();
      window.localStorage.setItem('key', JSON.stringify(persistable));
    };
    (api as any).setState = customSet;
    return config(set, get, api);
  };
};
```

### Issue: "Failed to parse stored state"

**Problem**: localStorage contains corrupted or invalid JSON

**Causes**:
- Manual editing of localStorage
- Incomplete write (storage event during shutdown)
- Version mismatch (old format after code changes)

**Solutions**:

1. **Clear and restart**
```javascript
// In browser console
localStorage.removeItem('meatymusic-songs-list');
location.reload();
```

2. **Add graceful error handling**
```typescript
try {
  const stored = window.localStorage.getItem(key);
  if (stored) {
    const parsed = JSON.parse(stored);
    set(parsed, true);
  }
} catch (error) {
  console.error('Failed to hydrate from localStorage:', error);
  // Continue with initial state
  set(initialState, true);
}
```

3. **Version migration**
```typescript
const withVersionCheck = (config: StateCreator<MyStore>) => {
  return (set, get, api) => {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');

    if (stored.version !== '2.0.0') {
      console.log('Migrating from version', stored.version);
      // Apply migrations
      if (!stored.version || stored.version === '1.0.0') {
        stored.filters = migrateFilters(stored.filters);
      }
    }

    set(stored, true);
    return config(set, get, api);
  };
};
```

### Issue: "State not persisting between refreshes"

**Problem**: localStorage changes aren't being saved

**Causes**:
- localStorage middleware not initialized
- SSR/hydration mismatch
- localStorage disabled in browser
- Debounce not allowing enough time before shutdown

**Solutions**:

1. **Check if localStorage is available**
```typescript
const isStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// In middleware
if (isStorageAvailable()) {
  // Setup persistence
}
```

2. **Handle SSR correctly**
```typescript
// Good: Check window before using localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  // Safe to use localStorage
}

// Avoid: Assuming localStorage exists
localStorage.setItem(...); // Might fail on server
```

3. **Increase debounce time**
```typescript
// Give more time for debounced saves
createLocalStorageMiddleware<SongsStore>(
  'meatymusic-songs-list',
  1000 // 1 second instead of 300ms
)
```

4. **Force save before navigation**
```typescript
useEffect(() => {
  const handleBeforeUnload = () => {
    // Get current state and force persist
    const state = useSongsStore.getState();
    localStorage.setItem('meatymusic-songs-list', JSON.stringify(state));
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

## Optimistic Update Problems

### Issue: "Optimistic update never commits or rolls back"

**Problem**: UI shows change but state isn't properly committed/rolled back on success/error

**Causes**:
- Missing `commitOptimistic()` or `rollbackOptimistic()` call
- Error in mutation onSuccess/onError handlers
- ID mismatch between optimistic item and server response

**Solutions**:

1. **Use mutation hooks (handles automatically)**
```typescript
// Good: Hooks handle commit/rollback
const mutation = useCreateSongMutation();
await mutation.mutateAsync(data);

// Avoid: Manual mutation without proper handlers
useMutation({
  mutationFn: (data) => api.create(data),
  // Missing onSuccess/onError!
});
```

2. **Explicit commit/rollback pattern**
```typescript
const { mutate } = useMutation({
  mutationFn: (data) => songApi.create(data),

  onMutate: async (data) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticSong = { id: tempId, ...data };
    store.addOptimisticSong(optimisticSong);
    return { tempId };
  },

  onSuccess: (response, _, context) => {
    // IMPORTANT: Use server response ID, not temp ID
    if (context?.tempId) {
      store.rollbackOptimistic(context.tempId); // Remove temp
    }
    store.addOptimisticSong(response); // Add real
    store.commitOptimistic(response.id); // Mark as committed
  },

  onError: (_, __, context) => {
    if (context?.tempId) {
      store.rollbackOptimistic(context.tempId);
    }
  },
});
```

3. **Verify ID consistency**
```typescript
// Problem: IDs don't match
const tempId = `temp-${Date.now()}`; // "temp-1234567"
// ... later ...
store.commitOptimistic(serverResponse.id); // "real-uuid" - DIFFERENT!

// Solution: Track both IDs
const context = { tempId, serverId: null };
// onSuccess:
store.rollbackOptimistic(context.tempId);
store.commitOptimistic(context.serverId);
```

### Issue: "User sees stale data after rollback"

**Problem**: Optimistic update rolled back, but UI shows old version

**Causes**:
- Store not refetching from server after rollback
- Component cached old data
- React Query cache not invalidated

**Solutions**:

1. **Invalidate queries on error**
```typescript
const mutation = useMutation({
  mutationFn: (data) => api.update(data),

  onError: (_, { id }, context) => {
    store.rollbackOptimistic(id);

    // Force refetch from server
    queryClient.invalidateQueries({
      queryKey: songsKeys.detail(id)
    });
  },
});
```

2. **Refetch before showing final state**
```typescript
const { mutate } = useUpdateSongMutation();

const handleSave = async (updates) => {
  try {
    await mutate(updates, {
      onSuccess: () => {
        // Refetch to ensure UI shows server truth
        queryClient.refetchQueries({
          queryKey: songsKeys.detail(updates.id),
          type: 'active'
        });
      }
    });
  } catch (error) {
    console.error('Failed to save');
  }
};
```

3. **Show error to user explicitly**
```typescript
const UpdateSongForm = ({ song }) => {
  const mutation = useUpdateSongMutation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData) => {
    setError(null);
    try {
      await mutation.mutateAsync({
        id: song.id,
        updates: formData
      });
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
      // Store rollback is automatic, but inform user
    }
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {/* form fields */}
    </>
  );
};
```

### Issue: "Optimistic updates conflict with server data"

**Problem**: Multiple optimistic updates to same field result in incorrect state

**Causes**:
- Multiple mutations in flight for same entity
- UI doesn't prevent double-clicks
- Race condition between local and server updates

**Solutions**:

1. **Disable UI during mutation**
```typescript
const mutation = useCreateSongMutation();

return (
  <form onSubmit={(e) => {
    e.preventDefault();
    mutation.mutate(data);
  }}>
    <input {...} />
    <button disabled={mutation.isPending}>
      {mutation.isPending ? 'Saving...' : 'Save'}
    </button>
  </form>
);
```

2. **Use mutation key to prevent duplicates**
```typescript
const mutation = useMutation({
  mutationFn: (data) => api.update(data),
  mutationKey: ['songs', songId, 'update'],
});

// ReactQuery prevents duplicate mutations with same key
```

3. **Implement last-write-wins merge strategy**
```typescript
const withLastWriteWins = (config: StateCreator<SongsStore>) => {
  return (set, get, api) => {
    const originalSet = set;

    const customSet: typeof set = (partial, replace) => {
      if (typeof partial !== 'function') {
        // Add timestamp to track write order
        (partial as any)._timestamp = Date.now();
      }
      originalSet(partial, replace);
    };

    (api as any).setState = customSet;
    return config(set, get, api);
  };
};
```

## Multi-Tab Synchronization Issues

### Issue: "Changes from other tabs not appearing"

**Problem**: Open same site in 2 tabs, change in Tab A doesn't appear in Tab B

**Causes**:
- Storage events not firing (Private/Incognito mode)
- Multi-tab middleware not installed
- localStorage changes to different key

**Solutions**:

1. **Verify middleware is installed**
```typescript
// Good: Middleware in correct order
const withMiddleware = (config: StateCreator<SongsStore>) =>
  withMapHydration(
    createLocalStorageMiddleware<SongsStore>('key', 300)(
      createMultiTabMiddleware<SongsStore>('key', {
        mergeStrategy: 'merge',
      })(config)
    )
  );

// Key must match between localStorage and multiTab
```

2. **Test in non-private mode**
```javascript
// Private/Incognito doesn't fire storage events
// Test in normal browser mode
```

3. **Check storage events**
```typescript
// In browser console
window.addEventListener('storage', (event) => {
  console.log('Storage event:', {
    key: event.key,
    newValue: event.newValue ? 'exists' : 'null',
    url: event.url
  });
});

// Change in Tab A, should see event in Tab B
```

4. **Verify localStorage key matches**
```typescript
// Middleware must use same key
createLocalStorageMiddleware<SongsStore>('meatymusic-songs-list')(
  createMultiTabMiddleware<SongsStore>('meatymusic-songs-list')(config)
);

// Different keys = no sync
// ✗ localStorage: 'meatymusic-songs-list'
// ✗ multiTab: 'songs-list'
```

### Issue: "Timestamp-based conflicts causing stale data"

**Problem**: One tab's newer update is ignored because of stale timestamp

**Causes**:
- System clock skew between tabs
- Rapid updates in quick succession
- Timestamp collision (same millisecond)

**Solutions**:

1. **Use custom merge strategy**
```typescript
createMultiTabMiddleware<SongsStore>('meatymusic-songs-list', {
  mergeStrategy: (incoming, current) => {
    // Don't use timestamp, use specific field logic
    return {
      ...current,
      items: incoming.items, // Always take newest items
      pagination: incoming.pagination, // Always take newest pagination
      filters: current.filters, // Keep local filters
    };
  },
})(config)
```

2. **Implement vector clock**
```typescript
interface VersionedState {
  items: Map<string, Song>;
  _vectorClock: Record<string, number>; // Tab ID -> version
}

// More advanced but prevents timestamp issues
```

3. **Use server timestamp, not client**
```typescript
// Bad: Client system time can be wrong
_lastSyncTimestamp: Date.now()

// Good: Use server time from API response
useEffect(() => {
  api.getSystemTime().then(serverTime => {
    store.setTimestamp(serverTime);
  });
}, []);
```

### Issue: "Functions missing after multi-tab sync"

**Problem**: Store methods become undefined after sync from another tab

**Causes**:
- Middleware not preserving functions during serialization
- onError handler called on function

**Solutions**:

1. **Ensure middleware preserves functions**
```typescript
// Good: Middleware in hook includes function preservation
for (const key in currentState) {
  if (typeof (currentState as any)[key] === 'function') {
    newState[key] = (currentState as any)[key];
  }
}

// This is handled by default in createMultiTabMiddleware
```

2. **Don't use store methods in serialized data**
```typescript
// Bad: Trying to serialize a function
store.addOptimisticSong({
  id: '123',
  title: 'Test',
  onSave: () => { /* ... */ }, // Can't serialize!
});

// Good: Keep functions in component, data in store
```

## React Query Integration Issues

### Issue: "Store data doesn't sync with React Query"

**Problem**: API returns new data but store doesn't update

**Causes**:
- Not using integration hooks (useSongsWithStore, etc.)
- useQuery used directly without store sync
- Side effect not properly connected

**Solutions**:

1. **Use integration hooks**
```typescript
// Good: Syncs automatically
const { data } = useSongsWithStore({ q: 'test' });

// Avoid: Direct useQuery without sync
const { data } = useQuery({
  queryKey: songsKeys.list(filters),
  queryFn: () => songsApi.list(filters),
  // No sync to store!
});
```

2. **Manually sync if needed**
```typescript
export function useSongsManualSync(filters: SongFilters) {
  const setItems = useSongsStore((state) => state.setItems);

  const query = useQuery({
    queryKey: songsKeys.list(filters),
    queryFn: () => songsApi.list(filters),
  });

  // Manually sync data to store
  useEffect(() => {
    if (query.data) {
      setItems(query.data.items, {
        total: query.data.page_info.total_count,
        hasMore: query.data.page_info.has_next_page,
      });
    }
  }, [query.data, setItems]);

  return query;
}
```

3. **Check query key consistency**
```typescript
// Query keys must match for proper cache management
const queryKey = songsKeys.list(filters);

// When invalidating:
queryClient.invalidateQueries({ queryKey });

// Must use exact same key structure
```

### Issue: "Queries never refetch after mutation"

**Problem**: After create/update/delete, old list query still cached

**Causes**:
- Query not invalidated after mutation
- Invalidation key doesn't match query key
- staleTime too long preventing automatic refetch

**Solutions**:

1. **Invalidate on mutation success**
```typescript
const mutation = useCreateSongMutation();

const handleCreate = async () => {
  try {
    await mutation.mutateAsync(data);
    // Invalidate list queries
    queryClient.invalidateQueries({
      queryKey: songsKeys.lists(),
    });
  } catch (error) {
    console.error('Failed');
  }
};
```

2. **Set appropriate stale times**
```typescript
// Too long: Data not refetched even after mutation
useQuery({
  queryKey: songsKeys.list(filters),
  queryFn: () => songsApi.list(filters),
  staleTime: 1000 * 60 * 60, // 1 hour - too long!
});

// Better: 30 seconds for lists
staleTime: 30000,
```

3. **Use query key patterns correctly**
```typescript
// Good: invalidate parent key includes all children
queryClient.invalidateQueries({
  queryKey: songsKeys.lists(), // ['songs', 'list']
  // Invalidates: ['songs', 'list', filters]
});

// Avoid: Exact match only
queryClient.invalidateQueries({
  queryKey: songsKeys.list(filters), // Only this exact query
  exact: true,
});
```

### Issue: "Stale data shown during polling"

**Problem**: useWorkflowProgressWithStore keeps showing old values

**Causes**:
- Polling interval too long
- refetchInterval disabled after completion
- staleTime longer than poll interval

**Solutions**:

1. **Adjust polling intervals**
```typescript
const query = useQuery({
  queryKey: workflowsKeys.progress(runId),
  queryFn: () => workflowsApi.getProgress(runId),
  staleTime: 3000, // 3 seconds
  refetchInterval: (query) => {
    const data = query.state.data;
    // Poll every 2 seconds while running
    return data?.progress_percentage < 100 ? 2000 : false;
  },
});
```

2. **Stop polling on completion**
```typescript
const { data: progress } = useQuery({
  // ...
  refetchInterval: (query) => {
    // Stop polling when complete
    if (query.state.data?.status === 'completed') {
      return false;
    }
    return 2000;
  },
});
```

## Performance Problems

### Issue: "Component re-renders on every store change"

**Problem**: Changing one part of store causes entire component to re-render

**Causes**:
- Using entire store state instead of selectors
- Selector creates new object each render
- Not memoizing complex computations

**Solutions**:

1. **Use specific selectors**
```typescript
// Bad: Re-renders when anything in store changes
const store = useSongsStore();
const songs = store.items;

// Good: Only re-renders when songs change
const songs = useSongs();

// Even better: Only re-renders when this song changes
const song = useSongById(songId);
```

2. **Memoize derived data**
```typescript
// Bad: Creates new array on every render
const songArray = Array.from(useSongs().values());

// Good: Memoized until songs.size changes
const songArray = useMemo(
  () => Array.from(useSongs().values()),
  [useSongs().size]
);
```

3. **Use memo for list items**
```typescript
// Bad: Re-renders every row when store changes
function SongsList() {
  const songs = useSongs();
  return (
    <div>
      {Array.from(songs.values()).map(song => (
        <SongRow key={song.id} song={song} />
      ))}
    </div>
  );
}

// Good: Memoized rows prevent unnecessary renders
const SongRow = React.memo(({ song }) => (
  <div>{song.title}</div>
));
```

### Issue: "Large Map operations are slow"

**Problem**: Iterating over 10,000 songs is slow

**Causes**:
- Converting Map to Array repeatedly
- No pagination
- Inline computations in render

**Solutions**:

1. **Paginate data**
```typescript
// Don't load all 10,000 items
const { data } = useSongsWithStore({
  limit: 50,
  page: currentPage,
});

// Render only 50 items
```

2. **Cache array conversion**
```typescript
const songs = useSongs();

// Bad: Creates new array on every render
songs.values()

// Good: Memoize the array
const songArray = useMemo(
  () => Array.from(songs.values()),
  [songs.size]
);
```

3. **Use virtualization for long lists**
```typescript
import { FixedSizeList } from 'react-window';

export function VirtualizedSongsList() {
  const songs = useSongs();
  const songArray = Array.from(songs.values());

  return (
    <FixedSizeList
      height={600}
      itemCount={songArray.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <div style={style}>
          {songArray[index].title}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Issue: "localStorage writes blocking UI"

**Problem**: App becomes unresponsive during debounced persist

**Causes**:
- Large state object (thousands of items)
- JSON.stringify taking time
- Debounce time too short

**Solutions**:

1. **Increase debounce time**
```typescript
// Better: Give more time between writes
createLocalStorageMiddleware<SongsStore>(
  'meatymusic-songs-list',
  1000 // 1 second debounce
)
```

2. **Persist only UI state**
```typescript
// Only persist filters, pagination, selection
const uiState = {
  filters: state.filters,
  pagination: state.pagination,
  selectedId: state.selectedId,
  // NOT: state.items (the data)
};

window.localStorage.setItem(key, JSON.stringify(uiState));
```

3. **Async persistence**
```typescript
const persist = debounce((state: T) => {
  // Use requestIdleCallback to avoid blocking main thread
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      localStorage.setItem(key, JSON.stringify(state));
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, 0);
  }
}, 300);
```

## TypeScript Errors

### Issue: "Cannot find module '@meatymusic/store'"

**Problem**: TypeScript can't resolve store imports

**Causes**:
- Package not installed
- Wrong import path
- monorepo build issue

**Solutions**:

1. **Verify installation**
```bash
npm ls @meatymusic/store
pnpm ls @meatymusic/store
```

2. **Check import path**
```typescript
// Correct
import { useSongsStore } from '@meatymusic/store';

// Wrong
import { useSongsStore } from '@meatymusic/store/index';
import { useSongsStore } from '../../../packages/store';
```

3. **Build package if needed**
```bash
# If in monorepo, ensure package is built
cd packages/store
pnpm build
```

4. **Check tsconfig.json paths**
```json
{
  "compilerOptions": {
    "paths": {
      "@meatymusic/store": ["./packages/store/src/index.ts"]
    }
  }
}
```

### Issue: "Type 'Map' is not assignable to type 'object'"

**Problem**: Map serialization TypeScript error

**Causes**:
- Type mismatch in selector
- Map not properly typed in store

**Solutions**:

1. **Use correct selector type**
```typescript
// Bad: Expecting object
const songs: Record<string, Song> = useSongs();

// Good: Expecting Map
const songs: Map<string, Song> = useSongs();

// Or
const songs = useSongs(); // Let TS infer
```

2. **Convert Map to proper type**
```typescript
// If you need Object
const songsObject = Object.fromEntries(useSongs());

// If you need Array
const songsArray = Array.from(useSongs().values());
```

### Issue: "Cannot assign to readonly property"

**Problem**: Store state appears immutable even with actions

**Causes**:
- Using const instead of let
- Attempting direct property mutation
- Zustand state is read-only

**Solutions**:

1. **Use store actions, not mutation**
```typescript
// Bad: Can't mutate state directly
const state = useSongsStore.getState();
state.items.set('id', song); // May not trigger updates

// Good: Use actions
useSongsStore.getState().addOptimisticSong(song);
```

2. **Use proper TypeScript patterns**
```typescript
// Good: Let Zustand handle state updates
const store = useSongsStore();
store.setSearchQuery('test');

// Avoid: Direct mutation attempts
store.filters.search = 'test'; // Won't trigger update
```

## Data Consistency Issues

### Issue: "Selectors return stale data"

**Problem**: Selector returns old value even after update

**Causes**:
- Subscription not properly set up
- Selector memoization issue
- State update failed silently

**Solutions**:

1. **Check subscription is working**
```typescript
// Debug: Subscribe to specific changes
useEffect(() => {
  const unsubscribe = useSongsStore.subscribe(
    (state) => state.items,
    (items) => {
      console.log('Items changed:', items.size);
    }
  );

  return unsubscribe;
}, []);
```

2. **Verify state update succeeded**
```typescript
const store = useSongsStore();

// Check state was updated
store.setSearchQuery('test');
console.log('Current query:', store.getState().filters.search);

// If still old value, update failed
```

3. **Force component update**
```typescript
// If selector seems stuck
const [, forceUpdate] = useState({});

useEffect(() => {
  const unsubscribe = useSongsStore.subscribe(
    (state) => state.items,
    () => forceUpdate({})
  );

  return unsubscribe;
}, []);
```

### Issue: "Multi-tab sync creates duplicates"

**Problem**: Same item appears twice after sync from other tab

**Causes**:
- Item added locally, then synced from other tab
- Merge strategy merges instead of replacing
- ID collision

**Solutions**:

1. **Use replace strategy instead of merge**
```typescript
createMultiTabMiddleware<SongsStore>('key', {
  mergeStrategy: 'replace', // Complete replace, no duplicates
})(config)
```

2. **Implement deduplication**
```typescript
const withDeduplication = (config: StateCreator<SongsStore>) => {
  return (set, get, api) => {
    const originalSet = set;

    const customSet: typeof set = (partial, replace) => {
      if (partial.items instanceof Map) {
        // Deduplicate by ID
        const seen = new Set<string>();
        const deduplicated = new Map<string, Song>();

        partial.items.forEach((item, id) => {
          if (!seen.has(id)) {
            deduplicated.set(id, item);
            seen.add(id);
          }
        });

        originalSet({ ...partial, items: deduplicated }, replace);
      } else {
        originalSet(partial, replace);
      }
    };

    (api as any).setState = customSet;
    return config(set, get, api);
  };
};
```

## Testing Issues

### Issue: "Tests fail with 'window is not defined'"

**Problem**: SSR/Node tests can't access localStorage

**Causes**:
- localStorage not available in test environment
- Middleware tries to access window

**Solutions**:

1. **Mock localStorage in tests**
```typescript
beforeEach(() => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});
```

2. **Skip middleware in tests**
```typescript
// Create store without middleware for testing
const createTestStore = () =>
  create<SongsStore>((set) => ({
    items: new Map(),
    allIds: [],
    // ... rest of state
    setItems: (items) => set({ items: new Map(items.map(i => [i.id, i])) }),
    // ... rest of actions
  }));

describe('SongsStore', () => {
  it('should update items', () => {
    const store = createTestStore();
    const song: Song = { id: '1', title: 'Test' /* ... */ };

    store.getState().setItems([song], {});

    expect(store.getState().items.size).toBe(1);
  });
});
```

3. **Use JSDOM for DOM APIs**
```typescript
// In jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // Provides window, document, localStorage
};
```

### Issue: "Store state persists between tests"

**Problem**: Test 1 modifies store, test 2 gets that modified state

**Causes**:
- Shared store instance between tests
- localStorage not cleared between tests
- No test cleanup

**Solutions**:

1. **Reset store before each test**
```typescript
beforeEach(() => {
  useSongsStore.getState().reset();
  localStorage.clear();
});
```

2. **Create fresh store per test**
```typescript
const createTestStore = () =>
  create<SongsStore>((set) => ({
    // Fresh state each time
  }));

describe('SongsStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should work', () => {
    // Use store instead of useSongsStore
  });
});
```

3. **Clear persistence**
```typescript
afterEach(() => {
  // Clear all MeatyMusic localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('meatymusic')) {
      localStorage.removeItem(key);
    }
  });
});
```

## Debugging Strategies

### 1. Redux DevTools Inspector

```typescript
// Enable in development
if (process.env.NODE_ENV === 'development') {
  // Open: Redux DevTools Chrome Extension
  // Select store from dropdown
  // View state tree, action history, time-travel debug
}
```

### 2. Console Logging

```typescript
// Log every state change
useEffect(() => {
  const unsubscribe = useSongsStore.subscribe(
    (state) => state,
    (newState) => {
      console.log('State updated:', newState);
    }
  );

  return unsubscribe;
}, []);
```

### 3. Breakpoint Debugging

```typescript
// Add breakpoints in middleware or selectors
const withDebugBreakpoints = (config: StateCreator<SongsStore>) => {
  return (set, get, api) => {
    const originalSet = set;

    const customSet: typeof set = (partial, replace) => {
      debugger; // Breakpoint here
      console.log('Setting state:', partial);
      originalSet(partial, replace);
    };

    (api as any).setState = customSet;
    return config(set, get, api);
  };
};
```

### 4. Network Request Inspection

```typescript
// Monitor API calls tied to store updates
export function useWithNetworkLogging(
  hookFn: Function
) {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      console.log('API Request:', args[0]);
      const response = await originalFetch(...args);
      console.log('API Response:', await response.clone().json());
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return hookFn();
}
```

### 5. Performance Profiling

```typescript
// Measure selector performance
import { useCallback, useRef } from 'react';

export function usePerformanceTracker(name: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  return useCallback(() => {
    renderCount.current++;
    const now = Date.now();
    const delta = now - lastRenderTime.current;

    console.log(`${name} rendered ${renderCount.current} times, ${delta}ms since last`);
    lastRenderTime.current = now;
  }, [name]);
}

// Usage
export function OptimizedComponent() {
  const trackPerf = usePerformanceTracker('OptimizedComponent');
  const songs = useSongs();

  trackPerf();

  return <div>{songs.size} songs</div>;
}
```

## Related Documentation

- [STORE-USAGE.md](./STORE-USAGE.md) - Complete API reference
- [STORE-EXAMPLES.md](./STORE-EXAMPLES.md) - Practical examples
