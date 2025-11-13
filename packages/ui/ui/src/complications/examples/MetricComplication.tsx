/**
 * Metric Complication
 *
 * A numeric metric display complication that shows values with optional labels,
 * units, trend arrows, and formatting. Perfect for displaying KPIs and statistics.
 *
 * @module complications/examples/MetricComplication
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { withComplicationMemo } from '../ComplicationSlots';
import type { ComplicationProps } from '../types';

// ============================================================================
// METRIC COMPLICATION COMPONENT
// ============================================================================

type MetricVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';
type TrendDirection = 'up' | 'down' | 'neutral' | 'none';

interface MetricComplicationProps extends ComplicationProps {
  /** The numeric value to display */
  value: number;
  /** Optional label for the metric */
  label?: string;
  /** Unit suffix (e.g., '%', 'ms', '$') */
  unit?: string;
  /** Color variant */
  variant?: MetricVariant;
  /** Trend direction with arrow indicator */
  trend?: TrendDirection;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Number of decimal places to show */
  precision?: number;
  /** Whether to format large numbers (1K, 1M, etc.) */
  compact?: boolean;
  /** Custom formatting function */
  formatter?: (value: number) => string;
  /** Optional icon (emoji or short text) */
  icon?: string;
}

/**
 * Metric complication component - displays formatted numeric values
 * Commonly used in various slots for showing statistics and KPIs
 */
