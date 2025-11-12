"""Security-aware FastAPI dependencies for dual context authentication."""
from __future__ import annotations

from typing import Annotated, Optional
from uuid import UUID

import structlog
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db_session
from app.core.async_database import get_async_db_session
from app.core.security import SecurityContext, RepositoryFactory
from app.core.security.exceptions import SecurityContextError
from app.core.auth import JWTContextExtractor
from auth.providers.base import AuthContext, AuthProvider
from auth.deps import get_auth_provider
from app.models.user import UserORM
from auth.jwks import verify_token

logger = structlog.get_logger(__name__)
security = HTTPBearer(auto_error=False)


async def get_current_user_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """Extract JWT token from Authorization header.

    Supports development auth bypass via X-Dev-Auth-Bypass header.

    Returns:
        Raw JWT token string, or DEV_BYPASS_TOKEN marker for dev bypass

    Raises:
        HTTPException: If no token is provided and dev bypass is not active
    """
    # Development bypass check (secure by environment validation in settings)
    if settings.DEV_AUTH_BYPASS_ENABLED:
        bypass_header = request.headers.get("X-Dev-Auth-Bypass")
        if bypass_header == settings.DEV_AUTH_BYPASS_SECRET:
            logger.warning(
                "dev_bypass_token_extracted",
                path=request.url.path,
                msg="⚠️  Development auth bypass token provided"
            )
            return "DEV_BYPASS_TOKEN"

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    return credentials.credentials


async def get_security_context(
    request: Request,
    token: Annotated[str, Depends(get_current_user_token)],
    db: Session = Depends(get_db_session)
) -> SecurityContext:
    """FastAPI dependency providing security context from JWT.

    Extracts both user and tenant contexts from Clerk JWT tokens, with graceful
    degradation when tenant context is unavailable.

    Supports development auth bypass mode.

    Args:
        request: FastAPI request object
        token: JWT token from Authorization header, or DEV_BYPASS_TOKEN marker
        db: Database session

    Returns:
        SecurityContext with extracted user/tenant information

    Raises:
        HTTPException: If token is invalid or user context cannot be extracted
    """
    # Handle development bypass
    if token == "DEV_BYPASS_TOKEN":
        dev_user_id = UUID(settings.DEV_AUTH_BYPASS_USER_ID)

        # Try to find existing dev user
        user = db.query(UserORM).filter(UserORM.id == dev_user_id).first()

        if not user:
            # Create dev user if it doesn't exist
            logger.warning(
                "dev_bypass_user_creation",
                user_id=str(dev_user_id),
                msg="Creating development bypass user"
            )
            user = UserORM(
                id=dev_user_id,
                clerk_user_id="dev_bypass_user",
                email="dev@meatyprompts.local",
                username="dev_bypass_user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Return security context with dev user (no tenant context)
        security_context = SecurityContext(
            user_id=dev_user_id,
            tenant_id=None,
            permissions=set(),
            scope="user",
            metadata={"dev_bypass": True}
        )

        logger.warning(
            "dev_bypass_security_context",
            user_id=str(dev_user_id),
            path=request.url.path,
            request_id=getattr(request.state, 'request_id', None),
            msg="⚠️  Development auth bypass security context created"
        )

        return security_context

    try:
        # Create JWT context extractor
        extractor = JWTContextExtractor(
            issuer=settings.CLERK_JWT_ISSUER,
            audience=None  # Clerk doesn't require audience validation
        )

        # Extract security context from JWT with enhanced error handling
        security_context = extractor.extract_security_context(token, db)

        logger.info(
            "Security context extracted via dependency",
            user_id=str(security_context.user_id) if security_context.user_id else None,
            tenant_id=str(security_context.tenant_id) if security_context.tenant_id else None,
            scope=security_context.scope,
            request_id=getattr(request.state, 'request_id', None)
        )

        return security_context

    except HTTPException as e:
        # Log the authentication failure with request context
        logger.warning(
            "Authentication failed in security context dependency",
            status_code=e.status_code,
            detail=e.detail,
            request_id=getattr(request.state, 'request_id', None),
            path=request.url.path,
            method=request.method
        )
        raise
    except Exception as e:
        # Log unexpected errors and convert to proper HTTP exception
        logger.error(
            "Unexpected error in security context dependency",
            error=str(e),
            error_type=type(e).__name__,
            request_id=getattr(request.state, 'request_id', None),
            path=request.url.path,
            method=request.method
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal authentication error"
        )


async def get_security_context_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db_session)
) -> Optional[SecurityContext]:
    """Optional security context dependency that doesn't raise on missing auth.

    Args:
        request: FastAPI request object
        credentials: Optional authorization credentials
        db: Database session

    Returns:
        SecurityContext if valid token provided, None otherwise
    """
    if not credentials:
        return None

    try:
        extractor = JWTContextExtractor(
            issuer=settings.CLERK_JWT_ISSUER,
            audience=None  # Clerk doesn't require audience validation
        )
        return extractor.extract_security_context(credentials.credentials, db)
    except HTTPException:
        logger.debug("Invalid token in optional security context")
        return None


