"""Workflow execution models for node tracking and event logging.

This module defines ORM models for workflow execution state including
node executions and workflow events for observability and debugging.
"""

from sqlalchemy import Column, String, Integer, Index, ForeignKey, CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID as SA_UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class NodeExecution(BaseModel):
    """ORM model for individual workflow node executions.

    Tracks execution state, inputs/outputs, determinism hashes, and
    performance metrics for each node in the workflow graph.
    """

    __tablename__ = "node_executions"
    __table_args__ = (
        Index("ix_node_executions_run_id", "run_id"),
        Index("ix_node_executions_execution_id", "execution_id", unique=True),
        Index("ix_node_executions_status", "status"),
        Index("ix_node_executions_node_name", "node_name"),
        Index("ix_node_executions_tenant_owner", "tenant_id", "owner_id"),
        Index("ix_node_executions_started_at", "started_at"),
        CheckConstraint(
            "node_index >= 0",
            name="check_node_executions_node_index_positive"
        ),
        CheckConstraint(
            "duration_ms >= 0",
            name="check_node_executions_duration_positive"
        ),
        CheckConstraint(
            "status IN ('pending', 'running', 'completed', 'failed', 'skipped')",
            name="check_node_executions_status_valid"
        ),
    )

    # Foreign key to workflow_runs
    run_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("workflow_runs.run_id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to parent workflow run"
    )

    # Node execution details
    execution_id = Column(
        SA_UUID(as_uuid=True),
        unique=True,
        nullable=False,
        comment="Unique identifier for this node execution"
    )
    node_name = Column(
        String(50),
        nullable=False,
        comment="Node name (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, RENDER, REVIEW)"
    )
    node_index = Column(
        Integer,
        nullable=False,
        comment="Sequential node index for seed propagation (0-based)"
    )
    status = Column(
        String(50),
        nullable=False,
        server_default="pending",
        comment="Execution status (pending, running, completed, failed, skipped)"
    )

    # Input/output tracking with hashing
    inputs = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Node inputs (artifacts from previous nodes)"
    )
    outputs = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Node outputs (generated artifacts, scores, citations)"
    )
    input_hash = Column(
        String(64),
        nullable=True,
        comment="SHA256 hash of inputs for determinism validation"
    )
    output_hash = Column(
        String(64),
        nullable=True,
        comment="SHA256 hash of outputs for determinism validation"
    )

    # Determinism tracking
    seed = Column(
        Integer,
        nullable=False,
        comment="Node-specific seed (run_seed + node_index)"
    )
    model_params = Column(
        JSONB,
        nullable=True,
        comment="LLM parameters: {temperature, top_p, max_tokens, model}"
    )

    # Performance tracking
    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when node execution started"
    )
    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when node execution completed"
    )
    duration_ms = Column(
        Integer,
        nullable=True,
        comment="Execution duration in milliseconds"
    )

    # Error tracking
    error = Column(
        JSONB,
        nullable=True,
        comment="Error details if execution failed: {message, code, stack_trace}"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional execution metadata"
    )


class WorkflowEvent(BaseModel):
    """ORM model for workflow events and observability.

    Stores structured events emitted during workflow execution for
    real-time monitoring, debugging, and historical analysis.
    """

    __tablename__ = "workflow_events"
    __table_args__ = (
        Index("ix_workflow_events_run_id", "run_id"),
        Index("ix_workflow_events_event_id", "event_id", unique=True),
        Index("ix_workflow_events_timestamp", "timestamp"),
        Index("ix_workflow_events_phase", "phase"),
        Index("ix_workflow_events_node_name", "node_name"),
        Index("ix_workflow_events_tenant_owner", "tenant_id", "owner_id"),
        CheckConstraint(
            "phase IN ('start', 'end', 'fail', 'info')",
            name="check_workflow_events_phase_valid"
        ),
    )

    # Foreign key to workflow_runs
    run_id = Column(
        SA_UUID(as_uuid=True),
        ForeignKey("workflow_runs.run_id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to parent workflow run"
    )

    # Event details
    event_id = Column(
        SA_UUID(as_uuid=True),
        unique=True,
        nullable=False,
        comment="Unique identifier for this event"
    )
    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        comment="Event timestamp"
    )
    node_name = Column(
        String(50),
        nullable=True,
        comment="Node name that emitted the event"
    )
    phase = Column(
        String(20),
        nullable=False,
        comment="Event phase (start, end, fail, info)"
    )

    # Event payload
    metrics = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Event metrics: {duration_ms, scores, token_count, etc.}"
    )
    issues = Column(
        JSONB,
        nullable=False,
        server_default="[]",
        comment="Array of issues/warnings: [{severity, message, code}]"
    )
    event_data = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional event data"
    )

    # Additional metadata
    extra_metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional event metadata"
    )
