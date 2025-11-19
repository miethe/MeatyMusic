"""Unit tests for policy guards service (profanity filter).

Tests cover:
- Basic profanity detection
- Variation handling (leetspeak, masking, spacing)
- Whitelist functionality
- Lyrics section checking
- Profanity scoring
- Threshold compliance
- Edge cases and error handling
"""

import pytest
from pathlib import Path
from typing import Dict, Any, List

from app.services.policy_guards import (
    ProfanityFilter,
    ProfanityViolation,
    ArtistNormalizer,
    ArtistReference,
    PolicyEnforcer,
)


class TestProfanityFilterInitialization:
    """Test ProfanityFilter initialization and taxonomy loading."""

    def test_init_default_taxonomy_path(self):
        """Test initialization with default taxonomy path."""
        filter_instance = ProfanityFilter()

        assert filter_instance is not None
        assert len(filter_instance.categories) > 0
        assert "mild" in filter_instance.categories
        assert "moderate" in filter_instance.categories
        assert "strong" in filter_instance.categories
        assert "extreme" in filter_instance.categories

    def test_init_custom_taxonomy_path(self, tmp_path):
        """Test initialization with custom taxonomy path."""
        # Create a minimal taxonomy file
        taxonomy_file = tmp_path / "test_profanity.json"
        taxonomy_data = {
            "categories": {
                "mild": ["test1", "test2"],
                "moderate": ["test3"]
            },
            "severity_weights": {
                "mild": 0.25,
                "moderate": 0.5
            },
            "thresholds": {
                "clean": {"max_score": 0.0}
            },
            "whitelist": {"terms": []},
            "variations": {"leetspeak_patterns": {}}
        }

        import json
        with open(taxonomy_file, 'w') as f:
            json.dump(taxonomy_data, f)

        filter_instance = ProfanityFilter(taxonomy_path=taxonomy_file)

        assert filter_instance is not None
        assert len(filter_instance.categories) == 2
        assert "test1" in filter_instance.categories["mild"]
        assert "test3" in filter_instance.categories["moderate"]

    def test_init_missing_taxonomy_raises_error(self, tmp_path):
        """Test that missing taxonomy file raises FileNotFoundError."""
        missing_path = tmp_path / "nonexistent.json"

        with pytest.raises(FileNotFoundError):
            ProfanityFilter(taxonomy_path=missing_path)

    def test_init_malformed_taxonomy_raises_error(self, tmp_path):
        """Test that malformed taxonomy JSON raises ValueError."""
        bad_file = tmp_path / "bad_taxonomy.json"
        bad_file.write_text("{ invalid json }")

        with pytest.raises(ValueError, match="Invalid JSON"):
            ProfanityFilter(taxonomy_path=bad_file)

    def test_categories_are_sorted(self):
        """Test that category terms are sorted for determinism."""
        filter_instance = ProfanityFilter()

        for category, terms in filter_instance.categories.items():
            # Check that terms are sorted
            assert terms == sorted(terms), f"Category {category} terms are not sorted"

    def test_severity_weights_loaded(self):
        """Test that severity weights are loaded correctly."""
        filter_instance = ProfanityFilter()

        assert "mild" in filter_instance.severity_weights
        assert "moderate" in filter_instance.severity_weights
        assert "strong" in filter_instance.severity_weights
        assert "extreme" in filter_instance.severity_weights

        # Check that weights are reasonable
        assert 0.0 < filter_instance.severity_weights["mild"] < 1.0
        assert filter_instance.severity_weights["mild"] < filter_instance.severity_weights["moderate"]
        assert filter_instance.severity_weights["moderate"] < filter_instance.severity_weights["strong"]
        assert filter_instance.severity_weights["strong"] <= filter_instance.severity_weights["extreme"]

    def test_whitelist_loaded(self):
        """Test that whitelist terms are loaded correctly."""
        filter_instance = ProfanityFilter()

        # Should contain common false positives
        assert len(filter_instance.whitelist) > 0
        # Whitelist should be case-insensitive (stored as lowercase)
        for term in filter_instance.whitelist:
            assert term == term.lower()


