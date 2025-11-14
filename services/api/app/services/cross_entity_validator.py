"""Cross-Entity Validator - Ensures consistency across entities in SDS.

This module validates cross-entity relationships and consistency rules
that span multiple entities in the Song Design Spec (SDS). It operates
directly on the SDS dictionary without database dependencies.
"""

from typing import Dict, Any, List, Tuple
import structlog

logger = structlog.get_logger(__name__)


class CrossEntityValidator:
    """Validates consistency between related entities in SDS.

    This validator operates on the complete SDS dictionary and checks
    for consistency issues that span multiple entities, including:
    - Genre alignment between blueprint and style
    - Section structure alignment between lyrics and producer notes
    - Source citation validity between lyrics and sources

    All validations are performed synchronously and return detailed
    error messages for any inconsistencies found.
    """

    def validate_sds_consistency(self, sds: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate cross-entity consistency in SDS.

        Performs comprehensive validation across all entity relationships
        to ensure the SDS is internally consistent and ready for workflow
        processing.

        Args:
            sds: Complete SDS dictionary containing all entity data

        Returns:
            Tuple of (is_valid, error_messages)
            - is_valid: True if all validations passed, False otherwise
            - error_messages: List of validation error strings (empty if valid)

        Example:
            >>> validator = CrossEntityValidator()
            >>> is_valid, errors = validator.validate_sds_consistency(sds_dict)
            >>> if not is_valid:
            ...     print(f"Validation failed: {errors}")
        """
        errors = []

        # 1. Validate genre consistency between blueprint and style
        genre_errors = self._validate_genre_consistency(sds)
        errors.extend(genre_errors)

        # 2. Validate section alignment between lyrics and producer notes
        section_errors = self._validate_section_alignment(sds)
        errors.extend(section_errors)

        # 3. Validate source citations reference existing sources
        citation_errors = self._validate_source_citations(sds)
        errors.extend(citation_errors)

        is_valid = len(errors) == 0

        if not is_valid:
            logger.warning(
                "cross_entity.validation_failed",
                error_count=len(errors),
                errors=errors
            )
        else:
            logger.debug("cross_entity.validation_passed")

        return is_valid, errors

    def _validate_genre_consistency(self, sds: Dict[str, Any]) -> List[str]:
        """Validate blueprint genre matches style primary genre.

        Ensures that the blueprint reference genre is consistent with
        the primary genre specified in the style entity. This is critical
        for ensuring workflow nodes use the correct genre-specific rules.

        Args:
            sds: Complete SDS dictionary

        Returns:
            List of error messages (empty if valid)
        """
        errors = []

        # Safely extract genres with proper error handling
        try:
            blueprint_ref = sds.get("blueprint_ref", {})
            blueprint_genre = blueprint_ref.get("genre")

            style = sds.get("style", {})
            genre_detail = style.get("genre_detail", {})
            style_genre = genre_detail.get("primary")

            # Only validate if both genres are present
            if blueprint_genre and style_genre:
                if blueprint_genre != style_genre:
                    errors.append(
                        f"Genre mismatch: blueprint '{blueprint_genre}' != style '{style_genre}'"
                    )
            elif blueprint_genre or style_genre:
                # One is missing - this is a schema validation issue, not cross-entity
                logger.debug(
                    "cross_entity.genre_check_skipped",
                    reason="Missing genre field",
                    blueprint_genre=blueprint_genre,
                    style_genre=style_genre
                )
        except Exception as e:
            logger.error(
                "cross_entity.genre_validation_error",
                error=str(e)
            )
            errors.append(f"Genre validation error: {str(e)}")

        return errors

    def _validate_section_alignment(self, sds: Dict[str, Any]) -> List[str]:
        """Validate lyrics sections match producer notes structure.

        Ensures that all sections referenced in the producer notes structure
        exist in the lyrics section order. Producer notes use an en-dash (–)
        separated structure format like "Intro – Verse – Chorus – Bridge".

        Args:
            sds: Complete SDS dictionary

        Returns:
            List of error messages (empty if valid)
        """
        errors = []

        try:
            # Get lyrics sections
            lyrics = sds.get("lyrics", {})
            lyrics_sections = set(lyrics.get("section_order", []))

            # Parse producer notes structure
            producer_notes = sds.get("producer_notes", {})
            structure = producer_notes.get("structure", "")

            if not structure:
                # No structure to validate against
                logger.debug(
                    "cross_entity.section_check_skipped",
                    reason="No producer notes structure"
                )
                return []

            # Parse sections from structure (en-dash separated)
            producer_sections = set()
            for part in structure.split("–"):
                section = part.strip()
                if section:
                    producer_sections.add(section)

            # Check all producer sections exist in lyrics
            missing = producer_sections - lyrics_sections
            if missing:
                errors.append(
                    f"Producer notes references sections not in lyrics: {', '.join(sorted(missing))}"
                )
        except Exception as e:
            logger.error(
                "cross_entity.section_validation_error",
                error=str(e)
            )
            errors.append(f"Section validation error: {str(e)}")

        return errors

    def _validate_source_citations(self, sds: Dict[str, Any]) -> List[str]:
        """Validate lyrics source citations reference existing sources.

        Ensures that all source IDs referenced in lyrics citations
        correspond to actual sources defined in the SDS sources list.
        This is critical for maintaining citation traceability.

        Args:
            sds: Complete SDS dictionary

        Returns:
            List of error messages (empty if valid)
        """
        errors = []

        try:
            # Get lyrics citations
            lyrics = sds.get("lyrics", {})
            citations = lyrics.get("source_citations", [])

            if not citations:
                # No citations to validate
                logger.debug(
                    "cross_entity.citation_check_skipped",
                    reason="No lyrics citations"
                )
                return []

            # Get available source IDs/names
            sources = sds.get("sources", [])
            source_ids = {src.get("name") for src in sources if src.get("name")}

            # Validate each citation
            for citation in citations:
                cited_id = citation.get("source_id")
                if cited_id and cited_id not in source_ids:
                    errors.append(
                        f"Lyrics cites source '{cited_id}' which is not in sources list"
                    )
        except Exception as e:
            logger.error(
                "cross_entity.citation_validation_error",
                error=str(e)
            )
            errors.append(f"Citation validation error: {str(e)}")

        return errors
