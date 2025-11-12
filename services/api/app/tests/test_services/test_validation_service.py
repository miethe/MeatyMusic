"""Comprehensive unit tests for ValidationService.

This test suite verifies:
- JSON schema loading from /schemas directory
- validate_sds() with valid/invalid data
- validate_style() with schema compliance
- validate_lyrics() with section validation
- Error message formatting
- All 8 entity validation methods
"""

import pytest
from pathlib import Path
import json

from app.services.validation_service import ValidationService


class TestValidationService:
    """Test ValidationService JSON schema validation."""

    @pytest.fixture
    def service(self):
        """ValidationService instance for testing."""
        return ValidationService()

    def test_init_loads_schemas(self, service):
        """Test that initialization loads all schemas."""
        # Verify schemas dict is populated
        assert service.schemas is not None
        assert isinstance(service.schemas, dict)

        # Should have 8 schemas (sds, style, lyrics, producer_notes, composed_prompt, blueprint, persona, source)
        expected_schemas = ['sds', 'style', 'lyrics', 'producer_notes', 'composed_prompt', 'blueprint', 'persona', 'source']
        for schema_name in expected_schemas:
            assert schema_name in service.schemas, f"Missing schema: {schema_name}"

    def test_validate_sds_valid(self, service):
        """Test SDS validation with valid data."""
        valid_sds = {
            "version": "1.0.0",
            "song_id": "550e8400-e29b-41d4-a716-446655440000",
            "global_seed": 12345,
            "style_id": "550e8400-e29b-41d4-a716-446655440001",
            "lyrics_id": "550e8400-e29b-41d4-a716-446655440002",
            "producer_notes_id": "550e8400-e29b-41d4-a716-446655440003",
            "persona_id": "550e8400-e29b-41d4-a716-446655440004",
            "blueprint": {
                "id": "pop-2025-01",
                "version": "2025.01"
            },
            "feature_flags": {},
            "render_config": {
                "enabled": False,
                "engine": "none"
            }
        }

        is_valid, errors = service.validate_sds(valid_sds)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_sds_missing_required(self, service):
        """Test SDS validation with missing required fields."""
        invalid_sds = {
            "version": "1.0.0",
            # Missing song_id, global_seed, style_id
        }

        is_valid, errors = service.validate_sds(invalid_sds)

        assert is_valid is False
        assert len(errors) > 0
        # Should mention missing fields
        error_str = " ".join(errors)
        assert "required" in error_str.lower()

    def test_validate_sds_invalid_version(self, service):
        """Test SDS validation with invalid version format."""
        invalid_sds = {
            "version": "invalid-version",  # Should be semver (X.Y.Z)
            "song_id": "550e8400-e29b-41d4-a716-446655440000",
            "global_seed": 12345,
            "style_id": "550e8400-e29b-41d4-a716-446655440001"
        }

        is_valid, errors = service.validate_sds(invalid_sds)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_sds_negative_seed(self, service):
        """Test SDS validation with negative global seed."""
        invalid_sds = {
            "version": "1.0.0",
            "song_id": "550e8400-e29b-41d4-a716-446655440000",
            "global_seed": -1,  # Should be non-negative
            "style_id": "550e8400-e29b-41d4-a716-446655440001"
        }

        is_valid, errors = service.validate_sds(invalid_sds)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_style_valid(self, service):
        """Test style validation with valid data."""
        valid_style = {
            "name": "Test Style",
            "genre_detail": {
                "primary": "Pop",
                "subgenres": ["Dance Pop"],
                "fusions": []
            },
            "bpm": 120,
            "key": "C major",
            "time_signature": "4/4",
            "energy": "high",
            "instrumentation": ["synth", "bass", "drums"],
            "vocal": {
                "voice": "male",
                "range": "baritone",
                "delivery": "smooth"
            },
            "tags_positive": ["bright", "catchy"],
            "tags_negative": []
        }

        is_valid, errors = service.validate_style(valid_style)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_style_invalid_bpm(self, service):
        """Test style validation with invalid BPM range."""
        invalid_style = {
            "name": "Test Style",
            "genre_detail": {
                "primary": "Pop",
                "subgenres": [],
                "fusions": []
            },
            "bpm": 300,  # Out of range (40-220)
            "instrumentation": ["synth"],
            "tags_positive": [],
            "tags_negative": []
        }

        is_valid, errors = service.validate_style(invalid_style)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_lyrics_valid(self, service):
        """Test lyrics validation with valid data."""
        valid_lyrics = {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "hook_strategy": "melodic",
            "repetition_policy": "hook-heavy",
            "syllables_per_line": 8,
            "imagery_density": 0.7,
            "section_order": ["Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
            "sections": {
                "Verse": ["Line 1", "Line 2"],
                "Chorus": ["Hook line"]
            },
            "citations": []
        }

        is_valid, errors = service.validate_lyrics(valid_lyrics)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_lyrics_missing_chorus(self, service):
        """Test lyrics validation with missing required Chorus."""
        invalid_lyrics = {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "hook_strategy": "melodic",
            "repetition_policy": "moderate",
            "syllables_per_line": 8,
            "imagery_density": 0.5,
            "section_order": ["Verse", "Verse"],  # No Chorus
            "sections": {
                "Verse": ["Line 1"]
            },
            "citations": []
        }

        is_valid, errors = service.validate_lyrics(invalid_lyrics)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_producer_notes_valid(self, service):
        """Test producer notes validation with valid data."""
        valid_producer_notes = {
            "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro",
            "hooks": 3,
            "section_meta": {
                "Chorus": {
                    "tags": ["big", "anthemic"],
                    "duration_sec": 30
                }
            },
            "mix": {
                "lufs": -8,
                "space": 0.6,
                "stereo_width": "wide"
            }
        }

        is_valid, errors = service.validate_producer_notes(valid_producer_notes)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_composed_prompt_valid(self, service):
        """Test composed prompt validation with valid data."""
        valid_prompt = {
            "text": "Pop song with upbeat melody and catchy chorus",
            "meta": {
                "title": "Test Song",
                "genre": "Pop",
                "tempo": 120,
                "structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus"
            },
            "style_tags": ["bright", "catchy"],
            "negative_tags": ["muddy"],
            "section_tags": {
                "Chorus": ["big", "anthemic"]
            },
            "model_limits": {
                "style_max": 200,
                "prompt_max": 3000
            }
        }

        is_valid, errors = service.validate_composed_prompt(valid_prompt)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_composed_prompt_text_too_long(self, service):
        """Test composed prompt validation with text exceeding limit."""
        invalid_prompt = {
            "text": "x" * 10001,  # Exceeds 10,000 character limit
            "meta": {
                "title": "Test Song",
                "genre": "Pop"
            },
            "style_tags": [],
            "negative_tags": [],
            "section_tags": {},
            "model_limits": {
                "style_max": 200,
                "prompt_max": 3000
            }
        }

        is_valid, errors = service.validate_composed_prompt(invalid_prompt)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_blueprint_valid(self, service):
        """Test blueprint validation with valid data."""
        valid_blueprint = {
            "genre": "Pop",
            "version": "2025.01",
            "rules": {
                "tempo_bpm": [100, 140],
                "required_sections": ["Verse", "Chorus"],
                "lexicons": {
                    "pop": ["catchy", "upbeat", "melodic"]
                },
                "section_lines": {
                    "Verse": [8, 12],
                    "Chorus": [4, 8]
                }
            },
            "eval_rubric": {
                "weights": {
                    "hook_density": 0.25,
                    "singability": 0.25,
                    "rhyme_tightness": 0.20,
                    "section_completeness": 0.15,
                    "profanity_score": 0.15
                },
                "thresholds": {
                    "min_total": 0.75,
                    "max_profanity": 0.1
                }
            },
            "conflict_matrix": {
                "whisper": ["anthemic"],
                "intimate": ["stadium"]
            },
            "tag_categories": {
                "era": ["1940s", "1980s"],
                "energy": ["whisper", "intimate", "anthemic", "stadium"]
            }
        }

        is_valid, errors = service.validate_blueprint(valid_blueprint)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_persona_valid(self, service):
        """Test persona validation with valid data."""
        valid_persona = {
            "name": "Frank Sinatra-inspired",
            "kind": "artist",
            "vocal": {
                "voice": "male",
                "vocal_range": "baritone",
                "delivery": "smooth, crooning"
            },
            "influences": ["Frank Sinatra", "Dean Martin"],
            "defaults": {
                "style": {},
                "lyrics": {}
            },
            "policy": {
                "public_release": False,
                "disallow_named_style_of": True
            }
        }

        is_valid, errors = service.validate_persona(valid_persona)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_source_valid(self, service):
        """Test source validation with valid data."""
        valid_source = {
            "name": "Christmas lyrics database",
            "kind": "file",
            "weight": 0.8,
            "mcp_server_id": "lyrics-db-server",
            "scoping": {
                "allow": ["christmas", "holiday", "winter"],
                "deny": ["halloween", "easter"]
            },
            "provenance": {
                "url": None,
                "last_synced": "2025-11-01T00:00:00Z"
            }
        }

        is_valid, errors = service.validate_source(valid_source)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_source_invalid_weight(self, service):
        """Test source validation with invalid weight (out of 0-1 range)."""
        invalid_source = {
            "name": "Test Source",
            "kind": "api",
            "weight": 1.5,  # Out of range (0-1)
            "mcp_server_id": "test-server",
            "scoping": {
                "allow": [],
                "deny": []
            },
            "provenance": {}
        }

        is_valid, errors = service.validate_source(invalid_source)

        assert is_valid is False
        assert len(errors) > 0

    def test_format_validation_errors(self, service):
        """Test error message formatting."""
        # Test with invalid SDS (multiple errors)
        invalid_sds = {}  # Missing all required fields

        is_valid, errors = service.validate_sds(invalid_sds)

        assert is_valid is False
        assert len(errors) > 0
        # Errors should be human-readable strings
        assert all(isinstance(err, str) for err in errors)
        # Should mention field paths
        assert any("'" in err for err in errors)  # Field names quoted
