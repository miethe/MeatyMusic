"""fix_uuid_column_types

Fix UUID columns that were incorrectly created as VARCHAR(36) instead of UUID type.
This migration converts all ID columns in tenants, users, and user_preferences tables
from String(36) to proper PostgreSQL UUID type.

Revision ID: 47a5cb79a5cb
Revises: 339cf8360a4f
Create Date: 2025-11-17 10:22:33.461402

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = '47a5cb79a5cb'
down_revision = '339cf8360a4f'
branch_labels = None
depends_on = None


def upgrade():
    """Convert VARCHAR(36) UUID columns to proper UUID type."""

    # Step 1: Drop all RLS policies first (they depend on the columns)
    op.execute('DROP POLICY IF EXISTS tenant_isolation_policy ON user_preferences')
    op.execute('DROP POLICY IF EXISTS tenant_isolation_policy ON users')

    # Step 2: Disable RLS on tables
    op.execute('ALTER TABLE users DISABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY')

    # Step 3: Drop foreign key constraints that reference the columns we're changing
    op.drop_constraint('fk_users_tenant_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_user_preferences_user_id', 'user_preferences', type_='foreignkey')

    # Step 4: Convert columns one table at a time
    # Convert tenants.id from VARCHAR(36) to UUID
    op.execute("""
        ALTER TABLE tenants
        ALTER COLUMN id TYPE uuid USING id::uuid
    """)

    # Convert users.id and users.tenant_id from VARCHAR(36) to UUID
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN id TYPE uuid USING id::uuid
    """)

    op.execute("""
        ALTER TABLE users
        ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid
    """)

    # Convert user_preferences.id and user_preferences.user_id from VARCHAR(36) to UUID
    op.execute("""
        ALTER TABLE user_preferences
        ALTER COLUMN id TYPE uuid USING id::uuid
    """)

    op.execute("""
        ALTER TABLE user_preferences
        ALTER COLUMN user_id TYPE uuid USING user_id::uuid
    """)

    # Step 5: Re-add foreign key constraints with proper UUID types
    op.create_foreign_key(
        'fk_users_tenant_id',
        'users', 'tenants',
        ['tenant_id'], ['id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'fk_user_preferences_user_id',
        'user_preferences', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # Step 6: Re-enable RLS
    op.execute('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY')

    # Step 7: Recreate RLS policies with proper UUID casting
    op.execute("""
        CREATE POLICY tenant_isolation_policy ON users
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
    """)

    op.execute("""
        CREATE POLICY tenant_isolation_policy ON user_preferences
        USING (user_id IN (
            SELECT id FROM users
            WHERE tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid
        ))
    """)


def downgrade():
    """Convert UUID columns back to VARCHAR(36)."""

    # Disable RLS policies
    op.execute('ALTER TABLE users DISABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY')

    # Drop RLS policies
    op.execute('DROP POLICY IF EXISTS tenant_isolation_policy ON users')
    op.execute('DROP POLICY IF EXISTS tenant_isolation_policy ON user_preferences')

    # Drop foreign key constraints
    op.drop_constraint('fk_users_tenant_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_user_preferences_user_id', 'user_preferences', type_='foreignkey')

    # Convert back to VARCHAR(36)
    op.execute("""
        ALTER TABLE user_preferences
        ALTER COLUMN id TYPE varchar(36) USING id::text,
        ALTER COLUMN user_id TYPE varchar(36) USING user_id::text
    """)

    op.execute("""
        ALTER TABLE users
        ALTER COLUMN id TYPE varchar(36) USING id::text,
        ALTER COLUMN tenant_id TYPE varchar(36) USING tenant_id::text
    """)

    op.execute("""
        ALTER TABLE tenants
        ALTER COLUMN id TYPE varchar(36) USING id::text
    """)

    # Re-add foreign key constraints
    op.create_foreign_key(
        'fk_users_tenant_id',
        'users', 'tenants',
        ['tenant_id'], ['id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'fk_user_preferences_user_id',
        'user_preferences', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # Re-enable RLS and recreate policies with old string casting
    op.execute('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY')

    op.execute("""
        CREATE POLICY tenant_isolation_policy ON users
        USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE))
    """)

    op.execute("""
        CREATE POLICY tenant_isolation_policy ON user_preferences
        USING (user_id IN (
            SELECT id FROM users
            WHERE tenant_id::text = current_setting('app.current_tenant_id', TRUE)
        ))
    """)
