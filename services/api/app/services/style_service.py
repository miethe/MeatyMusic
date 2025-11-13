"""Service layer for Style entity business logic.

This module implements business logic for style operations including
tag conflict validation, BPM range checks, and blueprint integration.
"""

from typing import List, Optional
from uuid import UUID
import structlog

from app.repositories.style_repo import StyleRepository
from app.repositories.blueprint_repo import BlueprintRepository
from app.schemas.style import StyleCreate, StyleUpdate, StyleResponse
from app.models.style import Style

logger = structlog.get_logger(__name__)


class StyleService:
    """Service for style-related operations with business logic validation."""

    def __init__(
        self,
        style_repo: StyleRepository,
        blueprint_repo: Optional[BlueprintRepository] = None
    ):
        """Initialize the style service.

        Args:
            style_repo: Repository for style data access
            blueprint_repo: Optional repository for blueprint validation
        """
        self.style_repo = style_repo
        self.blueprint_repo = blueprint_repo

    async def create_style(self, data: StyleCreate) -> Style:
        """Create a new style with validation.

        Performs tag conflict validation and energy/tempo coherence checks
        before creating the style entity.

        Args:
            data: Style creation data

        Returns:
            Created style entity

        Raises:
            ValueError: If validation fails (tag conflicts, BPM/energy mismatch)
        """
        # Validate tag conflicts
        if data.tags_positive:
            self._validate_tag_conflicts(data.tags_positive, data.blueprint_id)

        # Validate energy/tempo coherence
        if data.energy_level and data.bpm_min:
            self._validate_energy_tempo_coherence(data.energy_level, data.bpm_min, data.bpm_max)

        # Create via repository
        style = await self.style_repo.create(data)

        logger.info(
            "style.created",
            style_id=str(style.id),
            genre=style.genre,
            bpm_range=f"{style.bpm_min}-{style.bpm_max}" if style.bpm_min else "unspecified"
        )

        return style

    async def update_style(self, style_id: UUID, data: StyleUpdate) -> Optional[Style]:
        """Update an existing style with validation.

        Args:
            style_id: Style identifier
            data: Style update data

        Returns:
            Updated style entity, or None if not found

        Raises:
            ValueError: If validation fails
        """
        # Get existing style
        existing = await self.style_repo.get_by_id(style_id)
        if not existing:
            return None

        # Validate tag conflicts if tags are being updated
        tags_to_check = data.tags_positive if data.tags_positive is not None else existing.tags_positive
        blueprint_id = data.blueprint_id if data.blueprint_id is not None else existing.blueprint_id

        if tags_to_check:
            self._validate_tag_conflicts(tags_to_check, blueprint_id)

        # Validate energy/tempo coherence if either is being updated
        energy = data.energy_level if data.energy_level is not None else existing.energy_level
        bpm_min = data.bpm_min if data.bpm_min is not None else existing.bpm_min
        bpm_max = data.bpm_max if data.bpm_max is not None else existing.bpm_max

        if energy and bpm_min:
            self._validate_energy_tempo_coherence(energy, bpm_min, bpm_max)

        # Update via repository
        style = await self.style_repo.update(style_id, data)

        logger.info(
            "style.updated",
            style_id=str(style_id),
            updated_fields=list(data.model_dump(exclude_unset=True).keys())
        )

        return style

    async def delete_style(self, style_id: UUID) -> bool:
        """Delete a style.

        Args:
            style_id: Style identifier

        Returns:
            True if deleted, False if not found
        """
        success = await self.style_repo.delete(style_id)

        if success:
            logger.info("style.deleted", style_id=str(style_id))

        return success

    async def get_by_genre(self, genre: str) -> List[Style]:
        """Get all styles for a specific genre.

        Args:
            genre: Genre name

        Returns:
            List of style entities
        """
        return await self.style_repo.get_by_genre(genre)

    def _validate_tag_conflicts(
        self,
        tags: List[str],
        blueprint_id: Optional[UUID]
    ) -> None:
        """Validate that tags don't conflict with each other.

        Uses blueprint conflict matrix if available, otherwise performs
        basic conflict detection (e.g., conflicting eras, conflicting energy).

        Args:
            tags: List of positive tags
            blueprint_id: Optional blueprint for conflict matrix lookup

        Raises:
            ValueError: If conflicting tags are detected
        """
        # TODO: Load blueprint conflict matrix if blueprint_id is provided
        # For now, implement basic conflict detection

        # Check for multiple era tags (only one era allowed)
        era_tags = [tag for tag in tags if tag.startswith("Era:")]
        if len(era_tags) > 1:
            raise ValueError(
                f"Conflicting era tags detected: {era_tags}. "
                "Only one era tag is allowed per style."
            )

        # Check for conflicting energy tags
        energy_conflicts = {
            "whisper": ["anthemic", "high-energy", "aggressive"],
            "anthemic": ["whisper", "intimate", "low-energy"],
            "intimate": ["anthemic", "stadium", "epic"],
        }

        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower in energy_conflicts:
                conflicting = energy_conflicts[tag_lower]
                found_conflicts = [t for t in tags if any(c in t.lower() for c in conflicting)]
                if found_conflicts:
                    raise ValueError(
                        f"Tag '{tag}' conflicts with: {found_conflicts}. "
                        "Remove conflicting tags before saving."
                    )

        logger.debug("style.tags_validated", tag_count=len(tags))

    def _validate_energy_tempo_coherence(
        self,
        energy_level: int,
        bpm_min: Optional[int],
        bpm_max: Optional[int]
    ) -> None:
        """Validate that energy level matches BPM range.

        High energy songs should not have very slow tempos and vice versa.

        Args:
            energy_level: Energy level (1-10)
            bpm_min: Minimum BPM
            bpm_max: Maximum BPM (optional)

        Raises:
            ValueError: If energy and tempo are incoherent
        """
        if not bpm_min:
            return

        avg_bpm = bpm_max if bpm_max else bpm_min

        # High energy (8-10) with slow tempo (< 90 BPM)
        if energy_level >= 8 and avg_bpm < 90:
            raise ValueError(
                f"High energy level ({energy_level}) conflicts with slow tempo ({avg_bpm} BPM). "
                "Consider increasing BPM or reducing energy level."
            )

        # Low energy (1-3) with fast tempo (> 140 BPM)
        if energy_level <= 3 and avg_bpm > 140:
            raise ValueError(
                f"Low energy level ({energy_level}) conflicts with fast tempo ({avg_bpm} BPM). "
                "Consider reducing BPM or increasing energy level."
            )

        logger.debug(
            "style.energy_tempo_validated",
            energy=energy_level,
            bpm=avg_bpm
        )
