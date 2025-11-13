/**
 * @fileoverview Enhanced error interceptor with standardized error handling
 *
 * Provides comprehensive error transformation, analytics tracking,
 * auth refresh logic, and circuit breaker pattern to prevent retry flooding.
 */

import { ResponseInterceptor, RequestConfig } from '../types/common';
import { ApiError, NetworkError, TimeoutError } from '../types/errors';
import { ErrorResponse, transformToErrorResponse, sanitizeErrorForLogging } from './ErrorResponse';
import { sanitizeErrorMessage } from '../utils/errorSanitization';
import { ERROR_CODES, isRetryableErrorCode } from './errorCodes';
import { mapErrorResponseToUserMessage } from './ErrorMapper';
import { generateCorrelationId } from '../utils/correlation';
import { CircuitBreakerFactory } from '../utils/circuitBreaker';

export interface ErrorInterceptorConfig {
  /** Function to refresh auth token */
  refreshAuthToken?: () => Promise<string | null>;
  /** Function to track analytics events */
  trackAnalytics?: (event: string, properties: Record<string, any>) => void;
  /** Function to show user notifications */
  showNotification?: (message: string, type: 'error' | 'warning' | 'info') => void;
  /** Maximum retry attempts for auth refresh */
  maxAuthRetries?: number;
  /** Circuit breaker threshold */
  circuitBreakerThreshold?: number;
  /** Circuit breaker reset timeout */
  circuitBreakerResetTime?: number;
  /** Whether to log errors to console */
  enableConsoleLogging?: boolean;
}

/**
 * Circuit breaker state for preventing retry flooding
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private resetTime: number = 60000 // 1 minute
  ) {}

  canExecute(): boolean {
    if (this.state === 'closed') return true;

    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTime) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }

    // half-open: allow one request through
    return true;
  }

  onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    } else if (this.state === 'half-open') {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Add ErrorCode type - can be any of our predefined codes or any string
type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES] | string;

// Map HTTP status codes to error codes
const statusToErrorCodeMap: Record<number, string> = {
  400: ERROR_CODES.VALIDATION_SCHEMA_MISMATCH,
  401: ERROR_CODES.AUTH_TOKEN_EXPIRED,
  403: ERROR_CODES.AUTH_PERMISSION_DENIED,
  404: ERROR_CODES.REQUEST_FAILED,
  429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  500: ERROR_CODES.SERVER_INTERNAL_ERROR,
  502: ERROR_CODES.SERVER_UNAVAILABLE,
  503: ERROR_CODES.SERVER_UNAVAILABLE,
  504: ERROR_CODES.SERVER_TIMEOUT,
};

// Common error messages for frequently used error codes
const COMMON_ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  [ERROR_CODES.VALIDATION_SCHEMA_MISMATCH]: 'Invalid request',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication required',
  [ERROR_CODES.AUTH_PERMISSION_DENIED]: 'Access forbidden',
  [ERROR_CODES.REQUEST_FAILED]: 'Resource not found',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests',
  [ERROR_CODES.SERVER_INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.SERVER_UNAVAILABLE]: 'Service unavailable',
  [ERROR_CODES.SERVER_TIMEOUT]: 'Gateway timeout',
  [ERROR_CODES.NETWORK_CONNECTION_FAILED]: 'Network connection failed',
  [ERROR_CODES.NETWORK_TIMEOUT]: 'Request timed out',
  [ERROR_CODES.NETWORK_CORS_ERROR]: 'CORS policy blocked request',
  [ERROR_CODES.NETWORK_OFFLINE]: 'Network offline',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An error occurred',
};

/**
 * Generate a user-friendly message from an error code
 */
