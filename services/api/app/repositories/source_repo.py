"""Source repository with RLS enforcement and scope filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.source import Source
from .base import BaseRepository


@dataclass
class SourceRepository(BaseRepository[Source]):
    """Data access methods for sources with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    def get_by_scope(self, scope: str) -> List[Source]:
        """Get all sources for a specific MCP scope.

        Parameters
        ----------
        scope : str
            The MCP scope to filter by (e.g., 'music', 'lyrics', 'theory')

        Returns
        -------
        List[Source]
            List of sources matching the scope, filtered by security context
        """
        query = self.db.query(Source).filter(
            Source.deleted_at.is_(None)
        )

        # Filter by MCP scope in JSONB config
        query = query.filter(
            Source.mcp_config['scope'].astext == scope
        )

        # Apply row-level security
        guard = self.get_unified_guard(Source)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_source_type(self, source_type: str) -> List[Source]:
        """Get sources by type (file, web, api, mcp).

        Parameters
        ----------
        source_type : str
            The source type to filter by

        Returns
        -------
        List[Source]
            Sources matching the specified type
        """
        query = self.db.query(Source).filter(
            Source.source_type == source_type,
            Source.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Source)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_active_sources(self) -> List[Source]:
        """Get all active (non-deleted) sources with security filtering.

        Returns
        -------
        List[Source]
            List of all active sources accessible by current security context
        """
        query = self.db.query(Source).filter(
            Source.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Source)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(Source.source_type, Source.created_at.desc()).all()

    def search_by_tags(self, tags: List[str]) -> List[Source]:
        """Search sources by tags.

        Parameters
        ----------
        tags : List[str]
            List of tags to search for

        Returns
        -------
        List[Source]
            Sources containing any of the specified tags
        """
        query = self.db.query(Source).filter(
            Source.deleted_at.is_(None)
        )

        # PostgreSQL array overlap operator for tag search
        if tags:
            query = query.filter(
                Source.tags.op('&&')(tags)
            )

        # Apply row-level security
        guard = self.get_unified_guard(Source)
        if guard:
            query = guard.filter_query(query)

        return query.all()
