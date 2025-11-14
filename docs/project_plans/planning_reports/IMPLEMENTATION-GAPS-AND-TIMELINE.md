# Implementation Gaps & Timeline

**Generated**: 2025-11-14
**Current State**: Phase 1 Complete (90%), Phase 2 Partial (80%)
**Critical Path**: Phase 3 Orchestration (10% complete) - BLOCKS MVP

---

## Critical Gaps

### Gap 1: SDS Aggregation Service (Backend)

- **Issue**: Phase 2 design exists but no implementation plan
- **Impact**: Cannot compile entity specs into SDS; blocks workflow execution
- **Missing Components**:
  - SDS aggregation logic (entity refs → validated SDS)
  - Source weight normalization (sum to 1.0)
  - Cross-entity consistency validation (blueprint genre matches style)
  - Tag conflict matrix enforcement
  - Blueprint constraint validation (BPM ranges, section requirements)
- **Plan Needed**: `sds-aggregation-implementation-v1.md`
- **Effort**: 1 week (parallel with entity services)

### Gap 2: API Endpoint Business Logic

- **Issue**: Routes call repositories directly; missing service layer integration
- **Impact**: No constraint enforcement, validation bypassed
- **Missing Components**:
  - Song endpoints (`POST /songs`, `PUT /songs/{id}/sds`)
  - Workflow endpoints (`POST /workflow/runs`, `GET /workflow/runs/{id}/events`)
  - Validation endpoints (`POST /validate/style`, `/validate/lyrics`)
- **Plan Needed**: Integrated into `backend-entity-services-v1.md` (extend WP scope)
- **Effort**: 3-5 days (parallel with services)

### Gap 3: Frontend Integration & Polish

- **Issue**: Phase 4 design complete, components built, but no integration plan
- **Impact**: Component library inconsistencies, accessibility gaps, incomplete state management
- **Missing Components**:
  - Component library consistency audit
  - Accessibility compliance verification (WCAG 2.1 AA)
  - Integration testing between components and API
  - Production deployment configuration
- **Plan Needed**: `frontend-integration-polish-v1.md` (optional polish pass)
- **Effort**: 1 week (post-MVP, quality improvement)

---

## Complete Implementation Timeline

### Phase 2: Backend Foundation (Weeks 1-2)

**Status**: 80% complete, missing SDS aggregation

**Plans to Execute**:
1. **backend-entity-services-v1.md** (Week 1)
   - 5 missing entity services (lyrics, persona, producer_notes, blueprint, source)
   - Transaction management and business logic
   - Dependencies: None (DB schema exists)

2. **NEW: sds-aggregation-implementation-v1.md** (Week 1, parallel)
   - SDS compilation from entity references
   - Weight normalization, cross-validation
   - Tag conflict detection
   - Dependencies: Entity services (can use repositories directly)

**Deliverables**:
- All entity services operational
- SDS compilation endpoint functional
- API routes integrated with service layer

---

### Phase 3: Orchestration (Weeks 1-6)

**Status**: 10% complete (framework ready, skills missing)

**Plans to Execute**:
1. **amcs-workflow-skills-v1.md** (Weeks 1-4, critical path)
   - 8 Claude Code skills (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, REVIEW)
   - Deterministic execution (≥99% reproducibility)
   - 241 story points, 2-3 agents parallel
   - Dependencies: SDS aggregation (Gap 1)

2. **validation-determinism-v1.md** (Weeks 3-6, parallel)
   - Blueprint constraint validation
   - Tag conflict matrix enforcement
   - Policy guards (profanity, PII, artist normalization)
   - Determinism test suite (500 runs: 50 SDSs × 10)
   - Dependencies: Workflow skills (Phases 1-4)

**Deliverables**:
- Full PLAN → REVIEW workflow executable
- Determinism ≥99% validated
- Rubric scoring operational

---

### Phase 4: Frontend (Weeks 3-7)

**Status**: 75% complete (components built, integration gaps)

**Plans to Execute**:
1. **websocket-realtime-client-v1.md** (Week 3)
   - WebSocket connection management
   - Event subscription hooks
   - Auto-reconnection logic
   - Real-time workflow progress UI
   - Dependencies: Backend WebSocket (ready)

2. **frontend-state-management-v1.md** (Week 4)
   - Domain stores (songs, workflows, entities)
   - React Query integration
   - Optimistic updates
   - Dependencies: API endpoints (Phase 2)

3. **OPTIONAL: frontend-integration-polish-v1.md** (Week 7, post-MVP)
   - Component consistency audit
   - Accessibility compliance
   - Production deployment prep
   - Dependencies: WebSocket + state management

**Deliverables**:
- Real-time workflow monitoring functional
- Domain state management complete
- UI fully integrated with backend

---

### Phase 5: Testing (Weeks 7-11)

**Status**: 60% complete (backend 90%, frontend 30%, E2E 0%)

**Plans to Execute**:
1. **testing-suite-expansion-v1.md** (Weeks 7-10, umbrella plan)
   - Includes **frontend-tests.md** (entity editors, API client, pages)
   - Includes **e2e-tests.md** (Playwright user journey tests)
   - Includes **rubric-compliance.md** (200-song test suite)
   - Dependencies: Workflow skills (Phase 3), frontend integration (Phase 4)

**Deliverables**:
- Frontend test coverage ≥70%
- E2E tests for critical flows
- Rubric compliance ≥95%

---

## Expected Results by Phase

### After Phase 2 (Week 2)
- ✅ All entity CRUD operations functional
- ✅ SDS compilation from entity references working
- ✅ Service layer enforces business logic and constraints
- ✅ API endpoints validate inputs and return structured errors
- ✅ Ready to trigger workflow orchestration

