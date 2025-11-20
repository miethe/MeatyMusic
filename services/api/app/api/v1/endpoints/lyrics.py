"""API endpoints for Lyrics management.

Lyrics define section structure, rhyme schemes, constraints,
and generated lyric content for songs.
"""

from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from app.api.dependencies import get_lyrics_service, get_bulk_operations_service
from app.errors import BadRequestError
from app.models.lyrics import Lyrics
from app.repositories import LyricsRepository
from app.services import LyricsService, BulkOperationsService
from app.schemas import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkExportRequest,
    ErrorResponse,
    LyricsCreate,
    LyricsResponse,
    LyricsUpdate,
    PageInfo,
    PaginatedResponse,
    ProfanityCheckResult,
)

router = APIRouter(prefix="/lyrics", tags=["Lyrics"])


@router.post(
    "",
    response_model=LyricsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new lyrics",
    description="Create new lyrics with section structure and constraints",
    responses={
        201: {"description": "Lyrics created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid lyrics data"},
    },
)
async def create_lyrics(
    lyrics_data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service),
) -> LyricsResponse:
    """Create new lyrics.

    Args:
        lyrics_data: Lyrics creation data
        service: Lyrics service instance

    Returns:
        Created lyrics

    Raises:
        HTTPException: If lyrics creation fails
    """
    try:
        return await service.create_lyrics(lyrics_data)
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


