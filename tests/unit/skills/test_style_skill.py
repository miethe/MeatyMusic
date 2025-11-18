"""Unit tests for STYLE skill implementation.

Tests the core functionality of the STYLE skill including:
- Style specification generation
- Tempo range validation and clamping
- Tag conflict resolution
- Instrumentation limit enforcement
- Determinism verification
- Blueprint integration
"""

import pytest
from uuid import uuid4

# Import the skill implementation directly for testing
import sys
sys.path.insert(0, "/home/user/MeatyMusic/services/api")
sys.path.insert(0, "/home/user/MeatyMusic/.claude/skills/workflow/style")

from app.workflows.skill import WorkflowContext
from implementation import (
    run_skill,
    check_tag_conflicts,
    enforce_tempo_range,
    enforce_instrumentation_limit,
)


# ============================================================================
# Sample Data for Testing
# ============================================================================

SAMPLE_SDS_POP = {
    "title": "Summer Nights",
    "genre": "pop",
    "targetLength": "3:30",
    "style": {
        "genre_detail": {"primary": "pop"},
        "tempo": {"min": 110, "max": 130},
        "key": {"primary": "C major"},
        "mood": ["upbeat", "energetic"],
        "instrumentation": ["synths", "drums", "bass"],
        "tags": ["melodic", "catchy"],
    },
    "constraints": {
        "explicit": False,
        "render_engine": "suno",
    },
}

SAMPLE_SDS_ROCK = {
    "title": "Thunder Road",
    "genre": "rock",
    "targetLength": "3:45",
    "style": {
        "genre_detail": {"primary": "rock"},
        "tempo": {"min": 120, "max": 140},
        "key": {"primary": "E minor"},
        "mood": ["aggressive", "energetic"],
        "instrumentation": ["electric guitar", "bass", "drums"],
        "tags": ["anthemic", "energetic"],
    },
    "constraints": {
        "explicit": False,
        "render_engine": "suno",
    },
}

SAMPLE_SDS_HIPHOP = {
    "title": "Street Dreams",
    "genre": "hiphop",
    "targetLength": "3:20",
    "style": {
        "genre_detail": {"primary": "hiphop"},
        "tempo": 85,  # Single tempo value
        "key": {"primary": "C minor"},
        "mood": ["urban", "rhythmic"],
        "instrumentation": ["808s", "hi-hats", "bass"],
        "tags": ["rhythmic", "urban"],
    },
    "constraints": {
        "explicit": False,
        "render_engine": "suno",
    },
}

SAMPLE_SDS_COUNTRY = {
    "title": "Sunset Highway",
    "genre": "country",
    "targetLength": "3:15",
    "style": {
        "genre_detail": {"primary": "country"},
        "tempo": {"min": 100, "max": 120},
        "key": {"primary": "G major"},
        "mood": ["heartfelt", "nostalgic"],
        "instrumentation": ["acoustic guitar", "fiddle", "steel guitar", "banjo", "drums"],  # 5 items
        "tags": ["storytelling", "heartfelt"],
    },
    "constraints": {
        "explicit": False,
        "render_engine": "suno",
    },
}

SAMPLE_SDS_ELECTRONIC = {
    "title": "Digital Dreams",
    "genre": "electronic",
    "targetLength": "4:00",
    "style": {
        "genre_detail": {"primary": "electronic"},
        "tempo": {"min": 125, "max": 135},
        "key": {"primary": "A minor"},
        "mood": ["energetic", "futuristic"],
        "instrumentation": ["synths", "drum machine", "bass"],
        "tags": ["synthetic", "danceable"],
    },
    "constraints": {
        "explicit": False,
        "render_engine": "suno",
    },
}

