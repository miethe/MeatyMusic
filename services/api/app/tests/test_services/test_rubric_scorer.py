"""Unit tests for RubricScorer service.

Tests all 5 metrics independently and the composite scoring functionality:
- hook_density: Repeated phrase detection
- singability: Syllable consistency, word complexity, line length
- rhyme_tightness: Rhyme scheme detection
- section_completeness: Required sections validation
- profanity_score: Clean content scoring
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import Dict, Any

from app.services.rubric_scorer import RubricScorer, ScoreReport
from app.services.blueprint_service import BlueprintService
from app.services.policy_guards import ProfanityFilter
from app.models.blueprint import Blueprint


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def mock_blueprint_service():
    """Create mock BlueprintService."""
    service = Mock(spec=BlueprintService)
    return service


@pytest.fixture
def mock_profanity_filter():
    """Create mock ProfanityFilter."""
    filter_mock = Mock(spec=ProfanityFilter)
    # Default: no profanity detected
    filter_mock.detect_profanity.return_value = (False, [])
    return filter_mock


@pytest.fixture
def mock_blueprint():
    """Create mock Blueprint with default rubric."""
    blueprint = Mock(spec=Blueprint)
    blueprint.genre = "pop"
    blueprint.version = "latest"
    blueprint.rules = {
        "tempo_bpm": [95, 130],
        "required_sections": ["Verse", "Chorus"],
        "length_minutes": [2.5, 3.5]
    }
    blueprint.eval_rubric = {
        "weights": {
            "hook_density": 0.25,
            "singability": 0.20,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.20,
            "profanity_score": 0.20
        },
        "thresholds": {
            "min_total": 0.75,
            "max_profanity": 0.1
        }
    }
    return blueprint


@pytest.fixture
def scorer(mock_blueprint_service, mock_profanity_filter):
    """Create RubricScorer instance with mocked dependencies."""
    return RubricScorer(
        blueprint_service=mock_blueprint_service,
        profanity_filter=mock_profanity_filter
    )


@pytest.fixture
def simple_lyrics():
    """Create simple lyrics for testing."""
    return {
        "sections": [
            {
                "name": "verse_1",
                "lines": [
                    "This is line one",
                    "This is line two",
                    "This is line three",
                    "This is line four"
                ]
            },
            {
                "name": "chorus",
                "lines": [
                    "Catchy hook line here",
                    "Catchy hook line here",
                    "Repeat for emphasis",
                    "Repeat for emphasis"
                ]
            }
        ]
    }


@pytest.fixture
def rhyming_lyrics():
    """Create lyrics with clear rhyme scheme."""
    return {
        "sections": [
            {
                "name": "verse_1",
                "lines": [
                    "I walked down the street",
                    "With dancing feet",
                    "The rhythm was complete",
                    "Couldn't take a seat"
                ]
            }
        ]
    }


# =============================================================================
# Hook Density Tests
# =============================================================================

class TestHookDensity:
    """Test hook_density metric calculation."""

    def test_no_sections(self, scorer):
        """Test with empty lyrics."""
        lyrics = {"sections": []}

        score, explanation, details = scorer.calculate_hook_density(lyrics)

        assert score == 0.0
        assert "No sections" in explanation
        assert details == {}

    def test_no_lines(self, scorer):
        """Test with sections but no lines."""
        lyrics = {
            "sections": [
                {"name": "verse", "lines": []}
            ]
        }

        score, explanation, details = scorer.calculate_hook_density(lyrics)

        assert score == 0.0
        assert "No lines" in explanation

    def test_no_repeated_phrases(self, scorer):
        """Test with unique lines (no hooks)."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [
                        "Every line is different here",
                        "Nothing repeats at all",
                        "Completely unique content now",
                        "No hooks to be found"
                    ]
                }
            ]
        }

        score, explanation, details = scorer.calculate_hook_density(lyrics)

        # Should be low but not necessarily 0 (some 3-word phrases might overlap)
        assert 0.0 <= score <= 0.3
        assert "weak hook" in explanation.lower() or "very weak" in explanation.lower()

    def test_high_repetition_chorus(self, scorer, simple_lyrics):
        """Test with repeated chorus lines."""
        score, explanation, details = scorer.calculate_hook_density(simple_lyrics)

        # Should detect repeated phrases in chorus
        assert score > 0.3
        assert details["total_lines"] == 8
        assert details["repeated_line_count"] > 0
        assert len(details["hook_phrases"]) > 0

    def test_chorus_weighting(self, scorer):
        """Test that chorus repetitions are weighted higher."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": ["Same line here", "Same line here"]
                },
                {
                    "name": "chorus",
                    "lines": ["Same line here", "Same line here"]
                }
            ]
        }

        score, explanation, details = scorer.calculate_hook_density(lyrics)

        # Chorus repetitions should be weighted 1.5x
        assert score > 0.5  # Should be high due to weighting
        assert details["repeated_line_count"] > 4  # 2 verse + 3 chorus (weighted)


# =============================================================================
# Singability Tests
# =============================================================================

class TestSingability:
    """Test singability metric calculation."""

    def test_no_sections(self, scorer):
        """Test with empty lyrics."""
        lyrics = {"sections": []}

        score, explanation, details = scorer.calculate_singability(lyrics)

        assert score == 0.0
        assert "No sections" in explanation

    def test_simple_consistent_lyrics(self, scorer):
        """Test with simple, consistent lyrics."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [
                        "Simple line here",
                        "Simple line there",
                        "Simple everywhere"
                    ]
                }
            ]
        }

        score, explanation, details = scorer.calculate_singability(lyrics)

        # Should score high due to simplicity and consistency
        assert score > 0.5
        assert "syllable_consistency" in details
        assert "word_complexity" in details
        assert "line_length_consistency" in details

    def test_complex_words_penalty(self, scorer):
        """Test that complex words reduce score."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [
                        "Antidisestablishmentarianism is hard",
                        "Supercalifragilisticexpialidocious too",
                        "Incomprehensibilities abound here"
                    ]
                }
            ]
        }

        score, explanation, details = scorer.calculate_singability(lyrics)

        # Should score low due to complex words
        assert score < 0.5
        assert details["avg_complex_words_per_line"] > 0

    def test_syllable_counting(self, scorer):
        """Test syllable counting heuristic."""
        # Test various words
        assert scorer._count_syllables("cat") == 1
        assert scorer._count_syllables("happy") == 2
        assert scorer._count_syllables("beautiful") == 3
        assert scorer._count_syllables("extraordinary") >= 4

    def test_section_type_normalization(self, scorer):
        """Test section type normalization."""
        assert scorer._normalize_section_type("verse_1") == "verse"
        assert scorer._normalize_section_type("Verse 2") == "verse"
        assert scorer._normalize_section_type("chorus") == "chorus"
        assert scorer._normalize_section_type("bridge") == "bridge"
        assert scorer._normalize_section_type("pre-chorus") == "prechorus"
        assert scorer._normalize_section_type("intro") == "intro"
        assert scorer._normalize_section_type("outro") == "outro"


# =============================================================================
# Rhyme Tightness Tests
# =============================================================================

class TestRhymeTightness:
    """Test rhyme_tightness metric calculation."""

    def test_no_sections(self, scorer):
        """Test with empty lyrics."""
        lyrics = {"sections": []}

        score, explanation, details = scorer.calculate_rhyme_tightness(lyrics)

        assert score == 0.0
        assert "No sections" in explanation

    def test_single_line(self, scorer):
        """Test with only one line (cannot rhyme)."""
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["Single line only"]}
            ]
        }

        score, explanation, details = scorer.calculate_rhyme_tightness(lyrics)

        assert score == 0.0
        assert "at least 2 lines" in explanation.lower()

    def test_strong_rhyme_scheme(self, scorer, rhyming_lyrics):
        """Test with strong AAAA rhyme scheme."""
        score, explanation, details = scorer.calculate_rhyme_tightness(rhyming_lyrics)

        # All lines rhyme (street, feet, complete, seat)
        assert score > 0.5
        assert details["matched_rhymes"] > 0

    def test_no_rhymes(self, scorer):
        """Test with no rhyming lines."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [
                        "This line ends with orange",
                        "Another ends with purple",
                        "Silver is hard too",
                        "Month completes the set"
                    ]
                }
            ]
        }

        score, explanation, details = scorer.calculate_rhyme_tightness(lyrics)

        # Should have low or zero score
        assert score < 0.3

    def test_rhyme_detection(self, scorer):
        """Test rhyme detection logic."""
        assert scorer._words_rhyme("cat", "hat") == True
        assert scorer._words_rhyme("street", "feet") == True
        assert scorer._words_rhyme("complete", "seat") == True
        assert scorer._words_rhyme("cat", "dog") == False
        assert scorer._words_rhyme("cat", "cat") == False  # Same word doesn't count


