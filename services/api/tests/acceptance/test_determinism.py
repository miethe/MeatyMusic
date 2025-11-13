"""Determinism acceptance tests for Phase 4.5.

Tests that same inputs + seed produce identical outputs across multiple runs.
Acceptance criterion: ≥99% match rate across 10 runs.

This is a critical requirement for the AMCS system - determinism ensures
reproducibility and allows for debugging, auditing, and comparing runs.
"""

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List
from uuid import uuid4

import pytest
from unittest.mock import AsyncMock, patch

from app.skills import (
    generate_plan,
    generate_style,
    generate_lyrics,
    generate_producer_notes,
    compose_prompt,
)
from app.skills.validate import evaluate_artifacts
from app.skills.fix import apply_fixes
from app.workflows.skill import WorkflowContext


def compute_hash(data: Any) -> str:
    """Compute deterministic hash of any data structure."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()


@pytest.fixture
def sample_sds():
    """Load a sample SDS for determinism testing."""
    test_songs_dir = Path(__file__).parent.parent / "fixtures" / "test_songs"
    sds_path = test_songs_dir / "pop_upbeat.json"
    with open(sds_path) as f:
        return json.load(f)


@pytest.fixture
def determinism_seed():
    """Fixed seed for all determinism tests."""
    return 42


class TestSkillDeterminism:
    """Test determinism of individual workflow skills."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_plan_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test PLAN skill produces identical outputs over 10 runs.

        Acceptance: All 10 runs must produce identical hash.
        """
        context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=0,
            node_name="PLAN",
        )

        inputs = {"sds": sample_sds}
        result = await generate_plan(inputs, context)
        plan = result["plan"]

        # Store first run hash
        if run_idx == 0:
            pytest.plan_first_hash = plan["_hash"]
            pytest.plan_first_data = plan

        # Every run must match first run exactly
        assert plan["_hash"] == pytest.plan_first_hash, f"Run {run_idx} hash mismatch"
        assert plan["section_order"] == pytest.plan_first_data["section_order"]
        assert plan["target_word_counts"] == pytest.plan_first_data["target_word_counts"]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_style_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test STYLE skill produces identical outputs over 10 runs.

        Acceptance: All 10 runs must produce identical hash.
        """
        # Generate plan first
        plan_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=0,
            node_name="PLAN",
        )
        plan_result = await generate_plan({"sds": sample_sds}, plan_context)
        plan = plan_result["plan"]

        # Generate style
        style_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 1,
            node_index=1,
            node_name="STYLE",
        )

        inputs = {"sds_style": sample_sds["style"], "plan": plan}
        result = await generate_style(inputs, style_context)
        style = result["style"]

        # Store first run hash
        if run_idx == 0:
            pytest.style_first_hash = style["_hash"]
            pytest.style_first_data = style

        # Every run must match first run exactly
        assert style["_hash"] == pytest.style_first_hash, f"Run {run_idx} hash mismatch"
        assert style["tempo_bpm"] == pytest.style_first_data["tempo_bpm"]
        assert style["tags"] == pytest.style_first_data["tags"]
        assert style["instrumentation"] == pytest.style_first_data["instrumentation"]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_lyrics_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test LYRICS skill produces identical outputs over 10 runs.

        With mocked LLM (temperature=0), should be 100% deterministic.
        Acceptance: All 10 runs must produce identical hash.
        """
        # Generate prerequisites
        plan_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=0,
            node_name="PLAN",
        )
        plan_result = await generate_plan({"sds": sample_sds}, plan_context)
        plan = plan_result["plan"]

        style_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 1,
            node_index=1,
            node_name="STYLE",
        )
        style_result = await generate_style(
            {"sds_style": sample_sds["style"], "plan": plan}, style_context
        )
        style = style_result["style"]

        # Generate lyrics with mocked LLM
        lyrics_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 2,
            node_index=2,
            node_name="LYRICS",
        )

        # Mock LLM to return deterministic result
        mock_verse = """Dancing through the night so bright
