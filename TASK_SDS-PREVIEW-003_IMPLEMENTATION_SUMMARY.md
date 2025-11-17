# Task SDS-PREVIEW-003 Implementation Summary

## Default Lyrics Generator - COMPLETE ✓

**Implementation Date:** 2025-11-17
**Task:** SDS-PREVIEW-003 - Default Lyrics Generator
**Effort:** 3 story points
**Status:** COMPLETE

---

## Overview

Successfully implemented the `LyricsDefaultGenerator` service that produces complete Lyrics entity data from blueprint rules. This generator fills in missing Lyrics fields when users haven't created Lyrics for their song, using genre-specific blueprint defaults and conventional song structure patterns.

---

## Implementation Summary

### Files Created/Modified

#### Primary Implementation
- **Created:** `/services/api/app/services/default_generators/lyrics_generator.py` (289 lines)
  - `LyricsDefaultGenerator` class with complete default generation logic
  - Genre-specific section order patterns for Pop, Hip-Hop, Rock, Country, R&B, Electronic, Indie, Alternative
  - Smart section order construction with intelligent insertion logic
  - Blueprint integration via `BlueprintReaderService`

#### Tests
- **Updated:** `/services/api/tests/services/default_generators/test_lyrics_generator.py` (678 lines)
  - 44 comprehensive unit tests
  - 97% code coverage (exceeds 95% requirement)
  - Tests cover all field generation, partial preservation, section order logic, determinism, and edge cases

#### Configuration
- **Updated:** `/services/api/app/services/default_generators/__init__.py`
  - Already exported `LyricsDefaultGenerator`

#### Bug Fixes
- **Fixed:** `/services/api/tests/conftest.py`
  - Corrected import path from `app.db.base` to `app.models.base`

---

## Key Features Implemented

### 1. Complete Lyrics Entity Generation

All required and optional fields with proper defaults:

```python
{
    "language": "en",                    # ISO 639-1 code
    "pov": "first-person",              # Point of view (schema-compliant)
    "tense": "present",                 # Verb tense
    "themes": [],                       # User should specify
    "rhyme_scheme": "AABB",             # Common pop rhyme pattern
    "meter": "4/4 pop",                 # Standard pop meter
    "syllables_per_line": 8,            # Common pop line length
    "hook_strategy": "repetition",      # Standard pop hook (schema-compliant)
    "repetition_rules": {               # Dict, not string (schema fix)
        "hook_count": 3,
        "allow_verbatim": True,
        "max_repeat": 4
    },
    "imagery_density": 5,               # 0-10 scale (schema-compliant)
    "reading_level": 80,                # 0-100 scale (schema-compliant)
    "section_order": [...],             # Genre-specific pattern
    "sections": [],                     # Empty - user should provide
    "constraints": {
        "explicit": False,
        "max_lines": 120,
        "section_requirements": {}      # From blueprint if available
    },
    "explicit_allowed": False,          # Added field (schema requirement)
    "source_citations": []              # Empty for defaults
}
```

### 2. Genre-Specific Section Order Patterns

Implemented conventional song structures for major genres:

- **Pop:** Intro → Verse → Chorus → Verse → Chorus → Bridge → Chorus → Outro
- **Hip-Hop:** Intro → Verse → Chorus → Verse → Chorus → Verse → Chorus → Outro (3 verses)
- **Rock:** Intro → Verse → Chorus → Verse → Chorus → Solo → Chorus → Outro
- **Country/R&B/Electronic/Indie/Alternative:** Standard pop pattern with variations

### 3. Intelligent Section Order Construction

The `_build_section_order_from_required()` method intelligently places sections:

- **Intro/Introduction:** Always at start (position 0)
- **Outro/Ending/Coda:** Always at end (append)
- **PreChorus/Pre-Chorus:** Before first Chorus
- **Custom sections:** Before last element (usually Outro) or append if empty

Ensures all blueprint `required_sections` are present in conventional order.

### 4. Blueprint Integration

Integrates with `BlueprintReaderService` to extract:
- `required_sections`: Sections that must be in the song
- `section_lines`: Line constraints per section (copied to `constraints.section_requirements`)
- Genre-specific conventions

Supports both:
- New flat BlueprintReaderService format
- Legacy "rules" structure (backward compatibility)

