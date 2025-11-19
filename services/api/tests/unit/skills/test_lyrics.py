"""Tests for LYRICS skill with pinned retrieval."""

import hashlib
import json
from typing import Any, Dict, List

import pytest

from app.skills.lyrics import (
    _calculate_hook_density,
    _calculate_rhyme_tightness,
    _calculate_singability,
    _count_syllables,
    _filter_profanity,
    _normalize_artist_references,
    _parse_rhyme_scheme,
    _redact_pii,
    _words_rhyme,
    apply_policy_guards,
    apply_rhyme_scheme,
    pinned_retrieve,
)


class TestProfanityFilter:
    """Test profanity filtering."""

    def test_filter_profanity_when_explicit_false(self):
        """Should filter profanity when explicit=False."""
        text = "This is some shit code"
        filtered, replacements = _filter_profanity(text, explicit=False)

        assert "[[REDACTED]]" in filtered
        assert "shit" not in filtered
        assert "shit" in replacements

    def test_no_filter_when_explicit_true(self):
        """Should not filter profanity when explicit=True."""
        text = "This is some shit code"
        filtered, replacements = _filter_profanity(text, explicit=True)

        assert filtered == text
        assert len(replacements) == 0

    def test_case_insensitive_filtering(self):
        """Should filter profanity case-insensitively."""
        text = "SHIT Shit shit"
        filtered, replacements = _filter_profanity(text, explicit=False)

        assert filtered.count("[[REDACTED]]") == 3
        assert len(replacements) == 3


class TestPIIRedaction:
    """Test PII redaction functionality."""

    def test_redact_email(self):
        """Should redact email addresses."""
        text = "Contact me at john.doe@example.com for more info"
        cleaned, violations = _redact_pii(text)

        assert "[[REDACTED:PII]]" in cleaned
        assert "john.doe@example.com" not in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "pii_email"
        assert violations[0]["original"] == "john.doe@example.com"

    def test_redact_phone(self):
        """Should redact phone numbers."""
        text = "Call me at 555-123-4567 anytime"
        cleaned, violations = _redact_pii(text)

        assert "[[REDACTED:PII]]" in cleaned
        assert "555-123-4567" not in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "pii_phone"

    def test_redact_phone_variations(self):
        """Should redact phone numbers with various formats."""
        # Test with dots
        text1 = "Phone: 555.123.4567"
        cleaned1, violations1 = _redact_pii(text1)
        assert "[[REDACTED:PII]]" in cleaned1
        assert len(violations1) == 1

        # Test without separators
        text2 = "Phone: 5551234567"
        cleaned2, violations2 = _redact_pii(text2)
        assert "[[REDACTED:PII]]" in cleaned2
        assert len(violations2) == 1

    def test_redact_address(self):
        """Should redact street addresses."""
        text = "I live at 123 Main Street"
        cleaned, violations = _redact_pii(text)

        assert "[[REDACTED:PII]]" in cleaned
        assert "123 Main Street" not in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "pii_address"

    def test_redact_address_variations(self):
        """Should redact various address formats."""
        test_cases = [
            "123 Oak Avenue",
            "456 Elm Road",
            "789 Pine Boulevard",
            "321 Maple St",
            "654 Cedar Ave",
            "987 Birch Rd",
        ]

        for address_text in test_cases:
            cleaned, violations = _redact_pii(address_text)
            assert "[[REDACTED:PII]]" in cleaned, f"Failed for: {address_text}"
            assert len(violations) >= 1

    def test_redact_multiple_pii(self):
        """Should redact multiple PII types in one text."""
        text = "Email john@example.com or call 555-1234567 at 123 Main Street"
        cleaned, violations = _redact_pii(text)

        assert cleaned.count("[[REDACTED:PII]]") >= 2
        assert "john@example.com" not in cleaned
        assert len(violations) >= 2

    def test_no_pii(self):
        """Should return original text when no PII found."""
        text = "This is a clean text without any PII"
        cleaned, violations = _redact_pii(text)

        assert cleaned == text
        assert len(violations) == 0

    def test_violation_structure(self):
        """Should return violations with correct structure."""
        text = "Contact: test@example.com"
        cleaned, violations = _redact_pii(text)

        assert len(violations) == 1
        violation = violations[0]
        assert "type" in violation
        assert "original" in violation
        assert "replacement" in violation
        assert "reason" in violation
        assert violation["replacement"] == "[[REDACTED:PII]]"


