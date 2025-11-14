"""Unit tests for CrossEntityValidator service."""

import pytest
from app.services.cross_entity_validator import CrossEntityValidator


@pytest.fixture
def validator():
    """Create validator instance."""
    return CrossEntityValidator()


@pytest.fixture
def valid_sds():
    """Create a valid SDS with all cross-entity relationships correct."""
    return {
        "blueprint_ref": {"genre": "Pop"},
        "style": {
            "genre_detail": {"primary": "Pop", "subgenres": ["Dance-Pop"]},
        },
        "lyrics": {
            "section_order": ["Intro", "Verse", "Chorus", "Bridge", "Outro"],
            "source_citations": [
                {"source_id": "source_1", "chunk_hash": "abc123"},
                {"source_id": "source_2", "chunk_hash": "def456"},
            ],
        },
        "producer_notes": {
            "structure": "Intro – Verse – Chorus – Bridge – Outro",
        },
        "sources": [
            {"name": "source_1", "type": "file"},
            {"name": "source_2", "type": "web"},
            {"name": "source_3", "type": "api"},
        ],
    }


class TestValidateSdsConsistency:
    """Tests for validate_sds_consistency method."""

    def test_valid_sds_passes(self, validator, valid_sds):
        """Test that a valid SDS passes all validations."""
        is_valid, errors = validator.validate_sds_consistency(valid_sds)

        assert is_valid is True
        assert errors == []

    def test_multiple_errors_aggregated(self, validator, valid_sds):
        """Test that multiple validation errors are aggregated."""
        # Create SDS with multiple issues
        invalid_sds = valid_sds.copy()
        invalid_sds["blueprint_ref"]["genre"] = "Rock"  # Genre mismatch
        invalid_sds["producer_notes"]["structure"] = "Intro – PreChorus – Bridge"  # PreChorus not in lyrics
        invalid_sds["lyrics"]["source_citations"] = [
            {"source_id": "nonexistent", "chunk_hash": "xyz"}
        ]  # Invalid citation

        is_valid, errors = validator.validate_sds_consistency(invalid_sds)

        assert is_valid is False
        assert len(errors) == 3
        assert any("Genre mismatch" in err for err in errors)
        assert any("sections not in lyrics" in err for err in errors)
        assert any("not in sources list" in err for err in errors)

    def test_empty_sds_handled_gracefully(self, validator):
        """Test that empty SDS is handled gracefully."""
        is_valid, errors = validator.validate_sds_consistency({})

        # Should not crash, but will have errors due to missing data
        assert isinstance(is_valid, bool)
        assert isinstance(errors, list)


class TestGenreConsistency:
    """Tests for _validate_genre_consistency method."""

    def test_matching_genres_valid(self, validator, valid_sds):
        """Test that matching genres pass validation."""
        errors = validator._validate_genre_consistency(valid_sds)
        assert errors == []

    def test_mismatched_genres_invalid(self, validator, valid_sds):
        """Test that mismatched genres fail validation."""
        invalid_sds = valid_sds.copy()
        invalid_sds["blueprint_ref"]["genre"] = "Rock"

        errors = validator._validate_genre_consistency(invalid_sds)

        assert len(errors) == 1
        assert "Genre mismatch" in errors[0]
        assert "blueprint 'Rock'" in errors[0]
        assert "style 'Pop'" in errors[0]

    def test_missing_blueprint_genre_handled(self, validator, valid_sds):
        """Test that missing blueprint genre is handled gracefully."""
        sds = valid_sds.copy()
        sds["blueprint_ref"] = {}

        errors = validator._validate_genre_consistency(sds)
        assert errors == []  # Should skip validation, not error

    def test_missing_style_genre_handled(self, validator, valid_sds):
        """Test that missing style genre is handled gracefully."""
        sds = valid_sds.copy()
        sds["style"]["genre_detail"] = {}

        errors = validator._validate_genre_consistency(sds)
        assert errors == []  # Should skip validation, not error

    def test_missing_entire_sections_handled(self, validator):
        """Test that missing entire sections are handled gracefully."""
        sds = {"blueprint_ref": {}, "style": {}}

        errors = validator._validate_genre_consistency(sds)
        assert errors == []


class TestSectionAlignment:
    """Tests for _validate_section_alignment method."""

    def test_matching_sections_valid(self, validator, valid_sds):
        """Test that matching sections pass validation."""
        errors = validator._validate_section_alignment(valid_sds)
        assert errors == []

    def test_missing_sections_invalid(self, validator, valid_sds):
        """Test that missing sections fail validation."""
        invalid_sds = valid_sds.copy()
        invalid_sds["producer_notes"]["structure"] = "Intro – Verse – PreChorus – Bridge"

        errors = validator._validate_section_alignment(invalid_sds)

        assert len(errors) == 1
        assert "sections not in lyrics" in errors[0]
        assert "PreChorus" in errors[0]

    def test_subset_of_sections_valid(self, validator, valid_sds):
        """Test that producer notes using subset of lyrics sections is valid."""
        sds = valid_sds.copy()
        sds["producer_notes"]["structure"] = "Verse – Chorus"

        errors = validator._validate_section_alignment(sds)
        assert errors == []

    def test_empty_structure_handled(self, validator, valid_sds):
        """Test that empty producer notes structure is handled gracefully."""
        sds = valid_sds.copy()
        sds["producer_notes"]["structure"] = ""

        errors = validator._validate_section_alignment(sds)
        assert errors == []

    def test_missing_structure_field_handled(self, validator, valid_sds):
        """Test that missing structure field is handled gracefully."""
        sds = valid_sds.copy()
        sds["producer_notes"] = {}

        errors = validator._validate_section_alignment(sds)
        assert errors == []

    def test_whitespace_handling(self, validator, valid_sds):
        """Test that whitespace in structure is handled correctly."""
        sds = valid_sds.copy()
        sds["producer_notes"]["structure"] = "  Intro  –  Verse  –  Chorus  "

        errors = validator._validate_section_alignment(sds)
        assert errors == []

    def test_multiple_missing_sections(self, validator, valid_sds):
        """Test error message with multiple missing sections."""
        sds = valid_sds.copy()
        sds["producer_notes"]["structure"] = "PreVerse – PreChorus – PostChorus"

        errors = validator._validate_section_alignment(sds)

        assert len(errors) == 1
        assert "PreVerse" in errors[0]
        assert "PreChorus" in errors[0]
        assert "PostChorus" in errors[0]


