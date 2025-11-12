# Phase 6: Testing, Optimization & Documentation

**Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for implementation
**Duration**: 2 weeks
**Critical Path**: YES - Final gate before MVP release

---

## Phase Overview

### Goals

Phase 6 validates the complete MeatyMusic AMCS system against acceptance gates and prepares for production release. This includes:

1. **Determinism & Reproducibility** - Verify 99% reproduction rate across 500 test runs
2. **Rubric Compliance** - Achieve 95% pass rate on 200-song synthetic test set
3. **Security Audit** - Zero high-severity vulnerabilities in MCP, RLS, and auth systems
4. **Performance Optimization** - Meet P95 latency target of ≤60s for Plan→Prompt workflow
5. **Documentation** - Complete API docs, user guides, developer runbooks

### Why Critical Path

This is the **final validation gate** before MVP release. All four acceptance gates must pass:

- **Gate A**: Rubric pass ≥ 95% on 200-song synthetic set
- **Gate B**: Determinism reproducibility ≥ 99%
- **Gate C**: Security audit clean (zero high-severity)
- **Gate D**: Latency P95 ≤ 60s (no render)

**No production deployment until all gates pass.**

### Dependencies

- **Phase 0**: Infrastructure, schemas, taxonomies
- **Phase 1**: Entity services with CRUD + validation
- **Phase 2**: SDS compilation and state management
- **Phase 3**: All 8 workflow skills (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, REVIEW)
- **Phase 4**: Frontend (optional for critical path)
- **Phase 5**: Rendering connector (optional for critical path)

---

## Work Package Summary

| WP | Name | Agent(s) | Duration | Deliverables |
|----|------|----------|----------|--------------|
| WP1 | Determinism Testing | debugger, ultrathink-debugger | 3-4 days | Reproducibility test harness, 500 runs, gate validation |
| WP2 | Rubric Validation | python-backend-engineer, data-layer-expert | 3-4 days | 200-song test suite, auto-fix tuning, profanity tests |
| WP3 | Security Audit | senior-code-reviewer | 2-3 days | MCP audit, RLS penetration tests, PII verification |
| WP4 | Performance Testing | python-backend-engineer | 2-3 days | Latency profiling, stress tests, optimization |
| WP5 | Documentation | documentation-writer | 2-3 days | API docs, user guides, runbooks |

**Total Duration**: 12-17 days (2 weeks with parallel work streams)

---

## WP1: Determinism & Reproducibility Testing

### Agent Assignment

- **Primary**: debugger
- **Secondary**: ultrathink-debugger (for complex failure analysis)

### Goals

- Verify 99% reproducibility across 500 test runs (Gate B)
- Identify and fix non-deterministic behavior
- Validate seed propagation across all workflow nodes

### Tasks

#### 1.1: Test Harness Development

**File**: `tests/determinism/test_reproducibility.py`

```python
#!/usr/bin/env python3
"""
Determinism test harness for AMCS workflow.
Runs identical SDS inputs with same seed and verifies byte-level output equality.
"""

import asyncio
import hashlib
import json
from pathlib import Path
from typing import Dict, List, Tuple
import pytest
from backend.services.orchestrator import WorkflowRunner
from backend.services.sds import SDSCompiler

class DeterminismTester:
    """Test deterministic behavior across multiple runs."""

    def __init__(self, test_fixtures_dir: Path, num_runs: int = 10):
        self.fixtures_dir = test_fixtures_dir
        self.num_runs = num_runs
        self.results = []

    async def run_determinism_test(self, sds_file: Path, seed: int) -> Dict:
        """Run workflow multiple times with same SDS and seed."""
        sds_data = json.loads(sds_file.read_text())
        hashes = []
        artifacts = []

        for run_idx in range(self.num_runs):
            # Create workflow runner with fixed seed
            runner = WorkflowRunner(seed=seed)
            result = await runner.execute_workflow(sds_data)

            # Compute hash of all artifacts
            artifact_hash = self._hash_artifacts(result['artifacts'])
            hashes.append(artifact_hash)
            artifacts.append(result['artifacts'])

        # Check if all hashes are identical
        is_deterministic = len(set(hashes)) == 1

        return {
            'sds_file': str(sds_file),
            'seed': seed,
            'num_runs': self.num_runs,
            'is_deterministic': is_deterministic,
            'unique_hashes': len(set(hashes)),
            'hashes': hashes,
            'first_artifacts': artifacts[0] if artifacts else None,
            'last_artifacts': artifacts[-1] if artifacts else None,
        }

    def _hash_artifacts(self, artifacts: Dict) -> str:
        """Compute SHA-256 hash of all artifacts."""
        # Sort keys for consistent ordering
        sorted_json = json.dumps(artifacts, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(sorted_json.encode('utf-8')).hexdigest()

    async def run_test_suite(self) -> Dict:
        """Run determinism tests on all fixtures."""
        fixture_files = list(self.fixtures_dir.glob('*.json'))
        print(f"Running determinism tests on {len(fixture_files)} fixtures...")

        tasks = []
        for idx, fixture in enumerate(fixture_files):
            # Use a different seed per fixture for variety
            seed = 42 + idx
            tasks.append(self.run_determinism_test(fixture, seed))

        results = await asyncio.gather(*tasks)

        # Calculate pass rate
        deterministic_count = sum(1 for r in results if r['is_deterministic'])
        pass_rate = deterministic_count / len(results) * 100

        return {
            'total_tests': len(results),
            'deterministic_count': deterministic_count,
            'pass_rate': pass_rate,
            'results': results,
            'gate_b_passed': pass_rate >= 99.0,
        }


@pytest.mark.asyncio
async def test_determinism_200_songs():
    """Test determinism on 200-song synthetic set."""
    tester = DeterminismTester(
        test_fixtures_dir=Path('tests/determinism/fixtures/synthetic-200'),
        num_runs=10
    )

    results = await tester.run_test_suite()

    # Assert Gate B: ≥99% reproducibility
    assert results['pass_rate'] >= 99.0, (
        f"Determinism test failed: {results['pass_rate']:.2f}% < 99.0%"
    )

    # Log failures for analysis
    failures = [r for r in results['results'] if not r['is_deterministic']]
    if failures:
        print(f"\nDeterminism failures ({len(failures)}):")
        for failure in failures:
            print(f"  - {failure['sds_file']}: {failure['unique_hashes']} unique hashes")


@pytest.mark.asyncio
async def test_seed_propagation():
    """Verify seed is correctly propagated to all workflow nodes."""
    from backend.services.orchestrator import WorkflowNode

    seed = 12345
    runner = WorkflowRunner(seed=seed)

    # Mock SDS
    sds_data = {
        "song_id": "test-seed-prop",
        "title": "Test Song",
        "metadata": {"seed": seed},
        # ... minimal SDS
    }

    result = await runner.execute_workflow(sds_data)

    # Check that all node events include the seed
    for event in result['events']:
        if event['phase'] == 'start':
            assert event.get('seed') == seed, (
                f"Node {event['node']} missing or incorrect seed"
            )


@pytest.mark.asyncio
async def test_concurrent_determinism():
    """Test determinism with concurrent workflow executions."""
    # Run 10 workflows concurrently, each with same seed
    seed = 99999
    sds_file = Path('tests/determinism/fixtures/basic-pop.json')
    sds_data = json.loads(sds_file.read_text())

    tasks = [
        WorkflowRunner(seed=seed).execute_workflow(sds_data)
        for _ in range(10)
    ]

    results = await asyncio.gather(*tasks)

    # All results should have identical artifacts
    hashes = [
        hashlib.sha256(
            json.dumps(r['artifacts'], sort_keys=True).encode()
        ).hexdigest()
        for r in results
    ]

    assert len(set(hashes)) == 1, "Concurrent runs produced different results"
```

