/**
 * PromptCard Component Manifest System
 *
 * Provides a registration system for components that can be dynamically
 * added to the PromptCard with automatic layout management and priority resolution.
 *
 * @module PromptCard/layout/ComponentManifest
 */

export type CardSize = 'compact' | 'standard' | 'xl';

export type CardState = 'default' | 'running' | 'error' | 'disabled' | 'selected';

export type ComponentPlacement =
  | 'core'         // Always visible in main content flow
  | 'meta'         // Metadata area (tags, model info)
  | 'overflow'     // Hidden when space is constrained
  | 'complication' // Absolute positioned (existing system)
  | 'extended';    // XL variant only

export type GracefulFallback =
  | 'hide'         // Component disappears completely
  | 'truncate'     // Component content is truncated
  | 'collapse'     // Component size reduces
  | 'relocate';    // Component moves to overflow area

export interface ComponentDimensions {
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ComponentManifest {
  /** Unique identifier for the component */
  id: string;

  /** Display name for debugging */
  displayName: string;

  /** Priority level (1-100, higher = more important) */
  priority: number;

  /** Where this component should be placed in the layout */
  placement: ComponentPlacement;

  /** Required space for the component */
  requiredSpace: ComponentDimensions;

  /** Card sizes this component supports */
  supportedSizes: CardSize[];

  /** Card states this component supports */
  supportedStates?: CardState[];

  /** What to do when space is limited */
  gracefulFallback: GracefulFallback;

  /** Alternative placement if primary placement fails */
  fallbackPlacement?: ComponentPlacement;

  /** Dependencies on other components */
  dependencies?: string[];

  /** Conflicts with other components */
  conflicts?: string[];

  /** Performance configuration */
  performance?: {
    memoize?: boolean;
    lazy?: boolean;
    priority?: number;
  };

  /** Accessibility information */
  accessibility?: {
    role?: string;
    label?: string;
    description?: string;
    hidden?: boolean;
  };
}

/**
 * Registry for managing component manifests
 */
export class ComponentRegistry {
  private manifests = new Map<string, ComponentManifest>();
  private resolutionCache = new Map<string, ComponentManifest[]>();

  /**
   * Register a component with the registry
   */
  register(manifest: ComponentManifest): void {
    this.manifests.set(manifest.id, manifest);
    this.clearCache();
  }

  /**
   * Unregister a component
   */
  unregister(id: string): boolean {
    const result = this.manifests.delete(id);
    if (result) {
      this.clearCache();
    }
    return result;
  }

  /**
   * Get a component manifest by ID
   */
  get(id: string): ComponentManifest | undefined {
    return this.manifests.get(id);
  }

  /**
   * Get all registered manifests
   */
  getAll(): ComponentManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Resolve components for a specific card context
   */
  resolveForContext(
    cardSize: CardSize,
    cardState: CardState,
    availableSpace: ComponentDimensions,
    placement?: ComponentPlacement
  ): ComponentManifest[] {
    const cacheKey = `${cardSize}-${cardState}-${availableSpace.width}x${availableSpace.height}-${placement || 'all'}`;

    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey)!;
    }

    let candidates = Array.from(this.manifests.values());

    // Filter by placement if specified
    if (placement) {
      candidates = candidates.filter(m => m.placement === placement);
    }

    // Filter by card size support
    candidates = candidates.filter(m => m.supportedSizes.includes(cardSize));

    // Filter by card state support
    candidates = candidates.filter(m =>
      !m.supportedStates || m.supportedStates.includes(cardState)
    );

    // Sort by priority (higher priority first)
    candidates.sort((a, b) => b.priority - a.priority);

    // Apply space constraints and resolve conflicts
    const resolved = this.resolveSpaceAndConflicts(candidates, availableSpace);

