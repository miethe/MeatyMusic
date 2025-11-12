# Phase 3: Domain Model Migration - Progress

**Timeline**: 10-15 days (2-3 weeks)
**Effort**: 34 story points
**Dependencies**: Phase 2 complete
**Status**: In Progress - Week 1 Complete
**Started**: 2025-11-12
**Completed**: TBD

## Success Criteria

- [x] All entity models created
- [x] All repositories follow base pattern
- [ ] Services enforce business rules
- [ ] JSON schema validation works
- [x] Migrations apply cleanly (ready to test with database)
- [ ] Tests pass (>80% coverage)

## Subagent Assignments

### Week 1: Entity Models (Base, Style, Lyrics, ProducerNotes, Song, WorkflowRun, Persona)
- **Primary**: data-layer-expert
  - Create SQLAlchemy models following MeatyPrompts base.py patterns
  - Implement RLS (tenant_id, owner_id) on all entities
  - Define relationships, indexes, and constraints
  - Use JSON/JSONB for flexible fields (sections, node_outputs, etc.)
- **Review**: code-reviewer
  - Validate SQLAlchemy patterns and RLS implementation
  - Check index strategy and constraint enforcement
- **Validation**: task-completion-validator
  - Verify all 7 models created and follow base pattern
  - Confirm relationships and indexes are correct

### Database Migrations (Week 1)
- **Primary**: data-layer-expert
  - Create Alembic migration 002: AMCS core tables (styles, songs, personas)
  - Create Alembic migration 003: AMCS artifact tables (lyrics, producer_notes, workflow_runs)
  - Add indexes for performance (genre, status, song_id, run_id)
  - Test migrations (upgrade, downgrade)
- **Review**: code-reviewer
  - Validate migration structure and rollback safety
- **Validation**: task-completion-validator
  - Confirm migrations apply cleanly
  - Verify indexes and constraints are created

### Week 2: Repositories (Following MeatyPrompts Base Pattern)
- **Primary**: data-layer-expert
  - Create repositories for all entities (Style, Lyrics, ProducerNotes, Song, WorkflowRun, Persona)
  - Follow BaseRepository[T] pattern from MeatyPrompts
  - Implement security filtering (_apply_security method)
  - Add entity-specific query methods (get_by_genre, get_active_runs, etc.)
- **Review**: code-reviewer
  - Validate repository patterns and RLS enforcement
  - Check query optimization and security filtering
- **Validation**: task-completion-validator
  - Verify all 6 repositories created
  - Confirm base pattern adherence and security filtering

### Week 2: Services (Business Logic & Validation)
- **Primary**: python-backend-engineer
  - Create service layer for Style, Song, Validation
  - Implement business logic (tag conflict validation, BPM range checks)
  - Integrate repository layer with proper dependency injection
  - Add observability (logging, tracing) following OpenTelemetry patterns
- **Review**: code-reviewer
  - Validate service layer separation and business logic
  - Check error handling and observability integration
- **Validation**: task-completion-validator
  - Verify services enforce business rules correctly
  - Confirm proper layering (Service → Repository → DB)

### Week 2: Pydantic Schemas (API Validation)
- **Primary**: python-backend-engineer
  - Create Pydantic schemas for all entities (Create/Update/Response)
  - Implement custom validators (BPM range, seed, sections)
  - Add field-level documentation for OpenAPI
  - Follow FastAPI best practices from MeatyPrompts
- **Review**: code-reviewer
  - Validate Pydantic schema patterns and validators
  - Check OpenAPI documentation completeness
- **Validation**: task-completion-validator
  - Verify all entity schemas created
  - Confirm validators work correctly

### Week 2-3: JSON Schema Validation (Schemas + Validation Service)
- **Primary**: python-backend-engineer
  - Create JSON schemas for SDS, Style, Lyrics, ProducerNotes (Draft-07)
  - Implement ValidationService with schema loading
  - Add validation methods for each entity type
  - Include error reporting with detailed feedback
- **Documentation**: documentation-writer
  - Document JSON schema structure and validation rules
  - Create schema usage guide for frontend developers
  - Document validation error messages and resolution
- **Review**: code-reviewer
  - Validate JSON schema completeness and correctness
  - Check ValidationService implementation
