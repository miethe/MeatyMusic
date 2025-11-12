import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const cardVariants = cva(
  "rounded-md text-text-base transition-all duration-[var(--mp-motion-duration-ui)]",
  {
    variants: {
      variant: {
        elevated: "bg-surface border border-border shadow-elev2 hover:shadow-elev3 hover:border-[var(--mp-color-primary)]/20 hover:-translate-y-0.5 active:shadow-elev2 active:translate-y-0",
        bordered: "bg-surface border border-border shadow-elev1 hover:shadow-elev2 hover:border-[var(--mp-color-primary)]/30",
        ghost: "bg-transparent border-0 shadow-none hover:bg-[var(--mp-color-panel)]/50",
        interactive: "bg-surface border border-border shadow-elev1 cursor-pointer hover:shadow-elev2 hover:border-[var(--mp-color-primary)] hover:-translate-y-1 active:shadow-elev1 active:translate-y-0 transition-all duration-[var(--mp-motion-duration-ui)]",
      },
      focusable: {
        true: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mp-color-ring)] focus-visible:ring-offset-2",
        false: "",
      }
    },
    defaultVariants: {
      variant: "elevated",
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
  ({ className, variant, focusable, interactive, ...props }, ref) => {
    // If interactive is true, use interactive variant
    const effectiveVariant = interactive ? "interactive" : variant;
    const effectiveFocusable = interactive ? true : focusable;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant: effectiveVariant, focusable: effectiveFocusable }),
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
      "border-b border-[var(--mp-color-border)]/50 transition-colors duration-[var(--mp-motion-duration-ui)]",
      "group-hover:border-[var(--mp-color-border)]/80",
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
      "text-2xl font-semibold leading-none tracking-tight text-text-strong",
      "transition-colors duration-[var(--mp-motion-duration-ui)]",
      "group-hover:text-[var(--mp-color-primary)]",
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
      "text-sm text-text-muted",
      "transition-opacity duration-[var(--mp-motion-duration-ui)]",
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
      "border-t border-[var(--mp-color-border)]/0 transition-colors duration-[var(--mp-motion-duration-ui)]",
      "group-hover:border-[var(--mp-color-border)]/30",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
