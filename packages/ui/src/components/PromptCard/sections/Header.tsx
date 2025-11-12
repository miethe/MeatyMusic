import * as React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '../../Badge';
import { CardHeader } from '../../Card';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';
import { formatLastRun } from '../utils/formatLastRun';
import { formatDate } from '../utils/formatDate';
import { TruncatedText } from '../utils/TruncatedText';

export interface HeaderProps {
  title: string;
  version: number;
  lastRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isCompact: boolean;
}

export function Header(props: HeaderProps) {
  const { title, version, lastRun, createdAt, updatedAt, isCompact } = props;

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
    <div className="min-w-0">
      <TruncatedText
        text={title}
        maxLines={2}
        className={cn('leading-tight', styles.titleText)}
      />
      {lastRun && (
        <div className="mt-1">
          {tooltipContent ? (
            <Tooltip content={tooltipContent} side="bottom" align="start">
              <span className={cn('text-xs flex items-center gap-1 cursor-help', styles.mutedText)}>
                <Clock className="w-3 h-3" />
                {formatLastRun(lastRun)}
              </span>
            </Tooltip>
          ) : (
            <span className={cn('text-xs flex items-center gap-1', styles.mutedText)}>
              <Clock className="w-3 h-3" />
              {formatLastRun(lastRun)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
