/**
 * @fileoverview Tests for retry logic
 */

import {
  withRetry,
  calculateRetryDelay,
  isRetryableError,
  DEFAULT_RETRY_CONFIG,
  sleep
} from '../utils/retry';
import { ApiError, NetworkError, TimeoutError } from '../types/errors';

describe('Retry utilities', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delays', () => {
      const config = DEFAULT_RETRY_CONFIG;

      expect(calculateRetryDelay(1, config)).toBe(1000); // 1s
      expect(calculateRetryDelay(2, config)).toBe(2000); // 2s
      expect(calculateRetryDelay(3, config)).toBe(4000); // 4s
    });

    it('should respect max delay', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxDelay: 3000 };

      expect(calculateRetryDelay(3, config)).toBe(3000); // Capped at maxDelay
      expect(calculateRetryDelay(4, config)).toBe(3000); // Still capped
    });

    it('should use custom backoff factor', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, backoffFactor: 3 };

      expect(calculateRetryDelay(1, config)).toBe(1000); // 1s
      expect(calculateRetryDelay(2, config)).toBe(3000); // 3s
      expect(calculateRetryDelay(3, config)).toBe(8000); // 8s (capped at maxDelay)
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable API errors', () => {
      expect(isRetryableError(new ApiError('Rate limited', 429))).toBe(true);
      expect(isRetryableError(new ApiError('Service unavailable', 503))).toBe(true);
      expect(isRetryableError(new ApiError('Internal error', 500))).toBe(true);
      expect(isRetryableError(new ApiError('Bad gateway', 502))).toBe(true);
    });

    it('should identify non-retryable API errors', () => {
      expect(isRetryableError(new ApiError('Bad request', 400))).toBe(false);
      expect(isRetryableError(new ApiError('Unauthorized', 401))).toBe(false);
      expect(isRetryableError(new ApiError('Forbidden', 403))).toBe(false);
      expect(isRetryableError(new ApiError('Not found', 404))).toBe(false);
    });

    it('should identify retryable network errors', () => {
      expect(isRetryableError(new NetworkError('Connection failed'))).toBe(true);
      expect(isRetryableError(new TimeoutError(5000))).toBe(true);
    });

    it('should handle unknown error types', () => {
      expect(isRetryableError(new Error('Unknown error'))).toBe(false);
      expect(isRetryableError({ message: 'Some object' })).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(95); // Allow for some timing variation
      expect(end - start).toBeLessThan(150);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new ApiError('Rate limited', 429))
        .mockRejectedValueOnce(new ApiError('Service unavailable', 503))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new ApiError('Bad request', 400);
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(mockFn, DEFAULT_RETRY_CONFIG)).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const error = new ApiError('Service unavailable', 503);
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        withRetry(mockFn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 })
      ).rejects.toThrow(error);

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should wait between retries', async () => {
      const error = new NetworkError('Connection failed');
      const mockFn = jest.fn().mockRejectedValue(error);

      const start = Date.now();

      try {
        await withRetry(mockFn, {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          backoffFactor: 2
        });
      } catch {
        // Expected to fail
      }

      const end = Date.now();

      // Should wait at least 100ms + 200ms = 300ms total
      expect(end - start).toBeGreaterThanOrEqual(250);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw last error after max retries', async () => {
      const errors = [
        new ApiError('First error', 503),
        new ApiError('Second error', 502),
        new ApiError('Final error', 500)
      ];

      const mockFn = jest.fn()
        .mockRejectedValueOnce(errors[0])
        .mockRejectedValueOnce(errors[1])
        .mockRejectedValue(errors[2]);

      await expect(
        withRetry(mockFn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 })
      ).rejects.toThrow(errors[2]);
    });
  });
});
