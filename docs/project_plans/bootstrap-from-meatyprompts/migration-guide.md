# File-by-File Migration Guide

**Purpose**: Detailed guidance on which files to copy as-is, adapt, delete, or create new for the MeatyMusic AMCS bootstrap from MeatyPrompts.

---

## Copy As-Is (No Changes)

### Backend Infrastructure
```
/services/api/app/core/config.py
/services/api/app/core/async_database.py
/services/api/app/core/logging.py
/services/api/app/observability/
/services/api/app/middleware/
/services/api/app/repositories/base.py
/services/api/app/repositories/cache_aware_base.py
/services/api/app/core/security/
/services/api/app/errors.py
/services/api/app/utils/
/services/api/alembic.ini
/services/api/pyproject.toml (update name)
```

### Frontend Infrastructure
```
/apps/web/src/lib/api/
/apps/web/src/lib/auth/
/apps/web/src/lib/errors/
/apps/web/src/lib/telemetry/
/apps/web/src/lib/formatters/
/apps/web/src/contexts/
/apps/web/src/hooks/queries/
/apps/web/src/hooks/mutations/
/apps/web/src/styles/
/packages/ui/
/packages/tokens/
```

### Shared Infrastructure
```
/.claude/settings.json
/.claude/config/
/.claude/templates/
/.claude/hooks/
/.claude/scripts/
/monitoring/
/infra/
/.github/workflows/
/scripts/db_queries/
```

---

## Adapt (Modify)

### Backend Domain
- `/services/api/app/models/` → Delete prompt models, create AMCS models
- `/services/api/app/repositories/` → Delete prompt repos, create AMCS repos
- `/services/api/app/services/` → Delete prompt services, create AMCS services
- `/services/api/app/api/endpoints/` → Delete prompt endpoints, create workflow endpoints
- `/services/api/app/schemas/` → Delete prompt schemas, create AMCS schemas

### Frontend Domain
- `/apps/web/src/components/prompts/` → Delete, create `/components/songs/`
- `/apps/web/src/components/editor/` → Delete, create `/components/workflow/`
- `/apps/web/src/components/dashboard/` → Adapt to workflow metrics
- `/apps/web/src/app/(app)/` → Adapt routes to AMCS pages

### Claude Code
- `.claude/agents/` → Keep reviewers/pm, adapt dev-team descriptions
- `.claude/skills/` → Delete prompt skills, create workflow node skills

---

## Delete (Domain-Specific)

### Backend
```
/services/api/app/models/prompt*.py
/services/api/app/repositories/prompt*.py
/services/api/app/services/prompt*.py
/services/api/app/api/endpoints/prompts.py
/services/api/app/schemas/prompt*.py
```

### Frontend
```
/apps/web/src/components/prompts/
/apps/web/src/components/editor/
/apps/web/src/components/runs/ (adapt for workflow runs)
```

---

## Create New (AMCS-Specific)

### Backend
```
/services/api/app/models/song.py
/services/api/app/models/style.py
/services/api/app/models/lyrics.py
/services/api/app/models/producer_notes.py
/services/api/app/models/persona.py
/services/api/app/models/workflow_run.py
/services/api/app/repositories/song_repo.py
/services/api/app/repositories/style_repo.py
/services/api/app/repositories/workflow_run_repo.py
/services/api/app/services/workflow_orchestrator.py
/services/api/app/services/validation_service.py
/services/api/app/services/prompt_composer.py
/services/api/app/services/event_publisher.py
/services/api/app/api/v1/workflows.py
/services/api/app/api/v1/songs.py
/services/api/app/api/v1/styles.py
```

### Frontend
```
/apps/web/src/components/workflow/WorkflowVisualizer.tsx
/apps/web/src/components/workflow/WorkflowNode.tsx
/apps/web/src/components/songs/SongCreationForm.tsx
/apps/web/src/components/songs/SongList.tsx
/apps/web/src/components/artifacts/ArtifactViewer.tsx
/apps/web/src/components/artifacts/StyleArtifact.tsx
/apps/web/src/components/artifacts/LyricsArtifact.tsx
/apps/web/src/hooks/useWorkflowEvents.ts
/apps/web/src/lib/validation/sds.ts
```

### Claude Code
```
/.claude/skills/plan-song/
/.claude/skills/style-generation/
/.claude/skills/lyrics-generation/
/.claude/skills/producer-notes/
/.claude/skills/prompt-composition/
/.claude/skills/validation/
/.claude/skills/auto-fix/
```

### Schemas & Config
```
/schemas/sds.schema.json
/schemas/style.schema.json
/schemas/lyrics.schema.json
/schemas/producer_notes.schema.json
/taxonomies/tag_conflicts.json
/taxonomies/genre_categories.json
/limits/suno_limits.json
```

---

## Integration Points

### MeatyPrompts Pattern → AMCS Component

#### Repository Pattern
```python
# MeatyPrompts: PromptRepository
class PromptRepository(BaseRepository[Prompt]):
    def get_by_user(self, user_id: UUID) -> List[Prompt]:
        ...

# AMCS: StyleRepository
class StyleRepository(BaseRepository[Style]):
    def get_by_genre(self, genre: str) -> List[Style]:
        ...
```

