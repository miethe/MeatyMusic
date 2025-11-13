import * as React from 'react';
import { EnhancedModel, ModelFilter, ModelPickerContextValue } from '../types';
import {
  applyModelFilters,
  groupModelsByProvider,
  createInitialFilters,
  createModelSearchEngine,
} from '../utils';

export interface UseModelPickerProps {
  models: EnhancedModel[];
  value?: string | string[];
  onValueChange: (value: string | string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  taggable?: boolean;
  loading?: boolean;
  error?: string | null;
}

export function useModelPicker({
  models = [],
  value,
  onValueChange,
  multiple = false,
  searchable = true,
  filterable = true,
  taggable = true,
  loading = false,
  error = null,
}: UseModelPickerProps): ModelPickerContextValue {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<ModelFilter>(createInitialFilters);

  // Normalize selected models to array
  const selectedModels = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Create search engine instance
  const searchEngine = React.useMemo(() => {
    return createModelSearchEngine(models);
  }, [models]);

  // Apply search and filters
  const filteredModels = React.useMemo(() => {
    let filtered = models;

    // Apply filters first
    if (filterable) {
      filtered = applyModelFilters(filtered, filters);
    }

    // Apply search
    if (searchable && searchQuery.trim()) {
      const searchResults = searchEngine.search(searchQuery);
      filtered = searchResults.map((result: any) => result.item);
    }

    return filtered;
  }, [models, filters, searchQuery, searchEngine, searchable, filterable]);

  // Group models by provider
  const modelGroups = React.useMemo(() => {
    return groupModelsByProvider(filteredModels);
  }, [filteredModels]);

  // Get selected model data
  const selectedModelData = React.useMemo(() => {
    return models.filter(model => selectedModels.includes(model.id));
  }, [models, selectedModels]);

  // Selection handlers
  const selectModel = React.useCallback(
    (modelId: string) => {
      if (selectedModels.includes(modelId)) return;

      const newValue = multiple
        ? [...selectedModels, modelId]
        : modelId;

      onValueChange(newValue);

      // Close if single select
      if (!multiple) {
        setIsOpen(false);
      }
    },
    [selectedModels, multiple, onValueChange]
  );

  const deselectModel = React.useCallback(
    (modelId: string) => {
      const newSelectedModels = selectedModels.filter(id => id !== modelId);
      const newValue = multiple ? newSelectedModels : '';
      onValueChange(newValue);
    },
    [selectedModels, multiple, onValueChange]
  );

  const clearSelection = React.useCallback(() => {
    const newValue = multiple ? [] : '';
    onValueChange(newValue);
  }, [multiple, onValueChange]);

  // Filter handlers
  const updateFilters = React.useCallback(
    (newFilters: Partial<ModelFilter>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Reset search when dropdown closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return {
    // State
    models,
    filteredModels,
    selectedModels,
    isOpen,
    searchQuery,
    filters,
    loading,
    error,

    // Actions
    setIsOpen,
    setSearchQuery,
    setFilters: updateFilters,
    selectModel,
    deselectModel,
    clearSelection,

    // Computed
    selectedModelData,
    modelGroups,
    hasSelection: selectedModels.length > 0,

    // Configuration
    multiple,
    searchable,
    filterable,
    taggable,
  };
}
