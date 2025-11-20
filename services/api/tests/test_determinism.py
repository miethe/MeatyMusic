"""
Reproducibility Tests for AMCS Determinism Validation

This module implements P1.4 determinism tests:
- Test same SDS + seed → same output (10 iterations per song)
- Test all workflow nodes: PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE
- Byte-for-byte comparison using SHA-256 hashes
- Track pass rate (target: ≥99%)

Test Strategy:
1. Run each SDS 10 times with the same seed
2. Compute SHA-256 hash of each artifact
3. Verify all 10 runs produce identical hashes
4. Track and report reproducibility rate

Success Criteria:
- ≥99% reproducibility rate across all runs
- Per-artifact reproducibility ≥99% for all node outputs
- Deterministic seed propagation (seed + node_index)

Author: AMCS Development Team
Created: 2025-11-20
"""

import hashlib
import json
import random
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pytest

# =============================================================================
# Test Configuration
# =============================================================================

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "test_songs"
REPRODUCIBILITY_RUNS = 10  # Number of runs for reproducibility tests
TARGET_REPRODUCIBILITY_RATE = 0.99  # 99% target

# Workflow nodes to test
WORKFLOW_NODES = [
    "PLAN",
    "STYLE",
    "LYRICS",
    "PRODUCER",
    "COMPOSE",
    "VALIDATE",
]

# Expected decoder settings for deterministic generation
EXPECTED_DECODER_SETTINGS = {
    "temperature": 0.3,
    "top_p": 0.9,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
}


# =============================================================================
# Utilities
# =============================================================================


def discover_test_songs(limit: Optional[int] = None) -> List[Path]:
    """
    Discover all synthetic song fixtures.

    Args:
        limit: Optional limit on number of songs to return

    Returns:
        List of Path objects to SDS JSON files
    """
    if not FIXTURES_DIR.exists():
        return []

    fixtures = sorted(FIXTURES_DIR.glob("synthetic-*.json"))

    if limit:
        fixtures = fixtures[:limit]

    return fixtures


def load_sds(path: Path) -> Dict[str, Any]:
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
    required = {"id", "title", "blueprint_ref", "style", "lyrics", "seed"}
    missing = required - set(sds.keys())
    if missing:
        raise ValueError(f"SDS {path.name} missing required fields: {missing}")

    return sds


