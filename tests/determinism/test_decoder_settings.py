"""
Decoder Settings Validation Tests

This module implements Phase 7, Task 7.2: Decoder Settings Validation

Validates that all text-generating nodes (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, FIX)
use deterministic decoder settings:
- temperature <= 0.3 (low variance)
- top_p <= 0.9 (fixed)
- frequency_penalty == 0
- presence_penalty == 0

Test Coverage:
- Verify decoder settings for each LLM node
- Test that settings are consistent across runs
- Validate settings are within deterministic ranges
- Ensure no unexpected parameters

Success Criteria:
- All LLM nodes use temperature <= 0.3
- All LLM nodes use top_p <= 0.9
- All LLM nodes use frequency_penalty == 0
- All LLM nodes use presence_penalty == 0
- Settings are identical across runs
"""

import json
from typing import Dict, List

import pytest

from .conftest import (
    EXPECTED_DECODER_SETTINGS,
    WORKFLOW_NODES,
    discover_sds_fixtures,
    load_sds_fixture,
    validate_decoder_settings,
)
from .test_runner import run_workflow_deterministic


# Nodes that require LLM and should have decoder settings
LLM_NODES = [node.name for node in WORKFLOW_NODES if node.requires_llm]


# =============================================================================
# Task 7.2: Decoder Settings Validation
# =============================================================================

