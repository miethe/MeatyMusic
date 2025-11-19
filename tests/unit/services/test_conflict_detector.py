"""Unit tests for ConflictDetector service.

Tests the comprehensive tag conflict detection and resolution functionality including:
- Conflict detection with detailed reporting
- Multiple resolution strategies
- Violation reports with remediation options
- Logging and error handling
- Integration with conflict matrix
"""

import pytest
from typing import List, Dict

# Add services to path
import sys
sys.path.insert(0, "/home/user/MeatyMusic/services/api")

from app.services.conflict_detector import (
    ConflictDetector,
    detect_tag_conflicts,
    resolve_conflicts,
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def detector():
    """Create a ConflictDetector instance for testing."""
    return ConflictDetector()


@pytest.fixture
def sample_tags_no_conflicts():
    """Sample tags with no conflicts."""
    return ["melodic", "catchy", "upbeat"]


@pytest.fixture
def sample_tags_simple_conflict():
    """Sample tags with a simple conflict (whisper vs anthemic)."""
    return ["whisper", "anthemic", "upbeat"]


@pytest.fixture
def sample_tags_multiple_conflicts():
    """Sample tags with multiple conflicts."""
    return ["acoustic", "electronic", "whisper", "anthemic"]


@pytest.fixture
def sample_priorities():
    """Sample tag priorities for priority-based resolution."""
    return {
        "whisper": 0.5,
        "anthemic": 0.8,
        "upbeat": 0.6,
        "acoustic": 0.7,
        "electronic": 0.9,
    }


# =============================================================================
# Test ConflictDetector Initialization
# =============================================================================

class TestConflictDetectorInit:
    """Test ConflictDetector initialization."""

    def test_detector_initializes_successfully(self):
        """Test that ConflictDetector initializes without errors."""
        detector = ConflictDetector()

        assert detector is not None
        assert detector.resolver is not None
        assert detector.conflict_matrix_data is not None
        assert isinstance(detector.conflict_matrix_data, list)

    def test_detector_loads_conflict_matrix(self, detector):
        """Test that detector loads conflict matrix data."""
        # Should have loaded conflict matrix entries
        assert len(detector.conflict_matrix_data) > 0

        # Should have loaded conflict map in resolver
        assert len(detector.resolver.conflict_map) > 0

    def test_detector_with_custom_path(self, tmp_path):
        """Test detector initialization with custom conflict matrix path."""
        # Create a minimal conflict matrix file
        matrix_file = tmp_path / "test_matrix.json"
        matrix_file.write_text('[{"tag": "test", "Tags": ["conflict"], "Reason": "test", "Category": "test"}]')

        detector = ConflictDetector(conflict_matrix_path=str(matrix_file))

        assert detector is not None
        assert len(detector.conflict_matrix_data) == 1


# =============================================================================
# Test Conflict Detection
# =============================================================================

class TestConflictDetection:
    """Test conflict detection functionality."""

    def test_detect_no_conflicts(self, detector, sample_tags_no_conflicts):
        """Test detection when no conflicts exist."""
        conflicts = detector.detect_tag_conflicts(sample_tags_no_conflicts)

        assert conflicts == []
        assert len(conflicts) == 0

    def test_detect_simple_conflict(self, detector, sample_tags_simple_conflict):
        """Test detection of a simple conflict."""
        conflicts = detector.detect_tag_conflicts(sample_tags_simple_conflict)

        # Should find whisper-anthemic conflict
        assert len(conflicts) >= 1

        # Find the whisper-anthemic conflict
        whisper_anthemic = None
        for c in conflicts:
            tags = {c["tag_a"].lower(), c["tag_b"].lower()}
            if "whisper" in tags and "anthemic" in tags:
                whisper_anthemic = c
                break

        assert whisper_anthemic is not None
        assert whisper_anthemic["reason"] is not None
        assert whisper_anthemic["category"] is not None

    def test_detect_multiple_conflicts(self, detector, sample_tags_multiple_conflicts):
        """Test detection of multiple conflicts."""
        conflicts = detector.detect_tag_conflicts(sample_tags_multiple_conflicts)

        # Should find at least 2 conflicts:
        # 1. acoustic vs electronic
        # 2. whisper vs anthemic
        assert len(conflicts) >= 2

        # Verify conflict structure
        for conflict in conflicts:
            assert "tag_a" in conflict
            assert "tag_b" in conflict
            assert "reason" in conflict
            assert "category" in conflict
            assert isinstance(conflict["tag_a"], str)
            assert isinstance(conflict["tag_b"], str)

    def test_detect_empty_tag_list(self, detector):
        """Test detection with empty tag list."""
        conflicts = detector.detect_tag_conflicts([])

        assert conflicts == []

    def test_detect_single_tag(self, detector):
        """Test detection with single tag (no conflicts possible)."""
        conflicts = detector.detect_tag_conflicts(["melodic"])

        assert conflicts == []

    def test_detect_returns_detailed_info(self, detector):
        """Test that detection returns detailed conflict information."""
        conflicts = detector.detect_tag_conflicts(["whisper", "anthemic"])

        assert len(conflicts) >= 1

        conflict = conflicts[0]
        # Should have reason and category (from conflict matrix)
        assert conflict["reason"] is not None
        assert conflict["category"] is not None

        # For whisper-anthemic conflict, should have specific details
        if "whisper" in {conflict["tag_a"].lower(), conflict["tag_b"].lower()}:
            assert "vocal" in conflict["category"].lower() or "intensity" in conflict["reason"].lower()


# =============================================================================
# Test Conflict Resolution - Keep First Strategy
# =============================================================================

class TestKeepFirstStrategy:
    """Test keep-first resolution strategy."""

    def test_keep_first_no_conflicts(self, detector, sample_tags_no_conflicts):
        """Test keep-first with no conflicts returns all tags."""
        resolved = detector.resolve_conflicts(
            sample_tags_no_conflicts,
            strategy="keep-first"
        )

        assert resolved == sample_tags_no_conflicts

    def test_keep_first_simple_conflict(self, detector, sample_tags_simple_conflict):
        """Test keep-first removes second conflicting tag."""
        resolved = detector.resolve_conflicts(
            sample_tags_simple_conflict,
            strategy="keep-first"
        )

        # Should keep "whisper" (first), remove "anthemic" (second)
        assert "whisper" in resolved
        assert "anthemic" not in resolved
        assert "upbeat" in resolved
        assert len(resolved) == 2

    def test_keep_first_multiple_conflicts(self, detector, sample_tags_multiple_conflicts):
        """Test keep-first with multiple conflicts."""
        resolved = detector.resolve_conflicts(
            sample_tags_multiple_conflicts,
            strategy="keep-first"
        )

        # Should keep first occurrence of each conflict
        # acoustic (first) vs electronic (second) -> keep acoustic
        # whisper (third) vs anthemic (fourth) -> keep whisper
        assert "acoustic" in resolved
        assert "electronic" not in resolved
        assert "whisper" in resolved
        assert "anthemic" not in resolved

    def test_keep_first_maintains_order(self, detector):
        """Test that keep-first maintains original tag order."""
        tags = ["upbeat", "melodic", "whisper", "catchy", "anthemic"]
        resolved = detector.resolve_conflicts(tags, strategy="keep-first")

        # Should maintain relative order of kept tags
        upbeat_idx = resolved.index("upbeat")
        melodic_idx = resolved.index("melodic")
        whisper_idx = resolved.index("whisper")

        assert upbeat_idx < melodic_idx < whisper_idx

    def test_keep_first_is_deterministic(self, detector, sample_tags_simple_conflict):
        """Test that keep-first produces same result on multiple runs."""
        results = []
        for _ in range(10):
            resolved = detector.resolve_conflicts(
                sample_tags_simple_conflict,
                strategy="keep-first"
            )
            results.append(resolved)

        # All results should be identical
        for result in results[1:]:
            assert result == results[0]


# =============================================================================
# Test Conflict Resolution - Priority Strategies
# =============================================================================

class TestPriorityStrategies:
    """Test priority-based resolution strategies."""

    def test_remove_lowest_priority_simple(self, detector, sample_priorities):
        """Test remove-lowest-priority with simple conflict."""
        tags = ["whisper", "anthemic", "upbeat"]
        resolved = detector.resolve_conflicts(
            tags,
            strategy="remove-lowest-priority",
            tag_priorities=sample_priorities
        )

        # whisper (0.5) < anthemic (0.8)
        # Should remove whisper (lowest priority)
        assert "whisper" not in resolved
        assert "anthemic" in resolved
        assert "upbeat" in resolved

    def test_remove_highest_priority_simple(self, detector, sample_priorities):
        """Test remove-highest-priority with simple conflict."""
        tags = ["whisper", "anthemic", "upbeat"]
        resolved = detector.resolve_conflicts(
            tags,
            strategy="remove-highest-priority",
            tag_priorities=sample_priorities
        )

        # whisper (0.5) < anthemic (0.8)
        # Should remove anthemic (highest priority)
        assert "whisper" in resolved
        assert "anthemic" not in resolved
        assert "upbeat" in resolved

    def test_remove_lowest_priority_multiple(self, detector, sample_priorities):
        """Test remove-lowest-priority with multiple conflicts."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]
        resolved = detector.resolve_conflicts(
            tags,
            strategy="remove-lowest-priority",
            tag_priorities=sample_priorities
        )

        # Conflicts:
        # acoustic (0.7) vs electronic (0.9) -> remove acoustic
        # whisper (0.5) vs anthemic (0.8) -> remove whisper
        assert "acoustic" not in resolved
        assert "electronic" in resolved
        assert "whisper" not in resolved
        assert "anthemic" in resolved

    def test_remove_highest_priority_multiple(self, detector, sample_priorities):
        """Test remove-highest-priority with multiple conflicts."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]
        resolved = detector.resolve_conflicts(
            tags,
            strategy="remove-highest-priority",
            tag_priorities=sample_priorities
        )

        # Conflicts:
        # acoustic (0.7) vs electronic (0.9) -> remove electronic
        # whisper (0.5) vs anthemic (0.8) -> remove anthemic
        assert "acoustic" in resolved
        assert "electronic" not in resolved
        assert "whisper" in resolved
        assert "anthemic" not in resolved

    def test_priority_strategy_requires_priorities(self, detector):
        """Test that priority strategies require tag_priorities parameter."""
        with pytest.raises(ValueError, match="requires tag_priorities"):
            detector.resolve_conflicts(
                ["whisper", "anthemic"],
                strategy="remove-lowest-priority"
                # Missing tag_priorities
            )

        with pytest.raises(ValueError, match="requires tag_priorities"):
            detector.resolve_conflicts(
                ["whisper", "anthemic"],
                strategy="remove-highest-priority"
                # Missing tag_priorities
            )

    def test_priority_maintains_original_order(self, detector, sample_priorities):
        """Test that priority resolution maintains original tag order."""
        tags = ["upbeat", "whisper", "melodic", "anthemic", "catchy"]
        resolved = detector.resolve_conflicts(
            tags,
            strategy="remove-lowest-priority",
            tag_priorities=sample_priorities
        )

        # Verify order is preserved (not sorted by priority)
        # Original order: upbeat, whisper, melodic, anthemic, catchy
        # After resolution, relative order should be maintained
        if "upbeat" in resolved and "melodic" in resolved:
            upbeat_idx = resolved.index("upbeat")
            melodic_idx = resolved.index("melodic")
            assert upbeat_idx < melodic_idx


# =============================================================================
# Test Violation Reports
# =============================================================================

class TestViolationReports:
    """Test violation report generation."""

    def test_violation_report_no_conflicts(self, detector, sample_tags_no_conflicts):
        """Test violation report when no conflicts exist."""
        report = detector.get_violation_report(sample_tags_no_conflicts)

        assert report["is_valid"] is True
        assert report["tag_count"] == 3
        assert report["conflict_count"] == 0
        assert report["conflicts"] == []

    def test_violation_report_with_conflicts(self, detector, sample_tags_simple_conflict):
        """Test violation report with conflicts."""
        report = detector.get_violation_report(sample_tags_simple_conflict)

        assert report["is_valid"] is False
        assert report["tag_count"] == 3
        assert report["conflict_count"] >= 1
        assert len(report["conflicts"]) >= 1

        # Check conflict structure
        conflict = report["conflicts"][0]
        assert "tag_a" in conflict
        assert "tag_b" in conflict
        assert "reason" in conflict
        assert "category" in conflict

    def test_violation_report_includes_remediation(self, detector, sample_tags_simple_conflict):
        """Test that violation report includes remediation options."""
        report = detector.get_violation_report(
            sample_tags_simple_conflict,
            include_remediation=True
        )

        assert "suggested_resolution" in report
        assert "remediation_options" in report

        # Suggested resolution should be conflict-free
        suggested = report["suggested_resolution"]
        assert isinstance(suggested, list)
        assert len(suggested) < len(sample_tags_simple_conflict)

        # Remediation options should include alternatives
        options = report["remediation_options"]
        assert isinstance(options, dict)
        assert "keep_first" in options

    def test_violation_report_without_remediation(self, detector, sample_tags_simple_conflict):
        """Test violation report without remediation options."""
        report = detector.get_violation_report(
            sample_tags_simple_conflict,
            include_remediation=False
        )

        assert "suggested_resolution" not in report
        assert "remediation_options" not in report

    def test_violation_report_remediation_options_valid(self, detector):
        """Test that all remediation options are conflict-free."""
        tags = ["whisper", "anthemic", "upbeat"]
        report = detector.get_violation_report(tags, include_remediation=True)

        # Each remediation option should be conflict-free
        for option_name, option_tags in report["remediation_options"].items():
            conflicts = detector.detect_tag_conflicts(option_tags)
            assert len(conflicts) == 0, f"Remediation option '{option_name}' has conflicts: {conflicts}"

    def test_violation_report_empty_tags(self, detector):
        """Test violation report with empty tag list."""
        report = detector.get_violation_report([])

        assert report["is_valid"] is True
        assert report["tag_count"] == 0
        assert report["conflict_count"] == 0
        assert report["conflicts"] == []


# =============================================================================
# Test Convenience Functions
# =============================================================================

class TestConvenienceFunctions:
    """Test module-level convenience functions."""

    def test_detect_tag_conflicts_function(self):
        """Test detect_tag_conflicts convenience function."""
        conflicts = detect_tag_conflicts(["whisper", "anthemic"])

        assert isinstance(conflicts, list)
        assert len(conflicts) >= 1

    def test_resolve_conflicts_function(self):
        """Test resolve_conflicts convenience function."""
        resolved = resolve_conflicts(["whisper", "anthemic", "upbeat"])

        assert isinstance(resolved, list)
        assert len(resolved) < 3  # Should have removed at least one tag

    def test_convenience_functions_produce_same_result(self, detector):
        """Test that convenience functions produce same result as detector methods."""
        tags = ["whisper", "anthemic", "upbeat"]

        # Using convenience functions
        conflicts_func = detect_tag_conflicts(tags)
        resolved_func = resolve_conflicts(tags, strategy="keep-first")

        # Using detector instance
        conflicts_detector = detector.detect_tag_conflicts(tags)
        resolved_detector = detector.resolve_conflicts(tags, strategy="keep-first")

        # Should produce same results
        assert len(conflicts_func) == len(conflicts_detector)
        assert resolved_func == resolved_detector


# =============================================================================
# Test Edge Cases
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_unknown_strategy_fallback(self, detector):
        """Test that unknown strategy falls back to keep-first."""
        tags = ["whisper", "anthemic", "upbeat"]

        # Use invalid strategy
        resolved = detector.resolve_conflicts(tags, strategy="invalid-strategy")

        # Should still work (fallback to keep-first)
        assert isinstance(resolved, list)
        assert len(resolved) < len(tags)

    def test_case_insensitive_tag_matching(self, detector):
        """Test that tag conflict detection is case-insensitive."""
        # Test with different cases
        conflicts1 = detector.detect_tag_conflicts(["whisper", "anthemic"])
        conflicts2 = detector.detect_tag_conflicts(["Whisper", "Anthemic"])
        conflicts3 = detector.detect_tag_conflicts(["WHISPER", "ANTHEMIC"])

        # Should find same number of conflicts regardless of case
        assert len(conflicts1) == len(conflicts2) == len(conflicts3)

    def test_duplicate_tags_handling(self, detector):
        """Test handling of duplicate tags in list."""
        tags = ["whisper", "upbeat", "whisper", "anthemic"]
        resolved = detector.resolve_conflicts(tags, strategy="keep-first")

        # Should handle duplicates gracefully
        assert isinstance(resolved, list)

    def test_special_characters_in_tags(self, detector):
        """Test handling of tags with special characters."""
        tags = ["hi-fi", "lo-fi", "upbeat"]
        conflicts = detector.detect_tag_conflicts(tags)

        # Should find hi-fi vs lo-fi conflict
        assert len(conflicts) >= 1

    def test_tags_with_spaces(self, detector):
        """Test handling of tags that might have spaces."""
        # Conflict matrix uses hyphens, but input might have spaces
        # The detector should normalize or handle this gracefully
        tags = ["wall-of-sound", "minimal", "upbeat"]
        conflicts = detector.detect_tag_conflicts(tags)

        # Should find conflict (minimal vs wall-of-sound)
        assert len(conflicts) >= 1


# =============================================================================
# Test Determinism
# =============================================================================

class TestDeterminism:
    """Test deterministic behavior of conflict resolution."""

    def test_detect_is_deterministic(self, detector):
        """Test that detection is deterministic across runs."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]

        results = []
        for _ in range(10):
            conflicts = detector.detect_tag_conflicts(tags)
            # Convert to tuple of frozensets for comparison
            conflict_set = frozenset(
                frozenset(c.items()) for c in conflicts
            )
            results.append(conflict_set)

        # All results should be identical
        assert all(r == results[0] for r in results)

    def test_resolve_keep_first_is_deterministic(self, detector):
        """Test that keep-first resolution is deterministic."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]

        results = []
        for _ in range(10):
            resolved = detector.resolve_conflicts(tags, strategy="keep-first")
            results.append(resolved)

        # All results should be identical
        assert all(r == results[0] for r in results)

    def test_resolve_priority_is_deterministic(self, detector, sample_priorities):
        """Test that priority-based resolution is deterministic."""
        tags = ["acoustic", "electronic", "whisper", "anthemic"]

        results = []
        for _ in range(10):
            resolved = detector.resolve_conflicts(
                tags,
                strategy="remove-lowest-priority",
                tag_priorities=sample_priorities
            )
            results.append(resolved)

        # All results should be identical
        assert all(r == results[0] for r in results)


# =============================================================================
# Test Matrix Reload
# =============================================================================

class TestMatrixReload:
    """Test conflict matrix reload functionality."""

    def test_reload_conflict_matrix(self, detector):
        """Test reloading the conflict matrix."""
        # Initial state
        initial_count = len(detector.conflict_matrix_data)

        # Reload
        success = detector.reload_conflict_matrix()

        assert success is True
        # Should still have data after reload
        assert len(detector.conflict_matrix_data) > 0

    def test_reload_maintains_functionality(self, detector):
        """Test that detector still works after reload."""
        # Reload matrix
        detector.reload_conflict_matrix()

        # Should still detect conflicts
        conflicts = detector.detect_tag_conflicts(["whisper", "anthemic"])
        assert len(conflicts) >= 1

        # Should still resolve conflicts
        resolved = detector.resolve_conflicts(
            ["whisper", "anthemic", "upbeat"],
            strategy="keep-first"
        )
        assert len(resolved) < 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
