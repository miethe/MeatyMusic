"""Shared validation utilities for MeatyMusic AMCS services.

This module provides common validation utilities used across all entity services
(lyrics, persona, producer_notes, blueprint, source). All utilities are designed
for determinism - same inputs produce same outputs for reproducibility.

Key utilities:
- Citation hash computation (SHA-256)
- Rhyme scheme validation
- Weight normalization
- Explicit content filtering
- Section order validation
- Syllable counting for meter validation
"""

from __future__ import annotations

import hashlib
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple, Type
from uuid import UUID

import structlog
from pydantic import BaseModel

logger = structlog.get_logger(__name__)


# =============================================================================
# Citation Hash Computation (Deterministic)
# =============================================================================


def compute_citation_hash(
    source_id: UUID,
    chunk_text: str,
    timestamp: Optional[datetime] = None
) -> str:
    """Compute deterministic SHA-256 hash for citation tracking.

    This hash ensures reproducibility for source citations. The same source_id,
    chunk_text, and timestamp will ALWAYS produce the same hash, enabling
    deterministic retrieval-augmented generation.

    Args:
        source_id: UUID of the source
        chunk_text: The actual text content of the chunk
        timestamp: Optional timestamp for pinned retrieval (ISO format recommended)

    Returns:
        Hex string of SHA-256 hash (64 characters)

    Example:
        >>> from uuid import uuid4
        >>> source_id = uuid4()
        >>> hash1 = compute_citation_hash(source_id, "test chunk")
        >>> hash2 = compute_citation_hash(source_id, "test chunk")
        >>> assert hash1 == hash2  # Deterministic!

    Note:
        This function is CRITICAL for determinism compliance (99%+ reproducibility).
        Any modification must maintain deterministic behavior.
    """
    # Normalize inputs for determinism
    source_id_str = str(source_id)
    chunk_text_normalized = chunk_text.strip()
    timestamp_str = timestamp.isoformat() if timestamp else ""

    # Create deterministic hash input
    hash_input = f"{source_id_str}|{chunk_text_normalized}|{timestamp_str}"

    # Compute SHA-256 hash
    hash_bytes = hashlib.sha256(hash_input.encode('utf-8')).digest()
    hash_hex = hash_bytes.hex()

    logger.debug(
        "citation_hash.computed",
        source_id=source_id_str,
        chunk_length=len(chunk_text_normalized),
        has_timestamp=bool(timestamp),
        hash_prefix=hash_hex[:8]
    )

    return hash_hex


def compute_citation_batch_hash(
    citations: List[Dict[str, any]]
) -> str:
    """Compute combined hash for a list of citations.

    Useful for verifying that the entire citation set matches expectations
    during determinism testing.

    Args:
        citations: List of citation dicts with source_id, chunk_text, timestamp

    Returns:
        Combined SHA-256 hash of all citations

    Example:
        >>> citations = [
        ...     {"source_id": uuid1, "chunk_text": "chunk1"},
        ...     {"source_id": uuid2, "chunk_text": "chunk2"}
        ... ]
        >>> batch_hash = compute_citation_batch_hash(citations)
    """
    # Sort citations by hash for determinism
    citation_hashes = []
    for citation in citations:
        hash_val = compute_citation_hash(
            citation["source_id"],
            citation["chunk_text"],
            citation.get("timestamp")
        )
        citation_hashes.append(hash_val)

    # Sort hashes for deterministic ordering
    citation_hashes.sort()

    # Combine into single hash
    combined = "|".join(citation_hashes)
    batch_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()

    logger.debug(
        "citation_batch_hash.computed",
        citation_count=len(citations),
        batch_hash_prefix=batch_hash[:8]
    )

    return batch_hash


# =============================================================================
# Rhyme Scheme Validation
# =============================================================================


def validate_rhyme_scheme(scheme: str) -> bool:
    """Validate rhyme scheme format.

    A valid rhyme scheme consists of uppercase letters A-Z with contiguous
    lettering (A, then B, then C, etc. - no skipping).

    Args:
        scheme: Rhyme scheme string (e.g., "AABB", "ABAB", "ABCB")

    Returns:
        True if valid rhyme scheme format, False otherwise

    Valid formats:
        - Only uppercase letters A-Z
        - Contiguous lettering starting from A
        - Examples: "AABB", "ABAB", "ABCB", "AAAA", "ABCABC"

    Invalid formats:
        - "ACBB" (skips B before C)
        - "aabb" (lowercase)
        - "A1B2" (contains numbers)
        - "" (empty)

    Example:
        >>> validate_rhyme_scheme("AABB")
        True
        >>> validate_rhyme_scheme("ABCB")
        True
        >>> validate_rhyme_scheme("ACBB")
        False
    """
    if not scheme or not isinstance(scheme, str):
        return False

    # Must be uppercase letters only
    if not re.match(r'^[A-Z]+$', scheme):
        return False

    # Check for contiguous lettering
    unique_letters = []
    for letter in scheme:
        if letter not in unique_letters:
            unique_letters.append(letter)

    # Verify contiguous: A, B, C... (no skipping)
    expected = 'A'
    for letter in unique_letters:
        if letter != expected:
            logger.debug(
                "rhyme_scheme.invalid_contiguous",
                scheme=scheme,
                expected=expected,
                found=letter
            )
            return False
        expected = chr(ord(expected) + 1)

    return True


