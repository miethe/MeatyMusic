# Coverage Gaps Action Plan

**Generated:** 2025-11-14
**Current Coverage:** 57.0%
**Target Coverage:** 80.0%
**Gap:** 23 percentage points

---

## P0 - CRITICAL (Immediate Actions)

### 1. Fix Test Suite Failures (37 failed + 6 errors)

#### PersonaService Tests (12 failures)

**Issue:** Pydantic validation errors for datetime fields

**Files:**
- `app/tests/test_services/test_persona_service.py`

**Fix:**
```python
# Update fixtures to provide valid datetime values
from datetime import datetime, UTC

@pytest.fixture
def valid_persona_data():
    return {
        "id": uuid4(),
        "name": "Test Persona",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
        # ... other fields
    }
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_persona_service.py -v
```

---

#### StyleService Tests (7 failures)

**Issue:** Unexpected `tenant_id` parameter

**Files:**
- `app/tests/test_services/test_style_service.py`

**Fix:**
```python
# Option 1: Remove tenant_id from test calls
result = await style_service.create_style(
    style_data=style_data,
    # tenant_id=tenant_id,  # Remove this
)

# Option 2: Update service signature to accept tenant_id
# (if tenant_id is actually needed)
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_style_service.py -v
```

---

#### StyleService Validation Tests (4 failures)

**Issue:** Missing `blueprint_id` parameter

**Files:**
- `app/tests/test_services/test_style_service.py`

**Fix:**
```python
# Add blueprint_id to validation calls
await style_service._validate_tag_conflicts(
    tags=["tag1", "tag2"],
    blueprint_id=uuid4(),  # Add this
)
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_style_service.py::TestStyleService::test_validate_tag_conflicts_no_conflict -v
```

---

#### SourceService Fixture Errors (6 errors)

**Issue:** `fixture 'db_session' not found`

**Files:**
- `tests/test_source_service_determinism.py`
- `tests/conftest.py`

**Fix:**
```python
# In tests/conftest.py, add:
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def db_session():
    """Provide database session for tests."""
    engine = create_async_engine(
        "postgresql+asyncpg://mm_user:mm_password@localhost:5432/meaty_music_test",
        echo=False,
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
```

**Command:**
```bash
uv run pytest tests/test_source_service_determinism.py -v
```

---

### 2. Transaction Management Coverage (38.5% → 100%)

**File:** `app/services/base_service.py`

**Missing Lines:** 154, 156, 157, 164, 166, 168, 169, 176

**Tests to Add:**

```python
# In app/tests/test_services/test_base_service.py

async def test_transaction_rollback_on_exception(base_service, db_session):
    """Test transaction rolls back on exception."""
    with pytest.raises(ValueError):
        async with base_service.transaction():
            # Perform some operation
            await base_service.create(...)
            # Trigger exception
            raise ValueError("Test rollback")

    # Verify rollback occurred
    result = await base_service.get(...)
    assert result is None


async def test_transaction_commit_failure(base_service, db_session, monkeypatch):
    """Test transaction handles commit failures."""
    # Mock commit to fail
    async def failing_commit():
        raise Exception("Commit failed")

    monkeypatch.setattr(db_session, "commit", failing_commit)

    with pytest.raises(Exception):
        async with base_service.transaction():
            await base_service.create(...)


async def test_nested_transactions(base_service, db_session):
    """Test nested transaction handling."""
    async with base_service.transaction():
        await base_service.create(outer_item)

        async with base_service.transaction():
            await base_service.create(inner_item)

        # Inner transaction committed
        result = await base_service.get(inner_item.id)
        assert result is not None

    # Outer transaction committed
    result = await base_service.get(outer_item.id)
    assert result is not None


async def test_transaction_context_manager_exit(base_service, db_session):
    """Test transaction context manager properly exits."""
    async with base_service.transaction():
        await base_service.create(...)

    # Verify session state after exit
    assert not db_session.in_transaction()
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_base_service.py -v --cov=app/services/base_service --cov-report=term-missing
```

---

### 3. Source Retrieval Determinism Coverage (18.4% → 100%)

