import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-elev1 hover:shadow-elev3 hover:bg-primary/90 active:shadow-elev1 focus-visible:ring-[var(--mp-color-ring)]",
        premium:
          "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-elev2 hover:shadow-elev4 hover:from-purple-600 hover:to-purple-700 active:shadow-elev2 focus-visible:ring-purple-400",
        secondary:
          "bg-mp-secondary text-white shadow-elev1 hover:shadow-elev3 hover:bg-mp-secondary/90 active:shadow-elev1 focus-visible:ring-[var(--mp-color-secondary)]",
        success:
          "bg-mp-success text-white shadow-elev1 hover:shadow-elev3 hover:bg-mp-success/90 active:shadow-elev1 focus-visible:ring-[var(--mp-color-success)]",
        warning:
          "bg-mp-warning text-white shadow-elev1 hover:shadow-elev3 hover:bg-mp-warning/90 active:shadow-elev1 focus-visible:ring-[var(--mp-color-warning)]",
        danger:
          "bg-mp-danger text-white shadow-elev1 hover:shadow-elev3 hover:bg-mp-danger/90 active:shadow-elev1 focus-visible:ring-[var(--mp-color-danger)]",
        destructive:
          "bg-mp-danger text-white shadow-elev1 hover:shadow-elev3 hover:bg-mp-danger/90 active:shadow-elev1 focus-visible:ring-[var(--mp-color-danger)]",
        outline:
          "border border-border bg-surface shadow-elev1 hover:bg-panel hover:text-text-strong hover:shadow-elev2 active:shadow-elev1 focus-visible:ring-[var(--mp-color-ring)]",
        ghost: "hover:bg-panel hover:text-text-strong focus-visible:ring-[var(--mp-color-ring)]",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-[var(--mp-color-ring)]",
      },
      size: {
        default: "h-9 px-4 py-2 [&_svg]:size-4",
        sm: "h-8 rounded-md px-3 text-xs [&_svg]:size-3.5",
        lg: "h-10 rounded-md px-8 [&_svg]:size-5",
        icon: "h-9 w-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Enhanced hover states with size-specific transforms
const hoverVariants = cva("", {
  variants: {
    size: {
      default: "hover:-translate-y-px",
      sm: "hover:-translate-y-0.5",
      lg: "hover:-translate-y-px",
      icon: "hover:-translate-y-px",
    },
    variant: {
      default: "",
      premium: "",
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
      size: ["default", "sm", "lg", "icon"],
      className: "hover:translate-y-0",
    },
  ],
});

// Active/press state with scale
const activeVariants = cva("active:scale-[0.98] active:translate-y-0", {
  variants: {
    variant: {
      default: "",
      premium: "",
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
      default: "",
      sm: "",
      lg: "",
      icon: "[&_svg]:transition-transform [&_svg]:duration-[var(--mp-motion-duration-ui)] hover:[&_svg]:scale-105",
    },
  },
});

// Transition timing
const transitionVariants = cva("", {
  variants: {
    variant: {
      default: "duration-[var(--mp-motion-duration-ui)]",
      premium: "duration-[var(--mp-motion-duration-ui)]",
      secondary: "duration-[var(--mp-motion-duration-ui)]",
      success: "duration-[var(--mp-motion-duration-ui)]",
      warning: "duration-[var(--mp-motion-duration-ui)]",
      danger: "duration-[var(--mp-motion-duration-ui)]",
      destructive: "duration-[var(--mp-motion-duration-ui)]",
      outline: "duration-[var(--mp-motion-duration-ui)]",
      ghost: "duration-[var(--mp-motion-duration-ui)]",
      link: "duration-[var(--mp-motion-duration-ui)]",
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
              animationDuration: "var(--mp-motion-duration-modal)",
            }}
          />
        )}
        <span
          className={cn(
            "inline-flex items-center gap-2 transition-opacity",
            loading && "opacity-70"
          )}
          style={{
            transitionDuration: "var(--mp-motion-duration-ui)",
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
