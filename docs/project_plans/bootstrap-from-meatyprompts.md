# Bootstrap Implementation Plan: MeatyMusic AMCS from MeatyPrompts

**Version:** 1.0
**Date:** 2025-11-11
**Status:** Planning
**Estimated Timeline:** 6-8 weeks vs 14-18 weeks from scratch

---

## Executive Summary

### Why Bootstrap vs Build From Scratch

MeatyPrompts is a production-ready prompt management platform with 70-80% infrastructure overlap with MeatyMusic AMCS requirements. Both systems share:

- **Core Architecture**: FastAPI + Python backend, Next.js 14 + React frontend, PostgreSQL + pgvector, Redis
- **Infrastructure Patterns**: Router → Service → Repository → DB (strictly enforced)
- **Observability**: OpenTelemetry tracing, structured logging, metrics
- **Authentication**: Multi-tenancy, row-level security, user context
- **Developer Tooling**: Claude Code integration, monorepo with pnpm, comprehensive testing

**Key Insight**: MeatyPrompts manages Prompts with version control, metadata, and execution tracking. MeatyMusic AMCS manages Songs with workflow orchestration, artifact validation, and deterministic composition. The domain models differ, but the infrastructure patterns are identical.

### Time/Effort Savings

| Aspect | Build From Scratch | Bootstrap | Savings |
|--------|-------------------|-----------|---------|
| Backend Infrastructure | 4-5 weeks | 1 week | 75% |
| Database Setup | 2-3 weeks | 3-5 days | 70% |
| Observability | 2 weeks | 2 days | 85% |
| Frontend Foundation | 3-4 weeks | 1-2 weeks | 60% |
| Claude Code Integration | 1-2 weeks | 3-5 days | 70% |
| **Total** | **14-18 weeks** | **6-8 weeks** | **65%** |

### Risk Assessment

**Low Risk**:
- Infrastructure reuse (proven in production)
- Architectural patterns (battle-tested)
- Observability and error handling (mature)

**Medium Risk**:
- Domain model migration (Prompt → Song entities)
- UI component adaptation (prompt editor → workflow dashboard)
- Workflow orchestration (new skill-based system)

**Mitigation**:
- Incremental migration with parallel validation
- Preserve MeatyPrompts infrastructure patterns
- Feature flags for gradual rollout

---

## Technology Stack Alignment

### What Transfers 1:1 (95-100% reuse)

**Backend Infrastructure**:
- `/services/api/app/core/config.py` - Configuration management
- `/services/api/app/core/async_database.py` - Database connection pool
- `/services/api/app/core/logging.py` - Structured logging
- `/services/api/app/observability/` - OpenTelemetry tracing
- `/services/api/app/middleware/` - Request logging, correlation, rate limiting
- `/services/api/app/repositories/base.py` - Base repository with RLS
- `/services/api/app/core/security/` - Row-level security, context management
- `/services/api/app/errors.py` - Error handling hierarchy
- `/services/api/alembic/` - Database migration framework

**Frontend Infrastructure**:
- `/apps/web/src/lib/api/` - API client utilities
- `/apps/web/src/lib/errors/` - Error handling
- `/apps/web/src/lib/auth/` - Clerk authentication
- `/apps/web/src/lib/telemetry/` - OpenTelemetry browser tracing
- `/apps/web/src/hooks/queries/` - React Query patterns
- `/apps/web/src/hooks/mutations/` - Mutation patterns
- `/apps/web/src/contexts/` - React context providers
- `/packages/ui/` - Shared UI component library
- `/packages/tokens/` - Design tokens

**Shared Infrastructure**:
- `/.claude/` - Claude Code configuration
- `/monitoring/` - Grafana dashboards, alerts
- `/infra/` - Infrastructure as code
- `/.github/workflows/` - CI/CD pipelines
- `/scripts/` - Database utilities, migrations

### What Needs Adaptation (60-80% reuse)

**Backend Services**:
- Service layer: Replace prompt operations with song workflow operations
- Repository layer: Adapt to new entity schemas (Style, Lyrics, Producer Notes)
- API endpoints: Transform prompt CRUD to workflow step CRUD
- Schemas: New Pydantic models for AMCS entities

**Frontend Components**:
- `/apps/web/src/components/prompts/` → `/components/songs/`
- `/apps/web/src/components/editor/` → `/components/workflow/`
- `/apps/web/src/components/runs/` → Reuse for workflow runs
- Dashboard: Adapt analytics to workflow metrics

**Claude Code Integration**:
- `.claude/skills/` - Adapt existing skills to workflow nodes
- `.claude/agents/` - Add workflow-specific agents
- Preserve skill-builder patterns, adapt to PLAN/STYLE/LYRICS/PRODUCER/COMPOSE nodes

### What Needs New Implementation (0-20% reuse)

**AMCS-Specific**:
- `/services/api/app/models/song.py` - Song entity models
- `/services/api/app/models/style.py` - Style specifications
- `/services/api/app/models/lyrics.py` - Lyrics with constraints
- `/services/api/app/models/producer_notes.py` - Producer guidance
- `/services/api/app/services/workflow_orchestrator.py` - Graph runner
- `/services/api/app/services/validation_service.py` - Rubric scoring
- `/services/api/app/services/prompt_composer.py` - Final prompt assembly
- `/apps/web/src/components/workflow/WorkflowVisualizer.tsx` - Workflow graph UI
- `/schemas/` - JSON schemas for SDS, entities
- `/taxonomies/` - Tag categories, conflict matrix
- `/limits/` - Engine-specific character limits

---

## Phase 1: Repository Setup & Cleanup (3-5 days)

### Goals
- Create MeatyMusic repository structure
- Import foundational infrastructure from MeatyPrompts
- Remove domain-specific MeatyPrompts code
- Establish clean baseline

### Tasks

**Day 1: Repository Initialization**

1. **Create monorepo structure**:
   ```bash
   mkdir -p services/api/{app,alembic,tests}
   mkdir -p apps/web/src/{app,components,lib,hooks,stores}
   mkdir -p packages/{ui,tokens,api,store}
   mkdir -p .claude/{agents,skills,config,specs}
   mkdir -p schemas taxonomies limits
   mkdir -p docs/{project_plans/PRDs,hit_song_blueprint/AI}
   ```

2. **Copy root configuration** (as-is):
   - `/package.json` - Workspace configuration
   - `/.npmrc` - pnpm settings
   - `/.gitignore` - Git ignore patterns
   - `/.pre-commit-config.yaml` - Pre-commit hooks
   - `/pyproject.toml` - Python project config

3. **Copy infrastructure directories** (as-is):
   - `/infra/` - Infrastructure code
   - `/monitoring/` - Grafana dashboards
   - `/.github/workflows/` - CI/CD pipelines

**Day 2: Backend Infrastructure**

