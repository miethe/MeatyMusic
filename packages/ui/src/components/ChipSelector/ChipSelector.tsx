'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../Badge';

export interface ChipSelectorOption {
  value: string;
  label: string;
}

export interface ChipSelectorProps {
  /**
   * Available options to select from
   */
  options?: ChipSelectorOption[];
  /**
   * Currently selected values
   */
  selected?: string[];
  /**
   * Callback when selection changes
   */
  onChange?: (selected: string[]) => void;
  /**
   * Maximum number of selections allowed
   */
  maxSelections?: number;
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  /**
   * Placeholder text when no selections
   */
  placeholder?: string;
  /**
   * Label for the component
   */
  label?: string;
  /**
   * Helper text displayed below the component
   */
  helperText?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Warning message to display
   */
  warning?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to allow creating new options
   */
  allowCreate?: boolean;
}

/**
 * ChipSelector - A multi-select component using chip/badge UI
 *
 * Features:
 * - Click chips to select/deselect
 * - Keyboard navigation (arrow keys, enter, delete)
 * - Max selections limit
 * - Custom option creation
 * - Fully accessible (ARIA labels, keyboard support)
 *
 * @example
 * ```tsx
 * <ChipSelector
 *   options={[
 *     { value: 'pop', label: 'Pop' },
 *     { value: 'rock', label: 'Rock' }
 *   ]}
 *   selected={['pop']}
 *   onChange={(selected) => console.log(selected)}
 *   maxSelections={3}
 *   label="Genres"
 * />
 * ```
 */
export const ChipSelector = React.forwardRef<HTMLDivElement, ChipSelectorProps>(
  (
    {
      options = [],
      selected = [],
      onChange,
      maxSelections,
      disabled = false,
      placeholder = 'Select options...',
      label,
      helperText,
      error,
      warning,
      required = false,
      className,
      allowCreate = false,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Filter available options (not already selected)
    const availableOptions = React.useMemo(() => {
      const filtered = options.filter(
        (opt) =>
          !selected.includes(opt.value) &&
          opt.label.toLowerCase().includes(inputValue.toLowerCase())
      );
      return filtered;
    }, [options, selected, inputValue]);

    // Check if max selections reached
    const isMaxReached = maxSelections !== undefined && selected.length >= maxSelections;

    // Check if current input can be created as new option
    const canCreateNew = React.useMemo(() => {
      if (!allowCreate || !inputValue.trim()) return false;
      const exists = options.some(
        (opt) => opt.value.toLowerCase() === inputValue.toLowerCase()
      );
      const alreadySelected = selected.includes(inputValue.trim());
      return !exists && !alreadySelected;
    }, [allowCreate, inputValue, options, selected]);

    // Handle selection toggle
    const toggleSelection = React.useCallback(
      (value: string) => {
        if (disabled) return;

        if (selected.includes(value)) {
          // Remove from selection
          onChange?.(selected.filter((v) => v !== value));
        } else {
          // Add to selection if not at max
          if (!isMaxReached) {
            onChange?.([...selected, value]);
          }
        }
      },
      [disabled, selected, onChange, isMaxReached]
    );

    // Handle creating new option
    const createNewOption = React.useCallback(() => {
      if (!canCreateNew || isMaxReached) return;

      const newValue = inputValue.trim();
      onChange?.([...selected, newValue]);
      setInputValue('');
      setIsOpen(false);
      inputRef.current?.focus();
    }, [canCreateNew, isMaxReached, inputValue, selected, onChange]);

    // Keyboard navigation
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setIsOpen(true);
            setFocusedIndex((prev) =>
              prev < availableOptions.length - 1 ? prev + 1 : prev
            );
            break;

          case 'ArrowUp':
            e.preventDefault();
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            break;

          case 'Enter':
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < availableOptions.length) {
              const option = availableOptions[focusedIndex];
              if (option) {
                toggleSelection(option.value);
                setInputValue('');
                setFocusedIndex(-1);
              }
            } else if (canCreateNew) {
              createNewOption();
            }
            break;

          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            setFocusedIndex(-1);
            inputRef.current?.blur();
            break;

          case 'Backspace':
            if (!inputValue && selected.length > 0) {
              // Remove last selected item
              const lastValue = selected[selected.length - 1];
              if (lastValue) {
                toggleSelection(lastValue);
              }
            }
            break;

          default:
            setIsOpen(true);
        }
      },
      [
        disabled,
        availableOptions,
        focusedIndex,
        inputValue,
        selected,
        canCreateNew,
        toggleSelection,
        createNewOption,
      ]
    );

    // Close dropdown on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Determine border color based on state
    const borderColor = error
      ? 'border-danger'
      : warning || isMaxReached
      ? 'border-warning'
      : 'border-border';

    // Determine helper text color
    const helperColor = error
      ? 'text-danger'
      : warning || isMaxReached
      ? 'text-warning'
      : 'text-text-muted';

    return (
      <div ref={ref} className={cn('space-y-2 w-full', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-text-base">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        {/* Chip container with input */}
        <div
          ref={containerRef}
          className={cn(
            'min-h-[2.5rem] w-full rounded-sm border bg-surface px-3 py-2 text-sm shadow-sm transition-colors',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            borderColor,
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {/* Selected chips */}
            {selected.map((value) => {
              const option = options.find((opt) => opt.value === value);
              const label = option?.label || value;

              return (
                <Badge
                  key={value}
                  variant="secondary"
                  size="sm"
                  dismissible
                  onDismiss={() => !disabled && toggleSelection(value)}
                  className="gap-1"
                >
                  {label}
                </Badge>
              );
            })}

            {/* Input field */}
            {!isMaxReached && !disabled && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsOpen(true);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={selected.length === 0 ? placeholder : ''}
                disabled={disabled}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-text-base placeholder:text-text-muted"
                aria-label={label || 'Select options'}
                aria-expanded={isOpen}
                aria-controls="chip-selector-dropdown"
              />
            )}
          </div>
        </div>

        {/* Dropdown with available options */}
        {isOpen && !isMaxReached && (availableOptions.length > 0 || canCreateNew) && (
          <div
            id="chip-selector-dropdown"
            className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md"
            role="listbox"
          >
            <div className="max-h-60 overflow-auto">
              {/* Available options */}
              {availableOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    toggleSelection(option.value);
                    setInputValue('');
                    setFocusedIndex(-1);
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors text-left',
                    focusedIndex === index
                      ? 'bg-muted text-text-strong'
                      : 'hover:bg-muted'
                  )}
                  role="option"
                  aria-selected={focusedIndex === index}
                >
                  {option.label}
                </button>
              ))}

              {/* Create new option */}
              {canCreateNew && (
                <button
                  type="button"
                  onClick={createNewOption}
                  onMouseEnter={() => setFocusedIndex(availableOptions.length)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors text-left',
                    focusedIndex === availableOptions.length
                      ? 'bg-muted text-primary'
                      : 'text-primary hover:bg-muted'
                  )}
                >
                  <Plus className="h-3 w-3" />
                  Create &quot;{inputValue}&quot;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Helper text / Error / Warning */}
        {(helperText || error || warning || isMaxReached) && (
          <p className={cn('text-xs', helperColor)} role={error ? 'alert' : undefined}>
            {error ||
              (isMaxReached
                ? `Maximum ${maxSelections} ${
                    maxSelections === 1 ? 'selection' : 'selections'
                  } reached`
                : warning || helperText)}
          </p>
        )}
      </div>
    );
  }
);

ChipSelector.displayName = 'ChipSelector';
