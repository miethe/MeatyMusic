"""Unit tests for LyricsDefaultGenerator."""

import pytest
from typing import Any, Dict, List

from app.services.default_generators.lyrics_generator import (
    LyricsDefaultGenerator,
    DEFAULT_SECTION_ORDER,
    GENRE_SECTION_PATTERNS
)


class TestLyricsDefaultGenerator:
    """Test suite for lyrics default generator service."""

    @pytest.fixture
    def generator(self):
        """Create LyricsDefaultGenerator instance."""
        return LyricsDefaultGenerator()

    @pytest.fixture
    def pop_blueprint(self):
        """Sample Pop blueprint (BlueprintReaderService format)."""
        return {
            "genre": "Pop",
            "required_sections": ["Verse", "Chorus", "Bridge"],
            "section_lines": {
                "Verse": {"min_lines": 4, "max_lines": 8},
                "Chorus": {"min_lines": 4, "max_lines": 6},
                "Bridge": {"min_lines": 4, "max_lines": 8}
            },
            "tempo_bpm": [100, 120]
        }

    @pytest.fixture
    def christmas_blueprint(self):
        """Sample Christmas Pop blueprint (BlueprintReaderService format)."""
        return {
            "genre": "Christmas Pop",
            "required_sections": ["Intro", "Verse", "Chorus", "Bridge", "Outro"],
            "section_lines": {
                "Intro": {"min_lines": 2, "max_lines": 4},
                "Verse": {"min_lines": 6, "max_lines": 10},
                "Chorus": {"min_lines": 4, "max_lines": 8, "must_end_with_hook": True},
                "Bridge": {"min_lines": 4, "max_lines": 6},
                "Outro": {"min_lines": 2, "max_lines": 4}
            }
        }

    @pytest.fixture
    def hiphop_blueprint(self):
        """Sample Hip-Hop blueprint (BlueprintReaderService format)."""
        return {
            "genre": "Hip-Hop",
            "required_sections": ["Verse", "Chorus"],
            "section_lines": {
                "Verse": {"min_lines": 8, "max_lines": 16},
                "Chorus": {"min_lines": 4, "max_lines": 8}
            }
        }

    # Test: Default Generation

    def test_generate_default_lyrics_pop(self, generator, pop_blueprint):
        """Test default lyrics generation for Pop genre."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Check required fields
        assert result["language"] == "en"
        assert result["pov"] == "first-person"
        assert result["tense"] == "present"
        assert result["themes"] == []
        assert result["rhyme_scheme"] == "AABB"
        assert result["meter"] == "4/4 pop"
        assert result["syllables_per_line"] == 8
        assert result["hook_strategy"] == "repetition"
        assert isinstance(result["repetition_rules"], dict)
        assert result["repetition_rules"]["hook_count"] == 3
        assert result["repetition_rules"]["allow_verbatim"] is True
        assert result["repetition_rules"]["max_repeat"] == 4
        assert result["imagery_density"] == 5  # 0-10 scale
        assert result["reading_level"] == 80  # 0-100 scale
        assert result["source_citations"] == []
        assert result["sections"] == []
        assert result["explicit_allowed"] is False

        # Check section order includes required sections
        assert "Verse" in result["section_order"]
        assert "Chorus" in result["section_order"]
        assert "Bridge" in result["section_order"]

        # Check constraints
        assert result["constraints"]["explicit"] is False
        assert result["constraints"]["max_lines"] == 120
        assert "Verse" in result["constraints"]["section_requirements"]
        assert result["constraints"]["section_requirements"]["Verse"]["min_lines"] == 4
        assert result["constraints"]["section_requirements"]["Verse"]["max_lines"] == 8

    def test_generate_default_lyrics_christmas(self, generator, christmas_blueprint):
        """Test default lyrics generation for Christmas Pop genre."""
        result = generator.generate_default_lyrics(christmas_blueprint)

        # Check section order matches blueprint required sections
        assert "Intro" in result["section_order"]
        assert "Verse" in result["section_order"]
        assert "Chorus" in result["section_order"]
        assert "Bridge" in result["section_order"]
        assert "Outro" in result["section_order"]

        # Check section requirements from blueprint
        section_reqs = result["constraints"]["section_requirements"]
        assert section_reqs["Chorus"].get("must_end_with_hook") is True

    def test_generate_default_lyrics_hiphop(self, generator, hiphop_blueprint):
        """Test default lyrics generation for Hip-Hop genre."""
        result = generator.generate_default_lyrics(hiphop_blueprint)

        # Check Hip-Hop specific section requirements
        section_reqs = result["constraints"]["section_requirements"]
        assert section_reqs["Verse"]["min_lines"] == 8
        assert section_reqs["Verse"]["max_lines"] == 16

    # Test: Partial Lyrics Preservation

    def test_partial_lyrics_preserved(self, generator, pop_blueprint):
        """Test that user-provided fields are preserved."""
        partial_lyrics = {
            "language": "es",
            "pov": "third-person",
            "tense": "past",
            "themes": ["heartbreak", "redemption"],
            "rhyme_scheme": "ABAB",
            "meter": "6/8 ballad",
            "syllables_per_line": 10,
            "hook_strategy": "melodic",
            "repetition_rules": {
                "hook_count": 5,
                "allow_verbatim": False,
                "max_repeat": 2
            },
            "imagery_density": 8,
            "reading_level": 90,
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        # All user-provided values should be preserved
        assert result["language"] == "es"
        assert result["pov"] == "third-person"
        assert result["tense"] == "past"
        assert result["themes"] == ["heartbreak", "redemption"]
        assert result["rhyme_scheme"] == "ABAB"
        assert result["meter"] == "6/8 ballad"
        assert result["syllables_per_line"] == 10
        assert result["hook_strategy"] == "melodic"
        assert result["repetition_rules"]["hook_count"] == 5
        assert result["repetition_rules"]["allow_verbatim"] is False
        assert result["repetition_rules"]["max_repeat"] == 2
        assert result["imagery_density"] == 8
        assert result["reading_level"] == 90

    def test_partial_section_order_preserved(self, generator, pop_blueprint):
        """Test that user-provided section_order is preserved."""
        partial_lyrics = {
            "section_order": ["Verse", "Chorus", "Verse", "Chorus", "Outro"]
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        assert result["section_order"] == ["Verse", "Chorus", "Verse", "Chorus", "Outro"]

    def test_partial_constraints_preserved(self, generator, pop_blueprint):
        """Test that user-provided constraints are preserved."""
        partial_lyrics = {
            "constraints": {
                "explicit": True,
                "max_lines": 100,
                "section_requirements": {
                    "Verse": {"min_lines": 6, "max_lines": 10}
                }
            }
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        assert result["constraints"]["explicit"] is True
        assert result["constraints"]["max_lines"] == 100
        assert result["constraints"]["section_requirements"]["Verse"]["min_lines"] == 6

    def test_partial_source_citations_preserved(self, generator, pop_blueprint):
        """Test that user-provided source_citations are preserved."""
        partial_lyrics = {
            "source_citations": [
                {"source_id": "src-123", "weight": 0.8},
                {"source_id": "src-456", "weight": 0.2}
            ]
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        assert len(result["source_citations"]) == 2
        assert result["source_citations"][0]["source_id"] == "src-123"
        assert result["source_citations"][1]["weight"] == 0.2

    def test_partial_sections_preserved(self, generator, pop_blueprint):
        """Test that user-provided sections are preserved."""
        partial_lyrics = {
            "sections": [
                {"type": "Verse", "lines": 8, "rhyme_scheme": "ABAB"},
                {"type": "Chorus", "lines": 4, "rhyme_scheme": "AABB"}
            ]
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        assert len(result["sections"]) == 2
        assert result["sections"][0]["type"] == "Verse"
        assert result["sections"][1]["type"] == "Chorus"

    def test_partial_explicit_allowed_preserved(self, generator, pop_blueprint):
        """Test that user-provided explicit_allowed is preserved."""
        partial_lyrics = {
            "explicit_allowed": True
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        assert result["explicit_allowed"] is True

    # Test: Section Order Algorithm

    def test_section_order_with_required_sections(self, generator, pop_blueprint):
        """Test section order filters to blueprint required sections."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Should include required sections in standard order
        section_order = result["section_order"]

        # Check that required sections are present
        assert "Verse" in section_order
        assert "Chorus" in section_order
        assert "Bridge" in section_order

        # Check order is maintained from genre pattern
        verse_indices = [i for i, s in enumerate(section_order) if s == "Verse"]
        chorus_indices = [i for i, s in enumerate(section_order) if s == "Chorus"]

        # First Verse should come before first Chorus (per pop pattern)
        if verse_indices and chorus_indices:
            assert verse_indices[0] < chorus_indices[0]

    def test_section_order_without_required_sections(self, generator):
        """Test section order uses genre pattern when no required sections."""
        blueprint = {
            "genre": "Pop"
        }

        result = generator.generate_default_lyrics(blueprint)

        # Should use Pop genre pattern
        assert result["section_order"] == GENRE_SECTION_PATTERNS["Pop"]

    def test_section_order_hiphop_pattern(self, generator):
        """Test Hip-Hop uses genre-specific section pattern."""
        blueprint = {
            "genre": "Hip-Hop"
        }

        result = generator.generate_default_lyrics(blueprint)

        # Should use Hip-Hop genre pattern with 3 verses
        section_order = result["section_order"]
        assert section_order == GENRE_SECTION_PATTERNS["Hip-Hop"]
        # Hip-Hop pattern has 3 verses
        assert section_order.count("Verse") == 3

    def test_section_order_rock_pattern(self, generator):
        """Test Rock uses genre-specific section pattern with Solo."""
        blueprint = {
            "genre": "Rock"
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]
        assert section_order == GENRE_SECTION_PATTERNS["Rock"]
        # Rock pattern includes Solo
        assert "Solo" in section_order

    def test_section_order_with_custom_section(self, generator):
        """Test section order includes custom sections not in genre pattern."""
        blueprint = {
            "genre": "Pop",
            "required_sections": ["Verse", "PreChorus", "Chorus", "CustomSection"]
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]

        # Should include all required sections
        assert "Verse" in section_order
        assert "PreChorus" in section_order
        assert "Chorus" in section_order
        assert "CustomSection" in section_order

        # PreChorus should be inserted before Chorus
        prechorus_idx = section_order.index("PreChorus")
        chorus_idx = section_order.index("Chorus")
        assert prechorus_idx < chorus_idx

    def test_section_order_empty_required_sections_fallback(self, generator):
        """Test section order falls back to genre pattern when required_sections is empty."""
        blueprint = {
            "genre": "Pop",
            "required_sections": []
        }

        result = generator.generate_default_lyrics(blueprint)

        # Should fall back to Pop genre pattern
        assert result["section_order"] == GENRE_SECTION_PATTERNS["Pop"]

    def test_section_order_intro_outro_positioning(self, generator):
        """Test Intro and Outro are positioned correctly when added."""
        blueprint = {
            "genre": "Pop",
            "required_sections": ["CustomIntro", "Verse", "Chorus", "CustomOutro"]
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]

        # CustomIntro should be at start if not in pattern
        # CustomOutro should be at end if not in pattern
        # This tests the smart insertion logic
        assert "CustomIntro" in section_order
        assert "Verse" in section_order
        assert "Chorus" in section_order
        assert "CustomOutro" in section_order

    # Test: Constraints Generation

    def test_constraints_default_values(self, generator, pop_blueprint):
        """Test default constraint values."""
        result = generator.generate_default_lyrics(pop_blueprint)

        constraints = result["constraints"]
        assert constraints["explicit"] is False
        assert constraints["max_lines"] == 120
        assert isinstance(constraints["section_requirements"], dict)

    def test_constraints_from_blueprint_section_lines(self, generator, pop_blueprint):
        """Test section_requirements comes from blueprint section_lines."""
        result = generator.generate_default_lyrics(pop_blueprint)

        section_reqs = result["constraints"]["section_requirements"]

        # Should match blueprint section_lines
        assert section_reqs["Verse"]["min_lines"] == 4
        assert section_reqs["Verse"]["max_lines"] == 8
        assert section_reqs["Chorus"]["min_lines"] == 4
        assert section_reqs["Chorus"]["max_lines"] == 6

    def test_constraints_empty_when_no_section_lines(self, generator):
        """Test section_requirements is empty when blueprint has no section_lines."""
        blueprint = {
            "genre": "Pop"
        }

        result = generator.generate_default_lyrics(blueprint)

        assert result["constraints"]["section_requirements"] == {}

    def test_constraints_partial_override(self, generator, pop_blueprint):
        """Test partial constraints override blueprint values."""
        partial_lyrics = {
            "constraints": {
                "max_lines": 80
            }
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        # User max_lines should override
        assert result["constraints"]["max_lines"] == 80

        # But other defaults should still apply
        assert result["constraints"]["explicit"] is False

    # Test: Repetition Rules

    def test_repetition_rules_defaults(self, generator, pop_blueprint):
        """Test default repetition rules."""
        result = generator.generate_default_lyrics(pop_blueprint)

        rules = result["repetition_rules"]
        assert rules["hook_count"] == 3
        assert rules["allow_verbatim"] is True
        assert rules["max_repeat"] == 4

    def test_repetition_rules_partial_merge(self, generator, pop_blueprint):
        """Test partial repetition rules merge with defaults."""
        partial_lyrics = {
            "repetition_rules": {
                "hook_count": 5
            }
        }

        result = generator.generate_default_lyrics(pop_blueprint, partial_lyrics)

        rules = result["repetition_rules"]
        assert rules["hook_count"] == 5  # User override
        assert rules["allow_verbatim"] is True  # Default
        assert rules["max_repeat"] == 4  # Default

    # Test: Determinism

    def test_determinism_same_input_same_output(self, generator, pop_blueprint):
        """Test that same inputs produce same outputs (determinism)."""
        result1 = generator.generate_default_lyrics(pop_blueprint)
        result2 = generator.generate_default_lyrics(pop_blueprint)

        assert result1 == result2

    def test_determinism_with_partial_lyrics(self, generator, pop_blueprint):
        """Test determinism with partial lyrics."""
        partial = {
            "language": "fr",
            "themes": ["love", "loss"]
        }

        result1 = generator.generate_default_lyrics(pop_blueprint, partial)
        result2 = generator.generate_default_lyrics(pop_blueprint, partial)

        assert result1 == result2

    def test_determinism_section_order(self, generator, pop_blueprint):
        """Test section order is deterministic."""
        results = [
            generator.generate_default_lyrics(pop_blueprint)
            for _ in range(10)
        ]

        # All section orders should be identical
        first_order = results[0]["section_order"]
        for result in results[1:]:
            assert result["section_order"] == first_order

    # Test: Error Handling

    def test_error_when_blueprint_missing(self, generator):
        """Test error when blueprint is None."""
        with pytest.raises(ValueError, match="Blueprint is required"):
            generator.generate_default_lyrics(None)

    def test_error_when_blueprint_empty(self, generator):
        """Test error when blueprint is empty dict."""
        with pytest.raises(ValueError, match="Blueprint is required"):
            generator.generate_default_lyrics({})

    def test_error_when_genre_missing(self, generator):
        """Test error when genre is missing from blueprint."""
        blueprint = {
            "required_sections": []
        }

        with pytest.raises(ValueError, match="genre"):
            generator.generate_default_lyrics(blueprint)

    # Test: All Field Combinations

    def test_all_required_fields_present(self, generator, pop_blueprint):
        """Test that all required schema fields are present in output."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Required fields per schema
        required_fields = [
            "language", "section_order", "sections",
            "constraints", "explicit_allowed"
        ]
        for field in required_fields:
            assert field in result

    def test_all_optional_fields_have_defaults(self, generator, pop_blueprint):
        """Test that all optional fields have sensible defaults."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Optional fields that should have defaults
        optional_fields = [
            "pov", "tense", "themes", "rhyme_scheme", "meter",
            "syllables_per_line", "hook_strategy", "repetition_rules",
            "imagery_density", "reading_level", "source_citations"
        ]

        for field in optional_fields:
            assert field in result
            assert result[field] is not None

    def test_field_types_match_schema(self, generator, pop_blueprint):
        """Test that field types match schema requirements."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # String fields
        assert isinstance(result["language"], str)
        assert isinstance(result["pov"], str)
        assert isinstance(result["tense"], str)
        assert isinstance(result["rhyme_scheme"], str)
        assert isinstance(result["meter"], str)
        assert isinstance(result["hook_strategy"], str)

        # Integer fields
        assert isinstance(result["syllables_per_line"], int)
        assert isinstance(result["imagery_density"], int)
        assert isinstance(result["reading_level"], int)

        # Boolean field
        assert isinstance(result["explicit_allowed"], bool)

        # Array fields
        assert isinstance(result["themes"], list)
        assert isinstance(result["section_order"], list)
        assert isinstance(result["sections"], list)
        assert isinstance(result["source_citations"], list)

        # Object fields
        assert isinstance(result["constraints"], dict)
        assert isinstance(result["repetition_rules"], dict)

    def test_language_code_format(self, generator, pop_blueprint):
        """Test that language follows ISO 639-1 format (2 chars)."""
        result = generator.generate_default_lyrics(pop_blueprint)

        assert len(result["language"]) == 2
        assert result["language"].islower()

    def test_pov_enum_values(self, generator, pop_blueprint):
        """Test POV is valid enum value."""
        result = generator.generate_default_lyrics(pop_blueprint)

        valid_pov = ["first-person", "second-person", "third-person"]
        assert result["pov"] in valid_pov

    def test_tense_enum_values(self, generator, pop_blueprint):
        """Test tense is valid enum value."""
        result = generator.generate_default_lyrics(pop_blueprint)

        valid_tense = ["past", "present", "future", "mixed"]
        assert result["tense"] in valid_tense

    def test_hook_strategy_enum_values(self, generator, pop_blueprint):
        """Test hook_strategy is valid enum value."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Per task requirements and HookStrategy enum
        valid_hook_strategy = ["repetition", "chant", "call-response", "melodic"]
        assert result["hook_strategy"] in valid_hook_strategy

    def test_syllables_per_line_range(self, generator, pop_blueprint):
        """Test syllables_per_line is within valid range."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Per schema: minimum 4, maximum 16
        assert 4 <= result["syllables_per_line"] <= 16

    def test_imagery_density_range(self, generator, pop_blueprint):
        """Test imagery_density is within valid range."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Per schema: minimum 0, maximum 10
        assert 0 <= result["imagery_density"] <= 10

    def test_reading_level_range(self, generator, pop_blueprint):
        """Test reading_level is within valid range."""
        result = generator.generate_default_lyrics(pop_blueprint)

        # Per schema: minimum 0, maximum 100
        assert 0 <= result["reading_level"] <= 100

    # Test: Multiple Genres

    def test_multiple_genres_consistency(self, generator):
        """Test default generation works consistently across genres."""
        genres = ["Pop", "Rock", "Hip-Hop", "Country", "Electronic", "Indie"]

        for genre in genres:
            blueprint = {
                "genre": genre
            }

            result = generator.generate_default_lyrics(blueprint)

            # All should have consistent base defaults
            assert result["language"] == "en"
            assert result["pov"] == "first-person"
            assert result["tense"] == "present"
            assert result["rhyme_scheme"] == "AABB"
            assert result["syllables_per_line"] == 8

    def test_genre_specific_section_patterns(self, generator):
        """Test genre-specific section patterns are used."""
        # Pop uses standard pattern with Bridge
        pop_result = generator.generate_default_lyrics({"genre": "Pop"})
        assert "Bridge" in pop_result["section_order"]

        # Hip-Hop uses pattern with 3 verses
        hiphop_result = generator.generate_default_lyrics({"genre": "Hip-Hop"})
        assert hiphop_result["section_order"].count("Verse") == 3

        # Rock uses pattern with Solo
        rock_result = generator.generate_default_lyrics({"genre": "Rock"})
        assert "Solo" in rock_result["section_order"]

    # Test: Edge Cases for Full Coverage

    def test_section_order_with_lowercase_intro(self, generator):
        """Test section order handles lowercase 'intro' correctly."""
        blueprint = {
            "genre": "Pop",
            "required_sections": ["introduction", "Verse", "Chorus"]
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]

        # 'introduction' should be inserted at the start
        assert "introduction" in section_order
        assert section_order[0] == "introduction"

    def test_section_order_with_lowercase_outro(self, generator):
        """Test section order handles lowercase 'outro', 'ending', 'coda' correctly."""
        blueprint = {
            "genre": "Pop",
            "required_sections": ["Verse", "Chorus", "ending"]
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]

        # 'ending' should be appended at the end
        assert "ending" in section_order
        assert section_order[-1] == "ending"

    def test_section_order_custom_section_with_empty_order(self, generator):
        """Test custom section insertion when section_order would be empty initially."""
        blueprint = {
            "genre": "Pop",
            "required_sections": ["CustomSection1", "CustomSection2"]
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]

        # Both custom sections should be included
        assert "CustomSection1" in section_order
        assert "CustomSection2" in section_order

    def test_section_order_fallback_for_no_matching_sections(self, generator):
        """Test fallback to default when required sections don't match any in pattern."""
        # This test covers the edge case where all required sections are custom
        # and none exist in the base pattern, resulting in empty section_order
        # before the fallback logic kicks in
        blueprint = {
            "genre": "Unknown Genre",  # Genre not in GENRE_SECTION_PATTERNS
            "required_sections": ["CustomSection"]
        }

        result = generator.generate_default_lyrics(blueprint)

        section_order = result["section_order"]

        # Should include CustomSection
        assert "CustomSection" in section_order
