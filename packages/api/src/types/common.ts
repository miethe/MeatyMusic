/**
 * @fileoverview Common types and interfaces for API client
 */

/**
 * API client configuration
 */
export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl?: string;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Default headers for all requests */
  defaultHeaders?: Record<string, string>;
  /** Whether to automatically retry failed requests */
  enableRetry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to include correlation IDs */
  enableCorrelation?: boolean;
  /** Custom auth token provider */
  getAuthToken?: () => Promise<string | null>;
  /** Error interceptor configuration */
  errorConfig?: {
    /** Function to refresh auth token */
    refreshAuthToken?: () => Promise<string | null>;
    /** Function to track analytics events */
    trackAnalytics?: (event: string, properties: Record<string, any>) => void;
    /** Function to show user notifications */
    showNotification?: (message: string, type: 'error' | 'warning' | 'info') => void;
    /** Maximum retry attempts for auth refresh */
    maxAuthRetries?: number;
    /** Circuit breaker threshold */
    circuitBreakerThreshold?: number;
    /** Circuit breaker reset timeout */
    circuitBreakerResetTime?: number;
    /** Whether to log errors to console */
    enableConsoleLogging?: boolean;
  };
}

/**
 * Request options for individual API calls
 */
export interface RequestOptions {
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Disable retry for this request */
  disableRetry?: boolean;
  /** Custom correlation ID */
  correlationId?: string;
  /** AbortController signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Standard error response envelope
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    correlation_id?: string;
  };
}

/**
 * Standard paginated response envelope
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_previous?: boolean;
  };
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request interceptor function
 */
export interface RequestInterceptor {
  (config: RequestConfig): Promise<RequestConfig> | RequestConfig;
}

/**
 * Response interceptor function
 */
export interface ResponseInterceptor {
  onFulfilled?: (response: Response) => Promise<Response> | Response;
  onRejected?: (error: any) => Promise<any> | any;
}

/**
 * Internal request configuration
 */
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout: number;
  correlationId: string;
  startTime: number;
  signal?: AbortSignal;
}
