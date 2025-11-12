# Phase 1: Core Entity Services (Backend)

**Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for implementation
**Duration**: 2-3 weeks
**Critical Path**: YES - Phase 2 (Aggregation) depends on this

---

## Phase Overview

### Goals

Phase 1 implements CRUD APIs for all 6 core entities with schema validation, RLS enforcement, and comprehensive testing. These services form the data persistence layer for the AMCS composition pipeline.

**Deliverables**:
1. Blueprint Service - Genre rules + scoring rubrics (READ-ONLY for users)
2. Style Service - Musical identity specs
3. Lyrics Service - Section-based lyric definitions
4. Persona Service - Reusable artist profiles
5. Producer Notes Service - Arrangement/mix guidance
6. Source Service - External knowledge registry + MCP integration

**Key Principles**:
- Schema-first: All validation against Phase 0 JSON schemas
- RLS-enforced: User isolation at database level
- Deterministic: Consistent responses for caching/replay
- Observable: Structured logging for debugging

### Dependencies

**Phase 0 Prerequisites** (MUST be complete):
- JSON schemas defined in `schemas/entities/`
- Postgres database with migrations applied
- FastAPI gateway scaffolding in `backend/gateway/`
- Auth middleware with JWT validation
- RLS policy templates

**External Dependencies**:
- Postgres 15+ with pgvector extension
- Redis for caching (optional but recommended)
- MCP server for Source service (TypeScript/Node.js)

### Parallel Work Opportunities

All 6 services can develop **concurrently** after Phase 0 completes:

```
Phase 0 Complete
    ├─> WP1: Blueprint Service (python-backend-engineer + data-layer-expert) [4 days]
    ├─> WP2: Style Service (python-backend-engineer) [5 days]
    ├─> WP3: Lyrics Service (python-backend-engineer) [5 days]
    ├─> WP4: Persona Service (python-backend-engineer) [4 days]
    ├─> WP5: Producer Notes Service (python-backend-engineer) [4 days]
    └─> WP6: Source Service + MCP (python-backend-engineer + backend-typescript-architect) [6 days]
```

**Optimal staffing**: 3 backend engineers (2 services each) + 1 TypeScript architect (MCP server)
**Total wall-clock time**: 6 days with full parallelization

---

## Common Patterns

### FastAPI Router Template

All services follow this structure:

```python
# backend/services/{entity}/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from backend.auth.dependencies import get_current_user, enforce_rls
from backend.database import get_db
from backend.models.{entity} import {Entity}
from backend.schemas.{entity} import {Entity}Create, {Entity}Update, {Entity}Response

router = APIRouter(prefix="/{entities}", tags=["{entities}"])

@router.get("/", response_model=List[{Entity}Response])
async def list_{entities}(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """List all {entities} for current user with pagination and optional search."""
    query = db.query({Entity}).filter({Entity}.user_id == user.id)
    if search:
        query = query.filter({Entity}.name.ilike(f"%{search}%"))
    total = await query.count()
    items = await query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.post("/", response_model={Entity}Response, status_code=201)
async def create_{entity}(
    payload: {Entity}Create,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create new {entity} with validation."""
    # Validate against JSON schema
    validate_against_schema(payload.dict(), "{entity}.schema.json")

    # Create database record
    db_{entity} = {Entity}(**payload.dict(), user_id=user.id)
    db.add(db_{entity})
    await db.commit()
    await db.refresh(db_{entity})
    return db_{entity}

@router.get("/{id}", response_model={Entity}Response)
async def get_{entity}(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Retrieve single {entity} by ID."""
    item = await db.get({Entity}, id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="{Entity} not found")
    return item

@router.put("/{id}", response_model={Entity}Response)
async def update_{entity}(
    id: UUID,
    payload: {Entity}Update,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update existing {entity}."""
    item = await db.get({Entity}, id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="{Entity} not found")

    # Validate partial update
    validate_against_schema(payload.dict(exclude_unset=True), "{entity}.schema.json")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(item, field, value)

    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{id}", status_code=204)
async def delete_{entity}(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Soft delete {entity}."""
    item = await db.get({Entity}, id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="{Entity} not found")

    item.deleted_at = datetime.utcnow()
    await db.commit()
    return None
```

