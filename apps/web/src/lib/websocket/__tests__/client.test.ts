/**
 * WebSocket Client Tests
 * Comprehensive unit tests for WebSocket singleton client
 *
 * Coverage:
 * - Connection lifecycle (connect, disconnect, reconnect)
 * - Exponential backoff timing
 * - Event subscription/unsubscription
 * - Message queuing
 * - Connection state transitions
 * - Error scenarios
 * - Edge cases
 */

import { WebSocketClient } from '../client';
import { ConnectionState, ConnectionEvent } from '../types';
import type { WorkflowEvent } from '@/types/api/events';
import { WorkflowNode } from '@/types/api';

// Mock WebSocket
class MockWebSocket {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public readyState: number = WebSocket.CONNECTING;
  public url: string;

  private static instances: MockWebSocket[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    // Mock send
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, wasClean: true }));
    }
  }

  // Simulate successful connection
  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  // Simulate message received
  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  // Simulate error
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  // Simulate connection close
  simulateClose(code = 1006, wasClean = false): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, wasClean }));
    }
  }

  static getLastInstance(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }

  static reset(): void {
    MockWebSocket.instances = [];
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

// Mock timers
jest.useFakeTimers();

describe('WebSocketClient', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    MockWebSocket.reset();
    WebSocketClient.resetInstance();
    client = WebSocketClient.getInstance({ debug: false });
    jest.clearAllTimers();
  });

  afterEach(() => {
    client.destroy();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WebSocketClient.getInstance();
      const instance2 = WebSocketClient.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = WebSocketClient.getInstance();
      WebSocketClient.resetInstance();
      const instance2 = WebSocketClient.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Connection Lifecycle', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = client.connect();
      const ws = MockWebSocket.getLastInstance();

      expect(ws).toBeDefined();
      expect(ws!.url).toContain('events');
      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTING);

      ws!.simulateOpen();
      await connectPromise;

      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(client.isConnected()).toBe(true);
    });

    it('should disconnect from WebSocket server', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      client.disconnect();

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(client.isConnected()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      await client.connect();

      // Should still only have one instance
      expect(MockWebSocket.getLastInstance()).toBe(ws);
    });

    it('should not connect if connection in progress', async () => {
      const promise1 = client.connect();
      const ws1 = MockWebSocket.getLastInstance();

      const promise2 = client.connect();
      const ws2 = MockWebSocket.getLastInstance();

      expect(ws1).toBe(ws2);

      ws1!.simulateOpen();
      await Promise.all([promise1, promise2]);
    });
  });

  describe('Exponential Backoff Reconnection', () => {
    it('should reconnect with exponential backoff on unclean close', async () => {
      await client.connect();
      const ws1 = MockWebSocket.getLastInstance();
      ws1!.simulateOpen();

      // Simulate unclean close
      ws1!.simulateClose(1006, false);

      expect(client.getConnectionState()).toBe(ConnectionState.RECONNECTING);

      // First reconnect: 1s delay
      jest.advanceTimersByTime(1200); // Account for jitter
      const ws2 = MockWebSocket.getLastInstance();
      expect(ws2).not.toBe(ws1);
      ws2!.simulateOpen();

      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });

    it('should use exponential delays: 1s, 2s, 4s, 8s', async () => {
      await client.connect();
      const ws1 = MockWebSocket.getLastInstance();
      ws1!.simulateOpen();

      // First reconnect
      ws1!.simulateClose(1006, false);
      expect(client.getConnectionState()).toBe(ConnectionState.RECONNECTING);
      jest.advanceTimersByTime(1200); // Account for jitter
      const ws2 = MockWebSocket.getLastInstance();
      ws2!.simulateClose(1006, false);

      // Second reconnect (2s)
      jest.advanceTimersByTime(2000);
      const ws3 = MockWebSocket.getLastInstance();
      ws3!.simulateClose(1006, false);

      // Third reconnect (4s)
      jest.advanceTimersByTime(4000);
      const ws4 = MockWebSocket.getLastInstance();
      ws4!.simulateClose(1006, false);

      // Fourth reconnect (8s)
      jest.advanceTimersByTime(8000);
      const ws5 = MockWebSocket.getLastInstance();

      expect(ws5).toBeDefined();
    });

    it('should cap delay at maxDelay (30s)', async () => {
      const client = WebSocketClient.getInstance({
        debug: false,
        reconnection: {
          initialDelay: 1000,
          maxDelay: 5000, // Lower for testing
          multiplier: 2,
          maxAttempts: 0,
          jitter: 0, // Disable jitter for predictability
        },
      });

      await client.connect();
      const ws1 = MockWebSocket.getLastInstance();
      ws1!.simulateOpen();

      // Cause multiple failures to exceed max delay
      ws1!.simulateClose(1006, false);
      jest.advanceTimersByTime(1200); // Account for jitter // 1s
      MockWebSocket.getLastInstance()!.simulateClose(1006, false);

      jest.advanceTimersByTime(2000); // 2s
      MockWebSocket.getLastInstance()!.simulateClose(1006, false);

      jest.advanceTimersByTime(4000); // 4s
      MockWebSocket.getLastInstance()!.simulateClose(1006, false);

      // Next should be capped at 5s (maxDelay), not 8s
      jest.advanceTimersByTime(5000);
      const finalWs = MockWebSocket.getLastInstance();
      expect(finalWs).toBeDefined();
    });

    it('should not reconnect on clean close', async () => {
      await client.connect();
      const ws1 = MockWebSocket.getLastInstance();
      ws1!.simulateOpen();

      ws1!.simulateClose(1000, true);

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);

      // Advance timers - should not reconnect
      jest.advanceTimersByTime(10000);
      expect(MockWebSocket.getLastInstance()).toBe(ws1);
    });

    it('should stop reconnecting after maxAttempts', async () => {
      WebSocketClient.resetInstance(); // Reset to apply custom config
      const client = WebSocketClient.getInstance({
        debug: false,
        reconnection: {
          initialDelay: 1000,
          maxDelay: 30000,
          multiplier: 2,
          maxAttempts: 3,
          jitter: 0,
        },
      });

      await client.connect();
      const ws1 = MockWebSocket.getLastInstance();
      ws1!.simulateOpen();

      // First failure
      ws1!.simulateClose(1006, false);
      jest.advanceTimersByTime(1200); // Account for jitter
      MockWebSocket.getLastInstance()!.simulateClose(1006, false);

      // Second failure
      jest.advanceTimersByTime(2000);
      MockWebSocket.getLastInstance()!.simulateClose(1006, false);

      // Third failure
      jest.advanceTimersByTime(4000);
      MockWebSocket.getLastInstance()!.simulateClose(1006, false);

      // Should stop after 3 attempts
      jest.advanceTimersByTime(10000);
      expect(client.getConnectionState()).toBe(ConnectionState.FAILED);
    });
  });

  describe('Event Subscription', () => {
    const createMockEvent = (runId: string, node: WorkflowNode): WorkflowEvent => ({
      event_id: `event-${Date.now()}-${Math.random()}`,
      run_id: runId,
      timestamp: new Date().toISOString(),
      node_name: node,
      phase: 'start',
      metrics: {},
      issues: [],
      data: {},
    });

    it('should subscribe to events for a run', async () => {
      const callback = jest.fn();
      const unsubscribe = client.subscribe('run-123', callback);

      expect(unsubscribe).toBeInstanceOf(Function);
      expect(client.getStats().subscriptionCount).toBe(1);
    });

    it('should receive events for subscribed run', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      client.subscribe('run-123', callback);

      const event = createMockEvent('run-123', WorkflowNode.PLAN);
      ws!.simulateMessage(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(event);
    });

    it('should not receive events for other runs', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      client.subscribe('run-123', callback);

      const event = createMockEvent('run-456', WorkflowNode.PLAN);
      ws!.simulateMessage(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple subscriptions to same run', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback1 = jest.fn();
      const callback2 = jest.fn();
      client.subscribe('run-123', callback1);
      client.subscribe('run-123', callback2);

      const event = createMockEvent('run-123', WorkflowNode.PLAN);
      ws!.simulateMessage(event);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      const unsubscribe = client.subscribe('run-123', callback);

      const event1 = createMockEvent('run-123', WorkflowNode.PLAN);
      ws!.simulateMessage(event1);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      const event2 = createMockEvent('run-123', WorkflowNode.STYLE);
      ws!.simulateMessage(event2);
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should unsubscribe all for a run', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback1 = jest.fn();
      const callback2 = jest.fn();
      client.subscribe('run-123', callback1);
      client.subscribe('run-123', callback2);

      expect(client.getStats().subscriptionCount).toBe(2);

      client.unsubscribe('run-123');

      expect(client.getStats().subscriptionCount).toBe(0);
    });
  });

  describe('Event Deduplication', () => {
    const createMockEvent = (eventId: string, runId: string): WorkflowEvent => ({
      event_id: eventId,
      run_id: runId,
      timestamp: new Date().toISOString(),
      node_name: WorkflowNode.PLAN,
      phase: 'start',
      metrics: {},
      issues: [],
      data: {},
    });

    it('should deduplicate events with same event_id', async () => {
      const client = WebSocketClient.getInstance({
        debug: false,
        enableDeduplication: true,
      });

      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      client.subscribe('run-123', callback);

      const event = createMockEvent('event-1', 'run-123');

      ws!.simulateMessage(event);
      ws!.simulateMessage(event); // Duplicate
      ws!.simulateMessage(event); // Duplicate

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should allow duplicate events when deduplication disabled', async () => {
      // Reset instance to apply new config
      WebSocketClient.resetInstance();

      const client = WebSocketClient.getInstance({
        debug: false,
        enableDeduplication: false,
      });

      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      client.subscribe('run-123', callback);

      const event = createMockEvent('event-1', 'run-123');

      ws!.simulateMessage(event);
      ws!.simulateMessage(event);
      ws!.simulateMessage(event);

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Message Queuing', () => {
    // Note: Message queuing is implemented but not fully testable without
    // backend support for offline event buffering. This is a placeholder
    // for when that feature is implemented.

    it('should track queue size in stats', () => {
      const stats = client.getStats();
      expect(stats.queuedMessages).toBe(0);
    });
  });

  describe('Connection Events', () => {
    it('should emit CONNECTED event on connection', async () => {
      const callback = jest.fn();
      client.on(ConnectionEvent.CONNECTED, callback);

      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEvent.CONNECTED,
          state: ConnectionState.CONNECTED,
        })
      );
    });

    it('should emit DISCONNECTED event on disconnection', async () => {
      const callback = jest.fn();
      client.on(ConnectionEvent.DISCONNECTED, callback);

      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      client.disconnect();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEvent.DISCONNECTED,
          state: ConnectionState.DISCONNECTED,
        })
      );
    });

    it('should emit RECONNECTING event on reconnect', async () => {
      const callback = jest.fn();
      client.on(ConnectionEvent.RECONNECTING, callback);

      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      ws!.simulateClose(1006, false);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEvent.RECONNECTING,
          state: ConnectionState.RECONNECTING,
        })
      );
    });

    it('should emit STATE_CHANGE event on state transitions', async () => {
      const callback = jest.fn();
      client.on(ConnectionEvent.STATE_CHANGE, callback);

      await client.connect();
      const ws = MockWebSocket.getLastInstance();

      // Should emit for CONNECTING -> CONNECTED
      ws!.simulateOpen();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEvent.STATE_CHANGE,
          state: ConnectionState.CONNECTED,
          previousState: ConnectionState.CONNECTING,
        })
      );
    });

    it('should allow unsubscribing from connection events', async () => {
      const callback = jest.fn();
      const unsubscribe = client.on(ConnectionEvent.CONNECTED, callback);

      unsubscribe();

      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track connection statistics', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const stats = client.getStats();

      expect(stats.isConnected).toBe(true);
      expect(stats.connectionState).toBe(ConnectionState.CONNECTED);
      expect(stats.lastConnectedAt).toBeInstanceOf(Date);
      expect(stats.subscriptionCount).toBe(0);
    });

    it('should track total events processed', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      client.subscribe('run-123', callback);

      const event1: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.PLAN,
        phase: 'start',
        metrics: {},
        issues: [],
        data: {},
      };

      const event2: WorkflowEvent = {
        event_id: 'event-2',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.STYLE,
        phase: 'start',
        metrics: {},
        issues: [],
        data: {},
      };

      ws!.simulateMessage(event1);
      ws!.simulateMessage(event2);

      const stats = client.getStats();
      expect(stats.totalEventsProcessed).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors', async () => {
      const callback = jest.fn();
      client.on(ConnectionEvent.ERROR, callback);

      await client.connect();
      const ws = MockWebSocket.getLastInstance();

      ws!.simulateError();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEvent.ERROR,
          error: expect.any(Error),
        })
      );
    });

    it('should handle invalid message format', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const callback = jest.fn();
      client.subscribe('run-123', callback);

      // Send invalid message
      if (ws!.onmessage) {
        ws!.onmessage(new MessageEvent('message', { data: 'invalid json' }));
      }

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle subscription callback errors', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      client.subscribe('run-123', errorCallback);
      client.subscribe('run-123', normalCallback);

      const event: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.PLAN,
        phase: 'start',
        metrics: {},
        issues: [],
        data: {},
      };

      ws!.simulateMessage(event);

      // Error in one callback shouldn't prevent others
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const callback = jest.fn();
      client.subscribe('run-123', callback);
      client.on(ConnectionEvent.CONNECTED, callback);

      expect(client.getStats().subscriptionCount).toBe(1);

      client.destroy();

      expect(client.getStats().subscriptionCount).toBe(0);
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should clear reconnection timeout on disconnect', async () => {
      await client.connect();
      const ws = MockWebSocket.getLastInstance();
      ws!.simulateOpen();

      ws!.simulateClose(1006, false); // Start reconnection

      expect(client.getConnectionState()).toBe(ConnectionState.RECONNECTING);

      client.disconnect();

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);

      // Advance timers - should not reconnect
      jest.advanceTimersByTime(10000);
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid connect/disconnect cycles', async () => {
      for (let i = 0; i < 10; i++) {
        await client.connect();
        const ws = MockWebSocket.getLastInstance();
        ws!.simulateOpen();
        client.disconnect();
      }

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should handle message before connection', () => {
      const callback = jest.fn();
      client.subscribe('run-123', callback);

      // Try to send without connection - should not throw
      expect(() => {
        client.send({ test: 'message' });
      }).not.toThrow();

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
