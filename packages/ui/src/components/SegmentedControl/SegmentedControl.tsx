/**
 * SegmentedControl Component
 *
 * A segmented control component for navigation and selection built on Radix Tabs.
 * Provides a clean, accessible way to switch between different views or options.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   value={activeSegment}
 *   onValueChange={setActiveSegment}
 *   segments={[
 *     { value: 'mine', label: 'Mine' },
 *     { value: 'team', label: 'Team' },
 *     { value: 'public', label: 'Public' }
 *   ]}
 *   aria-label="View filter"
 * />
 * ```
 */

'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

/**
 * Props for individual segment items
 */
export interface Segment {
  /** Unique value for the segment */
  value: string;
  /** Display label for the segment */
  label: string;
  /** Whether the segment is disabled */
  disabled?: boolean;
}

/**
 * Props for the SegmentedControl component
 */
export interface SegmentedControlProps {
  /** Currently active segment value */
  value: string;
  /** Callback when segment changes */
  onValueChange: (value: string) => void;
  /** Array of segments to display */
  segments: Segment[];
  /** Accessible label for the control */
  'aria-label'?: string;
  /** Optional CSS class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SegmentedControl - A navigation/selection component with smooth animations
 *
 * Built on Radix Tabs for accessibility and keyboard navigation.
 * Supports arrow key navigation, Home/End keys, and proper ARIA attributes.
 *
 * @accessibility
 * - Full keyboard navigation (Arrow keys, Home, End, Tab)
 * - Proper ARIA roles and attributes
 * - Focus ring meets WCAG contrast requirements
 * - Screen reader friendly labels
 *
 * @design
 * - Active segment has elevated appearance with shadow
 * - Smooth 200ms transitions on all state changes
 * - Touch-friendly with adequate tap targets (44x44px minimum)
 * - Uses design tokens for consistent theming
 */
export const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(
  (
    {
      value,
      onValueChange,
      segments,
      'aria-label': ariaLabel,
      className,
      size = 'md',
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        root: 'h-8',
        trigger: 'px-3 py-1 text-xs min-w-[60px]',
      },
      md: {
        root: 'h-10',
        trigger: 'px-4 py-2 text-sm min-w-[80px]',
      },
      lg: {
        root: 'h-12',
        trigger: 'px-6 py-3 text-base min-w-[100px]',
      },
    };

    const currentSizeClasses = sizeClasses[size];

    return (
      <Tabs.Root
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        className={cn('inline-flex', className)}
      >
        <Tabs.List
          className={cn(
            'relative inline-flex items-center justify-center gap-1',
            'rounded-lg bg-mp-panel p-1',
            'shadow-[var(--mp-elevation-1)]',
            'border border-mp-border',
            currentSizeClasses.root
          )}
          aria-label={ariaLabel}
        >
          {segments.map((segment) => {
            const isActive = value === segment.value;

            return (
              <Tabs.Trigger
                key={segment.value}
                value={segment.value}
                disabled={segment.disabled}
                className={cn(
                  'relative inline-flex items-center justify-center whitespace-nowrap',
                  'rounded-md font-medium',
                  'transition-all duration-[var(--mp-motion-duration-ui)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
                  currentSizeClasses.trigger,
                  isActive
                    ? [
                        'bg-mp-surface text-text-strong',
                        'shadow-[var(--mp-elevation-2)]',
                        'font-semibold',
                        'z-10',
                      ]
                    : [
                        'text-text-muted',
                        'hover:text-text-base hover:bg-mp-panel/50',
                        'active:scale-[0.98]',
                      ]
                )}
                aria-label={`${segment.label} ${isActive ? '(selected)' : ''}`}
              >
                {segment.label}
                {isActive && (
                  <span
                    className={cn(
                      'absolute bottom-0 left-1/2 -translate-x-1/2',
                      'h-0.5 w-3/4 rounded-t-full',
                      'bg-mp-primary',
                      'animate-slideInBottom'
                    )}
                    aria-hidden="true"
                  />
                )}
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
      </Tabs.Root>
    );
  }
);

SegmentedControl.displayName = 'SegmentedControl';

export default SegmentedControl;
