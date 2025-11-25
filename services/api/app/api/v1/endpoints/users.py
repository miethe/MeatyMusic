"""API endpoints for User management.

Provides endpoints for retrieving and managing user profile information.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_legacy
from app.models.user import UserORM
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's profile information",
    responses={
        200: {"description": "User profile retrieved successfully"},
        401: {"description": "Not authenticated"},
    },
)
async def get_current_user(
    user: UserORM = Depends(get_current_user_legacy),
) -> UserResponse:
    """Get current authenticated user's profile.

    Returns the profile of the currently authenticated user based on
    the authentication token (or dev bypass in development mode).

    Args:
        user: Current authenticated user from dependency injection

    Returns:
        UserResponse with user profile data
    """
    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        email_verified=user.email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
    )
