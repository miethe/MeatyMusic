/**
 * PromptCard Complications System - Main Entry Point
 *
 * Provides a watch-face inspired slot system for adding micro-widgets
 * around the PromptCard without modifying the core component.
 *
 * @module complications
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core types
  SlotPosition,
  CardSize,
  CardState,
  ComplicationContext,
  ComplicationProps,
  ComplicationSlots as ComplicationSlotsType,
  SlotConfig,

  // Error handling
  ComplicationErrorProps,
  ComplicationErrorState,

  // Slot management
  SlotManager,
  SlotManagerConfig,

  // Extensions for PromptCard
  PromptCardComplicationProps,

  // Utility types
  SlotPositionGuard,
  ConditionalRender,
  LazyComplication,
  ComplicationRegistryEntry,
  ComplicationValidation,
} from './types';

export type { ComplicationSlots } from './types';

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export {
  // Utility components and HOCs
  withComplicationMemo,

  // Custom hooks
  useComplicationVisibility,

  // Type guards and utilities (also exported from validation section below)
  isValidSlotPosition as isValidSlotPositionFromSlots,
  getSlotPriority,
} from './ComplicationSlots';

export {
  // Context providers and hooks
  ComplicationProvider,
  ComplicationWrapper,
  ComplicationDebugInfo,
  useComplicationContext,
  useSlotManager,
  useOptionalComplicationContext,
} from './context';

export {
  registerComplication,
  registerDefaultComplication,
  getRegisteredComplications,
} from './registry';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

import type { SlotPosition, SlotConfig, ComplicationProps } from './types';
import { isDevelopment } from '../lib/env';

/**
 * Runtime validation for slot positions
 */
export const isValidSlotPosition = (value: unknown): value is SlotPosition => {
  return typeof value === 'string' && [
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'edgeLeft',
    'edgeRight',
    'footer'
  ].includes(value);
};

/**
 * Validates slot configuration object
 */
export const validateSlotConfig = (config: SlotConfig): boolean => {
  try {
    // Check required component property
    if (!config.component || typeof config.component !== 'function') {
      return false;
    }

    // Check optional arrays
    if (config.supportedSizes && !Array.isArray(config.supportedSizes)) {
      return false;
    }

    if (config.supportedStates && !Array.isArray(config.supportedStates)) {
      return false;
    }

    // Check max dimensions
    if (config.maxDimensions) {
      if (config.maxDimensions.width && config.maxDimensions.width <= 0) {
        return false;
      }
      if (config.maxDimensions.height && config.maxDimensions.height <= 0) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Validates complication props at runtime
 */
export const validateComplicationProps = (props: ComplicationProps): boolean => {
  try {
    return (
      typeof props.cardId === 'string' &&
      props.cardId.length > 0 &&
      typeof props.cardState === 'string' &&
      ['default', 'running', 'error', 'disabled', 'selected'].includes(props.cardState) &&
      typeof props.cardSize === 'string' &&
      ['compact', 'standard', 'xl'].includes(props.cardSize) &&
      isValidSlotPosition(props.slot) &&
      typeof props.cardTitle === 'string' &&
      typeof props.isFocused === 'boolean' &&
      props.lastStateChange instanceof Date &&
      typeof props.features === 'object' &&
      typeof props.features.animations === 'boolean' &&
      typeof props.features.highContrast === 'boolean' &&
      typeof props.features.reducedMotion === 'boolean' &&
      typeof props.isVisible === 'boolean'
    );
  } catch {
    return false;
  }
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Creates a mock complication for testing and development
 */
export const createMockComplication = (
  slotName: string,
  content: React.ReactNode = null
): React.ComponentType<ComplicationProps> => {
  const MockComplication: React.ComponentType<ComplicationProps> = (props) => {
    if (isDevelopment()) {
      return React.createElement('div', {
        style: {
          padding: '4px 8px',
          backgroundColor: 'var(--mp-color-info)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        },
        title: `Mock complication: ${slotName}\nCard: ${props.cardId}\nSlot: ${props.slot}`,
      }, content || slotName);
    }

    return null;
  };

  MockComplication.displayName = `MockComplication(${slotName})`;

  return MockComplication;
};

/**
 * Development helper to create a full set of mock complications
 */
export const createMockComplicationSet = (): Record<SlotPosition, SlotConfig> => {
  if (!isDevelopment()) {
    console.warn('createMockComplicationSet should only be used in development');
    return {} as Record<SlotPosition, SlotConfig>;
  }

  const positions: SlotPosition[] = [
    'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
    'edgeLeft', 'edgeRight', 'footer'
  ];

  return positions.reduce((acc, position) => {
    acc[position] = {
      component: createMockComplication(position),
      supportedSizes: ['compact', 'standard', 'xl'],
      supportedStates: ['default', 'running', 'error', 'disabled', 'selected'],
      performance: {
        memoize: true,
        priority: 50,
      },
    };
    return acc;
  }, {} as Record<SlotPosition, SlotConfig>);
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default slot manager configuration
 */
export const DEFAULT_SLOT_MANAGER_CONFIG = {
  enabled: true,
  maxComplications: 7,
  debug: false,
  errorStrategy: 'fallback' as const,
  monitoring: {
    logPerformance: false,
    renderTimeThreshold: 16,
  },
};

/**
 * Available slot positions as a constant array
 */
export const AVAILABLE_SLOTS: readonly SlotPosition[] = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
  'edgeLeft',
  'edgeRight',
  'footer',
] as const;

/**
 * Slot position descriptions for documentation and tooling
 */
export const SLOT_DESCRIPTIONS: Record<SlotPosition, string> = {
  topLeft: 'Top-left corner, above header content',
  topRight: 'Top-right corner, above header content',
  bottomLeft: 'Bottom-left corner, below all content',
  bottomRight: 'Bottom-right corner, below all content',
  edgeLeft: 'Left edge, vertically centered',
  edgeRight: 'Right edge, vertically centered',
  footer: 'Bottom edge, spans full width below content',
};

/**
 * Recommended maximum dimensions for each slot position
 */
export const RECOMMENDED_SLOT_DIMENSIONS: Record<SlotPosition, { width: number; height: number }> = {
  topLeft: { width: 48, height: 48 },
  topRight: { width: 48, height: 48 },
  bottomLeft: { width: 48, height: 48 },
  bottomRight: { width: 48, height: 48 },
  edgeLeft: { width: 32, height: 120 },
  edgeRight: { width: 32, height: 120 },
  footer: { width: 400, height: 40 },
};

// ============================================================================
// VERSION INFO
// ============================================================================

/**
 * Complications system version for compatibility tracking
 */
export const COMPLICATIONS_VERSION = '1.0.0';

/**
 * Minimum supported PromptCard version
 */
export const MIN_PROMPT_CARD_VERSION = '2.0.0';

// Re-export React for convenience in complication development
import * as React from 'react';
export { React };

/**
 * ComplicationSlotsComponent for rendering complications
 */
export { ComplicationSlotsComponent } from './ComplicationSlots';
