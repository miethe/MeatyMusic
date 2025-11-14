# Service Layer Test Coverage Report

**Generated:** 2025-11-14
**Test Suite:** Phase 3 - Service Layer Tests
**Coverage Tool:** pytest-cov 7.0.0

---

## Executive Summary

- **Overall Coverage**: 57.0%
- **Target**: ≥80%
- **Status**: ⚠️ **FAIL** (23% below target)
- **Total Statements**: 1,752
- **Covered Lines**: 824
- **Missing Lines**: 928

### Critical Paths Status

| Critical Path | Coverage | Status |
|--------------|----------|--------|
| Citation hash computation | 100% | ✅ PASS |
| Weight normalization | 100% | ✅ PASS |
| Transaction management | 38.5% | ❌ FAIL |
| Source retrieval determinism | 18.4% | ❌ FAIL |

---

## Per-Service Coverage

### Services Meeting Target (≥80%)

| Service | Coverage | Lines | Status |
|---------|----------|-------|--------|
| `__init__.py` | 100.0% | 9/9 | ✅ PASS |
| `producer_notes_service.py` | 92.4% | 121/131 | ✅ PASS |
| `persona_service.py` | 91.0% | 111/122 | ✅ PASS |
| `lyrics_service.py` | 87.8% | 130/148 | ✅ PASS |
| `blueprint_service.py` | 81.9% | 176/215 | ✅ PASS |

### Services Below Target (<80%)

| Service | Coverage | Lines | Gap | Status |
|---------|----------|-------|-----|--------|
| `style_service.py` | 72.3% | 47/65 | -7.7% | ⚠️ FAIL |
| `validation_service.py` | 68.3% | 112/164 | -11.7% | ⚠️ FAIL |
| `common.py` | 63.3% | 186/294 | -16.7% | ⚠️ FAIL |
| `base_service.py` | 56.5% | 39/69 | -23.5% | ⚠️ FAIL |
| `workflow_run_service.py` | 27.4% | 17/62 | -52.6% | ❌ FAIL |
| `song_service.py` | 26.0% | 20/77 | -54.0% | ❌ FAIL |
| `source_service.py` | 18.4% | 26/141 | -61.6% | ❌ FAIL |
| `workflow_service.py` | 0.0% | 0/74 | -80.0% | ❌ FAIL |
| `dto_helpers_usage_examples.py` | 0.0% | 0/181 | -80.0% | ❌ FAIL |

---

## Critical Path Analysis

### 1. Citation Hash Computation ✅

**Coverage:** 100% (PASS)
**Location:** `app/services/common.py`

**Functions Tested:**
- `compute_citation_hash()`: 100% (8/8 lines)
- `compute_citation_batch_hash()`: 100% (9/9 lines)

**Status:** All citation hashing functions fully covered. Determinism guaranteed.

**Test Coverage:**
- Deterministic hashing
- Timestamp handling
- Different inputs produce different hashes
- Whitespace normalization
- Batch hashing
- Order independence

---

### 2. Weight Normalization ✅

**Coverage:** 100% (PASS)
**Location:** `app/services/common.py`

**Functions Tested:**
- `normalize_weights()`: 100% (14/14 lines)

**Status:** Weight normalization fully covered. Constraint compliance guaranteed.

**Test Coverage:**
- Weights exceeding max sum
- Already valid weights
- Empty weight sets
- Negative values
- All-zero weights
- Custom max sum values

---

### 3. Transaction Management ❌

**Coverage:** 38.5% (FAIL)
**Location:** `app/services/base_service.py`

**Functions Tested:**
- `BaseService.transaction()`: 38.5% (5/13 lines)

**Missing Lines:** 154, 156, 157, 164, 166, 168, 169, 176

**Status:** Critical gaps in error handling and rollback logic.

**Coverage Gaps:**
- Exception handling paths not tested
- Rollback scenarios not covered
- Transaction commit failures not tested
- Context manager exit paths missing

**Recommendations:**
1. Add test for transaction commit failure
2. Test rollback on exception
3. Test nested transaction scenarios
4. Add test for transaction timeout

---

### 4. Source Retrieval Determinism ❌

**Coverage:** 18.4% (FAIL)
**Location:** `app/services/source_service.py`

**Missing:** 115 lines uncovered

**Status:** Critical determinism path severely under-tested.

**Coverage Gaps:**
- Seed-based chunk retrieval
- Content hash stability
- Pinned retrieval by hash
- Allow/deny list enforcement
- MCP server integration
- Weight normalization in retrieval

**Recommendations:**
1. Fix fixture dependencies in test_source_service_determinism.py
2. Add integration tests with database
3. Test all MCP retrieval scenarios
4. Add negative tests for deny list violations

---

## Detailed Coverage Gaps

### High Priority Gaps (Determinism-Critical)

#### `source_service.py` (18.4% coverage)

**Missing Critical Functions:**
- `retrieve_chunks_with_seed()` - Core determinism function
- `compute_content_hash()` - Hash stability
- `retrieve_by_hash()` - Pinned retrieval
- `normalize_source_weights()` - Weight handling