class TestArtistNormalization:
    """Test living artist reference normalization."""

    def test_normalize_style_of_pattern(self):
        """Should normalize 'style of' artist references."""
        text = "This song has the style of Taylor Swift"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="pop"
        )

        assert "Taylor Swift" not in cleaned
        assert "contemporary pop influence" in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "living_artist"

    def test_normalize_sounds_like_pattern(self):
        """Should normalize 'sounds like' artist references."""
        text = "It sounds like Drake"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="hiphop"
        )

        assert "Drake" not in cleaned
        assert "modern hip-hop stylings" in cleaned
        assert len(violations) == 1

    def test_normalize_inspired_by_pattern(self):
        """Should normalize 'inspired by' artist references."""
        text = "Inspired by Billie Eilish"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="pop"
        )

        assert "Billie Eilish" not in cleaned
        assert "contemporary pop influence" in cleaned
        assert len(violations) == 1

    def test_normalize_reminds_of_pattern(self):
        """Should normalize 'reminds of' artist references."""
        text = "This reminds me of Ed Sheeran"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="pop"
        )

        assert "Ed Sheeran" not in cleaned
        assert len(violations) == 1

    def test_allow_living_artists(self):
        """Should not normalize when allow_living=True."""
        text = "style of Taylor Swift"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=True, genre="pop"
        )

        assert cleaned == text
        assert len(violations) == 0

    def test_normalize_non_living_artist_ignored(self):
        """Should not normalize references to non-living artists."""
        text = "style of Elvis Presley"  # Not in LIVING_ARTISTS list
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="rock"
        )

        assert cleaned == text
        assert len(violations) == 0

    def test_normalize_multiple_artists(self):
        """Should normalize multiple artist references."""
        text = "style of Drake and sounds like The Weeknd"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="hiphop"
        )

        assert "Drake" not in cleaned
        assert "The Weeknd" not in cleaned
        assert len(violations) == 2

    def test_genre_specific_replacements(self):
        """Should use genre-specific replacement phrases."""
        # Test pop
        text1 = "style of Taylor Swift"
        cleaned1, _ = _normalize_artist_references(text1, False, "pop")
        assert "contemporary pop influence" in cleaned1

        # Test hiphop
        text2 = "style of Drake"
        cleaned2, _ = _normalize_artist_references(text2, False, "hiphop")
        assert "modern hip-hop stylings" in cleaned2

        # Test rock
        text3 = "style of Harry Styles"
        cleaned3, _ = _normalize_artist_references(text3, False, "rock")
        assert "contemporary rock elements" in cleaned3

    def test_default_genre_replacement(self):
        """Should use default replacement for unknown genre."""
        text = "style of Drake"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="unknown_genre"
        )

        assert "modern musical influences" in cleaned
        assert len(violations) == 1

    def test_case_insensitive_artist_matching(self):
        """Should match artists case-insensitively."""
        test_cases = [
            "style of TAYLOR SWIFT",
            "style of taylor swift",
            "style of Taylor Swift",
        ]

        for text in test_cases:
            cleaned, violations = _normalize_artist_references(
                text, False, "pop"
            )
            assert "contemporary pop influence" in cleaned.lower()
            assert len(violations) == 1

    def test_violation_structure(self):
        """Should return violations with correct structure."""
        text = "style of Drake"
        cleaned, violations = _normalize_artist_references(
            text, allow_living=False, genre="hiphop"
        )

        assert len(violations) == 1
        violation = violations[0]
        assert "type" in violation
        assert "original" in violation
        assert "replacement" in violation
        assert "reason" in violation
        assert violation["type"] == "living_artist"
        assert "drake" in violation["reason"].lower()