function generateDefaultMessage(code: string): string {
  // Split error code into parts and generate a readable message
  const parts = code.split('_');
  if (parts.length < 2) {
    // For single word codes or unknown formats, return a generic message
    return code ? `${code.toLowerCase()} error occurred` : 'An error occurred';
  }

  const domain = parts[0].toLowerCase();
  const errorType = parts[parts.length - 1].toLowerCase();

  // Generate contextual messages based on domain and error type
  switch (errorType) {
    case 'failed':
      return `${domain} operation failed`;
    case 'expired':
      return `${domain} session expired`;
    case 'invalid':
      return `Invalid ${domain} data`;
    case 'missing':
      return `${domain} information missing`;
    case 'denied':
      return `${domain} access denied`;
    case 'exceeded':
      return `${domain} limit exceeded`;
    case 'unavailable':
      return `${domain} service unavailable`;
    case 'timeout':
      return `${domain} request timed out`;
    case 'error':
      return `${domain} error occurred`;
    case 'not_found':
    case 'notfound':
      return `${domain} not found`;
    default:
      return `${domain} error: ${errorType}`;
  }
}

function getDefaultErrorMessageForCode(code: string): string {
  // First check explicit mappings for known codes
  if (code in COMMON_ERROR_MESSAGES) {
    return COMMON_ERROR_MESSAGES[code as keyof typeof COMMON_ERROR_MESSAGES]!;
  }

  // Generate a reasonable default message
  return generateDefaultMessage(code);
}

/**
 * Create enhanced error interceptor
 */
export function createErrorInterceptor(config: ErrorInterceptorConfig = {}): ResponseInterceptor {
  const {
    refreshAuthToken,
    trackAnalytics,
    showNotification,
    maxAuthRetries = 1,
    circuitBreakerThreshold = 5,
    circuitBreakerResetTime = 60000,
    enableConsoleLogging = true
  } = config;

  const circuitBreaker = new CircuitBreaker(circuitBreakerThreshold, circuitBreakerResetTime);
  const authRetryAttempts = new Map<string, number>();

  return {
    onFulfilled: (response: Response) => {
      // Reset circuit breaker on successful requests
      circuitBreaker.onSuccess();
      return response;
    },

    onRejected: async (error: any) => {
      // Check circuit breaker
      if (!circuitBreaker.canExecute()) {
        const circuitError = transformToErrorResponse(
          new Error('Service temporarily unavailable due to repeated failures'),
          ERROR_CODES.SERVER_UNAVAILABLE,
          extractCorrelationId(error)
        );

        trackError(circuitError, { event: 'circuit_breaker_open' }, trackAnalytics);
        throw createApiErrorFromResponse(circuitError);
      }

      // Transform error to standard format
      const standardError = await transformError(error);

      // Prevent refetch loop: If error is unrecoverable (Response mutation errors), trip circuit breaker and do not retry
      if (
        standardError.code === 'TYPEERROR' &&
        typeof standardError.message === 'string' &&
        (standardError.message.includes('Cannot set property url of #<Response>') ||
         standardError.message.includes('Cannot set property') && standardError.message.includes('Response') ||
         standardError.message.includes('read-only') && standardError.message.includes('Response'))
      ) {
        circuitBreaker.onFailure();
        if (enableConsoleLogging) {
          console.error('[API Error] Response mutation error - preventing retries:', sanitizeErrorForLogging(standardError));
        }
        trackError(standardError, { ...getErrorContext(error), event: 'response_mutation_error' }, trackAnalytics);

        // Create a non-retryable error
        const nonRetryableError = createApiErrorFromResponse({
          ...standardError,
          code: 'RESPONSE_MUTATION_ERROR',
          message: 'Internal API client error - request cannot be retried'
        });
        (nonRetryableError as any).isRetryable = false;
        throw nonRetryableError;
      }

      // Handle METHOD_BINDING_ERROR - never retry and open circuit breaker
      if (standardError.code === 'METHOD_BINDING_ERROR') {
        // Open method binding circuit breaker
        const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
        methodBindingBreaker.forceOpen();

        // Also trip the general circuit breaker to prevent cascade failures
        circuitBreaker.onFailure();

        if (enableConsoleLogging) {
          console.error('[API Error] METHOD_BINDING_ERROR detected - preventing all retries:', sanitizeErrorForLogging(standardError));
        }

        trackError(standardError, { ...getErrorContext(error), event: 'method_binding_error' }, trackAnalytics);

        // Create a non-retryable error
        const nonRetryableError = createApiErrorFromResponse({
          ...standardError,
          message: 'API client method binding error - this request cannot be retried'
        });
        (nonRetryableError as any).isRetryable = false;
        throw nonRetryableError;
      }

      // Handle auth errors with refresh attempt
      if (shouldAttemptAuthRefresh(standardError, authRetryAttempts, maxAuthRetries)) {
        try {
          const newToken = await refreshAuthToken?.();
          if (newToken) {
            // Mark as successful auth refresh
            authRetryAttempts.delete(standardError.traceId);
            circuitBreaker.onSuccess();

            // Re-throw with retry indication
            const retryError = createApiErrorFromResponse({
              ...standardError,
              code: 'AUTH_REFRESH_SUCCESS'
            });
            (retryError as any).shouldRetry = true;
            throw retryError;
          }
        } catch (refreshError) {
          // Auth refresh failed, continue with original error
          if (enableConsoleLogging) {
            console.warn('Auth token refresh failed:', refreshError);
          }
        }
      }

      // Track circuit breaker failure (but not for non-retryable errors)
      if (isRetryableErrorCode(standardError.code) &&
          standardError.code !== 'METHOD_BINDING_ERROR' &&
          standardError.code !== 'RESPONSE_MUTATION_ERROR') {
        circuitBreaker.onFailure();
      }

      // Log error
      if (enableConsoleLogging) {
        console.error('[API Error]', sanitizeErrorForLogging(standardError));
      }

      // Track analytics
      trackError(standardError, getErrorContext(error), trackAnalytics);

      // Show user notification for certain errors
      showUserNotification(standardError, showNotification);

      // Throw standardized API error
      throw createApiErrorFromResponse(standardError);
    }
  };
}

