"""API endpoints for Lyrics management.

Lyrics define section structure, rhyme schemes, constraints,
and generated lyric content for songs.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_lyrics_service
from app.errors import BadRequestError
from app.services import LyricsService
from app.schemas import (
    ErrorResponse,
    LyricsCreate,
    LyricsResponse,
    LyricsUpdate,
    PageInfo,
    PaginatedResponse,
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
    lyrics_list = await service.repo.list(limit=limit + 1, offset=cursor_uuid)

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
