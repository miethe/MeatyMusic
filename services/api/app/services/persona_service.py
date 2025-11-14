"""Service layer for Persona entity business logic.

This module implements business logic for persona operations including
influence normalization, vocal range validation, delivery style conflict
detection, and policy enforcement for public releases.
"""

from typing import List, Optional, Tuple
from uuid import UUID
import structlog

from sqlalchemy.orm import Session

from app.repositories.persona_repo import PersonaRepository
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaResponse
from app.models.persona import Persona
from app.errors import BadRequestError, NotFoundError
from .base_service import BaseService

logger = structlog.get_logger(__name__)


class PersonaService(BaseService[Persona, PersonaResponse, PersonaCreate, PersonaUpdate]):
    """Service for persona-related operations with business logic validation.

    Handles:
    - CRUD operations with validation
    - Influence normalization for public releases
    - Vocal range validation against canonical ranges
    - Delivery style conflict detection
    - Policy enforcement (disallow_named_style_of)
    """

    # Canonical vocal range classifications
    VALID_VOCAL_RANGES = {
        "soprano",
        "mezzo-soprano",
        "alto",
        "tenor",
        "baritone",
        "bass",
        "countertenor",
        # Combined ranges for duos/bands
        "soprano + tenor",
        "mezzo-soprano + baritone",
        "alto + tenor",
        "baritone + mezzo-soprano",
    }

    # Delivery style conflicts (mutually exclusive combinations)
    DELIVERY_CONFLICTS = {
        ("whisper", "belting"),
        ("whisper", "powerful"),
        ("whispered", "belting"),
        ("whispered", "powerful"),
        ("soft", "belting"),
        ("soft", "aggressive"),
        ("intimate", "stadium"),
        ("crooning", "screaming"),
    }

    # Known living artists that should be normalized for public releases
    # In production, this would come from a database or external service
    LIVING_ARTISTS = {
        "beyoncé", "taylor swift", "drake", "ed sheeran", "ariana grande",
        "billie eilish", "the weeknd", "bruno mars", "adele", "rihanna",
        "kanye west", "jay-z", "kendrick lamar", "post malone", "dua lipa",
        "harry styles", "olivia rodrigo", "bublé", "michael bublé"
    }

    def __init__(self, session: Session, repo: PersonaRepository):
        """Initialize persona service.

        Args:
            session: SQLAlchemy synchronous session for database operations
            repo: PersonaRepository for data access
        """
        super().__init__(session, PersonaResponse)
        self.repo = repo

    async def create_persona(self, data: PersonaCreate) -> PersonaResponse:
        """Create new persona with validation and normalization.

        Performs:
        - Influence normalization if public_release=True
        - Vocal range validation
        - Delivery style conflict detection
        - Policy enforcement

        Args:
            data: Persona creation data

        Returns:
            PersonaResponse: Created persona with all fields

        Raises:
            BadRequestError: If validation fails
        """
        # Validate vocal range if provided
        if data.vocal_range and not self.validate_vocal_range(data.vocal_range):
            raise BadRequestError(
                f"Invalid vocal range: '{data.vocal_range}'. "
                f"Valid ranges: {', '.join(sorted(self.VALID_VOCAL_RANGES))}"
            )

        # Check delivery style conflicts
        if data.delivery:
            is_valid, conflicts = self.validate_delivery_styles(data.delivery)
            if not is_valid:
                logger.warning(
                    "persona.delivery_conflicts",
                    persona_name=data.name,
                    conflicts=[f"{c[0]} <-> {c[1]}" for c in conflicts]
                )
                # Log warning but don't block creation - some conflicts may be intentional

        # Normalize influences if public release and policy requires it
        original_influences = data.influences.copy() if data.influences else []
        policy = data.policy or {}
        public_release = policy.get("public_release", False)
        disallow_named_style = policy.get("disallow_named_style_of", True)

        if public_release and disallow_named_style and data.influences:
            data.influences = self.normalize_influences(data.influences, public_release)
            if data.influences != original_influences:
                logger.info(
                    "persona.influences_normalized",
                    persona_name=data.name,
                    original_count=len(original_influences),
                    normalized_count=len(data.influences)
                )

        # Create via repository with transaction
        with self.transaction():
            entity = self.repo.create(data)
            logger.info(
                "persona.created",
                persona_id=str(entity.id),
                persona_name=entity.name,
                kind=entity.kind,
                public_release=public_release
            )

        return self.to_response(entity)

    async def get_persona(self, persona_id: UUID) -> Optional[PersonaResponse]:
        """Get persona by ID.

        Args:
            persona_id: Persona UUID

        Returns:
            PersonaResponse if found, None otherwise
        """
        entity = self.repo.get_by_id(persona_id)
        return self.to_response(entity)

    async def update_persona(
        self,
        persona_id: UUID,
        data: PersonaUpdate
    ) -> PersonaResponse:
        """Update existing persona with validation.

        Args:
            persona_id: Persona UUID
            data: Update data (partial fields allowed)

        Returns:
            Updated persona

        Raises:
            NotFoundError: If persona doesn't exist
            BadRequestError: If validation fails
        """
        # Get existing persona
        existing = self.repo.get_by_id(persona_id)
        if not existing:
            raise NotFoundError(f"Persona {persona_id} not found")

        # Validate vocal range if being updated
        if data.vocal_range is not None and not self.validate_vocal_range(data.vocal_range):
            raise BadRequestError(
                f"Invalid vocal range: '{data.vocal_range}'. "
                f"Valid ranges: {', '.join(sorted(self.VALID_VOCAL_RANGES))}"
            )

        # Check delivery style conflicts if being updated
        delivery_to_check = data.delivery if data.delivery is not None else existing.delivery
        if delivery_to_check:
            is_valid, conflicts = self.validate_delivery_styles(delivery_to_check)
            if not is_valid:
                logger.warning(
                    "persona.delivery_conflicts",
                    persona_id=str(persona_id),
                    conflicts=[f"{c[0]} <-> {c[1]}" for c in conflicts]
                )

        # Normalize influences if needed
        if data.influences is not None:
            policy = data.policy if data.policy is not None else existing.policy
            public_release = policy.get("public_release", False)
            disallow_named_style = policy.get("disallow_named_style_of", True)

            if public_release and disallow_named_style:
                original = data.influences.copy()
                data.influences = self.normalize_influences(data.influences, public_release)
                if data.influences != original:
                    logger.info(
                        "persona.influences_normalized",
                        persona_id=str(persona_id),
                        normalized_count=len(data.influences)
                    )

        # Update via repository with transaction
        with self.transaction():
            entity = self.repo.update(persona_id, data)
            if entity:
                logger.info(
                    "persona.updated",
                    persona_id=str(persona_id),
                    updated_fields=list(data.model_dump(exclude_unset=True).keys())
                )

        if not entity:
            raise NotFoundError(f"Persona {persona_id} not found")

        return self.to_response(entity)

    async def delete_persona(self, persona_id: UUID) -> bool:
        """Delete persona (soft delete).

        Args:
            persona_id: Persona UUID

        Returns:
            True if deleted, False if not found
        """
        with self.transaction():
            success = self.repo.delete(persona_id)
            if success:
                logger.info("persona.deleted", persona_id=str(persona_id))

        return success

    async def get_by_type(self, persona_type: str) -> List[PersonaResponse]:
        """Get all personas by type (kind).

        Args:
            persona_type: "artist" or "band"

        Returns:
            List of personas matching the type
        """
        # Query using repository's custom method if available
        # Otherwise use base repository filter
        # For now, using base get_all and filter in memory
        # TODO: Add get_by_kind method to repository
        all_personas = self.repo.get_all()
        filtered = [p for p in all_personas if p.kind == persona_type]

        logger.debug(
            "persona.get_by_type",
            persona_type=persona_type,
            count=len(filtered)
        )

        return self.to_response_list(filtered)

    def normalize_influences(
        self,
        influences: List[str],
        public_release: bool
    ) -> List[str]:
        """Normalize artist influences for public release.

        Converts specific living artist references to generic descriptions
        to avoid copyright and likeness issues.

        Transformations:
        - "Beyoncé" → "contemporary R&B diva-inspired sound"
        - "style of Drake" → "modern hip-hop influenced"
        - "Taylor Swift" → "pop storyteller-inspired"

        Args:
            influences: List of influence strings
            public_release: Whether to apply normalization

        Returns:
            Normalized list of influences
        """
        if not public_release:
            return influences

        normalized = []

        for influence in influences:
            influence_lower = influence.lower().strip()

            # Remove "style of" prefix
            if "style of" in influence_lower:
                # Extract artist name
                artist = influence_lower.replace("style of", "").strip()

                # Check if living artist
                if any(living in artist for living in self.LIVING_ARTISTS):
                    # Convert to generic description
                    normalized.append(self._genericize_artist(artist))
                    logger.debug(
                        "persona.influence_normalized",
                        original=influence,
                        normalized=normalized[-1]
                    )
                else:
                    # Keep but remove "style of"
                    normalized.append(f"{artist}-inspired sound")
            else:
                # Check if direct living artist reference
                if any(living in influence_lower for living in self.LIVING_ARTISTS):
                    normalized.append(self._genericize_artist(influence_lower))
                    logger.debug(
                        "persona.influence_normalized",
                        original=influence,
                        normalized=normalized[-1]
                    )
                else:
                    # Keep as-is (genre, era, or historical artist)
                    normalized.append(influence)

        return normalized

    def _genericize_artist(self, artist: str) -> str:
        """Convert specific artist name to generic genre description.

        Args:
            artist: Artist name (lowercase)

        Returns:
            Generic genre/style description
        """
        # Map common artists to generic descriptions
        # In production, this would use a more sophisticated mapping
        artist = artist.lower().strip()

        genre_map = {
            "beyoncé": "contemporary R&B diva-inspired sound",
            "taylor swift": "pop storytelling-inspired",
            "drake": "modern hip-hop influenced",
            "ed sheeran": "acoustic pop-inspired",
            "ariana grande": "pop vocal powerhouse-inspired",
            "billie eilish": "alt-pop atmospheric sound",
            "the weeknd": "dark R&B influenced",
            "bruno mars": "retro-funk pop-inspired",
            "adele": "soulful ballad-inspired",
            "rihanna": "pop-R&B fusion-inspired",
            "kanye west": "experimental hip-hop influenced",
            "jay-z": "classic hip-hop influenced",
            "kendrick lamar": "conscious hip-hop inspired",
            "post malone": "melodic hip-hop-pop influenced",
            "dua lipa": "disco-pop influenced",
            "harry styles": "rock-pop fusion-inspired",
            "olivia rodrigo": "pop-rock storytelling-inspired",
            "bublé": "jazz crooner-inspired",
            "michael bublé": "jazz crooner-inspired",
        }

        # Return mapped description or generic fallback
        return genre_map.get(artist, "contemporary pop-inspired sound")

    def validate_vocal_range(self, vocal_range: str) -> bool:
        """Validate vocal range against canonical ranges.

        Accepts single ranges (soprano, tenor) and combined ranges
        for duos/bands (soprano + tenor).

        Args:
            vocal_range: Range classification string

        Returns:
            True if valid, False otherwise
        """
        range_lower = vocal_range.lower().strip()
        return range_lower in self.VALID_VOCAL_RANGES

    def validate_delivery_styles(
        self,
        delivery: List[str]
    ) -> Tuple[bool, List[Tuple[str, str]]]:
        """Check for conflicting delivery styles.

        Detects mutually exclusive combinations like:
        - whisper + belting
        - soft + aggressive
        - intimate + stadium

        Args:
            delivery: List of delivery style strings

        Returns:
            Tuple of (is_valid, list_of_conflicts)
            - is_valid: True if no conflicts, False otherwise
            - list_of_conflicts: List of (style1, style2) tuples
        """
        conflicts = []
        delivery_lower = [d.lower().strip() for d in delivery]

        # Check each conflict pair
        for style1, style2 in self.DELIVERY_CONFLICTS:
            if style1 in delivery_lower and style2 in delivery_lower:
                conflicts.append((style1, style2))

        is_valid = len(conflicts) == 0

        if not is_valid:
            logger.debug(
                "persona.delivery_validation",
                is_valid=is_valid,
                conflict_count=len(conflicts)
            )

        return is_valid, conflicts

    async def get_by_name(self, name: str) -> Optional[PersonaResponse]:
        """Get persona by name.

        Args:
            name: Persona name

        Returns:
            PersonaResponse if found, None otherwise
        """
        entity = self.repo.get_by_name(name)
        return self.to_response(entity)

    async def search_by_influences(
        self,
        influences: List[str]
    ) -> List[PersonaResponse]:
        """Search personas by their influences.

        Uses PostgreSQL array overlap operator for efficient searching.

        Args:
            influences: List of influence names to search for

        Returns:
            List of personas with any of the specified influences
        """
        entities = self.repo.search_by_influences(influences)

        logger.debug(
            "persona.search_by_influences",
            search_terms=influences,
            result_count=len(entities)
        )

        return self.to_response_list(entities)

    async def get_by_vocal_range(
        self,
        min_range: Optional[str] = None,
        max_range: Optional[str] = None
    ) -> List[PersonaResponse]:
        """Get personas by vocal range.

        Args:
            min_range: Minimum vocal range (e.g., 'C3')
            max_range: Maximum vocal range (e.g., 'C6')

        Returns:
            List of personas within the specified vocal range
        """
        entities = self.repo.get_by_vocal_range(min_range, max_range)

        logger.debug(
            "persona.get_by_vocal_range",
            min_range=min_range,
            max_range=max_range,
            result_count=len(entities)
        )

        return self.to_response_list(entities)