    this.resolutionCache.set(cacheKey, resolved);
    return resolved;
  }

  /**
   * Resolve space constraints and component conflicts
   */
  private resolveSpaceAndConflicts(
    candidates: ComponentManifest[],
    availableSpace: ComponentDimensions
  ): ComponentManifest[] {
    const resolved: ComponentManifest[] = [];
    const usedSpace = { width: 0, height: 0 };
    const activeIds = new Set<string>();

    for (const manifest of candidates) {
      // Check dependencies
      if (manifest.dependencies) {
        const hasAllDependencies = manifest.dependencies.every(dep => activeIds.has(dep));
        if (!hasAllDependencies) {
          continue;
        }
      }

      // Check conflicts
      if (manifest.conflicts) {
        const hasConflicts = manifest.conflicts.some(conflict => activeIds.has(conflict));
        if (hasConflicts) {
          continue;
        }
      }

      // Check space constraints
      const requiredWidth = usedSpace.width + manifest.requiredSpace.width;
      const requiredHeight = Math.max(usedSpace.height, manifest.requiredSpace.height);

      if (requiredWidth <= availableSpace.width && requiredHeight <= availableSpace.height) {
        resolved.push(manifest);
        usedSpace.width = requiredWidth;
        usedSpace.height = requiredHeight;
        activeIds.add(manifest.id);
      } else {
        // Try fallback behavior
        if (manifest.gracefulFallback === 'relocate' && manifest.fallbackPlacement) {
          // Could implement relocation logic here
          continue;
        }
        // For now, skip components that don't fit
      }
    }

    return resolved;
  }

  /**
   * Clear the resolution cache
   */
  private clearCache(): void {
    this.resolutionCache.clear();
  }

  /**
   * Get available space for a specific placement
   */
  getAvailableSpace(
    cardSize: CardSize,
    placement: ComponentPlacement,
    complications?: { topRight?: boolean; topLeft?: boolean }
  ): ComponentDimensions {
    const baseDimensions = this.getBaseDimensions(cardSize);

    switch (placement) {
      case 'core':
        return {
          width: baseDimensions.width - (complications?.topRight ? 48 : 0),
          height: baseDimensions.height,
        };

      case 'meta':
        return {
          width: Math.floor(baseDimensions.width * 0.65), // 65% for meta content
          height: 32,
        };

      case 'overflow':
        return {
          width: Math.floor(baseDimensions.width * 0.35), // 35% for overflow
          height: 32,
        };

      case 'extended':
        return cardSize === 'xl' ? baseDimensions : { width: 0, height: 0 };

      case 'complication':
        return {
          width: 48,
          height: 48,
        };

      default:
        return baseDimensions;
    }
  }

  /**
   * Get base dimensions for card size
   */
  private getBaseDimensions(cardSize: CardSize): ComponentDimensions {
    switch (cardSize) {
      case 'compact':
        return { width: 288, height: 220 };
      case 'standard':
        return { width: 420, height: 280 };
      case 'xl':
        return { width: 560, height: 320 };
      default:
        return { width: 420, height: 280 };
    }
  }
}

/**
 * Default component manifests for core PromptCard elements
 */
export const DEFAULT_MANIFESTS: ComponentManifest[] = [
  {
    id: 'title',
    displayName: 'Card Title',
    priority: 100, // Highest priority
    placement: 'core',
    requiredSpace: { width: 200, height: 24 },
    supportedSizes: ['compact', 'standard', 'xl'],
    gracefulFallback: 'truncate',
    accessibility: {
      role: 'heading',
      label: 'Prompt card title',
    },
  },
  {
    id: 'version-badge',
    displayName: 'Version Badge',
    priority: 80,
    placement: 'meta',
    requiredSpace: { width: 40, height: 24 },
    supportedSizes: ['compact', 'standard', 'xl'],
    gracefulFallback: 'hide',
    conflicts: ['permission-badge'], // Don't show both at same time in small spaces
    accessibility: {
      label: 'Prompt version',
    },
  },
  {
    id: 'permission-badge',
    displayName: 'Permission Badge',
    priority: 90,
    placement: 'meta',
    requiredSpace: { width: 60, height: 24 },
    supportedSizes: ['standard', 'xl'], // Hide in compact
    gracefulFallback: 'relocate',
    fallbackPlacement: 'overflow',
    accessibility: {
      label: 'Access permissions',
    },
  },
  {
    id: 'last-run',
    displayName: 'Last Run Time',
    priority: 60,
    placement: 'meta',
    requiredSpace: { width: 80, height: 16 },
    supportedSizes: ['standard', 'xl'],
    gracefulFallback: 'hide',
    dependencies: ['title'],
    accessibility: {
      label: 'Last execution time',
    },
  },
  {
    id: 'description',
    displayName: 'Description',
    priority: 70,
    placement: 'core',
    requiredSpace: { width: 300, height: 40 },
    supportedSizes: ['standard', 'xl'],
    gracefulFallback: 'truncate',
    accessibility: {
      role: 'text',
      label: 'Prompt description',
    },
  },
  {
    id: 'tags',
    displayName: 'Tags',
    priority: 50,
    placement: 'meta',
    requiredSpace: { width: 150, height: 24 },
    supportedSizes: ['compact', 'standard', 'xl'],
    gracefulFallback: 'truncate',
    accessibility: {
      label: 'Tags',
    },
  },
  {
    id: 'model-info',
    displayName: 'Model Information',
    priority: 40,
    placement: 'meta',
    requiredSpace: { width: 100, height: 24 },
    supportedSizes: ['standard', 'xl'],
    gracefulFallback: 'hide',
    accessibility: {
      label: 'AI model information',
    },
  },
  {
    id: 'extended-stats',
    displayName: 'Extended Statistics',
    priority: 30,
    placement: 'extended',
    requiredSpace: { width: 400, height: 60 },
    supportedSizes: ['xl'],
    gracefulFallback: 'hide',
    accessibility: {
      label: 'Extended performance statistics',
    },
  },
];

/**
 * Global component registry instance
 */
export const componentRegistry = new ComponentRegistry();

// Register default manifests
DEFAULT_MANIFESTS.forEach(manifest => {
  componentRegistry.register(manifest);
});
