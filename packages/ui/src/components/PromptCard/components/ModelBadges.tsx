import * as React from 'react';
import { Badge } from '../../Badge';
import { OverflowTooltip } from './OverflowTooltip';
import { cn } from '../../../lib/utils';

/**
 * ModelBadges - Display multiple model badges with responsive overflow
 *
 * Shows a set of model badges with size-based overflow limits. When there are
 * more models than can be displayed, uses OverflowTooltip to show "+X more"
 * with all models in the tooltip.
 *
 * Responsive limits:
 * - Compact: 1 model + overflow
 * - Standard: 2 models + overflow
 * - XL: 3 models + overflow
 *
 * @example Basic usage
 * ```tsx
 * <ModelBadges
 *   models={['gpt-4', 'claude-3-opus', 'gemini-pro']}
 *   size="standard"
 * />
 * ```
 *
 * @example With click handler
 * ```tsx
 * <ModelBadges
 *   models={['gpt-4', 'claude-3-opus']}
 *   size="standard"
 *   onModelClick={(model, event) => {
 *     console.log('Filter by:', model);
 *   }}
 * />
 * ```
 */
export interface ModelBadgesProps {
  /** Array of model names to display */
  models: string[];
  /** Card size determines how many visible */
  size?: 'compact' | 'standard' | 'xl';
  /** Optional click handler for filtering */
  onModelClick?: (model: string, event: React.MouseEvent) => void;
  /** Additional classes */
  className?: string;
}

export function ModelBadges({
  models,
  size = 'standard',
  onModelClick,
  className,
}: ModelBadgesProps) {
  // Don't render if no models
  if (!models || models.length === 0) {
    return null;
  }

  // Determine model limits based on card size
  const getModelLimit = () => {
    switch (size) {
      case 'compact':
        return 1;
      case 'standard':
        return 2;
      case 'xl':
        return 3;
      default:
        return 2;
    }
  };

  const modelLimit = getModelLimit();
  const visibleModels = models.slice(0, modelLimit);
  const overflowCount = Math.max(0, models.length - modelLimit);
  const overflowModels = models.slice(modelLimit);

  // Handler for model clicks
  const handleModelClick = React.useCallback(
    (model: string) => (event: React.MouseEvent) => {
      event.stopPropagation();
      if (onModelClick) {
        onModelClick(model, event);
      }
    },
    [onModelClick]
  );

  // Render a single model badge (clickable or not)
  const renderModelBadge = (model: string, isClickable: boolean) => {
    const badge = (
      <Badge
        variant="secondary"
        size="sm"
        className={cn(
          'text-xs font-medium whitespace-nowrap',
          isClickable && 'transition-colors hover:bg-mp-secondary/80',
          className
        )}
      >
        {model}
      </Badge>
    );

    if (!isClickable) {
      return badge;
    }

    return (
      <div
        data-clickable-section="model"
        data-model={model}
        onClick={handleModelClick(model)}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Filter by model: ${model}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleModelClick(model)(e as any);
          }
        }}
      >
        {badge}
      </div>
    );
  };

  // Render overflow badges for tooltip
  const overflowBadgeItems = overflowModels.map((model, index) => (
    <div
      key={index}
      {...(onModelClick && {
        'data-clickable-section': 'model',
        'data-model': model,
        onClick: handleModelClick(model),
        className: 'cursor-pointer',
        role: 'button',
        tabIndex: 0,
        'aria-label': `Filter by model: ${model}`,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleModelClick(model)(e as any);
          }
        },
      })}
    >
      <Badge
        variant="secondary"
        size="sm"
        className={cn(
          'text-xs font-medium whitespace-nowrap',
          onModelClick && 'transition-colors hover:bg-mp-secondary/80'
        )}
      >
        {model}
      </Badge>
    </div>
  ));

  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {/* Render visible models */}
      {visibleModels.map((model, index) => (
        <React.Fragment key={index}>
          {renderModelBadge(model, !!onModelClick)}
        </React.Fragment>
      ))}

      {/* Render overflow tooltip if there are hidden models */}
      {overflowCount > 0 && (
        <OverflowTooltip
          overflowCount={overflowCount}
          items={overflowBadgeItems}
          side="top"
          align="end"
          aria-label={`${overflowCount} more model${overflowCount === 1 ? '' : 's'}`}
          contentClassName="flex flex-col gap-2"
        />
      )}
    </div>
  );
}

ModelBadges.displayName = 'ModelBadges';
