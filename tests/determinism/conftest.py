"""
Pytest Configuration and Shared Fixtures for Determinism Tests

This module provides:
- Fixture discovery and loading from fixtures/ directory
- Shared utilities for hash computation, artifact comparison
- Mock workflow execution infrastructure
- Determinism validation helpers

Fixtures:
- all_sds_fixtures: All 50 SDS JSON fixtures
- sds_fixture: Individual SDS fixture (parametrized)
- mock_workflow_context: Mock workflow context with seed
- artifact_hasher: SHA-256 hash utility for artifacts

Utilities:
- hash_artifact(): Compute deterministic hash of artifact
- compare_artifacts(): Deep comparison of two artifacts
- validate_seed_sequence(): Verify seed propagation correctness
"""

import glob
import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pytest
from pydantic import BaseModel

# Determinism test configuration
FIXTURES_DIR = Path(__file__).parent / "fixtures"
REPRODUCIBILITY_RUNS = 10  # Number of runs for reproducibility tests
SEED_RANGE = [0, 42, 12345, 99999]  # Seeds to test propagation with

# Expected decoder settings for deterministic generation
EXPECTED_DECODER_SETTINGS = {
    "temperature": 0.3,  # Low variance
    "top_p": 0.9,  # Fixed
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
}


class WorkflowNodeConfig(BaseModel):
    """Configuration for a workflow node in mock execution."""

    name: str
    index: int
    requires_llm: bool = False
    requires_retrieval: bool = False


# Workflow node definitions (matching AMCS workflow order)
WORKFLOW_NODES = [
    WorkflowNodeConfig(name="PLAN", index=0, requires_llm=True),
    WorkflowNodeConfig(name="STYLE", index=1, requires_llm=True),
    WorkflowNodeConfig(name="LYRICS", index=2, requires_llm=True, requires_retrieval=True),
    WorkflowNodeConfig(name="PRODUCER", index=3, requires_llm=True),
    WorkflowNodeConfig(name="COMPOSE", index=4, requires_llm=True),
    WorkflowNodeConfig(name="VALIDATE", index=5, requires_llm=False),
    WorkflowNodeConfig(name="FIX", index=6, requires_llm=True),
    WorkflowNodeConfig(name="REVIEW", index=7, requires_llm=False),
]


# =============================================================================
# Fixture Discovery
# =============================================================================

def discover_sds_fixtures() -> List[Path]:
    """
    Discover all SDS JSON fixtures in fixtures/ directory.

    Returns:
        List of Path objects to SDS JSON files
    """
    pattern = str(FIXTURES_DIR / "*.json")
    fixtures = [Path(p) for p in glob.glob(pattern)]
    return sorted(fixtures)  # Deterministic ordering


def load_sds_fixture(path: Path) -> Dict[str, Any]:
    """
    Load an SDS fixture from JSON file.

    Args:
        path: Path to SDS JSON file

    Returns:
        Dict containing SDS data

    Raises:
        ValueError: If JSON is invalid or missing required fields
    """
    with open(path, "r") as f:
        sds = json.load(f)

    # Validate minimum required fields
    required = {"title", "blueprint_ref", "style", "lyrics", "seed"}
    missing = required - set(sds.keys())
    if missing:
        raise ValueError(f"SDS {path.name} missing required fields: {missing}")

    return sds


@pytest.fixture(scope="session")
def all_sds_fixtures() -> List[Dict[str, Any]]:
    """
    Load all SDS fixtures for batch testing.

    Returns:
        List of SDS dictionaries (50 fixtures)
    """
    fixture_paths = discover_sds_fixtures()

    if len(fixture_paths) < 50:
        pytest.skip(f"Expected 50 SDS fixtures, found {len(fixture_paths)}")

    return [load_sds_fixture(p) for p in fixture_paths[:50]]


@pytest.fixture(params=discover_sds_fixtures())
def sds_fixture(request) -> Dict[str, Any]:
    """
    Parametrized fixture providing individual SDS fixtures.

    Usage:
        @pytest.mark.parametrize("sds_fixture", ..., indirect=True)
        def test_something(sds_fixture):
            assert sds_fixture["title"] is not None
    """
    return load_sds_fixture(request.param)


# =============================================================================
# Hash Computation Utilities
# =============================================================================

