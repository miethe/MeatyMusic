"""API endpoints for ProducerNotes management.

Producer notes define arrangement, structure, hooks, and mix targets
for song production.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_producer_notes_repository,
    get_producer_notes_service,
)
from app.repositories import ProducerNotesRepository
from app.services import ProducerNotesService
from app.schemas import (
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
    ProducerNotesCreate,
    ProducerNotesResponse,
    ProducerNotesUpdate,
)

router = APIRouter(prefix="/producer-notes", tags=["Producer Notes"])


@router.post(
    "",
    response_model=ProducerNotesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new producer notes",
    description="Create new producer notes with arrangement and mix guidance",
    responses={
        201: {"description": "Producer notes created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid producer notes data"},
    },
)
async def create_producer_notes(
    notes_data: ProducerNotesCreate,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Create new producer notes.

    Args:
        notes_data: Producer notes creation data
        service: ProducerNotes service instance

    Returns:
        Created producer notes

    Raises:
        HTTPException: If creation fails
    """
    try:
        return await service.create_producer_notes(notes_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[ProducerNotesResponse],
    summary="List producer notes with pagination",
    description="Get paginated list of producer notes",
)
async def list_producer_notes(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
) -> PaginatedResponse[ProducerNotesResponse]:
    """List producer notes with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: ProducerNotes repository instance

    Returns:
        Paginated list of producer notes
    """
    cursor_uuid = UUID(cursor) if cursor else None
    notes_list = repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(notes_list) > limit
    items = notes_list[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[ProducerNotesResponse.model_validate(n) for n in items],
        page_info=page_info,
    )


@router.get(
    "/{notes_id}",
    response_model=ProducerNotesResponse,
    summary="Get producer notes by ID",
    description="Retrieve specific producer notes by ID",
    responses={
        200: {"description": "Producer notes found"},
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def get_producer_notes(
    notes_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Get producer notes by ID.

    Args:
        notes_id: ProducerNotes UUID
        service: ProducerNotes service instance

    Returns:
        Producer notes data

    Raises:
        HTTPException: If notes not found
    """
    notes = await service.get_producer_notes(notes_id)
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )
    return notes


@router.patch(
    "/{notes_id}",
    response_model=ProducerNotesResponse,
    summary="Update producer notes",
    description="Update existing producer notes fields",
    responses={
        200: {"description": "Producer notes updated successfully"},
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def update_producer_notes(
    notes_id: UUID,
    notes_data: ProducerNotesUpdate,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Update producer notes.

    Args:
        notes_id: ProducerNotes UUID
        notes_data: Fields to update
        service: ProducerNotes service instance

    Returns:
        Updated producer notes

    Raises:
        HTTPException: If notes not found or validation fails
    """
    try:
        return await service.update_producer_notes(notes_id, notes_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Handle NotFoundError from service
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producer notes {notes_id} not found",
            )
        raise


@router.delete(
    "/{notes_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete producer notes",
    description="Soft delete producer notes",
    responses={
        204: {"description": "Producer notes deleted successfully"},
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def delete_producer_notes(
    notes_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> None:
    """Delete producer notes (soft delete).

    Args:
        notes_id: ProducerNotes UUID
        service: ProducerNotes service instance

    Raises:
        HTTPException: If notes not found
    """
    success = await service.delete_producer_notes(notes_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )


@router.get(
    "/song/{song_id}",
    response_model=list[ProducerNotesResponse],
    summary="Get producer notes by song ID",
    description="Retrieve all producer notes versions for a specific song",
    responses={
        200: {"description": "Producer notes found for song"},
    },
)
async def get_by_song_id(
    song_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> list[ProducerNotesResponse]:
    """Get all producer notes for a specific song.

    Args:
        song_id: Song UUID
        service: ProducerNotes service instance

    Returns:
        List of producer notes versions for the song, ordered by created_at descending
    """
    return await service.get_by_song_id(song_id)
