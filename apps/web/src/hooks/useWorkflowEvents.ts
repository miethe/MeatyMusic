/**
 * useWorkflowEvents Hook
 * Subscribe to real-time workflow events for a specific run
 *
 * Features:
 * - Automatic subscription/unsubscription
 * - Event accumulation with history limit
 * - Loading and error states
 * - Memory leak prevention
 * - Optional event callback
 * - Toast notifications for workflow completion/failure
 *
 * Phase 2, Task 2.1 + Phase 4, Task 4.3
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkflowStore } from '@/stores/workflowStore';
import { queryKeys } from '@/lib/query/config';
import type { WorkflowEvent } from '@/types/api/events';
import { WorkflowNode, WorkflowRunStatus } from '@/types/api';
import { getWebSocketClient, ConnectionState } from '@/lib/websocket';
import { toast } from '@/lib/notifications/toast';

/**
 * Hook options
 */
export interface UseWorkflowEventsOptions {
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Maximum number of events to keep in history (default: 1000) */
  maxEvents?: number;
  /** Callback invoked for each event */
  onEvent?: (event: WorkflowEvent) => void;
  /** Enable toast notifications for workflow completion/failure (default: true) */
  enableNotifications?: boolean;
}

/**
 * Hook return value
 */
export interface UseWorkflowEventsReturn {
  /** Accumulated events for this run */
  events: WorkflowEvent[];
  /** Loading state (reflects connection status) */
  isLoading: boolean;
  /** Error state (captures subscription failures) */
  error: Error | null;
  /** Clear accumulated events */
  clearEvents: () => void;
}

/**
 * Subscribe to workflow events for a specific run
 *
 * This hook subscribes to real-time workflow events via WebSocket and accumulates
 * them in an array with FIFO ordering. It also updates the workflow store and
 * React Query cache for each event. Optionally shows toast notifications for
 * workflow completion and failure.
 *
 * @example
 * ```tsx
 * const { events, isLoading, error, clearEvents } = useWorkflowEvents('run-123', {
 *   maxEvents: 500,
 *   onEvent: (event) => {
 *     if (event.phase === 'fail') {
 *       console.log('Node failed:', event);
 *     }
 *   },
 *   enableNotifications: true,
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorAlert error={error} />;
 *
 * return <EventLog events={events} onClear={clearEvents} />;
 * ```
 */
export function useWorkflowEvents(
  runId: string,
  options: UseWorkflowEventsOptions = {}
): UseWorkflowEventsReturn {
  const { enabled = true, maxEvents = 1000, onEvent, enableNotifications = true } = options;

  // Local state for events and error
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ref to track if we're mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);
  // Ref to track if we've already shown completion notification
  const hasShownCompletionNotificationRef = useRef(false);

  // Store and query client
  const { updateRunStatus, updateNodeStatus, addEvent } = useWorkflowStore();
  const queryClient = useQueryClient();

  // Get WebSocket client singleton
  const client = getWebSocketClient({
    debug: process.env.NODE_ENV === 'development',
  });

  /**
   * Clear accumulated events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
    hasShownCompletionNotificationRef.current = false;
  }, []);

  /**
   * Process incoming workflow event
   * Updates store, query cache, and local state
   */
  const processEvent = useCallback(
    (event: WorkflowEvent) => {
      if (!isMountedRef.current) return;

      const { run_id, node_name, phase, timestamp, data } = event;

      // Add event to store
      addEvent(run_id, event);

      // Update node status based on phase
      if (node_name) {
        // Node-level event
        if (phase === 'start') {
          updateNodeStatus(run_id, node_name as WorkflowNode, {
            status: 'running',
            startedAt: new Date(timestamp),
          });
          updateRunStatus(run_id, { currentNode: node_name as WorkflowNode });
        } else if (phase === 'end') {
          const durationMs = (data as any)?.duration_ms;
          updateNodeStatus(run_id, node_name as WorkflowNode, {
            status: 'success',
            completedAt: new Date(timestamp),
            durationMs,
          });
        } else if (phase === 'fail') {
          const errorMessage = (data as any)?.error_message || 'Unknown error';
          updateNodeStatus(run_id, node_name as WorkflowNode, {
            status: 'failed',
            completedAt: new Date(timestamp),
            error: errorMessage,
          });
        }
      } else {
        // Run-level event (no node_name)
        if (phase === 'end' && !hasShownCompletionNotificationRef.current) {
          updateRunStatus(run_id, { status: WorkflowRunStatus.COMPLETED });

          // Show success notification
          if (enableNotifications) {
            toast.success('Workflow completed successfully!', {
              duration: 4000,
            });
            hasShownCompletionNotificationRef.current = true;
          }
        } else if (phase === 'fail' && !hasShownCompletionNotificationRef.current) {
          updateRunStatus(run_id, { status: WorkflowRunStatus.FAILED });

          // Show error notification
          if (enableNotifications) {
            const errorMessage = (data as any)?.error_message || 'Unknown error';
            toast.error(`Workflow failed: ${errorMessage}`, {
              duration: 6000,
            });
            hasShownCompletionNotificationRef.current = true;
          }
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.detail(run_id),
      });

      // Add to local events array with history limit
      setEvents((prevEvents) => {
        const newEvents = [...prevEvents, event];
        // Enforce history limit by removing oldest events (FIFO)
        if (newEvents.length > maxEvents) {
          return newEvents.slice(newEvents.length - maxEvents);
        }
        return newEvents;
      });

      // Call custom handler
      onEvent?.(event);
    },
    [addEvent, updateNodeStatus, updateRunStatus, queryClient, onEvent, maxEvents, enableNotifications]
  );

  /**
   * Effect to manage WebSocket connection and subscription
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !runId) {
      setIsLoading(false);
      return;
    }

    // Connect if not already connected
    const connectionState = client.getConnectionState();
    if (connectionState === ConnectionState.DISCONNECTED) {
      setIsLoading(true);
      client
        .connect()
        .then(() => {
          if (isMountedRef.current) {
            setIsLoading(false);
            setError(null);
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            setIsLoading(false);
            setError(err instanceof Error ? err : new Error('Connection failed'));
          }
        });
    } else if (connectionState === ConnectionState.CONNECTED) {
      setIsLoading(false);
    } else if (connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.RECONNECTING) {
      setIsLoading(true);
    }

    // Subscribe to events for this specific run
    const unsubscribe = client.subscribe(runId, processEvent);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [enabled, runId, client, processEvent]);

  /**
   * Effect to track connection state changes
   * Updates loading state based on connection lifecycle
   */
  useEffect(() => {
    if (!enabled) return;

    const handleConnectionChange = () => {
      if (!isMountedRef.current) return;

      const connectionState = client.getConnectionState();
      const isConnecting =
        connectionState === ConnectionState.CONNECTING ||
        connectionState === ConnectionState.RECONNECTING;

      setIsLoading(isConnecting);

      if (connectionState === ConnectionState.FAILED) {
        setError(new Error('WebSocket connection failed'));
      } else if (connectionState === ConnectionState.CONNECTED) {
        setError(null);
      }
    };

    // Listen to connection state changes
    const unsubscribeStateChange = client.on('stateChange' as any, handleConnectionChange);

    return () => {
      unsubscribeStateChange();
    };
  }, [enabled, client]);

  return {
    events,
    isLoading,
    error,
    clearEvents,
  };
}
