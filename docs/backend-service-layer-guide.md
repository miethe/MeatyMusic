# Backend Service Layer Integration Guide

## Overview

This guide explains MeatyMusic's service layer architecture and provides step-by-step instructions for adding new services to the system. The service layer is the critical middle tier that handles all business logic, validation, and transaction management between the API and database layers.

**Quick Reference:**
- **Location:** `/services/api/app/services/`
- **Base Class:** `BaseService[T, R, C, U]` with type-safe generics
- **Pattern:** Synchronous repositories called by async service methods
- **Architecture:** API → Service → Repository → Database

---

## 1. Service Layer Architecture

### Layered Architecture Diagram

```
┌─────────────────────────────────────────┐
│ API Layer (FastAPI endpoints)           │
│ • Request/response handling             │
│ • Route definition                      │
│ • Dependency injection                  │
└────────────────┬────────────────────────┘
                 │ Depends(get_xxx_service)
                 ↓
┌─────────────────────────────────────────┐
│ Service Layer (Business Logic)          │
│ • Validation & business rules           │
│ • Transaction management                │
│ • DTO conversion                        │
│ • Citation & weight management          │
└────────────────┬────────────────────────┘
                 │ self.repo.method()
                 ↓
┌─────────────────────────────────────────┐
│ Repository Layer (Data Access)          │
│ • CRUD operations                       │
│ • SQLAlchemy queries                    │
│ • RLS enforcement                       │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│ Database (PostgreSQL)                   │
└─────────────────────────────────────────┘
```

### Key Characteristics

- **API Layer:** Handles HTTP concerns only; delegates all business logic to services
- **Service Layer:** Orchestrates business logic; manages transactions; converts DTOs
- **Repository Layer:** Pure CRUD operations; no validation or business logic
- **Database Layer:** Persistent storage; schema enforcement

---

## 2. Adding a New Service

### Step 1: Create the Service Class

Create a new service file in `/services/api/app/services/`:

```python
"""Service layer for MyEntity business logic."""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
import structlog

from sqlalchemy.orm import Session

from app.services.base_service import BaseService
from app.repositories.my_entity_repo import MyEntityRepository
from app.schemas.my_entity import MyEntityCreate, MyEntityUpdate, MyEntityResponse
from app.models.my_entity import MyEntity
from app.errors import BadRequestError, NotFoundError

logger = structlog.get_logger(__name__)


class MyEntityService(BaseService[MyEntity, MyEntityResponse, MyEntityCreate, MyEntityUpdate]):
    """Service for MyEntity operations with business logic validation.

    Provides CRUD operations with comprehensive validation:
    - Field validation
    - Business rule enforcement
    - Citation tracking (if applicable)
    - Weight normalization (if applicable)

    All operations use transaction management from BaseService for atomicity
    and proper rollback on errors.
    """

    def __init__(self, session: Session, repo: MyEntityRepository):
        """Initialize the service.

        Args:
            session: SQLAlchemy synchronous session for database operations
            repo: MyEntityRepository for data access
        """
        super().__init__(session, MyEntityResponse)
        self.repo = repo
```

**Key points:**
- Inherit from `BaseService[T, R, C, U]` where:
  - `T` = SQLAlchemy model (e.g., `MyEntity`)
  - `R` = Response DTO (e.g., `MyEntityResponse`)
  - `C` = Create DTO (e.g., `MyEntityCreate`)
  - `U` = Update DTO (e.g., `MyEntityUpdate`)
- Pass `session` to parent class for transaction management
- Store `repo` as instance variable for data access

### Step 2: Implement CRUD Operations

Add basic CRUD methods:

