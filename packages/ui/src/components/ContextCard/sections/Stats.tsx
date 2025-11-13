import * as React from 'react';
import { Link2 } from 'lucide-react';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import styles from '../../PromptCard/PromptCard.module.css';

export interface StatsProps {
  usageCount: number;
  onUsageClick?: () => void;
}

export function Stats(props: StatsProps) {
  const { usageCount, onUsageClick } = props;

  const handleClick = onUsageClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onUsageClick();
      }
    : undefined;

  const handleKeyDown = onUsageClick
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onUsageClick();
        }
      }
    : undefined;

  const usageText = `Used in ${usageCount} ${usageCount === 1 ? 'prompt' : 'prompts'}`;

  return (
    <div className={cn(styles.statsRow)}>
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'text-sm text-muted-foreground flex items-center gap-1',
                onUsageClick && 'cursor-pointer hover:text-text-base hover:underline'
              )}
              onClick={handleClick}
              role={onUsageClick ? 'button' : undefined}
              tabIndex={onUsageClick ? 0 : -1}
              aria-label={onUsageClick ? `View usage details: ${usageText}` : usageText}
              onKeyDown={handleKeyDown}
            >
              {onUsageClick && <Link2 className="h-3 w-3" />}
              {usageText}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{usageText}</p>
            {onUsageClick && (
              <p className="text-xs text-muted-foreground">
                Click to see which prompts use this context
              </p>
            )}
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    </div>
  );
}
