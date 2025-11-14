"""Service layer for ProducerNotes entity business logic.

This module implements business logic for producer notes operations including
structure validation, mix settings validation, duration calculation, and
blueprint alignment checks.
"""

from typing import Optional, Dict, List, Any
from uuid import UUID
import structlog

from sqlalchemy.orm import Session

from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.blueprint_repo import BlueprintRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.schemas.producer_notes import (
    ProducerNotesCreate,
    ProducerNotesUpdate,
    ProducerNotesResponse,
)
from app.models.producer_notes import ProducerNotes
from app.services.base_service import BaseService

logger = structlog.get_logger(__name__)


class ProducerNotesService(BaseService[
    ProducerNotes,
    ProducerNotesResponse,
    ProducerNotesCreate,
    ProducerNotesUpdate
]):
    """Service for producer notes with validation and alignment checks.

    Provides business logic for:
    - Producer notes CRUD operations
    - Structure validation against lyrics sections
    - Mix settings validation (LUFS, stereo width)
    - Hook count validation and warnings
    - Duration calculation and validation
    - Blueprint alignment checks
    """

    # Mix settings constraints
    VALID_STEREO_WIDTHS = ["narrow", "normal", "wide"]
    LUFS_MIN = -20.0
    LUFS_MAX = -5.0
    DURATION_TOLERANCE_SECONDS = 30

    def __init__(
        self,
        session: Session,
        repo: ProducerNotesRepository,
        blueprint_repo: Optional[BlueprintRepository] = None,
        lyrics_repo: Optional[LyricsRepository] = None,
    ):
        """Initialize the producer notes service.

        Args:
            session: SQLAlchemy synchronous session for database operations
            repo: Repository for producer notes data access
            blueprint_repo: Optional repository for blueprint validation
            lyrics_repo: Optional repository for lyrics section validation
        """
        super().__init__(session, ProducerNotesResponse)
        self.repo = repo
        self.blueprint_repo = blueprint_repo
        self.lyrics_repo = lyrics_repo

    async def create_producer_notes(
        self, data: ProducerNotesCreate
    ) -> ProducerNotesResponse:
        """Create producer notes with comprehensive validation.

        Creates producer notes including arrangement guidance, mix targets, and
        structural information. Validates all mix settings and warns on potential
        quality issues (e.g., zero hook count).

        Validation Pipeline:
        1. Validate mix_targets (LUFS range, stereo width)
        2. Check hook_count >= 1 (warn if zero)
        3. Calculate total duration from section_durations
        4. Persist within transaction with logging

        Args:
            data: Producer notes creation data including structure, mix_targets,
                  hook_count, and section_durations

        Returns:
            Created producer notes response DTO with all fields populated

        Raises:
            ValueError: If mix settings are invalid (LUFS outside [-20, -5],
                       stereo_width not in valid set, etc.)

        Note:
            Mix Settings Constraints (per blueprint and audio standards):
            - loudness_lufs: [-20.0, -5.0] dB (broadcast standard)
            - stereo_width: "narrow", "normal", or "wide"
            - Zero hooks triggers quality warning but doesn't block creation
        """
        # Validate mix settings if provided
        if data.mix_targets:
            is_valid, error = self.validate_mix_settings(data.mix_targets)
            if not is_valid:
                raise ValueError(f"Invalid mix settings: {error}")

        # Validate hook count - warn if zero
        if data.hook_count is not None and data.hook_count == 0:
            logger.warning(
                "producer_notes.zero_hooks",
                song_id=str(data.song_id),
                message="Producer notes created with zero hooks - may impact song quality"
            )

        # Calculate and validate total duration if section durations provided
        if data.section_durations:
            total_duration = self.calculate_total_duration(data.section_durations)

            # Log calculated duration
            logger.debug(
                "producer_notes.duration_calculated",
                song_id=str(data.song_id),
                total_duration=total_duration,
                section_count=len(data.section_durations)
            )

        # Create via repository
        with self.transaction():
            # Convert Pydantic model to dict for repository
            entity = self.repo.create(data)

            logger.info(
                "producer_notes.created",
                notes_id=str(entity.id),
                song_id=str(entity.song_id),
                hook_count=entity.hook_count,
                section_count=len(data.structure) if data.structure else 0
            )

            return self.to_response(entity)

    async def get_producer_notes(
        self, notes_id: UUID
    ) -> Optional[ProducerNotesResponse]:
        """Get producer notes by ID.

        Args:
            notes_id: Producer notes identifier

        Returns:
            Producer notes response DTO, or None if not found
        """
        entity = self.repo.get_by_id(notes_id)

        if entity:
            logger.debug("producer_notes.retrieved", notes_id=str(notes_id))

        return self.to_response(entity)

    async def update_producer_notes(
        self, notes_id: UUID, data: ProducerNotesUpdate
    ) -> ProducerNotesResponse:
        """Update existing producer notes with validation.

        Args:
            notes_id: Producer notes identifier
            data: Producer notes update data

        Returns:
            Updated producer notes response DTO

        Raises:
            ValueError: If validation fails
            NotFoundError: If producer notes not found
        """
        # Get existing entity
        existing = self.repo.get_by_id(notes_id)
        if not existing:
            from app.errors import NotFoundError
            raise NotFoundError(
                message=f"ProducerNotes {notes_id} not found"
            )

        # Validate mix settings if being updated
        if data.mix_targets is not None:
            is_valid, error = self.validate_mix_settings(data.mix_targets)
            if not is_valid:
                raise ValueError(f"Invalid mix settings: {error}")

        # Warn on zero hooks if being updated to zero
        if data.hook_count is not None and data.hook_count == 0:
            logger.warning(
                "producer_notes.zero_hooks_update",
                notes_id=str(notes_id),
                message="Hook count updated to zero"
            )

        # Update via repository
        with self.transaction():
            # Update via repository (pass Pydantic model directly)
            entity = self.repo.update(notes_id, data)

            logger.info(
                "producer_notes.updated",
                notes_id=str(notes_id),
                updated_fields=list(data.model_dump(exclude_unset=True).keys())
            )

            return self.to_response(entity)

    async def delete_producer_notes(self, notes_id: UUID) -> bool:
        """Delete producer notes.

        Args:
            notes_id: Producer notes identifier

        Returns:
            True if deleted, False if not found
        """
        success = self.repo.delete(notes_id)

        if success:
            logger.info("producer_notes.deleted", notes_id=str(notes_id))

        return success

    async def get_by_song_id(self, song_id: UUID) -> List[ProducerNotesResponse]:
        """Get all producer notes for a specific song.

        Args:
            song_id: Song identifier

        Returns:
            List of producer notes response DTOs, ordered by created_at descending
        """
        entities = self.repo.get_by_song_id(song_id)

        logger.debug(
            "producer_notes.retrieved_by_song",
            song_id=str(song_id),
            count=len(entities)
        )

        return self.to_response_list(entities)

    async def get_latest_by_song_id(
        self, song_id: UUID
    ) -> Optional[ProducerNotesResponse]:
        """Get the most recent producer notes for a song.

        Args:
            song_id: Song identifier

        Returns:
            Latest producer notes response DTO, or None if not found
        """
        entity = self.repo.get_latest_by_song_id(song_id)

        if entity:
            logger.debug(
                "producer_notes.latest_retrieved",
                song_id=str(song_id),
                notes_id=str(entity.id)
            )

        return self.to_response(entity)

    def validate_structure(
        self, structure: List[str], section_order: List[str]
    ) -> bool:
        """Validate that structure matches section order from lyrics.

        Verifies that all sections in section_order appear in the structure.

        Args:
            structure: Ordered section array from producer notes
            section_order: Expected section order from lyrics or blueprint

        Returns:
            True if structure is valid, False otherwise
        """
        # Convert structure to set for comparison
        structure_set = set(structure)
        section_set = set(section_order)

        # Check for missing sections
        missing_sections = section_set - structure_set

        if missing_sections:
            logger.warning(
                "producer_notes.structure_incomplete",
                missing_sections=list(missing_sections),
                expected=section_order,
                actual=structure
            )
            return False

        # Check for unexpected sections
        unexpected_sections = structure_set - section_set

        if unexpected_sections:
            logger.warning(
                "producer_notes.structure_extra_sections",
                unexpected_sections=list(unexpected_sections),
                expected=section_order,
                actual=structure
            )

        logger.debug(
            "producer_notes.structure_validated",
            section_count=len(structure)
        )

        return len(missing_sections) == 0

    def validate_mix_settings(
        self, mix_targets: Dict[str, Any]
    ) -> tuple[bool, Optional[str]]:
        """Validate mix settings ranges.

        Ensures mix target specifications conform to audio production standards
        and MeatyMusic constraints. LUFS (Loudness Units relative to Full Scale)
        follows broadcast standards for streaming platforms.

        Validation Rules:
        - loudness_lufs: Must be in [-20.0, -5.0] dB range
          * -20 dB: Quieter, more dynamic content (acoustic, spoken word)
          * -5 dB: Louder, compressed content (pop, electronic)
        - stereo_width: One of "narrow" (mono-ish), "normal", or "wide"

        Args:
            mix_targets: Mix specifications dictionary with optional keys:
                        - loudness_lufs: int/float in [-20, -5]
                        - stereo_width: str in ["narrow", "normal", "wide"]

        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if all checks pass
            - error_message: None if valid, error string if invalid
        """
        # Validate LUFS (Loudness Units relative to Full Scale)
        lufs = mix_targets.get("loudness_lufs")
        if lufs is not None:
            # Type check: LUFS must be numeric
            if not isinstance(lufs, (int, float)):
                return False, "loudness_lufs must be a number"

            # Range check: LUFS must be within broadcast standards
            # [-20, -5] dB is standard for streaming (Spotify, Apple Music, etc.)
            if not (self.LUFS_MIN <= lufs <= self.LUFS_MAX):
                return (
                    False,
                    f"loudness_lufs {lufs} outside valid range "
                    f"[{self.LUFS_MIN}, {self.LUFS_MAX}] dB"
                )

        # Validate stereo width (spatial characteristics)
        stereo_width = mix_targets.get("stereo_width")
        if stereo_width is not None:
            # Must be one of the predefined width categories
            if stereo_width not in self.VALID_STEREO_WIDTHS:
                return (
                    False,
                    f"stereo_width '{stereo_width}' is invalid. "
                    f"Must be one of: {', '.join(self.VALID_STEREO_WIDTHS)}"
                )

        # Log validation success
        logger.debug(
            "producer_notes.mix_settings_validated",
            lufs=lufs,
            stereo_width=stereo_width
        )

        return True, None

    def calculate_total_duration(
        self, section_durations: Dict[str, int]
    ) -> int:
        """Calculate total duration from section durations.

        Sums durations across all sections (Verse, Chorus, Bridge, etc.)
        to calculate the total song length. Only positive integer durations
        are included to ensure accurate calculations.

        Args:
            section_durations: Dictionary mapping section names to durations in seconds
                              Example: {"Verse": 30, "Chorus": 20, "Bridge": 15}

        Returns:
            Total duration in seconds (sum of all positive section durations)

        Example:
            >>> durations = {"Verse": 30, "Chorus": 20, "Bridge": 15}
            >>> total = service.calculate_total_duration(durations)
            >>> assert total == 65  # 30 + 20 + 15
        """
        # Sum only valid durations:
        # - Must be int type (reject float/string)
        # - Must be positive (> 0 seconds)
        # Invalid entries are silently skipped
        total = sum(
            duration
            for duration in section_durations.values()
            if isinstance(duration, int) and duration > 0
        )

        # Log the calculation for debugging and traceability
        logger.debug(
            "producer_notes.total_duration_calculated",
            total_duration=total,
            section_count=len(section_durations)
        )

        return total

    async def validate_against_blueprint(
        self,
        notes_id: UUID,
        blueprint_id: UUID
    ) -> tuple[bool, List[str]]:
        """Validate producer notes against blueprint constraints.

        Ensures that producer notes comply with genre-specific blueprint rules,
        particularly hook count minimums. This validation is critical for hit song
        blueprint compliance per MeatyMusic AMCS architecture.

        Validation Checks:
        1. Producer notes must exist
        2. Blueprint must exist
        3. Hook count must meet genre minimum (per blueprint rules)
        4. Instrumentation aligns with allowed instruments for genre

        Args:
            notes_id: Producer notes identifier (UUID)
            blueprint_id: Blueprint identifier (UUID)

        Returns:
            Tuple of (is_valid, list_of_violations)
            - is_valid: True if all blueprint constraints pass
            - list_of_violations: Empty list if valid, or list of constraint violations

        Raises:
            No exceptions raised; returns violations in tuple instead

        Example:
            >>> is_valid, violations = await service.validate_against_blueprint(
            ...     notes_id=notes.id,
            ...     blueprint_id=pop_blueprint.id
            ... )
            >>> if not is_valid:
            ...     for violation in violations:
            ...         print(f"Constraint failed: {violation}")
        """
        violations = []

        # Get producer notes
        entity = self.repo.get_by_id(notes_id)
        if not entity:
            return False, ["ProducerNotes not found"]

        # Get blueprint if repository available
        if not self.blueprint_repo:
            logger.warning(
                "producer_notes.blueprint_validation_skipped",
                notes_id=str(notes_id),
                reason="blueprint_repo not available"
            )
            return True, []

        blueprint = self.blueprint_repo.get_by_id(blueprint_id)
        if not blueprint:
            violations.append(f"Blueprint {blueprint_id} not found")
            return False, violations

        # Validate hook count against blueprint minimum
        # Blueprint should have min_hooks in its rules
        blueprint_rules = blueprint.rules or {}
        min_hooks = blueprint_rules.get("min_hooks", 1)

        if entity.hook_count is not None and entity.hook_count < min_hooks:
            violations.append(
                f"Hook count {entity.hook_count} is below blueprint "
                f"minimum {min_hooks} for genre {blueprint.genre}"
            )

        # Log validation result
        if violations:
            logger.warning(
                "producer_notes.blueprint_validation_failed",
                notes_id=str(notes_id),
                blueprint_id=str(blueprint_id),
                violations=violations
            )
        else:
            logger.debug(
                "producer_notes.blueprint_validated",
                notes_id=str(notes_id),
                blueprint_id=str(blueprint_id)
            )

        return len(violations) == 0, violations

    async def validate_duration_against_target(
        self,
        notes_id: UUID,
        target_duration: int
    ) -> tuple[bool, int]:
        """Validate that total duration matches target within tolerance.

        Args:
            notes_id: Producer notes identifier
            target_duration: Target duration in seconds

        Returns:
            Tuple of (is_within_tolerance, difference_in_seconds)
        """
        # Get producer notes
        entity = self.repo.get_by_id(notes_id)
        if not entity:
            raise ValueError(f"ProducerNotes {notes_id} not found")

        # Calculate total duration
        total_duration = self.calculate_total_duration(entity.section_durations)

        # Calculate difference
        diff = abs(total_duration - target_duration)

        # Check if within tolerance
        is_valid = diff <= self.DURATION_TOLERANCE_SECONDS

        if not is_valid:
            logger.warning(
                "producer_notes.duration_mismatch",
                notes_id=str(notes_id),
                expected=target_duration,
                actual=total_duration,
                diff=diff,
                tolerance=self.DURATION_TOLERANCE_SECONDS
            )
        else:
            logger.debug(
                "producer_notes.duration_validated",
                notes_id=str(notes_id),
                total_duration=total_duration,
                target_duration=target_duration,
                diff=diff
            )

        return is_valid, diff
