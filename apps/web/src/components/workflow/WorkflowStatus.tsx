/**
 * WorkflowStatus Component
 * Real-time workflow status display with node states
 *
 * Shows current workflow execution state, progress, and key metrics.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@meaty/ui/components/Badge';
import { Progress } from '@meaty/ui/components/Progress';
import type { WorkflowRunStatus } from '@/types/api';
import type { WorkflowNodeState } from './WorkflowGraph';

export interface WorkflowStatusProps {
  /** Overall workflow status */
  status: WorkflowRunStatus;
  /** Current node being executed */
  currentNode?: string;
  /** Workflow progress (0-100) */
  progress?: number;
  /** Total duration in milliseconds */
  durationMs?: number;
  /** Number of fix iterations */
  fixAttempts?: number;
  /** Validation scores */
  scores?: Record<string, number>;
  /** Additional class name */
  className?: string;
}

/**
 * Status badge with icon and color
 */
const StatusBadge: React.FC<{ status: WorkflowRunStatus }> = ({ status }) => {
  const statusConfig = {
    queued: {
      icon: '●',
      label: 'Queued',
      className: 'bg-status-pending/20 text-status-pending border-status-pending/30',
    },
    running: {
      icon: '⟳',
      label: 'Running',
      className: 'bg-status-running/20 text-status-running border-status-running/30 animate-pulse',
    },
    success: {
      icon: '✓',
      label: 'Success',
      className: 'bg-status-complete/20 text-status-complete border-status-complete/30',
    },
    failed: {
      icon: '✗',
      label: 'Failed',
      className: 'bg-status-failed/20 text-status-failed border-status-failed/30',
    },
    cancelled: {
      icon: '○',
      label: 'Cancelled',
      className: 'bg-status-skipped/20 text-status-skipped border-status-skipped/30',
    },
  };

  const config = statusConfig[status] || statusConfig.queued;

  return (
    <Badge className={cn('font-medium', config.className)}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
};

/**
 * Main WorkflowStatus Component
 */
export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({
  status,
  currentNode,
  progress = 0,
  durationMs,
  fixAttempts = 0,
  scores,
  className,
}) => {
  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Calculate overall score
  const overallScore = scores
    ? Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
    : null;

  const isRunning = status === 'running';
  const isComplete = status === 'success';
  const isFailed = status === 'failed';

  return (
    <div className={cn('p-6 bg-background-secondary rounded-xl border border-border/10', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Workflow Status</h3>
        <StatusBadge status={status} />
      </div>

      {/* Progress Bar (if running) */}
      {isRunning && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              {currentNode ? `Running: ${currentNode}` : 'Initializing...'}
            </span>
            <span className="text-sm text-text-tertiary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Duration */}
        {durationMs !== undefined && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Duration</div>
            <div className="text-sm font-semibold text-text-primary">
              {formatDuration(durationMs)}
            </div>
          </div>
        )}

        {/* Current Node */}
        {currentNode && isRunning && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Current Node</div>
            <div className="text-sm font-semibold text-text-primary uppercase">
              {currentNode}
            </div>
          </div>
        )}

        {/* Fix Attempts */}
        {fixAttempts > 0 && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Fix Iterations</div>
            <div className="text-sm font-semibold text-text-primary">
              {fixAttempts}
            </div>
          </div>
        )}

        {/* Overall Score */}
        {overallScore !== null && isComplete && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Overall Score</div>
            <div className={cn(
              'text-sm font-semibold',
              overallScore >= 0.8 ? 'text-status-complete' : overallScore >= 0.6 ? 'text-status-running' : 'text-status-failed'
            )}>
              {(overallScore * 10).toFixed(1)}/10
            </div>
          </div>
        )}
      </div>

      {/* Validation Scores (if complete) */}
      {scores && isComplete && (
        <div className="mt-4 pt-4 border-t border-border/10">
          <div className="text-xs text-text-tertiary mb-3">Validation Scores</div>
          <div className="space-y-2">
            {Object.entries(scores).map(([key, score]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-text-secondary capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        score >= 0.8 ? 'bg-status-complete' : score >= 0.6 ? 'bg-status-running' : 'bg-status-failed'
                      )}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-primary font-medium w-12 text-right">
                    {(score * 10).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message (if failed) */}
      {isFailed && (
        <div className="mt-4 p-3 bg-status-failed/10 border border-status-failed/20 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-status-failed text-lg">✗</span>
            <div>
              <div className="text-sm font-medium text-status-failed mb-1">Workflow Failed</div>
              <div className="text-xs text-text-secondary">
                Check the node details below for error information
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

WorkflowStatus.displayName = 'WorkflowStatus';
