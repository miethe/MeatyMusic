# AMCS Phase 4.5 Acceptance Tests

This directory contains comprehensive acceptance tests for the Agentic Music Creation System (AMCS) workflow.

## Acceptance Criteria

The AMCS workflow must meet the following acceptance criteria for Phase 4.5:

### Gate A: Rubric Compliance ≥95%

- **Criterion**: At least 95% of test songs must pass blueprint validation
- **Target Score**: total_score ≥ 0.85
- **Test File**: `test_rubric_compliance.py`
- **Test Suite**: 20 diverse test songs covering multiple genres

### Gate B: Determinism ≥99%

- **Criterion**: Same inputs + seed produce ≥99% identical outputs across 10 runs
- **Test File**: `test_determinism.py`
- **Coverage**: All workflow skills (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX)

### Gate C: Performance P95 ≤60s

- **Criterion**: P95 latency ≤60 seconds for complete workflow (excluding RENDER)
- **Test File**: `test_performance.py`
- **Measurement**: PLAN → VALIDATE (with potential FIX loop)

### Gate D: Skills Registered

- **Criterion**: All workflow skills must be importable and callable
- **Test File**: `test_acceptance.py`

### Gate E: WebSocket Events (Future)

- **Criterion**: Workflow events stream correctly via WebSocket
- **Status**: To be implemented in Phase 4.6

### Gate F: Fix Loop

- **Criterion**: Fix loop applies up to 3 fixes and stops correctly
- **Test File**: `test_acceptance.py`

## Test Structure

```
acceptance/
├── __init__.py                      # Package initialization
├── README.md                        # This file
├── test_determinism.py              # Determinism tests (Gate B)
├── test_rubric_compliance.py        # Rubric compliance tests (Gate A)
├── test_performance.py              # Performance tests (Gate C)
├── test_acceptance.py               # Combined acceptance suite
└── acceptance_report.json           # Generated acceptance report
```

## Test Fixtures

Test songs are located in `tests/fixtures/test_songs/` and include:

- **Pop**: pop_upbeat.json
- **Country**: country_ballad.json
- **Hip-Hop**: hiphop_energy.json
- **Rock**: rock_anthem.json
- **R&B**: rnb_smooth.json
- **Electronic**: electronic_minimal.json, edm_festival.json
- **Indie**: indie_chill.json, singer_songwriter.json
- **Christmas**: christmas_pop.json
- **Pop Punk**: pop_punk_fast.json
- **Latin**: latin_reggaeton.json
- **Afrobeats**: afrobeats_modern.json
- **K-Pop**: kpop_bright.json
- **CCM**: ccm_worship.json
- **Hyperpop**: hyperpop_chaotic.json
- **Jazz**: jazz_modern.json
- **Folk**: folk_acoustic.json
- **Metal**: metal_heavy.json
- **Blues**: blues_traditional.json

Each test song represents a different genre, mood, complexity level, and edge case to ensure comprehensive coverage.

## Running Tests

### Run All Acceptance Tests

```bash
cd services/api
pytest tests/acceptance/ -v
```

### Run Specific Test Suite

```bash
# Determinism tests
pytest tests/acceptance/test_determinism.py -v

# Rubric compliance tests
pytest tests/acceptance/test_rubric_compliance.py -v

# Performance tests
pytest tests/acceptance/test_performance.py -v

# Combined acceptance suite
pytest tests/acceptance/test_acceptance.py -v
```

### Generate Acceptance Report

```bash
pytest tests/acceptance/test_acceptance.py::test_generate_acceptance_report -v -s
```

This will generate a comprehensive report at `tests/acceptance/acceptance_report.json` and print a summary to stdout.

## Performance Targets

Individual skill performance targets:

- **PLAN**: <100ms (no LLM, data transformation)
- **STYLE**: <5s (includes LLM call)
- **LYRICS**: <15s (varies by length, includes LLM)
- **PRODUCER**: <3s (includes LLM)
- **COMPOSE**: <1s (no LLM, string assembly)
- **VALIDATE**: <500ms (no LLM, rule-based)
- **FIX**: <10s (includes LLM, varies by complexity)

**Overall Workflow**: P95 ≤60s (excluding RENDER)

## Test Coverage

### Determinism Tests

- Individual skill determinism (10 runs each)
  - PLAN: 100% deterministic
  - STYLE: 100% deterministic
  - LYRICS: 100% deterministic (with mocked LLM)
  - PRODUCER: 100% deterministic
  - COMPOSE: 100% deterministic
- VALIDATE determinism (identical scores)
- FIX determinism (consistent fixes with low temperature)
- End-to-end workflow determinism (≥99% match rate)

### Rubric Compliance Tests

- Individual song validation (20 test songs)
- Pass rate calculation (≥95% required)
- Fix loop validation (up to 3 iterations)
- Genre-specific compliance breakdown
- Score distribution analysis
- Metric averages (hook_density, singability, etc.)

### Performance Tests

- Individual skill latency
- Complete workflow P95 latency
- Performance summary and breakdown
- Latency distribution analysis

## Acceptance Report

The acceptance report includes:

```json
{
  "generated_at": "2025-11-12T...",
  "test_suite": "AMCS Phase 4.5 Acceptance Tests",
  "gates": {
    "Gate_A_Rubric_Compliance": {
      "criterion": "≥95% pass rate on test suite",
      "result": "19/20 passed (95.0%)",
      "passed": true
    },
    "Gate_B_Determinism": {
      "criterion": "≥99% reproducibility across 10 runs",
      "result": "See test_determinism.py results",
      "passed": true
    },
    "Gate_C_Performance": {
      "criterion": "P95 latency ≤60s (excluding render)",
      "result": "P95: 12.34s",
      "passed": true
    }
  },
  "overall_status": "PASSED",
  "summary": {
    "rubric_compliance": {
      "pass_rate": 0.95,
      "avg_score": 0.87
    },
    "performance": {
      "workflow_p95_s": 12.34
    }
  },
  "recommendations": []
}
```

## Notes

- **LLM Mocking**: Tests use mocked LLM responses for speed and determinism. Real LLM tests would show higher latency and slight variations.
- **Test Data**: All test songs are synthetic and designed to exercise different workflow paths.
- **Continuous Monitoring**: These tests should be run on every major change to ensure acceptance criteria are maintained.
- **Production Readiness**: Passing all acceptance gates indicates the workflow is ready for Phase 4.6 (integration and deployment).

## Troubleshooting

### Tests Failing

1. **Determinism failures**: Check that seeds are being propagated correctly and no random operations are unseeded
2. **Rubric failures**: Review blueprint rules and validation logic; check if test songs are realistic
3. **Performance failures**: Profile slow skills; check for N+1 queries or unnecessary LLM calls

### Import Errors

Ensure you're running from the correct directory:

```bash
cd services/api
export PYTHONPATH="${PYTHONPATH}:${PWD}"
pytest tests/acceptance/ -v
```

## Next Steps

After passing all acceptance tests:

1. **Phase 4.6**: WebSocket event streaming and real-time progress
2. **Phase 5**: Integration with frontend UI
3. **Phase 6**: Suno connector integration (behind feature flag)
4. **Phase 7**: Production deployment and monitoring

## References

- PRD: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`
- Blueprint PRD: `docs/project_plans/PRDs/blueprint.prd.md`
- AMCS Overview: `docs/amcs-overview.md`
