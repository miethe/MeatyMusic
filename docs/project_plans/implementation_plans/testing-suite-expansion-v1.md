# Implementation Plan: Testing Suite Expansion
**Testing Suite Expansion (WP-N7, WP-N8, WP-N9)**

**Status**: Draft | **Phase**: Post-Bootstrap Quality Assurance
**Created**: 2025-11-14 | **Target Completion**: 2025-12-09 (4 weeks)
**Complexity Level**: **Large (L)** | **Story Points**: 89 | **Track**: Full

---

## Executive Summary

This implementation plan orchestrates the expansion of MeatyMusic's testing infrastructure across three critical workstreams:

1. **Frontend Testing Expansion (WP-N7)**: Entity editor unit tests, API client integration tests, and page-level tests to achieve 70% coverage
2. **E2E Testing Suite (WP-N8)**: Complete user journey tests using Playwright with auth fixtures and edge case validation
3. **Rubric Compliance Testing (WP-N9)**: 200-song test suite with determinism validation and auto-fix convergence analysis

**Current State**:
- Backend tests: 90% coverage with comprehensive acceptance gate validation
- Frontend tests: 30% coverage (3 components tested: SongCard, WorkflowGraph, ChipSelector)
- E2E tests: 0% (no Playwright setup)
- Rubric compliance: Infrastructure ready, test suite missing (0 test cases)

**Target State**:
- Frontend tests: ≥70% coverage across all entity editors, API client, and pages
- E2E tests: All core user journeys tested with edge case coverage
- Rubric compliance: 200-song test suite with ≥95% pass rate, ≥90% auto-fix convergence
- CI/CD integration: All test suites running in GitHub Actions pipeline

**Resource Requirements**:
- 1 QA Automation Engineer (E2E, Playwright, test data)
- 1 Frontend Developer (component testing, API client mocks)
- 1 QA Automation Specialist (rubric compliance, data generation)
- **Duration**: 4 weeks with parallel workstreams
- **Cost**: ~600 story points across team

**Success Criteria**:
- ✅ Frontend coverage ≥70% (currently 30%)
- ✅ All core user journeys covered via E2E (create → execute → view)
- ✅ Rubric pass rate ≥95% on 200-song test suite
- ✅ Auto-fix convergence ≥90% within 3 iterations
- ✅ E2E tests run in CI/CD without failures
- ✅ Determinism validation ≥99% reproducibility
- ✅ Multi-tenant isolation verified via E2E
- ✅ All test documentation complete

---

## Complexity Assessment

**Category**: Large (L)
**Rationale**:
- Multiple components across frontend, E2E, and rubric domains
- Cross-system implications (frontend ↔ API ↔ backend)
- Requires specialized skills (Playwright, test data generation, rubric evaluation)
- High complexity in determinism validation and test data creation
- Risk factors: E2E flakiness, determinism edge cases, test data generation

**Dependencies**:
- Backend infrastructure (database, API endpoints) — Status: Ready
- Frontend API client and routes — Status: Ready
- Workflow orchestration — Status: Ready (framework exists, skills pending)
- Rubric framework — Status: Partially ready (needs test suite)

**Blockers**: None — all prerequisites in place

---

## Detailed Work Packages

### WP-N7: Frontend Testing Expansion (2 weeks)

**Scope**: Unit tests for entity editors, API client tests, page integration tests
**Target Coverage**: 70% frontend coverage (up from 30%)
**Deliverables**: Test files, mocks, fixtures, coverage reports
**Success Criteria**: All entity editors tested, API client ≥80% coverage, pages render correctly

**Tasks**:
- **N7.1**: Entity editor unit tests (StyleEditor, LyricsEditor, PersonaEditor, ProducerNotesEditor, SourceEditor, BlueprintEditor) — 21 story points
- **N7.2**: API client tests (mock responses, error handling, retry logic) — 13 story points
- **N7.3**: Page integration tests (dashboard, songs, workflow pages) — 13 story points
- **N7.4**: Coverage analysis and gaps filling — 8 story points

**See**: `/docs/project_plans/implementation_plans/frontend-tests.md`

---

### WP-N8: E2E Testing Suite (2 weeks)

**Scope**: Playwright setup, user journey tests, edge case validation
**Deliverables**: E2E test files, auth fixtures, CI/CD integration
**Success Criteria**: Core journeys tested, tenant isolation verified, edge cases covered

