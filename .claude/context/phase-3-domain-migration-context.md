# Phase 3: Domain Model Migration - Context

## Current State

Phase 3 implements AMCS domain entities (Style, Lyrics, Producer Notes, Song, WorkflowRun, Persona) with repositories, services, and JSON schema validation. This phase builds on Phase 2's infrastructure to create the core data layer for music composition workflows.

**Timeline**: 10-15 days, 34 story points
**Dependencies**: Phase 2 Infrastructure Preservation complete

## Phase Scope

Implement SQLAlchemy models for AMCS entities following established base patterns from Phase 2, create repository and service layers with security filtering and business logic validation, and establish JSON schema validation for all entity types. All models include tenant/owner isolation, deterministic seed propagation, and citation tracking.

## Key Decisions

_Technical decisions will be recorded here as they are made during implementation_

## Important Learnings

_Implementation patterns, gotchas, and best practices will be captured here_

## Quick Reference

### Environment Setup
```bash
# Start database
docker compose up -d postgres

# Run migrations
cd /Users/miethe/dev/homelab/development/MeatyMusic/services/api
poetry run alembic upgrade head

# Run tests
poetry run pytest tests/

# Check coverage
poetry run pytest --cov=app --cov-report=term-missing
```

### Development Commands
```bash
# Create new migration
poetry run alembic revision -m "description"

# Generate migration from models
poetry run alembic revision --autogenerate -m "description"

# Rollback migration
poetry run alembic downgrade -1

# Run specific test
poetry run pytest tests/test_models.py::test_style_model -v
```

## Key Files

### Models (Week 1)
- `/services/api/app/models/base.py` - Base with timestamps, tenant, owner, UUID
- `/services/api/app/models/style.py` - Genre, BPM, mood, instrumentation, tags
- `/services/api/app/models/lyrics.py` - Sections, rhyme, meter, citations
- `/services/api/app/models/producer_notes.py` - Structure, duration, mix targets
- `/services/api/app/models/song.py` - Title, SDS version, global seed, status
- `/services/api/app/models/workflow_run.py` - Run tracking, node outputs, events
- `/services/api/app/models/persona.py` - Artist profiles, vocal range, influences

### Repositories (Week 2)
- `/services/api/app/repositories/style_repo.py` - Genre filtering, RLS
- `/services/api/app/repositories/lyrics_repo.py` - Song association queries
- `/services/api/app/repositories/producer_notes_repo.py` - Song association
- `/services/api/app/repositories/song_repo.py` - Status filtering, workflow joins
- `/services/api/app/repositories/workflow_run_repo.py` - Active runs, event queries
- `/services/api/app/repositories/persona_repo.py` - Profile queries

### Services (Week 2)
- `/services/api/app/services/style_service.py` - Tag conflict validation
- `/services/api/app/services/song_service.py` - SDS validation, workflow creation
- `/services/api/app/services/validation_service.py` - JSON schema validation

### Pydantic Schemas (Week 2)
- `/services/api/app/schemas/style.py` - Create/Update with validators
- `/services/api/app/schemas/lyrics.py` - Section and rhyme validation
- `/services/api/app/schemas/producer_notes.py` - Structure validation
- `/services/api/app/schemas/song.py` - Seed and SDS validation

### JSON Schemas (Week 2-3)
- `/schemas/sds.schema.json` - Complete Song Design Spec
- `/schemas/style.schema.json` - Style specifications
- `/schemas/lyrics.schema.json` - Lyrics with constraints
- `/schemas/producer_notes.schema.json` - Producer guidance

### Migrations (Week 1-2)
- `/services/api/alembic/versions/002_amcs_core_tables.py` - Styles, songs, personas
- `/services/api/alembic/versions/003_amcs_artifact_tables.py` - Lyrics, producer_notes, workflow_runs

### Tests (Week 1-3)
- `/services/api/tests/models/` - Model validation tests
- `/services/api/tests/repositories/` - CRUD and RLS tests
- `/services/api/tests/services/` - Business logic tests
- `/services/api/tests/integration/` - Full flow tests

## Related Documentation

- **PRDs**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/`
  - `style.prd.md` - Style specifications
  - `lyrics.prd.md` - Lyrics constraints
  - `producer_notes.prd.md` - Producer guidance
  - `sds.prd.md` - Song Design Spec
- **Blueprints**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/hit_song_blueprint/AI/`
- **Overview**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/amcs-overview.md`
- **Phase Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts/phase-3-domain-model-migration.md`

## Agent Assignments

- **Models**: python-backend-engineer
- **Repositories**: python-backend-engineer, data-layer-expert
- **Services**: python-backend-engineer
- **JSON Schemas**: prd-writer
- **Pydantic Schemas**: python-backend-engineer
- **Review**: code-reviewer, senior-code-reviewer
