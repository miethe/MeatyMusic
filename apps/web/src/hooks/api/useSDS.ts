/**
 * useSDS Hook
 * React Query hook for fetching Song Design Spec (SDS)
 *
 * This hook fetches the compiled SDS JSON structure for a song,
 * which includes all related entities (style, lyrics, persona, etc.)
 * merged into a single specification document.
 */

import { useQuery } from '@tanstack/react-query';
import { songsApi, type SDS } from '@/lib/api';
import { queryKeys, getStaleTime } from '@/lib/query/config';
import type { UUID } from '@/types/api/entities';

/**
 * Fetch Song Design Spec (SDS) for a song
 *
 * @param songId - UUID of the song
 * @returns React Query result with SDS data
 *
 * @example
 * ```tsx
 * const { data: sds, isLoading, error } = useSDS(songId);
 * ```
 */
export function useSDS(songId: UUID | undefined) {
  return useQuery({
    queryKey: queryKeys.songs.entity(songId!, 'sds'),
    queryFn: () => songsApi.getSDS(songId!),
    enabled: !!songId,
    staleTime: getStaleTime('SONGS'),
    // Retry configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Type guard to check if SDS data is valid
 */
export function isValidSDS(data: unknown): data is SDS {
  if (!data || typeof data !== 'object') return false;
  const sds = data as Partial<SDS>;
  return (
    typeof sds.song_id === 'string' &&
    typeof sds.title === 'string' &&
    typeof sds.global_seed === 'number'
  );
}
