"""UUID v7 support for SQLAlchemy models.

UUIDv7 provides time-ordered UUIDs that are more efficient for database
indexing than random UUIDs (v4) while maintaining uniqueness.
"""

from __future__ import annotations

from uuid import UUID
import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


def generate_uuid_v7() -> UUID:
    """Generate a UUID v7.

    Note: Python's uuid module doesn't natively support v7 yet,
    so this is a placeholder that generates v4 for now.
    In production, use a proper UUIDv7 implementation.

    Returns:
        UUID v7 (currently v4 as placeholder)
    """
    # TODO: Implement proper UUIDv7 generation
    # For now, use v4 as a placeholder
    return uuid.uuid4()


class UUIDv7Mixin:
    """Mixin to add UUIDv7 primary key to models."""

    id: Mapped[UUID] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid_v7,
        nullable=False,
    )
