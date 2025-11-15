/**
 * React Query Integration Hooks for Workflows
 *
 * Bridges React Query with Zustand Workflows Store
 * - Queries sync to store automatically
 * - Mutations use optimistic updates for cancel/retry
 * - Real-time progress tracking via WebSocket (Phase 3)
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

import { workflowsApi, type WorkflowRunFilters } from '@/lib/api/workflows';
import type { useWorkflowsStore } from '@meatymusic/store';
import type {
  WorkflowRun,
  WorkflowRunStatus,
  WorkflowProgress,
  WorkflowSummary,
  WorkflowExecutionRequest,
  WorkflowExecutionResponse,
  PaginatedResponse,
  UUID,
  WorkflowNode,
} from '@/types/api';

// Import store dynamically to avoid type errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const storeModule = require('@meatymusic/store');
const workflowsStore: typeof useWorkflowsStore = storeModule.useWorkflowsStore;

// ============================================================================
// Query Keys
// ============================================================================

export const workflowsKeys = {
  all: ['workflows'] as const,
  runs: () => [...workflowsKeys.all, 'runs'] as const,
  runsList: (filters: WorkflowRunFilters) => [...workflowsKeys.runs(), filters] as const,
  runDetails: () => [...workflowsKeys.all, 'run'] as const,
  runDetail: (runId: UUID) => [...workflowsKeys.runDetails(), runId] as const,
  progress: (runId: UUID) => [...workflowsKeys.runDetail(runId), 'progress'] as const,
  summary: (runId: UUID) => [...workflowsKeys.runDetail(runId), 'summary'] as const,
};

// ============================================================================
// Query Hooks with Store Sync
// ============================================================================

/**
 * Fetch workflow runs list and sync to Zustand store
 *
 * @param filters - Workflow run filters (song_id, status, pagination)
 * @returns React Query result with workflow runs data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useWorkflowsWithStore({
 *   song_id: songId,
 *   status: ['running', 'completed']
 * });
 * ```
 */
export function useWorkflowsWithStore(
  filters: WorkflowRunFilters = {}
): UseQueryResult<PaginatedResponse<WorkflowRun>, Error> {
  const setRuns = workflowsStore((state) => state.setRuns);

  const query = useQuery({
    queryKey: workflowsKeys.runsList(filters),
    queryFn: () => workflowsApi.list(filters),
    staleTime: 10000, // 10 seconds - workflows change frequently
    refetchOnWindowFocus: true, // Refetch on focus for active workflows
  });

  // Sync runs to store on success
  useEffect(() => {
    if (query.data) {
      setRuns(query.data.items);
    }
  }, [query.data, setRuns]);

  return query;
}

/**
 * Fetch single workflow run details and sync to store
 *
 * @param runId - Workflow run UUID
 * @returns React Query result with workflow run data
 *
 * @example
 * ```tsx
 * const { data: run, isLoading } = useWorkflowDetailsWithStore(runId);
 * ```
 */
export function useWorkflowDetailsWithStore(
  runId: UUID
): UseQueryResult<WorkflowRun, Error> {
  const setRunDetails = workflowsStore((state) => state.setRunDetails);

  const query = useQuery({
    queryKey: workflowsKeys.runDetail(runId),
    queryFn: () => workflowsApi.get(runId),
    staleTime: 5000, // 5 seconds - details update frequently
    refetchInterval: (query) => {
      // Poll if running, otherwise don't
      const data = query.state.data;
      const status = data?.status;
      return status === WorkflowRunStatus.RUNNING ? 3000 : false;
    },
  });

  // Sync run details to store
  useEffect(() => {
    if (query.data) {
      setRunDetails(runId, query.data);
    }
  }, [query.data, runId, setRunDetails]);

  return query;
}

/**
 * Fetch workflow run progress and sync to store
 *
 * @param runId - Workflow run UUID
 * @returns React Query result with progress data
 *
 * @example
 * ```tsx
 * const { data: progress } = useWorkflowProgressWithStore(runId);
 * ```
 */