```python
    async def create_my_entity(self, data: MyEntityCreate) -> MyEntityResponse:
        """Create new entity with validation.

        Args:
            data: Entity creation data with all required fields

        Returns:
            MyEntityResponse with created entity including database fields

        Raises:
            BadRequestError: If validation fails
        """
        # 1. Validate required fields
        if not data.name or not data.name.strip():
            raise BadRequestError("name is required and cannot be empty")

        # 2. Validate business rules
        if data.value < 0 or data.value > 100:
            raise BadRequestError("value must be between 0 and 100")

        # 3. Create in transaction
        with self.transaction():
            # Repository methods are synchronous - NO await
            entity = self.repo.create(data)

            logger.info(
                "my_entity.created",
                entity_id=str(entity.id),
                name=data.name
            )

            # Convert to response DTO
            return self.to_response(entity)

    async def get_my_entity(self, entity_id: UUID) -> Optional[MyEntityResponse]:
        """Get entity by ID.

        Args:
            entity_id: UUID of the entity to retrieve

        Returns:
            MyEntityResponse if found, None otherwise
        """
        # NO transaction needed for read operations
        entity = self.repo.get_by_id(entity_id)
        return self.to_response(entity)

    async def update_my_entity(
        self,
        entity_id: UUID,
        data: MyEntityUpdate
    ) -> Optional[MyEntityResponse]:
        """Update entity with validation.

        Args:
            entity_id: UUID of the entity to update
            data: Update data (all fields optional)

        Returns:
            MyEntityResponse with updated entity if found, None otherwise

        Raises:
            BadRequestError: If validation fails on updated fields
        """
        # Validate updated fields if provided
        if data.value is not None:
            if data.value < 0 or data.value > 100:
                raise BadRequestError("value must be between 0 and 100")

        with self.transaction():
            entity = self.repo.update(entity_id, data)

            if not entity:
                logger.debug("my_entity.update_not_found", entity_id=str(entity_id))
                return None

            logger.info("my_entity.updated", entity_id=str(entity_id))
            return self.to_response(entity)

    async def delete_my_entity(self, entity_id: UUID) -> bool:
        """Delete entity by ID.

        Args:
            entity_id: UUID of the entity to delete

        Returns:
            True if deleted, False if not found
        """
        with self.transaction():
            success = self.repo.delete(entity_id)

            if success:
                logger.info("my_entity.deleted", entity_id=str(entity_id))
            else:
                logger.debug("my_entity.delete_not_found", entity_id=str(entity_id))

            return success

    async def list_my_entities(self) -> List[MyEntityResponse]:
        """Get all entities.

        Returns:
            List of MyEntityResponse
        """
        entities = self.repo.list()
        return self.to_response_list(entities)
```

**Critical Pattern:**
```python
# ✓ Correct: No await on repository methods
entity = self.repo.create(data)  # Synchronous call

# ✗ Wrong: Repository methods are not async
# entity = await self.repo.create(data)  # DON'T DO THIS
```

### Step 3: Add Business Logic Methods

Add methods that implement domain-specific logic:

```python
    def validate_business_rules(self, data: MyEntityCreate) -> tuple[bool, Optional[str]]:
        """Validate custom business rules.

        Returns:
            (is_valid, error_message)
        """
        # Custom validation logic specific to your entity
        if data.start_date > data.end_date:
            return False, "start_date must be before end_date"

        if data.priority not in ["low", "medium", "high"]:
            return False, f"Invalid priority: {data.priority}"

        return True, None

    def normalize_weights(self, citations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize weights to sum to 1.0.

        Example from LyricsService:
        - Uses normalize_weights() from common.py
        - Preserves relative proportions
        - Ensures constraint compliance
        """
        from app.services.common import normalize_weights

        # Extract weights
        weights_dict = {
            str(c.get("source_id")): c.get("weight", 0.0)
            for c in citations
            if c.get("source_id")
        }

        # Normalize
        normalized = normalize_weights(weights_dict, max_sum=1.0)

        # Apply back to citations
        return [
            {**c, "weight": normalized.get(str(c.get("source_id")), 0.0)}
            for c in citations
        ]

    def compute_hashes(self, citations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Compute deterministic SHA-256 hashes for citations.

        Example from LyricsService:
        - Ensures reproducibility
        - Enables pinned retrieval
        - Critical for determinism compliance
        """
        from app.services.common import compute_citation_hash

        hashes = []
        for citation in citations:
            hash_val = compute_citation_hash(
                source_id=UUID(citation["source_id"]),
                chunk_text=citation.get("chunk_text", ""),
                timestamp=citation.get("timestamp")
            )
            hashes.append({**citation, "citation_hash": hash_val})

        return hashes
```

### Step 4: Add Dependency Injection

Update `/services/api/app/api/dependencies.py`:

