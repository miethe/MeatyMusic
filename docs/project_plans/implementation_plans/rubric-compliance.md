# WP-N9: Rubric Compliance Testing
**Detailed Implementation Plan for 200-Song Test Suite and Convergence Analysis**

**Work Package**: WP-N9
**Status**: Ready for Implementation
**Duration**: 2-3 weeks | **Story Points**: 60
**Owner**: QA Automation Engineer + QA Specialist
**Success Criteria**: ≥95% pass rate, ≥90% auto-fix convergence, ≥99% determinism

---

## Overview

Rubric compliance testing validates the core AMCS requirement: deterministic artifact generation that passes quality gates. This workstream creates and executes a comprehensive 200-song test suite covering all genres and complexity levels.

**Four Components**:

1. **200-Song Test Suite Generation** (21 story points)
   - 30 Pop, 30 Rock, 30 Hip-Hop, 30 Country, 30 Electronic, 20 Other
   - Varying complexity (3-20 sections)
   - Edge cases (minimum/maximum BPM, unusual rhyme schemes)
   - Validation that all SDSs conform to schema

2. **Rubric Compliance Validation Framework** (13 story points)
   - Execute workflow on all 200 SDSs
   - Capture validation scores per genre/complexity
   - Identify failure patterns
   - Generate compliance report

3. **Auto-Fix Convergence Analysis** (13 story points)
   - Track FIX loop iterations per SDS
   - Measure convergence rate (target: ≥90% within 3 iterations)
   - Identify SDSs that don't converge
   - Recommend threshold adjustments

4. **Determinism Validation** (13 story points)
   - Run 50 SDSs × 10 times with same seed
   - Compare SHA-256 hashes of artifacts
   - Validate ≥99% reproducibility
   - Identify non-deterministic behaviors

---

## Detailed Task Breakdown

### Task N9.1: 200-Song Test Suite Generation (21 story points)

**Goal**: Create 200 diverse, valid SDSs representing all blueprint genres and edge cases

#### N9.1.1: SDS Generator Script (8 story points)

**File**: `scripts/generate-test-sdss.py`

**Purpose**: Generate valid SDS JSON matching schema, with strategic variation

