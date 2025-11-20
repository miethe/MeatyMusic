"""API endpoints for Style management.

Styles define genre, tempo, mood, instrumentation, and other musical
characteristics for song creation.
"""

from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from app.api.dependencies import get_style_repository, get_style_service, get_bulk_operations_service
from app.models.style import Style
from app.repositories import StyleRepository
from app.services import StyleService, BulkOperationsService
from app.schemas import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkExportRequest,
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
        style = repo.create(style_dict)
        return StyleResponse.model_validate(style)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/import",
    response_model=StyleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import style from JSON file",
    description="Import a style definition from an uploaded JSON file",
    responses={
        201: {"description": "Style imported successfully"},
        400: {"model": ErrorResponse, "description": "Invalid JSON or validation error"},
    },
)
async def import_style(
    file: UploadFile = File(..., description="JSON file containing style definition"),
    service: StyleService = Depends(get_style_service),
    repo: StyleRepository = Depends(get_style_repository),
) -> StyleResponse:
    """Import a style from a JSON file.

    Args:
        file: Uploaded JSON file with style data
        service: Style service instance (for validation)
        repo: Style repository instance

    Returns:
        Created style with import metadata

    Raises:
        HTTPException: If file is not JSON, validation fails, or tags conflict
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON files are supported. File must have .json extension",
        )

    # Read and parse JSON
    try:
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}",
        )

    # Validate against schema
    try:
        style_data = StyleCreate.model_validate(data)
    except ValidationError as e:
        errors = [
            {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
            for err in e.errors()
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors},
        )

    # Validate tag conflicts
    style_dict = style_data.model_dump()
    tags = style_dict.get("tags", [])
    if tags:
        conflicts = await service._validate_tag_conflicts(tags)
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag conflicts detected: {', '.join(conflicts)}",
            )

    # Add import metadata
    style_dict["imported_at"] = datetime.now(timezone.utc)
    style_dict["import_source_filename"] = file.filename

    # Create style
    try:
        style = repo.create(style_dict)
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
    styles = repo.list(limit=limit + 1, offset=cursor_uuid)

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
    style = repo.get_by_id(style_id)
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
    existing = repo.get_by_id(style_id)
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

    updated = repo.update(style_id, update_dict)
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
    existing = repo.get_by_id(style_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style {style_id} not found",
        )

    repo.delete(style_id)


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
    styles = repo.get_by_genre(genre)
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
        bpm_results = repo.get_by_bpm_range(
            bpm_min or 40,
            bpm_max or 220,
        )
        results = bpm_results

    # If mood filter provided
    if mood:
        mood_results = repo.get_by_mood(mood)
        if results:
            # Intersection
            mood_ids = {s.id for s in mood_results}
            results = [s for s in results if s.id in mood_ids]
        else:
            results = mood_results

    # If energy filters provided
    if energy_min is not None or energy_max is not None:
        energy_results = repo.get_by_energy_range(
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
        tag_results = repo.search_by_tags(tags)
        if results:
            # Intersection
            tag_ids = {s.id for s in tag_results}
            results = [s for s in results if s.id in tag_ids]
        else:
            results = tag_results

    # If no filters, return empty list
    if not results and not any([bpm_min, bpm_max, mood, energy_min, energy_max, tags]):
        results = repo.list(limit=50)

    return [StyleResponse.model_validate(s) for s in results]


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    summary="Bulk delete styles",
    description="Delete multiple styles by IDs",
    responses={
        200: {"description": "Bulk delete completed (check response for failures)"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def bulk_delete_styles(
    request: BulkDeleteRequest,
    repo: StyleRepository = Depends(get_style_repository),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> BulkDeleteResponse:
    """Bulk delete styles by IDs.

    Deletes multiple styles in a single request. Returns counts of successful
    and failed deletions with error details for failures.

    Args:
        request: Request containing list of style IDs to delete
        repo: Style repository instance
        bulk_ops: Bulk operations service instance

    Returns:
        Response with deleted_count, failed_ids, and errors

    Example:
        Request: {"ids": ["uuid1", "uuid2", "uuid3"]}
        Response: {"deleted_count": 2, "failed_ids": ["uuid3"], "errors": ["Style uuid3 not found"]}
    """
    result = await bulk_ops.bulk_delete_entities(
        model_class=Style,
        repository=repo,
        entity_ids=request.ids,
        entity_type_name="style",
    )
    return BulkDeleteResponse(**result)


@router.post(
    "/bulk-export",
    response_class=StreamingResponse,
    summary="Bulk export styles as ZIP",
    description="Export multiple styles as a ZIP file containing JSON files",
    responses={
        200: {
            "description": "ZIP file with exported styles",
            "content": {"application/zip": {}},
        },
        400: {"model": ErrorResponse, "description": "No styles found or all exports failed"},
    },
)
async def bulk_export_styles(
    request: BulkExportRequest,
    repo: StyleRepository = Depends(get_style_repository),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Bulk export styles as ZIP file.

    Exports multiple styles as JSON files packaged in a ZIP archive.
    Each style is exported as {entity-type}-{name}-{id}.json.

    Args:
        request: Request containing list of style IDs to export
        repo: Style repository instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with ZIP file download

    Raises:
        HTTPException: If no styles found or all exports fail
    """
    try:
        zip_buffer = await bulk_ops.bulk_export_entities_zip(
            model_class=Style,
            repository=repo,
            entity_ids=request.ids,
            entity_type_name="style",
            response_schema=StyleResponse,
        )

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"styles-bulk-export-{timestamp}.zip"

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


@router.get(
    "/{style_id}/export",
    response_class=StreamingResponse,
    summary="Export style as JSON file",
    description="Download a single style as a formatted JSON file",
    responses={
        200: {
            "description": "Style exported successfully as JSON file",
            "content": {"application/json": {}},
        },
        404: {"model": ErrorResponse, "description": "Style not found"},
    },
)
async def export_style(
    style_id: UUID,
    repo: StyleRepository = Depends(get_style_repository),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Export a single style as JSON file.

    Downloads the style data as a formatted JSON file with proper filename.

    Args:
        style_id: Style UUID
        repo: Style repository instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with JSON file download

    Raises:
        HTTPException: If style not found
    """
    # Fetch style
    style = repo.get_by_id(style_id)
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style {style_id} not found",
        )

    # Export using bulk operations service
    export_data = await bulk_ops.export_single_entity(
        entity=style,
        entity_type_name="style",
        response_schema=StyleResponse,
    )

    # Format as JSON
    json_content = json.dumps(export_data["content"], indent=2, ensure_ascii=False)

    # Create streaming response
    return StreamingResponse(
        io.BytesIO(json_content.encode("utf-8")),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{export_data["filename"]}"',
        },
    )