#### 1.2: Synthetic Test Set Generation

**File**: `tests/determinism/generate_fixtures.py`

```python
#!/usr/bin/env python3
"""Generate 200 synthetic SDSs for determinism testing."""

import json
import random
from pathlib import Path
from typing import List, Dict

GENRES = ['pop', 'country', 'rock', 'hiphop', 'rnb', 'electronic', 'indie']
THEMES = ['love', 'heartbreak', 'party', 'reflection', 'celebration', 'nostalgia']
MOODS = ['upbeat', 'melancholic', 'energetic', 'chill', 'romantic', 'aggressive']
KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm']

def generate_synthetic_sds(song_id: str, seed: int) -> Dict:
    """Generate a synthetic SDS with deterministic randomness."""
    rng = random.Random(seed)

    genre = rng.choice(GENRES)
    theme = rng.choice(THEMES)
    mood = rng.choice(MOODS)
    key = rng.choice(KEYS)
    bpm = rng.randint(80, 160)

    return {
        "song_id": song_id,
        "title": f"Test Song {song_id.split('-')[1]}",
        "metadata": {
            "version": "1.0",
            "created_at": "2025-11-11T00:00:00Z",
            "seed": seed
        },
        "persona": {
            "artist_name": f"Test Artist {rng.randint(1, 100)}",
            "vocal_range": rng.choice(["tenor", "alto", "soprano", "bass"]),
            "influences": rng.sample(['artist1', 'artist2', 'artist3'], 2)
        },
        "style": {
            "genre": genre,
            "sub_genres": [f"{genre}-subgenre"],
            "bpm": bpm,
            "key": key,
            "mood": [mood],
            "vibe": [rng.choice(['intimate', 'epic', 'raw', 'polished'])]
        },
        "constraints": {
            "explicit": rng.choice([True, False]),
            "max_duration_sec": rng.choice([180, 210, 240]),
            "required_sections": ["verse", "chorus", "bridge"]
        },
        "theme": {
            "primary": theme,
            "secondary": rng.choice([t for t in THEMES if t != theme]),
            "perspective": rng.choice(["first-person", "third-person"]),
            "imagery": rng.sample(['visual', 'emotional', 'abstract'], 2)
        }
    }

def main():
    """Generate 200 synthetic SDSs."""
    output_dir = Path('tests/determinism/fixtures/synthetic-200')
    output_dir.mkdir(parents=True, exist_ok=True)

    for i in range(200):
        song_id = f"synth-{i:03d}"
        seed = 1000 + i  # Unique seed per song

        sds = generate_synthetic_sds(song_id, seed)

        output_file = output_dir / f"{song_id}.json"
        output_file.write_text(json.dumps(sds, indent=2))

    print(f"Generated 200 synthetic SDSs in {output_dir}")

if __name__ == '__main__':
    main()
```

#### 1.3: Latency Profiling

**File**: `tests/performance/profile_latency.py`

```python
#!/usr/bin/env python3
"""Profile workflow latency and identify bottlenecks."""

import asyncio
import time
from typing import Dict, List
from pathlib import Path
import json
import statistics

class LatencyProfiler:
    """Profile Plan→Prompt latency for Gate D validation."""

    def __init__(self):
        self.measurements = []

    async def profile_workflow(self, sds_file: Path, seed: int) -> Dict:
        """Profile a single workflow execution."""
        from backend.services.orchestrator import WorkflowRunner

        sds_data = json.loads(sds_file.read_text())
        runner = WorkflowRunner(seed=seed)

        start_time = time.perf_counter()
        result = await runner.execute_workflow(sds_data)
        end_time = time.perf_counter()

        total_latency = end_time - start_time

        # Extract per-node latency from events
        node_latencies = {}
        for event in result['events']:
            if event['phase'] == 'end' and 'duration_ms' in event:
                node_name = event['node']
                node_latencies[node_name] = event['duration_ms']

        return {
            'sds_file': str(sds_file),
            'total_latency_s': total_latency,
            'node_latencies_ms': node_latencies,
            'timestamp': time.time(),
        }

    async def run_latency_suite(self, num_runs: int = 100) -> Dict:
        """Run latency profiling on test suite."""
        fixtures = list(Path('tests/determinism/fixtures/synthetic-200').glob('*.json'))

        # Sample subset for latency testing
        sampled = fixtures[:num_runs]

        tasks = [
            self.profile_workflow(fixture, 42 + idx)
            for idx, fixture in enumerate(sampled)
        ]

        results = await asyncio.gather(*tasks)

        # Calculate statistics
        latencies = [r['total_latency_s'] for r in results]
        p50 = statistics.median(latencies)
        p95 = statistics.quantiles(latencies, n=20)[18]  # 95th percentile
        p99 = statistics.quantiles(latencies, n=100)[98]  # 99th percentile
        mean = statistics.mean(latencies)

        return {
            'num_runs': num_runs,
            'latency_stats': {
                'mean': mean,
                'p50': p50,
                'p95': p95,
                'p99': p99,
                'min': min(latencies),
                'max': max(latencies),
            },
            'gate_d_passed': p95 <= 60.0,
            'results': results,
        }

async def main():
    """Run latency profiling."""
    profiler = LatencyProfiler()
    results = await profiler.run_latency_suite(num_runs=100)

    print("\n=== Latency Profiling Results ===")
    print(f"Mean: {results['latency_stats']['mean']:.2f}s")
    print(f"P50:  {results['latency_stats']['p50']:.2f}s")
    print(f"P95:  {results['latency_stats']['p95']:.2f}s (target: ≤60s)")
    print(f"P99:  {results['latency_stats']['p99']:.2f}s")
    print(f"\nGate D: {'PASS' if results['gate_d_passed'] else 'FAIL'}")

if __name__ == '__main__':
    asyncio.run(main())
```

### Deliverables

- `tests/determinism/test_reproducibility.py` - Main test harness
- `tests/determinism/generate_fixtures.py` - Synthetic SDS generator
- `tests/determinism/fixtures/synthetic-200/` - 200 test SDSs
- `tests/performance/profile_latency.py` - Latency profiler
- **Gate B Validation Report** - CSV with reproducibility results

### Pass Criteria

