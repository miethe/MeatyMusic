/**
 * @fileoverview Error code to user message mapping
 *
 * Maps backend error codes to user-friendly messages with recovery actions
 * and severity levels. Supports internationalization through message keys.
 */

import { ErrorResponse } from './ErrorResponse';
import { ERROR_CODES, ErrorCode, isRetryableErrorCode } from './errorCodes';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorAction =
  | 'retry'
  | 'retry_with_backoff'
  | 'redirect_login'
  | 'refresh_page'
  | 'contact_support'
  | 'go_back'
  | 'dismiss';

export interface UserErrorMessage {
  /** User-facing error message */
  userMessage: string;
  /** Recommended recovery action */
  action: ErrorAction;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Additional context or instructions */
  description?: string;
  /** Actionable button text */
  actionLabel?: string;
  /** Whether to show technical details */
  showDetails?: boolean;
}

/**
 * Error code to user message mapping
 */
const ERROR_MESSAGE_MAP: Record<string, UserErrorMessage> = {
  // Authentication Errors
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: {
    userMessage: 'Your session has expired',
    description: 'Please sign in again to continue',
    action: 'redirect_login',
    actionLabel: 'Sign In',
    severity: 'warning',
  },
  [ERROR_CODES.AUTH_TOKEN_INVALID]: {
    userMessage: 'Authentication failed',
    description: 'Your session appears to be invalid. Please sign in again.',
    action: 'redirect_login',
    actionLabel: 'Sign In',
    severity: 'error',
  },
  [ERROR_CODES.AUTH_TOKEN_MISSING]: {
    userMessage: 'Sign in required',
    description: 'You need to sign in to access this feature',
    action: 'redirect_login',
    actionLabel: 'Sign In',
    severity: 'info',
  },
  [ERROR_CODES.AUTH_PERMISSION_DENIED]: {
    userMessage: 'Access denied',
    description: "You don't have permission to perform this action",
    action: 'contact_support',
    actionLabel: 'Contact Support',
    severity: 'error',
  },

  // Catalog Errors
  [ERROR_CODES.CATALOG_MODEL_NOT_FOUND]: {
    userMessage: 'Model not found',
    description: 'The requested AI model could not be found or is no longer available',
    action: 'refresh_page',
    actionLabel: 'Refresh',
    severity: 'warning',
  },
  [ERROR_CODES.CATALOG_MODEL_UNAVAILABLE]: {
    userMessage: 'Model temporarily unavailable',
    description: 'This model is currently unavailable. Please try again later or choose a different model.',
    action: 'retry',
    actionLabel: 'Try Again',
    severity: 'warning',
  },

  // Prompt Errors
  [ERROR_CODES.PROMPT_NOT_FOUND]: {
    userMessage: 'Prompt not found',
    description: 'The prompt you\'re looking for doesn\'t exist or may have been deleted',
    action: 'go_back',
    actionLabel: 'Go Back',
    severity: 'error',
  },
  [ERROR_CODES.PROMPT_VALIDATION_FAILED]: {
    userMessage: 'Invalid prompt data',
    description: 'Please check your input and try again',
    action: 'dismiss',
    actionLabel: 'OK',
    severity: 'warning',
    showDetails: true,
  },
  [ERROR_CODES.PROMPT_VERSION_CONFLICT]: {
    userMessage: 'Prompt was modified',
    description: 'This prompt was modified by another user. Please refresh and try again.',
    action: 'refresh_page',
    actionLabel: 'Refresh',
    severity: 'warning',
  },

  // Network Errors
  [ERROR_CODES.NETWORK_CONNECTION_FAILED]: {
    userMessage: 'Connection failed',
    description: 'Please check your internet connection and try again',
    action: 'retry',
    actionLabel: 'Retry',
    severity: 'error',
  },
  [ERROR_CODES.NETWORK_TIMEOUT]: {
    userMessage: 'Request timed out',
    description: 'The request took too long to complete. Please try again.',
    action: 'retry',
    actionLabel: 'Try Again',
    severity: 'warning',
  },
  [ERROR_CODES.NETWORK_OFFLINE]: {
    userMessage: 'You\'re offline',
    description: 'Please check your internet connection',
    action: 'retry',
    actionLabel: 'Retry',
    severity: 'error',
  },
  [ERROR_CODES.NETWORK_CORS_ERROR]: {
    userMessage: 'Connection blocked',
    description: 'Your browser blocked this request. Please try refreshing the page.',
    action: 'refresh_page',
    actionLabel: 'Refresh',
    severity: 'error',
  },

  // Rate Limit Errors
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    userMessage: 'Too many requests',
    description: 'Please wait a moment before trying again',
    action: 'retry_with_backoff',
    actionLabel: 'Wait & Retry',
    severity: 'warning',
  },
  [ERROR_CODES.RATE_LIMIT_QUOTA_EXCEEDED]: {
    userMessage: 'Usage limit reached',
    description: 'You\'ve reached your usage limit. Please try again later or upgrade your plan.',
    action: 'contact_support',
    actionLabel: 'Learn More',
    severity: 'warning',
  },

  // Server Errors
  [ERROR_CODES.SERVER_INTERNAL_ERROR]: {
    userMessage: 'Something went wrong',
    description: 'We encountered an unexpected error. Our team has been notified.',
    action: 'retry',
    actionLabel: 'Try Again',
    severity: 'error',
  },
  [ERROR_CODES.SERVER_UNAVAILABLE]: {
    userMessage: 'Service temporarily unavailable',
    description: 'The service is temporarily down for maintenance. Please try again in a few minutes.',
    action: 'retry_with_backoff',
    actionLabel: 'Try Later',
    severity: 'warning',
  },
  [ERROR_CODES.SERVER_MAINTENANCE]: {
    userMessage: 'Scheduled maintenance',
    description: 'We\'re performing scheduled maintenance. Service will be restored shortly.',
    action: 'retry_with_backoff',
    actionLabel: 'Try Later',
    severity: 'info',
  },

  // Validation Errors
  [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: {
    userMessage: 'Required field missing',
    description: 'Please fill in all required fields',
    action: 'dismiss',
    actionLabel: 'OK',
    severity: 'warning',
    showDetails: true,
  },
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: {
    userMessage: 'Invalid input format',
    description: 'Please check the format of your input',
    action: 'dismiss',
    actionLabel: 'OK',
    severity: 'warning',
    showDetails: true,
  },

  // File Errors
  [ERROR_CODES.FILE_TOO_LARGE]: {
    userMessage: 'File too large',
    description: 'Please choose a smaller file',
    action: 'dismiss',
    actionLabel: 'OK',
    severity: 'warning',
    showDetails: true,
  },
  [ERROR_CODES.FILE_INVALID_TYPE]: {
    userMessage: 'Invalid file type',
    description: 'Please choose a supported file type',
    action: 'dismiss',
    actionLabel: 'OK',
    severity: 'warning',
    showDetails: true,
  },
};

