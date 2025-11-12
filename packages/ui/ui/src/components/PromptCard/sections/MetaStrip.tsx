import * as React from 'react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';
import { TruncatedBadge } from '../utils/TruncatedBadge';
import { ModelBadges } from '../components/ModelBadges';

export interface MetaStripProps {
  tags: string[];
  /** Single model name (legacy, for backward compatibility) */
  model?: string;
  /** Multiple model names (preferred) - takes precedence over single model */
  models?: string[];
  isCompact: boolean;
  className?: string;
  size?: 'compact' | 'standard' | 'xl';
  /** Callback when a tag badge is clicked */
  onTagClick?: (tag: string, event: React.MouseEvent) => void;
  /** Callback when the model badge is clicked */
  onModelClick?: (model: string, event: React.MouseEvent) => void;
}

export function MetaStrip(props: MetaStripProps) {
  const { tags, model, models, isCompact, className, size, onTagClick, onModelClick } = props;

  // If no tags or models, don't render anything
  if (tags.length === 0 && !model && (!models || models.length === 0)) {
    return null;
  }

  // Determine tag limits based on card size
  const getTagLimit = () => {
    if (isCompact) return 2;
    if (size === 'xl') return 6;
    return 4; // standard
  };

  const tagLimit = getTagLimit();
  const visibleTags = tags.slice(0, tagLimit);
  const hiddenTagsCount = Math.max(0, tags.length - tagLimit);
  const hiddenTags = tags.slice(tagLimit);

  // Handler for tag clicks
  const handleTagClick = React.useCallback((tag: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onTagClick) {
      onTagClick(tag, event);
    }
  }, [onTagClick]);

  // Handler for model click
  const handleModelClick = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (onModelClick && model) {
      onModelClick(model, event);
    }
  }, [onModelClick, model]);

  return (
    <div className={cn(styles.metaStrip, className)}>
      {/* Left zone: Tags */}
      <div className={cn(styles.metaZoneLeft, styles.badgeContainer)}>
        {/* Render visible tags */}
        {visibleTags.map((tag, index) => (
          <div
            key={index}
            data-clickable-section="tag"
            data-tag={tag}
            onClick={onTagClick ? handleTagClick(tag) : undefined}
            className={onTagClick ? 'cursor-pointer' : undefined}
            role={onTagClick ? 'button' : undefined}
            tabIndex={onTagClick ? 0 : undefined}
            aria-label={onTagClick ? `Filter by tag: ${tag}` : undefined}
            onKeyDown={onTagClick ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTagClick(tag)(e as any);
              }
            } : undefined}
          >
            <TruncatedBadge
              text={tag}
              variant="outline"
              className={cn(
                "text-xs flex-shrink-0",
                onTagClick && "transition-colors hover:bg-mp-panel/80 hover:border-mp-primary/50"
              )}
              maxWidth={isCompact ? '60px' : '100px'}
            />
          </div>
        ))}

        {/* Show overflow indicator with tooltip */}
        {hiddenTagsCount > 0 && (
          <Tooltip
            content={
              <div className="max-w-xs">
                <div className="font-medium mb-1">All tags ({tags.length}):</div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-white/10 px-1 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            }
            side="top"
            align="start"
          >
            <Badge variant="outline" className={cn('text-xs cursor-help', styles.badgeOverflow)}>
              +{hiddenTagsCount}
            </Badge>
          </Tooltip>
        )}
      </div>

      {/* Right zone: Model chips */}
      <div className={cn(styles.metaZoneRight)}>
        {/* Use ModelBadges if multiple models provided, otherwise fall back to single model */}
        {models && models.length > 0 ? (
          <ModelBadges
            models={models}
            size={size}
            onModelClick={onModelClick}
          />
        ) : model ? (
          <div
            data-clickable-section="model"
            data-model={model}
            onClick={onModelClick ? handleModelClick : undefined}
            className={onModelClick ? 'cursor-pointer' : undefined}
            role={onModelClick ? 'button' : undefined}
            tabIndex={onModelClick ? 0 : undefined}
            aria-label={onModelClick ? `Filter by model: ${model}` : undefined}
            onKeyDown={onModelClick ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleModelClick(e as any);
              }
            } : undefined}
          >
            <TruncatedBadge
              text={model}
              variant="secondary"
              className={cn(
                "text-xs flex-shrink-0",
                onModelClick && "transition-colors hover:bg-mp-secondary/80"
              )}
              maxWidth={isCompact ? '80px' : '120px'}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
