# Domain Services

This directory will contain MeatyMusic AMCS business logic services in Phase 3:

## Planned Services

- **SongService** - Song creation and management orchestration
- **StyleService** - Style specification generation with blueprint validation
- **LyricsService** - Lyrics generation with rhyme/meter constraints
- **PersonaService** - Artist persona management and application
- **ProducerNotesService** - Producer guidance generation
- **SourcesService** - External knowledge retrieval via MCP
- **BlueprintService** - Genre blueprint loading and scoring
- **ComposedPromptService** - Final prompt composition with model limits
- **ValidationService** - Rubric scoring and constraint checking
- **WorkflowService** - Multi-node workflow orchestration

## Implementation Reference

See:
- Phase 3 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-3/`
- PRD references: `/docs/project_plans/PRDs/`
- Workflow specification: `/docs/project_plans/PRDs/claude_code_orchestration.prd.md`

## Infrastructure Preserved

This directory maintains service infrastructure:
- `__init__.py` - Service exports

Domain services will implement AMCS-specific business logic including:
- Deterministic processing with seed propagation
- Blueprint constraint validation
- Citation and provenance tracking
- Policy guard enforcement