def parse_rhyme_scheme(text: str, scheme: str) -> Dict[str, List[str]]:
    """Parse text into rhyme groups based on scheme.

    Splits lyrics text into lines and groups them according to the rhyme
    scheme pattern. Useful for validating rhyme adherence.

    Args:
        text: Lyrics text (newline-separated lines)
        scheme: Rhyme scheme (e.g., "AABB")

    Returns:
        Dict mapping rhyme group letter to lines
        Example: {"A": ["line1", "line2"], "B": ["line3", "line4"]}

    Example:
        >>> text = "Line 1\\nLine 2\\nLine 3\\nLine 4"
        >>> parse_rhyme_scheme(text, "AABB")
        {"A": ["Line 1", "Line 2"], "B": ["Line 3", "Line 4"]}

    Note:
        If text has fewer lines than scheme length, remaining lines are ignored.
        If text has more lines than scheme length, scheme pattern repeats.
    """
    if not validate_rhyme_scheme(scheme):
        logger.warning("rhyme_scheme.parse_invalid_scheme", scheme=scheme)
        return {}

    lines = [line.strip() for line in text.split('\n') if line.strip()]
    groups: Dict[str, List[str]] = {}

    for i, line in enumerate(lines):
        # Get rhyme letter for this line (repeat scheme if needed)
        rhyme_letter = scheme[i % len(scheme)]

        if rhyme_letter not in groups:
            groups[rhyme_letter] = []
        groups[rhyme_letter].append(line)

    logger.debug(
        "rhyme_scheme.parsed",
        scheme=scheme,
        line_count=len(lines),
        group_count=len(groups)
    )

    return groups


def extract_rhyme_endings(lines: List[str]) -> List[str]:
    """Extract last words from lines for rhyme analysis.

    Args:
        lines: List of text lines

    Returns:
        List of last words (lowercase, alphanumeric only)

    Example:
        >>> extract_rhyme_endings(["The cat in the hat", "Sitting on a mat"])
        ["hat", "mat"]
    """
    endings = []
    for line in lines:
        # Remove punctuation and get last word
        words = re.findall(r'\b\w+\b', line.lower())
        if words:
            endings.append(words[-1])
    return endings


def check_rhyme_similarity(word1: str, word2: str) -> float:
    """Check phonetic similarity between two words (simple heuristic).

    This is a basic implementation that checks suffix similarity.
    For production, consider using a phonetic library like pronouncing or epitran.

    Args:
        word1: First word
        word2: Second word

    Returns:
        Similarity score 0.0-1.0 (1.0 = likely rhyme)

    Example:
        >>> check_rhyme_similarity("cat", "hat")
        1.0  # Perfect suffix match
        >>> check_rhyme_similarity("love", "dove")
        1.0
        >>> check_rhyme_similarity("cat", "dog")
        0.0
    """
    word1 = word1.lower()
    word2 = word2.lower()

    # Exact match
    if word1 == word2:
        return 1.0

    # Check suffix match (2-3 characters)
    min_suffix = 2
    max_suffix = min(len(word1), len(word2), 3)

    for suffix_len in range(max_suffix, min_suffix - 1, -1):
        if word1[-suffix_len:] == word2[-suffix_len:]:
            return 1.0 if suffix_len >= 2 else 0.5

    return 0.0


# =============================================================================
# Weight Normalization
# =============================================================================


def normalize_weights(
    weights: Dict[str, float],
    max_sum: float = 1.0
) -> Dict[str, float]:
    """Normalize weights to sum to max_sum or less.

    Ensures source citation weights comply with constraints while preserving
    relative proportions. Useful for normalizing retrieval source weights.

    Args:
        weights: Dict mapping source_id to weight
        max_sum: Maximum sum of weights (default 1.0)

    Returns:
        Normalized weights dict with same keys

    Example:
        >>> normalize_weights({"a": 0.5, "b": 0.8})
        {"a": 0.385, "b": 0.615}  # Now sums to 1.0

        >>> normalize_weights({"a": 0.3, "b": 0.4}, max_sum=1.0)
        {"a": 0.3, "b": 0.4}  # Already ≤1.0, no change

    Note:
        Returns empty dict if input weights are invalid or sum to 0.
    """
    if not weights:
        return {}

    # Remove negative or zero weights
    valid_weights = {k: v for k, v in weights.items() if v > 0}

    if not valid_weights:
        logger.warning("normalize_weights.all_invalid", original=weights)
        return {}

    current_sum = sum(valid_weights.values())

    # If already within bounds, return as-is
    if current_sum <= max_sum:
        logger.debug(
            "normalize_weights.already_valid",
            current_sum=current_sum,
            max_sum=max_sum
        )
        return valid_weights

    # Normalize to max_sum
    scale_factor = max_sum / current_sum
    normalized = {
        k: round(v * scale_factor, 6)  # Round to 6 decimals
        for k, v in valid_weights.items()
    }

    logger.debug(
        "normalize_weights.normalized",
        original_sum=current_sum,
        new_sum=sum(normalized.values()),
        scale_factor=scale_factor,
        source_count=len(normalized)
    )

    return normalized


