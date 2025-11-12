"""Lyrics entity model for song lyrics with structural constraints.

This module defines the Lyrics SQLAlchemy ORM model that captures sections,
rhyme schemes, meter, and source citations for deterministic lyric generation.
"""

from sqlalchemy import Column, String, Integer, Boolean, Index, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Lyrics(BaseModel):
    """ORM model for lyrics specifications.

    Stores structural constraints (sections, rhyme scheme, meter),
    stylistic rules (POV, tense, hook strategy), and source citations
    for retrieval-augmented generation with full traceability.
    """

    __tablename__ = "lyrics"
    __table_args__ = (
        Index("ix_lyrics_song_id", "song_id"),
        Index("ix_lyrics_tenant_owner", "tenant_id", "owner_id"),
        CheckConstraint(
            "syllables_per_line IS NULL OR syllables_per_line > 0",
            name="check_lyrics_syllables_positive"
        ),
        CheckConstraint(
            "imagery_density IS NULL OR (imagery_density >= 0 AND imagery_density <= 10)",
            name="check_lyrics_imagery_range"
        ),
        CheckConstraint(
            "reading_level IS NULL OR (reading_level >= 0 AND reading_level <= 100)",
            name="check_lyrics_reading_level_range"
        ),
    )

    # Song association
    song_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("songs.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to the parent song"
    )

    # Structural sections
    sections = Column(
        JSONB,
        nullable=False,
        comment="Array of section objects: [{type, lines, rhyme_scheme, tags}]"
    )
    section_order = Column(
        JSONB,
        nullable=False,
        comment="Ordered list of section types (e.g., [Verse, Chorus, Bridge])"
    )

    # Language and voice
    language = Column(
        String(10),
        nullable=False,
        server_default="en",
        comment="Language code (ISO 639-1, e.g., en, es, fr)"
    )
    pov = Column(
        String(20),
        nullable=True,
        comment="Point of view (first-person, third-person, second-person)"
    )
    tense = Column(
        String(20),
        nullable=True,
        comment="Verb tense (past, present, future)"
    )

    # Rhyme and meter
    rhyme_scheme = Column(
        String(50),
        nullable=True,
        comment="Default rhyme scheme (e.g., AABB, ABAB, ABCB)"
    )
    meter = Column(
        String(50),
        nullable=True,
        comment="Metrical pattern (e.g., 4/4 pop, iambic pentameter)"
    )
    syllables_per_line = Column(
        Integer,
        nullable=True,
        comment="Target syllables per line for consistency"
    )

    # Hook and repetition strategy
    hook_strategy = Column(
        String(50),
        nullable=True,
        comment="Hook approach (chant, lyrical, melodic, call-and-response)"
    )
    repetition_rules = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Repetition policy: {hook_count, allow_verbatim, max_repeat}"
    )

    # Imagery and complexity
    imagery_density = Column(
        Integer,
        nullable=True,
        comment="Imagery richness on scale of 1-10"
    )
    reading_level = Column(
        Integer,
        nullable=True,
        comment="Flesch-Kincaid reading level score (0-100)"
    )

    # Themes and constraints
    themes = Column(
        JSONB,
        nullable=False,
        server_default="[]",
        comment="Array of thematic elements (e.g., holiday hustle, family)"
    )
    constraints = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Constraints: {explicit, max_lines, section_requirements}"
    )
    explicit_allowed = Column(
        Boolean,
        nullable=False,
        server_default="false",
        comment="Whether explicit content is permitted"
    )

    # Source citations for deterministic retrieval
    source_citations = Column(
        JSONB,
        nullable=False,
        server_default="[]",
        comment="Array of citations: [{source_id, chunk_hash, weight, scope}]"
    )

    # Generated content (populated by LYRICS node)
    generated_text = Column(
        JSONB,
        nullable=True,
        comment="Generated lyrics organized by section with metadata"
    )

    # Additional metadata
    metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional lyrics metadata and custom fields"
    )

    # Relationships
    song = relationship("Song", back_populates="lyrics", lazy="select")
