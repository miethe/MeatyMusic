"""
Quick validation test for skill_contracts.py

This standalone script validates that all skill contract schemas
are correctly defined and can be instantiated.
"""

import sys
sys.path.insert(0, '/home/user/MeatyMusic/services/api')

from datetime import datetime
from app.schemas.skill_contracts import (
    WorkflowContext,
    PlanInput, PlanOutput,
    StyleInput, StyleOutput,
    LyricsInput, LyricsOutput,
    ProducerInput, ProducerOutput,
    ComposeInput, ComposeOutput,
    ValidateInput, ValidateOutput,
    FixInput, FixOutput,
    ReviewInput, ReviewOutput,
)


def test_workflow_context():
    """Test WorkflowContext creation and validation."""
    print("Testing WorkflowContext...")

    ctx = WorkflowContext(
        run_id="test-run-123",
        song_id="song-456",
        seed=42,
        feature_flags={"test": True}
    )

    assert ctx.run_id == "test-run-123"
    assert ctx.seed == 42
    assert ctx.feature_flags == {"test": True}

    # Test validation: negative seed
    try:
        bad_ctx = WorkflowContext(run_id="test", song_id="test", seed=-1)
        assert False, "Should have rejected negative seed"
    except ValueError:
        pass  # Expected

    print("  ✓ WorkflowContext validated")


