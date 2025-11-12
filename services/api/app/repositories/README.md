# Domain Repositories

This directory will contain MeatyMusic AMCS data access repositories in Phase 3:

## Planned Repositories

- **SongRepository** - CRUD operations for Song entities
- **StyleRepository** - Style specification persistence
- **LyricsRepository** - Lyrics and sections management
- **PersonaRepository** - Artist persona profiles
- **ProducerNotesRepository** - Producer guidance storage
- **SourcesRepository** - External knowledge source registry
- **BlueprintRepository** - Genre blueprint management
- **ComposedPromptRepository** - Final prompt artifacts
- **RunRepository** - Workflow execution tracking

## Implementation Reference

See:
- Phase 3 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-3/`
- PRD references: `/docs/project_plans/PRDs/`

## Infrastructure Preserved

This directory maintains repository infrastructure:
- `base.py` - Base repository with standard CRUD operations
- `cache_aware_base.py` - Cache-integrated repository pattern
- `__init__.py` - Repository exports

Domain repositories will extend these base classes while implementing AMCS-specific queries and data operations.