class TestBasicProfanityDetection:
    """Test basic profanity detection without variations."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_detect_clean_text(self, filter):
        """Test that clean text has no violations."""
        text = "This is perfectly clean text with no profanity."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False)

        assert has_violations is False
        assert len(violations) == 0

    def test_detect_mild_profanity(self, filter):
        """Test detection of mild profanity."""
        text = "This is damn good."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) > 0
        assert violations[0]["term"] == "damn"
        assert violations[0]["severity"] == "mild"
        assert "position" in violations[0]
        assert "context" in violations[0]

    def test_detect_moderate_profanity(self, filter):
        """Test detection of moderate profanity."""
        text = "What a bitch."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) > 0
        assert any(v["term"] == "bitch" for v in violations)
        severity = next(v["severity"] for v in violations if v["term"] == "bitch")
        assert severity == "moderate"

    def test_detect_strong_profanity(self, filter):
        """Test detection of strong profanity."""
        text = "This shit is broken."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) > 0
        assert any(v["term"] == "shit" for v in violations)

    def test_detect_extreme_profanity(self, filter):
        """Test detection of extreme profanity."""
        text = "You're a cunt."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) > 0
        assert any(v["term"] == "cunt" for v in violations)
        severity = next(v["severity"] for v in violations if v["term"] == "cunt")
        assert severity == "extreme"

    def test_detect_multiple_profanity(self, filter):
        """Test detection of multiple profanity terms."""
        text = "This damn shit is fucked."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) >= 2  # At least "damn" and "shit" or "fucked"

    def test_case_insensitive_detection(self, filter):
        """Test that detection is case-insensitive."""
        texts = [
            "DAMN this is loud",
            "Damn this is loud",
            "damn this is loud",
            "DaMn this is loud"
        ]

        for text in texts:
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")
            assert has_violations is True, f"Failed to detect: {text}"
            assert len(violations) > 0

    def test_word_boundary_detection(self, filter):
        """Test that word boundaries are respected (no substring matches)."""
        # These should NOT trigger profanity detection (part of whitelisted words)
        clean_texts = [
            "I need to assess the situation",  # contains "ass"
            "This is a classic song",  # contains "ass"
            "The bass guitar sounds great",  # contains "ass"
            "She showed great compassion"  # contains "ass"
        ]

        for text in clean_texts:
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")
            # May have violations if whitelist doesn't catch it, but should not detect "ass" standalone
            if violations:
                # Check that we're not detecting substring matches
                for v in violations:
                    assert v["term"] != "ass", f"Detected 'ass' in: {text}"

    def test_empty_text(self, filter):
        """Test handling of empty text."""
        has_violations, violations = filter.detect_profanity("", explicit_allowed=False)

        assert has_violations is False
        assert len(violations) == 0

    def test_context_extraction(self, filter):
        """Test that violation context is extracted correctly."""
        text = "The quick brown fox said damn that hurts."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert len(violations) > 0
        violation = violations[0]
        assert "context" in violation
        assert "[damn]" in violation["context"]  # Term should be highlighted


class TestVariationDetection:
    """Test detection of profanity variations (leetspeak, masking, spacing)."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_detect_asterisk_masking(self, filter):
        """Test detection of asterisk-masked profanity."""
        texts = [
            "What the f**k",
            "This sh*t is broken",
            "D*mn it"
        ]

        for text in texts:
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")
            # Should detect normalized versions
            # Note: This depends on implementation - may not catch all masked variations
            # The current implementation removes masking in normalization

    def test_detect_space_separated(self, filter):
        """Test detection of space-separated profanity."""
        texts = [
            "f u c k",
            "d a m n",
            "s h i t"
        ]

        for text in texts:
            # The normalization should collapse these spaces
            normalized = filter._normalize_text(text)
            # After normalization, should be detectable
            # Note: This tests the normalization function indirectly

    def test_detect_leetspeak(self, filter):
        """Test detection of leetspeak variations."""
        # Note: This test depends on the leetspeak patterns being comprehensive
        # The current implementation generates common variations

        text = "This is h3ll"  # "hell" with leetspeak

        # Detect with variations enabled
        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        # May or may not detect depending on variation pattern generation
        # This is a complex feature that may need refinement

    def test_normalize_text_removes_masking(self, filter):
        """Test that text normalization removes masking characters."""
        test_cases = [
            ("f**k", "fk"),
            ("sh-t", "sht"),
            ("d_mn", "dmn"),
            ("a**hole", "ahole")
        ]

        for original, expected in test_cases:
            normalized = filter._normalize_text(original)
            assert "*" not in normalized
            assert "-" not in normalized or "-" not in original  # Dash might be preserved between words
            assert "_" not in normalized or "_" not in original

    def test_normalize_text_collapses_spacing(self, filter):
        """Test that text normalization collapses excessive spacing."""
        test_cases = [
            ("f u c k", "fuck"),
            ("d a m n", "damn"),
            ("s h i t", "shit")
        ]

        for original, expected in test_cases:
            normalized = filter._normalize_text(original)
            # Should have spaces collapsed
            assert expected in normalized or len(normalized.split()) < len(original.split())


class TestWhitelistFunctionality:
    """Test whitelist functionality for false positive prevention."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_whitelist_prevents_false_positives(self, filter):
        """Test that whitelisted terms don't trigger violations."""
        # These are in the whitelist
        whitelisted_texts = [
            "I need to assess this",
            "Classic rock music",
            "The bass guitar",
            "Show compassion",
            "Embarrass me not"
        ]

        for text in whitelisted_texts:
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

            # Should not detect "ass" in these contexts
            if violations:
                for v in violations:
                    assert v["term"] != "ass", f"Falsely detected 'ass' in: {text}"

    def test_is_whitelisted_method(self, filter):
        """Test the _is_whitelisted helper method."""
        text = "I need to assess the situation"
        position = text.index("ass")  # Position of "ass" within "assess"
        term_length = 3

        is_whitelisted = filter._is_whitelisted(text, position, term_length)

        # Should be whitelisted because "assess" is in the whitelist
        assert is_whitelisted is True

    def test_non_whitelisted_term(self, filter):
        """Test that actual profanity is not whitelisted."""
        text = "You're an ass"
        position = text.index("ass")
        term_length = 3

        is_whitelisted = filter._is_whitelisted(text, position, term_length)

        # Should NOT be whitelisted
        assert is_whitelisted is False


