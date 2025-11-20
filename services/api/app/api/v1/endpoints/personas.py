"""API endpoints for Persona management.

Personas represent artist or band profiles with vocal characteristics,
influences, and style preferences.
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

from app.api.dependencies import get_persona_repository, get_persona_service, get_bulk_operations_service
from app.errors import BadRequestError, NotFoundError
from app.models.persona import Persona
from app.repositories import PersonaRepository
from app.services import PersonaService, BulkOperationsService
from app.schemas import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkExportRequest,
    ErrorResponse,
    PageInfo,
    PaginatedResponse,
    PersonaCreate,
    PersonaResponse,
    PersonaUpdate,
)

router = APIRouter(prefix="/personas", tags=["Personas"])


@router.post(
    "",
    response_model=PersonaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new persona",
    description="Create a new artist or band persona with vocal characteristics and automatic influence normalization",
    responses={
        201: {"description": "Persona created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid persona data"},
    },
)
async def create_persona(
    persona_data: PersonaCreate,
    service: PersonaService = Depends(get_persona_service),
) -> PersonaResponse:
    """Create a new persona with validation and normalization.

    Automatically applies:
    - Influence normalization if public_release=True
    - Vocal range validation
    - Delivery style conflict detection

    Args:
        persona_data: Persona creation data
        service: Persona service instance

    Returns:
        Created persona with all validations applied

    Raises:
        HTTPException: If validation fails
    """
    try:
        return await service.create_persona(persona_data)
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/import",
    response_model=PersonaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import persona from JSON file",
    description="Import a persona definition from an uploaded JSON file",
    responses={
        201: {"description": "Persona imported successfully"},
        400: {"model": ErrorResponse, "description": "Invalid JSON or validation error"},
    },
)
async def import_persona(
    file: UploadFile = File(..., description="JSON file containing persona definition"),
    service: PersonaService = Depends(get_persona_service),
) -> PersonaResponse:
    """Import a persona from a JSON file.

    Args:
        file: Uploaded JSON file with persona data
        service: Persona service instance

    Returns:
        Created persona with import metadata

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
        persona_data = PersonaCreate.model_validate(data)
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
    persona_dict = persona_data.model_dump()
    persona_dict["imported_at"] = datetime.now(timezone.utc)
    persona_dict["import_source_filename"] = file.filename

    # Create persona via service (with automatic validation and normalization)
    try:
        persona_data_with_import = PersonaCreate.model_validate(persona_dict)
        return await service.create_persona(persona_data_with_import)
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[PersonaResponse],
    summary="List personas with pagination",
    description="Get paginated list of personas",
)
async def list_personas(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: PersonaRepository = Depends(get_persona_repository),
) -> PaginatedResponse[PersonaResponse]:
    """List personas with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: Persona repository instance

    Returns:
        Paginated list of personas
    """
    cursor_uuid = UUID(cursor) if cursor else None
    personas = repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(personas) > limit
    items = personas[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[PersonaResponse.model_validate(p) for p in items],
        page_info=page_info,
    )


@router.get(
    "/{persona_id}",
    response_model=PersonaResponse,
    summary="Get persona by ID",
    description="Retrieve a specific persona by its ID",
    responses={
        200: {"description": "Persona found"},
        404: {"model": ErrorResponse, "description": "Persona not found"},
    },
)
async def get_persona(
    persona_id: UUID,
    service: PersonaService = Depends(get_persona_service),
) -> PersonaResponse:
    """Get a persona by ID.

    Args:
        persona_id: Persona UUID
        service: Persona service instance

    Returns:
        Persona data

    Raises:
        HTTPException: If persona not found
    """
    persona = await service.get_persona(persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona {persona_id} not found",
        )
    return persona


@router.patch(
    "/{persona_id}",
    response_model=PersonaResponse,
    summary="Update a persona",
    description="Update an existing persona's fields with validation and normalization",
    responses={
        200: {"description": "Persona updated successfully"},
        404: {"model": ErrorResponse, "description": "Persona not found"},
        400: {"model": ErrorResponse, "description": "Invalid update data"},
    },
)
async def update_persona(
    persona_id: UUID,
    persona_data: PersonaUpdate,
    service: PersonaService = Depends(get_persona_service),
) -> PersonaResponse:
    """Update a persona with validation and normalization.

    Automatically applies:
    - Influence normalization if public_release=True
    - Vocal range validation
    - Delivery style conflict detection

    Args:
        persona_id: Persona UUID
        persona_data: Fields to update
        service: Persona service instance

    Returns:
        Updated persona

    Raises:
        HTTPException: If persona not found or validation fails
    """
    try:
        return await service.update_persona(persona_id, persona_data)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{persona_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a persona",
    description="Soft delete a persona",
    responses={
        204: {"description": "Persona deleted successfully"},
        404: {"model": ErrorResponse, "description": "Persona not found"},
    },
)
async def delete_persona(
    persona_id: UUID,
    service: PersonaService = Depends(get_persona_service),
) -> None:
    """Delete a persona (soft delete).

    Args:
        persona_id: Persona UUID
        service: Persona service instance

    Raises:
        HTTPException: If persona not found
    """
    deleted = await service.delete_persona(persona_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona {persona_id} not found",
        )


