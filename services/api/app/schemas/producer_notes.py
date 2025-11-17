"""Pydantic schemas for ProducerNotes entity API operations.

This module defines request/response schemas for producer notes including
arrangement structure, mix targets, and section-specific guidance.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ProducerNotesBase(BaseModel):
    """Base schema for ProducerNotes with common fields."""

    song_id: UUID = Field(..., description="Reference to parent song")
    structure: List[str] = Field(..., description="Ordered section array")
    structure_string: Optional[str] = Field(None, max_length=500, description="Human-readable structure")
    hook_count: Optional[int] = Field(None, ge=0, description="Number of distinct hooks")
    section_tags: Dict[str, List[str]] = Field(default_factory=dict, description="Section-specific tags")
    section_durations: Dict[str, int] = Field(default_factory=dict, description="Target section durations")
    instrumentation_hints: Dict[str, Any] = Field(default_factory=dict, description="Instrumentation guidance")
    mix_targets: Dict[str, Any] = Field(default_factory=dict, description="Mix specifications")
    arrangement_notes: Optional[str] = Field(None, description="Free-form production guidance")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("hook_count")
    @classmethod
    def validate_hook_count(cls, v: Optional[int]) -> Optional[int]:
        """Validate hook count is non-negative."""
        if v is not None and v < 0:
            raise ValueError("hook_count must be non-negative")
        return v


class ProducerNotesCreate(ProducerNotesBase):
    """Schema for creating new ProducerNotes."""

    pass


class ProducerNotesUpdate(BaseModel):
    """Schema for updating existing ProducerNotes (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    structure: Optional[List[str]] = None
    structure_string: Optional[str] = Field(None, max_length=500)
    hook_count: Optional[int] = Field(None, ge=0)
    section_tags: Optional[Dict[str, List[str]]] = None
    section_durations: Optional[Dict[str, int]] = None
    instrumentation_hints: Optional[Dict[str, Any]] = None
    mix_targets: Optional[Dict[str, Any]] = None
    arrangement_notes: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class ProducerNotesResponse(ProducerNotesBase):
    """Schema for ProducerNotes responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    imported_at: Optional[datetime] = None
    import_source_filename: Optional[str] = None
