"""Usage examples for DTO transformation helpers.

This module demonstrates how to use the DTO transformation utilities
from app.services.common for building robust service layers.

These examples are for reference and testing purposes.
"""

from typing import List
from uuid import UUID, uuid4

from app.services.common import (
    format_error_response,
    create_page_response,
    create_cursor_response,
    convert_models_to_dtos,
    load_nested_entities,
    apply_field_selection,
)


# =============================================================================
# Example 1: Error Response Formatting
# =============================================================================


async def example_error_handling():
    """Demonstrate error response formatting."""

    # Example 1a: Validation error
    try:
        # Simulated validation error
        raise ValueError("Section order must contain Chorus")
    except ValueError as e:
        error_response = format_error_response(
            error=e,
            status_code=400,
            operation="create_lyrics",
            entity_id=uuid4()
        )
        print("Validation Error Response:")
        print(error_response)
        # Returns:
        # {
        #     "error": {
        #         "type": "ValueError",
        #         "message": "Section order must contain Chorus",
        #         "code": "VALIDATION_FAILED",
        #         "details": {
        #             "operation": "create_lyrics",
        #             "entity_id": "[UUID]",
        #             "trace_id": "..."
        #         }
        #     }
        # }

    # Example 1b: Not found error
    try:
        from app.errors import NotFoundError
        raise NotFoundError("Lyrics not found")
    except Exception as e:
        error_response = format_error_response(
            error=e,
            status_code=404,
            operation="get_lyrics"
        )
        print("\nNot Found Error Response:")
        print(error_response)
        # Returns code: "NOT_FOUND"

    # Example 1c: Database error
    try:
        from sqlalchemy.exc import IntegrityError
        raise IntegrityError("Duplicate key violation", None, None)
    except Exception as e:
        error_response = format_error_response(
            error=e,
            status_code=409,
            operation="create_style"
        )
        print("\nDatabase Error Response:")
        print(error_response)
        # Returns code: "DATABASE_ERROR"


# =============================================================================
# Example 2: Pagination Helpers
# =============================================================================


async def example_offset_pagination(service):
    """Demonstrate offset-based pagination."""

    # Get paginated data from repository
    page = 1
    page_size = 20

    # Fetch data and total count
    styles = await service.repo.get_paginated(
        page=page,
        page_size=page_size
    )
    total = await service.repo.count()

    # Convert models to DTOs
    style_dtos = [service.to_response(style) for style in styles]

    # Create paginated response
    response = create_page_response(
        items=style_dtos,
        total=total,
        page=page,
        page_size=page_size
    )

    print("Offset Pagination Response:")
    print(response)
    # Returns:
    # {
    #     "items": [...],
    #     "pageInfo": {
    #         "total": 100,
    #         "page": 1,
    #         "pageSize": 20,
    #         "totalPages": 5,
    #         "hasNext": true,
    #         "hasPrev": false
    #     }
    # }

    return response


async def example_cursor_pagination(service):
    """Demonstrate cursor-based pagination."""
    import base64
    import json

    # Get cursor from request (None for first page)
    cursor_param = None  # From query params
    page_size = 20

    # Decode cursor if provided
    last_id = None
    if cursor_param:
        cursor_data = json.loads(base64.b64decode(cursor_param))
        last_id = cursor_data.get("last_id")

    # Fetch data with cursor
    lyrics_list = await service.repo.get_by_cursor(
        last_id=last_id,
        limit=page_size + 1  # Fetch one extra to check has_next
    )

    # Check if there are more items
    has_next = len(lyrics_list) > page_size
    if has_next:
        lyrics_list = lyrics_list[:page_size]

    # Convert to DTOs
    lyrics_dtos = [service.to_response(lyrics) for lyrics in lyrics_list]

    # Generate next cursor
    next_cursor = None
    if has_next and lyrics_list:
        cursor_data = {"last_id": str(lyrics_list[-1].id)}
        next_cursor = base64.b64encode(
            json.dumps(cursor_data).encode()
        ).decode()

    # Create cursor response
    response = create_cursor_response(
        items=lyrics_dtos,
        cursor=next_cursor,
        has_next=has_next
    )

    print("Cursor Pagination Response:")
    print(response)
    # Returns:
    # {
    #     "items": [...],
    #     "pageInfo": {
    #         "cursor": "eyJsYXN0X2lkIjogIi4uLiJ9",
    #         "hasNext": true
    #     }
    # }

    return response


# =============================================================================
# Example 3: Batch DTO Conversion
# =============================================================================


