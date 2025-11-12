import * as React from 'react';
import { Edit, Link, FileText, Code } from 'lucide-react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';

export interface SourceTypeBadgeProps {
  sourceType: 'manual' | 'url' | 'file' | 'api';
  sourceRef?: string;
  isCompact?: boolean;
  onClick?: () => void;
}

const iconMap = {
  manual: Edit,
  url: Link,
  file: FileText,
  api: Code,
};

const labelMap = {
  manual: 'Manual',
  url: 'URL',
  file: 'File',
  api: 'API',
};

export function SourceTypeBadge(props: SourceTypeBadgeProps) {
  const { sourceType, sourceRef, isCompact, onClick } = props;
  const Icon = iconMap[sourceType];
  const label = labelMap[sourceType];

  // Determine if this is a clickable URL
  const isClickableUrl = sourceType === 'url' && sourceRef;
  const handleClick = onClick || (isClickableUrl
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(sourceRef, '_blank', 'noopener,noreferrer');
      }
    : undefined);

  const handleKeyDown = handleClick
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleClick(e as any);
        }
      }
    : undefined;

  const badge = (
    <Badge
      variant="outline"
      size="sm"
      className={cn(
        "gap-1 flex-shrink-0",
        handleClick && "cursor-pointer transition-colors hover:bg-mp-panel/80 hover:border-mp-primary/50"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={handleClick ? 'button' : undefined}
      tabIndex={handleClick ? 0 : -1}
      aria-label={isClickableUrl ? `Open ${sourceRef} in new tab` : undefined}
    >
      <Icon className="h-3 w-3" />
      {!isCompact && label}
    </Badge>
  );

  // If there's a source reference, wrap in tooltip
  if (sourceRef) {
    return (
      <Tooltip
        content={
          <div className="max-w-xs">
            <div className="font-medium mb-1">Source: {label}</div>
            <div className="text-xs text-text-muted break-all">
              {sourceRef}
            </div>
            {isClickableUrl && (
              <div className="text-xs text-primary mt-1">
                Click to open in new tab
              </div>
            )}
          </div>
        }
        side="top"
        align="end"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
