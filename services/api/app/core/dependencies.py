"""Security-aware FastAPI dependencies for dual context authentication.

SIMPLIFIED FOR MVP: This version uses ONLY dev bypass authentication.
Production JWT/Clerk authentication has been removed to unblock MVP development.

TODO (Future): Add production authentication here:
  1. Restore JWT token validation (Clerk, Auth0, or custom)
  2. Add proper JWKS verification
  3. Implement user/tenant extraction from JWT claims
  4. Add proper error handling for invalid tokens
"""
from __future__ import annotations

from typing import Annotated, Optional
from uuid import UUID

import structlog
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db_session
# from app.core.async_database import get_async_db_session  # Not used - commented to avoid asyncpg dependency
from app.core.security import SecurityContext, RepositoryFactory
from app.core.security.exceptions import SecurityContextError
from app.models.user import UserORM

logger = structlog.get_logger(__name__)


async def get_current_user_token(
    request: Request,
) -> str:
    """Extract authentication token from request.

    MVP SIMPLIFIED: Automatically bypasses auth in dev mode (no header required).

    TODO (Future): Add JWT Bearer token extraction from Authorization header

    Returns:
        DEV_BYPASS_TOKEN marker for dev bypass

    Raises:
        HTTPException: If authentication is required but dev bypass is not enabled
    """
    # Development bypass check - automatic when enabled
    if settings.DEV_AUTH_BYPASS_ENABLED:
        logger.debug(
            "dev_bypass_token_auto",
            path=request.url.path,
            msg="Development auth bypass automatically applied"
        )
        return "DEV_BYPASS_TOKEN"

    # No JWT validation in MVP - require dev bypass to be enabled
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Enable DEV_AUTH_BYPASS_ENABLED in development mode."
    )


