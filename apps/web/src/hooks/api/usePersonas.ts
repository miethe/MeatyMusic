/**
 * Personas Query Hooks
 * React Query hooks for Persona entity operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personasApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useUIStore } from '@/stores';
import type { Persona, PersonaCreate, PersonaUpdate, UUID } from '@/types/api';
import type { PersonaFilters } from '@/lib/api/personas';

export function usePersonas(filters?: PersonaFilters) {
  return useQuery({
    queryKey: queryKeys.personas.list(filters as Record<string, unknown> | undefined),
    queryFn: () => personasApi.list(filters),
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function usePersona(id: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.personas.detail(id!),
    queryFn: () => personasApi.get(id!),
    enabled: !!id,
    staleTime: getStaleTime('ENTITIES'),
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (persona: PersonaCreate) => personasApi.create(persona),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.lists() });
      addToast(`Persona "${data.name}" created successfully`, 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to create persona', 'error');
    },
  });
}

export function useUpdatePersona(id: UUID) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (persona: PersonaUpdate) => personasApi.update(id, persona),
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.personas.detail(id) });
      const previousPersona = queryClient.getQueryData<Persona>(queryKeys.personas.detail(id));
      if (previousPersona) {
        queryClient.setQueryData<Persona>(queryKeys.personas.detail(id), { ...previousPersona, ...update });
      }
      return { previousPersona };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousPersona) {
        queryClient.setQueryData(queryKeys.personas.detail(id), context.previousPersona);
      }
      addToast(error?.message || 'Failed to update persona', 'error');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.personas.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.lists() });
      addToast(`Persona "${data.name}" updated successfully`, 'success');
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: UUID) => personasApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.personas.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.lists() });
      addToast('Persona deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete persona', 'error');
    },
  });
}
