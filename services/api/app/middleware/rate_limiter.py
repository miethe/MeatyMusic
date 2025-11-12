"""Rate limiting middleware for authentication endpoints."""
from __future__ import annotations

import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class InMemoryRateLimiter:
    """Simple in-memory rate limiter for authentication endpoints.

    In production, this should be replaced with Redis-based storage
    for proper distributed rate limiting.
    """

    def __init__(self):
        # Storage: {client_id: [(timestamp, endpoint), ...]}
        self._requests: Dict[str, list] = defaultdict(list)
        # Storage: {client_id: blocked_until_timestamp}
        self._blocked: Dict[str, float] = {}

        # Rate limiting rules by endpoint pattern
        self._limits = {
            '/api/v1/auth/verify-token': (30, 60),  # 30 requests per 60 seconds
            '/api/v1/auth/logout': (10, 60),        # 10 requests per 60 seconds
            '/api/v1/auth/session': (60, 60),       # 60 requests per 60 seconds
            '/api/v1/auth/session/refresh': (20, 60), # 20 requests per 60 seconds
            # Global auth failure limit
            '_auth_failures': (10, 300),            # 10 failures per 5 minutes
        }

    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request."""
        # Try to get real IP from headers (proxy support)
        client_ip = (
            request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or
            request.headers.get('X-Real-IP') or
            request.client.host if request.client else 'unknown'
        )

        # For auth failures, also consider user agent to prevent
        # different browsers on same IP from affecting each other
        if hasattr(request.state, 'auth_failure'):
            user_agent = request.headers.get('User-Agent', '')[:50]  # Truncate
            return f"{client_ip}:{hash(user_agent) % 10000}"

        return client_ip

    def _cleanup_old_requests(self, client_id: str, window_seconds: int) -> None:
        """Remove requests older than the window."""
        if client_id not in self._requests:
            return

        cutoff = time.time() - window_seconds
        self._requests[client_id] = [
            (ts, endpoint) for ts, endpoint in self._requests[client_id]
            if ts > cutoff
        ]

        # Clean up empty entries
        if not self._requests[client_id]:
            del self._requests[client_id]

    def _is_blocked(self, client_id: str) -> Tuple[bool, Optional[int]]:
        """Check if client is currently blocked."""
        if client_id not in self._blocked:
            return False, None

        blocked_until = self._blocked[client_id]
        now = time.time()

        if now < blocked_until:
            return True, int(blocked_until - now)
        else:
            # Block expired
            del self._blocked[client_id]
            return False, None

    def check_rate_limit(
        self,
        request: Request,
        endpoint: str
    ) -> Tuple[bool, Dict[str, any]]:
        """Check if request should be rate limited.

        Returns:
            (allowed, info) where info contains rate limit headers
        """
        client_id = self._get_client_id(request)

        # Check if client is currently blocked
        is_blocked, retry_after = self._is_blocked(client_id)
        if is_blocked:
            return False, {
                'X-RateLimit-Limit': 0,
                'X-RateLimit-Remaining': 0,
                'X-RateLimit-Reset': int(time.time() + retry_after),
                'Retry-After': retry_after,
            }

        # Get rate limit for this endpoint
        if endpoint not in self._limits:
            # No rate limit configured
            return True, {}

        limit, window_seconds = self._limits[endpoint]

        # Clean up old requests
        self._cleanup_old_requests(client_id, window_seconds)

        # Count current requests for this endpoint
        current_requests = [
            ts for ts, ep in self._requests[client_id]
            if ep == endpoint
        ]

        # Calculate reset time
        reset_time = int(time.time() + window_seconds)

        if len(current_requests) >= limit:
            # Rate limit exceeded - block client for the window duration
            self._blocked[client_id] = time.time() + window_seconds

            return False, {
                'X-RateLimit-Limit': limit,
                'X-RateLimit-Remaining': 0,
                'X-RateLimit-Reset': reset_time,
                'Retry-After': window_seconds,
            }

        # Record this request
        self._requests[client_id].append((time.time(), endpoint))

        return True, {
            'X-RateLimit-Limit': limit,
            'X-RateLimit-Remaining': limit - len(current_requests) - 1,
            'X-RateLimit-Reset': reset_time,
        }

    def record_auth_failure(self, request: Request) -> bool:
        """Record an authentication failure and check if client should be blocked.

        Returns:
            True if client should be blocked due to too many failures
        """
        # Mark request as auth failure for client ID calculation
        request.state.auth_failure = True
        client_id = self._get_client_id(request)

        endpoint = '_auth_failures'
        limit, window_seconds = self._limits[endpoint]

        # Clean up old failures
        self._cleanup_old_requests(client_id, window_seconds)

        # Record this failure
        self._requests[client_id].append((time.time(), endpoint))

        # Count recent failures
        recent_failures = [
            ts for ts, ep in self._requests[client_id]
            if ep == endpoint
        ]

        if len(recent_failures) >= limit:
            # Too many failures - block client
            self._blocked[client_id] = time.time() + window_seconds
            return True

        return False


# Global rate limiter instance
_rate_limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to auth endpoints."""

    async def dispatch(self, request: Request, call_next):
        # Only apply rate limiting to auth endpoints
        path = request.url.path
        if not path.startswith('/api/v1/auth/'):
            response = await call_next(request)
            return response

        # Check rate limit
        allowed, headers = _rate_limiter.check_rate_limit(request, path)

        if not allowed:
            # Rate limited
            retry_after = headers.get('Retry-After', 60)

            response = Response(
                content='{"error": "rate_limited", "message": "Too many requests. Please try again later.", "retry_after": ' + str(retry_after) + '}',
                status_code=429,
                headers=headers,
                media_type='application/json'
            )
            return response

        # Process request
        response = await call_next(request)

        # Add rate limit headers to response
        for key, value in headers.items():
            response.headers[key] = str(value)

        return response


def record_auth_failure(request: Request) -> bool:
    """Record an authentication failure.

    Returns:
        True if client should be blocked due to too many failures
    """
    return _rate_limiter.record_auth_failure(request)


def get_rate_limit_info(request: Request, endpoint: str) -> Dict[str, any]:
    """Get current rate limit information for a client and endpoint."""
    client_id = _rate_limiter._get_client_id(request)

    if endpoint not in _rate_limiter._limits:
        return {}

    limit, window_seconds = _rate_limiter._limits[endpoint]

    # Clean up old requests
    _rate_limiter._cleanup_old_requests(client_id, window_seconds)

    # Count current requests
    current_requests = [
        ts for ts, ep in _rate_limiter._requests[client_id]
        if ep == endpoint
    ]

    remaining = max(0, limit - len(current_requests))
    reset_at = datetime.now() + timedelta(seconds=window_seconds)

    return {
        'limit': limit,
        'remaining': remaining,
        'reset_at': reset_at,
    }
