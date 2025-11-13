/**
 * API client configuration with interceptors
 */

import axios, { type AxiosInstance } from 'axios';
import qs from 'qs';

import { API_CONFIG } from '@/config/api';
import { parseApiError } from '@/lib/errors/handlers';
import { trackError, trackApiCall } from '@/lib/telemetry/tracking';

/**
 * Create axios instance with custom array parameter serialization
 * Uses 'repeat' format for arrays to match FastAPI's expectation
 * Example: ['pop', 'rock'] becomes 'genres=pop&genres=rock'
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Name': 'meatymusic-web',
  },
  // Serialize array params as repeated params (not indexed) for FastAPI compatibility
  // FastAPI expects: ?genre=pop&genre=rock
  // Default axios would send: ?genre[0]=pop&genre[1]=rock
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
});

/**
 * Request interceptor
 * Adds authentication token and telemetry
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Add timestamp for tracking
    config.metadata = {
      startTime: Date.now(),
    };

    // Add development auth bypass header if configured
    // This allows API client to work in development without authentication
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS_SECRET) {
      config.headers['X-Dev-Auth-Bypass'] = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS_SECRET;
    }

    // Note: JWT token authentication will be added in Phase 2+
    // For now, requests rely on development bypass or backend session handling

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles errors and telemetry tracking
 */
apiClient.interceptors.response.use(
  (response) => {
    // Track successful API call
    const duration =
      Date.now() - (response.config.metadata?.startTime || Date.now());
    trackApiCall(
      response.config.method || 'GET',
      response.config.url || '',
      duration,
      response.status
    );

    return response;
  },
  (error) => {
    // Parse and track error
    const appError = parseApiError(error);
    trackError({
      code: appError.code,
      message: appError.message,
      request_id: appError.request_id,
      status: appError.status,
    });

    // Track failed API call
    if (error.config) {
      const duration =
        Date.now() - (error.config.metadata?.startTime || Date.now());
      trackApiCall(
        error.config.method || 'GET',
        error.config.url || '',
        duration,
        error.response?.status || 0
      );
    }

    return Promise.reject(appError);
  }
);

// Extend axios config to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
