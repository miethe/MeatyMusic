/**
 * Styles Query Hooks
 * React Query hooks for Style entity operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stylesApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { Style, StyleCreate, StyleUpdate, UUID } from '@/types/api';
import type { StyleFilters } from '@/lib/api/styles';

export function useStyles(filters?: StyleFilters) {
  return useQuery({
    queryKey: queryKeys.styles.list(filters as Record<string, unknown> | undefined),
    queryFn: () => stylesApi.list(filters),
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useStyle(id: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.styles.detail(id!),
    queryFn: () => stylesApi.get(id!),
    enabled: !!id,
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useCreateStyle() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (style: StyleCreate) => stylesApi.create(style),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.styles.lists() });
      addToast(`Style "${data.name}" created successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create style', 'error');
    },
  });
}

export function useUpdateStyle(id: UUID) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (style: StyleUpdate) => stylesApi.update(id, style),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.styles.detail(id) });
      const previousStyle = queryClient.getQueryData<Style>(queryKeys.styles.detail(id));
      if (previousStyle) {
        queryClient.setQueryData<Style>(queryKeys.styles.detail(id), { ...previousStyle, ...update });
      }
      return { previousStyle };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousStyle) {
        queryClient.setQueryData(queryKeys.styles.detail(id), context.previousStyle);
      }
      addToast(error?.message || 'Failed to update style', 'error');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.styles.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.styles.lists() });
      addToast(`Style "${data.name}" updated successfully`, 'success');
    },
  });
}

export function useDeleteStyle() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => stylesApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.styles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.styles.lists() });
      addToast('Style deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete style', 'error');
    },
  });
}
