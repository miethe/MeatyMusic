"""Blueprint repository with RLS enforcement and genre filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.blueprint import Blueprint
from .base import BaseRepository


@dataclass
class BlueprintRepository(BaseRepository[Blueprint]):
    """Data access methods for blueprints with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    def get_by_genre(self, genre: str) -> List[Blueprint]:
        """Get all blueprints for a specific genre with security filtering.

        Parameters
        ----------
        genre : str
            The genre to filter by (e.g., 'pop', 'country', 'hip-hop')

        Returns
        -------
        List[Blueprint]
            List of blueprints matching the genre, filtered by security context
        """
        query = self.db.query(Blueprint).filter(
            Blueprint.genre == genre,
            Blueprint.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(Blueprint)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_active_blueprints(self) -> List[Blueprint]:
        """Get all active (non-deleted) blueprints with security filtering.

        Returns
        -------
        List[Blueprint]
            List of all active blueprints accessible by current security context
        """
        query = self.db.query(Blueprint).filter(
            Blueprint.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Blueprint)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(Blueprint.genre, Blueprint.created_at.desc()).all()

    def search_by_tags(self, tags: List[str]) -> List[Blueprint]:
        """Search blueprints by tag categories.

        Parameters
        ----------
        tags : List[str]
            List of tags to search for in tag_categories

        Returns
        -------
        List[Blueprint]
            Blueprints containing any of the specified tags
        """
        query = self.db.query(Blueprint).filter(
            Blueprint.deleted_at.is_(None)
        )

        # PostgreSQL JSONB contains operator for tag search
        # Check if any tag exists in tag_categories
        for tag in tags:
            query = query.filter(
                Blueprint.tag_categories.op('?')(tag)
            )

        # Apply row-level security
        guard = self.get_unified_guard(Blueprint)
        if guard:
            query = guard.filter_query(query)

        return query.all()
