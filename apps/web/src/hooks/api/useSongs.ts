/**
 * Songs Query Hooks
 * React Query hooks for Song entity operations
 *
 * Architecture: Section 6.2 - React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { songsApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { Song, SongCreate, SongUpdate, UUID } from '@/types/api';
import type { SongFilters } from '@/lib/api/songs';

/**
 * Fetch paginated list of songs
 */
export function useSongs(filters?: SongFilters) {
  return useQuery({
    queryKey: queryKeys.songs.list(filters),
    queryFn: () => songsApi.list(filters),
    staleTime: getStaleTime('SONGS'),
  });
}

/**
 * Fetch a single song by ID
 */
export function useSong(id: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.songs.detail(id!),
    queryFn: () => songsApi.get(id!),
    enabled: !!id,
    staleTime: getStaleTime('SONGS'),
  });
}

/**
 * Create a new song
 */
export function useCreateSong() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (song: SongCreate) => songsApi.create(song),
    onSuccess: (data) => {
      // Invalidate song lists
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.lists() });
      addToast(`Song "${data.title}" created successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create song', 'error');
    },
  });
}

/**
 * Update an existing song
 */
export function useUpdateSong(id: UUID) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (song: SongUpdate) => songsApi.update(id, song),

    // Optimistic update
    onMutate: async (update) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.songs.detail(id) });

      // Snapshot previous value
      const previousSong = queryClient.getQueryData<Song>(queryKeys.songs.detail(id));

      // Optimistically update cache
      if (previousSong) {
        queryClient.setQueryData<Song>(queryKeys.songs.detail(id), {
          ...previousSong,
          ...update,
        });
      }

      return { previousSong };
    },

    // Rollback on error
    onError: (error: any, _variables, context) => {
      if (context?.previousSong) {
        queryClient.setQueryData(queryKeys.songs.detail(id), context.previousSong);
      }
      addToast(error?.message || 'Failed to update song', 'error');
    },

    // Refetch on success
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.songs.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.lists() });
      addToast(`Song "${data.title}" updated successfully`, 'success');
    },
  });
}

/**
 * Delete a song
 */
export function useDeleteSong() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => songsApi.delete(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.songs.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.lists() });
      addToast('Song deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete song', 'error');
    },
  });
}
