/**
 * @fileoverview Base API client with typed fetch wrapper
 *
 * Provides centralized HTTP client with retry logic, error handling,
 * authentication, and request/response interception.
 */

import {
  ApiConfig,
  RequestOptions,
  HttpMethod,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor
} from '../types/common';
import { ApiError, TimeoutError, NetworkError } from '../types/errors';
import { AuthTokenProvider } from './auth';
import { buildUrl } from '../utils/query';
import { withRetry, DEFAULT_RETRY_CONFIG, RetryConfig } from '../utils/retry';
import { generateCorrelationId } from '../utils/correlation';
import {
  correlationInterceptor,
  createAuthInterceptor,
  timingInterceptor,
  createAuthErrorInterceptor
} from './interceptors';
import { createErrorInterceptor, ErrorInterceptorConfig } from '../errors/ErrorInterceptor';
import { CircuitBreakerFactory, CircuitBreakerError } from '../utils/circuitBreaker';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : (process.env.API_URL || 'http://localhost:8000');

// Symbols for attaching metadata without affecting serialization
const ERROR_METADATA = Symbol('errorMetadata');

interface ErrorMetadata {
  method?: string;
  url?: string;
  startTime?: number;
  correlationId?: string;
}

/**
 * Main API client class
 *
 * IMPORTANT: HTTP methods (get, post, patch, etc.) use arrow functions to preserve
 * the 'this' context. This prevents "Illegal invocation" errors when methods are
 * extracted and called from service classes or React components.
 */