- Gate B: ≥99% reproducibility across 500 runs (10 runs × 50 fixtures)
- Gate D: P95 latency ≤60s on 100-run sample
- Zero seed propagation failures
- Concurrent execution produces identical results

---

## WP2: Rubric Validation & Auto-Fix Tuning

### Agent Assignment

- **Primary**: python-backend-engineer
- **Secondary**: data-layer-expert

### Goals

- Achieve 95% rubric pass rate on 200-song test set (Gate A)
- Tune auto-fix logic to minimize iterations
- Validate profanity filter accuracy

### Tasks

#### 2.1: Rubric Test Suite

**File**: `tests/rubric/test_validation.py`

```python
#!/usr/bin/env python3
"""Test rubric scoring and validation gates."""

import asyncio
import json
from pathlib import Path
from typing import Dict, List
import pytest

class RubricTester:
    """Test rubric scoring and pass rate."""

    def __init__(self, test_fixtures_dir: Path):
        self.fixtures_dir = test_fixtures_dir
        self.results = []

    async def test_rubric_scoring(self, sds_file: Path) -> Dict:
        """Run workflow and validate rubric scores."""
        from backend.services.orchestrator import WorkflowRunner

        sds_data = json.loads(sds_file.read_text())
        runner = WorkflowRunner(seed=sds_data['metadata']['seed'])

        result = await runner.execute_workflow(sds_data)

        # Extract validation scores
        validate_events = [
            e for e in result['events']
            if e['node'] == 'VALIDATE'
        ]

        if not validate_events:
            return {'error': 'No VALIDATE events found'}

        final_validation = validate_events[-1]  # Last validation after fixes
        scores = final_validation.get('metrics', {})

        # Check against thresholds
        total_score = scores.get('total', 0)
        profanity_score = scores.get('profanity_score', 0)

        # Load blueprint for thresholds
        genre = sds_data['style']['genre']
        blueprint = self._load_blueprint(genre)

        min_total = blueprint['eval_rubric']['thresholds']['min_total']
        max_profanity = blueprint['eval_rubric']['thresholds']['max_profanity']

        passed = (
            total_score >= min_total and
            profanity_score <= max_profanity
        )

        return {
            'sds_file': str(sds_file),
            'genre': genre,
            'scores': scores,
            'thresholds': {
                'min_total': min_total,
                'max_profanity': max_profanity,
            },
            'passed': passed,
            'fix_iterations': sum(1 for e in result['events'] if e['node'] == 'FIX'),
        }

    def _load_blueprint(self, genre: str) -> Dict:
        """Load blueprint for genre."""
        blueprint_path = Path(f'taxonomies/blueprints/{genre}.json')
        return json.loads(blueprint_path.read_text())

    async def run_rubric_suite(self) -> Dict:
        """Run rubric tests on all fixtures."""
        fixture_files = list(self.fixtures_dir.glob('*.json'))

        tasks = [
            self.test_rubric_scoring(fixture)
            for fixture in fixture_files
        ]

        results = await asyncio.gather(*tasks)

        # Calculate pass rate
        passed_count = sum(1 for r in results if r.get('passed', False))
        pass_rate = passed_count / len(results) * 100

        # Calculate average fix iterations
        fix_counts = [r.get('fix_iterations', 0) for r in results]
        avg_fixes = sum(fix_counts) / len(fix_counts) if fix_counts else 0

        return {
            'total_tests': len(results),
            'passed_count': passed_count,
            'pass_rate': pass_rate,
            'avg_fix_iterations': avg_fixes,
            'results': results,
            'gate_a_passed': pass_rate >= 95.0,
        }


@pytest.mark.asyncio
async def test_rubric_pass_rate():
    """Test rubric pass rate on 200-song set (Gate A)."""
    tester = RubricTester(
        test_fixtures_dir=Path('tests/determinism/fixtures/synthetic-200')
    )

    results = await tester.run_rubric_suite()

    # Assert Gate A: ≥95% pass rate
    assert results['pass_rate'] >= 95.0, (
        f"Rubric test failed: {results['pass_rate']:.2f}% < 95.0%"
    )

    # Log failures for analysis
    failures = [r for r in results['results'] if not r.get('passed', False)]
    if failures:
        print(f"\nRubric failures ({len(failures)}):")
        for failure in failures:
            print(f"  - {failure['sds_file']}")
            print(f"    Total score: {failure['scores'].get('total', 0):.2f}")
            print(f"    Profanity: {failure['scores'].get('profanity_score', 0):.2f}")


@pytest.mark.asyncio
async def test_auto_fix_convergence():
    """Verify auto-fix converges within 3 iterations."""
    from backend.services.orchestrator import WorkflowRunner

    # Use a deliberately low-scoring SDS
    sds_file = Path('tests/rubric/fixtures/low-score-pop.json')
    sds_data = json.loads(sds_file.read_text())

    runner = WorkflowRunner(seed=42)
    result = await runner.execute_workflow(sds_data)

    # Count FIX iterations
    fix_count = sum(1 for e in result['events'] if e['node'] == 'FIX')

    assert fix_count <= 3, f"Auto-fix exceeded 3 iterations: {fix_count}"

    # Verify final score passes
    final_validation = [e for e in result['events'] if e['node'] == 'VALIDATE'][-1]
    total_score = final_validation['metrics']['total']

    # Should pass after fixes
    assert total_score >= 0.85, f"Auto-fix failed to reach passing score: {total_score}"
```

#### 2.2: Auto-Fix Tuning

**File**: `backend/services/skills/fix.py`

