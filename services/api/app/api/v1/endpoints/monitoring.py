"""Monitoring endpoints for workflow observability.

Provides endpoints for monitoring dashboards and health checks:
- /metrics - Prometheus metrics snapshot (JSON format)
- /active-runs - Currently executing workflows
- /recent-runs - Recently completed workflow runs
- /health - System health check
- /stats - Aggregated statistics
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from prometheus_client import REGISTRY
from prometheus_client.parser import text_string_to_metric_families
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_legacy as get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.workflow_run_repo import WorkflowRunRepository
from app.repositories.node_execution_repo import NodeExecutionRepository
from app.observability import metrics

router = APIRouter()


@router.get("/metrics")
async def get_metrics_snapshot(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get current Prometheus metrics snapshot in JSON format.

    Returns a JSON representation of all workflow metrics for
    monitoring dashboards. This is NOT the Prometheus scrape endpoint
    (that's handled by prometheus_client's /metrics).

    Returns:
        Dictionary with current metric values:
        {
            "workflow_runs_total": {"completed": 120, "failed": 5},
            "active_workflows": 3,
            "skill_executions_total": {...},
            ...
        }
    """
    # Collect metrics from Prometheus registry
    metric_snapshot = {}

    for family in REGISTRY.collect():
        family_data = {}
        for sample in family.samples:
            # Parse labels
            labels = sample.labels or {}
            label_str = ",".join(f"{k}={v}" for k, v in labels.items())
            key = f"{sample.name}"
            if label_str:
                key = f"{key}{{{label_str}}}"

            family_data[key] = sample.value

        if family_data:
            metric_snapshot[family.name] = family_data

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metrics": metric_snapshot,
    }


@router.get("/active-runs")
async def get_active_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get currently executing workflow runs.

    Returns:
        List of active workflow runs with current node and progress:
        {
            "active_count": 3,
            "runs": [
                {
                    "run_id": "uuid",
                    "song_id": "uuid",
                    "status": "running",
                    "current_node": "LYRICS",
                    "started_at": "2025-11-12T...",
                    "elapsed_seconds": 15,
                },
                ...
            ]
        }
    """
    workflow_run_repo = WorkflowRunRepository(db)

    # Get runs with status = 'running'
    active_runs = workflow_run_repo.get_by_status("running")

    runs_data = []
    for run in active_runs:
        elapsed = (datetime.now(timezone.utc) - run.created_at).total_seconds()
        runs_data.append(
            {
                "run_id": str(run.run_id),
                "song_id": str(run.song_id),
                "status": run.status,
                "current_node": run.current_node,
                "started_at": run.created_at.isoformat(),
                "elapsed_seconds": int(elapsed),
            }
        )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "active_count": len(runs_data),
        "runs": runs_data,
    }


@router.get("/recent-runs")
async def get_recent_runs(
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = Query(None, regex="^(completed|failed|running)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get recently completed/failed workflow runs.

    Args:
        limit: Maximum number of runs to return (1-200, default 50)
        status_filter: Optional status filter (completed, failed, running)

    Returns:
        List of recent workflow runs:
        {
            "total_count": 50,
            "runs": [
                {
                    "run_id": "uuid",
                    "song_id": "uuid",
                    "status": "completed",
                    "fix_iterations": 1,
                    "validation_scores": {...},
                    "started_at": "...",
                    "completed_at": "...",
                    "duration_seconds": 25,
                },
                ...
            ]
        }
    """
    workflow_run_repo = WorkflowRunRepository(db)

    if status_filter:
        runs = workflow_run_repo.get_by_status(status_filter, limit=limit)
    else:
        # Get all recent runs (ordered by created_at desc)
        runs = db.query(workflow_run_repo.model).order_by(
            workflow_run_repo.model.created_at.desc()
        ).limit(limit).all()

    runs_data = []
    for run in runs:
        duration_seconds = None
        if run.updated_at and run.created_at:
            duration_seconds = int(
                (run.updated_at - run.created_at).total_seconds()
            )

        runs_data.append(
            {
                "run_id": str(run.run_id),
                "song_id": str(run.song_id),
                "status": run.status,
                "fix_iterations": run.fix_iterations or 0,
                "validation_scores": run.validation_scores or {},
                "started_at": run.created_at.isoformat(),
                "completed_at": run.updated_at.isoformat() if run.updated_at else None,
                "duration_seconds": duration_seconds,
                "error": run.error if run.status == "failed" else None,
            }
        )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_count": len(runs_data),
        "status_filter": status_filter,
        "runs": runs_data,
    }


