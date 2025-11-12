import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../Input';
import { Button } from '../Button';

export interface ModelPickerSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isSearching?: boolean;
  className?: string;
}

export const ModelPickerSearch = React.forwardRef<
  HTMLInputElement,
  ModelPickerSearchProps
>(({
  value,
  onChange,
  placeholder = "Search models...",
  disabled = false,
  isSearching = false,
  className,
  ...props
}, ref) => {
  const handleClear = React.useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
          isSearching && "animate-pulse"
        )}
      />
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-10"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        role="searchbox"
        aria-label="Search models"
        {...props}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

ModelPickerSearch.displayName = "ModelPickerSearch";
