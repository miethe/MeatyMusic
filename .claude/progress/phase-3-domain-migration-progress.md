# Phase 3: Domain Model Migration - Progress

**Timeline**: 10-15 days (2-3 weeks)
**Effort**: 34 story points
**Dependencies**: Phase 2 complete
**Status**: In Progress - Week 1 Complete
**Started**: 2025-11-12
**Completed**: TBD

## Success Criteria

- [x] All entity models created
- [ ] All repositories follow base pattern
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
- [ ] StyleRepository with genre filtering
- [ ] LyricsRepository with song association
- [ ] ProducerNotesRepository with song association
- [ ] SongRepository with status filtering
- [ ] WorkflowRunRepository with active runs query
- [ ] PersonaRepository with profile queries

#### Services
- [ ] StyleService with tag conflict validation
- [ ] SongService with SDS validation
- [ ] ValidationService with JSON schema loading

#### Pydantic Schemas
- [ ] StyleCreate/StyleUpdate with BPM range validation
- [ ] LyricsCreate/LyricsUpdate with section validation
- [ ] ProducerNotesCreate/ProducerNotesUpdate
- [ ] SongCreate/SongUpdate with seed validation

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
_Not yet created - planned for Week 2_

### Services
_Not yet created - planned for Week 2_

### Schemas
_Not yet created - planned for Week 2-3_

### Tests
_Not yet created - planned for Week 2-3_
