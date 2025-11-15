/**
 * WebSocket Client Module
 * Exports for WebSocket client singleton and types
 */

export { WebSocketClient, getWebSocketClient } from './client';
export type { WebSocketClientConfig, WebSocketClientStats } from './types';
export {
  ConnectionState,
  ConnectionEvent,
  type Unsubscribe,
  type EventCallback,
  type ConnectionEventCallback,
  type ConnectionEventData,
  type Subscription,
  type QueuedMessage,
  type ReconnectionConfig,
  isWorkflowEvent,
  isQueuedMessage,
  DEFAULT_WS_CONFIG,
} from './types';
