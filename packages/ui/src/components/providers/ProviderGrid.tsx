/**
 * Provider Grid Component - Phase 2 Models Integration
 *
 * Grid layout for displaying multiple provider cards with filtering and sorting.
 * Provides responsive grid layout and interactive provider selection.
 *
 * Architecture:
 * - Uses @meaty/ui design system components
 * - Responsive grid layout with card components
 * - Filtering by health status and service level
 * - Sorting by various provider metrics
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import { ProviderCard, type ProviderData } from './ProviderCard';
import { SearchIcon, FilterIcon, GridIcon, ListIcon } from 'lucide-react';

// ===== TYPE DEFINITIONS =====

export interface ProviderGridProps {
  /** Array of provider data */
  providers: ProviderData[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Show search and filters */
  showFilters?: boolean;
  /** Grid columns (responsive) */
  columns?: 1 | 2 | 3 | 4;
  /** Default view mode */
  defaultViewMode?: 'grid' | 'list';
  /** Compact card mode */
  compact?: boolean;
  /** Provider selection handler */
  onProviderSelect?: (provider: ProviderData) => void;
  /** Custom className */
  className?: string;
}

type SortOption = 'name' | 'models' | 'trust_score' | 'established_date' | 'health_status';
type FilterOption = {
  search: string;
  healthStatus: string;
  serviceLevel: string;
  pricingModel: string;
};

// ===== UTILITY FUNCTIONS =====

const defaultFilters: FilterOption = {
  search: '',
  healthStatus: 'all',
  serviceLevel: 'all',
  pricingModel: 'all'
};

const sortProviders = (providers: ProviderData[], sortBy: SortOption, ascending: boolean = true): ProviderData[] => {
  const sorted = [...providers].sort((a, b) => {
    let aValue: any = '';
    let bValue: any = '';

    switch (sortBy) {
      case 'name':
        aValue = a.display_name.toLowerCase();
        bValue = b.display_name.toLowerCase();
        break;
      case 'models':
        aValue = a.model_count;
        bValue = b.model_count;
        break;
      case 'trust_score':
        aValue = a.trust_score || 0;
        bValue = b.trust_score || 0;
        break;
      case 'established_date':
        aValue = new Date(a.established_date || 0).getTime();
        bValue = new Date(b.established_date || 0).getTime();
        break;
      case 'health_status':
        // Operational > Degraded > Outage
        const healthOrder = { 'operational': 3, 'degraded': 2, 'outage': 1 };
        aValue = healthOrder[a.health_status as keyof typeof healthOrder] || 0;
        bValue = healthOrder[b.health_status as keyof typeof healthOrder] || 0;
        break;
      default:
        return 0;
    }

    if (aValue === bValue) return 0;
    if (aValue < bValue) return ascending ? -1 : 1;
    return ascending ? 1 : -1;
  });

  return sorted;
};

const filterProviders = (providers: ProviderData[], filters: FilterOption): ProviderData[] => {
  return providers.filter(provider => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        provider.display_name.toLowerCase().includes(searchTerm) ||
        provider.description.toLowerCase().includes(searchTerm) ||
        provider.provider_name.toLowerCase().includes(searchTerm);

      if (!matchesSearch) return false;
    }

    // Health status filter
    if (filters.healthStatus !== 'all' && provider.health_status !== filters.healthStatus) {
      return false;
    }

    // Service level filter
    if (filters.serviceLevel !== 'all' && provider.service_level !== filters.serviceLevel) {
      return false;
    }

    // Pricing model filter
    if (filters.pricingModel !== 'all' && provider.pricing_model !== filters.pricingModel) {
      return false;
    }

    return true;
  });
};

// ===== SUBCOMPONENTS =====

