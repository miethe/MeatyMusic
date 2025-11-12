"""Style entity model for music style specifications.

This module defines the Style SQLAlchemy ORM model that captures genre,
tempo, mood, instrumentation, and tags for deterministic music composition.
"""

from sqlalchemy import Column, String, Integer, Index, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Style(BaseModel):
    """ORM model for style specifications.

    Stores genre, tempo, key, mood, instrumentation, and tags that define
    the musical style for a song. Supports blueprint validation and
    tag conflict detection.
    """

    __tablename__ = "styles"
    __table_args__ = (
        Index("ix_styles_genre", "genre"),
        Index("ix_styles_tenant_owner", "tenant_id", "owner_id"),
        Index("ix_styles_name", "name"),
        CheckConstraint(
            "bpm_min IS NULL OR bpm_max IS NULL OR bpm_min <= bpm_max",
            name="check_styles_bpm_range"
        ),
        CheckConstraint(
            "energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 10)",
            name="check_styles_energy_range"
        ),
    )

    # Basic identification
    name = Column(
        String(255),
        nullable=False,
        comment="Display name for this style specification"
    )

    # Genre information
    genre = Column(
        String(100),
        nullable=False,
        comment="Primary genre (e.g., Christmas Pop, Hip-Hop, Country)"
    )
    sub_genres = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Sub-genres and fusions (e.g., Big Band Pop, Electro Swing)"
    )

    # Tempo and key
    bpm_min = Column(
        Integer,
        nullable=True,
        comment="Minimum BPM for tempo range (60-200)"
    )
    bpm_max = Column(
        Integer,
        nullable=True,
        comment="Maximum BPM for tempo range (60-200)"
    )
    key = Column(
        String(20),
        nullable=True,
        comment="Musical key (e.g., C major, D minor)"
    )
    modulations = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Key modulations throughout the song"
    )

    # Mood and energy
    mood = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Mood descriptors (e.g., upbeat, cheeky, warm)"
    )
    energy_level = Column(
        Integer,
        nullable=True,
        comment="Energy level on scale of 1-10"
    )

    # Instrumentation
    instrumentation = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Instruments used (e.g., brass, upright bass, sleigh bells)"
    )

    # Vocal profile
    vocal_profile = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Vocal characteristics: {voice, range, delivery, style}"
    )

    # Tags for prompt composition
    tags_positive = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Positive tags to include (Era, Rhythm, Mix, etc.)"
    )
    tags_negative = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Negative tags to avoid (muddy low-end, overcompressed, etc.)"
    )

    # Blueprint reference
    blueprint_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("blueprints.id", ondelete="SET NULL"),
        nullable=True,
        comment="Reference to genre blueprint for validation"
    )

    # Additional metadata
    metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional style metadata and custom fields"
    )

    # Relationships
    blueprint = relationship("Blueprint", back_populates="styles", lazy="select")
    songs = relationship("Song", back_populates="style", lazy="select")