### 5. Partial Lyrics Preservation

User-provided fields always take priority:
1. User partial_lyrics field (highest priority)
2. Blueprint-specific value
3. Global default (fallback)

All partial data is preserved and merged with defaults.

### 6. Deterministic Output

**Zero randomness** - same inputs always produce identical outputs:
- No random values
- No timestamps
- No UUIDs
- Reproducible across all runs

**Verified:** 10 consecutive runs produce identical results (tested)

---

## Test Coverage

### Test Results
- **Total Tests:** 44
- **All Passing:** ✓
- **Coverage:** 97% (exceeds 95% requirement)
- **Missing Lines:** 2 (defensive fallback code, essentially unreachable)

### Test Categories

1. **Default Generation (3 tests)**
   - Pop, Christmas Pop, Hip-Hop genre defaults
   - All fields populated correctly
   - Blueprint data used properly

2. **Partial Lyrics Preservation (6 tests)**
   - Language, POV, tense, themes, rhyme scheme
   - Section order, constraints, source citations
   - Sections, explicit_allowed
   - All user values preserved

3. **Section Order Algorithm (9 tests)**
   - Required sections filtering
   - Genre-specific patterns
   - Custom section insertion
   - PreChorus positioning
   - Intro/Outro smart placement
   - Empty sections fallback

4. **Constraints Generation (4 tests)**
   - Default values
   - Blueprint section_lines integration
   - Empty when no section_lines
   - Partial override

5. **Repetition Rules (2 tests)**
   - Default rules generation
   - Partial merge with defaults

6. **Determinism (3 tests)**
   - Same input = same output
   - With partial lyrics
   - Section order consistency (10 runs)

7. **Error Handling (3 tests)**
   - Missing blueprint
   - Empty blueprint
   - Missing genre field

8. **Field Validation (10 tests)**
   - All required fields present
   - All optional fields have defaults
   - Field types match schema
   - Language code format (ISO 639-1)
   - POV, tense, hook_strategy enum values
   - Syllables, imagery_density, reading_level ranges

9. **Multiple Genres (2 tests)**
   - Consistency across genres
   - Genre-specific patterns (Pop, Hip-Hop, Rock)

10. **Edge Cases (4 tests)**
    - Lowercase intro/outro handling
    - Custom sections with empty initial order
    - No matching sections fallback

---

## Schema Corrections

Fixed several schema mismatches from initial implementation:

| Field | Old (Wrong) | New (Correct) | Reason |
|-------|-------------|---------------|---------|
| `pov` | "1st", "2nd", "3rd" | "first-person", "second-person", "third-person" | POV enum values |
| `hook_strategy` | "lyrical" | "repetition" | HookStrategy enum default |
| `repetition_policy` | String "moderate" | `repetition_rules` dict | Schema expects dict, not string |
| `imagery_density` | 0.5 (float 0-1) | 5 (int 0-10) | Schema specifies 0-10 range |
| `reading_level` | "grade-8" (string) | 80 (int 0-100) | Schema expects integer 0-100 |
| `sections` | Missing | [] (empty list) | Required field in schema |
| `explicit_allowed` | Missing | False (boolean) | Required field in schema |

---

## Integration Points

### Dependencies
- `BlueprintReaderService`: For blueprint data extraction
- `structlog`: Structured logging

### Used By
- **SDSCompilerService** (Task SDS-PREVIEW-006): Will call `generate_default_lyrics()` when `lyrics_id` is null and `use_defaults=True`

### Export
```python
from app.services.default_generators import LyricsDefaultGenerator

generator = LyricsDefaultGenerator()
lyrics = generator.generate_default_lyrics(blueprint, partial_lyrics)
```

---

## Example Usage

### Basic Usage (No Partial Data)
```python
generator = LyricsDefaultGenerator()

blueprint = {
    "genre": "Pop",
    "required_sections": ["Verse", "Chorus", "Bridge"]
}

lyrics = generator.generate_default_lyrics(blueprint)
# Returns complete Lyrics dict with all defaults
```

### With Partial Lyrics
```python
partial_lyrics = {
    "language": "es",
    "themes": ["amor", "pérdida"],
    "pov": "third-person"
}

lyrics = generator.generate_default_lyrics(blueprint, partial_lyrics)
# User values preserved, missing fields filled with defaults
```

