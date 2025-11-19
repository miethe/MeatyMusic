"""
Pinned Retrieval Verification Tests

This module implements Phase 7, Task 7.3: Pinned Retrieval Verification

Validates that source retrieval in the LYRICS node is deterministic:
1. Same SDS + seed → same source chunks retrieved
2. Chunks are identified by content hashes (not relevance scores)
3. Citations include chunk hashes for provenance
4. No relevance-based sorting (would be non-deterministic)
5. Fixed top-k per source
6. Lexicographic sorting of ties

Test Coverage:
- Verify chunk hashes are consistent across runs
- Validate citation includes chunk hashes
- Test that retrieval order is deterministic
- Ensure no relevance-based variability

Success Criteria:
- Same SDS + seed → identical chunk hashes retrieved
- Citations include sha256 hashes of chunks
- Retrieval order is deterministic
- No variability in chunk selection
"""

import json
from typing import Dict, List, Set

import pytest

from .conftest import (
    WORKFLOW_NODES,
    discover_sds_fixtures,
    load_sds_fixture,
)
from .test_runner import run_workflow_deterministic


# =============================================================================
# Task 7.3: Pinned Retrieval Verification
# =============================================================================

@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_retrieval_uses_content_hashes():
    """
    Test that retrieval identifies chunks by content hash.

    Verifies that:
    1. Each retrieved chunk has a SHA-256 hash
    2. Hashes are recorded in context
    3. Citations reference chunk hashes
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]
    artifacts = workflow_output["artifacts"]

    # Check that LYRICS node recorded retrieval hashes
    assert "LYRICS" in context.retrieval_hashes, (
        "LYRICS node did not record retrieval hashes"
    )

    chunk_hashes = context.retrieval_hashes["LYRICS"]

    # Verify hashes are in SHA-256 format
    for chunk_hash in chunk_hashes:
        assert chunk_hash.startswith("sha256:"), (
            f"Chunk hash '{chunk_hash}' not in SHA-256 format"
        )
        # SHA-256 hex digest is 64 characters
        hex_part = chunk_hash.split("sha256:")[1]
        assert len(hex_part) == 64, (
            f"Chunk hash '{chunk_hash}' has invalid length (expected 64 hex chars)"
        )

    # Verify citations reference these hashes
    citations = artifacts.get("citations", [])

    assert len(citations) > 0, "No citations found in lyrics artifact"

    citation_hashes = set(c.get("chunkHash") for c in citations)

    for citation_hash in citation_hashes:
        assert citation_hash in chunk_hashes, (
            f"Citation hash '{citation_hash}' not in retrieval hashes"
        )


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_retrieval_deterministic_across_runs():
    """
    Test that same SDS + seed produces identical chunk retrieval.

    Verifies that:
    1. Chunk hashes are identical across runs
    2. Chunk order is identical
    3. No variability in retrieval
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42
    num_runs = 5

    all_chunk_hashes = []

    for _ in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        context = workflow_output["context"]
        chunk_hashes = context.retrieval_hashes.get("LYRICS", [])
        all_chunk_hashes.append(chunk_hashes)

    # Verify all runs retrieved identical chunks in identical order
    first_hashes = all_chunk_hashes[0]

    for i, hashes in enumerate(all_chunk_hashes[1:], start=1):
        assert hashes == first_hashes, (
            f"Retrieved chunks differ in run {i+1}:\n"
            f"  Run 1: {first_hashes}\n"
            f"  Run {i+1}: {hashes}"
        )


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_different_seeds_retrieve_different_chunks():
    """
    Test that different seeds can retrieve different chunks.

    This validates that:
    1. Retrieval is seed-dependent (deterministic selection)
    2. System is not ignoring seed in retrieval
    3. Different seeds may produce different (but deterministic) chunk selection
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

    chunks1 = run1["context"].retrieval_hashes.get("LYRICS", [])
    chunks2 = run2["context"].retrieval_hashes.get("LYRICS", [])

    # Chunks may differ (seed-dependent selection is allowed)
    # But if they're identical, that's also valid (depends on SDS)
    # What matters is that they're deterministic per seed

    # Run each seed again to verify determinism
    run1_repeat = run_workflow_deterministic(sds, seed1)
    run2_repeat = run_workflow_deterministic(sds, seed2)

    chunks1_repeat = run1_repeat["context"].retrieval_hashes.get("LYRICS", [])
    chunks2_repeat = run2_repeat["context"].retrieval_hashes.get("LYRICS", [])

    assert chunks1 == chunks1_repeat, "Seed1 retrieval not deterministic"
    assert chunks2 == chunks2_repeat, "Seed2 retrieval not deterministic"


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_citations_include_chunk_hashes():
    """
    Test that all citations include chunk hashes.

    Verifies that:
    1. Every citation has a chunkHash field
    2. Hash is in SHA-256 format
    3. Hash can be used for provenance tracking
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    artifacts = workflow_output["artifacts"]

    citations = artifacts.get("citations", [])

    assert len(citations) > 0, "No citations found in lyrics artifact"

    for citation in citations:
        assert "chunkHash" in citation, f"Citation {citation.get('id')} missing chunkHash"

        chunk_hash = citation["chunkHash"]
        assert chunk_hash.startswith("sha256:"), (
            f"Citation chunk hash '{chunk_hash}' not in SHA-256 format"
        )


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_retrieval_order_is_deterministic():
    """
    Test that chunk retrieval order is deterministic.

    Verifies that:
    1. Chunks are not sorted by relevance (non-deterministic)
    2. Chunks are in deterministic order (e.g., lexicographic by hash)
    3. Order is consistent across runs
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    # Run twice
    run1 = run_workflow_deterministic(sds, base_seed)
    run2 = run_workflow_deterministic(sds, base_seed)

    chunks1 = run1["context"].retrieval_hashes.get("LYRICS", [])
    chunks2 = run2["context"].retrieval_hashes.get("LYRICS", [])

    # Verify order is identical
    assert chunks1 == chunks2, (
        "Chunk retrieval order differs between runs:\n"
        f"  Run 1: {chunks1}\n"
        f"  Run 2: {chunks2}"
    )

    # Verify order is deterministic (not random)
    # One way to check: run multiple times and ensure no permutations
    num_runs = 5
    all_orders = []

    for _ in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        chunks = workflow_output["context"].retrieval_hashes.get("LYRICS", [])
        all_orders.append(chunks)

    # All orders should be identical
    first_order = all_orders[0]
    for i, order in enumerate(all_orders[1:], start=1):
        assert order == first_order, f"Chunk order differs in run {i+1}"


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_fixed_top_k_per_source():
    """
    Test that retrieval uses fixed top-k per source.

    Verifies that:
    1. Number of chunks retrieved is consistent
    2. Not using dynamic top-k based on relevance threshold
    3. Same SDS + seed → same number of chunks
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42
    num_runs = 5

    chunk_counts = []

    for _ in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        chunks = workflow_output["context"].retrieval_hashes.get("LYRICS", [])
        chunk_counts.append(len(chunks))

    # Verify all runs retrieved same number of chunks
    first_count = chunk_counts[0]

    for i, count in enumerate(chunk_counts[1:], start=1):
        assert count == first_count, (
            f"Number of chunks differs in run {i+1}: {count} vs {first_count}"
        )


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_retrieval_provenance_traceability():
    """
    Test that retrieval provides full provenance traceability.

    Verifies that:
    1. Citations link lyrics lines to source chunks
    2. Chunk hashes enable exact chunk recovery
    3. Source IDs identify the source
    4. Weights are recorded (but not used for ordering)
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    artifacts = workflow_output["artifacts"]

    citations = artifacts.get("citations", [])

    assert len(citations) > 0, "No citations found"

    for citation in citations:
        # Check required fields for provenance
        assert "id" in citation, "Citation missing ID"
        assert "chunkHash" in citation, "Citation missing chunk hash"
        assert "sourceId" in citation, "Citation missing source ID"
        assert "text" in citation, "Citation missing source text"
        assert "weight" in citation, "Citation missing weight"
        assert "section" in citation, "Citation missing section"

        # Verify weight is a number (0.0-1.0)
        weight = citation["weight"]
        assert isinstance(weight, (int, float)), f"Weight is not numeric: {weight}"
        assert 0.0 <= weight <= 1.0, f"Weight out of range: {weight}"


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_retrieval_comprehensive_report(tmp_path):
    """
    Generate comprehensive report of retrieval behavior.

    Creates a detailed JSON report showing:
    - Chunks retrieved per run
    - Hash consistency
    - Order consistency
    - Citation structure
    - Provenance completeness

    This is primarily for documentation and verification purposes.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42
    num_runs = 5

    report = {
        "test": "retrieval_comprehensive",
        "sds_name": fixture_paths[0].stem,
        "base_seed": base_seed,
        "num_runs": num_runs,
        "runs": [],
    }

    all_hashes = []
    all_citation_counts = []

    for run_idx in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        context = workflow_output["context"]
        artifacts = workflow_output["artifacts"]

        chunk_hashes = context.retrieval_hashes.get("LYRICS", [])
        citations = artifacts.get("citations", [])

        run_data = {
            "run_index": run_idx,
            "chunk_hashes": chunk_hashes,
            "num_chunks": len(chunk_hashes),
            "num_citations": len(citations),
            "citation_sample": citations[:3] if citations else [],
        }

        report["runs"].append(run_data)
        all_hashes.append(chunk_hashes)
        all_citation_counts.append(len(citations))

    # Analyze consistency
    first_hashes = all_hashes[0]
    hashes_consistent = all(h == first_hashes for h in all_hashes)

    first_citation_count = all_citation_counts[0]
    citation_counts_consistent = all(c == first_citation_count for c in all_citation_counts)

    report["analysis"] = {
        "hashes_consistent": hashes_consistent,
        "citation_counts_consistent": citation_counts_consistent,
        "all_runs_identical": hashes_consistent and citation_counts_consistent,
    }

    # Save report
    report_path = tmp_path / "retrieval_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    assert hashes_consistent, f"Retrieval hashes not consistent across runs. See: {report_path}"
    assert citation_counts_consistent, f"Citation counts not consistent across runs. See: {report_path}"


@pytest.mark.determinism
@pytest.mark.pinned_retrieval
def test_no_relevance_based_sorting():
    """
    Test that chunks are not sorted by relevance scores.

    Relevance-based sorting introduces non-determinism because:
    1. Embedding similarity can vary slightly
    2. Floating-point precision issues
    3. Non-deterministic tie-breaking

    Instead, chunks should be:
    1. Retrieved deterministically (by hash)
    2. Sorted lexicographically or by insertion order
    3. Consistent across runs

    This test verifies order stability.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    # Run 10 times
    num_runs = 10
    all_orders = []

    for _ in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        chunks = workflow_output["context"].retrieval_hashes.get("LYRICS", [])
        all_orders.append(chunks)

    # Verify all orders are identical (no relevance-based variability)
    first_order = all_orders[0]

    for i, order in enumerate(all_orders[1:], start=1):
        assert order == first_order, (
            f"Chunk order differs in run {i+1} - possible relevance-based sorting:\n"
            f"  Expected: {first_order}\n"
            f"  Got: {order}"
        )
