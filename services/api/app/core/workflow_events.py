"""
Workflow Event Emission Framework for AMCS Skills

This module provides standardized event emission for workflow observability.
All workflow skills emit events at key points (start, end, fail) to enable:

- Real-time progress tracking via WebSocket
- Audit trail in database
- Monitoring and alerting
- Debugging and performance analysis

Key Components:
- WorkflowEvent: Dataclass for structured events
- emit_event: Async event emission to DB/WebSocket/logs
- skill_execution: Context manager for automatic event handling
- EventTimer: Helper for measuring execution time

Usage Example:
    from app.core.workflow_events import skill_execution

    def my_skill(run_id: str, input_data: dict) -> dict:
        with skill_execution(run_id=run_id, node_name="LYRICS") as state:
            # Implementation
            result = generate_lyrics(input_data)

            # Populate metrics
            state["metrics"]["lines_generated"] = len(result["lines"])
            state["metrics"]["citations"] = len(result["citations"])

            # Note any issues
            if len(result["lines"]) < 10:
                state["issues"].append("Warning: short lyrics")

            return result
        # END event emitted automatically with metrics and duration

Event Schema:
    {
        "ts": "2025-11-18T12:00:00Z",
        "run_id": "uuid",
        "node": "LYRICS",
        "phase": "end",
        "duration_ms": 1234,
        "metrics": {"lines_generated": 42, "citations": 5},
        "issues": ["Warning: short lyrics"]
    }

Integration Points:
- TODO: Connect to EventPublisher for DB persistence
- TODO: Connect to WebSocket manager for real-time streaming
- Currently logs to structured logger only

See: docs/workflow_events.md for full event specification
"""

from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Generator, List, Literal, Optional

from app.core.logging import get_structured_logger

# Initialize structured logger for workflow events
logger = get_structured_logger(__name__)

# Phase constants for clarity
PHASE_START = "start"
PHASE_END = "end"
PHASE_FAIL = "fail"

# Node constants matching workflow order
NODE_PLAN = "PLAN"
NODE_STYLE = "STYLE"
NODE_LYRICS = "LYRICS"
NODE_PRODUCER = "PRODUCER"
NODE_COMPOSE = "COMPOSE"
NODE_VALIDATE = "VALIDATE"
NODE_FIX = "FIX"
NODE_REVIEW = "REVIEW"

NODE_ORDER = [
    NODE_PLAN,
    NODE_STYLE,
    NODE_LYRICS,
    NODE_PRODUCER,
    NODE_COMPOSE,
    NODE_VALIDATE,
    NODE_FIX,
    NODE_REVIEW,
]


