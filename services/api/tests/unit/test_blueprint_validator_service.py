"""Unit tests for BlueprintValidatorService."""

import pytest
from unittest.mock import Mock, MagicMock
from uuid import uuid4

from app.services.blueprint_validator_service import BlueprintValidatorService
from app.models.blueprint import Blueprint


class TestBlueprintValidatorService:
    """Test suite for blueprint validation service."""

    @pytest.fixture
    def mock_blueprint_repo(self):
        """Create mock blueprint repository."""
        return Mock()

    @pytest.fixture
    def validator_service(self, mock_blueprint_repo):
        """Create validator service with mock repository."""
        return BlueprintValidatorService(mock_blueprint_repo)

    @pytest.fixture
    def sample_blueprint(self):
        """Create sample blueprint for testing."""
        blueprint = Mock(spec=Blueprint)
        blueprint.id = uuid4()
        blueprint.genre = "Pop"
        blueprint.rules = {
            "tempo_bpm": [90, 140],
            "required_sections": ["verse", "chorus", "bridge"],
            "banned_terms": ["profanity1", "profanity2"],
            "section_lines": {
                "verse": {"min": 4, "max": 8},
                "chorus": {"min": 2, "max": 4}
            }
        }
        return blueprint

    @pytest.fixture
    def valid_sds(self):
        """Create valid SDS for testing."""
        return {
            "style": {
                "tempo_bpm": 120,
                "genre": "Pop"
            },
            "lyrics": {
                "section_order": ["verse", "chorus", "bridge"],
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "verse": {"min_lines": 4},
                        "chorus": {"min_lines": 2}
                    }
                }
            }
        }

    @pytest.mark.asyncio
    async def test_validate_valid_sds(
        self,
        validator_service,
        mock_blueprint_repo,
        sample_blueprint,
        valid_sds
    ):
        """Test validation of valid SDS passes."""
        blueprint_id = str(sample_blueprint.id)
        mock_blueprint_repo.get_by_id.return_value = sample_blueprint

        is_valid, errors = await validator_service.validate_sds_against_blueprint(
            valid_sds,
            blueprint_id
        )

        assert is_valid is True
        assert errors == []
        mock_blueprint_repo.get_by_id.assert_called_once()

    @pytest.mark.asyncio
    async def test_validate_blueprint_not_found(
        self,
        validator_service,
        mock_blueprint_repo,
        valid_sds
    ):
        """Test validation fails when blueprint not found."""
        blueprint_id = str(uuid4())
        mock_blueprint_repo.get_by_id.return_value = None

        is_valid, errors = await validator_service.validate_sds_against_blueprint(
            valid_sds,
            blueprint_id
        )

        assert is_valid is False
        assert len(errors) == 1
        assert "not found" in errors[0].lower()

    def test_validate_bpm_in_range(self, validator_service):
        """Test BPM validation passes when in range."""
        style = {"tempo_bpm": 120}
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert errors == []

    def test_validate_bpm_out_of_range(self, validator_service):
        """Test BPM validation fails when out of range."""
        style = {"tempo_bpm": 160}
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert len(errors) == 1
        assert "160" in errors[0]
        assert "90" in errors[0]
        assert "140" in errors[0]

    def test_validate_bpm_range_values(self, validator_service):
        """Test BPM validation with range values."""
        style = {"tempo_bpm": [100, 130]}
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert errors == []

    def test_validate_bpm_range_partial_out_of_range(self, validator_service):
        """Test BPM validation fails when range partially out of bounds."""
        style = {"tempo_bpm": [80, 120]}  # 80 is below min
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert len(errors) == 1
        assert "80" in errors[0]

    def test_validate_bpm_missing(self, validator_service):
        """Test BPM validation fails when tempo_bpm missing."""
        style = {"genre": "Pop"}
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert len(errors) == 1
        assert "missing" in errors[0].lower()

    def test_validate_required_sections_present(self, validator_service):
        """Test required sections validation passes when all present."""
        lyrics = {"section_order": ["verse", "chorus", "bridge", "outro"]}
        rules = {"required_sections": ["verse", "chorus", "bridge"]}

        errors = validator_service._validate_required_sections(lyrics, rules)

        assert errors == []

    def test_validate_required_sections_missing(self, validator_service):
        """Test required sections validation fails when sections missing."""
        lyrics = {"section_order": ["verse", "chorus"]}
        rules = {"required_sections": ["verse", "chorus", "bridge"]}

        errors = validator_service._validate_required_sections(lyrics, rules)

        assert len(errors) == 1
        assert "bridge" in errors[0].lower()

    def test_validate_required_sections_multiple_missing(self, validator_service):
        """Test validation fails when multiple sections missing."""
        lyrics = {"section_order": ["verse"]}
        rules = {"required_sections": ["verse", "chorus", "bridge"]}

        errors = validator_service._validate_required_sections(lyrics, rules)

        assert len(errors) == 1
        assert "chorus" in errors[0].lower()
        assert "bridge" in errors[0].lower()

    def test_validate_section_lines_requirements_defined(self, validator_service):
        """Test section lines validation passes when requirements defined."""
        lyrics = {
            "section_order": ["verse", "chorus"],
            "constraints": {
                "section_requirements": {
                    "verse": {"min_lines": 4},
                    "chorus": {"min_lines": 2}
                }
            }
        }
        rules = {
            "section_lines": {
                "verse": {"min": 4, "max": 8},
                "chorus": {"min": 2, "max": 4}
            }
        }

        errors = validator_service._validate_section_lines(lyrics, rules)

        assert errors == []

    def test_validate_section_lines_requirements_missing(self, validator_service):
        """Test section lines validation fails when requirements not defined."""
        lyrics = {
            "section_order": ["verse", "chorus"],
            "constraints": {
                "section_requirements": {
                    "verse": {"min_lines": 4}
                    # chorus missing
                }
            }
        }
        rules = {
            "section_lines": {
                "verse": {"min": 4, "max": 8},
                "chorus": {"min": 2, "max": 4}
            }
        }

        errors = validator_service._validate_section_lines(lyrics, rules)

        assert len(errors) == 1
        assert "chorus" in errors[0].lower()

    def test_validate_banned_terms_explicit_allowed(self, validator_service):
        """Test banned terms validation passes when explicit allowed."""
        lyrics = {
            "constraints": {"explicit": True}
        }
        rules = {"banned_terms": ["profanity1", "profanity2"]}

        errors = validator_service._validate_banned_terms(lyrics, rules)

        # Should pass (placeholder implementation)
        assert errors == []

    def test_validate_banned_terms_explicit_not_allowed(self, validator_service):
        """Test banned terms validation with explicit not allowed."""
        lyrics = {
            "constraints": {"explicit": False}
        }
        rules = {"banned_terms": ["profanity1", "profanity2"]}

        errors = validator_service._validate_banned_terms(lyrics, rules)

        # Should pass (placeholder implementation defers to LYRICS node)
        assert errors == []

    @pytest.mark.asyncio
    async def test_validate_sds_multiple_errors(
        self,
        validator_service,
        mock_blueprint_repo,
        sample_blueprint
    ):
        """Test validation collects multiple errors."""
        blueprint_id = str(sample_blueprint.id)
        mock_blueprint_repo.get_by_id.return_value = sample_blueprint

        invalid_sds = {
            "style": {
                "tempo_bpm": 200  # Out of range
            },
            "lyrics": {
                "section_order": ["verse"],  # Missing required sections
                "constraints": {
                    "explicit": False,
                    "section_requirements": {}  # Missing requirements
                }
            }
        }

        is_valid, errors = await validator_service.validate_sds_against_blueprint(
            invalid_sds,
            blueprint_id
        )

        assert is_valid is False
        assert len(errors) > 1
        # Should have BPM error
        assert any("200" in err for err in errors)
        # Should have missing sections error
        assert any("chorus" in err.lower() or "bridge" in err.lower() for err in errors)

    @pytest.mark.asyncio
    async def test_validate_sds_missing_style(
        self,
        validator_service,
        mock_blueprint_repo,
        sample_blueprint
    ):
        """Test validation handles missing style gracefully."""
        blueprint_id = str(sample_blueprint.id)
        mock_blueprint_repo.get_by_id.return_value = sample_blueprint

        sds = {
            "lyrics": {
                "section_order": ["verse", "chorus", "bridge"],
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "verse": {"min_lines": 4},
                        "chorus": {"min_lines": 2}
                    }
                }
            }
        }

        is_valid, errors = await validator_service.validate_sds_against_blueprint(
            sds,
            blueprint_id
        )

        # Should pass since style validation is skipped
        assert is_valid is True
        assert errors == []

    @pytest.mark.asyncio
    async def test_validate_sds_missing_lyrics(
        self,
        validator_service,
        mock_blueprint_repo,
        sample_blueprint
    ):
        """Test validation handles missing lyrics gracefully."""
        blueprint_id = str(sample_blueprint.id)
        mock_blueprint_repo.get_by_id.return_value = sample_blueprint

        sds = {
            "style": {
                "tempo_bpm": 120,
                "genre": "Pop"
            }
        }

        is_valid, errors = await validator_service.validate_sds_against_blueprint(
            sds,
            blueprint_id
        )

        # Should pass since lyrics validation is skipped
        assert is_valid is True
        assert errors == []

    def test_validate_bpm_invalid_range_format_not_list(self, validator_service):
        """Test BPM validation handles invalid range format (not a list)."""
        style = {"tempo_bpm": 120}
        rules = {"tempo_bpm": "not-a-list"}  # Invalid format

        errors = validator_service._validate_bpm(style, rules)

        # Should return empty (logged as warning, but no error)
        assert errors == []

    def test_validate_bpm_invalid_range_format_wrong_length(self, validator_service):
        """Test BPM validation handles invalid range format (wrong length)."""
        style = {"tempo_bpm": 120}
        rules = {"tempo_bpm": [90]}  # Should have 2 elements

        errors = validator_service._validate_bpm(style, rules)

        # Should return empty (logged as warning, but no error)
        assert errors == []

    def test_validate_bpm_invalid_value_format(self, validator_service):
        """Test BPM validation handles invalid value format."""
        style = {"tempo_bpm": "not-a-number"}
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert len(errors) == 1
        assert "Invalid tempo_bpm format" in errors[0]

    def test_validate_bpm_invalid_value_type_in_range(self, validator_service):
        """Test BPM validation handles invalid types in BPM range."""
        style = {"tempo_bpm": [100, "not-a-number"]}
        rules = {"tempo_bpm": [90, 140]}

        errors = validator_service._validate_bpm(style, rules)

        assert len(errors) == 1
        assert "Invalid BPM value type" in errors[0]

    def test_validate_required_sections_no_rule(self, validator_service):
        """Test required sections validation when no rule defined."""
        lyrics = {"section_order": ["verse", "chorus"]}
        rules = {}  # No required_sections rule

        errors = validator_service._validate_required_sections(lyrics, rules)

        assert errors == []

    def test_validate_banned_terms_no_rule(self, validator_service):
        """Test banned terms validation when no rule defined."""
        lyrics = {"constraints": {"explicit": False}}
        rules = {}  # No banned_terms rule

        errors = validator_service._validate_banned_terms(lyrics, rules)

        assert errors == []

    def test_validate_section_lines_no_rule(self, validator_service):
        """Test section lines validation when no rule defined."""
        lyrics = {
            "section_order": ["verse", "chorus"],
            "constraints": {"section_requirements": {}}
        }
        rules = {}  # No section_lines rule

        errors = validator_service._validate_section_lines(lyrics, rules)

        assert errors == []
