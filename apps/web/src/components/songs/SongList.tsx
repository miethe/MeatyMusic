/**
 * SongList Component
 * Adapted from PromptList for MeatyMusic AMCS
 *
 * Displays paginated song grid/list with filtering and bulk selection.
 * Supports infinite scroll and empty states.
 */

import * as React from 'react';
import { SongCard, type EntitySummary, type WorkflowState } from './SongCard';
import { EmptyState } from '@meatymusic/ui';
import { Skeleton } from '@meatymusic/ui';
import { Search, Music2, AlertCircle } from 'lucide-react';
import type { Song, SongStatus } from '@/types/api';

export interface SongFilters {
  q?: string;
  genres?: string[];
  moods?: string[];
  status?: SongStatus[];
  hasStyle?: boolean;
  hasLyrics?: boolean;
  hasPersona?: boolean;
  favorite?: boolean;
  archived?: boolean;
}

export interface SongListProps {
  songs: Song[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Applied filters */
  filters?: SongFilters;
  /** Entity data for each song */
  entitiesMap?: Record<string, EntitySummary>;
  /** Workflow state for each song */
  workflowStatesMap?: Record<string, WorkflowState>;
  /** Metrics for each song */
  metricsMap?: Record<string, {
    runs?: number;
    successRate?: number;
    avgDuration?: number;
  }>;
  /** Card size variant */
  cardSize?: 'compact' | 'standard' | 'xl';
  /** Enable bulk selection */
  enableSelection?: boolean;
  /** Selected song IDs */
  selectedIds?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (songId: string, selected: boolean) => void;
  /** Callbacks */
  onSongClick?: (song: Song) => void;
  onViewWorkflow?: (song: Song) => void;
  onEdit?: (song: Song) => void;
  onClone?: (song: Song) => void;
  onDelete?: (song: Song) => void;
  onEntityClick?: (songId: string, type: 'style' | 'lyrics' | 'persona' | 'producer', entityId: string) => void;
  /** Infinite scroll */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Custom empty state */
  emptyState?: React.ReactNode;
}

/**
 * Loading Skeleton
 */
const SongListSkeleton: React.FC<{ count?: number; size?: 'compact' | 'standard' | 'xl' }> = ({
  count = 6,
  size = 'standard'
}) => {
  const heights = {
    compact: 220,
    standard: 280,
    xl: 320,
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="rounded-xl" style={{ height: heights[size] }} />
      ))}
    </div>
  );
};

/**
 * Empty State Component
 */
const SongListEmptyState: React.FC<{ filters?: SongFilters }> = ({ filters }) => {
  const hasFilters = filters && Object.values(filters).some(v =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null
  );

  if (hasFilters) {
    return (
      <EmptyState
        title="No songs match your filters"
        description="Try adjusting your filters or clearing them to see more results"
        icon={Search}
      />
    );
  }

  return (
    <EmptyState
      title="No songs yet"
      description="Create your first song to get started with the Agentic Music Creation System"
      icon={Music2}
      action={{
        label: 'Create Song',
        onClick: () => {
          // This would be handled by parent component
          console.log('Create song clicked');
        }
      }}
    />
  );
};

/**
 * Main SongList Component
 */
export const SongList: React.FC<SongListProps> = ({
  songs,
  isLoading = false,
  error,
  filters,
  entitiesMap = {},
  workflowStatesMap = {},
  metricsMap = {},
  cardSize = 'standard',
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange,
  onSongClick,
  onViewWorkflow,
  onEdit,
  onClone,
  onDelete,
  onEntityClick,
  hasMore = false,
  onLoadMore,
  emptyState,
}) => {
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  React.useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);

      return () => {
        observer.unobserve(target);
      };
    }

    return undefined;
  }, [onLoadMore, hasMore, isLoading]);

  // Loading state
  if (isLoading && songs.length === 0) {
    return <SongListSkeleton count={6} size={cardSize} />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        title="Error loading songs"
        description={error.message || 'An unexpected error occurred'}
        icon={AlertCircle}
      />
    );
  }

  // Empty state
  if (songs.length === 0) {
    return emptyState || <SongListEmptyState filters={filters} />;
  }

  const hasActiveSelection = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Song Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            size={cardSize}
            entities={entitiesMap[song.id]}
            workflowState={workflowStatesMap[song.id]}
            metrics={metricsMap[song.id]}
            selectable={enableSelection}
            selected={selectedIds.has(song.id)}
            hasActiveSelection={hasActiveSelection}
            onSelectionChange={(selected) => {
              onSelectionChange?.(song.id, selected);
            }}
            onCardClick={() => onSongClick?.(song)}
            onViewWorkflow={() => onViewWorkflow?.(song)}
            onEdit={() => onEdit?.(song)}
            onClone={() => onClone?.(song)}
            onDelete={() => onDelete?.(song)}
            onEntityClick={(type, entityId) => onEntityClick?.(song.id, type, entityId)}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoading && songs.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && <div ref={observerTarget} className="h-4" />}
    </div>
  );
};

SongList.displayName = 'SongList';
