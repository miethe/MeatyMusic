# BlueprintService Implementation Summary

**Date:** 2025-11-14
**Tasks:** N6-9 (Blueprint Initialization) & N6-10 (Blueprint Validation)
**Priority:** P0 (Critical)
**Story Points:** 2 SP

---

## Overview

Implemented `BlueprintService` for WP-N6 (Missing Entity Services) with complete blueprint loading, caching, and validation capabilities.

## Implementation Details

### Files Created

1. **`/services/api/app/services/blueprint_service.py`** (880 lines)
   - Complete service implementation with all required methods
   - Comprehensive docstrings and type hints
   - Structured logging throughout

2. **`/taxonomies/conflict_matrix.json`**
   - Tag conflict definitions (15 tags with conflicts)
   - Used for style tag validation

3. **`/services/api/tests/test_blueprint_service.py`** (400+ lines)
   - Comprehensive test suite
   - Tests for all N6-9 and N6-10 requirements

### Files Modified

1. **`/services/api/app/services/__init__.py`**
   - Added `BlueprintService` import and export

---

## Feature Implementation

### N6-9: Blueprint Loading & Caching ✅

#### 1. `get_or_load_blueprint(genre: str, version: str = "latest") -> Blueprint`

**Purpose:** Get blueprint from cache or load from file

**Features:**
- In-memory caching with cache key: `"{genre}:{version}"`
- Automatic cache population on miss
- Cache hit logging for performance monitoring

**Example:**
```python
service = BlueprintService(blueprint_repo)
blueprint = service.get_or_load_blueprint("pop")
# Subsequent calls use cache
blueprint2 = service.get_or_load_blueprint("pop")  # Cache hit
```

#### 2. `load_blueprint_from_file(genre: str) -> Blueprint`

**Purpose:** Parse blueprint markdown files

**Features:**
- Loads from `/docs/hit_song_blueprint/AI/{genre}_blueprint.md`
- Extracts tempo ranges from "Tempo:" sections
- Parses required sections from "Form:" definitions
- Extracts length constraints
- Creates default rubric configuration
- Comprehensive error handling

**Parsing Examples:**
```markdown
# Pop Blueprint

## Musical Blueprint

- **Tempo:** Most pop hits fall between **95–130 BPM** for dance tracks.

## Structural Blueprint

- **Form:** **Verse → Pre-Chorus → Chorus** is most common.
```

**Extracted Data:**
```python
{
    'genre': 'pop',
    'version': 'latest',
    'rules': {
        'tempo_bpm': [95, 130],
        'required_sections': ['Verse', 'Pre-Chorus', 'Chorus'],
        'length_minutes': [2.5, 3.5]
    },
    'eval_rubric': {
        'weights': {
            'hook_density': 0.25,
            'singability': 0.20,
            'rhyme_tightness': 0.15,
            'section_completeness': 0.20,
            'profanity_score': 0.20
        },
        'thresholds': {
            'min_total': 0.75,
            'max_profanity': 0.1
        }
    }
}
```

#### 3. `cache_blueprint(genre: str, blueprint: Blueprint, version: str = "latest") -> None`

**Purpose:** Manual cache population

**Features:**
- Stores blueprint in memory cache
- Cache key: `"{genre}:{version}"`
- Logging of cache operations

#### 4. `invalidate_cache(genre: Optional[str] = None) -> int`

**Purpose:** Cache invalidation

**Features:**
- Clear entire cache if `genre=None`
- Clear specific genre (all versions) if genre specified
- Returns count of removed entries
- Structured logging

**Examples:**
```python
# Clear specific genre
service.invalidate_cache("pop")  # Returns 1

# Clear all
service.invalidate_cache()  # Returns total count
```

---

### N6-10: Validation & Constraints ✅

#### 1. `validate_rubric_weights(weights: Dict[str, float]) -> Tuple[bool, Optional[str]]`

**Purpose:** Validate evaluation rubric weights

**Validation Rules:**
- All weights must be positive
- Sum must equal 1.0 (±0.01 tolerance)
- Weights dict cannot be empty

