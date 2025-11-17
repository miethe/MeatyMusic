"""Style default generator service.

Generates complete Style entity data from blueprint rules and partial user input.
All defaults are deterministic - same blueprint + partial input = same output.
"""

from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger(__name__)


# Genre-specific mood map (from PRD Section 9)
GENRE_MOOD_MAP: Dict[str, List[str]] = {
    "Christmas Pop": ["upbeat", "warm"],
    "Pop": ["upbeat", "catchy"],
    "Hip-Hop": ["energetic", "confident"],
    "Jazz": ["smooth", "sophisticated"],
    "Rock": ["energetic", "rebellious"],
    "Country": ["nostalgic", "heartfelt"],
    "R&B": ["smooth", "sensual"],
    "Electronic": ["energetic", "futuristic"],
    "Indie": ["introspective", "authentic"],
    "Alternative": ["edgy", "experimental"],
    "CCM": ["uplifting", "hopeful"],
    "K-Pop": ["energetic", "polished"],
    "Latin": ["vibrant", "passionate"],
    "Afrobeats": ["rhythmic", "infectious"],
    "Hyperpop": ["chaotic", "maximalist"],
    "Pop Punk": ["rebellious", "energetic"],
}

# Genre-specific key defaults
GENRE_KEY_MAP: Dict[str, str] = {
    "Christmas Pop": "C major",
    "Pop": "C major",
    "Hip-Hop": "C minor",
    "Jazz": "F major",
    "Rock": "E major",
    "Country": "G major",
    "R&B": "D minor",
    "Electronic": "A minor",
    "Indie": "G major",
    "Alternative": "D major",
    "CCM": "G major",
    "K-Pop": "C major",
    "Latin": "A minor",
    "Afrobeats": "E minor",
    "Hyperpop": "C major",
    "Pop Punk": "E major",
}


