"""Unit tests for BlueprintService.

Tests blueprint loading, caching, validation, and conflict detection.
"""

import pytest
from pathlib import Path
from uuid import uuid4
from unittest.mock import Mock, patch, mock_open

from app.services.blueprint_service import BlueprintService
from app.repositories.blueprint_repo import BlueprintRepository
from app.models.blueprint import Blueprint
from app.errors import NotFoundError, BadRequestError


class TestBlueprintService:
    """Test suite for BlueprintService."""

    @pytest.fixture
    def mock_repo(self):
        """Create mock blueprint repository."""
        return Mock(spec=BlueprintRepository)

    @pytest.fixture
    def service(self, mock_repo):
        """Create BlueprintService instance with mock repository."""
        return BlueprintService(blueprint_repo=mock_repo)

    # =============================================================================
    # Blueprint Loading & Caching Tests (N6-9)
    # =============================================================================

    def test_load_blueprint_from_file_success(self, service):
        """Test successful blueprint loading from markdown file."""
        # This test uses the actual pop_blueprint.md file
        blueprint = service.load_blueprint_from_file("pop")

        assert blueprint is not None
        assert blueprint.genre == "pop"
        assert blueprint.version == "latest"
        assert isinstance(blueprint.rules, dict)
        assert 'tempo_bpm' in blueprint.rules
        assert blueprint.rules['tempo_bpm'] == [95, 130]
        assert 'required_sections' in blueprint.rules
        assert isinstance(blueprint.eval_rubric, dict)

    def test_load_blueprint_from_file_not_found(self, service):
        """Test blueprint loading with non-existent file."""
        with pytest.raises(NotFoundError) as exc_info:
            service.load_blueprint_from_file("nonexistent_genre")

        assert "not found" in str(exc_info.value).lower()

    def test_get_or_load_blueprint_cache_miss(self, service):
        """Test blueprint loading on cache miss."""
        # First call - cache miss, loads from file
        blueprint1 = service.get_or_load_blueprint("pop")

        assert blueprint1 is not None
        assert blueprint1.genre == "pop"
        assert len(service._blueprint_cache) == 1
        assert "pop:latest" in service._blueprint_cache

    def test_get_or_load_blueprint_cache_hit(self, service):
        """Test blueprint retrieval from cache."""
        # First call - loads and caches
        blueprint1 = service.get_or_load_blueprint("pop")

        # Second call - should use cache
        blueprint2 = service.get_or_load_blueprint("pop")

        # Should be the same object (from cache)
        assert blueprint1 is blueprint2
        assert len(service._blueprint_cache) == 1

    def test_cache_blueprint(self, service):
        """Test manual blueprint caching."""
        blueprint = Blueprint(
            genre="test",
            version="1.0",
            rules={"tempo_bpm": [100, 120]},
            eval_rubric={"weights": {}},
            conflict_matrix={},
            tag_categories={},
            extra_metadata={}
        )

        service.cache_blueprint("test", blueprint, version="1.0")

        assert "test:1.0" in service._blueprint_cache
        assert service._blueprint_cache["test:1.0"] is blueprint

    def test_invalidate_cache_all(self, service):
        """Test clearing entire blueprint cache."""
        # Load multiple blueprints
        service.get_or_load_blueprint("pop")
        service.get_or_load_blueprint("country")

        assert len(service._blueprint_cache) == 2

        # Clear all
        removed = service.invalidate_cache()

        assert removed == 2
        assert len(service._blueprint_cache) == 0

    def test_invalidate_cache_specific_genre(self, service):
        """Test clearing cache for specific genre."""
        # Load multiple blueprints
        service.get_or_load_blueprint("pop")
        service.get_or_load_blueprint("country")

        assert len(service._blueprint_cache) == 2

        # Clear only pop
        removed = service.invalidate_cache("pop")

        assert removed == 1
        assert "pop:latest" not in service._blueprint_cache
        assert "country:latest" in service._blueprint_cache

    def test_parse_blueprint_tempo_extraction(self, service):
        """Test tempo extraction from markdown content."""
        content = """
        # Test Blueprint

        ## Musical Blueprint

        - **Tempo:** Most hits fall between **100–130 BPM** for dance tracks.
        - **Key:** Major keys preferred.
        """

        parsed = service._parse_blueprint_markdown(content, "test")

        assert parsed['rules']['tempo_bpm'] == [100, 130]

    def test_parse_blueprint_sections_extraction(self, service):
        """Test required sections extraction from markdown."""
        content = """
        # Test Blueprint

        ## Structural Blueprint

        - **Form:** **Verse → Pre-Chorus → Chorus** is most common.
        - **Bridge:** Optional and brief.
        """

        parsed = service._parse_blueprint_markdown(content, "test")

        assert 'required_sections' in parsed['rules']
        sections = parsed['rules']['required_sections']
        assert "Verse" in sections
        assert "Chorus" in sections
        assert "Pre-Chorus" in sections or "Pre‑Chorus" in sections

    # =============================================================================
    # Validation Tests (N6-10)
    # =============================================================================

    def test_validate_rubric_weights_valid(self, service):
        """Test rubric weight validation with valid weights."""
        weights = {
            "hook_density": 0.25,
            "singability": 0.25,
            "rhyme_tightness": 0.25,
            "section_completeness": 0.25
        }

        is_valid, error = service.validate_rubric_weights(weights)

        assert is_valid is True
        assert error is None

    def test_validate_rubric_weights_invalid_sum(self, service):
        """Test rubric weight validation with incorrect sum."""
        weights = {
            "hook_density": 0.3,
            "singability": 0.5
        }  # Sum is 0.8, not 1.0

        is_valid, error = service.validate_rubric_weights(weights)

        assert is_valid is False
        assert "sum" in error.lower()
        assert "0.8" in error

    def test_validate_rubric_weights_negative(self, service):
        """Test rubric weight validation with negative weight."""
        weights = {
            "hook_density": 0.5,
            "singability": -0.5  # Negative!
        }

        is_valid, error = service.validate_rubric_weights(weights)

        assert is_valid is False
        assert "negative" in error.lower()

    def test_validate_rubric_weights_empty(self, service):
        """Test rubric weight validation with empty weights."""
        weights = {}

        is_valid, error = service.validate_rubric_weights(weights)

        assert is_valid is False
        assert "empty" in error.lower()

    def test_validate_tempo_range_valid(self, service):
        """Test tempo range validation within blueprint constraints."""
        blueprint = service.get_or_load_blueprint("pop")

        # Pop allows 95-130 BPM, testing 100-120
        is_valid, error = service.validate_tempo_range(100, 120, blueprint)

        assert is_valid is True
        assert error is None

    def test_validate_tempo_range_outside_blueprint(self, service):
        """Test tempo range validation outside blueprint constraints."""
        blueprint = service.get_or_load_blueprint("pop")

        # Pop allows 95-130 BPM, testing 150-180 (too fast)
        is_valid, error = service.validate_tempo_range(150, 180, blueprint)

        assert is_valid is False
        assert "outside" in error.lower()

    def test_validate_tempo_range_invalid_range(self, service):
        """Test tempo range validation with min > max."""
        blueprint = service.get_or_load_blueprint("pop")

        is_valid, error = service.validate_tempo_range(130, 100, blueprint)

        assert is_valid is False
        assert "invalid" in error.lower()

    def test_validate_tempo_range_no_constraints(self, service):
        """Test tempo range validation with no blueprint constraints."""
        # Create blueprint without tempo constraints
        blueprint = Blueprint(
            genre="test",
            version="1.0",
            rules={},  # No tempo_bpm
            eval_rubric={},
            conflict_matrix={},
            tag_categories={},
            extra_metadata={}
        )

        is_valid, error = service.validate_tempo_range(100, 120, blueprint)

        assert is_valid is True

    def test_validate_required_sections_valid(self, service):
        """Test section validation with all required sections present."""
        sections = ["Verse", "Chorus", "Bridge"]
        required = ["Verse", "Chorus"]

        is_valid, error = service.validate_required_sections(sections, required)

        assert is_valid is True
        assert error is None

    def test_validate_required_sections_missing(self, service):
        """Test section validation with missing required sections."""
        sections = ["Verse", "Bridge"]
        required = ["Verse", "Chorus"]

        is_valid, error = service.validate_required_sections(sections, required)

        assert is_valid is False
        assert "missing" in error.lower()
        assert "Chorus" in error

    def test_validate_required_sections_case_insensitive(self, service):
        """Test section validation is case-insensitive."""
        sections = ["verse", "chorus"]
        required = ["Verse", "Chorus"]

        is_valid, error = service.validate_required_sections(sections, required)

        assert is_valid is True

    def test_validate_required_sections_no_requirements(self, service):
        """Test section validation with no requirements."""
        sections = ["Verse"]
        required = []

        is_valid, error = service.validate_required_sections(sections, required)

        assert is_valid is True

    # =============================================================================
    # Tag Conflict Detection Tests (N6-10)
    # =============================================================================

    def test_load_conflict_matrix_success(self, service):
        """Test successful conflict matrix loading."""
        matrix = service.load_conflict_matrix()

        assert isinstance(matrix, dict)
        # Check some known conflicts from our test matrix
        assert "whisper" in matrix
        assert "anthemic" in matrix["whisper"]

    def test_load_conflict_matrix_caching(self, service):
        """Test conflict matrix caching."""
        # First call loads from file
        matrix1 = service.load_conflict_matrix()

        # Second call should use cache
        matrix2 = service.load_conflict_matrix()

        assert matrix1 is matrix2  # Same object (cached)

    def test_get_tag_conflicts_no_conflicts(self, service):
        """Test tag conflict detection with no conflicts."""
        tags = ["acoustic", "warm", "vintage"]

        conflicts = service.get_tag_conflicts(tags)

        assert len(conflicts) == 0

    def test_get_tag_conflicts_with_conflicts(self, service):
        """Test tag conflict detection with conflicts."""
        tags = ["whisper", "anthemic", "acoustic"]

        conflicts = service.get_tag_conflicts(tags)

        # Should detect whisper vs anthemic conflict
        assert len(conflicts) > 0
        assert ("whisper", "anthemic") in conflicts or ("anthemic", "whisper") in conflicts

    def test_get_tag_conflicts_multiple_conflicts(self, service):
        """Test tag conflict detection with multiple conflicts."""
        tags = ["whisper", "anthemic", "acoustic", "electronic"]

        conflicts = service.get_tag_conflicts(tags)

        # Should detect:
        # 1. whisper vs anthemic
        # 2. acoustic vs electronic
        assert len(conflicts) >= 2

    def test_get_tag_conflicts_case_insensitive(self, service):
        """Test tag conflict detection is case-insensitive."""
        tags = ["Whisper", "ANTHEMIC"]

        conflicts = service.get_tag_conflicts(tags)

        # Should still detect conflict despite different cases
        assert len(conflicts) > 0

    def test_get_tag_conflicts_empty_list(self, service):
        """Test tag conflict detection with empty list."""
        conflicts = service.get_tag_conflicts([])

        assert len(conflicts) == 0

    # =============================================================================
    # CRUD Operations Tests
    # =============================================================================

    def test_create_blueprint_with_valid_rubric(self, service, mock_repo):
        """Test blueprint creation with valid rubric weights."""
        from app.schemas.blueprint import BlueprintCreate

        data = BlueprintCreate(
            genre="test",
            version="1.0",
            rules={"tempo_bpm": [100, 120]},
            eval_rubric={
                "weights": {
                    "hook_density": 0.5,
                    "singability": 0.5
                }
            },
            conflict_matrix={},
            tag_categories={},
            extra_metadata={}
        )

        # Mock repository create
        mock_blueprint = Blueprint(
            genre="test",
            version="1.0",
            rules={"tempo_bpm": [100, 120]},
            eval_rubric=data.eval_rubric,
            conflict_matrix={},
            tag_categories={},
            extra_metadata={}
        )
        mock_blueprint.id = uuid4()
        mock_repo.create.return_value = mock_blueprint

        result = service.create_blueprint(data)

        assert result is not None
        mock_repo.create.assert_called_once()

    def test_create_blueprint_with_invalid_rubric(self, service, mock_repo):
        """Test blueprint creation with invalid rubric weights."""
        from app.schemas.blueprint import BlueprintCreate

        data = BlueprintCreate(
            genre="test",
            version="1.0",
            rules={},
            eval_rubric={
                "weights": {
                    "hook_density": 0.3,
                    "singability": 0.5  # Sum is 0.8, not 1.0
                }
            },
            conflict_matrix={},
            tag_categories={},
            extra_metadata={}
        )

        with pytest.raises(BadRequestError) as exc_info:
            service.create_blueprint(data)

        assert "rubric" in str(exc_info.value).lower()
        mock_repo.create.assert_not_called()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