**Examples:**
```python
# Valid weights
weights = {"hook_density": 0.5, "singability": 0.5}
is_valid, error = service.validate_rubric_weights(weights)
# Returns: (True, None)

# Invalid sum
weights = {"hook_density": 0.3, "singability": 0.5}
is_valid, error = service.validate_rubric_weights(weights)
# Returns: (False, "Weights sum to 0.8, expected 1.0 (±0.01)")

# Negative weight
weights = {"hook_density": -0.5, "singability": 1.5}
is_valid, error = service.validate_rubric_weights(weights)
# Returns: (False, "Negative weight for 'hook_density': -0.5")
```

#### 2. `validate_tempo_range(bpm_min: int, bpm_max: int, blueprint: Blueprint) -> Tuple[bool, Optional[str]]`

**Purpose:** Validate tempo range against blueprint constraints

**Validation Rules:**
- BPM values must be positive
- Min must be <= Max
- Range must overlap with blueprint's tempo constraints
- Falls back to reasonable bounds (40-240 BPM) if no constraints

**Examples:**
```python
blueprint = service.get_or_load_blueprint("pop")  # 95-130 BPM

# Valid range (within blueprint)
is_valid, error = service.validate_tempo_range(100, 120, blueprint)
# Returns: (True, None)

# Invalid range (too fast)
is_valid, error = service.validate_tempo_range(150, 180, blueprint)
# Returns: (False, "BPM range 150-180 outside blueprint constraints (95-130) for pop")

# Invalid range (min > max)
is_valid, error = service.validate_tempo_range(130, 100, blueprint)
# Returns: (False, "Invalid range: min (130) > max (100)")
```

#### 3. `validate_required_sections(sections: List[str], required: List[str]) -> Tuple[bool, Optional[str]]`

**Purpose:** Validate all required sections are present

**Features:**
- Case-insensitive comparison
- Returns list of missing sections in error message
- Always valid if no requirements

**Examples:**
```python
# Valid
is_valid, error = service.validate_required_sections(
    ["Verse", "Chorus", "Bridge"],
    ["Verse", "Chorus"]
)
# Returns: (True, None)

# Missing section
is_valid, error = service.validate_required_sections(
    ["Verse"],
    ["Verse", "Chorus"]
)
# Returns: (False, "Missing required sections: Chorus")
```

#### 4. `load_conflict_matrix() -> Dict[str, List[str]]`

**Purpose:** Load tag conflict definitions from JSON

**Features:**
- Loads from `/taxonomies/conflict_matrix.json`
- In-memory caching after first load
- Graceful fallback to empty matrix if file not found
- Comprehensive error handling for malformed JSON

**Conflict Matrix Structure:**
```json
{
  "whisper": ["anthemic", "high-energy", "aggressive", "stadium"],
  "anthemic": ["whisper", "intimate", "low-energy", "minimal"],
  "acoustic": ["electronic", "synth-heavy", "industrial"],
  "electronic": ["acoustic", "organic"]
}
```

#### 5. `get_tag_conflicts(tags: List[str]) -> List[Tuple[str, str]]`

**Purpose:** Find conflicting tag pairs

**Features:**
- Case-insensitive tag matching
- Returns sorted tuples to avoid duplicates
- Comprehensive logging of conflicts
- Empty list if no conflicts

**Examples:**
```python
# No conflicts
tags = ["acoustic", "warm", "vintage"]
conflicts = service.get_tag_conflicts(tags)
# Returns: []

# Single conflict
tags = ["whisper", "anthemic"]
conflicts = service.get_tag_conflicts(tags)
# Returns: [("anthemic", "whisper")]

# Multiple conflicts
tags = ["whisper", "anthemic", "acoustic", "electronic"]
conflicts = service.get_tag_conflicts(tags)
# Returns: [("anthemic", "whisper"), ("acoustic", "electronic")]
```

---

## Caching Strategy

### In-Memory Cache Design

**Cache Structure:**
```python
_blueprint_cache: Dict[str, Blueprint] = {}
# Key format: "{genre}:{version}"
# Example: "pop:latest", "country:1.0"
```

**Cache Benefits:**
1. **Performance:** Avoids repeated file I/O for same blueprint
2. **Consistency:** Same blueprint object for same genre/version
3. **Simplicity:** No external dependencies (Redis, Memcached)

**Cache Operations:**
- **Population:** Automatic on `get_or_load_blueprint()` miss
- **Invalidation:** Manual via `invalidate_cache(genre?)`
- **TTL:** None (manual invalidation required)

