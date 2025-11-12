/**
 * Example Badge Complication
 *
 * A simple badge complication that demonstrates the complications system.
 * Displays a colored badge with text, typically used for status indicators.
 *
 * @module complications/examples/BadgeComplication
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { withComplicationMemo } from '../ComplicationSlots';
import type { ComplicationProps } from '../types';

// ============================================================================
// BADGE COMPLICATION COMPONENT
// ============================================================================

interface BadgeComplicationProps extends ComplicationProps {
  /** Text content of the badge */
  text: string;
  /** Badge color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show a pulse animation */
  pulse?: boolean;
  /** Custom icon (Lucide icon name) */
  icon?: string;
}

/**
 * Badge complication component - displays a small colored badge
 * Commonly used in corner slots for status indicators
 */
function BadgeComplicationInner({
  text,
  variant = 'default',
  size = 'sm',
  pulse = false,
  icon,
  cardState,
  cardSize,
  slot,
  isVisible,
  className,
  ...props
}: BadgeComplicationProps) {

  // Don't render if not visible or in certain states
  if (!isVisible || cardState === 'disabled') {
    return null;
  }

  // Variant styles using CSS custom properties
  const variantStyles = {
    default: {
      backgroundColor: 'var(--mp-color-surface-muted)',
      color: 'var(--mp-color-text)',
      borderColor: 'var(--mp-color-border)',
    },
    success: {
      backgroundColor: 'var(--mp-color-success)',
      color: 'white',
      borderColor: 'var(--mp-color-success)',
    },
    warning: {
      backgroundColor: 'var(--mp-color-warning)',
      color: 'white',
      borderColor: 'var(--mp-color-warning)',
    },
    error: {
      backgroundColor: 'var(--mp-color-danger)',
      color: 'white',
      borderColor: 'var(--mp-color-danger)',
    },
    info: {
      backgroundColor: 'var(--mp-color-info)',
      color: 'white',
      borderColor: 'var(--mp-color-info)',
    },
  };

  // Size styles
  const sizeStyles = {
    sm: {
      padding: '2px 6px',
      fontSize: '10px',
      borderRadius: '8px',
      minHeight: '16px',
    },
    md: {
      padding: '4px 8px',
      fontSize: '12px',
      borderRadius: '10px',
      minHeight: '20px',
    },
  };

  // Adjust size based on card size
  const effectiveSize = cardSize === 'compact' ? 'sm' : size;

  const badgeStyle = {
    ...variantStyles[variant],
    ...sizeStyles[effectiveSize],
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    maxWidth: slot.includes('edge') ? '24px' : '80px',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis',
    transition: 'all 150ms ease-out',
    cursor: cardState === 'default' ? 'pointer' : 'default',
    userSelect: 'none' as const,
  };

  const badgeClassName = cn(
    'complication-badge',
    {
      'animate-pulse': pulse,
      'opacity-70': cardState === 'running',
      'opacity-50': cardState === 'error',
    },
    className
  );

  // Extract onError from props since it's not a valid DOM attribute
  const { onError, ...domProps } = props;

  return (
    <div
      className={badgeClassName}
      style={badgeStyle}
      title={`${text} (${slot})`}
      role="status"
      aria-label={`${text} indicator`}
      {...domProps}
    >
      {/* Optional icon */}
      {icon && (
        <span
          style={{
            marginRight: text ? '4px' : '0',
            fontSize: effectiveSize === 'sm' ? '8px' : '10px',
          }}
          aria-hidden="true"
        >
          {/* In a real implementation, this would use a proper icon component */}
          •
        </span>
      )}

      {/* Badge text - truncated for edge slots */}
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {slot.includes('edge') ? text.slice(0, 1) : text}
      </span>
    </div>
  );
}

// Memoize the component for performance
export const BadgeComplication = withComplicationMemo(BadgeComplicationInner);

// ============================================================================
// PRESET BADGE COMPLICATIONS
// ============================================================================

/**
 * Success status badge
 */
export const SuccessBadge: React.ComponentType<ComplicationProps> = (props) => (
  <BadgeComplication {...props} text="✓" variant="success" />
);

/**
 * Error status badge
 */
export const ErrorBadge: React.ComponentType<ComplicationProps> = (props) => (
  <BadgeComplication {...props} text="!" variant="error" pulse />
);

/**
 * Running status badge
 */
export const RunningBadge: React.ComponentType<ComplicationProps> = (props) => (
  <BadgeComplication {...props} text="••" variant="info" pulse />
);

/**
 * New item badge
 */
export const NewBadge: React.ComponentType<ComplicationProps> = (props) => (
  <BadgeComplication {...props} text="NEW" variant="warning" />
);

/**
 * Starred/favorite badge
 */
export const StarBadge: React.ComponentType<ComplicationProps> = (props) => (
  <BadgeComplication {...props} text="★" variant="warning" />
);

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a custom badge complication with predefined props
 */
export const createBadgeComplication = (
  defaultProps: Partial<BadgeComplicationProps>
) => {
  const CustomBadge: React.ComponentType<ComplicationProps> = (props) => (
    <BadgeComplication {...defaultProps} {...props} text={defaultProps.text || 'Badge'} />
  );

  CustomBadge.displayName = `CustomBadge(${defaultProps.text || 'Badge'})`;

  return CustomBadge;
};

/**
 * Creates a status badge that changes based on card state
 */
export const createStatusBadge = (
  statusMap: Partial<Record<ComplicationProps['cardState'], Partial<BadgeComplicationProps>>>
) => {
  const StatusBadge: React.ComponentType<ComplicationProps> = (props) => {
    const statusProps = statusMap[props.cardState] || {};
    return <BadgeComplication {...statusProps} {...props} text={statusProps.text || 'Status'} />;
  };

  StatusBadge.displayName = 'StatusBadge';

  return StatusBadge;
};

// ============================================================================
// SLOT CONFIGURATIONS
// ============================================================================

/**
 * Recommended slot configurations for badge complications
 */
export const BADGE_SLOT_CONFIGS = {
  /** Status indicator in top-right */
  statusBadge: {
    component: createStatusBadge({
      running: { text: '•••', variant: 'info', pulse: true },
      error: { text: '!', variant: 'error', pulse: true },
      default: { text: '✓', variant: 'success' },
    }),
    supportedSizes: ['compact', 'standard', 'xl'] as const,
    supportedStates: ['default', 'running', 'error'] as const,
    maxDimensions: { width: 32, height: 32 },
    performance: { memoize: true, priority: 90 },
  },

  /** New item indicator */
  newItemBadge: {
    component: NewBadge,
    supportedSizes: ['standard', 'xl'] as const,
    maxDimensions: { width: 40, height: 20 },
    performance: { memoize: true, priority: 70 },
  },

  /** Favorite indicator */
  favoriteBadge: {
    component: StarBadge,
    supportedSizes: ['compact', 'standard', 'xl'] as const,
    maxDimensions: { width: 24, height: 24 },
    performance: { memoize: true, priority: 60 },
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { BadgeComplicationProps };
