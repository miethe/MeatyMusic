"""API endpoints for Song management.

Songs are the main entity that aggregates styles, lyrics, personas,
and producer notes into a complete Song Design Spec (SDS).
"""

from __future__ import annotations

import io
import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
import structlog

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from app.api.dependencies import (
    get_song_repository,
    get_song_service,
    get_sds_compiler_service,
    get_blueprint_validator_service,
    get_cross_entity_validator,
    get_bulk_operations_service,
)
from app.models.song import Song
from app.repositories import SongRepository
from app.services import (
    SongService,
    SDSCompilerService,
    BlueprintValidatorService,
    CrossEntityValidator,
    BulkOperationsService,
)
from app.schemas import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkExportRequest,
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
        song = repo.create(Song, song_dict)

        # Step 2: Compile SDS from entity references (only if blueprint_id is provided)
        if song.blueprint_id:
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
                repo.delete(Song, song.id)
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
                repo.delete(Song, song.id)
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
                repo.delete(Song, song.id)
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
            song = repo.update(Song, song.id, update_dict)

            logger.info(
                "song.create_success",
                song_id=str(song.id),
                sds_hash=sds.get("_computed_hash", "unknown"),
            )
        else:
            logger.info(
                "song.created_without_sds",
                song_id=str(song.id),
                reason="No blueprint_id provided - SDS compilation deferred",
            )

        return SongResponse.model_validate(song)

    except HTTPException:
        # Re-raise HTTP exceptions (already logged)
        raise
    except ValueError as e:
        # Validation or data errors
        if song:
            repo.delete(Song, song.id)
        logger.error("song.create_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Unexpected errors
        if song:
            repo.delete(Song, song.id)
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
    # Use list_paginated from BaseRepository
    songs, next_cursor = repo.list_paginated(
        model_class=Song,
        limit=limit,
        cursor=cursor,
        sort_field="created_at",
        sort_desc=True
    )

    page_info = PageInfo(
        has_next_page=next_cursor is not None,
        has_previous_page=cursor is not None,
        start_cursor=str(songs[0].id) if songs else None,
        end_cursor=str(songs[-1].id) if songs else None,
    )

    return PaginatedResponse(
        items=[SongResponse.model_validate(s) for s in songs],
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
    song = repo.get_by_id(Song, song_id)
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
    existing = repo.get_by_id(Song, song_id)
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

    updated = repo.update(Song, song_id, update_dict)
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
    existing = repo.get_by_id(Song, song_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )

    repo.delete(Song, song_id)


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
    songs = repo.get_by_status(status.value)
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
    description="Retrieve the compiled SDS for a song with optional default generation for missing entities",
    responses={
        200: {"description": "Compiled SDS returned successfully"},
        404: {"model": ErrorResponse, "description": "Song not found"},
        422: {"model": ErrorResponse, "description": "SDS compilation failed"},
    },
)
async def get_song_sds(
    song_id: UUID,
    use_defaults: bool = Query(
        True,
        description="Apply defaults for missing entities"
    ),
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

    If entities (style, lyrics, producer notes) are missing and use_defaults is True,
    the compiler will generate sensible defaults based on the blueprint's genre conventions.
    This allows previewing a complete SDS even when the song is only partially specified.

    The returned SDS contains all entity data aggregated according to the SDS schema,
    including style, lyrics, producer notes, sources, and render configuration.

    Args:
        song_id: Song UUID
        use_defaults: Apply defaults for missing entities (default: True)
        recompile: Whether to force recompilation (default: False, use cache if available)
        repo: Song repository instance
        sds_compiler: SDS compiler service

    Returns:
        Complete SDS dictionary with all entity data

    Raises:
        HTTPException:
            - 404: If song not found
            - 422: If SDS compilation fails (missing entities with use_defaults=False, validation errors, etc.)
    """
    # Get song
    song = repo.get_by_id(Song, song_id)
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
        use_defaults=use_defaults,
        recompile=recompile,
        cache_available=cached_sds is not None,
    )

    try:
        sds = sds_compiler.compile_sds(song_id, use_defaults=use_defaults, validate=True)
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
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"SDS compilation failed: {str(e)}",
        )


@router.get(
    "/{song_id}/export",
    response_class=StreamingResponse,
    summary="Export SDS as JSON file",
    description="Downloads compiled SDS as formatted JSON file with proper filename",
    responses={
        200: {
            "description": "SDS exported successfully as downloadable JSON file",
            "content": {"application/json": {}},
        },
        404: {"model": ErrorResponse, "description": "Song not found"},
        422: {"model": ErrorResponse, "description": "SDS compilation failed"},
    },
)
async def export_song_sds(
    song_id: UUID,
    use_defaults: bool = Query(
        True,
        description="Apply defaults for missing entities"
    ),
    repo: SongRepository = Depends(get_song_repository),
    sds_compiler: SDSCompilerService = Depends(get_sds_compiler_service),
) -> StreamingResponse:
    """Export compiled SDS as a downloadable JSON file.

    This endpoint compiles the Song Design Spec (SDS) for a song and returns it
    as a formatted JSON file download. The filename is generated from the song
    title and current date in kebab-case format.

    The SDS is compiled from the current entity state with full validation.
    If entities (style, lyrics, producer notes) are missing and use_defaults is True,
    the compiler will generate sensible defaults based on the blueprint's genre conventions.
    The JSON is pretty-printed with 2-space indentation for readability.

    Args:
        song_id: Song UUID
        use_defaults: Apply defaults for missing entities (default: True)
        repo: Song repository instance
        sds_compiler: SDS compiler service

    Returns:
        StreamingResponse with JSON file download

    Raises:
        HTTPException:
            - 404: If song not found
            - 422: If SDS compilation fails
    """
    # 1. Verify song exists
    song = repo.get_by_id(Song, song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )

    # 2. Compile SDS (with validation, using defaults if requested)
    logger.info(
        "sds.export_requested",
        song_id=str(song_id),
        song_title=song.title,
        use_defaults=use_defaults,
    )

    try:
        sds = sds_compiler.compile_sds(song_id, use_defaults=use_defaults, validate=True)
    except ValueError as e:
        logger.error(
            "sds.export_compile_failed",
            song_id=str(song_id),
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"SDS compilation failed: {str(e)}",
        )

    # 3. Format as pretty JSON (indent=2, ensure_ascii=False for Unicode support)
    json_content = json.dumps(sds, indent=2, ensure_ascii=False)

    # 4. Generate filename: {song_title_kebab-case}_sds_{YYYYMMDD}.json
    # Convert title to kebab-case
    title_kebab = song.title.lower().replace(" ", "-").replace("_", "-")
    # Remove special characters (keep only alphanumeric and hyphens)
    title_kebab = re.sub(r'[^a-z0-9-]', '', title_kebab)
    # Remove consecutive hyphens and leading/trailing hyphens
    title_kebab = re.sub(r'-+', '-', title_kebab).strip('-')
    # Fallback if title becomes empty after sanitization
    if not title_kebab:
        title_kebab = "song"

    # Add timestamp
    timestamp = datetime.now().strftime("%Y%m%d")
    filename = f"{title_kebab}_sds_{timestamp}.json"

    # 5. Create StreamingResponse with proper headers
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": f'attachment; filename="{filename}"',
    }

    logger.info(
        "sds.export_success",
        song_id=str(song_id),
        filename=filename,
        sds_hash=sds.get("_computed_hash", "unknown"),
        size_bytes=len(json_content.encode('utf-8')),
    )

    # Return streaming response with JSON content
    return StreamingResponse(
        io.BytesIO(json_content.encode('utf-8')),
        media_type="application/json; charset=utf-8",
        headers=headers,
    )


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    summary="Bulk delete songs",
    description="Delete multiple songs by IDs",
    responses={
        200: {"description": "Bulk delete completed (check response for failures)"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def bulk_delete_songs(
    request: BulkDeleteRequest,
    repo: SongRepository = Depends(get_song_repository),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> BulkDeleteResponse:
    """Bulk delete songs by IDs.

    Deletes multiple songs in a single request. Returns counts of successful
    and failed deletions with error details for failures.

    Args:
        request: Request containing list of song IDs to delete
        repo: Song repository instance
        bulk_ops: Bulk operations service instance

    Returns:
        Response with deleted_count, failed_ids, and errors

    Example:
        Request: {"ids": ["uuid1", "uuid2", "uuid3"]}
        Response: {"deleted_count": 2, "failed_ids": ["uuid3"], "errors": ["Song uuid3 not found"]}
    """
    result = await bulk_ops.bulk_delete_entities(
        model_class=Song,
        repository=repo,
        entity_ids=request.ids,
        entity_type_name="song",
    )
    return BulkDeleteResponse(**result)


@router.post(
    "/bulk-export",
    response_class=StreamingResponse,
    summary="Bulk export songs as ZIP",
    description="Export multiple songs (with SDS) as a ZIP file containing JSON files",
    responses={
        200: {
            "description": "ZIP file with exported songs",
            "content": {"application/zip": {}},
        },
        400: {"model": ErrorResponse, "description": "No songs found or all exports failed"},
    },
)
async def bulk_export_songs(
    request: BulkExportRequest,
    repo: SongRepository = Depends(get_song_repository),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Bulk export songs as ZIP file.

    Exports multiple songs as JSON files packaged in a ZIP archive.
    Each song is exported as {entity-type}-{name}-{id}.json.

    Note: Exported songs include metadata but not the full compiled SDS.
    Use GET /songs/{id}/sds to retrieve the complete SDS separately.

    Args:
        request: Request containing list of song IDs to export
        repo: Song repository instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with ZIP file download

    Raises:
        HTTPException: If no songs found or all exports fail
    """
    try:
        zip_buffer = await bulk_ops.bulk_export_entities_zip(
            model_class=Song,
            repository=repo,
            entity_ids=request.ids,
            entity_type_name="song",
            response_schema=SongResponse,
        )

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"songs-bulk-export-{timestamp}.zip"

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
