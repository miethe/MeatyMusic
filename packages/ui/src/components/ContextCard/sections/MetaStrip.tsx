'use client';

import * as React from 'react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import styles from '../../PromptCard/PromptCard.module.css';
import { TruncatedBadge } from '../../PromptCard/utils/TruncatedBadge';
import { SourceTypeBadge } from '../components/SourceTypeBadge';

export interface MetaStripProps {
  tags: string[];
  sourceType?: 'manual' | 'url' | 'file' | 'api';
  sourceRef?: string;
  isCompact: boolean;
  className?: string;
  size?: 'compact' | 'standard' | 'xl';
  /** Callback when a tag badge is clicked */
  onTagClick?: (tag: string, event: React.MouseEvent) => void;
}

export function MetaStrip(props: MetaStripProps) {
  const { tags, sourceType, sourceRef, isCompact, className, size, onTagClick } = props;

  // If no tags or source type, don't render anything
  if (tags.length === 0 && !sourceType) {
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

  // Handler for tag clicks
  const handleTagClick = React.useCallback((tag: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onTagClick) {
      onTagClick(tag, event);
    }
  }, [onTagClick]);

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
              text={`#${tag}`}
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
                      #{tag}
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

      {/* Right zone: Source Type Badge */}
      <div className={cn(styles.metaZoneRight)}>
        {sourceType && (
          <SourceTypeBadge
            sourceType={sourceType}
            sourceRef={sourceRef}
            isCompact={isCompact}
          />
        )}
      </div>
    </div>
  );
}