/**
 * Transform any error into standardized ErrorResponse
 */
async function transformError(error: any): Promise<ErrorResponse> {
  const correlationId = extractCorrelationId(error);

  // Handle method binding errors ("Illegal invocation")
  if (error instanceof TypeError && error.message.includes('Illegal invocation')) {
    // Trip the method binding circuit breaker with shorter timeout for faster recovery
    const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
    methodBindingBreaker.forceOpen(5000); // 5 second timeout instead of default

    return transformToErrorResponse(
      {
        code: 'METHOD_BINDING_ERROR',
        message: 'API client method binding error detected. Service cache has been cleared. Please retry in a few moments.',
        recoveryHints: {
          suggestedAction: 'RETRY_AFTER_CACHE_CLEAR',
          retryDelayMs: 2000,
          autoRecovery: true
        }
      },
      'METHOD_BINDING_ERROR',
      correlationId
    );
  }

  // Handle explicit METHOD_BINDING_ERROR
  if ((error?.code === 'METHOD_BINDING_ERROR') ||
      (error?.message && typeof error.message === 'string' && error.message.includes('METHOD_BINDING_ERROR'))) {
    // Trip the method binding circuit breaker with fast recovery
    const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
    methodBindingBreaker.forceOpen(5000); // 5 second timeout for faster recovery

    return transformToErrorResponse(
      {
        code: 'METHOD_BINDING_ERROR',
        message: 'API client method binding error detected. Service will attempt automatic recovery.',
        recoveryHints: {
          suggestedAction: 'AUTO_RECOVERY_IN_PROGRESS',
          retryDelayMs: 3000,
          autoRecovery: true,
          userActionRequired: false
        }
      },
      'METHOD_BINDING_ERROR',
      correlationId
    );
  }

  // Handle fetch/network errors - but not if we have a response (which means the request succeeded)
  if (error instanceof TypeError) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return transformToErrorResponse(
        { code: ERROR_CODES.NETWORK_CONNECTION_FAILED, message: error.message },
        ERROR_CODES.NETWORK_CONNECTION_FAILED,
        correlationId
      );
    }
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error instanceof TimeoutError) {
    return transformToErrorResponse(
      { code: ERROR_CODES.NETWORK_TIMEOUT, message: 'Request timed out' },
      ERROR_CODES.NETWORK_TIMEOUT,
      correlationId
    );
  }

  // Handle CORS errors
  if (isCorsError(error)) {
    return transformToErrorResponse(
      { code: ERROR_CODES.NETWORK_CORS_ERROR, message: 'CORS policy blocked request' },
      ERROR_CODES.NETWORK_CORS_ERROR,
      correlationId
    );
  }

  // Handle HTTP response errors
  if (error?.response) {
    return await transformHttpError(error, correlationId);
  }

  // Handle already processed API errors
  if (error instanceof ApiError) {
    return transformToErrorResponse(error, error.code || ERROR_CODES.UNKNOWN_ERROR, correlationId);
  }

  // Default transformation
  return transformToErrorResponse(error, ERROR_CODES.UNKNOWN_ERROR, correlationId);
}

