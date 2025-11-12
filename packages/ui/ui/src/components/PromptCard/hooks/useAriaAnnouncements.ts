import * as React from 'react';

/**
 * Manage announcements for an ARIA live region.
 */
export function useAriaAnnouncements() {
  const [message, setMessage] = React.useState('');

  const announce = React.useCallback((msg: string) => {
    setMessage(msg);
    const timeout = setTimeout(() => setMessage(''), 1000);
    return () => clearTimeout(timeout);
  }, []);

  return { message, announce } as const;
}
