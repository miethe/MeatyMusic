import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../Skeleton";
import { Progress } from "../Progress";

const loadingScreenVariants = cva(
  "flex flex-col items-center justify-center min-h-[200px]",
  {
    variants: {
      variant: {
        spinner: "gap-4",
        skeleton: "w-full gap-4",
        progress: "gap-4",
      },
      fullScreen: {
        true: "min-h-screen",
        false: "",
      },
    },
    defaultVariants: {
      variant: "spinner",
      fullScreen: false,
    },
  }
);

export interface LoadingScreenProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingScreenVariants> {
  /** Loading message to display */
  message?: string;
  /** Progress percentage (0-100) for progress variant */
  progress?: number;
  /** Number of skeleton lines for skeleton variant */
  skeletonLines?: number;
}

/**
 * LoadingScreen component for full-page or section loading states.
 *
 * Variants:
 * - spinner: Animated spinner with optional message
 * - skeleton: Skeleton placeholder for content
 * - progress: Progress bar with percentage
 *
 * Accessibility:
 * - Respects prefers-reduced-motion
 * - Announces loading state to screen readers
 * - ARIA live regions for progress updates
 *
 * @example
 * ```tsx
 * // Spinner loading
 * <LoadingScreen
 *   variant="spinner"
 *   message="Loading prompts..."
 * />
 *
 * // Progress loading
 * <LoadingScreen
 *   variant="progress"
 *   progress={75}
 *   message="Uploading file... 75%"
 * />
 *
 * // Skeleton loading
 * <LoadingScreen
 *   variant="skeleton"
 *   skeletonLines={3}
 * />
 * ```
 */
const LoadingScreen = React.forwardRef<HTMLDivElement, LoadingScreenProps>(
  (
    {
      className,
      variant = "spinner",
      fullScreen = false,
      message = "Loading...",
      progress,
      skeletonLines = 5,
      ...props
    },
    ref
  ) => {
    // For progress variant, validate and clamp progress value
    const progressValue = progress !== undefined
      ? Math.max(0, Math.min(100, progress))
      : undefined;

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          loadingScreenVariants({ variant, fullScreen }),
          className
        )}
        {...props}
      >
        {variant === "spinner" && (
          <>
            <Loader2
              className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none"
              aria-hidden="true"
            />
            <p className="text-sm text-text-muted">
              {message}
            </p>
            {/* Screen reader only text */}
            <span className="sr-only">Loading, please wait</span>
          </>
        )}

        {variant === "skeleton" && (
          <div className="w-full max-w-2xl space-y-3 px-4">
            {Array.from({ length: skeletonLines }).map((_, index) => (
              <Skeleton
                key={index}
                className={cn(
                  "h-4",
                  // Vary skeleton widths for more realistic appearance
                  index % 3 === 0 ? "w-full" : index % 2 === 0 ? "w-4/5" : "w-3/4"
                )}
              />
            ))}
            {/* Screen reader only text */}
            <span className="sr-only">{message}</span>
          </div>
        )}

        {variant === "progress" && progressValue !== undefined && (
          <>
            <div className="w-full max-w-md space-y-2 px-4">
              <Progress
                value={progressValue}
                className="h-2"
                aria-label="Loading progress"
              />
              <p className="text-sm text-text-muted text-center">
                {message}
              </p>
            </div>
            {/* Screen reader announcement for progress updates */}
            <span className="sr-only" aria-live="polite">
              {progressValue}% complete
            </span>
          </>
        )}
      </div>
    );
  }
);

LoadingScreen.displayName = "LoadingScreen";

export { LoadingScreen };
