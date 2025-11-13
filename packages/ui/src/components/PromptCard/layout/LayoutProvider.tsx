"use client";

/**
 * PromptCard Layout Provider
 *
 * React component that manages the zone-based layout system and provides
 * layout context to child components. Handles dynamic space allocation
 * and component positioning.
 *
 * @module PromptCard/layout/LayoutProvider
 */

import React, { createContext, useContext, useMemo, useEffect, useRef } from 'react';
import type {
  ComponentManifest,
  ComponentDimensions,
  CardSize,
  CardState,
} from './ComponentManifest';
import { componentRegistry } from './ComponentManifest';
import type {
  LayoutConfiguration,
  LayoutResult,
  LayoutZone,
} from './LayoutEngine';
import { layoutEngine } from './LayoutEngine';

export interface LayoutContextValue {
  /** Current layout result */
  layout: LayoutResult;

  /** Register a component dynamically */
  registerComponent: (manifest: ComponentManifest) => void;

  /** Unregister a component */
  unregisterComponent: (id: string) => void;

  /** Get zone information */
  getZone: (placement: ComponentManifest['placement']) => LayoutZone | undefined;

  /** Check if a component should be visible */
  isComponentVisible: (componentId: string) => boolean;

  /** Get CSS custom properties for styling */
  getCSSProperties: () => Record<string, string>;

  /** Layout warnings for debugging */
  warnings: string[];
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export interface LayoutProviderProps {
  /** Card size variant */
  cardSize: CardSize;

  /** Card state */
  cardState: CardState;

  /** Card dimensions */
  cardDimensions: ComponentDimensions;

  /** Whether description is present */
  hasDescription: boolean;

  /** Active complications */
  hasComplications: LayoutConfiguration['hasComplications'];

  /** Children components */
  children: React.ReactNode;

  /** Debug mode for development */
  debug?: boolean;
}

/**
 * Layout Provider component that manages zone-based layout
 */
export function LayoutProvider({
  cardSize,
  cardState,
  cardDimensions,
  hasDescription,
  hasComplications,
  children,
  debug = false,
}: LayoutProviderProps) {
  const layoutEngineRef = useRef(layoutEngine);
  const registryRef = useRef(componentRegistry);
  const [layoutGeneration, setLayoutGeneration] = React.useState(0);

  // Create layout configuration
  const layoutConfig: LayoutConfiguration = useMemo(() => ({
    cardSize,
    cardState,
    cardDimensions,
    hasDescription,
    hasComplications,
  }), [cardSize, cardState, cardDimensions, hasDescription, hasComplications]);

  // Get active components from registry
  const activeComponents = useMemo(() => {
    return registryRef.current.resolveForContext(
      cardSize,
      cardState,
      cardDimensions
    );
  }, [cardSize, cardState, cardDimensions, layoutGeneration]);

  // Calculate layout
  const layout = useMemo(() => {
    return layoutEngineRef.current.calculateLayout(layoutConfig, activeComponents);
  }, [layoutConfig, activeComponents]);

  // Apply CSS custom properties to the DOM
  useEffect(() => {
    const element = document.documentElement;
    const properties = layout.cssCustomProperties;

    Object.entries(properties).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });

    return () => {
      // Cleanup on unmount
      Object.keys(properties).forEach(property => {
        element.style.removeProperty(property);
      });
    };
  }, [layout.cssCustomProperties]);

  // Log warnings in debug mode
  useEffect(() => {
    if (debug && layout.warnings.length > 0) {
      console.warn('PromptCard Layout Warnings:', layout.warnings);
    }
  }, [debug, layout.warnings]);

  // Context value
  const contextValue: LayoutContextValue = useMemo(() => ({
    layout,

    registerComponent: (manifest: ComponentManifest) => {
      registryRef.current.register(manifest);
      setLayoutGeneration(prev => prev + 1);
    },

    unregisterComponent: (id: string) => {
      registryRef.current.unregister(id);
      setLayoutGeneration(prev => prev + 1);
    },

    getZone: (placement) => layout.zones[placement],

    isComponentVisible: (componentId: string) => {
      return Object.values(layout.zones).some(zone =>
        zone.components.some(component => component.id === componentId)
      );
    },

    getCSSProperties: () => layout.cssCustomProperties,

    warnings: layout.warnings,
  }), [layout]);

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * Hook to access layout context
 */
export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Hook to check if a component should render
 */
export function useComponentVisibility(
  componentId: string,
  fallbackVisible: boolean = true
): boolean {
  const layout = useLayout();

  return useMemo(() => {
    return layout.isComponentVisible(componentId);
  }, [layout, componentId]);
}

/**
 * Hook to get zone information for a specific placement
 */
export function useZone(placement: ComponentManifest['placement']): LayoutZone | undefined {
  const layout = useLayout();

  return useMemo(() => {
    return layout.getZone(placement);
  }, [layout, placement]);
}

/**
 * Hook to register/unregister components dynamically
 */
export function useComponentRegistry() {
  const layout = useLayout();

  return useMemo(() => ({
    register: layout.registerComponent,
    unregister: layout.unregisterComponent,
  }), [layout]);
}

/**
 * Higher-order component to wrap components with layout awareness
 */
export function withLayoutAwareness<P extends object>(
  Component: React.ComponentType<P>,
  manifest: ComponentManifest
) {
  const LayoutAwareComponent = React.forwardRef<any, P>((props, ref) => {
    const { register, unregister } = useComponentRegistry();
    const isVisible = useComponentVisibility(manifest.id);

    // Register component on mount
    useEffect(() => {
      register(manifest);
      return () => unregister(manifest.id);
    }, [register, unregister]);

    // Don't render if not visible
    if (!isVisible) {
      return null;
    }

    return <Component {...(props as P)} ref={ref} />;
  });

  LayoutAwareComponent.displayName = `withLayoutAwareness(${Component.displayName || Component.name})`;

  return LayoutAwareComponent;
}

/**
 * Component for rendering zone content with proper styling
 */
export interface ZoneRendererProps {
  placement: ComponentManifest['placement'];
  className?: string;
  children: React.ReactNode;
}

export function ZoneRenderer({ placement, className, children }: ZoneRendererProps) {
  const zone = useZone(placement);

  if (!zone?.isVisible) {
    return null;
  }

  const zoneClassName = [
    'layout-zone',
    `layout-zone-${placement}`,
    zone.overflow.length > 0 ? 'has-overflow' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={zoneClassName}
      data-zone={placement}
      data-components={zone.components.length}
      data-overflow={zone.overflow.length}
      style={{
        '--zone-width': `${zone.availableSpace.width}px`,
        '--zone-height': `${zone.availableSpace.height}px`,
        '--used-width': `${zone.usedSpace.width}px`,
        '--used-height': `${zone.usedSpace.height}px`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Debug component for visualizing layout zones
 */
export function LayoutDebugOverlay() {
  const { layout, warnings } = useLayout();

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Only show in development
  } else {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        border: '2px dashed red',
        fontSize: '10px',
        fontFamily: 'monospace',
        color: 'red',
        background: 'rgba(255, 0, 0, 0.05)',
      }}
    >
      <div style={{ position: 'absolute', top: 2, left: 2 }}>
        Layout Debug:
        {Object.entries(layout.zones).map(([placement, zone]) => (
          <div key={placement}>
            {placement}: {zone.components.length} components
            {zone.overflow.length > 0 && ` (${zone.overflow.length} overflow)`}
          </div>
        ))}
        {warnings.length > 0 && (
          <div style={{ color: 'orange' }}>
            Warnings: {warnings.length}
          </div>
        )}
      </div>
    </div>
  );
}
