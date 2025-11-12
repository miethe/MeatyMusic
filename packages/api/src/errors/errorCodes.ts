/**
 * @fileoverview Standard error codes using domain-action-error pattern
 *
 * Error codes follow the pattern: DOMAIN_ACTION_ERROR
 * - DOMAIN: The area of the application (AUTH, CATALOG, PROMPT, etc.)
 * - ACTION: The operation being performed (TOKEN, MODEL, CREATE, etc.)
 * - ERROR: The specific error type (EXPIRED, NOT_FOUND, FAILED, etc.)
 */

// Authentication & Authorization
export const AUTH_ERRORS = {
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
} as const;

// Catalog & Models
export const CATALOG_ERRORS = {
  CATALOG_MODEL_NOT_FOUND: 'CATALOG_MODEL_NOT_FOUND',
  CATALOG_MODEL_UNAVAILABLE: 'CATALOG_MODEL_UNAVAILABLE',
  CATALOG_FETCH_FAILED: 'CATALOG_FETCH_FAILED',
  CATALOG_PERMISSION_DENIED: 'CATALOG_PERMISSION_DENIED',
} as const;

// Prompt Management
export const PROMPT_ERRORS = {
  PROMPT_NOT_FOUND: 'PROMPT_NOT_FOUND',
  PROMPT_CREATE_FAILED: 'PROMPT_CREATE_FAILED',
  PROMPT_UPDATE_FAILED: 'PROMPT_UPDATE_FAILED',
  PROMPT_DELETE_FAILED: 'PROMPT_DELETE_FAILED',
  PROMPT_VALIDATION_FAILED: 'PROMPT_VALIDATION_FAILED',
  PROMPT_PERMISSION_DENIED: 'PROMPT_PERMISSION_DENIED',
  PROMPT_VERSION_CONFLICT: 'PROMPT_VERSION_CONFLICT',
} as const;

// User & Preferences
export const USER_ERRORS = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_PREFERENCES_UPDATE_FAILED: 'USER_PREFERENCES_UPDATE_FAILED',
  USER_ONBOARDING_FAILED: 'USER_ONBOARDING_FAILED',
  USER_PROFILE_UPDATE_FAILED: 'USER_PROFILE_UPDATE_FAILED',
} as const;

// Network & Infrastructure
export const NETWORK_ERRORS = {
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_CORS_ERROR: 'NETWORK_CORS_ERROR',
  NETWORK_DNS_ERROR: 'NETWORK_DNS_ERROR',
} as const;

// Rate Limiting & Throttling
export const RATE_LIMIT_ERRORS = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_QUOTA_EXCEEDED: 'RATE_LIMIT_QUOTA_EXCEEDED',
  RATE_LIMIT_DAILY_LIMIT: 'RATE_LIMIT_DAILY_LIMIT',
} as const;

// Server & Infrastructure
export const SERVER_ERRORS = {
  SERVER_INTERNAL_ERROR: 'SERVER_INTERNAL_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  SERVER_MAINTENANCE: 'SERVER_MAINTENANCE',
  SERVER_OVERLOADED: 'SERVER_OVERLOADED',
  SERVER_TIMEOUT: 'SERVER_TIMEOUT',
} as const;

// Validation & Input
export const VALIDATION_ERRORS = {
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_DUPLICATE_VALUE: 'VALIDATION_DUPLICATE_VALUE',
  VALIDATION_SCHEMA_MISMATCH: 'VALIDATION_SCHEMA_MISMATCH',
} as const;

// File Upload & Processing
export const FILE_ERRORS = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED: 'FILE_PROCESSING_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
} as const;

// Generic/Fallback errors
export const GENERIC_ERRORS = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  REQUEST_FAILED: 'REQUEST_FAILED',
  OPERATION_FAILED: 'OPERATION_FAILED',
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const;

// Consolidated error codes object
export const ERROR_CODES = {
  ...AUTH_ERRORS,
  ...CATALOG_ERRORS,
  ...PROMPT_ERRORS,
  ...USER_ERRORS,
  ...NETWORK_ERRORS,
  ...RATE_LIMIT_ERRORS,
  ...SERVER_ERRORS,
  ...VALIDATION_ERRORS,
  ...FILE_ERRORS,
  ...GENERIC_ERRORS,
} as const;

// Type definitions
export type AuthError = keyof typeof AUTH_ERRORS;
export type CatalogError = keyof typeof CATALOG_ERRORS;
export type PromptError = keyof typeof PROMPT_ERRORS;
export type UserError = keyof typeof USER_ERRORS;
export type NetworkError = keyof typeof NETWORK_ERRORS;
export type RateLimitError = keyof typeof RATE_LIMIT_ERRORS;
export type ServerError = keyof typeof SERVER_ERRORS;
export type ValidationError = keyof typeof VALIDATION_ERRORS;
export type FileError = keyof typeof FILE_ERRORS;
export type GenericError = keyof typeof GENERIC_ERRORS;

export type ErrorCode = keyof typeof ERROR_CODES;

// Utility functions
export function isAuthError(code: string): code is AuthError {
  return code in AUTH_ERRORS;
}

export function isNetworkError(code: string): code is NetworkError {
  return code in NETWORK_ERRORS;
}

export function isServerError(code: string): code is ServerError {
  return code in SERVER_ERRORS;
}

export function isRateLimitError(code: string): code is RateLimitError {
  return code in RATE_LIMIT_ERRORS;
}

export function isValidationError(code: string): code is ValidationError {
  return code in VALIDATION_ERRORS;
}

/**
 * Check if an error code indicates a retryable error
 */
export function isRetryableErrorCode(code: string): boolean {
  return (
    isNetworkError(code) ||
    isServerError(code) ||
    isRateLimitError(code) ||
    code === ERROR_CODES.SERVER_TIMEOUT ||
    code === ERROR_CODES.REQUEST_FAILED
  );
}

/**
 * Get the domain from an error code
 */
export function getErrorDomain(code: string): string {
  if (!code) return 'UNKNOWN';
  const parts = code.split('_');
  // If no underscores, return the whole code as domain
  // When code is empty string, return 'Unknown'
  const domain = parts.length > 1 ? parts[0] : code;
  return domain && domain.trim() !== '' ? domain : 'UNKNOWN';

}

/**
 * Get the action from an error code
 */
export function getErrorAction(code: string): string {
  const parts = code.split('_');
  return parts[1] || 'UNKNOWN';
}

/**
 * Get the error type from an error code
 */
export function getErrorType(code: string): string {
  const parts = code.split('_');
  return parts.slice(2).join('_') || 'UNKNOWN';
}
