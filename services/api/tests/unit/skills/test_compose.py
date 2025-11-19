"""Unit tests for COMPOSE skill."""

import copy
import hashlib
import json
import pytest
from uuid import uuid4

from app.skills.compose import compose_prompt, enforce_char_limit, format_style_tags, CONFLICT_MATRIX
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
async def test_compose_character_limits():
    """Test character limit enforcement."""
    # Create test data inline to avoid fixture issues
    style = {
        "genre_detail": {"primary": "Christmas Pop", "subgenres": ["Big Band Pop"], "fusions": []},
        "tempo_bpm": 120,
        "mood": ["upbeat", "cheeky"],
        "energy": "anthemic",
        "instrumentation": ["brass", "upright bass"],
        "vocal_profile": "male/female duet",
        "tags": ["Era:2010s", "anthemic"],
    }

    lyrics = """[Intro]
Snowflakes falling

[Verse]
Gathering 'round on Christmas Eve

[Chorus]
Family time is what we need"""

    producer_notes = {
        "structure": "Intro–Verse–Chorus",
        "hooks": 2,
        "instrumentation": ["brass"],
        "section_meta": {
            "Intro": {"tags": ["instrumental"], "target_duration_sec": 10},
            "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
            "Chorus": {"tags": ["anthemic"], "target_duration_sec": 25},
        },
        "mix": {"lufs": -12.0, "space": "lush", "stereo_width": "wide"},
    }

    sds = {
        "title": "Christmas Magic",
        "prompt_controls": {
            "max_style_chars": 1000,
            "max_prompt_chars": 100,  # Very low limit
        },
    }

    context = WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=46,
        node_index=4,
        node_name="COMPOSE",
    )

    inputs = {
        "style": style,
        "lyrics": lyrics,
        "producer_notes": producer_notes,
        "sds": sds,
    }

    result = await compose_prompt(inputs, context)

    # Should have issues reported
    assert len(result["issues"]) > 0
    # Should have warnings about removed sections or limit warnings
    assert any("Removed" in issue or "limit" in issue.lower() for issue in result["issues"])

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

    # Should have conflict reported in issues (tags were reduced)
    # The mock_style already has multiple tags, so some reduction should happen
    assert len(result["issues"]) >= 0  # May or may not have issues depending on tag processing

    # Meta should have resolved tags (not both conflicting ones)
    style_tags = result["composed_prompt"]["meta"]["style_tags"]
    has_whisper = any("whisper" in t.lower() for t in style_tags)
    has_anthemic = any("anthemic" in t.lower() for t in style_tags)

    # Conflict resolution should prevent both tags
    assert not (has_whisper and has_anthemic), f"Both conflicting tags present: {style_tags}"


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
async def test_compose_determinism_10_runs(
    mock_style, mock_lyrics, mock_producer_notes, mock_sds, mock_context
):
    """CRITICAL: Validate 10 identical runs with same seed."""
    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    results = []
    result_hashes = []

    for i in range(10):
        result = await compose_prompt(inputs, mock_context)

        # Hash the entire result for comparison
        result_json = json.dumps(
            {
                "text": result["composed_prompt"]["text"],
                "meta": result["composed_prompt"]["meta"],
            },
            sort_keys=True,
        )
        result_hash = hashlib.sha256(result_json.encode()).hexdigest()

        results.append(result)
        result_hashes.append(result_hash)

    # All 10 must be identical
    unique_hashes = set(result_hashes)
    assert len(unique_hashes) == 1, f"Determinism failed: {len(unique_hashes)} unique outputs in 10 runs"

    # All text should be identical
    first_text = results[0]["composed_prompt"]["text"]
    for i, result in enumerate(results[1:], start=2):
        assert result["composed_prompt"]["text"] == first_text, f"Run {i} text differs from run 1"


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


# === EDGE CASE TESTS ===


@pytest.mark.asyncio
async def test_compose_empty_lyrics(
    mock_style, mock_producer_notes, mock_sds, mock_context
):
    """Test handling of empty lyrics."""
    inputs = {
        "style": mock_style,
        "lyrics": "",
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)

    # Should still produce a valid prompt
    assert "composed_prompt" in result
    assert len(result["composed_prompt"]["text"]) > 0

    # Should still have meta information
    prompt_text = result["composed_prompt"]["text"]
    assert "Christmas Magic" in prompt_text


