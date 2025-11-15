/**
 * useWebSocketStatus Hook Tests
 * Comprehensive tests for global WebSocket status hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useWebSocketStatus } from '../useWebSocketStatus';
import { WebSocketClient } from '@/lib/websocket/client';
import { ConnectionState } from '@/lib/websocket/types';

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

  send(data: string): void {}

  close(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, wasClean: true }));
    }
  }

  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

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

// Mock timers for periodic stats updates
jest.useFakeTimers();

describe('useWebSocketStatus', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    WebSocketClient.resetInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    WebSocketClient.resetInstance();
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should return initial disconnected state', () => {
      const { result } = renderHook(() => useWebSocketStatus());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.state).toBe(ConnectionState.DISCONNECTED);
      expect(result.current.reconnectAttempt).toBe(0);
      expect(result.current.lastConnected).toBeNull();
      expect(result.current.lastDisconnected).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toBeDefined();
    });
  });

  describe('Connection State Tracking', () => {
    it('should update state when connection is established', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.state).toBe(ConnectionState.CONNECTED);
      expect(result.current.reconnectAttempt).toBe(0);
      expect(result.current.lastConnected).toBeInstanceOf(Date);
      expect(result.current.error).toBeNull();
    });

    it('should update state when connection is closed', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        ws?.simulateClose(1000, true);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      expect(result.current.state).toBe(ConnectionState.DISCONNECTED);
      expect(result.current.lastDisconnected).toBeInstanceOf(Date);
    });

    it('should track reconnection state', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate unclean close to trigger reconnection
      act(() => {
        ws?.simulateClose(1006, false);
      });

      await waitFor(() => {
        expect(result.current.state).toBe(ConnectionState.RECONNECTING);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.reconnectAttempt).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking', () => {
    it('should capture connection errors', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();

      act(() => {
        ws?.simulateError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
    });

    it('should clear error on successful connection', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();

      // Trigger error
      act(() => {
        ws?.simulateError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      // Establish connection
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Statistics Tracking', () => {
    it('should provide connection statistics', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const { stats } = result.current;

      expect(stats.connectionState).toBe(ConnectionState.CONNECTED);
      expect(stats.isConnected).toBe(true);
      expect(stats.subscriptionCount).toBe(0);
      expect(stats.queuedMessages).toBe(0);
      expect(stats.reconnectAttempts).toBe(0);
      expect(stats.lastConnectedAt).toBeInstanceOf(Date);
      expect(stats.totalEventsProcessed).toBe(0);
      expect(stats.totalReconnections).toBe(0);
      expect(stats.uptimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should update statistics periodically', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const initialStats = result.current.stats;

      // Advance timers by 5 seconds (stats update interval)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        // Stats should be updated (new object reference)
        expect(result.current.stats).not.toBe(initialStats);
      });
    });
  });

  describe('Reconnection Attempt Tracking', () => {
    it('should track reconnection attempts', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws1 = MockWebSocket.getLastInstance();
      act(() => {
        ws1?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Trigger reconnection
      act(() => {
        ws1?.simulateClose(1006, false);
      });

      await waitFor(() => {
        expect(result.current.state).toBe(ConnectionState.RECONNECTING);
      });

      expect(result.current.reconnectAttempt).toBeGreaterThan(0);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws1 = MockWebSocket.getLastInstance();
      act(() => {
        ws1?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Trigger reconnection
      act(() => {
        ws1?.simulateClose(1006, false);
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempt).toBeGreaterThan(0);
      });

      // Advance timers to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(1200);
      });

      const ws2 = MockWebSocket.getLastInstance();
      act(() => {
        ws2?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempt).toBe(0);
      });
    });
  });

  describe('Timestamp Tracking', () => {
    it('should track last connected timestamp', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      const beforeConnect = new Date();

      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const afterConnect = new Date();

      expect(result.current.lastConnected).toBeInstanceOf(Date);
      expect(result.current.lastConnected!.getTime()).toBeGreaterThanOrEqual(
        beforeConnect.getTime()
      );
      expect(result.current.lastConnected!.getTime()).toBeLessThanOrEqual(
        afterConnect.getTime()
      );
    });

    it('should track last disconnected timestamp', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const beforeDisconnect = new Date();

      act(() => {
        ws?.simulateClose(1000, true);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      const afterDisconnect = new Date();

      expect(result.current.lastDisconnected).toBeInstanceOf(Date);
      expect(result.current.lastDisconnected!.getTime()).toBeGreaterThanOrEqual(
        beforeDisconnect.getTime()
      );
      expect(result.current.lastDisconnected!.getTime()).toBeLessThanOrEqual(
        afterDisconnect.getTime()
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup listeners on unmount', async () => {
      const { unmount } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      // Unmount should not throw
      expect(() => {
        unmount();
      }).not.toThrow();

      // Events after unmount should not cause issues
      act(() => {
        ws?.simulateClose(1000, true);
      });
    });

    it('should stop updating stats after unmount', async () => {
      const { result, unmount } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      unmount();

      // Advance timers - stats should not update
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // No errors should occur
    });
  });

  describe('Global Status', () => {
    it('should reflect status without requiring runId', () => {
      const { result } = renderHook(() => useWebSocketStatus());

      // Should work without any parameters
      expect(result.current.isConnected).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.stats).toBeDefined();
    });

    it('should be usable from multiple components simultaneously', async () => {
      const { result: result1 } = renderHook(() => useWebSocketStatus());
      const { result: result2 } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result1.current.isConnected).toBe(true);
        expect(result2.current.isConnected).toBe(true);
      });

      expect(result1.current.state).toBe(result2.current.state);
    });
  });

  describe('State Changes', () => {
    it('should handle rapid state changes', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();

      // Rapid connect/disconnect cycles
      for (let i = 0; i < 5; i++) {
        await client.connect();
        const ws = MockWebSocket.getLastInstance();
        act(() => {
          ws?.simulateOpen();
        });

        await waitFor(() => {
          expect(result.current.isConnected).toBe(true);
        });

        act(() => {
          client.disconnect();
        });

        await waitFor(() => {
          expect(result.current.isConnected).toBe(false);
        });
      }

      // Should end in disconnected state
      expect(result.current.state).toBe(ConnectionState.DISCONNECTED);
    });

    it('should handle all connection states', async () => {
      const { result } = renderHook(() => useWebSocketStatus());

      const client = WebSocketClient.getInstance();

      // DISCONNECTED (initial)
      expect(result.current.state).toBe(ConnectionState.DISCONNECTED);

      // CONNECTING
      await client.connect();
      const ws = MockWebSocket.getLastInstance();

      // CONNECTED
      act(() => {
        ws?.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.state).toBe(ConnectionState.CONNECTED);
      });

      // RECONNECTING
      act(() => {
        ws?.simulateClose(1006, false);
      });

      await waitFor(() => {
        expect(result.current.state).toBe(ConnectionState.RECONNECTING);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle connection before hook mount', async () => {
      // Connect before mounting hook
      const client = WebSocketClient.getInstance();
      await client.connect();

      const ws = MockWebSocket.getLastInstance();
      act(() => {
        ws?.simulateOpen();
      });

      // Now mount hook
      const { result } = renderHook(() => useWebSocketStatus());

      // Should immediately reflect connected state
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should handle multiple unmount/remount cycles', () => {
      const { unmount: unmount1 } = renderHook(() => useWebSocketStatus());
      unmount1();

      const { unmount: unmount2 } = renderHook(() => useWebSocketStatus());
      unmount2();

      const { result } = renderHook(() => useWebSocketStatus());

      expect(result.current.state).toBeDefined();
    });
  });
});
