"""Blueprint repository with RLS enforcement and genre filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Union
from uuid import UUID

from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.blueprint import Blueprint
from .base import BaseRepository


@dataclass
class BlueprintRepository(BaseRepository[Blueprint]):
    """Data access methods for blueprints with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    model_class = Blueprint  # Type annotation for generic list operations

    def get_by_id(self, id: UUID) -> Optional[Blueprint]:
        """Get blueprint by ID with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.get_by_id().

        Parameters
        ----------
        id : UUID
            The blueprint ID to retrieve

        Returns
        -------
        Optional[Blueprint]
            Blueprint if found and accessible, None otherwise
        """
        return super().get_by_id(self.model_class, id)

    def update(self, id: UUID, data: Union[Dict[str, Any], BaseModel]) -> Optional[Blueprint]:
        """Update blueprint with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.update().

        Parameters
        ----------
        id : UUID
            The blueprint ID to update
        data : Union[Dict[str, Any], BaseModel]
            Update data as dictionary or Pydantic model

        Returns
        -------
        Optional[Blueprint]
            Updated blueprint if found and accessible, None otherwise
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump(exclude_unset=True)
        else:
            data_dict = data
        return super().update(self.model_class, id, data_dict)

    def delete(self, id: UUID) -> bool:
        """Delete blueprint with security filtering (soft delete).

        Convenience wrapper that uses self.model_class to call BaseRepository.delete().

        Parameters
        ----------
        id : UUID
            The blueprint ID to delete

        Returns
        -------
        bool
            True if deleted, False if not found
        """
        return super().delete(self.model_class, id)

    def create(self, data: Union[Dict[str, Any], BaseModel]) -> Blueprint:
        """Create blueprint with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.create().

        Parameters
        ----------
        data : Union[Dict[str, Any], BaseModel]
            Create data as dictionary or Pydantic model

        Returns
        -------
        Blueprint
            Created blueprint
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump()
        else:
            data_dict = data
        return super().create(self.model_class, data_dict)

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
