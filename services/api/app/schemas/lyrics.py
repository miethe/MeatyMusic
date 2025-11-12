"""Pydantic schemas for Lyrics entity API operations.

This module defines request/response schemas for lyrics including validation
for sections, reading level, and structural constraints.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


class POV(str, Enum):
    """Point of view options."""

    FIRST_PERSON = "first-person"
    SECOND_PERSON = "second-person"
    THIRD_PERSON = "third-person"


class Tense(str, Enum):
    """Verb tense options."""

    PAST = "past"
    PRESENT = "present"
    FUTURE = "future"
    MIXED = "mixed"


class HookStrategy(str, Enum):
    """Hook strategy options."""

    CHANT = "chant"
    LYRICAL = "lyrical"
    MELODIC = "melodic"
    CALL_RESPONSE = "call-and-response"


class LyricsBase(BaseModel):
    """Base schema for Lyrics with common fields."""

    song_id: UUID = Field(..., description="Reference to parent song")
    sections: List[Dict[str, Any]] = Field(..., description="Section objects with type, lines, rhyme_scheme")
    section_order: List[str] = Field(..., description="Ordered section types")
    language: str = Field(default="en", max_length=10, description="Language code (ISO 639-1)")
    pov: Optional[POV] = Field(None, description="Point of view")
    tense: Optional[Tense] = Field(None, description="Verb tense")
    rhyme_scheme: Optional[str] = Field(None, max_length=50, description="Rhyme scheme (e.g., AABB)")
    meter: Optional[str] = Field(None, max_length=50, description="Metrical pattern")
    syllables_per_line: Optional[int] = Field(None, gt=0, description="Target syllables per line")
    hook_strategy: Optional[HookStrategy] = Field(None, description="Hook approach")
    repetition_rules: Dict[str, Any] = Field(default_factory=dict, description="Repetition policy")
    imagery_density: Optional[int] = Field(None, ge=0, le=10, description="Imagery richness (1-10)")
    reading_level: Optional[int] = Field(None, ge=0, le=100, description="Reading level (0-100)")
    themes: List[str] = Field(default_factory=list, description="Thematic elements")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Structural constraints")
    explicit_allowed: bool = Field(default=False, description="Whether explicit content is allowed")
    source_citations: List[Dict[str, Any]] = Field(default_factory=list, description="Source citations")
    generated_text: Optional[Dict[str, Any]] = Field(None, description="Generated lyrics by section")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("section_order")
    @classmethod
    def validate_section_order_has_chorus(cls, v: List[str]) -> List[str]:
        """Validate that section order includes at least one Chorus."""
        if not any(section.lower() == "chorus" for section in v):
            raise ValueError("section_order must contain at least one Chorus section")
        return v

    @field_validator("syllables_per_line")
    @classmethod
    def validate_syllables_range(cls, v: Optional[int]) -> Optional[int]:
        """Validate syllables per line is in reasonable range (4-16)."""
        if v is not None and (v < 4 or v > 16):
            raise ValueError("syllables_per_line should be between 4 and 16")
        return v

    @field_validator("reading_level")
    @classmethod
    def validate_reading_level(cls, v: Optional[int]) -> Optional[int]:
        """Validate reading level is in valid range (0-100)."""
        if v is not None and (v < 0 or v > 100):
            raise ValueError("reading_level must be between 0 and 100")
        return v

    @field_validator("imagery_density")
    @classmethod
    def validate_imagery_density(cls, v: Optional[int]) -> Optional[int]:
        """Validate imagery density is in valid range (0-10)."""
        if v is not None and (v < 0 or v > 10):
            raise ValueError("imagery_density must be between 0 and 10")
        return v


class LyricsCreate(LyricsBase):
    """Schema for creating new Lyrics."""

    pass


class LyricsUpdate(BaseModel):
    """Schema for updating existing Lyrics (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    sections: Optional[List[Dict[str, Any]]] = None
    section_order: Optional[List[str]] = None
    language: Optional[str] = Field(None, max_length=10)
    pov: Optional[POV] = None
    tense: Optional[Tense] = None
    rhyme_scheme: Optional[str] = Field(None, max_length=50)
    meter: Optional[str] = Field(None, max_length=50)
    syllables_per_line: Optional[int] = Field(None, gt=0)
    hook_strategy: Optional[HookStrategy] = None
    repetition_rules: Optional[Dict[str, Any]] = None
    imagery_density: Optional[int] = Field(None, ge=0, le=10)
    reading_level: Optional[int] = Field(None, ge=0, le=100)
    themes: Optional[List[str]] = None
    constraints: Optional[Dict[str, Any]] = None
    explicit_allowed: Optional[bool] = None
    source_citations: Optional[List[Dict[str, Any]]] = None
    generated_text: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None

    @field_validator("section_order")
    @classmethod
    def validate_section_order_has_chorus(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate that section order includes at least one Chorus if provided."""
        if v is not None and not any(section.lower() == "chorus" for section in v):
            raise ValueError("section_order must contain at least one Chorus section")
        return v

    @field_validator("syllables_per_line")
    @classmethod
    def validate_syllables_range(cls, v: Optional[int]) -> Optional[int]:
        """Validate syllables per line is in reasonable range."""
        if v is not None and (v < 4 or v > 16):
            raise ValueError("syllables_per_line should be between 4 and 16")
        return v


class LyricsResponse(LyricsBase):
    """Schema for Lyrics responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
