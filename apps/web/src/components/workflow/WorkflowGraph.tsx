/**
 * WorkflowGraph Component
 * Workflow DAG visualization with real-time node status
 *
 * Displays the 9-node AMCS workflow: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER → REVIEW
 * With real-time status updates via WebSocket events.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@meatymusic/ui';
import { WorkflowNode } from '@/types/api';

export interface WorkflowNodeState {
  id: WorkflowNode;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
}

export interface WorkflowGraphProps {
  /** Workflow nodes with their current states */
  nodes: WorkflowNodeState[];
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Show metrics (duration, etc.) */
  showMetrics?: boolean;
  /** Callback when a node is clicked */
  onNodeClick?: (node: WorkflowNodeState) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Workflow node definitions
 */
const WORKFLOW_NODES = [
  WorkflowNode.PLAN,
  WorkflowNode.STYLE,
  WorkflowNode.LYRICS,
  WorkflowNode.PRODUCER,
  WorkflowNode.COMPOSE,
  WorkflowNode.VALIDATE,
  WorkflowNode.FIX,
  WorkflowNode.RENDER,
  WorkflowNode.REVIEW,
] as const;

/**
 * Node status colors and icons
 */
const getNodeStyles = (status: WorkflowNodeState['status']) => {
  switch (status) {
    case 'pending':
      return {
        border: 'border-status-pending',
        bg: 'bg-background-tertiary/50',
        icon: '○',
        iconColor: 'text-status-pending',
      };
    case 'running':
      return {
        border: 'border-status-running animate-pulse',
        bg: 'bg-status-running/10',
        icon: '⟳',
        iconColor: 'text-status-running animate-spin',
      };
    case 'success':
      return {
        border: 'border-status-complete',
        bg: 'bg-status-complete/10',
        icon: '✓',
        iconColor: 'text-status-complete',
      };
    case 'failed':
      return {
        border: 'border-status-failed',
        bg: 'bg-status-failed/10',
        icon: '✗',
        iconColor: 'text-status-failed',
      };
    case 'skipped':
      return {
        border: 'border-status-skipped',
        bg: 'bg-status-skipped/10',
        icon: '→',
        iconColor: 'text-status-skipped',
      };
  }
};

/**
 * Individual Workflow Node
 */
const WorkflowNodeComponent: React.FC<{
  node: WorkflowNodeState;
  showMetrics?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ node, showMetrics, onClick, className }) => {
  const styles = getNodeStyles(node.status);
  const isInteractive = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isInteractive}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-28 h-20 rounded-lg border-2',
        'transition-all duration-200',
        styles.border,
        styles.bg,
        isInteractive && 'hover:shadow-lg hover:scale-105 cursor-pointer',
        !isInteractive && 'cursor-default',
        className
      )}
      aria-label={`${node.id} - ${node.status}`}
    >
      {/* Status Icon */}
      <div className={cn('text-2xl mb-1', styles.iconColor)}>
        {styles.icon}
      </div>

      {/* Node Name */}
      <div className="text-xs font-semibold text-text-primary uppercase">
        {node.id}
      </div>

      {/* Duration (if completed and showMetrics) */}
      {showMetrics && node.durationMs && node.status === 'success' && (
        <div className="text-[10px] text-text-tertiary mt-1">
          {(node.durationMs / 1000).toFixed(1)}s
        </div>
      )}

      {/* Error indicator */}
      {node.status === 'failed' && node.error && (
        <div className="absolute -top-1 -right-1">
          <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">
            !
          </Badge>
        </div>
      )}
    </button>
  );
};

/**
 * Connection Line between nodes
 */
const ConnectionLine: React.FC<{
  status: 'pending' | 'active' | 'complete';
  orientation: 'horizontal' | 'vertical';
  className?: string;
}> = ({ status, orientation, className }) => {
  const lineColors = {
    pending: 'bg-border/20',
    active: 'bg-status-running',
    complete: 'bg-status-complete',
  };

  const lineClass = orientation === 'horizontal'
    ? 'h-0.5 w-8'
    : 'w-0.5 h-8';

  return (
    <div
      className={cn(
        'transition-colors duration-300',
        lineClass,
        lineColors[status],
        status === 'pending' && 'border-dashed',
        className
      )}
    />
  );
};

/**
 * Main WorkflowGraph Component
 */
export const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  nodes,
  orientation = 'horizontal',
  showMetrics = false,
  onNodeClick,
  className,
}) => {
  // Create node state map for quick lookup
  const nodeStateMap = React.useMemo(() => {
    const map = new Map<WorkflowNode, WorkflowNodeState>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Get node state or create default pending state
  const getNodeState = (nodeId: WorkflowNode): WorkflowNodeState => {
    return nodeStateMap.get(nodeId) || {
      id: nodeId,
      status: 'pending',
    };
  };

  // Determine connection line status
  const getConnectionStatus = (fromIndex: number): 'pending' | 'active' | 'complete' => {
    const fromNode = getNodeState(WORKFLOW_NODES[fromIndex]);
    const toNode = getNodeState(WORKFLOW_NODES[fromIndex + 1]);

    if (fromNode.status === 'success') {
      if (toNode.status === 'running') return 'active';
      if (toNode.status === 'success' || toNode.status === 'failed') return 'complete';
    }
    return 'pending';
  };

  const containerClass = orientation === 'horizontal'
    ? 'flex items-center gap-2'
    : 'flex flex-col items-center gap-2';

  return (
    <div className={cn('p-6 bg-background-secondary rounded-xl border border-border/10', className)}>
      {/* Workflow Title */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-1">Workflow Progress</h3>
        <p className="text-sm text-text-secondary">
          Track the execution of your song workflow in real-time
        </p>
      </div>

      {/* Workflow DAG */}
      <div className={cn('overflow-x-auto pb-4', containerClass)}>
        {WORKFLOW_NODES.map((nodeId, index) => {
          const nodeState = getNodeState(nodeId);
          const isLastNode = index === WORKFLOW_NODES.length - 1;

          return (
            <React.Fragment key={nodeId}>
              {/* Node */}
              <WorkflowNodeComponent
                node={nodeState}
                showMetrics={showMetrics}
                onClick={() => onNodeClick?.(nodeState)}
              />

              {/* Connection Line (not for last node) */}
              {!isLastNode && (
                <ConnectionLine
                  status={getConnectionStatus(index)}
                  orientation={orientation}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/10">
        <div className="flex items-center gap-4 text-xs text-text-tertiary flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-status-pending">○</span>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-status-running">⟳</span>
            <span>Running</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-status-complete">✓</span>
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-status-failed">✗</span>
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-status-skipped">→</span>
            <span>Skipped</span>
          </div>
        </div>
      </div>
    </div>
  );
};

WorkflowGraph.displayName = 'WorkflowGraph';
