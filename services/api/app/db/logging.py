"""SQLAlchemy query logging and instrumentation.

This module provides comprehensive database query logging including timing,
parameter masking, slow query detection, and connection pool monitoring.
It integrates with the structured logging system to provide detailed
database telemetry.
"""

from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, Optional
from contextlib import contextmanager

import structlog
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.pool import Pool

from app.observability.log_processors import db_metrics_processor

logger = structlog.get_logger(__name__)


class QueryLogger:
    """Handler for SQLAlchemy query logging and metrics."""

    def __init__(self, slow_query_threshold: float = 0.1):
        """Initialize query logger.

        Args:
            slow_query_threshold: Threshold in seconds for slow query logging
        """
        self.slow_query_threshold = slow_query_threshold
        self._query_start_times: Dict[int, float] = {}

    def setup_event_listeners(self, engine: Engine) -> None:
        """Set up SQLAlchemy event listeners for query logging.

        Args:
            engine: SQLAlchemy engine to instrument
        """
        event.listen(engine, "before_cursor_execute", self._before_cursor_execute)
        event.listen(engine, "after_cursor_execute", self._after_cursor_execute)
        event.listen(engine.pool, "connect", self._on_connect)
        event.listen(engine.pool, "checkout", self._on_checkout)
        event.listen(engine.pool, "checkin", self._on_checkin)

        logger.info("database_logging_enabled", engine_name=str(engine.url))

    def _before_cursor_execute(
        self,
        conn,
        cursor,
        statement: str,
        parameters,
        context,
        executemany: bool,
    ) -> None:
        """Handle before cursor execute event."""
        conn_id = id(conn)
        self._query_start_times[conn_id] = time.time()

        # Increment query count for current request
        db_metrics_processor.increment_query_count()

        # Generate query fingerprint for deduplication
        query_hash = self._get_query_fingerprint(statement)

        logger.debug(
            "db_query_started",
            query_hash=query_hash,
            query=self._sanitize_query(statement),
            parameters_count=len(parameters) if parameters else 0,
            executemany=executemany,
        )

    def _after_cursor_execute(
        self,
        conn,
        cursor,
        statement: str,
        parameters,
        context,
        executemany: bool,
    ) -> None:
        """Handle after cursor execute event."""
        conn_id = id(conn)
        start_time = self._query_start_times.pop(conn_id, None)

        if start_time is None:
            return

        duration = time.time() - start_time
        row_count = cursor.rowcount if hasattr(cursor, 'rowcount') else -1

        # Generate query fingerprint
        query_hash = self._get_query_fingerprint(statement)

        # Base log data
        log_data = {
            "query_hash": query_hash,
            "duration_ms": int(duration * 1000),
            "row_count": row_count,
            "executemany": executemany,
        }

        # Log slow queries with more detail
        if duration >= self.slow_query_threshold:
            logger.warning(
                "db_slow_query",
                query=self._sanitize_query(statement),
                parameters=self._mask_parameters(parameters),
                **log_data,
            )
        else:
            logger.debug("db_query_completed", **log_data)

    def _on_connect(self, dbapi_connection, connection_record) -> None:
        """Handle database connection event."""
        logger.debug(
            "db_connection_created",
            connection_id=id(dbapi_connection),
        )

    def _on_checkout(self, dbapi_connection, connection_record, connection_proxy) -> None:
        """Handle connection checkout from pool."""
        logger.debug(
            "db_connection_checkout",
            connection_id=id(dbapi_connection),
            pool_size=connection_record.info.get('pool_size'),
            checked_out_connections=connection_record.info.get('checked_out'),
        )

    def _on_checkin(self, dbapi_connection, connection_record) -> None:
        """Handle connection checkin to pool."""
        logger.debug(
            "db_connection_checkin",
            connection_id=id(dbapi_connection),
        )

    def _get_query_fingerprint(self, statement: str) -> str:
        """Generate a fingerprint for query deduplication.

        Args:
            statement: SQL statement

        Returns:
            Short hash of normalized query
        """
        # Normalize query by removing literals and extra whitespace
        normalized = self._normalize_query(statement)
        return hashlib.md5(normalized.encode()).hexdigest()[:8]

    def _normalize_query(self, statement: str) -> str:
        """Normalize SQL query for fingerprinting.

        Args:
            statement: Original SQL statement

        Returns:
            Normalized statement with literals replaced
        """
        # Simple normalization - replace literals with placeholders
        import re

        # Replace string literals
        statement = re.sub(r"'[^']*'", "'?'", statement)
        # Replace numeric literals
        statement = re.sub(r'\b\d+\b', '?', statement)
        # Collapse whitespace
        statement = re.sub(r'\s+', ' ', statement)

        return statement.strip().upper()

    def _sanitize_query(self, statement: str) -> str:
        """Sanitize query for logging by truncating if too long.

        Args:
            statement: Original SQL statement

        Returns:
            Sanitized statement safe for logging
        """
        max_length = 500
        if len(statement) > max_length:
            return f"{statement[:max_length]}... <truncated>"
        return statement

    def _mask_parameters(self, parameters) -> Any:
        """Mask sensitive parameters in SQL query.

        Args:
            parameters: Query parameters

        Returns:
            Masked parameters safe for logging
        """
        if not parameters:
            return None

        if isinstance(parameters, dict):
            masked = {}
            for key, value in parameters.items():
                if self._is_sensitive_parameter(key):
                    masked[key] = "***MASKED***"
                else:
                    masked[key] = str(value)[:50]  # Limit length
            return masked
        elif isinstance(parameters, (list, tuple)):
            return ["***MASKED***" if self._is_sensitive_value(str(p)) else str(p)[:50]
                   for p in parameters]
        else:
            return str(parameters)[:50]

    def _is_sensitive_parameter(self, key: str) -> bool:
        """Check if parameter key indicates sensitive data.

        Args:
            key: Parameter key name

        Returns:
            True if parameter should be masked
        """
        sensitive_keys = {
            "password", "passwd", "secret", "token", "key",
            "authorization", "auth", "credential", "salt"
        }
        key_lower = key.lower()
        return any(sensitive in key_lower for sensitive in sensitive_keys)

    def _is_sensitive_value(self, value: str) -> bool:
        """Check if value appears to be sensitive.

        Args:
            value: Parameter value as string

        Returns:
            True if value should be masked
        """
        # Simple heuristics for sensitive values
        if len(value) > 100:  # Likely encoded data
            return True
        if value.count(".") == 2 and len(value) > 20:  # JWT-like
            return True
        return False


