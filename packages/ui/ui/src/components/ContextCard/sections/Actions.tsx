import * as React from 'react';
import { Edit, Copy, MoreHorizontal, History, Link2, Download, Trash2 } from 'lucide-react';
import { Button } from '../../Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../DropdownMenu';
import { cn } from '../../../lib/utils';
import styles from '../../PromptCard/PromptCard.module.css';

export interface ActionsProps {
  isCompact: boolean;
  isXL: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onMenuAction?: (action: 'view-history' | 'view-usage' | 'export' | 'delete') => void;
}

export function Actions(props: ActionsProps) {
  const { isCompact, onEdit, onDuplicate, onMenuAction } = props;

  return (
    <div className={cn("flex items-center justify-between", styles.actionsRow)}>
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button
            size={isCompact ? 'sm' : 'default'}
            onClick={onEdit}
            className={isCompact ? '' : 'gap-1'}
            aria-label={isCompact ? 'Edit context' : undefined}
          >
            {!isCompact && <Edit className="w-3 h-3" />}
            Edit
          </Button>
        )}

        {onDuplicate && (
          <Button
            variant="outline"
            size={isCompact ? 'sm' : 'default'}
            onClick={onDuplicate}
            className={isCompact ? '' : 'gap-1'}
            aria-label={isCompact ? 'Duplicate context' : undefined}
          >
            {!isCompact && <Copy className="w-3 h-3" />}
            Duplicate
          </Button>
        )}
      </div>

      {onMenuAction && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size={isCompact ? 'sm' : 'icon'} className="flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMenuAction('view-history')}>
              <History className="h-4 w-4 mr-2" />
              View History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenuAction('view-usage')}>
              <Link2 className="h-4 w-4 mr-2" />
              View Usage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenuAction('export')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onMenuAction('delete')}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
