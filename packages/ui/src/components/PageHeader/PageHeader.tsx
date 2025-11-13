import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const pageHeaderVariants = cva(
  "w-full border-b border-border bg-background",
  {
    variants: {
      sticky: {
        true: "sticky top-0 z-10",
        false: "",
      },
    },
    defaultVariants: {
      sticky: false,
    },
  }
);

export interface Breadcrumb {
  /** Breadcrumb label text */
  label: string;
  /** Optional href for breadcrumb link */
  href?: string;
}

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof pageHeaderVariants> {
  /** Page title (h1) */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional breadcrumbs for navigation */
  breadcrumbs?: Breadcrumb[];
  /** Optional actions slot (buttons, etc.) */
  actions?: React.ReactNode;
}

/**
 * PageHeader component for consistent page headers across the application.
 *
 * Features:
 * - Title and optional subtitle
 * - Breadcrumb navigation
 * - Actions slot for buttons/controls
 * - Sticky variant for persistent headers
 * - Responsive layout
 *
 * Accessibility:
 * - Proper heading hierarchy (h1 for title)
 * - Semantic breadcrumb navigation with aria-label
 * - Header landmark role
 * - Keyboard accessible breadcrumbs
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Prompts"
 *   subtitle="Manage your AI prompts"
 *   breadcrumbs={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Prompts' }
 *   ]}
 *   actions={
 *     <Button>Create Prompt</Button>
 *   }
 * />
 * ```
 */
const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      className,
      sticky = false,
      title,
      subtitle,
      breadcrumbs,
      actions,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(pageHeaderVariants({ sticky }), className)}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="mb-3"
            >
              <ol className="flex items-center gap-2 text-sm text-text-muted">
                {breadcrumbs.map((breadcrumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <li
                      key={index}
                      className="flex items-center gap-2"
                    >
                      {breadcrumb.href ? (
                        <a
                          href={breadcrumb.href}
                          className="hover:text-text-strong transition-colors"
                        >
                          {breadcrumb.label}
                        </a>
                      ) : (
                        <span
                          className={cn(
                            isLast && "text-text-strong font-medium"
                          )}
                          aria-current={isLast ? "page" : undefined}
                        >
                          {breadcrumb.label}
                        </span>
                      )}

                      {!isLast && (
                        <ChevronRight
                          className="h-4 w-4 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          {/* Title and Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <h1 className="text-heading">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-2 text-body text-muted max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Actions Section */}
            {actions && (
              <div className="flex-shrink-0 flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";

export { PageHeader };
