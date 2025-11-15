/**
 * Workflow WebSocket Hook
 * Real-time workflow event streaming via WebSocket
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Event parsing and validation
 * - Integration with workflow store
 * - React Query cache invalidation
 * - Event handler callbacks
 *
 * Architecture: Section 5.2 - WebSocket Hook
 *
 * UPDATED: Now uses WebSocketClient singleton for connection management
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkflowStore } from '@/stores/workflowStore';
import { queryKeys } from '@/lib/query/config';
import type { WorkflowEvent } from '@/types/api';
import { WorkflowNode, WorkflowRunStatus } from '@/types/api';
import { getWebSocketClient, ConnectionState, ConnectionEvent } from '@/lib/websocket';
import type { ConnectionEventData } from '@/lib/websocket';

/**
 * WebSocket hook options
 */
export interface UseWorkflowWebSocketOptions {
  enabled?: boolean;
  onEvent?: (event: WorkflowEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * WebSocket hook return value
 */
export interface UseWorkflowWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * WebSocket hook for workflow event streaming
 *
 * This hook now uses the WebSocketClient singleton, which provides:
 * - Shared connection across all components
 * - Exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s)
 * - Message queuing for offline scenarios
 * - Event deduplication
 * - Connection state management
 *
 * @example
 * ```tsx
 * const { isConnected, connectionError } = useWorkflowWebSocket({
 *   enabled: true,
 *   onEvent: (event) => {
 *     console.log('Workflow event:', event);
 *   },
 * });
 * ```
 */
export function useWorkflowWebSocket(
  options: UseWorkflowWebSocketOptions = {}
): UseWorkflowWebSocketReturn {
  const { enabled = true, onEvent, onError, onConnect, onDisconnect } = options;

  const isInitializedRef = useRef(false);
  const connectionListenersRef = useRef<Array<() => void>>([]);

  const { setConnected, setConnectionError, updateRunStatus, updateNodeStatus, addEvent } =
    useWorkflowStore();
  const queryClient = useQueryClient();

  // Get WebSocket client singleton
  const client = getWebSocketClient({
    debug: process.env.NODE_ENV === 'development',
  });

  /**
   * Process incoming workflow event
   */
  const processEvent = useCallback(
    (event: WorkflowEvent) => {
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
          const error = (data as any)?.error_message || 'Unknown error';
          updateNodeStatus(run_id, node_name as WorkflowNode, {
            status: 'failed',
            completedAt: new Date(timestamp),
            error,
          });
        }
      } else {
        // Run-level event
        if (phase === 'end') {
          updateRunStatus(run_id, { status: WorkflowRunStatus.COMPLETED });
        } else if (phase === 'fail') {
          updateRunStatus(run_id, { status: WorkflowRunStatus.FAILED });
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.detail(run_id),
      });

      // Call custom handler
      onEvent?.(event);
    },
    [addEvent, updateNodeStatus, updateRunStatus, queryClient, onEvent]
  );

  /**
   * Handle connection lifecycle events
   */
  const handleConnectionEvent = useCallback(
    (data: ConnectionEventData) => {
      switch (data.type) {
        case ConnectionEvent.CONNECTED:
          setConnected(true);
          setConnectionError(null);
          onConnect?.();
          break;

        case ConnectionEvent.DISCONNECTED:
          setConnected(false);
          onDisconnect?.();
          break;

        case ConnectionEvent.ERROR:
          if (data.error) {
            setConnectionError(data.error.message);
            onError?.(data.error);
          }
          break;

        case ConnectionEvent.RECONNECTING:
          // Keep connected state but indicate reconnecting
          setConnected(false);
          break;

        default:
          break;
      }
    },
    [setConnected, setConnectionError, onConnect, onDisconnect, onError]
  );

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!enabled) return;

    client.connect().catch((error) => {
      console.error('[useWorkflowWebSocket] Failed to connect:', error);
      setConnectionError(error.message);
      onError?.(error);
    });
  }, [enabled, client, setConnectionError, onError]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  /**
   * Effect to manage WebSocket connection and listeners
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Set up connection event listeners
    const unsubscribeConnected = client.on(ConnectionEvent.CONNECTED, handleConnectionEvent);
    const unsubscribeDisconnected = client.on(ConnectionEvent.DISCONNECTED, handleConnectionEvent);
    const unsubscribeError = client.on(ConnectionEvent.ERROR, handleConnectionEvent);
    const unsubscribeReconnecting = client.on(ConnectionEvent.RECONNECTING, handleConnectionEvent);

    connectionListenersRef.current = [
      unsubscribeConnected,
      unsubscribeDisconnected,
      unsubscribeError,
      unsubscribeReconnecting,
    ];

    // Connect if not already connected
    if (!client.isConnected() && client.getConnectionState() === ConnectionState.DISCONNECTED) {
      connect();
    }

    // Update store with current connection state
    setConnected(client.isConnected());

    isInitializedRef.current = true;

    // Cleanup
    return () => {
      // Unsubscribe from connection events
      connectionListenersRef.current.forEach((unsubscribe) => unsubscribe());
      connectionListenersRef.current = [];

      // Note: We don't disconnect the client here because it's a singleton
      // shared by all components. The client manages its own lifecycle.
    };
  }, [enabled, client, connect, handleConnectionEvent, setConnected]);

  /**
   * Effect to subscribe to all workflow events
   * This is a global subscription - individual runs can filter events
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Subscribe to events for all runs
    // Note: The client's subscription model expects a run_id, but we want all events
    // For now, we'll use a wildcard approach by subscribing to a special run_id
    // and processing all events that come through

    // TODO: Enhance client to support global subscriptions (all run_ids)
    // For now, components that need specific run events should use this hook
    // and filter in their own processEvent callback

    return () => {
      // Cleanup handled by connection effect
    };
  }, [enabled, processEvent]);

  return {
    isConnected: useWorkflowStore((state) => state.isConnected),
    connectionError: useWorkflowStore((state) => state.connectionError),
    disconnect,
    reconnect: connect,
  };
}

/**
 * Hook to subscribe to events for a specific workflow run
 *
 * This is a more focused version of useWorkflowWebSocket that subscribes
 * only to events for a specific run_id.
 *
 * @example
 * ```tsx
 * const { events, isConnected } = useWorkflowEvents('run-123', {
 *   onEvent: (event) => console.log('Event received:', event),
 * });
 * ```
 */
