import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

expect.extend(toHaveNoViolations);

const mockSegments = [
  { value: 'mine', label: 'Mine' },
  { value: 'team', label: 'Team' },
  { value: 'public', label: 'Public' },
];

describe('SegmentedControl', () => {
  describe('Rendering', () => {
    it('renders correctly with all segments', () => {
      render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      expect(screen.getByText('Mine')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('renders with two segments', () => {
      render(
        <SegmentedControl
          value="list"
          onValueChange={jest.fn()}
          segments={[
            { value: 'list', label: 'List' },
            { value: 'grid', label: 'Grid' },
          ]}
          aria-label="View mode"
        />
      );

      expect(screen.getByText('List')).toBeInTheDocument();
      expect(screen.getByText('Grid')).toBeInTheDocument();
    });

    it('applies active state to selected segment', () => {
      render(
        <SegmentedControl
          value="team"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const teamButton = screen.getByRole('tab', { name: /team/i });
      expect(teamButton).toHaveAttribute('aria-selected', 'true');
    });

    it('renders active indicator for selected segment', () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const activeIndicators = container.querySelectorAll('.bg-mp-primary');
      expect(activeIndicators.length).toBe(1);
    });
  });

  describe('Interaction', () => {
    it('calls onValueChange when segment is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const teamButton = screen.getByRole('tab', { name: /team/i });
      await user.click(teamButton);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('team');
      });
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not call onValueChange when clicking active segment', () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      fireEvent.click(mineButton);

      // Radix Tabs doesn't trigger change for already active tab
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not trigger onValueChange for disabled segments', () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={[
            { value: 'mine', label: 'Mine' },
            { value: 'team', label: 'Team', disabled: true },
            { value: 'public', label: 'Public' },
          ]}
          aria-label="Test control"
        />
      );

      const teamButton = screen.getByRole('tab', { name: /team/i });
      expect(teamButton).toBeDisabled();
      fireEvent.click(teamButton);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Tab key to focus control', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <SegmentedControl
            value="mine"
            onValueChange={jest.fn()}
            segments={mockSegments}
            aria-label="Test control"
          />
          <button>After</button>
        </div>
      );

      const beforeButton = screen.getByText('Before');
      beforeButton.focus();

      await user.tab();

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      expect(mineButton).toHaveFocus();
    });

    it('supports Arrow Right to navigate to next segment', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      mineButton.focus();

      fireEvent.keyDown(mineButton, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('team');
      });
    });

    it('supports Arrow Left to navigate to previous segment', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="team"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const teamButton = screen.getByRole('tab', { name: /team/i });
      teamButton.focus();

      fireEvent.keyDown(teamButton, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('mine');
      });
    });

    it('supports Home key to jump to first segment', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="public"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const publicButton = screen.getByRole('tab', { name: /public/i });
      publicButton.focus();

      fireEvent.keyDown(publicButton, { key: 'Home' });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('mine');
      });
    });

    it('supports End key to jump to last segment', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      mineButton.focus();

      fireEvent.keyDown(mineButton, { key: 'End' });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('public');
      });
    });

    it('wraps navigation from last to first with Arrow Right', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="public"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const publicButton = screen.getByRole('tab', { name: /public/i });
      publicButton.focus();

      fireEvent.keyDown(publicButton, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('mine');
      });
    });

    it('wraps navigation from first to last with Arrow Left', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      mineButton.focus();

      fireEvent.keyDown(mineButton, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('public');
      });
    });
  });

  describe('Disabled State', () => {
    it('renders disabled segments with correct attributes', () => {
      render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={[
            { value: 'mine', label: 'Mine' },
            { value: 'team', label: 'Team', disabled: true },
            { value: 'public', label: 'Public' },
          ]}
          aria-label="Test control"
        />
      );

      const teamButton = screen.getByRole('tab', { name: /team/i });
      expect(teamButton).toBeDisabled();
      expect(teamButton).toHaveClass('disabled:pointer-events-none');
      expect(teamButton).toHaveClass('disabled:opacity-50');
    });

    it('skips disabled segments with keyboard navigation', async () => {
      const handleChange = jest.fn();
      render(
        <SegmentedControl
          value="mine"
          onValueChange={handleChange}
          segments={[
            { value: 'mine', label: 'Mine' },
            { value: 'team', label: 'Team', disabled: true },
            { value: 'public', label: 'Public' },
          ]}
          aria-label="Test control"
        />
      );

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      mineButton.focus();

      fireEvent.keyDown(mineButton, { key: 'ArrowRight' });

      // Should skip disabled 'team' and go to 'public'
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('public');
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          size="sm"
          aria-label="Test control"
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass('h-8');
    });

    it('renders medium size correctly (default)', () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass('h-10');
    });

    it('renders large size correctly', () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          size="lg"
          aria-label="Test control"
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass('h-12');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('has proper aria-label on tablist', () => {
      render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Prompt scope filter"
        />
      );

      expect(screen.getByRole('tablist')).toHaveAttribute(
        'aria-label',
        'Prompt scope filter'
      );
    });

    it('has proper aria-selected on active tab', () => {
      render(
        <SegmentedControl
          value="team"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const teamButton = screen.getByRole('tab', { name: /team/i });
      expect(teamButton).toHaveAttribute('aria-selected', 'true');

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      expect(mineButton).toHaveAttribute('aria-selected', 'false');
    });

    it('has focus ring styles', () => {
      render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      const mineButton = screen.getByRole('tab', { name: /mine/i });
      expect(mineButton).toHaveClass('focus-visible:outline-none');
      expect(mineButton).toHaveClass('focus-visible:ring-2');
      expect(mineButton).toHaveClass('focus-visible:ring-offset-2');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      // Radix Tabs adds aria-controls referencing non-existent content panels
      // This is expected when using Tabs as a segmented control
      const results = await axe(container, {
        rules: {
          'aria-valid-attr-value': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with disabled segments', async () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={[
            { value: 'mine', label: 'Mine' },
            { value: 'team', label: 'Team', disabled: true },
            { value: 'public', label: 'Public' },
          ]}
          aria-label="Test control"
        />
      );

      const results = await axe(container, {
        rules: {
          'aria-valid-attr-value': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all sizes', async () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      for (const size of sizes) {
        const { container } = render(
          <SegmentedControl
            value="mine"
            onValueChange={jest.fn()}
            segments={mockSegments}
            size={size}
            aria-label={`${size} control`}
          />
        );

        const results = await axe(container, {
          rules: {
            'aria-valid-attr-value': { enabled: false },
          },
        });
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Custom className', () => {
    it('accepts and applies custom className', () => {
      const { container } = render(
        <SegmentedControl
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          className="custom-class"
          aria-label="Test control"
        />
      );

      const root = container.firstChild;
      expect(root).toHaveClass('custom-class');
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <SegmentedControl
          ref={ref}
          value="mine"
          onValueChange={jest.fn()}
          segments={mockSegments}
          aria-label="Test control"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Edge cases', () => {
    it('handles single segment', () => {
      render(
        <SegmentedControl
          value="only"
          onValueChange={jest.fn()}
          segments={[{ value: 'only', label: 'Only' }]}
          aria-label="Test control"
        />
      );

      expect(screen.getByText('Only')).toBeInTheDocument();
    });

    it('handles empty segments array gracefully', () => {
      render(
        <SegmentedControl
          value=""
          onValueChange={jest.fn()}
          segments={[]}
          aria-label="Test control"
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('handles very long labels', () => {
      render(
        <SegmentedControl
          value="long"
          onValueChange={jest.fn()}
          segments={[
            { value: 'long', label: 'This is a very long label that might wrap' },
          ]}
          aria-label="Test control"
        />
      );

      const button = screen.getByRole('tab');
      expect(button).toHaveClass('whitespace-nowrap');
    });
  });

  describe('All variants comprehensive', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size without errors`, () => {
        render(
          <SegmentedControl
            value="mine"
            onValueChange={jest.fn()}
            segments={mockSegments}
            size={size}
            aria-label={`${size} control`}
          />
        );

        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getAllByRole('tab')).toHaveLength(3);
      });
    });
  });
});
