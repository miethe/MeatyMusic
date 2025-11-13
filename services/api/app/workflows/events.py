"""Event publishing and WebSocket management for workflow observability.

This module implements event publishing with in-memory pub/sub for real-time
WebSocket streaming and database persistence for historical replay.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID, uuid4

import structlog
from fastapi import WebSocket
from sqlalchemy.orm import Session

logger = structlog.get_logger(__name__)


class EventPublisher:
    """Publisher for workflow events with WebSocket streaming and DB persistence.

    Implements an in-memory pub/sub pattern for real-time event distribution
    to WebSocket connections, with database persistence for replay on reconnect.

    Thread-safe for concurrent workflow executions and multiple WebSocket subscribers.
    """

    def __init__(self):
        """Initialize the event publisher."""
        # Map of run_id -> set of WebSocket connections
        self._subscribers: Dict[UUID, Set[WebSocket]] = {}
        # Lock for thread-safe subscriber management
        self._lock = asyncio.Lock()

    async def subscribe(self, run_id: UUID, websocket: WebSocket) -> None:
        """Subscribe a WebSocket connection to events for a specific run.

        Args:
            run_id: Workflow run identifier to subscribe to
            websocket: WebSocket connection to send events to
        """
        async with self._lock:
            if run_id not in self._subscribers:
                self._subscribers[run_id] = set()
            self._subscribers[run_id].add(websocket)

        logger.info(
            "event_subscriber.connected",
            run_id=str(run_id),
            total_subscribers=len(self._subscribers[run_id]),
        )

    async def unsubscribe(self, run_id: UUID, websocket: WebSocket) -> None:
        """Unsubscribe a WebSocket connection from run events.

        Args:
            run_id: Workflow run identifier
            websocket: WebSocket connection to remove
        """
        async with self._lock:
            if run_id in self._subscribers:
                self._subscribers[run_id].discard(websocket)
                if not self._subscribers[run_id]:
                    # Clean up empty subscriber sets
                    del self._subscribers[run_id]

        logger.info(
            "event_subscriber.disconnected",
            run_id=str(run_id),
            remaining_subscribers=len(self._subscribers.get(run_id, set())),
        )

    async def publish_event(
        self,
        run_id: UUID,
        node_name: Optional[str],
        phase: str,
        data: Dict[str, Any],
        db_session: Optional[Session] = None,
    ) -> None:
        """Publish an event to subscribers and persist to database.

        Args:
            run_id: Workflow run identifier
            node_name: Node that emitted the event (None for run-level events)
            phase: Event phase (start, end, fail, info)
            data: Event payload (metrics, issues, duration_ms, etc.)
            db_session: Optional database session for persistence
        """
        event_id = uuid4()
        timestamp = datetime.now(timezone.utc)

        # Construct event payload
        event = {
            "event_id": str(event_id),
            "run_id": str(run_id),
            "timestamp": timestamp.isoformat(),
            "node_name": node_name,
            "phase": phase,
            "metrics": data.get("metrics", {}),
            "issues": data.get("issues", []),
            "data": {
                k: v
                for k, v in data.items()
                if k not in ["metrics", "issues"]
            },
        }

        logger.debug(
            "event.publish",
            event_id=str(event_id),
            run_id=str(run_id),
            node_name=node_name,
            phase=phase,
        )

        # Persist to database if session provided
        if db_session:
            try:
                from app.models.workflow import WorkflowEvent

                workflow_event = WorkflowEvent(
                    event_id=event_id,
                    run_id=run_id,
                    timestamp=timestamp,
                    node_name=node_name,
                    phase=phase,
                    metrics=data.get("metrics", {}),
                    issues=data.get("issues", []),
                    event_data=event["data"],
                )
                db_session.add(workflow_event)
                db_session.flush()

                logger.debug(
                    "event.persisted",
                    event_id=str(event_id),
                    run_id=str(run_id),
                )
            except Exception as e:
                logger.error(
                    "event.persistence_failed",
                    event_id=str(event_id),
                    run_id=str(run_id),
                    error=str(e),
                )
                # Don't fail event publishing if DB persistence fails

        # Broadcast to WebSocket subscribers
        async with self._lock:
            subscribers = self._subscribers.get(run_id, set()).copy()

        if subscribers:
            # Send to all subscribers concurrently
            disconnected = []
            tasks = []

            for ws in subscribers:
                tasks.append(self._send_event(ws, event, disconnected))

            await asyncio.gather(*tasks, return_exceptions=True)

            # Remove disconnected subscribers
            if disconnected:
                async with self._lock:
                    for ws in disconnected:
                        self._subscribers[run_id].discard(ws)

            logger.debug(
                "event.broadcast",
                event_id=str(event_id),
                run_id=str(run_id),
                subscribers=len(subscribers),
                disconnected=len(disconnected),
            )

    async def _send_event(
        self, websocket: WebSocket, event: Dict[str, Any], disconnected: List[WebSocket]
    ) -> None:
        """Send event to a single WebSocket connection.

        Args:
            websocket: WebSocket connection
            event: Event payload to send
            disconnected: List to append to if connection fails
        """
        try:
            await websocket.send_json(event)
        except Exception as e:
            logger.warning(
                "event.send_failed",
                error=str(e),
                error_type=type(e).__name__,
            )
            disconnected.append(websocket)

    async def replay_events(
        self, run_id: UUID, db_session: Session, websocket: WebSocket
    ) -> int:
        """Replay historical events for a run to a WebSocket connection.

        Useful for reconnections or late subscribers.

        Args:
            run_id: Workflow run identifier
            db_session: Database session for event retrieval
            websocket: WebSocket connection to send events to

        Returns:
            Number of events replayed
        """
        try:
            from app.models.workflow import WorkflowEvent

            # Query events for this run, ordered by timestamp
            events = (
                db_session.query(WorkflowEvent)
                .filter(WorkflowEvent.run_id == run_id)
                .order_by(WorkflowEvent.timestamp.asc())
                .all()
            )

            # Send each event to the WebSocket
            for event in events:
                event_payload = {
                    "event_id": str(event.event_id),
                    "run_id": str(event.run_id),
                    "timestamp": event.timestamp.isoformat(),
                    "node_name": event.node_name,
                    "phase": event.phase,
                    "metrics": event.metrics,
                    "issues": event.issues,
                    "data": event.event_data,
                }
                await websocket.send_json(event_payload)

            logger.info(
                "events.replayed",
                run_id=str(run_id),
                event_count=len(events),
            )

            return len(events)

        except Exception as e:
            logger.error(
                "events.replay_failed",
                run_id=str(run_id),
                error=str(e),
            )
            return 0

    def get_subscriber_count(self, run_id: UUID) -> int:
        """Get the number of active subscribers for a run.

        Args:
            run_id: Workflow run identifier

        Returns:
            Number of active WebSocket connections
        """
        return len(self._subscribers.get(run_id, set()))

    async def close_all_connections(self, run_id: UUID) -> None:
        """Close all WebSocket connections for a run.

        Used when a run completes or is cancelled.

        Args:
            run_id: Workflow run identifier
        """
        async with self._lock:
            subscribers = self._subscribers.get(run_id, set()).copy()
            if run_id in self._subscribers:
                del self._subscribers[run_id]

        # Close all connections
        for ws in subscribers:
            try:
                await ws.close()
            except Exception as e:
                logger.warning(
                    "event_subscriber.close_failed",
                    run_id=str(run_id),
                    error=str(e),
                )

        logger.info(
            "event_subscribers.closed",
            run_id=str(run_id),
            closed_count=len(subscribers),
        )


# Global singleton instance
_event_publisher: Optional[EventPublisher] = None


def get_event_publisher() -> EventPublisher:
    """Get the global EventPublisher singleton.

    Returns:
        Global EventPublisher instance
    """
    global _event_publisher
    if _event_publisher is None:
        _event_publisher = EventPublisher()
    return _event_publisher