# =============================================================================
# Section Completeness Tests
# =============================================================================

class TestSectionCompleteness:
    """Test section_completeness metric calculation."""

    def test_no_sections(self, scorer, mock_blueprint):
        """Test with empty lyrics."""
        lyrics = {"sections": []}

        score, explanation, details = scorer.calculate_section_completeness(
            lyrics, mock_blueprint
        )

        assert score == 0.0
        assert "No sections" in explanation

    def test_all_required_sections_present(self, scorer, mock_blueprint):
        """Test with all required sections."""
        lyrics = {
            "sections": [
                {
                    "name": "verse_1",
                    "lines": ["Line 1", "Line 2", "Line 3"]
                },
                {
                    "name": "chorus",
                    "lines": ["Line 1", "Line 2", "Line 3"]
                }
            ]
        }

        score, explanation, details = scorer.calculate_section_completeness(
            lyrics, mock_blueprint
        )

        # Should have perfect score
        assert score == 1.0
        assert "All required sections present" in explanation
        assert len(details["missing_sections"]) == 0

    def test_missing_required_section(self, scorer, mock_blueprint):
        """Test with missing required section."""
        lyrics = {
            "sections": [
                {
                    "name": "verse_1",
                    "lines": ["Line 1", "Line 2"]
                }
            ]
        }

        score, explanation, details = scorer.calculate_section_completeness(
            lyrics, mock_blueprint
        )

        # Should be less than perfect (missing chorus)
        assert score < 1.0
        assert "chorus" in details["missing_sections"]
        assert "Missing required sections" in explanation

    def test_section_below_minimum_lines(self, scorer, mock_blueprint):
        """Test penalty for sections with too few lines."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": ["Only one line"]  # Below minimum of 2
                },
                {
                    "name": "chorus",
                    "lines": ["Line 1", "Line 2", "Line 3"]
                }
            ]
        }

        score, explanation, details = scorer.calculate_section_completeness(
            lyrics, mock_blueprint
        )

        # Should be penalized for short verse
        assert score < 1.0
        assert "verse" in details["sections_below_min"]


# =============================================================================
# Profanity Score Tests
# =============================================================================

class TestProfanityScore:
    """Test profanity_score metric calculation."""

    def test_no_sections(self, scorer):
        """Test with empty lyrics."""
        lyrics = {"sections": []}

        score, explanation, details = scorer.calculate_profanity_score(
            lyrics, explicit_allowed=False
        )

        assert score == 1.0  # No lines = perfect score
        assert "No sections" in explanation

    def test_clean_content(self, scorer, mock_profanity_filter, simple_lyrics):
        """Test with clean content (no profanity)."""
        # Mock returns no violations
        mock_profanity_filter.detect_profanity.return_value = (False, [])

        score, explanation, details = scorer.calculate_profanity_score(
            simple_lyrics, explicit_allowed=False
        )

        # Should have perfect score
        assert score == 1.0
        assert "No profanity detected" in explanation
        assert details["violation_count"] == 0

    def test_profanity_detected(self, scorer, mock_profanity_filter):
        """Test with profanity violations."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [
                        "Clean line here",
                        "Profane line here",  # Will trigger violation
                        "Clean line again",
                        "Another profane line"  # Will trigger violation
                    ]
                }
            ]
        }

        # Mock profanity detection: 2 violations out of 4 lines
        def mock_detect(text, explicit_allowed):
            has_violation = "profane" in text.lower()
            violations = [{"term": "profane", "position": 0}] if has_violation else []
            return (has_violation, violations)

        mock_profanity_filter.detect_profanity.side_effect = mock_detect

        score, explanation, details = scorer.calculate_profanity_score(
            lyrics, explicit_allowed=False
        )

        # Score should be 0.5 (2 violations / 4 lines = 0.5, so 1.0 - 0.5 = 0.5)
        assert score == 0.5
        assert details["violation_count"] == 2
        assert details["total_lines"] == 4
        assert "2 lines with profanity" in explanation

    def test_explicit_allowed_flag(self, scorer, mock_profanity_filter):
        """Test that explicit_allowed flag is passed correctly."""
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["Some content"]}
            ]
        }

        mock_profanity_filter.detect_profanity.return_value = (False, [])

        scorer.calculate_profanity_score(lyrics, explicit_allowed=True)

        # Verify flag was passed
        mock_profanity_filter.detect_profanity.assert_called()
        call_args = mock_profanity_filter.detect_profanity.call_args
        assert call_args[1]["explicit_allowed"] == True


