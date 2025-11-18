"""
Example: Using Skill Contracts in AMCS Workflow

This example demonstrates how to use the skill contract schemas defined in
services/api/app/schemas/skill_contracts.py for implementing and executing
AMCS workflow skills.

Examples include:
1. Creating workflow context
2. Implementing a skill with contracts
3. Validating inputs/outputs
4. Chaining skills together
5. Error handling
6. Computing artifact hashes

Run with: python -m docs.examples.skill_contract_usage
"""

import hashlib
import json
import time
from datetime import datetime
from typing import Dict, Any

from services.api.app.schemas.skill_contracts import (
    WorkflowContext,
    PlanInput,
    PlanOutput,
    StyleInput,
    StyleOutput,
    ValidateInput,
    ValidateOutput,
)


# =============================================================================
# Example 1: Creating Workflow Context
# =============================================================================

def example_create_context() -> WorkflowContext:
    """
    Create a WorkflowContext for a workflow run.

    The context carries determinism seed, identifies the run, and sets feature flags.
    """
    print("\n=== Example 1: Creating Workflow Context ===")

    context = WorkflowContext(
        run_id="550e8400-e29b-41d4-a716-446655440000",
        song_id="song-12345",
        seed=42,  # Deterministic seed
        feature_flags={
            "render.suno.enabled": False,
            "eval.autofix.enabled": True,
            "policy.release.strict": True,
        }
    )

    print(f"Run ID: {context.run_id}")
    print(f"Song ID: {context.song_id}")
    print(f"Seed: {context.seed}")
    print(f"Feature Flags: {context.feature_flags}")
    print(f"Created At: {context.created_at}")

    # Pydantic validation ensures seed >= 0
    try:
        bad_context = WorkflowContext(
            run_id="test",
            song_id="song-123",
            seed=-1  # Invalid!
        )
    except ValueError as e:
        print(f"\n✓ Validation caught negative seed: {e}")

    return context


# =============================================================================
# Example 2: Implementing a Skill with Contracts
# =============================================================================

def compute_artifact_hash(artifact: Dict[str, Any]) -> str:
    """
    Compute SHA-256 hash of an artifact for provenance tracking.

    Args:
        artifact: Dictionary to hash (will be JSON-serialized)

    Returns:
        SHA-256 hash in format "sha256:hexdigest"
    """
    # Sort keys for deterministic JSON serialization
    artifact_json = json.dumps(artifact, sort_keys=True)
    hash_digest = hashlib.sha256(artifact_json.encode()).hexdigest()
    return f"sha256:{hash_digest}"