/**
 * Transform HTTP response errors
 */
async function transformHttpError(error: any, correlationId?: string): Promise<ErrorResponse> {
  const response = error.response;
  const status = response?.status;

  // Try to parse error response body
  let errorData: any = null;
  try {
    if (response?.data) {
      errorData = response.data;
    } else {
      const text = await response?.text?.();
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch {
          // If parsing fails, treat text as the error message
          errorData = { message: text };
        }
      }
    }
  } catch {
    // Ignore parse errors, use fallback
  }

  // Use mapping for errorCode
  let errorCode: string = statusToErrorCodeMap[status] || ERROR_CODES.UNKNOWN_ERROR;
  let message = getDefaultErrorMessageForCode(errorCode);

  // Extract error details from response
  if (errorData?.error) {
    // Accept any error code from response, not just predefined ones
    if (errorData.error.code) {
      errorCode = errorData.error.code;
      message = getDefaultErrorMessageForCode(errorCode);
    }
    if (errorData.error.message) {
      message = sanitizeErrorMessage(errorData.error.message, message);
    }
  } else if (errorData?.message) {
    message = sanitizeErrorMessage(errorData.message, message);
  } else if (error.message && typeof error.message === 'string') {
    // Only use error.message if it's a string and doesn't look like request metadata
    const errorMessageStr = error.message;
    if (!errorMessageStr.includes('"method"') && !errorMessageStr.includes('"url"') && !errorMessageStr.includes('"startTime"')) {
      message = sanitizeErrorMessage(errorMessageStr, message);
    }
  }

  // If we still don't have a meaningful message and have status, use status-based message
  if (!message || message === getDefaultErrorMessageForCode(errorCode)) {
    if (status === 404) {
      message = 'Resource not found';
    } else if (status === 401) {
      message = 'Authentication required';
    } else if (status === 403) {
      message = 'Access forbidden';
    } else if (status >= 500) {
      message = 'Server error occurred';
    } else if (status >= 400) {
      message = 'Client error occurred';
    } else {
      message = getDefaultErrorMessageForCode(errorCode);
    }
  }

  return transformToErrorResponse(
    {
      code: errorCode,
      message,
      details: errorData?.error?.details || errorData?.details,
      status
    },
    errorCode,
    correlationId
  );
}

/**
 * Check if error is a CORS error
 */
function isCorsError(error: any): boolean {
  return (
    error?.message?.includes('CORS') ||
    error?.message?.includes('cors') ||
    error?.type === 'cors' ||
    (error?.response?.status === 0 && !error?.response?.statusText)
  );
}

/**
 * Extract correlation ID from error
 */
function extractCorrelationId(error: any): string | undefined {
  // First try to get correlationId from Symbol-based metadata
  const metadata = error?.[ERROR_METADATA] as ErrorMetadata | undefined;
  if (metadata?.correlationId) {
    return metadata.correlationId;
  }

  // Fallback to legacy approach
  return (
    error?.correlationId ||
    error?.traceId ||
    error?.requestId ||
    error?.config?.correlationId ||
    (error as any)?.response?.headers?.['x-correlation-id'] ||
    (error as any)?.response?.headers?.['x-request-id']
  );
}

