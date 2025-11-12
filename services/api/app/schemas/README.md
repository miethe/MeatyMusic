# API Schemas

This directory will contain MeatyMusic AMCS Pydantic schemas in Phase 3:

## Planned Schemas

### Entity Schemas
- **SongSchema** - Song entity request/response models
- **StyleSchema** - Style specification schemas
- **LyricsSchema** - Lyrics and section schemas
- **PersonaSchema** - Persona profile schemas
- **ProducerNotesSchema** - Producer guidance schemas
- **SourcesSchema** - External source schemas
- **BlueprintSchema** - Genre blueprint schemas
- **ComposedPromptSchema** - Final prompt schemas
- **RunSchema** - Workflow execution schemas

### Workflow Schemas
- **SDSSchema** - Song Design Spec aggregator
- **WorkflowEventSchema** - Real-time event streaming
- **ValidationResultSchema** - Rubric scoring results
- **CitationSchema** - Source provenance tracking

## Implementation Reference

See:
- Phase 3 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-3/`
- PRD references: `/docs/project_plans/PRDs/`
- JSON schemas: `/schemas/`

## Infrastructure Preserved

This directory maintains schema infrastructure:
- `base.py` - Base Pydantic models with common fields
- `pagination.py` - Pagination request/response schemas
- `auth.py` - Authentication schemas
- `__init__.py` - Schema exports

Domain schemas will extend base schemas and align with JSON schema definitions in `/schemas/`.
