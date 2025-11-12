"""Composed prompt repository with RLS enforcement and song association queries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.composed_prompt import ComposedPrompt
from app.models.song import Song
from .base import BaseRepository


@dataclass
class ComposedPromptRepository(BaseRepository[ComposedPrompt]):
    """Data access methods for composed prompts with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    def get_by_song_id(self, song_id: UUID) -> List[ComposedPrompt]:
        """Get all composed prompts for a specific song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        List[ComposedPrompt]
            All composed prompts for the song, ordered by created_at descending
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.song_id == song_id,
            ComposedPrompt.deleted_at.is_(None)
        )

        # Apply row-level security using UnifiedRowGuard
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(ComposedPrompt.created_at.desc()).all()

    def get_latest_by_song_id(self, song_id: UUID) -> Optional[ComposedPrompt]:
        """Get the most recent composed prompt for a song.

        Parameters
        ----------
        song_id : UUID
            The song ID to filter by

        Returns
        -------
        Optional[ComposedPrompt]
            The latest composed prompt if found and accessible, None otherwise
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.song_id == song_id,
            ComposedPrompt.deleted_at.is_(None)
        ).order_by(ComposedPrompt.created_at.desc())

        # Apply row-level security
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def get_with_song(self, prompt_id: UUID) -> Optional[tuple[ComposedPrompt, Optional[Song]]]:
        """Get composed prompt with eagerly loaded song.

        Parameters
        ----------
        prompt_id : UUID
            The composed prompt ID to retrieve

        Returns
        -------
        Optional[tuple[ComposedPrompt, Optional[Song]]]
            Tuple of (prompt, song) if found and accessible, None otherwise
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.id == prompt_id,
            ComposedPrompt.deleted_at.is_(None)
        ).options(
            joinedload(ComposedPrompt.song)
        )

        # Apply row-level security
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        prompt = query.first()
        if prompt is None:
            return None

        return (prompt, prompt.song)

    def get_by_validation_status(self, passed: bool) -> List[ComposedPrompt]:
        """Get composed prompts by validation status.

        Parameters
        ----------
        passed : bool
            True for prompts that passed validation, False for failed

        Returns
        -------
        List[ComposedPrompt]
            Composed prompts with matching validation status
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.validation_passed == passed,
            ComposedPrompt.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        return query.order_by(ComposedPrompt.created_at.desc()).all()

    def get_by_character_length(
        self,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None
    ) -> List[ComposedPrompt]:
        """Get composed prompts by character length range.

        Parameters
        ----------
        min_length : Optional[int]
            Minimum character length
        max_length : Optional[int]
            Maximum character length

        Returns
        -------
        List[ComposedPrompt]
            Composed prompts within the specified length range
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.deleted_at.is_(None)
        )

        if min_length is not None:
            query = query.filter(ComposedPrompt.character_length >= min_length)
        if max_length is not None:
            query = query.filter(ComposedPrompt.character_length <= max_length)

        # Apply row-level security
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_failed_validations(self, limit: int = 10) -> List[ComposedPrompt]:
        """Get recent composed prompts that failed validation.

        Parameters
        ----------
        limit : int
            Maximum number of prompts to return (default: 10)

        Returns
        -------
        List[ComposedPrompt]
            Recent failed prompts, ordered by created_at descending
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.validation_passed == False,
            ComposedPrompt.deleted_at.is_(None)
        ).order_by(ComposedPrompt.created_at.desc()).limit(limit)

        # Apply row-level security
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def search_by_section_tags(self, section_tags: List[str]) -> List[ComposedPrompt]:
        """Search composed prompts by section tags.

        Uses JSONB contains operator to find prompts with specific section tags.

        Parameters
        ----------
        section_tags : List[str]
            Tags to search for in section_tags JSONB

        Returns
        -------
        List[ComposedPrompt]
            Composed prompts containing any of the specified section tags
        """
        query = self.db.query(ComposedPrompt).filter(
            ComposedPrompt.deleted_at.is_(None)
        )

        # Search in JSONB section_tags
        for tag in section_tags:
            query = query.filter(
                ComposedPrompt.section_tags.op('?')(tag)
            )

        # Apply row-level security
        guard = self.get_unified_guard(ComposedPrompt)
        if guard:
            query = guard.filter_query(query)

        return query.all()
