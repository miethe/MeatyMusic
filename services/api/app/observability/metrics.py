"""Prometheus metrics for AMCS workflow execution.

This module defines workflow-specific metrics for monitoring:
- Workflow execution counts and durations
- Skill-level performance metrics
- Quality scores (rubric metrics)
- Fix loop iterations
- LLM token usage
- Active workflow gauge
"""

from __future__ import annotations

from prometheus_client import Counter, Histogram, Gauge, Info

# =============================================================================
# Workflow Execution Metrics
# =============================================================================

workflow_runs_total = Counter(
    "workflow_runs_total",
    "Total number of workflow runs started",
    ["status"],  # completed, failed
)

workflow_duration_seconds = Histogram(
    "workflow_duration_seconds",
    "Workflow execution duration in seconds",
    ["genre"],
    buckets=[10, 20, 30, 45, 60, 90, 120, 180, 300],  # P95 target is 60s
)

active_workflows = Gauge(
    "active_workflows",
    "Number of currently executing workflows",
)

workflow_info = Info(
    "workflow_info",
    "Information about workflow configuration",
)

# =============================================================================
# Skill Execution Metrics
# =============================================================================

skill_executions_total = Counter(
    "skill_executions_total",
    "Total number of skill executions",
    ["skill_name", "status"],  # completed, failed, validation_error
)

skill_duration_seconds = Histogram(
    "skill_duration_seconds",
    "Skill execution duration in seconds",
    ["skill_name"],
    buckets=[0.5, 1, 2, 5, 10, 15, 20, 30, 60],
)

skill_llm_tokens_total = Counter(
    "skill_llm_tokens_total",
    "Total LLM tokens consumed by skills",
    ["skill_name", "model", "token_type"],  # token_type: input, output
)

skill_llm_calls_total = Counter(
    "skill_llm_calls_total",
    "Total LLM API calls made by skills",
    ["skill_name", "model", "status"],  # status: success, error
)

# =============================================================================
# Validation & Quality Metrics
# =============================================================================

rubric_scores = Histogram(
    "rubric_scores",
    "Rubric validation scores (0.0 - 1.0)",
    ["metric_name"],  # hook_density, singability, rhyme_tightness, etc.
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0],
)

fix_iterations = Histogram(
    "fix_iterations",
    "Number of fix loop iterations per workflow run",
    buckets=[0, 1, 2, 3, 4, 5],
)

validation_failures_total = Counter(
    "validation_failures_total",
    "Total validation failures by type",
    ["failure_type"],  # hook_density_low, profanity_detected, etc.
)

# =============================================================================
# Artifact Metrics
# =============================================================================

artifact_size_bytes = Histogram(
    "artifact_size_bytes",
    "Size of generated artifacts in bytes",
    ["artifact_type"],  # lyrics, style, producer_notes, composed_prompt
    buckets=[100, 500, 1000, 2000, 5000, 10000, 20000],
)

artifact_hash_collisions_total = Counter(
    "artifact_hash_collisions_total",
    "Hash collisions detected in artifact deduplication",
    ["artifact_type"],
)

# =============================================================================
# Determinism Metrics
# =============================================================================

determinism_violations_total = Counter(
    "determinism_violations_total",
    "Reproducibility violations detected",
    ["violation_type"],  # output_hash_mismatch, seed_not_set, etc.
)

# =============================================================================
# Event Stream Metrics
# =============================================================================

event_publish_total = Counter(
    "event_publish_total",
    "Total workflow events published",
    ["event_type"],  # start, end, fail, progress
)

event_publish_errors_total = Counter(
    "event_publish_errors_total",
    "Failed event publish attempts",
    ["error_type"],
)

websocket_connections = Gauge(
    "websocket_connections",
    "Active WebSocket connections for workflow events",
)

# =============================================================================
# Database & Storage Metrics
# =============================================================================

artifact_storage_operations_total = Counter(
    "artifact_storage_operations_total",
    "Artifact storage operations",
    ["operation", "status"],  # operation: save, load, delete
)

artifact_cache_hits_total = Counter(
    "artifact_cache_hits_total",
    "Artifact cache hits",
    ["artifact_type"],
)

artifact_cache_misses_total = Counter(
    "artifact_cache_misses_total",
    "Artifact cache misses",
    ["artifact_type"],
)

# =============================================================================
# Helper Functions
# =============================================================================


def record_workflow_start(genre: str | None = None) -> None:
    """Record the start of a workflow execution.

    Args:
        genre: Optional genre for categorization
    """
    active_workflows.inc()


def record_workflow_complete(
    duration_seconds: float, genre: str | None = None, success: bool = True
) -> None:
    """Record completion of a workflow execution.

    Args:
        duration_seconds: Total execution time
        genre: Optional genre for categorization
        success: Whether workflow completed successfully
    """
    active_workflows.dec()
    workflow_runs_total.labels(status="completed" if success else "failed").inc()
    if genre:
        workflow_duration_seconds.labels(genre=genre).observe(duration_seconds)
    else:
        workflow_duration_seconds.labels(genre="unknown").observe(duration_seconds)


def record_skill_execution(
    skill_name: str,
    duration_seconds: float,
    status: str = "completed",
) -> None:
    """Record a skill execution.

    Args:
        skill_name: Name of the skill (e.g., "amcs.plan.generate")
        duration_seconds: Execution time
        status: Execution status (completed, failed, validation_error)
    """
    skill_executions_total.labels(skill_name=skill_name, status=status).inc()
    skill_duration_seconds.labels(skill_name=skill_name).observe(duration_seconds)


def record_llm_usage(
    skill_name: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    success: bool = True,
) -> None:
    """Record LLM token usage.

    Args:
        skill_name: Name of the skill
        model: LLM model used (e.g., "claude-sonnet-4-5")
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        success: Whether the LLM call succeeded
    """
    skill_llm_tokens_total.labels(
        skill_name=skill_name, model=model, token_type="input"
    ).inc(input_tokens)
    skill_llm_tokens_total.labels(
        skill_name=skill_name, model=model, token_type="output"
    ).inc(output_tokens)
    skill_llm_calls_total.labels(
        skill_name=skill_name, model=model, status="success" if success else "error"
    ).inc()


def record_validation_scores(scores: dict[str, float]) -> None:
    """Record rubric validation scores.

    Args:
        scores: Dictionary of metric names to scores (0.0 - 1.0)
    """
    for metric_name, score in scores.items():
        rubric_scores.labels(metric_name=metric_name).observe(score)


def record_fix_iterations(iterations: int) -> None:
    """Record the number of fix loop iterations.

    Args:
        iterations: Number of fix iterations (0-3)
    """
    fix_iterations.observe(iterations)


def record_validation_failure(failure_type: str) -> None:
    """Record a validation failure.

    Args:
        failure_type: Type of validation failure
    """
    validation_failures_total.labels(failure_type=failure_type).inc()


def record_artifact_size(artifact_type: str, size_bytes: int) -> None:
    """Record artifact size.

    Args:
        artifact_type: Type of artifact (lyrics, style, etc.)
        size_bytes: Size in bytes
    """
    artifact_size_bytes.labels(artifact_type=artifact_type).observe(size_bytes)
