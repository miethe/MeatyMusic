"""Lyrics default generator service.

Generates complete Lyrics entity data from blueprint rules and partial user input.
All defaults are deterministic - same blueprint + partial input = same output.
"""

from typing import Any, Dict, List, Optional
import structlog

from app.services.blueprint_reader import BlueprintReaderService

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

# Genre-specific section order patterns
GENRE_SECTION_PATTERNS: Dict[str, List[str]] = {
    "Pop": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
    "Hip-Hop": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Verse", "Chorus", "Outro"],
    "Rock": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Solo", "Chorus", "Outro"],
    "Country": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
    "R&B": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
    "Electronic": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
    "Indie": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
    "Alternative": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"],
}


class LyricsDefaultGenerator:
    """Generator for Lyrics entity defaults based on blueprint rules.

    Provides deterministic default generation for Lyrics entities using
    blueprint-specific rules and lyrical best practices.
    """

    def __init__(self):
        """Initialize the lyrics default generator."""
        self.blueprint_reader = BlueprintReaderService()

    def generate_default_lyrics(
        self,
        blueprint: Dict[str, Any],
        partial_lyrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate complete Lyrics entity from blueprint and partial input.

        Fills missing fields using blueprint rules and lyrical best practices.
        Preserves user-provided fields if present in partial_lyrics.

        Args:
            blueprint: Blueprint dictionary from BlueprintReaderService containing:
                - genre: Genre name (required)
                - required_sections: List of required sections (optional)
                - section_lines: Section line constraints (optional)
            partial_lyrics: Optional partial Lyrics data from user

        Returns:
            Complete Lyrics entity dictionary

        Raises:
            ValueError: If blueprint is missing required fields

        Example:
            >>> generator = LyricsDefaultGenerator()
            >>> blueprint = {"genre": "Pop", "required_sections": ["Verse", "Chorus"]}
            >>> lyrics = generator.generate_default_lyrics(blueprint)
            >>> assert lyrics["language"] == "en"
            >>> assert lyrics["pov"] == "first-person"
            >>> assert "Verse" in lyrics["section_order"]
            >>> assert "Chorus" in lyrics["section_order"]
        """
        if not blueprint:
            raise ValueError("Blueprint is required for default generation")

        genre = blueprint.get("genre")
        if not genre:
            raise ValueError("Blueprint must contain 'genre' field")

        partial = partial_lyrics or {}

        logger.debug(
            "lyrics.generate_defaults",
            genre=genre,
            has_partial=bool(partial_lyrics),
            blueprint_has_sections=bool(blueprint.get("required_sections"))
        )

        # Generate complete lyrics with defaults
        lyrics = {
            "language": partial.get("language", "en"),
            "pov": partial.get("pov", "first-person"),
            "tense": partial.get("tense", "present"),
            "themes": partial.get("themes", []),
            "rhyme_scheme": partial.get("rhyme_scheme", "AABB"),
            "meter": partial.get("meter", "4/4 pop"),
            "syllables_per_line": partial.get("syllables_per_line", 8),
            "hook_strategy": partial.get("hook_strategy", "repetition"),
            "repetition_rules": self._get_repetition_rules(partial.get("repetition_rules")),
            "imagery_density": partial.get("imagery_density", 5),  # 0-10 scale
            "reading_level": partial.get("reading_level", 80),  # 0-100 scale
            "section_order": self._get_section_order(blueprint, partial.get("section_order")),
            "sections": partial.get("sections", []),  # Empty by default - user should provide
            "constraints": self._get_constraints(blueprint, partial.get("constraints")),
            "explicit_allowed": partial.get("explicit_allowed", False),
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

    def _get_repetition_rules(
        self,
        partial_repetition_rules: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get repetition rules with defaults.

        Args:
            partial_repetition_rules: Optional user-provided repetition rules

        Returns:
            Complete repetition rules dictionary
        """
        if partial_repetition_rules:
            # Merge with defaults
            defaults = {
                "hook_count": 3,
                "allow_verbatim": True,
                "max_repeat": 4
            }
            return {**defaults, **partial_repetition_rules}

        return {
            "hook_count": 3,
            "allow_verbatim": True,
            "max_repeat": 4
        }

    def _get_section_order(
        self,
        blueprint: Dict[str, Any],
        partial_section_order: Optional[List[str]]
    ) -> List[str]:
        """Get section order using blueprint rules and genre patterns.

        Algorithm:
        1. If user provided section_order, use it
        2. If blueprint has required_sections, build order from genre pattern
        3. Otherwise use genre-specific pattern or standard pop order

        Args:
            blueprint: Blueprint dictionary (may contain required_sections and genre)
            partial_section_order: Optional user-provided section order

        Returns:
            Ordered list of section names
        """
        if partial_section_order:
            return partial_section_order

        # Get genre for pattern lookup
        genre = blueprint.get("genre", "Pop")

        # Get required sections from blueprint
        required_sections = blueprint.get("required_sections")

        if required_sections and isinstance(required_sections, list) and len(required_sections) > 0:
            # Build section order from genre pattern, ensuring all required sections are present
            section_order = self._build_section_order_from_required(
                genre, required_sections
            )
            return section_order

        # Use genre-specific pattern or default
        pattern = GENRE_SECTION_PATTERNS.get(genre, DEFAULT_SECTION_ORDER)
        return pattern.copy()

    def _build_section_order_from_required(
        self,
        genre: str,
        required_sections: List[str]
    ) -> List[str]:
        """Build section order ensuring all required sections are present.

        Uses genre-specific pattern as template and ensures all required
        sections are included in conventional song structure order.

        Args:
            genre: Genre name
            required_sections: List of required section names

        Returns:
            Section order with all required sections in conventional structure
        """
        # Get genre pattern
        base_pattern = GENRE_SECTION_PATTERNS.get(genre, DEFAULT_SECTION_ORDER)

        # Filter pattern to only include required sections (preserving order)
        section_order = [
            section for section in base_pattern
            if section in required_sections
        ]

        # Add any required sections not in the base pattern (at the end)
        for section in required_sections:
            if section not in section_order:
                # Try to insert in a sensible position
                if section.lower() in ["intro", "introduction"]:
                    section_order.insert(0, section)
                elif section.lower() in ["outro", "ending", "coda"]:
                    section_order.append(section)
                elif section.lower() in ["prechorus", "pre-chorus", "pre chorus"]:
                    # Insert before first Chorus
                    chorus_idx = next(
                        (i for i, s in enumerate(section_order) if s.lower() == "chorus"),
                        len(section_order)
                    )
                    section_order.insert(chorus_idx, section)
                else:
                    # Add before last element (usually Outro)
                    if section_order:
                        section_order.insert(len(section_order) - 1, section)
                    else:
                        section_order.append(section)

        # If we ended up with an empty order, fall back to default
        if not section_order:
            logger.warning(
                "lyrics.required_sections_empty",
                required_sections=required_sections,
                fallback="using_default_order"
            )
            return DEFAULT_SECTION_ORDER.copy()

        return section_order

    def _get_constraints(
        self,
        blueprint: Dict[str, Any],
        partial_constraints: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get lyrics constraints from blueprint and user input.

        Args:
            blueprint: Blueprint dictionary (may contain section_lines)
            partial_constraints: Optional user-provided constraints

        Returns:
            Complete constraints dictionary with explicit, max_lines, and section_requirements
        """
        partial = partial_constraints or {}

        # Get section requirements from blueprint or user input
        section_requirements = partial.get("section_requirements")
        if not section_requirements:
            # Try to get from blueprint section_lines
            # BlueprintReaderService doesn't extract section_lines currently,
            # but support it if blueprint has it
            section_lines = blueprint.get("section_lines")
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