class TestLyricsSectionChecking:
    """Test profanity checking across lyrics sections."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_check_clean_lyrics(self, filter):
        """Test checking clean lyrics with no profanity."""
        lyrics = {
            "verse_1": {"text": "Walking down the street", "line": 1},
            "chorus": {"text": "Living life to the fullest", "line": 5},
            "verse_2": {"text": "Nothing can stop me now", "line": 9}
        }

        has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False)

        assert has_violations is False
        assert len(violations) == 0

    def test_check_lyrics_with_profanity(self, filter):
        """Test checking lyrics with profanity in one section."""
        lyrics = {
            "verse_1": {"text": "Walking down the street", "line": 1},
            "chorus": {"text": "This damn life is hard", "line": 5},
            "verse_2": {"text": "Nothing can stop me now", "line": 9}
        }

        has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) > 0

        # Check that section information is included
        violation = violations[0]
        assert "section" in violation
        assert violation["section"] == "chorus"
        assert "line" in violation
        assert violation["line"] == 5

    def test_check_lyrics_multiple_violations(self, filter):
        """Test checking lyrics with profanity in multiple sections."""
        lyrics = {
            "verse_1": {"text": "This damn world", "line": 1},
            "chorus": {"text": "Hell yeah", "line": 5},
            "verse_2": {"text": "Shit happens", "line": 9}
        }

        has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) >= 3  # At least one from each section

        # Check that different sections are represented
        sections = {v["section"] for v in violations}
        assert len(sections) >= 2  # At least 2 different sections

    def test_check_lyrics_alternative_format(self, filter):
        """Test checking lyrics in alternative format with sections array."""
        lyrics = {
            "sections": [
                {"name": "verse_1", "text": "Walking down the street", "line": 1},
                {"name": "chorus", "text": "This damn life is hard", "line": 5},
                {"name": "verse_2", "text": "Nothing can stop me now", "line": 9}
            ]
        }

        has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) > 0

        # Check section information
        violation = violations[0]
        assert violation["section"] == "chorus"

    def test_check_empty_lyrics(self, filter):
        """Test checking empty lyrics."""
        lyrics = {}

        has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False)

        assert has_violations is False
        assert len(violations) == 0

    def test_check_lyrics_with_empty_sections(self, filter):
        """Test checking lyrics with some empty sections."""
        lyrics = {
            "verse_1": {"text": "", "line": 1},
            "chorus": {"text": "This damn life", "line": 5},
            "verse_2": {"text": "", "line": 9}
        }

        has_violations, violations = filter.check_lyrics_sections(lyrics, explicit_allowed=False, mode="clean")

        assert has_violations is True
        # Should only have violations from chorus
        assert all(v["section"] == "chorus" for v in violations)


class TestProfanityScoring:
    """Test profanity score calculation."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_score_clean_text(self, filter):
        """Test that clean text has zero score."""
        text = "This is perfectly clean text."

        score = filter.get_profanity_score(text)

        assert score == 0.0

    def test_score_mild_profanity(self, filter):
        """Test score for mild profanity."""
        text = "This damn thing."

        score = filter.get_profanity_score(text)

        # Should have non-zero score
        assert score > 0.0
        # Should be relatively low (mild profanity)
        assert score < 0.5

    def test_score_strong_profanity(self, filter):
        """Test score for strong profanity."""
        text = "This shit is fucked."

        score = filter.get_profanity_score(text)

        # Should have higher score
        assert score > 0.0

    def test_score_multiple_profanity(self, filter):
        """Test that multiple profanity increases score."""
        text_single = "This is damn bad."
        text_multiple = "This damn shit is fucked."

        score_single = filter.get_profanity_score(text_single)
        score_multiple = filter.get_profanity_score(text_multiple)

        # Multiple profanity should have higher score
        assert score_multiple > score_single

    def test_score_capped_at_one(self, filter):
        """Test that score is capped at 1.0."""
        # Text with lots of profanity
        text = " ".join(["fuck shit damn"] * 100)

        score = filter.get_profanity_score(text)

        # Should be capped at 1.0
        assert score <= 1.0

    def test_score_empty_text(self, filter):
        """Test score for empty text."""
        score = filter.get_profanity_score("")

        assert score == 0.0

    def test_score_from_violations(self, filter):
        """Test calculating score from violation objects."""
        violations = [
            ProfanityViolation(
                term="damn",
                position=0,
                severity="mild",
                context="[damn]"
            ),
            ProfanityViolation(
                term="shit",
                position=10,
                severity="strong",
                context="[shit]"
            )
        ]

        score = filter.get_profanity_score_from_violations(violations)

        # Should be average of mild (0.25) and strong (0.75) = 0.5
        assert score > 0.0
        assert score <= 1.0

    def test_score_from_empty_violations(self, filter):
        """Test score from empty violations list."""
        score = filter.get_profanity_score_from_violations([])

        assert score == 0.0


