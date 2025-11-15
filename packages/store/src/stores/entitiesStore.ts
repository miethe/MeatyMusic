import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createLocalStorageMiddleware } from '../middleware/localStorageMiddleware';
import { createMultiTabMiddleware } from '../middleware/multiTabMiddleware';
import type {
  EntitiesStore,
  EntityCache,
  EntityType,
  EntityTypeMap,
  Style,
  Lyrics,
  Persona,
  ProducerNotes,
  Source,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default limit for recent entity tracking
 */
const DEFAULT_RECENT_LIMIT = 10;

/**
 * Maximum number of recent entities to track per type
 */
const MAX_RECENT_ENTITIES = 20;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an empty entity cache
 */
function createEmptyCache<T>(): EntityCache<T> {
  return {
    items: new Map(),
    allIds: [],
    metadata: {
      lastUpdated: Date.now(),
      version: '1.0.0',
    },
    loading: false,
    error: null,
  };
}

/**
 * Update entity cache with new items
 */
function updateCache<T extends { id: string }>(
  cache: EntityCache<T>,
  items: T[]
): EntityCache<T> {
  const itemsMap = new Map(items.map((item) => [item.id, item]));
  const allIds = items.map((item) => item.id);

  return {
    ...cache,
    items: itemsMap,
    allIds,
    metadata: {
      ...cache.metadata,
      lastUpdated: Date.now(),
    },
    loading: false,
    error: null,
  };
}

/**
 * Add an item to entity cache
 */
function addItemToCache<T extends { id: string }>(
  cache: EntityCache<T>,
  item: T
): EntityCache<T> {
  const items = new Map(cache.items);
  items.set(item.id, item);

  const allIds = cache.allIds.includes(item.id)
    ? cache.allIds
    : [...cache.allIds, item.id];

  return {
    ...cache,
    items,
    allIds,
    metadata: {
      ...cache.metadata,
      lastUpdated: Date.now(),
    },
  };
}

/**
 * Update an item in entity cache
 */
function updateItemInCache<T extends { id: string }>(
  cache: EntityCache<T>,
  id: string,
  updates: Partial<T>
): EntityCache<T> {
  const items = new Map(cache.items);
  const existing = items.get(id);

  if (!existing) {
    return cache;
  }

  items.set(id, { ...existing, ...updates });

  return {
    ...cache,
    items,
    metadata: {
      ...cache.metadata,
      lastUpdated: Date.now(),
    },
  };
}

/**
 * Remove an item from entity cache
 */
function removeItemFromCache<T>(
  cache: EntityCache<T>,
  id: string
): EntityCache<T> {
  const items = new Map(cache.items);
  items.delete(id);

  const allIds = cache.allIds.filter((itemId) => itemId !== id);

  return {
    ...cache,
    items,
    allIds,
    metadata: {
      ...cache.metadata,
      lastUpdated: Date.now(),
    },
  };
}

/**
 * Add ID to recent access list
 */
function addToRecent(recentIds: string[], id: string, maxLimit: number): string[] {
  // Remove if already exists
  const filtered = recentIds.filter((recentId) => recentId !== id);

  // Add to front
  const updated = [id, ...filtered];

  // Limit size
  return updated.slice(0, maxLimit);
}

// ============================================================================
// Store Creator
// ============================================================================

const creator: StateCreator<EntitiesStore> = (set, get) => ({
  // ========================================================================
  // Entity Caches
  // ========================================================================
  styles: createEmptyCache<Style>(),
  lyrics: createEmptyCache<Lyrics>(),
  personas: createEmptyCache<Persona>(),
  producerNotes: createEmptyCache<ProducerNotes>(),
  sources: createEmptyCache<Source>(),

  // ========================================================================
  // Selection State
  // ========================================================================
  selectedStyleId: null,
  selectedLyricsId: null,
  selectedPersonaId: null,

  // ========================================================================
  // Recent Access Tracking
  // ========================================================================
  recentEntities: {
    styleIds: [],
    lyricsIds: [],
    personaIds: [],
  },

  // ========================================================================
  // Style Operations
  // ========================================================================

  setStyles: (styles) => {
    set((state) => ({
      styles: updateCache(state.styles, styles),
    }));
  },

  addStyle: (style) => {
    set((state) => ({
      styles: addItemToCache(state.styles, style),
    }));
  },

  updateStyle: (id, updates) => {
    set((state) => ({
      styles: updateItemInCache(state.styles, id, updates),
    }));
  },

  removeStyle: (id) => {
    set((state) => ({
      styles: removeItemFromCache(state.styles, id),
      selectedStyleId: state.selectedStyleId === id ? null : state.selectedStyleId,
      recentEntities: {
        ...state.recentEntities,
        styleIds: state.recentEntities.styleIds.filter((styleId) => styleId !== id),
      },
    }));
  },

  selectStyle: (id) => {
    set({ selectedStyleId: id });

    // Record access if selecting (not deselecting)
    if (id !== null) {
      get().recordEntityAccess('style', id);
    }
  },

  // ========================================================================
  // Lyrics Operations
  // ========================================================================

  setLyrics: (items) => {
    set((state) => ({
      lyrics: updateCache(state.lyrics, items),
    }));
  },

  addLyrics: (lyrics) => {
    set((state) => ({
      lyrics: addItemToCache(state.lyrics, lyrics),
    }));
  },

  updateLyrics: (id, updates) => {
    set((state) => ({
      lyrics: updateItemInCache(state.lyrics, id, updates),
    }));
  },

  removeLyrics: (id) => {
    set((state) => ({
      lyrics: removeItemFromCache(state.lyrics, id),
      selectedLyricsId: state.selectedLyricsId === id ? null : state.selectedLyricsId,
      recentEntities: {
        ...state.recentEntities,
        lyricsIds: state.recentEntities.lyricsIds.filter((lyricsId) => lyricsId !== id),
      },
    }));
  },

  selectLyrics: (id) => {
    set({ selectedLyricsId: id });

    // Record access if selecting (not deselecting)
    if (id !== null) {
      get().recordEntityAccess('lyrics', id);
    }
  },

  // ========================================================================
  // Persona Operations
  // ========================================================================

  setPersonas: (personas) => {
    set((state) => ({
      personas: updateCache(state.personas, personas),
    }));
  },

  addPersona: (persona) => {
    set((state) => ({
      personas: addItemToCache(state.personas, persona),
    }));
  },

  updatePersona: (id, updates) => {
    set((state) => ({
      personas: updateItemInCache(state.personas, id, updates),
    }));
  },

  removePersona: (id) => {
    set((state) => ({
      personas: removeItemFromCache(state.personas, id),
      selectedPersonaId: state.selectedPersonaId === id ? null : state.selectedPersonaId,
      recentEntities: {
        ...state.recentEntities,
        personaIds: state.recentEntities.personaIds.filter((personaId) => personaId !== id),
      },
    }));
  },

  selectPersona: (id) => {
    set({ selectedPersonaId: id });

    // Record access if selecting (not deselecting)
    if (id !== null) {
      get().recordEntityAccess('persona', id);
    }
  },

  // ========================================================================
  // Producer Notes Operations
  // ========================================================================

  setProducerNotes: (notes) => {
    set((state) => ({
      producerNotes: updateCache(state.producerNotes, notes),
    }));
  },

  addProducerNotes: (notes) => {
    set((state) => ({
      producerNotes: addItemToCache(state.producerNotes, notes),
    }));
  },

  updateProducerNotes: (id, updates) => {
    set((state) => ({
      producerNotes: updateItemInCache(state.producerNotes, id, updates),
    }));
  },

  removeProducerNotes: (id) => {
    set((state) => ({
      producerNotes: removeItemFromCache(state.producerNotes, id),
    }));
  },

  // ========================================================================
  // Source Operations
  // ========================================================================

  setSources: (sources) => {
    set((state) => ({
      sources: updateCache(state.sources, sources),
    }));
  },

  addSource: (source) => {
    set((state) => ({
      sources: addItemToCache(state.sources, source),
    }));
  },

  updateSource: (id, updates) => {
    set((state) => ({
      sources: updateItemInCache(state.sources, id, updates),
    }));
  },

  removeSource: (id) => {
    set((state) => ({
      sources: removeItemFromCache(state.sources, id),
    }));
  },

  // ========================================================================
  // Generic Operations
  // ========================================================================

  setEntityCache: <K extends EntityType>(type: K, items: EntityTypeMap[K][]) => {
    const state = get();

    switch (type) {
      case 'style':
        state.setStyles(items as Style[]);
        break;
      case 'lyrics':
        state.setLyrics(items as Lyrics[]);
        break;
      case 'persona':
        state.setPersonas(items as Persona[]);
        break;
      case 'producerNotes':
        state.setProducerNotes(items as ProducerNotes[]);
        break;
      case 'source':
        state.setSources(items as Source[]);
        break;
    }
  },

  invalidateEntityType: (type) => {
    set((state) => {
      const updates: Partial<EntitiesStore> = {};

      switch (type) {
        case 'style':
          updates.styles = {
            ...state.styles,
            metadata: {
              ...state.styles.metadata,
              lastUpdated: 0, // Force refetch
            },
          };
          break;
        case 'lyrics':
          updates.lyrics = {
            ...state.lyrics,
            metadata: {
              ...state.lyrics.metadata,
              lastUpdated: 0,
            },
          };
          break;
        case 'persona':
          updates.personas = {
            ...state.personas,
            metadata: {
              ...state.personas.metadata,
              lastUpdated: 0,
            },
          };
          break;
        case 'producerNotes':
          updates.producerNotes = {
            ...state.producerNotes,
            metadata: {
              ...state.producerNotes.metadata,
              lastUpdated: 0,
            },
          };
          break;
        case 'source':
          updates.sources = {
            ...state.sources,
            metadata: {
              ...state.sources.metadata,
              lastUpdated: 0,
            },
          };
          break;
      }

      return updates;
    });
  },

  invalidateAll: () => {
    set((state) => ({
      styles: {
        ...state.styles,
        metadata: { ...state.styles.metadata, lastUpdated: 0 },
      },
      lyrics: {
        ...state.lyrics,
        metadata: { ...state.lyrics.metadata, lastUpdated: 0 },
      },
      personas: {
        ...state.personas,
        metadata: { ...state.personas.metadata, lastUpdated: 0 },
      },
      producerNotes: {
        ...state.producerNotes,
        metadata: { ...state.producerNotes.metadata, lastUpdated: 0 },
      },
      sources: {
        ...state.sources,
        metadata: { ...state.sources.metadata, lastUpdated: 0 },
      },
    }));
  },

  clearCache: () => {
    set({
      styles: createEmptyCache<Style>(),
      lyrics: createEmptyCache<Lyrics>(),
      personas: createEmptyCache<Persona>(),
      producerNotes: createEmptyCache<ProducerNotes>(),
      sources: createEmptyCache<Source>(),
      selectedStyleId: null,
      selectedLyricsId: null,
      selectedPersonaId: null,
      recentEntities: {
        styleIds: [],
        lyricsIds: [],
        personaIds: [],
      },
    });
  },

  // ========================================================================
  // Recent Access Tracking
  // ========================================================================

  recordEntityAccess: (type, id) => {
    set((state) => {
      const recentEntities = { ...state.recentEntities };

      switch (type) {
        case 'style':
          recentEntities.styleIds = addToRecent(
            recentEntities.styleIds,
            id,
            MAX_RECENT_ENTITIES
          );
          break;
        case 'lyrics':
          recentEntities.lyricsIds = addToRecent(
            recentEntities.lyricsIds,
            id,
            MAX_RECENT_ENTITIES
          );
          break;
        case 'persona':
          recentEntities.personaIds = addToRecent(
            recentEntities.personaIds,
            id,
            MAX_RECENT_ENTITIES
          );
          break;
        // producerNotes and sources don't have selection, so no recent tracking
      }

      return { recentEntities };
    });
  },

  getRecentEntities: <K extends EntityType>(type: K, limit = DEFAULT_RECENT_LIMIT) => {
    const state = get();
    let recentIds: string[] = [];
    let cache: EntityCache<EntityTypeMap[K]>;

    switch (type) {
      case 'style':
        recentIds = state.recentEntities.styleIds;
        cache = state.styles as EntityCache<EntityTypeMap[K]>;
        break;
      case 'lyrics':
        recentIds = state.recentEntities.lyricsIds;
        cache = state.lyrics as EntityCache<EntityTypeMap[K]>;
        break;
      case 'persona':
        recentIds = state.recentEntities.personaIds;
        cache = state.personas as EntityCache<EntityTypeMap[K]>;
        break;
      default:
        return [];
    }

    // Get the most recent items up to the limit
    const limitedIds = recentIds.slice(0, limit);

    // Map IDs to actual entities
    return limitedIds
      .map((id) => cache.items.get(id))
      .filter((item): item is EntityTypeMap[K] => item !== undefined);
  },
});

// ============================================================================
// Middleware Composition with Map Serialization Support
// ============================================================================

/**
 * Custom wrapper to handle Map serialization for localStorage
 *
 * Converts EntityCache Maps to arrays before persistence and back on hydration.
 */
const withMapSerialization = (
  config: StateCreator<EntitiesStore>
): StateCreator<EntitiesStore> => {
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

        // Serialize each entity cache's Map
        const cacheTypes = ['styles', 'lyrics', 'personas', 'producerNotes', 'sources'] as const;

        for (const cacheType of cacheTypes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cache = (partial as any)[cacheType];

          if (cache && cache.items instanceof Map) {
            serializable[cacheType] = {
              ...cache,
              _itemsArray: Array.from(cache.items.entries()),
              items: cache.items, // Keep Map for runtime
            };
          }
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
const withMapHydration = (
  config: StateCreator<EntitiesStore>
): StateCreator<EntitiesStore> => {
  return (set, get, api) => {
    // Check if we need to hydrate Maps from arrays
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('meatymusic-entities-cache');
        if (stored) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed: any = JSON.parse(stored);

          // Convert arrays back to Maps for each cache
          const cacheTypes = ['styles', 'lyrics', 'personas', 'producerNotes', 'sources'] as const;

          for (const cacheType of cacheTypes) {
            const cache = parsed[cacheType];

            if (cache) {
              // Restore Map from array
              if (cache._itemsArray && Array.isArray(cache._itemsArray)) {
                cache.items = new Map(cache._itemsArray);
                delete cache._itemsArray;
              } else if (!cache.items || typeof cache.items !== 'object') {
                cache.items = new Map();
              }

              // Reset loading and error states (don't persist)
              cache.loading = false;
              cache.error = null;
            } else {
              // Initialize empty cache if missing
              parsed[cacheType] = createEmptyCache();
            }
          }

          // Ensure recentEntities exists
          if (!parsed.recentEntities) {
            parsed.recentEntities = {
              styleIds: [],
              lyricsIds: [],
              personaIds: [],
            };
          }

          // Manually merge into initial state
          set(parsed, true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('entitiesStore.hydration.error', error);
      }
    }

    return config(set, get, api);
  };
};

const withMiddleware = (config: StateCreator<EntitiesStore>) =>
  withMapHydration(
    createLocalStorageMiddleware<EntitiesStore>('meatymusic-entities-cache', 600)(
      createMultiTabMiddleware<EntitiesStore>('meatymusic-entities-cache', {
        mergeStrategy: 'merge',
      })(withMapSerialization(config))
    )
  );

export const useEntitiesStore = create<EntitiesStore>()(
  devtools(withMiddleware(creator), {
    enabled: process.env.NODE_ENV === 'development',
    name: 'entitiesStore',
  })
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get all styles as a Map
 */
export const useStyles = () => useEntitiesStore((state) => state.styles.items);

/**
 * Get all style IDs
 */
export const useStyleIds = () => useEntitiesStore((state) => state.styles.allIds);

/**
 * Get a single style by ID
 * @param id - Style ID to retrieve
 * @returns Style or null if not found
 */
export const useStyleById = (id: string) =>
  useEntitiesStore((state) => state.styles.items.get(id) ?? null);

/**
 * Get currently selected style ID
 */
export const useSelectedStyleId = () =>
  useEntitiesStore((state) => state.selectedStyleId);

/**
 * Get recently accessed styles
 * @param limit - Maximum number of recent styles to return
 * @returns Array of recent Style entities
 */
export const useRecentStyles = (limit?: number) =>
  useEntitiesStore((state) => state.getRecentEntities('style', limit));

/**
 * Get all lyrics as a Map
 */
export const useLyrics = () => useEntitiesStore((state) => state.lyrics.items);

/**
 * Get all lyrics IDs
 */
export const useLyricsIds = () => useEntitiesStore((state) => state.lyrics.allIds);

/**
 * Get a single lyrics by ID
 * @param id - Lyrics ID to retrieve
 * @returns Lyrics or null if not found
 */
export const useLyricsById = (id: string) =>
  useEntitiesStore((state) => state.lyrics.items.get(id) ?? null);

/**
 * Get currently selected lyrics ID
 */
export const useSelectedLyricsId = () =>
  useEntitiesStore((state) => state.selectedLyricsId);

/**
 * Get recently accessed lyrics
 * @param limit - Maximum number of recent lyrics to return
 * @returns Array of recent Lyrics entities
 */
export const useRecentLyrics = (limit?: number) =>
  useEntitiesStore((state) => state.getRecentEntities('lyrics', limit));

/**
 * Get all personas as a Map
 */
export const usePersonas = () =>
  useEntitiesStore((state) => state.personas.items);

/**
 * Get all persona IDs
 */
export const usePersonaIds = () =>
  useEntitiesStore((state) => state.personas.allIds);

/**
 * Get a single persona by ID
 * @param id - Persona ID to retrieve
 * @returns Persona or null if not found
 */
export const usePersonaById = (id: string) =>
  useEntitiesStore((state) => state.personas.items.get(id) ?? null);

/**
 * Get currently selected persona ID
 */
export const useSelectedPersonaId = () =>
  useEntitiesStore((state) => state.selectedPersonaId);

/**
 * Get recently accessed personas
 * @param limit - Maximum number of recent personas to return
 * @returns Array of recent Persona entities
 */
export const useRecentPersonas = (limit?: number) =>
  useEntitiesStore((state) => state.getRecentEntities('persona', limit));

/**
 * Get all producer notes as a Map
 */
export const useProducerNotes = () =>
  useEntitiesStore((state) => state.producerNotes.items);

/**
 * Get all producer notes IDs
 */
export const useProducerNotesIds = () =>
  useEntitiesStore((state) => state.producerNotes.allIds);

/**
 * Get a single producer notes by ID
 * @param id - ProducerNotes ID to retrieve
 * @returns ProducerNotes or null if not found
 */
export const useProducerNotesById = (id: string) =>
  useEntitiesStore((state) => state.producerNotes.items.get(id) ?? null);

/**
 * Get all sources as a Map
 */
export const useSources = () => useEntitiesStore((state) => state.sources.items);

/**
 * Get all source IDs
 */
export const useSourceIds = () => useEntitiesStore((state) => state.sources.allIds);

/**
 * Get a single source by ID
 * @param id - Source ID to retrieve
 * @returns Source or null if not found
 */
export const useSourceById = (id: string) =>
  useEntitiesStore((state) => state.sources.items.get(id) ?? null);

/**
 * Get loading state for a specific entity type
 * @param type - Entity type
 * @returns boolean indicating if the cache is loading
 */
export const useEntityLoading = (type: EntityType) =>
  useEntitiesStore((state) => {
    switch (type) {
      case 'style':
        return state.styles.loading;
      case 'lyrics':
        return state.lyrics.loading;
      case 'persona':
        return state.personas.loading;
      case 'producerNotes':
        return state.producerNotes.loading;
      case 'source':
        return state.sources.loading;
    }
  });

/**
 * Get error state for a specific entity type
 * @param type - Entity type
 * @returns Error or null
 */
export const useEntityError = (type: EntityType) =>
  useEntitiesStore((state) => {
    switch (type) {
      case 'style':
        return state.styles.error;
      case 'lyrics':
        return state.lyrics.error;
      case 'persona':
        return state.personas.error;
      case 'producerNotes':
        return state.producerNotes.error;
      case 'source':
        return state.sources.error;
    }
  });

/**
 * Get cache metadata for a specific entity type
 * @param type - Entity type
 * @returns Cache metadata
 */
export const useEntityMetadata = (type: EntityType) =>
  useEntitiesStore((state) => {
    switch (type) {
      case 'style':
        return state.styles.metadata;
      case 'lyrics':
        return state.lyrics.metadata;
      case 'persona':
        return state.personas.metadata;
      case 'producerNotes':
        return state.producerNotes.metadata;
      case 'source':
        return state.sources.metadata;
    }
  });
