/**
 * @fileoverview Error handling utilities and types
 *
 * Centralized exports for all error-related functionality
 * including error envelopes, interceptors, mapping, and codes.
 */

// Core error types and utilities
export type { ErrorResponse } from './ErrorResponse';
export {
  transformToErrorResponse,
  isErrorResponse,
  extractTraceId,
  sanitizeErrorForLogging,
} from './ErrorResponse';

// Error codes
export {
  ERROR_CODES,
  AUTH_ERRORS,
  CATALOG_ERRORS,
  PROMPT_ERRORS,
  USER_ERRORS,
  NETWORK_ERRORS,
  RATE_LIMIT_ERRORS,
  SERVER_ERRORS,
  VALIDATION_ERRORS,
  FILE_ERRORS,
  GENERIC_ERRORS,
  isAuthError,
  isNetworkError,
  isServerError,
  isRateLimitError,
  isValidationError,
  isRetryableErrorCode,
  getErrorDomain,
  getErrorAction,
  getErrorType,
} from './errorCodes';

// Error mapping to user messages
export type {
  ErrorSeverity,
  ErrorAction,
  UserErrorMessage
} from './ErrorMapper';
export {
  mapErrorToUserMessage,
  mapErrorResponseToUserMessage,
  getErrorSeverity,
  shouldAutoRetry,
  getRecommendedAction,
  createErrorSummary,
} from './ErrorMapper';

// Error interceptor
export type { ErrorInterceptorConfig } from './ErrorInterceptor';
export { createErrorInterceptor } from './ErrorInterceptor';

// Type definitions for common error patterns
export type {
  AuthError,
  CatalogError,
  PromptError,
  UserError,
  NetworkError,
  RateLimitError,
  ServerError,
  ValidationError,
  FileError,
  GenericError,
  ErrorCode,
} from './errorCodes';
