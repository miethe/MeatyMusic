/**
 * Status Complication
 *
 * A status indicator complication that displays different states with colored dots and text.
 * Perfect for showing operational status, health indicators, or state information.
 *
 * @module complications/examples/StatusComplication
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { withComplicationMemo } from '../ComplicationSlots';
import type { ComplicationProps } from '../types';

// ============================================================================
// STATUS COMPLICATION COMPONENT
// ============================================================================

type StatusVariant =
  | 'online' | 'offline' | 'pending' | 'error'
  | 'success' | 'warning' | 'info' | 'disabled';

interface StatusComplicationProps extends ComplicationProps {
  /** Status variant that determines color and behavior */
  status: StatusVariant;
  /** Optional custom text (will use default text if not provided) */
  text?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show a pulse animation for active states */
  pulse?: boolean;
  /** Whether to show only the dot without text */
  dotOnly?: boolean;
  /** Custom icon (emoji or short text) */
  icon?: string;
}

/**
 * Status complication component - displays status with colored indicator
 * Commonly used in corner slots for operational status
 */
function StatusComplicationInner({
  status,
  text,
  size = 'sm',
  pulse = false,
  dotOnly = false,
  icon,
  cardState,
  cardSize,
  slot,
  isVisible,
  className,
  ...props
}: StatusComplicationProps) {

  // Don't render if not visible or in disabled card state
  if (!isVisible || cardState === 'disabled') {
    return null;
  }

  // Default text for each status
  const defaultTexts: Record<StatusVariant, string> = {
    online: 'Online',
    offline: 'Offline',
    pending: 'Pending',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    disabled: 'Disabled',
  };

  // Status configurations with colors and behavior
  const statusConfigs: Record<StatusVariant, {
    color: string;
    bgColor: string;
    borderColor: string;
    shouldPulse: boolean;
  }> = {
    online: {
      color: 'var(--mp-color-success)',
      bgColor: 'var(--mp-color-success)',
      borderColor: 'var(--mp-color-success)',
      shouldPulse: true,
    },
    offline: {
      color: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-text-muted)',
      borderColor: 'var(--mp-color-border)',
      shouldPulse: false,
    },
    pending: {
      color: 'var(--mp-color-warning)',
      bgColor: 'var(--mp-color-warning)',
      borderColor: 'var(--mp-color-warning)',
      shouldPulse: true,
    },
    error: {
      color: 'var(--mp-color-danger)',
      bgColor: 'var(--mp-color-danger)',
      borderColor: 'var(--mp-color-danger)',
      shouldPulse: true,
    },
    success: {
      color: 'var(--mp-color-success)',
      bgColor: 'var(--mp-color-success)',
      borderColor: 'var(--mp-color-success)',
      shouldPulse: false,
    },
    warning: {
      color: 'var(--mp-color-warning)',
      bgColor: 'var(--mp-color-warning)',
      borderColor: 'var(--mp-color-warning)',
      shouldPulse: false,
    },
    info: {
      color: 'var(--mp-color-info)',
      bgColor: 'var(--mp-color-info)',
      borderColor: 'var(--mp-color-info)',
      shouldPulse: false,
    },
    disabled: {
      color: 'var(--mp-color-text-muted)',
      bgColor: 'var(--mp-color-surface-muted)',
      borderColor: 'var(--mp-color-border)',
      shouldPulse: false,
    },
  };

  const config = statusConfigs[status];
  const displayText = text || defaultTexts[status];

  // Adjust size based on card size and slot
  const effectiveSize = cardSize === 'compact' ? 'sm' : size;
  const isEdgeSlot = slot.includes('edge');

  // Force dot-only for edge slots or compact cards
  const shouldShowDotOnly = dotOnly || isEdgeSlot || cardSize === 'compact';

  // Size configurations
  const sizeConfigs = {
    sm: {
      dotSize: cardSize === 'compact' ? 6 : 8,
      fontSize: '10px',
      padding: '2px 6px',
      gap: '4px',
    },
    md: {
      dotSize: cardSize === 'compact' ? 8 : 10,
      fontSize: '12px',
      padding: '4px 8px',
      gap: '6px',
    },
  };

  const sizeConfig = sizeConfigs[effectiveSize];

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: shouldShowDotOnly ? '0' : sizeConfig.gap,
    padding: shouldShowDotOnly ? '4px' : sizeConfig.padding,
    borderRadius: 'var(--mp-radius-sm)',
    transition: 'all 150ms ease-out',
    cursor: cardState === 'default' ? 'pointer' : 'default',
    userSelect: 'none' as const,
    maxWidth: isEdgeSlot ? '24px' : '80px',
    overflow: 'hidden',
  };

  const dotStyle = {
    width: `${sizeConfig.dotSize}px`,
    height: `${sizeConfig.dotSize}px`,
    borderRadius: '50%',
    backgroundColor: config.bgColor,
    border: `1px solid ${config.borderColor}`,
    flexShrink: 0,
    animation: (pulse || config.shouldPulse) ? 'statusPulse 2s infinite' : 'none',
  };

  const textStyle = {
    fontSize: sizeConfig.fontSize,
    color: config.color,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const statusClassName = cn(
    'complication-status',
    {
      'opacity-70': cardState === 'running',
      'opacity-50': cardState === 'error',
    },
    className
  );

  // Extract onError from props since it's not a valid DOM attribute
  const { onError, ...domProps } = props;

  return (
    <>
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes statusPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .complication-status * {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={statusClassName}
        style={containerStyle}
        title={`Status: ${displayText} (${slot})`}
        role="status"
        aria-label={`${displayText} status indicator`}
        {...domProps}
      >
        {/* Optional icon */}
        {icon && (
          <span
            style={{
              fontSize: sizeConfig.fontSize,
              marginRight: shouldShowDotOnly ? '0' : '2px',
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        {/* Status dot */}
        <div style={dotStyle} aria-hidden="true" />

        {/* Status text */}
        {!shouldShowDotOnly && (
          <span style={textStyle}>
            {displayText}
          </span>
        )}
      </div>
    </>
  );
}

// Memoize the component for performance
export const StatusComplication = withComplicationMemo(StatusComplicationInner);

// ============================================================================
// PRESET STATUS COMPLICATIONS
// ============================================================================

/**
 * Online status indicator
 */
export const OnlineStatus: React.ComponentType<ComplicationProps> = (props) => (
  <StatusComplication {...props} status="online" pulse />
);

/**
 * Offline status indicator
 */
export const OfflineStatus: React.ComponentType<ComplicationProps> = (props) => (
  <StatusComplication {...props} status="offline" />
);

/**
 * Pending status indicator
 */
export const PendingStatus: React.ComponentType<ComplicationProps> = (props) => (
  <StatusComplication {...props} status="pending" pulse />
);

/**
 * Error status indicator
 */
export const ErrorStatus: React.ComponentType<ComplicationProps> = (props) => (
  <StatusComplication {...props} status="error" pulse icon="!" />
);

/**
 * Success status indicator
 */
export const SuccessStatus: React.ComponentType<ComplicationProps> = (props) => (
  <StatusComplication {...props} status="success" icon="✓" />
);

/**
 * Warning status indicator
 */
export const WarningStatus: React.ComponentType<ComplicationProps> = (props) => (
  <StatusComplication {...props} status="warning" icon="⚠" />
);

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a custom status complication with predefined props
 */
export const createStatusComplication = (
  defaultProps: Partial<StatusComplicationProps>
) => {
  const CustomStatus: React.ComponentType<ComplicationProps> = (props) => (
    <StatusComplication {...defaultProps} {...props} status={defaultProps.status || 'info'} />
  );

  CustomStatus.displayName = `CustomStatus(${defaultProps.status || 'Status'})`;

  return CustomStatus;
};

/**
 * Creates a status complication that changes based on card state
 */
export const createCardStateStatus = (
  statusMap: Partial<Record<ComplicationProps['cardState'], StatusVariant>>
) => {
  const CardStateStatus: React.ComponentType<ComplicationProps> = (props) => {
    const status = statusMap[props.cardState] || 'info';
    return <StatusComplication {...props} status={status} />;
  };

  CardStateStatus.displayName = 'CardStateStatus';

  return CardStateStatus;
};

// ============================================================================
// SLOT CONFIGURATIONS
// ============================================================================

/**
 * Recommended slot configurations for status complications
 */
export const STATUS_SLOT_CONFIGS = {
  /** Online/offline status in top-left */
  connectionStatus: {
    component: createCardStateStatus({
      default: 'online',
      running: 'pending',
      error: 'error',
      disabled: 'offline',
    }),
    supportedSizes: ['compact', 'standard', 'xl'] as const,
    maxDimensions: { width: 32, height: 32 },
    performance: { memoize: true, priority: 95 },
  },

  /** Health status in top-right */
  healthStatus: {
    component: createStatusComplication({ status: 'success', text: 'Healthy' }),
    supportedSizes: ['standard', 'xl'] as const,
    supportedStates: ['default', 'running'] as const,
    maxDimensions: { width: 60, height: 24 },
    performance: { memoize: true, priority: 85 },
  },

  /** Processing status in bottom-right */
  processingStatus: {
    component: PendingStatus,
    supportedSizes: ['compact', 'standard', 'xl'] as const,
    supportedStates: ['running'] as const,
    maxDimensions: { width: 24, height: 24 },
    performance: { memoize: true, priority: 90 },
  },

  /** Error status in any corner */
  errorStatus: {
    component: ErrorStatus,
    supportedSizes: ['compact', 'standard', 'xl'] as const,
    supportedStates: ['error'] as const,
    maxDimensions: { width: 24, height: 24 },
    performance: { memoize: true, priority: 100 },
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { StatusComplicationProps };
export type { StatusVariant };
