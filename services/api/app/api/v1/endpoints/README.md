# API Endpoints

This directory will contain MeatyMusic AMCS API endpoints in Phase 3:

## Planned Endpoints

### Entity Management
- **songs.py** - Song CRUD and workflow initiation
- **styles.py** - Style specification management
- **lyrics.py** - Lyrics entity management
- **personas.py** - Persona profile management
- **producer_notes.py** - Producer guidance management
- **sources.py** - External source registry
- **blueprints.py** - Genre blueprint access

### Workflow Operations
- **workflows.py** - Workflow execution and monitoring
- **validate.py** - On-demand validation endpoints
- **compose.py** - Prompt composition endpoints
- **events.py** - WebSocket event streaming

### Rendering (Phase 4)
- **render.py** - Render job submission and polling

## Implementation Reference

See:
- Phase 3 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-3/`
- Website/App PRD: `/docs/project_plans/PRDs/website_app.prd.md`
- API design patterns: Infrastructure endpoints in `/services/api/app/api/v1/endpoints/health.py`

## Infrastructure Preserved

This directory maintains endpoint infrastructure:
- `health.py` - Health check endpoint
- `__init__.py` - Endpoint router aggregation

Domain endpoints will follow FastAPI best practices with:
- Dependency injection for services
- Proper error handling
- Request/response validation
- OpenAPI documentation