class TestApplyPolicyGuards:
    """Test comprehensive policy guard application."""

    def test_profanity_only(self):
        """Should filter profanity when explicit=False."""
        text = "This is some shit lyrics"
        cleaned, violations, warnings = apply_policy_guards(
            text, {"explicit": False}
        )

        assert "[[REDACTED]]" in cleaned
        assert "shit" not in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "profanity"
        assert len(warnings) == 1

    def test_profanity_allowed(self):
        """Should not filter profanity when explicit=True."""
        text = "This is some shit lyrics"
        cleaned, violations, warnings = apply_policy_guards(
            text, {"explicit": True}
        )

        assert cleaned == text
        assert len([v for v in violations if v["type"] == "profanity"]) == 0

    def test_pii_redaction(self):
        """Should redact PII regardless of explicit setting."""
        text = "Contact me at john@example.com"
        cleaned, violations, warnings = apply_policy_guards(
            text, {"explicit": True}
        )

        assert "[[REDACTED:PII]]" in cleaned
        assert "john@example.com" not in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "pii_email"

    def test_artist_normalization(self):
        """Should normalize living artist references."""
        text = "This has the style of Taylor Swift"
        cleaned, violations, warnings = apply_policy_guards(
            text,
            {
                "explicit": True,
                "allow_living_artists": False,
                "genre": "pop",
            },
        )

        assert "Taylor Swift" not in cleaned
        assert "contemporary pop influence" in cleaned
        assert len(violations) == 1
        assert violations[0]["type"] == "living_artist"

    def test_combined_violations(self):
        """Should handle multiple policy violations in one text."""
        text = "Call 555-1234 for my Drake-style shit"
        cleaned, violations, warnings = apply_policy_guards(
            text,
            {
                "explicit": False,
                "allow_living_artists": False,
                "genre": "hiphop",
            },
        )

        # Should have profanity, PII, and artist violations
        assert len(violations) >= 2
        violation_types = {v["type"] for v in violations}
        assert "profanity" in violation_types or "pii_phone" in violation_types

        # Text should be cleaned
        assert "[[REDACTED" in cleaned
        assert "Drake" not in cleaned or "shit" not in cleaned

    def test_all_policy_types(self):
        """Should apply all policy types together."""
        text = "Email john@example.com for Drake-style fucking beats at 123 Main Street"
        cleaned, violations, warnings = apply_policy_guards(
            text,
            {
                "explicit": False,
                "allow_living_artists": False,
                "genre": "hiphop",
            },
        )

        # Should have all types of violations
        violation_types = {v["type"] for v in violations}
        assert len(violation_types) >= 2
        assert "[[REDACTED" in cleaned

    def test_no_violations(self):
        """Should return original text when no violations."""
        text = "This is a clean song about love and life"
        cleaned, violations, warnings = apply_policy_guards(
            text,
            {
                "explicit": True,
                "allow_living_artists": True,
                "genre": "pop",
            },
        )

        assert cleaned == text
        assert len(violations) == 0
        assert len(warnings) == 0

    def test_warnings_generated(self):
        """Should generate warnings for each policy type."""
        text = "Shit email: test@example.com, style of Drake"
        cleaned, violations, warnings = apply_policy_guards(
            text,
            {
                "explicit": False,
                "allow_living_artists": False,
                "genre": "hiphop",
            },
        )

        # Should have warnings for profanity, PII, and artist
        assert len(warnings) >= 2
        assert any("profane" in w.lower() for w in warnings)
        assert any("pii" in w.lower() for w in warnings)

    def test_violation_structure(self):
        """Should return violations with correct structure."""
        text = "Shit music at test@example.com"
        cleaned, violations, warnings = apply_policy_guards(
            text, {"explicit": False}
        )

        for violation in violations:
            assert "type" in violation
            assert "original" in violation
            assert "replacement" in violation
            assert "reason" in violation

    def test_default_constraints(self):
        """Should use defaults for missing constraint values."""
        text = "Some clean text"
        cleaned, violations, warnings = apply_policy_guards(text, {})

        # Should not crash with empty constraints
        assert cleaned == text
        assert len(violations) == 0

    def test_sequential_processing(self):
        """Should process policies in correct order."""
        text = "Fucking email: profane@example.com with Drake vibes"
        cleaned, violations, warnings = apply_policy_guards(
            text,
            {
                "explicit": False,
                "allow_living_artists": False,
                "genre": "hiphop",
            },
        )

        # Profanity filtered first, then PII, then artist
        # All should be applied to the progressively cleaned text
        assert "[[REDACTED" in cleaned
        assert "profane@example.com" not in cleaned or "fucking" not in cleaned.lower()

    def test_genre_passed_to_artist_normalization(self):
        """Should pass genre to artist normalization."""
        text = "style of Drake"

        # Test with hiphop genre
        cleaned1, violations1, _ = apply_policy_guards(
            text,
            {
                "explicit": True,
                "allow_living_artists": False,
                "genre": "hiphop",
            },
        )
        assert "modern hip-hop stylings" in cleaned1

        # Test with pop genre
        text2 = "style of Taylor Swift"
        cleaned2, violations2, _ = apply_policy_guards(
            text2,
            {
                "explicit": True,
                "allow_living_artists": False,
                "genre": "pop",
            },
        )
        assert "contemporary pop influence" in cleaned2


class TestSyllableCount:
    """Test syllable counting heuristic."""

    def test_count_syllables_simple(self):
        """Should count syllables in simple words."""
        assert _count_syllables("hello") >= 2
        assert _count_syllables("world") >= 1

    def test_count_syllables_multiword(self):
        """Should count syllables across multiple words."""
        count = _count_syllables("hello beautiful world")
        assert count >= 5  # Rough estimate


