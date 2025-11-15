/**
 * MeatyMusic Store Types
 *
 * Type definitions for all Zustand stores in the application.
 * Follows consistent patterns: State, Actions, and combined Store types.
 */

// ============================================================================
// Core API Types
// ============================================================================

/** ISO8601 datetime string */
export type ISODateTime = string;

/** UUID v4 string */
export type UUID = string;

/**
 * Error response from API
 */
export interface ErrorResponse {
  error: string;
  detail?: string;
  field?: string;
}

/**
 * Pagination metadata for cursor-based pagination
 */
export interface PageInfo {
  has_next_page: boolean;
  has_previous_page: boolean;
  start_cursor: string | null;
  end_cursor: string | null;
  total_count?: number;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  page_info: PageInfo;
}

/**
 * Song status enumeration
 */
export enum SongStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  RENDERING = 'rendering',
  RENDERED = 'rendered',
  FAILED = 'failed',
}

/**
 * Song entity
 */
export interface Song {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  title: string;
  sds_version?: string;
  global_seed: number;
  style_id?: UUID;
  persona_id?: UUID;
  blueprint_id?: UUID;
  status?: SongStatus;
  feature_flags?: Record<string, unknown>;
  render_config?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Style entity
 */
export interface Style {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  name: string;
  genre: string;
  sub_genres?: string[];
  bpm_min?: number;
  bpm_max?: number;
  key?: string;
  modulations?: string[];
  mood?: string[];
  energy_level?: number;
  instrumentation?: string[];
  vocal_profile?: Record<string, unknown>;
  tags_positive?: string[];
  tags_negative?: string[];
  blueprint_id?: UUID;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Lyrics entity
 */
export interface Lyrics {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  song_id: UUID;
  sections: Array<Record<string, unknown>>;
  section_order: string[];
  language?: string;
  pov?: string;
  tense?: string;
  rhyme_scheme?: string;
  meter?: string;
  syllables_per_line?: number;
  hook_strategy?: string;
  repetition_rules?: Record<string, unknown>;
  imagery_density?: number;
  reading_level?: number;
  themes?: string[];
  constraints?: Record<string, unknown>;
  explicit_allowed?: boolean;
  source_citations?: Array<Record<string, unknown>>;
  generated_text?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Persona entity
 */
export interface Persona {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  name: string;
  kind?: string;
  bio?: string;
  voice?: string;
  vocal_range?: string;
  delivery?: string[];
  influences?: string[];
  style_defaults?: Record<string, unknown>;
  lyrics_defaults?: Record<string, unknown>;
  policy?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * ProducerNotes entity
 */
export interface ProducerNotes {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  song_id: UUID;
  structure: string;
  hooks: number;
  instrumentation?: string[];
  section_meta?: Record<string, unknown>;
  mix?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Source entity
 */
export interface Source {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  name: string;
  kind: string;
  config?: Record<string, unknown>;
  scopes?: string[];
  weight?: number;
  allow?: string[];
  deny?: string[];
  provenance?: boolean;
  mcp_server_id: string;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * ComposedPrompt entity
 */
export interface ComposedPrompt {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  song_id: UUID;
  run_id: UUID;
  text: string;
  meta?: Record<string, unknown>;
  validation_status?: string;
  validation_scores?: Record<string, number>;
  extra_metadata?: Record<string, unknown>;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

// ============================================================================
// Onboarding Store Types
// ============================================================================

export interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isDismissed: boolean;
  completedAt: string | null;
}

export interface OnboardingActions {
  setOnboardingStep: (step: number, totalSteps?: number) => void;
  completeOnboarding: () => void;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

// ============================================================================
// Preferences Store Types
// ============================================================================

export interface PreferencesState {
  theme: 'light' | 'dark' | 'ocean' | 'sand';
  communicationOptIn: boolean;
  notifications: {
    email_updates: boolean;
    prompt_shares: boolean;
  };
}

export interface PreferencesActions {
  setTheme: (theme: PreferencesState['theme']) => void;
  updateNotifications: (partial: Partial<PreferencesState['notifications']>) => void;
  toggleCommunicationOptIn: () => void;
}

export type PreferencesStore = PreferencesState & PreferencesActions;

// ============================================================================
// Songs Store Types
// ============================================================================

/**
 * Pagination metadata for song list
 */
export interface SongsPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Filter configuration for song list
 */
export interface SongsFilters {
  search: string;
  createdAfter?: ISODateTime;
  status?: SongStatus;
  isApplied: boolean;
  isDirty: boolean;
}

/**
 * Sorting configuration for song list
 */
export interface SongsSorting {
  field: 'title' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

/**
 * List state for songs with pagination, filtering, and sorting
 */
export interface SongsListState {
  /** Normalized song items by ID */
  items: Map<string, Song>;
  /** Ordered list of all song IDs */
  allIds: string[];
  /** Pagination state */
  pagination: SongsPagination;
  /** Active filters */
  filters: SongsFilters;
  /** Sorting configuration */
  sorting: SongsSorting;
  /** Loading state for list operations */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Timestamp of last update */
  lastUpdated: number | null;
}

/**
 * Selection state for songs
 */
export interface SongsSelectionState {
  /** Currently selected song ID */
  selectedId: string | null;
  /** Multi-select song IDs */
  selectedIds: string[];
  /** Whether comparison mode is active */
  isComparing: boolean;
}

/**
 * Optimistic update state for songs
 */
export interface SongsOptimisticState {
  /** Items staged for creation (not yet committed) */
  stagedItems: Map<string, Song>;
  /** IDs marked for deletion */
  stagedRemovals: string[];
  /** Pending updates to existing items */
  stagedUpdates: Map<string, Partial<Song>>;
}

/**
 * Actions for managing songs
 */
export interface SongsActions {
  // Query sync (from React Query)
  setItems: (items: Song[], pagination: Partial<SongsPagination>) => void;
  setError: (error: Error | null) => void;
  setLoading: (loading: boolean) => void;

