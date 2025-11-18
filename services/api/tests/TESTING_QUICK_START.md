# AMCS Skill Testing - Quick Start Guide

Quick reference for writing tests for AMCS workflow skills.

## 1. Basic Test Structure

```python
from tests.unit.skills.base import SkillTestCase

class TestMySkill(SkillTestCase):
    def test_skill_execution(self, sample_sds_pop, pop_blueprint):
        # Create context with appropriate seed
        ctx = self.workflow_context(seed=self.TEST_SEED_PLAN)
        
        # Execute skill
        result = my_skill.execute(MyInput(context=ctx, sds=sample_sds_pop, ...))
        
        # Assert success
        assert result.status == "success"
```

## 2. Available Fixtures

```python
# SDSs (Song Design Specs)
sample_sds          # All 10 SDSs
sample_sds_pop      # Pop only
sample_sds_rock     # Rock only
sample_sds_hiphop   # Hip-hop only
sample_sds_country  # Country only
sample_sds_rnb      # R&B only

# Blueprints
pop_blueprint
rock_blueprint
hiphop_blueprint
country_blueprint
rnb_blueprint

# Sources
sample_sources              # All sources
love_themes_source          # Love themes
urban_imagery_source        # Urban imagery
nature_metaphors_source     # Nature metaphors
```

## 3. Seed Constants

```python
self.TEST_SEED = 42              # Base seed
self.TEST_SEED_PLAN = 43         # PLAN skill
self.TEST_SEED_STYLE = 44        # STYLE skill
self.TEST_SEED_LYRICS = 45       # LYRICS skill
self.TEST_SEED_PRODUCER = 46     # PRODUCER skill
self.TEST_SEED_COMPOSE = 47      # COMPOSE skill
self.TEST_SEED_VALIDATE = 48     # VALIDATE skill
self.TEST_SEED_FIX = 49          # FIX skill
self.TEST_SEED_REVIEW = 50       # REVIEW skill
```

## 4. Assertion Helpers

### Test Determinism
```python
# Assert function is deterministic across 10 runs
self.assert_deterministic(
    skill.execute,
    input_data,
    run_count=10
)
```

### Validate Events
```python
# Assert skill emitted start and end events
self.assert_event_emitted(result.events, "LYRICS", "start")
self.assert_event_emitted(result.events, "LYRICS", "end")
```

### Validate Artifact Hash
```python
# Assert hash is valid SHA-256 format
self.assert_artifact_hash_valid(result.artifact_hash)
```

### Validate Citations
```python
# Assert citations are valid
self.assert_citations_valid(
    result.citations,
    min_count=3,
    required_source_ids=[s["id"] for s in sample_sources]
)
```

### Validate Scores
```python
# Assert scores are in range 0.0-1.0
self.assert_scores_in_range(result.scores)
```

## 5. Complete Example

```python
from tests.unit.skills.base import SkillTestCase

class TestLyricsSkill(SkillTestCase):
    def test_lyrics_generation(
        self,
        sample_sds_pop,
        pop_blueprint,
        sample_sources
    ):
        # 1. Create context
        ctx = self.workflow_context(seed=self.TEST_SEED_LYRICS)
        
        # 2. Prepare input
        input_data = LyricsInput(
            context=ctx,
            sds=sample_sds_pop,
            plan={"sections": [...]},
            style={"genre": "pop", ...},
            sources=sample_sources,
            blueprint=pop_blueprint
        )
        
        # 3. Execute skill
        result = lyrics_skill.execute(input_data)
        
        # 4. Validate outputs
        assert result.status == "success"
        self.assert_artifact_hash_valid(result.artifact_hash)
        self.assert_event_emitted(result.events, "LYRICS", "start")
        self.assert_event_emitted(result.events, "LYRICS", "end")
        self.assert_citations_valid(result.citations, min_count=3)
        
        # 5. Test determinism
        self.assert_deterministic(
            lyrics_skill.execute,
            input_data,
            run_count=10
        )
```

## 6. Running Tests

```bash
# Run all skill tests
pytest tests/unit/skills/ -v

# Run specific test file
pytest tests/unit/skills/test_lyrics.py -v

# Run specific test
pytest tests/unit/skills/test_lyrics.py::TestLyricsSkill::test_lyrics_generation -v

# Run with coverage
pytest tests/unit/skills/ --cov=app/skills --cov-report=html
```

## 7. Common Patterns

### Test Multiple Genres
```python
@pytest.mark.parametrize("sds_fixture", [
    "sample_sds_pop",
    "sample_sds_rock",
    "sample_sds_hiphop"
])
def test_all_genres(self, sds_fixture, request):
    sds = request.getfixturevalue(sds_fixture)
    result = skill.execute(SkillInput(sds=sds, ...))
    assert result.status == "success"
```

### Test Edge Cases
```python
def test_explicit_content(self, sample_sds_hiphop):
    # Hip-hop SDS has explicit=True
    result = skill.execute(SkillInput(sds=sample_sds_hiphop, ...))
    # Verify profanity handling
    assert result.profanity_score > 0.0

def test_long_song(self, sample_sds_ccm):
    # CCM SDS has longest duration (4:15)
    result = skill.execute(SkillInput(sds=sample_sds_ccm, ...))
    # Verify section count
    assert len(result.plan["sections"]) > 8
```

### Test Error Handling
```python
def test_invalid_input(self):
    with pytest.raises(ValueError):
        skill.execute(SkillInput(sds={"invalid": "data"}))
```

## 8. File Locations

- **Base Class**: `tests/unit/skills/base.py`
- **Fixtures**: `tests/fixtures/`
- **Documentation**: `tests/fixtures/README.md`
- **Example Test**: `tests/unit/skills/example_test.py`
- **Your Tests**: `tests/unit/skills/test_<skillname>.py`

## 9. Best Practices

1. Always inherit from `SkillTestCase`
2. Use seed constants for reproducibility
3. Test determinism for all skills (≥99% reproducibility)
4. Validate all outputs (status, events, hashes)
5. Test edge cases (explicit content, long songs, empty sections)
6. Use descriptive test names
7. Document non-obvious test logic
8. Keep tests independent (no shared state)

## 10. Need Help?

- See comprehensive examples: `tests/unit/skills/example_test.py`
- Read full documentation: `tests/fixtures/README.md`
- Check skill contracts: `app/schemas/skill_contracts.py`
- Review determinism module: `app/core/determinism.py`
- Study citations module: `app/core/citations.py`

---

Happy Testing! 🎵
