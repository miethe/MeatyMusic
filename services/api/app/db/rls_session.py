"""RLS session utilities for enhanced context management and performance optimization.

This module provides utility functions and context managers for Row Level Security (RLS)
session management, building upon the existing RLS middleware to support dual security
contexts, performance optimization with caching within transactions, and enhanced
error handling.

Features:
- Async session context setup with validation
- Context managers for scoped RLS contexts
- Performance optimization with transaction-level caching
- Enhanced UUID validation and error handling
- Integration with existing RLS middleware and observability
"""

from __future__ import annotations

import asyncio
import uuid
from contextlib import asynccontextmanager
from contextvars import ContextVar
from typing import AsyncGenerator, Optional, Dict, Any, Union
from weakref import WeakKeyDictionary

import structlog
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from sqlalchemy.orm import Session

from .session import SessionLocal, get_db_session
from app.observability.log_processors import set_correlation_context

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)

# Context variables for enhanced session management
_SESSION_CACHE: ContextVar[Dict[str, Any]] = ContextVar("session_cache", default=None)
_TRANSACTION_ID: ContextVar[str] = ContextVar("transaction_id", default=None)

# Weak reference cache for session-level optimization
_session_cache_store: WeakKeyDictionary[Session, Dict[str, Any]] = WeakKeyDictionary()


class RLSSessionError(Exception):
    """Base exception for RLS session operations."""
    pass


class RLSValidationError(RLSSessionError):
    """Raised when RLS context validation fails."""
    pass