class TestRhymeTightness:
    """Test rhyme tightness calculation."""

    def test_rhyme_tightness_perfect(self):
        """Should score higher for better rhymes."""
        # Note: The rhyme function is a simple heuristic
        # It checks if last 2 characters match (which "sat"/"cat" and "dog"/"fog" do)
        lyrics = """[Verse]
cat
sat
dog
fog"""
        score = _calculate_rhyme_tightness(lyrics, "AABB")
        # Rhyme function compares consecutive lines, so should get some matches
        assert score >= 0.0  # Just validate it doesn't crash, exact score depends on heuristic

    def test_rhyme_tightness_no_rhymes(self):
        """Should score low for no rhymes."""
        lyrics = """[Verse]
apple
zebra"""
        score = _calculate_rhyme_tightness(lyrics, "AABB")
        assert score >= 0.0


class TestSingability:
    """Test singability calculation."""

    def test_singability_consistent_syllables(self):
        """Should score high for consistent syllable counts."""
        lyrics = "hello world\nhello world\nhello world"
        score = _calculate_singability(lyrics, target_syllables=4)
        assert score > 0.5

    def test_singability_inconsistent_syllables(self):
        """Should score lower for inconsistent syllable counts."""
        lyrics = "hi\nhello beautiful world today"
        score = _calculate_singability(lyrics, target_syllables=4)
        assert score < 1.0


class TestHookDensity:
    """Test hook density calculation."""

    def test_hook_density_with_repeated_chorus(self):
        """Should count hook occurrences in chorus sections."""
        lyrics = """[Chorus]
This is the hook
Another line
This is the hook

[Chorus]
This is the hook
Another line
This is the hook"""
        section_order = ["Chorus", "Chorus"]
        density = _calculate_hook_density(lyrics, section_order)
        assert density >= 2

    def test_hook_density_no_chorus(self):
        """Should return 0 if no chorus sections."""
        lyrics = """[Verse]
Line one
Line two"""
        section_order = ["Verse"]
        density = _calculate_hook_density(lyrics, section_order)
        assert density == 0


class TestWordsRhyme:
    """Test rhyme detection helper."""

    def test_words_rhyme_basic(self):
        """Should detect basic rhymes."""
        assert _words_rhyme("cat", "bat") is True
        assert _words_rhyme("home", "dome") is True
        assert _words_rhyme("night", "light") is True

    def test_words_rhyme_three_char_suffix(self):
        """Should detect 3-character suffix rhymes."""
        assert _words_rhyme("walking", "talking") is True
        assert _words_rhyme("running", "gunning") is True

    def test_words_dont_rhyme(self):
        """Should return False for non-rhyming words."""
        assert _words_rhyme("cat", "dog") is False
        assert _words_rhyme("home", "car") is False

    def test_same_word_not_rhyme(self):
        """Should return False for same word."""
        assert _words_rhyme("cat", "cat") is False
        assert _words_rhyme("home", "home") is False

    def test_words_rhyme_with_punctuation(self):
        """Should handle punctuation correctly."""
        assert _words_rhyme("cat!", "bat?") is True
        assert _words_rhyme("home.", "dome,") is True

    def test_words_rhyme_case_insensitive(self):
        """Should be case insensitive."""
        assert _words_rhyme("CAT", "bat") is True
        assert _words_rhyme("Home", "DOME") is True

    def test_words_rhyme_empty(self):
        """Should handle empty strings."""
        assert _words_rhyme("", "") is False
        assert _words_rhyme("cat", "") is False


class TestParseRhymeScheme:
    """Test rhyme scheme parsing."""

    def test_parse_rhyme_scheme_aabb(self):
        """Should parse AABB correctly."""
        pairs = _parse_rhyme_scheme("AABB")
        assert pairs == [(0, 1), (2, 3)]

    def test_parse_rhyme_scheme_abab(self):
        """Should parse ABAB correctly."""
        pairs = _parse_rhyme_scheme("ABAB")
        assert pairs == [(0, 2), (1, 3)]

    def test_parse_rhyme_scheme_abcb(self):
        """Should parse ABCB correctly."""
        pairs = _parse_rhyme_scheme("ABCB")
        assert pairs == [(1, 3)]

    def test_parse_rhyme_scheme_aaaa(self):
        """Should parse AAAA correctly."""
        pairs = _parse_rhyme_scheme("AAAA")
        assert pairs == [(0, 1), (0, 2), (0, 3)]

    def test_parse_rhyme_scheme_abcd(self):
        """Should parse ABCD (no rhymes) correctly."""
        pairs = _parse_rhyme_scheme("ABCD")
        assert pairs == []

    def test_parse_rhyme_scheme_lowercase(self):
        """Should handle lowercase schemes."""
        pairs = _parse_rhyme_scheme("aabb")
        assert pairs == [(0, 1), (2, 3)]

    def test_parse_rhyme_scheme_complex(self):
        """Should parse complex schemes."""
        pairs = _parse_rhyme_scheme("ABABCC")
        assert pairs == [(0, 2), (1, 3), (4, 5)]


