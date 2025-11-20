import React from 'react';
import { Button } from './components/Button/Button';

export interface ErrorFallbackProps {
  error?: Error;
  retry?: () => void;
  title?: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'link' | 'destructive';
  }>;//TODO: Use ButtonVariant Type
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retry,
  title = 'Something went wrong',
  description = 'An error occurred while loading this content.',
  actions = [],
  icon,
  className = '',
  compact = false,
}) => {
  const defaultActions = [
    ...(retry ? [{
      label: 'Try Again',
      onClick: retry,
      variant: 'primary' as const,
    }] : []),
    {
      label: 'Reload Page',
      onClick: () => window.location.reload(),
      variant: 'secondary' as const,
    },
    ...actions,
  ];

  const defaultIcon = icon || (
    <div className="text-4xl mb-3" role="img" aria-label="Error">
      ⚠️
    </div>
  );

  if (compact) {
    return (
      <div className={`p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500">
            {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {title}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {description}
            </p>
            {defaultActions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {defaultActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'secondary'}
                    size="sm"
                    onClick={action.onClick}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="max-w-md w-full">
        {defaultIcon}

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h2>

        <p className="text-muted-foreground mb-6">
          {description}
        </p>

        {defaultActions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {defaultActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                onClick={action.onClick}
                className="min-w-[100px]"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

  {error && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Error Details (Development)
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-32 text-destructive">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Specialized error fallbacks for common scenarios

export const NetworkErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'description' | 'icon'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Connection Problem"
    description="Unable to connect to the server. Please check your internet connection and try again."
    icon="🌐"
  />
);

export const NotFoundErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'description' | 'icon'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Content Not Found"
    description="The content you're looking for could not be found or may have been moved."
    icon="🔍"
  />
);

export const LoadingErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'description' | 'icon'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Loading Failed"
    description="This content failed to load. This might be a temporary issue."
    icon="⏳"
  />
);

export const PermissionErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'description' | 'icon'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Access Denied"
    description="You don't have permission to view this content. Please contact your administrator if you believe this is an error."
    icon="🔒"
    actions={[
      {
        label: 'Go Back',
        onClick: () => window.history.back(),
        variant: 'secondary',
      },
      {
        label: 'Go Home',
        onClick: () => window.location.href = '/',
        variant: 'outline',
      },
    ]}
  />
);

export default ErrorFallback;
