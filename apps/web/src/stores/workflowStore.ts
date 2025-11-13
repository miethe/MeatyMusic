/**
 * Workflow Store
 * Client-side state for workflow execution and WebSocket updates
 *
 * Manages:
 * - Active workflow runs (keyed by run_id)
 * - WebSocket connection state
 * - Real-time event processing
 * - Node status tracking
 *
 * Architecture: Section 4.2.2 - Workflow Store (WebSocket State)
 */

import { create } from 'zustand';
import type { WorkflowRun, WorkflowNode, WorkflowRunStatus } from '@/types/api';
import type { WorkflowEvent } from '@/types/api/events';

/**
 * Workflow run state tracked in client
 */
export interface WorkflowRunState {
  songId: string;
  status: WorkflowRunStatus;
  currentNode?: WorkflowNode;
  nodes: Map<
    WorkflowNode,
    {
      status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
      startedAt?: Date;
      completedAt?: Date;
      durationMs?: number;
      error?: string;
    }
  >;
  events: WorkflowEvent[];
  lastUpdate: Date;
}

/**
 * Workflow store state
 */
interface WorkflowState {
  // WebSocket connection
  isConnected: boolean;
  connectionError: string | null;

  // Active workflow runs (keyed by run_id)
  activeRuns: Map<string, WorkflowRunState>;

  // Selected node for detail view
  selectedNodeId: WorkflowNode | null;

  // UI state
  isGraphExpanded: boolean;
}

/**
 * Workflow store actions
 */
interface WorkflowActions {
  // Connection management
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;

  // Run management
  addRun: (runId: string, songId: string) => void;
  updateRunStatus: (
    runId: string,
    status: Partial<
      Pick<WorkflowRunState, 'status' | 'currentNode'>
    >
  ) => void;
  updateNodeStatus: (
    runId: string,
    nodeId: WorkflowNode,
    status: Partial<WorkflowRunState['nodes'] extends Map<any, infer V> ? V : never>
  ) => void;
  addEvent: (runId: string, event: WorkflowEvent) => void;
  clearRun: (runId: string) => void;

  // UI actions
  selectNode: (nodeId: WorkflowNode | null) => void;
  toggleGraphExpanded: () => void;

  // Utilities
  getRun: (runId: string) => WorkflowRunState | undefined;
  getRunBySongId: (songId: string) => WorkflowRunState | undefined;
  reset: () => void;
}

/**
 * Workflow store combining state and actions
 */
export const useWorkflowStore = create<WorkflowState & WorkflowActions>((set, get) => ({
  // Initial state
  isConnected: false,
  connectionError: null,
  activeRuns: new Map(),
  selectedNodeId: null,
  isGraphExpanded: false,

  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),

  // Run actions
  addRun: (runId, songId) =>
    set((state) => {
      const newRuns = new Map(state.activeRuns);
      newRuns.set(runId, {
        songId,
        status: 'running' as WorkflowRunStatus,
        nodes: new Map(),
        events: [],
        lastUpdate: new Date(),
      });
      return { activeRuns: newRuns };
    }),

  updateRunStatus: (runId, status) =>
    set((state) => {
      const newRuns = new Map(state.activeRuns);
      const run = newRuns.get(runId);
      if (run) {
        newRuns.set(runId, {
          ...run,
          ...status,
          lastUpdate: new Date(),
        });
      }
      return { activeRuns: newRuns };
    }),

  updateNodeStatus: (runId, nodeId, status) =>
    set((state) => {
      const newRuns = new Map(state.activeRuns);
      const run = newRuns.get(runId);
      if (run) {
        const newNodes = new Map(run.nodes);
        const existingNode = newNodes.get(nodeId);
        newNodes.set(nodeId, {
          ...existingNode,
          ...status,
        } as WorkflowRunState['nodes'] extends Map<any, infer V> ? V : never);
        newRuns.set(runId, {
          ...run,
          nodes: newNodes,
          lastUpdate: new Date(),
        });
      }
      return { activeRuns: newRuns };
    }),

  addEvent: (runId, event) =>
    set((state) => {
      const newRuns = new Map(state.activeRuns);
      const run = newRuns.get(runId);
      if (run) {
        newRuns.set(runId, {
          ...run,
          events: [...run.events, event],
          lastUpdate: new Date(),
        });
      }
      return { activeRuns: newRuns };
    }),

  clearRun: (runId) =>
    set((state) => {
      const newRuns = new Map(state.activeRuns);
      newRuns.delete(runId);
      return { activeRuns: newRuns };
    }),

  // UI actions
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  toggleGraphExpanded: () => set((state) => ({ isGraphExpanded: !state.isGraphExpanded })),

  // Utilities
  getRun: (runId) => get().activeRuns.get(runId),
  getRunBySongId: (songId) => {
    const runs = Array.from(get().activeRuns.values());
    return runs.find((run) => run.songId === songId);
  },
  reset: () =>
    set({
      isConnected: false,
      connectionError: null,
      activeRuns: new Map(),
      selectedNodeId: null,
      isGraphExpanded: false,
    }),
}));
