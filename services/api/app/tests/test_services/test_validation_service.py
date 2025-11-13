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
            "title": "Test Song",
            "blueprint_ref": {
                "genre": "Pop",
                "version": "2025.01"
            },
            "style": {
                "genre_detail": {"primary": "Pop"},
                "tempo_bpm": 120,
                "key": {"primary": "C major"},
                "mood": ["upbeat"],
                "tags": ["catchy"]
            },
            "lyrics": {
                "language": "en",
                "section_order": ["Verse", "Chorus"],
                "constraints": {}
            },
            "producer_notes": {
                "structure": "Verse-Chorus",
                "hooks": 1
            },
            "sources": [],
            "prompt_controls": {},
            "render": {
                "engine": "none"
            },
            "seed": 12345
        }

        is_valid, errors = service.validate_sds(valid_sds)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_sds_missing_required(self, service):
        """Test SDS validation with missing required fields."""
        invalid_sds = {
            "title": "Test",
            # Missing required: blueprint_ref, style, lyrics, producer_notes, sources, prompt_controls, render, seed
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
            "title": "Test Song",
            "blueprint_ref": {
                "genre": "Pop",
                "version": "invalid-version"  # Should be YYYY.MM format
            },
            "style": {"genre_detail": {"primary": "Pop"}, "tempo_bpm": 120, "key": {"primary": "C major"}, "mood": ["upbeat"], "tags": []},
            "lyrics": {"language": "en", "section_order": ["Verse"], "constraints": {}},
            "producer_notes": {"structure": "Verse", "hooks": 1},
            "sources": [],
            "prompt_controls": {},
            "render": {"engine": "none"},
            "seed": 12345
        }

        is_valid, errors = service.validate_sds(invalid_sds)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_sds_negative_seed(self, service):
        """Test SDS validation with negative global seed."""
        invalid_sds = {
            "title": "Test Song",
            "blueprint_ref": {"genre": "Pop", "version": "2025.01"},
            "style": {"genre_detail": {"primary": "Pop"}, "tempo_bpm": 120, "key": {"primary": "C major"}, "mood": ["upbeat"], "tags": []},
            "lyrics": {"language": "en", "section_order": ["Verse"], "constraints": {}},
            "producer_notes": {"structure": "Verse", "hooks": 1},
            "sources": [],
            "prompt_controls": {},
            "render": {"engine": "none"},
            "seed": -1  # Should be non-negative
        }

        is_valid, errors = service.validate_sds(invalid_sds)

        assert is_valid is False
        assert len(errors) > 0

    def test_validate_style_valid(self, service):
        """Test style validation with valid data."""
        valid_style = {
            "genre_detail": {
                "primary": "Pop",
                "subgenres": ["Dance Pop"],
                "fusions": []
            },
            "tempo_bpm": 120,
            "key": {
                "primary": "C major"
            },
            "time_signature": "4/4",
            "mood": ["upbeat", "energetic"],
            "energy": "high",
            "instrumentation": ["synth", "bass", "drums"],
            "vocal_profile": "male baritone smooth",
            "tags": ["bright", "catchy"],
            "negative_tags": []
        }

        is_valid, errors = service.validate_style(valid_style)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_style_invalid_bpm(self, service):
        """Test style validation with invalid BPM range."""
        invalid_style = {
            "genre_detail": {
                "primary": "Pop",
                "subgenres": [],
                "fusions": []
            },
            "tempo_bpm": 300,  # Out of range (40-220)
            "key": {"primary": "C major"},
            "mood": ["upbeat"],
            "tags": [],
            "instrumentation": ["synth"],
            "negative_tags": []
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
            "constraints": {
                "explicit": False,
                "max_lines": 100
            },
            "source_citations": []
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
                    "target_duration_sec": 30
                }
            },
            "mix": {
                "lufs": -8,
                "space": "roomy",
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
                "tempo_bpm": 120,
                "structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus",
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
                "lexicon_positive": ["catchy", "upbeat", "melodic"],
                "lexicon_negative": ["muddy", "sluggish"],
                "section_lines": {
                    "Verse": {"min": 8, "max": 12},
                    "Chorus": {"min": 4, "max": 8}
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
            "voice": "smooth male baritone",
            "vocal_range": "baritone",
            "delivery": ["smooth", "crooning"],
            "influences": ["Frank Sinatra", "Dean Martin"],
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
            "allow": ["christmas", "holiday", "winter"],
            "deny": ["halloween", "easter"],
            "provenance": True
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
            "allow": [],
            "deny": [],
            "provenance": True
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
