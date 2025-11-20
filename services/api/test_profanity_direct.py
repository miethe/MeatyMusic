"""
Direct profanity filter test (minimal dependencies).

Run with:
    cd services/api
    uv run python test_profanity_direct.py
"""

import json
import re
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

# Inline minimal ProfanityFilter implementation for testing
class ProfanityViolation:
    def __init__(self, word: str, category: str, score: float,
                 line_number: Optional[int] = None, context: Optional[str] = None,
                 position: Optional[int] = None):
        self.word = word
        self.category = category
        self.score = score
        self.line_number = line_number
        self.context = context
        self.position = position


class ProfanityCheckResult:
    def __init__(self, is_clean: bool, violations: List[ProfanityViolation],
                 total_score: float, max_score: float, violation_count: int,
                 categories_found: List[str]):
        self.is_clean = is_clean
        self.violations = violations
        self.total_score = total_score
        self.max_score = max_score
        self.violation_count = violation_count
        self.categories_found = categories_found


class SimpleProfanityFilter:
    """Simplified profanity filter for testing."""

    def __init__(self):
        self._categories: Dict[str, Dict[str, Any]] = {}
        self._word_to_category: Dict[str, Tuple[str, float]] = {}
        self._variations: Dict[str, List[str]] = {}
        self._load_profanity_lists()

    def _load_profanity_lists(self):
        """Load profanity lists from JSON."""
        json_path = Path(__file__).parent / "app" / "data" / "profanity_lists.json"

        if not json_path.exists():
            print(f"Warning: Profanity list not found at {json_path}")
            self._load_fallback()
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self._categories = data.get("categories", {})

        for category_name, category_data in self._categories.items():
            score = category_data.get("score", 0.5)
            words = category_data.get("words", [])

            for word in words:
                word_lower = word.lower().strip()
                if word_lower:
                    self._word_to_category[word_lower] = (category_name, score)

        self._variations = data.get("common_variations", {})

        print(f"Loaded {len(self._word_to_category)} profanity words")
        print(f"Categories: {list(self._categories.keys())}")

    def _load_fallback(self):
        """Load minimal fallback list."""
        fallback = {
            "mild": (0.3, ["ass", "damn", "hell", "crap"]),
            "moderate": (0.6, ["shit", "bitch", "dick"]),
            "severe": (1.0, ["fuck", "cunt"])
        }

        for cat, (score, words) in fallback.items():
            for word in words:
                self._word_to_category[word.lower()] = (cat, score)

    def _normalize_l33t_speak(self, text: str) -> str:
        """Convert l33t speak to normal text."""
        normalized = text.lower()
        replacements = {
            '@': 'a', '4': 'a', '^': 'a',
            '3': 'e',
            '1': 'i', '!': 'i', '|': 'i',
            '0': 'o',
            '$': 's', '5': 's',
            '7': 't', '+': 't',
        }

        for l33t_char, normal_char in replacements.items():
            normalized = normalized.replace(l33t_char, normal_char)

        return normalized

    def _check_word(self, word: str) -> Optional[Tuple[str, str, float]]:
        """Check if word is profanity."""
        word_lower = word.lower()

        # Exact match
        if word_lower in self._word_to_category:
            category, score = self._word_to_category[word_lower]
            return (word_lower, category, score)

        # Check variations
        for base_word, variations in self._variations.items():
            if word_lower in variations or word_lower == base_word:
                if base_word in self._word_to_category:
                    category, score = self._word_to_category[base_word]
                    return (base_word, category, score)

        return None

    def check_text(self, text: str, explicit_allowed: bool = False) -> ProfanityCheckResult:
        """Check text for profanity."""
        violations: List[ProfanityViolation] = []
        lines = text.split('\n')

        for line_num, line in enumerate(lines, start=1):
            normalized_line = self._normalize_l33t_speak(line)
            words = re.findall(r'\b\w+\b', normalized_line)
            original_words = re.findall(r'\b\w+\b', line.lower())

            for word, orig_word in zip(words, original_words):
                match = self._check_word(word)

                if match:
                    base_word, category, score = match
                    position = line.lower().find(orig_word)

                    context_start = max(0, position - 30)
                    context_end = min(len(line), position + len(orig_word) + 30)
                    context = line[context_start:context_end].strip()
                    if context_start > 0:
                        context = "..." + context
                    if context_end < len(line):
                        context = context + "..."

                    violation = ProfanityViolation(
                        word=orig_word,
                        category=category,
                        score=score,
                        line_number=line_num,
                        context=context,
                        position=position
                    )
                    violations.append(violation)

        total_score = sum(v.score for v in violations)
        max_score = max((v.score for v in violations), default=0.0)
        violation_count = len(violations)
        categories_found = list(set(v.category for v in violations))

        is_clean = (violation_count == 0) or explicit_allowed

        return ProfanityCheckResult(
            is_clean=is_clean,
            violations=violations,
            total_score=total_score,
            max_score=max_score,
            violation_count=violation_count,
            categories_found=categories_found
        )