class ConnectionPoolMonitor:
    """Monitor database connection pool metrics."""

    def __init__(self, engine: Engine):
        self.engine = engine
        self.pool = engine.pool

    def log_pool_status(self) -> None:
        """Log current connection pool status."""
        if hasattr(self.pool, 'size'):
            pool_size = self.pool.size()
            checked_out = self.pool.checkedout()
            overflow = getattr(self.pool, '_overflow', 0)
            invalid = getattr(self.pool, '_invalid', 0)

            logger.info(
                "db_pool_status",
                pool_size=pool_size,
                checked_out=checked_out,
                overflow=overflow,
                invalid=invalid,
                utilization=checked_out / pool_size if pool_size > 0 else 0,
            )

    @contextmanager
    def connection_context(self):
        """Context manager for tracking connection usage."""
        start_time = time.time()

        try:
            yield
        finally:
            duration = time.time() - start_time
            logger.debug(
                "db_connection_duration",
                duration_ms=int(duration * 1000),
            )


# Global query logger instance
query_logger = QueryLogger()


def setup_database_logging(engine: Engine) -> None:
    """Set up database logging for the given engine.

    Args:
        engine: SQLAlchemy engine to instrument
    """
    query_logger.setup_event_listeners(engine)
    logger.info("database_logging_setup_complete", engine_url=str(engine.url))
