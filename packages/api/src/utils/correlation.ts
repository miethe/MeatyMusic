/**
 * @fileoverview Correlation ID utilities for request tracking
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
}

/**
 * Extract correlation ID from response headers
 */
export function getCorrelationIdFromResponse(response: Response): string | undefined {
  return response.headers.get('x-correlation-id') ||
         response.headers.get('x-request-id') ||
         undefined;
}