### Validation Helper

```python
# backend/services/validation.py
import json
import jsonschema
from pathlib import Path
from functools import lru_cache

SCHEMA_DIR = Path(__file__).parent.parent.parent / "schemas" / "entities"

@lru_cache(maxsize=32)
def load_schema(schema_name: str):
    """Load and cache JSON schema."""
    schema_path = SCHEMA_DIR / f"{schema_name}.schema.json"
    with open(schema_path) as f:
        return json.load(f)

def validate_against_schema(data: dict, schema_name: str):
    """Validate data against JSON schema, raise HTTPException on failure."""
    schema = load_schema(schema_name)
    try:
        jsonschema.validate(data, schema)
    except jsonschema.ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={"message": "Validation failed", "errors": [str(e)]}
        )
```

### RLS Policy Enforcement

All tables include RLS policies applied at database level:

```sql
-- Applied in Phase 0 migrations
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON styles
    FOR ALL
    USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY admin_access ON styles
    FOR ALL
    USING (
        current_setting('app.user_role') = 'admin'
        OR user_id = current_setting('app.user_id')::uuid
    );
```

Database session helper sets RLS context:

```python
# backend/auth/rls.py
async def set_rls_context(db: AsyncSession, user_id: UUID, role: str):
    """Set RLS variables for current session."""
    await db.execute(f"SET LOCAL app.user_id = '{user_id}'")
    await db.execute(f"SET LOCAL app.user_role = '{role}'")
```

---

## WP1: Blueprint Service

**Agent Assignment**: python-backend-engineer + data-layer-expert
**Duration**: 4 days
**Priority**: CRITICAL - Other services validate against blueprints

### Overview

Blueprint service provides READ-ONLY access to genre algorithms (tempo ranges, required sections, scoring rubrics). Blueprints are admin-managed and constrain all other entities.

**Key Constraint**: Users can only READ blueprints. CREATE/UPDATE/DELETE require `admin` role.

### PRD Reference

See `docs/project_plans/PRDs/blueprint.prd.md` for full specification.

**Critical Validation Rules**:
- `tempo_bpm` must be `[min, max]` with `min <= max`
- `eval_rubric.weights` must sum to 1.0
- `required_sections` must be non-empty array
- `lexicon_positive` and `lexicon_negative` cannot overlap

### SQLAlchemy Model

```python
# backend/models/blueprint.py
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from backend.database import Base

class Blueprint(Base):
    __tablename__ = "blueprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    genre = Column(String, nullable=False, unique=True, index=True)
    version = Column(String, nullable=False)
    rules = Column(JSON, nullable=False)  # tempo_bpm, required_sections, lexicons, section_lines
    eval_rubric = Column(JSON, nullable=False)  # weights, thresholds

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=False)  # Admin user ID

    def __repr__(self):
        return f"<Blueprint {self.genre} v{self.version}>"
```

### Pydantic Schemas

```python
# backend/schemas/blueprint.py
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime

class BlueprintRules(BaseModel):
    tempo_bpm: List[int] = Field(..., min_items=2, max_items=2)
    required_sections: List[str]
    banned_terms: List[str] = []
    lexicon_positive: List[str] = []
    lexicon_negative: List[str] = []
    section_lines: Dict[str, Dict[str, int]] = {}

    @validator("tempo_bpm")
    def validate_tempo_range(cls, v):
        if v[0] > v[1]:
            raise ValueError("Minimum BPM must be <= maximum BPM")
        if not (40 <= v[0] <= 220 and 40 <= v[1] <= 220):
            raise ValueError("BPM must be between 40 and 220")
        return v

    @validator("lexicon_negative")
    def no_lexicon_overlap(cls, v, values):
        if "lexicon_positive" in values:
            overlap = set(v) & set(values["lexicon_positive"])
            if overlap:
                raise ValueError(f"Lexicons overlap: {overlap}")
        return v

class BlueprintRubric(BaseModel):
    weights: Dict[str, float]
    thresholds: Dict[str, float]

    @validator("weights")
    def weights_sum_to_one(cls, v):
        total = sum(v.values())
        if not (0.99 <= total <= 1.01):  # Allow floating point tolerance
            raise ValueError(f"Weights must sum to 1.0, got {total}")
        return v

class BlueprintCreate(BaseModel):
    genre: str
    version: str
    rules: BlueprintRules
    eval_rubric: BlueprintRubric

class BlueprintUpdate(BaseModel):
    version: Optional[str]
    rules: Optional[BlueprintRules]
    eval_rubric: Optional[BlueprintRubric]

class BlueprintResponse(BlueprintCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: UUID

    class Config:
        orm_mode = True
```

