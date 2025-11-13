"""Workflow service for orchestrating workflow runs.

This service layer provides business logic for creating, executing,
and managing workflow runs with proper error handling and observability.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import structlog
from sqlalchemy.orm import Session

from app.models.song import WorkflowRun
from app.repositories.node_execution_repo import NodeExecutionRepository
from app.repositories.workflow_event_repo import WorkflowEventRepository
from app.repositories.workflow_run_repo import WorkflowRunRepository
from app.workflows.events import EventPublisher, get_event_publisher
from app.workflows.orchestrator import WorkflowOrchestrator

logger = structlog.get_logger(__name__)


class WorkflowService:
    """Service for workflow run operations and orchestration.

    Provides high-level operations for:
    - Creating and starting workflow runs
    - Querying run status and outputs
    - Retrying failed runs or nodes
    - Cancelling in-progress runs
    """

    def __init__(
        self,
        db: Session,
        workflow_run_repo: WorkflowRunRepository,
        node_execution_repo: NodeExecutionRepository,
        workflow_event_repo: WorkflowEventRepository,
        event_publisher: Optional[EventPublisher] = None,
    ):
        """Initialize the workflow service.

        Args:
            db: Database session
            workflow_run_repo: Repository for workflow run access
            node_execution_repo: Repository for node execution tracking
            workflow_event_repo: Repository for event persistence
            event_publisher: Optional event publisher (defaults to singleton)
        """
        self.db = db
        self.workflow_run_repo = workflow_run_repo
        self.node_execution_repo = node_execution_repo
        self.workflow_event_repo = workflow_event_repo
        self.event_publisher = event_publisher or get_event_publisher()

        # Create orchestrator instance
        self.orchestrator = WorkflowOrchestrator(
            db_session=db,
            event_publisher=self.event_publisher,
            workflow_run_repo=workflow_run_repo,
            node_execution_repo=node_execution_repo,
        )

    async def create_run(
        self,
        song_id: UUID,
        manifest: Dict[str, Any],
        seed: int,
        tenant_id: Optional[UUID] = None,
        owner_id: Optional[UUID] = None,
    ) -> WorkflowRun:
        """Create a new workflow run.

        Args:
            song_id: Song identifier
            manifest: Workflow manifest with graph definition
            seed: Global seed for determinism
            tenant_id: Optional tenant identifier for multi-tenancy
            owner_id: Optional owner identifier for RLS

        Returns:
            Created WorkflowRun entity
        """
        run_id = uuid4()

        # Create workflow run record
        workflow_run = WorkflowRun(
            run_id=run_id,
            song_id=song_id,
            status="pending",
            extra_metadata={
                "manifest": manifest,
                "seed": seed,
            },
            tenant_id=tenant_id,
            owner_id=owner_id,
        )

        self.db.add(workflow_run)
        self.db.commit()
        self.db.refresh(workflow_run)

        logger.info(
            "workflow_run.created",
            run_id=str(run_id),
            song_id=str(song_id),
            seed=seed,
            graph_nodes=len(manifest.get("graph", [])),
        )

        # Publish creation event
        await self.event_publisher.publish_event(
            run_id=run_id,
            node_name=None,
            phase="info",
            data={
                "message": "Workflow run created",
                "song_id": str(song_id),
                "seed": seed,
            },
            db_session=self.db,
        )

        return workflow_run

    async def execute_run(self, run_id: UUID) -> Dict[str, Any]:
        """Execute a workflow run.

        Args:
            run_id: Workflow run identifier

        Returns:
            Execution result with status, outputs, and metrics
        """
        logger.info("workflow_run.execute.start", run_id=str(run_id))

        # Publish start event
        await self.event_publisher.publish_event(
            run_id=run_id,
            node_name=None,
            phase="start",
            data={"message": "Workflow execution started"},
            db_session=self.db,
        )

        try:
            # Execute via orchestrator
            result = await self.orchestrator.execute_run(run_id)

            # Publish completion event
            await self.event_publisher.publish_event(
                run_id=run_id,
                node_name=None,
                phase="end",
                data={
                    "message": "Workflow execution completed",
                    "duration_ms": result.get("duration_ms"),
                    "fix_iterations": result.get("fix_iterations"),
                },
                db_session=self.db,
            )

            logger.info(
                "workflow_run.execute.completed",
                run_id=str(run_id),
                status=result.get("status"),
                duration_ms=result.get("duration_ms"),
            )

            return result

        except Exception as e:
            # Publish failure event
            await self.event_publisher.publish_event(
                run_id=run_id,
                node_name=None,
                phase="fail",
                data={
                    "message": "Workflow execution failed",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                db_session=self.db,
            )

            logger.error(
                "workflow_run.execute.failed",
                run_id=str(run_id),
                error=str(e),
                error_type=type(e).__name__,
            )

            raise

    async def get_run_status(self, run_id: UUID) -> Optional[Dict[str, Any]]:
        """Get the current status and outputs of a workflow run.

        Args:
            run_id: Workflow run identifier

        Returns:
            Dictionary with run status, outputs, and progress, or None if not found
        """
        run = self.workflow_run_repo.get_by_run_id(run_id)
        if not run:
            return None

        # Get node executions
        executions = self.node_execution_repo.get_by_run_id(run_id)

        # Get event count by phase
        event_counts = self.workflow_event_repo.count_events_by_phase(run_id)

        return {
            "run_id": str(run.run_id),
            "song_id": str(run.song_id),
            "status": run.status,
            "current_node": run.current_node,
            "fix_iterations": run.fix_iterations,
            "validation_scores": run.validation_scores,
            "error": run.error,
            "created_at": run.created_at.isoformat() if run.created_at else None,
            "updated_at": run.updated_at.isoformat() if run.updated_at else None,
            "executions": [
                {
                    "node_name": ex.node_name,
                    "status": ex.status,
                    "duration_ms": ex.duration_ms,
                    "started_at": ex.started_at.isoformat() if ex.started_at else None,
                    "completed_at": (
                        ex.completed_at.isoformat() if ex.completed_at else None
                    ),
                }
                for ex in executions
            ],
            "event_counts": event_counts,
        }

    async def cancel_run(self, run_id: UUID) -> bool:
        """Cancel an in-progress workflow run.

        Args:
            run_id: Workflow run identifier

        Returns:
            True if cancelled, False if not found or already completed
        """
        run = self.workflow_run_repo.get_by_run_id(run_id)
        if not run or run.status not in ["pending", "running"]:
            return False

        # Update status to cancelled
        run.status = "cancelled"
        run.error = {
            "message": "Workflow run cancelled by user",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.db.commit()

        # Publish cancellation event
        await self.event_publisher.publish_event(
            run_id=run_id,
            node_name=None,
            phase="info",
            data={"message": "Workflow run cancelled"},
            db_session=self.db,
        )

        logger.info("workflow_run.cancelled", run_id=str(run_id))

        return True

    async def retry_run(self, run_id: UUID) -> UUID:
        """Retry a failed workflow run by creating a new run with the same manifest.

        Args:
            run_id: Failed workflow run identifier

        Returns:
            New run_id for the retry

        Raises:
            ValueError: If original run not found or not failed
        """
        original_run = self.workflow_run_repo.get_by_run_id(run_id)
        if not original_run:
            raise ValueError(f"Workflow run {run_id} not found")
        if original_run.status != "failed":
            raise ValueError(f"Can only retry failed runs, current status: {original_run.status}")

        # Extract manifest and seed
        manifest = original_run.extra_metadata.get("manifest", {})
        seed = original_run.extra_metadata.get("seed", 42)

        # Create new run
        new_run = await self.create_run(
            song_id=original_run.song_id,
            manifest=manifest,
            seed=seed,
            tenant_id=original_run.tenant_id,
            owner_id=original_run.owner_id,
        )

        logger.info(
            "workflow_run.retried",
            original_run_id=str(run_id),
            new_run_id=str(new_run.run_id),
        )

        return new_run.run_id

    def get_active_runs(self) -> List[WorkflowRun]:
        """Get all active (running) workflow runs.

        Returns:
            List of WorkflowRun entities with status='running'
        """
        return self.workflow_run_repo.get_active_runs()

    def get_failed_runs(self, limit: int = 10) -> List[WorkflowRun]:
        """Get recent failed workflow runs.

        Args:
            limit: Maximum number of runs to return

        Returns:
            List of failed WorkflowRun entities
        """
        return self.workflow_run_repo.get_failed_runs(limit=limit)