### With Blueprint Section Constraints
```python
blueprint = {
    "genre": "Hip-Hop",
    "required_sections": ["Verse", "Chorus"],
    "section_lines": {
        "Verse": {"min_lines": 8, "max_lines": 16},
        "Chorus": {"min_lines": 4, "max_lines": 8, "must_end_with_hook": True}
    }
}

lyrics = generator.generate_default_lyrics(blueprint)
# Section requirements copied to constraints.section_requirements
```

---

## Verification

### Determinism Verification
```bash
$ cd /home/user/MeatyMusic/services/api
$ uv run python << 'EOF'
from app.services.default_generators.lyrics_generator import LyricsDefaultGenerator

g = LyricsDefaultGenerator()
blueprint = {'genre': 'Pop', 'required_sections': ['Verse', 'Chorus', 'Bridge']}

results = [g.generate_default_lyrics(blueprint) for _ in range(10)]
all_same = all(r == results[0] for r in results)
print(f'Determinism test: {"PASS" if all_same else "FAIL"}')
EOF

# Output: Determinism test: PASS ✓
```

### Test Execution
```bash
$ cd /home/user/MeatyMusic/services/api
$ uv run pytest tests/services/default_generators/test_lyrics_generator.py -v

# Output: 44 passed in 0.35s ✓
```

### Coverage Report
```bash
$ uv run pytest tests/services/default_generators/test_lyrics_generator.py \
    --cov=app.services.default_generators.lyrics_generator \
    --cov-report=term-missing

# Output:
# app/services/default_generators/lyrics_generator.py    64      2    97%
```

---

## Acceptance Criteria - ALL MET ✓

- [x] `LyricsDefaultGenerator` generates complete Lyrics object from blueprint
- [x] Uses blueprint required sections in standard order
- [x] Preserves user-provided fields if `partial_lyrics` exists
- [x] Returns deterministic defaults (same inputs = same output)
- [x] Unit tests with 97% coverage (exceeds 95% requirement)
- [x] All field generation logic tested
- [x] Partial lyrics data preservation tested
- [x] Section order construction for all genres tested
- [x] Edge cases tested (missing blueprint fields, invalid data, custom sections)
- [x] Type hints on all methods
- [x] Structured logging added
- [x] Exported in `__init__.py`

---

## Known Limitations

1. **Blueprint Section Lines:** `BlueprintReaderService` doesn't currently extract `section_lines` from markdown blueprints. The generator supports it if blueprint contains this field, but it must be added manually to blueprint dict for now.

2. **Unreachable Code:** Lines 245-250 (empty section_order fallback) are defensive but unreachable with current logic. The custom section insertion ensures section_order is never empty after processing.

3. **Themes Default:** Empty by default - user should always specify thematic content for meaningful lyrics.

---

## Next Steps

1. **Integration:** Task SDS-PREVIEW-006 will integrate this generator into `SDSCompilerService`
2. **Blueprint Enhancement:** Consider updating `BlueprintReaderService` to extract `section_lines` from blueprint markdown
3. **Validation:** Consider adding Pydantic model validation for generated lyrics dict

---

## Files Modified

```
services/api/app/services/default_generators/
├── __init__.py                     # Already exported LyricsDefaultGenerator
└── lyrics_generator.py             # NEW: Complete implementation (289 lines)

services/api/tests/services/default_generators/
└── test_lyrics_generator.py        # UPDATED: 44 tests, 97% coverage (678 lines)

services/api/tests/
└── conftest.py                     # FIXED: Import path correction
```

---

## Conclusion

Task SDS-PREVIEW-003 is **COMPLETE** and ready for integration. The `LyricsDefaultGenerator`:

- ✓ Generates complete, schema-compliant Lyrics entities
- ✓ Uses genre-specific section patterns from blueprints
- ✓ Preserves user-provided partial data
- ✓ Is fully deterministic (no randomness)
- ✓ Has 97% test coverage (exceeds requirement)
- ✓ Follows all MeatyMusic Python patterns
- ✓ Ready for use in SDSCompilerService

**Status:** READY FOR TASK SDS-PREVIEW-006 INTEGRATION