def normalize_artifact_for_hash(artifact: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize artifact for consistent hashing by removing non-deterministic fields.

    Removes:
    - Timestamps (created_at, updated_at, timestamp, ts)
    - UUIDs in certain contexts (run_id is kept for traceability)
    - Execution time metrics

    Args:
        artifact: Artifact dictionary to normalize

    Returns:
        Normalized artifact dictionary
    """
    # Fields to exclude from hash computation (non-deterministic)
    excluded_fields = {
        "created_at",
        "updated_at",
        "timestamp",
        "ts",
        "execution_time_ms",
        "duration_ms",
    }

    def _normalize(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {
                k: _normalize(v)
                for k, v in obj.items()
                if k not in excluded_fields
            }
        elif isinstance(obj, list):
            return [_normalize(item) for item in obj]
        else:
            return obj

    return _normalize(artifact)


def hash_artifact(artifact: Dict[str, Any]) -> str:
    """
    Compute SHA-256 hash of artifact for reproducibility comparison.

    Args:
        artifact: Artifact dictionary (style, lyrics, etc.)

    Returns:
        SHA-256 hash string (format: "sha256:hexdigest")
    """
    normalized = normalize_artifact_for_hash(artifact)

    # Sort keys for deterministic JSON serialization
    json_bytes = json.dumps(normalized, sort_keys=True, separators=(',', ':')).encode('utf-8')

    hash_obj = hashlib.sha256(json_bytes)
    return f"sha256:{hash_obj.hexdigest()}"


def hash_all_artifacts(artifacts: Dict[str, Any]) -> Dict[str, str]:
    """
    Compute hashes for all artifacts in a workflow output.

    Args:
        artifacts: Dictionary with keys like "style", "lyrics", "producer_notes", etc.

    Returns:
        Dictionary mapping artifact names to their SHA-256 hashes
    """
    return {
        name: hash_artifact(artifact)
        for name, artifact in artifacts.items()
        if isinstance(artifact, dict)
    }


# =============================================================================
# Artifact Comparison
# =============================================================================

def compare_artifacts(
    artifact1: Dict[str, Any],
    artifact2: Dict[str, Any],
    ignore_fields: Optional[List[str]] = None
) -> Tuple[bool, List[str]]:
    """
    Deep comparison of two artifacts, returning differences if any.

    Args:
        artifact1: First artifact
        artifact2: Second artifact
        ignore_fields: Optional list of fields to ignore in comparison

    Returns:
        Tuple of (are_equal: bool, differences: List[str])
    """
    ignore_fields = ignore_fields or []
    differences = []

    # Normalize both artifacts
    norm1 = normalize_artifact_for_hash(artifact1)
    norm2 = normalize_artifact_for_hash(artifact2)

    # Additional field ignoring
    for field in ignore_fields:
        norm1.pop(field, None)
        norm2.pop(field, None)

    def _compare(obj1: Any, obj2: Any, path: str = "") -> None:
        if type(obj1) != type(obj2):
            differences.append(f"{path}: type mismatch ({type(obj1).__name__} vs {type(obj2).__name__})")
            return

        if isinstance(obj1, dict):
            keys1, keys2 = set(obj1.keys()), set(obj2.keys())
            if keys1 != keys2:
                missing_in_2 = keys1 - keys2
                missing_in_1 = keys2 - keys1
                if missing_in_2:
                    differences.append(f"{path}: keys in artifact1 missing from artifact2: {missing_in_2}")
                if missing_in_1:
                    differences.append(f"{path}: keys in artifact2 missing from artifact1: {missing_in_1}")

            for key in keys1 & keys2:
                _compare(obj1[key], obj2[key], f"{path}.{key}" if path else key)

        elif isinstance(obj1, list):
            if len(obj1) != len(obj2):
                differences.append(f"{path}: list length mismatch ({len(obj1)} vs {len(obj2)})")
                return

            for i, (item1, item2) in enumerate(zip(obj1, obj2)):
                _compare(item1, item2, f"{path}[{i}]")

        else:
            if obj1 != obj2:
                differences.append(f"{path}: value mismatch ({obj1} vs {obj2})")

    _compare(norm1, norm2)

    return (len(differences) == 0, differences)


# =============================================================================
# Mock Workflow Execution
# =============================================================================

class MockWorkflowContext:
    """Mock workflow context for deterministic testing."""

    def __init__(self, run_id: str, song_id: str, seed: int):
        self.run_id = run_id
        self.song_id = song_id
        self.seed = seed
        self.feature_flags = {"eval.autofix.enabled": False}  # Disable autofix for determinism
        self.node_seeds = {}
        self.decoder_settings = {}
        self.retrieval_hashes = {}

    def get_node_seed(self, node_index: int) -> int:
        """Get deterministic seed for a workflow node."""
        node_seed = self.seed + node_index
        self.node_seeds[node_index] = node_seed
        return node_seed

    def record_decoder_settings(self, node_name: str, settings: Dict[str, Any]) -> None:
        """Record decoder settings used by a node."""
        self.decoder_settings[node_name] = settings

    def record_retrieval_hashes(self, node_name: str, chunk_hashes: List[str]) -> None:
        """Record chunk hashes retrieved by a node."""
        self.retrieval_hashes[node_name] = chunk_hashes


@pytest.fixture
def mock_workflow_context() -> MockWorkflowContext:
    """
    Create a mock workflow context with default seed.

    Returns:
        MockWorkflowContext with seed=42
    """
    return MockWorkflowContext(
        run_id="test-run-001",
        song_id="test-song-001",
        seed=42
    )


# =============================================================================
# Seed Propagation Validation
# =============================================================================

def validate_seed_sequence(
    base_seed: int,
    node_seeds: Dict[int, int],
    expected_node_count: int = 8
) -> Tuple[bool, List[str]]:
    """
    Validate that seed propagation follows the pattern: node_seed = base_seed + node_index.

    Args:
        base_seed: Base seed for the workflow run
        node_seeds: Dictionary mapping node_index -> actual_seed
        expected_node_count: Expected number of workflow nodes (default: 8)

    Returns:
        Tuple of (is_valid: bool, errors: List[str])
    """
    errors = []

    if len(node_seeds) != expected_node_count:
        errors.append(
            f"Expected {expected_node_count} node seeds, got {len(node_seeds)}"
        )

    # Validate that each recorded seed follows the pattern
    for node_index, actual_seed in node_seeds.items():
        expected_seed = base_seed + node_index

        if actual_seed != expected_seed:
            errors.append(
                f"Node {node_index}: Seed mismatch (expected {expected_seed}, got {actual_seed})"
            )

    return (len(errors) == 0, errors)


# =============================================================================
# Decoder Settings Validation
# =============================================================================

def validate_decoder_settings(
    node_name: str,
    actual_settings: Dict[str, Any],
    expected_settings: Dict[str, Any] = EXPECTED_DECODER_SETTINGS
) -> Tuple[bool, List[str]]:
    """
    Validate that decoder settings match deterministic requirements.

    Args:
        node_name: Name of the workflow node
        actual_settings: Actual decoder settings used
        expected_settings: Expected decoder settings for determinism

    Returns:
        Tuple of (is_valid: bool, errors: List[str])
    """
    errors = []

    for key, expected_value in expected_settings.items():
        actual_value = actual_settings.get(key)

        if actual_value is None:
            errors.append(f"{node_name}: Missing decoder setting '{key}'")
        elif isinstance(expected_value, float):
            # Allow small floating point tolerance
            if abs(actual_value - expected_value) > 0.01:
                errors.append(
                    f"{node_name}: '{key}' out of range (expected {expected_value}, got {actual_value})"
                )
        else:
            if actual_value != expected_value:
                errors.append(
                    f"{node_name}: '{key}' mismatch (expected {expected_value}, got {actual_value})"
                )

    return (len(errors) == 0, errors)


# =============================================================================
# Pytest Configuration
# =============================================================================

def pytest_configure(config):
    """Configure custom pytest markers for determinism tests."""
    config.addinivalue_line(
        "markers", "determinism: mark test as determinism validation test"
    )
    config.addinivalue_line(
        "markers", "reproducibility: mark test as reproducibility test"
    )
    config.addinivalue_line(
        "markers", "seed_propagation: mark test as seed propagation test"
    )
    config.addinivalue_line(
        "markers", "decoder_settings: mark test as decoder settings validation test"
    )
    config.addinivalue_line(
        "markers", "pinned_retrieval: mark test as pinned retrieval test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running (>5s per test)"
    )
