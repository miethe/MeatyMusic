import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Button, type ButtonProps } from "../Button/Button";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "py-12 px-4",
        compact: "py-8 px-4",
        centered: "min-h-[400px] py-12 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const emptyStateIconVariants = cva(
  "text-text-muted mb-4",
  {
    variants: {
      size: {
        default: "h-16 w-16",
        compact: "h-12 w-12",
        large: "h-20 w-20",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Icon component to display (from lucide-react or similar) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Icon size variant */
  iconSize?: "default" | "compact" | "large";
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button configuration */
  action?: {
    /** Button label text */
    label: string;
    /** Button click handler */
    onClick: () => void;
    /** Button variant (from Button component) */
    variant?: ButtonProps["variant"];
  };
}

/**
 * EmptyState component for displaying empty states across the application.
 *
 * Used when:
 * - No items in a list/collection
 * - No search results found
 * - No data available
 * - Empty models list after filtering
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="No prompts found"
 *   description="Create your first prompt to get started"
 *   action={{
 *     label: "Create Prompt",
 *     onClick: () => router.push('/prompts/new'),
 *     variant: "default"
 *   }}
 * />
 * ```
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      variant,
      icon: Icon,
      iconSize = "default",
      title,
      description,
      action,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(emptyStateVariants({ variant }), className)}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(emptyStateIconVariants({ size: iconSize }))}
            aria-hidden="true"
          />
        )}

        <h3 className="text-lg font-semibold text-text-strong mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-text-muted max-w-md mb-6">
            {description}
          </p>
        )}

        {action && (
          <Button
            variant={action.variant || "primary"}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
