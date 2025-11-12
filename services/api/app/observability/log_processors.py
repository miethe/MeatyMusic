"""Advanced log processors for structured logging.

This module contains specialized processors for handling correlation IDs,
performance metrics, error categorization, and other observability concerns.
"""

from __future__ import annotations

import time
from contextvars import ContextVar
from typing import Any, Dict, Optional
from uuid import uuid4

import structlog


# Context variables for correlation
correlation_id_var: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
tenant_id_var: ContextVar[Optional[str]] = ContextVar("tenant_id", default=None)


class CorrelationProcessor:
    """Processor to add correlation IDs from context variables."""

    def __call__(self, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add correlation context to log events."""

        # Add correlation ID (generated if not present)
        correlation_id = correlation_id_var.get()
        if correlation_id:
            event_dict["correlation_id"] = correlation_id

        # Add request ID
        request_id = request_id_var.get()
        if request_id:
            event_dict["request_id"] = request_id

        # Add user context
        user_id = user_id_var.get()
        if user_id:
            event_dict["user_id"] = user_id

        tenant_id = tenant_id_var.get()
        if tenant_id:
            event_dict["tenant_id"] = tenant_id

        return event_dict


class PerformanceProcessor:
    """Processor to add performance metrics to log events."""

    def __init__(self):
        self.request_start_time: ContextVar[Optional[float]] = ContextVar("request_start_time", default=None)

    def __call__(self, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add performance metrics to log events."""

        # Add current timestamp for duration calculations
        current_time = time.time()
        event_dict["timestamp_ms"] = int(current_time * 1000)

        # Calculate request duration if available
        start_time = self.request_start_time.get()
        if start_time:
            duration_ms = int((current_time - start_time) * 1000)
            event_dict["duration_ms"] = duration_ms

        return event_dict

    def start_request_timing(self) -> None:
        """Mark the start of request timing."""
        self.request_start_time.set(time.time())

    def clear_request_timing(self) -> None:
        """Clear request timing context."""
        self.request_start_time.set(None)


class ErrorCategorizer:
    """Processor to categorize and enrich error information."""

    ERROR_CATEGORIES = {
        "auth": ["authentication", "authorization", "token", "permission"],
        "validation": ["validation", "schema", "format", "required"],
        "database": ["connection", "query", "transaction", "constraint"],
        "external": ["http", "api", "network", "timeout"],
        "business": ["workflow", "state", "rule", "logic"],
    }

    def __call__(self, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Categorize errors and add recovery hints."""

        # Only process error-level events
        if event_dict.get("level", "").upper() != "ERROR":
            return event_dict

        message = event_dict.get("event", "").lower()
        exception_info = event_dict.get("exception", "")

        # Categorize the error
        category = self._categorize_error(message, exception_info)
        if category:
            event_dict["error_category"] = category
            event_dict["recovery_hints"] = self._get_recovery_hints(category)

        # Add error fingerprint for deduplication
        error_type = event_dict.get("exception", {}).get("type", "unknown")
        error_location = event_dict.get("exception", {}).get("file", "unknown")
        event_dict["error_fingerprint"] = f"{category}:{error_type}:{hash(error_location) % 10000}"

        return event_dict

    def _categorize_error(self, message: str, exception_info: str) -> Optional[str]:
        """Categorize an error based on message and exception info."""
        combined_text = f"{message} {exception_info}".lower()

        for category, keywords in self.ERROR_CATEGORIES.items():
            if any(keyword in combined_text for keyword in keywords):
                return category

        return "unknown"

    def _get_recovery_hints(self, category: str) -> list[str]:
        """Get recovery hints based on error category."""
        hints = {
            "auth": [
                "Check token expiration",
                "Verify user permissions",
                "Refresh authentication"
            ],
            "validation": [
                "Review request payload",
                "Check required fields",
                "Validate data formats"
            ],
            "database": [
                "Check database connectivity",
                "Review query parameters",
                "Verify transaction state"
            ],
            "external": [
                "Check network connectivity",
                "Verify external service status",
                "Review timeout settings"
            ],
            "business": [
                "Review business rules",
                "Check entity state",
                "Verify workflow conditions"
            ]
        }
        return hints.get(category, ["Review system logs", "Contact support"])


class DatabaseMetricsProcessor:
    """Processor to add database query metrics."""

    def __init__(self):
        self.query_count_var: ContextVar[int] = ContextVar("query_count", default=0)
        self.cache_hits_var: ContextVar[int] = ContextVar("cache_hits", default=0)

    def __call__(self, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add database metrics to log events."""

        query_count = self.query_count_var.get(0)
        cache_hits = self.cache_hits_var.get(0)

        if query_count > 0:
            event_dict["db_queries"] = query_count

        if cache_hits > 0:
            event_dict["cache_hits"] = cache_hits

        return event_dict

    def increment_query_count(self) -> None:
        """Increment the query count for current request."""
        current_count = self.query_count_var.get(0)
        self.query_count_var.set(current_count + 1)

    def increment_cache_hits(self) -> None:
        """Increment the cache hit count for current request."""
        current_hits = self.cache_hits_var.get(0)
        self.cache_hits_var.set(current_hits + 1)

    def reset_metrics(self) -> None:
        """Reset metrics for new request."""
        self.query_count_var.set(0)
        self.cache_hits_var.set(0)


# Global processor instances
correlation_processor = CorrelationProcessor()
performance_processor = PerformanceProcessor()
error_categorizer = ErrorCategorizer()
db_metrics_processor = DatabaseMetricsProcessor()


def set_correlation_context(correlation_id: Optional[str] = None,
                          request_id: Optional[str] = None,
                          user_id: Optional[str] = None,
                          tenant_id: Optional[str] = None) -> None:
    """Set correlation context for the current request.

    Args:
        correlation_id: Unique correlation ID (generated if not provided)
        request_id: Request identifier
        user_id: Current user ID
        tenant_id: Current tenant ID
    """
    if correlation_id is None:
        correlation_id = str(uuid4())

    correlation_id_var.set(correlation_id)
    if request_id:
        request_id_var.set(request_id)
    if user_id:
        user_id_var.set(user_id)
    if tenant_id:
        tenant_id_var.set(tenant_id)


def clear_correlation_context() -> None:
    """Clear all correlation context variables."""
    correlation_id_var.set(None)
    request_id_var.set(None)
    user_id_var.set(None)
    tenant_id_var.set(None)


def get_correlation_id() -> Optional[str]:
    """Get current correlation ID."""
    return correlation_id_var.get()
