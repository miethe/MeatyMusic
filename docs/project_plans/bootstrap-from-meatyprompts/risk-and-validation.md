# Risk Mitigation & Validation Strategy

**Purpose**: Comprehensive risk assessment, mitigation strategies, testing approach, and success metrics for the MeatyMusic AMCS bootstrap from MeatyPrompts.

---

## Risk Assessment

### Potential Challenges

#### 1. Domain Model Complexity
- **Risk**: AMCS entities more complex than MeatyPrompts
- **Impact**: Medium
- **Mitigation**:
  - Start with minimal entity schemas, expand iteratively
  - JSON schema validation before implementation
  - Incremental migration with parallel validation
- **Validation**:
  - Schema validation passes for all test cases
  - Entity CRUD operations work end-to-end

#### 2. Workflow Orchestration
- **Risk**: Graph execution more complex than CRUD operations
- **Impact**: High
- **Mitigation**:
  - Build incrementally (single node → sequential → parallel → loops)
  - Isolated node tests before integration
  - Feature flags for gradual rollout
- **Validation**:
  - All workflow nodes execute independently
  - Full workflow completes end-to-end
  - Parallel execution works correctly

#### 3. Determinism Requirements
- **Risk**: Seed propagation and reproducibility
- **Impact**: High
- **Mitigation**:
  - Unit tests for determinism with fixed seeds
  - 10-replay test with hash comparison
  - Strict low-temperature settings
- **Validation**:
  - Same SDS + seed → identical outputs (99% reproducibility)
  - Hash verification for all artifacts

#### 4. Real-time Event Streaming
- **Risk**: WebSocket stability and scaling
- **Impact**: Medium
- **Mitigation**:
  - Use proven WebSocket patterns from MeatyPrompts
  - Implement reconnection logic
  - Fallback to polling if WebSocket fails
- **Validation**:
  - WebSocket connections remain stable for 10+ minutes
  - Events arrive in correct order
  - Reconnection works automatically

---

## Testing Strategy

### Migration Validation
```python
# /services/api/tests/test_migration_validation.py

def test_infrastructure_preserved():
    """Verify MeatyPrompts patterns preserved."""
    assert BaseRepository exists
    assert SecurityContext works
    assert OpenTelemetry configured

def test_domain_isolation():
    """Verify no MeatyPrompts domain code."""
    assert no Prompt models
    assert no PromptRepository
    assert only AMCS models exist

def test_determinism():
    """Verify workflow determinism."""
    sds = load_test_sds()
    run1 = execute_workflow(sds, seed=12345)
    run2 = execute_workflow(sds, seed=12345)
    assert run1.outputs == run2.outputs
```

### Unit Tests

#### Models (>90% coverage)
- Model validation (constraints, defaults, relationships)
- Field validators (BPM range, tag format)
- Cascade behaviors (song → lyrics → producer notes)

#### Repositories (>85% coverage)
- CRUD operations with RLS
- Security context filtering
- Transaction rollback on errors
- Multi-tenant data isolation

#### Services (>80% coverage)
- Business logic (tag conflicts, BPM ranges)
- DTO mapping (ORM → DTO transformation)
- Error handling and validation

#### Workflow Skills (>85% coverage)
- Determinism (same input → same output)
- Input validation
- Output schema compliance
- Error handling

### Integration Tests

#### Repository → Service → Schema
- Full data flow from DB to API response
- Transaction boundaries
- Security context propagation
- Error response format

#### Workflow Execution
- Single node execution
- Sequential node execution
- Parallel node execution (STYLE + LYRICS + PRODUCER)
- Fix loop with multiple iterations
- Event stream correctness

#### API Endpoints
- Request validation
- Authentication/authorization
- Error responses
- Cursor pagination

### End-to-End Tests

#### Complete Workflow
```python
def test_complete_workflow():
    """Test SDS → Validated Prompt end-to-end."""
    # Create SDS
    sds = create_test_sds(genre='pop', seed=12345)

    # Execute workflow
    run = await orchestrator.execute_workflow(sds)

    # Verify completion
    assert run.status == 'completed'
    assert 'STYLE' in run.node_outputs
    assert 'LYRICS' in run.node_outputs
    assert 'COMPOSE' in run.node_outputs
    assert run.validation_scores['total'] >= 80
```

