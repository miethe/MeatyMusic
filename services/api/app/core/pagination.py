"""Cursor-based pagination utilities for repositories.

This module provides cursor-based pagination support for efficient
querying of large datasets. Cursors are encoded/decoded using base64
to hide implementation details.
"""

from __future__ import annotations

import base64
import json
from typing import TypeVar, Generic, List, Any, Dict, Optional, Type
from dataclasses import dataclass
from sqlalchemy import asc, desc
from sqlalchemy.orm import Query


T = TypeVar("T")


@dataclass
class CursorPagination(Generic[T]):
    """Result of a cursor-paginated query.

    Attributes:
        items: List of items in the current page
        next_cursor: Cursor for the next page (None if no more pages)
        prev_cursor: Cursor for the previous page (None if on first page)
        has_next: Whether there are more pages after this one
        has_prev: Whether there are pages before this one
        total_count: Total count of items (if available, None otherwise)
    """

    items: List[T]
    next_cursor: str | None = None
    prev_cursor: str | None = None
    has_next: bool = False
    has_prev: bool = False
    total_count: int | None = None

    @staticmethod
    def paginate(
        query: Query,
        cursor: Optional[str],
        limit: int,
        sort_field: str,
        sort_desc: bool,
        security_context: Any,
        model_class: Type[T],
        include_total: bool = False
    ) -> "CursorPagination[T]":
        """Apply cursor-based pagination to a query with security filtering.

        Args:
            query: SQLAlchemy query to paginate
            cursor: Optional cursor for pagination
            limit: Maximum number of items to return
            sort_field: Field to sort by
            sort_desc: Whether to sort in descending order
            security_context: Security context for row-level filtering
            model_class: The SQLAlchemy model class being queried
            include_total: Whether to include total count (expensive)

        Returns:
            CursorPagination instance with items and pagination metadata
        """
        # Apply security filtering if context is provided
        if security_context is not None:
            from app.core.security import UnifiedRowGuard
            guard = UnifiedRowGuard(model_class, security_context)
            query = guard.filter_query(query)

        # Apply cursor filtering if provided
        if cursor:
            cursor_data = decode_cursor(cursor)
            cursor_field = cursor_data.get("field", sort_field)
            cursor_value = cursor_data["value"]
            cursor_id = cursor_data.get("id")

            field_attr = getattr(model_class, cursor_field)
            id_attr = getattr(model_class, "id")

            # Apply cursor condition based on sort direction
            if sort_desc:
                query = query.filter(
                    (field_attr < cursor_value) |
                    ((field_attr == cursor_value) & (id_attr < cursor_id))
                )
            else:
                query = query.filter(
                    (field_attr > cursor_value) |
                    ((field_attr == cursor_value) & (id_attr > cursor_id))
                )

        # Apply sorting
        sort_attr = getattr(model_class, sort_field)
        id_attr = getattr(model_class, "id")
        if sort_desc:
            query = query.order_by(desc(sort_attr), desc(id_attr))
        else:
            query = query.order_by(asc(sort_attr), asc(id_attr))

        # Fetch limit + 1 to determine if there are more items
        items = query.limit(limit + 1).all()

        # Determine if there are more pages
        has_next = len(items) > limit
        if has_next:
            items = items[:limit]

        # Generate next cursor if there are more pages
        next_cursor = None
        if has_next and items:
            last_item = items[-1]
            sort_value = getattr(last_item, sort_field)
            item_id = getattr(last_item, "id")

            # Handle different types of sort values
            if hasattr(sort_value, 'isoformat'):  # datetime
                cursor_value = sort_value.isoformat()
            else:
                cursor_value = str(sort_value)

            next_cursor = encode_cursor({
                "field": sort_field,
                "value": cursor_value,
                "id": str(item_id)
            })

        # Calculate total count if requested (expensive operation)
        total_count = None
        if include_total:
            # Remove ordering for count query
            count_query = query.order_by(None).limit(None)
            total_count = count_query.count()

        return CursorPagination(
            items=items,
            next_cursor=next_cursor,
            has_next=has_next,
            has_prev=cursor is not None,  # If we have a cursor, there are previous pages
            total_count=total_count
        )


@dataclass
class PageInfo:
    """Pagination metadata for GraphQL-style connections.

    Attributes:
        has_next_page: Whether there are more pages after this one
        has_previous_page: Whether there are pages before this one
        start_cursor: Cursor of the first item in the page
        end_cursor: Cursor of the last item in the page
    """

    has_next_page: bool
    has_previous_page: bool
    start_cursor: str | None = None
    end_cursor: str | None = None


def encode_cursor(data: Dict[str, Any]) -> str:
    """Encode pagination data into a base64 cursor string.

    Args:
        data: Dictionary containing cursor data (e.g., {"id": "123", "created_at": "2024-01-01"})

    Returns:
        Base64-encoded cursor string
    """
    json_str = json.dumps(data, sort_keys=True)
    return base64.urlsafe_b64encode(json_str.encode()).decode()


def decode_cursor(cursor: str) -> Dict[str, Any]:
    """Decode a base64 cursor string back into pagination data.

    Args:
        cursor: Base64-encoded cursor string

    Returns:
        Dictionary containing cursor data

    Raises:
        ValueError: If cursor is invalid or malformed
    """
    try:
        json_str = base64.urlsafe_b64decode(cursor.encode()).decode()
        return json.loads(json_str)
    except (ValueError, json.JSONDecodeError) as e:
        raise ValueError(f"Invalid cursor: {e}")


def create_page_info(
    pagination_result: CursorPagination | None = None,
    items: List[Any] | None = None,
    has_next: bool | None = None,
    has_prev: bool | None = None,
    cursor_fn: callable | None = None,
) -> dict[str, Any]:
    """Create page info dict from pagination result or query results.

    Args:
        pagination_result: CursorPagination instance (preferred)
        items: List of items in the current page (legacy)
        has_next: Whether there are more pages after this one (legacy)
        has_prev: Whether there are pages before this one (legacy)
        cursor_fn: Optional function to extract cursor from an item (legacy)

    Returns:
        Dictionary with 'items' and 'pageInfo' keys
    """
    # If pagination_result is provided, use it
    if pagination_result is not None:
        return {
            "items": pagination_result.items,
            "pageInfo": {
                "hasNextPage": pagination_result.has_next,
                "nextCursor": pagination_result.next_cursor,
                "totalCount": pagination_result.total_count
            }
        }

    # Legacy mode for backward compatibility
    if items is None:
        items = []
    if has_next is None:
        has_next = False
    if has_prev is None:
        has_prev = False

    if not items:
        page_info = PageInfo(
            has_next_page=has_next,
            has_previous_page=has_prev,
            start_cursor=None,
            end_cursor=None,
        )
    else:
        if cursor_fn:
            start_cursor = cursor_fn(items[0])
            end_cursor = cursor_fn(items[-1])
        else:
            # Default: use item ID if available
            start_cursor = encode_cursor({"id": str(getattr(items[0], "id", 0))})
            end_cursor = encode_cursor({"id": str(getattr(items[-1], "id", 0))})

        page_info = PageInfo(
            has_next_page=has_next,
            has_previous_page=has_prev,
            start_cursor=start_cursor,
            end_cursor=end_cursor,
        )

    return {
        "items": items,
        "pageInfo": {
            "hasNextPage": page_info.has_next_page,
            "hasPreviousPage": page_info.has_previous_page,
            "startCursor": page_info.start_cursor,
            "endCursor": page_info.end_cursor
        }
    }
