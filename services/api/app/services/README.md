# MeatyMusic Service Layer Documentation

**Comprehensive Reference for Service Layer Implementation**

This guide documents the MeatyMusic service layer patterns, contracts, and best practices for all 9 services. It includes detailed documentation of the 5 new entity services implemented in Phase 2 (LyricsService, PersonaService, ProducerNotesService, BlueprintService, SourceService), plus the 4 existing services (StyleService, SongService, ValidationService, WorkflowService).

---

## Table of Contents

1. [Service Layer Overview](#1-service-layer-overview)
2. [BaseService Contract](#2-baseservice-contract)
3. [Service Implementation Pattern](#3-service-implementation-pattern)
4. [Service Catalog](#4-service-catalog)
5. [Shared Utilities](#5-shared-utilities)
6. [Error Handling](#6-error-handling-patterns)
7. [Testing Patterns](#7-testing-patterns)
8. [Dependency Injection](#8-dependency-injection)
9. [Service Contracts](#9-service-contract-interfaces)
10. [API Integration](#10-api-integration)
11. [Troubleshooting](#11-troubleshooting)
12. [Architecture Compliance](#12-architecture-compliance)

---

## 1. Service Layer Overview

### Purpose

The **Service Layer** implements MeatyMusic's business logic, sitting between the API layer and the Repository layer. Services are responsible for:

- **Business Logic Validation**: Apply domain rules and constraints
- **Transaction Management**: Atomic operations across multiple repositories
- **DTO Conversion**: Transform ORM models to API response objects
- **Error Handling**: Consistent error management with structured logging
- **Observability**: Emit structured events for tracing and debugging

### Architecture Position

```
┌─────────────────────────────────┐
│      API Layer (Routers)        │  FastAPI endpoints, HTTP validation
├─────────────────────────────────┤
│      SERVICE LAYER (THIS)       │◄─ Business logic, transactions, DTOs
├─────────────────────────────────┤
│   Repository Layer              │  Database queries, CRUD operations
├─────────────────────────────────┤
│   Models (SQLAlchemy ORM)       │  Entity definitions
├─────────────────────────────────┤
│   Database (PostgreSQL)         │  Persistent storage
└─────────────────────────────────┘
```

### When to Use Services

**Use Services for:**
- All business logic and validation
- Multi-step operations requiring transactions
- Cross-repository operations
- Determinism requirements (seed propagation, citation hashing)
- Policy enforcement (profanity filtering, artist normalization)
- Structured logging and observability

**Do NOT use Services for:**
- Simple single-query operations (direct repository calls from endpoints OK)
- Data transformation without business logic (use DTOs instead)
- Infrastructure concerns (handled by repositories)

### Key Responsibilities

| Responsibility | Example |
|---|---|
| **Business Logic** | Validate rhyme scheme matches lyrics structure |
| **Validation** | Check required fields before creation |
| **Transactions** | Ensure multiple updates succeed together or rollback |
| **DTO Conversion** | Convert ORM models to Pydantic response schemas |
| **Error Handling** | Convert exceptions to AppError with context |
| **Logging** | Emit structured events for observability |
| **Determinism** | Propagate seeds and compute citation hashes |

---

## 2. BaseService Contract

### Overview

`BaseService` is the abstract base class for all entity services in MeatyMusic. It provides:

- **Generic Type Safety**: Full type hints with 4 type parameters
- **Async Transaction Management**: Context manager with auto commit/rollback
- **DTO Conversion Utilities**: `to_response()` and `to_response_list()`
- **Structured Error Handling**: With logging and trace context
- **Validation Helpers**: `_validate_required_fields()` for business logic checks
- **Session Management**: Access to SQLAlchemy AsyncSession

### Type Parameters

```python
class BaseService(Generic[T, R, C, U]):
    """
    T: SQLAlchemy ORM model type (e.g., Lyrics, Style, Persona)
    R: Response DTO type (e.g., LyricsResponse) - Pydantic BaseModel
    C: Create DTO type (e.g., LyricsCreate) - Pydantic BaseModel
    U: Update DTO type (e.g., LyricsUpdate) - Pydantic BaseModel
    """
```

**Example Type Binding:**

```python
# Lyrics service binds types like this:
class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
    # Lyrics = ORM model
    # LyricsResponse = API response schema
    # LyricsCreate = Input schema for creation
    # LyricsUpdate = Input schema for updates
    ...
```

### Transaction Context Manager

The `transaction()` context manager provides automatic commit/rollback:

```python
async def create_entity(self, data: CreateDTO) -> ResponseDTO:
    """All database operations automatically committed or rolled back."""
    async with self.transaction():
        # Do work here
        entity = await self.repo.create(data)
        await self.related_repo.update(some_id, data)
        # Success → auto-commit
        # Error → auto-rollback (exceptions propagated)

    return self.to_response(entity)
```

**Transaction Lifecycle:**

```
1. Context enters → Transaction starts (debug log)
2. Code executes
   - Success → Commit (debug log: "transaction.commit")
   - Error (SQLAlchemy) → Rollback (error log with context)
   - Error (Other) → Rollback (error log with context)
3. Exception re-raised to caller
```

### DTO Conversion Methods

#### `to_response(model: Optional[T]) → Optional[R]`

Convert single ORM model to response DTO:

```python
# Get entity from database
lyrics = await self.repo.get_by_id(lyrics_id)

# Convert to response DTO
response = self.to_response(lyrics)
# Returns: LyricsResponse or None

# Safe with None
lyrics = None
response = self.to_response(lyrics)
# Returns: None (not an error)
```

#### `to_response_list(models: List[T]) → List[R]`

Convert list of ORM models to response DTOs:

```python
# Get entities
lyrics_list = await self.repo.get_by_song_id(song_id)

# Convert all
responses = self.to_response_list(lyrics_list)
# Returns: List[LyricsResponse]

# Empty list handling
lyrics_list = []
responses = self.to_response_list(lyrics_list)
# Returns: [] (empty list, safe)
```

### Error Handling Method

#### `_handle_error(error, operation, context=None) → AppError`

Handle and log errors with structured context:

```python
try:
    async with self.transaction():
        entity = await self.repo.create(data)
except Exception as e:
    # Log with full context
    raise await self._handle_error(
        error=e,
        operation="create_lyrics",
        context={
            "song_id": str(song_id),
            "user_id": str(user_id)
        }
    )
```

**Error Conversion:**
- `AppError` → returned as-is
- `SQLAlchemyError` → `BadRequestError`
- `ValueError` → `BadRequestError`
- Other → `InternalServerError`

### Validation Helper

#### `_validate_required_fields(data, required_fields, operation)`

Validate required fields are present and non-None:

```python
await self._validate_required_fields(
    data=create_dto,
    required_fields=["song_id", "text", "rhyme_scheme"],
    operation="create_lyrics"
)

# Raises BadRequestError if any field is None
# Error message: "Missing required fields for create_lyrics: field1, field2"
```

### Property Access

```python
# Access the database session if needed
session = self.session
# Returns: AsyncSession for custom operations
```

### Complete BaseService Example

```python
from app.services.base_service import BaseService
from app.models.lyrics import Lyrics
from app.schemas.lyrics import LyricsResponse, LyricsCreate, LyricsUpdate
from app.repositories.lyrics_repo import LyricsRepository
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from uuid import UUID

logger = structlog.get_logger(__name__)


class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
    """Service for lyrics entity with business logic and transactions."""

    def __init__(self, session: AsyncSession, repo: LyricsRepository):
        super().__init__(session, LyricsResponse)
        self.repo = repo

    async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
        """Create lyrics with transaction and validation."""
        # Validate required fields
        await self._validate_required_fields(
            data=data,
            required_fields=["song_id", "text"],
            operation="create_lyrics"
        )

        # Transaction with auto-commit/rollback
        async with self.transaction():
            lyrics = await self.repo.create(data)
            logger.info(
                "lyrics.created",
                lyrics_id=str(lyrics.id),
                song_id=str(lyrics.song_id)
            )
            return self.to_response(lyrics)

    async def get_lyrics(self, lyrics_id: UUID) -> Optional[LyricsResponse]:
        """Get lyrics by ID."""
        lyrics = await self.repo.get_by_id(lyrics_id)
        return self.to_response(lyrics)  # Safe with None

    async def update_lyrics(
        self, lyrics_id: UUID, data: LyricsUpdate
    ) -> Optional[LyricsResponse]:
        """Update lyrics with transaction."""
        async with self.transaction():
            existing = await self.repo.get_by_id(lyrics_id)
            if not existing:
                return None
            updated = await self.repo.update(lyrics_id, data)
            logger.info("lyrics.updated", lyrics_id=str(lyrics_id))
            return self.to_response(updated)
```

---

## 3. Service Implementation Pattern

### Standard Service Structure

Every service should follow this template for consistency:

```python
"""Service for [Entity] entity business logic."""

from typing import List, Optional, Dict, Any
from uuid import UUID
import structlog

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.base_service import BaseService
from app.repositories.[entity]_repo import [Entity]Repository
from app.schemas.[entity] import [Entity]Response, [Entity]Create, [Entity]Update
from app.models.[entity] import [Entity]
from app.errors import NotFoundError, BadRequestError

logger = structlog.get_logger(__name__)


class [Entity]Service(BaseService[[Entity], [Entity]Response, [Entity]Create, [Entity]Update]):
    """Service for [entity]-related operations with business logic and validation."""

    def __init__(self, session: AsyncSession, repo: [Entity]Repository):
        """Initialize service with dependencies."""
        super().__init__(session, [Entity]Response)
        self.repo = repo

    # CRUD OPERATIONS
    async def create_[entity](self, data: [Entity]Create) -> [Entity]Response:
        """Create new [entity] with validation."""
        # 1. Validate required fields
        await self._validate_required_fields(
            data=data,
            required_fields=["field1", "field2"],
            operation="create_[entity]"
        )

        # 2. Business logic validation
        # (check rules, constraints, policy)

        # 3. Create in transaction
        async with self.transaction():
            entity = await self.repo.create(data)
            logger.info("[entity].created", id=str(entity.id))
            return self.to_response(entity)

    async def get_[entity](self, entity_id: UUID) -> Optional[[Entity]Response]:
        """Get [entity] by ID."""
        entity = await self.repo.get_by_id(entity_id)
        return self.to_response(entity)

    async def list_[entities](
        self, skip: int = 0, limit: int = 10
    ) -> List[[Entity]Response]:
        """List [entities] with pagination."""
        entities = await self.repo.list(skip=skip, limit=limit)
        return self.to_response_list(entities)

    async def update_[entity](
        self, entity_id: UUID, data: [Entity]Update
    ) -> Optional[[Entity]Response]:
        """Update [entity] with validation."""
        async with self.transaction():
            existing = await self.repo.get_by_id(entity_id)
            if not existing:
                return None
            updated = await self.repo.update(entity_id, data)
            logger.info("[entity].updated", id=str(entity_id))
            return self.to_response(updated)

    async def delete_[entity](self, entity_id: UUID) -> bool:
        """Delete [entity]."""
        async with self.transaction():
            success = await self.repo.delete(entity_id)
            if success:
                logger.info("[entity].deleted", id=str(entity_id))
            return success

    # BUSINESS LOGIC METHODS
    async def validate_[constraint](self, entity_id: UUID) -> Dict[str, Any]:
        """Validate entity against constraint."""
        entity = await self.repo.get_by_id(entity_id)
        if not entity:
            raise NotFoundError(f"[Entity] {entity_id} not found")

        # Business logic validation
        is_valid = self._check_constraint(entity)

        logger.info(
            "[entity].validation",
            entity_id=str(entity_id),
            valid=is_valid
        )

        return {"valid": is_valid, "details": "..."}

    # HELPER METHODS (private)
    def _check_constraint(self, entity: [Entity]) -> bool:
        """Check if entity satisfies constraint."""
        # Implementation
        return True
```

### CRUD Operations Pattern

**CREATE:**
```python
async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
    """Create with validation, transaction, and logging."""
    await self._validate_required_fields(
        data=data,
        required_fields=["song_id", "text"],
        operation="create_lyrics"
    )

    async with self.transaction():
        lyrics = await self.repo.create(data)
        logger.info("lyrics.created", id=str(lyrics.id), song_id=str(lyrics.song_id))
        return self.to_response(lyrics)
```

**READ:**
```python
async def get_lyrics(self, lyrics_id: UUID) -> Optional[LyricsResponse]:
    """Get by ID (no transaction needed)."""
    lyrics = await self.repo.get_by_id(lyrics_id)
    return self.to_response(lyrics)
```

**UPDATE:**
```python
async def update_lyrics(
    self, lyrics_id: UUID, data: LyricsUpdate
) -> Optional[LyricsResponse]:
    """Update with existence check and transaction."""
    async with self.transaction():
        existing = await self.repo.get_by_id(lyrics_id)
        if not existing:
            return None  # Or raise NotFoundError
        updated = await self.repo.update(lyrics_id, data)
        logger.info("lyrics.updated", id=str(lyrics_id))
        return self.to_response(updated)
```

**DELETE:**
```python
async def delete_lyrics(self, lyrics_id: UUID) -> bool:
    """Delete with transaction and logging."""
    async with self.transaction():
        success = await self.repo.delete(lyrics_id)
        if success:
            logger.info("lyrics.deleted", id=str(lyrics_id))
        return success
```

### Business Logic Validation Methods

```python
# Method 1: Constraint validation
async def validate_rhyme_scheme(
    self, lyrics_id: UUID, expected_scheme: str
) -> Dict[str, Any]:
    """Validate against expected rhyme scheme."""
    lyrics = await self.repo.get_by_id(lyrics_id)
    if not lyrics:
        raise NotFoundError(f"Lyrics {lyrics_id} not found")

    is_valid = lyrics.rhyme_scheme == expected_scheme

    return {
        "valid": is_valid,
        "expected": expected_scheme,
        "actual": lyrics.rhyme_scheme
    }

# Method 2: Cross-entity validation
async def validate_song_lyrics(self, song_id: UUID) -> Dict[str, Any]:
    """Validate all lyrics for a song."""
    lyrics_list = await self.repo.get_by_song_id(song_id)

    # Validate constraints
    has_chorus = any(l.is_chorus for l in lyrics_list)
    total_duration = sum(l.duration for l in lyrics_list)

    return {
        "valid": has_chorus and total_duration > 60,
        "has_chorus": has_chorus,
        "total_duration": total_duration
    }

# Method 3: Integration with common utilities
async def validate_explicit_content(
    self, lyrics_id: UUID, explicit_allowed: bool = False
) -> Dict[str, Any]:
    """Validate lyrics for explicit content."""
    from app.services.common import check_explicit_content

    lyrics = await self.repo.get_by_id(lyrics_id)
    if not lyrics:
        raise NotFoundError(f"Lyrics {lyrics_id} not found")

    is_clean, violations = await check_explicit_content(
        lyrics.text,
        explicit_allowed=explicit_allowed
    )

    return {
        "is_clean": is_clean,
        "violations_found": violations,
        "allowed": explicit_allowed
    }
```

### Multi-Repository Operations

Services can coordinate multiple repositories for complex operations:

```python
class SongService(BaseService[Song, SongResponse, SongCreate, SongUpdate]):
    """Service managing songs with lyrics, style, and producer notes."""

    def __init__(
        self,
        session: AsyncSession,
        song_repo: SongRepository,
        lyrics_repo: LyricsRepository,
        style_repo: StyleRepository,
        producer_notes_repo: ProducerNotesRepository
    ):
        super().__init__(session, SongResponse)
        self.song_repo = song_repo
        self.lyrics_repo = lyrics_repo
        self.style_repo = style_repo
        self.producer_notes_repo = producer_notes_repo

    async def create_complete_song(
        self,
        song_data: SongCreate,
        lyrics_data: LyricsCreate,
        style_data: StyleCreate,
        producer_data: ProducerNotesCreate
    ) -> Dict[str, Any]:
        """Create song with all related entities in single transaction."""
        async with self.transaction():
            # Step 1: Create song
            song = await self.song_repo.create(song_data)

            # Step 2: Create lyrics referencing song
            lyrics_data.song_id = song.id
            lyrics = await self.lyrics_repo.create(lyrics_data)

            # Step 3: Create style
            style = await self.style_repo.create(style_data)

            # Step 4: Create producer notes
            producer_data.song_id = song.id
            producer = await self.producer_notes_repo.create(producer_data)

            # Step 5: Update song with references
            await self.song_repo.update(song.id, {
                "lyrics_id": lyrics.id,
                "style_id": style.id,
                "producer_notes_id": producer.id
            })

            logger.info(
                "song.complete_created",
                song_id=str(song.id),
                with_artifacts=True
            )

            return {
                "song": self.to_response(song),
                "lyrics": self.to_response(lyrics),
                "style": self.to_response(style),
                "producer": self.to_response(producer)
            }

    async def get_song_with_artifacts(
        self, song_id: UUID
    ) -> Dict[str, Any]:
        """Get song with all related artifacts."""
        song = await self.song_repo.get_by_id(song_id)
        if not song:
            raise NotFoundError(f"Song {song_id} not found")

        # Load all related entities
        lyrics_list = await self.lyrics_repo.get_by_song_id(song_id)
        style = await self.style_repo.get_by_id(song.style_id) if song.style_id else None
        producer = await self.producer_notes_repo.get_by_song_id(song_id)

        return {
            "song": self.to_response(song),
            "lyrics": self.to_response_list(lyrics_list),
            "style": self.to_response(style),
            "producer": self.to_response(producer)
        }
```

---

## 4. Service Catalog

This section documents the 5 new entity services implemented in Phase 2, along with their specific patterns, validations, and responsibilities.

### 4.1. LyricsService

**File:** `/services/api/app/services/lyrics_service.py`

**Purpose:** Business logic for lyrics entities with citation management, section validation, and rhyme scheme enforcement.

**Responsibilities:**
- CRUD operations for lyrics entities
- Section structure validation (must contain at least one Chorus)
- Rhyme scheme format validation (uppercase letters only)
- Explicit content filtering with profanity detection
- Reading level validation
- Citation management with deterministic hash computation
- Source weight normalization for retrieval

**Key Methods:**

```python
async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
    """Create lyrics with comprehensive validation."""
    # Validates section order contains "Chorus"
    # Validates rhyme scheme format
    # Checks explicit content if explicit_allowed=False
    # Validates reading level (elementary, middle, high_school, college)

async def validate_citations(self, citations: List[Dict]) -> bool:
    """Validate citations for deterministic hashing."""
    # Each citation must have source_id, chunk_text, weight
    # Weights normalized via normalize_weights()
    # Hashes computed deterministically

async def parse_citations_with_hashes(
    self,
    citations: List[Dict]
) -> List[Dict]:
    """Parse citations and compute SHA-256 hashes."""
    # Uses compute_citation_hash() from common.py
    # Same inputs always produce same hash (99%+ reproducibility)
```

**Validation Rules:**
- Section order must contain at least one "Chorus" (case-insensitive)
- Rhyme scheme: uppercase letters only (AABB, ABAB, ABCB, etc.)
- Explicit content: checked if `explicit_allowed=False`
- Reading level: one of ["elementary", "middle", "high_school", "college"]
- Citations: each must have source_id, chunk_text, weight > 0

**Example Usage:**

```python
from app.services.lyrics_service import LyricsService
from app.schemas.lyrics import LyricsCreate

service = LyricsService(session=db_session, repo=lyrics_repo)

# Create lyrics with validation
lyrics_data = LyricsCreate(
    song_id=song_id,
    section_order=["Verse", "Chorus", "Verse", "Chorus"],
    text="[Verse]\nLime and rhyme...\n[Chorus]\nHook line",
    rhyme_scheme="AABB",
    explicit_allowed=False,
    reading_level="high_school",
    citations=[
        {"source_id": src1, "chunk_text": "inspiration text", "weight": 0.7},
        {"source_id": src2, "chunk_text": "another text", "weight": 0.3}
    ]
)

response = await service.create_lyrics(lyrics_data)
# Returns: LyricsResponse with validated data and citation hashes

# Get lyrics by song
lyrics_list = await service.get_by_song_id(song_id)

# Validate structure
is_valid = await service.validate_citations(lyrics_data.citations)
```

**Dependencies:**
- **Repository:** LyricsRepository
- **Utilities:** common.py (validate_section_order, validate_rhyme_scheme, check_explicit_content, compute_citation_hash, normalize_weights)

**Reference:** See `/docs/project_plans/PRDs/lyrics.prd.md` for detailed lyrics specification

---

### 4.2. PersonaService

**File:** `/services/api/app/services/persona_service.py`

**Purpose:** Business logic for artist personas with influence normalization and vocal range validation.

**Responsibilities:**
- CRUD operations for persona entities
- Influence normalization (living artist policies for public releases)
- Vocal range validation (soprano, tenor, alto, bass, countertenor, mezzo-soprano)
- Delivery style validation with conflict detection
- Search and filtering operations

**Key Methods:**

```python
async def create_persona(self, data: PersonaCreate) -> PersonaResponse:
    """Create persona with validation."""
    # Validates vocal range is supported
    # Validates delivery styles for conflicts
    # Normalizes influences based on public_release flag

async def normalize_influences(
    self,
    influences: List[str],
    public_release: bool = False
) -> List[str]:
    """Normalize influence strings for policy compliance."""
    # For public releases: removes "style of <living artist>" references
    # Converts to generic influence language
    # Maintains reproducibility

async def validate_delivery_styles(
    self,
    delivery: List[str]
) -> Tuple[bool, List[Tuple[str, str]]]:
    """Validate delivery styles for conflicts."""
    # Checks for conflicting styles (e.g., "whisper" + "belting")
    # Returns conflicts found
```

**Validation Rules:**
- Vocal range: must be one of canonical set
- Delivery styles: checked for conflicts via conflict matrix
- Living artist influences: normalized for public releases (policy enforcement)
- Influences: generic terms (e.g., "melancholic" instead of "like Taylor Swift")

**Example Usage:**

```python
from app.services.persona_service import PersonaService
from app.schemas.persona import PersonaCreate

service = PersonaService(session=db_session, repo=persona_repo)

# Create persona
persona_data = PersonaCreate(
    name="Ethereal Vocalist",
    persona_type="artist",
    vocal_range="soprano",
    influences=["ethereal vocals", "ambient music", "indie folk"],
    delivery_styles=["legato", "sustain"],
    bio="A delicate, atmospheric vocalist"
)

response = await service.create_persona(persona_data)

# Normalize influences for public release
normalized = await service.normalize_influences(
    influences=["style of Adele", "powerful vocals"],
    public_release=True
)
# Returns: ["powerful vocals", "influenced by theatrical delivery"]

# Validate delivery styles
is_valid, conflicts = await service.validate_delivery_styles(
    delivery=["whisper", "belting"]  # Conflicting!
)
# Returns: (False, [("whisper", "belting")])
```

**Dependencies:**
- **Repository:** PersonaRepository
- **Utilities:** None (self-contained validation)

**Reference:** See `/docs/project_plans/PRDs/persona.prd.md` for persona specification

---

### 4.3. ProducerNotesService

**File:** `/services/api/app/services/producer_notes_service.py`

**Purpose:** Business logic for producer notes with mix settings validation and blueprint alignment.

**Responsibilities:**
- CRUD operations for producer notes
- Mix settings validation (LUFS, stereo width, reverb, etc.)
- Duration calculation and validation
- Structure alignment with lyrics sections
- Blueprint compliance validation
- Hook count and arrangement guidance

**Key Methods:**

```python
async def create_producer_notes(
    self,
    data: ProducerNotesCreate
) -> ProducerNotesResponse:
    """Create producer notes with validation."""
    # Validates mix targets (LUFS -20 to -5 dB)
    # Validates structure matches section order
    # Calculates total duration

async def validate_mix_settings(
    self,
    mix_targets: Dict[str, Any]
) -> Tuple[bool, Optional[str]]:
    """Validate mix settings against constraints."""
    # LUFS: -20.0 to -5.0 dB
    # Stereo width: "narrow", "normal", "wide"
    # Check coherence (energy/tempo matching)

async def validate_against_blueprint(
    self,
    notes_id: UUID,
    blueprint_id: UUID
) -> Tuple[bool, List[str]]:
    """Validate notes align with blueprint."""
    # Checks section structure against blueprint requirements
    # Validates tempo range
    # Checks required elements

async def validate_duration_against_target(
    self,
    notes_id: UUID,
    target_duration: int
) -> Tuple[bool, int]:
    """Validate duration within tolerance."""
    # Duration tolerance: ±30 seconds
    # Returns if valid and actual duration
```

**Validation Rules:**
- LUFS: -20.0 to -5.0 dB
- Stereo width: "narrow", "normal", or "wide"
- Structure: must match section order
- Duration: ±30 seconds from target
- Hook count: warning if zero
- Energy/Tempo coherence: high energy (8-10) ≠ slow tempo (< 90 BPM)

**Example Usage:**

```python
from app.services.producer_notes_service import ProducerNotesService
from app.schemas.producer_notes import ProducerNotesCreate

service = ProducerNotesService(
    session=db_session,
    repo=producer_notes_repo,
    blueprint_repo=blueprint_repo,  # Optional for validation
    lyrics_repo=lyrics_repo  # Optional for section validation
)

# Create producer notes
notes_data = ProducerNotesCreate(
    song_id=song_id,
    structure=["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
    section_durations={
        "Intro": 8,
        "Verse": 16,
        "Chorus": 16,
        "Bridge": 8,
        "Outro": 4
    },
    mix_targets={
        "lufs": -6.0,
        "stereo_width": "normal",
        "reverb_amount": 0.3,
        "compression_ratio": 4.0
    },
    hook_lines=["This is the hook line"],
    target_duration=180  # 3 minutes
)

response = await service.create_producer_notes(notes_data)

# Validate against blueprint
is_valid, issues = await service.validate_against_blueprint(
    notes_id=response.id,
    blueprint_id=blueprint_id
)

# Check duration
is_valid, actual_duration = await service.validate_duration_against_target(
    notes_id=response.id,
    target_duration=180
)
```

**Dependencies:**
- **Repository:** ProducerNotesRepository, BlueprintRepository (optional), LyricsRepository (optional)
- **Utilities:** None (self-contained validation)

**Reference:** See `/docs/project_plans/PRDs/producer_notes.prd.md` for details

---

### 4.4. BlueprintService

**File:** `/services/api/app/services/blueprint_service.py`

**Purpose:** Business logic for genre blueprints with markdown loading, caching, and tag conflict detection.

**Responsibilities:**
- Load blueprints from markdown files in `/docs/hit_song_blueprint/AI/`
- Cache blueprints in memory for performance
- Validate rubric weights (must sum to 1.0)
- Load and apply tag conflict matrix
- Validate tempo ranges and required sections
- Provide blueprint data to other services

**Key Methods:**

```python
def get_or_load_blueprint(
    self,
    genre: str,
    version: str = "latest"
) -> Blueprint:
    """Get blueprint from cache or load from file."""
    # Checks in-memory cache first
    # Loads from markdown if not cached
    # Returns parsed blueprint with metadata

def load_conflict_matrix(self) -> Dict[str, List[str]]:
    """Load tag conflict matrix from JSON."""
    # Loads from /taxonomies/conflict_matrix.json
    # Cached in memory
    # Used for tag validation

def get_tag_conflicts(
    self,
    tags: List[str]
) -> List[Tuple[str, str]]:
    """Get conflicting tags."""
    # Returns list of (tag1, tag2) conflicts
    # Validates against conflict matrix

def validate_rubric_weights(
    self,
    weights: Dict[str, float]
) -> Tuple[bool, Optional[str]]:
    """Validate rubric weights sum to 1.0."""
    # All weights must be positive
    # Sum must be 1.0 ± 0.01 tolerance
```

**Validation Rules:**
- Rubric weights sum to 1.0 (±0.01 tolerance)
- All weights positive
- Tempo range: min ≤ max
- Required sections present
- Tags don't have conflicts

**Example Usage:**

```python
from app.services.blueprint_service import BlueprintService

service = BlueprintService(blueprint_repo=blueprint_repo)

# Get blueprint from cache or load
blueprint = service.get_or_load_blueprint(genre="pop")
# Loads from /docs/hit_song_blueprint/AI/pop_blueprint.md if needed

# Check tag conflicts
conflicts = service.get_tag_conflicts(["whisper", "anthemic"])
# Returns: [("whisper", "anthemic")] - conflict detected

# Validate weights
is_valid, error = service.validate_rubric_weights({
    "hook_density": 0.25,
    "singability": 0.25,
    "rhyme_tightness": 0.25,
    "section_completeness": 0.25
})
# Returns: (True, None)

# Load conflict matrix
conflicts_matrix = service.load_conflict_matrix()
```

**Cache Management:**
- In-memory cache of blueprints for performance
- Invalidate cache with `invalidate_cache(genre)` or `invalidate_cache()` for all
- Returns count of invalidated entries

**Dependencies:**
- **Repository:** BlueprintRepository
- **Utilities:** common.py (normalize_weights)
- **File System:** `/docs/hit_song_blueprint/AI/*.md`, `/taxonomies/conflict_matrix.json`

**Reference:** See `/docs/hit_song_blueprint/` for blueprint files

---

### 4.5. SourceService

**File:** `/services/api/app/services/source_service.py`

**Purpose:** Business logic for external data sources with MCP integration and deterministic retrieval.

**Responsibilities:**
- Manage external data sources (files, APIs, MCP servers)
- MCP server discovery and validation
- Deterministic chunk retrieval with content hashing
- Citation management with SHA-256 hashing
- Weight normalization for retrieval weighting
- Allow/deny list validation for source access

**Key Methods:**

```python
def retrieve_chunks(
    self,
    source_id: UUID,
    query: str,
    top_k: int = 5,
    seed: Optional[int] = None
) -> List[ChunkWithHash]:
    """Retrieve chunks deterministically."""
    # Same query + seed = same chunks (99%+ reproducibility)
    # Uses fixed top-k with lexicographic tie-breaking
    # Includes SHA-256 content hashes

def retrieve_by_hash(
    self,
    source_id: UUID,
    chunk_hash: str
) -> Optional[Chunk]:
    """Retrieve chunk by content hash."""
    # Enables pinned retrieval for determinism
    # Returns chunk if hash matches

def normalize_source_weights(
    self,
    sources: List[Source]
) -> Dict[UUID, float]:
    """Normalize retrieval source weights."""
    # Weights sum to 1.0 maximum
    # Preserves relative proportions
    # Used for multi-source RAG

def discover_mcp_servers(self) -> List[MCPServerInfo]:
    """Discover available MCP servers."""
    # Lists configured MCP servers
    # Returns server info with capabilities and scopes

def validate_mcp_scopes(
    self,
    scopes: List[str],
    server_id: str
) -> Tuple[bool, Optional[str]]:
    """Validate MCP scopes for server."""
    # Checks if scopes are allowed for server
    # Enforces security policy
```

**Determinism Features:**
- Content hashing: SHA-256 for deterministic citation
- Pinned retrieval: same hash always retrieves same chunk
- Fixed seed: same seed + query = same results
- Lexicographic tie-breaking: resolves ambiguities consistently

**Example Usage:**

```python
from app.services.source_service import SourceService
from uuid import UUID

service = SourceService(source_repo=source_repo)

# Retrieve chunks deterministically
chunks = service.retrieve_chunks(
    source_id=source_uuid,
    query="inspiration for lyrics",
    top_k=5,
    seed=42  # Fixed seed for reproducibility
)
# Same inputs always return same chunks (99%+ reproducibility)

# Get chunk by hash (pinned retrieval)
chunk = service.retrieve_by_hash(
    source_id=source_uuid,
    chunk_hash="abc123def456..."  # SHA-256 hash
)

# Normalize weights for multi-source retrieval
sources = [
    {"id": src1, "weight": 0.7},
    {"id": src2, "weight": 0.5}
]
normalized = service.normalize_source_weights(sources)
# Returns: {src1: 0.583, src2: 0.417}

# Check MCP server capabilities
servers = service.discover_mcp_servers()
for server in servers:
    print(f"{server.id}: {server.capabilities}")

# Validate access scopes
is_valid, error = service.validate_mcp_scopes(
    scopes=["read:lyrics", "read:sources"],
    server_id="mcp_knowledge_base"
)
```

**Dependencies:**
- **Repository:** SourceRepository
- **Utilities:** common.py (compute_citation_hash, normalize_weights)
- **External:** MCP servers for source access

**Reference:** See `/docs/project_plans/PRDs/sources.prd.md` for source specification

---

## 5. Shared Utilities

The `common.py` module provides deterministic validation utilities used across ALL entity services.

### Citation Hash Computation (Deterministic)

**Purpose:** Track source citations reproducibly for RAG pipelines.

```python
from app.services.common import compute_citation_hash
from uuid import UUID

# Single citation hash
source_id = UUID("12345678-1234-1234-1234-123456789012")
chunk_text = "Some text from the source"

hash_val = compute_citation_hash(source_id, chunk_text)
# Returns: "abc123def456..." (64-char hex SHA-256)

# Same inputs ALWAYS produce same hash (deterministic!)
hash_val2 = compute_citation_hash(source_id, chunk_text)
assert hash_val == hash_val2  # Always true
```

**For Batch Operations:**

```python
from app.services.common import compute_citation_batch_hash

citations = [
    {"source_id": uuid1, "chunk_text": "chunk1"},
    {"source_id": uuid2, "chunk_text": "chunk2"},
    {"source_id": uuid3, "chunk_text": "chunk3"}
]

batch_hash = compute_citation_batch_hash(citations)
# Returns: combined hash of all citations
```

**Usage Pattern:**

```python
class LyricsService(BaseService[...]):
    async def create_lyrics_with_citations(
        self, data: LyricsCreate, citation_sources: List[Dict]
    ) -> LyricsResponse:
        """Create lyrics with tracked citations."""
        async with self.transaction():
            # Compute citation hashes for reproducibility
            citation_hashes = [
                compute_citation_hash(c["source_id"], c["chunk_text"])
                for c in citation_sources
            ]

            # Create lyrics with citation tracking
            lyrics = await self.repo.create({
                **data.model_dump(),
                "citation_hashes": citation_hashes
            })

            return self.to_response(lyrics)
```

### Rhyme Scheme Validation

**Validate Format:**

```python
from app.services.common import validate_rhyme_scheme

# Valid rhyme schemes
validate_rhyme_scheme("AABB")      # True
validate_rhyme_scheme("ABAB")      # True
validate_rhyme_scheme("ABCABC")    # True
validate_rhyme_scheme("AAAA")      # True

# Invalid rhyme schemes
validate_rhyme_scheme("ACBB")      # False (skips B)
validate_rhyme_scheme("aabb")      # False (lowercase)
validate_rhyme_scheme("A1B2")      # False (numbers)
validate_rhyme_scheme("")          # False (empty)
```

**Parse Rhyme Groups:**

```python
from app.services.common import parse_rhyme_scheme

lyrics_text = """Line 1
Line 2
Line 3
Line 4"""

groups = parse_rhyme_scheme(lyrics_text, "AABB")
# Returns: {
#   "A": ["Line 1", "Line 2"],
#   "B": ["Line 3", "Line 4"]
# }
```

**Check Rhyme Similarity:**

```python
from app.services.common import check_rhyme_similarity

score = check_rhyme_similarity("cat", "hat")       # 1.0 (perfect)
score = check_rhyme_similarity("love", "dove")    # 1.0
score = check_rhyme_similarity("cat", "dog")      # 0.0 (no match)
```

**Usage in Service:**

```python
class LyricsService(BaseService[...]):
    async def validate_lyrics_structure(
        self, lyrics_id: UUID
    ) -> Dict[str, Any]:
        """Validate lyrics match their rhyme scheme."""
        lyrics = await self.repo.get_by_id(lyrics_id)
        if not lyrics:
            raise NotFoundError(f"Lyrics {lyrics_id} not found")

        # Validate scheme format
        if not validate_rhyme_scheme(lyrics.rhyme_scheme):
            raise BadRequestError(f"Invalid rhyme scheme: {lyrics.rhyme_scheme}")

        # Parse and validate rhyme groups
        groups = parse_rhyme_scheme(lyrics.text, lyrics.rhyme_scheme)
        endings = extract_rhyme_endings(groups.values())

        # Check rhymes in each group
        valid = True
        for group_letter, lines in groups.items():
            rhyme_endings = extract_rhyme_endings(lines)
            # Verify all lines in group rhyme together
            for i, end1 in enumerate(rhyme_endings):
                for end2 in rhyme_endings[i+1:]:
                    similarity = check_rhyme_similarity(end1, end2)
                    if similarity < 0.8:  # Threshold
                        valid = False

        return {"valid": valid, "scheme": lyrics.rhyme_scheme}
```

### Weight Normalization

**Purpose:** Normalize source weights for retrieval weighting.

```python
from app.services.common import normalize_weights

# Weights exceeding 1.0
weights = {"src1": 0.5, "src2": 0.8}
normalized = normalize_weights(weights)
# Returns: {"src1": 0.385, "src2": 0.615}  # Sums to 1.0

# Already normalized
weights = {"src1": 0.3, "src2": 0.4}
normalized = normalize_weights(weights)
# Returns: {"src1": 0.3, "src2": 0.4}  # No change

# Custom max_sum
weights = {"src1": 2.0, "src2": 3.0}
normalized = normalize_weights(weights, max_sum=2.0)
# Returns: {"src1": 0.8, "src2": 1.2}  # Sums to 2.0
```

**Usage in Service:**

```python
class SourceService(BaseService[...]):
    async def normalize_source_weights(
        self, source_weights: Dict[str, float]
    ) -> Dict[str, float]:
        """Normalize weights for source retrieval."""
        normalized = normalize_weights(source_weights, max_sum=1.0)

        logger.info(
            "sources.weights_normalized",
            original_sum=sum(source_weights.values()),
            normalized_sum=sum(normalized.values())
        )

        return normalized
```

### Explicit Content Filtering

**Purpose:** Policy enforcement for explicit content.

```python
from app.services.common import (
    check_explicit_content,
    add_profanity_terms,
    get_profanity_list
)

# Check for profanity
is_clean, violations = await check_explicit_content("Hello world", explicit_allowed=False)
# Returns: (True, [])

is_clean, violations = await check_explicit_content("This is shit", explicit_allowed=False)
# Returns: (False, ["shit"])

# Allow explicit
is_clean, violations = await check_explicit_content("This is shit", explicit_allowed=True)
# Returns: (True, ["shit"])  # Allowed, violations still reported

# Extend profanity list
add_profanity_terms(["badword1", "badword2"])

# Get current list
profanity_list = get_profanity_list()
```

**Usage in Service:**

```python
class LyricsService(BaseService[...]):
    async def validate_and_filter_lyrics(
        self,
        data: LyricsCreate,
        explicit_allowed: bool = False
    ) -> LyricsResponse:
        """Create lyrics with explicit content validation."""
        # Check for explicit content
        is_clean, violations = await check_explicit_content(
            data.text,
            explicit_allowed=explicit_allowed
        )

        if not is_clean and not explicit_allowed:
            raise BadRequestError(
                f"Lyrics contain explicit terms not allowed: {violations}"
            )

        # Log if violations found (even if allowed)
        if violations:
            logger.warning(
                "lyrics.explicit_content_found",
                violations=violations,
                allowed=explicit_allowed
            )

        async with self.transaction():
            lyrics = await self.repo.create(data)
            return self.to_response(lyrics)
```

### Section Validation

**Purpose:** Validate lyrics structure with required sections.

```python
from app.services.common import (
    validate_section_order,
    extract_sections
)

# Validate section order
is_valid, error = validate_section_order(["Verse", "Chorus", "Verse", "Chorus"])
# Returns: (True, None)

is_valid, error = validate_section_order(["Verse", "Bridge"])
# Returns: (False, "Missing required section: Chorus")

# Validate with required sections
is_valid, error = validate_section_order(
    ["Verse", "Chorus"],
    required_sections=["Verse", "Chorus", "Bridge"]
)
# Returns: (False, "Missing required section: Bridge")

# Extract sections from text
lyrics_text = """[Verse]
Line 1
Line 2

[Chorus]
Hook line

[Bridge]
Bridge line"""

sections = extract_sections(lyrics_text)
# Returns: {
#   "Verse": ["Line 1", "Line 2"],
#   "Chorus": ["Hook line"],
#   "Bridge": ["Bridge line"]
# }
```

**Usage in Service:**

```python
class LyricsService(BaseService[...]):
    async def create_lyrics_with_structure(
        self,
        data: LyricsCreate,
        required_sections: Optional[List[str]] = None
    ) -> LyricsResponse:
        """Create lyrics with section validation."""
        # Extract sections from text
        sections = extract_sections(data.text)
        section_order = list(sections.keys())

        # Validate structure
        is_valid, error = validate_section_order(
            section_order,
            required_sections=required_sections
        )

        if not is_valid:
            raise BadRequestError(f"Invalid lyrics structure: {error}")

        async with self.transaction():
            lyrics = await self.repo.create({
                **data.model_dump(),
                "sections": sections,
                "section_order": section_order
            })
            return self.to_response(lyrics)
```

### Syllable Counting (Meter Validation)

**Purpose:** Validate meter and singability.

```python
from app.services.common import (
    count_syllables,
    calculate_syllable_consistency
)

# Count syllables in a line
count = count_syllables("The cat in the hat")
# Returns: 5

count = count_syllables("Beautiful music")
# Returns: 4

# Calculate consistency across lines
lines = [
    "The cat in the hat",       # 5 syllables
    "Sat on the mat",           # 4 syllables
    "Wearing a bat"             # 5 syllables
]

consistency = calculate_syllable_consistency(lines)
# Returns: 0.866 (high consistency)
```

**Usage in Service:**

```python
class LyricsService(BaseService[...]):
    async def validate_meter(
        self,
        lyrics_id: UUID,
        min_consistency: float = 0.8
    ) -> Dict[str, Any]:
        """Validate lyrics meter consistency."""
        lyrics = await self.repo.get_by_id(lyrics_id)
        if not lyrics:
            raise NotFoundError(f"Lyrics {lyrics_id} not found")

        # Split into lines
        lines = [line.strip() for line in lyrics.text.split("\n") if line.strip()]

        # Calculate consistency
        consistency = calculate_syllable_consistency(lines)

        # Get per-line syllable counts
        syllable_counts = [count_syllables(line) for line in lines]

        is_valid = consistency >= min_consistency

        logger.info(
            "lyrics.meter_validated",
            lyrics_id=str(lyrics_id),
            consistency=round(consistency, 3),
            valid=is_valid
        )

        return {
            "valid": is_valid,
            "consistency": consistency,
            "syllable_counts": syllable_counts,
            "mean_syllables": sum(syllable_counts) / len(syllable_counts)
        }
```

---

## 6. Error Handling Patterns

### Transaction Error Handling

The `transaction()` context manager handles errors automatically:

```python
async def create_entity(self, data: CreateDTO) -> ResponseDTO:
    """Errors automatically trigger rollback."""
    async with self.transaction():
        entity = await self.repo.create(data)

        # If any error occurs here:
        # 1. Exception is caught
        # 2. Transaction is rolled back
        # 3. Exception is re-raised

        await self.related_repo.update(id, data)
        return self.to_response(entity)
```

**Error Flow:**

```
1. Code in transaction block raises Exception
2. Caught by context manager
3. session.rollback() called
4. Error logged with context
5. Exception re-raised to caller
6. Endpoint error handler converts to HTTP response
```

### Service Error Handling

Use `_handle_error()` for consistent error handling:

```python
async def risky_operation(self, entity_id: UUID) -> ResponseDTO:
    """Handle errors with context."""
    try:
        async with self.transaction():
            entity = await self.repo.get_by_id(entity_id)
            if not entity:
                raise NotFoundError(f"Entity {entity_id} not found")

            # Risky operation
            result = await self.external_api.process(entity)

            return self.to_response(result)

    except Exception as e:
        # Log and convert to AppError with context
        raise await self._handle_error(
            error=e,
            operation="risky_operation",
            context={
                "entity_id": str(entity_id),
                "user_id": str(self.current_user_id),
                "additional_context": "relevant data"
            }
        )
```

### Validation Error Handling

```python
class LyricsService(BaseService[...]):
    async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
        """Create with comprehensive validation."""
        try:
            # 1. Required field validation
            await self._validate_required_fields(
                data=data,
                required_fields=["song_id", "text", "rhyme_scheme"],
                operation="create_lyrics"
            )

            # 2. Format validation
            if not validate_rhyme_scheme(data.rhyme_scheme):
                raise BadRequestError(
                    f"Invalid rhyme scheme: {data.rhyme_scheme}"
                )

            # 3. Content validation
            is_clean, violations = await check_explicit_content(
                data.text,
                explicit_allowed=False
            )
            if not is_clean:
                raise BadRequestError(
                    f"Lyrics contain explicit terms: {violations}"
                )

            # 4. Create with transaction
            async with self.transaction():
                lyrics = await self.repo.create(data)
                logger.info("lyrics.created", id=str(lyrics.id))
                return self.to_response(lyrics)

        except BadRequestError:
            # Already an AppError, let it propagate
            raise

        except Exception as e:
            # Handle unexpected errors
            raise await self._handle_error(
                error=e,
                operation="create_lyrics",
                context={"data": data.model_dump()}
            )
```

### Error Types and Conversions

| Error Type | HTTP Status | When to Use |
|---|---|---|
| `BadRequestError` | 400 | Validation failures, bad input, policy violations |
| `NotFoundError` | 404 | Entity not found by ID |
| `ConflictError` | 409 | Duplicate key, constraint violation |
| `InternalServerError` | 500 | Unexpected errors, database errors |
| `UnauthorizedError` | 401 | Authentication failures |
| `ForbiddenError` | 403 | Authorization failures |

### Structured Logging

All errors logged with context:

```python
logger.error(
    "lyrics.creation_failed",
    operation="create_lyrics",
    error_type="BadRequestError",
    error_message="Missing required fields: song_id",
    song_id="abc123",
    user_id="def456",
    exc_info=True  # Include stack trace
)
```

**Log Fields:**
- `event`: Event name (e.g., "lyrics.creation_failed")
- `operation`: Operation name (e.g., "create_lyrics")
- `error_type`: Exception type
- `error_message`: Human-readable error message
- `context`: Additional context (ids, data, etc.)
- `exc_info`: Stack trace flag
- `trace_id`: Automatically added by middleware (OpenTelemetry)

---

## 7. Testing Patterns

### Unit Test Structure

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

from app.services.lyrics_service import LyricsService
from app.schemas.lyrics import LyricsResponse, LyricsCreate, LyricsUpdate
from app.errors import NotFoundError, BadRequestError


class TestLyricsService:
    """Tests for LyricsService."""

    @pytest.fixture
    async def service(self):
        """Create service with mocked dependencies."""
        session_mock = AsyncMock()
        repo_mock = AsyncMock()
        service = LyricsService(session=session_mock, repo=repo_mock)
        return service

    @pytest.mark.asyncio
    async def test_create_lyrics_success(self, service):
        """Test successful lyrics creation."""
        # Arrange
        data = LyricsCreate(
            song_id=UUID("12345678-1234-1234-1234-123456789012"),
            text="Test lyrics",
            rhyme_scheme="AABB"
        )

        expected_lyrics = MagicMock(
            id=UUID("87654321-4321-4321-4321-210987654321"),
            song_id=data.song_id,
            text=data.text,
            rhyme_scheme=data.rhyme_scheme
        )

        service.repo.create.return_value = expected_lyrics

        # Act
        result = await service.create_lyrics(data)

        # Assert
        assert isinstance(result, LyricsResponse)
        assert str(result.song_id) == str(data.song_id)
        service.repo.create.assert_called_once_with(data)
        service.session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_lyrics_missing_field(self, service):
        """Test validation error on missing field."""
        # Arrange
        data = LyricsCreate(
            song_id=UUID("12345678-1234-1234-1234-123456789012"),
            text=None,  # Missing required field
            rhyme_scheme="AABB"
        )

        # Act & Assert
        with pytest.raises(BadRequestError):
            await service.create_lyrics(data)

        service.repo.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_lyrics_transaction_rollback(self, service):
        """Test transaction rollback on error."""
        # Arrange
        data = LyricsCreate(
            song_id=UUID("12345678-1234-1234-1234-123456789012"),
            text="Test lyrics",
            rhyme_scheme="AABB"
        )

        # Simulate database error
        service.repo.create.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(Exception):
            await service.create_lyrics(data)

        service.session.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_lyrics_found(self, service):
        """Test getting existing lyrics."""
        # Arrange
        lyrics_id = UUID("87654321-4321-4321-4321-210987654321")

        expected_lyrics = MagicMock(
            id=lyrics_id,
            text="Test lyrics",
            rhyme_scheme="AABB"
        )

        service.repo.get_by_id.return_value = expected_lyrics

        # Act
        result = await service.get_lyrics(lyrics_id)

        # Assert
        assert isinstance(result, LyricsResponse)
        assert result.id == lyrics_id
        service.repo.get_by_id.assert_called_once_with(lyrics_id)

    @pytest.mark.asyncio
    async def test_get_lyrics_not_found(self, service):
        """Test getting non-existent lyrics."""
        # Arrange
        lyrics_id = UUID("87654321-4321-4321-4321-210987654321")
        service.repo.get_by_id.return_value = None

        # Act
        result = await service.get_lyrics(lyrics_id)

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_lyrics_success(self, service):
        """Test successful deletion."""
        # Arrange
        lyrics_id = UUID("87654321-4321-4321-4321-210987654321")
        service.repo.delete.return_value = True

        # Act
        result = await service.delete_lyrics(lyrics_id)

        # Assert
        assert result is True
        service.repo.delete.assert_called_once_with(lyrics_id)
        service.session.commit.assert_called_once()
```

### Integration Test Structure

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.lyrics_service import LyricsService
from app.repositories.lyrics_repo import LyricsRepository
from app.schemas.lyrics import LyricsCreate, LyricsUpdate
from app.models.lyrics import Lyrics


@pytest.mark.integration
class TestLyricsServiceIntegration:
    """Integration tests with real database."""

    @pytest.mark.asyncio
    async def test_create_and_retrieve_lyrics(self, async_db_session: AsyncSession):
        """Test creating and retrieving lyrics from database."""
        # Setup
        repo = LyricsRepository(async_db_session)
        service = LyricsService(session=async_db_session, repo=repo)

        # Create
        create_data = LyricsCreate(
            song_id=song_id,
            text="Test lyrics",
            rhyme_scheme="AABB"
        )

        response = await service.create_lyrics(create_data)

        # Retrieve
        retrieved = await service.get_lyrics(response.id)

        # Assert
        assert retrieved.id == response.id
        assert retrieved.text == create_data.text
        assert retrieved.rhyme_scheme == create_data.rhyme_scheme

    @pytest.mark.asyncio
    async def test_update_lyrics(self, async_db_session: AsyncSession):
        """Test updating lyrics."""
        # Setup
        repo = LyricsRepository(async_db_session)
        service = LyricsService(session=async_db_session, repo=repo)

        # Create
        create_data = LyricsCreate(...)
        response = await service.create_lyrics(create_data)

        # Update
        update_data = LyricsUpdate(text="Updated lyrics")
        updated = await service.update_lyrics(response.id, update_data)

        # Assert
        assert updated.text == "Updated lyrics"
        assert updated.id == response.id

    @pytest.mark.asyncio
    async def test_transaction_rollback_on_error(self, async_db_session: AsyncSession):
        """Test transaction rollback on error."""
        # Setup
        repo = LyricsRepository(async_db_session)
        service = LyricsService(session=async_db_session, repo=repo)

        # Create initially
        initial_count = await repo.count()

        # Attempt creation with error
        try:
            await service.create_lyrics(invalid_data)
        except Exception:
            pass

        # Verify count unchanged (rollback worked)
        final_count = await repo.count()
        assert final_count == initial_count
```

### Testing Common Utilities

```python
import pytest
from uuid import UUID

from app.services.common import (
    compute_citation_hash,
    validate_rhyme_scheme,
    check_explicit_content,
    validate_section_order,
    count_syllables
)


class TestCommonUtilities:
    """Tests for common.py utilities."""

    def test_compute_citation_hash_determinism(self):
        """Test citation hash is deterministic."""
        source_id = UUID("12345678-1234-1234-1234-123456789012")
        chunk_text = "Test chunk"

        hash1 = compute_citation_hash(source_id, chunk_text)
        hash2 = compute_citation_hash(source_id, chunk_text)

        assert hash1 == hash2  # Deterministic

    def test_validate_rhyme_scheme_valid(self):
        """Test valid rhyme schemes."""
        assert validate_rhyme_scheme("AABB")
        assert validate_rhyme_scheme("ABAB")
        assert validate_rhyme_scheme("ABCABC")

    def test_validate_rhyme_scheme_invalid(self):
        """Test invalid rhyme schemes."""
        assert not validate_rhyme_scheme("ACBB")
        assert not validate_rhyme_scheme("aabb")
        assert not validate_rhyme_scheme("")

    @pytest.mark.asyncio
    async def test_check_explicit_content(self):
        """Test explicit content checking."""
        # Clean
        is_clean, violations = await check_explicit_content(
            "Hello world",
            explicit_allowed=False
        )
        assert is_clean
        assert len(violations) == 0

        # Explicit not allowed
        is_clean, violations = await check_explicit_content(
            "This is shit",
            explicit_allowed=False
        )
        assert not is_clean
        assert "shit" in violations

        # Explicit allowed
        is_clean, violations = await check_explicit_content(
            "This is shit",
            explicit_allowed=True
        )
        assert is_clean
        assert "shit" in violations

    def test_validate_section_order(self):
        """Test section order validation."""
        # Valid
        is_valid, error = validate_section_order(["Verse", "Chorus"])
        assert is_valid

        # Missing chorus
        is_valid, error = validate_section_order(["Verse", "Bridge"])
        assert not is_valid
        assert "Chorus" in error

    def test_count_syllables(self):
        """Test syllable counting."""
        assert count_syllables("The cat in the hat") == 5
        assert count_syllables("Beautiful") == 3
        assert count_syllables("") == 0
```

### Test Coverage Targets

- **Unit Tests**: 90% coverage per service
- **Integration Tests**: Cover critical paths (create, update, delete, list)
- **Error Tests**: Verify all error paths and rollback scenarios
- **Utility Tests**: Verify determinism and edge cases

---

## 8. Dependency Injection

### Constructor Injection Pattern

Services receive all dependencies via constructor:

```python
class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
    """Service injected with all dependencies."""

    def __init__(
        self,
        session: AsyncSession,
        repo: LyricsRepository
    ):
        super().__init__(session, LyricsResponse)
        self.repo = repo
```

### Creating Dependency Functions

**In `app/api/dependencies.py`:**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.db.session import get_db_session
from app.repositories.lyrics_repo import LyricsRepository
from app.services.lyrics_service import LyricsService


async def get_lyrics_repository(
    session: AsyncSession = Depends(get_db_session)
) -> LyricsRepository:
    """Get LyricsRepository instance."""
    return LyricsRepository(session)


async def get_lyrics_service(
    session: AsyncSession = Depends(get_db_session),
    repo: LyricsRepository = Depends(get_lyrics_repository)
) -> LyricsService:
    """Get LyricsService instance."""
    return LyricsService(session=session, repo=repo)
```

### Using Dependencies in Endpoints

**In `app/api/v1/endpoints/lyrics.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.api.dependencies import get_lyrics_service
from app.services.lyrics_service import LyricsService
from app.schemas.lyrics import LyricsCreate, LyricsResponse, LyricsUpdate
from app.errors import NotFoundError

router = APIRouter(prefix="/lyrics", tags=["lyrics"])


@router.post("/", response_model=LyricsResponse, status_code=201)
async def create_lyrics(
    data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """Create new lyrics."""
    return await service.create_lyrics(data)


@router.get("/{lyrics_id}", response_model=LyricsResponse)
async def get_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """Get lyrics by ID."""
    lyrics = await service.get_lyrics(lyrics_id)
    if not lyrics:
        raise HTTPException(status_code=404, detail="Lyrics not found")
    return lyrics


@router.patch("/{lyrics_id}", response_model=LyricsResponse)
async def update_lyrics(
    lyrics_id: UUID,
    data: LyricsUpdate,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """Update lyrics."""
    lyrics = await service.update_lyrics(lyrics_id, data)
    if not lyrics:
        raise HTTPException(status_code=404, detail="Lyrics not found")
    return lyrics


@router.delete("/{lyrics_id}", status_code=204)
async def delete_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service)
) -> None:
    """Delete lyrics."""
    success = await service.delete_lyrics(lyrics_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lyrics not found")
```

### Multiple Repository Dependencies

For services with multiple repositories:

**In `app/api/dependencies.py`:**

```python
async def get_song_service(
    session: AsyncSession = Depends(get_db_session),
    song_repo: SongRepository = Depends(get_song_repository),
    lyrics_repo: LyricsRepository = Depends(get_lyrics_repository),
    style_repo: StyleRepository = Depends(get_style_repository),
    producer_repo: ProducerNotesRepository = Depends(get_producer_notes_repository)
) -> SongService:
    """Get SongService with all dependencies."""
    return SongService(
        session=session,
        song_repo=song_repo,
        lyrics_repo=lyrics_repo,
        style_repo=style_repo,
        producer_repo=producer_repo
    )
```

**In service:**

```python
class SongService(BaseService[Song, SongResponse, SongCreate, SongUpdate]):
    """Service with multiple repository dependencies."""

    def __init__(
        self,
        session: AsyncSession,
        song_repo: SongRepository,
        lyrics_repo: LyricsRepository,
        style_repo: StyleRepository,
        producer_repo: ProducerNotesRepository
    ):
        super().__init__(session, SongResponse)
        self.song_repo = song_repo
        self.lyrics_repo = lyrics_repo
        self.style_repo = style_repo
        self.producer_repo = producer_repo
```

### Optional Dependencies

For optional services or configurations:

```python
from typing import Optional

async def get_caching_lyrics_service(
    session: AsyncSession = Depends(get_db_session),
    repo: LyricsRepository = Depends(get_lyrics_repository),
    cache_service: Optional[CacheService] = None
) -> LyricsService:
    """Get LyricsService with optional caching."""
    service = LyricsService(session=session, repo=repo)
    if cache_service:
        service.cache = cache_service
    return service
```

---

## 9. Service Contract Interfaces

### Standard Service Contract

All entity services must implement these standard operations:

#### CRUD Operations

```python
class [Entity]Service(BaseService[[Entity], [Entity]Response, [Entity]Create, [Entity]Update]):
    """Standard service contract for entity operations."""

    async def create_[entity](self, data: [Entity]Create) -> [Entity]Response:
        """Create new entity."""
        # Must:
        # - Validate required fields
        # - Execute in transaction
        # - Return response DTO
        # - Log success
        ...

    async def get_[entity](self, entity_id: UUID) -> Optional[[Entity]Response]:
        """Get entity by ID."""
        # Must:
        # - Return response DTO or None
        # - NOT raise error if not found
        ...

    async def list_[entities](
        self,
        skip: int = 0,
        limit: int = 10
    ) -> List[[Entity]Response]:
        """List entities with pagination."""
        # Must:
        # - Support skip and limit
        # - Return list of response DTOs
        # - Handle empty results
        ...

    async def update_[entity](
        self,
        entity_id: UUID,
        data: [Entity]Update
    ) -> Optional[[Entity]Response]:
        """Update entity."""
        # Must:
        # - Execute in transaction
        # - Return response DTO or None
        # - NOT raise error if not found
        # - Log changes
        ...

    async def delete_[entity](self, entity_id: UUID) -> bool:
        """Delete entity."""
        # Must:
        # - Execute in transaction
        # - Return True if deleted, False if not found
        # - Log deletion
        ...
```

#### Return Type Consistency

| Operation | Return Type | Notes |
|---|---|---|
| Create | `ResponseDTO` | Always succeeds or raises error |
| Read | `Optional[ResponseDTO]` | None if not found |
| List | `List[ResponseDTO]` | Empty list if none found |
| Update | `Optional[ResponseDTO]` | None if not found |
| Delete | `bool` | True if deleted, False if not found |

**Rationale:**
- Consistency across all services
- Clear semantics (None = not found, not error)
- Allows clean error handling in endpoints

### Entity-Specific Operations

Services can add entity-specific operations beyond CRUD:

```python
class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
    """Standard CRUD plus lyrics-specific operations."""

    # Standard CRUD (required)
    async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse: ...
    async def get_lyrics(self, lyrics_id: UUID) -> Optional[LyricsResponse]: ...
    async def list_lyrics(self, skip: int = 0, limit: int = 10) -> List[LyricsResponse]: ...
    async def update_lyrics(self, lyrics_id: UUID, data: LyricsUpdate) -> Optional[LyricsResponse]: ...
    async def delete_lyrics(self, lyrics_id: UUID) -> bool: ...

    # Lyrics-specific operations (optional)
    async def get_by_song_id(self, song_id: UUID) -> List[LyricsResponse]:
        """Get all lyrics for a song."""
        ...

    async def validate_rhyme_scheme(
        self, lyrics_id: UUID, expected_scheme: str
    ) -> Dict[str, Any]:
        """Validate against expected rhyme scheme."""
        ...

    async def validate_structure(
        self, lyrics_id: UUID
    ) -> Dict[str, Any]:
        """Validate lyrics structure and content."""
        ...
```

### Response Consistency

All responses must follow standard format:

```python
# Success response (201 Created)
{
    "id": "uuid",
    "created_at": "2025-11-14T12:34:56Z",
    "updated_at": "2025-11-14T12:34:56Z",
    # Entity-specific fields
    "name": "...",
    "data": {...}
}

# Error response (400, 404, 500, etc.)
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable message",
        "details": {...}  // Optional
    },
    "request_id": "trace_id"
}
```

---

## 10. API Integration

### Endpoint Structure

Endpoints delegate to services and handle HTTP details:

```python
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_lyrics_service
from app.services.lyrics_service import LyricsService
from app.schemas.lyrics import LyricsCreate, LyricsResponse, LyricsUpdate
from app.errors import NotFoundError

router = APIRouter(prefix="/api/v1/lyrics", tags=["lyrics"])


# CREATE
@router.post("/", response_model=LyricsResponse, status_code=status.HTTP_201_CREATED)
async def create_lyrics(
    data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """
    Create new lyrics.

    - **song_id**: ID of the song
    - **text**: Lyrics text
    - **rhyme_scheme**: AABB, ABAB, etc.
    """
    try:
        return await service.create_lyrics(data)
    except BadRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("create_lyrics_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# READ
@router.get("/{lyrics_id}", response_model=LyricsResponse)
async def get_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """Get lyrics by ID."""
    lyrics = await service.get_lyrics(lyrics_id)
    if not lyrics:
        raise HTTPException(status_code=404, detail="Lyrics not found")
    return lyrics


# LIST
@router.get("/", response_model=List[LyricsResponse])
async def list_lyrics(
    skip: int = 0,
    limit: int = 10,
    service: LyricsService = Depends(get_lyrics_service)
) -> List[LyricsResponse]:
    """List lyrics with pagination."""
    return await service.list_lyrics(skip=skip, limit=limit)


# UPDATE
@router.patch("/{lyrics_id}", response_model=LyricsResponse)
async def update_lyrics(
    lyrics_id: UUID,
    data: LyricsUpdate,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """Update lyrics."""
    lyrics = await service.update_lyrics(lyrics_id, data)
    if not lyrics:
        raise HTTPException(status_code=404, detail="Lyrics not found")
    return lyrics


# DELETE
@router.delete("/{lyrics_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service)
) -> None:
    """Delete lyrics."""
    success = await service.delete_lyrics(lyrics_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lyrics not found")
```

### Service Error → HTTP Mapping

| Service Behavior | HTTP Response |
|---|---|
| `raise BadRequestError(msg)` | 400 Bad Request |
| `raise NotFoundError(msg)` | 404 Not Found |
| `raise ConflictError(msg)` | 409 Conflict |
| `return None` from read/update | 404 Not Found (check endpoint) |
| `return False` from delete | 404 Not Found (check endpoint) |
| Unexpected exception | 500 Internal Server Error |

### Dependency Injection in Endpoints

```python
# Single service dependency
@router.post("/")
async def create_lyrics(
    data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    return await service.create_lyrics(data)


# Multiple dependencies
@router.post("/with_style")
async def create_lyrics_with_style(
    lyrics_data: LyricsCreate,
    style_data: StyleCreate,
    lyrics_service: LyricsService = Depends(get_lyrics_service),
    style_service: StyleService = Depends(get_style_service)
) -> Dict[str, Any]:
    lyrics = await lyrics_service.create_lyrics(lyrics_data)
    style = await style_service.create_style(style_data)
    return {"lyrics": lyrics, "style": style}
```

### Error Handling in Endpoints

```python
from app.errors import AppError

@router.post("/")
async def create_lyrics(
    data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service)
) -> LyricsResponse:
    """Create with proper error handling."""
    try:
        return await service.create_lyrics(data)

    except AppError as e:
        # AppError has status_code attribute
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        # Unexpected errors
        logger.error(
            "create_lyrics_failed",
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 11. Troubleshooting

### Transaction Errors

**Problem:** `sqlalchemy.exc.InvalidRequestError: Transaction is already begun`

**Cause:** Nested transactions or session mismanagement

**Solution:**
```python
# WRONG: Nested manual transaction management
async with self.transaction():
    async with self.session.begin():  # Don't do this!
        ...

# RIGHT: Use transaction() context manager only
async with self.transaction():
    ...
```

---

**Problem:** Transaction doesn't commit

**Cause:** Exception not caught by context manager

**Solution:**
```python
# WRONG: Catching exception prevents commit
try:
    async with self.transaction():
        entity = await self.repo.create(data)
except Exception:
    pass  # Exception caught, commit never happens

# RIGHT: Let context manager handle it
async with self.transaction():
    entity = await self.repo.create(data)
# Commit happens automatically if no exception
```

---

**Problem:** `RuntimeError: coroutine was never awaited`

**Cause:** Forgot `await` on repository call

**Solution:**
```python
# WRONG
entity = self.repo.get_by_id(entity_id)

# RIGHT
entity = await self.repo.get_by_id(entity_id)
```

---

### DTO Conversion Errors

**Problem:** `ValueError: Failed to convert Lyrics to LyricsResponse`

**Cause:** ORM model missing required field for response DTO

**Solution:**
```python
# Check response schema requires field
# Make sure ORM model has that field populated
# Ensure schema has ConfigDict(from_attributes=True)

from pydantic import ConfigDict

class LyricsResponse(BaseModel):
    id: UUID
    text: str
    # ... all required fields

    model_config = ConfigDict(from_attributes=True)
```

---

### Service Dependency Issues

**Problem:** `TypeError: __init__() missing 1 required positional argument`

**Cause:** Missing dependency injection or incorrect parameter

**Solution:**
```python
# Check endpoint has Depends()
@router.post("/")
async def create_lyrics(
    data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service)  # Must have Depends()
) -> LyricsResponse:
    return await service.create_lyrics(data)
```

---

**Problem:** `AttributeError: 'NoneType' object has no attribute 'get_by_id'`

**Cause:** Service not properly initialized or dependency is None

**Solution:**
```python
# Check service __init__
def __init__(self, session: AsyncSession, repo: LyricsRepository):
    super().__init__(session, LyricsResponse)
    self.repo = repo  # Must assign all dependencies

# Check dependency function
async def get_lyrics_service(...) -> LyricsService:
    return LyricsService(session=session, repo=repo)
    # Both session and repo must be provided
```

---

### Validation Errors

**Problem:** Validation fails with cryptic Pydantic error

**Cause:** Input data doesn't match schema

**Solution:**
```python
# Use _validate_required_fields for required field checks
await self._validate_required_fields(
    data=create_dto,
    required_fields=["song_id", "text"],
    operation="create_lyrics"
)

# For complex validation, provide clear error messages
if not validate_rhyme_scheme(data.rhyme_scheme):
    raise BadRequestError(
        f"Invalid rhyme scheme '{data.rhyme_scheme}'. "
        f"Valid formats: AABB, ABAB, ABCB"
    )
```

---

### Common Utility Issues

**Problem:** `Citation hash changes between runs`

**Cause:** Non-deterministic input (timestamp, random data)

**Solution:**
```python
# Use deterministic inputs for citations
# Don't use current timestamp unless pinned
hash1 = compute_citation_hash(source_id, chunk_text)  # Same every time

# OK to use fixed timestamp
from datetime import datetime
timestamp = datetime(2025, 11, 14, 12, 0, 0)
hash2 = compute_citation_hash(source_id, chunk_text, timestamp)
```

---

**Problem:** Rhyme validation fails unexpectedly

**Cause:** Lyrics text contains section markers or formatting issues

**Solution:**
```python
# Extract sections first
sections = extract_sections(lyrics_text)

# Validate structure
is_valid, error = validate_section_order(list(sections.keys()))

# Then validate rhymes within each section
for section_name, lines in sections.items():
    validate_rhyme_scheme(expected_scheme)
    # Check rhymes match
```

---

### Performance Issues

**Problem:** Service calls very slow

**Cause:** Unnecessary logging at debug level

**Solution:**
```python
# Log at appropriate level
logger.info("entity.created", id=str(entity.id))  # Business events

# Debug logs for details
logger.debug("validation.check", field="rhyme_scheme", value="AABB")
```

---

**Problem:** Memory usage growing in tests

**Cause:** Test session not properly cleaned up

**Solution:**
```python
# Use pytest fixtures with proper cleanup
@pytest.fixture
async def service(async_db_session):
    """Create service with cleanup."""
    service = LyricsService(
        session=async_db_session,
        repo=LyricsRepository(async_db_session)
    )
    yield service
    # Cleanup happens after test
    await async_db_session.close()
```

---

### Async/Await Issues

**Problem:** `RuntimeError: no running event loop`

**Cause:** Async test not marked with `@pytest.mark.asyncio`

**Solution:**
```python
# WRONG
def test_create_lyrics():
    result = await service.create_lyrics(data)

# RIGHT
@pytest.mark.asyncio
async def test_create_lyrics():
    result = await service.create_lyrics(data)
```

---

**Problem:** `SyntaxWarning: 'await' outside async function`

**Cause:** Trying to await outside async function

**Solution:**
```python
# WRONG
service_method = service.create_lyrics(data)  # Returns coroutine
print(service_method)  # Prints <coroutine object>

# RIGHT
result = await service.create_lyrics(data)  # Awaits result
```

---

### When to Ask for Help

Review these resources before asking:

1. **Service Usage**: `BASE_SERVICE_USAGE.md` in this directory
2. **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md` for architecture details
3. **Related PRD**: `/docs/project_plans/PRDs/[entity].prd.md` for entity details
4. **Existing Implementation**: Look at similar services for patterns
5. **Error Logs**: Structured logs contain trace_id for debugging

---

## 12. Architecture Compliance

This section documents how the service layer implementation maintains MeatyMusic's architectural standards and validation requirements.

### Dependency Graph Validation

**Status:** ✓ **PASSED** - No circular dependencies detected

The service layer forms a Directed Acyclic Graph (DAG) with clear dependency levels:

```
Level 0 (No Service Dependencies):
  - PersonaService
  - ValidationService

Level 1 (Uses Common Utilities):
  - LyricsService
  - BlueprintService
  - SourceService
  - StyleService

Level 2 (Aggregators):
  - SongService (uses ValidationService)
  - WorkflowService (uses WorkflowOrchestrator, EventPublisher)
```

**Verification:** See `/services/api/app/services/DEPENDENCIES.md` for detailed dependency matrix.

### Transaction Management

All services use synchronous transaction management via `BaseService.transaction()`:

- **Atomic Operations:** Multiple repository operations within single transaction
- **Automatic Commit/Rollback:** Context manager handles success/error paths
- **Error Logging:** Structured logging with trace context
- **Determinism:** Session state isolated per request

**Pattern:**
```python
with self.transaction():
    entity = self.repo.create(data)
    # Auto-commit on success, auto-rollback on error
```

### Error Handling Consistency

All services follow consistent error handling patterns:

| Error Type | HTTP Status | Usage |
|---|---|---|
| `BadRequestError` | 400 | Validation failures, bad input |
| `NotFoundError` | 404 | Entity not found by ID |
| `ConflictError` | 409 | Duplicate, constraint violation |
| `InternalServerError` | 500 | Unexpected errors |

**Pattern:**
```python
async def _handle_error(error, operation, context) -> AppError:
    # Converts exceptions to appropriate AppError types
    # Logs with structured context
    # Returns or raises AppError
```

### Determinism Requirements

Services maintain determinism for reproducibility:

**LyricsService:**
- Citation hashing via `compute_citation_hash()` (SHA-256)
- Same inputs always produce same hash
- 99%+ reproducibility across runs

**SourceService:**
- Deterministic chunk retrieval with seed
- SHA-256 content hashing for pinned retrieval
- Lexicographic tie-breaking for deterministic ordering

**Pattern:**
```python
# Same seed + query = same chunks (99%+ reproducibility)
chunks = service.retrieve_chunks(
    source_id=uuid,
    query="search text",
    seed=42  # Fixed seed
)
```

### Validation Strategy

Each service implements three levels of validation:

**1. Schema Validation (Pydantic)**
- Input DTOs validated before entering service
- Type coercion and basic constraints

**2. Business Logic Validation (Service)**
- Domain-specific rules (section order, rhyme scheme, mix settings)
- Cross-entity constraints (duration tolerance, blueprint alignment)
- Policy enforcement (profanity, living artist influences)

**3. Optional Detailed Validation (Repository)**
- Database constraints (unique keys, foreign keys)
- Actual data persistence checks

**Example (LyricsService):**
```python
# 1. Pydantic validates LyricsCreate schema
async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
    # 2. Service validates business logic
    await self._validate_required_fields(data, ["text", "section_order"], ...)
    is_valid, error = validate_section_order(data.section_order)
    if not is_valid:
        raise BadRequestError(error)

    # 3. Repository persists with constraints
    with self.transaction():
        lyrics = await self.repo.create(data)
```

### Testing Requirements

Each service must meet coverage targets:

- **Unit Tests:** 90% coverage per service
- **Integration Tests:** Create, read, update, delete, list operations
- **Error Tests:** All error paths and rollback scenarios
- **Determinism Tests:** Same inputs produce same outputs (for LyricsService, SourceService)

**Reference:** See section 7 (Testing Patterns) for complete testing guide.

### Performance Constraints

All services respect MeatyMusic performance targets:

- **P95 Latency:** ≤ 60s for end-to-end plan→prompt flow (excluding render)
- **Database Queries:** Minimize N+1 patterns via eager loading
- **Caching:** In-memory caching for blueprints (via BlueprintService)
- **Weight Operations:** Use efficient normalize_weights() implementation

**Service-Specific Performance:**
- LyricsService: O(n) for citation hashing where n = citation count
- BlueprintService: O(1) for cached blueprint retrieval
- SourceService: O(log k) for top-k retrieval with seed

### Observability & Logging

All services emit structured logs for observability:

**Standard Log Fields:**
- `operation`: Method name (e.g., "create_lyrics")
- `entity_type`: Entity being operated on
- `entity_id`: Primary key if available
- `duration_ms`: Operation duration
- `error_type`: Exception type if failed
- `trace_id`: OpenTelemetry trace ID (automatic)

**Pattern:**
```python
logger.info(
    "lyrics.created",
    lyrics_id=str(lyrics.id),
    song_id=str(lyrics.song_id),
    section_count=len(lyrics.sections)
)

logger.error(
    "lyrics.creation_failed",
    operation="create_lyrics",
    error_type=type(e).__name__,
    error_message=str(e),
    exc_info=True
)
```

### Related Documentation

For detailed architecture information, see:

1. **Dependency Analysis:** `/services/api/app/services/DEPENDENCIES.md`
   - Complete dependency matrix
   - Circular dependency validation
   - Service-to-repository mappings

2. **Architecture Validation:** `/services/api/app/services/ARCHITECTURE_VALIDATION.md`
   - Layer separation verification
   - Transaction pattern compliance
   - Error handling consistency

3. **Base Service Usage:** `/services/api/app/services/BASE_SERVICE_USAGE.md`
   - Transaction management details
   - DTO conversion patterns
   - Error handling examples

4. **Implementation Summary:** `/services/api/app/services/IMPLEMENTATION_SUMMARY.md`
   - Phase completion status
   - Service implementation checklist
   - Deliverables summary

5. **Project PRDs:** `/docs/project_plans/PRDs/`
   - Entity-specific requirements
   - Business logic specifications
   - Validation rules and constraints

---

## Summary

This documentation provides everything needed to implement and maintain MeatyMusic service layer:

✅ **Service Layer Overview** - Understand purpose and position
✅ **BaseService Contract** - Use the abstract base class
✅ **Implementation Pattern** - Follow standard structure
✅ **Service Catalog** - Learn the 5 new entity services
  - LyricsService: Citations, sections, rhyme schemes
  - PersonaService: Influences, vocal range, delivery styles
  - ProducerNotesService: Mix settings, duration, blueprint alignment
  - BlueprintService: Genre blueprints, tag conflicts, caching
  - SourceService: MCP integration, deterministic retrieval
✅ **Shared Utilities** - Use common validation functions
✅ **Error Handling** - Handle errors consistently
✅ **Testing** - Write comprehensive tests
✅ **Dependency Injection** - Inject dependencies properly
✅ **Service Contracts** - Implement standard operations
✅ **API Integration** - Connect to endpoints
✅ **Troubleshooting** - Fix common issues
✅ **Architecture Compliance** - Meet MeatyMusic standards

---

**For Questions or Updates:**
- Update this README with new patterns as you discover them
- Keep code examples current with actual implementations
- Document entity-specific patterns in entity-specific READMEs
- Add troubleshooting entries as issues arise

**Last Updated:** 2025-11-14
**Phase:** Phase 2 - Entity Service Implementation (Complete)
**Status:** ✓ All 5 entity services documented and implemented
**Services Documented:** 9 total (5 new + 4 existing)
**Coverage:** 100% of Phase 2 deliverables
