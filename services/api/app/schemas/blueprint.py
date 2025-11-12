"""Pydantic schemas for Blueprint entity API operations.

This module defines request/response schemas for genre blueprints including
rules, evaluation rubric, and tag conflict matrix.
"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class BlueprintBase(BaseModel):
    """Base schema for Blueprint with common fields."""

    genre: str = Field(..., min_length=1, max_length=100, description="Genre name")
    version: str = Field(..., min_length=1, max_length=20, description="Blueprint version (semver)")
    rules: Dict[str, Any] = Field(..., description="Genre rules (tempo, sections, lexicon)")
    eval_rubric: Dict[str, Any] = Field(..., description="Evaluation rubric with weights and thresholds")
    conflict_matrix: Dict[str, Any] = Field(default_factory=dict, description="Tag conflict matrix")
    tag_categories: Dict[str, Any] = Field(default_factory=dict, description="Tag categories")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class BlueprintCreate(BlueprintBase):
    """Schema for creating a new Blueprint."""

    pass


class BlueprintUpdate(BaseModel):
    """Schema for updating an existing Blueprint (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    genre: Optional[str] = Field(None, min_length=1, max_length=100)
    version: Optional[str] = Field(None, min_length=1, max_length=20)
    rules: Optional[Dict[str, Any]] = None
    eval_rubric: Optional[Dict[str, Any]] = None
    conflict_matrix: Optional[Dict[str, Any]] = None
    tag_categories: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class BlueprintResponse(BlueprintBase):
    """Schema for Blueprint responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
