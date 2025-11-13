/**
 * React Query Configuration
 * Query client and query key factory for MeatyMusic AMCS
 *
 * Performance tuning:
 * - Songs: 30s stale time (frequently updated during workflows)
 * - Entities (Style/Lyrics/Persona/Producer): 2min (moderately updated)
 * - Blueprints: 5min (rarely change)
 * - Workflow runs: 10s during active run, 5min after completion
 */

import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_MS = {
  SONGS: 1000 * 30, // 30 seconds
  ENTITIES: 1000 * 60 * 2, // 2 minutes
  BLUEPRINTS: 1000 * 60 * 5, // 5 minutes
  WORKFLOWS_ACTIVE: 1000 * 10, // 10 seconds
  WORKFLOWS_INACTIVE: 1000 * 60 * 5, // 5 minutes
  DEFAULT: 1000 * 60 * 5, // 5 minutes
};

const GC_TIME_MS = 1000 * 60 * 10; // 10 minutes

/**
 * React Query client with optimized defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS.DEFAULT,
      gcTime: GC_TIME_MS,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Use cache first
      structuralSharing: true, // Prevent unnecessary re-renders
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

/**
 * Query key factory for type-safe, hierarchical query keys
 * Follow pattern from architecture guide section 4.4
 */
export const queryKeys = {
  // Song keys
  songs: {
    all: ['songs'] as const,
    lists: () => [...queryKeys.songs.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.songs.lists(), filters] as const,
    details: () => [...queryKeys.songs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.songs.details(), id] as const,
    // Entity relations
    entities: (id: string) => [...queryKeys.songs.detail(id), 'entities'] as const,
    entity: (id: string, type: string) =>
      [...queryKeys.songs.entities(id), type] as const,
    // Workflow runs
    runs: (id: string) => [...queryKeys.songs.detail(id), 'runs'] as const,
    run: (id: string, runId: string) => [...queryKeys.songs.runs(id), runId] as const,
  },

  // Style keys
  styles: {
    all: ['styles'] as const,
    lists: () => [...queryKeys.styles.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.styles.lists(), filters] as const,
    details: () => [...queryKeys.styles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.styles.details(), id] as const,
  },

  // Lyrics keys
  lyrics: {
    all: ['lyrics'] as const,
    lists: () => [...queryKeys.lyrics.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.lyrics.lists(), filters] as const,
    details: () => [...queryKeys.lyrics.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.lyrics.details(), id] as const,
  },

  // Persona keys
  personas: {
    all: ['personas'] as const,
    lists: () => [...queryKeys.personas.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.personas.lists(), filters] as const,
    details: () => [...queryKeys.personas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.personas.details(), id] as const,
  },

  // ProducerNotes keys
  producerNotes: {
    all: ['producer-notes'] as const,
    lists: () => [...queryKeys.producerNotes.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.producerNotes.lists(), filters] as const,
    details: () => [...queryKeys.producerNotes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.producerNotes.details(), id] as const,
  },

  // Blueprint keys
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.blueprints.lists(), filters] as const,
    details: () => [...queryKeys.blueprints.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.blueprints.details(), id] as const,
  },

  // Source keys
  sources: {
    all: ['sources'] as const,
    lists: () => [...queryKeys.sources.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.sources.lists(), filters] as const,
    details: () => [...queryKeys.sources.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sources.details(), id] as const,
  },

  // Workflow keys
  workflows: {
    all: ['workflows'] as const,
    lists: () => [...queryKeys.workflows.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.workflows.lists(), filters] as const,
    details: () => [...queryKeys.workflows.all, 'detail'] as const,
    detail: (runId: string) => [...queryKeys.workflows.details(), runId] as const,
    // Workflow progress
    progress: (runId: string) => [...queryKeys.workflows.detail(runId), 'progress'] as const,
  },
} as const;

/**
 * Helper to get stale time for specific entity types
 */
export function getStaleTime(entityType: keyof typeof STALE_TIME_MS): number {
  return STALE_TIME_MS[entityType] || STALE_TIME_MS.DEFAULT;
}