```python
def get_my_entity_repository(
    db: AsyncSession = Depends(get_db_session),
) -> MyEntityRepository:
    """Get MyEntityRepository instance."""
    return MyEntityRepository(db)


def get_my_entity_service(
    db: AsyncSession = Depends(get_db_session),
    repo: MyEntityRepository = Depends(get_my_entity_repository),
) -> MyEntityService:
    """Get MyEntityService instance with all dependencies.

    For services that use BaseService, always pass:
    - db: The database session for transactions
    - repo: The repository for data access

    For services with optional cross-repo dependencies, add them here:
    - blueprint_repo: Optional for validation against blueprints
    - lyrics_repo: Optional for section validation
    """
    return MyEntityService(session=db, repo=repo)


# Update __all__ exports
__all__ = [
    # ... existing exports ...
    "get_my_entity_repository",
    "get_my_entity_service",
]
```

### Step 5: Create API Endpoints

Create `/services/api/app/api/v1/endpoints/my_entities.py`:

```python
"""API endpoints for MyEntity management."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_my_entity_service
from app.errors import BadRequestError, NotFoundError
from app.services import MyEntityService
from app.schemas import (
    ErrorResponse,
    MyEntityCreate,
    MyEntityResponse,
    MyEntityUpdate,
)

router = APIRouter(prefix="/my-entities", tags=["MyEntity"])


@router.post(
    "",
    response_model=MyEntityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new entity",
    responses={
        201: {"description": "Entity created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid data"},
    },
)
async def create_my_entity(
    data: MyEntityCreate,
    service: MyEntityService = Depends(get_my_entity_service),
) -> MyEntityResponse:
    """Create new entity.

    Args:
        data: Entity creation data
        service: MyEntity service instance

    Returns:
        Created entity

    Raises:
        HTTPException: If creation fails
    """
    try:
        return await service.create_my_entity(data)
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/{entity_id}",
    response_model=MyEntityResponse,
    summary="Get entity by ID",
    responses={
        200: {"description": "Entity found"},
        404: {"model": ErrorResponse, "description": "Entity not found"},
    },
)
async def get_my_entity(
    entity_id: UUID,
    service: MyEntityService = Depends(get_my_entity_service),
) -> MyEntityResponse:
    """Get entity by ID.

    Args:
        entity_id: Entity UUID
        service: MyEntity service instance

    Returns:
        Entity data

    Raises:
        HTTPException: If entity not found
    """
    entity = await service.get_my_entity(entity_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entity {entity_id} not found",
        )
    return entity


@router.patch(
    "/{entity_id}",
    response_model=MyEntityResponse,
    summary="Update entity",
    responses={
        200: {"description": "Entity updated successfully"},
        404: {"model": ErrorResponse, "description": "Entity not found"},
    },
)
async def update_my_entity(
    entity_id: UUID,
    data: MyEntityUpdate,
    service: MyEntityService = Depends(get_my_entity_service),
) -> MyEntityResponse:
    """Update entity.

    Args:
        entity_id: Entity UUID
        data: Update data
        service: MyEntity service instance

    Returns:
        Updated entity

    Raises:
        HTTPException: If entity not found or update fails
    """
    try:
        entity = await service.update_my_entity(entity_id, data)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity {entity_id} not found",
            )
        return entity
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{entity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete entity",
    responses={
        204: {"description": "Entity deleted successfully"},
        404: {"model": ErrorResponse, "description": "Entity not found"},
    },
)
async def delete_my_entity(
    entity_id: UUID,
    service: MyEntityService = Depends(get_my_entity_service),
) -> None:
    """Delete entity.

    Args:
        entity_id: Entity UUID
        service: MyEntity service instance

    Raises:
        HTTPException: If entity not found
    """
    success = await service.delete_my_entity(entity_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entity {entity_id} not found",
        )
```

**Key API Patterns:**

- Use `Depends(get_xxx_service)` to inject service
- Call `await service.method()` - service methods are async
- Catch `BadRequestError` → HTTP 400
- Catch `NotFoundError` → HTTP 404
- Other exceptions → HTTP 500
- Convert service response DTOs directly to FastAPI response model

---

## 3. Patterns & Best Practices

### Transaction Management

**Pattern 1: Write Operations**

```python
async def create_with_related_data(self, data: MyEntityCreate) -> MyEntityResponse:
    """Create entity with related data in single transaction."""
    with self.transaction():
        # All operations in this block are atomic
        entity = self.repo.create(data)

        # Multiple operations in one transaction
        if data.related_ids:
            for related_id in data.related_ids:
                self.repo.add_relation(entity.id, related_id)

        # Auto-commit on success, auto-rollback on error
        return self.to_response(entity)
```