**Memory Considerations:**
- Each blueprint ~5-10 KB in memory
- 15 blueprints = ~75-150 KB total
- Negligible memory footprint for typical use

### Conflict Matrix Caching

**Cache Structure:**
```python
_conflict_matrix: Optional[Dict[str, List[str]]] = None
```

**Features:**
- Loaded once on first access
- Cached for service lifetime
- ~2-5 KB in memory

---

## Error Handling

### Exceptions Raised

1. **`NotFoundError`**
   - Blueprint file doesn't exist
   - Example: `load_blueprint_from_file("nonexistent")`

2. **`BadRequestError`**
   - Malformed blueprint markdown
   - Invalid JSON in conflict matrix
   - Invalid rubric weights during create/update

### Logging Strategy

All operations use `structlog` with structured context:

```python
logger.info(
    "blueprint.loaded_and_cached",
    genre=genre,
    version=version,
    blueprint_id=str(blueprint.id)
)

logger.warning(
    "tags.conflicts_detected",
    tag_count=len(tags),
    conflict_count=len(conflicts),
    conflicts=[f"{a} ↔ {b}" for a, b in conflicts]
)
```

---

## CRUD Operations

### Additional Methods

The service also provides standard CRUD operations:

1. **`create_blueprint(data: BlueprintCreate) -> Blueprint`**
   - Validates rubric weights before creation
   - Delegates to repository

2. **`get_blueprint_by_id(blueprint_id: UUID) -> Optional[Blueprint]`**
   - Retrieves from database via repository

3. **`get_blueprints_by_genre(genre: str) -> List[Blueprint]`**
   - Lists all blueprints for genre

4. **`update_blueprint(blueprint_id: UUID, data: BlueprintUpdate) -> Optional[Blueprint]`**
   - Validates rubric weights if updated
   - Delegates to repository

5. **`delete_blueprint(blueprint_id: UUID) -> bool`**
   - Soft delete via repository

---

## Testing

### Test Coverage

Created comprehensive test suite in `tests/test_blueprint_service.py`:

**N6-9 Tests (Loading & Caching):**
- ✅ Load blueprint from file (success)
- ✅ Load blueprint from file (not found)
- ✅ Cache miss behavior
- ✅ Cache hit behavior
- ✅ Manual caching
- ✅ Invalidate entire cache
- ✅ Invalidate specific genre
- ✅ Parse tempo extraction
- ✅ Parse sections extraction

**N6-10 Tests (Validation):**
- ✅ Validate rubric weights (valid)
- ✅ Validate rubric weights (invalid sum)
- ✅ Validate rubric weights (negative)
- ✅ Validate rubric weights (empty)
- ✅ Validate tempo range (valid)
- ✅ Validate tempo range (outside blueprint)
- ✅ Validate tempo range (invalid range)
- ✅ Validate tempo range (no constraints)
- ✅ Validate required sections (valid)
- ✅ Validate required sections (missing)
- ✅ Validate required sections (case-insensitive)
- ✅ Load conflict matrix (success)
- ✅ Load conflict matrix (caching)
- ✅ Get tag conflicts (no conflicts)
- ✅ Get tag conflicts (with conflicts)
- ✅ Get tag conflicts (multiple conflicts)
- ✅ Get tag conflicts (case-insensitive)

**CRUD Tests:**
- ✅ Create blueprint with valid rubric
- ✅ Create blueprint with invalid rubric

### Running Tests

```bash
# Full test suite
pytest services/api/tests/test_blueprint_service.py -v

# Specific test
pytest services/api/tests/test_blueprint_service.py::TestBlueprintService::test_load_blueprint_from_file_success -v

# With coverage
pytest services/api/tests/test_blueprint_service.py --cov=app.services.blueprint_service
```

---

## Usage Examples

### Basic Usage

```python
from app.services.blueprint_service import BlueprintService
from app.repositories.blueprint_repo import BlueprintRepository

# Initialize service
repo = BlueprintRepository(db_session)
service = BlueprintService(repo)

# Load blueprint (caches automatically)
pop_blueprint = service.get_or_load_blueprint("pop")

print(f"Genre: {pop_blueprint.genre}")
print(f"Tempo Range: {pop_blueprint.rules['tempo_bpm']}")
print(f"Required Sections: {pop_blueprint.rules['required_sections']}")
```

### Validation Workflow

