import * as React from 'react';
import { Badge, type BadgeProps } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';

export interface TruncatedBadgeProps extends Omit<BadgeProps, 'children'> {
  text: string;
  maxWidth?: string | number;
  showTooltip?: boolean;
}

export function TruncatedBadge({
  text,
  maxWidth = '120px',
  showTooltip = true,
  className,
  ...badgeProps
}: TruncatedBadgeProps) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const badgeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = badgeRef.current;
    if (!element) return;

    const checkOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [text]);

  const badgeElement = (
    <div ref={badgeRef} style={{ maxWidth }}>
      <Badge
        className={cn('min-w-0 max-w-full', className)}
        {...badgeProps}
      >
        <span className="truncate min-w-0 block">
          {text}
        </span>
      </Badge>
    </div>
  );

  if (!showTooltip || !isOverflowing) {
    return badgeElement;
  }

  return (
    <Tooltip content={text} side="top" align="center">
      {badgeElement}
    </Tooltip>
  );
}
