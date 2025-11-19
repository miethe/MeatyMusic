"""Performance Benchmarks for Validation Services.

This module provides comprehensive performance benchmarks for all validation
components to establish baseline metrics and catch performance regressions.

Benchmark Targets (from AMCS requirements):
- Blueprint loading: <100ms
- Conflict detection: <50ms per tag list
- Policy guards: <200ms total
- Rubric scoring: <100ms
- Overall validation: <500ms for typical SDS

The benchmarks use pytest-benchmark if available, otherwise fall back to
simple timing for CI/CD integration.
"""

import pytest
import time
from typing import Dict, Any, List
from pathlib import Path

# Import validation services
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "api"))

from app.services.validation_service import ValidationService
from app.services.policy_guards import ProfanityFilter, PIIDetector, ArtistNormalizer
from app.services.conflict_detector import ConflictDetector
from app.services.blueprint_service import BlueprintService


# =============================================================================
# Benchmark Fixtures
# =============================================================================


@pytest.fixture
def validation_service():
    """Create ValidationService instance for benchmarking."""
    return ValidationService()


@pytest.fixture
def blueprint_service():
    """Create BlueprintService instance for benchmarking."""
    return BlueprintService()


@pytest.fixture
def profanity_filter():
    """Create ProfanityFilter instance for benchmarking."""
    return ProfanityFilter()


@pytest.fixture
def pii_detector():
    """Create PIIDetector instance for benchmarking."""
    return PIIDetector()


@pytest.fixture
def artist_normalizer():
    """Create ArtistNormalizer instance for benchmarking."""
    return ArtistNormalizer()


@pytest.fixture
def conflict_detector():
    """Create ConflictDetector instance for benchmarking."""
    return ConflictDetector()


@pytest.fixture
def sample_lyrics() -> Dict[str, Any]:
    """Sample lyrics for benchmarking."""
    return {
        "sections": [
            {
                "name": "verse_1",
                "text": "Walking down the street on a sunny day, feeling good in every way",
                "line": 1
            },
            {
                "name": "chorus",
                "text": "This is the chorus, singing loud and clear, everybody gather near",
                "line": 5
            },
            {
                "name": "verse_2",
                "text": "Another verse with different words, flying high like the birds",
                "line": 9
            }
        ],
        "structure": ["verse_1", "chorus", "verse_2", "chorus"]
    }


@pytest.fixture
def sample_style() -> Dict[str, Any]:
    """Sample style for benchmarking."""
    return {
        "genre": "pop",
        "tags": ["upbeat", "melodic", "major-key", "energetic"],
        "tempo": 120,
        "key": "C major"
    }


@pytest.fixture
def sample_producer_notes() -> Dict[str, Any]:
    """Sample producer notes for benchmarking."""
    return {
        "structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus",
        "arrangement": "Full band with emphasis on vocals"
    }


# =============================================================================
# Initialization Benchmarks
# =============================================================================


class TestInitializationPerformance:
    """Benchmark initialization performance of validation services."""

    def test_blueprint_service_initialization(self, benchmark):
        """Benchmark: BlueprintService initialization."""
        def initialize():
            return BlueprintService()

        try:
            service = benchmark(initialize)
            assert service is not None
        except Exception:
            # Fallback if pytest-benchmark not available
            start = time.perf_counter()
            service = initialize()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 200, f"Blueprint service init took {duration_ms:.2f}ms (expected <200ms)"
            assert service is not None

    def test_validation_service_initialization(self, benchmark):
        """Benchmark: ValidationService initialization."""
        def initialize():
            return ValidationService()

        try:
            service = benchmark(initialize)
            assert service is not None
        except Exception:
            # Fallback if pytest-benchmark not available
            start = time.perf_counter()
            service = initialize()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 1000, f"Validation service init took {duration_ms:.2f}ms (expected <1000ms)"
            assert service is not None

    def test_conflict_detector_initialization(self, benchmark):
        """Benchmark: ConflictDetector initialization."""
        def initialize():
            return ConflictDetector()

        try:
            detector = benchmark(initialize)
            assert detector is not None
        except Exception:
            # Fallback if pytest-benchmark not available
            start = time.perf_counter()
            detector = initialize()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 200, f"Conflict detector init took {duration_ms:.2f}ms (expected <200ms)"
            assert detector is not None


# =============================================================================
# Blueprint Loading Benchmarks
# =============================================================================


