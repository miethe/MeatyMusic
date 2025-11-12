import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/80 backdrop-blur-sm",
      // Smooth fade animation with reduced motion support
      "motion-safe:transition-all motion-safe:duration-[var(--mp-motion-duration-modal)]",
      "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out",
      "motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:fade-in-0",
      // Instant transition for reduced motion
      "motion-reduce:transition-none motion-reduce:duration-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog size variants for different content types
 * - sm: 448px - Small dialogs for simple confirmations
 * - md: 512px - Medium dialogs (default)
 * - lg: 672px - Large dialogs for more content
 * - xl: 896px - Extra-large dialogs for rich content (e.g., XL Prompt Cards)
 * - full: 95vw - Full-width responsive dialogs
 */
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',      // 448px
  md: 'max-w-lg',      // 512px (current default)
  lg: 'max-w-2xl',     // 672px
  xl: 'max-w-4xl',     // 896px (for Prompt Card XL)
  full: 'max-w-[95vw]', // Responsive
};

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Hide the built-in close button
   * Useful when using custom close buttons in modal header
   * @default false
   */
  hideClose?: boolean;
  /**
   * Dialog size variant
   * @default 'md'
   */
  size?: DialogSize;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose = false, size = 'md', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50",
        "grid w-full",
        sizeClasses[size],
        // Responsive width behavior
        "w-[95vw] sm:w-[90vw] lg:w-auto",
        // Minimum width constraint
        "min-w-[320px]",
        "translate-x-[-50%] translate-y-[-50%]",
        "gap-4 border border-border bg-surface p-6",
        "shadow-[var(--mp-elevation-4)] rounded-lg",
        // GPU-accelerated animations with reduced motion support
        "motion-safe:transition-all motion-safe:duration-[var(--mp-motion-duration-modal)]",
        "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out",
        "motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:fade-in-0",
        "motion-safe:data-[state=closed]:zoom-out-95 motion-safe:data-[state=open]:zoom-in-95",
        "motion-safe:data-[state=closed]:slide-out-to-top-[48%]",
        "motion-safe:data-[state=open]:slide-in-from-top-[48%]",
        // Instant transition for reduced motion
        "motion-reduce:transition-none motion-reduce:duration-0",
        "sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 rounded-sm",
            "opacity-70 ring-offset-bg",
            // Smooth hover transition with reduced motion support
            "motion-safe:transition-all motion-safe:duration-150",
            "motion-reduce:transition-none motion-reduce:duration-0",
            "hover:opacity-100 hover:bg-accent/50",
            "motion-safe:hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:pointer-events-none",
            "data-[state=open]:bg-accent data-[state=open]:text-text-muted",
            "h-6 w-6 flex items-center justify-center"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5",
      "pb-4 border-b border-border",
      "text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse",
      "sm:flex-row sm:justify-end sm:space-x-2",
      "pt-4 border-t border-border",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-text-strong",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