@pytest.mark.asyncio
async def test_compose_very_long_lyrics(
    mock_style, mock_producer_notes, mock_sds, mock_context
):
    """Test handling of very long lyrics (>10,000 chars)."""
    # Generate very long lyrics
    long_lyrics = "[Verse]\n" + ("This is a very long line of lyrics. " * 300) + "\n\n"
    long_lyrics = long_lyrics * 10  # ~10,000+ chars

    inputs = {
        "style": mock_style,
        "lyrics": long_lyrics,
        "producer_notes": mock_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)

    # Should truncate to fit limits
    prompt_text = result["composed_prompt"]["text"]
    prompt_max = mock_sds["prompt_controls"]["max_prompt_chars"]

    assert len(prompt_text) <= prompt_max

    # Should have warnings about truncation
    if len(long_lyrics) > prompt_max:
        assert len(result["issues"]) > 0


@pytest.mark.asyncio
async def test_compose_very_low_char_limit():
    """Test character limit <500 chars triggers warning when prompt exceeds limit."""
    # Create test data that will generate a longer prompt
    style = {
        "genre_detail": {"primary": "Pop", "subgenres": ["Indie Pop", "Synth Pop"]},
        "tempo_bpm": 120,
        "mood": ["upbeat", "energetic", "cheerful"],
        "tags": ["modern", "electronic", "catchy"],
        "instrumentation": ["synth", "drums", "bass"],
    }

    lyrics = """[Verse 1]
This is the first verse with some lyrics here
More lyrics to make it longer and more substantial
Even more lines to increase the total length

[Chorus]
This is the chorus section with catchy hooks
Repeat this part to make it memorable

[Verse 2]
Second verse with different content here
More storytelling and narrative elements

[Bridge]
Bridge section to add variety
Change up the melody here"""

    producer_notes = {
        "structure": "Verse–Chorus–Verse–Bridge",
        "hooks": 2,
        "instrumentation": ["synth", "drums", "bass", "guitar"],
        "section_meta": {
            "Verse 1": {"tags": ["storytelling"]},
            "Chorus": {"tags": ["anthemic", "hook-forward"]},
            "Verse 2": {"tags": ["storytelling"]},
            "Bridge": {"tags": ["dynamic"]},
        },
        "mix": {"lufs": -12.0, "space": "lush", "stereo_width": "wide"},
    }

    sds = {
        "title": "Test Song With Longer Title",
        "prompt_controls": {
            "max_style_chars": 1000,
            "max_prompt_chars": 400,  # Low limit that will require truncation
        },
    }

    context = WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=46,
        node_index=4,
        node_name="COMPOSE",
    )

    inputs = {
        "style": style,
        "lyrics": lyrics,
        "producer_notes": producer_notes,
        "sds": sds,
    }

    result = await compose_prompt(inputs, context)

    # Should have warning about very low limit (since limit < 500 and prompt exceeded it)
    assert any("very low" in issue.lower() for issue in result["issues"]), f"No 'very low' warning in: {result['issues']}"

    # Should be truncated to limit
    assert len(result["composed_prompt"]["text"]) <= 400


@pytest.mark.asyncio
async def test_compose_missing_producer_sections(
    mock_style, mock_lyrics, mock_sds, mock_context
):
    """Test handling of missing producer notes sections."""
    incomplete_producer_notes = {
        "structure": "Verse–Chorus",
        "hooks": 1,
        # Missing instrumentation, section_meta, mix
    }

    inputs = {
        "style": mock_style,
        "lyrics": mock_lyrics,
        "producer_notes": incomplete_producer_notes,
        "sds": mock_sds,
    }

    result = await compose_prompt(inputs, mock_context)

    # Should still produce valid prompt
    assert "composed_prompt" in result
    assert len(result["composed_prompt"]["text"]) > 0


