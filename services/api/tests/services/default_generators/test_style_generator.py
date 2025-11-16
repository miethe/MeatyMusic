"""Unit tests for StyleDefaultGenerator.

Tests default generation logic for Style entities including:
- Default generation for multiple genres
- Partial style preservation
- Determinism (same input = same output)
- Energy derivation from tempo
- All field combinations
- Error cases
"""

import pytest
from app.services.default_generators.style_generator import (
    StyleDefaultGenerator,
    GENRE_MOOD_MAP,
    GENRE_KEY_MAP,
)


class TestStyleDefaultGenerator:
    """Test suite for StyleDefaultGenerator."""

    @pytest.fixture
    def generator(self):
        """Create a StyleDefaultGenerator instance."""
        return StyleDefaultGenerator()

    @pytest.fixture
    def pop_blueprint(self):
        """Sample Pop blueprint."""
        return {
            "genre": "Pop",
            "version": "2025.11",
            "rules": {
                "tempo_bpm": [95, 130],
                "mood": ["upbeat", "catchy"],
                "instrumentation": ["synth", "drums", "bass"],
            }
        }

    @pytest.fixture
    def christmas_blueprint(self):
        """Sample Christmas Pop blueprint."""
        return {
            "genre": "Christmas Pop",
            "version": "2025.11",
            "rules": {
                "tempo_bpm": [110, 130],
                "mood": ["upbeat", "warm", "festive"],
                "instrumentation": ["sleigh bells", "brass", "upright bass"],
            }
        }

    @pytest.fixture
    def hiphop_blueprint(self):
        """Sample Hip-Hop blueprint."""
        return {
            "genre": "Hip-Hop",
            "version": "2025.11",
            "rules": {
                "tempo_bpm": [80, 100],
                "mood": ["energetic", "confident"],
                "instrumentation": ["808", "hi-hats", "synth"],
            }
        }

    # Test: Basic default generation
    def test_generate_default_style_pop(self, generator, pop_blueprint):
        """Test default style generation for Pop genre."""
        style = generator.generate_default_style(pop_blueprint)

        assert style is not None
        assert style["genre_detail"]["primary"] == "Pop"
        assert style["genre_detail"]["subgenres"] == []
        assert style["genre_detail"]["fusions"] == []
        assert style["tempo_bpm"] == [95, 130]
        assert style["time_signature"] == "4/4"
        assert style["key"]["primary"] == "C major"
        assert style["key"]["modulations"] == []
        assert style["mood"] == ["upbeat", "catchy"]
        assert style["energy"] in ["low", "medium", "high", "anthemic"]
        assert style["instrumentation"] == ["synth", "drums", "bass"]
        assert style["vocal_profile"] == "unspecified"
        assert style["tags"] == []
        assert style["negative_tags"] == []

    def test_generate_default_style_christmas(self, generator, christmas_blueprint):
        """Test default style generation for Christmas Pop genre."""
        style = generator.generate_default_style(christmas_blueprint)

        assert style["genre_detail"]["primary"] == "Christmas Pop"
        assert style["tempo_bpm"] == [110, 130]
        assert style["key"]["primary"] == "C major"  # Christmas Pop default
        assert style["mood"] == ["upbeat", "warm", "festive"]
        assert style["instrumentation"] == ["sleigh bells", "brass", "upright bass"]

    def test_generate_default_style_hiphop(self, generator, hiphop_blueprint):
        """Test default style generation for Hip-Hop genre."""
        style = generator.generate_default_style(hiphop_blueprint)

        assert style["genre_detail"]["primary"] == "Hip-Hop"
        assert style["tempo_bpm"] == [80, 100]
        assert style["key"]["primary"] == "C minor"  # Hip-Hop default
        assert style["mood"] == ["energetic", "confident"]
        assert style["energy"] == "low"  # 80-100 BPM avg = 90, which is < 90 -> "low"

    # Test: Partial style preservation
    def test_preserve_partial_genre_detail(self, generator, pop_blueprint):
        """Test that partial genre_detail is preserved."""
        partial = {
            "genre_detail": {
                "primary": "Electro Pop",
                "subgenres": ["Synthpop"],
                "fusions": ["EDM"],
            }
        }

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["genre_detail"]["primary"] == "Electro Pop"
        assert style["genre_detail"]["subgenres"] == ["Synthpop"]
        assert style["genre_detail"]["fusions"] == ["EDM"]

    def test_preserve_partial_tempo(self, generator, pop_blueprint):
        """Test that partial tempo is preserved."""
        partial = {"tempo_bpm": 120}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["tempo_bpm"] == 120

    def test_preserve_partial_tempo_range(self, generator, pop_blueprint):
        """Test that partial tempo range is preserved."""
        partial = {"tempo_bpm": [100, 110]}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["tempo_bpm"] == [100, 110]

    def test_preserve_partial_key(self, generator, pop_blueprint):
        """Test that partial key is preserved."""
        partial = {
            "key": {
                "primary": "D minor",
                "modulations": ["F major"],
            }
        }

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["key"]["primary"] == "D minor"
        assert style["key"]["modulations"] == ["F major"]

    def test_preserve_partial_mood(self, generator, pop_blueprint):
        """Test that partial mood is preserved."""
        partial = {"mood": ["dark", "moody"]}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["mood"] == ["dark", "moody"]

    def test_preserve_partial_energy(self, generator, pop_blueprint):
        """Test that partial energy is preserved."""
        partial = {"energy": "anthemic"}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["energy"] == "anthemic"

    def test_preserve_partial_instrumentation(self, generator, pop_blueprint):
        """Test that partial instrumentation is preserved."""
        partial = {"instrumentation": ["guitar", "piano"]}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["instrumentation"] == ["guitar", "piano"]

    def test_preserve_partial_vocal_profile(self, generator, pop_blueprint):
        """Test that partial vocal_profile is preserved."""
        partial = {"vocal_profile": "female lead"}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["vocal_profile"] == "female lead"

    def test_preserve_partial_tags(self, generator, pop_blueprint):
        """Test that partial tags are preserved."""
        partial = {"tags": ["Era:2020s", "Mix:modern-bright"]}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["tags"] == ["Era:2020s", "Mix:modern-bright"]

    def test_preserve_partial_negative_tags(self, generator, pop_blueprint):
        """Test that partial negative_tags are preserved."""
        partial = {"negative_tags": ["muddy low-end"]}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["negative_tags"] == ["muddy low-end"]

    # Test: Determinism
    def test_determinism_same_blueprint_same_output(self, generator, pop_blueprint):
        """Test that same blueprint produces identical output."""
        style1 = generator.generate_default_style(pop_blueprint)
        style2 = generator.generate_default_style(pop_blueprint)

        assert style1 == style2

    def test_determinism_with_partial(self, generator, pop_blueprint):
        """Test determinism with partial style data."""
        partial = {
            "tempo_bpm": 115,
            "mood": ["energetic"],
        }

        style1 = generator.generate_default_style(pop_blueprint, partial)
        style2 = generator.generate_default_style(pop_blueprint, partial)

        assert style1 == style2

    # Test: Energy derivation from tempo
    def test_energy_low_tempo_slow(self, generator, pop_blueprint):
        """Test energy derivation for slow tempo (< 90 BPM)."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [60, 80]}
        }

        style = generator.generate_default_style(blueprint)

        assert style["energy"] == "low"

    def test_energy_medium_tempo_moderate(self, generator, pop_blueprint):
        """Test energy derivation for moderate tempo (90-120 BPM)."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [100, 110]}
        }

        style = generator.generate_default_style(blueprint)

        assert style["energy"] == "medium"

    def test_energy_high_tempo_fast(self, generator, pop_blueprint):
        """Test energy derivation for fast tempo (120-140 BPM)."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [125, 135]}
        }

        style = generator.generate_default_style(blueprint)

        assert style["energy"] == "high"

    def test_energy_anthemic_tempo_very_fast(self, generator, pop_blueprint):
        """Test energy derivation for very fast tempo (> 140 BPM)."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [150, 160]}
        }

        style = generator.generate_default_style(blueprint)

        assert style["energy"] == "anthemic"

    def test_energy_explicit_overrides_tempo(self, generator, pop_blueprint):
        """Test that explicit energy overrides tempo-derived energy."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [150, 160]}  # Would derive "anthemic"
        }
        partial = {"energy": "low"}

        style = generator.generate_default_style(blueprint, partial)

        assert style["energy"] == "low"

    # Test: Tempo handling variations
    def test_tempo_dict_format(self, generator):
        """Test tempo handling with dict format."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": {"min": 100, "max": 120}}
        }

        style = generator.generate_default_style(blueprint)

        assert style["tempo_bpm"] == [100, 120]

    def test_tempo_single_value(self, generator):
        """Test tempo handling with single value."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": 110}
        }

        style = generator.generate_default_style(blueprint)

        # Single value should create a small range
        assert style["tempo_bpm"] == [105, 115]

    def test_tempo_missing_uses_default(self, generator):
        """Test tempo fallback when not in blueprint."""
        blueprint = {
            "genre": "Pop",
            "rules": {}
        }

        style = generator.generate_default_style(blueprint)

        assert style["tempo_bpm"] == [100, 120]

    # Test: Instrumentation limiting
    def test_instrumentation_limited_to_three(self, generator):
        """Test that instrumentation is limited to 3 items."""
        partial = {
            "instrumentation": ["guitar", "bass", "drums", "synth", "piano"]
        }
        blueprint = {
            "genre": "Pop",
            "rules": {}
        }

        style = generator.generate_default_style(blueprint, partial)

        assert len(style["instrumentation"]) == 3
        assert style["instrumentation"] == ["guitar", "bass", "drums"]

    def test_instrumentation_from_blueprint_limited(self, generator):
        """Test that blueprint instrumentation is limited to 3 items."""
        blueprint = {
            "genre": "Pop",
            "rules": {
                "instrumentation": ["guitar", "bass", "drums", "synth", "piano"]
            }
        }

        style = generator.generate_default_style(blueprint)

        assert len(style["instrumentation"]) == 3

    # Test: Genre-specific defaults
    def test_genre_mood_map_coverage(self, generator):
        """Test that all genres in GENRE_MOOD_MAP have appropriate moods."""
        for genre, moods in GENRE_MOOD_MAP.items():
            assert isinstance(moods, list)
            assert len(moods) > 0
            assert all(isinstance(mood, str) for mood in moods)

    def test_genre_key_map_coverage(self, generator):
        """Test that all genres in GENRE_KEY_MAP have valid keys."""
        for genre, key in GENRE_KEY_MAP.items():
            assert isinstance(key, str)
            assert "major" in key or "minor" in key

    def test_unknown_genre_uses_fallback_mood(self, generator):
        """Test that unknown genre uses fallback mood."""
        blueprint = {
            "genre": "Unknown Genre",
            "rules": {}
        }

        style = generator.generate_default_style(blueprint)

        assert style["mood"] == ["neutral"]

    def test_unknown_genre_uses_fallback_key(self, generator):
        """Test that unknown genre uses fallback key."""
        blueprint = {
            "genre": "Unknown Genre",
            "rules": {}
        }

        style = generator.generate_default_style(blueprint)

        assert style["key"]["primary"] == "C major"

    # Test: All field combinations
    def test_all_fields_with_partial(self, generator, pop_blueprint):
        """Test generation with all fields in partial."""
        partial = {
            "genre_detail": {
                "primary": "Custom Pop",
                "subgenres": ["Synthpop"],
                "fusions": ["Rock"],
            },
            "tempo_bpm": [110, 120],
            "time_signature": "3/4",
            "key": {
                "primary": "E major",
                "modulations": ["G major"],
            },
            "mood": ["happy", "energetic"],
            "energy": "high",
            "instrumentation": ["guitar", "piano"],
            "vocal_profile": "male lead",
            "tags": ["Era:2020s"],
            "negative_tags": ["muddy"],
        }

        style = generator.generate_default_style(pop_blueprint, partial)

        # All partial values should be preserved
        assert style["genre_detail"]["primary"] == "Custom Pop"
        assert style["genre_detail"]["subgenres"] == ["Synthpop"]
        assert style["genre_detail"]["fusions"] == ["Rock"]
        assert style["tempo_bpm"] == [110, 120]
        assert style["time_signature"] == "3/4"
        assert style["key"]["primary"] == "E major"
        assert style["key"]["modulations"] == ["G major"]
        assert style["mood"] == ["happy", "energetic"]
        assert style["energy"] == "high"
        assert style["instrumentation"] == ["guitar", "piano"]
        assert style["vocal_profile"] == "male lead"
        assert style["tags"] == ["Era:2020s"]
        assert style["negative_tags"] == ["muddy"]

    # Test: Error cases
    def test_error_missing_blueprint(self, generator):
        """Test error when blueprint is missing."""
        with pytest.raises(ValueError, match="Blueprint is required"):
            generator.generate_default_style(None)

    def test_error_empty_blueprint(self, generator):
        """Test error when blueprint is empty."""
        with pytest.raises(ValueError, match="Blueprint is required"):
            generator.generate_default_style({})

    def test_error_missing_genre(self, generator):
        """Test error when blueprint missing genre."""
        blueprint = {"rules": {}}

        with pytest.raises(ValueError, match="must contain 'genre' field"):
            generator.generate_default_style(blueprint)

    # Test: Time signature default
    def test_time_signature_default(self, generator, pop_blueprint):
        """Test that time_signature defaults to 4/4."""
        style = generator.generate_default_style(pop_blueprint)

        assert style["time_signature"] == "4/4"

    def test_time_signature_custom(self, generator, pop_blueprint):
        """Test that custom time_signature is preserved."""
        partial = {"time_signature": "6/8"}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style["time_signature"] == "6/8"

    # Test: Multiple genres
    def test_multiple_genres_determinism(self, generator):
        """Test determinism across multiple different genres."""
        genres = ["Pop", "Rock", "Jazz", "Hip-Hop", "Country"]

        for genre in genres:
            blueprint = {
                "genre": genre,
                "rules": {"tempo_bpm": [100, 120]}
            }

            style1 = generator.generate_default_style(blueprint)
            style2 = generator.generate_default_style(blueprint)

            assert style1 == style2, f"Determinism failed for genre: {genre}"

    # Test: Empty partial style
    def test_empty_partial_style(self, generator, pop_blueprint):
        """Test that empty partial style is handled correctly."""
        partial = {}

        style = generator.generate_default_style(pop_blueprint, partial)

        assert style is not None
        assert style["genre_detail"]["primary"] == "Pop"

    # Test: None partial style
    def test_none_partial_style(self, generator, pop_blueprint):
        """Test that None partial style is handled correctly."""
        style = generator.generate_default_style(pop_blueprint, None)

        assert style is not None
        assert style["genre_detail"]["primary"] == "Pop"

    # Test: Mood fallback from blueprint
    def test_mood_from_blueprint_rules(self, generator):
        """Test that mood comes from blueprint rules when available."""
        blueprint = {
            "genre": "Pop",
            "rules": {
                "mood": ["custom", "mood"]
            }
        }

        style = generator.generate_default_style(blueprint)

        assert style["mood"] == ["custom", "mood"]

    def test_mood_from_genre_map_when_no_blueprint_mood(self, generator):
        """Test that mood falls back to genre map when not in blueprint."""
        blueprint = {
            "genre": "Pop",
            "rules": {}
        }

        style = generator.generate_default_style(blueprint)

        assert style["mood"] == GENRE_MOOD_MAP["Pop"]

    # Test: Edge cases
    def test_tempo_boundary_90_bpm(self, generator):
        """Test energy derivation at 90 BPM boundary."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [89, 91]}  # avg = 90
        }

        style = generator.generate_default_style(blueprint)

        # At 90 BPM, should be "medium" (>= 90 and < 120)
        assert style["energy"] == "medium"

    def test_tempo_boundary_120_bpm(self, generator):
        """Test energy derivation at 120 BPM boundary."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [119, 121]}  # avg = 120
        }

        style = generator.generate_default_style(blueprint)

        # At 120 BPM, should be "high" (>= 120 and < 140)
        assert style["energy"] == "high"

    def test_tempo_boundary_140_bpm(self, generator):
        """Test energy derivation at 140 BPM boundary."""
        blueprint = {
            "genre": "Pop",
            "rules": {"tempo_bpm": [139, 141]}  # avg = 140
        }

        style = generator.generate_default_style(blueprint)

        # At 140 BPM, should be "anthemic" (>= 140)
        assert style["energy"] == "anthemic"
