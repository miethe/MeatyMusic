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
 * - Toast notifications for connection events
 * - No runId required (global status)
 *
 * Phase 2, Task 2.4 + Phase 4, Task 4.3
 */

import { useEffect, useState, useRef } from 'react';
import {
  getWebSocketClient,
  ConnectionState,
  ConnectionEvent,
  type ConnectionEventData,
  type WebSocketClientStats,
} from '@/lib/websocket';
import { toast } from '@/lib/notifications/toast';

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
 * Hook Options
 */
export interface UseWebSocketStatusOptions {
  /** Enable toast notifications (default: true) */
  enableNotifications?: boolean;
  /** Enable success notification on connect (default: true) */
  notifyOnConnect?: boolean;
  /** Enable warning notification on disconnect (default: true) */
  notifyOnDisconnect?: boolean;
  /** Enable error notification on failure (default: true) */
  notifyOnError?: boolean;
}

/**
 * Global WebSocket connection status
 *
 * Provides real-time status of the WebSocket connection without requiring
 * a specific runId. Useful for displaying connection indicators in the UI.
 * Optionally displays toast notifications for connection events.
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
 * @example With custom notification settings
 * ```tsx
 * const status = useWebSocketStatus({
 *   enableNotifications: true,
 *   notifyOnConnect: false,  // Don't show toast on connect
 *   notifyOnDisconnect: true,
 *   notifyOnError: true,
 * });
 * ```
 */
export function useWebSocketStatus(options: UseWebSocketStatusOptions = {}): WebSocketStatus {
  const {
    enableNotifications = true,
    notifyOnConnect = true,
    notifyOnDisconnect = true,
    notifyOnError = true,
  } = options;

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
  // Ref to track if we've shown initial connect notification
  const hasShownInitialConnectRef = useRef(false);

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

          // Show success notification (skip on initial connect to avoid noise)
          if (enableNotifications && notifyOnConnect && hasShownInitialConnectRef.current) {
            toast.success('Connected to server', {
              duration: 2000,
            });
          }
          hasShownInitialConnectRef.current = true;
          break;

        case ConnectionEvent.DISCONNECTED:
          setIsConnected(false);
          setState(ConnectionState.DISCONNECTED);
          setLastDisconnected(new Date());
          updateStats();

          // Show warning notification
          if (enableNotifications && notifyOnDisconnect) {
            toast.warning('Connection lost, reconnecting...', {
              duration: 3000,
            });
          }
          break;

        case ConnectionEvent.RECONNECTING:
          setIsConnected(false);
          setState(ConnectionState.RECONNECTING);
          // Extract attempt number from metadata
          const attempt = (data.metadata?.attempt as number) || 0;
          setReconnectAttempt(attempt);
          updateStats();

          // Show info notification for reconnection attempts
          if (enableNotifications && attempt > 1) {
            toast.info(`Reconnecting... (attempt ${attempt})`, {
              duration: 2000,
            });
          }
          break;

        case ConnectionEvent.ERROR:
          if (data.error) {
            setError(data.error);
          }
          updateStats();

          // Show error notification
          if (enableNotifications && notifyOnError && data.error) {
            // Check if this is a max attempts failure
            const currentStats = client.getStats();
            const maxAttempts = 3; // Default from config
            if (currentStats.reconnectAttempts >= maxAttempts) {
              toast.error('Connection failed. Please refresh the page.', {
                duration: 0, // Don't auto-dismiss critical errors
                action: {
                  label: 'Refresh',
                  onClick: () => window.location.reload(),
                },
              });
            } else {
              toast.error(`Connection error: ${data.error.message}`, {
                duration: 4000,
              });
            }
          }
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
  }, [client, enableNotifications, notifyOnConnect, notifyOnDisconnect, notifyOnError]);

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