### Router Implementation

```python
# backend/services/blueprint/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from backend.auth.dependencies import get_current_user, require_admin
from backend.database import get_db
from backend.models.blueprint import Blueprint
from backend.schemas.blueprint import BlueprintCreate, BlueprintUpdate, BlueprintResponse

router = APIRouter(prefix="/blueprints", tags=["blueprints"])

@router.get("/", response_model=List[BlueprintResponse])
async def list_blueprints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    genre: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """List all blueprints (public read access)."""
    query = db.query(Blueprint)
    if genre:
        query = query.filter(Blueprint.genre.ilike(f"%{genre}%"))

    total = await query.count()
    items = await query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.get("/{id}", response_model=BlueprintResponse)
async def get_blueprint(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get single blueprint by ID."""
    blueprint = await db.get(Blueprint, id)
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return blueprint

@router.get("/by-genre/{genre}", response_model=BlueprintResponse)
async def get_blueprint_by_genre(
    genre: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get blueprint by genre name (exact match)."""
    blueprint = await db.query(Blueprint).filter(Blueprint.genre == genre).first()
    if not blueprint:
        raise HTTPException(status_code=404, detail=f"No blueprint for genre '{genre}'")
    return blueprint

@router.post("/", response_model=BlueprintResponse, status_code=201)
async def create_blueprint(
    payload: BlueprintCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_admin)  # Admin-only
):
    """Create new blueprint (admin only)."""
    # Check for duplicate genre
    existing = await db.query(Blueprint).filter(Blueprint.genre == payload.genre).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Blueprint for '{payload.genre}' already exists")

    blueprint = Blueprint(**payload.dict(), created_by=user.id)
    db.add(blueprint)
    await db.commit()
    await db.refresh(blueprint)
    return blueprint

@router.put("/{id}", response_model=BlueprintResponse)
async def update_blueprint(
    id: UUID,
    payload: BlueprintUpdate,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_admin)  # Admin-only
):
    """Update existing blueprint (admin only)."""
    blueprint = await db.get(Blueprint, id)
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(blueprint, field, value)

    blueprint.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(blueprint)
    return blueprint

@router.delete("/{id}", status_code=204)
async def delete_blueprint(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_admin)  # Admin-only
):
    """Delete blueprint (admin only). DANGEROUS: may break existing songs."""
    blueprint = await db.get(Blueprint, id)
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    await db.delete(blueprint)
    await db.commit()
    return None
```

### Unit Tests

```python
# backend/tests/test_blueprint_validation.py
import pytest
from backend.schemas.blueprint import BlueprintRules, BlueprintRubric

def test_tempo_range_validation():
    # Valid range
    rules = BlueprintRules(
        tempo_bpm=[100, 130],
        required_sections=["Verse", "Chorus"]
    )
    assert rules.tempo_bpm == [100, 130]

    # Invalid: min > max
    with pytest.raises(ValueError, match="Minimum BPM must be <= maximum"):
        BlueprintRules(tempo_bpm=[130, 100], required_sections=["Verse"])

    # Invalid: out of range
    with pytest.raises(ValueError, match="BPM must be between 40 and 220"):
        BlueprintRules(tempo_bpm=[10, 300], required_sections=["Verse"])

def test_weights_sum_validation():
    # Valid weights
    rubric = BlueprintRubric(
        weights={"hook_density": 0.3, "singability": 0.3, "rhyme": 0.2, "section": 0.2},
        thresholds={"min_total": 0.85}
    )
    assert sum(rubric.weights.values()) == 1.0

    # Invalid weights
    with pytest.raises(ValueError, match="Weights must sum to 1.0"):
        BlueprintRubric(
            weights={"hook_density": 0.5, "singability": 0.3},
            thresholds={"min_total": 0.85}
        )

def test_lexicon_overlap_validation():
    # Valid: no overlap
    rules = BlueprintRules(
        tempo_bpm=[100, 130],
        required_sections=["Verse"],
        lexicon_positive=["snow", "holly"],
        lexicon_negative=["sadness", "pain"]
    )

    # Invalid: overlap
    with pytest.raises(ValueError, match="Lexicons overlap"):
        BlueprintRules(
            tempo_bpm=[100, 130],
            required_sections=["Verse"],
            lexicon_positive=["snow", "holly"],
            lexicon_negative=["holly", "pain"]
        )
```

