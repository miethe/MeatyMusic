"""Unit tests for PLAN skill implementation.

Tests the core functionality of the PLAN skill including:
- Section extraction and validation
- Word count calculation
- Evaluation target definition
- Work objective creation
- Determinism verification
"""

import pytest
from uuid import uuid4

# Import the skill implementation directly for testing
import sys
sys.path.insert(0, "/home/user/MeatyMusic/services/api")
sys.path.insert(0, "/home/user/MeatyMusic/.claude/skills/workflow/plan")

from app.workflows.skill import WorkflowContext
from implementation import run_skill


# Sample SDS for testing
SAMPLE_SDS_POP = {
    "title": "Summer Nights",
    "genre": "pop",
    "targetLength": "3:30",
    "style": {
        "genre_detail": {"primary": "pop"},
        "tempo": {"min": 100, "max": 130},
        "key": {"primary": "C major"},
        "mood": ["upbeat", "energetic"],
    },
    "lyrics": {
        "section_order": [
            "Intro",
            "Verse1",
            "PreChorus1",
            "Chorus1",
            "Verse2",
            "Chorus2",
            "Bridge",
            "Chorus3",
        ],
        "hook_strategy": "melodic",
        "rhyme_scheme": "ABAB",
        "meter": "standard",
        "constraints": {
            "max_lines": 120,
            "section_requirements": {
                "Verse": {"min_lines": 6, "max_lines": 10},
                "Chorus": {"min_lines": 6, "max_lines": 10},
                "Bridge": {"min_lines": 4, "max_lines": 8},
                "PreChorus": {"min_lines": 4, "max_lines": 6},
                "Intro": {"min_lines": 2, "max_lines": 4},
            },
        },
    },
    "producer_notes": {
        "hooks": 2,
        "structure": "verse-chorus",
    },
    "constraints": {
        "max_lines": 120,
        "duration_sec": 210,
        "explicit": False,
        "render_engine": "suno",
    },
}

SAMPLE_SDS_CHRISTMAS = {
    "title": "Winter Wonderland",
    "genre": "christmas",
    "targetLength": "3:00",
    "style": {
        "genre_detail": {"primary": "Christmas Pop"},
        "tempo": {"min": 110, "max": 140},
        "key": {"primary": "F major"},
        "mood": ["festive", "joyful"],
    },
    "lyrics": {
        "section_order": [
            "Intro",
            "Verse1",
            "PreChorus1",
            "Chorus1",
            "Verse2",
            "Chorus2",
            "Bridge",
            "Chorus3",
        ],
        "hook_strategy": "chant",  # Requires ≥2 chorus sections
        "rhyme_scheme": "AABB",
        "meter": "bouncy",
        "constraints": {
            "max_lines": 100,
            "section_requirements": {
                "Verse": {"min_lines": 6, "max_lines": 8},
                "Chorus": {"min_lines": 6, "max_lines": 10},
            },
        },
    },
    "producer_notes": {
        "hooks": 3,
        "structure": "verse-chorus-verse-chorus-bridge-chorus",
    },
    "constraints": {
        "max_lines": 100,
        "duration_sec": 180,
        "explicit": False,
        "render_engine": "suno",
    },
}


