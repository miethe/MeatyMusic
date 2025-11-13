/**
 * WorkflowHeader Component
 * Dashboard header with song info, status, and actions
 *
 * Shows:
 * - Song title and metadata
 * - Workflow status badge
 * - Action buttons (download, retry, view song)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { WorkflowRunStatus, type Song } from '@/types/api';

export interface WorkflowHeaderProps {
  /** Song information */
  song: Song;
  /** Current workflow status */
  status: WorkflowRunStatus;
  /** Workflow run ID */
  runId: string;
  /** Callback to download artifacts */
  onDownloadArtifacts?: () => void;
  /** Callback to retry workflow */
  onRetryWorkflow?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Status badge configuration
 */
const getStatusConfig = (status: WorkflowRunStatus) => {
  switch (status) {
    case WorkflowRunStatus.RUNNING:
      return {
        label: 'Running',
        icon: '⟳',
        variant: 'default' as const,
        className: 'bg-status-running/20 text-status-running border-status-running/30 animate-pulse',
      };
    case WorkflowRunStatus.COMPLETED:
      return {
        label: 'Complete',
        icon: '✓',
        variant: 'default' as const,
        className: 'bg-status-complete/20 text-status-complete border-status-complete/30',
      };
    case WorkflowRunStatus.FAILED:
      return {
        label: 'Failed',
        icon: '✗',
        variant: 'destructive' as const,
        className: 'bg-status-failed/20 text-status-failed border-status-failed/30',
      };
    case WorkflowRunStatus.CANCELLED:
      return {
        label: 'Cancelled',
        icon: '○',
        variant: 'outline' as const,
        className: 'bg-status-skipped/20 text-status-skipped border-status-skipped/30',
      };
  }
};

/**
 * Main WorkflowHeader Component
 */
export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  song,
  status,
  runId,
  onDownloadArtifacts,
  onRetryWorkflow,
  className,
}) => {
  const router = useRouter();
  const statusConfig = getStatusConfig(status);

  return (
    <div className={cn('p-6 bg-background-secondary rounded-xl border border-border/10', className)}>
      {/* Top Row: Title and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text-primary truncate mb-2">
            {song.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Run ID */}
            <span className="text-xs text-text-tertiary font-mono">
              Run: {runId.slice(0, 8)}...
            </span>
            {/* Created Date */}
            <span className="text-xs text-text-tertiary">
              Started: {new Date(song.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <Badge
          variant={statusConfig.variant}
          className={cn('ml-4', statusConfig.className)}
        >
          <span className="mr-1.5">{statusConfig.icon}</span>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View Song Details */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/songs/${song.id}`)}
        >
          <span className="mr-1.5">📋</span>
          View Song
        </Button>

        {/* Download Artifacts (only if complete) */}
        {status === WorkflowRunStatus.COMPLETED && onDownloadArtifacts && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDownloadArtifacts}
          >
            <span className="mr-1.5">⬇️</span>
            Download Artifacts
          </Button>
        )}

        {/* Retry Workflow (only if failed or cancelled) */}
        {(status === WorkflowRunStatus.FAILED || status === WorkflowRunStatus.CANCELLED) && onRetryWorkflow && (
          <Button
            size="sm"
            variant="default"
            onClick={onRetryWorkflow}
          >
            <span className="mr-1.5">🔄</span>
            Retry Workflow
          </Button>
        )}

        {/* Share (future feature - placeholder) */}
        <Button
          size="sm"
          variant="ghost"
          disabled
          title="Coming soon"
        >
          <span className="mr-1.5">🔗</span>
          Share
        </Button>
      </div>

      {/* Song Metadata (if available) */}
      {song.extra_metadata && (
        <div className="mt-4 pt-4 border-t border-border/10">
          <div className="flex items-center gap-4 flex-wrap text-xs text-text-tertiary">
            {/* Global Seed */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Seed:</span>
              <span className="font-mono text-text-secondary">{song.global_seed}</span>
            </div>

            {/* SDS Version */}
            {song.sds_version && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">SDS Version:</span>
                <span className="text-text-secondary">{song.sds_version}</span>
              </div>
            )}

            {/* Blueprint ID */}
            {song.blueprint_id && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Blueprint:</span>
                <span className="font-mono text-text-secondary">
                  {song.blueprint_id.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

WorkflowHeader.displayName = 'WorkflowHeader';
