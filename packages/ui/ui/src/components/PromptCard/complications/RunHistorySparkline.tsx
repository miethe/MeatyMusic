/**
 * RunHistorySparkline Complication - MP-PCARD-CPL-019
 *
 * A sophisticated 24-point sparkline visualization that displays prompt execution history
 * with success/failure rates, interactive tooltips, and comprehensive accessibility support.
 * Designed specifically for the footer slot of xl PromptCards.
 *
 * This replaces the previous simple implementation with a comprehensive solution that meets
 * all requirements from the MP-PCARD-CPL-019 user story.
 *
 * Features:
 * - 24-point stacked bar chart visualization
 * - Success/failure rate color coding
 * - Interactive tooltip with detailed metrics
 * - Full keyboard navigation support
 * - Screen reader compatibility
 * - Graceful handling of empty/insufficient data
 * - Smooth animations with reduced-motion support
 *
 * @module components/PromptCard/complications/RunHistorySparkline
 */

import React from 'react';
import { cn } from '../../../lib/utils';
import type { ComplicationProps } from '../../../complications/types';
import styles from './RunHistorySparkline.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single data point in the run history timeline
 */
export interface RunHistoryPoint {
  /** ISO timestamp for this data point */
  timestamp: string;
  /** Number of successful executions */
  successCount: number;
  /** Number of failed executions */
  failureCount: number;
  /** Total executions (successCount + failureCount) */
  totalRuns: number;
  /** Success rate as a decimal (0-1) */
  successRate: number;
}

/**
 * Configuration for the run history data
 */
export interface RunHistoryData {
  /** Array of data points (up to 24 points) */
  points: RunHistoryPoint[];
  /** Time range represented by the data */
  timeRange: '24h' | '7d' | '30d';
  /** Aggregation method used */
  aggregation: 'hourly' | 'daily';
}

/**
 * Props for the RunHistorySparkline component
 */
