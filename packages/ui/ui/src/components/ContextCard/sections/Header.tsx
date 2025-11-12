import * as React from 'react';
import { Box } from 'lucide-react';
import { Badge } from '../../Badge';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import styles from '../../PromptCard/PromptCard.module.css';

export interface HeaderProps {
  title: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isCompact: boolean;
  onVersionClick?: (version: number, event: React.MouseEvent) => void;
}

export function Header(props: HeaderProps) {
  const { title, version, isCompact, onVersionClick } = props;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Context Type Badge */}
      <Badge variant="secondary" size="sm" className="gap-1 flex-shrink-0">
        <Box className="h-3 w-3" />
        {!isCompact && 'Context'}
      </Badge>

      {/* Title */}
      <h3 className={cn(styles.titleText, 'truncate')}>
        {title}
      </h3>

      {/* Version Badge - clickable if handler provided */}
      {!isCompact && (
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <div
                data-clickable-section="version"
                data-version={version}
                onClick={onVersionClick ? (e) => {
                  e.stopPropagation();
                  onVersionClick(version, e);
                } : undefined}
                className={onVersionClick ? 'cursor-pointer' : undefined}
                role={onVersionClick ? 'button' : undefined}
                tabIndex={onVersionClick ? 0 : -1}
                aria-label={onVersionClick ? `View version history: v${version}` : `Version ${version}`}
                onKeyDown={onVersionClick ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onVersionClick(version, e as any);
                  }
                } : undefined}
              >
                <Badge
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs whitespace-nowrap flex-shrink-0",
                    onVersionClick && "transition-colors hover:bg-mp-panel/80 hover:border-mp-primary/50"
                  )}
                >
                  v{version}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Version {version}</p>
              {onVersionClick && (
                <p className="text-xs text-muted-foreground">
                  Click to view version history
                </p>
              )}
            </TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      )}
    </div>
  );
}