export interface UseWorkflowEventsOptions {
  enabled?: boolean;
  onEvent?: (event: WorkflowEvent) => void;
}

export interface UseWorkflowEventsReturn {
  events: WorkflowEvent[];
  isConnected: boolean;
  connectionError: string | null;
}

export function useWorkflowEvents(
  runId: string,
  options: UseWorkflowEventsOptions = {}
): UseWorkflowEventsReturn {
  const { enabled = true, onEvent } = options;
  const eventsRef = useRef<WorkflowEvent[]>([]);

  const { setConnected, setConnectionError, updateRunStatus, updateNodeStatus, addEvent } =
    useWorkflowStore();
  const queryClient = useQueryClient();

  // Get WebSocket client singleton
  const client = getWebSocketClient({
    debug: process.env.NODE_ENV === 'development',
  });

  /**
   * Process incoming workflow event
   */
  const processEvent = useCallback(
    (event: WorkflowEvent) => {
      const { run_id, node_name, phase, timestamp, data } = event;

      // Add to local events array
      eventsRef.current = [...eventsRef.current, event];

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
          const error = (data as any)?.error_message || 'Unknown error';
          updateNodeStatus(run_id, node_name as WorkflowNode, {
            status: 'failed',
            completedAt: new Date(timestamp),
            error,
          });
        }
      } else {
        // Run-level event
        if (phase === 'end') {
          updateRunStatus(run_id, { status: WorkflowRunStatus.COMPLETED });
        } else if (phase === 'fail') {
          updateRunStatus(run_id, { status: WorkflowRunStatus.FAILED });
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.detail(run_id),
      });

      // Call custom handler
      onEvent?.(event);
    },
    [addEvent, updateNodeStatus, updateRunStatus, queryClient, onEvent]
  );

  /**
   * Effect to manage subscription
   */
  useEffect(() => {
    if (!enabled || !runId) {
      return;
    }

    // Connect if not already connected
    if (!client.isConnected() && client.getConnectionState() === ConnectionState.DISCONNECTED) {
      client.connect().catch((error) => {
        console.error('[useWorkflowEvents] Failed to connect:', error);
        setConnectionError(error.message);
      });
    }

    // Subscribe to events for this specific run
    const unsubscribe = client.subscribe(runId, processEvent);

    // Update store with current connection state
    setConnected(client.isConnected());

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [enabled, runId, client, processEvent, setConnected, setConnectionError]);

  return {
    events: eventsRef.current,
    isConnected: useWorkflowStore((state) => state.isConnected),
    connectionError: useWorkflowStore((state) => state.connectionError),
  };
}
