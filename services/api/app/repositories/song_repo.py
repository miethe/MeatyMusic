"""Song repository with RLS enforcement and status filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.song import Song
from app.models.style import Style
from app.models.lyrics import Lyrics
from app.models.producer_notes import ProducerNotes
from app.models.persona import Persona
from .base import BaseRepository


@dataclass
class SongRepository(BaseRepository[Song]):
    """Data access methods for songs with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    def get_by_status(self, status: str) -> List[Song]:
        """Get all songs with a specific status.

        Parameters
        ----------
        status : str
            The status to filter by (e.g., 'draft', 'validated', 'rendered')

        Returns
        -------
        List[Song]
            List of songs matching the status, filtered by security context
        """
        query = self.db.query(Song).filter(
            Song.status == status,
            Song.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(Song)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(Song.created_at.desc()).all()

    def get_with_style(self, song_id: UUID) -> Optional[Tuple[Song, Optional[Style]]]:
        """Get song with eagerly loaded style.

        Parameters
        ----------
        song_id : UUID
            The song ID to retrieve

        Returns
        -------
        Optional[Tuple[Song, Optional[Style]]]
            Tuple of (song, style) if found and accessible, None otherwise
        """
        query = self.db.query(Song).filter(
            Song.id == song_id,
            Song.deleted_at.is_(None)
        ).options(
            joinedload(Song.style)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Song)
        if guard:
            query = guard.filter_query(query)

        song = query.first()
        if song is None:
            return None

        return (song, song.style)

    def get_with_all_artifacts(
        self,
        song_id: UUID
    ) -> Optional[Tuple[Song, Optional[Style], Optional[Lyrics], Optional[ProducerNotes], Optional[Persona]]]:
        """Get song with all related artifacts eagerly loaded.

        Parameters
        ----------
        song_id : UUID
            The song ID to retrieve

        Returns
        -------
        Optional[Tuple[Song, Optional[Style], Optional[Lyrics], Optional[ProducerNotes], Optional[Persona]]]
            Tuple of (song, style, lyrics, producer_notes, persona) if found, None otherwise
        """
        query = self.db.query(Song).filter(
            Song.id == song_id,
            Song.deleted_at.is_(None)
        ).options(
            joinedload(Song.style),
            joinedload(Song.persona),
            joinedload(Song.lyrics_artifacts),
            joinedload(Song.producer_notes_artifacts)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Song)
        if guard:
            query = guard.filter_query(query)

        song = query.first()
        if song is None:
            return None

        # Extract artifacts (get latest/first)
        lyrics = song.lyrics_artifacts[0] if song.lyrics_artifacts else None
        producer_notes = song.producer_notes_artifacts[0] if song.producer_notes_artifacts else None

        return (song, song.style, lyrics, producer_notes, song.persona)

    def get_by_global_seed(self, global_seed: int) -> List[Song]:
        """Get songs by global seed (for determinism testing).

        Parameters
        ----------
        global_seed : int
            The global seed value to search for

        Returns
        -------
        List[Song]
            Songs using the specified global seed
        """
        query = self.db.query(Song).filter(
            Song.global_seed == global_seed,
            Song.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Song)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_recent_songs(self, limit: int = 10) -> List[Song]:
        """Get user's most recently created songs.

        Parameters
        ----------
        limit : int
            Maximum number of songs to return (default: 10)

        Returns
        -------
        List[Song]
            Most recent songs, ordered by created_at descending
        """
        query = self.db.query(Song).filter(
            Song.deleted_at.is_(None)
        ).order_by(Song.created_at.desc()).limit(limit)

        # Apply row-level security
        guard = self.get_unified_guard(Song)
        if guard:
            query = guard.filter_query(query)

        return query.all()