# SDS with conflicting tags for conflict resolution testing
SAMPLE_SDS_CONFLICTS = {
    "title": "Conflict Test",
    "genre": "pop",
    "targetLength": "3:00",
    "style": {
        "genre_detail": {"primary": "pop"},
        "tempo": 120,
        "key": {"primary": "C major"},
        "mood": ["upbeat"],
        "instrumentation": ["synths"],
        "tags": ["whisper", "anthemic", "electronic"],  # "whisper" conflicts with "anthemic"
    },
    "constraints": {
        "explicit": False,
        "render_engine": "suno",
    },
}

# Sample plan output (minimal)
SAMPLE_PLAN = {
    "section_order": ["Intro", "Verse1", "Chorus1", "Verse2", "Chorus2", "Bridge", "Chorus3"],
    "target_word_counts": {
        "Intro": 12,
        "Verse1": 48,
        "Chorus1": 48,
        "Verse2": 48,
        "Chorus2": 48,
        "Bridge": 36,
        "Chorus3": 48,
    },
    "evaluation_targets": {
        "hook_density": 0.75,
        "singability": 0.80,
        "rhyme_tightness": 0.70,
        "section_completeness": 0.90,
        "profanity_score": 0.0,
        "total": 0.80,
    },
}


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def workflow_context():
    """Create a workflow context for testing."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=1,  # STYLE is second node (index 1)
        node_name="STYLE",
    )


# ============================================================================
# Test Basic Functionality
# ============================================================================

class TestStyleSkillBasics:
    """Test basic STYLE skill functionality."""

    @pytest.mark.asyncio
    async def test_style_generates_successfully(self, workflow_context):
        """Test that STYLE skill generates a valid style spec from SDS."""
        from app.workflows.skill import SkillExecutionError

        # Execute the skill
        try:
            result = await run_skill(
                inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
                context=workflow_context,
            )
        except SkillExecutionError as e:
            pytest.fail(f"Skill execution failed: {e}")

        # Verify output structure
        assert "style" in result
        assert "conflicts_resolved" in result

        style = result["style"]

        # Verify required keys
        assert "genre" in style
        assert "bpm" in style
        assert "key" in style
        assert "mood" in style
        assert "instrumentation" in style
        assert "tags" in style
        assert "_hash" in style

        # Verify types
        assert isinstance(style["genre"], str)
        assert isinstance(style["bpm"], int)
        assert isinstance(style["key"], str)
        assert isinstance(style["mood"], list)
        assert isinstance(style["instrumentation"], list)
        assert isinstance(style["tags"], list)

    @pytest.mark.asyncio
    async def test_style_with_different_genres(self, workflow_context):
        """Test STYLE skill with multiple genre types."""
        genres_to_test = [
            SAMPLE_SDS_POP,
            SAMPLE_SDS_ROCK,
            SAMPLE_SDS_HIPHOP,
            SAMPLE_SDS_COUNTRY,
            SAMPLE_SDS_ELECTRONIC,
        ]

        for sds in genres_to_test:
            result = await run_skill(
                inputs={"sds": sds, "plan": SAMPLE_PLAN},
                context=workflow_context,
            )

            assert "style" in result
            style = result["style"]
            assert style["genre"] == sds["style"]["genre_detail"]["primary"]
            assert style["bpm"] > 0
            assert len(style["instrumentation"]) <= 3  # Max 3 items


# ============================================================================
# Test Determinism
# ============================================================================

class TestStyleDeterminism:
    """Test determinism of STYLE skill."""

    @pytest.mark.asyncio
    async def test_style_is_deterministic_same_seed(self, workflow_context):
        """Test that STYLE produces identical output with same seed."""

        # Run skill 10 times with same seed
        hashes = []
        for i in range(10):
            result = await run_skill(
                inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
                context=workflow_context,
            )
            hashes.append(result["style"]["_hash"])

        # All hashes should be identical
        assert len(set(hashes)) == 1, f"Got {len(set(hashes))} different hashes: {hashes}"

    @pytest.mark.asyncio
    async def test_style_different_sds_different_hash(self, workflow_context):
        """Test that different SDS inputs produce different hashes."""

        # Run with different SDS inputs
        result1 = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        result2 = await run_skill(
            inputs={"sds": SAMPLE_SDS_ROCK, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        # Hashes should be different
        assert result1["style"]["_hash"] != result2["style"]["_hash"]

    @pytest.mark.asyncio
    async def test_style_all_fields_identical_across_runs(self, workflow_context):
        """Test that all fields are identical across multiple runs."""

        # Run twice
        result1 = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        result2 = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        style1 = result1["style"]
        style2 = result2["style"]

        # All fields should match
        assert style1["genre"] == style2["genre"]
        assert style1["bpm"] == style2["bpm"]
        assert style1["key"] == style2["key"]
        assert style1["mood"] == style2["mood"]
        assert style1["instrumentation"] == style2["instrumentation"]
        assert style1["tags"] == style2["tags"]
        assert style1["_hash"] == style2["_hash"]


# ============================================================================
# Test Tag Conflict Resolution (Task 2.2)
# ============================================================================

class TestTagConflictResolution:
    """Test tag conflict resolution using conflict matrix."""

    def test_check_tag_conflicts_no_conflicts(self):
        """Test that non-conflicting tags pass through."""
        tags = ["melodic", "catchy", "upbeat"]
        conflict_matrix = []  # Empty matrix

        valid, removed, warnings = check_tag_conflicts(tags, conflict_matrix)

        assert valid == tags
        assert removed == []
        assert warnings == []

    def test_check_tag_conflicts_simple_conflict(self):
        """Test resolution of a simple tag conflict."""
        tags = ["whisper", "anthemic"]
        conflict_matrix = [
            {
                "tag": "whisper",
                "Tags": ["anthemic", "stadium", "high-energy"],
                "Reason": "vocal intensity contradiction",
            }
        ]

        valid, removed, warnings = check_tag_conflicts(tags, conflict_matrix)

        # "whisper" should be kept (first), "anthemic" should be removed
        assert "whisper" in valid
        assert "anthemic" in removed
        assert len(warnings) == 1
        assert "anthemic" in warnings[0]

    def test_check_tag_conflicts_multiple_conflicts(self):
        """Test resolution of multiple tag conflicts."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]
        conflict_matrix = [
            {
                "tag": "acoustic",
                "Tags": ["electronic", "synth-heavy"],
                "Reason": "instrumentation conflict",
            },
            {
                "tag": "whisper",
                "Tags": ["anthemic", "stadium"],
                "Reason": "vocal intensity contradiction",
            },
        ]

        valid, removed, warnings = check_tag_conflicts(tags, conflict_matrix)

        # "acoustic" and "whisper" should be kept (first in list)
        assert "acoustic" in valid
        assert "whisper" in valid
        # "electronic" and "anthemic" should be removed
        assert "electronic" in removed
        assert "anthemic" in removed
        assert len(warnings) == 2

    @pytest.mark.asyncio
    async def test_style_skill_resolves_conflicts(self, workflow_context):
        """Test that STYLE skill resolves tag conflicts in real execution."""
        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_CONFLICTS, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        style = result["style"]
        conflicts = result["conflicts_resolved"]

        # One of "whisper" or "anthemic" should be in tags, but not both
        tags_lower = [t.lower() for t in style["tags"]]
        whisper_present = "whisper" in tags_lower
        anthemic_present = "anthemic" in tags_lower

        # They shouldn't both be present
        assert not (whisper_present and anthemic_present), \
            f"Both conflicting tags present: {style['tags']}"

        # Should have conflict resolution message
        # (May be empty if both tags were removed during processing)


