"""Style repository with RLS enforcement and genre filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Union
from uuid import UUID

from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.style import Style
from .base import BaseRepository


@dataclass
class StyleRepository(BaseRepository[Style]):
    """Data access methods for styles with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    model_class = Style  # Type annotation for generic list operations

    def get_by_id(self, id: UUID) -> Optional[Style]:
        """Get style by ID with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.get_by_id().

        Parameters
        ----------
        id : UUID
            The style ID to retrieve

        Returns
        -------
        Optional[Style]
            Style if found and accessible, None otherwise
        """
        return super().get_by_id(self.model_class, id)

    def update(self, id: UUID, data: Union[Dict[str, Any], BaseModel]) -> Optional[Style]:
        """Update style with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.update().

        Parameters
        ----------
        id : UUID
            The style ID to update
        data : Union[Dict[str, Any], BaseModel]
            Update data as dictionary or Pydantic model

        Returns
        -------
        Optional[Style]
            Updated style if found and accessible, None otherwise
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump(exclude_unset=True)
        else:
            data_dict = data
        return super().update(self.model_class, id, data_dict)

    def delete(self, id: UUID) -> bool:
        """Delete style with security filtering (soft delete).

        Convenience wrapper that uses self.model_class to call BaseRepository.delete().

        Parameters
        ----------
        id : UUID
            The style ID to delete

        Returns
        -------
        bool
            True if deleted, False if not found
        """
        return super().delete(self.model_class, id)

    def create(self, data: Union[Dict[str, Any], BaseModel]) -> Style:
        """Create style with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.create().

        Parameters
        ----------
        data : Union[Dict[str, Any], BaseModel]
            Create data as dictionary or Pydantic model

        Returns
        -------
        Style
            Created style
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump()
        else:
            data_dict = data
        return super().create(self.model_class, data_dict)

    def get_by_genre(self, genre: str) -> List[Style]:
        """Get all styles for a specific genre with security filtering.

        Parameters
        ----------
        genre : str
            The genre to filter by (e.g., 'pop', 'country', 'hip-hop')

        Returns
        -------
        List[Style]
            List of styles matching the genre, filtered by security context
        """
        query = self.db.query(Style).filter(
            Style.genre == genre,
            Style.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(Style)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_bpm_range(
        self,
        min_bpm: Optional[int] = None,
        max_bpm: Optional[int] = None
    ) -> List[Style]:
        """Get styles within a BPM range.

        Parameters
        ----------
        min_bpm : Optional[int]
            Minimum BPM (inclusive)
        max_bpm : Optional[int]
            Maximum BPM (inclusive)

        Returns
        -------
        List[Style]
            Styles within the specified BPM range
        """
        query = self.db.query(Style).filter(
            Style.deleted_at.is_(None)
        )

        # Filter by BPM range overlap
        # Style's range (bpm_min, bpm_max) must overlap with search range
        if min_bpm is not None:
            query = query.filter(Style.bpm_max >= min_bpm)
        if max_bpm is not None:
            query = query.filter(Style.bpm_min <= max_bpm)

        # Apply row-level security
        guard = self.get_unified_guard(Style)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def search_by_mood(self, moods: List[str]) -> List[Style]:
        """Search styles by mood tags.

        Parameters
        ----------
        moods : List[str]
            List of mood descriptors to search for

        Returns
        -------
        List[Style]
            Styles containing any of the specified moods
        """
        query = self.db.query(Style).filter(
            Style.deleted_at.is_(None)
        )

        # PostgreSQL array overlap operator for mood search
        # mood && ARRAY['energetic', 'upbeat']
        if moods:
            query = query.filter(
                Style.mood.op('&&')(moods)
            )

        # Apply row-level security
        guard = self.get_unified_guard(Style)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def search_by_tags(
        self,
        positive_tags: Optional[List[str]] = None,
        negative_tags: Optional[List[str]] = None
    ) -> List[Style]:
        """Search styles by positive/negative tags.

        Parameters
        ----------
        positive_tags : Optional[List[str]]
            Tags that must be present
        negative_tags : Optional[List[str]]
            Tags that must be absent

        Returns
        -------
        List[Style]
            Styles matching the tag criteria
        """
        query = self.db.query(Style).filter(
            Style.deleted_at.is_(None)
        )

        # Filter by positive tags (array overlap)
        if positive_tags:
            query = query.filter(
                Style.tags_positive.op('&&')(positive_tags)
            )

        # Filter by negative tags (array overlap)
        if negative_tags:
            query = query.filter(
                Style.tags_negative.op('&&')(negative_tags)
            )

        # Apply row-level security
        guard = self.get_unified_guard(Style)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_energy_level(
        self,
        min_energy: Optional[int] = None,
        max_energy: Optional[int] = None
    ) -> List[Style]:
        """Get styles by energy level range.

        Parameters
        ----------
        min_energy : Optional[int]
            Minimum energy level (1-10)
        max_energy : Optional[int]
            Maximum energy level (1-10)

        Returns
        -------
        List[Style]
            Styles within the specified energy range
        """
        query = self.db.query(Style).filter(
            Style.deleted_at.is_(None)
        )

        if min_energy is not None:
            query = query.filter(Style.energy_level >= min_energy)
        if max_energy is not None:
            query = query.filter(Style.energy_level <= max_energy)

        # Apply row-level security
        guard = self.get_unified_guard(Style)
        if guard:
            query = guard.filter_query(query)

        return query.all()
