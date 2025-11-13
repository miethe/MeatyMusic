"use client";
import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../Popover';
import { ModelPickerTrigger } from './ModelPickerTrigger';
import { ModelPickerContent } from './ModelPickerContent';
import { useModelPicker } from './hooks/useModelPicker';
import { useModelFilters } from './hooks/useModelFilters';
import { ModelPickerProps, EnhancedModel } from './types';

// Accessibility hooks
const useAccessibilityId = (prefix: string) => {
  const id = React.useId();
  return `${prefix}-${id}`;
};

const useLiveRegion = () => {
  const [announcement, setAnnouncement] = React.useState<string>('');
  const [isPolite, setIsPolite] = React.useState(true);

  const announce = React.useCallback((message: string, assertive = false) => {
    setIsPolite(!assertive);
    setAnnouncement(message);
    // Clear announcement after a brief delay to allow screen readers to process
    setTimeout(() => setAnnouncement(''), 100);
  }, []);

  return { announcement, isPolite, announce };
};

// Context for compound components
interface ModelPickerAccessibilityContext {
  announce: (message: string, assertive?: boolean) => void;
  describedBy?: string;
  labelledBy?: string;
}

const ModelPickerContext = React.createContext<ReturnType<typeof useModelPicker> | null>(null);
const AccessibilityContext = React.createContext<ModelPickerAccessibilityContext | null>(null);

const useModelPickerContext = () => {
  const context = React.useContext(ModelPickerContext);
  if (!context) {
    throw new Error('ModelPicker components must be used within ModelPicker');
  }
  return context;
};

const useAccessibilityContext = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('AccessibilityContext must be used within ModelPicker');
  }
  return context;
};

/**
 * Enhanced ModelPicker component with advanced filtering, search, and accessibility features
 */
