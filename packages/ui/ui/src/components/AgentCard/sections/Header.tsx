import * as React from 'react';
import { Bot, Clock, Lock } from 'lucide-react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import styles from '../AgentCard.module.css';

export interface AgentHeaderProps {
  name: string;
  version?: string;
  access?: 'private' | 'public' | 'shared';
  lastRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isCompact?: boolean;
}

function formatLastRun(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDate(date: Date): string {
  return date.toLocaleString();
}

export function Header(props: AgentHeaderProps) {
  const { name, version = '1.0', access = 'private', lastRun, createdAt, updatedAt, isCompact } = props;

  const tooltipContent = React.useMemo(() => {
    if (!createdAt && !updatedAt) return null;

    return (
      <div className="flex flex-col gap-1">
        {createdAt && (
          <div>
            <span className="font-medium">Created:</span> {formatDate(createdAt)}
          </div>
        )}
        {updatedAt && (
          <div>
            <span className="font-medium">Last modified:</span> {formatDate(updatedAt)}
          </div>
        )}
      </div>
    );
  }, [createdAt, updatedAt]);

  return (
    <div className={styles.headerContent}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="h-4 w-4 text-mp-primary shrink-0" />
          <h3 className={cn('text-lg font-semibold text-text-strong truncate', styles.titleText)}>
            {name}
          </h3>
        </div>
        {lastRun && (
          <div className="mt-1">
            {tooltipContent ? (
              <Tooltip content={tooltipContent} side="bottom" align="start">
                <span className={cn('text-xs flex items-center gap-1 cursor-help', styles.mutedText)}>
                  <Clock className="w-3 h-3" />
                  Last run: {formatLastRun(lastRun)}
                </span>
              </Tooltip>
            ) : (
              <span className={cn('text-xs flex items-center gap-1', styles.mutedText)}>
                <Clock className="w-3 h-3" />
                Last run: {formatLastRun(lastRun)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" size="sm" className="text-xs whitespace-nowrap">
          v{version}
        </Badge>
        {access === 'private' && <Lock className="h-3 w-3 text-text-muted" aria-label="Private" />}
      </div>
    </div>
  );
}
