import * as React from 'react';

export interface PromptCardShortcutOptions {
  onRun?: () => void;
  onEdit?: () => void;
  onFork?: () => void;
  onPrimaryAction?: () => void;
  disabled?: boolean;
  isRunning?: boolean;
  currentState?: string;
}

/**
 * Provide keyboard shortcut handling for PromptCard actions.
 */
export function usePromptCardShortcuts(options: PromptCardShortcutOptions) {
  const { onRun, onEdit, onFork, onPrimaryAction, disabled, isRunning, currentState } = options;

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || currentState === 'disabled') {
        event.preventDefault();
        return;
      }
      switch (event.key) {
        case 'Enter':
        case ' ': {
          event.preventDefault();
          if (onPrimaryAction && !isRunning) {
            onPrimaryAction();
          } else if (onRun && !isRunning) {
            onRun();
          }
          break;
        }
        case 'Escape': {
          if (currentState === 'selected') {
            (event.target as HTMLElement).blur();
          }
          break;
        }
        case 'e':
        case 'E': {
          if (onEdit && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onEdit();
          }
          break;
        }
        case 'f':
        case 'F': {
          if (onFork && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onFork();
          }
          break;
        }
        default:
          break;
      }
    },
    [onRun, onEdit, onFork, onPrimaryAction, disabled, isRunning, currentState]
  );

  return { onKeyDown } as const;
}