**Impact:** Cannot guarantee deterministic source retrieval

**Action Required:**
1. Fix db_session fixture in tests/test_source_service_determinism.py
2. Add mock MCP server for testing
3. Test full retrieval pipeline with seed
4. Verify hash stability across runs

---

#### `base_service.py` (56.5% coverage)

**Missing Critical Paths:**
- Transaction rollback scenarios
- Commit failure handling
- Exception propagation
- Session flush errors

**Impact:** Transaction safety not guaranteed

**Action Required:**
1. Add test_transaction_rollback_on_exception
2. Test commit failures
3. Add nested transaction tests
4. Test session state after errors

---

### Medium Priority Gaps

#### `validation_service.py` (68.3% coverage)

**Missing Coverage:**
- Edge cases in rubric validation (lines 48-53, 77-84)
- Energy-tempo coherence validation (lines 140-141, 158-160)
- Section completeness checks (lines 190-192, 204-205)
- Hook density validation (lines 222-224, 236-237)

**Action Required:**
1. Add edge case tests for each validation rule
2. Test boundary conditions
3. Add negative tests for validation failures

---

#### `style_service.py` (72.3% coverage)

**Missing Coverage:**
- Tag conflict detection (lines 52-69)
- Energy-tempo coherence (lines 124-129)
- Blueprint validation integration (lines 140, 165, 180-183)

**Test Failures:**
- `test_create_style_valid` - signature mismatch (tenant_id parameter)
- `test_validate_tag_conflicts_*` - missing blueprint_id parameter
- `test_validate_energy_tempo_coherence_*` - assertion mismatches

**Action Required:**
1. Fix test signatures to match current service implementation
2. Update fixture data for blueprint_id
3. Adjust assertion messages in energy-tempo tests

---

#### `common.py` (63.3% coverage)

**Missing Coverage:**
- Complex utility functions (lines 809-856, 869-895)
- Advanced rhyme checking (lines 908-928)
- Edge cases in profanity filtering (lines 966-995)
- Imagery extraction (lines 1025-1042)
- Advanced text processing (lines 1081-1151, 1189-1230)
- Meter validation (lines 1272-1303)

**Action Required:**
1. Add tests for uncovered utility functions
2. Test edge cases in text processing
3. Add negative tests for invalid inputs

---

### Low Priority Gaps

#### `song_service.py` (26.0% coverage)

**Status:** Basic CRUD operations not fully tested

**Missing:**
- Create song with entities
- Update operations
- Delete operations
- Complex queries

---

#### `workflow_run_service.py` (27.4% coverage)

**Status:** Workflow execution not tested

**Missing:**
- Run creation
- State transitions
- Event emission
- Artifact storage

---

#### `workflow_service.py` (0.0% coverage)

**Status:** No test coverage

**Missing:**
- All workflow orchestration logic
- Graph execution
- Node transitions
- Error handling

---

## Test Suite Issues

### Test Failures (37 failures in app/tests/test_services/)

**Category: Signature Mismatches**

1. **PersonaService tests** (12 failures)
   - Issue: Pydantic validation errors for datetime fields
   - Root cause: Mock data not matching schema requirements
   - Fix: Update fixtures to provide valid datetime values

2. **StyleService tests** (7 failures)
   - Issue: Unexpected `tenant_id` parameter
   - Root cause: Service signature changed after tests written
   - Fix: Remove tenant_id from test calls or update service

3. **StyleService validation tests** (4 failures)
   - Issue: Missing `blueprint_id` parameter
   - Root cause: Method signature updated
   - Fix: Add blueprint_id to validation test calls

4. **ValidationService tests** (2 failures)
   - Issue: Assertion message mismatches
   - Root cause: Error messages changed
   - Fix: Update expected error message assertions

---

### Test Fixture Issues (6 errors in tests/test_source_service_determinism.py)

**Issue:** `fixture 'db_session' not found`

**Root Cause:** Mismatch between fixture names in conftest.py files
- `app/tests/conftest.py` provides different fixtures
- `tests/conftest.py` doesn't provide db_session

**Impact:** Source service determinism tests cannot run

**Fix Required:**
1. Consolidate conftest.py files or ensure consistent fixture naming
2. Add db_session fixture to tests/conftest.py
3. Consider using pytest-asyncio fixtures consistently

---

## Coverage Improvement Recommendations

### Immediate Actions (P0 - Critical)

1. **Fix Transaction Management Coverage**
   - Add `test_transaction_rollback_on_exception()`
   - Add `test_transaction_commit_failure()`
   - Add `test_nested_transactions()`
   - Target: 100% coverage

2. **Fix Source Service Determinism Coverage**
   - Fix db_session fixture issue
   - Add integration tests with real database
   - Test all deterministic retrieval scenarios
   - Target: 100% coverage for deterministic paths

3. **Fix Test Suite Failures**
   - Update 37 failing tests in app/tests/test_services/
   - Fix 6 fixture errors in test_source_service_determinism.py
   - Update test signatures to match current implementations

---

### Short-term Actions (P1 - High Priority)

