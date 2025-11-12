import * as React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';
import { ModelPickerSearch } from './ModelPickerSearch';
import { ModelPickerFilters } from './ModelPickerFilters';
import { ModelPickerList } from './ModelPickerList';
import { ModelFilter, ModelGroup, ModelCapability } from './types';

export interface ModelPickerContentProps {
  // Data
  modelGroups: ModelGroup[];
  selectedModels: string[];

  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchable?: boolean;
  isSearching?: boolean;

  // Filters
  filters: ModelFilter;
  onFiltersChange: (filters: Partial<ModelFilter>) => void;
  availableProviders: string[];
  availableCapabilities: ModelCapability[];
  filterable?: boolean;

  // List
  onModelSelect: (modelId: string) => void;
  virtualized?: boolean;
  showDetails?: boolean;

  // State
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;

  // Layout
  maxHeight?: string;
  className?: string;

  // Accessibility
  searchId?: string;
  filtersId?: string;
  resultsSummaryId?: string;
}

export const ModelPickerContent = React.forwardRef<
  HTMLDivElement,
  ModelPickerContentProps
>(({
  modelGroups,
  selectedModels,
  searchQuery,
  onSearchChange,
  searchable = true,
  isSearching = false,
  filters,
  onFiltersChange,
  availableProviders,
  availableCapabilities,
  filterable = true,
  onModelSelect,
  virtualized = false,
  showDetails = true,
  loading = false,
  error = null,
  onRetry,
  maxHeight = "400px",
  className,
  searchId,
  filtersId,
  resultsSummaryId,
  ...props
}, ref) => {
  const totalModels = React.useMemo(() =>
    modelGroups.reduce((acc, group) => acc + group.models.length, 0),
    [modelGroups]
  );

  // Loading state
  if (loading) {
    return (
      <div
        ref={ref}
        className={cn("p-4", className)}
        style={{ maxHeight }}
        role="status"
        aria-label="Loading models"
        aria-describedby="loading-description"
        {...props}
      >
        <div id="loading-description" className="sr-only">
          Please wait while models are being loaded.
        </div>
        <div className="space-y-4">
          {/* Search skeleton */}
          {searchable && (
            <Skeleton className="h-10 w-full" aria-label="Search input loading" />
          )}

          {/* Filters skeleton */}
          {filterable && (
            <Skeleton className="h-8 w-full" aria-label="Filters loading" />
          )}

          {/* List skeleton */}
          <div className="space-y-2" aria-label="Model list loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        ref={ref}
        className={cn("p-4", className)}
        style={{ maxHeight }}
        role="alert"
        aria-labelledby="error-title"
        aria-describedby="error-description"
        {...props}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <div className="flex-1">
            <div id="error-title" className="font-medium">
              Failed to load models
            </div>
            <div id="error-description" className="text-sm mt-1">
              {error}
            </div>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-2"
              aria-describedby="retry-description"
            >
              <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
              Retry
            </Button>
          )}
        </Alert>
        {onRetry && (
          <div id="retry-description" className="sr-only">
            Click to try loading models again
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      style={{ maxHeight }}
      role="group"
      aria-label="Model picker content"
      {...props}
    >
      {/* Header Section */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-3 space-y-3">
          {/* Search */}
          {searchable && (
            <div role="search">
              <ModelPickerSearch
                id={searchId}
                value={searchQuery}
                onChange={onSearchChange}
                isSearching={isSearching}
                placeholder="Search models..."
                aria-describedby={searchId ? `${searchId}-help` : undefined}
              />
              {searchId && (
                <div id={`${searchId}-help`} className="sr-only">
                  Type to search for models by name, provider, or capabilities. Use arrow keys to navigate results.
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {filterable && (
            <div role="group" aria-labelledby="filters-label">
              <h3 id="filters-label" className="sr-only">Model filters</h3>
              <ModelPickerFilters
                id={filtersId}
                filters={filters}
                onFiltersChange={onFiltersChange}
                availableProviders={availableProviders}
                availableCapabilities={availableCapabilities}
                compact
                collapsible
              />
            </div>
          )}

          {/* Results summary */}
          {(searchQuery || Object.values(filters).some(f =>
            Array.isArray(f) ? f.length > 0 : false
          )) && (
            <div
              id={resultsSummaryId}
              className="flex items-center justify-between text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span>
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    <span aria-label="Searching for models">Searching...</span>
                  </span>
                ) : (
                  <span aria-label={`Search and filter results: ${totalModels} model${totalModels !== 1 ? 's' : ''} found`}>
                    {`${totalModels} model${totalModels !== 1 ? 's' : ''} found`}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 min-h-0" role="main" aria-label="Model selection list">
        <ModelPickerList
          modelGroups={modelGroups}
          selectedModels={selectedModels}
          onModelSelect={onModelSelect}
          virtualized={virtualized}
          showDetails={showDetails}
          emptyMessage={
            searchQuery
              ? `No models match "${searchQuery}"`
              : "No models available"
          }
        />
      </main>
    </div>
  );
});

ModelPickerContent.displayName = "ModelPickerContent";
