'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '../../lib/utils';

/**
 * Tooltip - A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
 *
 * Based on Radix UI Tooltip primitive with proper styling and accessibility.
 * Supports keyboard navigation and screen readers.
 */

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipPortal = TooltipPrimitive.Portal;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn('fill-primary', className)}
    {...props}
  />
));
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

/**
 * Simplified Tooltip component for common use cases
 *
 * @example
 * <Tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 */
interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** How long to wait before showing the tooltip (in ms) */
  delayDuration?: number;
  /** The side of the trigger to show the tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** How to align the tooltip relative to the trigger */
  align?: 'start' | 'center' | 'end';
  /** Additional CSS classes for the tooltip content */
  className?: string;
  /** Whether to show an arrow pointing to the trigger */
  showArrow?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delayDuration = 200,
  side = 'top',
  align = 'center',
  className,
  showArrow = true,
}) => (
  <TooltipProvider delayDuration={delayDuration}>
    <TooltipRoot>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side={side} align={align} className={className}>
          {content}
          {showArrow && <TooltipArrow />}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
);

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot as TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipArrow,
  type TooltipProps,
};
