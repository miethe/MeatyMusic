import * as React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface EntryPromptPreviewProps {
  prompt: {
    id: string;
    name: string;
    preview: string;
  };
  onClick?: (promptId: string, event: React.MouseEvent) => void;
  isCompact?: boolean;
}

export function EntryPromptPreview({ prompt, onClick, isCompact }: EntryPromptPreviewProps) {
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(prompt.id, e);
    }
  }, [onClick, prompt.id]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) {
        onClick(prompt.id, e as any);
      }
    }
  }, [onClick, prompt.id]);

  return (
    <div
      className={cn(
        'px-3 py-2 bg-mp-panel/20 rounded-mp-sm transition-colors',
        onClick && 'cursor-pointer hover:bg-mp-panel/40'
      )}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-clickable-section="entry-prompt"
      aria-label={onClick ? `View entry prompt: ${prompt.name}` : undefined}
    >
      <div className="flex items-start gap-2">
        <FileText className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted mb-0.5">Entry Prompt</p>
          <p className={cn(
            'text-sm text-text-base',
            isCompact ? 'line-clamp-1' : 'line-clamp-2'
          )}>
            {prompt.preview}
          </p>
        </div>
      </div>
    </div>
  );
}
