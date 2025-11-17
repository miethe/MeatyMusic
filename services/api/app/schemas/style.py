"""Pydantic schemas for Style entity API operations.

This module defines request/response schemas for style specifications including
validation for BPM ranges, energy levels, and tag conflicts.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


class StyleBase(BaseModel):
    """Base schema for Style with common fields."""

    name: str = Field(..., min_length=1, max_length=255, description="Display name for this style")
    genre: str = Field(..., min_length=1, max_length=100, description="Primary genre")
    sub_genres: List[str] = Field(default_factory=list, description="Sub-genres and fusions")
    bpm_min: Optional[int] = Field(None, ge=40, le=220, description="Minimum BPM")
    bpm_max: Optional[int] = Field(None, ge=40, le=220, description="Maximum BPM")
    key: Optional[str] = Field(None, max_length=20, description="Musical key (e.g., C major)")
    modulations: List[str] = Field(default_factory=list, description="Key modulations")
    mood: List[str] = Field(default_factory=list, description="Mood descriptors")
    energy_level: Optional[int] = Field(None, ge=1, le=10, description="Energy level (1-10)")
    instrumentation: List[str] = Field(default_factory=list, description="Instruments")
    vocal_profile: Dict[str, Any] = Field(default_factory=dict, description="Vocal characteristics")
    tags_positive: List[str] = Field(default_factory=list, description="Positive tags")
    tags_negative: List[str] = Field(default_factory=list, description="Negative tags")
    blueprint_id: Optional[UUID] = Field(None, description="Reference to blueprint")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("bpm_max")
    @classmethod
    def validate_bpm_range(cls, v: Optional[int], info) -> Optional[int]:
        """Validate that bpm_max >= bpm_min."""
        if v is not None and info.data.get("bpm_min") is not None:
            if v < info.data["bpm_min"]:
                raise ValueError("bpm_max must be greater than or equal to bpm_min")
        return v

    @field_validator("energy_level")
    @classmethod
    def validate_energy_level(cls, v: Optional[int]) -> Optional[int]:
        """Validate energy level is in range 1-10."""
        if v is not None and (v < 1 or v > 10):
            raise ValueError("energy_level must be between 1 and 10")
        return v

    @field_validator("instrumentation")
    @classmethod
    def validate_instrumentation_limit(cls, v: List[str]) -> List[str]:
        """Limit instrumentation to max 3 items to avoid mix dilution."""
        if len(v) > 3:
            raise ValueError("instrumentation should be limited to 3 items or fewer to avoid mix dilution")
        return v


class StyleCreate(StyleBase):
    """Schema for creating a new Style."""

    pass


class StyleUpdate(BaseModel):
    """Schema for updating an existing Style (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    genre: Optional[str] = Field(None, min_length=1, max_length=100)
    sub_genres: Optional[List[str]] = None
    bpm_min: Optional[int] = Field(None, ge=40, le=220)
    bpm_max: Optional[int] = Field(None, ge=40, le=220)
    key: Optional[str] = Field(None, max_length=20)
    modulations: Optional[List[str]] = None
    mood: Optional[List[str]] = None
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    instrumentation: Optional[List[str]] = None
    vocal_profile: Optional[Dict[str, Any]] = None
    tags_positive: Optional[List[str]] = None
    tags_negative: Optional[List[str]] = None
    blueprint_id: Optional[UUID] = None
    extra_metadata: Optional[Dict[str, Any]] = None

    @field_validator("bpm_max")
    @classmethod
    def validate_bpm_range(cls, v: Optional[int], info) -> Optional[int]:
        """Validate that bpm_max >= bpm_min if both are provided."""
        if v is not None and info.data.get("bpm_min") is not None:
            if v < info.data["bpm_min"]:
                raise ValueError("bpm_max must be greater than or equal to bpm_min")
        return v

    @field_validator("instrumentation")
    @classmethod
    def validate_instrumentation_limit(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Limit instrumentation to max 3 items."""
        if v is not None and len(v) > 3:
            raise ValueError("instrumentation should be limited to 3 items or fewer")
        return v


class StyleResponse(StyleBase):
    """Schema for Style responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    imported_at: Optional[datetime] = None
    import_source_filename: Optional[str] = None
