"""
Unit tests for workflow event emission framework.

Tests cover:
- WorkflowEvent serialization
- skill_execution context manager (success/failure)
- EventTimer accuracy
- Event emission (mocked)
"""

from __future__ import annotations

import time
from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.core.workflow_events import (
    NODE_LYRICS,
    NODE_PLAN,
    NODE_STYLE,
    PHASE_END,
    PHASE_FAIL,
    PHASE_START,
    EventTimer,
    WorkflowEvent,
    emit_event_sync,
    skill_execution,
)


class TestWorkflowEvent:
    """Test WorkflowEvent dataclass and serialization."""

    def test_workflow_event_creation(self) -> None:
        """Test creating WorkflowEvent with required fields."""
        event = WorkflowEvent(
            run_id="test-run-123",
            node=NODE_LYRICS,
            phase=PHASE_START,
        )

        assert event.run_id == "test-run-123"
        assert event.node == NODE_LYRICS
        assert event.phase == PHASE_START
        assert event.duration_ms == 0
        assert event.metrics == {}
        assert event.issues == []
        assert isinstance(event.ts, datetime)

    def test_workflow_event_creation_with_all_fields(self) -> None:
        """Test creating WorkflowEvent with all fields populated."""
        ts = datetime.utcnow()
        metrics = {"lines_generated": 42, "citations": 5}
        issues = ["Warning: short lyrics"]

        event = WorkflowEvent(
            ts=ts,
            run_id="test-run-123",
            node=NODE_LYRICS,
            phase=PHASE_END,
            duration_ms=1234,
            metrics=metrics,
            issues=issues,
        )

        assert event.ts == ts
        assert event.run_id == "test-run-123"
        assert event.node == NODE_LYRICS
        assert event.phase == PHASE_END
        assert event.duration_ms == 1234
        assert event.metrics == metrics
        assert event.issues == issues

    def test_workflow_event_to_dict(self) -> None:
        """Test WorkflowEvent serialization to dict."""
        ts = datetime(2025, 11, 18, 12, 0, 0)
        event = WorkflowEvent(
            ts=ts,
            run_id="test-run-123",
            node=NODE_LYRICS,
            phase=PHASE_END,
            duration_ms=1234,
            metrics={"lines": 42},
            issues=["Warning"],
        )

        result = event.to_dict()

        assert result == {
            "ts": ts.isoformat(),
            "run_id": "test-run-123",
            "node": NODE_LYRICS,
            "phase": PHASE_END,
            "duration_ms": 1234,
            "metrics": {"lines": 42},
            "issues": ["Warning"],
        }

    def test_workflow_event_to_dict_empty_metrics_issues(self) -> None:
        """Test WorkflowEvent serialization with empty metrics and issues."""
        event = WorkflowEvent(
            run_id="test-run-123",
            node=NODE_PLAN,
            phase=PHASE_START,
        )

        result = event.to_dict()

        assert result["metrics"] == {}
        assert result["issues"] == []
        assert result["duration_ms"] == 0

    def test_workflow_event_timestamp_is_iso_format(self) -> None:
        """Test that timestamp is properly serialized to ISO format."""
        event = WorkflowEvent(
            run_id="test-run-123",
            node=NODE_STYLE,
            phase=PHASE_END,
        )

        result = event.to_dict()

        # ISO format should be parseable back to datetime
        parsed_ts = datetime.fromisoformat(result["ts"])
        assert isinstance(parsed_ts, datetime)