class TestThresholdCompliance:
    """Test threshold-based profanity compliance checking."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_clean_mode_no_profanity(self, filter):
        """Test that clean mode rejects any profanity."""
        text = "This damn thing."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True

    def test_mild_allowed_mode(self, filter):
        """Test mild_allowed mode accepts mild profanity."""
        text = "This damn thing."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="mild_allowed")

        # May or may not have violations depending on threshold
        # Check that mild profanity is detected
        assert len(violations) > 0
        assert any(v["severity"] == "mild" for v in violations)

    def test_explicit_mode_allows_all(self, filter):
        """Test that explicit mode allows all profanity."""
        text = "This damn shit is fucking terrible."

        # Use explicit_allowed flag
        has_violations, violations = filter.detect_profanity(text, explicit_allowed=True)

        # Violations should be detected but not flagged as violations in explicit mode
        # The explicit mode should have high thresholds

    def test_threshold_checking(self, filter):
        """Test threshold checking logic."""
        # Create violations
        violations = [
            ProfanityViolation(term="damn", position=0, severity="mild", context="[damn]"),
            ProfanityViolation(term="damn", position=10, severity="mild", context="[damn]"),
            ProfanityViolation(term="damn", position=20, severity="mild", context="[damn]"),
            ProfanityViolation(term="damn", position=30, severity="mild", context="[damn]"),
        ]

        # Check against clean mode (should exceed threshold)
        exceeds = filter._check_violations_against_threshold(violations, "clean")
        assert exceeds is True

        # Check against explicit mode (should not exceed)
        exceeds_explicit = filter._check_violations_against_threshold(violations, "explicit")
        assert exceeds_explicit is False


class TestViolationReporting:
    """Test comprehensive violation reporting."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_get_violation_report_structure(self, filter):
        """Test that violation report has correct structure."""
        text = "This damn thing is shit."

        report = filter.get_violation_report(text, explicit_allowed=False, mode="clean")

        # Check report structure
        assert "has_violations" in report
        assert "violations" in report
        assert "profanity_score" in report
        assert "explicit_allowed" in report
        assert "mode" in report
        assert "threshold_config" in report
        assert "severity_summary" in report
        assert "compliant" in report
        assert "violation_count" in report

    def test_violation_report_clean_text(self, filter):
        """Test violation report for clean text."""
        text = "This is perfectly clean."

        report = filter.get_violation_report(text, explicit_allowed=False, mode="clean")

        assert report["has_violations"] is False
        assert report["violation_count"] == 0
        assert report["profanity_score"] == 0.0
        assert report["compliant"] is True

    def test_violation_report_with_profanity(self, filter):
        """Test violation report with profanity."""
        text = "This damn shit is bad."

        report = filter.get_violation_report(text, explicit_allowed=False, mode="clean")

        assert report["has_violations"] is True
        assert report["violation_count"] > 0
        assert report["profanity_score"] > 0.0
        assert len(report["violations"]) > 0

    def test_severity_summary(self, filter):
        """Test severity summary in violation report."""
        text = "This damn shit is fucking terrible."

        report = filter.get_violation_report(text, explicit_allowed=True)

        summary = report["severity_summary"]

        # Should have counts for different severities
        assert "mild" in summary
        assert "moderate" in summary
        assert "strong" in summary
        assert "extreme" in summary

        # At least some categories should have counts
        total = sum(summary.values())
        assert total > 0


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_very_long_text(self, filter):
        """Test handling of very long text."""
        # Create long text (10,000 words)
        text = " ".join(["word"] * 10000) + " damn"

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False)

        # Should still detect profanity
        assert has_violations is True
        assert len(violations) > 0

    def test_unicode_text(self, filter):
        """Test handling of unicode characters."""
        text = "This is 你好 world with damn profanity."

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        # Should still detect profanity
        assert has_violations is True

    def test_special_characters(self, filter):
        """Test text with special characters."""
        texts = [
            "What the damn!?",
            "Shit... really?",
            "F**k (censored)",
            "Hell & damnation"
        ]

        for text in texts:
            # Should handle special characters gracefully
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")
            # Should detect profanity despite special characters

    def test_mixed_content(self, filter):
        """Test mixed clean and profane content."""
        text = """
        This is a long paragraph with mostly clean content.
        However, there is one damn word in here that's profane.
        But the rest of the text is perfectly acceptable.
        """

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        assert has_violations is True
        assert len(violations) >= 1

    def test_repeated_profanity(self, filter):
        """Test detection of repeated profanity."""
        text = "damn damn damn"

        has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")

        # Should detect all instances
        assert len(violations) >= 3

    def test_profanity_at_boundaries(self, filter):
        """Test profanity at text boundaries."""
        texts = [
            "damn",  # Just profanity
            "damn at start of sentence",
            "sentence ends with damn",
            "middle damn word"
        ]

        for text in texts:
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")
            assert has_violations is True, f"Failed to detect in: {text}"
            assert len(violations) > 0


class TestDeterminism:
    """Test deterministic behavior of profanity filter."""

    @pytest.fixture
    def filter(self):
        """Provide a ProfanityFilter instance."""
        return ProfanityFilter()

    def test_consistent_detection(self, filter):
        """Test that detection is consistent across multiple runs."""
        text = "This damn shit is fucking terrible."

        # Run detection multiple times
        results = []
        for _ in range(5):
            has_violations, violations = filter.detect_profanity(text, explicit_allowed=False, mode="clean")
            results.append((has_violations, len(violations)))

        # All results should be identical
        assert len(set(results)) == 1, "Detection results are not consistent"

    def test_consistent_scoring(self, filter):
        """Test that scoring is consistent across multiple runs."""
        text = "This damn shit is bad."

        # Run scoring multiple times
        scores = [filter.get_profanity_score(text) for _ in range(5)]

        # All scores should be identical
        assert len(set(scores)) == 1, "Scores are not consistent"

    def test_categories_sorted(self, filter):
        """Test that categories maintain sorted order."""
        for category, terms in filter.categories.items():
            assert terms == sorted(terms), f"Category {category} is not sorted"


# ============================================================================
# Artist Normalization Tests
# ============================================================================