# =============================================================================
# Explicit Content Filtering
# =============================================================================

import json
import os
from pathlib import Path


class ProfanityFilter:
    """Comprehensive profanity filter with l33t speak detection and scoring.

    Features:
    - Category-based scoring (mild: 0.3, moderate: 0.6, severe: 1.0)
    - L33t speak detection (e.g., "sh1t" → "shit")
    - Word boundary detection (avoids false positives like "class" in "classic")
    - Case-insensitive matching
    - Detailed violation context with line numbers
    - Common variation detection

    This implementation ensures deterministic behavior for reproducible results.
    """

    def __init__(self):
        """Initialize profanity filter by loading word lists from JSON."""
        self._categories: Dict[str, Dict[str, Any]] = {}
        self._word_to_category: Dict[str, Tuple[str, float]] = {}
        self._l33t_mappings: Dict[str, List[str]] = {}
        self._variations: Dict[str, List[str]] = {}
        self._loaded = False
        self._load_profanity_lists()

    def _load_profanity_lists(self) -> None:
        """Load profanity lists from JSON file."""
        try:
            # Find the profanity lists JSON file
            current_dir = Path(__file__).parent.parent
            json_path = current_dir / "data" / "profanity_lists.json"

            if not json_path.exists():
                logger.warning(
                    "profanity_filter.json_not_found",
                    path=str(json_path),
                    using_fallback=True
                )
                self._load_fallback_lists()
                return

            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Load categories with words and scores
            self._categories = data.get("categories", {})

            # Build word-to-category mapping for fast lookup
            for category_name, category_data in self._categories.items():
                score = category_data.get("score", 0.5)
                words = category_data.get("words", [])

                for word in words:
                    word_lower = word.lower().strip()
                    if word_lower:
                        self._word_to_category[word_lower] = (category_name, score)

            # Load l33t speak mappings
            self._l33t_mappings = data.get("l33t_speak_mappings", {})

            # Load common variations
            self._variations = data.get("common_variations", {})

            self._loaded = True

            logger.info(
                "profanity_filter.loaded",
                total_words=len(self._word_to_category),
                categories=list(self._categories.keys()),
                l33t_mappings=len(self._l33t_mappings),
                variations=len(self._variations)
            )

        except Exception as e:
            logger.error(
                "profanity_filter.load_failed",
                error=str(e),
                exc_info=True
            )
            self._load_fallback_lists()

    def _load_fallback_lists(self) -> None:
        """Load minimal fallback profanity list if JSON loading fails."""
        fallback_words = {
            "mild": ["ass", "damn", "hell", "crap", "piss"],
            "moderate": ["shit", "bitch", "dick", "cock", "pussy"],
            "severe": ["fuck", "cunt", "motherfucker", "nigger"]
        }

        scores = {"mild": 0.3, "moderate": 0.6, "severe": 1.0}

        for category, words in fallback_words.items():
            score = scores[category]
            for word in words:
                self._word_to_category[word.lower()] = (category, score)

        self._loaded = True
        logger.warning("profanity_filter.using_fallback", word_count=len(self._word_to_category))

    def _normalize_l33t_speak(self, text: str) -> str:
        """Convert l33t speak to normal text.

        Args:
            text: Text potentially containing l33t speak

        Returns:
            Normalized text with l33t speak converted

        Example:
            >>> _normalize_l33t_speak("sh1t")
            "shit"
            >>> _normalize_l33t_speak("f@ck")
            "fuck"
        """
        normalized = text.lower()

        # Replace l33t speak characters with their letter equivalents
        replacements = {
            '@': 'a', '4': 'a', '^': 'a',
            '3': 'e',
            '1': 'i', '!': 'i', '|': 'i',
            '0': 'o',
            '$': 's', '5': 's', 'z': 's',
            '7': 't', '+': 't',
            '9': 'g', '6': 'g',
            '8': 'b',
            '<': 'c', '(': 'c',
            '#': 'h',
        }

        for l33t_char, normal_char in replacements.items():
            normalized = normalized.replace(l33t_char, normal_char)

        return normalized

    def _check_word_variations(self, word: str) -> Optional[Tuple[str, str, float]]:
        """Check if word matches any known variations.

        Args:
            word: Word to check

        Returns:
            Tuple of (base_word, category, score) if match found, None otherwise
        """
        word_lower = word.lower()

        # Check exact match first
        if word_lower in self._word_to_category:
            category, score = self._word_to_category[word_lower]
            return (word_lower, category, score)

        # Check common variations
        for base_word, variations in self._variations.items():
            if word_lower in variations or word_lower == base_word:
                if base_word in self._word_to_category:
                    category, score = self._word_to_category[base_word]
                    return (base_word, category, score)

        return None

    def check_text(
        self,
        text: str,
        explicit_allowed: bool = False
    ) -> "ProfanityCheckResult":
        """Check text for profanity with detailed violation reporting.

        Args:
            text: Text to check for profanity
            explicit_allowed: Whether explicit content is allowed

        Returns:
            ProfanityCheckResult with violations, scores, and metadata

        Example:
            >>> result = filter.check_text("This is some shit")
            >>> result.is_clean
            False
            >>> result.total_score
            0.6
            >>> len(result.violations)
            1
        """
        from app.schemas.common import ProfanityCheckResult, ProfanityViolation

        if not self._loaded:
            logger.warning("profanity_filter.not_loaded")
            return ProfanityCheckResult(
                is_clean=True,
                violations=[],
                total_score=0.0,
                max_score=0.0,
                violation_count=0,
                categories_found=[]
            )

        violations: List[ProfanityViolation] = []
        lines = text.split('\n')

        for line_num, line in enumerate(lines, start=1):
            # Normalize l33t speak
            normalized_line = self._normalize_l33t_speak(line)

            # Extract words with word boundaries
            words = re.findall(r'\b\w+\b', normalized_line)
            original_words = re.findall(r'\b\w+\b', line.lower())

            for i, (word, orig_word) in enumerate(zip(words, original_words)):
                # Check for profanity match
                match = self._check_word_variations(word)

                if match:
                    base_word, category, score = match

                    # Calculate position in line
                    position = line.lower().find(orig_word)

                    # Extract context (30 chars before and after)
                    context_start = max(0, position - 30)
                    context_end = min(len(line), position + len(orig_word) + 30)
                    context = line[context_start:context_end].strip()
                    if context_start > 0:
                        context = "..." + context
                    if context_end < len(line):
                        context = context + "..."

                    violation = ProfanityViolation(
                        word=orig_word,
                        category=category,
                        score=score,
                        line_number=line_num,
                        context=context,
                        position=position
                    )

                    violations.append(violation)

        # Calculate scores
        total_score = sum(v.score for v in violations)
        max_score = max((v.score for v in violations), default=0.0)
        violation_count = len(violations)
        categories_found = list(set(v.category for v in violations))

        # Determine if clean
        is_clean = (violation_count == 0) or explicit_allowed

        result = ProfanityCheckResult(
            is_clean=is_clean,
            violations=violations,
            total_score=total_score,
            max_score=max_score,
            violation_count=violation_count,
            categories_found=categories_found
        )

        logger.debug(
            "profanity_filter.checked",
            text_length=len(text),
            line_count=len(lines),
            violation_count=violation_count,
            total_score=total_score,
            is_clean=is_clean,
            explicit_allowed=explicit_allowed
        )

        return result


