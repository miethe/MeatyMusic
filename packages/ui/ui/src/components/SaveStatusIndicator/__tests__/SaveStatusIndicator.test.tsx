import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SaveStatusIndicator } from '../SaveStatusIndicator';

expect.extend(toHaveNoViolations);

describe('SaveStatusIndicator', () => {
  describe('Visibility', () => {
    it('is hidden when saveState is idle', () => {
      const { container } = render(
        <SaveStatusIndicator saveState="idle" lastSavedAt={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('is hidden when saveState is pending', () => {
      const { container } = render(
        <SaveStatusIndicator saveState="pending" lastSavedAt={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('is visible when saveState is saving', () => {
      const { container } = render(
        <SaveStatusIndicator saveState="saving" lastSavedAt={null} />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('is visible when saveState is saved', () => {
      const { container } = render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it('is visible when saveState is error', () => {
      const { container } = render(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Saving state', () => {
    it('renders spinner icon and "Saving..." text', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      // Spinner has motion-safe:animate-spin class
      const container = screen.getByRole('status');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies muted foreground color', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('text-muted-foreground');
    });

    it('has correct ARIA label', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Saving draft'
      );
    });
  });

  describe('Saved state', () => {
    it('renders checkmark icon', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      const container = screen.getByRole('status');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('formats timestamp with correct pattern', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T09:05:00.000Z"
        />
      );

      // Check for "HH:MM AM/PM" format pattern
      expect(
        screen.getByText(/Draft saved at \d{1,2}:\d{2} (AM|PM)/)
      ).toBeInTheDocument();
    });

    it('formats single-digit minutes with leading zero', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T09:05:00.000Z"
        />
      );

      // Should have :05 (not :5)
      expect(screen.getByText(/:05 (AM|PM)/)).toBeInTheDocument();
    });

    it('uses 12-hour format', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T14:30:00.000Z"
        />
      );

      // Should not have hours > 12
      const text = screen.getByText(/Draft saved at/);
      expect(text.textContent).not.toMatch(/\b(13|14|15|16|17|18|19|20|21|22|23):/);
    });

    it('includes AM/PM indicator', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T14:30:00.000Z"
        />
      );

      const text = screen.getByText(/Draft saved at/);
      expect(text.textContent).toMatch(/(AM|PM)$/);
    });

    it('shows generic text when lastSavedAt is null', () => {
      render(<SaveStatusIndicator saveState="saved" lastSavedAt={null} />);

      expect(screen.getByText('Draft saved')).toBeInTheDocument();
      expect(screen.queryByText(/Draft saved at/)).not.toBeInTheDocument();
    });

    it('applies green color class', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveClass('text-green-600');
      expect(status).toHaveClass('dark:text-green-400');
    });

    it('has correct ARIA label with timestamp', () => {
      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringMatching(/Draft saved at \d{1,2}:\d{2} (AM|PM)/)
      );
    });
  });

  describe('Error state', () => {
    it('renders error icon and "Save failed" text', () => {
      render(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      expect(screen.getByText('Save failed')).toBeInTheDocument();
      const container = screen.getByRole('status');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies destructive color class', () => {
      render(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveClass('text-destructive');
    });

    it('has correct ARIA label', () => {
      render(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Failed to save draft'
      );
    });
  });

  describe('ARIA attributes', () => {
    it('has role="status"', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-live',
        'polite'
      );
    });

    it('has aria-atomic="true"', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-atomic',
        'true'
      );
    });

    it('icons have aria-hidden="true"', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling', () => {
    it('applies base classes', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('inline-flex');
      expect(status).toHaveClass('items-center');
      expect(status).toHaveClass('gap-1.5');
      expect(status).toHaveClass('text-xs');
    });

    it('applies transition classes', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('transition-opacity');
      expect(status).toHaveClass('duration-200');
      expect(status).toHaveClass('ease-in-out');
    });

    it('accepts custom className', () => {
      render(
        <SaveStatusIndicator
          saveState="saving"
          lastSavedAt={null}
          className="custom-class"
        />
      );

      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });

    it('merges custom className with base classes', () => {
      render(
        <SaveStatusIndicator
          saveState="saving"
          lastSavedAt={null}
          className="opacity-50"
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveClass('opacity-50');
      expect(status).toHaveClass('inline-flex'); // Base class still present
    });
  });

  describe('Reduced motion', () => {
    it('spinner has motion-safe:animate-spin class', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('motion-safe:animate-spin');
    });

    it('respects prefers-reduced-motion via motion-safe prefix', () => {
      // The motion-safe: prefix means animation only applies when
      // prefers-reduced-motion is NOT set. This respects user preferences.
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const svg = screen.getByRole('status').querySelector('svg');
      // Verify motion-safe prefix is present
      expect(svg).toHaveClass('motion-safe:animate-spin');
      // The actual motion behavior is controlled by CSS media query
      // @media (prefers-reduced-motion: no-preference)
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <SaveStatusIndicator
          ref={ref}
          saveState="saving"
          lastSavedAt={null}
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByRole('status'));
    });

    it('ref is null when component is hidden', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <SaveStatusIndicator ref={ref} saveState="idle" lastSavedAt={null} />
      );

      expect(ref.current).toBeNull();
    });
  });

  describe('Time formatting edge cases', () => {
    it('handles invalid timestamp gracefully', () => {
      render(
        <SaveStatusIndicator saveState="saved" lastSavedAt="invalid-date" />
      );

      // Should fallback to generic text when timestamp is invalid
      expect(screen.getByText('Draft saved')).toBeInTheDocument();
    });

    it('pads minutes to always show two digits', () => {
      // Create a date object and set to a time with single-digit minutes
      const date = new Date();
      date.setHours(10, 5, 0, 0); // 10:05
      const timestamp = date.toISOString();

      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt={timestamp}
        />
      );

      // Should have :05 (not :5)
      expect(screen.getByText(/:05 /)).toBeInTheDocument();
    });

    it('converts 24-hour to 12-hour format', () => {
      const date = new Date();
      date.setHours(23, 30, 0, 0); // 11:30 PM
      const timestamp = date.toISOString();

      render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt={timestamp}
        />
      );

      const text = screen.getByText(/Draft saved at/);
      // Should not show 23: (should show 11: PM instead)
      expect(text.textContent).not.toMatch(/23:/);
      expect(text.textContent).toMatch(/PM/);
    });
  });

  describe('Accessibility', () => {
    it('has no axe violations for saving state', async () => {
      const { container } = render(
        <SaveStatusIndicator saveState="saving" lastSavedAt={null} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations for saved state', async () => {
      const { container } = render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations for error state', async () => {
      const { container } = render(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('State transitions', () => {
    it('can transition from saving to saved', () => {
      const { rerender } = render(
        <SaveStatusIndicator saveState="saving" lastSavedAt={null} />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      rerender(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.getByText(/Draft saved at/)).toBeInTheDocument();
    });

    it('can transition from saving to error', () => {
      const { rerender } = render(
        <SaveStatusIndicator saveState="saving" lastSavedAt={null} />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      rerender(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    it('can hide after showing saved state', () => {
      const { rerender, container } = render(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );

      expect(screen.getByText(/Draft saved at/)).toBeInTheDocument();

      rerender(<SaveStatusIndicator saveState="idle" lastSavedAt={null} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Icon rendering', () => {
    it('renders correct icon for each state', () => {
      const { rerender, container } = render(
        <SaveStatusIndicator saveState="saving" lastSavedAt={null} />
      );

      // Saving: Loader2 icon
      let svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Saved: Check icon
      rerender(
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );
      svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Error: AlertCircle icon
      rerender(
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      );
      svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('icons have correct size classes', () => {
      render(<SaveStatusIndicator saveState="saving" lastSavedAt={null} />);

      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveClass('h-3');
      expect(svg).toHaveClass('w-3');
    });
  });

  describe('Display name', () => {
    it('has correct display name', () => {
      expect(SaveStatusIndicator.displayName).toBe('SaveStatusIndicator');
    });
  });
});
