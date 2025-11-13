/**
 * PromptCard Layout Engine
 *
 * Handles dynamic layout calculation, space allocation, and component positioning
 * for the zone-based PromptCard system. Prevents overlaps and manages graceful degradation.
 *
 * @module PromptCard/layout/LayoutEngine
 */

import type {
  ComponentManifest,
  ComponentDimensions,
  CardSize,
  CardState,
  ComponentPlacement,
  componentRegistry
} from './ComponentManifest';

export interface LayoutZone {
  id: string;
  placement: ComponentPlacement;
  availableSpace: ComponentDimensions;
  usedSpace: ComponentDimensions;
  components: ComponentManifest[];
  overflow: ComponentManifest[];
  isVisible: boolean;
}

export interface LayoutConfiguration {
  cardSize: CardSize;
  cardState: CardState;
  cardDimensions: ComponentDimensions;
  hasDescription: boolean;
  hasComplications: {
    topLeft: boolean;
    topRight: boolean;
    bottomLeft: boolean;
    bottomRight: boolean;
    edgeLeft: boolean;
    edgeRight: boolean;
    footer: boolean;
  };
}

export interface LayoutResult {
  zones: Record<ComponentPlacement, LayoutZone>;
  complicationReservedSpace: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  cssCustomProperties: Record<string, string>;
  warnings: string[];
}

/**
 * Layout Engine for managing PromptCard zones and component positioning
 */
export class LayoutEngine {
  /**
   * Calculate optimal layout for given configuration
   */
  calculateLayout(
    config: LayoutConfiguration,
    activeComponents: ComponentManifest[]
  ): LayoutResult {
    const zones = this.initializeZones(config);
    const complicationSpace = this.calculateComplicationSpace(config);
    const warnings: string[] = [];

    // Allocate components to zones based on priority and constraints
    this.allocateComponents(zones, activeComponents, config, warnings);

    // Calculate CSS custom properties for dynamic spacing
    const cssProperties = this.generateCSSProperties(zones, complicationSpace, config);

    return {
      zones,
      complicationReservedSpace: complicationSpace,
      cssCustomProperties: cssProperties,
      warnings,
    };
  }

  /**
   * Initialize layout zones based on card configuration
   */
  private initializeZones(config: LayoutConfiguration): Record<ComponentPlacement, LayoutZone> {
    const cardWidth = config.cardDimensions.width;
    const cardHeight = config.cardDimensions.height;
    const padding = this.getCardPadding(config.cardSize);

    const contentWidth = cardWidth - (padding * 2);
    const complicationSpace = this.calculateComplicationSpace(config);

    return {
      core: {
        id: 'core',
        placement: 'core',
        availableSpace: {
          width: contentWidth - complicationSpace.right,
          height: cardHeight * 0.6, // 60% of card height for core content
        },
        usedSpace: { width: 0, height: 0 },
        components: [],
        overflow: [],
        isVisible: true,
      },
      meta: {
        id: 'meta',
        placement: 'meta',
        availableSpace: {
          width: Math.floor(contentWidth * 0.65), // 65% for primary meta content
          height: 32,
        },
        usedSpace: { width: 0, height: 0 },
        components: [],
        overflow: [],
        isVisible: true,
      },
      overflow: {
        id: 'overflow',
        placement: 'overflow',
        availableSpace: {
          width: Math.floor(contentWidth * 0.35), // 35% for overflow content
          height: 32,
        },
        usedSpace: { width: 0, height: 0 },
        components: [],
        overflow: [],
        isVisible: true,
      },
      extended: {
        id: 'extended',
        placement: 'extended',
        availableSpace: {
          width: contentWidth,
          height: config.cardSize === 'xl' ? 80 : 0,
        },
        usedSpace: { width: 0, height: 0 },
        components: [],
        overflow: [],
        isVisible: config.cardSize === 'xl',
      },
      complication: {
        id: 'complication',
        placement: 'complication',
        availableSpace: {
          width: this.getComplicationMaxSize(config.cardSize),
          height: this.getComplicationMaxSize(config.cardSize),
        },
        usedSpace: { width: 0, height: 0 },
        components: [],
        overflow: [],
        isVisible: true,
      },
    };
  }

