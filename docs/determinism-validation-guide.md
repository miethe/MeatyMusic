# Determinism Validation Guide

## Overview

Determinism validation ensures that the MeatyMusic AMCS system produces identical outputs when given identical inputs and seeds. This is critical for:

- **Reproducibility** - Same SDS + seed = same artifacts every time
- **Debugging** - Reproduce bugs with exact inputs
- **Testing** - Verify behavior across workflow retries
- **Auditing** - Trace decision history with full provenance
- **Confidence** - Users can share seeds to get consistent results

The determinism validation framework provides comprehensive testing infrastructure to verify and measure reproducibility across all workflow nodes.

## Core Principles

### 1. Global Seed

All randomness uses a global seed set at workflow start:

```python
# Workflow initialization
seed = generate_seed()  # e.g., "seed-20250101-abc123"

# Every node derives its seed from the global seed
node_seed = f"{seed}+{node_index}"

# All LLM calls use the same seed
response = llm.generate(
    prompt=prompt,
    seed=node_seed,
    temperature=0.3,  # Low temperature for consistency
    top_p=0.9
)
```

### 2. Pinned Retrieval

Source chunks are retrieved using hashed pinning:

```python
# When retrieving sources, use fixed top-k + hash pinning
sources = retriever.retrieve(
    query=query,
    top_k=5,  # Fixed count
    pin_hashes=[
        "sha256:abc123...",  # Specific sources only
        "sha256:def456..."
    ]
)

# Record the hashes for provenance
citation = {
    "source_hash": "sha256:abc123...",
    "position": 0,
    "text": "...",
    "model": "retriever-v1"
}
```

### 3. Low-Variance Decoder Settings

LLM decoders use low-variance settings:

```python
config = {
    "temperature": 0.3,      # Deterministic enough
    "top_p": 0.9,           # Not too restrictive
    "top_k": 50,            # Fixed
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
    "seed": node_seed       # Critical!
}
```

### 4. Deterministic Sorting

All collections that iterate over unordered data use consistent sorting:

```python
# Good - deterministic
tags = sorted(style.tags)  # Alphabetical order
artists = sorted(artists, key=lambda a: a.name)

# Bad - non-deterministic
tags = style.tags  # May vary in order
artists = random.shuffle(artists)
```

### 5. Fixed Hash Values

All hashes use SHA256 with deterministic input:

```python
import hashlib

def hash_text(text: str) -> str:
    """Generate consistent hash for text."""
    return hashlib.sha256(text.encode()).hexdigest()

# Same text always produces same hash
hash1 = hash_text("Same lyrics")
hash2 = hash_text("Same lyrics")
assert hash1 == hash2  # Always passes
```

## Test Infrastructure

### Test Structure

```
/tests/determinism/
├── test_service_determinism.py        # Unit-level determinism
├── extended_reproducibility_test.py   # Multi-run reproducibility
└── fixtures/
    ├── sds_fixtures.py                # Test SDS data
    └── expected_outputs.py            # Known-good outputs
```

### Test Fixtures

SDS fixtures are stored with reproducible structure:

```python
# /tests/determinism/fixtures/sds_fixtures.py

FIXTURE_POP_SONG = {
    "title": "Summer Love",
    "genre": "pop",
    "bpm": 120,
    "key": "C major",
    "style_tags": ["upbeat", "catchy", "melodic"],
    "explicit_content": False,
    "public_release": True,
    "sections": [
        {"type": "verse", "bars": 8},
        {"type": "chorus", "bars": 8},
        {"type": "bridge", "bars": 4}
    ],
    "style_constraints": {
        "min_hooks": 2,
        "max_tags": 5
    }
}

FIXTURE_COUNTRY_SONG = {
    "title": "Small Town Roads",
    "genre": "country",
    "bpm": 90,
    "key": "G major",
    "style_tags": ["storytelling", "acoustic", "nostalgic"],
    "explicit_content": False,
    "public_release": True,
    "sections": [
        {"type": "verse", "bars": 8},
        {"type": "chorus", "bars": 8}
    ]
}
```

## Running Tests

### Unit Determinism Test

Tests that a single service call is deterministic:

```bash
# Run determinism tests
cd /home/user/MeatyMusic/services/api
pytest tests/determinism/test_service_determinism.py -v

# Output:
# test_validation_service_determinism PASSED
# test_rubric_scorer_determinism PASSED
# test_conflict_detector_determinism PASSED
# test_profanity_filter_determinism PASSED
# test_pii_detector_determinism PASSED
```

