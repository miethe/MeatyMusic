import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DraftBanner } from '../DraftBanner';

describe('DraftBanner', () => {
  const mockOnResume = jest.fn();
  const mockOnDiscard = jest.fn();
  const defaultProps = {
    draft: {
      title: 'Test draft title',
      savedAt: new Date('2024-01-15T10:45:30.000Z').toISOString(),
    },
    onResume: mockOnResume,
    onDiscard: mockOnDiscard,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with all required elements', () => {
      render(<DraftBanner {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Resume your draft?')).toBeInTheDocument();
      expect(screen.getByText(/You have an unsaved draft from/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument();
    });

    it('displays draft title when provided', () => {
      render(<DraftBanner {...defaultProps} />);
      expect(screen.getByText(/titled "Test draft title"/)).toBeInTheDocument();
    });

    it('does not display title text when title is missing', () => {
      const props = {
        ...defaultProps,
        draft: {
          savedAt: defaultProps.draft.savedAt,
        },
      };
      render(<DraftBanner {...props} />);

      const text = screen.getByText(/You have an unsaved draft from/);
      expect(text.textContent).not.toContain('titled');
    });

    it('truncates long titles at 50 characters', () => {
      const longTitle = 'This is a very long title that exceeds fifty characters and should be truncated';
      const props = {
        ...defaultProps,
        draft: {
          ...defaultProps.draft,
          title: longTitle,
        },
      };
      render(<DraftBanner {...props} />);

      // Check that the truncated version appears
      expect(screen.getByText(/titled "This is a very long title that exceeds fifty cha/)).toBeInTheDocument();
      // Check that full title doesn't appear
      expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
      // Verify ellipsis is present
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });

    it('displays formatted time correctly', () => {
      const props = {
        ...defaultProps,
        draft: {
          ...defaultProps.draft,
          savedAt: new Date('2024-01-15T14:30:00.000Z').toISOString(),
        },
      };
      render(<DraftBanner {...props} />);

      // Time will be formatted based on local timezone, but should contain time format
      expect(screen.getByText(/You have an unsaved draft from/)).toBeInTheDocument();
    });

    it('accepts and applies custom className', () => {
      const { container } = render(
        <DraftBanner {...defaultProps} className="custom-test-class" />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('custom-test-class');
    });
  });

  describe('Interactions', () => {
    it('calls onResume when Resume button is clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBanner {...defaultProps} />);

      const resumeButton = screen.getByRole('button', { name: /resume draft/i });
      await user.click(resumeButton);

      expect(mockOnResume).toHaveBeenCalledTimes(1);
      expect(mockOnDiscard).not.toHaveBeenCalled();
    });

    it('calls onDiscard when Discard button is clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBanner {...defaultProps} />);

      const discardButton = screen.getByRole('button', { name: /discard draft/i });
      await user.click(discardButton);

      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
      expect(mockOnResume).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation between buttons', async () => {
      const user = userEvent.setup();
      render(<DraftBanner {...defaultProps} />);

      const resumeButton = screen.getByRole('button', { name: /resume draft/i });
      const discardButton = screen.getByRole('button', { name: /discard draft/i });

      // Focus should start on Resume button (auto-focus)
      expect(resumeButton).toHaveFocus();

      // Tab to Discard button
      await user.tab();
      expect(discardButton).toHaveFocus();

      // Shift+Tab back to Resume button
      await user.tab({ shift: true });
      expect(resumeButton).toHaveFocus();
    });

    it('activates Resume button with Enter key', async () => {
      const user = userEvent.setup();
      render(<DraftBanner {...defaultProps} />);

      const resumeButton = screen.getByRole('button', { name: /resume draft/i });
      resumeButton.focus();

      await user.keyboard('{Enter}');
      expect(mockOnResume).toHaveBeenCalledTimes(1);
    });

    it('activates Discard button with Space key', async () => {
      const user = userEvent.setup();
      render(<DraftBanner {...defaultProps} />);

      const discardButton = screen.getByRole('button', { name: /discard draft/i });
      discardButton.focus();

      await user.keyboard(' ');
      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has role="alert" for screen reader announcement', () => {
      render(<DraftBanner {...defaultProps} />);
      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
    });

    it('has aria-label on Resume button', () => {
      render(<DraftBanner {...defaultProps} />);
      const resumeButton = screen.getByRole('button', { name: /resume draft/i });
      expect(resumeButton).toHaveAttribute('aria-label', 'Resume draft');
    });

    it('has aria-label on Discard button', () => {
      render(<DraftBanner {...defaultProps} />);
      const discardButton = screen.getByRole('button', { name: /discard draft/i });
      expect(discardButton).toHaveAttribute('aria-label', 'Discard draft');
    });

    it('marks FileText icon as aria-hidden', () => {
      const { container } = render(<DraftBanner {...defaultProps} />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<DraftBanner {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations without title', async () => {
      const props = {
        ...defaultProps,
        draft: {
          savedAt: defaultProps.draft.savedAt,
        },
      };
      const { container } = render(<DraftBanner {...props} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Classes', () => {
    it('applies blue color scheme', () => {
      const { container } = render(<DraftBanner {...defaultProps} />);
      const alert = container.querySelector('[role="alert"]');

      expect(alert).toHaveClass('bg-blue-50');
      expect(alert).toHaveClass('dark:bg-blue-950/20');
      expect(alert).toHaveClass('border-blue-200');
      expect(alert).toHaveClass('dark:border-blue-800');
    });

    it('applies correct text colors', () => {
      render(<DraftBanner {...defaultProps} />);

      const heading = screen.getByText('Resume your draft?');
      expect(heading).toHaveClass('text-blue-900', 'dark:text-blue-100');

      const subtext = screen.getByText(/You have an unsaved draft from/);
      expect(subtext).toHaveClass('text-blue-700', 'dark:text-blue-300');
    });

    it('applies correct icon color', () => {
      const { container } = render(<DraftBanner {...defaultProps} />);
      const icon = container.querySelector('svg');

      expect(icon).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });
  });

  describe('Focus Management', () => {
    it('sets initial focus on Resume button', () => {
      render(<DraftBanner {...defaultProps} />);
      const resumeButton = screen.getByRole('button', { name: /resume draft/i });

      // Focus should be set automatically
      expect(resumeButton).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('has responsive layout classes', () => {
      const { container } = render(<DraftBanner {...defaultProps} />);
      const innerContainer = container.querySelector('.flex');

      // Should have classes for responsive layout
      expect(innerContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('has responsive alignment classes', () => {
      const { container } = render(<DraftBanner {...defaultProps} />);
      const innerContainer = container.querySelector('.flex');

      expect(innerContainer).toHaveClass('sm:items-center', 'sm:justify-between');
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid timestamp gracefully', () => {
      const props = {
        ...defaultProps,
        draft: {
          ...defaultProps.draft,
          savedAt: 'invalid-date',
        },
      };
      render(<DraftBanner {...props} />);

      // Should still render without crashing
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles empty title string', () => {
      const props = {
        ...defaultProps,
        draft: {
          ...defaultProps.draft,
          title: '',
        },
      };
      render(<DraftBanner {...props} />);

      // Should not show "titled" text for empty string
      const text = screen.getByText(/You have an unsaved draft from/);
      expect(text.textContent).not.toContain('titled ""');
    });

    it('handles title exactly 50 characters (no truncation)', () => {
      const exactTitle = 'A'.repeat(50);
      const props = {
        ...defaultProps,
        draft: {
          ...defaultProps.draft,
          title: exactTitle,
        },
      };
      render(<DraftBanner {...props} />);

      // Should show full title without ellipsis
      expect(screen.getByText(new RegExp(`titled "${exactTitle}"`))).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('handles title with 51 characters (with truncation)', () => {
      const longTitle = 'A'.repeat(51);
      const props = {
        ...defaultProps,
        draft: {
          ...defaultProps.draft,
          title: longTitle,
        },
      };
      render(<DraftBanner {...props} />);

      // Should show truncated title with ellipsis
      expect(screen.getByText(/titled "AAAAAAAAAA.*\.\.\."/, { exact: false })).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the Card element', () => {
      const ref = jest.fn();
      render(<DraftBanner {...defaultProps} ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });
});
