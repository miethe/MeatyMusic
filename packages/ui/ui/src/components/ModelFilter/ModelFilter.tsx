import * as React from "react";
import { cn } from "../../lib/utils";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { Skeleton } from "../Skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { ModelFilterGroup } from "./ModelFilterGroup";

// Enhanced Model interfaces for direct API integration
export interface EnhancedModel {
  id: string;
  provider: string;
  name: string;
  display_name: string;
  model_key: string;
  prompt_count?: number;
  section?: 'Official' | 'Yours';
  short_label?: string;
  family?: string;
  modalities?: string[];
  context_window?: number;
  max_output_tokens?: number;
  supports_tools: boolean;
  supports_json_mode: boolean;
  status: 'active' | 'deprecated' | 'beta';
  pricing?: {
    inputCostPer1k?: number;
    outputCostPer1k?: number;
    tier: 'free' | 'paid' | 'premium';
  };
}

export interface ModelData {
  id: string;
  model_key: string; // Use consistent field names from EnhancedModel
  provider: string;
  prompt_count: number;
  display_name: string;
}

export interface ModelGroup {
  provider: string;
  models: ModelData[];
  totalCount: number;
}

export interface ModelFilterProps {
  /** Array of enhanced models (preferred) */
  models?: EnhancedModel[];
  /** Array of model groups organized by provider (legacy, for backward compatibility) */
  modelGroups?: ModelGroup[];
  /** Currently selected model IDs */
  selectedModels: string[];
  /** Callback when model selection changes */
  onSelectionChange: (selectedModels: string[]) => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Whether to show the clear all button */
  showClearAll?: boolean;
  /** Callback for clearing all selections */
  onClearAll?: () => void;
  /** Maximum height of the filter list */
  maxHeight?: string;
  /** Custom className */
  className?: string;
  /** Whether the filter is disabled */
  disabled?: boolean;
}

/**
 * ModelFilter component for multi-selecting models grouped by provider.
 * Supports loading, error, and empty states with accessibility features.
 */
const ModelFilter = React.forwardRef<HTMLDivElement, ModelFilterProps>(
  (
    {
      models,
      modelGroups: legacyModelGroups,
      selectedModels,
      onSelectionChange,
      loading = false,
      error,
      onRetry,
      showClearAll = true,
      onClearAll,
      maxHeight = "400px",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Transform EnhancedModel[] to ModelGroup[] format when models prop is used
    const modelGroups = React.useMemo((): ModelGroup[] => {
      // Use legacy modelGroups if provided (backward compatibility)
      if (legacyModelGroups) {
        return legacyModelGroups;
      }

      // Transform EnhancedModel[] to ModelGroup[] format
      if (!models || !Array.isArray(models) || !models.length) {
        return [];
      }

      // Group models by provider
      const providerMap = new Map<string, EnhancedModel[]>();

      models.forEach((model) => {
        const provider = model.provider || 'Unknown';
        if (!providerMap.has(provider)) {
          providerMap.set(provider, []);
        }
        providerMap.get(provider)!.push(model);
      });

      // Convert to ModelGroup format
      const groups: ModelGroup[] = [];

      providerMap.forEach((models, provider) => {
        // Use EnhancedModel fields directly - no transformation needed
        const directModels: ModelData[] = models.map((model): ModelData => ({
          id: model.id,
          model_key: model.model_key,
          provider: model.provider || 'Unknown',
          prompt_count: model.prompt_count || 0,
          display_name: model.display_name,
        }));

        // Calculate total count for the provider
        const totalCount = directModels.reduce(
          (acc, model) => acc + model.prompt_count,
          0
        );

        groups.push({
          provider,
          models: directModels,
          totalCount,
        });
      });

      // Sort groups by provider name for consistency
      return groups.sort((a, b) => a.provider.localeCompare(b.provider));
    }, [models, legacyModelGroups]);

    const hasSelectedModels = selectedModels.length > 0;
    const totalModels = modelGroups.reduce((acc, group) => acc + group.models.length, 0);
    const hasModels = totalModels > 0;

    // Handle individual model toggle
    const handleModelToggle = React.useCallback(
      (modelId: string) => {
        if (disabled) return;

        const newSelectedModels = selectedModels.includes(modelId)
          ? selectedModels.filter(id => id !== modelId)
          : [...selectedModels, modelId];

        onSelectionChange(newSelectedModels);
      },
      [selectedModels, onSelectionChange, disabled]
    );

    // Handle provider group toggle
    const handleProviderToggle = React.useCallback(
      (provider: string, models: ModelData[]) => {
        if (disabled) return;

        const providerModelIds = models.map(model => model.id);
        const allProviderModelsSelected = providerModelIds.every(id =>
          selectedModels.includes(id)
        );

        let newSelectedModels: string[];
        if (allProviderModelsSelected) {
          // Deselect all provider models
          newSelectedModels = selectedModels.filter(id =>
            !providerModelIds.includes(id)
          );
        } else {
          // Select all provider models
          newSelectedModels = [
            ...selectedModels.filter(id => !providerModelIds.includes(id)),
            ...providerModelIds
          ];
        }

        onSelectionChange(newSelectedModels);
      },
      [selectedModels, onSelectionChange, disabled]
    );

    // Clear all selections
    const handleClearAll = React.useCallback(() => {
      if (disabled || !onClearAll) return;
      onClearAll();
      onSelectionChange([]);
    }, [onClearAll, onSelectionChange, disabled]);

    // Loading state
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn("space-y-4", className)}
          aria-label="Loading models"
          {...props}
        >
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <div className="ml-4 space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div
          ref={ref}
          className={cn("space-y-4", className)}
          role="alert"
          aria-label="Error loading models"
          {...props}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Failed to load models</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </Alert>
        </div>
      );
    }

    // Empty state
    if (!hasModels) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center py-8 text-center text-muted-foreground",
            className
          )}
          role="status"
          aria-label="No models available"
          {...props}
        >
          <div className="text-sm">No models available</div>
          <div className="text-xs mt-1">
            Models will appear here when they become available
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        role="group"
        aria-label="Model filters"
        {...props}
      >
        {/* Header with clear all button */}
        {showClearAll && hasSelectedModels && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedModels.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Model groups */}
        <div
          className="space-y-4 overflow-y-auto"
          style={{ maxHeight }}
          role="list"
          aria-label="Model providers"
        >
          {modelGroups.map((group) => (
            <ModelFilterGroup
              key={group.provider}
              provider={group.provider}
              models={group.models}
              selectedModels={selectedModels}
              onModelToggle={handleModelToggle}
              onProviderToggle={handleProviderToggle}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    );
  }
);

ModelFilter.displayName = "ModelFilter";

export { ModelFilter };
