/**
 * React Query Integration Hooks
 *
 * Central export point for all React Query hooks that sync with Zustand stores.
 * These hooks provide the bridge between server state (React Query) and client state (Zustand).
 *
 * Pattern:
 * - Queries automatically sync data to stores
 * - Mutations use optimistic updates with rollback
 * - Full TypeScript type safety
 * - Error handling built-in
 *
 * @example
 * ```tsx
 * import { useSongsWithStore, useCreateSongMutation } from '@/lib/hooks';
 *
 * function SongsPage() {
 *   const { data, isLoading } = useSongsWithStore({ status: ['draft'] });
 *   const createSong = useCreateSongMutation();
 *
 *   // Data is automatically synced to useSongsStore
 *   // Optimistic updates happen automatically on mutations
 * }
 * ```
 */

// ============================================================================
// Songs Hooks
// ============================================================================

export {
  // Query hooks
  useSongsWithStore,
  useSongWithStore,

  // Mutation hooks
  useCreateSongMutation,
  useUpdateSongMutation,
  useDeleteSongMutation,

  // Prefetch utilities
  usePrefetchSongs,
  usePrefetchSong,

  // Query keys
  songsKeys,
} from './useSongsWithStore';

// ============================================================================
// Workflows Hooks
// ============================================================================

export {
  // Query hooks
  useWorkflowsWithStore,
  useWorkflowDetailsWithStore,
  useWorkflowProgressWithStore,
  useWorkflowSummaryWithStore,

  // Mutation hooks
  useStartWorkflowMutation,
  useCancelWorkflowMutation,
  useRetryWorkflowMutation,

  // Prefetch utilities
  usePrefetchWorkflows,
  usePrefetchWorkflow,

  // Invalidation helpers
  useClearWorkflowDetails,

  // Query keys
  workflowsKeys,
} from './useWorkflowsWithStore';

// ============================================================================
// Entities Hooks
// ============================================================================

export {
  // Styles
  useStylesWithStore,
  useStyleWithStore,
  useCreateStyleMutation,
  useUpdateStyleMutation,
  useDeleteStyleMutation,

  // Lyrics
  useLyricsWithStore,
  useLyricsItemWithStore,
  useCreateLyricsMutation,
  useUpdateLyricsMutation,
  useDeleteLyricsMutation,

  // Personas
  usePersonasWithStore,
  usePersonaWithStore,
  useCreatePersonaMutation,
  useUpdatePersonaMutation,
  useDeletePersonaMutation,

  // Query keys
  entitiesKeys,
} from './useEntitiesWithStore';

// ============================================================================
// Type Exports
// ============================================================================

// Re-export commonly used types for convenience
export type {
  // Filter types
  SongFilters,
} from '@/lib/api/songs';

export type {
  WorkflowRunFilters,
} from '@/lib/api/workflows';

export type {
  StyleFilters,
} from '@/lib/api/styles';

export type {
  LyricsFilters,
} from '@/lib/api/lyrics';

export type {
  PersonaFilters,
} from '@/lib/api/personas';

// ============================================================================
// Usage Documentation
// ============================================================================

/**
 * USAGE GUIDE
 * ===========
 *
 * ## Query Hooks (Fetching Data)
 *
 * All query hooks automatically sync data to their respective Zustand stores.
 * You can use either the React Query data directly or read from the store.
 *
 * ```tsx
 * // Option 1: Use React Query data directly
 * const { data, isLoading, error } = useSongsWithStore({ status: ['draft'] });
 *
 * // Option 2: Use store selectors (data is already synced)
 * import { useSongs } from '@meatymusic/store';
 * const songs = useSongs(); // Returns Map<UUID, Song>
 * ```
 *
 * ## Mutation Hooks (Creating/Updating/Deleting)
 *
 * All mutation hooks implement optimistic updates:
 * 1. Update happens immediately in UI (optimistic)
 * 2. API request is sent
 * 3. On success: optimistic update is committed
 * 4. On error: optimistic update is rolled back
 *
 * ```tsx
 * const createSong = useCreateSongMutation();
 *
 * const handleCreate = async () => {
 *   try {
 *     const song = await createSong.mutateAsync({
 *       title: 'My Song',
 *       global_seed: 12345
 *     });
 *     // Song appears in UI immediately, even before API responds
 *   } catch (error) {
 *     // Automatically rolled back on error
 *   }
 * };
 * ```
 *
 * ## Loading States
 *
 * Query loading states are automatically synced to stores:
 *
 * ```tsx
 * // Both work:
 * const { isLoading } = useSongsWithStore();
 * // OR
 * import { useSongsLoading } from '@meatymusic/store';
 * const isLoading = useSongsLoading();
 * ```
 *
 * ## Error Handling
 *
 * Errors are automatically synced to stores:
 *
 * ```tsx
 * const { error } = useSongsWithStore();
 * // OR
 * import { useSongsError } from '@meatymusic/store';
 * const error = useSongsError();
 * ```
 *
 * ## Prefetching for Performance
 *
 * Use prefetch hooks to load data before navigation:
 *
 * ```tsx
 * const prefetchSong = usePrefetchSong();
 *
 * <SongRow
 *   onMouseEnter={() => prefetchSong(song.id)}
 *   onClick={() => navigate(`/songs/${song.id}`)}
 * />
 * ```
 *
 * ## Query Invalidation
 *
 * Mutations automatically invalidate related queries.
 * For manual invalidation:
 *
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query';
 * import { songsKeys } from '@/lib/hooks';
 *
 * const queryClient = useQueryClient();
 * queryClient.invalidateQueries({ queryKey: songsKeys.all });
 * ```
 *
 * ## Best Practices
 *
 * 1. Use query hooks in page/route components
 * 2. Use store selectors in child components
 * 3. Mutations handle optimistic updates automatically
 * 4. Prefetch on hover for instant navigation
 * 5. Let the hooks manage loading/error states
 * 6. Don't manually sync query data to stores (it's automatic)
 *
 * ## Performance Tips
 *
 * - Queries have built-in staleTime to reduce refetches
 * - Use prefetching for perceived instant navigation
 * - Store data persists across component unmounts
 * - Optimistic updates make UI feel instant
 * - React Query handles caching and deduplication
 */
