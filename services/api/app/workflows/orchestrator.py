"""Workflow orchestrator for executing AMCS workflow graphs.

This module implements the core DAG execution engine that coordinates
workflow nodes (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER → REVIEW)
with determinism, parallelization, and error handling.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from uuid import UUID, uuid4

import structlog
from opentelemetry import trace
from sqlalchemy.orm import Session

from app.models.workflow import NodeExecution
from app.repositories.node_execution_repo import NodeExecutionRepository
from app.repositories.workflow_run_repo import WorkflowRunRepository
from app.workflows.events import EventPublisher
from app.workflows.skill import WorkflowContext
from app.observability import metrics
from app.observability.workflow_logger import WorkflowLogger

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)


class WorkflowOrchestrationError(Exception):
    """Raised when workflow orchestration encounters a fatal error."""

    pass


class WorkflowOrchestrator:
    """Orchestrator for executing workflow graphs with determinism and parallelization.

    Implements the AMCS workflow DAG execution with:
    - Seed propagation (node_seed = run_seed + node_index)
    - Parallel execution of independent nodes (STYLE + LYRICS + PRODUCER)
    - Fix loop with max iterations (≤3)
    - Event publishing for observability
    - Error handling and recovery

    The orchestrator follows the workflow graph defined in the run manifest
    and executes skills in dependency order.
    """

    def __init__(
        self,
        db_session: Session,
        event_publisher: EventPublisher,
        workflow_run_repo: WorkflowRunRepository,
        node_execution_repo: NodeExecutionRepository,
    ):
        """Initialize the workflow orchestrator.

        Args:
            db_session: Database session for persistence
            event_publisher: Event publisher for WebSocket streaming
            workflow_run_repo: Repository for workflow run access
            node_execution_repo: Repository for node execution tracking
        """
        self.db = db_session
        self.event_publisher = event_publisher
        self.workflow_run_repo = workflow_run_repo
        self.node_execution_repo = node_execution_repo

        # Skill registry: maps node names to skill functions
        self._skills: Dict[str, Callable] = {}

    def register_skill(self, node_name: str, skill_func: Callable) -> None:
        """Register a skill function for a workflow node.

        Args:
            node_name: Node name (PLAN, STYLE, LYRICS, etc.)
            skill_func: Async function decorated with @workflow_skill
        """
        self._skills[node_name] = skill_func
        logger.info("skill.registered", node_name=node_name)

    async def execute_run(self, run_id: UUID) -> Dict[str, Any]:
        """Execute a complete workflow run.

        This is the main entry point for workflow execution. It loads the
        run manifest, executes nodes in dependency order, handles the
        fix loop, and returns final outputs.

        Args:
            run_id: Workflow run identifier

        Returns:
            Dictionary with final outputs and metadata:
            {
                "status": "completed" | "failed",
                "outputs": {...},
                "validation_scores": {...},
                "fix_iterations": int,
                "duration_ms": int,
            }

        Raises:
            WorkflowOrchestrationError: If run not found or execution fails
        """
        start_time = datetime.now(timezone.utc)

        with tracer.start_as_current_span("workflow.execute_run") as span:
            span.set_attribute("run.run_id", str(run_id))

            logger.info("workflow.run.start", run_id=str(run_id))

            # Record workflow start in metrics
            metrics.record_workflow_start()

            # Load workflow run
            run = self.workflow_run_repo.get_by_run_id(run_id)
            if not run:
                raise WorkflowOrchestrationError(f"Workflow run {run_id} not found")

            span.set_attribute("run.song_id", str(run.song_id))
            span.set_attribute("run.seed", run.extra_metadata.get("seed", 0))

            # Initialize workflow logger
            workflow_logger = WorkflowLogger(run_id=run_id, song_id=run.song_id)

            # Update run status to running
            run.status = "running"
            run.current_node = "PLAN"
            self.db.commit()

            try:
                # Parse manifest
                manifest = run.extra_metadata.get("manifest", {})
                global_seed = run.extra_metadata.get("seed", 42)
                graph = manifest.get("graph", [])
                genre = manifest.get("genre")

                logger.info(
                    "workflow.manifest.loaded",
                    run_id=str(run_id),
                    graph_nodes=len(graph),
                    seed=global_seed,
                )

                # Log workflow start with context
                workflow_logger.log_workflow_start(
                    seed=global_seed,
                    genre=genre,
                    manifest=manifest,
                )

                # Execute workflow graph
                outputs = {}
                fix_iterations = 0

                for node_spec in graph:
                    node_id = node_spec["id"]

                    # Check if this is a conditional node
                    if "cond" in node_spec:
                        # Evaluate condition (simple implementation for MVP)
                        # Future: Support complex condition evaluation
                        should_execute = self._evaluate_condition(
                            node_spec["cond"], outputs, manifest.get("flags", {})
                        )
                        if not should_execute:
                            logger.info(
                                "workflow.node.skipped",
                                run_id=str(run_id),
                                node=node_id,
                                condition=node_spec["cond"],
                            )
                            continue

                    # Execute node based on type
                    if node_id == "FIX":
                        # FIX loop with max retries
                        max_retries = node_spec.get("max_retries", 3)
                        node_output = await self._execute_fix_loop(
                            run_id=run_id,
                            run=run,
                            global_seed=global_seed,
                            outputs=outputs,
                            max_retries=max_retries,
                        )
                        if node_output:
                            outputs[node_id] = node_output
                            fix_iterations = node_output.get("iterations", 0)

                    elif node_id in ["STYLE", "LYRICS", "PRODUCER"]:
                        # Parallel execution candidate
                        # For MVP, execute sequentially; future: parallel
                        node_output = await self._execute_node(
                            run_id=run_id,
                            run=run,
                            node_spec=node_spec,
                            global_seed=global_seed,
                            outputs=outputs,
                        )
                        outputs[node_id] = node_output

                    else:
                        # Sequential node execution
                        node_output = await self._execute_node(
                            run_id=run_id,
                            run=run,
                            node_spec=node_spec,
                            global_seed=global_seed,
                            outputs=outputs,
                        )
                        outputs[node_id] = node_output

                    # Update current node
                    run.current_node = node_id
                    self.db.commit()

                # Calculate total duration
                end_time = datetime.now(timezone.utc)
                duration_ms = int((end_time - start_time).total_seconds() * 1000)
                duration_seconds = duration_ms / 1000.0

                # Mark run as completed
                run.status = "completed"
                run.fix_iterations = fix_iterations
                run.validation_scores = outputs.get("VALIDATE", {}).get("scores", {})
                self.db.commit()

                logger.info(
                    "workflow.run.completed",
                    run_id=str(run_id),
                    duration_ms=duration_ms,
                    fix_iterations=fix_iterations,
                )

                # Record metrics and log completion
                metrics.record_workflow_complete(
                    duration_seconds=duration_seconds,
                    genre=genre,
                    success=True,
                )
                metrics.record_fix_iterations(fix_iterations)
                metrics.record_validation_scores(run.validation_scores)

                workflow_logger.log_workflow_complete(
                    duration_ms=duration_ms,
                    status="completed",
                    fix_iterations=fix_iterations,
                    validation_scores=run.validation_scores,
                )

                span.set_attribute("run.status", "completed")
                span.set_attribute("run.duration_ms", duration_ms)
                span.set_attribute("run.fix_iterations", fix_iterations)

                return {
                    "status": "completed",
                    "outputs": outputs,
                    "validation_scores": run.validation_scores,
                    "fix_iterations": fix_iterations,
                    "duration_ms": duration_ms,
                }

            except Exception as e:
                # Calculate duration for failed run
                end_time = datetime.now(timezone.utc)
                duration_seconds = (end_time - start_time).total_seconds()

                # Mark run as failed
                run.status = "failed"
                run.error = {
                    "message": str(e),
                    "node": run.current_node,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                self.db.commit()

                logger.error(
                    "workflow.run.failed",
                    run_id=str(run_id),
                    error=str(e),
                    error_type=type(e).__name__,
                    current_node=run.current_node,
                )

                # Record failed workflow metrics
                metrics.record_workflow_complete(
                    duration_seconds=duration_seconds,
                    genre=manifest.get("genre") if "manifest" in locals() else None,
                    success=False,
                )

                # Log workflow error
                if "workflow_logger" in locals():
                    workflow_logger.log_workflow_error(
                        error=e,
                        current_node=run.current_node,
                    )

                span.set_attribute("run.status", "failed")
                span.set_attribute("run.error", str(e))

                raise WorkflowOrchestrationError(
                    f"Workflow run {run_id} failed: {e}"
                ) from e

    async def _execute_node(
        self,
        run_id: UUID,
        run: Any,
        node_spec: Dict[str, Any],
        global_seed: int,
        outputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute a single workflow node.

        Args:
            run_id: Workflow run identifier
            run: WorkflowRun ORM object
            node_spec: Node specification from manifest
            global_seed: Global run seed
            outputs: Dictionary of previous node outputs

        Returns:
            Node output dictionary

        Raises:
            WorkflowOrchestrationError: If node execution fails
        """
        node_id = node_spec["id"]
        node_index = outputs.get("_node_count", 0)
        outputs["_node_count"] = node_index + 1

        # Calculate node seed
        node_seed = global_seed + node_index

        logger.info(
            "workflow.node.start",
            run_id=str(run_id),
            node=node_id,
            node_index=node_index,
            seed=node_seed,
        )

        # Create node execution record
        execution_id = uuid4()
        node_execution = NodeExecution(
            execution_id=execution_id,
            run_id=run_id,
            node_name=node_id,
            node_index=node_index,
            seed=node_seed,
            status="running",
            inputs=self._collect_node_inputs(node_spec, outputs),
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(node_execution)
        self.db.commit()

        try:
            # Get skill function
            skill_func = self._skills.get(node_id)
            if not skill_func:
                raise WorkflowOrchestrationError(
                    f"No skill registered for node: {node_id}"
                )

            # Build context
            context = WorkflowContext(
                run_id=run_id,
                song_id=run.song_id,
                seed=node_seed,
                node_index=node_index,
                node_name=node_id,
                event_publisher=self.event_publisher,
                db_session=self.db,
            )

            # Execute skill
            node_inputs = node_execution.inputs
            node_outputs = await skill_func(node_inputs, context)

            # Update execution record
            node_execution.status = "completed"
            node_execution.outputs = node_outputs
            node_execution.completed_at = datetime.now(timezone.utc)
            node_execution.duration_ms = int(
                (
                    node_execution.completed_at - node_execution.started_at
                ).total_seconds()
                * 1000
            )
            self.db.commit()

            logger.info(
                "workflow.node.completed",
                run_id=str(run_id),
                node=node_id,
                duration_ms=node_execution.duration_ms,
            )

            return node_outputs

        except Exception as e:
            # Update execution record with error
            node_execution.status = "failed"
            node_execution.error = {
                "message": str(e),
                "type": type(e).__name__,
            }
            node_execution.completed_at = datetime.now(timezone.utc)
            node_execution.duration_ms = int(
                (
                    node_execution.completed_at - node_execution.started_at
                ).total_seconds()
                * 1000
            )
            self.db.commit()

            logger.error(
                "workflow.node.failed",
                run_id=str(run_id),
                node=node_id,
                error=str(e),
                error_type=type(e).__name__,
            )

            raise

    async def _execute_fix_loop(
        self,
        run_id: UUID,
        run: Any,
        global_seed: int,
        outputs: Dict[str, Any],
        max_retries: int = 3,
    ) -> Optional[Dict[str, Any]]:
        """Execute the FIX → COMPOSE → VALIDATE loop.

        Args:
            run_id: Workflow run identifier
            run: WorkflowRun ORM object
            global_seed: Global run seed
            outputs: Dictionary of previous node outputs
            max_retries: Maximum fix iterations (default: 3)

        Returns:
            Fix output with iterations count, or None if not needed
        """
        logger.info(
            "workflow.fix_loop.start",
            run_id=str(run_id),
            max_retries=max_retries,
        )

        fix_outputs = None
        iterations = 0

        for i in range(max_retries):
            # Check if validation passed
            validation = outputs.get("VALIDATE", {})
            if validation.get("pass", False):
                logger.info(
                    "workflow.fix_loop.validation_passed",
                    run_id=str(run_id),
                    iterations=iterations,
                )
                break

            iterations += 1
            logger.info(
                "workflow.fix_loop.iteration",
                run_id=str(run_id),
                iteration=iterations,
                max_retries=max_retries,
            )

            # Execute FIX node
            fix_spec = {"id": "FIX"}
            fix_output = await self._execute_node(
                run_id=run_id,
                run=run,
                node_spec=fix_spec,
                global_seed=global_seed,
                outputs=outputs,
            )
            outputs["FIX"] = fix_output

            # Re-execute COMPOSE with fixed artifacts
            compose_spec = {"id": "COMPOSE"}
            compose_output = await self._execute_node(
                run_id=run_id,
                run=run,
                node_spec=compose_spec,
                global_seed=global_seed,
                outputs=outputs,
            )
            outputs["COMPOSE"] = compose_output

            # Re-execute VALIDATE
            validate_spec = {"id": "VALIDATE"}
            validate_output = await self._execute_node(
                run_id=run_id,
                run=run,
                node_spec=validate_spec,
                global_seed=global_seed,
                outputs=outputs,
            )
            outputs["VALIDATE"] = validate_output

            fix_outputs = {
                "iterations": iterations,
                "final_validation": validate_output,
            }

        logger.info(
            "workflow.fix_loop.completed",
            run_id=str(run_id),
            iterations=iterations,
            passed=outputs.get("VALIDATE", {}).get("pass", False),
        )

        return fix_outputs

    def _collect_node_inputs(
        self, node_spec: Dict[str, Any], outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Collect inputs for a node from previous node outputs.

        Args:
            node_spec: Node specification with "inputs" list
            outputs: Dictionary of all previous outputs

        Returns:
            Dictionary of inputs for this node
        """
        node_id = node_spec["id"]
        node_inputs = {}

        # Special handling for VALIDATE node
        if node_id == "VALIDATE":
            # Collect lyrics, style, producer_notes, blueprint, composed_prompt, sds
            if "LYRICS" in outputs:
                node_inputs["lyrics"] = outputs["LYRICS"].get("lyrics", "")
            if "STYLE" in outputs:
                node_inputs["style"] = outputs["STYLE"].get("style", {})
            if "PRODUCER" in outputs:
                node_inputs["producer_notes"] = outputs["PRODUCER"].get(
                    "producer_notes", {}
                )
            if "COMPOSE" in outputs:
                node_inputs["composed_prompt"] = outputs["COMPOSE"].get(
                    "composed_prompt", {}
                )
            if "PLAN" in outputs:
                # Get blueprint and sds from plan outputs if available
                node_inputs["blueprint"] = outputs["PLAN"].get("blueprint", {})
                node_inputs["sds"] = outputs["PLAN"].get("sds", {})
            return node_inputs

        # Special handling for FIX node
        elif node_id == "FIX":
            # Collect issues, scores, lyrics, style, producer_notes, blueprint
            if "VALIDATE" in outputs:
                node_inputs["issues"] = outputs["VALIDATE"].get("issues", [])
                node_inputs["scores"] = outputs["VALIDATE"].get("scores", {})
            if "LYRICS" in outputs:
                node_inputs["lyrics"] = outputs["LYRICS"].get("lyrics", "")
            if "STYLE" in outputs:
                node_inputs["style"] = outputs["STYLE"].get("style", {})
            if "PRODUCER" in outputs:
                node_inputs["producer_notes"] = outputs["PRODUCER"].get(
                    "producer_notes", {}
                )
            if "PLAN" in outputs:
                node_inputs["blueprint"] = outputs["PLAN"].get("blueprint", {})
                node_inputs["sds"] = outputs["PLAN"].get("sds", {})

            # After FIX, update lyrics/style/producer with patched versions
            if "FIX" in outputs:
                fix_output = outputs["FIX"]
                if "patched_lyrics" in fix_output:
                    node_inputs["lyrics"] = fix_output["patched_lyrics"]
                if "patched_style" in fix_output:
                    node_inputs["style"] = fix_output["patched_style"]
                if "patched_producer_notes" in fix_output:
                    node_inputs["producer_notes"] = fix_output["patched_producer_notes"]

            return node_inputs

        # Default behavior: collect from input_nodes list
        input_nodes = node_spec.get("inputs", [])
        for input_node in input_nodes:
            if input_node in outputs:
                node_inputs[input_node] = outputs[input_node]

        return node_inputs

    def _evaluate_condition(
        self, condition: str, outputs: Dict[str, Any], flags: Dict[str, bool]
    ) -> bool:
        """Evaluate a simple condition expression.

        Supports basic expressions like:
        - "pass" - checks if VALIDATE passed
        - "fail" - checks if VALIDATE failed
        - "pass && flags.render" - checks validation passed AND render flag true

        Args:
            condition: Condition expression string
            outputs: Dictionary of node outputs
            flags: Feature flags dictionary

        Returns:
            True if condition evaluates to true, False otherwise
        """
        # Simple implementation for MVP
        if "pass" in condition:
            validation = outputs.get("VALIDATE", {})
            passed = validation.get("pass", False)
            if "&&" in condition and "flags" in condition:
                # Check flag after &&
                flag_expr = condition.split("&&")[1].strip()
                flag_key = flag_expr.replace("flags.", "")
                return passed and flags.get(flag_key, False)
            return passed
        elif "fail" in condition:
            validation = outputs.get("VALIDATE", {})
            return not validation.get("pass", True)

        # Default to true for unknown conditions
        return True
