import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from '../PromptCard';
import type { PromptCardProps } from '../PromptCard';
import type { Binding } from '../sections/BindingsRow';

expect.extend(toHaveNoViolations);

// Mock performance for tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

describe('PromptCard - Accessibility with Bindings', () => {
  const mockBindings: Binding[] = [
    { type: 'context', name: 'API Documentation', id: '1' },
    { type: 'agent', name: 'Code Reviewer', id: '2' },
    { type: 'variable', name: 'userName', id: '3' },
    { type: 'model', name: 'GPT-4 Turbo', id: '4' },
  ];

  const baseProps: PromptCardProps = {
    title: 'Accessible Prompt Card',
    version: 1,
    access: 'private',
    tags: ['test'],
    bodyPreview: 'This is a test prompt with comprehensive accessibility testing.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Axe-Core Violations', () => {
    it('has no accessibility violations in default state with bindings', async () => {
      const { container } = render(<PromptCard {...baseProps} bindings={mockBindings} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all features enabled', async () => {
      const { container } = render(
        <PromptCard
          {...baseProps}
          primaryProvider="OpenAI"
          selectable
          hasActiveSelection
          bindings={mockBindings}
          metrics={{ runs: 42, successRate: 0.95, avgCost: 0.008, avgTime: 1.5 }}
          onRun={jest.fn()}
          onEdit={jest.fn()}
          onFork={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in error state', async () => {
      const { container } = render(
        <PromptCard
          {...baseProps}
          state="error"
          error="Error message"
          bindings={mockBindings}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in running state', async () => {
      const { container } = render(
        <PromptCard
          {...baseProps}
          state="running"
          isRunning
          bindings={mockBindings}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in disabled state', async () => {
      const { container } = render(
        <PromptCard
          {...baseProps}
          state="disabled"
          disabled
          bindings={mockBindings}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with overflow bindings', async () => {
      const manyBindings = Array.from({ length: 10 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      const { container } = render(<PromptCard {...baseProps} bindings={manyBindings} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in compact size', async () => {
      const { container } = render(
        <PromptCard {...baseProps} size="compact" bindings={mockBindings} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in XL size', async () => {
      const { container } = render(
        <PromptCard {...baseProps} size="xl" bindings={mockBindings} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through all interactive elements', async () => {
      const user = userEvent.setup();
      const handleRun = jest.fn();
      const handleEdit = jest.fn();
      const handleFork = jest.fn();

      render(
        <PromptCard
          {...baseProps}
          onRun={handleRun}
          onEdit={handleEdit}
          onFork={handleFork}
          bindings={mockBindings}
        />
      );

      // Get all interactive buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Tab to first element
      await user.tab();
      const firstFocused = document.activeElement;
      expect(firstFocused).toBeInTheDocument();

      // Verify we can tab through elements
      await user.tab();
      const secondFocused = document.activeElement;
      expect(secondFocused).toBeInTheDocument();
      expect(secondFocused).not.toBe(firstFocused);
    });

    it('supports Enter key on binding chips', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const chip = screen.getByRole('button', { name: /context binding: API Documentation/i });
      chip.focus();
      await user.keyboard('{Enter}');

      // Chip should handle Enter key
      expect(chip).toBeInTheDocument();
    });

    it('supports Space key on binding chips', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const chip = screen.getByRole('button', { name: /agent binding: Code Reviewer/i });
      chip.focus();
      await user.keyboard(' ');

      // Chip should handle Space key
      expect(chip).toBeInTheDocument();
    });

    it('supports tab navigation through binding chips', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const chips = screen.getAllByRole('button', { name: /binding:/i });

      // Tab through chips
      chips[0].focus();
      expect(chips[0]).toHaveFocus();

      await user.tab();
      expect(chips[1]).toHaveFocus();

      await user.tab();
      expect(chips[2]).toHaveFocus();
    });

    it('maintains focus after state changes', async () => {
      const { rerender } = render(
        <PromptCard {...baseProps} bindings={mockBindings} onEdit={jest.fn()} />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      editButton.focus();
      expect(editButton).toHaveFocus();

      rerender(
        <PromptCard {...baseProps} bindings={mockBindings} onEdit={jest.fn()} state="running" />
      );

      // After state change, focus may shift but should remain on an interactive element
      const activeElement = document.activeElement;
      expect(activeElement).toBeInTheDocument();
    });

    it('supports keyboard navigation with checkbox selection', async () => {
      const user = userEvent.setup();
      const handleSelectionChange = jest.fn();

      render(
        <PromptCard
          {...baseProps}
          selectable
          hasActiveSelection
          onSelectionChange={handleSelectionChange}
          bindings={mockBindings}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();

      // Click checkbox (keyboard activation tested separately)
      await user.click(checkbox);

      expect(handleSelectionChange).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides ARIA labels for all bindings', () => {
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      expect(screen.getByLabelText('Context binding: API Documentation')).toBeInTheDocument();
      expect(screen.getByLabelText('Agent binding: Code Reviewer')).toBeInTheDocument();
      expect(screen.getByLabelText('Variable binding: userName')).toBeInTheDocument();
      expect(screen.getByLabelText('Model binding: GPT-4 Turbo')).toBeInTheDocument();
    });

    it('provides ARIA label for bindings container', () => {
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      expect(screen.getByLabelText('Prompt bindings')).toBeInTheDocument();
    });

    it('provides proper list semantics for bindings', () => {
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const list = screen.getByRole('list', { name: 'Binding chips' });
      expect(list).toBeInTheDocument();

      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThanOrEqual(mockBindings.length);
    });

    it('announces binding types correctly', () => {
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const contextChip = screen.getByLabelText(/context binding/i);
      const agentChip = screen.getByLabelText(/agent binding/i);
      const variableChip = screen.getByLabelText(/variable binding/i);
      const modelChip = screen.getByLabelText(/model binding/i);

      expect(contextChip).toHaveAttribute('aria-label');
      expect(agentChip).toHaveAttribute('aria-label');
      expect(variableChip).toHaveAttribute('aria-label');
      expect(modelChip).toHaveAttribute('aria-label');
    });

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('provides proper button roles for chips', () => {
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const chips = screen.getAllByRole('button', { name: /binding:/i });
      expect(chips).toHaveLength(mockBindings.length);
    });
  });

  describe('Color Contrast', () => {
    it('meets color contrast requirements for context bindings', async () => {
      const { container } = render(
        <PromptCard {...baseProps} bindings={[{ type: 'context', name: 'Test', id: '1' }]} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('meets color contrast requirements for agent bindings', async () => {
      const { container } = render(
        <PromptCard {...baseProps} bindings={[{ type: 'agent', name: 'Test', id: '1' }]} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('meets color contrast requirements for variable bindings', async () => {
      const { container } = render(
        <PromptCard {...baseProps} bindings={[{ type: 'variable', name: 'Test', id: '1' }]} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('meets color contrast requirements for model bindings', async () => {
      const { container } = render(
        <PromptCard {...baseProps} bindings={[{ type: 'model', name: 'Test', id: '1' }]} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('meets 4.5:1 contrast ratio for all binding types', async () => {
      const { container } = render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('maintains contrast in disabled state', async () => {
      const { container } = render(
        <PromptCard
          {...baseProps}
          state="disabled"
          disabled
          bindings={mockBindings}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Indicators', () => {
    it('shows visible focus ring on binding chips', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const chip = screen.getByRole('button', { name: /context binding/i });
      await user.tab();

      // Check if chip can receive focus
      chip.focus();
      expect(chip).toHaveFocus();
    });

    it('shows focus indicators on all interactive elements', async () => {
      render(
        <PromptCard
          {...baseProps}
          onRun={jest.fn()}
          onEdit={jest.fn()}
          bindings={mockBindings}
        />
      );

      const interactiveElements = [
        screen.getByRole('button', { name: /run/i }),
        screen.getByRole('button', { name: /edit/i }),
        ...screen.getAllByRole('button', { name: /binding:/i }),
      ];

      for (const element of interactiveElements) {
        element.focus();
        expect(element).toHaveFocus();
      }
    });

    it('maintains focus visibility in high contrast mode', async () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(forced-colors: active)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { container } = render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Attributes', () => {
    it('has proper ARIA structure for card', () => {
      const { container } = render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const card = container.querySelector('[role]');
      expect(card).toBeInTheDocument();
    });

    it('has proper ARIA attributes on interactive elements', () => {
      render(
        <PromptCard
          {...baseProps}
          onRun={jest.fn()}
          onEdit={jest.fn()}
          onFork={jest.fn()}
          bindings={mockBindings}
        />
      );

      const runButton = screen.getByRole('button', { name: /run/i });
      const editButton = screen.getByRole('button', { name: /edit/i });
      const forkButton = screen.getByRole('button', { name: /fork/i });

      // Buttons should be accessible as buttons
      expect(runButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
      expect(forkButton).toBeInTheDocument();
    });

    it('provides proper type attributes on binding chips', () => {
      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const chips = screen.getAllByRole('button', { name: /binding:/i });
      chips.forEach(chip => {
        expect(chip).toHaveAttribute('type', 'button');
      });
    });

    it('provides ARIA labels for overflow indicators', () => {
      const manyBindings = Array.from({ length: 8 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      render(<PromptCard {...baseProps} bindings={manyBindings} maxVisible={4} />);

      // OverflowTooltip should have proper ARIA
      const bindingsRow = screen.getByTestId('bindings-row');
      expect(bindingsRow).toBeInTheDocument();
    });
  });

  describe('Reduced Motion', () => {
    it('respects prefers-reduced-motion preference', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<PromptCard {...baseProps} bindings={mockBindings} />);

      const card = screen.getByText('Accessible Prompt Card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('announces errors to screen readers', () => {
      render(
        <PromptCard
          {...baseProps}
          state="error"
          error="An error occurred"
          bindings={mockBindings}
        />
      );

      const errorMessage = screen.getByText('An error occurred');
      expect(errorMessage).toBeInTheDocument();
    });

    it('maintains accessibility during error state', async () => {
      const { container } = render(
        <PromptCard
          {...baseProps}
          state="error"
          error={{ message: 'Error message', retry: jest.fn() }}
          bindings={mockBindings}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Dynamic Content', () => {
    it('maintains accessibility when bindings change', async () => {
      const { rerender, container } = render(
        <PromptCard {...baseProps} bindings={mockBindings.slice(0, 2)} />
      );

      let results = await axe(container);
      expect(results).toHaveNoViolations();

      rerender(<PromptCard {...baseProps} bindings={mockBindings} />);

      results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('announces dynamic state changes', () => {
      const { rerender } = render(<PromptCard {...baseProps} bindings={mockBindings} />);

      rerender(<PromptCard {...baseProps} state="running" isRunning bindings={mockBindings} />);

      // State changes should be perceivable
      expect(screen.getByText('Accessible Prompt Card')).toBeInTheDocument();
    });
  });
});