class TestSourceCitations:
    """Tests for _validate_source_citations method."""

    def test_valid_citations_pass(self, validator, valid_sds):
        """Test that valid source citations pass validation."""
        errors = validator._validate_source_citations(valid_sds)
        assert errors == []

    def test_invalid_citation_fails(self, validator, valid_sds):
        """Test that invalid source citation fails validation."""
        invalid_sds = valid_sds.copy()
        invalid_sds["lyrics"]["source_citations"] = [
            {"source_id": "nonexistent_source", "chunk_hash": "xyz"}
        ]

        errors = validator._validate_source_citations(invalid_sds)

        assert len(errors) == 1
        assert "nonexistent_source" in errors[0]
        assert "not in sources list" in errors[0]

    def test_multiple_invalid_citations(self, validator, valid_sds):
        """Test that multiple invalid citations are all reported."""
        invalid_sds = valid_sds.copy()
        invalid_sds["lyrics"]["source_citations"] = [
            {"source_id": "missing_1", "chunk_hash": "abc"},
            {"source_id": "source_1", "chunk_hash": "def"},  # Valid
            {"source_id": "missing_2", "chunk_hash": "ghi"},
        ]

        errors = validator._validate_source_citations(invalid_sds)

        assert len(errors) == 2
        assert any("missing_1" in err for err in errors)
        assert any("missing_2" in err for err in errors)

    def test_no_citations_handled(self, validator, valid_sds):
        """Test that no citations is handled gracefully."""
        sds = valid_sds.copy()
        sds["lyrics"]["source_citations"] = []

        errors = validator._validate_source_citations(sds)
        assert errors == []

    def test_missing_citations_field_handled(self, validator, valid_sds):
        """Test that missing citations field is handled gracefully."""
        sds = valid_sds.copy()
        sds["lyrics"] = {"section_order": ["Verse", "Chorus"]}

        errors = validator._validate_source_citations(sds)
        assert errors == []

    def test_empty_sources_list(self, validator, valid_sds):
        """Test validation with empty sources list."""
        sds = valid_sds.copy()
        sds["sources"] = []

        errors = validator._validate_source_citations(sds)

        # All citations should fail since no sources exist
        assert len(errors) == 2
        assert all("not in sources list" in err for err in errors)

    def test_citation_without_source_id(self, validator, valid_sds):
        """Test that citations without source_id are handled."""
        sds = valid_sds.copy()
        sds["lyrics"]["source_citations"] = [
            {"chunk_hash": "abc123"},  # No source_id
            {"source_id": "source_1", "chunk_hash": "def456"},  # Valid
        ]

        errors = validator._validate_source_citations(sds)
        assert errors == []  # Missing source_id is skipped, not an error


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_nested_missing_fields(self, validator):
        """Test handling of deeply nested missing fields."""
        sds = {
            "blueprint_ref": {},
            "style": {},
            "lyrics": {},
            "producer_notes": {},
            "sources": [],
        }

        is_valid, errors = validator.validate_sds_consistency(sds)

        # Should not crash, should handle gracefully
        assert isinstance(is_valid, bool)
        assert isinstance(errors, list)

    def test_malformed_data_types(self, validator):
        """Test handling of malformed data types."""
        sds = {
            "blueprint_ref": {"genre": "Pop"},
            "style": {"genre_detail": {"primary": "Pop"}},
            "lyrics": {
                "section_order": "NotAList",  # Should be list
                "source_citations": "NotAList",  # Should be list
            },
            "producer_notes": {"structure": 123},  # Should be string
            "sources": "NotAList",  # Should be list
        }

        # Should handle gracefully and return errors
        is_valid, errors = validator.validate_sds_consistency(sds)

        assert isinstance(is_valid, bool)
        assert isinstance(errors, list)

    def test_genre_validation_exception_handling(self, validator):
        """Test exception handling in genre consistency validation."""
        # Create SDS that will cause an exception during genre validation
        sds = {
            "blueprint_ref": None,  # This might cause an exception
            "style": None
        }

        # Should handle exception gracefully
        errors = validator._validate_genre_consistency(sds)

        # Should have an error about the validation issue
        assert len(errors) >= 1
        assert any("error" in err.lower() for err in errors)

    def test_section_alignment_exception_handling(self, validator):
        """Test exception handling in section alignment validation."""
        # Create SDS with None values that might cause exceptions
        sds = {
            "lyrics": None,
            "producer_notes": None
        }

        # Should handle exception gracefully
        errors = validator._validate_section_alignment(sds)

        # Should have an error about the validation issue
        assert len(errors) >= 1
        assert any("error" in err.lower() for err in errors)

    def test_citation_validation_exception_handling(self, validator):
        """Test exception handling in source citation validation."""
        # Create SDS with None values that might cause exceptions
        sds = {
            "lyrics": None,
            "sources": None
        }

        # Should handle exception gracefully
        errors = validator._validate_source_citations(sds)

        # Should have an error about the validation issue
        assert len(errors) >= 1
        assert any("error" in err.lower() for err in errors)