# Global profanity filter instance
_profanity_filter: Optional[ProfanityFilter] = None


def get_profanity_filter() -> ProfanityFilter:
    """Get or create global profanity filter instance.

    Returns:
        Global ProfanityFilter instance
    """
    global _profanity_filter

    if _profanity_filter is None:
        _profanity_filter = ProfanityFilter()

    return _profanity_filter


async def check_explicit_content(
    text: str,
    explicit_allowed: bool = False
) -> Tuple[bool, List[str]]:
    """Check text for explicit content (legacy interface).

    This function maintains backward compatibility with existing code.
    For new code, use get_profanity_filter().check_text() directly.

    Args:
        text: Text to check
        explicit_allowed: Whether explicit content is allowed

    Returns:
        (is_clean, violations_found)
        - is_clean: True if passes check (no violations OR explicit_allowed=True)
        - violations_found: List of detected explicit terms

    Example:
        >>> await check_explicit_content("Hello world", explicit_allowed=False)
        (True, [])

        >>> await check_explicit_content("This is shit", explicit_allowed=False)
        (False, ["shit"])

        >>> await check_explicit_content("This is shit", explicit_allowed=True)
        (True, ["shit"])  # Allowed, but violations still reported
    """
    profanity_filter = get_profanity_filter()
    result = profanity_filter.check_text(text, explicit_allowed)

    # Convert to legacy format
    violations = [v.word for v in result.violations]
    # Remove duplicates while preserving order
    violations = list(dict.fromkeys(violations))

    return result.is_clean, violations


def add_profanity_terms(terms: List[str]) -> None:
    """Add additional terms to profanity filter.

    Note: This function is deprecated. Modify profanity_lists.json instead.

    Args:
        terms: List of terms to add (will be lowercased)
    """
    logger.warning(
        "profanity_filter.add_terms_deprecated",
        message="add_profanity_terms() is deprecated. Modify profanity_lists.json instead."
    )


def get_profanity_list() -> Set[str]:
    """Get current profanity filter list.

    Returns:
        Set of profanity terms (lowercase)
    """
    profanity_filter = get_profanity_filter()
    return set(profanity_filter._word_to_category.keys())


# =============================================================================
# Section Validation
# =============================================================================


