"""Song entity model for song orchestration and state.

This module defines the Song and WorkflowRun SQLAlchemy ORM models that
capture song metadata, SDS version, global seed, and workflow execution state.
"""

from sqlalchemy import Column, String, Integer, BigInteger, Index, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Song(BaseModel):
    """ORM model for songs.

    Stores song metadata, SDS version, global seed for determinism,
    references to style/persona/blueprint, and feature flags for
    workflow orchestration.
    """

    __tablename__ = "songs"
    __table_args__ = (
        Index("ix_songs_status", "status"),
        Index("ix_songs_tenant_owner", "tenant_id", "owner_id"),
        Index("ix_songs_title", "title"),
        Index("ix_songs_created_at", "created_at"),
        CheckConstraint(
            "global_seed >= 0",
            name="check_songs_global_seed_positive"
        ),
    )

    # Basic metadata
    title = Column(
        String(500),
        nullable=False,
        comment="Song title"
    )

    # SDS versioning for schema evolution
    sds_version = Column(
        String(20),
        nullable=False,
        server_default="1.0.0",
        comment="Song Design Spec schema version (semver)"
    )

    # Determinism seed
    global_seed = Column(
        BigInteger,
        nullable=False,
        comment="Global seed for deterministic generation (non-negative integer)"
    )

    # Entity references
    style_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("styles.id", ondelete="SET NULL"),
        nullable=True,
        comment="Reference to style specification"
    )
    persona_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("personas.id", ondelete="SET NULL"),
        nullable=True,
        comment="Reference to artist persona (optional)"
    )
    blueprint_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("blueprints.id", ondelete="SET NULL"),
        nullable=True,
        comment="Reference to genre blueprint for validation"
    )

    # Workflow state
    status = Column(
        String(50),
        nullable=False,
        server_default="draft",
        comment="Song status (draft, validated, rendering, rendered, failed)"
    )

    # Feature flags for workflow control
    feature_flags = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Feature flags: {render.enabled, eval.autofix.enabled, etc.}"
    )

    # Render configuration
    render_config = Column(
        JSONB,
        nullable=True,
        comment="Render configuration: {engine, model, num_variations}"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional song metadata and custom fields"
    )

    # Relationships
    style = relationship("Style", back_populates="songs", lazy="select")
    persona = relationship("Persona", back_populates="songs", lazy="select")
    blueprint = relationship("Blueprint", back_populates="songs", lazy="select")
    lyrics = relationship(
        "Lyrics",
        back_populates="song",
        cascade="all, delete-orphan",
        lazy="select"
    )
    producer_notes = relationship(
        "ProducerNotes",
        back_populates="song",
        cascade="all, delete-orphan",
        lazy="select"
    )
    workflow_runs = relationship(
        "WorkflowRun",
        back_populates="song",
        cascade="all, delete-orphan",
        lazy="select"
    )
    composed_prompts = relationship(
        "ComposedPrompt",
        back_populates="song",
        cascade="all, delete-orphan",
        lazy="select"
    )


class WorkflowRun(BaseModel):
    """ORM model for workflow execution tracking.

    Tracks individual workflow runs with node outputs, events, scores,
    validation results, and fix iterations for observability and debugging.
    """

    __tablename__ = "workflow_runs"
    __table_args__ = (
        Index("ix_workflow_runs_song_id", "song_id"),
        Index("ix_workflow_runs_run_id", "run_id", unique=True),
        Index("ix_workflow_runs_status", "status"),
        Index("ix_workflow_runs_tenant_owner", "tenant_id", "owner_id"),
        Index("ix_workflow_runs_created_at", "created_at"),
        CheckConstraint(
            "fix_iterations >= 0 AND fix_iterations <= 3",
            name="check_workflow_runs_fix_iterations_range"
        ),
    )

    # Song association
    song_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to the parent song"
    )

    # Run identification
    run_id = Column(
        SA_UUID(as_uuid=True),
        nullable=False,
        unique=True,
        comment="Unique identifier for this workflow run"
    )

    # Workflow state
    status = Column(
        String(50),
        nullable=False,
        server_default="running",
        comment="Run status (running, completed, failed, cancelled)"
    )
    current_node = Column(
        String(50),
        nullable=True,
        comment="Current workflow node (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, RENDER, REVIEW)"
    )

    # Node outputs and artifacts
    node_outputs = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Node outputs: {node: {artifacts, scores, citations, duration_ms}}"
    )

    # Event stream for observability
    event_stream = Column(
        JSONB,
        nullable=False,
        server_default="[]",
        comment="Array of events: [{ts, node, phase, duration_ms, metrics, issues}]"
    )

    # Validation and scoring
    validation_scores = Column(
        JSONB,
        nullable=True,
        comment="Rubric scores: {hook_density, singability, rhyme_tightness, section_completeness, profanity_score, total}"
    )

    # Fix iterations
    fix_iterations = Column(
        Integer,
        nullable=False,
        server_default="0",
        comment="Number of auto-fix iterations (max 3)"
    )

    # Error tracking
    error = Column(
        JSONB,
        nullable=True,
        comment="Error details if run failed: {message, node, stack_trace}"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional run metadata and custom fields"
    )

    # Relationships
    song = relationship("Song", back_populates="workflow_runs", lazy="select")