class RLSContextManager:
    """Context manager for scoped RLS session context with automatic cleanup."""

    def __init__(
        self,
        db: Session,
        user_id: Optional[Union[str, uuid.UUID]] = None,
        tenant_id: Optional[Union[str, uuid.UUID]] = None,
        role: Optional[str] = None,
        enable_caching: bool = True,
        correlation_id: Optional[str] = None
    ):
        self.db = db
        self.user_id = self._normalize_uuid(user_id)
        self.tenant_id = self._normalize_uuid(tenant_id)
        self.role = role
        self.enable_caching = enable_caching
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self._original_context: Dict[str, Any] = {}
        self._cache_token = None

    def _normalize_uuid(self, value: Optional[Union[str, uuid.UUID]]) -> Optional[str]:
        """Normalize UUID input to string format with validation."""
        if value is None:
            return None

        if isinstance(value, uuid.UUID):
            return str(value)

        if isinstance(value, str):
            if validate_uuid_format(value):
                return value
            else:
                raise RLSValidationError(f"Invalid UUID format: {value}")

        raise RLSValidationError(f"Unsupported UUID type: {type(value)}")

    def __enter__(self) -> 'RLSContextManager':
        """Enter context manager and apply RLS settings."""
        with tracer.start_as_current_span("rls_session.context_enter") as span:
            span.set_attribute("rls.user_id", self.user_id or "")
            span.set_attribute("rls.tenant_id", self.tenant_id or "")
            span.set_attribute("rls.role", self.role or "")
            span.set_attribute("rls.correlation_id", self.correlation_id)

            try:
                # Store original context for restoration
                self._original_context = get_session_context(self.db)

                # Apply new RLS context
                set_rls_context_sync(
                    db=self.db,
                    user_id=self.user_id,
                    tenant_id=self.tenant_id,
                    role=self.role
                )

                # Initialize caching if enabled
                if self.enable_caching:
                    self._cache_token = _enable_session_cache(self.db)

                # Set correlation context
                set_correlation_context(
                    correlation_id=self.correlation_id,
                    user_id=self.user_id,
                    tenant_id=self.tenant_id
                )

                logger.debug(
                    "RLS context manager entered successfully",
                    correlation_id=self.correlation_id,
                    has_user_id=self.user_id is not None,
                    has_tenant_id=self.tenant_id is not None,
                    has_role=self.role is not None,
                    caching_enabled=self.enable_caching
                )

                span.set_status(Status(StatusCode.OK))
                return self

            except Exception as exc:
                span.record_exception(exc)
                span.set_status(Status(StatusCode.ERROR, str(exc)))
                logger.error(
                    "Failed to enter RLS context manager",
                    correlation_id=self.correlation_id,
                    error_type=type(exc).__name__,
                    error_details=str(exc)
                )
                raise RLSSessionError(f"Failed to enter RLS context: {exc}") from exc

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit context manager and restore original settings."""
        with tracer.start_as_current_span("rls_session.context_exit") as span:
            span.set_attribute("rls.correlation_id", self.correlation_id)
            span.set_attribute("rls.exception_occurred", exc_type is not None)

            try:
                # Disable caching first
                if self.enable_caching and self._cache_token:
                    _disable_session_cache(self.db, self._cache_token)

                # Restore original RLS context
                set_rls_context_sync(
                    db=self.db,
                    user_id=self._original_context.get("user_id"),
                    tenant_id=self._original_context.get("tenant_id"),
                    role=self._original_context.get("role")
                )

                logger.debug(
                    "RLS context manager exited successfully",
                    correlation_id=self.correlation_id,
                    exception_occurred=exc_type is not None
                )

                span.set_status(Status(StatusCode.OK))

            except Exception as exit_exc:
                span.record_exception(exit_exc)
                span.set_status(Status(StatusCode.ERROR, str(exit_exc)))
                logger.error(
                    "Failed to exit RLS context manager cleanly",
                    correlation_id=self.correlation_id,
                    exit_error_type=type(exit_exc).__name__,
                    exit_error_details=str(exit_exc),
                    original_exception_type=type(exc_val).__name__ if exc_val else None
                )
                # Don't raise exit exceptions to avoid masking original exceptions


def validate_uuid_format(value: Optional[str]) -> bool:
    """Validate UUID format without exposing sensitive data.

    Args:
        value: UUID string to validate

    Returns:
        True if valid UUID format, False otherwise

    Examples:
        >>> validate_uuid_format("123e4567-e89b-12d3-a456-426614174000")
        True
        >>> validate_uuid_format("invalid-uuid")
        False
        >>> validate_uuid_format(None)
        False
    """
    if not value or not isinstance(value, str):
        return False

    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False


def validate_rls_context(
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    role: Optional[str] = None
) -> Dict[str, bool]:
    """Validate RLS context parameters and return validation results.

    Args:
        user_id: User UUID to validate
        tenant_id: Tenant UUID to validate
        role: Role string to validate

    Returns:
        Dict with validation results for each parameter

    Examples:
        >>> validate_rls_context("123e4567-e89b-12d3-a456-426614174000", role="admin")
        {'user_id_valid': True, 'tenant_id_valid': False, 'role_valid': True}
    """
    return {
        "user_id_valid": validate_uuid_format(user_id),
        "tenant_id_valid": validate_uuid_format(tenant_id),
        "role_valid": isinstance(role, str) and len(role.strip()) > 0 if role else False
    }


def set_rls_context_sync(
    db: Session,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    role: Optional[str] = None
) -> None:
    """Set RLS context synchronously for the current database session.

    This function provides direct session variable setting for use within
    existing synchronous database operations and context managers.

    Args:
        db: SQLAlchemy session
        user_id: User UUID for RLS policies
        tenant_id: Tenant UUID for RLS policies
        role: Role for RLS policies

    Raises:
        RLSSessionError: If context setting fails
        RLSValidationError: If UUID validation fails

    Examples:
        >>> with SessionLocal() as db:
        ...     set_rls_context_sync(db, user_id="123e4567-e89b-12d3-a456-426614174000")
    """
    with tracer.start_as_current_span("rls_session.set_context_sync") as span:
        span.set_attribute("rls.has_user_id", user_id is not None)
        span.set_attribute("rls.has_tenant_id", tenant_id is not None)
        span.set_attribute("rls.has_role", role is not None)

        try:
            # Validate inputs
            validation = validate_rls_context(user_id, tenant_id, role)

            # Set app.user_id session variable
            if user_id:
                if not validation["user_id_valid"]:
                    raise RLSValidationError(f"Invalid user_id format")
                db.execute(text("SET app.user_id = :user_id"), {"user_id": user_id})
                span.set_attribute("rls.user_id_set", True)
            else:
                db.execute(text("RESET app.user_id"))
                span.set_attribute("rls.user_id_set", False)

            # Set app.tenant_id session variable
            if tenant_id:
                if not validation["tenant_id_valid"]:
                    raise RLSValidationError(f"Invalid tenant_id format")
                db.execute(text("SET app.tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                span.set_attribute("rls.tenant_id_set", True)
            else:
                db.execute(text("RESET app.tenant_id"))
                span.set_attribute("rls.tenant_id_set", False)

            # Set app.role session variable
            if role and validation["role_valid"]:
                db.execute(text("SET app.role = :role"), {"role": role})
                span.set_attribute("rls.role_set", True)
            else:
                db.execute(text("RESET app.role"))
                span.set_attribute("rls.role_set", False)

            logger.debug(
                "RLS context set successfully",
                has_user_id=user_id is not None,
                has_tenant_id=tenant_id is not None,
                has_role=role is not None,
                validation_results=validation
            )

            span.set_status(Status(StatusCode.OK))

        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            logger.error(
                "Failed to set RLS context",
                error_type=type(exc).__name__,
                error_details=str(exc),
                validation_results=validation if 'validation' in locals() else {}
            )

            if isinstance(exc, RLSValidationError):
                raise
            else:
                raise RLSSessionError(f"Failed to set RLS context: {exc}") from exc


async def set_rls_context_async(
    db: AsyncSession,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    role: Optional[str] = None
) -> None:
    """Set RLS context asynchronously for async database sessions.

    Async version of set_rls_context_sync for use with AsyncSession.

    Args:
        db: Async SQLAlchemy session
        user_id: User UUID for RLS policies
        tenant_id: Tenant UUID for RLS policies
        role: Role for RLS policies

    Raises:
        RLSSessionError: If context setting fails
        RLSValidationError: If UUID validation fails
    """
    with tracer.start_as_current_span("rls_session.set_context_async") as span:
        span.set_attribute("rls.has_user_id", user_id is not None)
        span.set_attribute("rls.has_tenant_id", tenant_id is not None)
        span.set_attribute("rls.has_role", role is not None)

        try:
            # Validate inputs
            validation = validate_rls_context(user_id, tenant_id, role)

            # Set app.user_id session variable
            if user_id:
                if not validation["user_id_valid"]:
                    raise RLSValidationError(f"Invalid user_id format")
                await db.execute(text("SET app.user_id = :user_id"), {"user_id": user_id})
                span.set_attribute("rls.user_id_set", True)
            else:
                await db.execute(text("RESET app.user_id"))
                span.set_attribute("rls.user_id_set", False)

            # Set app.tenant_id session variable
            if tenant_id:
                if not validation["tenant_id_valid"]:
                    raise RLSValidationError(f"Invalid tenant_id format")
                await db.execute(text("SET app.tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                span.set_attribute("rls.tenant_id_set", True)
            else:
                await db.execute(text("RESET app.tenant_id"))
                span.set_attribute("rls.tenant_id_set", False)

            # Set app.role session variable
            if role and validation["role_valid"]:
                await db.execute(text("SET app.role = :role"), {"role": role})
                span.set_attribute("rls.role_set", True)
            else:
                await db.execute(text("RESET app.role"))
                span.set_attribute("rls.role_set", False)

            logger.debug(
                "RLS context set successfully (async)",
                has_user_id=user_id is not None,
                has_tenant_id=tenant_id is not None,
                has_role=role is not None,
                validation_results=validation
            )

            span.set_status(Status(StatusCode.OK))

        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            logger.error(
                "Failed to set RLS context (async)",
                error_type=type(exc).__name__,
                error_details=str(exc),
                validation_results=validation if 'validation' in locals() else {}
            )

            if isinstance(exc, RLSValidationError):
                raise
            else:
                raise RLSSessionError(f"Failed to set async RLS context: {exc}") from exc


def get_session_context(db: Session) -> Dict[str, Optional[str]]:
    """Get current RLS session context from database session variables.

    Args:
        db: SQLAlchemy session

    Returns:
        Dict containing current user_id, tenant_id, and role

    Examples:
        >>> context = get_session_context(db)
        >>> print(context["user_id"])  # "123e4567-e89b-12d3-a456-426614174000" or None
    """
    with tracer.start_as_current_span("rls_session.get_context") as span:
        try:
            # Query session variables
            user_id_result = db.execute(text("SELECT current_setting('app.user_id', true)")).scalar()
            tenant_id_result = db.execute(text("SELECT current_setting('app.tenant_id', true)")).scalar()
            role_result = db.execute(text("SELECT current_setting('app.role', true)")).scalar()

            # Normalize empty strings to None
            context = {
                "user_id": user_id_result if user_id_result else None,
                "tenant_id": tenant_id_result if tenant_id_result else None,
                "role": role_result if role_result else None
            }

            span.set_attribute("rls.has_user_id", context["user_id"] is not None)
            span.set_attribute("rls.has_tenant_id", context["tenant_id"] is not None)
            span.set_attribute("rls.has_role", context["role"] is not None)

            logger.debug(
                "Retrieved RLS session context",
                has_user_id=context["user_id"] is not None,
                has_tenant_id=context["tenant_id"] is not None,
                has_role=context["role"] is not None
            )

            span.set_status(Status(StatusCode.OK))
            return context

        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            logger.error(
                "Failed to get RLS session context",
                error_type=type(exc).__name__,
                error_details=str(exc)
            )
            raise RLSSessionError(f"Failed to get session context: {exc}") from exc


@asynccontextmanager
async def rls_context(
    user_id: Optional[Union[str, uuid.UUID]] = None,
    tenant_id: Optional[Union[str, uuid.UUID]] = None,
    role: Optional[str] = None,
    enable_caching: bool = True,
    correlation_id: Optional[str] = None
) -> AsyncGenerator[Session, None]:
    """Async context manager that provides a database session with RLS context.

    This is the primary interface for creating scoped RLS sessions that automatically
    handle setup, cleanup, and error recovery.

    Args:
        user_id: User UUID for RLS policies
        tenant_id: Tenant UUID for RLS policies
        role: Role for RLS policies
        enable_caching: Whether to enable transaction-level caching
        correlation_id: Correlation ID for tracing (generated if not provided)

    Yields:
        Database session with RLS context applied

    Raises:
        RLSSessionError: If session setup fails

    Examples:
        >>> async with rls_context(user_id="123e4567-e89b-12d3-a456-426614174000") as db:
        ...     prompts = db.query(Prompt).all()  # Filtered by RLS policies
    """
    correlation_id = correlation_id or str(uuid.uuid4())

    with tracer.start_as_current_span("rls_session.async_context") as span:
        span.set_attribute("rls.correlation_id", correlation_id)
        span.set_attribute("rls.caching_enabled", enable_caching)

        # Use the synchronous session generator since we're managing RLS context manually
        session_gen = get_db_session()
        db = next(session_gen)

        try:
            # Apply RLS context using our synchronous context manager
            with RLSContextManager(
                db=db,
                user_id=user_id,
                tenant_id=tenant_id,
                role=role,
                enable_caching=enable_caching,
                correlation_id=correlation_id
            ):
                logger.debug(
                    "RLS async context established",
                    correlation_id=correlation_id,
                    has_user_id=user_id is not None,
                    has_tenant_id=tenant_id is not None,
                    has_role=role is not None
                )

                span.set_status(Status(StatusCode.OK))
                yield db

        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            logger.error(
                "RLS async context failed",
                correlation_id=correlation_id,
                error_type=type(exc).__name__,
                error_details=str(exc)
            )
            raise
        finally:
            # Ensure session cleanup using the generator
            try:
                next(session_gen)
            except StopIteration:
                pass  # Expected when session closes normally
            except Exception as cleanup_exc:
                logger.error(
                    "Session cleanup failed in RLS async context",
                    correlation_id=correlation_id,
                    cleanup_error_type=type(cleanup_exc).__name__,
                    cleanup_error_details=str(cleanup_exc)
                )


def _enable_session_cache(db: Session) -> str:
    """Enable performance caching for the session.

    Args:
        db: Database session

    Returns:
        Cache token for cleanup
    """
    cache_token = str(uuid.uuid4())
    transaction_id = str(uuid.uuid4())

    # Initialize session cache
    _session_cache_store[db] = {
        "token": cache_token,
        "transaction_id": transaction_id,
        "cache": {},
        "stats": {"hits": 0, "misses": 0}
    }

    # Set context variables
    _SESSION_CACHE.set(_session_cache_store[db]["cache"])
    _TRANSACTION_ID.set(transaction_id)

    logger.debug(
        "Session cache enabled",
        cache_token=cache_token,
        transaction_id=transaction_id
    )

    return cache_token


def _disable_session_cache(db: Session, cache_token: str) -> None:
    """Disable performance caching for the session.

    Args:
        db: Database session
        cache_token: Token from enable_session_cache
    """
    cache_info = _session_cache_store.get(db)
    if cache_info and cache_info["token"] == cache_token:
        stats = cache_info["stats"]
        logger.debug(
            "Session cache disabled",
            cache_token=cache_token,
            transaction_id=cache_info["transaction_id"],
            cache_hits=stats["hits"],
            cache_misses=stats["misses"],
            hit_ratio=stats["hits"] / (stats["hits"] + stats["misses"]) if (stats["hits"] + stats["misses"]) > 0 else 0
        )

        # Clean up
        del _session_cache_store[db]
        _SESSION_CACHE.set(None)
        _TRANSACTION_ID.set(None)


def get_session_cache() -> Optional[Dict[str, Any]]:
    """Get current session cache for performance optimization.

    Returns:
        Session cache dict or None if caching is disabled
    """
    return _SESSION_CACHE.get()


def get_transaction_id() -> Optional[str]:
    """Get current transaction ID for correlation.

    Returns:
        Transaction ID string or None if not in managed transaction
    """
    return _TRANSACTION_ID.get()
