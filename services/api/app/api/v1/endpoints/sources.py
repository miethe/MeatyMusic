"""API endpoints for Source management.

Sources represent external knowledge bases (files, APIs, web) used
for lyric generation and context.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_source_repository
from app.repositories import SourceRepository
from app.schemas import (
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
    SourceCreate,
    SourceKind,
    SourceResponse,
    SourceUpdate,
)

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.post(
    "",
    response_model=SourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new source",
    description="Register a new external knowledge source (file, API, or web)",
    responses={
        201: {"description": "Source created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid source data"},
    },
)
async def create_source(
    source_data: SourceCreate,
    repo: SourceRepository = Depends(get_source_repository),
) -> SourceResponse:
    """Create a new source.

    Args:
        source_data: Source creation data
        repo: Source repository instance

    Returns:
        Created source

    Raises:
        HTTPException: If source creation fails
    """
    try:
        source = await repo.create(source_data.model_dump())
        return SourceResponse.model_validate(source)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[SourceResponse],
    summary="List sources with pagination",
    description="Get paginated list of sources",
)
async def list_sources(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: SourceRepository = Depends(get_source_repository),
) -> PaginatedResponse[SourceResponse]:
    """List sources with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: Source repository instance

    Returns:
        Paginated list of sources
    """
    cursor_uuid = UUID(cursor) if cursor else None
    sources = await repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(sources) > limit
    items = sources[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[SourceResponse.model_validate(s) for s in items],
        page_info=page_info,
    )


@router.get(
    "/{source_id}",
    response_model=SourceResponse,
    summary="Get source by ID",
    description="Retrieve a specific source by its ID",
    responses={
        200: {"description": "Source found"},
        404: {"model": ErrorResponse, "description": "Source not found"},
    },
)
async def get_source(
    source_id: UUID,
    repo: SourceRepository = Depends(get_source_repository),
) -> SourceResponse:
    """Get a source by ID.

    Args:
        source_id: Source UUID
        repo: Source repository instance

    Returns:
        Source data

    Raises:
        HTTPException: If source not found
    """
    source = await repo.get_by_id(source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found",
        )
    return SourceResponse.model_validate(source)


@router.patch(
    "/{source_id}",
    response_model=SourceResponse,
    summary="Update a source",
    description="Update an existing source's fields",
    responses={
        200: {"description": "Source updated successfully"},
        404: {"model": ErrorResponse, "description": "Source not found"},
    },
)
async def update_source(
    source_id: UUID,
    source_data: SourceUpdate,
    repo: SourceRepository = Depends(get_source_repository),
) -> SourceResponse:
    """Update a source.

    Args:
        source_id: Source UUID
        source_data: Fields to update
        repo: Source repository instance

    Returns:
        Updated source

    Raises:
        HTTPException: If source not found
    """
    existing = await repo.get_by_id(source_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found",
        )

    updated = await repo.update(
        source_id,
        source_data.model_dump(exclude_unset=True),
    )
    return SourceResponse.model_validate(updated)


@router.delete(
    "/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a source",
    description="Soft delete a source",
    responses={
        204: {"description": "Source deleted successfully"},
        404: {"model": ErrorResponse, "description": "Source not found"},
    },
)
async def delete_source(
    source_id: UUID,
    repo: SourceRepository = Depends(get_source_repository),
) -> None:
    """Delete a source (soft delete).

    Args:
        source_id: Source UUID
        repo: Source repository instance

    Raises:
        HTTPException: If source not found
    """
    existing = await repo.get_by_id(source_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found",
        )

    await repo.delete(source_id)


@router.get(
    "/by-kind/{kind}",
    response_model=List[SourceResponse],
    summary="Get sources by kind",
    description="Filter sources by kind (file, api, web)",
)
async def get_sources_by_kind(
    kind: SourceKind,
    repo: SourceRepository = Depends(get_source_repository),
) -> List[SourceResponse]:
    """Get sources by kind.

    Args:
        kind: Source kind (file, api, web)
        repo: Source repository instance

    Returns:
        List of sources matching the kind
    """
    sources = await repo.get_by_kind(kind.value)
    return [SourceResponse.model_validate(s) for s in sources]


@router.get(
    "/by-scope/{scope}",
    response_model=List[SourceResponse],
    summary="Get sources by MCP scope",
    description="Filter sources by MCP scope",
)
async def get_sources_by_scope(
    scope: str,
    repo: SourceRepository = Depends(get_source_repository),
) -> List[SourceResponse]:
    """Get sources by MCP scope.

    Args:
        scope: MCP scope identifier
        repo: Source repository instance

    Returns:
        List of sources with matching scope
    """
    sources = await repo.get_by_scope(scope)
    return [SourceResponse.model_validate(s) for s in sources]