### Integration Tests

```python
# backend/tests/test_blueprint_api.py
import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_list_blueprints(client: AsyncClient, user_token: str):
    response = await client.get("/blueprints/", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

@pytest.mark.asyncio
async def test_create_blueprint_requires_admin(client: AsyncClient, user_token: str):
    payload = {
        "genre": "Test Genre",
        "version": "1.0",
        "rules": {
            "tempo_bpm": [100, 130],
            "required_sections": ["Verse", "Chorus"],
            "banned_terms": [],
            "lexicon_positive": [],
            "lexicon_negative": [],
            "section_lines": {}
        },
        "eval_rubric": {
            "weights": {"hook_density": 0.5, "singability": 0.5},
            "thresholds": {"min_total": 0.85}
        }
    }

    # Non-admin user should get 403
    response = await client.post("/blueprints/", json=payload, headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_blueprint_by_genre(client: AsyncClient, admin_token: str, user_token: str):
    # Admin creates blueprint
    payload = {...}  # Same as above
    create_response = await client.post("/blueprints/", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert create_response.status_code == 201

    # User can read by genre
    response = await client.get("/blueprints/by-genre/Test Genre", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    assert response.json()["genre"] == "Test Genre"
```

---

## WP2: Style Service

**Agent Assignment**: python-backend-engineer
**Duration**: 5 days

### Overview

Style service manages musical identity specs: genre, tempo, key, mood, instrumentation, and tags. Validates against blueprint constraints.

### PRD Reference

See `docs/project_plans/PRDs/style.prd.md`.

**Critical Validation Rules**:
- `tempo_bpm` must fall within blueprint range for genre
- `tags` cannot conflict per conflict matrix
- `instrumentation` limited to 3 items (warning, not error)
- `energy` must align with tempo (high energy + slow BPM = conflict warning)
- `key.primary` must match pattern `^[A-G](#|b)?\s?(major|minor)$`

### Pydantic Schemas

```python
# backend/schemas/style.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Union
from uuid import UUID
from datetime import datetime

class GenreDetail(BaseModel):
    primary: str
    subgenres: List[str] = []
    fusions: List[str] = []

class KeyDetail(BaseModel):
    primary: str = Field(..., regex=r"^[A-G](#|b)?\s?(major|minor)$")
    modulations: List[str] = []

class StyleCreate(BaseModel):
    name: str
    genre_detail: GenreDetail
    tempo_bpm: Union[int, List[int]] = Field(..., description="Single BPM or [min, max] range")
    time_signature: str = "4/4"
    key: KeyDetail
    mood: List[str]
    energy: str = Field(..., regex="^(low|medium|high|anthemic)$")
    instrumentation: List[str] = []
    vocal_profile: Optional[str] = None
    tags: List[str] = []
    negative_tags: List[str] = []

    @validator("tempo_bpm")
    def validate_tempo(cls, v):
        if isinstance(v, list):
            if len(v) != 2:
                raise ValueError("Tempo range must be [min, max]")
            if v[0] > v[1]:
                raise ValueError("Min tempo must be <= max tempo")
            if not (40 <= v[0] <= 220 and 40 <= v[1] <= 220):
                raise ValueError("Tempo must be between 40 and 220 BPM")
        elif isinstance(v, int):
            if not (40 <= v <= 220):
                raise ValueError("Tempo must be between 40 and 220 BPM")
        return v

    @validator("instrumentation")
    def warn_instrumentation_count(cls, v):
        if len(v) > 3:
            # Log warning but don't fail validation
            import logging
            logging.warning(f"Instrumentation has {len(v)} items (recommend <= 3 for clarity)")
        return v

class StyleUpdate(BaseModel):
    name: Optional[str]
    genre_detail: Optional[GenreDetail]
    tempo_bpm: Optional[Union[int, List[int]]]
    time_signature: Optional[str]
    key: Optional[KeyDetail]
    mood: Optional[List[str]]
    energy: Optional[str]
    instrumentation: Optional[List[str]]
    vocal_profile: Optional[str]
    tags: Optional[List[str]]
    negative_tags: Optional[List[str]]

class StyleResponse(StyleCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    validation_warnings: List[str] = []

    class Config:
        orm_mode = True
```

