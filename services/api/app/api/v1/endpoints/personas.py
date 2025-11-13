"""API endpoints for Persona management.

Personas represent artist or band profiles with vocal characteristics,
influences, and style preferences.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_persona_repository
from app.repositories import PersonaRepository
from app.schemas import (
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
    description="Create a new artist or band persona with vocal characteristics",
    responses={
        201: {"description": "Persona created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid persona data"},
    },
)
async def create_persona(
    persona_data: PersonaCreate,
    repo: PersonaRepository = Depends(get_persona_repository),
) -> PersonaResponse:
    """Create a new persona.

    Args:
        persona_data: Persona creation data
        repo: Persona repository instance

    Returns:
        Created persona

    Raises:
        HTTPException: If persona creation fails
    """
    try:
        persona = await repo.create(persona_data.model_dump())
        return PersonaResponse.model_validate(persona)
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
    personas = await repo.list(limit=limit + 1, offset=cursor_uuid)

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
    repo: PersonaRepository = Depends(get_persona_repository),
) -> PersonaResponse:
    """Get a persona by ID.

    Args:
        persona_id: Persona UUID
        repo: Persona repository instance

    Returns:
        Persona data

    Raises:
        HTTPException: If persona not found
    """
    persona = await repo.get_by_id(persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona {persona_id} not found",
        )
    return PersonaResponse.model_validate(persona)


@router.patch(
    "/{persona_id}",
    response_model=PersonaResponse,
    summary="Update a persona",
    description="Update an existing persona's fields",
    responses={
        200: {"description": "Persona updated successfully"},
        404: {"model": ErrorResponse, "description": "Persona not found"},
    },
)
async def update_persona(
    persona_id: UUID,
    persona_data: PersonaUpdate,
    repo: PersonaRepository = Depends(get_persona_repository),
) -> PersonaResponse:
    """Update a persona.

    Args:
        persona_id: Persona UUID
        persona_data: Fields to update
        repo: Persona repository instance

    Returns:
        Updated persona

    Raises:
        HTTPException: If persona not found
    """
    existing = await repo.get_by_id(persona_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona {persona_id} not found",
        )

    updated = await repo.update(
        persona_id,
        persona_data.model_dump(exclude_unset=True),
    )
    return PersonaResponse.model_validate(updated)


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
    repo: PersonaRepository = Depends(get_persona_repository),
) -> None:
    """Delete a persona (soft delete).

    Args:
        persona_id: Persona UUID
        repo: Persona repository instance

    Raises:
        HTTPException: If persona not found
    """
    existing = await repo.get_by_id(persona_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona {persona_id} not found",
        )

    await repo.delete(persona_id)


@router.get(
    "/search/influences",
    response_model=List[PersonaResponse],
    summary="Search personas by influences",
    description="Find personas with specific influences",
)
async def search_personas_by_influences(
    influences: List[str] = Query(..., description="Influences to search for"),
    repo: PersonaRepository = Depends(get_persona_repository),
) -> List[PersonaResponse]:
    """Search personas by influences.

    Args:
        influences: List of influences to search for
        repo: Persona repository instance

    Returns:
        List of personas with matching influences
    """
    personas = await repo.search_by_influences(influences)
    return [PersonaResponse.model_validate(p) for p in personas]