```python
# Validate style creation
style_data = StyleCreate(
    genre="pop",
    bpm_min=100,
    bpm_max=120,
    tags_positive=["acoustic", "warm"],
    blueprint_id=pop_blueprint.id
)

# 1. Validate tempo range
is_valid, error = service.validate_tempo_range(
    style_data.bpm_min,
    style_data.bpm_max,
    pop_blueprint
)
if not is_valid:
    raise BadRequestError(f"Invalid tempo: {error}")

# 2. Check tag conflicts
conflicts = service.get_tag_conflicts(style_data.tags_positive)
if conflicts:
    raise BadRequestError(
        f"Conflicting tags detected: {conflicts}"
    )

# 3. Proceed with creation
style = style_repo.create(style_data)
```

### Lyrics Validation

```python
# Validate lyrics against blueprint
lyrics_data = LyricsCreate(
    song_id=song_id,
    sections=["Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"]
)

# Get blueprint from song
song = song_repo.get_by_id(song_id)
blueprint = service.get_or_load_blueprint(song.genre)

# Validate required sections
required_sections = blueprint.rules.get('required_sections', [])
is_valid, error = service.validate_required_sections(
    lyrics_data.sections,
    required_sections
)
if not is_valid:
    raise BadRequestError(f"Invalid structure: {error}")

# Proceed with lyrics creation
lyrics = lyrics_repo.create(lyrics_data)
```

### Rubric Configuration

```python
# Create custom blueprint with validated rubric
rubric = {
    'weights': {
        'hook_density': 0.3,
        'singability': 0.25,
        'rhyme_tightness': 0.2,
        'section_completeness': 0.15,
        'profanity_score': 0.1
    },
    'thresholds': {
        'min_total': 0.8,
        'max_profanity': 0.05
    }
}

# Validate weights
is_valid, error = service.validate_rubric_weights(rubric['weights'])
if not is_valid:
    raise BadRequestError(f"Invalid rubric: {error}")

# Create blueprint
blueprint_data = BlueprintCreate(
    genre="custom_pop",
    version="1.0",
    rules={"tempo_bpm": [95, 130]},
    eval_rubric=rubric,
    conflict_matrix={},
    tag_categories={},
    extra_metadata={}
)

blueprint = service.create_blueprint(blueprint_data)
```

---

## Integration Points

### With StyleService

`StyleService` can use `BlueprintService` for enhanced validation:

```python
class StyleService:
    def __init__(self, style_repo, blueprint_service):
        self.style_repo = style_repo
        self.blueprint_service = blueprint_service

    async def create_style(self, data: StyleCreate) -> Style:
        # Load blueprint
        blueprint = self.blueprint_service.get_or_load_blueprint(data.genre)

        # Validate tempo
        is_valid, error = self.blueprint_service.validate_tempo_range(
            data.bpm_min, data.bpm_max, blueprint
        )
        if not is_valid:
            raise BadRequestError(error)

        # Check conflicts
        conflicts = self.blueprint_service.get_tag_conflicts(data.tags_positive)
        if conflicts:
            raise BadRequestError(f"Tag conflicts: {conflicts}")

        return await self.style_repo.create(data)
```

### With LyricsService

```python
class LyricsService:
    def __init__(self, lyrics_repo, blueprint_service):
        self.lyrics_repo = lyrics_repo
        self.blueprint_service = blueprint_service

    async def validate_structure(self, sections: List[str], genre: str) -> bool:
        blueprint = self.blueprint_service.get_or_load_blueprint(genre)
        required = blueprint.rules.get('required_sections', [])
        is_valid, error = self.blueprint_service.validate_required_sections(
            sections, required
        )
        if not is_valid:
            raise BadRequestError(error)
        return True
```

---

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `get_or_load_blueprint` (cache hit) | O(1) | Dict lookup |
| `get_or_load_blueprint` (cache miss) | O(n) | File I/O + parsing |
| `validate_rubric_weights` | O(k) | k = number of weights |
| `validate_tempo_range` | O(1) | Simple comparisons |
| `validate_required_sections` | O(n*m) | n = sections, m = required |
| `load_conflict_matrix` (cached) | O(1) | Dict lookup |
| `load_conflict_matrix` (uncached) | O(n) | File I/O + JSON parse |
| `get_tag_conflicts` | O(t*c) | t = tags, c = avg conflicts per tag |