@router.post(
    "/import",
    response_model=LyricsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import lyrics from JSON file",
    description="Import lyrics definition from an uploaded JSON file",
    responses={
        201: {"description": "Lyrics imported successfully"},
        400: {"model": ErrorResponse, "description": "Invalid JSON or validation error"},
    },
)
async def import_lyrics(
    file: UploadFile = File(..., description="JSON file containing lyrics definition"),
    service: LyricsService = Depends(get_lyrics_service),
) -> LyricsResponse:
    """Import lyrics from a JSON file.

    Args:
        file: Uploaded JSON file with lyrics data
        service: Lyrics service instance

    Returns:
        Created lyrics with import metadata

    Raises:
        HTTPException: If file is not JSON or validation fails
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON files are supported. File must have .json extension",
        )

    # Read and parse JSON
    try:
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}",
        )

    # Validate against schema
    try:
        lyrics_data = LyricsCreate.model_validate(data)
    except ValidationError as e:
        errors = [
            {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
            for err in e.errors()
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors},
        )

    # Add import metadata
    lyrics_dict = lyrics_data.model_dump()
    lyrics_dict["imported_at"] = datetime.now(timezone.utc)
    lyrics_dict["import_source_filename"] = file.filename

    # Create lyrics via service
    try:
        lyrics_data_with_import = LyricsCreate.model_validate(lyrics_dict)
        return await service.create_lyrics(lyrics_data_with_import)
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
    "",
    response_model=PaginatedResponse[LyricsResponse],
    summary="List lyrics with pagination",
    description="Get paginated list of lyrics",
)
async def list_lyrics(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    service: LyricsService = Depends(get_lyrics_service),
) -> PaginatedResponse[LyricsResponse]:
    """List lyrics with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        service: Lyrics service instance

    Returns:
        Paginated list of lyrics
    """
    # Note: list() method needs to be added to LyricsService for full service layer compliance
    # For now, we access repo directly for pagination (this is acceptable for list operations)
    cursor_uuid = UUID(cursor) if cursor else None
    lyrics_list = service.repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(lyrics_list) > limit
    items = lyrics_list[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[LyricsResponse.model_validate(l) for l in items],
        page_info=page_info,
    )


@router.get(
    "/{lyrics_id}",
    response_model=LyricsResponse,
    summary="Get lyrics by ID",
    description="Retrieve specific lyrics by ID",
    responses={
        200: {"description": "Lyrics found"},
        404: {"model": ErrorResponse, "description": "Lyrics not found"},
    },
)
async def get_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service),
) -> LyricsResponse:
    """Get lyrics by ID.

    Args:
        lyrics_id: Lyrics UUID
        service: Lyrics service instance

    Returns:
        Lyrics data

    Raises:
        HTTPException: If lyrics not found
    """
    lyrics = await service.get_lyrics(lyrics_id)
    if not lyrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lyrics {lyrics_id} not found",
        )
    return lyrics


@router.patch(
    "/{lyrics_id}",
    response_model=LyricsResponse,
    summary="Update lyrics",
    description="Update existing lyrics fields",
    responses={
        200: {"description": "Lyrics updated successfully"},
        404: {"model": ErrorResponse, "description": "Lyrics not found"},
    },
)
async def update_lyrics(
    lyrics_id: UUID,
    lyrics_data: LyricsUpdate,
    service: LyricsService = Depends(get_lyrics_service),
) -> LyricsResponse:
    """Update lyrics.

    Args:
        lyrics_id: Lyrics UUID
        lyrics_data: Fields to update
        service: Lyrics service instance

    Returns:
        Updated lyrics

    Raises:
        HTTPException: If lyrics not found
    """
    try:
        updated = await service.update_lyrics(lyrics_id, lyrics_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lyrics {lyrics_id} not found",
            )
        return updated
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


@router.delete(
    "/{lyrics_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete lyrics",
    description="Soft delete lyrics",
    responses={
        204: {"description": "Lyrics deleted successfully"},
        404: {"model": ErrorResponse, "description": "Lyrics not found"},
    },
)
async def delete_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service),
) -> None:
    """Delete lyrics (soft delete).

    Args:
        lyrics_id: Lyrics UUID
        service: Lyrics service instance

    Raises:
        HTTPException: If lyrics not found
    """
    success = await service.delete_lyrics(lyrics_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lyrics {lyrics_id} not found",
        )


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    summary="Bulk delete lyrics",
    description="Delete multiple lyrics by IDs",
    responses={
        200: {"description": "Bulk delete completed (check response for failures)"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def bulk_delete_lyrics(
    request: BulkDeleteRequest,
    service: LyricsService = Depends(get_lyrics_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> BulkDeleteResponse:
    """Bulk delete lyrics by IDs.

    Args:
        request: Request containing list of lyrics IDs to delete
        service: Lyrics service instance
        bulk_ops: Bulk operations service instance

    Returns:
        Response with deleted_count, failed_ids, and errors
    """
    result = await bulk_ops.bulk_delete_entities(
        model_class=Lyrics,
        repository=service.repo,
        entity_ids=request.ids,
        entity_type_name="lyrics",
    )
    return BulkDeleteResponse(**result)


@router.post(
    "/bulk-export",
    response_class=StreamingResponse,
    summary="Bulk export lyrics as ZIP",
    description="Export multiple lyrics as a ZIP file containing JSON files",
    responses={
        200: {
            "description": "ZIP file with exported lyrics",
            "content": {"application/zip": {}},
        },
        400: {"model": ErrorResponse, "description": "No lyrics found or all exports failed"},
    },
)
async def bulk_export_lyrics(
    request: BulkExportRequest,
    service: LyricsService = Depends(get_lyrics_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Bulk export lyrics as ZIP file.

    Args:
        request: Request containing list of lyrics IDs to export
        service: Lyrics service instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with ZIP file download

    Raises:
        HTTPException: If no lyrics found or all exports fail
    """
    try:
        zip_buffer = await bulk_ops.bulk_export_entities_zip(
            model_class=Lyrics,
            repository=service.repo,
            entity_ids=request.ids,
            entity_type_name="lyrics",
            response_schema=LyricsResponse,
        )

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"lyrics-bulk-export-{timestamp}.zip"

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{lyrics_id}/export",
    response_class=StreamingResponse,
    summary="Export lyrics as JSON file",
    description="Download a single lyrics as a formatted JSON file",
    responses={
        200: {
            "description": "Lyrics exported successfully as JSON file",
            "content": {"application/json": {}},
        },
        404: {"model": ErrorResponse, "description": "Lyrics not found"},
    },
)
async def export_lyrics(
    lyrics_id: UUID,
    service: LyricsService = Depends(get_lyrics_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Export a single lyrics as JSON file.

    Args:
        lyrics_id: Lyrics UUID
        service: Lyrics service instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with JSON file download

    Raises:
        HTTPException: If lyrics not found
    """
    lyrics = await service.get_lyrics(lyrics_id)
    if not lyrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lyrics {lyrics_id} not found",
        )

    # Convert to model for export (get_lyrics returns DTO)
    lyrics_model = service.repo.get_by_id(lyrics_id)
    export_data = await bulk_ops.export_single_entity(
        entity=lyrics_model,
        entity_type_name="lyrics",
        response_schema=LyricsResponse,
    )

    json_content = json.dumps(export_data["content"], indent=2, ensure_ascii=False)

    return StreamingResponse(
        io.BytesIO(json_content.encode("utf-8")),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{export_data["filename"]}"',
        },
    )
  
@router.post(
    "/check-profanity",
    response_model=ProfanityCheckResult,
    status_code=status.HTTP_200_OK,
    summary="Check lyrics for profanity",
    description="Check lyrics sections for profanity with detailed violation reporting",
    responses={
        200: {"description": "Profanity check completed"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def check_lyrics_profanity(
    sections: list[dict],
    explicit_allowed: bool = Query(False, description="Whether explicit content is allowed"),
    service: LyricsService = Depends(get_lyrics_service),
) -> ProfanityCheckResult:
    """Check lyrics sections for profanity with detailed violation reporting.

    This endpoint uses the enhanced profanity filter which detects:
    - Exact profanity matches
    - L33t speak variations (e.g., "sh1t" → "shit")
    - Common misspellings and variations
    - Word boundary detection (avoids false positives)

    The response includes:
    - Detailed violations with line numbers and context
    - Category-based scoring (mild: 0.3, moderate: 0.6, severe: 1.0)
    - Total and maximum scores
    - Categories of profanity found

    Args:
        sections: List of section dicts with 'lines' field
        explicit_allowed: Whether explicit content is allowed
        service: Lyrics service instance

    Returns:
        ProfanityCheckResult with violations and scores

    Example request:
        ```json
        {
            "sections": [
                {"type": "Verse", "lines": ["Line 1", "Line 2"]},
                {"type": "Chorus", "lines": ["Clean lyrics here"]}
            ]
        }
        ```

    Example response:
        ```json
        {
            "is_clean": false,
            "violations": [
                {
                    "word": "sh1t",
                    "category": "moderate",
                    "score": 0.6,
                    "line_number": 3,
                    "context": "...this is bad sh1t...",
                    "position": 15
                }
            ],
            "total_score": 0.6,
            "max_score": 0.6,
            "violation_count": 1,
            "categories_found": ["moderate"]
        }
        ```

    Raises:
        HTTPException: If request is invalid
    """
    try:
        result = service.check_lyrics_profanity(sections, explicit_allowed)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Profanity check failed: {str(e)}",
        )
