"""Workflow skill decorator and execution framework.

This module provides the @workflow_skill decorator that wraps skill functions
with common patterns: input/output validation, seed injection, telemetry,
error handling, and determinism enforcement.
"""

from __future__ import annotations

import hashlib
import json
import time
import traceback
from dataclasses import dataclass
from functools import wraps
from typing import Any, Callable, Dict, Optional, TypeVar
from uuid import UUID

import structlog
from opentelemetry import trace
from pydantic import BaseModel, ValidationError

from app.observability import metrics

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)

T = TypeVar("T")


@dataclass
class WorkflowContext:
    """Context passed to every workflow skill execution.

    Provides access to run metadata, seed, event publisher,
    and database session for artifact persistence.

    Attributes:
        run_id: Unique workflow run identifier
        song_id: Song being processed
        seed: Node-specific seed for determinism
        node_index: Sequential node index (0-based)
        node_name: Current node name (PLAN, STYLE, etc.)
        event_publisher: Publisher for workflow events
        db_session: Optional database session for artifact persistence
        security_context: Security context for RLS enforcement
        extra_context: Additional context data
    """

    run_id: UUID
    song_id: UUID
    seed: int
    node_index: int
    node_name: str
    event_publisher: Optional[Any] = None  # EventPublisher - avoid circular import
    db_session: Optional[Any] = None  # Session
    security_context: Optional[Any] = None  # SecurityContext
    extra_context: Optional[Dict[str, Any]] = None


class SkillValidationError(Exception):
    """Raised when skill input or output validation fails."""

    pass


class SkillExecutionError(Exception):
    """Raised when skill execution encounters an error."""

    pass


def compute_hash(data: Any) -> str:
    """Compute SHA256 hash of data for determinism validation.

    Args:
        data: Data to hash (must be JSON-serializable)

    Returns:
        Hexadecimal hash string (64 characters)
    """
    try:
        # Sort keys for deterministic JSON serialization
        json_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode()).hexdigest()
    except Exception as e:
        logger.warning("hash_computation_failed", error=str(e))
        return ""


