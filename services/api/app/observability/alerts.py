"""Alert rules and conditions for workflow monitoring.

This module defines alert rules for Prometheus Alertmanager or
similar alerting systems. These rules are documented here but
not yet actively triggered - they serve as a reference for
future alerting infrastructure.

Alert Severity Levels:
- critical: Immediate action required (service down, data loss)
- warning: Action needed soon (degraded performance, high error rate)
- info: Informational (unusual patterns, FYI)
"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict


class AlertRule(TypedDict):
    """Alert rule definition.

    Attributes:
        name: Unique alert name
        condition: PromQL-style condition expression
        severity: Alert severity (critical, warning, info)
        message: Human-readable alert message
        description: Detailed description and remediation
        duration: How long condition must be true before alerting
    """

    name: str
    condition: str
    severity: str
    message: str
    description: str
    duration: str  # e.g., "5m", "10m", "1h"


# =============================================================================
# Workflow Execution Alerts
# =============================================================================

WORKFLOW_ALERTS: List[AlertRule] = [
    {
        "name": "HighWorkflowFailureRate",
        "condition": "rate(workflow_runs_total{status='failed'}[5m]) / rate(workflow_runs_total[5m]) > 0.1",
        "severity": "warning",
        "message": "Workflow failure rate exceeds 10%",
        "description": (
            "More than 10% of workflow runs are failing. This may indicate:\n"
            "- LLM API issues or rate limits\n"
            "- Blueprint validation problems\n"
            "- Database connectivity issues\n"
            "- Skill execution bugs\n"
            "\nRemediation:\n"
            "1. Check /api/v1/monitoring/health for specific issues\n"
            "2. Review recent failed runs in /api/v1/monitoring/recent-runs?status_filter=failed\n"
            "3. Check LLM API status and quotas\n"
            "4. Review application logs for error patterns"
        ),
        "duration": "10m",
    },
    {
        "name": "HighWorkflowP95Latency",
        "condition": "histogram_quantile(0.95, workflow_duration_seconds) > 60",
        "severity": "warning",
        "message": "P95 workflow latency exceeds 60 seconds",
        "description": (
            "95th percentile workflow execution time is above the 60s target. "
            "This may indicate:\n"
            "- LLM API slowness\n"
            "- Database query performance issues\n"
            "- Excessive fix loop iterations\n"
            "- Network latency\n"
            "\nRemediation:\n"
            "1. Check /api/v1/monitoring/stats for node performance breakdown\n"
            "2. Review avg_fix_iterations - high values indicate quality issues\n"
            "3. Check LLM API latency metrics\n"
            "4. Review database query performance"
        ),
        "duration": "15m",
    },
    {
        "name": "TooManyActiveWorkflows",
        "condition": "active_workflows > 20",
        "severity": "warning",
        "message": "Excessive number of concurrent workflows",
        "description": (
            "More than 20 workflows are running concurrently. This may indicate:\n"
            "- Workflows getting stuck or hanging\n"
            "- Insufficient worker capacity\n"
            "- Deadlocks or blocking operations\n"
            "\nRemediation:\n"
            "1. Check /api/v1/monitoring/active-runs for stuck workflows\n"
            "2. Review workflow logs for hung skills\n"
            "3. Consider increasing worker pool size\n"
            "4. Check for deadlocks in database or external services"
        ),
        "duration": "5m",
    },
    {
        "name": "NoWorkflowActivity",
        "condition": "rate(workflow_runs_total[1h]) == 0",
        "severity": "info",
        "message": "No workflow executions in the last hour",
        "description": (
            "No workflows have been executed in the last hour. This may be normal "
            "during low-traffic periods, or it may indicate:\n"
            "- Service is down or unreachable\n"
            "- Queue processing is stuck\n"
            "- No user activity\n"
            "\nRemediation:\n"
            "1. Verify service is running and accessible\n"
            "2. Check queue status and workers\n"
            "3. Review application logs for startup errors"
        ),
        "duration": "1h",
    },
]

# =============================================================================
# Skill Execution Alerts
# =============================================================================

SKILL_ALERTS: List[AlertRule] = [
    {
        "name": "HighSkillFailureRate",
        "condition": "rate(skill_executions_total{status='failed'}[5m]) / rate(skill_executions_total[5m]) > 0.2",
        "severity": "warning",
        "message": "Skill failure rate exceeds 20%",
        "description": (
            "More than 20% of skill executions are failing. This may indicate:\n"
            "- LLM API errors or timeouts\n"
            "- Input validation issues\n"
            "- Skill implementation bugs\n"
            "- External service dependencies failing\n"
            "\nRemediation:\n"
            "1. Check which skills are failing most frequently\n"
            "2. Review skill error logs for patterns\n"
            "3. Verify LLM API connectivity and quotas\n"
            "4. Check external service dependencies"
        ),
        "duration": "10m",
    },
    {
        "name": "SlowSkillExecution",
        "condition": "histogram_quantile(0.95, skill_duration_seconds{skill_name=~'amcs.*'}) > 30",
        "severity": "warning",
        "message": "P95 skill latency exceeds 30 seconds",
        "description": (
            "95th percentile skill execution time is above 30s. This may indicate:\n"
            "- LLM API slowness\n"
            "- Large input/output sizes\n"
            "- Inefficient skill implementation\n"
            "- Network issues\n"
            "\nRemediation:\n"
            "1. Identify which skills have high latency\n"
            "2. Review skill implementation for optimization opportunities\n"
            "3. Check LLM API latency\n"
            "4. Consider skill timeout adjustments"
        ),
        "duration": "15m",
    },
    {
        "name": "ExcessiveLLMTokenUsage",
        "condition": "rate(skill_llm_tokens_total[5m]) > 1000000",
        "severity": "warning",
        "message": "LLM token usage exceeds 1M tokens/5min",
        "description": (
            "LLM token consumption is very high. This may indicate:\n"
            "- Inefficient prompt design\n"
            "- Excessive retry loops\n"
            "- Runaway workflow executions\n"
            "- Cost optimization opportunity\n"
            "\nRemediation:\n"
            "1. Review which skills are using the most tokens\n"
            "2. Analyze prompt sizes and optimize where possible\n"
            "3. Check for excessive fix loop iterations\n"
            "4. Review token usage costs"
        ),
        "duration": "5m",
    },
]

# =============================================================================
# Quality & Validation Alerts
# =============================================================================

QUALITY_ALERTS: List[AlertRule] = [
    {
        "name": "LowRubricScores",
        "condition": "histogram_quantile(0.50, rubric_scores) < 0.7",
        "severity": "warning",
        "message": "Median rubric scores below 0.7",
        "description": (
            "Median validation scores are below quality threshold. This may indicate:\n"
            "- Blueprint/rubric configuration issues\n"
            "- LLM model quality degradation\n"
            "- Insufficient fix loop iterations\n"
            "- Skill implementation issues\n"
            "\nRemediation:\n"
            "1. Review validation_scores in recent runs\n"
            "2. Check which metrics are scoring low\n"
            "3. Review blueprint thresholds\n"
            "4. Analyze fix loop effectiveness"
        ),
        "duration": "30m",
    },
    {
        "name": "ExcessiveFixIterations",
        "condition": "histogram_quantile(0.95, fix_iterations) > 2",
        "severity": "info",
        "message": "P95 fix iterations exceeds 2",
        "description": (
            "Most workflows require multiple fix iterations. This may indicate:\n"
            "- Initial artifact quality is low\n"
            "- Blueprint rules are too strict\n"
            "- Fix skill is not addressing issues effectively\n"
            "- LLM model needs prompt tuning\n"
            "\nRemediation:\n"
            "1. Review common validation failures\n"
            "2. Analyze fix iteration patterns\n"
            "3. Tune skill prompts for better initial quality\n"
            "4. Adjust blueprint thresholds if appropriate"
        ),
        "duration": "1h",
    },
    {
        "name": "HighValidationFailureRate",
        "condition": "rate(validation_failures_total[5m]) > 10",
        "severity": "info",
        "message": "Validation failures increasing",
        "description": (
            "Validation failures are occurring frequently. This may indicate:\n"
            "- Quality issues with generated artifacts\n"
            "- Blueprint rules are too restrictive\n"
            "- Recent changes degrading output quality\n"
            "\nRemediation:\n"
            "1. Check /api/v1/monitoring/stats for common_failures\n"
            "2. Review which validation rules are failing most\n"
            "3. Analyze recent code or prompt changes\n"
            "4. Consider blueprint threshold adjustments"
        ),
        "duration": "10m",
    },
]

# =============================================================================
# Determinism Alerts
# =============================================================================

DETERMINISM_ALERTS: List[AlertRule] = [
    {
        "name": "DeterminismViolations",
        "condition": "rate(determinism_violations_total[5m]) > 0",
        "severity": "critical",
        "message": "Determinism violations detected",
        "description": (
            "Workflows are not producing reproducible outputs. This violates "
            "a core AMCS principle. This may indicate:\n"
            "- Seed not being set correctly\n"
            "- Non-deterministic operations in skills\n"
            "- LLM API not respecting seed parameter\n"
            "- External data sources changing\n"
            "\nRemediation:\n"
            "1. Review determinism violation logs\n"
            "2. Check seed propagation through workflow\n"
            "3. Verify LLM API determinism configuration\n"
            "4. Audit skills for non-deterministic operations"
        ),
        "duration": "1m",
    },
]

# =============================================================================
# System Health Alerts
# =============================================================================

SYSTEM_ALERTS: List[AlertRule] = [
    {
        "name": "DatabaseConnectionFailures",
        "condition": "up{job='postgres'} == 0",
        "severity": "critical",
        "message": "Database is unreachable",
        "description": (
            "Cannot connect to PostgreSQL database. All workflow operations "
            "will fail.\n"
            "\nRemediation:\n"
            "1. Check database service status\n"
            "2. Verify network connectivity\n"
            "3. Check credentials and connection settings\n"
            "4. Review database logs"
        ),
        "duration": "1m",
    },
    {
        "name": "HighEventPublishFailures",
        "condition": "rate(event_publish_errors_total[5m]) > 5",
        "severity": "warning",
        "message": "WebSocket event publishing failing",
        "description": (
            "Events are not being published to WebSocket clients. This affects "
            "real-time monitoring but not workflow execution.\n"
            "\nRemediation:\n"
            "1. Check WebSocket server status\n"
            "2. Review event publisher logs\n"
            "3. Check Redis connection if used for pub/sub\n"
            "4. Verify WebSocket client connections"
        ),
        "duration": "5m",
    },
]

# =============================================================================
# Combined Alert Registry
# =============================================================================

ALL_ALERTS: List[AlertRule] = [
    *WORKFLOW_ALERTS,
    *SKILL_ALERTS,
    *QUALITY_ALERTS,
    *DETERMINISM_ALERTS,
    *SYSTEM_ALERTS,
]


def get_alert_by_name(name: str) -> AlertRule | None:
    """Get alert rule by name.

    Args:
        name: Alert rule name

    Returns:
        Alert rule definition or None if not found
    """
    for alert in ALL_ALERTS:
        if alert["name"] == name:
            return alert
    return None


def get_alerts_by_severity(severity: str) -> List[AlertRule]:
    """Get all alerts of a given severity level.

    Args:
        severity: Severity level (critical, warning, info)

    Returns:
        List of alert rules matching severity
    """
    return [alert for alert in ALL_ALERTS if alert["severity"] == severity]


def export_prometheus_rules() -> str:
    """Export alert rules in Prometheus YAML format.

    Returns:
        YAML string with Prometheus Alertmanager rules
    """
    lines = ["groups:"]
    lines.append("  - name: amcs_workflow_alerts")
    lines.append("    rules:")

    for alert in ALL_ALERTS:
        lines.append(f"      - alert: {alert['name']}")
        lines.append(f"        expr: {alert['condition']}")
        lines.append(f"        for: {alert['duration']}")
        lines.append("        labels:")
        lines.append(f"          severity: {alert['severity']}")
        lines.append("        annotations:")
        lines.append(f"          summary: {alert['message']}")
        lines.append(f"          description: |\n            {alert['description']}")
        lines.append("")

    return "\n".join(lines)


# =============================================================================
# Alert Evaluation (Future)
# =============================================================================


def evaluate_alert_conditions(metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Evaluate alert conditions against current metrics.

    This is a placeholder for future in-app alert evaluation.
    For production, use Prometheus Alertmanager instead.

    Args:
        metrics: Current metric values

    Returns:
        List of triggered alerts with context
    """
    # Placeholder - implement condition evaluation logic
    # For MVP, alerts should be handled by Prometheus Alertmanager
    return []
