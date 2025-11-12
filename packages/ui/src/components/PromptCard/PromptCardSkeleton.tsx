import * as React from 'react';
import { cn } from '../../lib/utils';
import { LoadingSkeleton } from '../Skeleton';

export interface PromptCardSkeletonProps {
  /** Card size variant */
  size?: 'compact' | 'standard' | 'xl';
  /** Whether to show shimmer animation */
  shimmer?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Skeleton placeholder for the `PromptCard` component.
 * Uses `LoadingSkeleton` primitives sized to match the real card,
 * preventing layout shift during loading.
 */
export const PromptCardSkeleton: React.FC<PromptCardSkeletonProps> = ({
  size = 'standard',
  shimmer = true,
  className = '',
}) => {
  const sizeConfig = {
    compact: {
      height: '160px',
      headerHeight: '2rem',
      bodyHeight: '2.5rem',
      statsHeight: '1.5rem',
      actionsHeight: '2rem',
      padding: 'p-3',
      spacing: 'space-y-2',
    },
    standard: {
      height: '220px',
      headerHeight: '2.5rem',
      bodyHeight: '3.5rem',
      statsHeight: '2rem',
      actionsHeight: '2.5rem',
      padding: 'p-4',
      spacing: 'space-y-3',
    },
    xl: {
      height: '280px',
      headerHeight: '3rem',
      bodyHeight: '4.5rem',
      statsHeight: '2.5rem',
      actionsHeight: '3rem',
      padding: 'p-6',
      spacing: 'space-y-4',
    },
  } as const;

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'border border-border rounded-lg bg-card',
        config.padding,
        config.spacing,
        size,
        className
      )}
      style={{ height: config.height }}
      role="status"
      aria-label="Loading prompt card..."
      aria-live="polite"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <LoadingSkeleton
            height={config.headerHeight}
            width="85%"
            shimmer={shimmer}
            timing="ui"
          />
          <LoadingSkeleton
            height="1rem"
            width="3rem"
            shimmer={shimmer}
            className="rounded-full"
          />
        </div>
        <LoadingSkeleton
          height="1.5rem"
          width="4rem"
          shimmer={shimmer}
          className="rounded-full"
        />
      </div>

      {/* Meta Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LoadingSkeleton
            height="1.25rem"
            width="3rem"
            shimmer={shimmer}
            className="rounded-full"
          />
          <LoadingSkeleton
            height="1.25rem"
            width="4rem"
            shimmer={shimmer}
            className="rounded-full"
          />
          <LoadingSkeleton
            height="1.25rem"
            width="5rem"
            shimmer={shimmer}
            className="rounded-md"
          />
        </div>
        <LoadingSkeleton
          height="0.875rem"
          width="4rem"
          shimmer={shimmer}
        />
      </div>

      {/* Body Preview */}
      <div className="space-y-2">
        <LoadingSkeleton
          height={config.bodyHeight}
          width="100%"
          shimmer={shimmer}
        />
        {size !== 'compact' && (
          <LoadingSkeleton
            height="1rem"
            width="75%"
            shimmer={shimmer}
          />
        )}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <LoadingSkeleton
              height="1rem"
              width="1rem"
              shimmer={shimmer}
              circular
            />
            <LoadingSkeleton
              height="0.875rem"
              width="2rem"
              shimmer={shimmer}
            />
          </div>
          <div className="flex items-center space-x-1">
            <LoadingSkeleton
              height="1rem"
              width="1rem"
              shimmer={shimmer}
              circular
            />
            <LoadingSkeleton
              height="0.875rem"
              width="2.5rem"
              shimmer={shimmer}
            />
          </div>
          <div className="flex items-center space-x-1">
            <LoadingSkeleton
              height="1rem"
              width="1rem"
              shimmer={shimmer}
              circular
            />
            <LoadingSkeleton
              height="0.875rem"
              width="3rem"
              shimmer={shimmer}
            />
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LoadingSkeleton
            height={config.actionsHeight}
            width="4rem"
            shimmer={shimmer}
            className="rounded-md"
          />
          <LoadingSkeleton
            height={config.actionsHeight}
            width="3rem"
            shimmer={shimmer}
            className="rounded-md"
          />
          <LoadingSkeleton
            height={config.actionsHeight}
            width="3rem"
            shimmer={shimmer}
            className="rounded-md"
          />
        </div>
        <LoadingSkeleton
          height={config.actionsHeight}
          width={config.actionsHeight}
          shimmer={shimmer}
          className="rounded-md"
        />
      </div>
    </div>
  );
};

/**
 * Grid of PromptCard skeletons.
 */
export const PromptCardGridSkeleton: React.FC<{
  count?: number;
  size?: 'compact' | 'standard' | 'xl';
  shimmer?: boolean;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({
  count = 6,
  size = 'standard',
  shimmer = true,
  columns = 3,
  className,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  } as const;

  return (
    <div
      className={cn('grid gap-4', gridCols[columns] || gridCols[3], className)}
      role="status"
      aria-label={`Loading ${count} prompt cards...`}
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <PromptCardSkeleton
          key={index}
          size={size}
          shimmer={shimmer}
          className={className}
        />
      ))}
    </div>
  );
};

PromptCardSkeleton.displayName = 'PromptCardSkeleton';
PromptCardGridSkeleton.displayName = 'PromptCardGridSkeleton';

export default PromptCardSkeleton;
