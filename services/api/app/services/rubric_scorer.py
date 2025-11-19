"""Rubric scoring engine for AMCS validation framework.

This module implements multi-metric scoring for song artifacts including:
- hook_density: Frequency of memorable phrases relative to total lines
- singability: Syllable consistency, word complexity, natural phrasing
- rhyme_tightness: Rhyme scheme consistency and strength
- section_completeness: All required sections present and properly formatted
- profanity_score: Percentage of lines with flagged content (inverse)

The scorer applies genre-specific weights from blueprints to compute weighted
composite scores and checks threshold compliance for validation gates.
"""

from __future__ import annotations

import re
from typing import Dict, Any, List, Tuple, Optional, Set
from dataclasses import dataclass, field
from collections import Counter
from enum import Enum
import structlog

from app.services.blueprint_service import BlueprintService
from app.services.policy_guards import ProfanityFilter
from app.models.blueprint import Blueprint

logger = structlog.get_logger(__name__)


class ThresholdDecision(Enum):
    """Decision enum for threshold validation.

    Used to categorize validation results based on proximity to thresholds.
    """
    PASS = "pass"  # Score exceeds threshold with comfortable margin
    FAIL = "fail"  # Score does not meet threshold
    BORDERLINE = "borderline"  # Score meets threshold but within 5% margin


