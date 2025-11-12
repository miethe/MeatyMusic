import * as React from 'react';
import { Play, Edit, Download, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '../../Button';
import { cn } from '../../../lib/utils';
import styles from '../AgentCard.module.css';

export interface AgentActionsProps {
  onRun?: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  onMenuAction?: (action: string) => void;
  isRunning?: boolean;
  isCompact?: boolean;
  isXL?: boolean;
}

export function Actions(props: AgentActionsProps) {
  const { onRun, onEdit, onExport, onMenuAction, isRunning, isCompact, isXL } = props;

  return (
    <div className={cn('flex items-center justify-between gap-2', styles.actionsRow)}>
      <div className="flex items-center gap-2">
        {onRun && (
          <Button
            size={isCompact ? 'sm' : 'default'}
            onClick={onRun}
            disabled={isRunning}
            className="gap-1.5"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
        )}

        {onEdit && !isCompact && (
          <Button
            size={isCompact ? 'sm' : 'default'}
            variant="outline"
            onClick={onEdit}
            className="gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}

        {onExport && !isCompact && (
          <Button
            size={isCompact ? 'sm' : 'default'}
            variant="outline"
            onClick={onExport}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        )}
      </div>

      {onMenuAction && (
        <Button
          size={isCompact ? 'sm' : 'icon'}
          variant="ghost"
          onClick={() => onMenuAction('menu')}
          className="flex-shrink-0"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      )}
    </div>
  );
}