Feel the music burning right
Every moment feels so light
We're together holding tight"""

        mock_chorus = """This is our time to shine
Hearts and souls align
Every moment feels divine
This is our time to shine"""

        with patch("app.skills.lyrics.get_llm_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.generate = AsyncMock(
                side_effect=[mock_verse, mock_chorus, mock_verse, mock_chorus]
            )
            mock_get_client.return_value = mock_client

            inputs = {
                "sds_lyrics": sample_sds["lyrics"],
                "plan": plan,
                "style": style,
                "sources": [],
            }
            result = await generate_lyrics(inputs, lyrics_context)
            lyrics_text = result["lyrics"]

        # Store first run hash
        if run_idx == 0:
            pytest.lyrics_first_hash = compute_hash(lyrics_text)
            pytest.lyrics_first_text = lyrics_text

        # Every run must match first run exactly
        current_hash = compute_hash(lyrics_text)
        assert current_hash == pytest.lyrics_first_hash, f"Run {run_idx} hash mismatch"
        assert lyrics_text == pytest.lyrics_first_text

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_producer_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test PRODUCER skill produces identical outputs over 10 runs.

        Acceptance: All 10 runs must produce identical hash.
        """
        # Generate prerequisites
        plan_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=0,
            node_name="PLAN",
        )
        plan_result = await generate_plan({"sds": sample_sds}, plan_context)
        plan = plan_result["plan"]

        style_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 1,
            node_index=1,
            node_name="STYLE",
        )
        style_result = await generate_style(
            {"sds_style": sample_sds["style"], "plan": plan}, style_context
        )
        style = style_result["style"]

        # Generate producer notes
        producer_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 3,
            node_index=3,
            node_name="PRODUCER",
        )

        inputs = {
            "sds_producer": sample_sds["producer_notes"],
            "plan": plan,
            "style": style,
        }
        result = await generate_producer_notes(inputs, producer_context)
        producer_notes = result["producer_notes"]

        # Store first run hash
        if run_idx == 0:
            pytest.producer_first_hash = producer_notes["_hash"]
            pytest.producer_first_data = producer_notes

        # Every run must match first run exactly
        assert producer_notes["_hash"] == pytest.producer_first_hash, f"Run {run_idx} hash mismatch"
        assert producer_notes["structure"] == pytest.producer_first_data["structure"]
        assert producer_notes["hooks"] == pytest.producer_first_data["hooks"]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_compose_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test COMPOSE skill produces identical outputs over 10 runs.

        Acceptance: All 10 runs must produce identical hash.
        """
        # Generate all prerequisites
        plan_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=0,
            node_name="PLAN",
        )
        plan_result = await generate_plan({"sds": sample_sds}, plan_context)
        plan = plan_result["plan"]

        style_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 1,
            node_index=1,
            node_name="STYLE",
        )
        style_result = await generate_style(
            {"sds_style": sample_sds["style"], "plan": plan}, style_context
        )
        style = style_result["style"]

        # Use fixed lyrics for determinism
        lyrics = """[Verse]
Dancing through the night so bright
Feel the music burning right

[Chorus]
This is our time to shine
Hearts and souls align"""

        producer_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 3,
            node_index=3,
            node_name="PRODUCER",
        )
        producer_result = await generate_producer_notes(
            {"sds_producer": sample_sds["producer_notes"], "plan": plan, "style": style},
            producer_context,
        )
        producer_notes = producer_result["producer_notes"]

        # Compose prompt
        compose_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed + 4,
            node_index=4,
            node_name="COMPOSE",
        )

        inputs = {
            "style": style,
            "lyrics": lyrics,
            "producer_notes": producer_notes,
            "sds": sample_sds,
        }
        result = await compose_prompt(inputs, compose_context)

        # Store first run hash
        if run_idx == 0:
            pytest.compose_first_hash = result["_hash"]
            pytest.compose_first_data = result["composed_prompt"]

        # Every run must match first run exactly
        assert result["_hash"] == pytest.compose_first_hash, f"Run {run_idx} hash mismatch"
        assert result["composed_prompt"]["text"] == pytest.compose_first_data["text"]
        assert result["composed_prompt"]["meta"] == pytest.compose_first_data["meta"]


class TestValidateDeterminism:
    """Test determinism of VALIDATE skill."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_validate_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test VALIDATE skill produces identical scores over 10 runs.

        Acceptance: All 10 runs must produce identical scores.
        """
        # Fixed artifacts to validate
        style = sample_sds["style"]
        lyrics = """[Verse]
Dancing through the night so bright
Feel the music burning right
Every moment feels so light
We're together holding tight

[Chorus]
This is our time to shine
Hearts and souls align
Every moment feels divine
This is our time to shine"""

        producer_notes = {
            "structure": "Verse–Chorus–Verse–Chorus",
            "hooks": 2,
            "instrumentation": ["synth", "drums"],
            "section_meta": {},
            "mix": {"lufs": -12.0, "space": "normal", "stereo_width": "wide"},
        }

        validate_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=5,
            node_name="VALIDATE",
        )

        inputs = {
            "lyrics": lyrics,
            "style": style,
            "producer_notes": producer_notes,
            "blueprint_ref": sample_sds["blueprint_ref"],
        }

        result = await evaluate_artifacts(inputs, validate_context)
        scores = result["scores"]

        # Store first run scores
        if run_idx == 0:
            pytest.validate_first_scores = scores

        # Every run must produce identical scores
        assert scores == pytest.validate_first_scores, f"Run {run_idx} scores mismatch"
        assert scores["total"] == pytest.validate_first_scores["total"]


