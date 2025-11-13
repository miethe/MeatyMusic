/**
 * AppShell Layout
 * Main application shell with sidebar navigation and header
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@meatymusic/ui';
import {
  Music2,
  Home,
  Library,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { NAV_ITEMS } from '@/config/routes';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Music2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">MeatyMusic</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.name} item={item} pathname={pathname} />
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">User</p>
                <p className="text-xs text-muted-foreground truncate">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b">
          <div className="flex items-center gap-4 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex-1">
              {/* Breadcrumbs will be rendered by PageHeader */}
            </div>

            {/* Header actions can be added here */}
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-57px)]">{children}</main>
      </div>
    </div>
  );
}

interface NavItemProps {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}

function NavItem({ item, pathname }: NavItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = 'children' in item && item.children && item.children.length > 0;

  // Auto-expand if current path matches any child
  React.useEffect(() => {
    if (hasChildren && item.children) {
      const isChildActive = item.children.some(
        (child) => pathname.startsWith(child.href)
      );
      if (isChildActive) {
        setExpanded(true);
      }
    }
  }, [pathname, hasChildren, item]);

  if (hasChildren && item.children) {
    const Icon = getIcon(item.icon);

    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            'hover:bg-accent/50',
            expanded ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-left">{item.name}</span>
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {expanded && (
          <ul className="mt-1 ml-8 space-y-1">
            {item.children.map((child) => {
              const isActive = pathname.startsWith(child.href);
              return (
                <li key={child.name}>
                  <Link
                    href={child.href}
                    className={cn(
                      'block px-3 py-2 text-sm rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    {child.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  const Icon = getIcon(item.icon);
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <span>{item.name}</span>
      </Link>
    </li>
  );
}

function getIcon(iconName?: string) {
  const icons = {
    Home,
    Music2,
    Library,
    Settings,
  };
  return iconName ? icons[iconName as keyof typeof icons] : undefined;
}
