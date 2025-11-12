import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import styles from "./Checkbox.module.css";

const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded-sm border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-[var(--mp-motion-duration-ui)]",
  {
    variants: {
      variant: {
        default: "border-[var(--mp-color-border)] data-[state=checked]:bg-[var(--mp-color-primary)] data-[state=checked]:border-[var(--mp-color-primary)] data-[state=checked]:text-[var(--mp-color-primaryForeground)] data-[state=indeterminate]:bg-[var(--mp-color-primary)] data-[state=indeterminate]:border-[var(--mp-color-primary)] data-[state=indeterminate]:text-[var(--mp-color-primaryForeground)] focus-visible:ring-[var(--mp-color-ring)] hover:border-[var(--mp-color-primary)] hover:bg-[var(--mp-color-panel)] hover:brightness-105 hover:shadow-[var(--mp-elevation-1)]",
        success: "border-[var(--mp-color-success)] data-[state=checked]:bg-[var(--mp-color-success)] data-[state=checked]:border-[var(--mp-color-success)] data-[state=checked]:text-white data-[state=indeterminate]:bg-[var(--mp-color-success)] data-[state=indeterminate]:border-[var(--mp-color-success)] data-[state=indeterminate]:text-white focus-visible:ring-[var(--mp-color-success)]/30 hover:border-[var(--mp-color-success)] hover:bg-[var(--mp-color-success)]/10 hover:brightness-105 hover:shadow-[var(--mp-elevation-1)]",
        error: "border-[var(--mp-color-danger)] data-[state=checked]:bg-[var(--mp-color-danger)] data-[state=checked]:border-[var(--mp-color-danger)] data-[state=checked]:text-white data-[state=indeterminate]:bg-[var(--mp-color-danger)] data-[state=indeterminate]:border-[var(--mp-color-danger)] data-[state=indeterminate]:text-white focus-visible:ring-[var(--mp-color-danger)]/30 hover:border-[var(--mp-color-danger)] hover:bg-[var(--mp-color-danger)]/10 hover:brightness-105 hover:shadow-[var(--mp-elevation-1)]",
        warning: "border-[var(--mp-color-warning)] data-[state=checked]:bg-[var(--mp-color-warning)] data-[state=checked]:border-[var(--mp-color-warning)] data-[state=checked]:text-white data-[state=indeterminate]:bg-[var(--mp-color-warning)] data-[state=indeterminate]:border-[var(--mp-color-warning)] data-[state=indeterminate]:text-white focus-visible:ring-[var(--mp-color-warning)]/30 hover:border-[var(--mp-color-warning)] hover:bg-[var(--mp-color-warning)]/10 hover:brightness-105 hover:shadow-[var(--mp-elevation-1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /** Whether the checkbox has an error state */
  error?: boolean;
  /** Whether the checkbox has a success state */
  success?: boolean;
  /** Whether the checkbox has a warning state */
  warning?: boolean;
  /** Label text to display next to the checkbox */
  label?: string;
  /** Description text to display below the label */
  description?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, error, success, warning, label, description, id, ...props }, ref) => {
  const checkboxId = id || React.useId();

  // Determine variant based on state props
  let checkboxVariant = variant;
  if (error) checkboxVariant = "error";
  else if (success) checkboxVariant = "success";
  else if (warning) checkboxVariant = "warning";

  const checkbox = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={cn(checkboxVariants({ variant: checkboxVariant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center text-current"
        )}
      >
        {props.checked === "indeterminate" ? (
          <Minus className={cn("h-3 w-3", styles.checkmarkIcon)} />
        ) : (
          <Check className={cn("h-3 w-3", styles.checkmarkIcon)} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label || description) {
    return (
      <div className="flex items-start space-x-3 group">
        <div className="pt-0.5">{checkbox}</div>
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-[var(--mp-color-text-base)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none hover:text-[var(--mp-color-text-strong)] hover:opacity-90 transition-all duration-[var(--mp-motion-duration-ui)]"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-[var(--mp-color-text-muted)] leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return checkbox;
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