export interface RunHistorySparklineProps extends ComplicationProps {
  /** Run history data to visualize */
  data: RunHistoryData;
  /** Width override (default: auto-calculated for footer) */
  width?: number;
  /** Height override (default: 32px) */
  height?: number;
  /** Chart variant */
  variant?: 'bar' | 'line';
  /** Whether to show tooltips on hover */
  showTooltip?: boolean;
  /** Custom color scheme */
  colors?: {
    success?: string;
    failure?: string;
    background?: string;
    grid?: string;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats a timestamp for display in tooltip
 */
const HOUR_IN_MS = 60 * 60 * 1000;
const DEFAULT_FOOTER_WIDTH = 400;
const TOOLTIP_OFFSET_X = 10;
const TOOLTIP_OFFSET_Y = -10;
const TOOLTIP_Z_INDEX = 1000;

const formatTimestamp = (timestamp: string, aggregation: 'hourly' | 'daily'): string => {
  const date = new Date(timestamp);
  if (aggregation === 'hourly') {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      hour12: true,
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Calculates trend direction for accessibility description
 */
const calculateTrend = (points: RunHistoryPoint[]): 'increasing' | 'decreasing' | 'stable' | 'unknown' => {
  if (points.length < 2) return 'unknown';

  const recentPoints = points.slice(-3); // Look at last 3 points for trend
  const firstRate = recentPoints[0].successRate;
  const lastRate = recentPoints[recentPoints.length - 1].successRate;
  const diff = lastRate - firstRate;

  if (Math.abs(diff) < 0.05) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
};

/**
 * Generates accessibility description for the entire chart
 */
const generateAccessibilityDescription = (data: RunHistoryData): string => {
  const { points, timeRange, aggregation } = data;

  if (points.length === 0) {
    return 'No run history data available';
  }

  const totalRuns = points.reduce((sum, point) => sum + point.totalRuns, 0);
  const totalSuccesses = points.reduce((sum, point) => sum + point.successCount, 0);
  const overallSuccessRate = totalRuns > 0 ? Math.round((totalSuccesses / totalRuns) * 100) : 0;
  const trend = calculateTrend(points);

  return `Run history for the last ${timeRange}, showing ${points.length} ${aggregation} data points. Overall success rate: ${overallSuccessRate}%. Trend: ${trend}.`;
};

/**
 * Normalizes data points to ensure exactly 24 points for consistent visualization
 */
const normalizeDataPoints = (points: RunHistoryPoint[]): RunHistoryPoint[] => {
  const targetPoints = 24;

  if (points.length === 0) {
    // Return empty points for consistent layout
    return Array(targetPoints).fill(null).map((_, index) => ({
      timestamp: new Date(Date.now() - (targetPoints - index - 1) * HOUR_IN_MS).toISOString(),
      successCount: 0,
      failureCount: 0,
      totalRuns: 0,
      successRate: 0,
    }));
  }

  if (points.length <= targetPoints) {
    // Pad with empty points at the beginning
    const emptyPoints = Array(targetPoints - points.length).fill(null).map((_, index) => ({
      timestamp: new Date(new Date(points[0].timestamp).getTime() - (targetPoints - points.length - index) * 60 * 60 * 1000).toISOString(),
      successCount: 0,
      failureCount: 0,
      totalRuns: 0,
      successRate: 0,
    }));
    return [...emptyPoints, ...points];
  }

  // Take the last 24 points if we have more
  return points.slice(-targetPoints);
};

// ============================================================================
// CHART RENDERING COMPONENTS
// ============================================================================

/**
 * Renders a single bar in the stacked bar chart
 */
const StackedBar: React.FC<{
  point: RunHistoryPoint;
  index: number;
  barWidth: number;
  maxHeight: number;
  colors: { success: string; failure: string };
  onHover: (index: number, event: React.MouseEvent) => void;
  onLeave: () => void;
  isActive: boolean;
}> = ({ point, index, barWidth, maxHeight, colors, onHover, onLeave, isActive }) => {
  const x = index * barWidth;
  const { successCount, failureCount, totalRuns } = point;

  if (totalRuns === 0) {
    // Empty state - show a subtle placeholder
    return (
      <g key={index}>
        <rect
          x={x + 1}
          y={maxHeight - 2}
          width={Math.max(barWidth - 2, 1)}
          height={2}
          fill="var(--mp-color-border)"
          opacity={0.3}
          onMouseEnter={(e) => onHover(index, e)}
          onMouseLeave={onLeave}
          style={{ cursor: 'pointer' }}
        />
      </g>
    );
  }

  // Calculate heights proportionally
  const successHeight = (successCount / totalRuns) * maxHeight;
  const failureHeight = (failureCount / totalRuns) * maxHeight;

  return (
    <g key={index}>
      {/* Failure portion (bottom) */}
      {failureCount > 0 && (
        <rect
          x={x + 1}
          y={maxHeight - failureHeight}
          width={Math.max(barWidth - 2, 1)}
          height={failureHeight}
          fill={colors.failure}
          opacity={isActive ? 1 : 0.8}
          onMouseEnter={(e) => onHover(index, e)}
          onMouseLeave={onLeave}
          style={{ cursor: 'pointer' }}
        />
      )}

      {/* Success portion (top) */}
      {successCount > 0 && (
        <rect
          x={x + 1}
          y={maxHeight - failureHeight - successHeight}
          width={Math.max(barWidth - 2, 1)}
          height={successHeight}
          fill={colors.success}
          opacity={isActive ? 1 : 0.8}
          onMouseEnter={(e) => onHover(index, e)}
          onMouseLeave={onLeave}
          style={{ cursor: 'pointer' }}
        />
      )}

      {/* Invisible hover target for better UX */}
      <rect
        x={x}
        y={0}
        width={barWidth}
        height={maxHeight}
        fill="transparent"
        onMouseEnter={(e) => onHover(index, e)}
        onMouseLeave={onLeave}
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
};

/**
 * Tooltip content component
 */
const TooltipContent: React.FC<{
  point: RunHistoryPoint;
  aggregation: 'hourly' | 'daily';
}> = ({ point, aggregation }) => {
  const { timestamp, successCount, failureCount, totalRuns, successRate } = point;

  if (totalRuns === 0) {
    return (
      <div className={styles.tooltipContent}>
        <div className={styles.tooltipHeader}>{formatTimestamp(timestamp, aggregation)}</div>
        <div className={styles.tooltipMessage}>No executions</div>
      </div>
    );
  }

  return (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipHeader}>{formatTimestamp(timestamp, aggregation)}</div>
      <div className={styles.tooltipStats}>
        <div className={styles.tooltipRow}>
          <span>Total runs:</span>
          <span>{totalRuns}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span>Successful:</span>
          <span className={styles.successColor}>{successCount}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span>Failed:</span>
          <span className={styles.failureColor}>{failureCount}</span>
        </div>
        <div className={cn(styles.tooltipRow, styles.totalRow)}>
          <span>Success rate:</span>
          <span>{Math.round(successRate * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * RunHistorySparkline component implementation
 */
export function RunHistorySparkline({
  data,
  width,
  height = 32,
  variant = 'bar',
  showTooltip = true,
  colors = {},
  isVisible,
  features,
  className,
  slot,
  cardSize,
  cardState,
  'aria-label': ariaLabel,
  ...complicationProps
}: RunHistorySparklineProps) {
  // Early return for non-rendering conditions
  if (!isVisible || cardState === 'disabled' || slot !== 'footer' || cardSize !== 'xl') {
    return null;
  }

  // State for tooltip management
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{ x: number; y: number } | null>(null);

  // Refs for keyboard navigation
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  // Normalize data to 24 points
  const normalizedPoints = React.useMemo(() => {
    return normalizeDataPoints(data.points);
  }, [data.points]);

  // Calculate dimensions
  const chartWidth = width || DEFAULT_FOOTER_WIDTH; // Default width for footer slot
  const chartHeight = height;
  const barWidth = chartWidth / 24;

  // Color scheme with defaults
  const colorScheme = {
    success: colors.success || 'var(--mp-color-success)',
    failure: colors.failure || 'var(--mp-color-danger)',
    background: colors.background || 'var(--mp-color-background)',
    grid: colors.grid || 'var(--mp-color-border)',
  };

  // Accessibility description
  const accessibilityDescription = React.useMemo(() => {
    return generateAccessibilityDescription(data);
  }, [data]);

  // Event handlers
  const handleBarHover = React.useCallback((index: number, event: React.MouseEvent) => {
    if (!showTooltip) return;

    setHoveredIndex(index);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }, [showTooltip]);

  const handleBarLeave = React.useCallback(() => {
    setHoveredIndex(null);
    setTooltipPosition(null);
  }, []);

  // Keyboard navigation
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (!normalizedPoints.length) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedIndex(prev => {
          const newIndex = prev === null ? normalizedPoints.length - 1 : Math.max(0, prev - 1);
          return newIndex;
        });
        break;

      case 'ArrowRight':
        event.preventDefault();
        setFocusedIndex(prev => {
          const newIndex = prev === null ? 0 : Math.min(normalizedPoints.length - 1, prev + 1);
          return newIndex;
        });
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex !== null && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const barCenterX = rect.left + (focusedIndex + 0.5) * barWidth;
          const barCenterY = rect.top + chartHeight / 2;

          setHoveredIndex(focusedIndex);
          setTooltipPosition({
            x: barCenterX,
            y: barCenterY,
          });
        }
        break;

      case 'Escape':
        setHoveredIndex(null);
        setTooltipPosition(null);
        setFocusedIndex(null);
        break;
    }
  }, [normalizedPoints.length, focusedIndex, barWidth, chartHeight]);

  // Generate SVG chart
  const chartElement = (
    <svg
      width={chartWidth}
      height={chartHeight}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className={styles.chart}
      aria-hidden="true"
      style={{
        transition: features?.reducedMotion ? 'none' : 'all 150ms ease-out',
      }}
    >
      {/* Background grid */}
      <defs>
        <pattern
          id="run-history-grid"
          width={barWidth * 4}
          height={chartHeight / 2}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${barWidth * 4} 0 v ${chartHeight / 2} M 0 ${chartHeight / 2} h ${barWidth * 4}`}
            fill="none"
            stroke={colorScheme.grid}
            strokeWidth="0.5"
            opacity="0.1"
          />
        </pattern>
      </defs>

      <rect
        width={chartWidth}
        height={chartHeight}
        fill="url(#run-history-grid)"
      />

      {/* Chart bars */}
      {normalizedPoints.map((point, index) => (
        <StackedBar
          key={index}
          point={point}
          index={index}
          barWidth={barWidth}
          maxHeight={chartHeight - 2}
          colors={colorScheme}
          onHover={handleBarHover}
          onLeave={handleBarLeave}
          isActive={hoveredIndex === index || focusedIndex === index}
        />
      ))}

      {/* Focus indicator */}
      {focusedIndex !== null && (
        <rect
          x={focusedIndex * barWidth}
          y={0}
          width={barWidth}
          height={chartHeight}
          fill="none"
          stroke="var(--mp-color-primary)"
          strokeWidth="2"
          strokeDasharray="2,2"
          opacity={0.8}
        />
      )}
    </svg>
  );

  const sparklineContent = (
    <div
      ref={containerRef}
      className={cn(
        styles.container,
        {
          [styles.running]: cardState === 'running',
          [styles.error]: cardState === 'error',
        },
        className
      )}
      style={{
        width: chartWidth,
        height: chartHeight,
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="img"
      aria-label={ariaLabel || accessibilityDescription}
      data-testid="run-history-sparkline"
    >
      {chartElement}

      {/* Screen reader description */}
      <div className="sr-only">
        {accessibilityDescription}
        {focusedIndex !== null && (
          <span>
            {' '}Currently focused on data point {focusedIndex + 1} of {normalizedPoints.length}.
            {normalizedPoints[focusedIndex] && (
              <span>
                {' '}{formatTimestamp(normalizedPoints[focusedIndex].timestamp, data.aggregation)}:
                {normalizedPoints[focusedIndex].totalRuns} total runs,
                {Math.round(normalizedPoints[focusedIndex].successRate * 100)}% success rate.
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );

  // Wrap with tooltip if enabled
  if (showTooltip && hoveredIndex !== null && normalizedPoints[hoveredIndex]) {
    return (
      <>
        {sparklineContent}
        {tooltipPosition && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPosition.x + TOOLTIP_OFFSET_X,
              top: tooltipPosition.y + TOOLTIP_OFFSET_Y,
              zIndex: TOOLTIP_Z_INDEX,
              pointerEvents: 'none',
            }}
          >
            <div className={styles.tooltip}>
              <TooltipContent
                point={normalizedPoints[hoveredIndex]}
                aggregation={data.aggregation}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return sparklineContent;
}

RunHistorySparkline.displayName = 'RunHistorySparkline';
