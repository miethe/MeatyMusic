# Phase 4 Progress: Workflow Orchestration

**Plan**: docs/project_plans/bootstrap-from-meatyprompts.md (Phase 4)
**PRD**: docs/project_plans/PRDs/claude_code_orchestration.prd.md
**Started**: 2025-11-12
**Status**: Not Started
**Completion**: 0%

## Success Criteria

- [ ] Orchestrator implements full workflow graph (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER → REVIEW)
- [ ] All workflow nodes implemented as Claude Code skills
- [ ] Skill input/output contracts validated (JSON schemas)
- [ ] VALIDATE node scores artifacts against blueprint rubric
- [ ] FIX loop iterates ≤3 times with targeted improvements
- [ ] WebSocket events stream correctly (node start/end/fail events)
- [ ] Determinism tests: Same SDS + seed = identical outputs (≥99% reproduction rate)
- [ ] Rubric compliance: ≥95% pass rate on test suite
- [ ] Workflow latency: P95 ≤60s (excluding render connector time)

## Subagent Assignments

### Phase 4.1: Orchestrator Foundation (Backend Infrastructure)
**Assigned to**: `python-backend-engineer`

**Tasks 1-7**:
- Design workflow graph state machine
- Implement `WorkflowOrchestrator` service (`services/api/app/services/workflow_orchestrator.py`)
- Implement `EventPublisher` service (`services/api/app/services/event_publisher.py`)
- Create workflow execution API endpoints (`services/api/app/api/v1/workflows.py`)
- Implement run manifest parser and validator
- Add WebSocket event streaming (`/events` endpoint)
- Database migrations for `node_executions` and `workflow_events` tables

**Key Deliverables**:
- WorkflowOrchestrator with DAG execution (sequential + parallel nodes)
- EventPublisher with WebSocket connection management
- API endpoints: POST /runs, GET /runs/{run_id}, WS /events
- Alembic migration for workflow state tables

**Dependencies**: Phase 3 complete (WorkflowRun model exists)

---

### Phase 4.2: Core Workflow Skills (Skill Implementation)
**Assigned to**: `ai-artifacts-engineer` (primary) + `python-backend-engineer` (runtime)

**Tasks 8-12**:
- PLAN skill: `.claude/skills/workflow/plan/` + `services/api/app/skills/workflow/plan.py`
- STYLE skill: `.claude/skills/workflow/style/` + runtime implementation
- LYRICS skill: `.claude/skills/workflow/lyrics/` + runtime implementation
- PRODUCER skill: `.claude/skills/workflow/producer/` + runtime implementation
- COMPOSE skill: `.claude/skills/workflow/compose/` + runtime implementation

**Key Deliverables**:
- SKILL.md files for agent consumption (contracts, examples, determinism requirements)
- Python async functions implementing skill logic
- `@workflow_skill` decorator for common patterns (validation, seed injection, events)
- Helper scripts (e.g., `sanitize_tags.mjs`, `validate_rhyme.py`)

**Division of Labor**:
- `ai-artifacts-engineer`: SKILL.md files with clear contracts, prompts, examples
- `python-backend-engineer`: Python implementations, decorator framework, integration with services

**Dependencies**: Orchestrator foundation complete (decorator pattern defined)

---

### Phase 4.3: Validation & Fix (Quality Assurance Layer)
**Assigned to**: `python-backend-engineer` (primary) + `ai-artifacts-engineer` (SKILL.md)

**Tasks 13-17**:
- VALIDATE skill: Rubric scoring logic (hook_density, singability, rhyme_tightness, section_completeness, profanity_score)
- FIX skill: Targeted artifact improvements (max 3 iterations)
- Conflict detection using `taxonomies/conflict_matrix.json`
- Policy guards: profanity filter, PII redaction, artist normalization
- Integration with existing `ValidationService`

**Key Deliverables**:
- `validate_skill.py` with rubric scoring algorithms
- `fix_skill.py` with targeted improvement strategies
- Tag conflict matrix validation
- Policy enforcement utilities

