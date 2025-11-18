"""
Example Test: Comprehensive Guide to AMCS Skill Testing

This module demonstrates how to use the SkillTestCase base class and fixtures
to write comprehensive tests for AMCS workflow skills.

Key Features Demonstrated:
- Inheriting from SkillTestCase
- Using pytest fixtures (sample_sds, blueprints, sources)
- Testing determinism with assert_deterministic()
- Validating events with assert_event_emitted()
- Checking artifact hashes with assert_artifact_hash_valid()
- Using seed constants (TEST_SEED, TEST_SEED_PLAN, etc.)

This is a reference implementation showing best practices for skill testing.
Real skill tests (test_plan.py, test_lyrics.py, etc.) follow this pattern.

Author: AMCS Development Team
Last Updated: 2025-11-18
"""

import pytest
from typing import Dict, Any

from tests.unit.skills.base import SkillTestCase
from app.schemas.skill_contracts import (
    WorkflowContext,
    PlanInput,
    PlanOutput,
    LyricsInput,
    LyricsOutput
)
from app.core.determinism import hash_artifact


class TestExampleSkill(SkillTestCase):
    """
    Example test class demonstrating SkillTestCase usage.

    This class shows how to:
    1. Inherit from SkillTestCase to get base fixtures and helpers
    2. Use pytest fixtures for sample data
    3. Test determinism across multiple runs
    4. Validate skill outputs (events, hashes, citations)
    5. Use seed constants for reproducible tests
    """

    # ==========================================================================
    # Basic Fixture Usage
    # ==========================================================================

    def test_basic_fixture_usage(self, sample_sds_pop):
        """
        Demonstrate basic fixture usage.

        Fixtures are automatically injected by pytest based on parameter names.
        See tests/conftest.py for all available fixtures.
        """
        # Verify pop SDS loaded correctly
        assert sample_sds_pop["genre"] == "pop"
        assert sample_sds_pop["id"] == "sds-pop-001"
        assert sample_sds_pop["title"] == "Summer Nights"
        assert sample_sds_pop["seed"] == 42

    def test_all_genre_fixtures(
        self,
        sample_sds_pop,
        sample_sds_rock,
        sample_sds_hiphop,
        sample_sds_country,
        sample_sds_rnb
    ):
        """
        Demonstrate using multiple genre-specific fixtures.

        Each genre has a dedicated fixture for convenience.
        """
        genres = [
            sample_sds_pop,
            sample_sds_rock,
            sample_sds_hiphop,
            sample_sds_country,
            sample_sds_rnb
        ]

        for sds in genres:
            # All SDSs have required fields
            assert "genre" in sds
            assert "title" in sds
            assert "seed" in sds
            assert "style" in sds
            assert "constraints" in sds

    def test_blueprint_fixture(self, pop_blueprint):
        """
        Demonstrate blueprint fixture usage.

        Blueprints contain genre-specific rules and evaluation rubrics.
        """
        # Verify blueprint structure
        assert pop_blueprint["genre"] == "pop"
        assert "rules" in pop_blueprint
        assert "style_tags" in pop_blueprint
        assert "eval_rubric" in pop_blueprint

        # Verify rubric metrics
        rubric = pop_blueprint["eval_rubric"]
        assert "metrics" in rubric
        assert "hook_density" in rubric["metrics"]
        assert "singability" in rubric["metrics"]
        assert rubric["pass_threshold"] == 0.75

    def test_source_fixtures(self, sample_sources):
        """
        Demonstrate source fixture usage.

        Sources contain text chunks with pre-computed hashes for
        deterministic retrieval in LYRICS skill.
        """
        # Verify 3 sources loaded
        assert len(sample_sources) == 3

        # Verify each source has required fields
        for source in sample_sources:
            assert "id" in source
            assert "title" in source
            assert "chunks" in source

            # Verify chunks have hashes
            for chunk in source["chunks"]:
                assert "text" in chunk
                assert "hash" in chunk
                assert chunk["hash"].startswith("sha256:")

    # ==========================================================================
    # Seed Constants
    # ==========================================================================

    def test_seed_constants(self):
        """
        Demonstrate seed constant usage.

        SkillTestCase provides seed constants for each workflow node:
        - TEST_SEED (base seed = 42)
        - TEST_SEED_PLAN, TEST_SEED_STYLE, TEST_SEED_LYRICS, etc.
        """
        # Base seed
        assert self.TEST_SEED == 42

        # Per-node seeds (base + node_index)
        assert self.TEST_SEED_PLAN == 43      # 42 + 1
        assert self.TEST_SEED_STYLE == 44     # 42 + 2
        assert self.TEST_SEED_LYRICS == 45    # 42 + 3
        assert self.TEST_SEED_PRODUCER == 46  # 42 + 4
        assert self.TEST_SEED_COMPOSE == 47   # 42 + 5
        assert self.TEST_SEED_VALIDATE == 48  # 42 + 6
        assert self.TEST_SEED_FIX == 49       # 42 + 7
        assert self.TEST_SEED_REVIEW == 50    # 42 + 8

    def test_workflow_context_fixture(self, workflow_context):
        """
        Demonstrate workflow_context fixture usage.

        workflow_context is a factory fixture that creates WorkflowContext
        instances with custom seeds and feature flags.
        """
        # Create context with default seed (TEST_SEED)
        ctx = workflow_context()
        assert ctx.seed == self.TEST_SEED
        assert ctx.run_id == "test-run-id"
        assert ctx.song_id == "test-song-id"

        # Create context with custom seed
        ctx_custom = workflow_context(seed=100)
        assert ctx_custom.seed == 100

        # Create context with feature flags
        ctx_flags = workflow_context(
            seed=self.TEST_SEED_LYRICS,
            feature_flags={"eval.autofix.enabled": True}
        )
        assert ctx_flags.seed == self.TEST_SEED_LYRICS
        assert ctx_flags.feature_flags["eval.autofix.enabled"] is True

    # ==========================================================================
    # Determinism Testing
    # ==========================================================================

    def test_determinism_with_helper_function(self):
        """
        Demonstrate determinism testing with assert_deterministic().

        This example tests a simple helper function to show the pattern.
        Real tests would test actual skill.execute() methods.
        """
        def deterministic_function(seed: int) -> Dict[str, Any]:
            """Simple deterministic function for testing."""
            from app.core.determinism import SeededRandom

            rng = SeededRandom(seed)
            return {
                "random_int": rng.randint(1, 100),
                "random_choice": rng.choice(["a", "b", "c"]),
                "random_float": rng.random()
            }

        # Assert function is deterministic across 10 runs
        self.assert_deterministic(
            deterministic_function,
            seed=self.TEST_SEED,
            run_count=10
        )

        # Also verify individual outputs are identical
        result1 = deterministic_function(seed=self.TEST_SEED)
        result2 = deterministic_function(seed=self.TEST_SEED)
        assert result1 == result2

    def test_determinism_failure_example(self):
        """
        Demonstrate what happens when determinism fails.

        This test is intentionally commented out to prevent CI failure.
        Uncomment to see the detailed error message from assert_deterministic().
        """
        # def non_deterministic_function() -> Dict[str, Any]:
        #     """Non-deterministic function using unseeded random."""
        #     import random
        #     return {"value": random.randint(1, 100)}
        #
        # # This would fail with detailed error message
        # self.assert_deterministic(
        #     non_deterministic_function,
        #     run_count=10
        # )
        pass

    # ==========================================================================
    # Event Validation
    # ==========================================================================

    def test_event_validation(self):
        """
        Demonstrate event validation with assert_event_emitted().

        All workflow skills emit structured events for observability.
        This helper ensures expected events are present.
        """
        # Example events from a skill execution
        mock_events = [
            {
                "ts": "2025-11-18T10:00:00Z",
                "run_id": "test-run-id",
                "node": "PLAN",
                "phase": "start",
                "metrics": {}
            },
            {
                "ts": "2025-11-18T10:00:01Z",
                "run_id": "test-run-id",
                "node": "PLAN",
                "phase": "end",
                "duration_ms": 450,
                "metrics": {"sections_created": 8}
            }
        ]

        # Assert start and end events were emitted
        self.assert_event_emitted(mock_events, "PLAN", "start")
        self.assert_event_emitted(mock_events, "PLAN", "end")

    def test_event_validation_failure(self):
        """
        Demonstrate event validation failure.

        Shows what happens when expected event is missing.
        """
        # Events without "fail" phase
        mock_events = [
            {"node": "VALIDATE", "phase": "start"},
            {"node": "VALIDATE", "phase": "end"}
        ]

        # This would raise AssertionError with helpful message
        with pytest.raises(AssertionError) as exc_info:
            self.assert_event_emitted(mock_events, "VALIDATE", "fail")

        assert "Event not found" in str(exc_info.value)

    # ==========================================================================
    # Artifact Hash Validation
    # ==========================================================================

    def test_artifact_hash_validation(self):
        """
        Demonstrate artifact hash validation with assert_artifact_hash_valid().

        All skill outputs must have valid SHA-256 hashes with 'sha256:' prefix.
        """
        # Valid hash format
        valid_hash = "sha256:7f3a8c9d4e1b2f6a5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
        self.assert_artifact_hash_valid(valid_hash)

        # None is also valid (some skills don't produce artifacts)
        self.assert_artifact_hash_valid(None)

    def test_artifact_hash_validation_failure(self):
        """
        Demonstrate artifact hash validation failures.

        Shows error messages for invalid hash formats.
        """
        # Invalid prefix
        with pytest.raises(AssertionError) as exc_info:
            self.assert_artifact_hash_valid("md5:abc123")
        assert "Invalid hash format" in str(exc_info.value)

        # Invalid length (too short)
        with pytest.raises(AssertionError) as exc_info:
            self.assert_artifact_hash_valid("sha256:abc123")
        assert "Invalid SHA-256 hash length" in str(exc_info.value)

        # Invalid characters
        with pytest.raises(AssertionError) as exc_info:
            invalid = "sha256:" + "z" * 64
            self.assert_artifact_hash_valid(invalid)
        assert "Invalid SHA-256 hash characters" in str(exc_info.value)

    # ==========================================================================
    # Citation Validation
    # ==========================================================================

    def test_citation_validation(self, sample_sources):
        """
        Demonstrate citation validation with assert_citations_valid().

        Citations track provenance for LYRICS skill output.
        """
        # Mock citations from LYRICS output
        mock_citations = [
            {
                "id": "cite-1",
                "chunk_hash": "sha256:7f3a8c9d4e1b2f6a5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
                "source_id": "source-love-themes-001",
                "text": "Sample chunk text",
                "weight": 0.9,
                "section": "Verse 1"
            },
            {
                "id": "cite-2",
                "chunk_hash": "sha256:8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
                "source_id": "source-urban-imagery-002",
                "text": "Another chunk",
                "weight": 0.75,
                "section": "Verse 1"
            },
            {
                "id": "cite-3",
                "chunk_hash": "sha256:9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
                "source_id": "source-nature-metaphors-003",
                "text": "Third chunk",
                "weight": 0.85,
                "section": "Chorus"
            }
        ]

        # Validate citations
        source_ids = [s["id"] for s in sample_sources]
        self.assert_citations_valid(
            mock_citations,
            min_count=3,
            required_source_ids=source_ids
        )

    # ==========================================================================
    # Score Validation
    # ==========================================================================

    def test_score_validation(self):
        """
        Demonstrate score validation with assert_scores_in_range().

        VALIDATE skill outputs scores for each rubric metric.
        """
        # Mock scores from VALIDATE output
        mock_scores = {
            "hook_density": 0.85,
            "singability": 0.90,
            "rhyme_tightness": 0.75,
            "section_completeness": 0.95,
            "profanity_score": 0.0
        }

        # Assert all scores in valid range
        self.assert_scores_in_range(mock_scores, min_score=0.0, max_score=1.0)

    def test_score_validation_failure(self):
        """
        Demonstrate score validation failure.

        Shows error message when score is out of range.
        """
        # Score out of range
        invalid_scores = {
            "hook_density": 1.5,  # > 1.0
            "singability": 0.9
        }

        with pytest.raises(AssertionError) as exc_info:
            self.assert_scores_in_range(invalid_scores)
        assert "Score 'hook_density' out of range" in str(exc_info.value)

    # ==========================================================================
    # Integration Example (Combining Multiple Features)
    # ==========================================================================

    def test_integration_example(
        self,
        sample_sds_pop,
        pop_blueprint,
        sample_sources,
        workflow_context
    ):
        """
        Demonstrate complete integration test combining multiple features.

        This shows how a real skill test would look, combining:
        - Fixtures (SDS, blueprint, sources)
        - WorkflowContext with seed constants
        - Determinism testing
        - Output validation (events, hashes, citations, scores)

        Note: This uses mock data since actual skills aren't implemented yet.
        Real tests would call actual skill.execute() methods.
        """
        # 1. Create workflow context with appropriate seed
        ctx = workflow_context(seed=self.TEST_SEED_LYRICS)

        # 2. Mock skill execution (replace with real skill.execute() call)
        mock_result = {
            "status": "success",
            "execution_time_ms": 2340,
            "artifact_hash": "sha256:a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
            "lyrics": {
                "sections": [
                    {
                        "id": "verse1",
                        "type": "verse",
                        "lines": [{"text": "Summer nights...", "citations": ["cite-1"]}]
                    }
                ]
            },
            "citations": [
                {
                    "id": "cite-1",
                    "chunk_hash": sample_sources[0]["chunks"][0]["hash"],
                    "source_id": sample_sources[0]["id"],
                    "text": sample_sources[0]["chunks"][0]["text"],
                    "weight": 0.9,
                    "section": "verse1"
                }
            ],
            "events": [
                {"node": "LYRICS", "phase": "start"},
                {"node": "LYRICS", "phase": "end"}
            ],
            "metrics": {"tokens_used": 500},
            "errors": []
        }

        # 3. Validate outputs
        assert mock_result["status"] == "success"

        # Validate artifact hash
        self.assert_artifact_hash_valid(mock_result["artifact_hash"])

        # Validate events
        self.assert_event_emitted(mock_result["events"], "LYRICS", "start")
        self.assert_event_emitted(mock_result["events"], "LYRICS", "end")

        # Validate citations
        source_ids = [s["id"] for s in sample_sources]
        self.assert_citations_valid(
            mock_result["citations"],
            min_count=1,
            required_source_ids=source_ids
        )

        # 4. Test determinism (with mock function for demonstration)
        def mock_lyrics_skill(ctx, sds, sources):
            return mock_result

        # In real tests, you would assert determinism of actual skill.execute()
        # self.assert_deterministic(
        #     lyrics_skill.execute,
        #     LyricsInput(context=ctx, sds=sds, ...),
        #     run_count=10
        # )


