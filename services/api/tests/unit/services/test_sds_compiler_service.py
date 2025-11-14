"""Unit tests for SDSCompilerService.

Tests cover:
- Successful SDS compilation with all entities
- Compilation failure scenarios (missing entities)
- Source weight normalization
- Deterministic hash computation
- Validation integration
"""

import pytest
from unittest.mock import Mock, MagicMock
from uuid import uuid4, UUID
from typing import Dict, Any

from app.services.sds_compiler_service import SDSCompilerService


class TestSDSCompilerService:
    """Test suite for SDS compilation service."""

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
    def sds_compiler(
        self,
        mock_song_repo,
        mock_style_repo,
        mock_lyrics_repo,
        mock_producer_notes_repo,
        mock_persona_repo,
        mock_blueprint_repo,
        mock_source_repo,
        mock_validation_service
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
            validation_service=mock_validation_service
        )

    @pytest.fixture
    def sample_song(self):
        """Create sample song entity."""
        song = Mock()
        song.id = uuid4()
        song.title = "Test Song"
        song.global_seed = 42
        song.render_config = {
            "prompt_controls": {
                "positive_tags": ["upbeat", "energetic"],
                "negative_tags": ["slow", "sad"],
                "max_style_chars": 1000,
                "max_prompt_chars": 5000
            },
            "render": {
                "engine": "none",
                "model": None,
                "num_variations": 2
            }
        }
        return song

    @pytest.fixture
    def sample_style(self):
        """Create sample style entity."""
        style = Mock()
        style.id = uuid4()
        style.genre = "Pop"
        style.sub_genres = ["Dance-Pop"]
        style.bpm_min = 120
        style.bpm_max = 128
        style.key = "C major"
        style.modulations = []
        style.mood = ["upbeat", "energetic"]
        style.energy_level = 8
        style.instrumentation = ["synth", "drums", "bass"]
        style.tags_positive = ["catchy", "radio-friendly"]
        style.tags_negative = ["slow"]
        style.vocal_profile = {
            "voice": "female",
            "range": "alto",
            "delivery": "smooth"
        }
        return style

    @pytest.fixture
    def sample_lyrics(self):
        """Create sample lyrics entity."""
        lyrics = Mock()
        lyrics.id = uuid4()
        lyrics.language = "en"
        lyrics.section_order = ["verse", "chorus", "verse", "chorus", "bridge"]
        lyrics.pov = "first-person"
        lyrics.tense = "present"
        lyrics.themes = ["love", "summer"]
        lyrics.rhyme_scheme = "ABAB"
        lyrics.meter = "iambic tetrameter"
        lyrics.syllables_per_line = 8
        lyrics.hook_strategy = "repeat-chorus"
        lyrics.repetition_rules = {"hook_count": 4}
        lyrics.imagery_density = 7
        lyrics.reading_level = 8
        lyrics.explicit_allowed = False
        lyrics.constraints = {
            "explicit": False,
            "max_section_lines": 8
        }
        lyrics.source_citations = [
            {"source_id": "source_1", "chunk_hash": "abc123"}
        ]
        return lyrics

    @pytest.fixture
    def sample_producer_notes(self):
        """Create sample producer notes entity."""
        notes = Mock()
        notes.id = uuid4()
        notes.structure_string = "Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        notes.structure = None
        notes.hook_count = 3
        notes.instrumentation_hints = {
            "global": ["synth", "drums"]
        }
        notes.section_tags = {
            "verse": ["soft", "melodic"],
            "chorus": ["energetic", "loud"]
        }
        notes.section_durations = {
            "verse": 20,
            "chorus": 15
        }
        notes.mix_targets = {
            "loudness_lufs": -14.0,
            "space": "wide",
            "stereo_width": 0.8
        }
        return notes

    @pytest.fixture
    def sample_persona(self):
        """Create sample persona entity."""
        persona = Mock()
        persona.id = uuid4()
        persona.name = "Pop Star"
        return persona

    @pytest.fixture
    def sample_blueprint(self):
        """Create sample blueprint entity."""
        blueprint = Mock()
        blueprint.id = uuid4()
        blueprint.genre = "Pop"
        blueprint.version = "1.0.0"
        return blueprint

    @pytest.fixture
    def sample_sources(self):
        """Create sample source entities."""
        source1 = Mock()
        source1.id = uuid4()
        source1.name = "source_1"
        source1.kind = "file"
        source1.config = {"path": "/data/source1.txt"}
        source1.scopes = ["lyrics", "themes"]
        source1.weight = 0.6
        source1.allow = []
        source1.deny = []
        source1.provenance = True
        source1.mcp_server_id = None

        source2 = Mock()
        source2.id = uuid4()
        source2.name = "source_2"
        source2.kind = "web"
        source2.config = {"url": "https://example.com"}
        source2.scopes = ["inspiration"]
        source2.weight = 0.4
        source2.allow = []
        source2.deny = []
        source2.provenance = True
        source2.mcp_server_id = None

        return [source1, source2]

    @pytest.fixture
    def complete_entities(
        self,
        sample_song,
        sample_style,
        sample_lyrics,
        sample_producer_notes,
        sample_persona,
        sample_blueprint,
        sample_sources
    ):
        """Create complete entity set for successful compilation."""
        return {
            "song": sample_song,
            "style": sample_style,
            "lyrics": sample_lyrics,
            "producer_notes": sample_producer_notes,
            "persona": sample_persona,
            "blueprint": sample_blueprint,
            "sources": sample_sources
        }


