/**
 * Event tracking utilities
 */

import { startSpan, endSpan, recordException } from './client';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a user event
 */
export function trackEvent(
  eventName: string,
  properties?: EventProperties
): void {
  const span = startSpan(`event.${eventName}`, {
    'event.name': eventName,
    'event.timestamp': Date.now(),
    ...properties,
  });

  endSpan(span);

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[Tracking] Event:', eventName, properties);
  }
}

/**
 * Track an error event
 */
export function trackError(error: {
  code?: string;
  message: string;
  request_id?: string;
  status?: number;
  details?: Record<string, unknown>;
}): void {
  trackEvent('error_occurred', {
    error_code: error.code || 'UNKNOWN',
    error_message: error.message,
    request_id: error.request_id,
    status: error.status,
    ...(error.details && { error_details: JSON.stringify(error.details) }),
  });
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || path,
  });
}

/**
 * Track API call
 */
export function trackApiCall(
  method: string,
  endpoint: string,
  duration: number,
  status: number
): void {
  trackEvent('api_call', {
    http_method: method,
    http_endpoint: endpoint,
    http_status: status,
    duration_ms: duration,
  });
}

/**
 * Wrap an async function with telemetry tracking
 */
export async function withTelemetry<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: EventProperties
): Promise<T> {
  // Filter out undefined values
  const cleanAttributes = attributes
    ? Object.fromEntries(
        Object.entries(attributes).filter(([_, v]) => v !== undefined)
      ) as Record<string, string | number | boolean>
    : undefined;

  const span = startSpan(name, cleanAttributes);

  try {
    const result = await fn();
    endSpan(span, true);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      recordException(span, error);
    }
    endSpan(span, false);
    throw error;
  }
}
