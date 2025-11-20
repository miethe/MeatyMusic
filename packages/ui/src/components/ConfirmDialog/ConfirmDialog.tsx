import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../Dialog/Dialog";
import { Button } from "../Button";
import type { ConfirmDialogProps } from "./types";

/**
 * ConfirmDialog - A confirmation dialog component that replaces browser native confirm()
 *
 * Features:
 * - Custom branded dialogs with three variants (default, destructive, warning)
 * - Customizable title, description, and action labels
 * - Focus trap and keyboard navigation (Tab, Shift+Tab, Enter, Esc)
 * - Full ARIA support for accessibility
 * - Automatic focus management
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Discard unsaved changes?"
 *   description="You have unsaved changes. Are you sure you want to discard them?"
 *   variant="warning"
 *   confirmLabel="Discard"
 *   cancelLabel="Keep Editing"
 *   onConfirm={() => {
 *     // Handle confirmation
 *     closeModal();
 *   }}
 *   onCancel={() => {
 *     setShowConfirm(false);
 *   }}
 * />
 * ```
 */
export const ConfirmDialog = React.forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      variant = "default",
      onConfirm,
      onCancel,
    },
    ref
  ) => {
    // Handle confirm action
    const handleConfirm = React.useCallback(() => {
      onConfirm();
      onOpenChange(false);
    }, [onConfirm, onOpenChange]);

    // Handle cancel action
    const handleCancel = React.useCallback(() => {
      if (onCancel) {
        onCancel();
      }
      onOpenChange(false);
    }, [onCancel, onOpenChange]);

    // Handle Enter key to confirm
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleConfirm();
        }
      },
      [handleConfirm]
    );

    // Map variant to button variant
    const getConfirmButtonVariant = () => {
      switch (variant) {
        case "destructive":
          return "destructive";
        case "warning":
          return "warning";
        default:
          return "primary";
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={ref}
          size="sm"
          onKeyDown={handleKeyDown}
          // Prevent closing on overlay click for confirmation dialogs
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              type="button"
              autoFocus={variant === "default"} // Focus cancel for default variant
            >
              {cancelLabel}
            </Button>
            <Button
              variant={getConfirmButtonVariant()}
              onClick={handleConfirm}
              type="button"
              autoFocus={variant !== "default"} // Focus confirm for destructive/warning variants
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";
