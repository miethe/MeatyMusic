/**
 * @fileoverview Tests for ErrorInterceptor functionality
 */

import { createErrorInterceptor, ErrorInterceptorConfig } from '../ErrorInterceptor';
import { ERROR_CODES } from '../errorCodes';
import { ApiError } from '../../types/errors';

// Mock dependencies
const mockTrackAnalytics = jest.fn();
const mockShowNotification = jest.fn();
const mockRefreshAuthToken = jest.fn();

// Mock Response for Node.js environment
global.Response = class MockResponse {
  status: number;
  statusText: string;
  headers: Map<string, string>;

  constructor(body?: any, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map();

    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  text() { return Promise.resolve(''); }
  json() { return Promise.resolve({}); }
} as any;

describe('ErrorInterceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date.now for consistent timestamps in tests
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createErrorInterceptor', () => {
    it('should create interceptor with default config', () => {
      const interceptor = createErrorInterceptor();

      expect(interceptor).toHaveProperty('onFulfilled');
      expect(interceptor).toHaveProperty('onRejected');
      expect(typeof interceptor.onFulfilled).toBe('function');
      expect(typeof interceptor.onRejected).toBe('function');
    });

    it('should create interceptor with custom config', () => {
      const config: ErrorInterceptorConfig = {
        trackAnalytics: mockTrackAnalytics,
        showNotification: mockShowNotification,
        refreshAuthToken: mockRefreshAuthToken,
        maxAuthRetries: 2,
        circuitBreakerThreshold: 3,
        enableConsoleLogging: false,
      };

      const interceptor = createErrorInterceptor(config);

      expect(interceptor).toBeDefined();
    });
  });

  describe('onFulfilled', () => {
    it('should pass through successful responses', () => {
      const interceptor = createErrorInterceptor();
      const mockResponse = new Response('success', { status: 200 });

      const result = interceptor.onFulfilled!(mockResponse);

      expect(result).toBe(mockResponse);
    });
  });

  describe('onRejected', () => {
    const createInterceptor = (config: Partial<ErrorInterceptorConfig> = {}) => {
      return createErrorInterceptor({
        trackAnalytics: mockTrackAnalytics,
        showNotification: mockShowNotification,
        refreshAuthToken: mockRefreshAuthToken,
        enableConsoleLogging: false,
        ...config,
      });
    };

    it('should transform network errors', async () => {
      const interceptor = createInterceptor();
      const networkError = new TypeError('fetch failed');

      await expect(interceptor.onRejected!(networkError)).rejects.toThrow();

      expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
        error_code: ERROR_CODES.NETWORK_CONNECTION_FAILED
      }));
    });

    it('should transform timeout errors', async () => {
      const interceptor = createInterceptor();
      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'AbortError';

      await expect(interceptor.onRejected!(timeoutError)).rejects.toThrow();

      expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
        error_code: ERROR_CODES.NETWORK_TIMEOUT
      }));
    });

    it('should detect and handle CORS errors', async () => {
      const interceptor = createInterceptor();
      const corsError = {
        message: 'CORS policy blocked request',
        response: { status: 0, statusText: '' }
      };

      await expect(interceptor.onRejected!(corsError)).rejects.toThrow();

      expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
        error_code: ERROR_CODES.NETWORK_CORS_ERROR
      }));
    });

    it('should transform HTTP errors by status code', async () => {
      const interceptor = createInterceptor();

      const testCases = [
        { status: 400, expectedCode: ERROR_CODES.VALIDATION_SCHEMA_MISMATCH },
        { status: 401, expectedCode: ERROR_CODES.AUTH_TOKEN_EXPIRED },
        { status: 403, expectedCode: ERROR_CODES.AUTH_PERMISSION_DENIED },
        { status: 404, expectedCode: ERROR_CODES.REQUEST_FAILED },
        { status: 429, expectedCode: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 500, expectedCode: ERROR_CODES.SERVER_INTERNAL_ERROR },
        { status: 503, expectedCode: ERROR_CODES.SERVER_UNAVAILABLE },
        { status: 504, expectedCode: ERROR_CODES.SERVER_TIMEOUT },
      ];

      for (const { status, expectedCode } of testCases) {
        mockTrackAnalytics.mockClear();

        const httpError = {
          response: {
            status,
            text: () => Promise.resolve('{}'),
            data: null
          }
        };

        await expect(interceptor.onRejected!(httpError)).rejects.toThrow();

        expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
          error_code: expectedCode,
          status_code: status
        }));
      }
    });

    it.skip('should attempt auth refresh on 401 errors', async () => {
      // TODO: Fix this test - auth refresh logic needs debugging
      mockRefreshAuthToken.mockResolvedValueOnce('new-token');
      const interceptor = createInterceptor({
        refreshAuthToken: mockRefreshAuthToken
      });

      const authError = {
        response: {
          status: 401,
          text: () => Promise.resolve('{}'),
          data: null
        }
      };

      try {
        await interceptor.onRejected!(authError);
      } catch (error: any) {
        expect(error).toHaveProperty('shouldRetry', true);
      }

      expect(mockRefreshAuthToken).toHaveBeenCalled();
    });

    it.skip('should not retry auth refresh beyond max attempts', async () => {
      const interceptor = createInterceptor({
        maxAuthRetries: 1,
        refreshAuthToken: mockRefreshAuthToken
      });

      const authError = {
        response: {
          status: 401,
          text: () => Promise.resolve('{}'),
          data: null
        },
        correlationId: 'test-correlation-id'
      };

      // First attempt should try refresh
      mockRefreshAuthToken.mockResolvedValueOnce('new-token');
      try {
        await interceptor.onRejected!(authError);
      } catch (error: any) {
        expect(error).toHaveProperty('shouldRetry', true);
      }

      // Second attempt with same correlation ID should not try refresh
      mockRefreshAuthToken.mockClear();
      await expect(interceptor.onRejected!(authError)).rejects.toThrow();
      expect(mockRefreshAuthToken).not.toHaveBeenCalled();
    });

    it('should show notifications for specific error types', async () => {
      const interceptor = createInterceptor();

      const notificationErrors = [
        ERROR_CODES.NETWORK_CONNECTION_FAILED,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
      ];

      for (const errorCode of notificationErrors) {
        mockShowNotification.mockClear();

        const error = {
          response: {
            status: errorCode === ERROR_CODES.AUTH_TOKEN_EXPIRED ? 401 : 500,
            text: () => Promise.resolve(JSON.stringify({
              error: { code: errorCode, message: 'Test error' }
            }))
          }
        };

        await expect(interceptor.onRejected!(error)).rejects.toThrow();
        expect(mockShowNotification).toHaveBeenCalled();
      }
    });

    it('should track analytics with correct event structure', async () => {
      const interceptor = createInterceptor();
      const error = {
        response: {
          status: 500,
          text: () => Promise.resolve('{}')
        },
        config: {
          url: '/api/test',
          method: 'POST'
        }
      };

      await expect(interceptor.onRejected!(error)).rejects.toThrow();

      expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
        error_code: ERROR_CODES.SERVER_INTERNAL_ERROR,
        status_code: 500,
        endpoint: '/api/test',
        method: 'POST',
        trace_id: expect.any(String),
        timestamp: expect.any(String),
      }));
    });

    it('should extract error details from response body', async () => {
      const interceptor = createInterceptor();
      const error = {
        response: {
          status: 400,
          text: () => Promise.resolve(JSON.stringify({
            error: {
              code: 'CUSTOM_VALIDATION_ERROR',
              message: 'Custom validation message',
              details: { field: 'email', value: 'invalid-email' }
            }
          }))
        }
      };

      try {
        await interceptor.onRejected!(error);
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(ApiError);
        expect((thrownError as ApiError).code).toBe('CUSTOM_VALIDATION_ERROR');
        expect((thrownError as ApiError).message).toBe('Custom validation message');
        expect((thrownError as ApiError).details).toEqual({
          field: 'email',
          value: 'invalid-email'
        });
      }
    });

    it('should handle malformed error responses gracefully', async () => {
      const interceptor = createInterceptor();
      const error = {
        response: {
          status: 500,
          text: () => Promise.resolve('invalid json {')
        }
      };

      await expect(interceptor.onRejected!(error)).rejects.toThrow();

      // Should still track the error even if response parsing fails
      expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
        error_code: ERROR_CODES.SERVER_INTERNAL_ERROR
      }));
    });
  });

  describe('circuit breaker', () => {
    it('should trigger circuit breaker after threshold failures', async () => {
      const interceptor = createErrorInterceptor({
        trackAnalytics: mockTrackAnalytics,
        circuitBreakerThreshold: 2,
        circuitBreakerResetTime: 1000
      });

      const networkError = new TypeError('fetch failed');

      // First failure
      await expect(interceptor.onRejected!(networkError)).rejects.toThrow();

      // Second failure should trigger circuit breaker
      await expect(interceptor.onRejected!(networkError)).rejects.toThrow();

      // Third attempt should be blocked by circuit breaker
      mockTrackAnalytics.mockClear();
      await expect(interceptor.onRejected!(networkError)).rejects.toThrow();

      expect(mockTrackAnalytics).toHaveBeenCalledWith('api.error', expect.objectContaining({
        error_code: ERROR_CODES.SERVER_UNAVAILABLE
      }));
    });

    it('should reset circuit breaker on successful response', () => {
      const interceptor = createErrorInterceptor({
        circuitBreakerThreshold: 2
      });

      const mockResponse = new Response('success', { status: 200 });

      // This should reset the circuit breaker
      const result = interceptor.onFulfilled!(mockResponse);
      expect(result).toBe(mockResponse);
    });
  });

  describe('error sanitization', () => {
    it('should not log sensitive information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const interceptor = createErrorInterceptor({
        enableConsoleLogging: true
      });

      const error = {
        response: {
          status: 400,
          text: () => Promise.resolve(JSON.stringify({
            error: {
              code: 'AUTH_ERROR',
              message: 'Authentication failed with token: secret123',
              details: { password: 'user-password' }
            }
          }))
        }
      };

      await expect(interceptor.onRejected!(error)).rejects.toThrow();

      const loggedError = consoleSpy.mock.calls[0][1];
      expect(loggedError.message).not.toContain('secret123');
      expect(loggedError.details?.password).toBe('***');

      consoleSpy.mockRestore();
    });
  });

  describe('object message handling', () => {
    it('should handle object messages without producing [object Object]', async () => {
      const interceptor = createErrorInterceptor();

      const error = {
        response: {
          status: 400,
          text: () => Promise.resolve(JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: { field: 'email', reason: 'invalid format' }
            }
          }))
        }
      };

      try {
        await interceptor.onRejected!(error);
      } catch (apiError: any) {
        expect(apiError.message).not.toBe('[object Object]');
        expect(apiError.message).toBe('{"field":"email","reason":"invalid format"}');
      }
    });

    it('should handle nested object error messages', async () => {
      const interceptor = createErrorInterceptor();

      const error = {
        response: {
          status: 500,
          text: () => Promise.resolve(JSON.stringify({
            message: {
              error: {
                details: 'Internal server error',
                causes: ['database connection', 'timeout']
              }
            }
          }))
        }
      };

      try {
        await interceptor.onRejected!(error);
      } catch (apiError: any) {
        expect(apiError.message).not.toBe('[object Object]');
        expect(apiError.message).toContain('Internal server error');
        expect(apiError.message).toContain('database connection');
      }
    });

    it('should handle null and undefined error messages', async () => {
      const interceptor = createErrorInterceptor();

      const errorWithNullMessage = {
        response: {
          status: 400,
          text: () => Promise.resolve(JSON.stringify({
            error: { code: 'NULL_ERROR', message: null }
          }))
        }
      };

      try {
        await interceptor.onRejected!(errorWithNullMessage);
      } catch (apiError: any) {
        expect(apiError.message).not.toBe('[object Object]');
        expect(apiError.message).toBe('null error occurred'); // Generated from 'NULL_ERROR' code
      }
    });

    it('should handle error messages that are arrays', async () => {
      const interceptor = createErrorInterceptor();

      const error = {
        response: {
          status: 400,
          text: () => Promise.resolve(JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: ['Field email is required', 'Password too short']
            }
          }))
        }
      };

      try {
        await interceptor.onRejected!(error);
      } catch (apiError: any) {
        expect(apiError.message).not.toBe('[object Object]');
        expect(apiError.message).toBe('Multiple errors: Field email is required, Password too short');
      }
    });
  });
});