**Tasks**:
- **N8.1**: Playwright infrastructure setup (config, fixtures, auth) — 13 story points
- **N8.2**: User journey tests (create song → execute workflow → view results) — 21 story points
- **N8.3**: Edge case tests (network interruptions, concurrent runs, large SDSs) — 13 story points
- **N8.4**: CI/CD integration and reporting — 8 story points

**See**: `/docs/project_plans/implementation_plans/e2e-tests.md`

---

### WP-N9: Rubric Compliance Testing (2-3 weeks)

**Scope**: 200-song test suite, compliance validation, auto-fix convergence analysis
**Deliverables**: Test suite fixtures, compliance reports, convergence analysis
**Success Criteria**: ≥95% pass rate, ≥90% auto-fix convergence, determinism ≥99%

**Tasks**:
- **N9.1**: 200-song test suite generation (all genres, varying complexity) — 21 story points
- **N9.2**: Rubric compliance validation framework — 13 story points
- **N9.3**: Auto-fix convergence analysis (iteration tracking, failure patterns) — 13 story points
- **N9.4**: Determinism validation and reproducibility testing — 13 story points

**See**: `/docs/project_plans/implementation_plans/rubric-compliance.md`

---

## Implementation Sequence

### Week 1: Frontend Unit Tests + Rubric Test Suite Generation
**Focus**: Parallel work on frontend component tests and test data creation

**Team Assignment**:
- Frontend Developer: N7.1 (entity editor tests) + N7.2 (API client tests)
- QA Specialist: N9.1 (200-song test suite generation)

**Deliverables**:
- StyleEditor, LyricsEditor tests
- API client mocks and tests
- 100 SDSs generated (genres: pop, rock, hip-hop, country, electronic)

**Validation**: Unit tests passing, API mocks working, SDSs valid JSON

---

### Week 2: Page Tests + E2E Infrastructure + Compliance Framework
**Focus**: Finishing frontend tests, E2E setup, rubric validation framework

**Team Assignment**:
- Frontend Developer: N7.3 (page tests) + N7.4 (coverage analysis)
- QA Automation Engineer: N8.1 (Playwright setup) + N9.2 (compliance framework)
- QA Specialist: N9.1 (remaining 100 SDSs)

**Deliverables**:
- Dashboard, Songs, Workflow page tests
- Playwright config, auth fixtures, base test suite
- Rubric validation engine + test runner
- Full 200-song test suite

**Validation**: Pages render, Playwright fixtures working, compliance tests running

---

### Week 3: E2E Journey Tests + Convergence Analysis
**Focus**: User journey E2E tests and auto-fix analysis

**Team Assignment**:
- QA Automation Engineer: N8.2 (journey tests) + N8.3 (edge cases)
- QA Specialist: N9.3 (convergence analysis) + N9.4 (determinism)
- Frontend Developer: Bug fixes from week 1-2 tests

**Deliverables**:
- Complete user journey E2E tests
- Edge case test coverage (network, concurrency, large SDSs)
- Auto-fix convergence report
- Determinism validation report (reproducibility ≥99%)

**Validation**: E2E tests passing, reports generated, reproducibility metrics confirmed

---

### Week 4: CI/CD Integration + Bug Fixes + Documentation
**Focus**: Production-ready test infrastructure

**Team Assignment**:
- QA Automation Engineer: N8.4 (CI/CD integration) + test flakiness fixes
- All: Bug fixes, documentation updates
- Frontend Developer: Final coverage audit

**Deliverables**:
- GitHub Actions CI/CD workflows
- Test execution reports
- Documentation: test running guide, troubleshooting, maintenance
- Final coverage report

**Validation**: All tests passing in CI, ≥70% frontend coverage, documentation complete

---

## Risk Assessment

### High-Risk Areas

#### 1. E2E Test Flakiness (Network, Timing)
**Risk Level**: HIGH
**Impact**: Failed CI/CD builds, developer friction
**Mitigation**:
- Use Playwright's built-in retry mechanisms
- Implement exponential backoff in E2E tests
- Isolate E2E from external services (mock auth, API)
- Start with smoke test subset, expand gradually
- Monitor and report flaky test patterns

**Owner**: QA Automation Engineer

---

#### 2. Determinism Validation Complexity
**Risk Level**: HIGH
**Impact**: Cannot validate reproducibility requirement (≥99%)
**Mitigation**:
- Use exact artifact comparison (SHA-256 hashes)
- Control seed propagation strictly
- Create determinism test suite early (week 1)
- Run reproducibility tests on backend infrastructure (not CI)
- Document any non-deterministic behavior discovered