/**
 * Default fallback message for unmapped errors
 */
const DEFAULT_ERROR_MESSAGE: UserErrorMessage = {
  userMessage: 'An unexpected error occurred',
  description: 'Please try again or contact support if the problem persists',
  action: 'retry',
  actionLabel: 'Try Again',
  severity: 'error',
};

/**
 * Map an error code to user-friendly message
 */
export function mapErrorToUserMessage(
  errorCode: string,
  context?: Record<string, any>
): UserErrorMessage {
  const mapping = ERROR_MESSAGE_MAP[errorCode] || DEFAULT_ERROR_MESSAGE;

  // Apply context-specific customizations
  if (context) {
    return applyContextToMessage(mapping, context);
  }

  return mapping;
}

/**
 * Map ErrorResponse to user message
 */
export function mapErrorResponseToUserMessage(
  error: ErrorResponse,
  context?: Record<string, any>
): UserErrorMessage & { traceId: string } {
  const userMessage = mapErrorToUserMessage(error.code, {
    ...context,
    ...error.details?.context,
    field: error.details?.field,
    suggestion: error.details?.suggestion,
  });

  return {
    ...userMessage,
    traceId: error.traceId,
  };
}

/**
 * Apply context-specific customizations to error message
 */
function applyContextToMessage(
  message: UserErrorMessage,
  context: Record<string, any>
): UserErrorMessage {
  let customized = { ...message };

  // Customize based on field errors
  if (context.field) {
    if (message.userMessage.includes('Required field')) {
      customized.userMessage = `${context.field} is required`;
    } else if (message.userMessage.includes('Invalid input')) {
      customized.userMessage = `Invalid ${context.field} format`;
    }
  }

  // Add suggestion from backend
  if (context.suggestion) {
    customized.description = `${customized.description || customized.userMessage}. ${context.suggestion}`;
  }

  // Customize timeout messages with duration
  if (context.timeout && message.userMessage.includes('timed out')) {
    customized.description = `Request timed out after ${Math.floor(context.timeout / 1000)} seconds. Please try again.`;
  }

  return customized;
}

/**
 * Get severity level from error code
 */
export function getErrorSeverity(errorCode: string): ErrorSeverity {
  const message = ERROR_MESSAGE_MAP[errorCode];
  return message?.severity || 'error';
}

/**
 * Check if error should trigger automatic retry
 */
export function shouldAutoRetry(errorCode: string): boolean {
  const message = ERROR_MESSAGE_MAP[errorCode];
  return (
    isRetryableErrorCode(errorCode) &&
    message?.action === 'retry'
  );
}

/**
 * Get recommended action for error
 */
export function getRecommendedAction(errorCode: string): ErrorAction {
  const message = ERROR_MESSAGE_MAP[errorCode];
  return message?.action || 'retry';
}

/**
 * Create a user-friendly error summary for logging
 */
export function createErrorSummary(error: ErrorResponse): string {
  const userMessage = mapErrorToUserMessage(error.code);
  return `${error.code}: ${userMessage.userMessage} (${error.traceId})`;
}
