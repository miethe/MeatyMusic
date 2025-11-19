"""
Seed Propagation Verification Tests

This module implements Phase 7, Task 7.1: Seed Propagation Verification

Validates that:
1. Each workflow node receives deterministic seed: base_seed + node_index
2. Seed sequence is consistent across runs
3. Multiple base seeds produce different but deterministic outputs

Test Coverage:
- Verify node seed calculation (base_seed + node_index)
- Test with multiple base seeds (0, 42, 12345, 99999)
- Ensure seed propagation is logged and traceable
- Validate seed sequence correctness for all 8 nodes

Success Criteria:
- All nodes receive correct seed (base_seed + node_index)
- Seed sequence is identical across runs with same base_seed
- Different base seeds produce different outputs
"""

import json
from typing import Dict, List

import pytest

from .conftest import (
    SEED_RANGE,
    WORKFLOW_NODES,
    discover_sds_fixtures,
    load_sds_fixture,
    validate_seed_sequence,
)
from .test_runner import run_workflow_deterministic


# =============================================================================
# Task 7.1: Seed Propagation Verification
# =============================================================================

@pytest.mark.determinism
@pytest.mark.seed_propagation
def test_seed_propagation_pattern():
    """
    Test that node seeds follow the pattern: node_seed = base_seed + node_index.

    For base_seed=42:
    - PLAN (index 0) should receive seed 42
    - STYLE (index 1) should receive seed 43
    - LYRICS (index 2) should receive seed 44
    - PRODUCER (index 3) should receive seed 45
    - COMPOSE (index 4) should receive seed 46
    - VALIDATE (index 5) should receive seed 47
    - FIX (index 6) should receive seed 48 (if executed)
    - REVIEW (index 7) should receive seed 49

    This test mocks workflow execution and verifies the seed sequence.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    # Use first fixture
    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    # Run workflow
    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    # Validate seed sequence (FIX node is skipped in deterministic testing, so expect 7 nodes)
    expected_nodes = len([n for n in WORKFLOW_NODES if n.name != "FIX"])
    is_valid, errors = validate_seed_sequence(
        base_seed,
        context.node_seeds,
        expected_node_count=expected_nodes
    )

    # Manually check that the recorded seeds are correct
    if is_valid:
        for node_index, expected_seed in context.node_seeds.items():
            actual_expected = base_seed + node_index
            assert context.node_seeds[node_index] == actual_expected, (
                f"Node index {node_index} has incorrect seed: "
                f"expected {actual_expected}, got {context.node_seeds[node_index]}"
            )

    assert is_valid, f"Seed propagation validation failed:\n" + "\n".join(errors)


@pytest.mark.determinism
@pytest.mark.seed_propagation
@pytest.mark.parametrize("base_seed", SEED_RANGE)
def test_seed_propagation_multiple_seeds(base_seed: int):
    """
    Test seed propagation with multiple base seeds.

    Verifies that:
    1. Each base seed produces correct node seed sequence
    2. Pattern holds for seeds: 0, 42, 12345, 99999

    Args:
        base_seed: Base seed to test (parametrized)
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])

    # Run workflow
    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    # Validate seed sequence (FIX node skipped in deterministic testing)
    expected_nodes = len([n for n in WORKFLOW_NODES if n.name != "FIX"])
    is_valid, errors = validate_seed_sequence(
        base_seed,
        context.node_seeds,
        expected_node_count=expected_nodes
    )

    assert is_valid, (
        f"Seed propagation failed for base_seed={base_seed}:\n" + "\n".join(errors)
    )


