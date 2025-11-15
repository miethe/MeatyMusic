import { useOnboardingStore } from './stores/onboardingStore';
import { usePreferencesStore } from './stores/preferencesStore';
import {
  useSongsStore,
  useSongs,
  useSongsIds,
  useSongById,
  useSongsFilters,
  useSongsLoading,
  useSongsError,
  useSongsSelectedId,
  useSongsPagination,
} from './stores/songsStore';
import type {
  OnboardingState,
  OnboardingStore,
  PreferencesState,
  PreferencesStore,
} from './types';

// ============================================================================
// Store Exports
// ============================================================================

export {
  useOnboardingStore,
  usePreferencesStore,
  useSongsStore,
};

export type {
  OnboardingState,
  OnboardingStore,
  PreferencesState,
  PreferencesStore,
};

// ============================================================================
// Selector Exports
// ============================================================================

// Onboarding selectors
export const useOnboardingState = () =>
  useOnboardingStore((state: OnboardingState) => state);

// Preferences selectors
export const usePreferences = () =>
  usePreferencesStore((state: PreferencesState) => state);
export const useTheme = () =>
  usePreferencesStore((state: PreferencesState) => state.theme);

// Songs selectors
export {
  useSongs,
  useSongsIds,
  useSongById,
  useSongsFilters,
  useSongsLoading,
  useSongsError,
  useSongsSelectedId,
  useSongsPagination,
};

// ============================================================================
// Type Exports
// ============================================================================

// Export all store types for use in implementation
export type {
  // Core API types
  ISODateTime,
  UUID,
  ErrorResponse,
  PageInfo,
  PaginatedResponse,
  SongStatus,
  Song,
  Style,
  Lyrics,
  Persona,
  ProducerNotes,
  Source,
  ComposedPrompt,

  // Songs store types
  SongsPagination,
  SongsFilters,
  SongsSorting,
  SongsListState,
  SongsSelectionState,
  SongsOptimisticState,
  SongsActions,
  SongsStore,

  // Workflows store types
  WorkflowRunStatus,
  WorkflowRun,
  WorkflowEvent,
  ScoreSummary,
  ArtifactMap,
  WorkflowsFilters,
  WorkflowsSorting,
  WorkflowsPagination,
  WorkflowsListState,
  WorkflowProgressState,
  WorkflowOptimisticState,
  WorkflowsActions,
  WorkflowsStore,

  // Entities store types
  EntityCache,
  EntityType,
  EntityTypeMap,
  RecentEntities,
  EntitiesState,
  EntitiesActions,
  EntitiesStore,
} from './types';

// ============================================================================
// Middleware Exports
// ============================================================================

export {
  createLocalStorageMiddleware,
  createApiSyncMiddleware,
  createQueryIntegrationMiddleware,
  createMultiTabMiddleware,
} from './middleware';

export type {
  MutationHooks,
  QueryIntegrationState,
  QueryIntegrationActions,
  QueryIntegrationStore,
} from './middleware';