# =============================================================================
# Composite Scoring Tests
# =============================================================================

class TestScoreArtifacts:
    """Test composite score_artifacts functionality."""

    def test_score_artifacts_integration(
        self, scorer, mock_blueprint_service, mock_blueprint, simple_lyrics
    ):
        """Test full scoring pipeline."""
        # Setup blueprint service mock
        mock_blueprint_service.get_or_load_blueprint.return_value = mock_blueprint

        # Mock style and producer notes (not used in current implementation)
        style = {"tags": ["pop", "upbeat"]}
        producer_notes = {"mix": "bright"}

        report = scorer.score_artifacts(
            lyrics=simple_lyrics,
            style=style,
            producer_notes=producer_notes,
            genre="pop",
            explicit_allowed=False
        )

        # Verify report structure
        assert isinstance(report, ScoreReport)
        assert 0.0 <= report.hook_density <= 1.0
        assert 0.0 <= report.singability <= 1.0
        assert 0.0 <= report.rhyme_tightness <= 1.0
        assert 0.0 <= report.section_completeness <= 1.0
        assert 0.0 <= report.profanity_score <= 1.0
        assert 0.0 <= report.total <= 1.0

        # Verify weights applied
        assert report.weights == mock_blueprint.eval_rubric["weights"]
        assert report.thresholds == mock_blueprint.eval_rubric["thresholds"]

        # Verify explanations
        assert "hook_density" in report.explanations
        assert "singability" in report.explanations
        assert "rhyme_tightness" in report.explanations
        assert "section_completeness" in report.explanations
        assert "profanity_score" in report.explanations

        # Verify threshold check
        assert isinstance(report.meets_threshold, bool)
        assert report.meets_threshold == (report.total >= report.thresholds["min_total"])

    def test_weighted_total_calculation(
        self, scorer, mock_blueprint_service, mock_blueprint, simple_lyrics
    ):
        """Test that weighted total is calculated correctly."""
        mock_blueprint_service.get_or_load_blueprint.return_value = mock_blueprint

        report = scorer.score_artifacts(
            lyrics=simple_lyrics,
            style={},
            producer_notes={},
            genre="pop",
            explicit_allowed=False
        )

        # Manual calculation
        weights = mock_blueprint.eval_rubric["weights"]
        expected_total = (
            report.hook_density * weights["hook_density"] +
            report.singability * weights["singability"] +
            report.rhyme_tightness * weights["rhyme_tightness"] +
            report.section_completeness * weights["section_completeness"] +
            report.profanity_score * weights["profanity_score"]
        )

        assert abs(report.total - expected_total) < 0.001

    def test_threshold_compliance(
        self, scorer, mock_blueprint_service, mock_blueprint
    ):
        """Test threshold compliance checking."""
        mock_blueprint_service.get_or_load_blueprint.return_value = mock_blueprint

        # Create lyrics that will score high
        high_scoring_lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [
                        "I walk down the street",
                        "With happy feet",
                        "Life is so sweet",
                        "Can't be beat"
                    ]
                },
                {
                    "name": "chorus",
                    "lines": [
                        "This is my hook line",
                        "This is my hook line",
                        "Repeat it twice",
                        "Repeat it twice"
                    ]
                }
            ]
        }

        report = scorer.score_artifacts(
            lyrics=high_scoring_lyrics,
            style={},
            producer_notes={},
            genre="pop",
            explicit_allowed=False
        )

        # Check margin calculation
        expected_margin = report.total - mock_blueprint.eval_rubric["thresholds"]["min_total"]
        assert abs(report.margin - expected_margin) < 0.001

    def test_score_report_to_dict(
        self, scorer, mock_blueprint_service, mock_blueprint, simple_lyrics
    ):
        """Test ScoreReport.to_dict() method."""
        mock_blueprint_service.get_or_load_blueprint.return_value = mock_blueprint

        report = scorer.score_artifacts(
            lyrics=simple_lyrics,
            style={},
            producer_notes={},
            genre="pop",
            explicit_allowed=False
        )

        report_dict = report.to_dict()

        # Verify all required fields
        assert "hook_density" in report_dict
        assert "singability" in report_dict
        assert "rhyme_tightness" in report_dict
        assert "section_completeness" in report_dict
        assert "profanity_score" in report_dict
        assert "total" in report_dict
        assert "weights" in report_dict
        assert "thresholds" in report_dict
        assert "explanations" in report_dict
        assert "meets_threshold" in report_dict
        assert "margin" in report_dict
        assert "metric_details" in report_dict


