import * as React from "react";
import { FileText } from "lucide-react";
import { Card } from "../Card";
import { Button } from "../Button";
import { cn } from "../../lib/utils";

/**
 * Formats ISO timestamp to human-readable time
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
 * Props for the DraftBanner component
 */
export interface DraftBannerProps {
  /**
   * Draft data to display in the banner
   */
  draft: {
    /**
     * Optional title of the draft (will be truncated at 50 characters)
     */
    title?: string;
    /**
     * ISO 8601 timestamp of when the draft was saved
     */
    savedAt: string;
  };
  /**
   * Callback triggered when the user clicks the "Resume" button
   */
  onResume: () => void;
  /**
   * Callback triggered when the user clicks the "Discard" button
   */
  onDiscard: () => void;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * DraftBanner Component
 *
 * Alert banner that appears when a draft is available for recovery.
 * Shows draft metadata (timestamp, title preview) with Resume/Discard actions.
 *
 * Features:
 * - Blue accent styling optimized for draft alerts
 * - Responsive layout (stacks on mobile)
 * - Title truncation at 50 characters
 * - Accessible with role="alert" for screen readers
 * - Focus management for keyboard navigation
 *
 * @example
 * ```tsx
 * <DraftBanner
 *   draft={{
 *     title: "My draft prompt",
 *     savedAt: "2024-01-15T10:45:30.000Z"
 *   }}
 *   onResume={() => console.log('Resume draft')}
 *   onDiscard={() => console.log('Discard draft')}
 * />
 * ```
 */
export const DraftBanner = React.forwardRef<HTMLDivElement, DraftBannerProps>(
  ({ draft, onResume, onDiscard, className }, ref) => {
    const formattedTime = formatSavedTime(draft.savedAt);
    const titlePreview = draft.title
      ? draft.title.length > 50
        ? draft.title.slice(0, 50) + '...'
        : draft.title
      : null;

    const resumeButtonRef = React.useRef<HTMLButtonElement>(null);

    // Set initial focus on the Resume button when banner appears
    React.useEffect(() => {
      resumeButtonRef.current?.focus();
    }, []);

    return (
      <Card
        ref={ref}
        role="alert"
        className={cn(
          "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800",
          className
        )}
      >
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left section: Icon + Text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileText
              className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Resume your draft?
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You have an unsaved draft from {formattedTime}
                {titlePreview && (
                  <span className="ml-1">
                    titled &quot;{titlePreview}&quot;
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right section: Buttons */}
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              ref={resumeButtonRef}
              size="sm"
              onClick={onResume}
              aria-label="Resume draft"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscard}
              aria-label="Discard draft"
              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              Discard
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

DraftBanner.displayName = "DraftBanner";
