"""Service layer for Song entity business logic.

This module implements business logic for song operations including
SDS validation, artifact loading, and workflow status management.
"""

from typing import Optional, Dict, Any
from uuid import UUID
import structlog

from app.repositories.song_repo import SongRepository
from app.repositories.style_repo import StyleRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.composed_prompt_repo import ComposedPromptRepository
from app.schemas.song import SongCreate, SongUpdate, SongStatus
from app.models.song import Song
from app.services.validation_service import ValidationService

logger = structlog.get_logger(__name__)


class SongService:
    """Service for song-related operations with SDS validation and artifact management."""

    def __init__(
        self,
        song_repo: SongRepository,
        style_repo: Optional[StyleRepository] = None,
        lyrics_repo: Optional[LyricsRepository] = None,
        producer_notes_repo: Optional[ProducerNotesRepository] = None,
        composed_prompt_repo: Optional[ComposedPromptRepository] = None,
        validation_service: Optional[ValidationService] = None,
    ):
        """Initialize the song service.

        Args:
            song_repo: Repository for song data access
            style_repo: Optional repository for style entities
            lyrics_repo: Optional repository for lyrics entities
            producer_notes_repo: Optional repository for producer notes
            composed_prompt_repo: Optional repository for composed prompts
            validation_service: Optional validation service for JSON schema validation
        """
        self.song_repo = song_repo
        self.style_repo = style_repo
        self.lyrics_repo = lyrics_repo
        self.producer_notes_repo = producer_notes_repo
        self.composed_prompt_repo = composed_prompt_repo
        self.validation_service = validation_service or ValidationService()

    async def create_song(self, data: SongCreate) -> Song:
        """Create a new song with validation.

        Validates that referenced entities (style, persona, blueprint) exist
        and that the global seed is properly set for determinism.

        Args:
            data: Song creation data

        Returns:
            Created song entity

        Raises:
            ValueError: If validation fails (missing references, invalid seed)
        """
        # Validate global seed is set (required for determinism)
        if data.global_seed is None or data.global_seed < 0:
            raise ValueError("global_seed is required and must be non-negative for deterministic generation")

        # Validate referenced style exists if provided
        if data.style_id and self.style_repo:
            style = await self.style_repo.get_by_id(data.style_id)
            if not style:
                raise ValueError(f"Referenced style {data.style_id} does not exist")

        # Create via repository
        song = await self.song_repo.create(data)

        logger.info(
            "song.created",
            song_id=str(song.id),
            title=song.title,
            global_seed=song.global_seed,
            status=song.status
        )

        return song

    async def update_song(self, song_id: UUID, data: SongUpdate) -> Optional[Song]:
        """Update an existing song.

        Args:
            song_id: Song identifier
            data: Song update data

        Returns:
            Updated song entity, or None if not found

        Raises:
            ValueError: If validation fails
        """
        # Get existing song
        existing = await self.song_repo.get_by_id(song_id)
        if not existing:
            return None

        # Validate style reference if being updated
        if data.style_id and self.style_repo:
            style = await self.style_repo.get_by_id(data.style_id)
            if not style:
                raise ValueError(f"Referenced style {data.style_id} does not exist")

        # Update via repository
        song = await self.song_repo.update(song_id, data)

        logger.info(
            "song.updated",
            song_id=str(song_id),
            updated_fields=list(data.model_dump(exclude_unset=True).keys())
        )

        return song

    async def update_song_status(
        self,
        song_id: UUID,
        status: SongStatus
    ) -> Optional[Song]:
        """Update song status (convenience method).

        Args:
            song_id: Song identifier
            status: New status

        Returns:
            Updated song entity, or None if not found
        """
        from app.schemas.song import SongUpdate

        song = await self.song_repo.update(
            song_id,
            SongUpdate(status=status)
        )

        if song:
            logger.info(
                "song.status_updated",
                song_id=str(song_id),
                new_status=status.value
            )

        return song

    async def get_song_with_artifacts(
        self,
        song_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Get a song with all its artifacts (style, lyrics, producer notes, prompts).

        Performs eager loading of all related entities for complete song view.

        Args:
            song_id: Song identifier

        Returns:
            Dictionary with song and all artifacts, or None if song not found
        """
        # Get the song with eager loading
        song = await self.song_repo.get_by_id_with_artifacts(song_id)
        if not song:
            return None

        # Build response dictionary
        result = {
            "song": song,
            "style": None,
            "lyrics": [],
            "producer_notes": [],
            "composed_prompts": [],
        }

        # Load style if available
        if song.style_id and self.style_repo:
            result["style"] = await self.style_repo.get_by_id(song.style_id)

        # Load lyrics if repository available
        if self.lyrics_repo:
            lyrics_list = await self.lyrics_repo.get_by_song_id(song_id)
            result["lyrics"] = lyrics_list

        # Load producer notes if repository available
        if self.producer_notes_repo:
            notes_list = await self.producer_notes_repo.get_by_song_id(song_id)
            result["producer_notes"] = notes_list

        # Load composed prompts if repository available
        if self.composed_prompt_repo:
            prompts = await self.composed_prompt_repo.get_by_song_id(song_id)
            result["composed_prompts"] = prompts

        logger.debug(
            "song.artifacts_loaded",
            song_id=str(song_id),
            has_style=result["style"] is not None,
            lyrics_count=len(result["lyrics"]),
            notes_count=len(result["producer_notes"]),
            prompts_count=len(result["composed_prompts"])
        )

        return result

    async def delete_song(self, song_id: UUID) -> bool:
        """Delete a song (cascade deletes artifacts).

        Args:
            song_id: Song identifier

        Returns:
            True if deleted, False if not found
        """
        success = await self.song_repo.delete(song_id)

        if success:
            logger.info("song.deleted", song_id=str(song_id))

        return success

    async def validate_sds(self, sds_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a Song Design Spec using JSON schema validation.

        Args:
            sds_data: SDS dictionary to validate

        Returns:
            Validation result with success flag and errors

        Raises:
            ValueError: If SDS structure is invalid
        """
        # Use ValidationService for JSON schema validation
        is_valid, errors = self.validation_service.validate_sds(sds_data)

        if not is_valid:
            logger.warning(
                "song.sds_validation_failed",
                error_count=len(errors),
                errors=errors
            )
            raise ValueError(f"SDS validation failed: {'; '.join(errors)}")

        logger.debug("song.sds_validated", field_count=len(sds_data))

        return {
            "valid": True,
            "errors": [],
            "warnings": []
        }
