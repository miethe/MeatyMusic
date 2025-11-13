import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../lib/utils';
import { Separator } from '../Separator';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { ModelPickerItem } from './ModelPickerItem';
import { ModelGroup, EnhancedModel } from './types';

export interface ModelPickerListProps {
  modelGroups: ModelGroup[];
  selectedModels: string[];
  onModelSelect: (modelId: string) => void;
  virtualized?: boolean;
  maxHeight?: string;
  className?: string;
  showGroupHeaders?: boolean;
  showDetails?: boolean;
  emptyMessage?: string;
}

interface VirtualItem {
  type: 'group' | 'model';
  id: string;
  data: ModelGroup | EnhancedModel;
}

export const ModelPickerList = React.forwardRef<
  HTMLDivElement,
  ModelPickerListProps
>(({
  modelGroups,
  selectedModels = [],
  onModelSelect,
  virtualized = false,
  maxHeight = "300px",
  className,
  showGroupHeaders = true,
  showDetails = true,
  emptyMessage = "No models found",
  ...props
}, ref) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Flatten data for virtualization
  const virtualItems = React.useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];

    modelGroups.forEach((group) => {
      // Add group header
      if (showGroupHeaders) {
        items.push({
          type: 'group',
          id: `group-${group.provider}`,
          data: group,
        });
      }

      // Add models
      group.models.forEach((model) => {
        items.push({
          type: 'model',
          id: `model-${model.id}`,
          data: model,
        });
      });
    });

    return items;
  }, [modelGroups, showGroupHeaders]);

  // Virtualization setup
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => {
      const item = virtualItems[index];
      return item.type === 'group' ? 40 : showDetails ? 100 : 60;
    },
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  // Empty state
  if (modelGroups.length === 0) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center py-8 text-center text-muted-foreground",
          className
        )}
        {...props}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Non-virtualized list (for smaller lists)
  if (!virtualized || virtualItems.length < 50) {
    return (
      <div
        ref={ref}
        className={cn("overflow-y-auto", className)}
        style={{ maxHeight }}
        role="listbox"
        aria-label="Available models"
        {...props}
      >
        {modelGroups.map((group, groupIndex) => (
          <div key={group.provider}>
            {/* Group Header */}
            {showGroupHeaders && (
              <>
                {groupIndex > 0 && <Separator />}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                  {group.logoUrl && (
                    <Avatar className="h-4 w-4">
                      <img src={group.logoUrl} alt={group.provider} />
                    </Avatar>
                  )}
                  <h3 className="font-medium text-sm">{group.provider}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {group.models.length}
                  </Badge>
                </div>
              </>
            )}

            {/* Models */}
            {group.models.map((model) => (
              <ModelPickerItem
                key={model.id}
                model={model}
                isSelected={selectedModels.includes(model.id)}
                onSelect={onModelSelect}
                showDetails={showDetails}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Virtualized list (for large lists)
  return (
    <div
      ref={ref}
      className={cn("overflow-y-auto", className)}
      style={{ maxHeight }}
      role="listbox"
      aria-label="Available models"
      {...props}
    >
      <div
        ref={parentRef}
        className="h-full w-full"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem: any) => {
            const item = virtualItems[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.type === 'group' ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                    {(item.data as ModelGroup).logoUrl && (
                      <Avatar className="h-4 w-4">
                        <img
                          src={(item.data as ModelGroup).logoUrl}
                          alt={(item.data as ModelGroup).provider}
                        />
                      </Avatar>
                    )}
                    <h3 className="font-medium text-sm">
                      {(item.data as ModelGroup).provider}
                    </h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {(item.data as ModelGroup).models.length}
                    </Badge>
                  </div>
                ) : (
                  <ModelPickerItem
                    model={item.data as EnhancedModel}
                    isSelected={selectedModels.includes((item.data as EnhancedModel).id)}
                    onSelect={onModelSelect}
                    showDetails={showDetails}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ModelPickerList.displayName = "ModelPickerList";