def validate_section_order(
    section_order: List[str],
    required_sections: Optional[List[str]] = None
) -> Tuple[bool, Optional[str]]:
    """Validate section order for lyrics.

    Ensures lyrics have proper structure with required sections.

    Args:
        section_order: List of section names (e.g., ["Verse", "Chorus", "Bridge"])
        required_sections: Optional list of required section names (case-insensitive)

    Returns:
        (is_valid, error_message)
        - is_valid: True if validation passes
        - error_message: None if valid, error string if invalid

    Validation rules:
        1. At least one "Chorus" (case-insensitive)
        2. All required_sections present if specified
        3. Sections are non-empty strings
        4. No None/null values

    Example:
        >>> validate_section_order(["Verse", "Chorus", "Verse", "Chorus"])
        (True, None)

        >>> validate_section_order(["Verse", "Bridge"])
        (False, "Missing required section: Chorus")

        >>> validate_section_order(
        ...     ["Verse", "Chorus"],
        ...     required_sections=["Verse", "Chorus", "Bridge"]
        ... )
        (False, "Missing required section: Bridge")
    """
    if not section_order or not isinstance(section_order, list):
        return False, "section_order must be a non-empty list"

    # Check for non-empty strings
    for section in section_order:
        if not section or not isinstance(section, str) or not section.strip():
            return False, "All sections must be non-empty strings"

    # Normalize for comparison
    section_order_lower = [s.lower().strip() for s in section_order]

    # Rule 1: Must have at least one Chorus
    if "chorus" not in section_order_lower:
        return False, "Missing required section: Chorus"

    # Rule 2: Check required sections
    if required_sections:
        required_lower = [s.lower().strip() for s in required_sections]
        for required in required_lower:
            if required not in section_order_lower:
                # Find original case for error message
                original = next(
                    (s for s in required_sections if s.lower().strip() == required),
                    required
                )
                return False, f"Missing required section: {original}"

    logger.debug(
        "section_order.validated",
        section_count=len(section_order),
        has_chorus=True,
        required_count=len(required_sections) if required_sections else 0
    )

    return True, None


def extract_sections(lyrics_text: str) -> Dict[str, List[str]]:
    """Extract sections from lyrics with section markers.

    Parses lyrics text with section markers like [Verse], [Chorus], [Bridge]
    and returns organized section data.

    Args:
        lyrics_text: Complete lyrics with section markers

    Returns:
        Dictionary mapping section names to lists of lines

    Example:
        >>> text = '''
        ... [Verse]
        ... Line 1
        ... Line 2
        ... [Chorus]
        ... Hook line
        ... '''
        >>> extract_sections(text)
        {"Verse": ["Line 1", "Line 2"], "Chorus": ["Hook line"]}

    Note:
        Section markers should be in format [SectionName] or [Section Name]
    """
    sections = {}
    current_section = None
    current_lines = []

    for line in lyrics_text.split("\n"):
        # Check for section marker: [Verse], [Chorus], etc.
        match = re.match(r'\[([^\]]+)\]', line.strip())
        if match:
            # Save previous section
            if current_section and current_lines:
                sections[current_section] = current_lines

            # Start new section
            current_section = match.group(1).strip()
            current_lines = []
        elif line.strip() and current_section:
            # Add line to current section
            current_lines.append(line.strip())

    # Save last section
    if current_section and current_lines:
        sections[current_section] = current_lines

    logger.debug(
        "sections.extracted",
        section_count=len(sections),
        sections=list(sections.keys())
    )

    return sections


# =============================================================================
# Syllable Counting (for Meter Validation)
# =============================================================================


def count_syllables(line: str) -> int:
    """Count syllables in a line of text.

    Uses vowel cluster detection heuristic. This is an approximation suitable
    for meter validation but not linguistically perfect.

    Args:
        line: Text line

    Returns:
        Approximate syllable count

    Example:
        >>> count_syllables("The cat in the hat")
        5
        >>> count_syllables("Beautiful")
        3

    Algorithm:
        1. Count vowel groups (ae, io, uy)
        2. Subtract silent 'e' at end
        3. Handle special cases (y as vowel)
        4. Minimum 1 syllable per word

    Note:
        This is an approximation. For production, consider using a
        phonetic library like pyphen or syllables for better accuracy.
    """
    if not line or not line.strip():
        return 0

    words = re.findall(r'\b\w+\b', line.lower())
    total_syllables = 0

    for word in words:
        total_syllables += _count_word_syllables(word)

    return total_syllables


def _count_word_syllables(word: str) -> int:
    """Count syllables in a single word.

    Helper function for count_syllables(). Uses vowel cluster heuristic.

    Args:
        word: Single word (lowercase)

    Returns:
        Syllable count (minimum 1)
    """
    word = word.lower().strip()

    if not word:
        return 0

    vowels = "aeiouy"
    syllable_count = 0
    previous_was_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel

    # Adjust for silent 'e'
    if word.endswith("e") and syllable_count > 1:
        syllable_count -= 1

    # Handle special cases
    if word.endswith("le") and len(word) > 2 and word[-3] not in vowels:
        syllable_count += 1

    # Minimum of 1 syllable per word
    return max(1, syllable_count)


