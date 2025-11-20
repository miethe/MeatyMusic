"use client";
import React, { useState, useEffect } from 'react';
import { Button } from './components/Button/Button';

export interface ErrorLayoutProps {
  title: string;
  statusCode: number;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'link' | 'destructive';
  }>;
  showStatusCode?: boolean;
  illustration?: React.ReactNode;
  additionalContent?: React.ReactNode;
  className?: string;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({
  title,
  statusCode,
  message,
  actions = [],
  showStatusCode = true,
  illustration,
  additionalContent,
  className = '',
}) => {
  const [timestamp, setTimestamp] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimestamp(new Date().toLocaleString());
    setHasHydrated(true);
  }, []);

  const statusColorClass = React.useMemo(() => {
    if (statusCode >= 500) return 'text-red-500';
    if (statusCode >= 400) return 'text-orange-500';
    return 'text-blue-500';
  }, [statusCode]);

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-background text-foreground ${className}`}>
      <div className="max-w-2xl w-full text-center">
        {/* Status Code */}
        {showStatusCode && (
          <div className="mb-6">
            <h1 className={`text-8xl md:text-9xl font-bold ${statusColorClass} mb-2`}>
              {statusCode}
            </h1>
          </div>
        )}

        {/* Illustration */}
        {illustration && (
          <div className="mb-8 flex justify-center">
            {illustration}
          </div>
        )}

        {/* Title and Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                size="lg"
                onClick={action.onClick}
                className="min-w-[120px]"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Additional Content */}
        {additionalContent && (
          <div className="mt-8 pt-8 border-t border-border">
            {additionalContent}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-xs text-muted-foreground">
          <p>Error occurred at {isClient ? timestamp : '...'}</p>
        </div>
      </div>
    </main>
  );
};

export default ErrorLayout;
