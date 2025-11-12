/**
 * @fileoverview Centralized error types for API client
 *
 * Provides typed error classes with standardized error handling
 * and correlation support for debugging and observability.
 */

export interface ErrorDetails {
  code?: string;
  field?: string;
  value?: any;
  context?: Record<string, any>;
}

/**
 * Base API error class with correlation tracking
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: ErrorDetails;
  public readonly correlationId?: string;
  public readonly timestamp: string;

  constructor(
    message: string | any,
    status: number,
    code?: string,
    details?: ErrorDetails,
    correlationId?: string
  ) {
    super(typeof message === 'string' ? message : String(message));
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Check if this is a specific HTTP status code
   */
  public isStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if this is a client error (4xx)
   */
  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  public isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if this error is retryable
   */
  public isRetryable(): boolean {
    return this.status === 429 || this.status === 503 || this.status >= 500;
  }

  /**
   * Convert to JSON for logging
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Timeout error for requests that exceed time limit
 */
export class TimeoutError extends Error {
  public readonly timeout: number;
  public readonly correlationId?: string;
  public readonly timestamp: string;

  constructor(timeout: number, correlationId?: string) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      timeout: this.timeout,
      correlationId: this.correlationId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Network error for connection issues
 */
export class NetworkError extends Error {
  public readonly cause?: Error;
  public readonly correlationId?: string;
  public readonly timestamp: string;

  constructor(message: string, cause?: Error, correlationId?: string) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      cause: this.cause?.message,
      correlationId: this.correlationId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation error for request/response validation failures
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly value?: any;
  public readonly correlationId?: string;
  public readonly timestamp: string;

  constructor(
    message: string,
    field?: string,
    value?: any,
    correlationId?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      correlationId: this.correlationId,
      timestamp: this.timestamp
    };
  }
}
