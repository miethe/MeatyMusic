# Architecture Decision Record: AMCS Skill Template Design

**Date**: 2025-11-18
**Status**: Accepted
**Context**: Phase 0, Task 0.1 - Design Skill Template & Directory Structure

## Decision

Create a standardized template structure for all 8 AMCS workflow skills that enforces determinism, clear contracts, event emission, and testability.

## Context

The AMCS system requires 8 workflow skills (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, REVIEW) that must be:

1. **Deterministic**: Same inputs + seed => identical outputs
2. **Observable**: Emit structured events for WebSocket streaming
3. **Testable**: Comprehensive test coverage including determinism validation
4. **Documented**: Clear contracts for AI agents and developers
5. **Consistent**: Follow same patterns across all skills

Without a template, each skill implementation would:
- Vary in structure and quality
- Risk non-determinism violations
- Have inconsistent documentation
- Require manual review to ensure compliance

## Requirements

From the user:

1. Template directory: `.claude/skills/amcs-template/`
2. Files:
   - `SKILL.md`: 8-section documentation template
   - `implementation.py`: Python skeleton with determinism patterns
   - `test_skill.py`: Test suite with 10-run determinism test
   - `examples/`: Sample inputs, outputs, verification guide
   - `README.md`: Usage instructions
3. Design principles:
   - Seed-derived randomness only
   - Temperature ≤ 0.3 for LLM calls
   - No datetime logic
   - Hash all outputs (SHA-256)
   - Event emission at start/end/fail
   - Pydantic validation for all I/O
4. Developer-friendly:
   - Copy-paste-modify workflow <15 minutes
   - Clear TODO comments
   - 10-Point Determinism Checklist

## Design Decisions

### 1. Template Structure

**Decision**: Four core files + examples directory

**Rationale**:
- `SKILL.md`: AI-facing documentation (Claude Code reads this)
- `implementation.py`: Human-facing code skeleton (developers copy this)
- `test_skill.py`: Ensures quality and determinism (pytest runs this)
- `examples/`: Reference data (helps with understanding)
- `README.md`: Guide (onboarding for new developers)

**Alternatives Considered**:
- Single monolithic template file → Rejected: Too hard to navigate
- Separate template per skill → Rejected: Duplication, hard to maintain
- JSON schema only → Rejected: Not enough guidance for implementation

### 2. SKILL.md - 8 Required Sections

**Decision**: Standardize on 8 core sections:

1. Overview
2. When to Use
3. Input Contract
4. Output Contract
5. Determinism Requirements
6. Constraints & Policies
7. Implementation Guidance
8. Examples

**Rationale**:
- **Input/Output Contracts**: Schema references enable validation
- **Determinism Requirements**: Explicit seed, temperature, retrieval specs
- **Implementation Guidance**: Step-by-step reduces ambiguity
- **Examples**: Concrete cases aid understanding
- **Constraints & Policies**: Encode business rules explicitly

**Based On**: Existing skills in `.claude/skills/workflow/{plan,style,validate}/SKILL.md`

### 3. implementation.py - Decorator Pattern

**Decision**: Use `@workflow_skill` decorator for all skills

**Rationale**:
- **Centralized Patterns**: Seed injection, telemetry, error handling in one place
- **Automatic Event Emission**: Start/end/fail events without manual code
- **Hash Computation**: Output hash computed automatically
- **OpenTelemetry**: Spans created automatically for tracing
- **Validation**: Input/output Pydantic validation enforced

**Pattern**:
```python
@workflow_skill(
    name="amcs.{skill}.{action}",
    deterministic=True,
)
async def {function}(inputs: Dict, context: WorkflowContext) -> Dict:
    # Implementation
    pass
```

**Alternatives Considered**:
- Manual event emission → Rejected: Error-prone, inconsistent
- Class-based skills → Rejected: Over-engineered for simple functions
- No decorator → Rejected: Duplicates boilerplate across all skills

### 4. test_skill.py - Determinism as First-Class Citizen

**Decision**: Make determinism testing a parameterized 10-run test

**Pattern**:
```python
@pytest.mark.parametrize("run_number", range(10))
async def test_determinism(sample_input, context, run_number):
    result = await skill_function(sample_input, context)

    if run_number == 0:
        pytest.first_hash = result["_hash"]

    assert result["_hash"] == pytest.first_hash
```

**Rationale**:
- **10 Runs**: High confidence in determinism (not just 2)
- **Parameterized**: Pytest shows all 10 runs separately
- **Hash-Based**: SHA-256 comparison catches any output variation
- **Fail Fast**: First mismatch shows exactly which run broke

**Alternatives Considered**:
- 2-run test → Rejected: Not enough confidence
- Manual hash comparison → Rejected: Easy to forget
- Integration-only testing → Rejected: Too slow, hard to debug

### 5. Examples - Three Files

**Decision**:
- `sample_input.json`: Realistic input with placeholders
- `sample_output.json`: Expected output with all fields
- `determinism_verification.md`: How-to guide with common violations

**Rationale**:
- **JSON Examples**: Copy-paste into tests immediately
- **Verification Guide**: Educates on determinism violations
- **Common Pitfalls**: Prevents repeated mistakes

### 6. README.md - 6-Step Quick Start

**Decision**: Optimize for <15 minute skill creation

**Steps**:
1. Copy template (30s)
2. Find & replace placeholders (2min)
3. Fill in SKILL.md (5min)
4. Implement Python skeleton (5min)
5. Update tests (3min)
6. Verify determinism (2min)

**Total**: ~15 minutes

**Rationale**:
- **Developer Velocity**: Faster than writing from scratch (1-2 hours)
- **Quality Gates**: Template enforces best practices
- **Consistency**: All skills look and work the same

