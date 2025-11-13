import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Form components for use with React Hook Form.
 * Provides proper semantic structure and styling for accessible forms.
 */

// Form root component
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return (
      <form
        className={cn("space-y-6", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Form.displayName = "Form";

// Form field wrapper component with enhanced accessibility
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
  label?: string;
  required?: boolean;
  description?: string;
  name?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, error, label, required, description, name, children, ...props }, ref) => {
    const fieldId = React.useId();
    const errorId = error ? `${fieldId}-error` : undefined;
    const descriptionId = description ? `${fieldId}-description` : undefined;

    return (
      <div
        className={cn("space-y-2", className)}
        ref={ref}
        {...props}
      >
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium text-text-strong",
              required && "after:ml-1 after:text-destructive after:content-['*']"
            )}
          >
            {label}
          </label>
        )}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-text-muted"
          >
            {description}
          </p>
        )}
        <div className="relative">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && (child.type as any)?.displayName === 'Input') {
              return React.cloneElement(child as any, {
                id: fieldId,
                'aria-describedby': cn(descriptionId, errorId).trim() || undefined,
                'aria-invalid': error ? 'true' : undefined,
                error: !!error,
                ...child.props,
              });
            }
            return child;
          })}
        </div>
        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

// Form item for consistent spacing
export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn("space-y-2", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
FormItem.displayName = "FormItem";

// Form message for validation errors
export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) {
      return null;
    }

    return (
      <p
        className={cn("text-sm font-medium text-destructive", className)}
        role="alert"
        ref={ref}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

// Form description for helpful text
export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        className={cn("text-sm text-muted-foreground", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
FormDescription.displayName = "FormDescription";

export {
  Form,
  FormField,
  FormItem,
  FormMessage,
  FormDescription
};
