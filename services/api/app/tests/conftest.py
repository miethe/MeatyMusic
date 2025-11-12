"""Shared test fixtures and configuration for MeatyMusic test suites.

This module provides common fixtures and utilities for testing AMCS entities,
ensuring consistent test setup and teardown across all test suites.
"""

import os
import uuid
from contextlib import contextmanager
from datetime import datetime
from typing import Dict, Generator, List
from unittest.mock import MagicMock

import pytest
import structlog
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.rls import apply_session_context
from app.models.base import Base

# Set test environment variables
os.environ.setdefault("DATABASE_URL_TEST", "sqlite:///:memory:")
os.environ.setdefault("CLERK_JWT_VERIFICATION_KEY", "test-secret")
os.environ.setdefault("CLERK_WEBHOOK_SECRET", "whsec_test")

logger = structlog.get_logger(__name__)


@pytest.fixture(scope="session")
def test_engine() -> Generator[Engine, None, None]:
    """Create test database engine with RLS support."""
    engine = create_engine(
        settings.DATABASE_URL_TEST,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL_TEST else {},
        echo=False  # Set to True for SQL debugging
    )

    # Apply RLS middleware
    event.listen(engine, "checkout", apply_session_context)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Cleanup
    engine.dispose()


@pytest.fixture
def test_session(test_engine: Engine) -> Generator[Session, None, None]:
    """Create test database session."""
    TestingSession = sessionmaker(bind=test_engine)
    session = TestingSession()

    try:
        yield session
    finally:
        # Cleanup session
        session.rollback()
        session.close()


@contextmanager
def rls_context(
    session: Session,
    user_id: str = None,
    tenant_id: str = None,
    role: str = "user"
) -> Generator[None, None, None]:
    """Context manager for setting RLS session variables.

    Args:
        session: Database session
        user_id: User UUID for user-owned table access
        tenant_id: Tenant UUID for tenant-owned table access
        role: User role for role-based access
    """
    try:
        if user_id:
            session.execute(text("SET app.user_id = :user_id"), {"user_id": user_id})
        if tenant_id:
            session.execute(text("SET app.tenant_id = :tenant_id"), {"tenant_id": tenant_id})
        if role:
            session.execute(text("SET app.role = :role"), {"role": role})
        yield
    finally:
        # Always reset session variables to prevent cross-test pollution
        session.execute(text("RESET app.user_id"))
        session.execute(text("RESET app.tenant_id"))
        session.execute(text("RESET app.role"))


@pytest.fixture
def test_user_ids() -> Dict[str, str]:
    """Generate test user IDs for consistent testing."""
    return {
        'user1': str(uuid.uuid4()),
        'user2': str(uuid.uuid4()),
        'user3': str(uuid.uuid4()),
        'admin_user': str(uuid.uuid4())
    }


@pytest.fixture
def test_tenant_ids() -> Dict[str, str]:
    """Generate test tenant IDs for consistent testing."""
    return {
        'tenant1': str(uuid.uuid4()),
        'tenant2': str(uuid.uuid4()),
        'tenant3': str(uuid.uuid4())
    }


@pytest.fixture
def mock_db():
    """Mock database session for unit tests."""
    return MagicMock(spec=Session)


@pytest.fixture
def user_id():
    """Sample user ID for tests."""
    return uuid.uuid4()


@pytest.fixture
def other_user_id():
    """Another user ID for RLS tests."""
    return uuid.uuid4()


@pytest.fixture
def tenant_id():
    """Sample tenant ID for tests."""
    return uuid.uuid4()


@pytest.fixture
def other_tenant_id():
    """Another tenant ID for RLS tests."""
    return uuid.uuid4()


def cleanup_test_data(session: Session, table_name: str, ids: List[str]) -> None:
    """Utility function to cleanup test data."""
    try:
        for test_id in ids:
            session.execute(text(f"DELETE FROM {table_name} WHERE id = :id"), {"id": test_id})
        session.commit()
    except Exception as e:
        logger.warning(f"Cleanup failed for {table_name}", error=str(e))
        session.rollback()


class PerformanceTimer:
    """Simple performance timer for test measurements."""

    def __init__(self):
        self.start_time = 0.0
        self.end_time = 0.0

    def __enter__(self):
        import time
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.end_time = time.perf_counter()

    @property
    def duration_ms(self) -> float:
        """Get duration in milliseconds."""
        return (self.end_time - self.start_time) * 1000


# Test markers for organizing test runs

def pytest_configure(config):
    """Configure custom pytest markers."""
    config.addinivalue_line(
        "markers", "rls_policy: mark test as RLS policy test"
    )
    config.addinivalue_line(
        "markers", "rls_performance: mark test as RLS performance test"
    )
    config.addinivalue_line(
        "markers", "rls_integration: mark test as RLS integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
