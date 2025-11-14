# MeatyMusic Implementation Plans

This directory contains comprehensive, detailed implementation plans for MeatyMusic AMCS components.

## Current Plans

### 1. SDS Aggregation & Song Creation Backend (CRITICAL - Phase 3 Blocker)

**Status**: READY FOR IMPLEMENTATION
**Created**: 2025-11-14
**Complexity**: Medium (M) - Standard Track
**Priority**: CRITICAL (Blocks Phase 3 Orchestration)
**Duration**: 1 week (5-7 business days)
**Effort**: 26-30 story points

#### Plan Document
- **File**: `sds-aggregation-implementation-v1.md`
- **Purpose**: Complete song creation backend flow with SDS compilation and validation
- **Length**: ~2100 lines (single comprehensive document)
- **Key Sections**:
  - Executive Summary (current state: Phase 2 80% complete)
  - Implementation Strategy (layered architecture)
  - 5 Phase Breakdown (Repository → Services → API → Testing → Docs)
  - 12 Detailed Tasks (SDS-001 through SDS-012)
  - Risk Mitigation & Success Metrics

#### What This Plan Delivers

**Core Components**:
1. **SDS Compiler Service**: Aggregates entity references into validated SDS JSON
2. **Blueprint Validator Service**: Enforces genre-specific constraints (BPM, sections, lexicon)
3. **Tag Conflict Resolver**: Applies conflict matrix to resolve tag contradictions
4. **Cross-Entity Validator**: Ensures consistency between style, lyrics, producer notes
5. **Enhanced Song API**: Integrated song creation with full validation pipeline

**Key Features**:
- Deterministic SDS compilation (SHA-256 hashing)
- Source weight normalization (sum to 1.0)
- Blueprint constraint enforcement
- Tag conflict resolution via conflict matrix
- Cross-entity consistency validation
- Comprehensive error messages

**Dependencies Resolved**:
- Builds on Phase 1 (Entity Services) - Complete
- Completes Phase 2 (Aggregation) - Currently 80%
- Unblocks Phase 3 (Orchestration) - Waiting on this
- Uses existing infrastructure (DB models, repositories, validation service)

#### Phase Structure

**Phase 1**: Repository Extensions (0.5 days, 3 pts)
- Add batch entity fetching for SDS compilation
- Optimize queries with eager loading

**Phase 2A**: SDS Compiler Service (2 days, 8 pts)
- Core compiler logic
- Entity-to-SDS transformation
- Weight normalization
- Deterministic hashing

**Phase 2B**: Validation Services (1.5 days, 6 pts)
- Blueprint constraint validator
- Tag conflict resolver
- Cross-entity validator

**Phase 2C**: Utility Services (1 day, 4 pts)
- Source weight normalizer
- SDS hash calculator
- Genre consistency checker

**Phase 3**: API Enhancement (1 day, 4 pts)
- Enhanced POST /songs with SDS compilation
- New GET /songs/{id}/sds endpoint
- Error handling and rollback logic

**Phase 4**: Testing Suite (1.5 days, 5 pts)
- Unit tests (95%+ coverage)
- Integration tests (end-to-end flow)
- Determinism tests (hash reproducibility)

**Phase 5**: Documentation (0.5 days, 2 pts)
- API documentation
- Algorithm descriptions

#### Quick Start for Developers

1. **Review Plan**: Read `sds-aggregation-implementation-v1.md`
2. **Check Prerequisites**: Verify Phase 1-2 infrastructure exists
3. **Create Branch**: `feature/sds-aggregation-v1`
4. **Follow Phases**: Implement in order (1 → 2A-C → 3 → 4 → 5)
5. **Use File Paths**: All file paths are absolute and production-ready
6. **Check Acceptance Criteria**: Each task has clear completion criteria

#### Success Criteria Summary

- Song creation flow fully operational
- SDS compilation from entity references works
- All validation rules enforced
- Tag conflicts resolved deterministically
- Source weights normalized to 1.0
- API returns clear error messages
- 95%+ test coverage
- Phase 3 (Orchestration) unblocked

---

### 2. Claude Code Workflow Skills Implementation Plan (WP-N1)