**Pattern 2: Read Operations**

```python
async def get_with_enrichment(self, entity_id: UUID) -> Optional[MyEntityResponse]:
    """Read operations don't need transactions."""
    # No transaction - just read
    entity = self.repo.get_by_id(entity_id)

    if not entity:
        return None

    # Optionally enrich with additional data
    response = self.to_response(entity)
    return response
```

**Pattern 3: Complex Workflows**

```python
async def complex_operation(self, data: MyData) -> Result:
    """Complex operation with multiple steps."""
    try:
        # Step 1: Validate
        is_valid, error = self.validate_business_rules(data)
        if not is_valid:
            raise BadRequestError(error)

        # Step 2: Transform
        processed = self.preprocess_data(data)

        # Step 3: Create/Update in transaction
        with self.transaction():
            entity = self.repo.create(processed)
            logger.info("operation_complete", entity_id=str(entity.id))
            return self.to_response(entity)

    except BadRequestError:
        # Transaction automatically rolled back
        raise
```

### Error Handling

**Classification by AppError Types:**

```python
from app.errors import BadRequestError, NotFoundError, ConflictError

# Validation failures → BadRequestError
if not data.name:
    raise BadRequestError("name is required")

# Resource not found → NotFoundError
entity = self.repo.get_by_id(entity_id)
if not entity:
    raise NotFoundError(f"Entity {entity_id} not found")

# Conflict (duplicate, constraint violation) → ConflictError
existing = self.repo.get_by_name(data.name)
if existing:
    raise ConflictError(f"Entity with name {data.name} already exists")
```

### DTO Conversion

**Single Entity:**

```python
# From database model to response DTO
entity = self.repo.get_by_id(entity_id)
response = self.to_response(entity)  # Returns MyEntityResponse or None
```

**Multiple Entities:**

```python
# Convert list of models to response DTOs
entities = self.repo.list()
responses = self.to_response_list(entities)  # Returns List[MyEntityResponse]
```

**With Nested Data:**

```python
from app.services.common import load_nested_entities

# Load related entities and convert to DTOs
entity = self.repo.get_by_id(entity_id, relationships=["relations"])
nested = await load_nested_entities(
    entity,
    {
        "relations": ("relations", RelatedEntityResponse),
        "tags": ("tags", TagResponse),
    },
    self.session
)
# Returns: {"relations": List[RelatedEntityResponse], "tags": List[TagResponse]}
```

### Citation & Weight Management

**Example from LyricsService:**

```python
async def create_with_citations(self, data: LyricsCreate) -> LyricsResponse:
    """Create entity with citation tracking for determinism."""
    # 1. Validate citations
    if data.source_citations:
        self.validate_citations(data.source_citations)

    processed_data = data.model_dump()

    # 2. Normalize weights (ensure sum ≤ 1.0)
    if data.source_citations:
        normalized = self.normalize_source_weights(data.source_citations)

        # 3. Compute deterministic hashes
        with_hashes = self.parse_citations_with_hashes(normalized)

        processed_data["source_citations"] = with_hashes

    # 4. Create with processed citations
    with self.transaction():
        entity = self.repo.create(LyricsCreate(**processed_data))
        logger.info("entity_created_with_citations",
                   entity_id=str(entity.id),
                   citation_count=len(with_hashes) if data.source_citations else 0)
        return self.to_response(entity)
```

---

## 4. Real-World Examples

### Example 1: Simple CRUD Service

**LyricsService Pattern:**

```python
class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):

    def __init__(self, session: Session, repo: LyricsRepository):
        super().__init__(session, LyricsResponse)
        self.repo = repo

    async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
        # Validate section order (must have Chorus)
        is_valid, error = validate_section_order(data.section_order)
        if not is_valid:
            raise BadRequestError(f"Invalid section order: {error}")

        # Check explicit content
        if not data.explicit_allowed:
            is_clean, violations = await check_explicit_content(full_text)
            if not is_clean:
                raise BadRequestError(f"Explicit content: {violations}")

        # Process citations
        if data.source_citations:
            normalized = self.normalize_source_weights(data.source_citations)
            with_hashes = self.parse_citations_with_hashes(normalized)
            data.source_citations = with_hashes

        # Create in transaction
        with self.transaction():
            entity = self.repo.create(data)
            logger.info("lyrics.created", lyrics_id=str(entity.id))
            return self.to_response(entity)
```