```python
"""
Generate diverse test SDSs for rubric compliance testing.

Generates 200 SDSs with:
- All blueprint genres (pop, rock, hip-hop, country, electronic, ccm, latin, etc.)
- Varying complexity (3-20 sections)
- Edge cases (min/max BPM, unusual rhyme schemes)
- Deterministic (use seed for reproducibility)
"""

import json
import random
from typing import Any, Dict, List
from uuid import uuid4

class SDSGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        self.seed = seed
        self.genres = [
            'pop', 'rock', 'hip-hop', 'country', 'electronic',
            'ccm', 'latin', 'rnb', 'indie', 'folk'
        ]

    def generate_style(self, genre: str) -> Dict[str, Any]:
        """Generate style spec for genre."""
        tempo_ranges = {
            'pop': [110, 140],
            'rock': [90, 140],
            'hip-hop': [80, 120],
            'country': [100, 130],
            'electronic': [100, 140],
            'ccm': [80, 140],
            'latin': [100, 160],
            'rnb': [60, 110],
            'indie': [100, 140],
            'folk': [80, 130],
        }

        moods = {
            'pop': ['upbeat', 'catchy', 'energetic'],
            'rock': ['powerful', 'energetic', 'intense'],
            'hip-hop': ['cool', 'confident', 'urban'],
            'country': ['storytelling', 'warm', 'nostalgic'],
            'electronic': ['futuristic', 'energetic', 'hypnotic'],
        }

        tempo = tempo_ranges.get(genre, [100, 130])

        return {
            'genre_detail': {'primary': genre.title()},
            'tempo_bpm': tempo,
            'key': {'primary': random.choice(['C major', 'G major', 'D major', 'A minor'])},
            'mood': random.sample(moods.get(genre, ['energetic']),
                                  min(2, len(moods.get(genre, ['energetic'])))),
            'energy': random.choice(['low', 'medium', 'high', 'anthemic']),
            'tags': [],
            'instrumentation': random.sample(
                ['guitar', 'drums', 'bass', 'synth', 'piano', 'strings'],
                min(3, random.randint(1, 3))
            )
        }

    def generate_lyrics(self, complexity: str = 'medium') -> Dict[str, Any]:
        """Generate lyrics spec with varying complexity."""
        # Complexity determines section count
        if complexity == 'simple':
            sections = ['Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Chorus']
        elif complexity == 'medium':
            sections = ['Intro', 'Verse', 'Verse', 'PreChorus', 'Chorus', 'Bridge', 'Chorus', 'Outro']
        else:  # complex
            sections = ['Intro'] + ['Verse'] * random.randint(3, 5) + \
                      ['PreChorus'] * 2 + ['Chorus'] * 3 + \
                      ['Bridge', 'Outro']

        return {
            'language': 'en',
            'section_order': sections,
            'pov': random.choice(['1st', '2nd', '3rd']),
            'tense': random.choice(['past', 'present', 'future']),
            'rhyme_scheme': random.choice(['AABB', 'ABAB', 'ABCB']),
            'syllables_per_line': random.randint(8, 12),
            'hook_strategy': random.choice(['melodic', 'lyrical', 'call-response']),
            'repetition_policy': random.choice(['sparse', 'moderate', 'hook-heavy']),
            'imagery_density': round(random.uniform(0.3, 0.9), 1),
            'constraints': {
                'explicit': random.choice([True, False]),
                'max_lines': 120
            }
        }

    def generate_producer_notes(self, section_count: int) -> Dict[str, Any]:
        """Generate producer notes."""
        structure = ' – '.join(['Section'] * section_count)
        return {
            'structure': structure,
            'hooks': random.randint(1, 3),
            'instrumentation': ['guitar', 'drums'],
            'section_meta': {},
            'mix': {
                'lufs': -12.0,
                'space': random.choice(['minimal', 'normal', 'lush']),
                'stereo_width': random.choice(['narrow', 'normal', 'wide'])
            }
        }

    def generate_sds(self, index: int, genre: str = None) -> Dict[str, Any]:
        """Generate complete SDS."""
        if genre is None:
            genre = random.choice(self.genres)

        complexity = random.choice(['simple', 'medium', 'complex'])
        section_count = {'simple': 6, 'medium': 8, 'complex': random.randint(10, 20)}[complexity]

        return {
            'title': f'Test Song {index:03d} - {genre.title()}',
            'blueprint_ref': {'genre': genre.title(), 'version': '2025.11'},
            'style': self.generate_style(genre),
            'lyrics': self.generate_lyrics(complexity),
            'producer_notes': self.generate_producer_notes(section_count),
            'persona_id': None,
            'sources': [],
            'prompt_controls': {
                'positive_tags': [],
                'negative_tags': [],
                'max_style_chars': 1000,
                'max_prompt_chars': 5000
            },
            'render': {'engine': 'none', 'model': None, 'num_variations': 1},
            'seed': self.seed + index
        }

    def generate_batch(self, count: int = 200) -> List[Dict[str, Any]]:
        """Generate batch of SDSs with genre distribution."""
        distribution = {
            'pop': 30,
            'rock': 30,
            'hip-hop': 30,
            'country': 30,
            'electronic': 30,
            'ccm': 10,
            'latin': 10,
            'rnb': 10,
            'indie': 9,
            'folk': 1
        }

        sdss = []
        idx = 1

        for genre, count in distribution.items():
            for _ in range(count):
                sdss.append(self.generate_sds(idx, genre))
                idx += 1

        # Shuffle to prevent ordering bias
        random.shuffle(sdss)

        return sdss


def main():
    """Generate and save 200-song test suite."""
    generator = SDSGenerator(seed=42)
    sdss = generator.generate_batch(200)

    # Save to fixtures
    output_path = 'tests/rubric/fixtures/sds-200.json'
    with open(output_path, 'w') as f:
        json.dump(sdss, f, indent=2)

    print(f'Generated {len(sdss)} SDSs')
    print(f'Saved to {output_path}')

    # Validate all SDSs
    from jsonschema import validate
    with open('schemas/sds.schema.json') as f:
        sds_schema = json.load(f)

    failed = []
    for i, sds in enumerate(sdss):
        try:
            validate(instance=sds, schema=sds_schema)
        except Exception as e:
            failed.append((i, str(e)))

    if failed:
        print(f'Warning: {len(failed)} SDSs failed validation:')
        for idx, error in failed[:5]:
            print(f'  SDS {idx}: {error}')
    else:
        print('All SDSs validated successfully!')


if __name__ == '__main__':
    main()
```

**Usage**:
```bash
python scripts/generate-test-sdss.py
# Output: tests/rubric/fixtures/sds-200.json
```