# =============================================================================
# Helper Method Tests
# =============================================================================

class TestHelperMethods:
    """Test helper methods."""

    def test_extract_sections_list_format(self, scorer):
        """Test section extraction with list format."""
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["Line 1"]},
                {"name": "chorus", "lines": ["Line 2"]}
            ]
        }

        sections = scorer._extract_sections(lyrics)

        assert len(sections) == 2
        assert sections[0]["name"] == "verse"
        assert sections[1]["name"] == "chorus"

    def test_extract_sections_dict_format(self, scorer):
        """Test section extraction with dict format."""
        lyrics = {
            "verse_1": {"lines": ["Line 1"]},
            "chorus": {"lines": ["Line 2"]}
        }

        sections = scorer._extract_sections(lyrics)

        assert len(sections) == 2
        # Order may vary, so check both sections are present
        section_names = [s["name"] for s in sections]
        assert "verse_1" in section_names
        assert "chorus" in section_names

    def test_extract_phrases(self, scorer):
        """Test phrase extraction."""
        text = "This is a simple test line here"

        phrases = scorer._extract_phrases(text, min_words=3)

        # Should extract: "this is a", "is a simple", "a simple test", etc.
        assert len(phrases) > 0
        assert "this is a" in phrases
        assert "a simple test" in phrases

    def test_extract_phrases_short_text(self, scorer):
        """Test phrase extraction with text shorter than min_words."""
        text = "Too short"

        phrases = scorer._extract_phrases(text, min_words=3)

        assert phrases == []


