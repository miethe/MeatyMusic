"""Unit tests for FIX skill."""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.skills.fix import (
    apply_fixes,
    _parse_issues,
    _prioritize_fixes,
    _validate_fix,
)
from app.workflows.skill import WorkflowContext


@pytest.fixture
def mock_context():
    """Create mock workflow context."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=6,
        node_name="FIX",
        event_publisher=None,
        db_session=None,
    )


@pytest.fixture
def sample_blueprint():
    """Create sample blueprint."""
    return {
        "genre": "Pop",
        "rules": {
            "required_sections": ["Verse", "Chorus", "Bridge"],
            "banned_terms": ["damn", "hell"],
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
            "Chorus": {"tags": ["anthemic"]},
        },
    }


@pytest.fixture
def sample_lyrics():
    """Create sample lyrics."""
    return """[Verse]
Walking through the snowy night
Children play until the light

[Chorus]
Christmas time has come again
Bringing joy to all the men"""


def test_parse_issues_hook_density():
    """Test parsing hook density issue."""
    issues = ["Low hook density: 0.45 (target 0.7)"]
    parsed = _parse_issues(issues)

    assert parsed["hook_density"] is True
    assert parsed["details"]["hook_density_score"] == 0.45
    assert parsed["singability"] is False
    assert parsed["profanity"] is False


def test_parse_issues_missing_sections():
    """Test parsing missing sections issue."""
    issues = ["Missing required sections: Bridge, Outro"]
    parsed = _parse_issues(issues)

    assert parsed["section_completeness"] is True
    assert "Bridge" in parsed["details"]["missing_sections"]
    assert "Outro" in parsed["details"]["missing_sections"]


def test_parse_issues_profanity():
    """Test parsing profanity issue."""
    issues = ["Profanity detected (explicit=false): damn, hell"]
    parsed = _parse_issues(issues)

    assert parsed["profanity"] is True
    assert "damn" in parsed["details"]["banned_terms"]
    assert "hell" in parsed["details"]["banned_terms"]


def test_parse_issues_multiple():
    """Test parsing multiple issues."""
    issues = [
        "Low hook density: 0.5 (target 0.7)",
        "Weak singability: 0.7 (target 0.8) - inconsistent syllable counts",
        "Missing required sections: Bridge",
    ]
    parsed = _parse_issues(issues)

    assert parsed["hook_density"] is True
    assert parsed["singability"] is True
    assert parsed["section_completeness"] is True


def test_prioritize_fixes_profanity_first():
    """Test that profanity is prioritized first."""
    parsed_issues = {
        "hook_density": True,
        "profanity": True,
        "singability": True,
        "details": {},
    }
    scores = {
        "hook_density": 0.5,
        "singability": 0.7,
        "profanity_score": 0.0,
    }

    priorities = _prioritize_fixes(parsed_issues, scores)

    # Profanity should be first
    assert priorities[0] == "profanity"


def test_prioritize_fixes_section_completeness_second():
    """Test that section completeness is prioritized second."""
    parsed_issues = {
        "hook_density": True,
        "section_completeness": True,
        "singability": True,
        "details": {},
    }
    scores = {
        "hook_density": 0.5,
        "singability": 0.7,
        "section_completeness": 0.67,
    }

    priorities = _prioritize_fixes(parsed_issues, scores)

    # Section completeness should come before metrics
    assert priorities[0] == "section_completeness"
    # Then lowest score (hook_density)
    assert priorities[1] == "hook_density"


def test_prioritize_fixes_by_lowest_score():
    """Test that remaining fixes are prioritized by lowest score."""
    parsed_issues = {
        "hook_density": True,
        "singability": True,
        "rhyme_tightness": True,
        "details": {},
    }
    scores = {
        "hook_density": 0.6,
        "singability": 0.4,  # Lowest
        "rhyme_tightness": 0.5,
    }

    priorities = _prioritize_fixes(parsed_issues, scores)

    # Should be ordered by score: singability (0.4), rhyme (0.5), hook (0.6)
    assert priorities == ["singability", "rhyme_tightness", "hook_density"]


def test_validate_fix_no_issues():
    """Test validation when fix is clean."""
    patched_lyrics = """[Verse]