async def example_batch_conversion_skip(service):
    """Demonstrate batch conversion with skip mode."""
    from app.schemas.lyrics import LyricsResponse

    # Get multiple entities from repository
    lyrics_models = await service.repo.get_by_song(song_id=uuid4())

    # Convert with skip mode (default)
    # Failed conversions are skipped and logged
    lyrics_dtos = convert_models_to_dtos(
        models=lyrics_models,
        dto_class=LyricsResponse,
        on_error="skip"
    )

    print(f"Converted {len(lyrics_dtos)} out of {len(lyrics_models)} models")
    # If some conversions fail, output list is shorter

    return lyrics_dtos


async def example_batch_conversion_raise(service):
    """Demonstrate batch conversion with raise mode."""
    from app.schemas.style import StyleResponse

    # Get multiple entities
    style_models = await service.repo.get_by_genre("pop")

    try:
        # Convert with raise mode
        # First error will raise an exception
        style_dtos = convert_models_to_dtos(
            models=style_models,
            dto_class=StyleResponse,
            on_error="raise"
        )
        return style_dtos

    except ValueError as e:
        print(f"Conversion failed: {e}")
        # Handle error appropriately
        return []


async def example_batch_conversion_none(service):
    """Demonstrate batch conversion with none mode."""
    from app.schemas.persona import PersonaResponse

    # Get multiple entities
    persona_models = await service.repo.get_all()

    # Convert with none mode
    # Failed conversions are replaced with None
    persona_dtos = convert_models_to_dtos(
        models=persona_models,
        dto_class=PersonaResponse,
        on_error="none"
    )

    # Filter out None values if needed
    valid_dtos = [dto for dto in persona_dtos if dto is not None]

    print(f"Valid: {len(valid_dtos)}, Failed: {persona_dtos.count(None)}")

    return valid_dtos


# =============================================================================
# Example 4: Nested Entity Loading
# =============================================================================


async def example_nested_entities(service, song_id: UUID):
    """Demonstrate loading nested entities."""
    from app.schemas.lyrics import LyricsResponse
    from app.schemas.style import StyleResponse
    from app.schemas.persona import PersonaResponse

    # Get parent entity
    song = await service.repo.get_by_id(song_id)

    if not song:
        return None

    # Load nested entities and convert to DTOs
    nested = await load_nested_entities(
        entity=song,
        relations={
            "lyrics": ("lyrics", LyricsResponse),
            "style": ("style", StyleResponse),
            "persona": ("persona", PersonaResponse),
        },
        session=service.session
    )

    print("Nested Entities:")
    print(nested)
    # Returns:
    # {
    #     "lyrics": LyricsResponse(...),
    #     "style": StyleResponse(...),
    #     "persona": PersonaResponse(...)
    # }

    # Build complete response with nested data
    song_response = service.to_response(song)
    response_dict = song_response.model_dump()
    response_dict.update(nested)

    return response_dict


async def example_nested_list_entities(service, style_id: UUID):
    """Demonstrate loading one-to-many nested entities."""
    from app.schemas.song import SongResponse

    # Get parent entity
    style = await service.repo.get_by_id(style_id)

    if not style:
        return None

    # Load nested list of songs that use this style
    nested = await load_nested_entities(
        entity=style,
        relations={
            "songs": ("songs", SongResponse),  # One-to-many
        },
        session=service.session
    )

    print(f"Style has {len(nested.get('songs', []))} songs")

    return nested


# =============================================================================
# Example 5: Field Selection (Sparse Fieldsets)
# =============================================================================


async def example_field_whitelist(service, lyrics_id: UUID):
    """Demonstrate field selection with whitelist."""

    # Get entity
    lyrics = await service.repo.get_by_id(lyrics_id)
    lyrics_dto = service.to_response(lyrics)

    # Select only specific fields
    sparse_response = apply_field_selection(
        dto=lyrics_dto,
        fields=["id", "title", "song_id", "created_at"]
    )

    print("Sparse Response (whitelist):")
    print(sparse_response)
    # Returns: {"id": "...", "title": "...", "song_id": "...", "created_at": "..."}
    # Excludes: sections, full_text, etc.

    return sparse_response


async def example_field_blacklist(service, style_id: UUID):
    """Demonstrate field selection with blacklist."""

    # Get entity
    style = await service.repo.get_by_id(style_id)
    style_dto = service.to_response(style)

    # Exclude large or sensitive fields
    sparse_response = apply_field_selection(
        dto=style_dto,
        exclude=["full_tags_json", "internal_notes", "version_history"]
    )

    print("Sparse Response (blacklist):")
    print(sparse_response)
    # Returns all fields except excluded ones

    return sparse_response


