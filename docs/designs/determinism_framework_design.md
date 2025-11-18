# Determinism Framework Design

**Date**: 2025-11-18
**Status**: Implemented
**Phase**: 0.3 - Foundation
**Author**: Claude Code

## Overview

The determinism framework provides utilities and enforcement mechanisms to ensure that all AMCS workflow skills produce identical outputs when given identical inputs and seeds. This is critical for achieving the ≥99% reproducibility target across 10 runs.

## Design Goals

1. **Reproducibility**: Guarantee ≥99% identical outputs across multiple runs with same input + seed
2. **Ease of Use**: Simple, intuitive API that developers can adopt without extensive training
3. **Early Detection**: Catch non-deterministic patterns during development, not production
4. **Minimal Overhead**: Low performance impact for determinism checks
5. **Composability**: Utilities work together seamlessly in workflow skills

## Implementation Components

### 1. SeededRandom Class

**Purpose**: Provide deterministic random number generation for all randomness in workflow skills.

**Design Rationale**:
- Wraps Python's `random.Random` with a fixed seed
- Exposes common random operations (randint, choice, shuffle, sample, etc.)
- Prevents accidental use of unseeded global `random` module
- Stores seed as read-only property for debugging

**Key Methods**:
- `randint(a, b)`: Integer in range [a, b]
- `choice(seq)`: Random element from sequence
- `choices(population, weights, k)`: Multiple choices with optional weights
- `shuffle(seq)`: In-place deterministic shuffle
- `sample(population, k)`: Unique random elements without replacement
- `random()`: Float in [0.0, 1.0)
- `uniform(a, b)`: Float in [a, b]
- `gauss(mu, sigma)`: Gaussian distribution sampling

**Usage Example**:
```python
seed = get_node_seed(base_seed=42, node_index=3)
rng = SeededRandom(seed)
choice = rng.choice(["option1", "option2", "option3"])
```

**Trade-offs**:
- ✅ Pros: Simple API, complete control over randomness, easy to test
- ⚠️ Cons: Developers must remember to use SeededRandom instead of random module
- 📝 Mitigation: @determinism_safe decorator + linting rules can catch violations

### 2. Seed Derivation (get_node_seed)

**Purpose**: Derive independent but deterministic seeds for each workflow node.

**Design Rationale**:
- Each of the 8 AMCS nodes needs independent randomness
- Simple arithmetic derivation: `node_seed = base_seed + node_index`
- Node indices: PLAN=1, STYLE=2, LYRICS=3, PRODUCER=4, COMPOSE=5, VALIDATE=6, FIX=7, RENDER=8, REVIEW=9
- Validates inputs to prevent accidental bugs

**Algorithm**:
```
node_seed = base_seed + node_index

Where:
- base_seed ≥ 0 (from WorkflowContext)
- node_index ≥ 1 (1=PLAN, 2=STYLE, ..., 9=REVIEW)
- Result: node_seed is unique per node but deterministic
```

**Why Simple Addition?**:
- **Simplicity**: Easy to understand and debug
- **Determinism**: Perfect reproducibility
- **Independence**: Different nodes get different seeds
- **No Collisions**: Sequential addition guarantees uniqueness within a run
- **Reversibility**: Can compute original base_seed if needed

**Alternatives Considered**:
1. **Hash-based**: `hash(f"{base_seed}:{node_index}")`
   - ❌ More complex, harder to debug
   - ❌ Hash functions might vary across Python versions
2. **Multiply by prime**: `base_seed + node_index * 997`
   - ❌ Unnecessary complexity for 9 nodes
3. **XOR**: `base_seed ^ (node_index << 16)`
   - ❌ Less intuitive, no real benefit

**Conclusion**: Simple addition is sufficient, deterministic, and debuggable.

### 3. Artifact Hashing (hash_artifact)

**Purpose**: Compute SHA-256 hashes of artifacts for provenance tracking and reproducibility verification.

**Design Rationale**:
- SHA-256 is cryptographically secure and widely supported
- Handles dicts, strings, and bytes uniformly
- Sorts dict keys for deterministic JSON serialization
- Returns hash with "sha256:" prefix for format identification

