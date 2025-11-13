/**
 * Environment utilities for browser-safe process.env access
 */

/**
 * Safely check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  try {
    // @ts-ignore - process may not be available in browser
    return process?.env?.NODE_ENV === 'development';
  } catch {
    return false;
  }
};

/**
 * Safely check if we're in production mode
 */
export const isProduction = (): boolean => {
  try {
    // @ts-ignore - process may not be available in browser
    return process?.env?.NODE_ENV === 'production';
  } catch {
    return true; // Default to production if uncertain
  }
};
