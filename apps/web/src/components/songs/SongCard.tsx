/**
 * SongCard Component
 * Adapted from PromptCard for MeatyMusic AMCS
 *
 * Displays song metadata, workflow status, entity links, and action buttons.
 * Follows Phase 5 design specs with music-first semantics.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Checkbox } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { Progress } from '@meatymusic/ui';
import type { Song, WorkflowRunStatus } from '@/types/api';

const songCardVariants = cva(
  'relative rounded-xl border border-border/10 bg-background-secondary p-6 shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1',
  {
    variants: {
      size: {
        compact: 'w-72 min-h-[220px]',
        standard: 'w-[420px] min-h-[280px]',
        xl: 'w-[560px] min-h-[320px]',
      },
      state: {
        default: '',
        processing: 'border-accent-secondary/30 bg-accent-secondary/5',
        complete: 'border-accent-success/30 bg-accent-success/5',
        failed: 'border-accent-error/30 bg-accent-error/5',
        selected: 'border-accent-primary/50 bg-accent-primary/10',
      },
    },
    defaultVariants: {
      size: 'standard',
      state: 'default',
    },
  }
);

export interface EntitySummary {
  style?: { id: string; name: string };
  lyrics?: { id: string; name: string };
  persona?: { id: string; name: string };
  producer?: { id: string; name: string };
}

export interface WorkflowState {
  currentNode?: string;
  completedNodes: string[];
  failedNodes: string[];
  progress?: number;
}

export interface SongCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof songCardVariants> {
  song: Song;
  /** Workflow status */
  workflowStatus?: WorkflowRunStatus;
  /** Workflow execution state */
  workflowState?: WorkflowState;
  /** Linked entities */
  entities?: EntitySummary;
  /** Metrics for display */
  metrics?: {
    runs?: number;
    successRate?: number;
    avgDuration?: number;
  };
  /** Enable checkbox selection mode */
  selectable?: boolean;
  /** Whether this card is currently selected */
  selected?: boolean;
  /** Whether any card in the set has an active selection */
  hasActiveSelection?: boolean;
  /** Callbacks */
  onViewWorkflow?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
  onSelectionChange?: (selected: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  onCardClick?: () => void;
  onEntityClick?: (type: 'style' | 'lyrics' | 'persona' | 'producer', id: string) => void;
}

/**
 * Header Section
 */
