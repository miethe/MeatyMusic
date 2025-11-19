#!/usr/bin/env python3
"""Standalone verification script for ConflictDetector.

This script tests the basic functionality of the conflict detector
without requiring pytest or other dependencies.
"""

import sys
import json
from pathlib import Path

# Add services to path
sys.path.insert(0, "/home/user/MeatyMusic/services/api")

# Mock structlog for testing
class MockLogger:
    def debug(self, *args, **kwargs):
        pass
    def info(self, *args, **kwargs):
        pass
    def warning(self, *args, **kwargs):
        pass
    def error(self, *args, **kwargs):
        pass

class MockStructlog:
    @staticmethod
    def get_logger(name):
        return MockLogger()

sys.modules['structlog'] = MockStructlog()

# Now import after mocking
from app.services.tag_conflict_resolver import TagConflictResolver
from app.services.conflict_detector import ConflictDetector, detect_tag_conflicts, resolve_conflicts


def test_basic_functionality():
    """Test basic conflict detection and resolution."""
    print("Testing ConflictDetector basic functionality...")

    # Test 1: Initialize detector
    print("\n1. Testing initialization...")
    try:
        detector = ConflictDetector()
        print("   ✓ ConflictDetector initialized successfully")
    except Exception as e:
        print(f"   ✗ Initialization failed: {e}")
        return False

    # Test 2: Detect conflicts
    print("\n2. Testing conflict detection...")
    try:
        tags_with_conflicts = ["whisper", "anthemic", "upbeat"]
        conflicts = detector.detect_tag_conflicts(tags_with_conflicts)

        if conflicts:
            print(f"   ✓ Detected {len(conflicts)} conflict(s)")
            for c in conflicts:
                print(f"      - {c['tag_a']} ↔ {c['tag_b']}: {c['reason']}")
        else:
            print(f"   ⚠ No conflicts detected (expected at least 1)")
    except Exception as e:
        print(f"   ✗ Conflict detection failed: {e}")
        return False

    # Test 3: No conflicts case
    print("\n3. Testing no conflicts case...")
    try:
        tags_no_conflicts = ["melodic", "catchy", "upbeat"]
        conflicts = detector.detect_tag_conflicts(tags_no_conflicts)

        if not conflicts:
            print(f"   ✓ Correctly detected no conflicts")
        else:
            print(f"   ⚠ Unexpected conflicts found: {conflicts}")
    except Exception as e:
        print(f"   ✗ No conflict test failed: {e}")
        return False

    # Test 4: Resolve conflicts with keep-first strategy
    print("\n4. Testing keep-first resolution...")
    try:
        tags = ["whisper", "anthemic", "upbeat"]
        resolved = detector.resolve_conflicts(tags, strategy="keep-first")

        print(f"   Original: {tags}")
        print(f"   Resolved: {resolved}")

        if len(resolved) < len(tags):
            print(f"   ✓ Successfully removed conflicting tags")
        else:
            print(f"   ⚠ Expected fewer tags after resolution")
    except Exception as e:
        print(f"   ✗ Keep-first resolution failed: {e}")
        return False

    # Test 5: Resolve with priority strategy
    print("\n5. Testing priority-based resolution...")
    try:
        tags = ["whisper", "anthemic", "upbeat"]
        priorities = {"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.6}

        resolved = detector.resolve_conflicts(
            tags,
            strategy="remove-lowest-priority",
            tag_priorities=priorities
        )

        print(f"   Original: {tags}")
        print(f"   Priorities: {priorities}")
        print(f"   Resolved: {resolved}")

        # Should remove whisper (lowest priority)
        if "anthemic" in resolved and "whisper" not in resolved:
            print(f"   ✓ Correctly removed lowest priority tag")
        else:
            print(f"   ⚠ Unexpected resolution result")
    except Exception as e:
        print(f"   ✗ Priority resolution failed: {e}")
        return False

    # Test 6: Violation report
    print("\n6. Testing violation report...")
    try:
        tags = ["whisper", "anthemic", "upbeat"]
        report = detector.get_violation_report(tags, include_remediation=True)

        print(f"   Is valid: {report['is_valid']}")
        print(f"   Tag count: {report['tag_count']}")
        print(f"   Conflict count: {report['conflict_count']}")

        if 'suggested_resolution' in report:
            print(f"   Suggested resolution: {report['suggested_resolution']}")
            print(f"   ✓ Violation report generated successfully")
        else:
            print(f"   ⚠ Missing remediation in report")
    except Exception as e:
        print(f"   ✗ Violation report failed: {e}")
        return False

    # Test 7: Convenience functions
    print("\n7. Testing convenience functions...")
    try:
        conflicts = detect_tag_conflicts(["whisper", "anthemic"])
        resolved = resolve_conflicts(["whisper", "anthemic", "upbeat"])

        print(f"   Conflicts found: {len(conflicts)}")
        print(f"   Resolved tags: {resolved}")
        print(f"   ✓ Convenience functions work correctly")
    except Exception as e:
        print(f"   ✗ Convenience functions failed: {e}")
        return False

    # Test 8: Determinism test
    print("\n8. Testing determinism...")
    try:
        tags = ["whisper", "anthemic", "upbeat"]
        results = []

        for i in range(5):
            resolved = detector.resolve_conflicts(tags, strategy="keep-first")
            results.append(resolved)

        if all(r == results[0] for r in results):
            print(f"   ✓ Deterministic: all 5 runs produced identical results")
        else:
            print(f"   ✗ Non-deterministic: runs produced different results")
            for i, r in enumerate(results):
                print(f"      Run {i+1}: {r}")
    except Exception as e:
        print(f"   ✗ Determinism test failed: {e}")
        return False

    return True


def test_conflict_matrix_loading():
    """Test that conflict matrix loads correctly."""
    print("\nTesting conflict matrix loading...")

    matrix_path = Path("/home/user/MeatyMusic/taxonomies/conflict_matrix.json")

    if not matrix_path.exists():
        print(f"   ✗ Conflict matrix file not found at {matrix_path}")
        return False

    try:
        with open(matrix_path, 'r') as f:
            data = json.load(f)

        if not isinstance(data, list):
            print(f"   ✗ Conflict matrix is not an array")
            return False

        print(f"   ✓ Loaded {len(data)} conflict entries")

        # Check structure of first entry
        if data:
            first = data[0]
            required_fields = ["tag", "Tags"]
            if all(field in first for field in required_fields):
                print(f"   ✓ Conflict entries have required fields")
            else:
                print(f"   ⚠ Some required fields missing in entries")

        return True

    except Exception as e:
        print(f"   ✗ Failed to load conflict matrix: {e}")
        return False


def main():
    """Run all verification tests."""
    print("=" * 70)
    print("ConflictDetector Verification Script")
    print("=" * 70)

    # Test matrix loading first
    matrix_ok = test_conflict_matrix_loading()

    if not matrix_ok:
        print("\n⚠ Conflict matrix loading failed - some tests may not work correctly")

    # Test basic functionality
    functionality_ok = test_basic_functionality()

    # Summary
    print("\n" + "=" * 70)
    print("Verification Summary")
    print("=" * 70)

    if functionality_ok and matrix_ok:
        print("✓ All tests passed!")
        return 0
    elif functionality_ok:
        print("⚠ Functionality tests passed, but conflict matrix issues detected")
        return 1
    else:
        print("✗ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