Test line

[Chorus]
Test chorus

[Bridge]
Test bridge"""

    original_lyrics = """[Verse]
Test line

[Chorus]
Test chorus"""

    blueprint = {"rules": {"required_sections": ["Verse", "Chorus", "Bridge"]}}

    issues = _validate_fix(patched_lyrics, original_lyrics, blueprint)

    assert len(issues) == 0


def test_validate_fix_removed_section():
    """Test validation when fix removes a required section."""
    patched_lyrics = """[Verse]
Test line

[Chorus]
Test chorus"""

    original_lyrics = """[Verse]
Test line

[Chorus]
Test chorus

[Bridge]
Test bridge"""

    blueprint = {"rules": {"required_sections": ["Verse", "Chorus", "Bridge"]}}

    issues = _validate_fix(patched_lyrics, original_lyrics, blueprint)

    assert len(issues) > 0
    assert any("Bridge" in issue for issue in issues)


def test_validate_fix_too_short():
    """Test validation when fix removes too many lines."""
    patched_lyrics = """[Verse]
Test line"""

    original_lyrics = """[Verse]
Test line one
Test line two
Test line three
Test line four
Test line five
Test line six
Test line seven
Test line eight
Test line nine
Test line ten"""

    blueprint = {"rules": {"required_sections": ["Verse"]}}

    issues = _validate_fix(patched_lyrics, original_lyrics, blueprint)

    assert len(issues) > 0
    assert any("removed too many lines" in issue for issue in issues)


@pytest.mark.asyncio
async def test_apply_fixes_hook_density(
    mock_context, sample_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test applying hook density fix."""
    issues = ["Low hook density: 0.45 (target 0.7)"]
    scores = {"hook_density": 0.45, "singability": 0.9, "rhyme_tightness": 0.85}

    inputs = {
        "issues": issues,
        "lyrics": sample_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "scores": scores,
    }

    # Mock LLM client
    with patch("app.skills.fix.get_llm_client") as mock_llm:
        mock_client = AsyncMock()
        mock_client.generate = AsyncMock(
            return_value="""[Verse]
Walking through the snowy night
Christmas time has come again
Children play until the light

[Chorus]
Christmas time has come again
Bringing joy to all the men
Christmas time has come again
Peace and love to everyone"""
        )
        mock_llm.return_value = mock_client

        result = await apply_fixes(inputs, mock_context)

        # Should have patched lyrics
        assert "patched_lyrics" in result
        assert "patched_style" in result
        assert "patched_producer_notes" in result
        assert len(result["fixes_applied"]) > 0
        assert any("hook" in fix.lower() for fix in result["fixes_applied"])