def plan_skill(input: PlanInput) -> PlanOutput:
    """
    Example implementation of PLAN skill using contracts.

    This skill expands the SDS into section structure and evaluation targets.

    Args:
        input: PlanInput with context and SDS

    Returns:
        PlanOutput with plan artifact

    Raises:
        ValueError: If SDS is invalid
    """
    start_time = time.time()
    events = []

    # Emit start event
    events.append({
        "ts": datetime.utcnow().isoformat() + "Z",
        "phase": "start",
        "message": "PLAN skill started"
    })

    try:
        # Extract from SDS
        genre = input.sds.get("genre", "pop")
        target_length = input.sds.get("targetLength", "3:30")

        # Generate plan based on genre and length
        plan = {
            "sections": [
                {
                    "id": "intro",
                    "type": "intro",
                    "wordCountTarget": 20,
                    "durationTarget": "0:10",
                    "order": 1
                },
                {
                    "id": "verse1",
                    "type": "verse",
                    "wordCountTarget": 80,
                    "durationTarget": "0:30",
                    "order": 2
                },
                {
                    "id": "chorus1",
                    "type": "chorus",
                    "wordCountTarget": 60,
                    "durationTarget": "0:30",
                    "order": 3
                },
                {
                    "id": "verse2",
                    "type": "verse",
                    "wordCountTarget": 80,
                    "durationTarget": "0:30",
                    "order": 4
                },
                {
                    "id": "chorus2",
                    "type": "chorus",
                    "wordCountTarget": 60,
                    "durationTarget": "0:30",
                    "order": 5
                },
                {
                    "id": "bridge",
                    "type": "bridge",
                    "wordCountTarget": 40,
                    "durationTarget": "0:20",
                    "order": 6
                },
                {
                    "id": "chorus3",
                    "type": "chorus",
                    "wordCountTarget": 60,
                    "durationTarget": "0:30",
                    "order": 7
                },
                {
                    "id": "outro",
                    "type": "outro",
                    "wordCountTarget": 20,
                    "durationTarget": "0:20",
                    "order": 8
                }
            ],
            "evaluationTargets": {
                "hookDensity": 0.85,
                "singability": 0.90,
                "rhymeTightness": 0.80,
                "sectionCompleteness": 1.0
            },
            "totalWordCount": 420,
            "sectionOrder": [
                "intro", "verse1", "chorus1", "verse2",
                "chorus2", "bridge", "chorus3", "outro"
            ]
        }

        # Compute artifact hash
        artifact_hash = compute_artifact_hash(plan)

        # Calculate execution time
        execution_time_ms = int((time.time() - start_time) * 1000)

        # Emit end event
        events.append({
            "ts": datetime.utcnow().isoformat() + "Z",
            "phase": "end",
            "message": f"PLAN skill completed in {execution_time_ms}ms"
        })

        # Return validated output
        return PlanOutput(
            status="success",
            execution_time_ms=execution_time_ms,
            artifact_hash=artifact_hash,
            metrics={
                "sections_planned": len(plan["sections"]),
                "total_word_count": plan["totalWordCount"]
            },
            events=events,
            errors=[],
            plan=plan
        )

    except Exception as e:
        execution_time_ms = int((time.time() - start_time) * 1000)
        events.append({
            "ts": datetime.utcnow().isoformat() + "Z",
            "phase": "error",
            "message": f"PLAN skill failed: {str(e)}"
        })

        return PlanOutput(
            status="failed",
            execution_time_ms=execution_time_ms,
            metrics={},
            events=events,
            errors=[str(e)],
            plan={}  # Empty plan on failure
        )


def example_implement_skill(context: WorkflowContext):
    """
    Demonstrate implementing and executing a skill with contracts.
    """
    print("\n=== Example 2: Implementing a Skill ===")

    # Create input
    sds = {
        "title": "Summer Nights",
        "genre": "pop",
        "targetLength": "3:30",
        "constraints": {"explicit": False},
        "style": {
            "bpm": 120,
            "key": "C major",
            "mood": ["upbeat", "energetic"]
        }
    }

    plan_input = PlanInput(context=context, sds=sds)

    # Execute skill
    plan_output = plan_skill(plan_input)

    # Check output
    print(f"Status: {plan_output.status}")
    print(f"Execution Time: {plan_output.execution_time_ms}ms")
    print(f"Artifact Hash: {plan_output.artifact_hash}")
    print(f"Sections Planned: {plan_output.metrics.get('sections_planned')}")
    print(f"Total Word Count: {plan_output.metrics.get('total_word_count')}")
    print(f"Events Emitted: {len(plan_output.events)}")

    # Validate output structure
    assert plan_output.status == "success"
    assert "sections" in plan_output.plan
    assert len(plan_output.plan["sections"]) == 8

    print("\n✓ Skill executed successfully and output validated")

    return plan_output


# =============================================================================
# Example 3: Validating Inputs/Outputs
# =============================================================================

