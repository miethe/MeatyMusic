"""API endpoints for workflow run management and execution.

Provides endpoints for:
- Creating and starting workflow runs
- Querying run status and outputs
- Retrying failed runs
- Cancelling in-progress runs
- WebSocket event streaming
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
import structlog

from app.api.dependencies import get_db_session
from app.repositories.node_execution_repo import NodeExecutionRepository
from app.repositories.workflow_event_repo import WorkflowEventRepository
from app.repositories.workflow_run_repo import WorkflowRunRepository
from app.schemas import ErrorResponse
from app.services.workflow_service import WorkflowService
from app.workflows.events import get_event_publisher
from sqlalchemy.orm import Session

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/runs", tags=["Workflow Runs"])


# Request/Response schemas
class CreateRunRequest(BaseModel):
    """Request body for creating a workflow run."""

    song_id: UUID = Field(..., description="Song identifier")
    manifest: Dict[str, Any] = Field(..., description="Workflow manifest with graph definition")
    seed: int = Field(42, description="Global seed for determinism", ge=0)


class CreateRunResponse(BaseModel):
    """Response body for create run endpoint."""

    run_id: UUID = Field(..., description="Created workflow run identifier")
    song_id: UUID
    status: str
    message: str


class RunStatusResponse(BaseModel):
    """Response body for run status endpoint."""

    run_id: UUID
    song_id: UUID
    status: str
    current_node: Optional[str]
    fix_iterations: int
    validation_scores: Optional[Dict[str, float]]
    error: Optional[Dict[str, Any]]
    created_at: Optional[str]
    updated_at: Optional[str]
    executions: list[Dict[str, Any]]
    event_counts: Dict[str, int]


class ExecuteRunResponse(BaseModel):
    """Response body for execute run endpoint."""

    run_id: UUID
    status: str
    duration_ms: int
    fix_iterations: int
    validation_scores: Optional[Dict[str, float]]
    message: str


class RetryRunResponse(BaseModel):
    """Response body for retry run endpoint."""

    original_run_id: UUID
    new_run_id: UUID
    message: str


# Dependency for workflow service
def get_workflow_service(db: Session = Depends(get_db_session)) -> WorkflowService:
    """Get workflow service instance with dependencies."""
    workflow_run_repo = WorkflowRunRepository(db=db)
    node_execution_repo = NodeExecutionRepository(db=db)
    workflow_event_repo = WorkflowEventRepository(db=db)
    event_publisher = get_event_publisher()

    return WorkflowService(
        db=db,
        workflow_run_repo=workflow_run_repo,
        node_execution_repo=node_execution_repo,
        workflow_event_repo=workflow_event_repo,
        event_publisher=event_publisher,
    )


@router.post(
    "",
    response_model=CreateRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow run",
    description="Create a new workflow run with manifest and seed",
    responses={
        201: {"description": "Workflow run created successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request data"},
    },
)
async def create_run(
    request: CreateRunRequest,
    service: WorkflowService = Depends(get_workflow_service),
) -> CreateRunResponse:
    """Create a new workflow run.

    Args:
        request: Run creation request
        service: Workflow service instance

    Returns:
        Created run information

    Raises:
        HTTPException: If run creation fails
    """
    try:
        run = await service.create_run(
            song_id=request.song_id,
            manifest=request.manifest,
            seed=request.seed,
        )

        logger.info(
            "api.runs.create.success",
            run_id=str(run.run_id),
            song_id=str(request.song_id),
        )

        return CreateRunResponse(
            run_id=run.run_id,
            song_id=run.song_id,
            status=run.status,
            message="Workflow run created successfully",
        )
    except Exception as e:
        logger.error("api.runs.create.failed", error=str(e), error_type=type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create workflow run: {str(e)}",
        )


@router.get(
    "/{run_id}",
    response_model=RunStatusResponse,
    summary="Get workflow run status",
    description="Get current status and outputs of a workflow run",
    responses={
        200: {"description": "Run status retrieved successfully"},
        404: {"model": ErrorResponse, "description": "Run not found"},
    },
)
async def get_run_status(
    run_id: UUID,
    service: WorkflowService = Depends(get_workflow_service),
) -> RunStatusResponse:
    """Get workflow run status and outputs.

    Args:
        run_id: Workflow run identifier
        service: Workflow service instance

    Returns:
        Run status information

    Raises:
        HTTPException: If run not found
    """
    status_data = await service.get_run_status(run_id)
    if not status_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow run {run_id} not found",
        )

    return RunStatusResponse(**status_data)


@router.post(
    "/{run_id}/execute",
    response_model=ExecuteRunResponse,
    summary="Execute a workflow run",
    description="Start execution of a pending workflow run",
    responses={
        200: {"description": "Execution completed successfully"},
        404: {"model": ErrorResponse, "description": "Run not found"},
        500: {"model": ErrorResponse, "description": "Execution failed"},
    },
)
async def execute_run(
    run_id: UUID,
    service: WorkflowService = Depends(get_workflow_service),
) -> ExecuteRunResponse:
    """Execute a workflow run.

    Args:
        run_id: Workflow run identifier
        service: Workflow service instance

    Returns:
        Execution result

    Raises:
        HTTPException: If execution fails
    """
    try:
        result = await service.execute_run(run_id)

        logger.info(
            "api.runs.execute.success",
            run_id=str(run_id),
            status=result.get("status"),
            duration_ms=result.get("duration_ms"),
        )

        return ExecuteRunResponse(
            run_id=run_id,
            status=result.get("status", "unknown"),
            duration_ms=result.get("duration_ms", 0),
            fix_iterations=result.get("fix_iterations", 0),
            validation_scores=result.get("validation_scores"),
            message="Workflow execution completed",
        )
    except Exception as e:
        logger.error(
            "api.runs.execute.failed",
            run_id=str(run_id),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow execution failed: {str(e)}",
        )


@router.post(
    "/{run_id}/retry",
    response_model=RetryRunResponse,
    summary="Retry a failed workflow run",
    description="Create a new run with the same manifest to retry a failed execution",
    responses={
        200: {"description": "Retry run created successfully"},
        400: {"model": ErrorResponse, "description": "Cannot retry non-failed run"},
        404: {"model": ErrorResponse, "description": "Run not found"},
    },
)
async def retry_run(
    run_id: UUID,
    service: WorkflowService = Depends(get_workflow_service),
) -> RetryRunResponse:
    """Retry a failed workflow run.

    Args:
        run_id: Failed run identifier
        service: Workflow service instance

    Returns:
        New run information

    Raises:
        HTTPException: If retry fails
    """
    try:
        new_run_id = await service.retry_run(run_id)

        logger.info(
            "api.runs.retry.success",
            original_run_id=str(run_id),
            new_run_id=str(new_run_id),
        )

        return RetryRunResponse(
            original_run_id=run_id,
            new_run_id=new_run_id,
            message="Retry run created successfully",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(
            "api.runs.retry.failed",
            run_id=str(run_id),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry workflow run: {str(e)}",
        )


@router.post(
    "/{run_id}/cancel",
    status_code=status.HTTP_200_OK,
    summary="Cancel a workflow run",
    description="Cancel an in-progress workflow run",
    responses={
        200: {"description": "Run cancelled successfully"},
        404: {"model": ErrorResponse, "description": "Run not found or already completed"},
    },
)
async def cancel_run(
    run_id: UUID,
    service: WorkflowService = Depends(get_workflow_service),
) -> Dict[str, Any]:
    """Cancel an in-progress workflow run.

    Args:
        run_id: Workflow run identifier
        service: Workflow service instance

    Returns:
        Cancellation confirmation

    Raises:
        HTTPException: If run not found or already completed
    """
    cancelled = await service.cancel_run(run_id)
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow run {run_id} not found or already completed",
        )

    logger.info("api.runs.cancel.success", run_id=str(run_id))

    return {
        "run_id": str(run_id),
        "status": "cancelled",
        "message": "Workflow run cancelled successfully",
    }


@router.websocket("/events")
async def workflow_events_websocket(
    websocket: WebSocket,
    db: Session = Depends(get_db_session),
):
    """WebSocket endpoint for streaming workflow events.

    Clients should connect with query parameter: ?run_id=<uuid>

    Events are streamed in real-time as they occur during workflow execution.
    Historical events are replayed on connection.

    Args:
        websocket: WebSocket connection
        db: Database session
    """
    await websocket.accept()

    # Extract run_id from query parameters
    run_id_str = websocket.query_params.get("run_id")
    if not run_id_str:
        await websocket.close(code=1008, reason="Missing run_id query parameter")
        return

    try:
        run_id = UUID(run_id_str)
    except ValueError:
        await websocket.close(code=1008, reason="Invalid run_id format")
        return

    event_publisher = get_event_publisher()
    workflow_event_repo = WorkflowEventRepository(db=db)

    logger.info("api.events.websocket.connected", run_id=str(run_id))

    try:
        # Subscribe to events
        await event_publisher.subscribe(run_id, websocket)

        # Replay historical events
        await event_publisher.replay_events(run_id, db, websocket)

        # Keep connection open and handle messages
        while True:
            # Wait for client messages (mostly keep-alive pings)
            await websocket.receive_text()

    except WebSocketDisconnect:
        logger.info("api.events.websocket.disconnected", run_id=str(run_id))
    except Exception as e:
        logger.error(
            "api.events.websocket.error",
            run_id=str(run_id),
            error=str(e),
            error_type=type(e).__name__,
        )
    finally:
        # Unsubscribe on disconnect
        await event_publisher.unsubscribe(run_id, websocket)
