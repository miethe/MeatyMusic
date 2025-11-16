"""Default Persona Generator for SDS Generation MVP.

This module provides blueprint-driven default generation for Persona entities
when partial data exists or when basic persona information is needed.
"""

from __future__ import annotations

from typing import Optional, Dict, Any, List
import structlog

logger = structlog.get_logger(__name__)


class PersonaDefaultGenerator:
    """Generator for default Persona entity data based on genre conventions.

    This generator creates minimal persona data when partial persona information
    exists. In most cases, it returns None since personas are optional in SDS.
    When a persona is needed, it provides genre-appropriate defaults for:
    - vocal_range: "medium" or genre-typical range
    - delivery: Genre-specific delivery styles
    - influences: Empty array (no assumptions)
    - name: "Generic Artist" if not provided

    Genre-specific delivery styles are based on hit song blueprints:
    - Jazz: crooner, smooth
    - Hip-Hop/Rap: rap, melodic-rap
    - Rock: powerful, belting
    - Pop: melodic, belting
    - Country: storytelling, conversational
    - R&B: soulful, melismatic
    - Electronic/EDM: clear, powerful
    - Indie/Alternative: intimate, conversational
    - Christmas: warm, crooning
    - CCM: earnest, worshipful
    - K-Pop: melodic, powerful
    - Latin: passionate, rhythmic
    """

    # Genre-to-delivery-style mapping based on hit song blueprints
    GENRE_DELIVERY_MAP: Dict[str, List[str]] = {
        # Core genres
        "Jazz": ["crooner", "smooth"],
        "Hip-Hop": ["rap", "melodic-rap"],
        "Rap": ["rap", "melodic-rap"],
        "Rock": ["powerful", "belting"],
        "Pop": ["melodic", "belting"],
        "Country": ["storytelling", "conversational"],
        "R&B": ["soulful", "melismatic"],
        "Electronic": ["clear", "powerful"],
        "EDM": ["clear", "powerful"],
        "Dance": ["clear", "powerful"],
        "Indie": ["intimate", "conversational"],
        "Alternative": ["intimate", "conversational"],

        # Specialized genres
        "Christmas": ["warm", "crooning"],
        "CCM": ["earnest", "worshipful"],
        "Christian": ["earnest", "worshipful"],
        "K-Pop": ["melodic", "powerful"],
        "Latin": ["passionate", "rhythmic"],
        "Reggaeton": ["rhythmic", "melodic"],
        "Afrobeats": ["rhythmic", "melodic"],
        "Hyperpop": ["energetic", "processed"],
        "Pop-Punk": ["powerful", "raw"],
        "Emo": ["emotive", "raw"],

        # Subgenres and variations
        "Pop-Country": ["storytelling", "melodic"],
        "Country-Pop": ["storytelling", "melodic"],
        "Alt-R&B": ["intimate", "soulful"],
        "Indie-Rock": ["raw", "conversational"],
        "Indie-Pop": ["melodic", "intimate"],
        "Folk": ["conversational", "warm"],
        "Blues": ["soulful", "raw"],
        "Soul": ["soulful", "powerful"],
        "Funk": ["rhythmic", "soulful"],
        "Gospel": ["powerful", "worshipful"],
        "Metal": ["aggressive", "powerful"],
        "Punk": ["raw", "aggressive"],
        "Reggae": ["laid-back", "rhythmic"],
        "Ska": ["energetic", "rhythmic"],
    }

    # Genre-to-vocal-range mapping for nuanced defaults
    GENRE_VOCAL_RANGE_MAP: Dict[str, str] = {
        # Genres favoring higher ranges
        "Pop": "medium",
        "K-Pop": "medium-high",
        "R&B": "alto",
        "Soul": "alto",
        "Gospel": "alto",

        # Genres favoring lower ranges
        "Hip-Hop": "baritone",
        "Rap": "baritone",
        "Country": "baritone",
        "Blues": "baritone",

        # Genres favoring powerful/wide ranges
        "Rock": "tenor",
        "Metal": "tenor",
        "Pop-Punk": "tenor",

        # Default to medium for others
        "Electronic": "medium",
        "EDM": "medium",
        "Dance": "medium",
        "Indie": "medium",
        "Alternative": "medium",
        "Folk": "medium",
        "Christmas": "medium",
        "CCM": "medium",
        "Latin": "medium",
        "Reggaeton": "medium",
        "Afrobeats": "medium",
        "Hyperpop": "medium",
    }

    def __init__(self):
        """Initialize the PersonaDefaultGenerator."""
        self.logger = logger.bind(service="PersonaDefaultGenerator")

    def generate_default_persona(
        self,
        blueprint: Dict[str, Any],
        partial_persona: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Generate default Persona entity from blueprint and partial data.

        Returns None if no persona is needed (most common case - when partial_persona
        is None or empty). Only generates a persona when partial data exists.

        Args:
            blueprint: Blueprint dictionary containing genre and defaults
            partial_persona: Optional partial persona data from user input

        Returns:
            Complete persona dictionary with defaults applied, or None if no persona needed

        Examples:
            >>> generator = PersonaDefaultGenerator()
            >>> # No persona needed - returns None
            >>> generator.generate_default_persona(blueprint, None)
            None

            >>> # Partial persona - fill in missing fields
            >>> partial = {"name": "My Artist"}
            >>> result = generator.generate_default_persona(blueprint, partial)
            >>> result["name"]
            'My Artist'
            >>> result["vocal_range"]
            'medium'
        """
        # If no partial persona provided or it's empty, return None (no persona needed)
        if not partial_persona:
            self.logger.info("no_persona_needed", reason="no_partial_data")
            return None

        # Extract genre from blueprint for genre-specific defaults
        genre = self._extract_genre(blueprint)

        # Build complete persona with defaults
        persona = self._apply_defaults(partial_persona, genre)

        self.logger.info(
            "persona_generated",
            genre=genre,
            has_name=bool(persona.get("name")),
            has_delivery=bool(persona.get("delivery")),
            vocal_range=persona.get("vocal_range")
        )

        return persona

    def _extract_genre(self, blueprint: Dict[str, Any]) -> str:
        """Extract primary genre from blueprint.

        Args:
            blueprint: Blueprint dictionary

        Returns:
            Primary genre name, defaults to "Pop" if not found
        """
        # Try various blueprint structures to extract genre
        if isinstance(blueprint, dict):
            # Direct genre field
            if "genre" in blueprint:
                return blueprint["genre"]

            # Nested in genre_detail
            if "genre_detail" in blueprint:
                genre_detail = blueprint["genre_detail"]
                if isinstance(genre_detail, dict) and "primary" in genre_detail:
                    return genre_detail["primary"]
                elif isinstance(genre_detail, str):
                    return genre_detail

            # Nested in metadata
            if "metadata" in blueprint:
                metadata = blueprint["metadata"]
                if isinstance(metadata, dict) and "genre" in metadata:
                    return metadata["genre"]

        # Default to Pop if genre not found
        self.logger.warning("genre_not_found_in_blueprint", defaulting_to="Pop")
        return "Pop"

    def _apply_defaults(
        self,
        partial_persona: Dict[str, Any],
        genre: str
    ) -> Dict[str, Any]:
        """Apply default values to partial persona data.

        Args:
            partial_persona: User-provided partial persona data
            genre: Primary genre for genre-specific defaults

        Returns:
            Complete persona dictionary with defaults applied
        """
        # Start with partial data (preserves all user-provided fields)
        persona = partial_persona.copy()

        # Apply required field defaults
        if "name" not in persona or not persona["name"]:
            persona["name"] = "Generic Artist"

        if "kind" not in persona or not persona["kind"]:
            persona["kind"] = "artist"  # Default to solo artist

        # Apply vocal characteristics defaults
        if "vocal_range" not in persona or not persona["vocal_range"]:
            persona["vocal_range"] = self._get_default_vocal_range(genre)

        if "delivery" not in persona or not persona["delivery"]:
            persona["delivery"] = self._get_default_delivery(genre)

        # Apply optional field defaults
        if "influences" not in persona:
            persona["influences"] = []  # Empty - user should specify

        if "voice" not in persona:
            persona["voice"] = None  # Optional - no assumption

        if "bio" not in persona:
            persona["bio"] = None  # Optional - no assumption

        # Apply policy defaults
        if "policy" not in persona:
            persona["policy"] = {
                "public_release": False,
                "disallow_named_style_of": True
            }
        else:
            # Ensure policy has required fields
            if "public_release" not in persona["policy"]:
                persona["policy"]["public_release"] = False
            if "disallow_named_style_of" not in persona["policy"]:
                persona["policy"]["disallow_named_style_of"] = True

        # Optional defaults (style_defaults and lyrics_defaults)
        # These are intentionally left as None/unset if not provided
        # as they reference other entity schemas

        return persona

    def _get_default_vocal_range(self, genre: str) -> str:
        """Get genre-appropriate vocal range default.

        Args:
            genre: Primary genre name

        Returns:
            Vocal range string (e.g., "medium", "baritone", "alto")
        """
        # Try exact match first
        if genre in self.GENRE_VOCAL_RANGE_MAP:
            return self.GENRE_VOCAL_RANGE_MAP[genre]

        # Try case-insensitive match
        genre_lower = genre.lower()
        for key, value in self.GENRE_VOCAL_RANGE_MAP.items():
            if key.lower() == genre_lower:
                return value

        # Try partial match (e.g., "Pop Rock" contains "Pop")
        for key, value in self.GENRE_VOCAL_RANGE_MAP.items():
            if key.lower() in genre_lower or genre_lower in key.lower():
                return value

        # Default to medium for unknown genres
        return "medium"

    def _get_default_delivery(self, genre: str) -> List[str]:
        """Get genre-appropriate delivery style default.

        Args:
            genre: Primary genre name

        Returns:
            List of delivery style strings (e.g., ["melodic", "belting"])
        """
        # Try exact match first
        if genre in self.GENRE_DELIVERY_MAP:
            return self.GENRE_DELIVERY_MAP[genre].copy()

        # Try case-insensitive match
        genre_lower = genre.lower()
        for key, value in self.GENRE_DELIVERY_MAP.items():
            if key.lower() == genre_lower:
                return value.copy()

        # Try partial match (e.g., "Pop Rock" contains "Pop")
        # Prioritize exact word boundaries
        for key, value in self.GENRE_DELIVERY_MAP.items():
            if key.lower() in genre_lower.split() or \
               any(key.lower() in part for part in genre_lower.split('-')):
                return value.copy()

        # Try substring match as fallback
        for key, value in self.GENRE_DELIVERY_MAP.items():
            if key.lower() in genre_lower or genre_lower in key.lower():
                return value.copy()

        # Default to melodic for unknown genres
        return ["melodic"]
