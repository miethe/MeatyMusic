"""amcs_core_tables

Creates AMCS core entity tables: blueprints, personas, sources, styles, songs.
These tables form the foundation for music composition workflows.

Revision ID: fa3a03c728a4
Revises: 270ea5bb498b
Create Date: 2025-11-12 15:04:56.800573

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB


# revision identifiers, used by Alembic.
revision = 'fa3a03c728a4'
down_revision = '270ea5bb498b'
branch_labels = None
depends_on = None


def upgrade():
    # Create blueprints table
    op.create_table(
        'blueprints',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('genre', sa.String(100), nullable=False),
        sa.Column('version', sa.String(20), nullable=False),
        sa.Column('rules', JSONB, nullable=False),
        sa.Column('eval_rubric', JSONB, nullable=False),
        sa.Column('conflict_matrix', JSONB, nullable=False, server_default='{}'),
        sa.Column('tag_categories', JSONB, nullable=False, server_default='{}'),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
    )
    op.create_index('ix_blueprints_genre', 'blueprints', ['genre'])
    op.create_index('ix_blueprints_version', 'blueprints', ['version'])
    op.create_index('ix_blueprints_tenant_owner', 'blueprints', ['tenant_id', 'owner_id'])
    op.create_index(
        'ix_blueprints_genre_version_unique',
        'blueprints',
        ['genre', 'version'],
        unique=True,
        postgresql_where=sa.text('deleted_at IS NULL')
    )

    # Create personas table
    op.create_table(
        'personas',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('kind', sa.String(20), nullable=False, server_default='artist'),
        sa.Column('bio', sa.Text, nullable=True),
        sa.Column('voice', sa.String(500), nullable=True),
        sa.Column('vocal_range', sa.String(100), nullable=True),
        sa.Column('delivery', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('influences', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('style_defaults', JSONB, nullable=True),
        sa.Column('lyrics_defaults', JSONB, nullable=True),
        sa.Column('policy', JSONB, nullable=False, server_default='{"public_release": false, "disallow_named_style_of": true}'),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
    )
    op.create_index('ix_personas_name', 'personas', ['name'])
    op.create_index('ix_personas_kind', 'personas', ['kind'])
    op.create_index('ix_personas_tenant_owner', 'personas', ['tenant_id', 'owner_id'])
    op.create_index(
        'ix_personas_tenant_name_unique',
        'personas',
        ['tenant_id', 'name'],
        unique=True,
        postgresql_where=sa.text('deleted_at IS NULL')
    )

    # Create sources table
    op.create_table(
        'sources',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('kind', sa.String(20), nullable=False),
        sa.Column('config', JSONB, nullable=False, server_default='{}'),
        sa.Column('scopes', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('allow', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('deny', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('weight', sa.Numeric(3, 2), nullable=False, server_default='0.5'),
        sa.Column('provenance', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('mcp_server_id', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('last_validated_at', JSONB, nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.CheckConstraint('weight >= 0.0 AND weight <= 1.0', name='check_sources_weight_range'),
    )
    op.create_index('ix_sources_name', 'sources', ['name'])
    op.create_index('ix_sources_kind', 'sources', ['kind'])
    op.create_index('ix_sources_mcp_server_id', 'sources', ['mcp_server_id'])
    op.create_index('ix_sources_tenant_owner', 'sources', ['tenant_id', 'owner_id'])
    op.create_index(
        'ix_sources_tenant_name_unique',
        'sources',
        ['tenant_id', 'name'],
        unique=True,
        postgresql_where=sa.text('deleted_at IS NULL')
    )

    # Create styles table
    op.create_table(
        'styles',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('genre', sa.String(100), nullable=False),
        sa.Column('sub_genres', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('bpm_min', sa.Integer, nullable=True),
        sa.Column('bpm_max', sa.Integer, nullable=True),
        sa.Column('key', sa.String(20), nullable=True),
        sa.Column('modulations', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('mood', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('energy_level', sa.Integer, nullable=True),
        sa.Column('instrumentation', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('vocal_profile', JSONB, nullable=False, server_default='{}'),
        sa.Column('tags_positive', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('tags_negative', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('blueprint_id', UUID(as_uuid=True), nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['blueprint_id'], ['blueprints.id'], name='fk_styles_blueprint_id', ondelete='SET NULL'),
        sa.CheckConstraint('bpm_min IS NULL OR bpm_max IS NULL OR bpm_min <= bpm_max', name='check_styles_bpm_range'),
        sa.CheckConstraint('energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 10)', name='check_styles_energy_range'),
    )
    op.create_index('ix_styles_genre', 'styles', ['genre'])
    op.create_index('ix_styles_tenant_owner', 'styles', ['tenant_id', 'owner_id'])
    op.create_index('ix_styles_name', 'styles', ['name'])

    # Create songs table
    op.create_table(
        'songs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('sds_version', sa.String(20), nullable=False, server_default='1.0.0'),
        sa.Column('global_seed', sa.Integer, nullable=False),
        sa.Column('style_id', UUID(as_uuid=True), nullable=True),
        sa.Column('persona_id', UUID(as_uuid=True), nullable=True),
        sa.Column('blueprint_id', UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('feature_flags', JSONB, nullable=False, server_default='{}'),
        sa.Column('render_config', JSONB, nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['style_id'], ['styles.id'], name='fk_songs_style_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['persona_id'], ['personas.id'], name='fk_songs_persona_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['blueprint_id'], ['blueprints.id'], name='fk_songs_blueprint_id', ondelete='SET NULL'),
        sa.CheckConstraint('global_seed >= 0', name='check_songs_global_seed_positive'),
    )
    op.create_index('ix_songs_status', 'songs', ['status'])
    op.create_index('ix_songs_tenant_owner', 'songs', ['tenant_id', 'owner_id'])
    op.create_index('ix_songs_title', 'songs', ['title'])
    op.create_index('ix_songs_created_at', 'songs', ['created_at'])


def downgrade():
    op.drop_table('songs')
    op.drop_table('styles')
    op.drop_table('sources')
    op.drop_table('personas')
    op.drop_table('blueprints')