---

#### N9.1.2: Test Suite Organization (5 story points)

**Directory Structure**:
```
tests/rubric/
├── fixtures/
│   ├── sds-200.json          # Full 200-song suite
│   ├── genres/
│   │   ├── pop-30.json       # Pop subset
│   │   ├── rock-30.json      # Rock subset
│   │   ├── hiphop-30.json    # Hip-Hop subset
│   │   ├── country-30.json   # Country subset
│   │   ├── electronic-30.json # Electronic subset
│   │   ├── other-20.json     # Other genres
│   │   └── edge-cases.json   # Min/max BPM, edge cases
│   └── metadata.json         # Genre/complexity mapping
├── test_compliance.py        # Compliance validation
├── test_convergence.py       # Auto-fix analysis
├── test_determinism.py       # Reproducibility
└── reports/                  # Generated reports
    ├── compliance-report.json
    ├── convergence-analysis.json
    └── determinism-report.json
```

**Metadata File** (`tests/rubric/fixtures/metadata.json`):
```json
{
  "total": 200,
  "distribution": {
    "pop": 30,
    "rock": 30,
    "hip-hop": 30,
    "country": 30,
    "electronic": 30,
    "ccm": 10,
    "latin": 10,
    "rnb": 10,
    "indie": 9,
    "folk": 1
  },
  "complexity": {
    "simple": 50,
    "medium": 100,
    "complex": 50
  },
  "edge_cases": 20
}
```

---

#### N9.1.3: Validation & Sanity Checks (8 story points)

**File**: `scripts/validate-test-suite.py`

**Checks**:
1. All SDSs valid JSON
2. All match SDS schema
3. Genre distribution correct
4. No duplicate titles
5. Seed values unique
6. Blueprints exist for all genres

```python
def validate_test_suite(sds_file: str) -> bool:
    """Validate entire test suite."""
    with open(sds_file) as f:
        sdss = json.load(f)

    errors = []

    # Check count
    if len(sdss) != 200:
        errors.append(f'Expected 200 SDSs, got {len(sdss)}')

    # Check schema
    with open('schemas/sds.schema.json') as f:
        schema = json.load(f)

    for i, sds in enumerate(sdss):
        try:
            validate(instance=sds, schema=schema)
        except Exception as e:
            errors.append(f'SDS {i} schema invalid: {e}')

    # Check genre distribution
    genres = [sds['blueprint_ref']['genre'] for sds in sdss]
    genre_counts = Counter(genres)
    print(f'Genre distribution: {dict(genre_counts)}')

    # Check uniqueness
    titles = [sds['title'] for sds in sdss]
    if len(titles) != len(set(titles)):
        errors.append('Duplicate titles found')

    seeds = [sds['seed'] for sds in sdss]
    if len(seeds) != len(set(seeds)):
        errors.append('Duplicate seeds found')

    if errors:
        print('Validation errors:')
        for error in errors:
            print(f'  - {error}')
        return False

    print('All SDSs valid!')
    return True
```

---

### Task N9.2: Rubric Compliance Validation Framework (13 story points)

**Goal**: Execute workflow on 200 SDSs and capture results

#### N9.2.1: Test Compliance Runner (5 story points)

**File**: `tests/rubric/test_compliance.py`

