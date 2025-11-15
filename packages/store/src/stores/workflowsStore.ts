import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createMultiTabMiddleware } from '../middleware/multiTabMiddleware';
import type {
  WorkflowsStore,
  WorkflowsFilters,
  WorkflowsSorting,
  WorkflowsPagination,
} from '../types';

// ============================================================================
// Initial State Values
// ============================================================================

const initialFilters: WorkflowsFilters = {
  status: undefined,
  songId: undefined,
};

const initialSorting: WorkflowsSorting = {
  field: 'startedAt',
  direction: 'desc',
};

const initialPagination: WorkflowsPagination = {
  page: 1,
  limit: 20,
  total: 0,
};

// ============================================================================
// Store Creator
// ============================================================================

const creator: StateCreator<WorkflowsStore> = (set, _get) => ({
  // ========================================================================
  // List State
  // ========================================================================
  items: new Map(),
  allIds: [],
  filters: initialFilters,
  sorting: initialSorting,
  pagination: initialPagination,
  loading: false,
  error: null,

  // ========================================================================
  // Progress State
  // ========================================================================
  activeRunId: null,
  nodeEvents: new Map(),
  scores: new Map(),
  artifacts: new Map(),

  // ========================================================================
  // Optimistic State
  // ========================================================================
  cancelledRunIds: new Set(),
  retryingNodes: new Map(),

  // ========================================================================
  // Query Sync Actions
  // ========================================================================

  setRuns: (runs) => {
    const itemsMap = new Map(runs.map((run) => [run.id, run]));
    const allIds = runs.map((run) => run.id);

    set({
      items: itemsMap,
      allIds,
      loading: false,
      error: null,
    });
  },

  setRunDetails: (runId, details) => {
    set((state) => {
      const items = new Map(state.items);
      const existing = items.get(runId);

      if (existing) {
        items.set(runId, { ...existing, ...details });
        return { items };
      }

      return state;
    });
  },

  setNodeEvent: (runId, event) => {
    set((state) => {
      const nodeEvents = new Map(state.nodeEvents);
      const events = nodeEvents.get(runId) || [];

      // Add event in chronological order
      nodeEvents.set(runId, [...events, event]);

      return { nodeEvents };
    });
  },

  setScores: (runId, scores) => {
    set((state) => {
      const scoresMap = new Map(state.scores);
      scoresMap.set(runId, scores);
      return { scores: scoresMap };
    });
  },

  setArtifacts: (runId, artifacts) => {
    set((state) => {
      const artifactsMap = new Map(state.artifacts);
      artifactsMap.set(runId, artifacts);
      return { artifacts: artifactsMap };
    });
  },

  // ========================================================================
  // Filters & Sorting
  // ========================================================================

  setWorkflowFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    })),

  setWorkflowSorting: (field, direction) =>
    set((state) => {
      const newDirection =
        direction ??
        (state.sorting.field === field && state.sorting.direction === 'asc'
          ? 'desc'
          : 'asc');
      return {
        sorting: { field, direction: newDirection },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page
      };
    }),

  // ========================================================================
  // Progress Tracking
  // ========================================================================

  trackRunProgress: (runId, progress, currentNode) => {
    set((state) => {
      const items = new Map(state.items);
      const existing = items.get(runId);

      if (existing) {
        items.set(runId, {
          ...existing,
          progress,
          currentNode,
        });
        return { items };
      }

      return state;
    });
  },

  trackNodeEvent: (runId, event) => {
    set((state) => {
      const nodeEvents = new Map(state.nodeEvents);
      const events = nodeEvents.get(runId) || [];

      // Add event and maintain chronological order
      nodeEvents.set(runId, [...events, event]);

      return { nodeEvents };
    });
  },

  clearRunDetails: (runId) => {
    set((state) => {
      const nodeEvents = new Map(state.nodeEvents);
      const scores = new Map(state.scores);
      const artifacts = new Map(state.artifacts);

      nodeEvents.delete(runId);
      scores.delete(runId);
      artifacts.delete(runId);

      return {
        nodeEvents,
        scores,
        artifacts,
        activeRunId: state.activeRunId === runId ? null : state.activeRunId,
      };
    });
  },

  // ========================================================================
  // Optimistic Operations
  // ========================================================================

  optimisticCancel: (runId) => {
    set((state) => {
      const cancelledRunIds = new Set(state.cancelledRunIds);
      cancelledRunIds.add(runId);

      // Also update the run status optimistically
      const items = new Map(state.items);
      const existing = items.get(runId);

      if (existing) {
        items.set(runId, {
          ...existing,
          status: 'cancelled',
        });
      }

      return { cancelledRunIds, items };
    });
  },

  commitCancel: (runId) => {
    set((state) => {
      const cancelledRunIds = new Set(state.cancelledRunIds);
      cancelledRunIds.delete(runId);

      return { cancelledRunIds };
    });
  },

  rollbackCancel: (runId) => {
    set((state) => {
      const cancelledRunIds = new Set(state.cancelledRunIds);
      cancelledRunIds.delete(runId);

      // Restore the original status from server or assume 'running'
      const items = new Map(state.items);
      const existing = items.get(runId);

      if (existing && existing.status === 'cancelled') {
        items.set(runId, {
          ...existing,
          status: 'running',
        });
      }

      return { cancelledRunIds, items };
    });
  },

  optimisticRetry: (runId, nodeId) => {
    set((state) => {
      const retryingNodes = new Map(state.retryingNodes);
      retryingNodes.set(runId, nodeId);

      return { retryingNodes };
    });
  },

  commitRetry: (runId) => {
    set((state) => {
      const retryingNodes = new Map(state.retryingNodes);
      retryingNodes.delete(runId);

      return { retryingNodes };
    });
  },

  // ========================================================================
  // Cache Control
  // ========================================================================

  invalidateRuns: () => {
    set({
      items: new Map(),
      allIds: [],
      loading: false,
      error: null,
    });
  },

  invalidateRunDetails: (runId) => {
    set((state) => {
      const nodeEvents = new Map(state.nodeEvents);
      const scores = new Map(state.scores);
      const artifacts = new Map(state.artifacts);

      nodeEvents.delete(runId);
      scores.delete(runId);
      artifacts.delete(runId);

      return { nodeEvents, scores, artifacts };
    });
  },

  clear: () => {
    set({
      items: new Map(),
      allIds: [],
      filters: initialFilters,
      sorting: initialSorting,
      pagination: initialPagination,
      loading: false,
      error: null,
      activeRunId: null,
      nodeEvents: new Map(),
      scores: new Map(),
      artifacts: new Map(),
      cancelledRunIds: new Set(),
      retryingNodes: new Map(),
    });
  },
});