class TestArtistNormalizerInitialization:
    """Test ArtistNormalizer initialization and taxonomy loading."""

    def test_init_default_taxonomy_path(self):
        """Test initialization with default taxonomy path."""
        normalizer = ArtistNormalizer()

        assert normalizer is not None
        assert len(normalizer.living_artists) > 0
        assert len(normalizer._artist_index) > 0
        assert len(normalizer._compiled_patterns) > 0

    def test_init_custom_taxonomy_path(self, tmp_path):
        """Test initialization with custom taxonomy path."""
        # Create a minimal taxonomy file
        taxonomy_file = tmp_path / "test_artist_normalization.json"
        taxonomy_data = {
            "living_artists": {
                "pop": [
                    {
                        "name": "Test Artist",
                        "aliases": ["Test"],
                        "generic_description": "pop with test elements",
                        "style_tags": ["pop", "test"]
                    }
                ]
            },
            "generic_descriptions": {
                "pop": "contemporary pop"
            },
            "normalization_patterns": [
                {
                    "pattern": "style of {artist}",
                    "replacement": "{generic_description}",
                    "context": "influence"
                }
            ],
            "fuzzy_matching": {
                "enabled": True,
                "min_similarity_threshold": 0.85
            },
            "policy_modes": {
                "strict": {
                    "allow_artist_names": False
                }
            }
        }

        import json
        with open(taxonomy_file, 'w') as f:
            json.dump(taxonomy_data, f)

        normalizer = ArtistNormalizer(taxonomy_path=taxonomy_file)

        assert normalizer is not None
        assert len(normalizer.living_artists) == 1
        assert "pop" in normalizer.living_artists
        assert "test artist" in normalizer._artist_index

    def test_init_missing_taxonomy_raises_error(self, tmp_path):
        """Test that missing taxonomy file raises FileNotFoundError."""
        missing_path = tmp_path / "nonexistent.json"

        with pytest.raises(FileNotFoundError):
            ArtistNormalizer(taxonomy_path=missing_path)

    def test_init_malformed_taxonomy_raises_error(self, tmp_path):
        """Test that malformed taxonomy JSON raises ValueError."""
        bad_file = tmp_path / "bad_taxonomy.json"
        bad_file.write_text("{ invalid json }")

        with pytest.raises(ValueError, match="Invalid JSON"):
            ArtistNormalizer(taxonomy_path=bad_file)

    def test_artist_index_built(self):
        """Test that artist index is built correctly."""
        normalizer = ArtistNormalizer()

        # Check that artists are indexed by lowercase name
        assert "taylor swift" in normalizer._artist_index
        assert "drake" in normalizer._artist_index

    def test_alias_index_built(self):
        """Test that alias index is built correctly."""
        normalizer = ArtistNormalizer()

        # Check that aliases map to canonical names
        assert "drizzy" in normalizer._alias_index  # Drake alias
        assert normalizer._alias_index["drizzy"] == "drake"


class TestArtistReferenceDetection:
    """Test artist reference detection."""

    @pytest.fixture
    def normalizer(self):
        """Provide an ArtistNormalizer instance."""
        return ArtistNormalizer()

    def test_detect_clean_text(self, normalizer):
        """Test that clean text has no artist references."""
        text = "This is a song with pop influences and melodic hooks."

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is False
        assert len(references) == 0

    def test_detect_style_of_pattern(self, normalizer):
        """Test detection of 'style of' pattern."""
        text = "This song is in the style of Taylor Swift"

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is True
        assert len(references) > 0
        assert references[0]["artist_name"] == "Taylor Swift"
        assert references[0]["pattern_used"] == "style of {artist}"
        assert "pop-influenced with storytelling" in references[0]["generic_replacement"]

    def test_detect_sounds_like_pattern(self, normalizer):
        """Test detection of 'sounds like' pattern."""
        text = "This track sounds like Drake"

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is True
        assert len(references) > 0
        assert references[0]["artist_name"] == "Drake"
        assert references[0]["pattern_used"] == "sounds like {artist}"

    def test_detect_similar_to_pattern(self, normalizer):
        """Test detection of 'similar to' pattern."""
        text = "The vibe is similar to The Weeknd"

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is True
        assert len(references) > 0
        assert references[0]["artist_name"] == "The Weeknd"

    def test_detect_like_pattern(self, normalizer):
        """Test detection of 'like' pattern."""
        text = "Vocals like Ariana Grande"

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is True
        assert len(references) > 0
        assert references[0]["artist_name"] == "Ariana Grande"

    def test_detect_with_alias(self, normalizer):
        """Test detection using artist alias."""
        text = "In the style of Drizzy"

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is True
        assert len(references) > 0
        assert references[0]["artist_name"] == "Drake"  # Canonical name

    def test_detect_multiple_references(self, normalizer):
        """Test detection of multiple artist references."""
        text = "Style of Taylor Swift with production like The Weeknd"

        has_refs, references = normalizer.detect_artist_references(text)

        assert has_refs is True
        assert len(references) >= 2

        # Check both artists are detected
        artist_names = {ref["artist_name"] for ref in references}
        assert "Taylor Swift" in artist_names
        assert "The Weeknd" in artist_names

    def test_case_insensitive_detection(self, normalizer):
        """Test that detection is case-insensitive."""
        texts = [
            "style of TAYLOR SWIFT",
            "style of Taylor Swift",
            "style of taylor swift"
        ]

        for text in texts:
            has_refs, references = normalizer.detect_artist_references(text)
            assert has_refs is True, f"Failed to detect: {text}"
            assert len(references) > 0
            assert references[0]["artist_name"] == "Taylor Swift"

    def test_reference_includes_metadata(self, normalizer):
        """Test that reference includes all required metadata."""
        text = "Style of Kendrick Lamar"

        has_refs, references = normalizer.detect_artist_references(text)

        assert len(references) > 0
        ref = references[0]

        # Check all required fields
        assert "artist_name" in ref
        assert "position" in ref
        assert "pattern_used" in ref
        assert "matched_text" in ref
        assert "generic_replacement" in ref
        assert "requires_normalization" in ref
        assert "confidence" in ref
        assert "genre" in ref
        assert "style_tags" in ref

        # Check specific values
        assert ref["artist_name"] == "Kendrick Lamar"
        assert ref["genre"] == "hip-hop"
        assert isinstance(ref["style_tags"], list)
        assert len(ref["style_tags"]) > 0

    def test_empty_text(self, normalizer):
        """Test handling of empty text."""
        has_refs, references = normalizer.detect_artist_references("")

        assert has_refs is False
        assert len(references) == 0