```python
"""Test rubric compliance on 200-song suite."""

import json
import asyncio
from pathlib import Path
from typing import List, Dict, Any
from collections import defaultdict

import pytest
from fastapi.testclient import TestClient
from app.main import app


class ComplianceRunner:
    def __init__(self, sds_file: str = 'tests/rubric/fixtures/sds-200.json'):
        self.client = TestClient(app)
        self.sds_file = sds_file
        self.results = defaultdict(list)

    def load_sdss(self) -> List[Dict[str, Any]]:
        """Load test SDSs."""
        with open(self.sds_file) as f:
            return json.load(f)

    def run_compliance_tests(self, limit: int = None) -> Dict[str, Any]:
        """Run workflow on all SDSs and capture results."""
        sdss = self.load_sdss()
        if limit:
            sdss = sdss[:limit]

        passed = 0
        failed = 0
        errors = []

        for i, sds in enumerate(sdss):
            try:
                # Create song
                song_response = self.client.post(
                    '/api/v1/songs',
                    json={
                        'title': sds['title'],
                        'sds': sds
                    }
                )
                assert song_response.status_code == 201
                song_id = song_response.json()['id']

                # Launch workflow
                run_response = self.client.post(
                    f'/api/v1/songs/{song_id}/runs',
                    json={'seed': sds['seed']}
                )
                assert run_response.status_code == 201
                run_id = run_response.json()['id']

                # Poll for completion
                max_retries = 120  # 2 minutes
                for _ in range(max_retries):
                    run = self.client.get(f'/api/v1/runs/{run_id}').json()
                    if run['status'] in ['completed', 'failed']:
                        break
                    await asyncio.sleep(1)

                # Check validation result
                if run['status'] == 'completed':
                    validation = run.get('outputs', {}).get('validation', {})
                    score = validation.get('total_score', 0)

                    if score >= 0.80:  # min_total threshold
                        passed += 1
                        self.results['passed'].append({
                            'sds_index': i,
                            'title': sds['title'],
                            'genre': sds['blueprint_ref']['genre'],
                            'score': score
                        })
                    else:
                        failed += 1
                        self.results['failed'].append({
                            'sds_index': i,
                            'title': sds['title'],
                            'genre': sds['blueprint_ref']['genre'],
                            'score': score,
                            'reason': 'Low validation score'
                        })
                else:
                    failed += 1
                    self.results['failed'].append({
                        'sds_index': i,
                        'title': sds['title'],
                        'genre': sds['blueprint_ref']['genre'],
                        'reason': 'Workflow failed'
                    })

            except Exception as e:
                failed += 1
                errors.append((i, str(e)))

        # Calculate metrics
        total = len(sdss)
        pass_rate = (passed / total * 100) if total > 0 else 0

        return {
            'total': total,
            'passed': passed,
            'failed': failed,
            'pass_rate': pass_rate,
            'results': dict(self.results),
            'errors': errors
        }


@pytest.mark.slow
def test_rubric_compliance():
    """Test rubric compliance on 200-song suite."""
    runner = ComplianceRunner()
    results = runner.run_compliance_tests()

    # Save report
    report_path = Path('tests/rubric/reports/compliance-report.json')
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Assert pass rate >= 95%
    assert results['pass_rate'] >= 95.0, \
        f"Pass rate {results['pass_rate']}% < 95% target"

    print(f"\nCompliance Report:")
    print(f"  Total SDSs: {results['total']}")
    print(f"  Passed: {results['passed']}")
    print(f"  Failed: {results['failed']}")
    print(f"  Pass Rate: {results['pass_rate']:.1f}%")
```

**Running Tests**:
```bash
# Run compliance tests on all 200 SDSs
pytest tests/rubric/test_compliance.py -v --tb=short

# Run on subset (faster for development)
pytest tests/rubric/test_compliance.py -k "compliance" --limit 50
```

---

#### N9.2.2: Failure Analysis & Reporting (5 story points)

**File**: `scripts/analyze-failures.py`

```python
"""Analyze compliance test failures."""

import json
from collections import Counter

def analyze_failures(report_file: str):
    """Analyze failure patterns."""
    with open(report_file) as f:
        report = json.load(f)

    failed_sdss = report['results']['failed']

    if not failed_sdss:
        print('All tests passed!')
        return

    print(f'\nFailure Analysis ({len(failed_sdss)} failed):')

    # Group by genre
    by_genre = Counter(s['genre'] for s in failed_sdss)
    print('\nFailures by genre:')
    for genre, count in by_genre.most_common():
        print(f'  {genre}: {count}')

    # Group by reason
    by_reason = Counter(s.get('reason', 'Unknown') for s in failed_sdss)
    print('\nFailures by reason:')
    for reason, count in by_reason.most_common():
        print(f'  {reason}: {count}')

    # List failing SDSs
    print('\nFailing SDSs:')
    for sds in failed_sdss[:10]:
        print(f"  - {sds['title']} ({sds['genre']})")

    # Recommendations
    print('\nRecommendations:')
    if any(s.get('reason') == 'Low validation score' for s in failed_sdss):
        print('  - Review validation rubric thresholds')
        print('  - Check for edge cases in test data')
    if any(s.get('reason') == 'Workflow failed' for s in failed_sdss):
        print('  - Investigate skill execution errors')
        print('  - Review error logs')


if __name__ == '__main__':
    analyze_failures('tests/rubric/reports/compliance-report.json')
```

---

#### N9.2.3: Genre-Specific Analysis (3 story points)

**File**: `tests/rubric/test_compliance_by_genre.py`

