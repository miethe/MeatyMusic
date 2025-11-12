import * as React from 'react';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';

export interface TruncatedTextProps {
  text: string;
  className?: string;
  maxLines?: number;
  showTooltip?: boolean;
  children?: React.ReactNode;
}

export function TruncatedText({
  text,
  className,
  maxLines = 1,
  showTooltip = true
}: TruncatedTextProps) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkOverflow = () => {
      if (maxLines === 1) {
        setIsOverflowing(element.scrollWidth > element.clientWidth);
      } else {
        setIsOverflowing(element.scrollHeight > element.clientHeight);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [text, maxLines]);

  const textElement = (
    <div
      ref={textRef}
      className={cn(
        'truncate min-w-0',
        maxLines > 1 && 'line-clamp-' + maxLines,
        className
      )}
      style={maxLines > 1 ? {
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } : undefined}
    >
      {text}
    </div>
  );

  if (!showTooltip || !isOverflowing) {
    return textElement;
  }

  return (
    <Tooltip content={text} side="top" align="start">
      {textElement}
    </Tooltip>
  );
}
