import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../Button';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';

export interface ErrorBannerProps {
  error: string | { message: string; retry?: () => void };
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  const retry = typeof error === 'object' ? error.retry : undefined;
  return (
    <div className={styles.errorMessage} role="alert" aria-live="polite">
      <div className={styles.errorPanel}>
        <div className={styles.errorContent}>
          <div className={styles.errorTitle}>Error occurred</div>
          <p className={cn('text-sm', styles.errorDescription)}>{message}</p>
        </div>
        {retry && (
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            className={cn('gap-1', styles.retryButton)}
            aria-label="Retry the failed operation"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