// ============================================================================
// Middleware Composition with Minimal Persistence
// ============================================================================

/**
 * Custom persistence wrapper for workflows store
 *
 * Only persists UI state (activeRunId, filters, sorting), NOT data.
 * Workflow data is dynamic and should be fetched fresh from API.
 *
 * This keeps localStorage minimal and prevents stale data issues.
 */
const withMinimalPersistence = (config: StateCreator<WorkflowsStore>): StateCreator<WorkflowsStore> => {
  return (set, get, api) => {
    // Check if we need to hydrate from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('meatymusic-workflows-progress');
        if (stored) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed: any = JSON.parse(stored);

          // Only restore UI state, not data
          const uiState = {
            activeRunId: parsed.activeRunId ?? null,
            filters: parsed.filters ?? initialFilters,
            sorting: parsed.sorting ?? initialSorting,
          };

          // Manually merge into initial state
          set(uiState, true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('workflowsStore.hydration.error', error);
      }
    }

    // Wrap the set function to persist only UI state
    const originalSet = set;
    const customSet: typeof set = (partial, replace) => {
      originalSet(partial, replace);

      // After setting state, persist only UI fields
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const state = get();
          const uiState = {
            activeRunId: state.activeRunId,
            filters: state.filters,
            sorting: state.sorting,
          };
          window.localStorage.setItem('meatymusic-workflows-progress', JSON.stringify(uiState));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('workflowsStore.persistence.error', error);
        }
      }
    };

    // Replace set in the API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any).setState = customSet;

    return config(set, get, api);
  };
};

const withMiddleware = (config: StateCreator<WorkflowsStore>) =>
  withMinimalPersistence(
    createMultiTabMiddleware<WorkflowsStore>('meatymusic-workflows-progress', {
      mergeStrategy: 'merge',
    })(config)
  );

