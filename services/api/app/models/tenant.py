"""Tenant model for multi-tenancy support.

This module defines the Tenant model which represents an organization
or workspace in the system. Supports Row-Level Security (RLS) for data isolation.
"""

from __future__ import annotations

from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import TYPE_CHECKING

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Tenant(Base):
    """Tenant model representing an organization or workspace."""

    __tablename__ = "tenants"

    # Tenant identification
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)

    # Tenant metadata
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(
        "User", back_populates="tenant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Tenant(id={self.id}, name={self.name}, slug={self.slug})>"

    @property
    def is_trial_expired(self) -> bool:
        """Check if trial period has expired."""
        if not self.is_trial or not self.trial_ends_at:
            return False
        return datetime.now(self.trial_ends_at.tzinfo) > self.trial_ends_at


# Alias for backward compatibility
TenantORM = Tenant
