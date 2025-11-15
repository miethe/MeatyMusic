import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createLocalStorageMiddleware } from '../middleware/localStorageMiddleware';
import { createMultiTabMiddleware } from '../middleware/multiTabMiddleware';
import type {
  SongsStore,
  SongsPagination,
  SongsFilters,
  SongsSorting,
} from '../types';

// ============================================================================
// Initial State Values
// ============================================================================

const initialFilters: SongsFilters = {
  search: '',
  createdAfter: undefined,
  status: undefined,
  isApplied: false,
  isDirty: false,
};

const initialSorting: SongsSorting = {
  field: 'updatedAt',
  direction: 'desc',
};

const initialPagination: SongsPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

// ============================================================================
// Store Creator
// ============================================================================

const creator: StateCreator<SongsStore> = (set, get) => ({
  // List state
  items: new Map(),
  allIds: [],
  pagination: initialPagination,
  filters: initialFilters,
  sorting: initialSorting,
  loading: false,
  error: null,
  lastUpdated: null,

  // Selection state
  selectedId: null,
  selectedIds: [],
  isComparing: false,

  // Optimistic state
  stagedItems: new Map(),
  stagedRemovals: [],
  stagedUpdates: new Map(),

  // ========================================================================
  // Query Sync Actions
  // ========================================================================

  setItems: (items, paginationUpdate) => {
    const itemsMap = new Map(items.map((item) => [item.id, item]));
    const allIds = items.map((item) => item.id);

    set({
      items: itemsMap,
      allIds,
      pagination: { ...get().pagination, ...paginationUpdate },
      lastUpdated: Date.now(),
      loading: false,
      error: null,
    });
  },

  setError: (error) => set({ error, loading: false }),

  setLoading: (loading) => set({ loading }),

  // ========================================================================
  // Filter Management
  // ========================================================================

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, search: query, isDirty: true },
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters, isDirty: true },
    })),

  clearFilters: () =>
    set({
      filters: { ...initialFilters, isApplied: false, isDirty: false },
    }),

  applyFilters: () =>
    set((state) => ({
      filters: { ...state.filters, isApplied: true, isDirty: false },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    })),

  revertFilters: () =>
    set((state) => ({
      filters: { ...state.filters, isDirty: false },
    })),

  // ========================================================================
  // Sorting
  // ========================================================================

  setSorting: (field, direction) =>
    set((state) => {
      const newDirection =
        direction ??
        (state.sorting.field === field && state.sorting.direction === 'asc'
          ? 'desc'
          : 'asc');
      return {
        sorting: { field, direction: newDirection },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page
      };
    }),

  // ========================================================================
  // Pagination
  // ========================================================================

  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, page },
    })),

  nextPage: () =>
    set((state) => {
      if (state.pagination.hasMore) {
        return {
          pagination: { ...state.pagination, page: state.pagination.page + 1 },
        };
      }
      return state;
    }),

  previousPage: () =>
    set((state) => {
      if (state.pagination.page > 1) {
        return {
          pagination: { ...state.pagination, page: state.pagination.page - 1 },
        };
      }
      return state;
    }),

  // ========================================================================
  // Selection
  // ========================================================================

  selectSong: (id) => set({ selectedId: id }),

  toggleMultiSelect: (id) =>
    set((state) => {
      const selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id];
      return { selectedIds };
    }),

  clearSelection: () =>
    set({ selectedId: null, selectedIds: [], isComparing: false }),

  setComparisonMode: (enabled) => set({ isComparing: enabled }),

  // ========================================================================
  // Optimistic Operations
  // ========================================================================

  addOptimisticSong: (song) =>
    set((state) => {
      const stagedItems = new Map(state.stagedItems);
      stagedItems.set(song.id, song);
      return { stagedItems };
    }),

  updateOptimisticSong: (id, updates) =>
    set((state) => {
      const stagedUpdates = new Map(state.stagedUpdates);
      stagedUpdates.set(id, updates);
      return { stagedUpdates };
    }),

  removeOptimisticSong: (id) =>
    set((state) => ({
      stagedRemovals: [...state.stagedRemovals, id],
    })),

  commitOptimistic: (id) =>
    set((state) => {
      const newState: Partial<SongsStore> = {};

      // Commit staged item
      if (state.stagedItems.has(id)) {
        const items = new Map(state.items);
        const stagedItem = state.stagedItems.get(id)!;
        items.set(id, stagedItem);

        const stagedItems = new Map(state.stagedItems);
        stagedItems.delete(id);

        newState.items = items;
        newState.allIds = Array.from(items.keys());
        newState.stagedItems = stagedItems;
      }

      // Commit staged update
      if (state.stagedUpdates.has(id)) {
        const items = new Map(state.items);
        const existing = items.get(id);
        if (existing) {
          const updates = state.stagedUpdates.get(id)!;
          items.set(id, { ...existing, ...updates });
        }

        const stagedUpdates = new Map(state.stagedUpdates);
        stagedUpdates.delete(id);

        newState.items = items;
        newState.stagedUpdates = stagedUpdates;
      }

      // Commit staged removal
      if (state.stagedRemovals.includes(id)) {
        const items = new Map(state.items);
        items.delete(id);

        newState.items = items;
        newState.allIds = Array.from(items.keys());
        newState.stagedRemovals = state.stagedRemovals.filter(
          (removedId) => removedId !== id
        );
      }

      return newState;
    }),

  rollbackOptimistic: (id) =>
    set((state) => {
      const newState: Partial<SongsStore> = {};

      if (state.stagedItems.has(id)) {
        const stagedItems = new Map(state.stagedItems);
        stagedItems.delete(id);
        newState.stagedItems = stagedItems;
      }

      if (state.stagedUpdates.has(id)) {
        const stagedUpdates = new Map(state.stagedUpdates);
        stagedUpdates.delete(id);
        newState.stagedUpdates = stagedUpdates;
      }

      if (state.stagedRemovals.includes(id)) {
        newState.stagedRemovals = state.stagedRemovals.filter(
          (removedId) => removedId !== id
        );
      }

      return newState;
    }),

  // ========================================================================
  // Cache Control
  // ========================================================================

  invalidate: () => set({ lastUpdated: null }),

  clear: () =>
    set({
      items: new Map(),
      allIds: [],
      loading: false,
      error: null,
      lastUpdated: null,
    }),

  reset: () =>
    set({
      items: new Map(),
      allIds: [],
      pagination: initialPagination,
      filters: initialFilters,
      sorting: initialSorting,
      loading: false,
      error: null,
      lastUpdated: null,
      selectedId: null,
      selectedIds: [],
      isComparing: false,
      stagedItems: new Map(),
      stagedRemovals: [],
      stagedUpdates: new Map(),
    }),
});