#### Multiple Genres
- Test 5 major genres (pop, rock, hip-hop, country, electronic)
- Verify blueprint constraints applied correctly
- Validate genre-specific sections and tags

#### Feature Flags
- render.enabled: true/false
- eval.autofix.enabled: true/false
- policy.release.strict: true/false

#### Failure Scenarios
- Invalid SDS structure
- Missing genre blueprint
- Tag conflict errors
- Validation failure after max iterations
- Network timeout during render

### Performance Tests

#### Latency Targets
- Plan→Prompt: P95 ≤ 60s (excluding render)
- Single node execution: P95 ≤ 10s
- Event publishing: P99 ≤ 100ms

#### Load Tests
- 10 concurrent workflows
- 100 workflow runs per hour
- WebSocket connections: 50 concurrent

---

## Success Metrics

### Time Saved vs Build From Scratch

| Component | From Scratch | Bootstrap | Actual | Savings |
|-----------|-------------|-----------|--------|---------|
| Backend Infrastructure | 4-5 weeks | 1 week | TBD | 75% |
| Database Setup | 2-3 weeks | 3-5 days | TBD | 70% |
| Observability | 2 weeks | 2 days | TBD | 85% |
| Authentication | 1-2 weeks | 2 days | TBD | 85% |
| Frontend Foundation | 3-4 weeks | 1-2 weeks | TBD | 60% |
| Claude Code | 1-2 weeks | 3-5 days | TBD | 70% |
| **Total** | **14-18 weeks** | **6-8 weeks** | **TBD** | **65%** |

### Code Reuse Percentage

| Category | Target | Actual | Notes |
|----------|--------|--------|-------|
| Backend Infrastructure | 95% | TBD | config, db, observability, middleware |
| Base Patterns | 95% | TBD | repositories, security, errors |
| Frontend Infrastructure | 85% | TBD | api client, auth, telemetry, hooks |
| UI Components | 60% | TBD | shared components, layout |
| Claude Code | 70% | TBD | agents, skill patterns |
| **Overall** | **80%** | **TBD** | Weighted average |

### Technical Debt Assessment

#### Inherited Debt (from MeatyPrompts)
- [ ] Review cached repository patterns for AMCS applicability
- [ ] Assess multi-tenancy needs (may be simpler for AMCS)
- [ ] Evaluate authentication requirements (Clerk vs alternatives)

#### New Debt (AMCS-specific)
- [ ] Workflow orchestration complexity
- [ ] Determinism testing infrastructure
- [ ] Tag conflict matrix maintenance
- [ ] Blueprint versioning strategy

#### Mitigation Plan
- Phase 6: Technical debt cleanup (not included in bootstrap)
- Monthly reviews of MeatyPrompts upstream changes
- Quarterly refactoring sprints

---

## Validation Gates

### Infrastructure Gate (End of Phase 2)

```bash
# Backend
cd services/api && uvicorn main:app --reload
curl http://localhost:8000/health  # Should return 200

# Frontend
cd apps/web && pnpm dev
curl http://localhost:3000  # Should return 200

# Observability
# Check logs include trace IDs
# Check spans export to console/OTLP
```

**Pass Criteria**:
- [ ] Backend starts without errors
- [ ] Frontend builds and runs
- [ ] Database migrations succeed
- [ ] Traces appear in console/OTLP
- [ ] Structured logs include trace IDs
- [ ] Redis connection works
- [ ] Health endpoints return 200

### Domain Gate (End of Phase 3)

```python
# Create style via API
response = requests.post('/api/v1/styles', json={
    'name': 'Test Pop Style',
    'genre': 'pop',
    'bpm_min': 120,
    'bpm_max': 130,
    'tags_positive': ['uplifting', 'energetic']
})
assert response.status_code == 201

# Verify in database
style = db.query(Style).first()
assert style.genre == 'pop'
```

**Pass Criteria**:
- [ ] All entity models created
- [ ] All repositories follow base pattern
- [ ] Services enforce business rules
- [ ] JSON schema validation works
- [ ] Migrations apply cleanly
- [ ] Tests pass (>80% coverage)

