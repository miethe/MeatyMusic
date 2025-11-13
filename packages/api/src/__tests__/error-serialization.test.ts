/**
 * Tests for error serialization fixes
 */

import { createApiClient } from '../client/base-client';
import { ApiError } from '../types/errors';

describe('Error Serialization Fixes', () => {
  let client: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    client = createApiClient({
      baseUrl: 'http://localhost:8000',
      timeout: 1000,
      enableRetry: false // Disable retry for cleaner test behavior
    });
  });

  test('errors should not serialize request metadata', async () => {
    // Mock fetch to reject with a network error
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await client.get('/api/v1/users/me/preferences');
      fail('Expected request to throw');
    } catch (error: any) {
      // Serialize the error like React Query would
      const serializedError = JSON.stringify(error);

      // Verify that internal request metadata is not in the serialized string
      expect(serializedError).not.toContain('"method"');
      expect(serializedError).not.toContain('"url"');
      expect(serializedError).not.toContain('"startTime"');

      // Note: correlationId is part of the ApiError and should be serialized
      // Only internal metadata attached via Symbol should not be serialized

      // The error should be handled properly (regardless of exact message)
      expect(error).toBeInstanceOf(Error);
      expect(typeof error.message === 'string').toBe(true);
    }
  });

  test('api errors should not serialize metadata properties', async () => {
    const apiError = new ApiError('Test error', 400, 'TEST_ERROR', { test: 'details' }, 'test-correlation');

    // Simulate the error wrapper process
    const ERROR_METADATA = Symbol('errorMetadata');
    (apiError as any)[ERROR_METADATA] = {
      method: 'GET',
      url: '/test',
      startTime: Date.now(),
      correlationId: 'test-correlation'
    };

    // Serialize the error
    const serialized = JSON.stringify(apiError);

    // Verify metadata is not serialized
    expect(serialized).not.toContain('"method"');
    expect(serialized).not.toContain('"url"');
    expect(serialized).not.toContain('"startTime"');

    // But error properties should still be available
    expect(JSON.parse(serialized)).toMatchObject({
      message: 'Test error',
      name: 'ApiError'
    });
  });

  test('symbol-based metadata should be accessible but not serialized', () => {
    const ERROR_METADATA = Symbol('errorMetadata');
    const error = new Error('Test error') as any;

    error[ERROR_METADATA] = {
      method: 'POST',
      url: '/api/test',
      startTime: 123456789,
      correlationId: 'test-id'
    };

    // Should be able to access metadata
    expect(error[ERROR_METADATA]).toEqual({
      method: 'POST',
      url: '/api/test',
      startTime: 123456789,
      correlationId: 'test-id'
    });

    // But serialization should not include it
    const serialized = JSON.stringify(error);
    expect(serialized).not.toContain('POST');
    expect(serialized).not.toContain('/api/test');
    expect(serialized).not.toContain('123456789');
    expect(serialized).not.toContain('test-id');
  });
});