1. **Copy backend core** (as-is):
   ```
   /services/api/pyproject.toml
   /services/api/alembic.ini
   /services/api/app/core/
   /services/api/app/observability/
   /services/api/app/middleware/
   /services/api/app/db/
   /services/api/app/utils/
   ```

2. **Copy base patterns** (as-is):
   ```
   /services/api/app/repositories/base.py
   /services/api/app/repositories/cache_aware_base.py
   /services/api/app/schemas/base.py
   /services/api/app/errors.py
   /services/api/app/enums/
   ```

3. **Copy security infrastructure** (as-is):
   ```
   /services/api/app/core/security/
   /services/api/app/security/
   ```

**Day 3: Frontend Infrastructure**

1. **Copy shared packages** (as-is):
   ```
   /packages/ui/ - Component library
   /packages/tokens/ - Design tokens
   /packages/api/ - API types
   /packages/store/ - State management utilities
   ```

2. **Copy frontend foundation** (as-is):
   ```
   /apps/web/package.json
   /apps/web/next.config.js
   /apps/web/tsconfig.json
   /apps/web/tailwind.config.ts
   /apps/web/postcss.config.js
   /apps/web/src/lib/api/
   /apps/web/src/lib/auth/
   /apps/web/src/lib/errors/
   /apps/web/src/lib/telemetry/
   /apps/web/src/lib/formatters/
   /apps/web/src/contexts/
   /apps/web/src/hooks/queries/
   /apps/web/src/hooks/mutations/
   /apps/web/src/styles/
   ```

**Day 4: Claude Code Integration**

1. **Copy Claude Code foundation** (as-is):
   ```
   /.claude/settings.json - Permissions, hooks
   /.claude/config/ - Agent configurations
   /.claude/templates/ - Spec templates
   /.claude/hooks/ - Git hooks
   /.claude/scripts/ - Utility scripts
   ```

2. **Copy reusable agents** (adapt descriptions):
   ```
   /.claude/agents/dev-team/python-backend-engineer.md
   /.claude/agents/dev-team/ui-engineer-enhanced.md
   /.claude/agents/reviewers/code-reviewer.md
   /.claude/agents/pm/prd-writer.md
   ```

3. **Create CLAUDE.md** (new):
   - Project overview
   - North star principles
   - Workflow node descriptions
   - PRD references

**Day 5: Cleanup & Documentation**

1. **Remove MeatyPrompts domain code**:
   - Delete `/services/api/app/models/` (keep base.py)
   - Delete `/services/api/app/repositories/*_repo.py` (keep base.py, cache_aware_base.py)
   - Delete `/services/api/app/services/` (keep exceptions.py)
   - Delete `/services/api/app/api/endpoints/` (keep deps.py)
   - Delete `/apps/web/src/components/prompts/`
   - Delete `/apps/web/src/components/editor/`

2. **Create placeholder files**:
   ```python
   # /services/api/app/models/__init__.py
   """AMCS domain models - to be implemented in Phase 3."""

   # /services/api/app/repositories/__init__.py
   """AMCS repositories - to be implemented in Phase 3."""

   # /services/api/app/services/__init__.py
   """AMCS services - to be implemented in Phase 3."""
   ```

3. **Update documentation**:
   - Create `/docs/bootstrap-migration-log.md`
   - Document what was copied, what was removed, what needs implementation
   - Create `/docs/architecture-diff.md` comparing MeatyPrompts vs AMCS

### Agent Assignments
- **Repository Setup**: python-backend-engineer, ui-engineer
- **Documentation**: prd-writer
- **Review**: code-reviewer

### Deliverables
- Clean MeatyMusic repository with foundational infrastructure
- No domain-specific MeatyPrompts code
- All infrastructure patterns preserved
- Migration log documenting changes

### Success Criteria
- [x] Repository structure matches monorepo pattern
- [x] Backend can start (even with no endpoints)
- [x] Frontend can build (even with minimal pages)
- [x] Tests run (even if none pass yet)
- [x] Claude Code agents can load

---

## Phase 2: Infrastructure Preservation (5-7 days)

### Goals
- Validate all copied infrastructure works in MeatyMusic context
- Update configuration for AMCS naming
- Establish database schema foundation
- Verify observability stack

### Tasks

**Day 1-2: Backend Configuration**

1. **Update configuration** (`/services/api/app/core/config.py`):
   ```python
   # Change service name
   SERVICE_NAME = "meatymusic-api"  # was: meatyprompts-api

   # Update database name
   POSTGRES_DB = "meatymusic"  # was: meatyprompts

   # Preserve all patterns:
   # - Multi-tenancy support
   # - Row-level security
   # - OpenTelemetry settings
   # - Redis configuration
   ```

2. **Create initial Alembic migration**:
   ```python
   # /services/api/alembic/versions/001_initial_schema.py
   """Initial AMCS schema.

   Creates foundational tables for multi-tenancy and users.
   AMCS-specific tables will be added in Phase 3.
   """

   def upgrade():
       # Copy tenancy tables from MeatyPrompts
       op.create_table('tenants', ...)
       op.create_table('users', ...)
       op.create_table('user_preferences', ...)
   ```

3. **Update API main** (`/services/api/main.py`):
   ```python
   from fastapi import FastAPI
   from app.core.config import settings
   from app.core.database import engine
   from app.observability.tracing import init_tracing

   app = FastAPI(
       title="MeatyMusic AMCS API",
       description="Agentic Music Creation System",
       version="0.1.0"
   )

   # Initialize tracing (preserve pattern)
   init_tracing(app, engine)

   # Add middleware (preserve pattern)
   # - TraceIdMiddleware
   # - CorrelationMiddleware
   # - RequestLoggerMiddleware
   ```

**Day 3-4: Frontend Configuration**

1. **Update Next.js configuration** (`/apps/web/next.config.js`):
   ```javascript
   module.exports = {
     // Preserve OpenTelemetry instrumentation
     experimental: {
       instrumentationHook: true,
     },

     // Update API URL
     env: {
       NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
       NEXT_PUBLIC_APP_NAME: 'MeatyMusic',
     },
   }
   ```

2. **Update API client** (`/apps/web/src/lib/api/client.ts`):
   ```typescript
   // Preserve axios interceptors for:
   // - Authentication token injection
   // - Error handling
   // - Request/response logging
   // - Trace ID propagation

   const apiClient = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL,
     headers: {
       'X-Service-Name': 'meatymusic-web',
     },
   })
   ```

3. **Create minimal pages**:
   ```typescript
   // /apps/web/src/app/page.tsx
   export default function HomePage() {
     return <div>MeatyMusic AMCS - Coming Soon</div>
   }

   // /apps/web/src/app/dashboard/page.tsx
   export default function DashboardPage() {
     return <div>Dashboard - Coming Soon</div>
   }
   ```

**Day 5: Observability Verification**

1. **Verify tracing**:
   - Start backend: `cd services/api && uvicorn main:app --reload`
   - Verify OpenTelemetry exports to console/OTLP
   - Verify trace IDs in logs

