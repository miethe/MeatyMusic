"""Style repository with RLS enforcement and genre filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.style import Style
from .base import BaseRepository


@dataclass
class StyleRepository(BaseRepository[Style]):
    """Data access methods for styles with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

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
