"""JWT token verification using JWKS (JSON Web Key Set).

This module provides JWT token verification functionality using JWKS,
typically used with authentication providers like Clerk.
"""

from __future__ import annotations

from typing import Dict, Any
import httpx
from jose import jwt, jwk
from jose.exceptions import JWTError


class JWKSVerifier:
    """Verifies JWT tokens using JWKS."""

    def __init__(self, jwks_url: str, issuer: str, cache_ttl: int = 3600):
        """Initialize the JWKS verifier.

        Args:
            jwks_url: URL to fetch JWKS from
            issuer: Expected issuer in JWT claims
            cache_ttl: TTL for JWKS cache in seconds
        """
        self.jwks_url = jwks_url
        self.issuer = issuer
        self.cache_ttl = cache_ttl
        self._jwks_cache: Dict[str, Any] | None = None

    async def get_jwks(self) -> Dict[str, Any]:
        """Fetch JWKS from the provider.

        Returns:
            JWKS dictionary

        Raises:
            httpx.HTTPError: If fetching JWKS fails
        """
        # TODO: Implement caching and error handling
        async with httpx.AsyncClient() as client:
            response = await client.get(self.jwks_url)
            response.raise_for_status()
            return response.json()

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify a JWT token using JWKS.

        Args:
            token: JWT token string

        Returns:
            Decoded JWT claims

        Raises:
            JWTError: If token verification fails
        """
        # TODO: Implement full verification with key rotation support
        try:
            # This is a simplified implementation
            # Full implementation should:
            # 1. Fetch JWKS and cache it
            # 2. Find the correct key using kid from token header
            # 3. Verify signature, expiration, issuer, etc.
            return jwt.decode(
                token,
                {},  # keys would come from JWKS
                options={"verify_signature": False},  # Temporary for validation
            )
        except JWTError as e:
            raise JWTError(f"Token verification failed: {e}")


# Global verifier instance (will be initialized with settings)
_verifier: JWKSVerifier | None = None


def get_verifier() -> JWKSVerifier:
    """Get or create the global JWKS verifier instance.

    Returns:
        JWKSVerifier instance

    Raises:
        RuntimeError: If verifier is not initialized
    """
    if _verifier is None:
        raise RuntimeError("JWKS verifier not initialized")
    return _verifier


def initialize_verifier(jwks_url: str, issuer: str, cache_ttl: int = 3600) -> None:
    """Initialize the global JWKS verifier.

    Args:
        jwks_url: URL to fetch JWKS from
        issuer: Expected issuer in JWT claims
        cache_ttl: TTL for JWKS cache in seconds
    """
    global _verifier
    _verifier = JWKSVerifier(jwks_url, issuer, cache_ttl)


async def verify_token(token: str) -> Dict[str, Any]:
    """Verify a JWT token using the global verifier.

    Args:
        token: JWT token string

    Returns:
        Decoded JWT claims

    Raises:
        RuntimeError: If verifier is not initialized
        JWTError: If token verification fails
    """
    verifier = get_verifier()
    return await verifier.verify_token(token)
