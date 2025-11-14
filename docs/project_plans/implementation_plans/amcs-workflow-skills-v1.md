# Implementation Plan: Claude Code Workflow Skills (WP-N1)

**Document ID**: IMPL-AMCS-WS-001
**Version**: 1.0
**Created**: 2025-11-14
**Status**: Ready for Implementation
**Target Audience**: AI Development Agents + Technical Leadership

---

## Executive Summary

This document defines the comprehensive implementation strategy for **WP-N1: Claude Code Workflow Skills Development** from the MeatyMusic NEXT-STEPS-REPORT.md. The work package focuses on implementing 8 deterministic Claude Code skills that power the core AMCS workflow: **PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → REVIEW**.

### Complexity Assessment

**Classification**: LARGE (L)
- **Scope**: Cross-system, 8 major components with interconnected dependencies
- **Task Count**: 25+ detailed tasks across multiple phases
- **Estimated Duration**: 3-4 weeks (with 2-3 agents working in parallel)
- **Critical Dependencies**: Claude Code environment, determinism framework, orchestration API
- **Risk Level**: MEDIUM (determinism and seed propagation are challenging)

### Orchestration Approach

**Track**: **FULL TRACK** - All agents + comprehensive planning
- Story writers: Develop user story formats for each skill
- Dependency mappers: Map skill execution sequences and data flow
- Task estimators: Generate effort estimates for each skill phase
- Risk assessors: Identify determinism and integration risks
- Validation checkers: Ensure all skills meet determinism gates
- Architecture validators: Confirm MeatyMusic patterns adherence

### Delivery Timeline

**Critical Path**: 4 weeks with 2-3 agents
- **Week 1**: PLAN, STYLE, LYRICS, PRODUCER skills (basic implementations)
- **Week 2**: COMPOSE, VALIDATE, FIX skills + skill refinements
- **Week 3**: REVIEW skill + integration testing + determinism validation
- **Week 4**: Optimization, E2E testing, acceptance gate validation

**Parallel Work**: Validation service (WP-N2) and determinism framework (WP-N3) can proceed simultaneously with minimal blocking.

---

## What This Plan Delivers

### Immediate Outputs

1. **8 Skill Directories** (`.claude/skills/amcs-*/`)
   - Each with `SKILL.md`, implementation scripts, test harness
   - Input/output contract definitions
   - Determinism verification checklist

2. **Unit Tests for Each Skill**
   - Basic functionality tests
   - Edge case coverage
   - Input validation tests

3. **Integration Test Suite**
   - Full workflow execution (PLAN → REVIEW)
   - Data flow validation between skills
   - Event stream verification

4. **Determinism Validation**
   - Seed propagation verification
   - 10 runs with same SDS + seed
   - SHA-256 artifact comparison
   - Reproducibility report (target: ≥99%)

5. **Documentation**
   - Skill contracts and schemas
   - Determinism enforcement patterns
   - Integration guide
   - Troubleshooting runbook

### Success Criteria

- **Execution**: Graph runner executes PLAN → REVIEW without errors
- **Determinism**: ≥99% reproducibility (500 runs of diverse SDSs)
- **Events**: All node events stream to WebSocket + database
- **Artifacts**: All outputs stored with SHA-256 hashes
- **Latency**: P95 execution time ≤60s (Plan → Prompt, excluding render)
- **Quality**: Unit test pass rate 100%, integration tests 100%

---

## Phase Breakdown Overview

This plan is organized into **10 implementation phases**:

### Phase 0: Infrastructure Setup (WP-N1.0)
- Skill template creation
- Contract definitions
- Test harness setup
- Seed propagation framework
- Event emission templates

### Phase 1: PLAN Skill (WP-N1.1)
- Expand SDS into ordered work targets
- Section ordering and goal definition
- Determinism: `seed + 1`
- Tests and validation

### Phase 2: STYLE Skill (WP-N1.2)
- Generate style specification
- Tag sanitization via conflict matrix
- Blueprint tempo/key validation
- Determinism: `seed + 2`
- Tests and validation

