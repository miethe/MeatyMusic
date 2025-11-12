import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const inputVariants = cva(
  "flex h-9 w-full rounded-sm border bg-[var(--mp-color-surface)] px-3 py-1 text-sm text-[var(--mp-color-text-base)] shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--mp-color-text-muted)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "border-[var(--mp-color-border)] hover:border-[var(--mp-color-primary)]/30 hover:brightness-[1.02] focus-visible:border-[var(--mp-color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:bg-[var(--mp-color-panel)] focus-visible:shadow-md transition-all duration-[var(--mp-motion-duration-ui)] ease-out",
        success: "border-[var(--mp-color-success)] hover:border-[var(--mp-color-success)]/80 hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--mp-color-success)]/30 focus-visible:border-[var(--mp-color-success)] focus-visible:shadow-md transition-all duration-[var(--mp-motion-duration-ui)] ease-out",
        error: "border-[var(--mp-color-danger)] hover:border-[var(--mp-color-danger)]/80 hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--mp-color-danger)]/30 focus-visible:border-[var(--mp-color-danger)] focus-visible:shadow-md transition-all duration-[var(--mp-motion-duration-ui)] ease-out",
        warning: "border-[var(--mp-color-warning)] hover:border-[var(--mp-color-warning)]/80 hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--mp-color-warning)]/30 focus-visible:border-[var(--mp-color-warning)] focus-visible:shadow-md transition-all duration-[var(--mp-motion-duration-ui)] ease-out",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /** Whether the input has an error state */
  error?: boolean;
  /** Whether the input has a success state */
  success?: boolean;
  /** Whether the input has a warning state */
  warning?: boolean;
  /** Icon to display on the left side */
  icon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Helper text to display below the input */
  helperText?: string;
  /** Label text to display above the input */
  label?: string;
  /** Whether to show validation icon */
  showValidationIcon?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    variant,
    error,
    success,
    warning,
    icon,
    rightIcon,
    helperText,
    label,
    showValidationIcon = true,
    id,
    disabled,
    ...props
  }, ref) => {
    // Generate unique ID if not provided
    const inputId = id || React.useId();
    const helperTextId = `${inputId}-helper`;

    // Determine variant based on state props
    let inputVariant = variant;
    if (error) inputVariant = "error";
    else if (success) inputVariant = "success";
    else if (warning) inputVariant = "warning";

    // Determine validation icon with entrance animation
    let validationIcon: React.ReactNode = null;
    if (showValidationIcon) {
      if (error) {
        validationIcon = (
          <XCircle
            className="h-4 w-4 text-[var(--mp-color-danger)] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ animationTimingFunction: "ease-out" }}
          />
        );
      } else if (success) {
        validationIcon = (
          <CheckCircle
            className="h-4 w-4 text-[var(--mp-color-success)] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ animationTimingFunction: "ease-out" }}
          />
        );
      } else if (warning) {
        validationIcon = (
          <AlertTriangle
            className="h-4 w-4 text-[var(--mp-color-warning)] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ animationTimingFunction: "ease-out" }}
          />
        );
      }
    }

    // Determine helper text color
    let helperTextColor = "text-[var(--mp-color-text-muted)]";
    if (error) helperTextColor = "text-[var(--mp-color-danger)]";
    else if (success) helperTextColor = "text-[var(--mp-color-success)]";
    else if (warning) helperTextColor = "text-[var(--mp-color-warning)]";

    // Determine label color (shifts to primary on focus)
    let labelColor = "text-[var(--mp-color-text-base)]";
    if (error) labelColor = "text-[var(--mp-color-danger)]";
    else if (success) labelColor = "text-[var(--mp-color-success)]";
    else if (warning) labelColor = "text-[var(--mp-color-warning)]";

    const inputElement = (
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mp-color-text-muted)] pointer-events-none transition-all duration-[var(--mp-motion-duration-ui)]",
            "group-focus-within:text-[var(--mp-color-primary)] group-focus-within:scale-105",
            disabled && "opacity-60"
          )}
          style={{
            transitionTimingFunction: "ease-out",
          }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          id={inputId}
          disabled={disabled}
          className={cn(
            inputVariants({ variant: inputVariant }),
            icon && "pl-9",
            (rightIcon || validationIcon) && "pr-9",
            className
          )}
          ref={ref}
          aria-describedby={helperText ? helperTextId : undefined}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {(rightIcon || validationIcon) && (
          <div className={cn(
            "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none",
            disabled && "opacity-60"
          )}>
            {validationIcon || rightIcon}
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
              htmlFor={inputId}
              className={cn(
                "text-sm font-medium leading-none transition-colors duration-[var(--mp-motion-duration-ui)]",
                labelColor,
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              {label}
              {props.required && <span className="text-[var(--mp-color-danger)] ml-1">*</span>}
            </label>
          )}
          {inputElement}
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

    return inputElement;
  }
);
Input.displayName = "Input";

export { Input };
