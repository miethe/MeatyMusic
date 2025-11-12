"""Enhanced security context for dual ownership patterns.

This module provides the SecurityContext dataclass and related utilities
for managing both user and tenant security contexts in MeatyMusic AMCS's
hybrid security model.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Set, Any
from uuid import UUID

from .exceptions import SecurityContextError


@dataclass
class SecurityContext:
    """Enhanced security context supporting dual ownership patterns.

    This context supports both user-owned and tenant-owned resources,
    allowing the UnifiedRowGuard to apply appropriate security filtering
    based on resource type.

    Attributes:
        user_id: UUID of the current user (for user-owned resources)
        tenant_id: UUID of the current tenant (for tenant-owned resources)
        scope: Optional scope string for complex scope-based filtering
        permissions: Set of permission strings for the current context
        metadata: Additional context metadata
    """

    user_id: Optional[UUID] = None
    tenant_id: Optional[UUID] = None
    scope: Optional[str] = None
    permissions: Set[str] = field(default_factory=set)
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Validate security context after initialization."""
        # Validate user_id is a proper UUID
        if self.user_id is not None and not isinstance(self.user_id, UUID):
            raise SecurityContextError(
                f"user_id must be a UUID instance, got {type(self.user_id).__name__}",
                context_type="user"
            )

        # Validate tenant_id is a proper UUID
        if self.tenant_id is not None and not isinstance(self.tenant_id, UUID):
            raise SecurityContextError(
                f"tenant_id must be a UUID instance, got {type(self.tenant_id).__name__}",
                context_type="tenant"
            )

        # Validate permissions are strings
        if self.permissions and not all(isinstance(p, str) for p in self.permissions):
            raise SecurityContextError(
                "All permissions must be strings",
                context_type="permission"
            )

    def has_user_context(self) -> bool:
        """Check if user context is available."""
        return self.user_id is not None

    def has_tenant_context(self) -> bool:
        """Check if tenant context is available."""
        return self.tenant_id is not None

    def requires_user_context(self) -> None:
        """Ensure user context is available, raise if not.

        Raises:
            SecurityContextError: If user context is not available
        """
        if not self.has_user_context():
            raise SecurityContextError(
                "User context required for this operation",
                context_type="user"
            )

    def requires_tenant_context(self) -> None:
        """Ensure tenant context is available, raise if not.

        Raises:
            SecurityContextError: If tenant context is not available
        """
        if not self.has_tenant_context():
            raise SecurityContextError(
                "Tenant context required for this operation",
                context_type="tenant"
            )

    def has_permission(self, permission: str) -> bool:
        """Check if the context has a specific permission.

        Args:
            permission: The permission string to check

        Returns:
            True if the permission is granted
        """
        return permission in self.permissions

    def requires_permission(self, permission: str) -> None:
        """Ensure a specific permission is available.

        Args:
            permission: The permission string required

        Raises:
            SecurityContextError: If the permission is not available
        """
        if not self.has_permission(permission):
            raise SecurityContextError(
                f"Permission '{permission}' required for this operation",
                context_type="permission"
            )

    def with_user(self, user_id: UUID) -> 'SecurityContext':
        """Return a copy with the specified user context.

        Args:
            user_id: The user ID to set

        Returns:
            A new SecurityContext with the user ID set
        """
        return SecurityContext(
            user_id=user_id,
            tenant_id=self.tenant_id,
            scope=self.scope,
            permissions=self.permissions.copy(),
            metadata=self.metadata.copy()
        )

    def with_tenant(self, tenant_id: UUID) -> 'SecurityContext':
        """Return a copy with the specified tenant context.

        Args:
            tenant_id: The tenant ID to set

        Returns:
            A new SecurityContext with the tenant ID set
        """
        return SecurityContext(
            user_id=self.user_id,
            tenant_id=tenant_id,
            scope=self.scope,
            permissions=self.permissions.copy(),
            metadata=self.metadata.copy()
        )

    def with_scope(self, scope: str) -> 'SecurityContext':
        """Return a copy with the specified scope.

        Args:
            scope: The scope string to set

        Returns:
            A new SecurityContext with the scope set
        """
        return SecurityContext(
            user_id=self.user_id,
            tenant_id=self.tenant_id,
            scope=scope,
            permissions=self.permissions.copy(),
            metadata=self.metadata.copy()
        )

    def is_empty(self) -> bool:
        """Check if the security context is empty (no user or tenant)."""
        return not self.has_user_context() and not self.has_tenant_context()

    def __repr__(self) -> str:
        """String representation of the security context."""
        parts = []
        if self.user_id:
            parts.append(f"user_id={self.user_id}")
        if self.tenant_id:
            parts.append(f"tenant_id={self.tenant_id}")
        if self.scope:
            parts.append(f"scope={self.scope}")
        if self.permissions:
            parts.append(f"permissions={len(self.permissions)}")

        return f"SecurityContext({', '.join(parts)})"


def create_user_context(user_id: UUID, permissions: Optional[Set[str]] = None) -> SecurityContext:
    """Create a SecurityContext for user-owned resources.

    Args:
        user_id: The user ID
        permissions: Optional set of permissions

    Returns:
        A SecurityContext configured for user access
    """
    return SecurityContext(
        user_id=user_id,
        permissions=permissions or set()
    )


def create_tenant_context(
    tenant_id: UUID,
    user_id: Optional[UUID] = None,
    permissions: Optional[Set[str]] = None
) -> SecurityContext:
    """Create a SecurityContext for tenant-owned resources.

    Args:
        tenant_id: The tenant ID
        user_id: Optional user ID (for dual context)
        permissions: Optional set of permissions

    Returns:
        A SecurityContext configured for tenant access
    """
    return SecurityContext(
        user_id=user_id,
        tenant_id=tenant_id,
        permissions=permissions or set()
    )


def create_dual_context(
    user_id: UUID,
    tenant_id: UUID,
    permissions: Optional[Set[str]] = None
) -> SecurityContext:
    """Create a SecurityContext supporting both user and tenant resources.

    Args:
        user_id: The user ID
        tenant_id: The tenant ID
        permissions: Optional set of permissions

    Returns:
        A SecurityContext configured for both user and tenant access
    """
    return SecurityContext(
        user_id=user_id,
        tenant_id=tenant_id,
        permissions=permissions or set()
    )
