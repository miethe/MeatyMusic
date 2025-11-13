# AMCS JSON Schemas

This directory contains JSON Schema definitions (Draft-07) for all AMCS entity types and the Song Design Spec (SDS).

## Overview

JSON schemas provide:
- **Validation**: Structural validation before database persistence
- **Documentation**: Self-documenting API contracts
- **Type Safety**: Schema validation complements Pydantic models
- **Determinism**: Enforce constraints critical for reproducible outputs

All schemas use JSON Schema Draft-07 (`http://json-schema.org/draft-07/schema#`).

## Schema Files

### Core Schemas

#### `sds.schema.json` - Song Design Spec (PRIMARY)
The master specification aggregating all entity definitions for a song.

**Purpose**: Single source of truth for workflow execution
**Required Fields**: `title`, `blueprint_ref`, `style`, `lyrics`, `producer_notes`, `sources`, `prompt_controls`, `render`, `seed`
**Key Validations**:
- Global seed must be non-negative integer
- Render engine must be one of: `suno`, `udio`, `none`, `external`
- Source weights should sum to ≤1.0
- Blueprint version follows `YYYY.MM` pattern

**Usage**:
```python
from app.services.validation_service import ValidationService

validator = ValidationService()
is_valid, errors = validator.validate_sds(sds_data)
if not is_valid:
    raise ValueError(f"SDS validation failed: {errors}")
```

### Entity Schemas

#### `style.schema.json` - Style Entity
Musical identity: genre, tempo, key, mood, energy, instrumentation.

**Key Validations**:
- BPM: 40-220 (single or [min, max] range)
- Key pattern: `^[A-G](#|b)?\s?(major|minor)$`
- Energy: `low`, `medium`, `high`, `anthemic`
- Instrumentation: max 3 items (avoid mix dilution)
- Time signature pattern: `^\d+/\d+$`

#### `lyrics.schema.json` - Lyrics Entity
Textual content with structural and stylistic constraints.

**Key Validations**:
- Language: ISO 639-1 code (e.g., `en`)
- POV: `1st`, `2nd`, `3rd`
- Tense: `past`, `present`, `future`, `mixed`
- Hook strategy: `melodic`, `lyrical`, `call-response`, `chant`
- Repetition policy: `sparse`, `moderate`, `hook-heavy`
- Syllables per line: 4-16
- Imagery density: 0-1
- Section order must include at least one section

#### `producer_notes.schema.json` - Producer Notes Entity
Arrangement structure, hooks, section metadata, mix targets.

**Key Validations**:
- Hooks: minimum 0
- Structure: non-empty string
- Section durations: positive integers
- Stereo width: `narrow`, `normal`, `wide`

#### `composed_prompt.schema.json` - Composed Prompt Entity
Final prompt text for music engines with metadata.

**Key Validations**:
- Text: 1-10,000 characters
- BPM: 40-220 or [min, max]
- Style max chars: 1-5,000
- Prompt max chars: 1-10,000

#### `blueprint.schema.json` - Blueprint & Rubric Entity
Genre-specific rules and evaluation rubric.

**Key Validations**:
- Version pattern: `^\d{4}\.\d{1,2}$` (e.g., `2025.11`)
- Tempo BPM: [min, max] array
- Rubric weights: 0-1 (should sum to 1.0)
- Thresholds: min_total and max_profanity (0-1)

#### `persona.schema.json` - Persona Entity
Artist/band profile with vocal characteristics and influences.

**Key Validations**:
- Kind: `artist` or `band`
- Name: 1-255 characters
- Voice: max 500 characters
- Vocal range: max 100 characters
- Policy settings for public release and living artist references

#### `source.schema.json` - Source Entity
External data source configuration for RAG.

**Key Validations**:
- Kind: `file`, `web`, `api`
- Weight: 0-1
- MCP server ID required
- Name: 1-255 characters

## Validation Strategy

### Schema Loading
Schemas are loaded once at ValidationService initialization and cached in memory:

```python
class ValidationService:
    def __init__(self):
        self.schemas = self._load_schemas()
```

### Error Formatting
Validation errors are formatted into human-readable messages:

```python
is_valid, errors = validator.validate_sds(data)
# errors: ["Missing required field: title", "global_seed must be non-negative"]
```

### Integration Points

1. **SongService**: Validates SDS before song creation
2. **API Endpoints**: Pre-flight validation before database operations
3. **Workflow Nodes**: Validate node outputs before persistence
4. **Testing**: Schema compliance tests for fixtures

## Schema References

Internal schema references use the `amcs://schemas/` URI scheme:
- `amcs://schemas/sds-1.0.json`
- `amcs://schemas/style-1.0.json`
- `amcs://schemas/lyrics-1.0.json`
- etc.

These references are resolved by the JSON schema validator when loading embedded definitions.

## Determinism Requirements

These schemas enforce determinism constraints:
- **Global seed**: Required non-negative integer
- **Version pinning**: Blueprint and SDS versions must be specified
- **Source citations**: Weight validation ensures reproducible blending
- **Character limits**: Engine-specific prompt limits prevent truncation variance

## Future Extensions

- **Schema versioning**: Support multiple SDS schema versions
- **Custom formats**: Add custom format validators (e.g., `chunk_hash`)
- **Conflict matrix**: Integrate tag conflict validation
- **Source normalization**: Validate source weights sum to 1.0

## Testing

Run schema validation tests:
```bash
pytest services/api/tests/unit/test_validation_service.py -v
```

## References

- JSON Schema Draft-07: https://json-schema.org/draft-07/schema
- AMCS Overview: `/docs/amcs-overview.md`
- PRDs: `/docs/project_plans/PRDs/`
- Phase 3 Plan: `/docs/project_plans/bootstrap-from-meatyprompts/phase-3-domain-model-migration.md`

---

**Created**: 2025-11-12
**Phase**: 3 (Week 2-3) - JSON Schema Validation
**Status**: Complete
