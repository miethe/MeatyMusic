"""Authentication provider implementations.

This module provides authentication provider implementations for different
auth services (Clerk, Auth0, etc.).
"""

from __future__ import annotations

from typing import Protocol, Dict, Any
from abc import abstractmethod
from dataclasses import dataclass


@dataclass
class AuthContext:
    """Authentication context containing user information.

    Attributes:
        user_id: User identifier from auth provider
        email: User email address
        claims: Full JWT claims dictionary
        provider: Authentication provider name
    """

    user_id: str
    email: str
    claims: Dict[str, Any]
    provider: str = "clerk"

    @property
    def is_authenticated(self) -> bool:
        """Check if user is authenticated."""
        return bool(self.user_id)


class AuthProvider(Protocol):
    """Protocol for authentication providers."""

    @abstractmethod
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify an authentication token.

        Args:
            token: Authentication token

        Returns:
            Decoded claims from the token

        Raises:
            AuthenticationError: If token is invalid
        """
        ...

    @abstractmethod
    async def get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get user information from the provider.

        Args:
            user_id: User identifier

        Returns:
            User information dictionary

        Raises:
            AuthenticationError: If user lookup fails
        """
        ...


class ClerkProvider:
    """Clerk authentication provider implementation."""

    def __init__(self, jwks_url: str, issuer: str, api_key: str | None = None):
        """Initialize Clerk provider.

        Args:
            jwks_url: URL to Clerk JWKS endpoint
            issuer: Expected JWT issuer
            api_key: Clerk API key for backend operations
        """
        self.jwks_url = jwks_url
        self.issuer = issuer
        self.api_key = api_key

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify a Clerk JWT token.

        Args:
            token: JWT token from Clerk

        Returns:
            Decoded claims

        Raises:
            AuthenticationError: If token is invalid
        """
        # Import here to avoid circular dependency
        from app.auth.jwks import verify_token as jwks_verify

        return await jwks_verify(token)

    async def get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get user information from Clerk API.

        Args:
            user_id: Clerk user ID

        Returns:
            User information

        Raises:
            AuthenticationError: If user lookup fails
        """
        # TODO: Implement Clerk API call
        # For now, return minimal info
        return {
            "user_id": user_id,
            "provider": "clerk",
        }


# Global provider instance
_provider: AuthProvider | None = None


def get_auth_provider() -> AuthProvider:
    """Get the global authentication provider.

    Returns:
        AuthProvider instance

    Raises:
        RuntimeError: If provider is not initialized
    """
    if _provider is None:
        raise RuntimeError("Authentication provider not initialized")
    return _provider


def initialize_provider(provider: AuthProvider) -> None:
    """Initialize the global authentication provider.

    Args:
        provider: AuthProvider instance to use globally
    """
    global _provider
    _provider = provider
