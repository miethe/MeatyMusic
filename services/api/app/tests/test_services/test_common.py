"""Tests for shared validation utilities (services/common.py).

This test suite validates all shared utilities with emphasis on:
1. Determinism: Same inputs produce same outputs
2. Edge cases and error handling
3. Compliance with MeatyMusic patterns
"""

import pytest
from datetime import datetime
from uuid import UUID, uuid4

from app.services.common import (
    # Citation hashing
    compute_citation_hash,
    compute_citation_batch_hash,
    # Rhyme scheme validation
    validate_rhyme_scheme,
    parse_rhyme_scheme,
    extract_rhyme_endings,
    check_rhyme_similarity,
    # Weight normalization
    normalize_weights,
    # Explicit content
    check_explicit_content,
    add_profanity_terms,
    get_profanity_list,
    # Section validation
    validate_section_order,
    extract_sections,
    # Syllable counting
    count_syllables,
    calculate_syllable_consistency,
)


# =============================================================================
# Citation Hash Tests
# =============================================================================


class TestCitationHashing:
    """Tests for citation hash computation."""

    def test_compute_citation_hash_deterministic(self):
        """Test that hash computation is deterministic."""
        source_id = uuid4()
        chunk_text = "This is a test chunk"

        hash1 = compute_citation_hash(source_id, chunk_text)
        hash2 = compute_citation_hash(source_id, chunk_text)

        assert hash1 == hash2, "Hash must be deterministic"
        assert len(hash1) == 64, "SHA-256 produces 64 hex characters"

    def test_compute_citation_hash_with_timestamp(self):
        """Test hash with timestamp is deterministic."""
        source_id = uuid4()
        chunk_text = "Test chunk"
        timestamp = datetime(2024, 1, 1, 12, 0, 0)

        hash1 = compute_citation_hash(source_id, chunk_text, timestamp)
        hash2 = compute_citation_hash(source_id, chunk_text, timestamp)

        assert hash1 == hash2, "Hash with timestamp must be deterministic"

    def test_compute_citation_hash_different_inputs(self):
        """Test that different inputs produce different hashes."""
        source_id1 = uuid4()
        source_id2 = uuid4()
        chunk_text = "Same text"

        hash1 = compute_citation_hash(source_id1, chunk_text)
        hash2 = compute_citation_hash(source_id2, chunk_text)

        assert hash1 != hash2, "Different source_ids should produce different hashes"

    def test_compute_citation_hash_whitespace_normalization(self):
        """Test that whitespace is normalized."""
        source_id = uuid4()

        hash1 = compute_citation_hash(source_id, "  test  ")
        hash2 = compute_citation_hash(source_id, "test")

        assert hash1 == hash2, "Leading/trailing whitespace should be normalized"

    def test_compute_citation_batch_hash(self):
        """Test batch citation hashing."""
        citations = [
            {"source_id": uuid4(), "chunk_text": "chunk1"},
            {"source_id": uuid4(), "chunk_text": "chunk2"},
            {"source_id": uuid4(), "chunk_text": "chunk3"},
        ]

        hash1 = compute_citation_batch_hash(citations)
        hash2 = compute_citation_batch_hash(citations)

        assert hash1 == hash2, "Batch hash must be deterministic"
        assert len(hash1) == 64

    def test_compute_citation_batch_hash_order_independent(self):
        """Test that batch hash is order-independent (sorted internally)."""
        source_id1 = uuid4()
        source_id2 = uuid4()

        citations1 = [
            {"source_id": source_id1, "chunk_text": "chunk1"},
            {"source_id": source_id2, "chunk_text": "chunk2"},
        ]

        citations2 = [
            {"source_id": source_id2, "chunk_text": "chunk2"},
            {"source_id": source_id1, "chunk_text": "chunk1"},
        ]

        hash1 = compute_citation_batch_hash(citations1)
        hash2 = compute_citation_batch_hash(citations2)

        assert hash1 == hash2, "Batch hash should be order-independent"


# =============================================================================
# Rhyme Scheme Tests
# =============================================================================


