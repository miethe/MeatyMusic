'use client';

/**
 * PromptCard Complications Context System
 *
 * Provides card state and identity to all complications without prop drilling.
 * Manages the lifecycle and state of the complications slot system.
 *
 * @module complications/context
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { isDevelopment } from '../lib/env';
import type {
  ComplicationContext,
  ComplicationSlots,
  SlotManagerConfig,
  SlotManager,
  SlotPosition,
  ComplicationErrorState,
  CardState,
  CardSize
} from './types';
import { getRegisteredComplications } from './registry';

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

/**
 * Context for sharing card state with all complications
 */
const ComplicationContextProvider = createContext<ComplicationContext | null>(null);

/**
 * Context for slot management operations
 */
const SlotManagerContext = createContext<SlotManager | null>(null);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access complication context from within a complication component
 *
 * @throws Error if used outside of ComplicationProvider
 * @returns The current complication context
 */
export function useComplicationContext(): ComplicationContext {
  const context = useContext(ComplicationContextProvider);

  if (!context) {
    throw new Error(
      'useComplicationContext must be used within a ComplicationProvider. ' +
      'Make sure your complication component is rendered inside a PromptCard with complications enabled.'
    );
  }

  return context;
}

/**
 * Hook to access slot manager for dynamic complication management
 *
 * @throws Error if used outside of ComplicationProvider
 * @returns The slot manager instance
 */
export function useSlotManager(): SlotManager {
  const manager = useContext(SlotManagerContext);

  if (!manager) {
    throw new Error(
      'useSlotManager must be used within a ComplicationProvider. ' +
      'Make sure you are using this hook in the correct context.'
    );
  }

  return manager;
}

/**
 * Hook to safely access complication context (returns null if not available)
 * Useful for components that may or may not be rendered within complications
 *
 * @returns The complication context or null
 */
export function useOptionalComplicationContext(): ComplicationContext | null {
  return useContext(ComplicationContextProvider);
}

// NOTE: Dynamic registry change detection is implemented but not currently
// active in the provider. The version tracking infrastructure is in place
// and can be activated by replacing the static useMemo with:
//
// const registryVersion = useRegistryVersion();
// const registeredComplications = useMemo(() => getRegisteredComplications(), [registryVersion]);
//
// where useRegistryVersion() would be implemented as needed for the specific
// change detection strategy (polling, event-based, etc.)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ComplicationProviderProps {
  children: React.ReactNode;
  cardId: string;
  cardState: CardState;
  cardSize: CardSize;
  cardTitle: string;
  isFocused?: boolean;
  complications?: ComplicationSlots;
  config?: Partial<SlotManagerConfig>;
  onComplicationError?: (position: SlotPosition, error: Error) => void;
  onComplicationChange?: (activeSlots: SlotPosition[]) => void;
}

/**
 * Provider component that makes complication context available to child components
 * Manages the slot manager and error states for all complications
 */