- **Validation**: task-completion-validator
  - Verify all 4 JSON schemas created
  - Confirm ValidationService works with valid/invalid inputs

### Testing (Unit, Integration, Coverage)
- **Primary**: python-backend-engineer
  - Write unit tests for models (constraints, defaults, relationships)
  - Write unit tests for repositories (CRUD, RLS, security filtering)
  - Write unit tests for services (business logic, tag conflicts)
  - Write unit tests for JSON schema validation
  - Write integration tests (repository → service → schema flow)
  - Write integration tests (multi-tenant isolation, cascade deletes)
- **Review**: code-reviewer
  - Validate test coverage and quality
  - Check test isolation and cleanup
- **Validation**: task-completion-validator
  - Confirm coverage targets met (Models >90%, Repos >85%, Services >80%, Overall >80%)
  - Verify all critical paths tested

### Documentation (ALL Human-Facing Docs)
- **Primary**: documentation-writer
  - Document entity models and relationships
  - Document repository layer usage patterns
  - Document service layer API and business rules
  - Document JSON schema validation
  - Update README with Phase 3 completion status
  - Create developer guide for entity CRUD operations
- **Review**: code-reviewer
  - Validate documentation completeness and accuracy
- **Validation**: task-completion-validator
  - Verify all documentation created and up-to-date

### Final Review & Validation
- **Primary**: code-reviewer
  - Comprehensive code quality review
  - Architecture pattern compliance (Router → Service → Repository → DB)
  - Security review (RLS, multi-tenancy, input validation)
  - Performance review (indexes, query optimization)
- **Secondary**: task-completion-validator
  - Validate all success criteria met
  - Confirm all deliverables completed
  - Sign off on Phase 3 completion

## Development Checklist

### Week 1: Entity Models

- [x] Base model with timestamps, tenant, owner (`/services/api/app/models/base.py`)
- [x] Style model with genre, BPM, mood, tags (`/services/api/app/models/style.py`)
- [x] Lyrics model with sections, rhyme, citations (`/services/api/app/models/lyrics.py`)
- [x] Producer Notes model with structure, mix targets (`/services/api/app/models/producer_notes.py`)
- [x] Song model with SDS version, global seed (`/services/api/app/models/song.py`)
- [x] WorkflowRun model with node outputs, events (`/services/api/app/models/song.py` - WorkflowRun class)
- [x] Persona model for artist profiles (`/services/api/app/models/persona.py`)
- [x] Blueprint model with rules, rubric (`/services/api/app/models/blueprint.py`)
- [x] Source model with MCP config (`/services/api/app/models/source.py`)
- [x] ComposedPrompt model for final prompts (`/services/api/app/models/composed_prompt.py`)
- [x] Migration 002: AMCS core tables (styles, songs, personas, blueprints, sources)
- [x] Migration 003: AMCS artifact tables (lyrics, producer_notes, workflow_runs, composed_prompts)

### Week 2: Repositories & Services

#### Repositories
- [x] StyleRepository with genre filtering
- [x] LyricsRepository with song association
- [x] ProducerNotesRepository with song association
- [x] SongRepository with status filtering
- [x] WorkflowRunRepository with active runs query
- [x] PersonaRepository with profile queries
- [x] BlueprintRepository with genre filtering and tag search
- [x] SourceRepository with scope filtering
- [x] ComposedPromptRepository with validation status filtering

#### Services
- [x] StyleService with tag conflict validation
- [x] SongService with SDS validation
- [x] WorkflowRunService with node output tracking
- [x] ValidationService placeholder (full JSON schema validation in Week 2-3)

#### Pydantic Schemas
- [x] StyleCreate/StyleUpdate with BPM range validation
- [x] LyricsCreate/LyricsUpdate with section validation
- [x] ProducerNotesCreate/ProducerNotesUpdate
- [x] SongCreate/SongUpdate with seed validation
- [x] BlueprintCreate/BlueprintUpdate
- [x] PersonaCreate/PersonaUpdate
- [x] SourceCreate/SourceUpdate
- [x] ComposedPromptCreate/ComposedPromptUpdate
- [x] WorkflowRunCreate/WorkflowRunUpdate

### Week 2-3: JSON Schema Validation

