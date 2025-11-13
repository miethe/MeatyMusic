"""Cache-aware base repository with automatic caching capabilities.

This module provides a base repository class that extends BaseRepository with
comprehensive caching support, implementing the cache-aside pattern with
multi-tier caching, tenant awareness, and automatic invalidation.
"""

from __future__ import annotations

import functools
import hashlib
import json
import logging
from contextlib import contextmanager
from typing import Any, Callable, Dict, List, Optional, Set, Type, TypeVar, Union
from uuid import UUID

from opentelemetry import trace
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.core.cache_manager import get_cache_manager, MultiTierCacheManager
from app.errors import AppError
from .base import BaseRepository

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

T = TypeVar('T')


class CacheKey:
    """Utility class for generating consistent cache keys."""

    @staticmethod
    def model_by_id(model_name: str, model_id: UUID, tenant_id: Optional[str] = None) -> str:
        """Generate cache key for model by ID."""
        if tenant_id:
            return f"{model_name}:id:{model_id}"
        return f"{model_name}:id:{model_id}"

    @staticmethod
    def model_by_key(model_name: str, key_parts: List[str], tenant_id: Optional[str] = None) -> str:
        """Generate cache key for model by composite key."""
        key_hash = hashlib.md5(":".join(key_parts).encode()).hexdigest()[:8]
        if tenant_id:
            return f"{model_name}:key:{key_hash}"
        return f"{model_name}:key:{key_hash}"

    @staticmethod
    def model_list(model_name: str, filters_hash: str, cursor: Optional[str] = None, tenant_id: Optional[str] = None) -> str:
        """Generate cache key for model list with filters."""
        cursor_part = f":cursor:{cursor}" if cursor else ""
        if tenant_id:
            return f"{model_name}:list:{filters_hash}{cursor_part}"
        return f"{model_name}:list:{filters_hash}{cursor_part}"

    @staticmethod
    def model_relationships(model_name: str, model_id: UUID, tenant_id: Optional[str] = None) -> str:
        """Generate cache key for model with relationships."""
        if tenant_id:
            return f"{model_name}:relationships:{model_id}"
        return f"{model_name}:relationships:{model_id}"


