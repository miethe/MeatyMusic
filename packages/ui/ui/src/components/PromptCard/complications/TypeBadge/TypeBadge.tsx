import * as React from 'react';
import { User, Settings, Wrench, CheckCircle, Bot } from 'lucide-react';
import { Badge } from '../../../Badge';
import { Tooltip } from '../../../Tooltip';
import { cn } from '../../../../lib/utils';
import type { ComplicationProps } from '../../../../complications/types';

/**
 * Prompt Type - Shared type definition
 * This should match apps/web/src/types/prompt.ts and backend app/models/enums.py
 */
export type PromptType = 'user' | 'system' | 'tool' | 'eval' | 'agent_instruction';

// Badge variant mapping for each prompt type
type BadgeVariant = 'outline' | 'secondary' | 'info' | 'warning' | 'default';

interface TypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  variant: BadgeVariant;
  label: string;
  description: string;
  colorClass: string;
}

/**
 * Configuration for each prompt type
 * Maps to labels and descriptions defined in apps/web/src/types/prompt.ts
 * Kept in sync for consistent UI presentation
 */
const TYPE_CONFIG: Record<PromptType, TypeConfig> = {
  user: {
    icon: User,
    variant: 'outline',
    label: 'User Prompt',
    description: 'For end-user interactions and chat interfaces',
    colorClass: 'text-gray-600',
  },
  system: {
    icon: Settings,
    variant: 'info',
    label: 'System Prompt',
    description: 'Defines AI behavior, persona, and constraints',
    colorClass: 'text-violet-600',
  },
  tool: {
    icon: Wrench,
    variant: 'secondary',
    label: 'Tool Definition',
    description: 'Specifies functions/tools the AI can call',
    colorClass: 'text-teal-600',
  },
  eval: {
    icon: CheckCircle,
    variant: 'warning',
    label: 'Evaluation',
    description: 'Used for testing and quality assessment',
    colorClass: 'text-amber-600',
  },
  agent_instruction: {
    icon: Bot,
    variant: 'info',
    label: 'Agent Instruction',
    description: 'Specific instructions for agent workflows',
    colorClass: 'text-blue-600',
  },
};

export interface TypeBadgeProps extends ComplicationProps {
  /**
   * The type of prompt to display
   */
  type: PromptType;
  /**
   * Override label display (by default follows cardSize)
   */
  showLabel?: boolean;
}

export function TypeBadge({
  type,
  showLabel,
  cardSize,
  slot,
  isVisible,
  className,
  'aria-label': ariaLabel,
  ...complicationProps
}: TypeBadgeProps) {
  if (!isVisible) return null;

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  // Determine if label should be shown based on size
  const shouldShowLabel = showLabel !== undefined
    ? showLabel
    : cardSize !== 'compact';

  // Size adjustments based on card size
  const iconSize = cardSize === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const badgeClasses = cn(
    'text-xs capitalize whitespace-nowrap flex items-center gap-1',
    cardSize === 'compact' ? 'px-1.5 py-0.5 max-w-16' : 'px-2 py-1 max-w-20',
    className
  );

  const tooltipContent = (
    <div className="text-left">
      <div className="font-medium">{config.label} Prompt</div>
      <div className="text-xs opacity-90 mt-1">
        {config.description}
      </div>
    </div>
  );

  const badgeElement = (
    <Badge
      variant={config.variant}
      className={badgeClasses}
      aria-label={ariaLabel || `${config.label} prompt type`}
    >
      <Icon className={cn(iconSize, 'flex-shrink-0', config.colorClass)} />
      {shouldShowLabel && (
        <span className="truncate min-w-0">{config.label}</span>
      )}
    </Badge>
  );

  return (
    <div
      className="flex-shrink-0"
      data-testid={`type-badge-${type}`}
      data-slot={slot}
    >
      <Tooltip
        content={tooltipContent}
        side="bottom"
        align="center"
        delayDuration={300}
      >
        {badgeElement}
      </Tooltip>
    </div>
  );
}

TypeBadge.displayName = 'TypeBadge';
