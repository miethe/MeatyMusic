'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';

export interface ChipSelectorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  maxChips?: number;
  error?: string;
  warning?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export function ChipSelector({
  label,
  value,
  onChange,
  suggestions = [],
  maxChips,
  error,
  warning,
  placeholder = 'Type to add...',
  required = false,
  disabled = false,
  helpText,
}: ChipSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.trim()) {
      const filtered = suggestions.filter(
        (s) =>
          s.toLowerCase().includes(newValue.toLowerCase()) &&
          !value.includes(s)
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const addChip = (chip: string) => {
    const trimmedChip = chip.trim();
    if (!trimmedChip) return;
    if (value.includes(trimmedChip)) return;
    if (maxChips && value.length >= maxChips) {
      return;
    }

    onChange([...value, trimmedChip]);
    setInputValue('');
    setFilteredSuggestions([]);
    inputRef.current?.focus();
  };

  const removeChip = (chipToRemove: string) => {
    onChange(value.filter((chip) => chip !== chipToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      const lastChip = value[value.length - 1];
      if (lastChip) {
        removeChip(lastChip);
      }
    }
  };

  const showMaxChipWarning = Boolean(maxChips && value.length >= maxChips);
  const statusColor = error
    ? 'border-accent-error'
    : warning || showMaxChipWarning
    ? 'border-accent-warning'
    : 'border-border-secondary';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-accent-error ml-1">*</span>}
      </label>

      <div
        className={`min-h-[48px] rounded-lg border ${statusColor} bg-background-tertiary p-2 transition-colors focus-within:border-border-focus focus-within:ring-2 focus-within:ring-border-focus/20`}
      >
        <div className="flex flex-wrap gap-2">
          {value.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-full bg-accent-primary/20 border border-accent-primary/40 px-3 py-1 text-sm font-medium text-text-primary transition-colors hover:bg-accent-primary/30"
            >
              {chip}
              <button
                type="button"
                onClick={() => removeChip(chip)}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-accent-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove ${chip}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || showMaxChipWarning}
            placeholder={showMaxChipWarning ? 'Max chips reached' : placeholder}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
          <span>Suggestions:</span>
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addChip(suggestion)}
              className="text-accent-secondary hover:underline hover:text-accent-primary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {helpText && !error && !warning && !showMaxChipWarning && (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      )}

      {showMaxChipWarning && (
        <p className="text-xs text-accent-warning">
          Maximum {maxChips} {maxChips === 1 ? 'chip' : 'chips'} allowed
        </p>
      )}

      {warning && !showMaxChipWarning && (
        <p className="text-xs text-accent-warning">{warning}</p>
      )}

      {error && (
        <p className="text-xs text-accent-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
