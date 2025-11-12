'use client';

/**
 * PromptCard Complications Slot Renderer
 *
 * Renders complications in their designated slots with error boundaries,
 * performance optimizations, and accessibility support.
 *
 * @module complications/ComplicationSlots
 */

import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from '../lib/utils';
import { isDevelopment } from '../lib/env';
import {
  useComplicationContext,
  useSlotManager,
  ComplicationWrapper
} from './context';
import type {
  SlotPosition,
  ComplicationProps,
  ComplicationErrorProps,
  ComplicationErrorState
} from './types';
import styles from './complications.module.css';

// ============================================================================
// SLOT POSITION UTILITIES
// ============================================================================

/**
 * Maps slot positions to their CSS class names
 */
const SLOT_CLASSES: Record<SlotPosition, string> = {
  topLeft: styles.slotTopLeft,
  topRight: styles.slotTopRight,
  bottomLeft: styles.slotBottomLeft,
  bottomRight: styles.slotBottomRight,
  edgeLeft: styles.slotEdgeLeft,
  edgeRight: styles.slotEdgeRight,
  footer: styles.slotFooter,
};

/**
 * Validates if a string is a valid slot position
 */
function isValidSlotPosition(position: string): position is SlotPosition {
  return position in SLOT_CLASSES;
}

/**
 * Gets the render priority for a slot (higher number = renders earlier)
 * Used for performance optimization when many complications are present
 */
function getSlotPriority(position: SlotPosition): number {
  const priorities: Record<SlotPosition, number> = {
    topLeft: 100,    // Highest - usually critical badges
    topRight: 90,    // High - usually status indicators
    bottomRight: 80, // Medium-high - usually actions
    bottomLeft: 70,  // Medium - usually secondary info
    footer: 60,      // Medium-low - usually supplementary
    edgeRight: 50,   // Low - usually decorative
    edgeLeft: 40,    // Lowest - usually decorative
  };
  return priorities[position];
}

// ============================================================================
// LOADING FALLBACK COMPONENT
// ============================================================================

interface ComplicationLoadingProps {
  slot: SlotPosition;
}

function ComplicationLoading({ slot }: ComplicationLoadingProps) {
  return (
    <div
      className={cn(styles.slot, SLOT_CLASSES[slot])}
      aria-label={`Loading ${slot} complication`}
    >
      <div
        className="animate-pulse bg-gray-300 rounded"
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: 'var(--mp-color-surface-muted)',
        }}
      />
    </div>
  );
}

// ============================================================================
// INDIVIDUAL SLOT RENDERER
// ============================================================================

interface SlotRendererProps {
  position: SlotPosition;
  className?: string;
  debug?: boolean;
}