### Extended Reproducibility Test

Tests that multiple runs produce identical outputs:

```bash
# Run extended reproducibility
pytest tests/determinism/extended_reproducibility_test.py -v --runs=10

# Output:
# test_style_generation_reproducibility (run 1/10) PASSED
# test_style_generation_reproducibility (run 2/10) PASSED
# ...
# test_style_generation_reproducibility (run 10/10) PASSED
# All runs produced identical output (hash: sha256:abc123...)
```

### Acceptance Test

Tests full workflow reproducibility:

```bash
# Run acceptance determinism test
pytest tests/acceptance/test_determinism.py -v

# Output:
# test_full_workflow_reproducibility PASSED
# Run 1 hash: sha256:abc123...
# Run 2 hash: sha256:abc123...
# Run 3 hash: sha256:abc123...
# Reproducibility: 3/3 (100%)
```

## Writing Determinism Tests

### Pattern 1: Unit Test

Test that a service method is deterministic:

```python
import pytest
from app.services.validation_service import ValidationService

def test_validation_service_determinism():
    """Validate that ValidationService is deterministic."""

    # Create service
    service1 = ValidationService()
    service2 = ValidationService()

    # Test data
    tags = ["upbeat", "catchy", "melodic"]

    # Run twice
    is_valid_1, cleaned_1, report_1 = service1.validate_tags_for_conflicts(tags)
    is_valid_2, cleaned_2, report_2 = service2.validate_tags_for_conflicts(tags)

    # Verify identical results
    assert is_valid_1 == is_valid_2
    assert cleaned_1 == cleaned_2
    assert report_1 == report_2
```

### Pattern 2: Multi-Run Test

Test that multiple runs produce identical output:

```python
import hashlib

def test_lyrics_generation_reproducibility():
    """Test that lyrics generation is reproducible."""

    # Test parameters
    sds = FIXTURE_POP_SONG
    seed = "test-seed-123"
    runs = 5

    outputs = []
    hashes = []

    # Run multiple times
    for i in range(runs):
        lyrics = generate_lyrics(sds, seed)
        output_hash = hashlib.sha256(
            str(lyrics).encode()
        ).hexdigest()

        outputs.append(lyrics)
        hashes.append(output_hash)

    # Verify all identical
    for i in range(1, runs):
        assert outputs[i] == outputs[0], f"Run {i} differs from run 0"
        assert hashes[i] == hashes[0], f"Hash differs in run {i}"

    print(f"Reproducibility: {runs}/{runs} (100%)")
    print(f"Output hash: {hashes[0]}")
```

### Pattern 3: Seed Sensitivity Test

Test that different seeds produce different outputs:

```python
def test_seed_sensitivity():
    """Test that different seeds produce different outputs."""

    sds = FIXTURE_POP_SONG

    # Generate with different seeds
    output_seed1 = generate_lyrics(sds, seed="seed-1")
    output_seed2 = generate_lyrics(sds, seed="seed-2")
    output_seed3 = generate_lyrics(sds, seed="seed-1")  # Same as seed-1

    # Different seeds should produce different output
    assert output_seed1 != output_seed2

    # Same seed should produce same output
    assert output_seed1 == output_seed3
```

## Seed Propagation

### Workflow Level

```python
# /services/api/app/workflows/orchestrator.py

async def run_workflow(sds: Dict, workflow_id: str):
    """Run workflow with deterministic seed."""

    # Generate global seed at workflow start
    global_seed = f"workflow-{workflow_id}-{hash(sds)}"

    # Create state with seed
    state = WorkflowState(
        sds=sds,
        global_seed=global_seed,
        run_id=workflow_id
    )

    # Run each node with derived seed
    state = await run_node(state, "PLAN", index=0)
    state = await run_node(state, "STYLE", index=1)
    state = await run_node(state, "LYRICS", index=2)
    state = await run_node(state, "PRODUCER", index=3)
    state = await run_node(state, "COMPOSE", index=4)
    state = await run_node(state, "VALIDATE", index=5)

    return state
```

### Node Level

```python
# /services/api/app/skills/style.py

async def style_node(state: WorkflowState):
    """Generate style with deterministic seed."""

    # Derive node seed
    node_index = 1
    node_seed = f"{state.global_seed}+{node_index}"

    # Call LLM with seed
    style = llm.call(
        prompt=build_prompt(state.sds),
        model="claude-opus",
        seed=node_seed,
        temperature=0.3,
        top_p=0.9
    )

    # Record seed in state for audit
    state.node_execution.append({
        "node": "STYLE",
        "seed": node_seed,
        "timestamp": now(),
        "model": "claude-opus"
    })

    return style
```