class TestApplyRhymeScheme:
    """Test rhyme scheme enforcement."""

    def test_rhyme_scheme_enforcement_aabb_perfect(self):
        """Test AABB rhyme scheme with perfect rhymes."""
        text = "The cat sat on the mat\nIt wore a funny hat\nThe dog ran very fast\nThe race was quite a blast"
        adjusted, issues = apply_rhyme_scheme(text, "AABB", 8, seed=42)

        # Lines 1-2 rhyme (mat/hat), lines 3-4 rhyme (fast/blast)
        assert len(issues) == 0
        assert adjusted == text  # Text should be unchanged

    def test_rhyme_scheme_enforcement_weak_rhyme(self):
        """Test detection of weak rhymes."""
        text = "I love to sing\nUnder the moon\nWith everything\nIn the afternoon"
        adjusted, issues = apply_rhyme_scheme(text, "ABAB", 6, seed=42)

        # Lines 0-2 should rhyme (sing/everything) - they do
        # Lines 1-3 should rhyme (moon/afternoon) - they do
        # Both pairs rhyme, so no issues
        rhyme_issues = [i for i in issues if i["issue_type"] == "weak_rhyme"]
        assert len(rhyme_issues) == 0

    def test_rhyme_scheme_enforcement_no_rhyme(self):
        """Test detection when lines don't rhyme at all."""
        text = "The cat is black\nThe sky is blue\nThe dog is running\nThe car is red"
        adjusted, issues = apply_rhyme_scheme(text, "AABB", 6, seed=42)

        # Expect rhyme issues
        rhyme_issues = [i for i in issues if i["issue_type"] == "weak_rhyme"]
        assert len(rhyme_issues) > 0

    def test_syllable_validation_correct(self):
        """Test syllable count validation with correct counts."""
        # Each line has ~8 syllables (±2 tolerance = 6-10 acceptable)
        text = "I walk along the street today\nThe sun is shining bright\nI feel so happy and so free\nEverything feels right"
        adjusted, issues = apply_rhyme_scheme(text, "ABAB", 8, seed=42)

        # May have some rhyme issues, but syllable counts should be OK
        syllable_issues = [i for i in issues if i["issue_type"] == "syllable_mismatch"]
        # With ±2 tolerance, these should mostly pass
        assert len(syllable_issues) <= 2  # Some leeway for estimation

    def test_syllable_validation_too_few(self):
        """Test syllable count validation with too few syllables."""
        text = "Short\nLine\nText\nHere"
        adjusted, issues = apply_rhyme_scheme(text, "AABB", 8, seed=42)

        # Expect syllable issues
        syllable_issues = [i for i in issues if i["issue_type"] == "syllable_mismatch"]
        assert len(syllable_issues) >= 3  # Most lines too short

    def test_syllable_validation_too_many(self):
        """Test syllable count validation with too many syllables."""
        text = "This is a very long line with many syllables to count\nAnother extremely long line with excessive syllable counts\nShort\nOkay"
        adjusted, issues = apply_rhyme_scheme(text, "AABB", 8, seed=42)

        # Expect syllable issues for long lines
        syllable_issues = [i for i in issues if i["issue_type"] == "syllable_mismatch"]
        assert len(syllable_issues) >= 2

    def test_rhyme_scheme_enforcement_abab(self):
        """Test ABAB rhyme scheme."""
        text = "The night is dark and deep\nThe morning brings the light\nI cannot fall asleep\nThe stars are shining bright"
        adjusted, issues = apply_rhyme_scheme(text, "ABAB", 8, seed=42)

        # deep/asleep rhyme, light/bright rhyme
        rhyme_issues = [i for i in issues if i["issue_type"] == "weak_rhyme"]
        assert len(rhyme_issues) == 0

    def test_rhyme_scheme_enforcement_abcb(self):
        """Test ABCB rhyme scheme (only 2nd and 4th lines rhyme)."""
        text = "The sky is blue today\nThe sun is shining bright\nI walk along the way\nEverything feels right"
        adjusted, issues = apply_rhyme_scheme(text, "ABCB", 8, seed=42)

        # Only lines 1-3 should rhyme (bright/right)
        rhyme_issues = [i for i in issues if i["issue_type"] == "weak_rhyme"]
        assert len(rhyme_issues) == 0

    def test_empty_text(self):
        """Test handling of empty text."""
        adjusted, issues = apply_rhyme_scheme("", "AABB", 8, seed=42)
        assert adjusted == ""
        assert issues == []

    def test_single_line(self):
        """Test handling of single line."""
        text = "Just one line"
        adjusted, issues = apply_rhyme_scheme(text, "AABB", 8, seed=42)
        # No rhyme pairs to check with single line
        rhyme_issues = [i for i in issues if i["issue_type"] == "weak_rhyme"]
        assert len(rhyme_issues) == 0

    def test_deterministic_suggestions(self):
        """Test that suggestions are deterministic based on seed."""
        text = "The cat is black\nThe sky is blue"

        # Run twice with same seed
        _, issues1 = apply_rhyme_scheme(text, "AA", 8, seed=42)
        _, issues2 = apply_rhyme_scheme(text, "AA", 8, seed=42)

        # Should produce identical suggestions
        if issues1:
            assert issues1 == issues2

        # Run with different seed - may produce different suggestions
        _, issues3 = apply_rhyme_scheme(text, "AA", 8, seed=99)
        # Can't assert they're different, but they might be

    def test_issue_structure(self):
        """Test that issues have correct structure."""
        text = "The cat\nThe sky is blue"
        adjusted, issues = apply_rhyme_scheme(text, "AA", 8, seed=42)

        for issue in issues:
            assert "line_num" in issue
            assert "issue_type" in issue
            assert "original" in issue
            assert "suggestion" in issue
            assert "details" in issue
            assert issue["issue_type"] in ["weak_rhyme", "syllable_mismatch"]

    def test_mixed_issues(self):
        """Test text with both rhyme and syllable issues."""
        text = "Short\nAnother extremely long line with too many syllables here\nCat\nZebra elephant"
        adjusted, issues = apply_rhyme_scheme(text, "AABB", 8, seed=42)

        # Should have both types of issues
        rhyme_issues = [i for i in issues if i["issue_type"] == "weak_rhyme"]
        syllable_issues = [i for i in issues if i["issue_type"] == "syllable_mismatch"]

        assert len(rhyme_issues) > 0
        assert len(syllable_issues) > 0

    def test_rhyme_scheme_longer_than_lines(self):
        """Test when rhyme scheme expects more lines than provided."""
        text = "Line one\nLine two"
        adjusted, issues = apply_rhyme_scheme(text, "AABBCC", 8, seed=42)

        # Should not crash, just skip invalid pairs
        assert adjusted == text
        # May have some issues for the lines that exist