2. **Verify frontend telemetry**:
   - Start frontend: `cd apps/web && pnpm dev`
   - Verify browser spans
   - Verify API calls include trace context

3. **Test infrastructure**:
   ```python
   # /services/api/tests/test_infrastructure.py
   def test_database_connection():
       """Verify database connection works."""

   def test_tracing_enabled():
       """Verify OpenTelemetry is configured."""

   def test_logging_structured():
       """Verify structured logging works."""
   ```

**Day 6-7: Database & Redis Setup**

1. **Database initialization**:
   ```bash
   # Start PostgreSQL with pgvector
   docker-compose up -d postgres

   # Run migrations
   cd services/api
   alembic upgrade head
   ```

2. **Redis setup**:
   ```bash
   # Start Redis
   docker-compose up -d redis

   # Verify connection
   python -c "from app.core.cache import redis_client; print(redis_client.ping())"
   ```

3. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: pgvector/pgvector:pg16
       environment:
         POSTGRES_DB: meatymusic
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data

     api:
       build: ./services/api
       environment:
         DATABASE_URL: postgresql://postgres:postgres@postgres:5432/meatymusic
         REDIS_URL: redis://redis:6379
       ports:
         - "8000:8000"
       depends_on:
         - postgres
         - redis

   volumes:
     postgres_data:
     redis_data:
   ```

### Agent Assignments
- **Backend**: python-backend-engineer
- **Frontend**: ui-engineer
- **DevOps**: infrastructure-engineer
- **Review**: code-reviewer

### Deliverables
- Working backend API with health endpoints
- Working frontend with minimal pages
- Database migrations for foundational tables
- Docker Compose for local development
- Observability verified (logs, traces)

### Success Criteria
- [x] Backend starts without errors
- [x] Frontend builds and runs
- [x] Database migrations succeed
- [x] Traces appear in console/OTLP
- [x] Structured logs include trace IDs
- [x] Redis connection works
- [x] Health endpoints return 200

---

## Phase 3: Domain Model Migration (10-15 days)

### Goals
- Implement AMCS entity models (Style, Lyrics, Producer Notes, Song, Run)
- Create repositories following base patterns
- Create service layer for workflow operations
- Implement JSON schema validation

### Tasks

**Week 1: Entity Models**

1. **Create base models** (`/services/api/app/models/base.py`):
   ```python
   from sqlalchemy import Column, String, DateTime, UUID
   from sqlalchemy.ext.declarative import declarative_base
   from datetime import datetime
   import uuid

   Base = declarative_base()

   class BaseModel(Base):
       __abstract__ = True

       id = Column(UUID, primary_key=True, default=uuid.uuid4)
       created_at = Column(DateTime, default=datetime.utcnow)
       updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
       tenant_id = Column(UUID, nullable=False, index=True)
       owner_id = Column(UUID, nullable=False, index=True)
   ```

2. **Style model** (`/services/api/app/models/style.py`):
   ```python
   from sqlalchemy import Column, String, Integer, JSON, ARRAY, Text
   from .base import BaseModel

   class Style(BaseModel):
       __tablename__ = 'styles'

       name = Column(String(255), nullable=False)
       genre = Column(String(100), nullable=False)
       sub_genres = Column(ARRAY(String), default=[])
       bpm_min = Column(Integer)
       bpm_max = Column(Integer)
       key = Column(String(10))
       mood = Column(ARRAY(String), default=[])
       energy_level = Column(Integer)  # 1-10
       instrumentation = Column(ARRAY(String), default=[])
       vocal_profile = Column(JSON)
       tags_positive = Column(ARRAY(String), default=[])
       tags_negative = Column(ARRAY(String), default=[])
       blueprint_id = Column(UUID)  # Reference to genre blueprint
   ```

3. **Lyrics model** (`/services/api/app/models/lyrics.py`):
   ```python
   class Lyrics(BaseModel):
       __tablename__ = 'lyrics'

       song_id = Column(UUID, ForeignKey('songs.id'))
       sections = Column(JSON)  # [{type, lines, rhyme_scheme}]
       rhyme_scheme = Column(String(50))
       meter = Column(String(50))
       syllables_per_line = Column(Integer)
       pov = Column(String(20))  # first-person, third-person
       tense = Column(String(20))  # past, present
       hook_strategy = Column(String(50))
       repetition_rules = Column(JSON)
       imagery_density = Column(Integer)  # 1-10
       reading_level = Column(Integer)  # Flesch-Kincaid
       explicit_allowed = Column(Boolean, default=False)
       source_citations = Column(JSON)  # [{source_id, chunk_hash, weight}]
   ```

4. **Producer Notes model** (`/services/api/app/models/producer_notes.py`):
   ```python
   class ProducerNotes(BaseModel):
       __tablename__ = 'producer_notes'

       song_id = Column(UUID, ForeignKey('songs.id'))
       structure = Column(JSON)  # [section_order]
       hook_count = Column(Integer)
       section_tags = Column(JSON)  # {section: [tags]}
       section_durations = Column(JSON)  # {section: duration_seconds}
       instrumentation_hints = Column(JSON)
       mix_targets = Column(JSON)  # {loudness, stereo_width, space}
       arrangement_notes = Column(Text)
   ```

5. **Song & Run models** (`/services/api/app/models/song.py`):
   ```python
   class Song(BaseModel):
       __tablename__ = 'songs'

       title = Column(String(255), nullable=False)
       sds_version = Column(String(20))  # SDS schema version
       global_seed = Column(Integer, nullable=False)
       style_id = Column(UUID, ForeignKey('styles.id'))
       persona_id = Column(UUID, ForeignKey('personas.id'))
       status = Column(String(50))  # draft, validated, rendered
       feature_flags = Column(JSON)

   class WorkflowRun(BaseModel):
       __tablename__ = 'workflow_runs'

       song_id = Column(UUID, ForeignKey('songs.id'))
       run_id = Column(UUID, unique=True)
       status = Column(String(50))  # running, completed, failed
       current_node = Column(String(50))
       node_outputs = Column(JSON)  # {node: {artifacts, scores, citations}}
       event_stream = Column(JSON)  # [{ts, node, phase, metrics}]
       validation_scores = Column(JSON)
       fix_iterations = Column(Integer, default=0)
   ```

**Week 2: Repositories & Services**

1. **Create repositories** (following base.py pattern):
   ```python
   # /services/api/app/repositories/style_repo.py
   from .base import BaseRepository
   from ..models.style import Style

   class StyleRepository(BaseRepository[Style]):
       def get_by_genre(self, genre: str) -> List[Style]:
           """Get styles by genre with security filtering."""
           query = self.db.query(Style).filter(Style.genre == genre)
           return self._apply_security(query).all()

   # /services/api/app/repositories/workflow_run_repo.py
   class WorkflowRunRepository(BaseRepository[WorkflowRun]):
       def get_active_runs(self) -> List[WorkflowRun]:
           """Get all active workflow runs."""
           query = self.db.query(WorkflowRun).filter(
               WorkflowRun.status == 'running'
           )
           return self._apply_security(query).all()
   ```

2. **Create service layer** (following service patterns):
   ```python
   # /services/api/app/services/style_service.py
   from ..repositories.style_repo import StyleRepository
   from ..schemas.style import StyleCreate, StyleUpdate

   class StyleService:
       def __init__(self, repo: StyleRepository):
           self.repo = repo

       async def create_style(self, data: StyleCreate) -> Style:
           """Create new style with conflict validation."""
           # Validate tag conflicts
           self._validate_tag_conflicts(data.tags_positive)

           # Create style
           return await self.repo.create(data)
   ```

3. **Create Pydantic schemas**:
   ```python
   # /services/api/app/schemas/style.py
   from pydantic import BaseModel, Field, validator
   from typing import List, Optional

   class StyleCreate(BaseModel):
       name: str
       genre: str
       sub_genres: List[str] = []
       bpm_min: Optional[int] = Field(None, ge=60, le=200)
       bpm_max: Optional[int] = Field(None, ge=60, le=200)
       tags_positive: List[str] = []
       tags_negative: List[str] = []

       @validator('bpm_max')
       def validate_bpm_range(cls, v, values):
           if 'bpm_min' in values and v < values['bpm_min']:
               raise ValueError('bpm_max must be >= bpm_min')
           return v
   ```

**Week 2-3: JSON Schema Validation**

1. **Create JSON schemas** (`/schemas/`):
   ```json
   // /schemas/sds.schema.json
   {
     "$schema": "http://json-schema.org/draft-07/schema#",
     "title": "Song Design Spec",
     "type": "object",
     "required": ["version", "song_id", "global_seed", "style_id"],
     "properties": {
       "version": {"type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$"},
       "song_id": {"type": "string", "format": "uuid"},
       "global_seed": {"type": "integer"},
       "style_id": {"type": "string", "format": "uuid"},
       "lyrics_id": {"type": "string", "format": "uuid"},
       "producer_notes_id": {"type": "string", "format": "uuid"},
       "persona_id": {"type": "string", "format": "uuid"},
       "feature_flags": {"type": "object"},
       "render_config": {
         "type": "object",
         "properties": {
           "enabled": {"type": "boolean"},
           "engine": {"type": "string", "enum": ["suno", "udio"]},
           "model": {"type": "string"}
         }
       }
     }
   }
   ```

2. **Create validation service**:
   ```python
   # /services/api/app/services/validation_service.py
   import jsonschema
   from pathlib import Path

   class ValidationService:
       def __init__(self):
           self.schemas = self._load_schemas()

       def _load_schemas(self) -> dict:
           """Load all JSON schemas."""
           schema_dir = Path(__file__).parent.parent.parent / 'schemas'
           return {
               'sds': json.load(open(schema_dir / 'sds.schema.json')),
               'style': json.load(open(schema_dir / 'style.schema.json')),
               'lyrics': json.load(open(schema_dir / 'lyrics.schema.json')),
           }

       def validate_sds(self, data: dict) -> bool:
           """Validate SDS against schema."""
           jsonschema.validate(data, self.schemas['sds'])
           return True
   ```

### Agent Assignments
- **Models**: python-backend-engineer
- **Repositories**: python-backend-engineer
- **Services**: python-backend-engineer
- **Schemas**: prd-writer (JSON schemas), python-backend-engineer (Pydantic)
- **Review**: code-reviewer, senior-code-reviewer

### Deliverables
- Complete entity models (Style, Lyrics, Producer Notes, Song, Run)
- Repository layer for all entities
- Service layer with validation
- JSON schemas for all entities
- Alembic migrations for all tables
- Unit tests for models, repos, services

### Success Criteria
- [x] All entity models created
- [x] All repositories follow base pattern
- [x] Services enforce business rules
- [x] JSON schema validation works
- [x] Migrations apply cleanly
- [x] Tests pass (>80% coverage)

---

## Phase 4: Workflow Orchestration (15-20 days)

### Goals
- Create Claude Code skills for workflow nodes
- Implement graph runner (orchestrator)
- Build validation and auto-fix logic
- Create event streaming system

### Tasks

**Week 1: Workflow Skills Foundation**

1. **Create skill structure** (`.claude/skills/`):
   ```
   .claude/skills/
   ├── plan-song/
   │   ├── SKILL.md
   │   ├── scripts/
   │   │   └── expand_sds.mjs
   │   └── templates/
   ├── style-generation/
   │   ├── SKILL.md
   │   ├── scripts/
   │   │   └── sanitize_tags.mjs
   │   └── blueprints/ -> symlink to /docs/hit_song_blueprint/AI/
   ├── lyrics-generation/
   │   ├── SKILL.md
   │   ├── scripts/
   │   │   └── validate_rhyme.mjs
   │   └── templates/
   ├── producer-notes/
   │   ├── SKILL.md
   │   └── scripts/
   ├── prompt-composition/
   │   ├── SKILL.md
   │   └── scripts/
   │       └── merge_artifacts.mjs
   ├── validation/
   │   ├── SKILL.md
   │   └── scripts/
   │       └── score_rubric.mjs
   └── auto-fix/
       ├── SKILL.md
       └── scripts/
           └── apply_fixes.mjs
   ```

2. **PLAN skill** (`.claude/skills/plan-song/SKILL.md`):
   ```yaml
   ---
   name: plan-song
   description: "Expand Song Design Spec into ordered workflow targets. Analyzes SDS, determines section order, sets objectives for each workflow node. Use when starting a new song workflow from SDS JSON."
   ---

   # Plan Song Workflow

   ## Input Contract
   - SDS JSON (validated against schema)
   - Global seed
   - Feature flags

   ## Process
   1. Validate SDS structure
   2. Determine section order from genre blueprint
   3. Calculate derived seeds (seed + node_index)
   4. Set objectives for each node
   5. Emit planning manifest

   ## Output Contract
   ```json
   {
     "run_id": "uuid",
     "sections": ["intro", "verse1", "chorus", "verse2", "chorus", "bridge", "chorus", "outro"],
     "node_seeds": {
       "STYLE": 12345,
       "LYRICS": 12346,
       "PRODUCER": 12347,
       "COMPOSE": 12348
     },
     "objectives": {
       "STYLE": "Generate pop style with 120-130 BPM, uplifting mood",
       "LYRICS": "Write 3 verses, 1 chorus, 1 bridge with AABB rhyme",
       "PRODUCER": "Arrange for radio-friendly 3:30 runtime",
       "COMPOSE": "Merge to Suno format <500 chars"
     }
   }
   ```

   ## Determinism
   - Use fixed section order from blueprint
   - Derived seeds = global_seed + node_index
   - No external calls
   ```

3. **STYLE skill** (`.claude/skills/style-generation/SKILL.md`):
   ```yaml
   ---
   name: style-generation
   description: "Generate style specification from SDS + blueprint. Emits genre, BPM, key, mood, instrumentation, tags. Validates tag conflicts using conflict matrix. Use when creating style artifact for song composition."
   ---

   # Style Generation

   ## Input Contract
   - SDS with style preferences
   - Genre blueprint
   - Node seed

   ## Process
   1. Load genre blueprint
   2. Select genre/sub-genre
   3. Determine BPM within blueprint range
   4. Select mood/energy from allowed list
   5. Choose instrumentation
   6. Generate positive tags (max 8)
   7. Generate negative tags (max 5)
   8. Validate no tag conflicts
   9. Emit style artifact

   ## Tag Conflict Validation
   ```javascript
   // scripts/sanitize_tags.mjs
   import { conflictMatrix } from '/taxonomies/tag_conflicts.json'

   function validateTags(tags) {
     for (let i = 0; i < tags.length; i++) {
       for (let j = i + 1; j < tags.length; j++) {
         if (conflictMatrix[tags[i]]?.includes(tags[j])) {
           throw new Error(`Conflicting tags: ${tags[i]} vs ${tags[j]}`)
         }
       }
     }
   }
   ```

   ## Output Contract
   ```json
   {
     "artifact_type": "style",
     "artifact_hash": "sha256:...",
     "genre": "pop",
     "sub_genres": ["synth-pop"],
     "bpm": 125,
     "key": "C major",
     "mood": ["uplifting", "energetic"],
     "energy": 8,
     "instrumentation": ["synth", "drums", "bass", "vocals"],
     "vocal_profile": {"range": "tenor", "delivery": "clean"},
     "tags_positive": ["anthemic", "radio-friendly", "hook-driven"],
     "tags_negative": ["ballad", "acoustic"]
   }
   ```
   ```

4. **VALIDATION skill** (`.claude/skills/validation/SKILL.md`):
   ```yaml
   ---
   name: validation
   description: "Score composed prompt against genre rubric. Checks hook density, singability, rhyme tightness, section completeness, profanity. Returns pass/fail + scores. Use after COMPOSE to validate artifacts."
   ---

   # Validation & Rubric Scoring

   ## Input Contract
   - Composed prompt
   - Style artifact
   - Lyrics artifact
   - Genre blueprint
   - Rubric thresholds

   ## Scoring Metrics
   1. **hook_density** (0-100): Repetition of chorus/hook phrases
   2. **singability** (0-100): Syllable stress, natural phrasing
   3. **rhyme_tightness** (0-100): Adherence to rhyme scheme
   4. **section_completeness** (0-100): All required sections present
   5. **profanity_score** (0-100): Compliance with explicit flag

   ## Hard Fail Conditions
   - Character count > model limit
   - Missing required sections
   - Profanity when explicit=false
   - Conflicting tags detected
   - "style of <living artist>" in public mode

   ## Output Contract
   ```json
   {
     "validation_result": "pass" | "fail",
     "scores": {
       "hook_density": 85,
       "singability": 90,
       "rhyme_tightness": 75,
       "section_completeness": 100,
       "profanity_score": 100,
       "total": 87
     },
     "threshold": 80,
     "issues": [
       {"severity": "warning", "message": "Hook density below 80"}
     ],
     "hard_fails": []
   }
   ```
   ```

**Week 2: Orchestrator Implementation**

1. **Create orchestrator service** (`/services/api/app/services/workflow_orchestrator.py`):
   ```python
   from typing import Dict, List, Callable
   from ..models.song import WorkflowRun
   from ..schemas.workflow import NodeOutput, WorkflowEvent

   class WorkflowOrchestrator:
       """Graph runner for AMCS workflow."""

       NODES = ['PLAN', 'STYLE', 'LYRICS', 'PRODUCER', 'COMPOSE', 'VALIDATE', 'FIX', 'RENDER', 'REVIEW']
       MAX_FIX_ITERATIONS = 3

       def __init__(self, run_repo, event_publisher):
           self.run_repo = run_repo
           self.event_publisher = event_publisher
           self.skill_handlers: Dict[str, Callable] = {}

       async def execute_workflow(self, song_id: str, sds: dict) -> WorkflowRun:
           """Execute complete workflow graph."""
           run = await self.run_repo.create(WorkflowRun(
               song_id=song_id,
               status='running',
               current_node='PLAN'
           ))

           try:
               # Execute nodes sequentially
               plan_output = await self._execute_node('PLAN', sds, run)

               # Parallel execution where possible
               style_output, lyrics_output, producer_output = await asyncio.gather(
                   self._execute_node('STYLE', plan_output, run),
                   self._execute_node('LYRICS', plan_output, run),
                   self._execute_node('PRODUCER', plan_output, run)
               )

               # Compose
               compose_output = await self._execute_node('COMPOSE', {
                   'style': style_output,
                   'lyrics': lyrics_output,
                   'producer': producer_output
               }, run)

               # Validate with fix loop
               validation_output = await self._validate_with_fixes(
                   compose_output, run
               )

               # Render (if enabled)
               if sds.get('feature_flags', {}).get('render.enabled'):
                   await self._execute_node('RENDER', validation_output, run)

               # Review
               await self._execute_node('REVIEW', validation_output, run)

               run.status = 'completed'
               await self.run_repo.update(run)

               return run

           except Exception as e:
               run.status = 'failed'
               await self.run_repo.update(run)
               raise

       async def _validate_with_fixes(self, compose_output: dict, run: WorkflowRun) -> dict:
           """Validate with up to 3 fix iterations."""
           current_output = compose_output

           for iteration in range(self.MAX_FIX_ITERATIONS):
               validation = await self._execute_node('VALIDATE', current_output, run)

               if validation['validation_result'] == 'pass':
                   return validation

               # Apply fixes
               fix_output = await self._execute_node('FIX', {
                   'compose': current_output,
                   'validation': validation,
                   'iteration': iteration
               }, run)

               # Re-compose
               current_output = await self._execute_node('COMPOSE', fix_output, run)

           # Max iterations reached
           if validation['validation_result'] == 'fail':
               raise ValidationError(f"Failed validation after {self.MAX_FIX_ITERATIONS} iterations")

           return validation

       async def _execute_node(self, node: str, input_data: dict, run: WorkflowRun) -> dict:
           """Execute single workflow node."""
           # Emit start event
           await self.event_publisher.publish(WorkflowEvent(
               run_id=run.run_id,
               node=node,
               phase='start',
               timestamp=datetime.utcnow()
           ))

           start_time = time.time()

           # Execute skill handler
           handler = self.skill_handlers.get(node)
           if not handler:
               raise ValueError(f"No handler for node: {node}")

           output = await handler(input_data)

           duration_ms = int((time.time() - start_time) * 1000)

           # Store node output
           run.node_outputs[node] = output
           await self.run_repo.update(run)

           # Emit end event
           await self.event_publisher.publish(WorkflowEvent(
               run_id=run.run_id,
               node=node,
               phase='end',
               duration_ms=duration_ms,
               metrics=output.get('metrics', {})
           ))

           return output
   ```

2. **Create event publisher** (`/services/api/app/services/event_publisher.py`):
   ```python
   from fastapi import WebSocket
   from typing import List
   import json

   class EventPublisher:
       """WebSocket event publisher for workflow events."""

       def __init__(self):
           self.connections: List[WebSocket] = []

       async def connect(self, websocket: WebSocket):
           await websocket.accept()
           self.connections.append(websocket)

       async def disconnect(self, websocket: WebSocket):
           self.connections.remove(websocket)

       async def publish(self, event: WorkflowEvent):
           """Publish event to all connected clients."""
           message = json.dumps(event.dict())

           for connection in self.connections:
               try:
                   await connection.send_text(message)
               except Exception:
                   # Connection closed
                   pass
   ```

**Week 3: API Endpoints**

1. **Create workflow endpoints** (`/services/api/app/api/v1/workflows.py`):
   ```python
   from fastapi import APIRouter, Depends, WebSocket
   from ...services.workflow_orchestrator import WorkflowOrchestrator
   from ...schemas.sds import SDS

   router = APIRouter(prefix="/workflows", tags=["workflows"])

   @router.post("/runs")
   async def create_workflow_run(
       sds: SDS,
       orchestrator: WorkflowOrchestrator = Depends()
   ):
       """Start a new workflow run from SDS."""
       run = await orchestrator.execute_workflow(
           song_id=sds.song_id,
           sds=sds.dict()
       )
       return {"run_id": str(run.run_id), "status": run.status}

   @router.get("/runs/{run_id}")
   async def get_workflow_run(run_id: str):
       """Get workflow run status and outputs."""
       # Implementation

   @router.websocket("/events")
   async def workflow_events(websocket: WebSocket):
       """WebSocket endpoint for workflow events."""
       await event_publisher.connect(websocket)
       try:
           while True:
               await websocket.receive_text()
       except:
           await event_publisher.disconnect(websocket)
   ```

### Agent Assignments
- **Skills**: skill-builder, python-backend-engineer
- **Orchestrator**: python-backend-engineer
- **Events**: python-backend-engineer
- **Review**: code-reviewer, senior-code-reviewer

### Deliverables
- Claude Code skills for all workflow nodes
- Workflow orchestrator with graph execution
- Event publishing system
- WebSocket API for real-time events
- Validation and auto-fix logic
- Integration tests for complete workflow

### Success Criteria
- [x] All skills created and functional
- [x] Orchestrator executes complete workflow
- [x] Events stream to WebSocket clients
- [x] Validation with fix loop works
- [x] End-to-end test passes
- [x] Determinism verified (same seed → same output)

---

## Phase 5: UI Adaptation (10-15 days)

### Goals
- Create workflow dashboard
- Build song creation flow
- Adapt component library to AMCS domain
- Implement real-time workflow visualization

### Tasks

**Week 1: Core Components**

1. **Create workflow visualizer** (`/apps/web/src/components/workflow/WorkflowVisualizer.tsx`):
   ```typescript
   import { useWorkflowEvents } from '@/hooks/queries/useWorkflowEvents'

   interface Node {
     id: string
     status: 'pending' | 'running' | 'completed' | 'failed'
     duration?: number
     metrics?: Record<string, number>
   }

   export function WorkflowVisualizer({ runId }: { runId: string }) {
     const { events } = useWorkflowEvents(runId)

     const nodes: Node[] = [
       'PLAN', 'STYLE', 'LYRICS', 'PRODUCER',
       'COMPOSE', 'VALIDATE', 'RENDER', 'REVIEW'
     ].map(id => ({
       id,
       status: getNodeStatus(id, events),
       duration: getNodeDuration(id, events),
       metrics: getNodeMetrics(id, events)
     }))

     return (
       <div className="workflow-graph">
         {nodes.map(node => (
           <WorkflowNode key={node.id} node={node} />
         ))}
       </div>
     )
   }
   ```

2. **Create song creation form** (`/apps/web/src/components/songs/SongCreationForm.tsx`):
   ```typescript
   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   import { sdsSchema } from '@/lib/validation/sds'

   export function SongCreationForm() {
     const { register, handleSubmit } = useForm({
       resolver: zodResolver(sdsSchema)
     })

     const createWorkflowMutation = useCreateWorkflow()

     const onSubmit = async (data: SDS) => {
       const run = await createWorkflowMutation.mutateAsync(data)
       router.push(`/workflows/${run.run_id}`)
     }

     return (
       <form onSubmit={handleSubmit(onSubmit)}>
         <StyleSelector {...register('style_id')} />
         <LyricsConstraints {...register('lyrics')} />
         <ProducerPreferences {...register('producer_notes')} />
         <button type="submit">Create Song</button>
       </form>
     )
   }
   ```

3. **Adapt existing components** from MeatyPrompts:
   ```typescript
   // /apps/web/src/components/shared/DataTable.tsx (reuse as-is)
   // /apps/web/src/components/shared/Modal.tsx (reuse as-is)
   // /apps/web/src/components/shared/Toast.tsx (reuse as-is)
   // /apps/web/src/components/layouts/DashboardLayout.tsx (adapt navigation)
   ```

**Week 2: Dashboard & Real-time Updates**

1. **Create workflow dashboard** (`/apps/web/src/app/dashboard/page.tsx`):
   ```typescript
   import { useWorkflowRuns } from '@/hooks/queries/useWorkflowRuns'

   export default function DashboardPage() {
     const { data: runs, isLoading } = useWorkflowRuns()

     return (
       <DashboardLayout>
         <div className="space-y-6">
           <WorkflowStats runs={runs} />
           <RecentRuns runs={runs} />
           <ActiveWorkflows runs={runs.filter(r => r.status === 'running')} />
         </div>
       </DashboardLayout>
     )
   }
   ```

2. **Create WebSocket hook** (`/apps/web/src/hooks/useWorkflowEvents.ts`):
   ```typescript
   import { useEffect, useState } from 'react'

   export function useWorkflowEvents(runId: string) {
     const [events, setEvents] = useState<WorkflowEvent[]>([])

     useEffect(() => {
       const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/workflows/events`)

       ws.onmessage = (message) => {
         const event = JSON.parse(message.data)
         if (event.run_id === runId) {
           setEvents(prev => [...prev, event])
         }
       }

       return () => ws.close()
     }, [runId])

     return { events }
   }
   ```

3. **Create artifact viewer** (`/apps/web/src/components/artifacts/ArtifactViewer.tsx`):
   ```typescript
   export function ArtifactViewer({ artifact }: { artifact: Artifact }) {
     return (
       <div className="artifact-viewer">
         <ArtifactHeader artifact={artifact} />

         {artifact.type === 'style' && <StyleArtifact data={artifact.data} />}
         {artifact.type === 'lyrics' && <LyricsArtifact data={artifact.data} />}
         {artifact.type === 'producer' && <ProducerNotesArtifact data={artifact.data} />}
         {artifact.type === 'prompt' && <PromptArtifact data={artifact.data} />}

         <ArtifactMetadata
           hash={artifact.hash}
           citations={artifact.citations}
           scores={artifact.scores}
         />
       </div>
     )
   }
   ```

### Agent Assignments
- **Components**: ui-engineer
- **Hooks**: ui-engineer
- **Dashboard**: ui-engineer
- **Real-time**: ui-engineer
- **Review**: web-accessibility-checker, code-reviewer

### Deliverables
- Workflow visualizer component
- Song creation form
- Real-time workflow dashboard
- Artifact viewers
- WebSocket integration
- Responsive design

### Success Criteria
- [x] Workflow graph displays correctly
- [x] Real-time updates work via WebSocket
- [x] Song creation flow works end-to-end
- [x] Artifacts display correctly
- [x] Mobile responsive
- [x] Accessibility score >90

---

## File-by-File Migration Guide

### Copy As-Is (No Changes)

**Backend Infrastructure**:
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

**Frontend Infrastructure**:
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

**Shared Infrastructure**:
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

### Adapt (Modify)

**Backend Domain**:
- `/services/api/app/models/` → Delete prompt models, create AMCS models
- `/services/api/app/repositories/` → Delete prompt repos, create AMCS repos
- `/services/api/app/services/` → Delete prompt services, create AMCS services
- `/services/api/app/api/endpoints/` → Delete prompt endpoints, create workflow endpoints
- `/services/api/app/schemas/` → Delete prompt schemas, create AMCS schemas

**Frontend Domain**:
- `/apps/web/src/components/prompts/` → Delete, create `/components/songs/`
- `/apps/web/src/components/editor/` → Delete, create `/components/workflow/`
- `/apps/web/src/components/dashboard/` → Adapt to workflow metrics
- `/apps/web/src/app/(app)/` → Adapt routes to AMCS pages

**Claude Code**:
- `.claude/agents/` → Keep reviewers/pm, adapt dev-team descriptions
- `.claude/skills/` → Delete prompt skills, create workflow node skills

### Delete (Domain-Specific)

**Backend**:
```
/services/api/app/models/prompt*.py
/services/api/app/repositories/prompt*.py
/services/api/app/services/prompt*.py
/services/api/app/api/endpoints/prompts.py
/services/api/app/schemas/prompt*.py
```

**Frontend**:
```
/apps/web/src/components/prompts/
/apps/web/src/components/editor/
/apps/web/src/components/runs/ (adapt for workflow runs)
```

### Create New (AMCS-Specific)

**Backend**:
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

**Frontend**:
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

**Claude Code**:
```
/.claude/skills/plan-song/
/.claude/skills/style-generation/
/.claude/skills/lyrics-generation/
/.claude/skills/producer-notes/
/.claude/skills/prompt-composition/
/.claude/skills/validation/
/.claude/skills/auto-fix/
```

**Schemas & Config**:
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

**Repository Pattern**:
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

**Service Layer → Workflow Nodes**:
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

**Repository Layer → Artifact Storage**:
```python
# MeatyPrompts: Stores prompts
prompt_repo.create(Prompt(...))

# AMCS: Stores workflow artifacts
workflow_run_repo.update_node_output(run_id, 'STYLE', style_artifact)
workflow_run_repo.update_node_output(run_id, 'LYRICS', lyrics_artifact)
```

**Claude Code Skills → Workflow Orchestration**:
```yaml
# MeatyPrompts: prompt-builder skill
name: prompt-builder
description: Build and validate prompts

# AMCS: prompt-composition skill
name: prompt-composition
description: Merge style/lyrics/producer artifacts into render-ready prompt
```

---

## Risk Mitigation

### Potential Challenges

1. **Domain Model Complexity**:
   - **Risk**: AMCS entities more complex than MeatyPrompts
   - **Mitigation**: Start with minimal entity schemas, expand iteratively
   - **Validation**: JSON schema validation before implementation

2. **Workflow Orchestration**:
   - **Risk**: Graph execution more complex than CRUD operations
   - **Mitigation**: Build incrementally (single node → sequential → parallel → loops)
   - **Testing**: Isolated node tests before integration

3. **Determinism Requirements**:
   - **Risk**: Seed propagation and reproducibility
   - **Mitigation**: Unit tests for determinism, fixed test cases
   - **Validation**: 10-replay test with hash comparison

4. **Real-time Event Streaming**:
   - **Risk**: WebSocket stability and scaling
   - **Mitigation**: Use proven WebSocket patterns from MeatyPrompts
   - **Fallback**: Polling if WebSocket fails

### Divergence Management

**Track Upstream Changes**:
```bash
# Add MeatyPrompts as upstream remote
git remote add meatyprompts /path/to/meatyprompts
git fetch meatyprompts

# Cherry-pick infrastructure improvements
git cherry-pick meatyprompts/main -- services/api/app/core/
```

**Document Divergences**:
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

### Testing Strategy

**Migration Validation**:
```python
# /services/api/tests/test_migration_validation.py

def test_infrastructure_preserved():
    """Verify MeatyPrompts patterns preserved."""
    assert BaseRepository exists
    assert SecurityContext works
    assert OpenTelemetry configured

def test_domain_isolation():
    """Verify no MeatyPrompts domain code."""
    assert no Prompt models
    assert no PromptRepository
    assert only AMCS models exist

def test_determinism():
    """Verify workflow determinism."""
    sds = load_test_sds()
    run1 = execute_workflow(sds, seed=12345)
    run2 = execute_workflow(sds, seed=12345)
    assert run1.outputs == run2.outputs
```

---

## Success Metrics

### Time Saved vs Build From Scratch

| Component | From Scratch | Bootstrap | Actual | Savings |
|-----------|-------------|-----------|--------|---------|
| Backend Infrastructure | 4-5 weeks | 1 week | TBD | TBD |
| Database Setup | 2-3 weeks | 3-5 days | TBD | TBD |
| Observability | 2 weeks | 2 days | TBD | TBD |
| Authentication | 1-2 weeks | 2 days | TBD | TBD |
| Frontend Foundation | 3-4 weeks | 1-2 weeks | TBD | TBD |
| Claude Code | 1-2 weeks | 3-5 days | TBD | TBD |
| **Total** | **14-18 weeks** | **6-8 weeks** | **TBD** | **TBD** |

### Code Reuse Percentage

| Category | Target | Actual | Notes |
|----------|--------|--------|-------|
| Backend Infrastructure | 95% | TBD | config, db, observability, middleware |
| Base Patterns | 95% | TBD | repositories, security, errors |
| Frontend Infrastructure | 85% | TBD | api client, auth, telemetry, hooks |
| UI Components | 60% | TBD | shared components, layout |
| Claude Code | 70% | TBD | agents, skill patterns |
| **Overall** | **80%** | **TBD** | Weighted average |

### Technical Debt Assessment

**Inherited Debt** (from MeatyPrompts):
- [ ] Review cached repository patterns for AMCS applicability
- [ ] Assess multi-tenancy needs (may be simpler for AMCS)
- [ ] Evaluate authentication requirements (Clerk vs alternatives)

**New Debt** (AMCS-specific):
- [ ] Workflow orchestration complexity
- [ ] Determinism testing infrastructure
- [ ] Tag conflict matrix maintenance
- [ ] Blueprint versioning strategy

**Mitigation Plan**:
- Phase 6: Technical debt cleanup
- Monthly reviews of MeatyPrompts upstream changes
- Quarterly refactoring sprints

---

## Next Actions

### Immediate First Steps (Week 1)

1. **Day 1: Repository Setup**
   - Create MeatyMusic repository
   - Copy root configuration files
   - Set up monorepo structure
   - Initialize git, pnpm

2. **Day 2: Backend Foundation**
   - Copy backend infrastructure
   - Copy base patterns
   - Remove domain-specific code
   - Update configuration for MeatyMusic

3. **Day 3: Frontend Foundation**
   - Copy shared packages
   - Copy frontend infrastructure
   - Remove domain-specific components
   - Update API client configuration

4. **Day 4: Claude Code Setup**
   - Copy .claude/ directory
   - Adapt agent descriptions
   - Create CLAUDE.md
   - Test agent loading

5. **Day 5: Validation**
   - Verify backend starts
   - Verify frontend builds
   - Run infrastructure tests
   - Document migration log

### Decision Points

**Week 1 Gate**: Infrastructure Validated
- [ ] Backend starts without errors
- [ ] Frontend builds and runs
- [ ] Observability working
- [ ] Tests pass
- **Decision**: Proceed to Phase 2 or revisit infrastructure

**Week 2 Gate**: Database & Services Ready
- [ ] Migrations apply cleanly
- [ ] Health endpoints work
- [ ] Redis connection verified
- **Decision**: Proceed to Phase 3 or fix infrastructure issues

**Week 4 Gate**: Domain Models Complete
- [ ] All entity models created
- [ ] Repositories follow patterns
- [ ] Services enforce rules
- [ ] Tests pass >80% coverage
- **Decision**: Proceed to Phase 4 or refine models

**Week 7 Gate**: Orchestration Working
- [ ] All skills functional
- [ ] Orchestrator executes workflow
- [ ] Events stream correctly
- [ ] End-to-end test passes
- **Decision**: Proceed to Phase 5 or fix orchestration

**Week 9 Gate**: UI Complete
- [ ] Workflow visualizer works
- [ ] Real-time updates work
- [ ] Song creation flow works
- [ ] Accessibility >90
- **Decision**: Launch MVP or iterate

### Validation Gates

**Infrastructure Gate** (End of Phase 2):
```bash
# Backend
cd services/api && uvicorn main:app --reload
curl http://localhost:8000/health  # Should return 200

# Frontend
cd apps/web && pnpm dev
curl http://localhost:3000  # Should return 200

# Observability
# Check logs include trace IDs
# Check spans export to console/OTLP
```

**Domain Gate** (End of Phase 3):
```python
# Create style via API
response = requests.post('/api/v1/styles', json={
    'name': 'Test Pop Style',
    'genre': 'pop',
    'bpm_min': 120,
    'bpm_max': 130,
    'tags_positive': ['uplifting', 'energetic']
})
assert response.status_code == 201

# Verify in database
style = db.query(Style).first()
assert style.genre == 'pop'
```

**Orchestration Gate** (End of Phase 4):
```python
# Execute workflow
sds = {
    'song_id': 'uuid',
    'global_seed': 12345,
    'style_id': 'uuid',
    # ... complete SDS
}

run = await orchestrator.execute_workflow('song-id', sds)
assert run.status == 'completed'
assert 'STYLE' in run.node_outputs
assert 'LYRICS' in run.node_outputs
assert 'COMPOSE' in run.node_outputs
```

**UI Gate** (End of Phase 5):
```typescript
// E2E test
test('complete workflow from UI', async ({ page }) => {
  await page.goto('/songs/new')
  await page.fill('[name="title"]', 'Test Song')
  await page.selectOption('[name="genre"]', 'pop')
  await page.click('button[type="submit"]')

  // Should redirect to workflow page
  await expect(page).toHaveURL(/\/workflows\/.*/)

  // Should see workflow graph
  await expect(page.locator('.workflow-graph')).toBeVisible()

  // Should see completed status
  await expect(page.locator('[data-node="REVIEW"]')).toHaveAttribute('data-status', 'completed')
})
```

---

## Appendix: Key File Paths Reference

### MeatyPrompts Infrastructure (Copy As-Is)

**Backend Core**:
- `/services/api/app/core/config.py`
- `/services/api/app/core/async_database.py`
- `/services/api/app/core/logging.py`
- `/services/api/app/observability/tracing.py`
- `/services/api/app/middleware/correlation.py`
- `/services/api/app/middleware/request_logger.py`

**Backend Patterns**:
- `/services/api/app/repositories/base.py`
- `/services/api/app/core/security/security_context.py`
- `/services/api/app/core/security/unified_row_guard.py`
- `/services/api/app/errors.py`

**Frontend Core**:
- `/apps/web/src/lib/api/client.ts`
- `/apps/web/src/lib/auth/clerk.ts`
- `/apps/web/src/lib/telemetry/browser.ts`
- `/apps/web/src/contexts/AuthContext.tsx`

**Shared**:
- `/packages/ui/` (entire directory)
- `/packages/tokens/` (entire directory)
- `/.claude/settings.json`
- `/monitoring/` (entire directory)

### AMCS-Specific (Create New)

**Backend Domain**:
- `/services/api/app/models/song.py`
- `/services/api/app/models/style.py`
- `/services/api/app/models/lyrics.py`
- `/services/api/app/repositories/workflow_run_repo.py`
- `/services/api/app/services/workflow_orchestrator.py`

**Frontend Domain**:
- `/apps/web/src/components/workflow/WorkflowVisualizer.tsx`
- `/apps/web/src/components/songs/SongCreationForm.tsx`
- `/apps/web/src/hooks/useWorkflowEvents.ts`

**Schemas & Config**:
- `/schemas/sds.schema.json`
- `/taxonomies/tag_conflicts.json`
- `/limits/suno_limits.json`

---

**End of Bootstrap Plan**

**Next Steps**: Begin Phase 1 - Repository Setup & Cleanup
