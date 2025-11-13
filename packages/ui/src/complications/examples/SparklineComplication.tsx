/**
 * Sparkline Complication
 *
 * A mini chart complication that displays trend data as a simple line chart.
 * Perfect for showing performance metrics over time in a compact format.
 *
 * @module complications/examples/SparklineComplication
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { withComplicationMemo } from '../ComplicationSlots';
import type { ComplicationProps } from '../types';

// ============================================================================
// SPARKLINE COMPLICATION COMPONENT
// ============================================================================

interface SparklineComplicationProps extends ComplicationProps {
  /** Array of data points for the sparkline */
  data: number[];
  /** Color variant for the line */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Width of the sparkline in pixels */
  width?: number;
  /** Height of the sparkline in pixels */
  height?: number;
  /** Whether to show fill area under the line */
  fill?: boolean;
  /** Stroke width of the line */
  strokeWidth?: number;
  /** Optional label text */
  label?: string;
}

/**
 * Sparkline complication component - displays a mini trend chart
 * Commonly used in corner or edge slots for performance indicators
 */
function SparklineComplicationInner({
  data = [],
  variant = 'default',
  width,
  height,
  fill = false,
  strokeWidth = 1,
  label,
  cardState,
  cardSize,
  slot,
  isVisible,
  className,
  ...props
}: SparklineComplicationProps) {

  // Don't render if not visible, no data, or in certain states
  if (!isVisible || cardState === 'disabled' || data.length === 0) {
    return null;
  }

  // Adjust dimensions based on card size and slot position
  const getDimensions = () => {
    let baseWidth = 32;
    let baseHeight = 16;

    if (cardSize === 'compact') {
      baseWidth = 24;
      baseHeight = 12;
    } else if (cardSize === 'xl') {
      baseWidth = 48;
      baseHeight = 24;
    }

    // Edge slots can be taller
    if (slot.includes('edge')) {
      baseHeight = Math.floor(baseHeight * 1.5);
    }

    return {
      width: width || baseWidth,
      height: height || baseHeight,
    };
  };

  const dimensions = getDimensions();

  // Color variants using CSS custom properties
  const variantColors = {
    default: 'var(--mp-color-text)',
    success: 'var(--mp-color-success)',
    warning: 'var(--mp-color-warning)',
    error: 'var(--mp-color-danger)',
    info: 'var(--mp-color-info)',
  };

  const strokeColor = variantColors[variant];
  const fillColor = fill ? `${strokeColor}20` : 'none';

  // Calculate sparkline path
  const createSparklinePath = () => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * dimensions.width;
      const y = dimensions.height - ((value - min) / range) * dimensions.height;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    if (fill) {
      const firstX = (0 / (data.length - 1)) * dimensions.width;
      const lastX = ((data.length - 1) / (data.length - 1)) * dimensions.width;
      return `${pathData} L ${lastX},${dimensions.height} L ${firstX},${dimensions.height} Z`;
    }

    return pathData;
  };

  const sparklinePath = createSparklinePath();

  const sparklineStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: cardSize === 'compact' ? '2px' : '4px',
    borderRadius: 'var(--mp-radius-sm)',
    transition: 'all 150ms ease-out',
    cursor: cardState === 'default' ? 'pointer' : 'default',
    userSelect: 'none' as const,
  };

  const sparklineClassName = cn(
    'complication-sparkline',
    {
      'opacity-70': cardState === 'running',
      'opacity-50': cardState === 'error',
    },
    className
  );

  // Calculate trend for accessibility
  const trend = data.length >= 2 ?
    data[data.length - 1] > data[0] ? 'increasing' :
    data[data.length - 1] < data[0] ? 'decreasing' : 'stable' : 'unknown';

  // Extract onError from props since it's not a valid DOM attribute
  const { onError, ...domProps } = props;

  return (
    <div
      className={sparklineClassName}
      style={sparklineStyle}
      title={`${label || 'Trend'}: ${trend} (${slot})`}
      role="img"
      aria-label={`${label || 'Sparkline'} showing ${trend} trend with ${data.length} data points`}
      {...domProps}
    >
      {/* Optional label */}
      {label && !slot.includes('edge') && (
        <span
          style={{
            fontSize: cardSize === 'compact' ? '8px' : '10px',
            color: 'var(--mp-color-text-muted)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}

      {/* SVG Sparkline */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{
          overflow: 'visible',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {/* Fill area */}
        {fill && sparklinePath && (
          <path
            d={sparklinePath}
            fill={fillColor}
            stroke="none"
          />
        )}

        {/* Line */}
        {sparklinePath && (
          <path
            d={sparklinePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Dots at data points for better visibility in small sizes */}
        {cardSize !== 'compact' && data.length <= 7 && data.map((value, index) => {
          const min = Math.min(...data);
          const max = Math.max(...data);
          const range = max - min || 1;
          const x = (index / (data.length - 1)) * dimensions.width;
          const y = dimensions.height - ((value - min) / range) * dimensions.height;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={strokeWidth}
              fill={strokeColor}
            />
          );
        })}
      </svg>
    </div>
  );
}

// Memoize the component for performance
export const SparklineComplication = withComplicationMemo(SparklineComplicationInner);

// ============================================================================
// PRESET SPARKLINE COMPLICATIONS
// ============================================================================

/**
 * Success rate sparkline
 */
export const SuccessRateSparkline: React.ComponentType<ComplicationProps & { data: number[] }> = (props) => (
  <SparklineComplication {...props} variant="success" label="✓" fill />
);

/**
 * Latency sparkline
 */
export const LatencySparkline: React.ComponentType<ComplicationProps & { data: number[] }> = (props) => (
  <SparklineComplication {...props} variant="info" label="⏱" />
);

/**
 * Cost sparkline
 */
export const CostSparkline: React.ComponentType<ComplicationProps & { data: number[] }> = (props) => (
  <SparklineComplication {...props} variant="warning" label="$" />
);

/**
 * Usage sparkline
 */
export const UsageSparkline: React.ComponentType<ComplicationProps & { data: number[] }> = (props) => (
  <SparklineComplication {...props} variant="default" label="📊" />
);

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a custom sparkline complication with predefined props
 */
export const createSparklineComplication = (
  defaultProps: Partial<SparklineComplicationProps>
) => {
  const CustomSparkline: React.ComponentType<ComplicationProps & { data: number[] }> = (props) => (
    <SparklineComplication {...defaultProps} {...props} />
  );

  CustomSparkline.displayName = `CustomSparkline(${defaultProps.label || 'Sparkline'})`;

  return CustomSparkline;
};

// ============================================================================
// SLOT CONFIGURATIONS
// ============================================================================

/**
 * Recommended slot configurations for sparkline complications
 */
export const SPARKLINE_SLOT_CONFIGS = {
  /** Success rate trend in top-right */
  successRateSparkline: {
    component: SuccessRateSparkline,
    supportedSizes: ['standard', 'xl'] as const,
    supportedStates: ['default', 'running'] as const,
    maxDimensions: { width: 48, height: 24 },
    performance: { memoize: true, priority: 80 },
  },

  /** Latency trend in bottom-right */
  latencySparkline: {
    component: LatencySparkline,
    supportedSizes: ['standard', 'xl'] as const,
    supportedStates: ['default', 'running'] as const,
    maxDimensions: { width: 48, height: 24 },
    performance: { memoize: true, priority: 70 },
  },

  /** Cost trend in edge position */
  costSparkline: {
    component: CostSparkline,
    supportedSizes: ['xl'] as const,
    supportedStates: ['default'] as const,
    maxDimensions: { width: 32, height: 48 },
    performance: { memoize: true, priority: 60 },
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { SparklineComplicationProps };