**File:** `app/services/source_service.py`

**Missing:** 115 lines uncovered

**Tests to Add:**

```python
# In tests/test_source_service_determinism.py

async def test_retrieve_chunks_with_seed_deterministic(source_service, db_session):
    """Test chunk retrieval is deterministic with same seed."""
    query = "test query"
    seed = 12345

    # First retrieval
    result1 = await source_service.retrieve_chunks_with_seed(
        query=query,
        seed=seed,
        top_k=10
    )

    # Second retrieval with same seed
    result2 = await source_service.retrieve_chunks_with_seed(
        query=query,
        seed=seed,
        top_k=10
    )

    # Results should be identical
    assert result1.chunks == result2.chunks
    assert result1.hashes == result2.hashes


async def test_compute_content_hash_stability(source_service):
    """Test content hashes are stable across calls."""
    content = "Test content for hashing"

    hash1 = source_service.compute_content_hash(content)
    hash2 = source_service.compute_content_hash(content)

    assert hash1 == hash2
    assert len(hash1) == 64  # SHA256 hash


async def test_retrieve_by_hash_pinned_retrieval(source_service, db_session):
    """Test retrieval by hash returns exact content."""
    # Store content with known hash
    content = "Pinned content"
    content_hash = source_service.compute_content_hash(content)

    # Retrieve by hash
    result = await source_service.retrieve_by_hash(content_hash)

    assert result.content == content
    assert result.hash == content_hash


async def test_different_seeds_produce_different_results(source_service, db_session):
    """Test different seeds produce different ordering."""
    query = "test query"

    result1 = await source_service.retrieve_chunks_with_seed(
        query=query, seed=12345, top_k=10
    )
    result2 = await source_service.retrieve_chunks_with_seed(
        query=query, seed=67890, top_k=10
    )

    # Should have different ordering (with high probability)
    assert result1.chunks != result2.chunks


async def test_allow_deny_list_enforcement(source_service, db_session):
    """Test allow/deny lists are enforced."""
    # Set deny list
    source_service.set_deny_list(["blocked_source"])

    # Attempt retrieval from blocked source
    with pytest.raises(ValueError, match="blocked by deny list"):
        await source_service.retrieve_from_source(
            source_id="blocked_source",
            query="test"
        )


async def test_normalize_source_weights(source_service):
    """Test source weight normalization."""
    sources = [
        {"id": "src1", "weight": 0.5},
        {"id": "src2", "weight": 0.8},
        {"id": "src3", "weight": 0.7},
    ]

    normalized = source_service.normalize_source_weights(sources)

    # Sum should be ≤ 1.0
    total = sum(normalized.values())
    assert total <= 1.0

    # Relative proportions preserved
    assert normalized["src2"] > normalized["src3"] > normalized["src1"]
```

**Command:**
```bash
uv run pytest tests/test_source_service_determinism.py -v --cov=app/services/source_service --cov-report=term-missing
```

---

## P1 - HIGH PRIORITY (Next Sprint)

### 4. Validation Service Coverage (68.3% → 80%)

**File:** `app/services/validation_service.py`

**Missing Lines:** 48-53, 77-84, 140-141, 158-160, 190-192, 204-205, 222-224, 236-237

**Tests to Add:**

```python
# Test edge cases
async def test_validate_rubric_empty_scores(validation_service):
    """Test rubric validation with empty scores."""
    with pytest.raises(ValueError, match="No scores provided"):
        await validation_service.validate_rubric({})


async def test_validate_energy_tempo_coherence_boundary(validation_service):
    """Test energy-tempo at boundary conditions."""
    # Just at threshold
    await validation_service.validate_energy_tempo_coherence(
        energy_level=7,
        bpm=140
    )  # Should pass

    # Just over threshold
    with pytest.raises(ValueError):
        await validation_service.validate_energy_tempo_coherence(
            energy_level=9,
            bpm=70
        )


async def test_validate_section_completeness_partial(validation_service):
    """Test section validation with partial sections."""
    sections = [
        {"type": "verse", "lines": ["line1"]},
        {"type": "chorus", "lines": []},  # Empty
    ]

    result = await validation_service.validate_section_completeness(sections)
    assert not result.valid
    assert "chorus" in result.issues


async def test_validate_hook_density_low(validation_service):
    """Test hook density validation below threshold."""
    lyrics = "Simple lyrics without hooks"

    result = await validation_service.validate_hook_density(lyrics)
    assert result.score < 0.5
    assert "low hook density" in result.message.lower()
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_validation_service.py -v --cov=app/services/validation_service --cov-report=term-missing
```

