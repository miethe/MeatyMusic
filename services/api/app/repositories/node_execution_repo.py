"""Node execution repository for workflow execution tracking."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow import NodeExecution
from app.repositories.base import BaseRepository


@dataclass
class NodeExecutionRepository(BaseRepository[NodeExecution]):
    """Repository for node execution data access with RLS enforcement.

    Provides methods for tracking individual node executions within
    workflow runs, including status updates and performance metrics.
    """

    model_class = NodeExecution  # Type annotation for generic list operations

    def get_by_run_id(self, run_id: UUID) -> List[NodeExecution]:
        """Get all node executions for a specific workflow run.

        Args:
            run_id: Workflow run identifier

        Returns:
            List of node executions, ordered by node_index
        """
        query = self.db.query(NodeExecution).filter(
            NodeExecution.run_id == run_id, NodeExecution.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(NodeExecution)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(NodeExecution.node_index.asc()).all()

    def get_by_execution_id(self, execution_id: UUID) -> Optional[NodeExecution]:
        """Get node execution by unique execution_id.

        Args:
            execution_id: Unique execution identifier

        Returns:
            NodeExecution if found and accessible, None otherwise
        """
        query = self.db.query(NodeExecution).filter(
            NodeExecution.execution_id == execution_id,
            NodeExecution.deleted_at.is_(None),
        )

        # Apply row-level security
        guard = self.get_unified_guard(NodeExecution)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def get_by_node_name(
        self, run_id: UUID, node_name: str
    ) -> List[NodeExecution]:
        """Get all executions for a specific node in a run.

        Useful for nodes that may execute multiple times (e.g., FIX).

        Args:
            run_id: Workflow run identifier
            node_name: Node name (PLAN, STYLE, LYRICS, etc.)

        Returns:
            List of node executions, ordered by node_index
        """
        query = self.db.query(NodeExecution).filter(
            NodeExecution.run_id == run_id,
            NodeExecution.node_name == node_name,
            NodeExecution.deleted_at.is_(None),
        )

        # Apply row-level security
        guard = self.get_unified_guard(NodeExecution)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(NodeExecution.node_index.asc()).all()

    def get_failed_executions(
        self, run_id: Optional[UUID] = None
    ) -> List[NodeExecution]:
        """Get failed node executions, optionally filtered by run.

        Args:
            run_id: Optional workflow run identifier to filter by

        Returns:
            List of failed executions, ordered by started_at descending
        """
        query = self.db.query(NodeExecution).filter(
            NodeExecution.status == "failed", NodeExecution.deleted_at.is_(None)
        )

        if run_id:
            query = query.filter(NodeExecution.run_id == run_id)

        # Apply row-level security
        guard = self.get_unified_guard(NodeExecution)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(NodeExecution.started_at.desc()).all()

    def get_slow_executions(
        self, min_duration_ms: int = 10000, limit: int = 20
    ) -> List[NodeExecution]:
        """Get slow node executions for performance analysis.

        Args:
            min_duration_ms: Minimum duration threshold in milliseconds
            limit: Maximum number of results

        Returns:
            List of slow executions, ordered by duration descending
        """
        query = (
            self.db.query(NodeExecution)
            .filter(
                NodeExecution.duration_ms >= min_duration_ms,
                NodeExecution.status == "completed",
                NodeExecution.deleted_at.is_(None),
            )
            .order_by(NodeExecution.duration_ms.desc())
            .limit(limit)
        )

        # Apply row-level security
        guard = self.get_unified_guard(NodeExecution)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_status(
        self, status: str, run_id: Optional[UUID] = None
    ) -> List[NodeExecution]:
        """Get node executions by status.

        Args:
            status: Execution status (pending, running, completed, failed, skipped)
            run_id: Optional run_id to filter by

        Returns:
            List of executions matching status
        """
        query = self.db.query(NodeExecution).filter(
            NodeExecution.status == status, NodeExecution.deleted_at.is_(None)
        )

        if run_id:
            query = query.filter(NodeExecution.run_id == run_id)

        # Apply row-level security
        guard = self.get_unified_guard(NodeExecution)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(NodeExecution.started_at.desc()).all()