# =============================================================================
# Edge Case Tests
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_lyrics_dict(self, scorer, mock_blueprint):
        """Test with empty lyrics dictionary."""
        lyrics = {}

        # Test each metric
        score, _, _ = scorer.calculate_hook_density(lyrics)
        assert score == 0.0

        score, _, _ = scorer.calculate_singability(lyrics)
        assert score == 0.0

        score, _, _ = scorer.calculate_rhyme_tightness(lyrics)
        assert score == 0.0

        score, _, _ = scorer.calculate_section_completeness(lyrics, mock_blueprint)
        assert score == 0.0

    def test_whitespace_only_lines(self, scorer):
        """Test with whitespace-only lines."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": ["   ", "\t\t", "", "Actual line"]
                }
            ]
        }

        score, explanation, details = scorer.calculate_hook_density(lyrics)

        # Should only count actual line
        assert details["total_lines"] == 1

    def test_non_string_lines(self, scorer):
        """Test handling of non-string line values."""
        lyrics = {
            "sections": [
                {
                    "name": "verse",
                    "lines": [123, None, "String line", {"dict": "value"}]
                }
            ]
        }

        # Should handle gracefully (convert to strings)
        score, explanation, details = scorer.calculate_hook_density(lyrics)

        # Should process without errors
        assert score >= 0.0

    def test_blueprint_missing_rubric_fields(
        self, scorer, mock_blueprint_service, simple_lyrics
    ):
        """Test with blueprint missing some rubric fields."""
        # Create blueprint with minimal rubric
        minimal_blueprint = Mock(spec=Blueprint)
        minimal_blueprint.genre = "pop"
        minimal_blueprint.rules = {"required_sections": ["Verse"]}
        minimal_blueprint.eval_rubric = {
            "weights": {"hook_density": 1.0},  # Only one weight
            "thresholds": {}  # No thresholds
        }

        mock_blueprint_service.get_or_load_blueprint.return_value = minimal_blueprint

        # Should use defaults for missing weights
        report = scorer.score_artifacts(
            lyrics=simple_lyrics,
            style={},
            producer_notes={},
            genre="pop",
            explicit_allowed=False
        )

        # Should complete without errors
        assert isinstance(report, ScoreReport)
        assert report.total >= 0.0


# =============================================================================
# Configuration and Override Tests
# =============================================================================

class TestConfigurationLoading:
    """Test configuration loading and override functionality."""

    def test_load_config_file_not_found(self, mock_blueprint_service, mock_profanity_filter):
        """Test graceful handling when config file doesn't exist."""
        # Create scorer with non-existent config path
        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path="/nonexistent/path/config.json"
        )

        # Should initialize without errors
        assert scorer.config == {}
        assert scorer.overrides == {}
        assert scorer.ab_tests == {}

    def test_load_config_file_success(self, mock_blueprint_service, mock_profanity_filter, tmp_path):
        """Test successful config file loading."""
        # Create temporary config file
        config_data = {
            "overrides": {
                "pop": {
                    "weights": {
                        "hook_density": 0.30,
                        "singability": 0.20,
                        "rhyme_tightness": 0.15,
                        "section_completeness": 0.15,
                        "profanity_score": 0.20
                    },
                    "thresholds": {
                        "min_total": 0.80,
                        "max_profanity": 0.05
                    }
                }
            },
            "ab_tests": {},
            "logging": {
                "log_threshold_decisions": True
            },
            "validation": {
                "require_weights_sum_to_one": True,
                "weight_sum_tolerance": 0.01
            }
        }

        config_file = tmp_path / "test_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        # Create scorer with config file
        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        # Verify config loaded
        assert "pop" in scorer.overrides
        assert scorer.overrides["pop"]["weights"]["hook_density"] == 0.30
        assert scorer.overrides["pop"]["thresholds"]["min_total"] == 0.80

    def test_config_validation_weights_sum(self, mock_blueprint_service, mock_profanity_filter, tmp_path):
        """Test config validation rejects invalid weight sum."""
        # Create config with weights that don't sum to 1.0
        config_data = {
            "overrides": {
                "pop": {
                    "weights": {
                        "hook_density": 0.50,  # These sum to 1.20, not 1.0
                        "singability": 0.30,
                        "rhyme_tightness": 0.15,
                        "section_completeness": 0.15,
                        "profanity_score": 0.10
                    },
                    "thresholds": {
                        "min_total": 0.75,
                        "max_profanity": 0.1
                    }
                }
            },
            "validation": {
                "require_weights_sum_to_one": True,
                "weight_sum_tolerance": 0.01
            }
        }

        config_file = tmp_path / "invalid_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        # Create scorer - should reject invalid config
        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        # Config should be cleared due to validation failure
        assert scorer.overrides == {}

    def test_config_validation_missing_metrics(self, mock_blueprint_service, mock_profanity_filter, tmp_path):
        """Test config validation rejects missing required metrics."""
        # Create config missing some metrics
        config_data = {
            "overrides": {
                "pop": {
                    "weights": {
                        "hook_density": 0.50,  # Missing other required metrics
                        "singability": 0.50
                    },
                    "thresholds": {
                        "min_total": 0.75,
                        "max_profanity": 0.1
                    }
                }
            },
            "validation": {
                "require_all_metrics": True,
                "required_metrics": [
                    "hook_density", "singability", "rhyme_tightness",
                    "section_completeness", "profanity_score"
                ]
            }
        }

        config_file = tmp_path / "missing_metrics_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        # Create scorer - should reject invalid config
        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        # Config should be cleared due to validation failure
        assert scorer.overrides == {}


