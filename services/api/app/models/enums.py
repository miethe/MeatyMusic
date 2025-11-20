"""Enumerations for model fields.

This module defines all enums used across the application's models,
providing type-safe choices for fields like user roles, statuses, etc.
"""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    """User role enumeration for role-based access control (RBAC).

    Attributes:
        USER: Standard user with default permissions
        ADMIN: Administrator with elevated privileges
    """

    USER = "user"
    ADMIN = "admin"

    def __str__(self) -> str:
        """Return string value of the enum."""
        return self.value

    @classmethod
    def from_string(cls, value: str) -> "UserRole":
        """Create UserRole from string value.

        Args:
            value: String representation of role

        Returns:
            UserRole enum value

        Raises:
            ValueError: If value is not a valid role
        """
        try:
            return cls(value.lower())
        except ValueError:
            valid_roles = ", ".join([r.value for r in cls])
            raise ValueError(
                f"Invalid user role '{value}'. Valid roles are: {valid_roles}"
            )
