import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-mp-ring focus:ring-offset-2 hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:-translate-y-px",
  {
    variants: {
      variant: {
        default:
          "border border-mp-badge-default-border bg-mp-badge-default-bg text-mp-badge-default-text hover:bg-mp-badge-default-hover-bg shadow-[var(--mp-badge-default-shadow)]",
        secondary:
          "border border-mp-badge-secondary-border bg-mp-badge-secondary-bg text-mp-badge-secondary-text hover:bg-mp-badge-secondary-hover-bg shadow-[var(--mp-badge-secondary-shadow)]",
        accent:
          "border-transparent bg-mp-accent text-white hover:bg-mp-accent/80 shadow-[0_1px_3px_rgba(255,178,36,0.3)]",
        success:
          "border-transparent bg-mp-success text-white hover:bg-mp-success/80 shadow-[0_1px_3px_rgba(43,168,74,0.3)]",
        warning:
          "border-transparent bg-mp-warning text-white hover:bg-mp-warning/80 shadow-[0_1px_3px_rgba(245,158,11,0.3)]",
        danger:
          "border-transparent bg-mp-danger text-white hover:bg-mp-danger/80 shadow-[0_1px_3px_rgba(229,72,77,0.3)]",
        destructive:
          "border-transparent bg-mp-danger text-white hover:bg-mp-danger/80 shadow-[0_1px_3px_rgba(229,72,77,0.3)]",
        info:
          "border-transparent bg-mp-info text-white hover:bg-mp-info/80 shadow-[0_1px_3px_rgba(0,145,255,0.3)]",
        outline:
          "border border-mp-badge-outline-border bg-mp-badge-outline-bg text-mp-badge-outline-text hover:bg-mp-badge-outline-hover-bg hover:border-mp-badge-outline-hover-border shadow-[var(--mp-badge-outline-shadow)]",
        // Collection color variants
        "collection-primary":
          "border-transparent bg-mp-collection-primary text-white hover:bg-mp-collection-primary/80 shadow-[0_1px_3px_rgba(110,86,207,0.3)]",
        "collection-secondary":
          "border-transparent bg-mp-collection-secondary text-white hover:bg-mp-collection-secondary/80 shadow-[0_1px_3px_rgba(0,179,164,0.3)]",
        "collection-accent":
          "border-transparent bg-mp-collection-accent text-white hover:bg-mp-collection-accent/80 shadow-[0_1px_3px_rgba(255,178,36,0.3)]",
        "collection-purple":
          "border-transparent bg-mp-collection-purple text-white hover:bg-mp-collection-purple/80 shadow-[0_1px_3px_rgba(139,92,246,0.3)]",
        "collection-green":
          "border-transparent bg-mp-collection-green text-white hover:bg-mp-collection-green/80 shadow-[0_1px_3px_rgba(16,185,129,0.3)]",
        "collection-orange":
          "border-transparent bg-mp-collection-orange text-white hover:bg-mp-collection-orange/80 shadow-[0_1px_3px_rgba(249,115,22,0.3)]",
        "collection-blue":
          "border-transparent bg-mp-collection-blue text-white hover:bg-mp-collection-blue/80 shadow-[0_1px_3px_rgba(59,130,246,0.3)]",
        "collection-red":
          "border-transparent bg-mp-collection-red text-white hover:bg-mp-collection-red/80 shadow-[0_1px_3px_rgba(239,68,68,0.3)]",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-mp-sm",
        md: "px-2.5 py-1 text-xs rounded-mp-md",
        lg: "px-3 py-1.5 text-sm rounded-mp-md",
      },
      shape: {
        rounded: "",
        pill: "rounded-mp-pill",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "rounded",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether the badge can be dismissed/removed
   */
  dismissible?: boolean;
  /**
   * Callback when the dismiss button is clicked
   */
  onDismiss?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, shape, dismissible, onDismiss, children, ...props }, ref) => {
    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      >
        {children}
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors p-0.5"
            aria-label="Remove"
          >
            <X className={cn(
              "shrink-0",
              size === "sm" && "h-2.5 w-2.5",
              size === "md" && "h-3 w-3",
              size === "lg" && "h-3.5 w-3.5"
            )} />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
