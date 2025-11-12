"""Async database engine and session utilities."""
from __future__ import annotations

import logging
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

logger = logging.getLogger(__name__)

# Convert sync DATABASE_URL to async URL
def _get_async_database_url() -> str:
    """Convert synchronous database URL to async format."""
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    else:
        # Already async or unsupported format
        return url

# Configure async engine based on database type
async_database_url = _get_async_database_url()

if async_database_url.startswith("sqlite+aiosqlite"):
    # SQLite doesn't support pool_size or max_overflow
    async_engine = create_async_engine(
        async_database_url,
        pool_pre_ping=True,
    )
else:
    # PostgreSQL and other databases support connection pooling
    async_engine = create_async_engine(
        async_database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_async_db_session() -> AsyncIterator[AsyncSession]:
    """Yield an async database session with commit/rollback handling."""
    async with AsyncSessionLocal() as db:
        logger.debug("async_db.session.open")
        try:
            yield db
            await db.commit()
            logger.debug("async_db.session.commit")
        except Exception:  # pragma: no cover - defensive
            await db.rollback()
            logger.debug("async_db.session.rollback", exc_info=True)
            raise
        finally:
            await db.close()
            logger.debug("async_db.session.close")


# Convenience alias
get_async_db = get_async_db_session
