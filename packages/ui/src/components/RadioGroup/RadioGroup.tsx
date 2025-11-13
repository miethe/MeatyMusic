'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

/**
 * RadioGroup - A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.
 *
 * Based on Radix UI RadioGroup primitive with proper styling and accessibility.
 * Supports keyboard navigation and screen readers.
 */

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const radioGroupItemVariants = cva(
  "aspect-square h-4 w-4 rounded-full border text-[var(--mp-color-primary)] focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-[var(--mp-motion-duration-ui)]",
  {
    variants: {
      variant: {
        default: "border-[var(--mp-color-border)] data-[state=checked]:border-[var(--mp-color-primary)] focus-visible:ring-[var(--mp-color-ring)] hover:border-[var(--mp-color-primary)] hover:bg-[var(--mp-color-panel)]",
        success: "border-[var(--mp-color-success)] data-[state=checked]:border-[var(--mp-color-success)] text-[var(--mp-color-success)] focus-visible:ring-[var(--mp-color-success)]/30",
        error: "border-[var(--mp-color-danger)] data-[state=checked]:border-[var(--mp-color-danger)] text-[var(--mp-color-danger)] focus-visible:ring-[var(--mp-color-danger)]/30",
        warning: "border-[var(--mp-color-warning)] data-[state=checked]:border-[var(--mp-color-warning)] text-[var(--mp-color-warning)] focus-visible:ring-[var(--mp-color-warning)]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {
  error?: boolean;
  success?: boolean;
  warning?: boolean;
  label?: string;
  description?: string;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, error, success, warning, label, description, id, ...props }, ref) => {
  const radioId = id || React.useId();

  // Determine variant based on state props
  let radioVariant = variant;
  if (error) radioVariant = "error";
  else if (success) radioVariant = "success";
  else if (warning) radioVariant = "warning";

  const radio = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={radioId}
      className={cn(radioGroupItemVariants({ variant: radioVariant }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (label || description) {
    return (
      <div className="flex items-start space-x-3 group">
        <div className="pt-0.5">{radio}</div>
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={radioId}
              className="text-sm font-medium text-[var(--mp-color-text-base)] leading-none cursor-pointer select-none hover:text-[var(--mp-color-text-strong)] transition-colors duration-[var(--mp-motion-duration-ui)]"
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

  return radio;
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