class TestBlueprintLoadingPerformance:
    """Benchmark blueprint loading performance (target <100ms)."""

    def test_blueprint_loading_pop(self, blueprint_service, benchmark):
        """Benchmark: Loading pop blueprint."""
        def load_blueprint():
            return blueprint_service.get_or_load_blueprint("pop")

        try:
            blueprint = benchmark(load_blueprint)
            assert blueprint is not None
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            blueprint = load_blueprint()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 100, f"Blueprint loading took {duration_ms:.2f}ms (target <100ms)"
            assert blueprint is not None

    def test_blueprint_loading_cached(self, blueprint_service, benchmark):
        """Benchmark: Loading cached blueprint."""
        # Pre-load blueprint
        blueprint_service.get_or_load_blueprint("pop")

        def load_cached_blueprint():
            return blueprint_service.get_or_load_blueprint("pop")

        try:
            blueprint = benchmark(load_cached_blueprint)
            assert blueprint is not None
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            blueprint = load_cached_blueprint()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 10, f"Cached blueprint loading took {duration_ms:.2f}ms (target <10ms)"
            assert blueprint is not None


# =============================================================================
# Conflict Detection Benchmarks
# =============================================================================


class TestConflictDetectionPerformance:
    """Benchmark conflict detection performance (target <50ms per tag list)."""

    def test_conflict_detection_small_list(self, conflict_detector, benchmark):
        """Benchmark: Conflict detection with small tag list (5 tags)."""
        tags = ["upbeat", "melodic", "major-key", "energetic", "happy"]

        def detect_conflicts():
            return conflict_detector.detect_tag_conflicts(tags)

        try:
            conflicts = benchmark(detect_conflicts)
            assert isinstance(conflicts, list)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            conflicts = detect_conflicts()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 50, f"Conflict detection took {duration_ms:.2f}ms (target <50ms)"

    def test_conflict_detection_medium_list(self, conflict_detector, benchmark):
        """Benchmark: Conflict detection with medium tag list (15 tags)."""
        tags = [
            "upbeat", "melodic", "major-key", "energetic", "happy",
            "electronic", "synth", "catchy", "anthemic", "driving",
            "layered", "polished", "commercial", "radio-friendly", "modern"
        ]

        def detect_conflicts():
            return conflict_detector.detect_tag_conflicts(tags)

        try:
            conflicts = benchmark(detect_conflicts)
            assert isinstance(conflicts, list)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            conflicts = detect_conflicts()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 50, f"Conflict detection took {duration_ms:.2f}ms (target <50ms)"

    def test_conflict_resolution(self, conflict_detector, benchmark):
        """Benchmark: Conflict resolution with conflicting tags."""
        tags = ["whisper", "anthemic", "upbeat", "melancholic"]

        def resolve_conflicts():
            return conflict_detector.resolve_conflicts(tags, strategy="keep-first")

        try:
            cleaned_tags = benchmark(resolve_conflicts)
            assert isinstance(cleaned_tags, list)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            cleaned_tags = resolve_conflicts()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 50, f"Conflict resolution took {duration_ms:.2f}ms (target <50ms)"


# =============================================================================
# Policy Guards Benchmarks
# =============================================================================


class TestPolicyGuardsPerformance:
    """Benchmark policy guard performance (target <200ms total)."""

    def test_profanity_detection(self, profanity_filter, benchmark):
        """Benchmark: Profanity detection."""
        text = "This is a sample song lyric with multiple lines and words to test the filter"

        def detect_profanity():
            return profanity_filter.detect_profanity(text, explicit_allowed=False)

        try:
            has_violations, violations = benchmark(detect_profanity)
            assert isinstance(violations, list)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            has_violations, violations = detect_profanity()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 100, f"Profanity detection took {duration_ms:.2f}ms (target <100ms)"

    def test_pii_detection(self, pii_detector, benchmark):
        """Benchmark: PII detection."""
        text = "This is sample text with no personal information in it to check performance"

        def detect_pii():
            return pii_detector.detect_pii(text)

        try:
            has_pii, violations = benchmark(detect_pii)
            assert isinstance(violations, list)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            has_pii, violations = detect_pii()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 100, f"PII detection took {duration_ms:.2f}ms (target <100ms)"

    def test_artist_detection(self, artist_normalizer, benchmark):
        """Benchmark: Artist reference detection."""
        text = "This is a pop song with melodic hooks and catchy chorus"

        def detect_artists():
            return artist_normalizer.detect_artist_references(text)

        try:
            has_references, references = benchmark(detect_artists)
            assert isinstance(references, list)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            has_references, references = detect_artists()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 100, f"Artist detection took {duration_ms:.2f}ms (target <100ms)"

    def test_all_policy_guards(
        self,
        validation_service,
        sample_lyrics,
        benchmark
    ):
        """Benchmark: All policy guards together."""
        content = {
            "style": "Pop song with upbeat melody",
            "lyrics": sample_lyrics
        }

        def validate_all_policies():
            return validation_service.validate_all_policies(
                content=content,
                explicit_allowed=False,
                public_release=True,
                policy_mode="strict"
            )

        try:
            is_valid, report = benchmark(validate_all_policies)
            assert isinstance(report, dict)
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            is_valid, report = validate_all_policies()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 200, f"All policy guards took {duration_ms:.2f}ms (target <200ms)"


