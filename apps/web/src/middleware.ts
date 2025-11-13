/**
 * Middleware for development bypass
 * Allows API client to work in development without authentication
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

export function middleware(req: NextRequest) {
  // Development bypass for MCP/agent testing (secure by environment check)
  if (isDevelopmentBypass(req)) {
    // eslint-disable-next-line no-console
    console.log('[DEV] Auth bypass enabled for request:', req.url);
  }

  // Allow all requests to pass through
  // Backend will handle authentication via JWT tokens
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
