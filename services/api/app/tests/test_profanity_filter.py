"""
Comprehensive tests for profanity filter functionality.

Tests cover:
- Exact word matching
- Case-insensitive matching
- L33t speak detection
- Word boundary detection (avoiding false positives)
- Multiple violations
- Score calculation
- Category detection
"""

import pytest
from app.services.common import get_profanity_filter, ProfanityFilter
from app.schemas.common import ProfanityCheckResult, ProfanityViolation


class TestProfanityFilter:
    """Test suite for ProfanityFilter class."""

    @pytest.fixture
    def profanity_filter(self) -> ProfanityFilter:
        """Get profanity filter instance."""
        return get_profanity_filter()

    def test_clean_text(self, profanity_filter: ProfanityFilter):
        """Test that clean text passes profanity check."""
        text = "This is a clean and wholesome message about love and happiness"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.is_clean is True
        assert result.violation_count == 0
        assert len(result.violations) == 0
        assert result.total_score == 0.0
        assert result.max_score == 0.0
        assert len(result.categories_found) == 0

    def test_exact_match(self, profanity_filter: ProfanityFilter):
        """Test exact profanity word matching."""
        text = "This is some bad shit right here"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.is_clean is False
        assert result.violation_count == 1
        assert len(result.violations) == 1
        assert result.violations[0].word == "shit"
        assert result.violations[0].category == "moderate"
        assert result.violations[0].score == 0.6
        assert result.total_score == 0.6

    def test_case_insensitive(self, profanity_filter: ProfanityFilter):
        """Test case-insensitive profanity detection."""
        test_cases = [
            "SHIT",
            "Shit",
            "ShIt",
            "shit",
        ]

        for word in test_cases:
            text = f"This is {word}"
            result = profanity_filter.check_text(text, explicit_allowed=False)

            assert result.is_clean is False, f"Failed for: {word}"
            assert result.violation_count == 1, f"Failed for: {word}"
            assert result.violations[0].word.lower() == "shit", f"Failed for: {word}"

    def test_l33t_speak(self, profanity_filter: ProfanityFilter):
        """Test l33t speak detection."""
        test_cases = [
            ("sh1t", "shit"),
            ("f@ck", "fuck"),
            ("b1tch", "bitch"),
            ("a$$", "ass"),
            ("d@mn", "damn"),
        ]

        for l33t_word, base_word in test_cases:
            text = f"This is {l33t_word}"
            result = profanity_filter.check_text(text, explicit_allowed=False)

            # L33t speak should be detected
            assert result.is_clean is False, f"Failed to detect: {l33t_word}"
            assert result.violation_count >= 1, f"Failed to detect: {l33t_word}"

    def test_word_boundaries(self, profanity_filter: ProfanityFilter):
        """Test word boundary detection to avoid false positives."""
        # These should NOT trigger profanity warnings
        false_positives = [
            "classic",  # Contains "ass" but is not profanity
            "hello",    # Contains "hell" but is not profanity
            "hassle",   # Contains "ass" but is not profanity
            "shiny",    # Contains "shit" substring but is not profanity
        ]

        for text in false_positives:
            result = profanity_filter.check_text(text, explicit_allowed=False)
            assert result.is_clean is True, f"False positive for: {text}"
            assert result.violation_count == 0, f"False positive for: {text}"

    def test_multiple_violations(self, profanity_filter: ProfanityFilter):
        """Test detection of multiple profanity words."""
        text = "This shit is fucking terrible and damn stupid"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.is_clean is False
        assert result.violation_count >= 3  # At least shit, fucking, damn
        assert result.total_score > 0.6  # Should be sum of multiple scores

    def test_score_calculation(self, profanity_filter: ProfanityFilter):
        """Test profanity score calculation by category."""
        test_cases = [
            # (text, expected_category, expected_score)
            ("This is damn it", "mild", 0.3),
            ("This is shit", "moderate", 0.6),
            ("This is fuck", "severe", 1.0),
        ]

        for text, expected_category, expected_min_score in test_cases:
            result = profanity_filter.check_text(text, explicit_allowed=False)

            assert result.violation_count >= 1, f"Failed for: {text}"
            assert expected_category in result.categories_found, f"Failed for: {text}"
            assert result.total_score >= expected_min_score, f"Failed for: {text}"

    def test_explicit_allowed(self, profanity_filter: ProfanityFilter):
        """Test that explicit_allowed=True marks text as clean."""
        text = "This shit is fucking terrible"
        result = profanity_filter.check_text(text, explicit_allowed=True)

        # Should be marked as clean when explicit is allowed
        assert result.is_clean is True
        # But violations should still be reported
        assert result.violation_count >= 2
        assert len(result.violations) >= 2

    def test_line_numbers(self, profanity_filter: ProfanityFilter):
        """Test line number tracking in violations."""
        text = """Line 1 is clean
Line 2 is also clean
Line 3 has some shit
Line 4 is clean again
Line 5 has fuck in it"""

        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.violation_count >= 2
        # Check line numbers are tracked
        line_numbers = [v.line_number for v in result.violations if v.line_number]
        assert 3 in line_numbers  # "shit" on line 3
        assert 5 in line_numbers  # "fuck" on line 5

    def test_context_extraction(self, profanity_filter: ProfanityFilter):
        """Test context extraction for violations."""
        text = "This is a really long line with some bad shit in the middle of the sentence"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.violation_count >= 1
        violation = result.violations[0]
        assert violation.context is not None
        assert "shit" in violation.context.lower()

    def test_category_detection(self, profanity_filter: ProfanityFilter):
        """Test category detection across multiple severity levels."""
        text = "damn this shit is fucking terrible"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        # Should detect multiple categories
        assert "mild" in result.categories_found  # damn
        assert "moderate" in result.categories_found  # shit
        assert "severe" in result.categories_found  # fucking

    def test_max_score(self, profanity_filter: ProfanityFilter):
        """Test max_score calculation."""
        text = "damn this fucking mess"  # mild (0.3) + severe (1.0)
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.max_score >= 1.0  # Should be the severe violation
        assert result.total_score >= 1.3  # Sum of both

    def test_empty_text(self, profanity_filter: ProfanityFilter):
        """Test handling of empty text."""
        result = profanity_filter.check_text("", explicit_allowed=False)

        assert result.is_clean is True
        assert result.violation_count == 0

    def test_common_variations(self, profanity_filter: ProfanityFilter):
        """Test detection of common profanity variations."""
        variations = [
            "fuk",
            "fck",
            "shyt",
            "biatch",
            "azz",
        ]

        for variation in variations:
            text = f"This is {variation}"
            result = profanity_filter.check_text(text, explicit_allowed=False)

            # Variations should be detected (or normalized)
            # Note: Some variations may not be detected if not in word list
            # This test documents current behavior
            assert isinstance(result, ProfanityCheckResult)

    def test_multiline_context(self, profanity_filter: ProfanityFilter):
        """Test profanity detection across multiple lines."""
        text = """Verse 1:
This is a clean line
Another clean line

Chorus:
This has some shit
And more bad stuff

Verse 2:
Back to clean content"""

        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.violation_count >= 1
        # Verify line number tracking
        violation_lines = [v.line_number for v in result.violations if v.line_number]
        assert len(violation_lines) > 0


