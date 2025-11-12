"""Request and response logging middleware.

This middleware provides comprehensive logging of HTTP requests and responses,
including timing, payload sizes, and error conditions. It integrates with
the structured logging system to provide detailed request telemetry.
"""

from __future__ import annotations

import time
from typing import Callable, Awaitable, Dict, Any, Optional

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from starlette.types import Message

from app.observability.log_processors import set_correlation_context

logger = structlog.get_logger(__name__)


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware for detailed request/response logging.

    This middleware logs:
    - Request details (method, path, headers, body size)
    - Response details (status, headers, body size, timing)
    - Error conditions and stack traces
    - Performance metrics (duration, memory usage)
    """

    def __init__(
        self,
        app,
        log_request_body: bool = False,
        log_response_body: bool = False,
        max_body_size: int = 1024,
        exclude_paths: Optional[list[str]] = None,
        exclude_methods: Optional[list[str]] = None,
    ):
        super().__init__(app)
        self.log_request_body = log_request_body
        self.log_response_body = log_response_body
        self.max_body_size = max_body_size
        self.exclude_paths = exclude_paths or ["/healthz", "/metrics"]
        self.exclude_methods = exclude_methods or []

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """Log request and response details."""

        # Skip logging for excluded paths/methods
        if self._should_skip_logging(request):
            return await call_next(request)

        start_time = time.time()

        # Prepare request context
        request_context = await self._build_request_context(request)

        # Log request start
        bound_logger = logger.bind(**request_context)
        bound_logger.info("http_request_started")

        try:
            # Process request
            response = await call_next(request)

            # Calculate timing
            duration_ms = int((time.time() - start_time) * 1000)

            # Build response context
            response_context = self._build_response_context(response, duration_ms)

            # Log successful response
            bound_logger.info("http_request_completed", **response_context)

            return response

        except Exception as exc:
            # Calculate timing for failed requests
            duration_ms = int((time.time() - start_time) * 1000)

            # Log failed request
            bound_logger.error(
                "http_request_failed",
                duration_ms=duration_ms,
                exception=str(exc),
                exception_type=type(exc).__name__,
                exc_info=True,
            )
            raise

    def _should_skip_logging(self, request: Request) -> bool:
        """Determine if request should be skipped for logging."""
        path = request.url.path
        method = request.method

        return (
            path in self.exclude_paths or
            method in self.exclude_methods or
            path.startswith("/static/") or
            path.startswith("/_internal/")
        )

    async def _build_request_context(self, request: Request) -> Dict[str, Any]:
        """Build logging context for the request."""
        context = {
            "http_method": request.method,
            "http_path": request.url.path,
            "http_query": str(request.query_params) if request.query_params else None,
            "http_version": request.scope.get("http_version", "unknown"),
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent"),
            "content_type": request.headers.get("content-type"),
            "content_length": request.headers.get("content-length"),
        }

        # Add request body if enabled and reasonably sized
        if self.log_request_body and self._should_log_body(request):
            try:
                body = await request.body()
                if len(body) <= self.max_body_size:
                    context["request_body"] = body.decode("utf-8", errors="replace")
                else:
                    context["request_body"] = f"<body too large: {len(body)} bytes>"
            except Exception as e:
                context["request_body_error"] = str(e)

        return context

    def _build_response_context(self, response: Response, duration_ms: int) -> Dict[str, Any]:
        """Build logging context for the response."""
        context = {
            "http_status_code": response.status_code,
            "duration_ms": duration_ms,
            "response_headers": dict(response.headers) if hasattr(response, 'headers') else {},
        }

        # Add performance categorization
        if duration_ms > 5000:
            context["performance_category"] = "very_slow"
        elif duration_ms > 1000:
            context["performance_category"] = "slow"
        elif duration_ms > 500:
            context["performance_category"] = "moderate"
        else:
            context["performance_category"] = "fast"

        # Add response size if available
        if hasattr(response, 'headers') and 'content-length' in response.headers:
            context["response_size"] = int(response.headers['content-length'])

        return context

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers (common in production behind proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct client address
        if hasattr(request, "client") and request.client:
            return request.client.host

        return "unknown"

    def _should_log_body(self, request: Request) -> bool:
        """Determine if request body should be logged."""
        content_type = request.headers.get("content-type", "")

        # Only log text-based content types
        text_types = [
            "application/json",
            "application/x-www-form-urlencoded",
            "text/",
            "application/xml"
        ]

        return any(text_type in content_type for text_type in text_types)


class ResponseLoggingWrapper:
    """Wrapper for response objects to enable body logging."""

    def __init__(self, response: Response, logger: structlog.BoundLogger, max_size: int = 1024):
        self.response = response
        self.logger = logger
        self.max_size = max_size
        self._body_logged = False

    async def __call__(self, scope, receive, send):
        """ASGI callable that logs response body."""

        async def log_send(message: Message):
            if message["type"] == "http.response.body" and not self._body_logged:
                body = message.get("body", b"")
                if body and len(body) <= self.max_size:
                    try:
                        body_text = body.decode("utf-8", errors="replace")
                        self.logger.debug("http_response_body", body=body_text)
                    except Exception:
                        self.logger.debug("http_response_body", body="<decode error>")
                self._body_logged = True

            await send(message)

        await self.response(scope, receive, log_send)
