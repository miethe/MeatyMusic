/**
 * Access Denied Component
 * Displays a user-friendly message when access is forbidden
 */

'use client';

import * as React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@meatymusic/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface AccessDeniedProps {
  /** Custom message to display */
  message?: string;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Whether to show the home button */
  showHomeButton?: boolean;
}

export function AccessDenied({
  message = 'You do not have permission to access this resource.',
  showBackButton = true,
  showHomeButton = true,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8 text-error" />
      </div>

      <h1 className="text-3xl font-bold text-text-primary mb-2">Access Denied</h1>

      <p className="text-lg text-text-secondary text-center max-w-md mb-8">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        )}

        {showHomeButton && (
          <Button
            asChild
            variant="primary"
            className="gap-2"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-8 p-4 bg-bg-overlay rounded-lg border border-border-default max-w-md">
        <p className="text-sm text-text-muted">
          If you believe you should have access to this resource, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