class TestRhymeScheme:
    """Tests for rhyme scheme validation."""

    @pytest.mark.parametrize("scheme,expected", [
        ("AABB", True),
        ("ABAB", True),
        ("ABCB", True),
        ("AAAA", True),
        ("ABCABC", True),
        ("A", True),
        ("AB", True),
        # Invalid cases
        ("", False),
        ("aabb", False),
        ("A1B2", False),
        ("ACBB", False),  # Skips B before C
        ("ABD", False),   # Skips C
        ("12AB", False),
        (None, False),
    ])
    def test_validate_rhyme_scheme(self, scheme, expected):
        """Test rhyme scheme validation."""
        assert validate_rhyme_scheme(scheme) == expected

    def test_parse_rhyme_scheme_aabb(self):
        """Test parsing AABB rhyme scheme."""
        text = "Line 1\nLine 2\nLine 3\nLine 4"
        scheme = "AABB"

        groups = parse_rhyme_scheme(text, scheme)

        assert "A" in groups
        assert "B" in groups
        assert len(groups["A"]) == 2
        assert len(groups["B"]) == 2
        assert groups["A"] == ["Line 1", "Line 2"]
        assert groups["B"] == ["Line 3", "Line 4"]

    def test_parse_rhyme_scheme_abab(self):
        """Test parsing ABAB rhyme scheme."""
        text = "Line 1\nLine 2\nLine 3\nLine 4"
        scheme = "ABAB"

        groups = parse_rhyme_scheme(text, scheme)

        assert groups["A"] == ["Line 1", "Line 3"]
        assert groups["B"] == ["Line 2", "Line 4"]

    def test_parse_rhyme_scheme_repeating(self):
        """Test that scheme repeats for longer text."""
        text = "L1\nL2\nL3\nL4\nL5\nL6"
        scheme = "AAB"

        groups = parse_rhyme_scheme(text, scheme)

        # AAB AAB pattern
        assert len(groups["A"]) == 4  # Lines 1, 2, 4, 5
        assert len(groups["B"]) == 2  # Lines 3, 6

    def test_parse_rhyme_scheme_invalid(self):
        """Test parsing with invalid scheme returns empty dict."""
        text = "Line 1\nLine 2"
        scheme = "INVALID123"

        groups = parse_rhyme_scheme(text, scheme)

        assert groups == {}

    def test_extract_rhyme_endings(self):
        """Test extracting rhyme endings from lines."""
        lines = [
            "The cat in the hat",
            "Sitting on a mat",
            "Looking at the rat"
        ]

        endings = extract_rhyme_endings(lines)

        assert endings == ["hat", "mat", "rat"]

    def test_extract_rhyme_endings_with_punctuation(self):
        """Test that punctuation is removed."""
        lines = [
            "The cat in the hat!",
            "Sitting on a mat,",
            "Looking at the rat."
        ]

        endings = extract_rhyme_endings(lines)

        assert endings == ["hat", "mat", "rat"]

    @pytest.mark.parametrize("word1,word2,expected_min", [
        ("cat", "hat", 0.9),
        ("love", "dove", 0.9),
        ("mat", "rat", 0.9),
        ("cat", "dog", 0.0),
        ("hello", "world", 0.0),
        ("same", "same", 1.0),
    ])
    def test_check_rhyme_similarity(self, word1, word2, expected_min):
        """Test rhyme similarity checking."""
        similarity = check_rhyme_similarity(word1, word2)
        assert similarity >= expected_min


# =============================================================================
# Weight Normalization Tests
# =============================================================================


class TestWeightNormalization:
    """Tests for weight normalization."""

    def test_normalize_weights_exceeds_max(self):
        """Test normalization when weights exceed max_sum."""
        weights = {"a": 0.5, "b": 0.8}  # Sum = 1.3

        normalized = normalize_weights(weights, max_sum=1.0)

        total = sum(normalized.values())
        assert abs(total - 1.0) < 0.001, f"Sum should be 1.0, got {total}"

        # Check relative proportions preserved
        ratio_original = weights["a"] / weights["b"]
        ratio_normalized = normalized["a"] / normalized["b"]
        assert abs(ratio_original - ratio_normalized) < 0.001

    def test_normalize_weights_already_valid(self):
        """Test that weights already ≤ max_sum are unchanged."""
        weights = {"a": 0.3, "b": 0.4}  # Sum = 0.7

        normalized = normalize_weights(weights, max_sum=1.0)

        assert normalized == weights

    def test_normalize_weights_empty(self):
        """Test normalization with empty dict."""
        normalized = normalize_weights({})

        assert normalized == {}

    def test_normalize_weights_negative_values(self):
        """Test that negative values are removed."""
        weights = {"a": 0.5, "b": -0.2, "c": 0.3}

        normalized = normalize_weights(weights, max_sum=1.0)

        assert "b" not in normalized
        assert "a" in normalized
        assert "c" in normalized

    def test_normalize_weights_all_zero(self):
        """Test with all zero weights."""
        weights = {"a": 0.0, "b": 0.0}

        normalized = normalize_weights(weights)

        assert normalized == {}

    def test_normalize_weights_custom_max_sum(self):
        """Test normalization with custom max_sum."""
        weights = {"a": 1.0, "b": 2.0}  # Sum = 3.0

        normalized = normalize_weights(weights, max_sum=0.5)

        total = sum(normalized.values())
        assert abs(total - 0.5) < 0.001


