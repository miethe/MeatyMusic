"""API endpoints for Blueprint management.

Blueprints define genre-specific rules, evaluation rubrics, and constraints
for the music creation workflow.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_blueprint_repository
from app.repositories import BlueprintRepository
from app.schemas import (
    BlueprintCreate,
    BlueprintResponse,
    BlueprintUpdate,
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
)

router = APIRouter(prefix="/blueprints", tags=["Blueprints"])


@router.post(
    "",
    response_model=BlueprintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new blueprint",
    description="Create a new blueprint with genre rules and evaluation rubric",
    responses={
        201: {"description": "Blueprint created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid blueprint data"},
    },
)
async def create_blueprint(
    blueprint_data: BlueprintCreate,
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> BlueprintResponse:
    """Create a new blueprint.

    Args:
        blueprint_data: Blueprint creation data
        repo: Blueprint repository instance

    Returns:
        Created blueprint

    Raises:
        HTTPException: If blueprint creation fails
    """
    try:
        blueprint = await repo.create(blueprint_data.model_dump())
        return BlueprintResponse.model_validate(blueprint)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[BlueprintResponse],
    summary="List blueprints with pagination",
    description="Get paginated list of blueprints with optional filtering",
)
async def list_blueprints(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> PaginatedResponse[BlueprintResponse]:
    """List blueprints with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor (UUID of last item from previous page)
        repo: Blueprint repository instance

    Returns:
        Paginated list of blueprints
    """
    # Convert cursor to UUID if provided
    cursor_uuid = UUID(cursor) if cursor else None

    # Fetch one extra to determine if there's a next page
    blueprints = await repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(blueprints) > limit
    items = blueprints[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[BlueprintResponse.model_validate(bp) for bp in items],
        page_info=page_info,
    )


@router.get(
    "/{blueprint_id}",
    response_model=BlueprintResponse,
    summary="Get blueprint by ID",
    description="Retrieve a specific blueprint by its ID",
    responses={
        200: {"description": "Blueprint found"},
        404: {"model": ErrorResponse, "description": "Blueprint not found"},
    },
)
async def get_blueprint(
    blueprint_id: UUID,
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> BlueprintResponse:
    """Get a blueprint by ID.

    Args:
        blueprint_id: Blueprint UUID
        repo: Blueprint repository instance

    Returns:
        Blueprint data

    Raises:
        HTTPException: If blueprint not found
    """
    blueprint = await repo.get_by_id(blueprint_id)
    if not blueprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blueprint {blueprint_id} not found",
        )
    return BlueprintResponse.model_validate(blueprint)


@router.patch(
    "/{blueprint_id}",
    response_model=BlueprintResponse,
    summary="Update a blueprint",
    description="Update an existing blueprint's fields",
    responses={
        200: {"description": "Blueprint updated successfully"},
        404: {"model": ErrorResponse, "description": "Blueprint not found"},
    },
)
async def update_blueprint(
    blueprint_id: UUID,
    blueprint_data: BlueprintUpdate,
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> BlueprintResponse:
    """Update a blueprint.

    Args:
        blueprint_id: Blueprint UUID
        blueprint_data: Fields to update
        repo: Blueprint repository instance

    Returns:
        Updated blueprint

    Raises:
        HTTPException: If blueprint not found
    """
    # Check if blueprint exists
    existing = await repo.get_by_id(blueprint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blueprint {blueprint_id} not found",
        )

    # Update blueprint
    updated = await repo.update(
        blueprint_id,
        blueprint_data.model_dump(exclude_unset=True),
    )
    return BlueprintResponse.model_validate(updated)


@router.delete(
    "/{blueprint_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a blueprint",
    description="Soft delete a blueprint (marks as deleted)",
    responses={
        204: {"description": "Blueprint deleted successfully"},
        404: {"model": ErrorResponse, "description": "Blueprint not found"},
    },
)
async def delete_blueprint(
    blueprint_id: UUID,
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> None:
    """Delete a blueprint (soft delete).

    Args:
        blueprint_id: Blueprint UUID
        repo: Blueprint repository instance

    Raises:
        HTTPException: If blueprint not found
    """
    # Check if blueprint exists
    existing = await repo.get_by_id(blueprint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blueprint {blueprint_id} not found",
        )

    await repo.delete(blueprint_id)


@router.get(
    "/by-genre/{genre}",
    response_model=List[BlueprintResponse],
    summary="Get blueprints by genre",
    description="Filter blueprints by genre name",
)
async def get_blueprints_by_genre(
    genre: str,
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> List[BlueprintResponse]:
    """Get blueprints for a specific genre.

    Args:
        genre: Genre name (e.g., 'pop', 'rock', 'hiphop')
        repo: Blueprint repository instance

    Returns:
        List of blueprints matching the genre
    """
    blueprints = await repo.get_by_genre(genre)
    return [BlueprintResponse.model_validate(bp) for bp in blueprints]


@router.get(
    "/search/tags",
    response_model=List[BlueprintResponse],
    summary="Search blueprints by tags",
    description="Find blueprints containing specific tags in their tag categories",
)
async def search_blueprints_by_tags(
    tags: List[str] = Query(..., description="Tags to search for"),
    repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> List[BlueprintResponse]:
    """Search blueprints by tags.

    Args:
        tags: List of tags to search for
        repo: Blueprint repository instance

    Returns:
        List of blueprints containing any of the specified tags
    """
    blueprints = await repo.search_by_tags(tags)
    return [BlueprintResponse.model_validate(bp) for bp in blueprints]
