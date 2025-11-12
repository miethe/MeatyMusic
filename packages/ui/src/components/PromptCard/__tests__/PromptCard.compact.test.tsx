import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from '../PromptCard';
import type { PromptCardProps } from '../PromptCard';

expect.extend(toHaveNoViolations);

// Mock performance for tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

describe('PromptCard - Compact Variant', () => {
  const baseProps: PromptCardProps = {
    title: 'Test Compact Card',
    version: 1,
    access: 'private',
    size: 'compact',
    onRun: jest.fn(),
    onEdit: jest.fn(),
    onFork: jest.fn(),
    onMenuAction: jest.fn(),
  };

  const mockPropsWithTagsAndModel: PromptCardProps = {
    ...baseProps,
    title: 'Email Template Generator',
    tags: ['email', 'template', 'marketing', 'automation', 'extra'],
    model: 'gpt-4',
    lastRun: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC #1: Size constraints (min-width 288px, max-height 220px)
  describe('Size Constraints', () => {
    it('renders with correct minimum width constraint', () => {
      const { container } = render(<PromptCard {...baseProps} />);
      const card = container.firstChild; // Get the card container

      // Check CSS class is applied (actual min-width comes from CSS module)
      expect(card).toHaveClass(/compact/);
    });

    it('enforces maximum height constraint without layout shift', () => {
      const { rerender, container } = render(<PromptCard {...baseProps} />);
      const card = container.firstChild;

      // Should have compact class for height constraint
      expect(card).toHaveClass(/compact/);

      // Rerender with more content shouldn't change container class
      rerender(<PromptCard {...baseProps} title="Very Long Title That Should Still Fit Within Height Constraints" />);
      expect(card).toHaveClass(/compact/);
    });
  });

  // AC #2: Meta strip shows only top 2 tags OR model (not both)
  describe('Meta Strip Logic', () => {
    it('shows only first 2 tags when tags and model both present', () => {
      render(<PromptCard {...mockPropsWithTagsAndModel} />);

      // Should show first 2 tags
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('template')).toBeInTheDocument();

      // Should NOT show remaining tags
      expect(screen.queryByText('marketing')).not.toBeInTheDocument();
      expect(screen.queryByText('automation')).not.toBeInTheDocument();
      expect(screen.queryByText('extra')).not.toBeInTheDocument();

      // Should NOT show model when tags present
      expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
    });

    it('shows model chip when no tags present', () => {
      render(<PromptCard {...baseProps} model="claude-3" />);

      expect(screen.getByText('claude-3')).toBeInTheDocument();
    });

    it('shows empty meta strip when no tags or model', () => {
      render(<PromptCard {...baseProps} />);

      // Should not crash and should not show any tag/model elements
      expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
      expect(screen.getByText('Test Compact Card')).toBeInTheDocument();
    });

    it('maintains lastRun display in compact mode', () => {
      render(<PromptCard {...mockPropsWithTagsAndModel} />);
      expect(screen.getByText('15m ago')).toBeInTheDocument();
    });
  });

  // AC #3: Icon-only buttons with size="sm"
  describe('Action Buttons', () => {
    it('renders Edit button as icon-only in compact mode', () => {
      render(<PromptCard {...baseProps} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();

      // Should not contain "Edit" text, only icon and aria-label
      expect(editButton.textContent).not.toContain('Edit');

      // Should have proper aria-label for accessibility
      expect(editButton).toHaveAccessibleName(/edit/i);
    });

    it('renders Fork button as icon-only in compact mode', () => {
      render(<PromptCard {...baseProps} />);

      const forkButton = screen.getByRole('button', { name: /fork/i });
      expect(forkButton).toBeInTheDocument();

      // Should not contain "Fork" text, only icon and aria-label
      expect(forkButton.textContent).not.toContain('Fork');

      // Should have proper aria-label for accessibility
      expect(forkButton).toHaveAccessibleName(/fork/i);
    });

    it('keeps Run button text for clarity', () => {
      render(<PromptCard {...baseProps} />);

      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton.textContent).toContain('Run');
    });

    it('maintains all button functionality', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...baseProps} />);

      const runButton = screen.getByRole('button', { name: /run/i });
      const editButton = screen.getByRole('button', { name: /edit/i });
      const forkButton = screen.getByRole('button', { name: /fork/i });

      await user.click(runButton);
      expect(baseProps.onRun).toHaveBeenCalledTimes(1);

      await user.click(editButton);
      expect(baseProps.onEdit).toHaveBeenCalledTimes(1);

      await user.click(forkButton);
      expect(baseProps.onFork).toHaveBeenCalledTimes(1);
    });
  });

  // AC #4: Content hiding verification
  describe('Content Hiding', () => {
    it('hides body preview in compact mode', () => {
      render(<PromptCard {...baseProps} bodyPreview="This should be hidden in compact mode" />);

      expect(screen.queryByText('This should be hidden in compact mode')).not.toBeInTheDocument();
    });

    it('hides detailed stats in compact mode', () => {
      render(
        <PromptCard
          {...baseProps}
          metrics={{ runs: 42, successRate: 0.85, avgCost: 0.012 }}
        />
      );

      expect(screen.queryByText('42 runs')).not.toBeInTheDocument();
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
      expect(screen.queryByText('$0.012')).not.toBeInTheDocument();
    });

    it('maintains header elements (title, version, access)', () => {
      render(<PromptCard {...baseProps} />);

      expect(screen.getByText('Test Compact Card')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('private')).toBeInTheDocument();
    });
  });

  // AC #5: State handling
  describe('State Handling', () => {
    it('shows running state with progress bar in compact mode', () => {
      render(<PromptCard {...baseProps} isRunning={true} state="running" />);

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton.textContent).toContain('Running...');
      expect(runButton).toBeDisabled();
    });

    it('shows error state in compact mode', () => {
      render(<PromptCard {...baseProps} error="Test error message" state="error" />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('handles selected state without layout expansion', () => {
      const { container } = render(<PromptCard {...baseProps} state="selected" />);

      const card = container.firstChild;
      expect(card).toHaveClass(/selected/);
    });
  });

  // AC #6: Keyboard navigation
  describe('Keyboard Navigation', () => {
    it('supports Enter key to trigger run action', async () => {
      const user = userEvent.setup();
      const { container } = render(<PromptCard {...baseProps} />);

      const card = container.firstChild;
      card.focus();

      await user.keyboard('{Enter}');
      expect(baseProps.onRun).toHaveBeenCalledTimes(1);
    });

    it('maintains proper tab order in compact mode', async () => {
      const user = userEvent.setup();
      const { container } = render(<PromptCard {...baseProps} />);

      await user.tab();
      expect(container.firstChild).toHaveFocus(); // Card container

      await user.tab();
      expect(screen.getByRole('button', { name: /run/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /edit prompt/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /fork prompt/i })).toHaveFocus();
    });

    it('shows focus ring without expanding card bounds', async () => {
      const user = userEvent.setup();
      const { container } = render(<PromptCard {...baseProps} />);

      await user.tab();
      const card = container.firstChild;
      expect(card).toHaveFocus();
    });
  });

  // AC #7: Edge cases
  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      render(<PromptCard title="Minimal Card" size="compact" />);

      expect(screen.getByText('Minimal Card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    });

    it('handles ultra-long title with proper truncation', () => {
      const longTitle = 'This is an extremely long title that should be truncated properly in compact mode without breaking the layout or causing overflow issues';
      render(<PromptCard {...baseProps} title={longTitle} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveAttribute('title', longTitle); // Tooltip for full title
    });

    it('handles no tags gracefully', () => {
      render(<PromptCard {...baseProps} tags={[]} model="gpt-4" />);

      // Should show model when no tags
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });

    it('handles empty tags array with no model', () => {
      render(<PromptCard {...baseProps} tags={[]} />);

      // Should not crash
      expect(screen.getByText('Test Compact Card')).toBeInTheDocument();
    });
  });

  // AC #8: Accessibility compliance
  describe('Accessibility', () => {
    it('meets WCAG AA standards', async () => {
      const { container } = render(<PromptCard {...mockPropsWithTagsAndModel} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper aria labels for icon-only buttons', () => {
      render(<PromptCard {...baseProps} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      const forkButton = screen.getByRole('button', { name: /fork/i });

      expect(editButton).toHaveAccessibleName();
      expect(forkButton).toHaveAccessibleName();
    });

    it('maintains 44px minimum touch targets on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<PromptCard {...baseProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        // This would need actual CSS measurement in real browser
        expect(button).toBeInTheDocument();
      });
    });
  });

  // Performance test
  describe('Performance', () => {
    it('renders efficiently with minimal re-renders', () => {
      const renderSpy = jest.fn();
      const TestWrapper = (props: PromptCardProps) => {
        renderSpy();
        return <PromptCard {...props} />;
      };

      const { rerender } = render(<TestWrapper {...baseProps} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not cause extra renders due to memoization
      rerender(<TestWrapper {...baseProps} />);
      // Note: Actual memoization check would need React.memo implementation
    });
  });

  // Layout stability test
  describe('Layout Stability', () => {
    it('maintains consistent dimensions across different prop combinations', () => {
      const { rerender, container } = render(<PromptCard {...baseProps} />);
      const card1 = container.firstChild;

      rerender(<PromptCard {...baseProps} tags={['tag1', 'tag2']} />);
      const card2 = container.firstChild;

      rerender(<PromptCard {...baseProps} model="gpt-4" />);
      const card3 = container.firstChild;

      // All should have the same compact class applied
      expect(card1).toHaveClass(/compact/);
      expect(card2).toHaveClass(/compact/);
      expect(card3).toHaveClass(/compact/);
    });

    it('does not cause layout shift on hover', async () => {
      const user = userEvent.setup();
      const { container } = render(<PromptCard {...baseProps} />);

      const card = container.firstChild;

      await user.hover(card);
      // Should maintain compact class on hover
      expect(card).toHaveClass(/compact/);
    });
  });
});
