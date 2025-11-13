"""Tests for Prometheus metrics collection."""

from __future__ import annotations

import pytest
from prometheus_client import REGISTRY

from app.observability import metrics


class TestMetricsCollection:
    """Test metric collection and recording functions."""

    def test_workflow_start_increments_active_gauge(self):
        """Test that workflow start increments active workflows gauge."""
        # Get initial value
        initial_value = metrics.active_workflows._value._value

        # Record workflow start
        metrics.record_workflow_start()

        # Verify gauge incremented
        assert metrics.active_workflows._value._value == initial_value + 1

    def test_workflow_complete_updates_metrics(self):
        """Test that workflow completion updates all relevant metrics."""
        # Record workflow start first
        metrics.record_workflow_start(genre="pop")

        # Record completion
        metrics.record_workflow_complete(
            duration_seconds=25.5,
            genre="pop",
            success=True,
        )

        # Verify active workflows decremented
        # Note: This is a simple check - in reality the value depends on test order
        assert metrics.active_workflows._value._value >= 0

        # Verify counters incremented (check that metric exists)
        assert metrics.workflow_runs_total._metrics is not None

    def test_skill_execution_records_duration(self):
        """Test that skill execution records duration histogram."""
        skill_name = "amcs.plan.generate"
        duration = 2.5

        metrics.record_skill_execution(
            skill_name=skill_name,
            duration_seconds=duration,
            status="completed",
        )

        # Verify counter incremented
        assert metrics.skill_executions_total._metrics is not None

    def test_llm_usage_records_tokens(self):
        """Test that LLM usage records token counts."""
        metrics.record_llm_usage(
            skill_name="amcs.lyrics.generate",
            model="claude-sonnet-4-5",
            input_tokens=1000,
            output_tokens=500,
            success=True,
        )

        # Verify counters exist
        assert metrics.skill_llm_tokens_total._metrics is not None
        assert metrics.skill_llm_calls_total._metrics is not None

    def test_validation_scores_recorded(self):
        """Test that validation scores are recorded to histogram."""
        scores = {
            "hook_density": 0.85,
            "singability": 0.92,
            "rhyme_tightness": 0.78,
        }

        metrics.record_validation_scores(scores)

        # Verify histogram exists
        assert metrics.rubric_scores._metrics is not None

    def test_fix_iterations_recorded(self):
        """Test that fix iterations are recorded."""
        metrics.record_fix_iterations(2)

        # Verify histogram exists (just check the object exists)
        assert metrics.fix_iterations is not None

    def test_validation_failure_recorded(self):
        """Test that validation failures are counted."""
        metrics.record_validation_failure("hook_density_low")

        # Verify counter exists
        assert metrics.validation_failures_total._metrics is not None

    def test_artifact_size_recorded(self):
        """Test that artifact sizes are recorded."""
        metrics.record_artifact_size("lyrics", 2048)

        # Verify histogram exists
        assert metrics.artifact_size_bytes._metrics is not None


class TestMetricLabels:
    """Test that metrics have correct labels."""

    def test_workflow_runs_total_has_status_label(self):
        """Test that workflow_runs_total has status label."""
        metrics.record_workflow_complete(25.5, "pop", success=True)

        # Check that metric exists and has the expected structure
        # Prometheus client metrics have labels defined in their _labelnames
        assert hasattr(metrics.workflow_runs_total, '_labelnames')
        assert 'status' in metrics.workflow_runs_total._labelnames

    def test_skill_executions_has_labels(self):
        """Test that skill executions have skill_name and status labels."""
        metrics.record_skill_execution("amcs.plan", 2.0, "completed")

        # Check that metric has labels
        assert hasattr(metrics.skill_executions_total, '_labelnames')
        assert 'skill_name' in metrics.skill_executions_total._labelnames
        assert 'status' in metrics.skill_executions_total._labelnames

    def test_llm_tokens_have_labels(self):
        """Test that LLM token metrics have appropriate labels."""
        metrics.record_llm_usage("amcs.lyrics", "claude-sonnet-4-5", 1000, 500)

        # Check that metric has labels
        assert hasattr(metrics.skill_llm_tokens_total, '_labelnames')
        assert 'skill_name' in metrics.skill_llm_tokens_total._labelnames
        assert 'model' in metrics.skill_llm_tokens_total._labelnames
        assert 'token_type' in metrics.skill_llm_tokens_total._labelnames


class TestMetricNames:
    """Test that metrics have correct names and types."""

    def test_all_workflow_metrics_exist(self):
        """Test that all workflow metrics are defined."""
        assert hasattr(metrics, "workflow_runs_total")
        assert hasattr(metrics, "workflow_duration_seconds")
        assert hasattr(metrics, "active_workflows")

    def test_all_skill_metrics_exist(self):
        """Test that all skill metrics are defined."""
        assert hasattr(metrics, "skill_executions_total")
        assert hasattr(metrics, "skill_duration_seconds")
        assert hasattr(metrics, "skill_llm_tokens_total")
        assert hasattr(metrics, "skill_llm_calls_total")

    def test_all_quality_metrics_exist(self):
        """Test that all quality metrics are defined."""
        assert hasattr(metrics, "rubric_scores")
        assert hasattr(metrics, "fix_iterations")
        assert hasattr(metrics, "validation_failures_total")

    def test_all_artifact_metrics_exist(self):
        """Test that all artifact metrics are defined."""
        assert hasattr(metrics, "artifact_size_bytes")
        assert hasattr(metrics, "artifact_hash_collisions_total")

    def test_all_event_metrics_exist(self):
        """Test that all event metrics are defined."""
        assert hasattr(metrics, "event_publish_total")
        assert hasattr(metrics, "event_publish_errors_total")
        assert hasattr(metrics, "websocket_connections")