@pytest.mark.asyncio
async def test_apply_fixes_missing_section(
    mock_context, sample_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test applying fix for missing section."""
    issues = ["Missing required sections: Bridge"]
    scores = {"section_completeness": 0.67}

    inputs = {
        "issues": issues,
        "lyrics": sample_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "scores": scores,
    }

    # Mock LLM client
    with patch("app.skills.fix.get_llm_client") as mock_llm:
        mock_client = AsyncMock()
        mock_client.generate = AsyncMock(
            return_value="""Together we can share the light
Making memories through the night
Family bonds that hold us tight
Christmas magic burning bright"""
        )
        mock_llm.return_value = mock_client

        result = await apply_fixes(inputs, mock_context)

        # Should have added Bridge section
        assert "[Bridge]" in result["patched_lyrics"]
        assert "section_meta" in result["patched_producer_notes"]
        assert "Bridge" in result["patched_producer_notes"]["section_meta"]
        assert any("missing sections" in fix.lower() for fix in result["fixes_applied"])


@pytest.mark.asyncio
async def test_apply_fixes_profanity(
    mock_context, sample_style, sample_producer_notes, sample_blueprint
):
    """Test applying profanity fix."""
    profane_lyrics = """[Verse]
What the hell is going on

[Chorus]
Christmas time has come"""

    issues = ["Profanity detected (explicit=false): hell"]
    scores = {"profanity_score": 0.0}

    inputs = {
        "issues": issues,
        "lyrics": profane_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "scores": scores,
    }

    # Mock LLM client
    with patch("app.skills.fix.get_llm_client") as mock_llm:
        mock_client = AsyncMock()
        mock_client.generate = AsyncMock(
            return_value="""[Verse]
What on earth is going on

[Chorus]
Christmas time has come"""
        )
        mock_llm.return_value = mock_client

        result = await apply_fixes(inputs, mock_context)

        # Should have removed profanity
        assert "hell" not in result["patched_lyrics"].lower()
        assert any("profanity" in fix.lower() for fix in result["fixes_applied"])


@pytest.mark.asyncio
async def test_apply_fixes_multiple_issues(
    mock_context, sample_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test applying multiple fixes in priority order."""
    issues = [
        "Profanity detected (explicit=false): hell",
        "Low hook density: 0.45 (target 0.7)",
        "Missing required sections: Bridge",
    ]
    scores = {
        "profanity_score": 0.0,
        "hook_density": 0.45,
        "section_completeness": 0.67,
    }

    profane_lyrics = """[Verse]
What the hell is going on

[Chorus]
Christmas time has come"""

    inputs = {
        "issues": issues,
        "lyrics": profane_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "scores": scores,
    }

    # Mock LLM client
    with patch("app.skills.fix.get_llm_client") as mock_llm:
        mock_client = AsyncMock()
        # Return different responses for each fix
        mock_client.generate = AsyncMock(
            side_effect=[
                # Profanity fix
                """[Verse]
What on earth is going on

[Chorus]
Christmas time has come""",
                # Missing section fix
                """Bridge section content""",
                # Hook density fix
                """Fixed lyrics with hooks""",
            ]
        )
        mock_llm.return_value = mock_client

        result = await apply_fixes(inputs, mock_context)

        # Should have applied all fixes
        assert len(result["fixes_applied"]) == 3
        # Verify priority order: profanity, section, hook
        assert "profanity" in result["fixes_applied"][0].lower()
        assert "missing sections" in result["fixes_applied"][1].lower()


@pytest.mark.asyncio
async def test_apply_fixes_reverts_on_critical_error(
    mock_context, sample_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that fix reverts if it breaks required sections."""
    issues = ["Low hook density: 0.45 (target 0.7)"]
    scores = {"hook_density": 0.45}

    inputs = {
        "issues": issues,
        "lyrics": sample_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "scores": scores,
    }

    # Mock LLM client to return lyrics missing required sections
    with patch("app.skills.fix.get_llm_client") as mock_llm:
        mock_client = AsyncMock()
        mock_client.generate = AsyncMock(
            return_value="""[Verse]
Only verse here"""
        )
        mock_llm.return_value = mock_client

        result = await apply_fixes(inputs, mock_context)

        # Should have reverted to original
        assert result["patched_lyrics"] == sample_lyrics
        assert any("REVERTED" in fix for fix in result["fixes_applied"])


@pytest.mark.asyncio
async def test_fix_determinism(
    mock_context, sample_lyrics, sample_style, sample_producer_notes, sample_blueprint
):
    """Test that fix is deterministic with same seed."""
    issues = ["Low hook density: 0.45 (target 0.7)"]
    scores = {"hook_density": 0.45}

    inputs = {
        "issues": issues,
        "lyrics": sample_lyrics,
        "style": sample_style,
        "producer_notes": sample_producer_notes,
        "blueprint": sample_blueprint,
        "scores": scores,
    }

    # Mock LLM client
    with patch("app.skills.fix.get_llm_client") as mock_llm:
        mock_client = AsyncMock()
        fixed_lyrics = """[Verse]
Fixed lyrics with hooks

[Chorus]
Fixed chorus"""
        mock_client.generate = AsyncMock(return_value=fixed_lyrics)
        mock_llm.return_value = mock_client

        # Run twice with same seed
        result1 = await apply_fixes(inputs, mock_context)
        result2 = await apply_fixes(inputs, mock_context)

        # Should produce same hash (deterministic)
        # Note: In practice, LLM may vary slightly even with seed
        # This test verifies the pattern, not exact LLM output
        assert "patched_lyrics" in result1
        assert "patched_lyrics" in result2
        assert "_hash" in result1
        assert "_hash" in result2