**Status**: READY FOR IMPLEMENTATION
**Created**: 2025-11-14
**Duration**: 3-4 weeks (2-3 agents in parallel)

#### Main Plan Document
- **File**: `amcs-workflow-skills-v1.md`
- **Purpose**: Executive summary, complexity assessment, phase overview, subagent assignments
- **Length**: ~500 lines
- **Key Sections**:
  - Executive Summary
  - Complexity Assessment (LARGE project)
  - Orchestration Approach (FULL TRACK - all agents)
  - Delivery Timeline (4 weeks critical path)
  - 10 Phase Overview
  - Subagent Assignments
  - Acceptance Gates
  - Success Metrics
  - Risks & Mitigation
  - Dependencies & Blockers
  - Resource Requirements
  - Communication Plan

#### Detailed Phase Documents

**Phase 0 + Phases 1-4 (Infrastructure & Generation Skills)**
- **File**: `amcs-workflow-skills-v1/01-skill-infrastructure-and-generation.md`
- **Purpose**: Detailed task breakdown for Phases 0-4
- **Length**: ~800 lines
- **Coverage**:
  - Phase 0: Skill Infrastructure (6 infrastructure tasks)
  - Phase 1: PLAN Skill (5 tasks)
  - Phase 2: STYLE Skill (5 tasks)
  - Phase 3: LYRICS Skill (7 tasks - most complex)
  - Phase 4: PRODUCER Skill (5 tasks)
- **Each Phase Includes**:
  - Objective and requirement overview
  - 4-7 specific deliverable tasks
  - Story cards (for subagent story writers)
  - Effort estimates in story points
  - Acceptance criteria
  - Risk assessment

**Phases 5-10 (Composition, Validation, Integration & Optimization)**
- **File**: `amcs-workflow-skills-v1/02-composition-validation-finalization.md`
- **Purpose**: Detailed task breakdown for Phases 5-10
- **Length**: ~800 lines
- **Coverage**:
  - Phase 5: COMPOSE Skill (4 tasks)
  - Phase 6: VALIDATE Skill (4 tasks)
  - Phase 7: FIX Skill (4 tasks)
  - Phase 8: REVIEW Skill (4 tasks)
  - Phase 9: Integration Testing (4 tasks)
  - Phase 10: Extended Determinism & Optimization (4 tasks)
- **Same Structure** as Phase 0-4 document

---

## Plan Features

### Comprehensive Coverage

- **8 Claude Code Skills**: PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, REVIEW
- **Determinism Focus**: ≥99% reproducibility (seed propagation, pinned retrieval, fixed decoder settings)
- **Quality Gates**: 4 acceptance gates (execution, determinism, quality, performance)
- **Testing Strategy**: Unit tests, integration tests, determinism validation, E2E tests
- **Documentation**: Complete skill contracts, examples, troubleshooting guides

### Task Organization

**241 Total Story Points / 264-350 Hours**
- Phase 0 (Infrastructure): 27 pts
- Phases 1-4 (Generation): 97 pts
- Phases 5-8 (Composition & Finalization): 77 pts
- Phases 9-10 (Integration & Optimization): 40 pts

