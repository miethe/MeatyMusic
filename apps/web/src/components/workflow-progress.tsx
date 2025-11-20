/**
 * WorkflowProgress Component
 * Compact progress bar showing workflow execution status
 *
 * Features:
 * - Current node indicator (e.g., "3/9 - LYRICS")
 * - Visual progress bar with percentage
 * - Color coding: completed (green), in-progress (blue), pending (gray), failed (red)
 * - Estimated time remaining
 * - Real-time updates via WebSocket
 *
 * P1.3 - Workflow Visualization
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@meatymusic/ui';
import { WorkflowNode, WorkflowRunStatus } from '@/types/api';
import type { WorkflowProgress as WorkflowProgressType } from '@/types/api';

export interface WorkflowProgressProps {
  /** Workflow progress data */
  progress?: WorkflowProgressType;
  /** Current workflow status */
  status?: WorkflowRunStatus;
  /** Current node being executed */
  currentNode?: WorkflowNode;
  /** Number of completed nodes */
  completedNodes?: number;
  /** Total number of nodes */
  totalNodes?: number;
  /** Estimated completion time */
  estimatedCompletion?: Date | string;
  /** Additional class name */
  className?: string;
}

/**
 * Calculate estimated time remaining
 */
const getTimeRemaining = (estimatedCompletion?: Date | string): string | null => {
  if (!estimatedCompletion) return null;

  const completion = typeof estimatedCompletion === 'string'
    ? new Date(estimatedCompletion)
    : estimatedCompletion;

  const now = new Date();
  const diff = completion.getTime() - now.getTime();

  if (diff <= 0) return 'Completing...';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `~${minutes}m ${remainingSeconds}s remaining`;
  }

  return `~${seconds}s remaining`;
};

/**
 * Get status-based color classes
 */
const getStatusColors = (status?: WorkflowRunStatus, hasFailedNodes?: boolean) => {
  if (hasFailedNodes || status === WorkflowRunStatus.FAILED) {
    return {
      text: 'text-accent-error',
      bg: 'bg-accent-error',
      border: 'border-accent-error',
    };
  }

  if (status === WorkflowRunStatus.COMPLETED) {
    return {
      text: 'text-accent-success',
      bg: 'bg-accent-success',
      border: 'border-accent-success',
    };
  }

  if (status === WorkflowRunStatus.RUNNING) {
    return {
      text: 'text-accent-secondary',
      bg: 'bg-accent-secondary',
      border: 'border-accent-secondary',
    };
  }

  return {
    text: 'text-text-tertiary',
    bg: 'bg-background-tertiary',
    border: 'border-border',
  };
};

/**
 * WorkflowProgress Component
 *
 * Displays a compact progress bar showing the current state of workflow execution.
 *
 * @example
 * ```tsx
 * <WorkflowProgress
 *   status={WorkflowRunStatus.RUNNING}
 *   currentNode={WorkflowNode.LYRICS}
 *   completedNodes={3}
 *   totalNodes={9}
 *   estimatedCompletion={new Date(Date.now() + 30000)}
 * />
 * ```
 */
export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  progress,
  status,
  currentNode,
  completedNodes,
  totalNodes = 9,
  estimatedCompletion,
  className,
}) => {
  // Use progress object if provided, otherwise use individual props
  const effectiveStatus = progress?.status || status;
  const effectiveCurrentNode = progress?.current_node || currentNode;
  const effectiveCompleted = progress?.completed_nodes.length || completedNodes || 0;
  const effectiveTotal = progress?.total_nodes || totalNodes;
  const effectiveEstimated = progress?.estimated_completion || estimatedCompletion;
  const hasFailedNodes = progress?.failed_nodes && progress.failed_nodes.length > 0;

  // Calculate progress percentage
  const progressPercentage = progress?.progress_percentage || (effectiveCompleted / effectiveTotal) * 100;

  // Get status colors
  const colors = getStatusColors(effectiveStatus, hasFailedNodes);

  // Get time remaining
  const timeRemaining = getTimeRemaining(effectiveEstimated);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with node info and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-text-primary">
              {effectiveCompleted}/{effectiveTotal}
            </span>
            {effectiveCurrentNode && (
              <>
                <span className="text-text-tertiary">-</span>
                <span className={cn('text-sm font-semibold uppercase', colors.text)}>
                  {effectiveCurrentNode}
                </span>
              </>
            )}
          </div>

          {/* Status Badge */}
          {effectiveStatus && (
            <div className={cn(
              'px-2 py-0.5 rounded-md text-xs font-medium border',
              colors.border,
              colors.text,
              'bg-opacity-10'
            )}>
              {effectiveStatus}
            </div>
          )}
        </div>

        {/* Progress Percentage */}
        <span className="text-sm font-semibold text-text-secondary">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 w-full bg-background-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              colors.bg,
              effectiveStatus === WorkflowRunStatus.RUNNING && 'animate-pulse'
            )}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Time Remaining */}
      {timeRemaining && effectiveStatus === WorkflowRunStatus.RUNNING && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-text-tertiary">
            {timeRemaining}
          </span>
        </div>
      )}

      {/* Completion Message */}
      {effectiveStatus === WorkflowRunStatus.COMPLETED && (
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-accent-success">
            ✓ Workflow completed successfully
          </span>
        </div>
      )}

      {/* Error Message */}
      {(effectiveStatus === WorkflowRunStatus.FAILED || hasFailedNodes) && (
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-accent-error">
            ✗ Workflow failed
          </span>
        </div>
      )}
    </div>
  );
};

WorkflowProgress.displayName = 'WorkflowProgress';
