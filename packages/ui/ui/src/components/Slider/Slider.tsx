/**
 * Simple Slider Component
 *
 * Basic range input wrapper for @meaty/ui design system
 */

'use client';

import React from 'react';

export interface SliderProps {
  value: number | number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  className = '',
}) => {
  const normalizedValue = Array.isArray(value) ? value : [value];
  const isRange = normalizedValue.length === 2;

  const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseInt(e.target.value)]);
  };

  const handleRangeChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = [...normalizedValue];
    newValue[index] = parseInt(e.target.value);
    onValueChange(newValue);
  };

  if (isRange) {
    return (
      <div className={`relative w-full ${className}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={normalizedValue[0]}
          onChange={handleRangeChange(0)}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={normalizedValue[1]}
          onChange={handleRangeChange(1)}
          className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
        />
      </div>
    );
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={normalizedValue[0]}
      onChange={handleSingleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
      style={{
        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((normalizedValue[0] - min) / (max - min)) * 100}%, #E5E7EB ${((normalizedValue[0] - min) / (max - min)) * 100}%, #E5E7EB 100%)`
      }}
    />
  );
};

export default Slider;