**Parallel-Friendly**:
- Phase 0 is foundation (3-4 days)
- Phases 1-4 can run in parallel (Skill Dev #1, #2, #3)
- Phases 5-8 depend on earlier phases (sequential)
- Phases 9-10 (testing) can start early (parallel with skills)

### Subagent Assignments

**Agents & Effort**:
- **Skill Developers (Haiku/Sonnet)**: 2-3 agents, full-time, 4 weeks
- **Integration Specialist (Sonnet)**: 1 agent, full-time, 2-3 weeks
- **QA Automation (Haiku)**: 1 agent, full-time, 3-4 weeks
- **Technical Lead (Opus)**: 1 agent, part-time (30%), 4 weeks

**Total**: 4-6 agents, equivalent to 2-3 FTE for 4 weeks

### Key Deliverables

#### Skill Directories (`.claude/skills/amcs-*/`)
- 8 directories (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, REVIEW)
- Each with:
  - `SKILL.md` - Contract, examples, determinism notes
  - `implementation.py` - Full implementation
  - `test_skill.py` - Unit tests (95%+ coverage)
  - `examples/` - Sample I/O

#### Test Suites
- Unit tests for each skill (95%+ code coverage)
- Integration tests (all skill pairs)
- E2E workflow tests (PLAN → REVIEW)
- Determinism tests (500 runs: 50 SDSs × 10 runs)
- Performance profiling & optimization

#### Documentation
- Comprehensive SKILL.md files
- Determinism checklist & guide
- Performance guide
- Troubleshooting runbook
- Workflow skills overview

---

## How to Use This Plan

### For Managers/Technical Leads

1. **Start with**: `amcs-workflow-skills-v1.md` (main plan)
   - Review executive summary
   - Check timeline and resource requirements
   - Review acceptance gates and success criteria
   - Assign agents and schedule

2. **For Phase Planning**:
   - Phases 1-4 document (phases 0-4)
   - Phases 5-10 document (phases 5-10)
   - Use for sprint planning and milestone tracking

3. **Risk Management**:
   - See "Risks & Mitigation" section in main plan
   - Review "High-Risk Areas" for proactive management

### For Skill Developers

1. **Start with**: `amcs-workflow-skills-v1/01-skill-infrastructure-and-generation.md` (Phase 0)
   - Follow infrastructure setup tasks
   - Use templates and frameworks created in Phase 0

2. **For Your Skill Phase**:
   - Find your skill (PLAN, STYLE, LYRICS, etc.)
   - Read deliverable tasks (5-7 tasks per skill)
   - Follow story cards and acceptance criteria
   - Use examples from phase document

3. **Template & Framework**:
   - Phase 0 creates `.claude/skills/amcs-template/`
   - Use as starting point for your skill
   - Determinism framework provides helpers

### For QA/Testing

1. **Start with**: Test sections in each phase (Deliverable X.Y: "Tests & Documentation")
2. **Use Test Fixtures**: Phase 0.6 creates 10+ sample SDSs
3. **Follow Determinism Requirements**: Phase 0.3 determinism framework
4. **Run Extended Tests**: Phase 10 (500 runs for ≥99% validation)

### For Documentation

1. **Phase X.Y Deliverables**: Each phase has documentation task
2. **Use SKILL.md Template**: From Phase 0
3. **Include Examples**: Input/output pairs from phase documents
4. **Final Documentation**: Phase 10.4 (comprehensive guides)

---

## Key Requirements Summary

### Determinism (Critical)
- **Target**: ≥99% reproducibility across 10+ runs with same SDS + seed
- **Implementation**:
  - Seed propagation: `seed + node_index`
  - Fixed decoder: `temperature ≤ 0.3, top_p ≤ 0.9`
  - Pinned retrieval (LYRICS): content hash-based
  - No floating-point randomness
- **Validation**: Phase 9 (10 runs × 10 SDSs) + Phase 10 (500 runs × 50 SDSs)

### Event Emission (Infrastructure)
- **All 8 skills** emit structured events
- **Schema**: `{ts, run_id, node, phase, duration_ms, metrics, issues}`
- **Phases**: START, END, optionally FAIL
- **Latency**: <1s from emission to UI

### Blueprint Constraints (Validation)
- STYLE: Enforce tempo_bpm range, tag conflicts
- LYRICS: Section requirements, banned terms, lexicon
- VALIDATE: Rubric scoring, pass/fail thresholds
- All constraints from genre blueprints

### Testing Requirements
- **Unit Tests**: 95%+ code coverage per skill
- **Integration Tests**: All skill pairs compatible
- **E2E Tests**: Full PLAN → REVIEW workflow
- **Determinism Tests**: 500 runs validation

---

## Phase Timeline

### Week 1: Foundations + Early Skills
- Days 1-3: Phase 0 (Infrastructure) complete
- Days 3-5: Phase 1 (PLAN) + Phase 2 (STYLE) in parallel
- Parallel start: Phase 3 (LYRICS) + Phase 9 early tests

### Week 2: Mid-Workflow Skills + Composition Start
- Phase 2 (STYLE) completion
- Phase 3 (LYRICS) ongoing (most complex)
- Phase 4 (PRODUCER) completion
- Phase 5 (COMPOSE) starts
- Parallel: Phase 9 integration tests

### Week 3: Composition/Validation/Fix + Testing
- Phase 5 (COMPOSE) completion
- Phase 6 (VALIDATE) completion
- Phase 7 (FIX) completion
- Phase 8 (REVIEW) completion
- Phase 9 integration tests running

### Week 4: Finalization & Acceptance
- Phase 3 (LYRICS) completion if not done
- Phase 10 (Determinism validation 500 runs)
- Phase 10 (Performance optimization)
- Phase 10 (Acceptance gate validation)
- Phase 10 (Final documentation)

---

## Acceptance Criteria Summary

### Gate 1: Skill Execution
- [ ] All 8 skills implement core functionality
- [ ] Full workflow PLAN → REVIEW executes without errors
- [ ] All artifacts stored with SHA-256 hashes
- [ ] Event stream outputs all node events

### Gate 2: Determinism
- [ ] 500 runs (50 SDSs × 10 each) with same seed
- [ ] ≥99% produce identical artifacts (byte-for-byte except timestamps)
- [ ] Seed propagation verified end-to-end
- [ ] No floating-point randomness detected

### Gate 3: Quality
- [ ] Unit test pass rate: 100%
- [ ] Integration test pass rate: 100%
- [ ] Code coverage: ≥80% for skill logic
- [ ] Documentation: Complete with examples

### Gate 4: Performance
- [ ] P95 latency ≤60s (Plan → Prompt, excluding render)
- [ ] P50 latency ≤30s
- [ ] No memory leaks over 100 workflow executions
- [ ] Event latency <1s (emission to WebSocket)

---

## Quick Reference

### File Structure
```
docs/project_plans/implementation_plans/
├── amcs-workflow-skills-v1.md (main plan, 500 lines)
└── amcs-workflow-skills-v1/
    ├── 01-skill-infrastructure-and-generation.md (Phases 0-4, 800 lines)
    ├── 02-composition-validation-finalization.md (Phases 5-10, 800 lines)
    └── README.md (this file)
```

### Artifact Locations
- **Skills**: `.claude/skills/amcs-{plan,style,lyrics,producer,compose,validate,fix,review}/`
- **Tests**: `tests/skills/` + `tests/integration/` + `tests/determinism/`
- **Fixtures**: `tests/fixtures/` (50+ sample SDSs)
- **Documentation**: `docs/WORKFLOW-SKILLS-GUIDE.md` + `docs/DETERMINISM-CHECKLIST.md`

### Related Work Packages
- **WP-N2** (Validation Service): Parallel with WP-N1, enhances VALIDATE skill
- **WP-N3** (Determinism Framework): Parallel with WP-N1, provides testing infrastructure
- **WP-N4** (WebSocket Client): Parallel with WP-N1, consumes events from skills
- **WP-N5** (State Management): Parallel with WP-N1, uses workflow data

---

## Document Status

**Version**: 1.0
**Created**: 2025-11-14
**Status**: READY FOR IMPLEMENTATION
**Approval**: Ready for technical lead review
**Next Steps**: Assign agents, create implementation branches, begin Phase 0

---

## Contact & Questions

**For Questions About**:
- **Implementation Strategy**: See main plan (`amcs-workflow-skills-v1.md`)
- **Specific Skills**: See phase documents (01-skill-infrastructure-and-generation.md or 02-composition-validation-finalization.md)
- **Determinism**: See Phase 0.3 (Determinism Framework) + Phase 10.1 (Extended Validation)
- **Testing**: See Phase 9-10 (Integration & Determinism)

**Reference Documents**:
- PRD: `/docs/project_plans/PRDs/claude_code_orchestration.prd.md`
- Requirements Summary: `/docs/PRD-REQUIREMENTS-SUMMARY.md`
- Next Steps Report: `/docs/project_plans/NEXT-STEPS-REPORT.md`
- Overview: `/docs/amcs-overview.md`

---

**Last Updated**: 2025-11-14
**Maintained By**: Implementation Planning Orchestrator
**Review Frequency**: Weekly during active development