@router.get(
    "/type/{persona_type}",
    response_model=List[PersonaResponse],
    summary="Get personas by type",
    description="Retrieve all personas of a specific type (artist or band)",
    responses={
        200: {"description": "List of personas matching the type"},
    },
)
async def get_by_type(
    persona_type: str,
    service: PersonaService = Depends(get_persona_service),
) -> List[PersonaResponse]:
    """Get all personas by type (kind).

    Args:
        persona_type: Type of persona ("artist" or "band")
        service: Persona service instance

    Returns:
        List of personas matching the specified type
    """
    return await service.get_by_type(persona_type)


@router.get(
    "/search/influences",
    response_model=List[PersonaResponse],
    summary="Search personas by influences",
    description="Find personas with specific influences using PostgreSQL array overlap",
)
async def search_personas_by_influences(
    influences: List[str] = Query(..., description="Influences to search for"),
    service: PersonaService = Depends(get_persona_service),
) -> List[PersonaResponse]:
    """Search personas by influences.

    Uses PostgreSQL array overlap operator for efficient searching.

    Args:
        influences: List of influences to search for
        service: Persona service instance

    Returns:
        List of personas with any of the specified influences
    """
    return await service.search_by_influences(influences)


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    summary="Bulk delete personas",
    description="Delete multiple personas by IDs",
    responses={
        200: {"description": "Bulk delete completed (check response for failures)"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def bulk_delete_personas(
    request: BulkDeleteRequest,
    service: PersonaService = Depends(get_persona_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> BulkDeleteResponse:
    """Bulk delete personas by IDs.

    Args:
        request: Request containing list of persona IDs to delete
        service: Persona service instance
        bulk_ops: Bulk operations service instance

    Returns:
        Response with deleted_count, failed_ids, and errors
    """
    result = await bulk_ops.bulk_delete_entities(
        model_class=Persona,
        repository=service.repo,
        entity_ids=request.ids,
        entity_type_name="persona",
    )
    return BulkDeleteResponse(**result)


@router.post(
    "/bulk-export",
    response_class=StreamingResponse,
    summary="Bulk export personas as ZIP",
    description="Export multiple personas as a ZIP file containing JSON files",
    responses={
        200: {
            "description": "ZIP file with exported personas",
            "content": {"application/zip": {}},
        },
        400: {"model": ErrorResponse, "description": "No personas found or all exports failed"},
    },
)
async def bulk_export_personas(
    request: BulkExportRequest,
    service: PersonaService = Depends(get_persona_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Bulk export personas as ZIP file.

    Args:
        request: Request containing list of persona IDs to export
        service: Persona service instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with ZIP file download

    Raises:
        HTTPException: If no personas found or all exports fail
    """
    try:
        zip_buffer = await bulk_ops.bulk_export_entities_zip(
            model_class=Persona,
            repository=service.repo,
            entity_ids=request.ids,
            entity_type_name="persona",
            response_schema=PersonaResponse,
        )

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"personas-bulk-export-{timestamp}.zip"

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
    "/{persona_id}/export",
    response_class=StreamingResponse,
    summary="Export persona as JSON file",
    description="Download a single persona as a formatted JSON file",
    responses={
        200: {
            "description": "Persona exported successfully as JSON file",
            "content": {"application/json": {}},
        },
        404: {"model": ErrorResponse, "description": "Persona not found"},
    },
)
async def export_persona(
    persona_id: UUID,
    service: PersonaService = Depends(get_persona_service),
    bulk_ops: BulkOperationsService = Depends(get_bulk_operations_service),
) -> StreamingResponse:
    """Export a single persona as JSON file.

    Args:
        persona_id: Persona UUID
        service: Persona service instance
        bulk_ops: Bulk operations service instance

    Returns:
        StreamingResponse with JSON file download

    Raises:
        HTTPException: If persona not found
    """
    persona = await service.get_persona(persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona {persona_id} not found",
        )

    # Get model for export
    persona_model = service.repo.get_by_id(persona_id)
    export_data = await bulk_ops.export_single_entity(
        entity=persona_model,
        entity_type_name="persona",
        response_schema=PersonaResponse,
    )

    json_content = json.dumps(export_data["content"], indent=2, ensure_ascii=False)

    return StreamingResponse(
        io.BytesIO(json_content.encode("utf-8")),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{export_data["filename"]}"',
        },
    )
