"""Unit tests for VALIDATE skill."""

import pytest
from uuid import uuid4

from app.skills.validate import evaluate_artifacts
from app.workflows.skill import WorkflowContext


@pytest.fixture
def mock_context():
    """Create mock workflow context."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=5,
        node_name="VALIDATE",
        event_publisher=None,
        db_session=None,
    )


@pytest.fixture
def sample_blueprint():
    """Create sample blueprint with rubric."""
    return {
        "genre": "Pop",
        "rules": {
            "required_sections": ["Verse", "Chorus", "Bridge"],
            "banned_terms": ["damn", "hell"],
        },
        "eval_rubric": {
            "weights": {
                "hook_density": 0.25,
                "singability": 0.25,
                "rhyme_tightness": 0.20,
                "section_completeness": 0.20,
                "profanity_score": 0.10,
            },
            "thresholds": {
                "min_total": 0.85,
            },
        },
    }


@pytest.fixture
def sample_style():
    """Create sample style specification."""
    return {
        "genre_detail": {"primary": "Pop"},
        "tempo_bpm": 120,
        "mood": ["upbeat", "energetic"],
        "vocal_profile": "male lead",
    }


@pytest.fixture
def sample_producer_notes():
    """Create sample producer notes."""
    return {
        "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus",
        "hooks": 2,
        "instrumentation": ["piano", "drums"],
        "section_meta": {
            "Intro": {"tags": ["instrumental"]},
            "Chorus": {"tags": ["anthemic", "hook-forward"]},
        },
        "mix": {"space": "lush", "stereo_width": "wide"},
    }


@pytest.fixture
def good_lyrics():
    """Create good lyrics with high hook density and proper structure."""
    return """[Intro]
(instrumental intro)

[Verse]
Walking through the snowy night
Christmas time is shining bright
Family time is what we need
Love and joy in every deed

[Chorus]
Family time is what we need
Love and joy in every deed
Christmas magic all around
Peace and happiness abound

[Verse]
Gathering by the firelight
Family time is what we need
Stars above are shining bright
Love and joy in every deed

[Bridge]
Together we can share the light
Making memories through the night
Family bonds that hold us tight
Christmas magic burning bright

[Chorus]
Family time is what we need
Love and joy in every deed
Christmas magic all around
Peace and happiness abound"""


@pytest.fixture
def poor_lyrics():
    """Create poor lyrics with low hook density and missing sections."""
    return """[Verse]
Walking through the snowy night
Children play until the light
Decorating Christmas trees
Singing carols in the breeze

[Chorus]
Christmas time has come again
Bringing joy to all the men
Happiness is everywhere
Love and peace are in the air"""


@pytest.mark.asyncio
async def test_validate_good_lyrics_passes(
    mock_context, good_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that good lyrics pass validation."""
    inputs = {
        "lyrics": good_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    assert result["pass"] is True
    assert result["scores"]["total"] >= 0.85
    assert len(result["issues"]) == 0
    assert "_hash" in result


@pytest.mark.asyncio
async def test_validate_poor_lyrics_fails(
    mock_context, poor_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that poor lyrics fail validation."""
    inputs = {
        "lyrics": poor_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    assert result["pass"] is False
    assert result["scores"]["total"] < 0.85
    assert len(result["issues"]) > 0
    # Should have low hook density and missing Bridge
    assert any("hook density" in issue.lower() for issue in result["issues"])
    assert any("missing required sections" in issue.lower() for issue in result["issues"])


@pytest.mark.asyncio
async def test_hook_density_score(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test hook density scoring."""
    # Lyrics with high hook repetition
    high_hook_lyrics = """[Chorus]
Family time is what we need
Love and joy in every deed

[Verse]
Family time is what we need
Walking through the snow
Love and joy in every deed
Watching children grow

[Bridge]
Family time is what we need
Together we stand strong"""

    inputs = {
        "lyrics": high_hook_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    # Should have high hook density (>= 0.7)
    assert result["scores"]["hook_density"] >= 0.7


@pytest.mark.asyncio
async def test_section_completeness_detection(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test section completeness detection."""
    # Lyrics missing Bridge
    incomplete_lyrics = """[Verse]
Walking through the snow

[Chorus]
Christmas time is here"""

    inputs = {
        "lyrics": incomplete_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    # Should detect missing Bridge
    assert result["scores"]["section_completeness"] < 1.0
    assert any("bridge" in issue.lower() for issue in result["issues"])


@pytest.mark.asyncio
async def test_profanity_detection(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test profanity detection when explicit=false."""
    # Lyrics with banned term
    profane_lyrics = """[Verse]
What the hell is going on

[Chorus]
Christmas time has come

[Bridge]
Together we stand strong"""

    inputs = {
        "lyrics": profane_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    # Should detect profanity and fail
    assert result["scores"]["profanity_score"] == 0.0
    assert any("profanity" in issue.lower() for issue in result["issues"])
    assert result["pass"] is False


@pytest.mark.asyncio
async def test_profanity_allowed_when_explicit(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that profanity is allowed when explicit=true."""
    # Lyrics with banned term
    profane_lyrics = """[Verse]
What the hell is going on

[Chorus]
Christmas time has come

[Bridge]
Together we stand strong"""

    inputs = {
        "lyrics": profane_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": True}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    # Should allow profanity but score lower (0.9 instead of 1.0)
    assert result["scores"]["profanity_score"] == 0.9


@pytest.mark.asyncio
async def test_singability_score(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test singability scoring based on syllable consistency."""
    # Lyrics with consistent syllable counts
    consistent_lyrics = """[Verse]
Walking through the snowy night (8 syllables)
Christmas time is shining bright (8 syllables)
Family time is what we need (8 syllables)
Love and joy in every deed (8 syllables)

[Chorus]
Christmas magic all around (7 syllables)
Peace and happiness abound (7 syllables)

[Bridge]
Together we can share the light (8 syllables)
Making memories through the night (8 syllables)"""

    inputs = {
        "lyrics": consistent_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    # Should have high singability score (>= 0.8)
    assert result["scores"]["singability"] >= 0.8


@pytest.mark.asyncio
async def test_determinism(
    mock_context, good_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that validation is deterministic (same inputs produce same outputs)."""
    inputs = {
        "lyrics": good_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    # Run validation twice
    result1 = await evaluate_artifacts(inputs, mock_context)
    result2 = await evaluate_artifacts(inputs, mock_context)

    # Scores should be identical
    assert result1["scores"] == result2["scores"]
    assert result1["pass"] == result2["pass"]
    assert result1["issues"] == result2["issues"]
    assert result1["_hash"] == result2["_hash"]


@pytest.mark.asyncio
async def test_weighted_total_calculation(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that weighted total is calculated correctly."""
    # Create lyrics with known scores
    lyrics = """[Verse]
Test line one
Test line two

[Chorus]
Hook line here
Hook line here

[Bridge]
Bridge line one
Bridge line two"""

    inputs = {
        "lyrics": lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "sds": {"constraints": {"explicit": False}},
    }

    result = await evaluate_artifacts(inputs, mock_context)

    # Verify weighted total calculation
    weights = sample_blueprint["eval_rubric"]["weights"]
    scores = result["scores"]

    expected_total = (
        scores["hook_density"] * weights["hook_density"]
        + scores["singability"] * weights["singability"]
        + scores["rhyme_tightness"] * weights["rhyme_tightness"]
        + scores["section_completeness"] * weights["section_completeness"]
        + scores["profanity_score"] * weights["profanity_score"]
    )

    # Allow small floating point error
    assert abs(scores["total"] - expected_total) < 0.001