def calculate_syllable_consistency(lines: List[str]) -> float:
    """Calculate syllable consistency across lines.

    Measures how consistent syllable counts are across lines. Useful for
    validating singability and meter adherence.

    Args:
        lines: List of text lines

    Returns:
        Consistency score 0.0-1.0
        - 1.0 = perfect consistency (all lines same syllable count)
        - 0.0 = maximum variance

    Example:
        >>> calculate_syllable_consistency([
        ...     "The cat in the hat",  # 5 syllables
        ...     "Sat on the mat",       # 4 syllables
        ...     "Wearing a bat"          # 5 syllables
        ... ])
        0.866  # High consistency (5, 4, 5)
    """
    if not lines:
        return 0.0

    syllable_counts = [count_syllables(line) for line in lines]

    if not syllable_counts:
        return 0.0

    # Calculate mean
    mean_count = sum(syllable_counts) / len(syllable_counts)

    # Calculate variance
    variance = sum((c - mean_count) ** 2 for c in syllable_counts) / len(syllable_counts)
    std_dev = variance ** 0.5

    # Normalize to 0-1 scale (assume max acceptable std_dev = 2)
    max_std_dev = 2.0
    consistency = max(0.0, 1.0 - (std_dev / max_std_dev))

    logger.debug(
        "syllable_consistency.calculated",
        line_count=len(lines),
        mean_syllables=round(mean_count, 1),
        std_dev=round(std_dev, 2),
        consistency=round(consistency, 3)
    )

    return consistency


# =============================================================================
# DTO Transformation Helpers
# =============================================================================


def format_error_response(
    error: Exception,
    status_code: int = 500,
    operation: Optional[str] = None,
    entity_id: Optional[UUID] = None
) -> Dict[str, Any]:
    """Format exception as ErrorResponse envelope.

    Converts exceptions to standardized error response format with proper
    error codes, messages, and context for API responses.

    Args:
        error: The exception that occurred
        status_code: HTTP status code (default 500)
        operation: Operation name (e.g., "create_lyrics", "update_style")
        entity_id: Optional entity ID for context

    Returns:
        Dict matching ErrorResponse schema with error details

    Error Code Mapping:
        - ValidationError / ValueError → VALIDATION_FAILED
        - NotFoundError → NOT_FOUND
        - ConflictError → CONFLICT
        - UnauthorizedError / PermissionError → UNAUTHORIZED
        - SQLAlchemyError → DATABASE_ERROR
        - Other → INTERNAL_ERROR

    Example:
        >>> try:
        ...     entity = await service.create(data)
        ... except ValueError as e:
        ...     return format_error_response(
        ...         e,
        ...         status_code=400,
        ...         operation="create_lyrics",
        ...         entity_id=song_id
        ...     )
        {
            "error": {
                "type": "ValidationError",
                "message": "Section order must contain Chorus",
                "code": "VALIDATION_FAILED",
                "details": {
                    "operation": "create_lyrics",
                    "entity_id": "uuid",
                    "trace_id": "xyz"
                }
            }
        }

    Note:
        Automatically extracts trace_id from OpenTelemetry context if available.
        Sanitizes sensitive information from error messages.
    """
    from opentelemetry import trace

    # Determine error type and code
    error_type = type(error).__name__
    error_code = _map_exception_to_code(error, status_code)

    # Build error details
    details: Dict[str, Any] = {}

    if operation:
        details["operation"] = operation

    if entity_id:
        details["entity_id"] = str(entity_id)

    # Extract trace_id from OpenTelemetry if available
    try:
        current_span = trace.get_current_span()
        if current_span and current_span.is_recording():
            span_context = current_span.get_span_context()
            if span_context.trace_id:
                details["trace_id"] = f"{span_context.trace_id:032x}"
    except Exception:
        # Silently fail if trace extraction fails
        pass

    # Sanitize error message
    error_message = _sanitize_error_message(str(error))

    # Build response envelope
    response = {
        "error": {
            "type": error_type,
            "message": error_message,
            "code": error_code,
            "details": details if details else None
        }
    }

    logger.debug(
        "error_response.formatted",
        error_type=error_type,
        error_code=error_code,
        status_code=status_code,
        has_trace_id="trace_id" in details
    )

    return response


def _map_exception_to_code(error: Exception, status_code: int) -> str:
    """Map exception type to error code.

    Args:
        error: The exception
        status_code: HTTP status code

    Returns:
        Error code string
    """
    error_type = type(error).__name__

    # Validation errors
    if "validation" in error_type.lower() or isinstance(error, ValueError):
        return "VALIDATION_FAILED"

    # Not found errors
    if "notfound" in error_type.lower() or status_code == 404:
        return "NOT_FOUND"

    # Conflict errors
    if "conflict" in error_type.lower() or status_code == 409:
        return "CONFLICT"

    # Authorization errors
    if "unauthorized" in error_type.lower() or isinstance(error, PermissionError):
        return "UNAUTHORIZED"

    if "forbidden" in error_type.lower() or status_code == 403:
        return "FORBIDDEN"

    # Database errors
    if "sqlalchemy" in error_type.lower() or "database" in error_type.lower():
        return "DATABASE_ERROR"

    # Default to internal error
    return "INTERNAL_ERROR"


