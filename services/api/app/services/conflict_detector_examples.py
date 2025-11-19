"""Usage examples for ConflictDetector service.

This module demonstrates how to use the ConflictDetector service in various
scenarios within the MeatyMusic AMCS validation framework.

Examples:
1. Basic conflict detection
2. Resolution with different strategies
3. Integration with validation workflows
4. Violation reporting
5. Blueprint integration
"""

from typing import List, Dict, Tuple
from app.services.conflict_detector import ConflictDetector, detect_tag_conflicts, resolve_conflicts


# =============================================================================
# Example 1: Basic Conflict Detection
# =============================================================================

def example_basic_detection():
    """Example: Detect conflicts in a tag list."""
    print("Example 1: Basic Conflict Detection")
    print("-" * 50)

    # Initialize detector
    detector = ConflictDetector()

    # Tags with known conflicts
    tags = ["whisper", "anthemic", "acoustic", "electronic"]

    # Detect conflicts
    conflicts = detector.detect_tag_conflicts(tags)

    print(f"Tags: {tags}")
    print(f"Conflicts found: {len(conflicts)}\n")

    for conflict in conflicts:
        print(f"  ✗ {conflict['tag_a']} ↔ {conflict['tag_b']}")
        print(f"    Reason: {conflict['reason']}")
        print(f"    Category: {conflict['category']}\n")


# =============================================================================
# Example 2: Keep-First Resolution
# =============================================================================

def example_keep_first_resolution():
    """Example: Resolve conflicts using keep-first strategy."""
    print("\nExample 2: Keep-First Resolution")
    print("-" * 50)

    detector = ConflictDetector()

    tags = ["whisper", "anthemic", "upbeat", "melodic"]

    print(f"Original tags: {tags}")

    # Resolve using keep-first (default)
    resolved = detector.resolve_conflicts(tags, strategy="keep-first")

    print(f"Resolved tags: {resolved}")
    print(f"Removed: {[t for t in tags if t not in resolved]}\n")


# =============================================================================
# Example 3: Priority-Based Resolution
# =============================================================================

def example_priority_resolution():
    """Example: Resolve conflicts using priority strategy."""
    print("\nExample 3: Priority-Based Resolution")
    print("-" * 50)

    detector = ConflictDetector()

    tags = ["whisper", "anthemic", "upbeat", "melodic"]

    # Tag priorities (from blueprint or user preferences)
    priorities = {
        "whisper": 0.5,
        "anthemic": 0.8,
        "upbeat": 0.6,
        "melodic": 0.7
    }

    print(f"Original tags: {tags}")
    print(f"Priorities: {priorities}\n")

    # Remove lowest priority
    resolved_low = detector.resolve_conflicts(
        tags,
        strategy="remove-lowest-priority",
        tag_priorities=priorities
    )

    print(f"Remove-lowest-priority: {resolved_low}")
    print(f"  (kept high-priority tags: anthemic=0.8, melodic=0.7)")

    # Remove highest priority
    resolved_high = detector.resolve_conflicts(
        tags,
        strategy="remove-highest-priority",
        tag_priorities=priorities
    )

    print(f"Remove-highest-priority: {resolved_high}")
    print(f"  (kept low-priority tags: whisper=0.5, upbeat=0.6)\n")


# =============================================================================
# Example 4: Violation Reports
# =============================================================================

def example_violation_report():
    """Example: Generate violation report with remediation."""
    print("\nExample 4: Violation Report")
    print("-" * 50)

    detector = ConflictDetector()

    tags = ["whisper", "anthemic", "upbeat"]

    # Get detailed violation report
    report = detector.get_violation_report(tags, include_remediation=True)

    print(f"Tags: {tags}")
    print(f"Valid: {report['is_valid']}")
    print(f"Conflicts: {report['conflict_count']}\n")

    if report['conflicts']:
        print("Conflict Details:")
        for c in report['conflicts']:
            print(f"  • {c['tag_a']} ↔ {c['tag_b']}: {c['reason']}\n")

    if 'suggested_resolution' in report:
        print(f"Suggested Resolution: {report['suggested_resolution']}\n")

    if 'remediation_options' in report:
        print("Remediation Options:")
        for option_name, option_tags in report['remediation_options'].items():
            print(f"  • {option_name}: {option_tags}")


# =============================================================================
# Example 5: Integration with Style Validation
# =============================================================================

