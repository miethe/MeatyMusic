/**
 * useWorkflowProgress Hook Tests
 * Comprehensive tests for workflow progress tracking hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tantml:react-query';
import React from 'react';
import { useWorkflowProgress } from '../useWorkflowProgress';
import { WebSocketClient } from '@/lib/websocket/client';
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
  node: WorkflowNode | null,
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

describe('useWorkflowProgress', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    WebSocketClient.resetInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    WebSocketClient.resetInstance();
  });

  describe('Initial State', () => {
    it('should return initial progress state', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9); // All workflow nodes
      });

      expect(result.current.currentNode).toBeNull();
      expect(result.current.nodesCompleted).toEqual([]);
      expect(result.current.nodesFailed).toEqual([]);
      expect(result.current.nodesInProgress).toEqual([]);
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.scores).toEqual({});
      expect(result.current.issues).toEqual([]);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.isFailed).toBe(false);
    });
  });

  describe('Node Tracking', () => {
    it('should track current executing node', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Start PLAN node
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
      });

      await waitFor(() => {
        expect(result.current.currentNode).toBe(WorkflowNode.PLAN);
      });

      expect(result.current.nodesInProgress).toEqual([WorkflowNode.PLAN]);
    });

    it('should track completed nodes', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Start and complete PLAN node
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
      });

      await waitFor(() => {
        expect(result.current.currentNode).toBe(WorkflowNode.PLAN);
      });

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.PLAN, 'end', { duration_ms: 1000 })
        );
      });

      await waitFor(() => {
        expect(result.current.nodesCompleted).toEqual([WorkflowNode.PLAN]);
      });

      expect(result.current.currentNode).toBeNull();
      expect(result.current.nodesInProgress).toEqual([]);
    });

    it('should track failed nodes', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Start and fail PLAN node
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
      });

      await waitFor(() => {
        expect(result.current.currentNode).toBe(WorkflowNode.PLAN);
      });

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.PLAN, 'fail', {
            error_message: 'Test error',
          })
        );
      });

      await waitFor(() => {
        expect(result.current.nodesFailed).toEqual([WorkflowNode.PLAN]);
      });

      expect(result.current.currentNode).toBeNull();
      expect(result.current.nodesCompleted).toEqual([]);
    });

    it('should track multiple nodes in sequence', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // PLAN: start -> end
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
      });

      await waitFor(() => {
        expect(result.current.currentNode).toBe(WorkflowNode.PLAN);
      });

      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'end'));
      });

      // STYLE: start -> end
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.STYLE, 'start'));
      });

      await waitFor(() => {
        expect(result.current.currentNode).toBe(WorkflowNode.STYLE);
      });

      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.STYLE, 'end'));
      });

      await waitFor(() => {
        expect(result.current.nodesCompleted).toEqual([
          WorkflowNode.PLAN,
          WorkflowNode.STYLE,
        ]);
      });

      expect(result.current.currentNode).toBeNull();
    });
  });

  describe('Progress Percentage', () => {
    it('should calculate progress percentage correctly', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Complete 3 nodes (3/9 = 33%)
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'end'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.STYLE, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.STYLE, 'end'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.LYRICS, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.LYRICS, 'end'));
      });

      await waitFor(() => {
        expect(result.current.progressPercentage).toBe(33);
      });
    });

    it('should include failed nodes in progress percentage', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Complete 1 node, fail 1 node (2/9 = 22%)
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'end'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.STYLE, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.STYLE, 'fail'));
      });

      await waitFor(() => {
        expect(result.current.progressPercentage).toBe(22);
      });
    });

    it('should reach 100% when all nodes complete', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Complete all nodes
      const nodes = [
        WorkflowNode.PLAN,
        WorkflowNode.STYLE,
        WorkflowNode.LYRICS,
        WorkflowNode.PRODUCER,
        WorkflowNode.COMPOSE,
        WorkflowNode.VALIDATE,
        WorkflowNode.FIX,
        WorkflowNode.RENDER,
        WorkflowNode.REVIEW,
      ];

      act(() => {
        nodes.forEach((node) => {
          ws?.simulateMessage(createMockEvent('run-123', node, 'start'));
          ws?.simulateMessage(createMockEvent('run-123', node, 'end'));
        });
      });

      await waitFor(() => {
        expect(result.current.progressPercentage).toBe(100);
      });
    });
  });

  describe('Score Aggregation', () => {
    it('should aggregate scores from VALIDATE events', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Complete VALIDATE node with scores
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.VALIDATE, 'start'));
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.VALIDATE, 'end', {
            scores: {
              hook_density: 0.85,
              singability: 0.92,
              rhyme_tightness: 0.78,
              section_completeness: 1.0,
              profanity_score: 0.0,
              total: 0.87,
            },
          })
        );
      });

      await waitFor(() => {
        expect(result.current.scores).toEqual({
          hook_density: 0.85,
          singability: 0.92,
          rhyme_tightness: 0.78,
          section_completeness: 1.0,
          profanity_score: 0.0,
          total: 0.87,
        });
      });
    });
  });

  describe('Issues Tracking', () => {
    it('should accumulate issues from events', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Send event with issues
      const eventWithIssues: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.VALIDATE,
        phase: 'end',
        metrics: {},
        issues: [
          {
            severity: 'warning',
            message: 'Low hook density',
            code: 'HOOK_DENSITY_LOW',
          },
          {
            severity: 'error',
            message: 'Profanity detected',
            code: 'PROFANITY_FOUND',
          },
        ],
        data: {},
      };

      act(() => {
        ws?.simulateMessage(eventWithIssues);
      });

      await waitFor(() => {
        expect(result.current.issues).toHaveLength(2);
      });

      expect(result.current.issues[0]).toMatchObject({
        severity: 'warning',
        message: 'Low hook density',
        code: 'HOOK_DENSITY_LOW',
        node: WorkflowNode.VALIDATE,
      });
    });
  });

  describe('Run State Tracking', () => {
    it('should set isRunning when run starts', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Start run (run-level event with no node_name)
      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', null, 'start', {
            song_id: 'song-1',
            global_seed: 42,
            total_nodes: 9,
          })
        );
      });

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });

      expect(result.current.isComplete).toBe(false);
      expect(result.current.isFailed).toBe(false);
    });

    it('should set isComplete when run ends', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Start and complete run
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', null, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', null, 'end'));
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isFailed).toBe(false);
    });

    it('should set isFailed when run fails', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Start and fail run
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', null, 'start'));
        ws?.simulateMessage(createMockEvent('run-123', null, 'fail'));
      });

      await waitFor(() => {
        expect(result.current.isFailed).toBe(true);
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('Memoization', () => {
    it('should memoize progress calculations', async () => {
      const { result, rerender } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      const initialProgress = result.current;

      // Rerender without new events
      rerender();

      // Should return same reference (memoized)
      expect(result.current).toBe(initialProgress);
    });

    it('should recalculate when events change', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      const initialProgress = result.current;

      // Add new event
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
      });

      await waitFor(() => {
        expect(result.current.currentNode).toBe(WorkflowNode.PLAN);
      });

      // Should return different reference (recalculated)
      expect(result.current).not.toBe(initialProgress);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentNode).toBeNull();
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.scores).toEqual({});
      expect(result.current.issues).toEqual([]);
    });

    it('should handle events in non-chronological order', async () => {
      const { result } = renderHook(() => useWorkflowProgress('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.totalNodes).toBe(9);
      });

      // Send end before start (should still process correctly)
      act(() => {
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'end'));
        ws?.simulateMessage(createMockEvent('run-123', WorkflowNode.PLAN, 'start'));
      });

      // Should handle gracefully
      await waitFor(() => {
        expect(result.current.nodesCompleted).toContain(WorkflowNode.PLAN);
      });
    });
  });
});
