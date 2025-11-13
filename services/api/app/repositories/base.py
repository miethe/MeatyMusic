"""Base repository utilities with transaction policy and RLS support."""

from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Optional, Tuple, Any, List, Type, TypeVar, Dict, Protocol
from uuid import UUID
import base64
import json
import time
import warnings
from contextlib import contextmanager

from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from sqlalchemy.exc import SQLAlchemyError
from opentelemetry import trace


# Use absolute imports for local modules
from app.security.row_guard import RowGuard
# Import moved to avoid circular imports - imported locally in methods where needed
# from app.core.security import SecurityContext, UnifiedRowGuard, SecurityContextError, SecurityFilterError
# Import moved to avoid circular imports - imported in methods where needed
# from app.core.pagination import CursorPagination, create_page_info
from app.errors import AppError, ForbiddenError, NotFoundError, BadRequestError


# Define protocol for models that have an ID field
class HasId(Protocol):
    id: Any

# Generic type variable constrained to models with ID
T = TypeVar('T', bound=HasId)


from typing import Generic

@dataclass
class BaseRepository(Generic[T]):
    """Base class providing common repository helpers with enhanced security integration.

    Repositories are responsible for:
    - All database I/O operations
    - Enforcing row-level security via UnifiedRowGuard automatically
    - Transaction management (commit/rollback)
    - Cursor-based pagination with security filtering
    - Returning ORM objects (not DTOs)
    - Generic CRUD operations with automatic security context application
    - Performance monitoring (warns if operations exceed 3ms threshold)

    Enhanced Features (MP-REPO-ENH-002):
    - Generic CRUD methods: get_by_id, list_paginated, create, update, delete
    - Automatic security filtering on all operations
    - Security context validation for create operations
    - Clear error handling with security context violation messages
    - Transaction-scoped security context support

    Parameters
    ----------
    db:
        Active SQLAlchemy :class:`Session` bound to the current request.
    owner_id:
        Optional identifier used for scoping queries to a specific user (legacy).
    security_context:
        Enhanced security context supporting both user and tenant contexts.
        Required for all enhanced CRUD operations.
    """

    db: Session
    owner_id: Optional[UUID] = None  # Legacy field for backward compatibility
    security_context: Optional[Any] = None  # SecurityContext - imported locally to avoid circular imports


    def with_owner(self, owner_id: UUID) -> "BaseRepository":
        """Return a copy of this repository scoped to ``owner_id`` (legacy method).

        This method is maintained for backward compatibility. New code should
        use with_user_context() or with_tenant_context() instead.
        """
        # Create a security context from the owner_id for backward compatibility
        from app.core.security import SecurityContext
        security_context = SecurityContext(user_id=owner_id)
        return replace(self, owner_id=owner_id, security_context=security_context)


    def with_user_context(self, user_id: UUID) -> "BaseRepository":
        """Return a copy of this repository scoped to user context."""
        from app.core.security import SecurityContext
        security_context = SecurityContext(user_id=user_id)
        return replace(self, security_context=security_context)


    def with_tenant_context(self, tenant_id: UUID, user_id: Optional[UUID] = None) -> "BaseRepository":
        """Return a copy of this repository scoped to tenant context."""
        from app.core.security import SecurityContext
        security_context = SecurityContext(tenant_id=tenant_id, user_id=user_id)
        return replace(self, security_context=security_context)


    def with_dual_context(self, user_id: UUID, tenant_id: UUID) -> "BaseRepository":
        """Return a copy of this repository with both user and tenant context."""
        from app.core.security import SecurityContext
        security_context = SecurityContext(user_id=user_id, tenant_id=tenant_id)
        return replace(self, security_context=security_context)

    def with_security_context(self, security_context: Any) -> "BaseRepository":  # SecurityContext
        """Return a copy of this repository with the provided security context."""
        return replace(self, security_context=security_context)

    @property
    def row_guard(self) -> Optional[RowGuard]:
        """Get a legacy RowGuard instance if owner_id is set.

        This property is maintained for backward compatibility. New code should
        use get_unified_guard() instead.
        """
        return RowGuard(self.owner_id) if self.owner_id else None


    def get_unified_guard(self, model_class: Type[T]) -> Optional[Any]:  # UnifiedRowGuard
        """Get a UnifiedRowGuard instance for the current security context.

        Args:
            model_class: The SQLAlchemy model class being secured

        Returns:
            A UnifiedRowGuard instance if security context is available, None otherwise
        """
        if self.security_context is None:
            return None
        from app.core.security import UnifiedRowGuard
        return UnifiedRowGuard(model_class, self.security_context)

    def require_unified_guard(self, model_class: Type[T]) -> Any:  # UnifiedRowGuard
        """Get a UnifiedRowGuard instance, raising if security context is missing.

        Args:
            model_class: The SQLAlchemy model class being secured

        Returns:
            A UnifiedRowGuard instance

        Raises:
            ForbiddenError: If no security context is available
        """
        guard = self.get_unified_guard(model_class)
        if guard is None:
            raise ForbiddenError(
                code="SECURITY_CONTEXT_MISSING",
                message="Operation requires valid security context"
            )
        return guard

    def _handle_security_error(self, error: Exception, operation: str, model_class: Type[T]) -> AppError:
        """Convert security-related exceptions to appropriate AppError instances.

        Args:
            error: The original exception
            operation: The operation being performed (get, create, update, delete)
            model_class: The model class involved

        Returns:
            An appropriate AppError instance with clear messaging
        """
        from app.core.security import SecurityContextError, SecurityFilterError

        model_name = model_class.__name__

        if isinstance(error, SecurityContextError):
            return ForbiddenError(
                code="SECURITY_CONTEXT_INVALID",
                message=f"Invalid security context for {operation} operation on {model_name}",
                details={"context_type": error.context_type, "operation": operation}
            )
        elif isinstance(error, SecurityFilterError):
            return ForbiddenError(
                code="SECURITY_FILTER_FAILED",
                message=f"Security filter failed for {operation} operation on {model_name}",
                details={"table_pattern": error.table_pattern, "operation": operation}
            )
        else:
            return BadRequestError(
                code="REPOSITORY_SECURITY_ERROR",
                message=f"Security error during {operation} operation on {model_name}",
                details={"error": str(error), "operation": operation}
            )

    @contextmanager
    def _transaction_context(self) -> Any:
        """Context manager for transaction-scoped operations with security context preservation and telemetry.

        Ensures security context is maintained across transaction boundaries and
        provides proper cleanup on exceptions. Includes OpenTelemetry instrumentation
        for observability.
        """
        span = trace.get_current_span()
        start_time = time.time()

        try:
            # Security context is already set on the repository instance
            # No additional setup needed as UnifiedRowGuard uses it per operation
            span.set_attribute("db.operation", "transaction")
            yield
        except Exception as e:
            try:
                self.rollback()
                # Add telemetry for rollback events
                span.set_attribute("db.rollback", True)
                span.set_attribute("db.error", str(e)[:500])  # Truncate to 500 chars
                span.set_attribute("db.error_type", type(e).__name__)
            except Exception:
                # Ignore rollback errors to preserve original exception
                pass
            raise
        finally:
            elapsed = (time.time() - start_time) * 1000  # Convert to milliseconds
            span.set_attribute("db.duration_ms", elapsed)

            # Log performance if needed (could be integrated with observability)
            if elapsed > 3.0:  # Warn if over 3ms threshold
                import logging
                logger = logging.getLogger(__name__)
                trace_id = format(span.get_span_context().trace_id, '032x') if span.is_recording() else None
                span_id = format(span.get_span_context().span_id, '016x') if span.is_recording() else None
                logger.warning(
                    f"Repository operation exceeded performance threshold: {elapsed:.2f}ms",
                    extra={
                        "elapsed_ms": elapsed,
                        "threshold_ms": 3.0,
                        "trace_id": trace_id,
                        "span_id": span_id
                    }
                )

    def commit(self) -> None:
        """Commit the current transaction."""
        self.db.commit()

    def rollback(self) -> None:
        """Rollback the current transaction."""
        self.db.rollback()

    def flush(self) -> None:
        """Flush pending changes to database without committing."""
        self.db.flush()

    def refresh(self, instance: Any) -> None:
        """Refresh an instance from the database."""
        self.db.refresh(instance)

    # Generic CRUD Methods with Automatic Security Filtering

    def get_by_id(self, model_class: Type[T], id: UUID) -> T | None:
        """Get a single entity by ID with automatic security filtering.

        Args:
            model_class: The SQLAlchemy model class to query
            id: The entity ID to fetch

        Returns:
            The entity if found and accessible, None otherwise

        Raises:
            ForbiddenError: If security context is missing or invalid
        """
        try:
            with self._transaction_context():
                guard = self.require_unified_guard(model_class)
                query = self.db.query(model_class).filter(model_class.id == id)
                query = guard.filter_query(query)
                result: T | None = query.first()
                return result
        except (Exception, SQLAlchemyError) as e:
            from app.core.security import SecurityContextError, SecurityFilterError
            if isinstance(e, (SecurityContextError, SecurityFilterError)):
                raise self._handle_security_error(e, "get", model_class)
            elif isinstance(e, SQLAlchemyError):
                raise BadRequestError(
                    code="DATABASE_ERROR",
                    message=f"Database error retrieving {model_class.__name__}",
                    details={"error": str(e)}
                )
            else:
                raise

    def get_by_id_or_raise(self, model_class: Type[T], id: UUID) -> T:
        """Get a single entity by ID, raising NotFoundError if not found or inaccessible.

        Args:
            model_class: The SQLAlchemy model class to query
            id: The entity ID to fetch

        Returns:
            The entity if found and accessible

        Raises:
            NotFoundError: If entity is not found or not accessible
            ForbiddenError: If security context is missing or invalid
        """
        entity = self.get_by_id(model_class, id)
        if entity is None:
            raise NotFoundError(
                code="ENTITY_NOT_FOUND",
                message=f"{model_class.__name__} with ID {id} not found or not accessible",
                details={"entity_id": str(id), "model": model_class.__name__}
            )
        return entity

    def list_paginated(
        self,
        model_class: Type[T],
        limit: int = 20,
        cursor: Optional[str] = None,
        sort_field: str = "updated_at",
        sort_desc: bool = True,
        additional_filters: Optional[List[Any]] = None,
        include_total: bool = False
    ) -> Tuple[List[T], Optional[str]]:
        """List entities with cursor-based pagination and automatic security filtering.

        This method now uses the enhanced CursorPagination module for improved
        security boundary enforcement and performance monitoring.

        Args:
            model_class: The SQLAlchemy model class to query
            limit: Maximum number of items to return (default: 20)
            cursor: Optional cursor for pagination
            sort_field: Field to sort by (default: "updated_at")
            sort_desc: Whether to sort in descending order (default: True)
            additional_filters: Optional list of additional filter conditions
            include_total: Whether to include total count (expensive operation, default: False)

        Returns:
            Tuple of (items, next_cursor)

        Raises:
            ForbiddenError: If security context is missing or invalid
            BadRequestError: If query parameters are invalid
        """
        try:
            with self._transaction_context():
                # Build the base query
                query = self.db.query(model_class)

                # Apply additional filters if provided
                if additional_filters:
                    for filter_condition in additional_filters:
                        query = query.filter(filter_condition)

                # Use the new CursorPagination module with security context
                from app.core.pagination import CursorPagination
                pagination_result = CursorPagination.paginate(
                    query=query,
                    cursor=cursor,
                    limit=limit,
                    sort_field=sort_field,
                    sort_desc=sort_desc,
                    security_context=self.security_context,
                    model_class=model_class,
                    include_total=include_total
                )

                return pagination_result.items, pagination_result.next_cursor

        except (Exception, SQLAlchemyError) as e:
            from app.core.security import SecurityContextError, SecurityFilterError
            if isinstance(e, (SecurityContextError, SecurityFilterError)):
                raise self._handle_security_error(e, "list", model_class)
            elif isinstance(e, SQLAlchemyError):
                raise BadRequestError(
                    code="DATABASE_ERROR",
                    message=f"Database error listing {model_class.__name__}",
                    details={"error": str(e)}
                )
            else:
                raise

    def list_paginated_with_info(
        self,
        model_class: Type[T],
        limit: int = 20,
        cursor: Optional[str] = None,
        sort_field: str = "updated_at",
        sort_desc: bool = True,
        additional_filters: Optional[List[Any]] = None,
        include_total: bool = True
    ) -> dict[str, Any]:
        """List entities with full pagination info in the standard { items, pageInfo } format.

        This method returns the pagination result in the standard format expected by
        frontend applications, with comprehensive metadata about the result set.

        Args:
            model_class: The SQLAlchemy model class to query
            limit: Maximum number of items to return (default: 20)
            cursor: Optional cursor for pagination
            sort_field: Field to sort by (default: "updated_at")
            sort_desc: Whether to sort in descending order (default: True)
            additional_filters: Optional list of additional filter conditions
            include_total: Whether to include total count (default: True)

        Returns:
            Dictionary with 'items' and 'pageInfo' keys containing:
            - items: List of paginated entities
            - pageInfo: Object with hasNextPage, nextCursor, and totalCount

        Raises:
            ForbiddenError: If security context is missing or invalid
            BadRequestError: If query parameters are invalid

        Example:
            ```python
            result = repo.list_paginated_with_info(MyModel, limit=10, cursor="abc123")
            # Returns:
            # {
            #     "items": [...],
            #     "pageInfo": {
            #         "hasNextPage": True,
            #         "nextCursor": "def456",
            #         "totalCount": 150
            #     }
            # }
            ```
        """
        try:
            with self._transaction_context():
                # Build the base query
                query = self.db.query(model_class)

                # Apply additional filters if provided
                if additional_filters:
                    for filter_condition in additional_filters:
                        query = query.filter(filter_condition)

                # Use the new CursorPagination module with security context
                from app.core.pagination import CursorPagination
                pagination_result = CursorPagination.paginate(
                    query=query,
                    cursor=cursor,
                    limit=limit,
                    sort_field=sort_field,
                    sort_desc=sort_desc,
                    security_context=self.security_context,
                    model_class=model_class,
                    include_total=include_total
                )

                # Return in standard pagination format
                from app.core.pagination import create_page_info
                result: dict[str, Any] = create_page_info(pagination_result)
                return result

        except Exception as e:
            from app.core.security import SecurityContextError, SecurityFilterError
            if isinstance(e, (SecurityContextError, SecurityFilterError)):
                raise self._handle_security_error(e, "list", model_class)
            else:
                raise
        except SQLAlchemyError as e:
            raise BadRequestError(
                code="DATABASE_ERROR",
                message=f"Database error listing {model_class.__name__}",
                details={"error": str(e)}
            )

    def create(self, model_class: Type[T], data: Dict[str, Any]) -> T:
        """Create a new entity with automatic security context assignment.

        Args:
            model_class: The SQLAlchemy model class to create
            data: Dictionary of field values for the new entity

        Returns:
            The created entity

        Raises:
            ForbiddenError: If security context is missing or invalid
            BadRequestError: If data is invalid or creation fails
        """
        try:
            with self._transaction_context():
                guard = self.require_unified_guard(model_class)

                # Create new instance
                instance = model_class(**data)

                # Apply security context (assign ownership fields)
                instance = guard.assign_owner(instance)

                # Add to session and flush to get ID
                self.db.add(instance)
                self.db.flush()
                self.db.refresh(instance)

                return instance
        except Exception as e:
            from app.core.security import SecurityContextError, SecurityFilterError
            if isinstance(e, (SecurityContextError, SecurityFilterError)):
                raise self._handle_security_error(e, "create", model_class)
            else:
                raise
        except SQLAlchemyError as e:
            raise BadRequestError(
                code="DATABASE_ERROR",
                message=f"Database error creating {model_class.__name__}",
                details={"error": str(e)}
            )

    def update(self, model_class: Type[T], id: UUID, data: Dict[str, Any]) -> T:
        """Update an entity with automatic security filtering.

        Args:
            model_class: The SQLAlchemy model class to update
            id: The entity ID to update
            data: Dictionary of field values to update

        Returns:
            The updated entity

        Raises:
            NotFoundError: If entity is not found or not accessible
            ForbiddenError: If security context is missing or update not allowed
            BadRequestError: If update data is invalid
        """
        try:
            with self._transaction_context():
                # Get existing entity with security filtering
                entity = self.get_by_id_or_raise(model_class, id)

                # Apply updates
                for field, value in data.items():
                    if hasattr(entity, field):
                        setattr(entity, field, value)

                # Flush to validate constraints
                self.db.flush()
                self.db.refresh(entity)

                return entity
        except Exception as e:
            from app.core.security import SecurityContextError, SecurityFilterError
            if isinstance(e, (SecurityContextError, SecurityFilterError)):
                raise self._handle_security_error(e, "update", model_class)
            else:
                raise
        except (NotFoundError, ForbiddenError):
            # Re-raise as-is
            raise
        except SQLAlchemyError as e:
            raise BadRequestError(
                code="DATABASE_ERROR",
                message=f"Database error updating {model_class.__name__}",
                details={"error": str(e)}
            )

    def delete(self, model_class: Type[T], id: UUID) -> bool:
        """Delete an entity with automatic security filtering.

        Args:
            model_class: The SQLAlchemy model class to delete
            id: The entity ID to delete

        Returns:
            True if entity was deleted, False if not found

        Raises:
            ForbiddenError: If security context is missing or delete not allowed
            BadRequestError: If deletion fails due to constraints
        """
        try:
            with self._transaction_context():
                # Get existing entity with security filtering
                entity = self.get_by_id(model_class, id)
                if entity is None:
                    return False

                # Delete the entity
                self.db.delete(entity)
                self.db.flush()

                return True
        except Exception as e:
            from app.core.security import SecurityContextError, SecurityFilterError
            if isinstance(e, (SecurityContextError, SecurityFilterError)):
                raise self._handle_security_error(e, "delete", model_class)
            else:
                raise
        except SQLAlchemyError as e:
            raise BadRequestError(
                code="DATABASE_ERROR",
                message=f"Database error deleting {model_class.__name__}",
                details={"error": str(e)}
            )

    def encode_cursor(self, item: Any, sort_field: str = "updated_at") -> str:
        """Encode a cursor for pagination based on sort field.

        DEPRECATED: This method is maintained for backward compatibility.
        New code should use the encode_cursor function from app.core.pagination
        which provides enhanced error handling and type safety.
        """
        warnings.warn(
            "BaseRepository.encode_cursor is deprecated. Use app.core.pagination.encode_cursor instead.",
            DeprecationWarning,
            stacklevel=2
        )

        # Delegate to the new pagination module's implementation
        from app.core.pagination import encode_cursor as new_encode_cursor
        try:
            return new_encode_cursor(item, sort_field)
        except Exception:
            # Fall back to legacy implementation if new system fails
            pass

        # Legacy implementation (kept for backward compatibility)
        # Handle both ORM objects and SQLAlchemy Row objects
        value = None
        item_id = None

        # Check if this is a SQLAlchemy Row object (from multi-entity query)
        # Row objects are returned when querying multiple entities
        if hasattr(item, '_fields'):
            # This is a Row object - access entities by position or attribute name
            # For (PromptVersionORM, PromptHeaderORM) queries, header is at position 1
            try:
                # Try to access by entity class name first
                if hasattr(item, 'PromptHeaderORM'):
                    header = item.PromptHeaderORM
                    value = getattr(header, sort_field)
                    item_id = getattr(header, 'id', '')
                elif len(item) > 1:
                    # Access by position - PromptHeaderORM is second in the tuple
                    header = item[1]
                    value = getattr(header, sort_field)
                    item_id = getattr(header, 'id', '')
            except (AttributeError, IndexError):
                # Try the first element (PromptVersionORM)
                if len(item) > 0:
                    try:
                        version = item[0]
                        value = getattr(version, sort_field)
                        item_id = getattr(version, 'id', '')
                    except AttributeError:
                        pass
        else:
            # This is a regular ORM object
            try:
                value = getattr(item, sort_field)
                item_id = getattr(item, 'id', '')
            except AttributeError:
                pass

        if value is None:
            raise ValueError(f"Item does not have field: {sort_field}")

        # Handle different types of sort values
        if hasattr(value, 'isoformat'):  # datetime
            cursor_value = value.isoformat()
        else:
            cursor_value = str(value)

        cursor_data = {
            "field": sort_field,
            "value": cursor_value,
            "id": str(item_id)
        }
        return base64.b64encode(json.dumps(cursor_data).encode()).decode()

    def decode_cursor(self, cursor: str) -> dict[str, Any]:
        """Decode a pagination cursor.

        DEPRECATED: This method is maintained for backward compatibility.
        New code should use the decode_cursor function from app.core.pagination
        which provides enhanced validation and error handling.
        """
        warnings.warn(
            "BaseRepository.decode_cursor is deprecated. Use app.core.pagination.decode_cursor instead.",
            DeprecationWarning,
            stacklevel=2
        )

        # Delegate to the new pagination module's implementation
        from app.core.pagination import decode_cursor as new_decode_cursor
        try:
            result: dict[str, Any] = new_decode_cursor(cursor)
            return result
        except Exception:
            # Fall back to legacy implementation if new system fails
            pass

        # Legacy implementation (kept for backward compatibility)
        try:
            cursor_data: dict[str, Any] = json.loads(base64.b64decode(cursor.encode()).decode())
            return cursor_data
        except (json.JSONDecodeError, ValueError) as e:
            raise ValueError(f"Invalid cursor format: {e}")

    def apply_cursor_pagination(
        self,
        query: Any,
        model_class: Any,
        limit: int,
        cursor: Optional[str] = None,
        sort_field: str = "updated_at",
        sort_desc: bool = True
    ) -> Tuple[List[Any], Optional[str]]:
        """Apply cursor-based pagination to a query.

        DEPRECATED: This method is maintained for backward compatibility.
        New code should use list_paginated() which uses the enhanced
        CursorPagination module with improved security and performance.

        Parameters
        ----------
        query:
            SQLAlchemy query to paginate
        model_class:
            The ORM model class being queried
        limit:
            Maximum number of items to return
        cursor:
            Optional cursor for pagination
        sort_field:
            Field to sort by (default: updated_at)
        sort_desc:
            Whether to sort in descending order (default: True)

        Returns
        -------
        Tuple[List[Any], Optional[str]]:
            Tuple of (items, next_cursor)
        """
        # Issue deprecation warning
        warnings.warn(
            "apply_cursor_pagination is deprecated. Use list_paginated() instead, "
            "which provides enhanced security filtering and performance monitoring.",
            DeprecationWarning,
            stacklevel=2
        )

        # For backward compatibility, delegate to the new pagination system
        # if security context is available, otherwise fall back to legacy behavior
        if self.security_context:
            try:
                from app.core.pagination import CursorPagination
                pagination_result = CursorPagination.paginate(
                    query=query,
                    cursor=cursor,
                    limit=limit,
                    sort_field=sort_field,
                    sort_desc=sort_desc,
                    security_context=self.security_context,
                    model_class=model_class,
                    include_total=False
                )
                return pagination_result.items, pagination_result.next_cursor
            except Exception:
                # Fall back to legacy implementation if new system fails
                pass

        # Legacy implementation (kept for backward compatibility)
        # Apply cursor filtering if provided
        if cursor:
            cursor_data = self.decode_cursor(cursor)
            cursor_field = cursor_data.get("field", sort_field)
            cursor_value = cursor_data["value"]

            try:
                field_attr = getattr(model_class, cursor_field)
            except AttributeError:
                raise ValueError(f"Model {model_class.__name__} does not have field: {cursor_field}")

            # Apply cursor condition based on sort direction
            if sort_desc:
                query = query.filter(field_attr < cursor_value)
            else:
                query = query.filter(field_attr > cursor_value)

        # Apply sorting
        try:
            sort_attr = getattr(model_class, sort_field)
        except AttributeError:
            raise ValueError(f"Model {model_class.__name__} does not have field: {sort_field}")
        if sort_desc:
            query = query.order_by(desc(sort_attr), desc(model_class.id))
        else:
            query = query.order_by(asc(sort_attr), asc(model_class.id))

        # Fetch limit + 1 to determine if there are more items
        items = query.limit(limit + 1).all()

        # Determine next cursor
        next_cursor = None
        if len(items) > limit:
            # Remove the extra item
            items = items[:limit]
            # Get the last item for cursor creation
            # Items may be Row objects from multi-entity queries
            item_for_cursor = items[-1]
            next_cursor = self.encode_cursor(item_for_cursor, sort_field)

        return items, next_cursor
