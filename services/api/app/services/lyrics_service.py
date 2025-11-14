"""Service layer for Lyrics entity business logic.

This module implements business logic, validation, and citation management for
lyrics entities in the MeatyMusic AMCS (Agentic Music Creation System).

Key responsibilities:
- CRUD operations with validation
- Section structure validation (must contain at least one Chorus)
- Rhyme scheme validation
- Explicit content filtering
- Reading level validation
- Citation management with deterministic hash computation
- Source weight normalization for retrieval-augmented generation

All citation operations ensure determinism - same inputs produce same outputs
for reproducibility across workflow runs.
"""

from __future__ import annotations

from typing import Optional, List, Dict, Any
from uuid import UUID
import structlog

from sqlalchemy.orm import Session

from app.services.base_service import BaseService
from app.repositories.lyrics_repo import LyricsRepository
from app.schemas.lyrics import LyricsCreate, LyricsUpdate, LyricsResponse
from app.models.lyrics import Lyrics
from app.errors import BadRequestError, NotFoundError
from .common import (
    validate_section_order,
    validate_rhyme_scheme,
    check_explicit_content,
    compute_citation_hash,
    normalize_weights,
)

logger = structlog.get_logger(__name__)


class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
    """Service for lyrics-related operations with business logic validation.

    Provides CRUD operations with comprehensive validation:
    - Section structure (required: at least one Chorus)
    - Rhyme scheme format validation
    - Explicit content filtering with profanity detection
    - Reading level validation (0-100 range)
    - Citation tracking with deterministic hashing

    All operations use transaction management from BaseService for atomicity
    and proper rollback on errors.
    """

    # Valid reading levels (case-insensitive)
    VALID_READING_LEVELS = ["elementary", "middle", "high_school", "college"]

    def __init__(self, session: Session, repo: LyricsRepository):
        """Initialize the lyrics service.

        Args:
            session: SQLAlchemy synchronous session for database operations
            repo: LyricsRepository for data access
        """
        super().__init__(session, LyricsResponse)
        self.repo = repo

    # =========================================================================
    # CRUD OPERATIONS (N6-5)
    # =========================================================================

    async def create_lyrics(self, data: LyricsCreate) -> LyricsResponse:
        """Create new lyrics with comprehensive validation.

        Validates:
        - Section order contains at least one "Chorus"
        - Rhyme scheme format (if provided)
        - Explicit content (if explicit_allowed=False)
        - Reading level is valid

        Args:
            data: Lyrics creation data with all required fields

        Returns:
            LyricsResponse with created lyrics including database fields

        Raises:
            BadRequestError: If validation fails (section order, rhyme scheme,
                           explicit content, reading level)

        Example:
            >>> data = LyricsCreate(
            ...     song_id=song_id,
            ...     sections=[{"type": "Chorus", "lines": [...]}],
            ...     section_order=["Verse", "Chorus", "Verse", "Chorus"],
            ...     rhyme_scheme="AABB",
            ...     explicit_allowed=False
            ... )
            >>> lyrics = await service.create_lyrics(data)
        """
        # 1. Validate section order (required: at least one Chorus)
        is_valid, error_msg = validate_section_order(
            data.section_order,
            required_sections=["Chorus"]
        )
        if not is_valid:
            logger.warning(
                "lyrics.validation_failed.section_order",
                song_id=str(data.song_id),
                error=error_msg
            )
            raise BadRequestError(f"Invalid section order: {error_msg}")

        # 2. Validate rhyme scheme format if provided
        if data.rhyme_scheme and not validate_rhyme_scheme(data.rhyme_scheme):
            logger.warning(
                "lyrics.validation_failed.rhyme_scheme",
                song_id=str(data.song_id),
                rhyme_scheme=data.rhyme_scheme
            )
            raise BadRequestError(
                f"Invalid rhyme scheme format: {data.rhyme_scheme}. "
                f"Valid formats: AABB, ABAB, ABCB (uppercase letters only, contiguous)"
            )

        # 3. Check explicit content if not allowed
        if not data.explicit_allowed:
            # Extract text from sections for profanity check
            full_text = self._extract_text_from_sections(data.sections)
            is_clean, violations = await check_explicit_content(full_text, explicit_allowed=False)

            if not is_clean:
                logger.warning(
                    "lyrics.validation_failed.explicit_content",
                    song_id=str(data.song_id),
                    violations=violations
                )
                raise BadRequestError(
                    f"Explicit content detected: {', '.join(violations)}. "
                    f"Set explicit_allowed=True to allow explicit content."
                )

        # 4. Validate reading level if provided
        if data.reading_level is not None:
            if data.reading_level < 0 or data.reading_level > 100:
                logger.warning(
                    "lyrics.validation_failed.reading_level",
                    song_id=str(data.song_id),
                    reading_level=data.reading_level
                )
                raise BadRequestError(
                    f"Invalid reading level: {data.reading_level}. "
                    f"Must be between 0 and 100."
                )

        # 5. Process citations if provided
        processed_data = data.model_dump()
        if data.source_citations:
            # Normalize weights (ensure sum ≤ 1.0)
            normalized_citations = self.normalize_source_weights(data.source_citations)

            # Compute hashes for deterministic tracking
            citations_with_hashes = self.parse_citations_with_hashes(normalized_citations)

            processed_data["source_citations"] = citations_with_hashes

            logger.debug(
                "lyrics.citations_processed",
                song_id=str(data.song_id),
                citation_count=len(citations_with_hashes)
            )

        # 6. Create in transaction
        with self.transaction():
            # Convert processed_data back to LyricsCreate for type safety
            # (we've modified source_citations with hashes)
            entity = self.repo.create(LyricsCreate(**processed_data))

            logger.info(
                "lyrics.created",
                lyrics_id=str(entity.id),
                song_id=str(entity.song_id),
                section_count=len(data.section_order),
                has_citations=bool(data.source_citations)
            )

            return self.to_response(entity)

    async def get_lyrics(self, lyrics_id: UUID) -> Optional[LyricsResponse]:
        """Get lyrics by ID.

        Args:
            lyrics_id: UUID of the lyrics to retrieve

        Returns:
            LyricsResponse if found, None otherwise

        Example:
            >>> lyrics = await service.get_lyrics(lyrics_id)
            >>> if lyrics:
            ...     print(f"Found: {lyrics.id}")
            ... else:
            ...     print("Not found")
        """
        lyrics = self.repo.get_by_id(lyrics_id)
        return self.to_response(lyrics)

    async def update_lyrics(
        self,
        lyrics_id: UUID,
        data: LyricsUpdate
    ) -> Optional[LyricsResponse]:
        """Update lyrics with validation.

        Applies same validation rules as create_lyrics for updated fields.

        Args:
            lyrics_id: UUID of the lyrics to update
            data: Update data (all fields optional)

        Returns:
            LyricsResponse with updated lyrics if found, None otherwise

        Raises:
            BadRequestError: If validation fails on updated fields

        Example:
            >>> update_data = LyricsUpdate(
            ...     section_order=["Verse", "Chorus", "Bridge", "Chorus"],
            ...     rhyme_scheme="ABAB"
            ... )
            >>> lyrics = await service.update_lyrics(lyrics_id, update_data)
        """
        # 1. Validate section order if provided
        if data.section_order is not None:
            is_valid, error_msg = validate_section_order(
                data.section_order,
                required_sections=["Chorus"]
            )
            if not is_valid:
                logger.warning(
                    "lyrics.update_validation_failed.section_order",
                    lyrics_id=str(lyrics_id),
                    error=error_msg
                )
                raise BadRequestError(f"Invalid section order: {error_msg}")

        # 2. Validate rhyme scheme if provided
        if data.rhyme_scheme is not None and not validate_rhyme_scheme(data.rhyme_scheme):
            logger.warning(
                "lyrics.update_validation_failed.rhyme_scheme",
                lyrics_id=str(lyrics_id),
                rhyme_scheme=data.rhyme_scheme
            )
            raise BadRequestError(
                f"Invalid rhyme scheme format: {data.rhyme_scheme}"
            )

        # 3. Check explicit content if sections or explicit_allowed changed
        if data.sections is not None and data.explicit_allowed is False:
            full_text = self._extract_text_from_sections(data.sections)
            is_clean, violations = await check_explicit_content(full_text, explicit_allowed=False)

            if not is_clean:
                logger.warning(
                    "lyrics.update_validation_failed.explicit_content",
                    lyrics_id=str(lyrics_id),
                    violations=violations
                )
                raise BadRequestError(
                    f"Explicit content detected: {', '.join(violations)}"
                )

        # 4. Validate reading level if provided
        if data.reading_level is not None:
            if data.reading_level < 0 or data.reading_level > 100:
                logger.warning(
                    "lyrics.update_validation_failed.reading_level",
                    lyrics_id=str(lyrics_id),
                    reading_level=data.reading_level
                )
                raise BadRequestError(
                    f"Invalid reading level: {data.reading_level}"
                )

        # 5. Process citations if provided
        processed_data = data.model_dump(exclude_unset=True)
        if data.source_citations is not None:
            # Normalize weights
            normalized_citations = self.normalize_source_weights(data.source_citations)

            # Compute hashes
            citations_with_hashes = self.parse_citations_with_hashes(normalized_citations)

            processed_data["source_citations"] = citations_with_hashes

        # 6. Update in transaction
        with self.transaction():
            # Convert processed_data back to LyricsUpdate
            entity = self.repo.update(lyrics_id, LyricsUpdate(**processed_data))

            if not entity:
                logger.debug("lyrics.update_not_found", lyrics_id=str(lyrics_id))
                return None

            logger.info("lyrics.updated", lyrics_id=str(lyrics_id))
            return self.to_response(entity)

    async def delete_lyrics(self, lyrics_id: UUID) -> bool:
        """Delete lyrics by ID.

        Args:
            lyrics_id: UUID of the lyrics to delete

        Returns:
            True if deleted, False if not found

        Example:
            >>> success = await service.delete_lyrics(lyrics_id)
            >>> if success:
            ...     print("Deleted successfully")
        """
        with self.transaction():
            success = self.repo.delete(lyrics_id)

            if success:
                logger.info("lyrics.deleted", lyrics_id=str(lyrics_id))
            else:
                logger.debug("lyrics.delete_not_found", lyrics_id=str(lyrics_id))

            return success

    async def get_by_song_id(self, song_id: UUID) -> List[LyricsResponse]:
        """Get all lyrics for a specific song.

        Args:
            song_id: UUID of the song

        Returns:
            List of LyricsResponse (ordered by created_at descending)

        Example:
            >>> lyrics_versions = await service.get_by_song_id(song_id)
            >>> for lyrics in lyrics_versions:
            ...     print(f"Version: {lyrics.created_at}")
        """
        lyrics_list = self.repo.get_by_song_id(song_id)
        return self.to_response_list(lyrics_list)

    # =========================================================================
    # CITATION MANAGEMENT (N6-6)
    # =========================================================================

    def parse_citations_with_hashes(
        self,
        citations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute SHA-256 hash for each citation for deterministic tracking.

        Adds a 'citation_hash' field to each citation using compute_citation_hash().
        This enables pinned retrieval for reproducibility - same source + chunk
        will always produce the same hash.

        Args:
            citations: List of citation dicts with source_id and chunk_text

        Returns:
            Citations with added 'citation_hash' field

        Example:
            >>> citations = [
            ...     {"source_id": uuid1, "chunk_text": "Some text", "weight": 0.5},
            ...     {"source_id": uuid2, "chunk_text": "More text", "weight": 0.3}
            ... ]
            >>> with_hashes = service.parse_citations_with_hashes(citations)
            >>> # Each citation now has 'citation_hash' field

        Note:
            Citation hash is CRITICAL for determinism compliance.
            Same source_id + chunk_text = same hash every time.
        """
        citations_with_hashes = []

        for citation in citations:
            # Compute deterministic hash
            source_id = citation.get("source_id")
            chunk_text = citation.get("chunk_text", "")
            timestamp = citation.get("timestamp")

            if not source_id:
                logger.warning(
                    "citation.missing_source_id",
                    citation=citation
                )
                continue

            citation_hash = compute_citation_hash(
                source_id=UUID(source_id) if isinstance(source_id, str) else source_id,
                chunk_text=chunk_text,
                timestamp=timestamp
            )

            # Add hash to citation
            citation_with_hash = {
                **citation,
                "citation_hash": citation_hash
            }

            citations_with_hashes.append(citation_with_hash)

            logger.debug(
                "citation.hash_computed",
                source_id=str(source_id),
                hash_prefix=citation_hash[:8]
            )

        logger.info(
            "citations.parsed_with_hashes",
            citation_count=len(citations_with_hashes)
        )

        return citations_with_hashes

    def normalize_source_weights(
        self,
        citations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Normalize source citation weights to sum ≤ 1.0.

        Uses normalize_weights() from common.py to ensure weights comply with
        retrieval constraints while preserving relative proportions.

        Args:
            citations: List of citation dicts with 'weight' field

        Returns:
            Citations with normalized weights

        Example:
            >>> citations = [
            ...     {"source_id": uuid1, "weight": 0.8},
            ...     {"source_id": uuid2, "weight": 0.6}
            ... ]
            >>> normalized = service.normalize_source_weights(citations)
            >>> # Weights now sum to 1.0: [0.571, 0.429]

        Note:
            If weights already sum to ≤1.0, they are returned unchanged.
        """
        # Extract weights by source_id
        weights_dict = {}
        for i, citation in enumerate(citations):
            source_id = citation.get("source_id")
            weight = citation.get("weight", 0.0)

            if source_id:
                # Use source_id as key, or index if source_id missing
                key = str(source_id) if source_id else f"citation_{i}"
                weights_dict[key] = weight

        # Normalize weights
        normalized_weights = normalize_weights(weights_dict, max_sum=1.0)

        # Apply normalized weights back to citations
        normalized_citations = []
        for i, citation in enumerate(citations):
            source_id = citation.get("source_id")
            key = str(source_id) if source_id else f"citation_{i}"

            normalized_citation = {
                **citation,
                "weight": normalized_weights.get(key, 0.0)
            }
            normalized_citations.append(normalized_citation)

        logger.debug(
            "citations.weights_normalized",
            original_sum=sum(weights_dict.values()),
            normalized_sum=sum(normalized_weights.values()),
            citation_count=len(normalized_citations)
        )

        return normalized_citations

    def validate_citations(self, citations: List[Dict[str, Any]]) -> bool:
        """Validate citation structure and constraints.

        Checks:
        - Required fields present (source_id)
        - No duplicate source_ids
        - Weights are positive

        Args:
            citations: List of citation dicts to validate

        Returns:
            True if valid, raises BadRequestError if invalid

        Raises:
            BadRequestError: If citations are invalid

        Example:
            >>> citations = [
            ...     {"source_id": uuid1, "chunk_text": "text", "weight": 0.5},
            ...     {"source_id": uuid2, "chunk_text": "text", "weight": 0.5}
            ... ]
            >>> is_valid = service.validate_citations(citations)
        """
        if not citations:
            return True  # Empty citations are valid

        seen_source_ids = set()

        for i, citation in enumerate(citations):
            # Check required field: source_id
            source_id = citation.get("source_id")
            if not source_id:
                logger.warning(
                    "citation.validation_failed.missing_source_id",
                    citation_index=i
                )
                raise BadRequestError(
                    f"Citation at index {i} missing required field: source_id"
                )

            # Check for duplicate source_ids
            source_id_str = str(source_id)
            if source_id_str in seen_source_ids:
                logger.warning(
                    "citation.validation_failed.duplicate_source_id",
                    source_id=source_id_str,
                    citation_index=i
                )
                raise BadRequestError(
                    f"Duplicate source_id found: {source_id_str}"
                )

            seen_source_ids.add(source_id_str)

            # Check weight is positive if provided
            weight = citation.get("weight")
            if weight is not None and weight < 0:
                logger.warning(
                    "citation.validation_failed.negative_weight",
                    source_id=source_id_str,
                    weight=weight
                )
                raise BadRequestError(
                    f"Citation weight must be positive: {weight}"
                )

        logger.debug(
            "citations.validated",
            citation_count=len(citations),
            unique_sources=len(seen_source_ids)
        )

        return True

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _extract_text_from_sections(self, sections: List[Dict[str, Any]]) -> str:
        """Extract full text from sections for profanity checking.

        Args:
            sections: List of section dicts with 'lines' field

        Returns:
            Combined text from all sections

        Example:
            >>> sections = [
            ...     {"type": "Verse", "lines": ["Line 1", "Line 2"]},
            ...     {"type": "Chorus", "lines": ["Hook line"]}
            ... ]
            >>> text = service._extract_text_from_sections(sections)
            >>> # Returns: "Line 1\\nLine 2\\nHook line"
        """
        all_lines = []

        for section in sections:
            lines = section.get("lines", [])
            if isinstance(lines, list):
                all_lines.extend(lines)

        return "\n".join(all_lines)
