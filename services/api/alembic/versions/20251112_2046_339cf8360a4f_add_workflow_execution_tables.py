"""add workflow execution tables

Revision ID: 339cf8360a4f
Revises: 3ee6b70e3330
Create Date: 2025-11-12 20:46:11.008132

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = '339cf8360a4f'
down_revision = '3ee6b70e3330'
branch_labels = None
depends_on = None


def upgrade():
    # Create node_executions table
    op.create_table(
        'node_executions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=True),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=True),

        # Foreign key to workflow_runs
        sa.Column('run_id', UUID(as_uuid=True), sa.ForeignKey('workflow_runs.run_id', ondelete='CASCADE'), nullable=False),

        # Node execution details
        sa.Column('execution_id', UUID(as_uuid=True), unique=True, nullable=False, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier for this node execution'),
        sa.Column('node_name', sa.String(50), nullable=False, comment='Node name (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, RENDER, REVIEW)'),
        sa.Column('node_index', sa.Integer, nullable=False, comment='Sequential node index for seed propagation (0-based)'),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending', comment='Execution status (pending, running, completed, failed, skipped)'),

        # Input/output tracking with hashing
        sa.Column('inputs', JSONB, nullable=False, server_default='{}', comment='Node inputs (artifacts from previous nodes)'),
        sa.Column('outputs', JSONB, nullable=False, server_default='{}', comment='Node outputs (generated artifacts, scores, citations)'),
        sa.Column('input_hash', sa.String(64), nullable=True, comment='SHA256 hash of inputs for determinism validation'),
        sa.Column('output_hash', sa.String(64), nullable=True, comment='SHA256 hash of outputs for determinism validation'),

        # Determinism tracking
        sa.Column('seed', sa.Integer, nullable=False, comment='Node-specific seed (run_seed + node_index)'),
        sa.Column('model_params', JSONB, nullable=True, comment='LLM parameters: {temperature, top_p, max_tokens, model}'),

        # Performance tracking
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when node execution started'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when node execution completed'),
        sa.Column('duration_ms', sa.Integer, nullable=True, comment='Execution duration in milliseconds'),

        # Error tracking
        sa.Column('error', JSONB, nullable=True, comment='Error details if execution failed: {message, code, stack_trace}'),

        # Additional metadata
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}', comment='Additional execution metadata'),

        sa.CheckConstraint('node_index >= 0', name='check_node_executions_node_index_positive'),
        sa.CheckConstraint('duration_ms >= 0', name='check_node_executions_duration_positive'),
        sa.CheckConstraint(
            "status IN ('pending', 'running', 'completed', 'failed', 'skipped')",
            name='check_node_executions_status_valid'
        ),
    )

    # Create indexes for node_executions
    op.create_index('ix_node_executions_run_id', 'node_executions', ['run_id'])
    op.create_index('ix_node_executions_execution_id', 'node_executions', ['execution_id'], unique=True)
    op.create_index('ix_node_executions_status', 'node_executions', ['status'])
    op.create_index('ix_node_executions_node_name', 'node_executions', ['node_name'])
    op.create_index('ix_node_executions_tenant_owner', 'node_executions', ['tenant_id', 'owner_id'])
    op.create_index('ix_node_executions_started_at', 'node_executions', ['started_at'])

    # Create workflow_events table
    op.create_table(
        'workflow_events',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', UUID(as_uuid=True), nullable=True),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=True),

        # Foreign key to workflow_runs
        sa.Column('run_id', UUID(as_uuid=True), sa.ForeignKey('workflow_runs.run_id', ondelete='CASCADE'), nullable=False),

        # Event details
        sa.Column('event_id', UUID(as_uuid=True), unique=True, nullable=False, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier for this event'),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()'), comment='Event timestamp'),
        sa.Column('node_name', sa.String(50), nullable=True, comment='Node name that emitted the event'),
        sa.Column('phase', sa.String(20), nullable=False, comment='Event phase (start, end, fail, info)'),

        # Event payload
        sa.Column('metrics', JSONB, nullable=False, server_default='{}', comment='Event metrics: {duration_ms, scores, token_count, etc.}'),
        sa.Column('issues', JSONB, nullable=False, server_default='[]', comment='Array of issues/warnings: [{severity, message, code}]'),
        sa.Column('event_data', JSONB, nullable=False, server_default='{}', comment='Additional event data'),

        # Additional metadata
        sa.Column('extra_metadata', JSONB, nullable=False, server_default='{}', comment='Additional event metadata'),

        sa.CheckConstraint(
            "phase IN ('start', 'end', 'fail', 'info')",
            name='check_workflow_events_phase_valid'
        ),
    )

    # Create indexes for workflow_events
    op.create_index('ix_workflow_events_run_id', 'workflow_events', ['run_id'])
    op.create_index('ix_workflow_events_event_id', 'workflow_events', ['event_id'], unique=True)
    op.create_index('ix_workflow_events_timestamp', 'workflow_events', ['timestamp'])
    op.create_index('ix_workflow_events_phase', 'workflow_events', ['phase'])
    op.create_index('ix_workflow_events_node_name', 'workflow_events', ['node_name'])
    op.create_index('ix_workflow_events_tenant_owner', 'workflow_events', ['tenant_id', 'owner_id'])

    # Add manifest column to workflow_runs (stores the run manifest JSON)
    op.add_column('workflow_runs', sa.Column('manifest', JSONB, nullable=True, comment='Run manifest: {graph, flags, seed}'))
    op.add_column('workflow_runs', sa.Column('seed', sa.Integer, nullable=True, comment='Global run seed for determinism'))


def downgrade():
    # Remove added columns from workflow_runs
    op.drop_column('workflow_runs', 'seed')
    op.drop_column('workflow_runs', 'manifest')

    # Drop workflow_events table
    op.drop_index('ix_workflow_events_tenant_owner', table_name='workflow_events')
    op.drop_index('ix_workflow_events_node_name', table_name='workflow_events')
    op.drop_index('ix_workflow_events_phase', table_name='workflow_events')
    op.drop_index('ix_workflow_events_timestamp', table_name='workflow_events')
    op.drop_index('ix_workflow_events_event_id', table_name='workflow_events')
    op.drop_index('ix_workflow_events_run_id', table_name='workflow_events')
    op.drop_table('workflow_events')

    # Drop node_executions table
    op.drop_index('ix_node_executions_started_at', table_name='node_executions')
    op.drop_index('ix_node_executions_tenant_owner', table_name='node_executions')
    op.drop_index('ix_node_executions_node_name', table_name='node_executions')
    op.drop_index('ix_node_executions_status', table_name='node_executions')
    op.drop_index('ix_node_executions_execution_id', table_name='node_executions')
    op.drop_index('ix_node_executions_run_id', table_name='node_executions')
    op.drop_table('node_executions')
