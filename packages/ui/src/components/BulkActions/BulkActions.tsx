import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button, type ButtonProps } from "../Button/Button";

export interface BulkAction {
  /** Action label text */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler for the action */
  onClick: () => void;
  /** Button variant */
  variant?: ButtonProps["variant"];
  /** Whether the action is disabled */
  disabled?: boolean;
}

export interface BulkActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of selected items */
  selectedCount: number;
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Array of bulk actions */
  actions: BulkAction[];
}

/**
 * BulkActions component for sticky bottom bar with bulk operations.
 *
 * Features:
 * - Sticky bottom bar that appears when items are selected
 * - Selected count display
 * - Multiple action buttons with icons
 * - Clear selection button
 * - Responsive layout
 *
 * Accessibility:
 * - Focus management when bar appears
 * - Keyboard interaction (Tab, Enter, Escape)
 * - ARIA labels for screen readers
 * - Clear indication of selected count
 *
 * @example
 * ```tsx
 * <BulkActions
 *   selectedCount={5}
 *   onClearSelection={() => setSelected([])}
 *   actions={[
 *     {
 *       label: 'Delete',
 *       icon: Trash2,
 *       onClick: () => handleDelete(selected),
 *       variant: 'destructive'
 *     },
 *     {
 *       label: 'Add to Collection',
 *       icon: FolderPlus,
 *       onClick: () => handleAddToCollection(selected),
 *     }
 *   ]}
 * />
 * ```
 */
const BulkActions = React.forwardRef<HTMLDivElement, BulkActionsProps>(
  ({ className, selectedCount, onClearSelection, actions, ...props }, ref) => {
    const clearButtonRef = React.useRef<HTMLButtonElement>(null);

    // Focus the clear button when the bar appears (when selectedCount goes from 0 to > 0)
    const prevSelectedCount = React.useRef(0);
    React.useEffect(() => {
      if (prevSelectedCount.current === 0 && selectedCount > 0) {
        // Give a small delay to allow the bar to render and become visible
        setTimeout(() => {
          clearButtonRef.current?.focus();
        }, 100);
      }
      prevSelectedCount.current = selectedCount;
    }, [selectedCount]);

    // Handle Escape key to clear selection
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && selectedCount > 0) {
          onClearSelection();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [selectedCount, onClearSelection]);

    if (selectedCount === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Bulk actions"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-border bg-background shadow-lg",
          "animate-in slide-in-from-bottom-2 duration-200",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Selected Count and Clear */}
            <div className="flex items-center gap-3">
              <button
                ref={clearButtonRef}
                onClick={onClearSelection}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full",
                  "bg-muted hover:bg-muted/80 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-sm">
                <span className="font-semibold text-text-strong">
                  {selectedCount}
                </span>{" "}
                <span className="text-text-muted">
                  {selectedCount === 1 ? "item" : "items"} selected
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {actions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <Button
                    key={index}
                    variant={action.variant || "outline"}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    size="md"
                  >
                    {Icon && <Icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BulkActions.displayName = "BulkActions";

export { BulkActions };
