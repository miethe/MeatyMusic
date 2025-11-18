# Skill Contracts Design Notes

**File**: `services/api/app/schemas/skill_contracts.py`
**Created**: 2025-11-18
**Purpose**: Formal Pydantic schemas for AMCS workflow skill execution contracts

## Design Decisions

### 1. Dict[str, Any] vs Typed Artifacts

**Decision**: Use `Dict[str, Any]` for all artifact fields (sds, plan, style, lyrics, etc.)

**Rationale**:
- **Flexibility**: Skill implementations can evolve without breaking contracts
- **Avoid Circular Imports**: Entity schemas in `app/schemas/` reference each other; importing them here would create circular dependencies
- **Separation of Concerns**: These are execution contracts (skill I/O), not entity schemas (data models)
- **Validation at Boundaries**: Entity schemas validate when persisting to DB; skill contracts validate execution flow

**Trade-offs**:
- **Less Type Safety**: IDE won't autocomplete artifact fields
- **Runtime Validation Only**: Type errors caught at runtime, not compile time
- **Mitigation**: Comprehensive field validators ensure required keys exist

**Alternative Considered**: Import entity schemas and use them as field types
- **Rejected**: Circular import risk, tight coupling between execution layer and data layer

### 2. Base Class Hierarchy

**Decision**: Three-level hierarchy: `SkillInput` → `PlanInput`, `SkillOutput` → `PlanOutput`

**Rationale**:
- **Consistency**: Every skill has same base context (WorkflowContext)
- **Observability**: Every skill emits same metadata (status, timing, errors)
- **Extension**: Easy to add global fields (e.g., tracing_id) to all skills

**Structure**:
```python
WorkflowContext  # Shared context for all skills
    ↓
SkillInput  # Base input with context
    ↓
PlanInput, StyleInput, ...  # Skill-specific inputs

SkillOutput  # Base output with status, timing, errors
    ↓
PlanOutput, StyleOutput, ...  # Skill-specific outputs
```

### 3. Validation Strategy

**Decision**: Mix of field validators and model validators

**Field Validators**:
- Required keys in dictionaries (e.g., `sds` must have `genre` and `targetLength`)
- Range checks (e.g., `seed >= 0`, `total_score` 0.0-1.0)
- Format checks (e.g., `artifact_hash` matches SHA-256 pattern)

**Model Validators**:
- Cross-field consistency (e.g., `status="failed"` requires `errors` list)
- Complex business rules (e.g., `truncated=True` requires `truncation_warnings`)

**Benefits**:
- Clear error messages when validation fails
- Fail-fast at skill boundaries
- Self-documenting constraints

### 4. Artifact Hashing

**Decision**: All SkillOutput includes optional `artifact_hash` (SHA-256)

**Rationale**:
- **Provenance**: Track exactly which version of artifact was used downstream
- **Determinism**: Hash mismatch indicates non-deterministic behavior
- **Reproducibility**: Can verify entire workflow produced identical artifacts

**Implementation Note**: Skills should compute hash of primary output artifact (e.g., LYRICS hashes lyrics dict)

### 5. Event Emission

**Decision**: All SkillOutput includes `events` list for structured logs

**Rationale**:
- **Observability**: Centralized event collection across all skills
- **Debugging**: Trace exactly what happened during skill execution
- **Analytics**: Query event stream for performance analysis

**Event Format** (recommended):
```json
{
  "ts": "2025-11-18T10:00:00Z",
  "phase": "start|end|checkpoint",
  "message": "Human-readable description",
  "metadata": {"key": "value"}
}
```

### 6. Error Handling

**Decision**: `status` field with `success|failed|partial`, plus `errors` list

**Rationale**:
- **Granular Status**: Distinguish between complete success, complete failure, and partial success
- **Multiple Errors**: Capture all errors, not just first one
- **Downstream Decisions**: Orchestrator can decide whether to retry, skip, or abort based on status