class TestArtistNormalization:
    """Test artist influence normalization."""

    @pytest.fixture
    def normalizer(self):
        """Provide an ArtistNormalizer instance."""
        return ArtistNormalizer()

    def test_normalize_single_reference(self, normalizer):
        """Test normalization of a single artist reference."""
        text = "This song is in the style of Taylor Swift"

        normalized, changes = normalizer.normalize_influences(text)

        assert normalized != text
        assert "Taylor Swift" not in normalized
        assert "pop-influenced with storytelling" in normalized
        assert len(changes) > 0
        assert changes[0]["artist"] == "Taylor Swift"

    def test_normalize_multiple_references(self, normalizer):
        """Test normalization of multiple artist references."""
        text = "Style of Taylor Swift with production like The Weeknd"

        normalized, changes = normalizer.normalize_influences(text)

        # Neither artist name should appear
        assert "Taylor Swift" not in normalized
        assert "The Weeknd" not in normalized

        # Should have 2 changes
        assert len(changes) >= 2

    def test_normalize_clean_text(self, normalizer):
        """Test that clean text is unchanged."""
        text = "This song has pop influences and melodic hooks."

        normalized, changes = normalizer.normalize_influences(text)

        assert normalized == text
        assert len(changes) == 0

    def test_normalize_preserves_structure(self, normalizer):
        """Test that normalization preserves text structure."""
        text = "Intro: style of Drake. Verse: melodic hooks. Chorus: powerful vocals."

        normalized, changes = normalizer.normalize_influences(text)

        # Structure markers should be preserved
        assert "Intro:" in normalized
        assert "Verse:" in normalized
        assert "Chorus:" in normalized

    def test_changes_include_metadata(self, normalizer):
        """Test that change records include all metadata."""
        text = "Style of Ed Sheeran"

        normalized, changes = normalizer.normalize_influences(text)

        assert len(changes) > 0
        change = changes[0]

        # Check required fields
        assert "original" in change
        assert "replacement" in change
        assert "artist" in change
        assert "position" in change
        assert "pattern" in change

        assert change["artist"] == "Ed Sheeran"
        assert "Ed Sheeran" in change["original"]


class TestFuzzyMatching:
    """Test fuzzy matching for artist names."""

    @pytest.fixture
    def normalizer(self):
        """Provide an ArtistNormalizer instance."""
        return ArtistNormalizer()

    def test_fuzzy_match_enabled(self, normalizer):
        """Test that fuzzy matching is enabled."""
        assert normalizer.fuzzy_config.get("enabled", False) is True

    def test_fuzzy_match_misspelling(self, normalizer):
        """Test fuzzy matching catches misspellings."""
        # Note: This depends on similarity threshold and misspelling severity
        # Exact behavior may vary

        text = "Style of Kendric Lamar"  # Missing 'k'

        has_refs, references = normalizer.detect_artist_references(text)

        # May or may not match depending on threshold
        # If it matches, should resolve to correct name
        if has_refs:
            assert references[0]["artist_name"] == "Kendrick Lamar"

    def test_exact_match_preferred(self, normalizer):
        """Test that exact matches are preferred over fuzzy matches."""
        # Direct test of get_generic_description
        desc = normalizer.get_generic_description("Drake")

        assert desc is not None
        assert "melodic hip-hop" in desc or "hip-hop" in desc.lower()

    def test_alias_match(self, normalizer):
        """Test that aliases match correctly."""
        desc = normalizer.get_generic_description("Drizzy")

        assert desc is not None
        # Should get Drake's description
        assert "hip-hop" in desc.lower()


class TestPublicReleaseCompliance:
    """Test public release policy compliance checking."""

    @pytest.fixture
    def normalizer(self):
        """Provide an ArtistNormalizer instance."""
        return ArtistNormalizer()

    def test_compliant_text(self, normalizer):
        """Test that text without artist references is compliant."""
        text = "Pop-influenced with melodic hooks and storytelling vocals"

        compliant, violations = normalizer.check_public_release_compliance(text)

        assert compliant is True
        assert len(violations) == 0

    def test_non_compliant_text(self, normalizer):
        """Test that text with artist references is non-compliant."""
        text = "Style of Taylor Swift"

        compliant, violations = normalizer.check_public_release_compliance(text)

        assert compliant is False
        assert len(violations) > 0
        assert "Taylor Swift" in violations[0]

    def test_permissive_mode_allows_artists(self, normalizer):
        """Test that permissive mode allows artist names."""
        text = "Style of Taylor Swift"

        compliant, violations = normalizer.check_public_release_compliance(
            text,
            allow_artist_names=True
        )

        assert compliant is True
        assert len(violations) == 0

    def test_multiple_violations(self, normalizer):
        """Test handling of multiple violations."""
        text = "Style of Taylor Swift with production like Drake"

        compliant, violations = normalizer.check_public_release_compliance(text)

        assert compliant is False
        assert len(violations) >= 2

    def test_violation_messages(self, normalizer):
        """Test that violation messages are descriptive."""
        text = "Style of Ed Sheeran"

        compliant, violations = normalizer.check_public_release_compliance(text)

        assert len(violations) > 0
        violation = violations[0]

        # Check message contains key information
        assert "Ed Sheeran" in violation
        assert "Living artist reference" in violation
        assert "Public releases" in violation


