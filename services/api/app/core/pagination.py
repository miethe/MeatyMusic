"""Cursor-based pagination utilities for repositories.

This module provides cursor-based pagination support for efficient
querying of large datasets. Cursors are encoded/decoded using base64
to hide implementation details.
"""

from __future__ import annotations

import base64
import json
from typing import TypeVar, Generic, List, Any, Dict
from dataclasses import dataclass


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
    items: List[Any],
    has_next: bool,
    has_prev: bool,
    cursor_fn: callable | None = None,
) -> PageInfo:
    """Create PageInfo from query results.

    Args:
        items: List of items in the current page
        has_next: Whether there are more pages after this one
        has_prev: Whether there are pages before this one
        cursor_fn: Optional function to extract cursor from an item

    Returns:
        PageInfo instance
    """
    if not items:
        return PageInfo(
            has_next_page=has_next,
            has_previous_page=has_prev,
            start_cursor=None,
            end_cursor=None,
        )

    if cursor_fn:
        start_cursor = cursor_fn(items[0])
        end_cursor = cursor_fn(items[-1])
    else:
        # Default: use item ID if available
        start_cursor = encode_cursor({"id": str(getattr(items[0], "id", 0))})
        end_cursor = encode_cursor({"id": str(getattr(items[-1], "id", 0))})

    return PageInfo(
        has_next_page=has_next,
        has_previous_page=has_prev,
        start_cursor=start_cursor,
        end_cursor=end_cursor,
    )
