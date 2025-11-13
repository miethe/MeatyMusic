"""Table pattern classification for unified security filtering.

This module defines the ownership patterns for all tables in MeatyMusic AMCS
and provides utilities for determining the appropriate security filtering
strategy for each table type.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, Type, Any


class TablePattern(Enum):
    """Types of table ownership patterns in MeatyMusic AMCS."""

    USER_OWNED = "user_owned"      # songs, personas, sources (user resources)
    TENANT_OWNED = "tenant_owned"  # model_*, workspace_* (tenant resources)
    SCOPE_BASED = "scope_based"    # complex scope hierarchies
    SYSTEM_MANAGED = "system"      # system-only resources


# Table pattern mapping for all known tables
# Will be populated with AMCS domain tables in Phase 3
TABLE_PATTERNS: Dict[str, TablePattern] = {
    # User-owned resources (filtered by user_id/owner_id)
    # TODO Phase 3: Add AMCS tables: songs, personas, sources, etc.
    'user_preferences': TablePattern.USER_OWNED,

    # Tenant-owned model resources (filtered by tenant_id)
    'model_providers': TablePattern.TENANT_OWNED,
    'model_families': TablePattern.TENANT_OWNED,
    'models': TablePattern.TENANT_OWNED,
    # Enhanced model catalog tables
    'enhanced_models': TablePattern.TENANT_OWNED,
    'model_versions': TablePattern.TENANT_OWNED,
    'model_capabilities': TablePattern.TENANT_OWNED,
    'model_aliases': TablePattern.TENANT_OWNED,
    'model_pricing': TablePattern.TENANT_OWNED,
    'model_endpoints': TablePattern.TENANT_OWNED,
    'model_rate_limits': TablePattern.TENANT_OWNED,
    'model_metadata': TablePattern.TENANT_OWNED,
    'model_relationships': TablePattern.TENANT_OWNED,
    'model_catalog': TablePattern.TENANT_OWNED,

    # Scope-based resources (complex filtering)
    'workspaces': TablePattern.SCOPE_BASED,
    'analytics_events': TablePattern.SCOPE_BASED,

    # System-managed resources (no filtering)
    'users': TablePattern.SYSTEM_MANAGED,
    'lookup_values': TablePattern.SYSTEM_MANAGED,
    'tags': TablePattern.SYSTEM_MANAGED,
}


def determine_table_pattern(model_class: Type[Any]) -> TablePattern:
    """Determine the security pattern for a given model class.

    Args:
        model_class: The SQLAlchemy model class

    Returns:
        The appropriate TablePattern for the model

    Raises:
        ValueError: If the table pattern cannot be determined
    """
    # Get table name from model class
    table_name = getattr(model_class, '__tablename__', None)
    if not table_name:
        raise ValueError(f"Model class {model_class.__name__} has no __tablename__ attribute")

    # Check exact table name match
    if table_name in TABLE_PATTERNS:
        return TABLE_PATTERNS[table_name]

    # Check for patterns in table name
    if table_name.startswith('model_'):
        return TablePattern.TENANT_OWNED

    if table_name.startswith('user_'):
        return TablePattern.USER_OWNED

    if table_name.endswith('_analytics') or table_name.startswith('analytics_'):
        return TablePattern.SCOPE_BASED

    # SECURITY: No default fallback - require explicit classification
    # This prevents accidentally exposing unclassified tables
    raise ValueError(
        f"No security pattern defined for table '{table_name}'. "
        f"Add explicit mapping to TABLE_PATTERNS or update pattern detection logic."
    )


def get_ownership_column_name(pattern: TablePattern) -> str:
    """Get the column name used for ownership filtering.

    Args:
        pattern: The table pattern

    Returns:
        The column name to filter by
    """
    return {
        TablePattern.USER_OWNED: 'owner_id',  # Some tables use owner_id
        TablePattern.TENANT_OWNED: 'tenant_id',
        TablePattern.SCOPE_BASED: None,  # Complex, handled in guard
        TablePattern.SYSTEM_MANAGED: None,  # No filtering
    }[pattern]


def get_user_owned_column_name(model_class: Type[Any]) -> str:
    """Get the specific user ownership column for a model.

    Some user-owned tables use 'user_id' while others use 'owner_id'.

    Args:
        model_class: The SQLAlchemy model class

    Returns:
        The actual column name for user ownership
    """
    # Check if model has user_id or owner_id attribute
    if hasattr(model_class, 'user_id'):
        return 'user_id'
    elif hasattr(model_class, 'owner_id'):
        return 'owner_id'
    else:
        raise ValueError(f"Model {model_class.__name__} has neither user_id nor owner_id column")
