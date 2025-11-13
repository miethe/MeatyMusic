"""API endpoints for Song management.

Songs are the main entity that aggregates styles, lyrics, personas,
and producer notes into a complete Song Design Spec (SDS).
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_song_repository, get_song_service
from app.repositories import SongRepository
from app.services import SongService
from app.schemas import (
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
    SongCreate,
    SongResponse,
    SongStatus,
    SongUpdate,
    StatusUpdateRequest,
)

router = APIRouter(prefix="/songs", tags=["Songs"])


@router.post(
    "",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new song",
    description="Create a new song with SDS validation",
    responses={
        201: {"description": "Song created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid song data or SDS validation failed"},
    },
)
async def create_song(
    song_data: SongCreate,
    service: SongService = Depends(get_song_service),
    repo: SongRepository = Depends(get_song_repository),
) -> SongResponse:
    """Create a new song with SDS validation.

    Args:
        song_data: Song creation data
        service: Song service instance (for validation)
        repo: Song repository instance

    Returns:
        Created song

    Raises:
        HTTPException: If song creation or SDS validation fails
    """
    song_dict = song_data.model_dump()

    # Validate SDS if provided
    if "sds" in song_dict and song_dict["sds"]:
        try:
            await service.validate_sds(song_dict["sds"])
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SDS validation failed: {str(e)}",
            )

    try:
        song = await repo.create(song_dict)
        return SongResponse.model_validate(song)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[SongResponse],
    summary="List songs with pagination",
    description="Get paginated list of songs",
)
async def list_songs(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: SongRepository = Depends(get_song_repository),
) -> PaginatedResponse[SongResponse]:
    """List songs with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: Song repository instance

    Returns:
        Paginated list of songs
    """
    cursor_uuid = UUID(cursor) if cursor else None
    songs = await repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(songs) > limit
    items = songs[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[SongResponse.model_validate(s) for s in items],
        page_info=page_info,
    )


@router.get(
    "/{song_id}",
    response_model=SongResponse,
    summary="Get song by ID",
    description="Retrieve a specific song by its ID",
    responses={
        200: {"description": "Song found"},
        404: {"model": ErrorResponse, "description": "Song not found"},
    },
)
async def get_song(
    song_id: UUID,
    repo: SongRepository = Depends(get_song_repository),
) -> SongResponse:
    """Get a song by ID.

    Args:
        song_id: Song UUID
        repo: Song repository instance

    Returns:
        Song data

    Raises:
        HTTPException: If song not found
    """
    song = await repo.get_by_id(song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )
    return SongResponse.model_validate(song)


@router.patch(
    "/{song_id}",
    response_model=SongResponse,
    summary="Update a song",
    description="Update an existing song's fields",
    responses={
        200: {"description": "Song updated successfully"},
        404: {"model": ErrorResponse, "description": "Song not found"},
        400: {"model": ErrorResponse, "description": "SDS validation failed"},
    },
)
async def update_song(
    song_id: UUID,
    song_data: SongUpdate,
    service: SongService = Depends(get_song_service),
    repo: SongRepository = Depends(get_song_repository),
) -> SongResponse:
    """Update a song with SDS validation.

    Args:
        song_id: Song UUID
        song_data: Fields to update
        service: Song service instance (for validation)
        repo: Song repository instance

    Returns:
        Updated song

    Raises:
        HTTPException: If song not found or SDS validation fails
    """
    existing = await repo.get_by_id(song_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )

    update_dict = song_data.model_dump(exclude_unset=True)

    # Validate SDS if being updated
    if "sds" in update_dict and update_dict["sds"]:
        try:
            await service.validate_sds(update_dict["sds"])
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SDS validation failed: {str(e)}",
            )

    updated = await repo.update(song_id, update_dict)
    return SongResponse.model_validate(updated)


@router.delete(
    "/{song_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a song",
    description="Soft delete a song",
    responses={
        204: {"description": "Song deleted successfully"},
        404: {"model": ErrorResponse, "description": "Song not found"},
    },
)
async def delete_song(
    song_id: UUID,
    repo: SongRepository = Depends(get_song_repository),
) -> None:
    """Delete a song (soft delete).

    Args:
        song_id: Song UUID
        repo: Song repository instance

    Raises:
        HTTPException: If song not found
    """
    existing = await repo.get_by_id(song_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )

    await repo.delete(song_id)


@router.get(
    "/by-status/{status}",
    response_model=List[SongResponse],
    summary="Get songs by status",
    description="Filter songs by status (draft, pending, completed, failed)",
)
async def get_songs_by_status(
    status: SongStatus,
    repo: SongRepository = Depends(get_song_repository),
) -> List[SongResponse]:
    """Get songs by status.

    Args:
        status: Song status filter
        repo: Song repository instance

    Returns:
        List of songs matching the status
    """
    songs = await repo.get_by_status(status.value)
    return [SongResponse.model_validate(s) for s in songs]


@router.get(
    "/{song_id}/with-artifacts",
    response_model=SongResponse,
    summary="Get song with all related artifacts",
    description="Retrieve song with eager-loaded style, lyrics, producer notes, and composed prompts",
    responses={
        200: {"description": "Song with artifacts found"},
        404: {"model": ErrorResponse, "description": "Song not found"},
    },
)
async def get_song_with_artifacts(
    song_id: UUID,
    service: SongService = Depends(get_song_service),
) -> SongResponse:
    """Get song with all related artifacts.

    Args:
        song_id: Song UUID
        service: Song service instance

    Returns:
        Song with all related entities loaded

    Raises:
        HTTPException: If song not found
    """
    song = await service.get_song_with_artifacts(song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )
    return SongResponse.model_validate(song)


@router.patch(
    "/{song_id}/status",
    response_model=SongResponse,
    summary="Update song status",
    description="Update only the song's status field",
    responses={
        200: {"description": "Status updated successfully"},
        404: {"model": ErrorResponse, "description": "Song not found"},
    },
)
async def update_song_status(
    song_id: UUID,
    status_update: StatusUpdateRequest,
    service: SongService = Depends(get_song_service),
) -> SongResponse:
    """Update song status.

    Args:
        song_id: Song UUID
        status_update: New status value
        service: Song service instance

    Returns:
        Updated song

    Raises:
        HTTPException: If song not found
    """
    song = await service.update_song_status(song_id, status_update.status)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )
    return SongResponse.model_validate(song)