def _sanitize_error_message(message: str) -> str:
    """Remove sensitive information from error messages.

    Args:
        message: Original error message

    Returns:
        Sanitized error message
    """
    # Remove common sensitive patterns
    import re

    # Remove UUIDs that might expose internal structure
    sanitized = re.sub(
        r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
        '[UUID]',
        message,
        flags=re.IGNORECASE
    )

    # Remove file paths
    sanitized = re.sub(r'/[a-zA-Z0-9_/\-\.]+\.py', '[file]', sanitized)

    # Remove connection strings
    sanitized = re.sub(
        r'(postgresql|mysql|sqlite)://[^\s]+',
        '[connection_string]',
        sanitized
    )

    return sanitized


def create_page_response(
    items: List[Any],
    total: int,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """Create paginated response envelope with offset pagination.

    Args:
        items: List of items for current page
        total: Total count of items
        page: Current page number (1-indexed)
        page_size: Items per page

    Returns:
        Dict with items and pageInfo:
        {
            "items": [...],
            "pageInfo": {
                "total": 100,
                "page": 1,
                "pageSize": 20,
                "totalPages": 5,
                "hasNext": true,
                "hasPrev": false
            }
        }

    Example:
        >>> items = [style1, style2, style3]
        >>> response = create_page_response(items, total=100, page=1, page_size=20)
        >>> response["pageInfo"]["totalPages"]
        5
    """
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    # Determine if there are more pages
    has_next = page < total_pages
    has_prev = page > 1

    page_info = {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": total_pages,
        "hasNext": has_next,
        "hasPrev": has_prev
    }

    response = {
        "items": items,
        "pageInfo": page_info
    }

    logger.debug(
        "page_response.created",
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        item_count=len(items)
    )

    return response


def create_cursor_response(
    items: List[Any],
    cursor: Optional[str] = None,
    has_next: bool = False
) -> Dict[str, Any]:
    """Create cursor-based pagination response.

    Args:
        items: List of items
        cursor: Next page cursor (base64-encoded)
        has_next: Whether there are more items

    Returns:
        Dict with items and pageInfo:
        {
            "items": [...],
            "pageInfo": {
                "cursor": "base64string",
                "hasNext": true
            }
        }

    Example:
        >>> items = [lyrics1, lyrics2, lyrics3]
        >>> cursor = encode_cursor({"id": lyrics3.id, "timestamp": lyrics3.created_at})
        >>> response = create_cursor_response(items, cursor=cursor, has_next=True)
    """
    page_info = {
        "cursor": cursor,
        "hasNext": has_next
    }

    response = {
        "items": items,
        "pageInfo": page_info
    }

    logger.debug(
        "cursor_response.created",
        item_count=len(items),
        has_cursor=cursor is not None,
        has_next=has_next
    )

    return response


def convert_models_to_dtos(
    models: List[Any],
    dto_class: Type[BaseModel],
    on_error: str = "skip"
) -> List[BaseModel]:
    """Convert list of ORM models to DTOs with error handling.

    Provides efficient batch conversion with configurable error handling
    for robust DTO transformation in service layers.

    Args:
        models: List of ORM model instances
        dto_class: Pydantic model class for DTOs
        on_error: How to handle conversion errors:
            - "skip": Skip failed conversions, log warning (default)
            - "raise": Raise first error encountered
            - "none": Replace failed conversions with None

    Returns:
        List of DTO instances

    Raises:
        ValueError: If on_error="raise" and conversion fails

    Example:
        >>> lyrics_models = await repo.get_by_song(song_id)
        >>> lyrics_dtos = convert_models_to_dtos(
        ...     lyrics_models,
        ...     LyricsResponse,
        ...     on_error="skip"
        ... )

    Note:
        When on_error="skip", the returned list may be shorter than the
        input list if some conversions fail.
    """
    if not models:
        return []

    if on_error not in ("skip", "raise", "none"):
        logger.warning(
            "dto_conversion.invalid_on_error",
            on_error=on_error,
            defaulting_to="skip"
        )
        on_error = "skip"

    results: List[Optional[BaseModel]] = []
    failed_count = 0

    for i, model in enumerate(models):
        try:
            # Use Pydantic model_validate for ORM conversion
            dto = dto_class.model_validate(model)
            results.append(dto)

        except Exception as e:
            failed_count += 1

            if on_error == "raise":
                logger.error(
                    "dto_conversion.failed",
                    model_type=type(model).__name__,
                    dto_class=dto_class.__name__,
                    index=i,
                    error=str(e),
                    exc_info=True
                )
                raise ValueError(
                    f"Failed to convert {type(model).__name__} to "
                    f"{dto_class.__name__} at index {i}: {str(e)}"
                ) from e

            elif on_error == "skip":
                logger.warning(
                    "dto_conversion.skipped",
                    model_type=type(model).__name__,
                    dto_class=dto_class.__name__,
                    index=i,
                    error=str(e)
                )
                # Don't append anything
                continue

            elif on_error == "none":
                logger.warning(
                    "dto_conversion.replaced_with_none",
                    model_type=type(model).__name__,
                    dto_class=dto_class.__name__,
                    index=i,
                    error=str(e)
                )
                results.append(None)

    logger.debug(
        "dto_conversion.completed",
        input_count=len(models),
        output_count=len([r for r in results if r is not None]),
        failed_count=failed_count,
        on_error=on_error
    )

    # Filter out None values for "skip" mode
    if on_error == "skip":
        return [dto for dto in results if dto is not None]

    return results


async def load_nested_entities(
    entity: Any,
    relations: Dict[str, Tuple[str, Type[BaseModel]]],
    session: Any  # AsyncSession
) -> Dict[str, Any]:
    """Load nested entities and convert to DTOs.

    Loads related entities via SQLAlchemy relationships and converts them
    to DTOs for nested response structures.

    Args:
        entity: Parent ORM model instance
        relations: Dict mapping result key to (relationship_name, dto_class)
        session: Database session (AsyncSession)

    Returns:
        Dict with nested entities as DTOs

    Example:
        >>> song = await song_repo.get_by_id(song_id)
        >>> nested = await load_nested_entities(
        ...     song,
        ...     {
        ...         "lyrics": ("lyrics", LyricsResponse),
        ...         "style": ("style", StyleResponse)
        ...     },
        ...     session
        ... )
        >>> # Returns: {"lyrics": LyricsResponse(...), "style": StyleResponse(...)}

    Note:
        This function is optional and should only be used when eager loading
        is not already handled by the repository layer. Prefer using
        SQLAlchemy joinedload/selectinload in repository queries when possible.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    results: Dict[str, Any] = {}

    for result_key, (relation_name, dto_class) in relations.items():
        try:
            # Get the relationship attribute
            related = getattr(entity, relation_name, None)

            if related is None:
                results[result_key] = None
                continue

            # Convert to DTO
            if isinstance(related, list):
                # One-to-many relationship
                dtos = convert_models_to_dtos(related, dto_class, on_error="skip")
                results[result_key] = dtos
            else:
                # One-to-one or many-to-one relationship
                dto = dto_class.model_validate(related)
                results[result_key] = dto

            logger.debug(
                "nested_entity.loaded",
                result_key=result_key,
                relation_name=relation_name,
                dto_class=dto_class.__name__,
                is_list=isinstance(related, list)
            )

        except Exception as e:
            logger.warning(
                "nested_entity.load_failed",
                result_key=result_key,
                relation_name=relation_name,
                error=str(e)
            )
            results[result_key] = None

    return results


def apply_field_selection(
    dto: BaseModel,
    fields: Optional[List[str]] = None,
    exclude: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Apply field selection to DTO for sparse responses.

    Supports partial responses by selecting specific fields or excluding
    unwanted fields from DTOs. Useful for API optimization and reducing
    payload sizes.

    Args:
        dto: Pydantic DTO instance
        fields: Optional list of fields to include (whitelist)
        exclude: Optional list of fields to exclude (blacklist)

    Returns:
        Dict with selected fields only

    Example:
        >>> lyrics_dto = LyricsResponse(...)
        >>> sparse = apply_field_selection(
        ...     lyrics_dto,
        ...     fields=["id", "title", "created_at"]
        ... )
        >>> # Returns: {"id": "...", "title": "...", "created_at": "..."}

        >>> # Exclude large fields
        >>> sparse = apply_field_selection(
        ...     lyrics_dto,
        ...     exclude=["sections", "full_text"]
        ... )

    Note:
        - If both `fields` and `exclude` are provided, `fields` takes precedence
        - Field selection is case-sensitive
        - Nested field selection (dot notation) is not supported in this version
    """
    # Convert DTO to dict
    dto_dict = dto.model_dump()

    # Apply whitelist (fields)
    if fields:
        selected = {k: v for k, v in dto_dict.items() if k in fields}

        logger.debug(
            "field_selection.whitelist_applied",
            dto_class=type(dto).__name__,
            total_fields=len(dto_dict),
            requested_fields=len(fields),
            selected_fields=len(selected)
        )

        return selected

    # Apply blacklist (exclude)
    if exclude:
        selected = {k: v for k, v in dto_dict.items() if k not in exclude}

        logger.debug(
            "field_selection.blacklist_applied",
            dto_class=type(dto).__name__,
            total_fields=len(dto_dict),
            excluded_fields=len(exclude),
            selected_fields=len(selected)
        )

        return selected

    # No selection - return all fields
    return dto_dict


# =============================================================================
# Module Exports
# =============================================================================

__all__ = [
    # Citation hashing
    "compute_citation_hash",
    "compute_citation_batch_hash",

    # Rhyme scheme validation
    "validate_rhyme_scheme",
    "parse_rhyme_scheme",
    "extract_rhyme_endings",
    "check_rhyme_similarity",

    # Weight normalization
    "normalize_weights",

    # Explicit content filtering
    "ProfanityFilter",
    "get_profanity_filter",
    "check_explicit_content",
    "add_profanity_terms",
    "get_profanity_list",

    # Section validation
    "validate_section_order",
    "extract_sections",

    # Syllable counting
    "count_syllables",
    "calculate_syllable_consistency",

    # DTO transformation helpers
    "format_error_response",
    "create_page_response",
    "create_cursor_response",
    "convert_models_to_dtos",
    "load_nested_entities",
    "apply_field_selection",
]
