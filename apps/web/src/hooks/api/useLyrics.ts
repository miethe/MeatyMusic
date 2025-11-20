/**
 * Lyrics Query Hooks
 * React Query hooks for Lyrics entity operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lyricsApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { Lyrics, LyricsCreate, LyricsUpdate, UUID, ProfanityCheckResult } from '@/types/api';
import type { LyricsFilters } from '@/lib/api/lyrics';

export function useLyricsList(filters?: LyricsFilters) {
  return useQuery({
    queryKey: queryKeys.lyrics.list(filters as Record<string, unknown> | undefined),
    queryFn: () => lyricsApi.list(filters),
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useLyrics(id: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.lyrics.detail(id!),
    queryFn: () => lyricsApi.get(id!),
    enabled: !!id,
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useCreateLyrics() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (lyrics: LyricsCreate) => lyricsApi.create(lyrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.lists() });
      addToast('Lyrics created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create lyrics', 'error');
    },
  });
}

export function useUpdateLyrics(id: UUID) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (lyrics: LyricsUpdate) => lyricsApi.update(id, lyrics),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lyrics.detail(id) });
      const previousLyrics = queryClient.getQueryData<Lyrics>(queryKeys.lyrics.detail(id));
      if (previousLyrics) {
        queryClient.setQueryData<Lyrics>(queryKeys.lyrics.detail(id), { ...previousLyrics, ...update });
      }
      return { previousLyrics };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousLyrics) {
        queryClient.setQueryData(queryKeys.lyrics.detail(id), context.previousLyrics);
      }
      addToast(error?.message || 'Failed to update lyrics', 'error');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.lyrics.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.lists() });
      addToast('Lyrics updated successfully', 'success');
    },
  });
}

export function useDeleteLyrics() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => lyricsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.lyrics.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.lists() });
      addToast('Lyrics deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete lyrics', 'error');
    },
  });
}

export function useImportLyrics() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (file: File) => lyricsApi.import(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.lists() });
      addToast('Lyrics imported successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to import lyrics', 'error');
    },
  });
}
export function useExportLyrics() {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => lyricsApi.export(id),
    onSuccess: () => {
      addToast('Lyrics exported successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to export lyrics', 'error');
    },
  });
}

export function useBulkDeleteLyrics() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (ids: UUID[]) => lyricsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.lists() });

      if (result.errors.length > 0) {
        addToast(
          `${result.deleted} lyrics deleted, ${result.errors.length} failed`,
          'warning'
        );
      } else {
        addToast(`${result.deleted} lyrics deleted successfully`, 'success');
      }
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete lyrics', 'error');
    },
  });
}

export function useBulkExportLyrics() {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (ids: UUID[]) => lyricsApi.bulkExport(ids),
    onSuccess: () => {
      addToast('Lyrics exported successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to export lyrics', 'error');
    },
  });
}

export function useCheckProfanity() {
  return useMutation({
    mutationFn: ({
      sections,
      explicit_allowed,
    }: {
      sections: Array<{ type: string; lines: string[] }>;
      explicit_allowed?: boolean;
    }): Promise<ProfanityCheckResult> => lyricsApi.checkProfanity(sections, explicit_allowed),
  });
}
