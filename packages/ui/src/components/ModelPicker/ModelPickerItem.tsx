import * as React from 'react';
import { Check, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';
import { EnhancedModel } from './types';
import { formatModelDisplay, getModelStatusVariant } from './utils';

export interface ModelPickerItemProps {
  model: EnhancedModel;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const ModelPickerItem = React.forwardRef<
  HTMLDivElement,
  ModelPickerItemProps
>(({
  model,
  isSelected,
  onSelect,
  disabled = false,
  className,
  showDetails = true,
  ...props
}, ref) => {
  const handleClick = React.useCallback(() => {
    if (!disabled) {
      onSelect(model.id);
    }
  }, [model.id, onSelect, disabled]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onSelect(model.id);
    }
  }, [model.id, onSelect, disabled]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
        isSelected && "bg-accent text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Model Logo */}
        {model.logoUrl && (
          <Avatar className="h-6 w-6 shrink-0">
            <img src={model.logoUrl} alt={model.provider} />
          </Avatar>
        )}

        <div className="min-w-0 flex-1">
          {/* Model Name and Status */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">
              {formatModelDisplay(model)}
            </h4>

            {/* Status Badge */}
            <Badge
              variant={getModelStatusVariant(model.status)}
              className="text-xs shrink-0"
            >
              {model.status}
            </Badge>

            {/* Deprecation Warning */}
            {model.deprecation && (
              <Tooltip content={
                <div className="max-w-xs">
                  <p className="font-medium">Deprecated</p>
                  <p className="text-sm">{model.deprecation.reason}</p>
                  {model.deprecation.replacement_model && (
                    <p className="text-sm mt-1">
                      Use: {model.deprecation.replacement_model}
                    </p>
                  )}
                </div>
              }>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </Tooltip>
            )}
          </div>

          {/* Provider and Key */}
          <div className="text-sm text-muted-foreground">
            {model.provider}
            {model.model_key !== model.display_name && (
              <span className="ml-1">({model.model_key})</span>
            )}
          </div>

          {/* Model Details */}
          {showDetails && (
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {/* Context Window */}
              {model.context_window && (
                <span>{model.context_window.toLocaleString()} tokens</span>
              )}

              {/* Capabilities */}
              <div className="flex items-center gap-1">
                {model.supports_tools && (
                  <Badge variant="outline" className="h-5 text-xs">
                    Tools
                  </Badge>
                )}
                {model.supports_json_mode && (
                  <Badge variant="outline" className="h-5 text-xs">
                    JSON
                  </Badge>
                )}
                {model.modalities?.includes('vision') && (
                  <Badge variant="outline" className="h-5 text-xs">
                    Vision
                  </Badge>
                )}
              </div>

              {/* Performance Indicator */}
              {model.performance && (
                <Tooltip content={
                  <div className="text-xs">
                    <div>Latency: {model.performance.latency}</div>
                    <div>Cost: {model.performance.cost}</div>
                    <div>Quality: {model.performance.quality}</div>
                  </div>
                }>
                  <Info className="h-3 w-3" />
                </Tooltip>
              )}
            </div>
          )}

          {/* User Tags */}
          {model.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {model.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="h-5 text-xs"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    borderColor: tag.color || undefined
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {model.tags.length > 3 && (
                <Badge variant="outline" className="h-5 text-xs">
                  +{model.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {model.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {model.description}
            </p>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <Check className="h-4 w-4 shrink-0 text-primary" />
      )}
    </div>
  );
});

ModelPickerItem.displayName = "ModelPickerItem";