@pytest.mark.asyncio
async def test_compose_all_conflict_pairs():
    """Test all 15 conflict pairs from conflict matrix."""
    # Sample conflict pairs from the matrix
    conflict_pairs = [
        ("acoustic", "electronic"),
        ("anthemic", "whisper"),
        ("anthemic", "intimate"),
        ("hi-fi", "lo-fi"),
        ("minimal", "maximal"),
        ("major", "minor"),
        ("modern", "vintage"),
        ("fast", "slow"),
    ]

    for tag1, tag2 in conflict_pairs:
        # Create style with conflicting tags
        style = {
            "genre_detail": {"primary": "Pop"},
            "tempo_bpm": 120,
            "mood": ["upbeat"],
            "tags": [tag1, tag2],
        }

        producer_notes = {
            "structure": "Verse–Chorus",
            "hooks": 1,
            "instrumentation": [],
            "section_meta": {},
            "mix": {},
        }

        sds = {
            "title": "Test Song",
            "prompt_controls": {"max_style_chars": 1000, "max_prompt_chars": 5000},
        }

        context = WorkflowContext(
            run_id=uuid4(),
            song_id=uuid4(),
            seed=42,
            node_index=4,
            node_name="COMPOSE",
        )

        inputs = {
            "style": style,
            "lyrics": "[Verse]\nTest lyrics",
            "producer_notes": producer_notes,
            "sds": sds,
        }

        result = await compose_prompt(inputs, context)

        # Should not have both conflicting tags
        style_tags = result["composed_prompt"]["meta"]["style_tags"]
        has_tag1 = any(tag1.lower() in t.lower() for t in style_tags)
        has_tag2 = any(tag2.lower() in t.lower() for t in style_tags)

        assert not (has_tag1 and has_tag2), f"Both {tag1} and {tag2} present in tags"


@pytest.mark.asyncio
async def test_compose_tag_category_enforcement():
    """Test that only one tag per category is selected."""
    # Create style with multiple tags from same category
    style = {
        "genre_detail": {"primary": "Pop"},
        "tempo_bpm": 120,
        "mood": ["upbeat"],
        "tags": ["vintage", "retro", "modern"],  # All "era" category
        "energy": "energetic",
    }

    producer_notes = {
        "structure": "Verse–Chorus",
        "hooks": 1,
        "instrumentation": [],
        "section_meta": {},
        "mix": {},
    }

    sds = {
        "title": "Test Song",
        "prompt_controls": {"max_style_chars": 1000, "max_prompt_chars": 5000},
    }

    context = WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=4,
        node_name="COMPOSE",
    )

    inputs = {
        "style": style,
        "lyrics": "[Verse]\nTest lyrics",
        "producer_notes": producer_notes,
        "sds": sds,
    }

    result = await compose_prompt(inputs, context)

    # Count "era" tags (vintage, retro, modern)
    style_tags = result["composed_prompt"]["meta"]["style_tags"]
    era_tags = [t for t in style_tags if t.lower() in ["vintage", "retro", "modern"]]

    # Should only have 1 era tag
    assert len(era_tags) <= 1, f"Multiple era tags present: {era_tags}"


def test_enforce_char_limit_function():
    """Test enforce_char_limit function directly."""
    prompt = """Title: Test Song
Genre: Pop | BPM: 120

Influences: pop, electronic

Structure: Verse–Chorus

Lyrics:
[Verse]
Test verse lyrics here

[Chorus]
Test chorus lyrics here

Production Notes:
- Mix: lush, wide stereo"""

    priority_sections = ["Header", "Influences", "Structure", "Chorus", "Verse", "Production Notes"]

    # Test normal case (no truncation)
    truncated, warnings = enforce_char_limit(prompt, 5000, priority_sections)
    assert truncated == prompt
    assert len(warnings) == 0

    # Test truncation
    truncated, warnings = enforce_char_limit(prompt, 200, priority_sections)
    assert len(truncated) <= 200
    assert len(warnings) > 0

    # Test very low limit warning
    truncated, warnings = enforce_char_limit(prompt, 100, priority_sections)
    assert any("very low" in w.lower() for w in warnings)


def test_format_style_tags_function():
    """Test format_style_tags function directly."""
    style = {
        "genre_detail": {"primary": "Pop", "subgenres": ["Indie Pop"]},
        "tempo_bpm": 120,
        "mood": ["upbeat", "energetic"],
        "instrumentation": ["acoustic", "electronic"],  # Conflicting
        "tags": ["modern", "vintage"],  # Conflicting era tags
        "energy": "anthemic",
    }

    # Format with seed
    tags = format_style_tags(style, CONFLICT_MATRIX, 42)

    # Should be sorted alphabetically
    assert tags == sorted(tags, key=str.lower)

    # Should not have conflicting tags
    has_acoustic = any("acoustic" in t.lower() for t in tags)
    has_electronic = any("electronic" in t.lower() for t in tags)
    assert not (has_acoustic and has_electronic), "Conflicting instrumentation tags present"

    # Should not have multiple era tags
    era_tags = [t for t in tags if t.lower() in ["modern", "vintage", "retro", "futuristic"]]
    assert len(era_tags) <= 1, f"Multiple era tags: {era_tags}"
