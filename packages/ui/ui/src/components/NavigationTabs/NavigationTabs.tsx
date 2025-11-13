import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const navigationTabsVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-lg bg-surface p-1 text-text-base border border-border shadow-elev1",
  {
    variants: {
      size: {
        default: "h-9",
        sm: "h-8",
        lg: "h-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const navigationTabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-text-strong data-[state=active]:shadow-elev2 hover:text-text-strong [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-7 px-3 text-sm",
        sm: "h-6 px-2 text-xs",
        lg: "h-8 px-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  dataTour?: string;
}

export interface NavigationTabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
    VariantProps<typeof navigationTabsVariants> {
  items: NavigationItem[];
  currentPath: string;
  className?: string;
  onNavigate?: (item: NavigationItem) => void;
}

const NavigationTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  NavigationTabsProps
>(({ className, size, items, currentPath, onNavigate, ...props }, ref) => {
  // Find the active item based on current path
  const activeItem = items.find(item => {
    // Exact match first
    if (item.href === currentPath) return true;
    // For nested routes, check if current path starts with item href
    if (item.href !== '/' && currentPath.startsWith(item.href)) return true;
    return false;
  });

  const activeValue = activeItem?.href || items[0]?.href;

  const handleTabChange = (value: string) => {
    const item = items.find(item => item.href === value);
    if (item && onNavigate) {
      onNavigate(item);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: NavigationItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!item.disabled && onNavigate) {
        onNavigate(item);
      }
    }
  };

  return (
    <TabsPrimitive.Root
      ref={ref}
      value={activeValue}
      onValueChange={handleTabChange}
      {...props}
    >
      <TabsPrimitive.List
        className={cn(navigationTabsVariants({ size }), className)}
        role="tablist"
        aria-label="Navigation tabs"
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.href}
            value={item.href}
            disabled={item.disabled}
            className={cn(navigationTabsTriggerVariants({ size }))}
            onKeyDown={(event) => handleKeyDown(event, item)}
            role="tab"
            aria-selected={activeValue === item.href}
            aria-controls={`panel-${item.href}`}
            id={`tab-${item.href}`}
            data-tour={item.dataTour}
          >
            {item.icon && (
              <item.icon
                className="mr-1"
                aria-hidden="true"
              />
            )}
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
});

NavigationTabs.displayName = "NavigationTabs";

export { NavigationTabs, navigationTabsVariants, navigationTabsTriggerVariants };
