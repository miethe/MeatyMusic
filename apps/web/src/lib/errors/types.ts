/**
 * Error type definitions
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
  status?: number;
}

export class ApplicationError extends Error {
  code: string;
  details?: Record<string, unknown>;
  request_id?: string;
  status?: number;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'ApplicationError';
    this.code = error.code;
    this.details = error.details;
    this.request_id = error.request_id;
    this.status = error.status;
  }
}

export const ERROR_CODES = {
  // Client errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;
