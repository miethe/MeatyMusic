'use client';

import React, { ErrorInfo, Component, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';

interface SidebarContentProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface SidebarContentState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class SidebarContentErrorBoundary extends Component<
  SidebarContentProps,
  SidebarContentState
> {
  constructor(props: SidebarContentProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SidebarContentState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log error for telemetry
    console.error('Sidebar content error:', { error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, className, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return <div className={className}>{fallback}</div>;
      }

      return (
        <SidebarErrorFallback
          error={error}
          onRetry={this.handleRetry}
          className={className}
        />
      );
    }

    return <div className={className}>{children}</div>;
  }
}

interface SidebarErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  className?: string;
}

const SidebarErrorFallback: React.FC<SidebarErrorFallbackProps> = ({
  error,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center',
        'min-h-[200px] text-muted-foreground',
        className
      )}
    >
      <div className="mb-4">
        <div className="text-2xl mb-2">⚠️</div>
        <h3 className="font-medium text-foreground mb-1">
          Something went wrong
        </h3>
        <p className="text-sm">
          The sidebar content failed to load properly.
        </p>
        {error && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer hover:text-foreground">
              Error details
            </summary>
            <pre className="mt-1 text-left bg-muted p-2 rounded text-[10px] overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
      >
        Try Again
      </Button>
    </div>
  );
};

export interface SidebarContentWrapperProps {
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: boolean;
  fallback?: ReactNode;
  loadingSkeleton?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const SidebarContent: React.FC<SidebarContentWrapperProps> = ({
  children,
  className,
  loading = false,
  error = false,
  fallback,
  loadingSkeleton,
  onError,
}) => {
  const contentClasses = cn(
    'flex flex-col h-full',
    'transition-opacity duration-150 ease-in-out',
    loading && 'opacity-50',
    className
  );

  if (loading && loadingSkeleton) {
    return <div className={contentClasses}>{loadingSkeleton}</div>;
  }

  if (error && fallback) {
    return <div className={contentClasses}>{fallback}</div>;
  }

  return (
    <SidebarContentErrorBoundary
      className={contentClasses}
      onError={onError}
      fallback={fallback}
    >
      {children}
    </SidebarContentErrorBoundary>
  );
};

SidebarContent.displayName = 'SidebarContent';
