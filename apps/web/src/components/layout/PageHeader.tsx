/**
 * PageHeader Component
 * Consistent page header with title, breadcrumbs, and actions
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { getBreadcrumbs } from '@/config/routes';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Action buttons (rendered on the right) */
  actions?: React.ReactNode;
  /** Custom breadcrumbs (overrides auto-generated) */
  breadcrumbs?: { label: string; href?: string }[];
  /** Additional class name */
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs: customBreadcrumbs,
  className,
}: PageHeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = customBreadcrumbs || getBreadcrumbs(pathname);

  return (
    <div className={cn('border-b bg-card', className)}>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 mb-4 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
