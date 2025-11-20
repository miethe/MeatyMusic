/**
 * Error handler utilities
 */

import { ApplicationError, ERROR_CODES } from './types';

/**
 * Backend API error response structure
 * Backend: app/schemas/common.py - ErrorResponse
 */
interface BackendErrorResponse {
  error: string;
  detail?: string;
  field?: string;
}

/**
 * Parse API error response
 */
export function parseApiError(error: unknown): ApplicationError {
  // Axios error with response
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const response = error.response as { data: BackendErrorResponse; status: number };
    const errorData = response.data;

    if (errorData) {
      // Map HTTP status codes to error codes
      let errorCode = errorData.error || 'UNKNOWN_ERROR';

      if (response.status === 401) {
        errorCode = ERROR_CODES.UNAUTHORIZED;
      } else if (response.status === 403) {
        errorCode = ERROR_CODES.FORBIDDEN;
      } else if (response.status === 404) {
        errorCode = ERROR_CODES.NOT_FOUND;
      }

      return new ApplicationError({
        code: errorCode,
        message: errorData.detail || errorData.error || getDefaultErrorMessage(response.status),
        details: errorData.field ? { field: errorData.field } : undefined,
        status: response.status,
      });
    }
  }

  // Network error
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'ERR_NETWORK'
  ) {
    return new ApplicationError({
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Network error. Please check your internet connection.',
    });
  }

  // Timeout error
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'ECONNABORTED'
  ) {
    return new ApplicationError({
      code: ERROR_CODES.TIMEOUT,
      message: 'Request timed out. Please try again.',
    });
  }

  // Generic error
  return new ApplicationError({
    code: ERROR_CODES.INTERNAL_ERROR,
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  });
}

/**
 * Get default error message for HTTP status codes
 */
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'You are not authenticated. Please sign in.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict with existing data.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Internal server error. Please try again.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred';
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApplicationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a 403 Forbidden error
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof ApplicationError) {
    return error.status === 403 || error.code === ERROR_CODES.FORBIDDEN;
  }
  return false;
}

/**
 * Check if error is a 401 Unauthorized error
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof ApplicationError) {
    return error.status === 401 || error.code === ERROR_CODES.UNAUTHORIZED;
  }
  return false;
}

/**
 * Check if error should trigger retry
 */
export function shouldRetry(error: ApplicationError): boolean {
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.SERVICE_UNAVAILABLE,
    ERROR_CODES.GATEWAY_TIMEOUT,
  ];

  return retryableCodes.includes(error.code as (typeof retryableCodes)[number]);
}