class StyleDefaultGenerator:
    """Generator for Style entity defaults based on blueprint rules.

    Provides deterministic default generation for Style entities using
    blueprint-specific rules and genre conventions.
    """

    def generate_default_style(
        self,
        blueprint: Dict[str, Any],
        partial_style: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate complete Style entity from blueprint and partial input.

        Fills missing fields using blueprint rules and genre-specific defaults.
        Preserves user-provided fields if present in partial_style.

        This generator works with BlueprintReaderService output structure where
        fields are at the top level (not nested under "rules").

        Args:
            blueprint: Blueprint dictionary from BlueprintReaderService containing:
                - genre: Genre name (required)
                - tempo_bpm: [min, max] BPM range (optional)
                - default_mood: List of mood descriptors (optional)
                - default_energy: Energy level string (optional)
                - instrumentation: List of instruments (optional)
                - tags: Dict of categorized tags {vibe, texture, production} (optional)
                - recommended_key: Recommended key for genre (optional)
            partial_style: Optional partial Style data from user

        Returns:
            Complete Style entity dictionary

        Raises:
            ValueError: If blueprint is missing required fields

        Example:
            >>> generator = StyleDefaultGenerator()
            >>> blueprint = {"genre": "Pop", "tempo_bpm": [100, 120]}
            >>> style = generator.generate_default_style(blueprint)
            >>> assert style["genre_detail"]["primary"] == "Pop"
            >>> assert style["tempo_bpm"] == [100, 120]
        """
        if not blueprint:
            raise ValueError("Blueprint is required for default generation")

        genre = blueprint.get("genre")
        if not genre:
            raise ValueError("Blueprint must contain 'genre' field")

        partial = partial_style or {}

        logger.debug(
            "style.generate_defaults",
            genre=genre,
            has_partial=bool(partial_style),
            blueprint_has_tempo=bool(blueprint.get("tempo_bpm")),
            blueprint_has_mood=bool(blueprint.get("default_mood"))
        )

        # Generate complete style with defaults
        style = {
            "genre_detail": self._get_genre_detail(genre, partial.get("genre_detail")),
            "tempo_bpm": self._get_tempo_bpm(blueprint, partial.get("tempo_bpm")),
            "time_signature": partial.get("time_signature", blueprint.get("time_signature", "4/4")),
            "key": self._get_key(genre, blueprint, partial.get("key")),
            "mood": self._get_mood(genre, blueprint, partial.get("mood")),
            "energy": self._get_energy(blueprint, partial),
            "instrumentation": self._get_instrumentation(blueprint, partial.get("instrumentation")),
            "vocal_profile": partial.get("vocal_profile", "unspecified"),
            "tags": self._get_tags(blueprint, partial.get("tags")),
            "negative_tags": partial.get("negative_tags", []),
        }

        logger.info(
            "style.defaults_generated",
            genre=genre,
            tempo_bpm=style["tempo_bpm"],
            energy=style["energy"],
            tags_count=len(style["tags"])
        )

        return style

    def _get_genre_detail(
        self,
        genre: str,
        partial_genre_detail: Optional[Dict[str, Any]]
    ) -> Dict[str, str | List[str]]:
        """Get genre detail with defaults.

        Args:
            genre: Primary genre from blueprint
            partial_genre_detail: Optional user-provided genre detail

        Returns:
            Complete genre_detail dictionary
        """
        if partial_genre_detail:
            return {
                "primary": partial_genre_detail.get("primary", genre),
                "subgenres": partial_genre_detail.get("subgenres", []),
                "fusions": partial_genre_detail.get("fusions", []),
            }

        return {
            "primary": genre,
            "subgenres": [],
            "fusions": [],
        }

    def _get_tempo_bpm(
        self,
        blueprint: Dict[str, Any],
        partial_tempo: Optional[int | List[int]]
    ) -> int | List[int]:
        """Get tempo BPM from blueprint or partial input.

        Args:
            blueprint: Blueprint dictionary from BlueprintReaderService
            partial_tempo: Optional user-provided tempo

        Returns:
            Tempo BPM as integer or [min, max] range
        """
        if partial_tempo is not None:
            return partial_tempo

        # Use blueprint tempo range if available (BlueprintReaderService format)
        tempo_range = blueprint.get("tempo_bpm")
        if tempo_range:
            # If it's already a range, return it
            if isinstance(tempo_range, list) and len(tempo_range) == 2:
                return tempo_range
            # If it's a dict with min/max, convert to list (backward compat)
            elif isinstance(tempo_range, dict):
                min_bpm = tempo_range.get("min", 100)
                max_bpm = tempo_range.get("max", 120)
                return [min_bpm, max_bpm]
            # If it's a single value, create a small range
            elif isinstance(tempo_range, int):
                return [tempo_range - 5, tempo_range + 5]

        # Try legacy "rules" structure for backward compatibility
        rules = blueprint.get("rules", {})
        if rules and "tempo_bpm" in rules:
            tempo_range = rules["tempo_bpm"]
            if isinstance(tempo_range, list) and len(tempo_range) == 2:
                return tempo_range
            elif isinstance(tempo_range, dict):
                return [tempo_range.get("min", 100), tempo_range.get("max", 120)]
            elif isinstance(tempo_range, int):
                return [tempo_range - 5, tempo_range + 5]

        # Default fallback
        return [100, 120]

    def _get_key(
        self,
        genre: str,
        blueprint: Dict[str, Any],
        partial_key: Optional[Dict[str, Any]]
    ) -> Dict[str, str | List[str]]:
        """Get musical key with genre-appropriate default.

        Args:
            genre: Genre name for default key selection
            blueprint: Blueprint dictionary with recommended_key
            partial_key: Optional user-provided key

        Returns:
            Complete key dictionary
        """
        if partial_key:
            # Use blueprint recommended key as fallback if partial doesn't have primary
            default_key = (
                blueprint.get("recommended_key") or
                GENRE_KEY_MAP.get(genre, "C major")
            )
            return {
                "primary": partial_key.get("primary", default_key),
                "modulations": partial_key.get("modulations", []),
            }

        # Use blueprint recommended key, fall back to genre map
        recommended_key = blueprint.get("recommended_key")
        if recommended_key:
            return {
                "primary": recommended_key,
                "modulations": [],
            }

        return {
            "primary": GENRE_KEY_MAP.get(genre, "C major"),
            "modulations": [],
        }

    def _get_mood(
        self,
        genre: str,
        blueprint: Dict[str, Any],
        partial_mood: Optional[List[str]]
    ) -> List[str]:
        """Get mood descriptors from genre defaults or blueprint.

        Args:
            genre: Genre name for default mood
            blueprint: Blueprint dictionary with default_mood
            partial_mood: Optional user-provided mood

        Returns:
            List of mood descriptors (max 2 per requirements)
        """
        if partial_mood:
            return partial_mood

        # Try to get mood from blueprint (BlueprintReaderService format)
        blueprint_mood = blueprint.get("default_mood")
        if blueprint_mood and isinstance(blueprint_mood, list) and len(blueprint_mood) > 0:
            # Limit to max 2 mood descriptors per requirements
            return blueprint_mood[:2]

        # Try legacy "rules" structure for backward compatibility
        rules = blueprint.get("rules", {})
        if rules:
            rules_mood = rules.get("mood")
            if rules_mood and isinstance(rules_mood, list) and len(rules_mood) > 0:
                return rules_mood[:2]

        # Use genre-specific default
        return GENRE_MOOD_MAP.get(genre, ["neutral"])

    def _get_energy(
        self,
        blueprint: Dict[str, Any],
        partial: Dict[str, Any]
    ) -> str:
        """Derive energy level from blueprint, tempo, or use explicit value.

        Energy derivation rules (from PRD Section 9):
        - < 90 BPM: "low"
        - 90-120 BPM: "medium"
        - 120-140 BPM: "high"
        - > 140 BPM: "anthemic"

        Priority:
        1. Explicit user-provided energy
        2. Blueprint default_energy
        3. Derived from tempo
        4. Default to "medium"

        Args:
            blueprint: Blueprint dictionary with default_energy and tempo_bpm
            partial: Partial style data (may contain energy or tempo)

        Returns:
            Energy level string
        """
        # Use explicit energy if provided by user
        if partial.get("energy"):
            return partial["energy"]

        # Use blueprint default_energy if available (BlueprintReaderService format)
        blueprint_energy = blueprint.get("default_energy")
        if blueprint_energy and isinstance(blueprint_energy, str):
            return blueprint_energy

        # Derive from tempo (partial or blueprint)
        tempo = partial.get("tempo_bpm") or blueprint.get("tempo_bpm")

        # Try legacy rules structure for backward compatibility
        if not tempo:
            rules = blueprint.get("rules", {})
            tempo = rules.get("tempo_bpm")

        if tempo:
            # Get average BPM for range
            if isinstance(tempo, list) and len(tempo) >= 2:
                avg_bpm = (tempo[0] + tempo[1]) / 2
            elif isinstance(tempo, dict):
                min_bpm = tempo.get("min", 100)
                max_bpm = tempo.get("max", 120)
                avg_bpm = (min_bpm + max_bpm) / 2
            elif isinstance(tempo, int):
                avg_bpm = tempo
            else:
                avg_bpm = 110  # fallback

            # Derive energy from BPM
            if avg_bpm < 90:
                return "low"
            elif avg_bpm < 120:
                return "medium"
            elif avg_bpm < 140:
                return "high"
            else:
                return "anthemic"

        # Default fallback
        return "medium"

    def _get_instrumentation(
        self,
        blueprint: Dict[str, Any],
        partial_instrumentation: Optional[List[str]]
    ) -> List[str]:
        """Get instrumentation list from blueprint or user input.

        Limits to max 3 items per schema validation rules.

        Args:
            blueprint: Blueprint dictionary with instrumentation
            partial_instrumentation: Optional user-provided instrumentation

        Returns:
            List of instruments (max 3 items)
        """
        if partial_instrumentation:
            # Limit to 3 items
            return partial_instrumentation[:3]

        # Try to get from blueprint (BlueprintReaderService format)
        blueprint_instrumentation = blueprint.get("instrumentation")
        if blueprint_instrumentation and isinstance(blueprint_instrumentation, list):
            return blueprint_instrumentation[:3]

        # Try legacy "rules" structure for backward compatibility
        rules = blueprint.get("rules", {})
        if rules:
            rules_instrumentation = rules.get("instrumentation")
            if rules_instrumentation and isinstance(rules_instrumentation, list):
                return rules_instrumentation[:3]

        # Default: empty array (user should specify)
        return []

    def _get_tags(
        self,
        blueprint: Dict[str, Any],
        partial_tags: Optional[List[str]]
    ) -> List[str]:
        """Get tags from blueprint or user input, flattening categorized tags.

        BlueprintReaderService returns tags as categorized dict:
        {'vibe': [...], 'texture': [...], 'production': [...]}

        This method flattens them into a single list for the Style entity.

        Args:
            blueprint: Blueprint dictionary with categorized tags
            partial_tags: Optional user-provided tags

        Returns:
            List of flattened tags
        """
        if partial_tags:
            return partial_tags

        # Try to get from blueprint (BlueprintReaderService format with categorized tags)
        blueprint_tags = blueprint.get("tags")
        if blueprint_tags:
            # If it's a dict (categorized), flatten into single list
            if isinstance(blueprint_tags, dict):
                flattened_tags = []
                # Process in deterministic order for reproducibility
                for category in sorted(blueprint_tags.keys()):
                    category_tags = blueprint_tags[category]
                    if isinstance(category_tags, list):
                        flattened_tags.extend(category_tags)
                return flattened_tags
            # If it's already a list, return as-is
            elif isinstance(blueprint_tags, list):
                return blueprint_tags

        # Try legacy "rules" structure for backward compatibility
        rules = blueprint.get("rules", {})
        if rules:
            rules_tags = rules.get("tags")
            if rules_tags:
                if isinstance(rules_tags, dict):
                    flattened_tags = []
                    for category in sorted(rules_tags.keys()):
                        category_tags = rules_tags[category]
                        if isinstance(category_tags, list):
                            flattened_tags.extend(category_tags)
                    return flattened_tags
                elif isinstance(rules_tags, list):
                    return rules_tags

        # Default: empty array (user should specify)
        return []
