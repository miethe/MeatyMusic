"""Centralized cache manager for L1 (memory) and L2 (Redis) caching.

This module provides a unified caching interface that transparently handles
both in-memory (L1) and Redis (L2) caching tiers.
"""

from __future__ import annotations

from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Manages L1 (memory) and L2 (Redis) cache tiers."""

    def __init__(
        self,
        redis_client: Any | None = None,
        l1_enabled: bool = True,
        l2_enabled: bool = True,
        default_ttl: int = 3600,
    ):
        """Initialize cache manager.

        Args:
            redis_client: Redis client instance for L2 cache
            l1_enabled: Whether to enable L1 (memory) cache
            l2_enabled: Whether to enable L2 (Redis) cache
            default_ttl: Default TTL in seconds
        """
        self.redis_client = redis_client
        self.l1_enabled = l1_enabled
        self.l2_enabled = l2_enabled
        self.default_ttl = default_ttl
        self._l1_cache: dict[str, Any] = {}

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (L1 first, then L2).

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        # Try L1 first
        if self.l1_enabled and key in self._l1_cache:
            logger.debug(f"L1 cache hit: {key}")
            return self._l1_cache[key]

        # Try L2
        if self.l2_enabled and self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value is not None:
                    logger.debug(f"L2 cache hit: {key}")
                    # Promote to L1
                    if self.l1_enabled:
                        self._l1_cache[key] = value
                    return value
            except Exception as e:
                logger.error(f"L2 cache error: {e}")

        logger.debug(f"Cache miss: {key}")
        return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Set value in cache (both L1 and L2).

        Args:
            key: Cache key
            value: Value to cache
            ttl: TTL in seconds (uses default if None)
        """
        ttl = ttl or self.default_ttl

        # Set in L1
        if self.l1_enabled:
            self._l1_cache[key] = value

        # Set in L2
        if self.l2_enabled and self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, value)
            except Exception as e:
                logger.error(f"L2 cache error: {e}")

    async def delete(self, key: str) -> None:
        """Delete key from both cache tiers.

        Args:
            key: Cache key to delete
        """
        # Delete from L1
        if self.l1_enabled:
            self._l1_cache.pop(key, None)

        # Delete from L2
        if self.l2_enabled and self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                logger.error(f"L2 cache error: {e}")

    async def clear(self) -> None:
        """Clear all cache tiers."""
        # Clear L1
        if self.l1_enabled:
            self._l1_cache.clear()

        # Clear L2 (use with caution!)
        if self.l2_enabled and self.redis_client:
            try:
                await self.redis_client.flushdb()
            except Exception as e:
                logger.error(f"L2 cache error: {e}")


# Global cache manager instance
_cache_manager: CacheManager | None = None


def get_cache_manager() -> CacheManager:
    """Get the global cache manager instance.

    Returns:
        CacheManager instance

    Raises:
        RuntimeError: If cache manager is not initialized
    """
    if _cache_manager is None:
        raise RuntimeError("Cache manager not initialized")
    return _cache_manager


def initialize_cache_manager(
    redis_client: Any | None = None,
    l1_enabled: bool = True,
    l2_enabled: bool = True,
    default_ttl: int = 3600,
) -> None:
    """Initialize the global cache manager.

    Args:
        redis_client: Redis client instance
        l1_enabled: Whether to enable L1 cache
        l2_enabled: Whether to enable L2 cache
        default_ttl: Default TTL in seconds
    """
    global _cache_manager
    _cache_manager = CacheManager(
        redis_client=redis_client,
        l1_enabled=l1_enabled,
        l2_enabled=l2_enabled,
        default_ttl=default_ttl,
    )


# Alias for backward compatibility
MultiTierCacheManager = CacheManager
