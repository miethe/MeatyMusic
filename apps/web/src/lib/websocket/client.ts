/**
 * WebSocket Client Singleton
 * Manages WebSocket connection lifecycle, subscriptions, and message queuing
 *
 * Features:
 * - Singleton pattern for shared connection
 * - Exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s)
 * - Message queuing for offline scenarios
 * - Event deduplication
 * - Subscription registry with pub/sub
 * - Connection state machine
 *
 * Architecture: Section 5.2 - WebSocket Client Core
 */

import { v4 as uuidv4 } from 'uuid';
import type { WorkflowEvent } from '@/types/api/events';
import {
  ConnectionState,
  ConnectionEvent,
  type WebSocketClientConfig,
  type WebSocketClientState,
  type WebSocketClientStats,
  type EventCallback,
  type ConnectionEventCallback,
  type Unsubscribe,
  type Subscription,
  type QueuedMessage,
  type ConnectionEventData,
  DEFAULT_WS_CONFIG,
  isWorkflowEvent,
} from './types';

/**
 * WebSocket Client Singleton
 *
 * Provides a single shared WebSocket connection for all components.
 * Handles connection lifecycle, reconnection, message queuing, and subscriptions.
 *
 * @example
 * ```typescript
 * const client = WebSocketClient.getInstance();
 * await client.connect();
 *
 * const unsubscribe = client.subscribe('run-123', (event) => {
 *   console.log('Received event:', event);
 * });
 *
 * // Later...
 * unsubscribe();
 * client.disconnect();
 * ```
 */
export class WebSocketClient {
  private static instance: WebSocketClient | null = null;

  private config: WebSocketClientConfig;
  private state: WebSocketClientState;

