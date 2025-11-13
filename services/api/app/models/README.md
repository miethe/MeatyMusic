# Domain Models

This directory will contain MeatyMusic AMCS entity models in Phase 3:

## Planned Models

- **Song** - Top-level song entity aggregating all specifications
- **Style** - Genre, BPM, key, mood, instrumentation, tags
- **Lyrics** - Sections, rhyme, meter, POV, imagery, citations
- **Persona** - Reusable artist profiles, vocal range, influences
- **ProducerNotes** - Arrangement, structure, mix targets
- **Sources** - External knowledge registry (file/web/API/MCP)
- **Blueprint** - Genre algorithms, tempo windows, lexicon, scoring
- **ComposedPrompt** - Merged artifacts into render-ready prompt
- **Run** - Workflow execution state and artifacts

## Implementation Reference

See:
- Phase 3 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-3/`
- PRD references: `/docs/project_plans/PRDs/`
- Schema specifications: `/schemas/`

## Infrastructure Preserved

This directory maintains base model infrastructure:
- `base.py` - SQLAlchemy base model with common fields
- `__init__.py` - Model exports

Domain models will extend these base classes while implementing AMCS-specific business logic.