---

### 5. Style Service Coverage (72.3% → 80%)

**File:** `app/services/style_service.py`

**Missing Lines:** 52-69, 124-129, 140, 165, 180-183

**Tests to Add:**

```python
async def test_validate_tag_conflicts_complex(style_service):
    """Test complex tag conflict scenarios."""
    blueprint_id = uuid4()

    # Multiple conflicts
    with pytest.raises(ValueError) as exc:
        await style_service._validate_tag_conflicts(
            tags=["whisper", "anthemic", "intimate", "stadium"],
            blueprint_id=blueprint_id
        )

    assert "whisper" in str(exc.value)
    assert "anthemic" in str(exc.value)


async def test_validate_energy_tempo_coherence_edge_cases(style_service):
    """Test energy-tempo coherence edge cases."""
    # None energy
    await style_service._validate_energy_tempo_coherence(
        energy_level=None,
        bpm=120
    )  # Should not raise

    # None BPM
    await style_service._validate_energy_tempo_coherence(
        energy_level=5,
        bpm=None
    )  # Should not raise

    # Both None
    await style_service._validate_energy_tempo_coherence(
        energy_level=None,
        bpm=None
    )  # Should not raise


async def test_create_style_with_blueprint_validation(style_service):
    """Test style creation with blueprint validation."""
    style_data = {
        "name": "Test Style",
        "genre": "pop",
        "bpm": 120,
        "tags": ["upbeat", "catchy"],
        "blueprint_id": uuid4()
    }

    result = await style_service.create_style(style_data=style_data)
    assert result.id is not None
    assert result.tags == ["upbeat", "catchy"]
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_style_service.py -v --cov=app/services/style_service --cov-report=term-missing
```

---

### 6. Common.py Coverage (63.3% → 80%)

**File:** `app/services/common.py`

**Missing Lines:** 809-856, 869-895, 908-928, 966-995, 1025-1042, 1081-1151, 1189-1230, 1272-1303

**Tests to Add:**

```python
# Test uncovered utility functions
def test_extract_imagery():
    """Test imagery extraction from lyrics."""
    lyrics = "The sun sets over golden fields"
    imagery = extract_imagery(lyrics)
    assert "sun" in imagery
    assert "golden fields" in imagery


def test_check_profanity_edge_cases():
    """Test profanity filter edge cases."""
    # Test with punctuation
    assert check_profanity("f**k") is True

    # Test with mixed case
    assert check_profanity("FuCk") is True

    # Test clean text
    assert check_profanity("family friendly") is False


def test_validate_meter_complex():
    """Test meter validation with complex patterns."""
    lines = [
        "The quick brown fox jumps over",  # 8 syllables
        "The lazy dog sleeps all day long"  # 8 syllables
    ]
    meter = "8-8"

    result = validate_meter(lines, meter)
    assert result.valid


def test_extract_rhyme_endings_punctuation():
    """Test rhyme ending extraction with various punctuation."""
    assert extract_rhyme_ending("Hello, world!") == "world"
    assert extract_rhyme_ending("What's up?") == "up"
    assert extract_rhyme_ending("...anyway") == "anyway"
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_common.py -v --cov=app/services/common --cov-report=term-missing
```

---

### 7. Base Service Coverage (56.5% → 80%)

**File:** `app/services/base_service.py`

**Missing Lines:** 106, 154-176, 212, 285-317, 349-366

**Tests to Add:**