async def get_user_context(
    security_context: Annotated[SecurityContext, Depends(get_security_context)]
) -> SecurityContext:
    """Dependency ensuring user context is available.

    Args:
        security_context: Extracted security context

    Returns:
        SecurityContext with validated user context

    Raises:
        HTTPException: If user context is not available
    """
    try:
        security_context.requires_user_context()
    except SecurityContextError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User context required: {str(e)}"
        )

    return security_context


async def get_tenant_context(
    security_context: Annotated[SecurityContext, Depends(get_security_context)]
) -> SecurityContext:
    """Dependency ensuring tenant context is available.

    Args:
        security_context: Extracted security context

    Returns:
        SecurityContext with validated tenant context

    Raises:
        HTTPException: If tenant context is not available
    """
    try:
        security_context.requires_tenant_context()
    except SecurityContextError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant context required: {str(e)}"
        )

    return security_context


def require_permission(permission: str):
    """Create a dependency that requires a specific permission.

    Args:
        permission: Required permission string

    Returns:
        Dependency function
    """
    async def check_permission(
        security_context: Annotated[SecurityContext, Depends(get_security_context)]
    ) -> SecurityContext:
        try:
            security_context.requires_permission(permission)
        except SecurityContextError as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required: {str(e)}"
            )
        return security_context

    return check_permission


# Legacy compatibility: provide get_current_user that returns UserORM
async def get_current_user_with_context(
    security_context: Annotated[SecurityContext, Depends(get_user_context)],
    db: Annotated[Session, Depends(get_db_session)],
    provider: Annotated[AuthProvider, Depends(get_auth_provider)]
) -> tuple[UserORM, SecurityContext]:
    """Get current user ORM object along with security context.

    This dependency provides both the UserORM (for backward compatibility)
    and the SecurityContext for new security-aware code.

    Args:
        security_context: Validated security context
        db: Database session
        provider: Authentication provider

    Returns:
        Tuple of (UserORM, SecurityContext)
    """
    # Create a minimal AuthContext for the provider
    auth_context = AuthContext(
        subject=str(security_context.user_id),
        email=None,  # We don't have email in SecurityContext
        name=None,   # We don't have name in SecurityContext
        avatar_url=None,  # We don't have avatar in SecurityContext
        user_id=str(security_context.user_id),
        tenant_id=str(security_context.tenant_id) if security_context.tenant_id else None,
        permissions=security_context.permissions,
        scope=security_context.scope
    )

    # Resolve user through provider
    user = provider.resolve_user(db, auth_context)

    return user, security_context


async def get_current_user_legacy(
    user_and_context: Annotated[tuple[UserORM, SecurityContext], Depends(get_current_user_with_context)]
) -> UserORM:
    """Legacy dependency that returns only UserORM for backward compatibility.

    Args:
        user_and_context: Tuple from get_current_user_with_context

    Returns:
        UserORM object
    """
    return user_and_context[0]


async def get_repository_factory(
    db: Annotated[Session, Depends(get_db_session)]
) -> RepositoryFactory:
    """FastAPI dependency providing repository factory.

    Args:
        db: Database session

    Returns:
        RepositoryFactory instance
    """
    return RepositoryFactory(db=db)


async def get_async_repository_factory(
    db: Annotated[AsyncSession, Depends(get_async_db_session)]
) -> RepositoryFactory:
    """FastAPI dependency providing async repository factory.

    Args:
        db: Async database session

    Returns:
        RepositoryFactory instance with async session
    """
    return RepositoryFactory(db=db)


