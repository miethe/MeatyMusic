"""initial_schema

Creates foundational tables for multi-tenancy and users.
AMCS-specific tables will be added in Phase 3.

Revision ID: 270ea5bb498b
Revises:
Create Date: 2025-11-12 14:03:32.976259

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '270ea5bb498b'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_trial', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('name', name='uq_tenants_name'),
        sa.UniqueConstraint('slug', name='uq_tenants_slug'),
    )
    op.create_index('ix_tenants_name', 'tenants', ['name'])
    op.create_index('ix_tenants_slug', 'tenants', ['slug'])

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('clerk_user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_users_tenant_id', ondelete='CASCADE'),
        sa.UniqueConstraint('clerk_user_id', name='uq_users_clerk_user_id'),
        sa.UniqueConstraint('email', name='uq_users_email'),
        sa.UniqueConstraint('username', name='uq_users_username'),
    )
    op.create_index('ix_users_tenant_id', 'users', ['tenant_id'])
    op.create_index('ix_users_clerk_user_id', 'users', ['clerk_user_id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])

    # Create user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('preferences', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_preferences_user_id', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id'),
    )
    op.create_index('ix_user_preferences_user_id', 'user_preferences', ['user_id'])

    # Enable Row-Level Security (RLS) on tenant-aware tables
    op.execute('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY')

    # Create RLS policy for users (can only see users in their tenant)
    op.execute("""
        CREATE POLICY tenant_isolation_policy ON users
        USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE))
    """)

    # Create RLS policy for user_preferences (via user's tenant)
    op.execute("""
        CREATE POLICY tenant_isolation_policy ON user_preferences
        USING (user_id IN (
            SELECT id FROM users
            WHERE tenant_id::text = current_setting('app.current_tenant_id', TRUE)
        ))
    """)


def downgrade():
    # Drop RLS policies
    op.execute('DROP POLICY IF EXISTS tenant_isolation_policy ON user_preferences')
    op.execute('DROP POLICY IF EXISTS tenant_isolation_policy ON users')

    # Drop tables in reverse order
    op.drop_index('ix_user_preferences_user_id', 'user_preferences')
    op.drop_table('user_preferences')

    op.drop_index('ix_users_username', 'users')
    op.drop_index('ix_users_email', 'users')
    op.drop_index('ix_users_clerk_user_id', 'users')
    op.drop_index('ix_users_tenant_id', 'users')
    op.drop_table('users')

    op.drop_index('ix_tenants_slug', 'tenants')
    op.drop_index('ix_tenants_name', 'tenants')
    op.drop_table('tenants')