export function useWorkflowProgressWithStore(
  runId: UUID
): UseQueryResult<WorkflowProgress, Error> {
  const trackRunProgress = workflowsStore((state) => state.trackRunProgress);

  const query = useQuery({
    queryKey: workflowsKeys.progress(runId),
    queryFn: () => workflowsApi.getProgress(runId),
    staleTime: 3000, // 3 seconds
    refetchInterval: (query) => {
      // Poll if not complete
      const data = query.state.data;
      return data && data.progress_percentage < 100 ? 2000 : false;
    },
  });

  // Sync progress to store
  useEffect(() => {
    if (query.data) {
      trackRunProgress(
        runId,
        query.data.progress_percentage,
        query.data.current_node ?? null
      );
    }
  }, [query.data, runId, trackRunProgress]);

  return query;
}

/**
 * Fetch workflow run summary (scores, artifacts) and sync to store
 *
 * @param runId - Workflow run UUID
 * @returns React Query result with summary data
 *
 * @example
 * ```tsx
 * const { data: summary } = useWorkflowSummaryWithStore(runId);
 * ```
 */
export function useWorkflowSummaryWithStore(
  runId: UUID
): UseQueryResult<WorkflowSummary, Error> {
  const setScores = workflowsStore((state) => state.setScores);
  const setArtifacts = workflowsStore((state) => state.setArtifacts);

  const query = useQuery({
    queryKey: workflowsKeys.summary(runId),
    queryFn: () => workflowsApi.getSummary(runId),
    staleTime: 30000, // 30 seconds - summary is relatively stable
  });

  // Sync scores and artifacts to store
  useEffect(() => {
    if (query.data) {
      if (query.data.validation_scores) {
        setScores(runId, query.data.validation_scores);
      }
      if (query.data.final_artifacts) {
        setArtifacts(runId, query.data.final_artifacts);
      }
    }
  }, [query.data, runId, setScores, setArtifacts]);

  return query;
}

// ============================================================================
// Mutation Hooks with Optimistic Updates
// ============================================================================

/**
 * Start workflow execution mutation
 *
 * @returns Mutation result for starting workflow
 *
 * @example
 * ```tsx
 * const startWorkflow = useStartWorkflowMutation();
 *
 * await startWorkflow.mutateAsync({
 *   song_id: songId,
 *   nodes: ['PLAN', 'STYLE', 'LYRICS'],
 *   feature_flags: {}
 * });
 * ```
 */
export function useStartWorkflowMutation(): UseMutationResult<
  WorkflowExecutionResponse,
  Error,
  WorkflowExecutionRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request) => workflowsApi.start(request),

    onSuccess: (response) => {
      // Add the new run to the store
      const newRun: WorkflowRun = {
        id: response.run_id,
        run_id: response.run_id,
        tenant_id: 'current', // Will be updated from next fetch
        owner_id: 'current',
        song_id: response.song_id,
        status: response.status,
        current_node: undefined,
        created_at: response.started_at,
        updated_at: response.started_at,
      };

      workflowsStore.getState().setRuns([newRun]);

      // Invalidate runs list to refetch
      queryClient.invalidateQueries({ queryKey: workflowsKeys.runs() });

      // Start polling progress
      queryClient.invalidateQueries({
        queryKey: workflowsKeys.progress(response.run_id),
      });
    },
  });
}

/**
 * Cancel workflow mutation with optimistic update
 *
 * @returns Mutation result with optimistic cancel
 *
 * @example
 * ```tsx
 * const cancelWorkflow = useCancelWorkflowMutation();
 *
 * await cancelWorkflow.mutateAsync(runId);
 * ```
 */
