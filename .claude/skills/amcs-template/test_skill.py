"""Unit tests for {SKILL_NAME} skill.

Tests cover:
1. Basic functionality
2. Determinism (10 identical runs)
3. Input validation
4. Edge cases
5. Error handling
"""

import pytest
from uuid import uuid4

from app.skills.{skill_module} import {skill_function}
from app.workflows.skill import WorkflowContext


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_context():
    """Mock workflow context with fixed seed for determinism testing."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,  # Fixed seed for determinism
        node_index={NODE_INDEX},  # TODO: Set correct node index (0-7)
        node_name="{NODE_NAME}",  # TODO: Set node name (PLAN, STYLE, etc.)
    )


@pytest.fixture
def sample_input():
    """Sample valid input for {SKILL_NAME} skill."""
    # TODO: Replace with actual sample input matching your skill's contract
    return {
        "{input_key_1}": {
            # TODO: Add sample data
        },
        "{input_key_2}": {
            # TODO: Add sample data
        },
    }


@pytest.fixture
def invalid_input():
    """Sample invalid input for testing validation."""
    # TODO: Replace with invalid input that should trigger errors
    return {
        "{input_key_1}": None,  # Invalid value
    }


# ============================================================================
# Basic Functionality Tests
# ============================================================================

@pytest.mark.asyncio
async def test_{skill_name}_basic_generation(sample_input, mock_context):
    """Test basic {SKILL_NAME} generation produces valid output."""
    result = await {skill_function}(sample_input, mock_context)

    # TODO: Customize these assertions based on your output contract
    assert "{output_key}" in result
    output = result["{output_key}"]

    # Verify required fields
    assert "{required_field_1}" in output
    assert "{required_field_2}" in output
    assert "_hash" in output

    # Verify hash format (SHA-256 = 64 hex chars)
    assert len(output["_hash"]) == 64
    assert all(c in "0123456789abcdef" for c in output["_hash"])


@pytest.mark.asyncio
async def test_{skill_name}_metadata(sample_input, mock_context):
    """Test that execution metadata is included in output."""
    result = await {skill_function}(sample_input, mock_context)

    # Verify metadata structure (added by @workflow_skill decorator)
    assert "_metadata" in result
    metadata = result["_metadata"]

    assert "skill_name" in metadata
    assert "duration_ms" in metadata
    assert "input_hash" in metadata
    assert "output_hash" in metadata
    assert "seed" in metadata
    assert metadata["seed"] == mock_context.seed


# ============================================================================
# Determinism Tests (CRITICAL)
# ============================================================================

@pytest.mark.asyncio
@pytest.mark.parametrize("run_number", range(10))
async def test_{skill_name}_determinism_10_runs(sample_input, mock_context, run_number):
    """Test that same inputs + seed produce identical outputs over 10 runs.

    This is the most critical test for AMCS. Same SDS + seed MUST produce
    identical outputs for reproducibility.
    """
    result = await {skill_function}(sample_input, mock_context)
    output = result["{output_key}"]

    # Store first run result for comparison
    if run_number == 0:
        pytest.first_{skill_name}_hash = output["_hash"]
        pytest.first_{skill_name}_output = output
        # TODO: Add skill-specific fields to store
        # pytest.first_{skill_name}_{field} = output["{field}"]

    # All subsequent runs MUST match first run exactly
    assert output["_hash"] == pytest.first_{skill_name}_hash, \
        f"Run {run_number}: Hash mismatch! Determinism broken."

    # TODO: Add skill-specific assertions
    # assert output["{field}"] == pytest.first_{skill_name}_{field}, \
    #     f"Run {run_number}: {Field} mismatch!"


@pytest.mark.asyncio
async def test_{skill_name}_different_seeds_produce_different_outputs(sample_input):
    """Test that different seeds produce different outputs (when stochastic)."""
    # TODO: Skip this test if skill is purely deterministic with no randomness
    context_1 = WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index={NODE_INDEX},
        node_name="{NODE_NAME}",
    )

    context_2 = WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=99999,  # Different seed
        node_index={NODE_INDEX},
        node_name="{NODE_NAME}",
    )

    result_1 = await {skill_function}(sample_input, context_1)
    result_2 = await {skill_function}(sample_input, context_2)

    # Different seeds should produce different outputs (if stochastic)
    # TODO: Customize based on whether your skill uses randomness
    assert result_1["{output_key}"]["_hash"] != result_2["{output_key}"]["_hash"]


# ============================================================================
# Input Validation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_{skill_name}_rejects_invalid_input(invalid_input, mock_context):
    """Test that invalid inputs are rejected with clear error messages."""
    # TODO: Adjust expected exception based on your validation
    with pytest.raises((ValueError, KeyError)) as exc_info:
        await {skill_function}(invalid_input, mock_context)

    # Verify error message is informative
    error_message = str(exc_info.value)
    assert len(error_message) > 0
    # TODO: Add assertion for specific error message
    # assert "{expected_error_substring}" in error_message.lower()


@pytest.mark.asyncio
async def test_{skill_name}_validates_{specific_constraint}(sample_input, mock_context):
    """Test that {SPECIFIC_CONSTRAINT} is enforced."""
    # TODO: Replace with actual constraint validation test
    # Example: Test that tempo is within valid range
    sample_input["{field}"] = {invalid_value}

    with pytest.raises(ValueError, match="{ERROR_PATTERN}"):
        await {skill_function}(sample_input, mock_context)


# ============================================================================
# Edge Case Tests
# ============================================================================

@pytest.mark.asyncio
async def test_{skill_name}_handles_{edge_case}(sample_input, mock_context):
    """Test handling of {EDGE_CASE} edge case."""
    # TODO: Replace with actual edge case
    sample_input["{field}"] = {edge_case_value}

    result = await {skill_function}(sample_input, mock_context)
    output = result["{output_key}"]

    # TODO: Verify expected behavior for this edge case
    assert output["{field}"] == {expected_result}


@pytest.mark.asyncio
async def test_{skill_name}_handles_minimal_input(mock_context):
    """Test with minimal valid input (only required fields)."""
    minimal_input = {
        "{required_field_1}": {value},
        # Only include required fields
    }

    result = await {skill_function}(minimal_input, mock_context)

    # Should still produce valid output
    assert "{output_key}" in result
    assert result["{output_key}"]["_hash"]


# ============================================================================
# Policy Enforcement Tests
# ============================================================================

@pytest.mark.asyncio
async def test_{skill_name}_enforces_{policy}(sample_input, mock_context):
    """Test that {POLICY} is enforced."""
    # TODO: Replace with actual policy test
    # Example: Test profanity filter
    sample_input["{field}"] = "{policy_violating_value}"

    # Either raises error or sanitizes output
    # TODO: Adjust based on your policy enforcement approach
    result = await {skill_function}(sample_input, mock_context)
    output = result["{output_key}"]

    # Verify policy was enforced
    assert "{policy_violating_value}" not in str(output)


# ============================================================================
# Output Quality Tests
# ============================================================================

@pytest.mark.asyncio
async def test_{skill_name}_output_structure(sample_input, mock_context):
    """Test that output has correct structure and all required fields."""
    result = await {skill_function}(sample_input, mock_context)
    output = result["{output_key}"]

    # TODO: Customize based on your output schema
    required_fields = ["{field_1}", "{field_2}", "_hash"]
    for field in required_fields:
        assert field in output, f"Missing required field: {field}"


@pytest.mark.asyncio
async def test_{skill_name}_hash_stability(sample_input, mock_context):
    """Test that hash is stable across runs (same input => same hash)."""
    result_1 = await {skill_function}(sample_input, mock_context)
    result_2 = await {skill_function}(sample_input, mock_context)

    hash_1 = result_1["{output_key}"]["_hash"]
    hash_2 = result_2["{output_key}"]["_hash"]

    assert hash_1 == hash_2, "Hash unstable: same input produced different hashes"


# ============================================================================
# Integration-Style Tests
# ============================================================================

@pytest.mark.asyncio
async def test_{skill_name}_with_real_world_data(mock_context):
    """Test with realistic data similar to production use cases."""
    # TODO: Replace with realistic production-like data
    real_world_input = {
        "{field}": {realistic_value},
    }

    result = await {skill_function}(real_world_input, mock_context)
    output = result["{output_key}"]

    # Verify output makes sense for real-world use case
    # TODO: Add domain-specific assertions
    assert output["{field}"] is not None


# ============================================================================
# Performance Tests (Optional)
# ============================================================================

@pytest.mark.asyncio
@pytest.mark.slow  # Mark as slow to exclude from fast test runs
async def test_{skill_name}_performance(sample_input, mock_context):
    """Test that skill executes within acceptable time limits."""
    import time

    start_time = time.time()
    result = await {skill_function}(sample_input, mock_context)
    duration_seconds = time.time() - start_time

    # TODO: Adjust timeout based on expected performance
    # PLAN/VALIDATE: < 1s, STYLE/PRODUCER: < 2s, LYRICS/COMPOSE: < 5s
    max_duration_seconds = 5.0

    assert duration_seconds < max_duration_seconds, \
        f"Skill too slow: {duration_seconds:.2f}s (max: {max_duration_seconds}s)"

    # Also check metadata duration
    metadata_duration_ms = result["_metadata"]["duration_ms"]
    assert metadata_duration_ms < max_duration_seconds * 1000


# ============================================================================
# TODO: Add Skill-Specific Tests Below
# ============================================================================

# @pytest.mark.asyncio
# async def test_{skill_name}_{specific_feature}(sample_input, mock_context):
#     """Test {SPECIFIC_FEATURE}."""
#     # TODO: Add test
#     pass
