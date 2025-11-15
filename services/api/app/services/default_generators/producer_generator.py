"""Default generator for ProducerNotes entity.

This module provides the ProducerDefaultGenerator class which generates
default producer notes from blueprint, style, and lyrics entities. It creates
sensible arrangement defaults including structure, section metadata, hooks,
instrumentation, and mix targets.
"""

from typing import Any, Dict, List, Optional


class ProducerDefaultGenerator:
    """Generates default ProducerNotes from blueprint, style, and lyrics.

    This generator creates complete ProducerNotes with deterministic defaults
    when user-provided values are missing. It derives structure from lyrics
    section order, creates section-specific metadata, and applies industry
    standard mix targets.

    Usage:
        generator = ProducerDefaultGenerator()
        producer_notes = generator.generate_default_producer_notes(
            blueprint=blueprint_dict,
            style=style_dict,
            lyrics=lyrics_dict,
            partial_producer=user_provided_producer  # optional
        )
    """

    # Section metadata defaults based on common song structure patterns
    SECTION_TAG_DEFAULTS = {
        "Intro": ["instrumental", "build"],
        "Verse": ["storytelling"],
        "PreChorus": ["build"],
        "Chorus": ["anthemic", "hook-forward"],
        "Bridge": ["contrast", "dynamic"],
        "Outro": ["fade-out"],
    }

    SECTION_DURATION_DEFAULTS = {
        "Intro": 10,
        "Verse": 30,
        "PreChorus": 15,
        "Chorus": 25,
        "Bridge": 20,
        "Outro": 10,
    }

    # Mix target defaults based on streaming standards
    DEFAULT_MIX_LUFS = -14.0  # Streaming standard loudness
    DEFAULT_MIX_SPACE = "balanced"
    DEFAULT_MIX_STEREO_WIDTH = "normal"

    # Default hook count for pop songs
    DEFAULT_HOOKS = 2

    def generate_default_producer_notes(
        self,
        blueprint: Dict[str, Any],
        style: Dict[str, Any],
        lyrics: Dict[str, Any],
        partial_producer: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate default ProducerNotes from blueprint, style, and lyrics.

        Priority order for field values:
        1. User-provided values (from partial_producer)
        2. Derived values (from blueprint, style, lyrics)
        3. Global defaults

        Args:
            blueprint: Blueprint dictionary with genre rules and constraints
            style: Style dictionary with genre, tempo, instrumentation, etc.
            lyrics: Lyrics dictionary with section_order and other details
            partial_producer: Optional partial ProducerNotes with user values

        Returns:
            Complete ProducerNotes dictionary with all required fields

        Example:
            >>> generator = ProducerDefaultGenerator()
            >>> producer = generator.generate_default_producer_notes(
            ...     blueprint={"genre": "Christmas Pop"},
            ...     style={"instrumentation": ["brass", "sleigh bells"]},
            ...     lyrics={"section_order": ["Intro", "Verse", "Chorus"]},
            ... )
            >>> producer["structure"]
            'Intro-Verse-Chorus'
            >>> producer["hooks"]
            2
        """
        partial = partial_producer or {}

        # Generate structure from lyrics section order
        structure = self._generate_structure(lyrics, partial)

        # Generate section metadata for all unique sections
        section_meta = self._generate_section_meta(lyrics, partial)

        # Copy instrumentation from style or use empty list
        instrumentation = self._get_instrumentation(style, partial)

        # Generate mix targets
        mix = self._generate_mix_targets(partial)

        # Build complete ProducerNotes
        return {
            "structure": structure,
            "hooks": partial.get("hooks", self.DEFAULT_HOOKS),
            "instrumentation": instrumentation,
            "section_meta": section_meta,
            "mix": mix,
        }

    def _generate_structure(
        self,
        lyrics: Dict[str, Any],
        partial: Dict[str, Any],
    ) -> str:
        """Generate structure string from lyrics section order.

        Args:
            lyrics: Lyrics dictionary with section_order
            partial: Partial producer notes (may have user structure)

        Returns:
            Structure string like "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        """
        if "structure" in partial:
            return partial["structure"]

        section_order = lyrics.get("section_order", [])
        if not section_order:
            # Fallback to standard pop structure
            section_order = ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]

        return "-".join(section_order)

    def _generate_section_meta(
        self,
        lyrics: Dict[str, Any],
        partial: Dict[str, Any],
    ) -> Dict[str, Dict[str, Any]]:
        """Generate section metadata for all unique sections.

        Creates metadata with tags and target_duration_sec for each unique
        section in the lyrics section_order. Preserves user-provided metadata.

        Args:
            lyrics: Lyrics dictionary with section_order
            partial: Partial producer notes (may have user section_meta)

        Returns:
            Dictionary mapping section names to metadata:
            {
                "Intro": {"tags": ["instrumental", "build"], "target_duration_sec": 10},
                "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
                ...
            }
        """
        if "section_meta" in partial:
            return partial["section_meta"]

        section_order = lyrics.get("section_order", [])
        unique_sections = list(dict.fromkeys(section_order))  # Preserve order, remove duplicates

        section_meta = {}
        for section in unique_sections:
            section_meta[section] = {
                "tags": self.get_default_section_tags(section),
                "target_duration_sec": self.get_default_section_duration(section),
            }

        return section_meta

    def _get_instrumentation(
        self,
        style: Dict[str, Any],
        partial: Dict[str, Any],
    ) -> List[str]:
        """Get instrumentation from partial, style, or empty list.

        Args:
            style: Style dictionary with optional instrumentation field
            partial: Partial producer notes (may have user instrumentation)

        Returns:
            List of instrumentation strings
        """
        if "instrumentation" in partial:
            return partial["instrumentation"]

        return style.get("instrumentation", [])

    def _generate_mix_targets(
        self,
        partial: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate mix target defaults.

        Args:
            partial: Partial producer notes (may have user mix values)

        Returns:
            Mix dictionary with lufs, space, and stereo_width:
            {
                "lufs": -14.0,
                "space": "balanced",
                "stereo_width": "normal"
            }
        """
        partial_mix = partial.get("mix", {})

        return {
            "lufs": partial_mix.get("lufs", self.DEFAULT_MIX_LUFS),
            "space": partial_mix.get("space", self.DEFAULT_MIX_SPACE),
            "stereo_width": partial_mix.get("stereo_width", self.DEFAULT_MIX_STEREO_WIDTH),
        }

    @classmethod
    def get_default_section_tags(cls, section: str) -> List[str]:
        """Get default tags for a section type.

        Maps section names to their default production tags. Falls back
        to empty list for unknown sections.

        Args:
            section: Section name (e.g., "Intro", "Verse", "Chorus")

        Returns:
            List of default tags for this section type

        Example:
            >>> ProducerDefaultGenerator.get_default_section_tags("Chorus")
            ['anthemic', 'hook-forward']
            >>> ProducerDefaultGenerator.get_default_section_tags("Verse")
            ['storytelling']
            >>> ProducerDefaultGenerator.get_default_section_tags("UnknownSection")
            []
        """
        return cls.SECTION_TAG_DEFAULTS.get(section, [])

    @classmethod
    def get_default_section_duration(cls, section: str) -> int:
        """Get default duration for a section type in seconds.

        Maps section names to their typical durations. Falls back to 20
        seconds for unknown sections.

        Args:
            section: Section name (e.g., "Intro", "Verse", "Chorus")

        Returns:
            Default duration in seconds

        Example:
            >>> ProducerDefaultGenerator.get_default_section_duration("Intro")
            10
            >>> ProducerDefaultGenerator.get_default_section_duration("Verse")
            30
            >>> ProducerDefaultGenerator.get_default_section_duration("UnknownSection")
            20
        """
        return cls.SECTION_DURATION_DEFAULTS.get(section, 20)
