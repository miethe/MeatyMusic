"""Legacy RowGuard for backward compatibility.

This module provides a simplified RowGuard class for backward compatibility
with existing repository code. New code should use UnifiedRowGuard from
core.security instead.
"""

from __future__ import annotations

from uuid import UUID


class RowGuard:
    """Legacy row-level security guard based on owner_id.

    This is a simplified implementation for backward compatibility.
    New code should use UnifiedRowGuard from core.security.
    """

    def __init__(self, owner_id: UUID | str):
        """Initialize with an owner_id.

        Args:
            owner_id: The owner/user ID to filter by
        """
        self.owner_id = UUID(owner_id) if isinstance(owner_id, str) else owner_id

    def filter_query(self, query, model_class):
        """Apply owner_id filter to a SQLAlchemy query.

        Args:
            query: SQLAlchemy query object
            model_class: The model class being queried

        Returns:
            Filtered query
        """
        if hasattr(model_class, "owner_id"):
            return query.filter(model_class.owner_id == self.owner_id)
        return query