# =============================================================================
# Rubric Scoring Benchmarks
# =============================================================================


class TestRubricScoringPerformance:
    """Benchmark rubric scoring performance (target <100ms)."""

    def test_rubric_scoring(
        self,
        validation_service,
        sample_lyrics,
        sample_style,
        sample_producer_notes,
        benchmark
    ):
        """Benchmark: Rubric scoring."""
        def score_artifacts():
            return validation_service.score_artifacts(
                lyrics=sample_lyrics,
                style=sample_style,
                producer_notes=sample_producer_notes,
                genre="pop",
                explicit_allowed=False
            )

        try:
            score_report = benchmark(score_artifacts)
            assert score_report is not None
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            score_report = score_artifacts()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 100, f"Rubric scoring took {duration_ms:.2f}ms (target <100ms)"


# =============================================================================
# Overall Validation Benchmarks
# =============================================================================


class TestOverallValidationPerformance:
    """Benchmark overall validation pipeline (target <500ms)."""

    def test_full_validation_pipeline(
        self,
        validation_service,
        sample_lyrics,
        sample_style,
        sample_producer_notes,
        benchmark
    ):
        """Benchmark: Full validation pipeline."""
        def run_full_validation():
            # Schema validation
            validation_service.validate_style(sample_style)
            validation_service.validate_lyrics(sample_lyrics)

            # Policy validation
            content = {
                "style": str(sample_style),
                "lyrics": sample_lyrics
            }
            validation_service.validate_all_policies(
                content=content,
                explicit_allowed=False,
                public_release=True,
                policy_mode="strict"
            )

            # Conflict detection
            validation_service.conflict_detector.detect_tag_conflicts(sample_style["tags"])

            # Rubric scoring
            score_report = validation_service.score_artifacts(
                lyrics=sample_lyrics,
                style=sample_style,
                producer_notes=sample_producer_notes,
                genre="pop",
                explicit_allowed=False
            )

            # Threshold validation
            validation_service.evaluate_compliance(
                score_report=score_report,
                genre="pop"
            )

            return True

        try:
            result = benchmark(run_full_validation)
            assert result is True
        except Exception:
            # Fallback timing
            start = time.perf_counter()
            result = run_full_validation()
            duration_ms = (time.perf_counter() - start) * 1000
            assert duration_ms < 500, f"Full validation took {duration_ms:.2f}ms (target <500ms)"
            assert result is True


# =============================================================================
# Baseline Performance Documentation
# =============================================================================


class TestBaselineMetrics:
    """Document baseline performance metrics for future reference."""

    def test_document_baseline_metrics(
        self,
        validation_service,
        sample_lyrics,
        sample_style,
        sample_producer_notes
    ):
        """Document current baseline performance metrics."""
        metrics = {}

        # Blueprint loading
        start = time.perf_counter()
        validation_service.blueprint_service.get_or_load_blueprint("pop")
        metrics["blueprint_loading_ms"] = (time.perf_counter() - start) * 1000

        # Conflict detection
        tags = sample_style["tags"]
        start = time.perf_counter()
        validation_service.conflict_detector.detect_tag_conflicts(tags)
        metrics["conflict_detection_ms"] = (time.perf_counter() - start) * 1000

        # Policy guards
        content = {"style": str(sample_style), "lyrics": sample_lyrics}
        start = time.perf_counter()
        validation_service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True
        )
        metrics["policy_guards_ms"] = (time.perf_counter() - start) * 1000

        # Rubric scoring
        start = time.perf_counter()
        validation_service.score_artifacts(
            lyrics=sample_lyrics,
            style=sample_style,
            producer_notes=sample_producer_notes,
            genre="pop",
            explicit_allowed=False
        )
        metrics["rubric_scoring_ms"] = (time.perf_counter() - start) * 1000

        # Print baseline metrics
        print("\n=== Baseline Performance Metrics ===")
        for metric, value in metrics.items():
            print(f"{metric}: {value:.2f}ms")
        print("====================================\n")

        # Verify against targets
        assert metrics["blueprint_loading_ms"] < 100, "Blueprint loading regression"
        assert metrics["conflict_detection_ms"] < 50, "Conflict detection regression"
        assert metrics["policy_guards_ms"] < 200, "Policy guards regression"
        assert metrics["rubric_scoring_ms"] < 100, "Rubric scoring regression"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--benchmark-disable"])