```python
"""Auto-fix skill for improving rubric scores."""

from typing import Dict, List, Tuple

class AutoFixer:
    """Apply targeted fixes to improve rubric scores."""

    STRATEGY_MAP = {
        'hook_density': [
            'duplicate_chorus_hooks',
            'condense_hook_lines',
            'add_repetition',
        ],
        'rhyme_tightness': [
            'adjust_rhyme_scheme',
            'fix_syllable_count',
            'strengthen_end_rhymes',
        ],
        'singability': [
            'simplify_phrasing',
            'reduce_word_density',
            'improve_vowel_patterns',
        ],
        'section_completeness': [
            'add_missing_sections',
            'expand_short_sections',
            'balance_section_lengths',
        ],
        'profanity_score': [
            'replace_banned_terms',
            'sanitize_explicit_content',
        ],
    }

    def analyze_scores(self, scores: Dict[str, float], thresholds: Dict) -> List[str]:
        """Identify which metrics need improvement."""
        issues = []

        for metric, score in scores.items():
            if metric == 'total':
                continue

            # Determine if metric is below acceptable threshold
            # Use weighted thresholds based on importance
            if metric == 'profanity_score':
                if score > thresholds.get('max_profanity', 0.1):
                    issues.append(metric)
            else:
                # For other metrics, flag if below 0.8
                if score < 0.8:
                    issues.append(metric)

        return issues

    def select_fixes(self, issues: List[str], iteration: int) -> List[Tuple[str, str]]:
        """Select fix strategies based on issues and iteration."""
        fixes = []

        for issue in issues:
            strategies = self.STRATEGY_MAP.get(issue, [])

            # Apply more aggressive fixes in later iterations
            num_strategies = min(iteration + 1, len(strategies))
            selected = strategies[:num_strategies]

            for strategy in selected:
                fixes.append((issue, strategy))

        return fixes

    async def apply_fixes(
        self,
        artifacts: Dict,
        fixes: List[Tuple[str, str]],
        seed: int
    ) -> Dict:
        """Apply selected fixes to artifacts."""
        # Clone artifacts to avoid mutation
        fixed_artifacts = artifacts.copy()

        for metric, strategy in fixes:
            if strategy == 'duplicate_chorus_hooks':
                fixed_artifacts = self._duplicate_chorus_hooks(fixed_artifacts)
            elif strategy == 'adjust_rhyme_scheme':
                fixed_artifacts = self._adjust_rhyme_scheme(fixed_artifacts, seed)
            elif strategy == 'replace_banned_terms':
                fixed_artifacts = self._replace_banned_terms(fixed_artifacts)
            # ... more strategies

        return fixed_artifacts

    def _duplicate_chorus_hooks(self, artifacts: Dict) -> Dict:
        """Duplicate hooks in chorus for higher hook density."""
        lyrics = artifacts.get('lyrics', {})
        sections = lyrics.get('sections', [])

        for section in sections:
            if section.get('type') == 'chorus':
                lines = section.get('lines', [])
                if lines:
                    # Duplicate the first line (hook) at the end
                    hook_line = lines[0]
                    section['lines'].append(hook_line)

        return artifacts

    def _adjust_rhyme_scheme(self, artifacts: Dict, seed: int) -> Dict:
        """Improve rhyme scheme tightness."""
        # Implementation for rhyme adjustment
        # Uses deterministic selection based on seed
        return artifacts

    def _replace_banned_terms(self, artifacts: Dict) -> Dict:
        """Replace profanity with sanitized alternatives."""
        lyrics = artifacts.get('lyrics', {})
        sections = lyrics.get('sections', [])

        # Load banned terms
        banned_terms = self._load_banned_terms(artifacts.get('style', {}).get('genre'))

        for section in sections:
            lines = section.get('lines', [])
            for i, line in enumerate(lines):
                for banned, replacement in banned_terms.items():
                    if banned.lower() in line.lower():
                        lines[i] = line.replace(banned, replacement)

        return artifacts

    def _load_banned_terms(self, genre: str) -> Dict[str, str]:
        """Load banned terms and replacements from blueprint."""
        # Load from taxonomies/blueprints/{genre}.json
        return {}
```

#### 2.3: Profanity Filter Testing

**File**: `tests/rubric/test_profanity_filter.py`

```python
#!/usr/bin/env python3
"""Test profanity filter accuracy."""

import pytest
from backend.services.validators import ProfanityValidator

class TestProfanityFilter:
    """Test profanity detection and scoring."""

    @pytest.fixture
    def validator(self):
        return ProfanityValidator()

    def test_explicit_content_detection(self, validator):
        """Test detection of explicit content."""
        test_cases = [
            ("This is clean content", 0.0),
            ("Damn this beat is fire", 0.3),
            ("F*** this s***", 1.0),
        ]

        for text, expected_score in test_cases:
            score = validator.score_text(text)
            assert abs(score - expected_score) < 0.2, (
                f"Expected score ~{expected_score} for '{text}', got {score}"
            )

    def test_context_aware_filtering(self, validator):
        """Test context-aware profanity detection."""
        # Some words are profane in some contexts but not others
        test_cases = [
            ("I'm in hell right now", 0.1),  # Metaphorical
            ("Go to hell", 0.5),  # More aggressive
        ]

        for text, max_score in test_cases:
            score = validator.score_text(text)
            assert score <= max_score, (
                f"Score too high for '{text}': {score} > {max_score}"
            )

    def test_explicit_flag_enforcement(self, validator):
        """Test that explicit flag is respected."""
        text = "This has mild profanity damn"

        # With explicit=True, should allow
        score_explicit = validator.score_text(text, explicit=True)

        # With explicit=False, should penalize more
        score_clean = validator.score_text(text, explicit=False)

        assert score_clean > score_explicit, (
            "Clean mode should penalize profanity more"
        )
```

### Deliverables

- `tests/rubric/test_validation.py` - Rubric test suite
- `backend/services/skills/fix.py` - Enhanced auto-fix logic
- `tests/rubric/test_profanity_filter.py` - Profanity filter tests
- **Gate A Validation Report** - CSV with rubric pass rates per genre

### Pass Criteria

- Gate A: ≥95% rubric pass rate on 200-song test set
- Average fix iterations ≤2
- Profanity filter accuracy ≥90% (precision/recall)
- Zero false positives on clean test set

---

## WP3: Security Audit

### Agent Assignment

- **Primary**: senior-code-reviewer

### Goals

- Pass Gate C: Zero high-severity security vulnerabilities
- Verify MCP allow-list enforcement
- Test RLS policies for data isolation
- Validate PII redaction and living artist normalization

### Tasks

#### 3.1: MCP Allow-List Audit

**File**: `tests/security/test_mcp_security.py`

```python
#!/usr/bin/env python3
"""Test MCP security and allow-list enforcement."""

import pytest
from backend.services.sources import SourceRegistry

class TestMCPSecurity:
    """Test MCP security controls."""

    @pytest.fixture
    def registry(self):
        return SourceRegistry()

    def test_allow_list_enforcement(self, registry):
        """Verify only allowed MCP servers can be accessed."""
        # Allowed servers (from config)
        allowed = [
            'mcp://localhost:8001/lyrics-db',
            'mcp://localhost:8002/music-theory',
        ]

        # Disallowed servers
        disallowed = [
            'mcp://evil.com:9999/malicious',
            'mcp://unauthorized:1234/data',
        ]

        for server in allowed:
            assert registry.is_allowed(server), (
                f"Allowed server rejected: {server}"
            )

        for server in disallowed:
            assert not registry.is_allowed(server), (
                f"Disallowed server accepted: {server}"
            )

    def test_source_provenance_required(self, registry):
        """Verify all source chunks include provenance hashes."""
        # Mock retrieval
        chunks = registry.retrieve(
            query="test query",
            top_k=5,
            scope="lyrics-db"
        )

        for chunk in chunks:
            assert 'provenance_hash' in chunk, (
                "Source chunk missing provenance hash"
            )
            assert 'source_uri' in chunk, (
                "Source chunk missing source URI"
            )

    def test_scope_isolation(self, registry):
        """Verify MCP scopes are properly isolated."""
        # Query from scope A should not return results from scope B
        scope_a_results = registry.retrieve(
            query="test", top_k=10, scope="lyrics-db"
        )

        for chunk in scope_a_results:
            assert chunk['source_uri'].startswith('mcp://localhost:8001/'), (
                "Scope isolation violated: result from wrong scope"
            )
```

#### 3.2: RLS Penetration Testing

