"""Unit tests for ProducerDefaultGenerator.

Tests cover:
- Default generation with various section orders
- Structure derivation from lyrics
- Section metadata for all section types
- Partial producer notes preservation
- Determinism of default generation
"""

import pytest
from app.services.default_generators.producer_generator import ProducerDefaultGenerator


class TestProducerDefaultGenerator:
    """Test suite for ProducerDefaultGenerator."""

    @pytest.fixture
    def generator(self):
        """Create a ProducerDefaultGenerator instance."""
        return ProducerDefaultGenerator()

    @pytest.fixture
    def minimal_blueprint(self):
        """Minimal blueprint for testing."""
        return {
            "genre": "Pop",
            "version": "2025.11",
        }

    @pytest.fixture
    def minimal_style(self):
        """Minimal style for testing."""
        return {
            "genre_detail": {"primary": "Pop"},
            "tempo_bpm": [120, 128],
        }

    @pytest.fixture
    def minimal_lyrics(self):
        """Minimal lyrics with standard section order."""
        return {
            "language": "en",
            "section_order": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
            "constraints": {"explicit": False},
        }

    @pytest.fixture
    def christmas_pop_style(self):
        """Christmas Pop style with instrumentation."""
        return {
            "genre_detail": {
                "primary": "Christmas Pop",
                "subgenres": ["Big Band Pop"],
                "fusions": ["Electro Swing"],
            },
            "tempo_bpm": [116, 124],
            "instrumentation": ["brass", "upright bass", "handclaps", "sleigh bells"],
        }

    @pytest.fixture
    def christmas_pop_lyrics(self):
        """Christmas Pop lyrics with PreChorus."""
        return {
            "language": "en",
            "section_order": [
                "Intro",
                "Verse",
                "PreChorus",
                "Chorus",
                "Verse",
                "PreChorus",
                "Chorus",
                "Bridge",
                "Chorus",
            ],
            "constraints": {"explicit": False},
        }

    # ====================
    # Complete Generation Tests
    # ====================

    def test_generate_default_producer_notes_minimal(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test default generation with minimal inputs."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
        )

        # Verify all required fields present
        assert "structure" in result
        assert "hooks" in result
        assert "instrumentation" in result
        assert "section_meta" in result
        assert "mix" in result

        # Verify types
        assert isinstance(result["structure"], str)
        assert isinstance(result["hooks"], int)
        assert isinstance(result["instrumentation"], list)
        assert isinstance(result["section_meta"], dict)
        assert isinstance(result["mix"], dict)

    def test_generate_default_producer_notes_christmas_pop(
        self, generator, minimal_blueprint, christmas_pop_style, christmas_pop_lyrics
    ):
        """Test default generation with Christmas Pop inputs."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=christmas_pop_style,
            lyrics=christmas_pop_lyrics,
        )

        # Verify structure includes all sections
        expected_structure = "Intro-Verse-PreChorus-Chorus-Verse-PreChorus-Chorus-Bridge-Chorus"
        assert result["structure"] == expected_structure

        # Verify instrumentation copied from style
        assert result["instrumentation"] == christmas_pop_style["instrumentation"]

        # Verify section_meta includes all unique sections
        unique_sections = ["Intro", "Verse", "PreChorus", "Chorus", "Bridge"]
        assert set(result["section_meta"].keys()) == set(unique_sections)

    # ====================
    # Structure Generation Tests
    # ====================

    def test_structure_from_lyrics_section_order(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test structure is derived from lyrics section_order."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
        )

        expected = "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        assert result["structure"] == expected

    def test_structure_with_simple_section_order(
        self, generator, minimal_blueprint, minimal_style
    ):
        """Test structure with simple section order."""
        lyrics = {
            "language": "en",
            "section_order": ["Verse", "Chorus", "Verse", "Chorus"],
            "constraints": {},
        }

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        assert result["structure"] == "Verse-Chorus-Verse-Chorus"

    def test_structure_with_empty_section_order(
        self, generator, minimal_blueprint, minimal_style
    ):
        """Test structure fallback when section_order is empty."""
        lyrics = {
            "language": "en",
            "section_order": [],
            "constraints": {},
        }

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        # Should use standard pop fallback
        expected_fallback = "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        assert result["structure"] == expected_fallback

    # ====================
    # Section Metadata Tests
    # ====================

    def test_section_meta_for_intro(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for Intro."""
        lyrics = {"section_order": ["Intro", "Verse", "Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        intro_meta = result["section_meta"]["Intro"]
        assert intro_meta["tags"] == ["instrumental", "build"]
        assert intro_meta["target_duration_sec"] == 10

    def test_section_meta_for_verse(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for Verse."""
        lyrics = {"section_order": ["Verse", "Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        verse_meta = result["section_meta"]["Verse"]
        assert verse_meta["tags"] == ["storytelling"]
        assert verse_meta["target_duration_sec"] == 30

    def test_section_meta_for_prechorus(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for PreChorus."""
        lyrics = {"section_order": ["Verse", "PreChorus", "Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        prechorus_meta = result["section_meta"]["PreChorus"]
        assert prechorus_meta["tags"] == ["build"]
        assert prechorus_meta["target_duration_sec"] == 15

    def test_section_meta_for_chorus(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for Chorus."""
        lyrics = {"section_order": ["Verse", "Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        chorus_meta = result["section_meta"]["Chorus"]
        assert chorus_meta["tags"] == ["anthemic", "hook-forward"]
        assert chorus_meta["target_duration_sec"] == 25

    def test_section_meta_for_bridge(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for Bridge."""
        lyrics = {"section_order": ["Verse", "Chorus", "Bridge", "Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        bridge_meta = result["section_meta"]["Bridge"]
        assert bridge_meta["tags"] == ["contrast", "dynamic"]
        assert bridge_meta["target_duration_sec"] == 20

    def test_section_meta_for_outro(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for Outro."""
        lyrics = {"section_order": ["Verse", "Chorus", "Outro"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        outro_meta = result["section_meta"]["Outro"]
        assert outro_meta["tags"] == ["fade-out"]
        assert outro_meta["target_duration_sec"] == 10

    def test_section_meta_for_unknown_section(self, generator, minimal_blueprint, minimal_style):
        """Test section_meta defaults for unknown section type."""
        lyrics = {"section_order": ["CustomSection", "Verse", "Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        custom_meta = result["section_meta"]["CustomSection"]
        assert custom_meta["tags"] == []  # Empty for unknown
        assert custom_meta["target_duration_sec"] == 20  # Fallback

    def test_section_meta_only_includes_unique_sections(
        self, generator, minimal_blueprint, minimal_style
    ):
        """Test section_meta only includes unique sections (no duplicates)."""
        lyrics = {
            "section_order": ["Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
            "constraints": {},
        }

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        # Should only have 3 unique sections
        assert set(result["section_meta"].keys()) == {"Verse", "Chorus", "Bridge"}
        assert len(result["section_meta"]) == 3

    # ====================
    # Hooks Tests
    # ====================

    def test_hooks_default_value(self, generator, minimal_blueprint, minimal_style, minimal_lyrics):
        """Test hooks defaults to 2 (standard for pop)."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
        )

        assert result["hooks"] == 2

    # ====================
    # Instrumentation Tests
    # ====================

    def test_instrumentation_from_style(
        self, generator, minimal_blueprint, christmas_pop_style, minimal_lyrics
    ):
        """Test instrumentation is copied from style."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=christmas_pop_style,
            lyrics=minimal_lyrics,
        )

        assert result["instrumentation"] == christmas_pop_style["instrumentation"]

    def test_instrumentation_empty_when_not_in_style(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test instrumentation defaults to empty list when not in style."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
        )

        assert result["instrumentation"] == []

    # ====================
    # Mix Targets Tests
    # ====================

    def test_mix_defaults(self, generator, minimal_blueprint, minimal_style, minimal_lyrics):
        """Test mix targets use streaming standards."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
        )

        assert result["mix"]["lufs"] == -14.0
        assert result["mix"]["space"] == "balanced"
        assert result["mix"]["stereo_width"] == "normal"

    # ====================
    # Partial Producer Notes Tests
    # ====================

    def test_partial_producer_preserves_structure(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test partial producer structure is preserved."""
        partial = {"structure": "Custom-Structure-String"}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=partial,
        )

        assert result["structure"] == "Custom-Structure-String"

    def test_partial_producer_preserves_hooks(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test partial producer hooks are preserved."""
        partial = {"hooks": 5}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=partial,
        )

        assert result["hooks"] == 5

    def test_partial_producer_preserves_instrumentation(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test partial producer instrumentation is preserved."""
        partial = {"instrumentation": ["custom", "instruments"]}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=partial,
        )

        assert result["instrumentation"] == ["custom", "instruments"]

    def test_partial_producer_preserves_section_meta(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test partial producer section_meta is preserved."""
        partial = {
            "section_meta": {
                "Intro": {"tags": ["custom"], "target_duration_sec": 5},
                "Verse": {"tags": ["epic"], "target_duration_sec": 45},
            }
        }

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=partial,
        )

        assert result["section_meta"] == partial["section_meta"]

    def test_partial_producer_preserves_mix(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test partial producer mix is preserved."""
        partial = {"mix": {"lufs": -12.0, "space": "dry", "stereo_width": "wide"}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=partial,
        )

        assert result["mix"]["lufs"] == -12.0
        assert result["mix"]["space"] == "dry"
        assert result["mix"]["stereo_width"] == "wide"

    def test_partial_producer_partial_mix(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test partial producer with only some mix fields."""
        partial = {"mix": {"lufs": -16.0}}  # Only lufs provided

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=partial,
        )

        # User lufs preserved, others use defaults
        assert result["mix"]["lufs"] == -16.0
        assert result["mix"]["space"] == "balanced"
        assert result["mix"]["stereo_width"] == "normal"

    # ====================
    # Determinism Tests
    # ====================

    def test_deterministic_generation(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test that generation is deterministic across multiple runs."""
        # Generate 10 times with same inputs
        results = [
            generator.generate_default_producer_notes(
                blueprint=minimal_blueprint,
                style=minimal_style,
                lyrics=minimal_lyrics,
            )
            for _ in range(10)
        ]

        # All results should be identical
        first_result = results[0]
        for result in results[1:]:
            assert result == first_result

    def test_deterministic_section_meta_order(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test that section_meta order is deterministic."""
        # Generate multiple times
        results = [
            generator.generate_default_producer_notes(
                blueprint=minimal_blueprint,
                style=minimal_style,
                lyrics=minimal_lyrics,
            )
            for _ in range(5)
        ]

        # Section keys should be in same order
        first_keys = list(results[0]["section_meta"].keys())
        for result in results[1:]:
            assert list(result["section_meta"].keys()) == first_keys

    # ====================
    # Helper Method Tests
    # ====================

    def test_get_default_section_tags_intro(self):
        """Test get_default_section_tags for Intro."""
        tags = ProducerDefaultGenerator.get_default_section_tags("Intro")
        assert tags == ["instrumental", "build"]

    def test_get_default_section_tags_verse(self):
        """Test get_default_section_tags for Verse."""
        tags = ProducerDefaultGenerator.get_default_section_tags("Verse")
        assert tags == ["storytelling"]

    def test_get_default_section_tags_prechorus(self):
        """Test get_default_section_tags for PreChorus."""
        tags = ProducerDefaultGenerator.get_default_section_tags("PreChorus")
        assert tags == ["build"]

    def test_get_default_section_tags_chorus(self):
        """Test get_default_section_tags for Chorus."""
        tags = ProducerDefaultGenerator.get_default_section_tags("Chorus")
        assert tags == ["anthemic", "hook-forward"]

    def test_get_default_section_tags_bridge(self):
        """Test get_default_section_tags for Bridge."""
        tags = ProducerDefaultGenerator.get_default_section_tags("Bridge")
        assert tags == ["contrast", "dynamic"]

    def test_get_default_section_tags_outro(self):
        """Test get_default_section_tags for Outro."""
        tags = ProducerDefaultGenerator.get_default_section_tags("Outro")
        assert tags == ["fade-out"]

    def test_get_default_section_tags_unknown(self):
        """Test get_default_section_tags for unknown section."""
        tags = ProducerDefaultGenerator.get_default_section_tags("UnknownSection")
        assert tags == []

    def test_get_default_section_duration_intro(self):
        """Test get_default_section_duration for Intro."""
        duration = ProducerDefaultGenerator.get_default_section_duration("Intro")
        assert duration == 10

    def test_get_default_section_duration_verse(self):
        """Test get_default_section_duration for Verse."""
        duration = ProducerDefaultGenerator.get_default_section_duration("Verse")
        assert duration == 30

    def test_get_default_section_duration_prechorus(self):
        """Test get_default_section_duration for PreChorus."""
        duration = ProducerDefaultGenerator.get_default_section_duration("PreChorus")
        assert duration == 15

    def test_get_default_section_duration_chorus(self):
        """Test get_default_section_duration for Chorus."""
        duration = ProducerDefaultGenerator.get_default_section_duration("Chorus")
        assert duration == 25

    def test_get_default_section_duration_bridge(self):
        """Test get_default_section_duration for Bridge."""
        duration = ProducerDefaultGenerator.get_default_section_duration("Bridge")
        assert duration == 20

    def test_get_default_section_duration_outro(self):
        """Test get_default_section_duration for Outro."""
        duration = ProducerDefaultGenerator.get_default_section_duration("Outro")
        assert duration == 10

    def test_get_default_section_duration_unknown(self):
        """Test get_default_section_duration for unknown section."""
        duration = ProducerDefaultGenerator.get_default_section_duration("UnknownSection")
        assert duration == 20  # Fallback

    # ====================
    # Edge Cases
    # ====================

    def test_none_partial_producer(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test that None partial_producer is handled correctly."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer=None,
        )

        # Should generate all defaults
        assert result["structure"] == "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        assert result["hooks"] == 2
        assert result["mix"]["lufs"] == -14.0

    def test_empty_partial_producer(
        self, generator, minimal_blueprint, minimal_style, minimal_lyrics
    ):
        """Test that empty dict partial_producer is handled correctly."""
        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=minimal_lyrics,
            partial_producer={},
        )

        # Should generate all defaults
        assert result["structure"] == "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        assert result["hooks"] == 2
        assert result["mix"]["lufs"] == -14.0

    def test_style_without_instrumentation(
        self, generator, minimal_blueprint, minimal_lyrics
    ):
        """Test style without instrumentation field."""
        style = {
            "genre_detail": {"primary": "Pop"},
            "tempo_bpm": [120, 128],
            # No instrumentation field
        }

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=style,
            lyrics=minimal_lyrics,
        )

        assert result["instrumentation"] == []

    def test_lyrics_with_single_section(
        self, generator, minimal_blueprint, minimal_style
    ):
        """Test lyrics with only one section."""
        lyrics = {"section_order": ["Chorus"], "constraints": {}}

        result = generator.generate_default_producer_notes(
            blueprint=minimal_blueprint,
            style=minimal_style,
            lyrics=lyrics,
        )

        assert result["structure"] == "Chorus"
        assert len(result["section_meta"]) == 1
        assert "Chorus" in result["section_meta"]