def example_validate_schemas():
    """
    Demonstrate Pydantic validation of skill contracts.
    """
    print("\n=== Example 3: Validating Schemas ===")

    context = WorkflowContext(
        run_id="test-run",
        song_id="test-song",
        seed=123
    )

    # Valid input passes validation
    valid_sds = {
        "genre": "pop",
        "targetLength": "3:00",
        "style": {}
    }
    try:
        valid_input = PlanInput(context=context, sds=valid_sds)
        print("✓ Valid input accepted")
    except ValueError as e:
        print(f"✗ Unexpected validation error: {e}")

    # Invalid input fails validation (missing required fields)
    invalid_sds = {
        "title": "Song"
        # Missing "genre" and "targetLength"
    }
    try:
        invalid_input = PlanInput(context=context, sds=invalid_sds)
        print("✗ Invalid input should have been rejected")
    except ValueError as e:
        print(f"✓ Validation caught missing fields: {e}")

    # Output with invalid status/errors combo
    try:
        invalid_output = PlanOutput(
            status="failed",  # Failed status requires errors
            execution_time_ms=100,
            plan={},
            errors=[]  # Empty errors list!
        )
        print("✗ Invalid output should have been rejected")
    except ValueError as e:
        print(f"✓ Validation caught status/errors mismatch: {e}")

    # Output with invalid total_score (ValidateOutput example)
    try:
        invalid_score = ValidateOutput(
            status="success",
            execution_time_ms=100,
            validation_report={},
            scores={"hookDensity": 1.5},  # Score > 1.0!
            total_score=0.85,
            passed=True,
            issues=[]
        )
        print("✗ Invalid score should have been rejected")
    except ValueError as e:
        print(f"✓ Validation caught out-of-range score: {e}")


# =============================================================================
# Example 4: Chaining Skills Together
# =============================================================================

def style_skill(input: StyleInput) -> StyleOutput:
    """
    Example STYLE skill implementation.

    Generates style specification based on SDS and plan.
    """
    start_time = time.time()

    # Generate style
    style = {
        "genre": input.sds.get("genre", "pop"),
        "bpm": 120,
        "key": "C major",
        "mood": ["upbeat", "energetic"],
        "instrumentation": ["synth", "drums", "bass", "guitar"],
        "tags": ["melodic", "catchy", "anthemic"],
        "vocalStyle": "powerful"
    }

    # Simulate conflict resolution
    conflicts_resolved = []
    if "whisper" in style.get("tags", []) and "anthemic" in style.get("tags", []):
        style["tags"].remove("whisper")
        conflicts_resolved.append("whisper vs anthemic -> removed whisper")

    execution_time_ms = int((time.time() - start_time) * 1000)
    artifact_hash = compute_artifact_hash(style)

    return StyleOutput(
        status="success",
        execution_time_ms=execution_time_ms,
        artifact_hash=artifact_hash,
        metrics={"tags_generated": len(style.get("tags", []))},
        events=[],
        errors=[],
        style=style,
        conflicts_resolved=conflicts_resolved
    )


def example_chain_skills(context: WorkflowContext):
    """
    Demonstrate chaining PLAN → STYLE skills.
    """
    print("\n=== Example 4: Chaining Skills ===")

    # Step 1: PLAN
    sds = {
        "title": "Summer Nights",
        "genre": "pop",
        "targetLength": "3:30"
    }
    plan_input = PlanInput(context=context, sds=sds)
    plan_output = plan_skill(plan_input)

    print(f"PLAN: {plan_output.status} in {plan_output.execution_time_ms}ms")

    # Step 2: STYLE (uses PLAN output)
    blueprint = {
        "genre": "pop",
        "bpmRange": {"min": 100, "max": 140},
        "allowedTags": ["melodic", "catchy", "anthemic"],
        "conflictMatrix": {"whisper": ["anthemic"]}
    }
    style_input = StyleInput(
        context=context,
        sds=sds,
        plan=plan_output.plan,  # Pass PLAN output
        blueprint=blueprint
    )
    style_output = style_skill(style_input)

    print(f"STYLE: {style_output.status} in {style_output.execution_time_ms}ms")
    print(f"Conflicts Resolved: {style_output.conflicts_resolved}")

    # Track provenance
    print("\nProvenance Chain:")
    print(f"  PLAN artifact: {plan_output.artifact_hash}")
    print(f"  STYLE artifact: {style_output.artifact_hash}")

    print("\n✓ Skills chained successfully")