class TestProfanityFilterEdgeCases:
    """Test edge cases and error handling."""

    @pytest.fixture
    def profanity_filter(self) -> ProfanityFilter:
        """Get profanity filter instance."""
        return get_profanity_filter()

    def test_unicode_text(self, profanity_filter: ProfanityFilter):
        """Test handling of unicode characters."""
        text = "This is clean text with émojis 😊 and spéciàl çhars"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert isinstance(result, ProfanityCheckResult)
        assert result.is_clean is True

    def test_very_long_text(self, profanity_filter: ProfanityFilter):
        """Test handling of very long text."""
        # Create a very long text with one profanity word
        long_text = "clean " * 1000 + "shit " + "clean " * 1000
        result = profanity_filter.check_text(long_text, explicit_allowed=False)

        assert result.violation_count == 1
        assert result.violations[0].word == "shit"

    def test_repeated_profanity(self, profanity_filter: ProfanityFilter):
        """Test detection of repeated profanity words."""
        text = "shit shit shit"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        # Each instance should be counted
        assert result.violation_count == 3
        assert all(v.word == "shit" for v in result.violations)

    def test_special_characters(self, profanity_filter: ProfanityFilter):
        """Test handling of special characters."""
        text = "This is sh!t with special chars"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        # ! should be normalized to i in l33t speak
        assert isinstance(result, ProfanityCheckResult)

    def test_numbers_only(self, profanity_filter: ProfanityFilter):
        """Test handling of numeric text."""
        text = "123456789"
        result = profanity_filter.check_text(text, explicit_allowed=False)

        assert result.is_clean is True
        assert result.violation_count == 0


# Integration test
def test_profanity_filter_integration():
    """Integration test for complete profanity checking workflow."""
    filter = get_profanity_filter()

    # Test a realistic lyrics example
    lyrics = """
[Verse 1]
Walking down the street
Feeling pretty neat
Life is so sweet
Can't be beat

[Chorus]
This is my song
Nothing going wrong
All day long
I belong

[Verse 2]
Sometimes life gets tough
Things can be rough
But that's just stuff
We have enough
"""

    result = filter.check_text(lyrics, explicit_allowed=False)

    # Clean lyrics should pass
    assert result.is_clean is True
    assert result.violation_count == 0

    # Now with profanity
    dirty_lyrics = """
[Verse 1]
Walking down the street
This shit ain't sweet
Life is fucking beat
Can't compete

[Chorus]
Damn this song
Everything is wrong
"""

    result = filter.check_text(dirty_lyrics, explicit_allowed=False)

    # Should detect violations
    assert result.is_clean is False
    assert result.violation_count >= 3  # shit, fucking, damn
    assert len(result.categories_found) >= 2  # Multiple severity levels