/**
 * Check if we should attempt auth refresh
 */
function shouldAttemptAuthRefresh(
  error: ErrorResponse,
  retryAttempts: Map<string, number>,
  maxRetries: number
): boolean {
  if (error.code !== ERROR_CODES.AUTH_TOKEN_EXPIRED) {
    return false;
  }

  const attempts = retryAttempts.get(error.traceId) || 0;
  if (attempts >= maxRetries) {
    return false;
  }

  retryAttempts.set(error.traceId, attempts + 1);
  return true;
}

// Symbol for accessing metadata (must match the one in base-client.ts)
const ERROR_METADATA = Symbol('errorMetadata');

interface ErrorMetadata {
  method?: string;
  url?: string;
  startTime?: number;
  correlationId?: string;
}

/**
 * Get error context for analytics
 */
function getErrorContext(error: any): Record<string, any> {
  // First try to get metadata from Symbol (new approach - prevents serialization)
  const metadata = error?.[ERROR_METADATA] as ErrorMetadata | undefined;
  if (metadata) {
    return {
      url: metadata.url,
      method: metadata.method,
      startTime: metadata.startTime,
      correlationId: metadata.correlationId,
      status: error?.response?.status || error?.status,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback to legacy approach for backwards compatibility
  let url: string | undefined = undefined;
  if (error?.config?.url) {
    url = error.config.url;
  } else if (typeof error?.url === 'string') {
    url = error.url;
  } else if (error?.response && typeof error.response.url === 'string') {
    url = error.response.url;
  }

  let method: string | undefined = undefined;
  if (error?.config?.method) {
    method = error.config.method;
  } else if (typeof error?.method === 'string') {
    method = error.method;
  } else if (error?.response && typeof error.response.method === 'string') {
    method = error.response.method;
  }

  let status: number | undefined = undefined;
  if (error?.response && typeof error.response.status === 'number') {
    status = error.response.status;
  } else if (typeof error?.status === 'number') {
    status = error.status;
  }

  return {
    url,
    method,
    status,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Track error analytics
 */
function trackError(
  error: ErrorResponse,
  context: Record<string, any>,
  trackAnalytics?: (event: string, properties: Record<string, any>) => void
): void {
  if (!trackAnalytics) return;

  try {
    trackAnalytics('api.error', {
      error_code: error.code,
      error_message: error.message,
      status_code: error.status,
      trace_id: error.traceId,
      endpoint: context.url,
      method: context.method,
      timestamp: error.timestamp,
      ...context,
    });
  } catch (trackingError) {
    console.warn('Failed to track error analytics:', trackingError);
  }
}

/**
 * Show user notification for certain error types
 */
function showUserNotification(
  error: ErrorResponse,
  showNotification?: (message: string, type: 'error' | 'warning' | 'info') => void
): void {
  if (!showNotification) return;

  const userMessage = mapErrorResponseToUserMessage(error);

  // Only show notifications for certain error types
  if ([
    ERROR_CODES.NETWORK_CONNECTION_FAILED,
    ERROR_CODES.NETWORK_OFFLINE,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ERROR_CODES.AUTH_TOKEN_EXPIRED,
  ].includes(error.code as any)) {
    showNotification(userMessage.userMessage, userMessage.severity as any);
  }
}

/**
 * Create API error from ErrorResponse
 */
export function createApiErrorFromResponse(errorResponse: ErrorResponse): ApiError & { shouldRetry?: boolean } {
  const message = sanitizeErrorMessage(errorResponse.message, 'An error occurred');
  const apiError = new ApiError(
    message,
    errorResponse.status || 500,
    errorResponse.code,
    errorResponse.details,
    errorResponse.traceId
  ) as ApiError & { shouldRetry?: boolean };

  return apiError;
}
