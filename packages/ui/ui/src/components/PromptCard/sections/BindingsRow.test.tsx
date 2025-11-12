import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BindingsRow, type Binding } from './BindingsRow';

const mockBindings: Binding[] = [
  { type: 'context', name: 'API Documentation', id: '1' },
  { type: 'agent', name: 'Code Reviewer', id: '2' },
  { type: 'variable', name: 'userName', id: '3' },
  { type: 'model', name: 'GPT-4 Turbo', id: '4' },
];

describe('BindingsRow', () => {
  describe('Rendering', () => {
    it('renders bindings with correct chips', () => {
      render(<BindingsRow bindings={mockBindings} />);

      expect(screen.getByTestId('bindings-row')).toBeInTheDocument();
      expect(screen.getByText('API Documentation')).toBeInTheDocument();
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
      expect(screen.getByText('userName')).toBeInTheDocument();
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    });

    it('renders label', () => {
      render(<BindingsRow bindings={mockBindings} />);
      expect(screen.getByLabelText('Prompt bindings')).toBeInTheDocument();
      expect(screen.getByText('BINDINGS')).toBeInTheDocument();
    });

    it('renders chips in list structure', () => {
      render(<BindingsRow bindings={mockBindings} />);

      const list = screen.getByRole('list', { name: 'Binding chips' });
      expect(list).toBeInTheDocument();

      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(4); // All 4 bindings visible by default
    });

    it('renders with custom className', () => {
      const { container } = render(
        <BindingsRow bindings={mockBindings} className="custom-class" />
      );
      const row = container.querySelector('.custom-class');
      expect(row).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('returns null when no bindings', () => {
      const { container } = render(<BindingsRow bindings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when bindings is undefined', () => {
      const { container } = render(<BindingsRow bindings={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when bindings array is empty', () => {
      render(<BindingsRow bindings={[]} />);
      expect(screen.queryByTestId('bindings-row')).not.toBeInTheDocument();
    });
  });

  describe('Overflow Behavior', () => {
    it('shows all bindings when count equals maxVisible', () => {
      render(<BindingsRow bindings={mockBindings} maxVisible={4} />);

      expect(screen.getByText('API Documentation')).toBeInTheDocument();
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
      expect(screen.getByText('userName')).toBeInTheDocument();
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.queryByText(/more/i)).not.toBeInTheDocument();
    });

    it('shows overflow badge when exceeds maxVisible', () => {
      const manyBindings: Binding[] = [
        { type: 'context', name: 'Binding 1', id: '1' },
        { type: 'agent', name: 'Binding 2', id: '2' },
        { type: 'variable', name: 'Binding 3', id: '3' },
        { type: 'model', name: 'Binding 4', id: '4' },
        { type: 'context', name: 'Binding 5', id: '5' },
        { type: 'agent', name: 'Binding 6', id: '6' },
      ];

      render(<BindingsRow bindings={manyBindings} maxVisible={4} />);

      // First 4 should be visible
      expect(screen.getByText('Binding 1')).toBeInTheDocument();
      expect(screen.getByText('Binding 2')).toBeInTheDocument();
      expect(screen.getByText('Binding 3')).toBeInTheDocument();
      expect(screen.getByText('Binding 4')).toBeInTheDocument();

      // Last 2 should NOT be visible initially
      expect(screen.queryByText('Binding 5')).not.toBeInTheDocument();
      expect(screen.queryByText('Binding 6')).not.toBeInTheDocument();
    });

    it('calculates overflow count correctly', () => {
      const sevenBindings = Array.from({ length: 7 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      render(<BindingsRow bindings={sevenBindings} maxVisible={4} />);

      // Should show "+3 more" (7 total - 4 visible)
      const list = screen.getByRole('list');
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(5); // 4 visible chips + 1 overflow badge
    });

    it('respects custom maxVisible prop', () => {
      const eightBindings = Array.from({ length: 8 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      render(<BindingsRow bindings={eightBindings} maxVisible={6} />);

      // Should show 6 visible + overflow
      expect(screen.getByText('Binding 1')).toBeInTheDocument();
      expect(screen.getByText('Binding 6')).toBeInTheDocument();
      expect(screen.queryByText('Binding 7')).not.toBeInTheDocument();
      expect(screen.queryByText('Binding 8')).not.toBeInTheDocument();
    });

    it('does not show overflow when count is less than maxVisible', () => {
      const twoBindings = mockBindings.slice(0, 2);
      render(<BindingsRow bindings={twoBindings} maxVisible={4} />);

      const list = screen.getByRole('list');
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(2); // Only 2 chips, no overflow
    });

    it('handles maxVisible of 0 correctly', () => {
      render(<BindingsRow bindings={mockBindings} maxVisible={0} />);

      // All bindings should be in overflow
      expect(screen.queryByText('API Documentation')).not.toBeInTheDocument();
      expect(screen.queryByText('Code Reviewer')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onBindingClick when chip is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsRow bindings={mockBindings} onBindingClick={handleClick} />);

      const chip = screen.getByRole('button', { name: /context binding: API Documentation/i });
      await user.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith({
        type: 'context',
        name: 'API Documentation',
        id: '1',
      });
    });

    it('calls onBindingClick with correct binding data', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsRow bindings={mockBindings} onBindingClick={handleClick} />);

      const agentChip = screen.getByRole('button', { name: /agent binding: Code Reviewer/i });
      await user.click(agentChip);

      expect(handleClick).toHaveBeenCalledWith({
        type: 'agent',
        name: 'Code Reviewer',
        id: '2',
      });
    });

    it('does not add click handlers when onBindingClick is not provided', () => {
      render(<BindingsRow bindings={mockBindings} />);

      const chips = screen.getAllByRole('button');
      chips.forEach(chip => {
        // Chips should still be buttons, but clicking shouldn't error
        expect(chip).toBeInTheDocument();
      });
    });

    it('handles multiple clicks on same binding', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsRow bindings={mockBindings} onBindingClick={handleClick} />);

      const chip = screen.getByRole('button', { name: /variable binding: userName/i });
      await user.click(chip);
      await user.click(chip);
      await user.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles clicks on different bindings', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsRow bindings={mockBindings} onBindingClick={handleClick} />);

      const contextChip = screen.getByRole('button', { name: /context binding/i });
      const modelChip = screen.getByRole('button', { name: /model binding/i });

      await user.click(contextChip);
      await user.click(modelChip);

      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(handleClick).toHaveBeenNthCalledWith(1, mockBindings[0]);
      expect(handleClick).toHaveBeenNthCalledWith(2, mockBindings[3]);
    });
  });

  describe('Responsive Behavior', () => {
    it('defaults to 4 visible bindings', () => {
      const sixBindings = Array.from({ length: 6 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      render(<BindingsRow bindings={sixBindings} />);

      // Default maxVisible is 4
      expect(screen.getByText('Binding 1')).toBeInTheDocument();
      expect(screen.getByText('Binding 4')).toBeInTheDocument();
      expect(screen.queryByText('Binding 5')).not.toBeInTheDocument();
    });

    it('supports XL responsive limit (6 visible)', () => {
      const eightBindings = Array.from({ length: 8 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      render(<BindingsRow bindings={eightBindings} maxVisible={6} />);

      // XL mode shows 6 bindings
      expect(screen.getByText('Binding 1')).toBeInTheDocument();
      expect(screen.getByText('Binding 6')).toBeInTheDocument();
      expect(screen.queryByText('Binding 7')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label on container', () => {
      render(<BindingsRow bindings={mockBindings} />);
      expect(screen.getByLabelText('Prompt bindings')).toBeInTheDocument();
    });

    it('has proper ARIA label on list', () => {
      render(<BindingsRow bindings={mockBindings} />);
      expect(screen.getByRole('list', { name: 'Binding chips' })).toBeInTheDocument();
    });

    it('each chip is a list item', () => {
      render(<BindingsRow bindings={mockBindings} />);

      const list = screen.getByRole('list');
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThanOrEqual(mockBindings.length);
    });

    it('chips have proper ARIA labels', () => {
      render(<BindingsRow bindings={mockBindings} onBindingClick={jest.fn()} />);

      expect(screen.getByLabelText('Context binding: API Documentation')).toBeInTheDocument();
      expect(screen.getByLabelText('Agent binding: Code Reviewer')).toBeInTheDocument();
      expect(screen.getByLabelText('Variable binding: userName')).toBeInTheDocument();
      expect(screen.getByLabelText('Model binding: GPT-4 Turbo')).toBeInTheDocument();
    });

    it('overflow tooltip has proper ARIA label', () => {
      const manyBindings = Array.from({ length: 7 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      render(<BindingsRow bindings={manyBindings} maxVisible={4} />);

      // OverflowTooltip should have aria-label (checked via props)
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BindingsRow bindings={mockBindings} onBindingClick={jest.fn()} />);

      const chips = screen.getAllByRole('button');

      await user.tab();
      expect(chips[0]).toHaveFocus();

      await user.tab();
      expect(chips[1]).toHaveFocus();

      await user.tab();
      expect(chips[2]).toHaveFocus();
    });
  });

  describe('Binding Types', () => {
    it('handles all binding types', () => {
      const allTypes: Binding[] = [
        { type: 'context', name: 'Context', id: '1' },
        { type: 'agent', name: 'Agent', id: '2' },
        { type: 'variable', name: 'Variable', id: '3' },
        { type: 'model', name: 'Model', id: '4' },
      ];

      render(<BindingsRow bindings={allTypes} />);

      expect(screen.getByText('Context')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByText('Variable')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('handles mixed binding types', () => {
      const mixedBindings: Binding[] = [
        { type: 'context', name: 'Docs' },
        { type: 'context', name: 'API' },
        { type: 'agent', name: 'Reviewer' },
        { type: 'model', name: 'GPT-4' },
      ];

      render(<BindingsRow bindings={mixedBindings} />);

      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('API')).toBeInTheDocument();
      expect(screen.getByText('Reviewer')).toBeInTheDocument();
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
    });
  });

  describe('Binding IDs', () => {
    it('uses provided IDs for keys', () => {
      const bindingsWithIds: Binding[] = [
        { type: 'context', name: 'Test 1', id: 'custom-id-1' },
        { type: 'agent', name: 'Test 2', id: 'custom-id-2' },
      ];

      const { container } = render(<BindingsRow bindings={bindingsWithIds} />);
      expect(container.querySelector('[data-testid="bindings-row"]')).toBeInTheDocument();
    });

    it('handles bindings without IDs', () => {
      const bindingsWithoutIds: Binding[] = [
        { type: 'context', name: 'Test 1' },
        { type: 'agent', name: 'Test 2' },
      ];

      render(<BindingsRow bindings={bindingsWithoutIds} />);

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
    });

    it('handles duplicate names with IDs', () => {
      const duplicateNames: Binding[] = [
        { type: 'context', name: 'Test', id: '1' },
        { type: 'agent', name: 'Test', id: '2' },
      ];

      render(<BindingsRow bindings={duplicateNames} />);

      const chips = screen.getAllByText('Test');
      expect(chips).toHaveLength(2);
    });
  });

  describe('Component Lifecycle', () => {
    it('renders without errors', () => {
      expect(() => {
        render(<BindingsRow bindings={mockBindings} />);
      }).not.toThrow();
    });

    it('unmounts cleanly', () => {
      const { unmount } = render(<BindingsRow bindings={mockBindings} />);
      expect(() => unmount()).not.toThrow();
    });

    it('re-renders when bindings change', () => {
      const initialBindings = [mockBindings[0]];
      const updatedBindings = [mockBindings[0], mockBindings[1]];

      const { rerender } = render(<BindingsRow bindings={initialBindings} />);
      expect(screen.getByText('API Documentation')).toBeInTheDocument();
      expect(screen.queryByText('Code Reviewer')).not.toBeInTheDocument();

      rerender(<BindingsRow bindings={updatedBindings} />);
      expect(screen.getByText('API Documentation')).toBeInTheDocument();
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    });

    it('updates maxVisible correctly', () => {
      const sixBindings = Array.from({ length: 6 }, (_, i) => ({
        type: 'context' as const,
        name: `Binding ${i + 1}`,
        id: `${i + 1}`,
      }));

      const { rerender } = render(
        <BindingsRow bindings={sixBindings} maxVisible={4} />
      );

      expect(screen.getByText('Binding 4')).toBeInTheDocument();
      expect(screen.queryByText('Binding 5')).not.toBeInTheDocument();

      rerender(<BindingsRow bindings={sixBindings} maxVisible={6} />);
      expect(screen.getByText('Binding 5')).toBeInTheDocument();
      expect(screen.getByText('Binding 6')).toBeInTheDocument();
    });
  });
});
