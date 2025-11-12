/**
 * OpenTelemetry client setup
 * For now, this is a lightweight wrapper that logs to console in development
 * Can be extended to send to OTEL collector in production
 */

import { trace, SpanStatusCode, type Span } from '@opentelemetry/api';

const tracer = trace.getTracer('meatymusic-web', '0.1.0');

/**
 * Start a new span for tracing
 */
export function startSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const span = tracer.startSpan(name, {
    attributes: {
      'service.name': 'meatymusic-web',
      'service.version': '0.1.0',
      ...attributes,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Telemetry] Span started: ${name}`, attributes);
  }

  return span;
}

/**
 * End a span
 */
export function endSpan(span: Span, success = true): void {
  if (success) {
    span.setStatus({ code: SpanStatusCode.OK });
  } else {
    span.setStatus({ code: SpanStatusCode.ERROR });
  }

  span.end();

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Telemetry] Span ended`);
  }
}

/**
 * Record an exception in a span
 */
export function recordException(span: Span, error: Error): void {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Telemetry] Exception recorded:`, error);
  }
}