class TestEmitEventSync:
    """Test synchronous event emission."""

    @patch("app.core.workflow_events.logger")
    def test_emit_event_sync_logs_event(self, mock_logger: Mock) -> None:
        """Test that emit_event_sync logs the event."""
        event = WorkflowEvent(
            run_id="test-run-123",
            node=NODE_LYRICS,
            phase=PHASE_START,
        )

        emit_event_sync(event)

        # Verify logger.info was called
        mock_logger.info.assert_called_once()

        # Check the log message
        call_args = mock_logger.info.call_args
        assert "workflow_event.LYRICS.start" in call_args[0]

        # Check the extra context
        extra = call_args[1]["extra"]
        assert extra["run_id"] == "test-run-123"
        assert extra["node"] == NODE_LYRICS
        assert extra["phase"] == PHASE_START

    @patch("app.core.workflow_events.logger")
    def test_emit_event_sync_includes_metrics_and_issues(
        self, mock_logger: Mock
    ) -> None:
        """Test that emit_event_sync includes metrics and issues in log."""
        event = WorkflowEvent(
            run_id="test-run-123",
            node=NODE_LYRICS,
            phase=PHASE_END,
            duration_ms=1234,
            metrics={"lines": 42, "citations": 5},
            issues=["Warning: short lyrics"],
        )

        emit_event_sync(event)

        # Check the extra context includes metrics and issues
        call_args = mock_logger.info.call_args
        extra = call_args[1]["extra"]
        assert extra["metrics"] == {"lines": 42, "citations": 5}
        assert extra["issues"] == ["Warning: short lyrics"]
        assert extra["duration_ms"] == 1234


class TestSkillExecution:
    """Test skill_execution context manager."""

    @patch("app.core.workflow_events.logger")
    def test_skill_execution_success(self, mock_logger: Mock) -> None:
        """Test skill_execution emits START and END events on success."""
        with skill_execution(run_id="test-run-123", node_name=NODE_LYRICS) as state:
            state["metrics"]["lines"] = 42
            state["issues"].append("Warning")

        # Should have called logger.info twice: START and END
        assert mock_logger.info.call_count == 2

        # Check START event
        start_call = mock_logger.info.call_args_list[0]
        assert "workflow_event.LYRICS.start" in start_call[0]
        assert start_call[1]["extra"]["phase"] == PHASE_START
        assert start_call[1]["extra"]["duration_ms"] == 0

        # Check END event
        end_call = mock_logger.info.call_args_list[1]
        assert "workflow_event.LYRICS.end" in end_call[0]
        assert end_call[1]["extra"]["phase"] == PHASE_END
        assert end_call[1]["extra"]["duration_ms"] > 0
        assert end_call[1]["extra"]["metrics"] == {"lines": 42}
        assert end_call[1]["extra"]["issues"] == ["Warning"]

    @patch("app.core.workflow_events.logger")
    def test_skill_execution_failure(self, mock_logger: Mock) -> None:
        """Test skill_execution emits START and FAIL events on exception."""
        with pytest.raises(ValueError, match="Test error"):
            with skill_execution(
                run_id="test-run-123", node_name=NODE_LYRICS
            ) as state:
                state["metrics"]["lines"] = 10
                raise ValueError("Test error")

        # Should have called logger.info twice: START and FAIL
        assert mock_logger.info.call_count == 2

        # Check START event
        start_call = mock_logger.info.call_args_list[0]
        assert "workflow_event.LYRICS.start" in start_call[0]
        assert start_call[1]["extra"]["phase"] == PHASE_START

        # Check FAIL event
        fail_call = mock_logger.info.call_args_list[1]
        assert "workflow_event.LYRICS.fail" in fail_call[0]
        assert fail_call[1]["extra"]["phase"] == PHASE_FAIL
        assert fail_call[1]["extra"]["duration_ms"] > 0
        assert fail_call[1]["extra"]["metrics"] == {"lines": 10}
        assert "Test error" in fail_call[1]["extra"]["issues"]

    @patch("app.core.workflow_events.logger")
    def test_skill_execution_captures_duration(self, mock_logger: Mock) -> None:
        """Test that skill_execution accurately measures duration."""
        with skill_execution(run_id="test-run-123", node_name=NODE_LYRICS):
            # Sleep for a small amount to ensure measurable duration
            time.sleep(0.01)

        # Check END event has non-zero duration
        end_call = mock_logger.info.call_args_list[1]
        duration_ms = end_call[1]["extra"]["duration_ms"]
        assert duration_ms >= 10  # At least 10ms

    @patch("app.core.workflow_events.logger")
    def test_skill_execution_no_events(self, mock_logger: Mock) -> None:
        """Test skill_execution with emit_events=False does not emit."""
        with skill_execution(
            run_id="test-run-123", node_name=NODE_LYRICS, emit_events=False
        ) as state:
            state["metrics"]["lines"] = 42

        # Should not have emitted any events
        mock_logger.info.assert_not_called()

    @patch("app.core.workflow_events.logger")
    def test_skill_execution_state_initialization(self, mock_logger: Mock) -> None:
        """Test that state dict is properly initialized."""
        with skill_execution(run_id="test-run-123", node_name=NODE_LYRICS) as state:
            # State should have empty metrics and issues
            assert state["metrics"] == {}
            assert state["issues"] == []

            # Should be mutable
            state["metrics"]["test"] = 123
            state["issues"].append("test issue")

        assert state["metrics"] == {"test": 123}
        assert state["issues"] == ["test issue"]

    @patch("app.core.workflow_events.logger")
    def test_skill_execution_different_nodes(self, mock_logger: Mock) -> None:
        """Test skill_execution with different node names."""
        nodes_to_test = [NODE_PLAN, NODE_STYLE, NODE_LYRICS]

        for node in nodes_to_test:
            mock_logger.reset_mock()

            with skill_execution(run_id="test-run-123", node_name=node):
                pass

            # Check that node name is in log message
            start_call = mock_logger.info.call_args_list[0]
            assert f"workflow_event.{node}.start" in start_call[0]

            end_call = mock_logger.info.call_args_list[1]
            assert f"workflow_event.{node}.end" in end_call[0]


