# Determinism Framework - Quick Start Guide

## 5-Minute Quick Start

### 1. Verify Installation

```bash
cd /home/user/MeatyMusic
pytest tests/determinism/ --collect-only
```

**Expected output**: `collected 36 items`

### 2. Run All Tests

```bash
pytest tests/determinism/ -v
```

**Expected result**: ✅ 36 passed in ~1 second

### 3. Run Specific Test Suites

```bash
# Reproducibility tests (50 SDSs × 10 runs = 500 total runs)
pytest tests/determinism/test_reproducibility.py -v

# Seed propagation tests
pytest tests/determinism/test_seed_propagation.py -v

# Decoder settings tests
pytest tests/determinism/test_decoder_settings.py -v

# Pinned retrieval tests
pytest tests/determinism/test_pinned_retrieval.py -v
```

### 4. Generate Reports

```bash
# JSON report
pytest tests/determinism/ --json-report --json-report-file=determinism_report.json

# HTML coverage report
pytest tests/determinism/ --cov=tests.determinism --cov-report=html
```

---

## Common Commands

### View Test Structure

```bash
# List all tests
pytest tests/determinism/ --collect-only

# Count tests
pytest tests/determinism/ --collect-only -q | grep "test session starts" -A 1
```

### Run Subsets

```bash
# Only fast tests (skip slow)
pytest tests/determinism/ -m "not slow"

# Only reproducibility tests
pytest tests/determinism/ -m reproducibility

# Only seed propagation tests
pytest tests/determinism/ -m seed_propagation

# Specific test
pytest tests/determinism/test_seed_propagation.py::test_seed_propagation_pattern
```

### Debug Tests

```bash
# Verbose output with full traceback
pytest tests/determinism/ -vv --tb=long

# Stop on first failure
pytest tests/determinism/ -x

# Show print statements
pytest tests/determinism/ -s

# Run specific fixture
pytest tests/determinism/ -k "edge_case"
```

---

## Understanding Test Output

### Successful Run

```
============================== test session starts ==============================
platform linux -- Python 3.11.14, pytest-9.0.1, pluggy-1.6.0
collected 36 items

tests/determinism/test_decoder_settings.py::test_all_llm_nodes_have_decoder_settings PASSED
tests/determinism/test_decoder_settings.py::test_decoder_settings_per_node[PLAN] PASSED
...
============================== 36 passed in 0.83s ==============================
```

**Interpretation**:
- ✅ All 36 tests passed
- ⚡ Completed in 0.83 seconds
- 🎯 100% reproducibility achieved

### Test Failure

If a test fails, you'll see:

```
FAILED tests/determinism/test_reproducibility.py::test_basic_reproducibility_50_sdss_10_runs
```

**Actions**:
1. Check the failure message for details
2. Review test output in `tmp_path/reproducibility_report.json`
3. Run detailed diff test: `pytest tests/determinism/test_reproducibility.py::test_detailed_artifact_diff_on_failure -v`
4. Update `regressions.json` if this is a known issue

---

## Using Fixtures

### Load a Single Fixture

```python
from tests.determinism.conftest import load_sds_fixture
from pathlib import Path

fixture_path = Path("tests/determinism/fixtures/pop_complexity_1.json")
sds = load_sds_fixture(fixture_path)

print(f"Title: {sds['title']}")
print(f"Genre: {sds['blueprint_ref']['genre']}")
print(f"Seed: {sds['seed']}")
```

### Run Workflow with Fixture

```python
from tests.determinism.test_runner import run_workflow_deterministic
from tests.determinism.conftest import load_sds_fixture, hash_artifact
from pathlib import Path

# Load fixture
fixture_path = Path("tests/determinism/fixtures/pop_complexity_1.json")
sds = load_sds_fixture(fixture_path)

# Run workflow
result = run_workflow_deterministic(sds, seed=42)

# Access artifacts
artifacts = result["artifacts"]
style = artifacts["style"]
lyrics = artifacts["lyrics"]
validation_report = artifacts["validation_report"]

print(f"Style: {style}")
print(f"Style Hash: {hash_artifact(style)}")
print(f"Final Score: {validation_report['total_score']}")
```

---

## Integration Checklist

When integrating with real AMCS workflow:

### Phase 1: Connect Real Skills
- [ ] Import actual skills from `/services/api/app/skills/`
- [ ] Replace mock functions in `test_runner.py`
- [ ] Update skill contracts to match real implementations
- [ ] Verify seed propagation in real skills

### Phase 2: Test Real LLM Outputs
- [ ] Configure LLM API keys (Claude, etc.)
- [ ] Run reproducibility tests with real LLM calls
- [ ] Validate ≥99% reproducibility target
- [ ] Adjust decoder settings if needed

### Phase 3: Production Validation
- [ ] Run full test suite (50 SDSs × 10 runs)
- [ ] Generate baseline report
- [ ] Update `regressions.json` with any known issues
- [ ] Document any reproducibility failures

### Phase 4: CI/CD
- [ ] Add tests to GitHub Actions
- [ ] Set up automated reporting
- [ ] Configure failure notifications
- [ ] Track metrics over time

---

