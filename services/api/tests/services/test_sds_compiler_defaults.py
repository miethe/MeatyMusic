"""Integration tests for SDSCompilerService with default generation.

Tests cover:
- SDS compilation with all missing entities (full defaults)
- SDS compilation with partial entities (mixed defaults)
- use_defaults=False raises clear errors
- Determinism with defaults (same inputs = same SDS)
- All entity combinations
"""

import pytest
from unittest.mock import Mock, MagicMock
from uuid import uuid4, UUID
from typing import Dict, Any

from app.services.sds_compiler_service import SDSCompilerService
from app.services.blueprint_reader import BlueprintReaderService
from app.services.default_generators import (
    StyleDefaultGenerator,
    LyricsDefaultGenerator,
    PersonaDefaultGenerator,
    ProducerDefaultGenerator,
)


class TestSDSCompilerWithDefaults:
    """Test suite for SDS compilation with default generation."""

    @pytest.fixture
    def mock_song_repo(self):
        """Create mock song repository."""
        return Mock()

    @pytest.fixture
    def mock_style_repo(self):
        """Create mock style repository."""
        return Mock()

    @pytest.fixture
    def mock_lyrics_repo(self):
        """Create mock lyrics repository."""
        return Mock()

    @pytest.fixture
    def mock_producer_notes_repo(self):
        """Create mock producer notes repository."""
        return Mock()

    @pytest.fixture
    def mock_persona_repo(self):
        """Create mock persona repository."""
        return Mock()

    @pytest.fixture
    def mock_blueprint_repo(self):
        """Create mock blueprint repository."""
        return Mock()

    @pytest.fixture
    def mock_source_repo(self):
        """Create mock source repository."""
        return Mock()

    @pytest.fixture
    def mock_validation_service(self):
        """Create mock validation service."""
        mock = Mock()
        # Default to successful validation
        mock.validate_sds.return_value = (True, [])
        return mock

    @pytest.fixture
    def mock_blueprint_reader(self):
        """Create mock blueprint reader."""
        mock = Mock(spec=BlueprintReaderService)
        # Return a sample blueprint dict
        mock.read_blueprint.return_value = {
            "genre": "Pop",
            "tempo_bpm": [100, 120],
            "time_signature": "4/4",
            "recommended_key": "C major",
            "required_sections": ["Verse", "Chorus"],
            "default_mood": ["upbeat", "energetic"],
            "default_energy": "medium",
            "instrumentation": ["synth", "drums", "bass"],
            "tags": {
                "vibe": ["catchy", "mainstream"],
                "texture": ["polished"],
                "production": ["layered"]
            },
            "length_minutes": [2.5, 3.5],
        }
        return mock

    @pytest.fixture
    def sds_compiler(
        self,
        mock_song_repo,
        mock_style_repo,
        mock_lyrics_repo,
        mock_producer_notes_repo,
        mock_persona_repo,
        mock_blueprint_repo,
        mock_source_repo,
        mock_validation_service,
        mock_blueprint_reader
    ):
        """Create SDS compiler service with all mock dependencies."""
        return SDSCompilerService(
            song_repo=mock_song_repo,
            style_repo=mock_style_repo,
            lyrics_repo=mock_lyrics_repo,
            producer_notes_repo=mock_producer_notes_repo,
            persona_repo=mock_persona_repo,
            blueprint_repo=mock_blueprint_repo,
            source_repo=mock_source_repo,
            validation_service=mock_validation_service,
            blueprint_reader=mock_blueprint_reader,
            # Let default generators be created automatically
        )

    @pytest.fixture
    def sample_song(self):
        """Create sample song entity."""
        song = Mock()
        song.id = uuid4()
        song.title = "Test Song"
        song.global_seed = 42
        song.render_config = None
        return song

    @pytest.fixture
    def sample_blueprint(self):
        """Create sample blueprint entity."""
        blueprint = Mock()
        blueprint.id = uuid4()
        blueprint.genre = "Pop"
        blueprint.version = "1.0.0"
        return blueprint

    @pytest.fixture
    def minimal_entities(self, sample_song, sample_blueprint):
        """Create minimal entity set (only song and blueprint - all entities missing)."""
        return {
            "song": sample_song,
            "style": None,
            "lyrics": None,
            "producer_notes": None,
            "persona": None,
            "blueprint": sample_blueprint,
            "sources": []
        }


