"""Blueprint Validator Service - Enforces genre-specific constraints."""

from typing import Dict, Any, List, Tuple
from uuid import UUID
import structlog

from app.repositories.blueprint_repo import BlueprintRepository
from app.models.blueprint import Blueprint

logger = structlog.get_logger(__name__)


class BlueprintValidatorService:
    """Validates SDS against blueprint constraints.

    This service enforces genre-specific rules including tempo ranges,
    required sections, banned terms, and section line count requirements.
    """

    def __init__(self, blueprint_repo: BlueprintRepository):
        """Initialize the blueprint validator service.

        Args:
            blueprint_repo: Repository for blueprint data access
        """
        self.blueprint_repo = blueprint_repo

    async def validate_sds_against_blueprint(
        self,
        sds: Dict[str, Any],
        blueprint_id: str
    ) -> Tuple[bool, List[str]]:
        """Validate SDS against blueprint constraints.

        Performs comprehensive validation of the Song Design Spec against
        genre-specific blueprint rules including:
        - BPM range validation
        - Required sections presence
        - Banned terms checking
        - Section line count requirements

        Args:
            sds: Complete SDS dictionary containing style, lyrics, and other entities
            blueprint_id: Blueprint UUID string

        Returns:
            Tuple of (is_valid, error_messages)
            - is_valid: True if all validations pass, False otherwise
            - error_messages: List of validation error descriptions
        """
        # Fetch blueprint
        blueprint = self.blueprint_repo.get_by_id(Blueprint, UUID(blueprint_id))

        if not blueprint:
            logger.warning(
                "blueprint.not_found",
                blueprint_id=blueprint_id
            )
            return False, [f"Blueprint {blueprint_id} not found"]

        errors = []

        # 1. Validate BPM range
        if "style" in sds:
            bpm_errors = self._validate_bpm(sds["style"], blueprint.rules)
            errors.extend(bpm_errors)

        # 2. Validate required sections
        if "lyrics" in sds:
            section_errors = self._validate_required_sections(sds["lyrics"], blueprint.rules)
            errors.extend(section_errors)

            # 3. Validate banned terms
            banned_errors = self._validate_banned_terms(sds["lyrics"], blueprint.rules)
            errors.extend(banned_errors)

            # 4. Validate section line counts
            line_errors = self._validate_section_lines(sds["lyrics"], blueprint.rules)
            errors.extend(line_errors)

        is_valid = len(errors) == 0

        if not is_valid:
            logger.warning(
                "blueprint.validation_failed",
                blueprint_id=blueprint_id,
                blueprint_genre=blueprint.genre,
                error_count=len(errors),
                errors=errors[:5]  # Log first 5 errors to avoid log bloat
            )
        else:
            logger.info(
                "blueprint.validation_passed",
                blueprint_id=blueprint_id,
                blueprint_genre=blueprint.genre
            )

        return is_valid, errors

    def _validate_bpm(
        self,
        style: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Validate tempo BPM is within blueprint range.

        Args:
            style: Style entity dictionary from SDS
            rules: Blueprint rules dictionary

        Returns:
            List of validation error messages (empty if valid)
        """
        if "tempo_bpm" not in rules:
            return []

        bpm_range = rules["tempo_bpm"]
        if not isinstance(bpm_range, list) or len(bpm_range) != 2:
            logger.warning(
                "blueprint.invalid_bpm_range",
                bpm_range=bpm_range
            )
            return []

        min_bpm, max_bpm = bpm_range[0], bpm_range[1]

        style_bpm = style.get("tempo_bpm")
        if style_bpm is None:
            return ["Style missing tempo_bpm field"]

        # Handle single BPM or range (bpm_min, bpm_max)
        if isinstance(style_bpm, int):
            bpm_values = [style_bpm]
        elif isinstance(style_bpm, list) and len(style_bpm) == 2:
            # Validate both min and max of range
            bpm_values = style_bpm
        else:
            return [f"Invalid tempo_bpm format: {style_bpm}"]

        errors = []
        for bpm in bpm_values:
            if not isinstance(bpm, (int, float)):
                errors.append(f"Invalid BPM value type: {bpm}")
                continue

            if bpm < min_bpm or bpm > max_bpm:
                errors.append(
                    f"BPM {bpm} outside blueprint range [{min_bpm}, {max_bpm}]"
                )

        return errors

    def _validate_required_sections(
        self,
        lyrics: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Validate all required sections present in lyrics.

        Args:
            lyrics: Lyrics entity dictionary from SDS
            rules: Blueprint rules dictionary

        Returns:
            List of validation error messages (empty if valid)
        """
        required_sections = rules.get("required_sections", [])
        if not required_sections:
            return []

        lyrics_sections = set(lyrics.get("section_order", []))
        missing = set(required_sections) - lyrics_sections

        if missing:
            return [f"Missing required sections: {', '.join(sorted(missing))}"]

        return []

    def _validate_banned_terms(
        self,
        lyrics: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Check lyrics for banned terms.

        Note: This is a placeholder for profanity checking. Full implementation
        will scan generated lyrics text during the LYRICS workflow node.
        Currently only validates that explicit constraints are properly set.

        Args:
            lyrics: Lyrics entity dictionary from SDS
            rules: Blueprint rules dictionary

        Returns:
            List of validation error messages (empty if valid)
        """
        banned_terms = rules.get("banned_terms", [])
        if not banned_terms:
            return []

        # Check if explicit content is allowed
        explicit_allowed = lyrics.get("constraints", {}).get("explicit", False)

        if not explicit_allowed and banned_terms:
            # Placeholder for actual profanity checking
            # Real implementation will scan generated lyrics text
            logger.debug(
                "lyrics.banned_terms_check_deferred",
                banned_term_count=len(banned_terms),
                explicit_allowed=explicit_allowed
            )
            return []

        return []

    def _validate_section_lines(
        self,
        lyrics: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Validate section line counts against blueprint rules.

        Note: This validation is more relevant post-generation. For SDS validation,
        we check that line count requirements are properly defined.

        Args:
            lyrics: Lyrics entity dictionary from SDS
            rules: Blueprint rules dictionary

        Returns:
            List of validation error messages (empty if valid)
        """
        section_lines = rules.get("section_lines", {})
        if not section_lines:
            return []

        # Check if section requirements are defined for each section
        section_reqs = lyrics.get("constraints", {}).get("section_requirements", {})

        errors = []
        for section, line_rules in section_lines.items():
            if section in lyrics.get("section_order", []):
                # Section exists, check if requirements defined
                if section not in section_reqs:
                    min_lines = line_rules.get("min", 0)
                    if min_lines > 0:
                        errors.append(
                            f"Section '{section}' requires line count constraints (min: {min_lines})"
                        )

        return errors
