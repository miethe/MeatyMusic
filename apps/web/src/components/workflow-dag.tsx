/**
 * WorkflowDAG Component
 * Visual DAG (Directed Acyclic Graph) for workflow nodes
 *
 * Features:
 * - Nodes: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER → REVIEW
 * - Color-coded status indicators
 * - Clickable nodes to view details
 * - Horizontal and vertical layouts
 * - Real-time updates via WebSocket
 *
 * P1.3 - Workflow Visualization
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { WorkflowNode } from '@/types/api';

export interface WorkflowNodeStatus {
  id: WorkflowNode;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
}

export interface WorkflowDAGProps {
  /** Workflow nodes with their current states */
  nodes: WorkflowNodeStatus[];
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Show node metrics (duration, etc.) */
  showMetrics?: boolean;
  /** Callback when a node is clicked */
  onNodeClick?: (node: WorkflowNodeStatus) => void;
  /** Additional class name */
  className?: string;
  /** Compact mode (smaller nodes) */
  compact?: boolean;
}

/**
 * All workflow nodes in execution order
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
 * Get node style based on status
 */
const getNodeStyle = (status: WorkflowNodeStatus['status']) => {
  switch (status) {
    case 'pending':
      return {
        border: 'border-status-pending',
        bg: 'bg-background-tertiary/30',
        text: 'text-status-pending',
        icon: '○',
      };
    case 'running':
      return {
        border: 'border-status-running',
        bg: 'bg-status-running/10',
        text: 'text-status-running',
        icon: '⟳',
      };
    case 'success':
      return {
        border: 'border-status-complete',
        bg: 'bg-status-complete/10',
        text: 'text-status-complete',
        icon: '✓',
      };
    case 'failed':
      return {
        border: 'border-status-failed',
        bg: 'bg-status-failed/10',
        text: 'text-status-failed',
        icon: '✗',
      };
    case 'skipped':
      return {
        border: 'border-status-skipped',
        bg: 'bg-status-skipped/10',
        text: 'text-status-skipped',
        icon: '→',
      };
  }
};

/**
 * DAG Node Component
 */
const DAGNode: React.FC<{
  node: WorkflowNodeStatus;
  showMetrics?: boolean;
  onClick?: () => void;
  compact?: boolean;
}> = ({ node, showMetrics, onClick, compact = false }) => {
  const style = getNodeStyle(node.status);
  const isClickable = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'rounded-lg border-2 transition-all duration-200',
        style.border,
        style.bg,
        compact ? 'w-20 h-14' : 'w-28 h-20',
        isClickable && 'hover:shadow-md hover:scale-105 cursor-pointer',
        !isClickable && 'cursor-default',
        node.status === 'running' && 'animate-pulse'
      )}
      aria-label={`${node.id} - ${node.status}`}
      title={node.error || undefined}
    >
      {/* Status Icon */}
      <div className={cn(
        compact ? 'text-lg' : 'text-2xl',
        'mb-1',
        style.text,
        node.status === 'running' && 'animate-spin'
      )}>
        {style.icon}
      </div>

      {/* Node Name */}
      <div className={cn(
        compact ? 'text-[10px]' : 'text-xs',
        'font-semibold text-text-primary uppercase'
      )}>
        {node.id}
      </div>

      {/* Duration */}
      {showMetrics && node.durationMs && node.status === 'success' && (
        <div className="text-[10px] text-text-tertiary mt-0.5">
          {(node.durationMs / 1000).toFixed(1)}s
        </div>
      )}

      {/* Error Indicator */}
      {node.status === 'failed' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-error rounded-full border border-background-primary" />
      )}
    </button>
  );
};

/**
 * Connection Arrow between nodes
 */
const ConnectionArrow: React.FC<{
  status: 'pending' | 'active' | 'complete';
  orientation: 'horizontal' | 'vertical';
}> = ({ status, orientation }) => {
  const colors = {
    pending: 'bg-border/20',
    active: 'bg-status-running',
    complete: 'bg-status-complete',
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center justify-center mx-1">
        <div className={cn('h-0.5 w-6 transition-colors', colors[status])} />
        <div className={cn('w-0 h-0 border-l-4 border-y-4 border-y-transparent', {
          'border-l-border/20': status === 'pending',
          'border-l-status-running': status === 'active',
          'border-l-status-complete': status === 'complete',
        })} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-1">
      <div className={cn('w-0.5 h-6 transition-colors', colors[status])} />
      <div className={cn('w-0 h-0 border-t-4 border-x-4 border-x-transparent', {
        'border-t-border/20': status === 'pending',
        'border-t-status-running': status === 'active',
        'border-t-status-complete': status === 'complete',
      })} />
    </div>
  );
};

/**
 * WorkflowDAG Component
 *
 * Renders a visual DAG of the workflow nodes with status indicators.
 *
 * @example
 * ```tsx
 * <WorkflowDAG
 *   nodes={workflowNodes}
 *   orientation="horizontal"
 *   showMetrics
 *   onNodeClick={(node) => console.log('Clicked:', node)}
 * />
 * ```
 */
export const WorkflowDAG: React.FC<WorkflowDAGProps> = ({
  nodes,
  orientation = 'horizontal',
  showMetrics = false,
  onNodeClick,
  className,
  compact = false,
}) => {
  // Create node state map
  const nodeStateMap = React.useMemo(() => {
    const map = new Map<WorkflowNode, WorkflowNodeStatus>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Get node state or create default
  const getNodeState = (nodeId: WorkflowNode): WorkflowNodeStatus => {
    return nodeStateMap.get(nodeId) || {
      id: nodeId,
      status: 'pending',
    };
  };

  // Determine connection status
  const getConnectionStatus = (fromIndex: number): 'pending' | 'active' | 'complete' => {
    const fromNodeId = WORKFLOW_NODES[fromIndex];
    const toNodeId = WORKFLOW_NODES[fromIndex + 1];

    if (!fromNodeId || !toNodeId) return 'pending';

    const fromNode = getNodeState(fromNodeId);
    const toNode = getNodeState(toNodeId);

    if (fromNode.status === 'success') {
      if (toNode.status === 'running') return 'active';
      if (toNode.status === 'success' || toNode.status === 'failed') return 'complete';
    }
    return 'pending';
  };

  const containerClass = orientation === 'horizontal'
    ? 'flex items-center justify-center flex-wrap gap-x-0'
    : 'flex flex-col items-center gap-y-0';

  return (
    <div className={cn('overflow-auto', className)}>
      <div className={containerClass}>
        {WORKFLOW_NODES.map((nodeId, index) => {
          const nodeState = getNodeState(nodeId);
          const isLastNode = index === WORKFLOW_NODES.length - 1;

          return (
            <React.Fragment key={nodeId}>
              {/* Node */}
              <DAGNode
                node={nodeState}
                showMetrics={showMetrics}
                onClick={onNodeClick ? () => onNodeClick(nodeState) : undefined}
                compact={compact}
              />

              {/* Connection Arrow */}
              {!isLastNode && (
                <ConnectionArrow
                  status={getConnectionStatus(index)}
                  orientation={orientation}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

WorkflowDAG.displayName = 'WorkflowDAG';
