/**
 * Capability Filter Component - Phase 2 Models Integration
 *
 * Advanced filtering interface for model capabilities with confidence levels.
 * Provides multi-dimensional filtering with visual indicators and search.
 *
 * Architecture:
 * - Uses @meaty/ui design system components
 * - Multi-select capability filtering
 * - Confidence level filtering
 * - Modality-based filtering
 * - Real-time filter updates
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Separator } from '../Separator';
import { Slider } from '../Slider';
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react';

// ===== TYPE DEFINITIONS =====

export interface CapabilityFilterOptions {
  capabilities: string[];
  confidenceLevel: {
    min: number;
    max: number;
  };
  modalities: string[];
  requireAllCapabilities: boolean;
  searchQuery: string;
}

export interface CapabilityFilterProps {
  /** Available capability types */
  availableCapabilities?: string[];
  /** Available modalities */
  availableModalities?: string[];
  /** Current filter state */
  filters: CapabilityFilterOptions;
  /** Filter change callback */
  onFiltersChange: (filters: CapabilityFilterOptions) => void;
  /** Show advanced options */
  showAdvanced?: boolean;
  /** Custom className */
  className?: string;
}

// ===== UTILITY FUNCTIONS =====

const formatCapabilityName = (type: string): string => {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DEFAULT_CAPABILITIES = [
  'text-generation',
  'code-generation',
  'function-calling',
  'image-understanding',
  'reasoning',
  'json-mode',
  'streaming'
];

const DEFAULT_MODALITIES = [
  'text',
  'image',
  'code',
  'function'
];

const CONFIDENCE_LEVELS = [
  { value: 0, label: 'Any' },
  { value: 0.5, label: 'Medium+' },
  { value: 0.75, label: 'High+' },
  { value: 0.9, label: 'Expert' }
];

// ===== MAIN COMPONENT =====

export const CapabilityFilter: React.FC<CapabilityFilterProps> = ({
  availableCapabilities = DEFAULT_CAPABILITIES,
  availableModalities = DEFAULT_MODALITIES,
  filters,
  onFiltersChange,
  showAdvanced = true,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');

  // ===== EVENT HANDLERS =====

  const handleCapabilityToggle = useCallback(
    (capability: string) => {
      const newCapabilities = filters.capabilities.includes(capability)
        ? filters.capabilities.filter(c => c !== capability)
        : [...filters.capabilities, capability];

      onFiltersChange({
        ...filters,
        capabilities: newCapabilities
      });
    },
    [filters, onFiltersChange]
  );

  const handleModalityToggle = useCallback(
    (modality: string) => {
      const newModalities = filters.modalities.includes(modality)
        ? filters.modalities.filter(m => m !== modality)
        : [...filters.modalities, modality];

      onFiltersChange({
        ...filters,
        modalities: newModalities
      });
    },
    [filters, onFiltersChange]
  );

  const handleConfidenceChange = useCallback(
    (values: number[]) => {
      onFiltersChange({
        ...filters,
        confidenceLevel: {
          min: values[0] / 100,
          max: values[1] / 100
        }
      });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      onFiltersChange({
        ...filters,
        searchQuery: query
      });
    },
    [filters, onFiltersChange]
  );

  const handleRequireAllToggle = useCallback(
    () => {
      onFiltersChange({
        ...filters,
        requireAllCapabilities: !filters.requireAllCapabilities
      });
    },
    [filters, onFiltersChange]
  );

  const clearAllFilters = useCallback(
    () => {
      setSearchQuery('');
      onFiltersChange({
        capabilities: [],
        confidenceLevel: { min: 0, max: 1 },
        modalities: [],
        requireAllCapabilities: false,
        searchQuery: ''
      });
    },
    [onFiltersChange]
  );

  // ===== DERIVED STATE =====

  const hasActiveFilters =
    filters.capabilities.length > 0 ||
    filters.modalities.length > 0 ||
    filters.confidenceLevel.min > 0 ||
    filters.confidenceLevel.max < 1 ||
    filters.searchQuery.length > 0;

  const filteredCapabilities = availableCapabilities.filter(capability =>
    searchQuery === '' ||
    capability.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatCapabilityName(capability).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== RENDER =====

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            <span>Capability Filters</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-1"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search Capabilities</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search capabilities..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Capabilities Selection */}
        <div className="space-y-3">
          <Label>Required Capabilities</Label>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {filteredCapabilities.map((capability) => (
              <div key={capability} className="flex items-center space-x-3">
                <Checkbox
                  id={capability}
                  checked={filters.capabilities.includes(capability)}
                  onCheckedChange={() => handleCapabilityToggle(capability)}
                />
                <Label
                  htmlFor={capability}
                  className="flex-1 text-sm font-normal cursor-pointer"
                >
                  {formatCapabilityName(capability)}
                </Label>
              </div>
            ))}
          </div>

          {/* Selected capabilities */}
          {filters.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.capabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleCapabilityToggle(capability)}
                >
                  {formatCapabilityName(capability)}
                  <XIcon className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Confidence Level */}
        <div className="space-y-3">
          <Label>Confidence Level Range</Label>
          <div className="px-3">
            <Slider
              value={[
                filters.confidenceLevel.min * 100,
                filters.confidenceLevel.max * 100
              ]}
              onValueChange={handleConfidenceChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{Math.round(filters.confidenceLevel.min * 100)}%</span>
              <span>{Math.round(filters.confidenceLevel.max * 100)}%</span>
            </div>
          </div>

          {/* Quick confidence presets */}
          <div className="flex gap-2">
            {CONFIDENCE_LEVELS.map((level) => (
              <Button
                key={level.value}
                variant="outline"
                size="sm"
                onClick={() => handleConfidenceChange([level.value * 100, 100])}
                className="text-xs"
              >
                {level.label}
              </Button>
            ))}
          </div>
        </div>

        {showAdvanced && (
          <>
            <Separator />

            {/* Modalities */}
            <div className="space-y-3">
              <Label>Supported Modalities</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableModalities.map((modality) => (
                  <div key={modality} className="flex items-center space-x-2">
                    <Checkbox
                      id={modality}
                      checked={filters.modalities.includes(modality)}
                      onCheckedChange={() => handleModalityToggle(modality)}
                    />
                    <Label
                      htmlFor={modality}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {modality}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Selected modalities */}
              {filters.modalities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.modalities.map((modality) => (
                    <Badge
                      key={modality}
                      variant="outline"
                      className="cursor-pointer capitalize"
                      onClick={() => handleModalityToggle(modality)}
                    >
                      {modality}
                      <XIcon className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-3">
              <Label>Advanced Options</Label>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="require-all"
                  checked={filters.requireAllCapabilities}
                  onCheckedChange={handleRequireAllToggle}
                />
                <Label htmlFor="require-all" className="text-sm font-normal cursor-pointer">
                  Require all selected capabilities
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, models must have ALL selected capabilities.
                When disabled, models need ANY of the selected capabilities.
              </p>
            </div>
          </>
        )}

        {/* Filter Summary */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-medium">Active Filters</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                {filters.capabilities.length > 0 && (
                  <div>
                    Capabilities: {filters.capabilities.length} selected
                    {filters.requireAllCapabilities && ' (all required)'}
                  </div>
                )}
                {(filters.confidenceLevel.min > 0 || filters.confidenceLevel.max < 1) && (
                  <div>
                    Confidence: {Math.round(filters.confidenceLevel.min * 100)}% - {Math.round(filters.confidenceLevel.max * 100)}%
                  </div>
                )}
                {filters.modalities.length > 0 && (
                  <div>Modalities: {filters.modalities.length} selected</div>
                )}
                {filters.searchQuery && (
                  <div>Search: "{filters.searchQuery}"</div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ===== EXPORT =====

export default CapabilityFilter;