export function ComplicationProvider({
  children,
  cardId,
  cardState,
  cardSize,
  cardTitle,
  isFocused = false,
  complications = {},
  config = {},
  onComplicationError,
  onComplicationChange,
}: ComplicationProviderProps) {

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [lastStateChange] = useState<Date>(() => new Date());
  const [errors, setErrors] = useState<Partial<Record<SlotPosition, ComplicationErrorState>>>({});
  const [activeSlots, setActiveSlots] = useState<SlotPosition[]>([]);

  // Default configuration with user overrides
  const effectiveConfig: SlotManagerConfig = useMemo(() => ({
    enabled: true,
    maxComplications: 7,
    debug: false,
    errorStrategy: 'fallback',
    monitoring: {
      logPerformance: false,
      renderTimeThreshold: 16,
    },
    ...config,
  }), [config]);

  // Detect feature flags from user agent and preferences
  const features = useMemo(() => ({
    animations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }), []);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const contextValue: ComplicationContext = useMemo(() => ({
    cardId,
    cardState,
    cardSize,
    cardTitle,
    isFocused,
    lastStateChange,
    features,
  }), [cardId, cardState, cardSize, cardTitle, isFocused, lastStateChange, features]);

  // =========================================================================
  // SLOT MANAGER IMPLEMENTATION
  // =========================================================================

  // For now, get complications once - registry change detection is in place
  // but the reactive update mechanism needs refinement for production use
  const registeredComplications = useMemo(() => getRegisteredComplications(), []);
  const allComplications = useMemo(
    () => ({ ...registeredComplications, ...complications }),
    [registeredComplications, complications]
  );

  const slotManager: SlotManager = useMemo(() => {

    const register = (position: SlotPosition, config: any) => {
      console.warn('Dynamic complication registration not yet implemented');
    };

    const unregister = (position: SlotPosition) => {
      setErrors(prev => {
        const { [position]: removed, ...rest } = prev;
        return rest;
      });
    };

    const clearErrors = () => {
      setErrors({});
    };

    const getEffectiveSlots = (context: ComplicationContext): ComplicationSlots => {
      if (!effectiveConfig.enabled) {
        return {};
      }

      const filtered: ComplicationSlots = {};

      Object.entries(allComplications).forEach(([position, slotConfig]) => {
        const pos = position as SlotPosition;

        if (!slotConfig) return;

        // Check size support
        if (slotConfig.supportedSizes && !slotConfig.supportedSizes.includes(context.cardSize)) {
          return;
        }

        // Check state support
        if (slotConfig.supportedStates && !slotConfig.supportedStates.includes(context.cardState)) {
          return;
        }

        // Check animation requirements
        if (slotConfig.requiresAnimations && context.features.reducedMotion) {
          return;
        }

        filtered[pos] = slotConfig;
      });

      return filtered;
    };

    const reportError = (position: SlotPosition, error: Error, errorInfo: any) => {
      const errorId = `${position}-${Date.now()}`;
      const errorState: ComplicationErrorState = {
        hasError: true,
        error,
        errorInfo,
        errorId,
        timestamp: new Date(),
      };

      setErrors(prev => ({ ...prev, [position]: errorState }));
      onComplicationError?.(position, error);

      // Log error for monitoring
      if (effectiveConfig.monitoring.logPerformance) {
        console.error(`Complication error in slot ${position}:`, error);
      }
    };

    return {
      slots: allComplications,
      errors,
      register,
      unregister,
      clearErrors,
      getEffectiveSlots,
      reportError,
    };
  }, [allComplications, errors, effectiveConfig, onComplicationError]);

  // =========================================================================
  // SIDE EFFECTS
  // =========================================================================

  // Track active slots for external reporting
  useEffect(() => {
    const effectiveSlots = slotManager.getEffectiveSlots(contextValue);
    const newActiveSlots = Object.keys(effectiveSlots) as SlotPosition[];

    setActiveSlots(prev => {
      if (JSON.stringify(prev.sort()) === JSON.stringify(newActiveSlots.sort())) {
        return prev;
      }
      onComplicationChange?.(newActiveSlots);
      return newActiveSlots;
    });
  }, [cardId, cardState, cardSize, cardTitle, isFocused, allComplications, config]);

  // Performance monitoring
  useEffect(() => {
    if (!effectiveConfig.monitoring.logPerformance) return;

    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > effectiveConfig.monitoring.renderTimeThreshold) {
        console.warn(`Complications render time exceeded threshold: ${renderTime}ms`);
      }
    };
  }, [effectiveConfig.monitoring.logPerformance, effectiveConfig.monitoring.renderTimeThreshold]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <ComplicationContextProvider.Provider value={contextValue}>
      <SlotManagerContext.Provider value={slotManager}>
        {children}
      </SlotManagerContext.Provider>
    </ComplicationContextProvider.Provider>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Wrapper component for individual complications that provides error boundaries
 * and additional slot-specific props
 */
export interface ComplicationWrapperProps {
  children: React.ReactNode;
  slot: SlotPosition;
  className?: string;
  'aria-label'?: string;
}

export function ComplicationWrapper({
  children,
  slot,
  className,
  'aria-label': ariaLabel
}: ComplicationWrapperProps) {
  const context = useComplicationContext();
  const slotManager = useSlotManager();

  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    slotManager.reportError(slot, error, errorInfo);
  }, [slot, slotManager]);

  // Generate default ARIA label if not provided
  const effectiveAriaLabel = ariaLabel || `${slot} complication for ${context.cardTitle}`;

  return (
    <div
      className={className}
      aria-label={effectiveAriaLabel}
      data-slot={slot}
      data-card-id={context.cardId}
      role="complementary"
    >
      {children}
    </div>
  );
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Development component to visualize complication context
 * Only renders in development mode
 */
export function ComplicationDebugInfo() {
  const context = useOptionalComplicationContext();
  const slotManager = useSlotManager();

  if (!isDevelopment() || !context) {
    return null;
  }

  const effectiveSlots = slotManager.getEffectiveSlots(context);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#000',
        color: '#fff',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <div><strong>Card ID:</strong> {context.cardId}</div>
      <div><strong>State:</strong> {context.cardState}</div>
      <div><strong>Size:</strong> {context.cardSize}</div>
      <div><strong>Active Slots:</strong> {Object.keys(effectiveSlots).join(', ') || 'None'}</div>
      <div><strong>Errors:</strong> {Object.keys(slotManager.errors).length}</div>
      <div><strong>Features:</strong></div>
      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
        <li>Animations: {context.features.animations ? 'On' : 'Off'}</li>
        <li>High Contrast: {context.features.highContrast ? 'On' : 'Off'}</li>
        <li>Reduced Motion: {context.features.reducedMotion ? 'On' : 'Off'}</li>
      </ul>
    </div>
  );
}