### Service Level

```python
# /services/api/app/services/rubric_scorer.py

def score_artifacts(
    self,
    lyrics: Dict,
    style: Dict,
    producer_notes: Dict,
    genre: str,
    explicit_allowed: bool,
    seed: str = None  # Accept explicit seed
):
    """Score artifacts with optional seed."""

    # All metric calculations use same seed
    hook_score, _, _ = self.calculate_hook_density(lyrics, seed)
    singability, _, _ = self.calculate_singability(lyrics, seed)
    # ... etc

    # Deterministic weight selection
    weights = self._get_weights(genre)  # Same weights every time

    # Calculate composite score
    total = (
        hook_score * weights["hook_density"] +
        singability * weights["singability"] +
        # ... etc
    )

    return ScoreReport(...)
```

## Decoder Settings

### Required Settings

```python
# LLM generation configuration
LLM_CONFIG = {
    "temperature": 0.3,              # Low for consistency
    "top_p": 0.9,                    # Reasonable nucleus
    "frequency_penalty": 0.0,        # No penalty
    "presence_penalty": 0.0,         # No penalty
    "top_k": 50,                     # Fixed limit
    "max_tokens": 2048,              # Fixed limit
    "seed": "required",              # CRITICAL - must be set
    "stop_sequences": ["\n\nUser:"], # Deterministic stops
}
```

### Configuration by Model

```python
# /services/api/app/skills/llm_client.py

DECODER_CONFIGS = {
    "claude-opus": {
        "temperature": 0.3,
        "top_p": 0.9,
        "seed": None,  # Set per-call
    },
    "claude-sonnet": {
        "temperature": 0.3,
        "top_p": 0.9,
        "seed": None,
    },
}

async def generate(
    model: str,
    prompt: str,
    seed: str,
    **kwargs
):
    """Generate with deterministic settings."""

    config = DECODER_CONFIGS.get(model, {})
    config.update(kwargs)
    config['seed'] = seed  # Override with node seed

    response = await client.messages.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        **config
    )

    return response.content[0].text
```

## Interpreting Results

### Test Output

```
test_workflow_determinism PASSED
  Seed: workflow-abc123-def456
  Run 1: sha256:1a2b3c...
  Run 2: sha256:1a2b3c...
  Run 3: sha256:1a2b3c...
  Reproducibility: 3/3 (100%)
  Style changed: False
  Lyrics changed: False
  Producer notes changed: False
  Composed prompt changed: False
  Determinism verdict: PASS
```

### Hash Comparison

```python
# When outputs don't match
if hash1 != hash2:
    print("MISMATCH DETECTED!")
    print(f"Expected hash: {hash1}")
    print(f"Actual hash:   {hash2}")

    # Find difference
    for i, (c1, c2) in enumerate(zip(output1, output2)):
        if c1 != c2:
            start = max(0, i - 50)
            end = min(len(output1), i + 50)
            print(f"First difference at position {i}:")
            print(f"  Expected: ...{output1[start:end]}...")
            print(f"  Actual:   ...{output2[start:end]}...")
            break
```

### Metric Summary

```python
# Reproducibility metrics
metrics = {
    "total_runs": 10,
    "successful_runs": 10,
    "reproducible_runs": 10,
    "reproducibility_rate": 1.0,  # 100%
    "avg_execution_time": 45.3,    # seconds
    "determinism_confidence": 0.99  # Very high
}

print(f"Reproducibility: {metrics['reproducible_runs']}/{metrics['total_runs']}")
print(f"Success rate: {metrics['successful_runs']}/{metrics['total_runs']}")
print(f"Determinism confidence: {metrics['determinism_confidence']:.2%}")
```

## Troubleshooting

### Issue: Non-Deterministic Behavior

**Symptoms:**
- Outputs differ between runs
- Hash mismatch on identical inputs
- Workflow produces different results with same SDS

**Diagnosis Steps:**
```python
# 1. Check seed is being set
seed = "test-seed-123"
print(f"Using seed: {seed}")

# 2. Run same operation twice
output1 = service.operation(input_data, seed=seed)
output2 = service.operation(input_data, seed=seed)

# 3. Compare outputs
if output1 != output2:
    print("NON-DETERMINISTIC DETECTED!")

    # 4. Find what changed
    diff = deepdiff.DeepDiff(output1, output2)
    print(f"Changes: {diff}")
```

