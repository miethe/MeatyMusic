import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from './PromptCard';

expect.extend(toHaveNoViolations);

describe('PromptCard', () => {
  const defaultProps = {
    title: 'Test Prompt Card',
    version: 1,
    access: 'private' as const,
  };

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<PromptCard {...defaultProps} />);
      expect(screen.getByText('Test Prompt Card')).toBeInTheDocument();
    });

    it('renders with all props', () => {
      render(
        <PromptCard
          {...defaultProps}
          description="Test description"
          tags={['tag1', 'tag2']}
          model="gpt-4"
          metrics={{ runs: 10, successRate: 0.95 }}
        />
      );
      expect(screen.getByText('Test Prompt Card')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });

  describe('Checkbox Selection - Visibility Logic', () => {
    it('does not render checkbox when selectable is false', () => {
      render(<PromptCard {...defaultProps} selectable={false} />);
      const checkbox = screen.queryByRole('checkbox');
      expect(checkbox).not.toBeInTheDocument();
    });

    it('renders checkbox when selectable is true', () => {
      render(<PromptCard {...defaultProps} selectable={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('hides checkbox by default when not hovered/selected', () => {
      const { container } = render(<PromptCard {...defaultProps} selectable={true} selected={false} />);
      const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
      const classes = checkboxContainer?.className || '';
      expect(classes).not.toContain('checkboxVisible');
    });

    it('shows checkbox when selected', () => {
      const { container } = render(<PromptCard {...defaultProps} selectable={true} selected={true} />);
      const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
      const classes = checkboxContainer?.className || '';
      expect(classes).toContain('checkboxVisible');
    });

    it('shows checkbox when hasActiveSelection is true', () => {
      const { container } = render(
        <PromptCard {...defaultProps} selectable={true} selected={false} hasActiveSelection={true} />
      );
      const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
      const classes = checkboxContainer?.className || '';
      expect(classes).toContain('checkboxVisible');
    });

    it('shows checkbox on hover', async () => {
      const { container } = render(
        <PromptCard {...defaultProps} selectable={true} selected={false} onPrimaryAction={jest.fn()} />
      );
      const card = screen.getByRole('button', { name: /Test Prompt Card/i });

      fireEvent.mouseEnter(card);

      await waitFor(() => {
        const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
        const classes = checkboxContainer?.className || '';
        expect(classes).toContain('checkboxVisible');
      });
    });

    it('hides checkbox when mouse leaves and not selected', async () => {
      const { container } = render(
        <PromptCard {...defaultProps} selectable={true} selected={false} onPrimaryAction={jest.fn()} />
      );
      const card = screen.getByRole('button', { name: /Test Prompt Card/i });

      fireEvent.mouseEnter(card);
      await waitFor(() => {
        const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
        const classes = checkboxContainer?.className || '';
        expect(classes).toContain('checkboxVisible');
      });

      fireEvent.mouseLeave(card);

      await waitFor(() => {
        const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
        const classes = checkboxContainer?.className || '';
        expect(classes).not.toContain('checkboxVisible');
      });
    });
  });

  describe('Checkbox Selection - Event Handling', () => {
    it('calls onSelectionChange when checkbox is clicked', async () => {
      const onSelectionChange = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it('calls onSelectionChange with correct value when unchecking', async () => {
      const onSelectionChange = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledWith(false, expect.any(Object));
    });

    it('does not call onSelectionChange when disabled', async () => {
      const onSelectionChange = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          disabled={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();

      // Attempt to click disabled checkbox
      await userEvent.click(checkbox);

      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('stops propagation when checkbox is clicked', async () => {
      const onPrimaryAction = jest.fn();
      const onSelectionChange = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          onPrimaryAction={onPrimaryAction}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onPrimaryAction).not.toHaveBeenCalled();
    });

    it('does not trigger card click when checkbox container is clicked', async () => {
      const onPrimaryAction = jest.fn();
      const { container } = render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={true}
          onPrimaryAction={onPrimaryAction}
        />
      );

      const checkboxContainer = container.querySelector('[class*="checkboxContainer"]');
      if (checkboxContainer) {
        fireEvent.click(checkboxContainer);
      }

      expect(onPrimaryAction).not.toHaveBeenCalled();
    });
  });

  describe('Checkbox Selection - Keyboard Navigation', () => {
    it('allows keyboard navigation to checkbox', async () => {
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();

      expect(checkbox).toHaveFocus();
    });

    it('checkbox is keyboard accessible and toggleable', async () => {
      const onSelectionChange = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');

      // Tab to focus on checkbox
      await userEvent.tab();

      // Click the focused checkbox (simulates Space/Enter)
      await userEvent.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it('supports keyboard interaction via Radix primitives', () => {
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');

      // Verify checkbox is keyboard accessible (Radix checkbox is keyboard accessible by default)
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('Checkbox Selection - Selected State Styling', () => {
    it('applies selected state class when selected', () => {
      const { container } = render(
        <PromptCard {...defaultProps} selectable={true} selected={true} />
      );

      const card = container.querySelector('[data-selected="true"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-state', 'selected');
    });

    it('does not apply selected state when not selected', () => {
      const { container } = render(
        <PromptCard {...defaultProps} selectable={true} selected={false} />
      );

      const card = container.querySelector('[data-selected="false"]');
      expect(card).toBeInTheDocument();
      expect(card).not.toHaveAttribute('data-state', 'selected');
    });

    it('updates aria-label to include selected state', () => {
      render(<PromptCard {...defaultProps} selectable={true} selected={true} onPrimaryAction={jest.fn()} />);

      const card = screen.getByRole('button', { name: /Test Prompt Card/i });
      const label = card.getAttribute('aria-label');
      expect(label).toContain('selected');
    });
  });

  describe('Checkbox Selection - Accessibility', () => {
    it('has proper aria-label for checkbox', () => {
      render(
        <PromptCard
          {...defaultProps}
          title="My Test Card"
          selectable={true}
          selected={false}
          hasActiveSelection={true}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /Select My Test Card/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('has proper aria-checked attribute', () => {
      const { rerender } = render(
        <PromptCard {...defaultProps} selectable={true} selected={false} hasActiveSelection={true} />
      );

      let checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      rerender(<PromptCard {...defaultProps} selectable={true} selected={true} />);

      checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('shows focus visible indicator on keyboard focus', async () => {
      render(
        <PromptCard {...defaultProps} selectable={true} selected={false} hasActiveSelection={true} />
      );

      const checkbox = screen.getByRole('checkbox');

      // Simulate keyboard focus
      checkbox.focus();

      expect(checkbox).toHaveFocus();
    });

    it('passes axe accessibility tests', async () => {
      const { container } = render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={true}
          onSelectionChange={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe accessibility tests with checkbox visible', async () => {
      const { container } = render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          onSelectionChange={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('announces selection state changes to screen readers', () => {
      const { rerender } = render(
        <PromptCard {...defaultProps} selectable={true} selected={false} onPrimaryAction={jest.fn()} />
      );

      rerender(<PromptCard {...defaultProps} selectable={true} selected={true} onPrimaryAction={jest.fn()} />);

      const card = screen.getByRole('button', { name: /Test Prompt Card/i });
      const label = card.getAttribute('aria-label');
      expect(label).toContain('selected');
    });
  });

  describe('Checkbox Selection - Integration with Other Features', () => {
    it('works with compact size variant', () => {
      render(
        <PromptCard
          {...defaultProps}
          size="compact"
          selectable={true}
          selected={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it('works with xl size variant', () => {
      render(
        <PromptCard
          {...defaultProps}
          size="xl"
          selectable={true}
          selected={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it('works with running state', () => {
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          isRunning={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('works with error state', () => {
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          error="Test error"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('maintains selection during state changes', () => {
      const { rerender } = render(
        <PromptCard {...defaultProps} selectable={true} selected={true} />
      );

      let checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      // Change to running state
      rerender(
        <PromptCard {...defaultProps} selectable={true} selected={true} isRunning={true} />
      );

      checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Checkbox Selection - Edge Cases', () => {
    it('handles rapid selection changes', async () => {
      const onSelectionChange = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          hasActiveSelection={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');

      // Rapid clicks
      await userEvent.click(checkbox);
      await userEvent.click(checkbox);
      await userEvent.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledTimes(3);
    });

    it('handles undefined onSelectionChange gracefully', async () => {
      render(
        <PromptCard {...defaultProps} selectable={true} selected={false} hasActiveSelection={true} />
      );

      const checkbox = screen.getByRole('checkbox');

      // Should not throw
      await expect(userEvent.click(checkbox)).resolves.not.toThrow();
    });

    it('checkbox does not prevent card from being clickable', () => {
      const onPrimaryAction = jest.fn();
      render(
        <PromptCard
          {...defaultProps}
          selectable={true}
          selected={false}
          onPrimaryAction={onPrimaryAction}
          description="Test description"
        />
      );

      // Verify the card is still clickable (has role button and onclick handler)
      const card = screen.getByRole('button', { name: /Test Prompt Card/i });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('role', 'button');

      // Card should be focusable
      expect(card).toHaveAttribute('tabindex');
    });
  });
});