# =============================================================================
# Example 5: Error Handling
# =============================================================================

def example_error_handling(context: WorkflowContext):
    """
    Demonstrate error handling in skill execution.
    """
    print("\n=== Example 5: Error Handling ===")

    # Create invalid SDS (will cause error in skill)
    invalid_sds = {
        "genre": "unknown_genre",
        "targetLength": "invalid"
    }

    plan_input = PlanInput(context=context, sds=invalid_sds)

    # Execute skill (will handle error internally)
    plan_output = plan_skill(plan_input)

    if plan_output.status == "failed":
        print(f"✓ Skill failed as expected")
        print(f"  Errors: {plan_output.errors}")
        print(f"  Execution Time: {plan_output.execution_time_ms}ms")
        print(f"  Events: {len(plan_output.events)}")
    else:
        print(f"✗ Skill should have failed but got: {plan_output.status}")


# =============================================================================
# Example 6: Computing Artifact Hashes
# =============================================================================

def example_artifact_hashing():
    """
    Demonstrate deterministic artifact hashing for provenance.
    """
    print("\n=== Example 6: Artifact Hashing ===")

    artifact1 = {
        "genre": "pop",
        "bpm": 120,
        "key": "C major"
    }

    artifact2 = {
        "key": "C major",  # Different order
        "bpm": 120,
        "genre": "pop"
    }

    hash1 = compute_artifact_hash(artifact1)
    hash2 = compute_artifact_hash(artifact2)

    print(f"Artifact 1 hash: {hash1}")
    print(f"Artifact 2 hash: {hash2}")
    print(f"Hashes match: {hash1 == hash2}")

    assert hash1 == hash2, "Hashes should match (order-independent)"
    print("\n✓ Artifact hashing is deterministic (order-independent)")

    # Different content produces different hash
    artifact3 = {
        "genre": "rock",  # Different genre
        "bpm": 120,
        "key": "C major"
    }

    hash3 = compute_artifact_hash(artifact3)
    print(f"\nArtifact 3 hash: {hash3}")
    assert hash1 != hash3, "Different content should produce different hash"
    print("✓ Different artifacts produce different hashes")


# =============================================================================
# Example 7: Using Model Validation
# =============================================================================

def example_model_validation():
    """
    Demonstrate using Pydantic's model_validate for dict coercion.
    """
    print("\n=== Example 7: Model Validation ===")

    # Raw dictionary from API or database
    raw_context = {
        "run_id": "test-run-123",
        "song_id": "song-456",
        "seed": 42,
        "created_at": "2025-11-18T10:00:00",
        "feature_flags": {
            "render.suno.enabled": True
        }
    }

    # Coerce dict to WorkflowContext
    context = WorkflowContext.model_validate(raw_context)

    print(f"✓ Coerced dict to WorkflowContext")
    print(f"  Type: {type(context)}")
    print(f"  Run ID: {context.run_id}")
    print(f"  Seed: {context.seed}")

    # Serialize back to dict
    context_dict = context.model_dump()
    print(f"\n✓ Serialized back to dict")
    print(f"  Keys: {list(context_dict.keys())}")


# =============================================================================
# Main: Run All Examples
# =============================================================================

def main():
    """Run all skill contract usage examples."""
    print("=" * 80)
    print("AMCS Skill Contract Usage Examples")
    print("=" * 80)

    # Example 1: Create context
    context = example_create_context()

    # Example 2: Implement skill
    plan_output = example_implement_skill(context)

    # Example 3: Validate schemas
    example_validate_schemas()

    # Example 4: Chain skills
    example_chain_skills(context)

    # Example 5: Error handling
    example_error_handling(context)

    # Example 6: Artifact hashing
    example_artifact_hashing()

    # Example 7: Model validation
    example_model_validation()

    print("\n" + "=" * 80)
    print("All examples completed successfully!")
    print("=" * 80)


if __name__ == "__main__":
    main()
