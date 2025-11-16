/**
 * React Query Integration Hooks for Songs
 *
 * Bridges React Query with Zustand Songs Store
 * - Queries sync to store automatically
 * - Mutations use optimistic updates with rollback
 * - Type-safe integration with full error handling
 */

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import { songsApi, type SongFilters } from '@/lib/api/songs';
import type { useSongsStore } from '@meatymusic/store';
import type {
  Song,
  PaginatedResponse,
  UUID,
} from '@/types/api';

// Import store dynamically to avoid type errors during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const storeModule = require('@meatymusic/store');
const songsStore: typeof useSongsStore = storeModule.useSongsStore;

// ============================================================================
// Query Keys
// ============================================================================

export const songsKeys = {
  all: ['songs'] as const,
  lists: () => [...songsKeys.all, 'list'] as const,
  list: (filters: SongFilters) => [...songsKeys.lists(), filters] as const,
  details: () => [...songsKeys.all, 'detail'] as const,
  detail: (id: UUID) => [...songsKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks with Store Sync
// ============================================================================

/**
 * Fetch songs list and sync to Zustand store
 *
 * @param filters - Song filters (search, status, pagination)
 * @returns React Query result with songs data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSongsWithStore({
 *   q: 'my song',
 *   status: ['draft'],
 *   limit: 20
 * });
 * ```
 */
export function useSongsWithStore(
  filters: SongFilters = {}
): UseQueryResult<PaginatedResponse<Song>, Error> {
  const setItems = songsStore((state) => state.setItems);
  const setLoading = songsStore((state) => state.setLoading);
  const setError = songsStore((state) => state.setError);

  const query = useQuery({
    queryKey: songsKeys.list(filters),
    queryFn: () => songsApi.list(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Sync loading state
  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  // Sync data to store on success
  useEffect(() => {
    if (query.data) {
      const paginationUpdate = {
        total: query.data.page_info.total_count ?? 0,
        hasMore: query.data.page_info.has_next_page,
      };
      setItems(query.data.items, paginationUpdate);
      setError(null);
    }
  }, [query.data, setItems, setError]);

  // Sync error state
  useEffect(() => {
    if (query.error) {
      setError(query.error);
    }
  }, [query.error, setError]);

  return query;
}

/**
 * Fetch single song by ID and sync to store
 *
 * @param id - Song UUID
 * @returns React Query result with song data
 *
 * @example
 * ```tsx
 * const { data: song, isLoading } = useSongWithStore(songId);
 * ```
 */
export function useSongWithStore(
  id: UUID
): UseQueryResult<Song, Error> {
  const setItems = songsStore((state) => state.setItems);

  const query = useQuery({
    queryKey: songsKeys.detail(id),
    queryFn: () => songsApi.get(id),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Sync individual song to store
  useEffect(() => {
    if (query.data) {
      setItems([query.data], {});
    }
  }, [query.data, setItems]);

  return query;
}

// ============================================================================
// Mutation Hooks with Optimistic Updates
// ============================================================================

/**
 * Create song mutation with optimistic update
 *
 * @returns Mutation result with optimistic create
 *
 * @example
 * ```tsx
 * const createSong = useCreateSongMutation();
 *
 * await createSong.mutateAsync({
 *   title: 'My New Song',
 *   global_seed: 12345,
 *   // ... other fields
 * });
 * ```
 */
export function useCreateSongMutation(): UseMutationResult<
  Song,
  Error,
  Parameters<typeof songsApi.create>[0]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sds) => songsApi.create(sds),

    onMutate: async (sds) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: songsKeys.lists() });

      // Create optimistic song
      const optimisticId = `temp-${Date.now()}`;
      const optimisticSong: Song = {
        id: optimisticId,
        tenant_id: 'temp',
        owner_id: 'temp',
        title: sds.title,
        global_seed: sds.global_seed,
        style_id: sds.style_id,
        persona_id: sds.persona_id,
        blueprint_id: sds.blueprint_id,
        status: sds.status,
        sds_version: sds.sds_version,
        feature_flags: sds.feature_flags,
        render_config: sds.render_config,
        extra_metadata: sds.extra_metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to store optimistically
      songsStore.getState().addOptimisticSong(optimisticSong);

      return { optimisticId };
    },

    onSuccess: (response, _, context) => {
      // Commit optimistic update and add real song
      if (context?.optimisticId) {
        songsStore.getState().commitOptimistic(context.optimisticId);
      }

      // Add the real song to the store
      songsStore.getState().addOptimisticSong(response);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: songsKeys.lists() });
    },

    onError: (_, __, context) => {
      // Rollback optimistic update
      if (context?.optimisticId) {
        songsStore.getState().rollbackOptimistic(context.optimisticId);
      }
    },
  });
}

