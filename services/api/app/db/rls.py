"""Session context helpers for row-level security with JWT token support."""
from __future__ import annotations

import uuid
import logging
from contextvars import ContextVar
from typing import Callable

import structlog
from fastapi import Request, HTTPException
from sqlalchemy import event
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from .session import engine
from app.observability.log_processors import set_correlation_context

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)

USER_ID_CTX: ContextVar[str | None] = ContextVar("app_user_id", default=None)
TENANT_ID_CTX: ContextVar[str | None] = ContextVar("app_tenant_id", default=None)
ROLE_CTX: ContextVar[str | None] = ContextVar("app_role", default=None)


def _is_valid_uuid(value: str | None) -> bool:
    """Validate UUID format without exposing sensitive data."""
    if not value:
        return False
    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False


@event.listens_for(engine, "checkout")
def apply_session_context(dbapi_conn, conn_record, conn_proxy) -> None:
    """Set per-connection session variables for RLS with enhanced error handling."""
    user_id = USER_ID_CTX.get()
    tenant_id = TENANT_ID_CTX.get()
    role = ROLE_CTX.get()

    with tracer.start_as_current_span("rls.apply_session_context") as span:
        span.set_attribute("rls.has_user_id", user_id is not None)
        span.set_attribute("rls.has_tenant_id", tenant_id is not None)
        span.set_attribute("rls.has_role", role is not None)

        try:
            cursor = dbapi_conn.cursor()

            # Set app.user_id session variable
            if user_id and _is_valid_uuid(user_id):
                cursor.execute("SET app.user_id = %s", (user_id,))
                span.set_attribute("rls.user_id_set", True)
            else:
                cursor.execute("RESET app.user_id")
                span.set_attribute("rls.user_id_set", False)
                if user_id:  # Only log if value was provided but invalid
                    logger.warning(
                        "Invalid user_id format for RLS context",
                        user_id_valid=False
                    )

            # Set app.tenant_id session variable
            if tenant_id and _is_valid_uuid(tenant_id):
                cursor.execute("SET app.tenant_id = %s", (tenant_id,))
                span.set_attribute("rls.tenant_id_set", True)
            else:
                cursor.execute("RESET app.tenant_id")
                span.set_attribute("rls.tenant_id_set", False)
                if tenant_id:  # Only log if value was provided but invalid
                    logger.warning(
                        "Invalid tenant_id format for RLS context",
                        tenant_id_valid=False
                    )

            # Set app.role session variable
            if role:
                cursor.execute("SET app.role = %s", (role,))
                span.set_attribute("rls.role_set", True)
            else:
                cursor.execute("RESET app.role")
                span.set_attribute("rls.role_set", False)

            cursor.close()

            logger.debug(
                "RLS session context applied successfully",
                has_user_id=user_id is not None,
                has_tenant_id=tenant_id is not None,
                has_role=role is not None
            )

        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, "Failed to apply RLS session context"))
            logger.error(
                "Failed to apply RLS session context",
                error_type=type(exc).__name__,
                error_details=str(exc)
            )
            # Don't re-raise - allow request to continue without RLS context
            # The database will handle missing context gracefully


