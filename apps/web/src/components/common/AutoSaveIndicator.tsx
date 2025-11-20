/**
 * Auto-save Indicator Component
 * Shows save status (saved, saving, or time since last save)
 *
 * Features:
 * - Shows "Saved" with checkmark when saved
 * - Shows "Saving..." with spinner when saving
 * - Shows "Last saved: X ago" with relative time
 * - Unobtrusive UI (top-right or configurable position)
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <AutoSaveIndicator
 *   isSaved={isSaved}
 *   isSaving={isSaving}
 *   lastSaved={lastSaved}
 *   position="top-right"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { Check, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Auto-save indicator props
 */
export interface AutoSaveIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the data is currently saved */
  isSaved: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Timestamp of last save */
  lastSaved: Date | null;
  /** Position of the indicator (default: 'bottom-right') */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether to show time since last save (default: true) */
  showTimestamp?: boolean;
}

/**
 * Format time difference as relative time
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 10) {
    return 'just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Get position classes
 */
function getPositionClasses(position: AutoSaveIndicatorProps['position']): string {
  switch (position) {
    case 'top-right':
      return 'top-4 right-4';
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-right':
    default:
      return 'bottom-4 right-4';
  }
}

/**
 * Auto-save indicator component
 */
export function AutoSaveIndicator({
  isSaved,
  isSaving,
  lastSaved,
  position = 'bottom-right',
  showTimestamp = true,
  className,
  ...props
}: AutoSaveIndicatorProps) {
  // Update timestamp every 5 seconds
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!lastSaved || !showTimestamp) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [lastSaved, showTimestamp]);

  // Don't render if there's no save status to show
  if (!isSaving && !isSaved && !lastSaved) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-10',
        'pointer-events-none select-none',
        getPositionClasses(position),
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-background/80 backdrop-blur-sm',
          'border border-border-default',
          'shadow-sm',
          'text-xs font-medium',
          'transition-all duration-200',
          isSaving && 'text-[var(--mm-color-text-secondary)]',
          isSaved && !isSaving && 'text-[var(--mm-color-success-500)]'
        )}
      >
        {/* Saving state */}
        {isSaving && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            <span>Saving...</span>
          </>
        )}

        {/* Saved state */}
        {!isSaving && isSaved && (
          <>
            <Check className="w-3 h-3" aria-hidden="true" />
            <span>Saved</span>
          </>
        )}

        {/* Last saved timestamp */}
        {!isSaving && !isSaved && lastSaved && showTimestamp && (
          <>
            <Clock className="w-3 h-3 text-[var(--mm-color-text-tertiary)]" aria-hidden="true" />
            <span className="text-[var(--mm-color-text-secondary)]">
              Last saved {formatTimeAgo(lastSaved)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
