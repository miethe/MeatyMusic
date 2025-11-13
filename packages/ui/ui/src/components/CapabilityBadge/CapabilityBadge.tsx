import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Zap,
  Eye,
  MessageSquare,
  Code,
  FileJson,
  Mic,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Capability type mapping to icons and styling
 */
const CAPABILITY_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    label: string;
    color: string;
  }
> = {
  function_calling: {
    icon: Zap,
    label: 'Function Calling',
    color: 'text-purple-600 dark:text-purple-400',
  },
  vision: {
    icon: Eye,
    label: 'Vision',
    color: 'text-blue-600 dark:text-blue-400',
  },
  streaming: {
    icon: MessageSquare,
    label: 'Streaming',
    color: 'text-green-600 dark:text-green-400',
  },
  json_mode: {
    icon: FileJson,
    label: 'JSON Mode',
    color: 'text-orange-600 dark:text-orange-400',
  },
  code_execution: {
    icon: Code,
    label: 'Code Execution',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  audio: {
    icon: Mic,
    label: 'Audio',
    color: 'text-pink-600 dark:text-pink-400',
  },
};

const capabilityBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-border bg-panel text-text-base hover:bg-panel-hover',
        enabled:
          'border-success/20 bg-success/10 text-success-foreground hover:bg-success/20',
        disabled:
          'border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed',
        outline: 'border-border bg-transparent text-text-base hover:bg-panel',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface CapabilityBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof capabilityBadgeVariants> {
  /**
   * The capability type to display
   * Must match one of the known capability types
   */
  capabilityType: string;

  /**
   * Whether the capability is enabled
   * When true, displays with success styling
   */
  enabled?: boolean;

  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom label override
   * If not provided, will use the default label for the capability type
   */
  label?: string;
}

/**
 * CapabilityBadge displays a capability type with icon and styling
 *
 * Supports various capability types with automatic icon selection and color coding.
 * Can be used to show enabled/disabled states with appropriate visual feedback.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CapabilityBadge capabilityType="function_calling" enabled />
 *
 * // Custom label
 * <CapabilityBadge capabilityType="vision" label="Image Analysis" enabled />
 *
 * // Disabled state
 * <CapabilityBadge capabilityType="streaming" enabled={false} />
 *
 * // Without icon
 * <CapabilityBadge capabilityType="json_mode" showIcon={false} />
 * ```
 *
 * @accessibility
 * - Uses semantic HTML with proper ARIA attributes
 * - Icon has aria-hidden to avoid screen reader duplication
 * - Color is not the only indicator of state (text and icon also convey meaning)
 * - Keyboard focusable when interactive
 */
export const CapabilityBadge = React.forwardRef<
  HTMLDivElement,
  CapabilityBadgeProps
>(
  (
    {
      capabilityType,
      enabled = true,
      showIcon = true,
      label,
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    const config = CAPABILITY_CONFIG[capabilityType];
    const Icon = config?.icon;

    // Determine variant based on enabled state if not explicitly set
    const finalVariant =
      variant ?? (enabled ? 'enabled' : 'disabled');

    // Use custom label or default from config
    const displayLabel =
      label ?? config?.label ?? capabilityType.replace(/_/g, ' ');

    return (
      <div
        ref={ref}
        className={cn(capabilityBadgeVariants({ variant: finalVariant, size }), className)}
        role="status"
        aria-label={`${displayLabel}: ${enabled ? 'enabled' : 'disabled'}`}
        {...props}
      >
        {showIcon && Icon && (
          <Icon
            className={cn('h-3.5 w-3.5', config?.color)}
            aria-hidden="true"
          />
        )}
        <span>{displayLabel}</span>
      </div>
    );
  }
);

CapabilityBadge.displayName = 'CapabilityBadge';
