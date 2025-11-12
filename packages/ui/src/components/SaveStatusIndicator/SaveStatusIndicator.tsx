import * as React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Props for SaveStatusIndicator component
 */
export interface SaveStatusIndicatorProps {
  /**
   * Current save state
   * - idle: No save operation in progress or pending
   * - pending: Changes exist but not yet being saved
   * - saving: Actively saving to storage
   * - saved: Successfully saved
   * - error: Save operation failed
   */
  saveState: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  /**
   * ISO timestamp of last successful save, or null if never saved
   */
  lastSavedAt: string | null;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Format ISO timestamp to human-readable time
 *
 * Converts ISO 8601 timestamp to "HH:MM AM/PM" format.
 * Returns empty string for invalid timestamps.
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted time string
 *
 * @example
 * ```ts
 * formatSavedTime('2024-01-15T10:45:30.000Z') // "10:45 AM"
 * formatSavedTime('invalid') // ""
 * ```
 */
function formatSavedTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      return '';
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return '';
  }
}

/**
 * SaveStatusIndicator Component
 *
 * Displays the current save status with appropriate icon and text.
 * Hidden when idle or pending. Shows visual feedback during saving,
 * success confirmation, and error states.
 *
 * ## Features
 * - Automatic hide/show based on save state
 * - Animated spinner during save
 * - Timestamp formatting for saved state
 * - Semantic colors for each state
 * - Full ARIA live region support
 * - Respects prefers-reduced-motion
 *
 * ## Accessibility
 * - ARIA live region (polite) for status updates
 * - Screen reader friendly status text
 * - High contrast mode support
 * - Reduced motion: static icons (no spinner animation)
 *
 * @example
 * ```tsx
 * // During save
 * <SaveStatusIndicator
 *   saveState="saving"
 *   lastSavedAt={null}
 * />
 *
 * // After successful save
 * <SaveStatusIndicator
 *   saveState="saved"
 *   lastSavedAt="2024-01-15T10:45:30.000Z"
 * />
 *
 * // Error state
 * <SaveStatusIndicator
 *   saveState="error"
 *   lastSavedAt="2024-01-15T10:45:30.000Z"
 * />
 * ```
 */
export const SaveStatusIndicator = React.forwardRef<
  HTMLDivElement,
  SaveStatusIndicatorProps
>(({ saveState, lastSavedAt, className }, ref) => {
  // Hide when idle or pending
  if (saveState === 'idle' || saveState === 'pending') {
    return null;
  }

  // Determine icon, text, and color based on state
  let icon: React.ReactNode;
  let text: string;
  let colorClass: string;
  let ariaLabel: string;

  switch (saveState) {
    case 'saving':
      icon = (
        <Loader2
          className="h-3 w-3 motion-safe:animate-spin"
          aria-hidden="true"
        />
      );
      text = 'Saving...';
      colorClass = 'text-muted-foreground';
      ariaLabel = 'Saving draft';
      break;

    case 'saved':
      icon = <Check className="h-3 w-3" aria-hidden="true" />;
      const formattedTime = lastSavedAt ? formatSavedTime(lastSavedAt) : '';
      text = formattedTime
        ? `Draft saved at ${formattedTime}`
        : 'Draft saved';
      colorClass = 'text-green-600 dark:text-green-400';
      ariaLabel = text;
      break;

    case 'error':
      icon = <AlertCircle className="h-3 w-3" aria-hidden="true" />;
      text = 'Save failed';
      colorClass = 'text-destructive';
      ariaLabel = 'Failed to save draft';
      break;

    default:
      // Should never reach here due to type system
      return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-opacity duration-200 ease-in-out',
        colorClass,
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
});

SaveStatusIndicator.displayName = 'SaveStatusIndicator';