### Cross-Blueprint Validation

```python
# backend/services/style/validation.py
from backend.models.blueprint import Blueprint
from backend.schemas.style import StyleCreate
from sqlalchemy.ext.asyncio import AsyncSession

async def validate_style_against_blueprint(
    style: StyleCreate,
    db: AsyncSession
) -> List[str]:
    """Cross-validate style against blueprint constraints. Returns list of warnings."""
    warnings = []

    # Fetch blueprint for genre
    blueprint = await db.query(Blueprint).filter(
        Blueprint.genre == style.genre_detail.primary
    ).first()

    if not blueprint:
        warnings.append(f"No blueprint found for genre '{style.genre_detail.primary}'")
        return warnings

    # Validate tempo range
    bp_min, bp_max = blueprint.rules["tempo_bpm"]
    if isinstance(style.tempo_bpm, int):
        if not (bp_min <= style.tempo_bpm <= bp_max):
            warnings.append(
                f"Tempo {style.tempo_bpm} BPM outside blueprint range [{bp_min}, {bp_max}]"
            )
    elif isinstance(style.tempo_bpm, list):
        if style.tempo_bpm[0] < bp_min or style.tempo_bpm[1] > bp_max:
            warnings.append(
                f"Tempo range {style.tempo_bpm} outside blueprint range [{bp_min}, {bp_max}]"
            )

    # Check energy vs tempo alignment
    if style.energy in ["high", "anthemic"]:
        tempo_avg = style.tempo_bpm if isinstance(style.tempo_bpm, int) else sum(style.tempo_bpm) / 2
        if tempo_avg < 80:
            warnings.append(
                f"Energy '{style.energy}' may conflict with slow tempo {tempo_avg} BPM"
            )

    return warnings
```

### Router Implementation

```python
# backend/services/style/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.services.style.validation import validate_style_against_blueprint

router = APIRouter(prefix="/styles", tags=["styles"])

@router.post("/", response_model=StyleResponse, status_code=201)
async def create_style(
    payload: StyleCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create style with blueprint validation."""
    # Cross-validate against blueprint
    warnings = await validate_style_against_blueprint(payload, db)

    # Create style with warnings attached
    style = Style(**payload.dict(), user_id=user.id)
    db.add(style)
    await db.commit()
    await db.refresh(style)

    response = StyleResponse.from_orm(style)
    response.validation_warnings = warnings
    return response
```

---

## WP3: Lyrics Service

**Agent Assignment**: python-backend-engineer
**Duration**: 5 days

### PRD Reference

See `docs/project_plans/PRDs/lyrics.prd.md`.

**Critical Validation Rules**:
- All sections must be from blueprint's `required_sections`
- Line counts per section must be within `section_lines` constraints
- Profanity check against blueprint's `banned_terms`
- POV consistency across sections (if `constraints.consistent_pov = true`)

### Pydantic Schemas

```python
# backend/schemas/lyrics.py
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from uuid import UUID

class LyricSection(BaseModel):
    type: str  # Verse, Chorus, Bridge, etc.
    lines: List[str]
    rhyme_scheme: Optional[str] = None  # e.g., "ABAB"

    @validator("lines")
    def validate_non_empty_lines(cls, v):
        if not v:
            raise ValueError("Section must have at least one line")
        return v

class LyricsCreate(BaseModel):
    name: str
    sections: List[LyricSection]
    citations: List[Dict[str, str]] = []  # source_id, chunk_hash, text
    constraints: Dict[str, any] = {}  # explicit, consistent_pov, etc.

    @validator("sections")
    def validate_has_sections(cls, v):
        if not v:
            raise ValueError("Lyrics must have at least one section")
        return v
```

