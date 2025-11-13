"""Tests for alert rules and configuration."""

from __future__ import annotations

import pytest

from app.observability.alerts import (
    ALL_ALERTS,
    WORKFLOW_ALERTS,
    SKILL_ALERTS,
    QUALITY_ALERTS,
    DETERMINISM_ALERTS,
    SYSTEM_ALERTS,
    get_alert_by_name,
    get_alerts_by_severity,
    export_prometheus_rules,
)


class TestAlertDefinitions:
    """Test alert rule definitions."""

    def test_all_alerts_defined(self):
        """Test that all alert categories are defined."""
        assert len(ALL_ALERTS) > 0
        assert len(WORKFLOW_ALERTS) > 0
        assert len(SKILL_ALERTS) > 0
        assert len(QUALITY_ALERTS) > 0
        assert len(DETERMINISM_ALERTS) > 0
        assert len(SYSTEM_ALERTS) > 0

    def test_all_alerts_aggregated(self):
        """Test that ALL_ALERTS contains all categories."""
        expected_count = (
            len(WORKFLOW_ALERTS)
            + len(SKILL_ALERTS)
            + len(QUALITY_ALERTS)
            + len(DETERMINISM_ALERTS)
            + len(SYSTEM_ALERTS)
        )
        assert len(ALL_ALERTS) == expected_count

    def test_alert_has_required_fields(self):
        """Test that each alert has all required fields."""
        required_fields = ["name", "condition", "severity", "message", "description", "duration"]

        for alert in ALL_ALERTS:
            for field in required_fields:
                assert field in alert, f"Alert missing field: {field}"
                assert alert[field], f"Alert field is empty: {field}"

    def test_alert_severity_valid(self):
        """Test that alert severities are valid."""
        valid_severities = ["critical", "warning", "info"]

        for alert in ALL_ALERTS:
            assert alert["severity"] in valid_severities, (
                f"Invalid severity '{alert['severity']}' for alert {alert['name']}"
            )

    def test_alert_names_unique(self):
        """Test that all alert names are unique."""
        names = [alert["name"] for alert in ALL_ALERTS]
        assert len(names) == len(set(names)), "Duplicate alert names found"


class TestAlertQueries:
    """Test alert query functions."""

    def test_get_alert_by_name_existing(self):
        """Test getting an alert by name (existing)."""
        alert = get_alert_by_name("HighWorkflowFailureRate")
        assert alert is not None
        assert alert["name"] == "HighWorkflowFailureRate"
        assert "failure rate" in alert["message"].lower()

    def test_get_alert_by_name_nonexistent(self):
        """Test getting an alert by name (non-existent)."""
        alert = get_alert_by_name("NonExistentAlert")
        assert alert is None

    def test_get_alerts_by_severity_critical(self):
        """Test getting alerts by severity (critical)."""
        critical_alerts = get_alerts_by_severity("critical")
        assert len(critical_alerts) > 0

        for alert in critical_alerts:
            assert alert["severity"] == "critical"

    def test_get_alerts_by_severity_warning(self):
        """Test getting alerts by severity (warning)."""
        warning_alerts = get_alerts_by_severity("warning")
        assert len(warning_alerts) > 0

        for alert in warning_alerts:
            assert alert["severity"] == "warning"

    def test_get_alerts_by_severity_info(self):
        """Test getting alerts by severity (info)."""
        info_alerts = get_alerts_by_severity("info")
        assert len(info_alerts) > 0

        for alert in info_alerts:
            assert alert["severity"] == "info"


class TestWorkflowAlerts:
    """Test workflow-specific alerts."""

    def test_high_failure_rate_alert_exists(self):
        """Test that high failure rate alert is defined."""
        alert = get_alert_by_name("HighWorkflowFailureRate")
        assert alert is not None
        assert "workflow_runs_total" in alert["condition"]
        assert alert["severity"] == "warning"

    def test_high_latency_alert_exists(self):
        """Test that high latency alert is defined."""
        alert = get_alert_by_name("HighWorkflowP95Latency")
        assert alert is not None
        assert "60" in alert["condition"]  # P95 target is 60s
        assert alert["severity"] == "warning"

    def test_too_many_active_workflows_alert_exists(self):
        """Test that excessive active workflows alert is defined."""
        alert = get_alert_by_name("TooManyActiveWorkflows")
        assert alert is not None
        assert "active_workflows" in alert["condition"]


