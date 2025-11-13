"""Pydantic schemas for ComposedPrompt entity API operations.

This module defines request/response schemas for composed prompts including
validation status and model targeting.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ValidationStatus(str, Enum):
    """Validation status options."""

    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    LIMIT_EXCEEDED = "limit_exceeded"


class ComposedPromptBase(BaseModel):
    """Base schema for ComposedPrompt with common fields."""

    song_id: UUID = Field(..., description="Reference to parent song")
    workflow_run_id: Optional[UUID] = Field(None, description="Reference to workflow run")
    text: str = Field(..., min_length=1, max_length=10000, description="Final prompt text")
    meta: Dict[str, Any] = Field(..., description="Prompt metadata")
    target_engine: Optional[str] = Field(None, max_length=50, description="Target music engine")
    target_model: Optional[str] = Field(None, max_length=100, description="Target model version")
    style_char_count: Optional[Dict[str, int]] = Field(None, description="Style character counts")
    total_char_count: Optional[Dict[str, int]] = Field(None, description="Total character counts")
    validation_status: ValidationStatus = Field(default=ValidationStatus.PENDING, description="Validation status")
    validation_errors: Optional[List[Dict[str, str]]] = Field(None, description="Validation errors")
    content_hash: Optional[str] = Field(None, max_length=64, description="SHA-256 content hash")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("text")
    @classmethod
    def validate_text_length(cls, v: str) -> str:
        """Validate text is within character limit."""
        if len(v) > 10000:
            raise ValueError("text must not exceed 10000 characters")
        return v


class ComposedPromptCreate(ComposedPromptBase):
    """Schema for creating a new ComposedPrompt."""

    pass


class ComposedPromptUpdate(BaseModel):
    """Schema for updating an existing ComposedPrompt (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    text: Optional[str] = Field(None, min_length=1, max_length=10000)
    meta: Optional[Dict[str, Any]] = None
    target_engine: Optional[str] = Field(None, max_length=50)
    target_model: Optional[str] = Field(None, max_length=100)
    style_char_count: Optional[Dict[str, int]] = None
    total_char_count: Optional[Dict[str, int]] = None
    validation_status: Optional[ValidationStatus] = None
    validation_errors: Optional[List[Dict[str, str]]] = None
    content_hash: Optional[str] = Field(None, max_length=64)
    extra_metadata: Optional[Dict[str, Any]] = None


class ComposedPromptResponse(ComposedPromptBase):
    """Schema for ComposedPrompt responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
