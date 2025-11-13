/**
 * @fileoverview Main entry point for @meaty/api package
 *
 * This module exports the centralized API client and all related types
 * for consistent HTTP communication across MeatyPrompts applications.
 */

export { ApiClient, createApiClient } from './client/base-client';
export {
  ApiError,
  TimeoutError,
  NetworkError,
  ValidationError
} from './types/errors';
export type {
  ApiConfig,
  RequestOptions,
  PaginatedResponse,
  ErrorResponse as LegacyErrorResponse
} from './types/common';

// New error handling utilities
export type {
  ErrorResponse,
  ErrorSeverity,
  ErrorAction,
  UserErrorMessage,
  ErrorCode,
  ErrorInterceptorConfig
} from './errors';
export {
  ERROR_CODES,
  transformToErrorResponse,
  mapErrorToUserMessage,
  mapErrorResponseToUserMessage,
  createErrorInterceptor,
  isRetryableErrorCode,
  sanitizeErrorForLogging
} from './errors';

// Service modules
export * from './services/catalog';
export * from './services/user-preferences';
export * from './services/prompts';

// Re-export utilities that might be needed
export { generateCorrelationId } from './utils/correlation';
export { CircuitBreakerFactory, CircuitBreakerError } from './utils/circuitBreaker';
