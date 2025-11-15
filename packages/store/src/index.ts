import { useOnboardingStore } from './stores/onboardingStore';
import { usePreferencesStore } from './stores/preferencesStore';
import type {
  OnboardingState,
  OnboardingStore,
  PreferencesState,
  PreferencesStore,
} from './types';

export {
  useOnboardingStore,
  usePreferencesStore,
};

export type {
  OnboardingState,
  OnboardingStore,
  PreferencesState,
  PreferencesStore,
};

export const useOnboardingState = () =>
  useOnboardingStore((state: OnboardingState) => state);
export const usePreferences = () =>
  usePreferencesStore((state: PreferencesState) => state);
export const useTheme = () =>
  usePreferencesStore((state: PreferencesState) => state.theme);

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

// Export middleware
export {
  createLocalStorageMiddleware,
  createApiSyncMiddleware,
  createQueryIntegrationMiddleware,
} from './middleware';

export type {
  MutationHooks,
  QueryIntegrationState,
  QueryIntegrationActions,
  QueryIntegrationStore,
} from './middleware';
