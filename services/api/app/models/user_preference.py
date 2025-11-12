"""User preferences model for storing user-specific settings.

This module defines the UserPreference model which stores user preferences
and settings in a flexible JSONB structure.
"""

from __future__ import annotations

from sqlalchemy import ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserPreference(Base):
    """User preferences model for storing flexible user settings."""

    __tablename__ = "user_preferences"

    # User relationship (one-to-one)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Flexible preferences storage
    preferences: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
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

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<UserPreference(id={self.id}, user_id={self.user_id})>"

    def get_preference(self, key: str, default: Any = None) -> Any:
        """Get a preference value by key."""
        return self.preferences.get(key, default)

    def set_preference(self, key: str, value: Any) -> None:
        """Set a preference value by key."""
        if self.preferences is None:
            self.preferences = {}
        self.preferences[key] = value


# Alias for backward compatibility
UserPreferenceORM = UserPreference