@router.get("/health")
async def health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """System health check for workflow execution.

    Checks:
    - Database connectivity
    - Active workflows count
    - Recent failure rate
    - P95 latency

    Returns:
        Health status and metrics:
        {
            "status": "healthy" | "degraded" | "unhealthy",
            "checks": {
                "database": "ok",
                "active_workflows": 3,
                "recent_failure_rate": 0.02,
                "p95_latency_seconds": 25.3,
            },
            "alerts": [...],
        }
    """
    workflow_run_repo = WorkflowRunRepository(db)

    # Check database connectivity
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception:
        db_status = "error"

    # Get active workflows
    active_count = len(workflow_run_repo.get_by_status("running"))

    # Calculate recent failure rate (last 100 runs)
    recent_runs = db.query(workflow_run_repo.model).order_by(
        workflow_run_repo.model.created_at.desc()
    ).limit(100).all()

    total_recent = len(recent_runs)
    failed_recent = sum(1 for r in recent_runs if r.status == "failed")
    failure_rate = failed_recent / total_recent if total_recent > 0 else 0.0

    # Calculate P95 latency from completed runs
    completed_runs = [r for r in recent_runs if r.status == "completed" and r.updated_at]
    if completed_runs:
        durations = [
            (r.updated_at - r.created_at).total_seconds()
            for r in completed_runs
        ]
        durations.sort()
        p95_index = int(len(durations) * 0.95)
        p95_latency = durations[p95_index] if p95_index < len(durations) else 0.0
    else:
        p95_latency = 0.0

    # Determine overall health status
    alerts = []
    if db_status != "ok":
        alerts.append("Database connectivity issues")
    if failure_rate > 0.1:
        alerts.append(f"High failure rate: {failure_rate:.1%}")
    if p95_latency > 60:
        alerts.append(f"P95 latency exceeds 60s: {p95_latency:.1f}s")
    if active_count > 10:
        alerts.append(f"High number of active workflows: {active_count}")

    if db_status != "ok":
        status = "unhealthy"
    elif alerts:
        status = "degraded"
    else:
        status = "healthy"

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "checks": {
            "database": db_status,
            "active_workflows": active_count,
            "recent_failure_rate": round(failure_rate, 4),
            "p95_latency_seconds": round(p95_latency, 2),
        },
        "alerts": alerts,
    }


@router.get("/stats")
async def get_stats(
    time_window: int = Query(24, ge=1, le=168, description="Time window in hours"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get aggregated workflow statistics.

    Args:
        time_window: Time window in hours (1-168, default 24)

    Returns:
        Aggregated statistics:
        {
            "time_window_hours": 24,
            "total_runs": 120,
            "completed_runs": 115,
            "failed_runs": 5,
            "success_rate": 0.958,
            "avg_duration_seconds": 25.3,
            "avg_fix_iterations": 0.8,
            "common_failures": [
                {"type": "hook_density_low", "count": 3},
                {"type": "profanity_detected", "count": 2},
            ],
            "node_performance": {
                "PLAN": {"avg_duration_ms": 2500, "executions": 120},
                "STYLE": {"avg_duration_ms": 3200, "executions": 120},
                ...
            }
        }
    """
    workflow_run_repo = WorkflowRunRepository(db)
    node_execution_repo = NodeExecutionRepository(db)

    # Calculate time window
    since = datetime.now(timezone.utc) - timedelta(hours=time_window)

    # Get runs in time window
    runs = db.query(workflow_run_repo.model).filter(
        workflow_run_repo.model.created_at >= since
    ).all()

    total_runs = len(runs)
    completed_runs = sum(1 for r in runs if r.status == "completed")
    failed_runs = sum(1 for r in runs if r.status == "failed")
    success_rate = completed_runs / total_runs if total_runs > 0 else 0.0

    # Calculate average duration (completed runs only)
    completed_with_duration = [
        r for r in runs if r.status == "completed" and r.updated_at
    ]
    if completed_with_duration:
        avg_duration = sum(
            (r.updated_at - r.created_at).total_seconds()
            for r in completed_with_duration
        ) / len(completed_with_duration)
    else:
        avg_duration = 0.0

    # Calculate average fix iterations
    if completed_runs > 0:
        avg_fix_iterations = sum(
            r.fix_iterations or 0 for r in runs if r.status == "completed"
        ) / completed_runs
    else:
        avg_fix_iterations = 0.0

    # Analyze common failures
    failure_types: Dict[str, int] = {}
    for run in runs:
        if run.status == "failed" and run.error:
            error_type = run.error.get("type", "unknown") if isinstance(run.error, dict) else "unknown"
            failure_types[error_type] = failure_types.get(error_type, 0) + 1

    common_failures = [
        {"type": failure_type, "count": count}
        for failure_type, count in sorted(
            failure_types.items(), key=lambda x: x[1], reverse=True
        )[:5]
    ]

    # Get node performance statistics
    run_ids = [r.run_id for r in runs]
    if run_ids:
        node_executions = db.query(node_execution_repo.model).filter(
            node_execution_repo.model.run_id.in_(run_ids)
        ).all()

        node_stats: Dict[str, Dict[str, Any]] = {}
        for execution in node_executions:
            node_name = execution.node_name
            if node_name not in node_stats:
                node_stats[node_name] = {"durations": [], "executions": 0}

            node_stats[node_name]["executions"] += 1
            if execution.duration_ms:
                node_stats[node_name]["durations"].append(execution.duration_ms)

        # Calculate averages
        node_performance = {}
        for node_name, stats in node_stats.items():
            avg_duration_ms = (
                sum(stats["durations"]) / len(stats["durations"])
                if stats["durations"]
                else 0
            )
            node_performance[node_name] = {
                "avg_duration_ms": round(avg_duration_ms, 2),
                "executions": stats["executions"],
            }
    else:
        node_performance = {}

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "time_window_hours": time_window,
        "total_runs": total_runs,
        "completed_runs": completed_runs,
        "failed_runs": failed_runs,
        "success_rate": round(success_rate, 4),
        "avg_duration_seconds": round(avg_duration, 2),
        "avg_fix_iterations": round(avg_fix_iterations, 2),
        "common_failures": common_failures,
        "node_performance": node_performance,
    }