class TestEventTimer:
    """Test EventTimer helper class."""

    def test_event_timer_initialization(self) -> None:
        """Test EventTimer is initialized with None values."""
        timer = EventTimer()

        assert timer.start_time is None
        assert timer.end_time is None
        assert timer.duration_ms() == 0

    def test_event_timer_start(self) -> None:
        """Test starting the timer."""
        timer = EventTimer()
        timer.start()

        assert timer.start_time is not None
        assert isinstance(timer.start_time, float)
        assert timer.end_time is None

    def test_event_timer_stop(self) -> None:
        """Test stopping the timer."""
        timer = EventTimer()
        timer.start()
        timer.stop()

        assert timer.start_time is not None
        assert timer.end_time is not None
        assert timer.end_time >= timer.start_time

    def test_event_timer_duration(self) -> None:
        """Test measuring duration with timer."""
        timer = EventTimer()
        timer.start()
        time.sleep(0.05)  # Sleep for 50ms
        timer.stop()

        duration = timer.duration_ms()
        assert duration >= 50  # Should be at least 50ms
        assert duration < 200  # Should be less than 200ms (generous upper bound)

    def test_event_timer_duration_not_started(self) -> None:
        """Test duration returns 0 if not started."""
        timer = EventTimer()
        assert timer.duration_ms() == 0

    def test_event_timer_duration_not_stopped(self) -> None:
        """Test duration returns 0 if not stopped."""
        timer = EventTimer()
        timer.start()
        assert timer.duration_ms() == 0

    def test_event_timer_reset(self) -> None:
        """Test resetting the timer."""
        timer = EventTimer()
        timer.start()
        time.sleep(0.01)
        timer.stop()

        # Timer should have values
        assert timer.start_time is not None
        assert timer.end_time is not None
        assert timer.duration_ms() > 0

        # Reset
        timer.reset()

        # Should be back to initial state
        assert timer.start_time is None
        assert timer.end_time is None
        assert timer.duration_ms() == 0

    def test_event_timer_multiple_measurements(self) -> None:
        """Test using timer for multiple measurements."""
        timer = EventTimer()

        # First measurement
        timer.start()
        time.sleep(0.01)
        timer.stop()
        duration1 = timer.duration_ms()
        assert duration1 >= 10

        # Reset and second measurement
        timer.reset()
        timer.start()
        time.sleep(0.02)
        timer.stop()
        duration2 = timer.duration_ms()
        assert duration2 >= 20

        # Second measurement should be different
        assert abs(duration1 - duration2) > 5

    def test_event_timer_precision(self) -> None:
        """Test that timer has millisecond precision."""
        timer = EventTimer()
        timer.start()
        time.sleep(0.001)  # 1ms
        timer.stop()

        duration = timer.duration_ms()
        # Should be at least 1ms, but allow some variance
        assert duration >= 1
        assert isinstance(duration, int)