async def get_current_user_with_context_async(
    request: Request,
    token: Annotated[str, Depends(get_current_user_token)],
    provider: Annotated[AuthProvider, Depends(get_auth_provider)]
) -> tuple[UserORM, SecurityContext]:
    """Get current user ORM object along with security context (async-compatible version).

    This dependency provides both the UserORM (for backward compatibility)
    and the SecurityContext for use in async endpoints. It creates a sync
    database session internally only for the authentication lookup, keeping
    the dependency chain fully async-compatible.

    This version bypasses the nested sync dependencies by directly extracting
    the security context and user information without requiring a sync Session
    in the dependency chain.

    Args:
        request: FastAPI request object
        token: JWT token from Authorization header
        provider: Authentication provider

    Returns:
        Tuple of (UserORM, SecurityContext)

    Raises:
        HTTPException: If authentication fails or user context is invalid
    """
    # Import SessionLocal here to avoid dependency injection issues
    from app.db.session import SessionLocal

    # Use context manager for proper session handling
    with SessionLocal() as db:
        # Handle development bypass
        if token == "DEV_BYPASS_TOKEN":
            dev_user_id = UUID(settings.DEV_AUTH_BYPASS_USER_ID)

            # Try to find existing dev user
            user = db.query(UserORM).filter(UserORM.id == dev_user_id).first()

            if not user:
                # Create dev user if it doesn't exist
                logger.warning(
                    "dev_bypass_user_creation_async",
                    user_id=str(dev_user_id),
                    msg="Creating development bypass user (async)"
                )
                user = UserORM(
                    id=dev_user_id,
                    clerk_user_id="dev_bypass_user",
                    email="dev@meatyprompts.local",
                    username="dev_bypass_user"
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Return security context with dev user (no tenant context)
            security_context = SecurityContext(
                user_id=dev_user_id,
                tenant_id=None,
                permissions=set(),
                scope="user",
                metadata={"dev_bypass": True}
            )

            logger.warning(
                "dev_bypass_security_context_async",
                user_id=str(dev_user_id),
                path=request.url.path,
                request_id=getattr(request.state, 'request_id', None),
                msg="⚠️  Development auth bypass security context created (async)"
            )

            return user, security_context

        try:
            # Create JWT context extractor
            extractor = JWTContextExtractor(
                issuer=settings.CLERK_JWT_ISSUER,
                audience=None  # Clerk doesn't require audience validation
            )

            # Extract security context from JWT with enhanced error handling
            security_context = extractor.extract_security_context(token, db)

            # Validate that we have user context
            try:
                security_context.requires_user_context()
            except SecurityContextError as e:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User context required: {str(e)}"
                )

            logger.info(
                "Security context extracted via async dependency",
                user_id=str(security_context.user_id) if security_context.user_id else None,
                tenant_id=str(security_context.tenant_id) if security_context.tenant_id else None,
                scope=security_context.scope,
                request_id=getattr(request.state, 'request_id', None)
            )

            # Create a minimal AuthContext for the provider
            auth_context = AuthContext(
                subject=str(security_context.user_id),
                email=None,  # We don't have email in SecurityContext
                name=None,   # We don't have name in SecurityContext
                avatar_url=None,  # We don't have avatar in SecurityContext
                user_id=str(security_context.user_id),
                tenant_id=str(security_context.tenant_id) if security_context.tenant_id else None,
                permissions=security_context.permissions,
                scope=security_context.scope
            )

            # Resolve user through provider (synchronous operation)
            user = provider.resolve_user(db, auth_context)

            return user, security_context

        except HTTPException as e:
            # Log the authentication failure with request context
            logger.warning(
                "Authentication failed in async security context dependency",
                status_code=e.status_code,
                detail=e.detail,
                request_id=getattr(request.state, 'request_id', None),
                path=request.url.path,
                method=request.method
            )
            raise
        except Exception as e:
            # Log unexpected errors and convert to proper HTTP exception
            logger.error(
                "Unexpected error in async security context dependency",
                error=str(e),
                error_type=type(e).__name__,
                request_id=getattr(request.state, 'request_id', None),
                path=request.url.path,
                method=request.method
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal authentication error"
            )
