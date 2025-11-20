"""Unit tests for Blueprint Parser Service.

Tests the parsing of genre blueprint markdown files into structured data.
"""

import pytest
from pathlib import Path

from app.services.blueprint_parser_service import BlueprintParserService


@pytest.fixture
def parser_service():
    """Create a blueprint parser service instance."""
    return BlueprintParserService()


class TestBlueprintParserService:
    """Test suite for BlueprintParserService."""

    def test_get_all_blueprint_genres(self, parser_service):
        """Test discovery of all blueprint genre files."""
        genres = parser_service.get_all_blueprint_genres()

        # Should find multiple genres
        assert len(genres) > 0

        # Should include common genres
        expected_genres = ['pop', 'hip-hop', 'rock', 'country', 'christmas']
        for genre in expected_genres:
            # Check if any genre matches (handle variations like hiphop vs hip-hop)
            genre_found = any(genre.replace('-', '') in g.replace('-', '') for g in genres)
            assert genre_found, f"Expected genre '{genre}' not found in {genres}"

        # Should not include excluded files
        assert 'general_fingerprint' not in genres
        assert 'comparative_matrix' not in genres
        assert 'design_checklists' not in genres

    def test_parse_pop_blueprint(self, parser_service):
        """Test parsing of pop blueprint file."""
        data = parser_service.parse_blueprint_file("pop")

        # Verify basic structure
        assert data['genre'] == 'pop'
        assert data['version'] == '2025.11'

        # Verify rules
        assert 'tempo_bpm' in data['rules']
        assert isinstance(data['rules']['tempo_bpm'], list)
        assert len(data['rules']['tempo_bpm']) == 2
        assert data['rules']['tempo_bpm'][0] < data['rules']['tempo_bpm'][1]

        # Pop should have tempo around 95-130 BPM
        assert 90 <= data['rules']['tempo_bpm'][0] <= 100
        assert 125 <= data['rules']['tempo_bpm'][1] <= 135

        # Verify required sections
        assert 'required_sections' in data['rules']
        assert isinstance(data['rules']['required_sections'], list)
        assert len(data['rules']['required_sections']) >= 2
        assert 'Verse' in data['rules']['required_sections']
        assert 'Chorus' in data['rules']['required_sections']

        # Verify length constraints
        assert 'length_minutes' in data['rules']
        assert isinstance(data['rules']['length_minutes'], list)
        assert len(data['rules']['length_minutes']) == 2

        # Verify eval rubric
        assert 'eval_rubric' in data
        assert 'weights' in data['eval_rubric']
        assert 'thresholds' in data['eval_rubric']

        # Check rubric weights
        weights = data['eval_rubric']['weights']
        assert 'hook_density' in weights
        assert 'singability' in weights
        assert 'rhyme_tightness' in weights
        assert 'section_completeness' in weights
        assert 'profanity_score' in weights

        # Weights should sum to approximately 1.0
        total_weight = sum(weights.values())
        assert 0.99 <= total_weight <= 1.01

        # Verify thresholds
        thresholds = data['eval_rubric']['thresholds']
        assert 'min_total' in thresholds
        assert 0.0 <= thresholds['min_total'] <= 1.0

        # Verify metadata
        assert 'extra_metadata' in data
        assert 'source_file' in data['extra_metadata']
        assert data['extra_metadata']['source_file'] == 'pop_blueprint.md'

    def test_parse_hiphop_blueprint(self, parser_service):
        """Test parsing of hip-hop blueprint file."""
        # Try both possible filenames
        try:
            data = parser_service.parse_blueprint_file("hiphop")
        except FileNotFoundError:
            data = parser_service.parse_blueprint_file("hip-hop")

        # Verify basic structure
        assert data['genre'] in ['hiphop', 'hip-hop']
        assert data['version'] == '2025.11'

        # Hip-hop should have lower tempo range (60-100 BPM typically)
        assert 'tempo_bpm' in data['rules']
        assert data['rules']['tempo_bpm'][0] >= 50
        assert data['rules']['tempo_bpm'][1] <= 110

        # Verify required sections
        assert 'required_sections' in data['rules']
        assert len(data['rules']['required_sections']) >= 1

    def test_parse_christmas_blueprint(self, parser_service):
        """Test parsing of Christmas blueprint file."""
        data = parser_service.parse_blueprint_file("christmas")

        # Verify basic structure
        assert data['genre'] == 'christmas'
        assert data['version'] == '2025.11'

        # Christmas should have moderate tempo (100-130 BPM)
        assert 'tempo_bpm' in data['rules']
        assert 95 <= data['rules']['tempo_bpm'][0] <= 105
        assert 125 <= data['rules']['tempo_bpm'][1] <= 135

        # Verify metadata includes description
        assert 'extra_metadata' in data
        assert 'description' in data['extra_metadata']

    def test_parse_nonexistent_blueprint(self, parser_service):
        """Test parsing of non-existent blueprint file."""
        with pytest.raises(FileNotFoundError):
            parser_service.parse_blueprint_file("nonexistent_genre")

    def test_extract_tempo_range(self, parser_service):
        """Test tempo range extraction from markdown."""
        # Test typical tempo format
        content = "**Tempo:** Most hits fall between **95–130 BPM** for dance tracks."
        result = parser_service._extract_tempo_range(content)
        assert result == [95, 130]

        # Test alternative format
        content = "Tempo sits around **120–140 BPM** with a straight groove."
        result = parser_service._extract_tempo_range(content)
        assert result == [120, 140]

        # Test with hyphen instead of en-dash
        content = "Typical range is **70-90 BPM** for ballads."
        result = parser_service._extract_tempo_range(content)
        assert result == [70, 90]

        # Test no tempo found
        content = "This content has no tempo information."
        result = parser_service._extract_tempo_range(content)
        assert result is None

    def test_extract_required_sections(self, parser_service):
        """Test section extraction from markdown."""
        # Test typical form structure
        content = "**Form:** Verse → Chorus → Verse → Chorus → Bridge → Chorus"
        result = parser_service._extract_required_sections(content)
        assert 'Verse' in result
        assert 'Chorus' in result
        assert 'Bridge' in result

        # Test with Pre-Chorus
        content = "**Form:** Verse → Pre-Chorus → Chorus → Verse → Pre-Chorus → Chorus"
        result = parser_service._extract_required_sections(content)
        assert 'Verse' in result
        assert 'Chorus' in result
        assert 'Pre-Chorus' in result or 'Pre Chorus' in result

        # Test no sections found (should return default)
        content = "This content has no section information."
        result = parser_service._extract_required_sections(content)
        assert result == ['Verse', 'Chorus']  # Default

    def test_extract_length_constraints(self, parser_service):
        """Test length constraint extraction from markdown."""
        # Test typical length format
        content = "Most hits run **2.5–3.5 minutes** in total duration."
        result = parser_service._extract_length_constraints(content)
        assert result == [2.5, 3.5]

        # Test integer minutes
        content = "Around **3–4 minutes** is typical for this genre."
        result = parser_service._extract_length_constraints(content)
        assert result == [3.0, 4.0]

        # Test no length found
        content = "This content has no length information."
        result = parser_service._extract_length_constraints(content)
        assert result is None

    def test_extract_time_signature(self, parser_service):
        """Test time signature extraction from markdown."""
        # Test typical 4/4
        content = "Beats are almost always in **4/4** time signature."
        result = parser_service._extract_time_signature(content)
        assert result == "4/4"

        # Test alternative time signature
        content = "Some songs use **6/8** for a different feel."
        result = parser_service._extract_time_signature(content)
        assert result == "6/8"

        # Test default
        content = "This content has no time signature."
        result = parser_service._extract_time_signature(content)
        assert result == "4/4"  # Default

    def test_extract_key_signatures(self, parser_service):
        """Test key signature extraction from markdown."""
        # Test major keys
        content = "**Key & mode:** Major keys (C, G, D, A) dominate upbeat songs."
        result = parser_service._extract_key_signatures(content)
        assert len(result) > 0
        assert 'C' in result
        assert 'G' in result
        assert 'D' in result
        assert 'A' in result

        # Test with flats
        content = "**Key:** Major keys prevail (F, B♭, E♭) for holiday songs."
        result = parser_service._extract_key_signatures(content)
        assert 'F' in result

    def test_default_rubric_structure(self, parser_service):
        """Test that default rubric has correct structure and weights."""
        rubric = parser_service._create_default_rubric()

        # Check structure
        assert 'weights' in rubric
        assert 'thresholds' in rubric

        # Check weights exist
        weights = rubric['weights']
        assert 'hook_density' in weights
        assert 'singability' in weights
        assert 'rhyme_tightness' in weights
        assert 'section_completeness' in weights
        assert 'profanity_score' in weights

        # Check weights are positive
        for weight in weights.values():
            assert weight > 0
            assert weight <= 1.0

        # Check weights sum to 1.0
        total = sum(weights.values())
        assert 0.99 <= total <= 1.01

        # Check thresholds
        thresholds = rubric['thresholds']
        assert 'min_total' in thresholds
        assert 0.0 <= thresholds['min_total'] <= 1.0

    def test_parse_all_available_blueprints(self, parser_service):
        """Test that all discovered blueprints can be parsed successfully."""
        genres = parser_service.get_all_blueprint_genres()

        for genre in genres:
            try:
                data = parser_service.parse_blueprint_file(genre)

                # Basic validation for each blueprint
                assert data['genre'] == genre
                assert 'rules' in data
                assert 'eval_rubric' in data
                assert 'extra_metadata' in data

                # Should have at least some rules
                assert len(data['rules']) > 0

                print(f"✓ {genre}: parsed successfully")
            except Exception as e:
                pytest.fail(f"Failed to parse {genre} blueprint: {str(e)}")

    def test_parsed_data_matches_schema(self, parser_service):
        """Test that parsed data matches BlueprintCreate schema structure."""
        data = parser_service.parse_blueprint_file("pop")

        # Required fields for BlueprintCreate
        required_fields = ['genre', 'version', 'rules', 'eval_rubric']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

        # Optional fields
        optional_fields = ['conflict_matrix', 'tag_categories', 'extra_metadata']
        for field in optional_fields:
            assert field in data, f"Missing optional field: {field}"

        # Rules should be a dict
        assert isinstance(data['rules'], dict)

        # Eval rubric should be a dict with weights and thresholds
        assert isinstance(data['eval_rubric'], dict)
        assert 'weights' in data['eval_rubric']
        assert 'thresholds' in data['eval_rubric']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
