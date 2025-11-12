/**
 * Authentication hook
 * Combines Clerk auth with backend user data
 */

'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api/client';
import type { User } from '@/types/api';

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  // Fetch extended user data from backend
  const {
    data: userData,
    isLoading: isUserDataLoading,
    error,
  } = useQuery<User>({
    queryKey: ['user', clerkUser?.id],
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USER_ME);
      return response.data;
    },
    enabled: isSignedIn && !!clerkUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: userData,
    clerkUser,
    isLoaded,
    isSignedIn,
    isLoading: !isLoaded || (isSignedIn && isUserDataLoading),
    error,
  };
}
