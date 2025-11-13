"""Workflow-specific structured logging.

This module provides the WorkflowLogger class for contextual logging
throughout workflow execution with run_id, node_name, and other metadata.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

import structlog


class WorkflowLogger:
    """Contextual logger for workflow execution.

    Automatically includes run_id, song_id, and other contextual
    information in all log messages. Supports structured logging
    with JSON output for log aggregation systems.

    Example:
        ```python
        logger = WorkflowLogger(run_id=run_id, song_id=song_id)
        logger.log_skill_start("PLAN", {"sds": {...}})
        # ... skill execution ...
        logger.log_skill_complete("PLAN", {"plan": {...}}, 1234)
        ```
    """

    def __init__(
        self,
        run_id: UUID,
        song_id: Optional[UUID] = None,
        user_id: Optional[str] = None,
    ):
        """Initialize workflow logger with context.

        Args:
            run_id: Workflow run identifier
            song_id: Optional song identifier
            user_id: Optional user identifier
        """
        self.run_id = run_id
        self.song_id = song_id
        self.user_id = user_id

        # Create a bound logger with context
        self.logger = structlog.get_logger(f"workflow.{run_id}")
        self.logger = self.logger.bind(
            run_id=str(run_id),
            song_id=str(song_id) if song_id else None,
            user_id=user_id,
        )

    def _add_timestamp(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Add ISO8601 timestamp to log data.

        Args:
            data: Log data dictionary

        Returns:
            Updated dictionary with timestamp
        """
        data["timestamp"] = datetime.now(timezone.utc).isoformat()
        return data

    def log_workflow_start(
        self,
        seed: int,
        genre: Optional[str] = None,
        manifest: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log workflow execution start.

        Args:
            seed: Global workflow seed
            genre: Optional genre tag
            manifest: Optional workflow manifest
        """
        data = self._add_timestamp(
            {
                "seed": seed,
                "genre": genre,
                "graph_nodes": len(manifest.get("graph", [])) if manifest else 0,
            }
        )
        self.logger.info("workflow_start", **data)

    def log_workflow_complete(
        self,
        duration_ms: int,
        status: str,
        fix_iterations: int = 0,
        validation_scores: Optional[Dict[str, float]] = None,
    ) -> None:
        """Log workflow execution completion.

        Args:
            duration_ms: Total execution time in milliseconds
            status: Final status (completed, failed)
            fix_iterations: Number of fix loop iterations
            validation_scores: Final validation scores
        """
        self.logger.info(
            "workflow_complete",
            **self._add_timestamp(
                {
                    "status": status,
                    "duration_ms": duration_ms,
                    "fix_iterations": fix_iterations,
                    "validation_scores": validation_scores or {},
                }
            ),
        )

    def log_workflow_error(
        self,
        error: Exception,
        current_node: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log workflow execution error.

        Args:
            error: Exception that occurred
            current_node: Node where error occurred
            context: Additional error context
        """
        self.logger.error(
            "workflow_error",
            **self._add_timestamp(
                {
                    "error_type": type(error).__name__,
                    "error_message": str(error),
                    "current_node": current_node,
                    "context": context or {},
                }
            ),
        )

    def log_skill_start(
        self,
        skill_name: str,
        node_name: str,
        inputs_hash: str,
        seed: int,
        node_index: int,
    ) -> None:
        """Log skill execution start.

        Args:
            skill_name: Full skill name (e.g., "amcs.plan.generate")
            node_name: Node name (PLAN, STYLE, etc.)
            inputs_hash: SHA256 hash of inputs
            seed: Node-specific seed
            node_index: Sequential node index
        """
        self.logger.info(
            "skill_start",
            **self._add_timestamp(
                {
                    "skill_name": skill_name,
                    "node_name": node_name,
                    "inputs_hash": inputs_hash,
                    "seed": seed,
                    "node_index": node_index,
                }
            ),
        )

    def log_skill_complete(
        self,
        skill_name: str,
        node_name: str,
        outputs_hash: str,
        duration_ms: int,
        model_params: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log skill execution completion.

        Args:
            skill_name: Full skill name
            node_name: Node name
            outputs_hash: SHA256 hash of outputs
            duration_ms: Execution time in milliseconds
            model_params: Optional LLM model parameters used
        """
        self.logger.info(
            "skill_complete",
            **self._add_timestamp(
                {
                    "skill_name": skill_name,
                    "node_name": node_name,
                    "outputs_hash": outputs_hash,
                    "duration_ms": duration_ms,
                    "model_params": model_params or {},
                }
            ),
        )

    def log_skill_error(
        self,
        skill_name: str,
        node_name: str,
        error: Exception,
        duration_ms: int,
        error_type: str = "execution",
    ) -> None:
        """Log skill execution error.

        Args:
            skill_name: Full skill name
            node_name: Node name
            error: Exception that occurred
            duration_ms: Execution time before failure
            error_type: Type of error (execution, validation, etc.)
        """
        self.logger.error(
            "skill_error",
            **self._add_timestamp(
                {
                    "skill_name": skill_name,
                    "node_name": node_name,
                    "error_type": error_type,
                    "error_class": type(error).__name__,
                    "error_message": str(error),
                    "duration_ms": duration_ms,
                }
            ),
        )

    def log_llm_call(
        self,
        skill_name: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        duration_ms: int,
        success: bool = True,
    ) -> None:
        """Log LLM API call.

        Args:
            skill_name: Skill making the call
            model: LLM model name
            input_tokens: Input token count
            output_tokens: Output token count
            duration_ms: API call duration
            success: Whether call succeeded
        """
        self.logger.info(
            "llm_call",
            **self._add_timestamp(
                {
                    "skill_name": skill_name,
                    "model": model,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens,
                    "duration_ms": duration_ms,
                    "success": success,
                }
            ),
        )

    def log_validation_start(
        self,
        artifacts: list[str],
        blueprint: Optional[str] = None,
    ) -> None:
        """Log validation phase start.

        Args:
            artifacts: List of artifacts being validated
            blueprint: Optional blueprint name
        """
        self.logger.info(
            "validation_start",
            **self._add_timestamp(
                {
                    "artifacts": artifacts,
                    "blueprint": blueprint,
                }
            ),
        )

    def log_validation_complete(
        self,
        passed: bool,
        scores: Dict[str, float],
        issues: list[Dict[str, Any]],
        duration_ms: int,
    ) -> None:
        """Log validation phase completion.

        Args:
            passed: Whether validation passed
            scores: Dictionary of metric scores
            issues: List of validation issues found
            duration_ms: Validation duration
        """
        self.logger.info(
            "validation_complete",
            **self._add_timestamp(
                {
                    "passed": passed,
                    "scores": scores,
                    "issues_count": len(issues),
                    "issues": issues[:5],  # Limit to first 5
                    "duration_ms": duration_ms,
                }
            ),
        )

    def log_fix_iteration(
        self,
        iteration: int,
        max_iterations: int,
        issues_addressed: list[str],
    ) -> None:
        """Log fix loop iteration.

        Args:
            iteration: Current iteration number (1-based)
            max_iterations: Maximum allowed iterations
            issues_addressed: List of issue types being fixed
        """
        self.logger.info(
            "fix_iteration",
            **self._add_timestamp(
                {
                    "iteration": iteration,
                    "max_iterations": max_iterations,
                    "issues_addressed": issues_addressed,
                }
            ),
        )

    def log_artifact_saved(
        self,
        artifact_type: str,
        artifact_hash: str,
        size_bytes: int,
        storage_path: Optional[str] = None,
    ) -> None:
        """Log artifact persistence.

        Args:
            artifact_type: Type of artifact (lyrics, style, etc.)
            artifact_hash: SHA256 hash of artifact
            size_bytes: Artifact size in bytes
            storage_path: Optional storage path
        """
        self.logger.info(
            "artifact_saved",
            **self._add_timestamp(
                {
                    "artifact_type": artifact_type,
                    "artifact_hash": artifact_hash,
                    "size_bytes": size_bytes,
                    "storage_path": storage_path,
                }
            ),
        )

    def log_event_published(
        self,
        event_type: str,
        node_name: str,
        phase: str,
        success: bool = True,
    ) -> None:
        """Log WebSocket event publication.

        Args:
            event_type: Type of event
            node_name: Node that triggered event
            phase: Event phase (start, end, fail)
            success: Whether publication succeeded
        """
        self.logger.debug(
            "event_published",
            **self._add_timestamp(
                {
                    "event_type": event_type,
                    "node_name": node_name,
                    "phase": phase,
                    "success": success,
                }
            ),
        )

    def log_determinism_check(
        self,
        expected_hash: str,
        actual_hash: str,
        passed: bool,
    ) -> None:
        """Log determinism validation check.

        Args:
            expected_hash: Expected output hash
            actual_hash: Actual output hash
            passed: Whether hashes matched
        """
        level = "info" if passed else "warning"
        log_method = getattr(self.logger, level)
        log_method(
            "determinism_check",
            **self._add_timestamp(
                {
                    "expected_hash": expected_hash,
                    "actual_hash": actual_hash,
                    "passed": passed,
                }
            ),
        )
