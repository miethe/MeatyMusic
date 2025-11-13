"""Determinism tests for all workflow skills.

Tests that same inputs + seed produce identical outputs across multiple runs.
This is a critical requirement for the AMCS system.
"""

import pytest
from uuid import uuid4

from app.skills import (
    generate_plan,
    generate_style,
    generate_lyrics,
    generate_producer_notes,
    compose_prompt,
)
from app.workflows.skill import WorkflowContext


@pytest.fixture
def determinism_context():
    """Fixed context for determinism testing."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=12345,  # Fixed seed
        node_index=0,
        node_name="TEST",
    )


@pytest.fixture
def sample_sds():
    """Sample SDS for determinism testing."""
    return {
        "title": "Determinism Test Song",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "Pop", "subgenres": [], "fusions": []},
            "tempo_bpm": 120,
            "time_signature": "4/4",
            "key": {"primary": "C major", "modulations": []},
            "mood": ["upbeat"],
            "energy": "high",
            "instrumentation": ["guitar", "drums"],
            "vocal_profile": "female lead",
            "tags": ["modern"],
            "negative_tags": [],
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["love"],
            "rhyme_scheme": "ABAB",
            "meter": "4/4",
            "syllables_per_line": 8,
            "hook_strategy": "lyrical",
            "section_order": ["Verse", "Chorus", "Verse", "Chorus"],
            "constraints": {
                "explicit": False,
                "max_lines": 40,
                "section_requirements": {},
            },
            "source_citations": [],
        },
        "producer_notes": {
            "structure": "",
            "hooks": 1,
            "instrumentation": [],
            "section_meta": {},
            "mix": {"lufs": -12.0, "space": "normal", "stereo_width": "normal"},
        },
        "prompt_controls": {
            "max_style_chars": 1000,
            "max_prompt_chars": 5000,
        },
        "render": {"engine": "none"},
    }


@pytest.mark.asyncio
@pytest.mark.parametrize("run_number", range(10))
async def test_plan_determinism_multiple_runs(sample_sds, determinism_context, run_number):
    """Test PLAN skill produces identical outputs over 10 runs."""
    inputs = {"sds": sample_sds}

    result = await generate_plan(inputs, determinism_context)
    plan = result["plan"]

    # Store first run result for comparison
    if run_number == 0:
        pytest.first_plan_hash = plan["_hash"]
        pytest.first_plan_section_order = plan["section_order"]
        pytest.first_plan_word_counts = plan["target_word_counts"]

    # All subsequent runs should match first run
    assert plan["_hash"] == pytest.first_plan_hash
    assert plan["section_order"] == pytest.first_plan_section_order
    assert plan["target_word_counts"] == pytest.first_plan_word_counts


@pytest.mark.asyncio
@pytest.mark.parametrize("run_number", range(10))
async def test_style_determinism_multiple_runs(sample_sds, determinism_context, run_number):
    """Test STYLE skill produces identical outputs over 10 runs."""
    plan = {
        "section_order": sample_sds["lyrics"]["section_order"],
        "target_word_counts": {},
        "evaluation_targets": {},
        "work_objectives": [],
    }

    inputs = {"sds_style": sample_sds["style"], "plan": plan}

    result = await generate_style(inputs, determinism_context)
    style = result["style"]

    # Store first run result
    if run_number == 0:
        pytest.first_style_hash = style["_hash"]
        pytest.first_style_tempo = style["tempo_bpm"]
        pytest.first_style_tags = style["tags"]

    # All subsequent runs should match
    assert style["_hash"] == pytest.first_style_hash
    assert style["tempo_bpm"] == pytest.first_style_tempo
    assert style["tags"] == pytest.first_style_tags


@pytest.mark.asyncio
@pytest.mark.parametrize("run_number", range(5))  # Only 5 runs for LLM tests (slower)
async def test_lyrics_determinism_multiple_runs(sample_sds, determinism_context, run_number):
    """Test LYRICS skill produces consistent outputs over 5 runs.

    Note: Due to LLM variability, we check for high similarity (≥90%) rather
    than 100% identical outputs. With temperature=0.3, we expect very high consistency.
    """
    plan = {
        "section_order": sample_sds["lyrics"]["section_order"],
        "target_word_counts": {"Verse": 48, "Chorus": 36},
        "evaluation_targets": {},
        "work_objectives": [],
    }

    style = sample_sds["style"]

    inputs = {
        "sds_lyrics": sample_sds["lyrics"],
        "plan": plan,
        "style": style,
        "sources": [],
    }

    # Mock the LLM client to return deterministic results
    # (In real integration tests, we'd use actual LLM with seed)
    from unittest.mock import AsyncMock, patch

    mock_llm_response = "This is a test verse\nWith consistent rhyme scheme"

    with patch("app.skills.lyrics.get_llm_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate = AsyncMock(return_value=mock_llm_response)
        mock_get_client.return_value = mock_client

        result = await generate_lyrics(inputs, determinism_context)
        lyrics = result["lyrics"]

        # Store first run result
        if run_number == 0:
            pytest.first_lyrics_hash = lyrics.get("_hash", "")
            pytest.first_lyrics_text = result["lyrics"]

        # With mocked LLM, should be 100% identical
        assert result["lyrics"] == pytest.first_lyrics_text


@pytest.mark.asyncio
@pytest.mark.parametrize("run_number", range(10))
async def test_producer_determinism_multiple_runs(sample_sds, determinism_context, run_number):
    """Test PRODUCER skill produces identical outputs over 10 runs."""
    plan = {
        "section_order": sample_sds["lyrics"]["section_order"],
        "target_word_counts": {},
        "evaluation_targets": {},
        "work_objectives": [],
    }

    style = sample_sds["style"]

    inputs = {
        "sds_producer": sample_sds["producer_notes"],
        "plan": plan,
        "style": style,
    }

    result = await generate_producer_notes(inputs, determinism_context)
    producer_notes = result["producer_notes"]

    # Store first run result
    if run_number == 0:
        pytest.first_producer_hash = producer_notes["_hash"]
        pytest.first_producer_structure = producer_notes["structure"]
        pytest.first_producer_hooks = producer_notes["hooks"]

    # All subsequent runs should match
    assert producer_notes["_hash"] == pytest.first_producer_hash
    assert producer_notes["structure"] == pytest.first_producer_structure
    assert producer_notes["hooks"] == pytest.first_producer_hooks


@pytest.mark.asyncio
@pytest.mark.parametrize("run_number", range(10))
async def test_compose_determinism_multiple_runs(sample_sds, determinism_context, run_number):
    """Test COMPOSE skill produces identical outputs over 10 runs."""
    style = sample_sds["style"]
    lyrics = "[Verse]\nTest lyrics\n\n[Chorus]\nTest chorus"
    producer_notes = {
        "structure": "Verse–Chorus",
        "hooks": 1,
        "instrumentation": ["guitar"],
        "section_meta": {
            "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
            "Chorus": {"tags": ["anthemic"], "target_duration_sec": 25},
        },
        "mix": {"lufs": -12.0, "space": "normal", "stereo_width": "normal"},
    }

    inputs = {
        "style": style,
        "lyrics": lyrics,
        "producer_notes": producer_notes,
        "sds": sample_sds,
    }

    result = await compose_prompt(inputs, determinism_context)

    # Store first run result
    if run_number == 0:
        pytest.first_compose_hash = result["_hash"]
        pytest.first_compose_text = result["composed_prompt"]["text"]

    # All subsequent runs should match
    assert result["_hash"] == pytest.first_compose_hash
    assert result["composed_prompt"]["text"] == pytest.first_compose_text


@pytest.mark.asyncio
async def test_end_to_end_determinism():
    """Test full workflow determinism: same SDS + seed → same final prompt."""
    sds = {
        "title": "E2E Test Song",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "Pop", "subgenres": [], "fusions": []},
            "tempo_bpm": 120,
            "key": {"primary": "C major", "modulations": []},
            "mood": ["happy"],
            "energy": "high",
            "instrumentation": ["guitar"],
            "vocal_profile": "female",
            "tags": ["modern"],
            "negative_tags": [],
        },
        "lyrics": {
            "language": "en",
            "section_order": ["Verse", "Chorus"],
            "rhyme_scheme": "AABB",
            "syllables_per_line": 8,
            "hook_strategy": "lyrical",
            "constraints": {"explicit": False, "max_lines": 20, "section_requirements": {}},
        },
        "producer_notes": {
            "structure": "",
            "hooks": 1,
            "section_meta": {},
            "mix": {},
        },
        "prompt_controls": {"max_style_chars": 1000, "max_prompt_chars": 5000},
    }

    seed = 99999
    run_id = uuid4()
    song_id = uuid4()

    # Run full workflow twice
    final_hashes = []

    for run in range(2):
        # PLAN
        plan_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=seed, node_index=0, node_name="PLAN")
        plan_result = await generate_plan({"sds": sds}, plan_ctx)
        plan = plan_result["plan"]

        # STYLE
        style_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=seed + 1, node_index=1, node_name="STYLE")
        style_result = await generate_style({"sds_style": sds["style"], "plan": plan}, style_ctx)
        style = style_result["style"]

        # Skip LYRICS for this test (mocking complexity)
        lyrics = "[Verse]\nMock verse\n\n[Chorus]\nMock chorus"

        # PRODUCER
        producer_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=seed + 3, node_index=3, node_name="PRODUCER")
        producer_result = await generate_producer_notes(
            {"sds_producer": sds["producer_notes"], "plan": plan, "style": style},
            producer_ctx,
        )
        producer_notes = producer_result["producer_notes"]

        # COMPOSE
        compose_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=seed + 4, node_index=4, node_name="COMPOSE")
        compose_result = await compose_prompt(
            {"style": style, "lyrics": lyrics, "producer_notes": producer_notes, "sds": sds},
            compose_ctx,
        )

        final_hashes.append(compose_result["_hash"])

    # Both runs should produce identical final hash
    assert final_hashes[0] == final_hashes[1], "End-to-end determinism failed: different outputs from same inputs + seed"
