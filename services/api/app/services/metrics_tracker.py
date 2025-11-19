"""Quality Gate Metrics Tracker - AMCS Validation Acceptance Criteria.

This module implements metrics tracking for validation quality gates as defined
in the AMCS project requirements. It tracks key acceptance criteria metrics:

- Rubric Pass Rate: Target ≥95% on test suite
- Reproducibility Rate: Target ≥99% identical outputs across replays
- Policy Violations: Target zero high-severity violations
- Latency: Target P95 ≤60s for Plan→Prompt (excluding external rendering)

The metrics tracker provides:
- Real-time metric collection and aggregation
- Quality gate status evaluation (pass/fail for each gate)
- Percentile calculations for latency metrics
- Historical metric storage for trend analysis
- Structured reporting for dashboards and monitoring

Usage:
    ```python
    tracker = QualityGateMetrics()

    # Track rubric pass rate
    tracker.track_rubric_pass_rate(passed=True, genre="pop")

    # Track reproducibility
    tracker.track_reproducibility_rate(rate=0.99)

    # Track latency
    tracker.track_latency(duration_ms=1234, phase="LYRICS")

    # Check gate status
    status = tracker.get_gate_status()
    print(status["gates"]["rubric_pass_rate"]["status"])  # "pass" or "fail"
    ```
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from collections import defaultdict
import statistics
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class MetricSnapshot:
    """Snapshot of a single metric value at a point in time.

    Attributes:
        timestamp: ISO-formatted timestamp when metric was recorded
        value: Metric value (int, float, bool, etc.)
        metadata: Optional additional context (genre, phase, etc.)
    """
    timestamp: str
    value: Any
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert snapshot to dictionary format."""
        return {
            "timestamp": self.timestamp,
            "value": self.value,
            "metadata": self.metadata
        }


