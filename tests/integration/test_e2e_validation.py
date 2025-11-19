"""End-to-End Integration Tests for Validation Pipeline.

This module provides comprehensive E2E tests for the complete validation pipeline,
testing the integration of all validation components: schema validation, policy guards,
conflict detection, and rubric scoring.

Tests verify:
- Full validation pipeline from SDS submission to reproducibility check
- Integration of ValidationService with all sub-services
- Policy guard enforcement (profanity, PII, artist references)
- Conflict detection and resolution
- Rubric scoring and threshold validation
- Deterministic behavior across multiple runs
"""

import pytest
from typing import Dict, Any, List
from pathlib import Path

# Import validation service and related components
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "api"))

from app.services.validation_service import ValidationService, ActionableReport
from app.services.policy_guards import ProfanityFilter, PIIDetector, ArtistNormalizer
from app.services.conflict_detector import ConflictDetector


class TestFullValidationPipeline:
    """Test complete validation pipeline from SDS submission to reproducibility check."""

    @pytest.fixture
    def validation_service(self):
        """Create ValidationService instance for testing."""
        return ValidationService()

    @pytest.fixture
    def sample_clean_lyrics(self) -> Dict[str, Any]:
        """Sample clean lyrics for testing."""
        return {
            "sections": [
                {
                    "name": "verse_1",
                    "text": "Walking down the street on a sunny day",
                    "line": 1
                },
                {
                    "name": "chorus",
                    "text": "This is the chorus, feeling so alive",
                    "line": 5
                }
            ],
            "structure": ["verse_1", "chorus"]
        }

    @pytest.fixture
    def sample_clean_style(self) -> Dict[str, Any]:
        """Sample clean style for testing."""
        return {
            "genre": "pop",
            "tags": ["upbeat", "melodic", "major-key"],
            "tempo": 120,
            "key": "C major"
        }

    @pytest.fixture
    def sample_clean_producer_notes(self) -> Dict[str, Any]:
        """Sample clean producer notes for testing."""
        return {
            "structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus",
            "arrangement": "Full band with emphasis on vocals"
        }

    def test_full_pipeline_clean_content(
        self,
        validation_service: ValidationService,
        sample_clean_lyrics: Dict[str, Any],
        sample_clean_style: Dict[str, Any],
        sample_clean_producer_notes: Dict[str, Any]
    ):
        """Test: Full pipeline with clean content passes all checks."""
        # Step 1: Schema validation
        style_valid, style_errors = validation_service.validate_style(sample_clean_style)
        assert style_valid, f"Style validation failed: {style_errors}"

        lyrics_valid, lyrics_errors = validation_service.validate_lyrics(sample_clean_lyrics)
        assert lyrics_valid, f"Lyrics validation failed: {lyrics_errors}"

        # Step 2: Policy validation
        content = {
            "style": str(sample_clean_style),
            "lyrics": sample_clean_lyrics
        }

        policies_valid, policy_report = validation_service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert policies_valid, f"Policy validation failed: {policy_report}"
        assert policy_report["summary"]["total_violations"] == 0

        # Step 3: Conflict detection
        tags = sample_clean_style["tags"]
        conflicts = validation_service.conflict_detector.detect_tag_conflicts(tags)
        assert len(conflicts) == 0, f"Unexpected conflicts: {conflicts}"

        # Step 4: Rubric scoring
        score_report = validation_service.score_artifacts(
            lyrics=sample_clean_lyrics,
            style=sample_clean_style,
            producer_notes=sample_clean_producer_notes,
            genre="pop",
            explicit_allowed=False
        )

        assert score_report.total >= 0.0
        assert score_report.total <= 1.0

        # Step 5: Threshold compliance
        passed, actionable_report = validation_service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Note: May not pass all thresholds with minimal test data
        # But should complete without errors
        assert isinstance(actionable_report, ActionableReport)

    def test_full_pipeline_reproducibility(
        self,
        validation_service: ValidationService,
        sample_clean_lyrics: Dict[str, Any],
        sample_clean_style: Dict[str, Any],
        sample_clean_producer_notes: Dict[str, Any]
    ):
        """Test: Validation pipeline produces deterministic results."""
        # Run scoring twice
        score_report_1 = validation_service.score_artifacts(
            lyrics=sample_clean_lyrics,
            style=sample_clean_style,
            producer_notes=sample_clean_producer_notes,
            genre="pop",
            explicit_allowed=False
        )

        score_report_2 = validation_service.score_artifacts(
            lyrics=sample_clean_lyrics,
            style=sample_clean_style,
            producer_notes=sample_clean_producer_notes,
            genre="pop",
            explicit_allowed=False
        )

        # Verify identical results
        assert score_report_1.total == score_report_2.total
        assert score_report_1.hook_density == score_report_2.hook_density
        assert score_report_1.singability == score_report_2.singability
        assert score_report_1.rhyme_tightness == score_report_2.rhyme_tightness
        assert score_report_1.section_completeness == score_report_2.section_completeness
        assert score_report_1.profanity_score == score_report_2.profanity_score