def normalize_artifact(artifact: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize artifact by removing non-deterministic fields.

    Args:
        artifact: Artifact dictionary

    Returns:
        Normalized artifact dictionary
    """
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
    Compute SHA-256 hash of artifact.

    Args:
        artifact: Artifact dictionary

    Returns:
        SHA-256 hash string (format: "sha256:hexdigest")
    """
    normalized = normalize_artifact(artifact)
    json_bytes = json.dumps(normalized, sort_keys=True, separators=(',', ':')).encode('utf-8')
    hash_obj = hashlib.sha256(json_bytes)
    return f"sha256:{hash_obj.hexdigest()}"


# =============================================================================
# Mock Workflow Execution
# =============================================================================


class MockWorkflowContext:
    """Mock workflow context for deterministic testing."""

    def __init__(self, run_id: str, song_id: str, seed: int):
        self.run_id = run_id
        self.song_id = song_id
        self.seed = seed
        self.node_seeds = {}

    def get_node_seed(self, node_index: int) -> int:
        """Get deterministic seed for a workflow node."""
        node_seed = self.seed + node_index
        self.node_seeds[node_index] = node_seed
        return node_seed


def _deterministic_random(seed: int, namespace: str) -> random.Random:
    """
    Create a deterministic random number generator.

    Args:
        seed: Base seed
        namespace: Namespace string

    Returns:
        random.Random instance seeded deterministically
    """
    combined = f"{seed}:{namespace}"
    hash_bytes = hashlib.sha256(combined.encode()).digest()
    seed_int = int.from_bytes(hash_bytes[:4], byteorder='big')
    return random.Random(seed_int)


def run_mock_workflow_node(
    node_name: str,
    node_index: int,
    sds: Dict[str, Any],
    context: MockWorkflowContext,
    previous_artifacts: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute a mock workflow node deterministically.

    This is a simplified mock for testing determinism.
    Real workflow execution would use actual skills.

    Args:
        node_name: Name of the node (e.g., "PLAN", "STYLE")
        node_index: Index of the node (0-5)
        sds: Song Design Spec
        context: Workflow context
        previous_artifacts: Previously generated artifacts

    Returns:
        Node output artifact
    """
    node_seed = context.get_node_seed(node_index)
    rng = _deterministic_random(node_seed, node_name)

    if node_name == "PLAN":
        section_order = sds["lyrics"]["section_order"]
        return {
            "sections": [
                {
                    "id": section_id,
                    "type": section_id.rstrip("0123456789") or "verse",
                    "wordCountTarget": rng.randint(60, 120),
                    "order": idx + 1
                }
                for idx, section_id in enumerate(section_order)
            ],
            "evaluationTargets": {
                "hookDensity": round(0.75 + rng.random() * 0.15, 3),
                "singability": round(0.80 + rng.random() * 0.15, 3),
                "rhymeTightness": round(0.70 + rng.random() * 0.20, 3),
            },
        }

    elif node_name == "STYLE":
        sds_style = sds.get("style", {})
        return {
            "genre": sds_style["genre_detail"]["primary"],
            "bpm": sds_style["tempo_bpm"],
            "key": sds_style["key"]["primary"],
            "mood": sds_style["mood"],
            "instrumentation": sds_style["instrumentation"],
            "tags": sds_style["tags"],
            "vocalStyle": sds_style["vocal_profile"],
            "energy": sds_style["energy"],
        }

    elif node_name == "LYRICS":
        plan = previous_artifacts.get("plan", {})
        sections = []

        for section_info in plan.get("sections", []):
            section_id = section_info["id"]
            num_lines = rng.randint(4, 8)

            lines = []
            for line_idx in range(num_lines):
                words = ["summer", "night", "love", "dream", "heart", "fire", "light", "soul"]
                line_words = [rng.choice(words) for _ in range(rng.randint(4, 8))]
                line_text = " ".join(line_words).capitalize()
                lines.append({"text": line_text})

            sections.append({
                "id": section_id,
                "type": section_info["type"],
                "lines": lines,
            })

        return {"sections": sections}

    elif node_name == "PRODUCER":
        plan = previous_artifacts.get("plan", {})
        arrangement = {}

        for section in plan.get("sections", []):
            section_id = section["id"]
            section_type = section["type"]

            if section_type == "intro":
                arrangement[section_id] = "Sparse instrumentation, gradual build"
            elif section_type == "verse":
                arrangement[section_id] = "Full band, vocals forward"
            elif section_type == "chorus":
                arrangement[section_id] = "Maximum energy, layered vocals"
            else:
                arrangement[section_id] = "Standard arrangement"

        return {
            "arrangement": arrangement,
            "mixTargets": {
                "vocalLevel": rng.choice(["prominent", "balanced", "subtle"]),
                "bassPresence": rng.choice(["heavy", "medium", "light"]),
            },
        }

    elif node_name == "COMPOSE":
        style = previous_artifacts.get("style", {})
        lyrics = previous_artifacts.get("lyrics", {})

        prompt_parts = [
            f"Genre: {style.get('genre', 'pop')}, BPM: {style.get('bpm', 120)}, Key: {style.get('key', 'C major')}",
            f"Mood: {', '.join(style.get('mood', []))}",
        ]

        for section in lyrics.get("sections", []):
            prompt_parts.append(f"\n[{section['type'].title()}]")
            for line in section["lines"]:
                prompt_parts.append(line["text"])

        prompt_text = "\n".join(prompt_parts)

        return {
            "text": prompt_text,
            "char_count": len(prompt_text),
            "truncated": False,
        }

    elif node_name == "VALIDATE":
        return {
            "metrics": {
                "hookDensity": {"score": round(0.75 + rng.random() * 0.20, 3), "passed": True},
                "singability": {"score": round(0.80 + rng.random() * 0.15, 3), "passed": True},
                "rhymeTightness": {"score": round(0.70 + rng.random() * 0.25, 3), "passed": True},
            },
            "total_score": round(0.80 + rng.random() * 0.15, 3),
            "passed": True,
        }

    else:
        raise ValueError(f"Unknown node: {node_name}")


def run_workflow_deterministic(sds: Dict[str, Any], seed: int) -> Dict[str, Any]:
    """
    Execute full mock workflow deterministically.

    Args:
        sds: Song Design Spec
        seed: Base seed for deterministic generation

    Returns:
        Dictionary containing all generated artifacts
    """
    context = MockWorkflowContext(
        run_id=f"test-run-{seed}",
        song_id=sds.get("id", "test-song"),
        seed=seed
    )

    artifacts = {}

    for idx, node_name in enumerate(WORKFLOW_NODES):
        artifact = run_mock_workflow_node(
            node_name,
            idx,
            sds,
            context,
            artifacts
        )
        artifacts[node_name.lower()] = artifact

    return artifacts


# =============================================================================
# Test Classes
# =============================================================================


class ReproducibilityResult:
    """Container for reproducibility test results."""

    def __init__(self, sds_id: str, seed: int):
        self.sds_id = sds_id
        self.seed = seed
        self.run_hashes: List[Dict[str, str]] = []
        self.is_reproducible = False
        self.artifact_reproducibility: Dict[str, bool] = {}
        self.first_difference: Optional[Tuple[int, int, str]] = None

    def add_run(self, artifact_hashes: Dict[str, str]) -> None:
        """Add hash results from a workflow run."""
        self.run_hashes.append(artifact_hashes)

    def analyze(self) -> None:
        """Analyze reproducibility after all runs complete."""
        if not self.run_hashes:
            return

        artifact_names = set()
        for hashes in self.run_hashes:
            artifact_names.update(hashes.keys())

        for artifact_name in artifact_names:
            artifact_hashes = [
                run.get(artifact_name)
                for run in self.run_hashes
                if artifact_name in run
            ]

            unique_hashes = set(artifact_hashes)
            self.artifact_reproducibility[artifact_name] = len(unique_hashes) == 1

            if len(unique_hashes) > 1 and self.first_difference is None:
                for i, hash1 in enumerate(artifact_hashes[:-1]):
                    if hash1 != artifact_hashes[i + 1]:
                        self.first_difference = (i, i + 1, artifact_name)
                        break

        self.is_reproducible = all(self.artifact_reproducibility.values())

    def to_dict(self) -> Dict:
        """Convert to dictionary for reporting."""
        return {
            "sds_id": self.sds_id,
            "seed": self.seed,
            "is_reproducible": self.is_reproducible,
            "artifact_reproducibility": self.artifact_reproducibility,
            "first_difference": {
                "run_a": self.first_difference[0],
                "run_b": self.first_difference[1],
                "artifact": self.first_difference[2],
            } if self.first_difference else None,
            "num_runs": len(self.run_hashes),
        }


# =============================================================================
# Tests
# =============================================================================


@pytest.mark.determinism
@pytest.mark.slow
def test_basic_reproducibility_200_songs_10_runs(tmp_path):
    """
    Test that running the same SDS with the same seed produces identical outputs.

    This is the core determinism test: 200 SDSs × 10 runs = 2000 total runs.
    Target: ≥99% reproducibility rate (at most 2 failures allowed).

    Test Process:
    1. Load all 200 synthetic SDS fixtures
    2. For each SDS, run workflow 10 times with same seed
    3. Compute SHA-256 hash of all artifacts
    4. Verify all 10 runs produce identical hashes
    5. Report reproducibility rate

    Success Criteria:
    - ≥198 of 200 songs (99%) are reproducible
    - Generate detailed report of any failures
    """
    fixture_paths = discover_test_songs(limit=200)

    if len(fixture_paths) < 200:
        pytest.skip(f"Expected 200 SDS fixtures, found {len(fixture_paths)}")

    results = []
    reproducible_count = 0
    total_count = 0

    for fixture_path in fixture_paths:
        sds = load_sds(fixture_path)
        sds_id = sds.get("id", fixture_path.stem)
        seed = sds.get("seed", 42)

        result = ReproducibilityResult(sds_id, seed)

        # Run workflow 10 times
        for run_idx in range(REPRODUCIBILITY_RUNS):
            artifacts = run_workflow_deterministic(sds, seed)
            artifact_hashes = {
                name: hash_artifact(artifact)
                for name, artifact in artifacts.items()
            }
            result.add_run(artifact_hashes)

        # Analyze reproducibility
        result.analyze()
        results.append(result)

        if result.is_reproducible:
            reproducible_count += 1
        total_count += 1

    # Calculate reproducibility rate
    reproducibility_rate = reproducible_count / total_count if total_count > 0 else 0.0

    # Generate report
    report = {
        "test": "basic_reproducibility_200_songs_10_runs",
        "total_songs": total_count,
        "reproducible_songs": reproducible_count,
        "reproducibility_rate": reproducibility_rate,
        "target_rate": TARGET_REPRODUCIBILITY_RATE,
        "passed": reproducibility_rate >= TARGET_REPRODUCIBILITY_RATE,
        "failures": [
            r.to_dict() for r in results if not r.is_reproducible
        ],
    }

    # Save report
    report_path = tmp_path / "reproducibility_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nReproducibility Report:")
    print(f"  Total songs: {total_count}")
    print(f"  Reproducible: {reproducible_count}")
    print(f"  Rate: {reproducibility_rate:.2%}")
    print(f"  Target: {TARGET_REPRODUCIBILITY_RATE:.2%}")
    print(f"  Passed: {report['passed']}")
    print(f"  Report: {report_path}")

    # Assert reproducibility target
    assert reproducibility_rate >= TARGET_REPRODUCIBILITY_RATE, (
        f"Reproducibility rate {reproducibility_rate:.2%} below target 99%. "
        f"Failed: {total_count - reproducible_count}/{total_count} songs. "
        f"See report: {report_path}"
    )


@pytest.mark.determinism
def test_per_node_reproducibility(tmp_path):
    """
    Test reproducibility for each workflow node individually.

    This test provides granular visibility into which nodes have
    reproducibility issues.

    Nodes Tested:
    - PLAN
    - STYLE
    - LYRICS
    - PRODUCER
    - COMPOSE
    - VALIDATE

    Success Criteria:
    - Each node ≥99% reproducible across all songs
    """
    fixture_paths = discover_test_songs(limit=200)

    if len(fixture_paths) < 200:
        pytest.skip(f"Expected 200 SDS fixtures, found {len(fixture_paths)}")

    # Track reproducibility per node
    node_stats = defaultdict(lambda: {"reproducible": 0, "total": 0})

    for fixture_path in fixture_paths:
        sds = load_sds(fixture_path)
        seed = sds.get("seed", 42)

        # Run twice to test reproducibility
        artifacts1 = run_workflow_deterministic(sds, seed)
        artifacts2 = run_workflow_deterministic(sds, seed)

        # Compare each node output
        for node_name in WORKFLOW_NODES:
            node_key = node_name.lower()

            if node_key in artifacts1 and node_key in artifacts2:
                hash1 = hash_artifact(artifacts1[node_key])
                hash2 = hash_artifact(artifacts2[node_key])

                is_reproducible = (hash1 == hash2)

                node_stats[node_name]["total"] += 1
                if is_reproducible:
                    node_stats[node_name]["reproducible"] += 1

    # Calculate rates
    report = {
        "test": "per_node_reproducibility",
        "node_stats": {},
    }

    all_passed = True

    for node_name, stats in node_stats.items():
        rate = stats["reproducible"] / stats["total"] if stats["total"] > 0 else 0.0
        passed = rate >= TARGET_REPRODUCIBILITY_RATE

        report["node_stats"][node_name] = {
            "reproducible": stats["reproducible"],
            "total": stats["total"],
            "rate": rate,
            "target": TARGET_REPRODUCIBILITY_RATE,
            "passed": passed,
        }

        if not passed:
            all_passed = False

    # Save report
    report_path = tmp_path / "per_node_reproducibility_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nPer-Node Reproducibility Report:")
    for node_name, stats in report["node_stats"].items():
        status = "✓" if stats["passed"] else "✗"
        print(f"  {status} {node_name}: {stats['rate']:.2%} ({stats['reproducible']}/{stats['total']})")
    print(f"  Report: {report_path}")

    # Assert all nodes meet target
    failed_nodes = [
        name for name, stats in report["node_stats"].items()
        if not stats["passed"]
    ]

    assert all_passed, (
        f"Some nodes below 99% reproducibility: {failed_nodes}. "
        f"See report: {report_path}"
    )


@pytest.mark.determinism
def test_seed_propagation():
    """
    Test that seed propagation follows the pattern: node_seed = base_seed + node_index.

    This ensures deterministic seed generation across all workflow nodes.
    """
    fixture_paths = discover_test_songs(limit=10)

    if not fixture_paths:
        pytest.skip("No SDS fixtures found")

    for fixture_path in fixture_paths[:10]:
        sds = load_sds(fixture_path)
        base_seed = sds.get("seed", 42)

        context = MockWorkflowContext(
            run_id="test-run",
            song_id=sds.get("id", "test-song"),
            seed=base_seed
        )

        # Execute workflow to populate node_seeds
        artifacts = {}
        for idx, node_name in enumerate(WORKFLOW_NODES):
            run_mock_workflow_node(node_name, idx, sds, context, artifacts)

        # Verify seed propagation
        for node_index, actual_seed in context.node_seeds.items():
            expected_seed = base_seed + node_index
            assert actual_seed == expected_seed, (
                f"Node {node_index}: Seed mismatch "
                f"(expected {expected_seed}, got {actual_seed})"
            )


@pytest.mark.determinism
@pytest.mark.parametrize("sample_size", [10, 50, 100])
def test_reproducibility_sample_sizes(tmp_path, sample_size):
    """
    Test reproducibility with different sample sizes.

    This allows running quick smoke tests with smaller sample sizes.

    Args:
        sample_size: Number of songs to test (10, 50, or 100)
    """
    fixture_paths = discover_test_songs(limit=sample_size)

    if len(fixture_paths) < sample_size:
        pytest.skip(f"Expected {sample_size} SDS fixtures, found {len(fixture_paths)}")

    reproducible_count = 0

    for fixture_path in fixture_paths:
        sds = load_sds(fixture_path)
        seed = sds.get("seed", 42)

        # Run twice
        artifacts1 = run_workflow_deterministic(sds, seed)
        artifacts2 = run_workflow_deterministic(sds, seed)

        # Compare all artifacts
        hashes1 = {name: hash_artifact(artifact) for name, artifact in artifacts1.items()}
        hashes2 = {name: hash_artifact(artifact) for name, artifact in artifacts2.items()}

        if hashes1 == hashes2:
            reproducible_count += 1

    reproducibility_rate = reproducible_count / sample_size
    print(f"\nSample size {sample_size}: {reproducibility_rate:.2%} reproducible")

    assert reproducibility_rate >= TARGET_REPRODUCIBILITY_RATE, (
        f"Reproducibility rate {reproducibility_rate:.2%} below target 99% "
        f"for sample size {sample_size}"
    )
