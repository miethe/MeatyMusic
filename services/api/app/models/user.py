"""User model for authentication and authorization.

This module defines the User model which represents authenticated users
in the system. It's primarily used for storing user data from the
authentication provider (e.g., Clerk).
"""

from __future__ import annotations

from sqlalchemy import String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from app.models.base import Base
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.tenant import Tenant
    from app.models.user_preference import UserPreference


class User(Base):
    """User model representing an authenticated user."""

    __tablename__ = "users"

    # Tenant relationship (multi-tenancy)
    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Primary identifier from auth provider (e.g., Clerk user ID)
    clerk_user_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)

    # User profile information
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    username: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)

    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Role-based access control
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20),
        default=UserRole.USER,
        nullable=False,
        index=True,
    )

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
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")
    preferences: Mapped["UserPreference"] = relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"

    @property
    def full_name(self) -> str:
        """Return user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email

    @property
    def display_name(self) -> str:
        """Return user's display name (username or full name or email)."""
        return self.username or self.full_name

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role.

        Returns:
            True if user role is ADMIN, False otherwise
        """
        return self.role == UserRole.ADMIN


# Alias for backward compatibility
UserORM = User
