/**
 * Workflows Query Hooks
 * React Query hooks for Workflow execution and run management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import { useWorkflowStore, useUIStore } from '@/stores';
import type {
  WorkflowExecutionRequest,
  UUID,
} from '@/types/api';
import type { WorkflowRunFilters } from '@/lib/api/workflows';

/**
 * Fetch paginated list of workflow runs
 */
export function useWorkflowRuns(filters?: WorkflowRunFilters) {
  return useQuery({
    queryKey: queryKeys.workflows.list(filters as Record<string, unknown> | undefined),
    queryFn: () => workflowsApi.list(filters),
    staleTime: getStaleTime('WORKFLOWS_INACTIVE'),
  });
}

/**
 * Fetch a single workflow run by ID
 */
export function useWorkflowRun(runId: UUID | undefined) {
  // Check if run is active to determine stale time
  const activeRun = useWorkflowStore((state) => state.activeRuns.get(runId || ''));
  const isActive = activeRun?.status === 'running';

  return useQuery({
    queryKey: queryKeys.workflows.detail(runId!),
    queryFn: () => workflowsApi.get(runId!),
    enabled: !!runId,
    staleTime: isActive ? getStaleTime('WORKFLOWS_ACTIVE') : getStaleTime('WORKFLOWS_INACTIVE'),
    refetchInterval: isActive ? 5000 : false, // Poll every 5s for active runs
  });
}

/**
 * Fetch workflow run progress
 */
export function useWorkflowProgress(runId: UUID | undefined) {
  const activeRun = useWorkflowStore((state) => state.activeRuns.get(runId || ''));
  const isActive = activeRun?.status === 'running';

  return useQuery({
    queryKey: queryKeys.workflows.progress(runId!),
    queryFn: () => workflowsApi.getProgress(runId!),
    enabled: !!runId && isActive,
    staleTime: getStaleTime('WORKFLOWS_ACTIVE'),
    refetchInterval: 2000, // Poll every 2s for progress
  });
}

/**
 * Fetch workflow run summary
 */
export function useWorkflowSummary(runId: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(runId!),
    queryFn: () => workflowsApi.getSummary(runId!),
    enabled: !!runId,
    staleTime: getStaleTime('WORKFLOWS_INACTIVE'),
  });
}

/**
 * Start a new workflow execution
 */
export function useStartWorkflow() {
  const queryClient = useQueryClient();
  const { addRun } = useWorkflowStore();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (request: WorkflowExecutionRequest) => workflowsApi.start(request),
    onSuccess: (response) => {
      // Add to active runs in workflow store
      addRun(response.run_id, response.song_id);

      // Invalidate workflow runs queries
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.detail(response.song_id) });

      addToast('Workflow started successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to start workflow', 'error');
    },
  });
}

/**
 * Cancel a running workflow
 */
export function useCancelWorkflow() {
  const queryClient = useQueryClient();
  const { clearRun } = useWorkflowStore();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (runId: UUID) => workflowsApi.cancel(runId),
    onSuccess: (_data, runId) => {
      // Remove from active runs
      clearRun(runId);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(runId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists() });

      addToast('Workflow cancelled successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to cancel workflow', 'error');
    },
  });
}
