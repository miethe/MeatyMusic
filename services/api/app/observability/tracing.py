"""OpenTelemetry tracing configuration for the API service."""

from __future__ import annotations

import os

from fastapi import FastAPI
from sqlalchemy.engine import Engine
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    SimpleSpanProcessor,
    SpanExporter,
    ConsoleSpanExporter,
)
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import get_current_span, Span, SpanContext
from starlette.middleware.base import BaseHTTPMiddleware

# types
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable, Awaitable

from app.core.config import settings

EXPORTER: SpanExporter | None = None


def _span_name(scope: dict[str, object]) -> str:
    """Format span names using ``api.<resource>.<verb>`` semantics.

    Parameters
    ----------
    scope:
        ASGI scope dictionary for the request.

    Returns
    -------
    str
        Standardized span name.
    """

    path: str = str(scope.get("path", "/"))
    method: str = str(scope.get("method", "get")).lower()
    resource: str = path.replace("/api/v1/", "").strip("/").replace("/", ".") or "root"

    if method == "get":
        verb = "list" if "{" not in path else "get"
    elif method == "post":
        verb = "create"
    elif method == "put":
        verb = "update"
    elif method == "delete":
        verb = "delete"
    else:
        verb = method
    return f"api.{resource}.{verb}"


class TraceIdMiddleware(BaseHTTPMiddleware):
    """Attach the current trace identifier to ``request.state`` for logging."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response: Response = await call_next(request)
        span: Span = get_current_span()
        ctx: SpanContext = span.get_span_context()
        if ctx.trace_id:
            request.state.trace_id = f"{ctx.trace_id:032x}"
        return response


def init_tracing(app: FastAPI, engine: Engine) -> None:
    """Initialize OpenTelemetry tracing for the FastAPI application.

    Parameters
    ----------
    app:
        The FastAPI instance to instrument.
    engine:
        SQLAlchemy engine used for database access.
    """

    global EXPORTER

    exporter_name: str = settings.OBS.OTEL_EXPORTER_TYPE
    resource: Resource = Resource.create(
        {
            "service.name": settings.SERVICE_NAME,
            "service.version": os.getenv("API_VERSION", "0.1.0"),
            "deployment.environment": settings.ENVIRONMENT,
        }
    )

    provider: TracerProvider = TracerProvider(resource=resource)
    if exporter_name == "otlp":
        EXPORTER = OTLPSpanExporter(
            endpoint=settings.OBS.OTEL_EXPORTER_OTLP_ENDPOINT
        )
        processor = BatchSpanProcessor(EXPORTER)
    elif exporter_name == "memory":
        EXPORTER = InMemorySpanExporter()
        processor = SimpleSpanProcessor(EXPORTER)
    else:  # console
        EXPORTER = ConsoleSpanExporter()
        processor = SimpleSpanProcessor(EXPORTER)

    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    # Remove span_name_formatter argument (no longer supported)
    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(engine=engine)
    HTTPXClientInstrumentor().instrument()

    app.add_middleware(TraceIdMiddleware)


def get_tracer(name: str):
    """Get a tracer instance for the given module name."""
    return trace.get_tracer(name)


# =============================================================================
# Workflow-Specific Tracing Decorators
# =============================================================================


def trace_workflow_execution(tracer_name: str = "workflow"):
    """Decorator to trace workflow execution with comprehensive metadata.

    Creates a span for the entire workflow run, including:
    - run_id, song_id, seed
    - duration_ms, status
    - fix_iterations
    - validation_scores
    - genre, user context

    Example:
        ```python
        @trace_workflow_execution()
        async def execute_workflow(run_id: UUID) -> dict:
            # ... workflow logic ...
            return {"status": "completed", ...}
        ```

    Args:
        tracer_name: Name for the tracer instance

    Returns:
        Decorator function
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(tracer_name)
            with tracer.start_as_current_span("workflow.execute") as span:
                # Extract run_id if available
                run_id = kwargs.get("run_id") or (args[0] if args else None)
                if run_id:
                    span.set_attribute("workflow.run_id", str(run_id))

                try:
                    result = await func(*args, **kwargs)

                    # Add result metadata to span
                    if isinstance(result, dict):
                        span.set_attribute(
                            "workflow.status", result.get("status", "unknown")
                        )
                        span.set_attribute(
                            "workflow.duration_ms", result.get("duration_ms", 0)
                        )
                        span.set_attribute(
                            "workflow.fix_iterations", result.get("fix_iterations", 0)
                        )

                        # Add validation scores
                        if "validation_scores" in result:
                            for metric, score in result["validation_scores"].items():
                                span.set_attribute(f"workflow.score.{metric}", score)

                    return result

                except Exception as e:
                    span.set_attribute("workflow.status", "failed")
                    span.set_attribute("workflow.error", str(e))
                    span.set_attribute("workflow.error_type", type(e).__name__)
                    raise

        return wrapper

    return decorator


def trace_skill_execution(skill_name: str, tracer_name: str = "workflow.skill"):
    """Decorator to trace individual skill execution.

    Creates a span for skill execution with:
    - skill_name, node_name, node_index
    - seed, input_hash, output_hash
    - duration_ms, status
    - LLM token usage (if applicable)
    - Model parameters (temperature, top_p)

    Example:
        ```python
        @trace_skill_execution("amcs.plan.generate")
        async def generate_plan(inputs: dict, context: WorkflowContext) -> dict:
            # ... skill logic ...
            return {"plan": {...}}
        ```

    Args:
        skill_name: Full skill name (e.g., "amcs.plan.generate")
        tracer_name: Name for the tracer instance

    Returns:
        Decorator function
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(tracer_name)
            with tracer.start_as_current_span(f"skill.{skill_name}") as span:
                span.set_attribute("skill.name", skill_name)

                # Extract context if available
                context = kwargs.get("context") or (args[1] if len(args) > 1 else None)
                if context and hasattr(context, "run_id"):
                    span.set_attribute("workflow.run_id", str(context.run_id))
                    span.set_attribute("workflow.song_id", str(context.song_id))
                    span.set_attribute("skill.seed", context.seed)
                    span.set_attribute("skill.node_index", context.node_index)
                    span.set_attribute("skill.node_name", context.node_name)

                try:
                    result = await func(*args, **kwargs)

                    # Add metadata from result
                    if isinstance(result, dict):
                        metadata = result.get("_metadata", {})
                        if metadata:
                            span.set_attribute(
                                "skill.duration_ms", metadata.get("duration_ms", 0)
                            )
                            span.set_attribute(
                                "skill.input_hash", metadata.get("input_hash", "")
                            )
                            span.set_attribute(
                                "skill.output_hash", metadata.get("output_hash", "")
                            )

                            # Add model parameters
                            model_params = metadata.get("model_params", {})
                            if model_params:
                                span.set_attribute(
                                    "skill.temperature", model_params.get("temperature")
                                )
                                span.set_attribute(
                                    "skill.top_p", model_params.get("top_p")
                                )

                    span.set_attribute("skill.status", "completed")
                    return result

                except Exception as e:
                    span.set_attribute("skill.status", "failed")
                    span.set_attribute("skill.error", str(e))
                    span.set_attribute("skill.error_type", type(e).__name__)
                    raise

        return wrapper

    return decorator
