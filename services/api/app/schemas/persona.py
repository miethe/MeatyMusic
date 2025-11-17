"""Pydantic schemas for Persona entity API operations.

This module defines request/response schemas for artist/band personas including
vocal characteristics, influences, and policy settings.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class PersonaKind(str, Enum):
    """Persona type options."""

    ARTIST = "artist"
    BAND = "band"


class PersonaBase(BaseModel):
    """Base schema for Persona with common fields."""

    name: str = Field(..., min_length=1, max_length=255, description="Persona display name")
    kind: PersonaKind = Field(default=PersonaKind.ARTIST, description="Artist or band")
    bio: Optional[str] = Field(None, description="Biographical text")
    voice: Optional[str] = Field(None, max_length=500, description="Voice description")
    vocal_range: Optional[str] = Field(None, max_length=100, description="Vocal range classification")
    delivery: List[str] = Field(default_factory=list, description="Delivery styles")
    influences: List[str] = Field(default_factory=list, description="Artist/genre influences")
    style_defaults: Optional[Dict[str, Any]] = Field(None, description="Default style preferences")
    lyrics_defaults: Optional[Dict[str, Any]] = Field(None, description="Default lyrics preferences")
    policy: Dict[str, Any] = Field(
        default_factory=lambda: {"public_release": False, "disallow_named_style_of": True},
        description="Policy settings"
    )
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class PersonaCreate(PersonaBase):
    """Schema for creating a new Persona."""

    pass


class PersonaUpdate(BaseModel):
    """Schema for updating an existing Persona (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    kind: Optional[PersonaKind] = None
    bio: Optional[str] = None
    voice: Optional[str] = Field(None, max_length=500)
    vocal_range: Optional[str] = Field(None, max_length=100)
    delivery: Optional[List[str]] = None
    influences: Optional[List[str]] = None
    style_defaults: Optional[Dict[str, Any]] = None
    lyrics_defaults: Optional[Dict[str, Any]] = None
    policy: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class PersonaResponse(PersonaBase):
    """Schema for Persona responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    imported_at: Optional[datetime] = None
    import_source_filename: Optional[str] = None
