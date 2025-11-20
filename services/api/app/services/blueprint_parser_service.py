"""Blueprint Markdown Parser Service.

This utility service parses genre blueprint markdown files from
docs/hit_song_blueprint/AI/ and extracts structured data for database storage.

The parser extracts:
- Tempo ranges (BPM min/max)
- Required sections (Verse, Chorus, Bridge, etc.)
- Song length constraints (minutes)
- Key signatures and time signatures
- Evaluation rubric weights and thresholds
- Lexicon (preferred words/phrases)
- Extra metadata (source file, description)
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Optional, Any
import structlog

logger = structlog.get_logger(__name__)


class BlueprintParserService:
    """Service for parsing blueprint markdown files into structured data.

    This is a stateless utility service that does not interact with the database.
    It provides pure parsing logic for blueprint markdown files.

    Attributes:
        BLUEPRINT_DIR: Path to blueprint markdown files
    """

    # Class-level path (absolute path as per requirements)
    BLUEPRINT_DIR = Path("/home/user/MeatyMusic/docs/hit_song_blueprint/AI")

    def __init__(self):
        """Initialize the blueprint parser service."""
        pass

    def parse_blueprint_file(self, genre: str, version: str = "2025.11") -> Dict[str, Any]:
        """Parse a blueprint markdown file for a specific genre.

        Args:
            genre: Genre name (matches filename: {genre}_blueprint.md)
            version: Blueprint version (default: "2025.11")

        Returns:
            Dictionary with structured blueprint data including:
            - genre: Genre name
            - version: Blueprint version
            - rules: Dict with tempo_bpm, required_sections, length_minutes, etc.
            - eval_rubric: Scoring weights and thresholds
            - conflict_matrix: Tag conflicts for this genre (empty for now)
            - tag_categories: Categorized style tags (empty for now)
            - extra_metadata: Additional metadata (source file, description)

        Raises:
            FileNotFoundError: If blueprint file doesn't exist
            ValueError: If blueprint file is malformed

        Example:
            >>> parser = BlueprintParserService()
            >>> data = parser.parse_blueprint_file("pop")
            >>> print(data["rules"]["tempo_bpm"])
            >>> [95, 130]
        """
        # Construct file path
        file_path = self.BLUEPRINT_DIR / f"{genre}_blueprint.md"

        if not file_path.exists():
            raise FileNotFoundError(f"Blueprint file not found: {file_path}")

        try:
            # Read markdown content
            content = file_path.read_text(encoding='utf-8')

            # Parse blueprint structure
            data = self._parse_blueprint_markdown(content, genre, version)

            logger.info(
                "blueprint.parsed",
                genre=genre,
                version=version,
                has_tempo_range=bool(data.get('rules', {}).get('tempo_bpm')),
                has_sections=bool(data.get('rules', {}).get('required_sections')),
                source_file=str(file_path)
            )

            return data

        except Exception as e:
            logger.error(
                "blueprint.parse_failed",
                genre=genre,
                path=str(file_path),
                error=str(e),
                exc_info=True
            )
            raise ValueError(
                f"Failed to parse blueprint file for '{genre}': {str(e)}"
            ) from e

    def _parse_blueprint_markdown(
        self,
        content: str,
        genre: str,
        version: str
    ) -> Dict[str, Any]:
        """Parse blueprint markdown content into structured data.

        This is the core parsing logic that transforms human-readable markdown
        blueprints into machine-readable data structures.

        Args:
            content: Raw markdown content from blueprint file
            genre: Genre name
            version: Blueprint version

        Returns:
            Dict with structured blueprint data
        """
        # Initialize default structure
        data = {
            'genre': genre,
            'version': version,
            'rules': {},
            'eval_rubric': {},
            'conflict_matrix': {},
            'tag_categories': {},
            'extra_metadata': {}
        }

        # Extract title and description
        data['extra_metadata']['source_file'] = f"{genre}_blueprint.md"
        data['extra_metadata']['description'] = self._extract_description(content)

        # Parse rules
        data['rules']['tempo_bpm'] = self._extract_tempo_range(content)
        data['rules']['required_sections'] = self._extract_required_sections(content)
        data['rules']['length_minutes'] = self._extract_length_constraints(content)
        data['rules']['time_signature'] = self._extract_time_signature(content)
        data['rules']['key_signatures'] = self._extract_key_signatures(content)
        data['rules']['lexicon_positive'] = self._extract_lexicon_positive(content)
        data['rules']['lexicon_negative'] = self._extract_lexicon_negative(content)
        data['rules']['banned_terms'] = []  # Profanity filtering - empty by default

        # Set up default evaluation rubric
        data['eval_rubric'] = self._create_default_rubric()

        # Metadata
        data['extra_metadata']['has_examples'] = bool(
            re.search(r'## Examples', content, re.IGNORECASE)
        )
        data['extra_metadata']['has_citations'] = bool(
            re.search(r'## Citations|###\s*Citations', content, re.IGNORECASE)
        )

        return data

    def _extract_description(self, content: str) -> str:
        """Extract genre description from overview section.

        Args:
            content: Raw markdown content

        Returns:
            Genre description text (first paragraph of Genre Overview)
        """
        # Match "## Genre Overview" section
        overview_match = re.search(
            r'##\s*Genre Overview\s*\n\n([^\n]+)',
            content,
            re.IGNORECASE
        )

        if overview_match:
            return overview_match.group(1).strip()

        return ""

    def _extract_tempo_range(self, content: str) -> Optional[List[int]]:
        """Extract tempo range (BPM) from markdown content.

        Patterns matched:
        - "**Tempo:** Most pop hits fall between **95–130 BPM**"
        - "between **60–100 BPM**"
        - "around **100–130 BPM**"

        Args:
            content: Raw markdown content

        Returns:
            [min_bpm, max_bpm] or None if not found
        """
        # Primary pattern: **Tempo:** ... **XX–YY BPM**
        tempo_match = re.search(
            r'\*\*Tempo:\*\*[^\d]*(\d+)[–-](\d+)\s*BPM',
            content,
            re.IGNORECASE
        )

        if tempo_match:
            bpm_min = int(tempo_match.group(1))
            bpm_max = int(tempo_match.group(2))
            logger.debug(
                "tempo.extracted",
                bpm_min=bpm_min,
                bpm_max=bpm_max
            )
            return [bpm_min, bpm_max]

        # Fallback: Any "XX–YY BPM" pattern
        tempo_alt_match = re.search(
            r'(\d+)[–-](\d+)\s*BPM',
            content
        )

        if tempo_alt_match:
            bpm_min = int(tempo_alt_match.group(1))
            bpm_max = int(tempo_alt_match.group(2))
            return [bpm_min, bpm_max]

        logger.warning("tempo.not_found", message="No tempo range found in blueprint")
        return None

    def _extract_required_sections(self, content: str) -> List[str]:
        """Extract required song sections from markdown content.

        Patterns matched:
        - "**Form:** Verse → Chorus → Verse → Chorus → Bridge → Chorus"
        - "**Form:** **Verse → Pre‑Chorus → Chorus**"
        - "**Sections:** intro → hook → verse 1 → hook → verse 2 → hook"

        Args:
            content: Raw markdown content

        Returns:
            List of unique section names in order of first appearance
        """
        sections = []

        # Try "Form:" pattern first
        form_match = re.search(
            r'\*\*Form:\*\*[^\n]*',
            content,
            re.IGNORECASE
        )

        if form_match:
            form_text = form_match.group(0)
            # Extract section names (case-insensitive, handle hyphens and en-dashes)
            section_pattern = r'(Verse|Chorus|Bridge|Pre[‑-]?Chorus|Intro|Outro|Hook)'
            found_sections = re.findall(section_pattern, form_text, re.IGNORECASE)
            # Remove duplicates while preserving order
            sections = list(dict.fromkeys([s.title() for s in found_sections]))

        # Try "Sections:" pattern as fallback
        if not sections:
            sections_match = re.search(
                r'\*\*Sections:\*\*[^\n]*',
                content,
                re.IGNORECASE
            )

            if sections_match:
                sections_text = sections_match.group(0)
                section_pattern = r'(Verse|Chorus|Bridge|Pre[‑-]?Chorus|Intro|Outro|Hook)'
                found_sections = re.findall(section_pattern, sections_text, re.IGNORECASE)
                sections = list(dict.fromkeys([s.title() for s in found_sections]))

        # Default required sections (Verse + Chorus minimum)
        if not sections:
            sections = ["Verse", "Chorus"]
            logger.warning(
                "sections.default_used",
                message="No sections found, using default [Verse, Chorus]"
            )

        logger.debug("sections.extracted", sections=sections)
        return sections

    def _extract_length_constraints(self, content: str) -> Optional[List[float]]:
        """Extract song length constraints (minutes) from markdown content.

        Patterns matched:
        - "Most hits run **2.5–3.5 minutes**"
        - "Around **3–4 minutes**"

        Args:
            content: Raw markdown content

        Returns:
            [min_minutes, max_minutes] or None if not found
        """
        # Pattern: "X–Y minutes"
        length_match = re.search(
            r'(\d+\.?\d*)[–-](\d+\.?\d*)\s*minutes',
            content,
            re.IGNORECASE
        )

        if length_match:
            min_length = float(length_match.group(1))
            max_length = float(length_match.group(2))
            logger.debug(
                "length.extracted",
                min_minutes=min_length,
                max_minutes=max_length
            )
            return [min_length, max_length]

        return None

    def _extract_time_signature(self, content: str) -> str:
        """Extract time signature from markdown content.

        Args:
            content: Raw markdown content

        Returns:
            Time signature string (e.g., "4/4") or "4/4" as default
        """
        # Pattern: "4/4" or "6/8" etc.
        time_sig_match = re.search(
            r'\b(\d+/\d+)\b',
            content
        )

        if time_sig_match:
            return time_sig_match.group(1)

        # Default to 4/4
        return "4/4"

    def _extract_key_signatures(self, content: str) -> List[str]:
        """Extract common key signatures from markdown content.

        Patterns matched:
        - "Major keys (C, G, D, A)"
        - "Key & mode:** Both major and minor keys are common"
        - "Major keys prevail (F, B♭, E♭)"

        Args:
            content: Raw markdown content

        Returns:
            List of key signatures mentioned in the blueprint
        """
        keys = []

        # Search for key mentions in Key & mode section
        key_section_match = re.search(
            r'\*\*Key[^\n]*\*\*[^\n]*([^\n]+)',
            content,
            re.IGNORECASE
        )

        if key_section_match:
            key_text = key_section_match.group(0)
            # Extract keys with flats/sharps: C, G, D, A, F#, Bb, etc.
            key_pattern = r'\b([A-G][♭♯#b]?)\b'
            found_keys = re.findall(key_pattern, key_text)
            keys = list(dict.fromkeys(found_keys))  # Remove duplicates

        logger.debug("keys.extracted", keys=keys)
        return keys

    def _extract_lexicon_positive(self, content: str) -> List[str]:
        """Extract positive lexicon (preferred words/phrases) from markdown.

        Args:
            content: Raw markdown content

        Returns:
            List of preferred words/phrases
        """
        # For now, extract common themes mentioned in "Lyrical Patterns" section
        lexicon = []

        lyrical_match = re.search(
            r'##\s*Lyrical Patterns.*?##',
            content,
            re.IGNORECASE | re.DOTALL
        )

        if lyrical_match:
            lyrical_text = lyrical_match.group(0)
            # Extract quoted phrases
            phrases = re.findall(r'["""]([^"""]+)["""]', lyrical_text)
            lexicon.extend(phrases)

        return lexicon[:20]  # Limit to 20 entries

    def _extract_lexicon_negative(self, content: str) -> List[str]:
        """Extract negative lexicon (words to avoid) from markdown.

        Args:
            content: Raw markdown content

        Returns:
            List of words/phrases to avoid
        """
        # Look for "avoid" or "not" patterns
        avoid_patterns = re.findall(
            r'avoid[^.]*["""]([^"""]+)["""]',
            content,
            re.IGNORECASE
        )

        return avoid_patterns[:10]  # Limit to 10 entries

    def _create_default_rubric(self) -> Dict[str, Any]:
        """Create default evaluation rubric for blueprint.

        These are the standard AMCS rubric weights used across all genres
        unless specifically overridden in the blueprint markdown.

        Returns:
            Dict with weights and thresholds for evaluation
        """
        return {
            'weights': {
                'hook_density': 0.25,           # How many catchy hooks
                'singability': 0.20,            # How easy to sing/remember
                'rhyme_tightness': 0.15,        # Quality and consistency of rhyme
                'section_completeness': 0.20,   # All required sections present
                'profanity_score': 0.20         # Adherence to explicit policy
            },
            'thresholds': {
                'min_total': 0.75,              # Minimum total score to pass
                'max_profanity': 0.1            # Maximum profanity allowed
            }
        }

    def get_all_blueprint_genres(self) -> List[str]:
        """Get list of all available blueprint genre names.

        Returns:
            List of genre names (without _blueprint.md suffix)
        """
        if not self.BLUEPRINT_DIR.exists():
            logger.warning(
                "blueprint_dir.not_found",
                path=str(self.BLUEPRINT_DIR)
            )
            return []

        # Find all *_blueprint.md files
        blueprint_files = list(self.BLUEPRINT_DIR.glob("*_blueprint.md"))

        # Exclude addendum and general files
        excluded_keywords = ['addendum', 'general_fingerprint', 'comparative_matrix', 'design_checklists']

        genres = []
        for file_path in blueprint_files:
            filename = file_path.stem  # Remove .md extension

            # Skip excluded files
            if any(keyword in filename for keyword in excluded_keywords):
                continue

            # Extract genre name (remove _blueprint suffix)
            genre = filename.replace('_blueprint', '')
            genres.append(genre)

        logger.info(
            "blueprint.genres_discovered",
            count=len(genres),
            genres=genres
        )

        return sorted(genres)