**Partial Status Use Case**: LYRICS skill generated 3/4 sections successfully

### 7. Metrics Dictionary

**Decision**: Free-form `metrics: Dict[str, float]` on all outputs

**Rationale**:
- **Flexibility**: Each skill tracks different metrics
- **Performance**: Capture token counts, API calls, cache hits, etc.
- **Analytics**: Aggregate metrics across runs for optimization

**Example Metrics**:
- PLAN: `sections_planned`, `target_word_count`
- STYLE: `tags_generated`, `conflicts_resolved`
- LYRICS: `tokens_used`, `api_calls`, `citations_added`
- VALIDATE: `checks_passed`, `checks_failed`

## Schema Organization

### Module Structure
- **Lines 1-65**: Module docstring with workflow overview and examples
- **Lines 67-130**: Base contracts (WorkflowContext, SkillInput, SkillOutput)
- **Lines 132-850**: Skill-specific contracts (8 skills × 2 classes each)
- **Lines 852-882**: Exports

### Naming Convention
- Input schemas: `{SkillName}Input` (e.g., PlanInput)
- Output schemas: `{SkillName}Output` (e.g., PlanOutput)
- All inherit from base classes

## Validation Coverage

Each schema includes:
1. **Field-level**: Type hints, Field(...) with descriptions
2. **Constraint-level**: `ge`, `le`, `min_length`, `pattern` constraints
3. **Semantic-level**: Custom validators for business rules
4. **Cross-field**: Model validators for consistency checks

## Future Extensions

### Considered for Future Versions

1. **Typed Artifacts** (if no circular imports):
   ```python
   from app.schemas.style import StyleSpecification

   class StyleOutput(SkillOutput):
       style: StyleSpecification  # Fully typed
   ```

2. **Tracing Integration**:
   ```python
   class WorkflowContext(BaseModel):
       trace_id: str  # OpenTelemetry trace ID
       span_id: str   # Parent span ID
   ```

3. **Retry Metadata**:
   ```python
   class SkillOutput(BaseModel):
       retry_count: int = 0
       retry_reason: Optional[str] = None
   ```

4. **Cost Tracking**:
   ```python
   class SkillOutput(BaseModel):
       cost_usd: float = 0.0  # API cost in USD
   ```

## Testing Recommendations

### Unit Tests
- Test each schema validates correctly with valid data
- Test validators reject invalid data with clear error messages
- Test model validators enforce cross-field consistency

### Integration Tests
- Test skill implementations produce valid outputs
- Test workflow orchestrator chains skills correctly
- Test error propagation through workflow

### Property Tests
- Test artifact hashes are deterministic (same input → same hash)
- Test metrics are always non-negative
- Test execution_time_ms matches actual timing

## Migration Path

If upgrading from untyped workflow:

1. **Wrap Existing Skills**: Adapt existing skill functions to accept/return contract schemas
2. **Gradual Validation**: Start with loose validation, tighten over time
3. **Backward Compatibility**: Keep old untyped interfaces during migration
4. **Type Coercion**: Use Pydantic's `model_validate()` to coerce dicts to schemas

Example migration:
```python
# Old (untyped)
def plan_skill(sds: dict) -> dict:
    return {"plan": {...}}

# New (typed)
def plan_skill(input: PlanInput) -> PlanOutput:
    return PlanOutput(
        status="success",
        execution_time_ms=450,
        plan={...}
    )
```

## Summary

These skill contracts provide:
- **Type Safety**: Pydantic validation at skill boundaries
- **Observability**: Standardized status, timing, events, errors
- **Provenance**: Artifact hashes for traceability
- **Flexibility**: Dict[str, Any] artifacts allow evolution
- **Documentation**: Comprehensive docstrings and examples

They serve as the formal API between the workflow orchestrator and individual skill implementations, ensuring consistent execution patterns across all 8 AMCS workflow nodes.
