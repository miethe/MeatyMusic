'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './components/Button/Button';

export interface SessionWarningProps {
  /** Whether to show the warning */
  isOpen: boolean;
  /** Seconds until session expires */
  timeToExpiry?: number;
  /** Called when user wants to refresh session */
  onRefresh: () => void;
  /** Called when user dismisses the warning */
  onDismiss: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Toast notification that warns users about upcoming session expiry.
 * Provides options to refresh the session or dismiss the warning.
 */
export const SessionWarning: React.FC<SessionWarningProps> = ({
  isOpen,
  timeToExpiry,
  onRefresh,
  onDismiss,
  isRefreshing = false,
  className = '',
}) => {
  const [countdown, setCountdown] = useState(timeToExpiry || 0);

  // Update countdown every second
  useEffect(() => {
    if (!isOpen || !timeToExpiry) return;

    setCountdown(timeToExpiry);

    const interval = setInterval(() => {
      setCountdown(prev => {
        const newValue = Math.max(0, prev - 1);

        // Auto-dismiss if expired
        if (newValue === 0) {
          onDismiss();
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeToExpiry, onDismiss]);

  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm bg-card border border-border rounded-lg shadow-lg p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Warning Icon and Title */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">
            Session Expiring Soon
          </h3>

          <div className="mt-1 text-sm text-muted-foreground">
            <p>Your session will expire in {formatTime(countdown)}.</p>
            <p className="mt-1">Refresh now to stay signed in.</p>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.max(0, (countdown / (timeToExpiry || 300)) * 100)}%`,
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              size="sm"
              variant="primary"
              className="flex-1"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
            </Button>

            <Button
              onClick={onDismiss}
              disabled={isRefreshing}
              size="sm"
              variant="ghost"
              className="px-3"
              aria-label="Dismiss warning"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Simple toast notification component for general notifications.
 */
export interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** Whether toast is visible */
  isOpen: boolean;
  /** Called when toast should be dismissed */
  onDismiss: () => void;
  /** Auto-dismiss after this many milliseconds */
  autoHideDuration?: number;
  /** Custom className */
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isOpen,
  onDismiss,
  autoHideDuration = 5000,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen || !autoHideDuration) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [isOpen, autoHideDuration, onDismiss]);

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const typeIcons = {
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm border rounded-lg p-4 shadow-lg ${typeStyles[type]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {typeIcons[type]}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SessionWarning;