```python
"""Test compliance per genre."""

import json
import pytest

def load_genre_sdss(genre: str) -> List:
    """Load SDSs for specific genre."""
    with open('tests/rubric/fixtures/sds-200.json') as f:
        sdss = json.load(f)
    return [s for s in sdss if s['blueprint_ref']['genre'].lower() == genre.lower()]


@pytest.mark.parametrize('genre', [
    'pop', 'rock', 'hip-hop', 'country', 'electronic'
])
def test_genre_compliance(genre: str):
    """Test compliance for specific genre."""
    runner = ComplianceRunner()
    sdss = load_genre_sdss(genre)

    results = {
        'genre': genre,
        'total': len(sdss),
        'passed': 0,
        'failed': 0
    }

    # Run workflow on each SDS
    for sds in sdss:
        try:
            # ... (same as main compliance test)
            results['passed'] += 1
        except:
            results['failed'] += 1

    # Assert pass rate >= 95%
    pass_rate = results['passed'] / results['total'] * 100
    assert pass_rate >= 95.0, f"{genre}: {pass_rate}% < 95%"

    print(f"\n{genre.upper()}: {results['passed']}/{results['total']} passed ({pass_rate:.1f}%)")
```

---

### Task N9.3: Auto-Fix Convergence Analysis (13 story points)

**Goal**: Track FIX loop iterations and measure convergence rate

#### N9.3.1: Convergence Tracking (5 story points)

**File**: `tests/rubric/test_convergence.py`

```python
"""Analyze auto-fix convergence."""

import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Any


@dataclass
class ConvergenceResult:
    sds_index: int
    title: str
    genre: str
    initial_score: float
    final_score: float
    fix_iterations: int
    converged: bool  # True if converged within 3 iterations


class ConvergenceAnalyzer:
    def __init__(self, max_iterations: int = 3, min_threshold: float = 0.80):
        self.max_iterations = max_iterations
        self.min_threshold = min_threshold
        self.results: List[ConvergenceResult] = []

    def track_workflow(self, run_data: Dict[str, Any]) -> ConvergenceResult:
        """Track FIX loop iterations in workflow execution."""
        sds_index = run_data['sds_index']
        title = run_data['title']
        genre = run_data['genre']

        # Get initial validation score (after COMPOSE, before FIX)
        initial_validation = run_data.get('nodes', {}).get('VALIDATE', {})
        initial_score = initial_validation.get('outputs', {}).get('total_score', 0)

        # Count FIX iterations
        fix_iterations = 0
        final_score = initial_score

        node_events = run_data.get('node_events', [])
        for event in node_events:
            if event['node'] == 'FIX' and event['phase'] == 'start':
                fix_iterations += 1

        # Get final validation score
        final_validation = run_data.get('nodes', {}).get('VALIDATE', {})
        final_score = final_validation.get('outputs', {}).get('total_score', initial_score)

        # Check convergence
        converged = fix_iterations <= self.max_iterations and final_score >= self.min_threshold

        result = ConvergenceResult(
            sds_index=sds_index,
            title=title,
            genre=genre,
            initial_score=initial_score,
            final_score=final_score,
            fix_iterations=fix_iterations,
            converged=converged
        )

        self.results.append(result)
        return result

    def generate_report(self) -> Dict[str, Any]:
        """Generate convergence analysis report."""
        if not self.results:
            return {'total': 0, 'convergence_rate': 0}

        converged = sum(1 for r in self.results if r.converged)
        total = len(self.results)
        convergence_rate = (converged / total * 100) if total > 0 else 0

        # Group by iteration count
        by_iterations = {}
        for result in self.results:
            count = result.fix_iterations
            if count not in by_iterations:
                by_iterations[count] = 0
            by_iterations[count] += 1

        # Score improvement
        improvements = [r.final_score - r.initial_score for r in self.results]
        avg_improvement = sum(improvements) / len(improvements) if improvements else 0

        return {
            'total': total,
            'converged': converged,
            'convergence_rate': convergence_rate,
            'by_iterations': by_iterations,
            'avg_score_improvement': avg_improvement,
            'non_converged': [asdict(r) for r in self.results if not r.converged],
            'results': [asdict(r) for r in self.results]
        }


def test_convergence_analysis():
    """Test auto-fix convergence on compliance test data."""
    analyzer = ConvergenceAnalyzer(max_iterations=3)

    # Load compliance results
    with open('tests/rubric/reports/compliance-report.json') as f:
        compliance_report = json.load(f)

    # Track convergence for each run
    # (In actual implementation, retrieve from database or workflow logs)
    # ...

    # Generate report
    report = analyzer.generate_report()

    # Save report
    report_path = 'tests/rubric/reports/convergence-analysis.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    # Assert convergence >= 90%
    assert report['convergence_rate'] >= 90.0, \
        f"Convergence rate {report['convergence_rate']}% < 90% target"

    print(f"\nConvergence Report:")
    print(f"  Total SDSs: {report['total']}")
    print(f"  Converged: {report['converged']}")
    print(f"  Convergence Rate: {report['convergence_rate']:.1f}%")
    print(f"  Avg Score Improvement: {report['avg_score_improvement']:.3f}")
    print(f"  Iteration Distribution: {report['by_iterations']}")
```

