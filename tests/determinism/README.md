# Determinism Validation Framework

**Purpose**: Comprehensive test infrastructure to validate ≥99% reproducibility across all AMCS workflow nodes.

## Overview

This framework implements Phases 5-7 of the Determinism Validation Plan:

- **Phase 5**: Test Suite Setup (directory structure, fixtures, test harness)
- **Phase 6**: Reproducibility Tests (50 SDSs × 10 runs)
- **Phase 7**: Seed & Decoder Validation (seed propagation, decoder settings, pinned retrieval)

## Directory Structure

```
tests/determinism/
├── __init__.py                  # Package initialization
├── conftest.py                  # Pytest configuration and shared fixtures
├── test_runner.py               # Mock workflow execution engine
├── test_reproducibility.py      # Phase 6: Basic reproducibility tests
├── test_seed_propagation.py     # Phase 7.1: Seed propagation verification
├── test_decoder_settings.py     # Phase 7.2: Decoder settings validation
├── test_pinned_retrieval.py     # Phase 7.3: Pinned retrieval verification
├── regressions.json             # Known reproducibility regressions baseline
├── README.md                    # This file
└── fixtures/                    # 50 diverse SDS JSON files
    ├── pop_simple_001.json
    ├── pop_simple_002.json
    ├── ...
    └── edge_case_010.json
```

## Test Suites

### Phase 6: Reproducibility Tests (`test_reproducibility.py`)

**Task 6.1: Basic Reproducibility Test**
- Runs 50 SDSs × 10 times each (500 total runs)
- Computes SHA-256 hash of all artifacts
- Verifies ≥99% reproducibility rate
- Generates detailed JSON report

**Task 6.2: Artifact-Specific Comparison**
- Tests reproducibility for each artifact type individually
- Reports per-artifact reproducibility rates
- Identifies which artifacts have reproducibility issues

**Task 6.3: Regression Test Suite**
- Compares against baseline in `regressions.json`
- Fails if new regressions detected
- Tracks fixes over time

### Phase 7: Seed & Decoder Validation

**Task 7.1: Seed Propagation Verification (`test_seed_propagation.py`)**
- Verifies node seed = base_seed + node_index
- Tests with multiple base seeds (0, 42, 12345, 99999)
- Validates seed sequence consistency across runs
- Ensures seed traceability in artifacts

**Task 7.2: Decoder Settings Validation (`test_decoder_settings.py`)**
- Validates temperature ≤ 0.3 for all LLM nodes
- Verifies top_p ≤ 0.9
- Ensures frequency_penalty == 0
- Ensures presence_penalty == 0
- Tests consistency across runs

**Task 7.3: Pinned Retrieval Verification (`test_pinned_retrieval.py`)**
- Verifies retrieval uses content hashes (SHA-256)
- Tests that same SDS + seed → same chunks
- Validates citation includes chunk hashes
- Ensures no relevance-based sorting
- Tests fixed top-k per source

## Running Tests

### Run All Determinism Tests

```bash
pytest tests/determinism/
```

### Run Specific Test Suite

```bash
# Reproducibility tests
pytest tests/determinism/test_reproducibility.py

# Seed propagation tests
pytest tests/determinism/test_seed_propagation.py

# Decoder settings tests
pytest tests/determinism/test_decoder_settings.py

# Pinned retrieval tests
pytest tests/determinism/test_pinned_retrieval.py
```

### Run with Verbose Output

```bash
pytest tests/determinism/ -v
```

### Run with JSON Report

```bash
pytest tests/determinism/ --json-report --json-report-file=determinism_report.json
```

### Run Only Fast Tests (Skip Slow)

```bash
pytest tests/determinism/ -m "not slow"
```

### Run with Coverage

```bash
pytest tests/determinism/ --cov=app --cov-report=html
```

## Test Markers

Tests are marked with the following pytest markers:

- `@pytest.mark.determinism`: All determinism tests
- `@pytest.mark.reproducibility`: Reproducibility tests
- `@pytest.mark.seed_propagation`: Seed propagation tests
- `@pytest.mark.decoder_settings`: Decoder settings tests
- `@pytest.mark.pinned_retrieval`: Pinned retrieval tests
- `@pytest.mark.slow`: Tests that take >5 seconds

