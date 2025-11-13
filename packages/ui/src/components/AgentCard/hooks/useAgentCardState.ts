import * as React from 'react';

export type CardState = 'default' | 'running' | 'error' | 'disabled' | 'selected';

export interface AgentCardStateOptions {
  name: string;
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
 * Determine the agent card state and handle announcements.
 */
export function useAgentCardState(options: AgentCardStateOptions) {
  const { name, state, disabled, isRunning, error, onStateChange } = options;
  const [previousState, setPreviousState] = React.useState('default');
  const [liveMessage, setLiveMessage] = React.useState('');

  const cardId = React.useMemo(
    () => `agent-card-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`,
    [name]
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

      let announcement = '';
      switch (currentCardState) {
        case 'running':
          announcement = `${name} agent is now running`;
          break;
        case 'error':
          const errMsg = typeof error === 'string' ? error : error?.message || 'An error occurred';
          announcement = `Error in ${name}: ${errMsg}`;
          break;
        case 'disabled':
          announcement = `${name} is disabled`;
          break;
        case 'selected':
          announcement = `${name} is selected`;
          break;
        default:
          if (previousState === 'running') {
            announcement = `${name} finished running`;
          }
      }
      if (announcement) {
        setLiveMessage(announcement);
      }
      setPreviousState(currentCardState);
    }
  }, [currentCardState, previousState, name, error, isRunning, disabled, onStateChange]);

  return { cardId, currentCardState, liveRegionMessage: liveMessage } as const;
}
