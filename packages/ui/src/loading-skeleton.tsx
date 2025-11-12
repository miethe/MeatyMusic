import React from 'react';

export interface LoadingSkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Whether the skeleton should be circular */
  circular?: boolean;
  /** Number of lines for text skeleton */
  lines?: number;
  /** Custom className */
  className?: string;
  /** Whether to animate the skeleton */
  animate?: boolean;
  /** Use shimmer effect instead of pulse (follows design system 6% overlay) */
  shimmer?: boolean;
  /** Animation timing - follows design system durations */
  timing?: 'micro' | 'ui' | 'panel' | 'custom';
  /** Custom animation duration in ms */
  customDuration?: number;
}

/**
 * A flexible loading skeleton component for various loading states.
 * Supports single skeleton, multiple lines, and circular shapes.
 * Includes shimmer animation and respects prefers-reduced-motion.
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '1rem',
  circular = false,
  lines = 1,
  className = '',
  animate = true,
  shimmer = false,
  timing = 'ui',
  customDuration,
}) => {
  // Animation duration mapping per design system
  const getDuration = () => {
    if (customDuration) return `${customDuration}ms`;
    switch (timing) {
      case 'micro': return '70ms';
      case 'ui': return '150ms';
      case 'panel': return '250ms';
      case 'custom': return customDuration ? `${customDuration}ms` : '150ms';
      default: return '150ms';
    }
  };

  const baseClasses = `
    bg-muted
    ${animate && !shimmer ? 'animate-pulse' : ''}
    ${shimmer ? 'animate-shimmer' : ''}
    ${className}
    motion-reduce:animate-none
  `.trim();

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines === 1) {
    return (
      <div
        className={`${baseClasses} ${circular ? 'rounded-full' : 'rounded'}`}
        style={skeletonStyle}
        role="presentation"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="space-y-2" role="status" aria-label="Loading...">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} rounded`}
          style={{
            ...skeletonStyle,
            width: index === lines - 1 ? '75%' : skeletonStyle.width,
          }}
          role="presentation"
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Pre-configured skeleton for auth forms
 */
export const AuthFormSkeleton: React.FC<{ shimmer?: boolean }> = ({ shimmer = false }) => {
  return (
    <div className="space-y-6">
      {/* OAuth buttons */}
      <div className="space-y-3">
        <LoadingSkeleton height="2.5rem" shimmer={shimmer} timing="ui" />
        <LoadingSkeleton height="2.5rem" shimmer={shimmer} timing="ui" />
      </div>

      {/* Divider */}
      <div className="flex items-center space-x-2">
        <LoadingSkeleton height="1px" width="100%" shimmer={shimmer} />
        <LoadingSkeleton height="1rem" width="2rem" shimmer={shimmer} />
        <LoadingSkeleton height="1px" width="100%" shimmer={shimmer} />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <LoadingSkeleton height="1rem" width="4rem" className="mb-2" shimmer={shimmer} />
          <LoadingSkeleton height="2.5rem" shimmer={shimmer} timing="ui" />
        </div>
        <div>
          <LoadingSkeleton height="1rem" width="5rem" className="mb-2" shimmer={shimmer} />
          <LoadingSkeleton height="2.5rem" shimmer={shimmer} timing="ui" />
        </div>
      </div>

      {/* Submit button */}
      <LoadingSkeleton height="2.5rem" shimmer={shimmer} timing="ui" />

      {/* Footer links */}
      <div className="text-center">
        <LoadingSkeleton height="1rem" width="12rem" className="mx-auto" shimmer={shimmer} />
      </div>
    </div>
  );
};

/**
 * Pre-configured skeleton for button loading states
 */
export const ButtonSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}> = ({
  size = 'md',
  shimmer = false
}) => {
  const heights = {
    sm: '1.75rem',
    md: '2.5rem',
    lg: '3rem',
  };

  return (
    <LoadingSkeleton
      height={heights[size]}
      className="rounded-md"
      shimmer={shimmer}
      timing="ui"
    />
  );
};

export default LoadingSkeleton;
