"""Redis cache client for model alias resolution and general caching.

Provides a high-performance caching layer with connection pooling, error handling,
and fallback mechanisms for when Redis is unavailable.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import zlib
from typing import Any, Dict, List, Optional, Set, TypeVar, Tuple
from uuid import UUID
from enum import Enum
import threading

import redis
from redis.connection import ConnectionPool
from redis.exceptions import ConnectionError, RedisError
from opentelemetry import trace

from app.core.config import settings

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

T = TypeVar('T')

# Compression threshold in bytes
COMPRESSION_THRESHOLD = 1024


class CircuitBreakerState(Enum):
    """Circuit breaker states for cache resilience."""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, bypass cache
    HALF_OPEN = "half_open" # Testing recovery


class CacheCircuitBreaker:
    """Circuit breaker for cache operations to maintain performance targets."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        latency_threshold_ms: float = 50.0
    ):
        """Initialize circuit breaker.

        Parameters
        ----------
        failure_threshold : int
            Number of failures before opening circuit
        recovery_timeout : int
            Time in seconds before attempting recovery
        latency_threshold_ms : float
            Latency threshold in milliseconds
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.latency_threshold_ms = latency_threshold_ms

        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.success_count = 0  # For half-open state
        self._lock = threading.Lock()

    def should_allow_request(self) -> bool:
        """Check if request should be allowed through circuit breaker."""
        with self._lock:
            if self.state == CircuitBreakerState.CLOSED:
                return True
            elif self.state == CircuitBreakerState.OPEN:
                if time.time() - self.last_failure_time >= self.recovery_timeout:
                    self.state = CircuitBreakerState.HALF_OPEN
                    self.success_count = 0
                    logger.info("Circuit breaker transitioning to HALF_OPEN")
                    return True
                return False
            elif self.state == CircuitBreakerState.HALF_OPEN:
                return True
            return False

    def record_success(self, latency_ms: float) -> None:
        """Record successful operation."""
        with self._lock:
            if self.state == CircuitBreakerState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= 3:  # Require 3 successes to close
                    self.state = CircuitBreakerState.CLOSED
                    self.failure_count = 0
                    logger.info("Circuit breaker closed after successful recovery")
            elif self.state == CircuitBreakerState.CLOSED:
                # Reset failure count on success
                if self.failure_count > 0:
                    self.failure_count = max(0, self.failure_count - 1)

            # Check if latency is too high
            if latency_ms > self.latency_threshold_ms:
                self.record_failure("High latency")

    def record_failure(self, reason: str = "Unknown") -> None:
        """Record failed operation."""
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.state == CircuitBreakerState.HALF_OPEN:
                self.state = CircuitBreakerState.OPEN
                logger.warning(f"Circuit breaker opened from HALF_OPEN due to: {reason}")
            elif self.state == CircuitBreakerState.CLOSED and self.failure_count >= self.failure_threshold:
                self.state = CircuitBreakerState.OPEN
                logger.warning(f"Circuit breaker opened after {self.failure_count} failures. Last reason: {reason}")

    def get_state(self) -> CircuitBreakerState:
        """Get current circuit breaker state."""
        return self.state

    def get_stats(self) -> Dict[str, Any]:
        """Get circuit breaker statistics."""
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
            "latency_threshold_ms": self.latency_threshold_ms
        }


class CacheError(Exception):
    """Base exception for cache-related errors."""
    pass


class RedisCache:
    """Redis-based cache client with connection pooling and error handling."""

    def __init__(
        self,
        url: str = settings.REDIS_URL,
        max_connections: int = settings.REDIS_MAX_CONNECTIONS,
        health_check_interval: int = settings.REDIS_HEALTH_CHECK_INTERVAL
    ):
        """Initialize Redis cache client.

        Parameters
        ----------
        url : str
            Redis connection URL
        max_connections : int
            Maximum connections in pool
        health_check_interval : int
            Health check interval in seconds
        """
        self.url = url
        self.max_connections = max_connections
        self.health_check_interval = health_check_interval

        # Connection pool for efficient connection reuse
        self._pool: Optional[ConnectionPool] = None
        self._client: Optional[redis.Redis] = None
        self._last_health_check = 0.0
        self._is_healthy = False

        # Circuit breaker for resilience and performance
        self._circuit_breaker = CacheCircuitBreaker(
            failure_threshold=settings.CACHE.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
            recovery_timeout=settings.CACHE.CIRCUIT_BREAKER_RECOVERY_TIMEOUT,
            latency_threshold_ms=settings.CACHE.CIRCUIT_BREAKER_LATENCY_THRESHOLD_MS
        ) if settings.CACHE.CIRCUIT_BREAKER_ENABLED else None

        # Performance tracking
        self._operation_metrics = {
            "total_operations": 0,
            "total_latency_ms": 0.0,
            "circuit_breaker_blocks": 0
        }

        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize Redis client and connection pool."""
        try:
            self._pool = ConnectionPool.from_url(
                self.url,
                max_connections=self.max_connections,
                retry_on_timeout=True,
                retry_on_error=[ConnectionError],
                health_check_interval=self.health_check_interval
            )

            self._client = redis.Redis(
                connection_pool=self._pool,
                decode_responses=True,
                socket_keepalive=True,
                socket_keepalive_options={}
            )

            # Test connection
            self._client.ping()
            self._is_healthy = True
            logger.info("Redis cache client initialized successfully")

        except Exception as e:
            logger.warning(f"Failed to initialize Redis client: {e}")
            self._is_healthy = False
            self._client = None

    def _health_check(self) -> bool:
        """Check Redis connection health."""
        now = time.time()

        # Skip if recently checked
        if now - self._last_health_check < self.health_check_interval:
            return self._is_healthy

        self._last_health_check = now

        if not self._client:
            self._initialize_client()
            return self._is_healthy

        try:
            self._client.ping()
            if not self._is_healthy:
                logger.info("Redis connection restored")
            self._is_healthy = True
        except Exception as e:
            if self._is_healthy:
                logger.warning(f"Redis connection lost: {e}")
            self._is_healthy = False

        return self._is_healthy

    def _serialize_key(self, key: str, namespace: str = "alias") -> str:
        """Serialize cache key with namespace prefix.

        Parameters
        ----------
        key : str
            Cache key
        namespace : str
            Cache namespace for key organization

        Returns
        -------
        str
            Formatted cache key with namespace
        """
        return f"mp:{namespace}:{key}"

    def _serialize_value(self, value: Any, compress: bool = True) -> str:
        """Serialize value for Redis storage with optional compression.

        Parameters
        ----------
        value : Any
            Value to serialize
        compress : bool
            Whether to compress large values

        Returns
        -------
        str
            Serialized (and optionally compressed) value
        """
        if isinstance(value, (str, int, float, bool)):
            serialized = str(value)
        elif isinstance(value, UUID):
            serialized = str(value)
        else:
            serialized = json.dumps(value, default=str)

        # Compress if value is large and compression is enabled
        if compress and len(serialized.encode()) > COMPRESSION_THRESHOLD:
            compressed = zlib.compress(serialized.encode())
            # Prepend compression marker
            return "__compressed__" + compressed.decode('latin-1')

        return serialized

    def _deserialize_value(self, value: str, value_type: type[T] = str) -> T:
        """Deserialize value from Redis storage with compression support.

        Parameters
        ----------
        value : str
            Serialized value from Redis
        value_type : type[T]
            Expected value type for deserialization

        Returns
        -------
        T
            Deserialized value
        """
        # Check if value is compressed
        if value.startswith("__compressed__"):
            compressed_data = value[14:].encode('latin-1')
            value = zlib.decompress(compressed_data).decode()

        if value_type == str:
            return value  # type: ignore
        elif value_type == UUID:
            return UUID(value)  # type: ignore
        elif value_type in (int, float, bool):
            return value_type(value)  # type: ignore
        else:
            return json.loads(value)  # type: ignore

    def _execute_with_circuit_breaker(self, operation_name: str, operation_func) -> Any:
        """Execute Redis operation with circuit breaker pattern.

        Parameters
        ----------
        operation_name : str
            Name of the operation for logging
        operation_func : callable
            Function to execute

        Returns
        -------
        Any
            Result of operation or None if circuit breaker blocks
        """
        if self._circuit_breaker and not self._circuit_breaker.should_allow_request():
            self._operation_metrics["circuit_breaker_blocks"] += 1
            logger.debug(f"Circuit breaker blocked {operation_name} operation")
            return None

        start_time = time.time()
        try:
            result = operation_func()

            # Record success metrics
            latency_ms = (time.time() - start_time) * 1000
            self._operation_metrics["total_operations"] += 1
            self._operation_metrics["total_latency_ms"] += latency_ms

            if self._circuit_breaker:
                self._circuit_breaker.record_success(latency_ms)

            return result

        except Exception as e:
            if self._circuit_breaker:
                self._circuit_breaker.record_failure(str(e))
            raise

    def get(self, key: str, value_type: type[T] = str, namespace: str = "alias") -> Optional[T]:
        """Get value from cache with circuit breaker protection.

        Parameters
        ----------
        key : str
            Cache key
        value_type : type
            Expected value type for deserialization
        namespace : str
            Cache namespace

        Returns
        -------
        Optional[T]
            Cached value or None if not found/unavailable
        """
        with tracer.start_as_current_span("cache.get", attributes={"cache.key": key, "cache.namespace": namespace}):
            if not self._health_check():
                return None

            def _get_operation():
                redis_key = self._serialize_key(key, namespace)
                value = self._client.get(redis_key)
                if value is None:
                    return None
                return self._deserialize_value(value, value_type)

            try:
                return self._execute_with_circuit_breaker("get", _get_operation)
            except RedisError as e:
                logger.warning(f"Redis get failed for key '{key}': {e}")
                self._is_healthy = False
                return None
            except Exception as e:
                logger.error(f"Unexpected error getting cache key '{key}': {e}")
                return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        nx: bool = False,
        namespace: str = "alias",
        tags: Optional[Set[str]] = None
    ) -> bool:
        """Set value in cache with optional tags for invalidation and circuit breaker protection.

        Parameters
        ----------
        key : str
            Cache key
        value : Any
            Value to cache
        ttl : Optional[int]
            Time-to-live in seconds
        nx : bool
            Only set if key doesn't exist
        namespace : str
            Cache namespace for key organization
        tags : Optional[Set[str]]
            Tags for cache invalidation

        Returns
        -------
        bool
            True if set successfully, False otherwise
        """
        with tracer.start_as_current_span("cache.set", attributes={
            "cache.key": key,
            "cache.namespace": namespace,
            "cache.has_tags": bool(tags)
        }):
            if not self._health_check():
                return False

            def _set_operation():
                redis_key = self._serialize_key(key, namespace)
                redis_value = self._serialize_value(value)

                # Use pipeline for atomic operation if tags are provided
                if tags:
                    with self._client.pipeline() as pipe:
                        result = pipe.set(
                            redis_key,
                            redis_value,
                            ex=ttl,
                            nx=nx
                        )

                        # Add key to tag sets for invalidation
                        for tag in tags:
                            tag_key = self._serialize_key(f"tag:{tag}", "tags")
                            pipe.sadd(tag_key, redis_key)
                            if ttl:  # Set same TTL on tag set with buffer
                                pipe.expire(tag_key, ttl + settings.CACHE.TAG_SET_TTL_BUFFER)

                        pipe.execute()
                        return bool(result)
                else:
                    result = self._client.set(
                        redis_key,
                        redis_value,
                        ex=ttl,
                        nx=nx
                    )
                    return bool(result)

            try:
                result = self._execute_with_circuit_breaker("set", _set_operation)
                return bool(result) if result is not None else False
            except RedisError as e:
                logger.warning(f"Redis set failed for key '{key}': {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                self._is_healthy = False
                return False
            except Exception as e:
                logger.error(f"Unexpected error setting cache key '{key}': {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return False

    def mget(self, keys: List[str], value_type: type[T] = str, namespace: str = "alias", use_pipeline: bool = True) -> Dict[str, Optional[T]]:
        """Get multiple values from cache with enhanced pipeline operations.

        Parameters
        ----------
        keys : List[str]
            Cache keys to retrieve
        value_type : type
            Expected value type for deserialization
        namespace : str
            Cache namespace for key organization
        use_pipeline : bool
            Whether to use pipeline for atomic operations

        Returns
        -------
        Dict[str, Optional[T]]
            Mapping of keys to cached values
        """
        with tracer.start_as_current_span("cache.mget", attributes={
            "cache.namespace": namespace,
            "cache.keys_count": len(keys),
            "cache.use_pipeline": use_pipeline
        }):
            if not keys:
                return {}

            if not self._health_check():
                return {key: None for key in keys}

            # Enforce batch size limit for performance
            if len(keys) > settings.CACHE.BATCH_SIZE_LIMIT:
                logger.warning(f"Batch size {len(keys)} exceeds limit {settings.CACHE.BATCH_SIZE_LIMIT}, truncating")
                keys = keys[:settings.CACHE.BATCH_SIZE_LIMIT]

            try:
                redis_keys = [self._serialize_key(key, namespace) for key in keys]

                if use_pipeline and len(keys) > 10:  # Use pipeline for larger batches
                    with self._client.pipeline() as pipe:
                        for redis_key in redis_keys:
                            pipe.get(redis_key)
                        values = pipe.execute()
                else:
                    values = self._client.mget(redis_keys)

                result = {}
                successful_gets = 0

                for i, key in enumerate(keys):
                    value = values[i] if i < len(values) else None
                    if value is not None:
                        try:
                            result[key] = self._deserialize_value(value, value_type)
                            successful_gets += 1
                        except Exception as e:
                            logger.warning(f"Failed to deserialize value for key {key}: {e}")
                            result[key] = None
                    else:
                        result[key] = None

                logger.debug(f"Retrieved {successful_gets}/{len(keys)} keys from namespace {namespace}")
                return result

            except RedisError as e:
                logger.warning(f"Redis mget failed for {len(keys)} keys: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace,
                    "keys_count": len(keys)
                })
                self._is_healthy = False
                return {key: None for key in keys}
            except Exception as e:
                logger.error(f"Unexpected error in mget for {len(keys)} keys: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return {key: None for key in keys}

    def mset(self, mapping: Dict[str, Any], ttl: Optional[int] = None, namespace: str = "alias", tags: Optional[Set[str]] = None) -> bool:
        """Set multiple values in cache with enhanced pipeline operations.

        Parameters
        ----------
        mapping : Dict[str, Any]
            Key-value pairs to set
        ttl : Optional[int]
            Time-to-live in seconds
        namespace : str
            Cache namespace for key organization
        tags : Optional[Set[str]]
            Tags for cache invalidation

        Returns
        -------
        bool
            True if all values set successfully
        """
        with tracer.start_as_current_span("cache.mset", attributes={
            "cache.namespace": namespace,
            "cache.keys_count": len(mapping),
            "cache.has_tags": bool(tags)
        }):
            if not mapping or not self._health_check():
                return False

            # Enforce batch size limit for performance
            if len(mapping) > settings.CACHE.BATCH_SIZE_LIMIT:
                logger.warning(f"Batch size {len(mapping)} exceeds limit {settings.CACHE.BATCH_SIZE_LIMIT}, truncating")
                mapping = dict(list(mapping.items())[:settings.CACHE.BATCH_SIZE_LIMIT])

            try:
                # Use pipeline for atomic multi-set with enhanced error handling
                with self._client.pipeline() as pipe:
                    redis_keys = []
                    redis_mapping = {}

                    for key, value in mapping.items():
                        redis_key = self._serialize_key(key, namespace)
                        redis_value = self._serialize_value(value)
                        redis_mapping[redis_key] = redis_value
                        redis_keys.append(redis_key)

                    # Set all values atomically
                    pipe.mset(redis_mapping)

                    # Set expiration for all keys if TTL specified
                    if ttl:
                        for redis_key in redis_keys:
                            pipe.expire(redis_key, ttl)

                    # Add keys to tag sets if tags provided
                    if tags:
                        for tag in tags:
                            tag_key = self._serialize_key(f"tag:{tag}", "tags")
                            for redis_key in redis_keys:
                                pipe.sadd(tag_key, redis_key)
                            if ttl:  # Set same TTL on tag set with buffer
                                pipe.expire(tag_key, ttl + settings.CACHE.TAG_SET_TTL_BUFFER)

                    pipe.execute()
                    logger.debug(f"Successfully set {len(mapping)} keys in namespace {namespace}")
                    return True

            except RedisError as e:
                logger.warning(f"Redis mset failed for {len(mapping)} keys: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace,
                    "keys_count": len(mapping)
                })
                self._is_healthy = False
                return False
            except Exception as e:
                logger.error(f"Unexpected error in mset for {len(mapping)} keys: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return False

    def delete(self, key: str, namespace: str = "alias") -> bool:
        """Delete value from cache.

        Parameters
        ----------
        key : str
            Cache key to delete

        Returns
        -------
        bool
            True if deleted successfully
        """
        if not self._health_check():
            return False

        try:
            redis_key = self._serialize_key(key, namespace)
            result = self._client.delete(redis_key)
            return bool(result)

        except RedisError as e:
            logger.warning(f"Redis delete failed for key '{key}': {e}")
            self._is_healthy = False
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting cache key '{key}': {e}")
            return False

    def mdel(self, keys: List[str], namespace: str = "alias", batch_size: Optional[int] = None) -> int:
        """Delete multiple keys from cache with enhanced batch processing.

        Parameters
        ----------
        keys : List[str]
            Cache keys to delete
        namespace : str
            Cache namespace
        batch_size : Optional[int]
            Batch size for large deletions (defaults to settings limit)

        Returns
        -------
        int
            Number of keys deleted
        """
        with tracer.start_as_current_span("cache.mdel", attributes={
            "cache.namespace": namespace,
            "cache.keys_count": len(keys)
        }):
            if not keys or not self._health_check():
                return 0

            effective_batch_size = batch_size or settings.CACHE.BATCH_SIZE_LIMIT
            total_deleted = 0

            # Process in batches for very large deletions
            for i in range(0, len(keys), effective_batch_size):
                batch_keys = keys[i:i + effective_batch_size]

                try:
                    redis_keys = [self._serialize_key(key, namespace) for key in batch_keys]

                    # Use pipeline for efficient batch delete
                    with self._client.pipeline() as pipe:
                        for redis_key in redis_keys:
                            pipe.delete(redis_key)
                        results = pipe.execute()
                        batch_deleted = sum(results)
                        total_deleted += batch_deleted

                        logger.debug(f"Deleted {batch_deleted}/{len(batch_keys)} keys from batch {i//effective_batch_size + 1}")

                except RedisError as e:
                    logger.warning(f"Redis mdel failed for batch {i//effective_batch_size + 1}: {e}", extra={
                        "trace_id": tracer.get_current_span().get_span_context().trace_id,
                        "namespace": namespace,
                        "batch_size": len(batch_keys)
                    })
                    self._is_healthy = False
                    break  # Stop processing remaining batches on error
                except Exception as e:
                    logger.error(f"Unexpected error in mdel batch {i//effective_batch_size + 1}: {e}", extra={
                        "trace_id": tracer.get_current_span().get_span_context().trace_id,
                        "namespace": namespace
                    })
                    break

            logger.info(f"Successfully deleted {total_deleted}/{len(keys)} keys from namespace {namespace}")
            return total_deleted

    def incr(self, key: str, amount: int = 1, namespace: str = "counters", ttl: Optional[int] = None) -> Optional[int]:
        """Increment counter value.

        Parameters
        ----------
        key : str
            Counter key
        amount : int
            Increment amount
        namespace : str
            Counter namespace
        ttl : Optional[int]
            Time-to-live for new counters

        Returns
        -------
        Optional[int]
            New counter value or None if failed
        """
        with tracer.start_as_current_span("cache.incr", attributes={"cache.key": key, "cache.namespace": namespace}):
            if not self._health_check():
                return None

            try:
                redis_key = self._serialize_key(key, namespace)

                # Use pipeline to ensure atomicity with TTL
                with self._client.pipeline() as pipe:
                    pipe.incrby(redis_key, amount)
                    if ttl:
                        pipe.expire(redis_key, ttl)
                    results = pipe.execute()
                    return int(results[0])

            except RedisError as e:
                logger.warning(f"Redis incr failed for key '{key}': {e}")
                self._is_healthy = False
                return None
            except Exception as e:
                logger.error(f"Unexpected error incrementing key '{key}': {e}")
                return None

    def decr(self, key: str, amount: int = 1, namespace: str = "counters", ttl: Optional[int] = None) -> Optional[int]:
        """Decrement counter value.

        Parameters
        ----------
        key : str
            Counter key
        amount : int
            Decrement amount
        namespace : str
            Counter namespace
        ttl : Optional[int]
            Time-to-live for new counters

        Returns
        -------
        Optional[int]
            New counter value or None if failed
        """
        return self.incr(key, -amount, namespace, ttl)

    def scan_keys(self, pattern: str, namespace: str = "alias", count: Optional[int] = None, cursor: int = 0) -> Tuple[int, List[str]]:
        """Scan for keys matching pattern with enhanced performance.

        Parameters
        ----------
        pattern : str
            Pattern to match (Redis SCAN pattern)
        namespace : str
            Cache namespace
        count : Optional[int]
            Number of keys to return per iteration (defaults to settings)
        cursor : int
            Cursor for pagination

        Returns
        -------
        Tuple[int, List[str]]
            (next_cursor, matching_keys)
        """
        with tracer.start_as_current_span("cache.scan_keys", attributes={
            "cache.pattern": pattern,
            "cache.namespace": namespace,
            "cache.cursor": cursor
        }):
            if not self._health_check():
                return 0, []

            effective_count = count or settings.CACHE.SCAN_COUNT_DEFAULT

            try:
                redis_pattern = self._serialize_key(pattern, namespace)
                cursor, keys = self._client.scan(cursor=cursor, match=redis_pattern, count=effective_count)

                # Remove namespace prefix from returned keys efficiently
                namespace_prefix = f"mp:{namespace}:"
                clean_keys = [
                    key[len(namespace_prefix):]
                    for key in keys
                    if key.startswith(namespace_prefix)
                ]

                logger.debug(f"Scanned {len(clean_keys)} keys for pattern '{pattern}' in namespace {namespace}")
                return cursor, clean_keys

            except RedisError as e:
                logger.warning(f"Redis scan failed for pattern '{pattern}': {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace,
                    "pattern": pattern
                })
                self._is_healthy = False
                return 0, []
            except Exception as e:
                logger.error(f"Unexpected error scanning pattern '{pattern}': {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return 0, []

    def scan_all_keys(self, pattern: str, namespace: str = "alias", batch_size: Optional[int] = None, max_keys: Optional[int] = None) -> List[str]:
        """Scan for all keys matching pattern with enhanced safety controls.

        Parameters
        ----------
        pattern : str
            Pattern to match
        namespace : str
            Cache namespace
        batch_size : Optional[int]
            Batch size for scanning (defaults to settings)
        max_keys : Optional[int]
            Maximum number of keys to return (safety limit)

        Returns
        -------
        List[str]
            All matching keys
        """
        with tracer.start_as_current_span("cache.scan_all_keys", attributes={
            "cache.pattern": pattern,
            "cache.namespace": namespace,
            "cache.max_keys": max_keys
        }):
            all_keys = []
            cursor = 0
            effective_batch_size = batch_size or settings.CACHE.SCAN_COUNT_DEFAULT
            effective_max_keys = max_keys or settings.CACHE.BATCH_SIZE_LIMIT
            iterations = 0
            max_iterations = 1000  # Prevent infinite loops

            while iterations < max_iterations:
                cursor, keys = self.scan_keys(pattern, namespace, effective_batch_size, cursor)
                all_keys.extend(keys)
                iterations += 1

                if cursor == 0:  # Scan complete
                    break

                # Apply safety limits
                if len(all_keys) >= effective_max_keys:
                    logger.warning(f"Scan safety limit {effective_max_keys} reached for pattern '{pattern}', truncating results")
                    all_keys = all_keys[:effective_max_keys]
                    break

            if iterations >= max_iterations:
                logger.warning(f"Scan iteration limit {max_iterations} reached for pattern '{pattern}', stopping scan")

            logger.info(f"Scanned {len(all_keys)} keys for pattern '{pattern}' in {iterations} iterations")
            return all_keys

    def delete_pattern(self, pattern: str, namespace: str = "alias") -> int:
        """Delete keys matching pattern using efficient scanning.

        Parameters
        ----------
        pattern : str
            Pattern to match (Redis SCAN pattern)
        namespace : str
            Cache namespace

        Returns
        -------
        int
            Number of keys deleted
        """
        with tracer.start_as_current_span("cache.delete_pattern", attributes={"cache.pattern": pattern, "cache.namespace": namespace}):
            if not self._health_check():
                return 0

            try:
                deleted_count = 0
                cursor = 0
                redis_pattern = self._serialize_key(pattern, namespace)

                while True:
                    cursor, keys = self._client.scan(cursor=cursor, match=redis_pattern, count=100)

                    if keys:
                        # Delete in batches for better performance
                        deleted_count += self._client.delete(*keys)

                    if cursor == 0:  # Scan complete
                        break

                    # Safety check to prevent infinite loops
                    if deleted_count > 50000:  # Large deletion safety limit
                        logger.warning(f"Large deletion detected for pattern '{pattern}', stopping at {deleted_count} keys")
                        break

                return deleted_count

            except RedisError as e:
                logger.warning(f"Redis delete pattern failed for '{pattern}': {e}")
                self._is_healthy = False
                return 0
            except Exception as e:
                logger.error(f"Unexpected error deleting pattern '{pattern}': {e}")
                return 0

    def pipeline_get(self, keys: List[str], value_type: type[T] = str, namespace: str = "alias") -> Dict[str, Optional[T]]:
        """Get multiple values using Redis pipeline for atomic operation.

        Parameters
        ----------
        keys : List[str]
            Cache keys to retrieve
        value_type : type[T]
            Expected value type for deserialization
        namespace : str
            Cache namespace for key organization

        Returns
        -------
        Dict[str, Optional[T]]
            Mapping of keys to cached values
        """
        with tracer.start_as_current_span("cache.pipeline_get", attributes={"cache.namespace": namespace, "cache.keys_count": len(keys)}):
            if not keys or not self._health_check():
                return {key: None for key in keys}

            try:
                with self._client.pipeline() as pipe:
                    redis_keys = [self._serialize_key(key, namespace) for key in keys]
                    for redis_key in redis_keys:
                        pipe.get(redis_key)

                    values = pipe.execute()

                    result = {}
                    for i, key in enumerate(keys):
                        value = values[i] if i < len(values) else None
                        if value is not None:
                            result[key] = self._deserialize_value(value, value_type)
                        else:
                            result[key] = None

                    return result

            except RedisError as e:
                logger.warning(f"Redis pipeline_get failed: {e}")
                self._is_healthy = False
                return {key: None for key in keys}
            except Exception as e:
                logger.error(f"Unexpected error in pipeline_get: {e}")
                return {key: None for key in keys}

    def pipeline_set(self, mapping: Dict[str, Any], ttl: Optional[int] = None, namespace: str = "alias", tags: Optional[Set[str]] = None) -> bool:
        """Set multiple values using Redis pipeline for atomic operation.

        Parameters
        ----------
        mapping : Dict[str, Any]
            Key-value pairs to set
        ttl : Optional[int]
            Time-to-live in seconds
        namespace : str
            Cache namespace for key organization
        tags : Optional[Set[str]]
            Tags for cache invalidation

        Returns
        -------
        bool
            True if all values set successfully
        """
        with tracer.start_as_current_span("cache.pipeline_set", attributes={"cache.namespace": namespace, "cache.keys_count": len(mapping)}):
            if not mapping or not self._health_check():
                return False

            try:
                with self._client.pipeline() as pipe:
                    redis_keys = []
                    for key, value in mapping.items():
                        redis_key = self._serialize_key(key, namespace)
                        redis_value = self._serialize_value(value)
                        redis_keys.append(redis_key)

                        pipe.set(redis_key, redis_value, ex=ttl)

                    # Add keys to tag sets if tags provided
                    if tags:
                        for tag in tags:
                            tag_key = self._serialize_key(f"tag:{tag}", "tags")
                            for redis_key in redis_keys:
                                pipe.sadd(tag_key, redis_key)
                            if ttl:  # Set same TTL on tag set
                                pipe.expire(tag_key, ttl + 300)  # 5 min buffer

                    pipe.execute()
                    return True

            except RedisError as e:
                logger.warning(f"Redis pipeline_set failed: {e}")
                self._is_healthy = False
                return False
            except Exception as e:
                logger.error(f"Unexpected error in pipeline_set: {e}")
                return False

    def set_with_tags(self, key: str, value: Any, tags: Set[str], ttl: Optional[int] = None, namespace: str = "alias") -> bool:
        """Set value with tags for invalidation support.

        Parameters
        ----------
        key : str
            Cache key
        value : Any
            Value to cache
        tags : Set[str]
            Tags for cache invalidation
        ttl : Optional[int]
            Time-to-live in seconds
        namespace : str
            Cache namespace for key organization

        Returns
        -------
        bool
            True if set successfully
        """
        return self.set(key, value, ttl=ttl, namespace=namespace, tags=tags)

    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all cache entries with a specific tag.

        Parameters
        ----------
        tag : str
            Tag to invalidate

        Returns
        -------
        int
            Number of keys invalidated
        """
        with tracer.start_as_current_span("cache.invalidate_by_tag", attributes={"cache.tag": tag}):
            if not self._health_check():
                return 0

            try:
                tag_key = self._serialize_key(f"tag:{tag}", "tags")

                # Get all keys with this tag
                keys = list(self._client.smembers(tag_key))

                if not keys:
                    return 0

                # Delete all keys and the tag set itself
                with self._client.pipeline() as pipe:
                    for key in keys:
                        pipe.delete(key)
                    pipe.delete(tag_key)
                    pipe.execute()

                logger.info(f"Invalidated {len(keys)} cache entries with tag '{tag}'")
                return len(keys)

            except RedisError as e:
                logger.warning(f"Redis invalidate_by_tag failed for tag '{tag}': {e}")
                self._is_healthy = False
                return 0
            except Exception as e:
                logger.error(f"Unexpected error invalidating tag '{tag}': {e}")
                return 0

    def invalidate_by_pattern(self, pattern: str, namespace: str = "alias", batch_size: int = 100) -> int:
        """Invalidate cache entries matching a wildcard pattern.

        Parameters
        ----------
        pattern : str
            Wildcard pattern (e.g., "user:*", "model:gpt*")
        namespace : str
            Cache namespace
        batch_size : int
            Batch size for pattern deletion

        Returns
        -------
        int
            Number of keys invalidated
        """
        with tracer.start_as_current_span("cache.invalidate_by_pattern", attributes={"cache.pattern": pattern, "cache.namespace": namespace}):
            return self.delete_pattern(pattern, namespace)

    def invalidate_dependencies(self, entity_type: str, entity_id: str, dependency_map: Optional[Dict[str, List[str]]] = None) -> int:
        """Invalidate cache entries based on entity dependencies.

        Parameters
        ----------
        entity_type : str
            Type of entity that changed (model, provider, alias)
        entity_id : str
            ID of entity that changed
        dependency_map : Optional[Dict[str, List[str]]]
            Map of entity types to their dependent patterns

        Returns
        -------
        int
            Number of keys invalidated
        """
        with tracer.start_as_current_span("cache.invalidate_dependencies", attributes={
            "cache.entity_type": entity_type,
            "cache.entity_id": entity_id
        }):
            if not dependency_map:
                dependency_map = self._get_default_dependency_map()

            total_invalidated = 0

            # Get dependent patterns for this entity type
            dependent_patterns = dependency_map.get(entity_type, [])

            for pattern in dependent_patterns:
                # Replace placeholders with actual entity ID
                resolved_pattern = pattern.replace("{entity_id}", entity_id)

                # Determine namespace from pattern
                if ":" in resolved_pattern:
                    namespace_part, pattern_part = resolved_pattern.split(":", 1)
                    count = self.invalidate_by_pattern(pattern_part, namespace_part)
                else:
                    count = self.invalidate_by_pattern(resolved_pattern, "alias")

                total_invalidated += count

            logger.info(f"Invalidated {total_invalidated} cache entries for {entity_type}:{entity_id} dependencies")
            return total_invalidated

    def _get_default_dependency_map(self) -> Dict[str, List[str]]:
        """Get default dependency mapping for cache invalidation.

        Returns
        -------
        Dict[str, List[str]]
            Default dependency patterns
        """
        return {
            "model": [
                "models:*{entity_id}*",
                "aliases:*{entity_id}*",
                "pricing:*{entity_id}*",
                "providers:models_*{entity_id}*"
            ],
            "provider": [
                "providers:*{entity_id}*",
                "models:*{entity_id}*",
                "aliases:provider_{entity_id}_*",
                "pricing:provider_{entity_id}_*"
            ],
            "alias": [
                "aliases:*{entity_id}*",
                "aliases:*",  # Clear all aliases for safety
                "models:alias_*{entity_id}*"
            ],
            "pricing": [
                "pricing:*{entity_id}*",
                "models:pricing_*{entity_id}*",
                "providers:pricing_*{entity_id}*"
            ]
        }

    def exists(self, key: str, namespace: str = "alias") -> bool:
        """Check if key exists in cache.

        Parameters
        ----------
        key : str
            Cache key to check

        Returns
        -------
        bool
            True if key exists
        """
        if not self._health_check():
            return False

        try:
            redis_key = self._serialize_key(key, namespace)
            return bool(self._client.exists(redis_key))

        except RedisError as e:
            logger.warning(f"Redis exists failed for key '{key}': {e}")
            self._is_healthy = False
            return False
        except Exception as e:
            logger.error(f"Unexpected error checking key '{key}': {e}")
            return False

    def ttl(self, key: str, namespace: str = "alias") -> int:
        """Get time-to-live for key.

        Parameters
        ----------
        key : str
            Cache key
        namespace : str
            Cache namespace

        Returns
        -------
        int
            TTL in seconds, -1 if no expiration, -2 if key doesn't exist
        """
        if not self._health_check():
            return -2

        try:
            redis_key = self._serialize_key(key, namespace)
            return self._client.ttl(redis_key)

        except RedisError as e:
            logger.warning(f"Redis ttl failed for key '{key}': {e}")
            self._is_healthy = False
            return -2
        except Exception as e:
            logger.error(f"Unexpected error getting ttl for key '{key}': {e}")
            return -2

    def extend_ttl(self, key: str, extension: int, namespace: str = "alias", max_ttl: Optional[int] = None) -> bool:
        """Extend TTL for sliding expiration (hot data management).

        Parameters
        ----------
        key : str
            Cache key
        extension : int
            TTL extension in seconds
        namespace : str
            Cache namespace
        max_ttl : Optional[int]
            Maximum allowed TTL to prevent infinite extension

        Returns
        -------
        bool
            True if TTL was extended
        """
        with tracer.start_as_current_span("cache.extend_ttl", attributes={"cache.key": key, "cache.namespace": namespace}):
            if not self._health_check():
                return False

            try:
                redis_key = self._serialize_key(key, namespace)
                current_ttl = self._client.ttl(redis_key)

                if current_ttl <= 0:  # Key doesn't exist or no expiration
                    return False

                new_ttl = current_ttl + extension

                # Apply max_ttl limit if specified
                if max_ttl and new_ttl > max_ttl:
                    new_ttl = max_ttl

                result = self._client.expire(redis_key, new_ttl)
                return bool(result)

            except RedisError as e:
                logger.warning(f"Redis extend_ttl failed for key '{key}': {e}")
                self._is_healthy = False
                return False
            except Exception as e:
                logger.error(f"Unexpected error extending ttl for key '{key}': {e}")
                return False

    def touch(self, key: str, namespace: str = "alias", sliding_window: int = 300) -> bool:
        """Touch key to implement sliding expiration.

        Parameters
        ----------
        key : str
            Cache key
        namespace : str
            Cache namespace
        sliding_window : int
            Sliding window in seconds

        Returns
        -------
        bool
            True if key was touched successfully
        """
        with tracer.start_as_current_span("cache.touch", attributes={"cache.key": key, "cache.namespace": namespace}):
            if not self._health_check():
                return False

            try:
                redis_key = self._serialize_key(key, namespace)

                # Check if key exists and get current TTL
                current_ttl = self._client.ttl(redis_key)
                if current_ttl <= 0:
                    return False

                # Reset TTL to sliding window if it's less than half the window
                if current_ttl < (sliding_window / 2):
                    result = self._client.expire(redis_key, sliding_window)
                    return bool(result)

                return True  # No need to extend

            except RedisError as e:
                logger.warning(f"Redis touch failed for key '{key}': {e}")
                self._is_healthy = False
                return False
            except Exception as e:
                logger.error(f"Unexpected error touching key '{key}': {e}")
                return False

    def get_circuit_breaker_stats(self) -> Dict[str, Any]:
        """Get circuit breaker statistics."""
        if not self._circuit_breaker:
            return {"enabled": False}

        stats = self._circuit_breaker.get_stats()
        stats["enabled"] = True
        return stats

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for cache operations."""
        metrics = self._operation_metrics.copy()

        if metrics["total_operations"] > 0:
            metrics["avg_latency_ms"] = metrics["total_latency_ms"] / metrics["total_operations"]
        else:
            metrics["avg_latency_ms"] = 0.0

        metrics["circuit_breaker"] = self.get_circuit_breaker_stats()
        metrics["target_latency_ms"] = settings.CACHE.CIRCUIT_BREAKER_LATENCY_THRESHOLD_MS
        metrics["performance_target_met"] = metrics["avg_latency_ms"] <= settings.CACHE.CIRCUIT_BREAKER_LATENCY_THRESHOLD_MS

        return metrics

    def reset_performance_metrics(self) -> None:
        """Reset performance tracking metrics."""
        self._operation_metrics = {
            "total_operations": 0,
            "total_latency_ms": 0.0,
            "circuit_breaker_blocks": 0
        }
        logger.info("Cache performance metrics reset")

    @property
    def is_healthy(self) -> bool:
        """Check if Redis connection is healthy."""
        return self._health_check()

    @property
    def circuit_breaker_state(self) -> str:
        """Get current circuit breaker state."""
        if not self._circuit_breaker:
            return "disabled"
        return self._circuit_breaker.get_state().value

    def mexists(self, keys: List[str], namespace: str = "alias") -> Dict[str, bool]:
        """Check existence of multiple keys efficiently.

        Parameters
        ----------
        keys : List[str]
            Cache keys to check
        namespace : str
            Cache namespace

        Returns
        -------
        Dict[str, bool]
            Mapping of keys to existence status
        """
        with tracer.start_as_current_span("cache.mexists", attributes={
            "cache.namespace": namespace,
            "cache.keys_count": len(keys)
        }):
            if not keys or not self._health_check():
                return {key: False for key in keys}

            try:
                redis_keys = [self._serialize_key(key, namespace) for key in keys]

                # Use pipeline for efficient batch existence check
                with self._client.pipeline() as pipe:
                    for redis_key in redis_keys:
                        pipe.exists(redis_key)
                    results = pipe.execute()

                return {
                    key: bool(results[i]) if i < len(results) else False
                    for i, key in enumerate(keys)
                }

            except RedisError as e:
                logger.warning(f"Redis mexists failed: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace,
                    "keys_count": len(keys)
                })
                self._is_healthy = False
                return {key: False for key in keys}
            except Exception as e:
                logger.error(f"Unexpected error in mexists: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return {key: False for key in keys}

    def mttl(self, keys: List[str], namespace: str = "alias") -> Dict[str, int]:
        """Get TTL for multiple keys efficiently.

        Parameters
        ----------
        keys : List[str]
            Cache keys to check
        namespace : str
            Cache namespace

        Returns
        -------
        Dict[str, int]
            Mapping of keys to TTL values (-1 if no expiration, -2 if key doesn't exist)
        """
        with tracer.start_as_current_span("cache.mttl", attributes={
            "cache.namespace": namespace,
            "cache.keys_count": len(keys)
        }):
            if not keys or not self._health_check():
                return {key: -2 for key in keys}

            try:
                redis_keys = [self._serialize_key(key, namespace) for key in keys]

                # Use pipeline for efficient batch TTL check
                with self._client.pipeline() as pipe:
                    for redis_key in redis_keys:
                        pipe.ttl(redis_key)
                    results = pipe.execute()

                return {
                    key: int(results[i]) if i < len(results) else -2
                    for i, key in enumerate(keys)
                }

            except RedisError as e:
                logger.warning(f"Redis mttl failed: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace,
                    "keys_count": len(keys)
                })
                self._is_healthy = False
                return {key: -2 for key in keys}
            except Exception as e:
                logger.error(f"Unexpected error in mttl: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return {key: -2 for key in keys}

    def mtouch(self, keys: List[str], namespace: str = "alias", sliding_window: int = 300) -> Dict[str, bool]:
        """Touch multiple keys for sliding expiration efficiently.

        Parameters
        ----------
        keys : List[str]
            Cache keys to touch
        namespace : str
            Cache namespace
        sliding_window : int
            Sliding window in seconds

        Returns
        -------
        Dict[str, bool]
            Mapping of keys to touch success status
        """
        with tracer.start_as_current_span("cache.mtouch", attributes={
            "cache.namespace": namespace,
            "cache.keys_count": len(keys),
            "cache.sliding_window": sliding_window
        }):
            if not keys or not self._health_check():
                return {key: False for key in keys}

            try:
                results = {}
                redis_keys = [self._serialize_key(key, namespace) for key in keys]

                # Get current TTLs for all keys first
                with self._client.pipeline() as pipe:
                    for redis_key in redis_keys:
                        pipe.ttl(redis_key)
                    ttls = pipe.execute()

                # Update TTL for keys that need it
                with self._client.pipeline() as pipe:
                    for i, (key, redis_key) in enumerate(zip(keys, redis_keys)):
                        current_ttl = ttls[i] if i < len(ttls) else -2

                        if current_ttl <= 0:
                            results[key] = False
                        elif current_ttl < (sliding_window / 2):
                            pipe.expire(redis_key, sliding_window)
                            results[key] = True
                        else:
                            results[key] = True  # No need to extend

                    pipe.execute()
                    return results

            except RedisError as e:
                logger.warning(f"Redis mtouch failed: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace,
                    "keys_count": len(keys)
                })
                self._is_healthy = False
                return {key: False for key in keys}
            except Exception as e:
                logger.error(f"Unexpected error in mtouch: {e}", extra={
                    "trace_id": tracer.get_current_span().get_span_context().trace_id,
                    "namespace": namespace
                })
                return {key: False for key in keys}

    def get_memory_usage(self, key: Optional[str] = None, namespace: str = "alias") -> Dict[str, Any]:
        """Get memory usage statistics for cache keys.

        Parameters
        ----------
        key : Optional[str]
            Specific key to check (if None, returns overall stats)
        namespace : str
            Cache namespace

        Returns
        -------
        Dict[str, Any]
            Memory usage statistics
        """
        with tracer.start_as_current_span("cache.get_memory_usage", attributes={
            "cache.namespace": namespace,
            "cache.specific_key": bool(key)
        }):
            if not self._health_check():
                return {"error": "Redis not available"}

            try:
                if key:
                    redis_key = self._serialize_key(key, namespace)
                    try:
                        memory_usage = self._client.memory_usage(redis_key)
                        return {
                            "key": key,
                            "memory_bytes": memory_usage,
                            "memory_mb": round(memory_usage / (1024 * 1024), 2) if memory_usage else 0
                        }
                    except redis.ResponseError:
                        # MEMORY USAGE not supported in older Redis versions
                        return {"key": key, "memory_bytes": None, "error": "MEMORY USAGE not supported"}
                else:
                    # Get overall Redis memory info
                    info = self._client.info(section='memory')
                    return {
                        "used_memory": info.get('used_memory', 0),
                        "used_memory_human": info.get('used_memory_human', '0B'),
                        "used_memory_peak": info.get('used_memory_peak', 0),
                        "used_memory_peak_human": info.get('used_memory_peak_human', '0B'),
                        "maxmemory": info.get('maxmemory', 0)
                    }

            except RedisError as e:
                logger.warning(f"Redis memory usage check failed: {e}")
                self._is_healthy = False
                return {"error": str(e)}
            except Exception as e:
                logger.error(f"Unexpected error getting memory usage: {e}")
                return {"error": str(e)}

    def close(self) -> None:
        """Close Redis connection and cleanup resources."""
        try:
            # Log final metrics before closing
            if hasattr(self, '_operation_metrics'):
                logger.info(f"Cache instance closing with metrics: {self.get_performance_metrics()}")

            if self._client:
                self._client.close()
            if self._pool:
                self._pool.disconnect()
        except Exception as e:
            logger.warning(f"Error closing Redis connection: {e}")
        finally:
            self._client = None
            self._pool = None
            self._is_healthy = False
            logger.info("Redis cache connection closed successfully")


# Global cache instance
_cache_instance: Optional[RedisCache] = None


def get_cache() -> RedisCache:
    """Get the global cache instance."""
    global _cache_instance

    if _cache_instance is None:
        _cache_instance = RedisCache()
        logger.info("Initialized global Redis cache instance with enhanced features")

    return _cache_instance


def close_cache() -> None:
    """Close the global cache instance."""
    global _cache_instance

    if _cache_instance is not None:
        # Log final performance metrics before closing
        try:
            metrics = _cache_instance.get_performance_metrics()
            logger.info(f"Final cache performance metrics: {metrics}")
        except Exception as e:
            logger.warning(f"Failed to get final performance metrics: {e}")

        _cache_instance.close()
        _cache_instance = None
        logger.info("Closed global Redis cache instance")


def get_cache_performance_report() -> Dict[str, Any]:
    """Get comprehensive cache performance report."""
    cache = get_cache()
    return {
        "health": cache.is_healthy,
        "performance_metrics": cache.get_performance_metrics(),
        "circuit_breaker": cache.get_circuit_breaker_stats(),
        "timestamp": time.time()
    }