### Example 2: Service with Cross-Entity Validation

**ProducerNotesService Pattern:**

```python
class ProducerNotesService(BaseService[ProducerNotes, ProducerNotesResponse, ...]):

    def __init__(
        self,
        session: Session,
        repo: ProducerNotesRepository,
        blueprint_repo: Optional[BlueprintRepository] = None,
        lyrics_repo: Optional[LyricsRepository] = None,
    ):
        super().__init__(session, ProducerNotesResponse)
        self.repo = repo
        self.blueprint_repo = blueprint_repo  # Optional dependency
        self.lyrics_repo = lyrics_repo          # Optional dependency

    async def create_producer_notes(self, data: ProducerNotesCreate) -> ProducerNotesResponse:
        # Validate mix settings
        if data.mix_targets:
            is_valid, error = self.validate_mix_settings(data.mix_targets)
            if not is_valid:
                raise BadRequestError(f"Invalid mix: {error}")

        # Cross-entity validation: check against blueprint
        if self.blueprint_repo and data.blueprint_id:
            blueprint = self.blueprint_repo.get_by_id(data.blueprint_id)
            if not blueprint:
                raise NotFoundError(f"Blueprint {data.blueprint_id} not found")

        # Create with validation
        with self.transaction():
            entity = self.repo.create(data)
            logger.info("producer_notes.created", notes_id=str(entity.id))
            return self.to_response(entity)
```

---

## 5. Testing Your Service

### Unit Tests

Test business logic in isolation:

```python
import pytest
from unittest.mock import Mock, MagicMock
from uuid import uuid4

@pytest.fixture
def mock_repo():
    """Mock repository for testing."""
    return Mock()

@pytest.fixture
def service(mock_repo):
    """Create service with mocked repository."""
    session = Mock()
    return MyEntityService(session=session, repo=mock_repo)

@pytest.mark.asyncio
async def test_create_validation_fails(service, mock_repo):
    """Test that invalid data raises BadRequestError."""
    data = MyEntityCreate(name="", value=150)  # Invalid: empty name, value > 100

    with pytest.raises(BadRequestError):
        await service.create_my_entity(data)

    # Verify repository was NOT called
    mock_repo.create.assert_not_called()

@pytest.mark.asyncio
async def test_create_success(service, mock_repo):
    """Test successful entity creation."""
    entity_id = uuid4()
    data = MyEntityCreate(name="Test", value=50)

    # Mock repository response
    mock_entity = Mock(id=entity_id, name="Test", value=50)
    mock_repo.create.return_value = mock_entity

    # Create entity
    result = await service.create_my_entity(data)

    # Verify
    assert result.id == entity_id
    assert result.name == "Test"
    mock_repo.create.assert_called_once()
```

### Integration Tests

Test with real database:

```python
@pytest.mark.asyncio
async def test_create_and_retrieve(db_session):
    """Test create and retrieve flow with real database."""
    repo = MyEntityRepository(db_session)
    service = MyEntityService(session=db_session, repo=repo)

    # Create
    data = MyEntityCreate(name="Integration Test", value=75)
    response = await service.create_my_entity(data)

    # Retrieve
    retrieved = await service.get_my_entity(response.id)

    # Verify
    assert retrieved.id == response.id
    assert retrieved.name == "Integration Test"
    assert retrieved.value == 75

@pytest.mark.asyncio
async def test_transaction_rollback(db_session):
    """Test that transaction rolls back on error."""
    repo = MyEntityRepository(db_session)
    service = MyEntityService(session=db_session, repo=repo)

    # Create invalid data that will fail
    data = MyEntityCreate(name="", value=50)

    with pytest.raises(BadRequestError):
        await service.create_my_entity(data)

    # Verify entity was NOT created
    count = db_session.query(MyEntity).count()
    assert count == 0
```

### Determinism Tests

Test reproducibility (critical for MeatyMusic):

