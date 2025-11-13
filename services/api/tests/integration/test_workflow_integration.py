"""Integration tests for complete PLAN → STYLE → LYRICS → PRODUCER → COMPOSE workflow.

Tests the full execution path of core workflow skills working together.
"""

import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, patch

from app.skills import (
    generate_plan,
    generate_style,
    generate_lyrics,
    generate_producer_notes,
    compose_prompt,
)
from app.workflows.skill import WorkflowContext


@pytest.fixture
def integration_sds():
    """Complete SDS for integration testing."""
    return {
        "title": "Integration Test Christmas Song",
        "blueprint_ref": {
            "genre": "Christmas Pop",
            "version": "2025.11",
        },
        "style": {
            "genre_detail": {
                "primary": "Christmas Pop",
                "subgenres": ["Big Band Pop"],
                "fusions": ["Electro Swing"],
            },
            "tempo_bpm": 120,
            "time_signature": "4/4",
            "key": {"primary": "C major", "modulations": []},
            "mood": ["upbeat", "cheeky", "warm"],
            "energy": "anthemic",
            "instrumentation": ["brass", "upright bass", "sleigh bells"],
            "vocal_profile": "male/female duet, crooner + bright pop",
            "tags": ["Era:2010s", "Rhythm:four-on-the-floor", "Mix:modern-bright"],
            "negative_tags": ["muddy low-end"],
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["holiday hustle", "family time", "Christmas joy"],
            "rhyme_scheme": "AABB",
            "meter": "4/4 pop",
            "syllables_per_line": 8,
            "hook_strategy": "chant",
            "repetition_policy": "hook-heavy",
            "section_order": [
                "Intro",
                "Verse",
                "PreChorus",
                "Chorus",
                "Verse",
                "PreChorus",
                "Chorus",
                "Bridge",
                "Chorus",
            ],
            "constraints": {
                "explicit": False,
                "max_lines": 80,
                "section_requirements": {
                    "Chorus": {"min_lines": 6, "max_lines": 10, "must_end_with_hook": True}
                },
            },
            "source_citations": [],
        },
        "producer_notes": {
            "structure": "",
            "hooks": 2,
            "instrumentation": ["sleigh bells"],
            "section_meta": {
                "Chorus": {"tags": ["crowd-chant"]},
            },
            "mix": {
                "lufs": -12.0,
                "space": "lush",
                "stereo_width": "wide",
            },
        },
        "prompt_controls": {
            "max_style_chars": 1000,
            "max_prompt_chars": 5000,
        },
        "render": {
            "engine": "none",
        },
    }


@pytest.mark.asyncio
async def test_full_workflow_integration(integration_sds):
    """Test complete workflow execution from PLAN through COMPOSE."""
    run_id = uuid4()
    song_id = uuid4()
    global_seed = 42

    # Step 1: PLAN
    plan_context = WorkflowContext(
        run_id=run_id,
        song_id=song_id,
        seed=global_seed,
        node_index=0,
        node_name="PLAN",
    )

    plan_inputs = {"sds": integration_sds}
    plan_result = await generate_plan(plan_inputs, plan_context)

    assert "plan" in plan_result
    plan = plan_result["plan"]
    assert len(plan["section_order"]) == 9
    assert "_hash" in plan

    # Step 2: STYLE (parallel-capable, but running sequentially for test)
    style_context = WorkflowContext(
        run_id=run_id,
        song_id=song_id,
        seed=global_seed + 1,
        node_index=1,
        node_name="STYLE",
    )

    style_inputs = {
        "sds_style": integration_sds["style"],
        "plan": plan,
    }
    style_result = await generate_style(style_inputs, style_context)

    assert "style" in style_result
    style = style_result["style"]
    assert style["genre_detail"]["primary"] == "Christmas Pop"
    assert style["tempo_bpm"] >= 100  # Should be clamped to blueprint range
    assert "_hash" in style

    # Step 3: LYRICS (parallel-capable with PRODUCER)
    lyrics_context = WorkflowContext(
        run_id=run_id,
        song_id=song_id,
        seed=global_seed + 2,
        node_index=2,
        node_name="LYRICS",
    )

    # Mock LLM for predictable testing
    mock_verse = """Rushing through the holiday lights
Working overtime with all my might
Santa's got a crazy deadline tonight
Elves are stressed but doing alright"""

    mock_chorus = """Christmas time is what we need
Family love is guaranteed
Joy and cheer in every deed
Christmas magic plants the seed"""

    with patch("app.skills.lyrics.get_llm_client") as mock_get_client:
        mock_client = AsyncMock()

        # Return different lyrics for each section call
        mock_client.generate = AsyncMock(
            side_effect=[
                "Instrumental intro with sleigh bells",  # Intro
                mock_verse,  # Verse 1
                "Building up the energy now\nGetting ready for the crowd",  # PreChorus 1
                mock_chorus,  # Chorus 1
                mock_verse,  # Verse 2 (will be same due to mock)
                "Building up the energy now\nGetting ready for the crowd",  # PreChorus 2
                mock_chorus,  # Chorus 2
                "Slow it down, take a breath\nChristmas joy conquers stress",  # Bridge
                mock_chorus,  # Chorus 3
            ]
        )
        mock_get_client.return_value = mock_client

        lyrics_inputs = {
            "sds_lyrics": integration_sds["lyrics"],
            "plan": plan,
            "style": style,
            "sources": [],
        }
        lyrics_result = await generate_lyrics(lyrics_inputs, lyrics_context)

    assert "lyrics" in lyrics_result
    lyrics = lyrics_result["lyrics"]
    assert len(lyrics) > 0
    assert "[Intro]" in lyrics
    assert "[Verse]" in lyrics
    assert "[Chorus]" in lyrics
    assert "metrics" in lyrics_result

    # Step 4: PRODUCER (parallel-capable with LYRICS)
    producer_context = WorkflowContext(
        run_id=run_id,
        song_id=song_id,
        seed=global_seed + 3,
        node_index=3,
        node_name="PRODUCER",
    )

    producer_inputs = {
        "sds_producer": integration_sds["producer_notes"],
        "plan": plan,
        "style": style,
    }
    producer_result = await generate_producer_notes(producer_inputs, producer_context)

    assert "producer_notes" in producer_result
    producer_notes = producer_result["producer_notes"]
    assert "structure" in producer_notes
    assert "Intro" in producer_notes["structure"]
    assert producer_notes["hooks"] >= 2
    assert "section_meta" in producer_notes
    assert "_hash" in producer_notes

    # Step 5: COMPOSE (depends on STYLE, LYRICS, PRODUCER)
    compose_context = WorkflowContext(
        run_id=run_id,
        song_id=song_id,
        seed=global_seed + 4,
        node_index=4,
        node_name="COMPOSE",
    )

    compose_inputs = {
        "style": style,
        "lyrics": lyrics,
        "producer_notes": producer_notes,
        "sds": integration_sds,
    }
    compose_result = await compose_prompt(compose_inputs, compose_context)

    assert "composed_prompt" in compose_result
    composed = compose_result["composed_prompt"]

    # Validate final composed prompt
    assert "text" in composed
    assert len(composed["text"]) > 0
    assert "meta" in composed

    # Check that final prompt includes all key elements
    prompt_text = composed["text"]
    assert "Integration Test Christmas Song" in prompt_text
    assert "Christmas Pop" in prompt_text
    assert "120" in prompt_text  # Tempo
    assert "[Intro" in prompt_text
    assert "[Verse" in prompt_text
    assert "[Chorus" in prompt_text
    assert "Production Notes:" in prompt_text

    # Check metadata
    meta = composed["meta"]
    assert meta["title"] == integration_sds["title"]
    assert meta["genre"] == "Christmas Pop"
    assert meta["tempo_bpm"] == style["tempo_bpm"]
    assert len(meta["style_tags"]) > 0
    assert "section_tags" in meta


