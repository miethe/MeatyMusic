import * as React from "react";
import { Clock, TrendingUp, DollarSign, Activity } from "lucide-react";
import { cn } from "../../../lib/utils";
import { SuccessSparkline } from "./SuccessSparkline";

export interface ExtendedStatsRowProps {
  /** Success rate trend data (7-day rolling) */
  successRateData?: number[];
  /** Current success rate percentage */
  successRate?: number;
  /** P50 latency in milliseconds */
  p50Latency?: number;
  /** P95 latency in milliseconds */
  p95Latency?: number;
  /** P50 latency trend data */
  p50LatencyData?: number[];
  /** Token usage data for trend */
  tokenUsageData?: number[];
  /** Average token usage */
  avgTokens?: number;
  /** Total cost trend data */
  costData?: number[];
  /** Average cost per run */
  avgCost?: number;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Format latency values for display
 */
const formatLatency = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Format token count for display
 */
const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return `${Math.round(tokens)}`;
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
};

/**
 * Format cost for display
 */
const formatCost = (cost: number): string => {
  if (cost < 0.01) return `<$0.01`;
  return `$${cost.toFixed(2)}`;
};

export const ExtendedStatsRow: React.FC<ExtendedStatsRowProps> = ({
  successRateData,
  successRate,
  p50Latency,
  p95Latency,
  p50LatencyData,
  tokenUsageData,
  avgTokens,
  costData,
  avgCost,
  className,
}) => {
  const hasData = Boolean(
    successRateData?.length ||
    p50LatencyData?.length ||
    tokenUsageData?.length ||
    costData?.length
  );

  if (!hasData) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm",
        className
      )}
      role="group"
      aria-label="Extended performance statistics"
    >
      {/* Success Rate */}
      {successRateData && successRateData.length > 0 && (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" style={{ color: 'var(--mp-color-success)' }} />
              <span style={{ color: 'var(--mp-color-text-muted)' }}>Success</span>
            </div>
            <span
              className="font-medium"
              style={{ color: 'var(--mp-color-text-strong)' }}
            >
              {successRate ? `${Math.round(successRate * 100)}%` : '—'}
            </span>
          </div>
          <div className="flex justify-end">
            <SuccessSparkline
              data={successRateData}
              width={48}
              height={18}
              className="opacity-80"
            />
          </div>
        </div>
      )}

      {/* P50 Latency */}
      {p50LatencyData && p50LatencyData.length > 0 && (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" style={{ color: 'var(--mp-color-primary)' }} />
              <span style={{ color: 'var(--mp-color-text-muted)' }}>P50</span>
            </div>
            <span
              className="font-medium"
              style={{ color: 'var(--mp-color-text-strong)' }}
            >
              {p50Latency ? formatLatency(p50Latency) : '—'}
            </span>
          </div>
          <div className="flex justify-end">
            <SuccessSparkline
              data={p50LatencyData.map(ms => Math.min(ms / 5000, 1))} // Normalize to 0-1 (5s max)
              width={48}
              height={18}
              className="opacity-80"
            />
          </div>
        </div>
      )}

      {/* Token Usage */}
      {tokenUsageData && tokenUsageData.length > 0 && (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--mp-color-info)' }} />
              <span style={{ color: 'var(--mp-color-text-muted)' }}>Tokens</span>
            </div>
            <span
              className="font-medium"
              style={{ color: 'var(--mp-color-text-strong)' }}
            >
              {avgTokens ? formatTokens(avgTokens) : '—'}
            </span>
          </div>
          <div className="flex justify-end">
            <SuccessSparkline
              data={tokenUsageData.map(tokens => Math.min(tokens / 8192, 1))} // Normalize to 0-1 (8K context max)
              width={48}
              height={18}
              className="opacity-80"
            />
          </div>
        </div>
      )}

      {/* Cost */}
      {costData && costData.length > 0 && (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" style={{ color: 'var(--mp-color-warning)' }} />
              <span style={{ color: 'var(--mp-color-text-muted)' }}>Cost</span>
            </div>
            <span
              className="font-medium"
              style={{ color: 'var(--mp-color-text-strong)' }}
            >
              {avgCost ? formatCost(avgCost) : '—'}
            </span>
          </div>
          <div className="flex justify-end">
            <SuccessSparkline
              data={costData.map(cost => Math.min(cost / 1.0, 1))} // Normalize to 0-1 ($1.00 max)
              width={48}
              height={18}
              className="opacity-80"
            />
          </div>
        </div>
      )}

      {/* P95 Latency (if space allows) */}
      {p95Latency && (
        <div className="col-span-2 lg:col-span-4 pt-2 border-t border-opacity-20"
             style={{ borderColor: 'var(--mp-color-border)' }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--mp-color-text-muted)' }}>P95 Latency</span>
            <span
              className="font-medium"
              style={{ color: 'var(--mp-color-text-strong)' }}
            >
              {formatLatency(p95Latency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

ExtendedStatsRow.displayName = "ExtendedStatsRow";
