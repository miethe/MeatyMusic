import * as React from "react";
import { cn } from "../../lib/utils";
import { Checkbox } from "../Checkbox";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { X } from "lucide-react";
import type { ModelData } from "./ModelFilter";

export interface ModelFilterItemProps {
  /** Model data */
  model: ModelData;
  /** Whether this model is selected */
  selected: boolean;
  /** Callback when the model is toggled */
  onToggle: (modelId: string) => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Show remove button instead of checkbox */
  showRemoveButton?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * ModelFilterItem component that displays an individual model
 * with selection checkbox and prompt count badge.
 */
const ModelFilterItem = React.forwardRef<HTMLDivElement, ModelFilterItemProps>(
  (
    {
      model,
      selected,
      onToggle,
      disabled = false,
      showRemoveButton = false,
      className,
      ...props
    },
    ref
  ) => {
    const displayName = model.display_name;

    // Handle model toggle
    const handleToggle = React.useCallback(() => {
      if (!disabled) {
        onToggle(model.id);
      }
    }, [model.id, onToggle, disabled]);

    // Handle keyboard interaction
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "group flex items-center justify-between p-2 rounded-md transition-colors",
          "hover:bg-accent/50",
          selected && "bg-accent/30 border border-accent",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer",
          className
        )}
        role="listitem"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={handleToggle}
        aria-labelledby={`model-${model.id}-label`}
        aria-describedby={`model-${model.id}-count`}
        {...props}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Checkbox or Remove Button */}
          {showRemoveButton ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              disabled={disabled}
              aria-label={`Remove ${displayName} from selection`}
            >
              <X className="h-3 w-3" />
            </Button>
          ) : (
            <Checkbox
              checked={selected}
              onCheckedChange={handleToggle}
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${displayName}`}
              className="shrink-0"
            />
          )}

          {/* Model name */}
          <div className="min-w-0 flex-1">
            <div
              id={`model-${model.id}-label`}
              className={cn(
                "text-sm font-medium truncate",
                selected && "text-foreground",
                !selected && "text-muted-foreground"
              )}
              title={displayName}
            >
              {displayName}
            </div>
            {model.display_name !== model.model_key && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {model.model_key}
              </div>
            )}
          </div>
        </div>

        {/* Prompt count badge */}
        <div className="flex items-center space-x-2 shrink-0">
          <Badge
            variant={selected ? "default" : "outline"}
            className={cn(
              "text-xs font-medium",
              model.prompt_count === 0 && "opacity-60"
            )}
            id={`model-${model.id}-count`}
            aria-label={`${model.prompt_count} prompts available`}
          >
            {model.prompt_count}
          </Badge>
        </div>
      </div>
    );
  }
);

ModelFilterItem.displayName = "ModelFilterItem";

export { ModelFilterItem };
