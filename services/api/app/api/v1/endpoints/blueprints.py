"""API endpoints for Blueprint management.

Blueprints define genre-specific rules, evaluation rubrics, and constraints
for the music creation workflow.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.dependencies import get_blueprint_repository, get_blueprint_service
from app.errors import BadRequestError, NotFoundError
from app.repositories import BlueprintRepository
from app.schemas import (
    BlueprintCreate,
    BlueprintResponse,
    BlueprintUpdate,
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
)
from app.services import BlueprintService

router = APIRouter(prefix="/blueprints", tags=["Blueprints"])


# Request/Response models for validation endpoints
class ValidateTagsRequest(BaseModel):
    """Request model for tag conflict validation."""

    tags: List[str]


class TagConflictResponse(BaseModel):
    """Response model for tag conflict validation."""

    is_valid: bool
    conflicts: List[Tuple[str, str]]
    message: Optional[str] = None


class ValidateRubricRequest(BaseModel):
    """Request model for rubric weight validation."""

    weights: Dict[str, float]


class RubricValidationResponse(BaseModel):
    """Response model for rubric weight validation."""

    is_valid: bool
    total: float
    error_message: Optional[str] = None


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
    service: BlueprintService = Depends(get_blueprint_service),
) -> BlueprintResponse:
    """Create a new blueprint.

    Args:
        blueprint_data: Blueprint creation data
        service: Blueprint service instance

    Returns:
        Created blueprint

    Raises:
        HTTPException: If blueprint creation fails
    """
    try:
        blueprint = service.create_blueprint(blueprint_data)
        return BlueprintResponse.model_validate(blueprint)
    except (ValueError, BadRequestError) as e:
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
    blueprints = repo.list(limit=limit + 1, offset=cursor_uuid)

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
    "/load/{genre}",
    response_model=BlueprintResponse,
    summary="Load blueprint from file",
    description="Get blueprint with automatic loading from markdown files and caching",
    responses={
        200: {"description": "Blueprint loaded successfully"},
        404: {"model": ErrorResponse, "description": "Blueprint file not found"},
        400: {"model": ErrorResponse, "description": "Invalid blueprint file"},
    },
)
async def load_blueprint(
    genre: str,
    version: str = Query("latest", description="Blueprint version"),
    service: BlueprintService = Depends(get_blueprint_service),
) -> BlueprintResponse:
    """Load blueprint from file with automatic caching.

    This endpoint loads blueprints from markdown files in the
    /docs/hit_song_blueprint/AI/ directory and caches them for performance.

    Args:
        genre: Genre name (e.g., 'pop', 'country', 'hip-hop')
        version: Blueprint version (default 'latest')
        service: Blueprint service instance

    Returns:
        Blueprint data loaded from file

    Raises:
        HTTPException: If blueprint file not found or malformed
    """
    try:
        blueprint = service.get_or_load_blueprint(genre, version)
        return BlueprintResponse.model_validate(blueprint)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    service: BlueprintService = Depends(get_blueprint_service),
) -> BlueprintResponse:
    """Get a blueprint by ID.

    Args:
        blueprint_id: Blueprint UUID
        service: Blueprint service instance

    Returns:
        Blueprint data

    Raises:
        HTTPException: If blueprint not found
    """
    blueprint = service.get_blueprint_by_id(blueprint_id)
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
        400: {"model": ErrorResponse, "description": "Invalid blueprint data"},
    },
)
async def update_blueprint(
    blueprint_id: UUID,
    blueprint_data: BlueprintUpdate,
    service: BlueprintService = Depends(get_blueprint_service),
) -> BlueprintResponse:
    """Update a blueprint.

    Args:
        blueprint_id: Blueprint UUID
        blueprint_data: Fields to update
        service: Blueprint service instance

    Returns:
        Updated blueprint

    Raises:
        HTTPException: If blueprint not found or validation fails
    """
    try:
        updated = service.update_blueprint(blueprint_id, blueprint_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Blueprint {blueprint_id} not found",
            )
        return BlueprintResponse.model_validate(updated)
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


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
    service: BlueprintService = Depends(get_blueprint_service),
) -> None:
    """Delete a blueprint (soft delete).

    Args:
        blueprint_id: Blueprint UUID
        service: Blueprint service instance

    Raises:
        HTTPException: If blueprint not found
    """
    success = service.delete_blueprint(blueprint_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blueprint {blueprint_id} not found",
        )


@router.get(
    "/by-genre/{genre}",
    response_model=List[BlueprintResponse],
    summary="Get blueprints by genre",
    description="Filter blueprints by genre name from database",
)
async def get_blueprints_by_genre(
    genre: str,
    service: BlueprintService = Depends(get_blueprint_service),
) -> List[BlueprintResponse]:
    """Get blueprints for a specific genre from database.

    Args:
        genre: Genre name (e.g., 'pop', 'rock', 'hiphop')
        service: Blueprint service instance

    Returns:
        List of blueprints matching the genre
    """
    blueprints = service.get_blueprints_by_genre(genre)
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

    Note: This endpoint still uses repository directly as the service
    doesn't provide a search_by_tags method yet.

    Args:
        tags: List of tags to search for
        repo: Blueprint repository instance

    Returns:
        List of blueprints containing any of the specified tags
    """
    blueprints = repo.search_by_tags(tags)
    return [BlueprintResponse.model_validate(bp) for bp in blueprints]


