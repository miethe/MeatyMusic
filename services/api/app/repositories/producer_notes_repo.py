"""Producer notes repository with RLS enforcement and song association queries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.producer_notes import ProducerNotes
from app.models.song import Song
from .base import BaseRepository


@dataclass
class ProducerNotesRepository(BaseRepository[ProducerNotes]):
    """Data access methods for producer notes with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    def get_by_song_id(self, song_id: UUID) -> List[ProducerNotes]:
        """Get all producer notes for a specific song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        List[ProducerNotes]
            All producer notes versions for the song, ordered by created_at descending
        """
        query = self.db.query(ProducerNotes).filter(
            ProducerNotes.song_id == song_id,
            ProducerNotes.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(ProducerNotes)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(ProducerNotes.created_at.desc()).all()

    def get_latest_by_song_id(self, song_id: UUID) -> Optional[ProducerNotes]:
        """Get the most recent producer notes for a song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        Optional[ProducerNotes]
            The latest producer notes if found and accessible, None otherwise
        """
        query = self.db.query(ProducerNotes).filter(
            ProducerNotes.song_id == song_id,
            ProducerNotes.deleted_at.is_(None)
        ).order_by(ProducerNotes.created_at.desc())

        # Apply row-level security
        guard = self.get_unified_guard(ProducerNotes)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def get_with_song(self, notes_id: UUID) -> Optional[tuple[ProducerNotes, Optional[Song]]]:
        """Get producer notes with eagerly loaded song.

        Parameters
        ----------
        notes_id : UUID
            The producer notes ID to retrieve

        Returns
        -------
        Optional[tuple[ProducerNotes, Optional[Song]]]
            Tuple of (notes, song) if found and accessible, None otherwise
        """
        query = self.db.query(ProducerNotes).filter(
            ProducerNotes.id == notes_id,
            ProducerNotes.deleted_at.is_(None)
        ).options(
            joinedload(ProducerNotes.song)
        )

        # Apply row-level security
        guard = self.get_unified_guard(ProducerNotes)
        if guard:
            query = guard.filter_query(query)

        notes = query.first()
        if notes is None:
            return None

        return (notes, notes.song)

    def get_by_hook_count(
        self,
        min_hooks: Optional[int] = None,
        max_hooks: Optional[int] = None
    ) -> List[ProducerNotes]:
        """Get producer notes by hook count range.

        Parameters
        ----------
        min_hooks : Optional[int]
            Minimum number of hooks
        max_hooks : Optional[int]
            Maximum number of hooks

        Returns
        -------
        List[ProducerNotes]
            Producer notes within the specified hook count range
        """
        query = self.db.query(ProducerNotes).filter(
            ProducerNotes.deleted_at.is_(None)
        )

        if min_hooks is not None:
            query = query.filter(ProducerNotes.hook_count >= min_hooks)
        if max_hooks is not None:
            query = query.filter(ProducerNotes.hook_count <= max_hooks)

        # Apply row-level security
        guard = self.get_unified_guard(ProducerNotes)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def search_by_structure_pattern(self, pattern: str) -> List[ProducerNotes]:
        """Search producer notes by structure pattern.

        Uses JSONB contains operator to find notes with specific section patterns.

        Parameters
        ----------
        pattern : str
            Section type to search for in structure (e.g., 'verse', 'chorus')

        Returns
        -------
        List[ProducerNotes]
            Producer notes containing the pattern in their structure
        """
        query = self.db.query(ProducerNotes).filter(
            ProducerNotes.deleted_at.is_(None)
        )

        # Use JSONB array contains operator
        # structure @> '[{"type": "verse"}]'
        query = query.filter(
            ProducerNotes.structure.op('@>')(f'[{{"type": "{pattern}"}}]')
        )

        # Apply row-level security
        guard = self.get_unified_guard(ProducerNotes)
        if guard:
            query = guard.filter_query(query)

        return query.all()