def test_plan_contracts():
    """Test PlanInput and PlanOutput."""
    print("Testing PLAN contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    # Valid input
    plan_input = PlanInput(
        context=ctx,
        sds={"genre": "pop", "targetLength": "3:00"}
    )
    assert plan_input.sds["genre"] == "pop"

    # Valid output
    plan_output = PlanOutput(
        status="success",
        execution_time_ms=100,
        artifact_hash="sha256:" + "a" * 64,
        plan={
            "sections": [],
            "evaluationTargets": {},
            "totalWordCount": 0
        }
    )
    assert plan_output.status == "success"

    # Test validation: failed status requires errors
    try:
        bad_output = PlanOutput(
            status="failed",
            execution_time_ms=100,
            plan={},
            errors=[]  # Empty!
        )
        assert False, "Should require errors for failed status"
    except ValueError:
        pass  # Expected

    print("  ✓ PLAN contracts validated")


def test_style_contracts():
    """Test StyleInput and StyleOutput."""
    print("Testing STYLE contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    style_input = StyleInput(
        context=ctx,
        sds={"genre": "pop", "targetLength": "3:00"},
        plan={"sections": [], "evaluationTargets": {}, "totalWordCount": 0},
        blueprint={"genre": "pop"}
    )

    style_output = StyleOutput(
        status="success",
        execution_time_ms=100,
        style={"genre": "pop", "bpm": 120},
        conflicts_resolved=[]
    )

    assert style_output.style["genre"] == "pop"
    print("  ✓ STYLE contracts validated")


def test_lyrics_contracts():
    """Test LyricsInput and LyricsOutput."""
    print("Testing LYRICS contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    lyrics_input = LyricsInput(
        context=ctx,
        sds={"genre": "pop", "targetLength": "3:00"},
        plan={"sections": [], "evaluationTargets": {}, "totalWordCount": 0},
        style={"genre": "pop", "bpm": 120},
        sources=[],
        blueprint={"genre": "pop"}
    )

    lyrics_output = LyricsOutput(
        status="success",
        execution_time_ms=100,
        lyrics={"sections": []},
        citations=[]
    )

    # Test validation: lyrics must have sections
    try:
        bad_lyrics = LyricsOutput(
            status="success",
            execution_time_ms=100,
            lyrics={"no_sections": True},  # Missing sections!
            citations=[]
        )
        assert False, "Should require sections in lyrics"
    except ValueError:
        pass  # Expected

    print("  ✓ LYRICS contracts validated")


def test_producer_contracts():
    """Test ProducerInput and ProducerOutput."""
    print("Testing PRODUCER contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    producer_input = ProducerInput(
        context=ctx,
        sds={"genre": "pop", "targetLength": "3:00"},
        plan={"sections": [], "evaluationTargets": {}, "totalWordCount": 0},
        style={"genre": "pop", "bpm": 120},
        blueprint={"genre": "pop"}
    )

    producer_output = ProducerOutput(
        status="success",
        execution_time_ms=100,
        producer_notes={"arrangement": {}},
        structure={"sectionOrder": []}
    )

    # Test validation: structure must have sectionOrder
    try:
        bad_structure = ProducerOutput(
            status="success",
            execution_time_ms=100,
            producer_notes={},
            structure={"no_section_order": True}  # Missing!
        )
        assert False, "Should require sectionOrder in structure"
    except ValueError:
        pass  # Expected

    print("  ✓ PRODUCER contracts validated")


def test_compose_contracts():
    """Test ComposeInput and ComposeOutput."""
    print("Testing COMPOSE contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    compose_input = ComposeInput(
        context=ctx,
        style={"genre": "pop", "bpm": 120},
        lyrics={"sections": []},
        producer_notes={"arrangement": {}},
        engine_limits={"char_limit": 3000}
    )

    compose_output = ComposeOutput(
        status="success",
        execution_time_ms=100,
        composed_prompt={"text": "Test prompt"},
        char_count=11,
        truncated=False
    )

    # Test validation: truncated=True requires warnings
    try:
        bad_truncation = ComposeOutput(
            status="success",
            execution_time_ms=100,
            composed_prompt={"text": "Test"},
            char_count=100,
            truncated=True,
            truncation_warnings=[]  # Empty!
        )
        assert False, "Should require warnings when truncated"
    except ValueError:
        pass  # Expected

    print("  ✓ COMPOSE contracts validated")


def test_validate_contracts():
    """Test ValidateInput and ValidateOutput."""
    print("Testing VALIDATE contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    validate_input = ValidateInput(
        context=ctx,
        lyrics={"sections": []},
        style={"genre": "pop", "bpm": 120},
        producer_notes={"arrangement": {}},
        composed_prompt={"text": "Test"},
        blueprint={"rubric": {}}
    )

    validate_output = ValidateOutput(
        status="success",
        execution_time_ms=100,
        validation_report={"metrics": {}},
        scores={"hookDensity": 0.85, "singability": 0.90},
        total_score=0.87,
        passed=True,
        issues=[]
    )

    # Test validation: scores must be 0.0-1.0
    try:
        bad_score = ValidateOutput(
            status="success",
            execution_time_ms=100,
            validation_report={},
            scores={"test": 1.5},  # > 1.0!
            total_score=0.85,
            passed=True,
            issues=[]
        )
        assert False, "Should reject scores > 1.0"
    except ValueError:
        pass  # Expected

    print("  ✓ VALIDATE contracts validated")


def test_fix_contracts():
    """Test FixInput and FixOutput."""
    print("Testing FIX contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    fix_input = FixInput(
        context=ctx,
        validation_report={"issues": [{"metric": "hookDensity"}]},
        lyrics={"sections": []},
        style={"genre": "pop", "bpm": 120},
        producer_notes={"arrangement": {}},
        blueprint={"genre": "pop"},
        iteration=1
    )

    fix_output = FixOutput(
        status="success",
        execution_time_ms=100,
        patched_lyrics={"sections": [{"fixed": True}]},
        fixes_applied=["Added hook"],
        improvement=0.1
    )

    # Test validation: success requires at least one patch
    try:
        bad_fix = FixOutput(
            status="success",
            execution_time_ms=100,
            # No patches!
            fixes_applied=[]
        )
        assert False, "Should require at least one patch for success"
    except ValueError:
        pass  # Expected

    print("  ✓ FIX contracts validated")


def test_review_contracts():
    """Test ReviewInput and ReviewOutput."""
    print("Testing REVIEW contracts...")

    ctx = WorkflowContext(run_id="test", song_id="test", seed=1)

    review_input = ReviewInput(
        context=ctx,
        artifacts={
            "plan": {},
            "style": {},
            "lyrics": {},
            "producer_notes": {},
            "composed_prompt": {}
        },
        validation_report={"passed": True}
    )

    review_output = ReviewOutput(
        status="success",
        execution_time_ms=100,
        summary={
            "runId": "test",
            "songId": "test",
            "status": "success",
            "finalScore": 0.9,
            "passed": True
        },
        provenance={"artifactHashes": {}}
    )

    # Test validation: artifacts must have all required keys
    try:
        bad_artifacts = ReviewInput(
            context=ctx,
            artifacts={"plan": {}},  # Missing other artifacts!
            validation_report={}
        )
        assert False, "Should require all artifact keys"
    except ValueError:
        pass  # Expected

    print("  ✓ REVIEW contracts validated")


def main():
    """Run all validation tests."""
    print("\n" + "=" * 60)
    print("Skill Contract Validation Tests")
    print("=" * 60 + "\n")

    test_workflow_context()
    test_plan_contracts()
    test_style_contracts()
    test_lyrics_contracts()
    test_producer_contracts()
    test_compose_contracts()
    test_validate_contracts()
    test_fix_contracts()
    test_review_contracts()

    print("\n" + "=" * 60)
    print("✓ All skill contract schemas validated successfully!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