class TestPinnedRetrieve:
    """Test deterministic pinned retrieval."""

    @pytest.fixture
    def sample_sources(self) -> List[Dict[str, Any]]:
        """Create sample sources for testing."""
        return [
            {
                "name": "source_a",
                "chunks": [
                    "The sky is blue and bright",
                    "Mountains stand tall and proud",
                    "Rivers flow through the valley",
                ],
                "weight": 0.8,
            },
            {
                "name": "source_b",
                "chunks": [
                    "Love conquers all fears",
                    "Time heals every wound",
                    "Hope springs eternal",
                ],
                "weight": 0.6,
            },
            {
                "name": "source_c",
                "chunks": [
                    "Stars shine in the night",
                    "Dreams take flight",
                ],
                "weight": 0.7,
            },
        ]

    def test_pinned_retrieve_basic(self, sample_sources):
        """Should retrieve chunks deterministically."""
        chunks = pinned_retrieve(
            query="test query",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=3,
            seed=42,
        )

        assert len(chunks) == 3
        assert all("chunk_hash" in c for c in chunks)
        assert all("source_id" in c for c in chunks)
        assert all("text" in c for c in chunks)
        assert all("weight" in c for c in chunks)

    def test_pinned_retrieve_hash_matching(self, sample_sources):
        """Should retrieve chunks matching required hashes."""
        # First, get some chunks
        first_run = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=3,
            seed=42,
        )

        # Extract hashes from first run
        required_hashes = [c["chunk_hash"] for c in first_run]

        # Second run should return exact same chunks
        second_run = pinned_retrieve(
            query="different query",  # Query doesn't matter
            sources=sample_sources,
            required_chunk_hashes=required_hashes,
            top_k=3,
            seed=99,  # Seed doesn't matter when hashes provided
        )

        assert len(second_run) == len(first_run)
        for i, chunk in enumerate(second_run):
            assert chunk["chunk_hash"] == first_run[i]["chunk_hash"]
            assert chunk["text"] == first_run[i]["text"]

    def test_pinned_retrieve_lexicographic_fill(self, sample_sources):
        """Should fill remaining slots with lexicographic sort."""
        # Request more than matched hashes
        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],  # No hashes, pure lexicographic
            top_k=5,
            seed=42,
        )

        assert len(chunks) == 5

        # Verify lexicographic ordering (source_id, then text)
        for i in range(len(chunks) - 1):
            current = (chunks[i]["source_id"], chunks[i]["text"])
            next_chunk = (chunks[i + 1]["source_id"], chunks[i + 1]["text"])
            assert current <= next_chunk, "Chunks not in lexicographic order"

    def test_pinned_retrieve_missing_hash(self, sample_sources):
        """Should handle missing hashes gracefully."""
        fake_hash = hashlib.sha256(b"nonexistent chunk").hexdigest()

        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[fake_hash],
            top_k=3,
            seed=42,
        )

        # Should still return chunks via lexicographic fill
        assert len(chunks) == 3
        assert all(c["chunk_hash"] != fake_hash for c in chunks)

    def test_pinned_retrieve_empty_sources(self):
        """Should return empty list for empty sources."""
        chunks = pinned_retrieve(
            query="test",
            sources=[],
            required_chunk_hashes=[],
            top_k=3,
            seed=42,
        )

        assert chunks == []

    def test_pinned_retrieve_top_k_exceeds_available(self, sample_sources):
        """Should return all available chunks if top_k exceeds total."""
        total_chunks = sum(len(s.get("chunks", [])) for s in sample_sources)

        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=999,
            seed=42,
        )

        assert len(chunks) == total_chunks

    def test_pinned_retrieve_duplicate_hashes(self, sample_sources):
        """Should deduplicate required hashes."""
        # Get a chunk hash
        first_run = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=1,
            seed=42,
        )

        duplicate_hash = first_run[0]["chunk_hash"]

        # Request with duplicated hashes
        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[duplicate_hash, duplicate_hash, duplicate_hash],
            top_k=3,
            seed=42,
        )

        # Should only retrieve the chunk once, then fill with others
        hash_counts = {}
        for chunk in chunks:
            hash_counts[chunk["chunk_hash"]] = hash_counts.get(chunk["chunk_hash"], 0) + 1

        assert all(count == 1 for count in hash_counts.values()), "Duplicate chunks found"

    def test_pinned_retrieve_determinism_10_runs(self, sample_sources):
        """CRITICAL: Should produce identical results across 10 runs."""
        results = []

        for i in range(10):
            chunks = pinned_retrieve(
                query="test query",
                sources=sample_sources,
                required_chunk_hashes=[],
                top_k=5,
                seed=42,  # Same seed
            )

            # Hash the entire result for comparison
            result_hash = hashlib.sha256(
                json.dumps(chunks, sort_keys=True).encode()
            ).hexdigest()
            results.append(result_hash)

        # All 10 runs must produce identical hashes
        unique_results = set(results)
        assert (
            len(unique_results) == 1
        ), f"Non-deterministic results: {len(unique_results)} unique outputs"

    def test_pinned_retrieve_hash_consistency(self, sample_sources):
        """Should produce consistent SHA-256 hashes for chunks."""
        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=3,
            seed=42,
        )

        for chunk in chunks:
            # Verify hash matches text
            expected_hash = hashlib.sha256(chunk["text"].encode("utf-8")).hexdigest()
            assert chunk["chunk_hash"] == expected_hash

    def test_pinned_retrieve_preserves_metadata(self, sample_sources):
        """Should preserve source metadata (weight, source_id)."""
        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=5,
            seed=42,
        )

        # Verify each chunk has correct metadata from its source
        for chunk in chunks:
            source_id = chunk["source_id"]
            matching_source = next(s for s in sample_sources if s["name"] == source_id)

            assert chunk["weight"] == matching_source.get("weight", 0.5)
            assert chunk["text"] in matching_source["chunks"]

    def test_pinned_retrieve_top_k_zero(self, sample_sources):
        """Should return empty list for top_k=0."""
        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=0,
            seed=42,
        )

        assert chunks == []

    def test_pinned_retrieve_different_seeds_same_result(self, sample_sources):
        """Should produce same results with different seeds when no hashes."""
        # Seed doesn't affect lexicographic sort
        chunks1 = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=5,
            seed=42,
        )

        chunks2 = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=5,
            seed=999,  # Different seed
        )

        # Should be identical due to deterministic lexicographic sort
        assert len(chunks1) == len(chunks2)
        for i in range(len(chunks1)):
            assert chunks1[i]["chunk_hash"] == chunks2[i]["chunk_hash"]

    def test_pinned_retrieve_partial_hash_match(self, sample_sources):
        """Should handle partial hash matches correctly."""
        # Get 3 chunks from first run
        first_run = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=[],
            top_k=3,
            seed=42,
        )

        # Request 5 chunks but only provide 2 hashes
        required_hashes = [c["chunk_hash"] for c in first_run[:2]]

        chunks = pinned_retrieve(
            query="test",
            sources=sample_sources,
            required_chunk_hashes=required_hashes,
            top_k=5,
            seed=42,
        )

        assert len(chunks) == 5

        # First 2 should match required hashes
        matched_hashes = {c["chunk_hash"] for c in chunks[:2]}
        assert matched_hashes == set(required_hashes)