function MetricComplicationInner({
  value,
  label,
  unit = '',
  variant = 'default',
  trend = 'none',
  size = 'md',
  precision = 0,
  compact = true,
  formatter,
  icon,
  cardState,
  cardSize,
  slot,
  isVisible,
  className,
  ...props
}: MetricComplicationProps) {

  // Don't render if not visible or in disabled state
  if (!isVisible || cardState === 'disabled') {
    return null;
  }

  // Adjust size based on card size
  const getEffectiveSize = () => {
    if (cardSize === 'compact') return 'sm';
    if (cardSize === 'xl') return size === 'sm' ? 'md' : size;
    return size;
  };

  const effectiveSize = getEffectiveSize();
  const isEdgeSlot = slot.includes('edge');

  // Color variants using CSS custom properties
  const variantStyles = {
    default: {
      valueColor: 'var(--mp-color-text-strong)',
      labelColor: 'var(--mp-color-text-muted)',
      bgColor: 'transparent',
    },
    success: {
      valueColor: 'var(--mp-color-success)',
      labelColor: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-success-muted)',
    },
    warning: {
      valueColor: 'var(--mp-color-warning)',
      labelColor: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-warning-muted)',
    },
    error: {
      valueColor: 'var(--mp-color-danger)',
      labelColor: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-danger-muted)',
    },
    info: {
      valueColor: 'var(--mp-color-info)',
      labelColor: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-info-muted)',
    },
    muted: {
      valueColor: 'var(--mp-color-text-muted)',
      labelColor: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-surface-muted)',
    },
  };

  const colors = variantStyles[variant];

  // Size configurations
  const sizeConfigs = {
    sm: {
      valueFontSize: '10px',
      labelFontSize: '8px',
      trendSize: '8px',
      padding: '2px 4px',
      gap: '2px',
    },
    md: {
      valueFontSize: '12px',
      labelFontSize: '10px',
      trendSize: '10px',
      padding: '4px 6px',
      gap: '3px',
    },
    lg: {
      valueFontSize: '14px',
      labelFontSize: '11px',
      trendSize: '12px',
      padding: '6px 8px',
      gap: '4px',
    },
  };

  const sizeConfig = sizeConfigs[effectiveSize];

  // Format the value
  const formatValue = (val: number): string => {
    if (formatter) return formatter(val);

    if (compact && Math.abs(val) >= 1000) {
      if (Math.abs(val) >= 1000000) {
        return `${(val / 1000000).toFixed(precision)}M`;
      }
      if (Math.abs(val) >= 1000) {
        return `${(val / 1000).toFixed(precision)}K`;
      }
    }

    return val.toFixed(precision);
  };

  const formattedValue = formatValue(value);

  // Trend arrow components
  const getTrendArrow = () => {
    const arrows = {
      up: '↗',
      down: '↘',
      neutral: '→',
      none: '',
    };
    return arrows[trend];
  };

  const trendArrow = getTrendArrow();
  const trendColor = trend === 'up' ? 'var(--mp-color-success)' :
                     trend === 'down' ? 'var(--mp-color-danger)' :
                     'var(--mp-color-text-muted)';

  // Layout configuration based on slot position
  const getLayout = () => {
    if (isEdgeSlot || (cardSize === 'compact' && !slot.includes('footer'))) {
      return {
        direction: 'column',
        showLabel: false,
        showUnit: unit.length <= 1, // Only show single-character units
        textAlign: 'center' as const,
      };
    }

    return {
      direction: slot === 'footer' ? 'row' : 'column',
      showLabel: !!label,
      showUnit: true,
      textAlign: slot === 'footer' ? 'left' as const : 'center' as const,
    };
  };

  const layout = getLayout();

  const containerStyle = {
    display: 'flex',
    flexDirection: layout.direction as 'row' | 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    padding: sizeConfig.padding,
    borderRadius: 'var(--mp-radius-sm)',
    backgroundColor: colors.bgColor,
    transition: 'all 150ms ease-out',
    cursor: cardState === 'default' ? 'pointer' : 'default',
    userSelect: 'none' as const,
    textAlign: layout.textAlign,
    minWidth: isEdgeSlot ? '20px' : '24px',
    maxWidth: slot === 'footer' ? '120px' : isEdgeSlot ? '32px' : '80px',
    overflow: 'hidden',
  };

  const valueStyle = {
    fontSize: sizeConfig.valueFontSize,
    fontWeight: 700,
    color: colors.valueColor,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    whiteSpace: 'nowrap' as const,
  };

  const labelStyle = {
    fontSize: sizeConfig.labelFontSize,
    color: colors.labelColor,
    fontWeight: 500,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  };

  const metricClassName = cn(
    'complication-metric',
    {
      'opacity-70': cardState === 'running',
      'opacity-50': cardState === 'error',
    },
    className
  );

  // Generate accessibility label
  const accessibilityLabel = [
    label,
    formattedValue,
    unit,
    trend !== 'none' ? `trending ${trend}` : '',
  ].filter(Boolean).join(' ');

  // Extract onError from props since it's not a valid DOM attribute
  const { onError, ...domProps } = props;

  return (
    <div
      className={metricClassName}
      style={containerStyle}
      title={`${label || 'Metric'}: ${formattedValue}${unit} (${slot})`}
      role="status"
      aria-label={accessibilityLabel}
      {...domProps}
    >
      {/* Optional icon */}
      {icon && (
        <span
          style={{
            fontSize: sizeConfig.labelFontSize,
            marginBottom: layout.direction === 'column' ? '1px' : '0',
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      {/* Label (shown first in column layout, or if no value) */}
      {layout.showLabel && layout.direction === 'column' && (
        <div style={labelStyle}>
          {label}
        </div>
      )}

      {/* Value with unit and trend */}
      <div style={valueStyle}>
        {/* Trend arrow before value */}
        {trendArrow && trend !== 'none' && (
          <span
            style={{
              color: trendColor,
              fontSize: sizeConfig.trendSize,
            }}
            aria-hidden="true"
          >
            {trendArrow}
          </span>
        )}

        {/* Main value */}
        <span>
          {formattedValue}
        </span>

        {/* Unit suffix */}
        {layout.showUnit && unit && (
          <span
            style={{
              fontSize: sizeConfig.labelFontSize,
              fontWeight: 500,
              color: colors.labelColor,
              marginLeft: '1px',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Label (shown after value in row layout) */}
      {layout.showLabel && layout.direction === 'row' && (
        <div style={labelStyle}>
          {label}
        </div>
      )}
    </div>
  );
}

// Memoize the component for performance
export const MetricComplication = withComplicationMemo(MetricComplicationInner);

// ============================================================================
// PRESET METRIC COMPLICATIONS
// ============================================================================

/**
 * Success rate percentage
 */
export const SuccessRateMetric: React.ComponentType<ComplicationProps & { value: number }> = (props) => (
  <MetricComplication
    {...props}
    unit="%"
    variant="success"
    precision={0}
    label="Success"
    icon="✓"
  />
);

/**
 * Latency metric
 */
export const LatencyMetric: React.ComponentType<ComplicationProps & { value: number }> = (props) => (
  <MetricComplication
    {...props}
    unit="ms"
    variant="info"
    precision={0}
    label="Latency"
    compact={false}
    icon="⏱"
  />
);

/**
 * Cost metric
 */
export const CostMetric: React.ComponentType<ComplicationProps & { value: number }> = (props) => (
  <MetricComplication
    {...props}
    unit="¢"
    variant="warning"
    precision={1}
    label="Cost"
    formatter={(val) => (val * 100).toFixed(1)} // Convert to cents
    icon="$"
  />
);

/**
 * Usage count metric
 */
export const UsageMetric: React.ComponentType<ComplicationProps & { value: number }> = (props) => (
  <MetricComplication
    {...props}
    variant="default"
    precision={0}
    label="Runs"
    compact={true}
    icon="📊"
  />
);

/**
 * Error count metric
 */
export const ErrorCountMetric: React.ComponentType<ComplicationProps & { value: number }> = (props) => (
  <MetricComplication
    {...props}
    variant="error"
    precision={0}
    label="Errors"
    compact={true}
    icon="!"
  />
);

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a custom metric complication with predefined props
 */
export const createMetricComplication = (
  defaultProps: Partial<MetricComplicationProps>
) => {
  const CustomMetric: React.ComponentType<ComplicationProps & { value: number }> = (props) => (
    <MetricComplication {...defaultProps} {...props} />
  );

  CustomMetric.displayName = `CustomMetric(${defaultProps.label || 'Metric'})`;

  return CustomMetric;
};

/**
 * Creates a trending metric that shows trend direction based on comparison
 */
export const createTrendingMetric = (
  metricProps: Partial<MetricComplicationProps>,
  getPreviousValue?: (currentValue: number) => number
) => {
  const TrendingMetric: React.ComponentType<ComplicationProps & { value: number }> = ({ value, ...props }) => {
    const previousValue = getPreviousValue?.(value) ?? value;
    const trend: TrendDirection =
      value > previousValue ? 'up' :
      value < previousValue ? 'down' : 'neutral';

    return <MetricComplication {...metricProps} {...props} value={value} trend={trend} />;
  };

  TrendingMetric.displayName = `TrendingMetric(${metricProps.label || 'Metric'})`;

  return TrendingMetric;
};

// ============================================================================
// SLOT CONFIGURATIONS
// ============================================================================

/**
 * Recommended slot configurations for metric complications
 */
export const METRIC_SLOT_CONFIGS = {
  /** Success rate in top-right corner */
  successRateMetric: {
    component: SuccessRateMetric,
    supportedSizes: ['compact', 'standard', 'xl'] as const,
    supportedStates: ['default', 'running'] as const,
    maxDimensions: { width: 48, height: 32 },
    performance: { memoize: true, priority: 85 },
  },

  /** Latency in bottom-left corner */
  latencyMetric: {
    component: LatencyMetric,
    supportedSizes: ['standard', 'xl'] as const,
    supportedStates: ['default', 'running'] as const,
    maxDimensions: { width: 48, height: 32 },
    performance: { memoize: true, priority: 75 },
  },

  /** Cost in edge position */
  costMetric: {
    component: CostMetric,
    supportedSizes: ['xl'] as const,
    supportedStates: ['default'] as const,
    maxDimensions: { width: 40, height: 60 },
    performance: { memoize: true, priority: 65 },
  },

  /** Usage count in footer */
  usageMetric: {
    component: UsageMetric,
    supportedSizes: ['standard', 'xl'] as const,
    supportedStates: ['default'] as const,
    maxDimensions: { width: 100, height: 24 },
    performance: { memoize: true, priority: 70 },
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { MetricComplicationProps };
export type { MetricVariant, TrendDirection };
