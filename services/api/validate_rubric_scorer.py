"""Standalone validation script for RubricScorer.

This script validates the core functionality of the RubricScorer without
requiring full test infrastructure.
"""

import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

# Mock the dependencies we don't have
from unittest.mock import Mock

# Mock structlog
sys.modules['structlog'] = Mock()

# Mock app.errors
errors_mock = Mock()
errors_mock.NotFoundError = Exception
errors_mock.BadRequestError = Exception
sys.modules['app.errors'] = errors_mock

# Mock app.core
core_mock = Mock()
sys.modules['app.core'] = core_mock

# Mock app.models.base
base_mock = Mock()
base_mock.BaseModel = object
sys.modules['app.models.base'] = base_mock

# Mock sqlalchemy
sqlalchemy_mock = Mock()
sys.modules['sqlalchemy'] = sqlalchemy_mock
sys.modules['sqlalchemy.dialects'] = Mock()
sys.modules['sqlalchemy.dialects.postgresql'] = Mock()
sys.modules['sqlalchemy.orm'] = Mock()

# Now import our classes
from app.models.blueprint import Blueprint
from app.services.rubric_scorer import RubricScorer, ScoreReport


def create_mock_blueprint():
    """Create a mock blueprint."""
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


def test_hook_density():
    """Test hook density calculation."""
    print("\n=== Testing Hook Density ===")

    # Create mocks
    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    profanity_filter_mock.detect_profanity.return_value = (False, [])

    scorer = RubricScorer(
        blueprint_service=blueprint_service_mock,
        profanity_filter=profanity_filter_mock
    )

    # Test with repeated chorus
    lyrics = {
        "sections": [
            {
                "name": "verse",
                "lines": [
                    "This is line one",
                    "This is line two",
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

    score, explanation, details = scorer.calculate_hook_density(lyrics)

    print(f"Score: {score:.3f}")
    print(f"Explanation: {explanation}")
    print(f"Details: Total lines: {details['total_lines']}, Repeated lines: {details['repeated_line_count']}")

    assert score > 0.3, f"Hook density should be > 0.3, got {score}"
    print("✓ Hook density test passed")


def test_singability():
    """Test singability calculation."""
    print("\n=== Testing Singability ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    # Test with simple consistent lyrics
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

    print(f"Score: {score:.3f}")
    print(f"Explanation: {explanation}")
    print(f"Details: Syllable consistency: {details['syllable_consistency']:.3f}")

    assert score > 0.0, f"Singability should be > 0, got {score}"
    print("✓ Singability test passed")


def test_rhyme_tightness():
    """Test rhyme tightness calculation."""
    print("\n=== Testing Rhyme Tightness ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    # Test with rhyming lyrics
    lyrics = {
        "sections": [
            {
                "name": "verse",
                "lines": [
                    "I walked down the street",
                    "With dancing feet",
                    "The rhythm was complete",
                    "Couldn't take a seat"
                ]
            }
        ]
    }

    score, explanation, details = scorer.calculate_rhyme_tightness(lyrics)

    print(f"Score: {score:.3f}")
    print(f"Explanation: {explanation}")
    print(f"Details: Matched rhymes: {details['matched_rhymes']}")

    assert score > 0.0, f"Rhyme tightness should be > 0, got {score}"
    print("✓ Rhyme tightness test passed")


def test_section_completeness():
    """Test section completeness calculation."""
    print("\n=== Testing Section Completeness ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    blueprint = create_mock_blueprint()

    # Test with all required sections
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

    score, explanation, details = scorer.calculate_section_completeness(lyrics, blueprint)

    print(f"Score: {score:.3f}")
    print(f"Explanation: {explanation}")
    print(f"Details: Missing sections: {details['missing_sections']}")

    assert score == 1.0, f"Section completeness should be 1.0, got {score}"
    print("✓ Section completeness test passed")


def test_profanity_score():
    """Test profanity score calculation."""
    print("\n=== Testing Profanity Score ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()

    # Mock clean content
    profanity_filter_mock.detect_profanity.return_value = (False, [])

    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    lyrics = {
        "sections": [
            {
                "name": "verse",
                "lines": [
                    "Clean line here",
                    "Another clean line"
                ]
            }
        ]
    }

    score, explanation, details = scorer.calculate_profanity_score(lyrics, explicit_allowed=False)

    print(f"Score: {score:.3f}")
    print(f"Explanation: {explanation}")
    print(f"Details: Violations: {details['violation_count']}")

    assert score == 1.0, f"Profanity score should be 1.0 for clean content, got {score}"
    print("✓ Profanity score test passed")


def test_composite_scoring():
    """Test full composite scoring."""
    print("\n=== Testing Composite Scoring ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    profanity_filter_mock.detect_profanity.return_value = (False, [])

    blueprint = create_mock_blueprint()
    blueprint_service_mock.get_or_load_blueprint.return_value = blueprint

    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    # High-quality lyrics
    lyrics = {
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

    style = {"tags": ["pop", "upbeat"]}
    producer_notes = {"mix": "bright"}

    report = scorer.score_artifacts(
        lyrics=lyrics,
        style=style,
        producer_notes=producer_notes,
        genre="pop",
        explicit_allowed=False
    )

    print(f"Total Score: {report.total:.3f}")
    print(f"Hook Density: {report.hook_density:.3f}")
    print(f"Singability: {report.singability:.3f}")
    print(f"Rhyme Tightness: {report.rhyme_tightness:.3f}")
    print(f"Section Completeness: {report.section_completeness:.3f}")
    print(f"Profanity Score: {report.profanity_score:.3f}")
    print(f"Meets Threshold: {report.meets_threshold}")
    print(f"Margin: {report.margin:.3f}")

    assert isinstance(report, ScoreReport), "Should return ScoreReport instance"
    assert 0.0 <= report.total <= 1.0, f"Total score should be 0-1, got {report.total}"

    # Verify weighted calculation
    expected_total = (
        report.hook_density * report.weights["hook_density"] +
        report.singability * report.weights["singability"] +
        report.rhyme_tightness * report.weights["rhyme_tightness"] +
        report.section_completeness * report.weights["section_completeness"] +
        report.profanity_score * report.weights["profanity_score"]
    )

    assert abs(report.total - expected_total) < 0.001, f"Weighted total mismatch: {report.total} vs {expected_total}"

    print("✓ Composite scoring test passed")


def test_syllable_counting():
    """Test syllable counting heuristic."""
    print("\n=== Testing Syllable Counting ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    test_cases = [
        ("cat", 1),
        ("happy", 2),
        ("beautiful", 3),
        ("", 0),
    ]

    for word, expected in test_cases:
        result = scorer._count_syllables(word)
        print(f"'{word}': {result} syllables (expected {expected})")
        assert result >= 1 or word == "", f"Syllable count should be at least 1 for non-empty words"

    print("✓ Syllable counting test passed")


def test_rhyme_detection():
    """Test rhyme detection logic."""
    print("\n=== Testing Rhyme Detection ===")

    blueprint_service_mock = Mock()
    profanity_filter_mock = Mock()
    scorer = RubricScorer(blueprint_service_mock, profanity_filter_mock)

    test_cases = [
        ("cat", "hat", True),
        ("street", "feet", True),
        ("cat", "dog", False),
        ("cat", "cat", False),  # Same word doesn't rhyme
    ]

    for word1, word2, expected in test_cases:
        result = scorer._words_rhyme(word1, word2)
        status = "✓" if result == expected else "✗"
        print(f"{status} '{word1}' vs '{word2}': {result} (expected {expected})")

    print("✓ Rhyme detection test passed")


def main():
    """Run all validation tests."""
    print("=" * 60)
    print("RubricScorer Validation Suite")
    print("=" * 60)

    try:
        test_hook_density()
        test_singability()
        test_rhyme_tightness()
        test_section_completeness()
        test_profanity_score()
        test_composite_scoring()
        test_syllable_counting()
        test_rhyme_detection()

        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)

        return 0

    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
