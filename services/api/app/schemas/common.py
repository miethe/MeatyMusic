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


class ProfanityViolation(BaseModel):
    """Individual profanity violation with context."""

    word: str = Field(..., description="The profanity word detected")
    category: str = Field(..., description="Profanity category (mild, moderate, severe)")
    score: float = Field(..., description="Severity score (0.3, 0.6, or 1.0)")
    line_number: Optional[int] = Field(None, description="Line number where violation occurred")
    context: Optional[str] = Field(None, description="Surrounding text context")
    position: Optional[int] = Field(None, description="Character position in text")


class ProfanityCheckResult(BaseModel):
    """Result of profanity content check."""

    is_clean: bool = Field(..., description="Whether text passed profanity check")
    violations: List[ProfanityViolation] = Field(default_factory=list, description="List of violations found")
    total_score: float = Field(0.0, description="Total profanity score (sum of all violations)")
    max_score: float = Field(0.0, description="Maximum individual violation score")
    violation_count: int = Field(0, description="Total number of violations")
    categories_found: List[str] = Field(default_factory=list, description="Categories of profanity found")


__all__ = [
    "ErrorResponse",
    "PageInfo",
    "PaginatedResponse",
    "StatusUpdateRequest",
    "NodeOutputUpdate",
    "ProfanityViolation",
    "ProfanityCheckResult",
]
