/**
 * @fileoverview Standardized error response envelope
 *
 * Defines the standard error response format used across all API clients
 * with consistent structure for debugging and user-facing error handling.
 */

import { generateCorrelationId } from '../utils/correlation';
import { sanitizeErrorMessage } from '../utils/errorSanitization';

/**
 * Standard error response envelope
 */
export interface ErrorResponse {
  /** Domain-specific error code (e.g., AUTH_TOKEN_EXPIRED, CATALOG_MODEL_NOT_FOUND) */
  code: string;
  /** Human-readable error message for logging/debugging */
  message: string;
  /** Additional error context and details */
  details?: {
    /** Field name for validation errors */
    field?: string;
    /** Invalid value for validation errors */
    value?: any;
    /** Suggestion for error recovery */
    suggestion?: string;
    /** Additional context data */
    context?: Record<string, any>;
  };
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** Correlation ID for request tracing */
  traceId: string;
  /** HTTP status code */
  status?: number;
}

/**
 * Transform any error into standardized ErrorResponse format
 */
export function transformToErrorResponse(
  error: any,
  fallbackCode = 'UNKNOWN_ERROR',
  correlationId?: string
): ErrorResponse {
  const traceId = correlationId || generateCorrelationId() || 'UNKNOWN_TRACE_ID';
  const timestamp = new Date().toISOString();

  // If already an ErrorResponse, ensure it has all required fields
  if (isErrorResponse(error)) {
    return {
      ...error,
      traceId: error.traceId || traceId,
      timestamp: error.timestamp || timestamp
    };
  }

  // Handle API errors with structured data
  if (error?.response?.data?.error) {
    const apiError = error.response.data.error;
    return {
      code: apiError.code || fallbackCode,
      message: apiError.message || error.message || 'An error occurred',
      details: apiError.details,
      timestamp,
      traceId,
      status: error.response?.status
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: error.name === 'Error' ? fallbackCode : error.name.toUpperCase(),
      message: sanitizeErrorMessage(error.message, 'An unexpected error occurred'),
      timestamp,
      traceId,
      status: (error as any).status || (error as any).statusCode
    };
  }

  // Handle plain objects with error properties
  if (typeof error === 'object' && error !== null) {
    // Extract meaningful error message, avoiding request metadata
    let errorMessage = 'An error occurred';

    if (error.message && typeof error.message === 'string') {
      errorMessage = error.message;
    } else if (error.msg && typeof error.msg === 'string') {
      errorMessage = error.msg;
    } else if (error.statusText && typeof error.statusText === 'string') {
      errorMessage = `HTTP ${error.status || 'Error'}: ${error.statusText}`;
    }
    // Don't fall back to using the entire error object as message

    return {
      code: error.code || error.name || fallbackCode,
      message: sanitizeErrorMessage(errorMessage, 'An error occurred'),
      details: error.details || error.data,
      timestamp,
      traceId,
      status: error.status || error.statusCode
    };
  }

  // Handle primitive values
  return {
    code: fallbackCode,
    message: sanitizeErrorMessage(error, 'An unexpected error occurred'),
    timestamp,
    traceId
  };
}

/**
 * Type guard to check if object is ErrorResponse
 */
export function isErrorResponse(obj: any): obj is ErrorResponse {
  return Boolean(
    obj &&
    typeof obj === 'object' &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string'
  );
}

/**
 * Extract correlation/trace ID from various error formats
 */
export function extractTraceId(error: any): string | undefined {
  if (isErrorResponse(error)) {
    return error.traceId;
  }

  // Check common correlation ID fields
  return (
    error?.traceId ||
    error?.correlationId ||
    error?.requestId ||
    error?.id ||
    error?.response?.headers?.['x-request-id'] ||
    error?.response?.headers?.['x-correlation-id']
  );
}

/**
 * Sanitize error for safe logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: ErrorResponse): ErrorResponse {
  // Create a copy to avoid mutating the original
  const sanitized = { ...error };

  // Remove sensitive fields from message and details
  if (sanitized.message) {
    sanitized.message = sanitized.message
      .replace(/token[s]?[:\s=]+[^\s]+/gi, 'token=***')
      .replace(/password[s]?[:\s=]+[^\s]+/gi, 'password=***')
      .replace(/key[s]?[:\s=]+[^\s]+/gi, 'key=***')
      .replace(/secret[s]?[:\s=]+[^\s]+/gi, 'secret=***');
  }

  // Recursively sanitize details
  if (sanitized.details) {
    sanitized.details = sanitizeObject(sanitized.details);
  }

  return sanitized;
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive fields entirely
    if (lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth')) {
      sanitized[key] = '***';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