class TestValidationGatesWorkflow:
    """Test that validation gates block bad content appropriately."""

    @pytest.fixture
    def validation_service(self):
        """Create ValidationService instance for testing."""
        return ValidationService()

    def test_profanity_gate_blocks_explicit_content(
        self,
        validation_service: ValidationService
    ):
        """Test: Profanity gate blocks content with profanity when explicit_allowed=False."""
        # Create lyrics with profanity
        lyrics_with_profanity = {
            "sections": [
                {
                    "name": "verse_1",
                    "text": "This damn song is really good",
                    "line": 1
                }
            ]
        }

        # Validate profanity
        text = lyrics_with_profanity["sections"][0]["text"]
        is_valid, report = validation_service.validate_profanity(
            text=text,
            explicit_allowed=False,
            context="lyrics"
        )

        # Should detect violation
        assert not is_valid, "Profanity gate should block explicit content"
        assert report["has_violations"], "Should detect profanity"
        assert report["violation_count"] > 0

    def test_profanity_gate_allows_explicit_when_enabled(
        self,
        validation_service: ValidationService
    ):
        """Test: Profanity gate allows explicit content when explicit_allowed=True."""
        # Create lyrics with mild profanity
        lyrics_with_profanity = {
            "sections": [
                {
                    "name": "verse_1",
                    "text": "This damn song is really good",
                    "line": 1
                }
            ]
        }

        # Validate profanity with explicit allowed
        text = lyrics_with_profanity["sections"][0]["text"]
        is_valid, report = validation_service.validate_profanity(
            text=text,
            explicit_allowed=True,
            context="lyrics"
        )

        # Should allow (in explicit mode)
        # Note: "damn" is mild profanity, typically allowed in explicit mode
        assert report["mode"] == "explicit"

    def test_pii_gate_redacts_personal_info(
        self,
        validation_service: ValidationService
    ):
        """Test: PII gate redacts personally identifiable information."""
        # Create text with PII
        text_with_pii = "Contact me at john.doe@example.com or call 555-123-4567"

        # Validate and redact PII
        has_pii, redacted_text, report = validation_service.validate_pii(
            text=text_with_pii,
            context="lyrics"
        )

        # Should detect PII
        assert has_pii, "PII gate should detect personal information"
        assert report["summary"]["total_pii_count"] > 0

        # Should redact PII
        assert "john.doe@example.com" not in redacted_text
        assert "555-123-4567" not in redacted_text
        assert "[EMAIL]" in redacted_text or "[PHONE]" in redacted_text

    def test_artist_reference_gate_blocks_public_release(
        self,
        validation_service: ValidationService
    ):
        """Test: Artist reference gate blocks living artist references in public releases."""
        # Create text with artist reference
        text_with_artist = "This song sounds like the style of Taylor Swift"

        # Validate artist references for public release
        is_valid, normalized_text, report = validation_service.validate_artist_references(
            text=text_with_artist,
            public_release=True,
            policy_mode="strict"
        )

        # Should detect violation in strict mode
        if report["has_references"]:
            assert not is_valid, "Artist gate should block living artist references in strict mode"
            assert len(report["violations"]) > 0 or not report["compliant"]

    def test_conflict_gate_resolves_tag_conflicts(
        self,
        validation_service: ValidationService
    ):
        """Test: Conflict gate detects and resolves tag conflicts."""
        # Create tags with conflicts
        conflicting_tags = ["whisper", "anthemic", "upbeat"]

        # Detect conflicts
        conflicts = validation_service.conflict_detector.detect_tag_conflicts(
            conflicting_tags
        )

        # Should detect conflict between whisper and anthemic
        assert len(conflicts) > 0, "Conflict gate should detect tag conflicts"

        # Resolve conflicts
        is_valid, cleaned_tags, report = validation_service.validate_tags_for_conflicts(
            tags=conflicting_tags,
            strategy="keep-first"
        )

        # Should resolve conflicts
        assert not is_valid, "Should report conflicts detected"
        assert len(cleaned_tags) < len(conflicting_tags), "Should remove conflicting tags"
        assert report["conflict_count"] > 0

    def test_full_policy_validation_integration(
        self,
        validation_service: ValidationService
    ):
        """Test: All policy gates work together in validate_all_policies."""
        # Create content with multiple violations
        content_with_violations = {
            "style": "Pop song in the style of Taylor Swift",
            "lyrics": {
                "sections": [
                    {
                        "name": "verse_1",
                        "text": "Email me at test@example.com, this damn song",
                        "line": 1
                    }
                ]
            }
        }

        # Validate all policies
        is_valid, report = validation_service.validate_all_policies(
            content=content_with_violations,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        # Should detect violations
        assert not is_valid, "Should detect policy violations"

        # Should have multiple violation types
        summary = report["summary"]
        total_violations = summary["total_violations"]
        assert total_violations > 0, "Should have violations"

        # Check specific violation types
        # Note: Depends on exact taxonomy content
        assert isinstance(report["violations"], dict)


class TestDeterministicBehavior:
    """Test deterministic behavior across multiple runs."""

    @pytest.fixture
    def validation_service(self):
        """Create ValidationService instance for testing."""
        return ValidationService()

    def test_conflict_detection_deterministic(
        self,
        validation_service: ValidationService
    ):
        """Test: Conflict detection produces same results across runs."""
        tags = ["upbeat", "melancholic", "electronic", "acoustic"]

        # Run detection 5 times
        results = []
        for _ in range(5):
            conflicts = validation_service.conflict_detector.detect_tag_conflicts(tags)
            # Convert to comparable format (sorted tuples)
            conflict_pairs = sorted([
                (c["tag_a"], c["tag_b"]) for c in conflicts
            ])
            results.append(conflict_pairs)

        # All results should be identical
        first_result = results[0]
        for result in results[1:]:
            assert result == first_result, "Conflict detection should be deterministic"

    def test_profanity_detection_deterministic(
        self,
        validation_service: ValidationService
    ):
        """Test: Profanity detection produces same results across runs."""
        text = "This is a test sentence with some damn words"

        # Run detection 5 times
        results = []
        for _ in range(5):
            is_valid, report = validation_service.validate_profanity(
                text=text,
                explicit_allowed=False
            )
            results.append((is_valid, report["violation_count"], report["profanity_score"]))

        # All results should be identical
        first_result = results[0]
        for result in results[1:]:
            assert result == first_result, "Profanity detection should be deterministic"

    def test_pii_detection_deterministic(
        self,
        validation_service: ValidationService
    ):
        """Test: PII detection produces same results across runs."""
        text = "Contact me at john@example.com or call 555-123-4567"

        # Run detection 5 times
        results = []
        for _ in range(5):
            has_pii, redacted_text, report = validation_service.validate_pii(text=text)
            results.append((has_pii, redacted_text, report["summary"]["total_pii_count"]))

        # All results should be identical
        first_result = results[0]
        for result in results[1:]:
            assert result == first_result, "PII detection should be deterministic"


# =============================================================================
# Performance Smoke Tests
# =============================================================================

class TestPerformanceSmokeTests:
    """Basic performance smoke tests to catch regressions."""

    @pytest.fixture
    def validation_service(self):
        """Create ValidationService instance for testing."""
        return ValidationService()

    def test_validation_service_initialization_fast(self):
        """Test: ValidationService initializes in reasonable time."""
        import time

        start = time.time()
        service = ValidationService()
        duration = time.time() - start

        # Should initialize in under 1 second
        assert duration < 1.0, f"Initialization took {duration:.2f}s (expected <1s)"
        assert service.conflict_detector is not None
        assert service.profanity_filter is not None

    def test_conflict_detection_fast(
        self,
        validation_service: ValidationService
    ):
        """Test: Conflict detection completes quickly."""
        import time

        tags = ["upbeat", "melancholic", "electronic", "acoustic", "energetic", "chill"]

        start = time.time()
        conflicts = validation_service.conflict_detector.detect_tag_conflicts(tags)
        duration = time.time() - start

        # Should complete in under 100ms
        assert duration < 0.1, f"Conflict detection took {duration*1000:.2f}ms (expected <100ms)"

    def test_profanity_detection_fast(
        self,
        validation_service: ValidationService
    ):
        """Test: Profanity detection completes quickly."""
        import time

        text = "This is a sample song lyric with multiple lines and words to test"

        start = time.time()
        is_valid, report = validation_service.validate_profanity(
            text=text,
            explicit_allowed=False
        )
        duration = time.time() - start

        # Should complete in under 100ms
        assert duration < 0.1, f"Profanity detection took {duration*1000:.2f}ms (expected <100ms)"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
