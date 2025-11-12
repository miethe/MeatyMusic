"""Base model for all SQLAlchemy models with multi-tenancy support."""

from datetime import datetime
from sqlalchemy import Column, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID as SA_UUID
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func
from app.db.functions.uuid_v7 import UUIDv7Mixin


class Base(UUIDv7Mixin, DeclarativeBase):
    """Base class for all database models."""

    pass


class BaseModel(Base):
    """Abstract base model with timestamps and multi-tenancy fields.

    All AMCS entity models inherit from this base to ensure:
    - Automatic UUID v7 primary keys for monotonic ordering
    - Created/updated timestamps for audit trails
    - Multi-tenancy support via tenant_id and owner_id
    - Soft delete capability via deleted_at
    """

    __abstract__ = True

    # Timestamps for audit trail
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when record was created"
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Timestamp when record was last updated"
    )
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when record was soft-deleted (NULL if active)"
    )

    # Multi-tenancy support (RLS enforcement)
    tenant_id = Column(
        SA_UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="Tenant identifier for multi-tenancy isolation"
    )
    owner_id = Column(
        SA_UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="User who owns/created this record"
    )
