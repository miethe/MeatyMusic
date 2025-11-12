"""Central database session management.

This module provides the single source of truth for database session
dependency injection across the entire FastAPI application.
"""

from app.core.database import engine, get_db_session, SessionLocal

# Primary dependency for all routes - provides automatic commit/rollback
get_db = get_db_session

__all__ = ["engine", "SessionLocal", "get_db"]
