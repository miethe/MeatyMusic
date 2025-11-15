/**
 * WebSocket Client Types
 * Client-specific types for WebSocket connection management
 *
 * These types are separate from the API event types in @/types/api/events
 * and focus on connection lifecycle, subscriptions, and internal state.
 */

import type { WorkflowEvent } from '@/types/api/events';

/**
 * Connection State
 * State machine for WebSocket connection lifecycle
 */
export enum ConnectionState {
  /** Initial state, not yet connected */
  DISCONNECTED = 'disconnected',
  /** Attempting to establish connection */
  CONNECTING = 'connecting',
  /** Successfully connected and ready */
  CONNECTED = 'connected',
  /** Attempting to reconnect after disconnection */
  RECONNECTING = 'reconnecting',
  /** Connection failed with unrecoverable error */
  FAILED = 'failed',
}

/**
 * Connection Event
 * Events emitted by WebSocket client for lifecycle tracking
 */
export enum ConnectionEvent {
  /** Connection established */
  CONNECTED = 'connected',
  /** Connection closed */
  DISCONNECTED = 'disconnected',
  /** Reconnection attempt started */
  RECONNECTING = 'reconnecting',
  /** Connection error occurred */
  ERROR = 'error',
  /** Message received from server */
  MESSAGE = 'message',
  /** State changed */
  STATE_CHANGE = 'stateChange',
}

/**
 * Unsubscribe Function
 * Function returned by subscribe() to remove subscription
 */
export type Unsubscribe = () => void;

/**
 * Event Callback
 * Callback function for event subscriptions
 */
export type EventCallback = (event: WorkflowEvent) => void;

/**
 * Connection Event Callback
 * Callback function for connection lifecycle events
 */
export type ConnectionEventCallback = (data: ConnectionEventData) => void;

/**
 * Connection Event Data
 * Data passed to connection event callbacks
 */
export interface ConnectionEventData {
  /** Event type */
  type: ConnectionEvent;
  /** Current connection state */
  state: ConnectionState;
  /** Previous connection state */
  previousState?: ConnectionState;
  /** Error if applicable */
  error?: Error;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Subscription
 * Internal structure for tracking active subscriptions
 */
export interface Subscription {
  /** Unique subscription ID */
  id: string;
  /** Run ID being subscribed to */
  runId: string;
  /** Callback function */
  callback: EventCallback;
  /** Creation timestamp */
  createdAt: Date;
  /** Number of events received */
  eventsReceived: number;
}

/**
 * Queued Message
 * Message stored while offline for later delivery
 */
export interface QueuedMessage {
  /** Message ID for deduplication */
  id: string;
  /** Message data */
  data: WorkflowEvent;
  /** Timestamp when queued */
  queuedAt: Date;
  /** Number of delivery attempts */
  attempts: number;
}

/**
 * Reconnection Config
 * Configuration for exponential backoff reconnection
 */
export interface ReconnectionConfig {
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay: number;
  /** Multiplier for exponential backoff (default: 2) */
  multiplier: number;
  /** Maximum reconnection attempts (0 = unlimited) */
  maxAttempts: number;
  /** Jitter factor (0-1) to randomize delays (default: 0.1) */
  jitter: number;
}

/**
 * WebSocket Client Config
 * Configuration for WebSocket client initialization
 */
export interface WebSocketClientConfig {
  /** WebSocket server URL */
  url: string;
  /** Reconnection configuration */
  reconnection: ReconnectionConfig;
  /** Maximum queue size for offline messages */
  maxQueueSize: number;
  /** Enable event deduplication */
  enableDeduplication: boolean;
  /** Event deduplication window in milliseconds */
  deduplicationWindow: number;
  /** Maximum event history per run */
  maxEventHistory: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * WebSocket Client State
 * Internal state of the WebSocket client
 */
export interface WebSocketClientState {
  /** Current connection state */
  connectionState: ConnectionState;
  /** WebSocket instance */
  socket: WebSocket | null;
  /** Active subscriptions */
  subscriptions: Map<string, Subscription>;
  /** Message queue for offline buffering */
  messageQueue: QueuedMessage[];
  /** Reconnection attempt counter */
  reconnectAttempt: number;
  /** Reconnection timeout handle */
  reconnectTimeout: NodeJS.Timeout | null;
  /** Last successful connection time */
  lastConnectedAt: Date | null;
  /** Last disconnection time */
  lastDisconnectedAt: Date | null;
  /** Last error */
  lastError: Error | null;
  /** Event IDs seen (for deduplication) */
  seenEventIds: Set<string>;
  /** Connection event listeners */
  connectionListeners: Map<string, ConnectionEventCallback>;
  /** Total events processed */
  totalEventsProcessed: number;
  /** Total reconnections */
  totalReconnections: number;
}

/**
 * WebSocket Client Statistics
 * Runtime statistics for monitoring and debugging
 */
export interface WebSocketClientStats {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Is currently connected */
  isConnected: boolean;
  /** Is browser online (network available) */
  isOnline: boolean;
  /** Total subscriptions */
  subscriptionCount: number;
  /** Queued messages */
  queuedMessages: number;
  /** Reconnection attempts */
  reconnectAttempts: number;
  /** Last connected timestamp */
  lastConnectedAt: Date | null;
  /** Last disconnected timestamp */
  lastDisconnectedAt: Date | null;
  /** Last error */
  lastError: string | null;
  /** Total events processed */
  totalEventsProcessed: number;
  /** Total reconnections */
  totalReconnections: number;
  /** Uptime in milliseconds */
  uptimeMs: number;
}

/**
 * Type guard: Check if value is a WorkflowEvent
 */
export function isWorkflowEvent(value: unknown): value is WorkflowEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const event = value as Record<string, unknown>;

  return (
    typeof event.event_id === 'string' &&
    typeof event.run_id === 'string' &&
    typeof event.timestamp === 'string' &&
    (event.node_name === null || typeof event.node_name === 'string') &&
    typeof event.phase === 'string' &&
    ['start', 'end', 'fail', 'info'].includes(event.phase as string) &&
    typeof event.metrics === 'object' &&
    Array.isArray(event.issues) &&
    typeof event.data === 'object'
  );
}

/**
 * Type guard: Check if value is a QueuedMessage
 */
export function isQueuedMessage(value: unknown): value is QueuedMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const msg = value as Record<string, unknown>;

  return (
    typeof msg.id === 'string' &&
    isWorkflowEvent(msg.data) &&
    msg.queuedAt instanceof Date &&
    typeof msg.attempts === 'number'
  );
}

/**
 * Default WebSocket Client Configuration
 */
export const DEFAULT_WS_CONFIG: Partial<WebSocketClientConfig> = {
  reconnection: {
    initialDelay: 1000, // 1s
    maxDelay: 30000, // 30s
    multiplier: 2,
    maxAttempts: 0, // unlimited
    jitter: 0.1, // 10% randomization
  },
  maxQueueSize: 1000,
  enableDeduplication: true,
  deduplicationWindow: 5000, // 5s
  maxEventHistory: 1000,
  debug: false,
};