const ModelPicker = React.forwardRef<
  HTMLButtonElement,
  ModelPickerProps & {
    models: EnhancedModel[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    /** ARIA label for the model picker */
    'aria-label'?: string;
    /** ID of element that labels this model picker */
    'aria-labelledby'?: string;
    /** ID of element that describes this model picker */
    'aria-describedby'?: string;
    /** Additional screen reader description */
    'aria-description'?: string;
  }
>(({
    models = [],
    value,
    onValueChange,
    multiple = false,
    placeholder = "Select a model...",
    disabled = false,
    error,
    providers,
    capabilities,
    searchable = true,
    filterable = true,
    taggable = true,
    virtualized = false,
    maxHeight = "400px",
    className,
    children,
    loading = false,
    error: loadError = null,
    onRetry,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-description': ariaDescription,
    ...props
  }, ref) => {
  // Generate unique IDs for accessibility
  const pickerId = useAccessibilityId('model-picker');
  const contentId = `${pickerId}-content`;
  const searchId = `${pickerId}-search`;
  const filtersId = `${pickerId}-filters`;
  const resultsSummaryId = `${pickerId}-results-summary`;
  const errorId = `${pickerId}-error`;

  // Live region for announcements
  const { announcement, isPolite, announce } = useLiveRegion();
  // Filter models based on props constraints
  const filteredModels = React.useMemo(() => {
    let filtered = models;

    if (providers && providers.length > 0) {
      filtered = filtered.filter(model => providers.includes(model.provider));
    }

    if (capabilities && capabilities.length > 0) {
      filtered = filtered.filter(model =>
        capabilities.some(cap =>
          model.capabilities.some(modelCap => modelCap.id === cap)
        )
      );
    }

    return filtered;
  }, [models, providers, capabilities]);

  // Initialize picker state
  const pickerState = useModelPicker({
    models: filteredModels,
    value,
    onValueChange,
    multiple,
    searchable,
    filterable,
    taggable,
    loading,
    error: loadError,
  });

  // Initialize filters
  const filtersState = useModelFilters({
    models: filteredModels,
    filters: pickerState.filters,
    onFiltersChange: pickerState.setFilters,
  });

  // Handle model selection with accessibility announcements
  const handleModelSelect = React.useCallback(
    (modelId: string) => {
      const model = filteredModels.find(m => m.id === modelId);
      const isSelected = pickerState.selectedModels.includes(modelId);

      if (isSelected) {
        pickerState.deselectModel(modelId);
        if (model) {
          announce(`${model.display_name} deselected`, true);
        }
      } else {
        pickerState.selectModel(modelId);
        if (model) {
          const message = multiple
            ? `${model.display_name} selected. ${pickerState.selectedModels.length + 1} models selected.`
            : `${model.display_name} selected`;
          announce(message, true);
        }
      }
    },
    [pickerState, filteredModels, multiple, announce]
  );

  // Handle removing model from trigger with accessibility announcements
  const handleRemoveModel = React.useCallback(
    (modelId: string) => {
      const model = pickerState.models.find(m => m.id === modelId);
      pickerState.deselectModel(modelId);
      if (model) {
        const remainingCount = pickerState.selectedModels.length - 1;
        const message = remainingCount > 0
          ? `${model.display_name} removed. ${remainingCount} models remaining.`
          : `${model.display_name} removed. No models selected.`;
        announce(message, true);
      }
    },
    [pickerState, announce]
  );

  // Enhanced keyboard navigation with accessibility announcements
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          if (!pickerState.isOpen) {
            e.preventDefault();
            pickerState.setIsOpen(true);
            announce('Model picker opened', true);
          }
          break;
        case 'Escape':
          if (pickerState.isOpen) {
            e.preventDefault();
            pickerState.setIsOpen(false);
            announce('Model picker closed', true);
          }
          break;
        case 'ArrowDown':
        case 'ArrowUp':
          if (!pickerState.isOpen) {
            e.preventDefault();
            pickerState.setIsOpen(true);
            announce('Model picker opened', true);
          }
          break;
      }
    },
    [disabled, pickerState, announce]
  );

  // Create accessibility context
  const accessibilityContext: ModelPickerAccessibilityContext = {
    announce,
    describedBy: ariaDescribedBy || (error ? errorId : undefined),
    labelledBy: ariaLabelledBy,
  };

  // Announce loading state changes
  React.useEffect(() => {
    if (loading) {
      announce('Loading models...', true);
    }
  }, [loading, announce]);

  // Announce error state changes
  React.useEffect(() => {
    if (loadError) {
      announce(`Error loading models: ${loadError}`, true);
    }
  }, [loadError, announce]);

  // Announce filter/search result changes
  React.useEffect(() => {
    const totalModels = pickerState.modelGroups.reduce(
      (acc, group) => acc + group.models.length, 0
    );

    if (pickerState.searchQuery || Object.values(pickerState.filters).some(f =>
      Array.isArray(f) ? f.length > 0 : false
    )) {
      const message = totalModels === 0
        ? 'No models found for the current search or filters'
        : `${totalModels} model${totalModels !== 1 ? 's' : ''} found`;
      announce(message);
    }
  }, [pickerState.modelGroups, pickerState.searchQuery, pickerState.filters, announce]);

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        aria-live={isPolite ? 'polite' : 'assertive'}
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      <ModelPickerContext.Provider value={pickerState}>
        <AccessibilityContext.Provider value={accessibilityContext}>
          <Popover
            open={pickerState.isOpen}
            onOpenChange={(open) => {
              pickerState.setIsOpen(open);
              if (!open) {
                announce('Model picker closed');
              }
            }}
          >
            <PopoverTrigger asChild>
              <ModelPickerTrigger
                ref={ref}
                id={pickerId}
                selectedModels={pickerState.selectedModelData}
                placeholder={placeholder}
                disabled={disabled}
                error={error}
                isOpen={pickerState.isOpen}
                multiple={multiple}
                onRemoveModel={multiple ? handleRemoveModel : undefined}
                className={className}
                onKeyDown={handleKeyDown}
                aria-label={ariaLabel || `Model picker. ${pickerState.selectedModels.length > 0
                  ? `${pickerState.selectedModels.length} model${pickerState.selectedModels.length !== 1 ? 's' : ''} selected`
                  : 'No models selected'}.`}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={cn(
                  ariaDescribedBy,
                  error ? errorId : undefined,
                  ariaDescription ? `${pickerId}-description` : undefined
                ).trim() || undefined}
                aria-controls={contentId}
                aria-haspopup="listbox"
                {...props}
              >
                {children}
              </ModelPickerTrigger>
            </PopoverTrigger>

            <PopoverContent
              id={contentId}
              className="p-0 w-[400px]"
              align="start"
              sideOffset={4}
              side="bottom"
              role="dialog"
              aria-label="Model selection dialog"
              onOpenAutoFocus={(e) => {
                // Don't auto-focus the content, let the search or first item get focus
                e.preventDefault();
              }}
            >
              <ModelPickerContent
                modelGroups={pickerState.modelGroups}
                selectedModels={pickerState.selectedModels}
                searchQuery={pickerState.searchQuery}
                onSearchChange={pickerState.setSearchQuery}
                searchable={searchable}
                filters={pickerState.filters}
                onFiltersChange={pickerState.setFilters}
                availableProviders={filtersState.availableProviders}
                availableCapabilities={filtersState.availableCapabilities}
                filterable={filterable}
                onModelSelect={handleModelSelect}
                virtualized={virtualized}
                loading={loading}
                error={loadError}
                onRetry={onRetry}
                maxHeight={maxHeight}
                searchId={searchId}
                filtersId={filtersId}
                resultsSummaryId={resultsSummaryId}
              />
            </PopoverContent>
          </Popover>

          {/* Hidden description for screen readers */}
          {ariaDescription && (
            <div id={`${pickerId}-description`} className="sr-only">
              {ariaDescription}
            </div>
          )}

          {/* Error message for screen readers */}
          {error && (
            <div id={errorId} className="sr-only" role="alert">
              {error}
            </div>
          )}
        </AccessibilityContext.Provider>
      </ModelPickerContext.Provider>
    </>
  );
});

