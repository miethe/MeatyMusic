# Determinism Tests - Quick Reference

## TL;DR

```bash
cd services/api

# Generate fixtures + run all tests
uv run python -m tests.fixtures.synthetic_songs
uv run pytest tests/test_determinism.py -v -m determinism

# Or use CLI script (auto-generates fixtures)
uv run python scripts/run_determinism_tests.py
```

## Common Commands

### Generate Fixtures
```bash
# Generate 200 songs (default)
uv run python -m tests.fixtures.synthetic_songs

# Generate 50 songs (faster)
uv run python -m tests.fixtures.synthetic_songs --count 50
```

### Run Tests

```bash
# All determinism tests
uv run pytest tests/test_determinism.py -v -m determinism

# Quick test (10 songs)
uv run pytest tests/test_determinism.py::test_reproducibility_sample_sizes[10] -v

# Per-node test (fast)
uv run pytest tests/test_determinism.py::test_per_node_reproducibility -v

# Full test (200 × 10 = 2000 runs)
uv run pytest tests/test_determinism.py::test_basic_reproducibility_200_songs_10_runs -v
```

### CLI Script

```bash
# Full suite with defaults
uv run python scripts/run_determinism_tests.py

# Quick test (50 songs)
uv run python scripts/run_determinism_tests.py --sample-size 50

# Specific test mode
uv run python scripts/run_determinism_tests.py --test per-node

# Verbose output
uv run python scripts/run_determinism_tests.py --verbose

# Fail fast
uv run python scripts/run_determinism_tests.py --fail-fast
```

## Test Modes

| Mode | Command | Description | Time |
|------|---------|-------------|------|
| **Quick** | `--test sample` | Sample size tests (10, 50, 100) | ~0.1s |
| **Per-Node** | `--test per-node` | Test each node individually | ~0.3s |
| **Seed** | `--test seed-propagation` | Verify seed propagation | ~0.1s |
| **Full** | `--test full` | 200 songs × 10 runs = 2000 runs | ~1.5s |
| **All** | `--test all` | All tests above | ~1.5s |

## Expected Results

### Per-Node Reproducibility
```
✓ PLAN:     100.00% (200/200)
✓ STYLE:    100.00% (200/200)
✓ LYRICS:   100.00% (200/200)
✓ PRODUCER: 100.00% (200/200)
✓ COMPOSE:  100.00% (200/200)
✓ VALIDATE: 100.00% (200/200)
```

### Full Test
```
Total songs:        200
Reproducible:       200
Rate:               100.00%
Target:             99.00%
Status:             ✅ PASS
```

## File Locations

```
services/api/
├── tests/
│   ├── fixtures/
│   │   ├── synthetic_songs.py          # Generator script
│   │   └── test_songs/
│   │       ├── synthetic-*.json        # 200 song files
│   │       └── manifest.json           # Song manifest
│   ├── test_determinism.py             # Test suite
│   ├── DETERMINISM_TESTS.md            # Full docs
│   └── QUICK_REFERENCE.md              # This file
├── scripts/
│   └── run_determinism_tests.py        # CLI runner
└── test_reports/
    └── determinism_report_*.json       # Generated reports
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No SDS fixtures found" | Run `uv run python -m tests.fixtures.synthetic_songs` |
| "Expected 200, found X" | Regenerate: `--count 200` |
| Environment errors | Already set by conftest.py (no action needed) |
| Tests failing | Check hash normalization and seed propagation |

## CI/CD Integration

```yaml
# .github/workflows/tests.yml
- name: Determinism Tests
  run: |
    cd services/api
    uv run python -m tests.fixtures.synthetic_songs
    uv run pytest tests/test_determinism.py -v -m determinism
```

## Metrics

- **Reproducibility Target**: ≥99% (≥198/200 songs)
- **Current Achievement**: 100% (200/200 songs) ✅
- **Total Runs**: 2000 (200 songs × 10 iterations)
- **Test Time**: ~1.5s for full suite
- **Fixture Generation**: ~1.5s for 200 songs

## Support

- Full documentation: `tests/DETERMINISM_TESTS.md`
- Implementation summary: `P1.4_IMPLEMENTATION_SUMMARY.md`
- Original tests: `/tests/determinism/`
- PRD: `docs/claude_code_orchestration.prd.md`