  /**
   * Private constructor (singleton pattern)
   */
  private constructor(config: Partial<WebSocketClientConfig> = {}) {
    this.config = this.buildConfig(config);
    this.state = this.initializeState();

    // Handle browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<WebSocketClientConfig>): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient(config);
    }
    return WebSocketClient.instance;
  }

  /**
   * Reset singleton (useful for testing)
   */
  public static resetInstance(): void {
    if (WebSocketClient.instance) {
      WebSocketClient.instance.disconnect();
      WebSocketClient.instance = null;
    }
  }

  /**
   * Build complete configuration from partial config
   */
  private buildConfig(config: Partial<WebSocketClientConfig>): WebSocketClientConfig {
    const url =
      config.url ||
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'ws://localhost:8000/events'
        : 'wss://api.meatymusic.local/events');

    return {
      url,
      reconnection: {
        ...DEFAULT_WS_CONFIG.reconnection!,
        ...config.reconnection,
      },
      maxQueueSize: config.maxQueueSize ?? DEFAULT_WS_CONFIG.maxQueueSize!,
      enableDeduplication: config.enableDeduplication ?? DEFAULT_WS_CONFIG.enableDeduplication!,
      deduplicationWindow: config.deduplicationWindow ?? DEFAULT_WS_CONFIG.deduplicationWindow!,
      maxEventHistory: config.maxEventHistory ?? DEFAULT_WS_CONFIG.maxEventHistory!,
      debug: config.debug ?? DEFAULT_WS_CONFIG.debug!,
    };
  }

  /**
   * Initialize client state
   */
  private initializeState(): WebSocketClientState {
    return {
      connectionState: ConnectionState.DISCONNECTED,
      socket: null,
      subscriptions: new Map(),
      messageQueue: [],
      reconnectAttempt: 0,
      reconnectTimeout: null,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      lastError: null,
      seenEventIds: new Set(),
      connectionListeners: new Map(),
      totalEventsProcessed: 0,
      totalReconnections: 0,
    };
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.state.connectionState === ConnectionState.CONNECTED) {
      this.log('Already connected');
      return;
    }

    if (this.state.connectionState === ConnectionState.CONNECTING) {
      this.log('Connection already in progress');
      return;
    }

    this.log('Connecting to', this.config.url);
    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      const socket = new WebSocket(this.config.url);
      this.state.socket = socket;

      // Set up event handlers
      socket.onopen = this.handleOpen;
      socket.onmessage = this.handleMessage;
      socket.onerror = this.handleError;
      socket.onclose = this.handleClose;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create WebSocket');
      this.handleConnectionError(errorObj);
      throw errorObj;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.log('Disconnecting');

    // Clear reconnection timeout
    if (this.state.reconnectTimeout) {
      clearTimeout(this.state.reconnectTimeout);
      this.state.reconnectTimeout = null;
    }

    // Close socket
    if (this.state.socket) {
      this.state.socket.close();
      this.state.socket = null;
    }

    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.state.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.state.connectionState;
  }

  /**
   * Subscribe to events for a specific run
   */
  public subscribe(runId: string, callback: EventCallback): Unsubscribe {
    const subscriptionId = uuidv4();
    const subscription: Subscription = {
      id: subscriptionId,
      runId,
      callback,
      createdAt: new Date(),
      eventsReceived: 0,
    };

    this.state.subscriptions.set(subscriptionId, subscription);
    this.log('Subscription added', { subscriptionId, runId, total: this.state.subscriptions.size });

    // Return unsubscribe function
    return () => {
      this.state.subscriptions.delete(subscriptionId);
      this.log('Subscription removed', {
        subscriptionId,
        runId,
        total: this.state.subscriptions.size,
      });
    };
  }

  /**
   * Unsubscribe from all events for a run
   */
  public unsubscribe(runId: string): void {
    const removed: string[] = [];

    for (const [id, sub] of this.state.subscriptions.entries()) {
      if (sub.runId === runId) {
        this.state.subscriptions.delete(id);
        removed.push(id);
      }
    }

    if (removed.length > 0) {
      this.log('Unsubscribed all for run', { runId, removed: removed.length });
    }
  }

  /**
   * Send message to server
   */
  public send(message: unknown): void {
    if (!this.state.socket || this.state.connectionState !== ConnectionState.CONNECTED) {
      this.log('Cannot send - not connected', { state: this.state.connectionState });
      return;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.state.socket.send(data);
      this.log('Message sent', { size: data.length });
    } catch (error) {
      this.log('Failed to send message', { error });
    }
  }

  /**
   * Listen to connection events
   */
  public on(event: ConnectionEvent, callback: ConnectionEventCallback): Unsubscribe {
    const listenerId = uuidv4();
    this.state.connectionListeners.set(listenerId, callback);

    return () => {
      this.state.connectionListeners.delete(listenerId);
    };
  }

  /**
   * Get client statistics
   */
  public getStats(): WebSocketClientStats {
    const now = Date.now();
    const uptimeMs = this.state.lastConnectedAt
      ? now - this.state.lastConnectedAt.getTime()
      : 0;

    return {
      connectionState: this.state.connectionState,
      isConnected: this.isConnected(),
      subscriptionCount: this.state.subscriptions.size,
      queuedMessages: this.state.messageQueue.length,
      reconnectAttempts: this.state.reconnectAttempt,
      lastConnectedAt: this.state.lastConnectedAt,
      lastDisconnectedAt: this.state.lastDisconnectedAt,
      lastError: this.state.lastError?.message || null,
      totalEventsProcessed: this.state.totalEventsProcessed,
      totalReconnections: this.state.totalReconnections,
      uptimeMs,
    };
  }

  /**
   * Clear message queue
   */
  public clearQueue(): void {
    this.state.messageQueue = [];
    this.log('Message queue cleared');
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen = (): void => {
    this.log('WebSocket connected');
    this.setConnectionState(ConnectionState.CONNECTED);
    this.state.lastConnectedAt = new Date();
    this.state.reconnectAttempt = 0;

    // Flush message queue
    this.flushMessageQueue();

    // Emit connection event
    this.emitConnectionEvent(ConnectionEvent.CONNECTED, {
      type: ConnectionEvent.CONNECTED,
      state: ConnectionState.CONNECTED,
    });
  };

  /**
   * Handle WebSocket message event
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data);

      if (!isWorkflowEvent(data)) {
        this.log('Invalid event format', { data });
        return;
      }

      const workflowEvent = data as WorkflowEvent;

      // Event deduplication
      if (this.config.enableDeduplication) {
        if (this.state.seenEventIds.has(workflowEvent.event_id)) {
          this.log('Duplicate event ignored', { eventId: workflowEvent.event_id });
          return;
        }

        this.state.seenEventIds.add(workflowEvent.event_id);

        // Clean old event IDs to prevent unbounded growth
        if (this.state.seenEventIds.size > this.config.maxEventHistory) {
          const toRemove = this.state.seenEventIds.size - this.config.maxEventHistory;
          const iterator = this.state.seenEventIds.values();
          for (let i = 0; i < toRemove; i++) {
            const value = iterator.next().value;
            if (value) {
              this.state.seenEventIds.delete(value);
            }
          }
        }
      }

      // Process event
      this.processEvent(workflowEvent);

      // Emit message event
      this.emitConnectionEvent(ConnectionEvent.MESSAGE, {
        type: ConnectionEvent.MESSAGE,
        state: this.state.connectionState,
        metadata: { event: workflowEvent },
      });
    } catch (error) {
      this.log('Failed to parse message', { error });
    }
  };

  /**
   * Handle WebSocket error event
   */
  private handleError = (event: Event): void => {
    const error = new Error('WebSocket error');
    this.state.lastError = error;
    this.log('WebSocket error', { event });

    this.emitConnectionEvent(ConnectionEvent.ERROR, {
      type: ConnectionEvent.ERROR,
      state: this.state.connectionState,
      error,
    });
  };

  /**
   * Handle WebSocket close event
   */
  private handleClose = (event: CloseEvent): void => {
    this.log('WebSocket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    this.state.lastDisconnectedAt = new Date();
    this.state.socket = null;

    // Check if we should attempt reconnection
    // Reconnect if: (1) not a clean close AND (2) we were trying to connect or were connected
    const shouldReconnect =
      !event.wasClean &&
      (this.state.connectionState === ConnectionState.CONNECTED ||
        this.state.connectionState === ConnectionState.CONNECTING ||
        this.state.connectionState === ConnectionState.RECONNECTING);

    this.setConnectionState(ConnectionState.DISCONNECTED);

    this.emitConnectionEvent(ConnectionEvent.DISCONNECTED, {
      type: ConnectionEvent.DISCONNECTED,
      state: ConnectionState.DISCONNECTED,
      metadata: { code: event.code, reason: event.reason, wasClean: event.wasClean },
    });

    // Attempt reconnection
    if (shouldReconnect) {
      this.scheduleReconnect();
    }
  };

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    this.log('Browser online');
    if (this.state.connectionState === ConnectionState.DISCONNECTED) {
      this.connect().catch((error) => {
        this.log('Failed to reconnect on online event', { error });
      });
    }
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    this.log('Browser offline');
    this.disconnect();
  };

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    const { reconnection } = this.config;

    // Check max attempts (before incrementing)
    if (reconnection.maxAttempts > 0 && this.state.reconnectAttempt >= reconnection.maxAttempts) {
      this.log('Max reconnection attempts reached', { attempts: this.state.reconnectAttempt });
      this.setConnectionState(ConnectionState.FAILED);
      return;
    }

    // Calculate delay with exponential backoff and jitter
    const baseDelay = Math.min(
      reconnection.initialDelay * Math.pow(reconnection.multiplier, this.state.reconnectAttempt),
      reconnection.maxDelay
    );

    const jitter = baseDelay * reconnection.jitter * (Math.random() * 2 - 1);
    const delay = Math.max(0, baseDelay + jitter);

    // Increment attempt counter
    this.state.reconnectAttempt++;
    this.setConnectionState(ConnectionState.RECONNECTING);

    this.log('Scheduling reconnect', {
      attempt: this.state.reconnectAttempt,
      delayMs: delay,
    });

    this.emitConnectionEvent(ConnectionEvent.RECONNECTING, {
      type: ConnectionEvent.RECONNECTING,
      state: ConnectionState.RECONNECTING,
      metadata: { attempt: this.state.reconnectAttempt, delayMs: delay },
    });

    this.state.reconnectTimeout = setTimeout(() => {
      this.state.totalReconnections++;
      this.connect().catch((error) => {
        this.log('Reconnection failed', { error });
        // The handleClose will be called automatically, which will schedule next attempt
      });
    }, delay);
  }

  /**
   * Process incoming workflow event
   */
  private processEvent(event: WorkflowEvent): void {
    this.state.totalEventsProcessed++;

    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.state.subscriptions.values()).filter(
      (sub) => sub.runId === event.run_id
    );

    if (matchingSubscriptions.length === 0) {
      this.log('No subscribers for event', { runId: event.run_id, eventId: event.event_id });
      return;
    }

    // Deliver to all matching subscriptions
    for (const subscription of matchingSubscriptions) {
      try {
        subscription.callback(event);
        subscription.eventsReceived++;
      } catch (error) {
        this.log('Subscription callback error', { subscriptionId: subscription.id, error });
      }
    }

    this.log('Event processed', {
      runId: event.run_id,
      eventId: event.event_id,
      subscribers: matchingSubscriptions.length,
    });
  }

  /**
   * Queue message for later delivery (offline scenario)
   */
  private queueMessage(event: WorkflowEvent): void {
    // Check queue size limit
    if (this.state.messageQueue.length >= this.config.maxQueueSize) {
      // Remove oldest message
      this.state.messageQueue.shift();
      this.log('Queue full, oldest message dropped');
    }

    const queuedMessage: QueuedMessage = {
      id: event.event_id,
      data: event,
      queuedAt: new Date(),
      attempts: 0,
    };

    this.state.messageQueue.push(queuedMessage);
    this.log('Message queued', {
      eventId: event.event_id,
      queueSize: this.state.messageQueue.length,
    });
  }

  /**
   * Flush message queue (on reconnect)
   */
  private flushMessageQueue(): void {
    if (this.state.messageQueue.length === 0) {
      return;
    }

    this.log('Flushing message queue', { count: this.state.messageQueue.length });

    const messages = [...this.state.messageQueue];
    this.state.messageQueue = [];

    // Process queued messages in FIFO order
    for (const message of messages) {
      try {
        this.processEvent(message.data);
      } catch (error) {
        this.log('Failed to process queued message', { messageId: message.id, error });
      }
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    this.state.lastError = error;
    this.setConnectionState(ConnectionState.FAILED);

    this.emitConnectionEvent(ConnectionEvent.ERROR, {
      type: ConnectionEvent.ERROR,
      state: ConnectionState.FAILED,
      error,
    });
  }

  /**
   * Set connection state and emit state change event
   */
  private setConnectionState(newState: ConnectionState): void {
    const previousState = this.state.connectionState;
    if (previousState === newState) {
      return;
    }

    this.state.connectionState = newState;
    this.log('State changed', { from: previousState, to: newState });

    this.emitConnectionEvent(ConnectionEvent.STATE_CHANGE, {
      type: ConnectionEvent.STATE_CHANGE,
      state: newState,
      previousState,
    });
  }

  /**
   * Emit connection event to listeners
   */
  private emitConnectionEvent(event: ConnectionEvent, data: ConnectionEventData): void {
    for (const callback of this.state.connectionListeners.values()) {
      try {
        callback(data);
      } catch (error) {
        this.log('Connection listener error', { event, error });
      }
    }
  }

  /**
   * Log message (if debug enabled)
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (!this.config.debug) {
      return;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      message,
      ...data,
    };

    console.log('[WebSocketClient]', logData);
  }

  /**
   * Cleanup (call on app unmount)
   */
  public destroy(): void {
    this.disconnect();

    // Remove browser event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    // Clear all subscriptions
    this.state.subscriptions.clear();
    this.state.connectionListeners.clear();
    this.state.messageQueue = [];
    this.state.seenEventIds.clear();

    this.log('Client destroyed');
  }
}

/**
 * Get WebSocket client singleton instance
 * Convenience function for imports
 */
export function getWebSocketClient(config?: Partial<WebSocketClientConfig>): WebSocketClient {
  return WebSocketClient.getInstance(config);
}

/**
 * Default export
 */
export default WebSocketClient;