# Validation endpoints
@router.post(
    "/validate/tags",
    response_model=TagConflictResponse,
    summary="Validate tag conflicts",
    description="Check for conflicting style tags using the conflict matrix",
    responses={
        200: {"description": "Validation completed"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def validate_tag_conflicts(
    request: ValidateTagsRequest,
    service: BlueprintService = Depends(get_blueprint_service),
) -> TagConflictResponse:
    """Validate tag conflicts.

    Checks the provided tags against the conflict matrix to identify
    any tags that conflict with each other (e.g., "whisper" with "anthemic").

    Args:
        request: Request containing tags to validate
        service: Blueprint service instance

    Returns:
        Validation result with conflict information
    """
    try:
        conflicts = service.get_tag_conflicts(request.tags)
        is_valid = len(conflicts) == 0

        message = None
        if not is_valid:
            conflict_strs = [f"{a} ↔ {b}" for a, b in conflicts]
            message = f"Found {len(conflicts)} conflict(s): {', '.join(conflict_strs)}"
        else:
            message = "No conflicts found"

        return TagConflictResponse(
            is_valid=is_valid,
            conflicts=conflicts,
            message=message,
        )
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/validate/rubric",
    response_model=RubricValidationResponse,
    summary="Validate rubric weights",
    description="Validate that rubric weights sum to 1.0",
    responses={
        200: {"description": "Validation completed"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def validate_rubric_weights(
    request: ValidateRubricRequest,
    service: BlueprintService = Depends(get_blueprint_service),
) -> RubricValidationResponse:
    """Validate rubric weights.

    Ensures that evaluation rubric weights are valid:
    - All weights are positive
    - Sum of weights equals 1.0 (within tolerance of 0.01)

    Args:
        request: Request containing weights to validate
        service: Blueprint service instance

    Returns:
        Validation result with total and error message
    """
    is_valid, error_message = service.validate_rubric_weights(request.weights)
    total = sum(request.weights.values())

    return RubricValidationResponse(
        is_valid=is_valid,
        total=total,
        error_message=error_message,
    )


@router.get(
    "/conflicts",
    response_model=Dict[str, List[str]],
    summary="Get conflict matrix",
    description="Get the complete tag conflict matrix",
    responses={
        200: {"description": "Conflict matrix retrieved"},
        400: {"model": ErrorResponse, "description": "Failed to load conflict matrix"},
    },
)
async def get_conflict_matrix(
    service: BlueprintService = Depends(get_blueprint_service),
) -> Dict[str, List[str]]:
    """Get the tag conflict matrix.

    Returns the complete conflict matrix that defines which style tags
    conflict with each other.

    Args:
        service: Blueprint service instance

    Returns:
        Dict mapping tag name to list of conflicting tags
    """
    try:
        matrix = service.load_conflict_matrix()
        return matrix
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
