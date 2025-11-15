/**
 * useWebSocketStatus Hook
 * Global WebSocket connection status and statistics
 *
 * Features:
 * - Real-time connection state tracking
 * - Reconnection attempt monitoring
 * - Last connected/disconnected timestamps
 * - Error information
 * - Connection statistics
 * - No runId required (global status)
 *
 * Phase 2, Task 2.4
 */

import { useEffect, useState, useRef } from 'react';
import {
  getWebSocketClient,
  ConnectionState,
  ConnectionEvent,
  type ConnectionEventData,
  type WebSocketClientStats,
} from '@/lib/websocket';

/**
 * WebSocket status return value
 */
export interface WebSocketStatus {
  /** Is currently connected */
  isConnected: boolean;
  /** Current connection state */
  state: ConnectionState;
  /** Number of reconnection attempts (current session) */
  reconnectAttempt: number;
  /** Last successful connection timestamp */
  lastConnected: Date | null;
  /** Last disconnection timestamp */
  lastDisconnected: Date | null;
  /** Last error (if any) */
  error: Error | null;
  /** Full connection statistics */
  stats: WebSocketClientStats;
}

/**
 * Global WebSocket connection status
 *
 * Provides real-time status of the WebSocket connection without requiring
 * a specific runId. Useful for displaying connection indicators in the UI.
 *
 * @example
 * ```tsx
 * const status = useWebSocketStatus();
 *
 * return (
 *   <header>
 *     <ConnectionBadge
 *       isConnected={status.isConnected}
 *       state={status.state}
 *       reconnectAttempt={status.reconnectAttempt}
 *     />
 *     {status.error && (
 *       <ErrorTooltip error={status.error} />
 *     )}
 *   </header>
 * );
 * ```
 *
 * @example
 * ```tsx
 * const status = useWebSocketStatus();
 *
 * // Display detailed statistics in a debug panel
 * return (
 *   <DebugPanel>
 *     <StatRow label="State" value={status.state} />
 *     <StatRow label="Subscriptions" value={status.stats.subscriptionCount} />
 *     <StatRow label="Events Processed" value={status.stats.totalEventsProcessed} />
 *     <StatRow label="Uptime" value={formatDuration(status.stats.uptimeMs)} />
 *     <StatRow label="Reconnections" value={status.stats.totalReconnections} />
 *   </DebugPanel>
 * );
 * ```
 */
export function useWebSocketStatus(): WebSocketStatus {
  // Get WebSocket client singleton
  const client = getWebSocketClient({
    debug: process.env.NODE_ENV === 'development',
  });

  // Local state
  const [isConnected, setIsConnected] = useState<boolean>(client.isConnected());
  const [state, setState] = useState<ConnectionState>(client.getConnectionState());
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [lastDisconnected, setLastDisconnected] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<WebSocketClientStats>(client.getStats());

  // Ref to track if we're mounted
  const isMountedRef = useRef(true);

  /**
   * Update stats periodically
   */
  const updateStats = () => {
    if (!isMountedRef.current) return;
    setStats(client.getStats());
  };

  /**
   * Effect to subscribe to connection events
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Initialize state from current client stats
    updateStats();
    setIsConnected(client.isConnected());
    setState(client.getConnectionState());

    /**
     * Handle connection lifecycle events
     */
    const handleConnectionEvent = (data: ConnectionEventData) => {
      if (!isMountedRef.current) return;

      switch (data.type) {
        case ConnectionEvent.CONNECTED:
          setIsConnected(true);
          setState(ConnectionState.CONNECTED);
          setLastConnected(new Date());
          setError(null);
          setReconnectAttempt(0);
          updateStats();
          break;

        case ConnectionEvent.DISCONNECTED:
          setIsConnected(false);
          setState(ConnectionState.DISCONNECTED);
          setLastDisconnected(new Date());
          updateStats();
          break;

        case ConnectionEvent.RECONNECTING:
          setIsConnected(false);
          setState(ConnectionState.RECONNECTING);
          // Extract attempt number from metadata
          const attempt = (data.metadata?.attempt as number) || 0;
          setReconnectAttempt(attempt);
          updateStats();
          break;

        case ConnectionEvent.ERROR:
          if (data.error) {
            setError(data.error);
          }
          updateStats();
          break;

        case ConnectionEvent.STATE_CHANGE:
          setState(data.state);
          setIsConnected(data.state === ConnectionState.CONNECTED);
          updateStats();
          break;

        default:
          break;
      }
    };

    // Subscribe to all connection events
    const unsubscribeConnected = client.on(ConnectionEvent.CONNECTED, handleConnectionEvent);
    const unsubscribeDisconnected = client.on(ConnectionEvent.DISCONNECTED, handleConnectionEvent);
    const unsubscribeReconnecting = client.on(ConnectionEvent.RECONNECTING, handleConnectionEvent);
    const unsubscribeError = client.on(ConnectionEvent.ERROR, handleConnectionEvent);
    const unsubscribeStateChange = client.on(ConnectionEvent.STATE_CHANGE, handleConnectionEvent);

    // Set up periodic stats update (every 5 seconds)
    const statsInterval = setInterval(updateStats, 5000);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeReconnecting();
      unsubscribeError();
      unsubscribeStateChange();
      clearInterval(statsInterval);
    };
  }, [client]);

  return {
    isConnected,
    state,
    reconnectAttempt,
    lastConnected,
    lastDisconnected,
    error,
    stats,
  };
}