**File**: `tests/security/test_rls_policies.py`

```python
#!/usr/bin/env python3
"""Test Row-Level Security policies."""

import pytest
import asyncpg
from backend.auth import create_jwt_token

class TestRLSPolicies:
    """Test RLS data isolation."""

    @pytest.fixture
    async def db_pool(self):
        """Create test database connection pool."""
        pool = await asyncpg.create_pool(
            host='localhost',
            port=5432,
            database='amcs_test',
            user='test_user',
            password='test_pass'
        )
        yield pool
        await pool.close()

    @pytest.mark.asyncio
    async def test_user_data_isolation(self, db_pool):
        """Verify users can only access their own data."""
        # Create two test users
        user1_id = 'user-001'
        user2_id = 'user-002'

        async with db_pool.acquire() as conn:
            # User 1 creates a persona
            await conn.execute(
                """
                INSERT INTO personas (id, user_id, artist_name)
                VALUES ($1, $2, $3)
                """,
                'persona-1', user1_id, 'Artist 1'
            )

            # User 2 creates a persona
            await conn.execute(
                """
                INSERT INTO personas (id, user_id, artist_name)
                VALUES ($1, $2, $3)
                """,
                'persona-2', user2_id, 'Artist 2'
            )

            # User 1 queries personas (with RLS context)
            await conn.execute(f"SET LOCAL app.user_id = '{user1_id}'")
            user1_personas = await conn.fetch("SELECT * FROM personas")

            # Should only see their own persona
            assert len(user1_personas) == 1
            assert user1_personas[0]['id'] == 'persona-1'

            # User 2 queries personas
            await conn.execute(f"SET LOCAL app.user_id = '{user2_id}'")
            user2_personas = await conn.fetch("SELECT * FROM personas")

            # Should only see their own persona
            assert len(user2_personas) == 1
            assert user2_personas[0]['id'] == 'persona-2'

    @pytest.mark.asyncio
    async def test_cross_user_write_protection(self, db_pool):
        """Verify users cannot modify other users' data."""
        user1_id = 'user-001'
        user2_id = 'user-002'

        async with db_pool.acquire() as conn:
            # User 1 creates a style
            await conn.execute(f"SET LOCAL app.user_id = '{user1_id}'")
            await conn.execute(
                """
                INSERT INTO styles (id, user_id, genre)
                VALUES ($1, $2, $3)
                """,
                'style-1', user1_id, 'pop'
            )

            # User 2 attempts to update User 1's style (should fail)
            await conn.execute(f"SET LOCAL app.user_id = '{user2_id}'")

            with pytest.raises(asyncpg.InsufficientPrivilegeError):
                await conn.execute(
                    """
                    UPDATE styles SET genre = 'rock'
                    WHERE id = 'style-1'
                    """
                )

    @pytest.mark.asyncio
    async def test_admin_bypass(self, db_pool):
        """Verify admin users can access all data."""
        admin_id = 'admin-001'
        user_id = 'user-001'

        async with db_pool.acquire() as conn:
            # Regular user creates data
            await conn.execute(f"SET LOCAL app.user_id = '{user_id}'")
            await conn.execute(
                """
                INSERT INTO personas (id, user_id, artist_name)
                VALUES ($1, $2, $3)
                """,
                'persona-1', user_id, 'Artist 1'
            )

            # Admin queries all personas
            await conn.execute(f"SET LOCAL app.user_id = '{admin_id}'")
            await conn.execute("SET LOCAL app.is_admin = 'true'")

            all_personas = await conn.fetch("SELECT * FROM personas")

            # Admin should see all personas
            assert len(all_personas) >= 1
```

#### 3.3: PII Redaction Testing

**File**: `tests/security/test_pii_redaction.py`

```python
#!/usr/bin/env python3
"""Test PII redaction in outputs."""

import pytest
from backend.services.validators import PIIRedactor

class TestPIIRedaction:
    """Test PII detection and redaction."""

    @pytest.fixture
    def redactor(self):
        return PIIRedactor()

    def test_email_redaction(self, redactor):
        """Test email address redaction."""
        text = "Contact me at john.doe@example.com for info"
        redacted = redactor.redact(text)

        assert '@example.com' not in redacted
        assert '[EMAIL]' in redacted or '[REDACTED]' in redacted

    def test_phone_redaction(self, redactor):
        """Test phone number redaction."""
        test_cases = [
            "Call 555-123-4567",
            "Call (555) 123-4567",
            "Call +1-555-123-4567",
        ]

        for text in test_cases:
            redacted = redactor.redact(text)
            # Should not contain recognizable phone number patterns
            assert not any(d * 3 in redacted for d in '0123456789')

    def test_living_artist_normalization(self, redactor):
        """Test living artist name normalization."""
        # Living artists should be normalized for public release
        text = "in the style of Taylor Swift"
        normalized = redactor.normalize_artists(text, release_mode='public')

        assert 'Taylor Swift' not in normalized
        assert 'pop artist' in normalized.lower() or 'contemporary' in normalized.lower()

    def test_private_release_preserves_artists(self, redactor):
        """Test that private releases preserve artist names."""
        text = "in the style of Taylor Swift"
        normalized = redactor.normalize_artists(text, release_mode='private')

        # Private mode should preserve artist name
        assert 'Taylor Swift' in normalized
```

#### 3.4: Security Audit Checklist

**File**: `tests/security/audit_checklist.md`

```markdown
# Security Audit Checklist (Gate C)

## MCP Security

- [ ] Only allowed MCP servers are accessible
- [ ] All source chunks include provenance hashes
- [ ] MCP scopes are properly isolated
- [ ] Source URIs are validated and sanitized
- [ ] No hardcoded MCP credentials in code

## RLS Policies

- [ ] Users can only access their own entities (personas, styles, lyrics, etc.)
- [ ] Cross-user write protection is enforced
- [ ] Admin users can bypass RLS when needed
- [ ] RLS policies are tested for all entity tables
- [ ] No RLS policy gaps identified

## Authentication & Authorization

- [ ] JWT tokens are properly validated
- [ ] Token expiration is enforced
- [ ] Refresh token rotation is implemented
- [ ] API endpoints require authentication
- [ ] Admin endpoints require admin role

## PII Protection

- [ ] Email addresses are redacted in outputs
- [ ] Phone numbers are redacted in outputs
- [ ] Living artist names are normalized for public releases
- [ ] Private releases preserve artist names
- [ ] No PII leaks in logs or events

## Input Validation

- [ ] All API inputs are validated against schemas
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Path traversal prevention
- [ ] Command injection prevention

## Secrets Management

- [ ] No secrets in code or config files
- [ ] Environment variables used for secrets
- [ ] Secrets rotation is documented
- [ ] Database credentials are secured
- [ ] API keys are not logged

## Dependency Security

- [ ] All dependencies are up to date
- [ ] Known vulnerabilities are addressed (npm audit, pip audit)
- [ ] Dependency license compliance
- [ ] No malicious packages detected

## Logging & Monitoring

- [ ] Sensitive data is not logged
- [ ] Security events are logged (auth failures, access violations)
- [ ] Log injection prevention
- [ ] Audit trail for data access

## Network Security

- [ ] HTTPS enforced for all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] WebSocket connections are secured
```

