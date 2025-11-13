import * as React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Checkbox } from '../Checkbox';
import { Label } from '../Label';
import { Separator } from '../Separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../Collapsible';
import { ModelFilter, ModelCapability } from './types';

export interface ModelPickerFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  filters: ModelFilter;
  onFiltersChange: (filters: Partial<ModelFilter>) => void;
  availableProviders: string[];
  availableCapabilities: ModelCapability[];
  className?: string;
  compact?: boolean;
  collapsible?: boolean;
}

export const ModelPickerFilters = React.forwardRef<
  HTMLDivElement,
  ModelPickerFiltersProps
>(({
  filters,
  onFiltersChange,
  availableProviders,
  availableCapabilities,
  className,
  compact = false,
  collapsible = true,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(!collapsible);

  // Helper to toggle array filter values
  const toggleArrayFilter = React.useCallback(
    (key: keyof Pick<ModelFilter, 'providers' | 'capabilities' | 'status' | 'tags'>, value: string) => {
      const currentValues = filters[key] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      onFiltersChange({ [key]: newValues });
    },
    [filters, onFiltersChange]
  );

  // Reset filters
  const handleReset = React.useCallback(() => {
    onFiltersChange({
      providers: [],
      capabilities: [],
      status: [],
      tags: [],
    });
  }, [onFiltersChange]);

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    return (
      filters.providers.length +
      filters.capabilities.length +
      filters.status.length +
      filters.tags.length
    );
  }, [filters]);

  const content = (
    <div className="space-y-4 p-3">
      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Active Filters</span>
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      )}

      {/* Provider Filter */}
      {availableProviders.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Providers</Label>
          <div className={cn(
            "space-y-2",
            compact && "grid grid-cols-2 gap-2 space-y-0"
          )}>
            {availableProviders.map((provider) => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox
                  id={`provider-${provider}`}
                  checked={filters.providers.includes(provider)}
                  onCheckedChange={() => toggleArrayFilter('providers', provider)}
                />
                <Label
                  htmlFor={`provider-${provider}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {provider}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <div className={cn(
          "space-y-2",
          compact && "flex flex-wrap gap-2 space-y-0"
        )}>
          {['active', 'beta', 'deprecated'].map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.status.includes(status)}
                onCheckedChange={() => toggleArrayFilter('status', status)}
              />
              <Label
                htmlFor={`status-${status}`}
                className="text-sm font-normal cursor-pointer capitalize"
              >
                {status}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Capabilities Filter */}
      {availableCapabilities.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Capabilities</Label>
          <div className={cn(
            "space-y-2",
            compact && "grid grid-cols-2 gap-2 space-y-0"
          )}>
            {availableCapabilities.slice(0, compact ? 6 : undefined).map((capability) => (
              <div key={capability.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`capability-${capability.id}`}
                  checked={filters.capabilities.includes(capability.id)}
                  onCheckedChange={() => toggleArrayFilter('capabilities', capability.id)}
                />
                <Label
                  htmlFor={`capability-${capability.id}`}
                  className="text-sm font-normal cursor-pointer"
                  title={capability.description}
                >
                  {capability.name}
                </Label>
              </div>
            ))}
            {compact && availableCapabilities.length > 6 && (
              <div className="col-span-2 text-xs text-muted-foreground text-center">
                +{availableCapabilities.length - 6} more capabilities
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      {!compact && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.capabilities.includes('tools') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('capabilities', 'tools')}
                className="h-7 text-xs"
              >
                Function Calling
              </Button>
              <Button
                variant={filters.capabilities.includes('vision') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('capabilities', 'vision')}
                className="h-7 text-xs"
              >
                Vision
              </Button>
              <Button
                variant={filters.capabilities.includes('json') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('capabilities', 'json')}
                className="h-7 text-xs"
              >
                JSON Mode
              </Button>
              <Button
                variant={filters.status.includes('beta') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('status', 'beta')}
                className="h-7 text-xs"
              >
                Beta Models
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <div
        ref={ref}
        className={cn("border rounded-md", className)}
        {...props}
      >
        {content}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border border-t-0 rounded-b-md">
        {content}
      </CollapsibleContent>
    </Collapsible>
  );
});

ModelPickerFilters.displayName = "ModelPickerFilters";
