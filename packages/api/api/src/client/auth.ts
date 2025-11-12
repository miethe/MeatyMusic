/**
 * @fileoverview Clerk authentication integration for API client
 */

import { useAuth } from '@clerk/nextjs';

/**
 * Auth token provider interface
 */
export interface AuthTokenProvider {
  getToken(): Promise<string | null>;
}

/**
 * Clerk-based auth token provider
 * Note: This should only be used in React components/hooks
 */
export function createClerkAuthProvider(): AuthTokenProvider {
  return {
    async getToken(): Promise<string | null> {
      // This will be called from within React component context
      // where useAuth hook is available
      throw new Error(
        'ClerkAuthProvider should be used with useClerkAuthToken hook in React components'
      );
    }
  };
}

/**
 * Hook to get Clerk auth token for API calls
 * Must be used within a React component
 */
export function useClerkAuthToken(): () => Promise<string | null> {
  const { getToken } = useAuth();

  return async () => {
    try {
      return await getToken();
    } catch (error) {
      console.warn('Failed to get auth token from Clerk:', error);
      return null;
    }
  };
}

/**
 * Static auth token provider for server-side usage
 */
export function createStaticAuthProvider(token: string | null): AuthTokenProvider {
  return {
    async getToken(): Promise<string | null> {
      return token;
    }
  };
}

/**
 * Environment-based auth token provider
 */
export function createEnvAuthProvider(): AuthTokenProvider {
  return {
    async getToken(): Promise<string | null> {
      // In a real implementation, this might read from environment variables
      // or other server-side auth mechanisms
      return null;
    }
  };
}
