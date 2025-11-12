import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Star } from "lucide-react";
import { cn } from "../../lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: [
          "border-border bg-surface text-text-base",
          "hover:bg-panel hover:border-border-strong",
          "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary",
        ],
        outline: [
          "border-border bg-transparent text-text-base",
          "hover:bg-panel hover:border-border-strong",
          "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary",
        ],
      },
      size: {
        sm: "px-2 py-1 text-xs min-h-[24px]",
        default: "px-3 py-1.5 text-sm min-h-[32px]",
        lg: "px-4 py-2 text-base min-h-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'>,
    VariantProps<typeof chipVariants> {
  /**
   * The chip content (typically the tag name)
   */
  children: React.ReactNode;
  /**
   * Optional count to display after the chip text
   */
  count?: number;
  /**
   * Whether the chip is in selected state
   */
  selected?: boolean;
  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
  /**
   * Whether to show a star icon indicating this is a popular tag
   */
  isPopular?: boolean;
  /**
   * Click handler for the chip
   */
  onClick?: () => void;
  /**
   * Keyboard event handler
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Chip component for displaying selectable tags with optional counts.
 *
 * This component extends Badge functionality to support interactive chip-like behavior
 * for tag filtering interfaces. It includes proper ARIA attributes and keyboard navigation
 * for accessibility compliance.
 *
 * @example
 * ```tsx
 * <Chip
 *   selected={isSelected}
 *   count={42}
 *   onClick={() => setSelected(!isSelected)}
 * >
 *   javascript
 * </Chip>
 * ```
 */
const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({
    className,
    variant,
    size,
    children,
    count,
    selected = false,
    disabled = false,
    isPopular = false,
    onClick,
    onKeyDown,
    ...props
  }, ref) => {
    const handleClick = React.useCallback(() => {
      if (disabled || !onClick) return;
      onClick();
    }, [disabled, onClick]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick();
      }

      onKeyDown?.(e);
    }, [disabled, handleClick, onKeyDown]);

    return (
      <div
        ref={ref}
        className={cn(
          chipVariants({ variant, size }),
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        data-selected={selected}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Popular indicator */}
        {isPopular && (
          <Star
            className={cn(
              "w-3 h-3 flex-shrink-0",
              selected ? "text-primary-foreground" : "text-warning"
            )}
            aria-hidden="true"
          />
        )}

        {/* Chip content */}
        <span className="truncate">{children}</span>

        {/* Count display */}
        {count !== undefined && (
          <span
            className={cn(
              "text-xs font-normal opacity-75",
              selected ? "text-primary-foreground" : "text-text-muted"
            )}
            aria-label={`${count} items`}
          >
            ({count})
          </span>
        )}

        {/* Selected indicator */}
        {selected && (
          <Check
            className="w-3 h-3 flex-shrink-0 text-primary-foreground"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";

export { Chip, chipVariants };
