"""Policy guards for content validation in MeatyMusic AMCS.

This module implements policy validation for lyrics, style descriptions, and other
user-generated content to ensure compliance with explicit content flags, profanity
rules, and other content quality standards.

Includes:
- Profanity detection with severity categorization
- Variation handling (leetspeak, spacing, masking)
- Context-aware filtering with whitelists
- Structured violation reporting
- Score-based content rating
"""

from __future__ import annotations

import re
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional, Set
from dataclasses import dataclass
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class ProfanityViolation:
    """Structured representation of a profanity violation.

    Attributes:
        term: The offending term detected
        position: Character position in the text (or line number for lyrics)
        severity: Category of profanity (mild, moderate, strong, extreme)
        context: Surrounding text for context (±20 chars)
        section: Section name for lyrics (e.g., "verse_1", "chorus")
        normalized_form: The normalized form of the detected term
        original_form: The original form as it appeared in text
    """
    term: str
    position: int
    severity: str
    context: str
    section: Optional[str] = None
    normalized_form: Optional[str] = None
    original_form: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert violation to dictionary format."""
        return {
            "term": self.term,
            "position": self.position,
            "severity": self.severity,
            "context": self.context,
            "section": self.section,
            "normalized_form": self.normalized_form,
            "original_form": self.original_form,
        }


class ProfanityFilter:
    """Context-aware profanity detection and filtering service.

    This service loads profanity taxonomies and provides detection methods
    that handle variations (leetspeak, spacing, masking) and context-based
    whitelisting. Returns structured violation reports with severity levels.

    The filter supports multiple explicit content modes:
    - clean: No profanity allowed
    - mild_allowed: Only mild profanity allowed
    - moderate_allowed: Mild and moderate profanity allowed
    - explicit: All profanity allowed

    Usage:
        ```python
        filter = ProfanityFilter()

        # Check text for profanity
        has_violations, violations = filter.detect_profanity(
            text="This is some text",
            explicit_allowed=False
        )

        # Check lyrics sections
        has_violations, violations = filter.check_lyrics_sections(
            lyrics={"verse_1": {"text": "...", "line": 1}, ...},
            explicit_allowed=True
        )

        # Get profanity score
        score = filter.get_profanity_score("Some text")  # 0.0-1.0
        ```

    Determinism:
        - Word lists are alphabetically sorted
        - Regex patterns are compiled once at initialization
        - Detection order is consistent (lexicographic)
        - Whitelist matching is case-insensitive but deterministic
    """

    def __init__(self, taxonomy_path: Optional[Path] = None):
        """Initialize the profanity filter.

        Args:
            taxonomy_path: Optional path to profanity taxonomy JSON.
                          Defaults to /taxonomies/profanity_list.json at project root.

        Raises:
            FileNotFoundError: If taxonomy file is not found
            ValueError: If taxonomy file is malformed
        """
        self.taxonomy: Dict[str, Any] = {}
        self.categories: Dict[str, List[str]] = {}
        self.severity_weights: Dict[str, float] = {}
        self.thresholds: Dict[str, Dict[str, Any]] = {}
        self.whitelist: Set[str] = set()
        self.leetspeak_patterns: Dict[str, List[str]] = {}

        # Compiled regex patterns for performance
        self._word_boundary_patterns: Dict[str, re.Pattern] = {}
        self._variation_patterns: List[Tuple[str, re.Pattern]] = []

        # Load taxonomy
        if taxonomy_path is None:
            # Default to project root /taxonomies/profanity_list.json
            # Path structure: policy_guards.py -> services -> app -> api -> services -> MeatyMusic
            project_root = Path(__file__).parent.parent.parent.parent.parent
            taxonomy_path = project_root / "taxonomies" / "profanity_list.json"

        self._load_taxonomy(taxonomy_path)
        self._compile_patterns()

        logger.info(
            "profanity_filter.initialized",
            taxonomy_path=str(taxonomy_path),
            category_count=len(self.categories),
            total_terms=sum(len(terms) for terms in self.categories.values()),
            whitelist_size=len(self.whitelist),
            pattern_count=len(self._variation_patterns)
        )

    def _load_taxonomy(self, path: Path) -> None:
        """Load profanity taxonomy from JSON file.

        Args:
            path: Path to taxonomy JSON file

        Raises:
            FileNotFoundError: If taxonomy file is not found
            ValueError: If taxonomy file is malformed
        """
        if not path.exists():
            logger.error(
                "profanity_filter.taxonomy_not_found",
                path=str(path)
            )
            raise FileNotFoundError(f"Profanity taxonomy not found: {path}")

        try:
            with open(path, 'r') as f:
                self.taxonomy = json.load(f)

            # Extract categories (sorted for determinism)
            self.categories = {
                category: sorted(terms)  # Sort for deterministic detection order
                for category, terms in self.taxonomy.get("categories", {}).items()
            }

            # Extract severity weights
            self.severity_weights = self.taxonomy.get("severity_weights", {
                "mild": 0.25,
                "moderate": 0.5,
                "strong": 0.75,
                "extreme": 1.0
            })

            # Extract thresholds
            self.thresholds = self.taxonomy.get("thresholds", {})

            # Extract whitelist (case-insensitive)
            whitelist_terms = self.taxonomy.get("whitelist", {}).get("terms", [])
            self.whitelist = {term.lower() for term in whitelist_terms}

            # Extract leetspeak patterns
            self.leetspeak_patterns = self.taxonomy.get("variations", {}).get("leetspeak_patterns", {})

            logger.debug(
                "profanity_filter.taxonomy_loaded",
                categories=list(self.categories.keys()),
                whitelist_size=len(self.whitelist)
            )

        except json.JSONDecodeError as e:
            logger.error(
                "profanity_filter.taxonomy_json_error",
                path=str(path),
                error=str(e)
            )
            raise ValueError(f"Invalid JSON in taxonomy file: {e}") from e
        except Exception as e:
            logger.error(
                "profanity_filter.taxonomy_load_error",
                path=str(path),
                error=str(e),
                exc_info=True
            )
            raise

    def _compile_patterns(self) -> None:
        """Compile regex patterns for efficient matching.

        This method compiles:
        1. Word boundary patterns for each profanity term
        2. Variation patterns for leetspeak, masking, and spacing

        Patterns are compiled once at initialization for performance.
        """
        # Compile word boundary patterns for each profanity term
        for category, terms in self.categories.items():
            for term in terms:
                # Create case-insensitive word boundary pattern
                # \b ensures we match whole words, not substrings
                pattern = re.compile(
                    rf'\b{re.escape(term)}\b',
                    re.IGNORECASE
                )
                self._word_boundary_patterns[term] = pattern

        # Compile variation patterns for each base term
        # This handles leetspeak substitutions
        for category, terms in self.categories.items():
            for term in terms:
                variations = self._generate_leetspeak_variations(term)
                for variation in variations:
                    pattern = re.compile(
                        rf'\b{variation}\b',
                        re.IGNORECASE
                    )
                    self._variation_patterns.append((term, pattern))

        logger.debug(
            "profanity_filter.patterns_compiled",
            word_patterns=len(self._word_boundary_patterns),
            variation_patterns=len(self._variation_patterns)
        )

    def _generate_leetspeak_variations(self, term: str, max_variations: int = 10) -> List[str]:
        """Generate leetspeak variations of a term.

        Args:
            term: Base term to generate variations for
            max_variations: Maximum number of variations to generate

        Returns:
            List of regex patterns for leetspeak variations

        Examples:
            "hell" -> ["h3ll", "h311", "he11", etc.]
            "damn" -> ["d4mn", "d@mn", etc.]
        """
        if not term:
            return []

        variations = []

        # Generate a few common variations
        # For each character, try to substitute with leetspeak equivalents
        for i, char in enumerate(term.lower()):
            if char in self.leetspeak_patterns:
                substitutes = self.leetspeak_patterns[char]
                for substitute in substitutes[:2]:  # Limit to top 2 substitutes
                    # Create variation by substituting this character
                    variation = list(term.lower())
                    variation[i] = substitute

                    # Build regex pattern that allows the substitution
                    pattern_chars = []
                    for j, c in enumerate(term.lower()):
                        if j == i:
                            # Use the substitute
                            pattern_chars.append(re.escape(substitute))
                        elif c in self.leetspeak_patterns:
                            # Allow original or any substitute
                            subs = [re.escape(c)] + [re.escape(s) for s in self.leetspeak_patterns[c][:2]]
                            pattern_chars.append(f"[{''.join(subs)}]")
                        else:
                            pattern_chars.append(re.escape(c))

                    variations.append(''.join(pattern_chars))

                    if len(variations) >= max_variations:
                        return variations

        return variations[:max_variations]

    def _normalize_text(self, text: str) -> str:
        """Normalize text for profanity detection.

        Removes common masking techniques while preserving word structure:
        - Removes asterisks, dashes, underscores within words
        - Removes excessive spacing between characters
        - Preserves word boundaries

        Args:
            text: Text to normalize

        Returns:
            Normalized text

        Examples:
            "f**k" -> "fk" (will match partial pattern)
            "f u c k" -> "fuck" (spacing removed)
            "sh-t" -> "sht" (dashes removed)
        """
        # Remove asterisks, dashes, underscores between word characters
        normalized = re.sub(r'(\w)[\*\-_]+(\w)', r'\1\2', text)

        # Collapse excessive spacing between single characters
        # Match patterns like "f u c k" or "d a m n"
        normalized = re.sub(r'\b([a-z])\s+([a-z])\s+([a-z])\s+([a-z])\b', r'\1\2\3\4', normalized, flags=re.IGNORECASE)
        normalized = re.sub(r'\b([a-z])\s+([a-z])\s+([a-z])\b', r'\1\2\3', normalized, flags=re.IGNORECASE)

        return normalized

    def _is_whitelisted(self, text: str, position: int, term_length: int) -> bool:
        """Check if a detected term is part of a whitelisted phrase.

        Args:
            text: Full text being analyzed
            position: Position of detected term
            term_length: Length of detected term

        Returns:
            True if the term is part of a whitelisted phrase

        Examples:
            "assessment" contains "ass" but is whitelisted
            "classic" contains "ass" but is whitelisted
            "Scunthorpe" contains profanity substring but is whitelisted
        """
        # Extract a window around the detected term (±20 chars)
        start = max(0, position - 20)
        end = min(len(text), position + term_length + 20)
        window = text[start:end].lower()

        # Check if any whitelist term appears in this window
        for whitelisted in self.whitelist:
            if whitelisted in window:
                logger.debug(
                    "profanity_filter.whitelisted",
                    position=position,
                    whitelisted_term=whitelisted,
                    window=window
                )
                return True

        return False

    def _get_context(self, text: str, position: int, term_length: int, context_chars: int = 20) -> str:
        """Extract context around a detected term.

        Args:
            text: Full text
            position: Position of detected term
            term_length: Length of detected term
            context_chars: Number of characters to include on each side

        Returns:
            Context string with the term highlighted

        Examples:
            "...some text [TERM] more text..."
        """
        start = max(0, position - context_chars)
        end = min(len(text), position + term_length + context_chars)

        before = text[start:position]
        term = text[position:position + term_length]
        after = text[position + term_length:end]

        # Add ellipsis if truncated
        prefix = "..." if start > 0 else ""
        suffix = "..." if end < len(text) else ""

        return f"{prefix}{before}[{term}]{after}{suffix}"

    def _find_term_category(self, term: str) -> Optional[str]:
        """Find which category a profanity term belongs to.

        Args:
            term: The profanity term (normalized)

        Returns:
            Category name (mild, moderate, strong, extreme) or None
        """
        term_lower = term.lower()
        for category, terms in self.categories.items():
            if term_lower in [t.lower() for t in terms]:
                return category
        return None

    def detect_profanity(
        self,
        text: str,
        explicit_allowed: bool = False,
        mode: str = "clean"
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Detect profanity in text with variation handling.

        This is the main detection method that:
        1. Normalizes text to handle masking
        2. Checks against word boundary patterns
        3. Checks against variation patterns (leetspeak)
        4. Filters out whitelisted terms
        5. Returns structured violation reports

        Args:
            text: Text to analyze
            explicit_allowed: If True, uses "explicit" mode; otherwise uses mode parameter
            mode: Explicit content mode (clean, mild_allowed, moderate_allowed, explicit)
                 Ignored if explicit_allowed is True.

        Returns:
            Tuple of (has_violations, violations)
            - has_violations: True if violations found based on mode thresholds
            - violations: List of violation dictionaries with details

        Examples:
            >>> filter = ProfanityFilter()
            >>> has_violations, violations = filter.detect_profanity("some damn text", explicit_allowed=False)
            >>> print(has_violations)
            True
            >>> print(violations[0])
            {
                "term": "damn",
                "position": 5,
                "severity": "mild",
                "context": "some [damn] text",
                "section": None,
                "normalized_form": "damn",
                "original_form": "damn"
            }
        """
        if not text:
            return False, []

        # Determine threshold mode
        threshold_mode = "explicit" if explicit_allowed else mode

        # Normalize text for detection
        normalized_text = self._normalize_text(text)

        violations: List[ProfanityViolation] = []
        detected_positions: Set[int] = set()  # Track positions to avoid duplicates

        logger.debug(
            "profanity_filter.detect_start",
            text_length=len(text),
            mode=threshold_mode
        )

        # Step 1: Check word boundary patterns (exact matches)
        for term, pattern in self._word_boundary_patterns.items():
            for match in pattern.finditer(text):
                position = match.start()

                # Skip if we've already detected profanity at this position
                if position in detected_positions:
                    continue

                # Check whitelist
                if self._is_whitelisted(text, position, len(match.group())):
                    continue

                # Find category
                category = self._find_term_category(term)
                if category is None:
                    continue

                # Create violation
                violation = ProfanityViolation(
                    term=term,
                    position=position,
                    severity=category,
                    context=self._get_context(text, position, len(match.group())),
                    normalized_form=term,
                    original_form=match.group()
                )

                violations.append(violation)
                detected_positions.add(position)

                logger.debug(
                    "profanity_filter.violation_detected",
                    term=term,
                    position=position,
                    severity=category,
                    original=match.group()
                )

        # Step 2: Check variation patterns (leetspeak, etc.) on normalized text
        for base_term, pattern in self._variation_patterns:
            for match in pattern.finditer(normalized_text):
                position = match.start()

                # Skip if we've already detected profanity at this position
                if position in detected_positions:
                    continue

                # Check whitelist (using original text)
                if position < len(text) and self._is_whitelisted(text, position, len(match.group())):
                    continue

                # Find category
                category = self._find_term_category(base_term)
                if category is None:
                    continue

                # Create violation (use original text position if available)
                original_form = text[position:position + len(match.group())] if position < len(text) else match.group()

                violation = ProfanityViolation(
                    term=base_term,
                    position=position,
                    severity=category,
                    context=self._get_context(text, position, len(match.group())),
                    normalized_form=match.group(),
                    original_form=original_form
                )

                violations.append(violation)
                detected_positions.add(position)

                logger.debug(
                    "profanity_filter.variation_detected",
                    base_term=base_term,
                    position=position,
                    severity=category,
                    normalized=match.group(),
                    original=original_form
                )

        # Step 3: Check against thresholds for the mode
        has_violations = self._check_violations_against_threshold(violations, threshold_mode)

        # Convert violations to dictionaries
        violation_dicts = [v.to_dict() for v in violations]

        logger.info(
            "profanity_filter.detect_complete",
            text_length=len(text),
            mode=threshold_mode,
            violation_count=len(violations),
            has_violations=has_violations
        )

        return has_violations, violation_dicts

    def _check_violations_against_threshold(
        self,
        violations: List[ProfanityViolation],
        mode: str
    ) -> bool:
        """Check if violations exceed threshold for the given mode.

        Args:
            violations: List of detected violations
            mode: Threshold mode (clean, mild_allowed, moderate_allowed, explicit)

        Returns:
            True if violations exceed threshold, False otherwise
        """
        if not violations:
            return False

        # Get threshold config for mode
        threshold_config = self.thresholds.get(mode, self.thresholds.get("clean", {}))

        # Count violations by severity
        severity_counts = {"mild": 0, "moderate": 0, "strong": 0, "extreme": 0}
        for violation in violations:
            if violation.severity in severity_counts:
                severity_counts[violation.severity] += 1

        # Check each severity against threshold
        # A value of -1 means unlimited
        for severity, count in severity_counts.items():
            max_allowed = threshold_config.get(f"max_{severity}_count", 0)
            if max_allowed != -1 and count > max_allowed:
                logger.debug(
                    "profanity_filter.threshold_exceeded",
                    mode=mode,
                    severity=severity,
                    count=count,
                    max_allowed=max_allowed
                )
                return True

        # Also check total score
        total_score = self.get_profanity_score_from_violations(violations)
        max_score = threshold_config.get("max_score", 0.0)

        if total_score > max_score:
            logger.debug(
                "profanity_filter.score_threshold_exceeded",
                mode=mode,
                score=total_score,
                max_score=max_score
            )
            return True

        return False

    def check_lyrics_sections(
        self,
        lyrics: Dict[str, Any],
        explicit_allowed: bool = False,
        mode: str = "clean"
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Check profanity across all lyrics sections.

        Args:
            lyrics: Lyrics dictionary with sections
                   Expected format: {"section_name": {"text": "...", "line": 1}, ...}
                   OR: {"sections": [{"name": "verse_1", "text": "...", "line": 1}, ...]}
            explicit_allowed: If True, uses "explicit" mode
            mode: Explicit content mode (clean, mild_allowed, moderate_allowed, explicit)

        Returns:
            Tuple of (has_violations, violations)
            - has_violations: True if violations found
            - violations: List of violation dictionaries with section information

        Examples:
            >>> lyrics = {
            ...     "verse_1": {"text": "some lyrics here", "line": 1},
            ...     "chorus": {"text": "damn good song", "line": 5}
            ... }
            >>> has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False)
        """
        all_violations = []

        # Handle different lyrics formats
        sections_data = []

        if "sections" in lyrics:
            # Format: {"sections": [...]}
            sections_data = lyrics["sections"]
        else:
            # Format: {"section_name": {...}, ...}
            for section_name, section_data in lyrics.items():
                if isinstance(section_data, dict) and "text" in section_data:
                    sections_data.append({
                        "name": section_name,
                        "text": section_data.get("text", ""),
                        "line": section_data.get("line", 0)
                    })

        logger.debug(
            "profanity_filter.check_lyrics_start",
            section_count=len(sections_data),
            mode=mode if not explicit_allowed else "explicit"
        )

        # Check each section
        for section in sections_data:
            section_name = section.get("name", "unknown")
            section_text = section.get("text", "")
            section_line = section.get("line", 0)

            if not section_text:
                continue

            # Detect profanity in section text
            has_violations, violations = self.detect_profanity(
                text=section_text,
                explicit_allowed=explicit_allowed,
                mode=mode
            )

            # Add section information to violations
            for violation in violations:
                violation["section"] = section_name
                # Adjust position to be relative to line number if provided
                if section_line > 0:
                    violation["line"] = section_line

            all_violations.extend(violations)

        # Determine if there are violations based on mode
        has_any_violations = len(all_violations) > 0

        logger.info(
            "profanity_filter.check_lyrics_complete",
            section_count=len(sections_data),
            violation_count=len(all_violations),
            has_violations=has_any_violations,
            mode=mode if not explicit_allowed else "explicit"
        )

        return has_any_violations, all_violations

    def get_profanity_score(self, text: str) -> float:
        """Calculate profanity score for text (0.0-1.0).

        The score is computed by:
        1. Detecting all profanity terms
        2. Weighting each by severity
        3. Normalizing by text length
        4. Capping at 1.0

        Args:
            text: Text to score

        Returns:
            Profanity score from 0.0 (clean) to 1.0 (extremely profane)

        Examples:
            >>> filter.get_profanity_score("clean text")
            0.0
            >>> filter.get_profanity_score("damn")
            0.25
            >>> filter.get_profanity_score("damn shit fuck")
            1.0
        """
        if not text:
            return 0.0

        # Detect all profanity (use explicit mode to get all violations)
        _, violations = self.detect_profanity(text, explicit_allowed=True)

        if not violations:
            return 0.0

        # Calculate weighted score
        total_weight = 0.0
        for violation in violations:
            severity = violation.get("severity", "mild")
            weight = self.severity_weights.get(severity, 0.25)
            total_weight += weight

        # Normalize by text length (violations per 100 words)
        word_count = len(text.split())
        if word_count == 0:
            return 0.0

        # Score = (total_weight / word_count) * 100
        # This gives a score that scales with density of profanity
        score = (total_weight / word_count) * 100

        # Cap at 1.0
        score = min(1.0, score)

        logger.debug(
            "profanity_filter.score_calculated",
            text_length=len(text),
            word_count=word_count,
            violation_count=len(violations),
            total_weight=total_weight,
            score=score
        )

        return score

    def get_profanity_score_from_violations(self, violations: List[ProfanityViolation]) -> float:
        """Calculate profanity score from existing violations.

        Args:
            violations: List of ProfanityViolation objects

        Returns:
            Profanity score from 0.0 to 1.0
        """
        if not violations:
            return 0.0

        total_weight = 0.0
        for violation in violations:
            severity = violation.severity
            weight = self.severity_weights.get(severity, 0.25)
            total_weight += weight

        # For violation-based scoring, we use the sum of weights
        # normalized by the number of violations (average severity)
        score = total_weight / len(violations)

        return min(1.0, score)

    def get_violation_report(
        self,
        text: str,
        explicit_allowed: bool = False,
        mode: str = "clean"
    ) -> Dict[str, Any]:
        """Generate comprehensive profanity violation report.

        This method provides a complete report including:
        - Violation details
        - Profanity score
        - Threshold compliance
        - Remediation suggestions

        Args:
            text: Text to analyze
            explicit_allowed: If True, uses "explicit" mode
            mode: Explicit content mode

        Returns:
            Comprehensive report dictionary:
            {
                "has_violations": bool,
                "violations": List[Dict],
                "profanity_score": float,
                "explicit_allowed": bool,
                "mode": str,
                "threshold_config": Dict,
                "severity_summary": Dict[str, int],
                "compliant": bool
            }
        """
        has_violations, violations = self.detect_profanity(
            text=text,
            explicit_allowed=explicit_allowed,
            mode=mode
        )

        score = self.get_profanity_score(text)

        # Determine threshold mode
        threshold_mode = "explicit" if explicit_allowed else mode
        threshold_config = self.thresholds.get(threshold_mode, {})

        # Count violations by severity
        severity_summary = {"mild": 0, "moderate": 0, "strong": 0, "extreme": 0}
        for violation in violations:
            severity = violation.get("severity", "mild")
            if severity in severity_summary:
                severity_summary[severity] += 1

        # Determine compliance
        compliant = not has_violations

        report = {
            "has_violations": has_violations,
            "violations": violations,
            "profanity_score": score,
            "explicit_allowed": explicit_allowed,
            "mode": threshold_mode,
            "threshold_config": threshold_config,
            "severity_summary": severity_summary,
            "compliant": compliant,
            "violation_count": len(violations)
        }

        logger.info(
            "profanity_filter.report_generated",
            violation_count=len(violations),
            score=score,
            mode=threshold_mode,
            compliant=compliant
        )

        return report


@dataclass
class PIIViolation:
    """Structured representation of a PII detection.

    Attributes:
        type: Type of PII detected (email, phone, url, name, etc.)
        value: The original detected value (for logging, should be handled carefully)
        position: Character position in the text
        redacted_as: The placeholder used for redaction
        confidence: Confidence score (0.0-1.0) for the detection
        context: Surrounding text for context (±20 chars, with PII redacted)
    """
    type: str
    value: str
    position: int
    redacted_as: str
    confidence: float
    context: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert violation to dictionary format.

        Note: Be careful logging the 'value' field as it contains actual PII.
        """
        return {
            "type": self.type,
            "value": self.value,
            "position": self.position,
            "redacted_as": self.redacted_as,
            "confidence": self.confidence,
            "context": self.context,
        }