ModelPicker.displayName = "ModelPicker";

// Compound component exports for advanced usage
const ModelPickerRoot = ({ children, ...props }: React.PropsWithChildren<Partial<ModelPickerProps>>) => (
  <Popover {...props}>
    {children}
  </Popover>
);

const ModelPickerTriggerCompound = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentProps<typeof ModelPickerTrigger>, 'selectedModels' | 'isOpen'>
>((props, ref) => {
  const state = useModelPickerContext();
  return (
    <PopoverTrigger asChild>
      <ModelPickerTrigger
        ref={ref}
        selectedModels={state.selectedModelData}
        isOpen={state.isOpen}
        {...props}
      />
    </PopoverTrigger>
  );
});

const ModelPickerContentCompound = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof ModelPickerContent>,
    'modelGroups' | 'selectedModels' | 'searchQuery' | 'filters' | 'availableProviders' | 'availableCapabilities' | 'onSearchChange' | 'onFiltersChange' | 'onModelSelect'
  >
>((props, ref) => {
  const state = useModelPickerContext();
  const filtersState = useModelFilters({
    models: state.models,
    filters: state.filters,
    onFiltersChange: state.setFilters,
  });

  return (
    <PopoverContent className="p-0 w-[400px]" align="start">
      <ModelPickerContent
        ref={ref}
        modelGroups={state.modelGroups}
        selectedModels={state.selectedModels}
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        filters={state.filters}
        onFiltersChange={state.setFilters}
        availableProviders={filtersState.availableProviders}
        availableCapabilities={filtersState.availableCapabilities}
        onModelSelect={(modelId) => {
          if (state.selectedModels.includes(modelId)) {
            state.deselectModel(modelId);
          } else {
            state.selectModel(modelId);
          }
        }}
        {...props}
      />
    </PopoverContent>
  );
});

ModelPickerTriggerCompound.displayName = "ModelPickerTrigger";
ModelPickerContentCompound.displayName = "ModelPickerContent";

export {
  ModelPicker,
  ModelPickerRoot,
  ModelPickerTriggerCompound as ModelPickerTrigger,
  ModelPickerContentCompound as ModelPickerContent,
  useModelPickerContext,
  useAccessibilityContext,
};

export type { ModelPickerProps };
