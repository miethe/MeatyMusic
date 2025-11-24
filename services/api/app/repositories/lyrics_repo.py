"""Lyrics repository with RLS enforcement and song association queries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Union
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.models.lyrics import Lyrics
from app.models.song import Song
from .base import BaseRepository


@dataclass
class LyricsRepository(BaseRepository[Lyrics]):
    """Data access methods for lyrics with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    model_class = Lyrics  # Type annotation for generic list operations

    def get_by_id(self, id: UUID) -> Optional[Lyrics]:
        """Get lyrics by ID with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.get_by_id().

        Parameters
        ----------
        id : UUID
            The lyrics ID to retrieve

        Returns
        -------
        Optional[Lyrics]
            Lyrics if found and accessible, None otherwise
        """
        return super().get_by_id(self.model_class, id)

    def update(self, id: UUID, data: Union[Dict[str, Any], BaseModel]) -> Optional[Lyrics]:
        """Update lyrics with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.update().

        Parameters
        ----------
        id : UUID
            The lyrics ID to update
        data : Union[Dict[str, Any], BaseModel]
            Update data as dictionary or Pydantic model

        Returns
        -------
        Optional[Lyrics]
            Updated lyrics if found and accessible, None otherwise
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump(exclude_unset=True)
        else:
            data_dict = data
        return super().update(self.model_class, id, data_dict)

    def delete(self, id: UUID) -> bool:
        """Delete lyrics with security filtering (soft delete).

        Convenience wrapper that uses self.model_class to call BaseRepository.delete().

        Parameters
        ----------
        id : UUID
            The lyrics ID to delete

        Returns
        -------
        bool
            True if deleted, False if not found
        """
        return super().delete(self.model_class, id)

    def create(self, data: Union[Dict[str, Any], BaseModel]) -> Lyrics:
        """Create lyrics with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.create().

        Parameters
        ----------
        data : Union[Dict[str, Any], BaseModel]
            Create data as dictionary or Pydantic model

        Returns
        -------
        Lyrics
            Created lyrics
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump()
        else:
            data_dict = data
        return super().create(self.model_class, data_dict)

    def get_by_song_id(self, song_id: UUID) -> List[Lyrics]:
        """Get all lyrics for a specific song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        List[Lyrics]
            All lyrics versions for the song, ordered by created_at descending
        """
        query = self.db.query(Lyrics).filter(
            Lyrics.song_id == song_id,
            Lyrics.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(Lyrics)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(Lyrics.created_at.desc()).all()

    def get_latest_by_song_id(self, song_id: UUID) -> Optional[Lyrics]:
        """Get the most recent lyrics for a song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        Optional[Lyrics]
            The latest lyrics if found and accessible, None otherwise
        """
        query = self.db.query(Lyrics).filter(
            Lyrics.song_id == song_id,
            Lyrics.deleted_at.is_(None)
        ).order_by(Lyrics.created_at.desc())

        # Apply row-level security
        guard = self.get_unified_guard(Lyrics)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def get_with_song(self, lyrics_id: UUID) -> Optional[tuple[Lyrics, Optional[Song]]]:
        """Get lyrics with eagerly loaded song.

        Parameters
        ----------
        lyrics_id : UUID
            The lyrics ID to retrieve

        Returns
        -------
        Optional[tuple[Lyrics, Optional[Song]]]
            Tuple of (lyrics, song) if found and accessible, None otherwise
        """
        query = self.db.query(Lyrics).filter(
            Lyrics.id == lyrics_id,
            Lyrics.deleted_at.is_(None)
        ).options(
            joinedload(Lyrics.song)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Lyrics)
        if guard:
            query = guard.filter_query(query)

        lyrics = query.first()
        if lyrics is None:
            return None

        return (lyrics, lyrics.song)

    def search_by_rhyme_scheme(self, rhyme_scheme: str) -> List[Lyrics]:
        """Search lyrics by rhyme scheme pattern.

        Parameters
        ----------
        rhyme_scheme : str
            The rhyme scheme to search for (e.g., 'AABB', 'ABAB')

        Returns
        -------
        List[Lyrics]
            Lyrics matching the rhyme scheme
        """
        query = self.db.query(Lyrics).filter(
            Lyrics.rhyme_scheme == rhyme_scheme,
            Lyrics.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Lyrics)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_reading_level(
        self,
        min_level: Optional[int] = None,
        max_level: Optional[int] = None
    ) -> List[Lyrics]:
        """Get lyrics by reading level (Flesch-Kincaid).

        Parameters
        ----------
        min_level : Optional[int]
            Minimum reading level
        max_level : Optional[int]
            Maximum reading level

        Returns
        -------
        List[Lyrics]
            Lyrics within the specified reading level range
        """
        query = self.db.query(Lyrics).filter(
            Lyrics.deleted_at.is_(None)
        )

        if min_level is not None:
            query = query.filter(Lyrics.reading_level >= min_level)
        if max_level is not None:
            query = query.filter(Lyrics.reading_level <= max_level)

        # Apply row-level security
        guard = self.get_unified_guard(Lyrics)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_explicit_lyrics(self) -> List[Lyrics]:
        """Get all lyrics marked as explicit.

        Returns
        -------
        List[Lyrics]
            Lyrics with explicit_allowed=True
        """
        query = self.db.query(Lyrics).filter(
            Lyrics.explicit_allowed == True,
            Lyrics.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Lyrics)
        if guard:
            query = guard.filter_query(query)

        return query.all()
