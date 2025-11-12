/**
 * OpenTelemetry instrumentation for Next.js
 * This file is automatically loaded when instrumentationHook is enabled
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    const { trace } = await import('@opentelemetry/api');

    // Initialize tracer for server components
    trace.getTracer('meatymusic-web-server', '0.1.0');

    // Log initialization
    console.log('[MeatyMusic Web] Server-side OpenTelemetry instrumentation registered');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    const { trace } = await import('@opentelemetry/api');

    // Initialize tracer for edge functions
    trace.getTracer('meatymusic-web-edge', '0.1.0');

    // Log initialization
    console.log('[MeatyMusic Web] Edge runtime OpenTelemetry instrumentation registered');
  }
}
