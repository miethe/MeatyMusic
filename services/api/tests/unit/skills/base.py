"""
Base Test Class for AMCS Workflow Skills

This module provides SkillTestCase, a base class that all skill unit tests inherit from.
It provides common fixtures, assertion helpers, and seed constants for reproducible testing.

Usage:
    ```python
    from tests.unit.skills.base import SkillTestCase

    class TestPlanSkill(SkillTestCase):
        def test_plan_basic(self, sample_sds_pop):
            # Use seed constants for reproducibility
            result = plan_skill(sample_sds_pop, seed=self.TEST_SEED_PLAN)

            # Assert determinism across 10 runs
            self.assert_deterministic(plan_skill, sample_sds_pop, seed=self.TEST_SEED_PLAN)

            # Assert events were emitted
            self.assert_event_emitted(result.events, "PLAN", "end")

            # Assert artifact hash is valid
            self.assert_artifact_hash_valid(result.artifact_hash)
    ```

Key Features:
- Seed constants (TEST_SEED, TEST_SEED_PLAN, etc.) for reproducible tests
- assert_deterministic() verifies ≥99% reproducibility across N runs
- assert_event_emitted() validates workflow event presence
- assert_artifact_hash_valid() checks SHA-256 hash format
- Common fixtures via pytest (sample_sds, sample_blueprints, sample_sources)

Author: AMCS Development Team
Last Updated: 2025-11-18
"""

import pytest
from typing import Any, Callable, Dict, List, Optional

from app.core.determinism import hash_artifact
from app.schemas.skill_contracts import WorkflowContext


