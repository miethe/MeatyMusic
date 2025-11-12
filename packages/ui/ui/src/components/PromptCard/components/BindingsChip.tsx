import * as React from 'react';
import { FileText, Bot, Variable, Zap } from 'lucide-react';
import styles from './BindingsChip.module.css';

/**
 * BindingsChip - Display prompt binding with type-specific icon and color
 *
 * Shows a single binding (context, agent, variable, or model) with:
 * - Type-specific Lucide icon
 * - Color-coded icon based on binding type
 * - Interactive hover/focus states
 * - Accessibility support with ARIA labels
 *
 * Binding Types:
 * - context: FileText icon (blue)
 * - agent: Bot icon (teal)
 * - variable: Variable icon (amber)
 * - model: Zap icon (violet)
 *
 * @example Basic usage
 * ```tsx
 * <BindingsChip
 *   type="context"
 *   name="API Documentation"
 * />
 * ```
 *
 * @example With click handler
 * ```tsx
 * <BindingsChip
 *   type="agent"
 *   name="Code Reviewer"
 *   onClick={() => console.log('View agent details')}
 * />
 * ```
 *
 * @example Disabled state
 * ```tsx
 * <BindingsChip
 *   type="variable"
 *   name="userName"
 *   disabled={true}
 * />
 * ```
 */

export type BindingType = 'context' | 'agent' | 'variable' | 'model';

export interface BindingsChipProps {
  /** Type of binding - determines icon and color */
  type: BindingType;
  /** Display name of the binding */
  name: string;
  /** Optional click handler for interactions */
  onClick?: () => void;
  /** Whether the chip is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const BINDING_ICONS: Record<BindingType, React.ReactNode> = {
  context: <FileText size={14} />,
  agent: <Bot size={14} />,
  variable: <Variable size={14} />,
  model: <Zap size={14} />,
};

const BINDING_LABELS: Record<BindingType, string> = {
  context: 'Context',
  agent: 'Agent',
  variable: 'Variable',
  model: 'Model',
};

export const BindingsChip: React.FC<BindingsChipProps> = ({
  type,
  name,
  onClick,
  disabled = false,
  className,
}) => {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (onClick && !disabled && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick, disabled]
  );

  const chipClassName = [
    styles.chip,
    styles[type],
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={chipClassName}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`${BINDING_LABELS[type]} binding: ${name}`}
      data-testid={`binding-chip-${type}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {BINDING_ICONS[type]}
      </span>
      <span className={styles.name}>{name}</span>
    </button>
  );
};

BindingsChip.displayName = 'BindingsChip';