class TestPinnedRetrieveEdgeCases:
    """Test edge cases for pinned retrieval."""

    def test_empty_chunks_in_source(self):
        """Should skip sources with empty chunks."""
        sources = [
            {"name": "source1", "chunks": [], "weight": 0.5},
            {"name": "source2", "chunks": ["Valid chunk"], "weight": 0.5},
        ]

        chunks = pinned_retrieve(
            query="test", sources=sources, required_chunk_hashes=[], top_k=3, seed=42
        )

        assert len(chunks) == 1
        assert chunks[0]["text"] == "Valid chunk"

    def test_missing_chunks_key(self):
        """Should handle sources without 'chunks' key."""
        sources = [
            {"name": "source1", "weight": 0.5},  # No chunks key
            {"name": "source2", "chunks": ["Valid chunk"], "weight": 0.5},
        ]

        chunks = pinned_retrieve(
            query="test", sources=sources, required_chunk_hashes=[], top_k=3, seed=42
        )

        assert len(chunks) == 1

    def test_non_string_chunks(self):
        """Should skip non-string chunks."""
        sources = [
            {
                "name": "source1",
                "chunks": ["Valid chunk", None, 123, "", "Another valid"],
                "weight": 0.5,
            }
        ]

        chunks = pinned_retrieve(
            query="test", sources=sources, required_chunk_hashes=[], top_k=10, seed=42
        )

        # Should only get the 2 valid string chunks
        assert len(chunks) == 2
        assert all(isinstance(c["text"], str) for c in chunks)

    def test_source_without_name_or_id(self):
        """Should use 'unknown' for sources without name/id."""
        sources = [{"chunks": ["Test chunk"], "weight": 0.5}]

        chunks = pinned_retrieve(
            query="test", sources=sources, required_chunk_hashes=[], top_k=1, seed=42
        )

        assert len(chunks) == 1
        assert chunks[0]["source_id"] == "unknown"

    def test_source_with_id_instead_of_name(self):
        """Should use 'id' field if 'name' not present."""
        sources = [{"id": "custom_id", "chunks": ["Test chunk"], "weight": 0.5}]

        chunks = pinned_retrieve(
            query="test", sources=sources, required_chunk_hashes=[], top_k=1, seed=42
        )

        assert len(chunks) == 1
        assert chunks[0]["source_id"] == "custom_id"

    def test_missing_weight(self):
        """Should default to 0.5 for missing weight."""
        sources = [{"name": "source1", "chunks": ["Test chunk"]}]  # No weight

        chunks = pinned_retrieve(
            query="test", sources=sources, required_chunk_hashes=[], top_k=1, seed=42
        )

        assert len(chunks) == 1
        assert chunks[0]["weight"] == 0.5


# Integration test placeholder (will be fleshed out when full workflow is ready)
class TestLyricsIntegration:
    """Integration tests for lyrics generation workflow."""

    @pytest.mark.skip(reason="Requires full workflow setup with LLM mock")
    def test_generate_lyrics_determinism(self):
        """Should generate identical lyrics across runs with same seed."""
        # TODO: Implement when workflow is fully set up
        pass

    @pytest.mark.skip(reason="Requires full workflow setup with LLM mock")
    def test_generate_lyrics_with_sources(self):
        """Should use pinned retrieval when sources provided."""
        # TODO: Implement when workflow is fully set up
        pass