class TestCompileSdsSuccess(TestSDSCompilerService):
    """Tests for successful SDS compilation."""

    def test_compile_sds_success_with_all_entities(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities,
        sample_song
    ):
        """Test successful SDS compilation with all entities present."""
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Verify structure
        assert sds["title"] == "Test Song"
        assert sds["seed"] == 42
        assert "style" in sds
        assert "lyrics" in sds
        assert "producer_notes" in sds
        assert "blueprint_ref" in sds
        assert "sources" in sds
        assert "prompt_controls" in sds
        assert "render" in sds

        # Verify blueprint reference
        assert sds["blueprint_ref"]["genre"] == "Pop"
        assert sds["blueprint_ref"]["version"] == "1.0.0"

        # Verify style structure
        assert sds["style"]["genre_detail"]["primary"] == "Pop"
        assert sds["style"]["tempo_bpm"] == [120, 128]
        assert sds["style"]["key"]["primary"] == "C major"
        assert sds["style"]["mood"] == ["upbeat", "energetic"]
        assert len(sds["style"]["instrumentation"]) <= 3

        # Verify lyrics structure
        assert sds["lyrics"]["language"] == "en"
        assert sds["lyrics"]["section_order"] == ["verse", "chorus", "verse", "chorus", "bridge"]
        assert sds["lyrics"]["pov"] == "first-person"
        assert sds["lyrics"]["constraints"]["explicit"] is False

        # Verify producer notes structure
        assert sds["producer_notes"]["structure"] == "Verse-Chorus-Verse-Chorus-Bridge-Chorus"
        assert sds["producer_notes"]["hooks"] == 3
        assert "section_meta" in sds["producer_notes"]
        assert "mix" in sds["producer_notes"]

        # Verify persona
        assert sds["persona_id"] == str(complete_entities["persona"].id)

        # Verify sources
        assert len(sds["sources"]) == 2
        assert sds["sources"][0]["name"] == "source_1"

        # Verify prompt controls
        assert sds["prompt_controls"]["positive_tags"] == ["upbeat", "energetic"]
        assert sds["prompt_controls"]["max_style_chars"] == 1000

        # Verify repository called correctly
        mock_song_repo.get_with_all_entities_for_sds.assert_called_once_with(song_id)

    def test_compile_sds_without_persona(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test successful compilation when persona is None (optional)."""
        complete_entities["persona"] = None
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Should succeed with persona_id as None
        assert sds["persona_id"] is None
        assert "style" in sds
        assert "lyrics" in sds

    def test_compile_sds_with_empty_sources(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test compilation with no sources (empty list)."""
        complete_entities["sources"] = []
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Should succeed with empty sources
        assert sds["sources"] == []

    def test_compile_sds_with_minimal_render_config(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities,
        sample_song
    ):
        """Test compilation handles missing render_config fields with defaults."""
        sample_song.render_config = None
        song_id = sample_song.id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Should have default values
        assert sds["prompt_controls"]["positive_tags"] == []
        assert sds["prompt_controls"]["max_style_chars"] == 1000
        assert sds["render"]["engine"] == "none"
        assert sds["render"]["num_variations"] == 2


class TestCompileSdsFailures(TestSDSCompilerService):
    """Tests for compilation failure scenarios."""

    def test_compile_sds_song_not_found(
        self,
        sds_compiler,
        mock_song_repo
    ):
        """Test compilation fails when song not found."""
        song_id = uuid4()
        mock_song_repo.get_with_all_entities_for_sds.return_value = None

        with pytest.raises(ValueError, match="not found or inaccessible"):
            sds_compiler.compile_sds(song_id)

    def test_compile_sds_missing_style(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test compilation fails when style is missing."""
        complete_entities["style"] = None
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        with pytest.raises(ValueError, match="Style specification"):
            sds_compiler.compile_sds(song_id)

    def test_compile_sds_missing_lyrics(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test compilation fails when lyrics is missing."""
        complete_entities["lyrics"] = None
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        with pytest.raises(ValueError, match="Lyrics"):
            sds_compiler.compile_sds(song_id)

    def test_compile_sds_missing_producer_notes(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test compilation fails when producer notes is missing."""
        complete_entities["producer_notes"] = None
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        with pytest.raises(ValueError, match="Producer notes"):
            sds_compiler.compile_sds(song_id)

    def test_compile_sds_missing_blueprint(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test compilation fails when blueprint is missing."""
        complete_entities["blueprint"] = None
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        with pytest.raises(ValueError, match="Blueprint"):
            sds_compiler.compile_sds(song_id)


class TestSourceWeightNormalization(TestSDSCompilerService):
    """Tests for source weight normalization logic."""

    def test_normalize_weights_sum_to_one(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test that source weights are normalized to sum to 1.0."""
        # Set weights that don't sum to 1.0
        complete_entities["sources"][0].weight = 3.0
        complete_entities["sources"][1].weight = 2.0
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Weights should be normalized: 3/5 = 0.6, 2/5 = 0.4
        total_weight = sum(src["weight"] for src in sds["sources"])
        assert abs(total_weight - 1.0) < 0.0001
        assert sds["sources"][0]["weight"] == 0.6
        assert sds["sources"][1]["weight"] == 0.4

    def test_normalize_all_zero_weights(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test equal distribution when all weights are zero."""
        complete_entities["sources"][0].weight = 0.0
        complete_entities["sources"][1].weight = 0.0
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Should get equal weights: 1/2 = 0.5 each
        assert sds["sources"][0]["weight"] == 0.5
        assert sds["sources"][1]["weight"] == 0.5
        total_weight = sum(src["weight"] for src in sds["sources"])
        assert abs(total_weight - 1.0) < 0.0001

    def test_normalize_negative_weights(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test equal distribution when weights are negative."""
        complete_entities["sources"][0].weight = -1.0
        complete_entities["sources"][1].weight = -2.0
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Negative weights treated as invalid, should get equal distribution
        assert sds["sources"][0]["weight"] == 0.5
        assert sds["sources"][1]["weight"] == 0.5

    def test_normalize_single_source(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test normalization with single source."""
        complete_entities["sources"] = [complete_entities["sources"][0]]
        complete_entities["sources"][0].weight = 5.0
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id)

        # Single source should get weight 1.0
        assert len(sds["sources"]) == 1
        assert sds["sources"][0]["weight"] == 1.0


class TestDeterministicHash(TestSDSCompilerService):
    """Tests for deterministic hash computation."""

    def test_same_input_produces_same_hash(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test that same input produces identical hash."""
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        # Compile twice with same input
        sds1 = sds_compiler.compile_sds(song_id)
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities
        sds2 = sds_compiler.compile_sds(song_id)

        # Hashes should be identical (hash is computed but not added to SDS in current impl)
        # We'll verify by calling _compute_sds_hash directly
        hash1 = sds_compiler._compute_sds_hash(sds1)
        hash2 = sds_compiler._compute_sds_hash(sds2)

        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 produces 64 hex chars

    def test_different_input_produces_different_hash(
        self,
        sds_compiler,
        mock_song_repo,
        complete_entities
    ):
        """Test that different input produces different hash."""
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        # First compilation
        sds1 = sds_compiler.compile_sds(song_id)

        # Change the seed for second compilation
        complete_entities["song"].global_seed = 999
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities
        sds2 = sds_compiler.compile_sds(song_id)

        # Hashes should be different
        hash1 = sds_compiler._compute_sds_hash(sds1)
        hash2 = sds_compiler._compute_sds_hash(sds2)

        assert hash1 != hash2

    def test_hash_excludes_metadata_fields(
        self,
        sds_compiler
    ):
        """Test that hash excludes metadata fields."""
        sds1 = {
            "title": "Test",
            "seed": 42,
            "_computed_hash": "old_hash",
            "compiled_at": "2025-01-01T00:00:00Z",
            "compiler_version": "1.0.0"
        }

        sds2 = {
            "title": "Test",
            "seed": 42,
            "_computed_hash": "different_hash",
            "compiled_at": "2025-12-31T23:59:59Z",
            "compiler_version": "2.0.0"
        }

        # Hashes should be the same because metadata is excluded
        hash1 = sds_compiler._compute_sds_hash(sds1)
        hash2 = sds_compiler._compute_sds_hash(sds2)

        assert hash1 == hash2


class TestValidationIntegration(TestSDSCompilerService):
    """Tests for validation service integration."""

    def test_validation_enabled_by_default(
        self,
        sds_compiler,
        mock_song_repo,
        mock_validation_service,
        complete_entities
    ):
        """Test that validation is called by default."""
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities
        mock_validation_service.validate_sds.return_value = (True, [])

        sds = sds_compiler.compile_sds(song_id)

        # Validation should have been called
        mock_validation_service.validate_sds.assert_called_once()
        assert sds is not None

    def test_validation_can_be_disabled(
        self,
        sds_compiler,
        mock_song_repo,
        mock_validation_service,
        complete_entities
    ):
        """Test that validation can be disabled via parameter."""
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities

        sds = sds_compiler.compile_sds(song_id, validate=False)

        # Validation should NOT have been called
        mock_validation_service.validate_sds.assert_not_called()
        assert sds is not None

    def test_validation_errors_propagate(
        self,
        sds_compiler,
        mock_song_repo,
        mock_validation_service,
        complete_entities
    ):
        """Test that validation errors are propagated correctly."""
        song_id = complete_entities["song"].id
        mock_song_repo.get_with_all_entities_for_sds.return_value = complete_entities
        mock_validation_service.validate_sds.return_value = (
            False,
            ["Missing required field: 'style'", "Invalid tempo value"]
        )

        with pytest.raises(ValueError) as exc_info:
            sds_compiler.compile_sds(song_id)

        error_msg = str(exc_info.value)
        assert "SDS validation failed" in error_msg
        assert "Missing required field" in error_msg
        assert "Invalid tempo value" in error_msg


class TestStyleConversion(TestSDSCompilerService):
    """Tests for style entity to SDS style conversion."""

    def test_tempo_bpm_single_value(
        self,
        sds_compiler,
        sample_style
    ):
        """Test tempo_bpm conversion when min equals max."""
        sample_style.bpm_min = 120
        sample_style.bpm_max = 120

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert style_dict["tempo_bpm"] == 120

    def test_tempo_bpm_range(
        self,
        sds_compiler,
        sample_style
    ):
        """Test tempo_bpm conversion for range."""
        sample_style.bpm_min = 120
        sample_style.bpm_max = 140

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert style_dict["tempo_bpm"] == [120, 140]

    def test_tempo_bpm_default(
        self,
        sds_compiler,
        sample_style
    ):
        """Test tempo_bpm default when not specified."""
        sample_style.bpm_min = None
        sample_style.bpm_max = None

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert style_dict["tempo_bpm"] == 120

    def test_energy_level_mapping(
        self,
        sds_compiler,
        sample_style
    ):
        """Test energy level to energy enum mapping."""
        test_cases = [
            (1, "low"),
            (3, "low"),
            (4, "medium"),
            (7, "medium"),
            (8, "high"),
            (9, "high"),
            (10, "anthemic"),
            (None, None)
        ]

        for level, expected in test_cases:
            sample_style.energy_level = level
            style_dict = sds_compiler._style_to_dict(sample_style)

            if expected is None:
                assert "energy" not in style_dict
            else:
                assert style_dict["energy"] == expected

    def test_instrumentation_max_three(
        self,
        sds_compiler,
        sample_style
    ):
        """Test that instrumentation is limited to max 3 items."""
        sample_style.instrumentation = ["synth", "drums", "bass", "guitar", "piano"]

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert len(style_dict["instrumentation"]) == 3
        assert style_dict["instrumentation"] == ["synth", "drums", "bass"]

    def test_vocal_profile_conversion(
        self,
        sds_compiler,
        sample_style
    ):
        """Test vocal profile dict to string conversion."""
        sample_style.vocal_profile = {
            "voice": "female",
            "range": "alto",
            "delivery": "smooth"
        }

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert style_dict["vocal_profile"] == "female (alto) smooth"


class TestLyricsConversion(TestSDSCompilerService):
    """Tests for lyrics entity to SDS lyrics conversion."""

    def test_imagery_density_scaling(
        self,
        sds_compiler,
        sample_lyrics
    ):
        """Test imagery density conversion from 1-10 to 0.0-1.0."""
        sample_lyrics.imagery_density = 7

        lyrics_dict = sds_compiler._lyrics_to_dict(sample_lyrics)

        assert lyrics_dict["imagery_density"] == 0.7

    def test_repetition_policy_from_hook_count(
        self,
        sds_compiler,
        sample_lyrics
    ):
        """Test repetition policy derived from hook count."""
        test_cases = [
            ({"hook_count": 5}, "hook-heavy"),
            ({"hook_count": 3}, "moderate"),
            ({"hook_count": 1}, "sparse"),
        ]

        for rules, expected_policy in test_cases:
            sample_lyrics.repetition_rules = rules
            lyrics_dict = sds_compiler._lyrics_to_dict(sample_lyrics)
            assert lyrics_dict["repetition_policy"] == expected_policy

    def test_constraints_includes_explicit(
        self,
        sds_compiler,
        sample_lyrics
    ):
        """Test that explicit field is always in constraints."""
        sample_lyrics.explicit_allowed = True
        sample_lyrics.constraints = {"max_lines": 10}

        lyrics_dict = sds_compiler._lyrics_to_dict(sample_lyrics)

        assert lyrics_dict["constraints"]["explicit"] is True
        assert lyrics_dict["constraints"]["max_lines"] == 10


class TestProducerNotesConversion(TestSDSCompilerService):
    """Tests for producer notes entity to SDS conversion."""

    def test_structure_from_string(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test structure uses structure_string if available."""
        sample_producer_notes.structure_string = "V-C-V-C-B"
        sample_producer_notes.structure = None

        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert notes_dict["structure"] == "V-C-V-C-B"

    def test_structure_from_array(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test structure built from array when string not available."""
        sample_producer_notes.structure_string = None
        sample_producer_notes.structure = ["Verse", "Chorus", "Bridge"]

        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert notes_dict["structure"] == "Verse-Chorus-Bridge"

    def test_structure_empty_when_none(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test structure is empty string when not specified."""
        sample_producer_notes.structure_string = None
        sample_producer_notes.structure = None

        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert notes_dict["structure"] == ""

    def test_section_meta_aggregation(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test section_meta combines tags and durations."""
        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert "section_meta" in notes_dict
        assert notes_dict["section_meta"]["verse"]["tags"] == ["soft", "melodic"]
        assert notes_dict["section_meta"]["verse"]["target_duration_sec"] == 20
        assert notes_dict["section_meta"]["chorus"]["tags"] == ["energetic", "loud"]
        assert notes_dict["section_meta"]["chorus"]["target_duration_sec"] == 15

    def test_section_meta_tags_only(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test section_meta with only tags (no durations)."""
        sample_producer_notes.section_durations = None

        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert "section_meta" in notes_dict
        assert "tags" in notes_dict["section_meta"]["verse"]
        assert "target_duration_sec" not in notes_dict["section_meta"]["verse"]

    def test_section_meta_durations_only(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test section_meta with only durations (no tags)."""
        sample_producer_notes.section_tags = None

        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert "section_meta" in notes_dict
        assert "target_duration_sec" in notes_dict["section_meta"]["verse"]
        assert "tags" not in notes_dict["section_meta"]["verse"]

    def test_instrumentation_hints_as_list(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test instrumentation hints when provided as list."""
        sample_producer_notes.instrumentation_hints = ["synth", "drums", "bass"]

        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert notes_dict["instrumentation"] == ["synth", "drums", "bass"]

    def test_mix_object_construction(
        self,
        sds_compiler,
        sample_producer_notes
    ):
        """Test mix object built from mix_targets."""
        notes_dict = sds_compiler._producer_notes_to_dict(sample_producer_notes)

        assert "mix" in notes_dict
        assert notes_dict["mix"]["lufs"] == -14.0
        assert notes_dict["mix"]["space"] == "wide"
        assert notes_dict["mix"]["stereo_width"] == 0.8


class TestStyleEdgeCases(TestSDSCompilerService):
    """Tests for style conversion edge cases."""

    def test_tempo_bpm_only_min(
        self,
        sds_compiler,
        sample_style
    ):
        """Test tempo_bpm when only min is specified."""
        sample_style.bpm_min = 120
        sample_style.bpm_max = None

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert style_dict["tempo_bpm"] == 120

    def test_tempo_bpm_only_max(
        self,
        sds_compiler,
        sample_style
    ):
        """Test tempo_bpm when only max is specified."""
        sample_style.bpm_min = None
        sample_style.bpm_max = 140

        style_dict = sds_compiler._style_to_dict(sample_style)

        assert style_dict["tempo_bpm"] == 140