```python
@pytest.mark.asyncio
async def test_citation_hash_determinism():
    """Test that citation hashes are deterministic."""
    service = MyEntityService(session=mock_session, repo=mock_repo)

    citations = [
        {
            "source_id": uuid4(),
            "chunk_text": "Same text",
            "weight": 0.5
        }
    ]

    # Hash twice
    hashes1 = service.parse_citations_with_hashes(citations)
    hashes2 = service.parse_citations_with_hashes(citations)

    # Verify hashes are identical
    assert hashes1[0]["citation_hash"] == hashes2[0]["citation_hash"]
    # 99%+ reproducibility required for acceptance

@pytest.mark.asyncio
async def test_weight_normalization_determinism():
    """Test that weight normalization is deterministic."""
    service = MyEntityService(session=mock_session, repo=mock_repo)

    citations = [
        {"source_id": uuid4(), "weight": 0.6},
        {"source_id": uuid4(), "weight": 0.5},
    ]

    # Normalize twice
    norm1 = service.normalize_source_weights(citations)
    norm2 = service.normalize_source_weights(citations)

    # Verify results are identical
    assert [c["weight"] for c in norm1] == [c["weight"] for c in norm2]
```

---

## 6. Common Pitfalls & Solutions

### Pitfall 1: Awaiting Repository Methods

❌ **WRONG:**
```python
# Repository methods are SYNCHRONOUS
entity = await self.repo.create(data)  # This will fail!
```

✓ **CORRECT:**
```python
# NO await - repository methods are synchronous
entity = self.repo.create(data)
```

**Why:** The service layer provides async/await for FastAPI compatibility, but delegates to synchronous repositories for simplicity.

### Pitfall 2: Direct Session.Query() Access

❌ **WRONG:**
```python
async def get_by_name(self, name: str):
    # Direct database access violates layered architecture
    entity = self.session.query(MyEntity).filter_by(name=name).first()
    return self.to_response(entity)
```

✓ **CORRECT:**
```python
async def get_by_name(self, name: str):
    # Delegate to repository
    entity = self.repo.get_by_name(name)
    return self.to_response(entity)
```

**Why:** Repository pattern keeps data access logic in one place and enables easy testing.

### Pitfall 3: Forgetting Transaction Context

❌ **WRONG:**
```python
async def create_with_relations(self, data: MyCreateWithRelations):
    # Operations outside transaction - not atomic!
    entity = self.repo.create(data)
    self.repo.add_relation(entity.id, data.relation_id)  # Could fail, entity left alone
    return self.to_response(entity)
```

✓ **CORRECT:**
```python
async def create_with_relations(self, data: MyCreateWithRelations):
    # All operations in one transaction
    with self.transaction():
        entity = self.repo.create(data)
        self.repo.add_relation(entity.id, data.relation_id)  # Rolls back if fails
        return self.to_response(entity)
```

**Why:** Transactions ensure atomicity - either all operations succeed or all rollback.

### Pitfall 4: Missing DTO Conversion

❌ **WRONG:**
```python
async def get_my_entity(self, entity_id: UUID):
    # Returning SQLAlchemy model directly
    return self.repo.get_by_id(entity_id)  # Returns ORM object, not DTO
```

✓ **CORRECT:**
```python
async def get_my_entity(self, entity_id: UUID) -> Optional[MyEntityResponse]:
    # Convert to response DTO
    entity = self.repo.get_by_id(entity_id)
    return self.to_response(entity)  # Returns MyEntityResponse or None
```

**Why:** DTOs provide API contracts and decouple API responses from database models.

### Pitfall 5: Validation in Repository

❌ **WRONG:**
```python
# In MyEntityRepository
def create(self, data):
    # Validation in repository violates layered architecture
    if not data.name:
        raise BadRequestError("name required")

    entity = MyEntity(**data.model_dump())
    self.session.add(entity)
    return entity
```

✓ **CORRECT:**
```python
# In MyEntityService
async def create_my_entity(self, data: MyEntityCreate):
    # Validation in service
    if not data.name:
        raise BadRequestError("name required")

    with self.transaction():
        # Repository just does CRUD
        entity = self.repo.create(data)
        return self.to_response(entity)
```

**Why:** Business logic belongs in the service layer for maintainability and testability.

---

## 7. Architecture Validation

### Running Validation Checks

MeatyMusic includes architecture validation to ensure compliance:

```bash
# Check service layer compliance
cd /services/api
python -m pytest tests/test_architecture_validation.py -v

# Specific checks:
# - No direct database access in services
# - All data access via repositories
# - No business logic in repositories
# - Proper transaction boundaries
# - Clean separation of concerns
```

**Validation Reference:** `/services/api/app/services/ARCHITECTURE_VALIDATION.md`