---

#### N9.3.2: Failure Pattern Analysis (5 story points)

**File**: `scripts/analyze-convergence.py`

```python
"""Analyze convergence failures."""

import json
from collections import Counter

def analyze_convergence(report_file: str):
    """Analyze non-converging SDSs."""
    with open(report_file) as f:
        report = json.load(f)

    non_converged = report.get('non_converged', [])

    if not non_converged:
        print('All SDSs converged!')
        return

    print(f'\nConvergence Failure Analysis ({len(non_converged)} failed):')

    # Group by genre
    by_genre = Counter(s['genre'] for s in non_converged)
    print('\nNon-converged by genre:')
    for genre, count in by_genre.most_common():
        print(f'  {genre}: {count}')

    # Group by iteration count
    by_iterations = Counter(s['fix_iterations'] for s in non_converged)
    print('\nNon-converged by FIX iterations:')
    for iters, count in sorted(by_iterations.items()):
        print(f'  {iters} iterations: {count}')

    # Score stuck at
    stuck_scores = [s['final_score'] for s in non_converged]
    avg_stuck = sum(stuck_scores) / len(stuck_scores) if stuck_scores else 0
    print(f'\nAverage stuck score: {avg_stuck:.3f} (threshold: 0.80)')

    # Recommendations
    print('\nRecommendations:')
    if avg_stuck > 0.75:
        print('  - Consider lowering threshold from 0.80 to 0.75')
    else:
        print('  - Review FIX skill implementation')
        print('  - Check for edge cases in test data')
        print('  - Increase max FIX iterations from 3')

    # List non-converged SDSs
    print('\nNon-converged SDSs:')
    for sds in non_converged[:10]:
        print(f"  - {sds['title']} ({sds['genre']}, final_score={sds['final_score']:.3f})")
```

---

#### N9.3.3: Tuning & Recommendations (3 story points)

**File**: `scripts/recommend-rubric-tuning.py`

```python
"""Recommend rubric threshold adjustments."""

import json


def recommend_tuning(compliance_report: str, convergence_report: str):
    """Recommend rubric threshold tuning."""
    with open(compliance_report) as f:
        compliance = json.load(f)

    with open(convergence_report) as f:
        convergence = json.load(f)

    print('\n=== RUBRIC TUNING RECOMMENDATIONS ===\n')

    # Recommendation 1: Pass rate
    pass_rate = compliance['pass_rate']
    if pass_rate < 90:
        print(f'CRITICAL: Pass rate {pass_rate:.1f}% < 90%')
        print('  ACTION: Lower min_total threshold from 0.80 to 0.75')
    elif pass_rate < 95:
        print(f'WARNING: Pass rate {pass_rate:.1f}% < 95% target')
        print('  ACTION: Consider lowering threshold to 0.75')
    else:
        print(f'PASS RATE: {pass_rate:.1f}% ✓ (meets 95% target)')

    # Recommendation 2: Convergence rate
    conv_rate = convergence['convergence_rate']
    if conv_rate < 85:
        print(f'\nCRITICAL: Convergence rate {conv_rate:.1f}% < 85%')
        print('  ACTION: Increase max FIX iterations from 3 to 5')
    elif conv_rate < 90:
        print(f'\nWARNING: Convergence rate {conv_rate:.1f}% < 90% target')
        print('  ACTION: Increase max FIX iterations to 4')
    else:
        print(f'\nCONVERGENCE: {conv_rate:.1f}% ✓ (meets 90% target)')

    # Recommendation 3: Score distribution
    failed_sdss = compliance['results'].get('failed', [])
    if failed_sdss:
        avg_fail_score = sum(s.get('score', 0) for s in failed_sdss) / len(failed_sdss)
        print(f'\nFAILED SDS AVG SCORE: {avg_fail_score:.3f}')
        if avg_fail_score > 0.75:
            print('  ACTION: Consider threshold of 0.70-0.75')

    print('\n=== SUMMARY ===')
    print(f'Current Settings:')
    print('  min_total_score: 0.80')
    print('  max_fix_iterations: 3')
    print(f'\nActual Results:')
    print(f'  Pass Rate: {pass_rate:.1f}%')
    print(f'  Convergence Rate: {conv_rate:.1f}%')
```

