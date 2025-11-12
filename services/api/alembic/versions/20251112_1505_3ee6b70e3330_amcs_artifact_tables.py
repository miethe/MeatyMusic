"""amcs_artifact_tables

Creates AMCS artifact tables: lyrics, producer_notes, workflow_runs, composed_prompts.
These tables store generated artifacts and workflow execution state.

Revision ID: 3ee6b70e3330
Revises: fa3a03c728a4
Create Date: 2025-11-12 15:05:45.501187

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB


# revision identifiers, used by Alembic.
revision = '3ee6b70e3330'
down_revision = 'fa3a03c728a4'
branch_labels = None
depends_on = None


def upgrade():
    # Create lyrics table
    op.create_table(
        'lyrics',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('song_id', UUID(as_uuid=True), nullable=False),
        sa.Column('sections', JSONB, nullable=False),
        sa.Column('section_order', JSONB, nullable=False),
        sa.Column('language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('pov', sa.String(20), nullable=True),
        sa.Column('tense', sa.String(20), nullable=True),
        sa.Column('rhyme_scheme', sa.String(50), nullable=True),
        sa.Column('meter', sa.String(50), nullable=True),
        sa.Column('syllables_per_line', sa.Integer, nullable=True),
        sa.Column('hook_strategy', sa.String(50), nullable=True),
        sa.Column('repetition_rules', JSONB, nullable=False, server_default='{}'),
        sa.Column('imagery_density', sa.Integer, nullable=True),
        sa.Column('reading_level', sa.Integer, nullable=True),
        sa.Column('themes', JSONB, nullable=False, server_default='[]'),
        sa.Column('constraints', JSONB, nullable=False, server_default='{}'),
        sa.Column('explicit_allowed', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('source_citations', JSONB, nullable=False, server_default='[]'),
        sa.Column('generated_text', JSONB, nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['song_id'], ['songs.id'], name='fk_lyrics_song_id', ondelete='CASCADE'),
        sa.CheckConstraint('syllables_per_line IS NULL OR syllables_per_line > 0', name='check_lyrics_syllables_positive'),
        sa.CheckConstraint('imagery_density IS NULL OR (imagery_density >= 0 AND imagery_density <= 10)', name='check_lyrics_imagery_range'),
        sa.CheckConstraint('reading_level IS NULL OR (reading_level >= 0 AND reading_level <= 100)', name='check_lyrics_reading_level_range'),
    )
    op.create_index('ix_lyrics_song_id', 'lyrics', ['song_id'])
    op.create_index('ix_lyrics_tenant_owner', 'lyrics', ['tenant_id', 'owner_id'])

    # Create producer_notes table
    op.create_table(
        'producer_notes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('song_id', UUID(as_uuid=True), nullable=False),
        sa.Column('structure', JSONB, nullable=False),
        sa.Column('structure_string', sa.String(500), nullable=True),
        sa.Column('hook_count', sa.Integer, nullable=True),
        sa.Column('section_tags', JSONB, nullable=False, server_default='{}'),
        sa.Column('section_durations', JSONB, nullable=False, server_default='{}'),
        sa.Column('instrumentation_hints', JSONB, nullable=False, server_default='{}'),
        sa.Column('mix_targets', JSONB, nullable=False, server_default='{}'),
        sa.Column('arrangement_notes', sa.Text, nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['song_id'], ['songs.id'], name='fk_producer_notes_song_id', ondelete='CASCADE'),
        sa.CheckConstraint('hook_count IS NULL OR hook_count >= 0', name='check_producer_notes_hook_count_positive'),
    )
    op.create_index('ix_producer_notes_song_id', 'producer_notes', ['song_id'])
    op.create_index('ix_producer_notes_tenant_owner', 'producer_notes', ['tenant_id', 'owner_id'])

    # Create workflow_runs table
    op.create_table(
        'workflow_runs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('song_id', UUID(as_uuid=True), nullable=False),
        sa.Column('run_id', UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='running'),
        sa.Column('current_node', sa.String(50), nullable=True),
        sa.Column('node_outputs', JSONB, nullable=False, server_default='{}'),
        sa.Column('event_stream', JSONB, nullable=False, server_default='[]'),
        sa.Column('validation_scores', JSONB, nullable=True),
        sa.Column('fix_iterations', sa.Integer, nullable=False, server_default='0'),
        sa.Column('error', JSONB, nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['song_id'], ['songs.id'], name='fk_workflow_runs_song_id', ondelete='CASCADE'),
        sa.CheckConstraint('fix_iterations >= 0 AND fix_iterations <= 3', name='check_workflow_runs_fix_iterations_range'),
    )
    op.create_index('ix_workflow_runs_song_id', 'workflow_runs', ['song_id'])
    op.create_index('ix_workflow_runs_run_id', 'workflow_runs', ['run_id'], unique=True)
    op.create_index('ix_workflow_runs_status', 'workflow_runs', ['status'])
    op.create_index('ix_workflow_runs_tenant_owner', 'workflow_runs', ['tenant_id', 'owner_id'])
    op.create_index('ix_workflow_runs_created_at', 'workflow_runs', ['created_at'])

    # Create composed_prompts table
    op.create_table(
        'composed_prompts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('generate_uuid_v7()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('song_id', UUID(as_uuid=True), nullable=False),
        sa.Column('workflow_run_id', UUID(as_uuid=True), nullable=True),
        sa.Column('text', sa.Text, nullable=False),
        sa.Column('meta', JSONB, nullable=False),
        sa.Column('target_engine', sa.String(50), nullable=True),
        sa.Column('target_model', sa.String(100), nullable=True),
        sa.Column('style_char_count', JSONB, nullable=True),
        sa.Column('total_char_count', JSONB, nullable=True),
        sa.Column('validation_status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('validation_errors', JSONB, nullable=True),
        sa.Column('content_hash', sa.String(64), nullable=True),
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['song_id'], ['songs.id'], name='fk_composed_prompts_song_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workflow_run_id'], ['workflow_runs.id'], name='fk_composed_prompts_workflow_run_id', ondelete='CASCADE'),
        sa.CheckConstraint('char_length(text) <= 10000', name='check_composed_prompts_text_length'),
    )
    op.create_index('ix_composed_prompts_song_id', 'composed_prompts', ['song_id'])
    op.create_index('ix_composed_prompts_workflow_run_id', 'composed_prompts', ['workflow_run_id'])
    op.create_index('ix_composed_prompts_tenant_owner', 'composed_prompts', ['tenant_id', 'owner_id'])


def downgrade():
    op.drop_table('composed_prompts')
    op.drop_table('workflow_runs')
    op.drop_table('producer_notes')
    op.drop_table('lyrics')
