/**
 * useWorkflowProgress Hook
 * Track workflow execution progress by deriving state from events
 *
 * Features:
 * - Current executing node tracking
 * - Completed/failed/in-progress node lists
 * - Progress percentage calculation
 * - Real-time score aggregation
 * - Issues tracking
 * - Memoized calculations for performance
 *
 * Phase 2, Task 2.2
 */

import { useMemo } from 'react';
import { useWorkflowEvents } from './useWorkflowEvents';
import type { WorkflowEvent } from '@/types/api/events';
import { WorkflowNode } from '@/types/api';

/**
 * Validation issue from events
 */
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
  field?: string;
  node?: WorkflowNode;
  timestamp?: string;
}

/**
 * Progress state return value
 */
export interface WorkflowProgress {
  /** Currently executing node (null if none or workflow complete) */
  currentNode: WorkflowNode | null;
  /** List of completed nodes */
  nodesCompleted: WorkflowNode[];
  /** List of failed nodes */
  nodesFailed: WorkflowNode[];
  /** List of in-progress nodes */
  nodesInProgress: WorkflowNode[];
  /** Progress percentage (0-100) */
  progressPercentage: number;
  /** Aggregated scores from VALIDATE events */
  scores: Record<string, number>;
  /** Accumulated issues from all events */
  issues: ValidationIssue[];
  /** Total number of workflow nodes */
  totalNodes: number;
  /** Is workflow currently running */
  isRunning: boolean;
  /** Is workflow completed successfully */
  isComplete: boolean;
  /** Is workflow failed */
  isFailed: boolean;
}

/**
 * All workflow nodes in execution order
 */
const ALL_WORKFLOW_NODES: WorkflowNode[] = [
  WorkflowNode.PLAN,
  WorkflowNode.STYLE,
  WorkflowNode.LYRICS,
  WorkflowNode.PRODUCER,
  WorkflowNode.COMPOSE,
  WorkflowNode.VALIDATE,
  WorkflowNode.FIX,
  WorkflowNode.RENDER,
  WorkflowNode.REVIEW,
];

/**
 * Derive workflow progress from events
 *
 * Processes workflow events to compute real-time progress state including:
 * - Which nodes are completed, failed, or in progress
 * - Current executing node
 * - Overall progress percentage
 * - Validation scores and issues
 *
 * @example
 * ```tsx
 * const progress = useWorkflowProgress('run-123');
 *
 * return (
 *   <div>
 *     <ProgressBar percentage={progress.progressPercentage} />
 *     <NodeStatus
 *       current={progress.currentNode}
 *       completed={progress.nodesCompleted}
 *       failed={progress.nodesFailed}
 *     />
 *     {progress.scores.total && (
 *       <ScoreCard scores={progress.scores} />
 *     )}
 *     {progress.issues.length > 0 && (
 *       <IssueList issues={progress.issues} />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useWorkflowProgress(runId: string): WorkflowProgress {
  const { events } = useWorkflowEvents(runId);

  /**
   * Derive progress state from events
   * Memoized to prevent recalculation on every render
   */
  const progress = useMemo<WorkflowProgress>(() => {
    // Track node states
    const nodeStates = new Map<
      WorkflowNode,
      'pending' | 'running' | 'completed' | 'failed'
    >();

    // Initialize all nodes as pending
    ALL_WORKFLOW_NODES.forEach((node) => {
      nodeStates.set(node, 'pending');
    });

    // Track current node
    let currentNode: WorkflowNode | null = null;

    // Track run-level state
    let isRunning = false;
    let isComplete = false;
    let isFailed = false;

    // Aggregate scores (from VALIDATE events)
    const scores: Record<string, number> = {};

    // Accumulate issues
    const issues: ValidationIssue[] = [];

    // Process events in chronological order
    for (const event of events) {
      const { node_name, phase, data, issues: eventIssues, timestamp } = event;

      // Run-level events
      if (!node_name) {
        if (phase === 'start') {
          isRunning = true;
        } else if (phase === 'end') {
          isRunning = false;
          isComplete = true;
        } else if (phase === 'fail') {
          isRunning = false;
          isFailed = true;
        }
        continue;
      }

      // Node-level events
      const nodeName = node_name as WorkflowNode;

      if (phase === 'start') {
        nodeStates.set(nodeName, 'running');
        currentNode = nodeName;
      } else if (phase === 'end') {
        nodeStates.set(nodeName, 'completed');

        // Extract scores from VALIDATE node
        if (nodeName === WorkflowNode.VALIDATE && data.scores) {
          Object.assign(scores, data.scores);
        }

        // If this was the current node, clear it
        if (currentNode === nodeName) {
          currentNode = null;
        }
      } else if (phase === 'fail') {
        nodeStates.set(nodeName, 'failed');

        // If this was the current node, clear it
        if (currentNode === nodeName) {
          currentNode = null;
        }
      }

      // Accumulate issues from event
      if (eventIssues && Array.isArray(eventIssues)) {
        issues.push(
          ...eventIssues.map((issue) => ({
            ...issue,
            node: nodeName,
            timestamp,
          }))
        );
      }
    }

    // Build node lists by state
    const nodesCompleted: WorkflowNode[] = [];
    const nodesFailed: WorkflowNode[] = [];
    const nodesInProgress: WorkflowNode[] = [];

    for (const [node, state] of nodeStates.entries()) {
      if (state === 'completed') {
        nodesCompleted.push(node);
      } else if (state === 'failed') {
        nodesFailed.push(node);
      } else if (state === 'running') {
        nodesInProgress.push(node);
      }
    }

    // Calculate progress percentage
    // Progress = (completed + failed) / total * 100
    const totalNodes = ALL_WORKFLOW_NODES.length;
    const completedOrFailed = nodesCompleted.length + nodesFailed.length;
    const progressPercentage = Math.round((completedOrFailed / totalNodes) * 100);

    return {
      currentNode,
      nodesCompleted,
      nodesFailed,
      nodesInProgress,
      progressPercentage,
      scores,
      issues,
      totalNodes,
      isRunning,
      isComplete,
      isFailed,
    };
  }, [events]);

  return progress;
}
