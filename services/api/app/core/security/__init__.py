"""Security core package for unified row-level security.

This package provides the UnifiedRowGuard implementation and supporting
infrastructure for consistent security filtering across all table patterns
in MeatyMusic AMCS.
"""

from .exceptions import SecurityContextError, UnsupportedTableError, SecurityFilterError
from .security_context import (
    SecurityContext,
    create_user_context,
    create_tenant_context,
    create_dual_context,
)
from .table_patterns import TablePattern, TABLE_PATTERNS
from .unified_row_guard import UnifiedRowGuard
from .repository_factory import (
    RepositoryFactory,
    create_user_scoped_repository_factory,
    get_repository_for_user,
    get_repository_for_tenant,
    get_repository_for_dual_context,
)

__all__ = [
    "SecurityContextError",
    "UnsupportedTableError",
    "SecurityFilterError",
    "SecurityContext",
    "create_user_context",
    "create_tenant_context",
    "create_dual_context",
    "TablePattern",
    "TABLE_PATTERNS",
    "UnifiedRowGuard",
    "RepositoryFactory",
    "create_user_scoped_repository_factory",
    "get_repository_for_user",
    "get_repository_for_tenant",
    "get_repository_for_dual_context",
]
