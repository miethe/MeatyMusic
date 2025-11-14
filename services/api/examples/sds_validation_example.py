"""Example usage of BlueprintValidatorService and TagConflictResolver.

This example demonstrates how to:
1. Validate an SDS against blueprint constraints
2. Detect and resolve tag conflicts in style specifications
"""

import os
from uuid import uuid4
from pathlib import Path
import sys

# Set minimal test environment variables
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DATABASE_URL_TEST", "sqlite:///:memory:")
os.environ.setdefault("CLERK_WEBHOOK_SECRET", "whsec_test_secret")
os.environ.setdefault("CLERK_JWKS_URL", "https://test.clerk.accounts.dev/.well-known/jwks.json")
os.environ.setdefault("CLERK_JWT_ISSUER", "https://test.clerk.accounts.dev")
os.environ.setdefault("ENVIRONMENT", "development")

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.blueprint_validator_service import BlueprintValidatorService
from app.services.tag_conflict_resolver import TagConflictResolver
from app.repositories.blueprint_repo import BlueprintRepository
from app.models.blueprint import Blueprint


def example_blueprint_validation():
    """Example: Validate SDS against blueprint constraints."""
    print("\n" + "="*80)
    print("EXAMPLE 1: Blueprint Validation")
    print("="*80)

    # Create mock blueprint (in real usage, this comes from database)
    class MockBlueprint:
        def __init__(self):
            self.id = uuid4()
            self.genre = "Pop"
            self.rules = {
                "tempo_bpm": [90, 140],
                "required_sections": ["verse", "chorus", "bridge"],
                "banned_terms": ["profanity1", "profanity2"],
                "section_lines": {
                    "verse": {"min": 4, "max": 8},
                    "chorus": {"min": 2, "max": 4}
                }
            }

    # Create mock repository
    class MockBlueprintRepo:
        def get_by_id(self, model_class, blueprint_id):
            return MockBlueprint()

    # Initialize validator service
    validator = BlueprintValidatorService(MockBlueprintRepo())

    # Example 1: Valid SDS
    print("\n1. Valid SDS:")
    valid_sds = {
        "style": {
            "tempo_bpm": 120,
            "genre": "Pop"
        },
        "lyrics": {
            "section_order": ["verse", "chorus", "bridge"],
            "constraints": {
                "explicit": False,
                "section_requirements": {
                    "verse": {"min_lines": 4},
                    "chorus": {"min_lines": 2}
                }
            }
        }
    }

    # Note: In real async context, use: await validator.validate_sds_against_blueprint(...)
    # For this example, we'll just show the structure
    print(f"  SDS BPM: {valid_sds['style']['tempo_bpm']}")
    print(f"  Sections: {', '.join(valid_sds['lyrics']['section_order'])}")
    print("  Result: Would pass validation ✓")

    # Example 2: Invalid SDS (BPM out of range)
    print("\n2. Invalid SDS (BPM out of range):")
    invalid_sds = {
        "style": {
            "tempo_bpm": 180,  # Out of range [90, 140]
            "genre": "Pop"
        },
        "lyrics": {
            "section_order": ["verse", "chorus"],  # Missing "bridge"
            "constraints": {
                "explicit": False,
                "section_requirements": {
                    "verse": {"min_lines": 4},
                    "chorus": {"min_lines": 2}
                }
            }
        }
    }

    print(f"  SDS BPM: {invalid_sds['style']['tempo_bpm']} (blueprint range: [90, 140])")
    print(f"  Sections: {', '.join(invalid_sds['lyrics']['section_order'])} (missing: bridge)")
    print("  Result: Would fail validation ✗")
    print("  Errors:")
    print("    - BPM 180 outside blueprint range [90, 140]")
    print("    - Missing required sections: bridge")


