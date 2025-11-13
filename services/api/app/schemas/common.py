"""Common schema models for API responses.

This module provides shared response models used across all API endpoints.
"""

from __future__ import annotations

from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field


T = TypeVar("T")


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    field: Optional[str] = Field(None, description="Field that caused the error")


class PageInfo(BaseModel):
    """Pagination metadata for cursor-based pagination."""

    has_next_page: bool = Field(..., description="Whether there are more items")
    has_previous_page: bool = Field(False, description="Whether there are previous items")
    start_cursor: Optional[str] = Field(None, description="Cursor for the first item")
    end_cursor: Optional[str] = Field(None, description="Cursor for the last item")
    total_count: Optional[int] = Field(None, description="Total number of items (if available)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model."""

    items: List[T] = Field(..., description="List of items")
    page_info: PageInfo = Field(..., description="Pagination metadata")


class StatusUpdateRequest(BaseModel):
    """Request model for status updates."""

    status: str = Field(..., description="New status value")


class NodeOutputUpdate(BaseModel):
    """Request model for updating workflow node output."""

    node: str = Field(..., description="Node name (e.g., PLAN, STYLE, LYRICS)")
    output: dict = Field(..., description="Node output data")
    artifacts: Optional[dict] = Field(None, description="Generated artifacts")
    scores: Optional[dict] = Field(None, description="Evaluation scores")
    citations: Optional[List[dict]] = Field(None, description="Source citations")
    error: Optional[str] = Field(None, description="Error message if node failed")


__all__ = [
    "ErrorResponse",
    "PageInfo",
    "PaginatedResponse",
    "StatusUpdateRequest",
    "NodeOutputUpdate",
]