async def get_security_context(
    request: Request,
    token: Annotated[str, Depends(get_current_user_token)],
    db: Session = Depends(get_db_session)
) -> SecurityContext:
    """FastAPI dependency providing security context.

    MVP SIMPLIFIED: Only supports development auth bypass mode.
    Creates/reuses default tenant and dev user.

    TODO (Future): Add JWT token validation and user/tenant extraction from claims

    Args:
        request: FastAPI request object
        token: DEV_BYPASS_TOKEN marker (only option in MVP)
        db: Database session

    Returns:
        SecurityContext with dev user/tenant information

    Raises:
        HTTPException: If authentication fails
    """
    # MVP: Only dev bypass is supported
    if token == "DEV_BYPASS_TOKEN":
        from app.models.tenant import TenantORM

        try:
            dev_user_id = UUID(settings.DEV_AUTH_BYPASS_USER_ID)
        except ValueError as e:
            logger.error(
                "invalid_dev_bypass_user_id",
                value=settings.DEV_AUTH_BYPASS_USER_ID,
                error=str(e),
                msg="DEV_AUTH_BYPASS_USER_ID must be a valid UUID format"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid DEV_AUTH_BYPASS_USER_ID configuration: {str(e)}"
            )
        dev_tenant_id = UUID("00000000-0000-0000-0000-000000000001")

        # Ensure default tenant exists
        tenant = db.query(TenantORM).filter(TenantORM.id == dev_tenant_id).first()
        if not tenant:
            logger.warning(
                "dev_bypass_tenant_creation",
                tenant_id=str(dev_tenant_id),
                msg="Creating development bypass tenant"
            )
            tenant = TenantORM(
                id=dev_tenant_id,
                name="dev-default",
                display_name="Development Default",
                slug="dev-default",
                description="Default tenant for development bypass mode",
                is_active=True,
                is_trial=False
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

        # Try to find existing dev user
        user = db.query(UserORM).filter(UserORM.id == dev_user_id).first()

        if not user:
            # Create dev user if it doesn't exist
            logger.warning(
                "dev_bypass_user_creation",
                user_id=str(dev_user_id),
                tenant_id=str(dev_tenant_id),
                msg="Creating development bypass user"
            )
            user = UserORM(
                id=dev_user_id,
                tenant_id=dev_tenant_id,
                clerk_user_id="dev_bypass_user",
                email="dev@meatymusic.local",
                username="dev_bypass_user",
                is_active=True,
                email_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Return security context with dev user and tenant
        security_context = SecurityContext(
            user_id=dev_user_id,
            tenant_id=dev_tenant_id,
            permissions=set(),
            scope="tenant",
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

    # TODO (Future): Add production JWT validation here
    # Example implementation:
    # try:
    #     extractor = JWTContextExtractor(issuer=settings.JWT_ISSUER, audience=settings.JWT_AUDIENCE)
    #     security_context = extractor.extract_security_context(token, db)
    #     logger.info("Security context extracted", user_id=str(security_context.user_id))
    #     return security_context
    # except Exception as e:
    #     logger.error("JWT validation failed", error=str(e))
    #     raise HTTPException(status_code=401, detail="Invalid token")

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Production authentication not yet implemented"
    )


async def get_security_context_optional(
    request: Request,
    db: Session = Depends(get_db_session)
) -> Optional[SecurityContext]:
    """Optional security context dependency that doesn't raise on missing auth.

    MVP SIMPLIFIED: Automatically provides context if dev bypass enabled.

    TODO (Future): Add optional JWT token validation

    Args:
        request: FastAPI request object
        db: Database session

    Returns:
        SecurityContext if dev bypass active, None otherwise
    """
    # Check for dev bypass - automatic when enabled
    if settings.DEV_AUTH_BYPASS_ENABLED:
        try:
            token = await get_current_user_token(request)
            return await get_security_context(request, token, db)
        except HTTPException:
            logger.debug("Dev bypass enabled but context creation failed")
            return None

    # TODO (Future): Add JWT token validation
    # Example:
    # try:
    #     token = request.headers.get("Authorization", "").replace("Bearer ", "")
    #     if token:
    #         extractor = JWTContextExtractor(issuer=settings.JWT_ISSUER)
    #         return extractor.extract_security_context(token, db)
    # except Exception:
    #     pass

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
    db: Annotated[Session, Depends(get_db_session)]
) -> tuple[UserORM, SecurityContext]:
    """Get current user ORM object along with security context.

    This dependency provides both the UserORM (for backward compatibility)
    and the SecurityContext for new security-aware code.

    MVP SIMPLIFIED: Directly queries user by ID from security context.

    TODO (Future): Add AuthProvider integration for user resolution

    Args:
        security_context: Validated security context
        db: Database session

    Returns:
        Tuple of (UserORM, SecurityContext)

    Raises:
        HTTPException: If user not found
    """
    # Directly query user by ID from security context
    user = db.query(UserORM).filter(UserORM.id == security_context.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {security_context.user_id} not found"
        )

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


# Commented out - async repository factory not currently used, avoids asyncpg dependency
# async def get_async_repository_factory(
#     db: Annotated[AsyncSession, Depends(get_async_db_session)]
# ) -> RepositoryFactory:
#     """FastAPI dependency providing async repository factory.
#
#     Args:
#         db: Async database session
#
#     Returns:
#         RepositoryFactory instance with async session
#     """
#     return RepositoryFactory(db=db)


async def get_current_user_with_context_async(
    request: Request,
    token: Annotated[str, Depends(get_current_user_token)]
) -> tuple[UserORM, SecurityContext]:
    """Get current user ORM object along with security context (async-compatible version).

    This dependency provides both the UserORM (for backward compatibility)
    and the SecurityContext for use in async endpoints. It creates a sync
    database session internally only for the authentication lookup, keeping
    the dependency chain fully async-compatible.

    MVP SIMPLIFIED: Only supports dev bypass authentication.

    TODO (Future): Add JWT token validation and user resolution

    Args:
        request: FastAPI request object
        token: DEV_BYPASS_TOKEN marker (only option in MVP)

    Returns:
        Tuple of (UserORM, SecurityContext)

    Raises:
        HTTPException: If authentication fails or user context is invalid
    """
    # Import SessionLocal here to avoid dependency injection issues
    from app.db.session import SessionLocal

    # Use context manager for proper session handling
    with SessionLocal() as db:
        # MVP: Only dev bypass is supported
        if token == "DEV_BYPASS_TOKEN":
            from app.models.tenant import TenantORM

            try:
                dev_user_id = UUID(settings.DEV_AUTH_BYPASS_USER_ID)
            except ValueError as e:
                logger.error(
                    "invalid_dev_bypass_user_id",
                    value=settings.DEV_AUTH_BYPASS_USER_ID,
                    error=str(e),
                    msg="DEV_AUTH_BYPASS_USER_ID must be a valid UUID format"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Invalid DEV_AUTH_BYPASS_USER_ID configuration: {str(e)}"
                )
            dev_tenant_id = UUID("00000000-0000-0000-0000-000000000001")

            # Ensure default tenant exists
            tenant = db.query(TenantORM).filter(TenantORM.id == dev_tenant_id).first()
            if not tenant:
                logger.warning(
                    "dev_bypass_tenant_creation_async",
                    tenant_id=str(dev_tenant_id),
                    msg="Creating development bypass tenant (async)"
                )
                tenant = TenantORM(
                    id=dev_tenant_id,
                    name="dev-default",
                    display_name="Development Default",
                    slug="dev-default",
                    description="Default tenant for development bypass mode",
                    is_active=True,
                    is_trial=False
                )
                db.add(tenant)
                db.commit()
                db.refresh(tenant)

            # Try to find existing dev user
            user = db.query(UserORM).filter(UserORM.id == dev_user_id).first()

            if not user:
                # Create dev user if it doesn't exist
                logger.warning(
                    "dev_bypass_user_creation_async",
                    user_id=str(dev_user_id),
                    tenant_id=str(dev_tenant_id),
                    msg="Creating development bypass user (async)"
                )
                user = UserORM(
                    id=dev_user_id,
                    tenant_id=dev_tenant_id,
                    clerk_user_id="dev_bypass_user",
                    email="dev@meatymusic.local",
                    username="dev_bypass_user",
                    is_active=True,
                    email_verified=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Return security context with dev user and tenant
            security_context = SecurityContext(
                user_id=dev_user_id,
                tenant_id=dev_tenant_id,
                permissions=set(),
                scope="tenant",
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

        # TODO (Future): Add production JWT validation here
        # Example:
        # try:
        #     extractor = JWTContextExtractor(issuer=settings.JWT_ISSUER)
        #     security_context = extractor.extract_security_context(token, db)
        #     security_context.requires_user_context()
        #     user = db.query(UserORM).filter(UserORM.id == security_context.user_id).first()
        #     if not user:
        #         raise HTTPException(status_code=404, detail="User not found")
        #     return user, security_context
        # except Exception as e:
        #     logger.error("Authentication failed", error=str(e))
        #     raise HTTPException(status_code=401, detail="Invalid token")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Production authentication not yet implemented"
        )
