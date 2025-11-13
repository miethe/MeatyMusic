import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { EnhancedModel } from './types';
import { formatModelDisplay } from './utils';

export interface ModelPickerTriggerProps extends React.ComponentPropsWithoutRef<'button'> {
  selectedModels: EnhancedModel[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  isOpen: boolean;
  multiple?: boolean;
  onRemoveModel?: (modelId: string) => void;
  className?: string;
  children?: React.ReactNode;
  /** ID for the trigger element */
  id?: string;
  /** Controls which element the trigger expands */
  'aria-controls'?: string;
}

export const ModelPickerTrigger = React.forwardRef<
  HTMLButtonElement,
  ModelPickerTriggerProps
>(({
  selectedModels,
  placeholder = 'Select a model...',
  disabled = false,
  error,
  isOpen,
  multiple = false,
  onRemoveModel,
  className,
  children,
  ...props
}, ref) => {
  const hasSelection = selectedModels.length > 0;

  // Custom children override
  if (children) {
    return (
      <Button
        ref={ref}
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={cn(
          "justify-between focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>
    );
  }

  // Single model selection display
  if (!multiple && hasSelection) {
    const model = selectedModels[0];
    return (
      <Button
        ref={ref}
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={cn(
          "w-full justify-between font-normal focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-label={`Selected model: ${formatModelDisplay(model)}. ${model.status === 'deprecated' ? 'Warning: This model is deprecated. ' : ''}Click to change selection.`}
        {...props}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {model.logoUrl && (
            <Avatar className="h-4 w-4 shrink-0">
              <img src={model.logoUrl} alt="" role="presentation" />
            </Avatar>
          )}
          <span className="truncate">
            {formatModelDisplay(model)}
          </span>
          {model.status === 'beta' && (
            <Badge variant="secondary" className="text-xs" aria-label="Beta status">
              Beta
            </Badge>
          )}
          {model.status === 'deprecated' && (
            <Badge variant="destructive" className="text-xs" aria-label="Deprecated status">
              Deprecated
            </Badge>
          )}
        </div>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>
    );
  }

  // Multiple model selection display
  if (multiple && hasSelection) {
    const visibleModels = selectedModels.slice(0, 3);
    const hiddenCount = selectedModels.length - 3;
    const modelNames = selectedModels.map(m => m.display_name).join(', ');

    return (
      <Button
        ref={ref}
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={cn(
          "w-full justify-between font-normal min-h-[40px] h-auto py-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-label={`Selected models: ${modelNames}. ${selectedModels.length} model${selectedModels.length !== 1 ? 's' : ''} selected. Click to change selection.`}
        {...props}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1 flex-wrap" role="group" aria-label="Selected models">
          {visibleModels.map((model, index) => (
            <Badge
              key={model.id}
              variant="secondary"
              className="flex items-center gap-1 max-w-[150px]"
              role="listitem"
            >
              {model.logoUrl && (
                <Avatar className="h-3 w-3 shrink-0">
                  <img src={model.logoUrl} alt="" role="presentation" />
                </Avatar>
              )}
              <span className="truncate text-xs">
                {formatModelDisplay(model)}
              </span>
              {onRemoveModel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveModel(model.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveModel(model.id);
                    }
                  }}
                  className="ml-1 hover:bg-muted rounded-sm p-0.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  aria-label={`Remove ${model.display_name} from selection`}
                  tabIndex={0}
                >
                  <X className="h-2 w-2" aria-hidden="true" />
                </button>
              )}
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="outline" className="text-xs" aria-label={`${hiddenCount} additional models selected`}>
              +{hiddenCount} more
            </Badge>
          )}
        </div>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>
    );
  }

  // Empty state
  return (
    <Button
      ref={ref}
      variant="outline"
      role="combobox"
      aria-expanded={isOpen}
      disabled={disabled}
      className={cn(
        "w-full justify-between font-normal text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none",
        error && "border-destructive focus:ring-destructive",
        className
      )}
      aria-label={`${placeholder} No models selected. Click to select models.`}
      {...props}
    >
      <span>{placeholder}</span>
      <ChevronDown
        className={cn(
          "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )}
        aria-hidden="true"
      />
    </Button>
  );
});

ModelPickerTrigger.displayName = "ModelPickerTrigger";
