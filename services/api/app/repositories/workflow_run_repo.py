"""Workflow run repository with RLS enforcement and active run queries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.song import WorkflowRun, Song
from .base import BaseRepository


@dataclass
class WorkflowRunRepository(BaseRepository[WorkflowRun]):
    """Data access methods for workflow runs with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    def get_active_runs(self) -> List[WorkflowRun]:
        """Get all active (running) workflow runs with security filtering.

        Returns
        -------
        List[WorkflowRun]
            List of runs with status='running', filtered by security context
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.status == 'running',
            WorkflowRun.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowRun.created_at.desc()).all()

    def get_by_song_id(self, song_id: UUID) -> List[WorkflowRun]:
        """Get all workflow runs for a specific song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        List[WorkflowRun]
            All workflow runs for the song, ordered by created_at descending
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.song_id == song_id,
            WorkflowRun.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowRun.created_at.desc()).all()

    def get_by_run_id(self, run_id: UUID) -> Optional[WorkflowRun]:
        """Get workflow run by unique run_id.

        Parameters
        ----------
        run_id : UUID
            The unique run identifier

        Returns
        -------
        Optional[WorkflowRun]
            The workflow run if found and accessible, None otherwise
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.run_id == run_id,
            WorkflowRun.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def get_with_song(self, run_id: UUID) -> Optional[tuple[WorkflowRun, Optional[Song]]]:
        """Get workflow run with eagerly loaded song.

        Parameters
        ----------
        run_id : UUID
            The unique run identifier

        Returns
        -------
        Optional[tuple[WorkflowRun, Optional[Song]]]
            Tuple of (run, song) if found and accessible, None otherwise
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.run_id == run_id,
            WorkflowRun.deleted_at.is_(None)
        ).options(
            joinedload(WorkflowRun.song)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        run = query.first()
        if run is None:
            return None

        return (run, run.song)

    def get_failed_runs(self, limit: int = 10) -> List[WorkflowRun]:
        """Get recent failed workflow runs.

        Parameters
        ----------
        limit : int
            Maximum number of runs to return (default: 10)

        Returns
        -------
        List[WorkflowRun]
            Recent failed runs, ordered by created_at descending
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.status == 'failed',
            WorkflowRun.deleted_at.is_(None)
        ).order_by(WorkflowRun.created_at.desc()).limit(limit)

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_status(self, status: str) -> List[WorkflowRun]:
        """Get workflow runs by status.

        Parameters
        ----------
        status : str
            The status to filter by (running, completed, failed)

        Returns
        -------
        List[WorkflowRun]
            Runs matching the status, filtered by security context
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.status == status,
            WorkflowRun.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowRun.created_at.desc()).all()

    def get_runs_with_high_fix_iterations(self, min_iterations: int = 2) -> List[WorkflowRun]:
        """Get runs that required multiple fix iterations.

        Useful for identifying patterns in validation failures.

        Parameters
        ----------
        min_iterations : int
            Minimum number of fix iterations to filter by (default: 2)

        Returns
        -------
        List[WorkflowRun]
            Runs with fix_iterations >= min_iterations
        """
        query = self.db.query(WorkflowRun).filter(
            WorkflowRun.fix_iterations >= min_iterations,
            WorkflowRun.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(WorkflowRun)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(WorkflowRun.fix_iterations.desc(), WorkflowRun.created_at.desc()).all()