/**
 * Update song mutation with optimistic update
 *
 * @returns Mutation result with optimistic update
 *
 * @example
 * ```tsx
 * const updateSong = useUpdateSongMutation();
 *
 * await updateSong.mutateAsync({
 *   id: songId,
 *   updates: { title: 'Updated Title' }
 * });
 * ```
 */
export function useUpdateSongMutation(): UseMutationResult<
  Song,
  Error,
  { id: UUID; updates: Parameters<typeof songsApi.update>[1] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => songsApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: songsKeys.detail(id) });

      // Apply optimistic update to store
      songsStore.getState().updateOptimisticSong(id, updates);

      return { id };
    },

    onSuccess: (response, { id }) => {
      // Commit the optimistic update
      songsStore.getState().commitOptimistic(id);

      // Update store with real response
      songsStore.getState().addOptimisticSong(response);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: songsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: songsKeys.lists() });
    },

    onError: (_, { id }) => {
      // Rollback optimistic update
      songsStore.getState().rollbackOptimistic(id);
    },
  });
}

/**
 * Delete song mutation with optimistic removal
 *
 * @returns Mutation result with optimistic delete
 *
 * @example
 * ```tsx
 * const deleteSong = useDeleteSongMutation();
 *
 * await deleteSong.mutateAsync(songId);
 * ```
 */
export function useDeleteSongMutation(): UseMutationResult<
  void,
  Error,
  UUID
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => songsApi.delete(id),

    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: songsKeys.detail(id) });

      // Optimistically remove from store
      songsStore.getState().removeOptimisticSong(id);

      return { id };
    },

    onSuccess: (_, id) => {
      // Commit the removal
      songsStore.getState().commitOptimistic(id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: songsKeys.lists() });
      queryClient.removeQueries({ queryKey: songsKeys.detail(id) });
    },

    onError: (_, id) => {
      // Rollback optimistic removal
      songsStore.getState().rollbackOptimistic(id);
    },
  });
}

// ============================================================================
// Prefetch Utilities
// ============================================================================

/**
 * Prefetch songs list for faster navigation
 *
 * @example
 * ```tsx
 * const prefetchSongs = usePrefetchSongs();
 *
 * // On hover or route change
 * prefetchSongs({ status: ['draft'] });
 * ```
 */
export function usePrefetchSongs() {
  const queryClient = useQueryClient();

  return (filters: SongFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: songsKeys.list(filters),
      queryFn: () => songsApi.list(filters),
      staleTime: 30000,
    });
  };
}

/**
 * Prefetch single song for faster detail view
 *
 * @example
 * ```tsx
 * const prefetchSong = usePrefetchSong();
 *
 * // On row hover
 * prefetchSong(songId);
 * ```
 */
export function usePrefetchSong() {
  const queryClient = useQueryClient();

  return (id: UUID) => {
    queryClient.prefetchQuery({
      queryKey: songsKeys.detail(id),
      queryFn: () => songsApi.get(id),
      staleTime: 60000,
    });
  };
}
