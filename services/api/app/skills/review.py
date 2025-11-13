"""REVIEW workflow skill - Finalize run and collect artifacts.

Final workflow node that collects all generated artifacts, computes metrics,
persists results to storage, and emits completion event.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from opentelemetry import trace

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


def compute_sha256(content: str) -> str:
    """Compute SHA-256 hash of content.

    Args:
        content: String content to hash

    Returns:
        Hex-encoded SHA-256 hash
    """
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def compute_artifact_hash(artifact: dict[str, Any]) -> str:
    """Compute deterministic hash of artifact.

    Args:
        artifact: Artifact dictionary

    Returns:
        SHA-256 hash of sorted JSON representation
    """
    content = json.dumps(artifact, sort_keys=True, ensure_ascii=False)
    return compute_sha256(content)


def summarize_citations(citations: list[dict[str, Any]]) -> dict[str, Any]:
    """Summarize citation information.

    Args:
        citations: List of citation objects

    Returns:
        Citation summary with counts and unique sources
    """
    unique_sources = set()

    for citation in citations:
        source_id = citation.get("source_id")
        if source_id:
            unique_sources.add(source_id)

    return {
        "total_count": len(citations),
        "source_count": len(unique_sources),
        "unique_sources": sorted(unique_sources),
    }


def compute_artifact_size(artifacts: dict[str, Any]) -> int:
    """Compute total size of all artifacts in bytes.

    Args:
        artifacts: Dictionary of artifacts

    Returns:
        Total size in bytes
    """
    total_size = 0

    for artifact in artifacts.values():
        if artifact is not None:
            json_str = json.dumps(artifact, ensure_ascii=False)
            total_size += len(json_str.encode("utf-8"))

    return total_size


def count_remaining_issues(issues: list[dict[str, Any]]) -> int:
    """Count unresolved warning/error issues.

    Args:
        issues: List of issue objects

    Returns:
        Count of issues with severity "warning" or "error"
    """
    return len([
        issue for issue in issues
        if issue.get("severity") in ("warning", "error")
    ])


def determine_status(
    artifacts: dict[str, Any],
    issues: list[dict[str, Any]],
    render_result: dict[str, Any] | None,
) -> str:
    """Determine final workflow status.

    Args:
        artifacts: Generated artifacts
        issues: List of issues
        render_result: Render job result (if applicable)

    Returns:
        "completed" or "completed_with_warnings"
    """
    # Check for missing critical artifacts
    critical_artifacts = ["style", "lyrics", "composed_prompt"]
    missing = [name for name in critical_artifacts if not artifacts.get(name)]

    if missing:
        return "completed_with_warnings"

    # Check for unresolved issues
    if count_remaining_issues(issues) > 0:
        return "completed_with_warnings"

    # Check render status (if render was attempted)
    if render_result is not None:
        status = render_result.get("status", "")
        if status in ("failed", "queued"):
            return "completed_with_warnings"

    return "completed"


async def finalize_run(
    artifacts: dict[str, Any],
    scores: dict[str, Any],
    citations: list[dict[str, Any]],
    render_result: dict[str, Any] | None,
    seed: int,
    issues: list[dict[str, Any]] | None = None,
    run_id: str | UUID | None = None,
    song_id: str | UUID | None = None,
    start_time: datetime | None = None,
) -> dict[str, Any]:
    """Finalize workflow run and collect all artifacts.

    Args:
        artifacts: All generated artifacts (plan, style, lyrics, producer_notes, composed_prompt)
        scores: Validation scores and total score
        citations: List of source citations
        render_result: Render job information (if render was enabled)
        seed: Workflow seed
        issues: Optional list of remaining issues
        run_id: Optional workflow run identifier
        song_id: Optional song identifier
        start_time: Optional workflow start time

    Returns:
        Final summary with:
            - status: "completed" or "completed_with_warnings"
            - summary: Artifact hashes, scores, metrics
            - issues: Remaining issues
            - storage: Storage URIs

    Raises:
        Exception: Critical failures during review (logged but not failed)
    """
    with tracer.start_as_current_span("review.finalize") as span:
        if run_id:
            span.set_attribute("run_id", str(run_id))

        review_start_time = datetime.now(timezone.utc)

        try:
            # Compute artifact hashes
            with tracer.start_as_current_span("review.compute_hashes"):
                artifact_hashes = {}
                for name, artifact in artifacts.items():
                    if artifact is not None:
                        artifact_hashes[name] = compute_artifact_hash(artifact)
                    else:
                        artifact_hashes[name] = None

                logger.info(
                    "Computed artifact hashes",
                    extra={
                        "run_id": str(run_id) if run_id else None,
                        "artifact_count": len([h for h in artifact_hashes.values() if h]),
                        "hashes": artifact_hashes,
                    },
                )

            # Calculate metrics
            end_time = datetime.now(timezone.utc)
            review_duration_ms = (end_time - review_start_time).total_seconds() * 1000

            # Calculate total workflow duration
            if start_time:
                total_duration_ms = (end_time - start_time).total_seconds() * 1000
            else:
                total_duration_ms = review_duration_ms

            artifact_size = compute_artifact_size(artifacts)

            # Process issues
            if issues is None:
                issues = []
            issues_remaining = count_remaining_issues(issues)

            # Summarize citations
            citation_summary = summarize_citations(citations)

            # Determine final status
            status = determine_status(artifacts, issues, render_result)

            span.set_attribute("status", status)
            span.set_attribute("artifact_count", len(artifact_hashes))
            span.set_attribute("issues_remaining", issues_remaining)
            span.set_attribute("duration_ms", total_duration_ms)

            # Build summary
            summary = {
                "artifacts": artifact_hashes,
                "scores": scores,
                "citations": citation_summary,
                "metrics": {
                    "duration_ms": int(total_duration_ms),
                    "total_artifact_size": artifact_size,
                    "issues_remaining": issues_remaining,
                },
            }

            if render_result is not None:
                summary["render"] = render_result

            # Storage paths
            storage_path = f"/runs/{song_id}/{run_id}/" if song_id and run_id else f"/runs/{run_id}/"

            logger.info(
                "Workflow completed successfully",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "song_id": str(song_id) if song_id else None,
                    "status": status,
                    "duration_ms": total_duration_ms,
                    "artifact_count": len(artifact_hashes),
                    "issues_remaining": issues_remaining,
                },
            )

            # Return final summary
            return {
                "status": status,
                "summary": summary,
                "issues": issues,
                "storage": {
                    "artifacts_uri": f"{storage_path}artifacts.json",
                    "run_uri": f"/runs/{run_id}" if run_id else None,
                },
            }

        except Exception as e:
            logger.error(
                "Review failed with critical error",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "song_id": str(song_id) if song_id else None,
                    "error": str(e),
                },
                exc_info=True,
            )

            # Return minimal summary with error
            return {
                "status": "failed",
                "summary": {
                    "artifacts": {},
                    "scores": scores,
                    "citations": {"total_count": len(citations), "source_count": 0, "unique_sources": []},
                    "metrics": {
                        "duration_ms": 0,
                        "total_artifact_size": 0,
                        "issues_remaining": 1,
                    },
                },
                "issues": [
                    {
                        "severity": "error",
                        "phase": "review",
                        "message": f"Review failed: {str(e)}",
                    }
                ],
                "storage": {
                    "artifacts_uri": None,
                    "run_uri": f"/runs/{run_id}" if run_id else None,
                },
            }
