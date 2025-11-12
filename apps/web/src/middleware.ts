/**
 * Middleware for route protection
 * Uses Clerk middleware to protect routes with optional development bypass
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Define protected routes that require authentication
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/songs(.*)',
  '/library(.*)',
  '/settings(.*)',
]);

/**
 * Check if request should bypass authentication (development only)
 * Requires both NODE_ENV=development and correct secret header
 */
function isDevelopmentBypass(req: NextRequest): boolean {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  const bypassHeader = req.headers.get('X-Dev-Auth-Bypass');
  const expectedSecret = process.env.DEV_AUTH_BYPASS_SECRET;

  // Both header and secret must exist and match
  if (!bypassHeader || !expectedSecret) {
    return false;
  }

  return bypassHeader === expectedSecret;
}

export default clerkMiddleware((auth, req) => {
  // Development bypass for MCP/agent testing (secure by environment check)
  if (isDevelopmentBypass(req)) {
    console.log('[DEV] Auth bypass enabled for request:', req.url);
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  // Explicitly return undefined for unprotected routes
  return undefined;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
