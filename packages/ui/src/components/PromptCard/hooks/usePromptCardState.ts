import * as React from 'react';
import { useAriaAnnouncements } from './useAriaAnnouncements';
import type { CardState } from '../../../complications/types';

export interface PromptCardStateOptions {
  title: string;
  state?: CardState | null;
  disabled?: boolean;
  isRunning?: boolean;
  error?: string | { message: string };
  onStateChange?: (state: {
    from?: string;
    to: string;
    timestamp: Date;
    reason?: string;
  }) => void;
}

/**
 * Determine the prompt card state and handle announcements.
 */
export function usePromptCardState(options: PromptCardStateOptions) {
  const { title, state, disabled, isRunning, error, onStateChange } = options;
  const [previousState, setPreviousState] = React.useState('default');
  const { message, announce } = useAriaAnnouncements();

  const cardId = React.useMemo(
    () => `prompt-card-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`,
    [title]
  );

  const currentCardState = React.useMemo((): CardState => {
    if (disabled) return 'disabled';
    if (isRunning) return 'running';
    if (error) return 'error';
    return state || 'default';
  }, [disabled, isRunning, error, state]);

  React.useEffect(() => {
    if (currentCardState !== previousState) {
      const stateChangeEvent = {
        from: previousState,
        to: currentCardState,
        timestamp: new Date(),
        reason: isRunning
          ? 'run_started'
          : error
          ? 'error_occurred'
          : disabled
          ? 'disabled'
          : 'user_action',
      };
      onStateChange?.(stateChangeEvent);
      let liveMessage = '';
      switch (currentCardState) {
        case 'running':
          liveMessage = `${title} is now running`;
          break;
        case 'error':
          const errMsg = typeof error === 'string' ? error : error?.message || 'An error occurred';
          liveMessage = `Error in ${title}: ${errMsg}`;
          break;
        case 'disabled':
          liveMessage = `${title} is disabled`;
          break;
        case 'selected':
          liveMessage = `${title} is selected`;
          break;
        default:
          if (previousState === 'running') {
            liveMessage = `${title} finished running`;
          }
      }
      if (liveMessage) {
        announce(liveMessage);
      }
      setPreviousState(currentCardState);
    }
  }, [announce, currentCardState, previousState, title, error, isRunning, disabled, onStateChange]);

  return { cardId, currentCardState, liveRegionMessage: message } as const;
}