def example_style_validation_integration():
    """Example: Integrate with style validation workflow."""
    print("\nExample 5: Style Validation Integration")
    print("-" * 50)

    class StyleValidator:
        """Example validator that uses ConflictDetector."""

        def __init__(self):
            self.conflict_detector = ConflictDetector()

        def validate_and_clean_tags(
            self,
            tags: List[str],
            auto_resolve: bool = True
        ) -> Tuple[bool, List[str], List[str]]:
            """Validate tags and optionally auto-resolve conflicts.

            Args:
                tags: Style tags to validate
                auto_resolve: Whether to automatically resolve conflicts

            Returns:
                (is_valid, cleaned_tags, warnings)
            """
            # Detect conflicts
            conflicts = self.conflict_detector.detect_tag_conflicts(tags)

            if not conflicts:
                return True, tags, []

            # Build warnings
            warnings = []
            for c in conflicts:
                warnings.append(
                    f"Tag conflict: {c['tag_a']} ↔ {c['tag_b']} ({c['reason']})"
                )

            if not auto_resolve:
                return False, tags, warnings

            # Auto-resolve using keep-first
            cleaned = self.conflict_detector.resolve_conflicts(
                tags,
                strategy="keep-first"
            )

            removed = [t for t in tags if t not in cleaned]
            warnings.append(f"Auto-removed conflicting tags: {', '.join(removed)}")

            return False, cleaned, warnings

    # Use the validator
    validator = StyleValidator()

    tags = ["whisper", "anthemic", "upbeat", "melodic"]

    is_valid, cleaned, warnings = validator.validate_and_clean_tags(
        tags,
        auto_resolve=True
    )

    print(f"Original tags: {tags}")
    print(f"Valid: {is_valid}")
    print(f"Cleaned tags: {cleaned}")
    print(f"Warnings:")
    for warning in warnings:
        print(f"  ⚠ {warning}")


# =============================================================================
# Example 6: Blueprint-Based Resolution
# =============================================================================

def example_blueprint_integration():
    """Example: Use blueprint weights for priority-based resolution."""
    print("\nExample 6: Blueprint Integration")
    print("-" * 50)

    detector = ConflictDetector()

    # Simulate blueprint rubric weights
    blueprint_rubric = {
        "weights": {
            "melodic": 0.25,
            "catchy": 0.20,
            "singability": 0.15,
            "anthemic": 0.20,
            "whisper": 0.10,
            "intimate": 0.10
        }
    }

    # Extract weights
    tag_weights = blueprint_rubric["weights"]

    # User-provided tags
    user_tags = ["melodic", "whisper", "anthemic", "catchy"]

    print(f"User tags: {user_tags}")
    print(f"Blueprint weights: {tag_weights}\n")

    # Resolve using blueprint priorities
    resolved = detector.resolve_conflicts(
        user_tags,
        strategy="remove-lowest-priority",
        tag_priorities=tag_weights
    )

    print(f"Resolved tags: {resolved}")
    print(f"  (kept higher-weight tags per blueprint)")


# =============================================================================
# Example 7: Convenience Functions
# =============================================================================

def example_convenience_functions():
    """Example: Use module-level convenience functions."""
    print("\nExample 7: Convenience Functions")
    print("-" * 50)

    tags = ["acoustic", "electronic", "upbeat"]

    # Quick detection (creates detector internally)
    conflicts = detect_tag_conflicts(tags)

    print(f"Tags: {tags}")
    print(f"Conflicts: {len(conflicts)}")

    # Quick resolution
    resolved = resolve_conflicts(tags, strategy="keep-first")

    print(f"Resolved: {resolved}\n")


# =============================================================================
# Example 8: Error Handling
# =============================================================================

def example_error_handling():
    """Example: Handle common errors gracefully."""
    print("\nExample 8: Error Handling")
    print("-" * 50)

    detector = ConflictDetector()

    # Error 1: Priority strategy without priorities
    print("1. Missing priorities:")
    try:
        detector.resolve_conflicts(
            ["whisper", "anthemic"],
            strategy="remove-lowest-priority"
            # Missing tag_priorities!
        )
    except ValueError as e:
        print(f"   ✓ Caught ValueError: {e}\n")

    # Error 2: Unknown strategy (logs warning, uses fallback)
    print("2. Unknown strategy:")
    resolved = detector.resolve_conflicts(
        ["whisper", "anthemic"],
        strategy="unknown-strategy"
    )
    print(f"   ✓ Fallback used, resolved: {resolved}\n")

    # Error 3: Empty tag list (returns empty)
    print("3. Empty tag list:")
    resolved = detector.resolve_conflicts([])
    print(f"   ✓ Returns empty list: {resolved}\n")


# =============================================================================
# Main Demo
# =============================================================================

def run_all_examples():
    """Run all usage examples."""
    print("=" * 70)
    print("ConflictDetector Usage Examples")
    print("=" * 70)

    example_basic_detection()
    example_keep_first_resolution()
    example_priority_resolution()
    example_violation_report()
    example_style_validation_integration()
    example_blueprint_integration()
    example_convenience_functions()
    example_error_handling()

    print("\n" + "=" * 70)
    print("Examples Complete")
    print("=" * 70)


if __name__ == "__main__":
    # Run examples (note: requires dependencies installed)
    run_all_examples()