# =============================================================================
# Explicit Content Tests
# =============================================================================


class TestExplicitContent:
    """Tests for explicit content filtering."""

    @pytest.mark.asyncio
    async def test_check_explicit_content_clean(self):
        """Test clean text passes."""
        text = "This is a clean song about love and hope"

        is_clean, violations = await check_explicit_content(text, explicit_allowed=False)

        assert is_clean is True
        assert violations == []

    @pytest.mark.asyncio
    async def test_check_explicit_content_violations(self):
        """Test that explicit content is detected."""
        text = "This song has some shit in it"

        is_clean, violations = await check_explicit_content(text, explicit_allowed=False)

        assert is_clean is False
        assert "shit" in violations

    @pytest.mark.asyncio
    async def test_check_explicit_content_allowed(self):
        """Test that explicit content passes when allowed."""
        text = "This song has some shit in it"

        is_clean, violations = await check_explicit_content(text, explicit_allowed=True)

        assert is_clean is True
        assert "shit" in violations  # Still reported but allowed

    @pytest.mark.asyncio
    async def test_check_explicit_content_multiple_violations(self):
        """Test multiple violations are detected."""
        text = "This shit is fucking bad"

        is_clean, violations = await check_explicit_content(text, explicit_allowed=False)

        assert is_clean is False
        assert len(violations) >= 2

    @pytest.mark.asyncio
    async def test_check_explicit_content_deterministic(self):
        """Test that checking is deterministic."""
        text = "This song has some shit in it"

        result1 = await check_explicit_content(text, explicit_allowed=False)
        result2 = await check_explicit_content(text, explicit_allowed=False)

        assert result1 == result2

    def test_add_profanity_terms(self):
        """Test adding custom profanity terms."""
        initial_list = get_profanity_list()

        add_profanity_terms(["customterm1", "customterm2"])

        updated_list = get_profanity_list()
        assert "customterm1" in updated_list
        assert "customterm2" in updated_list


# =============================================================================
# Section Validation Tests
# =============================================================================


class TestSectionValidation:
    """Tests for section order validation."""

    def test_validate_section_order_valid(self):
        """Test valid section order."""
        section_order = ["Verse", "Chorus", "Verse", "Chorus", "Bridge"]

        is_valid, error = validate_section_order(section_order)

        assert is_valid is True
        assert error is None

    def test_validate_section_order_missing_chorus(self):
        """Test that missing chorus is detected."""
        section_order = ["Verse", "Bridge", "Verse"]

        is_valid, error = validate_section_order(section_order)

        assert is_valid is False
        assert "Chorus" in error

    def test_validate_section_order_case_insensitive(self):
        """Test that chorus check is case-insensitive."""
        section_order = ["verse", "CHORUS", "verse"]

        is_valid, error = validate_section_order(section_order)

        assert is_valid is True

    def test_validate_section_order_empty(self):
        """Test empty section order is invalid."""
        is_valid, error = validate_section_order([])

        assert is_valid is False
        assert "non-empty" in error.lower()

    def test_validate_section_order_with_required(self):
        """Test validation with required sections."""
        section_order = ["Verse", "Chorus", "Bridge"]
        required = ["Verse", "Chorus", "Bridge"]

        is_valid, error = validate_section_order(section_order, required_sections=required)

        assert is_valid is True

    def test_validate_section_order_missing_required(self):
        """Test that missing required section is detected."""
        section_order = ["Verse", "Chorus"]
        required = ["Verse", "Chorus", "Bridge"]

        is_valid, error = validate_section_order(section_order, required_sections=required)

        assert is_valid is False
        assert "Bridge" in error

    def test_validate_section_order_empty_strings(self):
        """Test that empty strings are invalid."""
        section_order = ["Verse", "", "Chorus"]

        is_valid, error = validate_section_order(section_order)

        assert is_valid is False

    def test_extract_sections(self):
        """Test extracting sections from lyrics text."""
        lyrics = """
[Verse]
Line 1
Line 2

[Chorus]
Hook line
Another hook

[Bridge]
Bridge line
"""

        sections = extract_sections(lyrics)

        assert "Verse" in sections
        assert "Chorus" in sections
        assert "Bridge" in sections
        assert len(sections["Verse"]) == 2
        assert len(sections["Chorus"]) == 2
        assert len(sections["Bridge"]) == 1

    def test_extract_sections_no_markers(self):
        """Test that text without markers returns empty dict."""
        lyrics = "Line 1\nLine 2\nLine 3"

        sections = extract_sections(lyrics)

        assert sections == {}