def workflow_skill(
    name: str,
    inputs_schema: Optional[type[BaseModel]] = None,
    outputs_schema: Optional[type[BaseModel]] = None,
    deterministic: bool = True,
    default_temperature: float = 0.2,
    default_top_p: float = 0.9,
) -> Callable:
    """Decorator for workflow skill functions.

    Wraps skill functions with:
    - Input/output schema validation
    - Seed injection and determinism enforcement
    - OpenTelemetry span creation
    - Event emission (start/end/fail)
    - Error handling and logging
    - Hash computation for reproducibility

    Example:
        ```python
        @workflow_skill(
            name="amcs.plan.generate",
            inputs_schema=PlanInputSchema,
            outputs_schema=PlanOutputSchema,
            deterministic=True
        )
        async def generate_plan(
            inputs: dict,
            context: WorkflowContext
        ) -> dict:
            # Implementation
            sds = inputs["sds"]
            plan = create_plan(sds, seed=context.seed)
            return {"plan": plan}
        ```

    Args:
        name: Fully qualified skill name (e.g., "amcs.plan.generate")
        inputs_schema: Pydantic schema for input validation
        outputs_schema: Pydantic schema for output validation
        deterministic: Whether this skill should be deterministic
        default_temperature: Default LLM temperature for this skill
        default_top_p: Default LLM top_p for this skill

    Returns:
        Decorated async function
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(
            inputs: Dict[str, Any], context: WorkflowContext, **kwargs
        ) -> Dict[str, Any]:
            """Wrapped skill execution with validation and telemetry."""

            start_time = time.time()
            input_hash = compute_hash(inputs)

            # Create OpenTelemetry span
            with tracer.start_as_current_span(f"skill.{name}") as span:
                span.set_attribute("skill.name", name)
                span.set_attribute("skill.node_index", context.node_index)
                span.set_attribute("skill.seed", context.seed)
                span.set_attribute("skill.deterministic", deterministic)
                span.set_attribute("skill.input_hash", input_hash)
                span.set_attribute("run.run_id", str(context.run_id))
                span.set_attribute("run.song_id", str(context.song_id))

                logger.info(
                    "skill.start",
                    skill_name=name,
                    run_id=str(context.run_id),
                    node_index=context.node_index,
                    seed=context.seed,
                    input_hash=input_hash,
                )

                # Emit start event
                if context.event_publisher:
                    await context.event_publisher.publish_event(
                        run_id=context.run_id,
                        node_name=context.node_name,
                        phase="start",
                        data={
                            "skill_name": name,
                            "seed": context.seed,
                            "node_index": context.node_index,
                            "deterministic": deterministic,
                        },
                    )

                try:
                    # Validate inputs
                    if inputs_schema:
                        try:
                            validated_inputs = inputs_schema(**inputs)
                            inputs = validated_inputs.model_dump()
                        except ValidationError as e:
                            raise SkillValidationError(
                                f"Input validation failed for {name}: {e}"
                            ) from e

                    # Add model parameters to context if deterministic
                    model_params = None
                    if deterministic:
                        model_params = {
                            "temperature": kwargs.get("temperature", default_temperature),
                            "top_p": kwargs.get("top_p", default_top_p),
                            "seed": context.seed,
                        }
                        span.set_attribute("skill.temperature", model_params["temperature"])
                        span.set_attribute("skill.top_p", model_params["top_p"])

                    # Execute the skill function
                    outputs = await func(inputs, context, **kwargs)

                    # Validate outputs
                    if outputs_schema:
                        try:
                            validated_outputs = outputs_schema(**outputs)
                            outputs = validated_outputs.model_dump()
                        except ValidationError as e:
                            raise SkillValidationError(
                                f"Output validation failed for {name}: {e}"
                            ) from e

                    # Compute output hash
                    output_hash = compute_hash(outputs)
                    span.set_attribute("skill.output_hash", output_hash)

                    # Calculate duration
                    duration_ms = int((time.time() - start_time) * 1000)
                    duration_seconds = duration_ms / 1000.0
                    span.set_attribute("skill.duration_ms", duration_ms)

                    logger.info(
                        "skill.end",
                        skill_name=name,
                        run_id=str(context.run_id),
                        node_index=context.node_index,
                        duration_ms=duration_ms,
                        output_hash=output_hash,
                    )

                    # Record skill execution metrics
                    metrics.record_skill_execution(
                        skill_name=name,
                        duration_seconds=duration_seconds,
                        status="completed",
                    )

                    # Emit end event
                    if context.event_publisher:
                        await context.event_publisher.publish_event(
                            run_id=context.run_id,
                            node_name=context.node_name,
                            phase="end",
                            data={
                                "skill_name": name,
                                "duration_ms": duration_ms,
                                "output_hash": output_hash,
                                "model_params": model_params,
                            },
                        )

                    # Add execution metadata to outputs
                    outputs["_metadata"] = {
                        "skill_name": name,
                        "duration_ms": duration_ms,
                        "input_hash": input_hash,
                        "output_hash": output_hash,
                        "seed": context.seed,
                        "model_params": model_params,
                    }

                    return outputs

                except SkillValidationError as e:
                    # Validation errors are skill bugs, not user errors
                    duration_ms = int((time.time() - start_time) * 1000)
                    duration_seconds = duration_ms / 1000.0
                    span.set_attribute("skill.error", str(e))
                    span.set_attribute("skill.error_type", "validation")
                    span.set_attribute("skill.duration_ms", duration_ms)

                    logger.error(
                        "skill.validation_error",
                        skill_name=name,
                        run_id=str(context.run_id),
                        error=str(e),
                        duration_ms=duration_ms,
                    )

                    # Record validation error metric
                    metrics.record_skill_execution(
                        skill_name=name,
                        duration_seconds=duration_seconds,
                        status="validation_error",
                    )

                    # Emit fail event
                    if context.event_publisher:
                        await context.event_publisher.publish_event(
                            run_id=context.run_id,
                            node_name=context.node_name,
                            phase="fail",
                            data={
                                "skill_name": name,
                                "error_type": "validation",
                                "error_message": str(e),
                                "duration_ms": duration_ms,
                            },
                        )

                    raise SkillExecutionError(f"Skill {name} validation failed") from e

                except Exception as e:
                    # Execution errors (LLM, network, etc.)
                    duration_ms = int((time.time() - start_time) * 1000)
                    duration_seconds = duration_ms / 1000.0
                    error_trace = traceback.format_exc()

                    span.set_attribute("skill.error", str(e))
                    span.set_attribute("skill.error_type", type(e).__name__)
                    span.set_attribute("skill.duration_ms", duration_ms)

                    logger.error(
                        "skill.execution_error",
                        skill_name=name,
                        run_id=str(context.run_id),
                        error=str(e),
                        error_type=type(e).__name__,
                        duration_ms=duration_ms,
                        stack_trace=error_trace,
                    )

                    # Record execution error metric
                    metrics.record_skill_execution(
                        skill_name=name,
                        duration_seconds=duration_seconds,
                        status="failed",
                    )

                    # Emit fail event
                    if context.event_publisher:
                        await context.event_publisher.publish_event(
                            run_id=context.run_id,
                            node_name=context.node_name,
                            phase="fail",
                            data={
                                "skill_name": name,
                                "error_type": type(e).__name__,
                                "error_message": str(e),
                                "duration_ms": duration_ms,
                                "stack_trace": error_trace[:1000],  # Truncate
                            },
                        )

                    raise SkillExecutionError(
                        f"Skill {name} execution failed: {e}"
                    ) from e

        return wrapper

    return decorator
