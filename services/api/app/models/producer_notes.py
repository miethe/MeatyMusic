"""ProducerNotes entity model for arrangement and production guidance.

This module defines the ProducerNotes SQLAlchemy ORM model that captures
structure, section tags, instrumentation hints, and mix targets for production.
"""

from sqlalchemy import Column, String, Integer, Text, Index, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ProducerNotes(BaseModel):
    """ORM model for producer notes and arrangement guidance.

    Stores structural arrangement, hook count, section-specific tags,
    target durations, instrumentation hints, and mix targets for
    deterministic production guidance.
    """

    __tablename__ = "producer_notes"
    __table_args__ = (
        Index("ix_producer_notes_song_id", "song_id"),
        Index("ix_producer_notes_tenant_owner", "tenant_id", "owner_id"),
        CheckConstraint(
            "hook_count IS NULL OR hook_count >= 0",
            name="check_producer_notes_hook_count_positive"
        ),
    )

    # Song association
    song_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to the parent song"
    )

    # Structural arrangement
    structure = Column(
        JSONB,
        nullable=False,
        comment="Ordered array of sections (e.g., [Intro, Verse, Chorus, Bridge])"
    )
    structure_string = Column(
        String(500),
        nullable=True,
        comment="Human-readable structure (e.g., Intro-Verse-Chorus-Bridge-Chorus)"
    )

    # Hooks and repetition
    hook_count = Column(
        Integer,
        nullable=True,
        comment="Number of distinct hooks in the song"
    )

    # Section-specific metadata
    section_tags = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Section-specific tags: {section: [tags]} (e.g., Chorus: [anthemic, hook-forward])"
    )
    section_durations = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Target section durations: {section: duration_seconds}"
    )

    # Instrumentation and arrangement
    instrumentation_hints = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Instrumentation guidance: {global: [instruments], section_specific: {section: [instruments]}}"
    )

    # Mix targets
    mix_targets = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Mix specifications: {loudness_lufs, stereo_width, space, compression, eq_notes}"
    )

    # Additional production notes
    arrangement_notes = Column(
        Text,
        nullable=True,
        comment="Free-form arrangement and production guidance"
    )

    # Additional metadata
    metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional producer notes metadata and custom fields"
    )

    # Relationships
    song = relationship("Song", back_populates="producer_notes", lazy="select")
