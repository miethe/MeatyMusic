/**
 * Search Input Component
 * Debounced search input with clear button
 */

'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@meatymusic/ui';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * SearchInput Component with Debouncing
 *
 * Features:
 * - Debounced onChange (default 300ms)
 * - Clear button when value is not empty
 * - Search icon
 * - Keyboard accessible
 *
 * @accessibility
 * - Proper ARIA labels
 * - Clear button is keyboard accessible
 * - Focus states
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounce = 300,
  className,
  disabled = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local value when prop value changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounce);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative flex-1', className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-10 py-2 rounded-lg',
            'border border-border-default bg-bg-elevated',
            'text-text-primary placeholder:text-text-muted',
            'focus:border-border-accent focus:ring-2 focus:ring-primary/20',
            'transition-all duration-ui',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Remove default search input styling
            '[&::-webkit-search-cancel-button]:appearance-none',
            '[&::-webkit-search-decoration]:appearance-none'
          )}
          aria-label={placeholder}
        />
        {localValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'w-5 h-5 flex items-center justify-center',
              'text-text-muted hover:text-text-primary',
              'rounded-sm transition-colors duration-ui',
              'focus:outline-none focus:ring-2 focus:ring-primary/20'
            )}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