def run_tests():
    """Run profanity filter tests."""
    print("=" * 60)
    print("PROFANITY FILTER TESTS")
    print("=" * 60 + "\n")

    filter = SimpleProfanityFilter()
    print()

    # Test 1: Clean text
    print("Test 1: Clean text")
    result = filter.check_text("This is a clean and wholesome message", explicit_allowed=False)
    assert result.is_clean is True
    assert result.violation_count == 0
    print("✓ PASS\n")

    # Test 2: Exact match
    print("Test 2: Exact profanity match")
    result = filter.check_text("This is some bad shit", explicit_allowed=False)
    assert result.is_clean is False
    assert result.violation_count == 1
    assert result.violations[0].word == "shit"
    print(f"✓ PASS: Detected '{result.violations[0].word}' (category: {result.violations[0].category}, score: {result.violations[0].score})\n")

    # Test 3: Case insensitive
    print("Test 3: Case insensitive detection")
    for word in ["SHIT", "Shit", "ShIt", "shit"]:
        result = filter.check_text(f"This is {word}", explicit_allowed=False)
        assert result.is_clean is False
        assert result.violation_count == 1
    print("✓ PASS\n")

    # Test 4: L33t speak
    print("Test 4: L33t speak detection")
    result = filter.check_text("This is sh1t", explicit_allowed=False)
    assert result.is_clean is False
    print(f"✓ PASS: Detected 'sh1t'\n")

    # Test 5: Word boundaries
    print("Test 5: Word boundary detection (avoiding false positives)")
    for word in ["classic", "hello", "hassle"]:
        result = filter.check_text(word, explicit_allowed=False)
        assert result.is_clean is True, f"False positive for: {word}"
    print("✓ PASS\n")

    # Test 6: Multiple violations
    print("Test 6: Multiple violations")
    result = filter.check_text("This shit is fucking terrible and damn stupid", explicit_allowed=False)
    assert result.is_clean is False
    assert result.violation_count >= 3
    print(f"✓ PASS: {result.violation_count} violations detected\n")

    # Test 7: Categories
    print("Test 7: Category detection")
    result = filter.check_text("damn this shit is fucking terrible", explicit_allowed=False)
    print(f"  Categories: {result.categories_found}")
    print(f"  Total score: {result.total_score}")
    print(f"  Max score: {result.max_score}")
    assert len(result.categories_found) >= 2
    print("✓ PASS\n")

    # Test 8: Explicit allowed
    print("Test 8: Explicit content allowed")
    result = filter.check_text("This shit is bad", explicit_allowed=True)
    assert result.is_clean is True
    assert result.violation_count >= 1
    print("✓ PASS\n")

    # Test 9: Line numbers
    print("Test 9: Line number tracking")
    text = """Line 1 is clean
Line 2 is also clean
Line 3 has some shit
Line 4 is clean again
Line 5 has fuck in it"""
    result = filter.check_text(text, explicit_allowed=False)
    line_numbers = [v.line_number for v in result.violations]
    print(f"  Violations on lines: {line_numbers}")
    assert 3 in line_numbers
    assert 5 in line_numbers
    print("✓ PASS\n")

    # Test 10: Context
    print("Test 10: Context extraction")
    result = filter.check_text("This is a really long line with some bad shit in the middle", explicit_allowed=False)
    assert result.violations[0].context is not None
    assert "shit" in result.violations[0].context.lower()
    print(f"  Context: '{result.violations[0].context}'")
    print("✓ PASS\n")

    print("=" * 60)
    print("ALL TESTS PASSED! ✓")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