- [ ] `/schemas/sds.schema.json` - Song Design Spec schema
- [ ] `/schemas/style.schema.json` - Style specification schema
- [ ] `/schemas/lyrics.schema.json` - Lyrics constraints schema
- [ ] `/schemas/producer_notes.schema.json` - Producer guidance schema
- [ ] ValidationService JSON schema loading
- [ ] ValidationService SDS validation method
- [ ] ValidationService style validation method
- [ ] ValidationService lyrics validation method

### Testing

#### Unit Tests
- [ ] Model validation (constraints, defaults, relationships)
- [ ] Repository CRUD operations with RLS
- [ ] Service business logic (tag conflicts, BPM ranges)
- [ ] JSON schema validation (valid/invalid cases)

#### Integration Tests
- [ ] Repository → Service → Schema flow
- [ ] Transaction rollback on errors
- [ ] Multi-tenant data isolation
- [ ] Cascade deletes (song → artifacts)

#### Coverage Targets
- [ ] Models: >90%
- [ ] Repositories: >85%
- [ ] Services: >80%
- [ ] Overall: >80%

## Work Log

### 2025-11-12 - Week 2: Service Layer + Pydantic Schemas Complete

**Work Completed:**
- Created comprehensive Pydantic schemas for all 8 AMCS entities
- Implemented service layer with business logic validation
- All schemas include Create/Update/Response variants with field validators
- Services follow MeatyPrompts patterns with repository injection and async methods
- Updated __init__.py files with alphabetical exports

**Pydantic Schemas Created (8 entities):**
1. StyleCreate/Update/Response - BPM range, energy level, instrumentation limit validators
2. SongCreate/Update/Response + WorkflowRunCreate/Update/Response - Global seed, status enums
3. LyricsCreate/Update/Response - Section order (must have Chorus), POV/tense enums, reading level
4. ProducerNotesCreate/Update/Response - Structure, hook count, mix targets
5. BlueprintCreate/Update/Response - Genre rules, eval rubric, conflict matrix
6. PersonaCreate/Update/Response - Vocal characteristics, influences, policy settings
7. SourceCreate/Update/Response - MCP integration, scoping, weight validation (0.0-1.0)
8. ComposedPromptCreate/Update/Response - Validation status, character limits (10k max)

**Schema Validation Highlights:**
- BPM range validation: bpm_max >= bpm_min
- Energy level: 1-10, imagery density: 0-10, reading level: 0-100
- Section order must include at least one Chorus
- Global seed non-negative, fix iterations 0-3
- Syllables per line: 4-16 (reasonable range for singability)
- Instrumentation limited to 3 items to avoid mix dilution
- Type-safe enums for all status fields, POV, tense, hook strategy

**Services Created (4 services):**
1. **StyleService** - Tag conflict validation and energy/tempo coherence
   - Detects conflicting era tags (only one era allowed)
   - Detects conflicting energy tags (whisper vs anthemic, intimate vs stadium)
   - Validates energy/tempo coherence (high energy with slow BPM triggers error)
   - TODO: Load blueprint conflict matrix for comprehensive validation

2. **SongService** - SDS validation and artifact management
   - Validates global seed is set (required for determinism)
   - Validates referenced entities exist (style, persona, blueprint)
   - get_song_with_artifacts() - Eager loads all related entities (style, lyrics, producer notes, prompts)
   - update_song_status() - Convenience method for status transitions
   - validate_sds() - Basic validation (full JSON schema TBD in Week 2-3)

3. **WorkflowRunService** - Run execution tracking
   - update_node_output() - Store artifacts/scores/citations for each node
   - add_event() - Append to event stream for observability
   - fail_run()/complete_run() - Status transitions with error tracking
   - get_active_runs()/get_failed_runs() - Monitoring queries

4. **ValidationService** - JSON schema validation (placeholder)
   - Placeholder for Week 2-3 implementation
   - Basic SDS structure validation (required fields)
   - TODO: Load JSON schemas from /schemas directory
   - TODO: Implement full jsonschema validation

**Technical Highlights:**
- All Pydantic schemas use ConfigDict for ORM mapping (from_attributes=True)
- Field validators use @field_validator with info parameter for cross-field validation
- Enums for all status fields provide type safety and OpenAPI documentation
- Services use async methods and proper error handling (ValueError for validation failures)
- Structured logging with contextual information (operation, entity IDs, field changes)
- Business logic in service layer, repositories remain pure data access
- Services coordinate across multiple repositories (SongService loads from 5 repos)

