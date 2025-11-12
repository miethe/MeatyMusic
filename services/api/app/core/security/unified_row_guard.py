"""Unified security guard supporting all MeatyMusic AMCS table patterns.

The UnifiedRowGuard provides a single interface for applying row-level security
across user-owned, tenant-owned, and scope-based resources. It intelligently
determines the appropriate filtering strategy based on table schema and applies
the correct security filters without duplicating logic.
"""

from __future__ import annotations

import structlog
from typing import Generic, TypeVar, Optional, Type, Any
from uuid import UUID

from opentelemetry import trace
from sqlalchemy.orm import Query
from sqlalchemy import and_, or_
from sqlalchemy.sql import text

from .security_context import SecurityContext
from .table_patterns import (
    TablePattern,
    determine_table_pattern,
    get_ownership_column_name,
    get_user_owned_column_name
)
from .exceptions import SecurityContextError, UnsupportedTableError, SecurityFilterError

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)

T = TypeVar('T')


class UnifiedRowGuard(Generic[T]):
    """Unified security guard supporting all MeatyMusic AMCS table patterns.

    This guard intelligently determines the appropriate security filtering strategy
    based on table schema and resource type, supporting:

    - User-owned tables: songs, personas, sources (filtered by user_id/owner_id)
    - Tenant-owned tables: model_* (filtered by tenant_id)
    - Scope-based tables: workspaces, analytics (complex scope-based filtering)
    - System-managed tables: users, lookup_values (no filtering applied)

    The guard provides a fluent interface for chaining security contexts and
    integrates seamlessly with SQLAlchemy queries without breaking existing patterns.

    Example:
        # User-owned resource filtering
        guard = UnifiedRowGuard(SongORM, security_context)
        filtered_query = guard.with_user_context().filter_query(query)

        # Tenant-owned resource filtering
        guard = UnifiedRowGuard(ModelORM, security_context)
        filtered_query = guard.with_tenant_context().filter_query(query)

        # Automatic pattern detection
        guard = UnifiedRowGuard(model_class, security_context)
        filtered_query = guard.filter_query(query)  # Applies appropriate filter
    """

    def __init__(self, model_class: Type[T], security_context: SecurityContext):
        """Initialize the guard with model and security context.

        Args:
            model_class: The SQLAlchemy model class being secured
            security_context: The current security context with user/tenant info
        """
        self.model_class = model_class
        self.security_context = security_context
        self.table_pattern = determine_table_pattern(model_class)
        # Remove problematic isEnabledFor check - structlog handles filtering internally
        self._debug_enabled = True

        # Cache table name for performance
        self.table_name = getattr(model_class, '__tablename__', 'unknown')

        if self._debug_enabled:
            logger.debug(
                "unified_guard.initialized",
                table_name=self.table_name,
                table_pattern=self.table_pattern.value,
                has_user_context=security_context.has_user_context(),
                has_tenant_context=security_context.has_tenant_context()
            )

    def filter_query(self, query: Query[T]) -> Query[T]:
        """Apply appropriate security filters based on table pattern.

        This method automatically determines the correct filtering strategy
        based on the model's table pattern and applies the appropriate
        security constraints to the query.

        Args:
            query: The SQLAlchemy query to filter

        Returns:
            The filtered query with security constraints applied

        Raises:
            SecurityContextError: If required security context is missing
            SecurityFilterError: If filter application fails
        """
        with tracer.start_as_current_span("unified_guard.filter_query") as span:
            span.set_attribute("table_name", self.table_name)
            span.set_attribute("table_pattern", self.table_pattern.value)

            try:
                match self.table_pattern:
                    case TablePattern.USER_OWNED:
                        filtered_query = self._filter_user_owned(query)
                    case TablePattern.TENANT_OWNED:
                        filtered_query = self._filter_tenant_owned(query)
                    case TablePattern.SCOPE_BASED:
                        filtered_query = self._filter_scope_based(query)
                    case TablePattern.SYSTEM_MANAGED:
                        filtered_query = query  # No filtering for system tables
                    case _:
                        raise UnsupportedTableError(
                            self.table_name,
                            f"Unsupported table pattern: {self.table_pattern}"
                        )

                if self._debug_enabled:
                    logger.debug(
                        "unified_guard.filter_applied",
                        table_name=self.table_name,
                        table_pattern=self.table_pattern.value,
                        filter_applied=self.table_pattern != TablePattern.SYSTEM_MANAGED
                    )

                span.set_attribute("filter_applied", True)
                return filtered_query

            except Exception as e:
                span.set_attribute("filter_error", str(e))
                logger.error(
                    "unified_guard.filter_error",
                    table_name=self.table_name,
                    table_pattern=self.table_pattern.value,
                    error=str(e),
                    error_type=type(e).__name__
                )
                raise SecurityFilterError(
                    f"Failed to apply security filter to {self.table_name}: {e}",
                    table_pattern=self.table_pattern.value
                ) from e

    def _filter_user_owned(self, query: Query[T]) -> Query[T]:
        """Apply user-owned resource filtering."""
        if not self.security_context.has_user_context():
            raise SecurityContextError(
                f"User context required for user-owned table '{self.table_name}'",
                context_type="user"
            )

        # Determine the correct ownership column (user_id vs owner_id)
        try:
            owner_column_name = get_user_owned_column_name(self.model_class)
            owner_column = getattr(self.model_class, owner_column_name)
        except ValueError as e:
            raise SecurityFilterError(
                f"Cannot determine ownership column for {self.table_name}: {e}"
            ) from e

        return query.filter(owner_column == self.security_context.user_id)

    def _filter_tenant_owned(self, query: Query[T]) -> Query[T]:
        """Apply tenant-owned resource filtering."""
        if not self.security_context.has_tenant_context():
            raise SecurityContextError(
                f"Tenant context required for tenant-owned table '{self.table_name}'",
                context_type="tenant"
            )

        # All tenant-owned tables use tenant_id column
        if not hasattr(self.model_class, 'tenant_id'):
            raise SecurityFilterError(
                f"Table {self.table_name} marked as tenant-owned but has no tenant_id column"
            )

        return query.filter(self.model_class.tenant_id == self.security_context.tenant_id)

    def _filter_scope_based(self, query: Query[T]) -> Query[T]:
        """Apply scope-based filtering for complex resources."""
        # Try user context first
        if self.security_context.has_user_context():
            if hasattr(self.model_class, 'user_id'):
                return query.filter(self.model_class.user_id == self.security_context.user_id)
            elif hasattr(self.model_class, 'owner_id'):
                return query.filter(self.model_class.owner_id == self.security_context.user_id)

        # Try tenant context second
        if self.security_context.has_tenant_context():
            if hasattr(self.model_class, 'tenant_id'):
                return query.filter(self.model_class.tenant_id == self.security_context.tenant_id)

        # SECURITY: No fallback to unrestricted access
        # Scope-based resources without clear ownership patterns must be explicitly handled
        logger.error(
            "unified_guard.scope_based_filtering_not_implemented",
            table_name=self.table_name,
            table_pattern=self.table_pattern.value
        )
        raise SecurityFilterError(
            "Access denied.",
        )

    def with_user_context(self) -> 'UnifiedRowGuard[T]':
        """Ensure user context is available for filtering.

        This method validates that user context is present and returns self
        for method chaining. Use this when you know the operation requires
        user-level access.

        Returns:
            Self for method chaining

        Raises:
            SecurityContextError: If user context is not available
        """
        self.security_context.requires_user_context()

        if self._debug_enabled:
            logger.debug(
                "unified_guard.user_context_validated",
                table_name=self.table_name,
                user_id=str(self.security_context.user_id)
            )

        return self

    def with_tenant_context(self) -> 'UnifiedRowGuard[T]':
        """Ensure tenant context is available for filtering.

        This method validates that tenant context is present and returns self
        for method chaining. Use this when you know the operation requires
        tenant-level access.

        Returns:
            Self for method chaining

        Raises:
            SecurityContextError: If tenant context is not available
        """
        self.security_context.requires_tenant_context()

        if self._debug_enabled:
            logger.debug(
                "unified_guard.tenant_context_validated",
                table_name=self.table_name,
                tenant_id=str(self.security_context.tenant_id)
            )

        return self

    def with_permission(self, permission: str) -> 'UnifiedRowGuard[T]':
        """Ensure a specific permission is available.

        Args:
            permission: The permission string required

        Returns:
            Self for method chaining

        Raises:
            SecurityContextError: If the permission is not available
        """
        self.security_context.requires_permission(permission)

        if self._debug_enabled:
            logger.debug(
                "unified_guard.permission_validated",
                table_name=self.table_name,
                permission=permission
            )

        return self

    def assign_owner(self, instance: T) -> T:
        """Set appropriate ownership on a new ORM instance.

        This method automatically determines the correct ownership field
        and sets it based on the table pattern and security context.

        Args:
            instance: The ORM object being created

        Returns:
            The same instance for chaining

        Raises:
            SecurityContextError: If required context is missing
            SecurityFilterError: If ownership assignment fails
        """
        with tracer.start_as_current_span("unified_guard.assign_owner") as span:
            span.set_attribute("table_name", self.table_name)
            span.set_attribute("table_pattern", self.table_pattern.value)

            try:
                match self.table_pattern:
                    case TablePattern.USER_OWNED:
                        self._assign_user_ownership(instance)
                    case TablePattern.TENANT_OWNED:
                        self._assign_tenant_ownership(instance)
                    case TablePattern.SCOPE_BASED:
                        self._assign_scope_ownership(instance)
                    case TablePattern.SYSTEM_MANAGED:
                        pass  # No ownership assignment for system tables

                if self._debug_enabled:
                    logger.debug(
                        "unified_guard.owner_assigned",
                        table_name=self.table_name,
                        table_pattern=self.table_pattern.value
                    )

                return instance

            except Exception as e:
                span.set_attribute("assign_error", str(e))
                logger.error(
                    "unified_guard.assign_error",
                    table_name=self.table_name,
                    error=str(e),
                    error_type=type(e).__name__
                )
                raise SecurityFilterError(
                    f"Failed to assign ownership on {self.table_name}: {e}"
                ) from e

    def _assign_user_ownership(self, instance: T) -> None:
        """Assign user ownership to an instance."""
        if not self.security_context.has_user_context():
            raise SecurityContextError(
                f"User context required to create {self.table_name}",
                context_type="user"
            )

        owner_column_name = get_user_owned_column_name(self.model_class)
        setattr(instance, owner_column_name, self.security_context.user_id)

    def _assign_tenant_ownership(self, instance: T) -> None:
        """Assign tenant ownership to an instance."""
        if not self.security_context.has_tenant_context():
            raise SecurityContextError(
                f"Tenant context required to create {self.table_name}",
                context_type="tenant"
            )

        if not hasattr(instance, 'tenant_id'):
            raise SecurityFilterError(
                f"Instance of {self.table_name} has no tenant_id attribute"
            )

        setattr(instance, 'tenant_id', self.security_context.tenant_id)

    def _assign_scope_ownership(self, instance: T) -> None:
        """Assign scope-based ownership to an instance."""
        # For scope-based resources, try user ownership first, then tenant
        if self.security_context.has_user_context():
            if hasattr(instance, 'user_id'):
                setattr(instance, 'user_id', self.security_context.user_id)
                return
            elif hasattr(instance, 'owner_id'):
                setattr(instance, 'owner_id', self.security_context.user_id)
                return

        if self.security_context.has_tenant_context():
            if hasattr(instance, 'tenant_id'):
                setattr(instance, 'tenant_id', self.security_context.tenant_id)
                return

        # SECURITY: Don't allow scope-based resources without clear ownership
        logger.error(
            "Failed to assign ownership to scope-based resource.",
            table_name=self.table_name,
            security_context=self.security_context,
        )
        raise SecurityFilterError(
            "Unable to assign ownership to resource."
        )

    def require_owner(self, instance: Optional[T]) -> T:
        """Ensure the ORM instance is owned by the current user/tenant.

        This method validates that the instance belongs to the current security
        context based on the table pattern. It's used for authorization checks
        on retrieved objects.

        Args:
            instance: The ORM instance to validate (can be None)

        Returns:
            The validated instance

        Raises:
            SecurityContextError: If the instance is None or not owned by current context
        """
        if instance is None:
            raise SecurityContextError("Resource not found or access denied")

        with tracer.start_as_current_span("unified_guard.require_owner") as span:
            span.set_attribute("table_name", self.table_name)
            span.set_attribute("table_pattern", self.table_pattern.value)

            try:
                match self.table_pattern:
                    case TablePattern.USER_OWNED:
                        self._require_user_ownership(instance)
                    case TablePattern.TENANT_OWNED:
                        self._require_tenant_ownership(instance)
                    case TablePattern.SCOPE_BASED:
                        self._require_scope_ownership(instance)
                    case TablePattern.SYSTEM_MANAGED:
                        pass  # No ownership check for system tables

                span.set_attribute("ownership_verified", True)
                return instance

            except SecurityContextError:
                span.set_attribute("ownership_verified", False)
                raise

    def _require_user_ownership(self, instance: T) -> None:
        """Require user ownership of an instance."""
        if not self.security_context.has_user_context():
            raise SecurityContextError("User context required for access")

        owner_column_name = get_user_owned_column_name(self.model_class)
        owner_id = getattr(instance, owner_column_name, None)

        if owner_id != self.security_context.user_id:
            raise SecurityContextError("Access denied: resource not owned by current user")

    def _require_tenant_ownership(self, instance: T) -> None:
        """Require tenant ownership of an instance."""
        if not self.security_context.has_tenant_context():
            raise SecurityContextError("Tenant context required for access")

        tenant_id = getattr(instance, 'tenant_id', None)

        if tenant_id != self.security_context.tenant_id:
            raise SecurityContextError("Access denied: resource not owned by current tenant")

    def _require_scope_ownership(self, instance: T) -> None:
        """Require scope-based ownership of an instance."""
        # For scope-based resources, check user ownership first, then tenant
        if self.security_context.has_user_context():
            if hasattr(instance, 'user_id'):
                user_id = getattr(instance, 'user_id', None)
                if user_id == self.security_context.user_id:
                    return
            elif hasattr(instance, 'owner_id'):
                owner_id = getattr(instance, 'owner_id', None)
                if owner_id == self.security_context.user_id:
                    return

        if self.security_context.has_tenant_context():
            if hasattr(instance, 'tenant_id'):
                tenant_id = getattr(instance, 'tenant_id', None)
                if tenant_id == self.security_context.tenant_id:
                    return

        # SECURITY: Don't allow access to scope-based resources without clear ownership
        # If no ownership can be determined, deny access
        logger.warning(
            "Access denied: Cannot determine ownership of scope-based resource",
            table_name=self.table_name,
            security_context=self.security_context,
        )
        raise SecurityContextError("Access denied")