class TestWeightsAndThresholdsOverride:
    """Test weight and threshold override functionality."""

    def test_get_weights_blueprint_default(self, mock_blueprint_service, mock_profanity_filter, mock_blueprint):
        """Test getting weights from blueprint when no override exists."""
        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter
        )

        weights = scorer._get_weights("unknown_genre", mock_blueprint)

        # Should return blueprint defaults
        assert weights == mock_blueprint.eval_rubric["weights"]

    def test_get_weights_override_precedence(self, mock_blueprint_service, mock_profanity_filter, mock_blueprint, tmp_path):
        """Test that override weights take precedence over blueprint."""
        # Create config with override
        config_data = {
            "overrides": {
                "pop": {
                    "weights": {
                        "hook_density": 0.35,  # Override value
                        "singability": 0.20,
                        "rhyme_tightness": 0.15,
                        "section_completeness": 0.15,
                        "profanity_score": 0.15
                    }
                }
            }
        }

        config_file = tmp_path / "override_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        weights = scorer._get_weights("pop", mock_blueprint)

        # Should return override value
        assert weights["hook_density"] == 0.35
        assert weights["singability"] == 0.20

    def test_get_thresholds_override_precedence(self, mock_blueprint_service, mock_profanity_filter, mock_blueprint, tmp_path):
        """Test that override thresholds take precedence over blueprint."""
        # Create config with override
        config_data = {
            "overrides": {
                "pop": {
                    "weights": {
                        "hook_density": 0.25,
                        "singability": 0.20,
                        "rhyme_tightness": 0.15,
                        "section_completeness": 0.20,
                        "profanity_score": 0.20
                    },
                    "thresholds": {
                        "min_total": 0.85,  # Override value
                        "max_profanity": 0.05
                    }
                }
            }
        }

        config_file = tmp_path / "threshold_override_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        thresholds = scorer._get_thresholds("pop", mock_blueprint)

        # Should return override value
        assert thresholds["min_total"] == 0.85
        assert thresholds["max_profanity"] == 0.05


