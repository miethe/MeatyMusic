import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Accessibility utilities are exported separately to avoid
// "use client" issues in server components
// Import directly from '@meaty/ui/lib/a11y' when needed