class CacheInvalidationError(AppError):
    """Exception raised when cache invalidation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="CACHE_INVALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class CacheAwareRepository(BaseRepository):
    """Base repository with automatic caching capabilities.

    This class extends BaseRepository with comprehensive caching support:
    - Automatic cache-aside pattern implementation
    - Tenant-aware cache key generation
    - Cache invalidation on write operations
    - Graceful fallback to database on cache failures
    - OpenTelemetry observability integration

    Cache strategies are configurable per operation and fallback to database
    operations if caching is disabled or fails.
    """

    def __init__(
        self,
        db: Session,
        owner_id: Optional[UUID] = None,
        security_context: Any = None,
        cache_manager: Optional[MultiTierCacheManager] = None,
        cache_enabled: bool = True
    ):
        """Initialize cache-aware repository.

        Parameters
        ----------
        db : Session
            Database session
        owner_id : Optional[UUID]
            Legacy owner ID for backward compatibility
        security_context : Any
            Security context for RLS enforcement
        cache_manager : Optional[MultiTierCacheManager]
            Cache manager instance. Uses global if None
        cache_enabled : bool
            Whether caching is enabled for this repository
        """
        super().__init__(db, owner_id, security_context)
        self._cache_manager = cache_manager or get_cache_manager()
        self._cache_enabled = cache_enabled
        self._tenant_id = self._get_tenant_id()

    def _get_tenant_id(self) -> Optional[str]:
        """Extract tenant ID from security context."""
        if self.security_context and hasattr(self.security_context, 'tenant_id'):
            tenant_id = self.security_context.tenant_id
            return str(tenant_id) if tenant_id else None
        return None

    def _hash_filters(self, filters: Dict[str, Any]) -> str:
        """Create hash of filter parameters for consistent cache keys."""
        # Sort keys for consistent hashing
        sorted_filters = {k: v for k, v in sorted(filters.items()) if v is not None}

        # Handle UUID serialization
        for key, value in sorted_filters.items():
            if isinstance(value, UUID):
                sorted_filters[key] = str(value)
            elif isinstance(value, list) and value and isinstance(value[0], UUID):
                sorted_filters[key] = [str(v) for v in value]

        filter_json = json.dumps(sorted_filters, sort_keys=True, default=str)
        return hashlib.md5(filter_json.encode()).hexdigest()[:12]

    def _get_model_tags(self, model_class: Type[T], instance: Optional[T] = None) -> Set[str]:
        """Generate cache tags for a model instance."""
        tags = {model_class.__name__.lower()}

        if instance:
            # Add ID-specific tag
            if hasattr(instance, 'id'):
                tags.add(f"{model_class.__name__.lower()}:{instance.id}")

            # Add relationship tags for common foreign keys
            for attr_name in ['provider_id', 'model_id', 'family_id', 'user_id', 'tenant_id']:
                if hasattr(instance, attr_name):
                    attr_value = getattr(instance, attr_name)
                    if attr_value:
                        tags.add(f"{attr_name}:{attr_value}")

        return tags

    @contextmanager
    def _cache_context(self, operation: str, model_class: Type[T], key: str):
        """Context manager for cache operations with error handling and observability."""
        if not self._cache_enabled:
            yield None
            return

        span_attributes = {
            "cache.operation": operation,
            "cache.model": model_class.__name__,
            "cache.key": key,
            "cache.tenant_id": self._tenant_id
        }

        with tracer.start_as_current_span(f"cache.{operation}", attributes=span_attributes) as span:
            try:
                yield self._cache_manager
            except Exception as e:
                logger.warning(
                    f"Cache operation failed: {operation}",
                    extra={
                        "error": str(e),
                        "model": model_class.__name__,
                        "key": key,
                        "operation": operation
                    }
                )
                span.set_attribute("cache.error", str(e))
                # Continue without cache - graceful fallback
                raise

    def _serialize_for_cache(self, obj: Any) -> Any:
        """Serialize object for caching.
        Handles SQLAlchemy models, Pydantic models, and lists of models.
        """
        # SQLAlchemy model
        try:
            from sqlalchemy.orm import DeclarativeMeta
        except ImportError:
            DeclarativeMeta = None

        # Pydantic model
        try:
            from pydantic import BaseModel
        except ImportError:
            BaseModel = None

        # Handle lists/tuples of models
        if isinstance(obj, (list, tuple)):
            return [self._serialize_for_cache(item) for item in obj]

        # SQLAlchemy ORM model
        if DeclarativeMeta and isinstance(obj, DeclarativeMeta):
            state = inspect(obj)
            return {
                column.key: getattr(obj, column.key)
                for column in state.mapper.columns
            }

        # Pydantic model
        if BaseModel and isinstance(obj, BaseModel):
            # Use model_dump() for Pydantic v2, fallback to dict() for v1
            if hasattr(obj, 'model_dump'):
                return obj.model_dump()
            else:
                return obj.dict()

        # Fallback: dict, str, int, etc.
        if isinstance(obj, dict):
            return obj
        if isinstance(obj, (str, int, float, bool, type(None))):
            return obj

        # Last resort: try __dict__
        if hasattr(obj, '__dict__'):
            return dict(obj.__dict__)

        return obj

    def _deserialize_from_cache(self, data: Any, model_class: Type[T]) -> Optional[T]:
        """Deserialize cached data back to model instance."""
        if data is None:
            return None

        # Handle Pydantic models
        try:
            from pydantic import BaseModel
            if model_class and issubclass(model_class, BaseModel):
                if isinstance(data, dict):
                    # Use model_validate for Pydantic v2, fallback to direct instantiation
                    if hasattr(model_class, 'model_validate'):
                        return model_class.model_validate(data)
                    else:
                        return model_class(**data)
                # If already the correct type, return as-is
                elif isinstance(data, model_class):
                    return data
        except (ImportError, TypeError, AttributeError):
            pass

        if isinstance(data, dict):
            # Create model instance from cached attributes
            try:
                return model_class(**data)
            except Exception as e:
                logger.warning(f"Failed to deserialize cached model {model_class.__name__}: {e}")
                return None

        return data


def cache_get(config_name: str = "model_data", ttl_override: Optional[int] = None):
    """Decorator for automatic caching of get operations.

    Parameters
    ----------
    config_name : str
        Cache configuration name to use
    ttl_override : Optional[int]
        Override TTL for this operation
    model_class : Type[T]
        The class to use for deserialization from cache
    """
    import asyncio
    def decorator(func: Callable[..., Optional[T]]) -> Callable[..., Optional[T]]:
        @functools.wraps(func)
        def get_model_class_from_kwargs(*args, **kwargs):
            # Try to get model_class from kwargs, else from self._determine_model_class
            self = args[0] if args else None
            model_class = kwargs.get('model_class', None)
            if model_class is not None:
                return model_class
            if self and hasattr(self, '_determine_model_class'):
                return self._determine_model_class(func.__name__, args[1:])
            return None

        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(self: 'CacheAwareRepository', *args, **kwargs) -> Optional[T]:
                if not self._cache_enabled:
                    return await func(self, *args, **kwargs)

                key_parts = [func.__name__] + [str(arg) for arg in args if not callable(arg)]
                cache_key = ":".join(key_parts)

                model_class = kwargs.get('model_class', None) or get_model_class_from_kwargs(self, *args, **kwargs)

                with self._cache_context("get", model_class or type(None), cache_key) as cache_manager:
                    if cache_manager:
                        cached_data = cache_manager.get(
                            key=cache_key,
                            config_name=config_name,
                            tenant_id=self._tenant_id
                        )
                        if cached_data is not None:
                            if model_class:
                                return self._deserialize_from_cache(cached_data, model_class)
                            return cached_data

                result = await func(self, *args, **kwargs)

                if result is not None:
                    with self._cache_context("set", type(result), cache_key) as cache_manager:
                        if cache_manager:
                            serialized_data = self._serialize_for_cache(result)
                            cache_manager.set(
                                key=cache_key,
                                value=serialized_data,
                                config_name=config_name,
                                tenant_id=self._tenant_id,
                                ttl_override=ttl_override
                            )
                return result
            return async_wrapper
        else:
            def wrapper(self: 'CacheAwareRepository', *args, **kwargs) -> Optional[T]:
                if not self._cache_enabled:
                    return func(self, *args, **kwargs)

                key_parts = [func.__name__] + [str(arg) for arg in args if not callable(arg)]
                cache_key = ":".join(key_parts)

                model_class = kwargs.get('model_class', None) or get_model_class_from_kwargs(self, *args, **kwargs)

                with self._cache_context("get", model_class or type(None), cache_key) as cache_manager:
                    if cache_manager:
                        cached_data = cache_manager.get(
                            key=cache_key,
                            config_name=config_name,
                            tenant_id=self._tenant_id
                        )
                        if cached_data is not None:
                            if model_class:
                                return self._deserialize_from_cache(cached_data, model_class)
                            return cached_data

                result = func(self, *args, **kwargs)

                if result is not None:
                    with self._cache_context("set", type(result), cache_key) as cache_manager:
                        if cache_manager:
                            serialized_data = self._serialize_for_cache(result)
                            cache_manager.set(
                                key=cache_key,
                                value=serialized_data,
                                config_name=config_name,
                                tenant_id=self._tenant_id,
                                ttl_override=ttl_override
                            )
                return result
            return wrapper
    return decorator


def cache_set(config_name: str = "model_data"):
    """Decorator for caching results of operations that return data.

    Parameters
    ----------
    config_name : str
        Cache configuration name to use
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(self: CacheAwareRepository, *args, **kwargs) -> T:
            result = func(self, *args, **kwargs)

            if not self._cache_enabled or result is None:
                return result

            # Generate cache key
            key_parts = [func.__name__] + [str(arg) for arg in args if not callable(arg)]
            cache_key = ":".join(key_parts)

            # Cache the result
            with self._cache_context("set", type(result), cache_key) as cache_manager:
                if cache_manager:
                    serialized_data = self._serialize_for_cache(result)
                    cache_manager.set(
                        key=cache_key,
                        value=serialized_data,
                        config_name=config_name,
                        tenant_id=self._tenant_id
                    )

            return result
        return wrapper
    return decorator


