# BaseService Usage Guide

This guide shows how to use the `BaseService` abstract class to create entity services in MeatyMusic.

## Overview

The `BaseService` class provides:
- **Async transaction management** with automatic commit/rollback
- **Structured error handling** with logging
- **DTO conversion utilities** (Model → Response DTO)
- **Type safety** with generics
- **Repository injection** patterns

## Type Parameters

```python
BaseService[T, R, C, U]
```

- `T`: SQLAlchemy ORM model type (e.g., `Lyrics`, `Style`)
- `R`: Response DTO type (e.g., `LyricsResponse`)
- `C`: Create DTO type (e.g., `LyricsCreate`)
- `U`: Update DTO type (e.g., `LyricsUpdate`)

## Basic Usage

### Step 1: Define Your Service Class

```python
from app.services.base_service import BaseService
from app.models.lyrics import Lyrics
from app.schemas.lyrics import LyricsResponse, LyricsCreate, LyricsUpdate
from app.repositories.lyrics_repo import LyricsRepository
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

logger = structlog.get_logger(__name__)


class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
    """Service for lyrics-related operations."""

    def __init__(self, session: AsyncSession, repo: LyricsRepository):
        super().__init__(session, LyricsResponse)
        self.repo = repo
```

### Step 2: Implement CRUD Operations

```python
    async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
        """Create new lyrics with transaction handling."""
        async with self.transaction():
            # Business logic validation
            await self._validate_required_fields(
                data=data,
                required_fields=["song_id", "text"],
                operation="create_lyrics"
            )

            # Create entity via repository
            lyrics = await self.repo.create(data)

            # Log success
            logger.info(
                "lyrics.created",
                lyrics_id=str(lyrics.id),
                song_id=str(lyrics.song_id)
            )

            # Convert to response DTO
            return self.to_response(lyrics)

    async def get_lyrics(self, lyrics_id: UUID) -> Optional[LyricsResponse]:
        """Get lyrics by ID."""
        lyrics = await self.repo.get_by_id(lyrics_id)
        return self.to_response(lyrics)

    async def update_lyrics(
        self,
        lyrics_id: UUID,
        data: LyricsUpdate
    ) -> Optional[LyricsResponse]:
        """Update lyrics with transaction handling."""
        async with self.transaction():
            # Get existing
            existing = await self.repo.get_by_id(lyrics_id)
            if not existing:
                return None

            # Update via repository
            updated = await self.repo.update(lyrics_id, data)

            logger.info(
                "lyrics.updated",
                lyrics_id=str(lyrics_id),
                updated_fields=list(data.model_dump(exclude_unset=True).keys())
            )

            return self.to_response(updated)

    async def delete_lyrics(self, lyrics_id: UUID) -> bool:
        """Delete lyrics with transaction handling."""
        async with self.transaction():
            success = await self.repo.delete(lyrics_id)

            if success:
                logger.info("lyrics.deleted", lyrics_id=str(lyrics_id))

            return success
```

### Step 3: Implement Business Logic Methods

```python
    async def get_by_song_id(self, song_id: UUID) -> List[LyricsResponse]:
        """Get all lyrics for a song."""
        lyrics_list = await self.repo.get_by_song_id(song_id)
        return self.to_response_list(lyrics_list)

    async def validate_rhyme_scheme(
        self,
        lyrics_id: UUID,
        expected_scheme: str
    ) -> Dict[str, Any]:
        """Validate lyrics against expected rhyme scheme."""
        lyrics = await self.repo.get_by_id(lyrics_id)
        if not lyrics:
            raise NotFoundError(f"Lyrics {lyrics_id} not found")

        # Business logic validation
        if lyrics.rhyme_scheme != expected_scheme:
            logger.warning(
                "lyrics.rhyme_scheme_mismatch",
                lyrics_id=str(lyrics_id),
                expected=expected_scheme,
                actual=lyrics.rhyme_scheme
            )
            return {
                "valid": False,
                "expected": expected_scheme,
                "actual": lyrics.rhyme_scheme
            }

        return {"valid": True, "scheme": lyrics.rhyme_scheme}
```

## Transaction Management

The `transaction()` context manager provides automatic commit/rollback:

```python
async def complex_operation(self, data: CreateData) -> Response:
    """Example of complex multi-step operation."""
    async with self.transaction():
        # Step 1: Create primary entity
        entity = await self.repo.create(data)

        # Step 2: Update related entity
        await self.related_repo.update(data.related_id, {
            "entity_id": entity.id
        })

        # Step 3: Create audit log
        await self.audit_repo.log_creation(entity.id)

        # All steps succeed → auto-commit
        # Any step fails → auto-rollback

        return self.to_response(entity)
```

### Nested Transactions

Transactions can be nested (SQLAlchemy handles savepoints automatically):

```python
async def outer_operation(self):
    async with self.transaction():
        entity1 = await self.create_entity(data1)

        # Inner transaction (creates savepoint)
        async with self.transaction():
            entity2 = await self.create_related(entity1.id, data2)

        return entity1, entity2
```

## Error Handling

Use `_handle_error()` for consistent error handling:

```python
async def risky_operation(self, entity_id: UUID) -> Response:
    """Example with error handling."""
    try:
        async with self.transaction():
            entity = await self.repo.get_by_id(entity_id)
            if not entity:
                raise NotFoundError(f"Entity {entity_id} not found")

            # Risky operation
            result = await self.external_service.process(entity)

            return self.to_response(result)

    except Exception as e:
        # Log and convert to AppError
        raise await self._handle_error(
            error=e,
            operation="risky_operation",
            context={
                "entity_id": str(entity_id),
                "user_id": str(self.current_user_id)
            }
        )
```

## DTO Conversion

