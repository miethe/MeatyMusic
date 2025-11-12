/**
 * Telemetry hook for page views and events
 */

'use client';

import { useEffect } from 'react';

import { usePathname } from 'next/navigation';

import { trackPageView, trackEvent } from '@/lib/telemetry/tracking';

/**
 * Track page views automatically
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);
}

/**
 * Track custom events
 */
export function useEventTracking() {
  return {
    track: trackEvent,
  };
}

/**
 * Main telemetry hook for tracking events
 *
 * Provides access to the trackEvent function for analytics tracking.
 *
 * @returns Object with trackEvent function
 *
 * @example
 * ```tsx
 * const { trackEvent } = useTelemetry();
 *
 * trackEvent('button_clicked', {
 *   button_id: 'submit',
 *   page: '/onboarding'
 * });
 * ```
 */
export function useTelemetry() {
  return {
    trackEvent,
  };
}