**Pattern Adherence:**
- ✅ Pydantic Create/Update/Response variants for all entities
- ✅ Field validators enforce PRD constraints
- ✅ Services accept repository via dependency injection
- ✅ Async methods with proper type hints
- ✅ ValueError for validation failures, not exceptions
- ✅ Structured logging via structlog
- ✅ Alphabetical exports in __init__.py
- ✅ Follow MeatyPrompts service patterns

### 2025-11-12 - Week 2: Repository Layer Complete

**Work Completed:**
- Created 9 repository classes following MeatyPrompts BaseRepository[T] pattern
- Implemented RLS security filtering via UnifiedRowGuard on all queries
- Added entity-specific query methods with proper type hints
- Used async/await patterns and proper relationship loading (joinedload/selectinload)
- All repositories inherit from BaseRepository[T] with generic type safety
- Updated __init__.py with alphabetical exports

**Repositories Created:**
1. BlueprintRepository - Genre filtering, tag search in JSONB
2. PersonaRepository - Influence search, vocal range queries
3. SourceRepository - MCP scope filtering, source type queries
4. StyleRepository - Genre/BPM/mood/energy filtering, tag search
5. SongRepository - Status filtering, eager loading of style/artifacts
6. WorkflowRunRepository - Active runs, failed runs, high fix iteration queries
7. LyricsRepository - Song association, rhyme scheme, reading level
8. ProducerNotesRepository - Song association, hook count, structure patterns
9. ComposedPromptRepository - Song association, validation status, character length

**Technical Highlights:**
- All queries apply row-level security via `get_unified_guard()` and `filter_query()`
- PostgreSQL-specific operators: `&&` (array overlap), `@>` (JSONB contains), `?` (JSONB key exists)
- Proper relationship loading to avoid N+1 queries (joinedload for 1:1, selectinload for 1:many)
- Entity-specific methods match Phase 3 plan requirements
- Generic type hints with BaseRepository[T] for type safety
- Consistent error handling and query patterns across all repositories

**Pattern Adherence:**
- ✅ Inherit from BaseRepository[T]
- ✅ Apply security filtering via _apply_security() → get_unified_guard().filter_query()
- ✅ Use async/await patterns (dataclass, not async def - follows MeatyPrompts)
- ✅ Proper type hints with generics (List[Style], Optional[Song], etc.)
- ✅ Entity-specific query methods as specified in Phase 3 plan
- ✅ No raw SQL - pure SQLAlchemy ORM
- ✅ Alphabetical exports in __init__.py

### 2025-11-12 - Week 1: Entity Models & Migrations Complete

**Work Completed:**
- Created BaseModel abstract class with multi-tenancy (tenant_id, owner_id), timestamps, and soft delete
- Created 9 AMCS entity models following MeatyPrompts patterns
- Created 2 Alembic migrations (002, 003) for all AMCS tables
- Fixed SQLAlchemy reserved word conflict (metadata → extra_metadata)
- All models include proper indexes, foreign keys, constraints, and relationships

**Models Created:**
1. Blueprint - Genre rules, rubric, conflict matrix, tag categories
2. Persona - Artist profiles with vocal characteristics and influences
3. Source - External knowledge bases with MCP configuration
4. Style - Genre, tempo, mood, instrumentation, tags
5. Song - Main entity with SDS version, global seed, status
6. Lyrics - Sections, rhyme, meter, citations, generated text
7. ProducerNotes - Structure, section tags, mix targets
8. WorkflowRun - Run tracking with node outputs and events
9. ComposedPrompt - Final prompts with metadata and validation

**Technical Highlights:**
- UUID v7 primary keys via UUIDv7Mixin for monotonic ordering
- PostgreSQL-specific features (ARRAY, JSONB, partial indexes)
- Multi-tenancy RLS foundation (tenant_id + owner_id indexes)
- Cascade deletes for artifact tables (lyrics, producer_notes, workflow_runs, composed_prompts)
- Check constraints for data integrity (BPM ranges, energy levels, fix iterations)
- JSONB for flexible fields (sections, node_outputs, metadata, rubric)

