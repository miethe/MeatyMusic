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
      return new ApplicationError({
        code: errorData.error || 'UNKNOWN_ERROR',
        message: errorData.detail || errorData.error || 'An error occurred',
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
