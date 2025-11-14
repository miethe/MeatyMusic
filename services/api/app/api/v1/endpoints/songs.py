"""API endpoints for Song management.

Songs are the main entity that aggregates styles, lyrics, personas,
and producer notes into a complete Song Design Spec (SDS).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID
import structlog

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_song_repository,
    get_song_service,
    get_sds_compiler_service,
    get_blueprint_validator_service,
    get_cross_entity_validator,
)
from app.repositories import SongRepository
from app.services import (
    SongService,
    SDSCompilerService,
    BlueprintValidatorService,
    CrossEntityValidator,
)
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

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/songs", tags=["Songs"])


@router.post(
    "",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new song",
    description="Create a new song with automatic SDS compilation and validation",
    responses={
        201: {"description": "Song created successfully with compiled SDS"},
        400: {"model": ErrorResponse, "description": "Invalid song data or SDS validation failed"},
        404: {"model": ErrorResponse, "description": "Referenced entity not found"},
    },
)
async def create_song(
    song_data: SongCreate,
    repo: SongRepository = Depends(get_song_repository),
    sds_compiler: SDSCompilerService = Depends(get_sds_compiler_service),
    blueprint_validator: BlueprintValidatorService = Depends(get_blueprint_validator_service),
    cross_entity_validator: CrossEntityValidator = Depends(get_cross_entity_validator),
) -> SongResponse:
    """Create a new song with automatic SDS compilation and validation.

    This endpoint creates a song record and immediately compiles the Song Design Spec (SDS)
    from the referenced entities (style, lyrics, producer notes, blueprint). The compiled SDS
    is validated against blueprint constraints and cross-entity consistency rules before
    being stored in the song's extra_metadata field.

    If any validation fails, the song creation is rolled back and an error is returned.

    Args:
        song_data: Song creation data with entity references
        repo: Song repository instance
        sds_compiler: SDS compiler service for aggregation
        blueprint_validator: Blueprint validator for genre constraints
        cross_entity_validator: Cross-entity consistency validator

    Returns:
        Created song with compiled SDS in extra_metadata

    Raises:
        HTTPException:
            - 400: If SDS compilation or validation fails
            - 404: If referenced entities (style, lyrics, etc.) not found
    """
    song_dict = song_data.model_dump()
    song = None

    try:
        # Step 1: Create song record
        logger.info(
            "song.create_start",
            title=song_dict.get("title"),
            style_id=song_dict.get("style_id"),
            blueprint_id=song_dict.get("blueprint_id"),
        )
        song = await repo.create(song_dict)

        # Step 2: Compile SDS from entity references
        logger.info("sds.compile_start", song_id=str(song.id))
        try:
            sds = sds_compiler.compile_sds(song.id, validate=True)
        except ValueError as e:
            logger.warning(
                "sds.compile_failed",
                song_id=str(song.id),
                error=str(e),
            )
            # Rollback song creation
            await repo.delete(song.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SDS compilation failed: {str(e)}",
            )

        # Step 3: Validate against blueprint constraints
        logger.info("sds.blueprint_validation_start", song_id=str(song.id))
        is_valid, errors = await blueprint_validator.validate_sds_against_blueprint(
            sds, str(song.blueprint_id)
        )
        if not is_valid:
            logger.warning(
                "sds.blueprint_validation_failed",
                song_id=str(song.id),
                errors=errors,
            )
            # Rollback song creation
            await repo.delete(song.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Blueprint validation failed: {'; '.join(errors)}",
            )

        # Step 4: Validate cross-entity consistency
        logger.info("sds.cross_entity_validation_start", song_id=str(song.id))
        is_valid, errors = cross_entity_validator.validate_sds_consistency(sds)
        if not is_valid:
            logger.warning(
                "sds.cross_entity_validation_failed",
                song_id=str(song.id),
                errors=errors,
            )
            # Rollback song creation
            await repo.delete(song.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cross-entity validation failed: {'; '.join(errors)}",
            )

        # Step 5: Store compiled SDS in song metadata
        logger.info("sds.store_start", song_id=str(song.id))
        update_dict = {
            "extra_metadata": {
                **(song.extra_metadata or {}),
                "compiled_sds": sds,
            }
        }
        song = await repo.update(song.id, update_dict)

        logger.info(
            "song.create_success",
            song_id=str(song.id),
            sds_hash=sds.get("_computed_hash", "unknown"),
        )

        return SongResponse.model_validate(song)

    except HTTPException:
        # Re-raise HTTP exceptions (already logged)
        raise
    except ValueError as e:
        # Validation or data errors
        if song:
            await repo.delete(song.id)
        logger.error("song.create_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Unexpected errors
        if song:
            await repo.delete(song.id)
        logger.error("song.create_unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Song creation failed: {str(e)}",
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


@router.get(
    "/{song_id}/sds",
    response_model=Dict[str, Any],
    summary="Get compiled Song Design Spec (SDS)",
    description="Retrieve the compiled SDS for a song, either from cache or by recompiling",
    responses={
        200: {"description": "Compiled SDS returned successfully"},
        400: {"model": ErrorResponse, "description": "SDS compilation failed"},
        404: {"model": ErrorResponse, "description": "Song not found"},
    },
)
async def get_song_sds(
    song_id: UUID,
    recompile: bool = Query(
        False,
        description="Force recompilation of SDS from current entity state"
    ),
    repo: SongRepository = Depends(get_song_repository),
    sds_compiler: SDSCompilerService = Depends(get_sds_compiler_service),
) -> Dict[str, Any]:
    """Get compiled Song Design Spec (SDS) for a song.

    This endpoint returns the compiled SDS dictionary for a song. By default, it returns
    the cached SDS from the song's extra_metadata field if available. If the cache is
    missing or the recompile parameter is True, the SDS is recompiled from the current
    entity state.

    The returned SDS contains all entity data aggregated according to the SDS schema,
    including style, lyrics, producer notes, sources, and render configuration.

    Args:
        song_id: Song UUID
        recompile: Whether to force recompilation (default: False, use cache if available)
        repo: Song repository instance
        sds_compiler: SDS compiler service

    Returns:
        Complete SDS dictionary with all entity data

    Raises:
        HTTPException:
            - 404: If song not found
            - 400: If SDS compilation fails
    """
    # Get song
    song = await repo.get_by_id(song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )

    # Check for cached SDS
    cached_sds = None
    if song.extra_metadata and "compiled_sds" in song.extra_metadata:
        cached_sds = song.extra_metadata["compiled_sds"]

    # Return cached if available and not forcing recompile
    if cached_sds and not recompile:
        logger.info(
            "sds.cache_hit",
            song_id=str(song_id),
            sds_hash=cached_sds.get("_computed_hash", "unknown"),
        )
        return cached_sds

    # Compile SDS
    logger.info(
        "sds.compile_requested",
        song_id=str(song_id),
        recompile=recompile,
        cache_available=cached_sds is not None,
    )

    try:
        sds = sds_compiler.compile_sds(song_id, validate=True)
        logger.info(
            "sds.compile_success",
            song_id=str(song_id),
            sds_hash=sds.get("_computed_hash", "unknown"),
        )
        return sds
    except ValueError as e:
        logger.error(
            "sds.compile_failed",
            song_id=str(song_id),
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SDS compilation failed: {str(e)}",
        )