  // Filter management
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SongsFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  revertFilters: () => void;

  // Sorting
  setSorting: (field: SongsSorting['field'], direction?: SongsSorting['direction']) => void;

  // Pagination
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Selection
  selectSong: (id: string | null) => void;
  toggleMultiSelect: (id: string) => void;
  clearSelection: () => void;
  setComparisonMode: (enabled: boolean) => void;

  // Optimistic operations
  addOptimisticSong: (song: Song) => void;
  updateOptimisticSong: (id: string, updates: Partial<Song>) => void;
  removeOptimisticSong: (id: string) => void;
  commitOptimistic: (id: string) => void;
  rollbackOptimistic: (id: string) => void;

  // Cache control
  invalidate: () => void;
  clear: () => void;
  reset: () => void;
}

/**
 * Combined songs store type
 */
export type SongsStore = SongsListState & SongsSelectionState & SongsOptimisticState & SongsActions;

// ============================================================================
// Workflows Store Types
// ============================================================================

/**
 * Workflow run status
 */
export type WorkflowRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Workflow run representation
 */
export interface WorkflowRun {
  /** Unique run identifier */
  id: UUID;
  /** Associated song ID */
  songId: UUID;
  /** Current run status */
  status: WorkflowRunStatus;
  /** Current executing node */
  currentNode: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Run start timestamp */
  startedAt: ISODateTime;
  /** Run completion timestamp */
  completedAt: ISODateTime | null;
  /** Error message if failed */
  error: string | null;
}

/**
 * Workflow event from node execution
 */
export interface WorkflowEvent {
  /** Node identifier */
  node: string;
  /** Event phase */
  phase: 'start' | 'end' | 'fail';
  /** Event timestamp */
  timestamp: ISODateTime;
  /** Node execution duration in ms */
  duration?: number;
  /** Node metrics */
  metrics?: Record<string, number>;
  /** Issues or warnings */
  issues?: string[];
}

/**
 * Score summary for a workflow run
 */
export interface ScoreSummary {
  /** Hook density score */
  hook_density?: number;
  /** Singability score */
  singability?: number;
  /** Rhyme tightness score */
  rhyme_tightness?: number;
  /** Section completeness score */
  section_completeness?: number;
  /** Profanity score */
  profanity_score?: number;
  /** Total composite score */
  total?: number;
}

/**
 * Artifact map for workflow outputs
 */
export interface ArtifactMap {
  style?: Style;
  lyrics?: Lyrics;
  producerNotes?: ProducerNotes;
  composedPrompt?: ComposedPrompt;
}

/**
 * Workflow filters
 */
export interface WorkflowsFilters {
  status?: WorkflowRunStatus;
  songId?: UUID;
}

/**
 * Workflow sorting
 */
export interface WorkflowsSorting {
  field: 'startedAt' | 'completedAt';
  direction: 'asc' | 'desc';
}

/**
 * Workflow pagination
 */
export interface WorkflowsPagination {
  page: number;
  limit: number;
  total: number;
}

/**
 * List state for workflow runs
 */
export interface WorkflowsListState {
  /** Normalized workflow run items by ID */
  items: Map<string, WorkflowRun>;
  /** Ordered list of all run IDs */
  allIds: string[];
  /** Active filters */
  filters: WorkflowsFilters;
  /** Sorting configuration */
  sorting: WorkflowsSorting;
  /** Pagination state */
  pagination: WorkflowsPagination;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Progress tracking state for active workflow runs
 */
export interface WorkflowProgressState {
  /** Currently active/tracked run ID */
  activeRunId: string | null;
  /** Node events keyed by run ID */
  nodeEvents: Map<string, WorkflowEvent[]>;
  /** Scores keyed by run ID */
  scores: Map<string, ScoreSummary>;
  /** Artifacts keyed by run ID */
  artifacts: Map<string, ArtifactMap>;
}

/**
 * Optimistic state for workflow operations
 */
export interface WorkflowOptimisticState {
  /** Run IDs with pending cancellation */
  cancelledRunIds: Set<string>;
  /** Map of run ID to node ID for retrying nodes */
  retryingNodes: Map<string, string>;
}

/**
 * Actions for managing workflows
 */
export interface WorkflowsActions {
  // Query sync
  setRuns: (runs: WorkflowRun[]) => void;
  setRunDetails: (runId: string, details: Partial<WorkflowRun>) => void;
  setNodeEvent: (runId: string, event: WorkflowEvent) => void;
  setScores: (runId: string, scores: ScoreSummary) => void;
  setArtifacts: (runId: string, artifacts: ArtifactMap) => void;