## Troubleshooting

### "Expected 50 SDS fixtures, found X"

**Solution**: Regenerate fixtures

```bash
cd /home/user/MeatyMusic/tests/determinism
python generate_fixtures.py
```

### "Reproducibility rate below 99%"

**Actions**:
1. Check which SDSs failed: `cat tmp_path/reproducibility_report.json`
2. Run detailed diff: `pytest tests/determinism/test_reproducibility.py::test_detailed_artifact_diff_on_failure -s`
3. Identify non-deterministic code (timestamps, random without seed, etc.)
4. Fix or add to `regressions.json`

### "Seed propagation validation failed"

**Actions**:
1. Check seed sequence: `cat tmp_path/seed_propagation_report.json`
2. Verify each node calls `context.get_node_seed(node_index)`
3. Ensure node indices match workflow order
4. Check for seed mutation or RNG state leakage

### "Decoder settings validation failed"

**Actions**:
1. Check actual settings: `cat tmp_path/decoder_settings_report.json`
2. Verify LLM calls use:
   - `temperature=0.3`
   - `top_p=0.9`
   - `frequency_penalty=0.0`
   - `presence_penalty=0.0`
3. Update LLM client configuration

---

## Performance Benchmarks

### Expected Execution Times

| Test Suite | Tests | Expected Time | Notes |
|------------|-------|---------------|-------|
| All Tests | 36 | ~1 second | Mock workflow |
| Reproducibility | 4 | ~0.3 seconds | Includes 500 runs |
| Seed Propagation | 10 | ~0.2 seconds | Multiple seeds |
| Decoder Settings | 13 | ~0.2 seconds | All LLM nodes |
| Pinned Retrieval | 9 | ~0.2 seconds | Retrieval tests |

### Real Workflow (Estimated)

| Test Suite | Tests | Estimated Time | Notes |
|------------|-------|----------------|-------|
| All Tests | 36 | ~5-10 minutes | Real LLM calls |
| Reproducibility | 4 | ~3-5 minutes | 500 workflow runs |
| Other Tests | 32 | ~2-5 minutes | Various validations |

---

## Useful Snippets

### Custom Test Fixture

```python
import pytest
from tests.determinism.conftest import load_sds_fixture

@pytest.fixture
def my_custom_sds():
    return {
        "title": "Custom Song",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {...},
        "lyrics": {...},
        "seed": 12345
    }

def test_custom_workflow(my_custom_sds):
    from tests.determinism.test_runner import run_workflow_deterministic
    result = run_workflow_deterministic(my_custom_sds, seed=12345)
    assert result["artifacts"]["passed"] == True
```

### Hash All Artifacts

```python
from tests.determinism.conftest import hash_all_artifacts

result = run_workflow_deterministic(sds, seed=42)
hashes = hash_all_artifacts(result["artifacts"])

print("Artifact Hashes:")
for name, hash_val in hashes.items():
    print(f"  {name}: {hash_val}")
```

### Compare Two Runs

```python
from tests.determinism.conftest import compare_artifacts

run1 = run_workflow_deterministic(sds, seed=42)
run2 = run_workflow_deterministic(sds, seed=42)

is_equal, diffs = compare_artifacts(
    run1["artifacts"]["style"],
    run2["artifacts"]["style"]
)

if not is_equal:
    print("Differences found:")
    for diff in diffs:
        print(f"  {diff}")
```

---

## Resources

- **Full Documentation**: `/home/user/MeatyMusic/tests/determinism/README.md`
- **Implementation Summary**: `/home/user/MeatyMusic/tests/determinism/IMPLEMENTATION_SUMMARY.md`
- **Regression Baseline**: `/home/user/MeatyMusic/tests/determinism/regressions.json`
- **SDS Fixtures**: `/home/user/MeatyMusic/tests/determinism/fixtures/`

---

## Quick Reference

### Test Markers

```bash
-m determinism       # All determinism tests
-m reproducibility   # Reproducibility tests only
-m seed_propagation  # Seed tests only
-m decoder_settings  # Decoder tests only
-m pinned_retrieval  # Retrieval tests only
-m slow             # Slow tests (>5s)
-m "not slow"       # Skip slow tests
```

### pytest Options

```bash
-v                  # Verbose output
-vv                 # Very verbose
-s                  # Show print statements
-x                  # Stop on first failure
-k "pattern"        # Run tests matching pattern
--tb=short          # Short traceback
--tb=line           # One line per failure
--durations=10      # Show 10 slowest tests
```

### File Locations

```
tests/determinism/
├── conftest.py              # Shared fixtures and utilities
├── test_runner.py           # Mock workflow engine
├── test_*.py                # Test modules
├── fixtures/*.json          # 50 SDS fixtures
├── README.md                # Full documentation
├── QUICK_START.md           # This file
└── IMPLEMENTATION_SUMMARY.md # Implementation details
```

---

**Need Help?**
- Check `/home/user/MeatyMusic/tests/determinism/README.md` for detailed docs
- Review test code for examples
- Run with `-vv` for verbose output

**Status**: Framework Ready ✅
**Version**: 1.0.0
**Last Updated**: 2025-11-19