### Phase 3: LYRICS Skill (WP-N1.3)
- Generate lyrics with citations
- Pinned retrieval (content hash-based)
- Rhyme scheme enforcement
- Profanity filtering
- Determinism: `seed + 3`
- Tests and validation

### Phase 4: PRODUCER Skill (WP-N1.4)
- Create arrangement and mix guidance
- Structure validation
- Blueprint alignment
- Determinism: `seed + 4`
- Tests and validation

### Phase 5: COMPOSE Skill (WP-N1.5)
- Merge artifacts into render-ready prompt
- Model limit enforcement (3000 chars for Suno)
- Section tag formatting
- Conflict resolution
- Determinism: `seed + 5`
- Tests and validation

### Phase 6: VALIDATE Skill (WP-N1.6)
- Score against blueprint rubric
- Metrics: hook_density, singability, rhyme_tightness, section_completeness
- Pass/fail decision logic
- Issue identification
- Determinism: `seed + 6`
- Tests and validation

### Phase 7: FIX Skill (WP-N1.7)
- Apply targeted improvements
- Auto-fix playbook (low hook → duplicate, weak rhyme → adjust)
- Max 3 iterations
- Determinism: `seed + 7`
- Tests and validation

### Phase 8: REVIEW Skill (WP-N1.8)
- Finalize artifacts with provenance
- Summary JSON generation
- S3 persistence (if enabled)
- Event emission
- Determinism: `seed + 8`
- Tests and validation

### Phase 9: Integration Testing (WP-N1.9)
- Full workflow execution (PLAN → REVIEW)
- Data flow validation
- Event stream verification
- End-to-end determinism tests

### Phase 10: Determinism Validation & Optimization (WP-N1.10)
- Run 50 SDSs × 10 times each
- Reproducibility metrics
- Performance profiling
- Optimization and tuning

---

## Key Features & Requirements

### Determinism Enforcement

**Requirement**: ≥99% reproducibility across 10 replays with same SDS + seed

**Implementation**:
- Each skill receives: `seed + node_index` (e.g., PLAN gets `seed + 1`)
- Fixed decoder settings: `temperature ≤0.3`, `top_p ≤0.9`, `max_tokens` capped
- No date/time-dependent logic (use `created_at` from input, not `now()`)
- No floating-point randomness (use seeded RNG only)
- Pinned retrieval for sources (content hash-based, fixed top-k, lexicographic sort)

**Validation**:
- All artifacts SHA-256 hashed
- Determinism tests run 10 times, compare hashes
- Seed propagation traced and logged

### Event Emission & Observability

**Requirement**: All nodes emit structured events for WebSocket streaming

**Event Schema**:
```json
{
  "ts": "2025-11-14T00:00:00Z",
  "run_id": "uuid",
  "node": "PLAN|STYLE|LYRICS|...",
  "phase": "start|end|fail",
  "duration_ms": 1234,
  "metrics": { /* node-specific */ },
  "issues": [ /* error/warning list */ ]
}
```

**Emission Points**:
- Node START: Before execution begins
- Node END: After successful execution
- Node FAIL: If execution fails
- Metrics updates: During execution for long-running nodes

### Citation Hashing (LYRICS)

**Requirement**: Source chunks identified by content hash for reproducible retrieval

**Implementation**:
- All source chunks hashed: `SHA-256(chunk_text)`
- `citations.json` records: `{chunk_hash, source_id, text, weight}`
- On re-run with same seed, same chunks retrieved by hash
- Fixed top-k per source (no dynamic trimming)
- Lexicographic sort for tie-breaking

### Blueprint Constraint Enforcement

**Requirement**: All generated artifacts respect blueprint rules

**Validation Points**:
- STYLE: Enforce `rules.tempo_bpm` range, required sections
- LYRICS: Enforce `rules.section_lines` min/max per section
- COMPOSE: Enforce model character limits
- VALIDATE: Score against `eval_rubric.weights` and `thresholds`

