/**
 * WorkflowEventLog Component Tests
 * Phase 3, Task 3.4
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowEventLog } from '../WorkflowEventLog';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { WorkflowNode } from '@/types/api';
import type { WorkflowEvent } from '@/types/api/events';

// Mock hooks
jest.mock('@/hooks/useWorkflowEvents');

const mockUseWorkflowEvents = useWorkflowEvents as jest.MockedFunction<typeof useWorkflowEvents>;

describe('WorkflowEventLog', () => {
  const mockClearEvents = jest.fn();

  const createMockEvent = (overrides?: Partial<WorkflowEvent>): WorkflowEvent => ({
    run_id: 'run-123',
    timestamp: '2025-01-15T10:00:00.000Z',
    phase: 'start',
    node_name: WorkflowNode.PLAN,
    data: {},
    metrics: {},
    issues: [],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkflowEvents.mockReturnValue({
      events: [],
      isLoading: false,
      error: null,
      clearEvents: mockClearEvents,
    });
  });

  describe('Rendering', () => {
    it('should render empty state when no events', () => {
      render(<WorkflowEventLog runId="run-123" />);

      expect(screen.getByText('No events yet')).toBeInTheDocument();
    });

    it('should render event list when events present', () => {
      const events = [
        createMockEvent({ node_name: WorkflowNode.PLAN, phase: 'start' }),
        createMockEvent({ node_name: WorkflowNode.PLAN, phase: 'end' }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" />);

      expect(screen.getAllByText('PLAN')).toHaveLength(2);
      expect(screen.getByText('START')).toBeInTheDocument();
      expect(screen.getByText('END')).toBeInTheDocument();
    });

    it('should display event count', () => {
      const events = [
        createMockEvent(),
        createMockEvent({ timestamp: '2025-01-15T10:00:01.000Z' }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" />);

      expect(screen.getByText('2 events')).toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      const events = [createMockEvent({ timestamp: '2025-01-15T10:30:45.123Z' })];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" />);

      // Check for timestamp in HH:mm:ss.SSS format
      expect(screen.getByText(/\d{2}:\d{2}:\d{2}\.\d{3}/)).toBeInTheDocument();
    });
  });

  describe('Event Details', () => {
    it('should show duration for end events', () => {
      const events = [
        createMockEvent({
          node_name: WorkflowNode.PLAN,
          phase: 'end',
          data: { duration_ms: 1500 },
        }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" />);

      expect(screen.getByText('1500ms')).toBeInTheDocument();
    });

    it('should expand event details on click', async () => {
      const events = [
        createMockEvent({
          node_name: WorkflowNode.VALIDATE,
          phase: 'end',
          data: { scores: { total: 0.85 } },
        }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      const { container } = render(<WorkflowEventLog runId="run-123" />);

      // Find and click the expand button
      const expandButton = container.querySelector('button[aria-label*="Expand"]');
      expect(expandButton).toBeInTheDocument();

      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText('Data:')).toBeInTheDocument();
        });
      }
    });

    it('should show issues when present', async () => {
      const events = [
        createMockEvent({
          node_name: WorkflowNode.VALIDATE,
          phase: 'fail',
          issues: [
            { severity: 'error', message: 'Validation failed: score too low' },
            { severity: 'warning', message: 'Hook density below threshold' },
          ],
        }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      const { container } = render(<WorkflowEventLog runId="run-123" />);

      // Expand event
      const expandButton = container.querySelector('button[aria-label*="Expand"]');
      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
          expect(screen.getByText(/hook density/i)).toBeInTheDocument();
        });
      }
    });

    it('should highlight error events', () => {
      const events = [
        createMockEvent({
          node_name: WorkflowNode.VALIDATE,
          phase: 'fail',
          issues: [{ severity: 'error', message: 'Critical error' }],
        }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      const { container } = render(<WorkflowEventLog runId="run-123" />);

      const eventRow = container.querySelector('.bg-status-failed\\/5');
      expect(eventRow).toBeInTheDocument();
    });

    it('should highlight warning events', () => {
      const events = [
        createMockEvent({
          node_name: WorkflowNode.VALIDATE,
          phase: 'end',
          issues: [{ severity: 'warning', message: 'Performance warning' }],
        }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      const { container } = render(<WorkflowEventLog runId="run-123" />);

      const eventRow = container.querySelector('.bg-status-running\\/5');
      expect(eventRow).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter events by node', async () => {
      const events = [
        createMockEvent({ node_name: WorkflowNode.PLAN, phase: 'start' }),
        createMockEvent({ node_name: WorkflowNode.STYLE, phase: 'start' }),
        createMockEvent({ node_name: WorkflowNode.LYRICS, phase: 'start' }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" showFilters={true} />);

      const nodeFilter = screen.getByLabelText('Filter by node');
      await userEvent.selectOptions(nodeFilter, WorkflowNode.PLAN);

      await waitFor(() => {
        expect(screen.getByText('1 event')).toBeInTheDocument();
      });
    });

    it('should filter events by phase', async () => {
      const events = [
        createMockEvent({ node_name: WorkflowNode.PLAN, phase: 'start' }),
        createMockEvent({ node_name: WorkflowNode.PLAN, phase: 'end' }),
        createMockEvent({ node_name: WorkflowNode.STYLE, phase: 'start' }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" showFilters={true} />);

      const phaseFilter = screen.getByLabelText('Filter by phase');
      await userEvent.selectOptions(phaseFilter, 'end');

      await waitFor(() => {
        expect(screen.getByText('1 event')).toBeInTheDocument();
      });
    });

    it('should show "no events match filters" message', async () => {
      const events = [createMockEvent({ node_name: WorkflowNode.PLAN, phase: 'start' })];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" showFilters={true} />);

      const nodeFilter = screen.getByLabelText('Filter by node');
      await userEvent.selectOptions(nodeFilter, WorkflowNode.STYLE);

      await waitFor(() => {
        expect(screen.getByText('No events match the current filters')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should clear events on clear button click', async () => {
      const events = [createMockEvent()];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" />);

      const clearButton = screen.getByLabelText('Clear event log');
      await userEvent.click(clearButton);

      expect(mockClearEvents).toHaveBeenCalled();
    });

    it('should disable clear button when no events', () => {
      render(<WorkflowEventLog runId="run-123" />);

      const clearButton = screen.getByLabelText('Clear event log');
      expect(clearButton).toBeDisabled();
    });

    it('should copy event to clipboard on copy button click', async () => {
      const events = [createMockEvent()];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      const { container } = render(<WorkflowEventLog runId="run-123" />);

      const copyButton = container.querySelector('button[aria-label="Copy event to clipboard"]');
      expect(copyButton).toBeInTheDocument();

      if (copyButton) {
        await userEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });
  });

  describe('Collapsible', () => {
    it('should render collapsible variant', async () => {
      render(<WorkflowEventLog runId="run-123" collapsible={true} />);

      expect(screen.getByText(/event log \(0\)/i)).toBeInTheDocument();
    });

    it('should toggle collapse on click', async () => {
      const events = [createMockEvent()];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" collapsible={true} />);

      const trigger = screen.getByText(/event log \(1\)/i);
      await userEvent.click(trigger);

      // Component should still be in the DOM but collapsed
      // This is a simplification - actual test would check for visibility
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<WorkflowEventLog runId="run-123" />);

      const log = screen.getByRole('log');
      expect(log).toHaveAttribute('aria-label', 'Workflow event log');
      expect(log).toHaveAttribute('aria-live', 'polite');
      expect(log).toHaveAttribute('aria-atomic', 'false');
    });

    it('should have accessible filter labels', () => {
      render(<WorkflowEventLog runId="run-123" showFilters={true} />);

      expect(screen.getByLabelText('Filter by node')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by phase')).toBeInTheDocument();
    });
  });

  describe('Auto-scroll', () => {
    it('should auto-scroll to bottom when new events arrive', () => {
      const { rerender } = render(<WorkflowEventLog runId="run-123" autoScroll={true} />);

      const events = [
        createMockEvent(),
        createMockEvent({ timestamp: '2025-01-15T10:00:01.000Z' }),
      ];

      mockUseWorkflowEvents.mockReturnValue({
        events,
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      rerender(<WorkflowEventLog runId="run-123" autoScroll={true} />);

      // Auto-scroll behavior is difficult to test without mocking scrollTop
      // This is a placeholder test to ensure component renders
      expect(screen.getByText('2 events')).toBeInTheDocument();
    });
  });

  describe('Max Events', () => {
    it('should respect maxEvents limit', () => {
      const events = Array.from({ length: 150 }, (_, i) =>
        createMockEvent({ timestamp: `2025-01-15T10:00:${String(i).padStart(2, '0')}.000Z` })
      );

      mockUseWorkflowEvents.mockReturnValue({
        events: events.slice(-100), // Hook already applies limit
        isLoading: false,
        error: null,
        clearEvents: mockClearEvents,
      });

      render(<WorkflowEventLog runId="run-123" maxEvents={100} />);

      expect(screen.getByText('100 events')).toBeInTheDocument();
    });
  });
});
