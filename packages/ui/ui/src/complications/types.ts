/**
 * TypeScript type definitions for PromptCard Complications Slot System
 *
 * Provides a watch-face inspired slot system for micro-widgets around the card.
 * Each slot position has specific constraints and context access.
 *
 * @module complications/types
 */

import type { ReactNode, ComponentType, ErrorInfo } from 'react';

// ============================================================================
// CORE SLOT TYPES
// ============================================================================

/**
 * Available slot positions around the PromptCard.
 * Positioned using CSS absolute positioning with defined anchors.
 */
export type SlotPosition =
  | 'topLeft'      // Top-left corner, above header
  | 'topRight'     // Top-right corner, above header
  | 'bottomLeft'   // Bottom-left corner, below actions
  | 'bottomRight'  // Bottom-right corner, below actions
  | 'edgeLeft'     // Left edge, vertically centered
  | 'edgeRight'    // Right edge, vertically centered
  | 'footer';      // Bottom edge, below all content

/**
 * Card size variants that complications must adapt to.
 * Affects available space and styling constraints.
 */
export type CardSize = 'compact' | 'standard' | 'xl';

/**
 * Card state that complications can respond to.
 * Allows dynamic styling and behavior based on card context.
 */
export type CardState = 'default' | 'running' | 'error' | 'disabled' | 'selected';

// ============================================================================
// COMPLICATION CONTEXT & PROPS
// ============================================================================

/**
 * Context data passed to all complications.
 * Provides card identity and state for responsive behavior.
 */
export interface ComplicationContext {
  /** Unique identifier for the card */
  cardId: string;
  /** Current card state */
  cardState: CardState;
  /** Current card size variant */
  cardSize: CardSize;
  /** Card title for accessibility labels */
  cardTitle: string;
  /** Whether the card is currently focused */
  isFocused: boolean;
  /** Timestamp of last state change */
  lastStateChange: Date;
  /** Feature flags for complication behavior */
  features: {
    animations: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

/**
 * Props passed to each complication component.
 * Extends context with slot-specific information.
 */
export interface ComplicationProps extends ComplicationContext {
  /** The slot position this complication is rendered in */
  slot: SlotPosition;
  /** Whether this complication is currently visible */
  isVisible: boolean;
  /** Callback to report errors to the slot's error boundary */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional className for custom styling */
  className?: string;
  /** ARIA label for accessibility (auto-generated if not provided) */
  'aria-label'?: string;
}

// ============================================================================
// SLOT CONFIGURATION
// ============================================================================

/**
 * Configuration for a single complication slot.
 * Defines rendering behavior and constraints.
 */
export interface SlotConfig {
  /** The React component to render in this slot */
  component: ComponentType<ComplicationProps>;
  /** Whether this slot should render across all card sizes */
  supportedSizes?: CardSize[];
  /** Whether this slot should render in all card states */
  supportedStates?: CardState[];
  /** Maximum width/height constraints in pixels */
  maxDimensions?: {
    width?: number;
    height?: number;
  };
  /** Whether this complication requires animations */
  requiresAnimations?: boolean;
  /** Custom error fallback component */
  errorFallback?: ComponentType<ComplicationErrorProps>;
  /** Performance hints for rendering optimization */
  performance?: {
    /** Whether to lazy load this complication */
    lazy?: boolean;
    /** Whether to memoize this complication */
    memoize?: boolean;
    /** Priority for rendering order (higher = earlier) */
    priority?: number;
  };
}

/**
 * Complete mapping of slot positions to their configurations.
 * Represents all complications to be rendered on a card.
 */
export interface ComplicationSlots {
  topLeft?: SlotConfig;
  topRight?: SlotConfig;
  bottomLeft?: SlotConfig;
  bottomRight?: SlotConfig;
  edgeLeft?: SlotConfig;
  edgeRight?: SlotConfig;
  footer?: SlotConfig;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Props for complication error boundary fallback components.
 */
export interface ComplicationErrorProps {
  error: Error;
  errorInfo: ErrorInfo;
  slot: SlotPosition;
  context: ComplicationContext;
  /** Callback to retry rendering the complication */
  retry: () => void;
  /** Callback to permanently hide the complication */
  dismiss: () => void;
}

/**
 * Error boundary state for individual slots.
 */
export interface ComplicationErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  timestamp?: Date;
}

// ============================================================================
// SLOT MANAGER
// ============================================================================

/**
 * Configuration for the complications slot manager.
 */
export interface SlotManagerConfig {
  /** Global feature flag to enable/disable all complications */
  enabled: boolean;
  /** Maximum number of complications to render simultaneously */
  maxComplications: number;
  /** Whether to show debug information in development */
  debug: boolean;
  /** Global error handling strategy */
  errorStrategy: 'hide' | 'fallback' | 'boundary';
  /** Performance monitoring configuration */
  monitoring: {
    /** Log render performance metrics */
    logPerformance: boolean;
    /** Maximum render time threshold in ms */
    renderTimeThreshold: number;
  };
}

/**
 * Slot manager state and methods.
 */
export interface SlotManager {
  /** Current slot configurations */
  slots: ComplicationSlots;
  /** Error states for each slot */
  errors: Partial<Record<SlotPosition, ComplicationErrorState>>;
  /** Register a complication in a slot */
  register: (position: SlotPosition, config: SlotConfig) => void;
  /** Unregister a complication from a slot */
  unregister: (position: SlotPosition) => void;
  /** Clear all error states */
  clearErrors: () => void;
  /** Get effective slots after filtering by constraints */
  getEffectiveSlots: (context: ComplicationContext) => ComplicationSlots;
  /** Report a complication error */
  reportError: (position: SlotPosition, error: Error, errorInfo: ErrorInfo) => void;
}

// ============================================================================
// PROPS EXTENSION FOR PROMPTCARD
// ============================================================================

/**
 * Additional props to be added to the PromptCard component.
 * Enables the complications system without breaking existing usage.
 */
export interface PromptCardComplicationProps {
  /** Complications to render in named slots */
  complications?: ComplicationSlots;
  /** Configuration for the slot manager */
  complicationConfig?: Partial<SlotManagerConfig>;
  /** Callback when a complication reports an error */
  onComplicationError?: (position: SlotPosition, error: Error) => void;
  /** Callback when complications are mounted/unmounted */
  onComplicationChange?: (activeSlots: SlotPosition[]) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a value is a valid slot position.
 */
export type SlotPositionGuard = (value: unknown) => value is SlotPosition;

/**
 * Helper type for conditional rendering based on card constraints.
 */
export type ConditionalRender<T> = (context: ComplicationContext) => T | null;

/**
 * Type for complication components that support lazy loading.
 */
export type LazyComplication = () => Promise<{
  default: ComponentType<ComplicationProps>;
}>;

/**
 * Registry entry for dynamic complication loading.
 */
export interface ComplicationRegistryEntry {
  id: string;
  name: string;
  description: string;
  component: ComponentType<ComplicationProps> | LazyComplication;
  supportedSlots: SlotPosition[];
  defaultSlot: SlotPosition;
  version: string;
  author?: string;
  documentation?: string;
}

// ============================================================================
// EXPORT GUARDS AND UTILITIES
// ============================================================================

/**
 * Runtime validation utilities (to be implemented in separate files).
 */
export interface ComplicationValidation {
  isValidSlotPosition: SlotPositionGuard;
  validateSlotConfig: (config: SlotConfig) => boolean;
  validateComplicationProps: (props: ComplicationProps) => boolean;
}
