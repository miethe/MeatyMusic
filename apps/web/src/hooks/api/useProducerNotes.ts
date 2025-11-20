/**
 * ProducerNotes Query Hooks
 * React Query hooks for ProducerNotes entity operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { producerNotesApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { ProducerNotes, ProducerNotesCreate, ProducerNotesUpdate, UUID } from '@/types/api';
import type { ProducerNotesFilters } from '@/lib/api/producerNotes';

export function useProducerNotesList(filters?: ProducerNotesFilters) {
  return useQuery({
    queryKey: queryKeys.producerNotes.list(filters as Record<string, unknown> | undefined),
    queryFn: () => producerNotesApi.list(filters),
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useProducerNotes(id: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.producerNotes.detail(id!),
    queryFn: () => producerNotesApi.get(id!),
    enabled: !!id,
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useCreateProducerNotes() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (producerNotes: ProducerNotesCreate) => producerNotesApi.create(producerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.producerNotes.lists() });
      addToast('Producer notes created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create producer notes', 'error');
    },
  });
}

export function useUpdateProducerNotes(id: UUID) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (producerNotes: ProducerNotesUpdate) => producerNotesApi.update(id, producerNotes),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.producerNotes.detail(id) });
      const previousNotes = queryClient.getQueryData<ProducerNotes>(queryKeys.producerNotes.detail(id));
      if (previousNotes) {
        queryClient.setQueryData<ProducerNotes>(queryKeys.producerNotes.detail(id), { ...previousNotes, ...update });
      }
      return { previousNotes };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.producerNotes.detail(id), context.previousNotes);
      }
      addToast(error?.message || 'Failed to update producer notes', 'error');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.producerNotes.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.producerNotes.lists() });
      addToast('Producer notes updated successfully', 'success');
    },
  });
}

export function useDeleteProducerNotes() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => producerNotesApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.producerNotes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.producerNotes.lists() });
      addToast('Producer notes deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete producer notes', 'error');
    },
  });
}

export function useImportProducerNotes() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (file: File) => producerNotesApi.import(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.producerNotes.lists() });
      addToast('Producer notes imported successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to import producer notes', 'error');
    },
  });
}
export function useExportProducerNotes() {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => producerNotesApi.export(id),
    onSuccess: () => {
      addToast('Producer notes exported successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to export producer notes', 'error');
    },
  });
}

export function useBulkDeleteProducerNotes() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (ids: UUID[]) => producerNotesApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.producerNotes.lists() });

      if (result.errors.length > 0) {
        addToast(
          `${result.deleted} producer notes deleted, ${result.errors.length} failed`,
          'warning'
        );
      } else {
        addToast(`${result.deleted} producer notes deleted successfully`, 'success');
      }
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete producer notes', 'error');
    },
  });
}

export function useBulkExportProducerNotes() {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (ids: UUID[]) => producerNotesApi.bulkExport(ids),
    onSuccess: () => {
      addToast('Producer notes exported successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to export producer notes', 'error');
    },
  });
}