# =============================================================================
# Standalone Tests (not using SkillTestCase)
# =============================================================================

def test_fixture_loading_without_base_class(sample_sds):
    """
    Demonstrate using fixtures without inheriting from SkillTestCase.

    You can use fixtures directly in standalone test functions.
    SkillTestCase is optional but provides helpful assertion methods.
    """
    # Verify all 10 SDSs loaded
    assert len(sample_sds) == 10

    # Verify all genres represented
    genres = {sds["genre"] for sds in sample_sds}
    expected_genres = {
        "pop", "rock", "hip-hop", "country", "rnb",
        "electronic", "indie-alternative", "christmas", "ccm", "kpop"
    }
    assert genres == expected_genres


def test_hash_artifact_function():
    """
    Demonstrate using hash_artifact() directly.

    This is the core function used by assert_artifact_hash_valid().
    """
    # Hash a simple dict
    data = {"key": "value", "number": 42}
    hash1 = hash_artifact(data)
    hash2 = hash_artifact(data)

    # Same input produces same hash
    assert hash1 == hash2

    # Hash has correct format
    assert hash1.startswith("sha256:")
    assert len(hash1) == 71  # "sha256:" + 64 hex chars

    # Different data produces different hash
    different_data = {"key": "different"}
    hash3 = hash_artifact(different_data)
    assert hash1 != hash3
