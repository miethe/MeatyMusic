import * as React from 'react';
import { cn } from '../../../lib/utils';
import type { ComplicationProps } from '../../../complications/types';
import styles from './CollectionAccent.module.css';

/**
 * Collection color options that map to design tokens
 */
export type CollectionColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'purple'
  | 'green'
  | 'orange'
  | 'blue'
  | 'red';

/**
 * Collection data interface
 */
export interface Collection {
  id: string;
  name: string;
  color?: CollectionColor;
}

/**
 * Props for the CollectionAccent complication
 */
export interface CollectionAccentProps extends ComplicationProps {
  /**
   * Collection data. If array, uses the first (primary) collection.
   */
  collection?: Collection | Collection[];
  /**
   * Position of the accent bar - left for LTR, right for RTL
   * @default 'left'
   */
  position?: 'left' | 'right';
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Accessibility label override
   */
  'aria-label'?: string;
}

/**
 * Gets the primary collection from a collection or array of collections
 */
function getPrimaryCollection(collection?: Collection | Collection[]): Collection | null {
  if (!collection) return null;

  // If it's an array, return the first collection (primary)
  if (Array.isArray(collection)) {
    return collection.length > 0 ? collection[0] : null;
  }

  // Single collection
  return collection;
}

/**
 * Maps collection color to CSS custom property
 */
function getCollectionColorVar(color: CollectionColor): string {
  return `var(--mp-color-collection-${color})`;
}

/**
 * Collection Edge Accent Complication
 *
 * Renders a colored vertical bar on the edge of the prompt card to indicate
 * which collection the prompt belongs to. The accent uses the collection's
 * designated color from the design token system.
 *
 * Features:
 * - 4px wide vertical accent bar
 * - Uses collection color tokens from design system
 * - Supports RTL layouts with position prop
 * - Gracefully handles null/undefined collections
 * - Accessible with proper ARIA labels
 * - Respects prefers-reduced-motion
 * - Maintains WCAG AA contrast ratios
 */
export function CollectionAccent({
  collection,
  position = 'left',
  cardSize,
  slot,
  isVisible,
  className,
  'aria-label': ariaLabel,
  ...complicationProps
}: CollectionAccentProps) {
  // Don't render if not visible or no collection
  if (!isVisible) return null;

  const primaryCollection = getPrimaryCollection(collection);
  if (!primaryCollection) return null;

  // Use primary brand color as fallback for invalid/undefined colors
  const collectionColor = primaryCollection.color || 'primary';

  // Create CSS custom properties for the accent
  const accentStyle = {
    '--collection-accent-color': getCollectionColorVar(collectionColor),
  } as React.CSSProperties;

  const accentClasses = cn(
    styles.accent,
    styles[`accent--${position}`],
    styles[`accent--${cardSize}`],
    className
  );

  return (
    <div
      className={accentClasses}
      style={accentStyle}
      aria-hidden="true"
      data-testid={`collection-accent-${primaryCollection.id}`}
      data-slot={slot}
      data-collection-id={primaryCollection.id}
      data-collection-color={collectionColor}
      role="presentation"
      title={
        ariaLabel ||
        `Collection: ${primaryCollection.name}`
      }
    />
  );
}

CollectionAccent.displayName = 'CollectionAccent';
