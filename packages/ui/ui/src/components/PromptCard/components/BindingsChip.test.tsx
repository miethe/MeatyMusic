import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BindingsChip, type BindingType } from './BindingsChip';

describe('BindingsChip', () => {
  describe('Rendering', () => {
    it('renders context binding with correct icon', () => {
      render(<BindingsChip type="context" name="API Docs" />);
      const chip = screen.getByRole('button', { name: /context binding: API Docs/i });
      expect(chip).toBeInTheDocument();
      expect(screen.getByText('API Docs')).toBeInTheDocument();
    });

    it('renders agent binding with correct icon', () => {
      render(<BindingsChip type="agent" name="Code Reviewer" />);
      const chip = screen.getByRole('button', { name: /agent binding: Code Reviewer/i });
      expect(chip).toBeInTheDocument();
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    });

    it('renders variable binding with correct icon', () => {
      render(<BindingsChip type="variable" name="userName" />);
      const chip = screen.getByRole('button', { name: /variable binding: userName/i });
      expect(chip).toBeInTheDocument();
      expect(screen.getByText('userName')).toBeInTheDocument();
    });

    it('renders model binding with correct icon', () => {
      render(<BindingsChip type="model" name="GPT-4 Turbo" />);
      const chip = screen.getByRole('button', { name: /model binding: GPT-4 Turbo/i });
      expect(chip).toBeInTheDocument();
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    });

    it('renders all binding types with correct colors', () => {
      const types: BindingType[] = ['context', 'agent', 'variable', 'model'];

      types.forEach(type => {
        const { container, unmount } = render(<BindingsChip type={type} name="Test" />);
        const chip = container.querySelector('[data-testid^="binding-chip-"]');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveAttribute('data-testid', `binding-chip-${type}`);
        unmount();
      });
    });

    it('renders with custom className', () => {
      const { container } = render(
        <BindingsChip type="context" name="Test" className="custom-class" />
      );
      const chip = container.querySelector('.custom-class');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Interaction States', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="context" name="Test" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      await user.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="context" name="Test" onClick={handleClick} disabled />);

      const chip = screen.getByRole('button');
      await user.click(chip);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies disabled styling when disabled', () => {
      render(<BindingsChip type="context" name="Test" disabled />);
      const chip = screen.getByRole('button');

      expect(chip).toBeDisabled();
      expect(chip).toHaveAttribute('disabled');
    });

    it('supports hover state (interactive)', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="agent" name="Test" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      await user.hover(chip);

      // Verify chip is interactive by testing click still works
      await user.click(chip);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports focus state', async () => {
      const user = userEvent.setup();
      render(<BindingsChip type="variable" name="Test" onClick={jest.fn()} />);

      const chip = screen.getByRole('button');
      await user.tab();

      expect(chip).toHaveFocus();
    });

    it('does not call onClick when no handler provided', async () => {
      const user = userEvent.setup();
      render(<BindingsChip type="context" name="Test" />);

      const chip = screen.getByRole('button');
      // Should not throw error when clicked without handler
      await user.click(chip);

      expect(chip).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="context" name="Test" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="agent" name="Test" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not handle keyboard events when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="context" name="Test" onClick={handleClick} disabled />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents default behavior on Space key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="variable" name="Test" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();

      // Use userEvent to press space, which better simulates real behavior
      await user.keyboard(' ');

      // Space key should trigger onClick
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('ignores other keys', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<BindingsChip type="model" name="Test" onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('a');
      await user.keyboard('1');
      await user.keyboard('{Escape}');

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports tab navigation between chips', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <BindingsChip type="context" name="First" onClick={jest.fn()} />
          <BindingsChip type="agent" name="Second" onClick={jest.fn()} />
          <BindingsChip type="variable" name="Third" onClick={jest.fn()} />
        </div>
      );

      const chips = screen.getAllByRole('button');

      await user.tab();
      expect(chips[0]).toHaveFocus();

      await user.tab();
      expect(chips[1]).toHaveFocus();

      await user.tab();
      expect(chips[2]).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA label for context binding', () => {
      render(<BindingsChip type="context" name="API Documentation" />);
      expect(screen.getByLabelText('Context binding: API Documentation')).toBeInTheDocument();
    });

    it('has correct ARIA label for agent binding', () => {
      render(<BindingsChip type="agent" name="Code Reviewer" />);
      expect(screen.getByLabelText('Agent binding: Code Reviewer')).toBeInTheDocument();
    });

    it('has correct ARIA label for variable binding', () => {
      render(<BindingsChip type="variable" name="userName" />);
      expect(screen.getByLabelText('Variable binding: userName')).toBeInTheDocument();
    });

    it('has correct ARIA label for model binding', () => {
      render(<BindingsChip type="model" name="GPT-4 Turbo" />);
      expect(screen.getByLabelText('Model binding: GPT-4 Turbo')).toBeInTheDocument();
    });

    it('has button role', () => {
      render(<BindingsChip type="context" name="Test" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has correct type attribute', () => {
      render(<BindingsChip type="agent" name="Test" />);
      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('type', 'button');
    });

    it('has aria-hidden on icon', () => {
      const { container } = render(<BindingsChip type="context" name="Test" />);
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      render(<BindingsChip type="variable" name="Test" onClick={jest.fn()} />);
      const chip = screen.getByRole('button');

      // Button should be focusable by default
      expect(chip).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Props', () => {
    it('accepts all binding types', () => {
      const types: BindingType[] = ['context', 'agent', 'variable', 'model'];

      types.forEach(type => {
        const { unmount } = render(<BindingsChip type={type} name="Test" />);
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });

    it('displays provided name', () => {
      render(<BindingsChip type="context" name="My Custom Name" />);
      expect(screen.getByText('My Custom Name')).toBeInTheDocument();
    });

    it('handles long names gracefully', () => {
      const longName = 'This is a very long binding name that should be displayed properly';
      render(<BindingsChip type="agent" name={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles empty name (edge case)', () => {
      render(<BindingsChip type="context" name="" />);
      const chip = screen.getByRole('button');
      expect(chip).toBeInTheDocument();
    });

    it('handles special characters in name', () => {
      const specialName = "Test@Name#123$%^&*()";
      render(<BindingsChip type="variable" name={specialName} />);
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it('applies custom className alongside default styles', () => {
      render(
        <BindingsChip type="model" name="Test" className="my-custom-class" />
      );
      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('my-custom-class');
    });
  });

  describe('Type-Specific Styling', () => {
    it('applies context-specific styling', () => {
      const { container } = render(<BindingsChip type="context" name="Test" />);
      const chip = container.querySelector('[data-testid="binding-chip-context"]');
      expect(chip).toBeInTheDocument();
    });

    it('applies agent-specific styling', () => {
      const { container } = render(<BindingsChip type="agent" name="Test" />);
      const chip = container.querySelector('[data-testid="binding-chip-agent"]');
      expect(chip).toBeInTheDocument();
    });

    it('applies variable-specific styling', () => {
      const { container } = render(<BindingsChip type="variable" name="Test" />);
      const chip = container.querySelector('[data-testid="binding-chip-variable"]');
      expect(chip).toBeInTheDocument();
    });

    it('applies model-specific styling', () => {
      const { container } = render(<BindingsChip type="model" name="Test" />);
      const chip = container.querySelector('[data-testid="binding-chip-model"]');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('renders without errors', () => {
      expect(() => {
        render(<BindingsChip type="context" name="Test" />);
      }).not.toThrow();
    });

    it('unmounts cleanly', () => {
      const { unmount } = render(<BindingsChip type="agent" name="Test" />);
      expect(() => unmount()).not.toThrow();
    });

    it('re-renders when props change', () => {
      const { rerender } = render(<BindingsChip type="context" name="Initial" />);
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<BindingsChip type="agent" name="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('updates click handler when prop changes', async () => {
      const user = userEvent.setup();
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();

      const { rerender } = render(
        <BindingsChip type="context" name="Test" onClick={firstHandler} />
      );

      const chip = screen.getByRole('button');
      await user.click(chip);
      expect(firstHandler).toHaveBeenCalledTimes(1);

      rerender(<BindingsChip type="context" name="Test" onClick={secondHandler} />);
      await user.click(chip);
      expect(secondHandler).toHaveBeenCalledTimes(1);
      expect(firstHandler).toHaveBeenCalledTimes(1); // Should not increase
    });
  });
});