  /**
   * Allocate components to zones based on priority and space constraints
   */
  private allocateComponents(
    zones: Record<ComponentPlacement, LayoutZone>,
    components: ComponentManifest[],
    config: LayoutConfiguration,
    warnings: string[]
  ): void {
    // Sort by priority (higher first)
    const sortedComponents = components.sort((a, b) => b.priority - a.priority);

    for (const component of sortedComponents) {
      const targetZone = zones[component.placement];

      if (!targetZone.isVisible) {
        // Try fallback placement
        if (component.fallbackPlacement && zones[component.fallbackPlacement].isVisible) {
          this.attemptAllocation(zones[component.fallbackPlacement], component, warnings);
        } else {
          warnings.push(`Component ${component.id} has no visible placement`);
        }
        continue;
      }

      // Check if component fits in target zone
      if (this.canFitInZone(targetZone, component)) {
        this.allocateToZone(targetZone, component);
      } else {
        // Apply graceful fallback
        this.handleFallback(zones, component, config, warnings);
      }
    }
  }

  /**
   * Check if component can fit in zone
   */
  private canFitInZone(zone: LayoutZone, component: ComponentManifest): boolean {
    const remainingWidth = zone.availableSpace.width - zone.usedSpace.width;
    const remainingHeight = zone.availableSpace.height - zone.usedSpace.height;

    return (
      component.requiredSpace.width <= remainingWidth &&
      component.requiredSpace.height <= remainingHeight
    );
  }

  /**
   * Allocate component to zone
   */
  private allocateToZone(zone: LayoutZone, component: ComponentManifest): void {
    zone.components.push(component);
    zone.usedSpace.width += component.requiredSpace.width;
    zone.usedSpace.height = Math.max(zone.usedSpace.height, component.requiredSpace.height);
  }

  /**
   * Attempt to allocate component with fallback logic
   */
  private attemptAllocation(
    zone: LayoutZone,
    component: ComponentManifest,
    warnings: string[]
  ): void {
    if (this.canFitInZone(zone, component)) {
      this.allocateToZone(zone, component);
    } else {
      zone.overflow.push(component);
      warnings.push(`Component ${component.id} overflowed in ${zone.id} zone`);
    }
  }

  /**
   * Handle component fallback behavior
   */
  private handleFallback(
    zones: Record<ComponentPlacement, LayoutZone>,
    component: ComponentManifest,
    config: LayoutConfiguration,
    warnings: string[]
  ): void {
    switch (component.gracefulFallback) {
      case 'hide':
        warnings.push(`Component ${component.id} hidden due to space constraints`);
        break;

      case 'truncate':
        // Reduce component width and try again
        const truncatedComponent = {
          ...component,
          requiredSpace: {
            ...component.requiredSpace,
            width: Math.min(component.requiredSpace.width, zones[component.placement].availableSpace.width - zones[component.placement].usedSpace.width),
          },
        };
        if (this.canFitInZone(zones[component.placement], truncatedComponent)) {
          this.allocateToZone(zones[component.placement], truncatedComponent);
          warnings.push(`Component ${component.id} truncated to fit`);
        } else {
          zones[component.placement].overflow.push(component);
        }
        break;

      case 'relocate':
        if (component.fallbackPlacement && zones[component.fallbackPlacement]) {
          this.attemptAllocation(zones[component.fallbackPlacement], component, warnings);
        } else {
          zones.overflow.overflow.push(component);
          warnings.push(`Component ${component.id} relocated to overflow`);
        }
        break;

      case 'collapse':
        // Reduce component height and try again
        const collapsedComponent = {
          ...component,
          requiredSpace: {
            ...component.requiredSpace,
            height: Math.min(component.requiredSpace.height, 20), // Minimum collapsed height
          },
        };
        if (this.canFitInZone(zones[component.placement], collapsedComponent)) {
          this.allocateToZone(zones[component.placement], collapsedComponent);
          warnings.push(`Component ${component.id} collapsed to fit`);
        } else {
          zones[component.placement].overflow.push(component);
        }
        break;

      default:
        zones[component.placement].overflow.push(component);
        warnings.push(`Component ${component.id} overflowed with unknown fallback`);
    }
  }