### Filter by Marker

```bash
# Run only reproducibility tests
pytest tests/determinism/ -m reproducibility

# Run only seed tests
pytest tests/determinism/ -m seed_propagation

# Exclude slow tests
pytest tests/determinism/ -m "not slow"
```

## SDS Fixtures

The `fixtures/` directory contains 50 diverse Song Design Spec (SDS) JSON files:

### Genre Distribution

- **Pop**: 5 fixtures (simple → complex)
- **Rock**: 5 fixtures
- **Hip-Hop**: 5 fixtures
- **Country**: 5 fixtures
- **Electronic**: 5 fixtures
- **R&B**: 5 fixtures
- **Christmas**: 5 fixtures
- **Indie/Alternative**: 5 fixtures
- **Edge Cases**: 10 fixtures (unusual structures, extreme BPM, etc.)

### Fixture Naming Convention

```
{genre}_{complexity}_{number}.json

Examples:
- pop_simple_001.json
- pop_medium_002.json
- pop_complex_003.json
- rock_simple_001.json
- edge_case_001.json
```

### Fixture Schema

Each fixture follows the SDS schema defined in `/schemas/sds.schema.json`:

```json
{
  "title": "Song Title",
  "blueprint_ref": {
    "genre": "Pop",
    "version": "2025.11"
  },
  "style": { ... },
  "lyrics": { ... },
  "producer_notes": { ... },
  "sources": [],
  "prompt_controls": { ... },
  "render": {
    "engine": "none"
  },
  "seed": 42
}
```

## Mock Workflow Engine

The `test_runner.py` module provides a mock AMCS workflow for testing:

### Features

- Deterministic artifact generation based on SDS + seed
- Simulates all 8 workflow nodes (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → REVIEW)
- Produces realistic artifacts that mirror actual workflow outputs
- Allows verification of seed propagation, decoder settings, and retrieval

### Usage

```python
from tests.determinism.test_runner import run_workflow_deterministic

# Run workflow with SDS and seed
workflow_output = run_workflow_deterministic(sds, seed=42)

# Access artifacts
artifacts = workflow_output["artifacts"]
style = artifacts["style"]
lyrics = artifacts["lyrics"]
validation_report = artifacts["validation_report"]

# Access context (for seed/decoder tracking)
context = workflow_output["context"]
node_seeds = context.node_seeds
decoder_settings = context.decoder_settings
retrieval_hashes = context.retrieval_hashes
```

### Important Note

This is a **mock workflow** for testing the determinism framework itself. It is NOT the actual AMCS workflow implementation. The real workflow skills are in `services/api/app/skills/`.

## Utilities (`conftest.py`)

### Hash Computation

```python
from tests.determinism.conftest import hash_artifact

# Compute SHA-256 hash of artifact
artifact_hash = hash_artifact(style_artifact)
# Returns: "sha256:a1b2c3..."
```

### Artifact Comparison

```python
from tests.determinism.conftest import compare_artifacts

# Deep comparison of two artifacts
is_equal, differences = compare_artifacts(artifact1, artifact2)

if not is_equal:
    for diff in differences:
        print(diff)
```

### Seed Validation

```python
from tests.determinism.conftest import validate_seed_sequence

# Validate seed propagation
is_valid, errors = validate_seed_sequence(
    base_seed=42,
    node_seeds={0: 42, 1: 43, 2: 44, ...},
    expected_node_count=8
)
```

### Decoder Settings Validation

```python
from tests.determinism.conftest import validate_decoder_settings

# Validate decoder settings for a node
is_valid, errors = validate_decoder_settings(
    "LYRICS",
    actual_settings={"temperature": 0.3, "top_p": 0.9, ...}
)
```

## Success Criteria

### Phase 5: Test Suite Setup
- ✓ Directory structure created
- ✓ 50 diverse SDS fixtures generated
- ✓ conftest.py with utilities implemented
- ✓ Test harness working

### Phase 6: Reproducibility Tests
- ✓ Basic reproducibility test implemented (50×10)
- ✓ Artifact-specific comparison working
- ✓ Regression tracking implemented
- **Target**: ≥99% reproducibility rate (≥495 of 500 runs)

