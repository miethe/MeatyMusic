"""
Standalone profanity filter test (no dependencies on app config).

Run with:
    cd services/api
    uv run python test_profanity_standalone.py
"""

import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.common import get_profanity_filter


def test_profanity_filter():
    """Test profanity filter functionality."""
    print("Testing profanity filter...\n")

    filter = get_profanity_filter()

    # Test 1: Clean text
    print("Test 1: Clean text")
    result = filter.check_text("This is a clean and wholesome message", explicit_allowed=False)
    assert result.is_clean is True
    assert result.violation_count == 0
    print("✓ PASS: Clean text detected correctly\n")

    # Test 2: Exact match
    print("Test 2: Exact profanity match")
    result = filter.check_text("This is some bad shit", explicit_allowed=False)
    assert result.is_clean is False
    assert result.violation_count == 1
    assert result.violations[0].word == "shit"
    assert result.violations[0].category == "moderate"
    assert result.violations[0].score == 0.6
    print(f"✓ PASS: Detected '{result.violations[0].word}' (category: {result.violations[0].category}, score: {result.violations[0].score})\n")

    # Test 3: Case insensitive
    print("Test 3: Case insensitive detection")
    test_cases = ["SHIT", "Shit", "ShIt", "shit"]
    for word in test_cases:
        result = filter.check_text(f"This is {word}", explicit_allowed=False)
        assert result.is_clean is False
        assert result.violation_count == 1
    print(f"✓ PASS: Detected all case variations\n")

    # Test 4: L33t speak
    print("Test 4: L33t speak detection")
    result = filter.check_text("This is sh1t", explicit_allowed=False)
    assert result.is_clean is False
    assert result.violation_count >= 1
    print(f"✓ PASS: Detected l33t speak 'sh1t'\n")

    # Test 5: Word boundaries (false positive avoidance)
    print("Test 5: Word boundary detection (avoiding false positives)")
    false_positives = ["classic", "hello", "hassle"]
    for word in false_positives:
        result = filter.check_text(word, explicit_allowed=False)
        assert result.is_clean is True, f"False positive for: {word}"
    print("✓ PASS: No false positives for 'classic', 'hello', 'hassle'\n")

    # Test 6: Multiple violations
    print("Test 6: Multiple violations")
    result = filter.check_text("This shit is fucking terrible and damn stupid", explicit_allowed=False)
    assert result.is_clean is False
    assert result.violation_count >= 3
    print(f"✓ PASS: Detected {result.violation_count} violations\n")

    # Test 7: Score calculation
    print("Test 7: Score calculation")
    result = filter.check_text("damn this shit is fucking terrible", explicit_allowed=False)
    print(f"  Categories found: {result.categories_found}")
    print(f"  Total score: {result.total_score}")
    print(f"  Max score: {result.max_score}")
    assert "mild" in result.categories_found  # damn
    assert "moderate" in result.categories_found  # shit
    assert "severe" in result.categories_found  # fucking
    assert result.max_score >= 1.0
    print("✓ PASS: Multiple categories detected with correct scores\n")

    # Test 8: Explicit allowed
    print("Test 8: Explicit content allowed flag")
    result = filter.check_text("This shit is bad", explicit_allowed=True)
    assert result.is_clean is True  # Marked as clean when explicit allowed
    assert result.violation_count >= 1  # But violations still reported
    print("✓ PASS: Text marked clean when explicit_allowed=True, but violations still tracked\n")

    # Test 9: Line numbers
    print("Test 9: Line number tracking")
    text = """Line 1 is clean
Line 2 is also clean
Line 3 has some shit
Line 4 is clean again
Line 5 has fuck in it"""
    result = filter.check_text(text, explicit_allowed=False)
    line_numbers = [v.line_number for v in result.violations if v.line_number]
    assert 3 in line_numbers
    assert 5 in line_numbers
    print(f"✓ PASS: Line numbers tracked correctly: {line_numbers}\n")

    # Test 10: Context extraction
    print("Test 10: Context extraction")
    result = filter.check_text("This is a really long line with some bad shit in the middle of the sentence", explicit_allowed=False)
    assert result.violation_count >= 1
    violation = result.violations[0]
    assert violation.context is not None
    assert "shit" in violation.context.lower()
    print(f"  Context: '{violation.context}'")
    print("✓ PASS: Context extracted correctly\n")

    # Test 11: Empty text
    print("Test 11: Empty text handling")
    result = filter.check_text("", explicit_allowed=False)
    assert result.is_clean is True
    assert result.violation_count == 0
    print("✓ PASS: Empty text handled correctly\n")

    # Test 12: Integration test with realistic lyrics
    print("Test 12: Integration test with realistic lyrics")
    clean_lyrics = """[Verse 1]
Walking down the street
Feeling pretty neat
Life is so sweet
Can't be beat

[Chorus]
This is my song
Nothing going wrong"""

    result = filter.check_text(clean_lyrics, explicit_allowed=False)
    assert result.is_clean is True
    assert result.violation_count == 0
    print("✓ PASS: Clean lyrics validated\n")

    dirty_lyrics = """[Verse 1]
This shit ain't sweet
Life is fucking beat

[Chorus]
Damn this song"""

    result = filter.check_text(dirty_lyrics, explicit_allowed=False)
    assert result.is_clean is False
    assert result.violation_count >= 3
    print(f"✓ PASS: Profane lyrics detected ({result.violation_count} violations)\n")

    print("=" * 60)
    print("ALL TESTS PASSED! ✓")
    print("=" * 60)
    print(f"\nProfanity filter loaded with {len(filter._word_to_category)} words")
    print(f"Categories: {list(filter._categories.keys())}")


if __name__ == "__main__":
    test_profanity_filter()
