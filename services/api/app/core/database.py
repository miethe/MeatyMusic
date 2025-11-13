"""Database engine and session utilities."""

from __future__ import annotations

import logging
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure engine based on database type
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite doesn't support pool_size or max_overflow
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
    )
else:
    # PostgreSQL and other databases support connection pooling
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db_session() -> Iterator[Session]:
    """Yield a database session with commit/rollback handling."""

    db: Session = SessionLocal()
    logger.debug("db.session.open")
    try:
        yield db
        db.commit()
        logger.debug("db.session.commit")
    except Exception:  # pragma: no cover - defensive
        db.rollback()
        logger.debug("db.session.rollback", exc_info=True)
        raise
    finally:
        db.close()
        logger.debug("db.session.close")


# Backwards compatible alias used across the codebase
get_db = get_db_session