function SlotRenderer({ position, className, debug = false }: SlotRendererProps) {
  const context = useComplicationContext();
  const slotManager = useSlotManager();
  const [isVisible, setIsVisible] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [errorState, setErrorState] = useState<ComplicationErrorState>({ hasError: false });

  // Get the effective slots based on current context
  const effectiveSlots = useMemo(
    () => slotManager.getEffectiveSlots(context),
    [slotManager, context]
  );

  const slotConfig = effectiveSlots[position];

  // Handle error reporting
  const handleError = useCallback((error: Error, info: React.ErrorInfo) => {
    const state: ComplicationErrorState = {
      hasError: true,
      error,
      errorInfo: info,
      timestamp: new Date(),
      errorId: `${position}-${Date.now()}`,
    };
    setErrorState(state);
    slotManager.reportError(position, error, info);
    if (isDevelopment()) {
      console.error(`Complication error in slot ${position}:`, error, info);
    }
  }, [slotManager, position]);

  // Handle entrance/exit animations
  useEffect(() => {
    if (slotConfig && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [slotConfig, hasAnimated]);

  // Don't render if no complication is configured for this slot
  if (!slotConfig) {
    return null;
  }

  const { component: Component, errorFallback, performance = {} } = slotConfig;

  // Generate ARIA label
  const ariaLabel = `${position} complication for ${context.cardTitle}`;

  // Combine class names
  const slotClassName = cn(
    styles.slot,
    SLOT_CLASSES[position],
    {
      [styles.slotEntering]: !hasAnimated && context.features.animations,
      [styles.slotError]: slotManager.errors[position]?.hasError,
    },
    className
  );

  // Create complication props
  const complicationProps: ComplicationProps = {
    ...context,
    slot: position,
    isVisible,
    onError: handleError,
    className: slotClassName,
    'aria-label': ariaLabel,
  };

  // Wrap with error boundary
  const content = (
    <ErrorBoundary
      onError={handleError}
      fallbackRender={({ error, resetErrorBoundary }) => {
        if (!errorFallback) return null;
        const Fallback = errorFallback;
        const retry = () => {
          setErrorState({ hasError: false });
          resetErrorBoundary();
        };
        const dismiss = () => slotManager.unregister(position);
        return (
          <Fallback
            error={error}
            errorInfo={errorState.errorInfo || { componentStack: '' }}
            slot={position}
            context={context}
            retry={retry}
            dismiss={dismiss}
          />
        );
      }}
    >
      <ComplicationWrapper
        slot={position}
        className={slotClassName}
        aria-label={ariaLabel}
      >
        <Component {...complicationProps} />
      </ComplicationWrapper>
    </ErrorBoundary>
  );

  // Wrap with Suspense if lazy loading is enabled
  if (performance.lazy) {
    return (
      <Suspense fallback={<ComplicationLoading slot={position} />}>
        {content}
      </Suspense>
    );
  }

  return content;
}

// ============================================================================
// MAIN COMPLICATIONS SLOTS COMPONENT
// ============================================================================

interface ComplicationSlotsProps {
  className?: string;
  debug?: boolean;
}

/**
 * Main component that renders all complication slots
 * Manages the container and coordinates individual slot rendering
 */
export function ComplicationSlotsComponent({ className, debug = false }: ComplicationSlotsProps) {
  const context = useComplicationContext();
  const slotManager = useSlotManager();

  // Get all effective slots
  const effectiveSlots = useMemo(
    () => slotManager.getEffectiveSlots(context),
    [slotManager, context]
  );

  // Sort slots by render priority for performance
  const sortedSlots = useMemo(() => {
    return (Object.keys(effectiveSlots) as SlotPosition[])
      .sort((a, b) => getSlotPriority(b) - getSlotPriority(a));
  }, [effectiveSlots]);

  // Early return if no complications
  if (sortedSlots.length === 0) {
    return null;
  }

  // Create container class names
  const containerClassName = cn(
    styles.complicationsContainer,
    {
      [styles.compact]: context.cardSize === 'compact',
      [styles.xl]: context.cardSize === 'xl',
      [styles.running]: context.cardState === 'running',
      [styles.error]: context.cardState === 'error',
      [styles.disabled]: context.cardState === 'disabled',
      [styles.selected]: context.cardState === 'selected',
      [styles.debug]: debug,
    },
    className
  );

  return (
    <div
      className={containerClassName}
      data-complications-count={sortedSlots.length}
      data-card-id={context.cardId}
      aria-hidden="true" // Complications should not interfere with card accessibility
    >
      {sortedSlots.map(position => (
        <SlotRenderer
          key={position}
          position={position}
          debug={debug}
        />
      ))}

      {/* Debug information overlay */}
      {debug && isDevelopment() && (
        <div className={styles.debugInfo}>
          <div>Slots: {sortedSlots.join(', ')}</div>
          <div>Errors: {Object.keys(slotManager.errors).length}</div>
          <div>Card: {context.cardSize} / {context.cardState}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Higher-order component to memoize complications for performance
 */
export function withComplicationMemo<T extends ComplicationProps>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const MemoizedComponent = React.memo(Component as React.ComponentType<any>, (prevProps: T, nextProps: T) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.cardId === nextProps.cardId &&
      prevProps.cardState === nextProps.cardState &&
      prevProps.cardSize === nextProps.cardSize &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.slot === nextProps.slot
    );
  });

  MemoizedComponent.displayName = `withComplicationMemo(${Component.displayName || Component.name})`;

  return MemoizedComponent as React.ComponentType<T>;
}

/**
 * Hook to determine if a complication should render based on current conditions
 */
export function useComplicationVisibility(
  supportedSizes?: ('compact' | 'standard' | 'xl')[],
  supportedStates?: ('default' | 'running' | 'error' | 'disabled' | 'selected')[],
  requiresAnimations?: boolean
): boolean {
  const context = useComplicationContext();

  return useMemo(() => {
    // Check size support
    if (supportedSizes && !supportedSizes.includes(context.cardSize)) {
      return false;
    }

    // Check state support
    if (supportedStates && !supportedStates.includes(context.cardState)) {
      return false;
    }

    // Check animation requirements
    if (requiresAnimations && context.features.reducedMotion) {
      return false;
    }

    return true;
  }, [context, supportedSizes, supportedStates, requiresAnimations]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { isValidSlotPosition, getSlotPriority };
export type { ComplicationSlotsProps, SlotRendererProps };