### Profanity Validation

```python
# backend/services/lyrics/validation.py
async def validate_lyrics_against_blueprint(
    lyrics: LyricsCreate,
    genre: str,
    db: AsyncSession
) -> List[str]:
    """Validate lyrics against blueprint constraints."""
    warnings = []

    blueprint = await db.query(Blueprint).filter(Blueprint.genre == genre).first()
    if not blueprint:
        return [f"No blueprint for genre '{genre}'"]

    # Check required sections
    section_types = {s.type for s in lyrics.sections}
    required = set(blueprint.rules["required_sections"])
    missing = required - section_types
    if missing:
        warnings.append(f"Missing required sections: {missing}")

    # Check section line counts
    for section in lyrics.sections:
        if section.type in blueprint.rules.get("section_lines", {}):
            constraints = blueprint.rules["section_lines"][section.type]
            line_count = len(section.lines)
            if line_count < constraints.get("min", 0):
                warnings.append(
                    f"{section.type} has {line_count} lines (min: {constraints['min']})"
                )
            if line_count > constraints.get("max", 999):
                warnings.append(
                    f"{section.type} has {line_count} lines (max: {constraints['max']})"
                )

    # Profanity check
    banned_terms = blueprint.rules.get("banned_terms", [])
    all_text = " ".join(line for section in lyrics.sections for line in section.lines).lower()
    found_terms = [term for term in banned_terms if term.lower() in all_text]
    if found_terms and not lyrics.constraints.get("explicit", False):
        warnings.append(f"Contains banned terms: {found_terms}")

    return warnings
```

---

## WP4: Persona Service

**Agent Assignment**: python-backend-engineer
**Duration**: 4 days

### PRD Reference

See `docs/project_plans/PRDs/persona.prd.md`.

**Key Features**:
- Reusable artist profiles with vocal range, influences, style preferences
- Can be shared across multiple songs
- Includes PII redaction for public releases

---

## WP5: Producer Notes Service

**Agent Assignment**: python-backend-engineer
**Duration**: 4 days

### PRD Reference

See `docs/project_plans/PRDs/producer_notes.prd.md`.

**Key Features**:
- Arrangement guidance per section
- Mix targets (reverb, compression, stereo width)
- Automation cues

---

## WP6: Source Service + MCP Integration

**Agent Assignment**: python-backend-engineer + backend-typescript-architect
**Duration**: 6 days (longest work package)

### Overview

Source service manages external knowledge registry with MCP server integration for retrieval. Includes provenance hashing for deterministic citations.

### PRD Reference

See `docs/project_plans/PRDs/sources.prd.md`.

### MCP Server (TypeScript)