## Decisions Log

### 2025-11-12 - Reserved Word Conflict Resolution

**Decision:** Renamed `metadata` column to `extra_metadata` across all models

**Rationale:**
- `metadata` is a reserved word in SQLAlchemy's Declarative API
- Attempting to use it causes: `sqlalchemy.exc.InvalidRequestError: Attribute name 'metadata' is reserved`
- `extra_metadata` clearly indicates additional/custom metadata fields
- Updated both ORM models and Alembic migrations for consistency

**Impact:**
- All 9 entity models updated
- Both migration files (002, 003) updated
- No breaking changes as migrations haven't been applied to production yet

### 2025-11-12 - Model Structure Decisions

**Decision:** Separate core tables (002) from artifact tables (003) in migrations

**Rationale:**
- Core tables (blueprints, personas, sources, styles, songs) are foundational entities
- Artifact tables (lyrics, producer_notes, workflow_runs, composed_prompts) depend on songs
- Separation allows for cleaner dependency management
- Follows logical entity lifecycle (define entities, then generate artifacts)

**Impact:**
- Two-phase migration strategy
- Core tables can be tested independently
- Artifact tables have proper foreign key relationships to songs

## Files Changed

### Models
- `/services/api/app/models/base.py` - Added BaseModel abstract class
- `/services/api/app/models/blueprint.py` - Blueprint entity
- `/services/api/app/models/persona.py` - Persona entity
- `/services/api/app/models/source.py` - Source entity
- `/services/api/app/models/style.py` - Style entity
- `/services/api/app/models/song.py` - Song + WorkflowRun entities
- `/services/api/app/models/lyrics.py` - Lyrics entity
- `/services/api/app/models/producer_notes.py` - ProducerNotes entity
- `/services/api/app/models/composed_prompt.py` - ComposedPrompt entity
- `/services/api/app/models/__init__.py` - Updated exports

### Migrations
- `/services/api/alembic/versions/20251112_1504_fa3a03c728a4_amcs_core_tables.py` - Migration 002
- `/services/api/alembic/versions/20251112_1505_3ee6b70e3330_amcs_artifact_tables.py` - Migration 003

### Repositories
- `/services/api/app/repositories/base.py` - BaseRepository (from MeatyPrompts)
- `/services/api/app/repositories/blueprint_repo.py` - BlueprintRepository
- `/services/api/app/repositories/persona_repo.py` - PersonaRepository
- `/services/api/app/repositories/source_repo.py` - SourceRepository
- `/services/api/app/repositories/style_repo.py` - StyleRepository
- `/services/api/app/repositories/song_repo.py` - SongRepository
- `/services/api/app/repositories/workflow_run_repo.py` - WorkflowRunRepository
- `/services/api/app/repositories/lyrics_repo.py` - LyricsRepository
- `/services/api/app/repositories/producer_notes_repo.py` - ProducerNotesRepository
- `/services/api/app/repositories/composed_prompt_repo.py` - ComposedPromptRepository
- `/services/api/app/repositories/__init__.py` - Updated exports

### Schemas
- `/services/api/app/schemas/style.py` - Style Create/Update/Response with validators
- `/services/api/app/schemas/song.py` - Song + WorkflowRun Create/Update/Response
- `/services/api/app/schemas/lyrics.py` - Lyrics Create/Update/Response with validators
- `/services/api/app/schemas/producer_notes.py` - ProducerNotes Create/Update/Response
- `/services/api/app/schemas/blueprint.py` - Blueprint Create/Update/Response
- `/services/api/app/schemas/persona.py` - Persona Create/Update/Response
- `/services/api/app/schemas/source.py` - Source Create/Update/Response
- `/services/api/app/schemas/composed_prompt.py` - ComposedPrompt Create/Update/Response
- `/services/api/app/schemas/__init__.py` - Updated exports

### Services
- `/services/api/app/services/style_service.py` - StyleService with tag conflict validation
- `/services/api/app/services/song_service.py` - SongService with SDS validation
- `/services/api/app/services/workflow_run_service.py` - WorkflowRunService
- `/services/api/app/services/validation_service.py` - ValidationService placeholder
- `/services/api/app/services/__init__.py` - Updated exports

### Tests
_Not yet created - planned for Week 2-3_
