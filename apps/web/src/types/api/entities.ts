/**
 * MeatyMusic AMCS Entity Types
 * Generated from backend Pydantic schemas and JSON schemas
 *
 * All entity types for Song Design Spec (SDS) and related components.
 * Backend: services/api/app/schemas/
 * JSON Schemas: /schemas/
 */

/**
 * Common Types
 */

/** ISO8601 datetime string */
export type ISODateTime = string;

/** UUID v4 string */
export type UUID = string;

/**
 * Error response from API
 * Backend: app/schemas/common.py - ErrorResponse
 */
export interface ErrorResponse {
  error: string;
  detail?: string;
  field?: string;
}

/**
 * Pagination metadata for cursor-based pagination
 * Backend: app/schemas/common.py - PageInfo
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
 * Backend: app/schemas/common.py - PaginatedResponse
 */
export interface PaginatedResponse<T> {
  items: T[];
  page_info: PageInfo;
}

/**
 * Song Entity Types
 * Backend: app/schemas/song.py
 */

/** Song status enumeration */
export enum SongStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  RENDERING = 'rendering',
  RENDERED = 'rendered',
  FAILED = 'failed',
}

/** Song base fields */
export interface SongBase {
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
}

/** Song creation request */
export interface SongCreate extends SongBase {}

/** Song update request (all fields optional) */
export interface SongUpdate {
  title?: string;
  sds_version?: string;
  global_seed?: number;
  style_id?: UUID;
  persona_id?: UUID;
  blueprint_id?: UUID;
  status?: SongStatus;
  feature_flags?: Record<string, unknown>;
  render_config?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
}

/** Song response with database fields */
export interface Song extends SongBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Style Entity Types
 * Backend: app/schemas/style.py
 */

/** Style base fields */
export interface StyleBase {
  name: string;
  genre: string;
  sub_genres?: string[];
  bpm_min?: number;
  bpm_max?: number;
  key?: string;
  modulations?: string[];
  mood?: string[];
  energy_level?: number; // 1-10
  instrumentation?: string[]; // Max 3 items
  vocal_profile?: Record<string, unknown>;
  tags_positive?: string[];
  tags_negative?: string[];
  blueprint_id?: UUID;
  extra_metadata?: Record<string, unknown>;
}

/** Style creation request */
export interface StyleCreate extends StyleBase {}

/** Style update request (all fields optional) */
export interface StyleUpdate {
  name?: string;
  genre?: string;
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
}

/** Style response with database fields */
export interface Style extends StyleBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Lyrics Entity Types
 * Backend: app/schemas/lyrics.py
 */

/** Point of view enumeration */
export enum POV {
  FIRST_PERSON = 'first-person',
  SECOND_PERSON = 'second-person',
  THIRD_PERSON = 'third-person',
}

/** Verb tense enumeration */
export enum Tense {
  PAST = 'past',
  PRESENT = 'present',
  FUTURE = 'future',
  MIXED = 'mixed',
}

/** Hook strategy enumeration */
export enum HookStrategy {
  CHANT = 'chant',
  LYRICAL = 'lyrical',
  MELODIC = 'melodic',
  CALL_RESPONSE = 'call-and-response',
}

/** Lyrics base fields */
export interface LyricsBase {
  song_id: UUID;
  sections: Array<Record<string, unknown>>;
  section_order: string[];
  language?: string;
  pov?: POV;
  tense?: Tense;
  rhyme_scheme?: string;
  meter?: string;
  syllables_per_line?: number;
  hook_strategy?: HookStrategy;
  repetition_rules?: Record<string, unknown>;
  imagery_density?: number; // 0-10
  reading_level?: number; // 0-100
  themes?: string[];
  constraints?: Record<string, unknown>;
  explicit_allowed?: boolean;
  source_citations?: Array<Record<string, unknown>>;
  generated_text?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
}

/** Lyrics creation request */
export interface LyricsCreate extends LyricsBase {}

/** Lyrics update request (all fields optional) */
export interface LyricsUpdate {
  sections?: Array<Record<string, unknown>>;
  section_order?: string[];
  language?: string;
  pov?: POV;
  tense?: Tense;
  rhyme_scheme?: string;
  meter?: string;
  syllables_per_line?: number;
  hook_strategy?: HookStrategy;
  repetition_rules?: Record<string, unknown>;
  imagery_density?: number;
  reading_level?: number;
  themes?: string[];
  constraints?: Record<string, unknown>;
  explicit_allowed?: boolean;
  source_citations?: Array<Record<string, unknown>>;
  generated_text?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
}

/** Lyrics response with database fields */
export interface Lyrics extends LyricsBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Persona Entity Types
 * Backend: app/schemas/persona.py
 */

/** Persona kind enumeration */
export enum PersonaKind {
  ARTIST = 'artist',
  BAND = 'band',
}

/** Persona policy configuration */
export interface PersonaPolicy {
  public_release: boolean;
  disallow_named_style_of: boolean;
}

/** Persona base fields */
export interface PersonaBase {
  name: string;
  kind?: PersonaKind;
  bio?: string;
  voice?: string;
  vocal_range?: string;
  delivery?: string[];
  influences?: string[];
  style_defaults?: Record<string, unknown>;
  lyrics_defaults?: Record<string, unknown>;
  policy?: PersonaPolicy;
  extra_metadata?: Record<string, unknown>;
}

/** Persona creation request */
export interface PersonaCreate extends PersonaBase {}