@pytest.mark.asyncio
async def test_workflow_constraint_enforcement(integration_sds):
    """Test that constraints are enforced throughout the workflow."""
    run_id = uuid4()
    song_id = uuid4()
    global_seed = 100

    # Run through workflow
    plan_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=global_seed, node_index=0, node_name="PLAN")
    plan_result = await generate_plan({"sds": integration_sds}, plan_ctx)
    plan = plan_result["plan"]

    style_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=global_seed + 1, node_index=1, node_name="STYLE")
    style_result = await generate_style({"sds_style": integration_sds["style"], "plan": plan}, style_ctx)
    style = style_result["style"]

    # Check tempo constraint enforcement
    assert style["tempo_bpm"] >= 100  # Christmas Pop minimum
    assert style["tempo_bpm"] <= 140  # Christmas Pop maximum

    # Check instrumentation limit (max 3)
    assert len(style["instrumentation"]) <= 3

    # Check profanity policy
    assert plan["evaluation_targets"]["profanity_score"] == 0.0  # Non-explicit


@pytest.mark.asyncio
async def test_workflow_data_flow(integration_sds):
    """Test that data flows correctly between workflow nodes."""
    run_id = uuid4()
    song_id = uuid4()
    global_seed = 200

    # PLAN
    plan_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=global_seed, node_index=0, node_name="PLAN")
    plan_result = await generate_plan({"sds": integration_sds}, plan_ctx)
    plan = plan_result["plan"]

    # STYLE uses plan
    style_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=global_seed + 1, node_index=1, node_name="STYLE")
    style_result = await generate_style({"sds_style": integration_sds["style"], "plan": plan}, style_ctx)
    style = style_result["style"]

    # PRODUCER uses plan and style
    producer_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=global_seed + 3, node_index=3, node_name="PRODUCER")
    producer_result = await generate_producer_notes(
        {"sds_producer": integration_sds["producer_notes"], "plan": plan, "style": style},
        producer_ctx,
    )
    producer_notes = producer_result["producer_notes"]

    # Verify data dependencies
    # Producer structure should match plan section order
    plan_sections = set(plan["section_order"])
    structure_sections = set(producer_notes["structure"].split("–"))
    assert plan_sections == structure_sections

    # Producer instrumentation should include style instrumentation
    style_instruments = set(style["instrumentation"])
    producer_instruments = set(producer_notes["instrumentation"])
    assert style_instruments.issubset(producer_instruments)


@pytest.mark.asyncio
async def test_workflow_error_handling():
    """Test workflow handles invalid inputs gracefully."""
    run_id = uuid4()
    song_id = uuid4()

    # Test PLAN with missing chorus
    invalid_sds = {
        "title": "Invalid Song",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {"genre_detail": {"primary": "Pop"}},
        "lyrics": {
            "section_order": ["Verse", "Bridge"],  # No chorus!
            "constraints": {"max_lines": 40, "explicit": False},
        },
        "producer_notes": {"structure": "", "hooks": 1},
    }

    plan_ctx = WorkflowContext(run_id=run_id, song_id=song_id, seed=1, node_index=0, node_name="PLAN")

    with pytest.raises(ValueError, match="at least one 'Chorus'"):
        await generate_plan({"sds": invalid_sds}, plan_ctx)
