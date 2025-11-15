"""Blueprint Reader Service for extracting genre-specific defaults.

This service provides a simplified interface for reading blueprint markdown files
and extracting default values for song generation. It focuses specifically on
providing defaults for Style, Lyrics, and other entity properties based on genre.

This is distinct from BlueprintService which handles full blueprint validation
and database operations. BlueprintReaderService is optimized for:
- Quick default value extraction for UI/API
- Simplified dictionary output (not full Blueprint models)
- Genre-specific recommendation data
"""

from __future__ import annotations

from typing import Dict, List, Any, Optional
from pathlib import Path
import re
import structlog

from app.errors import NotFoundError, BadRequestError

logger = structlog.get_logger(__name__)


class BlueprintReaderService:
    """Service for reading blueprint files and extracting default values.

    This service loads blueprint markdown files from the hit_song_blueprint
    directory and parses them to extract genre-specific defaults for:
    - Tempo BPM ranges
    - Required song sections
    - Default mood and energy levels
    - Recommended instrumentation
    - Genre-appropriate tags
    - Time signature
    - Recommended key

    The service implements in-memory caching to avoid re-reading files on
    subsequent calls for the same genre.

    Attributes:
        _blueprint_cache: In-memory cache for parsed blueprint data
        BLUEPRINT_DIR: Path to blueprint markdown files
    """

    # Absolute path to blueprint directory (per project requirements)
    BLUEPRINT_DIR = Path("/home/user/MeatyMusic/docs/hit_song_blueprint/AI")

    def __init__(self):
        """Initialize the blueprint reader service."""
        self._blueprint_cache: Dict[str, Dict[str, Any]] = {}

    def read_blueprint(self, genre: str) -> Dict[str, Any]:
        """Read and parse blueprint markdown for a genre.

        Loads the blueprint markdown file for the specified genre and extracts
        default values that can be used for song generation. The returned
        dictionary contains all the information needed to populate entity
        defaults according to genre-specific best practices.

        Results are cached in memory to avoid re-reading files.

        Args:
            genre: Genre name (e.g., 'pop', 'country', 'rock')
                   Should match filename: {genre}_blueprint.md

        Returns:
            Dictionary containing:
            - genre: Genre name
            - tempo_bpm: [min_bpm, max_bpm] range
            - time_signature: Default time signature (usually "4/4")
            - recommended_key: Recommended key for genre
            - required_sections: List of required song sections
            - default_mood: List of mood descriptors
            - default_energy: Energy level (low/medium/high/anthemic)
            - instrumentation: List of recommended instruments
            - tags: Dictionary of recommended tags by category
            - length_minutes: [min, max] song length in minutes

        Raises:
            NotFoundError: If blueprint file doesn't exist
            BadRequestError: If blueprint file is malformed

        Example:
            >>> service = BlueprintReaderService()
            >>> defaults = service.read_blueprint("pop")
            >>> print(defaults["tempo_bpm"])  # [95, 130]
            >>> print(defaults["default_mood"])  # ["upbeat", "energetic"]
        """
        # Check cache first
        if genre in self._blueprint_cache:
            logger.debug(
                "blueprint_reader.cache_hit",
                genre=genre,
                cache_size=len(self._blueprint_cache)
            )
            return self._blueprint_cache[genre]

        # Cache miss - load from file
        logger.debug("blueprint_reader.cache_miss", genre=genre)

        # Construct file path
        file_path = self.BLUEPRINT_DIR / f"{genre}_blueprint.md"

        if not file_path.exists():
            logger.error(
                "blueprint_reader.file_not_found",
                genre=genre,
                path=str(file_path)
            )
            raise NotFoundError(f"Blueprint file not found for genre: {genre}")

        try:
            # Read markdown content
            content = file_path.read_text(encoding='utf-8')

            # Parse blueprint structure
            parsed_data = self._parse_blueprint_markdown(content, genre)

            # Cache the result
            self._blueprint_cache[genre] = parsed_data

            logger.info(
                "blueprint_reader.loaded_and_cached",
                genre=genre,
                has_tempo=bool(parsed_data.get('tempo_bpm')),
                has_instrumentation=bool(parsed_data.get('instrumentation')),
                cache_size=len(self._blueprint_cache)
            )

            return parsed_data

        except NotFoundError:
            raise
        except Exception as e:
            logger.error(
                "blueprint_reader.parse_failed",
                genre=genre,
                path=str(file_path),
                error=str(e),
                exc_info=True
            )
            raise BadRequestError(
                f"Failed to parse blueprint file for '{genre}': {str(e)}"
            ) from e

    def _parse_blueprint_markdown(
        self,
        content: str,
        genre: str
    ) -> Dict[str, Any]:
        """Parse blueprint markdown content into structured defaults.

        Extracts all relevant default values from the blueprint markdown.
        Uses regex patterns to identify and extract key information from
        the various blueprint sections.

        Args:
            content: Raw markdown content from blueprint file
            genre: Genre name (used to initialize structure)

        Returns:
            Dictionary with default values for song generation
        """
        data: Dict[str, Any] = {
            'genre': genre,
            'tempo_bpm': None,
            'time_signature': "4/4",  # Default for most genres
            'recommended_key': None,
            'required_sections': [],
            'default_mood': [],
            'default_energy': 'medium',
            'instrumentation': [],
            'tags': {},
            'length_minutes': None,
        }

        # Extract tempo range
        data['tempo_bpm'] = self._extract_tempo(content)

        # Extract required sections
        data['required_sections'] = self._extract_sections(content)

        # Extract length constraints
        data['length_minutes'] = self._extract_length(content)

        # Extract instrumentation
        data['instrumentation'] = self._extract_instrumentation(content)

        # Extract mood and energy
        mood, energy = self._extract_mood_and_energy(content, data['tempo_bpm'])
        data['default_mood'] = mood
        data['default_energy'] = energy

        # Extract recommended key
        data['recommended_key'] = self._extract_key(content, genre)

        # Extract tags from genre descriptions
        data['tags'] = self._extract_tags(content, genre)

        return data

    def _extract_tempo(self, content: str) -> Optional[List[int]]:
        """Extract tempo BPM range from blueprint.

        Args:
            content: Blueprint markdown content

        Returns:
            [min_bpm, max_bpm] or None if not found
        """
        # Pattern: "**Tempo:** Most pop hits fall between **95–130 BPM**"
        tempo_match = re.search(
            r'\*\*Tempo:\*\*[^\d]*(\d+)[–-](\d+)\s*BPM',
            content,
            re.IGNORECASE
        )
        if tempo_match:
            return [int(tempo_match.group(1)), int(tempo_match.group(2))]

        # Fallback: Try simpler pattern
        tempo_alt_match = re.search(r'(\d+)[–-](\d+)\s*BPM', content)
        if tempo_alt_match:
            return [int(tempo_alt_match.group(1)), int(tempo_alt_match.group(2))]

        return None

    def _extract_sections(self, content: str) -> List[str]:
        """Extract required song sections from blueprint.

        Args:
            content: Blueprint markdown content

        Returns:
            List of section names (e.g., ["Verse", "Chorus", "Bridge"])
        """
        sections = []

        # Look for "**Form:** Verse → Chorus → Bridge"
        form_match = re.search(
            r'\*\*Form:\*\*[^\n]*',
            content,
            re.IGNORECASE
        )

        if form_match:
            form_text = form_match.group(0)
            # Extract standard section names
            section_pattern = r'(Verse|Chorus|Bridge|Pre[‑-]?Chorus|Intro|Outro|Hook)'
            found_sections = re.findall(section_pattern, form_text, re.IGNORECASE)
            # Remove duplicates while preserving order
            sections = list(dict.fromkeys(found_sections))

        # Default to Verse + Chorus if nothing found
        if not sections:
            sections = ["Verse", "Chorus"]

        return sections

    def _extract_length(self, content: str) -> Optional[List[float]]:
        """Extract song length constraints from blueprint.

        Args:
            content: Blueprint markdown content

        Returns:
            [min_minutes, max_minutes] or None if not found
        """
        # Pattern: "Most hits run **2.5–3.5 minutes**"
        length_match = re.search(
            r'(\d+\.?\d*)[–-](\d+\.?\d*)\s*minutes',
            content,
            re.IGNORECASE
        )
        if length_match:
            return [float(length_match.group(1)), float(length_match.group(2))]

        return None

    def _extract_instrumentation(self, content: str) -> List[str]:
        """Extract recommended instrumentation from blueprint.

        Args:
            content: Blueprint markdown content

        Returns:
            List of instrument names (limited to 3 per validation rules)
        """
        instruments = []

        # Look for "**Instrumentation:**" section
        instr_match = re.search(
            r'\*\*Instrumentation:\*\*([^.]+)',
            content,
            re.IGNORECASE
        )

        if instr_match:
            instr_text = instr_match.group(1)

            # Common instrument patterns (lowercase for matching)
            instrument_patterns = [
                r'synth[s]?',
                r'drum[s]?\s+machine[s]?',
                r'electric\s+guitar[s]?',
                r'acoustic\s+guitar[s]?',
                r'bass(?:\s+guitar)?',
                r'piano',
                r'strings?',
                r'brass',
                r'saxophone[s]?',
                r'vocoder[s]?',
                r'808[s]?',
                r'hi[- ]hat[s]?',
                r'kick[s]?',
                r'snare[s]?',
            ]

            # Search for each pattern
            for pattern in instrument_patterns:
                if re.search(pattern, instr_text, re.IGNORECASE):
                    # Normalize the instrument name
                    match = re.search(pattern, instr_text, re.IGNORECASE)
                    if match:
                        instrument = match.group(0).strip()
                        # Capitalize properly
                        if 'synth' in instrument.lower():
                            instrument = 'Synths'
                        elif 'drum' in instrument.lower() and 'machine' in instrument.lower():
                            instrument = 'Drum Machine'
                        elif 'guitar' in instrument.lower():
                            if 'electric' in instrument.lower():
                                instrument = 'Electric Guitar'
                            elif 'acoustic' in instrument.lower():
                                instrument = 'Acoustic Guitar'
                            else:
                                instrument = 'Guitar'
                        elif 'bass' in instrument.lower():
                            instrument = 'Bass'
                        elif 'piano' in instrument.lower():
                            instrument = 'Piano'
                        elif 'string' in instrument.lower():
                            instrument = 'Strings'
                        elif 'brass' in instrument.lower():
                            instrument = 'Brass'
                        else:
                            instrument = instrument.capitalize()

                        if instrument not in instruments:
                            instruments.append(instrument)

            # Limit to 3 instruments per validation rules
            instruments = instruments[:3]

        return instruments

    def _extract_mood_and_energy(
        self,
        content: str,
        tempo_bpm: Optional[List[int]]
    ) -> tuple[List[str], str]:
        """Extract mood descriptors and energy level from blueprint.

        Args:
            content: Blueprint markdown content
            tempo_bpm: [min, max] BPM range (used for energy calculation)

        Returns:
            Tuple of (mood_list, energy_level)
            - mood_list: List of mood descriptors (e.g., ["upbeat", "energetic"])
            - energy_level: "low" | "medium" | "high" | "anthemic"
        """
        moods = []
        energy = "medium"

        # Extract mood from vocal/performance section
        vocal_section = re.search(
            r'## Vocal[^#]+',
            content,
            re.IGNORECASE | re.DOTALL
        )

        if vocal_section:
            vocal_text = vocal_section.group(0).lower()

            # Common mood keywords
            mood_keywords = {
                'upbeat': ['upbeat', 'cheerful', 'happy', 'joyful'],
                'energetic': ['energetic', 'dynamic', 'driving'],
                'emotive': ['emotive', 'emotional', 'passionate'],
                'melancholic': ['melancholic', 'sad', 'somber', 'moody'],
                'romantic': ['romantic', 'loving', 'tender'],
                'aggressive': ['aggressive', 'intense', 'powerful'],
                'playful': ['playful', 'fun', 'lighthearted'],
                'nostalgic': ['nostalgic', 'wistful', 'reminiscent'],
            }

            for mood_name, keywords in mood_keywords.items():
                if any(keyword in vocal_text for keyword in keywords):
                    moods.append(mood_name)

        # Determine energy based on tempo if available
        if tempo_bpm:
            avg_bpm = sum(tempo_bpm) / 2
            if avg_bpm < 90:
                energy = "low"
            elif avg_bpm < 120:
                energy = "medium"
            elif avg_bpm < 140:
                energy = "high"
            else:
                energy = "anthemic"

        # Default moods if none found
        if not moods:
            moods = ["balanced"]

        return moods[:2], energy  # Limit to 2 moods

    def _extract_key(self, content: str, genre: str) -> str:
        """Extract recommended key from blueprint.

        Args:
            content: Blueprint markdown content
            genre: Genre name (used for fallback defaults)

        Returns:
            Recommended key (e.g., "C major", "A minor")
        """
        # Look for key mentions in Musical Blueprint section
        key_match = re.search(
            r'\*\*Key[^:]*:\*\*[^.]*?((?:[A-G][♭♯#b]?)\s+(?:major|minor))',
            content,
            re.IGNORECASE
        )

        if key_match:
            return key_match.group(1)

        # Look for common keys mentioned
        common_keys_match = re.search(
            r'((?:C|G|D|A|E|F|B)[♭♯#b]?)\s+(major|minor)',
            content,
            re.IGNORECASE
        )

        if common_keys_match:
            return f"{common_keys_match.group(1)} {common_keys_match.group(2)}"

        # Genre-specific defaults
        genre_key_defaults = {
            'pop': 'C major',
            'rock': 'G major',
            'country': 'G major',
            'hiphop': 'C minor',
            'rnb': 'E♭ major',
            'electronic': 'A minor',
            'christmas': 'F major',
        }

        return genre_key_defaults.get(genre, 'C major')

    def _extract_tags(self, content: str, genre: str) -> Dict[str, List[str]]:
        """Extract recommended tags from blueprint descriptions.

        Args:
            content: Blueprint markdown content
            genre: Genre name

        Returns:
            Dictionary of tags by category (vibe, texture, production)
        """
        tags: Dict[str, List[str]] = {
            'vibe': [],
            'texture': [],
            'production': []
        }

        # Extract production-related tags
        production_keywords = {
            'polished': ['polished', 'clean', 'professional'],
            'raw': ['raw', 'gritty', 'authentic'],
            'layered': ['layered', 'lush', 'rich'],
            'minimal': ['minimal', 'sparse', 'stripped'],
        }

        content_lower = content.lower()

        for tag, keywords in production_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                if tag not in tags['production']:
                    tags['production'].append(tag)

        # Genre-specific vibe tags
        genre_vibes = {
            'pop': ['catchy', 'mainstream'],
            'rock': ['anthemic', 'energetic'],
            'country': ['storytelling', 'heartfelt'],
            'hiphop': ['rhythmic', 'urban'],
            'rnb': ['smooth', 'soulful'],
            'electronic': ['synthetic', 'danceable'],
            'christmas': ['festive', 'joyful'],
        }

        if genre in genre_vibes:
            tags['vibe'] = genre_vibes[genre][:2]

        return tags

    def invalidate_cache(self, genre: Optional[str] = None) -> int:
        """Invalidate blueprint cache.

        Args:
            genre: Optional genre to invalidate (if None, clears entire cache)

        Returns:
            Number of cache entries removed

        Example:
            >>> service.invalidate_cache("pop")  # Clear just pop
            >>> service.invalidate_cache()  # Clear all cached blueprints
        """
        if genre is None:
            count = len(self._blueprint_cache)
            self._blueprint_cache.clear()
            logger.info("blueprint_reader.cache_cleared", entries_removed=count)
            return count
        else:
            if genre in self._blueprint_cache:
                del self._blueprint_cache[genre]
                logger.info("blueprint_reader.cache_invalidated", genre=genre)
                return 1
            return 0