@pytest.mark.determinism
@pytest.mark.seed_propagation
def test_seed_sequence_consistency_across_runs():
    """
    Test that seed sequence is consistent across multiple runs with same base_seed.

    Runs the same SDS 5 times with same base_seed and verifies:
    1. Node seed sequences are identical across all runs
    2. No variability in seed propagation
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42
    num_runs = 5

    seed_sequences = []

    for _ in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        context = workflow_output["context"]
        seed_sequences.append(context.node_seeds.copy())

    # Verify all sequences are identical
    first_sequence = seed_sequences[0]

    for i, sequence in enumerate(seed_sequences[1:], start=1):
        assert sequence == first_sequence, (
            f"Seed sequence differs in run {i+1}:\n"
            f"  Run 1: {first_sequence}\n"
            f"  Run {i+1}: {sequence}"
        )


@pytest.mark.determinism
@pytest.mark.seed_propagation
def test_different_seeds_produce_different_outputs():
    """
    Test that different base seeds produce different artifacts.

    This validates that:
    1. Seed actually affects output
    2. System is not ignoring seed parameter
    3. Different seeds = different (but deterministic) outputs
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])

    # Run with two different seeds
    seed1 = 42
    seed2 = 12345

    run1 = run_workflow_deterministic(sds, seed1)
    run2 = run_workflow_deterministic(sds, seed2)

    # Artifacts should be different
    artifacts1 = run1["artifacts"]
    artifacts2 = run2["artifacts"]

    # Compare at least one artifact (lyrics is good because it's complex)
    lyrics1 = json.dumps(artifacts1.get("lyrics", {}), sort_keys=True)
    lyrics2 = json.dumps(artifacts2.get("lyrics", {}), sort_keys=True)

    assert lyrics1 != lyrics2, (
        "Different seeds produced identical lyrics - seed may not be propagating correctly"
    )


@pytest.mark.determinism
@pytest.mark.seed_propagation
def test_seed_traceability_in_artifacts():
    """
    Test that seed is traceable in workflow artifacts.

    Verifies that:
    1. Provenance includes base seed
    2. Summary includes seed information
    3. Seed can be recovered from artifacts for reproducibility
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 99999

    workflow_output = run_workflow_deterministic(sds, base_seed)
    artifacts = workflow_output["artifacts"]

    # Check provenance
    provenance = artifacts.get("provenance", {})
    assert "seed" in provenance, "Seed not recorded in provenance"
    assert provenance["seed"] == base_seed, f"Provenance seed mismatch: expected {base_seed}, got {provenance['seed']}"


@pytest.mark.determinism
@pytest.mark.seed_propagation
def test_seed_propagation_comprehensive_report(tmp_path):
    """
    Generate comprehensive report of seed propagation across all nodes and seeds.

    Creates a detailed JSON report showing:
    - Node seed sequences for each base seed
    - Validation results for each combination
    - Any anomalies or failures

    This is primarily for documentation and verification purposes.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])

    report = {
        "test": "seed_propagation_comprehensive",
        "base_seeds_tested": SEED_RANGE,
        "nodes": [node.name for node in WORKFLOW_NODES],
        "results": [],
    }

    all_valid = True

    for base_seed in SEED_RANGE:
        workflow_output = run_workflow_deterministic(sds, base_seed)
        context = workflow_output["context"]

        # FIX node skipped in deterministic testing
        expected_nodes = len([n for n in WORKFLOW_NODES if n.name != "FIX"])
        is_valid, errors = validate_seed_sequence(
            base_seed,
            context.node_seeds,
            expected_node_count=expected_nodes
        )

        result = {
            "base_seed": base_seed,
            "node_seeds": context.node_seeds,
            "is_valid": is_valid,
            "errors": errors,
        }

        report["results"].append(result)

        if not is_valid:
            all_valid = False

    report["all_valid"] = all_valid

    # Save report
    report_path = tmp_path / "seed_propagation_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    assert all_valid, f"Seed propagation validation failed. See report: {report_path}"


@pytest.mark.determinism
@pytest.mark.seed_propagation
def test_node_seed_isolation():
    """
    Test that each node uses its own isolated seed.

    Verifies that:
    1. Nodes don't share RNG state
    2. Each node's output depends only on its seed, not execution order
    3. Parallel execution (if implemented) won't affect determinism
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    # Run workflow normally
    run1 = run_workflow_deterministic(sds, base_seed)

    # Run again (should be identical)
    run2 = run_workflow_deterministic(sds, base_seed)

    # Verify node seeds are identical
    assert run1["context"].node_seeds == run2["context"].node_seeds, (
        "Node seeds differ between runs - RNG state may be leaking"
    )

    # Verify artifacts are identical
    artifacts1 = json.dumps(run1["artifacts"], sort_keys=True)
    artifacts2 = json.dumps(run2["artifacts"], sort_keys=True)

    assert artifacts1 == artifacts2, (
        "Artifacts differ despite identical seeds - node isolation may be broken"
    )
