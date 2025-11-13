/**
 * @fileoverview Tests for ErrorResponse transformation utilities
 */

import {
  ErrorResponse,
  transformToErrorResponse,
  isErrorResponse,
  extractTraceId,
  sanitizeErrorForLogging,
} from '../ErrorResponse';

describe('ErrorResponse', () => {
  describe('transformToErrorResponse', () => {
    it('should transform a basic Error object', () => {
      const error = new Error('Test error');
      const result = transformToErrorResponse(error, 'TEST_ERROR');

      expect(result.code).toBe('TEST_ERROR');
      expect(result.message).toBe('Test error');
      expect(result.timestamp).toBeTruthy();
      expect(result.traceId).toBeTruthy();
      expect(result.status).toBeUndefined();
    });

    it('should transform an API error with response data', () => {
      const error = {
        response: {
          status: 404,
          data: {
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Resource not found',
              details: { resourceId: '123' }
            }
          }
        }
      };

      const result = transformToErrorResponse(error);

      expect(result.code).toBe('RESOURCE_NOT_FOUND');
      expect(result.message).toBe('Resource not found');
      expect(result.details).toEqual({ resourceId: '123' });
      expect(result.status).toBe(404);
    });

    it('should use provided correlation ID', () => {
      const error = new Error('Test');
      const correlationId = 'test-correlation-123';

      const result = transformToErrorResponse(error, 'TEST_ERROR', correlationId);

      expect(result.traceId).toBe(correlationId);
    });

    it('should handle plain objects', () => {
      const error = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        details: { field: 'email' }
      };

      const result = transformToErrorResponse(error);

      expect(result.code).toBe('CUSTOM_ERROR');
      expect(result.message).toBe('Custom error message');
      expect(result.details).toEqual({ field: 'email' });
    });

    it('should handle primitive values', () => {
      const result = transformToErrorResponse('Simple error string', 'STRING_ERROR');

      expect(result.code).toBe('STRING_ERROR');
      expect(result.message).toBe('Simple error string');
      expect(result.timestamp).toBeTruthy();
      expect(result.traceId).toBeTruthy();
    });

    it('should handle objects as error messages without producing [object Object]', () => {
      const objectMessage = { details: 'Something went wrong', code: 500 };
      const error = { message: objectMessage };

      const result = transformToErrorResponse(error, 'OBJECT_MESSAGE_ERROR');

      expect(result.message).not.toBe('[object Object]');
      expect(result.message).toBe('{"details":"Something went wrong","code":500}');
      expect(result.code).toBe('OBJECT_MESSAGE_ERROR');
    });

    it('should handle Error objects with object messages', () => {
      const error = new Error();
      (error as any).message = { error: 'Complex error', status: 'failed' };

      const result = transformToErrorResponse(error, 'COMPLEX_ERROR');

      expect(result.message).not.toBe('[object Object]');
      expect(result.message).toBe('{"error":"Complex error","status":"failed"}');
    });

    it('should handle null and undefined messages', () => {
      const errorWithNullMessage = { message: null };
      const result1 = transformToErrorResponse(errorWithNullMessage, 'NULL_MESSAGE_ERROR');
      expect(result1.message).toBe('{"message":null}'); // Object gets JSON stringified

      const errorWithUndefinedMessage = { message: undefined };
      const result2 = transformToErrorResponse(errorWithUndefinedMessage, 'UNDEFINED_MESSAGE_ERROR');
      expect(result2.message).toBe('An error occurred'); // Falls back to default message
    });

    it('should handle circular reference objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const result = transformToErrorResponse(circularObj, 'CIRCULAR_ERROR');

      expect(result.message).not.toBe('[object Object]');
      expect(result.message).toBe('An error occurred'); // Fallback for circular references
    });

    it('should handle arrays as error messages', () => {
      const arrayMessage = ['Error 1', 'Error 2', 'Error 3'];
      const error = { message: arrayMessage };

      const result = transformToErrorResponse(error, 'ARRAY_ERROR');

      expect(result.message).toBe('Multiple errors: Error 1, Error 2, Error 3');
    });

    it('should handle empty objects and arrays', () => {
      const emptyObject = {};
      const result1 = transformToErrorResponse(emptyObject, 'EMPTY_OBJECT_ERROR');
      expect(result1.message).toBe('An error occurred');

      const emptyArrayError = { message: [] };
      const result2 = transformToErrorResponse(emptyArrayError, 'EMPTY_ARRAY_ERROR');
      expect(result2.message).toBe('An error occurred');
    });

    it('should handle already formatted ErrorResponse', () => {
      const existingError: ErrorResponse = {
        code: 'EXISTING_ERROR',
        message: 'Already formatted',
        timestamp: '2025-01-01T00:00:00.000Z',
        traceId: 'existing-trace-id'
      };

      const result = transformToErrorResponse(existingError);

      expect(result.code).toBe('EXISTING_ERROR');
      expect(result.message).toBe('Already formatted');
      expect(result.timestamp).toBe('2025-01-01T00:00:00.000Z');
      expect(result.traceId).toBe('existing-trace-id');
    });
  });

  describe('isErrorResponse', () => {
    it('should identify valid ErrorResponse objects', () => {
      const validError: ErrorResponse = {
        code: 'TEST_ERROR',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace'
      };

      expect(isErrorResponse(validError)).toBe(true);
    });

    it('should reject objects missing required fields', () => {
      expect(isErrorResponse({ code: 'TEST' })).toBe(false);
      expect(isErrorResponse({ message: 'Test' })).toBe(false);
      expect(isErrorResponse({ code: 123, message: 'Test' })).toBe(false);
      expect(isErrorResponse(null)).toBe(false);
      expect(isErrorResponse(undefined)).toBe(false);
    });
  });

  describe('extractTraceId', () => {
    it('should extract trace ID from ErrorResponse', () => {
      const error: ErrorResponse = {
        code: 'TEST_ERROR',
        message: 'Test',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace-id'
      };

      expect(extractTraceId(error)).toBe('test-trace-id');
    });

    it('should extract correlation ID from various formats', () => {
      const errorWithCorrelationId = { correlationId: 'correlation-123' };
      expect(extractTraceId(errorWithCorrelationId)).toBe('correlation-123');

      const errorWithRequestId = { requestId: 'request-456' };
      expect(extractTraceId(errorWithRequestId)).toBe('request-456');

      const errorWithResponseHeaders = {
        response: {
          headers: {
            'x-request-id': 'header-789'
          }
        }
      };
      expect(extractTraceId(errorWithResponseHeaders)).toBe('header-789');
    });

    it('should return undefined for objects without trace IDs', () => {
      expect(extractTraceId({})).toBeUndefined();
      expect(extractTraceId(null)).toBeUndefined();
      expect(extractTraceId('string')).toBeUndefined();
    });
  });

  describe('sanitizeErrorForLogging', () => {
    it('should sanitize sensitive data in error messages', () => {
      const error: ErrorResponse = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed with token: abc123 and password: secret123',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace'
      };

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized.message).toBe('Authentication failed with token=*** and password=***');
    });

    it('should sanitize sensitive fields in details', () => {
      const error: ErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          field: 'email',
          password: 'secret123',
          apiKey: 'key-abc-123',
          normalField: 'safe value'
        },
        timestamp: new Date().toISOString(),
        traceId: 'test-trace'
      };

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized.details).toEqual({
        field: 'email',
        password: '***',
        apiKey: '***',
        normalField: 'safe value'
      });
    });

    it('should handle nested objects in details', () => {
      const error: ErrorResponse = {
        code: 'COMPLEX_ERROR',
        message: 'Complex error',
        details: {
          user: {
            id: '123',
            token: 'secret-token'
          },
          request: {
            headers: {
              authorization: 'Bearer token123'
            }
          }
        },
        timestamp: new Date().toISOString(),
        traceId: 'test-trace'
      };

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized.details?.user.id).toBe('123');
      expect(sanitized.details?.user.token).toBe('***');
      expect(sanitized.details?.request.headers.authorization).toBe('***');
    });

    it('should handle arrays in details', () => {
      const error: ErrorResponse = {
        code: 'ARRAY_ERROR',
        message: 'Array error',
        details: {
          items: [
            { id: '1', secret: 'hidden' },
            { id: '2', password: 'also-hidden' }
          ]
        },
        timestamp: new Date().toISOString(),
        traceId: 'test-trace'
      };

      const sanitized = sanitizeErrorForLogging(error);
      const items = sanitized.details?.items;

      expect(items[0].id).toBe('1');
      expect(items[0].secret).toBe('***');
      expect(items[1].id).toBe('2');
      expect(items[1].password).toBe('***');
    });

    it('should not modify the original error object', () => {
      const error: ErrorResponse = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed with token: abc123',
        timestamp: new Date().toISOString(),
        traceId: 'test-trace'
      };

      const originalMessage = error.message;
      sanitizeErrorForLogging(error);

      expect(error.message).toBe(originalMessage);
    });
  });
});