class TestABTestSupport:
    """Test A/B testing functionality."""

    def test_ab_test_disabled(self, mock_blueprint_service, mock_profanity_filter, tmp_path):
        """Test that disabled A/B tests are not applied."""
        config_data = {
            "overrides": {},
            "ab_tests": {
                "test_1": {
                    "name": "Test Experiment",
                    "enabled": False,  # Disabled
                    "genres": ["pop"],
                    "overrides": {
                        "weights": {
                            "hook_density": 0.50
                        }
                    }
                }
            }
        }

        config_file = tmp_path / "ab_test_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        weights = {"hook_density": 0.25}
        thresholds = {}

        weights_result, ab_applied = scorer._apply_ab_tests("pop", weights, thresholds)

        # A/B test should not be applied
        assert not ab_applied
        assert weights_result["hook_density"] == 0.25  # Original value

    def test_ab_test_enabled_matching_genre(self, mock_blueprint_service, mock_profanity_filter, tmp_path):
        """Test that enabled A/B test is applied for matching genre."""
        config_data = {
            "overrides": {},
            "ab_tests": {
                "test_1": {
                    "name": "Test Experiment",
                    "enabled": True,  # Enabled
                    "genres": ["pop", "rock"],
                    "overrides": {
                        "weights": {
                            "hook_density": 0.40
                        },
                        "thresholds": {
                            "min_total": 0.85
                        }
                    }
                }
            }
        }

        config_file = tmp_path / "ab_test_enabled_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        weights = {"hook_density": 0.25}
        thresholds = {"min_total": 0.75}

        weights_result, ab_applied = scorer._apply_ab_tests("pop", weights, thresholds)

        # A/B test should be applied
        assert ab_applied
        assert weights_result["hook_density"] == 0.40  # Override value
        assert thresholds["min_total"] == 0.85  # Override value

    def test_ab_test_non_matching_genre(self, mock_blueprint_service, mock_profanity_filter, tmp_path):
        """Test that A/B test is not applied for non-matching genre."""
        config_data = {
            "overrides": {},
            "ab_tests": {
                "test_1": {
                    "name": "Test Experiment",
                    "enabled": True,
                    "genres": ["rock"],  # Only rock
                    "overrides": {
                        "weights": {
                            "hook_density": 0.40
                        }
                    }
                }
            }
        }

        config_file = tmp_path / "ab_test_no_match_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        weights = {"hook_density": 0.25}
        thresholds = {}

        weights_result, ab_applied = scorer._apply_ab_tests("pop", weights, thresholds)

        # A/B test should not be applied
        assert not ab_applied
        assert weights_result["hook_density"] == 0.25  # Original value

    def test_ab_test_precedence_over_override(self, mock_blueprint_service, mock_profanity_filter, mock_blueprint, tmp_path):
        """Test that A/B test takes precedence over genre override."""
        config_data = {
            "overrides": {
                "pop": {
                    "weights": {
                        "hook_density": 0.30,  # Override value
                        "singability": 0.20,
                        "rhyme_tightness": 0.15,
                        "section_completeness": 0.15,
                        "profanity_score": 0.20
                    }
                }
            },
            "ab_tests": {
                "test_1": {
                    "name": "Test Experiment",
                    "enabled": True,
                    "genres": ["pop"],
                    "overrides": {
                        "weights": {
                            "hook_density": 0.45  # A/B test value (should win)
                        }
                    }
                }
            }
        }

        config_file = tmp_path / "ab_precedence_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        weights = scorer._get_weights("pop", mock_blueprint)

        # A/B test value should take precedence
        assert weights["hook_density"] == 0.45


