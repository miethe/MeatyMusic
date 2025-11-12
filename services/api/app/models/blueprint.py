"""Blueprint entity model for genre-specific algorithmic templates.

This module defines the Blueprint SQLAlchemy ORM model that captures
genre rules (tempo, sections, lexicon) and evaluation rubric (weights,
thresholds) for hit song generation and validation.
"""

from sqlalchemy import Column, String, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Blueprint(BaseModel):
    """ORM model for genre blueprints and rubrics.

    Stores genre-specific rules (tempo ranges, required sections, banned terms,
    lexicon) and evaluation rubric (metric weights, thresholds) for deterministic
    song generation and automated validation.
    """

    __tablename__ = "blueprints"
    __table_args__ = (
        Index("ix_blueprints_genre", "genre"),
        Index("ix_blueprints_version", "version"),
        Index("ix_blueprints_tenant_owner", "tenant_id", "owner_id"),
        Index(
            "ix_blueprints_genre_version_unique",
            "genre",
            "version",
            unique=True,
            postgresql_where="deleted_at IS NULL"
        ),
    )

    # Identification
    genre = Column(
        String(100),
        nullable=False,
        comment="Genre name (e.g., Christmas Pop, Hip-Hop, Country)"
    )
    version = Column(
        String(20),
        nullable=False,
        comment="Blueprint version (semver, e.g., 2025.11)"
    )

    # Genre rules
    rules = Column(
        JSONB,
        nullable=False,
        comment="Genre rules: {tempo_bpm, required_sections, banned_terms, lexicon_positive, lexicon_negative, section_lines}"
    )

    # Evaluation rubric
    eval_rubric = Column(
        JSONB,
        nullable=False,
        comment="Evaluation rubric: {weights: {hook_density, singability, rhyme_tightness, section_completeness, profanity_score}, thresholds: {min_total, max_profanity}}"
    )

    # Conflict matrix for tag validation
    conflict_matrix = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Tag conflict matrix: {tag: [conflicting_tags]} for validation"
    )

    # Tag categories and lexicon
    tag_categories = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Tag categories: {Era, Genre, Energy, Instrumentation, Rhythm, Mix, Vocal, Section}"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional blueprint metadata (description, author, references)"
    )

    # Relationships
    styles = relationship("Style", back_populates="blueprint", lazy="select")
    songs = relationship("Song", back_populates="blueprint", lazy="select")