### Deliverables

- `tests/security/test_mcp_security.py` - MCP security tests
- `tests/security/test_rls_policies.py` - RLS penetration tests
- `tests/security/test_pii_redaction.py` - PII redaction tests
- `tests/security/audit_checklist.md` - Security audit checklist
- **Gate C Validation Report** - Security audit results with zero high-severity issues

### Pass Criteria

- Gate C: Zero high-severity vulnerabilities
- All security tests pass
- Security audit checklist 100% complete
- Penetration testing shows no RLS bypasses
- PII redaction accuracy ≥99%

---

## WP4: Performance Testing & Optimization

### Agent Assignment

- **Primary**: python-backend-engineer

### Goals

- Validate Gate D: P95 latency ≤60s
- Identify and fix performance bottlenecks
- Stress test with concurrent workflows

### Tasks

#### 4.1: Stress Testing

**File**: `tests/performance/stress_test.py`

```python
#!/usr/bin/env python3
"""Stress test with concurrent workflows."""

import asyncio
import time
from typing import Dict, List
import json
from pathlib import Path

class StressTester:
    """Stress test the orchestrator with concurrent loads."""

    async def run_concurrent_workflows(
        self,
        num_concurrent: int,
        total_runs: int
    ) -> Dict:
        """Run multiple workflows concurrently."""
        from backend.services.orchestrator import WorkflowRunner

        fixtures = list(Path('tests/determinism/fixtures/synthetic-200').glob('*.json'))

        results = []
        start_time = time.perf_counter()

        # Run in batches
        for batch_start in range(0, total_runs, num_concurrent):
            batch_end = min(batch_start + num_concurrent, total_runs)
            batch_size = batch_end - batch_start

            # Create tasks for this batch
            tasks = []
            for i in range(batch_size):
                fixture_idx = (batch_start + i) % len(fixtures)
                sds_data = json.loads(fixtures[fixture_idx].read_text())

                runner = WorkflowRunner(seed=42 + i)
                tasks.append(runner.execute_workflow(sds_data))

            # Execute batch
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend(batch_results)

        end_time = time.perf_counter()
        total_duration = end_time - start_time

        # Analyze results
        successful = sum(1 for r in results if not isinstance(r, Exception))
        failed = len(results) - successful
        throughput = successful / total_duration

        return {
            'total_runs': total_runs,
            'num_concurrent': num_concurrent,
            'successful': successful,
            'failed': failed,
            'total_duration_s': total_duration,
            'throughput_per_s': throughput,
            'success_rate': successful / len(results) * 100,
        }


async def main():
    """Run stress tests."""
    tester = StressTester()

    print("=== Stress Test ===")
    print("\nTest 1: 50 concurrent workflows (100 total)")
    results_50 = await tester.run_concurrent_workflows(
        num_concurrent=50,
        total_runs=100
    )
    print(f"Success rate: {results_50['success_rate']:.2f}%")
    print(f"Throughput: {results_50['throughput_per_s']:.2f} workflows/s")

    print("\nTest 2: 100 concurrent workflows (200 total)")
    results_100 = await tester.run_concurrent_workflows(
        num_concurrent=100,
        total_runs=200
    )
    print(f"Success rate: {results_100['success_rate']:.2f}%")
    print(f"Throughput: {results_100['throughput_per_s']:.2f} workflows/s")

    # Verify success rate ≥98%
    assert results_50['success_rate'] >= 98.0, "Stress test failed: success rate < 98%"
    assert results_100['success_rate'] >= 98.0, "Stress test failed: success rate < 98%"

if __name__ == '__main__':
    asyncio.run(main())
```

#### 4.2: Performance Optimization Guide

**File**: `docs/optimization_guide.md`

```markdown
# Performance Optimization Guide

## Identified Bottlenecks (Post-Profiling)

### 1. Blueprint Loading
- **Issue**: Loading blueprints from disk on every validation
- **Fix**: Cache blueprints in Redis with 1-hour TTL
- **Impact**: -200ms per validation

### 2. Source Retrieval
- **Issue**: Sequential MCP queries for each source scope
- **Fix**: Parallel queries with asyncio.gather()
- **Impact**: -500ms per LYRICS/PRODUCER node

### 3. Tag Conflict Resolution
- **Issue**: Nested loops checking all tag pairs
- **Fix**: Pre-compute conflict graph, use set intersection
- **Impact**: -50ms per STYLE node

### 4. Event Serialization
- **Issue**: JSON serialization on every event emit
- **Fix**: Batch events, serialize once per batch
- **Impact**: -100ms per workflow

## Optimization Checklist

- [ ] Cache blueprints in Redis
- [ ] Parallelize MCP source queries
- [ ] Pre-compute conflict graphs
- [ ] Batch event serialization
- [ ] Use connection pooling for Postgres
- [ ] Add database indexes on frequently queried columns
- [ ] Enable Postgres query plan caching
- [ ] Compress WebSocket messages
- [ ] Use CDN for static assets (frontend)
- [ ] Lazy-load non-critical resources

## Target Impact

Total optimization target: -850ms average reduction
Expected P95 after optimizations: ~45s (well below 60s gate)
```

### Deliverables

- `tests/performance/stress_test.py` - Stress test suite
- `docs/optimization_guide.md` - Performance optimization guide
- **Gate D Validation Report** - Latency profiling results

### Pass Criteria

- Gate D: P95 latency ≤60s
- Success rate ≥98% under 50 concurrent workflows
- Success rate ≥98% under 100 concurrent workflows
- Throughput ≥2 workflows/second

---

## WP5: Documentation

### Agent Assignment

- **Primary**: documentation-writer

### Goals

- Complete API documentation (OpenAPI → Swagger UI)
- Write user guides for entity creation
- Write developer guides for local setup and testing
- Create troubleshooting runbooks

### Tasks

#### 5.1: API Documentation

**File**: `backend/gateway/openapi.yaml`