**Owner**: QA Specialist

---

#### 3. Test Data Generation (200 SDSs)
**Risk Level**: MEDIUM
**Impact**: Compliance testing blocked if data invalid
**Mitigation**:
- Create SDS generator script (Python, uses schema validation)
- Validate all SDSs before testing
- Create 20% more than needed (50+ spares)
- Use stratified sampling (ensure all genre blueprints covered)

**Owner**: QA Specialist

---

#### 4. Frontend Test Environment Setup
**Risk Level**: MEDIUM
**Impact**: Tests fail due to missing mocks, auth issues
**Mitigation**:
- Use Vitest (already in use) with consistent setup
- Create shared test utilities/fixtures
- Mock API responses comprehensively
- Run tests in isolated browser context (Playwright)

**Owner**: Frontend Developer

---

#### 5. Multi-Tenant Isolation E2E Validation
**Risk Level**: MEDIUM
**Impact**: Data leakage between tenants not detected
**Mitigation**:
- Create test fixtures for 2 distinct tenants
- E2E tests create separate songs per tenant
- Verify one tenant cannot access another's data
- Query-based verification (API list endpoints)

**Owner**: QA Automation Engineer

---

### Dependency Management

**Critical Path**:
- Backend API availability (ready)
- Workflow orchestration framework (ready, skills pending)
- Database seeding capability (ready)

**Inter-task Dependencies**:
```
N7.1 (Editor Tests) → N7.3 (Page Tests)
    ↓
N7.4 (Coverage Analysis)

N8.1 (Playwright Setup) → N8.2 (Journey Tests) → N8.3 (Edge Cases) → N8.4 (CI/CD)

N9.1 (Test Data) → N9.2 (Validation) → N9.3 (Convergence) + N9.4 (Determinism)
```

**Parallelization Opportunities**:
- N7.1 and N9.1 can run in parallel (week 1)
- N8.1 can start after N7.1 (week 2)
- N9.3 and N9.4 can run in parallel (week 3)

---

## Quality Standards & Gates

### Frontend Test Quality Standards

**Unit Tests**:
- ≥70% code coverage for entity editors
- All happy path scenarios tested
- Edge cases (empty inputs, max values, conflicts)
- Error handling (API failures, validation errors)
- Accessibility (ARIA attributes, keyboard navigation)

**Coverage Tools**:
- Vitest with c8 coverage reporter
- Target: 70% for all tested files
- Report: `coverage/` directory in `apps/web/`

---

### E2E Test Quality Standards

**Test Categories**:
1. **Smoke Tests** (fast, core paths): 5 tests, <2 min total
2. **Critical User Journeys** (complete flows): 10 tests, <10 min total
3. **Edge Cases** (boundaries, errors): 8 tests, <10 min total
4. **Multi-tenant** (isolation): 3 tests, <5 min total

**Quality Checks**:
- All tests have clear, descriptive names
- No hardcoded values (use fixtures, environment variables)
- Proper error messages (assertions show what failed)
- Retry logic for network-dependent operations
- Screenshot/video capture on failure

**Reporting**:
- HTML report in GitHub Actions
- JUnit XML for CI integration
- Flakiness tracking (retry counts)

---

### Rubric Compliance Standards

**Test Suite Characteristics**:
- 200 diverse SDSs (30 pop, 30 rock, 30 hip-hop, 30 country, 30 electronic, 20 other)
- Varying complexity (simple 3-section to complex 20-section songs)
- Edge cases (minimum BPM, maximum BPM, unusual rhyme schemes)
- Genre coverage: all blueprints represented in test data

**Validation Criteria**:
- ≥95% pass rate (175/200 songs pass rubric)
- ≥90% auto-fix convergence (90% of failures fixed within 3 iterations)
- ≥99% reproducibility (same seed → identical outputs)
- Zero profanity violations on public songs
- Zero policy violations (naming constraints)

**Reporting**:
- JSON report: pass/fail per SDS
- CSV export: failure analysis
- Dashboard: genre breakdown, convergence metrics
- Trends: track improvements over time

---

## Deliverables

### Frontend Tests (WP-N7)

