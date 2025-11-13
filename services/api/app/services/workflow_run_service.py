"""Service layer for WorkflowRun entity business logic.

This module implements business logic for workflow run tracking including
node output management, event stream updates, and validation score tracking.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
import structlog

from app.repositories.workflow_run_repo import WorkflowRunRepository
from app.schemas.song import (
    WorkflowRunCreate,
    WorkflowRunUpdate,
    WorkflowRunStatus,
    WorkflowNode
)
from app.models.song import WorkflowRun

logger = structlog.get_logger(__name__)


class WorkflowRunService:
    """Service for workflow run operations with state management."""

    def __init__(self, workflow_run_repo: WorkflowRunRepository):
        """Initialize the workflow run service.

        Args:
            workflow_run_repo: Repository for workflow run data access
        """
        self.workflow_run_repo = workflow_run_repo

    async def create_run(self, data: WorkflowRunCreate) -> WorkflowRun:
        """Create a new workflow run.

        Args:
            data: WorkflowRun creation data

        Returns:
            Created workflow run entity
        """
        run = await self.workflow_run_repo.create(data)

        logger.info(
            "workflow_run.created",
            run_id=str(run.run_id),
            song_id=str(run.song_id),
            status=run.status
        )

        return run

    async def update_run(
        self,
        run_id: UUID,
        data: WorkflowRunUpdate
    ) -> Optional[WorkflowRun]:
        """Update an existing workflow run.

        Args:
            run_id: WorkflowRun identifier (primary key, not run_id)
            data: WorkflowRun update data

        Returns:
            Updated workflow run entity, or None if not found
        """
        run = await self.workflow_run_repo.update(run_id, data)

        if run:
            logger.info(
                "workflow_run.updated",
                run_id=str(run.run_id),
                updated_fields=list(data.model_dump(exclude_unset=True).keys())
            )

        return run

    async def update_node_output(
        self,
        run_id: UUID,
        node: WorkflowNode,
        output: Dict[str, Any]
    ) -> Optional[WorkflowRun]:
        """Update the output for a specific workflow node.

        Args:
            run_id: WorkflowRun unique identifier (run_id field, not pk)
            node: Workflow node name
            output: Node output data (artifacts, scores, citations, duration_ms)

        Returns:
            Updated workflow run entity, or None if not found
        """
        # Get existing run by run_id
        run = await self.workflow_run_repo.get_by_run_id(run_id)
        if not run:
            return None

        # Update node outputs
        node_outputs = run.node_outputs or {}
        node_outputs[node.value] = output

        # Update the run
        from app.schemas.song import WorkflowRunUpdate
        updated = await self.workflow_run_repo.update(
            run.id,  # Use primary key for update
            WorkflowRunUpdate(
                node_outputs=node_outputs,
                current_node=node
            )
        )

        logger.info(
            "workflow_run.node_output_updated",
            run_id=str(run_id),
            node=node.value,
            output_keys=list(output.keys())
        )

        return updated

    async def add_event(
        self,
        run_id: UUID,
        event: Dict[str, Any]
    ) -> Optional[WorkflowRun]:
        """Add an event to the workflow run event stream.

        Args:
            run_id: WorkflowRun unique identifier (run_id field)
            event: Event data (ts, node, phase, duration_ms, metrics, issues)

        Returns:
            Updated workflow run entity, or None if not found
        """
        # Get existing run by run_id
        run = await self.workflow_run_repo.get_by_run_id(run_id)
        if not run:
            return None

        # Append event to stream
        event_stream = run.event_stream or []
        event_stream.append(event)

        # Update the run
        from app.schemas.song import WorkflowRunUpdate
        updated = await self.workflow_run_repo.update(
            run.id,
            WorkflowRunUpdate(event_stream=event_stream)
        )

        logger.debug(
            "workflow_run.event_added",
            run_id=str(run_id),
            event_node=event.get("node"),
            event_phase=event.get("phase")
        )

        return updated

    async def get_active_runs(self) -> List[WorkflowRun]:
        """Get all active (running) workflow runs.

        Returns:
            List of workflow runs with status=running
        """
        return await self.workflow_run_repo.get_active_runs()

    async def get_failed_runs(self) -> List[WorkflowRun]:
        """Get all failed workflow runs.

        Returns:
            List of workflow runs with status=failed
        """
        return await self.workflow_run_repo.get_failed_runs()

    async def fail_run(
        self,
        run_id: UUID,
        error: Dict[str, Any]
    ) -> Optional[WorkflowRun]:
        """Mark a workflow run as failed with error details.

        Args:
            run_id: WorkflowRun unique identifier (run_id field)
            error: Error details (message, node, stack_trace)

        Returns:
            Updated workflow run entity, or None if not found
        """
        # Get existing run by run_id
        run = await self.workflow_run_repo.get_by_run_id(run_id)
        if not run:
            return None

        # Update to failed status
        from app.schemas.song import WorkflowRunUpdate
        updated = await self.workflow_run_repo.update(
            run.id,
            WorkflowRunUpdate(
                status=WorkflowRunStatus.FAILED,
                error=error
            )
        )

        logger.error(
            "workflow_run.failed",
            run_id=str(run_id),
            error_node=error.get("node"),
            error_message=error.get("message")
        )

        return updated

    async def complete_run(
        self,
        run_id: UUID,
        validation_scores: Optional[Dict[str, float]] = None
    ) -> Optional[WorkflowRun]:
        """Mark a workflow run as completed.

        Args:
            run_id: WorkflowRun unique identifier (run_id field)
            validation_scores: Optional final validation scores

        Returns:
            Updated workflow run entity, or None if not found
        """
        # Get existing run by run_id
        run = await self.workflow_run_repo.get_by_run_id(run_id)
        if not run:
            return None

        # Update to completed status
        from app.schemas.song import WorkflowRunUpdate
        update_data = WorkflowRunUpdate(
            status=WorkflowRunStatus.COMPLETED
        )
        if validation_scores:
            update_data.validation_scores = validation_scores

        updated = await self.workflow_run_repo.update(run.id, update_data)

        logger.info(
            "workflow_run.completed",
            run_id=str(run_id),
            has_scores=validation_scores is not None,
            fix_iterations=run.fix_iterations
        )

        return updated