def example_tag_conflict_resolution():
    """Example: Detect and resolve tag conflicts."""
    print("\n" + "="*80)
    print("EXAMPLE 2: Tag Conflict Resolution")
    print("="*80)

    # Initialize resolver with default conflict matrix
    resolver = TagConflictResolver()

    # Example 1: Find conflicts
    print("\n1. Finding conflicts in tag list:")
    tags_with_conflicts = ["whisper", "anthemic", "upbeat", "melancholic", "pop"]
    print(f"  Tags: {tags_with_conflicts}")

    conflicts = resolver.find_conflicts(tags_with_conflicts)
    print(f"  Found {len(conflicts)} conflict(s):")
    for tag_a, tag_b in conflicts:
        print(f"    - '{tag_a}' conflicts with '{tag_b}'")

    # Example 2: Resolve conflicts without weights
    print("\n2. Resolving conflicts (without weights):")
    resolved = resolver.resolve_conflicts(tags_with_conflicts)
    print(f"  Original tags: {tags_with_conflicts}")
    print(f"  Resolved tags: {resolved}")
    print(f"  Dropped: {set(tags_with_conflicts) - set(resolved)}")

    # Example 3: Resolve conflicts with weights
    print("\n3. Resolving conflicts (with weights):")
    weights = {
        "whisper": 0.5,
        "anthemic": 0.8,
        "upbeat": 0.9,
        "melancholic": 0.3,
        "pop": 0.7
    }
    print(f"  Tag weights: {weights}")

    resolved_weighted = resolver.resolve_conflicts(tags_with_conflicts, weights)
    print(f"  Resolved tags: {resolved_weighted}")
    print(f"  Dropped: {set(tags_with_conflicts) - set(resolved_weighted)}")
    print("\n  Explanation:")
    print("    - 'anthemic' (0.8) kept, 'whisper' (0.5) dropped (conflict)")
    print("    - 'upbeat' (0.9) kept, 'melancholic' (0.3) dropped (conflict)")
    print("    - 'pop' (0.7) kept (no conflicts)")

    # Example 4: No conflicts
    print("\n4. Tags without conflicts:")
    clean_tags = ["pop", "upbeat", "energetic", "female-vocal"]
    print(f"  Tags: {clean_tags}")

    conflicts_clean = resolver.find_conflicts(clean_tags)
    print(f"  Conflicts found: {len(conflicts_clean)}")

    resolved_clean = resolver.resolve_conflicts(clean_tags)
    print(f"  Resolved tags: {resolved_clean} (all kept)")


def example_integration():
    """Example: Combined validation and conflict resolution workflow."""
    print("\n" + "="*80)
    print("EXAMPLE 3: Integrated Workflow")
    print("="*80)

    print("\nTypical SDS validation workflow:")
    print("1. Client submits SDS with style tags")
    print("2. TagConflictResolver checks for tag conflicts")
    print("3. If conflicts found, resolve by dropping lower-weight tags")
    print("4. BlueprintValidatorService validates SDS against blueprint")
    print("5. If validation passes, proceed to workflow execution")
    print("6. If validation fails, return errors to client")

    print("\nExample flow:")
    print("  Input SDS:")
    print("    - Genre: Pop")
    print("    - BPM: 120")
    print("    - Tags: ['whisper', 'anthemic', 'upbeat']")
    print("    - Sections: ['verse', 'chorus', 'bridge']")

    print("\n  Step 1: Tag conflict resolution")
    resolver = TagConflictResolver()
    tags = ["whisper", "anthemic", "upbeat"]
    conflicts = resolver.find_conflicts(tags)
    print(f"    Found conflicts: {conflicts}")

    weights = {"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.9}
    resolved_tags = resolver.resolve_conflicts(tags, weights)
    print(f"    Resolved tags: {resolved_tags}")

    print("\n  Step 2: Blueprint validation")
    print("    BPM check: 120 in [90, 140] ✓")
    print("    Section check: ['verse', 'chorus', 'bridge'] includes all required ✓")
    print("    Result: VALID")

    print("\n  Step 3: Proceed to workflow execution")
    print("    → PLAN node")
    print("    → STYLE node")
    print("    → LYRICS node")
    print("    → ...")


if __name__ == "__main__":
    print("\nMeatyMusic SDS Validation Examples")
    print("="*80)

    example_blueprint_validation()
    example_tag_conflict_resolution()
    example_integration()

    print("\n" + "="*80)
    print("Examples completed!")
    print("="*80 + "\n")