### Policy Guards

**Requirement**: Enforce profanity, PII, and artist normalization policies

**Guards**:
- Profanity: Filter based on `constraints.explicit` flag
- PII: Redact email, phone, address patterns
- Artist: Convert "style of <living artist>" to generic influence

---

## Detailed Task Breakdown

All phases are detailed in supporting documents:

- **Phase 0 (Infrastructure)**: See `amcs-workflow-skills-v1/01-skill-infrastructure.md`
- **Phases 1-4 (Generation Skills)**: See `amcs-workflow-skills-v1/02-generation-skills.md`
- **Phases 5-7 (Composition & Validation)**: See `amcs-workflow-skills-v1/03-composition-validation.md`
- **Phases 8-10 (Finalization & Integration)**: See `amcs-workflow-skills-v1/04-finalization-integration.md`

Each phase document includes:
- Detailed task list (5-8 tasks per phase)
- Subagent assignments (story writer, task estimator, etc.)
- Dependency tracking
- Acceptance criteria
- Risk mitigation strategies

---

## Subagent Assignments

Based on FULL TRACK orchestration:

### Story Writers (Haiku)
**Responsibility**: Create user stories with acceptance criteria for each skill
- Each skill gets 1 story: "As a composer, I want [skill] to generate [artifact] so that [value]"
- Acceptance criteria based on rubric thresholds and determinism gates
- Effort: 2-4 hours per skill

### Dependency Mappers (Sonnet)
**Responsibility**: Map task sequences and data dependencies
- Create DAG visualization of skill execution
- Identify parallel vs sequential tasks
- Trace data flow (SDS → PLAN → STYLE → LYRICS → etc.)
- Effort: 3-4 hours

### Task Estimators (Haiku)
**Responsibility**: Generate effort estimates in story points
- Estimate per-task effort (planning, coding, testing)
- Account for determinism complexity (±20% adjustment)
- Estimate total effort per skill (5-10 story points typical)
- Effort: 2-3 hours

### Risk Assessors (Sonnet)
**Responsibility**: Identify and mitigate risks
- Determinism risks: Floating-point operations, date/time logic
- Integration risks: Skill interfaces, data format mismatches
- Testing risks: Edge cases, seed propagation bugs
- Effort: 2-3 hours

### Validation Checkers (Haiku)
**Responsibility**: Run quality gates on completed skills
- Determinism: ≥99% reproducibility
- Event emission: All events present and properly formatted
- Contract compliance: Input/output matches specification
- Effort: 1-2 hours per skill

### Architecture Validators (Opus - optional)
**Responsibility**: Validate skill patterns against MeatyMusic architecture
- Confirm skill follows AMCS patterns
- Verify determinism enforcement
- Check event schema compliance
- Effort: 1 hour per skill (on-demand for problematic skills)

**Total Agent Hours**: ~60 hours (2-3 agents for 2-3 weeks = sustainable load)

---

## Acceptance Gates

### Gate 1: Skill Execution
- [ ] All 8 skills execute without errors
- [ ] PLAN → REVIEW workflow completes successfully
- [ ] All artifacts generated and stored
- [ ] Event stream outputs all node events

### Gate 2: Determinism Validation
- [ ] 50 SDSs × 10 runs each (500 total runs)
- [ ] SHA-256 hash comparison confirms ≥99% reproducibility
- [ ] Seed propagation traced and verified
- [ ] No floating-point randomness detected

### Gate 3: Quality Metrics
- [ ] Unit test pass rate: 100%
- [ ] Integration test pass rate: 100%
- [ ] Code coverage: ≥80% for skill logic
- [ ] Documentation: Complete with examples

### Gate 4: Performance
- [ ] P95 latency ≤60s (Plan → Prompt, excluding render)
- [ ] P50 latency ≤30s
- [ ] No memory leaks over 100 workflow executions
- [ ] Event latency <1s (emission to UI)

---

## Success Metrics & Monitoring