class PIIDetector:
    """PII (Personally Identifiable Information) detection and redaction service.

    This service loads PII pattern taxonomies and provides detection methods
    for various types of PII including emails, phone numbers, URLs, addresses,
    SSNs, credit cards, and person names. Returns structured violation reports
    with redacted versions of the text.

    The detector supports:
    - Email addresses (RFC-compliant)
    - Phone numbers (US and international formats)
    - URLs (http/https)
    - Street addresses
    - Social Security Numbers
    - Credit card numbers
    - IP addresses
    - Person names (pattern-based)

    Usage:
        ```python
        detector = PIIDetector()

        # Detect PII in text
        has_pii, violations = detector.detect_pii("Contact me at john@example.com")

        # Redact PII from text
        redacted_text, violations = detector.redact_pii("My email is john@example.com")
        # Returns: "My email is [EMAIL]", [...]

        # Get comprehensive report
        report = detector.get_pii_report("Call me at 555-123-4567")
        # Returns: {
        #   "has_pii": True,
        #   "pii_found": [...],
        #   "redacted_text": "Call me at [PHONE]",
        #   "original_text": "Call me at 555-123-4567"
        # }
        ```

    Determinism:
        - Pattern order is fixed and deterministic
        - Allowlist matching is case-insensitive but consistent
        - Regex patterns are compiled once at initialization
        - Detection order: structured patterns first, then name patterns

    Privacy:
        - Actual PII values should be handled carefully in logs
        - Use context (with redaction) instead of full values for debugging
        - Consider not logging violation.value in production
    """

    def __init__(self, taxonomy_path: Optional[Path] = None):
        """Initialize the PII detector.

        Args:
            taxonomy_path: Optional path to PII patterns taxonomy JSON.
                          Defaults to /taxonomies/pii_patterns.json at project root.

        Raises:
            FileNotFoundError: If taxonomy file is not found
            ValueError: If taxonomy file is malformed
        """
        self.taxonomy: Dict[str, Any] = {}
        self.patterns: Dict[str, Dict[str, Any]] = {}
        self.name_patterns: Dict[str, Any] = {}
        self.allowlist: Dict[str, List[str]] = {}
        self.validation_config: Dict[str, Any] = {}

        # Compiled regex patterns for performance
        self._compiled_patterns: Dict[str, re.Pattern] = {}
        self._compiled_name_patterns: Dict[str, re.Pattern] = {}

        # Load taxonomy
        if taxonomy_path is None:
            # Default to project root /taxonomies/pii_patterns.json
            project_root = Path(__file__).parent.parent.parent.parent.parent
            taxonomy_path = project_root / "taxonomies" / "pii_patterns.json"

        self._load_taxonomy(taxonomy_path)
        self._compile_patterns()

        logger.info(
            "pii_detector.initialized",
            taxonomy_path=str(taxonomy_path),
            pattern_count=len(self.patterns),
            name_pattern_count=len(self.name_patterns.get("pattern_templates", {})),
            allowlist_brands=len(self.allowlist.get("brands", [])),
        )

    def _load_taxonomy(self, path: Path) -> None:
        """Load PII patterns taxonomy from JSON file.

        Args:
            path: Path to taxonomy JSON file

        Raises:
            FileNotFoundError: If taxonomy file is not found
            ValueError: If taxonomy file is malformed
        """
        if not path.exists():
            logger.error(
                "pii_detector.taxonomy_not_found",
                path=str(path)
            )
            raise FileNotFoundError(f"PII taxonomy not found: {path}")

        try:
            with open(path, 'r') as f:
                self.taxonomy = json.load(f)

            # Extract patterns
            self.patterns = self.taxonomy.get("patterns", {})

            # Extract name patterns
            self.name_patterns = self.taxonomy.get("name_patterns", {})

            # Extract allowlist
            self.allowlist = self.taxonomy.get("allowlist", {})

            # Extract validation config
            self.validation_config = self.taxonomy.get("validation", {})

            logger.debug(
                "pii_detector.taxonomy_loaded",
                pattern_count=len(self.patterns),
                allowlist_size=sum(len(v) for v in self.allowlist.values())
            )

        except json.JSONDecodeError as e:
            logger.error(
                "pii_detector.taxonomy_json_error",
                path=str(path),
                error=str(e)
            )
            raise ValueError(f"Invalid JSON in PII taxonomy file: {e}") from e
        except Exception as e:
            logger.error(
                "pii_detector.taxonomy_load_error",
                path=str(path),
                error=str(e),
                exc_info=True
            )
            raise

    def _compile_patterns(self) -> None:
        """Compile regex patterns for efficient matching.

        This method compiles:
        1. Structured PII patterns (email, phone, URL, SSN, etc.)
        2. Name detection patterns

        Patterns are compiled once at initialization for performance.
        """
        # Compile structured patterns
        for pattern_name, pattern_config in self.patterns.items():
            regex_str = pattern_config.get("regex", "")
            if regex_str:
                try:
                    self._compiled_patterns[pattern_name] = re.compile(regex_str)
                except re.error as e:
                    logger.warning(
                        "pii_detector.pattern_compile_error",
                        pattern_name=pattern_name,
                        error=str(e)
                    )

        # Compile name patterns
        pattern_templates = self.name_patterns.get("pattern_templates", {})
        for template_name, template_config in pattern_templates.items():
            regex_str = template_config.get("regex", "")
            if regex_str:
                try:
                    self._compiled_name_patterns[template_name] = re.compile(regex_str)
                except re.error as e:
                    logger.warning(
                        "pii_detector.name_pattern_compile_error",
                        template_name=template_name,
                        error=str(e)
                    )

        logger.debug(
            "pii_detector.patterns_compiled",
            structured_patterns=len(self._compiled_patterns),
            name_patterns=len(self._compiled_name_patterns)
        )

    def _is_allowlisted(self, value: str, pii_type: str) -> bool:
        """Check if a detected value is in the allowlist.

        Args:
            value: The detected value
            pii_type: Type of PII (name, email, etc.)

        Returns:
            True if the value should be ignored (is allowlisted)
        """
        value_lower = value.lower()

        # Check all allowlist categories (skip non-list entries like "description")
        for category, terms in self.allowlist.items():
            # Skip non-list items (like "description" field)
            if not isinstance(terms, list):
                continue

            for term in terms:
                if term.lower() in value_lower or value_lower in term.lower():
                    logger.debug(
                        "pii_detector.allowlisted",
                        value=value,
                        pii_type=pii_type,
                        category=category,
                        matched_term=term
                    )
                    return True

        return False

    def _get_context(self, text: str, position: int, length: int, context_chars: int = 20) -> str:
        """Extract context around a detected PII item.

        Args:
            text: Full text
            position: Position of detected PII
            length: Length of detected PII
            context_chars: Number of characters to include on each side

        Returns:
            Context string with the PII redacted
        """
        start = max(0, position - context_chars)
        end = min(len(text), position + length + context_chars)

        before = text[start:position]
        after = text[position + length:end]

        # Add ellipsis if truncated
        prefix = "..." if start > 0 else ""
        suffix = "..." if end < len(text) else ""

        return f"{prefix}{before}[REDACTED]{after}{suffix}"

    def detect_emails(self, text: str) -> List[PIIViolation]:
        """Detect email addresses in text.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected emails
        """
        violations = []
        pattern = self._compiled_patterns.get("email")
        if not pattern:
            return violations

        pattern_config = self.patterns["email"]
        placeholder = pattern_config.get("placeholder", "[EMAIL]")
        confidence = pattern_config.get("confidence", 0.95)

        for match in pattern.finditer(text):
            value = match.group()

            # Check allowlist
            if self._is_allowlisted(value, "email"):
                continue

            violation = PIIViolation(
                type="email",
                value=value,
                position=match.start(),
                redacted_as=placeholder,
                confidence=confidence,
                context=self._get_context(text, match.start(), len(value))
            )
            violations.append(violation)

        return violations

    def detect_phones(self, text: str) -> List[PIIViolation]:
        """Detect phone numbers in text.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected phone numbers
        """
        violations = []
        detected_positions: Set[int] = set()

        # Check both US and international phone patterns
        for pattern_name in ["phone_us", "phone_international"]:
            pattern = self._compiled_patterns.get(pattern_name)
            if not pattern:
                continue

            pattern_config = self.patterns[pattern_name]
            placeholder = pattern_config.get("placeholder", "[PHONE]")
            confidence = pattern_config.get("confidence", 0.9)

            for match in pattern.finditer(text):
                position = match.start()

                # Skip if we already detected a phone at this position
                if position in detected_positions:
                    continue

                value = match.group()

                # Check allowlist
                if self._is_allowlisted(value, "phone"):
                    continue

                violation = PIIViolation(
                    type="phone",
                    value=value,
                    position=position,
                    redacted_as=placeholder,
                    confidence=confidence,
                    context=self._get_context(text, position, len(value))
                )
                violations.append(violation)
                detected_positions.add(position)

        return violations

    def detect_urls(self, text: str) -> List[PIIViolation]:
        """Detect URLs in text.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected URLs
        """
        violations = []
        pattern = self._compiled_patterns.get("url")
        if not pattern:
            return violations

        pattern_config = self.patterns["url"]
        placeholder = pattern_config.get("placeholder", "[URL]")
        confidence = pattern_config.get("confidence", 0.95)

        for match in pattern.finditer(text):
            value = match.group()

            # Check allowlist
            if self._is_allowlisted(value, "url"):
                continue

            violation = PIIViolation(
                type="url",
                value=value,
                position=match.start(),
                redacted_as=placeholder,
                confidence=confidence,
                context=self._get_context(text, match.start(), len(value))
            )
            violations.append(violation)

        return violations

    def detect_ssn(self, text: str) -> List[PIIViolation]:
        """Detect Social Security Numbers in text.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected SSNs
        """
        violations = []
        pattern = self._compiled_patterns.get("ssn")
        if not pattern:
            return violations

        pattern_config = self.patterns["ssn"]
        placeholder = pattern_config.get("placeholder", "[SSN]")
        confidence = pattern_config.get("confidence", 0.98)

        for match in pattern.finditer(text):
            value = match.group()

            violation = PIIViolation(
                type="ssn",
                value=value,
                position=match.start(),
                redacted_as=placeholder,
                confidence=confidence,
                context=self._get_context(text, match.start(), len(value))
            )
            violations.append(violation)

        return violations

    def detect_credit_cards(self, text: str) -> List[PIIViolation]:
        """Detect credit card numbers in text.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected credit cards
        """
        violations = []
        pattern = self._compiled_patterns.get("credit_card")
        if not pattern:
            return violations

        pattern_config = self.patterns["credit_card"]
        placeholder = pattern_config.get("placeholder", "[CREDIT_CARD]")
        confidence = pattern_config.get("confidence", 0.92)

        for match in pattern.finditer(text):
            value = match.group()

            violation = PIIViolation(
                type="credit_card",
                value=value,
                position=match.start(),
                redacted_as=placeholder,
                confidence=confidence,
                context=self._get_context(text, match.start(), len(value))
            )
            violations.append(violation)

        return violations

    def detect_addresses(self, text: str) -> List[PIIViolation]:
        """Detect street addresses in text.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected addresses
        """
        violations = []
        pattern = self._compiled_patterns.get("street_address")
        if not pattern:
            return violations

        pattern_config = self.patterns["street_address"]
        placeholder = pattern_config.get("placeholder", "[ADDRESS]")
        confidence = pattern_config.get("confidence", 0.8)

        for match in pattern.finditer(text):
            value = match.group()

            # Check allowlist (e.g., "Main Street", "Wall Street")
            if self._is_allowlisted(value, "address"):
                continue

            violation = PIIViolation(
                type="address",
                value=value,
                position=match.start(),
                redacted_as=placeholder,
                confidence=confidence,
                context=self._get_context(text, match.start(), len(value))
            )
            violations.append(violation)

        return violations

    def detect_names(self, text: str) -> List[PIIViolation]:
        """Detect person names in text using pattern-based detection.

        This is a basic pattern-based approach. For production use,
        consider integrating spaCy NER or similar for better accuracy.

        Args:
            text: Text to analyze

        Returns:
            List of PIIViolation objects for detected names
        """
        violations = []
        detected_positions: Set[int] = set()

        pattern_templates = self.name_patterns.get("pattern_templates", {})

        # Apply name detection patterns in order
        for template_name, pattern in self._compiled_name_patterns.items():
            template_config = pattern_templates[template_name]
            placeholder = template_config.get("placeholder", "[NAME]")
            confidence = template_config.get("confidence", 0.7)

            for match in pattern.finditer(text):
                position = match.start()

                # Skip if we already detected a name at this position
                if position in detected_positions:
                    continue

                # Extract the name (usually in group 1, or full match)
                try:
                    value = match.group(1) if match.groups() else match.group()
                except IndexError:
                    value = match.group()

                # Check allowlist (e.g., famous artists, generic names)
                if self._is_allowlisted(value, "name"):
                    continue

                # Apply minimum confidence threshold
                min_confidence = self.validation_config.get("min_confidence_threshold", 0.7)
                if confidence < min_confidence:
                    continue

                violation = PIIViolation(
                    type="name",
                    value=value,
                    position=position,
                    redacted_as=placeholder,
                    confidence=confidence,
                    context=self._get_context(text, position, len(value))
                )
                violations.append(violation)
                detected_positions.add(position)

        return violations

    def detect_pii(self, text: str) -> Tuple[bool, List[Dict[str, Any]]]:
        """Detect all types of PII in text.

        This is the main detection method that runs all PII detectors
        and returns a comprehensive list of violations.

        Args:
            text: Text to analyze

        Returns:
            Tuple of (has_pii, violations)
            - has_pii: True if any PII was detected
            - violations: List of violation dictionaries

        Examples:
            >>> detector = PIIDetector()
            >>> has_pii, violations = detector.detect_pii("Email me at john@example.com")
            >>> print(has_pii)
            True
            >>> print(violations[0])
            {
                "type": "email",
                "value": "john@example.com",
                "position": 12,
                "redacted_as": "[EMAIL]",
                "confidence": 0.95,
                "context": "Email me at [REDACTED]"
            }
        """
        if not text:
            return False, []

        logger.debug(
            "pii_detector.detect_start",
            text_length=len(text)
        )

        all_violations: List[PIIViolation] = []

        # Run all detectors in order
        # Structured data first (more reliable)
        all_violations.extend(self.detect_emails(text))
        all_violations.extend(self.detect_phones(text))
        all_violations.extend(self.detect_ssn(text))
        all_violations.extend(self.detect_credit_cards(text))
        all_violations.extend(self.detect_urls(text))
        all_violations.extend(self.detect_addresses(text))

        # Name detection last (lower confidence)
        all_violations.extend(self.detect_names(text))

        # Sort by position for deterministic ordering
        all_violations.sort(key=lambda v: v.position)

        # Convert to dictionaries
        violation_dicts = [v.to_dict() for v in all_violations]

        has_pii = len(all_violations) > 0

        logger.info(
            "pii_detector.detect_complete",
            text_length=len(text),
            violation_count=len(all_violations),
            has_pii=has_pii,
            types_found=list(set(v.type for v in all_violations))
        )

        return has_pii, violation_dicts

    def redact_pii(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        """Redact all PII from text and return redacted version with violations.

        Args:
            text: Text to redact

        Returns:
            Tuple of (redacted_text, violations)
            - redacted_text: Text with PII replaced by placeholders
            - violations: List of violation dictionaries

        Examples:
            >>> detector = PIIDetector()
            >>> redacted, violations = detector.redact_pii("Call me at 555-123-4567")
            >>> print(redacted)
            "Call me at [PHONE]"
        """
        if not text:
            return text, []

        # Detect all PII
        has_pii, violations = self.detect_pii(text)

        if not has_pii:
            return text, []

        # Sort violations by position in reverse order
        # This ensures we replace from end to start, maintaining positions
        sorted_violations = sorted(violations, key=lambda v: v["position"], reverse=True)

        redacted_text = text
        for violation in sorted_violations:
            position = violation["position"]
            value = violation["value"]
            placeholder = violation["redacted_as"]

            # Replace the PII with placeholder
            redacted_text = (
                redacted_text[:position] +
                placeholder +
                redacted_text[position + len(value):]
            )

        logger.info(
            "pii_detector.redact_complete",
            original_length=len(text),
            redacted_length=len(redacted_text),
            violation_count=len(violations)
        )

        return redacted_text, violations

    def get_pii_report(self, text: str) -> Dict[str, Any]:
        """Generate comprehensive PII detection report.

        This method provides a complete report including:
        - Detection results
        - Redacted text
        - Original text (for comparison)
        - Summary statistics

        Args:
            text: Text to analyze

        Returns:
            Comprehensive report dictionary:
            {
                "has_pii": bool,
                "pii_found": List[Dict],
                "redacted_text": str,
                "original_text": str,
                "summary": {
                    "total_pii_count": int,
                    "types": Dict[str, int],
                    "avg_confidence": float
                }
            }
        """
        redacted_text, violations = self.redact_pii(text)

        # Calculate summary statistics
        type_counts: Dict[str, int] = {}
        total_confidence = 0.0

        for violation in violations:
            pii_type = violation["type"]
            type_counts[pii_type] = type_counts.get(pii_type, 0) + 1
            total_confidence += violation["confidence"]

        avg_confidence = total_confidence / len(violations) if violations else 0.0

        report = {
            "has_pii": len(violations) > 0,
            "pii_found": violations,
            "redacted_text": redacted_text,
            "original_text": text,
            "summary": {
                "total_pii_count": len(violations),
                "types": type_counts,
                "avg_confidence": avg_confidence
            }
        }

        logger.info(
            "pii_detector.report_generated",
            pii_count=len(violations),
            types=list(type_counts.keys()),
            avg_confidence=avg_confidence
        )

        return report


@dataclass
class ArtistReference:
    """Structured representation of an artist reference detection.

    Attributes:
        artist_name: The detected artist name
        position: Character position in the text
        pattern_used: The pattern that matched (e.g., "style of", "sounds like")
        matched_text: The full matched text (e.g., "style of Taylor Swift")
        generic_replacement: The generic description to replace with
        requires_normalization: Whether this reference requires normalization for public release
        confidence: Confidence score (0.0-1.0) for the detection
        genre: The genre category the artist belongs to
        style_tags: List of style tags associated with the artist
    """
    artist_name: str
    position: int
    pattern_used: str
    matched_text: str
    generic_replacement: str
    requires_normalization: bool
    confidence: float
    genre: str
    style_tags: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert reference to dictionary format."""
        return {
            "artist_name": self.artist_name,
            "position": self.position,
            "pattern_used": self.pattern_used,
            "matched_text": self.matched_text,
            "generic_replacement": self.generic_replacement,
            "requires_normalization": self.requires_normalization,
            "confidence": self.confidence,
            "genre": self.genre,
            "style_tags": self.style_tags,
        }


class ArtistNormalizer:
    """Artist influence normalization and public release policy enforcement service.

    This service loads artist normalization taxonomies and provides detection methods
    for living artist references in text. It normalizes references like "style of Taylor Swift"
    to generic descriptions like "pop-influenced with storytelling vocals and melodic hooks".

    The normalizer supports:
    - Detection of living artist references using multiple patterns
    - Fuzzy matching for artist name variations and misspellings
    - Normalization to generic descriptions
    - Public release policy compliance checking
    - Structured reporting with audit trails

    Usage:
        ```python
        normalizer = ArtistNormalizer()

        # Detect artist references
        has_refs, references = normalizer.detect_artist_references("style of Taylor Swift")

        # Normalize text
        normalized_text, changes = normalizer.normalize_influences("sounds like Drake")
        # Returns: ("melodic hip-hop with R&B fusion and introspective lyrics", [...])

        # Check public release compliance
        compliant, violations = normalizer.check_public_release_compliance(
            text="style of Ed Sheeran",
            allow_artist_names=False
        )
        ```

    Determinism:
        - Artist lists are sorted alphabetically
        - Pattern matching follows fixed order
        - Fuzzy matching uses consistent threshold (0.85)
        - Normalization replacements are deterministic
    """

    def __init__(self, taxonomy_path: Optional[Path] = None):
        """Initialize the artist normalizer.

        Args:
            taxonomy_path: Optional path to artist normalization taxonomy JSON.
                          Defaults to /taxonomies/artist_normalization.json at project root.

        Raises:
            FileNotFoundError: If taxonomy file is not found
            ValueError: If taxonomy file is malformed
        """
        self.taxonomy: Dict[str, Any] = {}
        self.living_artists: Dict[str, List[Dict[str, Any]]] = {}
        self.generic_descriptions: Dict[str, str] = {}
        self.normalization_patterns: List[Dict[str, Any]] = []
        self.fuzzy_config: Dict[str, Any] = {}
        self.policy_modes: Dict[str, Dict[str, Any]] = {}

        # Artist lookup index for fast retrieval
        self._artist_index: Dict[str, Dict[str, Any]] = {}
        # Alias lookup index
        self._alias_index: Dict[str, str] = {}

        # Compiled regex patterns for performance
        self._compiled_patterns: List[Tuple[str, re.Pattern, str]] = []

        # Load taxonomy
        if taxonomy_path is None:
            # Default to project root /taxonomies/artist_normalization.json
            project_root = Path(__file__).parent.parent.parent.parent.parent
            taxonomy_path = project_root / "taxonomies" / "artist_normalization.json"

        self._load_taxonomy(taxonomy_path)
        self._build_indexes()
        self._compile_patterns()

        logger.info(
            "artist_normalizer.initialized",
            taxonomy_path=str(taxonomy_path),
            artist_count=len(self._artist_index),
            alias_count=len(self._alias_index),
            pattern_count=len(self._compiled_patterns),
            genre_count=len(self.living_artists)
        )

    def _load_taxonomy(self, path: Path) -> None:
        """Load artist normalization taxonomy from JSON file.

        Args:
            path: Path to taxonomy JSON file

        Raises:
            FileNotFoundError: If taxonomy file is not found
            ValueError: If taxonomy file is malformed
        """
        if not path.exists():
            logger.error(
                "artist_normalizer.taxonomy_not_found",
                path=str(path)
            )
            raise FileNotFoundError(f"Artist normalization taxonomy not found: {path}")

        try:
            with open(path, 'r') as f:
                self.taxonomy = json.load(f)

            # Extract living artists by genre
            self.living_artists = self.taxonomy.get("living_artists", {})

            # Extract generic descriptions
            self.generic_descriptions = self.taxonomy.get("generic_descriptions", {})

            # Extract normalization patterns
            self.normalization_patterns = self.taxonomy.get("normalization_patterns", [])

            # Extract fuzzy matching config
            self.fuzzy_config = self.taxonomy.get("fuzzy_matching", {})

            # Extract policy modes
            self.policy_modes = self.taxonomy.get("policy_modes", {})

            logger.debug(
                "artist_normalizer.taxonomy_loaded",
                genre_count=len(self.living_artists),
                pattern_count=len(self.normalization_patterns)
            )

        except json.JSONDecodeError as e:
            logger.error(
                "artist_normalizer.taxonomy_json_error",
                path=str(path),
                error=str(e)
            )
            raise ValueError(f"Invalid JSON in artist normalization taxonomy: {e}") from e
        except Exception as e:
            logger.error(
                "artist_normalizer.taxonomy_load_error",
                path=str(path),
                error=str(e),
                exc_info=True
            )
            raise

    def _build_indexes(self) -> None:
        """Build artist and alias indexes for fast lookup.

        Creates:
        1. Artist index: artist_name (lowercase) -> artist data
        2. Alias index: alias (lowercase) -> canonical artist name
        """
        for genre, artists in self.living_artists.items():
            for artist_data in artists:
                artist_name = artist_data["name"]
                artist_name_lower = artist_name.lower()

                # Add to artist index with genre
                self._artist_index[artist_name_lower] = {
                    **artist_data,
                    "genre": genre
                }

                # Add aliases to alias index
                for alias in artist_data.get("aliases", []):
                    alias_lower = alias.lower()
                    self._alias_index[alias_lower] = artist_name_lower

        logger.debug(
            "artist_normalizer.indexes_built",
            artist_count=len(self._artist_index),
            alias_count=len(self._alias_index)
        )

    def _compile_patterns(self) -> None:
        """Compile regex patterns for artist reference detection.

        Creates patterns for each normalization pattern template combined with
        each known artist and alias.

        Pattern format: (pattern_name, compiled_regex, replacement_template)
        """
        # Get all artist names and aliases
        all_artist_identifiers = set()

        # Add canonical names
        all_artist_identifiers.update(self._artist_index.keys())

        # Add aliases
        all_artist_identifiers.update(self._alias_index.keys())

        # Sort for deterministic ordering
        sorted_identifiers = sorted(all_artist_identifiers)

        # Build patterns for each template
        for pattern_config in self.normalization_patterns:
            pattern_template = pattern_config["pattern"]
            replacement_template = pattern_config["replacement"]
            context = pattern_config.get("context", "influence")

            # Create regex pattern that matches the template with any artist
            # Replace {artist} placeholder with a capture group
            # Escape special regex characters except {artist}
            escaped_template = pattern_template.replace("{artist}", "ARTIST_PLACEHOLDER")
            escaped_template = re.escape(escaped_template)
            escaped_template = escaped_template.replace("ARTIST_PLACEHOLDER", "(.+?)")

            # Create pattern that matches the template with artist capture
            pattern_regex = re.compile(
                rf'\b{escaped_template}\b',
                re.IGNORECASE
            )

            self._compiled_patterns.append((
                pattern_template,
                pattern_regex,
                replacement_template
            ))

        logger.debug(
            "artist_normalizer.patterns_compiled",
            pattern_count=len(self._compiled_patterns)
        )

    def _fuzzy_match_artist(self, text: str) -> Optional[str]:
        """Attempt to fuzzy match text to a known artist name.

        Args:
            text: Text to match against artist names

        Returns:
            Canonical artist name if match found, None otherwise
        """
        if not self.fuzzy_config.get("enabled", False):
            return None

        text_lower = text.lower().strip()
        min_threshold = self.fuzzy_config.get("min_similarity_threshold", 0.85)

        # Try exact match first
        if text_lower in self._artist_index:
            return text_lower

        if text_lower in self._alias_index:
            return self._alias_index[text_lower]

        # Try fuzzy matching (simple Levenshtein-like approach)
        # For production, consider using python-Levenshtein or fuzzywuzzy
        best_match = None
        best_score = 0.0

        for artist_name in self._artist_index.keys():
            # Simple similarity: ratio of matching characters
            similarity = self._calculate_similarity(text_lower, artist_name)

            if similarity > best_score and similarity >= min_threshold:
                best_score = similarity
                best_match = artist_name

        # Also check aliases
        for alias, canonical in self._alias_index.items():
            similarity = self._calculate_similarity(text_lower, alias)

            if similarity > best_score and similarity >= min_threshold:
                best_score = similarity
                best_match = canonical

        if best_match:
            logger.debug(
                "artist_normalizer.fuzzy_match",
                input=text,
                matched=best_match,
                score=best_score
            )

        return best_match

    def _calculate_similarity(self, s1: str, s2: str) -> float:
        """Calculate simple character-based similarity between two strings.

        This is a basic implementation. For production, consider using
        python-Levenshtein or difflib for better accuracy.

        Args:
            s1: First string
            s2: Second string

        Returns:
            Similarity score from 0.0 to 1.0
        """
        if not s1 or not s2:
            return 0.0

        if s1 == s2:
            return 1.0

        # Use difflib's SequenceMatcher for basic similarity
        from difflib import SequenceMatcher
        return SequenceMatcher(None, s1, s2).ratio()

    def get_generic_description(self, artist_name: str) -> Optional[str]:
        """Get generic description for an artist.

        Args:
            artist_name: Artist name (case-insensitive)

        Returns:
            Generic description string or None if artist not found
        """
        artist_name_lower = artist_name.lower()

        # Try exact match
        if artist_name_lower in self._artist_index:
            artist_data = self._artist_index[artist_name_lower]
            return artist_data.get("generic_description")

        # Try alias match
        if artist_name_lower in self._alias_index:
            canonical = self._alias_index[artist_name_lower]
            artist_data = self._artist_index[canonical]
            return artist_data.get("generic_description")

        # Try fuzzy match
        matched = self._fuzzy_match_artist(artist_name)
        if matched:
            artist_data = self._artist_index[matched]
            return artist_data.get("generic_description")

        return None

    def detect_artist_references(self, text: str) -> Tuple[bool, List[Dict[str, Any]]]:
        """Detect living artist references in text.

        Args:
            text: Text to analyze

        Returns:
            Tuple of (has_references, references)
            - has_references: True if any artist references detected
            - references: List of reference dictionaries with details
        """
        if not text:
            return False, []

        logger.debug(
            "artist_normalizer.detect_start",
            text_length=len(text)
        )

        references: List[ArtistReference] = []
        detected_positions: Set[int] = set()

        # Check each compiled pattern
        for pattern_template, pattern_regex, replacement_template in self._compiled_patterns:
            for match in pattern_regex.finditer(text):
                position = match.start()

                # Skip if we already detected a reference at this position
                if position in detected_positions:
                    continue

                # Extract the artist name from the capture group
                try:
                    captured_artist = match.group(1)
                except IndexError:
                    continue

                # Try to match the captured artist to a known artist
                artist_name_lower = captured_artist.lower().strip()

                # Try exact match first
                matched_artist = None
                if artist_name_lower in self._artist_index:
                    matched_artist = artist_name_lower
                elif artist_name_lower in self._alias_index:
                    matched_artist = self._alias_index[artist_name_lower]
                else:
                    # Try fuzzy match
                    matched_artist = self._fuzzy_match_artist(captured_artist)

                if not matched_artist:
                    continue

                # Get artist data
                artist_data = self._artist_index[matched_artist]
                artist_name = artist_data["name"]
                generic_desc = artist_data["generic_description"]
                genre = artist_data["genre"]
                style_tags = artist_data.get("style_tags", [])

                # Build generic replacement
                if "{generic_description}" in replacement_template:
                    generic_replacement = replacement_template.replace(
                        "{generic_description}",
                        generic_desc
                    )
                elif "{genre}" in replacement_template:
                    generic_replacement = replacement_template.replace(
                        "{genre}",
                        genre
                    )
                else:
                    generic_replacement = generic_desc

                # Create reference
                reference = ArtistReference(
                    artist_name=artist_name,
                    position=position,
                    pattern_used=pattern_template,
                    matched_text=match.group(),
                    generic_replacement=generic_replacement,
                    requires_normalization=True,
                    confidence=1.0 if artist_name_lower in self._artist_index else 0.9,
                    genre=genre,
                    style_tags=style_tags
                )

                references.append(reference)
                detected_positions.add(position)

                logger.debug(
                    "artist_normalizer.reference_detected",
                    artist=artist_name,
                    position=position,
                    pattern=pattern_template,
                    matched=match.group()
                )

        # Sort by position for deterministic ordering
        references.sort(key=lambda r: r.position)

        # Convert to dictionaries
        reference_dicts = [r.to_dict() for r in references]

        has_references = len(references) > 0

        logger.info(
            "artist_normalizer.detect_complete",
            text_length=len(text),
            reference_count=len(references),
            has_references=has_references
        )

        return has_references, reference_dicts

    def normalize_influences(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        """Normalize artist influences in text to generic descriptions.

        Args:
            text: Text to normalize

        Returns:
            Tuple of (normalized_text, changes)
            - normalized_text: Text with artist references replaced
            - changes: List of change dictionaries documenting replacements
        """
        if not text:
            return text, []

        # Detect all artist references
        has_references, references = self.detect_artist_references(text)

        if not has_references:
            return text, []

        # Sort references by position in reverse order
        # This ensures we replace from end to start, maintaining positions
        sorted_references = sorted(references, key=lambda r: r["position"], reverse=True)

        normalized_text = text
        changes = []

        for reference in sorted_references:
            position = reference["position"]
            matched_text = reference["matched_text"]
            generic_replacement = reference["generic_replacement"]

            # Replace the artist reference with generic description
            normalized_text = (
                normalized_text[:position] +
                generic_replacement +
                normalized_text[position + len(matched_text):]
            )

            # Document the change
            change = {
                "original": matched_text,
                "replacement": generic_replacement,
                "artist": reference["artist_name"],
                "position": position,
                "pattern": reference["pattern_used"]
            }
            changes.append(change)

            logger.debug(
                "artist_normalizer.normalized",
                original=matched_text,
                replacement=generic_replacement,
                artist=reference["artist_name"]
            )

        logger.info(
            "artist_normalizer.normalize_complete",
            original_length=len(text),
            normalized_length=len(normalized_text),
            change_count=len(changes)
        )

        return normalized_text, changes

    def check_public_release_compliance(
        self,
        text: str,
        allow_artist_names: bool = False
    ) -> Tuple[bool, List[str]]:
        """Check if text complies with public release policy.

        Args:
            text: Text to check
            allow_artist_names: If True, allow artist name references (permissive mode)

        Returns:
            Tuple of (compliant, violations)
            - compliant: True if text is compliant with policy
            - violations: List of violation descriptions
        """
        if allow_artist_names:
            # Permissive mode - always compliant
            return True, []

        # Detect artist references
        has_references, references = self.detect_artist_references(text)

        if not has_references:
            return True, []

        # Build violation list
        violations = []
        for reference in references:
            violation = (
                f"Living artist reference detected: '{reference['matched_text']}' "
                f"(artist: {reference['artist_name']}, pattern: {reference['pattern_used']}). "
                f"Public releases cannot contain 'style of [Living Artist]' patterns."
            )
            violations.append(violation)

        compliant = len(violations) == 0

        logger.info(
            "artist_normalizer.compliance_check",
            compliant=compliant,
            violation_count=len(violations),
            allow_artist_names=allow_artist_names
        )

        return compliant, violations


class PolicyEnforcer:
    """Policy enforcement service for content validation and release approval.

    This service enforces public release policies, checks persona policies,
    and maintains audit trails for policy overrides and approvals.

    The enforcer supports:
    - Public release policy enforcement (no living artist references)
    - Persona-level policy checking
    - Policy override auditing
    - Approval tracking
    - Multi-level approval workflows (user, admin, system)

    Usage:
        ```python
        enforcer = PolicyEnforcer()

        # Check release policy
        compliant, violations = enforcer.enforce_release_policy(
            content={"style": "style of Taylor Swift", "lyrics": "..."},
            public_release=True
        )

        # Audit policy override
        enforcer.audit_policy_override(
            content_id="song_123",
            reason="Artist approved usage in contract",
            user_id="user_456",
            approval_level="admin"
        )
        ```

    Policy Modes:
        - strict: No living artist references in public releases
        - warn: Warn but allow with approval
        - permissive: Allow all references (non-public only)
    """

    def __init__(
        self,
        artist_normalizer: Optional[ArtistNormalizer] = None,
        taxonomy_path: Optional[Path] = None
    ):
        """Initialize the policy enforcer.

        Args:
            artist_normalizer: Optional ArtistNormalizer instance to use.
                              If None, creates a new instance.
            taxonomy_path: Optional path to taxonomy (passed to ArtistNormalizer)
        """
        self.artist_normalizer = artist_normalizer or ArtistNormalizer(taxonomy_path)
        self.audit_log: List[Dict[str, Any]] = []

        # Load policy config from taxonomy
        self.policy_modes = self.artist_normalizer.policy_modes
        self.audit_config = self.artist_normalizer.taxonomy.get("audit_config", {})

        logger.info(
            "policy_enforcer.initialized",
            policy_modes=list(self.policy_modes.keys()),
            audit_enabled=self.audit_config.get("log_overrides", False)
        )

    def enforce_release_policy(
        self,
        content: Dict[str, Any],
        public_release: bool,
        mode: str = "strict"
    ) -> Tuple[bool, List[str]]:
        """Enforce release policy on content.

        Args:
            content: Content dictionary to check (e.g., style, lyrics, producer notes)
            public_release: If True, enforce public release restrictions
            mode: Policy mode (strict, warn, permissive)

        Returns:
            Tuple of (compliant, violations)
            - compliant: True if content is compliant
            - violations: List of violation descriptions
        """
        if not public_release:
            # Non-public releases - always compliant
            return True, []

        # Get policy mode config
        mode_config = self.policy_modes.get(mode, self.policy_modes.get("strict", {}))
        allow_artist_names = mode_config.get("allow_artist_names", False)

        all_violations = []

        # Check each text field in content
        text_fields = ["style", "lyrics", "producer_notes", "description", "prompt"]

        for field in text_fields:
            if field not in content:
                continue

            field_value = content[field]

            # Handle different field types
            if isinstance(field_value, str):
                text_to_check = field_value
            elif isinstance(field_value, dict):
                # For structured fields like lyrics, extract text
                if "text" in field_value:
                    text_to_check = field_value["text"]
                elif "sections" in field_value:
                    # Concatenate all section texts
                    sections = field_value["sections"]
                    text_to_check = " ".join(
                        s.get("text", "") for s in sections if isinstance(s, dict)
                    )
                else:
                    # Try to serialize the dict
                    text_to_check = str(field_value)
            else:
                # Skip non-text fields
                continue

            # Check compliance
            compliant, violations = self.artist_normalizer.check_public_release_compliance(
                text=text_to_check,
                allow_artist_names=allow_artist_names
            )

            if not compliant:
                # Add field context to violations
                for violation in violations:
                    all_violations.append(f"[{field}] {violation}")

        # Determine overall compliance
        compliant = len(all_violations) == 0

        # Handle different modes
        if not compliant:
            if mode == "strict" and mode_config.get("reject_on_violation", True):
                logger.warning(
                    "policy_enforcer.release_policy_violation",
                    mode=mode,
                    violation_count=len(all_violations),
                    public_release=public_release
                )
            elif mode == "warn":
                logger.warning(
                    "policy_enforcer.release_policy_warning",
                    mode=mode,
                    violation_count=len(all_violations),
                    requires_approval=mode_config.get("require_approval", True)
                )

        logger.info(
            "policy_enforcer.release_policy_checked",
            compliant=compliant,
            violation_count=len(all_violations),
            mode=mode,
            public_release=public_release
        )

        return compliant, all_violations

    def check_persona_policy(
        self,
        persona_id: str,
        public_release: bool,
        persona_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Check if a persona can be used for public release.

        Args:
            persona_id: Persona identifier
            public_release: If True, check public release policy
            persona_data: Optional persona data dict with policy fields

        Returns:
            True if persona is allowed for the given release type
        """
        if not public_release:
            # Non-public releases - always allowed
            return True

        if persona_data is None:
            # No persona data provided - assume allowed
            logger.warning(
                "policy_enforcer.persona_data_missing",
                persona_id=persona_id,
                public_release=public_release
            )
            return True

        # Check persona public_release flag
        persona_public_release = persona_data.get("public_release", True)

        if not persona_public_release:
            logger.warning(
                "policy_enforcer.persona_not_public",
                persona_id=persona_id,
                public_release=public_release
            )
            return False

        return True

    def audit_policy_override(
        self,
        content_id: str,
        reason: str,
        user_id: str,
        approval_level: str = "user",
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Audit a policy override or approval.

        Args:
            content_id: Identifier of the content being approved
            reason: Reason for the override
            user_id: User who approved the override
            approval_level: Level of approval (user, admin, system)
            metadata: Optional additional metadata
        """
        if not self.audit_config.get("log_overrides", False):
            return

        # Validate approval level
        valid_levels = self.audit_config.get("approval_levels", ["user", "admin", "system"])
        if approval_level not in valid_levels:
            logger.warning(
                "policy_enforcer.invalid_approval_level",
                approval_level=approval_level,
                valid_levels=valid_levels
            )
            approval_level = "user"

        # Require reason if configured
        if self.audit_config.get("require_reason", True) and not reason:
            logger.warning(
                "policy_enforcer.override_missing_reason",
                content_id=content_id,
                user_id=user_id
            )

        # Create audit entry
        audit_entry = {
            "content_id": content_id,
            "reason": reason,
            "user_id": user_id,
            "approval_level": approval_level,
            "timestamp": self._get_timestamp(),
            "metadata": metadata or {}
        }

        # Add to audit log
        self.audit_log.append(audit_entry)

        logger.info(
            "policy_enforcer.override_audited",
            content_id=content_id,
            user_id=user_id,
            approval_level=approval_level,
            reason=reason
        )

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format.

        Returns:
            ISO-formatted timestamp string
        """
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()

    def get_audit_log(
        self,
        content_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get audit log entries, optionally filtered.

        Args:
            content_id: Optional content ID to filter by
            user_id: Optional user ID to filter by

        Returns:
            List of audit log entries
        """
        filtered_log = self.audit_log

        if content_id:
            filtered_log = [
                entry for entry in filtered_log
                if entry["content_id"] == content_id
            ]

        if user_id:
            filtered_log = [
                entry for entry in filtered_log
                if entry["user_id"] == user_id
            ]

        logger.debug(
            "policy_enforcer.audit_log_retrieved",
            total_entries=len(self.audit_log),
            filtered_entries=len(filtered_log),
            content_id=content_id,
            user_id=user_id
        )

        return filtered_log
