# Phase 4 Architecture Summary & Subagent Assignments

**Date**: 2025-11-12
**Phase**: Workflow Orchestration
**Status**: Ready for Implementation

---

## Architectural Decisions Overview

### 1. Workflow State Storage: PostgreSQL with JSONB
**Why**: Proven in production, supports complex queries, transactional consistency, integrates with existing RLS and observability.

**Schema Design**:
```sql
-- Extends existing WorkflowRun model
ALTER TABLE workflow_runs ADD COLUMN node_outputs JSONB;

-- New table for per-node execution tracking
CREATE TABLE node_executions (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES workflow_runs(id),
    node_name VARCHAR(50) NOT NULL,
    node_index INT NOT NULL,
    seed BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    input_hash VARCHAR(64),
    output_hash VARCHAR(64),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    error_message TEXT
);

-- New table for audit trail
CREATE TABLE workflow_events (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES workflow_runs(id),
    node_name VARCHAR(50),
    phase VARCHAR(20) NOT NULL, -- start, end, fail
    timestamp TIMESTAMPTZ NOT NULL,
    duration_ms INT,
    metrics JSONB,
    issues JSONB
);
```

**Alternatives Rejected**: Redis (ephemeral), Event sourcing (overkill), Hybrid approach (premature optimization).

---

### 2. Event Streaming: FastAPI WebSocket + In-Memory Pub/Sub
**Why**: Native to FastAPI, sufficient for MVP scale, DB-backed for replay, no external dependencies.

**Implementation Pattern**:
```python
# EventPublisher service
class EventPublisher:
    def __init__(self):
        self.connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, run_id: str):
        await websocket.accept()
        self.connections.append((websocket, run_id))
        # Replay missed events from DB
        await self._replay_events(websocket, run_id)

    async def publish(self, event: WorkflowEvent):
        # Store in DB
        await self.event_repo.create(event)
        # Broadcast to subscribed clients
        for ws, run_id in self.connections:
            if run_id == event.run_id:
                await ws.send_json(event.dict())
```

**Alternatives Rejected**: SSE (no bidirectional), Redis Pub/Sub (external dependency), Kafka/RabbitMQ (too heavy).

---

### 3. Skill Execution: Python Async Functions with Decorator Pattern
**Why**: Type safety, IDE support, debugging, no subprocess overhead, integrates with existing services.

**Architecture**:
```
.claude/skills/workflow/plan/SKILL.md    <- Agent consumption (contracts, examples)
services/api/app/skills/workflow/plan.py <- Runtime execution (Python async)
```

**Decorator Pattern**:
```python
@workflow_skill(
    name="PLAN",
    input_schema=SDS,
    output_schema=PlanOutput,
    deterministic=True
)
async def plan_skill(input_data: dict, seed: int, context: SkillContext) -> dict:
    # Decorator handles:
    # - Input validation against schema
    # - Seed injection (seed + node_index)
    # - Error handling and retry logic
    # - Event emission (start/end/fail)
    # - Output persistence

    # Skill implementation
    sections = determine_sections(input_data["sds"], seed)
    objectives = calculate_objectives(input_data["sds"], sections)

    return {
        "sections": sections,
        "objectives": objectives,
        "node_seeds": {f"{node}": seed + idx for idx, node in enumerate(NODES)}
    }
```

**Alternatives Rejected**: Subprocess (slow, hard to debug), HTTP API (network latency), Direct LLM calls (ties to Claude availability).

---

### 4. Determinism: Multi-Layered Strategy
**Goal**: ≥99% reproducibility (same SDS + seed → identical outputs)

**Enforcement Layers**:
1. **Seed Propagation**: `node_seed = run_seed + node_index` (fixed node order)
2. **LLM Parameters**: `temperature=0.2, top_p=0.9, seed=node_seed`
3. **Retrieval Pinning**: Sort chunks by content hash, fixed top-k, log hashes in citations
4. **Blueprint Constraints**: Fixed tempo ranges, tag lexicons, rhyme schemes
5. **Validation Hashing**: Store input/output hashes per node, flag mismatches in tests

