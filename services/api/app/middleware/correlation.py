"""Correlation ID middleware for distributed tracing.

This middleware ensures that every request has a correlation ID that can be
traced through the entire request lifecycle, including database queries,
external API calls, and background tasks.
"""

from __future__ import annotations

from typing import Callable, Awaitable
from uuid import uuid4

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.observability.log_processors import (
    set_correlation_context,
    clear_correlation_context,
    performance_processor,
    db_metrics_processor,
)

logger = structlog.get_logger(__name__)


class CorrelationMiddleware(BaseHTTPMiddleware):
    """Middleware to handle correlation IDs and request context.

    This middleware:
    1. Extracts or generates correlation IDs for each request
    2. Sets up context variables for the entire request lifecycle
    3. Adds correlation headers to responses
    4. Handles request timing and metrics
    5. Cleans up context after request completion
    """

    def __init__(self, app, header_name: str = "X-Correlation-ID"):
        super().__init__(app)
        self.header_name = header_name
        self.request_id_header = "X-Request-ID"

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """Process request with correlation context."""

        # Extract or generate correlation ID
        correlation_id = (
            request.headers.get(self.header_name) or
            request.headers.get("x-correlation-id") or
            str(uuid4())
        )

        # Extract or generate request ID
        request_id = (
            request.headers.get(self.request_id_header) or
            request.headers.get("x-request-id") or
            getattr(request.state, "request_id", None) or
            str(uuid4())
        )

        # Set request ID on state for backward compatibility
        request.state.request_id = request_id
        request.state.correlation_id = correlation_id

        # Initialize performance timing
        performance_processor.start_request_timing()
        db_metrics_processor.reset_metrics()

        # Set up correlation context
        set_correlation_context(
            correlation_id=correlation_id,
            request_id=request_id,
        )

        # Log request start
        bound_logger = logger.bind(
            method=request.method,
            path=request.url.path,
            query_params=dict(request.query_params) if request.query_params else None,
            user_agent=request.headers.get("user-agent"),
        )
        bound_logger.info("request_started")

        try:
            # Process request
            response = await call_next(request)

            # Add correlation headers to response
            response.headers[self.header_name] = correlation_id
            response.headers[self.request_id_header] = request_id

            # Log successful request completion
            bound_logger.info(
                "request_completed",
                status_code=response.status_code,
                response_headers=dict(response.headers) if hasattr(response, 'headers') else None,
            )

            return response

        except Exception as exc:
            # Log request failure
            bound_logger.error(
                "request_failed",
                exception=str(exc),
                exception_type=type(exc).__name__,
                exc_info=True,
            )
            raise

        finally:
            # Clean up context
            performance_processor.clear_request_timing()
            clear_correlation_context()


def get_correlation_id_from_request(request: Request) -> str | None:
    """Extract correlation ID from request state.

    Args:
        request: FastAPI request object

    Returns:
        Correlation ID if available, None otherwise
    """
    return getattr(request.state, "correlation_id", None)


def get_request_id_from_request(request: Request) -> str | None:
    """Extract request ID from request state.

    Args:
        request: FastAPI request object

    Returns:
        Request ID if available, None otherwise
    """
    return getattr(request.state, "request_id", None)
