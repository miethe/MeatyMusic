'use client';

import { useState, useRef, useEffect } from 'react';

export interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  step?: number;
  unit?: string;
  allowRange?: boolean;
  presets?: Array<{ label: string; value: number | [number, number] }>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  allowRange = true,
  presets,
  error,
  required = false,
  disabled = false,
  helpText,
}: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const isRange = Array.isArray(value);
  const minValue = isRange ? value[0] : min;
  const maxValue = isRange ? value[1] : value;

  const getPositionFromValue = (val: number): number => {
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number): number => {
    if (!trackRef.current) return min;

    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percent * (max - min);
    return Math.round(rawValue / step) * step;
  };

  const handleMouseDown = (handle: 'min' | 'max') => (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;

    const newValue = getValueFromPosition(e.clientX);

    if (isRange) {
      const [currentMin, currentMax] = value as [number, number];
      if (isDragging === 'min') {
        onChange([Math.min(newValue, currentMax), currentMax]);
      } else {
        onChange([currentMin, Math.max(newValue, currentMin)]);
      }
    } else {
      onChange(newValue);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, value]);

  const toggleRangeMode = () => {
    if (disabled) return;
    if (isRange) {
      onChange((value as [number, number])[0]);
    } else {
      onChange([value as number, value as number]);
    }
  };

  const applyPreset = (presetValue: number | [number, number]) => {
    if (disabled) return;
    onChange(presetValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {allowRange && (
          <button
            type="button"
            onClick={toggleRangeMode}
            disabled={disabled}
            className="text-xs text-text-secondary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRange ? 'Single value' : 'Range'}
          </button>
        )}
      </div>

      <div className="relative pt-6 pb-2">
        <div
          ref={trackRef}
          className="relative h-1.5 bg-bg-elevated rounded-full cursor-pointer"
        >
          <div
            className="absolute h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
            style={{
              left: `${getPositionFromValue(minValue)}%`,
              right: `${100 - getPositionFromValue(maxValue)}%`,
            }}
          />

          {isRange && (
            <button
              type="button"
              onMouseDown={handleMouseDown('min')}
              disabled={disabled}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-bg-base shadow-md transition-transform hover:scale-110 active:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDragging === 'min' ? 'scale-125 shadow-lg' : ''
              }`}
              style={{ left: `${getPositionFromValue(minValue)}%` }}
              aria-label="Minimum value handle"
            />
          )}

          <button
            type="button"
            onMouseDown={handleMouseDown('max')}
            disabled={disabled}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-bg-base shadow-md transition-transform hover:scale-110 active:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDragging === 'max' ? 'scale-125 shadow-lg' : ''
            }`}
            style={{ left: `${getPositionFromValue(maxValue)}%` }}
            aria-label={isRange ? 'Maximum value handle' : 'Value handle'}
          />
        </div>

        <div className="flex justify-between mt-3 text-xs text-text-tertiary">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>

        <div className="flex justify-center mt-2">
          {isRange ? (
            <span className="text-sm font-semibold text-text-primary">
              {minValue}
              {unit} - {maxValue}
              {unit}
            </span>
          ) : (
            <span className="text-sm font-semibold text-text-primary">
              {maxValue}
              {unit}
            </span>
          )}
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.value)}
              disabled={disabled}
              className="px-3 py-1 text-xs rounded-md bg-bg-elevated text-text-secondary hover:bg-primary/20 hover:text-primary border border-border-default hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {helpText && !error && (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