**Testing Approach**:
```python
# Determinism test
def test_workflow_determinism():
    sds = load_test_sds("pop_uplifting.json")
    seed = 42

    results = []
    for i in range(10):
        run = orchestrator.execute_workflow(sds, seed)
        results.append(hash_artifacts(run))

    # All 10 runs must produce identical hashes
    assert len(set(results)) == 1, "Determinism violation detected"
```

**Alternatives Rejected**: Temperature=0 (poor quality), Full caching (breaks iteration), Rule-based only (no creativity).

---

### 5. Parallel Execution: asyncio.gather() for Independent Nodes
**Why**: 3x speedup (30s → 10s), native to FastAPI, maintains determinism.

**Execution Flow**:
```python
async def execute_workflow(sds: dict, seed: int) -> WorkflowRun:
    # Sequential: PLAN
    plan = await execute_node("PLAN", sds, seed + 0)

    # Parallel: STYLE + LYRICS + PRODUCER (independent)
    style, lyrics, producer = await asyncio.gather(
        execute_node("STYLE", plan, seed + 1),
        execute_node("LYRICS", plan, seed + 2),
        execute_node("PRODUCER", plan, seed + 3)
    )

    # Sequential: COMPOSE
    compose = await execute_node("COMPOSE", {
        "style": style, "lyrics": lyrics, "producer": producer
    }, seed + 4)

    # Sequential: VALIDATE → FIX loop (max 3 iterations)
    validated = await validate_with_fixes(compose, seed + 5)

    # Optional: RENDER (feature-flagged)
    if flags.get("render.enabled"):
        await execute_node("RENDER", validated, seed + 6)

    # Sequential: REVIEW
    await execute_node("REVIEW", validated, seed + 7)
```

**Alternatives Rejected**: Celery (overkill), Thread pool (GIL limits), Full DAG scheduler (future enhancement).

---

## Subagent Assignment Summary

### Phase 4.1: Orchestrator Foundation
- **Subagent**: `python-backend-engineer`
- **Tasks**: WorkflowOrchestrator, EventPublisher, API endpoints, WebSocket, migrations
- **Timeline**: 3-5 days

### Phase 4.2: Core Workflow Skills
- **Subagents**: `ai-artifacts-engineer` (SKILL.md) + `python-backend-engineer` (runtime)
- **Tasks**: PLAN, STYLE, LYRICS, PRODUCER, COMPOSE skills + decorator framework
- **Timeline**: 5-7 days

### Phase 4.3: Validation & Fix
- **Subagents**: `python-backend-engineer` (primary) + `ai-artifacts-engineer` (SKILL.md)
- **Tasks**: VALIDATE skill, FIX skill, rubric scoring, policy guards
- **Timeline**: 3-4 days

### Phase 4.4: Render & Review
- **Subagent**: `python-backend-engineer`
- **Tasks**: RENDER skill (connector interface), REVIEW skill, artifact persistence
- **Timeline**: 2-3 days

### Phase 4.5: Testing & Validation
- **Subagents**: `debugger` (primary) + `task-completion-validator` (acceptance)
- **Tasks**: Determinism tests, rubric tests, performance tests, integration tests
- **Timeline**: 3-5 days

### Phase 4.6: Observability
- **Subagents**: `python-backend-engineer` (backend) + `documentation-writer` (guides)
- **Tasks**: OpenTelemetry spans, metrics, event validation, monitoring guide
- **Timeline**: 2-3 days

### Cross-Cutting
- **Code Review**: `code-reviewer` (continuous)
- **Documentation**: `documentation-writer` (user guides, API docs, runbooks)
- **Validation**: `task-completion-validator` (acceptance gates)

---

## Implementation Order

### Week 1: Foundation (Phase 4.1)
1. Create `node_executions` and `workflow_events` tables (migration)
2. Implement `WorkflowOrchestrator` service with DAG execution
3. Implement `EventPublisher` service with WebSocket
4. Create workflow API endpoints (POST /runs, GET /runs/{run_id}, WS /events)
5. Implement `@workflow_skill` decorator framework

**Gate**: Orchestrator can execute mock skills, events stream to WebSocket

### Week 2: Skills (Phase 4.2 + 4.3)
1. Implement PLAN skill (SKILL.md + Python)
2. Implement STYLE skill with tag conflict validation
3. Implement LYRICS skill with citation tracking
4. Implement PRODUCER skill
5. Implement COMPOSE skill with character limit checks
6. Implement VALIDATE skill with rubric scoring
7. Implement FIX skill with targeted improvements

