import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../Button';
import { cn } from '../../../lib/utils';
import styles from '../AgentCard.module.css';

export interface ErrorBannerProps {
  error: string | { message: string; retry?: () => void };
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  const errorObj = typeof error === 'string' ? { message: error } : error;

  return (
    <div className={styles.errorMessage} role="alert">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Error</p>
          <p className="text-xs mt-1 opacity-90">{errorObj.message}</p>
        </div>
        {errorObj.retry && (
          <Button
            size="sm"
            variant="outline"
            onClick={errorObj.retry}
            className="flex-shrink-0"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
