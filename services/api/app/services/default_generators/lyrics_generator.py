"""Lyrics default generator service.

Generates complete Lyrics entity data from blueprint rules and partial user input.
All defaults are deterministic - same blueprint + partial input = same output.
"""

from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger(__name__)


# Standard pop section order (from PRD Section 9 / Appendix A)
DEFAULT_SECTION_ORDER: List[str] = [
    "Intro",
    "Verse",
    "Chorus",
    "Verse",
    "Chorus",
    "Bridge",
    "Chorus",
    "Outro"
]


class LyricsDefaultGenerator:
    """Generator for Lyrics entity defaults based on blueprint rules.

    Provides deterministic default generation for Lyrics entities using
    blueprint-specific rules and lyrical best practices.
    """

    def generate_default_lyrics(
        self,
        blueprint: Dict[str, Any],
        partial_lyrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate complete Lyrics entity from blueprint and partial input.

        Fills missing fields using blueprint rules and lyrical best practices.
        Preserves user-provided fields if present in partial_lyrics.

        Args:
            blueprint: Blueprint dictionary containing genre rules and defaults
            partial_lyrics: Optional partial Lyrics data from user

        Returns:
            Complete Lyrics entity dictionary

        Raises:
            ValueError: If blueprint is missing required fields

        Example:
            >>> generator = LyricsDefaultGenerator()
            >>> blueprint = {"genre": "Pop", "rules": {"required_sections": ["Verse", "Chorus"]}}
            >>> lyrics = generator.generate_default_lyrics(blueprint)
            >>> assert lyrics["language"] == "en"
            >>> assert lyrics["pov"] == "1st"
            >>> assert "Verse" in lyrics["section_order"]
            >>> assert "Chorus" in lyrics["section_order"]
        """
        if not blueprint:
            raise ValueError("Blueprint is required for default generation")

        genre = blueprint.get("genre")
        if not genre:
            raise ValueError("Blueprint must contain 'genre' field")

        rules = blueprint.get("rules", {})
        partial = partial_lyrics or {}

        logger.debug(
            "lyrics.generate_defaults",
            genre=genre,
            has_partial=bool(partial_lyrics)
        )

        # Generate complete lyrics with defaults
        lyrics = {
            "language": partial.get("language", "en"),
            "pov": partial.get("pov", "1st"),
            "tense": partial.get("tense", "present"),
            "themes": partial.get("themes", []),
            "rhyme_scheme": partial.get("rhyme_scheme", "AABB"),
            "meter": partial.get("meter", "4/4 pop"),
            "syllables_per_line": partial.get("syllables_per_line", 8),
            "hook_strategy": partial.get("hook_strategy", "lyrical"),
            "repetition_policy": partial.get("repetition_policy", "moderate"),
            "imagery_density": partial.get("imagery_density", 0.5),
            "reading_level": partial.get("reading_level", "grade-8"),
            "section_order": self._get_section_order(rules, partial.get("section_order")),
            "constraints": self._get_constraints(rules, partial.get("constraints")),
            "source_citations": partial.get("source_citations", []),
        }

        logger.info(
            "lyrics.defaults_generated",
            genre=genre,
            section_count=len(lyrics["section_order"]),
            pov=lyrics["pov"],
            rhyme_scheme=lyrics["rhyme_scheme"]
        )

        return lyrics

    def _get_section_order(
        self,
        rules: Dict[str, Any],
        partial_section_order: Optional[List[str]]
    ) -> List[str]:
        """Get section order using blueprint rules and defaults.

        Algorithm:
        1. If user provided section_order, use it
        2. If blueprint has required_sections, filter default order to include them
        3. Otherwise use standard pop section order

        Args:
            rules: Blueprint rules (may contain required_sections)
            partial_section_order: Optional user-provided section order

        Returns:
            Ordered list of section names
        """
        if partial_section_order:
            return partial_section_order

        # Get required sections from blueprint
        required_sections = rules.get("required_sections")

        if required_sections and isinstance(required_sections, list):
            # Filter default order to only include required sections
            # Preserves the standard ordering
            section_order = [
                section for section in DEFAULT_SECTION_ORDER
                if section in required_sections
            ]

            # Add any required sections not in default order (at the end)
            for section in required_sections:
                if section not in section_order:
                    section_order.append(section)

            # Ensure we have at least one section
            if not section_order:
                logger.warning(
                    "lyrics.required_sections_empty",
                    required_sections=required_sections,
                    fallback="using_default_order"
                )
                return DEFAULT_SECTION_ORDER.copy()

            return section_order

        # Use standard pop section order
        return DEFAULT_SECTION_ORDER.copy()

    def _get_constraints(
        self,
        rules: Dict[str, Any],
        partial_constraints: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get lyrics constraints from blueprint and user input.

        Args:
            rules: Blueprint rules (may contain section_lines constraints)
            partial_constraints: Optional user-provided constraints

        Returns:
            Complete constraints dictionary with explicit, max_lines, and section_requirements
        """
        partial = partial_constraints or {}

        # Get section requirements from blueprint rules or user input
        section_requirements = partial.get("section_requirements")
        if not section_requirements:
            # Try to get from blueprint section_lines rules
            section_lines = rules.get("section_lines")
            if section_lines and isinstance(section_lines, dict):
                section_requirements = section_lines
            else:
                section_requirements = {}

        constraints = {
            "explicit": partial.get("explicit", False),
            "max_lines": partial.get("max_lines", 120),
            "section_requirements": section_requirements,
        }

        return constraints
