'use client';

import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "../Button";
import { Card, CardContent } from "../Card";
import { isDevelopment, isProduction } from "../../lib/env";
import styles from "./PromptCard.module.css";

interface PromptCardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

interface PromptCardErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

export class PromptCardErrorBoundary extends Component<
  PromptCardErrorBoundaryProps,
  PromptCardErrorBoundaryState
> {
  constructor(props: PromptCardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PromptCardErrorBoundaryState {
    // Generate a unique error ID for tracking
    const errorId = `prompt-card-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('PromptCard Error Boundary:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      componentStack: errorInfo.componentStack,
      stack: error.stack
    });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (isProduction()) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error fallback UI
      return (
        <Card className={styles.card} role="alert" aria-live="polite">
          <CardContent className={styles.contentSpacing}>
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--mp-color-danger)' }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="font-medium text-sm mb-1"
                  style={{ color: 'var(--mp-color-text-strong)' }}
                >
                  Unable to load prompt card
                </h3>
                <p
                  className="text-sm mb-3"
                  style={{ color: 'var(--mp-color-text-muted)' }}
                >
                  Something went wrong while rendering this prompt card.
                  Please try again or contact support if the problem persists.
                </p>

                {/* Development error details */}
                {isDevelopment() && this.state.error && (
                  <details className="mb-3">
                    <summary
                      className="text-xs cursor-pointer hover:underline"
                      style={{ color: 'var(--mp-color-text-muted)' }}
                    >
                      Error Details (dev only)
                    </summary>
                    <pre
                      className="text-xs mt-2 p-2 rounded overflow-auto max-h-32"
                      style={{
                        backgroundColor: 'var(--mp-color-surface-muted)',
                        color: 'var(--mp-color-text-muted)',
                        fontSize: '10px'
                      }}
                    >
                      {this.state.error.message}
                      {this.state.error.stack && `\n${this.state.error.stack}`}
                    </pre>
                  </details>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleRetry}
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Try Again
                  </Button>

                  {isDevelopment() && this.state.errorId && (
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--mp-color-surface-muted)',
                        color: 'var(--mp-color-text-muted)'
                      }}
                      title="Error ID for debugging"
                    >
                      ID: {this.state.errorId.slice(-8)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withPromptCardErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<PromptCardErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundary = React.forwardRef<any, P>((props, ref) => (
    <PromptCardErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...(props as P)} ref={ref} />
    </PromptCardErrorBoundary>
  ));

  WithErrorBoundary.displayName = `withPromptCardErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundary;
}
