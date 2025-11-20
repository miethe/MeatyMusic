/**
 * Admin Guard Component
 * Protects routes that require admin role
 * Shows access denied message for non-admin users
 */

'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccessDenied } from '@/components/common/AccessDenied';

export interface AdminGuardProps {
  /** Content to render if user is admin */
  children: React.ReactNode;
  /** Custom message for non-admin users */
  message?: string;
  /** Loading fallback while checking auth */
  loadingFallback?: React.ReactNode;
}

/**
 * Guard component that only renders children if user is admin
 * Shows AccessDenied component for non-admin users
 */
export function AdminGuard({
  children,
  message = 'This page is only accessible to administrators.',
  loadingFallback = null,
}: AdminGuardProps) {
  const { isAdmin, isLoading, isSignedIn } = useAuth();

  // Still loading auth state
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // User is not signed in (will be handled by auth middleware)
  if (!isSignedIn) {
    return null;
  }

  // User is signed in but not admin
  if (!isAdmin) {
    return <AccessDenied message={message} />;
  }

  // User is admin - render protected content
  return <>{children}</>;
}

/**
 * Hook to check if content should be shown based on admin role
 * Useful for conditional rendering within components
 */
export function useAdminGuard(): {
  isAdmin: boolean;
  isLoading: boolean;
  canAccess: boolean;
} {
  const { isAdmin, isLoading } = useAuth();

  return {
    isAdmin,
    isLoading,
    canAccess: !isLoading && isAdmin,
  };
}