#### Service Layer → Workflow Nodes
```python
# MeatyPrompts: PromptService
class PromptService:
    async def create_prompt(self, data: PromptCreate) -> Prompt:
        ...

# AMCS: Workflow node handlers
async def handle_style_node(input_data: dict) -> dict:
    # Generate style artifact
    ...

async def handle_lyrics_node(input_data: dict) -> dict:
    # Generate lyrics artifact
    ...
```

#### Repository Layer → Artifact Storage
```python
# MeatyPrompts: Stores prompts
prompt_repo.create(Prompt(...))

# AMCS: Stores workflow artifacts
workflow_run_repo.update_node_output(run_id, 'STYLE', style_artifact)
workflow_run_repo.update_node_output(run_id, 'LYRICS', lyrics_artifact)
```

#### Claude Code Skills → Workflow Orchestration
```yaml
# MeatyPrompts: prompt-builder skill
name: prompt-builder
description: Build and validate prompts

# AMCS: prompt-composition skill
name: prompt-composition
description: Merge style/lyrics/producer artifacts into render-ready prompt
```

---

## Key File Paths Reference

### MeatyPrompts Infrastructure (Copy As-Is)

#### Backend Core
- `/services/api/app/core/config.py`
- `/services/api/app/core/async_database.py`
- `/services/api/app/core/logging.py`
- `/services/api/app/observability/tracing.py`
- `/services/api/app/middleware/correlation.py`
- `/services/api/app/middleware/request_logger.py`

#### Backend Patterns
- `/services/api/app/repositories/base.py`
- `/services/api/app/core/security/security_context.py`
- `/services/api/app/core/security/unified_row_guard.py`
- `/services/api/app/errors.py`

#### Frontend Core
- `/apps/web/src/lib/api/client.ts`
- `/apps/web/src/lib/auth/clerk.ts`
- `/apps/web/src/lib/telemetry/browser.ts`
- `/apps/web/src/contexts/AuthContext.tsx`

#### Shared
- `/packages/ui/` (entire directory)
- `/packages/tokens/` (entire directory)
- `/.claude/settings.json`
- `/monitoring/` (entire directory)

### AMCS-Specific (Create New)

#### Backend Domain
- `/services/api/app/models/song.py`
- `/services/api/app/models/style.py`
- `/services/api/app/models/lyrics.py`
- `/services/api/app/repositories/workflow_run_repo.py`
- `/services/api/app/services/workflow_orchestrator.py`

#### Frontend Domain
- `/apps/web/src/components/workflow/WorkflowVisualizer.tsx`
- `/apps/web/src/components/songs/SongCreationForm.tsx`
- `/apps/web/src/hooks/useWorkflowEvents.ts`

#### Schemas & Config
- `/schemas/sds.schema.json`
- `/taxonomies/tag_conflicts.json`
- `/limits/suno_limits.json`

---

## Pattern Preservation Checklist

### Architecture Patterns (Must Preserve)
- [x] Layered architecture: routers → services → repositories → DB
- [x] Repositories own all DB I/O and RLS
- [x] Services return DTOs only (never ORM models)
- [x] ErrorResponse envelope for errors
- [x] Cursor pagination: `{ items, pageInfo }`
- [x] OpenTelemetry spans for all operations
- [x] Structured logging with trace IDs

### Security Patterns (Must Preserve)
- [x] Row-level security (RLS) in all queries
- [x] SecurityContext for tenant/user isolation
- [x] UnifiedRowGuard for query filtering
- [x] Multi-tenancy support in all tables

### Observability Patterns (Must Preserve)
- [x] TraceIdMiddleware for correlation
- [x] RequestLoggerMiddleware for HTTP logging
- [x] OpenTelemetry tracing (backend + frontend)
- [x] Structured JSON logs

### API Patterns (Must Preserve)
- [x] FastAPI dependency injection
- [x] Pydantic schemas for validation
- [x] Consistent error responses
- [x] API versioning (/v1/)

### Frontend Patterns (Must Preserve)
- [x] React Query for data fetching
- [x] Axios interceptors for auth/logging
- [x] Tailwind CSS + design tokens
- [x] Component library reuse

---

## Divergence Management

### Track Upstream Changes
```bash
# Add MeatyPrompts as upstream remote
git remote add meatyprompts /path/to/meatyprompts
git fetch meatyprompts

# Cherry-pick infrastructure improvements
git cherry-pick meatyprompts/main -- services/api/app/core/
```

### Document Divergences
```markdown
# /docs/meatyprompts-divergences.md

## Intentional Differences

1. **Domain Models**: Prompt vs Song/Style/Lyrics
2. **Orchestration**: CRUD vs Workflow Graph
3. **Validation**: Schema-only vs Rubric Scoring

## Shared Infrastructure (Keep Synced)

1. Base repository pattern
2. Observability setup
3. Authentication & security
4. Error handling
```

---

**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
**See Also**:
- [Risk & Validation Guide](./risk-and-validation.md)
- [Phase 1: Repository Setup](./phase-1-repository-setup.md)
