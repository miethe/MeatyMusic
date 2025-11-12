# Phase 3: Domain Model Migration (10-15 days)

**Timeline**: 10-15 days (2-3 weeks)
**Effort**: 34 story points
**Dependencies**: Phase 2 complete
**Team**: python-backend-engineer, data-layer-expert, prd-writer, code-reviewer, senior-code-reviewer

---

## Goals

- Implement AMCS entity models (Style, Lyrics, Producer Notes, Song, Run)
- Create repositories following base patterns
- Create service layer for workflow operations
- Implement JSON schema validation

## Tasks

### Week 1: Entity Models

#### 1. Create base models (`/services/api/app/models/base.py`):
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

#### 2. Style model (`/services/api/app/models/style.py`):
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

#### 3. Lyrics model (`/services/api/app/models/lyrics.py`):
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

#### 4. Producer Notes model (`/services/api/app/models/producer_notes.py`):
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

#### 5. Song & Run models (`/services/api/app/models/song.py`):
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

### Week 2: Repositories & Services

#### 1. Create repositories (following base.py pattern):
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

#### 2. Create service layer (following service patterns):
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

#### 3. Create Pydantic schemas:
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

### Week 2-3: JSON Schema Validation

#### 1. Create JSON schemas (`/schemas/`):
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

#### 2. Create validation service:
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

## Agent Assignments

- **Models**: python-backend-engineer
- **Repositories**: python-backend-engineer
- **Services**: python-backend-engineer
- **Schemas**: prd-writer (JSON schemas), python-backend-engineer (Pydantic)
- **Review**: code-reviewer, senior-code-reviewer

## Deliverables

- Complete entity models (Style, Lyrics, Producer Notes, Song, Run)
- Repository layer for all entities
- Service layer with validation
- JSON schemas for all entities
- Alembic migrations for all tables
- Unit tests for models, repos, services

## Success Criteria

- [x] All entity models created
- [x] All repositories follow base pattern
- [x] Services enforce business rules
- [x] JSON schema validation works
- [x] Migrations apply cleanly
- [x] Tests pass (>80% coverage)

## Database Migrations

### Migration 002: AMCS Core Tables
```python
# /services/api/alembic/versions/002_amcs_core_tables.py
"""Create AMCS core tables: styles, songs, personas"""

def upgrade():
    op.create_table('styles',
        sa.Column('id', UUID(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('genre', sa.String(100), nullable=False),
        sa.Column('sub_genres', ARRAY(sa.String)),
        # ... all style columns
    )

    op.create_table('songs',
        sa.Column('id', UUID(), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('global_seed', sa.Integer, nullable=False),
        # ... all song columns
    )

    # Add indexes
    op.create_index('ix_styles_genre', 'styles', ['genre'])
    op.create_index('ix_songs_status', 'songs', ['status'])
```

### Migration 003: AMCS Artifact Tables
```python
# /services/api/alembic/versions/003_amcs_artifact_tables.py
"""Create artifact tables: lyrics, producer_notes, workflow_runs"""

def upgrade():
    op.create_table('lyrics',
        sa.Column('id', UUID(), primary_key=True),
        sa.Column('song_id', UUID(), sa.ForeignKey('songs.id')),
        # ... all lyrics columns
    )

    op.create_table('producer_notes',
        sa.Column('id', UUID(), primary_key=True),
        sa.Column('song_id', UUID(), sa.ForeignKey('songs.id')),
        # ... all producer notes columns
    )

    op.create_table('workflow_runs',
        sa.Column('id', UUID(), primary_key=True),
        sa.Column('song_id', UUID(), sa.ForeignKey('songs.id')),
        sa.Column('run_id', UUID(), unique=True),
        # ... all workflow run columns
    )
```

## Testing Strategy

### Unit Tests
- Model validation (constraints, defaults, relationships)
- Repository CRUD operations with RLS
- Service business logic (tag conflicts, BPM ranges)
- JSON schema validation (valid and invalid cases)

### Integration Tests
- Full repository → service → schema flow
- Transaction rollback on errors
- Multi-tenant data isolation
- Cascade deletes (song → lyrics → producer notes)

### Test Coverage Targets
- Models: >90%
- Repositories: >85%
- Services: >80%
- Overall: >80%

## Key Files Created

### Models
- `/services/api/app/models/base.py` - Base model with timestamps, tenant
- `/services/api/app/models/style.py` - Style specifications
- `/services/api/app/models/lyrics.py` - Lyrics with constraints
- `/services/api/app/models/producer_notes.py` - Producer guidance
- `/services/api/app/models/song.py` - Song entity
- `/services/api/app/models/workflow_run.py` - Workflow execution tracking
- `/services/api/app/models/persona.py` - Artist persona profiles

### Repositories
- `/services/api/app/repositories/style_repo.py`
- `/services/api/app/repositories/lyrics_repo.py`
- `/services/api/app/repositories/producer_notes_repo.py`
- `/services/api/app/repositories/song_repo.py`
- `/services/api/app/repositories/workflow_run_repo.py`

### Services
- `/services/api/app/services/style_service.py`
- `/services/api/app/services/song_service.py`
- `/services/api/app/services/validation_service.py`

### Schemas
- `/schemas/sds.schema.json` - Song Design Spec
- `/schemas/style.schema.json` - Style specification
- `/schemas/lyrics.schema.json` - Lyrics constraints
- `/schemas/producer_notes.schema.json` - Producer guidance

### Migrations
- `/services/api/alembic/versions/002_amcs_core_tables.py`
- `/services/api/alembic/versions/003_amcs_artifact_tables.py`

---

**Previous Phase**: [Phase 2: Infrastructure Preservation](./phase-2-infrastructure-preservation.md)
**Next Phase**: [Phase 4: Workflow Orchestration](./phase-4-workflow-orchestration.md)
**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