const FilterBar: React.FC<{
  filters: FilterOption;
  onFiltersChange: (filters: FilterOption) => void;
  providers: ProviderData[];
}> = ({ filters, onFiltersChange, providers }) => {
  // Get unique values for filter options
  const uniqueHealthStatuses = [...new Set(providers.map(p => p.health_status))];
  const uniqueServiceLevels = [...new Set(providers.map(p => p.service_level))];
  const uniquePricingModels = [...new Set(providers.map(p => p.pricing_model))];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FilterIcon className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search Providers</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Health Status */}
          <div className="space-y-2">
            <Label>Health Status</Label>
            <select
              value={filters.healthStatus}
              onChange={(e) => onFiltersChange({ ...filters, healthStatus: e.target.value })}
              className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              {uniqueHealthStatuses.map(status => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Service Level */}
          <div className="space-y-2">
            <Label>Service Level</Label>
            <select
              value={filters.serviceLevel}
              onChange={(e) => onFiltersChange({ ...filters, serviceLevel: e.target.value })}
              className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Levels</option>
              {uniqueServiceLevels.map(level => (
                <option key={level} value={level} className="capitalize">
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Model */}
          <div className="space-y-2">
            <Label>Pricing Model</Label>
            <select
              value={filters.pricingModel}
              onChange={(e) => onFiltersChange({ ...filters, pricingModel: e.target.value })}
              className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Models</option>
              {uniquePricingModels.map(model => (
                <option key={model} value={model} className="capitalize">
                  {model.replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters indicator */}
        {(filters.search || filters.healthStatus !== 'all' || filters.serviceLevel !== 'all' || filters.pricingModel !== 'all') && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <div className="flex gap-1">
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.search}
                </Badge>
              )}
              {filters.healthStatus !== 'all' && (
                <Badge variant="secondary" className="text-xs capitalize">
                  Health: {filters.healthStatus}
                </Badge>
              )}
              {filters.serviceLevel !== 'all' && (
                <Badge variant="secondary" className="text-xs capitalize">
                  Level: {filters.serviceLevel}
                </Badge>
              )}
              {filters.pricingModel !== 'all' && (
                <Badge variant="secondary" className="text-xs capitalize">
                  Pricing: {filters.pricingModel.replace('-', ' ')}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SortControls: React.FC<{
  sortBy: SortOption;
  ascending: boolean;
  onSortChange: (sortBy: SortOption, ascending: boolean) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  resultCount: number;
}> = ({ sortBy, ascending, onSortChange, viewMode, onViewModeChange, resultCount }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="text-sm text-muted-foreground">
        {resultCount} {resultCount === 1 ? 'provider' : 'providers'}
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm">Sort by:</Label>
        <select
          value={`${sortBy}-${ascending ? 'asc' : 'desc'}`}
          onChange={(e) => {
            const [newSortBy, order] = e.target.value.split('-');
            onSortChange(newSortBy as SortOption, order === 'asc');
          }}
          className="h-8 px-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="models-desc">Most Models</option>
          <option value="models-asc">Fewest Models</option>
          <option value="trust_score-desc">Highest Trust Score</option>
          <option value="trust_score-asc">Lowest Trust Score</option>
          <option value="established_date-asc">Oldest</option>
          <option value="established_date-desc">Newest</option>
          <option value="health_status-desc">Best Health</option>
        </select>
      </div>
    </div>

    {/* View Mode Toggle */}
    <div className="flex items-center gap-1 border border-input rounded-md">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="h-8 w-8 p-0"
      >
        <GridIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="h-8 w-8 p-0"
      >
        <ListIcon className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// ===== MAIN COMPONENT =====

export const ProviderGrid: React.FC<ProviderGridProps> = ({
  providers,
  isLoading = false,
  error,
  showFilters = true,
  columns = 3,
  defaultViewMode = 'grid',
  compact = false,
  onProviderSelect,
  className = '',
}) => {
  const [filters, setFilters] = useState<FilterOption>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [ascending, setAscending] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);

  // Filter and sort providers
  const processedProviders = useMemo(() => {
    const filtered = filterProviders(providers, filters);
    return sortProviders(filtered, sortBy, ascending);
  }, [providers, filters, sortBy, ascending]);

  // Handle sort change
  const handleSortChange = (newSortBy: SortOption, newAscending: boolean) => {
    setSortBy(newSortBy);
    setAscending(newAscending);
  };

  // Grid class based on columns and view mode
  const getGridClass = () => {
    if (viewMode === 'list') {
      return 'grid grid-cols-1 gap-4';
    }

    const columnClasses = {
      1: 'grid grid-cols-1 gap-6',
      2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    };

    return columnClasses[columns];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showFilters && (
          <Card>
            <CardContent className="h-32 animate-pulse bg-muted/50" />
          </Card>
        )}
        <div className="h-10 bg-muted/50 rounded animate-pulse" />
        <div className={getGridClass()}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse">
              <CardContent className="h-full bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <div className="text-destructive text-sm font-medium">Error loading providers</div>
          <div className="text-muted-foreground text-sm mt-1">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (providers.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">No providers found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          providers={providers}
        />
      )}

      {/* Sort Controls */}
      <SortControls
        sortBy={sortBy}
        ascending={ascending}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={processedProviders.length}
      />

      {/* Provider Grid */}
      {processedProviders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              No providers match the current filters
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(defaultFilters)}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={getGridClass()}>
          {processedProviders.map((provider) => (
            <ProviderCard
              key={provider.provider_name}
              providerData={provider}
              compact={compact || viewMode === 'list'}
              onProviderClick={onProviderSelect}
              showStatistics={!compact && viewMode === 'grid'}
              showHealthDetails={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===== EXPORT =====

export default ProviderGrid;
