/**
 * @fileoverview Retry logic with exponential backoff
 */

import { ApiError } from '../types/errors';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
  backoffFactor: 2
};

/**
 * Calculate delay for retry attempt with exponential backoff
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Never retry method binding errors
  if (error?.code === 'METHOD_BINDING_ERROR' ||
      error?.message?.includes('METHOD_BINDING_ERROR') ||
      error?.message?.includes('method binding') ||
      error?.message?.includes('circuit breaker is open')) {
    return false;
  }

  // Never retry response mutation errors
  if (error?.code === 'RESPONSE_MUTATION_ERROR' ||
      (error?.message?.includes('Cannot set property') && error?.message?.includes('Response'))) {
    return false;
  }

  if (error instanceof ApiError) {
    return error.isRetryable();
  }

  // Network errors are generally NOT retryable to prevent infinite loops
  if (error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('CORS') ||
      error instanceof TypeError) {
    return false;
  }

  // Only retry server errors (5xx) and rate limit errors (429)
  if (error.status >= 500 || error.status === 429) {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt > config.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate and wait for retry delay
      const delay = calculateRetryDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError;
}