**Key Features**:
- **Dict Handling**: `json.dumps(artifact, sort_keys=True, ensure_ascii=False)`
  - `sort_keys=True`: Ensures key order doesn't affect hash
  - `ensure_ascii=False`: Supports Unicode characters
- **String/Bytes**: Direct UTF-8 encoding and hashing
- **Prefix**: "sha256:" makes hash format explicit

**Usage Example**:
```python
artifact = {"lines": ["line1", "line2"], "metadata": {"author": "system"}}
artifact_hash = hash_artifact(artifact)
# Returns: "sha256:abc123..."
```

**Why SHA-256?**:
- ✅ Standard cryptographic hash (FIPS 140-2 approved)
- ✅ Collision-resistant (2^256 space)
- ✅ Fast enough for typical artifact sizes
- ✅ Available in Python standard library

**Alternatives Considered**:
1. **MD5**: ❌ Cryptographically broken, not suitable for provenance
2. **SHA-1**: ❌ Also considered weak
3. **BLAKE2**: ⚠️ Faster but less widely recognized
4. **SHA-512**: ⚠️ Larger hashes with minimal security benefit

**Conclusion**: SHA-256 provides the best balance of security, performance, and compatibility.

### 4. Decoder Settings (DecoderSettings)

**Purpose**: Validate and enforce LLM parameter constraints for determinism.

**Design Rationale**:
- LLM calls are a major source of non-determinism
- Temperature ≤ 0.3 recommended for high reproducibility
- Validation catches mistakes before API calls
- Warning system for borderline settings

**Parameters**:
- `temperature`: 0.0-1.0 (default 0.3, warns if > 0.3)
- `top_p`: 0.0-1.0 (default 0.9)
- `max_tokens`: Optional positive integer
- `seed`: Optional non-negative integer (highly recommended)

**Validation Logic**:
```python
if temperature > 0.3:
    warnings.warn("temperature > 0.3 may reduce determinism")
```

**Why Temperature ≤ 0.3?**:
- Research shows temperature ≤ 0.3 significantly reduces output variance
- Many LLM providers recommend low temperature for reproducible tasks
- Still allows some creativity without sacrificing determinism
- Based on empirical testing and industry best practices

**Usage Example**:
```python
settings = DecoderSettings(temperature=0.2, top_p=0.9, seed=42)
llm_response = call_llm(**settings.to_dict(), prompt=prompt)
```

### 5. @determinism_safe Decorator

**Purpose**: Detect common non-deterministic patterns during development.

**Design Rationale**:
- Monkey-patches `datetime.now()` and `datetime.utcnow()` during function execution
- Emits warnings when violations detected
- Minimal runtime overhead
- Helps developers catch issues early

**Detection Approach**:
```python
# Before function execution:
original_now = datetime.now
datetime.now = violation_detector

try:
    result = func(*args, **kwargs)
finally:
    datetime.now = original_now  # Always restore
```

**What It Detects**:
- ✅ `datetime.now()` calls
- ✅ `datetime.utcnow()` calls
- ⚠️ Does not detect: unseeded random, async non-determinism, floating-point issues

**Why Not More Comprehensive?**:
- **Performance**: Extensive runtime checks would slow down execution
- **Complexity**: Detecting all non-determinism is essentially impossible
- **Pragmatism**: Catches the most common issues (80/20 rule)
- **Developer Education**: Encourages awareness and testing

**Usage Example**:
```python
@determinism_safe
def lyrics_skill(input: SkillInput) -> SkillOutput:
    # Implementation
    # Will warn if datetime.now() is called
    pass
```

**Trade-offs**:
- ✅ Pros: Catches common mistakes, minimal overhead, easy to use
- ⚠️ Cons: Not exhaustive, can be bypassed, runtime detection only
- 📝 Mitigation: Supplement with determinism tests and code review

### 6. 10-Point Checklist

**Purpose**: Provide developers with a comprehensive checklist for deterministic implementations.