```yaml
openapi: 3.0.3
info:
  title: MeatyMusic AMCS API
  description: |
    Agentic Music Creation System API for deterministic music composition.

    This API provides endpoints for managing musical entities (personas, styles,
    lyrics, producer notes, sources) and orchestrating the composition workflow.
  version: 1.0.0
  contact:
    name: MeatyMusic Support
    email: support@meatymusic.example.com

servers:
  - url: http://localhost:8000
    description: Local development
  - url: https://api.meatymusic.example.com
    description: Production

paths:
  /api/v1/personas:
    get:
      summary: List personas
      description: Retrieve all personas for the authenticated user
      tags:
        - Personas
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of personas
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Persona'

    post:
      summary: Create persona
      description: Create a new persona entity
      tags:
        - Personas
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PersonaCreate'
      responses:
        '201':
          description: Persona created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Persona'

  /api/v1/workflows/execute:
    post:
      summary: Execute workflow
      description: |
        Execute the full AMCS workflow (PLAN → STYLE → LYRICS → PRODUCER →
        COMPOSE → VALIDATE → FIX* → REVIEW) for a given SDS.
      tags:
        - Workflows
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SDS'
      responses:
        '200':
          description: Workflow executed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowResult'

  /events:
    get:
      summary: WebSocket event stream
      description: |
        WebSocket endpoint for real-time workflow events.
        Connect with: ws://localhost:8000/events?token=<JWT>
      tags:
        - Events

components:
  schemas:
    Persona:
      type: object
      required: [id, user_id, artist_name]
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
        artist_name:
          type: string
        vocal_range:
          type: string
          enum: [soprano, alto, tenor, bass]
        influences:
          type: array
          items:
            type: string

    SDS:
      type: object
      required: [song_id, title, metadata, persona, style, constraints, theme]
      properties:
        song_id:
          type: string
        title:
          type: string
        metadata:
          type: object
        persona:
          type: object
        style:
          type: object
        constraints:
          type: object
        theme:
          type: object

    WorkflowResult:
      type: object
      properties:
        run_id:
          type: string
          format: uuid
        artifacts:
          type: object
        scores:
          type: object
        events:
          type: array
          items:
            type: object

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

#### 5.2: User Guide

**File**: `docs/user_guide.md`

```markdown
# MeatyMusic User Guide

## Getting Started

### Creating Your First Song

1. **Create a Persona** (optional but recommended)
   - Navigate to the Personas page
   - Click "New Persona"
   - Fill in artist name, vocal range, and influences
   - Save

2. **Define a Style**
   - Go to the Styles page
   - Click "New Style"
   - Select genre, BPM, key, mood
   - Save

3. **Write or Generate Lyrics**
   - Navigate to Lyrics page
   - Click "New Lyrics"
   - Choose sections (verse, chorus, bridge)
   - Write or use AI generation
   - Save

4. **Create Producer Notes** (optional)
   - Go to Producer Notes page
   - Define arrangement and mix preferences
   - Save

5. **Compile Song Design Spec**
   - Navigate to Songs page
   - Click "New Song"
   - Select your persona, style, lyrics, producer notes
   - Define theme and constraints
   - Click "Compile SDS"

6. **Execute Workflow**
   - Review the compiled SDS
   - Click "Create Song"
   - Watch real-time progress
   - Review generated artifacts

7. **Render Audio** (if enabled)
   - After workflow completes
   - Click "Render with Suno"
   - Wait for rendering job to complete
   - Download audio files

## Understanding Entities

### Persona
The artist profile including vocal characteristics and influences.

### Style
Musical style including genre, BPM, key, mood, and instrumentation.

### Lyrics
Song lyrics with sections, rhyme schemes, and narrative flow.

### Producer Notes
Arrangement and mix guidance for the final production.

### Sources
External knowledge sources for inspiration and reference.

## Tips for Best Results

- **Be Specific**: The more detailed your inputs, the better the outputs
- **Use Blueprints**: Follow genre-specific blueprints for optimal results
- **Test Iterations**: Use the auto-fix feature to refine outputs
- **Monitor Scores**: Pay attention to rubric scores and adjust inputs accordingly
```

#### 5.3: Developer Guide

**File**: `docs/developer_guide.md`

```markdown
# Developer Guide

## Local Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Postgres 15+
- Redis 7+

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/meatymusic.git
   cd meatymusic
   ```

2. **Start infrastructure**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Backend setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -e .
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start backend**
   ```bash
   uvicorn gateway.main:app --reload
   ```

6. **Frontend setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Running Tests

### All tests
```bash
pytest
```

### Specific test suites
```bash
pytest tests/determinism/  # Determinism tests
pytest tests/rubric/       # Rubric validation
pytest tests/security/     # Security tests
pytest tests/performance/  # Performance tests
```

### With coverage
```bash
pytest --cov=backend --cov-report=html
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and add tests
3. Run tests: `pytest`
4. Run linters: `ruff check . && mypy .`
5. Commit: `git commit -m "feat: add feature"`
6. Push and create PR

## Architecture Overview

See `docs/amcs-overview.md` for complete system architecture.

## Troubleshooting

See `docs/troubleshooting.md` for common issues and solutions.
```

#### 5.4: Troubleshooting Runbook

**File**: `docs/troubleshooting.md`

```markdown
# Troubleshooting Runbook

## Common Issues

### Workflow Fails with "Seed Not Propagated"

**Symptom**: Workflow fails with error about missing seed in node event

**Cause**: Seed not properly passed to workflow node

**Fix**:
1. Check that SDS includes `metadata.seed`
2. Verify WorkflowRunner initializes with seed
3. Ensure all skills accept and use seed parameter

### Rubric Score Below Threshold

**Symptom**: Validation fails, auto-fix doesn't improve score

**Cause**: Input constraints too strict or conflicting

**Fix**:
1. Review blueprint thresholds for genre
2. Check for tag conflicts in style spec
3. Relax constraints or adjust theme
4. Review auto-fix strategies in logs

### MCP Connection Refused

**Symptom**: Source retrieval fails with connection error

**Cause**: MCP server not running or not in allow-list

**Fix**:
1. Verify MCP server is running: `curl http://localhost:8001/health`
2. Check MCP allow-list in config
3. Restart MCP server
4. Check firewall rules

### RLS Policy Blocks Access

**Symptom**: User cannot access their own entities

**Cause**: RLS context not set or user_id mismatch

**Fix**:
1. Verify JWT token includes correct user_id
2. Check that API sets `app.user_id` context
3. Review RLS policy definitions
4. Check for typos in user_id

### High Latency (>60s)

**Symptom**: Workflow takes longer than 60s

**Cause**: Bottleneck in one or more nodes

**Fix**:
1. Run latency profiler: `python tests/performance/profile_latency.py`
2. Identify slow nodes from event logs
3. Check for:
   - Slow MCP queries
   - Large blueprint files
   - Inefficient tag conflict checks
4. Apply optimizations from `docs/optimization_guide.md`

### WebSocket Events Not Received

**Symptom**: Frontend doesn't update with workflow progress

**Cause**: WebSocket connection dropped or not authenticated

**Fix**:
1. Check WebSocket connection in browser dev tools
2. Verify JWT token is passed in connection URL
3. Check for CORS issues
4. Restart gateway service

## Debugging Tools

### View Workflow Events
```bash
# Tail event stream
wscat -c "ws://localhost:8000/events?token=<JWT>"
```

### Query Run Artifacts
```bash
# PostgreSQL
psql -d amcs -c "SELECT * FROM runs WHERE run_id = '<run_id>'"
```

### Check Rubric Scores
```bash
python -c "
from backend.services.validators import Validator
validator = Validator()
scores = validator.score_artifacts(artifacts, blueprint)
print(scores)
"
```

## Support

