"""Unit tests for blueprint markdown parser."""

import pytest
from pathlib import Path
from app.utils.blueprint_parser import (
    _extract_tempo_range,
    _extract_key_preferences,
    _extract_section_requirements,
    _extract_genre_from_filename,
    _infer_eval_rubric,
    _infer_conflict_matrix,
    BlueprintParseError,
    parse_blueprint_file,
)


class TestTempoExtraction:
    """Tests for tempo range extraction."""

    def test_extract_tempo_range_standard(self):
        """Test extraction of standard tempo range."""
        text = "Most pop hits fall between 95–130 BPM for dance tracks."
        result = _extract_tempo_range(text)
        assert result == (95, 130)

    def test_extract_tempo_range_with_hyphen(self):
        """Test extraction with regular hyphen."""
        text = "Tempo ranges from 100-140 BPM."
        result = _extract_tempo_range(text)
        assert result == (100, 140)

    def test_extract_tempo_range_with_around(self):
        """Test extraction with 'around' keyword."""
        text = "Songs typically sit around 70–80 BPM."
        result = _extract_tempo_range(text)
        assert result == (70, 80)

    def test_extract_tempo_range_single_value(self):
        """Test extraction of single BPM value creates range."""
        text = "Standard tempo is 120 BPM."
        result = _extract_tempo_range(text)
        assert result == (110, 130)  # ±10 BPM range

    def test_extract_tempo_range_not_found(self):
        """Test when no tempo found."""
        text = "This text has no tempo information."
        result = _extract_tempo_range(text)
        assert result is None


class TestKeyExtraction:
    """Tests for key preferences extraction."""

    def test_extract_major_keys(self):
        """Test extraction of major keys."""
        text = "Major keys (C, G, D, A) dominate upbeat songs."
        result = _extract_key_preferences(text)
        assert "C major" in result
        assert "G major" in result
        assert "D major" in result
        assert "A major" in result

    def test_extract_minor_keys(self):
        """Test extraction of minor keys."""
        text = "Minor keys (A minor, E minor) create dark moods."
        result = _extract_key_preferences(text)
        assert "A minor" in result
        assert "E minor" in result

    def test_extract_mixed_keys(self):
        """Test extraction of both major and minor keys."""
        text = "Both F major and D minor are common."
        result = _extract_key_preferences(text)
        assert "F major" in result
        assert "D minor" in result

    def test_no_keys_returns_default(self):
        """Test default key when none found."""
        text = "No key information here."
        result = _extract_key_preferences(text)
        assert result == ["C major"]


class TestSectionExtraction:
    """Tests for section requirements extraction."""

    def test_extract_common_sections(self):
        """Test extraction of common sections."""
        text = """
        Form: Verse → Pre-Chorus → Chorus is most common.
        Many songs include a Bridge and an Intro.
        """
        result = _extract_section_requirements(text)
        assert "Verse" in result
        assert "Chorus" in result
        assert "Bridge" in result
        assert "Intro" in result

    def test_ensures_minimum_structure(self):
        """Test that minimum verse/chorus structure is always present."""
        text = "No explicit sections mentioned."
        result = _extract_section_requirements(text)
        assert "Verse" in result
        assert "Chorus" in result

    def test_extract_edm_sections(self):
        """Test extraction of EDM-specific sections."""
        text = "Structure alternates between build and drop sections."
        result = _extract_section_requirements(text)
        assert "Build" in result
        assert "Drop" in result


class TestGenreFromFilename:
    """Tests for genre name extraction from filename."""

    def test_extract_simple_genre(self):
        """Test extraction from simple filename."""
        filepath = Path("/path/to/pop_blueprint.md")
        result = _extract_genre_from_filename(filepath)
        assert result == "Pop"

    def test_extract_compound_genre(self):
        """Test extraction from compound genre name."""
        filepath = Path("/path/to/hip_hop_blueprint.md")
        result = _extract_genre_from_filename(filepath)
        assert result == "Hip-Hop"

    def test_extract_special_cases(self):
        """Test extraction with special case replacements."""
        test_cases = [
            ("hiphop_blueprint.md", "Hip-Hop"),
            ("rnb_blueprint.md", "R&B"),
            ("ccm_blueprint.md", "CCM"),
            ("kpop_blueprint.md", "K-Pop"),
            ("pop_punk_blueprint.md", "Pop-Punk"),
        ]
        for filename, expected in test_cases:
            filepath = Path(f"/path/to/{filename}")
            result = _extract_genre_from_filename(filepath)
            assert result == expected, f"Failed for {filename}"


