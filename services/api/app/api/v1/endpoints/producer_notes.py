"""API endpoints for ProducerNotes management.

Producer notes define arrangement, structure, hooks, and mix targets
for song production.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_producer_notes_repository
from app.repositories import ProducerNotesRepository
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
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
) -> ProducerNotesResponse:
    """Create new producer notes.

    Args:
        notes_data: Producer notes creation data
        repo: ProducerNotes repository instance

    Returns:
        Created producer notes

    Raises:
        HTTPException: If creation fails
    """
    try:
        notes = await repo.create(notes_data.model_dump())
        return ProducerNotesResponse.model_validate(notes)
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
    notes_list = await repo.list(limit=limit + 1, offset=cursor_uuid)

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
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
) -> ProducerNotesResponse:
    """Get producer notes by ID.

    Args:
        notes_id: ProducerNotes UUID
        repo: ProducerNotes repository instance

    Returns:
        Producer notes data

    Raises:
        HTTPException: If notes not found
    """
    notes = await repo.get_by_id(notes_id)
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )
    return ProducerNotesResponse.model_validate(notes)


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
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
) -> ProducerNotesResponse:
    """Update producer notes.

    Args:
        notes_id: ProducerNotes UUID
        notes_data: Fields to update
        repo: ProducerNotes repository instance

    Returns:
        Updated producer notes

    Raises:
        HTTPException: If notes not found
    """
    existing = await repo.get_by_id(notes_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )

    updated = await repo.update(
        notes_id,
        notes_data.model_dump(exclude_unset=True),
    )
    return ProducerNotesResponse.model_validate(updated)


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
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
) -> None:
    """Delete producer notes (soft delete).

    Args:
        notes_id: ProducerNotes UUID
        repo: ProducerNotes repository instance

    Raises:
        HTTPException: If notes not found
    """
    existing = await repo.get_by_id(notes_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )

    await repo.delete(notes_id)