### Phase 7: Seed & Decoder Validation
- ✓ Seed propagation verification working
- ✓ Decoder settings validation implemented
- ✓ Pinned retrieval verification working
- **Target**: All nodes use correct seeds and decoder settings

## Reproducibility Rate Calculation

```
Reproducibility Rate = (Reproducible SDSs) / (Total SDSs)

Where:
- Reproducible SDS = All 10 runs produce identical artifact hashes
- Total SDSs = 50
- Target Rate = 99% (≥49.5, rounded to ≥50/50 or ≥49/50)
```

## Regression Tracking

The `regressions.json` file maintains a baseline of known reproducibility issues:

```json
{
  "known_regressions": {
    "edge_case_007": "Known issue with extreme BPM values - tracked in AMCS-123"
  }
}
```

### Updating Baseline

If a regression is fixed or a new one is accepted:

1. Update `regressions.json` manually
2. Document the issue in the description
3. Link to tracking ticket if applicable
4. Re-run tests to verify new baseline

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Determinism Tests

on: [push, pull_request]

jobs:
  determinism:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-json-report
      - name: Run determinism tests
        run: |
          pytest tests/determinism/ \
            --json-report \
            --json-report-file=determinism_report.json
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: determinism-report
          path: determinism_report.json
```

## Performance Considerations

### Test Execution Time

- **Basic Reproducibility Test**: ~30-60 seconds (50 SDSs × 10 runs)
- **Per-Artifact Tests**: ~5-10 seconds
- **Seed Propagation Tests**: ~5-10 seconds
- **Decoder Settings Tests**: ~5-10 seconds
- **Pinned Retrieval Tests**: ~5-10 seconds

**Total Suite**: ~60-90 seconds

### Optimization Tips

1. Run slow tests separately in CI: `pytest -m "not slow"`
2. Use pytest-xdist for parallel execution: `pytest -n auto`
3. Cache SDS fixtures in session scope
4. Skip fixture generation if already exists

## Troubleshooting

### Test Failures

**Reproducibility test fails**:
1. Check `tmp_path/reproducibility_report.json` for details
2. Identify which SDS failed
3. Run detailed diff test: `pytest tests/determinism/test_reproducibility.py::test_detailed_artifact_diff_on_failure`
4. Review artifact differences

**Seed propagation fails**:
1. Check `tmp_path/seed_propagation_report.json`
2. Verify node seed calculation in `test_runner.py`
3. Ensure all nodes call `context.get_node_seed()`

**Decoder settings fail**:
1. Check `tmp_path/decoder_settings_report.json`
2. Verify settings in `test_runner.py`
3. Ensure all LLM nodes record settings

**Retrieval test fails**:
1. Check `tmp_path/retrieval_report.json`
2. Verify chunk hash generation
3. Ensure citations include hashes

### Common Issues

**Issue**: "Expected 50 SDS fixtures, found X"
- **Solution**: Generate fixtures using fixture generator script

**Issue**: Fixtures missing required fields
- **Solution**: Validate fixtures against `/schemas/sds.schema.json`

**Issue**: Tests pass locally but fail in CI
- **Solution**: Ensure consistent Python version, dependencies, and environment

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Add appropriate pytest markers
3. Document test purpose in docstring
4. Update this README if adding new test categories
5. Ensure tests are deterministic themselves (no random sleeps, network calls, etc.)

## References

- **SDS Schema**: `/schemas/sds.schema.json`
- **Skill Contracts**: `/services/api/app/schemas/skill_contracts.py`
- **AMCS Overview**: `/docs/amcs-overview.md`
- **Determinism Requirements**: See project PRDs in `/docs/project_plans/PRDs/`

## Metrics Dashboard (Future)

Planned enhancements:
- Grafana dashboard for reproducibility trends
- Automated regression detection
- Performance benchmarks over time
- Per-genre reproducibility breakdown

## Contact

For questions or issues with the determinism framework:
- File an issue in the GitHub repository
- Tag with `determinism` and `testing` labels
- Include test output and fixture names

---

**Last Updated**: 2025-11-19
**Framework Version**: 1.0.0
**Target Reproducibility**: ≥99%
