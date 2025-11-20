"""add_user_role_field

Adds role field to users table for role-based access control (RBAC).
Users can be either 'user' (default) or 'admin'.

Revision ID: add_user_role_001
Revises: 9d8fe482572c
Create Date: 2025-11-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_role_001'
down_revision = '9d8fe482572c'
branch_labels = None
depends_on = None


def upgrade():
    """Add role column to users table."""

    # Add role column with default value 'user'
    op.add_column(
        'users',
        sa.Column(
            'role',
            sa.String(length=20),
            nullable=False,
            server_default='user'
        )
    )

    # Create index on role for efficient role-based queries
    op.create_index(
        'ix_users_role',
        'users',
        ['role']
    )


def downgrade():
    """Remove role column from users table."""

    # Drop index first
    op.drop_index('ix_users_role', 'users')

    # Drop role column
    op.drop_column('users', 'role')
