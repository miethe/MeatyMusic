/**
 * @fileoverview Tests for ErrorMapper functionality
 */

import {
  mapErrorToUserMessage,
  mapErrorResponseToUserMessage,
  getErrorSeverity,
  shouldAutoRetry,
  getRecommendedAction,
  createErrorSummary,
  UserErrorMessage,
} from '../ErrorMapper';
import { ErrorResponse } from '../ErrorResponse';
import { ERROR_CODES } from '../errorCodes';

describe('ErrorMapper', () => {
  describe('mapErrorToUserMessage', () => {
    it('should map known error codes to user messages', () => {
      const result = mapErrorToUserMessage(ERROR_CODES.AUTH_TOKEN_EXPIRED);

      expect(result.userMessage).toBe('Your session has expired');
      expect(result.description).toBe('Please sign in again to continue');
      expect(result.action).toBe('redirect_login');
      expect(result.severity).toBe('warning');
      expect(result.actionLabel).toBe('Sign In');
    });

    it('should return default message for unknown error codes', () => {
      const result = mapErrorToUserMessage('UNKNOWN_CUSTOM_ERROR');

      expect(result.userMessage).toBe('An unexpected error occurred');
      expect(result.description).toBe('Please try again or contact support if the problem persists');
      expect(result.action).toBe('retry');
      expect(result.severity).toBe('error');
    });

    it('should apply context to customize messages', () => {
      const result = mapErrorToUserMessage(ERROR_CODES.VALIDATION_REQUIRED_FIELD, {
        field: 'email'
      });

      expect(result.userMessage).toBe('email is required');
    });

    it('should include suggestions from context', () => {
      const result = mapErrorToUserMessage(ERROR_CODES.CATALOG_MODEL_NOT_FOUND, {
        suggestion: 'Try refreshing the model list'
      });

      expect(result.description).toContain('Try refreshing the model list');
    });

    it('should customize timeout messages with duration', () => {
      const result = mapErrorToUserMessage(ERROR_CODES.NETWORK_TIMEOUT, {
        timeout: 30000
      });

      expect(result.description).toContain('30 seconds');
    });
  });

  describe('mapErrorResponseToUserMessage', () => {
    it('should map ErrorResponse to user message with trace ID', () => {
      const errorResponse: ErrorResponse = {
        code: ERROR_CODES.PROMPT_NOT_FOUND,
        message: 'Prompt not found in database',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace-123'
      };

      const result = mapErrorResponseToUserMessage(errorResponse);

      expect(result.userMessage).toBe('Prompt not found');
      expect(result.traceId).toBe('test-trace-123');
      expect(result.action).toBe('go_back');
    });

    it('should include error details in context', () => {
      const errorResponse: ErrorResponse = {
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        message: 'Invalid email format',
        details: {
          field: 'email',
          suggestion: 'Use a valid email address'
        },
        timestamp: new Date().toISOString(),
        traceId: 'test-trace-123'
      };

      const result = mapErrorResponseToUserMessage(errorResponse);

      expect(result.userMessage).toBe('Invalid email format');
      expect(result.description).toContain('Use a valid email address');
    });
  });

  describe('getErrorSeverity', () => {
    it('should return correct severity for known errors', () => {
      expect(getErrorSeverity(ERROR_CODES.AUTH_TOKEN_EXPIRED)).toBe('warning');
      expect(getErrorSeverity(ERROR_CODES.SERVER_INTERNAL_ERROR)).toBe('error');
      expect(getErrorSeverity(ERROR_CODES.RATE_LIMIT_EXCEEDED)).toBe('warning');
      expect(getErrorSeverity(ERROR_CODES.SERVER_MAINTENANCE)).toBe('info');
    });

    it('should return default severity for unknown errors', () => {
      expect(getErrorSeverity('UNKNOWN_ERROR_CODE')).toBe('error');
    });
  });

  describe('shouldAutoRetry', () => {
    it('should return true for retryable network errors', () => {
      expect(shouldAutoRetry(ERROR_CODES.NETWORK_CONNECTION_FAILED)).toBe(true);
      expect(shouldAutoRetry(ERROR_CODES.NETWORK_TIMEOUT)).toBe(true);
      expect(shouldAutoRetry(ERROR_CODES.SERVER_INTERNAL_ERROR)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(shouldAutoRetry(ERROR_CODES.AUTH_TOKEN_EXPIRED)).toBe(false);
      expect(shouldAutoRetry(ERROR_CODES.VALIDATION_REQUIRED_FIELD)).toBe(false);
      expect(shouldAutoRetry(ERROR_CODES.PROMPT_NOT_FOUND)).toBe(false);
    });

    it('should return false for rate limit errors that need backoff', () => {
      expect(shouldAutoRetry(ERROR_CODES.RATE_LIMIT_EXCEEDED)).toBe(false);
    });
  });

  describe('getRecommendedAction', () => {
    it('should return correct actions for different error types', () => {
      expect(getRecommendedAction(ERROR_CODES.AUTH_TOKEN_EXPIRED)).toBe('redirect_login');
      expect(getRecommendedAction(ERROR_CODES.NETWORK_CONNECTION_FAILED)).toBe('retry');
      expect(getRecommendedAction(ERROR_CODES.RATE_LIMIT_EXCEEDED)).toBe('retry_with_backoff');
      expect(getRecommendedAction(ERROR_CODES.VALIDATION_REQUIRED_FIELD)).toBe('dismiss');
    });

    it('should return default action for unknown errors', () => {
      expect(getRecommendedAction('UNKNOWN_ERROR_CODE')).toBe('retry');
    });
  });

  describe('createErrorSummary', () => {
    it('should create concise error summary', () => {
      const errorResponse: ErrorResponse = {
        code: ERROR_CODES.CATALOG_MODEL_NOT_FOUND,
        message: 'Model gpt-5 not found in catalog',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace-123'
      };

      const summary = createErrorSummary(errorResponse);

      expect(summary).toBe('CATALOG_MODEL_NOT_FOUND: Model not found (test-trace-123)');
    });

    it('should handle errors with no mapped message', () => {
      const errorResponse: ErrorResponse = {
        code: 'CUSTOM_ERROR_CODE',
        message: 'Custom error occurred',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace-456'
      };

      const summary = createErrorSummary(errorResponse);

      expect(summary).toBe('CUSTOM_ERROR_CODE: An unexpected error occurred (test-trace-456)');
    });
  });

  describe('context application', () => {
    it('should customize validation error messages with field names', () => {
      const invalidFormatResult = mapErrorToUserMessage(ERROR_CODES.VALIDATION_INVALID_FORMAT, {
        field: 'phoneNumber'
      });

      expect(invalidFormatResult.userMessage).toBe('Invalid phoneNumber format');
    });

    it('should not modify unrelated error messages', () => {
      const networkResult = mapErrorToUserMessage(ERROR_CODES.NETWORK_CONNECTION_FAILED, {
        field: 'email' // should be ignored for network errors
      });

      expect(networkResult.userMessage).toBe('Connection failed');
    });

    it('should handle multiple context values', () => {
      const result = mapErrorToUserMessage(ERROR_CODES.VALIDATION_REQUIRED_FIELD, {
        field: 'password',
        suggestion: 'Password must be at least 8 characters'
      });

      expect(result.userMessage).toBe('password is required');
      expect(result.description).toContain('Password must be at least 8 characters');
    });
  });

  describe('message consistency', () => {
    const testCases = [
      { code: ERROR_CODES.AUTH_TOKEN_EXPIRED, expectedAction: 'redirect_login' },
      { code: ERROR_CODES.NETWORK_CONNECTION_FAILED, expectedAction: 'retry' },
      { code: ERROR_CODES.RATE_LIMIT_EXCEEDED, expectedAction: 'retry_with_backoff' },
      { code: ERROR_CODES.SERVER_UNAVAILABLE, expectedAction: 'retry_with_backoff' },
      { code: ERROR_CODES.VALIDATION_REQUIRED_FIELD, expectedAction: 'dismiss' },
      { code: ERROR_CODES.PROMPT_NOT_FOUND, expectedAction: 'go_back' },
    ];

    testCases.forEach(({ code, expectedAction }) => {
      it(`should have consistent action for ${code}`, () => {
        const message = mapErrorToUserMessage(code);
        const recommendedAction = getRecommendedAction(code);

        expect(message.action).toBe(expectedAction);
        expect(recommendedAction).toBe(expectedAction);
      });
    });

    it('should have actionLabel for all mapped errors', () => {
      const errorCodes = [
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
        ERROR_CODES.NETWORK_CONNECTION_FAILED,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        ERROR_CODES.SERVER_INTERNAL_ERROR,
        ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      ];

      errorCodes.forEach(code => {
        const message = mapErrorToUserMessage(code);
        expect(message.actionLabel).toBeTruthy();
        expect(typeof message.actionLabel).toBe('string');
      });
    });
  });
});
