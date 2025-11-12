import React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton, LoadingSkeleton } from '../Skeleton';

export interface SidebarSkeletonProps {
  className?: string;
  variant?: 'default' | 'filters' | 'navigation' | 'content';
  animated?: boolean;
  lines?: number;
}

export const SidebarSkeleton: React.FC<SidebarSkeletonProps> = ({
  className,
  variant = 'default',
  animated = true,
  lines = 6,
}) => {
  const skeletonClasses = cn(
    'flex flex-col p-4 space-y-4',
    className
  );

  const renderFiltersSkeleton = () => (
    <div className={skeletonClasses}>
      {/* Header */}
      <div className="space-y-2">
        <LoadingSkeleton height="1.5rem" width="5rem" shimmer={animated} />
        <LoadingSkeleton height="1px" width="100%" shimmer={animated} />
      </div>

      {/* Filter sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton height="1rem" width="4rem" shimmer={animated} />
          <LoadingSkeleton height="2.25rem" width="100%" shimmer={animated} />
        </div>
      ))}

      {/* Toggle buttons */}
      <div className="space-y-2">
        <LoadingSkeleton height="1rem" width="3rem" shimmer={animated} />
        <div className="flex gap-2">
          <LoadingSkeleton height="2rem" width="100%" shimmer={animated} />
          <LoadingSkeleton height="2rem" width="100%" shimmer={animated} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4">
        <LoadingSkeleton height="2.25rem" width="100%" shimmer={animated} />
        <LoadingSkeleton height="2.25rem" width="100%" shimmer={animated} />
      </div>
    </div>
  );

  const renderNavigationSkeleton = () => (
    <div className={skeletonClasses}>
      {/* Header */}
      <LoadingSkeleton height="2rem" width="6rem" shimmer={animated} />

      {/* Navigation items */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <LoadingSkeleton height="1rem" width="1rem" shimmer={animated} />
          <LoadingSkeleton height="1rem" width="100%" shimmer={animated} />
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-center space-x-3">
          <LoadingSkeleton height="1.5rem" width="1.5rem" shimmer={animated} circular />
          <LoadingSkeleton height="1rem" width="5rem" shimmer={animated} />
        </div>
      </div>
    </div>
  );

  const renderContentSkeleton = () => (
    <div className={skeletonClasses}>
      {/* Title */}
      <LoadingSkeleton height="1.5rem" width="8rem" shimmer={animated} />

      {/* Content blocks */}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton
            height="1rem"
            width={i % 3 === 0 ? "100%" : i % 3 === 1 ? "75%" : "50%"}
            shimmer={animated}
          />
        </div>
      ))}
    </div>
  );

  const renderDefaultSkeleton = () => (
    <div className={skeletonClasses}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          height="1rem"
          width={i === 0 ? "75%" : i === lines - 1 ? "50%" : "100%"}
          shimmer={animated}
        />
      ))}
    </div>
  );

  switch (variant) {
    case 'filters':
      return renderFiltersSkeleton();
    case 'navigation':
      return renderNavigationSkeleton();
    case 'content':
      return renderContentSkeleton();
    default:
      return renderDefaultSkeleton();
  }
};

SidebarSkeleton.displayName = 'SidebarSkeleton';
