import { describe, it, expect, beforeEach } from 'vitest';

import { useWorkflowsStore } from '../stores/workflowsStore';
import type { WorkflowRun, WorkflowEvent, ScoreSummary, ArtifactMap, WorkflowRunStatus } from '../types';

// ============================================================================
// Test Helpers
// ============================================================================

const mockWorkflowRun = (id: string, overrides?: Partial<WorkflowRun>): WorkflowRun => ({
  id,
  songId: 'song-1',
  status: 'running' as WorkflowRunStatus,
  currentNode: 'PLAN',
  progress: 0,
  startedAt: '2025-01-01T00:00:00Z',
  completedAt: null,
  error: null,
  ...overrides,
});

const mockWorkflowEvent = (node: string, phase: 'start' | 'end' | 'fail'): WorkflowEvent => ({
  node,
  phase,
  timestamp: new Date().toISOString(),
  duration: 1000,
  metrics: { score: 0.85 },
  issues: [],
});

const mockScoreSummary = (): ScoreSummary => ({
  hook_density: 0.8,
  singability: 0.9,
  rhyme_tightness: 0.85,
  section_completeness: 1.0,
  profanity_score: 1.0,
  total: 0.87,
});

// ============================================================================
// Workflows Store Tests
// ============================================================================

describe('WorkflowsStore', () => {
  beforeEach(() => {
    useWorkflowsStore.getState().clear();
  });

  describe('setRuns', () => {
    it('should set runs and update allIds', () => {
      const runs = [mockWorkflowRun('run-1'), mockWorkflowRun('run-2')];

      useWorkflowsStore.getState().setRuns(runs);

      const state = useWorkflowsStore.getState();
      expect(state.items.get('run-1')).toEqual(runs[0]);
      expect(state.items.get('run-2')).toEqual(runs[1]);
      expect(state.allIds).toEqual(['run-1', 'run-2']);
    });

    it('should clear loading and error states', () => {
      useWorkflowsStore.setState({ loading: true, error: new Error('test') });
      useWorkflowsStore.getState().setRuns([]);

      const state = useWorkflowsStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('setRunDetails', () => {
    it('should update existing run details', () => {
      const run = mockWorkflowRun('run-1');

      useWorkflowsStore.getState().setRuns([run]);
      useWorkflowsStore.getState().setRunDetails('run-1', {
        status: 'completed',
        progress: 100,
      });

      const state = useWorkflowsStore.getState();
      const updatedRun = state.items.get('run-1');
      expect(updatedRun?.status).toBe('completed');
      expect(updatedRun?.progress).toBe(100);
    });

    it('should not modify state for non-existent run', () => {
      const initialState = useWorkflowsStore.getState();

      useWorkflowsStore.getState().setRunDetails('non-existent', { progress: 50 });

      const newState = useWorkflowsStore.getState();
      expect(newState).toEqual(initialState);
    });
  });

  describe('setNodeEvent', () => {
    it('should add event to run events', () => {
      const event = mockWorkflowEvent('PLAN', 'start');

      useWorkflowsStore.getState().setNodeEvent('run-1', event);

      const state = useWorkflowsStore.getState();
      const events = state.nodeEvents.get('run-1');
      expect(events).toHaveLength(1);
      expect(events?.[0]).toEqual(event);
    });

    it('should maintain chronological order of events', () => {
      const event1 = mockWorkflowEvent('PLAN', 'start');
      const event2 = mockWorkflowEvent('PLAN', 'end');
      const event3 = mockWorkflowEvent('STYLE', 'start');

      useWorkflowsStore.getState().setNodeEvent('run-1', event1);
      useWorkflowsStore.getState().setNodeEvent('run-1', event2);
      useWorkflowsStore.getState().setNodeEvent('run-1', event3);

      const state = useWorkflowsStore.getState();
      const events = state.nodeEvents.get('run-1');
      expect(events).toHaveLength(3);
      expect(events?.[0].node).toBe('PLAN');
      expect(events?.[0].phase).toBe('start');
      expect(events?.[1].node).toBe('PLAN');
      expect(events?.[1].phase).toBe('end');
      expect(events?.[2].node).toBe('STYLE');
    });
  });

  describe('setScores', () => {
    it('should set scores for a run', () => {
      const scores = mockScoreSummary();

      useWorkflowsStore.getState().setScores('run-1', scores);

      const state = useWorkflowsStore.getState();
      expect(state.scores.get('run-1')).toEqual(scores);
    });

    it('should update existing scores', () => {
      const scores1 = mockScoreSummary();
      const scores2 = { ...mockScoreSummary(), total: 0.95 };

      useWorkflowsStore.getState().setScores('run-1', scores1);
      useWorkflowsStore.getState().setScores('run-1', scores2);

      const state = useWorkflowsStore.getState();
      expect(state.scores.get('run-1')?.total).toBe(0.95);
    });
  });

  describe('trackRunProgress', () => {
    it('should update progress and currentNode', () => {
      const run = mockWorkflowRun('run-1');

      useWorkflowsStore.getState().setRuns([run]);
      useWorkflowsStore.getState().trackRunProgress('run-1', 50, 'STYLE');

      const state = useWorkflowsStore.getState();
      const updatedRun = state.items.get('run-1');
      expect(updatedRun?.progress).toBe(50);
      expect(updatedRun?.currentNode).toBe('STYLE');
    });
  });

  describe('optimisticCancel', () => {
    it('should add run to cancelledRunIds', () => {
      useWorkflowsStore.getState().optimisticCancel('run-1');

      const state = useWorkflowsStore.getState();
      expect(state.cancelledRunIds.has('run-1')).toBe(true);
    });

    it('should update run status to cancelled', () => {
      const run = mockWorkflowRun('run-1', { status: 'running' });

      useWorkflowsStore.getState().setRuns([run]);
      useWorkflowsStore.getState().optimisticCancel('run-1');

      const state = useWorkflowsStore.getState();
      expect(state.items.get('run-1')?.status).toBe('cancelled');
    });
  });

  describe('clearRunDetails', () => {
    it('should clear all details for a run', () => {
      const event = mockWorkflowEvent('PLAN', 'start');
      const scores = mockScoreSummary();

      useWorkflowsStore.getState().setNodeEvent('run-1', event);
      useWorkflowsStore.getState().setScores('run-1', scores);
      useWorkflowsStore.setState({ activeRunId: 'run-1' });
      useWorkflowsStore.getState().clearRunDetails('run-1');

      const state = useWorkflowsStore.getState();
      expect(state.nodeEvents.get('run-1')).toBeUndefined();
      expect(state.scores.get('run-1')).toBeUndefined();
      expect(state.activeRunId).toBe(null);
    });
  });

  describe('clear', () => {
    it('should reset entire store to initial state', () => {
      const run = mockWorkflowRun('run-1');
      const event = mockWorkflowEvent('PLAN', 'start');

      useWorkflowsStore.getState().setRuns([run]);
      useWorkflowsStore.getState().setNodeEvent('run-1', event);
      useWorkflowsStore.getState().optimisticCancel('run-1');
      useWorkflowsStore.getState().clear();

      const state = useWorkflowsStore.getState();
      expect(state.items.size).toBe(0);
      expect(state.allIds).toEqual([]);
      expect(state.nodeEvents.size).toBe(0);
      expect(state.scores.size).toBe(0);
      expect(state.cancelledRunIds.size).toBe(0);
    });
  });
});