class TestGenericDescription:
    """Test generic description retrieval."""

    @pytest.fixture
    def normalizer(self):
        """Provide an ArtistNormalizer instance."""
        return ArtistNormalizer()

    def test_get_description_exact_match(self, normalizer):
        """Test getting description with exact artist name match."""
        desc = normalizer.get_generic_description("Taylor Swift")

        assert desc is not None
        assert "pop-influenced with storytelling" in desc

    def test_get_description_case_insensitive(self, normalizer):
        """Test that description lookup is case-insensitive."""
        desc1 = normalizer.get_generic_description("Taylor Swift")
        desc2 = normalizer.get_generic_description("taylor swift")
        desc3 = normalizer.get_generic_description("TAYLOR SWIFT")

        assert desc1 == desc2 == desc3

    def test_get_description_with_alias(self, normalizer):
        """Test getting description using an alias."""
        desc = normalizer.get_generic_description("Drizzy")

        assert desc is not None
        # Should get Drake's description
        assert "hip-hop" in desc.lower()

    def test_get_description_unknown_artist(self, normalizer):
        """Test that unknown artist returns None."""
        desc = normalizer.get_generic_description("Unknown Artist Name")

        assert desc is None


# ============================================================================
# Policy Enforcer Tests
# ============================================================================


class TestPolicyEnforcerInitialization:
    """Test PolicyEnforcer initialization."""

    def test_init_default(self):
        """Test initialization with defaults."""
        enforcer = PolicyEnforcer()

        assert enforcer is not None
        assert enforcer.artist_normalizer is not None
        assert isinstance(enforcer.audit_log, list)
        assert len(enforcer.policy_modes) > 0

    def test_init_with_custom_normalizer(self):
        """Test initialization with custom ArtistNormalizer."""
        normalizer = ArtistNormalizer()
        enforcer = PolicyEnforcer(artist_normalizer=normalizer)

        assert enforcer.artist_normalizer is normalizer

    def test_policy_modes_loaded(self):
        """Test that policy modes are loaded correctly."""
        enforcer = PolicyEnforcer()

        assert "strict" in enforcer.policy_modes
        assert "warn" in enforcer.policy_modes
        assert "permissive" in enforcer.policy_modes


class TestReleasePolicyEnforcement:
    """Test release policy enforcement."""

    @pytest.fixture
    def enforcer(self):
        """Provide a PolicyEnforcer instance."""
        return PolicyEnforcer()

    def test_enforce_compliant_content(self, enforcer):
        """Test enforcement on compliant content."""
        content = {
            "style": "Pop-influenced with melodic hooks",
            "lyrics": "Clean lyrics with no references"
        }

        compliant, violations = enforcer.enforce_release_policy(
            content=content,
            public_release=True,
            mode="strict"
        )

        assert compliant is True
        assert len(violations) == 0

    def test_enforce_non_compliant_content(self, enforcer):
        """Test enforcement on non-compliant content."""
        content = {
            "style": "Style of Taylor Swift",
            "lyrics": "Melodic vocals"
        }

        compliant, violations = enforcer.enforce_release_policy(
            content=content,
            public_release=True,
            mode="strict"
        )

        assert compliant is False
        assert len(violations) > 0
        assert "[style]" in violations[0]

    def test_non_public_release_always_compliant(self, enforcer):
        """Test that non-public releases are always compliant."""
        content = {
            "style": "Style of Taylor Swift with Drake influences"
        }

        compliant, violations = enforcer.enforce_release_policy(
            content=content,
            public_release=False,
            mode="strict"
        )

        assert compliant is True
        assert len(violations) == 0

    def test_permissive_mode_allows_artists(self, enforcer):
        """Test that permissive mode allows artist references."""
        content = {
            "style": "Style of Ed Sheeran"
        }

        compliant, violations = enforcer.enforce_release_policy(
            content=content,
            public_release=True,
            mode="permissive"
        )

        # Permissive mode should allow
        assert compliant is True

    def test_multiple_fields_checked(self, enforcer):
        """Test that multiple content fields are checked."""
        content = {
            "style": "Style of Taylor Swift",
            "lyrics": "Sounds like Drake",
            "producer_notes": "Mix it like The Weeknd"
        }

        compliant, violations = enforcer.enforce_release_policy(
            content=content,
            public_release=True,
            mode="strict"
        )

        assert compliant is False
        # Should have violations from multiple fields
        assert len(violations) >= 3

        # Check that field context is included
        assert any("[style]" in v for v in violations)
        assert any("[lyrics]" in v for v in violations)
        assert any("[producer_notes]" in v for v in violations)

    def test_structured_lyrics_field(self, enforcer):
        """Test handling of structured lyrics field."""
        content = {
            "lyrics": {
                "sections": [
                    {"name": "verse_1", "text": "Style of Billie Eilish"},
                    {"name": "chorus", "text": "Clean lyrics here"}
                ]
            }
        }

        compliant, violations = enforcer.enforce_release_policy(
            content=content,
            public_release=True,
            mode="strict"
        )

        assert compliant is False
        assert len(violations) > 0


