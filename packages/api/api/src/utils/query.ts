/**
 * @fileoverview Query string serialization utilities
 */

/**
 * Serialize query parameters to URL search string
 */
export function serializeQuery(query: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build complete URL with base URL, path, and query parameters
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>
): string {
  // Validate inputs
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('buildUrl: baseUrl must be a non-empty string');
  }

  if (path === null || path === undefined) {
    throw new Error('buildUrl: path cannot be null or undefined');
  }

  if (typeof path !== 'string') {
    throw new Error('buildUrl: path must be a string');
  }

  // Handle absolute URLs
  if (path.startsWith('http')) {
    return query ? `${path}${serializeQuery(query)}` : path;
  }

  // Ensure base URL doesn't end with slash and path starts with slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const url = `${cleanBaseUrl}${cleanPath}`;
  return query ? `${url}${serializeQuery(query)}` : url;
}
