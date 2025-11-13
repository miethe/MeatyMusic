import * as React from "react";
import { cn } from "../../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../Collapsible";
import { Checkbox } from "../Checkbox";
import { Badge } from "../Badge";
import { ModelFilterItem, type ModelFilterItemProps } from "./ModelFilterItem";
import type { ModelData } from "./ModelFilter";

export interface ModelFilterGroupProps {
  /** Provider name (e.g., "OpenAI", "Anthropic") */
  provider: string;
  /** Array of models for this provider */
  models: ModelData[];
  /** Currently selected model IDs */
  selectedModels: string[];
  /** Callback when a model is toggled */
  onModelToggle: (modelId: string) => void;
  /** Callback when the entire provider group is toggled */
  onProviderToggle: (provider: string, models: ModelData[]) => void;
  /** Whether the group is disabled */
  disabled?: boolean;
  /** Whether the group starts collapsed (default: false) */
  defaultCollapsed?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * ModelFilterGroup component that displays a collapsible group of models
 * for a specific provider with group selection capabilities.
 */
const ModelFilterGroup = React.forwardRef<HTMLDivElement, ModelFilterGroupProps>(
  (
    {
      provider,
      models,
      selectedModels,
      onModelToggle,
      onProviderToggle,
      disabled = false,
      defaultCollapsed = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(!defaultCollapsed);

    // Calculate selection state
    const selectedCount = models.filter(model =>
      selectedModels.includes(model.id)
    ).length;
    const totalCount = models.length;
    const totalPromptCount = models.reduce((acc, model) => acc + model.prompt_count, 0);

    const isAllSelected = selectedCount === totalCount && totalCount > 0;
    const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;
    const isIndeterminate = isPartiallySelected;

    // Handle provider checkbox toggle
    const handleProviderToggle = React.useCallback(() => {
      onProviderToggle(provider, models);
    }, [provider, models, onProviderToggle]);

    // Handle collapsible state change
    const handleOpenChange = React.useCallback((open: boolean) => {
      setIsOpen(open);
    }, []);

    return (
      <div
        ref={ref}
        className={cn("border rounded-lg", className)}
        role="group"
        aria-labelledby={`provider-${provider}`}
        {...props}
      >
        <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Provider group checkbox */}
                <Checkbox
                  checked={isAllSelected}
                  // TODO: Implement ref: Creating refs inside render functions is also inefficient
                  // use useRef hook instead if needed
                  ref={React.useRef<HTMLButtonElement>(null)}
                  onCheckedChange={handleProviderToggle}
                  disabled={disabled || totalCount === 0}
                  aria-label={`Select all ${provider} models`}
                  className={cn(
                    isIndeterminate && "data-[state=checked]:bg-primary/50"
                  )}
                  {...(isIndeterminate && {
                    "data-state": "indeterminate",
                    "aria-checked": "mixed" as const
                  })}
                />

                {/* Provider name and selection count */}
                <div className="flex items-center space-x-2">
                  <CollapsibleTrigger
                    className="p-0 hover:no-underline font-medium text-sm"
                    showIcon={false}
                    id={`provider-${provider}`}
                  >
                    {provider}
                  </CollapsibleTrigger>
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount} selected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Total counts and expand/collapse */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {totalPromptCount} prompts
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {totalCount} models
                </Badge>
                <CollapsibleTrigger
                  className="p-1 hover:bg-accent rounded"
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${provider} models`}
                />
              </div>
            </div>
          </div>

          <CollapsibleContent>
            <div className="p-2 space-y-1" role="list">
              {models.map((model) => (
                <ModelFilterItem
                  key={model.id}
                  model={model}
                  selected={selectedModels.includes(model.id)}
                  onToggle={onModelToggle}
                  disabled={disabled}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }
);

ModelFilterGroup.displayName = "ModelFilterGroup";

export { ModelFilterGroup };