class TestSkillAlerts:
    """Test skill-specific alerts."""

    def test_skill_failure_rate_alert_exists(self):
        """Test that skill failure rate alert is defined."""
        alert = get_alert_by_name("HighSkillFailureRate")
        assert alert is not None
        assert "skill_executions_total" in alert["condition"]
        assert alert["severity"] == "warning"

    def test_slow_skill_execution_alert_exists(self):
        """Test that slow skill execution alert is defined."""
        alert = get_alert_by_name("SlowSkillExecution")
        assert alert is not None
        assert "skill_duration_seconds" in alert["condition"]

    def test_excessive_llm_tokens_alert_exists(self):
        """Test that excessive LLM token usage alert is defined."""
        alert = get_alert_by_name("ExcessiveLLMTokenUsage")
        assert alert is not None
        assert "skill_llm_tokens_total" in alert["condition"]


class TestQualityAlerts:
    """Test quality and validation alerts."""

    def test_low_rubric_scores_alert_exists(self):
        """Test that low rubric scores alert is defined."""
        alert = get_alert_by_name("LowRubricScores")
        assert alert is not None
        assert "rubric_scores" in alert["condition"]

    def test_excessive_fix_iterations_alert_exists(self):
        """Test that excessive fix iterations alert is defined."""
        alert = get_alert_by_name("ExcessiveFixIterations")
        assert alert is not None
        assert "fix_iterations" in alert["condition"]

    def test_high_validation_failure_rate_alert_exists(self):
        """Test that high validation failure rate alert is defined."""
        alert = get_alert_by_name("HighValidationFailureRate")
        assert alert is not None
        assert "validation_failures_total" in alert["condition"]


class TestDeterminismAlerts:
    """Test determinism violation alerts."""

    def test_determinism_violations_alert_exists(self):
        """Test that determinism violations alert is defined."""
        alert = get_alert_by_name("DeterminismViolations")
        assert alert is not None
        assert alert["severity"] == "critical"  # Determinism is critical
        assert "determinism_violations_total" in alert["condition"]


class TestSystemAlerts:
    """Test system health alerts."""

    def test_database_connection_alert_exists(self):
        """Test that database connection alert is defined."""
        alert = get_alert_by_name("DatabaseConnectionFailures")
        assert alert is not None
        assert alert["severity"] == "critical"

    def test_high_event_publish_failures_alert_exists(self):
        """Test that event publish failures alert is defined."""
        alert = get_alert_by_name("HighEventPublishFailures")
        assert alert is not None
        assert "event_publish_errors_total" in alert["condition"]


class TestPrometheusExport:
    """Test Prometheus rule export."""

    def test_export_prometheus_rules_returns_yaml(self):
        """Test that export returns YAML-formatted rules."""
        yaml_output = export_prometheus_rules()

        assert "groups:" in yaml_output
        assert "- name: amcs_workflow_alerts" in yaml_output
        assert "rules:" in yaml_output

    def test_export_includes_all_alerts(self):
        """Test that export includes all defined alerts."""
        yaml_output = export_prometheus_rules()

        # Check that all alert names appear in the output
        for alert in ALL_ALERTS:
            assert alert["name"] in yaml_output

    def test_export_includes_alert_metadata(self):
        """Test that export includes alert metadata."""
        yaml_output = export_prometheus_rules()

        # Check for common YAML structure elements
        assert "alert:" in yaml_output
        assert "expr:" in yaml_output
        assert "for:" in yaml_output
        assert "severity:" in yaml_output
        assert "summary:" in yaml_output
        assert "description:" in yaml_output
