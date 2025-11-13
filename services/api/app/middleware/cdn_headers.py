"""CDN headers middleware for cache control and optimization.

This middleware dynamically injects appropriate cache headers, generates ETags,
and manages cache-related headers based on content type and user context.
Supports both public and private caching with proper Vary headers for
personalized content.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from email.utils import formatdate
from typing import Callable, Awaitable, Dict, Any, Optional, Set
from urllib.parse import urlparse

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from opentelemetry import trace

from app.core.cdn_service import get_cdn_service
from app.core.config import settings
from app.observability.tracing import get_tracer

logger = structlog.get_logger(__name__)
tracer = get_tracer(__name__)


class CDNHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for dynamic cache header injection and ETag generation.

    This middleware:
    1. Analyzes request path and content type to determine cache policy
    2. Generates ETags for cacheable responses
    3. Handles conditional requests (If-None-Match, If-Modified-Since)
    4. Sets appropriate Cache-Control, Vary, and other cache headers
    5. Considers user authentication state for cache decisions
    6. Provides performance monitoring for cache effectiveness
    """

    def __init__(self, app):
        super().__init__(app)
        self.cdn_service = get_cdn_service(settings.CACHE)
        self.cache_enabled = settings.CACHE.CDN_ENABLED

        # Paths to exclude from caching
        self.exclude_paths = {
            '/health', '/healthz', '/metrics', '/_internal',
            '/admin', '/auth/logout', '/auth/session'
        }

        # Methods that should not be cached
        self.non_cacheable_methods = {'POST', 'PUT', 'DELETE', 'PATCH'}

        logger.info(
            "cdn_headers_middleware_initialized",
            cache_enabled=self.cache_enabled,
            exclude_paths=len(self.exclude_paths)
        )

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """Process request and add appropriate cache headers."""

        with tracer.start_as_current_span("cdn.headers.middleware") as span:
            span.set_attributes({
                "http.method": request.method,
                "http.url": str(request.url),
                "http.scheme": request.url.scheme,
                "http.host": request.url.hostname or "",
                "cdn.middleware": "headers"
            })

            # Skip caching for excluded paths or methods
            if (
                not self.cache_enabled or
                self._should_skip_caching(request) or
                request.method in self.non_cacheable_methods
            ):
                response = await call_next(request)
                self._add_no_cache_headers(response)
                return response

            # Check for conditional request headers
            if_none_match = request.headers.get('if-none-match')
            if_modified_since = request.headers.get('if-modified-since')

            # Process the request
            response = await call_next(request)

            # Only cache successful responses
            if not (200 <= response.status_code < 300):
                self._add_no_cache_headers(response)
                return response

            # Get cache policy for this content
            cache_policy = self._determine_cache_policy(request, response)

            # Generate ETag and Last-Modified headers
            await self._add_cache_headers(request, response, cache_policy)

            # Handle conditional requests
            if await self._handle_conditional_request(
                request, response, if_none_match, if_modified_since
            ):
                # Return 304 Not Modified
                return self._create_not_modified_response(response)

            # Log cache decision for monitoring
            self._log_cache_decision(request, response, cache_policy)

            return response

    def _should_skip_caching(self, request: Request) -> bool:
        """Determine if caching should be skipped for this request."""
        path = request.url.path

        # Skip excluded paths
        if any(excluded in path for excluded in self.exclude_paths):
            return True

        # Skip if request has cache-busting parameters
        if 'no-cache' in request.query_params or 'bust' in request.query_params:
            return True

        # Skip if explicit no-cache header
        if request.headers.get('cache-control') == 'no-cache':
            return True

        return False

    def _determine_cache_policy(
        self,
        request: Request,
        response: Response
    ) -> Dict[str, Any]:
        """Determine appropriate cache policy for the request/response."""

        path = request.url.path
        content_type = response.headers.get('content-type', '')

        # Get base policy from CDN service
        if self.cdn_service:
            base_policy = self.cdn_service.get_cache_policy_for_content_type(
                content_type, path
            )
        else:
            base_policy = self._get_default_cache_policy(path)

        # Adjust policy based on user context
        is_authenticated = self._is_authenticated_request(request)
        has_user_specific_content = self._has_user_specific_content(request, response)

        # Clone policy to avoid modifying the original
        policy = base_policy.copy()

        # Adjust for authentication and personalization
        if is_authenticated or has_user_specific_content:
            policy['public'] = False
            policy['vary'] = list(set(policy.get('vary', []) + ['Authorization', 'Cookie']))

            # Reduce TTL for personalized content
            if has_user_specific_content:
                policy['ttl'] = min(policy['ttl'], 300)  # Max 5 minutes for personalized

        # Add content-specific tags
        policy['tags'] = set(policy.get('tags', []))
        if '/api/v1/models/' in path:
            # Extract model ID from path if present
            path_parts = path.split('/')
            if len(path_parts) > 4 and path_parts[4]:
                model_id = path_parts[4]
                policy['tags'].add(f'model:{model_id}')

        return policy

    def _get_default_cache_policy(self, path: str) -> Dict[str, Any]:
        """Get default cache policy when CDN service is not available."""
        # API responses default
        return {
            "ttl": settings.CACHE.CDN_API_RESPONSES_TTL,
            "tags": {"api", "responses"},
            "vary": ["Accept-Encoding", "Authorization", "Accept"],
            "public": False
        }

    def _is_authenticated_request(self, request: Request) -> bool:
        """Check if the request is from an authenticated user."""
        return bool(
            request.headers.get('authorization') or
            request.cookies.get('session') or
            getattr(request.state, 'user_id', None)
        )

    def _has_user_specific_content(self, request: Request, response: Response) -> bool:
        """Check if the response contains user-specific content."""
        # Check for user-specific response headers
        if 'X-User-Context' in response.headers:
            return True

        # Check for paths that typically contain user data
        user_specific_paths = ['/profile', '/dashboard', '/settings', '/favorites']
        if any(path in request.url.path for path in user_specific_paths):
            return True

        return False

    async def _add_cache_headers(
        self,
        request: Request,
        response: Response,
        cache_policy: Dict[str, Any]
    ) -> None:
        """Add appropriate cache headers to the response."""

        ttl = cache_policy.get('ttl', 0)
        is_public = cache_policy.get('public', False)
        vary_headers = cache_policy.get('vary', [])
        tags = cache_policy.get('tags', set())

        # Set Cache-Control header
        cache_control_parts = []

        if ttl > 0:
            if is_public:
                cache_control_parts.append('public')
            else:
                cache_control_parts.append('private')

            cache_control_parts.append(f'max-age={ttl}')

            # Add stale-while-revalidate for better UX
            if ttl > 60:  # Only for longer cache times
                stale_time = min(ttl // 4, 3600)  # Up to 1 hour stale
                cache_control_parts.append(f'stale-while-revalidate={stale_time}')
        else:
            cache_control_parts.extend(['no-cache', 'no-store', 'must-revalidate'])

        response.headers['Cache-Control'] = ', '.join(cache_control_parts)

        # Set Vary header for content negotiation
        if vary_headers:
            existing_vary = response.headers.get('vary', '')
            all_vary = set(vary_headers)
            if existing_vary:
                all_vary.update(h.strip() for h in existing_vary.split(','))
            response.headers['Vary'] = ', '.join(sorted(all_vary))

        # Generate and set ETag
        etag = await self._generate_etag(request, response)
        if etag:
            response.headers['ETag'] = f'"{etag}"'

        # Set Last-Modified header
        last_modified = self._generate_last_modified(request, response)
        if last_modified:
            response.headers['Last-Modified'] = last_modified

        # Add CDN-specific headers
        if tags:
            # CloudFlare cache tags (if using CloudFlare)
            if settings.CACHE.CDN_PROVIDER == "cloudflare":
                response.headers['Cache-Tag'] = ','.join(sorted(tags))

        # Add custom headers for debugging
        if settings.OBS.LOG_LEVEL == "DEBUG":
            response.headers['X-Cache-Policy'] = json.dumps({
                'ttl': ttl,
                'public': is_public,
                'tags': list(tags) if isinstance(tags, set) else tags
            })

    async def _generate_etag(self, request: Request, response: Response) -> Optional[str]:
        """Generate ETag for the response."""
        try:
            # For streaming responses, we can't generate ETags easily
            if isinstance(response, StreamingResponse):
                return None

            # Get response body
            body = b""
            if hasattr(response, 'body'):
                body = response.body
            elif hasattr(response, 'content'):
                body = response.content

            if not body:
                return None

            # Include relevant request factors in ETag
            etag_factors = [
                body,
                request.url.path.encode(),
                request.method.encode(),
            ]

            # Add user context if present (for private caches)
            user_id = getattr(request.state, 'user_id', None)
            if user_id:
                etag_factors.append(str(user_id).encode())

            # Add query params for GET requests
            if request.method == 'GET' and request.query_params:
                query_string = str(request.query_params).encode()
                etag_factors.append(query_string)

            # Generate hash
            hasher = hashlib.md5()
            for factor in etag_factors:
                hasher.update(factor)

            return hasher.hexdigest()

        except Exception as e:
            logger.warning(
                "etag_generation_failed",
                error=str(e),
                path=request.url.path
            )
            return None

    def _generate_last_modified(self, request: Request, response: Response) -> Optional[str]:
        """Generate Last-Modified header."""
        # For most API responses, use current time
        # In production, this would ideally come from the actual resource modification time
        try:
            # Check if response has a timestamp header
            if 'X-Resource-Modified' in response.headers:
                timestamp = float(response.headers['X-Resource-Modified'])
                return formatdate(timestamp, usegmt=True)

            # For now, use current time for all cacheable responses
            # This isn't ideal but ensures cache validation works
            now = datetime.now(timezone.utc).timestamp()
            return formatdate(now, usegmt=True)

        except Exception as e:
            logger.warning(
                "last_modified_generation_failed",
                error=str(e),
                path=request.url.path
            )
            return None

    async def _handle_conditional_request(
        self,
        request: Request,
        response: Response,
        if_none_match: Optional[str],
        if_modified_since: Optional[str]
    ) -> bool:
        """Handle conditional request headers and return True if 304 should be returned."""

        current_etag = response.headers.get('etag')
        last_modified = response.headers.get('last-modified')

        # Handle If-None-Match (ETag validation)
        if if_none_match and current_etag:
            # Remove quotes from ETags for comparison
            client_etag = if_none_match.strip('"')
            server_etag = current_etag.strip('"')

            if client_etag == server_etag or if_none_match == '*':
                logger.debug(
                    "conditional_request_etag_match",
                    client_etag=client_etag,
                    server_etag=server_etag,
                    path=request.url.path
                )
                return True

        # Handle If-Modified-Since
        if if_modified_since and last_modified:
            try:
                from email.utils import parsedate_to_datetime

                client_time = parsedate_to_datetime(if_modified_since)
                server_time = parsedate_to_datetime(last_modified)

                if server_time <= client_time:
                    logger.debug(
                        "conditional_request_not_modified",
                        client_time=if_modified_since,
                        server_time=last_modified,
                        path=request.url.path
                    )
                    return True

            except (ValueError, TypeError) as e:
                logger.warning(
                    "conditional_request_time_parse_error",
                    if_modified_since=if_modified_since,
                    last_modified=last_modified,
                    error=str(e)
                )

        return False

    def _create_not_modified_response(self, original_response: Response) -> Response:
        """Create a 304 Not Modified response."""
        response = Response(status_code=304)

        # Copy relevant headers from original response
        headers_to_copy = [
            'cache-control', 'date', 'etag', 'expires', 'last-modified',
            'server', 'vary', 'cache-tag'
        ]

        for header in headers_to_copy:
            if header in original_response.headers:
                response.headers[header] = original_response.headers[header]

        return response

    def _add_no_cache_headers(self, response: Response) -> None:
        """Add no-cache headers for non-cacheable responses."""
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

    def _log_cache_decision(
        self,
        request: Request,
        response: Response,
        cache_policy: Dict[str, Any]
    ) -> None:
        """Log cache decision for monitoring and debugging."""

        if not settings.CACHE.PERFORMANCE_MONITORING_ENABLED:
            return

        cache_control = response.headers.get('cache-control', 'no-cache')
        is_cacheable = 'no-cache' not in cache_control and 'no-store' not in cache_control

        log_data = {
            "event": "cdn_cache_decision",
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
            "cacheable": is_cacheable,
            "cache_control": cache_control,
            "ttl": cache_policy.get('ttl', 0),
            "public": cache_policy.get('public', False),
            "has_etag": bool(response.headers.get('etag')),
            "has_last_modified": bool(response.headers.get('last-modified')),
            "content_type": response.headers.get('content-type', ''),
            "content_length": response.headers.get('content-length'),
            "authenticated": self._is_authenticated_request(request),
            "user_specific": self._has_user_specific_content(request, response),
        }

        # Add tag information
        tags = cache_policy.get('tags', set())
        if tags:
            log_data["cache_tags"] = list(tags) if isinstance(tags, set) else tags

        # Add Vary header info
        vary = response.headers.get('vary')
        if vary:
            log_data["vary_headers"] = [h.strip() for h in vary.split(',')]

        logger.info(**log_data)

        # Emit metrics for observability
        with tracer.start_as_current_span("cdn.cache.decision") as span:
            span.set_attributes({
                "cache.decision": "cacheable" if is_cacheable else "not_cacheable",
                "cache.ttl": cache_policy.get('ttl', 0),
                "cache.public": cache_policy.get('public', False),
                "http.response.status_code": response.status_code,
            })


def get_cache_key_for_request(request: Request) -> str:
    """Generate a cache key for a request.

    This function creates a consistent cache key that can be used
    by upstream caches or for internal cache management.
    """
    key_parts = [
        request.method,
        request.url.path,
        str(sorted(request.query_params.items())) if request.query_params else "",
    ]

    # Add user context for private caches
    user_id = getattr(request.state, 'user_id', None)
    if user_id:
        key_parts.append(f"user:{user_id}")

    # Add relevant headers
    relevant_headers = ['accept', 'accept-language', 'accept-encoding']
    for header in relevant_headers:
        value = request.headers.get(header)
        if value:
            key_parts.append(f"{header}:{value}")

    # Generate hash
    key_string = "|".join(key_parts)
    return hashlib.sha256(key_string.encode()).hexdigest()[:16]


def should_cache_response(response: Response) -> bool:
    """Determine if a response should be cached based on headers and status."""

    # Only cache successful responses
    if not (200 <= response.status_code < 300):
        return False

    # Check Cache-Control header
    cache_control = response.headers.get('cache-control', '')
    if any(directive in cache_control for directive in ['no-cache', 'no-store', 'private']):
        return False

    # Check for error indicators in headers
    if response.headers.get('x-error') or response.headers.get('x-rate-limit-exceeded'):
        return False

    return True