```python
async def test_base_service_error_handling(base_service):
    """Test base service error handling."""
    with pytest.raises(ValueError):
        await base_service.get(id=None)


async def test_base_service_logging(base_service, caplog):
    """Test base service logging."""
    await base_service.create(data)
    assert "Creating entity" in caplog.text


async def test_base_service_telemetry(base_service, telemetry_mock):
    """Test base service telemetry emission."""
    await base_service.create(data)
    assert telemetry_mock.called
    assert telemetry_mock.operation == "create"
```

**Command:**
```bash
uv run pytest app/tests/test_services/test_base_service.py -v --cov=app/services/base_service --cov-report=term-missing
```

---

## P2 - MEDIUM PRIORITY (Phase 4)

### 8. Workflow Service Coverage (0% → 80%)

**File:** `app/services/workflow_service.py`

**Create new test file:** `app/tests/test_services/test_workflow_service.py`

**Tests to Add:**

```python
async def test_execute_workflow_graph():
    """Test workflow graph execution."""
    # Test full PLAN→STYLE→LYRICS→COMPOSE pipeline


async def test_workflow_node_transitions():
    """Test transitions between workflow nodes."""
    # Test state changes


async def test_workflow_error_handling():
    """Test workflow error handling and retries."""
    # Test retry logic


async def test_workflow_fix_loop():
    """Test workflow fix loop (≤3 iterations)."""
    # Test auto-fix scenarios
```

---

### 9. Workflow Run Service Coverage (27.4% → 80%)

**File:** `app/services/workflow_run_service.py`

**Tests to Add:**

```python
async def test_create_workflow_run():
    """Test workflow run creation."""


async def test_workflow_run_state_transitions():
    """Test run state transitions."""


async def test_workflow_run_event_emission():
    """Test event emission during run."""


async def test_workflow_run_artifact_storage():
    """Test artifact storage during run."""
```

---

### 10. Song Service Coverage (26% → 80%)

**File:** `app/services/song_service.py`

**Tests to Add:**

```python
async def test_create_song_with_entities():
    """Test song creation with related entities."""


async def test_update_song():
    """Test song update operations."""


async def test_delete_song():
    """Test song deletion with cascade."""


async def test_query_songs_complex():
    """Test complex song queries."""
```

---

## Commands Reference

### Run All Tests with Coverage

```bash
cd /home/user/MeatyMusic/services/api

# All service tests
uv run pytest app/tests/test_services/ \
    tests/test_blueprint_service.py \
    tests/test_source_service_determinism.py \
    --cov=app/services \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=json \
    -v

# View coverage report
open htmlcov/index.html

# Check coverage threshold
uv run pytest --cov=app/services --cov-fail-under=80
```

### Run Specific Service Tests

```bash
# Persona service
uv run pytest app/tests/test_services/test_persona_service.py -v

# Style service
uv run pytest app/tests/test_services/test_style_service.py -v

# Source service determinism
uv run pytest tests/test_source_service_determinism.py -v

# Base service
uv run pytest app/tests/test_services/test_base_service.py -v
```

### Run with Coverage for Single Service

```bash
uv run pytest app/tests/test_services/test_style_service.py \
    --cov=app/services/style_service \
    --cov-report=term-missing \
    -v
```

### Fix and Re-run Failed Tests

```bash
# Run only failed tests
uv run pytest --lf -v

# Run failed tests with verbose output
uv run pytest --lf -vv

# Run specific failed test
uv run pytest app/tests/test_services/test_style_service.py::TestStyleService::test_create_style_valid -vv
```

---

## Success Criteria

- [ ] All 37 test failures fixed
- [ ] All 6 fixture errors resolved
- [ ] Transaction management coverage: 100%
- [ ] Source retrieval determinism coverage: 100%
- [ ] Overall service layer coverage: ≥80%
- [ ] All services individually: ≥80%
- [ ] Test pass rate: 100%

---

## Estimated Effort

- **P0 Actions:** 8-12 hours
- **P1 Actions:** 16-24 hours
- **P2 Actions:** 24-32 hours
- **Total:** 48-68 hours (6-8.5 days)

---

**Last Updated:** 2025-11-14
