/**
 * Authentication utility functions
 */

import type { User } from '@/types/api';

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = ['/dashboard', '/songs', '/library', '/settings'];
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if a route requires admin role
 */
export function isAdminRoute(pathname: string): boolean {
  const adminPrefixes = ['/entities/blueprints', '/entities/sources'];
  return adminPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if a route is an auth route (sign-in, sign-up)
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/sign-in', '/sign-up'];
  return authRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Get redirect URL for authenticated user trying to access auth pages
 */
export function getAuthenticatedRedirect(pathname: string): string {
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthRoute(pathname)) {
    return '/dashboard';
  }
  return pathname;
}

/**
 * Get redirect URL for unauthenticated user trying to access protected pages
 */
export function getUnauthenticatedRedirect(pathname: string): string {
  // Store the intended destination for post-login redirect
  if (isProtectedRoute(pathname)) {
    return `/sign-in?redirect=${encodeURIComponent(pathname)}`;
  }
  return '/sign-in';
}

/**
 * Check if user has admin role
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user has required role for a route
 */
export function hasRequiredRole(
  user: User | null | undefined,
  pathname: string
): boolean {
  // If route requires admin, check admin role
  if (isAdminRoute(pathname)) {
    return isUserAdmin(user);
  }
  // All other protected routes just need authentication
  return !!user;
}
