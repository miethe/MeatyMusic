/**
 * Dashboard Layout
 * Wraps all protected dashboard routes with AppShell
 */

import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
