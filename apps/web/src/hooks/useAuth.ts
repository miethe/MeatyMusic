/**
 * Authentication hook
 * Fetches user data from backend and provides role-based access checks
 * Note: Authentication is handled by backend via JWT tokens
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api/client';
import type { User } from '@/types/api';

export function useAuth() {
  // Fetch user data from backend
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USER_ME);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on 401/403
  });

  // Compute isAdmin from user role
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isLoaded: !isLoading,
    isSignedIn: !!user,
    isAdmin,
    isLoading,
    error,
  };
}

/**
 * Hook to check if current user is an admin
 * Convenience hook for conditional rendering based on admin role
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}
