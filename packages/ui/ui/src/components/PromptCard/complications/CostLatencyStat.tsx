import * as React from 'react';
import { DollarSign, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Tooltip } from '../../Tooltip';
import type { ComplicationProps } from '../../../complications/types';
import styles from './CostLatencyStat.module.css';

export interface CostLatencyStatProps extends ComplicationProps {
  /** Cost data */
  cost?: {
    /** Average cost in cents */
    avg: number;
    /** Minimum cost in cents */
    min: number;
    /** Maximum cost in cents */
    max: number;
    /** Currency code */
    currency?: 'USD' | 'EUR' | 'GBP';
  };
  /** Latency data */
  latency?: {
    /** P50 latency in milliseconds */
    p50: number;
    /** P95 latency in milliseconds */
    p95: number;
    /** P99 latency in milliseconds (optional) */
    p99?: number;
    /** Number of samples */
    samples: number;
  };
  /** Primary metric to show in compact mode */
  primaryMetric?: 'cost' | 'latency';
  /** Size variant */
  size?: 'compact' | 'standard';
}

/**
 * Format cost from cents to dollar display
 * Following AC requirements: < $0.001 shows as "<$0.001", otherwise 3 decimal places
 */
const formatCost = (cents: number, currency = 'USD'): string => {
  const dollars = cents / 100;
  // Use Intl.NumberFormat for currency formatting
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  // Handle negative or very small values
  if (dollars < 0.001) {
    // Format 0.001 with currency symbol using Intl.NumberFormat, then prepend '<'
    const minFormatted = formatter.format(0.001);
    return `<${minFormatted}`;
  }

  // Format with exactly 3 decimal places
  return formatter.format(dollars);
};

/**
 * Format latency with proper units
 * Following AC requirements: > 1000ms formats as seconds
 */
const formatLatency = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
};

/**
 * Get tooltip content for cost metrics
 */
const getCostTooltipContent = (cost: NonNullable<CostLatencyStatProps['cost']>) => (
  <div className={styles.tooltipContent}>
    <div className={styles.tooltipHeader}>Cost Breakdown</div>
    <div className={styles.tooltipRow}>
      <span>Average:</span>
      <span>{formatCost(cost.avg, cost.currency)}</span>
    </div>
    <div className={styles.tooltipRow}>
      <span>Minimum:</span>
      <span>{formatCost(cost.min, cost.currency)}</span>
    </div>
    <div className={styles.tooltipRow}>
      <span>Maximum:</span>
      <span>{formatCost(cost.max, cost.currency)}</span>
    </div>
  </div>
);

/**
 * Get tooltip content for latency metrics
 */
const getLatencyTooltipContent = (latency: NonNullable<CostLatencyStatProps['latency']>) => (
  <div className={styles.tooltipContent}>
    <div className={styles.tooltipHeader}>Latency Percentiles</div>
    <div className={styles.tooltipRow}>
      <span>P50:</span>
      <span>{formatLatency(latency.p50)}</span>
    </div>
    <div className={styles.tooltipRow}>
      <span>P95:</span>
      <span>{formatLatency(latency.p95)}</span>
    </div>
    {latency.p99 && (
      <div className={styles.tooltipRow}>
        <span>P99:</span>
        <span>{formatLatency(latency.p99)}</span>
      </div>
    )}
    <div className={styles.tooltipSamples}>
      Based on {latency.samples.toLocaleString()} samples
    </div>
  </div>
);

export function CostLatencyStat({
  cost,
  latency,
  primaryMetric = 'cost',
  size,
  cardSize,
  slot,
  isVisible,
  className,
  'aria-label': ariaLabel,
  ...complicationProps
}: CostLatencyStatProps) {
  if (!isVisible) return null;

  // Hide if no data is available (AC requirement 5)
  if (!cost && !latency) return null;

  // Determine effective size
  const effectiveSize = size || (cardSize === 'compact' ? 'compact' : 'standard');

  // In compact mode, show only primary metric (AC requirement 7)
  let { showCost, showLatency } = computeVisibility();

  // Size-specific styling
  const pillClasses = cn(
    styles.pill,
    {
      [styles.compact]: effectiveSize === 'compact',
      [styles.standard]: effectiveSize === 'standard',
    },
    className
  );

  const iconSize = effectiveSize === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  // Generate accessibility label
  const generateAriaLabel = (): string => {
    if (ariaLabel) return ariaLabel;

    const parts: string[] = [];
    if (showCost && cost) {
      parts.push(`Average cost ${formatCost(cost.avg, cost.currency)}`);
    }
    if (showLatency && latency) {
      parts.push(`P50 latency ${formatLatency(latency.p50)}`);
    }
    return parts.join(', ');
  };

  return (
    <div
      className={styles.container}
      data-testid="cost-latency-stat"
      data-slot={slot}
      role="group"
      aria-label={generateAriaLabel()}
    >
      <div className={styles.pillGroup}>
        {/* Cost Pill */}
        {showCost && cost && (
          <Tooltip
            content={getCostTooltipContent(cost)}
            side="bottom"
            align="center"
            delayDuration={250}
          >
            <div className={cn(pillClasses, styles.costPill)}>
              <DollarSign className={cn(iconSize, styles.icon)} />
              <span className={styles.value}>
                {formatCost(cost.avg, cost.currency)}
              </span>
            </div>
          </Tooltip>
        )}

        {/* Latency Pill */}
        {showLatency && latency && (
          <Tooltip
            content={getLatencyTooltipContent(latency)}
            side="bottom"
            align="center"
            delayDuration={250}
          >
            <div className={cn(pillClasses, styles.latencyPill)}>
              <Clock className={cn(iconSize, styles.icon)} />
              <span className={styles.value}>
                {formatLatency(latency.p50)}
              </span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );

  function computeVisibility() {
    const showBothMetrics = effectiveSize !== 'compact';
    let showCost = false;
    let showLatency = false;

    if (showBothMetrics) {
      // Standard mode: show both if available
      showCost = !!cost;
      showLatency = !!latency;
    } else {
      // Compact mode: prioritize primary metric, fall back to other if primary is missing
      if (primaryMetric === 'cost') {
        if (cost) {
          showCost = true;
        } else if (latency) {
          showLatency = true;
        }
      } else if (primaryMetric === 'latency') {
        if (latency) {
          showLatency = true;
        } else if (cost) {
          showCost = true;
        }
      }
    }
    return { showCost, showLatency };
  }
}

CostLatencyStat.displayName = 'CostLatencyStat';