**Gate**: Full workflow executes end-to-end (PLAN → COMPOSE → VALIDATE)

### Week 3: Integration & Testing (Phase 4.4 + 4.5)
1. Implement RENDER skill (connector interface, feature-flagged)
2. Implement REVIEW skill (artifact persistence)
3. Write determinism tests (10 replays, hash comparison)
4. Write rubric compliance tests (synthetic test suite)
5. Performance benchmarking (P95 latency)

**Gate**: Determinism ≥99%, rubric pass ≥95%, latency ≤60s

### Week 4: Observability & Documentation (Phase 4.6)
1. Add OpenTelemetry spans per node execution
2. Expose workflow metrics (Prometheus)
3. Write workflow orchestration user guide
4. Write skill development guide
5. Write troubleshooting runbook

**Gate**: Monitoring dashboard shows real-time workflow progress, documentation complete

---

## Key Interfaces

### WorkflowOrchestrator API
```python
class WorkflowOrchestrator:
    async def execute_workflow(self, song_id: str, sds: dict, seed: int) -> WorkflowRun
    async def retry_node(self, run_id: str, node_name: str) -> NodeExecution
    async def cancel_workflow(self, run_id: str) -> WorkflowRun
```

### Skill Decorator API
```python
@workflow_skill(
    name: str,
    input_schema: Type[BaseModel],
    output_schema: Type[BaseModel],
    deterministic: bool = True
)
async def skill_function(input_data: dict, seed: int, context: SkillContext) -> dict:
    pass
```

### EventPublisher API
```python
class EventPublisher:
    async def connect(self, websocket: WebSocket, run_id: str)
    async def disconnect(self, websocket: WebSocket)
    async def publish(self, event: WorkflowEvent)
```

---

## Success Metrics (Acceptance Gates)

### Functional Requirements
- [ ] Orchestrator executes all 9 workflow nodes in correct order
- [ ] Parallel execution works (STYLE + LYRICS + PRODUCER)
- [ ] FIX loop iterates ≤3 times with targeted improvements
- [ ] WebSocket events stream correctly with reconnection support
- [ ] API endpoints handle errors gracefully (validation, timeouts, cancellation)

### Quality Requirements
- [ ] **Determinism**: ≥99% identical outputs across 10 replays (same SDS + seed)
- [ ] **Rubric Compliance**: ≥95% pass rate on 200-song synthetic test suite
- [ ] **Performance**: P95 workflow latency ≤60s (PLAN → REVIEW, excluding RENDER)

### Observability Requirements
- [ ] OpenTelemetry spans created for each node execution
- [ ] Workflow metrics exposed (duration, success rate, error rate)
- [ ] Event log stored in DB for audit trail
- [ ] Monitoring guide enables operators to debug issues

---

## Risk Mitigation

### High Risk: Determinism < 99%
**Mitigation**:
- Start with temperature=0.3, tune down if needed
- Log all LLM parameters and responses for debugging
- Implement content hash validation in tests
- Use fixed blueprints (no dynamic retrieval in MVP)

### Medium Risk: Performance > 60s
**Mitigation**:
- Optimize parallel execution (ensure no sequential bottlenecks)
- Profile skill execution times (identify slowest nodes)
- Consider caching blueprint data in memory
- Add timeout configurations per node

### Low Risk: WebSocket Disconnections
**Mitigation**:
- Implement event replay from DB on reconnection
- Add heartbeat/ping mechanism
- Handle connection cleanup gracefully
- Store events even if no clients connected

---

## Next Steps

1. **Phase 4.1**: `python-backend-engineer` implements orchestrator foundation
2. **Phase 4.2**: `ai-artifacts-engineer` creates SKILL.md contracts, `python-backend-engineer` implements runtime
3. **Phase 4.3**: Skills integration and validation layer
4. **Phase 4.5**: `debugger` runs determinism and compliance tests
5. **Phase 4.6**: `documentation-writer` creates user guides

**Estimated Completion**: 15-20 days (3-4 weeks)

**Primary Reference**: `.claude/progress/phase-4-workflow-orchestration-progress.md`
