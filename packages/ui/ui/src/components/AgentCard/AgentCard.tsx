import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Checkbox } from '../Checkbox';
import styles from './AgentCard.module.css';
import { Header, RuntimeBadge, EntryPromptPreview, ToolsRow, VariablesRow, Actions, ErrorBanner } from './sections';
import { useAgentCardState } from './hooks/useAgentCardState';
import { useAgentCardShortcuts } from './hooks/useAgentCardShortcuts';
import type { AgentRuntime } from './sections/RuntimeBadge';

const agentCardVariants = cva(styles.card, {
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

export interface AgentCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof agentCardVariants> {
  // Core Identity
  name: string;
  version?: string;
  description?: string;

  // Runtime Configuration
  runtime: AgentRuntime;
  runtimeConfig?: {
    icon?: React.ReactNode;
    label?: string;
    color?: string;
  };

  // Entry & Context
  entryPrompt: {
    id: string;
    name: string;
    preview: string;
  };

  // Tools & Variables
  tools?: Array<{
    id: string;
    name: string;
    icon?: React.ReactNode;
  }>;
  variables?: Record<string, any>;

  // Metadata
  tags?: string[];
  access?: 'private' | 'public' | 'shared';
  createdAt?: Date;
  updatedAt?: Date;
  lastRun?: Date;

  // Metrics
  metrics?: {
    runs?: number;
    successRate?: number;
    avgDuration?: number;
  };

  // Actions
  onRun?: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  onMenuAction?: (action: string) => void;
  onPrimaryAction?: () => void;

  // States
  isRunning?: boolean;
  error?: string | { message: string; retry?: () => void };
  disabled?: boolean;

  // Selection
  selectable?: boolean;
  selected?: boolean;
  hasActiveSelection?: boolean;
  onSelectionChange?: (selected: boolean, event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => void;

  // Callbacks
  onCardClick?: () => void;
  onTagClick?: (tag: string, event: React.MouseEvent) => void;
  onToolClick?: (toolId: string, event: React.MouseEvent) => void;
  onEntryPromptClick?: (promptId: string, event: React.MouseEvent) => void;

  // Display Options
  showVariables?: boolean;
  showMetrics?: boolean;

  // State Management
  onStateChange?: (state: {
    from?: string;
    to: string;
    timestamp: Date;
    reason?: string;
  }) => void;

  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const AgentCardInner = React.forwardRef<HTMLDivElement, AgentCardProps>(
  ({
    className,
    size,
    state,
    name,
    version = '1.0',
    description,
    runtime,
    runtimeConfig,
    entryPrompt,
    tools = [],
    variables,
    tags = [],
    access = 'private',
    createdAt,
    updatedAt,
    lastRun,
    metrics,
    onRun,
    onEdit,
    onExport,
    onMenuAction,
    onPrimaryAction,
    isRunning,
    error,
    disabled,
    selectable,
    selected,
    hasActiveSelection,
    onSelectionChange,
    onCardClick,
    onTagClick,
    onToolClick,
    onEntryPromptClick,
    showVariables = true,
    showMetrics = true,
    onStateChange,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const { cardId, currentCardState, liveRegionMessage } = useAgentCardState({
      name,
      state,
      disabled,
      isRunning,
      error,
      onStateChange,
    });

    const { onKeyDown } = useAgentCardShortcuts({
      onRun,
      onEdit,
      onExport,
      onPrimaryAction,
      disabled,
      isRunning,
      currentState: currentCardState,
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
      if (onSelectionChange && !disabled) {
        onSelectionChange(event.target.checked, event);
      }
    }, [onSelectionChange, disabled]);

    // Handle checkbox click to stop propagation
    const handleCheckboxClick = React.useCallback((event: React.MouseEvent) => {
      event.stopPropagation();
    }, []);

    const handleCardClick = React.useCallback((event: React.MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) {
        return;
      }

      const clickableAncestor = target.closest('button, a, [data-clickable-section]');
      if (clickableAncestor) {
        return;
      }

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
        <Card
          ref={ref}
          className={cn(agentCardVariants({ size, state: selected ? 'selected' : currentCardState }), className)}
          tabIndex={disabled || !(onPrimaryAction || onCardClick) ? -1 : 0}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleCardClick}
          aria-label={
            ariaLabel || `${name} agent card${selected ? ', selected' : ''}${currentCardState !== 'default' ? `, ${currentCardState}` : ''}, runtime ${runtime}, version ${version}${access ? `, ${access} access` : ''}`
          }
          aria-describedby={ariaDescribedBy}
          aria-disabled={disabled}
          role={onPrimaryAction || onCardClick ? 'button' : undefined}
          data-state={selected ? 'selected' : currentCardState}
          data-card-id={cardId}
          data-selected={selected}
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
                aria-label={`Select ${name}`}
                className={styles.checkbox}
              />
            </div>
          )}

          {/* Header Zone */}
          <div className={styles.headerZone}>
            <Header
              name={name}
              version={version}
              access={access}
              lastRun={lastRun}
              createdAt={createdAt}
              updatedAt={updatedAt}
              isCompact={isCompact}
            />
          </div>

          {/* Runtime Zone */}
          <div className={styles.runtimeZone}>
            <RuntimeBadge
              runtime={runtime}
              config={runtimeConfig}
              isCompact={isCompact}
            />
          </div>

          {/* Description (if provided and not compact) */}
          {description && !isCompact && (
            <div className="px-3 mb-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
          )}

          {/* Scrollable body area */}
          <div className={styles.bodyArea}>
            {/* Entry Prompt Zone */}
            <div className={styles.entryPromptZone}>
              <EntryPromptPreview
                prompt={entryPrompt}
                onClick={onEntryPromptClick}
                isCompact={isCompact}
              />
            </div>

            {/* Tools Zone */}
            {tools.length > 0 && (
              <div className={styles.toolsZone}>
                <ToolsRow
                  tools={tools}
                  onClick={onToolClick}
                  isCompact={isCompact}
                  maxVisible={isCompact ? 2 : isXL ? 5 : 3}
                />
              </div>
            )}

            {/* Variables Zone */}
            {showVariables && variables && (
              <div className={styles.variablesZone}>
                <VariablesRow
                  variables={variables}
                  isCompact={isCompact}
                />
              </div>
            )}

            {/* Tags Zone */}
            {tags.length > 0 && !isCompact && (
              <div className={styles.tagsZone}>
                <div className="flex items-center gap-1 flex-wrap px-3">
                  {tags.slice(0, isXL ? 6 : 4).map((tag, index) => (
                    <div
                      key={index}
                      data-clickable-section="tag"
                      data-tag={tag}
                      onClick={onTagClick ? (e) => {
                        e.stopPropagation();
                        onTagClick(tag, e);
                      } : undefined}
                      className={onTagClick ? 'cursor-pointer' : undefined}
                      role={onTagClick ? 'button' : undefined}
                      tabIndex={onTagClick ? 0 : undefined}
                    >
                      <Badge
                        variant="outline"
                        size="sm"
                        className={cn(
                          'text-xs',
                          onTagClick && 'transition-colors hover:bg-mp-panel/80 hover:border-mp-primary/50'
                        )}
                      >
                        {tag}
                      </Badge>
                    </div>
                  ))}
                  {tags.length > (isXL ? 6 : 4) && (
                    <Badge variant="outline" size="sm" className="text-xs">
                      +{tags.length - (isXL ? 6 : 4)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Zone */}
          <Actions
            onRun={onRun}
            onEdit={onEdit}
            onExport={onExport}
            onMenuAction={onMenuAction}
            isRunning={isRunning}
            isCompact={isCompact}
            isXL={isXL}
          />

          {/* Error Banner (if any) */}
          {error && <ErrorBanner error={error} />}
        </Card>
      </>
    );
  }
);

AgentCardInner.displayName = 'AgentCardInner';

const AgentCard = React.forwardRef<HTMLDivElement, AgentCardProps>((props, ref) => (
  <AgentCardInner {...props} ref={ref} />
));

AgentCard.displayName = 'AgentCard';

export { AgentCard, agentCardVariants };
export type { AgentRuntime };
