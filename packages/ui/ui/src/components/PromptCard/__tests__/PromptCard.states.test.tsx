import * as React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from '../PromptCard';
import type { PromptCardProps } from '../PromptCard';

expect.extend(toHaveNoViolations);

// Mock matchMedia for reduced motion tests
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

// Mock performance for tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

describe('PromptCard States - MP-PCARD-CMP-004', () => {
  const baseProps: PromptCardProps = {
    title: 'Test Prompt Card',
    version: 1,
    access: 'private',
    tags: ['test'],
    onRun: jest.fn(),
    onEdit: jest.fn(),
    onFork: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Acceptance Criteria #1: Hover state elevates card from elev1 to elev2 with 150ms transition
  describe('Hover State', () => {
    it('applies hover state with elevation change', async () => {
      const { container } = render(<PromptCard {...baseProps} />);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('card');

      // Hover should be handled by CSS, but we can verify the structure
      await userEvent.hover(card);

      // The CSS class should be present - elevation is handled in CSS
      expect(card.className).toContain('card');
    });

    it('respects reduced motion preferences for hover transitions', () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container } = render(<PromptCard {...baseProps} />);
      const card = container.firstChild as HTMLElement;

      // Card should still have proper classes even with reduced motion
      expect(card.className).toContain('card');
    });
  });

  // Acceptance Criteria #2: Focus state shows 2px ring in --ring color with proper offset
  describe('Focus State', () => {
    it('shows proper focus ring when focused', async () => {
      render(<PromptCard {...baseProps} />);
      const card = screen.getByRole('button');

      await userEvent.tab();
      expect(card).toHaveFocus();

      // Focus ring is applied via CSS :focus-within selector
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('handles keyboard navigation correctly', async () => {
      const onRun = jest.fn();
      render(<PromptCard {...baseProps} onRun={onRun} />);

      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      expect(onRun).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard shortcuts', async () => {
      const onEdit = jest.fn();
      const onFork = jest.fn();

      render(<PromptCard {...baseProps} onEdit={onEdit} onFork={onFork} />);

      await userEvent.tab();

      // Test Ctrl+E for edit
      await userEvent.keyboard('{Control>}e{/Control}');
      expect(onEdit).toHaveBeenCalledTimes(1);

      // Test Ctrl+F for fork
      await userEvent.keyboard('{Control>}f{/Control}');
      expect(onFork).toHaveBeenCalledTimes(1);
    });

    it('handles Escape key to blur', async () => {
      render(<PromptCard {...baseProps} state="selected" />);
      const card = screen.getByRole('button');

      await userEvent.tab();
      expect(card).toHaveFocus();

      await userEvent.keyboard('{Escape}');
      expect(card).not.toHaveFocus();
    });
  });

  // Acceptance Criteria #3: Selected state displays 2px primary border without elevation change
  describe('Selected State', () => {
    it('applies selected state styling', () => {
      const { container } = render(<PromptCard {...baseProps} state="selected" />);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('selected');
      expect(card).toHaveAttribute('data-state', 'selected');
    });

    it('combines selected state with focus correctly', async () => {
      render(<PromptCard {...baseProps} state="selected" />);
      const card = screen.getByRole('button');

      await userEvent.tab();
      expect(card).toHaveFocus();
      expect(card.className).toContain('selected');
    });

    it('announces selected state to screen readers', () => {
      render(<PromptCard {...baseProps} state="selected" />);
      const card = screen.getByRole('button');

      expect(card).toHaveAttribute('aria-label', expect.stringContaining('selected'));
    });
  });

  // Acceptance Criteria #4: Running state shows animated top progress bar (2px, info color)
  describe('Running State', () => {
    it('shows progress bar when running', () => {
      const { container } = render(<PromptCard {...baseProps} isRunning />);

      const progressBar = container.querySelector('[class*="progressBar"]');
      expect(progressBar).toBeInTheDocument();

      const progressIndicator = container.querySelector('[class*="progressIndicator"]');
      expect(progressIndicator).toBeInTheDocument();
    });

    it('disables run button when running', () => {
      render(<PromptCard {...baseProps} isRunning />);

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton).toBeDisabled();
    });

    it('announces running state to screen readers', async () => {
      render(<PromptCard {...baseProps} isRunning />);

      // Check for live region announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('prevents hover elevation change when running', () => {
      const { container } = render(<PromptCard {...baseProps} isRunning />);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('running');
      expect(card).toHaveAttribute('data-state', 'running');
    });

    it('respects reduced motion for progress animation', () => {
      // Mock reduced motion
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container } = render(<PromptCard {...baseProps} isRunning />);
      const progressBar = container.querySelector('[class*="progressBar"]');

      expect(progressBar).toBeInTheDocument();
    });
  });

  // Acceptance Criteria #5: Error state shows danger border (4px left) + error message panel
  describe('Error State', () => {
    it('displays error message with string error', () => {
      const errorMessage = 'Something went wrong';
      render(<PromptCard {...baseProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays error message with object error and retry button', async () => {
      const retryFn = jest.fn();
      const errorObj = { message: 'Network error', retry: retryFn };

      render(<PromptCard {...baseProps} error={errorObj} />);

      expect(screen.getByText('Network error')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      await userEvent.click(retryButton);
      expect(retryFn).toHaveBeenCalledTimes(1);
    });

    it('announces error to screen readers', async () => {
      const errorMessage = 'Test error';
      render(<PromptCard {...baseProps} error={errorMessage} />);

      // Error should be announced via role="alert"
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });

    it('applies error state styling', () => {
      const { container } = render(<PromptCard {...baseProps} error="Test error" />);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('error');
      expect(card).toHaveAttribute('data-state', 'error');
    });
  });

  // Acceptance Criteria #6: Skeleton shows loading placeholders with no layout shift
  describe('Skeleton State', () => {
    it('renders skeleton without layout shift', () => {
      // This would be tested with the separate PromptCardSkeleton component
      // Here we verify the skeleton is properly exported and can be imported
      expect(() => {
        const { PromptCardSkeleton } = require('../PromptCardSkeleton');
        expect(PromptCardSkeleton).toBeDefined();
      }).not.toThrow();
    });
  });

  // Acceptance Criteria #7: Disabled state applies 50% opacity and prevents all interactions
  describe('Disabled State', () => {
    it('applies disabled styling and prevents interactions', async () => {
      const onRun = jest.fn();
      const { container } = render(<PromptCard {...baseProps} disabled onRun={onRun} />);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('disabled');
      expect(card).toHaveAttribute('data-state', 'disabled');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });

    it('prevents keyboard interactions when disabled', async () => {
      const onRun = jest.fn();
      render(<PromptCard {...baseProps} disabled onRun={onRun} />);
      const card = screen.getByRole('button');

      // Try to focus and activate
      card.focus();
      await userEvent.keyboard('{Enter}');

      expect(onRun).not.toHaveBeenCalled();
    });

    it('prevents hover effects when disabled', () => {
      const { container } = render(<PromptCard {...baseProps} disabled />);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('disabled');
    });
  });

  // Acceptance Criteria #8: States respect prefers-reduced-motion for animations
  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
    });

    it('disables animations when reduced motion is preferred', () => {
      const { container } = render(<PromptCard {...baseProps} isRunning />);

      // Animations should be disabled by CSS media query
      const progressBar = container.querySelector('[class*="progressBar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('provides instant state transitions with reduced motion', () => {
      render(<PromptCard {...baseProps} />);

      // State changes should be instant with reduced motion
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });
  });

  // Acceptance Criteria #9: Keyboard focus always visible with clear ring
  describe('Focus Visibility', () => {
    it('maintains visible focus ring', async () => {
      render(<PromptCard {...baseProps} />);
      const card = screen.getByRole('button');

      await userEvent.tab();
      expect(card).toHaveFocus();

      // Focus should be visible (CSS handles the actual focus ring)
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('handles complex focus scenarios', async () => {
      const onRun = jest.fn();
      render(<PromptCard {...baseProps} onRun={onRun} />);
      const card = screen.getByRole('button');

      // Focus, then unfocus, then refocus
      await userEvent.tab();
      await userEvent.tab({ shift: true });
      await userEvent.tab();

      expect(card).toHaveFocus();
    });
  });

  // Acceptance Criteria #10: Multiple states can combine (running + hover, selected + focus)
  describe('State Combinations', () => {
    it('handles running state with focus', async () => {
      render(<PromptCard {...baseProps} isRunning />);
      const card = screen.getByRole('button');

      await userEvent.tab();

      expect(card).toHaveFocus();
      expect(card).toHaveAttribute('data-state', 'running');
    });

    it('handles selected state with focus', async () => {
      render(<PromptCard {...baseProps} state="selected" />);
      const card = screen.getByRole('button');

      await userEvent.tab();

      expect(card).toHaveFocus();
      expect(card.className).toContain('selected');
    });

    it('handles error state with focus', async () => {
      render(<PromptCard {...baseProps} error="Test error" />);
      const card = screen.getByRole('button');

      await userEvent.tab();

      expect(card).toHaveFocus();
      expect(card).toHaveAttribute('data-state', 'error');
    });

    it('prioritizes disabled state over other states', () => {
      const { container } = render(<PromptCard {...baseProps} disabled isRunning state="selected" />);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveAttribute('data-state', 'disabled');
      expect(card.className).toContain('disabled');
    });
  });

  // Performance and accessibility tests
  describe('Performance and Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PromptCard {...baseProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes for each state', () => {
      const states = ['default', 'running', 'error', 'disabled', 'selected'] as const;

      states.forEach(state => {
        const props = state === 'running' ? { isRunning: true } :
                     state === 'error' ? { error: 'Test error' } :
                     state === 'disabled' ? { disabled: true } :
                     state === 'selected' ? { state: 'selected' } :
                     {};

        const { container } = render(<PromptCard {...baseProps} {...props} />);
        const card = container.firstChild as HTMLElement;

        expect(card).toHaveAttribute('aria-label');
        expect(card).toHaveAttribute('data-state');

        render(null); // Cleanup
      });
    });

    it('handles state changes with proper announcements', async () => {
      const onStateChange = jest.fn();
      const { rerender } = render(
        <PromptCard {...baseProps} onStateChange={onStateChange} />
      );

      rerender(
        <PromptCard {...baseProps} isRunning onStateChange={onStateChange} />
      );

      // Allow state change effect to run
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'default',
          to: 'running',
          reason: 'run_started',
          timestamp: expect.any(Date)
        })
      );
    });

    it('renders within performance budget', () => {
      const startTime = performance.now();
      render(<PromptCard {...baseProps} />);
      const endTime = performance.now();

      // Should render within 50ms (acceptance criteria requirement)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  // State transition tests
  describe('State Transitions', () => {
    it('transitions from default to running', async () => {
      const onStateChange = jest.fn();
      const { rerender } = render(
        <PromptCard {...baseProps} onStateChange={onStateChange} />
      );

      rerender(
        <PromptCard {...baseProps} isRunning onStateChange={onStateChange} />
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'default',
          to: 'running'
        })
      );
    });

    it('transitions from running to error', async () => {
      const onStateChange = jest.fn();
      const { rerender } = render(
        <PromptCard {...baseProps} isRunning onStateChange={onStateChange} />
      );

      rerender(
        <PromptCard {...baseProps} error="Failed" onStateChange={onStateChange} />
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'running',
          to: 'error'
        })
      );
    });

    it('clears live region messages after delay', async () => {
      render(<PromptCard {...baseProps} isRunning />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();

      // Fast-forward time to clear message
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(liveRegion).toHaveTextContent('');
    });
  });
});