**Dependencies**: Core skills complete (need artifacts to validate)

---

### Phase 4.4: Render & Review (External Integration + Finalization)
**Assigned to**: `python-backend-engineer`

**Tasks 18-21**:
- RENDER skill (feature-flagged): Connector interface for external render engines
- REVIEW skill: Final artifact persistence and event emission
- Render connector interface (`services/api/app/connectors/render/base.py`)
- Artifact persistence (S3 or local storage via configuration)

**Key Deliverables**:
- Abstract `RenderConnector` class (future Suno integration)
- RENDER skill with job submission and polling
- REVIEW skill with artifact finalization
- Storage adapter pattern (local filesystem for MVP, S3 for production)

**Dependencies**: Validation complete (need validated artifacts to render)

---

### Phase 4.5: Testing & Validation (Quality Assurance)
**Assigned to**: `debugger` (primary) + `task-completion-validator` (acceptance)

**Tasks 22-27**:
- Determinism validation tests (10 replays, ≥99% identical outputs)
- Rubric compliance tests (synthetic test suite, ≥95% pass rate)
- Performance testing (P95 latency ≤60s)
- Integration test: Full workflow execution end-to-end
- Seed propagation tests (verify node_seed = run_seed + node_index)
- Citation hash pinning tests (verify retrieval determinism)

**Key Deliverables**:
- `tests/integration/test_workflow_determinism.py`
- `tests/integration/test_workflow_e2e.py`
- Performance benchmark suite
- Test data generator (200-song synthetic SDS set)

**Dependencies**: All skills implemented

---

### Phase 4.6: Observability (Monitoring & Debugging)
**Assigned to**: `python-backend-engineer` (backend) + `documentation-writer` (guides)

**Tasks 28-31**:
- Structured event logging (node start/end/fail with OpenTelemetry spans)
- Metrics tracking (duration_ms, scores, issues, throughput)
- WebSocket event streaming validation
- Workflow monitoring dashboard (backend API + frontend integration placeholder)

**Key Deliverables**:
- OpenTelemetry span creation per node execution
- Workflow metrics exposed via Prometheus
- Event stream validation tests
- Monitoring guide for operators

**Dependencies**: Orchestrator complete (need events to observe)

---

### Cross-Cutting Concerns

#### Code Review
**Assigned to**: `code-reviewer` (all phases)
- Review all orchestrator, skill, and API code for architectural compliance
- Validate adherence to layer boundaries (Router → Service → Repository → DB)
- Verify error handling follows `ErrorResponse` pattern
- Check determinism mechanisms (seed propagation, hashing)

#### Documentation
**Assigned to**: `documentation-writer`
- Workflow orchestration user guide
- Skill development guide (for future skill authors)
- API documentation (OpenAPI specs)
- Troubleshooting runbook

**Note**: All human-facing documentation → `documentation-writer` (Haiku 4.5)
**Note**: All agent-facing artifacts (SKILL.md) → `ai-artifacts-engineer` (Sonnet)

#### Task Validation
**Assigned to**: `task-completion-validator`
- Validate acceptance criteria met for each phase
- Run end-to-end validation tests
- Verify success metrics (determinism ≥99%, rubric pass ≥95%, latency ≤60s)
- Sign off on phase completion before proceeding

---

## Development Checklist

### Phase 4.1: Orchestrator Foundation
- [ ] Read claude_code_orchestration.prd.md thoroughly
- [ ] Design workflow graph state machine
- [ ] Implement orchestrator service (backend/src/services/workflow/)
- [ ] Create workflow execution API endpoints (/api/v1/workflows)
- [ ] Implement run manifest parser and validator
- [ ] Add WebSocket event streaming (/events endpoint)
- [ ] Create workflow run database schema (runs table, node_executions table)

