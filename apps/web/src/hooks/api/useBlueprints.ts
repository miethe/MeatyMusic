/**
 * Blueprints Query Hooks
 * React Query hooks for Blueprint entity operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blueprintsApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { Blueprint, BlueprintCreate, BlueprintUpdate, UUID } from '@/types/api';
import type { BlueprintFilters } from '@/lib/api/blueprints';

export function useBlueprints(filters?: BlueprintFilters) {
  return useQuery({
    queryKey: queryKeys.blueprints.list(filters as Record<string, unknown> | undefined),
    queryFn: () => blueprintsApi.list(filters),
    staleTime: getStaleTime('BLUEPRINTS'),
  });
}

export function useBlueprint(id: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.blueprints.detail(id!),
    queryFn: () => blueprintsApi.get(id!),
    enabled: !!id,
    staleTime: getStaleTime('BLUEPRINTS'),
  });
}

export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (blueprint: BlueprintCreate) => blueprintsApi.create(blueprint),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      addToast(`Blueprint for "${data.genre}" created successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create blueprint', 'error');
    },
  });
}

export function useUpdateBlueprint(id: UUID) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (blueprint: BlueprintUpdate) => blueprintsApi.update(id, blueprint),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blueprints.detail(id) });
      const previousBlueprint = queryClient.getQueryData<Blueprint>(queryKeys.blueprints.detail(id));
      if (previousBlueprint) {
        queryClient.setQueryData<Blueprint>(queryKeys.blueprints.detail(id), { ...previousBlueprint, ...update });
      }
      return { previousBlueprint };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousBlueprint) {
        queryClient.setQueryData(queryKeys.blueprints.detail(id), context.previousBlueprint);
      }
      addToast(error?.message || 'Failed to update blueprint', 'error');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.blueprints.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      addToast(`Blueprint for "${data.genre}" updated successfully`, 'success');
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => blueprintsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.blueprints.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      addToast('Blueprint deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete blueprint', 'error');
    },
  });
}

export function useImportBlueprint() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (file: File) => blueprintsApi.import(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      addToast(`Blueprint for "${data.genre}" imported successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to import blueprint', 'error');
    },
  });
}
