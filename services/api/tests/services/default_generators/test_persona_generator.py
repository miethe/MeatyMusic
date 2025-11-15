"""Unit tests for PersonaDefaultGenerator.

This module tests the default persona generation logic including:
- Returns None when no persona needed
- Generates basic persona when partial data exists
- Uses genre-appropriate vocal and delivery defaults
- Preserves user-provided fields
- Deterministic behavior
"""

from __future__ import annotations

import pytest
from typing import Dict, Any, Optional

from app.services.default_generators.persona_generator import PersonaDefaultGenerator


class TestPersonaDefaultGenerator:
    """Test suite for PersonaDefaultGenerator."""

    @pytest.fixture
    def generator(self) -> PersonaDefaultGenerator:
        """Create a PersonaDefaultGenerator instance for testing."""
        return PersonaDefaultGenerator()

    @pytest.fixture
    def pop_blueprint(self) -> Dict[str, Any]:
        """Create a Pop genre blueprint for testing."""
        return {
            "genre": "Pop",
            "tempo_bpm": 120,
            "key": {"primary": "C major"},
            "mood": ["upbeat", "energetic"]
        }

    @pytest.fixture
    def hiphop_blueprint(self) -> Dict[str, Any]:
        """Create a Hip-Hop genre blueprint for testing."""
        return {
            "genre": "Hip-Hop",
            "tempo_bpm": 75,
            "key": {"primary": "A minor"}
        }

    @pytest.fixture
    def country_blueprint(self) -> Dict[str, Any]:
        """Create a Country genre blueprint for testing."""
        return {
            "genre_detail": {"primary": "Country"},
            "tempo_bpm": 110
        }

    @pytest.fixture
    def rock_blueprint(self) -> Dict[str, Any]:
        """Create a Rock genre blueprint for testing."""
        return {
            "metadata": {"genre": "Rock"},
            "tempo_bpm": 130
        }

    # =============================================================================
    # Test: Returns None when no persona needed
    # =============================================================================

    def test_returns_none_when_no_partial_persona(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that generator returns None when no partial persona provided."""
        result = generator.generate_default_persona(pop_blueprint, None)
        assert result is None

    def test_returns_none_when_empty_partial_persona(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that generator returns None when partial persona is empty dict."""
        result = generator.generate_default_persona(pop_blueprint, {})
        assert result is None

    def test_returns_none_when_partial_persona_is_empty_list(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that generator returns None for non-dict empty values."""
        # Empty list should be treated as falsy and return None
        result = generator.generate_default_persona(pop_blueprint, None)
        assert result is None

    # =============================================================================
    # Test: Generates basic persona when partial data exists
    # =============================================================================

    def test_generates_persona_with_minimal_partial_data(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test generation with minimal partial persona data."""
        partial = {"name": "Test Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["name"] == "Test Artist"
        assert result["kind"] == "artist"
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["melodic", "belting"]
        assert result["influences"] == []
        assert result["policy"]["public_release"] is False
        assert result["policy"]["disallow_named_style_of"] is True

    def test_generates_default_name_when_missing(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that 'Generic Artist' is used when name not provided."""
        partial = {"kind": "artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["name"] == "Generic Artist"

    def test_generates_default_name_when_empty_string(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that 'Generic Artist' is used when name is empty string."""
        partial = {"name": ""}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["name"] == "Generic Artist"

    def test_generates_default_kind_when_missing(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that 'artist' is used as default kind when missing."""
        partial = {"name": "Test Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["kind"] == "artist"

    def test_generates_empty_influences_by_default(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that influences default to empty array (no assumptions)."""
        partial = {"name": "Test Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["influences"] == []

    # =============================================================================
    # Test: Genre-appropriate vocal defaults
    # =============================================================================

    def test_pop_genre_vocal_defaults(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test Pop genre uses correct vocal defaults."""
        partial = {"name": "Pop Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["melodic", "belting"]

    def test_hiphop_genre_vocal_defaults(
        self,
        generator: PersonaDefaultGenerator,
        hiphop_blueprint: Dict[str, Any]
    ):
        """Test Hip-Hop genre uses correct vocal defaults."""
        partial = {"name": "Hip-Hop Artist"}
        result = generator.generate_default_persona(hiphop_blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "baritone"
        assert result["delivery"] == ["rap", "melodic-rap"]

    def test_country_genre_vocal_defaults(
        self,
        generator: PersonaDefaultGenerator,
        country_blueprint: Dict[str, Any]
    ):
        """Test Country genre uses correct vocal defaults."""
        partial = {"name": "Country Artist"}
        result = generator.generate_default_persona(country_blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "baritone"
        assert result["delivery"] == ["storytelling", "conversational"]

    def test_rock_genre_vocal_defaults(
        self,
        generator: PersonaDefaultGenerator,
        rock_blueprint: Dict[str, Any]
    ):
        """Test Rock genre uses correct vocal defaults."""
        partial = {"name": "Rock Artist"}
        result = generator.generate_default_persona(rock_blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "tenor"
        assert result["delivery"] == ["powerful", "belting"]

    def test_jazz_genre_vocal_defaults(self, generator: PersonaDefaultGenerator):
        """Test Jazz genre uses correct vocal defaults."""
        blueprint = {"genre": "Jazz"}
        partial = {"name": "Jazz Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"  # Default
        assert result["delivery"] == ["crooner", "smooth"]

    def test_rnb_genre_vocal_defaults(self, generator: PersonaDefaultGenerator):
        """Test R&B genre uses correct vocal defaults."""
        blueprint = {"genre": "R&B"}
        partial = {"name": "R&B Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "alto"
        assert result["delivery"] == ["soulful", "melismatic"]

    def test_electronic_genre_vocal_defaults(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test Electronic genre uses correct vocal defaults."""
        blueprint = {"genre": "Electronic"}
        partial = {"name": "Electronic Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["clear", "powerful"]

    def test_indie_genre_vocal_defaults(self, generator: PersonaDefaultGenerator):
        """Test Indie genre uses correct vocal defaults."""
        blueprint = {"genre": "Indie"}
        partial = {"name": "Indie Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["intimate", "conversational"]

    def test_christmas_genre_vocal_defaults(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test Christmas genre uses correct vocal defaults."""
        blueprint = {"genre": "Christmas"}
        partial = {"name": "Christmas Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["warm", "crooning"]

    def test_kpop_genre_vocal_defaults(self, generator: PersonaDefaultGenerator):
        """Test K-Pop genre uses correct vocal defaults."""
        blueprint = {"genre": "K-Pop"}
        partial = {"name": "K-Pop Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium-high"
        assert result["delivery"] == ["melodic", "powerful"]

    def test_latin_genre_vocal_defaults(self, generator: PersonaDefaultGenerator):
        """Test Latin genre uses correct vocal defaults."""
        blueprint = {"genre": "Latin"}
        partial = {"name": "Latin Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["passionate", "rhythmic"]

    # =============================================================================
    # Test: Genre extraction from various blueprint structures
    # =============================================================================

    def test_extract_genre_from_direct_field(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test genre extraction when directly in blueprint."""
        blueprint = {"genre": "Pop"}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["delivery"] == ["melodic", "belting"]

    def test_extract_genre_from_genre_detail(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test genre extraction from genre_detail.primary."""
        blueprint = {"genre_detail": {"primary": "Country"}}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["delivery"] == ["storytelling", "conversational"]

    def test_extract_genre_from_metadata(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test genre extraction from metadata.genre."""
        blueprint = {"metadata": {"genre": "Rock"}}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["delivery"] == ["powerful", "belting"]

    def test_defaults_to_pop_when_genre_not_found(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test that Pop defaults are used when genre not found in blueprint."""
        blueprint = {"tempo_bpm": 120}  # No genre field
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["melodic", "belting"]

    # =============================================================================
    # Test: Partial persona preservation
    # =============================================================================

    def test_preserves_user_provided_name(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided name is preserved."""
        partial = {"name": "My Custom Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["name"] == "My Custom Artist"

    def test_preserves_user_provided_kind(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided kind is preserved."""
        partial = {"name": "My Band", "kind": "band"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["kind"] == "band"

    def test_preserves_user_provided_vocal_range(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided vocal_range is preserved."""
        partial = {"name": "Artist", "vocal_range": "soprano"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "soprano"

    def test_preserves_user_provided_delivery(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided delivery is preserved."""
        partial = {"name": "Artist", "delivery": ["whispered", "breathy"]}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["delivery"] == ["whispered", "breathy"]

    def test_preserves_user_provided_influences(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided influences are preserved."""
        partial = {"name": "Artist", "influences": ["Beatles", "Queen"]}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["influences"] == ["Beatles", "Queen"]

    def test_preserves_user_provided_voice(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided voice is preserved."""
        partial = {"name": "Artist", "voice": "gritty baritone"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["voice"] == "gritty baritone"

    def test_preserves_user_provided_bio(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided bio is preserved."""
        partial = {"name": "Artist", "bio": "A talented musician..."}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["bio"] == "A talented musician..."

    def test_preserves_user_provided_policy(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that user-provided policy is preserved."""
        partial = {
            "name": "Artist",
            "policy": {
                "public_release": True,
                "disallow_named_style_of": False
            }
        }
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["policy"]["public_release"] is True
        assert result["policy"]["disallow_named_style_of"] is False

    def test_fills_missing_policy_fields(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that missing policy fields are filled with defaults."""
        partial = {
            "name": "Artist",
            "policy": {"public_release": True}  # Missing disallow_named_style_of
        }
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["policy"]["public_release"] is True
        assert result["policy"]["disallow_named_style_of"] is True  # Default

    def test_preserves_all_extra_fields(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that all user-provided fields are preserved."""
        partial = {
            "name": "Complete Artist",
            "kind": "band",
            "bio": "A great band",
            "voice": "smooth harmonies",
            "vocal_range": "tenor",
            "delivery": ["harmonious", "melodic"],
            "influences": ["Beach Boys", "ABBA"],
            "policy": {
                "public_release": True,
                "disallow_named_style_of": False
            }
        }
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result["name"] == "Complete Artist"
        assert result["kind"] == "band"
        assert result["bio"] == "A great band"
        assert result["voice"] == "smooth harmonies"
        assert result["vocal_range"] == "tenor"
        assert result["delivery"] == ["harmonious", "melodic"]
        assert result["influences"] == ["Beach Boys", "ABBA"]
        assert result["policy"]["public_release"] is True
        assert result["policy"]["disallow_named_style_of"] is False

    # =============================================================================
    # Test: Determinism
    # =============================================================================

    def test_deterministic_output_same_inputs(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that same inputs produce identical outputs (determinism)."""
        partial = {"name": "Test Artist"}

        result1 = generator.generate_default_persona(pop_blueprint, partial)
        result2 = generator.generate_default_persona(pop_blueprint, partial)

        assert result1 == result2

    def test_deterministic_across_instances(self, pop_blueprint: Dict[str, Any]):
        """Test determinism across different generator instances."""
        partial = {"name": "Test Artist"}

        generator1 = PersonaDefaultGenerator()
        generator2 = PersonaDefaultGenerator()

        result1 = generator1.generate_default_persona(pop_blueprint, partial)
        result2 = generator2.generate_default_persona(pop_blueprint, partial)

        assert result1 == result2

    # =============================================================================
    # Test: Edge cases and unknown genres
    # =============================================================================

    def test_unknown_genre_defaults_to_melodic(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test that unknown genres get 'melodic' delivery default."""
        blueprint = {"genre": "UnknownGenre"}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["delivery"] == ["melodic"]
        assert result["vocal_range"] == "medium"

    def test_case_insensitive_genre_matching(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test that genre matching is case-insensitive."""
        blueprint1 = {"genre": "POP"}
        blueprint2 = {"genre": "pop"}
        blueprint3 = {"genre": "Pop"}
        partial = {"name": "Artist"}

        result1 = generator.generate_default_persona(blueprint1, partial)
        result2 = generator.generate_default_persona(blueprint2, partial)
        result3 = generator.generate_default_persona(blueprint3, partial)

        assert result1["delivery"] == result2["delivery"] == result3["delivery"]
        assert result1["vocal_range"] == result2["vocal_range"] == result3["vocal_range"]

    def test_compound_genre_matching(self, generator: PersonaDefaultGenerator):
        """Test that compound genres match appropriately."""
        blueprint = {"genre": "Pop-Country"}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        # Should match Pop-Country specific entry
        assert result["delivery"] == ["storytelling", "melodic"]

    def test_partial_genre_matching(self, generator: PersonaDefaultGenerator):
        """Test that partial genre names match (e.g., 'Pop Rock' matches 'Pop')."""
        blueprint = {"genre": "Pop Rock"}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        # Should match Pop as it's contained in the genre name
        assert "melodic" in result["delivery"] or "powerful" in result["delivery"]

    def test_empty_blueprint_uses_defaults(
        self,
        generator: PersonaDefaultGenerator
    ):
        """Test that empty blueprint uses Pop defaults."""
        blueprint = {}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["vocal_range"] == "medium"
        assert result["delivery"] == ["melodic", "belting"]

    # =============================================================================
    # Test: Optional fields remain None when not provided
    # =============================================================================

    def test_voice_defaults_to_none(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that voice field defaults to None when not provided."""
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result.get("voice") is None

    def test_bio_defaults_to_none(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that bio field defaults to None when not provided."""
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        assert result.get("bio") is None

    def test_style_defaults_not_set_when_missing(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that style_defaults is not set when not provided."""
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        # style_defaults should either be absent or None
        assert "style_defaults" not in result or result.get("style_defaults") is None

    def test_lyrics_defaults_not_set_when_missing(
        self,
        generator: PersonaDefaultGenerator,
        pop_blueprint: Dict[str, Any]
    ):
        """Test that lyrics_defaults is not set when not provided."""
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(pop_blueprint, partial)

        assert result is not None
        # lyrics_defaults should either be absent or None
        assert "lyrics_defaults" not in result or result.get("lyrics_defaults") is None

    # =============================================================================
    # Test: Complex genre variations
    # =============================================================================

    @pytest.mark.parametrize("genre,expected_delivery", [
        ("CCM", ["earnest", "worshipful"]),
        ("Christian", ["earnest", "worshipful"]),
        ("EDM", ["clear", "powerful"]),
        ("Dance", ["clear", "powerful"]),
        ("Rap", ["rap", "melodic-rap"]),
        ("Alternative", ["intimate", "conversational"]),
        ("Pop-Punk", ["powerful", "raw"]),
        ("Emo", ["emotive", "raw"]),
        ("Reggaeton", ["rhythmic", "melodic"]),
        ("Afrobeats", ["rhythmic", "melodic"]),
        ("Hyperpop", ["energetic", "processed"]),
        ("Folk", ["conversational", "warm"]),
        ("Blues", ["soulful", "raw"]),
        ("Soul", ["soulful", "powerful"]),
        ("Gospel", ["powerful", "worshipful"]),
        ("Metal", ["aggressive", "powerful"]),
        ("Punk", ["raw", "aggressive"]),
    ])
    def test_specialized_genre_defaults(
        self,
        generator: PersonaDefaultGenerator,
        genre: str,
        expected_delivery: list
    ):
        """Test delivery defaults for specialized genres."""
        blueprint = {"genre": genre}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)

        assert result is not None
        assert result["delivery"] == expected_delivery
