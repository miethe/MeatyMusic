"""Pydantic schemas for Song and WorkflowRun entity API operations.

This module defines request/response schemas for songs and workflow execution
tracking including validation for global seed and status transitions.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


class SongStatus(str, Enum):
    """Valid song status values."""

    DRAFT = "draft"
    VALIDATED = "validated"
    RENDERING = "rendering"
    RENDERED = "rendered"
    FAILED = "failed"


class WorkflowRunStatus(str, Enum):
    """Valid workflow run status values."""

    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowNode(str, Enum):
    """Valid workflow node names."""

    PLAN = "PLAN"
    STYLE = "STYLE"
    LYRICS = "LYRICS"
    PRODUCER = "PRODUCER"
    COMPOSE = "COMPOSE"
    VALIDATE = "VALIDATE"
    FIX = "FIX"
    RENDER = "RENDER"
    REVIEW = "REVIEW"


# Song Schemas


class SongBase(BaseModel):
    """Base schema for Song with common fields."""

    title: str = Field(..., min_length=1, max_length=500, description="Song title")
    sds_version: str = Field(default="1.0.0", max_length=20, description="SDS schema version")
    global_seed: int = Field(..., ge=0, description="Global seed for determinism")
    style_id: Optional[UUID] = Field(None, description="Reference to style")
    persona_id: Optional[UUID] = Field(None, description="Reference to persona")
    blueprint_id: Optional[UUID] = Field(None, description="Reference to blueprint")
    status: SongStatus = Field(default=SongStatus.DRAFT, description="Song status")
    feature_flags: Dict[str, Any] = Field(default_factory=dict, description="Feature flags")
    render_config: Optional[Dict[str, Any]] = Field(None, description="Render configuration")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("global_seed")
    @classmethod
    def validate_global_seed(cls, v: int) -> int:
        """Validate global seed is non-negative."""
        if v < 0:
            raise ValueError("global_seed must be non-negative")
        return v


class SongCreate(SongBase):
    """Schema for creating a new Song."""

    pass


class SongUpdate(BaseModel):
    """Schema for updating an existing Song (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    sds_version: Optional[str] = Field(None, max_length=20)
    global_seed: Optional[int] = Field(None, ge=0)
    style_id: Optional[UUID] = None
    persona_id: Optional[UUID] = None
    blueprint_id: Optional[UUID] = None
    status: Optional[SongStatus] = None
    feature_flags: Optional[Dict[str, Any]] = None
    render_config: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class SongResponse(SongBase):
    """Schema for Song responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


# WorkflowRun Schemas


class WorkflowRunBase(BaseModel):
    """Base schema for WorkflowRun with common fields."""

    song_id: UUID = Field(..., description="Reference to parent song")
    run_id: UUID = Field(..., description="Unique run identifier")
    status: WorkflowRunStatus = Field(default=WorkflowRunStatus.RUNNING, description="Run status")
    current_node: Optional[WorkflowNode] = Field(None, description="Current workflow node")
    node_outputs: Dict[str, Any] = Field(default_factory=dict, description="Node outputs and artifacts")
    event_stream: List[Dict[str, Any]] = Field(default_factory=list, description="Event stream")
    validation_scores: Optional[Dict[str, float]] = Field(None, description="Validation rubric scores")
    fix_iterations: int = Field(default=0, ge=0, le=3, description="Auto-fix iteration count")
    error: Optional[Dict[str, Any]] = Field(None, description="Error details if failed")
    extra_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("fix_iterations")
    @classmethod
    def validate_fix_iterations(cls, v: int) -> int:
        """Validate fix iterations is in valid range (0-3)."""
        if v < 0 or v > 3:
            raise ValueError("fix_iterations must be between 0 and 3")
        return v


class WorkflowRunCreate(WorkflowRunBase):
    """Schema for creating a new WorkflowRun."""

    pass


class WorkflowRunUpdate(BaseModel):
    """Schema for updating an existing WorkflowRun (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    status: Optional[WorkflowRunStatus] = None
    current_node: Optional[WorkflowNode] = None
    node_outputs: Optional[Dict[str, Any]] = None
    event_stream: Optional[List[Dict[str, Any]]] = None
    validation_scores: Optional[Dict[str, float]] = None
    fix_iterations: Optional[int] = Field(None, ge=0, le=3)
    error: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None

    @field_validator("fix_iterations")
    @classmethod
    def validate_fix_iterations(cls, v: Optional[int]) -> Optional[int]:
        """Validate fix iterations if provided."""
        if v is not None and (v < 0 or v > 3):
            raise ValueError("fix_iterations must be between 0 and 3")
        return v


class WorkflowRunResponse(WorkflowRunBase):
    """Schema for WorkflowRun responses including database fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
