"""Authentication-related schemas and DTOs."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TokenVerificationRequest(BaseModel):
    """Request schema for token verification."""

    token: str = Field(..., description="JWT token to verify")


class TokenVerificationResponse(BaseModel):
    """Response schema for token verification."""

    valid: bool = Field(..., description="Whether the token is valid")
    user_id: Optional[str] = Field(None, description="User ID if token is valid")
    expires_at: Optional[datetime] = Field(None, description="Token expiration time")
    error: Optional[str] = Field(None, description="Error message if token is invalid")


class LogoutRequest(BaseModel):
    """Request schema for logout."""

    revoke_all_sessions: bool = Field(
        False,
        description="Whether to revoke all user sessions or just current one"
    )


class LogoutResponse(BaseModel):
    """Response schema for logout."""

    success: bool = Field(..., description="Whether logout was successful")
    message: str = Field(..., description="Success or error message")


class SessionStatusResponse(BaseModel):
    """Response schema for session status."""

    active: bool = Field(..., description="Whether session is active")
    user_id: Optional[str] = Field(None, description="User ID if session is active")
    expires_at: Optional[datetime] = Field(None, description="Session expiration time")
    time_to_expiry: Optional[int] = Field(
        None,
        description="Seconds until session expires"
    )
    needs_refresh: bool = Field(
        False,
        description="Whether session should be refreshed soon"
    )


class SessionRefreshRequest(BaseModel):
    """Request schema for session refresh."""

    force: bool = Field(
        False,
        description="Whether to force refresh even if not needed"
    )


class SessionRefreshResponse(BaseModel):
    """Response schema for session refresh."""

    success: bool = Field(..., description="Whether refresh was successful")
    new_token: Optional[str] = Field(None, description="New JWT token if successful")
    expires_at: Optional[datetime] = Field(None, description="New expiration time")
    error: Optional[str] = Field(None, description="Error message if refresh failed")


class AuthErrorResponse(BaseModel):
    """Standard auth error response schema."""

    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    retry_after: Optional[int] = Field(
        None,
        description="Seconds to wait before retrying (for rate limiting)"
    )


class RateLimitInfo(BaseModel):
    """Rate limiting information."""

    limit: int = Field(..., description="Request limit per window")
    remaining: int = Field(..., description="Requests remaining in current window")
    reset_at: datetime = Field(..., description="When the window resets")
    retry_after: Optional[int] = Field(
        None,
        description="Seconds to wait if rate limited"
    )
