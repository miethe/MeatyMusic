import * as React from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import { Badge } from '../../Badge';
import { cn } from '../../../lib/utils';

export interface AccessBadgeProps {
  access: 'private' | 'public' | 'shared';
  className?: string;
}

export function AccessBadge(props: AccessBadgeProps) {
  const { access, className } = props;

  const accessConfig = {
    private: {
      icon: Lock,
      variant: 'outline' as const,
      label: 'Private',
    },
    public: {
      icon: Globe,
      variant: 'secondary' as const,
      label: 'Public',
    },
    shared: {
      icon: Users,
      variant: 'info' as const,
      label: 'Shared',
    },
  };

  const config = accessConfig[access];
  const Icon = config.icon;

  return (
    <div className="flex-shrink-0">
      <Badge
        variant={config.variant}
        className={cn('text-xs capitalize whitespace-nowrap flex items-center gap-1 max-w-20', className)}
        title={config.label}
      >
        <Icon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate min-w-0">{config.label}</span>
      </Badge>
    </div>
  );
}
