"""fix_songs_global_seed_bigint

Change songs.global_seed column type from INTEGER to BIGINT to support
the full range of Python random seed values (up to 2^63-1).

The check constraint check_songs_global_seed_positive remains in place
to ensure non-negative values.

Revision ID: 698242fd277f
Revises: 47a5cb79a5cb
Create Date: 2025-11-17 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '698242fd277f'
down_revision = '47a5cb79a5cb'
branch_labels = None
depends_on = None


def upgrade():
    """Convert songs.global_seed from INTEGER to BIGINT."""

    # PostgreSQL allows changing column type directly when the new type
    # can accommodate all existing values. The USING clause is optional
    # but included for clarity and to handle any edge cases.
    op.execute("""
        ALTER TABLE songs
        ALTER COLUMN global_seed TYPE bigint
        USING global_seed::bigint
    """)

    # Note: The check constraint check_songs_global_seed_positive
    # does not need to be recreated as it remains valid with the
    # new column type (global_seed >= 0 works for both int and bigint)


def downgrade():
    """Convert songs.global_seed back from BIGINT to INTEGER.

    WARNING: This downgrade will FAIL if any rows have global_seed values
    that exceed INTEGER range (2^31-1 = 2,147,483,647). In production,
    you should verify data ranges before downgrading.
    """

    # Cast back to INTEGER
    # This will raise an error if values exceed INTEGER max
    op.execute("""
        ALTER TABLE songs
        ALTER COLUMN global_seed TYPE integer
        USING global_seed::integer
    """)