export const useWorkflowsStore = create<WorkflowsStore>()(
  devtools(withMiddleware(creator), {
    enabled: process.env.NODE_ENV === 'development',
    name: 'workflowsStore',
  })
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get all workflow runs as a Map
 */
export const useWorkflows = () => useWorkflowsStore((state) => state.items);

/**
 * Get all workflow run IDs in current order
 */
export const useWorkflowIds = () => useWorkflowsStore((state) => state.allIds);

/**
 * Get a single workflow run by ID
 * @param id - Workflow run ID to retrieve
 * @returns WorkflowRun or null if not found
 */
export const useWorkflowById = (id: string) =>
  useWorkflowsStore((state) => state.items.get(id) ?? null);

/**
 * Get current workflow filters
 */
export const useWorkflowsFilters = () =>
  useWorkflowsStore((state) => state.filters);

/**
 * Get current workflow sorting
 */
export const useWorkflowsSorting = () =>
  useWorkflowsStore((state) => state.sorting);

/**
 * Get current workflow pagination
 */
export const useWorkflowsPagination = () =>
  useWorkflowsStore((state) => state.pagination);

/**
 * Get workflow loading state
 */
export const useWorkflowsLoading = () =>
  useWorkflowsStore((state) => state.loading);

/**
 * Get workflow error state
 */
export const useWorkflowsError = () =>
  useWorkflowsStore((state) => state.error);

/**
 * Get currently active run ID
 */
export const useActiveRunId = () =>
  useWorkflowsStore((state) => state.activeRunId);

/**
 * Get node events for a specific run
 * @param runId - Workflow run ID
 * @returns Array of workflow events or empty array
 */
export const useNodeEvents = (runId: string) =>
  useWorkflowsStore((state) => state.nodeEvents.get(runId) ?? []);

/**
 * Get scores for a specific run
 * @param runId - Workflow run ID
 * @returns ScoreSummary or null if not found
 */
export const useRunScores = (runId: string) =>
  useWorkflowsStore((state) => state.scores.get(runId) ?? null);

/**
 * Get artifacts for a specific run
 * @param runId - Workflow run ID
 * @returns ArtifactMap or null if not found
 */
export const useRunArtifacts = (runId: string) =>
  useWorkflowsStore((state) => state.artifacts.get(runId) ?? null);

/**
 * Check if a run is optimistically cancelled
 * @param runId - Workflow run ID
 * @returns boolean
 */
export const useIsRunCancelled = (runId: string) =>
  useWorkflowsStore((state) => state.cancelledRunIds.has(runId));

/**
 * Get retrying node ID for a run
 * @param runId - Workflow run ID
 * @returns Node ID or null
 */
export const useRetryingNode = (runId: string) =>
  useWorkflowsStore((state) => state.retryingNodes.get(runId) ?? null);

// ============================================================================
// WebSocket Integration Documentation
// ============================================================================

/**
 * WebSocket Event Handling Pattern
 *
 * This store is designed to work with WebSocket events in Phase 3.
 * Here's how the integration will look:
 *
 * @example
 * ```typescript
 * // In a React component or hook:
 * useWorkflowEvents('run-event', (event: WorkflowEvent) => {
 *   const { runId, node, phase } = event;
 *
 *   // Track the event
 *   workflowsStore.trackNodeEvent(runId, event);
 *
 *   // Update progress based on events
 *   if (phase === 'end') {
 *     const events = workflowsStore.getState().nodeEvents.get(runId) || [];
 *     const progress = calculateProgress(events);
 *     workflowsStore.trackRunProgress(runId, progress, node);
 *   }
 *
 *   // Handle completion
 *   if (phase === 'end' && node === 'REVIEW') {
 *     workflowsStore.setRunDetails(runId, {
 *       status: 'completed',
 *       completedAt: new Date().toISOString(),
 *       progress: 100,
 *     });
 *   }
 *
 *   // Handle failures
 *   if (phase === 'fail') {
 *     workflowsStore.setRunDetails(runId, {
 *       status: 'failed',
 *       error: event.issues?.join(', ') || 'Unknown error',
 *     });
 *   }
 * });
 *
 * // Listen for score updates
 * useWorkflowEvents('scores-updated', (event) => {
 *   workflowsStore.setScores(event.runId, event.scores);
 * });
 *
 * // Listen for artifact updates
 * useWorkflowEvents('artifacts-updated', (event) => {
 *   workflowsStore.setArtifacts(event.runId, event.artifacts);
 * });
 * ```
 *
 * Progress Calculation Example:
 * ```typescript
 * const WORKFLOW_NODES = ['PLAN', 'STYLE', 'LYRICS', 'PRODUCER', 'COMPOSE', 'VALIDATE', 'RENDER', 'REVIEW'];
 *
 * function calculateProgress(events: WorkflowEvent[]): number {
 *   const completedNodes = new Set(
 *     events
 *       .filter(e => e.phase === 'end')
 *       .map(e => e.node)
 *   );
 *
 *   return Math.round((completedNodes.size / WORKFLOW_NODES.length) * 100);
 * }
 * ```
 */
