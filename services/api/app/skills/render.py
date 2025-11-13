"""RENDER workflow skill - Submit composed prompt to rendering engine.

Feature-flagged skill that submits the final composed prompt to an external
music rendering engine (e.g., Suno, Stable Audio). Returns job information
for tracking and asset retrieval.
"""

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from opentelemetry import trace

from app.connectors import MockConnector, RenderConnector

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class ConnectorFactory:
    """Factory for creating render connectors based on engine type.

    Supports pluggable connectors for different rendering engines.
    """

    _connectors: dict[str, RenderConnector] = {}

    @classmethod
    def register_connector(cls, engine: str, connector: RenderConnector) -> None:
        """Register a connector for an engine type.

        Args:
            engine: Engine identifier (e.g., "mock", "suno")
            connector: Connector instance
        """
        cls._connectors[engine] = connector

    @classmethod
    def get_connector(cls, engine: str) -> RenderConnector:
        """Get connector for an engine type.

        Args:
            engine: Engine identifier

        Returns:
            Connector instance

        Raises:
            ValueError: Unknown engine
        """
        if engine not in cls._connectors:
            supported = ", ".join(cls._connectors.keys())
            raise ValueError(
                f"Unknown rendering engine '{engine}'. Supported: {supported}"
            )

        return cls._connectors[engine]

    @classmethod
    def get_supported_engines(cls) -> list[str]:
        """Get list of supported engine identifiers.

        Returns:
            List of engine IDs
        """
        return list(cls._connectors.keys())


# Register mock connector by default
ConnectorFactory.register_connector("mock", MockConnector())


async def submit_render(
    engine: str,
    model: str,
    composed_prompt: dict[str, Any],
    num_variations: int,
    seed: int,
    render_enabled: bool = False,
    run_id: str | UUID | None = None,
) -> dict[str, Any] | None:
    """Submit composed prompt to rendering engine.

    Args:
        engine: Rendering engine ID (e.g., "suno", "mock")
        model: Model version (e.g., "suno-v3.5", "mock-v1")
        composed_prompt: Final prompt from COMPOSE node
        num_variations: Number of variations to generate (1-3)
        seed: Workflow seed for reproducibility
        render_enabled: Feature flag for rendering (default: False)
        run_id: Optional workflow run identifier

    Returns:
        Render job information:
            - job_id: Job identifier
            - status: "queued" | "processing" | "completed"
            - created_at: ISO 8601 timestamp
            - asset_uri: URI if sync completion
            - metadata: Engine-specific info

        Returns None if rendering is disabled via feature flag.

    Raises:
        ValueError: Invalid parameters or unsupported engine
        ConnectionError: Network or API errors
    """
    with tracer.start_as_current_span("render.submit") as span:
        span.set_attribute("engine", engine)
        span.set_attribute("model", model)
        span.set_attribute("num_variations", num_variations)
        span.set_attribute("render_enabled", render_enabled)

        # Check feature flag
        if not render_enabled:
            logger.info(
                "Rendering disabled by feature flag",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "engine": engine,
                },
            )
            return None

        # Validate parameters
        if not 1 <= num_variations <= 3:
            raise ValueError(f"num_variations must be 1-3, got {num_variations}")

        # Get connector
        try:
            connector = ConnectorFactory.get_connector(engine)
        except ValueError as e:
            logger.error(
                "Unknown rendering engine",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "engine": engine,
                    "supported_engines": ConnectorFactory.get_supported_engines(),
                },
            )
            raise

        # Validate prompt against engine constraints
        with tracer.start_as_current_span("render.validate_prompt"):
            try:
                connector.validate_prompt(composed_prompt, model)
            except ValueError as e:
                logger.error(
                    "Prompt validation failed",
                    extra={
                        "run_id": str(run_id) if run_id else None,
                        "engine": engine,
                        "model": model,
                        "error": str(e),
                    },
                )
                raise

        # Submit job
        start_time = datetime.now(timezone.utc)

        try:
            with tracer.start_as_current_span("render.connector.submit_job"):
                result = await connector.submit_job(
                    prompt=composed_prompt,
                    model=model,
                    num_variations=num_variations,
                    seed=seed,
                )

            end_time = datetime.now(timezone.utc)
            duration_ms = (end_time - start_time).total_seconds() * 1000

            logger.info(
                "Render job submitted successfully",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": result["job_id"],
                    "engine": engine,
                    "model": model,
                    "status": result["status"],
                    "duration_ms": duration_ms,
                },
            )

            span.set_attribute("job_id", result["job_id"])
            span.set_attribute("status", result["status"])
            span.set_attribute("duration_ms", duration_ms)

            return result

        except ConnectionError as e:
            logger.error(
                "Render submission failed - connection error",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "engine": engine,
                    "model": model,
                    "error": str(e),
                },
            )
            raise

        except Exception as e:
            logger.error(
                "Render submission failed - unexpected error",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "engine": engine,
                    "model": model,
                    "error": str(e),
                },
                exc_info=True,
            )
            raise


async def get_render_status(
    job_id: str,
    engine: str,
    run_id: str | UUID | None = None,
) -> dict[str, Any]:
    """Get status of a render job.

    Args:
        job_id: Job identifier
        engine: Rendering engine ID
        run_id: Optional workflow run identifier

    Returns:
        Job status with asset_uri if completed

    Raises:
        ValueError: Unknown job_id or engine
        ConnectionError: Network or API errors
    """
    with tracer.start_as_current_span("render.get_status") as span:
        span.set_attribute("job_id", job_id)
        span.set_attribute("engine", engine)

        connector = ConnectorFactory.get_connector(engine)

        try:
            status = await connector.get_status(job_id)

            logger.info(
                "Retrieved render job status",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": job_id,
                    "status": status["status"],
                },
            )

            span.set_attribute("status", status["status"])

            return status

        except ValueError as e:
            logger.error(
                "Unknown job_id",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": job_id,
                    "engine": engine,
                },
            )
            raise

        except ConnectionError as e:
            logger.error(
                "Status check failed - connection error",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": job_id,
                    "engine": engine,
                    "error": str(e),
                },
            )
            raise


async def cancel_render_job(
    job_id: str,
    engine: str,
    run_id: str | UUID | None = None,
) -> bool:
    """Cancel a render job.

    Args:
        job_id: Job identifier
        engine: Rendering engine ID
        run_id: Optional workflow run identifier

    Returns:
        True if cancelled, False if already completed/failed

    Raises:
        ValueError: Unknown job_id or engine
        ConnectionError: Network or API errors
    """
    with tracer.start_as_current_span("render.cancel") as span:
        span.set_attribute("job_id", job_id)
        span.set_attribute("engine", engine)

        connector = ConnectorFactory.get_connector(engine)

        try:
            cancelled = await connector.cancel_job(job_id)

            logger.info(
                "Render job cancellation",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": job_id,
                    "cancelled": cancelled,
                },
            )

            span.set_attribute("cancelled", cancelled)

            return cancelled

        except ValueError as e:
            logger.error(
                "Unknown job_id",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": job_id,
                    "engine": engine,
                },
            )
            raise

        except ConnectionError as e:
            logger.error(
                "Cancellation failed - connection error",
                extra={
                    "run_id": str(run_id) if run_id else None,
                    "job_id": job_id,
                    "engine": engine,
                    "error": str(e),
                },
            )
            raise
