/**
 * Toast Notification Helper
 * Wrapper around sonner toast library for consistent notification styling
 *
 * Features:
 * - Type-safe toast API
 * - Consistent styling across the app
 * - Auto-dismiss with configurable duration
 * - Accessible (ARIA live regions)
 * - Icon support
 *
 * Phase 4, Task 4.3
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner';

/**
 * Toast Options
 * Extended options for toast notifications
 */
export interface ToastOptions extends Omit<ExternalToast, 'action' | 'cancel'> {
  /** Duration in milliseconds (default varies by type) */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
  /** Cancel button */
  cancel?: {
    label: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
}

/**
 * Toast API
 * Provides consistent toast notification methods
 */
export const toast = {
  /**
   * Success toast (green)
   * Default duration: 3000ms
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: 3000,
      ...options,
    } as ExternalToast);
  },

  /**
   * Error toast (red)
   * Default duration: 5000ms (longer to ensure user sees it)
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    } as ExternalToast);
  },

  /**
   * Warning toast (yellow)
   * Default duration: 4000ms
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    } as ExternalToast);
  },

  /**
   * Info toast (blue)
   * Default duration: 3000ms
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: 3000,
      ...options,
    } as ExternalToast);
  },

  /**
   * Loading toast (spinner)
   * No auto-dismiss - must be manually dismissed
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, options as ExternalToast);
  },

  /**
   * Promise toast (auto-resolves with promise)
   * Shows loading, then success or error based on promise result
   */
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Custom toast (default styling)
   * Default duration: 3000ms
   */
  message: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      duration: 3000,
      ...options,
    } as ExternalToast);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

/**
 * Default export
 */
export default toast;