class TestEvalRubricInference:
    """Tests for evaluation rubric inference."""

    def test_pop_weights(self):
        """Test pop genre rubric weights."""
        rubric = _infer_eval_rubric("Pop", "sample text")
        assert rubric["weights"]["hook_density"] == 0.30  # Higher for pop
        assert rubric["weights"]["singability"] == 0.25
        assert rubric["thresholds"]["min_total"] == 0.75

    def test_hiphop_weights(self):
        """Test hip-hop genre rubric weights."""
        rubric = _infer_eval_rubric("Hip-Hop", "sample text")
        assert rubric["weights"]["rhyme_tightness"] == 0.35  # Higher for hip-hop
        assert rubric["thresholds"]["min_total"] == 0.75

    def test_rock_weights(self):
        """Test rock genre rubric weights."""
        rubric = _infer_eval_rubric("Rock", "sample text")
        assert rubric["weights"]["section_completeness"] == 0.25  # Higher for rock
        assert rubric["thresholds"]["min_total"] == 0.75

    def test_christmas_inherits_pop_weights(self):
        """Test that Christmas genre uses pop weights."""
        rubric = _infer_eval_rubric("Christmas Pop", "sample text")
        assert rubric["weights"]["hook_density"] == 0.30


class TestConflictMatrix:
    """Tests for conflict matrix inference."""

    def test_has_common_conflicts(self):
        """Test that conflict matrix includes common conflicts."""
        matrix = _infer_conflict_matrix("Pop")

        assert "whisper" in matrix
        assert "anthemic" in matrix["whisper"]

        assert "minimal" in matrix
        assert "full instrumentation" in matrix["minimal"]

        assert "dry mix" in matrix
        assert "lush reverb" in matrix["dry mix"]


class TestBlueprintFileParsing:
    """Integration tests for full blueprint file parsing."""

    @pytest.fixture
    def blueprint_dir(self):
        """Get the blueprint directory path."""
        # Assuming tests run from services/api
        return Path(__file__).parent.parent.parent.parent.parent / "docs" / "hit_song_blueprint" / "AI"

    def test_parse_pop_blueprint(self, blueprint_dir):
        """Test parsing of pop blueprint file."""
        if not blueprint_dir.exists():
            pytest.skip("Blueprint directory not found")

        pop_file = blueprint_dir / "pop_blueprint.md"
        if not pop_file.exists():
            pytest.skip("Pop blueprint file not found")

        result = parse_blueprint_file(pop_file)

        assert result["genre"] == "Pop"
        assert result["version"] == "2025.11"
        assert "rules" in result
        assert "eval_rubric" in result
        assert "conflict_matrix" in result
        assert "tag_categories" in result

        # Check rules structure
        assert "tempo_bpm" in result["rules"]
        assert isinstance(result["rules"]["tempo_bpm"], list)
        assert len(result["rules"]["tempo_bpm"]) == 2

        # Check eval rubric structure
        assert "weights" in result["eval_rubric"]
        assert "thresholds" in result["eval_rubric"]
        assert "min_total" in result["eval_rubric"]["thresholds"]

    def test_parse_hiphop_blueprint(self, blueprint_dir):
        """Test parsing of hip-hop blueprint file."""
        if not blueprint_dir.exists():
            pytest.skip("Blueprint directory not found")

        hiphop_file = blueprint_dir / "hiphop_blueprint.md"
        if not hiphop_file.exists():
            pytest.skip("Hip-hop blueprint file not found")

        result = parse_blueprint_file(hiphop_file)

        assert result["genre"] == "Hip-Hop"
        assert result["rules"]["tempo_bpm"] == [60, 100]

    def test_parse_invalid_file(self, tmp_path):
        """Test parsing of invalid/empty file."""
        invalid_file = tmp_path / "invalid_blueprint.md"
        invalid_file.write_text("")

        # Should not raise error but may have defaults
        result = parse_blueprint_file(invalid_file)
        assert "genre" in result
        assert "rules" in result
