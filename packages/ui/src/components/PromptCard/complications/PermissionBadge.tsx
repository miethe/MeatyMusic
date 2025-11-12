import * as React from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import type { ComplicationProps } from '../../../complications/types';

function getSharedDescription(sharedWith: string[], owner?: string): string {
  const count = sharedWith.length;
  const peopleText = count === 1 ? 'person' : 'people';
  const ownerText = owner ? ` by ${owner}` : '';
  return `Shared with ${count} ${peopleText}${ownerText}`;
}

export interface PermissionBadgeProps extends ComplicationProps {
  access: 'private' | 'public' | 'shared';
  owner?: string;
  sharedWith?: string[];
  onShare?: () => void;
}

export function PermissionBadge({
  access,
  owner,
  sharedWith = [],
  onShare,
  cardSize,
  slot,
  isVisible,
  className,
  'aria-label': ariaLabel,
  ...complicationProps
}: PermissionBadgeProps) {
  if (!isVisible) return null;

  const accessConfig = {
    private: {
      icon: Lock,
      variant: 'outline' as const,
      label: 'Private',
      description: owner ? `Private prompt owned by ${owner}` : 'Private prompt',
    },
    public: {
      icon: Globe,
      variant: 'secondary' as const,
      label: 'Public',
      description: owner ? `Public prompt by ${owner}` : 'Public prompt',
    },
    shared: {
      icon: Users,
      variant: 'info' as const,
      label: 'Shared',
      description: getSharedDescription(sharedWith, owner),
    },
  };

  const config = accessConfig[access];
  const Icon = config.icon;

  // Size adjustments based on card size
  const iconSize = cardSize === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const badgeClasses = cn(
    'text-xs capitalize whitespace-nowrap flex items-center gap-1',
    cardSize === 'compact' ? 'px-1.5 py-0.5 max-w-16' : 'px-2 py-1 max-w-20',
    className
  );

  const tooltipContent = (
    <div className="text-left">
      <div className="font-medium">{config.label} Access</div>
      {owner && (
        <div className="text-xs opacity-90 mt-1">
          Owner: {owner}
        </div>
      )}
      {access === 'shared' && sharedWith.length > 0 && (
        <div className="text-xs opacity-90 mt-1">
          Shared with {sharedWith.length} {sharedWith.length === 1 ? 'person' : 'people'}
        </div>
      )}
    </div>
  );

  const badgeElement = (
    <Badge
      variant={config.variant}
      className={badgeClasses}
      aria-label={ariaLabel || `${config.label} access${owner ? `, owned by ${owner}` : ''}`}
    >
      <Icon className={cn(iconSize, 'flex-shrink-0')} />
      {cardSize !== 'compact' && (
        <span className="truncate min-w-0">{config.label}</span>
      )}
    </Badge>
  );

  const handleClick = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    if (onShare) {
      onShare();
    }
  }, [onShare]);

  const interactiveBadge = onShare ? (
    <button
      type="button"
      onClick={handleClick}
      className="focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary rounded-md"
      aria-label={`${config.label} access. Click to manage sharing.`}
    >
      {badgeElement}
    </button>
  ) : (
    badgeElement
  );

  return (
    <div
      className="flex-shrink-0"
      data-testid={`permission-badge-${access}`}
      data-slot={slot}
    >
      <Tooltip
        content={tooltipContent}
        side="bottom"
        align="center"
        delayDuration={300}
      >
        {interactiveBadge}
      </Tooltip>
    </div>
  );
}

PermissionBadge.displayName = 'PermissionBadge';
