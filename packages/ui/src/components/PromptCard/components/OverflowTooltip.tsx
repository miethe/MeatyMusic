import * as React from 'react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';

/**
 * OverflowTooltip - Display "+X more" indicators with rich tooltip content
 *
 * Used to show overflow content (tags, models, etc.) in a clean, accessible way.
 * Displays a "+X more" badge that reveals the overflow items in a tooltip.
 *
 * @example
 * ```tsx
 * <OverflowTooltip
 *   overflowCount={3}
 *   items={[
 *     <Badge key="1">Machine Learning</Badge>,
 *     <Badge key="2">Data Science</Badge>,
 *     <Badge key="3">Analytics</Badge>
 *   ]}
 * />
 * ```
 *
 * @example Custom trigger
 * ```tsx
 * <OverflowTooltip
 *   overflowCount={5}
 *   items={models.map(m => <span key={m}>{m}</span>)}
 *   trigger={<span className="text-muted">+{5} models</span>}
 * />
 * ```
 */
export interface OverflowTooltipProps {
  /** Number of items not shown in the main view */
  overflowCount: number;
  /** Items to display in the tooltip */
  items: React.ReactNode[];
  /** Optional custom trigger content (defaults to "+X more" badge) */
  trigger?: React.ReactNode;
  /** Tooltip positioning side */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Tooltip alignment */
  align?: 'start' | 'center' | 'end';
  /** Additional classes for the trigger wrapper */
  className?: string;
  /** Additional classes for the tooltip content */
  contentClassName?: string;
  /** Delay before showing tooltip (ms) */
  delayDuration?: number;
  /** Whether to show arrow on tooltip */
  showArrow?: boolean;
  /** Accessible label for the trigger */
  'aria-label'?: string;
}

export function OverflowTooltip({
  overflowCount,
  items,
  trigger,
  side = 'top',
  align = 'center',
  className,
  contentClassName,
  delayDuration = 200,
  showArrow = true,
  'aria-label': ariaLabel,
}: OverflowTooltipProps) {
  // Don't render if no overflow
  if (overflowCount <= 0 || items.length === 0) {
    return null;
  }

  // Default trigger is a "+X more" badge
  const defaultTrigger = (
    <Badge
      variant="outline"
      size="sm"
      className="text-muted-foreground hover:bg-muted transition-colors cursor-default"
      aria-label={ariaLabel || `${overflowCount} more items`}
    >
      +{overflowCount} more
    </Badge>
  );

  // Tooltip content with overflow items
  const tooltipContent = (
    <div
      className={cn(
        'flex flex-col gap-1.5 max-w-xs',
        contentClassName
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center"
        >
          {item}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn('inline-flex items-center', className)}
      data-testid="overflow-tooltip"
    >
      <Tooltip
        content={tooltipContent}
        side={side}
        align={align}
        delayDuration={delayDuration}
        showArrow={showArrow}
      >
        <span className="inline-flex" tabIndex={0}>
          {trigger || defaultTrigger}
        </span>
      </Tooltip>
    </div>
  );
}

OverflowTooltip.displayName = 'OverflowTooltip';
