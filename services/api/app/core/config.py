"""Configuration module for API settings.

Defines the main :class:`Settings` object used across the API service. All
observability-related configuration is centralized in the nested
:class:`ObservabilitySettings` model which reads its values from environment
variables prefixed with ``OBS_``.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal, Dict, Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ObservabilitySettings(BaseSettings):
    """Settings related to logging, tracing, and telemetry.

    Environment variables use the ``OBS_`` prefix. For example,
    ``OBS_TRACING_ENABLED`` toggles distributed tracing.
    """

    TRACING_ENABLED: bool = True
    TELEMETRY_ENABLED: bool = True
    LOG_JSON_FORMAT: bool = True
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    OTEL_EXPORTER_TYPE: Literal["console", "otlp", "memory"] = "console"
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None

    # Structured logging settings
    LOG_REQUEST_BODY: bool = False
    LOG_RESPONSE_BODY: bool = False
    LOG_DATABASE_QUERIES: bool = True
    SLOW_QUERY_THRESHOLD: float = 0.1
    MAX_LOG_BODY_SIZE: int = 1024

    # Log sampling and filtering
    LOG_SAMPLE_RATE: float = 1.0
    LOG_EXCLUDE_PATHS: list[str] = ["/healthz", "/metrics", "/_internal"]
    LOG_EXCLUDE_METHODS: list[str] = []

    # Correlation and context
    CORRELATION_HEADER_NAME: str = "X-Correlation-ID"
    REQUEST_ID_HEADER_NAME: str = "X-Request-ID"
    ENABLE_PERFORMANCE_LOGGING: bool = True

    # Error handling
    LOG_STACK_TRACES: bool = True
    ERROR_CATEGORIZATION_ENABLED: bool = True

    model_config = SettingsConfigDict(env_prefix="OBS_")

    @field_validator("OTEL_EXPORTER_TYPE", mode="before")
    @classmethod
    def _lower_exporter(cls, value: str) -> str:
        """Normalize exporter names to lowercase."""
        return value.lower()

    @model_validator(mode="after")
    def _validate_otlp_endpoint(self) -> "ObservabilitySettings":
        """Ensure an OTLP endpoint is provided when required."""
        if (
            self.OTEL_EXPORTER_TYPE == "otlp"
            and not self.OTEL_EXPORTER_OTLP_ENDPOINT
        ):
            raise ValueError(
                "OTEL_EXPORTER_OTLP_ENDPOINT must be set when OTEL_EXPORTER_TYPE is 'otlp'"
            )
        return self


class CacheSettings(BaseSettings):
    """Cache configuration settings.

    Environment variables use the ``CACHE_`` prefix. For example,
    ``CACHE_ENABLED`` controls whether caching is active.
    """

    # General cache settings
    ENABLED: bool = True
    DEFAULT_TTL: int = 3600  # 1 hour default
    COMPRESSION_ENABLED: bool = True
    COMPRESSION_THRESHOLD: int = 1024  # bytes
    ENABLE_WARMING: bool = True  # Enable startup cache warming

    # L1 (Memory) cache settings
    L1_ENABLED: bool = True
    L1_MAX_SIZE: int = 1000  # Maximum number of entries
    L1_TTL: int = 300  # 5 minutes

    # L2 (Redis) cache settings
    L2_ENABLED: bool = True
    L2_CONNECTION_POOL_SIZE: int = 50
    L2_HEALTH_CHECK_INTERVAL: int = 30

    # Cache strategies per data type
    MODEL_DATA_TTL: int = 3600  # 1 hour
    MODEL_DATA_PREWARM_COUNT: int = 100  # Top 100 models

    PROVIDER_METADATA_TTL: int = 14400  # 4 hours
    PROVIDER_METADATA_PREWARM_ALL: bool = True  # Pre-warm all active providers

    ALIAS_MAPPINGS_PRIMARY_TTL: int = 1800  # 30 minutes
    ALIAS_MAPPINGS_HISTORICAL_TTL: int = 86400  # 24 hours

    PRICING_INFO_TTL: int = 7200  # 2 hours

    # Metrics-specific cache TTLs
    METRICS_TTL: int = 300  # 5 minutes for real-time metrics
    METRICS_SUMMARY_TTL: int = 900  # 15 minutes for summaries
    METRICS_AVAILABILITY_TTL: int = 1800  # 30 minutes for availability checks
    METRICS_AGGREGATES_TTL: int = 3600  # 1 hour for pre-computed aggregates

    # Performance targets for metrics
    METRICS_API_RESPONSE_P95_TARGET_MS: int = 200
    METRICS_CACHE_HIT_RATIO_TARGET: float = 0.95
    METRICS_PERCENTILE_CALCULATION_P95_TARGET_MS: int = 50

    # Monitoring and performance
    HIT_RATIO_TARGET: float = 0.95  # >95% hit ratio target
    MONITORING_ENABLED: bool = True
    METRICS_COLLECTION_INTERVAL: int = 60  # seconds

    # Tag-based invalidation
    TAG_INVALIDATION_ENABLED: bool = True
    TAG_SET_TTL_BUFFER: int = 300  # 5 minutes buffer for tag sets

    # Tenant awareness
    TENANT_AWARE: bool = True
    TENANT_KEY_PREFIX: str = "tenant"

    # Enhanced operation settings
    BATCH_SIZE_LIMIT: int = 1000            # Maximum batch size for operations
    SCAN_COUNT_DEFAULT: int = 100           # Default count for scan operations
    SLIDING_EXPIRATION_ENABLED: bool = True # Enable sliding expiration
    SLIDING_WINDOW_DEFAULT: int = 300       # Default sliding window (5 minutes)

    # Circuit breaker settings
    CIRCUIT_BREAKER_ENABLED: bool = True
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = 5
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: int = 60
    CIRCUIT_BREAKER_LATENCY_THRESHOLD_MS: float = 50.0
    CIRCUIT_BREAKER_HIT_RATIO_THRESHOLD: float = 0.80

    # Performance monitoring
    PERFORMANCE_MONITORING_ENABLED: bool = True
    LATENCY_TRACKING_ENABLED: bool = True
    HIT_RATIO_TRACKING_ENABLED: bool = True

    # CDN configuration
    CDN_ENABLED: bool = True
    CDN_PROVIDER: str = "cloudflare"  # "cloudflare", "cloudfront", "custom"
    CDN_API_TOKEN: str = ""
    CDN_ZONE_ID: str = ""
    CDN_PURGE_ENABLED: bool = True
    CDN_PURGE_TIMEOUT: int = 30  # seconds
    CDN_PURGE_BATCH_SIZE: int = 30  # URLs per batch

    # CDN cache policies
    CDN_STATIC_ASSETS_TTL: int = 31536000  # 1 year for logos/icons
    CDN_MODEL_DOCS_TTL: int = 86400        # 1 day for documentation
    CDN_API_SCHEMAS_TTL: int = 3600        # 1 hour for API schemas
    CDN_MODEL_LISTINGS_TTL: int = 900      # 15 minutes for public listings
    CDN_DYNAMIC_CONTENT_TTL: int = 300     # 5 minutes for dynamic content
    CDN_SEARCH_RESULTS_TTL: int = 120      # 2 minutes for search
    CDN_PRICING_TTL: int = 600             # 10 minutes for pricing
    CDN_API_RESPONSES_TTL: int = 30        # 30 seconds for API responses

    # Materialized view configuration
    MATERIALIZED_VIEWS_ENABLED: bool = True
    MV_POPULAR_MODELS_ENABLED: bool = True
    MV_POPULAR_MODELS_REFRESH_INTERVAL: int = 3600     # 1 hour
    MV_PROVIDER_SUMMARY_ENABLED: bool = True
    MV_PROVIDER_SUMMARY_REFRESH_INTERVAL: int = 7200   # 2 hours
    MV_CAPABILITIES_MATRIX_ENABLED: bool = True
    MV_CAPABILITIES_MATRIX_REFRESH_INTERVAL: int = 86400  # 24 hours
    MV_PRICING_TRENDS_ENABLED: bool = True
    MV_PRICING_TRENDS_REFRESH_INTERVAL: int = 3600     # 1 hour
    MV_SEARCH_INDEX_ENABLED: bool = True
    MV_SEARCH_INDEX_REFRESH_INTERVAL: int = 1800       # 30 minutes
    MV_REFRESH_TIMEOUT: int = 300                      # 5 minutes max per refresh
    MV_CONCURRENT_REFRESHES: int = 2                   # Max concurrent refreshes

    model_config = SettingsConfigDict(env_prefix="CACHE_")

    @property
    def cache_strategies(self) -> Dict[str, Dict[str, Any]]:
        """Get cache strategies configuration for different data types."""
        return {
            "model_data": {
                "ttl": self.MODEL_DATA_TTL,
                "namespace": "models",
                "prewarm_count": self.MODEL_DATA_PREWARM_COUNT,
                "tags": {"models", "metadata"}
            },
            "provider_metadata": {
                "ttl": self.PROVIDER_METADATA_TTL,
                "namespace": "providers",
                "prewarm_all": self.PROVIDER_METADATA_PREWARM_ALL,
                "tags": {"providers", "metadata"}
            },
            "alias_mappings_primary": {
                "ttl": self.ALIAS_MAPPINGS_PRIMARY_TTL,
                "namespace": "aliases",
                "tags": {"aliases", "mappings"}
            },
            "alias_mappings_historical": {
                "ttl": self.ALIAS_MAPPINGS_HISTORICAL_TTL,
                "namespace": "aliases_historical",
                "tags": {"aliases", "historical"}
            },
            "pricing_info": {
                "ttl": self.PRICING_INFO_TTL,
                "namespace": "pricing",
                "tags": {"pricing", "metadata"}
            }
        }


class Settings(BaseSettings):
    """Top-level application settings."""

    # Service identification
    SERVICE_NAME: str = "meatymusic-api"

    # Database configuration
    DATABASE_URL: str
    DATABASE_URL_TEST: str
    POSTGRES_DB: str = "meatymusic"

    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "MeatyMusic"
    PROJECT_DESCRIPTION: str = "Agentic Music Creation System (AMCS)"
    CLERK_WEBHOOK_SECRET: str
    CLERK_SECRET_KEY: str | None = None
    CLERK_JWKS_URL: str
    CLERK_JWT_ISSUER: str
    CLERK_JWKS_CACHE_TTL: int = 3600
    AUTH_PROVIDER: str = "clerk"
    AUTH_SIGNING_SECRET: str = "secret"
    PROMPT_ENGINE_ENABLED: bool = True
    MODEL_CONFIG_DIR: str = str(
        Path(__file__).resolve().parents[2] / "config/models"
    ) if (Path(__file__).resolve().parents[2] / "config/models").exists() else "/app/config/models"

    # Add ENVIRONMENT field to accept environment variable
    ENVIRONMENT: str = "development"

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_HEALTH_CHECK_INTERVAL: int = 30

    # Development-only auth bypass for MCP/agent testing
    DEV_AUTH_BYPASS_ENABLED: bool = False
    DEV_AUTH_BYPASS_SECRET: str | None = None
    DEV_AUTH_BYPASS_USER_ID: str = "dev-user-00000000-0000-0000-0000-000000000000"

    OBS: ObservabilitySettings = ObservabilitySettings()
    CACHE: CacheSettings = CacheSettings()

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def _validate_dev_bypass_security(self) -> "Settings":
        """Ensure dev bypass is only enabled in development with strong security."""
        if self.DEV_AUTH_BYPASS_ENABLED:
            # Never allow in production
            environment = self.ENVIRONMENT
            if environment == "production":
                raise ValueError(
                    "DEV_AUTH_BYPASS_ENABLED cannot be true in production environment"
                )

            # Require strong secret
            if not self.DEV_AUTH_BYPASS_SECRET or len(self.DEV_AUTH_BYPASS_SECRET) < 32:
                raise ValueError(
                    "DEV_AUTH_BYPASS_SECRET must be at least 32 characters when bypass is enabled"
                )

            # Log warning for visibility
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                "⚠️  DEV_AUTH_BYPASS is ENABLED - development only! "
                "This allows bypassing authentication with a secret header."
            )

        return self


settings = Settings()