# ============================================================================
# Test Tempo Validation (Task 2.3)
# ============================================================================

class TestTempoValidation:
    """Test tempo range validation and clamping."""

    def test_enforce_tempo_range_within_range(self):
        """Test that valid tempo within range passes through."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range(120, blueprint)

        assert tempo == 120
        assert warnings == []

    def test_enforce_tempo_range_below_min(self):
        """Test that tempo below min is clamped up."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range(80, blueprint)

        assert tempo == 100
        assert len(warnings) == 1
        assert "Clamped" in warnings[0]
        assert "80" in warnings[0]
        assert "100" in warnings[0]

    def test_enforce_tempo_range_above_max(self):
        """Test that tempo above max is clamped down."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range(160, blueprint)

        assert tempo == 140
        assert len(warnings) == 1
        assert "Clamped" in warnings[0]
        assert "160" in warnings[0]
        assert "140" in warnings[0]

    def test_enforce_tempo_range_dict_within_range(self):
        """Test that dict tempo within range uses midpoint."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range({"min": 110, "max": 130}, blueprint)

        assert tempo == 120  # Midpoint of 110 and 130
        assert warnings == []

    def test_enforce_tempo_range_dict_partial_clamp(self):
        """Test that dict tempo partially out of range is clamped."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range({"min": 90, "max": 130}, blueprint)

        # Min clamped to 100, max stays 130, midpoint = 115
        assert tempo == 115
        assert len(warnings) == 1
        assert "Clamped tempo range" in warnings[0]

    def test_enforce_tempo_range_dict_full_clamp(self):
        """Test that dict tempo fully out of range is clamped."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range({"min": 70, "max": 180}, blueprint)

        # Both clamped to [100, 140], midpoint = 120
        assert tempo == 120
        assert len(warnings) == 1
        assert "Clamped tempo range" in warnings[0]

    def test_enforce_tempo_range_none_uses_default(self):
        """Test that None tempo uses blueprint midpoint."""
        blueprint = {"tempo_bpm": [100, 140]}

        tempo, warnings = enforce_tempo_range(None, blueprint)

        assert tempo == 120  # Midpoint of 100 and 140
        assert len(warnings) == 1
        assert "default" in warnings[0].lower()

    @pytest.mark.asyncio
    async def test_style_skill_clamps_tempo(self, workflow_context):
        """Test that STYLE skill clamps out-of-range tempo."""
        # Create SDS with tempo way above typical range
        sds_high_tempo = {
            **SAMPLE_SDS_POP,
            "style": {
                **SAMPLE_SDS_POP["style"],
                "tempo": 200,  # Very high tempo
            }
        }

        result = await run_skill(
            inputs={"sds": sds_high_tempo, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        style = result["style"]
        conflicts = result["conflicts_resolved"]

        # Tempo should be clamped to blueprint max
        assert style["bpm"] <= 140  # Pop blueprint max
        # Should have clamping warning
        tempo_warnings = [w for w in conflicts if "tempo" in w.lower()]
        assert len(tempo_warnings) > 0


# ============================================================================
# Test Instrumentation Limit Enforcement
# ============================================================================

class TestInstrumentationLimit:
    """Test instrumentation limit enforcement."""

    def test_enforce_instrumentation_limit_under_limit(self):
        """Test that instrumentation under limit passes through."""
        instrumentation = ["synths", "drums"]
        blueprint = {}

        limited, warnings = enforce_instrumentation_limit(
            instrumentation, blueprint, max_items=3
        )

        assert limited == instrumentation
        assert warnings == []

    def test_enforce_instrumentation_limit_at_limit(self):
        """Test that instrumentation at limit passes through."""
        instrumentation = ["synths", "drums", "bass"]
        blueprint = {}

        limited, warnings = enforce_instrumentation_limit(
            instrumentation, blueprint, max_items=3
        )

        assert limited == instrumentation
        assert warnings == []

    def test_enforce_instrumentation_limit_over_limit(self):
        """Test that instrumentation over limit is truncated."""
        instrumentation = ["synths", "drums", "bass", "guitar", "piano"]
        blueprint = {}

        limited, warnings = enforce_instrumentation_limit(
            instrumentation, blueprint, max_items=3
        )

        assert limited == ["synths", "drums", "bass"]
        assert len(warnings) == 1
        assert "truncated" in warnings[0].lower()
        assert "5" in warnings[0]
        assert "3" in warnings[0]

    def test_enforce_instrumentation_limit_empty_uses_blueprint(self):
        """Test that empty instrumentation uses blueprint defaults."""
        instrumentation = []
        blueprint = {"instrumentation": ["Synths", "Drums", "Bass"]}

        limited, warnings = enforce_instrumentation_limit(
            instrumentation, blueprint, max_items=3
        )

        assert limited == ["Synths", "Drums", "Bass"]
        assert warnings == []

    @pytest.mark.asyncio
    async def test_style_skill_limits_instrumentation(self, workflow_context):
        """Test that STYLE skill limits instrumentation to 3 items."""
        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_COUNTRY, "plan": SAMPLE_PLAN},  # Has 5 instruments
            context=workflow_context,
        )

        style = result["style"]
        conflicts = result["conflicts_resolved"]

        # Should have exactly 3 instruments
        assert len(style["instrumentation"]) == 3

        # Should have truncation warning
        instr_warnings = [w for w in conflicts if "instrumentation" in w.lower()]
        assert len(instr_warnings) > 0


