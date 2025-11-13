"""Unit tests for PLAN skill."""

import pytest
from uuid import uuid4

from app.skills.plan import generate_plan
from app.workflows.skill import WorkflowContext


@pytest.fixture
def mock_sds():
    """Mock SDS for testing."""
    return {
        "title": "Test Christmas Song",
        "blueprint_ref": {
            "genre": "Christmas Pop",
            "version": "2025.11",
        },
        "style": {
            "genre_detail": {"primary": "Christmas Pop"},
            "tempo_bpm": 120,
            "key": {"primary": "C major"},
            "mood": ["upbeat", "cheeky"],
            "tags": [],
        },
        "lyrics": {
            "language": "en",
            "section_order": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
            "hook_strategy": "chant",
            "rhyme_scheme": "AABB",
            "syllables_per_line": 8,
            "constraints": {
                "max_lines": 80,
                "explicit": False,
                "section_requirements": {
                    "Chorus": {"min_lines": 6, "max_lines": 10, "must_end_with_hook": True}
                },
            },
        },
        "producer_notes": {
            "structure": "",
            "hooks": 2,
            "section_meta": {},
        },
        "constraints": {
            "duration_sec": 180,
        },
    }


@pytest.fixture
def mock_context():
    """Mock workflow context."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=0,
        node_name="PLAN",
    )


@pytest.mark.asyncio
async def test_plan_basic_generation(mock_sds, mock_context):
    """Test basic plan generation."""
    inputs = {"sds": mock_sds}

    result = await generate_plan(inputs, mock_context)

    assert "plan" in result
    plan = result["plan"]

    assert plan["section_order"] == mock_sds["lyrics"]["section_order"]
    assert "_hash" in plan
    assert len(plan["_hash"]) == 64  # SHA-256 hex


@pytest.mark.asyncio
async def test_plan_validates_chorus_presence(mock_sds, mock_context):
    """Test that plan validation requires at least one chorus."""
    # Remove all chorus sections
    mock_sds["lyrics"]["section_order"] = ["Intro", "Verse", "Bridge", "Outro"]

    inputs = {"sds": mock_sds}

    with pytest.raises(ValueError, match="at least one 'Chorus'"):
        await generate_plan(inputs, mock_context)


@pytest.mark.asyncio
async def test_plan_calculates_word_counts(mock_sds, mock_context):
    """Test word count calculation."""
    inputs = {"sds": mock_sds}

    result = await generate_plan(inputs, mock_context)
    plan = result["plan"]

    assert "target_word_counts" in plan
    word_counts = plan["target_word_counts"]

    # Should have counts for all sections
    for section in mock_sds["lyrics"]["section_order"]:
        assert section in word_counts
        assert word_counts[section] > 0

    # Total should not exceed max_lines * 6 words/line
    max_words = mock_sds["lyrics"]["constraints"]["max_lines"] * 6
    total_words = sum(word_counts.values())
    assert total_words <= max_words


@pytest.mark.asyncio
async def test_plan_evaluation_targets(mock_sds, mock_context):
    """Test evaluation targets are set."""
    inputs = {"sds": mock_sds}

    result = await generate_plan(inputs, mock_context)
    plan = result["plan"]

    assert "evaluation_targets" in plan
    targets = plan["evaluation_targets"]

    # Check expected metrics
    assert "hook_density" in targets
    assert "singability" in targets
    assert "rhyme_tightness" in targets
    assert "section_completeness" in targets
    assert "profanity_score" in targets
    assert "total" in targets

    # Profanity score should be 0 for non-explicit
    assert targets["profanity_score"] == 0.0


@pytest.mark.asyncio
async def test_plan_work_objectives(mock_sds, mock_context):
    """Test work objectives are created."""
    inputs = {"sds": mock_sds}

    result = await generate_plan(inputs, mock_context)
    plan = result["plan"]

    assert "work_objectives" in plan
    objectives = plan["work_objectives"]

    # Should have objectives for downstream nodes
    nodes = [obj["node"] for obj in objectives]
    assert "STYLE" in nodes
    assert "LYRICS" in nodes
    assert "PRODUCER" in nodes
    assert "COMPOSE" in nodes

    # COMPOSE should depend on all previous nodes
    compose_obj = next(obj for obj in objectives if obj["node"] == "COMPOSE")
    assert "STYLE" in compose_obj["dependencies"]
    assert "LYRICS" in compose_obj["dependencies"]
    assert "PRODUCER" in compose_obj["dependencies"]


@pytest.mark.asyncio
async def test_plan_determinism(mock_sds, mock_context):
    """Test that same inputs produce same plan."""
    inputs = {"sds": mock_sds}

    # Run twice
    result1 = await generate_plan(inputs, mock_context)
    result2 = await generate_plan(inputs, mock_context)

    # Hashes should be identical
    assert result1["plan"]["_hash"] == result2["plan"]["_hash"]

    # Plans should be identical
    assert result1["plan"]["section_order"] == result2["plan"]["section_order"]
    assert result1["plan"]["target_word_counts"] == result2["plan"]["target_word_counts"]
