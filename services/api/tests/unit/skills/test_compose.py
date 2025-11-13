"""Unit tests for COMPOSE skill."""

import pytest
from uuid import uuid4

from app.skills.compose import compose_prompt
from app.workflows.skill import WorkflowContext


@pytest.fixture
def mock_style():
    """Mock style entity."""
    return {
        "genre_detail": {
            "primary": "Christmas Pop",
            "subgenres": ["Big Band Pop"],
            "fusions": [],
        },
        "tempo_bpm": 120,
        "time_signature": "4/4",
        "key": {"primary": "C major"},
        "mood": ["upbeat", "cheeky"],
        "energy": "anthemic",
        "instrumentation": ["brass", "upright bass"],
        "vocal_profile": "male/female duet",
        "tags": ["Era:2010s", "anthemic"],
        "negative_tags": ["muddy low-end"],
    }


@pytest.fixture
def mock_lyrics():
    """Mock lyrics."""
    return """[Intro]
Snowflakes falling, lights aglow

[Verse]
Gathering 'round on Christmas Eve
The kids decorate, we all believe

[Chorus]
Family time is what we need
Love and joy in every deed
Singing carols, feeling free
Christmas magic, you and me"""


@pytest.fixture
def mock_producer_notes():
    """Mock producer notes."""
    return {
        "structure": "Intro–Verse–Chorus",
        "hooks": 2,
        "instrumentation": ["brass", "upright bass", "sleigh bells"],
        "section_meta": {
            "Intro": {"tags": ["instrumental", "low energy"], "target_duration_sec": 10},
            "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
            "Chorus": {"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25},
        },
        "mix": {
            "lufs": -12.0,
            "space": "lush",
            "stereo_width": "wide",
        },
    }


@pytest.fixture
def mock_sds():
    """Mock SDS."""
    return {
        "title": "Christmas Magic",
        "prompt_controls": {
            "max_style_chars": 1000,
            "max_prompt_chars": 5000,
        },
    }


@pytest.fixture
def mock_context():
    """Mock workflow context."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=46,
        node_index=4,
        node_name="COMPOSE",
    )


@pytest.mark.asyncio
async def test_compose_basic_generation(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test basic prompt composition."""
    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)

    assert "composed_prompt" in result
    composed = result["composed_prompt"]

    assert "text" in composed
    assert "meta" in composed
    assert len(composed["text"]) > 0


@pytest.mark.asyncio
async def test_compose_includes_all_sections(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test that composed prompt includes all required sections."""
    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)
    prompt_text = result["composed_prompt"]["text"]

    # Should include title
    assert "Christmas Magic" in prompt_text

    # Should include genre
    assert "Christmas Pop" in prompt_text

    # Should include tempo
    assert "120" in prompt_text

    # Should include structure
    assert "Intro–Verse–Chorus" in prompt_text

    # Should include lyrics sections
    assert "[Intro" in prompt_text
    assert "[Verse" in prompt_text
    assert "[Chorus" in prompt_text

    # Should include production notes
    assert "Production Notes:" in prompt_text
    assert "Mix:" in prompt_text


@pytest.mark.asyncio
async def test_compose_section_tags(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test that section tags are properly formatted."""
    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)
    prompt_text = result["composed_prompt"]["text"]

    # Intro should have tags
    assert "[Intro: instrumental, low energy]" in prompt_text

    # Chorus should have tags
    assert "anthemic" in prompt_text and "hook-forward" in prompt_text


@pytest.mark.asyncio
async def test_compose_character_limits(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test character limit enforcement."""
    # Set very low limit
    mock_sds["prompt_controls"]["prompt_max"] = 100

    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)

    # Should have issues reported
    assert len(result["issues"]) > 0
    assert any("exceeded" in issue for issue in result["issues"])

    # Prompt should be truncated
    prompt_text = result["composed_prompt"]["text"]
    assert len(prompt_text) <= 100


@pytest.mark.asyncio
async def test_compose_tag_conflict_resolution(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test tag conflict resolution."""
    # Add conflicting tags
    mock_style["tags"] = ["whisper", "anthemic"]

    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)

    # Should have conflict reported in issues
    assert len(result["issues"]) > 0

    # Meta should have resolved tags (not both conflicting ones)
    style_tags = result["composed_prompt"]["meta"]["style_tags"]
    has_whisper = any("whisper" in t.lower() for t in style_tags)
    has_anthemic = any("anthemic" in t.lower() for t in style_tags)

    assert not (has_whisper and has_anthemic)


@pytest.mark.asyncio
async def test_compose_artist_normalization(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test living artist name normalization."""
    # Add artist reference
    mock_style["tags"] = ["style of Drake"]

    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)
    prompt_text = result["composed_prompt"]["text"]

    # Should not contain artist name
    assert "Drake" not in prompt_text

    # Should contain generic replacement
    assert "contemporary" in prompt_text or "hip-hop" in prompt_text

    # Should have replacement logged in issues
    assert any("Normalized" in issue for issue in result["issues"])


@pytest.mark.asyncio
async def test_compose_determinism(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test that same inputs produce same composed prompt."""
    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    # Run twice
    result1 = await compose_prompt(inputs, mock_context)
    result2 = await compose_prompt(inputs, mock_context)

    # Hashes should be identical
    assert result1["_hash"] == result2["_hash"]

    # Prompt text should be identical
    assert result1["composed_prompt"]["text"] == result2["composed_prompt"]["text"]


@pytest.mark.asyncio
async def test_compose_metadata(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """Test that metadata is properly populated."""
    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)
    meta = result["composed_prompt"]["meta"]

    assert meta["title"] == "Christmas Magic"
    assert meta["genre"] == "Christmas Pop"
    assert meta["tempo_bpm"] == 120
    assert meta["structure"] == "Intro–Verse–Chorus"
    assert len(meta["style_tags"]) > 0
    assert "section_tags" in meta
    assert "model_limits" in meta
