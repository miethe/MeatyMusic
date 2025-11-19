import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-[var(--mm-color-surface)] px-3 py-2 text-sm text-[var(--mm-color-text-primary)] shadow-sm placeholder:text-[var(--mm-color-text-tertiary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 resize-y",
  {
    variants: {
      variant: {
        default: "border-[var(--mm-color-border-default)] hover:border-[var(--mm-color-primary)]/30 hover:brightness-[1.02] focus-visible:border-[var(--mm-color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--mm-color-ring)] focus-visible:bg-[var(--mm-color-panel)] focus-visible:shadow-[var(--mm-shadow-2)] transition-all duration-[var(--mm-duration-fast)] ease-out",
        success: "border-[var(--mm-color-success-500)] hover:border-[var(--mm-color-success-600)] hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--mm-color-success-500)]/30 focus-visible:border-[var(--mm-color-success-500)] focus-visible:shadow-[var(--mm-shadow-2)] transition-all duration-[var(--mm-duration-fast)] ease-out",
        error: "border-[var(--mm-color-error-500)] hover:border-[var(--mm-color-error-600)] hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--mm-color-error-500)]/30 focus-visible:border-[var(--mm-color-error-500)] focus-visible:shadow-[var(--mm-shadow-2)] transition-all duration-[var(--mm-duration-fast)] ease-out",
        warning: "border-[var(--mm-color-warning-500)] hover:border-[var(--mm-color-warning-600)] hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--mm-color-warning-500)]/30 focus-visible:border-[var(--mm-color-warning-500)] focus-visible:shadow-[var(--mm-shadow-2)] transition-all duration-[var(--mm-duration-fast)] ease-out",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /** Whether the textarea has an error state */
  error?: boolean;
  /** Whether the textarea has a success state */
  success?: boolean;
  /** Whether the textarea has a warning state */
  warning?: boolean;
  /** Helper text to display below the textarea */
  helperText?: string;
  /** Label text to display above the textarea */
  label?: string;
  /** Whether to show validation icon */
  showValidationIcon?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant,
    error,
    success,
    warning,
    helperText,
    label,
    showValidationIcon = true,
    id,
    disabled,
    ...props
  }, ref) => {
    // Generate unique ID if not provided
    const textareaId = id || React.useId();
    const helperTextId = `${textareaId}-helper`;

    // Determine variant based on state props
    let textareaVariant = variant;
    if (error) textareaVariant = "error";
    else if (success) textareaVariant = "success";
    else if (warning) textareaVariant = "warning";

    // Determine validation icon
    let validationIcon: React.ReactNode = null;
    if (showValidationIcon) {
      if (error) {
        validationIcon = (
          <XCircle
            className="h-4 w-4 text-[var(--mm-color-error-500)] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ animationTimingFunction: "ease-out" }}
          />
        );
      } else if (success) {
        validationIcon = (
          <CheckCircle
            className="h-4 w-4 text-[var(--mm-color-success-500)] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ animationTimingFunction: "ease-out" }}
          />
        );
      } else if (warning) {
        validationIcon = (
          <AlertTriangle
            className="h-4 w-4 text-[var(--mm-color-warning-500)] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ animationTimingFunction: "ease-out" }}
          />
        );
      }
    }

    // Determine helper text color
    let helperTextColor = "text-[var(--mm-color-text-tertiary)]";
    if (error) helperTextColor = "text-[var(--mm-color-error-500)]";
    else if (success) helperTextColor = "text-[var(--mm-color-success-500)]";
    else if (warning) helperTextColor = "text-[var(--mm-color-warning-500)]";

    // Determine label color
    let labelColor = "text-[var(--mm-color-text-primary)]";
    if (error) labelColor = "text-[var(--mm-color-error-500)]";
    else if (success) labelColor = "text-[var(--mm-color-success-500)]";
    else if (warning) labelColor = "text-[var(--mm-color-warning-500)]";

    const textareaElement = (
      <div className="relative group w-full">
        <textarea
          id={textareaId}
          disabled={disabled}
          className={cn(
            textareaVariants({ variant: textareaVariant }),
            validationIcon && "pr-10",
            className
          )}
          ref={ref}
          aria-describedby={helperText ? helperTextId : undefined}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {validationIcon && (
          <div className={cn(
            "absolute right-3 top-3 pointer-events-none",
            disabled && "opacity-60"
          )}>
            {validationIcon}
          </div>
        )}
      </div>
    );

    // If label or helper text provided, wrap in container
    if (label || helperText) {
      return (
        <div className="space-y-2 w-full">
          {label && (
            <label
              htmlFor={textareaId}
              className={cn(
                "text-sm font-medium leading-none transition-colors duration-[var(--mm-duration-fast)]",
                labelColor,
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              {label}
              {props.required && <span className="text-[var(--mm-color-error-500)] ml-1">*</span>}
            </label>
          )}
          {textareaElement}
          {helperText && (
            <p
              id={helperTextId}
              className={cn(
                "text-sm transition-all duration-200 animate-in slide-in-from-top-1 fade-in-0",
                helperTextColor
              )}
              style={{
                animationTimingFunction: "ease-out",
              }}
              role={error ? "alert" : undefined}
            >
              {helperText}
            </p>
          )}
        </div>
      );
    }

    return textareaElement;
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