4. **Improve Validation Service Coverage**
   - Add edge case tests for each validation rule
   - Test boundary conditions
   - Add negative test cases
   - Target: 80% coverage

5. **Improve Style Service Coverage**
   - Fix test signature mismatches
   - Add tag conflict edge cases
   - Test energy-tempo boundaries
   - Target: 80% coverage

6. **Improve Common.py Coverage**
   - Add tests for utility functions
   - Test text processing edge cases
   - Add profanity filter tests
   - Target: 80% coverage

7. **Improve Base Service Coverage**
   - Test error handling paths
   - Add session management tests
   - Test logging and telemetry
   - Target: 80% coverage

---

### Medium-term Actions (P2 - Medium Priority)

8. **Add Workflow Service Tests**
   - Test graph execution
   - Test node transitions
   - Test error handling and retries
   - Target: 80% coverage

9. **Add Workflow Run Service Tests**
   - Test run lifecycle
   - Test event emission
   - Test artifact storage
   - Target: 80% coverage

10. **Add Song Service Tests**
    - Test CRUD operations
    - Test entity relationships
    - Test complex queries
    - Target: 80% coverage

---

### Long-term Actions (P3 - Nice to Have)

11. **Integration Test Suite**
    - Add end-to-end workflow tests
    - Test complete PLAN→REVIEW pipeline
    - Test determinism across full workflow
    - Test rollback scenarios

12. **Performance Test Suite**
    - Test latency targets (P95 ≤ 60s)
    - Test concurrent operations
    - Test database query optimization

13. **Negative Test Suite**
    - Test all error paths
    - Test invalid inputs
    - Test constraint violations
    - Test policy violations

---

## Summary of Findings

### Strengths ✅

1. **Critical determinism functions fully covered:**
   - Citation hashing: 100%
   - Weight normalization: 100%

2. **Core entity services well-tested:**
   - ProducerNotesService: 92.4%
   - PersonaService: 91.0%
   - LyricsService: 87.8%
   - BlueprintService: 81.9%

3. **Good test organization:**
   - Clear separation of unit vs integration tests
   - Determinism-focused test suite
   - Acceptance test framework

---

### Weaknesses ❌

1. **Overall coverage below target:**
   - Current: 57%
   - Target: 80%
   - Gap: 23 percentage points

2. **Critical determinism paths under-tested:**
   - Source retrieval: 18.4%
   - Transaction management: 38.5%

3. **Test suite maintenance issues:**
   - 37 failing tests due to signature mismatches
   - 6 fixture errors preventing determinism tests
   - Outdated test expectations

4. **Major services with no coverage:**
   - WorkflowService: 0%
   - SongService: 26%

---

## Next Steps

1. **Immediate (This Sprint)**
   - Fix all 43 test failures/errors
   - Achieve 100% coverage for transaction management
   - Achieve 100% coverage for source retrieval determinism

2. **Short-term (Next Sprint)**
   - Bring all services to ≥80% coverage
   - Add missing edge case tests
   - Consolidate conftest.py fixtures

3. **Medium-term (Phase 4)**
   - Add workflow orchestration tests
   - Create integration test suite
   - Implement performance tests

4. **Long-term (Phase 5)**
   - Achieve ≥95% overall coverage
   - Add property-based testing
   - Implement mutation testing

---

## Appendix: Coverage by File

```
__init__.py                          100.0% (   9/   9) [PASS]
base_service.py                       56.5% (  39/  69) [FAIL]
blueprint_service.py                  81.9% ( 176/ 215) [PASS]
common.py                             63.3% ( 186/ 294) [FAIL]
dto_helpers_usage_examples.py          0.0% (   0/ 181) [FAIL]
lyrics_service.py                     87.8% ( 130/ 148) [PASS]
persona_service.py                    91.0% ( 111/ 122) [PASS]
producer_notes_service.py             92.4% ( 121/ 131) [PASS]
song_service.py                       26.0% (  20/  77) [FAIL]
source_service.py                     18.4% (  26/ 141) [FAIL]
style_service.py                      72.3% (  47/  65) [FAIL]
validation_service.py                 68.3% ( 112/ 164) [FAIL]
workflow_run_service.py               27.4% (  17/  62) [FAIL]
workflow_service.py                    0.0% (   0/  74) [FAIL]
```

---

## Test Commands Reference

```bash
# Run all service tests with coverage
cd services/api
uv run pytest app/tests/test_services/ \
    tests/test_blueprint_service.py \
    tests/test_source_service_determinism.py \
    --cov=app/services \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=json \
    -v

# View HTML coverage report
open htmlcov/index.html

# Check coverage threshold
uv run pytest --cov=app/services --cov-fail-under=80

# Run specific service tests
uv run pytest app/tests/test_services/test_lyrics_service.py -v

# Run determinism tests only
uv run pytest tests/test_source_service_determinism.py -v

# Run with coverage for single service
uv run pytest app/tests/test_services/test_style_service.py \
    --cov=app/services/style_service \
    --cov-report=term-missing
```

---

**Report End**