// ============================================================================
// Middleware Composition with Map Serialization Support
// ============================================================================

/**
 * Custom wrapper to handle Map serialization for localStorage
 *
 * Note: Standard JSON.stringify doesn't serialize Maps properly.
 * This wrapper converts Maps to arrays before persistence and back on hydration.
 */
const withMapSerialization = (config: StateCreator<SongsStore>): StateCreator<SongsStore> => {
  return (set, get, api) => {
    // Initialize the store
    const store = config(set, get, api);

    // Wrap the set function to handle Map serialization
    const originalSet = set;
    const customSet: typeof set = (partial, replace) => {
      if (typeof partial === 'function') {
        originalSet(partial, replace);
      } else {
        // Convert Maps to arrays for serialization
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serializable: any = { ...partial };

        if (partial.items && partial.items instanceof Map) {
          serializable._itemsArray = Array.from(partial.items.entries());
          // Keep the Map for runtime
          serializable.items = partial.items;
        }

        if (partial.stagedItems && partial.stagedItems instanceof Map) {
          serializable._stagedItemsArray = Array.from(partial.stagedItems.entries());
          serializable.stagedItems = partial.stagedItems;
        }

        if (partial.stagedUpdates && partial.stagedUpdates instanceof Map) {
          serializable._stagedUpdatesArray = Array.from(partial.stagedUpdates.entries());
          serializable.stagedUpdates = partial.stagedUpdates;
        }

        originalSet(serializable, replace);
      }
    };

    // Replace set in the API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any).setState = customSet;

    return store;
  };
};

/**
 * Hydration handler to convert serialized arrays back to Maps
 */
const withMapHydration = (config: StateCreator<SongsStore>): StateCreator<SongsStore> => {
  return (set, get, api) => {
    // Check if we need to hydrate Maps from arrays
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('meatymusic-songs-list');
        if (stored) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed: any = JSON.parse(stored);

          // Convert arrays back to Maps
          if (parsed._itemsArray && Array.isArray(parsed._itemsArray)) {
            parsed.items = new Map(parsed._itemsArray);
            delete parsed._itemsArray;
          } else if (!parsed.items || typeof parsed.items !== 'object') {
            parsed.items = new Map();
          }

          if (parsed._stagedItemsArray && Array.isArray(parsed._stagedItemsArray)) {
            parsed.stagedItems = new Map(parsed._stagedItemsArray);
            delete parsed._stagedItemsArray;
          } else if (!parsed.stagedItems) {
            parsed.stagedItems = new Map();
          }

          if (parsed._stagedUpdatesArray && Array.isArray(parsed._stagedUpdatesArray)) {
            parsed.stagedUpdates = new Map(parsed._stagedUpdatesArray);
            delete parsed._stagedUpdatesArray;
          } else if (!parsed.stagedUpdates) {
            parsed.stagedUpdates = new Map();
          }

          // Don't persist these fields, reset to defaults
          parsed.loading = false;
          parsed.error = null;
          parsed.lastUpdated = null;

          // Manually merge into initial state
          set(parsed, true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('songsStore.hydration.error', error);
      }
    }

    return config(set, get, api);
  };
};

const withMiddleware = (config: StateCreator<SongsStore>) =>
  withMapHydration(
    createLocalStorageMiddleware<SongsStore>('meatymusic-songs-list', 300)(
      createMultiTabMiddleware<SongsStore>('meatymusic-songs-list', {
        mergeStrategy: 'merge',
      })(withMapSerialization(config))
    )
  );

export const useSongsStore = create<SongsStore>()(
  devtools(withMiddleware(creator), {
    enabled: process.env.NODE_ENV === 'development',
    name: 'songsStore',
  })
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get all songs as a Map
 */
export const useSongs = () => useSongsStore((state) => state.items);

/**
 * Get all song IDs in current order
 */
export const useSongsIds = () => useSongsStore((state) => state.allIds);

/**
 * Get a single song by ID
 * @param id - Song ID to retrieve
 * @returns Song or null if not found
 */
export const useSongById = (id: string) =>
  useSongsStore((state) => state.items.get(id) ?? null);

/**
 * Get current filter state
 */
export const useSongsFilters = () => useSongsStore((state) => state.filters);

/**
 * Get loading state
 */
export const useSongsLoading = () => useSongsStore((state) => state.loading);

/**
 * Get error state
 */
export const useSongsError = () => useSongsStore((state) => state.error);

/**
 * Get currently selected song ID
 */
export const useSongsSelectedId = () => useSongsStore((state) => state.selectedId);

/**
 * Get pagination state
 */
export const useSongsPagination = () => useSongsStore((state) => state.pagination);
