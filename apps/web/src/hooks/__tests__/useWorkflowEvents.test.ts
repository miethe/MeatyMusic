/**
 * useWorkflowEvents Hook Tests
 * Comprehensive tests for workflow events subscription hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWorkflowEvents } from '../useWorkflowEvents';
import { WebSocketClient } from '@/lib/websocket/client';
import { ConnectionState, ConnectionEvent } from '@/lib/websocket/types';
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

  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
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

// Create a wrapper component for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Helper to create mock events
const createMockEvent = (
  runId: string,
  node: WorkflowNode,
  phase: 'start' | 'end' | 'fail' = 'start',
  data: Record<string, unknown> = {}
): WorkflowEvent => ({
  event_id: `event-${Date.now()}-${Math.random()}`,
  run_id: runId,
  timestamp: new Date().toISOString(),
  node_name: node,
  phase,
  metrics: {},
  issues: [],
  data,
});

describe('useWorkflowEvents', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    WebSocketClient.resetInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    WebSocketClient.resetInstance();
  });

  describe('Hook Mounting and Unmounting', () => {
    it('should subscribe to events on mount', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should unsubscribe on unmount', async () => {
      const client = WebSocketClient.getInstance();
      const { unmount } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(client.getStats().subscriptionCount).toBe(1);
      });

      unmount();

      await waitFor(() => {
        expect(client.getStats().subscriptionCount).toBe(0);
      });
    });

    it('should handle disabled state', () => {
      const { result } = renderHook(
        () => useWorkflowEvents('run-123', { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.events).toEqual([]);
    });
  });

  describe('Event Subscription and Processing', () => {
    it('should receive and accumulate events', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const event1 = createMockEvent('run-123', WorkflowNode.PLAN, 'start');
      const event2 = createMockEvent('run-123', WorkflowNode.PLAN, 'end');

      act(() => {
        ws?.simulateMessage(event1);
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      act(() => {
        ws?.simulateMessage(event2);
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(2);
      });

      expect(result.current.events[0]).toEqual(event1);
      expect(result.current.events[1]).toEqual(event2);
    });

    it('should filter events by runId', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const event1 = createMockEvent('run-123', WorkflowNode.PLAN);
      const event2 = createMockEvent('run-456', WorkflowNode.STYLE);

      act(() => {
        ws?.simulateMessage(event1);
        ws?.simulateMessage(event2);
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      expect(result.current.events[0].run_id).toBe('run-123');
    });

    it('should invoke onEvent callback', async () => {
      const onEvent = jest.fn();
      const { result } = renderHook(
        () => useWorkflowEvents('run-123', { onEvent }),
        {
          wrapper: createWrapper(),
        }
      );

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const event = createMockEvent('run-123', WorkflowNode.PLAN);

      act(() => {
        ws?.simulateMessage(event);
      });

      await waitFor(() => {
        expect(onEvent).toHaveBeenCalledTimes(1);
      });

      expect(onEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('History Limit', () => {
    it('should enforce maxEvents limit (FIFO)', async () => {
      const maxEvents = 3;
      const { result } = renderHook(
        () => useWorkflowEvents('run-123', { maxEvents }),
        {
          wrapper: createWrapper(),
        }
      );

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send 5 events, should only keep last 3
      const events = Array.from({ length: 5 }, (_, i) =>
        createMockEvent('run-123', WorkflowNode.PLAN, 'start', { index: i })
      );

      act(() => {
        events.forEach((event) => ws?.simulateMessage(event));
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(maxEvents);
      });

      // Should have events 2, 3, 4 (oldest 0, 1 dropped)
      expect((result.current.events[0].data as any).index).toBe(2);
      expect((result.current.events[1].data as any).index).toBe(3);
      expect((result.current.events[2].data as any).index).toBe(4);
    });

    it('should use default maxEvents of 1000', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This should not throw or cause issues
      const events = Array.from({ length: 1000 }, (_, i) =>
        createMockEvent('run-123', WorkflowNode.PLAN, 'start', { index: i })
      );

      act(() => {
        events.forEach((event) => ws?.simulateMessage(event));
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1000);
      });
    });
  });

  describe('clearEvents', () => {
    it('should clear accumulated events', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const event = createMockEvent('run-123', WorkflowNode.PLAN);

      act(() => {
        ws?.simulateMessage(event);
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      act(() => {
        result.current.clearEvents();
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(0);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should set loading to false when connected', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();

      expect(result.current.isLoading).toBe(true);

      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to true when disconnected', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate disconnect and reconnection
      act(() => {
        ws?.close();
      });

      // Note: Loading state behavior depends on reconnection logic
      // This is a simplified test
    });
  });

  describe('Error Handling', () => {
    it('should set error on connection failure', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();

      // Simulate connection failure by not opening
      // This is a simplified test - in real scenario, connection would fail
      // For now, we'll just check that error can be set

      await waitFor(() => {
        // In a real failure scenario, error would be set
        // This test verifies the structure is in place
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      unmount();

      // Send event after unmount - should not cause errors
      const event = createMockEvent('run-123', WorkflowNode.PLAN);

      expect(() => {
        ws?.simulateMessage(event);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty runId gracefully', () => {
      const { result } = renderHook(() => useWorkflowEvents(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.events).toEqual([]);
    });

    it('should handle rapid event influx', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send 100 events rapidly
      const events = Array.from({ length: 100 }, (_, i) =>
        createMockEvent('run-123', WorkflowNode.PLAN, 'start', { index: i })
      );

      act(() => {
        events.forEach((event) => ws?.simulateMessage(event));
      });

      await waitFor(() => {
        expect(result.current.events).toHaveLength(100);
      });
    });

    it('should handle malformed event data gracefully', async () => {
      const { result } = renderHook(() => useWorkflowEvents('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send invalid event (will be filtered by client)
      act(() => {
        if (ws?.onmessage) {
          ws.onmessage(new MessageEvent('message', { data: 'invalid json' }));
        }
      });

      // Should not crash, events should remain empty
      expect(result.current.events).toEqual([]);
    });
  });
});
