/**
 * WorkflowEventLog Component
 * Real-time event stream display for debugging
 *
 * Features:
 * - Scrollable event list (newest last)
 * - Display: timestamp, node name, phase, duration
 * - Collapsible metric details (JSON view)
 * - Issue/error highlighting (red for errors, yellow for warnings)
 * - Clear button to reset log
 * - Max events with auto-trim (FIFO)
 * - Auto-scroll to bottom on new events
 * - Copy event to clipboard functionality
 * - Filter by node or phase
 *
 * Phase 3, Task 3.2
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge, Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@meatymusic/ui';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { WorkflowNode } from '@/types/api';
import type { WorkflowEvent } from '@/types/api/events';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

export interface WorkflowEventLogProps {
  /** Run ID to subscribe to */
  runId: string;
  /** Maximum number of events to keep (default: 100) */
  maxEvents?: number;
  /** Show filter controls */
  showFilters?: boolean;
  /** Auto-scroll to newest events */
  autoScroll?: boolean;
  /** Make the log collapsible */
  collapsible?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Event filter state
 */
interface EventFilters {
  node: WorkflowNode | 'all';
  phase: 'start' | 'end' | 'fail' | 'all';
}

/**
 * WorkflowEventLog Component
 *
 * Displays a real-time stream of workflow events with filtering and debugging tools.
 *
 * @example
 * ```tsx
 * <WorkflowEventLog
 *   runId="run-123"
 *   maxEvents={100}
 *   showFilters={true}
 *   autoScroll={true}
 * />
 * ```
 */
