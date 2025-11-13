import * as React from 'react';
import { Badge } from '../../Badge';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '../../Tooltip';

export interface AccessBadgeProps {
  access: 'private' | 'shared' | 'public';
}

const accessLabels = {
  private: 'Private',
  shared: 'Shared with Team',
  public: 'Public',
};

const accessDescriptions = {
  private: 'Only you can view this context',
  shared: 'Your team members can view this context',
  public: 'Anyone can view this context',
};

export function AccessBadge({ access }: AccessBadgeProps) {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            <Badge
              variant={access === 'private' ? 'secondary' : access === 'public' ? 'default' : 'outline'}
              className="text-xs"
            >
              {access}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{accessLabels[access]}</p>
          <p className="text-xs text-muted-foreground">{accessDescriptions[access]}</p>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
