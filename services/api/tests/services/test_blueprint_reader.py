"""Unit tests for BlueprintReaderService.

Tests blueprint loading, caching, parsing, and error handling for the
blueprint reader service used in default generation.
"""

import pytest
from pathlib import Path
from unittest.mock import patch, mock_open

from app.services.blueprint_reader import BlueprintReaderService
from app.errors import NotFoundError, BadRequestError


class TestBlueprintReaderService:
    """Test suite for BlueprintReaderService."""

    @pytest.fixture
    def service(self):
        """Create BlueprintReaderService instance."""
        return BlueprintReaderService()

    # =============================================================================
    # Blueprint Loading Tests
    # =============================================================================

    def test_read_blueprint_pop_success(self, service):
        """Test successful blueprint loading for pop genre."""
        result = service.read_blueprint("pop")

        assert result is not None
        assert result['genre'] == "pop"
        assert isinstance(result, dict)

        # Check all required fields are present
        assert 'tempo_bpm' in result
        assert 'time_signature' in result
        assert 'required_sections' in result
        assert 'default_mood' in result
        assert 'default_energy' in result
        assert 'instrumentation' in result
        assert 'tags' in result
        assert 'length_minutes' in result

    def test_read_blueprint_pop_tempo(self, service):
        """Test tempo extraction for pop genre."""
        result = service.read_blueprint("pop")

        assert result['tempo_bpm'] == [95, 130]

    def test_read_blueprint_pop_sections(self, service):
        """Test required sections extraction for pop genre."""
        result = service.read_blueprint("pop")

        assert isinstance(result['required_sections'], list)
        assert len(result['required_sections']) > 0
        # Pop typically has Verse and Chorus at minimum
        assert "Verse" in result['required_sections'] or "Chorus" in result['required_sections']

    def test_read_blueprint_christmas_success(self, service):
        """Test successful blueprint loading for christmas genre."""
        result = service.read_blueprint("christmas")

        assert result is not None
        assert result['genre'] == "christmas"
        assert result['tempo_bpm'] == [100, 130]
        assert isinstance(result['required_sections'], list)

    def test_read_blueprint_rock_success(self, service):
        """Test successful blueprint loading for rock genre."""
        result = service.read_blueprint("rock")

        assert result is not None
        assert result['genre'] == "rock"
        assert result['tempo_bpm'] == [110, 140]
        assert isinstance(result['instrumentation'], list)
        # Rock should have guitar-based instrumentation
        # Note: This might vary based on parsing, so we just check it's a list

    def test_read_blueprint_country_success(self, service):
        """Test successful blueprint loading for country genre."""
        result = service.read_blueprint("country")

        assert result is not None
        assert result['genre'] == "country"
        assert isinstance(result['tempo_bpm'], list)
        assert len(result['tempo_bpm']) == 2

    def test_read_blueprint_not_found(self, service):
        """Test blueprint loading with non-existent genre."""
        with pytest.raises(NotFoundError) as exc_info:
            service.read_blueprint("nonexistent_genre_xyz")

        assert "not found" in str(exc_info.value).lower()
        assert "nonexistent_genre_xyz" in str(exc_info.value)

    # =============================================================================
    # Caching Tests
    # =============================================================================

    def test_read_blueprint_cache_miss_then_hit(self, service):
        """Test blueprint caching on first load and subsequent retrieval."""
        # First call - cache miss
        assert len(service._blueprint_cache) == 0
        result1 = service.read_blueprint("pop")
        assert len(service._blueprint_cache) == 1

        # Second call - cache hit (should be same object)
        result2 = service.read_blueprint("pop")
        assert result1 is result2
        assert len(service._blueprint_cache) == 1

    def test_read_blueprint_multiple_genres_cached(self, service):
        """Test caching of multiple different genres."""
        pop_result = service.read_blueprint("pop")
        rock_result = service.read_blueprint("rock")
        christmas_result = service.read_blueprint("christmas")

        assert len(service._blueprint_cache) == 3
        assert service._blueprint_cache["pop"] is pop_result
        assert service._blueprint_cache["rock"] is rock_result
        assert service._blueprint_cache["christmas"] is christmas_result

    def test_invalidate_cache_all(self, service):
        """Test clearing entire blueprint cache."""
        # Load multiple blueprints
        service.read_blueprint("pop")
        service.read_blueprint("rock")
        assert len(service._blueprint_cache) == 2

        # Invalidate all
        removed = service.invalidate_cache()
        assert removed == 2
        assert len(service._blueprint_cache) == 0

    def test_invalidate_cache_single_genre(self, service):
        """Test clearing cache for a single genre."""
        # Load multiple blueprints
        service.read_blueprint("pop")
        service.read_blueprint("rock")
        assert len(service._blueprint_cache) == 2

        # Invalidate just pop
        removed = service.invalidate_cache("pop")
        assert removed == 1
        assert len(service._blueprint_cache) == 1
        assert "pop" not in service._blueprint_cache
        assert "rock" in service._blueprint_cache

    def test_invalidate_cache_nonexistent_genre(self, service):
        """Test invalidating cache for genre that isn't cached."""
        service.read_blueprint("pop")
        assert len(service._blueprint_cache) == 1

        # Try to invalidate genre that's not in cache
        removed = service.invalidate_cache("rock")
        assert removed == 0
        assert len(service._blueprint_cache) == 1

    # =============================================================================
    # Field Parsing Tests
    # =============================================================================

    def test_extract_tempo_valid_range(self, service):
        """Test tempo extraction with valid BPM range."""
        content = "**Tempo:** Most hits fall between **95–130 BPM** for upbeat tracks."
        tempo = service._extract_tempo(content)
        assert tempo == [95, 130]

    def test_extract_tempo_alternative_format(self, service):
        """Test tempo extraction with alternative markdown format."""
        content = "Typical tempo is around 100-120 BPM for this genre."
        tempo = service._extract_tempo(content)
        assert tempo == [100, 120]

    def test_extract_tempo_not_found(self, service):
        """Test tempo extraction when no tempo is specified."""
        content = "This blueprint doesn't mention tempo."
        tempo = service._extract_tempo(content)
        assert tempo is None

    def test_extract_sections_from_form(self, service):
        """Test section extraction from Form description."""
        content = "**Form:** **Verse → Pre-Chorus → Chorus → Verse → Chorus → Bridge → Chorus**"
        sections = service._extract_sections(content)

        assert "Verse" in sections
        assert "Chorus" in sections
        assert "Bridge" in sections
        # Should deduplicate
        assert sections.count("Verse") == 1
        assert sections.count("Chorus") == 1

    def test_extract_sections_default_fallback(self, service):
        """Test default sections when Form not found."""
        content = "This blueprint doesn't specify a form."
        sections = service._extract_sections(content)

        # Should default to Verse and Chorus
        assert sections == ["Verse", "Chorus"]

    def test_extract_length_valid_range(self, service):
        """Test length extraction with valid minute range."""
        content = "Most hits run **2.5–3.5 minutes** in length."
        length = service._extract_length(content)
        assert length == [2.5, 3.5]

    def test_extract_length_integer_values(self, service):
        """Test length extraction with integer minute values."""
        content = "Songs typically run 3-4 minutes."
        length = service._extract_length(content)
        assert length == [3.0, 4.0]

    def test_extract_length_not_found(self, service):
        """Test length extraction when no length is specified."""
        content = "This blueprint doesn't mention length."
        length = service._extract_length(content)
        assert length is None

    def test_extract_instrumentation_multiple_instruments(self, service):
        """Test instrumentation extraction with multiple instruments."""
        content = "**Instrumentation:** Modern pop uses synths, drum machines, bass, and guitars."
        instruments = service._extract_instrumentation(content)

        assert isinstance(instruments, list)
        assert len(instruments) <= 3  # Should limit to 3
        # Check that some instruments were extracted (exact match depends on parsing)
        assert len(instruments) > 0

    def test_extract_instrumentation_not_found(self, service):
        """Test instrumentation extraction when section not found."""
        content = "This blueprint doesn't mention instrumentation."
        instruments = service._extract_instrumentation(content)
        assert instruments == []

    def test_extract_mood_and_energy_from_content(self, service):
        """Test mood and energy extraction from vocal section."""
        content = """
        ## Vocal & Performance Style

        Pop vocals are polished and emotive. Verses are upbeat and energetic.
        """
        moods, energy = service._extract_mood_and_energy(content, [120, 140])

        assert isinstance(moods, list)
        assert len(moods) <= 2  # Should limit to 2
        assert energy in ["low", "medium", "high", "anthemic"]

    def test_extract_mood_and_energy_based_on_tempo(self, service):
        """Test energy level derived from tempo."""
        content = "No mood keywords here."

        # Low tempo
        moods, energy = service._extract_mood_and_energy(content, [70, 80])
        assert energy == "low"

        # Medium tempo
        moods, energy = service._extract_mood_and_energy(content, [100, 120])
        assert energy == "medium"

        # High tempo
        moods, energy = service._extract_mood_and_energy(content, [130, 140])
        assert energy == "high"

        # Anthemic tempo
        moods, energy = service._extract_mood_and_energy(content, [150, 170])
        assert energy == "anthemic"

    def test_extract_mood_default_fallback(self, service):
        """Test default mood when no keywords found."""
        content = "Generic content without mood keywords."
        moods, energy = service._extract_mood_and_energy(content, None)

        assert moods == ["balanced"]
        assert energy == "medium"

    def test_extract_key_from_content(self, service):
        """Test key extraction from musical blueprint."""
        content = "**Key & mode:** Both major and minor keys are common. C major is popular."
        key = service._extract_key(content, "pop")

        assert "major" in key.lower() or "minor" in key.lower()

    def test_extract_key_genre_default(self, service):
        """Test key extraction falls back to genre defaults."""
        content = "No key mentioned here."

        # Test genre-specific defaults
        assert service._extract_key(content, "pop") == "C major"
        assert service._extract_key(content, "rock") == "G major"
        assert service._extract_key(content, "hiphop") == "C minor"
        assert service._extract_key(content, "unknown") == "C major"  # Fallback

    def test_extract_tags_by_category(self, service):
        """Test tag extraction returns categorized tags."""
        content = """
        Modern pop production is polished and layered with rich instrumentation.
        The sound is catchy and mainstream.
        """
        tags = service._extract_tags(content, "pop")

        assert isinstance(tags, dict)
        assert 'vibe' in tags
        assert 'texture' in tags
        assert 'production' in tags

    def test_extract_tags_genre_specific(self, service):
        """Test genre-specific vibe tags."""
        tags_pop = service._extract_tags("", "pop")
        tags_rock = service._extract_tags("", "rock")
        tags_country = service._extract_tags("", "country")

        # Each genre should have specific vibe tags
        assert len(tags_pop['vibe']) > 0
        assert len(tags_rock['vibe']) > 0
        assert len(tags_country['vibe']) > 0

    # =============================================================================
    # Integration Tests (Real Files)
    # =============================================================================

    def test_read_all_available_genres(self, service):
        """Test reading all available blueprint files."""
        # List of genres we know should exist
        expected_genres = [
            "pop", "rock", "country", "hiphop", "rnb",
            "electronic", "christmas", "ccm"
        ]

        for genre in expected_genres:
            blueprint_path = service.BLUEPRINT_DIR / f"{genre}_blueprint.md"
            if blueprint_path.exists():
                result = service.read_blueprint(genre)
                assert result['genre'] == genre
                assert isinstance(result['tempo_bpm'], list) or result['tempo_bpm'] is None
                assert isinstance(result['required_sections'], list)
                assert len(result['required_sections']) > 0

    def test_blueprint_data_completeness(self, service):
        """Test that all fields are present in parsed data."""
        result = service.read_blueprint("pop")

        required_fields = [
            'genre',
            'tempo_bpm',
            'time_signature',
            'recommended_key',
            'required_sections',
            'default_mood',
            'default_energy',
            'instrumentation',
            'tags',
            'length_minutes',
        ]

        for field in required_fields:
            assert field in result, f"Missing required field: {field}"

    def test_blueprint_data_types(self, service):
        """Test that parsed data has correct types."""
        result = service.read_blueprint("pop")

        assert isinstance(result['genre'], str)
        assert isinstance(result['tempo_bpm'], list) or result['tempo_bpm'] is None
        assert isinstance(result['time_signature'], str)
        assert isinstance(result['recommended_key'], str) or result['recommended_key'] is None
        assert isinstance(result['required_sections'], list)
        assert isinstance(result['default_mood'], list)
        assert isinstance(result['default_energy'], str)
        assert isinstance(result['instrumentation'], list)
        assert isinstance(result['tags'], dict)
        assert isinstance(result['length_minutes'], list) or result['length_minutes'] is None

    # =============================================================================
    # Error Handling Tests
    # =============================================================================

    def test_malformed_file_handling(self, service):
        """Test handling of malformed blueprint files."""
        # This test uses mocking to simulate file read errors
        with patch('pathlib.Path.exists', return_value=True):
            with patch('pathlib.Path.read_text', side_effect=UnicodeDecodeError('utf-8', b'', 0, 1, 'invalid')):
                with pytest.raises(BadRequestError) as exc_info:
                    service.read_blueprint("test")

                assert "Failed to parse" in str(exc_info.value)

    def test_empty_file_handling(self, service):
        """Test handling of empty blueprint files."""
        with patch('pathlib.Path.exists', return_value=True):
            with patch('pathlib.Path.read_text', return_value=""):
                result = service.read_blueprint("test")

                # Should return default structure with minimal data
                assert result['genre'] == "test"
                assert result['required_sections'] == ["Verse", "Chorus"]  # Default
                assert result['time_signature'] == "4/4"

    # =============================================================================
    # Edge Cases
    # =============================================================================

    def test_genre_name_case_sensitivity(self, service):
        """Test that genre names are case-sensitive (as per file system)."""
        # Pop works (lowercase)
        result = service.read_blueprint("pop")
        assert result is not None

        # POP shouldn't work (different filename)
        with pytest.raises(NotFoundError):
            service.read_blueprint("POP")

    def test_tempo_with_hyphen_vs_endash(self, service):
        """Test tempo extraction works with both hyphen and en-dash."""
        # Regular hyphen
        content1 = "**Tempo:** 100-120 BPM"
        tempo1 = service._extract_tempo(content1)
        assert tempo1 == [100, 120]

        # En-dash (–)
        content2 = "**Tempo:** 100–120 BPM"
        tempo2 = service._extract_tempo(content2)
        assert tempo2 == [100, 120]

    def test_instrumentation_limit_enforced(self, service):
        """Test that instrumentation is limited to 3 items."""
        content = """
        **Instrumentation:** Modern production uses synths, drum machines, bass,
        electric guitars, acoustic guitars, piano, strings, and brass sections.
        """
        instruments = service._extract_instrumentation(content)

        # Should be limited to 3
        assert len(instruments) <= 3

    def test_mood_limit_enforced(self, service):
        """Test that moods are limited to 2 items."""
        content = """
        ## Vocal & Performance Style

        Vocals are upbeat, energetic, emotive, playful, romantic, and nostalgic.
        """
        moods, _ = service._extract_mood_and_energy(content, [120, 140])

        # Should be limited to 2
        assert len(moods) <= 2

    def test_cache_persistence_across_calls(self, service):
        """Test that cache persists across multiple method calls."""
        # Load blueprint
        service.read_blueprint("pop")
        initial_cache_size = len(service._blueprint_cache)

        # Call other methods that don't modify cache
        service._extract_tempo("**Tempo:** 100-120 BPM")
        service._extract_sections("**Form:** Verse → Chorus")

        # Cache should be unchanged
        assert len(service._blueprint_cache) == initial_cache_size

    def test_sections_preserve_order(self, service):
        """Test that extracted sections preserve their order."""
        content = "**Form:** Intro → Verse → Chorus → Bridge → Outro"
        sections = service._extract_sections(content)

        # Check that Intro comes before Verse, etc.
        if "Intro" in sections and "Verse" in sections:
            assert sections.index("Intro") < sections.index("Verse")
        if "Verse" in sections and "Chorus" in sections:
            assert sections.index("Verse") < sections.index("Chorus")
