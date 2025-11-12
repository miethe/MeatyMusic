/**
 * Toast Hook
 * Simple toast notification hook
 * TODO: Replace with proper toast implementation from @meatymusic/ui
 */

'use client';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * Simple toast hook using browser alerts for now
 * TODO: Implement proper toast UI component
 */
export function useToast() {
  const toast = (options: ToastOptions) => {
    // For now, use browser alert
    // In production, this should trigger a proper toast notification
    const message = options.description
      ? `${options.title}\n\n${options.description}`
      : options.title;

    // In development, log to console for better UX
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[Toast ${options.variant || 'info'}]:`, message);
    }

    // Optionally show alert in production (can be removed when proper toast is implemented)
    if (options.variant === 'error') {
      // Only show alerts for errors to avoid disruption
      alert(message);
    }
  };

  return { toast };
}