**Files to Create**:
```
apps/web/src/components/editors/__tests__/
├── StyleEditor.test.tsx
├── LyricsEditor.test.tsx
├── PersonaEditor.test.tsx
├── ProducerNotesEditor.test.tsx
├── SourceEditor.test.tsx
└── BlueprintEditor.test.tsx

apps/web/src/lib/api/__tests__/
├── client.test.ts
├── songs.test.ts
├── styles.test.ts
├── lyrics.test.ts
├── personas.test.ts
├── producer-notes.test.ts
├── sources.test.ts
└── blueprints.test.ts

apps/web/app/__tests__/
├── dashboard.test.tsx
├── songs.test.tsx
└── workflows.test.tsx
```

**Fixtures & Mocks**:
```
apps/web/src/__tests__/fixtures/
├── api-responses.ts (mock data for all entity types)
├── sds-sample.json (sample SDS for testing)
└── styles-data.ts (sample style entities)

apps/web/src/__tests__/setup.ts (global test configuration)
```

---

### E2E Tests (WP-N8)

**Files to Create**:
```
apps/web/e2e/
├── playwright.config.ts
├── fixtures/
│   ├── auth.ts (authentication helpers)
│   ├── api.ts (API mocking fixtures)
│   └── data.ts (test data loaders)
├── auth/
│   ├── login.spec.ts
│   └── multi-tenant.spec.ts
├── workflows/
│   ├── create-song.spec.ts
│   ├── edit-entities.spec.ts
│   ├── run-workflow.spec.ts
│   └── view-results.spec.ts
└── edge-cases/
    ├── network-interruption.spec.ts
    ├── concurrent-runs.spec.ts
    └── large-sds.spec.ts
```

**CI/CD Integration**:
```
.github/workflows/
└── e2e-tests.yml (Playwright test runner)
```

---

### Rubric Compliance Tests (WP-N9)

**Files to Create**:
```
tests/rubric/
├── fixtures/
│   ├── sds-200.json (200-song test suite)
│   ├── genres/ (genre-specific SDSs)
│   │   ├── pop-30.json
│   │   ├── rock-30.json
│   │   ├── hiphop-30.json
│   │   ├── country-30.json
│   │   └── electronic-30.json
│   └── edge-cases/ (boundary value tests)
├── test_compliance.py (rubric validation)
├── test_convergence.py (auto-fix analysis)
├── test_determinism.py (reproducibility)
└── reports/
    ├── compliance-report.json
    ├── convergence-analysis.json
    └── determinism-report.json
```

**Test Data Generator**:
```
scripts/
└── generate-test-sdss.py (creates 200 valid SDSs)
```

---

## Success Metrics & Acceptance Gates

### Coverage Metrics

| Metric | Target | Current | Gate |
|--------|--------|---------|------|
| Frontend coverage | ≥70% | 30% | Pass if ≥70% |
| Entity editors tested | 6/6 | 0/6 | Pass if 6/6 |
| API client coverage | ≥80% | 0% | Pass if ≥80% |
| E2E smoke tests | 5/5 | 0/5 | Pass if 5/5 |
| E2E journey tests | 10/10 | 0/10 | Pass if 10/10 |
| E2E edge cases | 8/8 | 0/8 | Pass if 8/8 |
| Rubric compliance | ≥95% | TBD | Pass if ≥95% |
| Auto-fix convergence | ≥90% | TBD | Pass if ≥90% |
| Determinism | ≥99% | TBD | Pass if ≥99% |

### Quality Gates

**Gate 1: Frontend Test Coverage (WP-N7)**
- ✅ All entity editor tests passing
- ✅ API client coverage ≥80%
- ✅ Page integration tests passing
- ✅ Overall coverage ≥70%
- ✅ Accessibility checks passing

**Gate 2: E2E Test Suite (WP-N8)**
- ✅ Playwright tests passing locally and in CI
- ✅ Smoke tests <2 min, journey tests <10 min
- ✅ No flaky tests (consistent passes)
- ✅ Multi-tenant isolation validated
- ✅ Screenshots/logs on failure

**Gate 3: Rubric Compliance (WP-N9)**
- ✅ 200-song test suite running
- ✅ Pass rate ≥95%
- ✅ Auto-fix convergence ≥90%
- ✅ Determinism reproducibility ≥99%
- ✅ Compliance report generated

**Release Criteria** (all gates must pass):
- Frontend coverage ≥70%
- E2E tests 100% passing in CI
- Rubric pass rate ≥95%
- No critical bugs in testing infrastructure
- Documentation complete

