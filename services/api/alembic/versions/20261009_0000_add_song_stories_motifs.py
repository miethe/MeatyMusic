"""Add story, motif, and idempotency tables."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20261009_0000"
down_revision = "add_user_role_001"
branch_labels = None
depends_on = None

json_type = sa.JSON().with_variant(JSONB, "postgresql")


def base_columns():
    """Return shared timestamp, tenancy, and identity columns."""
    return [
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("generate_uuid_v7()"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("tenant_id", UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
    ]


def upgrade():
    """Create only the new story-related tables and indexes."""
    op.create_table(
        "song_stories",
        *base_columns(),
        sa.Column(
            "song_id", UUID(as_uuid=True), sa.ForeignKey("songs.id"), nullable=False
        ),
        sa.Column("take_id", UUID(as_uuid=True), sa.ForeignKey("workflow_runs.id")),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("body_text", sa.Text(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("extra_metadata", json_type, nullable=False, server_default="{}"),
    )
    op.create_index("ix_song_stories_song_id", "song_stories", ["song_id"])
    op.create_table(
        "song_motifs",
        *base_columns(),
        sa.Column(
            "story_id",
            UUID(as_uuid=True),
            sa.ForeignKey("song_stories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "song_id", UUID(as_uuid=True), sa.ForeignKey("songs.id"), nullable=False
        ),
        sa.Column("take_id", UUID(as_uuid=True), sa.ForeignKey("workflow_runs.id")),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("anchor", json_type),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index("ix_song_motifs_story_id", "song_motifs", ["story_id"])
    op.create_index("ix_song_motifs_song_id", "song_motifs", ["song_id"])
    op.create_table(
        "idempotency_records",
        *base_columns(),
        sa.Column("scope", sa.String(500), nullable=False),
        sa.Column("key", sa.String(200), nullable=False),
        sa.Column("request_hash", sa.String(64), nullable=False),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("response_body", json_type, nullable=False),
        sa.UniqueConstraint(
            "tenant_id", "owner_id", "key", name="uq_idempotency_owner_key"
        ),
    )


def downgrade():
    """Drop the added tables in dependency order."""
    op.drop_table("idempotency_records")
    op.drop_index("ix_song_motifs_song_id", table_name="song_motifs")
    op.drop_index("ix_song_motifs_story_id", table_name="song_motifs")
    op.drop_table("song_motifs")
    op.drop_index("ix_song_stories_song_id", table_name="song_stories")
    op.drop_table("song_stories")
