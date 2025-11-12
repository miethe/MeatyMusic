"""Enhanced JWT context extraction supporting dual user/tenant context."""
from __future__ import annotations

import logging
import asyncio
from typing import Dict, Any, Optional, Set
from uuid import UUID
from sqlalchemy.orm import Session
import functools

import structlog
from fastapi import HTTPException, status

from app.core.security import (
    SecurityContext,
    create_user_context,
    create_tenant_context,
    create_dual_context
)
from auth.jwks import verify_token
from app.models.user import UserORM

logger = structlog.get_logger(__name__)


class JWTContextExtractor:
    """Enhanced JWT context extraction supporting dual user/tenant context.

    This extractor handles the complexities of extracting both user and tenant
    contexts from Clerk JWT tokens, with support for multiple tenant ID locations
    and graceful degradation when tenant context is unavailable.
    """

    def __init__(self, issuer: str, audience: Optional[str] = None):
        """Initialize the extractor with JWT validation parameters.

        Args:
            issuer: Expected JWT issuer
            audience: Expected JWT audience (optional)
        """
        self.issuer = issuer
        self.audience = audience

    def _timeout_wrapper(self, func, timeout_seconds=15):
        """Wrap a function with timeout handling."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                # For sync functions, we can't use asyncio.wait_for directly
                # but we can catch the HTTPExceptions from JWKS timeouts
                return func(*args, **kwargs)
            except HTTPException as e:
                # If it's a 503 from JWKS service, convert to more user-friendly error
                if e.status_code == 503:
                    logger.warning(f"Authentication service timeout: {e.detail}")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Authentication service temporarily unavailable"
                    )
                raise
        return wrapper

    def extract_security_context(self, token: str, db: Optional[Session] = None) -> SecurityContext:
        """Extract complete security context from JWT token.

        Args:
            token: Raw JWT token string
            db: Optional database session for user lookup

        Returns:
            SecurityContext with extracted user/tenant information

        Raises:
            HTTPException: If token is invalid or required claims are missing
        """
        # Step 1: Verify and decode JWT token with timeout handling
        try:
            # Wrap verify_token with timeout handling
            verify_func = self._timeout_wrapper(verify_token)
            payload = verify_func(
                token,
                issuer=self.issuer,
                audience=self.audience,
            )
            logger.debug("JWT token verified successfully", token_length=len(token))
        except HTTPException:
            # Re-raise HTTP exceptions from token verification
            raise
        except Exception as e:
            logger.error("JWT verification failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
            )

        # Step 2: Build security context; non-auth failures should not be 401
        try:
            user_id = self._extract_user_id(payload, db)
            tenant_id = self._extract_tenant_id(payload)
            permissions = self._extract_permissions(payload)
            scope = self._determine_scope(payload, tenant_id)

            if tenant_id:
                security_context = create_dual_context(
                    user_id=user_id,
                    tenant_id=tenant_id,
                    permissions=permissions,
                )
                if scope:
                    security_context = security_context.with_scope(scope)
            else:
                security_context = create_user_context(
                    user_id=user_id,
                    permissions=permissions,
                )
                if scope:
                    security_context = security_context.with_scope(scope)

            logger.info(
                "Security context extracted",
                user_id=str(user_id),
                tenant_id=str(tenant_id) if tenant_id else None,
                scope=security_context.scope,
                permissions_count=len(permissions),
            )
            return security_context
        except HTTPException:
            # Respect explicit HTTP errors (e.g., missing user/tenant context)
            raise
        except Exception as e:
            logger.error("Security context construction failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            )

    def _extract_user_id(self, payload: Dict[str, Any], db: Optional[Session] = None) -> UUID:
        """Extract user ID from JWT payload.

        Args:
            payload: Decoded JWT payload
            db: Optional database session for user lookup

        Returns:
            User UUID

        Raises:
            HTTPException: If user ID cannot be extracted
        """
        # Debug: Log all available claims in the JWT payload
        logger.warning(
            "JWT payload claims for debugging",
            available_claims=list(payload.keys()),
            payload_sample={k: v for k, v in payload.items() if k in ['sub', 'user_id', 'clerk_user_id', 'iss', 'aud']}
        )

        # Try multiple locations for user ID
        user_id_candidates = [
            payload.get('user_id'),
            payload.get('sub'),  # Standard subject claim
            payload.get('clerk_user_id')
        ]

        logger.warning(
            "User ID extraction candidates",
            candidates=[str(c) for c in user_id_candidates if c is not None]
        )

        for candidate in user_id_candidates:
            if candidate:
                # If it looks like a Clerk user ID and we have a database session, look it up
                if isinstance(candidate, str) and candidate.startswith('user_') and db:
                    user = db.query(UserORM).filter_by(clerk_user_id=candidate).first()
                    if user:
                        logger.info(
                            "Found user in database",
                            clerk_user_id=candidate,
                            user_id=str(user.id)
                        )
                        return user.id

                # Try to convert to UUID normally
                try:
                    return UUID(candidate)
                except (ValueError, TypeError):
                    logger.warning(
                        "Invalid user ID format",
                        candidate=str(candidate),
                        type=type(candidate).__name__
                    )
                    continue

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user ID not found or invalid"
        )

    def _extract_tenant_id(self, payload: Dict[str, Any]) -> Optional[UUID]:
        """Extract tenant ID from JWT payload.

        Clerk JWT tokens may include tenant/organization information in various
        locations depending on configuration and token type.

        Args:
            payload: Decoded JWT payload

        Returns:
            Tenant UUID if available, None otherwise
        """
        # Try multiple locations for tenant ID
        tenant_id_candidates = [
            # Primary organization ID from Clerk
            payload.get('org_id'),
            payload.get('organization_id'),
            # Custom tenant ID in metadata
            payload.get('tenant_id'),
            # Nested in user metadata
            payload.get('user_metadata', {}).get('tenant_id'),
            # Custom public metadata
            payload.get('public_metadata', {}).get('tenant_id'),
            # Private metadata (if accessible)
            payload.get('private_metadata', {}).get('tenant_id')
        ]

        for candidate in tenant_id_candidates:
            if candidate:
                try:
                    tenant_id = UUID(candidate)
                    logger.debug(
                        "Tenant context found",
                        tenant_id=str(tenant_id),
                        source="jwt_claims"
                    )
                    return tenant_id
                except (ValueError, TypeError):
                    logger.debug(
                        "Invalid tenant ID format, skipping",
                        candidate=str(candidate),
                        type=type(candidate).__name__
                    )
                    continue

        logger.debug("No tenant context available in JWT")
        return None

    def _extract_permissions(self, payload: Dict[str, Any]) -> Set[str]:
        """Extract permissions from JWT payload.

        Args:
            payload: Decoded JWT payload

        Returns:
            Set of permission strings
        """
        permissions = set()

        # Try multiple permission sources
        permission_sources = [
            payload.get('permissions', []),
            payload.get('roles', []),
            payload.get('scope', '').split() if payload.get('scope') else [],
            payload.get('user_metadata', {}).get('permissions', []),
            payload.get('public_metadata', {}).get('permissions', [])
        ]

        for source in permission_sources:
            if isinstance(source, list):
                permissions.update(source)
            elif isinstance(source, str):
                permissions.add(source)

        # Filter out empty strings
        permissions = {p for p in permissions if p}

        logger.debug(
            "Permissions extracted",
            permissions=list(permissions),
            count=len(permissions)
        )

        return permissions

    def _determine_scope(self, payload: Dict[str, Any], tenant_id: Optional[UUID]) -> Optional[str]:
        """Determine the appropriate security scope based on token claims.

        Args:
            payload: Decoded JWT payload
            tenant_id: Extracted tenant ID

        Returns:
            Scope string or None
        """
        # Check for explicit scope in token
        explicit_scope = payload.get('scope')
        if explicit_scope:
            return explicit_scope

        # Determine scope based on available context
        if tenant_id:
            return "tenant"
        else:
            return "user"