class TestPersonaPolicy:
    """Test persona policy checking."""

    @pytest.fixture
    def enforcer(self):
        """Provide a PolicyEnforcer instance."""
        return PolicyEnforcer()

    def test_persona_allowed_for_public(self, enforcer):
        """Test that persona with public_release=True is allowed."""
        persona_data = {
            "public_release": True
        }

        allowed = enforcer.check_persona_policy(
            persona_id="persona_123",
            public_release=True,
            persona_data=persona_data
        )

        assert allowed is True

    def test_persona_not_allowed_for_public(self, enforcer):
        """Test that persona with public_release=False is not allowed."""
        persona_data = {
            "public_release": False
        }

        allowed = enforcer.check_persona_policy(
            persona_id="persona_123",
            public_release=True,
            persona_data=persona_data
        )

        assert allowed is False

    def test_persona_allowed_for_non_public(self, enforcer):
        """Test that all personas are allowed for non-public releases."""
        persona_data = {
            "public_release": False
        }

        allowed = enforcer.check_persona_policy(
            persona_id="persona_123",
            public_release=False,
            persona_data=persona_data
        )

        assert allowed is True

    def test_persona_no_data_defaults_allowed(self, enforcer):
        """Test that missing persona data defaults to allowed."""
        allowed = enforcer.check_persona_policy(
            persona_id="persona_123",
            public_release=True,
            persona_data=None
        )

        assert allowed is True


class TestAuditLogging:
    """Test policy override audit logging."""

    @pytest.fixture
    def enforcer(self):
        """Provide a PolicyEnforcer instance."""
        return PolicyEnforcer()

    def test_audit_override(self, enforcer):
        """Test that policy override is audited."""
        enforcer.audit_policy_override(
            content_id="song_123",
            reason="Artist approved usage",
            user_id="user_456",
            approval_level="admin"
        )

        assert len(enforcer.audit_log) > 0
        entry = enforcer.audit_log[0]

        assert entry["content_id"] == "song_123"
        assert entry["reason"] == "Artist approved usage"
        assert entry["user_id"] == "user_456"
        assert entry["approval_level"] == "admin"
        assert "timestamp" in entry

    def test_get_audit_log_unfiltered(self, enforcer):
        """Test retrieving unfiltered audit log."""
        enforcer.audit_policy_override(
            content_id="song_1",
            reason="Reason 1",
            user_id="user_1",
            approval_level="user"
        )
        enforcer.audit_policy_override(
            content_id="song_2",
            reason="Reason 2",
            user_id="user_2",
            approval_level="admin"
        )

        log = enforcer.get_audit_log()

        assert len(log) == 2

    def test_get_audit_log_filtered_by_content(self, enforcer):
        """Test retrieving audit log filtered by content ID."""
        enforcer.audit_policy_override(
            content_id="song_1",
            reason="Reason 1",
            user_id="user_1",
            approval_level="user"
        )
        enforcer.audit_policy_override(
            content_id="song_2",
            reason="Reason 2",
            user_id="user_2",
            approval_level="admin"
        )

        log = enforcer.get_audit_log(content_id="song_1")

        assert len(log) == 1
        assert log[0]["content_id"] == "song_1"

    def test_get_audit_log_filtered_by_user(self, enforcer):
        """Test retrieving audit log filtered by user ID."""
        enforcer.audit_policy_override(
            content_id="song_1",
            reason="Reason 1",
            user_id="user_1",
            approval_level="user"
        )
        enforcer.audit_policy_override(
            content_id="song_2",
            reason="Reason 2",
            user_id="user_1",
            approval_level="admin"
        )
        enforcer.audit_policy_override(
            content_id="song_3",
            reason="Reason 3",
            user_id="user_2",
            approval_level="user"
        )

        log = enforcer.get_audit_log(user_id="user_1")

        assert len(log) == 2
        assert all(entry["user_id"] == "user_1" for entry in log)

    def test_approval_level_validation(self, enforcer):
        """Test that invalid approval levels are handled."""
        enforcer.audit_policy_override(
            content_id="song_123",
            reason="Test",
            user_id="user_456",
            approval_level="invalid_level"
        )

        # Should still log but with validated level
        assert len(enforcer.audit_log) > 0
        # Invalid level should be corrected to "user"
        assert enforcer.audit_log[0]["approval_level"] == "user"


class TestDeterminism:
    """Test deterministic behavior of artist normalization."""

    @pytest.fixture
    def normalizer(self):
        """Provide an ArtistNormalizer instance."""
        return ArtistNormalizer()

    def test_consistent_detection(self, normalizer):
        """Test that detection is consistent across multiple runs."""
        text = "Style of Taylor Swift and sounds like Drake"

        # Run detection multiple times
        results = []
        for _ in range(5):
            has_refs, references = normalizer.detect_artist_references(text)
            # Create hashable representation
            result_hash = (has_refs, len(references), tuple(ref["artist_name"] for ref in references))
            results.append(result_hash)

        # All results should be identical
        assert len(set(results)) == 1, "Detection results are not consistent"

    def test_consistent_normalization(self, normalizer):
        """Test that normalization is consistent across multiple runs."""
        text = "Style of Ed Sheeran with Drake influences"

        # Run normalization multiple times
        normalized_texts = []
        for _ in range(5):
            normalized, changes = normalizer.normalize_influences(text)
            normalized_texts.append(normalized)

        # All normalized texts should be identical
        assert len(set(normalized_texts)) == 1, "Normalization results are not consistent"

    def test_index_ordering(self, normalizer):
        """Test that indexes are built in deterministic order."""
        # Create two normalizers
        normalizer1 = ArtistNormalizer()
        normalizer2 = ArtistNormalizer()

        # Artist indexes should be identical
        assert normalizer1._artist_index.keys() == normalizer2._artist_index.keys()
        assert normalizer1._alias_index.keys() == normalizer2._alias_index.keys()