export function useCancelWorkflowMutation(): UseMutationResult<
  void,
  Error,
  UUID
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId) => workflowsApi.cancel(runId),

    onMutate: async (runId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: workflowsKeys.runDetail(runId),
      });

      // Optimistically mark as cancelled
      workflowsStore.getState().optimisticCancel(runId);

      return { runId };
    },

    onSuccess: (_, runId) => {
      // Commit the cancellation
      workflowsStore.getState().commitCancel(runId);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: workflowsKeys.runDetail(runId),
      });
      queryClient.invalidateQueries({ queryKey: workflowsKeys.runs() });

      // Stop polling progress
      queryClient.cancelQueries({
        queryKey: workflowsKeys.progress(runId),
      });
    },

    onError: (_, runId) => {
      // Rollback optimistic cancel
      workflowsStore.getState().rollbackCancel(runId);
    },
  });
}

/**
 * Retry workflow node mutation with optimistic update
 *
 * NOTE: This is a placeholder for future retry functionality.
 * Backend API support needed for node-level retry.
 *
 * @returns Mutation result with optimistic retry
 *
 * @example
 * ```tsx
 * const retryNode = useRetryWorkflowMutation();
 *
 * await retryNode.mutateAsync({ runId, nodeId: 'LYRICS' });
 * ```
 */
export function useRetryWorkflowMutation(): UseMutationResult<
  void,
  Error,
  { runId: UUID; nodeId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    // TODO: Implement retry API endpoint in backend
    mutationFn: async () => {
      // Placeholder - backend needs to implement /workflows/runs/{runId}/retry
      throw new Error('Retry API not yet implemented');
    },

    onMutate: async ({ runId, nodeId }) => {
      // Optimistically mark node as retrying
      workflowsStore.getState().optimisticRetry(runId, nodeId);

      return { runId, nodeId };
    },

    onSuccess: (_, { runId }) => {
      // Commit the retry
      workflowsStore.getState().commitRetry(runId);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: workflowsKeys.runDetail(runId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowsKeys.progress(runId),
      });
    },

    onError: (_, { runId }) => {
      // Rollback would happen here, but store doesn't have this method yet
      // For now, just invalidate to refetch actual state
      queryClient.invalidateQueries({
        queryKey: workflowsKeys.runDetail(runId),
      });
    },
  });
}

// ============================================================================
// Prefetch Utilities
// ============================================================================

/**
 * Prefetch workflow runs for faster navigation
 *
 * @example
 * ```tsx
 * const prefetchWorkflows = usePrefetchWorkflows();
 *
 * // On song details page load
 * prefetchWorkflows({ song_id: songId });
 * ```
 */
export function usePrefetchWorkflows() {
  const queryClient = useQueryClient();

  return (filters: WorkflowRunFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: workflowsKeys.runsList(filters),
      queryFn: () => workflowsApi.list(filters),
      staleTime: 10000,
    });
  };
}

/**
 * Prefetch workflow run details
 *
 * @example
 * ```tsx
 * const prefetchWorkflow = usePrefetchWorkflow();
 *
 * // On workflow row hover
 * prefetchWorkflow(runId);
 * ```
 */
export function usePrefetchWorkflow() {
  const queryClient = useQueryClient();

  return (runId: UUID) => {
    queryClient.prefetchQuery({
      queryKey: workflowsKeys.runDetail(runId),
      queryFn: () => workflowsApi.get(runId),
      staleTime: 5000,
    });
  };
}

// ============================================================================
// Invalidation Helpers
// ============================================================================

/**
 * Clear workflow run details from cache and store
 *
 * Use this when navigating away from workflow detail view
 *
 * @example
 * ```tsx
 * const clearWorkflowDetails = useClearWorkflowDetails();
 *
 * useEffect(() => {
 *   return () => clearWorkflowDetails(runId);
 * }, [runId]);
 * ```
 */
export function useClearWorkflowDetails() {
  const queryClient = useQueryClient();
  const clearRunDetails = workflowsStore((state) => state.clearRunDetails);

  return (runId: UUID) => {
    // Clear from store
    clearRunDetails(runId);

    // Remove from React Query cache
    queryClient.removeQueries({
      queryKey: workflowsKeys.runDetail(runId),
    });
    queryClient.removeQueries({
      queryKey: workflowsKeys.progress(runId),
    });
    queryClient.removeQueries({
      queryKey: workflowsKeys.summary(runId),
    });
  };
}
