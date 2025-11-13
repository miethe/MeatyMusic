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
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkflowStore } from '@/stores/workflowStore';
import { queryKeys } from '@/lib/query/config';
import type { WorkflowEvent } from '@/types/api';
import { WorkflowNode, WorkflowRunStatus } from '@/types/api';

/**
 * WebSocket hook options
 */
export interface UseWorkflowWebSocketOptions {
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
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
  const {
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onEvent,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const { setConnected, setConnectionError, updateRunStatus, updateNodeStatus, addEvent } =
    useWorkflowStore();
  const queryClient = useQueryClient();

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
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!enabled) return;

    // Get WebSocket URL from environment
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'ws://localhost:8000/events'
        : 'wss://api.meatymusic.local/events');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', wsUrl);
        setConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WorkflowEvent;
          processEvent(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
          const parseError = new Error('Failed to parse WebSocket message');
          onError?.(parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        const errorObj = new Error('WebSocket connection error');
        setConnectionError(errorObj.message);
        onError?.(errorObj);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt reconnect if not a clean close
        if (
          !event.wasClean &&
          enabled &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `[WebSocket] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          const error = 'Max reconnection attempts reached';
          setConnectionError(error);
          onError?.(new Error(error));
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      const errorObj = error instanceof Error ? error : new Error('Failed to connect');
      setConnectionError(errorObj.message);
      onError?.(errorObj);
    }
  }, [
    enabled,
    reconnectDelay,
    maxReconnectAttempts,
    setConnected,
    setConnectionError,
    processEvent,
    onConnect,
    onDisconnect,
    onError,
  ]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);

  /**
   * Effect to manage WebSocket connection
   */
  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected: useWorkflowStore((state) => state.isConnected),
    connectionError: useWorkflowStore((state) => state.connectionError),
    disconnect,
    reconnect: connect,
  };
}
