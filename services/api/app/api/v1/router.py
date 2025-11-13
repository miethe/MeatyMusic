"""API v1 router aggregator.

This module aggregates all v1 API routers into a single router
that can be included in the main FastAPI application.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    blueprints,
    lyrics,
    monitoring,
    personas,
    producer_notes,
    runs,
    songs,
    sources,
    styles,
    workflow_runs,
)

# Create main v1 router
api_router = APIRouter(prefix="/api/v1")

# Include all entity routers
api_router.include_router(blueprints.router)
api_router.include_router(lyrics.router)
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(personas.router)
api_router.include_router(producer_notes.router)
api_router.include_router(runs.router)  # Workflow execution endpoints
api_router.include_router(songs.router)
api_router.include_router(sources.router)
api_router.include_router(styles.router)
api_router.include_router(workflow_runs.router)

__all__ = ["api_router"]
