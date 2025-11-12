import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../Button';
import styles from '../../PromptCard/PromptCard.module.css';

export interface ErrorBannerProps {
  error: string | { message: string; retry?: () => void };
}

export function ErrorBanner(props: ErrorBannerProps) {
  const { error } = props;
  const errorMessage = typeof error === 'string' ? error : error.message;
  const retryFn = typeof error === 'object' && error.retry ? error.retry : undefined;

  return (
    <div className={styles.errorMessage}>
      <div className={styles.errorPanel}>
        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <div className={styles.errorContent}>
          <p className={styles.errorTitle}>Context Error</p>
          <p className={styles.errorDescription}>{errorMessage}</p>
        </div>
        {retryFn && (
          <Button size="sm" variant="outline" onClick={retryFn} className={styles.retryButton}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
