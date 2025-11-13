import * as React from 'react';
import { Wrench } from 'lucide-react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';

export interface Tool {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

export interface ToolsRowProps {
  tools: Tool[];
  maxVisible?: number;
  onClick?: (toolId: string, event: React.MouseEvent) => void;
  isCompact?: boolean;
}

export function ToolsRow({ tools, maxVisible = 3, onClick, isCompact }: ToolsRowProps) {
  if (tools.length === 0) return null;

  const visibleTools = tools.slice(0, maxVisible);
  const remainingCount = Math.max(0, tools.length - maxVisible);
  const hiddenTools = tools.slice(maxVisible);

  const handleToolClick = React.useCallback((toolId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(toolId, e);
    }
  }, [onClick]);

  const handleKeyDown = React.useCallback((toolId: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) {
        onClick(toolId, e as any);
      }
    }
  }, [onClick]);

  return (
    <div className="flex items-center gap-2 px-3">
      <Wrench className="h-3.5 w-3.5 text-text-muted shrink-0" />
      <span className="text-xs font-medium text-text-muted">Tools:</span>
      <div className="flex items-center gap-1 flex-wrap">
        {visibleTools.map(tool => (
          <div
            key={tool.id}
            data-clickable-section="tool"
            data-tool-id={tool.id}
            onClick={onClick ? handleToolClick(tool.id) : undefined}
            onKeyDown={onClick ? handleKeyDown(tool.id) : undefined}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={onClick ? 'cursor-pointer' : undefined}
          >
            <Badge
              variant="outline"
              size="sm"
              className={cn(
                'text-xs',
                onClick && 'transition-colors hover:border-mp-primary/50'
              )}
            >
              {tool.icon && (
                <span className="mr-1">
                  {typeof tool.icon === 'function' ? (
                    React.createElement(tool.icon as any, { className: 'h-3 w-3' })
                  ) : React.isValidElement(tool.icon) ? (
                    tool.icon
                  ) : null}
                </span>
              )}
              {isCompact ? (tool.icon ? '' : String(tool.name).substring(0, 1)) : String(tool.name || '')}
            </Badge>
          </div>
        ))}
        {remainingCount > 0 && (
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-medium mb-1">All tools ({tools.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {hiddenTools.map((tool) => (
                    <span key={tool.id} className="text-xs bg-white/10 px-1 py-0.5 rounded">
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            }
            side="top"
            align="start"
          >
            <Badge variant="outline" size="sm" className="text-xs cursor-help">
              +{remainingCount}
            </Badge>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