# =============================================================================
# Syllable Counting Tests
# =============================================================================


class TestSyllableCounting:
    """Tests for syllable counting."""

    @pytest.mark.parametrize("text,expected", [
        ("cat", 1),
        ("hello", 2),
        ("beautiful", 3),
        ("the cat in the hat", 5),
        ("", 0),
        ("a", 1),
        ("documentation", 5),
    ])
    def test_count_syllables(self, text, expected):
        """Test syllable counting."""
        count = count_syllables(text)
        # Allow ±1 syllable tolerance (heuristic is approximate)
        assert abs(count - expected) <= 1, f"Expected ~{expected}, got {count}"

    def test_count_syllables_deterministic(self):
        """Test that syllable counting is deterministic."""
        text = "The cat in the hat sat on the mat"

        count1 = count_syllables(text)
        count2 = count_syllables(text)

        assert count1 == count2

    def test_calculate_syllable_consistency_perfect(self):
        """Test perfect syllable consistency."""
        lines = [
            "The cat in hat",  # 4 syllables
            "Sat on the mat",  # 4 syllables
            "Wore a red hat",  # 4 syllables
        ]

        consistency = calculate_syllable_consistency(lines)

        assert consistency >= 0.95, "Perfect consistency should be close to 1.0"

    def test_calculate_syllable_consistency_varied(self):
        """Test varied syllable consistency."""
        lines = [
            "The cat",          # 2 syllables
            "Beautiful day",    # 4 syllables
            "Documentation",    # 5 syllables
        ]

        consistency = calculate_syllable_consistency(lines)

        assert 0.0 <= consistency < 0.8, "Varied consistency should be lower"

    def test_calculate_syllable_consistency_empty(self):
        """Test empty lines return 0 consistency."""
        consistency = calculate_syllable_consistency([])

        assert consistency == 0.0


# =============================================================================
# Integration Tests
# =============================================================================


class TestIntegration:
    """Integration tests for combined utility usage."""

    def test_citation_workflow(self):
        """Test complete citation workflow."""
        # Create citations
        source_id1 = uuid4()
        source_id2 = uuid4()

        citation1_hash = compute_citation_hash(source_id1, "chunk 1")
        citation2_hash = compute_citation_hash(source_id2, "chunk 2")

        # Create citation records
        citations = [
            {"source_id": source_id1, "chunk_text": "chunk 1", "weight": 0.6},
            {"source_id": source_id2, "chunk_text": "chunk 2", "weight": 0.7},
        ]

        # Normalize weights
        weights = {str(c["source_id"]): c["weight"] for c in citations}
        normalized = normalize_weights(weights)

        assert sum(normalized.values()) <= 1.0

        # Compute batch hash
        batch_hash = compute_citation_batch_hash(citations)
        assert len(batch_hash) == 64

    def test_lyrics_validation_workflow(self):
        """Test complete lyrics validation workflow."""
        # Validate section order
        sections = ["Verse", "Chorus", "Verse", "Chorus", "Bridge"]
        is_valid, _ = validate_section_order(sections)
        assert is_valid

        # Validate rhyme scheme
        scheme = "AABB"
        assert validate_rhyme_scheme(scheme)

        # Parse rhyme groups
        lyrics_text = "Line 1\nLine 2\nLine 3\nLine 4"
        groups = parse_rhyme_scheme(lyrics_text, scheme)
        assert len(groups) == 2

        # Count syllables
        for lines in groups.values():
            for line in lines:
                syllables = count_syllables(line)
                assert syllables > 0

    @pytest.mark.asyncio
    async def test_explicit_content_workflow(self):
        """Test explicit content checking workflow."""
        # Check clean text
        clean_text = "This is a beautiful love song"
        is_clean, violations = await check_explicit_content(clean_text)
        assert is_clean
        assert len(violations) == 0

        # Check explicit text (not allowed)
        explicit_text = "This song has shit in it"
        is_clean, violations = await check_explicit_content(explicit_text, explicit_allowed=False)
        assert not is_clean
        assert len(violations) > 0

        # Check explicit text (allowed)
        is_clean, violations = await check_explicit_content(explicit_text, explicit_allowed=True)
        assert is_clean