class TestFixDeterminism:
    """Test determinism of FIX skill."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_fix_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test FIX skill produces consistent fixes over 10 runs.

        With low temperature (0.2), should be highly deterministic.
        Acceptance: All 10 runs must produce identical fixes.
        """
        # Fixed artifacts with issues
        style = sample_sds["style"]
        lyrics = """[Verse]
Simple verse line one
Simple verse line two

[Chorus]
Short chorus"""  # Intentionally weak for fixing

        producer_notes = {
            "structure": "Verse–Chorus",
            "hooks": 1,
            "instrumentation": ["synth"],
            "section_meta": {},
            "mix": {"lufs": -12.0, "space": "normal", "stereo_width": "wide"},
        }

        issues = [
            "Low hook density: 0.2 (target ≥0.4)",
            "Weak rhyme tightness: 0.3 (target ≥0.7)",
        ]

        fix_context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=determinism_seed,
            node_index=6,
            node_name="FIX",
        )

        # Mock LLM for deterministic fixes
        fixed_lyrics = """[Verse]
Dancing through the night so bright
Feel the music burning right
Every moment feels so light
We're together holding tight

[Chorus]
This is our time to shine
Hearts and souls align
Every moment feels divine
This is our time to shine"""

        with patch("app.skills.fix.get_llm_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.generate = AsyncMock(return_value=fixed_lyrics)
            mock_get_client.return_value = mock_client

            inputs = {
                "issues": issues,
                "style": style,
                "lyrics": lyrics,
                "producer_notes": producer_notes,
                "blueprint_ref": sample_sds["blueprint_ref"],
            }

            result = await apply_fixes(inputs, fix_context)
            patched_lyrics = result["patched_lyrics"]

        # Store first run result
        if run_idx == 0:
            pytest.fix_first_hash = compute_hash(patched_lyrics)
            pytest.fix_first_lyrics = patched_lyrics

        # Every run must match first run (with mocked LLM)
        current_hash = compute_hash(patched_lyrics)
        assert current_hash == pytest.fix_first_hash, f"Run {run_idx} hash mismatch"
        assert patched_lyrics == pytest.fix_first_lyrics


class TestEndToEndDeterminism:
    """Test determinism of full workflow execution."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("run_idx", range(10))
    async def test_full_workflow_determinism_10_runs(self, sample_sds, determinism_seed, run_idx):
        """Test complete workflow produces identical outputs over 10 runs.

        This is the critical end-to-end determinism test.
        Acceptance: ≥99% match rate (9/10 or 10/10 runs identical).
        """
        run_id = uuid4()
        song_id = uuid4()

        # PLAN
        plan_ctx = WorkflowContext(
            run_id=run_id,
            song_id=song_id,
            seed=determinism_seed,
            node_index=0,
            node_name="PLAN",
        )
        plan_result = await generate_plan({"sds": sample_sds}, plan_ctx)
        plan = plan_result["plan"]

        # STYLE
        style_ctx = WorkflowContext(
            run_id=run_id,
            song_id=song_id,
            seed=determinism_seed + 1,
            node_index=1,
            node_name="STYLE",
        )
        style_result = await generate_style(
            {"sds_style": sample_sds["style"], "plan": plan}, style_ctx
        )
        style = style_result["style"]

        # LYRICS (mocked for determinism)
        lyrics_ctx = WorkflowContext(
            run_id=run_id,
            song_id=song_id,
            seed=determinism_seed + 2,
            node_index=2,
            node_name="LYRICS",
        )

        mock_lyrics = """[Verse]
Dancing through the night so bright
Feel the music burning right

[Chorus]
This is our time to shine
Hearts and souls align

[Verse]
Living free without a care
Music flowing everywhere

[Chorus]
This is our time to shine
Hearts and souls align"""

        with patch("app.skills.lyrics.get_llm_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.generate = AsyncMock(return_value=mock_lyrics)
            mock_get_client.return_value = mock_client

            lyrics_result = await generate_lyrics(
                {
                    "sds_lyrics": sample_sds["lyrics"],
                    "plan": plan,
                    "style": style,
                    "sources": [],
                },
                lyrics_ctx,
            )
        lyrics = lyrics_result["lyrics"]

        # PRODUCER
        producer_ctx = WorkflowContext(
            run_id=run_id,
            song_id=song_id,
            seed=determinism_seed + 3,
            node_index=3,
            node_name="PRODUCER",
        )
        producer_result = await generate_producer_notes(
            {"sds_producer": sample_sds["producer_notes"], "plan": plan, "style": style},
            producer_ctx,
        )
        producer_notes = producer_result["producer_notes"]

        # COMPOSE
        compose_ctx = WorkflowContext(
            run_id=run_id,
            song_id=song_id,
            seed=determinism_seed + 4,
            node_index=4,
            node_name="COMPOSE",
        )
        compose_result = await compose_prompt(
            {
                "style": style,
                "lyrics": lyrics,
                "producer_notes": producer_notes,
                "sds": sample_sds,
            },
            compose_ctx,
        )

        # Compute final hash from all outputs
        final_output = {
            "plan": plan,
            "style": style,
            "lyrics": lyrics,
            "producer_notes": producer_notes,
            "composed_prompt": compose_result["composed_prompt"],
        }
        final_hash = compute_hash(final_output)

        # Store first run hash
        if run_idx == 0:
            pytest.e2e_first_hash = final_hash
            pytest.e2e_first_output = final_output
            pytest.e2e_match_count = 0

        # Track matches
        if final_hash == pytest.e2e_first_hash:
            pytest.e2e_match_count += 1

        # After all runs, check match rate
        if run_idx == 9:  # Last run
            match_rate = pytest.e2e_match_count / 10
            assert match_rate >= 0.99, (
                f"End-to-end determinism failed: {pytest.e2e_match_count}/10 matches "
                f"({match_rate:.1%}), required ≥99%"
            )


@pytest.mark.asyncio
async def test_determinism_acceptance_summary(sample_sds, determinism_seed):
    """Summary test that validates overall determinism acceptance criteria.

    Acceptance: ≥99% match rate across 10 runs for complete workflow.
    """
    matches = 0
    total_runs = 10
    first_hash = None

    for run_idx in range(total_runs):
        run_id = uuid4()
        song_id = uuid4()

        # Run complete workflow
        plan_result = await generate_plan(
            {"sds": sample_sds},
            WorkflowContext(run_id=run_id, song_id=song_id, seed=determinism_seed, node_index=0, node_name="PLAN"),
        )

        style_result = await generate_style(
            {"sds_style": sample_sds["style"], "plan": plan_result["plan"]},
            WorkflowContext(run_id=run_id, song_id=song_id, seed=determinism_seed + 1, node_index=1, node_name="STYLE"),
        )

        producer_result = await generate_producer_notes(
            {"sds_producer": sample_sds["producer_notes"], "plan": plan_result["plan"], "style": style_result["style"]},
            WorkflowContext(run_id=run_id, song_id=song_id, seed=determinism_seed + 3, node_index=3, node_name="PRODUCER"),
        )

        # Use fixed lyrics for determinism
        lyrics = "[Verse]\nTest verse\n\n[Chorus]\nTest chorus"

        compose_result = await compose_prompt(
            {
                "style": style_result["style"],
                "lyrics": lyrics,
                "producer_notes": producer_result["producer_notes"],
                "sds": sample_sds,
            },
            WorkflowContext(run_id=run_id, song_id=song_id, seed=determinism_seed + 4, node_index=4, node_name="COMPOSE"),
        )

        # Compute hash
        final_output = {
            "plan": plan_result["plan"],
            "style": style_result["style"],
            "producer_notes": producer_result["producer_notes"],
            "composed_prompt": compose_result["composed_prompt"],
        }
        current_hash = compute_hash(final_output)

        if run_idx == 0:
            first_hash = current_hash
            matches = 1
        elif current_hash == first_hash:
            matches += 1

    match_rate = matches / total_runs
    assert match_rate >= 0.99, (
        f"Determinism acceptance test FAILED: {matches}/{total_runs} matches "
        f"({match_rate:.1%}), required ≥99%"
    )

    print(f"\n✓ Determinism acceptance test PASSED: {matches}/{total_runs} matches ({match_rate:.1%})")