```typescript
// backend/mcp-server/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "meatymusic-sources",
  version: "1.0.0"
}, {
  capabilities: {
    resources: {},
    tools: {}
  }
});

// Register source retrieval tool
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "retrieve_sources") {
    const { query, top_k, source_ids } = request.params.arguments;

    // Perform vector search with deterministic tie-breaking
    const results = await vectorSearch(query, top_k, source_ids);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(results)
      }]
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python Client

```python
# backend/services/sources/mcp_client.py
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def retrieve_sources(query: str, top_k: int = 5, source_ids: List[UUID] = None):
    """Call MCP server to retrieve sources with deterministic ranking."""
    server_params = StdioServerParameters(
        command="node",
        args=["backend/mcp-server/build/index.js"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "retrieve_sources",
                arguments={
                    "query": query,
                    "top_k": top_k,
                    "source_ids": [str(id) for id in source_ids] if source_ids else None
                }
            )

            return json.loads(result.content[0].text)
```

---

## Testing Strategy

### Unit Test Coverage Targets

- **Validation logic**: 100% (all constraint checks)
- **Pydantic models**: 95% (edge cases)
- **Business logic**: 90%

### Integration Test Requirements

All services must have:
1. **CRUD operations**: Test all endpoints (list, create, read, update, delete)
2. **RLS verification**: Test user isolation (user A cannot access user B's data)
3. **Schema validation**: Test rejection of invalid payloads
4. **Cross-entity validation**: Test blueprint constraints on dependent entities

### Example Integration Test

```python
# backend/tests/test_style_integration.py
@pytest.mark.asyncio
async def test_style_crud_flow(client: AsyncClient, user_token: str):
    # Create style
    payload = {
        "name": "Test Style",
        "genre_detail": {"primary": "Pop", "subgenres": [], "fusions": []},
        "tempo_bpm": 120,
        "key": {"primary": "C major", "modulations": []},
        "mood": ["upbeat"],
        "energy": "medium",
        "tags": []
    }

    response = await client.post("/styles/", json=payload, headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 201
    style_id = response.json()["id"]

    # Read style
    response = await client.get(f"/styles/{style_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    assert response.json()["name"] == "Test Style"

    # Update style
    response = await client.put(
        f"/styles/{style_id}",
        json={"name": "Updated Style"},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Style"

    # Delete style
    response = await client.delete(f"/styles/{style_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 204

    # Verify deleted
    response = await client.get(f"/styles/{style_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 404
```

### RLS Penetration Test

```python
@pytest.mark.asyncio
async def test_rls_user_isolation(client: AsyncClient, user1_token: str, user2_token: str):
    # User 1 creates style
    payload = {...}
    response = await client.post("/styles/", json=payload, headers={"Authorization": f"Bearer {user1_token}"})
    style_id = response.json()["id"]

    # User 2 cannot access User 1's style
    response = await client.get(f"/styles/{style_id}", headers={"Authorization": f"Bearer {user2_token}"})
    assert response.status_code == 404
```

---

## Success Criteria

### Phase 1 Exit Criteria

- [ ] All 6 entity services deployed with CRUD endpoints
- [ ] 100% schema validation compliance
- [ ] Unit test coverage >= 90%
- [ ] Integration test coverage >= 85%
- [ ] RLS policies verified for all services
- [ ] OpenAPI documentation auto-generated
- [ ] Blueprint service constrains Style/Lyrics services
- [ ] Source service MCP integration functional
- [ ] All endpoints respond < 200ms (P95, excluding database)

### Documentation Deliverables

- OpenAPI spec at `/docs` endpoint
- Service-level README for each entity
- Database migration scripts in `migrations/versions/`
- Test fixtures in `backend/tests/fixtures/`

### Handoff to Phase 2

Phase 1 completion enables:
- **Phase 2 (Aggregation)**: SDS compilation can query all entity endpoints
- **Phase 4 (Frontend)**: UI forms can call entity APIs
- **Phase 3 (Orchestration)**: Workflow skills can validate against blueprints

**Blocking Issues**:
- If any service is incomplete, Phase 2 cannot begin
- If Blueprint service is incomplete, other services cannot validate properly

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Blueprint constraints too strict | High - Blocks all songs | Provide override flag for admins |
| RLS performance degradation | Medium - Slow queries | Add user_id indexes, monitor query plans |
| MCP server crashes | High - No source retrieval | Implement retry logic + fallback cache |
| Schema changes break validation | High - Services unusable | Version schemas, maintain backward compatibility |

### Timeline Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Engineer unavailability | High - Delays Phase 2 | Cross-train on 2 services per engineer |
| Integration test delays | Medium - Uncertain quality | Start integration tests early (day 3) |
| Database migration issues | High - Rollback complexity | Test migrations on staging first |

---

## Appendix: Full Service Matrix

| Service | User CRUD | Admin CRUD | RLS | Blueprint Validation | MCP Integration |
|---------|-----------|------------|-----|----------------------|-----------------|
| Blueprint | Read | Full | No (public read) | N/A | No |
| Style | Full | N/A | Yes | Yes (tempo, energy) | No |
| Lyrics | Full | N/A | Yes | Yes (sections, profanity) | No |
| Persona | Full | N/A | Yes | No | No |
| Producer Notes | Full | N/A | Yes | No | No |
| Sources | Full | N/A | Yes | No | Yes (retrieval) |

---

**Document Status**: Ready for implementation
**Next Phase**: Phase 2 - Aggregation & SDS Compilation (depends on Phase 1 completion)