### Single Entity

```python
# Get entity and convert to response
entity = await self.repo.get_by_id(entity_id)
response = self.to_response(entity)  # Returns ResponseDTO or None
```

### Multiple Entities

```python
# Get list and convert all
entities = await self.repo.get_by_criteria(filters)
responses = self.to_response_list(entities)  # Returns List[ResponseDTO]
```

### Handling None

```python
# Safely handles None
entity = await self.repo.get_by_id(nonexistent_id)  # Returns None
response = self.to_response(entity)  # Returns None (not an error)
```

## Validation

Use `_validate_required_fields()` for business logic validation:

```python
async def create_with_validation(self, data: CreateData) -> Response:
    """Create with additional validation."""
    # Validate required fields beyond Pydantic schema
    await self._validate_required_fields(
        data=data,
        required_fields=["song_id", "blueprint_id"],
        operation="create_with_validation"
    )

    async with self.transaction():
        entity = await self.repo.create(data)
        return self.to_response(entity)
```

## Dependency Injection

### In FastAPI Dependencies

```python
# In app/api/dependencies.py
from app.services.lyrics_service import LyricsService

async def get_lyrics_service(
    session: AsyncSession = Depends(get_db_session),
    repo: LyricsRepository = Depends(get_lyrics_repository)
) -> LyricsService:
    """Get LyricsService instance."""
    return LyricsService(session=session, repo=repo)
```

### In Endpoints

```python
# In app/api/v1/endpoints/lyrics.py
@router.post("/", response_model=LyricsResponse)
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
```

## Multiple Repository Dependencies

Services can depend on multiple repositories:

```python
class SongService(BaseService[Song, SongResponse, SongCreate, SongUpdate]):
    """Service with multiple repository dependencies."""

    def __init__(
        self,
        session: AsyncSession,
        song_repo: SongRepository,
        lyrics_repo: LyricsRepository,
        style_repo: StyleRepository
    ):
        super().__init__(session, SongResponse)
        self.song_repo = song_repo
        self.lyrics_repo = lyrics_repo
        self.style_repo = style_repo

    async def get_song_with_artifacts(
        self,
        song_id: UUID
    ) -> Dict[str, Any]:
        """Get song with all related entities."""
        song = await self.song_repo.get_by_id(song_id)
        if not song:
            raise NotFoundError(f"Song {song_id} not found")

        # Load related entities
        lyrics = await self.lyrics_repo.get_by_song_id(song_id)
        style = await self.style_repo.get_by_id(song.style_id) if song.style_id else None

        return {
            "song": self.to_response(song),
            "lyrics": self.to_response_list(lyrics),
            "style": self.to_response(style)
        }
```

## Testing

### Unit Test Example

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.lyrics_service import LyricsService

@pytest.mark.asyncio
async def test_create_lyrics():
    """Test lyrics creation with transaction."""
    # Mock dependencies
    session = AsyncMock()
    repo = AsyncMock()

    # Setup mock behavior
    repo.create.return_value = MagicMock(
        id=UUID("12345678-1234-1234-1234-123456789012"),
        song_id=UUID("87654321-4321-4321-4321-210987654321"),
        text="Test lyrics"
    )

    # Create service
    service = LyricsService(session=session, repo=repo)

    # Test create
    data = LyricsCreate(
        song_id=UUID("87654321-4321-4321-4321-210987654321"),
        text="Test lyrics"
    )
    result = await service.create_lyrics(data)

    # Assertions
    assert result.text == "Test lyrics"
    repo.create.assert_called_once_with(data)
    session.commit.assert_called_once()
```

## Best Practices

1. **Always use transactions** for write operations
2. **Log operations** with structured context
3. **Validate business rules** in services, not repositories
4. **Convert to DTOs** before returning from service methods
5. **Handle errors** with `_handle_error()` for consistency
6. **Keep services focused** - one entity per service
7. **Inject all dependencies** via constructor
8. **Use type hints** for all methods

## Common Patterns

### Pattern 1: Create with Validation

```python
async def create_entity(self, data: CreateDTO) -> ResponseDTO:
    await self._validate_required_fields(data, ["field1", "field2"], "create")
    async with self.transaction():
        entity = await self.repo.create(data)
        logger.info("entity.created", id=str(entity.id))
        return self.to_response(entity)
```

### Pattern 2: Update with Existence Check

```python
async def update_entity(self, id: UUID, data: UpdateDTO) -> Optional[ResponseDTO]:
    async with self.transaction():
        existing = await self.repo.get_by_id(id)
        if not existing:
            return None
        updated = await self.repo.update(id, data)
        logger.info("entity.updated", id=str(id))
        return self.to_response(updated)
```

### Pattern 3: Complex Multi-Step Operation

```python
async def complex_operation(self, data: ComplexDTO) -> Dict[str, Any]:
    async with self.transaction():
        step1 = await self.repo1.create(data.part1)
        step2 = await self.repo2.update(step1.id, data.part2)
        step3 = await self.repo3.associate(step1.id, step2.id)
        return {
            "step1": self.to_response(step1),
            "step2": self.to_response(step2),
            "step3": step3
        }
```

## Migration from Sync Services

If migrating from synchronous services:

1. Add `async` to all method definitions
2. Add `await` to all repository calls
3. Use `async with` for transactions
4. Update dependencies to use `AsyncSession`
5. Update all callers to use `await`

```python
# Before (sync)
def create_entity(self, data: CreateDTO) -> ResponseDTO:
    entity = self.repo.create(data)
    return self.to_response(entity)

# After (async)
async def create_entity(self, data: CreateDTO) -> ResponseDTO:
    async with self.transaction():
        entity = await self.repo.create(data)
        return self.to_response(entity)
```
