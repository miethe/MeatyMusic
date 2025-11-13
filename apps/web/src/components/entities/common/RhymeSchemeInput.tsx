'use client';

import { useState } from 'react';

export interface RhymeSchemeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

const COMMON_PATTERNS = [
  { label: 'AABB (Couplet)', value: 'AABB' },
  { label: 'ABAB (Alternate)', value: 'ABAB' },
  { label: 'ABCB (Simple)', value: 'ABCB' },
  { label: 'AAAA (Monorhyme)', value: 'AAAA' },
  { label: 'ABBA (Enclosed)', value: 'ABBA' },
];

const RHYME_COLORS = [
  'bg-accent-primary/30 border-accent-primary',
  'bg-accent-secondary/30 border-accent-secondary',
  'bg-accent-music/30 border-accent-music',
  'bg-accent-success/30 border-accent-success',
  'bg-accent-warning/30 border-accent-warning',
];

export function RhymeSchemeInput({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  helpText,
}: RhymeSchemeInputProps) {
  const [customInput, setCustomInput] = useState(value);

  const handlePatternClick = (pattern: string) => {
    if (disabled) return;
    onChange(pattern);
    setCustomInput(pattern);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    const cleaned = newValue.replace(/[^A-Z]/g, '');
    setCustomInput(cleaned);
    onChange(cleaned);
  };

  const getColorForLetter = (letter: string, letters: string[]): string => {
    const uniqueLetters = Array.from(new Set(letters));
    const index = uniqueLetters.indexOf(letter);
    return RHYME_COLORS[index % RHYME_COLORS.length];
  };

  const visualizeScheme = (scheme: string): JSX.Element[] => {
    if (!scheme) return [];

    const letters = scheme.split('');
    const elements: JSX.Element[] = [];
    const lineGroups: { [key: string]: number[] } = {};

    letters.forEach((letter, index) => {
      if (!lineGroups[letter]) {
        lineGroups[letter] = [];
      }
      lineGroups[letter].push(index);
    });

    letters.forEach((letter, index) => {
      const color = getColorForLetter(letter, letters);
      const isLastInGroup =
        lineGroups[letter][lineGroups[letter].length - 1] === index;

      elements.push(
        <div
          key={index}
          className="flex items-center gap-3 py-2"
        >
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${color} text-sm font-bold`}
          >
            {letter}
          </span>
          <span className="text-sm text-text-secondary">Line {index + 1}</span>
          {lineGroups[letter].length > 1 && !isLastInGroup && (
            <svg
              width="2"
              height="32"
              className="ml-3"
              style={{ marginLeft: '1rem' }}
            >
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="32"
                stroke="currentColor"
                strokeWidth="2"
                className={color.split(' ')[1].replace('border-', 'text-')}
              />
            </svg>
          )}
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-accent-error ml-1">*</span>}
      </label>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-secondary mb-2">
            Pattern
          </label>
          <input
            type="text"
            value={customInput}
            onChange={handleCustomChange}
            disabled={disabled}
            placeholder="Enter pattern (e.g., ABAB)"
            className={`w-full px-4 py-2 rounded-lg bg-background-tertiary border ${
              error ? 'border-accent-error' : 'border-border-secondary'
            } text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-2">
            Common Patterns
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_PATTERNS.map((pattern) => (
              <button
                key={pattern.value}
                type="button"
                onClick={() => handlePatternClick(pattern.value)}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  value === pattern.value
                    ? 'bg-accent-primary text-text-inverted border-accent-primary'
                    : 'bg-background-tertiary text-text-secondary border-border-secondary hover:border-accent-primary hover:text-accent-primary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </div>

        {value && (
          <div>
            <label className="block text-xs text-text-secondary mb-2">
              Visualization
            </label>
            <div className="p-4 rounded-lg bg-background-tertiary border border-border-secondary">
              <div className="space-y-1">{visualizeScheme(value)}</div>
            </div>
          </div>
        )}
      </div>

      {helpText && !error && (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-accent-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