### Development Progress Metrics
- Skills completed: 0/8 → 8/8
- Unit tests passing: count and %
- Integration test status: pass/fail
- Determinism reproducibility: % (target ≥99%)

### Workflow Execution Metrics
- Success rate: target ≥98%
- Avg latency: target ≤30s
- P95 latency: target ≤60s
- Event delivery: target <1s

### Quality Metrics
- Test coverage: ≥80% (code)
- Determinism validation: ≥99% (reproducibility)
- Defect rate: <1 bug per 100 lines of skill code
- Documentation completeness: 100%

---

## Risks & Mitigation Strategies

### High-Risk Areas

#### 1. Determinism Achievement
**Risk**: Cannot achieve ≥99% reproducibility due to hidden non-determinism

**Mitigation**:
- Implement seed propagation from day 1
- Use strict decoder settings (temp ≤0.3)
- Audit all random number usage
- Weekly determinism tests with 50+ SDSs
- If <99%, pause and debug before proceeding

**Acceptance Criteria**: ≥99% reproducibility on 500 runs

#### 2. Skill Complexity
**Risk**: Skills more complex than estimated, blowing timeline

**Mitigation**:
- Start with PLAN skill (simplest) to establish patterns
- Allocate 2-3 agents for parallel development
- Create reusable skill templates
- Weekly progress reviews with technical lead

**Acceptance Criteria**: Phase 1 (PLAN) complete within 1 week

#### 3. Data Flow Mismatches
**Risk**: Skills produce incompatible data formats, blocking downstream skills

**Mitigation**:
- Define input/output contracts upfront (Phase 0)
- Create integration tests between pairs of skills early
- Daily sync between developers on adjacent skills
- Pydantic schemas for all data types

**Acceptance Criteria**: Integration tests pass for all skill pairs

#### 4. Citation Hashing (LYRICS Skill)
**Risk**: Pinned retrieval complex to implement, may not achieve determinism

**Mitigation**:
- Mock source retrieval in early tests
- Implement hash-based lookup separately
- Test with small source set first
- Allocate extra time for LYRICS skill (1.5 weeks vs 1 week)

**Acceptance Criteria**: Determinism tests show identical citations across 10 runs

#### 5. Event Streaming
**Risk**: WebSocket events lost or duplicated during workflow

**Mitigation**:
- Event persistence: Store all events in database
- Use event IDs for deduplication
- Test with network interruptions
- Implement replay on reconnect

**Acceptance Criteria**: 100% event delivery (no loss or duplication)

---

## Dependencies & Blockers

### External Dependencies

| Dependency | Status | Impact | Mitigation |
|-----------|--------|--------|-----------|
| Claude Code environment | Ready | HIGH | Documented in CLAUDE.md |
| Orchestration API (graph runner) | Ready | HIGH | Backend complete, ready for skill registration |
| Database schema | Ready | MEDIUM | All tables exist, migrations complete |
| Validation service (WP-N2) | In progress | MEDIUM | Can proceed with mock validation initially |
| Determinism framework | Ready | HIGH | Seed propagation infrastructure exists |

### Internal Dependencies

| Dependency | Provider | Consumer | Risk |
|-----------|----------|----------|------|
| Skill contracts (Phase 0) | Story writer | All phases | LOW - documented upfront |
| PLAN output schema | Phase 1 | Phases 2-4 | MEDIUM - must validate early |
| STYLE output schema | Phase 2 | Phase 5 | MEDIUM - integration tested |
| LYRICS output schema | Phase 3 | Phase 5 | MEDIUM - citation format critical |
| VALIDATE schema | Phase 6 | Phase 7 | MEDIUM - FIX depends on issues list |

---

## Implementation Checklist

### Pre-Implementation
- [ ] All subagents assigned and briefed
- [ ] Claude Code environment verified
- [ ] Phase 0 (infrastructure) planned and reviewed
- [ ] Test fixtures prepared (100+ SDSs for testing)
- [ ] Slack channel created for team coordination