@dataclass
class ScoreReport:
    """Detailed score breakdown for song artifacts.

    Attributes:
        hook_density: Hook density score (0.0-1.0)
        singability: Singability score (0.0-1.0)
        rhyme_tightness: Rhyme scheme score (0.0-1.0)
        section_completeness: Section completeness score (0.0-1.0)
        profanity_score: Profanity cleanliness score (0.0-1.0, higher = cleaner)
        total: Weighted composite score (0.0-1.0)
        weights: Applied weights from blueprint
        thresholds: Blueprint thresholds (min_total, max_profanity)
        explanations: Per-metric explanations
        meets_threshold: True if total score meets min_total threshold
        margin: Distance from threshold (positive = pass, negative = fail)
        metric_details: Detailed breakdown for debugging
    """
    hook_density: float
    singability: float
    rhyme_tightness: float
    section_completeness: float
    profanity_score: float
    total: float
    weights: Dict[str, float]
    thresholds: Dict[str, float]
    explanations: Dict[str, str]
    meets_threshold: bool
    margin: float
    metric_details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert score report to dictionary format.

        Returns:
            Dictionary representation of score report
        """
        return {
            "hook_density": self.hook_density,
            "singability": self.singability,
            "rhyme_tightness": self.rhyme_tightness,
            "section_completeness": self.section_completeness,
            "profanity_score": self.profanity_score,
            "total": self.total,
            "weights": self.weights,
            "thresholds": self.thresholds,
            "explanations": self.explanations,
            "meets_threshold": self.meets_threshold,
            "margin": self.margin,
            "metric_details": self.metric_details,
        }


class RubricScorer:
    """Multi-metric scoring engine for AMCS validation.

    This service calculates 5 independent metrics and applies genre-specific
    weights from blueprints to compute a weighted composite score. Each metric
    is scored 0.0-1.0 and includes detailed explanations for debugging.

    Metrics:
        1. hook_density: Repeated phrases (chorus hooks) relative to total lines
        2. singability: Syllable consistency, word complexity, line length
        3. rhyme_tightness: Rhyme scheme consistency and strength
        4. section_completeness: Required sections present and formatted
        5. profanity_score: Percentage of clean lines (inverse of violations)

    The scorer integrates with:
        - BlueprintService: For genre-specific weights and thresholds
        - ProfanityFilter: For profanity detection and scoring

    Determinism:
        - All metric calculations are deterministic given same inputs
        - Syllable counting uses consistent heuristics
        - Rhyme detection uses alphabetically sorted phonetic patterns
        - Section checking follows fixed ordering

    Usage:
        ```python
        scorer = RubricScorer(blueprint_service)

        report = scorer.score_artifacts(
            lyrics={"sections": [...]},
            style={"tags": [...]},
            producer_notes={...},
            genre="pop",
            explicit_allowed=False
        )

        if report.meets_threshold:
            print(f"PASS: Score {report.total:.2f}")
        else:
            print(f"FAIL: Score {report.total:.2f}, needs {report.thresholds['min_total']:.2f}")
        ```
    """

    def __init__(
        self,
        blueprint_service: BlueprintService,
        profanity_filter: Optional[ProfanityFilter] = None,
        config_path: Optional[str] = None
    ):
        """Initialize the rubric scorer.

        Args:
            blueprint_service: Service for loading blueprints and weights
            profanity_filter: Optional profanity filter (creates new if None)
            config_path: Optional path to rubric overrides config file.
                        If None, uses default configs/rubric_overrides.json
        """
        self.blueprint_service = blueprint_service
        self.profanity_filter = profanity_filter or ProfanityFilter()

        # Configuration state
        self.config: Dict[str, Any] = {}
        self.overrides: Dict[str, Dict[str, Any]] = {}
        self.ab_tests: Dict[str, Dict[str, Any]] = {}
        self.logging_config: Dict[str, bool] = {}
        self.validation_config: Dict[str, Any] = {}

        # Load optional override configuration
        self._load_override_config(config_path)

        logger.info(
            "rubric_scorer.initialized",
            has_blueprint_service=blueprint_service is not None,
            has_profanity_filter=self.profanity_filter is not None,
            has_overrides=len(self.overrides) > 0,
            override_genres=list(self.overrides.keys()),
            ab_test_count=len(self.ab_tests),
            config_loaded=bool(self.config)
        )

    # =========================================================================
    # Configuration Loading and Management
    # =========================================================================

    def _load_override_config(self, config_path: Optional[str]) -> None:
        """Load optional override configuration from JSON file.

        Loads genre-specific weight and threshold overrides, A/B test configurations,
        and logging preferences. If config file doesn't exist or is invalid, gracefully
        falls back to blueprint defaults.

        Args:
            config_path: Path to config file. If None, uses default location
                        (project_root/configs/rubric_overrides.json)
        """
        # Determine config path
        if config_path is None:
            # Default path: project_root/configs/rubric_overrides.json
            # Path structure: rubric_scorer.py -> services -> app -> api -> services -> MeatyMusic
            from pathlib import Path
            project_root = Path(__file__).parent.parent.parent.parent.parent
            config_path = str(project_root / "configs" / "rubric_overrides.json")

        # Try to load config file
        try:
            from pathlib import Path
            import json

            config_file = Path(config_path)

            if not config_file.exists():
                logger.info(
                    "rubric_scorer.config_not_found",
                    path=config_path,
                    message="Override config not found, using blueprint defaults"
                )
                return

            with open(config_file, 'r') as f:
                self.config = json.load(f)

            # Extract configuration sections
            self.overrides = self.config.get("overrides", {})
            self.ab_tests = self.config.get("ab_tests", {})
            self.logging_config = self.config.get("logging", {
                "log_threshold_decisions": True,
                "log_improvement_suggestions": True,
                "log_config_source": True,
                "log_ab_test_participation": True
            })
            self.validation_config = self.config.get("validation", {
                "require_weights_sum_to_one": True,
                "weight_sum_tolerance": 0.01,
                "require_all_metrics": True
            })

            # Validate configuration
            is_valid = self._validate_config(self.config)

            if not is_valid:
                logger.warning(
                    "rubric_scorer.config_invalid",
                    path=config_path,
                    message="Config validation failed, using blueprint defaults"
                )
                # Clear invalid config
                self.config = {}
                self.overrides = {}
                self.ab_tests = {}
                return

            logger.info(
                "rubric_scorer.config_loaded",
                path=config_path,
                override_count=len(self.overrides),
                ab_test_count=len(self.ab_tests),
                genres=list(self.overrides.keys())
            )

        except Exception as e:
            logger.error(
                "rubric_scorer.config_load_error",
                path=config_path,
                error=str(e),
                message="Failed to load config, using blueprint defaults"
            )
            # Ensure clean state on error
            self.config = {}
            self.overrides = {}
            self.ab_tests = {}

    def _validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate override configuration structure and values.

        Checks:
        - Weights sum to 1.0 (within tolerance)
        - All required metrics present
        - Thresholds in valid range (0.0-1.0)
        - A/B test structure valid

        Args:
            config: Configuration dictionary to validate

        Returns:
            True if configuration is valid, False otherwise
        """
        try:
            overrides = config.get("overrides", {})
            validation_cfg = config.get("validation", {})

            require_sum_to_one = validation_cfg.get("require_weights_sum_to_one", True)
            tolerance = validation_cfg.get("weight_sum_tolerance", 0.01)
            require_all_metrics = validation_cfg.get("require_all_metrics", True)
            required_metrics = validation_cfg.get("required_metrics", [
                "hook_density", "singability", "rhyme_tightness",
                "section_completeness", "profanity_score"
            ])

            # Validate each genre override
            for genre, genre_config in overrides.items():
                weights = genre_config.get("weights", {})
                thresholds = genre_config.get("thresholds", {})

                # Check all required metrics present
                if require_all_metrics:
                    missing_metrics = set(required_metrics) - set(weights.keys())
                    if missing_metrics:
                        logger.error(
                            "rubric_scorer.config_validation_failed",
                            genre=genre,
                            reason="missing_metrics",
                            missing=list(missing_metrics)
                        )
                        return False

                # Check weights sum to 1.0
                if require_sum_to_one:
                    weight_sum = sum(weights.values())
                    if abs(weight_sum - 1.0) > tolerance:
                        logger.error(
                            "rubric_scorer.config_validation_failed",
                            genre=genre,
                            reason="weights_sum_invalid",
                            weight_sum=weight_sum,
                            expected=1.0,
                            tolerance=tolerance
                        )
                        return False

                # Check weight values in range [0.0, 1.0]
                for metric, weight in weights.items():
                    if not (0.0 <= weight <= 1.0):
                        logger.error(
                            "rubric_scorer.config_validation_failed",
                            genre=genre,
                            reason="weight_out_of_range",
                            metric=metric,
                            weight=weight
                        )
                        return False

                # Check threshold values in range [0.0, 1.0]
                for threshold_name, threshold_value in thresholds.items():
                    if not (0.0 <= threshold_value <= 1.0):
                        logger.error(
                            "rubric_scorer.config_validation_failed",
                            genre=genre,
                            reason="threshold_out_of_range",
                            threshold=threshold_name,
                            value=threshold_value
                        )
                        return False

            # Validate A/B tests
            ab_tests = config.get("ab_tests", {})
            for test_id, test_config in ab_tests.items():
                # Check required fields
                if "name" not in test_config or "genres" not in test_config:
                    logger.error(
                        "rubric_scorer.config_validation_failed",
                        test_id=test_id,
                        reason="ab_test_missing_fields"
                    )
                    return False

                # Validate override structure if present
                if "overrides" in test_config:
                    test_overrides = test_config["overrides"]

                    # Check weight values if present
                    if "weights" in test_overrides:
                        for metric, weight in test_overrides["weights"].items():
                            if not (0.0 <= weight <= 1.0):
                                logger.error(
                                    "rubric_scorer.config_validation_failed",
                                    test_id=test_id,
                                    reason="ab_test_weight_out_of_range",
                                    metric=metric,
                                    weight=weight
                                )
                                return False

                    # Check threshold values if present
                    if "thresholds" in test_overrides:
                        for threshold_name, threshold_value in test_overrides["thresholds"].items():
                            if not (0.0 <= threshold_value <= 1.0):
                                logger.error(
                                    "rubric_scorer.config_validation_failed",
                                    test_id=test_id,
                                    reason="ab_test_threshold_out_of_range",
                                    threshold=threshold_name,
                                    value=threshold_value
                                )
                                return False

            logger.debug(
                "rubric_scorer.config_validation_passed",
                genre_count=len(overrides),
                ab_test_count=len(ab_tests)
            )

            return True

        except Exception as e:
            logger.error(
                "rubric_scorer.config_validation_error",
                error=str(e),
                exc_info=True
            )
            return False

    def _get_weights(self, genre: str, blueprint: Blueprint) -> Dict[str, float]:
        """Get weights for genre with override precedence.

        Precedence order:
        1. Enabled A/B test overrides (if genre matches)
        2. Genre-specific overrides from config
        3. Blueprint defaults

        Args:
            genre: Genre name (normalized to lowercase)
            blueprint: Blueprint with default weights

        Returns:
            Dictionary of metric weights
        """
        genre_lower = genre.lower()

        # Start with blueprint defaults
        weights = blueprint.eval_rubric.get("weights", {
            "hook_density": 0.25,
            "singability": 0.20,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.20,
            "profanity_score": 0.20
        }).copy()

        config_source = "blueprint"

        # Apply genre-specific overrides if present
        if genre_lower in self.overrides:
            override_weights = self.overrides[genre_lower].get("weights", {})
            weights.update(override_weights)
            config_source = "override"

        # Apply A/B test overrides if applicable
        weights, ab_test_applied = self._apply_ab_tests(genre_lower, weights, {})

        if ab_test_applied:
            config_source = "ab_test"

        # Log configuration source
        if self.logging_config.get("log_config_source", True):
            logger.debug(
                "rubric_scorer.weights_resolved",
                genre=genre,
                source=config_source,
                weights=weights,
                ab_test_applied=ab_test_applied
            )

        return weights

    def _get_thresholds(self, genre: str, blueprint: Blueprint) -> Dict[str, float]:
        """Get thresholds for genre with override precedence.

        Precedence order:
        1. Enabled A/B test overrides (if genre matches)
        2. Genre-specific overrides from config
        3. Blueprint defaults

        Args:
            genre: Genre name (normalized to lowercase)
            blueprint: Blueprint with default thresholds

        Returns:
            Dictionary of thresholds
        """
        genre_lower = genre.lower()

        # Start with blueprint defaults
        thresholds = blueprint.eval_rubric.get("thresholds", {
            "min_total": 0.75,
            "max_profanity": 0.1
        }).copy()

        config_source = "blueprint"

        # Apply genre-specific overrides if present
        if genre_lower in self.overrides:
            override_thresholds = self.overrides[genre_lower].get("thresholds", {})
            thresholds.update(override_thresholds)
            config_source = "override"

        # Apply A/B test overrides if applicable
        _, ab_test_applied = self._apply_ab_tests(genre_lower, {}, thresholds)

        if ab_test_applied:
            config_source = "ab_test"

        # Log configuration source
        if self.logging_config.get("log_config_source", True):
            logger.debug(
                "rubric_scorer.thresholds_resolved",
                genre=genre,
                source=config_source,
                thresholds=thresholds,
                ab_test_applied=ab_test_applied
            )

        return thresholds

    def _apply_ab_tests(
        self,
        genre: str,
        weights: Dict[str, float],
        thresholds: Dict[str, float]
    ) -> Tuple[Dict[str, float], bool]:
        """Apply enabled A/B test overrides if genre matches.

        Modifies weights and thresholds in place if A/B test applies.
        Only applies first matching enabled test.

        Args:
            genre: Genre name (normalized to lowercase)
            weights: Current weights dictionary (modified in place)
            thresholds: Current thresholds dictionary (modified in place)

        Returns:
            Tuple of (weights, ab_test_applied):
            - weights: Potentially modified weights
            - ab_test_applied: True if an A/B test was applied
        """
        ab_test_applied = False

        for test_id, test_config in self.ab_tests.items():
            # Check if test is enabled
            if not test_config.get("enabled", False):
                continue

            # Check if genre matches
            test_genres = test_config.get("genres", [])
            if genre not in test_genres:
                continue

            # Apply test overrides
            test_overrides = test_config.get("overrides", {})

            if "weights" in test_overrides:
                weights.update(test_overrides["weights"])

            if "thresholds" in test_overrides:
                thresholds.update(test_overrides["thresholds"])

            ab_test_applied = True

            # Log A/B test participation
            if self.logging_config.get("log_ab_test_participation", True):
                logger.info(
                    "rubric_scorer.ab_test_applied",
                    test_id=test_id,
                    test_name=test_config.get("name", "Unknown"),
                    genre=genre,
                    weight_overrides=test_overrides.get("weights", {}),
                    threshold_overrides=test_overrides.get("thresholds", {})
                )

            # Only apply first matching test
            break

        return weights, ab_test_applied

    # =========================================================================
    # Hook Density Metric
    # =========================================================================

    def calculate_hook_density(
        self,
        lyrics: Dict[str, Any]
    ) -> Tuple[float, str, Dict[str, Any]]:
        """Calculate hook density score with explanation.

        Hook density measures the frequency of memorable, repeated phrases
        relative to total lines. Chorus repetitions are weighted higher as
        they typically contain the main hooks.

        Formula:
            hook_density = repeated_line_count / total_line_count

        A "hook" is defined as:
        - A phrase (≥3 words) that appears 2+ times in the song
        - Lines from chorus sections (weighted 1.5x)
        - Identical or near-identical repetitions

        Args:
            lyrics: Lyrics dictionary with sections

        Returns:
            Tuple of (score, explanation, details)
            - score: Hook density (0.0-1.0)
            - explanation: Human-readable explanation
            - details: Detailed breakdown for debugging

        Examples:
            >>> lyrics = {"sections": [
            ...     {"name": "verse", "lines": ["Line A", "Line B"]},
            ...     {"name": "chorus", "lines": ["Hook line", "Hook line"]}
            ... ]}
            >>> score, explanation, details = scorer.calculate_hook_density(lyrics)
            >>> # Score will be higher due to repeated chorus hook
        """
        # Extract sections
        sections = self._extract_sections(lyrics)

        if not sections:
            logger.warning("hook_density.no_sections")
            return 0.0, "No sections found in lyrics", {}

        # Collect all lines with section metadata
        all_lines: List[Tuple[str, str]] = []  # (line, section_name)
        chorus_lines: List[str] = []

        for section in sections:
            section_name = section.get("name", "unknown").lower()
            section_lines = section.get("lines", [])

            for line in section_lines:
                line_text = line.strip() if isinstance(line, str) else str(line).strip()
                if line_text:
                    all_lines.append((line_text, section_name))

                    # Track chorus lines separately for weighting
                    if "chorus" in section_name:
                        chorus_lines.append(line_text)

        if not all_lines:
            logger.warning("hook_density.no_lines")
            return 0.0, "No lines found in lyrics", {}

        total_lines = len(all_lines)

        # Extract phrases (3+ word sequences) from all lines
        phrase_counts: Counter[str] = Counter()

        for line_text, _ in all_lines:
            phrases = self._extract_phrases(line_text, min_words=3)
            for phrase in phrases:
                phrase_counts[phrase] += 1

        # Count repeated phrases (appear 2+ times)
        repeated_phrases = {
            phrase: count
            for phrase, count in phrase_counts.items()
            if count >= 2
        }

        # Count lines that contain repeated phrases
        repeated_line_count = 0
        hook_phrases: Set[str] = set()

        for line_text, section_name in all_lines:
            line_has_hook = False
            for phrase in repeated_phrases:
                if phrase.lower() in line_text.lower():
                    line_has_hook = True
                    hook_phrases.add(phrase)

            if line_has_hook:
                # Weight chorus lines 1.5x
                if "chorus" in section_name:
                    repeated_line_count += 1.5
                else:
                    repeated_line_count += 1.0

        # Calculate score (normalized by total lines)
        score = min(1.0, repeated_line_count / total_lines) if total_lines > 0 else 0.0

        # Build explanation
        hook_count = len(hook_phrases)
        explanation = (
            f"Hook density: {score:.2f}. "
            f"Found {hook_count} repeated phrases across {int(repeated_line_count)} lines "
            f"(out of {total_lines} total). "
        )

        if score >= 0.7:
            explanation += "Strong hook presence."
        elif score >= 0.5:
            explanation += "Moderate hook presence."
        elif score >= 0.3:
            explanation += "Weak hook presence - consider adding more repetition."
        else:
            explanation += "Very weak hook presence - needs memorable repeated phrases."

        details = {
            "total_lines": total_lines,
            "repeated_line_count": int(repeated_line_count),
            "hook_phrases": sorted(list(hook_phrases)),
            "phrase_counts": dict(sorted(repeated_phrases.items(), key=lambda x: -x[1])[:10])
        }

        logger.debug(
            "hook_density.calculated",
            score=score,
            total_lines=total_lines,
            repeated_line_count=int(repeated_line_count),
            hook_count=hook_count
        )

        return score, explanation, details

    def _extract_phrases(self, text: str, min_words: int = 3) -> List[str]:
        """Extract word phrases from text.

        Args:
            text: Text to extract phrases from
            min_words: Minimum number of words in a phrase

        Returns:
            List of phrases (normalized, lowercase)
        """
        # Normalize text
        text = text.lower().strip()

        # Split into words
        words = re.findall(r'\b\w+\b', text)

        if len(words) < min_words:
            return []

        phrases = []

        # Extract sliding window phrases
        for i in range(len(words) - min_words + 1):
            phrase = " ".join(words[i:i + min_words])
            phrases.append(phrase)

        return phrases

    # =========================================================================
    # Singability Metric
    # =========================================================================

    def calculate_singability(
        self,
        lyrics: Dict[str, Any]
    ) -> Tuple[float, str, Dict[str, Any]]:
        """Calculate singability score with explanation.

        Singability measures how easy lyrics are to sing and remember based on:
        - Syllable consistency across similar sections (verses, choruses)
        - Word complexity (avoiding overly complex multi-syllable words)
        - Line length consistency (avoiding jarring length changes)

        This is a heuristic approach. For production, consider phonetic analysis.

        Args:
            lyrics: Lyrics dictionary with sections

        Returns:
            Tuple of (score, explanation, details)

        Examples:
            >>> lyrics = {"sections": [
            ...     {"name": "verse", "lines": ["Simple line here"]},
            ...     {"name": "chorus", "lines": ["Easy to sing"]}
            ... ]}
            >>> score, explanation, details = scorer.calculate_singability(lyrics)
        """
        sections = self._extract_sections(lyrics)

        if not sections:
            return 0.0, "No sections found", {}

        # Collect syllable counts and word complexity per section type
        section_type_data: Dict[str, List[Dict[str, Any]]] = {}
        all_lines_data: List[Dict[str, Any]] = []

        for section in sections:
            section_name = section.get("name", "unknown").lower()
            section_type = self._normalize_section_type(section_name)
            section_lines = section.get("lines", [])

            if section_type not in section_type_data:
                section_type_data[section_type] = []

            for line in section_lines:
                line_text = line.strip() if isinstance(line, str) else str(line).strip()
                if not line_text:
                    continue

                # Calculate line metrics
                line_data = self._analyze_line_singability(line_text)
                section_type_data[section_type].append(line_data)
                all_lines_data.append(line_data)

        if not all_lines_data:
            return 0.0, "No lines to analyze", {}

        # Calculate component scores
        syllable_consistency_score = self._calculate_syllable_consistency(section_type_data)
        word_complexity_score = self._calculate_word_complexity(all_lines_data)
        line_length_score = self._calculate_line_length_consistency(section_type_data)

        # Weighted composite
        score = (
            syllable_consistency_score * 0.4 +
            word_complexity_score * 0.3 +
            line_length_score * 0.3
        )

        # Build explanation
        explanation = f"Singability: {score:.2f}. "

        if score >= 0.7:
            explanation += "Highly singable with consistent phrasing."
        elif score >= 0.5:
            explanation += "Moderately singable."
        else:
            explanation += "Low singability - consider simplifying phrasing."

        details = {
            "syllable_consistency": syllable_consistency_score,
            "word_complexity": word_complexity_score,
            "line_length_consistency": line_length_score,
            "avg_syllables_per_line": sum(d["syllable_count"] for d in all_lines_data) / len(all_lines_data),
            "avg_complex_words_per_line": sum(d["complex_word_count"] for d in all_lines_data) / len(all_lines_data)
        }

        logger.debug(
            "singability.calculated",
            score=score,
            syllable_consistency=syllable_consistency_score,
            word_complexity=word_complexity_score,
            line_length=line_length_score
        )

        return score, explanation, details

    def _normalize_section_type(self, section_name: str) -> str:
        """Normalize section name to type.

        Args:
            section_name: Section name (e.g., "verse_1", "chorus")

        Returns:
            Normalized type (verse, chorus, bridge, etc.)
        """
        section_lower = section_name.lower()

        if "verse" in section_lower:
            return "verse"
        elif "chorus" in section_lower:
            return "chorus"
        elif "bridge" in section_lower:
            return "bridge"
        elif "pre" in section_lower and "chorus" in section_lower:
            return "prechorus"
        elif "intro" in section_lower:
            return "intro"
        elif "outro" in section_lower:
            return "outro"
        else:
            return "other"

    def _analyze_line_singability(self, line: str) -> Dict[str, Any]:
        """Analyze singability metrics for a single line.

        Args:
            line: Line text to analyze

        Returns:
            Dict with syllable_count, word_count, complex_word_count, char_length
        """
        words = re.findall(r'\b\w+\b', line)

        syllable_count = sum(self._count_syllables(word) for word in words)
        word_count = len(words)
        complex_word_count = sum(1 for word in words if self._count_syllables(word) > 3)
        char_length = len(line)

        return {
            "syllable_count": syllable_count,
            "word_count": word_count,
            "complex_word_count": complex_word_count,
            "char_length": char_length
        }

    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word (heuristic approach).

        This is a simple vowel-counting heuristic. For production, consider
        using a library like pyphen or syllables.

        Args:
            word: Word to count syllables

        Returns:
            Estimated syllable count
        """
        word = word.lower().strip()

        if not word:
            return 0

        # Remove non-alphabetic characters
        word = re.sub(r'[^a-z]', '', word)

        if not word:
            return 0

        # Count vowel groups
        vowel_groups = re.findall(r'[aeiouy]+', word)
        count = len(vowel_groups)

        # Adjust for silent 'e' at end
        if word.endswith('e') and count > 1:
            count -= 1

        # Ensure at least 1 syllable
        return max(1, count)

    def _calculate_syllable_consistency(
        self,
        section_type_data: Dict[str, List[Dict[str, Any]]]
    ) -> float:
        """Calculate syllable consistency score across section types.

        Args:
            section_type_data: Dict mapping section type to list of line data

        Returns:
            Consistency score (0.0-1.0)
        """
        # Calculate variance for each section type
        variances = []

        for section_type, lines_data in section_type_data.items():
            if len(lines_data) < 2:
                continue

            syllable_counts = [d["syllable_count"] for d in lines_data]
            mean = sum(syllable_counts) / len(syllable_counts)
            variance = sum((x - mean) ** 2 for x in syllable_counts) / len(syllable_counts)
            variances.append(variance)

        if not variances:
            return 1.0  # Perfect consistency if only one line per section

        # Average variance
        avg_variance = sum(variances) / len(variances)

        # Convert to score (lower variance = higher score)
        # Normalize by expected variance (assume max variance ~25)
        score = max(0.0, 1.0 - (avg_variance / 25.0))

        return score

    def _calculate_word_complexity(self, all_lines_data: List[Dict[str, Any]]) -> float:
        """Calculate word complexity score.

        Args:
            all_lines_data: List of line analysis dicts

        Returns:
            Complexity score (0.0-1.0, higher = simpler)
        """
        if not all_lines_data:
            return 1.0

        # Calculate ratio of complex words to total words
        total_words = sum(d["word_count"] for d in all_lines_data)
        complex_words = sum(d["complex_word_count"] for d in all_lines_data)

        if total_words == 0:
            return 1.0

        complex_ratio = complex_words / total_words

        # Invert: fewer complex words = higher score
        # Assume acceptable ratio is up to 0.3 (30% complex)
        score = max(0.0, 1.0 - (complex_ratio / 0.3))

        return min(1.0, score)

    def _calculate_line_length_consistency(
        self,
        section_type_data: Dict[str, List[Dict[str, Any]]]
    ) -> float:
        """Calculate line length consistency score.

        Args:
            section_type_data: Dict mapping section type to list of line data

        Returns:
            Consistency score (0.0-1.0)
        """
        # Calculate variance for each section type
        variances = []

        for section_type, lines_data in section_type_data.items():
            if len(lines_data) < 2:
                continue

            char_lengths = [d["char_length"] for d in lines_data]
            mean = sum(char_lengths) / len(char_lengths)
            variance = sum((x - mean) ** 2 for x in char_lengths) / len(char_lengths)
            variances.append(variance)

        if not variances:
            return 1.0

        # Average variance
        avg_variance = sum(variances) / len(variances)

        # Convert to score (lower variance = higher score)
        # Normalize by expected variance (assume max variance ~400)
        score = max(0.0, 1.0 - (avg_variance / 400.0))

        return score

    # =========================================================================
    # Rhyme Tightness Metric
    # =========================================================================

    def calculate_rhyme_tightness(
        self,
        lyrics: Dict[str, Any]
    ) -> Tuple[float, str, Dict[str, Any]]:
        """Calculate rhyme scheme consistency and strength.

        Detects rhyming line pairs and checks consistency of rhyme scheme.
        Uses phonetic similarity (last syllable matching) to identify rhymes.

        Args:
            lyrics: Lyrics dictionary with sections

        Returns:
            Tuple of (score, explanation, details)
        """
        sections = self._extract_sections(lyrics)

        if not sections:
            return 0.0, "No sections found", {}

        # Collect all lines with section context
        all_lines: List[Tuple[str, str]] = []  # (line, section_name)

        for section in sections:
            section_name = section.get("name", "unknown")
            section_lines = section.get("lines", [])

            for line in section_lines:
                line_text = line.strip() if isinstance(line, str) else str(line).strip()
                if line_text:
                    all_lines.append((line_text, section_name))

        if len(all_lines) < 2:
            return 0.0, "Need at least 2 lines to evaluate rhyme", {}

        # Detect rhyming pairs
        rhyme_pairs = self._detect_rhyme_pairs(all_lines)

        # Calculate expected rhymes (assume every other line should rhyme)
        # This is a simplification; real songs have various schemes (AABB, ABAB, etc.)
        expected_rhymes = len(all_lines) // 2
        matched_rhymes = len(rhyme_pairs)

        # Calculate score
        score = min(1.0, matched_rhymes / expected_rhymes) if expected_rhymes > 0 else 0.0

        # Build explanation
        explanation = f"Rhyme tightness: {score:.2f}. "
        explanation += f"Found {matched_rhymes} rhyming pairs out of {expected_rhymes} expected. "

        if score >= 0.7:
            explanation += "Strong rhyme scheme."
        elif score >= 0.5:
            explanation += "Moderate rhyme scheme."
        else:
            explanation += "Weak rhyme scheme - consider tightening rhymes."

        details = {
            "total_lines": len(all_lines),
            "matched_rhymes": matched_rhymes,
            "expected_rhymes": expected_rhymes,
            "rhyme_pairs": rhyme_pairs[:10]  # Top 10 for debugging
        }

        logger.debug(
            "rhyme_tightness.calculated",
            score=score,
            matched_rhymes=matched_rhymes,
            expected_rhymes=expected_rhymes
        )

        return score, explanation, details

    def _detect_rhyme_pairs(
        self,
        lines: List[Tuple[str, str]]
    ) -> List[Tuple[str, str]]:
        """Detect rhyming line pairs.

        Args:
            lines: List of (line_text, section_name) tuples

        Returns:
            List of rhyming pairs (line1, line2)
        """
        rhyme_pairs = []

        # Extract last words from each line
        line_endings: List[Tuple[str, str]] = []  # (last_word, full_line)

        for line_text, _ in lines:
            words = re.findall(r'\b\w+\b', line_text)
            if words:
                last_word = words[-1].lower()
                line_endings.append((last_word, line_text))

        # Check consecutive lines for rhymes (AABB pattern)
        for i in range(0, len(line_endings) - 1, 2):
            if i + 1 < len(line_endings):
                word1, line1 = line_endings[i]
                word2, line2 = line_endings[i + 1]

                if self._words_rhyme(word1, word2):
                    rhyme_pairs.append((line1, line2))

        # Check alternating lines for rhymes (ABAB pattern)
        for i in range(len(line_endings) - 3):
            word1, line1 = line_endings[i]
            word2, line2 = line_endings[i + 2]

            if self._words_rhyme(word1, word2):
                # Avoid duplicates
                if (line1, line2) not in rhyme_pairs and (line2, line1) not in rhyme_pairs:
                    rhyme_pairs.append((line1, line2))

        return rhyme_pairs

    def _words_rhyme(self, word1: str, word2: str) -> bool:
        """Check if two words rhyme (simple phonetic similarity).

        This is a basic heuristic. For production, consider using
        pronouncing library or CMU dictionary.

        Args:
            word1: First word
            word2: Second word

        Returns:
            True if words rhyme
        """
        if word1 == word2:
            return False  # Same word doesn't count as rhyme

        # Simple suffix matching (last 2-3 characters)
        if len(word1) >= 2 and len(word2) >= 2:
            # Check last 2 characters
            if word1[-2:] == word2[-2:]:
                return True

            # Check last 3 characters for stronger rhymes
            if len(word1) >= 3 and len(word2) >= 3:
                if word1[-3:] == word2[-3:]:
                    return True

        return False

    # =========================================================================
    # Section Completeness Metric
    # =========================================================================

    def calculate_section_completeness(
        self,
        lyrics: Dict[str, Any],
        blueprint: Blueprint
    ) -> Tuple[float, str, Dict[str, Any]]:
        """Calculate section completeness score.

        Checks if all required sections are present and meet minimum line counts.

        Args:
            lyrics: Lyrics dictionary with sections
            blueprint: Blueprint with required sections

        Returns:
            Tuple of (score, explanation, details)
        """
        sections = self._extract_sections(lyrics)

        if not sections:
            return 0.0, "No sections found", {}

        # Get required sections from blueprint
        required_sections = blueprint.rules.get("required_sections", ["Verse", "Chorus"])

        # Normalize section names for comparison
        present_sections = set()
        section_line_counts: Dict[str, int] = {}

        for section in sections:
            section_name = section.get("name", "unknown")
            section_type = self._normalize_section_type(section_name)
            present_sections.add(section_type)

            # Count lines
            section_lines = section.get("lines", [])
            line_count = len([line for line in section_lines if line.strip()])

            # Track max line count per section type
            if section_type not in section_line_counts:
                section_line_counts[section_type] = 0
            section_line_counts[section_type] = max(
                section_line_counts[section_type],
                line_count
            )

        # Normalize required sections
        required_normalized = set(
            self._normalize_section_type(s) for s in required_sections
        )

        # Check presence
        missing_sections = required_normalized - present_sections
        completed_sections = required_normalized & present_sections

        # Calculate score based on completed vs required
        if required_normalized:
            score = len(completed_sections) / len(required_normalized)
        else:
            score = 1.0  # No requirements = perfect score

        # Check minimum line counts (heuristic: at least 2 lines per section)
        min_lines = 2
        sections_below_min = [
            section_type
            for section_type, line_count in section_line_counts.items()
            if line_count < min_lines and section_type in required_normalized
        ]

        # Penalize sections below minimum
        if sections_below_min:
            penalty = len(sections_below_min) * 0.1
            score = max(0.0, score - penalty)

        # Build explanation
        explanation = f"Section completeness: {score:.2f}. "

        if missing_sections:
            explanation += f"Missing required sections: {', '.join(sorted(missing_sections))}. "
        else:
            explanation += "All required sections present. "

        if sections_below_min:
            explanation += f"Sections below minimum lines: {', '.join(sorted(sections_below_min))}."

        details = {
            "required_sections": sorted(list(required_normalized)),
            "present_sections": sorted(list(present_sections)),
            "missing_sections": sorted(list(missing_sections)),
            "section_line_counts": section_line_counts,
            "sections_below_min": sections_below_min
        }

        logger.debug(
            "section_completeness.calculated",
            score=score,
            missing_count=len(missing_sections),
            present_count=len(present_sections)
        )

        return score, explanation, details

    # =========================================================================
    # Profanity Score Metric
    # =========================================================================

    def calculate_profanity_score(
        self,
        lyrics: Dict[str, Any],
        explicit_allowed: bool
    ) -> Tuple[float, str, Dict[str, Any]]:
        """Calculate profanity score (inverse of violations).

        Uses ProfanityFilter to detect violations. Score is inverted so that
        higher score = cleaner content.

        Formula:
            profanity_score = 1.0 - (profanity_violations / total_lines)

        Args:
            lyrics: Lyrics dictionary with sections
            explicit_allowed: If True, explicit content is allowed

        Returns:
            Tuple of (score, explanation, details)
        """
        sections = self._extract_sections(lyrics)

        if not sections:
            return 1.0, "No sections to check", {}

        # Collect all lines
        all_lines: List[str] = []

        for section in sections:
            section_lines = section.get("lines", [])
            for line in section_lines:
                line_text = line.strip() if isinstance(line, str) else str(line).strip()
                if line_text:
                    all_lines.append(line_text)

        if not all_lines:
            return 1.0, "No lines to check", {}

        total_lines = len(all_lines)

        # Check profanity in all lines
        violations_count = 0
        all_violations = []

        for line in all_lines:
            has_violations, violations = self.profanity_filter.detect_profanity(
                text=line,
                explicit_allowed=explicit_allowed
            )

            if has_violations:
                violations_count += 1
                all_violations.extend(violations)

        # Calculate score (inverse: 1.0 = no profanity)
        score = 1.0 - (violations_count / total_lines) if total_lines > 0 else 1.0
        score = max(0.0, min(1.0, score))

        # Build explanation
        explanation = f"Profanity score: {score:.2f}. "

        if violations_count == 0:
            explanation += "No profanity detected - clean content."
        else:
            explanation += f"Found {violations_count} lines with profanity out of {total_lines} total. "

            if explicit_allowed:
                explanation += "Explicit content allowed."
            else:
                explanation += "Explicit content NOT allowed - violations present."

        details = {
            "total_lines": total_lines,
            "violation_count": violations_count,
            "violation_ratio": violations_count / total_lines if total_lines > 0 else 0.0,
            "violations": all_violations[:10],  # Top 10 for debugging
            "explicit_allowed": explicit_allowed
        }

        logger.debug(
            "profanity_score.calculated",
            score=score,
            violation_count=violations_count,
            total_lines=total_lines
        )

        return score, explanation, details

    # =========================================================================
    # Composite Scoring
    # =========================================================================

    def score_artifacts(
        self,
        lyrics: Dict[str, Any],
        style: Dict[str, Any],
        producer_notes: Dict[str, Any],
        genre: str,
        explicit_allowed: bool,
        blueprint_version: str = "latest"
    ) -> ScoreReport:
        """Score all artifacts with genre-specific weights.

        This is the main scoring method that:
        1. Loads the blueprint for the genre
        2. Calculates all 5 metrics independently
        3. Applies genre-specific weights
        4. Computes weighted total score
        5. Checks threshold compliance
        6. Returns comprehensive ScoreReport

        Args:
            lyrics: Lyrics dictionary with sections
            style: Style dictionary
            producer_notes: Producer notes dictionary
            genre: Genre name (e.g., "pop", "country")
            explicit_allowed: If True, explicit content is allowed
            blueprint_version: Blueprint version (default "latest")

        Returns:
            ScoreReport with all metrics, weights, and explanations

        Raises:
            NotFoundError: If blueprint not found for genre
        """
        logger.info(
            "rubric_scorer.score_artifacts_start",
            genre=genre,
            explicit_allowed=explicit_allowed
        )

        # Load blueprint
        blueprint = self.blueprint_service.get_or_load_blueprint(
            genre=genre,
            version=blueprint_version
        )

        # Get weights and thresholds (with override precedence)
        # Precedence: A/B test > genre override > blueprint default
        weights = self._get_weights(genre, blueprint)
        thresholds = self._get_thresholds(genre, blueprint)

        # Calculate all metrics
        hook_density, hook_explanation, hook_details = self.calculate_hook_density(lyrics)
        singability, sing_explanation, sing_details = self.calculate_singability(lyrics)
        rhyme_tightness, rhyme_explanation, rhyme_details = self.calculate_rhyme_tightness(lyrics)
        section_completeness, section_explanation, section_details = self.calculate_section_completeness(lyrics, blueprint)
        profanity_score, profanity_explanation, profanity_details = self.calculate_profanity_score(lyrics, explicit_allowed)

        # Calculate weighted total
        total = (
            hook_density * weights.get("hook_density", 0.25) +
            singability * weights.get("singability", 0.20) +
            rhyme_tightness * weights.get("rhyme_tightness", 0.15) +
            section_completeness * weights.get("section_completeness", 0.20) +
            profanity_score * weights.get("profanity_score", 0.20)
        )

        # Check threshold compliance
        min_total = thresholds.get("min_total", 0.75)
        meets_threshold = total >= min_total
        margin = total - min_total

        # Build explanations
        explanations = {
            "hook_density": hook_explanation,
            "singability": sing_explanation,
            "rhyme_tightness": rhyme_explanation,
            "section_completeness": section_explanation,
            "profanity_score": profanity_explanation
        }

        # Build metric details
        metric_details = {
            "hook_density": hook_details,
            "singability": sing_details,
            "rhyme_tightness": rhyme_details,
            "section_completeness": section_details,
            "profanity_score": profanity_details
        }

        # Create score report
        report = ScoreReport(
            hook_density=hook_density,
            singability=singability,
            rhyme_tightness=rhyme_tightness,
            section_completeness=section_completeness,
            profanity_score=profanity_score,
            total=total,
            weights=weights,
            thresholds=thresholds,
            explanations=explanations,
            meets_threshold=meets_threshold,
            margin=margin,
            metric_details=metric_details
        )

        logger.info(
            "rubric_scorer.score_artifacts_complete",
            genre=genre,
            total_score=total,
            meets_threshold=meets_threshold,
            margin=margin,
            hook_density=hook_density,
            singability=singability,
            rhyme_tightness=rhyme_tightness,
            section_completeness=section_completeness,
            profanity_score=profanity_score
        )

        return report

    # =========================================================================
    # Threshold Validation
    # =========================================================================

    def validate_thresholds(
        self,
        score_report: ScoreReport,
        blueprint: Blueprint
    ) -> Tuple[ThresholdDecision, float, List[str]]:
        """Enforce min_total and max_profanity thresholds.

        This method evaluates whether scores meet blueprint thresholds and
        categorizes the result as PASS, FAIL, or BORDERLINE. Borderline scores
        are within 5% of the threshold, indicating potential instability across
        workflow retries.

        Args:
            score_report: Calculated scores from score_artifacts()
            blueprint: Genre blueprint with thresholds

        Returns:
            Tuple of (decision, margin, improvement_suggestions):
            - decision: ThresholdDecision (PASS/FAIL/BORDERLINE)
            - margin: Distance from threshold (positive = pass, negative = fail)
            - improvement_suggestions: List of actionable suggestions

        Example:
            >>> scorer = RubricScorer(blueprint_service)
            >>> report = scorer.score_artifacts(lyrics, style, notes, "pop", False)
            >>> decision, margin, suggestions = scorer.validate_thresholds(report, blueprint)
            >>> if decision == ThresholdDecision.FAIL:
            ...     print(f"Failed by {abs(margin):.2f}")
            ...     for suggestion in suggestions:
            ...         print(f"  - {suggestion}")
        """
        # Extract thresholds from blueprint
        thresholds = blueprint.eval_rubric.get("thresholds", {})
        min_total = thresholds.get("min_total", 0.75)
        max_profanity = thresholds.get("max_profanity", 0.1)

        # Calculate total score margin
        total_margin = score_report.total - min_total

        # Calculate profanity violation ratio (inverse of profanity_score)
        profanity_violation_ratio = 1.0 - score_report.profanity_score
        profanity_margin = max_profanity - profanity_violation_ratio

        # Determine pass/fail status
        total_passes = total_margin >= 0
        profanity_passes = profanity_margin >= 0

        # Generate improvement suggestions
        suggestions = self.suggest_improvements(score_report, blueprint)

        # Determine decision
        if total_passes and profanity_passes:
            # Check if borderline (within 5% of threshold)
            borderline_threshold = 0.05  # 5% margin

            total_borderline = 0 <= total_margin <= borderline_threshold
            profanity_borderline = (
                profanity_passes and
                profanity_margin <= borderline_threshold
            )

            if total_borderline or profanity_borderline:
                decision = ThresholdDecision.BORDERLINE

                # Enhanced logging for threshold decisions
                if self.logging_config.get("log_threshold_decisions", True):
                    logger.info(
                        "threshold_validation.borderline",
                        genre=blueprint.genre,
                        decision=decision.value,
                        total_score=score_report.total,
                        min_total=min_total,
                        total_margin=total_margin,
                        profanity_violation_ratio=profanity_violation_ratio,
                        max_profanity=max_profanity,
                        profanity_margin=profanity_margin,
                        total_borderline=total_borderline,
                        profanity_borderline=profanity_borderline,
                        weights_source="override" if blueprint.genre.lower() in self.overrides else "blueprint",
                        thresholds_source="override" if blueprint.genre.lower() in self.overrides else "blueprint",
                        borderline_threshold=borderline_threshold
                    )
            else:
                decision = ThresholdDecision.PASS

                # Enhanced logging for threshold decisions
                if self.logging_config.get("log_threshold_decisions", True):
                    logger.info(
                        "threshold_validation.pass",
                        genre=blueprint.genre,
                        decision=decision.value,
                        total_score=score_report.total,
                        min_total=min_total,
                        total_margin=total_margin,
                        profanity_violation_ratio=profanity_violation_ratio,
                        max_profanity=max_profanity,
                        weights_source="override" if blueprint.genre.lower() in self.overrides else "blueprint",
                        thresholds_source="override" if blueprint.genre.lower() in self.overrides else "blueprint"
                    )
        else:
            decision = ThresholdDecision.FAIL

            # Enhanced logging for threshold decisions
            if self.logging_config.get("log_threshold_decisions", True):
                logger.warning(
                    "threshold_validation.fail",
                    genre=blueprint.genre,
                    decision=decision.value,
                    total_score=score_report.total,
                    min_total=min_total,
                    total_margin=total_margin,
                    total_passes=total_passes,
                    profanity_violation_ratio=profanity_violation_ratio,
                    max_profanity=max_profanity,
                    profanity_passes=profanity_passes,
                    suggestion_count=len(suggestions),
                    weights_source="override" if blueprint.genre.lower() in self.overrides else "blueprint",
                    thresholds_source="override" if blueprint.genre.lower() in self.overrides else "blueprint"
                )

        # Use the most critical margin (most negative or smallest positive)
        overall_margin = min(total_margin, profanity_margin)

        return decision, overall_margin, suggestions

    def suggest_improvements(
        self,
        score_report: ScoreReport,
        blueprint: Blueprint
    ) -> List[str]:
        """Generate actionable improvement suggestions for FIX node.

        Analyzes which metrics are below optimal thresholds and provides
        specific, actionable recommendations for the FIX workflow node.

        Args:
            score_report: Calculated scores from score_artifacts()
            blueprint: Genre blueprint with thresholds and weights

        Returns:
            List of actionable improvement suggestions, ordered by priority

        Example:
            >>> suggestions = scorer.suggest_improvements(score_report, blueprint)
            >>> for suggestion in suggestions:
            ...     print(suggestion)
            "Improve hook density by 0.10 (currently 0.65, need 0.75)"
            "Reduce profanity violations by 2 lines"
        """
        suggestions = []

        # Extract thresholds
        thresholds = score_report.thresholds
        min_total = thresholds.get("min_total", 0.75)
        max_profanity = thresholds.get("max_profanity", 0.1)

        # Extract weights (for prioritization)
        weights = score_report.weights

        # Priority threshold for individual metrics (scaled by weight)
        # A metric is considered "needs improvement" if it contributes less than
        # its weighted target to the total score
        metric_target = 0.75  # Target score for individual metrics

        # Check hook_density
        if score_report.hook_density < metric_target:
            weight = weights.get("hook_density", 0.25)
            gap = metric_target - score_report.hook_density
            weighted_gap = gap * weight

            suggestions.append(
                f"Improve hook density by {gap:.2f} "
                f"(currently {score_report.hook_density:.2f}, target {metric_target:.2f}). "
                f"Add more repeated phrases or strengthen chorus hooks."
            )

        # Check singability
        if score_report.singability < metric_target:
            weight = weights.get("singability", 0.20)
            gap = metric_target - score_report.singability
            weighted_gap = gap * weight

            suggestions.append(
                f"Improve singability by {gap:.2f} "
                f"(currently {score_report.singability:.2f}, target {metric_target:.2f}). "
                f"Simplify phrasing, reduce complex words, or improve syllable consistency."
            )

        # Check rhyme_tightness
        if score_report.rhyme_tightness < metric_target:
            weight = weights.get("rhyme_tightness", 0.15)
            gap = metric_target - score_report.rhyme_tightness
            weighted_gap = gap * weight

            suggestions.append(
                f"Improve rhyme tightness by {gap:.2f} "
                f"(currently {score_report.rhyme_tightness:.2f}, target {metric_target:.2f}). "
                f"Tighten rhyme scheme or add more end rhymes."
            )

        # Check section_completeness
        if score_report.section_completeness < 1.0:
            gap = 1.0 - score_report.section_completeness
            details = score_report.metric_details.get("section_completeness", {})
            missing = details.get("missing_sections", [])

            if missing:
                suggestions.append(
                    f"Complete missing sections: {', '.join(missing)}. "
                    f"Section completeness: {score_report.section_completeness:.2f}"
                )
            else:
                suggestions.append(
                    f"Improve section completeness by {gap:.2f} "
                    f"(currently {score_report.section_completeness:.2f}). "
                    f"Ensure all sections meet minimum line counts."
                )

        # Check profanity_score
        profanity_violation_ratio = 1.0 - score_report.profanity_score
        if profanity_violation_ratio > max_profanity:
            details = score_report.metric_details.get("profanity_score", {})
            violation_count = details.get("violation_count", 0)
            total_lines = details.get("total_lines", 1)

            suggestions.append(
                f"Reduce profanity violations by {violation_count} lines "
                f"(currently {violation_count}/{total_lines} lines have violations, "
                f"max allowed: {int(max_profanity * total_lines)}). "
                f"Remove or replace flagged content."
            )

        # Check overall total score
        if score_report.total < min_total:
            gap = min_total - score_report.total
            suggestions.insert(
                0,
                f"Overall score is {gap:.2f} below threshold "
                f"(currently {score_report.total:.2f}, need {min_total:.2f}). "
                f"Focus on improvements listed below."
            )

        # If no specific suggestions but still below threshold, add general guidance
        if not suggestions and score_report.total < min_total:
            suggestions.append(
                f"Overall score {score_report.total:.2f} is below threshold {min_total:.2f}. "
                f"Review all metrics and improve the lowest-scoring areas."
            )

        # Enhanced logging for improvement suggestions
        if self.logging_config.get("log_improvement_suggestions", True):
            logger.debug(
                "improvements.suggested",
                suggestion_count=len(suggestions),
                total_score=score_report.total,
                min_total=min_total,
                hook_density=score_report.hook_density,
                singability=score_report.singability,
                rhyme_tightness=score_report.rhyme_tightness,
                section_completeness=score_report.section_completeness,
                profanity_score=score_report.profanity_score,
                genre=blueprint.genre,
                weights_applied=score_report.weights,
                suggestions=suggestions
            )

        return suggestions

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _extract_sections(self, lyrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract sections from lyrics dictionary.

        Handles different lyrics formats:
        - {"sections": [...]}
        - {"section_name": {"lines": [...], ...}, ...}

        Args:
            lyrics: Lyrics dictionary

        Returns:
            List of section dictionaries with name and lines
        """
        sections = []

        if "sections" in lyrics:
            # Format: {"sections": [...]}
            sections = lyrics["sections"]
        else:
            # Format: {"section_name": {...}, ...}
            for section_name, section_data in lyrics.items():
                if isinstance(section_data, dict):
                    sections.append({
                        "name": section_name,
                        "lines": section_data.get("lines", [])
                    })

        return sections