class TestWorkflowConstants:
    """Test workflow constants are properly defined."""

    def test_phase_constants(self) -> None:
        """Test phase constants are defined."""
        assert PHASE_START == "start"
        assert PHASE_END == "end"
        assert PHASE_FAIL == "fail"

    def test_node_constants(self) -> None:
        """Test node constants are defined."""
        from app.core.workflow_events import (
            NODE_COMPOSE,
            NODE_FIX,
            NODE_ORDER,
            NODE_PRODUCER,
            NODE_REVIEW,
            NODE_VALIDATE,
        )

        assert NODE_PLAN == "PLAN"
        assert NODE_STYLE == "STYLE"
        assert NODE_LYRICS == "LYRICS"
        assert NODE_PRODUCER == "PRODUCER"
        assert NODE_COMPOSE == "COMPOSE"
        assert NODE_VALIDATE == "VALIDATE"
        assert NODE_FIX == "FIX"
        assert NODE_REVIEW == "REVIEW"

    def test_node_order(self) -> None:
        """Test NODE_ORDER contains all nodes in correct sequence."""
        from app.core.workflow_events import (
            NODE_COMPOSE,
            NODE_FIX,
            NODE_ORDER,
            NODE_PRODUCER,
            NODE_REVIEW,
            NODE_VALIDATE,
        )

        expected_order = [
            NODE_PLAN,
            NODE_STYLE,
            NODE_LYRICS,
            NODE_PRODUCER,
            NODE_COMPOSE,
            NODE_VALIDATE,
            NODE_FIX,
            NODE_REVIEW,
        ]

        assert NODE_ORDER == expected_order
        assert len(NODE_ORDER) == 8


class TestIntegrationExample:
    """Integration tests showing real-world usage patterns."""

    @patch("app.core.workflow_events.logger")
    def test_realistic_skill_execution(self, mock_logger: Mock) -> None:
        """Test realistic skill execution with metrics and issues."""

        def generate_lyrics(run_id: str, input_data: dict) -> dict:
            """Simulated lyrics generation skill."""
            with skill_execution(run_id=run_id, node_name=NODE_LYRICS) as state:
                # Simulate work
                time.sleep(0.01)

                # Generate result
                result = {
                    "lines": ["Line 1", "Line 2", "Line 3"],
                    "citations": ["source1", "source2"],
                }

                # Populate metrics
                state["metrics"]["lines_generated"] = len(result["lines"])
                state["metrics"]["citations"] = len(result["citations"])

                # Note any issues
                if len(result["lines"]) < 10:
                    state["issues"].append("Warning: short lyrics")

                return result

        # Execute skill
        result = generate_lyrics(
            run_id="test-run-123", input_data={"genre": "pop"}
        )

        # Verify result
        assert result["lines"] == ["Line 1", "Line 2", "Line 3"]
        assert result["citations"] == ["source1", "source2"]

        # Verify events were emitted
        assert mock_logger.info.call_count == 2

        # Check END event contains metrics
        end_call = mock_logger.info.call_args_list[1]
        assert end_call[1]["extra"]["metrics"]["lines_generated"] == 3
        assert end_call[1]["extra"]["metrics"]["citations"] == 2
        assert "Warning: short lyrics" in end_call[1]["extra"]["issues"]

    @patch("app.core.workflow_events.logger")
    def test_skill_with_timer(self, mock_logger: Mock) -> None:
        """Test using EventTimer for sub-task timing."""

        def complex_skill(run_id: str) -> dict:
            """Skill with multiple timed sub-tasks."""
            with skill_execution(run_id=run_id, node_name=NODE_STYLE) as state:
                # Time sub-task 1
                timer1 = EventTimer()
                timer1.start()
                time.sleep(0.01)
                timer1.stop()
                state["metrics"]["subtask1_ms"] = timer1.duration_ms()

                # Time sub-task 2
                timer2 = EventTimer()
                timer2.start()
                time.sleep(0.02)
                timer2.stop()
                state["metrics"]["subtask2_ms"] = timer2.duration_ms()

                return {"status": "complete"}

        # Execute skill
        result = complex_skill(run_id="test-run-123")

        assert result["status"] == "complete"

        # Check metrics include sub-task timings
        end_call = mock_logger.info.call_args_list[1]
        metrics = end_call[1]["extra"]["metrics"]
        assert metrics["subtask1_ms"] >= 10
        assert metrics["subtask2_ms"] >= 20