/** Persona update request (all fields optional) */
export interface PersonaUpdate {
  name?: string;
  kind?: PersonaKind;
  bio?: string;
  voice?: string;
  vocal_range?: string;
  delivery?: string[];
  influences?: string[];
  style_defaults?: Record<string, unknown>;
  lyrics_defaults?: Record<string, unknown>;
  policy?: PersonaPolicy;
  extra_metadata?: Record<string, unknown>;
}

/** Persona response with database fields */
export interface Persona extends PersonaBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * ProducerNotes Entity Types
 * Backend: app/schemas/producer_notes.py
 */

/** Section metadata for producer notes */
export interface SectionMeta {
  tags?: string[];
  target_duration_sec?: number;
}

/** Mix configuration */
export interface MixConfig {
  lufs?: number;
  space?: string;
  stereo_width?: 'narrow' | 'normal' | 'wide';
}

/** ProducerNotes base fields */
export interface ProducerNotesBase {
  song_id: UUID;
  structure: string;
  hooks: number;
  instrumentation?: string[];
  section_meta?: Record<string, SectionMeta>;
  mix?: MixConfig;
  extra_metadata?: Record<string, unknown>;
}

/** ProducerNotes creation request */
export interface ProducerNotesCreate extends ProducerNotesBase {}

/** ProducerNotes update request (all fields optional) */
export interface ProducerNotesUpdate {
  structure?: string;
  hooks?: number;
  instrumentation?: string[];
  section_meta?: Record<string, SectionMeta>;
  mix?: MixConfig;
  extra_metadata?: Record<string, unknown>;
}

/** ProducerNotes response with database fields */
export interface ProducerNotes extends ProducerNotesBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Blueprint Entity Types
 * Backend: app/schemas/blueprint.py
 */

/** Blueprint rules configuration */
export interface BlueprintRules {
  tempo_bpm?: [number, number];
  required_sections?: string[];
  banned_terms?: string[];
  lexicon_positive?: string[];
  lexicon_negative?: string[];
  section_lines?: Record<string, { min?: number; max?: number }>;
}

/** Blueprint evaluation rubric weights */
export interface RubricWeights {
  hook_density?: number;
  singability?: number;
  rhyme_tightness?: number;
  section_completeness?: number;
  profanity_score?: number;
}

/** Blueprint evaluation rubric thresholds */
export interface RubricThresholds {
  min_total?: number;
  max_profanity?: number;
}

/** Blueprint evaluation rubric */
export interface EvalRubric {
  weights?: RubricWeights;
  thresholds?: RubricThresholds;
}

/** Blueprint base fields */
export interface BlueprintBase {
  genre: string;
  version: string;
  rules?: BlueprintRules;
  eval_rubric?: EvalRubric;
  extra_metadata?: Record<string, unknown>;
}

/** Blueprint creation request */
export interface BlueprintCreate extends BlueprintBase {}

/** Blueprint update request (all fields optional) */
export interface BlueprintUpdate {
  genre?: string;
  version?: string;
  rules?: BlueprintRules;
  eval_rubric?: EvalRubric;
  extra_metadata?: Record<string, unknown>;
}

/** Blueprint response with database fields */
export interface Blueprint extends BlueprintBase {
  id: UUID;
  tenant_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Source Entity Types
 * Backend: app/schemas/source.py
 */

/** Source kind enumeration */
export enum SourceKind {
  FILE = 'file',
  WEB = 'web',
  API = 'api',
}

/** Source base fields */
export interface SourceBase {
  name: string;
  kind: SourceKind;
  config?: Record<string, unknown>;
  scopes?: string[];
  weight?: number; // 0-1
  allow?: string[];
  deny?: string[];
  provenance?: boolean;
  mcp_server_id: string;
  extra_metadata?: Record<string, unknown>;
}

/** Source creation request */
export interface SourceCreate extends SourceBase {}

/** Source update request (all fields optional) */
export interface SourceUpdate {
  name?: string;
  kind?: SourceKind;
  config?: Record<string, unknown>;
  scopes?: string[];
  weight?: number;
  allow?: string[];
  deny?: string[];
  provenance?: boolean;
  mcp_server_id?: string;
  extra_metadata?: Record<string, unknown>;
}

/** Source response with database fields */
export interface Source extends SourceBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * ComposedPrompt Entity Types
 * Backend: app/schemas/composed_prompt.py
 */

/** Validation status enumeration */
export enum ValidationStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
}

/** Composed prompt metadata */
export interface ComposedPromptMeta {
  title?: string;
  genre?: string;
  tempo_bpm?: number | [number, number];
  structure?: string;
  style_tags?: string[];
  negative_tags?: string[];
  section_tags?: Record<string, string[]>;
  model_limits?: {
    style_max?: number;
    prompt_max?: number;
  };
}

/** ComposedPrompt base fields */
export interface ComposedPromptBase {
  song_id: UUID;
  run_id: UUID;
  text: string;
  meta?: ComposedPromptMeta;
  validation_status?: ValidationStatus;
  validation_scores?: Record<string, number>;
  extra_metadata?: Record<string, unknown>;
}

/** ComposedPrompt creation request */
export interface ComposedPromptCreate extends ComposedPromptBase {}

/** ComposedPrompt update request (all fields optional) */
export interface ComposedPromptUpdate {
  text?: string;
  meta?: ComposedPromptMeta;
  validation_status?: ValidationStatus;
  validation_scores?: Record<string, number>;
  extra_metadata?: Record<string, unknown>;
}

/** ComposedPrompt response with database fields */
export interface ComposedPrompt extends ComposedPromptBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}