async def rls_middleware(request: Request, call_next: Callable):
    """Middleware that applies RLS session variables from JWT tokens per request."""

    with tracer.start_as_current_span("rls.middleware") as span:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        span.set_attribute("request_id", request_id)

        # Extract authorization header
        authorization_header = request.headers.get("Authorization")
        span.set_attribute("rls.has_authorization", authorization_header is not None)

        # Initialize context variables with None
        user_token = USER_ID_CTX.set(None)
        tenant_token = TENANT_ID_CTX.set(None)
        role_token = ROLE_CTX.set(None)

        try:
            # Extract security context from JWT token if available
            if authorization_header:
                try:
                    # Defer import to avoid circular dependency
                    from auth.deps import get_auth_provider
                    from auth.providers.base import AuthContext
                    from app.core.database import SessionLocal
                    from app.services.tenant_service import get_user_tenant_id

                    provider = get_auth_provider()
                    auth_context: AuthContext = provider.verify_authorization(authorization_header)

                    # Resolve internal user_id and tenant_id from auth context
                    internal_user_id = None
                    resolved_tenant_id = auth_context.tenant_id

                    # Task 1: Resolve internal user_id from Clerk's external user_id
                    if auth_context.user_id:
                        try:
                            # Create temporary session for user resolution
                            with SessionLocal() as resolution_db:
                                # Resolve user to get internal UUID (not Clerk's external ID)
                                user = provider.resolve_user(resolution_db, auth_context)
                                internal_user_id = str(user.id)  # This is the UUID we need for RLS

                                span.set_attribute("rls.user_id_clerk", auth_context.user_id)
                                span.set_attribute("rls.user_id_internal", internal_user_id)
                                span.set_attribute("rls.user_resolution_success", True)

                                logger.debug(
                                    "Resolved internal user_id for RLS context",
                                    clerk_user_id=auth_context.user_id,
                                    internal_user_id=internal_user_id,
                                    request_id=request_id
                                )

                                # Task 2: Resolve tenant_id from workspace membership if not in JWT
                                if not resolved_tenant_id:
                                    try:
                                        user_uuid = uuid.UUID(internal_user_id)
                                        tenant_id_obj = get_user_tenant_id(resolution_db, user_uuid)

                                        if tenant_id_obj:
                                            resolved_tenant_id = str(tenant_id_obj)
                                            span.set_attribute("rls.tenant_id_from_workspace", True)
                                            span.set_attribute("rls.tenant_id", resolved_tenant_id)

                                            logger.info(
                                                "Resolved tenant_id from workspace membership",
                                                user_id=internal_user_id,
                                                tenant_id=resolved_tenant_id,
                                                request_id=request_id
                                            )
                                        else:
                                            span.set_attribute("rls.tenant_resolution_failed", True)
                                            logger.warning(
                                                "User has no active workspace membership",
                                                user_id=internal_user_id,
                                                request_id=request_id
                                            )

                                    except Exception as tenant_resolution_exc:
                                        span.record_exception(tenant_resolution_exc)
                                        span.set_attribute("rls.tenant_resolution_error", True)
                                        logger.error(
                                            "Failed to resolve tenant_id from workspace",
                                            user_id=internal_user_id,
                                            error_type=type(tenant_resolution_exc).__name__,
                                            error_details=str(tenant_resolution_exc),
                                            request_id=request_id
                                        )
                                        # Continue without tenant context
                                else:
                                    # Tenant ID was in JWT
                                    span.set_attribute("rls.tenant_id_from_jwt", True)
                                    span.set_attribute("rls.tenant_id", resolved_tenant_id)

                        except Exception as user_resolution_exc:
                            span.record_exception(user_resolution_exc)
                            span.set_attribute("rls.user_resolution_failed", True)
                            logger.warning(
                                "Failed to resolve internal user_id for RLS context",
                                clerk_user_id=auth_context.user_id,
                                error_type=type(user_resolution_exc).__name__,
                                error_details=str(user_resolution_exc),
                                request_id=request_id
                            )
                            # Continue without user context rather than failing the request

                    # Set context variables with resolved values
                    if internal_user_id:
                        USER_ID_CTX.reset(user_token)
                        user_token = USER_ID_CTX.set(internal_user_id)
                        span.set_attribute("rls.user_id_set", True)

                    if resolved_tenant_id:
                        TENANT_ID_CTX.reset(tenant_token)
                        tenant_token = TENANT_ID_CTX.set(resolved_tenant_id)
                        span.set_attribute("rls.tenant_id_set", True)

                    # Set correlation context for logging with resolved IDs
                    set_correlation_context(
                        request_id=request_id,
                        user_id=internal_user_id,
                        tenant_id=resolved_tenant_id
                    )

                    logger.info(
                        "RLS context extracted and resolved",
                        request_id=request_id,
                        has_user_context=internal_user_id is not None,
                        has_tenant_context=resolved_tenant_id is not None,
                        user_id_valid=_is_valid_uuid(internal_user_id) if internal_user_id else False,
                        tenant_id_valid=_is_valid_uuid(resolved_tenant_id) if resolved_tenant_id else False
                    )

                except HTTPException:
                    # Invalid or expired token - continue without RLS context
                    span.set_attribute("rls.jwt_verification_failed", True)
                    logger.debug(
                        "JWT verification failed, proceeding without RLS context",
                        request_id=request_id
                    )

                except Exception as exc:
                    # Unexpected error during token processing
                    span.record_exception(exc)
                    span.set_attribute("rls.jwt_processing_error", True)
                    logger.warning(
                        "Unexpected error processing JWT for RLS context",
                        request_id=request_id,
                        error_type=type(exc).__name__
                    )

            # Fallback to header-based context for backward compatibility
            else:
                header_user_id = request.headers.get("X-User-Id")
                header_tenant_id = request.headers.get("X-Tenant-Id")
                header_role = request.headers.get("X-Role")

                if header_user_id:
                    USER_ID_CTX.reset(user_token)
                    user_token = USER_ID_CTX.set(header_user_id)
                    span.set_attribute("rls.user_id_from_header", True)

                if header_tenant_id:
                    TENANT_ID_CTX.reset(tenant_token)
                    tenant_token = TENANT_ID_CTX.set(header_tenant_id)
                    span.set_attribute("rls.tenant_id_from_header", True)

                if header_role:
                    ROLE_CTX.reset(role_token)
                    role_token = ROLE_CTX.set(header_role)
                    span.set_attribute("rls.role_from_header", True)

                if header_user_id or header_tenant_id or header_role:
                    set_correlation_context(
                        request_id=request_id,
                        user_id=header_user_id,
                        tenant_id=header_tenant_id
                    )

                    logger.debug(
                        "RLS context extracted from headers (fallback)",
                        request_id=request_id,
                        has_user_context=header_user_id is not None,
                        has_tenant_context=header_tenant_id is not None,
                        has_role_context=header_role is not None
                    )

            # Process the request
            response = await call_next(request)
            span.set_attribute("rls.request_completed", True)
            return response

        finally:
            # Always reset context variables to prevent leakage
            try:
                USER_ID_CTX.reset(user_token)
                TENANT_ID_CTX.reset(tenant_token)
                ROLE_CTX.reset(role_token)
            except Exception as exc:
                # Log context reset failures but don't raise
                logger.error(
                    "Failed to reset RLS context variables",
                    request_id=request_id,
                    error_type=type(exc).__name__
                )


def get_current_security_context() -> dict[str, str | None]:
    """Get the current RLS security context for the request.

    Returns:
        Dict with current user_id, tenant_id, and role from context variables.
        Useful for debugging and manual RLS policy testing.
    """
    return {
        "user_id": USER_ID_CTX.get(),
        "tenant_id": TENANT_ID_CTX.get(),
        "role": ROLE_CTX.get()
    }