# =============================================================================
# Example 6: Integration in Service Methods
# =============================================================================


class ExampleLyricsService:
    """Example service using DTO transformation helpers."""

    def __init__(self, session, repo):
        self.session = session
        self.repo = repo

    async def create_lyrics(self, data):
        """Create lyrics with error handling."""
        try:
            # Validation
            if not data.section_order:
                raise ValueError("section_order is required")

            # Create entity
            lyrics = await self.repo.create(data)

            # Convert to DTO and return
            return self.to_response(lyrics)

        except Exception as e:
            # Format error response
            error_response = format_error_response(
                error=e,
                status_code=400 if isinstance(e, ValueError) else 500,
                operation="create_lyrics",
                entity_id=data.song_id
            )
            # Raise or return error response
            raise

    async def list_lyrics_paginated(self, page: int = 1, page_size: int = 20):
        """List lyrics with pagination."""
        from app.schemas.lyrics import LyricsResponse

        # Get data
        lyrics_models = await self.repo.get_paginated(page, page_size)
        total = await self.repo.count()

        # Batch convert to DTOs
        lyrics_dtos = convert_models_to_dtos(
            models=lyrics_models,
            dto_class=LyricsResponse,
            on_error="skip"
        )

        # Create paginated response
        response = create_page_response(
            items=lyrics_dtos,
            total=total,
            page=page,
            page_size=page_size
        )

        return response

    async def get_lyrics_with_song(self, lyrics_id: UUID):
        """Get lyrics with nested song data."""
        from app.schemas.song import SongResponse

        # Get lyrics
        lyrics = await self.repo.get_by_id(lyrics_id)

        if not lyrics:
            raise ValueError("Lyrics not found")

        # Load nested song
        nested = await load_nested_entities(
            entity=lyrics,
            relations={"song": ("song", SongResponse)},
            session=self.session
        )

        # Build response
        lyrics_dto = self.to_response(lyrics)
        response = lyrics_dto.model_dump()
        response["song"] = nested.get("song")

        return response

    async def get_lyrics_summary(self, lyrics_id: UUID):
        """Get lyrics summary (sparse response)."""

        # Get lyrics
        lyrics = await self.repo.get_by_id(lyrics_id)

        if not lyrics:
            raise ValueError("Lyrics not found")

        # Convert to DTO
        lyrics_dto = self.to_response(lyrics)

        # Return sparse response
        return apply_field_selection(
            dto=lyrics_dto,
            fields=["id", "title", "song_id", "language", "created_at"]
        )


# =============================================================================
# Example 7: API Endpoint Usage
# =============================================================================


async def example_api_endpoint_with_helpers():
    """Example FastAPI endpoint using DTO helpers."""
    from fastapi import APIRouter, HTTPException, Query
    from typing import Optional

    router = APIRouter()

    @router.get("/lyrics")
    async def list_lyrics(
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        fields: Optional[str] = Query(None, description="Comma-separated fields")
    ):
        """List lyrics with pagination and field selection."""
        try:
            # Get service (dependency injection)
            service = get_lyrics_service()

            # Get paginated data
            response = await service.list_lyrics_paginated(page, page_size)

            # Apply field selection if requested
            if fields:
                field_list = fields.split(",")
                response["items"] = [
                    apply_field_selection(item, fields=field_list)
                    for item in response["items"]
                ]

            return response

        except Exception as e:
            # Format error and return
            error_response = format_error_response(
                error=e,
                status_code=500,
                operation="list_lyrics"
            )
            raise HTTPException(
                status_code=500,
                detail=error_response
            )

    return router


# =============================================================================
# Helper Function (Mock)
# =============================================================================


def get_lyrics_service():
    """Mock service factory."""
    # In real code, this would use dependency injection
    pass


if __name__ == "__main__":
    print("DTO Transformation Helpers Usage Examples")
    print("=" * 60)
    print("\nThis file contains usage examples for:")
    print("  1. Error response formatting")
    print("  2. Offset and cursor pagination")
    print("  3. Batch DTO conversion")
    print("  4. Nested entity loading")
    print("  5. Field selection (sparse fieldsets)")
    print("  6. Service integration patterns")
    print("  7. API endpoint usage")
    print("\nRefer to function docstrings for detailed examples.")