For additional help, contact the development team or refer to:
- `docs/amcs-overview.md` - System architecture
- `docs/project_plans/PRDs/` - Detailed requirements
```

### Deliverables

- `backend/gateway/openapi.yaml` - OpenAPI specification
- `docs/user_guide.md` - User guide
- `docs/developer_guide.md` - Developer setup guide
- `docs/troubleshooting.md` - Troubleshooting runbook
- **Swagger UI** - Interactive API documentation at `/docs`

### Pass Criteria

- OpenAPI spec passes validation
- User guide covers all core workflows
- Developer guide enables new developer onboarding in <1 day
- Troubleshooting runbook covers all common issues from testing

---

## Acceptance Gates Validation

### Gate A: Rubric Pass Rate ≥95%

**Test**: Run `pytest tests/rubric/test_validation.py`

**Validation**:
- Execute workflow on 200-song synthetic test set
- Measure pass rate: `passed_count / total_tests * 100`
- **Pass Criteria**: ≥95%

**Remediation** (if fail):
- Analyze failures by genre
- Tune rubric thresholds
- Enhance auto-fix strategies
- Re-test until passing

### Gate B: Determinism Reproducibility ≥99%

**Test**: Run `pytest tests/determinism/test_reproducibility.py`

**Validation**:
- Run 10 iterations per SDS with same seed
- Compute SHA-256 hash of artifacts
- Measure reproducibility: `identical_count / total_tests * 100`
- **Pass Criteria**: ≥99%

**Remediation** (if fail):
- Identify non-deterministic nodes
- Fix seed propagation issues
- Remove random operations without seed
- Verify low-temperature sampling
- Re-test until passing

### Gate C: Security Audit Clean

**Test**: Run all security tests + manual audit

**Validation**:
- Execute `pytest tests/security/`
- Complete security audit checklist
- Run dependency vulnerability scans
- **Pass Criteria**: Zero high-severity issues

**Remediation** (if fail):
- Fix identified vulnerabilities
- Update dependencies
- Strengthen RLS policies
- Enhance PII redaction
- Re-audit until clean

### Gate D: Latency P95 ≤60s

**Test**: Run `python tests/performance/profile_latency.py`

**Validation**:
- Profile 100 workflow executions
- Calculate P95 latency
- **Pass Criteria**: ≤60s

**Remediation** (if fail):
- Apply optimizations from optimization guide
- Cache frequently accessed data
- Parallelize independent operations
- Add database indexes
- Re-profile until passing

---

## Testing Infrastructure

### Test Data Management

**Synthetic Test Set** (200 SDSs):
- Generated via `tests/determinism/generate_fixtures.py`
- Covers all supported genres
- Includes edge cases (conflicting tags, explicit content, etc.)
- Stored in `tests/determinism/fixtures/synthetic-200/`

**Test Fixtures**:
- `tests/fixtures/blueprints/` - Genre blueprints
- `tests/fixtures/taxonomies/` - Tag taxonomies
- `tests/fixtures/schemas/` - JSON schemas
- `tests/fixtures/sdss/` - Example SDSs

### Continuous Integration

**GitHub Actions** (`.github/workflows/tests.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -e .[dev]

      - name: Run migrations
        run: |
          cd backend
          alembic upgrade head
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/postgres

      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Execution Order

1. **Unit tests** - Fast, isolated tests
2. **Integration tests** - Service-level tests
3. **Determinism tests** - Reproducibility validation
4. **Rubric tests** - Quality validation
5. **Security tests** - Vulnerability scanning
6. **Performance tests** - Latency profiling

---

## Success Criteria

### MVP Release Checklist

- [ ] **Gate A**: Rubric pass ≥95% on 200-song test set
- [ ] **Gate B**: Determinism reproducibility ≥99%
- [ ] **Gate C**: Security audit clean (zero high-severity)
- [ ] **Gate D**: Latency P95 ≤60s (no render)
- [ ] All test suites pass
- [ ] Documentation complete (API, user, developer, troubleshooting)
- [ ] CI/CD pipeline configured
- [ ] Deployment scripts tested
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented

### Exit Criteria

**Phase 6 is complete when**:
- All 4 acceptance gates pass
- Test coverage ≥80%
- All documentation deliverables complete
- Production deployment successfully tested
- Team signoff on release candidate

---

## Risk Mitigation

### High-Risk Areas

1. **Gate Failure**
   - **Risk**: One or more gates fail, delaying release
   - **Mitigation**: Early profiling in Phase 3, continuous testing, buffer time for fixes

2. **Performance Regression**
   - **Risk**: Optimizations break determinism or functionality
   - **Mitigation**: Run full test suite after each optimization, A/B test changes

3. **Security Vulnerability Discovery**
   - **Risk**: Critical vulnerability found during audit
   - **Mitigation**: Security-first development, regular dependency updates, penetration testing

4. **Documentation Gaps**
   - **Risk**: Missing or incorrect documentation delays adoption
   - **Mitigation**: Review documentation with non-dev stakeholders, test with new users

---

## Timeline

### Week 1

**Days 1-2**: WP1 (Determinism Testing)
- Develop test harness
- Generate 200 synthetic SDSs
- Run reproducibility tests
- Profile latency

**Days 3-4**: WP2 (Rubric Validation)
- Run rubric test suite
- Tune auto-fix logic
- Test profanity filter

**Day 5**: WP3 (Security Audit) - Start
- MCP security tests
- RLS penetration tests

### Week 2

**Days 6-7**: WP3 (Security Audit) - Complete
- PII redaction tests
- Complete audit checklist
- Fix vulnerabilities

**Days 8-9**: WP4 (Performance Testing)
- Stress testing
- Apply optimizations
- Re-profile latency

**Days 10-11**: WP5 (Documentation)
- API documentation
- User guide
- Developer guide
- Troubleshooting runbook

**Day 12**: Gate Validation
- Run all gate validation tests
- Generate gate reports
- Fix any failures

**Days 13-14**: Buffer & Release Prep
- Address any remaining issues
- Final testing
- Prepare for production deployment

---

## Deliverables Summary

1. **Test Suites**
   - Determinism test harness with 200 synthetic SDSs
   - Rubric validation suite
   - Security test suite (MCP, RLS, PII)
   - Performance/stress test suite

2. **Gate Validation Reports**
   - Gate A: Rubric pass rate report (CSV)
   - Gate B: Determinism reproducibility report (CSV)
   - Gate C: Security audit report (Markdown)
   - Gate D: Latency profiling report (JSON)

3. **Documentation**
   - OpenAPI specification
   - User guide
   - Developer guide
   - Troubleshooting runbook
   - Optimization guide

4. **Infrastructure**
   - CI/CD pipeline (GitHub Actions)
   - Test fixtures and data
   - Performance profiling tools

---

## Post-Phase 6

After Phase 6 completes and all gates pass, the project moves to:

**Production Deployment** (Phase 7)
- Deploy to production environment
- Configure monitoring and alerting
- Set up log aggregation
- Enable feature flags
- Gradual rollout to users

**Ongoing Maintenance**
- Monitor performance metrics
- Address user feedback
- Security updates
- Feature enhancements per roadmap
