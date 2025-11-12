"""ComposedPrompt entity model for final render-ready prompts.

This module defines the ComposedPrompt SQLAlchemy ORM model that captures
the final merged prompt text, metadata (title, genre, tempo, tags), and
model limits for music engine rendering.
"""

from sqlalchemy import Column, String, Text, Index, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ComposedPrompt(BaseModel):
    """ORM model for composed prompts ready for rendering.

    Stores the final prompt text merging style, lyrics, and producer notes,
    along with metadata (title, genre, tempo, structure, tags) and model
    limits for engine-specific rendering.
    """

    __tablename__ = "composed_prompts"
    __table_args__ = (
        Index("ix_composed_prompts_song_id", "song_id"),
        Index("ix_composed_prompts_workflow_run_id", "workflow_run_id"),
        Index("ix_composed_prompts_tenant_owner", "tenant_id", "owner_id"),
        CheckConstraint(
            "char_length(text) <= 10000",
            name="check_composed_prompts_text_length"
        ),
    )

    # Song and run association
    song_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to the parent song"
    )
    workflow_run_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=True,
        comment="Reference to the workflow run that generated this prompt"
    )

    # Prompt text
    text = Column(
        Text,
        nullable=False,
        comment="Final composed prompt text for music engine rendering"
    )

    # Metadata
    meta = Column(
        JSONB,
        nullable=False,
        comment="Prompt metadata: {title, genre, tempo_bpm, structure, style_tags, negative_tags, section_tags, model_limits}"
    )

    # Model targeting
    target_engine = Column(
        String(50),
        nullable=True,
        comment="Target music engine (suno, udio, etc.)"
    )
    target_model = Column(
        String(100),
        nullable=True,
        comment="Target model version (e.g., suno-v5, udio-v2)"
    )

    # Character count tracking
    style_char_count = Column(
        JSONB,
        nullable=True,
        comment="Character counts: {style_tags, negative_tags, total_style}"
    )
    total_char_count = Column(
        JSONB,
        nullable=True,
        comment="Total character count: {prompt_text, metadata, total}"
    )

    # Validation status
    validation_status = Column(
        String(50),
        nullable=False,
        server_default="pending",
        comment="Validation status (pending, valid, invalid, limit_exceeded)"
    )
    validation_errors = Column(
        JSONB,
        nullable=True,
        comment="Array of validation errors if status is invalid"
    )

    # Hash for determinism verification
    content_hash = Column(
        String(64),
        nullable=True,
        comment="SHA-256 hash of prompt text for determinism verification"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional composed prompt metadata and custom fields"
    )

    # Relationships
    song = relationship("Song", back_populates="composed_prompts", lazy="select")
    workflow_run = relationship("WorkflowRun", lazy="select")