**Common Causes:**
1. **Missing seed in LLM call** - Always pass seed to LLM
2. **Random number generation** - Use seed to initialize random
3. **Unordered collections** - Sort before iterating
4. **Non-deterministic sorting** - Use explicit sort keys
5. **Timestamp/datetime** - Mock time in tests
6. **File I/O** - Use fixed paths, check modification times

**Solutions:**
```python
# Fix 1: Add seed to LLM
response = llm.generate(prompt, seed=node_seed)  # GOOD

# Fix 2: Use seed for random
import random
random.seed(node_seed)
value = random.choice(options)  # Now deterministic

# Fix 3: Sort collections
tags = sorted(style.tags)  # Deterministic order

# Fix 4: Use explicit sort key
artists = sorted(artists, key=lambda a: a.name)  # Deterministic

# Fix 5: Mock time
import unittest.mock as mock
with mock.patch('time.time', return_value=1234567890):
    result = operation()  # Now deterministic
```

### Issue: Different Seeds Produce Same Output

**Symptoms:**
- Different seeds don't affect output
- Seed parameter not being used

**Cause:**
Seed not being passed through all layers.

**Solution:**
```python
# Check seed propagation
print("Seed at STYLE node:", state.global_seed)

# Verify seed in LLM call
print("Seed in LLM:", node_seed)

# Check LLM actually uses seed
response = llm.generate(
    prompt=prompt,
    seed=node_seed  # Make sure it's included
)
```

### Issue: Reproducibility Variance

**Symptoms:**
- Sometimes deterministic, sometimes not
- Random failures in CI/CD

**Causes:**
1. Environmental differences (CPU, memory, version changes)
2. Floating-point precision issues
3. Dictionary ordering (in Python < 3.7)
4. Thread scheduling race conditions

**Solutions:**
```python
# Handle floating-point comparison
def approx_equal(a, b, tolerance=1e-9):
    return abs(a - b) < tolerance

assert approx_equal(score1, score2)

# Ensure consistent sorting
scores = sorted(scores, key=lambda s: s['metric'])

# Use explicit seeds for all randomness
random.seed(node_seed)
import numpy as np
np.random.seed(int(node_seed.split('-')[1]))

# Freeze time
import freezegun
with freezegun.freeze_time("2025-01-01T00:00:00Z"):
    result = operation()
```

## Best Practices

### 1. Always Use Seeds

```python
# GOOD
response = llm.generate(prompt, seed=node_seed)

# BAD
response = llm.generate(prompt)
```

### 2. Document Seed Usage

```python
def generate_style(sds, seed):
    """Generate style spec deterministically.

    Args:
        sds: Song Design Spec
        seed: Deterministic seed (format: "node-seed")

    Returns:
        Style spec with identical output for same seed

    Note:
        Uses seed for LLM generation and any random operations.
        Temperature set to 0.3 for consistency.
    """
    # Implementation
```

### 3. Test with Multiple Seeds

```python
def test_style_generation():
    """Test that style generation works with different seeds."""

    seeds = [
        "seed-001",
        "seed-002",
        "seed-003"
    ]

    for seed in seeds:
        output1 = generate_style(sds, seed)
        output2 = generate_style(sds, seed)  # Same seed
        assert output1 == output2, f"Non-deterministic with seed {seed}"
```

### 4. Pin Sources for Retrieval

```python
def retrieve_sources(query, source_hashes):
    """Retrieve sources deterministically.

    Args:
        query: Search query
        source_hashes: List of allowed source hashes

    Returns:
        Fixed sources from pinned list
    """
    sources = []
    for source_hash in source_hashes:  # Deterministic order
        source = db.get_source_by_hash(source_hash)
        if source:
            sources.append(source)
    return sources
```

### 5. Record All Non-Deterministic Decisions

```python
# When something can't be deterministic, record it
state.annotations.append({
    "node": "LYRICS",
    "decision": "artist_selection",
    "value": "Taylor Swift",
    "reason": "User-specified artist",
    "timestamp": now(),
    "user_id": request.user_id
})
```

## See Also

- [Validation Service Guide](validation-service-guide.md) - Validation implementation
- [Rubric Scoring Guide](rubric-scoring-guide.md) - Metric determinism
- [Policy Guards Guide](policy-guards-guide.md) - Policy determinism
- [CLAUDE.md](../CLAUDE.md) - Project architecture
