"""Security-aware repository factory for MeatyMusic AMCS.

This factory provides convenient methods for creating repository instances
with appropriate security contexts based on the enhanced BaseRepository
and UnifiedRowGuard system.

Implements MP-REPO-ENH-002 specifications for security-aware repository creation.
"""

from __future__ import annotations

from typing import Type, TypeVar, Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from .security_context import SecurityContext, create_user_context, create_tenant_context, create_dual_context
from .exceptions import SecurityContextError
from .table_patterns import determine_table_pattern, TablePattern


T = TypeVar('T')


class RepositoryFactory:
    """Factory for creating security-aware repository instances.

    This factory provides methods to create BaseRepository instances with
    appropriate security contexts based on user/tenant ownership patterns.

    Features:
    - Automatic table pattern detection
    - Security context validation
    - FastAPI dependency injection compatibility
    - Clear error handling for invalid contexts
    """

    def __init__(self, db: Session):
        """Initialize the factory with a database session.

        Args:
            db: Active SQLAlchemy session
        """
        self.db = db

    def create_user_scoped_repository(
        self,
        model_class: Type[T],
        user_id: UUID,
        permissions: Optional[set[str]] = None
    ) -> BaseRepository:
        """Create a repository scoped to user context.

        This method creates a repository instance configured for user-owned
        resources. It validates that the model class supports user ownership
        and creates an appropriate security context.

        Args:
            model_class: The SQLAlchemy model class
            user_id: UUID of the user to scope to
            permissions: Optional set of permissions for the context

        Returns:
            BaseRepository instance with user security context

        Raises:
            SecurityContextError: If user_id is invalid or model doesn't support user ownership
            ValueError: If model class has unknown table pattern

        Example:
            >>> factory = RepositoryFactory(db)
            >>> repo = factory.create_user_scoped_repository(SongORM, user_id)
            >>> songs = repo.list_paginated(SongORM, limit=10)
        """
        if not isinstance(user_id, UUID):
            raise SecurityContextError(
                f"user_id must be a UUID instance, got {type(user_id).__name__}",
                context_type="user"
            )

        # Validate table pattern supports user ownership
        try:
            pattern = determine_table_pattern(model_class)
        except ValueError as e:
            raise ValueError(f"Cannot determine table pattern for {model_class.__name__}: {e}")

        if pattern not in {TablePattern.USER_OWNED, TablePattern.SCOPE_BASED}:
            raise SecurityContextError(
                f"Model {model_class.__name__} (pattern: {pattern.value}) does not support user-scoped access",
                context_type="user"
            )

        # Create user security context
        security_context = create_user_context(user_id, permissions)

        # Return repository with security context
        return BaseRepository(
            db=self.db,
            security_context=security_context
        )

    def create_tenant_scoped_repository(
        self,
        model_class: Type[T],
        tenant_id: UUID,
        user_id: Optional[UUID] = None,
        permissions: Optional[set[str]] = None
    ) -> BaseRepository:
        """Create a repository scoped to tenant context.

        This method creates a repository instance configured for tenant-owned
        resources. It validates that the model class supports tenant ownership
        and creates an appropriate security context.

        Args:
            model_class: The SQLAlchemy model class
            tenant_id: UUID of the tenant to scope to
            user_id: Optional user ID for dual-context scenarios
            permissions: Optional set of permissions for the context

        Returns:
            BaseRepository instance with tenant security context

        Raises:
            SecurityContextError: If tenant_id is invalid or model doesn't support tenant ownership
            ValueError: If model class has unknown table pattern

        Example:
            >>> factory = RepositoryFactory(db)
            >>> repo = factory.create_tenant_scoped_repository(ModelORM, tenant_id)
            >>> models = repo.list_paginated(ModelORM, limit=10)
        """
        if not isinstance(tenant_id, UUID):
            raise SecurityContextError(
                f"tenant_id must be a UUID instance, got {type(tenant_id).__name__}",
                context_type="tenant"
            )

        if user_id is not None and not isinstance(user_id, UUID):
            raise SecurityContextError(
                f"user_id must be a UUID instance, got {type(user_id).__name__}",
                context_type="user"
            )

        # Validate table pattern supports tenant ownership
        try:
            pattern = determine_table_pattern(model_class)
        except ValueError as e:
            raise ValueError(f"Cannot determine table pattern for {model_class.__name__}: {e}")

        if pattern not in {TablePattern.TENANT_OWNED, TablePattern.SCOPE_BASED}:
            raise SecurityContextError(
                f"Model {model_class.__name__} (pattern: {pattern.value}) does not support tenant-scoped access",
                context_type="tenant"
            )

        # Create tenant security context
        security_context = create_tenant_context(tenant_id, user_id, permissions)

        # Return repository with security context
        return BaseRepository(
            db=self.db,
            security_context=security_context
        )

    def create_dual_context_repository(
        self,
        model_class: Type[T],
        user_id: UUID,
        tenant_id: UUID,
        permissions: Optional[set[str]] = None
    ) -> BaseRepository:
        """Create a repository with both user and tenant context.

        This method creates a repository instance configured for resources
        that may be owned by either users or tenants. It validates both
        contexts and creates a dual security context.

        Args:
            model_class: The SQLAlchemy model class
            user_id: UUID of the user
            tenant_id: UUID of the tenant
            permissions: Optional set of permissions for the context

        Returns:
            BaseRepository instance with dual security context

        Raises:
            SecurityContextError: If user_id or tenant_id is invalid
            ValueError: If model class has unknown table pattern

        Example:
            >>> factory = RepositoryFactory(db)
            >>> repo = factory.create_dual_context_repository(WorkspaceORM, user_id, tenant_id)
            >>> workspaces = repo.list_paginated(WorkspaceORM, limit=10)
        """
        if not isinstance(user_id, UUID):
            raise SecurityContextError(
                f"user_id must be a UUID instance, got {type(user_id).__name__}",
                context_type="user"
            )

        if not isinstance(tenant_id, UUID):
            raise SecurityContextError(
                f"tenant_id must be a UUID instance, got {type(tenant_id).__name__}",
                context_type="tenant"
            )

        # Validate table pattern (dual context supports any pattern)
        try:
            pattern = determine_table_pattern(model_class)
        except ValueError as e:
            raise ValueError(f"Cannot determine table pattern for {model_class.__name__}: {e}")

        # Dual context is valid for any pattern except SYSTEM_MANAGED
        if pattern == TablePattern.SYSTEM_MANAGED:
            raise SecurityContextError(
                f"Model {model_class.__name__} (pattern: {pattern.value}) is system-managed and doesn't support user/tenant contexts",
                context_type="system"
            )

        # Create dual security context
        security_context = create_dual_context(user_id, tenant_id, permissions)

        # Return repository with security context
        return BaseRepository(
            db=self.db,
            security_context=security_context
        )

    def create_repository_with_context(
        self,
        security_context: SecurityContext
    ) -> BaseRepository:
        """Create a repository with a pre-existing security context.

        This method provides a way to create repositories with custom
        security contexts, useful for advanced scenarios or when contexts
        are created elsewhere in the application.

        Args:
            security_context: Pre-configured SecurityContext instance

        Returns:
            BaseRepository instance with the provided security context

        Raises:
            SecurityContextError: If security context is invalid

        Example:
            >>> context = SecurityContext(user_id=user_id, permissions={"read", "write"})
            >>> repo = factory.create_repository_with_context(context)
        """
        if not isinstance(security_context, SecurityContext):
            raise SecurityContextError(
                f"security_context must be a SecurityContext instance, got {type(security_context).__name__}",
                context_type="context"
            )

        # Validate the security context
        if security_context.is_empty():
            raise SecurityContextError(
                "Security context cannot be empty (must have user_id or tenant_id)",
                context_type="context"
            )

        # Return repository with security context
        return BaseRepository(
            db=self.db,
            security_context=security_context
        )


