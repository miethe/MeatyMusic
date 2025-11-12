"""API endpoints for Style management.

Styles define genre, tempo, mood, instrumentation, and other musical
characteristics for song creation.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_style_repository, get_style_service
from app.repositories import StyleRepository
from app.services import StyleService
from app.schemas import (
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
    StyleCreate,
    StyleResponse,
    StyleUpdate,
)

router = APIRouter(prefix="/styles", tags=["Styles"])


@router.post(
    "",
    response_model=StyleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new style",
    description="Create a new style with genre, tempo, mood, and instrumentation",
    responses={
        201: {"description": "Style created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid style data or tag conflicts"},
    },
)
async def create_style(
    style_data: StyleCreate,
    service: StyleService = Depends(get_style_service),
    repo: StyleRepository = Depends(get_style_repository),
) -> StyleResponse:
    """Create a new style with tag conflict validation.

    Args:
        style_data: Style creation data
        service: Style service instance (for validation)
        repo: Style repository instance

    Returns:
        Created style

    Raises:
        HTTPException: If style creation fails or tags conflict
    """
    # Validate tag conflicts using service
    style_dict = style_data.model_dump()
    tags = style_dict.get("tags", [])
    if tags:
        conflicts = await service._validate_tag_conflicts(tags)
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag conflicts detected: {', '.join(conflicts)}",
            )

    try:
        style = await repo.create(style_dict)
        return StyleResponse.model_validate(style)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[StyleResponse],
    summary="List styles with pagination",
    description="Get paginated list of styles",
)
async def list_styles(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: StyleRepository = Depends(get_style_repository),
) -> PaginatedResponse[StyleResponse]:
    """List styles with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: Style repository instance

    Returns:
        Paginated list of styles
    """
    cursor_uuid = UUID(cursor) if cursor else None
    styles = await repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(styles) > limit
    items = styles[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[StyleResponse.model_validate(s) for s in items],
        page_info=page_info,
    )


@router.get(
    "/{style_id}",
    response_model=StyleResponse,
    summary="Get style by ID",
    description="Retrieve a specific style by its ID",
    responses={
        200: {"description": "Style found"},
        404: {"model": ErrorResponse, "description": "Style not found"},
    },
)
async def get_style(
    style_id: UUID,
    repo: StyleRepository = Depends(get_style_repository),
) -> StyleResponse:
    """Get a style by ID.

    Args:
        style_id: Style UUID
        repo: Style repository instance

    Returns:
        Style data

    Raises:
        HTTPException: If style not found
    """
    style = await repo.get_by_id(style_id)
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style {style_id} not found",
        )
    return StyleResponse.model_validate(style)


@router.patch(
    "/{style_id}",
    response_model=StyleResponse,
    summary="Update a style",
    description="Update an existing style's fields",
    responses={
        200: {"description": "Style updated successfully"},
        404: {"model": ErrorResponse, "description": "Style not found"},
        400: {"model": ErrorResponse, "description": "Tag conflicts detected"},
    },
)
async def update_style(
    style_id: UUID,
    style_data: StyleUpdate,
    service: StyleService = Depends(get_style_service),
    repo: StyleRepository = Depends(get_style_repository),
) -> StyleResponse:
    """Update a style with tag conflict validation.

    Args:
        style_id: Style UUID
        style_data: Fields to update
        service: Style service instance (for validation)
        repo: Style repository instance

    Returns:
        Updated style

    Raises:
        HTTPException: If style not found or tags conflict
    """
    existing = await repo.get_by_id(style_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style {style_id} not found",
        )

    # Validate tag conflicts if tags are being updated
    update_dict = style_data.model_dump(exclude_unset=True)
    if "tags" in update_dict:
        conflicts = await service._validate_tag_conflicts(update_dict["tags"])
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag conflicts detected: {', '.join(conflicts)}",
            )

    updated = await repo.update(style_id, update_dict)
    return StyleResponse.model_validate(updated)


@router.delete(
    "/{style_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a style",
    description="Soft delete a style",
    responses={
        204: {"description": "Style deleted successfully"},
        404: {"model": ErrorResponse, "description": "Style not found"},
    },
)
async def delete_style(
    style_id: UUID,
    repo: StyleRepository = Depends(get_style_repository),
) -> None:
    """Delete a style (soft delete).

    Args:
        style_id: Style UUID
        repo: Style repository instance

    Raises:
        HTTPException: If style not found
    """
    existing = await repo.get_by_id(style_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style {style_id} not found",
        )

    await repo.delete(style_id)


@router.get(
    "/by-genre/{genre}",
    response_model=List[StyleResponse],
    summary="Get styles by genre",
    description="Filter styles by primary genre",
)
async def get_styles_by_genre(
    genre: str,
    repo: StyleRepository = Depends(get_style_repository),
) -> List[StyleResponse]:
    """Get styles by genre.

    Args:
        genre: Genre name (e.g., 'pop', 'rock', 'hiphop')
        repo: Style repository instance

    Returns:
        List of styles matching the genre
    """
    styles = await repo.get_by_genre(genre)
    return [StyleResponse.model_validate(s) for s in styles]


@router.get(
    "/search",
    response_model=List[StyleResponse],
    summary="Search styles with filters",
    description="Search styles by BPM range, mood, tags, and energy level",
)
async def search_styles(
    bpm_min: Optional[int] = Query(None, ge=40, le=220, description="Minimum BPM"),
    bpm_max: Optional[int] = Query(None, ge=40, le=220, description="Maximum BPM"),
    mood: Optional[str] = Query(None, description="Mood filter"),
    energy_min: Optional[int] = Query(None, ge=1, le=10, description="Minimum energy level"),
    energy_max: Optional[int] = Query(None, ge=1, le=10, description="Maximum energy level"),
    tags: Optional[List[str]] = Query(None, description="Tags to filter by"),
    repo: StyleRepository = Depends(get_style_repository),
) -> List[StyleResponse]:
    """Search styles with multiple filters.

    Args:
        bpm_min: Minimum BPM
        bpm_max: Maximum BPM
        mood: Mood filter
        energy_min: Minimum energy level
        energy_max: Maximum energy level
        tags: List of tags to filter by
        repo: Style repository instance

    Returns:
        List of styles matching the filters
    """
    # Start with all styles and apply filters progressively
    results = []

    # If BPM filters provided
    if bpm_min is not None or bpm_max is not None:
        bpm_results = await repo.get_by_bpm_range(
            bpm_min or 40,
            bpm_max or 220,
        )
        results = bpm_results

    # If mood filter provided
    if mood:
        mood_results = await repo.get_by_mood(mood)
        if results:
            # Intersection
            mood_ids = {s.id for s in mood_results}
            results = [s for s in results if s.id in mood_ids]
        else:
            results = mood_results

    # If energy filters provided
    if energy_min is not None or energy_max is not None:
        energy_results = await repo.get_by_energy_range(
            energy_min or 1,
            energy_max or 10,
        )
        if results:
            # Intersection
            energy_ids = {s.id for s in energy_results}
            results = [s for s in results if s.id in energy_ids]
        else:
            results = energy_results

    # If tags filter provided
    if tags:
        tag_results = await repo.search_by_tags(tags)
        if results:
            # Intersection
            tag_ids = {s.id for s in tag_results}
            results = [s for s in results if s.id in tag_ids]
        else:
            results = tag_results

    # If no filters, return empty list
    if not results and not any([bpm_min, bpm_max, mood, energy_min, energy_max, tags]):
        results = await repo.list(limit=50)

    return [StyleResponse.model_validate(s) for s in results]
