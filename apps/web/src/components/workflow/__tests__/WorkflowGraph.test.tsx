/**
 * WorkflowGraph Component Tests
 * Basic rendering tests for WorkflowGraph component
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkflowGraph } from '../WorkflowGraph';
import { WorkflowNode } from '@/types/api';
import type { WorkflowNodeState } from '../WorkflowGraph';

describe('WorkflowGraph', () => {
  const mockNodes: WorkflowNodeState[] = [
    {
      id: WorkflowNode.PLAN,
      status: 'success',
      durationMs: 2100,
    },
    {
      id: WorkflowNode.STYLE,
      status: 'running',
    },
    {
      id: WorkflowNode.LYRICS,
      status: 'pending',
    },
  ];

  it('renders workflow title', () => {
    render(<WorkflowGraph nodes={mockNodes} />);
    expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
  });

  it('displays all workflow nodes', () => {
    render(<WorkflowGraph nodes={mockNodes} />);

    // Check for node labels (rendered as uppercase)
    expect(screen.getByText('PLAN')).toBeInTheDocument();
    expect(screen.getByText('STYLE')).toBeInTheDocument();
    expect(screen.getByText('LYRICS')).toBeInTheDocument();
  });

  it('shows node status icons', () => {
    render(<WorkflowGraph nodes={mockNodes} />);

    // Check for status icons (success, running, pending)
    const container = screen.getByText('PLAN').closest('button');
    expect(container).toHaveTextContent('✓'); // Success icon

    const runningContainer = screen.getByText('STYLE').closest('button');
    expect(runningContainer).toHaveTextContent('⟳'); // Running icon
  });

  it('displays metrics when enabled', () => {
    render(<WorkflowGraph nodes={mockNodes} showMetrics />);

    // Check for duration display (2.1s for PLAN node)
    expect(screen.getByText('2.1s')).toBeInTheDocument();
  });

  it('shows legend', () => {
    render(<WorkflowGraph nodes={mockNodes} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
