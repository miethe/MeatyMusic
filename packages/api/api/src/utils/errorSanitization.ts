/**
 * @fileoverview Error message sanitization utilities
 *
 * Provides robust error message sanitization to prevent [object Object] displays
 * and ensure all error messages are readable strings.
 */

/**
 * Check if an object looks like request metadata that shouldn't be used as an error message
 */
function isRequestMetadata(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const metadata = obj as Record<string, unknown>;

  // Check for typical request metadata properties
  const hasMethod = typeof metadata.method === 'string';
  const hasUrl = typeof metadata.url === 'string';
  const hasStartTime = typeof metadata.startTime === 'number';
  const hasCorrelationId = typeof metadata.correlationId === 'string';

  // If it has at least 2 of these properties and doesn't have typical error properties,
  // it's likely request metadata
  const metadataPropertyCount = [hasMethod, hasUrl, hasStartTime, hasCorrelationId].filter(Boolean).length;
  const hasErrorProperties = 'message' in metadata || 'error' in metadata || 'status' in metadata;

  return metadataPropertyCount >= 2 && !hasErrorProperties;
}

/**
 * Sanitize error message to ensure it's always a readable string
 *
 * @param message - The error message to sanitize (can be any type)
 * @param fallback - Fallback message if sanitization fails
 * @returns A readable string representation of the error message
 */
export function sanitizeErrorMessage(message: unknown, fallback = 'An error occurred'): string {
  // If it's already a string, return it
  if (typeof message === 'string') {
    return message.trim() || fallback;
  }

  // Handle null/undefined
  if (message == null) {
    return fallback;
  }

  // Handle numbers, booleans, etc.
  if (typeof message === 'number' || typeof message === 'boolean') {
    return String(message);
  }

  // Handle objects (including arrays, errors, etc.)
  if (typeof message === 'object') {
    try {
      // Handle Error objects specially
      if (message instanceof Error) {
        return message.message || message.name || fallback;
      }

      // Handle arrays
      if (Array.isArray(message)) {
        return message.length > 0
          ? `Multiple errors: ${message.map(m => sanitizeErrorMessage(m, 'Unknown error')).join(', ')}`
          : fallback;
      }

      // Handle plain objects
      // First check if this looks like request metadata that shouldn't be used as an error message
      if (isRequestMetadata(message)) {
        return fallback;
      }

      const jsonString = JSON.stringify(message);

      // If JSON.stringify returns "{}" for an object, try to extract some meaningful info
      if (jsonString === '{}') {
        const objectString = Object.prototype.toString.call(message);
        return objectString !== '[object Object]' ? objectString : fallback;
      }

      return jsonString;
    } catch (error) {
      // If JSON.stringify fails (circular references, etc.), provide fallback
      try {
        // Try to get constructor name or toString
        const constructorName = (message as any)?.constructor?.name;
        if (constructorName && constructorName !== 'Object') {
          return `${constructorName} error`;
        }

        const toStringResult = Object.prototype.toString.call(message);
        return toStringResult !== '[object Object]' ? toStringResult : fallback;
      } catch {
        return fallback;
      }
    }
  }

  // Handle functions, symbols, etc.
  try {
    const stringified = String(message);
    return stringified !== '[object Object]' ? stringified : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Sanitize an object's properties to ensure all string values are readable
 * Used for sanitizing error details and context objects
 */
export function sanitizeObjectProperties(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value;
    } else {
      sanitized[key] = sanitizeErrorMessage(value, `[${typeof value}]`);
    }
  }

  return sanitized;
}
