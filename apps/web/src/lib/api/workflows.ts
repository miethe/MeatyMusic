/**
 * Workflows API Client
 * API methods for Workflow execution and run management
 *
 * Backend: services/api/app/routes/workflows.py
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/config/api';
import type {
  WorkflowRun,
  WorkflowRunUpdate,
  WorkflowExecutionRequest,
  WorkflowExecutionResponse,
  WorkflowProgress,
  WorkflowSummary,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * Workflow run list filters
 */
export interface WorkflowRunFilters {
  song_id?: UUID; // Filter by song
  status?: string[]; // Filter by status
  started_after?: string; // ISO date
  started_before?: string; // ISO date
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * Workflows API methods
 */
export const workflowsApi = {
  /**
   * List workflow runs with filters and pagination
   */
  list: async (filters?: WorkflowRunFilters): Promise<PaginatedResponse<WorkflowRun>> => {
    const { data } = await apiClient.get<PaginatedResponse<WorkflowRun>>(API_ENDPOINTS.WORKFLOW_RUNS, {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single workflow run by ID
   */
  get: async (runId: UUID): Promise<WorkflowRun> => {
    const { data } = await apiClient.get<WorkflowRun>(API_ENDPOINTS.WORKFLOW_RUN_DETAIL(runId));
    return data;
  },

  /**
   * Start a new workflow execution for a song
   */
  start: async (request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> => {
    const { data } = await apiClient.post<WorkflowExecutionResponse>('/workflows/execute', request);
    return data;
  },

  /**
   * Get workflow run progress
   */
  getProgress: async (runId: UUID): Promise<WorkflowProgress> => {
    const { data } = await apiClient.get<WorkflowProgress>(API_ENDPOINTS.WORKFLOW_RUN_PROGRESS(runId));
    return data;
  },

  /**
   * Get workflow run summary
   */
  getSummary: async (runId: UUID): Promise<WorkflowSummary> => {
    const { data } = await apiClient.get<WorkflowSummary>(API_ENDPOINTS.WORKFLOW_RUN_SUMMARY(runId));
    return data;
  },

  /**
   * Cancel a running workflow
   */
  cancel: async (runId: UUID): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.WORKFLOW_RUN_CANCEL(runId));
  },

  /**
   * Update workflow run (internal use)
   */
  update: async (runId: UUID, update: WorkflowRunUpdate): Promise<WorkflowRun> => {
    const { data } = await apiClient.patch<WorkflowRun>(API_ENDPOINTS.WORKFLOW_RUN_DETAIL(runId), update);
    return data;
  },
};
