/**
 * useWorkflowArtifacts Hook Tests
 * Comprehensive tests for workflow artifacts monitoring hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWorkflowArtifacts } from '../useWorkflowArtifacts';
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
  node: WorkflowNode,
  phase: 'start' | 'end' | 'fail' = 'end',
  artifacts: Record<string, unknown> = {}
): WorkflowEvent => ({
  event_id: `event-${Date.now()}-${Math.random()}`,
  run_id: runId,
  timestamp: new Date().toISOString(),
  node_name: node,
  phase,
  metrics: {},
  issues: [],
  data: {
    artifacts,
  },
});

describe('useWorkflowArtifacts', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    WebSocketClient.resetInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    WebSocketClient.resetInstance();
  });

  describe('Initial State', () => {
    it('should return initial artifacts state', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.style).toBeNull();
      expect(result.current.lyrics).toBeNull();
      expect(result.current.producerNotes).toBeNull();
      expect(result.current.composedPrompt).toBeNull();
      expect(result.current.allArtifacts).toEqual({});
    });
  });

  describe('Style Artifact', () => {
    it('should extract style artifact from STYLE node', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styleArtifact = {
        genre: 'Pop',
        subgenres: ['Dance Pop', 'Electropop'],
        bpm: 120,
        key: 'C major',
        mood: ['Energetic', 'Uplifting'],
        instrumentation: ['Synth', 'Drums', 'Bass'],
        vocal_style: 'Pop',
        tags: ['catchy', 'upbeat'],
      };

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', styleArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.style).toEqual(styleArtifact);
      });

      expect(result.current.allArtifacts[WorkflowNode.STYLE]).toEqual(styleArtifact);
    });
  });

  describe('Lyrics Artifact', () => {
    it('should extract lyrics artifact from LYRICS node', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const lyricsArtifact = {
        sections: [
          {
            type: 'verse',
            lines: ['Line 1', 'Line 2', 'Line 3', 'Line 4'],
          },
          {
            type: 'chorus',
            lines: ['Chorus line 1', 'Chorus line 2'],
          },
        ],
        full_text: 'Line 1\nLine 2\nLine 3\nLine 4\n\nChorus line 1\nChorus line 2',
        rhyme_scheme: 'ABAB CCDD',
      };

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.LYRICS, 'end', lyricsArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.lyrics).toEqual(lyricsArtifact);
      });

      expect(result.current.allArtifacts[WorkflowNode.LYRICS]).toEqual(lyricsArtifact);
    });
  });

  describe('Producer Notes Artifact', () => {
    it('should extract producer notes from PRODUCER node', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const producerNotesArtifact = {
        arrangement: 'Intro -> Verse -> Chorus -> Verse -> Chorus -> Bridge -> Chorus',
        structure: 'Standard pop structure',
        mix_targets: {
          vocals: 'Front and center',
          bass: 'Punchy and clear',
          drums: 'Tight and driving',
        },
        production_notes: ['Add reverb to vocals', 'Compress drums'],
      };

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.PRODUCER, 'end', producerNotesArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.producerNotes).toEqual(producerNotesArtifact);
      });

      expect(result.current.allArtifacts[WorkflowNode.PRODUCER]).toEqual(
        producerNotesArtifact
      );
    });
  });

  describe('Composed Prompt Artifact', () => {
    it('should extract composed prompt as string from COMPOSE node', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const composedPrompt = 'Pop, Dance Pop, 120 BPM, energetic, upbeat, catchy hooks';

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.COMPOSE, 'end', {
            prompt: composedPrompt,
          })
        );
      });

      await waitFor(() => {
        expect(result.current.composedPrompt).toBe(composedPrompt);
      });
    });

    it('should handle composed_prompt field name', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const composedPrompt = 'Alternative prompt format';

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.COMPOSE, 'end', {
            composed_prompt: composedPrompt,
          })
        );
      });

      await waitFor(() => {
        expect(result.current.composedPrompt).toBe(composedPrompt);
      });
    });

    it('should handle string artifact directly', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send event with output as string directly
      const event: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.COMPOSE,
        phase: 'end',
        metrics: {},
        issues: [],
        data: {
          output: 'Direct string prompt',
        },
      };

      act(() => {
        ws?.simulateMessage(event);
      });

      await waitFor(() => {
        expect(result.current.composedPrompt).toBe('Direct string prompt');
      });
    });
  });

  describe('Multiple Artifacts', () => {
    it('should track multiple artifacts from different nodes', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styleArtifact = { genre: 'Pop' };
      const lyricsArtifact = { sections: [] };
      const producerNotesArtifact = { arrangement: 'Standard' };

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', styleArtifact)
        );
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.LYRICS, 'end', lyricsArtifact)
        );
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.PRODUCER, 'end', producerNotesArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.style).toEqual(styleArtifact);
        expect(result.current.lyrics).toEqual(lyricsArtifact);
        expect(result.current.producerNotes).toEqual(producerNotesArtifact);
      });

      expect(Object.keys(result.current.allArtifacts)).toHaveLength(3);
    });
  });

  describe('Artifact Updates', () => {
    it('should update artifact when same node completes again', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styleArtifact1 = { genre: 'Pop', bpm: 120 };
      const styleArtifact2 = { genre: 'Rock', bpm: 140 };

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', styleArtifact1)
        );
      });

      await waitFor(() => {
        expect(result.current.style).toEqual(styleArtifact1);
      });

      // Send updated artifact
      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', styleArtifact2)
        );
      });

      await waitFor(() => {
        expect(result.current.style).toEqual(styleArtifact2);
      });
    });
  });

  describe('Event Filtering', () => {
    it('should only process end phase events', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styleArtifact = { genre: 'Pop' };

      // Send start event (should be ignored)
      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'start', styleArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.style).toBeNull();
      });

      // Send end event (should be captured)
      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', styleArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.style).toEqual(styleArtifact);
      });
    });

    it('should handle missing artifacts gracefully', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send event with no artifacts
      const event: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.STYLE,
        phase: 'end',
        metrics: {},
        issues: [],
        data: {},
      };

      act(() => {
        ws?.simulateMessage(event);
      });

      // Should not crash, artifacts should remain null
      await waitFor(() => {
        expect(result.current.style).toBeNull();
      });
    });
  });

  describe('allArtifacts', () => {
    it('should map artifacts by node name', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const planArtifact = { objectives: [] };
      const styleArtifact = { genre: 'Pop' };
      const validateArtifact = { passed: true };

      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.PLAN, 'end', planArtifact)
        );
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', styleArtifact)
        );
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.VALIDATE, 'end', validateArtifact)
        );
      });

      await waitFor(() => {
        expect(result.current.allArtifacts).toMatchObject({
          [WorkflowNode.PLAN]: planArtifact,
          [WorkflowNode.STYLE]: styleArtifact,
          [WorkflowNode.VALIDATE]: validateArtifact,
        });
      });
    });
  });

  describe('Loading State', () => {
    it('should reflect loading state from useWorkflowEvents', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      // Should become not loading when connected
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Memoization', () => {
    it('should memoize artifacts extraction', async () => {
      const { result, rerender } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialArtifacts = result.current.allArtifacts;

      // Rerender without new events
      rerender();

      // Should return same reference (memoized)
      expect(result.current.allArtifacts).toBe(initialArtifacts);
    });

    it('should recalculate when events change', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialArtifacts = result.current.allArtifacts;

      // Add new artifact
      act(() => {
        ws?.simulateMessage(
          createMockEvent('run-123', WorkflowNode.STYLE, 'end', { genre: 'Pop' })
        );
      });

      await waitFor(() => {
        expect(result.current.style).not.toBeNull();
      });

      // Should return different reference (recalculated)
      expect(result.current.allArtifacts).not.toBe(initialArtifacts);
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with output field instead of artifacts', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const styleArtifact = { genre: 'Pop' };

      const event: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.STYLE,
        phase: 'end',
        metrics: {},
        issues: [],
        data: {
          output: styleArtifact,
        },
      };

      act(() => {
        ws?.simulateMessage(event);
      });

      await waitFor(() => {
        expect(result.current.style).toEqual(styleArtifact);
      });
    });

    it('should handle null/undefined artifact data', async () => {
      const { result } = renderHook(() => useWorkflowArtifacts('run-123'), {
        wrapper: createWrapper(),
      });

      const ws = MockWebSocket.getLastInstance();
      ws?.simulateOpen();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const event: WorkflowEvent = {
        event_id: 'event-1',
        run_id: 'run-123',
        timestamp: new Date().toISOString(),
        node_name: WorkflowNode.STYLE,
        phase: 'end',
        metrics: {},
        issues: [],
        data: {
          artifacts: null,
          output: undefined,
        },
      };

      act(() => {
        ws?.simulateMessage(event);
      });

      // Should not crash
      await waitFor(() => {
        expect(result.current.style).toBeNull();
      });
    });
  });
});
