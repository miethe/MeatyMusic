import * as React from 'react';
import { BindingsChip, BindingType } from '../components/BindingsChip';
import { OverflowTooltip } from '../components/OverflowTooltip';
import { Badge } from '../../Badge';
import styles from './BindingsRow.module.css';

/**
 * BindingsRow - Display prompt bindings with overflow management
 *
 * Shows a row of binding chips (contexts, agents, variables, models) with:
 * - Type-specific icons and colors
 * - Configurable visible limit with overflow tooltip
 * - Optional click handlers for filtering/navigation
 * - Accessibility support
 *
 * Responsive Limits:
 * - Standard: 4 visible bindings + overflow
 * - XL: 6 visible bindings + overflow
 *
 * @example Basic usage
 * ```tsx
 * <BindingsRow
 *   bindings={[
 *     { type: 'context', name: 'API Documentation' },
 *     { type: 'agent', name: 'Code Reviewer' },
 *     { type: 'variable', name: 'userName' },
 *     { type: 'model', name: 'GPT-4 Turbo' },
 *   ]}
 * />
 * ```
 *
 * @example With click handler
 * ```tsx
 * <BindingsRow
 *   bindings={bindings}
 *   maxVisible={6}
 *   onBindingClick={(binding) => {
 *     console.log('Selected:', binding);
 *   }}
 * />
 * ```
 */

export interface Binding {
  /** Type of binding - determines icon and color */
  type: BindingType;
  /** Display name of the binding */
  name: string;
  /** Optional ID for tracking */
  id?: string;
}

export interface BindingsRowProps {
  /** Array of bindings to display */
  bindings: Binding[];
  /** Maximum number of visible chips before overflow (default: 4) */
  maxVisible?: number;
  /** Optional click handler for individual bindings */
  onBindingClick?: (binding: Binding) => void;
  /** Additional CSS classes */
  className?: string;
}

export const BindingsRow: React.FC<BindingsRowProps> = ({
  bindings,
  maxVisible = 4,
  onBindingClick,
  className,
}) => {
  // Don't render if no bindings
  if (!bindings || bindings.length === 0) {
    return null;
  }

  const visibleBindings = bindings.slice(0, maxVisible);
  const overflowCount = Math.max(0, bindings.length - maxVisible);
  const overflowBindings = bindings.slice(maxVisible);

  const handleBindingClick = React.useCallback(
    (binding: Binding) => () => {
      onBindingClick?.(binding);
    },
    [onBindingClick]
  );

  const rowClassName = [styles.bindingsRow, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClassName} data-testid="bindings-row">
      <span className={styles.label} aria-label="Prompt bindings">
        BINDINGS
      </span>
      <div className={styles.chips} role="list" aria-label="Binding chips">
        {visibleBindings.map((binding, idx) => (
          <div key={binding.id || `${binding.type}-${idx}`} role="listitem">
            <BindingsChip
              type={binding.type}
              name={binding.name}
              onClick={onBindingClick ? handleBindingClick(binding) : undefined}
            />
          </div>
        ))}
        {overflowCount > 0 && (
          <div role="listitem">
            <OverflowTooltip
              overflowCount={overflowCount}
              items={overflowBindings.map((binding, idx) => (
                <div
                  key={binding.id || `overflow-${binding.type}-${idx}`}
                  className={styles.tooltipItem}
                >
                  <Badge
                    variant="outline"
                    size="sm"
                    className={styles[`badge${binding.type.charAt(0).toUpperCase() + binding.type.slice(1)}`]}
                  >
                    {binding.name}
                  </Badge>
                </div>
              ))}
              side="top"
              align="start"
              aria-label={`${overflowCount} more bindings`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

BindingsRow.displayName = 'BindingsRow';
