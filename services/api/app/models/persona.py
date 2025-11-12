"""Persona entity model for artist/band profiles.

This module defines the Persona SQLAlchemy ORM model that captures artist
identity, vocal characteristics, influences, and creative defaults for
reusable artist profiles across songs.
"""

from sqlalchemy import Column, String, Text, Boolean, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Persona(BaseModel):
    """ORM model for artist/band personas.

    Stores identity (name, bio), vocal characteristics (range, delivery),
    influences, default style/lyrics preferences, and policy settings for
    public release and artist name handling.
    """

    __tablename__ = "personas"
    __table_args__ = (
        Index("ix_personas_name", "name"),
        Index("ix_personas_kind", "kind"),
        Index("ix_personas_tenant_owner", "tenant_id", "owner_id"),
        Index(
            "ix_personas_tenant_name_unique",
            "tenant_id",
            "name",
            unique=True,
            postgresql_where="deleted_at IS NULL"
        ),
    )

    # Identity
    name = Column(
        String(255),
        nullable=False,
        comment="Display name of the persona (artist or band name)"
    )
    kind = Column(
        String(20),
        nullable=False,
        server_default="artist",
        comment="Type: artist (solo) or band (group)"
    )
    bio = Column(
        Text,
        nullable=True,
        comment="Biographical text for marketing or creative backstory"
    )

    # Vocal characteristics
    voice = Column(
        String(500),
        nullable=True,
        comment="Voice description (e.g., airy soprano, gritty baritone)"
    )
    vocal_range = Column(
        String(100),
        nullable=True,
        comment="Range classification (soprano, mezzo-soprano, baritone, etc.)"
    )
    delivery = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Delivery styles (crooning, belting, rap, whispered, etc.)"
    )

    # Influences and style
    influences = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Artist/genre influences (sanitized for public release if needed)"
    )

    # Default creative preferences
    style_defaults = Column(
        JSONB,
        nullable=True,
        comment="Default style spec to bias new songs (genre, tempo, mood, tags)"
    )
    lyrics_defaults = Column(
        JSONB,
        nullable=True,
        comment="Default lyrics spec (section_order, rhyme_scheme, hook_strategy)"
    )

    # Policy settings
    policy = Column(
        JSONB,
        nullable=False,
        server_default='{"public_release": false, "disallow_named_style_of": true}',
        comment="Policy: {public_release, disallow_named_style_of}"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional persona metadata (avatar_url, social_links, etc.)"
    )

    # Relationships
    songs = relationship("Song", back_populates="persona", lazy="select")
