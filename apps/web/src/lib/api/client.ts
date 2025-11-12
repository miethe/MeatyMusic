/**
 * API client configuration with interceptors
 */

import { QueryClient } from '@tanstack/react-query';
import axios, { type AxiosInstance } from 'axios';
import qs from 'qs';

import { API_CONFIG } from '@/config/api';
import { parseApiError } from '@/lib/errors/handlers';
import { trackError, trackApiCall } from '@/lib/telemetry/tracking';

const STALE_TIME_MS = 1000 * 60 * 5; // 5 minutes
const GC_TIME_MS = 1000 * 60 * 10; // 10 minutes

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

    // Add Clerk authentication token to all requests
    // We need to get the token from Clerk's session and add it to the Authorization header
    try {
      // Access Clerk instance from window (available after ClerkProvider loads)
      if (typeof window !== 'undefined' && window.Clerk) {
        const token = await window.Clerk.session?.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // Log token retrieval errors but don't block the request
      // The backend will return 401 if auth is required
      console.error('Failed to get Clerk token:', error);
    }

    // Add development auth bypass header if configured
    // This allows API client to work in development without Clerk authentication
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS_SECRET) {
      config.headers['X-Dev-Auth-Bypass'] = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS_SECRET;
    }

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

/**
 * React Query client configuration
 *
 * Performance tuning:
 * - Reduced default staleTime from 5min to 2min for more frequent updates
 * - Individual hooks can override for data-specific needs
 * - Songs: 30s (frequently updated)
 * - Personas/Styles: 2min (moderately updated)
 * - Blueprints: 5min (rarely change)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS, // 5 minutes (default)
      gcTime: GC_TIME_MS, // 10 minutes (default)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < API_CONFIG.RETRY_ATTEMPTS;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Performance optimizations
      networkMode: 'offlineFirst', // Use cache first, then network
      structuralSharing: true, // Prevent unnecessary re-renders by sharing unchanged data
    },
    mutations: {
      retry: 1,
      networkMode: 'online', // Mutations require network connectivity
    },
  },
});

// Extend axios config to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Extend window to include Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      } | null;
    };
  }
}
