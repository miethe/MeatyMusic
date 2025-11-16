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
// Store Integration Hooks - TEMPORARILY DISABLED
// ============================================================================

// TODO: Re-enable after resolving @meatymusic/store workspace dependency issues in Next.js build
// The store package exists and is built, but Next.js has issues resolving workspace dependencies
// during the production build. These hooks work fine in dev mode.

// Songs Hooks
// export {
//   useSongsWithStore,
//   useSongWithStore,
//   useCreateSongMutation,
//   useUpdateSongMutation,
//   useDeleteSongMutation,
//   usePrefetchSongs,
//   usePrefetchSong,
//   songsKeys,
// } from './useSongsWithStore';

// Workflows Hooks
// export {
//   useWorkflowsWithStore,
//   useWorkflowDetailsWithStore,
//   useWorkflowProgressWithStore,
//   useWorkflowSummaryWithStore,
//   useStartWorkflowMutation,
//   useCancelWorkflowMutation,
//   useRetryWorkflowMutation,
//   usePrefetchWorkflows,
//   usePrefetchWorkflow,
//   useClearWorkflowDetails,
//   workflowsKeys,
// } from './useWorkflowsWithStore';

// Entities Hooks
// export {
//   useStylesWithStore,
//   useStyleWithStore,
//   useCreateStyleMutation,
//   useUpdateStyleMutation,
//   useDeleteStyleMutation,
//   useLyricsWithStore,
//   useLyricsItemWithStore,
//   useCreateLyricsMutation,
//   useUpdateLyricsMutation,
//   useDeleteLyricsMutation,
//   usePersonasWithStore,
//   usePersonaWithStore,
//   useCreatePersonaMutation,
//   useUpdatePersonaMutation,
//   useDeletePersonaMutation,
//   entitiesKeys,
// } from './useEntitiesWithStore';

// WebSocket Store Sync Hooks
// export {
//   useStoreSync,
//   useGlobalStoreSync,
//   type UseStoreSyncOptions,
// } from './useStoreSync';

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
