"""Pagination schemas for cursor-based pagination responses."""
from __future__ import annotations

from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar('T')


class PageInfo(BaseModel):
    """Page information for cursor-based pagination following MeatyMusic AMCS standards.

    Fields use frontend-friendly names (cursor, hasNext, total) but accept backend
    field names (next_cursor, has_more, total_count) via populate_by_name.
    """

    cursor: Optional[str] = Field(
        default=None,
        description=(
            "Cursor for fetching the next page. Pass this value to the `cursor`"
            " query parameter on subsequent requests."
        ),
        validation_alias="next_cursor",  # Accept next_cursor as input
    )
    hasNext: bool = Field(
        ...,
        description="Whether more items are available",
        validation_alias="has_more",  # Accept has_more as input
    )
    total: Optional[int] = Field(
        None,
        description="Total count of items (if available)",
        validation_alias="total_count",  # Accept total_count as input
    )

    model_config = ConfigDict(populate_by_name=True)


class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Cursor-paginated response envelope following MeatyMusic AMCS patterns."""

    items: List[T] = Field(..., description="Items for current page")
    page_info: PageInfo = Field(
        ...,
        description="Pagination metadata",
        serialization_alias="page"  # Frontend expects "page" not "page_info"
    )
