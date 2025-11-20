"""API endpoints for ProducerNotes management.

Producer notes define arrangement, structure, hooks, and mix targets
for song production.
"""

from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from app.api.dependencies import (
    get_producer_notes_repository,
    get_producer_notes_service,
    get_bulk_operations_service,
)
from app.models.producer_notes import ProducerNotes
from app.repositories import ProducerNotesRepository
from app.services import ProducerNotesService, BulkOperationsService
from app.schemas import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkExportRequest,
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
    ProducerNotesCreate,
    ProducerNotesResponse,
    ProducerNotesUpdate,
)

router = APIRouter(prefix="/producer-notes", tags=["Producer Notes"])


@router.post(
    "",
    response_model=ProducerNotesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new producer notes",
    description="Create new producer notes with arrangement and mix guidance",
    responses={
        201: {"description": "Producer notes created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid producer notes data"},
    },
)
async def create_producer_notes(
    notes_data: ProducerNotesCreate,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Create new producer notes.

    Args:
        notes_data: Producer notes creation data
        service: ProducerNotes service instance

    Returns:
        Created producer notes

    Raises:
        HTTPException: If creation fails
    """
    try:
        return await service.create_producer_notes(notes_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/import",
    response_model=ProducerNotesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import producer notes from JSON file",
    description="Import producer notes definition from an uploaded JSON file",
    responses={
        201: {"description": "Producer notes imported successfully"},
        400: {"model": ErrorResponse, "description": "Invalid JSON or validation error"},
    },
)
async def import_producer_notes(
    file: UploadFile = File(..., description="JSON file containing producer notes definition"),
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Import producer notes from a JSON file.

    Args:
        file: Uploaded JSON file with producer notes data
        service: ProducerNotes service instance

    Returns:
        Created producer notes with import metadata

    Raises:
        HTTPException: If file is not JSON or validation fails
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
        notes_data = ProducerNotesCreate.model_validate(data)
    except ValidationError as e:
        errors = [
            {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
            for err in e.errors()
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors},
        )

    # Add import metadata
    notes_dict = notes_data.model_dump()
    notes_dict["imported_at"] = datetime.now(timezone.utc)
    notes_dict["import_source_filename"] = file.filename

    # Create producer notes via service
    try:
        notes_data_with_import = ProducerNotesCreate.model_validate(notes_dict)
        return await service.create_producer_notes(notes_data_with_import)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[ProducerNotesResponse],
    summary="List producer notes with pagination",
    description="Get paginated list of producer notes",
)
async def list_producer_notes(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
) -> PaginatedResponse[ProducerNotesResponse]:
    """List producer notes with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: ProducerNotes repository instance

    Returns:
        Paginated list of producer notes
    """
    cursor_uuid = UUID(cursor) if cursor else None
    notes_list = repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(notes_list) > limit
    items = notes_list[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[ProducerNotesResponse.model_validate(n) for n in items],
        page_info=page_info,
    )


@router.get(
    "/{notes_id}",
    response_model=ProducerNotesResponse,
    summary="Get producer notes by ID",
    description="Retrieve specific producer notes by ID",
    responses={
        200: {"description": "Producer notes found"},
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def get_producer_notes(
    notes_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Get producer notes by ID.

    Args:
        notes_id: ProducerNotes UUID
        service: ProducerNotes service instance

    Returns:
        Producer notes data

    Raises:
        HTTPException: If notes not found
    """
    notes = await service.get_producer_notes(notes_id)
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )
    return notes


