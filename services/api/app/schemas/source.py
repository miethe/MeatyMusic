"""Pydantic schemas for Source entity API operations.

This module defines request/response schemas for external data sources including
MCP server integration, scoping rules, and provenance tracking.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


class SourceKind(str, Enum):
    """Source type options."""

    FILE = "file"
    WEB = "web"
    API = "api"


class SourceBase(BaseModel):
    """Base schema for Source with common fields."""

    name: str = Field(..., min_length=1, max_length=255, description="Source identifier")
    kind: SourceKind = Field(..., description="Source type")
    config: Dict[str, Any] = Field(default_factory=dict, description="Source configuration")
    scopes: List[str] = Field(default_factory=list, description="Available scopes")
    allow: List[str] = Field(default_factory=list, description="Allowed terms")
    deny: List[str] = Field(default_factory=list, description="Denied terms")
    weight: float = Field(default=0.5, ge=0.0, le=1.0, description="Retrieval weight")
    provenance: bool = Field(default=True, description="Track provenance")
    mcp_server_id: str = Field(..., min_length=1, max_length=255, description="MCP server identifier")
    is_active: bool = Field(default=True, description="Whether source is active")
    last_validated_at: Optional[Dict[str, Any]] = Field(None, description="Last validation check")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("weight")
    @classmethod
    def validate_weight_range(cls, v: float) -> float:
        """Validate weight is in valid range (0.0-1.0)."""
        if v < 0.0 or v > 1.0:
            raise ValueError("weight must be between 0.0 and 1.0")
        return v


class SourceCreate(SourceBase):
    """Schema for creating a new Source."""

    pass


class SourceUpdate(BaseModel):
    """Schema for updating an existing Source (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    kind: Optional[SourceKind] = None
    config: Optional[Dict[str, Any]] = None
    scopes: Optional[List[str]] = None
    allow: Optional[List[str]] = None
    deny: Optional[List[str]] = None
    weight: Optional[float] = Field(None, ge=0.0, le=1.0)
    provenance: Optional[bool] = None
    mcp_server_id: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    last_validated_at: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class SourceResponse(SourceBase):
    """Schema for Source responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