@dataclass
class GateStatus:
    """Status of a single quality gate.

    Attributes:
        name: Gate name (e.g., "rubric_pass_rate")
        status: Current status ("pass", "fail", "unknown")
        current_value: Current metric value
        target_value: Target threshold value
        message: Human-readable status message
        last_updated: ISO-formatted timestamp of last update
    """
    name: str
    status: str
    current_value: Any
    target_value: Any
    message: str
    last_updated: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert gate status to dictionary format."""
        return asdict(self)


class QualityGateMetrics:
    """Quality gate metrics tracker for AMCS validation acceptance criteria.

    This class tracks all metrics required for quality gate evaluation:
    - Gate A: Rubric pass rate ≥95%
    - Gate B: Reproducibility rate ≥99%
    - Gate C: Policy violations (zero high-severity)
    - Gate D: Latency P95 ≤60s

    The tracker maintains metric history and provides gate status evaluation
    based on configurable windows and thresholds.

    Attributes:
        rubric_pass_history: List of rubric pass/fail results with metadata
        reproducibility_history: List of reproducibility rate measurements
        policy_violation_history: List of policy violation events
        latency_history: Dict of latency measurements by phase
    """

    def __init__(
        self,
        window_size: int = 200,
        min_samples: int = 10
    ):
        """Initialize the quality gate metrics tracker.

        Args:
            window_size: Number of samples to use for rolling window calculations
            min_samples: Minimum samples required before evaluating gates
        """
        self.window_size = window_size
        self.min_samples = min_samples

        # Metric histories
        self.rubric_pass_history: List[MetricSnapshot] = []
        self.reproducibility_history: List[MetricSnapshot] = []
        self.policy_violation_history: List[MetricSnapshot] = []
        self.latency_history: Dict[str, List[MetricSnapshot]] = defaultdict(list)

        # Quality gate thresholds (from AMCS requirements)
        self.thresholds = {
            "rubric_pass_rate": 0.95,  # Gate A: ≥95%
            "reproducibility_rate": 0.99,  # Gate B: ≥99%
            "max_high_severity_violations": 0,  # Gate C: zero high-severity
            "latency_p95_ms": 60000  # Gate D: ≤60s (60000ms)
        }

        logger.info(
            "quality_gate_metrics.initialized",
            window_size=window_size,
            min_samples=min_samples,
            thresholds=self.thresholds
        )

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format.

        Returns:
            ISO-formatted timestamp string
        """
        return datetime.now(timezone.utc).isoformat()

    def track_rubric_pass_rate(
        self,
        passed: bool,
        genre: str,
        total_score: Optional[float] = None,
        threshold: Optional[float] = None
    ) -> None:
        """Track rubric pass rate metric (Gate A).

        Records a single rubric evaluation result. The pass rate is calculated
        over a rolling window of recent evaluations.

        Args:
            passed: Whether this rubric evaluation passed
            genre: Genre of the evaluated content (for segmentation)
            total_score: Optional total score achieved
            threshold: Optional threshold that was applied
        """
        snapshot = MetricSnapshot(
            timestamp=self._get_timestamp(),
            value=passed,
            metadata={
                "genre": genre,
                "total_score": total_score,
                "threshold": threshold
            }
        )

        self.rubric_pass_history.append(snapshot)

        # Trim history to window size
        if len(self.rubric_pass_history) > self.window_size:
            self.rubric_pass_history = self.rubric_pass_history[-self.window_size:]

        logger.debug(
            "metrics.rubric_pass_tracked",
            passed=passed,
            genre=genre,
            total_score=total_score,
            history_size=len(self.rubric_pass_history)
        )

    def track_reproducibility_rate(
        self,
        rate: float,
        run_id: Optional[str] = None,
        replays: Optional[int] = None
    ) -> None:
        """Track reproducibility rate metric (Gate B).

        Records a reproducibility rate measurement from a determinism test.
        The rate should be between 0.0 and 1.0, where 1.0 means perfect
        reproducibility.

        Args:
            rate: Reproducibility rate (0.0-1.0)
            run_id: Optional identifier for the test run
            replays: Optional number of replays in the test
        """
        if not 0.0 <= rate <= 1.0:
            logger.warning(
                "metrics.invalid_reproducibility_rate",
                rate=rate,
                valid_range="0.0-1.0"
            )
            rate = max(0.0, min(1.0, rate))

        snapshot = MetricSnapshot(
            timestamp=self._get_timestamp(),
            value=rate,
            metadata={
                "run_id": run_id,
                "replays": replays
            }
        )

        self.reproducibility_history.append(snapshot)

        # Trim history to window size
        if len(self.reproducibility_history) > self.window_size:
            self.reproducibility_history = self.reproducibility_history[-self.window_size:]

        logger.debug(
            "metrics.reproducibility_tracked",
            rate=rate,
            run_id=run_id,
            replays=replays,
            history_size=len(self.reproducibility_history)
        )

    def track_policy_violations(
        self,
        violations: List[Dict[str, Any]],
        content_id: Optional[str] = None
    ) -> None:
        """Track policy violations (Gate C).

        Records policy violations from a validation run. Violations are categorized
        by severity, and high-severity violations are tracked for gate evaluation.

        Args:
            violations: List of violation dictionaries with severity field
            content_id: Optional identifier for the content being validated
        """
        # Count violations by severity
        severity_counts = defaultdict(int)
        for violation in violations:
            severity = violation.get("severity", "unknown")
            severity_counts[severity] += 1

        high_severity_count = (
            severity_counts.get("high", 0) +
            severity_counts.get("extreme", 0)
        )

        snapshot = MetricSnapshot(
            timestamp=self._get_timestamp(),
            value=high_severity_count,
            metadata={
                "content_id": content_id,
                "total_violations": len(violations),
                "severity_counts": dict(severity_counts),
                "violations": violations
            }
        )

        self.policy_violation_history.append(snapshot)

        # Trim history to window size
        if len(self.policy_violation_history) > self.window_size:
            self.policy_violation_history = self.policy_violation_history[-self.window_size:]

        logger.debug(
            "metrics.policy_violations_tracked",
            content_id=content_id,
            total_violations=len(violations),
            high_severity_count=high_severity_count,
            severity_counts=dict(severity_counts)
        )

    def track_latency(
        self,
        duration_ms: int,
        phase: str,
        run_id: Optional[str] = None
    ) -> None:
        """Track latency metric (Gate D).

        Records latency for a workflow phase. Latency metrics are tracked per-phase
        and aggregated for overall pipeline latency calculation.

        Args:
            duration_ms: Duration in milliseconds
            phase: Workflow phase (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, etc.)
            run_id: Optional identifier for the run
        """
        if duration_ms < 0:
            logger.warning(
                "metrics.invalid_latency",
                duration_ms=duration_ms,
                phase=phase
            )
            duration_ms = 0

        snapshot = MetricSnapshot(
            timestamp=self._get_timestamp(),
            value=duration_ms,
            metadata={
                "phase": phase,
                "run_id": run_id
            }
        )

        self.latency_history[phase].append(snapshot)

        # Trim history to window size per phase
        if len(self.latency_history[phase]) > self.window_size:
            self.latency_history[phase] = self.latency_history[phase][-self.window_size:]

        logger.debug(
            "metrics.latency_tracked",
            phase=phase,
            duration_ms=duration_ms,
            run_id=run_id,
            history_size=len(self.latency_history[phase])
        )

    def _calculate_rubric_pass_rate(self) -> Optional[float]:
        """Calculate rubric pass rate from history.

        Returns:
            Pass rate (0.0-1.0) or None if insufficient data
        """
        if len(self.rubric_pass_history) < self.min_samples:
            return None

        # Calculate pass rate from recent window
        recent = self.rubric_pass_history[-self.window_size:]
        passed_count = sum(1 for s in recent if s.value is True)
        return passed_count / len(recent)

    def _calculate_reproducibility_rate(self) -> Optional[float]:
        """Calculate average reproducibility rate from history.

        Returns:
            Average reproducibility rate (0.0-1.0) or None if insufficient data
        """
        if len(self.reproducibility_history) < self.min_samples:
            return None

        # Calculate average from recent window
        recent = self.reproducibility_history[-self.window_size:]
        rates = [s.value for s in recent]
        return statistics.mean(rates)

    def _calculate_high_severity_violations(self) -> Optional[int]:
        """Calculate total high-severity violations from history.

        Returns:
            Total high-severity violations in window or None if insufficient data
        """
        if len(self.policy_violation_history) < self.min_samples:
            return None

        # Sum high-severity violations from recent window
        recent = self.policy_violation_history[-self.window_size:]
        return sum(s.value for s in recent)

    def _calculate_latency_p95(self) -> Optional[float]:
        """Calculate P95 latency across all phases.

        Returns:
            P95 latency in milliseconds or None if insufficient data
        """
        # Aggregate latency from all phases
        all_latencies = []
        for phase_history in self.latency_history.values():
            all_latencies.extend([s.value for s in phase_history])

        if len(all_latencies) < self.min_samples:
            return None

        # Calculate P95
        sorted_latencies = sorted(all_latencies)
        p95_index = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[p95_index]

    def get_gate_status(self) -> Dict[str, Any]:
        """Get current status of all quality gates.

        Evaluates all quality gates against their thresholds and returns
        a comprehensive status report.

        Returns:
            Dictionary containing:
            - overall_status: "pass" if all gates pass, "fail" otherwise
            - gates: Dict of individual gate statuses
            - timestamp: When status was calculated
            - summary: Human-readable summary

        Example:
            >>> status = tracker.get_gate_status()
            >>> print(status["overall_status"])
            "pass"
            >>> print(status["gates"]["rubric_pass_rate"]["status"])
            "pass"
        """
        timestamp = self._get_timestamp()

        # Evaluate each gate
        gates = {}

        # Gate A: Rubric Pass Rate
        rubric_pass_rate = self._calculate_rubric_pass_rate()
        if rubric_pass_rate is None:
            gates["rubric_pass_rate"] = GateStatus(
                name="Gate A: Rubric Pass Rate",
                status="unknown",
                current_value=None,
                target_value=self.thresholds["rubric_pass_rate"],
                message=f"Insufficient data ({len(self.rubric_pass_history)} samples, need {self.min_samples})",
                last_updated=timestamp
            )
        else:
            passed = rubric_pass_rate >= self.thresholds["rubric_pass_rate"]
            gates["rubric_pass_rate"] = GateStatus(
                name="Gate A: Rubric Pass Rate",
                status="pass" if passed else "fail",
                current_value=rubric_pass_rate,
                target_value=self.thresholds["rubric_pass_rate"],
                message=f"Pass rate: {rubric_pass_rate:.2%} (target: ≥{self.thresholds['rubric_pass_rate']:.2%})",
                last_updated=timestamp
            )

        # Gate B: Reproducibility Rate
        reproducibility_rate = self._calculate_reproducibility_rate()
        if reproducibility_rate is None:
            gates["reproducibility_rate"] = GateStatus(
                name="Gate B: Reproducibility Rate",
                status="unknown",
                current_value=None,
                target_value=self.thresholds["reproducibility_rate"],
                message=f"Insufficient data ({len(self.reproducibility_history)} samples, need {self.min_samples})",
                last_updated=timestamp
            )
        else:
            passed = reproducibility_rate >= self.thresholds["reproducibility_rate"]
            gates["reproducibility_rate"] = GateStatus(
                name="Gate B: Reproducibility Rate",
                status="pass" if passed else "fail",
                current_value=reproducibility_rate,
                target_value=self.thresholds["reproducibility_rate"],
                message=f"Reproducibility: {reproducibility_rate:.2%} (target: ≥{self.thresholds['reproducibility_rate']:.2%})",
                last_updated=timestamp
            )

        # Gate C: Policy Violations
        high_severity_count = self._calculate_high_severity_violations()
        if high_severity_count is None:
            gates["policy_violations"] = GateStatus(
                name="Gate C: Policy Violations",
                status="unknown",
                current_value=None,
                target_value=self.thresholds["max_high_severity_violations"],
                message=f"Insufficient data ({len(self.policy_violation_history)} samples, need {self.min_samples})",
                last_updated=timestamp
            )
        else:
            passed = high_severity_count <= self.thresholds["max_high_severity_violations"]
            gates["policy_violations"] = GateStatus(
                name="Gate C: Policy Violations",
                status="pass" if passed else "fail",
                current_value=high_severity_count,
                target_value=self.thresholds["max_high_severity_violations"],
                message=f"High-severity violations: {high_severity_count} (target: ≤{self.thresholds['max_high_severity_violations']})",
                last_updated=timestamp
            )

        # Gate D: Latency P95
        latency_p95 = self._calculate_latency_p95()
        if latency_p95 is None:
            total_samples = sum(len(h) for h in self.latency_history.values())
            gates["latency_p95"] = GateStatus(
                name="Gate D: Latency P95",
                status="unknown",
                current_value=None,
                target_value=self.thresholds["latency_p95_ms"],
                message=f"Insufficient data ({total_samples} samples, need {self.min_samples})",
                last_updated=timestamp
            )
        else:
            passed = latency_p95 <= self.thresholds["latency_p95_ms"]
            gates["latency_p95"] = GateStatus(
                name="Gate D: Latency P95",
                status="pass" if passed else "fail",
                current_value=latency_p95,
                target_value=self.thresholds["latency_p95_ms"],
                message=f"P95 latency: {latency_p95:.0f}ms (target: ≤{self.thresholds['latency_p95_ms']}ms)",
                last_updated=timestamp
            )

        # Determine overall status
        gate_statuses = [g.status for g in gates.values()]
        if any(status == "fail" for status in gate_statuses):
            overall_status = "fail"
        elif any(status == "unknown" for status in gate_statuses):
            overall_status = "unknown"
        else:
            overall_status = "pass"

        # Build summary
        pass_count = sum(1 for g in gates.values() if g.status == "pass")
        fail_count = sum(1 for g in gates.values() if g.status == "fail")
        unknown_count = sum(1 for g in gates.values() if g.status == "unknown")

        summary = f"{pass_count} gates passing, {fail_count} failing, {unknown_count} unknown"

        # Convert gates to dict format
        gates_dict = {key: gate.to_dict() for key, gate in gates.items()}

        result = {
            "overall_status": overall_status,
            "gates": gates_dict,
            "timestamp": timestamp,
            "summary": summary
        }

        logger.info(
            "metrics.gate_status_calculated",
            overall_status=overall_status,
            pass_count=pass_count,
            fail_count=fail_count,
            unknown_count=unknown_count
        )

        return result

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary of all tracked metrics.

        Returns:
            Dictionary containing metric counts and recent values
        """
        return {
            "rubric_pass_rate": {
                "sample_count": len(self.rubric_pass_history),
                "current_rate": self._calculate_rubric_pass_rate(),
                "target": self.thresholds["rubric_pass_rate"]
            },
            "reproducibility_rate": {
                "sample_count": len(self.reproducibility_history),
                "current_rate": self._calculate_reproducibility_rate(),
                "target": self.thresholds["reproducibility_rate"]
            },
            "policy_violations": {
                "sample_count": len(self.policy_violation_history),
                "high_severity_count": self._calculate_high_severity_violations(),
                "target": self.thresholds["max_high_severity_violations"]
            },
            "latency_p95": {
                "sample_count": sum(len(h) for h in self.latency_history.values()),
                "current_p95_ms": self._calculate_latency_p95(),
                "target_ms": self.thresholds["latency_p95_ms"],
                "phases": list(self.latency_history.keys())
            }
        }

    def reset_metrics(self) -> None:
        """Reset all metric histories.

        Useful for testing or starting a new evaluation period.
        """
        self.rubric_pass_history.clear()
        self.reproducibility_history.clear()
        self.policy_violation_history.clear()
        self.latency_history.clear()

        logger.info("metrics.reset_complete")


# =============================================================================
# Convenience Functions
# =============================================================================


def get_gate_status() -> Dict[str, Any]:
    """Convenience function to get quality gate status.

    Creates a QualityGateMetrics instance and returns gate status.
    For repeated calls, consider creating a QualityGateMetrics instance
    directly to maintain metric history.

    Returns:
        Gate status dictionary
    """
    tracker = QualityGateMetrics()
    return tracker.get_gate_status()


__all__ = [
    "QualityGateMetrics",
    "MetricSnapshot",
    "GateStatus",
    "get_gate_status"
]