@pytest.fixture
def workflow_context():
    """Create a workflow context for testing."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=0,  # PLAN is first node
        node_name="PLAN",
    )


class TestPlanSkillBasics:
    """Test basic PLAN skill functionality."""

    @pytest.mark.asyncio
    async def test_plan_generates_successfully(self, workflow_context):
        """Test that PLAN skill generates a valid plan from SDS."""
        from app.workflows.skill import SkillExecutionError

        # Execute the skill
        try:
            result = await run_skill(
                inputs={"sds": SAMPLE_SDS_POP},
                context=workflow_context,
            )
        except SkillExecutionError as e:
            pytest.fail(f"Skill execution failed: {e}")

        # Verify output structure
        assert "plan" in result
        plan = result["plan"]

        # Verify required keys
        assert "section_order" in plan
        assert "target_word_counts" in plan
        assert "evaluation_targets" in plan
        assert "work_objectives" in plan
        assert "_hash" in plan

        # Verify section order matches input
        assert plan["section_order"] == SAMPLE_SDS_POP["lyrics"]["section_order"]

        # Verify word counts exist for all sections
        for section in plan["section_order"]:
            assert section in plan["target_word_counts"]
            assert plan["target_word_counts"][section] > 0

    @pytest.mark.asyncio
    async def test_plan_validates_chorus_requirement(self, workflow_context):
        """Test that PLAN validates at least one Chorus exists."""
        from app.workflows.skill import SkillExecutionError

        # Create fresh SDS without Chorus sections
        invalid_sds = {
            "title": "Test Song",
            "genre": "pop",
            "targetLength": "3:00",
            "style": {
                "genre_detail": {"primary": "pop"},
                "tempo": {"min": 100, "max": 130},
                "key": {"primary": "C major"},
                "mood": ["upbeat"],
            },
            "lyrics": {
                "section_order": ["Intro", "Verse1", "Verse2", "Bridge"],  # No Chorus!
                "hook_strategy": "melodic",
                "rhyme_scheme": "ABAB",
                "meter": "standard",
                "constraints": {
                    "max_lines": 100,
                    "section_requirements": {
                        "Verse": {"min_lines": 6, "max_lines": 10},
                        "Intro": {"min_lines": 2, "max_lines": 4},
                        "Bridge": {"min_lines": 4, "max_lines": 8},
                    },
                },
            },
            "producer_notes": {"hooks": 1, "structure": "verse-bridge"},
            "constraints": {
                "max_lines": 100,
                "duration_sec": 180,
                "explicit": False,
                "render_engine": "suno",
            },
        }

        # Should raise SkillExecutionError wrapping ValueError about missing Chorus
        with pytest.raises(SkillExecutionError, match="[Aa]t least one Chorus"):
            await run_skill(
                inputs={"sds": invalid_sds},
                context=workflow_context,
            )

    @pytest.mark.asyncio
    async def test_plan_validates_chant_hook_requirement(self, workflow_context):
        """Test that PLAN validates ≥2 Chorus for chant hook strategy."""
        from app.workflows.skill import SkillExecutionError

        # Create fresh SDS with chant hook but only 1 Chorus
        invalid_sds = {
            "title": "Test Chant Song",
            "genre": "pop",
            "targetLength": "3:00",
            "style": {
                "genre_detail": {"primary": "pop"},
                "tempo": {"min": 100, "max": 130},
                "key": {"primary": "C major"},
                "mood": ["upbeat"],
            },
            "lyrics": {
                "section_order": ["Verse1", "Chorus1", "Verse2", "Bridge"],  # Only 1 Chorus!
                "hook_strategy": "chant",  # Requires ≥2 Chorus
                "rhyme_scheme": "ABAB",
                "meter": "standard",
                "constraints": {
                    "max_lines": 100,
                    "section_requirements": {
                        "Verse": {"min_lines": 6, "max_lines": 10},
                        "Chorus": {"min_lines": 6, "max_lines": 10},
                        "Bridge": {"min_lines": 4, "max_lines": 8},
                    },
                },
            },
            "producer_notes": {"hooks": 1, "structure": "verse-chorus-verse-bridge"},
            "constraints": {
                "max_lines": 100,
                "duration_sec": 180,
                "explicit": False,
                "render_engine": "suno",
            },
        }

        # Should raise SkillExecutionError wrapping ValueError about needing 2+ Chorus sections
        with pytest.raises(SkillExecutionError, match="requires at least 2 Chorus"):
            await run_skill(
                inputs={"sds": invalid_sds},
                context=workflow_context,
            )


class TestPlanDeterminism:
    """Test determinism of PLAN skill."""

    @pytest.mark.asyncio
    async def test_plan_is_deterministic_same_seed(self, workflow_context):
        """Test that PLAN produces identical output with same seed."""

        # Run skill twice with same seed
        result1 = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        result2 = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        # Hashes should be identical
        assert result1["plan"]["_hash"] == result2["plan"]["_hash"]

        # All fields should match
        assert result1["plan"]["section_order"] == result2["plan"]["section_order"]
        assert result1["plan"]["target_word_counts"] == result2["plan"]["target_word_counts"]
        assert result1["plan"]["evaluation_targets"] == result2["plan"]["evaluation_targets"]

    @pytest.mark.asyncio
    async def test_plan_different_sds_different_hash(self, workflow_context):
        """Test that different SDS inputs produce different hashes."""

        # Run with different SDS inputs
        result1 = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        result2 = await run_skill(
            inputs={"sds": SAMPLE_SDS_CHRISTMAS},
            context=workflow_context,
        )

        # Hashes should be different
        assert result1["plan"]["_hash"] != result2["plan"]["_hash"]


class TestPlanWordCounts:
    """Test word count calculation logic."""

    @pytest.mark.asyncio
    async def test_word_counts_respect_section_requirements(self, workflow_context):
        """Test that word counts use section requirements from SDS."""

        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        plan = result["plan"]

        # Verify word counts are reasonable (6 words/line avg)
        # Verse: 6-10 lines → 36-60 words (avg ~48)
        # Chorus: 6-10 lines → 36-60 words (avg ~48)
        for section in plan["section_order"]:
            word_count = plan["target_word_counts"][section]
            assert word_count > 0
            assert word_count < 200  # Sanity check

    @pytest.mark.asyncio
    async def test_word_counts_respect_max_lines_constraint(self, workflow_context):
        """Test that total word count respects max_lines constraint."""

        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        plan = result["plan"]

        # Total word count should be ≤ max_lines * 6 words/line
        total_words = sum(plan["target_word_counts"].values())
        max_words = SAMPLE_SDS_POP["constraints"]["max_lines"] * 6

        assert total_words <= max_words


class TestPlanEvaluationTargets:
    """Test evaluation target definition."""

    @pytest.mark.asyncio
    async def test_evaluation_targets_include_required_metrics(self, workflow_context):
        """Test that evaluation targets include all required metrics."""

        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        plan = result["plan"]
        targets = plan["evaluation_targets"]

        # Verify all required metrics
        required_metrics = [
            "hook_density",
            "singability",
            "rhyme_tightness",
            "section_completeness",
            "profanity_score",
            "total",
        ]

        for metric in required_metrics:
            assert metric in targets
            assert 0.0 <= targets[metric] <= 1.0

    @pytest.mark.asyncio
    async def test_profanity_score_respects_explicit_flag(self, workflow_context):
        """Test that profanity_score is 0.0 when explicit=False."""

        # Test with explicit=False
        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )
        assert result["plan"]["evaluation_targets"]["profanity_score"] == 0.0

        # Test with explicit=True
        explicit_sds = {
            **SAMPLE_SDS_POP,
            "constraints": {**SAMPLE_SDS_POP["constraints"], "explicit": True},
        }
        result_explicit = await run_skill(
            inputs={"sds": explicit_sds},
            context=workflow_context,
        )
        assert result_explicit["plan"]["evaluation_targets"]["profanity_score"] == 1.0


class TestPlanWorkObjectives:
    """Test work objective creation."""

    @pytest.mark.asyncio
    async def test_work_objectives_include_all_nodes(self, workflow_context):
        """Test that work objectives include all downstream nodes."""

        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        plan = result["plan"]
        objectives = plan["work_objectives"]

        # Verify all nodes are present
        nodes = [obj["node"] for obj in objectives]
        assert "STYLE" in nodes
        assert "LYRICS" in nodes
        assert "PRODUCER" in nodes
        assert "COMPOSE" in nodes

    @pytest.mark.asyncio
    async def test_work_objectives_have_correct_dependencies(self, workflow_context):
        """Test that work objectives specify correct dependencies."""

        result = await run_skill(
            inputs={"sds": SAMPLE_SDS_POP},
            context=workflow_context,
        )

        objectives = result["plan"]["work_objectives"]

        # Find each node's dependencies
        deps_by_node = {obj["node"]: obj["dependencies"] for obj in objectives}

        # STYLE has no dependencies
        assert deps_by_node["STYLE"] == []

        # LYRICS depends on STYLE
        assert "STYLE" in deps_by_node["LYRICS"]

        # PRODUCER depends on STYLE
        assert "STYLE" in deps_by_node["PRODUCER"]

        # COMPOSE depends on STYLE, LYRICS, PRODUCER
        assert "STYLE" in deps_by_node["COMPOSE"]
        assert "LYRICS" in deps_by_node["COMPOSE"]
        assert "PRODUCER" in deps_by_node["COMPOSE"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