  // Filters & Sorting
  setWorkflowFilters: (filters: Partial<WorkflowsFilters>) => void;
  setWorkflowSorting: (field: WorkflowsSorting['field'], direction?: WorkflowsSorting['direction']) => void;

  // Progress tracking
  trackRunProgress: (runId: string, progress: number, currentNode: string) => void;
  trackNodeEvent: (runId: string, event: WorkflowEvent) => void;
  clearRunDetails: (runId: string) => void;

  // Optimistic operations
  optimisticCancel: (runId: string) => void;
  commitCancel: (runId: string) => void;
  rollbackCancel: (runId: string) => void;
  optimisticRetry: (runId: string, nodeId: string) => void;
  commitRetry: (runId: string, nodeId: string) => void;

  // Cache control
  invalidateRuns: () => void;
  invalidateRunDetails: (runId: string) => void;
  clear: () => void;
}

/**
 * Combined workflows store type
 */
export type WorkflowsStore = WorkflowsListState & WorkflowProgressState & WorkflowOptimisticState & WorkflowsActions;

// ============================================================================
// Entities Store Types
// ============================================================================

/**
 * Generic entity cache structure
 */
export interface EntityCache<T> {
  /** Normalized items by ID */
  items: Map<string, T>;
  /** Ordered list of all IDs */
  allIds: string[];
  /** Cache metadata */
  metadata: {
    /** Last update timestamp */
    lastUpdated: number;
    /** Cache version for invalidation */
    version: string;
  };
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Entity type enumeration
 */
export type EntityType = 'style' | 'lyrics' | 'persona' | 'producerNotes' | 'source';

/**
 * Entity type to entity mapping
 */
export interface EntityTypeMap {
  style: Style;
  lyrics: Lyrics;
  persona: Persona;
  producerNotes: ProducerNotes;
  source: Source;
}

/**
 * Recent entity access tracking
 */
export interface RecentEntities {
  styleIds: string[];
  lyricsIds: string[];
  personaIds: string[];
}

/**
 * State for all entity caches
 */
export interface EntitiesState {
  /** Style entities cache */
  styles: EntityCache<Style>;
  /** Lyrics entities cache */
  lyrics: EntityCache<Lyrics>;
  /** Persona entities cache */
  personas: EntityCache<Persona>;
  /** Producer notes entities cache */
  producerNotes: EntityCache<ProducerNotes>;
  /** Source entities cache */
  sources: EntityCache<Source>;

  // Selection state
  /** Currently selected style ID */
  selectedStyleId: string | null;
  /** Currently selected lyrics ID */
  selectedLyricsId: string | null;
  /** Currently selected persona ID */
  selectedPersonaId: string | null;

  // Recent access tracking
  /** Recently accessed entity IDs */
  recentEntities: RecentEntities;
}

/**
 * Actions for managing entity caches
 */
export interface EntitiesActions {
  // Style operations
  setStyles: (styles: Style[]) => void;
  addStyle: (style: Style) => void;
  updateStyle: (id: string, updates: Partial<Style>) => void;
  removeStyle: (id: string) => void;
  selectStyle: (id: string | null) => void;

  // Lyrics operations
  setLyrics: (items: Lyrics[]) => void;
  addLyrics: (lyrics: Lyrics) => void;
  updateLyrics: (id: string, updates: Partial<Lyrics>) => void;
  removeLyrics: (id: string) => void;
  selectLyrics: (id: string | null) => void;

  // Persona operations
  setPersonas: (personas: Persona[]) => void;
  addPersona: (persona: Persona) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  removePersona: (id: string) => void;
  selectPersona: (id: string | null) => void;

  // Producer notes operations
  setProducerNotes: (notes: ProducerNotes[]) => void;
  addProducerNotes: (notes: ProducerNotes) => void;
  updateProducerNotes: (id: string, updates: Partial<ProducerNotes>) => void;
  removeProducerNotes: (id: string) => void;

  // Source operations
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  updateSource: (id: string, updates: Partial<Source>) => void;
  removeSource: (id: string) => void;

  // Generic operations
  setEntityCache: <K extends EntityType>(
    type: K,
    items: EntityTypeMap[K][]
  ) => void;
  invalidateEntityType: (type: EntityType) => void;
  invalidateAll: () => void;
  clearCache: () => void;

  // Recent access
  recordEntityAccess: (type: EntityType, id: string) => void;
  getRecentEntities: <K extends EntityType>(
    type: K,
    limit?: number
  ) => EntityTypeMap[K][];
}

/**
 * Combined entities store type
 */
export type EntitiesStore = EntitiesState & EntitiesActions;