### Space Complexity

| Component | Size | Notes |
|-----------|------|-------|
| Blueprint cache | ~75-150 KB | 15 blueprints @ ~5-10 KB each |
| Conflict matrix | ~2-5 KB | 15 tags with ~3-5 conflicts each |
| **Total** | **~77-155 KB** | Negligible memory footprint |

### Benchmarks (Estimated)

- **Cache hit:** <1ms
- **Cache miss (file load):** 5-15ms
- **Conflict detection:** <1ms for typical tag list (5-10 tags)
- **Validation operations:** <1ms each

---

## Known Limitations

### 1. Blueprint Parsing

**Current:**
- Regex-based markdown parsing
- Limited to specific patterns
- May miss variations in markdown structure

**Future Enhancement:**
- Use markdown parser library (e.g., `markdown-it-py`)
- Support more flexible formats
- Extract additional metadata

### 2. Caching Strategy

**Current:**
- In-memory cache only
- No TTL (manual invalidation required)
- Not shared across service instances

**Future Enhancement:**
- Optional Redis integration for distributed caching
- Configurable TTL
- Cache warming on service startup

### 3. Conflict Matrix

**Current:**
- Static JSON file
- Loaded from filesystem
- No versioning

**Future Enhancement:**
- Database-backed conflict rules
- Per-blueprint conflict matrices
- Conflict severity levels (warning vs error)

### 4. Validation

**Current:**
- Binary validation (pass/fail)
- No severity levels
- No suggestion/auto-fix

**Future Enhancement:**
- Validation severity levels (error, warning, info)
- Suggestion engine for fixing conflicts
- Auto-normalize rubric weights

---

## Acceptance Criteria Status

### N6-9: Initialization ✅

- [x] Blueprint loading from markdown files
- [x] In-memory caching working
- [x] Genre lookup by version
- [x] Cache invalidation support

### N6-10: Validation ✅

- [x] Rubric weights validation (sum to 1.0)
- [x] Tempo range validation
- [x] Required sections enforcement
- [x] Tag conflict matrix loading
- [x] Conflict detection functional

---

## Dependencies

### Runtime Dependencies

```python
# Standard library
from typing import Optional, Dict, List, Tuple
from uuid import UUID
from pathlib import Path
import json
import re

# Third-party
import structlog  # Structured logging

# Internal
from app.repositories.blueprint_repo import BlueprintRepository
from app.schemas.blueprint import BlueprintCreate, BlueprintUpdate, BlueprintResponse
from app.models.blueprint import Blueprint
from app.errors import NotFoundError, BadRequestError
from .common import normalize_weights
```

### Dev Dependencies

```python
# Testing
pytest
pytest-cov
unittest.mock
```

---

## Next Steps

### Immediate (P0)

1. **Integration Testing**
   - Test with actual database
   - Verify repository integration
   - End-to-end validation flows

2. **StyleService Integration**
   - Update StyleService to use BlueprintService
   - Remove duplicate validation logic
   - Add blueprint-based tag validation

### Short-term (P1)

1. **LyricsService Integration**
   - Add section validation
   - Blueprint-based length checks

2. **ProducerNotesService Integration**
   - Validate arrangement constraints
   - Blueprint-based mix guidelines

### Long-term (P2)

1. **Enhanced Parsing**
   - Use markdown parser library
   - Extract more blueprint metadata
   - Support multiple markdown formats

2. **Distributed Caching**
   - Optional Redis integration
   - Cache synchronization across instances
   - TTL configuration

3. **Validation Enhancements**
   - Severity levels
   - Auto-fix suggestions
   - Fuzzy matching for tags

---

## Conclusion

Successfully implemented `BlueprintService` with all N6-9 and N6-10 requirements:

✅ **Blueprint Loading:** Complete markdown parsing and caching
✅ **Validation:** Rubric, tempo, sections, and tag conflicts
✅ **Performance:** Efficient in-memory caching
✅ **Error Handling:** Comprehensive error messages
✅ **Testing:** 20+ test cases covering all features
✅ **Documentation:** Complete docstrings and examples

**Total Implementation:**
- 880 lines of service code
- 400+ lines of tests
- 15 public methods
- All acceptance criteria met

The service is ready for integration with StyleService, LyricsService, and other entity services that require blueprint-based validation.
