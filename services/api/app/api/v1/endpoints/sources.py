"""API endpoints for Source management.

Sources represent external knowledge bases (files, APIs, web) used
for lyric generation and context.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_source_service
from app.services import SourceService
from app.schemas import (
    Chunk,
    ChunkWithHash,
    ErrorResponse,
    MCPServerInfo,
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
    service: SourceService = Depends(get_source_service),
) -> SourceResponse:
    """Create a new source.

    Args:
        source_data: Source creation data
        service: Source service instance

    Returns:
        Created source

    Raises:
        HTTPException: If source creation fails
    """
    try:
        # TODO: Get owner_id and tenant_id from auth context
        # For now, using placeholder UUIDs
        from uuid import uuid4
        owner_id = uuid4()
        tenant_id = uuid4()

        source = await service.create_source(
            data=source_data,
            owner_id=owner_id,
            tenant_id=tenant_id
        )
        return source
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
    service: SourceService = Depends(get_source_service),
) -> PaginatedResponse[SourceResponse]:
    """List sources with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        service: Source service instance

    Returns:
        Paginated list of sources
    """
    cursor_uuid = UUID(cursor) if cursor else None
    # Use repository through service for pagination (not yet implemented in service)
    sources = service.repo.list(limit=limit + 1, offset=cursor_uuid)

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
    service: SourceService = Depends(get_source_service),
) -> SourceResponse:
    """Get a source by ID.

    Args:
        source_id: Source UUID
        service: Source service instance

    Returns:
        Source data

    Raises:
        HTTPException: If source not found
    """
    try:
        source = await service.get_source(source_id)
        return source
    except Exception as e:
        # Handle NotFoundError from service
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source {source_id} not found",
            )
        raise


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
    service: SourceService = Depends(get_source_service),
) -> SourceResponse:
    """Update a source.

    Args:
        source_id: Source UUID
        source_data: Fields to update
        service: Source service instance

    Returns:
        Updated source

    Raises:
        HTTPException: If source not found
    """
    # Check if source exists
    try:
        await service.get_source(source_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found",
        )

    # Update via repository (service doesn't have update method yet)
    updated = service.repo.update(
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
    service: SourceService = Depends(get_source_service),
) -> None:
    """Delete a source (soft delete).

    Args:
        source_id: Source UUID
        service: Source service instance

    Raises:
        HTTPException: If source not found
    """
    # Check if source exists
    try:
        await service.get_source(source_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found",
        )

    # Delete via repository (service doesn't have delete method yet)
    service.repo.delete(source_id)


@router.get(
    "/by-kind/{kind}",
    response_model=List[SourceResponse],
    summary="Get sources by kind",
    description="Filter sources by kind (file, api, web)",
)
async def get_sources_by_kind(
    kind: SourceKind,
    service: SourceService = Depends(get_source_service),
) -> List[SourceResponse]:
    """Get sources by kind.

    Args:
        kind: Source kind (file, api, web)
        service: Source service instance

    Returns:
        List of sources matching the kind
    """
    sources = service.repo.get_by_source_type(kind.value)
    return [SourceResponse.model_validate(s) for s in sources]


@router.get(
    "/by-scope/{scope}",
    response_model=List[SourceResponse],
    summary="Get sources by MCP scope",
    description="Filter sources by MCP scope",
)
async def get_sources_by_scope(
    scope: str,
    service: SourceService = Depends(get_source_service),
) -> List[SourceResponse]:
    """Get sources by MCP scope.

    Args:
        scope: MCP scope identifier
        service: Source service instance

    Returns:
        List of sources with matching scope
    """
    sources = service.repo.get_by_scope(scope)
    return [SourceResponse.model_validate(s) for s in sources]


# =============================================================================
# MCP Integration Endpoints
# =============================================================================


@router.post(
    "/{source_id}/retrieve",
    response_model=List[ChunkWithHash],
    summary="Retrieve chunks from source",
    description="Query MCP server for relevant chunks with deterministic hashing",
    responses={
        200: {"description": "Chunks retrieved successfully"},
        404: {"model": ErrorResponse, "description": "Source not found"},
        400: {"model": ErrorResponse, "description": "Invalid query or inactive source"},
    },
)
async def retrieve_chunks(
    source_id: UUID,
    query: str = Query(..., min_length=1, description="Search query"),
    top_k: int = Query(5, ge=1, le=50, description="Number of chunks to retrieve"),
    seed: Optional[int] = Query(None, description="Random seed for determinism"),
    service: SourceService = Depends(get_source_service),
) -> List[ChunkWithHash]:
    """Retrieve chunks with deterministic hashing.

    CRITICAL for AMCS determinism: Pass seed for reproducibility!

    Args:
        source_id: Source UUID
        query: Search query string
        top_k: Number of chunks (1-50)
        seed: Random seed for deterministic retrieval
        service: Source service instance

    Returns:
        List of chunks with content hashes for provenance

    Raises:
        HTTPException: If source not found or inactive
    """
    try:
        chunks = await service.retrieve_chunks(
            source_id=source_id,
            query=query,
            top_k=top_k,
            seed=seed
        )
        return chunks
    except Exception as e:
        error_msg = str(e).lower()
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source {source_id} not found",
            )
        elif "inactive" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chunks: {str(e)}",
        )


@router.get(
    "/{source_id}/chunk/{chunk_hash}",
    response_model=Chunk,
    summary="Get chunk by hash",
    description="Retrieve chunk by content hash (pinned retrieval)",
    responses={
        200: {"description": "Chunk found"},
        404: {"model": ErrorResponse, "description": "Chunk not found"},
    },
)
async def get_chunk_by_hash(
    source_id: UUID,
    chunk_hash: str,
    service: SourceService = Depends(get_source_service),
) -> Chunk:
    """Retrieve chunk by content hash (pinned retrieval).

    Enables reproducible retrieval by exact hash for AMCS workflows.

    Args:
        source_id: Source UUID for provenance
        chunk_hash: SHA-256 hash (64 hex chars)
        service: Source service instance

    Returns:
        Chunk content

    Raises:
        HTTPException: If chunk not found
    """
    chunk = await service.retrieve_by_hash(source_id, chunk_hash)
    if not chunk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chunk not found for hash {chunk_hash[:16]}...",
        )
    return chunk


@router.get(
    "/mcp/servers",
    response_model=List[MCPServerInfo],
    summary="Discover MCP servers",
    description="List available MCP servers and their capabilities",
)
async def discover_mcp_servers(
    service: SourceService = Depends(get_source_service),
) -> List[MCPServerInfo]:
    """Discover available MCP servers.

    Returns:
        List of MCP servers with capabilities and scopes
    """
    servers = await service.discover_mcp_servers()
    return servers
