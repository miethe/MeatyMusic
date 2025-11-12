'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Checkbox } from '../Checkbox';
import styles from '../PromptCard/PromptCard.module.css';
import { Header, MetaStrip, Stats, Actions, ErrorBanner } from './sections';
import { AccessBadge } from './components';
import { useContextCardState } from './hooks/useContextCardState';

const contextCardVariants = cva(styles.card, {
  variants: {
    size: {
      compact: styles.compact,
      standard: styles.standard,
      xl: styles.xl,
    },
    state: {
      default: '',
      error: styles.error,
      disabled: styles.disabled,
      selected: styles.selected,
    },
  },
  defaultVariants: {
    size: 'standard',
    state: 'default',
  },
});

export interface Context {
  context_id: string;
  title: string;
  description?: string;
  owner_id: string;
  access_control: 'private' | 'shared' | 'public';
  current_version: {
    version: number;
    body: string;
    tags: string[];
    source_type?: 'manual' | 'url' | 'file' | 'api';
    source_ref?: string;
    created_at: string;
  };
  version_count: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContextCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contextCardVariants> {
  /** Context data object */
  context: Context;

  /** Card size variant */
  size?: 'compact' | 'standard' | 'xl';

  /** Card state */
  state?: 'default' | 'selected' | 'disabled' | 'error';

  /** Selection mode */
  selectable?: boolean;
  selected?: boolean;
  hasActiveSelection?: boolean;
  onSelectionChange?: (selected: boolean, event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => void;

  /** Click handlers */
  onClick?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onMenuAction?: (action: 'view-history' | 'view-usage' | 'export' | 'delete') => void;

  /** Badge click handlers */
  onTagClick?: (tag: string, event: React.MouseEvent) => void;
  onVersionClick?: (version: number, event: React.MouseEvent) => void;
  onUsageClick?: () => void;

  /** Error state */
  error?: string | { message: string; retry?: () => void };

  /** Accessibility */
  'aria-label'?: string;
  'aria-describedby'?: string;

  /** Debug mode */
  debug?: boolean;
}

const ContextCardInner = React.forwardRef<HTMLDivElement, ContextCardProps>(
  ({
    className,
    size,
    state,
    context,
    selectable,
    selected,
    hasActiveSelection,
    onSelectionChange,
    onClick,
    onEdit,
    onDuplicate,
    onMenuAction,
    onTagClick,
    onVersionClick,
    onUsageClick,
    error,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    debug,
    ...props
  }, ref) => {
    const { cardId, currentCardState, liveRegionMessage } = useContextCardState({
      title: context.title,
      state,
      disabled: state === 'disabled',
      error,
    });

    const isCompact = size === 'compact';
    const isXL = size === 'xl';
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const handleFocus = React.useCallback(() => setIsFocused(true), []);
    const handleBlur = React.useCallback(() => setIsFocused(false), []);
    const handleMouseEnter = React.useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = React.useCallback(() => setIsHovered(false), []);

    // Checkbox visibility logic
    const showCheckbox = selectable && (isHovered || selected || hasActiveSelection);

    // Handle checkbox change
    const handleCheckboxChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (onSelectionChange && state !== 'disabled') {
        onSelectionChange(event.target.checked, event);
      }
    }, [onSelectionChange, state]);

    // Handle checkbox click to stop propagation
    const handleCheckboxClick = React.useCallback((event: React.MouseEvent) => {
      event.stopPropagation();
    }, []);

    const handleCardClick = React.useCallback((event: React.MouseEvent) => {
      // Don't trigger card click if user clicked on a button or other interactive element
      const target = event.target as HTMLElement;

      // Check if the clicked element is itself a button/anchor
      if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) {
        return;
      }

      // Check if the clicked element is inside a button, anchor, or clickable section
      const clickableAncestor = target.closest('button, a, [data-clickable-section]');
      if (clickableAncestor) {
        return;
      }

      // Use onClick prop if provided
      if (onClick && state !== 'disabled') {
        onClick();
      }
    }, [onClick, state]);

    return (
      <>
        <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
          {liveRegionMessage}
        </div>
        <Card
          ref={ref}
          className={cn(contextCardVariants({ size, state: selected ? 'selected' : currentCardState }), className)}
          tabIndex={state === 'disabled' || !onClick ? -1 : 0}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleCardClick}
          aria-label={
            ariaLabel || `${context.title} context card${selected ? ', selected' : ''}${currentCardState !== 'default' ? `, ${currentCardState}` : ''}, version ${context.current_version.version}, ${context.access_control} access, used in ${context.usage_count} ${context.usage_count === 1 ? 'prompt' : 'prompts'}`
          }
          aria-describedby={ariaDescribedBy}
          aria-disabled={state === 'disabled'}
          role={onClick ? "button" : undefined}
          data-state={selected ? 'selected' : currentCardState}
          data-card-id={cardId}
          data-selected={selected}
          {...props}
        >
          {/* Selection checkbox */}
          {selectable && (
            <div
              className={cn(
                styles.checkboxContainer,
                showCheckbox && styles.checkboxVisible
              )}
              onClick={handleCheckboxClick}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => {
                  const syntheticEvent = {
                    target: { checked: checked === true },
                    stopPropagation: () => {},
                  } as React.ChangeEvent<HTMLInputElement>;
                  handleCheckboxChange(syntheticEvent);
                }}
                disabled={state === 'disabled'}
                aria-label={`Select ${context.title}`}
                className={styles.checkbox}
              />
            </div>
          )}

          {/* Header Zone */}
          <div className={styles.headerZone}>
            <div className={styles.headerContent}>
              <div className={styles.titleContainer}>
                <Header
                  title={context.title}
                  version={context.current_version.version}
                  createdAt={new Date(context.created_at)}
                  updatedAt={new Date(context.updated_at)}
                  isCompact={isCompact}
                  onVersionClick={onVersionClick}
                />
              </div>
              <div className={styles.metadataContainer}>
                <AccessBadge access={context.access_control} />
              </div>
            </div>
          </div>

          {/* Description Zone */}
          {context.description && !isCompact && (
            <div className={`${styles.descriptionZone} ${styles.adaptiveZone} hasContent`}>
              <div className="px-3 pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {context.description}
                </p>
              </div>
            </div>
          )}

          {/* Meta Strip Zone */}
          <div className={styles.metaStrip}>
            <MetaStrip
              tags={context.current_version.tags}
              sourceType={context.current_version.source_type}
              sourceRef={context.current_version.source_ref}
              isCompact={isCompact}
              size={size || 'standard'}
              onTagClick={onTagClick}
            />
          </div>

          {/* Scrollable body area */}
          <div className={styles.bodyArea}>
            {/* Stats Zone */}
            {!isCompact && (
              <Stats
                usageCount={context.usage_count}
                onUsageClick={onUsageClick || (() => onMenuAction?.('view-usage'))}
              />
            )}
          </div>

          {/* Actions Zone */}
          <div className={styles.actionsRow}>
            <Actions
              isCompact={isCompact}
              isXL={isXL}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onMenuAction={onMenuAction}
            />
          </div>

          {/* Error Banner (if any) */}
          {error && <ErrorBanner error={error} />}
        </Card>
      </>
    );
  }
);

ContextCardInner.displayName = 'ContextCardInner';

export const ContextCard = React.forwardRef<HTMLDivElement, ContextCardProps>((props, ref) => (
  <ContextCardInner {...props} ref={ref} />
));

ContextCard.displayName = 'ContextCard';

export { contextCardVariants };
