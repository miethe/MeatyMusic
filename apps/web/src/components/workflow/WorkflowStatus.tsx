/**
 * WorkflowStatus Component
 * Real-time workflow status display with node states
 *
 * Shows current workflow execution state, progress, and key metrics.
 * Enhanced with real-time WebSocket updates via useWorkflowProgress hook.
 *
 * Phase 3, Task 3.1
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge, Progress, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@meatymusic/ui';
import { WorkflowRunStatus } from '@/types/api';
import { useWorkflowProgress } from '@/hooks/useWorkflowProgress';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { WorkflowEventLog } from './WorkflowEventLog';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface WorkflowStatusProps {
  /** Run ID for real-time subscription (NEW: required for real-time updates) */
  runId: string;
  /** Overall workflow status (optional: falls back to real-time data) */
  status?: WorkflowRunStatus;
  /** Current node being executed (optional: falls back to real-time data) */
  currentNode?: string;
  /** Workflow progress 0-100 (optional: falls back to real-time data) */
  progress?: number;
  /** Total duration in milliseconds (optional: calculated from events) */
  durationMs?: number;
  /** Number of fix iterations (optional: from real-time data) */
  fixAttempts?: number;
  /** Validation scores (optional: from real-time data) */
  scores?: Record<string, number>;
  /** Show event log panel (default: false) */
  showEventLog?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Status badge with icon and color
 */
const StatusBadge: React.FC<{ status: WorkflowRunStatus }> = ({ status }) => {
  const statusConfig: Record<WorkflowRunStatus, { icon: string; label: string; className: string }> = {
    [WorkflowRunStatus.RUNNING]: {
      icon: '⟳',
      label: 'Running',
      className: 'bg-status-running/20 text-status-running border-status-running/30 animate-pulse',
    },
    [WorkflowRunStatus.COMPLETED]: {
      icon: '✓',
      label: 'Success',
      className: 'bg-status-complete/20 text-status-complete border-status-complete/30',
    },
    [WorkflowRunStatus.FAILED]: {
      icon: '✗',
      label: 'Failed',
      className: 'bg-status-failed/20 text-status-failed border-status-failed/30',
    },
    [WorkflowRunStatus.CANCELLED]: {
      icon: '○',
      label: 'Cancelled',
      className: 'bg-status-skipped/20 text-status-skipped border-status-skipped/30',
    },
  };

  const config = statusConfig[status] || statusConfig[WorkflowRunStatus.RUNNING];

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
  runId,
  status: statusProp,
  currentNode: currentNodeProp,
  progress: progressProp,
  durationMs: durationMsProp,
  fixAttempts: fixAttemptsProp,
  scores: scoresProp,
  showEventLog = false,
  className,
}) => {
  // Get real-time progress data
  const realtimeProgress = useWorkflowProgress(runId);
  const { events } = useWorkflowEvents(runId);
  const [isEventLogOpen, setIsEventLogOpen] = React.useState(false);

  // Merge props with real-time data (props take precedence for backward compatibility)
  const status = statusProp ?? (realtimeProgress.isComplete
    ? WorkflowRunStatus.COMPLETED
    : realtimeProgress.isFailed
    ? WorkflowRunStatus.FAILED
    : realtimeProgress.isRunning
    ? WorkflowRunStatus.RUNNING
    : WorkflowRunStatus.RUNNING);

  const currentNode = currentNodeProp ?? realtimeProgress.currentNode?.toString();
  const progress = progressProp ?? realtimeProgress.progressPercentage;
  const scores = scoresProp ?? realtimeProgress.scores;

  // Calculate duration from events
  const durationMs = React.useMemo(() => {
    if (durationMsProp !== undefined) return durationMsProp;

    if (events.length === 0) return undefined;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    if (!firstEvent || !lastEvent) return undefined;

    const start = new Date(firstEvent.timestamp).getTime();
    const end = new Date(lastEvent.timestamp).getTime();

    return end - start;
  }, [durationMsProp, events]);

  // Count fix iterations from events
  const fixAttempts = React.useMemo(() => {
    if (fixAttemptsProp !== undefined) return fixAttemptsProp;

    return events.filter((e) => e.node_name === 'FIX' && e.phase === 'end').length;
  }, [fixAttemptsProp, events]);

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

  const isRunning = status === WorkflowRunStatus.RUNNING;
  const isComplete = status === WorkflowRunStatus.COMPLETED;
  const isFailed = status === WorkflowRunStatus.FAILED;

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
                {realtimeProgress.issues.length > 0
                  ? `${realtimeProgress.issues.length} issue${realtimeProgress.issues.length === 1 ? '' : 's'} detected`
                  : 'Check the event log below for error information'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Log (collapsible) */}
      {showEventLog && (
        <div className="mt-4 pt-4 border-t border-border/10">
          <Collapsible open={isEventLogOpen} onOpenChange={setIsEventLogOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-between w-full text-sm font-semibold text-text-primary hover:text-text-strong transition-colors"
                aria-label={isEventLogOpen ? 'Collapse event log' : 'Expand event log'}
              >
                <span>Event Log ({events.length})</span>
                {isEventLogOpen ? (
                  <ChevronDown className="h-4 w-4 text-text-tertiary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <WorkflowEventLog
                runId={runId}
                maxEvents={100}
                showFilters={true}
                autoScroll={true}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};

WorkflowStatus.displayName = 'WorkflowStatus';