@dataclass
class WorkflowEvent:
    """
    Structured event emitted by workflow skills for observability.

    Events are:
    - Stored in database for audit trail
    - Streamed via WebSocket to frontend
    - Used for monitoring and debugging

    Attributes:
        ts: Event timestamp (UTC)
        run_id: Workflow run identifier
        node: Node name (PLAN, STYLE, LYRICS, ...)
        phase: Event phase (start, end, fail)
        duration_ms: Execution duration in milliseconds
        metrics: Skill-specific metrics (e.g., lines_generated, citations)
        issues: List of warnings or errors encountered

    Example:
        >>> event = WorkflowEvent(
        ...     ts=datetime.utcnow(),
        ...     run_id="uuid",
        ...     node="LYRICS",
        ...     phase="start",
        ...     duration_ms=0,
        ...     metrics={},
        ...     issues=[]
        ... )
        >>> event.to_dict()
        {
            "ts": "2025-11-18T12:00:00.000000",
            "run_id": "uuid",
            "node": "LYRICS",
            "phase": "start",
            "duration_ms": 0,
            "metrics": {},
            "issues": []
        }
    """

    ts: datetime = field(default_factory=datetime.utcnow)
    run_id: str
    node: Literal[
        "PLAN", "STYLE", "LYRICS", "PRODUCER", "COMPOSE", "VALIDATE", "FIX", "REVIEW"
    ]
    phase: Literal["start", "end", "fail"]
    duration_ms: int = 0
    metrics: Dict[str, float] = field(default_factory=dict)
    issues: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dict for JSON serialization.

        Returns:
            Dictionary representation of event with ISO timestamp

        Example:
            >>> event = WorkflowEvent(run_id="uuid", node="LYRICS", phase="end")
            >>> data = event.to_dict()
            >>> "ts" in data and "run_id" in data
            True
        """
        return {
            "ts": self.ts.isoformat(),
            "run_id": self.run_id,
            "node": self.node,
            "phase": self.phase,
            "duration_ms": self.duration_ms,
            "metrics": self.metrics,
            "issues": self.issues,
        }


async def emit_event(event: WorkflowEvent) -> None:
    """
    Emit workflow event to all channels asynchronously.

    Channels:
    - Database (for audit trail)
    - WebSocket (for real-time UI updates)
    - Structured logs (for monitoring)

    Args:
        event: WorkflowEvent to emit

    Example:
        >>> event = WorkflowEvent(run_id="uuid", node="LYRICS", phase="start")
        >>> await emit_event(event)

    Integration Points:
        - TODO: Integrate with EventPublisher or database event log
        - TODO: Integrate with WebSocket broadcast manager
    """
    # 1. Log to structured logger
    logger.info(
        f"workflow_event.{event.node}.{event.phase}",
        extra={
            "run_id": event.run_id,
            "node": event.node,
            "phase": event.phase,
            "duration_ms": event.duration_ms,
            "metrics": event.metrics,
            "issues": event.issues,
        },
    )

    # 2. Store in database (async)
    # TODO: Integrate with EventPublisher or database event log
    # await event_repository.create(event)

    # 3. Broadcast via WebSocket (async)
    # TODO: Integrate with WebSocket broadcast
    # await websocket_manager.broadcast(event.to_dict())

    # For now, just log (integration points marked with TODO)
    pass


def emit_event_sync(event: WorkflowEvent) -> None:
    """
    Synchronous event emission (logs only, no DB/WS).

    Use this in synchronous contexts where async is not available.
    Note: This only logs events and does not persist to DB or broadcast via WebSocket.

    Args:
        event: WorkflowEvent to emit

    Example:
        >>> event = WorkflowEvent(run_id="uuid", node="LYRICS", phase="end")
        >>> emit_event_sync(event)
    """
    logger.info(
        f"workflow_event.{event.node}.{event.phase}",
        extra=event.to_dict(),
    )


@contextmanager
def skill_execution(
    run_id: str, node_name: str, emit_events: bool = True
) -> Generator[Dict[str, Any], None, None]:
    """
    Context manager for skill execution with automatic event emission.

    Emits START event on entry, END/FAIL event on exit.
    Automatically measures duration and captures metrics/issues.

    Args:
        run_id: Workflow run identifier
        node_name: Node name (PLAN, STYLE, LYRICS, ...)
        emit_events: Whether to emit events (default True)

    Yields:
        Shared state dict for storing metrics/issues during execution.
        Keys:
            - "metrics": Dict[str, float] for skill metrics
            - "issues": List[str] for warnings/errors

    Usage:
        >>> with skill_execution(run_id="uuid", node_name="LYRICS") as state:
        ...     # Skill implementation
        ...     state["metrics"]["lines_generated"] = 42
        ...     state["issues"].append("Warning: long line detected")
        ...     # ... do work ...
        ... # END event automatically emitted with metrics and duration

    Example:
        >>> with skill_execution(run_id="uuid", node_name="LYRICS") as state:
        ...     result = generate_lyrics(input_data)
        ...     state["metrics"]["lines"] = len(result["lines"])
        ...     state["metrics"]["citations"] = len(result["citations"])
        ...     if len(result["lines"]) < 10:
        ...         state["issues"].append("Warning: short lyrics")

    Raises:
        Re-raises any exception from skill execution after emitting FAIL event
    """
    # Shared state for metrics/issues
    state: Dict[str, Any] = {"metrics": {}, "issues": []}

    # Emit START event
    start_time = time.time()
    if emit_events:
        start_event = WorkflowEvent(
            run_id=run_id, node=node_name, phase=PHASE_START, duration_ms=0
        )
        emit_event_sync(start_event)

    try:
        yield state

        # Success: emit END event
        end_time = time.time()
        duration_ms = int((end_time - start_time) * 1000)

        if emit_events:
            end_event = WorkflowEvent(
                run_id=run_id,
                node=node_name,
                phase=PHASE_END,
                duration_ms=duration_ms,
                metrics=state.get("metrics", {}),
                issues=state.get("issues", []),
            )
            emit_event_sync(end_event)

    except Exception as e:
        # Failure: emit FAIL event
        end_time = time.time()
        duration_ms = int((end_time - start_time) * 1000)

        if emit_events:
            fail_event = WorkflowEvent(
                run_id=run_id,
                node=node_name,
                phase=PHASE_FAIL,
                duration_ms=duration_ms,
                metrics=state.get("metrics", {}),
                issues=state.get("issues", []) + [str(e)],
            )
            emit_event_sync(fail_event)

        # Re-raise exception
        raise


class EventTimer:
    """
    Helper for measuring skill execution time.

    Provides precise timing for workflow operations with millisecond resolution.

    Attributes:
        start_time: Start timestamp (Unix epoch seconds)
        end_time: End timestamp (Unix epoch seconds)

    Example:
        >>> timer = EventTimer()
        >>> timer.start()
        >>> # ... do work ...
        >>> timer.stop()
        >>> duration = timer.duration_ms()
        >>> assert duration >= 0
    """

    def __init__(self) -> None:
        """Initialize timer with no time recorded."""
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None

    def start(self) -> None:
        """
        Start timing.

        Example:
            >>> timer = EventTimer()
            >>> timer.start()
            >>> assert timer.start_time is not None
        """
        self.start_time = time.time()

    def stop(self) -> None:
        """
        Stop timing.

        Example:
            >>> timer = EventTimer()
            >>> timer.start()
            >>> timer.stop()
            >>> assert timer.end_time is not None
        """
        self.end_time = time.time()

    def duration_ms(self) -> int:
        """
        Get duration in milliseconds.

        Returns:
            Duration in milliseconds, or 0 if not started/stopped

        Example:
            >>> timer = EventTimer()
            >>> timer.start()
            >>> time.sleep(0.1)
            >>> timer.stop()
            >>> duration = timer.duration_ms()
            >>> assert duration >= 100
        """
        if self.start_time is None or self.end_time is None:
            return 0
        return int((self.end_time - self.start_time) * 1000)

    def reset(self) -> None:
        """
        Reset timer to initial state.

        Example:
            >>> timer = EventTimer()
            >>> timer.start()
            >>> timer.stop()
            >>> timer.reset()
            >>> assert timer.start_time is None
            >>> assert timer.end_time is None
        """
        self.start_time = None
        self.end_time = None