# Convenience functions for FastAPI dependency injection

def create_user_scoped_repository_factory(db: Session) -> RepositoryFactory:
    """Factory function for FastAPI dependency injection.

    Args:
        db: Database session from FastAPI dependency

    Returns:
        RepositoryFactory instance

    Example:
        >>> from fastapi import Depends
        >>> from app.core.database import get_db
        >>>
        >>> def get_repo_factory(db: Session = Depends(get_db)) -> RepositoryFactory:
        ...     return create_user_scoped_repository_factory(db)
        >>>
        >>> @router.get("/songs")
        >>> async def list_songs(
        ...     factory: RepositoryFactory = Depends(get_repo_factory),
        ...     current_user: User = Depends(get_current_user)
        ... ):
        ...     repo = factory.create_user_scoped_repository(SongORM, current_user.id)
        ...     return repo.list_paginated(SongORM)
    """
    return RepositoryFactory(db)


def get_repository_for_user(
    model_class: Type[T],
    user_id: UUID,
    db: Session,
    permissions: Optional[set[str]] = None
) -> BaseRepository:
    """Quick helper to create a user-scoped repository.

    Args:
        model_class: The SQLAlchemy model class
        user_id: UUID of the user
        db: Database session
        permissions: Optional permissions set

    Returns:
        BaseRepository with user security context
    """
    factory = RepositoryFactory(db)
    return factory.create_user_scoped_repository(model_class, user_id, permissions)


def get_repository_for_tenant(
    model_class: Type[T],
    tenant_id: UUID,
    db: Session,
    user_id: Optional[UUID] = None,
    permissions: Optional[set[str]] = None
) -> BaseRepository:
    """Quick helper to create a tenant-scoped repository.

    Args:
        model_class: The SQLAlchemy model class
        tenant_id: UUID of the tenant
        db: Database session
        user_id: Optional user ID for dual context
        permissions: Optional permissions set

    Returns:
        BaseRepository with tenant security context
    """
    factory = RepositoryFactory(db)
    return factory.create_tenant_scoped_repository(model_class, tenant_id, user_id, permissions)


def get_repository_for_dual_context(
    model_class: Type[T],
    user_id: UUID,
    tenant_id: UUID,
    db: Session,
    permissions: Optional[set[str]] = None
) -> BaseRepository:
    """Quick helper to create a dual-context repository.

    Args:
        model_class: The SQLAlchemy model class
        user_id: UUID of the user
        tenant_id: UUID of the tenant
        db: Database session
        permissions: Optional permissions set

    Returns:
        BaseRepository with dual security context
    """
    factory = RepositoryFactory(db)
    return factory.create_dual_context_repository(model_class, user_id, tenant_id, permissions)