### Compliance Checklist

Before submitting a new service for review:

- [ ] Service inherits from `BaseService[T, R, C, U]`
- [ ] Repository injected via constructor
- [ ] All data access via `self.repo.*` methods
- [ ] No direct `session.query()` calls
- [ ] Business logic properly contained
- [ ] Validation in service, not repository
- [ ] Transactions wrap write operations
- [ ] DTO conversion via `self.to_response()`
- [ ] Error handling with appropriate exceptions
- [ ] Comprehensive unit and integration tests
- [ ] 80%+ test coverage for service methods
- [ ] Documentation with examples

---

## 8. Service Layer References

### Key Files

- **Base Service:** `/services/api/app/services/base_service.py`
  - `BaseService[T, R, C, U]` - Generic base class
  - `transaction()` - Context manager for atomic operations
  - `to_response()` - Convert model to response DTO
  - `to_response_list()` - Convert multiple models

- **Common Utilities:** `/services/api/app/services/common.py`
  - `compute_citation_hash()` - Deterministic hashing
  - `validate_rhyme_scheme()` - Format validation
  - `normalize_weights()` - Weight normalization
  - `check_explicit_content()` - Profanity filtering
  - `validate_section_order()` - Structure validation

- **Service Examples:**
  - `/services/api/app/services/lyrics_service.py` - Complete example with citations
  - `/services/api/app/services/producer_notes_service.py` - Cross-entity validation
  - `/services/api/app/services/persona_service.py` - Influence normalization

- **API Integration:**
  - `/services/api/app/api/dependencies.py` - Service dependency injection
  - `/services/api/app/api/v1/endpoints/lyrics.py` - Endpoint patterns

### Related Documentation

- **Architecture Validation:** `/services/api/app/services/ARCHITECTURE_VALIDATION.md`
- **AMCS Overview:** `/docs/amcs-overview.md`
- **Project PRDs:** `/docs/project_plans/PRDs/`
- **CLAUDE.md:** Root development guidelines

---

## 9. Acceptance Gates

Services are evaluated against these criteria before acceptance:

### Code Quality (80%+ Coverage)

```bash
# Run tests with coverage
pytest --cov=app.services --cov-report=html tests/
```

- Unit test coverage: 80%+ for service methods
- Integration test coverage: Key workflows
- All edge cases tested
- Error paths validated

### Architecture Compliance

- Zero direct database access in services
- 100% repository delegation for CRUD
- No business logic in repositories
- Proper transaction boundaries
- Clean layer separation

### Determinism Validation (99%+ Reproducibility)

- Same inputs + seed → identical outputs
- Citation hashes match across runs
- Weight normalization is consistent
- Validation rules produce same results

### Performance

- CRUD operations < 100ms (excluding external calls)
- Transaction management efficient
- DTO conversion < 50ms for typical payloads
- No N+1 query problems

### Documentation

- Service methods have docstrings
- Examples for all public APIs
- Error handling documented
- Architecture diagram in comments

---

## 10. Migration Path

### Phase 1: Design (1-2 days)

- Identify entity and relationships
- Define validation rules
- Plan DTO schemas
- Design API endpoints

### Phase 2: Implementation (2-3 days)

- Create service class with CRUD
- Add business logic methods
- Implement dependency injection
- Create API endpoints

### Phase 3: Testing (1-2 days)

- Write unit tests
- Write integration tests
- Add determinism tests
- Achieve 80%+ coverage

### Phase 4: Documentation (0.5 days)

- Add docstrings
- Create usage examples
- Document validation rules
- Add architecture notes

### Phase 5: Review & Acceptance (1 day)

- Architecture validation check
- Code review
- Performance validation
- Acceptance gate verification

---

## Summary

The MeatyMusic service layer provides:

1. **Clear Separation:** Business logic in service, CRUD in repository
2. **Transaction Safety:** Atomic operations with automatic rollback
3. **Type Safety:** Generic base class with full type hints
4. **Testability:** Synchronous repositories enable easy mocking
5. **Determinism:** Citation hashing and weight normalization for reproducibility
6. **Maintainability:** Consistent patterns across all services

**Golden Rule:** Service layer is the orchestrator - it coordinates between API and data layers while enforcing business rules and maintaining data consistency.

For questions or guidance on your specific service, refer to the example services and architecture validation documentation.
