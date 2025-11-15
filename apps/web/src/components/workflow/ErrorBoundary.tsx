/**
 * Error Boundary Component
 * Catches errors from WebSocket-related components and provides recovery options
 *
 * Features:
 * - Graceful error handling
 * - User-friendly error messages
 * - Recovery options (retry, reload)
 * - Auto-reset when resetKeys change
 * - Developer-friendly error logging
 *
 * Phase 4, Task 4.2
 */

'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

/**
 * Error Boundary Props
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI (optional) */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Error callback for logging/monitoring */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Keys that trigger auto-reset when changed */
  resetKeys?: unknown[];
  /** Custom error title */
  errorTitle?: string;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Wraps components to catch and handle errors gracefully.
 * Provides user-friendly error messages and recovery options.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     console.error('WebSocket error:', error, errorInfo);
 *   }}
 *   resetKeys={[runId]}
 * >
 *   <WorkflowStatus runId={runId} />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <CustomErrorUI error={error} onRetry={reset} />
 *   )}
 * >
 *   <WorkflowEventLog runId={runId} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error and call error callback
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console for development
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error callback if provided
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Auto-reset when resetKeys change
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // If we have an error and resetKeys changed, auto-reset
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasKeysChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);

      if (hasKeysChanged) {
        this.reset();
      }
    }
  }

  /**
   * Reset error state
   */
  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error!, this.reset);
      }
      return fallback;
    }

    // Default fallback UI
    return (
      <DefaultErrorFallback
        error={error!}
        onReset={this.reset}
        onReload={this.handleReload}
        errorTitle={this.props.errorTitle}
        errorMessage={this.props.errorMessage}
      />
    );
  }
}

/**
 * Default Error Fallback Props
 */
interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
  onReload: () => void;
  errorTitle?: string;
  errorMessage?: string;
}

/**
 * Default Error Fallback UI
 *
 * Displays error information with recovery options
 */
function DefaultErrorFallback({
  error,
  onReset,
  onReload,
  errorTitle = 'Something went wrong',
  errorMessage = 'An error occurred while loading this component. Please try again.',
}: DefaultErrorFallbackProps): JSX.Element {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-red-800 dark:text-red-200">{errorTitle}</h3>

          {/* Message */}
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>

          {/* Error Details (Expandable) */}
          <div className="mt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm font-medium text-red-800 hover:text-red-900 dark:text-red-200 dark:hover:text-red-100 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              aria-expanded={showDetails}
            >
              {showDetails ? 'Hide' : 'Show'} error details
            </button>

            {showDetails && (
              <div className="mt-2 rounded border border-red-300 bg-red-100 p-3 dark:border-red-700 dark:bg-red-900">
                <p className="text-xs font-mono text-red-900 dark:text-red-100 break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs font-mono text-red-800 dark:text-red-200 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
              aria-label="Try again"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </button>

            <button
              onClick={onReload}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-700 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900 transition-colors"
              aria-label="Reload page"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Default export
 */
export default ErrorBoundary;
