"""Unit tests for STYLE skill."""

import pytest
from uuid import uuid4

from app.skills.style import generate_style
from app.workflows.skill import WorkflowContext


@pytest.fixture
def mock_sds_style():
    """Mock SDS style entity."""
    return {
        "genre_detail": {
            "primary": "Christmas Pop",
            "subgenres": ["Big Band Pop"],
            "fusions": ["Electro Swing"],
        },
        "tempo_bpm": 120,
        "time_signature": "4/4",
        "key": {"primary": "C major", "modulations": ["E major"]},
        "mood": ["upbeat", "cheeky", "warm"],
        "energy": "anthemic",
        "instrumentation": ["brass", "upright bass", "sleigh bells"],
        "vocal_profile": "male/female duet",
        "tags": ["Era:2010s", "Rhythm:four-on-the-floor", "Mix:modern-bright"],
        "negative_tags": ["muddy low-end"],
    }


@pytest.fixture
def mock_plan():
    """Mock plan."""
    return {
        "section_order": ["Intro", "Verse", "Chorus"],
        "target_word_counts": {},
        "evaluation_targets": {},
        "work_objectives": [],
    }


@pytest.fixture
def mock_context():
    """Mock workflow context."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=43,
        node_index=1,
        node_name="STYLE",
    )


@pytest.mark.asyncio
async def test_style_basic_generation(mock_sds_style, mock_plan, mock_context):
    """Test basic style generation."""
    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}

    result = await generate_style(inputs, mock_context)

    assert "style" in result
    style = result["style"]

    assert style["genre_detail"]["primary"] == "Christmas Pop"
    assert "_hash" in style
    assert len(style["_hash"]) == 64


@pytest.mark.asyncio
async def test_style_tempo_validation(mock_sds_style, mock_plan, mock_context):
    """Test tempo validation against blueprint ranges."""
    # Test tempo below range
    mock_sds_style["tempo_bpm"] = 50  # Below Pop range (100-140)

    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}
    result = await generate_style(inputs, mock_context)

    # Should be clamped to minimum
    assert result["style"]["tempo_bpm"] == 100


@pytest.mark.asyncio
async def test_style_tempo_range_clamping(mock_sds_style, mock_plan, mock_context):
    """Test tempo range clamping."""
    # Test range extending outside blueprint
    mock_sds_style["tempo_bpm"] = [80, 160]  # Outside Pop range (100-140)

    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}
    result = await generate_style(inputs, mock_context)

    # Should be clamped to [100, 140]
    assert result["style"]["tempo_bpm"] == [100, 140]


@pytest.mark.asyncio
async def test_style_instrumentation_limit(mock_sds_style, mock_plan, mock_context):
    """Test instrumentation limited to 3."""
    mock_sds_style["instrumentation"] = ["brass", "bass", "sleigh bells", "guitar", "drums"]

    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}
    result = await generate_style(inputs, mock_context)

    style = result["style"]

    # Should be limited to 3
    assert len(style["instrumentation"]) == 3

    # Should have dropped items logged
    assert len(style["_dropped_instruments"]) == 2


@pytest.mark.asyncio
async def test_style_tag_conflict_resolution(mock_sds_style, mock_plan, mock_context):
    """Test tag conflict resolution."""
    # Add conflicting tags
    mock_sds_style["tags"] = ["whisper", "anthemic"]  # These conflict

    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}
    result = await generate_style(inputs, mock_context)

    style = result["style"]

    # One should be dropped
    final_tags = style["tags"]
    has_whisper = any("whisper" in t.lower() for t in final_tags)
    has_anthemic = any("anthemic" in t.lower() for t in final_tags)

    assert not (has_whisper and has_anthemic), "Conflicting tags should not both be present"


@pytest.mark.asyncio
async def test_style_energy_tempo_validation(mock_sds_style, mock_plan, mock_context):
    """Test energy-tempo alignment validation."""
    # Anthemic energy with low tempo should log warning
    mock_sds_style["energy"] = "anthemic"
    mock_sds_style["tempo_bpm"] = 60  # Too low for anthemic

    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}

    # Should not raise error, but will log warning
    result = await generate_style(inputs, mock_context)

    # Tempo should be clamped to minimum (100 for Pop)
    assert result["style"]["tempo_bpm"] >= 100


@pytest.mark.asyncio
async def test_style_determinism(mock_sds_style, mock_plan, mock_context):
    """Test that same inputs produce same style."""
    inputs = {"sds_style": mock_sds_style, "plan": mock_plan}

    # Run twice
    result1 = await generate_style(inputs, mock_context)
    result2 = await generate_style(inputs, mock_context)

    # Hashes should be identical
    assert result1["style"]["_hash"] == result2["style"]["_hash"]

    # Tempo should be identical
    assert result1["style"]["tempo_bpm"] == result2["style"]["tempo_bpm"]