@router.patch(
    "/{notes_id}",
    response_model=ProducerNotesResponse,
    summary="Update producer notes",
    description="Update existing producer notes fields",
    responses={
        200: {"description": "Producer notes updated successfully"},
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def update_producer_notes(
    notes_id: UUID,
    notes_data: ProducerNotesUpdate,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> ProducerNotesResponse:
    """Update producer notes.

    Args:
        notes_id: ProducerNotes UUID
        notes_data: Fields to update
        service: ProducerNotes service instance

    Returns:
        Updated producer notes

    Raises:
        HTTPException: If notes not found or validation fails
    """
    try:
        return await service.update_producer_notes(notes_id, notes_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Handle NotFoundError from service
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producer notes {notes_id} not found",
            )
        raise


@router.delete(
    "/{notes_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete producer notes",
    description="Soft delete producer notes",
    responses={
        204: {"description": "Producer notes deleted successfully"},
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def delete_producer_notes(
    notes_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> None:
    """Delete producer notes (soft delete).

    Args:
        notes_id: ProducerNotes UUID
        service: ProducerNotes service instance

    Raises:
        HTTPException: If notes not found
    """
    success = await service.delete_producer_notes(notes_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )


@router.get(
    "/song/{song_id}",
    response_model=list[ProducerNotesResponse],
    summary="Get producer notes by song ID",
    description="Retrieve all producer notes versions for a specific song",
    responses={
        200: {"description": "Producer notes found for song"},
    },
)
async def get_by_song_id(
    song_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
) -> list[ProducerNotesResponse]:
    """Get all producer notes for a specific song.

    Args:
        song_id: Song UUID
        service: ProducerNotes service instance

    Returns:
        List of producer notes versions for the song, ordered by created_at descending
    """
    return await service.get_by_song_id(song_id)


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    summary="Bulk delete producer notes",
    description="Delete multiple producer notes by IDs",
    responses={
        200: {"description": "Bulk delete completed (check response for failures)"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def bulk_delete_producer_notes(
    request: BulkDeleteRequest,
    service: ProducerNotesService = Depends(get_producer_notes_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> BulkDeleteResponse:
    """Bulk delete producer notes by IDs.

    Args:
        request: Request containing list of producer notes IDs to delete
        service: ProducerNotes service instance
        bulk_ops: Bulk operations service instance

    Returns:
        Response with deleted_count, failed_ids, and errors
    """
    result = await bulk_ops.bulk_delete_entities(
        model_class=ProducerNotes,
        repository=service.repo,
        entity_ids=request.ids,
        entity_type_name="producer-notes",
    )
    return BulkDeleteResponse(**result)


@router.post(
    "/bulk-export",
    response_class=StreamingResponse,
    summary="Bulk export producer notes as ZIP",
    description="Export multiple producer notes as a ZIP file containing JSON files",
    responses={
        200: {
            "description": "ZIP file with exported producer notes",
            "content": {"application/zip": {}},
        },
        400: {"model": ErrorResponse, "description": "No producer notes found or all exports failed"},
    },
)
async def bulk_export_producer_notes(
    request: BulkExportRequest,
    service: ProducerNotesService = Depends(get_producer_notes_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Bulk export producer notes as ZIP file.

    Args:
        request: Request containing list of producer notes IDs to export
        service: ProducerNotes service instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with ZIP file download

    Raises:
        HTTPException: If no producer notes found or all exports fail
    """
    try:
        zip_buffer = await bulk_ops.bulk_export_entities_zip(
            model_class=ProducerNotes,
            repository=service.repo,
            entity_ids=request.ids,
            entity_type_name="producer-notes",
            response_schema=ProducerNotesResponse,
        )

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"producer-notes-bulk-export-{timestamp}.zip"

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
    "/{notes_id}/export",
    response_class=StreamingResponse,
    summary="Export producer notes as JSON file",
    description="Download a single producer notes as a formatted JSON file",
    responses={
        200: {
            "description": "Producer notes exported successfully as JSON file",
            "content": {"application/json": {}},
        },
        404: {"model": ErrorResponse, "description": "Producer notes not found"},
    },
)
async def export_producer_notes(
    notes_id: UUID,
    service: ProducerNotesService = Depends(get_producer_notes_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Export a single producer notes as JSON file.

    Args:
        notes_id: ProducerNotes UUID
        service: ProducerNotes service instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with JSON file download

    Raises:
        HTTPException: If producer notes not found
    """
    notes = await service.get_producer_notes(notes_id)
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producer notes {notes_id} not found",
        )

    # Get model for export
    notes_model = service.repo.get_by_id(notes_id)
    export_data = await bulk_ops.export_single_entity(
        entity=notes_model,
        entity_type_name="producer-notes",
        response_schema=ProducerNotesResponse,
    )

    json_content = json.dumps(export_data["content"], indent=2, ensure_ascii=False)

    return StreamingResponse(
        io.BytesIO(json_content.encode("utf-8")),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{export_data["filename"]}"',
        },
    )
