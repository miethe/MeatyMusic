/**
 * @fileoverview Request and response interceptors for API client
 */

import { RequestConfig, RequestInterceptor, ResponseInterceptor } from '../types/common';
import { ApiError, NetworkError } from '../types/errors';
import { generateCorrelationId, getCorrelationIdFromResponse } from '../utils/correlation';

/**
 * Request interceptor to add correlation ID and timing
 */
export const correlationInterceptor: RequestInterceptor = (config: RequestConfig) => {
  if (!config.correlationId) {
    config.correlationId = generateCorrelationId();
  }

  // Add correlation ID to headers
  config.headers['X-Request-ID'] = config.correlationId;
  config.headers['X-Correlation-ID'] = config.correlationId;

  // Record start time for timing metrics
  config.startTime = Date.now();

  return config;
};

/**
 * Request interceptor to add authentication token
 */
export const createAuthInterceptor = (
  getToken: () => Promise<string | null>
): RequestInterceptor => {
  return async (config: RequestConfig) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      // Continue without token - let the API handle unauthorized requests
    }

    return config;
  };
};

/**
 * Response interceptor for timing and logging
 */
export const timingInterceptor: ResponseInterceptor = {
  onFulfilled: (response: Response) => {
    const duration = Date.now() - (response as any).startTime;
    const correlationId = getCorrelationIdFromResponse(response);

    // Log successful request timing
    console.log(
      `[API] ${(response as any).method} ${(response as any).url} ${response.status} ${duration}ms ${correlationId || ''}`
    );

    return response;
  },

  onRejected: (error: any) => {
    if (error.startTime) {
      const duration = Date.now() - error.startTime;
      console.error(
        `[API] ${error.method || 'UNKNOWN'} ${error.url || 'UNKNOWN'} ERROR ${duration}ms ${error.correlationId || ''} - ${error.message}`
      );
    }

    throw error;
  }
};

/**
 * Response interceptor for error handling and mapping
 */
export const errorInterceptor: ResponseInterceptor = {
  onFulfilled: (response: Response) => response,

  onRejected: async (error: any) => {
    // Already processed errors can pass through
    if (error instanceof ApiError || error instanceof NetworkError) {
      throw error;
    }

    // Handle fetch errors (network issues)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError(
        'Network request failed - please check your connection',
        error,
        (error as any).correlationId
      );
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new NetworkError(
        'Request was cancelled or timed out',
        error,
        (error as any).correlationId
      );
    }

    // Handle other unexpected errors
    throw new NetworkError(
      error.message || 'An unexpected error occurred',
      error,
      (error as any).correlationId
    );
  }
};

/**
 * Response interceptor for 401 handling
 */
export const createAuthErrorInterceptor = (
  onUnauthorized?: () => void
): ResponseInterceptor => {
  return {
    onFulfilled: (response: Response) => response,

    onRejected: (error: any) => {
      if (error instanceof ApiError && error.status === 401) {
        // Trigger unauthorized callback (e.g., redirect to login)
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          // Default behavior - redirect to unauthorized page
          if (typeof window !== 'undefined') {
            window.location.href = '/unauthorized?error=expired_session';
          }
        }
      }

      throw error;
    }
  };
};