class SkillTestCase:
    """
    Base class for all AMCS workflow skill unit tests.

    Provides:
    - Common test fixtures (sample SDS, blueprints, sources)
    - Assertion helpers for determinism, events, artifacts
    - Seed constants for reproducible tests (TEST_SEED, TEST_SEED_PLAN, etc.)

    Workflow Node Seed Mapping:
    - TEST_SEED = 42 (base seed for all tests)
    - TEST_SEED_PLAN = 43 (PLAN skill, node_index=1)
    - TEST_SEED_STYLE = 44 (STYLE skill, node_index=2)
    - TEST_SEED_LYRICS = 45 (LYRICS skill, node_index=3)
    - TEST_SEED_PRODUCER = 46 (PRODUCER skill, node_index=4)
    - TEST_SEED_COMPOSE = 47 (COMPOSE skill, node_index=5)
    - TEST_SEED_VALIDATE = 48 (VALIDATE skill, node_index=6)
    - TEST_SEED_FIX = 49 (FIX skill, node_index=7)
    - TEST_SEED_REVIEW = 50 (REVIEW skill, node_index=8)

    Usage:
        ```python
        class TestLyricsSkill(SkillTestCase):
            def test_lyrics_generation(self, sample_sds_pop, pop_blueprint):
                # Use LYRICS skill seed constant
                result = lyrics_skill.execute(
                    LyricsInput(
                        context=self.workflow_context(seed=self.TEST_SEED),
                        sds=sample_sds_pop,
                        blueprint=pop_blueprint,
                        ...
                    )
                )

                # Assert determinism
                self.assert_deterministic(
                    lyrics_skill.execute,
                    LyricsInput(...),
                    run_count=10
                )
        ```
    """

    # Base seed for all tests (should match the seed in fixture generation)
    TEST_SEED = 42

    # Per-skill derived seeds (base_seed + node_index)
    # Node index mapping: PLAN=1, STYLE=2, LYRICS=3, PRODUCER=4,
    #                     COMPOSE=5, VALIDATE=6, FIX=7, REVIEW=8
    TEST_SEED_PLAN = 43      # 42 + 1
    TEST_SEED_STYLE = 44     # 42 + 2
    TEST_SEED_LYRICS = 45    # 42 + 3
    TEST_SEED_PRODUCER = 46  # 42 + 4
    TEST_SEED_COMPOSE = 47   # 42 + 5
    TEST_SEED_VALIDATE = 48  # 42 + 6
    TEST_SEED_FIX = 49       # 42 + 7
    TEST_SEED_REVIEW = 50    # 42 + 8

    @pytest.fixture
    def workflow_context(self) -> Callable[[Optional[int], Optional[Dict[str, bool]]], WorkflowContext]:
        """
        Factory fixture for creating WorkflowContext instances.

        Returns a callable that creates WorkflowContext with custom seed and feature flags.

        Args:
            seed: Random seed (defaults to TEST_SEED)
            feature_flags: Feature flag overrides (defaults to {})

        Returns:
            Callable that creates WorkflowContext instances

        Example:
            ```python
            def test_with_custom_seed(self, workflow_context):
                ctx = workflow_context(seed=100)
                assert ctx.seed == 100

            def test_with_flags(self, workflow_context):
                ctx = workflow_context(feature_flags={"eval.autofix.enabled": True})
                assert ctx.feature_flags["eval.autofix.enabled"] is True
            ```
        """
        def _create_context(
            seed: Optional[int] = None,
            feature_flags: Optional[Dict[str, bool]] = None
        ) -> WorkflowContext:
            return WorkflowContext(
                run_id="test-run-id",
                song_id="test-song-id",
                seed=seed if seed is not None else self.TEST_SEED,
                feature_flags=feature_flags or {}
            )
        return _create_context

    def assert_deterministic(
        self,
        skill_fn: Callable,
        *args,
        run_count: int = 10,
        **kwargs
    ) -> None:
        """
        Assert that skill function produces deterministic outputs across multiple runs.

        Executes skill_fn N times with identical arguments and verifies that all
        outputs have identical SHA-256 hashes. This is the core determinism test
        for AMCS workflow skills.

        Requirements:
        - All outputs must have identical hashes (e99% reproducibility target)
        - Works with any callable that returns dict, str, or bytes
        - Useful for testing both skill execute() methods and helper functions

        Args:
            skill_fn: Callable to test (skill.execute, helper function, etc.)
            *args: Positional arguments to pass to skill_fn
            run_count: Number of runs to execute (default 10)
            **kwargs: Keyword arguments to pass to skill_fn

        Raises:
            AssertionError: If outputs differ across runs (non-deterministic behavior)

        Example:
            ```python
            # Test skill execute method
            def test_lyrics_determinism(self, sample_sds_pop):
                input_data = LyricsInput(
                    context=self.workflow_context(seed=self.TEST_SEED_LYRICS),
                    sds=sample_sds_pop,
                    ...
                )
                self.assert_deterministic(
                    lyrics_skill.execute,
                    input_data,
                    run_count=10
                )

            # Test helper function
            def test_rhyme_generator_determinism(self):
                self.assert_deterministic(
                    generate_rhyme_scheme,
                    "pop",
                    seed=42,
                    run_count=5
                )
            ```
        """
        # Run skill multiple times
        results = []
        for i in range(run_count):
            result = skill_fn(*args, **kwargs)
            results.append(result)

        # Hash each output
        # Support both dict outputs and skill output objects with .dict() method
        hashes = []
        for result in results:
            if hasattr(result, "dict"):
                # Pydantic model (SkillOutput subclass)
                result_dict = result.dict()
            elif isinstance(result, dict):
                result_dict = result
            else:
                # Convert to string for hashing
                result_dict = str(result)

            artifact_hash = hash_artifact(result_dict)
            hashes.append(artifact_hash)

        # All hashes must be identical
        unique_hashes = set(hashes)
        assert len(unique_hashes) == 1, (
            f"Non-deterministic output detected!\n"
            f"Function: {skill_fn.__name__}\n"
            f"Runs: {run_count}\n"
            f"Unique outputs: {len(unique_hashes)}\n"
            f"Hashes: {unique_hashes}\n"
            f"Expected: 1 unique hash (100% reproducibility)\n"
            f"Got: {len(unique_hashes)} different hashes\n"
            f"\nThis violates AMCS determinism requirement (e99% reproducibility).\n"
            f"Check for:\n"
            f"  - Unseeded random operations\n"
            f"  - datetime.now() or datetime.utcnow() calls\n"
            f"  - Unordered dict/set iteration\n"
            f"  - Non-deterministic database queries (missing ORDER BY)\n"
            f"  - Floating-point precision issues"
        )

    def assert_event_emitted(
        self,
        events: List[Dict[str, Any]],
        node_name: str,
        phase: str
    ) -> None:
        """
        Assert that a specific workflow event was emitted.

        All AMCS workflow skills emit structured events for observability.
        This helper verifies that expected events (start, end, fail) were emitted.

        Event Structure:
            {
                "ts": "2025-11-18T10:00:00Z",
                "run_id": "uuid",
                "node": "LYRICS",
                "phase": "start|end|fail",
                "duration_ms": 1234,
                "metrics": {...},
                "issues": [...]
            }

        Args:
            events: List of event dicts from skill output (.events field)
            node_name: Expected node name (e.g., "PLAN", "LYRICS", "VALIDATE")
            phase: Expected phase ("start", "end", or "fail")

        Raises:
            AssertionError: If no matching event found

        Example:
            ```python
            def test_lyrics_emits_events(self, sample_sds_pop):
                result = lyrics_skill.execute(...)

                # Assert start and end events were emitted
                self.assert_event_emitted(result.events, "LYRICS", "start")
                self.assert_event_emitted(result.events, "LYRICS", "end")

            def test_validate_failure_emits_fail_event(self):
                result = validate_skill.execute(...)  # Intentionally failing input

                # Assert fail event was emitted
                self.assert_event_emitted(result.events, "VALIDATE", "fail")
            ```
        """
        matching_events = [
            e for e in events
            if e.get("node") == node_name and e.get("phase") == phase
        ]

        assert len(matching_events) > 0, (
            f"Event not found in skill output!\n"
            f"Expected: node={node_name}, phase={phase}\n"
            f"Available events: {events}\n"
            f"\nAll workflow skills must emit start/end/fail events for observability.\n"
            f"Check skill implementation for proper event emission."
        )

    def assert_artifact_hash_valid(self, artifact_hash: Optional[str]) -> None:
        """
        Assert that artifact hash is valid SHA-256 format with 'sha256:' prefix.

        All AMCS artifacts must have SHA-256 hashes for provenance tracking.
        This helper validates hash format: 'sha256:' prefix + 64 hex characters.

        Valid format: 'sha256:abc123...def' (64 hex chars after prefix)

        Args:
            artifact_hash: Hash string to validate (can be None for skills without artifacts)

        Raises:
            AssertionError: If hash format is invalid

        Example:
            ```python
            def test_lyrics_has_valid_hash(self, sample_sds_pop):
                result = lyrics_skill.execute(...)

                # Assert artifact hash is valid SHA-256
                self.assert_artifact_hash_valid(result.artifact_hash)

            def test_validate_has_no_artifact_hash(self):
                result = validate_skill.execute(...)

                # VALIDATE skill may not produce artifact hash
                # (validation report is not considered an artifact)
                if result.artifact_hash:
                    self.assert_artifact_hash_valid(result.artifact_hash)
            ```
        """
        if artifact_hash is None:
            # Some skills may not produce artifacts (e.g., VALIDATE)
            # This is acceptable, so we just return without error
            return

        # Check prefix
        assert artifact_hash.startswith("sha256:"), (
            f"Invalid hash format: {artifact_hash}\n"
            f"Expected format: 'sha256:' prefix + 64 hex characters\n"
            f"Got prefix: '{artifact_hash.split(':', 1)[0]}:'\n"
            f"\nAll AMCS artifact hashes must use SHA-256 with 'sha256:' prefix."
        )

        # Extract hash value (after prefix)
        hash_value = artifact_hash.split(":", 1)[1]

        # Check length (SHA-256 = 64 hex characters)
        assert len(hash_value) == 64, (
            f"Invalid SHA-256 hash length: {len(hash_value)}\n"
            f"Expected: 64 hex characters\n"
            f"Got: {len(hash_value)} characters\n"
            f"Hash value: {hash_value}\n"
            f"\nSHA-256 hashes must be exactly 64 hexadecimal characters."
        )

        # Check all characters are hexadecimal
        assert all(c in "0123456789abcdef" for c in hash_value), (
            f"Invalid SHA-256 hash characters: {hash_value}\n"
            f"Expected: only hexadecimal characters (0-9, a-f)\n"
            f"\nHash must contain only lowercase hex digits."
        )

    def assert_citations_valid(
        self,
        citations: List[Dict[str, Any]],
        min_count: int = 1,
        required_source_ids: Optional[List[str]] = None
    ) -> None:
        """
        Assert that citations list is valid and meets requirements.

        Citations track provenance for LYRICS skill output. This helper validates:
        - Citation count meets minimum
        - All citations have required fields (chunk_hash, source_id, text, weight)
        - Chunk hashes are valid SHA-256 format
        - Source IDs match expected sources (if provided)

        Citation Structure:
            {
                "id": "cite-1",
                "chunk_hash": "sha256:abc...",
                "source_id": "src-123",
                "text": "Original source text",
                "weight": 0.9,
                "section": "verse1"
            }

        Args:
            citations: List of citation dicts from LyricsOutput
            min_count: Minimum number of citations required (default 1)
            required_source_ids: Optional list of source IDs that must be present

        Raises:
            AssertionError: If citations are invalid or don't meet requirements

        Example:
            ```python
            def test_lyrics_has_citations(self, sample_sds_pop, sample_sources):
                result = lyrics_skill.execute(...)

                # Assert at least 3 citations from expected sources
                self.assert_citations_valid(
                    result.citations,
                    min_count=3,
                    required_source_ids=[s["id"] for s in sample_sources]
                )
            ```
        """
        # Check minimum count
        assert len(citations) >= min_count, (
            f"Insufficient citations!\n"
            f"Expected: at least {min_count}\n"
            f"Got: {len(citations)}\n"
            f"\nLyrics must cite source chunks for provenance tracking."
        )

        # Validate each citation
        for i, citation in enumerate(citations):
            # Check required fields
            required_fields = {"chunk_hash", "source_id", "text", "weight"}
            missing_fields = required_fields - set(citation.keys())
            assert not missing_fields, (
                f"Citation {i} missing required fields: {missing_fields}\n"
                f"Citation: {citation}\n"
                f"Required: {required_fields}"
            )

            # Validate chunk hash
            self.assert_artifact_hash_valid(citation["chunk_hash"])

            # Validate weight range
            weight = citation["weight"]
            assert 0.0 <= weight <= 1.0, (
                f"Citation {i} has invalid weight: {weight}\n"
                f"Expected: 0.0-1.0\n"
                f"Citation: {citation}"
            )

        # Check source IDs if provided
        if required_source_ids:
            citation_source_ids = {c["source_id"] for c in citations}
            assert citation_source_ids.issubset(set(required_source_ids)), (
                f"Citations reference unexpected source IDs!\n"
                f"Expected sources: {required_source_ids}\n"
                f"Citation sources: {citation_source_ids}\n"
                f"Unexpected: {citation_source_ids - set(required_source_ids)}"
            )

    def assert_scores_in_range(
        self,
        scores: Dict[str, float],
        min_score: float = 0.0,
        max_score: float = 1.0
    ) -> None:
        """
        Assert that all validation scores are within expected range.

        VALIDATE skill outputs scores for each rubric metric. This helper ensures
        all scores are valid (typically 0.0-1.0 range).

        Args:
            scores: Dict of metric scores from ValidateOutput
            min_score: Minimum valid score (default 0.0)
            max_score: Maximum valid score (default 1.0)

        Raises:
            AssertionError: If any score is out of range

        Example:
            ```python
            def test_validate_scores_in_range(self):
                result = validate_skill.execute(...)

                # Assert all scores are 0.0-1.0
                self.assert_scores_in_range(result.scores)

                # Or with custom range
                self.assert_scores_in_range(result.scores, min_score=0.5, max_score=1.0)
            ```
        """
        for metric, score in scores.items():
            assert min_score <= score <= max_score, (
                f"Score '{metric}' out of range!\n"
                f"Value: {score}\n"
                f"Expected range: [{min_score}, {max_score}]\n"
                f"All scores: {scores}"
            )


__all__ = ["SkillTestCase"]
