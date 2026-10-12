import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

/**
 * Collapsible component built on Radix Collapsible primitive.
 * Used for advanced settings and expandable sections.
 */

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> & {
    showIcon?: boolean;
  }
>(({ className, children, showIcon = true, asChild, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    asChild={asChild}
    className={cn(
      "flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    )}
    {...props}
  >
    {/* In `asChild` mode Radix's Slot clones a SINGLE child element and requires exactly
        one — the caller owns everything that renders, including any icon — so injecting a
        second ChevronDown sibling here throws "React.Children.only expected to receive a
        single React element child." Only auto-inject the icon in the normal (non-asChild)
        rendering path. */}
    {asChild ? (
      children
    ) : (
      <>
        {children}
        {showIcon && (
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        )}
      </>
    )}
  </CollapsiblePrimitive.CollapsibleTrigger>
));
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden text-sm data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  />
));
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
