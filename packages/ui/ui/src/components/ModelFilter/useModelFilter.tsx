import { useState, useCallback, useMemo } from 'react';
import type { ModelData, ModelGroup } from './ModelFilter';

export interface UseModelFilterOptions {
  /** Initial selected model IDs */
  initialSelected?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedModels: string[]) => void;
  /** Maximum number of models that can be selected */
  maxSelections?: number;
}

export interface UseModelFilterReturn {
  /** Currently selected model IDs */
  selectedModels: string[];
  /** Set the selected models directly */
  setSelectedModels: (models: string[]) => void;
  /** Toggle a single model selection */
  toggleModel: (modelId: string) => void;
  /** Toggle all models for a provider */
  toggleProvider: (provider: string, models: ModelData[]) => void;
  /** Clear all selections */
  clearAll: () => void;
  /** Select all models */
  selectAll: (modelGroups: ModelGroup[]) => void;
  /** Check if a model is selected */
  isModelSelected: (modelId: string) => boolean;
  /** Check if all models in a provider are selected */
  isProviderFullySelected: (models: ModelData[]) => boolean;
  /** Check if some models in a provider are selected */
  isProviderPartiallySelected: (models: ModelData[]) => boolean;
  /** Get selection statistics */
  selectionStats: {
    total: number;
    selectedCount: number;
    hasSelections: boolean;
    isMaxReached: boolean;
  };
}

/**
 * Custom hook for managing ModelFilter selection state
 * with provider-level and individual model operations.
 */
export function useModelFilter({
  initialSelected = [],
  onSelectionChange,
  maxSelections,
}: UseModelFilterOptions = {}): UseModelFilterReturn {
  const [selectedModels, setSelectedModelsInternal] = useState<string[]>(initialSelected);

  // Wrapped setter that calls the callback
  const setSelectedModels = useCallback(
    (models: string[]) => {
      const limitedModels = maxSelections ? models.slice(0, maxSelections) : models;
      setSelectedModelsInternal(limitedModels);
      onSelectionChange?.(limitedModels);
    },
    [onSelectionChange, maxSelections]
  );

  // Toggle a single model
  const toggleModel = useCallback(
    (modelId: string) => {
      const newSelection = selectedModels.includes(modelId)
        ? selectedModels.filter(id => id !== modelId)
        : [...selectedModels, modelId];

      setSelectedModels(newSelection);
    },
    [selectedModels, setSelectedModels]
  );

  // Toggle all models for a provider
  const toggleProvider = useCallback(
    (provider: string, models: ModelData[]) => {
      const providerModelIds = models.map(model => model.id);
      const allProviderModelsSelected = providerModelIds.every(id =>
        selectedModels.includes(id)
      );

      let newSelection: string[];
      if (allProviderModelsSelected) {
        // Deselect all provider models
        newSelection = selectedModels.filter(id => !providerModelIds.includes(id));
      } else {
        // Select all provider models (respecting max limit)
        const otherModels = selectedModels.filter(id => !providerModelIds.includes(id));
        const allModels = [...otherModels, ...providerModelIds];
        newSelection = maxSelections ? allModels.slice(0, maxSelections) : allModels;
      }

      setSelectedModels(newSelection);
    },
    [selectedModels, setSelectedModels, maxSelections]
  );

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedModels([]);
  }, [setSelectedModels]);

  // Select all models
  const selectAll = useCallback(
    (modelGroups: ModelGroup[]) => {
      const allModelIds = modelGroups.flatMap(group =>
        group.models.map(model => model.id)
      );
      const limitedSelection = maxSelections
        ? allModelIds.slice(0, maxSelections)
        : allModelIds;

      setSelectedModels(limitedSelection);
    },
    [setSelectedModels, maxSelections]
  );

  // Check if a model is selected
  const isModelSelected = useCallback(
    (modelId: string) => selectedModels.includes(modelId),
    [selectedModels]
  );

  // Check if all models in a provider are selected
  const isProviderFullySelected = useCallback(
    (models: ModelData[]) => {
      if (models.length === 0) return false;
      return models.every(model => selectedModels.includes(model.id));
    },
    [selectedModels]
  );

  // Check if some models in a provider are selected
  const isProviderPartiallySelected = useCallback(
    (models: ModelData[]) => {
      const selectedCount = models.filter(model =>
        selectedModels.includes(model.id)
      ).length;
      return selectedCount > 0 && selectedCount < models.length;
    },
    [selectedModels]
  );

  // Selection statistics
  const selectionStats = useMemo(() => {
    const selectedCount = selectedModels.length;
    const hasSelections = selectedCount > 0;
    const isMaxReached = maxSelections ? selectedCount >= maxSelections : false;

    return {
      total: maxSelections || Infinity,
      selectedCount,
      hasSelections,
      isMaxReached,
    };
  }, [selectedModels.length, maxSelections]);

  return {
    selectedModels,
    setSelectedModels,
    toggleModel,
    toggleProvider,
    clearAll,
    selectAll,
    isModelSelected,
    isProviderFullySelected,
    isProviderPartiallySelected,
    selectionStats,
  };
}
