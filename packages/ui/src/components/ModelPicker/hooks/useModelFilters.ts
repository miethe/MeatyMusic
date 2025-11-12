import * as React from 'react';
import { EnhancedModel, ModelFilter, ModelCapability } from '../types';
import {
  getUniqueProviders,
  getUniqueCapabilities,
  getPriceRange,
  getContextWindowRange,
  createInitialFilters,
} from '../utils';

export interface UseModelFiltersProps {
  models: EnhancedModel[];
  filters: ModelFilter;
  onFiltersChange: (filters: Partial<ModelFilter>) => void;
}

export interface UseModelFiltersReturn {
  filters: ModelFilter;
  updateFilter: <K extends keyof ModelFilter>(key: K, value: ModelFilter[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;

  // Available filter options
  availableProviders: string[];
  availableCapabilities: ModelCapability[];
  priceRange: [number, number];
  contextWindowRange: [number, number];

  // Filter counts
  getFilterCount: (filterType: keyof ModelFilter) => number;
}

export function useModelFilters({
  models,
  filters,
  onFiltersChange,
}: UseModelFiltersProps): UseModelFiltersReturn {

  // Available filter options
  const availableProviders = React.useMemo(() =>
    getUniqueProviders(models),
    [models]
  );

  const availableCapabilities = React.useMemo(() =>
    getUniqueCapabilities(models),
    [models]
  );

  const priceRange = React.useMemo(() =>
    getPriceRange(models),
    [models]
  );

  const contextWindowRange = React.useMemo(() =>
    getContextWindowRange(models),
    [models]
  );

  // Update filter handler
  const updateFilter = React.useCallback(
    <K extends keyof ModelFilter>(key: K, value: ModelFilter[K]) => {
      onFiltersChange({ [key]: value });
    },
    [onFiltersChange]
  );

  // Reset filters
  const resetFilters = React.useCallback(() => {
    onFiltersChange(createInitialFilters());
  }, [onFiltersChange]);

  // Check if filters are active
  const hasActiveFilters = React.useMemo(() => {
    const initialFilters = createInitialFilters();

    return (
      filters.search !== initialFilters.search ||
      filters.providers.length > 0 ||
      filters.capabilities.length > 0 ||
      filters.modelTypes.length > 0 ||
      filters.status.length > 0 ||
      filters.tags.length > 0 ||
      filters.priceRange[0] !== initialFilters.priceRange[0] ||
      filters.priceRange[1] !== initialFilters.priceRange[1] ||
      filters.contextWindowRange[0] !== initialFilters.contextWindowRange[0] ||
      filters.contextWindowRange[1] !== initialFilters.contextWindowRange[1]
    );
  }, [filters]);

  // Get filter count for a specific filter type
  const getFilterCount = React.useCallback(
    (filterType: keyof ModelFilter): number => {
      const value = filters[filterType];

      if (Array.isArray(value)) {
        return value.length;
      }

      if (filterType === 'search') {
        return value ? 1 : 0;
      }

      // For range filters, check if they differ from default
      if (filterType === 'priceRange') {
        const range = filters[filterType];
        const [min, max] = range;
        const [defaultMin, defaultMax] = priceRange;
        return (min !== defaultMin || max !== defaultMax) ? 1 : 0;
      }

      if (filterType === 'contextWindowRange') {
        const range = filters[filterType];
        const [min, max] = range;
        const [defaultMin, defaultMax] = contextWindowRange;
        return (min !== defaultMin || max !== defaultMax) ? 1 : 0;
      }

      return 0;
    },
    [filters, priceRange, contextWindowRange]
  );

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,

    // Available options
    availableProviders,
    availableCapabilities,
    priceRange,
    contextWindowRange,

    // Filter counts
    getFilterCount,
  };
}
