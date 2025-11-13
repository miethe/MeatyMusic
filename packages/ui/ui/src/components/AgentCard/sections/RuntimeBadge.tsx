import * as React from 'react';
import { Cloud, Terminal, Cpu, Wrench } from 'lucide-react';
import { Badge } from '../../Badge';
import { cn } from '../../../lib/utils';

export type AgentRuntime = 'cloud_code' | 'cli' | 'mcp' | 'custom';

export interface RuntimeConfig {
  icon?: React.ReactNode;
  label?: string;
  color?: string;
}

export interface RuntimeBadgeProps {
  runtime: AgentRuntime;
  config?: RuntimeConfig;
  isCompact?: boolean;
  className?: string;
}

const RUNTIME_CONFIGS = {
  cloud_code: {
    icon: Cloud,
    label: 'Cloud Code',
    colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    iconColor: 'text-blue-600',
  },
  cli: {
    icon: Terminal,
    label: 'CLI',
    colorClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    iconColor: 'text-purple-600',
  },
  mcp: {
    icon: Cpu,
    label: 'MCP',
    colorClass: 'bg-green-500/10 text-green-600 border-green-500/20',
    iconColor: 'text-green-600',
  },
  custom: {
    icon: Wrench,
    label: 'Custom',
    colorClass: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    iconColor: 'text-orange-600',
  },
} as const;

export function RuntimeBadge({ runtime, config, isCompact, className }: RuntimeBadgeProps) {
  const runtimeConfig = RUNTIME_CONFIGS[runtime];
  const Icon = config?.icon || runtimeConfig.icon;
  const label = config?.label || runtimeConfig.label;
  const colorClass = config?.color || runtimeConfig.colorClass;

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        colorClass,
        isCompact && 'px-2 py-0.5',
        className
      )}
    >
      {Icon && (
        typeof Icon === 'function' ? (
          <Icon className={cn('h-3 w-3', runtimeConfig.iconColor)} />
        ) : (
          React.isValidElement(Icon) ? Icon : null
        )
      )}
      {!isCompact && <span>{label}</span>}
    </Badge>
  );
}