### Phase 4.2: Core Workflow Skills
- [ ] Implement PLAN skill (.claude/skills/workflow/plan/)
- [ ] Implement STYLE skill (.claude/skills/workflow/style/)
- [ ] Implement LYRICS skill (.claude/skills/workflow/lyrics/)
- [ ] Implement PRODUCER skill (.claude/skills/workflow/producer/)
- [ ] Implement COMPOSE skill (.claude/skills/workflow/compose/)

### Phase 4.3: Validation & Fix
- [ ] Implement VALIDATE skill (.claude/skills/workflow/validate/)
- [ ] Implement FIX skill (.claude/skills/workflow/fix/)
- [ ] Implement rubric scoring logic (hook_density, singability, rhyme_tightness)
- [ ] Implement conflict detection (tag conflict matrix)
- [ ] Implement policy guards (profanity, PII redaction, artist normalization)

### Phase 4.4: Render & Review
- [ ] Implement RENDER skill (feature-flagged) (.claude/skills/workflow/render/)
- [ ] Implement REVIEW skill (.claude/skills/workflow/review/)
- [ ] Create render connector interface (backend/src/connectors/render/)
- [ ] Add artifact persistence (S3 or local storage)

### Phase 4.5: Testing & Validation
- [ ] Implement determinism validation tests (10 replays, ≥99% identical)
- [ ] Implement rubric compliance tests (200-song synthetic set, ≥95% pass)
- [ ] Performance testing (P95 latency ≤60s)
- [ ] Integration test: Full workflow execution end-to-end
- [ ] Seed propagation tests (node_index + seed)
- [ ] Citation hash pinning tests

### Phase 4.6: Observability
- [ ] Add structured event logging (node start/end/fail)
- [ ] Add metrics tracking (duration_ms, scores, issues)
- [ ] WebSocket event streaming validation
- [ ] Create workflow dashboard UI (frontend)

## Work Log

### [Date] - Task Description
**What**:
**Subagents**:
**Commits**:
**Blockers**:
**Next**:

## Architectural Decisions

### 2025-11-12 - Workflow State Storage Architecture
**Context**: Orchestrator needs to persist workflow runs, node executions, and intermediate artifacts. Must support real-time updates, queries by run_id, and historical audit trails.

**Decision**: Use PostgreSQL for workflow state storage with the following schema:
- `workflow_runs` table (extends existing WorkflowRun model)
- `node_executions` table (stores per-node execution metadata: start_time, end_time, duration_ms, seed, status, input_hash, output_hash)
- Artifacts stored as JSONB in existing entity tables (Style, Lyrics, ProducerNotes, ComposedPrompt)
- Event log stored in `workflow_events` table for audit trail

**Rationale**:
1. PostgreSQL already proven in production with RLS and multi-tenancy
2. JSONB columns provide flexible schema for node outputs
3. Transactional consistency for workflow state transitions
4. Enables complex queries (e.g., "find all failed VALIDATE nodes for genre X")
5. Integrates with existing observability (OpenTelemetry spans reference run_id)

**Alternatives Considered**:
- Redis for state: Fast but ephemeral; loses state on restart; no complex queries
- Hybrid (Redis + Postgres): Added complexity; premature optimization
- Event sourcing: Overkill for MVP; difficult to debug

### 2025-11-12 - Event Streaming Architecture
**Context**: Frontend needs real-time workflow progress updates. Must support multiple concurrent workflows, reconnection, and event replay.

**Decision**: Use FastAPI WebSocket with in-memory pub/sub pattern:
- `EventPublisher` service manages WebSocket connections
- Each workflow run publishes events to shared publisher
- Frontend subscribes with `?run_id=<uuid>` query parameter
- Events stored in DB for replay on reconnection
- Connection manager handles cleanup on disconnect

**Rationale**:
1. FastAPI native WebSocket support (no external dependencies)
2. In-memory pub/sub sufficient for MVP scale (<100 concurrent workflows)
3. DB-backed event log enables replay and historical analysis
4. Aligns with existing infrastructure patterns

**Alternatives Considered**:
- Server-Sent Events (SSE): Simpler but no bidirectional communication
- Redis Pub/Sub: External dependency; overkill for single-instance MVP
- Message queue (RabbitMQ/Kafka): Too heavy for real-time UI updates

