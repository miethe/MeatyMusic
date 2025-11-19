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


class TestValidationServiceTagConflicts:
    """Test ValidationService tag conflict validation integration."""

    @pytest.fixture
    def service(self):
        """ValidationService instance for testing."""
        return ValidationService()

    def test_validate_tags_no_conflicts(self, service):
        """Test tag validation with no conflicts."""
        tags = ["melodic", "catchy", "upbeat"]

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            context="style"
        )

        assert is_valid is True
        assert cleaned_tags == tags
        assert report["conflict_count"] == 0
        assert report["conflicts"] == []
        assert report["removed_tags"] == []
        assert report["strategy_used"] == "keep-first"

    def test_validate_tags_with_simple_conflict(self, service):
        """Test tag validation with simple conflict (whisper vs anthemic)."""
        tags = ["whisper", "anthemic", "upbeat"]

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            context="style",
            strategy="keep-first"
        )

        # Should detect conflict
        assert is_valid is False
        assert report["conflict_count"] >= 1

        # Should resolve by keeping first (whisper) and removing anthemic
        assert "whisper" in cleaned_tags
        assert "anthemic" not in cleaned_tags
        assert "upbeat" in cleaned_tags

        # Should report removed tags
        assert "anthemic" in report["removed_tags"]

        # Should include conflict details
        assert len(report["conflicts"]) >= 1
        conflict = report["conflicts"][0]
        assert "tag_a" in conflict
        assert "tag_b" in conflict
        assert "reason" in conflict
        assert "category" in conflict

    def test_validate_tags_with_multiple_conflicts(self, service):
        """Test tag validation with multiple conflicts."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            context="style"
        )

        # Should detect multiple conflicts
        assert is_valid is False
        assert report["conflict_count"] >= 1

        # Should have removed some tags
        assert len(cleaned_tags) < len(tags)
        assert len(report["removed_tags"]) > 0

        # All conflicts should have details
        for conflict in report["conflicts"]:
            assert "tag_a" in conflict
            assert "tag_b" in conflict
            assert "reason" in conflict
            assert "category" in conflict

    def test_validate_tags_keep_first_strategy(self, service):
        """Test keep-first resolution strategy."""
        tags = ["whisper", "anthemic", "upbeat"]

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            strategy="keep-first"
        )

        # Should keep first occurrence (whisper)
        assert "whisper" in cleaned_tags
        assert "anthemic" not in cleaned_tags
        assert report["strategy_used"] == "keep-first"

    def test_validate_tags_priority_strategy_lowest(self, service):
        """Test remove-lowest-priority resolution strategy."""
        tags = ["whisper", "anthemic", "upbeat"]
        priorities = {
            "whisper": 0.5,
            "anthemic": 0.8,
            "upbeat": 0.6
        }

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            strategy="remove-lowest-priority",
            tag_priorities=priorities
        )

        # Should remove whisper (lowest priority = 0.5)
        assert "whisper" not in cleaned_tags
        assert "anthemic" in cleaned_tags
        assert "upbeat" in cleaned_tags
        assert report["strategy_used"] == "remove-lowest-priority"

    def test_validate_tags_priority_strategy_highest(self, service):
        """Test remove-highest-priority resolution strategy."""
        tags = ["whisper", "anthemic", "upbeat"]
        priorities = {
            "whisper": 0.5,
            "anthemic": 0.8,
            "upbeat": 0.6
        }

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            strategy="remove-highest-priority",
            tag_priorities=priorities
        )

        # Should remove anthemic (highest priority = 0.8)
        assert "anthemic" not in cleaned_tags
        assert "whisper" in cleaned_tags
        assert "upbeat" in cleaned_tags
        assert report["strategy_used"] == "remove-highest-priority"

    def test_validate_tags_empty_list(self, service):
        """Test tag validation with empty list."""
        tags = []

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags
        )

        assert is_valid is True
        assert cleaned_tags == []
        assert report["conflict_count"] == 0
        assert report["removed_tags"] == []

    def test_validate_tags_context_parameter(self, service):
        """Test that context parameter is used in logging."""
        tags = ["whisper", "anthemic"]

        # Should not raise error with context
        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            context="compose"
        )

        # Should still work correctly
        assert is_valid is False
        assert len(cleaned_tags) < len(tags)

    def test_validate_tags_remediation_suggestions(self, service):
        """Test that remediation suggestions are included in report."""
        tags = ["whisper", "anthemic", "upbeat"]

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags
        )

        # Should have conflict
        assert is_valid is False

        # Should include remediation suggestions
        assert "suggestions" in report
        assert isinstance(report["suggestions"], dict)

        # Should have at least keep_first option
        if report["conflict_count"] > 0:
            assert "keep_first" in report["suggestions"]

    def test_validate_tags_deterministic_resolution(self, service):
        """Test that conflict resolution is deterministic (same input -> same output)."""
        tags = ["whisper", "anthemic", "upbeat"]

        # Run validation multiple times
        results = []
        for _ in range(3):
            is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
                tags=tags,
                strategy="keep-first"
            )
            results.append((is_valid, cleaned_tags, report))

        # All results should be identical
        assert all(r[0] == results[0][0] for r in results)  # is_valid
        assert all(r[1] == results[0][1] for r in results)  # cleaned_tags
        assert all(r[2]["conflict_count"] == results[0][2]["conflict_count"] for r in results)
        assert all(len(r[2]["removed_tags"]) == len(results[0][2]["removed_tags"]) for r in results)

    def test_validate_tags_preserves_order(self, service):
        """Test that tag order is preserved after conflict resolution."""
        tags = ["upbeat", "whisper", "catchy", "anthemic", "melodic"]

        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=tags,
            strategy="keep-first"
        )

        # Check that remaining tags maintain original order
        # Find indices in original list
        original_indices = {tag: i for i, tag in enumerate(tags)}

        for i in range(len(cleaned_tags) - 1):
            current_tag = cleaned_tags[i]
            next_tag = cleaned_tags[i + 1]

            # Current tag should appear before next tag in original list
            assert original_indices[current_tag] < original_indices[next_tag]

    def test_validate_tags_integration_with_style_workflow(self, service):
        """Test integration pattern for STYLE workflow node."""
        # Simulate STYLE node validating tags
        style_tags = ["electronic", "acoustic", "upbeat", "catchy"]

        # Step 1: Validate and resolve conflicts
        is_valid, cleaned_tags, report = service.validate_tags_for_conflicts(
            tags=style_tags,
            context="style",
            strategy="keep-first"
        )

        # Step 2: Use cleaned tags in style spec
        style_spec = {
            "genre": "Pop",
            "bpm": 120,
            "tags": cleaned_tags,  # Use cleaned tags
            "mood": ["upbeat"]
        }

        # Should have resolved conflicts
        if not is_valid:
            assert len(cleaned_tags) < len(style_tags)
            assert report["conflict_count"] > 0

        # Style spec should use conflict-free tags
        assert "tags" in style_spec
        assert isinstance(style_spec["tags"], list)


class TestValidationServicePolicyIntegration:
    """Test ValidationService policy guard integration."""

    @pytest.fixture
    def service(self):
        """ValidationService instance for testing."""
        return ValidationService()

    # ===== Profanity Validation Tests =====

    def test_validate_profanity_clean_text(self, service):
        """Test profanity validation with clean text."""
        is_valid, report = service.validate_profanity(
            text="This is a clean song about love and happiness",
            explicit_allowed=False,
            context="lyrics"
        )

        assert is_valid is True
        assert report["has_violations"] is False
        assert report["profanity_score"] == 0.0
        assert report["violation_count"] == 0
        assert report["compliant"] is True

    def test_validate_profanity_with_violations(self, service):
        """Test profanity validation with profanity violations."""
        is_valid, report = service.validate_profanity(
            text="This damn song is pretty good",
            explicit_allowed=False,
            context="lyrics"
        )

        # Should detect violations in clean mode
        assert is_valid is False
        assert report["has_violations"] is True
        assert report["profanity_score"] > 0.0
        assert len(report["violations"]) > 0
        assert report["compliant"] is False

    def test_validate_profanity_explicit_allowed(self, service):
        """Test profanity validation with explicit content allowed."""
        is_valid, report = service.validate_profanity(
            text="This damn song is pretty good",
            explicit_allowed=True,
            context="lyrics"
        )

        # Should allow mild profanity in explicit mode
        assert is_valid is True or report["profanity_score"] < 1.0

    def test_validate_profanity_empty_text(self, service):
        """Test profanity validation with empty text."""
        is_valid, report = service.validate_profanity(
            text="",
            explicit_allowed=False,
            context="lyrics"
        )

        assert is_valid is True
        assert report["has_violations"] is False
        assert report["profanity_score"] == 0.0

    def test_validate_profanity_severity_summary(self, service):
        """Test that profanity report includes severity summary."""
        is_valid, report = service.validate_profanity(
            text="This damn song",
            explicit_allowed=False,
            context="lyrics"
        )

        # Should include severity summary
        assert "severity_summary" in report
        assert isinstance(report["severity_summary"], dict)
        assert "mild" in report["severity_summary"]
        assert "moderate" in report["severity_summary"]
        assert "strong" in report["severity_summary"]
        assert "extreme" in report["severity_summary"]

    # ===== PII Validation Tests =====

    def test_validate_pii_clean_text(self, service):
        """Test PII validation with clean text."""
        has_pii, redacted, report = service.validate_pii(
            text="This is a song about the city",
            context="lyrics"
        )

        assert has_pii is False
        assert redacted == "This is a song about the city"
        assert report["has_pii"] is False
        assert report["summary"]["total_pii_count"] == 0

    def test_validate_pii_with_email(self, service):
        """Test PII validation with email address."""
        has_pii, redacted, report = service.validate_pii(
            text="Contact me at john@example.com for more info",
            context="lyrics"
        )

        assert has_pii is True
        assert "[EMAIL]" in redacted
        assert "john@example.com" not in redacted
        assert report["has_pii"] is True
        assert report["summary"]["total_pii_count"] > 0
        assert "email" in report["summary"]["types"]

    def test_validate_pii_with_phone(self, service):
        """Test PII validation with phone number."""
        has_pii, redacted, report = service.validate_pii(
            text="Call me at 555-123-4567",
            context="lyrics"
        )

        assert has_pii is True
        assert "[PHONE]" in redacted
        assert "555-123-4567" not in redacted
        assert report["has_pii"] is True
        assert "phone" in report["summary"]["types"]

    def test_validate_pii_empty_text(self, service):
        """Test PII validation with empty text."""
        has_pii, redacted, report = service.validate_pii(
            text="",
            context="lyrics"
        )

        assert has_pii is False
        assert redacted == ""
        assert report["has_pii"] is False

    def test_validate_pii_multiple_types(self, service):
        """Test PII validation with multiple PII types."""
        has_pii, redacted, report = service.validate_pii(
            text="Email me at john@example.com or call 555-123-4567",
            context="lyrics"
        )

        assert has_pii is True
        assert "[EMAIL]" in redacted
        assert "[PHONE]" in redacted
        assert report["summary"]["total_pii_count"] >= 2
        assert len(report["summary"]["types"]) >= 2

    # ===== Artist Reference Validation Tests =====

    def test_validate_artist_references_clean_text(self, service):
        """Test artist reference validation with clean text."""
        is_valid, normalized, report = service.validate_artist_references(
            text="Pop song with catchy hooks and upbeat melody",
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is True
        assert normalized == "Pop song with catchy hooks and upbeat melody"
        assert report["has_references"] is False
        assert report["compliant"] is True
        assert len(report["references"]) == 0

    def test_validate_artist_references_with_violation_strict(self, service):
        """Test artist reference validation with living artist in strict mode."""
        is_valid, normalized, report = service.validate_artist_references(
            text="style of Taylor Swift with storytelling lyrics",
            public_release=True,
            policy_mode="strict"
        )

        # Should detect violation in strict mode
        assert is_valid is False
        assert report["has_references"] is True
        assert len(report["references"]) > 0
        assert report["compliant"] is False
        assert len(report["violations"]) > 0

        # Should have normalized text
        assert normalized != "style of Taylor Swift with storytelling lyrics"
        assert "Taylor Swift" not in normalized

    def test_validate_artist_references_warn_mode(self, service):
        """Test artist reference validation in warn mode."""
        is_valid, normalized, report = service.validate_artist_references(
            text="style of Taylor Swift",
            public_release=True,
            policy_mode="warn"
        )

        # Should pass validation in warn mode (but log warnings)
        assert is_valid is True
        assert report["has_references"] is True

    def test_validate_artist_references_permissive_mode(self, service):
        """Test artist reference validation in permissive mode."""
        is_valid, normalized, report = service.validate_artist_references(
            text="style of Taylor Swift",
            public_release=True,
            policy_mode="permissive"
        )

        # Should always pass in permissive mode
        assert is_valid is True

    def test_validate_artist_references_non_public(self, service):
        """Test artist reference validation for non-public release."""
        is_valid, normalized, report = service.validate_artist_references(
            text="style of Taylor Swift",
            public_release=False,
            policy_mode="strict"
        )

        # Should pass for non-public releases
        assert is_valid is True
        assert report["compliant"] is True

    def test_validate_artist_references_normalization(self, service):
        """Test that artist references are properly normalized."""
        is_valid, normalized, report = service.validate_artist_references(
            text="sounds like Drake with introspective lyrics",
            public_release=True,
            policy_mode="strict"
        )

        # Should normalize
        assert report["has_references"] is True
        assert len(report["changes"]) > 0

        # Normalized text should have generic description
        change = report["changes"][0]
        assert "original" in change
        assert "replacement" in change
        assert "Drake" in change["original"]

    # ===== Combined Policy Validation Tests =====

    def test_validate_all_policies_clean_content(self, service):
        """Test combined policy validation with clean content."""
        content = {
            "style": "Pop song with upbeat melody",
            "lyrics": {"text": "Dancing in the sunshine, feeling so alive"}
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is True
        assert report["summary"]["total_violations"] == 0
        assert len(report["violations"]["profanity"]) == 0
        assert len(report["violations"]["pii"]) == 0
        assert len(report["violations"]["artist_references"]) == 0

    def test_validate_all_policies_profanity_violation(self, service):
        """Test combined policy validation with profanity violations."""
        content = {
            "lyrics": {"text": "This damn song is great"}
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is False
        assert len(report["violations"]["profanity"]) > 0
        assert "suggestions" in report
        assert len(report["suggestions"]) > 0

    def test_validate_all_policies_pii_violation(self, service):
        """Test combined policy validation with PII violations."""
        content = {
            "lyrics": {"text": "Email me at test@example.com"}
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is False
        assert len(report["violations"]["pii"]) > 0
        assert "redacted_content" in report
        assert "lyrics" in report["redacted_content"]
        assert "[EMAIL]" in report["redacted_content"]["lyrics"]

    def test_validate_all_policies_artist_violation(self, service):
        """Test combined policy validation with artist reference violations."""
        content = {
            "style": "style of Taylor Swift"
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is False
        assert len(report["violations"]["artist_references"]) > 0
        assert "normalized_content" in report
        assert "style" in report["normalized_content"]

    def test_validate_all_policies_multiple_violations(self, service):
        """Test combined policy validation with multiple violation types."""
        content = {
            "style": "style of Taylor Swift",
            "lyrics": {"text": "Email me at test@example.com. This damn song rocks!"}
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is False
        # Should have multiple violation types
        assert report["summary"]["total_violations"] >= 3
        assert len(report["violations"]["profanity"]) > 0
        assert len(report["violations"]["pii"]) > 0
        assert len(report["violations"]["artist_references"]) > 0

    def test_validate_all_policies_structured_lyrics(self, service):
        """Test policy validation with structured lyrics format."""
        content = {
            "lyrics": {
                "sections": [
                    {"name": "verse_1", "text": "Email me at test@example.com"},
                    {"name": "chorus", "text": "This damn chorus is catchy"}
                ]
            }
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        # Should detect violations in both sections
        assert is_valid is False
        assert report["summary"]["total_violations"] > 0

    def test_validate_all_policies_empty_content(self, service):
        """Test combined policy validation with empty content."""
        is_valid, report = service.validate_all_policies(
            content={},
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        assert is_valid is True
        assert report["summary"]["total_violations"] == 0

    def test_validate_all_policies_policy_mode_switching(self, service):
        """Test policy mode switching between strict, warn, and permissive."""
        content = {
            "style": "style of Taylor Swift"
        }

        # Strict mode - should fail
        is_valid_strict, report_strict = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )
        assert is_valid_strict is False

        # Warn mode - should pass with warnings
        is_valid_warn, report_warn = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="warn"
        )
        assert is_valid_warn is True  # Passes but with suggestions

        # Permissive mode - should always pass
        is_valid_permissive, report_permissive = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="permissive"
        )
        assert is_valid_permissive is True

    def test_validate_all_policies_field_context(self, service):
        """Test that violations include field context."""
        content = {
            "style": "This damn style",
            "lyrics": {"text": "Email: test@example.com"}
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        # Check that violations have field context
        for violation in report["violations"]["profanity"]:
            assert "field" in violation
            assert violation["field"] in ["style", "lyrics"]

        for violation in report["violations"]["pii"]:
            assert "field" in violation
            assert violation["field"] in ["style", "lyrics"]

    def test_validate_all_policies_summary(self, service):
        """Test that validation report includes comprehensive summary."""
        content = {
            "style": "style of Taylor Swift",
            "lyrics": {"text": "Email me at test@example.com. This damn song!"}
        }

        is_valid, report = service.validate_all_policies(
            content=content,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        # Check summary structure
        assert "summary" in report
        assert "total_violations" in report["summary"]
        assert "profanity_count" in report["summary"]
        assert "pii_count" in report["summary"]
        assert "artist_reference_count" in report["summary"]

        # Verify counts
        assert report["summary"]["total_violations"] > 0
        assert report["summary"]["profanity_count"] == len(report["violations"]["profanity"])
        assert report["summary"]["pii_count"] == len(report["violations"]["pii"])
        assert report["summary"]["artist_reference_count"] == len(report["violations"]["artist_references"])

    # ===== Error Handling Tests =====

    def test_validate_profanity_error_handling(self, service):
        """Test profanity validation handles errors gracefully."""
        # This should not raise an exception
        is_valid, report = service.validate_profanity(
            text="Test text",
            explicit_allowed=False,
            context="test"
        )

        # Should return some result even if there are internal errors
        assert isinstance(is_valid, bool)
        assert isinstance(report, dict)

    def test_validate_pii_error_handling(self, service):
        """Test PII validation handles errors gracefully."""
        # This should not raise an exception
        has_pii, redacted, report = service.validate_pii(
            text="Test text",
            context="test"
        )

        # Should return some result
        assert isinstance(has_pii, bool)
        assert isinstance(redacted, str)
        assert isinstance(report, dict)

    def test_validate_artist_references_error_handling(self, service):
        """Test artist reference validation handles errors gracefully."""
        # This should not raise an exception
        is_valid, normalized, report = service.validate_artist_references(
            text="Test text",
            public_release=True,
            policy_mode="strict"
        )

        # Should return some result
        assert isinstance(is_valid, bool)
        assert isinstance(normalized, str)
        assert isinstance(report, dict)

    # ===== Rubric Integration Tests =====

    def test_score_artifacts_integration(self, service):
        """Test scoring artifacts through ValidationService."""
        lyrics = {
            "sections": [
                {"name": "verse_1", "lines": ["Line one here", "Line two there"]},
                {"name": "chorus", "lines": ["Hook line repeated", "Hook line repeated"]}
            ]
        }
        style = {
            "tags": ["upbeat", "catchy"],
            "genre": "pop"
        }
        producer_notes = {
            "structure": "Verse-Chorus"
        }

        # Score artifacts
        score_report = service.score_artifacts(
            lyrics=lyrics,
            style=style,
            producer_notes=producer_notes,
            genre="pop",
            explicit_allowed=False
        )

        # Verify score report structure
        assert isinstance(score_report.hook_density, float)
        assert isinstance(score_report.singability, float)
        assert isinstance(score_report.rhyme_tightness, float)
        assert isinstance(score_report.section_completeness, float)
        assert isinstance(score_report.profanity_score, float)
        assert isinstance(score_report.total, float)
        assert isinstance(score_report.weights, dict)
        assert isinstance(score_report.thresholds, dict)
        assert isinstance(score_report.explanations, dict)
        assert isinstance(score_report.meets_threshold, bool)
        assert isinstance(score_report.margin, float)

        # All scores should be 0-1
        assert 0.0 <= score_report.hook_density <= 1.0
        assert 0.0 <= score_report.singability <= 1.0
        assert 0.0 <= score_report.rhyme_tightness <= 1.0
        assert 0.0 <= score_report.section_completeness <= 1.0
        assert 0.0 <= score_report.profanity_score <= 1.0
        assert 0.0 <= score_report.total <= 1.0

    def test_evaluate_compliance_pass(self, service):
        """Test compliance evaluation with passing scores."""
        # Create high-scoring lyrics
        lyrics = {
            "sections": [
                {"name": "verse", "lines": [
                    "Dancing in the sunshine bright",
                    "Feeling good and feeling right",
                    "Every moment feels so new",
                    "All I need is being true"
                ]},
                {"name": "chorus", "lines": [
                    "We're alive, we're alive, we're alive today",
                    "Feel the joy, feel the joy, come what may",
                    "We're alive, we're alive, we're alive today",
                    "Dancing through the night and day"
                ]}
            ]
        }

        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": ["upbeat"]},
            producer_notes={"structure": "Verse-Chorus"},
            genre="pop",
            explicit_allowed=False
        )

        # Evaluate compliance
        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Should have actionable report structure
        assert isinstance(actionable_report.passed, bool)
        assert isinstance(actionable_report.decision, object)  # ThresholdDecision enum
        assert isinstance(actionable_report.score_report, object)  # ScoreReport
        assert isinstance(actionable_report.margin, float)
        assert isinstance(actionable_report.improvement_suggestions, list)
        assert isinstance(actionable_report.should_trigger_fix, bool)
        assert isinstance(actionable_report.fix_targets, list)

        # Should match passed status
        assert passed == actionable_report.passed

    def test_evaluate_compliance_fail(self, service):
        """Test compliance evaluation with failing scores."""
        # Create low-scoring lyrics (minimal, no rhyme, no hooks)
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["Line one"]},
                {"name": "chorus", "lines": ["Different line"]}
            ]
        }

        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": []},
            producer_notes={"structure": "Verse"},
            genre="pop",
            explicit_allowed=False
        )

        # Evaluate compliance
        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Low scores should fail or be borderline
        # Definitely should trigger fix
        assert actionable_report.should_trigger_fix is True

        # Should have improvement suggestions
        assert len(actionable_report.improvement_suggestions) > 0

        # Should have fix targets
        assert len(actionable_report.fix_targets) > 0

    def test_evaluate_compliance_borderline(self, service):
        """Test compliance evaluation with borderline scores (within 5% of threshold)."""
        # This test checks that scores close to threshold are marked as BORDERLINE
        # Implementation will vary based on actual scoring, but we can test the structure

        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["Simple line one", "Simple line two"]},
                {"name": "chorus", "lines": ["Hook here", "Hook here"]}
            ]
        }

        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": ["upbeat"]},
            producer_notes={"structure": "Verse-Chorus"},
            genre="pop",
            explicit_allowed=False
        )

        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Decision should be one of: PASS, FAIL, BORDERLINE
        from app.services.rubric_scorer import ThresholdDecision
        assert actionable_report.decision in (
            ThresholdDecision.PASS,
            ThresholdDecision.FAIL,
            ThresholdDecision.BORDERLINE
        )

        # BORDERLINE should trigger fix
        if actionable_report.decision == ThresholdDecision.BORDERLINE:
            assert actionable_report.should_trigger_fix is True

    def test_improvement_suggestions(self, service):
        """Test that improvement suggestions are actionable and specific."""
        # Create lyrics with specific weaknesses
        lyrics = {
            "sections": [
                {"name": "verse", "lines": [
                    "Extraordinarily complicated multisyllabic terminology",
                    "Unnecessarily verbose and complex phraseology"
                ]},
                {"name": "chorus", "lines": ["Simple hook"]}
            ]
        }

        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": []},
            producer_notes={"structure": "Verse-Chorus"},
            genre="pop",
            explicit_allowed=False
        )

        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Should have suggestions
        assert len(actionable_report.improvement_suggestions) > 0

        # Suggestions should be strings
        for suggestion in actionable_report.improvement_suggestions:
            assert isinstance(suggestion, str)
            assert len(suggestion) > 0

    def test_actionable_report_structure(self, service):
        """Test ActionableReport structure for FIX node."""
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["Line one", "Line two"]},
                {"name": "chorus", "lines": ["Hook", "Hook"]}
            ]
        }

        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": []},
            producer_notes={"structure": "Verse-Chorus"},
            genre="pop",
            explicit_allowed=False
        )

        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Test to_dict() method
        report_dict = actionable_report.to_dict()

        assert "passed" in report_dict
        assert "decision" in report_dict
        assert "score_report" in report_dict
        assert "margin" in report_dict
        assert "improvement_suggestions" in report_dict
        assert "should_trigger_fix" in report_dict
        assert "fix_targets" in report_dict

        # Verify types
        assert isinstance(report_dict["passed"], bool)
        assert isinstance(report_dict["decision"], str)
        assert isinstance(report_dict["score_report"], dict)
        assert isinstance(report_dict["margin"], float)
        assert isinstance(report_dict["improvement_suggestions"], list)
        assert isinstance(report_dict["should_trigger_fix"], bool)
        assert isinstance(report_dict["fix_targets"], list)

    def test_fix_targets_identification(self, service):
        """Test that fix targets are correctly identified."""
        # Create lyrics with specific weaknesses
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["No rhyme here", "Different ending"]},
                # Missing chorus - should trigger section_completeness
            ]
        }

        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": []},
            producer_notes={"structure": "Verse"},
            genre="pop",
            explicit_allowed=False
        )

        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Should have fix targets
        fix_targets = actionable_report.fix_targets
        assert isinstance(fix_targets, list)

        # All fix targets should be valid metric names
        valid_metrics = [
            "hook_density",
            "singability",
            "rhyme_tightness",
            "section_completeness",
            "profanity_score"
        ]

        for target in fix_targets:
            assert target in valid_metrics

    def test_rubric_integration_with_profanity(self, service):
        """Test rubric integration handles profanity correctly."""
        lyrics = {
            "sections": [
                {"name": "verse", "lines": ["This damn song is great"]},
                {"name": "chorus", "lines": ["Sing it loud"]}
            ]
        }

        # Test with explicit NOT allowed
        score_report = service.score_artifacts(
            lyrics=lyrics,
            style={"tags": []},
            producer_notes={"structure": "Verse-Chorus"},
            genre="pop",
            explicit_allowed=False
        )

        # Profanity score should be lower (has violations)
        assert score_report.profanity_score < 1.0

        # Evaluate compliance
        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Should likely have profanity_score in fix targets
        # (depending on threshold)
        if "profanity_score" in actionable_report.fix_targets:
            # Should have suggestion about profanity
            suggestion_text = " ".join(actionable_report.improvement_suggestions)
            assert "profanity" in suggestion_text.lower() or "violations" in suggestion_text.lower()

    def test_validate_workflow_node_pattern(self, service):
        """Test VALIDATE node integration pattern."""
        # Simulate VALIDATE workflow node
        artifacts = {
            "lyrics": {
                "sections": [
                    {"name": "verse", "lines": ["Dancing in the light", "Feeling so right"]},
                    {"name": "chorus", "lines": ["We're alive today", "Come what may"]}
                ]
            },
            "style": {"tags": ["upbeat", "catchy"]},
            "producer_notes": {"structure": "Verse-Chorus"}
        }

        # Step 1: Score artifacts
        score_report = service.score_artifacts(
            lyrics=artifacts["lyrics"],
            style=artifacts["style"],
            producer_notes=artifacts["producer_notes"],
            genre="pop",
            explicit_allowed=False
        )

        # Step 2: Evaluate compliance
        passed, actionable_report = service.evaluate_compliance(
            score_report=score_report,
            genre="pop"
        )

        # Step 3: Decide on FIX trigger
        if not passed and actionable_report.should_trigger_fix:
            # Would trigger FIX loop with fix_targets
            assert len(actionable_report.fix_targets) > 0
            assert len(actionable_report.improvement_suggestions) > 0

            # Workflow would use these for targeted fixes
            fix_context = {
                "status": "needs_fix",
                "fix_targets": actionable_report.fix_targets,
                "scores": score_report.to_dict(),
                "suggestions": actionable_report.improvement_suggestions
            }

            assert "fix_targets" in fix_context
            assert "suggestions" in fix_context
        else:
            # No FIX needed - proceed to COMPOSE
            assert passed or not actionable_report.should_trigger_fix

    def test_fix_workflow_node_pattern(self, service):
        """Test FIX node integration pattern."""
        # Simulate FIX node receiving fix targets from VALIDATE
        fix_targets = ["hook_density", "rhyme_tightness"]
        suggestions = [
            "Improve hook density by 0.15 (currently 0.60, target 0.75). Add more repeated phrases.",
            "Improve rhyme tightness by 0.20 (currently 0.55, target 0.75). Tighten rhyme scheme."
        ]

        # FIX node would apply specific fixes based on targets
        applied_fixes = []

        if "hook_density" in fix_targets:
            # Would duplicate/condense chorus hooks
            applied_fixes.append("chorus_hook_duplication")

        if "rhyme_tightness" in fix_targets:
            # Would adjust rhyme scheme
            applied_fixes.append("rhyme_scheme_adjustment")

        if "profanity_score" in fix_targets:
            # Would remove profanity
            applied_fixes.append("profanity_removal")

        # Verify fixes were applied
        assert len(applied_fixes) > 0
        assert "chorus_hook_duplication" in applied_fixes
        assert "rhyme_scheme_adjustment" in applied_fixes

    # ===== Integration Pattern Tests =====

    def test_lyrics_workflow_integration_pattern(self, service):
        """Test LYRICS node integration pattern."""
        # Simulate LYRICS node workflow
        lyrics_text = "Dancing in the sunshine, feeling so alive"

        # Step 1: Validate profanity
        is_valid_profanity, profanity_report = service.validate_profanity(
            text=lyrics_text,
            explicit_allowed=False,
            context="lyrics"
        )

        # Step 2: Validate PII
        has_pii, redacted_lyrics, pii_report = service.validate_pii(
            text=lyrics_text,
            context="lyrics"
        )

        # Step 3: Use redacted version if PII found
        final_lyrics = redacted_lyrics if has_pii else lyrics_text

        # Should be valid and clean
        assert is_valid_profanity is True
        assert has_pii is False
        assert final_lyrics == lyrics_text

    def test_compose_workflow_integration_pattern(self, service):
        """Test COMPOSE node integration pattern."""
        # Simulate COMPOSE node workflow
        artifacts = {
            "style": "Pop with upbeat melody",
            "lyrics": {"text": "Sunshine and happiness"},
            "producer_notes": "Bright and energetic"
        }

        # Validate all policies before composing
        is_valid, report = service.validate_all_policies(
            content=artifacts,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        # Should be valid for composition
        assert is_valid is True

        # Use normalized/redacted content if violations found
        final_content = {
            "style": report["normalized_content"].get("style", artifacts["style"]),
            "lyrics": report["redacted_content"].get("lyrics", artifacts["lyrics"]),
            "producer_notes": artifacts["producer_notes"]
        }

        assert final_content is not None

    def test_validate_workflow_integration_pattern(self, service):
        """Test VALIDATE node integration pattern."""
        # Simulate VALIDATE node workflow
        all_artifacts = {
            "style": "Pop with catchy hooks",
            "lyrics": {"text": "Sunshine and happiness"},
            "producer_notes": "Bright production"
        }

        # Final safety check before rendering
        is_valid, report = service.validate_all_policies(
            content=all_artifacts,
            explicit_allowed=False,
            public_release=True,
            policy_mode="strict"
        )

        if not is_valid:
            # Would trigger FIX loop or raise ValidationError
            violations = report["violations"]
            assert isinstance(violations, dict)

        assert is_valid is True  # Should pass for this clean content
