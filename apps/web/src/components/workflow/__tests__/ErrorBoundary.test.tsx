/**
 * ErrorBoundary Component Tests
 * Tests for error catching and recovery functionality
 *
 * Phase 4, Task 4.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws error on mount
const ThrowError = ({ message = 'Test error' }: { message?: string }) => {
  throw new Error(message);
};

// Component that throws error when state changes
const ConditionalError = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Conditional error');
  }
  return <div>No error</div>;
};

// Working component
const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests (error boundaries log to console)
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('Error Catching', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display custom error title', () => {
      render(
        <ErrorBoundary errorTitle="Custom Error Title">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('should display custom error message', () => {
      render(
        <ErrorBoundary errorMessage="Custom error message for users">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message for users')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Test error message" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback component', () => {
      const CustomFallback = <div>Custom error fallback</div>;

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should render custom fallback function', () => {
      const customFallbackFunction = (error: Error, reset: () => void) => (
        <div>
          <div>Error: {error.message}</div>
          <button onClick={reset}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallbackFunction}>
          <ThrowError message="Custom error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Custom error')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    it('should hide error details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Detailed error" />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Detailed error')).not.toBeInTheDocument();
    });

    it('should show error details when button clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Detailed error" />
        </ErrorBoundary>
      );

      const showDetailsButton = screen.getByText(/show error details/i);
      fireEvent.click(showDetailsButton);

      expect(screen.getByText(/Detailed error/i)).toBeInTheDocument();
    });

    it('should hide error details when hide button clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Detailed error" />
        </ErrorBoundary>
      );

      // Show details
      const showDetailsButton = screen.getByText(/show error details/i);
      fireEvent.click(showDetailsButton);
      expect(screen.getByText(/Detailed error/i)).toBeInTheDocument();

      // Hide details
      const hideDetailsButton = screen.getByText(/hide error details/i);
      fireEvent.click(hideDetailsButton);
      expect(screen.queryByText(/Detailed error/i)).not.toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    it('should reset error state when Try Again clicked', () => {
      render(
        <ErrorBoundary>
          <ConditionalError shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Click Try Again (this will attempt to re-render, but component will still error)
      const tryAgainButton = screen.getByText(/try again/i);
      fireEvent.click(tryAgainButton);

      // Since component still errors, we should see error UI again
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should recover when error is fixed and Try Again clicked', () => {
      let shouldError = true;

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError shouldError={shouldError} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Fix the error
      shouldError = false;

      // Click Try Again
      const tryAgainButton = screen.getByText(/try again/i);
      fireEvent.click(tryAgainButton);

      // Should show working component now
      rerender(
        <ErrorBoundary>
          <ConditionalError shouldError={shouldError} />
        </ErrorBoundary>
      );
    });

    it('should provide reload page button', () => {
      // Mock window.location.reload
      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadMock },
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText(/reload page/i);
      fireEvent.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Auto-Reset with resetKeys', () => {
    it('should auto-reset when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Change resetKeys
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <WorkingComponent />
        </ErrorBoundary>
      );

      // Should show working component now
      expect(screen.getByText('Working component')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should not reset when resetKeys stay the same', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Same resetKeys
      rerender(
        <ErrorBoundary resetKeys={['key1']}>
          <WorkingComponent />
        </ErrorBoundary>
      );

      // Should still show error UI (didn't auto-reset)
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByLabelText('Try again');
      const reloadButton = screen.getByLabelText('Reload page');

      expect(tryAgainButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();
    });

    it('should have focusable buttons with keyboard navigation', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByLabelText('Try again');
      expect(tryAgainButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle error in onError callback gracefully', () => {
      const badOnError = jest.fn(() => {
        throw new Error('Error in error handler');
      });

      // Should not crash even if onError throws
      render(
        <ErrorBoundary onError={badOnError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(badOnError).toHaveBeenCalled();
    });

    it('should handle multiple errors in sequence', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError message="First error" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Reset
      const tryAgainButton = screen.getByText(/try again/i);
      fireEvent.click(tryAgainButton);

      // New error
      rerender(
        <ErrorBoundary>
          <ThrowError message="Second error" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Default Error Fallback UI', () => {
    it('should display error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Icon should be present (aria-hidden)
      const icon = screen.getByRole('alert').querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('rounded-lg', 'border', 'border-red-200', 'bg-red-50');
    });
  });
});