---

## Timeline & Resource Allocation

**Duration**: 4 weeks (2025-11-17 to 2025-12-12)

**Team Composition**:
- QA Automation Engineer (40 hours/week for 4 weeks) — E2E + rubric compliance
- Frontend Developer (30 hours/week for 2 weeks) — Frontend tests
- QA Specialist (20 hours/week for 3 weeks) — Test data, compliance analysis

**Weekly Breakdown**:

| Week | Frontend Dev | QA Automation | QA Specialist | Focus |
|------|--------------|---------------|---------------|-------|
| 1    | N7.1, N7.2   | -             | N9.1          | Unit tests, test data |
| 2    | N7.3, N7.4   | N8.1, N9.2    | N9.1 (cont.)  | Page tests, E2E setup |
| 3    | -            | N8.2, N8.3    | N9.3, N9.4    | E2E journeys, analysis |
| 4    | Fixes        | N8.4          | Fixes         | CI/CD, polish |

**Estimated Story Points**: 89 total
- N7 (Frontend): 55 story points
- N8 (E2E): 55 story points
- N9 (Rubric): 60 story points
- **Total**: 170 story points (but parallelized across team)

---

## Implementation Notes

### Technology Stack

**Frontend Testing**:
- Framework: Vitest (already in use)
- Component testing: React Testing Library
- Mocking: MSW (Mock Service Worker) or jest.mock
- Assertions: Vitest/Chai
- Coverage: c8

**E2E Testing**:
- Framework: Playwright
- Config: `playwright.config.ts` (multi-browser if needed)
- Reporting: HTML + JUnit XML
- CI: GitHub Actions

**Rubric Testing**:
- Framework: pytest (existing infrastructure)
- Data validation: jsonschema
- Reporting: pytest-html, custom JSON reporters

### Development Workflow

1. **Branch**: Create `feat/testing-*` branch per workstream
2. **Tests first**: Write tests before fixes
3. **CI validation**: All tests must pass before merge
4. **Coverage gates**: Enforce minimum coverage in pull requests
5. **Documentation**: Update test running guide with each phase

### Maintenance & Upkeep

**Test Maintenance Plan**:
- Review flaky tests weekly (first month)
- Update mocks if API contracts change
- Archive old test runs (keep 30 days)
- Monthly coverage trend review

**Documentation**:
- Create `TESTING.md` in each area (frontend, e2e, rubric)
- Troubleshooting guide for common issues
- Test data generation documentation

---

## Monitoring & Observability

### Metrics to Track

**Development Progress**:
- Tests written per day (target: 5-10/day)
- Coverage increase per week (target: +10%/week)
- Defects found in tests (track to improve test quality)
- Time-to-implement per test (baseline for estimation)

**Test Execution**:
- Test pass rate (target: 100% in CI)
- Test execution time (smoke <2 min, full <30 min)
- Flaky test count (target: 0)
- Test failure root causes

**Quality**:
- Coverage trends (track towards 70%+)
- Defects caught by each test tier (frontend/E2E/compliance)
- False positive rate (tests that fail for wrong reasons)

### Dashboard & Reporting

**Weekly Reports**:
- Coverage report with trend
- Test execution summary
- Flaky test analysis
- Blockers and risks

**Final Report** (end of implementation):
- Coverage baseline vs target
- E2E test passing rate
- Rubric compliance results
- Recommendations for improvement

---

## Related Documentation

**See Phase-Specific Plans**:
- Frontend Tests: `/docs/project_plans/implementation_plans/frontend-tests.md`
- E2E Tests: `/docs/project_plans/implementation_plans/e2e-tests.md`
- Rubric Compliance: `/docs/project_plans/implementation_plans/rubric-compliance.md`

**Reference Documents**:
- `/docs/NEXT-STEPS-REPORT.md` — Work packages WP-N7, N8, N9
- `/docs/PRD-REQUIREMENTS-SUMMARY.md` — Quality gate requirements
- `/CLAUDE.md` — Testing guidelines and patterns

---

## Sign-Off & Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| QA Lead | TBD | [ ] Approved | - |
| Frontend Lead | TBD | [ ] Approved | - |
| Technical Lead | TBD | [ ] Approved | - |
| Product Owner | TBD | [ ] Approved | - |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Next Review**: Weekly during implementation
**Status**: Ready for Implementation