### 2025-11-12 - Skill Execution Environment
**Context**: Workflow nodes must execute Claude Code skills with deterministic inputs, seed propagation, and error isolation.

**Decision**: Skills as Python async functions with decorator pattern:
- Each skill is a Python module in `services/api/app/skills/workflow/`
- `@workflow_skill` decorator handles: input validation, seed injection, error handling, event emission, output persistence
- Skills called directly by orchestrator (no subprocess/API boundary)
- Claude Code SKILL.md files remain in `.claude/skills/workflow/` for agent consumption
- Python implementations bridge SKILL.md contracts to runtime execution

**Rationale**:
1. Python execution = type safety, IDE support, debugging
2. Async pattern enables parallel execution (STYLE + LYRICS + PRODUCER)
3. Decorator reduces boilerplate and enforces contracts
4. No subprocess overhead or serialization penalties
5. Skills can import shared utilities (validation_service, blueprint_service)

**Alternatives Considered**:
- Subprocess execution: Isolation but slow; serialization overhead; debugging nightmare
- HTTP API calls: Network latency; requires separate service; complicates local dev
- Direct LLM API calls from skills: Works but ties execution to Claude availability; harder to test

### 2025-11-12 - Determinism Enforcement Mechanisms
**Context**: Must achieve ≥99% reproducibility (same SDS + seed → identical outputs). LLM calls inherently non-deterministic without constraints.

**Decision**: Multi-layered determinism strategy:
1. **Seed Propagation**: `node_seed = run_seed + node_index` (fixed node order)
2. **LLM Parameters**: temperature=0.2, top_p=0.9, fixed max_tokens, seed passed to API
3. **Retrieval Pinning**: Source chunks sorted by content hash; fixed top-k; hashes logged in citations
4. **Blueprint Constraints**: Tempo ranges, tag lexicons, rhyme schemes from fixed genre blueprints
5. **Validation Hashing**: Input/output hashes stored for each node; mismatches flagged in tests

**Rationale**:
1. Low temperature reduces sampling variance (0.2 vs 0.7 = 10x reduction)
2. Seed + deterministic retrieval + constraints = testable reproducibility
3. Content hashing enables replay verification without full byte comparison
4. Allows gradual refinement (start with 90%, tune to 99%)

**Alternatives Considered**:
- Temperature=0: Too rigid; poor quality outputs
- Caching all LLM responses: Breaks iteration; huge storage cost
- Pure rule-based generation: No creativity; defeats purpose of AMCS

### 2025-11-12 - Parallel Execution Strategy
**Context**: STYLE, LYRICS, and PRODUCER nodes have no interdependencies. Sequential execution wastes ~20-30s per workflow.

**Decision**: Use Python asyncio.gather() for parallel execution:
- PLAN runs first (produces dependencies)
- STYLE + LYRICS + PRODUCER execute in parallel (await asyncio.gather())
- COMPOSE waits for all three to complete
- VALIDATE → FIX loop remains sequential
- Each node tracks its own seed (node_index disambiguates)

**Rationale**:
1. 3x speedup for longest path (30s → 10s)
2. asyncio native to FastAPI; no external dependencies
3. Maintains determinism (each node has independent seed)
4. Improves user experience (faster feedback)

**Alternatives Considered**:
- Celery task queue: Overkill; requires Redis; complicates local dev
- Thread pool: Python GIL limits benefits; asyncio better for I/O-bound tasks
- Full DAG scheduler: Future enhancement; not needed for linear graph with one parallel section

## Decisions Log

### [Date] - Decision Title
**Context**:
**Decision**:
**Rationale**:
**Alternatives Considered**:

## Files Changed

### Created
- Path: Description

### Modified
- Path: Changes made

### Deleted
- Path: Reason

## Next Steps

1. Read claude_code_orchestration.prd.md
2. Design workflow graph state machine
3. Implement orchestrator service foundation