---

### Task N9.4: Determinism Validation (13 story points)

**Goal**: Validate ≥99% reproducibility (50 SDSs × 10 runs)

#### N9.4.1: Determinism Test Suite (5 story points)

**File**: `tests/rubric/test_determinism.py`

```python
"""Test determinism: identical outputs with same seed."""

import json
import hashlib
from typing import Dict, Any, List


class DeterminismValidator:
    def __init__(self, num_sdss: int = 50, num_runs: int = 10):
        self.num_sdss = num_sdss
        self.num_runs = num_runs
        self.results = []

    def hash_artifact(self, artifact: Dict[str, Any]) -> str:
        """Create SHA-256 hash of artifact."""
        artifact_json = json.dumps(artifact, sort_keys=True)
        return hashlib.sha256(artifact_json.encode()).hexdigest()

    def run_determinism_test(self, sds: Dict[str, Any]) -> Dict[str, Any]:
        """Run SDS N times and compare outputs."""
        seed = sds['seed']
        title = sds['title']
        outputs = []

        # Run workflow N times with same seed
        for i in range(self.num_runs):
            # Execute workflow
            run_result = self.execute_workflow(sds)

            # Hash all artifacts
            artifacts = run_result.get('artifacts', {})
            hashes = {
                'style': self.hash_artifact(artifacts.get('style', {})),
                'lyrics': self.hash_artifact(artifacts.get('lyrics', {})),
                'producer_notes': self.hash_artifact(artifacts.get('producer_notes', {})),
                'composed_prompt': self.hash_artifact(artifacts.get('composed_prompt', {}))
            }

            outputs.append(hashes)

        # Compare all outputs
        reference = outputs[0]
        identical = all(h == reference for h in outputs[1:])

        # Calculate reproducibility
        reproducibility_rate = (
            sum(1 for h in outputs if h == reference) / len(outputs) * 100
        )

        return {
            'sds_index': sds.get('_index', 0),
            'title': title,
            'seed': seed,
            'num_runs': self.num_runs,
            'deterministic': identical,
            'reproducibility_rate': reproducibility_rate,
            'outputs': outputs
        }

    def execute_workflow(self, sds: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow and return artifacts."""
        # Create song and run workflow
        client = TestClient(app)

        song_response = client.post('/api/v1/songs', json={'sds': sds})
        song_id = song_response.json()['id']

        run_response = client.post(f'/api/v1/songs/{song_id}/runs', json={'seed': sds['seed']})
        run_id = run_response.json()['id']

        # Poll for completion
        # ...

        # Get final artifacts
        run = client.get(f'/api/v1/runs/{run_id}').json()
        return run.get('artifacts', {})


def test_determinism():
    """Test determinism on 50-song suite."""
    validator = DeterminismValidator(num_sdss=50, num_runs=10)

    # Load subset of SDSs
    with open('tests/rubric/fixtures/sds-200.json') as f:
        all_sdss = json.load(f)
    test_sdss = all_sdss[:50]

    # Run determinism tests
    results = []
    for i, sds in enumerate(test_sdss):
        sds['_index'] = i
        result = validator.run_determinism_test(sds)
        results.append(result)

    # Calculate overall reproducibility
    total_deterministic = sum(1 for r in results if r['deterministic'])
    overall_reproducibility = (
        sum(r['reproducibility_rate'] for r in results) / len(results)
    )

    # Save report
    report = {
        'total': len(results),
        'deterministic': total_deterministic,
        'non_deterministic': len(results) - total_deterministic,
        'overall_reproducibility': overall_reproducibility,
        'results': results
    }

    report_path = 'tests/rubric/reports/determinism-report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    # Assert reproducibility >= 99%
    assert overall_reproducibility >= 99.0, \
        f"Reproducibility {overall_reproducibility}% < 99% target"

    print(f"\nDeterminism Report:")
    print(f"  Total SDSs tested: {len(results)}")
    print(f"  Deterministic: {total_deterministic}")
    print(f"  Non-deterministic: {len(results) - total_deterministic}")
    print(f"  Overall Reproducibility: {overall_reproducibility:.2f}%")
```

