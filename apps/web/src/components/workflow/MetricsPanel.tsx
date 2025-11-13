/**
 * MetricsPanel Component
 * Display workflow execution metrics and validation scores
 *
 * Shows:
 * - Total duration
 * - Validation score breakdown
 * - Fix iteration count
 * - Node status breakdown
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@meaty/ui/components/Badge';
import type { ValidationScores, WorkflowSummary } from '@/types/api';
import type { NodeExecutionResult } from '@/types/api';

export interface MetricsPanelProps {
  /** Workflow summary with all metrics */
  summary?: WorkflowSummary;
  /** Additional class name */
  className?: string;
}

/**
 * Format duration in milliseconds to human readable
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/**
 * Score progress bar with gradient based on value
 */
const ScoreBar: React.FC<{
  label: string;
  value: number;
  maxValue?: number;
  threshold?: number;
}> = ({ label, value, maxValue = 10, threshold = 7 }) => {
  const percentage = (value / maxValue) * 100;

  // Determine gradient based on score
  const getGradient = () => {
    if (value < 5) return 'from-accent-error to-accent-warning';
    if (value < threshold) return 'from-accent-warning to-accent-secondary';
    return 'from-accent-secondary to-accent-success';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-semibold text-text-primary">
          {value.toFixed(1)}/{maxValue}
        </span>
      </div>
      <div className="relative h-2 bg-background-tertiary rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500',
            getGradient()
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Node Status Breakdown Component
 */
const NodeBreakdown: React.FC<{
  completed: number;
  failed: number;
  pending: number;
  skipped: number;
}> = ({ completed, failed, pending, skipped }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-complete" />
        <span className="text-xs text-text-secondary">
          Complete: <span className="font-semibold text-text-primary">{completed}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-failed" />
        <span className="text-xs text-text-secondary">
          Failed: <span className="font-semibold text-text-primary">{failed}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-pending" />
        <span className="text-xs text-text-secondary">
          Pending: <span className="font-semibold text-text-primary">{pending}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-skipped" />
        <span className="text-xs text-text-secondary">
          Skipped: <span className="font-semibold text-text-primary">{skipped}</span>
        </span>
      </div>
    </div>
  );
};

/**
 * Main MetricsPanel Component
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  summary,
  className,
}) => {
  // Calculate node status breakdown
  const nodeBreakdown = React.useMemo(() => {
    if (!summary?.nodes_executed) {
      return { completed: 0, failed: 0, pending: 9, skipped: 0 };
    }

    const breakdown = {
      completed: 0,
      failed: 0,
      pending: 0,
      skipped: 0,
    };

    summary.nodes_executed.forEach((node: NodeExecutionResult) => {
      if (node.status === 'success') breakdown.completed++;
      else if (node.status === 'failed') breakdown.failed++;
      else if (node.status === 'skipped') breakdown.skipped++;
    });

    // Pending = total nodes (9) - executed nodes
    breakdown.pending = 9 - summary.nodes_executed.length;

    return breakdown;
  }, [summary]);

  // Extract validation scores
  const scores = summary?.validation_scores as ValidationScores | undefined;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Rubric Scores Section */}
      <div className="p-6 bg-background-secondary rounded-xl border border-border/10">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Rubric Scores</h3>

        {scores ? (
          <div className="space-y-4">
            <ScoreBar
              label="Hook Density"
              value={scores.hook_density}
            />
            <ScoreBar
              label="Singability"
              value={scores.singability}
            />
            <ScoreBar
              label="Rhyme Tightness"
              value={scores.rhyme_tightness}
            />
            <ScoreBar
              label="Section Completeness"
              value={scores.section_completeness}
            />
            <ScoreBar
              label="Profanity Score"
              value={scores.profanity_score}
            />

            {/* Overall Score */}
            <div className="pt-4 mt-4 border-t border-border/10">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-text-primary">Overall</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-2xl font-bold',
                    scores.passed ? 'text-accent-success' : 'text-accent-error'
                  )}>
                    {scores.total.toFixed(2)}/10
                  </span>
                  <Badge
                    variant={scores.passed ? 'default' : 'destructive'}
                    className={cn(
                      scores.passed
                        ? 'bg-accent-success/20 text-accent-success border-accent-success/30'
                        : 'bg-accent-error/20 text-accent-error border-accent-error/30'
                    )}
                  >
                    {scores.passed ? '✓ Pass' : '✗ Fail'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-text-tertiary text-sm">
            Validation scores will appear here once the VALIDATE node completes
          </div>
        )}
      </div>

      {/* Execution Metrics Section */}
      <div className="p-6 bg-background-secondary rounded-xl border border-border/10">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Execution Metrics</h3>

        <div className="space-y-4">
          {/* Total Duration */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">Total Duration</span>
            <span className="text-sm font-mono font-semibold text-text-primary">
              {summary?.duration_ms ? formatDuration(summary.duration_ms) : '--'}
            </span>
          </div>

          {/* Node Durations */}
          {summary?.nodes_executed && summary.nodes_executed.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/10">
              {summary.nodes_executed.map((node: NodeExecutionResult) => (
                <div
                  key={node.node}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-xs text-text-tertiary uppercase">{node.node}</span>
                  <span className="text-xs font-mono text-text-secondary">
                    {formatDuration(node.duration_ms)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Fix Iterations */}
          <div className="flex items-center justify-between py-2 border-t border-border/10">
            <span className="text-sm text-text-secondary">Fix Iterations</span>
            <span className="text-sm font-mono font-semibold text-text-primary">
              {summary?.fix_iterations?.length || 0} / 3
            </span>
          </div>

          {/* Seed */}
          {summary?.run_id && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Run ID</span>
              <span className="text-xs font-mono text-text-tertiary truncate max-w-[150px]">
                {summary.run_id.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Node Breakdown Section */}
      <div className="p-6 bg-background-secondary rounded-xl border border-border/10">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Node Status</h3>
        <NodeBreakdown {...nodeBreakdown} />
      </div>
    </div>
  );
};

MetricsPanel.displayName = 'MetricsPanel';
