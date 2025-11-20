import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const cardVariants = cva(
  "rounded-lg text-[var(--mm-color-text-primary)] transition-all duration-[var(--mm-duration-fast)]",
  {
    variants: {
      variant: {
        // Default: Basic card with subtle border
        default:
          "bg-[var(--mm-color-surface)] border border-[var(--mm-color-border-default)] shadow-[var(--mm-shadow-1)]",
        // Elevated: Card with shadow (level 2)
        elevated:
          "bg-[var(--mm-color-surface)] border border-[var(--mm-color-border-default)] shadow-[var(--mm-shadow-2)] hover:shadow-[var(--mm-shadow-3)] hover:border-[var(--mm-color-border-accent)]/30 hover:-translate-y-0.5 active:shadow-[var(--mm-shadow-2)] active:translate-y-0",
        // Gradient: Card with subtle gradient background
        gradient:
          "bg-gradient-to-br from-[var(--mm-color-surface)] to-[var(--mm-color-panel)] border border-[var(--mm-color-border-default)] shadow-[var(--mm-shadow-1)] hover:shadow-[var(--mm-shadow-2)] hover:border-[var(--mm-color-border-strong)]",
        // Ghost variant for minimal styling
        ghost:
          "bg-transparent border-0 shadow-none hover:bg-[var(--mm-color-panel)]/50",
        // Interactive variant for clickable cards
        interactive:
          "bg-[var(--mm-color-surface)] border border-[var(--mm-color-border-default)] shadow-[var(--mm-shadow-1)] cursor-pointer hover:shadow-[var(--mm-shadow-2)] hover:border-[var(--mm-color-border-accent)] hover:-translate-y-1 active:shadow-[var(--mm-shadow-1)] active:translate-y-0 transition-all duration-[var(--mm-duration-fast)]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      focusable: {
        true: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-color-ring)] focus-visible:ring-offset-2",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      focusable: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * If true, the card can be focused via keyboard navigation
   * @default false
   */
  focusable?: boolean;
  /**
   * If true, adds interactive hover states optimized for clickable cards
   * Sets variant to "interactive" automatically
   * @default false
   */
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, focusable, interactive, ...props }, ref) => {
    // If interactive is true, use interactive variant
    const effectiveVariant = interactive ? "interactive" : variant;
    const effectiveFocusable = interactive ? true : focusable;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant: effectiveVariant, padding, focusable: effectiveFocusable }),
          "group",
          className
        )}
        tabIndex={effectiveFocusable ? 0 : undefined}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      "border-b border-[var(--mm-color-border-default)]/50 transition-colors duration-[var(--mm-duration-fast)]",
      "group-hover:border-[var(--mm-color-border-default)]/80",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-[var(--mm-color-text-primary)]",
      "transition-colors duration-[var(--mm-duration-fast)]",
      "group-hover:text-[var(--mm-color-primary)]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-[var(--mm-color-text-tertiary)]",
      "transition-opacity duration-[var(--mm-duration-fast)]",
      "group-hover:opacity-90",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      "border-t border-[var(--mm-color-border-default)]/0 transition-colors duration-[var(--mm-duration-fast)]",
      "group-hover:border-[var(--mm-color-border-default)]/30",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
