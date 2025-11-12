import * as React from 'react';
import { Play, Edit, GitFork, BarChart3, Activity, History, MoreHorizontal } from 'lucide-react';
import { Button } from '../../Button';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';

export interface ActionsProps {
  isCompact: boolean;
  isXL: boolean;
  onRun?: () => void;
  onEdit?: () => void;
  onFork?: () => void;
  onMenuAction?: (action: string) => void;
  onCompare?: () => void;
  onAnalytics?: () => void;
  onHistory?: () => void;
  isRunning?: boolean;
}

export function Actions(props: ActionsProps) {
  const { isCompact, isXL, onRun, onEdit, onFork, onMenuAction, onCompare, onAnalytics, onHistory, isRunning } = props;
  return (
    <div className={cn("flex items-center justify-between", styles.actionsRow)}>
      <div className="flex items-center gap-2">
        <Button size={isCompact ? 'sm' : 'default'} onClick={onRun} disabled={isRunning} className="gap-1">
          <Play className="w-3 h-3" />
          {isRunning ? 'Running...' : 'Run'}
        </Button>

        {onEdit && (
          <Button
            variant="outline"
            size={isCompact ? 'sm' : 'default'}
            onClick={onEdit}
            className={isCompact ? '' : 'gap-1'}
            aria-label={isCompact ? 'Edit prompt' : undefined}
          >
            <Edit className="w-3 h-3" />
            {!isCompact && 'Edit'}
          </Button>
        )}

        {onFork && (
          <Button
            variant="ghost"
            size={isCompact ? 'sm' : 'default'}
            onClick={onFork}
            className={isCompact ? '' : 'gap-1'}
            aria-label={isCompact ? 'Fork prompt' : undefined}
          >
            <GitFork className="w-3 h-3" />
            {!isCompact && 'Fork'}
          </Button>
        )}

        {isXL && onCompare && (
          <Button variant="ghost" size="default" onClick={onCompare} className="gap-1">
            <BarChart3 className="w-3 h-3" />
            Compare
          </Button>
        )}

        {isXL && onAnalytics && (
          <Button variant="ghost" size="default" onClick={onAnalytics} className="gap-1">
            <Activity className="w-3 h-3" />
            Analytics
          </Button>
        )}

        {isXL && onHistory && (
          <Button variant="ghost" size="default" onClick={onHistory} className="gap-1">
            <History className="w-3 h-3" />
            History
          </Button>
        )}
      </div>

      {onMenuAction && (
        <Button variant="ghost" size={isCompact ? 'sm' : 'icon'} onClick={() => onMenuAction('menu')} className="flex-shrink-0">
          <MoreHorizontal className="w-4 h-4" />
          <span className="sr-only">More actions</span>
        </Button>
      )}
    </div>
  );
}
