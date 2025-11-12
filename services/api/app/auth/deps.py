"""Authentication dependencies for FastAPI dependency injection.

This module provides FastAPI dependencies for extracting and validating
authentication context from requests.
"""

from __future__ import annotations

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.providers import AuthContext, get_auth_provider


# HTTP Bearer token security scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_auth_context(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[AuthContext]:
    """Extract authentication context from request.

    This is an optional dependency - returns None if no auth token is provided.

    Args:
        credentials: HTTP Bearer credentials from request header

    Returns:
        AuthContext if authenticated, None otherwise

    Raises:
        HTTPException: If token is provided but invalid
    """
    if not credentials:
        return None

    try:
        provider = get_auth_provider()
        claims = await provider.verify_token(credentials.credentials)

        return AuthContext(
            user_id=claims.get("sub", ""),
            email=claims.get("email", ""),
            claims=claims,
            provider="clerk",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_auth_context(
    auth_context: Optional[AuthContext] = Depends(get_auth_context),
) -> AuthContext:
    """Require authentication context (non-optional).

    Use this dependency when authentication is required.

    Args:
        auth_context: AuthContext from get_auth_context dependency

    Returns:
        AuthContext

    Raises:
        HTTPException: If not authenticated
    """
    if not auth_context:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return auth_context


async def get_current_user_id(
    auth_context: AuthContext = Depends(require_auth_context),
) -> str:
    """Get current user ID from auth context.

    Args:
        auth_context: AuthContext from require_auth_context dependency

    Returns:
        User ID string
    """
    return auth_context.user_id