@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_all_llm_nodes_have_decoder_settings():
    """
    Test that all LLM nodes record decoder settings.

    Verifies that:
    1. All nodes that require LLM (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, FIX) record settings
    2. Non-LLM nodes (VALIDATE, REVIEW) do not use decoder settings
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    # Check that all LLM nodes have decoder settings
    for node_name in LLM_NODES:
        if node_name == "FIX":
            # FIX is skipped in deterministic testing
            continue

        assert node_name in context.decoder_settings, (
            f"LLM node '{node_name}' did not record decoder settings"
        )

    # Check that non-LLM nodes don't have decoder settings
    non_llm_nodes = [node.name for node in WORKFLOW_NODES if not node.requires_llm]
    for node_name in non_llm_nodes:
        assert node_name not in context.decoder_settings, (
            f"Non-LLM node '{node_name}' unexpectedly has decoder settings"
        )


@pytest.mark.determinism
@pytest.mark.decoder_settings
@pytest.mark.parametrize("node_name", [n for n in LLM_NODES if n != "FIX"])
def test_decoder_settings_per_node(node_name: str):
    """
    Test decoder settings for each LLM node individually.

    Validates that each node uses deterministic settings:
    - temperature <= 0.3
    - top_p <= 0.9
    - frequency_penalty == 0
    - presence_penalty == 0

    Args:
        node_name: Name of the workflow node to test (parametrized)
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    # Get decoder settings for this node
    actual_settings = context.decoder_settings.get(node_name)

    assert actual_settings is not None, f"Node '{node_name}' has no decoder settings"

    # Validate settings
    is_valid, errors = validate_decoder_settings(node_name, actual_settings)

    assert is_valid, (
        f"Decoder settings validation failed for node '{node_name}':\n" + "\n".join(errors)
    )


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_decoder_settings_consistency_across_runs():
    """
    Test that decoder settings are consistent across multiple runs.

    Verifies that:
    1. Same node uses same settings across runs
    2. No variability in decoder configuration
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42
    num_runs = 5

    all_settings = []

    for _ in range(num_runs):
        workflow_output = run_workflow_deterministic(sds, base_seed)
        context = workflow_output["context"]
        all_settings.append(context.decoder_settings.copy())

    # Verify all runs have identical settings
    first_settings = all_settings[0]

    for i, settings in enumerate(all_settings[1:], start=1):
        assert settings == first_settings, (
            f"Decoder settings differ in run {i+1}:\n"
            f"  Run 1: {first_settings}\n"
            f"  Run {i+1}: {settings}"
        )


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_temperature_is_low_variance():
    """
    Test that all LLM nodes use low temperature (≤ 0.3).

    Low temperature ensures deterministic, focused outputs rather than
    creative, variable outputs.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    for node_name, settings in context.decoder_settings.items():
        temperature = settings.get("temperature")

        assert temperature is not None, f"Node '{node_name}' missing temperature setting"
        assert temperature <= 0.3, (
            f"Node '{node_name}' has high temperature {temperature} (expected ≤ 0.3)"
        )


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_top_p_is_fixed():
    """
    Test that all LLM nodes use fixed top_p (≤ 0.9).

    Fixed top_p ensures consistent sampling behavior.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    for node_name, settings in context.decoder_settings.items():
        top_p = settings.get("top_p")

        assert top_p is not None, f"Node '{node_name}' missing top_p setting"
        assert top_p <= 0.9, (
            f"Node '{node_name}' has variable top_p {top_p} (expected ≤ 0.9)"
        )


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_no_penalties():
    """
    Test that all LLM nodes use zero frequency and presence penalties.

    Penalties introduce non-determinism and are disabled for deterministic generation.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    for node_name, settings in context.decoder_settings.items():
        frequency_penalty = settings.get("frequency_penalty")
        presence_penalty = settings.get("presence_penalty")

        assert frequency_penalty == 0.0, (
            f"Node '{node_name}' has non-zero frequency_penalty {frequency_penalty}"
        )
        assert presence_penalty == 0.0, (
            f"Node '{node_name}' has non-zero presence_penalty {presence_penalty}"
        )


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_decoder_settings_comprehensive_report(tmp_path):
    """
    Generate comprehensive report of decoder settings across all LLM nodes.

    Creates a detailed JSON report showing:
    - Decoder settings for each node
    - Validation results
    - Comparison against expected settings
    - Any deviations or warnings

    This is primarily for documentation and verification purposes.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    report = {
        "test": "decoder_settings_comprehensive",
        "expected_settings": EXPECTED_DECODER_SETTINGS,
        "llm_nodes": LLM_NODES,
        "results": [],
    }

    all_valid = True

    for node_name, actual_settings in context.decoder_settings.items():
        is_valid, errors = validate_decoder_settings(node_name, actual_settings)

        result = {
            "node_name": node_name,
            "actual_settings": actual_settings,
            "expected_settings": EXPECTED_DECODER_SETTINGS,
            "is_valid": is_valid,
            "errors": errors,
        }

        report["results"].append(result)

        if not is_valid:
            all_valid = False

    report["all_valid"] = all_valid

    # Save report
    report_path = tmp_path / "decoder_settings_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    assert all_valid, f"Decoder settings validation failed. See report: {report_path}"


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_no_unexpected_decoder_parameters():
    """
    Test that no unexpected decoder parameters are used.

    Validates that only known, controlled parameters are set:
    - temperature
    - top_p
    - frequency_penalty
    - presence_penalty

    Any other parameters could introduce non-determinism.
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])
    base_seed = 42

    workflow_output = run_workflow_deterministic(sds, base_seed)
    context = workflow_output["context"]

    expected_keys = set(EXPECTED_DECODER_SETTINGS.keys())

    for node_name, settings in context.decoder_settings.items():
        actual_keys = set(settings.keys())
        unexpected_keys = actual_keys - expected_keys

        assert len(unexpected_keys) == 0, (
            f"Node '{node_name}' has unexpected decoder parameters: {unexpected_keys}"
        )


@pytest.mark.determinism
@pytest.mark.decoder_settings
def test_decoder_settings_different_seeds():
    """
    Test that decoder settings remain constant regardless of base seed.

    Verifies that:
    1. Decoder settings are not affected by seed
    2. Settings are truly configuration, not seed-dependent
    """
    fixture_paths = discover_sds_fixtures()

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    sds = load_sds_fixture(fixture_paths[0])

    # Test with different seeds
    seeds = [0, 42, 12345, 99999]
    all_settings = []

    for seed in seeds:
        workflow_output = run_workflow_deterministic(sds, seed)
        context = workflow_output["context"]
        all_settings.append(context.decoder_settings.copy())

    # Verify all runs have identical settings
    first_settings = all_settings[0]

    for i, settings in enumerate(all_settings[1:], start=1):
        assert settings == first_settings, (
            f"Decoder settings differ for seed {seeds[i]}:\n"
            f"  Seed {seeds[0]}: {first_settings}\n"
            f"  Seed {seeds[i]}: {settings}"
        )