export const WorkflowEventLog: React.FC<WorkflowEventLogProps> = ({
  runId,
  maxEvents = 100,
  showFilters = true,
  autoScroll = true,
  collapsible = false,
  className,
}) => {
  const { events, clearEvents } = useWorkflowEvents(runId, { maxEvents });
  const [filters, setFilters] = React.useState<EventFilters>({ node: 'all', phase: 'all' });
  const [expandedEvents, setExpandedEvents] = React.useState<Set<number>>(new Set());
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  /**
   * Auto-scroll to bottom when new events arrive
   */
  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  /**
   * Filter events based on current filters
   */
  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => {
      // Filter by node
      if (filters.node !== 'all' && event.node_name !== filters.node) {
        return false;
      }

      // Filter by phase
      if (filters.phase !== 'all' && event.phase !== filters.phase) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  /**
   * Toggle event expansion
   */
  const toggleEvent = React.useCallback((index: number) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  /**
   * Copy event to clipboard
   */
  const copyEvent = React.useCallback(async (event: WorkflowEvent) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      // Could show a toast here
    } catch (err) {
      console.error('Failed to copy event:', err);
    }
  }, []);

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  /**
   * Get phase badge config
   */
  const getPhaseBadge = (phase: string) => {
    switch (phase) {
      case 'start':
        return { icon: Info, color: 'info', label: 'START' };
      case 'end':
        return { icon: CheckCircle2, color: 'success', label: 'END' };
      case 'fail':
        return { icon: XCircle, color: 'danger', label: 'FAIL' };
      default:
        return { icon: AlertCircle, color: 'default', label: phase.toUpperCase() };
    }
  };

  /**
   * Render event row
   */
  const renderEvent = (event: WorkflowEvent, index: number) => {
    const isExpanded = expandedEvents.has(index);
    const phaseBadge = getPhaseBadge(event.phase);
    const PhaseIcon = phaseBadge.icon;
    const hasDetails = event.data || event.issues?.length || event.metrics;

    // Determine if this is an error/warning event
    const isError = event.phase === 'fail' || (event.issues && event.issues.some((i) => i.severity === 'error'));
    const isWarning = event.issues && event.issues.some((i) => i.severity === 'warning');

    return (
      <div
        key={`${event.run_id}-${event.timestamp}-${index}`}
        className={cn(
          'border-b border-border/10 last:border-b-0 transition-colors',
          isError && 'bg-status-failed/5',
          isWarning && !isError && 'bg-status-running/5'
        )}
      >
        {/* Event Header */}
        <div className="flex items-start gap-2 p-3 hover:bg-background-tertiary/50 transition-colors">
          {/* Expand button (if has details) */}
          <button
            type="button"
            onClick={() => toggleEvent(index)}
            disabled={!hasDetails}
            className={cn(
              'mt-0.5 p-0.5 rounded hover:bg-background-tertiary transition-colors',
              !hasDetails && 'opacity-0 cursor-default'
            )}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-text-tertiary" />
            ) : (
              <ChevronRight className="h-3 w-3 text-text-tertiary" />
            )}
          </button>

          {/* Timestamp */}
          <div className="text-xs text-text-tertiary font-mono min-w-[90px]">
            {formatTimestamp(event.timestamp)}
          </div>

          {/* Node name */}
          {event.node_name != null && (
            <Badge size="sm" variant="outline" className="uppercase font-mono">
              {String(event.node_name)}
            </Badge>
          )}

          {/* Phase */}
          <Badge size="sm" variant={phaseBadge.color as any}>
            <PhaseIcon className="h-2.5 w-2.5 mr-1" />
            {phaseBadge.label}
          </Badge>

          {/* Duration (for end events) */}
          {event.phase === 'end' && event.data?.duration_ms != null && (
            <span className="text-xs text-text-secondary">
              {Math.round(event.data.duration_ms as number)}ms
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Copy button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyEvent(event);
            }}
            className="p-1 rounded hover:bg-background-tertiary transition-colors"
            aria-label="Copy event to clipboard"
          >
            <Copy className="h-3 w-3 text-text-tertiary" />
          </button>
        </div>

        {/* Event Details (expanded) */}
        {isExpanded && hasDetails && (
          <div className="px-3 pb-3 space-y-2">
            {/* Issues */}
            {event.issues && event.issues.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-text-secondary mb-1">Issues:</div>
                <div className="space-y-1">
                  {event.issues.map((issue, i) => (
                    <div
                      key={i}
                      className={cn(
                        'text-xs p-2 rounded border',
                        issue.severity === 'error' &&
                          'bg-status-failed/10 border-status-failed/20 text-status-failed',
                        issue.severity === 'warning' &&
                          'bg-status-running/10 border-status-running/20 text-status-running',
                        issue.severity === 'info' && 'bg-background-tertiary border-border/20 text-text-secondary'
                      )}
                    >
                      <span className="font-semibold capitalize">{issue.severity}: </span>
                      {issue.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {event.metrics && Object.keys(event.metrics).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-text-secondary mb-1">Metrics:</div>
                <pre className="text-xs bg-background-tertiary p-2 rounded border border-border/20 overflow-x-auto">
                  {JSON.stringify(event.metrics, null, 2)}
                </pre>
              </div>
            )}

            {/* Data */}
            {event.data && Object.keys(event.data).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-text-secondary mb-1">Data:</div>
                <pre className="text-xs bg-background-tertiary p-2 rounded border border-border/20 overflow-x-auto max-h-60">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Main content
   */
  const content = (
    <div className={cn('bg-background-secondary rounded-lg border border-border/10', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/10">
        <h3 className="text-sm font-semibold text-text-primary">Event Log</h3>

        <div className="flex items-center gap-2">
          {/* Event count */}
          <span className="text-xs text-text-tertiary">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>

          {/* Clear button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearEvents}
            disabled={events.length === 0}
            aria-label="Clear event log"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 p-3 border-b border-border/10 bg-background-tertiary/50">
          <Filter className="h-3 w-3 text-text-tertiary" />

          {/* Node filter */}
          <select
            value={filters.node}
            onChange={(e) => setFilters((prev) => ({ ...prev, node: e.target.value as any }))}
            className="text-xs px-2 py-1 rounded border border-border/20 bg-background-secondary text-text-primary"
            aria-label="Filter by node"
          >
            <option value="all">All Nodes</option>
            {Object.values(WorkflowNode).map((node) => (
              <option key={node} value={node}>
                {node}
              </option>
            ))}
          </select>

          {/* Phase filter */}
          <select
            value={filters.phase}
            onChange={(e) => setFilters((prev) => ({ ...prev, phase: e.target.value as any }))}
            className="text-xs px-2 py-1 rounded border border-border/20 bg-background-secondary text-text-primary"
            aria-label="Filter by phase"
          >
            <option value="all">All Phases</option>
            <option value="start">Start</option>
            <option value="end">End</option>
            <option value="fail">Fail</option>
          </select>
        </div>
      )}

      {/* Event list */}
      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-96"
        role="log"
        aria-label="Workflow event log"
        aria-live="polite"
        aria-atomic="false"
      >
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary text-sm">
            {events.length === 0 ? 'No events yet' : 'No events match the current filters'}
          </div>
        ) : (
          filteredEvents.map((event, index) => renderEvent(event, index))
        )}
      </div>
    </div>
  );

  /**
   * Wrap in collapsible if needed
   */
  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between mb-2">
            Event Log ({filteredEvents.length})
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>{content}</CollapsibleContent>
      </Collapsible>
    );
  }

  return content;
};

WorkflowEventLog.displayName = 'WorkflowEventLog';
