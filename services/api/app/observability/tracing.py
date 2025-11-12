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
            "service.name": "meatymusic-api",
            "service.version": os.getenv("API_VERSION", "0.1.0"),
            "deployment.environment": os.getenv("ENVIRONMENT", "development"),
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