### 7. Determinism Enforcement - 10-Point Checklist

**Decision**: Include checklist at bottom of `implementation.py`

**Checklist**:
1. All random operations use `context.seed`
2. No unseeded random
3. No datetime
4. LLM: temp ≤ 0.3, top_p ≤ 0.9, seed
5. Deterministic retrieval
6. Output hash computed
7. No uncontrolled external APIs
8. JSON uses `sort_keys=True`
9. 10-run test passes
10. Logs include run_id, seed, hash

**Rationale**:
- **Comprehensive**: Covers all common violations
- **Actionable**: Each item is yes/no
- **Embedded**: Visible while coding
- **Test Command Included**: One-liner to verify

## Architectural Patterns Embedded

### Pattern 1: WorkflowContext Injection

Every skill receives:
```python
@dataclass
class WorkflowContext:
    run_id: UUID
    song_id: UUID
    seed: int
    node_index: int
    node_name: str
    event_publisher: Optional[EventPublisher]
    db_session: Optional[Session]
```

**Benefit**: No global state, explicit dependencies, testable

### Pattern 2: Hash-Based Provenance

Every output includes:
```python
output["_hash"] = compute_hash(output)
```

**Benefit**: Determinism validation, version control, audit trail

### Pattern 3: Structured Logging

Every skill logs:
```python
logger.info(
    "{skill}.{action}.{phase}",
    run_id=str(context.run_id),
    seed=context.seed,
    hash=output["_hash"][:16],
)
```

**Benefit**: Observability, debugging, traceability

### Pattern 4: Event-Driven Architecture

Decorator emits:
```python
await event_publisher.publish_event(
    run_id=context.run_id,
    node_name=context.node_name,
    phase="start|end|fail",
    data={...}
)
```

**Benefit**: WebSocket streaming, real-time UI updates, monitoring

## Trade-offs

### Pro: Consistency
All skills follow same patterns, making codebase predictable

### Pro: Quality Gates
Template enforces determinism, testing, documentation

### Pro: Velocity
<15 min to create new skill vs 1-2 hours from scratch

### Con: Learning Curve
Developers must understand template structure first

**Mitigation**: Comprehensive README, examples, existing skills to reference

### Con: Template Maintenance
Changes to template require updating all skills

**Mitigation**: Keep template stable, version it, use deprecation warnings

### Con: Over-Engineering Risk
Template might be too complex for simple skills

**Mitigation**: All sections have clear "TODO" markers, can skip optional parts

## Validation

### Success Criteria (from requirements):

- [x] Template directory exists with all required files
- [x] SKILL.md template has all 8 sections
- [x] implementation.py shows determinism patterns
- [x] test_skill.py includes 10-run determinism test
- [x] README explains copy-modify workflow
- [x] Can create new skill in <15 min using template

### Acceptance Test:

Create a new skill (e.g., "dummy") using the template:

```bash
# Step 1: Copy (30s)
cp -r .claude/skills/amcs-template .claude/skills/workflow/dummy

# Step 2-6: Follow README (14min 30s)
# ...

# Verify
pytest tests/unit/skills/test_dummy.py::test_dummy_determinism_10_runs -v
# Expected: 10 PASSED
```

## Future Considerations

### Version 2: Schema-First Design

Generate skill skeleton from JSON schema:

```bash
./scripts/generate_skill.py --schema schemas/plan.json --output app/skills/plan.py
```

**Benefit**: Even less manual work

**Risk**: Less flexibility for custom logic

### Version 2: Auto-Generated Tests

Generate tests from examples:

```bash
./scripts/generate_tests.py --examples .claude/skills/workflow/plan/examples/
```

**Benefit**: Zero test boilerplate

**Risk**: Generic tests may not catch edge cases

### Version 2: Skill Composition

Allow skills to call other skills:

```python
@workflow_skill(name="amcs.lyrics.generate")
async def generate_lyrics(inputs, context):
    style = await call_skill("amcs.style.generate", {...}, context)
    # ...
```

**Benefit**: Reusability, modularity

**Risk**: Complexity, harder to test in isolation

## References

### Implemented Based On:

- Existing skill structure: `.claude/skills/workflow/{plan,style,validate}/SKILL.md`
- Workflow decorator: `services/api/app/workflows/skill.py`
- Test patterns: `services/api/tests/unit/skills/test_{plan,determinism}.py`
- Skill creator guidance: `.claude/skills/skill-creator/SKILL.md`

### PRDs Referenced:

- `docs/project_plans/PRDs/claude_code_orchestration.prd.md` (Section 3: Skill Contracts)
- `docs/amcs-overview.md` (North Star Principles)

### Key Decisions Informed By:

1. **Determinism First**: From AMCS north star principle #1
2. **Event Emission**: From claude_code_orchestration.prd.md section 4 (API Endpoints)
3. **Hash Provenance**: From claude_code_orchestration.prd.md section 2.3 (Determinism)
4. **Temperature ≤ 0.3**: From claude_code_orchestration.prd.md best practices

## Conclusion

This template provides a robust foundation for implementing all 8 AMCS workflow skills with:

- **Determinism**: Enforced via checklist, tests, patterns
- **Observability**: Automatic event emission and logging
- **Quality**: 10-run determinism tests required
- **Velocity**: <15 min to create new skill
- **Consistency**: All skills follow same structure

The design balances developer productivity with system requirements, making it easy to do the right thing (deterministic, tested, documented) and hard to do the wrong thing (non-deterministic, untested, undocumented).

**Next**: Use this template to implement all 8 workflow skills in Phase 0.
