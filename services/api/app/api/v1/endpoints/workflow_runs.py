"""API endpoints for WorkflowRun management.

Workflow runs track the execution of the Claude Code orchestration workflow,
storing node outputs, artifacts, scores, and events.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_workflow_run_repository, get_workflow_run_service
from app.repositories import WorkflowRunRepository
from app.services import WorkflowRunService
from app.schemas import (
    ErrorResponse,
    NodeOutputUpdate,
    PageInfo,
    PaginatedResponse,
    WorkflowRunCreate,
    WorkflowRunResponse,
    WorkflowRunUpdate,
)

router = APIRouter(prefix="/workflow-runs", tags=["Workflow Runs"])


@router.post(
    "",
    response_model=WorkflowRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow run",
    description="Start a new workflow run for a song",
    responses={
        201: {"description": "Workflow run created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid run data"},
    },
)
async def create_workflow_run(
    run_data: WorkflowRunCreate,
    repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> WorkflowRunResponse:
    """Create a new workflow run.

    Args:
        run_data: Workflow run creation data
        repo: WorkflowRun repository instance

    Returns:
        Created workflow run

    Raises:
        HTTPException: If run creation fails
    """
    try:
        run = repo.create(run_data.model_dump())
        return WorkflowRunResponse.model_validate(run)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedResponse[WorkflowRunResponse],
    summary="List workflow runs with pagination",
    description="Get paginated list of workflow runs",
)
async def list_workflow_runs(
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> PaginatedResponse[WorkflowRunResponse]:
    """List workflow runs with cursor pagination.

    Args:
        limit: Maximum number of items to return
        cursor: Pagination cursor
        repo: WorkflowRun repository instance

    Returns:
        Paginated list of workflow runs
    """
    cursor_uuid = UUID(cursor) if cursor else None
    runs = repo.list(limit=limit + 1, offset=cursor_uuid)

    has_next = len(runs) > limit
    items = runs[:limit]

    page_info = PageInfo(
        has_next_page=has_next,
        has_previous_page=cursor is not None,
        start_cursor=str(items[0].id) if items else None,
        end_cursor=str(items[-1].id) if items else None,
    )

    return PaginatedResponse(
        items=[WorkflowRunResponse.model_validate(r) for r in items],
        page_info=page_info,
    )


@router.get(
    "/{run_id}",
    response_model=WorkflowRunResponse,
    summary="Get workflow run by ID",
    description="Retrieve a specific workflow run by ID",
    responses={
        200: {"description": "Workflow run found"},
        404: {"model": ErrorResponse, "description": "Workflow run not found"},
    },
)
async def get_workflow_run(
    run_id: UUID,
    repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> WorkflowRunResponse:
    """Get a workflow run by ID.

    Args:
        run_id: WorkflowRun UUID
        repo: WorkflowRun repository instance

    Returns:
        Workflow run data

    Raises:
        HTTPException: If run not found
    """
    run = repo.get_by_id(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow run {run_id} not found",
        )
    return WorkflowRunResponse.model_validate(run)


@router.patch(
    "/{run_id}",
    response_model=WorkflowRunResponse,
    summary="Update a workflow run",
    description="Update workflow run fields",
    responses={
        200: {"description": "Workflow run updated successfully"},
        404: {"model": ErrorResponse, "description": "Workflow run not found"},
    },
)
async def update_workflow_run(
    run_id: UUID,
    run_data: WorkflowRunUpdate,
    repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> WorkflowRunResponse:
    """Update a workflow run.

    Args:
        run_id: WorkflowRun UUID
        run_data: Fields to update
        repo: WorkflowRun repository instance

    Returns:
        Updated workflow run

    Raises:
        HTTPException: If run not found
    """
    existing = repo.get_by_id(run_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow run {run_id} not found",
        )

    updated = repo.update(
        run_id,
        run_data.model_dump(exclude_unset=True),
    )
    return WorkflowRunResponse.model_validate(updated)


@router.delete(
    "/{run_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workflow run",
    description="Soft delete a workflow run",
    responses={
        204: {"description": "Workflow run deleted successfully"},
        404: {"model": ErrorResponse, "description": "Workflow run not found"},
    },
)
async def delete_workflow_run(
    run_id: UUID,
    repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> None:
    """Delete a workflow run (soft delete).

    Args:
        run_id: WorkflowRun UUID
        repo: WorkflowRun repository instance

    Raises:
        HTTPException: If run not found
    """
    existing = repo.get_by_id(run_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow run {run_id} not found",
        )

    repo.delete(run_id)


@router.get(
    "/active",
    response_model=List[WorkflowRunResponse],
    summary="Get active workflow runs",
    description="Retrieve all currently running workflows",
)
async def get_active_runs(
    service: WorkflowRunService = Depends(get_workflow_run_service),
) -> List[WorkflowRunResponse]:
    """Get all active workflow runs.

    Args:
        service: WorkflowRun service instance

    Returns:
        List of active workflow runs
    """
    runs = await service.get_active_runs()
    return [WorkflowRunResponse.model_validate(r) for r in runs]


@router.get(
    "/by-song/{song_id}",
    response_model=List[WorkflowRunResponse],
    summary="Get workflow runs for a song",
    description="Retrieve all workflow runs for a specific song",
)
async def get_runs_by_song(
    song_id: UUID,
    repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> List[WorkflowRunResponse]:
    """Get workflow runs for a specific song.

    Args:
        song_id: Song UUID
        repo: WorkflowRun repository instance

    Returns:
        List of workflow runs for the song
    """
    runs = repo.get_by_song_id(song_id)
    return [WorkflowRunResponse.model_validate(r) for r in runs]


@router.patch(
    "/{run_id}/node-output",
    response_model=WorkflowRunResponse,
    summary="Update node output",
    description="Update the output data for a specific workflow node",
    responses={
        200: {"description": "Node output updated successfully"},
        404: {"model": ErrorResponse, "description": "Workflow run not found"},
    },
)
async def update_node_output(
    run_id: UUID,
    node_update: NodeOutputUpdate,
    service: WorkflowRunService = Depends(get_workflow_run_service),
) -> WorkflowRunResponse:
    """Update node output for a workflow run.

    Args:
        run_id: WorkflowRun UUID
        node_update: Node output data
        service: WorkflowRun service instance

    Returns:
        Updated workflow run

    Raises:
        HTTPException: If run not found
    """
    try:
        run = await service.update_node_output(
            run_id=run_id,
            node=node_update.node,
            output=node_update.output,
            artifacts=node_update.artifacts,
            scores=node_update.scores,
            citations=node_update.citations,
            error=node_update.error,
        )
        if not run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workflow run {run_id} not found",
            )
        return WorkflowRunResponse.model_validate(run)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
