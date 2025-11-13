/**
 * Utility functions for the web app
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Merge CSS classes with conditional logic
 * Uses clsx for combining class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