### After Phase 3 (Week 6)
- ✅ Full workflow execution (PLAN → REVIEW)
- ✅ Determinism validated (≥99% reproducibility)
- ✅ Artifacts stored with SHA-256 hashes
- ✅ Event stream delivers real-time updates
- ✅ Rubric scoring operational
- ✅ Auto-fix loop (≤3 iterations) working
- ✅ CLI-based AMCS functional (MVP milestone)

### After Phase 4 (Week 7)
- ✅ Web UI displays real-time workflow progress
- ✅ Entity editors integrated with backend
- ✅ WebSocket updates UI within 1 second
- ✅ Domain state management complete
- ✅ User can create song → run workflow → view results

### After Phase 5 (Week 11)
- ✅ All acceptance gates passed (rubric, determinism, security, latency)
- ✅ Comprehensive test coverage (backend ≥80%, frontend ≥70%)
- ✅ E2E tests validate complete user journeys
- ✅ Production-ready deployment
- ✅ Full-featured product complete

---

## Next Actions

### Immediate (Week 1)

1. **Create missing plan**: `sds-aggregation-implementation-v1.md`
   - Copy structure from `backend-entity-services-v1.md`
   - Reference Phase 2 design doc for requirements
   - Detailed task breakdown for SDS service, validator, normalizer

2. **Start parallel work**:
   - Assign `backend-api-engineer` → **backend-entity-services-v1.md**
   - Assign `backend-orchestration-engineer` → **sds-aggregation-implementation-v1.md** (once created)
   - Both can complete in Week 1

3. **Prepare Phase 3 kickoff**:
   - Review **amcs-workflow-skills-v1.md** with technical lead
   - Assign 2-3 `ai-artifacts-engineer` agents for skill development
   - Prepare skill infrastructure (Phase 0 of skills plan)

### Week 2-3

1. **Phase 3 start**: Begin workflow skills development
2. **Phase 4 start**: Begin WebSocket client (parallel with skills)
3. **Validation enhancement**: Start **validation-determinism-v1.md** (parallel)

### Week 4-6

1. **Complete skills**: Finish all 8 workflow skills
2. **Frontend integration**: Complete state management and WebSocket
3. **Determinism validation**: Run 500-run reproducibility tests

### Week 7-11

1. **Testing expansion**: Execute **testing-suite-expansion-v1.md**
2. **Acceptance gates**: Validate rubric compliance, determinism, security, latency
3. **Production prep**: Deployment, monitoring, documentation

---

## Plan Execution Order

```
Week 1-2: Backend Foundation
├── backend-entity-services-v1.md
└── NEW: sds-aggregation-implementation-v1.md

Week 1-6: Orchestration (critical path)
├── amcs-workflow-skills-v1.md (Weeks 1-4)
└── validation-determinism-v1.md (Weeks 3-6)

Week 3-7: Frontend
├── websocket-realtime-client-v1.md (Week 3)
├── frontend-state-management-v1.md (Week 4)
└── OPTIONAL: frontend-integration-polish-v1.md (Week 7)

Week 7-11: Testing
└── testing-suite-expansion-v1.md
    ├── frontend-tests.md
    ├── e2e-tests.md
    └── rubric-compliance.md
```

---

## Resource Allocation

### Week 1-2: Backend (2-3 agents)
- 1× `backend-api-engineer` (entity services)
- 1× `backend-orchestration-engineer` (SDS aggregation)
- 1× `python-backend-engineer` (API endpoint logic)

### Week 1-6: Orchestration (4-5 agents)
- 2-3× `ai-artifacts-engineer` (workflow skills, parallel)
- 1× `backend-orchestration-engineer` (validation service)
- 1× `qa-automation-engineer` (determinism tests)

### Week 3-7: Frontend (2 agents)
- 1× `frontend-developer` (WebSocket + state)
- 1× `frontend-ui-engineer` (integration polish, optional)

### Week 7-11: Testing (2 agents)
- 1× `qa-automation-engineer` (E2E, rubric)
- 1× `frontend-developer` (frontend tests)

**Total**: 6-8 agents, 11 weeks
**Critical Path**: 6 weeks (Phase 3 orchestration)

---

## Key Milestones

| Week | Milestone | Acceptance Criteria |
|------|-----------|---------------------|
| 2 | **Phase 2 Complete** | SDS compilation working, all entity services operational |
| 4 | **Skills Complete** | 8 workflow skills implemented, unit tests passing |
| 6 | **MVP Ready** | Full workflow executable, determinism ≥99%, CLI functional |
| 7 | **UI Integrated** | WebSocket updates, state management, user can run workflows |
| 11 | **Production Ready** | All gates passed, tests passing, deployment ready |

---

## Acceptance Gates (MVP at Week 6)

### Gate A: Rubric Compliance
- ✅ ≥95% pass rate on 200-song test suite
- ✅ Auto-fix convergence ≥90% (within 3 iterations)

### Gate B: Determinism
- ✅ ≥99% reproducibility (500 runs: 50 SDSs × 10)
- ✅ Seed propagation verified
- ✅ No floating-point randomness

### Gate C: Security
- ✅ Zero high-severity MCP violations
- ✅ PII redaction working
- ✅ Profanity filtering operational

### Gate D: Performance
- ✅ P95 latency ≤60s (Plan → Prompt, no render)
- ✅ Event latency <1s (emission to UI)

---

**Document Owner**: Lead Architect
**Last Updated**: 2025-11-14
**Next Review**: 2025-11-21 (weekly during active development)