**Content Categories**:
1. **Setup**: Seed propagation and derivation
2. **Random Operations**: Use SeededRandom
3. **LLM Calls**: Proper temperature and seed
4. **Time Dependencies**: No datetime.now()
5. **Data Ordering**: Deterministic database queries
6. **Iteration**: Sorted dict iteration
7. **Math**: Avoid non-deterministic float operations
8. **Provenance**: Hash all outputs
9. **Testing**: 10-run reproducibility tests

**Design Rationale**:
- Checklist-driven development ensures consistency
- Can be used in code reviews
- Serves as training material
- Can evolve as we discover new patterns

## Testing Strategy

### Unit Tests (test_determinism.py)

Comprehensive tests covering:

1. **SeededRandom Tests** (12 tests)
   - Initialization validation
   - Deterministic behavior for all methods
   - 10-run reproducibility

2. **get_node_seed Tests** (8 tests)
   - Valid derivation
   - Input validation
   - Deterministic consistency

3. **hash_artifact Tests** (11 tests)
   - Dict/string/bytes handling
   - Key order independence
   - Unicode support
   - 10-run consistency

4. **DecoderSettings Tests** (14 tests)
   - Parameter validation
   - Warning system
   - Dictionary conversion

5. **@determinism_safe Tests** (8 tests)
   - Violation detection
   - Function metadata preservation
   - Exception handling

6. **Integration Tests** (6 tests)
   - Complete workflow simulation
   - Cross-component interaction
   - Reproducibility verification

**Total Test Coverage**: 59 comprehensive tests

### Test Validation Approach

Each test verifies:
- ✅ **Correctness**: Function produces expected output
- ✅ **Determinism**: Same input → same output
- ✅ **Error Handling**: Invalid inputs raise appropriate exceptions
- ✅ **Reproducibility**: 10-run tests achieve 100% consistency

### Integration Test Pattern

```python
def test_complete_workflow_deterministic():
    """Simulate a complete skill execution."""
    def simulate_skill(base_seed, node_index):
        seed = get_node_seed(base_seed, node_index)
        rng = SeededRandom(seed)
        artifact = {"result": rng.randint(1, 100)}
        return hash_artifact(artifact)

    # Run 10 times
    results = [simulate_skill(42, 3) for _ in range(10)]

    # Verify 100% reproducibility
    assert len(set(results)) == 1
```

## Usage Guidelines

### For Workflow Skill Developers

1. **Always Start With Seed Derivation**:
   ```python
   seed = get_node_seed(input.context.seed, node_index=3)
   ```

2. **Use SeededRandom for All Randomness**:
   ```python
   rng = SeededRandom(seed)
   choice = rng.choice(options)
   ```

3. **Configure LLM Calls Properly**:
   ```python
   settings = DecoderSettings(temperature=0.2, seed=seed)
   response = llm_call(**settings.to_dict(), prompt=prompt)
   ```

4. **Hash All Outputs**:
   ```python
   artifact = build_lyrics(...)
   artifact_hash = hash_artifact(artifact)
   ```

5. **Use @determinism_safe Decorator**:
   ```python
   @determinism_safe
   def my_skill(input: SkillInput) -> SkillOutput:
       ...
   ```

6. **Test Determinism**:
   ```python
   def test_my_skill_determinism():
       results = [my_skill(input) for _ in range(10)]
       hashes = [r.artifact_hash for r in results]
       assert len(set(hashes)) == 1
   ```

### Common Pitfalls to Avoid

1. **Using Global random Module**:
   ```python
   # ❌ BAD
   import random
   choice = random.choice(options)

   # ✅ GOOD
   from app.core.determinism import SeededRandom
   rng = SeededRandom(seed)
   choice = rng.choice(options)
   ```

2. **Using Current Time**:
   ```python
   # ❌ BAD
   timestamp = datetime.now().isoformat()

   # ✅ GOOD
   timestamp = input.context.run_timestamp.isoformat()
   ```

3. **Unordered Database Queries**:
   ```python
   # ❌ BAD
   results = session.query(Model).all()

   # ✅ GOOD
   results = session.query(Model).order_by(Model.id).all()
   ```

4. **Dict Iteration Without Sorting**:
   ```python
   # ❌ BAD (dict iteration order might vary)
   for key in my_dict:
       process(key, my_dict[key])

   # ✅ GOOD
   for key in sorted(my_dict.keys()):
       process(key, my_dict[key])
   ```

