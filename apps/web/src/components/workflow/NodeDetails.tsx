/**
 * NodeDetails Component
 * Individual workflow node execution details
 *
 * Displays node inputs, outputs, duration, and error information.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@meaty/ui/components/Badge';
import { Tabs } from '@meaty/ui/components/Tabs';
import type { WorkflowNodeState } from './WorkflowGraph';

export interface NodeDetailsProps {
  /** Node state */
  node: WorkflowNodeState;
  /** Node inputs (JSON) */
  inputs?: Record<string, unknown>;
  /** Node outputs/artifacts (JSON) */
  outputs?: Record<string, unknown>;
  /** Execution logs */
  logs?: string[];
  /** Additional class name */
  className?: string;
}

/**
 * JSON Viewer Component
 */
const JSONViewer: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  return (
    <pre className="p-4 bg-background-tertiary rounded-lg overflow-auto max-h-96 text-xs text-text-primary font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

/**
 * Logs Viewer Component
 */
const LogsViewer: React.FC<{ logs: string[] }> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="p-4 text-sm text-text-tertiary text-center">
        No logs available
      </div>
    );
  }

  return (
    <div className="p-4 bg-background-tertiary rounded-lg overflow-auto max-h-96 space-y-1">
      {logs.map((log, index) => (
        <div key={index} className="text-xs text-text-secondary font-mono">
          {log}
        </div>
      ))}
    </div>
  );
};

/**
 * Node Header Component
 */
const NodeDetailsHeader: React.FC<{
  node: WorkflowNodeState;
}> = ({ node }) => {
  const getStatusBadge = () => {
    const statusConfig = {
      pending: { icon: '○', label: 'Pending', className: 'bg-status-pending/20 text-status-pending border-status-pending/30' },
      running: { icon: '⟳', label: 'Running', className: 'bg-status-running/20 text-status-running border-status-running/30' },
      success: { icon: '✓', label: 'Success', className: 'bg-status-complete/20 text-status-complete border-status-complete/30' },
      failed: { icon: '✗', label: 'Failed', className: 'bg-status-failed/20 text-status-failed border-status-failed/30' },
      skipped: { icon: '→', label: 'Skipped', className: 'bg-status-skipped/20 text-status-skipped border-status-skipped/30' },
    };

    const config = statusConfig[node.status];
    return (
      <Badge className={cn('font-medium', config.className)}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="border-b border-border/10 pb-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-text-primary uppercase">
          {node.id}
        </h3>
        {getStatusBadge()}
      </div>

      {/* Execution Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {node.startedAt && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Started At</div>
            <div className="text-text-secondary">{formatTimestamp(node.startedAt)}</div>
          </div>
        )}
        {node.completedAt && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Completed At</div>
            <div className="text-text-secondary">{formatTimestamp(node.completedAt)}</div>
          </div>
        )}
        {node.durationMs !== undefined && (
          <div>
            <div className="text-xs text-text-tertiary mb-1">Duration</div>
            <div className="text-text-secondary">{(node.durationMs / 1000).toFixed(2)}s</div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {node.status === 'failed' && node.error && (
        <div className="mt-4 p-3 bg-status-failed/10 border border-status-failed/20 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-status-failed text-lg">✗</span>
            <div>
              <div className="text-sm font-medium text-status-failed mb-1">Error</div>
              <div className="text-xs text-text-secondary">{node.error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main NodeDetails Component
 */
export const NodeDetails: React.FC<NodeDetailsProps> = ({
  node,
  inputs,
  outputs,
  logs = [],
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState('outputs');

  const hasInputs = inputs && Object.keys(inputs).length > 0;
  const hasOutputs = outputs && Object.keys(outputs).length > 0;
  const hasLogs = logs.length > 0;

  return (
    <div className={cn('p-6 bg-background-secondary rounded-xl border border-border/10', className)}>
      <NodeDetailsHeader node={node} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex gap-2 border-b border-border/10 mb-4">
          {hasOutputs && (
            <button
              onClick={() => setActiveTab('outputs')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'outputs'
                  ? 'text-accent-primary border-b-2 border-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Outputs
            </button>
          )}
          {hasInputs && (
            <button
              onClick={() => setActiveTab('inputs')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'inputs'
                  ? 'text-accent-primary border-b-2 border-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Inputs
            </button>
          )}
          {hasLogs && (
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'logs'
                  ? 'text-accent-primary border-b-2 border-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Logs
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'outputs' && (
            hasOutputs ? (
              <JSONViewer data={outputs!} />
            ) : (
              <div className="p-4 text-sm text-text-tertiary text-center">
                No outputs available
              </div>
            )
          )}

          {activeTab === 'inputs' && (
            hasInputs ? (
              <JSONViewer data={inputs!} />
            ) : (
              <div className="p-4 text-sm text-text-tertiary text-center">
                No inputs available
              </div>
            )
          )}

          {activeTab === 'logs' && <LogsViewer logs={logs} />}
        </div>
      </Tabs>
    </div>
  );
};

NodeDetails.displayName = 'NodeDetails';
