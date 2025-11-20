import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Solid accent color, white text
        primary:
          "bg-gradient-to-r from-[var(--mm-color-primary)] to-[var(--mm-color-primary-600)] text-white shadow-[var(--mm-shadow-accent-glow)] hover:shadow-[var(--mm-shadow-accent-glow-lg)] hover:brightness-110 active:brightness-95 focus-visible:ring-[var(--mm-color-ring)]",
        // Secondary: Outlined accent, accent text
        secondary:
          "border-2 border-[var(--mm-color-border-accent)] bg-transparent text-[var(--mm-color-primary)] hover:bg-[var(--mm-color-primary)]/10 hover:border-[var(--mm-color-primary)] hover:brightness-110 active:bg-[var(--mm-color-primary)]/20 focus-visible:ring-[var(--mm-color-ring)]",
        // Ghost: Transparent, subtle hover
        ghost:
          "bg-transparent text-[var(--mm-color-text-secondary)] hover:bg-[var(--mm-color-panel)] hover:text-[var(--mm-color-text-primary)] active:bg-[var(--mm-color-elevated)] focus-visible:ring-[var(--mm-color-ring)]",
        // Outline: Border with transparent background
        outline:
          "border border-[var(--mm-color-border-default)] bg-[var(--mm-color-surface)] text-[var(--mm-color-text-primary)] shadow-[var(--mm-shadow-1)] hover:bg-[var(--mm-color-panel)] hover:border-[var(--mm-color-border-strong)] hover:shadow-[var(--mm-shadow-2)] active:shadow-[var(--mm-shadow-1)] focus-visible:ring-[var(--mm-color-ring)]",
        // Semantic variants
        success:
          "bg-[var(--mm-color-success-500)] text-white shadow-[var(--mm-shadow-1)] hover:bg-[var(--mm-color-success-600)] hover:shadow-[var(--mm-shadow-3)] active:shadow-[var(--mm-shadow-1)] focus-visible:ring-[var(--mm-color-success-500)]",
        warning:
          "bg-[var(--mm-color-warning-500)] text-white shadow-[var(--mm-shadow-1)] hover:bg-[var(--mm-color-warning-600)] hover:shadow-[var(--mm-shadow-3)] active:shadow-[var(--mm-shadow-1)] focus-visible:ring-[var(--mm-color-warning-500)]",
        danger:
          "bg-[var(--mm-color-error-500)] text-white shadow-[var(--mm-shadow-1)] hover:bg-[var(--mm-color-error-600)] hover:shadow-[var(--mm-shadow-3)] active:shadow-[var(--mm-shadow-1)] focus-visible:ring-[var(--mm-color-error-500)]",
        destructive:
          "bg-[var(--mm-color-error-500)] text-white shadow-[var(--mm-shadow-1)] hover:bg-[var(--mm-color-error-600)] hover:shadow-[var(--mm-shadow-3)] active:shadow-[var(--mm-shadow-1)] focus-visible:ring-[var(--mm-color-error-500)]",
        link:
          "text-[var(--mm-color-primary)] underline-offset-4 hover:underline focus-visible:ring-[var(--mm-color-ring)]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md [&_svg]:size-3.5",
        md: "h-9 px-4 py-2 [&_svg]:size-4",
        lg: "h-10 px-6 text-base rounded-lg [&_svg]:size-5",
        icon: "h-9 w-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Enhanced hover states with size-specific transforms
const hoverVariants = cva("", {
  variants: {
    size: {
      sm: "hover:-translate-y-0.5",
      md: "hover:-translate-y-px",
      lg: "hover:-translate-y-px",
      icon: "hover:-translate-y-px",
    },
    variant: {
      primary: "",
      secondary: "",
      success: "",
      warning: "",
      danger: "",
      destructive: "",
      outline: "",
      ghost: "",
      link: "",
    },
  },
  compoundVariants: [
    // Exclude hover transform for link and ghost variants
    {
      variant: ["link", "ghost"],
      size: ["sm", "md", "lg", "icon"],
      className: "hover:translate-y-0",
    },
  ],
});

// Active/press state with scale
const activeVariants = cva("active:scale-[0.98] active:translate-y-0", {
  variants: {
    variant: {
      primary: "",
      secondary: "",
      success: "",
      warning: "",
      danger: "",
      destructive: "",
      outline: "",
      ghost: "",
      link: "active:scale-100",
    },
  },
});

// Icon button specific transforms
const iconVariants = cva("", {
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
      icon: "[&_svg]:transition-transform [&_svg]:duration-[var(--mm-duration-fast)] hover:[&_svg]:scale-105",
    },
  },
});

// Transition timing
const transitionVariants = cva("", {
  variants: {
    variant: {
      primary: "duration-[var(--mm-duration-fast)]",
      secondary: "duration-[var(--mm-duration-fast)]",
      success: "duration-[var(--mm-duration-fast)]",
      warning: "duration-[var(--mm-duration-fast)]",
      danger: "duration-[var(--mm-duration-fast)]",
      destructive: "duration-[var(--mm-duration-fast)]",
      outline: "duration-[var(--mm-duration-fast)]",
      ghost: "duration-[var(--mm-duration-fast)]",
      link: "duration-[var(--mm-duration-fast)]",
    },
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // When asChild is true, we can't add loading states because Slot expects exactly one child
    // In this case, pass through the child as-is
    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size }),
            hoverVariants({ variant, size }),
            activeVariants({ variant }),
            iconVariants({ size }),
            transitionVariants({ variant }),
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // Normal button rendering with loading state support
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          hoverVariants({ variant, size }),
          activeVariants({ variant }),
          iconVariants({ size }),
          transitionVariants({ variant }),
          loading && "opacity-80 cursor-wait",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={loading && loadingText ? loadingText : undefined}
        {...props}
      >
        {loading && (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
            style={{
              animationDuration: "var(--mm-duration-slow)",
            }}
          />
        )}
        <span
          className={cn(
            "inline-flex items-center gap-2 transition-opacity",
            loading && "opacity-70"
          )}
          style={{
            transitionDuration: "var(--mm-duration-fast)",
          }}
        >
          {loading && loadingText ? loadingText : children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