const SongCardHeader: React.FC<{
  title: string;
  genre?: string;
  selectable?: boolean;
  selected?: boolean;
  hasActiveSelection?: boolean;
  onSelectionChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ title, genre, selectable, selected, hasActiveSelection, onSelectionChange }) => {
  return (
    <div className="flex items-start gap-3 mb-4">
      {selectable && (hasActiveSelection || selected) && (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => {
            if (onSelectionChange) {
              onSelectionChange(checked as boolean, {} as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          className="mt-1"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-text-primary truncate">{title}</h3>
      </div>
      {genre && (
        <Badge variant="secondary" className="bg-accent-music/20 text-accent-music border-accent-music/30">
          {genre}
        </Badge>
      )}
    </div>
  );
};

/**
 * Meta Strip Section
 */
const SongCardMetaStrip: React.FC<{
  moods?: string[];
  status: string;
}> = ({ moods = [], status }) => {
  const displayMoods = moods.slice(0, 3);

  const statusColors = {
    draft: 'bg-status-pending/20 text-status-pending border-status-pending/30',
    validated: 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30',
    rendering: 'bg-status-running/20 text-status-running border-status-running/30',
    rendered: 'bg-status-complete/20 text-status-complete border-status-complete/30',
    failed: 'bg-status-failed/20 text-status-failed border-status-failed/30',
  };

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {displayMoods.map((mood) => (
        <Badge key={mood} variant="outline" className="text-xs">
          {mood}
        </Badge>
      ))}
      <Badge className={cn('text-xs font-medium', statusColors[status as keyof typeof statusColors])}>
        {status}
      </Badge>
    </div>
  );
};

/**
 * Entity Summary Section
 */
const EntitySummaryCards: React.FC<{
  entities?: EntitySummary;
  onEntityClick?: (type: 'style' | 'lyrics' | 'persona' | 'producer', id: string) => void;
}> = ({ entities, onEntityClick }) => {
  const entityCards = [
    { type: 'style' as const, label: 'Style', data: entities?.style },
    { type: 'lyrics' as const, label: 'Lyrics', data: entities?.lyrics },
    { type: 'persona' as const, label: 'Persona', data: entities?.persona },
    { type: 'producer' as const, label: 'Producer', data: entities?.producer },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {entityCards.map(({ type, label, data }) => (
        <button
          key={type}
          onClick={() => data && onEntityClick?.(type, data.id)}
          disabled={!data}
          className={cn(
            'p-3 rounded-lg border text-left transition-colors',
            data
              ? 'bg-background-tertiary/50 border-border/20 hover:bg-background-tertiary hover:border-accent-primary/30 cursor-pointer'
              : 'bg-background-tertiary/20 border-border/10 cursor-not-allowed opacity-50'
          )}
        >
          <div className="text-xs text-text-tertiary mb-1">{label}</div>
          <div className="text-sm text-text-primary font-medium truncate">
            {data ? data.name : 'Not set'}
          </div>
        </button>
      ))}
    </div>
  );
};

/**
 * Workflow Progress Section
 */
const WorkflowProgress: React.FC<{
  workflowState?: WorkflowState;
  size: 'compact' | 'standard' | 'xl';
}> = ({ workflowState, size }) => {
  if (!workflowState || size === 'compact') return null;

  const { progress = 0, currentNode, completedNodes = [], failedNodes = [] } = workflowState;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary">
          {currentNode ? `Running: ${currentNode}` : 'Workflow'}
        </span>
        <span className="text-xs text-text-tertiary">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      {size === 'xl' && (
        <div className="flex gap-1 mt-2">
          {['PLAN', 'STYLE', 'LYRICS', 'PRODUCER', 'COMPOSE', 'VALIDATE', 'RENDER', 'REVIEW'].map((node) => {
            const isComplete = completedNodes.includes(node);
            const isFailed = failedNodes.includes(node);
            const isCurrent = currentNode === node;

            return (
              <div
                key={node}
                className={cn(
                  'flex-1 h-1 rounded-full',
                  isComplete && 'bg-status-complete',
                  isFailed && 'bg-status-failed',
                  isCurrent && 'bg-status-running animate-pulse',
                  !isComplete && !isFailed && !isCurrent && 'bg-background-tertiary'
                )}
                title={node}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Stats Section
 */
const SongCardStats: React.FC<{
  metrics?: {
    runs?: number;
    successRate?: number;
    avgDuration?: number;
  };
}> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="flex items-center gap-4 py-2 border-t border-border/10 text-xs text-text-secondary">
      {metrics.runs !== undefined && (
        <span>
          {metrics.runs} run{metrics.runs !== 1 ? 's' : ''}
        </span>
      )}
      {metrics.successRate !== undefined && (
        <span>{Math.round(metrics.successRate)}% success</span>
      )}
      {metrics.avgDuration !== undefined && (
        <span>{Math.round(metrics.avgDuration)}s avg</span>
      )}
    </div>
  );
};

/**
 * Actions Section
 */
const SongCardActions: React.FC<{
  onViewWorkflow?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
}> = ({ onViewWorkflow, onEdit, onClone, onDelete: _onDelete }) => {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border/10">
      {onViewWorkflow && (
        <Button
          size="sm"
          variant="default"
          onClick={(e) => {
            e.stopPropagation();
            onViewWorkflow();
          }}
          className="flex-1"
        >
          View Workflow
        </Button>
      )}
      {onEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </Button>
      )}
      {onClone && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onClone();
          }}
        >
          Clone
        </Button>
      )}
    </div>
  );
};

/**
 * Main SongCard Component
 */
export const SongCard = React.forwardRef<HTMLDivElement, SongCardProps>(
  (
    {
      className,
      size,
      state,
      song,
      workflowStatus,
      workflowState,
      entities,
      metrics,
      selectable,
      selected,
      hasActiveSelection,
      onViewWorkflow,
      onEdit,
      onClone,
      onDelete,
      onSelectionChange,
      onCardClick,
      onEntityClick,
      ...props
    },
    ref
  ) => {
    const handleCardClick = () => {
      if (!selectable && onCardClick) {
        onCardClick();
      }
    };

    // Extract genre and mood from song or linked style entity
    const genre = entities?.style?.name || 'Unknown Genre';
    const moods: string[] = []; // Would be extracted from style entity in real implementation

    // Derive state from workflow status
    const derivedState = state || (workflowStatus ? workflowStatus.toLowerCase() as any : 'default');

    return (
      <div ref={ref} {...props}>
        <Card
          className={cn(songCardVariants({ size, state: derivedState }), className)}
          onClick={handleCardClick}
        >
        <SongCardHeader
          title={song.title}
          genre={genre}
          selectable={selectable}
          selected={selected}
          hasActiveSelection={hasActiveSelection}
          onSelectionChange={onSelectionChange}
        />

        <SongCardMetaStrip moods={moods} status={song.status} />

        <EntitySummaryCards entities={entities} onEntityClick={onEntityClick} />

        <WorkflowProgress workflowState={workflowState} size={size || 'standard'} />

        <SongCardStats metrics={metrics} />

        <SongCardActions
          onViewWorkflow={onViewWorkflow}
          onEdit={onEdit}
          onClone={onClone}
          onDelete={onDelete}
        />
      </Card>
      </div>
    );
  }
);

SongCard.displayName = 'SongCard';