---

#### N9.4.2: Non-Determinism Detection (5 story points)

**File**: `scripts/analyze-determinism.py`

```python
"""Analyze non-deterministic behaviors."""

import json
from difflib import SequenceMatcher


def analyze_determinism(report_file: str):
    """Identify sources of non-determinism."""
    with open(report_file) as f:
        report = json.load(f)

    results = report['results']
    non_deterministic = [r for r in results if not r['deterministic']]

    if not non_deterministic:
        print('All SDSs deterministic!')
        return

    print(f'\nNon-Determinism Analysis ({len(non_deterministic)} non-deterministic):')

    for result in non_deterministic:
        print(f"\n{result['title']} (seed={result['seed']})")
        outputs = result['outputs']

        # Find first divergence
        reference = outputs[0]
        for i, output in enumerate(outputs[1:], 1):
            if output != reference:
                print(f"  Run 1 vs Run {i+1} differ:")

                # Find which artifact differs
                for key in reference:
                    if reference[key] != output[key]:
                        print(f"    {key}: {reference[key][:16]}... vs {output[key][:16]}...")

    print('\n=== RECOMMENDATIONS ===')
    print('Common sources of non-determinism:')
    print('  1. Floating point arithmetic (use fixed precision)')
    print('  2. Random number generation without seed control')
    print('  3. Dict iteration order (Python 3.7+ preserves order, but check)')
    print('  4. Timestamp fields in artifacts')
    print('  5. Model temperature/sampling parameters')
    print('\nTo fix:')
    print('  - Verify seed propagation in all skills')
    print('  - Check temperature <= 0.3, fixed top_p')
    print('  - Remove timestamps from artifact hashes')
    print('  - Use deterministic data structures')
```

---

#### N9.4.3: Seed Propagation Verification (3 story points)

**File**: `scripts/verify-seed-propagation.py`

```python
"""Verify seed propagation through workflow."""

import json


def verify_seed_propagation(run_report: Dict[str, Any]) -> bool:
    """Verify each node receives correct seed."""
    run_id = run_report['run_id']
    base_seed = run_report['seed']

    expected_seeds = {
        'PLAN': base_seed + 0,
        'STYLE': base_seed + 1,
        'LYRICS': base_seed + 2,
        'PRODUCER': base_seed + 3,
        'COMPOSE': base_seed + 4,
        'VALIDATE': base_seed + 5,
        'FIX': base_seed + 6,
    }

    nodes = run_report.get('nodes', {})
    errors = []

    for node_name, expected_seed in expected_seeds.items():
        if node_name not in nodes:
            continue

        node_output = nodes[node_name].get('outputs', {})
        actual_seed = node_output.get('_seed', None)

        if actual_seed is None:
            errors.append(f"{node_name}: seed not recorded")
        elif actual_seed != expected_seed:
            errors.append(f"{node_name}: expected seed {expected_seed}, got {actual_seed}")

    if errors:
        print(f"Run {run_id}: Seed propagation errors:")
        for error in errors:
            print(f"  - {error}")
        return False

    return True
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Test suite size | 200 SDSs |
| Genre coverage | All blueprints |
| Complexity distribution | Simple/Medium/Complex |
| Rubric pass rate | ≥95% |
| Auto-fix convergence | ≥90% |
| Determinism reproducibility | ≥99% |
| Test execution time | <4 hours |

---

## Timeline

**Week 1**: Test suite generation + validation (N9.1)
**Week 2**: Compliance testing + failure analysis (N9.2)
**Week 3**: Convergence analysis + determinism testing (N9.3, N9.4)

---

## Acceptance Criteria

- [ ] 200-song test suite generated and validated
- [ ] All SDSs conform to schema
- [ ] Genre distribution correct
- [ ] Compliance tests running
- [ ] Pass rate ≥95%
- [ ] Auto-fix convergence ≥90%
- [ ] Determinism reproducibility ≥99%
- [ ] Reports generated and analyzed
- [ ] Recommendations documented

---

**Document Version**: 1.0
**Created**: 2025-11-14
**Status**: Ready for Implementation