### Orchestration Gate (End of Phase 4)

```python
# Execute workflow
sds = {
    'song_id': 'uuid',
    'global_seed': 12345,
    'style_id': 'uuid',
    # ... complete SDS
}

run = await orchestrator.execute_workflow('song-id', sds)
assert run.status == 'completed'
assert 'STYLE' in run.node_outputs
assert 'LYRICS' in run.node_outputs
assert 'COMPOSE' in run.node_outputs
```

**Pass Criteria**:
- [ ] All skills created and functional
- [ ] Orchestrator executes complete workflow
- [ ] Events stream to WebSocket clients
- [ ] Validation with fix loop works
- [ ] End-to-end test passes
- [ ] Determinism verified (same seed → same output)

### UI Gate (End of Phase 5)

```typescript
// E2E test
test('complete workflow from UI', async ({ page }) => {
  await page.goto('/songs/new')
  await page.fill('[name="title"]', 'Test Song')
  await page.selectOption('[name="genre"]', 'pop')
  await page.click('button[type="submit"]')

  // Should redirect to workflow page
  await expect(page).toHaveURL(/\/workflows\/.*/)

  // Should see workflow graph
  await expect(page.locator('.workflow-graph')).toBeVisible()

  // Should see completed status
  await expect(page.locator('[data-node="REVIEW"]')).toHaveAttribute('data-status', 'completed')
})
```

**Pass Criteria**:
- [ ] Workflow graph displays correctly
- [ ] Real-time updates work via WebSocket
- [ ] Song creation flow works end-to-end
- [ ] Artifacts display correctly
- [ ] Mobile responsive
- [ ] Accessibility score >90

---

## Next Actions & Decision Points

### Week 1 Gate: Infrastructure Validated
- [ ] Backend starts without errors
- [ ] Frontend builds and runs
- [ ] Observability working
- [ ] Tests pass
- **Decision**: Proceed to Phase 2 or revisit infrastructure

### Week 2 Gate: Database & Services Ready
- [ ] Migrations apply cleanly
- [ ] Health endpoints work
- [ ] Redis connection verified
- **Decision**: Proceed to Phase 3 or fix infrastructure issues

### Week 4 Gate: Domain Models Complete
- [ ] All entity models created
- [ ] Repositories follow patterns
- [ ] Services enforce rules
- [ ] Tests pass >80% coverage
- **Decision**: Proceed to Phase 4 or refine models

### Week 7 Gate: Orchestration Working
- [ ] All skills functional
- [ ] Orchestrator executes workflow
- [ ] Events stream correctly
- [ ] End-to-end test passes
- **Decision**: Proceed to Phase 5 or fix orchestration

### Week 9 Gate: UI Complete
- [ ] Workflow visualizer works
- [ ] Real-time updates work
- [ ] Song creation flow works
- [ ] Accessibility >90
- **Decision**: Launch MVP or iterate

---

## Acceptance Gates (Release Promotion)

### Gate A: Rubric Pass Rate
- **Target**: ≥ 95% on 200-song synthetic test set
- **Test**: Generate 200 diverse SDS inputs, run workflows, measure rubric pass rate
- **Threshold**: 190/200 (95%) must pass validation without manual intervention

### Gate B: Determinism Reproducibility
- **Target**: ≥ 99% identical outputs
- **Test**: Run same SDS + seed 100 times, compare artifact hashes
- **Threshold**: 99/100 (99%) must produce identical artifacts

### Gate C: Security Audit
- **Target**: Zero high-severity violations
- **Test**: MCP allow-list audit, RLS verification, PII handling check
- **Threshold**: Clean audit report

### Gate D: Latency Performance
- **Target**: P95 ≤ 60s (excluding render)
- **Test**: 100 workflow runs, measure Plan→Prompt latency
- **Threshold**: 95/100 (95%) complete within 60 seconds

---

**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
**See Also**:
- [Migration Guide](./migration-guide.md)
- [Phase 4: Workflow Orchestration](./phase-4-workflow-orchestration.md)
