# MeatyMusic AMCS API Types - Changelog

## [1.0.0] - 2025-11-13 - Phase 5 Wave 1G

### Added

**Complete TypeScript type generation for AMCS API contracts**

Generated comprehensive TypeScript types matching all backend FastAPI schemas:

#### Entity Types (`entities.ts`)
- **Song**: Core song entity with SDS integration
  - `SongBase`, `SongCreate`, `SongUpdate`, `Song`
  - `SongStatus` enum (draft, validated, rendering, rendered, failed)

- **Style**: Musical identity specification
  - `StyleBase`, `StyleCreate`, `StyleUpdate`, `Style`
  - BPM ranges, energy levels (1-10), instrumentation (max 3)
  - Positive/negative tags for conflict detection

- **Lyrics**: Textual content with structural constraints
  - `LyricsBase`, `LyricsCreate`, `LyricsUpdate`, `Lyrics`
  - `POV` enum (first-person, second-person, third-person)
  - `Tense` enum (past, present, future, mixed)
  - `HookStrategy` enum (chant, lyrical, melodic, call-and-response)

- **Persona**: Artist/band profiles
  - `PersonaBase`, `PersonaCreate`, `PersonaUpdate`, `Persona`
  - `PersonaKind` enum (artist, band)
  - `PersonaPolicy` (public_release, disallow_named_style_of)

- **ProducerNotes**: Production and arrangement specifications
  - `ProducerNotesBase`, `ProducerNotesCreate`, `ProducerNotesUpdate`, `ProducerNotes`
  - `SectionMeta`, `MixConfig` (LUFS, space, stereo width)

- **Blueprint**: Genre-specific algorithmic templates
  - `BlueprintBase`, `BlueprintCreate`, `BlueprintUpdate`, `Blueprint`
  - `BlueprintRules` (tempo windows, required sections, lexicons)
  - `EvalRubric` (weights, thresholds for validation)

- **Source**: External data source configurations
  - `SourceBase`, `SourceCreate`, `SourceUpdate`, `Source`
  - `SourceKind` enum (file, web, api)
  - MCP server integration fields

- **ComposedPrompt**: Final render-ready prompts
  - `ComposedPromptBase`, `ComposedPromptCreate`, `ComposedPromptUpdate`, `ComposedPrompt`
  - `ValidationStatus` enum (pending, passed, failed)
  - `ComposedPromptMeta` (model limits, section tags)

- **Common Types**:
  - `ErrorResponse` - Standard error envelope
  - `PageInfo` - Cursor pagination metadata
  - `PaginatedResponse<T>` - Generic paginated list
  - `ISODateTime`, `UUID` - Type aliases

#### Workflow Types (`workflows.ts`)
- **WorkflowRun**: Workflow execution tracking
  - `WorkflowRunBase`, `WorkflowRunCreate`, `WorkflowRunUpdate`, `WorkflowRun`
  - `WorkflowRunStatus` enum (running, completed, failed, cancelled)
  - `WorkflowNode` enum (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, RENDER, REVIEW)

- **Execution Types**:
  - `WorkflowExecutionRequest`, `WorkflowExecutionResponse`
  - `WorkflowProgress` - Real-time progress tracking
  - `NodeExecutionResult` - Individual node results
  - `ValidationScores` - Rubric scoring details
  - `FixIteration` - Auto-fix iteration tracking
  - `WorkflowSummary` - Complete execution summary

- **Request Types**:
  - `NodeOutputUpdate` - Update node outputs
  - `StatusUpdateRequest` - Update run status

#### Event Types (`events.ts`)
- **Base Event Structure**:
  - `WorkflowEvent` - Base event envelope
  - `EventPhase` type (start, end, fail, info)

- **Run-Level Events**:
  - `RunStartedEvent`, `RunCompletedEvent`, `RunFailedEvent`

- **Node-Level Events**:
  - `NodeStartedEvent`, `NodeCompletedEvent`, `NodeFailedEvent`, `NodeInfoEvent`

- **Specialized Events**:
  - `ValidationEvent` - Detailed validation scores
  - `FixEvent` - Auto-fix iteration details
  - `RenderEvent` - Render job tracking

- **WebSocket Support**:
  - `EventHandler<T>` - Type-safe event handler
  - `WebSocketState` enum (connecting, connected, disconnected, error)
  - `WorkflowSubscription` - Subscription state tracking

#### Documentation
- **README.md**: Comprehensive usage guide
  - Type source documentation
  - Usage examples (API client, React Query, Zustand, WebSocket)
  - Type conventions and naming patterns
  - Validation documentation
  - Maintenance guidelines

- **CHANGELOG.md**: Version history and changes

### Changed
- Updated `apps/web/src/types/api.ts` to re-export from new `/api` directory
- Fixed error handler to use correct backend ErrorResponse structure

### Technical Details

**Source Mapping**:
- Backend Pydantic schemas: `services/api/app/schemas/*.py`
- JSON schemas: `/schemas/*.schema.json`
- Event system: `services/api/app/workflows/events.py`

**Type Generation Approach**:
- Manual generation from backend schemas (no codegen yet)
- Strict adherence to backend field names and types
- TypeScript enums match Python enums exactly
- All validation constraints documented in JSDoc

**Type Safety Features**:
- Generic `PaginatedResponse<T>` for type-safe pagination
- Discriminated unions for event types
- Strict enum typing matching backend
- Required vs optional fields match backend schemas
- Database fields (id, tenant_id, owner_id, timestamps) on all response types

**Future Improvements**:
- Consider automated type generation (openapi-typescript, pydantic-to-typescript)
- Add runtime validation with Zod or similar
- Generate API client with type-safe methods
- Add type tests to catch schema drift
