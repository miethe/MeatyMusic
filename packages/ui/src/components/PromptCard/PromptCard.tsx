import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Checkbox } from '../Checkbox';
import { PromptCardErrorBoundary } from './PromptCardErrorBoundary';
import { ComplicationProvider, ComplicationSlotsComponent } from '../../complications/index';
import type { PromptCardComplicationProps } from '../../complications/index';
import styles from './PromptCard.module.css';
import { Header, Body, Stats, Actions, ErrorBanner, MetaStrip, BodyPreview } from './sections';
import { BindingsRow } from './sections/BindingsRow';
import type { Binding } from './sections/BindingsRow';
import { usePromptCardState } from './hooks/usePromptCardState';
import { usePromptCardShortcuts } from './hooks/usePromptCardShortcuts';
import type { BlockChipsRowProps, ProvenanceRowProps, ExtendedStatsRowProps } from './components';
import { LayoutProvider, ZoneRenderer, LayoutDebugOverlay } from './layout/LayoutProvider';
import type { ComponentDimensions } from './layout/ComponentManifest';

const promptCardVariants = cva(styles.card, {
  variants: {
    size: {
      compact: styles.compact,
      standard: styles.standard,
      xl: styles.xl,
    },
    state: {
      default: '',
      running: styles.running,
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

/**
 * Get card dimensions based on size variant
 */
function getCardDimensions(size: 'compact' | 'standard' | 'xl'): ComponentDimensions {
  switch (size) {
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

export interface PromptCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof promptCardVariants>,
    PromptCardComplicationProps {
  /** Show layout debug overlay (dev only) */
  debug?: boolean;
  title: string;
  description?: string;
  version?: number;
  access?: 'private' | 'public' | 'shared';
  /** Prompt type for classification (user, system, tool, eval, agent_instruction) */
  promptType?: 'user' | 'system' | 'tool' | 'eval' | 'agent_instruction';
  tags?: string[];
  /** Single model name (legacy, for backward compatibility) */
  model?: string;
  /** Multiple model names (preferred) - takes precedence over single model */
  models?: string[];
  /** Primary provider for this prompt (computed from target_models) */
  primaryProvider?: string | null;
  lastRun?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  bodyPreview?: string;
  metrics?: {
    runs?: number;
    successRate?: number;
    avgCost?: number;
    avgTime?: number;
  };
  onRun?: () => void;
  onEdit?: () => void;
  onFork?: () => void;
  onMenuAction?: (action: string) => void;
  onPrimaryAction?: () => void;
  isRunning?: boolean;
  error?: string | { message: string; retry?: () => void };
  /** Execution state for displaying status badges */
  executionState?: {
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
    progress?: number;
    error?: string;
  };
  blockChips?: BlockChipsRowProps['chips'];
  provenance?: ProvenanceRowProps;
  extendedStats?: ExtendedStatsRowProps;
  /** Bindings attached to this prompt */
  bindings?: Binding[];
  onCompare?: () => void;
  onAnalytics?: () => void;
  onHistory?: () => void;
  onStateChange?: (state: {
    from?: string;
    to: string;
    timestamp: Date;
    reason?: string;
  }) => void;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Enable checkbox selection mode */
  selectable?: boolean;
  /** Whether this card is currently selected */
  selected?: boolean;
  /** Whether any card in the set has an active selection (shows all checkboxes) */
  hasActiveSelection?: boolean;
  /** Callback when selection state changes */
  onSelectionChange?: (selected: boolean, event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => void;
  /** Callback when the card body is clicked (excluding interactive elements) */
  onCardClick?: () => void;
  /** Callback when a tag badge is clicked */
  onTagClick?: (tag: string, event: React.MouseEvent) => void;
  /** Callback when the model badge is clicked */
  onModelClick?: (model: string, event: React.MouseEvent) => void;
  /** Callback when the version badge is clicked */
  onVersionClick?: (version: number, event: React.MouseEvent) => void;
}

const PromptCardInner = React.forwardRef<HTMLDivElement, PromptCardProps>(
  ({
    className,
    size,
    state,
    title,
    description,
    version = 1,
    access = 'private',
    promptType,
    tags = [],
    model,
    models,
    primaryProvider,
    lastRun,
    createdAt,
    updatedAt,
    bodyPreview,
    metrics,
    onRun,
    onEdit,
    onFork,
    onMenuAction,
    onPrimaryAction,
    isRunning,
    error,
    executionState,
    blockChips,
    provenance,
    extendedStats,
    bindings,
    onCompare,
    onAnalytics,
    onHistory,
    onStateChange,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    complications,
    complicationConfig,
    onComplicationError,
    onComplicationChange,
    selectable,
    selected,
    hasActiveSelection,
    onSelectionChange,
    onCardClick,
    onTagClick,
    onModelClick,
    onVersionClick,
    ...props
  }, ref) => {
    const { cardId, currentCardState, liveRegionMessage } = usePromptCardState({
      title,
      state,
      disabled,
      isRunning,
      error,
      onStateChange,
    });

    const { onKeyDown } = usePromptCardShortcuts({
      onRun,
      onEdit,
      onFork,
      onPrimaryAction,
      disabled,
      isRunning,
      currentState: currentCardState,
    });

    const isCompact = size === 'compact';
    const isXL = size === 'xl';
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState<boolean>(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
      }
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    React.useEffect(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }

      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }, []);
    const handleFocus = React.useCallback(() => setIsFocused(true), []);
    const handleBlur = React.useCallback(() => setIsFocused(false), []);
    const handleMouseEnter = React.useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = React.useCallback(() => setIsHovered(false), []);

    // Checkbox visibility logic
    const showCheckbox = selectable && (isHovered || selected || hasActiveSelection);

    // Handle checkbox change
    const handleCheckboxChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (onSelectionChange && !disabled) {
        onSelectionChange(event.target.checked, event);
      }
    }, [onSelectionChange, disabled]);

    // Handle checkbox click to stop propagation
    const handleCheckboxClick = React.useCallback((event: React.MouseEvent) => {
      event.stopPropagation();
    }, []);

    const handleCardClick = React.useCallback((event: React.MouseEvent) => {
      // Don't trigger card click if user clicked on a button or other interactive element
      // or if they clicked on a clickable section (like badges)
      const target = event.target as HTMLElement;

      // Check if the clicked element is itself a button/anchor
      if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) {
        return;
      }

      // Check if the clicked element is inside a button, anchor, or clickable section
      // but NOT inside the card itself (which also has role="button")
      const clickableAncestor = target.closest('button, a, [data-clickable-section]');
      if (clickableAncestor) {
        return;
      }

      // Use new onCardClick prop if provided, otherwise fall back to onPrimaryAction
      const clickHandler = onCardClick || onPrimaryAction;
      if (clickHandler && !disabled && !isRunning) {
        clickHandler();
      }
    }, [onCardClick, onPrimaryAction, disabled, isRunning]);

    return (
      <>
        <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
          {liveRegionMessage}
        </div>
        <ComplicationProvider
          cardId={cardId}
          cardState={currentCardState}
          cardSize={size || 'standard'}
          cardTitle={title}
          isFocused={isFocused}
          complications={complications}
          config={complicationConfig}
          onComplicationError={onComplicationError}
          onComplicationChange={onComplicationChange}
        >
          <Card
            ref={ref}
            className={cn(promptCardVariants({ size, state: selected ? 'selected' : currentCardState }), className)}
            tabIndex={disabled || !(onPrimaryAction || onCardClick) ? -1 : 0}
            onKeyDown={onKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
            aria-label={
              ariaLabel || `${title} prompt card${selected ? ', selected' : ''}${currentCardState !== 'default' ? `, ${currentCardState}` : ''}${version ? `, version ${version}` : ''}${access ? `, ${access} access` : ''}`
            }
            aria-describedby={ariaDescribedBy}
            aria-disabled={disabled}
            role={onPrimaryAction || onCardClick ? "button" : undefined}
            data-state={selected ? 'selected' : currentCardState}
            data-card-id={cardId}
            data-selected={selected}
            data-checkbox-visible={showCheckbox}
            {...props}
          >
            {isRunning && (
              <div className={styles.progressBar}>
                <div className={styles.progressIndicator} />
              </div>
            )}

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
                  disabled={disabled}
                  aria-label={`Select ${title}`}
                  className={styles.checkbox}
                />
              </div>
            )}

            {/* Zone-based layout system */}
            <LayoutProvider
              cardSize={size || 'standard'}
              cardState={currentCardState}
              cardDimensions={getCardDimensions(size || 'standard')}
              hasDescription={!!description}
              hasComplications={{
                topLeft: !!complications?.topLeft,
                topRight: !!complications?.topRight,
                bottomLeft: !!complications?.bottomLeft,
                bottomRight: !!complications?.bottomRight,
                edgeLeft: !!complications?.edgeLeft,
                edgeRight: !!complications?.edgeRight,
                footer: !!complications?.footer,
              }}
            >
              {/* Header Zone */}
              <ZoneRenderer placement="core" className={styles.headerZone}>
                <div className={styles.headerContent}>
                  <div className={styles.titleContainer}>
                    <Header
                      title={title}
                      version={version}
                      lastRun={lastRun}
                      createdAt={createdAt}
                      updatedAt={updatedAt}
                      isCompact={isCompact}
                    />
                  </div>
                  <ZoneRenderer placement="meta" className={styles.metadataContainer}>
                    <div
                      data-clickable-section="version"
                      data-version={version}
                      onClick={onVersionClick ? (e) => {
                        e.stopPropagation();
                        onVersionClick(version, e);
                      } : undefined}
                      className={onVersionClick ? 'cursor-pointer' : undefined}
                      role={onVersionClick ? 'button' : undefined}
                      tabIndex={onVersionClick ? 0 : undefined}
                      aria-label={onVersionClick ? `View version history: ${version}` : undefined}
                      onKeyDown={onVersionClick ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onVersionClick(version, e as any);
                        }
                      } : undefined}
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap priority-important",
                          onVersionClick && "transition-colors hover:bg-mp-panel/80 hover:border-mp-primary/50"
                        )}
                      >
                        v{version}
                      </Badge>
                    </div>
                    {access && (
                      <Badge
                        variant={access === 'private' ? 'secondary' : access === 'public' ? 'default' : 'outline'}
                        className="text-xs priority-supplementary"
                      >
                        {access}
                      </Badge>
                    )}
                    {executionState && (
                      <Badge
                        variant={
                          executionState.status === 'success' ? 'default' :
                          executionState.status === 'failed' ? 'destructive' :
                          executionState.status === 'running' ? 'secondary' :
                          executionState.status === 'queued' ? 'outline' :
                          'secondary'
                        }
                        className={cn(
                          "text-xs priority-important",
                          !prefersReducedMotion && (executionState.status === 'running' || executionState.status === 'queued') && "animate-pulse"
                        )}
                      >
                        {executionState.status === 'running' && '● Running'}
                        {executionState.status === 'queued' && '○ Queued'}
                        {executionState.status === 'success' && '✓ Success'}
                        {executionState.status === 'failed' && '✗ Failed'}
                        {executionState.status === 'cancelled' && '⊗ Cancelled'}
                      </Badge>
                    )}
                    {primaryProvider && (
                      <Badge
                        variant="secondary"
                        className="text-xs priority-supplementary"
                      >
                        {primaryProvider}
                      </Badge>
                    )}
                  </ZoneRenderer>
                </div>
              </ZoneRenderer>

              {/* Description Zone */}
              {description && !isCompact && (
                <ZoneRenderer placement="core" className={`${styles.descriptionZone} ${styles.adaptiveZone} ${description ? 'hasContent' : ''}`}>
                  <div className="px-3 pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  </div>
                </ZoneRenderer>
              )}

              {/* Meta Strip Zone */}
              <ZoneRenderer placement="meta" className={styles.metaStrip}>
                <MetaStrip
                  tags={tags}
                  model={model}
                  models={models}
                  isCompact={isCompact}
                  size={size || 'standard'}
                  onTagClick={onTagClick}
                  onModelClick={onModelClick}
                />
              </ZoneRenderer>

              {/* Scrollable body area */}
              <div className={styles.bodyArea}>
                {/* Body Preview Zone */}
                {!isCompact && bodyPreview && (
                  <ZoneRenderer placement="core">
                    <BodyPreview
                      text={bodyPreview}
                      isXL={isXL}
                    />
                  </ZoneRenderer>
                )}

                {/* Extended Content Zone (XL only) */}
                {isXL && (
                  <ZoneRenderer placement="extended" className={styles.extendedZone}>
                    <Body
                      isCompact={false}
                      isXL={isXL}
                      bodyPreview={undefined} // Preview handled above
                      blockChips={blockChips}
                      provenance={provenance}
                      extendedStats={extendedStats}
                      metrics={metrics}
                    />
                  </ZoneRenderer>
                )}

                {/* Stats Zone */}
                {!isCompact && (
                  <ZoneRenderer placement="core">
                    <Stats metrics={metrics} isCompact={isCompact} />
                  </ZoneRenderer>
                )}
              </div>

              {/* Bindings Row - Phase 4 */}
              {bindings && bindings.length > 0 && (
                <ZoneRenderer placement="core">
                  <BindingsRow
                    bindings={bindings}
                    maxVisible={isXL ? 6 : 4}
                    onBindingClick={() => {
                      // Future: implement filtering or navigation
                    }}
                  />
                </ZoneRenderer>
              )}

              {/* Actions Zone */}
              <ZoneRenderer placement="core" className={styles.actionsRow}>
                <Actions
                  isCompact={isCompact}
                  isXL={isXL}
                  onRun={onRun}
                  onEdit={onEdit}
                  onFork={onFork}
                  onMenuAction={onMenuAction}
                  onCompare={onCompare}
                  onAnalytics={onAnalytics}
                  onHistory={onHistory}
                  isRunning={isRunning}
                />
              </ZoneRenderer>

              {/* Error Banner (if any) */}
              {error && <ErrorBanner error={error} />}

              <ComplicationSlotsComponent />

              {/* Debug overlay only if debug prop is set */}
              {props.debug && <LayoutDebugOverlay />}

            </LayoutProvider>
          </Card>
        </ComplicationProvider>
      </>
    );
  }
);

PromptCardInner.displayName = 'PromptCardInner';

const PromptCard = React.forwardRef<HTMLDivElement, PromptCardProps>((props, ref) => (
  <PromptCardErrorBoundary>
    <PromptCardInner {...props} ref={ref} />
  </PromptCardErrorBoundary>
));

PromptCard.displayName = 'PromptCard';

export { PromptCard, promptCardVariants };