### Week 1 (Phases 1-4)
- [ ] Phase 0 infrastructure complete
- [ ] PLAN skill implemented and determinism tested
- [ ] STYLE skill implemented and determinism tested
- [ ] LYRICS skill (basic) implemented
- [ ] PRODUCER skill implemented
- [ ] Integration tests for skill pairs running

### Week 2 (Phases 5-6, begin 7-8)
- [ ] LYRICS skill refined with citation hashing
- [ ] COMPOSE skill implemented
- [ ] VALIDATE skill implemented and rubric scoring verified
- [ ] All unit tests passing
- [ ] Determinism tests running on 50 SDSs

### Week 3 (Phases 7-9)
- [ ] FIX skill implemented and auto-fix playbook tested
- [ ] REVIEW skill implemented
- [ ] Full workflow integration tests passing
- [ ] Event emission verified
- [ ] Determinism reproducibility ≥99% on 50 SDSs

### Week 4 (Phase 10)
- [ ] Final optimization and performance tuning
- [ ] Extended determinism validation (100+ SDSs)
- [ ] Documentation complete
- [ ] All acceptance gates passed
- [ ] Ready for handoff to WP-N2 and WP-N3

---

## Resource Requirements

### Agents Required

| Role | Count | Allocation | Weeks |
|------|-------|-----------|-------|
| Skill Developer (Haiku stories, implementation) | 2-3 | Full-time | 4 |
| Integration Specialist (dependency mapping, testing) | 1 | Full-time | 2-3 |
| QA Automation (determinism, validation tests) | 1 | Full-time | 3-4 |
| Technical Lead (architecture validation, reviews) | 1 | Part-time (30%) | 4 |

**Total**: 4-6 agents, equivalent to 2-3 FTE for 4 weeks

### Infrastructure Requirements

- **Claude Code Environment**: Already available
- **Database**: PostgreSQL (already running)
- **Test Data**: 100+ diverse SDSs (to be generated)
- **Monitoring**: OpenTelemetry (already configured)
- **CI/CD**: GitHub Actions (already configured)

### Development Tools

- Git repositories and branches
- Claude Code skill templates
- Test fixtures and mocking frameworks
- Determinism validation scripts
- Performance profiling tools

---

## Communication Plan

### Daily
- 15-min async standup (Slack thread)
- Code review notifications
- Determinism test results

### Weekly
- 1-hour sync call (technical team)
- Progress review against phase targets
- Blocker resolution
- Dependency coordination

### Bi-Weekly
- Acceptance gate validation
- Risk assessment update
- Roadmap adjustment if needed

---

## Next Steps

1. **Immediate** (Today):
   - Assign subagents to this work package
   - Schedule Phase 0 planning meeting
   - Prepare test fixtures and SDS samples

2. **This Week**:
   - Complete Phase 0 infrastructure setup
   - Define skill contracts and schemas
   - Begin PLAN skill implementation

3. **Next Week**:
   - PLAN skill complete with determinism validation
   - STYLE and LYRICS skills underway
   - Integration tests framework ready

---

## Document Index

This implementation plan is part of a larger series:

1. **Main Plan** (this file): Executive summary, phases, assignments
2. **Phase 0-4 Details**: `amcs-workflow-skills-v1/01-skill-infrastructure.md`
3. **Phase 5-7 Details**: `amcs-workflow-skills-v1/02-generation-skills.md` (or separate)
4. **Phase 8-10 Details**: `amcs-workflow-skills-v1/03-composition-validation.md` (or separate)

See each phase-specific document for detailed task lists, acceptance criteria, and risk mitigation.

---

## Approval & Sign-Off

**Document Prepared By**: Implementation Planning Orchestrator
**Status**: Ready for Review
**Target Review Date**: 2025-11-14
**Approved By**: [Technical Lead - TBD]

---

**Version History**:
- v1.0 (2025-11-14): Initial comprehensive plan

**Last Updated**: 2025-11-14
**Next Review**: Upon Phase 0 completion
**Maintained By**: Technical Lead

