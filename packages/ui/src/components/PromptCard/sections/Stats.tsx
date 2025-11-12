import * as React from 'react';
import { Play, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';

export interface StatsProps {
  metrics?: { runs?: number; successRate?: number; avgCost?: number };
  isCompact: boolean;
}

export function Stats(props: StatsProps) {
  const { metrics, isCompact } = props;
  if (isCompact || !metrics) return null;
  const { runs, successRate, avgCost } = metrics;
  if (runs === undefined && successRate === undefined && avgCost === undefined) {
    return null;
  }
  return (
    <div className={cn('flex items-center justify-between', styles.statsRow)}>
      <div className="flex items-center gap-4">
        {runs !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs', styles.mutedText)}>
            <Play className="w-3 h-3" />
            <span>{runs} runs</span>
          </div>
        )}
        {successRate !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs', styles.mutedText)}>
            <TrendingUp className="w-3 h-3" />
            <span>{Math.round(successRate * 100)}%</span>
          </div>
        )}
        {avgCost !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs', styles.mutedText)}>
            <DollarSign className="w-3 h-3" />
            <span>${avgCost.toFixed(3)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
