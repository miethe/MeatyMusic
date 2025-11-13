"""Tests for WorkflowLogger structured logging."""

from __future__ import annotations

from uuid import uuid4

import pytest

from app.observability.workflow_logger import WorkflowLogger


class TestWorkflowLogger:
    """Test WorkflowLogger functionality."""

    def test_logger_initialization(self):
        """Test that logger can be initialized with context."""
        run_id = uuid4()
        song_id = uuid4()

        logger = WorkflowLogger(run_id=run_id, song_id=song_id)

        assert logger.run_id == run_id
        assert logger.song_id == song_id
        assert logger.logger is not None

    def test_logger_initialization_minimal(self):
        """Test logger can be initialized with just run_id."""
        run_id = uuid4()

        logger = WorkflowLogger(run_id=run_id)

        assert logger.run_id == run_id
        assert logger.song_id is None
        assert logger.user_id is None

    def test_log_workflow_start(self):
        """Test workflow start logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_workflow_start(
            seed=42,
            genre="pop",
            manifest={"graph": [{"id": "PLAN"}, {"id": "STYLE"}]},
        )

    def test_log_workflow_complete(self):
        """Test workflow completion logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_workflow_complete(
            duration_ms=25000,
            status="completed",
            fix_iterations=1,
            validation_scores={"hook_density": 0.85},
        )

    def test_log_workflow_error(self):
        """Test workflow error logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        error = ValueError("Test error")

        # Should not raise
        logger.log_workflow_error(
            error=error,
            current_node="LYRICS",
            context={"additional": "info"},
        )

    def test_log_skill_start(self):
        """Test skill start logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_skill_start(
            skill_name="amcs.plan.generate",
            node_name="PLAN",
            inputs_hash="abc123",
            seed=42,
            node_index=0,
        )

    def test_log_skill_complete(self):
        """Test skill completion logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_skill_complete(
            skill_name="amcs.plan.generate",
            node_name="PLAN",
            outputs_hash="def456",
            duration_ms=2500,
            model_params={"temperature": 0.2, "top_p": 0.9},
        )

    def test_log_skill_error(self):
        """Test skill error logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        error = RuntimeError("Skill failed")

        # Should not raise
        logger.log_skill_error(
            skill_name="amcs.lyrics.generate",
            node_name="LYRICS",
            error=error,
            duration_ms=1500,
            error_type="execution",
        )

    def test_log_llm_call(self):
        """Test LLM call logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_llm_call(
            skill_name="amcs.lyrics.generate",
            model="claude-sonnet-4-5",
            input_tokens=1000,
            output_tokens=500,
            duration_ms=3000,
            success=True,
        )

    def test_log_validation_start(self):
        """Test validation start logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_validation_start(
            artifacts=["lyrics", "style", "producer_notes"],
            blueprint="pop",
        )

    def test_log_validation_complete(self):
        """Test validation completion logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_validation_complete(
            passed=True,
            scores={"hook_density": 0.85, "singability": 0.92},
            issues=[],
            duration_ms=500,
        )

    def test_log_validation_with_issues(self):
        """Test validation logging with issues."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        issues = [
            {"type": "hook_density_low", "severity": "warning"},
            {"type": "profanity_detected", "severity": "error"},
        ]

        # Should not raise
        logger.log_validation_complete(
            passed=False,
            scores={"hook_density": 0.65},
            issues=issues,
            duration_ms=600,
        )

    def test_log_fix_iteration(self):
        """Test fix iteration logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_fix_iteration(
            iteration=1,
            max_iterations=3,
            issues_addressed=["hook_density_low", "rhyme_weak"],
        )

    def test_log_artifact_saved(self):
        """Test artifact save logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_artifact_saved(
            artifact_type="lyrics",
            artifact_hash="abc123def456",
            size_bytes=2048,
            storage_path="/artifacts/lyrics/abc123.json",
        )

    def test_log_event_published(self):
        """Test event publication logging."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_event_published(
            event_type="workflow_progress",
            node_name="LYRICS",
            phase="end",
            success=True,
        )

    def test_log_determinism_check_passed(self):
        """Test determinism check logging (passed)."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_determinism_check(
            expected_hash="abc123",
            actual_hash="abc123",
            passed=True,
        )

    def test_log_determinism_check_failed(self):
        """Test determinism check logging (failed)."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Should not raise
        logger.log_determinism_check(
            expected_hash="abc123",
            actual_hash="def456",
            passed=False,
        )


class TestLoggerContextPropagation:
    """Test that logger context is properly included in log messages."""

    def test_run_id_in_context(self):
        """Test that run_id is bound to logger."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id)

        # Logger should be bound with run_id
        assert logger.logger is not None

    def test_song_id_in_context(self):
        """Test that song_id is bound to logger."""
        run_id = uuid4()
        song_id = uuid4()
        logger = WorkflowLogger(run_id=run_id, song_id=song_id)

        # Logger should be bound with song_id
        assert logger.song_id == song_id

    def test_user_id_in_context(self):
        """Test that user_id is bound to logger."""
        run_id = uuid4()
        logger = WorkflowLogger(run_id=run_id, user_id="user_123")

        # Logger should be bound with user_id
        assert logger.user_id == "user_123"