class TestThresholdDecisionLogging:
    """Test enhanced threshold decision logging."""

    def test_threshold_logging_enabled(self, mock_blueprint_service, mock_profanity_filter, mock_blueprint, tmp_path):
        """Test that threshold decisions are logged when enabled."""
        config_data = {
            "logging": {
                "log_threshold_decisions": True,
                "log_improvement_suggestions": True
            }
        }

        config_file = tmp_path / "logging_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        # Create mock score report
        score_report = ScoreReport(
            hook_density=0.8,
            singability=0.7,
            rhyme_tightness=0.6,
            section_completeness=1.0,
            profanity_score=0.95,
            total=0.78,
            weights=mock_blueprint.eval_rubric["weights"],
            thresholds=mock_blueprint.eval_rubric["thresholds"],
            explanations={},
            meets_threshold=True,
            margin=0.03,
            metric_details={}
        )

        # Should not raise errors with logging enabled
        decision, margin, suggestions = scorer.validate_thresholds(score_report, mock_blueprint)

        assert decision in [ThresholdDecision.PASS, ThresholdDecision.BORDERLINE, ThresholdDecision.FAIL]

    def test_threshold_logging_disabled(self, mock_blueprint_service, mock_profanity_filter, mock_blueprint, tmp_path):
        """Test that logging can be disabled."""
        config_data = {
            "logging": {
                "log_threshold_decisions": False,
                "log_improvement_suggestions": False
            }
        }

        config_file = tmp_path / "no_logging_config.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        scorer = RubricScorer(
            blueprint_service=mock_blueprint_service,
            profanity_filter=mock_profanity_filter,
            config_path=str(config_file)
        )

        # Create mock score report
        score_report = ScoreReport(
            hook_density=0.8,
            singability=0.7,
            rhyme_tightness=0.6,
            section_completeness=1.0,
            profanity_score=0.95,
            total=0.78,
            weights=mock_blueprint.eval_rubric["weights"],
            thresholds=mock_blueprint.eval_rubric["thresholds"],
            explanations={},
            meets_threshold=True,
            margin=0.03,
            metric_details={}
        )

        # Should not raise errors with logging disabled
        decision, margin, suggestions = scorer.validate_thresholds(score_report, mock_blueprint)

        assert decision in [ThresholdDecision.PASS, ThresholdDecision.BORDERLINE, ThresholdDecision.FAIL]
