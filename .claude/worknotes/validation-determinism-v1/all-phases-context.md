# Validation & Determinism Framework - Working Context

**Purpose:** Token-efficient context for resuming work across agent turns

**Last Updated:** 2025-11-19

---

## Current State

**Branch:** claude/validation-determinism-v1-01VfBAnV1pHnmY5gYc88Aazt
**Last Commit:** 3c01ca5 (Merge PR #18 - AMCS workflow skills)
**Current Phase:** Initialization
**Current Task:** Setting up tracking infrastructure

---

## Project Overview

**Implementation Plan:** validation-determinism-v1 - Large (L) complexity project
**Timeline:** 4-6 weeks across 8 phases
**Total Story Points:** 90
**Total Tasks:** 27

**Two Main Components:**
1. **Validation Service Enhancement** (Phases 1-4): Complete validation layer from basic schema checking to comprehensive constraint enforcement
2. **Determinism Validation Framework** (Phases 5-7): Build test infrastructure to prove ≥99% reproducibility

---

## Architecture Context

**Validation Service Location:** `services/api/app/services/validation_service.py`

**New Modules to Create:**
- `services/api/app/services/blueprint_loader.py` - Load and cache genre blueprints
- `services/api/app/services/blueprint_validator.py` - Validate against blueprint constraints
- `services/api/app/services/rubric_scorer.py` - Calculate multi-metric scores
- `services/api/app/services/conflict_matrix.py` - Manage tag conflict matrix
- `services/api/app/services/policy_guards.py` - Profanity, PII, artist normalization
- `services/api/app/services/metrics_tracker.py` - Quality gates and metrics

**New Taxonomies to Create:**
- `taxonomies/conflict_matrix.json` - Tag conflict definitions
- `taxonomies/profanity_list.json` - Profanity detection lists
- `taxonomies/pii_patterns.json` - PII detection patterns

**Test Infrastructure:**
- `tests/determinism/` - Main test directory
- `tests/determinism/fixtures/` - 50 SDS JSON fixtures
- `tests/determinism/conftest.py` - Pytest configuration
- Multiple test files for reproducibility, seed propagation, decoder validation

---

## Key Technical Decisions

### Validation Architecture
- **Layered approach**: Blueprint → Conflict → Policy → Rubric
- **Caching strategy**: Blueprint rules cached in memory with TTL
- **Report structure**: Violations + suggestions + remediation hints
- **Integration points**: STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE nodes

### Determinism Strategy
- **Test approach**: Mock deterministic skills for controlled testing
- **Hash comparison**: SHA-256 on artifacts (excluding timestamps/run_ids)
- **Reproducibility target**: ≥99% across 50 SDSs × 10 runs
- **Seed propagation**: base_seed + node_index per node

### Performance Targets
- Blueprint loading: <100ms
- Conflict detection: <50ms per tag
- Policy guards: <200ms
- Rubric scoring: <100ms
- Overall validation: <500ms per SDS

---

## Dependencies & Critical Path

**Critical Path** (longest sequential dependency chain):
1. Blueprint Loader (1.1) → Blueprint Validators (1.2) → Integration (1.3)
2. Scoring Engine (4.1) → Thresholds (4.2) → Rubric Integration (4.3)
3. Test Setup (5.1) → Test Harness (5.2) → Reproducibility Tests (6.1)
4. E2E Integration (8.1)

**Parallelization Opportunities:**
- Phases 2 (Conflicts) and 3 (Policy) can run concurrently with Phase 1
- Phase 7 tasks (Seed, Decoder, Retrieval) can all run in parallel
- Phase 8 tasks can be distributed across multiple agents

---

## Subagent Allocation

**Primary Agent: python-pro**
- All Python implementation (Phases 1-7, most of Phase 8)
- Backend validation logic
- Test infrastructure
- Performance optimization

**Documentation Agent: documentation-writer**
- Task 8.3: All documentation and runbooks
- Validation service guide
- Determinism testing guide
- Troubleshooting guides

---

## Quality Gates & Metrics

**Gate A - Rubric Compliance (≥95%)**
- Measure on 200-song diverse test suite
- Per-genre breakdown required
- Week 4 validation

**Gate B - Determinism Reproducibility (≥99%)**
- 50 SDSs × 10 runs with hash comparison
- Regression tracking for failures
- Week 4 validation

**Gate C - Security & Policy (Zero high-severity)**
- Profanity filter accuracy
- PII detection/redaction verification
- Artist normalization compliance
- Continuous throughout project

**Gate D - Latency & Performance (≤60s P95)**
- Measure Plan→Prompt latency
- 100 runs for P95 calculation
- Week 4 validation

---

## Known Risks & Mitigation

**High Risk: Determinism Achievement**
- Mitigation: Start early (Week 3), build regression tracking
- Contingency: Accept 95% if 99% unachievable

**Medium Risk: Rubric Tuning**
- Mitigation: A/B testing on 200-song suite, configurable thresholds
- Strategy: Start lenient, tighten iteratively

**Medium Risk: Policy Guard False Positives**
- Mitigation: Conservative detection, allowlists, user feedback loop
- Monitoring: Track false positive rate

---

## Important Patterns & Conventions

**Testing:**
- Use pytest parametrization for fixtures
- SHA-256 hashing for artifact comparison
- Exclude timestamps and run_ids from comparisons
- Mock skills must be deterministic

**Validation:**
- Return structured reports: (is_valid, violations, suggestions)
- Log all validation operations for debugging
- Cache frequently accessed data (blueprints, conflict matrix)
- Support genre versioning

**Error Handling:**
- Graceful degradation for missing blueprints
- Clear violation messages with remediation hints
- Comprehensive logging at each validation step

---

## Blueprint Reference

**Locations:** `docs/hit_song_blueprint/AI/`
- 12+ genre blueprints available
- Each contains: BPM ranges, required sections, lexicon rules, scoring weights
- Used by: Blueprint Loader (1.1), Scoring Engine (4.1)

**Key Blueprint Fields:**
- `tempo_range`: Min/max BPM per genre
- `required_sections`: Mandatory song sections
- `lexicon.positive`: Encouraged terms
- `lexicon.banned`: Forbidden terms
- `rubric.weights`: Per-metric weights
- `rubric.thresholds`: min_total, max_profanity

---

## Testing Fixtures

**Fixture Coverage Needed (50 SDSs):**
- Pop: 5 (simple → complex)
- Rock: 5
- Hip-Hop: 5
- Country: 5
- Electronic: 5
- R&B: 5
- Christmas: 5
- Indie/Alternative: 5
- Edge cases: 10 (unusual structures, extreme BPM, etc.)

**Fixture Metadata:**
- Genre, complexity level, expected sections
- Used for parametrized testing
- Support filtering by genre/complexity

---

## Quick Reference Commands

### Backend Development
```bash
# API environment
export PYTHONPATH="$PWD/services/api"

# Run specific test
uv run --project services/api pytest app/tests/test_validation.py -v

# Type checking
uv run --project services/api mypy app

# Linting
uv run --project services/api ruff check
```

### Determinism Testing
```bash
# Run reproducibility tests
uv run --project services/api pytest tests/determinism/test_reproducibility.py -v

# Run all determinism tests
uv run --project services/api pytest tests/determinism/ -v

# Generate determinism report
uv run --project services/api python tests/determinism/test_runner.py
```

---

## Session Notes

### 2025-11-19 - Initialization
- Created tracking infrastructure
- Ready to begin Phase 1 delegation to python-pro
- All prerequisites confirmed (blueprints exist, infrastructure in place)

---

## Next Session Pickup

**Resume Point:** Begin Phase 1, Task 1.1 - Blueprint Loader Module
**Subagent to Use:** python-pro
**Context Needed:** Blueprint locations, caching strategy, singleton pattern
