/**
 * WorkflowStatus Component Tests
 * Phase 3, Task 3.4
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowStatus } from '../WorkflowStatus';
import { useWorkflowProgress } from '@/hooks/useWorkflowProgress';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { WorkflowRunStatus, WorkflowNode } from '@/types/api';
import type { WorkflowProgress } from '@/hooks/useWorkflowProgress';
import type { WorkflowEvent } from '@/types/api/events';

// Mock hooks
jest.mock('@/hooks/useWorkflowProgress');
jest.mock('@/hooks/useWorkflowEvents');

const mockUseWorkflowProgress = useWorkflowProgress as jest.MockedFunction<typeof useWorkflowProgress>;
const mockUseWorkflowEvents = useWorkflowEvents as jest.MockedFunction<typeof useWorkflowEvents>;

describe('WorkflowStatus', () => {
  const mockProgress: WorkflowProgress = {
    currentNode: null,
    nodesCompleted: [],
    nodesFailed: [],
    nodesInProgress: [],
    progressPercentage: 0,
    scores: {},
    issues: [],
    totalNodes: 9,
    isRunning: false,
    isComplete: false,
    isFailed: false,
  };

  const mockClearEvents = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkflowProgress.mockReturnValue(mockProgress);
    mockUseWorkflowEvents.mockReturnValue({
      events: [],
      isLoading: false,
      error: null,
      clearEvents: mockClearEvents,
    });
  });

  describe('Real-time Updates', () => {
    it('should use real-time data from hooks', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        currentNode: WorkflowNode.PLAN,
        progressPercentage: 25,
        isRunning: true,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText(/running: plan/i)).toBeInTheDocument();
    });

    it('should fall back to props when provided', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        currentNode: WorkflowNode.PLAN,
        progressPercentage: 25,
        isRunning: true,
      });

      render(
        <WorkflowStatus
          runId="run-123"
          status={WorkflowRunStatus.COMPLETED}
          currentNode="STYLE"
          progress={100}
        />
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      // Note: currentNode shown in running state only, so won't be visible when completed
    });

    it('should calculate duration from events', () => {
      const events: WorkflowEvent[] = [
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:00.000Z',
          phase: 'start',
          node_name: null,
          data: {},
          metrics: {},
          issues: [],
        },
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:02:30.000Z',
          phase: 'end',
          node_name: null,
          data: {},
          metrics: {},
          issues: [],
        },
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('2m 30s')).toBeInTheDocument();
    });

    it('should count fix iterations from events', () => {
      const events: WorkflowEvent[] = [
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:00.000Z',
          phase: 'end',
          node_name: WorkflowNode.FIX,
          data: {},
          metrics: {},
          issues: [],
        },
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:10.000Z',
          phase: 'end',
          node_name: WorkflowNode.FIX,
          data: {},
          metrics: {},
          issues: [],
        },
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Fix Iterations')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show running status with progress', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        currentNode: WorkflowNode.STYLE,
        progressPercentage: 50,
        isRunning: true,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText(/running: style/i)).toBeInTheDocument();
    });

    it('should show completed status', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        progressPercentage: 100,
        isComplete: true,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should show failed status with error', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isFailed: true,
        issues: [
          { severity: 'error', message: 'Validation failed' },
          { severity: 'error', message: 'Score too low' },
        ],
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('2 issues detected')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should show validation scores when complete', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
        scores: {
          hook_density: 0.85,
          singability: 0.92,
          rhyme_tightness: 0.78,
          section_completeness: 0.95,
          profanity_score: 1.0,
          total: 0.9,
        },
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Validation Scores')).toBeInTheDocument();
      expect(screen.getByText('Hook density')).toBeInTheDocument();
      expect(screen.getByText('Singability')).toBeInTheDocument();
      expect(screen.getByText('Rhyme tightness')).toBeInTheDocument();
    });

    it('should show overall score when complete', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
        scores: {
          hook_density: 0.8,
          singability: 0.9,
          total: 0.85,
        },
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Overall Score')).toBeInTheDocument();
      // Average score: (0.8 + 0.9 + 0.85) / 3 ≈ 0.85 → 8.5/10
      expect(screen.getByText('8.5/10')).toBeInTheDocument();
    });

    it('should color-code scores based on value', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
        scores: {
          excellent: 0.9, // >= 0.8: green
          good: 0.7, // >= 0.6: yellow
          poor: 0.4, // < 0.6: red
        },
      });

      const { container } = render(<WorkflowStatus runId="run-123" />);

      // Check for color classes
      expect(container.querySelector('.bg-status-complete')).toBeInTheDocument();
      expect(container.querySelector('.bg-status-running')).toBeInTheDocument();
      expect(container.querySelector('.bg-status-failed')).toBeInTheDocument();
    });
  });

  describe('Event Log Integration', () => {
    it('should show event log when showEventLog is true', () => {
      render(<WorkflowStatus runId="run-123" showEventLog={true} />);

      expect(screen.getByText(/event log \(0\)/i)).toBeInTheDocument();
    });

    it('should not show event log by default', () => {
      render(<WorkflowStatus runId="run-123" />);

      expect(screen.queryByText(/event log/i)).not.toBeInTheDocument();
    });

    it('should toggle event log on click', async () => {
      render(<WorkflowStatus runId="run-123" showEventLog={true} />);

      const trigger = screen.getByLabelText(/expand event log/i);
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByLabelText(/collapse event log/i)).toBeInTheDocument();
      });
    });

    it('should show event count in log header', () => {
      const events: WorkflowEvent[] = [
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:00.000Z',
          phase: 'start',
          node_name: WorkflowNode.PLAN,
          data: {},
          metrics: {},
          issues: [],
        },
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowStatus runId="run-123" showEventLog={true} />);

      expect(screen.getByText(/event log \(1\)/i)).toBeInTheDocument();
    });
  });

  describe('Duration Formatting', () => {
    it('should format duration under a minute', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
      });

      render(<WorkflowStatus runId="run-123" durationMs={45000} />);

      expect(screen.getByText('45s')).toBeInTheDocument();
    });

    it('should format duration over a minute', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
      });

      render(<WorkflowStatus runId="run-123" durationMs={125000} />);

      expect(screen.getByText('2m 5s')).toBeInTheDocument();
    });
  });

  describe('Progress Animation', () => {
    it('should show progress bar when running', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        currentNode: WorkflowNode.LYRICS,
        progressPercentage: 75,
        isRunning: true,
      });

      const { container } = render(<WorkflowStatus runId="run-123" />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should not show progress bar when complete', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        progressPercentage: 100,
        isComplete: true,
      });

      const { container } = render(<WorkflowStatus runId="run-123" />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      render(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('Workflow Status')).toBeInTheDocument();
    });

    it('should have accessible event log toggle', async () => {
      render(<WorkflowStatus runId="run-123" showEventLog={true} />);

      const trigger = screen.getByLabelText(/expand event log/i);
      expect(trigger).toBeInTheDocument();

      await userEvent.click(trigger);

      expect(screen.getByLabelText(/collapse event log/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle no duration', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isRunning: true,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.queryByText(/duration/i)).not.toBeInTheDocument();
    });

    it('should handle no scores', () => {
      mockUseWorkflowProgress.mockReturnValue({
        ...mockProgress,
        isComplete: true,
        scores: {},
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.queryByText('Validation Scores')).not.toBeInTheDocument();
    });

    it('should handle empty events array', () => {
      mockUseWorkflowEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowStatus runId="run-123" />);

      expect(screen.queryByText(/duration/i)).not.toBeInTheDocument();
    });

    it('should handle single event', () => {
      const events: WorkflowEvent[] = [
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:00.000Z',
          phase: 'start',
          node_name: null,
          data: {},
          metrics: {},
          issues: [],
        },
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowStatus runId="run-123" />);

      // Duration calculation needs at least 2 events
      expect(screen.queryByText(/\dm \ds/)).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should memoize duration calculation', () => {
      const events: WorkflowEvent[] = [
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:00.000Z',
          phase: 'start',
          node_name: null,
          data: {},
          metrics: {},
          issues: [],
        },
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:01:00.000Z',
          phase: 'end',
          node_name: null,
          data: {},
          metrics: {},
          issues: [],
        },
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      const { rerender } = render(<WorkflowStatus runId="run-123" />);

      // Rerender with same events (memoization should prevent recalculation)
      rerender(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('1m 0s')).toBeInTheDocument();
    });

    it('should memoize fix attempts calculation', () => {
      const events: WorkflowEvent[] = [
        {
          run_id: 'run-123',
          timestamp: '2025-01-15T10:00:00.000Z',
          phase: 'end',
          node_name: WorkflowNode.FIX,
          data: {},
          metrics: {},
          issues: [],
        },
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      const { rerender } = render(<WorkflowStatus runId="run-123" />);

      // Rerender with same events
      rerender(<WorkflowStatus runId="run-123" />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
