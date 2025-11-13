/**
 * @fileoverview Tests for error code utilities
 */

import {
  ERROR_CODES,
  AUTH_ERRORS,
  NETWORK_ERRORS,
  SERVER_ERRORS,
  RATE_LIMIT_ERRORS,
  VALIDATION_ERRORS,
  isAuthError,
  isNetworkError,
  isServerError,
  isRateLimitError,
  isValidationError,
  isRetryableErrorCode,
  getErrorDomain,
  getErrorAction,
  getErrorType,
} from '../errorCodes';

describe('errorCodes', () => {
  describe('error code constants', () => {
    it('should have all auth error codes', () => {
      expect(AUTH_ERRORS.AUTH_TOKEN_EXPIRED).toBe('AUTH_TOKEN_EXPIRED');
      expect(AUTH_ERRORS.AUTH_TOKEN_INVALID).toBe('AUTH_TOKEN_INVALID');
      expect(AUTH_ERRORS.AUTH_PERMISSION_DENIED).toBe('AUTH_PERMISSION_DENIED');
    });

    it('should have all network error codes', () => {
      expect(NETWORK_ERRORS.NETWORK_CONNECTION_FAILED).toBe('NETWORK_CONNECTION_FAILED');
      expect(NETWORK_ERRORS.NETWORK_TIMEOUT).toBe('NETWORK_TIMEOUT');
      expect(NETWORK_ERRORS.NETWORK_CORS_ERROR).toBe('NETWORK_CORS_ERROR');
    });

    it('should have all server error codes', () => {
      expect(SERVER_ERRORS.SERVER_INTERNAL_ERROR).toBe('SERVER_INTERNAL_ERROR');
      expect(SERVER_ERRORS.SERVER_UNAVAILABLE).toBe('SERVER_UNAVAILABLE');
      expect(SERVER_ERRORS.SERVER_TIMEOUT).toBe('SERVER_TIMEOUT');
    });

    it('should consolidate all error codes in ERROR_CODES', () => {
      // Check that ERROR_CODES includes all category codes
      expect(ERROR_CODES.AUTH_TOKEN_EXPIRED).toBe(AUTH_ERRORS.AUTH_TOKEN_EXPIRED);
      expect(ERROR_CODES.NETWORK_CONNECTION_FAILED).toBe(NETWORK_ERRORS.NETWORK_CONNECTION_FAILED);
      expect(ERROR_CODES.SERVER_INTERNAL_ERROR).toBe(SERVER_ERRORS.SERVER_INTERNAL_ERROR);
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe(RATE_LIMIT_ERRORS.RATE_LIMIT_EXCEEDED);
      expect(ERROR_CODES.VALIDATION_REQUIRED_FIELD).toBe(VALIDATION_ERRORS.VALIDATION_REQUIRED_FIELD);
    });
  });

  describe('type guard functions', () => {
    describe('isAuthError', () => {
      it('should identify auth errors', () => {
        expect(isAuthError('AUTH_TOKEN_EXPIRED')).toBe(true);
        expect(isAuthError('AUTH_PERMISSION_DENIED')).toBe(true);
        expect(isAuthError('AUTH_TOKEN_INVALID')).toBe(true);
      });

      it('should reject non-auth errors', () => {
        expect(isAuthError('NETWORK_CONNECTION_FAILED')).toBe(false);
        expect(isAuthError('SERVER_INTERNAL_ERROR')).toBe(false);
        expect(isAuthError('UNKNOWN_ERROR')).toBe(false);
      });
    });

    describe('isNetworkError', () => {
      it('should identify network errors', () => {
        expect(isNetworkError('NETWORK_CONNECTION_FAILED')).toBe(true);
        expect(isNetworkError('NETWORK_TIMEOUT')).toBe(true);
        expect(isNetworkError('NETWORK_CORS_ERROR')).toBe(true);
      });

      it('should reject non-network errors', () => {
        expect(isNetworkError('AUTH_TOKEN_EXPIRED')).toBe(false);
        expect(isNetworkError('SERVER_INTERNAL_ERROR')).toBe(false);
      });
    });

    describe('isServerError', () => {
      it('should identify server errors', () => {
        expect(isServerError('SERVER_INTERNAL_ERROR')).toBe(true);
        expect(isServerError('SERVER_UNAVAILABLE')).toBe(true);
        expect(isServerError('SERVER_TIMEOUT')).toBe(true);
      });

      it('should reject non-server errors', () => {
        expect(isServerError('NETWORK_CONNECTION_FAILED')).toBe(false);
        expect(isServerError('AUTH_TOKEN_EXPIRED')).toBe(false);
      });
    });

    describe('isRateLimitError', () => {
      it('should identify rate limit errors', () => {
        expect(isRateLimitError('RATE_LIMIT_EXCEEDED')).toBe(true);
        expect(isRateLimitError('RATE_LIMIT_QUOTA_EXCEEDED')).toBe(true);
      });

      it('should reject non-rate-limit errors', () => {
        expect(isRateLimitError('SERVER_INTERNAL_ERROR')).toBe(false);
        expect(isRateLimitError('AUTH_TOKEN_EXPIRED')).toBe(false);
      });
    });

    describe('isValidationError', () => {
      it('should identify validation errors', () => {
        expect(isValidationError('VALIDATION_REQUIRED_FIELD')).toBe(true);
        expect(isValidationError('VALIDATION_INVALID_FORMAT')).toBe(true);
      });

      it('should reject non-validation errors', () => {
        expect(isValidationError('SERVER_INTERNAL_ERROR')).toBe(false);
        expect(isValidationError('NETWORK_TIMEOUT')).toBe(false);
      });
    });
  });

  describe('isRetryableErrorCode', () => {
    it('should identify retryable error codes', () => {
      // Network errors are retryable
      expect(isRetryableErrorCode('NETWORK_CONNECTION_FAILED')).toBe(true);
      expect(isRetryableErrorCode('NETWORK_TIMEOUT')).toBe(true);

      // Server errors are retryable
      expect(isRetryableErrorCode('SERVER_INTERNAL_ERROR')).toBe(true);
      expect(isRetryableErrorCode('SERVER_UNAVAILABLE')).toBe(true);
      expect(isRetryableErrorCode('SERVER_TIMEOUT')).toBe(true);

      // Rate limit errors are retryable
      expect(isRetryableErrorCode('RATE_LIMIT_EXCEEDED')).toBe(true);

      // Generic request failed is retryable
      expect(isRetryableErrorCode('REQUEST_FAILED')).toBe(true);
    });

    it('should identify non-retryable error codes', () => {
      // Auth errors are not automatically retryable
      expect(isRetryableErrorCode('AUTH_TOKEN_EXPIRED')).toBe(false);
      expect(isRetryableErrorCode('AUTH_PERMISSION_DENIED')).toBe(false);

      // Validation errors are not retryable
      expect(isRetryableErrorCode('VALIDATION_REQUIRED_FIELD')).toBe(false);
      expect(isRetryableErrorCode('VALIDATION_INVALID_FORMAT')).toBe(false);

      // Not found errors are not retryable
      expect(isRetryableErrorCode('PROMPT_NOT_FOUND')).toBe(false);
      expect(isRetryableErrorCode('CATALOG_MODEL_NOT_FOUND')).toBe(false);
    });
  });

  describe('error code parsing utilities', () => {
    describe('getErrorDomain', () => {
      it('should extract domain from error codes', () => {
        expect(getErrorDomain('AUTH_TOKEN_EXPIRED')).toBe('AUTH');
        expect(getErrorDomain('NETWORK_CONNECTION_FAILED')).toBe('NETWORK');
        expect(getErrorDomain('SERVER_INTERNAL_ERROR')).toBe('SERVER');
        expect(getErrorDomain('VALIDATION_REQUIRED_FIELD')).toBe('VALIDATION');
        expect(getErrorDomain('PROMPT_NOT_FOUND')).toBe('PROMPT');
      });

      it('should handle invalid error codes', () => {
        expect(getErrorDomain('INVALID')).toBe('INVALID');
        expect(getErrorDomain('')).toBe('UNKNOWN');
        expect(getErrorDomain('NO_UNDERSCORES')).toBe('NO');
      });
    });

    describe('getErrorAction', () => {
      it('should extract action from error codes', () => {
        expect(getErrorAction('AUTH_TOKEN_EXPIRED')).toBe('TOKEN');
        expect(getErrorAction('NETWORK_CONNECTION_FAILED')).toBe('CONNECTION');
        expect(getErrorAction('SERVER_INTERNAL_ERROR')).toBe('INTERNAL');
        expect(getErrorAction('VALIDATION_REQUIRED_FIELD')).toBe('REQUIRED');
        expect(getErrorAction('PROMPT_NOT_FOUND')).toBe('NOT');
      });

      it('should handle invalid error codes', () => {
        expect(getErrorAction('INVALID')).toBe('UNKNOWN');
        expect(getErrorAction('')).toBe('UNKNOWN');
        expect(getErrorAction('SINGLE')).toBe('UNKNOWN');
      });
    });

    describe('getErrorType', () => {
      it('should extract error type from error codes', () => {
        expect(getErrorType('AUTH_TOKEN_EXPIRED')).toBe('EXPIRED');
        expect(getErrorType('NETWORK_CONNECTION_FAILED')).toBe('FAILED');
        expect(getErrorType('SERVER_INTERNAL_ERROR')).toBe('ERROR');
        expect(getErrorType('VALIDATION_REQUIRED_FIELD')).toBe('FIELD');
        expect(getErrorType('PROMPT_NOT_FOUND')).toBe('FOUND');
      });

      it('should handle multi-word error types', () => {
        expect(getErrorType('RATE_LIMIT_DAILY_LIMIT')).toBe('DAILY_LIMIT');
        expect(getErrorType('USER_PREFERENCES_UPDATE_FAILED')).toBe('UPDATE_FAILED');
      });

      it('should handle invalid error codes', () => {
        expect(getErrorType('INVALID')).toBe('UNKNOWN');
        expect(getErrorType('')).toBe('UNKNOWN');
        expect(getErrorType('SINGLE_PART')).toBe('UNKNOWN');
      });
    });
  });

  describe('error code consistency', () => {
    it('should follow naming convention for all error codes', () => {
      const errorCodes = Object.values(ERROR_CODES);

      errorCodes.forEach(code => {
        // Should be uppercase
        expect(code).toBe(code.toUpperCase());

        // Should have at least two parts separated by underscores
        const parts = code.split('_');
        expect(parts.length).toBeGreaterThanOrEqual(2);

        // Each part should not be empty
        parts.forEach(part => {
          expect(part.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have unique error codes', () => {
      const errorCodes = Object.values(ERROR_CODES);
      const uniqueCodes = new Set(errorCodes);

      expect(uniqueCodes.size).toBe(errorCodes.length);
    });

    it('should have meaningful domain groupings', () => {
      const domains = new Set<string>();

      Object.values(ERROR_CODES).forEach(code => {
        domains.add(getErrorDomain(code));
      });

      // Should have expected domains
      expect(domains.has('AUTH')).toBe(true);
      expect(domains.has('NETWORK')).toBe(true);
      expect(domains.has('SERVER')).toBe(true);
      expect(domains.has('VALIDATION')).toBe(true);
      expect(domains.has('PROMPT')).toBe(true);
      expect(domains.has('CATALOG')).toBe(true);
      expect(domains.has('USER')).toBe(true);
      expect(domains.has('RATE')).toBe(true);
    });
  });

  describe('error code coverage', () => {
    it('should cover common HTTP status codes', () => {
      // 400-level errors
      expect(ERROR_CODES.AUTH_TOKEN_EXPIRED).toBeDefined(); // 401
      expect(ERROR_CODES.AUTH_PERMISSION_DENIED).toBeDefined(); // 403
      expect(ERROR_CODES.VALIDATION_SCHEMA_MISMATCH).toBeDefined(); // 400
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBeDefined(); // 429

      // 500-level errors
      expect(ERROR_CODES.SERVER_INTERNAL_ERROR).toBeDefined(); // 500
      expect(ERROR_CODES.SERVER_UNAVAILABLE).toBeDefined(); // 503
      expect(ERROR_CODES.SERVER_TIMEOUT).toBeDefined(); // 504
    });

    it('should cover network-level errors', () => {
      expect(ERROR_CODES.NETWORK_CONNECTION_FAILED).toBeDefined();
      expect(ERROR_CODES.NETWORK_TIMEOUT).toBeDefined();
      expect(ERROR_CODES.NETWORK_OFFLINE).toBeDefined();
      expect(ERROR_CODES.NETWORK_CORS_ERROR).toBeDefined();
    });

    it('should cover application domain errors', () => {
      // Prompt management
      expect(ERROR_CODES.PROMPT_NOT_FOUND).toBeDefined();
      expect(ERROR_CODES.PROMPT_CREATE_FAILED).toBeDefined();
      expect(ERROR_CODES.PROMPT_VALIDATION_FAILED).toBeDefined();

      // Catalog management
      expect(ERROR_CODES.CATALOG_MODEL_NOT_FOUND).toBeDefined();
      expect(ERROR_CODES.CATALOG_MODEL_UNAVAILABLE).toBeDefined();

      // User management
      expect(ERROR_CODES.USER_NOT_FOUND).toBeDefined();
      expect(ERROR_CODES.USER_PREFERENCES_UPDATE_FAILED).toBeDefined();
    });
  });
});