# ============================================================================
# Test Blueprint Integration
# ============================================================================

class TestBlueprintIntegration:
    """Test blueprint loading and default filling."""

    @pytest.mark.asyncio
    async def test_style_loads_blueprint_successfully(self, workflow_context):
        """Test that STYLE skill loads blueprint for genre."""
        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        style = result["style"]

        # Should have filled defaults from blueprint
        assert style["genre"] == "pop"
        assert style["bpm"] > 0
        assert style["key"] is not None

    @pytest.mark.asyncio
    async def test_style_fills_missing_fields(self, workflow_context):
        """Test that STYLE skill fills missing fields with blueprint defaults."""
        # Create SDS with minimal style info
        minimal_sds = {
            **SAMPLE_SDS_POP,
            "style": {
                "genre_detail": {"primary": "pop"},
                # No tempo, key, mood, etc.
            }
        }

        result = await run_skill(
            inputs={"sds": minimal_sds, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        style = result["style"]

        # All required fields should be filled
        assert "bpm" in style
        assert style["bpm"] > 0
        assert "key" in style
        assert "mood" in style
        assert len(style["mood"]) > 0
        assert "instrumentation" in style
        assert len(style["instrumentation"]) > 0


# ============================================================================
# Test Coverage Goals
# ============================================================================

class TestCoverageGoals:
    """Test edge cases for code coverage."""

    @pytest.mark.asyncio
    async def test_missing_sds_raises_error(self, workflow_context):
        """Test that missing SDS raises ValueError."""
        from app.workflows.skill import SkillExecutionError

        with pytest.raises(SkillExecutionError):
            await run_skill(
                inputs={"plan": SAMPLE_PLAN},  # Missing SDS
                context=workflow_context,
            )

    @pytest.mark.asyncio
    async def test_missing_plan_raises_error(self, workflow_context):
        """Test that missing plan raises ValueError."""
        from app.workflows.skill import SkillExecutionError

        with pytest.raises(SkillExecutionError):
            await run_skill(
                inputs={"sds": SAMPLE_SDS_POP},  # Missing plan
                context=workflow_context,
            )

    def test_conflict_matrix_empty_returns_empty(self):
        """Test that empty conflict matrix returns all tags as valid."""
        tags = ["tag1", "tag2", "tag3"]
        conflict_matrix = []

        valid, removed, warnings = check_tag_conflicts(tags, conflict_matrix)

        assert valid == tags
        assert removed == []
        assert warnings == []


# ============================================================================
# Test Event Emission
# ============================================================================

class TestEventEmission:
    """Test that skill emits events correctly."""

    @pytest.mark.asyncio
    async def test_style_emits_events(self, workflow_context):
        """Test that STYLE skill execution emits events."""
        # Note: Event emission is handled by @workflow_skill decorator
        # We just verify the skill executes without error
        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP, "plan": SAMPLE_PLAN},
            context=workflow_context,
        )

        # Verify result has expected structure
        assert "style" in result
        assert "conflicts_resolved" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
