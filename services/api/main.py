"""MeatyMusic AMCS API main application.

This module initializes the FastAPI application with all middleware,
routes, and observability components.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine
from app.observability.tracing import init_tracing
from app.middleware.correlation import CorrelationMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info(
        "Starting MeatyMusic AMCS API",
        extra={
            "service_name": settings.SERVICE_NAME,
            "environment": settings.ENVIRONMENT,
            "tracing_enabled": settings.OBS.TRACING_ENABLED,
        },
    )

    yield

    # Shutdown
    logger.info("Shutting down MeatyMusic AMCS API")
    engine.dispose()


# Create FastAPI application
app = FastAPI(
    title="MeatyMusic AMCS API",
    description="Agentic Music Creation System",
    version="0.1.0",
    lifespan=lifespan,
)

# Initialize tracing (OpenTelemetry)
if settings.OBS.TRACING_ENABLED:
    init_tracing(app, engine)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware stack (order matters - last added is executed first)
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(CorrelationMiddleware)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint.

    Returns:
        dict: Status indicating the service is healthy.
    """
    return {"status": "healthy", "service": settings.SERVICE_NAME}


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """Root endpoint.

    Returns:
        dict: Welcome message and API information.
    """
    return {
        "message": "MeatyMusic AMCS API",
        "description": "Agentic Music Creation System",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception",
        exc_info=exc,
        extra={
            "path": request.url.path,
            "method": request.method,
        },
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else None,
        },
    )


# Add API routers
from app.api.v1 import api_router

app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
