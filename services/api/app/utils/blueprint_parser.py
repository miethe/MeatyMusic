"""Blueprint markdown parser for genre blueprint files.

This module parses human-readable blueprint markdown files from
docs/hit_song_blueprint/AI/ and extracts structured data for database storage.

The parser handles varied markdown formats and extracts:
- Genre name and metadata
- Tempo ranges and musical parameters
- Section requirements
- Lexicon (preferred words/phrases)
- Tag conflict matrix
- Evaluation rubric with weights and thresholds
"""

import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import structlog

logger = structlog.get_logger(__name__)


class BlueprintParseError(Exception):
    """Raised when blueprint parsing fails."""
    pass


def _extract_tempo_range(text: str) -> Optional[Tuple[int, int]]:
    """Extract tempo range from text.

    Handles various formats:
    - "100-140 BPM"
    - "95–130 BPM" (en-dash)
    - "between 120–130 BPM"
    - "around 70–80 BPM"

    Args:
        text: Text containing tempo information

    Returns:
        Tuple of (min_bpm, max_bpm) or None if not found
    """
    # Pattern to match tempo ranges with various separators
    patterns = [
        r'(\d+)[\s]*[-–—]\s*(\d+)\s*BPM',  # Matches "100-140 BPM" or "100 – 140 BPM"
        r'between\s+(\d+)[\s]*[-–—]\s*(\d+)',  # Matches "between 120–130"
        r'around\s+(\d+)[\s]*[-–—]\s*(\d+)',  # Matches "around 70–80"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            min_bpm = int(match.group(1))
            max_bpm = int(match.group(2))
            return (min_bpm, max_bpm)

    # Try to find single BPM value and create range around it
    single_match = re.search(r'(\d+)\s*BPM', text)
    if single_match:
        bpm = int(single_match.group(1))
        # Create ±10 BPM range
        return (max(60, bpm - 10), min(200, bpm + 10))

    return None


def _extract_key_preferences(text: str) -> List[str]:
    """Extract key preferences from text.

    Args:
        text: Text containing key information

    Returns:
        List of preferred keys
    """
    keys = []

    # Pattern for major keys (C, D, E, F, G, A, B with optional sharps/flats)
    major_pattern = r'\b([A-G][♯♭#b]?)\s+major'
    major_matches = re.findall(major_pattern, text, re.IGNORECASE)
    keys.extend([f"{k.replace('#', '♯').replace('b', '♭')} major" for k in major_matches])

    # Pattern for minor keys
    minor_pattern = r'\b([A-G][♯♭#b]?)\s+minor'
    minor_matches = re.findall(minor_pattern, text, re.IGNORECASE)
    keys.extend([f"{k.replace('#', '♯').replace('b', '♭')} minor" for k in minor_matches])

    # Common shorthand like "Major keys (C, G, D, A)"
    major_list_pattern = r'Major keys?\s*\(?([A-G][♯♭#b]?(?:,\s*[A-G][♯♭#b]?)*)\)?'
    major_list_match = re.search(major_list_pattern, text, re.IGNORECASE)
    if major_list_match:
        key_list = major_list_match.group(1).split(',')
        keys.extend([f"{k.strip().replace('#', '♯').replace('b', '♭')} major" for k in key_list])

    return list(set(keys)) if keys else ["C major"]  # Default to C major


def _extract_section_requirements(text: str) -> List[str]:
    """Extract required sections from text.

    Args:
        text: Text containing section information

    Returns:
        List of required section names
    """
    sections = []

    # Look for common section names
    section_keywords = [
        "intro", "verse", "pre-chorus", "pre chorus", "prechorus",
        "chorus", "hook", "bridge", "outro", "drop", "build"
    ]

    text_lower = text.lower()

    for keyword in section_keywords:
        # Check if keyword appears in context suggesting it's required
        if re.search(rf'\b{keyword}\b', text_lower):
            # Normalize to title case
            normalized = keyword.replace("-", " ").replace("  ", " ").title()
            if normalized not in sections:
                sections.append(normalized)

    # Ensure minimum structure
    if "Verse" not in sections:
        sections.append("Verse")
    if "Chorus" not in sections:
        sections.append("Chorus")

    return sections


def _extract_lexicon(text: str, genre: str) -> Dict[str, List[str]]:
    """Extract lexicon (preferred words/phrases) from text.

    Args:
        text: Blueprint text content
        genre: Genre name for context

    Returns:
        Dictionary with positive and negative lexicon
    """
    lexicon = {
        "positive": [],
        "negative": []
    }

    # Genre-specific keyword extraction
    # This is a simplified approach - ideally would use NLP

    # Common positive indicators
    positive_patterns = [
        r'"([^"]+)"',  # Quoted phrases
        r'phrases?\s+(?:like|such as)\s+"([^"]+)"',
    ]

    for pattern in positive_patterns:
        matches = re.findall(pattern, text)
        lexicon["positive"].extend(matches)

    # Remove duplicates and limit size
    lexicon["positive"] = list(set(lexicon["positive"]))[:20]

    return lexicon


def _infer_eval_rubric(genre: str, text: str) -> Dict[str, Any]:
    """Infer evaluation rubric from genre and text.

    Since most blueprints don't have explicit rubrics, we create
    genre-appropriate defaults.

    Args:
        genre: Genre name
        text: Blueprint text for context

    Returns:
        Evaluation rubric with weights and thresholds
    """
    # Default weights
    default_weights = {
        "hook_density": 0.25,
        "singability": 0.25,
        "rhyme_tightness": 0.20,
        "section_completeness": 0.20,
        "profanity_score": 0.10,
    }

    # Genre-specific adjustments
    genre_lower = genre.lower()

    if "pop" in genre_lower or "christmas" in genre_lower:
        # Pop emphasizes hooks and singability
        default_weights = {
            "hook_density": 0.30,
            "singability": 0.25,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.15,
            "profanity_score": 0.15,
        }
    elif "hip-hop" in genre_lower or "hip hop" in genre_lower or "rap" in genre_lower:
        # Hip-hop emphasizes rhyme and flow
        default_weights = {
            "hook_density": 0.20,
            "singability": 0.15,
            "rhyme_tightness": 0.35,
            "section_completeness": 0.20,
            "profanity_score": 0.10,
        }
    elif "rock" in genre_lower or "punk" in genre_lower:
        # Rock emphasizes energy and structure
        default_weights = {
            "hook_density": 0.25,
            "singability": 0.20,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.25,
            "profanity_score": 0.15,
        }
    elif "country" in genre_lower:
        # Country emphasizes storytelling
        default_weights = {
            "hook_density": 0.25,
            "singability": 0.25,
            "rhyme_tightness": 0.20,
            "section_completeness": 0.20,
            "profanity_score": 0.10,
        }
    elif "r&b" in genre_lower or "rnb" in genre_lower:
        # R&B emphasizes vocals and melody
        default_weights = {
            "hook_density": 0.25,
            "singability": 0.30,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.20,
            "profanity_score": 0.10,
        }

    return {
        "weights": default_weights,
        "thresholds": {
            "min_total": 0.75,
            "max_profanity": 0.15
        }
    }


def _infer_conflict_matrix(genre: str) -> Dict[str, List[str]]:
    """Create genre-appropriate tag conflict matrix.

    Args:
        genre: Genre name

    Returns:
        Conflict matrix mapping tags to conflicting tags
    """
    # Common conflicts across all genres
    base_conflicts = {
        "whisper": ["anthemic", "powerful", "belting"],
        "anthemic": ["whisper", "intimate", "minimal"],
        "intimate": ["anthemic", "arena", "stadium"],
        "minimal": ["full instrumentation", "lush", "orchestral"],
        "dry mix": ["lush reverb", "cathedral", "spacious"],
        "1970s": ["2020s modern production", "hyperpop", "trap"],
        "acoustic": ["heavy synthesizers", "electronic"],
        "ballad": ["uptempo", "dance", "energetic"],
    }

    return base_conflicts


def _extract_genre_from_filename(filepath: Path) -> str:
    """Extract genre name from blueprint filename.

    Args:
        filepath: Path to blueprint markdown file

    Returns:
        Genre name in title case
    """
    # Remove _blueprint.md suffix and convert to title case
    filename = filepath.stem  # Gets filename without extension

    if filename.endswith("_blueprint"):
        genre_slug = filename[:-10]  # Remove "_blueprint"
    else:
        genre_slug = filename

    # Convert underscores to spaces and title case
    genre = genre_slug.replace("_", " ").title()

    # Special cases
    replacements = {
        "Hiphop": "Hip-Hop",
        "Hip Hop": "Hip-Hop",
        "Rnb": "R&B",
        "R&b": "R&B",
        "Ccm": "CCM",
        "Kpop": "K-Pop",
        "Edm": "EDM",
        "Pop Punk": "Pop-Punk",
    }

    for old, new in replacements.items():
        if old in genre:
            genre = genre.replace(old, new)

    return genre


def parse_blueprint_file(filepath: Path) -> Dict[str, Any]:
    """Parse a blueprint markdown file into structured data.

    Args:
        filepath: Path to blueprint markdown file

    Returns:
        Dictionary containing blueprint data ready for database insertion

    Raises:
        BlueprintParseError: If parsing fails
    """
    try:
        # Read file content
        content = filepath.read_text(encoding="utf-8")

        # Extract genre from filename
        genre = _extract_genre_from_filename(filepath)

        logger.info("blueprint_parser.parsing", filepath=str(filepath), genre=genre)

        # Extract tempo range
        tempo_range = _extract_tempo_range(content)
        if not tempo_range:
            # Fallback defaults by genre
            tempo_defaults = {
                "Pop": (100, 140),
                "Christmas": (100, 130),
                "Hip-Hop": (60, 100),
                "Rock": (110, 160),
                "Electronic": (120, 140),
                "Country": (70, 120),
                "R&B": (60, 90),
                "CCM": (80, 130),
                "K-Pop": (90, 140),
                "Latin": (90, 130),
                "Afrobeats": (100, 130),
                "Hyperpop": (140, 180),
                "Pop-Punk": (150, 200),
                "Indie": (90, 140),
            }
            tempo_range = tempo_defaults.get(genre, (80, 140))
            logger.warning(
                "blueprint_parser.tempo_not_found",
                genre=genre,
                using_default=tempo_range
            )

        # Extract other components
        key_preferences = _extract_key_preferences(content)
        section_requirements = _extract_section_requirements(content)
        lexicon = _extract_lexicon(content, genre)
        eval_rubric = _infer_eval_rubric(genre, content)
        conflict_matrix = _infer_conflict_matrix(genre)

        # Build rules dictionary
        rules = {
            "tempo_bpm": list(tempo_range),
            "key_preferences": key_preferences,
            "required_sections": section_requirements,
            "lexicon_positive": lexicon["positive"],
            "lexicon_negative": lexicon["negative"],
            "banned_terms": [],  # Can be populated from policy configs
        }

        # Build blueprint data structure
        blueprint_data = {
            "genre": genre,
            "version": "2025.11",  # Current version
            "rules": rules,
            "eval_rubric": eval_rubric,
            "conflict_matrix": conflict_matrix,
            "tag_categories": {
                "Era": ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
                "Genre": [genre],
                "Energy": ["low", "medium", "high", "anthemic"],
                "Vocal": ["whisper", "conversational", "belting", "rap"],
                "Mix": ["dry mix", "lush reverb", "minimal", "full"],
            },
            "extra_metadata": {
                "source_file": str(filepath.name),
                "description": f"{genre} music blueprint for hit song generation",
                "author": "MeatyMusic AMCS",
            }
        }

        logger.info(
            "blueprint_parser.success",
            genre=genre,
            tempo_range=tempo_range,
            sections_count=len(section_requirements),
            keys_count=len(key_preferences)
        )

        return blueprint_data

    except Exception as e:
        logger.error(
            "blueprint_parser.failed",
            filepath=str(filepath),
            error=str(e),
            exc_info=True
        )
        raise BlueprintParseError(f"Failed to parse {filepath}: {e}") from e


def parse_all_blueprints(blueprint_dir: Path) -> List[Dict[str, Any]]:
    """Parse all blueprint markdown files in a directory.

    Args:
        blueprint_dir: Path to directory containing blueprint markdown files

    Returns:
        List of parsed blueprint data dictionaries
    """
    blueprints = []
    errors = []

    # Find all *_blueprint.md files
    pattern = "*_blueprint.md"
    files = sorted(blueprint_dir.glob(pattern))

    if not files:
        logger.warning(
            "blueprint_parser.no_files",
            directory=str(blueprint_dir),
            pattern=pattern
        )
        return []

    logger.info(
        "blueprint_parser.parsing_directory",
        directory=str(blueprint_dir),
        file_count=len(files)
    )

    for filepath in files:
        try:
            blueprint_data = parse_blueprint_file(filepath)
            blueprints.append(blueprint_data)
        except BlueprintParseError as e:
            errors.append({"file": str(filepath), "error": str(e)})
            logger.error("blueprint_parser.file_failed", filepath=str(filepath), error=str(e))
            continue

    logger.info(
        "blueprint_parser.complete",
        parsed_count=len(blueprints),
        error_count=len(errors),
        errors=errors if errors else None
    )

    return blueprints
