"""Database models for song stories, motifs, and mutation idempotency."""

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import BaseModel

json_type = JSON().with_variant(JSONB, "postgresql")


class SongStory(BaseModel):
    """A written story associated with a song and optionally a take."""

    __tablename__ = "song_stories"

    song_id = Column(ForeignKey("songs.id"), nullable=False, index=True)
    take_id = Column(ForeignKey("workflow_runs.id"), nullable=True)
    title = Column(String(500), nullable=False)
    body_text = Column(Text, nullable=False)
    revision = Column(Integer, nullable=False, default=1, server_default="1")
    extra_metadata = Column(
        json_type, nullable=False, default=dict, server_default="{}"
    )


class SongMotif(BaseModel):
    """A named motif belonging to a song story."""

    __tablename__ = "song_motifs"

    story_id = Column(
        ForeignKey("song_stories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    song_id = Column(ForeignKey("songs.id"), nullable=False, index=True)
    take_id = Column(ForeignKey("workflow_runs.id"), nullable=True)
    label = Column(String(200), nullable=False)
    notes = Column(Text, nullable=True)
    anchor = Column(json_type, nullable=True)
    revision = Column(Integer, nullable=False, default=1, server_default="1")


class IdempotencyRecord(BaseModel):
    """Stored response for replay-safe mutation requests."""

    __tablename__ = "idempotency_records"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "owner_id", "key", name="uq_idempotency_owner_key"
        ),
    )

    scope = Column(String(500), nullable=False)
    key = Column(String(200), nullable=False)
    request_hash = Column(String(64), nullable=False)
    response_status = Column(Integer, nullable=False)
    response_body = Column(json_type, nullable=False)
