"""Workflow event repository for event stream persistence."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow import WorkflowEvent
from app.repositories.base import BaseRepository


@dataclass
class WorkflowEventRepository(BaseRepository[WorkflowEvent]):
    """Repository for workflow event data access with RLS enforcement.

    Provides methods for persisting and querying workflow events for
    observability, debugging, and event replay.
    """

    model_class = WorkflowEvent  # Type annotation for generic list operations

    def get_by_run_id(
        self, run_id: UUID, limit: Optional[int] = None
    ) -> List[WorkflowEvent]:
        """Get all events for a specific workflow run.

        Args:
            run_id: Workflow run identifier
            limit: Optional limit on number of events

        Returns:
            List of events, ordered by timestamp ascending
        """
        query = self.db.query(WorkflowEvent).filter(
            WorkflowEvent.run_id == run_id, WorkflowEvent.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        query = query.order_by(WorkflowEvent.timestamp.asc())

        if limit:
            query = query.limit(limit)

        return query.all()

    def get_by_event_id(self, event_id: UUID) -> Optional[WorkflowEvent]:
        """Get event by unique event_id.

        Args:
            event_id: Unique event identifier

        Returns:
            WorkflowEvent if found and accessible, None otherwise
        """
        query = self.db.query(WorkflowEvent).filter(
            WorkflowEvent.event_id == event_id, WorkflowEvent.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def get_by_node_name(
        self, run_id: UUID, node_name: str
    ) -> List[WorkflowEvent]:
        """Get all events for a specific node in a run.

        Args:
            run_id: Workflow run identifier
            node_name: Node name (PLAN, STYLE, LYRICS, etc.)

        Returns:
            List of events, ordered by timestamp ascending
        """
        query = self.db.query(WorkflowEvent).filter(
            WorkflowEvent.run_id == run_id,
            WorkflowEvent.node_name == node_name,
            WorkflowEvent.deleted_at.is_(None),
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowEvent.timestamp.asc()).all()

    def get_by_phase(
        self, run_id: UUID, phase: str
    ) -> List[WorkflowEvent]:
        """Get all events for a specific phase.

        Args:
            run_id: Workflow run identifier
            phase: Event phase (start, end, fail, info)

        Returns:
            List of events, ordered by timestamp ascending
        """
        query = self.db.query(WorkflowEvent).filter(
            WorkflowEvent.run_id == run_id,
            WorkflowEvent.phase == phase,
            WorkflowEvent.deleted_at.is_(None),
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowEvent.timestamp.asc()).all()

    def get_failures(
        self, run_id: Optional[UUID] = None, limit: int = 50
    ) -> List[WorkflowEvent]:
        """Get failure events for debugging.

        Args:
            run_id: Optional run_id to filter by
            limit: Maximum number of events

        Returns:
            List of failure events, ordered by timestamp descending
        """
        query = (
            self.db.query(WorkflowEvent)
            .filter(
                WorkflowEvent.phase == "fail", WorkflowEvent.deleted_at.is_(None)
            )
            .order_by(WorkflowEvent.timestamp.desc())
            .limit(limit)
        )

        if run_id:
            query = query.filter(WorkflowEvent.run_id == run_id)

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_events_after(
        self, run_id: UUID, after: datetime
    ) -> List[WorkflowEvent]:
        """Get events after a specific timestamp.

        Useful for incremental event streaming.

        Args:
            run_id: Workflow run identifier
            after: Timestamp to fetch events after

        Returns:
            List of events, ordered by timestamp ascending
        """
        query = self.db.query(WorkflowEvent).filter(
            WorkflowEvent.run_id == run_id,
            WorkflowEvent.timestamp > after,
            WorkflowEvent.deleted_at.is_(None),
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowEvent.timestamp.asc()).all()

    def count_events_by_phase(self, run_id: UUID) -> dict[str, int]:
        """Count events by phase for a run.

        Useful for workflow metrics and dashboards.

        Args:
            run_id: Workflow run identifier

        Returns:
            Dictionary mapping phase to count
        """
        from sqlalchemy import func

        query = (
            self.db.query(
                WorkflowEvent.phase, func.count(WorkflowEvent.id).label("count")
            )
            .filter(
                WorkflowEvent.run_id == run_id, WorkflowEvent.deleted_at.is_(None)
            )
            .group_by(WorkflowEvent.phase)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowEvent)
        if guard:
            query = guard.filter_query(query)

        results = query.all()

        return {phase: count for phase, count in results}
