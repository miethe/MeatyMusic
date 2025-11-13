"""Centralized structured logging configuration for the API service.

This module configures structlog for JSON-formatted logs with OpenTelemetry
correlation, user context, and PII masking. It provides a unified logging
interface that integrates seamlessly with existing Python logging.
"""

from __future__ import annotations

import logging
import sys
from typing import Any, Dict, List, Optional

import structlog
from opentelemetry import trace
from structlog import configure, get_logger, configure_once
from structlog.stdlib import LoggerFactory, filter_by_level, add_log_level
from structlog.dev import ConsoleRenderer
from structlog.processors import JSONRenderer, TimeStamper, add_log_level, StackInfoRenderer, format_exc_info

from app.core.config import settings


def setup_logging() -> None:
    """Initialize structured logging configuration.

    This function should be called once at application startup to configure
    the global logging system with structlog processors and formatters.
    """

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.OBS.LOG_LEVEL),
    )

    # Configure structlog processors
    processors: List[Any] = [
        filter_by_level,  # Filter by log level first
        add_log_level,    # Add log level to event dict
        TimeStamper(fmt="iso"),  # ISO timestamp
        StackInfoRenderer(),  # Stack info when requested
        format_exc_info,  # Format exceptions
        add_correlation_ids,  # Add trace/span/request IDs
        add_service_context,  # Add service metadata
        mask_pii,  # Mask sensitive data
    ]

    # Choose renderer based on JSON format setting
    if settings.OBS.LOG_JSON_FORMAT:
        processors.append(JSONRenderer())
    else:
        # Use console renderer for development
        processors.append(ConsoleRenderer())

    configure_once(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.OBS.LOG_LEVEL)
        ),
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Suppress noisy loggers in production
    if settings.OBS.LOG_LEVEL != "DEBUG":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def add_correlation_ids(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Add OpenTelemetry trace/span IDs and request ID to log events."""

    # Get current OpenTelemetry span
    current_span = trace.get_current_span()
    if current_span and current_span.is_recording():
        span_context = current_span.get_span_context()
        if span_context.trace_id:
            event_dict["trace_id"] = f"{span_context.trace_id:032x}"
        if span_context.span_id:
            event_dict["span_id"] = f"{span_context.span_id:016x}"

    # Add service name for log correlation
    event_dict["service"] = "meatymusic-api"

    return event_dict


def add_service_context(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Add service-level context to log events."""

    # Add environment and version info
    import os
    event_dict.update({
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": os.getenv("API_VERSION", "0.1.0"),
    })

    return event_dict


def mask_pii(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Mask personally identifiable information and sensitive data in logs."""

    # Fields that should be completely masked
    sensitive_fields = {
        "password", "passwd", "secret", "token", "authorization",
        "auth", "cookie", "session", "key", "credential"
    }

    # Fields that should be partially masked (show first 3 chars)
    partial_mask_fields = {"email", "username", "user_email"}

    def _mask_value(key: str, value: Any) -> Any:
        """Mask a single value based on its key."""
        if not isinstance(value, str):
            return value

        key_lower = key.lower()

        # Check if value looks like a JWT token first (more specific)
        if value.count(".") == 2 and len(value) > 50:
            return f"{value[:10]}...{value[-4:]}"

        # Complete masking for sensitive fields (but exclude JWT-like tokens)
        sensitive_non_token_fields = {
            "password", "passwd", "secret", "authorization",
            "auth", "cookie", "session", "key", "credential"
        }
        if any(sensitive in key_lower for sensitive in sensitive_non_token_fields):
            return "***MASKED***"

        # Token fields get partial masking if not JWT-like
        if "token" in key_lower and not (value.count(".") == 2 and len(value) > 50):
            return "***MASKED***"

        # Partial masking for emails and usernames
        if any(field in key_lower for field in partial_mask_fields):
            if len(value) > 3:
                return f"{value[:3]}***"
            return "***"

        # Check if value looks like an email
        if "@" in value and "." in value:
            parts = value.split("@")
            if len(parts) == 2 and len(parts[0]) > 3:
                return f"{parts[0][:3]}***@{parts[1]}"
            return "***@***"

        return value

    def _mask_recursive(obj: Any) -> Any:
        """Recursively mask values in nested structures."""
        if isinstance(obj, dict):
            return {k: _mask_recursive(_mask_value(k, v)) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [_mask_recursive(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(_mask_recursive(item) for item in obj)
        else:
            return obj

    # Apply masking to the entire event dict
    masked_dict = {}
    for key, value in event_dict.items():
        if key in {"event", "timestamp", "level", "logger", "trace_id", "span_id", "service"}:
            # Don't mask structural fields
            masked_dict[key] = value
        else:
            masked_dict[key] = _mask_recursive(_mask_value(key, value))

    return masked_dict


def get_structured_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance for the given module name.

    Args:
        name: Usually __name__ from the calling module

    Returns:
        A bound logger instance ready for structured logging

    Example:
        >>> logger = get_structured_logger(__name__)
        >>> logger.info("user_created", user_id=user.id, email=user.email)
    """
    return get_logger(name)


def bind_user_context(logger: structlog.BoundLogger, user_id: Optional[str] = None,
                     tenant_id: Optional[str] = None) -> structlog.BoundLogger:
    """Bind user context to a logger instance.

    Args:
        logger: The logger to bind context to
        user_id: Current user ID
        tenant_id: Current tenant ID

    Returns:
        Logger with bound user context
    """
    context = {}
    if user_id:
        context["user_id"] = user_id
    if tenant_id:
        context["tenant_id"] = tenant_id

    return logger.bind(**context)


def bind_request_context(logger: structlog.BoundLogger, request_id: Optional[str] = None,
                        method: Optional[str] = None, path: Optional[str] = None) -> structlog.BoundLogger:
    """Bind request context to a logger instance.

    Args:
        logger: The logger to bind context to
        request_id: Unique request identifier
        method: HTTP method
        path: Request path

    Returns:
        Logger with bound request context
    """
    context = {}
    if request_id:
        context["request_id"] = request_id
    if method:
        context["method"] = method
    if path:
        context["path"] = path

    return logger.bind(**context)
