/**
 * ConfirmDialog component types
 */

/**
 * Visual variant for the confirmation dialog
 * - default: Standard confirmation (blue/primary)
 * - destructive: Dangerous actions (red/error)
 * - warning: Caution needed (yellow/warning)
 */
export type ConfirmDialogVariant = 'default' | 'destructive' | 'warning';

/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /**
   * Controls the open state of the dialog
   */
  open: boolean;

  /**
   * Callback when the open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description/message
   */
  description: string;

  /**
   * Label for the confirm button
   * @default "Confirm"
   */
  confirmLabel?: string;

  /**
   * Label for the cancel button
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Visual variant for the dialog
   * @default "default"
   */
  variant?: ConfirmDialogVariant;

  /**
   * Callback when the user confirms
   */
  onConfirm: () => void;

  /**
   * Callback when the user cancels (optional)
   * If not provided, dialog will just close
   */
  onCancel?: () => void;
}