def cache_invalidate(tags: Optional[List[str]] = None, patterns: Optional[List[str]] = None):
    """Decorator for automatic cache invalidation on write operations.

    Parameters
    ----------
    tags : Optional[List[str]]
        Cache tags to invalidate
    patterns : Optional[List[str]]
        Key patterns to invalidate (for future use)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(self: CacheAwareRepository, *args, **kwargs) -> T:
            result = func(self, *args, **kwargs)

            if not self._cache_enabled:
                return result

            # Invalidate cache tags after successful write operation
            if tags:
                for tag in tags:
                    try:
                        with self._cache_context("invalidate", type(None), f"tag:{tag}") as cache_manager:
                            if cache_manager:
                                cache_manager.invalidate_by_tag(tag)
                    except Exception as e:
                        logger.warning(f"Failed to invalidate cache tag {tag}: {e}")

            # For model instances, invalidate based on the result
            if hasattr(result, '__class__') and hasattr(result, 'id'):
                model_class = result.__class__
                instance_tags = self._get_model_tags(model_class, result)

                for tag in instance_tags:
                    try:
                        with self._cache_context("invalidate", model_class, f"tag:{tag}") as cache_manager:
                            if cache_manager:
                                cache_manager.invalidate_by_tag(tag)
                    except Exception as e:
                        logger.warning(f"Failed to invalidate instance tag {tag}: {e}")

            return result
        return wrapper
    return decorator


class CacheMetrics:
    """Cache metrics tracking for repository operations."""

    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.sets = 0
        self.invalidations = 0
        self.errors = 0

    def hit(self):
        """Record a cache hit."""
        self.hits += 1

    def miss(self):
        """Record a cache miss."""
        self.misses += 1

    def set(self):
        """Record a cache set operation."""
        self.sets += 1

    def invalidate(self):
        """Record a cache invalidation."""
        self.invalidations += 1

    def error(self):
        """Record a cache error."""
        self.errors += 1

    @property
    def hit_ratio(self) -> float:
        """Calculate hit ratio."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    def reset(self):
        """Reset all metrics."""
        self.hits = 0
        self.misses = 0
        self.sets = 0
        self.invalidations = 0
        self.errors = 0

    def to_dict(self) -> Dict[str, Any]:
        """Export metrics as dictionary."""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "sets": self.sets,
            "invalidations": self.invalidations,
            "errors": self.errors,
            "hit_ratio": self.hit_ratio
        }
