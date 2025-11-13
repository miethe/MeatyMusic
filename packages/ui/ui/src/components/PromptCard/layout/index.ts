/**
 * PromptCard Layout System
 *
 * Zone-based layout system for managing component placement, space allocation,
 * and graceful degradation in the PromptCard component.
 *
 * @module PromptCard/layout
 */

// Component Manifest System
export type {
  ComponentManifest,
  ComponentDimensions,
  CardSize,
  CardState,
  ComponentPlacement,
  GracefulFallback,
} from './ComponentManifest';

export {
  ComponentRegistry,
  componentRegistry,
  DEFAULT_MANIFESTS,
} from './ComponentManifest';

// Layout Engine
export type {
  LayoutZone,
  LayoutConfiguration,
  LayoutResult,
} from './LayoutEngine';

export {
  LayoutEngine,
  layoutEngine,
} from './LayoutEngine';

// Layout Provider Components
export {
  LayoutProvider,
  ZoneRenderer,
  LayoutDebugOverlay,
  useLayout,
  useComponentVisibility,
  useZone,
  useComponentRegistry,
  withLayoutAwareness,
} from './LayoutProvider';

export type {
  LayoutContextValue,
  LayoutProviderProps,
  ZoneRendererProps,
} from './LayoutProvider';
