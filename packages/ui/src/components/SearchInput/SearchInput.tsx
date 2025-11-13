import * as React from "react";
import { Search, X } from "lucide-react";
import { Input, type InputProps } from "../Input";
import { cn } from "../../lib/utils";

export interface SearchInputProps extends Omit<InputProps, 'type' | 'icon' | 'rightIcon'> {
  /** Callback when search value changes (debounced) */
  onSearch?: (value: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to show clear button */
  showClear?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    className,
    onSearch,
    debounceMs = 300,
    showClear = true,
    onClear,
    value,
    defaultValue,
    onChange,
    placeholder = "Search...",
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || defaultValue || "");
    const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

    // Update internal value when controlled value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // Cleanup debounce timer on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Update internal value
      setInternalValue(newValue);

      // Call original onChange if provided
      onChange?.(e);

      // Debounced search callback
      if (onSearch) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          onSearch(newValue);
        }, debounceMs);
      }
    }, [onChange, onSearch, debounceMs]);

    const handleClear = React.useCallback(() => {
      setInternalValue("");
      onClear?.();
      onSearch?.("");

      // If controlled, trigger onChange with empty value
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    }, [onClear, onSearch, onChange]);

    const showClearButton = showClear && internalValue && internalValue.toString().length > 0;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="search"
          value={value !== undefined ? value : internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          icon={<Search className="h-4 w-4" />}
          rightIcon={
            showClearButton ? (
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-text-base transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
          className={cn("pr-9", className)}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
