'use client';

import { useState, useEffect, useMemo } from 'react';

export interface UseContextCardStateProps {
  title: string;
  state?: 'default' | 'error' | 'disabled' | 'selected';
  disabled?: boolean;
  error?: string | { message: string; retry?: () => void };
}

export interface UseContextCardStateReturn {
  cardId: string;
  currentCardState: 'default' | 'error' | 'disabled' | 'selected';
  liveRegionMessage: string;
}

export function useContextCardState(props: UseContextCardStateProps): UseContextCardStateReturn {
  const { title, state = 'default', disabled, error } = props;

  // Generate stable card ID
  const cardId = useMemo(() => generateId('context-card'), []);

  // Determine current state (error and disabled override provided state)
  const currentCardState = useMemo(() => {
    if (disabled) return 'disabled';
    if (error) return 'error';
    return state;
  }, [disabled, error, state]);

  // Live region message for screen readers
  const [liveRegionMessage, setLiveRegionMessage] = useState('');

  // Update live region when state changes
  useEffect(() => {
    if (error) {
      const errorMessage = typeof error === 'string' ? error : error.message;
      setLiveRegionMessage(`Error in ${title} context: ${errorMessage}`);
    } else if (disabled) {
      setLiveRegionMessage(`${title} context is disabled`);
    } else if (state === 'selected') {
      setLiveRegionMessage(`${title} context selected`);
    } else {
      setLiveRegionMessage('');
    }
  }, [error, disabled, state, title]);

  return {
    cardId,
    currentCardState,
    liveRegionMessage,
  };
}

// Helper function to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}