  /**
   * Calculate space reserved for complications
   */
  private calculateComplicationSpace(config: LayoutConfiguration): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const complicationSize = this.getComplicationMaxSize(config.cardSize);
    const { hasComplications } = config;

    return {
      top: (hasComplications.topLeft || hasComplications.topRight) ? complicationSize : 0,
      right: hasComplications.topRight ? complicationSize : 0,
      bottom: (hasComplications.bottomLeft || hasComplications.bottomRight || hasComplications.footer) ? complicationSize : 0,
      left: hasComplications.edgeLeft ? complicationSize : 0,
    };
  }

  /**
   * Generate CSS custom properties for dynamic spacing
   */
  private generateCSSProperties(
    zones: Record<ComponentPlacement, LayoutZone>,
    complicationSpace: { top: number; right: number; bottom: number; left: number },
    config: LayoutConfiguration
  ): Record<string, string> {
    return {
      '--complication-reserve-top': `${complicationSpace.top}px`,
      '--complication-reserve-right': `${complicationSpace.right}px`,
      '--complication-reserve-bottom': `${complicationSpace.bottom}px`,
      '--complication-reserve-left': `${complicationSpace.left}px`,
      '--description-display': config.hasDescription && config.cardSize !== 'compact' ? 'block' : 'none',
      '--overflow-indicator': zones.meta.overflow.length > 0 || zones.overflow.overflow.length > 0 ? '1' : '0',
      '--meta-zone-width': `${zones.meta.availableSpace.width}px`,
      '--overflow-zone-width': `${zones.overflow.availableSpace.width}px`,
      '--extended-zone-height': `${zones.extended.availableSpace.height}px`,
    };
  }

  /**
   * Get card padding based on size
   */
  private getCardPadding(cardSize: CardSize): number {
    switch (cardSize) {
      case 'compact':
        return 12; // var(--mp-spacing-3)
      case 'standard':
        return 16; // var(--mp-spacing-4)
      case 'xl':
        return 16; // var(--mp-spacing-4)
      default:
        return 16;
    }
  }

  /**
   * Get maximum complication size for card size
   */
  private getComplicationMaxSize(cardSize: CardSize): number {
    switch (cardSize) {
      case 'compact':
        return 32; // var(--mp-spacing-8)
      case 'standard':
        return 48; // var(--mp-spacing-12)
      case 'xl':
        return 64; // var(--mp-spacing-16)
      default:
        return 48;
    }
  }

  /**
   * Recalculate layout when data changes
   */
  recalculateLayout(
    previousResult: LayoutResult,
    newConfig: LayoutConfiguration,
    newComponents: ComponentManifest[]
  ): LayoutResult {
    // Check if recalculation is needed
    if (this.shouldRecalculate(previousResult, newConfig, newComponents)) {
      return this.calculateLayout(newConfig, newComponents);
    }

    return previousResult;
  }

  /**
   * Determine if layout recalculation is needed
   */
  private shouldRecalculate(
    previousResult: LayoutResult,
    newConfig: LayoutConfiguration,
    newComponents: ComponentManifest[]
  ): boolean {
    // Always recalculate for now - could be optimized with change detection
    return true;
  }
}

/**
 * Global layout engine instance
 */
export const layoutEngine = new LayoutEngine();
