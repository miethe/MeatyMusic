/**
 * MeatyMusic AMCS API Types
 * Central export for all API-related TypeScript types
 *
 * This module provides TypeScript types matching the backend FastAPI schemas
 * for type-safe API communication and state management.
 *
 * Generated from:
 * - Backend: services/api/app/schemas/
 * - JSON Schemas: /schemas/
 * - Event System: services/api/app/workflows/events.py
 */

/**
 * Entity Types
 * Core AMCS entities (Song, Style, Lyrics, etc.)
 */
export type {
  // Common types
  ISODateTime,
  UUID,
  ErrorResponse,
  PageInfo,
  PaginatedResponse,
  // Song types
  SongBase,
  SongCreate,
  SongUpdate,
  Song,
  // Style types
  StyleBase,
  StyleCreate,
  StyleUpdate,
  Style,
  // Lyrics types
  LyricsBase,
  LyricsCreate,
  LyricsUpdate,
  Lyrics,
  // Persona types
  PersonaBase,
  PersonaCreate,
  PersonaUpdate,
  Persona,
  PersonaPolicy,
  // ProducerNotes types
  ProducerNotesBase,
  ProducerNotesCreate,
  ProducerNotesUpdate,
  ProducerNotes,
  SectionMeta,
  MixConfig,
  // Blueprint types
  BlueprintBase,
  BlueprintCreate,
  BlueprintUpdate,
  Blueprint,
  BlueprintRules,
  RubricWeights,
  RubricThresholds,
  EvalRubric,
  // Source types
  SourceBase,
  SourceCreate,
  SourceUpdate,
  Source,
  // ComposedPrompt types
  ComposedPromptBase,
  ComposedPromptCreate,
  ComposedPromptUpdate,
  ComposedPrompt,
  ComposedPromptMeta,
} from './entities';

export {
  // Enums
  SongStatus,
  POV,
  Tense,
  HookStrategy,
  PersonaKind,
  SourceKind,
  ValidationStatus,
} from './entities';

/**
 * Workflow Types
 * Workflow execution and orchestration
 */
export type {
  // Workflow run types
  WorkflowRunBase,
  WorkflowRunCreate,
  WorkflowRunUpdate,
  WorkflowRun,
  // Request/response types
  NodeOutputUpdate,
  StatusUpdateRequest,
  WorkflowExecutionRequest,
  WorkflowExecutionResponse,
  // Progress tracking
  WorkflowProgress,
  NodeExecutionResult,
  ValidationScores,
  FixIteration,
  WorkflowSummary,
} from './workflows';

export {
  // Enums
  WorkflowRunStatus,
  WorkflowNode,
} from './workflows';

/**
 * Event Types
 * WebSocket event streaming
 */
export type {
  // Base event types
  EventPhase,
  WorkflowEvent,
  // Specific event types
  RunStartedEvent,
  RunCompletedEvent,
  RunFailedEvent,
  NodeStartedEvent,
  NodeCompletedEvent,
  NodeFailedEvent,
  NodeInfoEvent,
  ValidationEvent,
  FixEvent,
  RenderEvent,
  // Union type
  WorkflowEventType,
  // Handler types
  EventHandler,
  WorkflowSubscription,
} from './events';

export {
  // Enums
  WebSocketState,
} from './events';

/**
 * Re-export all types as a namespace for convenience
 */
import * as Entities from './entities';
import * as Workflows from './workflows';
import * as Events from './events';

export { Entities, Workflows, Events };
