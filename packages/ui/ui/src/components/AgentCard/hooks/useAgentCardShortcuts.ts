import * as React from 'react';
import type { CardState } from './useAgentCardState';

export interface AgentCardShortcutsOptions {
  onRun?: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  onPrimaryAction?: () => void;
  disabled?: boolean;
  isRunning?: boolean;
  currentState: CardState;
}

/**
 * Handle keyboard shortcuts for agent card actions.
 */
export function useAgentCardShortcuts(options: AgentCardShortcutsOptions) {
  const { onRun, onEdit, onExport, onPrimaryAction, disabled, isRunning, currentState } = options;

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Don't handle shortcuts if card is disabled or running
      if (disabled || isRunning) return;

      // Don't handle if the event target is an interactive element
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (onPrimaryAction) {
            onPrimaryAction();
          } else if (onRun) {
            onRun();
          }
          break;

        case 'r':
          if (!event.metaKey && !event.ctrlKey && onRun) {
            event.preventDefault();
            onRun();
          }
          break;

        case 'e':
          if (!event.metaKey && !event.ctrlKey && onEdit) {
            event.preventDefault();
            onEdit();
          }
          break;

        case 'x':
          if (!event.metaKey && !event.ctrlKey && onExport) {
            event.preventDefault();
            onExport();
          }
          break;

        case 'Escape':
          if (currentState === 'running') {
            event.preventDefault();
            // Could add cancel functionality here
          }
          break;
      }
    },
    [disabled, isRunning, onRun, onEdit, onExport, onPrimaryAction, currentState]
  );

  return { onKeyDown };
}