5. **High Temperature LLM Calls**:
   ```python
   # ⚠️ RISKY (low determinism)
   response = llm_call(temperature=0.9, prompt=prompt)

   # ✅ GOOD
   settings = DecoderSettings(temperature=0.2, seed=seed)
   response = llm_call(**settings.to_dict(), prompt=prompt)
   ```

## Performance Considerations

### Runtime Overhead

- **SeededRandom**: Negligible (thin wrapper around random.Random)
- **get_node_seed**: O(1) arithmetic operation
- **hash_artifact**: O(n) where n = artifact size (SHA-256 hashing)
- **DecoderSettings**: One-time validation, negligible
- **@determinism_safe**: Small overhead from monkey-patching (acceptable for dev/test)

### Optimization Opportunities

1. **Lazy Hashing**: Only hash when provenance required
2. **Caching**: Cache hashes for immutable artifacts
3. **Disable Decorator in Production**: Remove @determinism_safe for prod builds

### Benchmarks (Estimated)

- Hash 1KB artifact: ~0.1ms
- SeededRandom.randint: ~0.001ms
- get_node_seed: ~0.0001ms

**Conclusion**: Performance impact is negligible for typical workflow operations.

## Future Enhancements

### Potential Additions

1. **Stricter Linting Rules**:
   - Custom ruff/pylint rules to detect unseeded random usage
   - Enforce @determinism_safe decorator on all skills

2. **Determinism Metrics**:
   - Track reproducibility rates in production
   - Alert on degradation below 99%

3. **Extended @determinism_safe**:
   - Detect unseeded random module usage
   - Check for floating-point non-determinism
   - Monitor async/await patterns

4. **Seed Management UI**:
   - Visualize seed derivation tree
   - Debug reproducibility issues

5. **Determinism Testing Framework**:
   - Automated 10-run tests for all skills
   - Parallel execution for faster validation
   - Regression detection

### Non-Goals

- **Perfect Determinism**: 100% is theoretically impossible due to hardware/OS variations
- **Runtime Enforcement**: Strict blocking of non-deterministic operations (too expensive)
- **External Service Determinism**: Cannot control third-party API behavior

## Acceptance Criteria

- [x] SeededRandom class implemented with all required methods
- [x] get_node_seed function with validation
- [x] hash_artifact function supporting dict/str/bytes
- [x] DecoderSettings class with temperature validation
- [x] @determinism_safe decorator detecting datetime violations
- [x] 10-point checklist constant
- [x] Comprehensive module docstring
- [x] 59 unit tests covering all functionality
- [x] Type hints throughout
- [x] All tests verify ≥99% reproducibility (achieve 100%)

## Conclusion

This determinism framework provides a robust foundation for ensuring reproducibility across all AMCS workflow skills. By combining:
- **Seeded randomness** (SeededRandom)
- **Deterministic seed derivation** (get_node_seed)
- **Artifact provenance** (hash_artifact)
- **LLM parameter validation** (DecoderSettings)
- **Development-time checks** (@determinism_safe)
- **Developer guidelines** (10-point checklist)

We achieve a practical, usable system that meets the ≥99% reproducibility target while maintaining developer productivity.

The framework is designed to be:
- **Simple**: Easy to understand and use
- **Reliable**: Thoroughly tested with 59 unit tests
- **Performant**: Negligible overhead
- **Extensible**: Can be enhanced as needed

This implementation provides the foundation for Phase 1 (skill development) and beyond.

---

**Next Steps**:
1. Import determinism utilities in workflow skill templates
2. Create skill base classes that enforce determinism patterns
3. Add determinism verification to CI/CD pipeline
4. Document best practices in developer onboarding

**Related Documents**:
- `/home/user/MeatyMusic/docs/amcs-overview.md` - System overview
- `/home/user/MeatyMusic/docs/project_plans/PRDs/claude_code_orchestration.prd.md` - Workflow orchestration
- `/home/user/MeatyMusic/services/api/app/core/determinism.py` - Implementation
- `/home/user/MeatyMusic/services/api/tests/unit/core/test_determinism.py` - Tests