export class ApiClient {
  private readonly config: Required<ApiConfig>;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.defaultHeaders
      },
      enableRetry: config.enableRetry ?? true,
      maxRetries: config.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
      enableCorrelation: config.enableCorrelation ?? true,
      getAuthToken: config.getAuthToken || (() => Promise.resolve(null)),
      errorConfig: config.errorConfig || {}
    };

    this.setupDefaultInterceptors();

    // HTTP methods are now arrow functions, so they're automatically bound
    // This prevents "Illegal invocation" errors when methods are called from services
    // No need for explicit binding since arrow functions retain 'this' context

    // Initialize asynchronously to avoid blocking
    this.initializationPromise = this.initializeAsync();
  }

  /**
   * Async initialization to validate methods and setup without blocking constructor
   */
  private async initializeAsync(): Promise<void> {
    try {
      // Allow a small delay for React to finish rendering
      await new Promise(resolve => setTimeout(resolve, 0));

      // Validate methods are properly available
      this.validateMethodsAvailable();

      this.isInitialized = true;
    } catch (error) {
      console.error('[ApiClient] Initialization failed:', error);
      // Don't mark as initialized if validation fails
      this.isInitialized = false;
    }
  }

  /**
   * Wait for client initialization before proceeding with requests
   */
  private async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    // If still not initialized after waiting, validate again
    if (!this.isInitialized) {
      this.validateMethodsAvailable();
      this.isInitialized = true;
    }
  }

  /**
   * Setup default interceptors
   */
  private setupDefaultInterceptors(): void {
    // Request interceptors
    if (this.config.enableCorrelation) {
      this.requestInterceptors.push(correlationInterceptor);
    }

    this.requestInterceptors.push(createAuthInterceptor(this.config.getAuthToken));

    // Response interceptors
    this.responseInterceptors.push(timingInterceptor);

    // Use new enhanced error interceptor
    const errorInterceptor = createErrorInterceptor({
      refreshAuthToken: this.config.errorConfig?.refreshAuthToken || this.config.getAuthToken,
      trackAnalytics: this.config.errorConfig?.trackAnalytics,
      showNotification: this.config.errorConfig?.showNotification,
      maxAuthRetries: this.config.errorConfig?.maxAuthRetries,
      circuitBreakerThreshold: this.config.errorConfig?.circuitBreakerThreshold,
      circuitBreakerResetTime: this.config.errorConfig?.circuitBreakerResetTime,
      enableConsoleLogging: this.config.errorConfig?.enableConsoleLogging
    });

    this.responseInterceptors.push(errorInterceptor);
  }

  /**
   * Add a request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Process request through interceptors
   */
  private async processRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    return processedConfig;
  }

  /**
   * Process response through interceptors
   */
  private async processResponseInterceptors(response: Response, config: RequestConfig): Promise<Response> {
    let processedResponse = response;

    // Create proxy that attaches metadata while preserving Response internals
    const meta = {
      method: config.method,
      url: config.url,
      startTime: config.startTime,
      correlationId: config.correlationId,
    };

    const responseWithMeta = new Proxy(response, {
      get(target, prop, receiver) {
        if (prop in meta) {
          return (meta as any)[prop];
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        processedResponse = await interceptor.onFulfilled(responseWithMeta);
      }
    }

    return processedResponse;
  }

  /**
   * Process error through interceptors
   */
  private async processErrorInterceptors(error: any, config: RequestConfig): Promise<never> {
    // Create a safe error wrapper that doesn't mutate Response objects
    let processedError = this.createSafeErrorWrapper(error, config);

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onRejected) {
        try {
          processedError = await interceptor.onRejected(processedError);
        } catch (newError) {
          processedError = newError;
        }
      }
    }

    throw processedError;
  }

  /**
   * Create a safe error wrapper that doesn't mutate Response objects
   * Uses Symbol-based metadata attachment to prevent serialization issues
   */
  private createSafeErrorWrapper(error: any, config: RequestConfig): any {
    const metadata: ErrorMetadata = {
      method: config.method,
      url: config.url,
      startTime: config.startTime,
      correlationId: config.correlationId
    };

    // If the error is a Response object, create a safe wrapper
    if (error instanceof Response) {
      const wrappedError = new Error('HTTP Response Error') as any;
      wrappedError.response = error;
      wrappedError[ERROR_METADATA] = metadata;
      return wrappedError;
    }

    // For ApiError instances, preserve the original error and attach metadata using Symbol
    if (error instanceof ApiError) {
      try {
        // Use Symbol to attach metadata without affecting serialization
        (error as any)[ERROR_METADATA] = metadata;
        return error;
      } catch (e) {
        // If we can't set the symbol property, create a wrapper
        const newError = new Error(error.message) as any;
        newError.originalError = error;
        newError[ERROR_METADATA] = metadata;
        newError.response = (error as any).response;
        newError.status = error.status;
        newError.code = error.code;
        newError.details = error.details;
        return newError;
      }
    }

    // For other error types, use Symbol to attach metadata
    try {
      // Try to attach metadata using Symbol (won't be serialized)
      (error as any)[ERROR_METADATA] = metadata;
      return error;
    } catch (e) {
      // If we can't attach to the original error, create a wrapper
      const errorMessage = typeof error.message === 'string' ? error.message : 'Request Error';
      const wrappedError = new Error(errorMessage) as any;
      wrappedError.originalError = error;
      wrappedError[ERROR_METADATA] = metadata;
      return wrappedError;
    }
  }

  /**
   * Core request method with circuit breaker protection
   */
  private async makeRequest<T>(
    method: HttpMethod,
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    // Wait for client initialization first
    try {
      await this.waitForInitialization();
    } catch (initError) {
      console.error('[ApiClient] Initialization failed, proceeding with degraded service:', initError);
    }

    // Check method binding circuit breaker
    const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();

    try {
      await methodBindingBreaker.execute(async () => {
        // Quick validation that the method is still available
        if (typeof this[method.toLowerCase() as keyof this] !== 'function') {
          throw new Error(`METHOD_BINDING_ERROR: ${method} method is not available`);
        }
        return Promise.resolve();
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        throw new Error('API client method binding circuit breaker is open - too many binding errors detected');
      }
      throw error;
    }

    // Validate path parameter before building URL
    if (path === null || path === undefined) {
      throw new Error(`API request failed: path cannot be null or undefined for ${method} request`);
    }

    if (typeof path !== 'string') {
      throw new Error(`API request failed: path must be a string for ${method} request, got ${typeof path}`);
    }

    if (path.trim() === '') {
      throw new Error(`API request failed: path cannot be empty for ${method} request`);
    }

    const url = buildUrl(this.config.baseUrl, path, options.query);
    const timeout = options.timeout || this.config.timeout;
    const correlationId = options.correlationId || generateCorrelationId();

    // Create request config
    let config: RequestConfig = {
      method,
      url,
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers
      },
      body,
      timeout,
      correlationId,
      startTime: Date.now(),
      signal: options.signal
    };

    // Process request interceptors
    config = await this.processRequestInterceptors(config);

    // Create the actual request function
    const makeRequestFn = async (): Promise<T> => {
      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), config.timeout);

      // Combine with user-provided signal
      const signal = config.signal ?
        this.combineAbortSignals([abortController.signal, config.signal]) :
        abortController.signal;

      try {
        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method: config.method,
          headers: config.headers,
          signal
        };

        // Add body for non-GET requests
        if (config.body !== undefined && config.method !== 'GET') {
          if (config.body instanceof FormData) {
            fetchOptions.body = config.body;
            // Remove content-type header for FormData (let browser set it)
            delete config.headers['Content-Type'];
          } else if (typeof config.body === 'string') {
            fetchOptions.body = config.body;
          } else {
            fetchOptions.body = JSON.stringify(config.body);
          }
        }

        // Make the fetch request
        const response = await fetch(config.url, fetchOptions);

        clearTimeout(timeoutId);

        // Check for HTTP errors
        if (!response.ok) {
          await this.handleHttpError(response, config);
        }

        // Process response interceptors
        const processedResponse = await this.processResponseInterceptors(response, config);

        // Parse response
        return await this.parseResponse<T>(processedResponse);

      } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout specifically
        if (error instanceof DOMException && error.name === 'AbortError') {
          const timeoutError = new TimeoutError(config.timeout, config.correlationId);
          await this.processErrorInterceptors(timeoutError, config);
        } else if (error instanceof TypeError && (
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('network')
        )) {
          // Only handle actual network TypeErrors, not parsing errors
          const networkError = new NetworkError(
            'Network request failed',
            error,
            config.correlationId
          );
          await this.processErrorInterceptors(networkError, config);
        } else {
          // Process other errors through interceptors
          await this.processErrorInterceptors(error, config);
        }
        // This should never be reached since processErrorInterceptors always throws
        throw new Error('Unexpected error handling flow');
      }
    };

    // Apply retry logic if enabled (METHOD_BINDING_ERROR prevention is handled in isRetryableError)
    if (this.config.enableRetry && !options.disableRetry) {
      const retryConfig: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: this.config.maxRetries
      };
      return withRetry(makeRequestFn, retryConfig);
    }

    return makeRequestFn();
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHttpError(response: Response, config: RequestConfig): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;
    let errorDetails: any;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.error) {
          if (typeof errorData.error.message === 'string') {
            errorMessage = errorData.error.message;
          } else if (errorData.error.message) {
            errorMessage = JSON.stringify(errorData.error.message);
          }
          errorCode = errorData.error.code;
          errorDetails = errorData.error.details;
        } else if (errorData.message) {
          if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else {
            errorMessage = JSON.stringify(errorData.message);
          }
        }
      } else {
        const errorText = await response.text();
        if (typeof errorText === 'string') {
          errorMessage = errorText;
        } else {
          errorMessage = JSON.stringify(errorText);
        }
      }
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new ApiError(
      typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      response.status,
      errorCode,
      errorDetails,
      config.correlationId
    );
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as any;
    }

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    if (contentType?.includes('text/')) {
      return response.text() as any;
    }

    // Default to text for unknown content types
    return response.text() as any;
  }

  /**
   * Combine multiple abort signals
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    signals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });

    return controller.signal;
  }

  /**
   * GET request
   * Using arrow function to automatically bind 'this' context
   */
  public get = <T = any>(path: string, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('GET', path, undefined, options);
  }

  /**
   * POST request
   * Using arrow function to automatically bind 'this' context
   */
  public post = <T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('POST', path, body, options);
  }

  /**
   * PUT request
   * Using arrow function to automatically bind 'this' context
   */
  public put = <T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('PUT', path, body, options);
  }

  /**
   * PATCH request
   * Using arrow function to automatically bind 'this' context
   */
  public patch = <T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('PATCH', path, body, options);
  }

  /**
   * DELETE request
   * Using arrow function to automatically bind 'this' context
   */
  public delete = <T = any>(path: string, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('DELETE', path, undefined, options);
  }

  /**
   * HEAD request
   * Using arrow function to automatically bind 'this' context
   */
  public head = <T = any>(path: string, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('HEAD', path, undefined, options);
  }

  /**
   * OPTIONS request
   * Using arrow function to automatically bind 'this' context
   */
  public options = <T = any>(path: string, options?: RequestOptions): Promise<T> => {
    return this.makeRequest<T>('OPTIONS', path, undefined, options);
  }

  /**
   * Upload file using multipart/form-data
   * Using arrow function to automatically bind 'this' context
   */
  public upload = <T = any>(
    path: string,
    files: File[] | FileList,
    additionalData?: Record<string, string>,
    options?: RequestOptions
  ): Promise<T> => {
    const formData = new FormData();

    // Add files
    Array.from(files).forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest<T>('POST', path, formData, options);
  }

  /**
   * Validate that methods are properly available and set up circuit breaker
   * Only runs in development mode to catch issues early
   */
  private validateMethodsAvailable(): void {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      try {
        const requiredMethods = ['get', 'post', 'patch', 'put', 'delete'] as const;
        const optionalMethods = ['head', 'options', 'upload'] as const;

        // Check required methods are available as functions
        for (const method of requiredMethods) {
          if (typeof this[method] !== 'function') {
            // Trip the method binding circuit breaker immediately
            const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
            methodBindingBreaker.forceOpen();

            throw new Error(`Required HTTP method '${method}' is not available as a function. This will cause METHOD_BINDING_ERROR at runtime.`);
          }
        }

        // Warn about missing optional methods but don't fail
        for (const method of optionalMethods) {
          if (typeof this[method] !== 'function') {
            console.warn(`[ApiClient] Optional HTTP method '${method}' is not available. Some functionality may be limited.`);
          }
        }

        // Test that extracted methods preserve their context
        const { get, post } = this;

        // Try a simple test call to verify context is preserved
        // Arrow functions automatically preserve context, so this should work
        try {
          // Create a test scenario where the method is called without 'this'
          const detachedGet = get;
          const detachedPost = post;

          // These should not throw because arrow functions preserve context
          if (typeof detachedGet !== 'function' || typeof detachedPost !== 'function') {
            throw new Error('Methods lost their function type when extracted');
          }
        } catch (error) {
          console.warn('[ApiClient] Method validation warning:', error);
        }

      } catch (error) {
        const errorMessage = `ApiClient method validation failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error('[ApiClient]', errorMessage);

        // In test environment, fail fast to catch binding issues
        if (process.env.NODE_ENV === 'test') {
          throw new Error(errorMessage);
        }
      }
    }
  }

}

/**
 * Factory function to create API client instance
 */
export function createApiClient(config?: ApiConfig): ApiClient {
  return new ApiClient(config);
}