class TestCompileSdsWithAllDefaults(TestSDSCompilerWithDefaults):
    """Tests for SDS compilation with all entities missing (full default generation)."""

    def test_compile_sds_with_all_missing_entities_generates_defaults(
        self,
        sds_compiler,
        mock_song_repo,
        mock_blueprint_reader,
        minimal_entities,
        sample_song
    ):
        """Test successful SDS compilation with all entities missing.

        Verifies that when all entities are missing (style, lyrics, producer_notes),
        the compiler generates sensible defaults based on the blueprint.
        """
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        sds = sds_compiler.compile_sds(song_id, use_defaults=True)

        # Verify SDS structure exists
        assert sds["title"] == "Test Song"
        assert sds["seed"] == 42

        # Verify blueprint was loaded
        mock_blueprint_reader.read_blueprint.assert_called_once_with("Pop")

        # Verify all required entities exist in SDS
        assert "style" in sds
        assert "lyrics" in sds
        assert "producer_notes" in sds

        # Verify style defaults
        assert sds["style"]["genre_detail"]["primary"] == "Pop"
        assert sds["style"]["tempo_bpm"] == [100, 120]
        assert sds["style"]["time_signature"] == "4/4"
        assert "key" in sds["style"]
        assert "mood" in sds["style"]

        # Verify lyrics defaults
        assert sds["lyrics"]["language"] == "en"
        assert len(sds["lyrics"]["section_order"]) > 0
        assert "constraints" in sds["lyrics"]
        assert sds["lyrics"]["constraints"]["explicit"] is False

        # Verify producer notes defaults
        assert "structure" in sds["producer_notes"]
        assert "hooks" in sds["producer_notes"]
        assert sds["producer_notes"]["hooks"] >= 0

    def test_compile_sds_with_all_defaults_is_deterministic(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that default generation is deterministic.

        Same inputs (same blueprint + same song seed) should produce
        identical SDS outputs across multiple compilations.
        """
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        # Compile twice with same inputs
        sds1 = sds_compiler.compile_sds(song_id, use_defaults=True)

        # Reset the mock to allow second call
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities
        sds2 = sds_compiler.compile_sds(song_id, use_defaults=True)

        # Compute hashes to verify determinism
        hash1 = sds_compiler._compute_sds_hash(sds1)
        hash2 = sds_compiler._compute_sds_hash(sds2)

        assert hash1 == hash2, "Same inputs should produce identical SDS"

        # Verify specific fields are identical
        assert sds1["style"] == sds2["style"]
        assert sds1["lyrics"] == sds2["lyrics"]
        assert sds1["producer_notes"] == sds2["producer_notes"]


class TestCompileSdsWithPartialDefaults(TestSDSCompilerWithDefaults):
    """Tests for SDS compilation with some entities present, some missing (mixed defaults)."""

    @pytest.fixture
    def sample_style(self):
        """Create sample style entity."""
        style = Mock()
        style.id = uuid4()
        style.genre = "Pop"
        style.sub_genres = []
        style.bpm_min = 110
        style.bpm_max = 120
        style.key = "C major"
        style.modulations = []
        style.mood = ["happy"]
        style.energy_level = 7
        style.instrumentation = ["synth"]
        style.tags_positive = ["upbeat"]
        style.tags_negative = []
        style.vocal_profile = None
        return style

    @pytest.fixture
    def partial_entities_with_style(
        self,
        sample_song,
        sample_blueprint,
        sample_style
    ):
        """Create entity set with only style present."""
        return {
            "song": sample_song,
            "style": sample_style,
            "lyrics": None,
            "producer_notes": None,
            "persona": None,
            "blueprint": sample_blueprint,
            "sources": []
        }

    def test_compile_sds_with_style_only_generates_lyrics_and_producer_defaults(
        self,
        sds_compiler,
        mock_song_repo,
        partial_entities_with_style,
        sample_song,
        sample_style
    ):
        """Test compilation with style present but lyrics and producer_notes missing."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = partial_entities_with_style

        sds = sds_compiler.compile_sds(song_id, use_defaults=True)

        # Verify style came from database (not generated)
        assert sds["style"]["tempo_bpm"] == [110, 120]  # From sample_style
        assert sds["style"]["mood"] == ["happy"]  # From sample_style

        # Verify lyrics were generated
        assert "lyrics" in sds
        assert sds["lyrics"]["language"] == "en"  # Default

        # Verify producer notes were generated
        assert "producer_notes" in sds
        assert "structure" in sds["producer_notes"]

    def test_compile_sds_producer_notes_uses_generated_lyrics_for_structure(
        self,
        sds_compiler,
        mock_song_repo,
        partial_entities_with_style,
        sample_song
    ):
        """Test that generated producer notes use generated lyrics section_order."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = partial_entities_with_style

        sds = sds_compiler.compile_sds(song_id, use_defaults=True)

        # The producer structure should be derived from lyrics section_order
        lyrics_sections = sds["lyrics"]["section_order"]
        producer_structure = sds["producer_notes"]["structure"]

        # Structure should be a dash-separated string of sections
        expected_structure = "-".join(lyrics_sections)
        assert producer_structure == expected_structure


class TestCompileSdsWithDefaultsDisabled(TestSDSCompilerWithDefaults):
    """Tests for use_defaults=False raising clear errors."""

    def test_compile_sds_with_missing_style_and_no_defaults_raises_error(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that missing style with use_defaults=False raises clear error."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        with pytest.raises(ValueError) as exc_info:
            sds_compiler.compile_sds(song_id, use_defaults=False)

        error_msg = str(exc_info.value)
        assert "style reference" in error_msg.lower()
        assert "use_defaults=False" in error_msg

    def test_compile_sds_with_missing_lyrics_and_no_defaults_raises_error(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that missing lyrics with use_defaults=False raises clear error."""
        song_id = sample_song.id

        # Add style so we get to lyrics check
        mock_style = Mock()
        mock_style.genre = "Pop"
        mock_style.bpm_min = 120
        mock_style.bpm_max = 120
        mock_style.key = "C major"
        mock_style.modulations = []
        mock_style.sub_genres = []
        mock_style.mood = ["neutral"]
        mock_style.energy_level = 5
        mock_style.instrumentation = []
        mock_style.tags_positive = []
        mock_style.tags_negative = []
        mock_style.vocal_profile = None

        minimal_entities["style"] = mock_style
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        with pytest.raises(ValueError) as exc_info:
            sds_compiler.compile_sds(song_id, use_defaults=False)

        error_msg = str(exc_info.value)
        assert "lyrics reference" in error_msg.lower()
        assert "use_defaults=False" in error_msg

    def test_compile_sds_with_missing_producer_notes_and_no_defaults_raises_error(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that missing producer_notes with use_defaults=False raises clear error."""
        song_id = sample_song.id

        # Add style and lyrics so we get to producer_notes check
        mock_style = Mock()
        mock_style.genre = "Pop"
        mock_style.bpm_min = 120
        mock_style.bpm_max = 120
        mock_style.key = "C major"
        mock_style.modulations = []
        mock_style.sub_genres = []
        mock_style.mood = ["neutral"]
        mock_style.energy_level = 5
        mock_style.instrumentation = []
        mock_style.tags_positive = []
        mock_style.tags_negative = []
        mock_style.vocal_profile = None

        mock_lyrics = Mock()
        mock_lyrics.language = "en"
        mock_lyrics.section_order = ["Verse", "Chorus"]
        mock_lyrics.pov = None
        mock_lyrics.tense = None
        mock_lyrics.themes = None
        mock_lyrics.rhyme_scheme = None
        mock_lyrics.meter = None
        mock_lyrics.syllables_per_line = None
        mock_lyrics.hook_strategy = None
        mock_lyrics.repetition_rules = None
        mock_lyrics.imagery_density = None
        mock_lyrics.reading_level = None
        mock_lyrics.explicit_allowed = False
        mock_lyrics.constraints = {"explicit": False}
        mock_lyrics.source_citations = None

        minimal_entities["style"] = mock_style
        minimal_entities["lyrics"] = mock_lyrics
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        with pytest.raises(ValueError) as exc_info:
            sds_compiler.compile_sds(song_id, use_defaults=False)

        error_msg = str(exc_info.value)
        assert "producer_notes reference" in error_msg.lower()
        assert "use_defaults=False" in error_msg


class TestCompileSdsMissingBlueprint(TestSDSCompilerWithDefaults):
    """Tests for missing blueprint scenarios."""

    def test_compile_sds_with_missing_blueprint_raises_error(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that missing blueprint raises error even with use_defaults=True."""
        song_id = sample_song.id
        minimal_entities["blueprint"] = None
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        with pytest.raises(ValueError) as exc_info:
            sds_compiler.compile_sds(song_id, use_defaults=True)

        error_msg = str(exc_info.value)
        assert "blueprint" in error_msg.lower()


class TestCompileSdsEntityCombinations(TestSDSCompilerWithDefaults):
    """Tests for various combinations of present/missing entities."""

    def test_all_combinations_with_defaults_succeed(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song,
        mock_validation_service
    ):
        """Test that all combinations of missing entities succeed with use_defaults=True.

        This test verifies that any combination of missing style, lyrics, and
        producer_notes can be handled by the default generation system.
        """
        song_id = sample_song.id

        # Helper to create mock entity
        def create_mock_style():
            m = Mock()
            m.genre = "Pop"
            m.sub_genres = []
            m.bpm_min = 120
            m.bpm_max = 120
            m.key = "C major"
            m.modulations = []
            m.mood = ["neutral"]
            m.energy_level = 5
            m.instrumentation = []
            m.tags_positive = []
            m.tags_negative = []
            m.vocal_profile = None
            return m

        def create_mock_lyrics():
            m = Mock()
            m.language = "en"
            m.section_order = ["Verse", "Chorus"]
            m.pov = "1st"
            m.tense = "present"
            m.themes = []
            m.rhyme_scheme = "AABB"
            m.meter = "4/4 pop"
            m.syllables_per_line = 8
            m.hook_strategy = "lyrical"
            m.repetition_rules = {"hook_count": 2}
            m.imagery_density = 5
            m.reading_level = 8
            m.explicit_allowed = False
            m.constraints = {"explicit": False, "max_lines": 120}
            m.source_citations = []
            return m

        def create_mock_producer():
            m = Mock()
            m.structure_string = "Verse-Chorus"
            m.structure = None
            m.hook_count = 2
            m.instrumentation_hints = None
            m.section_tags = None
            m.section_durations = None
            m.mix_targets = None
            return m

        # Test all 8 combinations (2^3 - each entity can be present or missing)
        combinations = [
            # (has_style, has_lyrics, has_producer_notes, description)
            (False, False, False, "all missing"),
            (True, False, False, "only style"),
            (False, True, False, "only lyrics"),
            (False, False, True, "only producer"),
            (True, True, False, "style + lyrics"),
            (True, False, True, "style + producer"),
            (False, True, True, "lyrics + producer"),
            (True, True, True, "all present"),
        ]

        for has_style, has_lyrics, has_producer, desc in combinations:
            # Set up entities based on combination (create fresh dict each time)
            entities = {
                "song": sample_song,
                "style": create_mock_style() if has_style else None,
                "lyrics": create_mock_lyrics() if has_lyrics else None,
                "producer_notes": create_mock_producer() if has_producer else None,
                "persona": None,
                "blueprint": minimal_entities["blueprint"],
                "sources": []
            }

            mock_song_repo.get_with_all_entities_for_sds.return_value = entities
            mock_validation_service.validate_sds.return_value = (True, [])

            # Should succeed for all combinations
            try:
                sds = sds_compiler.compile_sds(song_id, use_defaults=True)
                # Verify all required sections exist
                assert "style" in sds, f"Failed for combination: {desc}"
                assert "lyrics" in sds, f"Failed for combination: {desc}"
                assert "producer_notes" in sds, f"Failed for combination: {desc}"
            except Exception as e:
                pytest.fail(f"Compilation failed for combination '{desc}': {str(e)}")


class TestGeneratedEntityStructure(TestSDSCompilerWithDefaults):
    """Tests for the structure of generated entities."""

    def test_generated_style_has_all_required_fields(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that generated style includes all required SDS style fields."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        sds = sds_compiler.compile_sds(song_id, use_defaults=True)

        style = sds["style"]

        # Required fields from SDS schema
        assert "genre_detail" in style
        assert "primary" in style["genre_detail"]
        assert "tempo_bpm" in style
        assert "time_signature" in style
        assert "key" in style
        assert "primary" in style["key"]
        assert "mood" in style
        assert isinstance(style["mood"], list)

    def test_generated_lyrics_has_all_required_fields(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that generated lyrics includes all required SDS lyrics fields."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        sds = sds_compiler.compile_sds(song_id, use_defaults=True)

        lyrics = sds["lyrics"]

        # Required fields from SDS schema
        assert "language" in lyrics
        assert "section_order" in lyrics
        assert "constraints" in lyrics
        assert "explicit" in lyrics["constraints"]
        assert isinstance(lyrics["section_order"], list)
        assert len(lyrics["section_order"]) > 0

    def test_generated_producer_notes_has_all_required_fields(
        self,
        sds_compiler,
        mock_song_repo,
        minimal_entities,
        sample_song
    ):
        """Test that generated producer notes includes all required SDS fields."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities

        sds = sds_compiler.compile_sds(song_id, use_defaults=True)

        producer_notes = sds["producer_notes"]

        # Required fields from SDS schema
        assert "structure" in producer_notes
        assert "hooks" in producer_notes
        assert isinstance(producer_notes["hooks"], int)
        assert producer_notes["hooks"] >= 0


class TestDefaultsValidationIntegration(TestSDSCompilerWithDefaults):
    """Tests for validation integration with generated defaults."""

    def test_generated_defaults_pass_validation(
        self,
        sds_compiler,
        mock_song_repo,
        mock_validation_service,
        minimal_entities,
        sample_song
    ):
        """Test that SDS with all generated defaults passes validation."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = minimal_entities
        mock_validation_service.validate_sds.return_value = (True, [])

        sds = sds_compiler.compile_sds(song_id, use_defaults=True, validate=True)

        # Validation should have been called
        mock_validation_service.validate_sds.assert_called_once()

        # Should succeed
        assert sds is not None
        assert "style" in sds
        assert "lyrics" in sds
        assert "producer_notes" in sds
