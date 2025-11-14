# SDS Aggregation - Implementation Context

**Purpose**: Working context for all subagents implementing SDS aggregation across all phases

---

## Current State

**Branch**: claude/sds-aggregation-delegation-setup-01QvgCb4KEbEF1PuME8zZLLx
**Phase**: Initialization
**Last Updated**: 2025-11-14

---

## Implementation Scope

This implementation completes the #1 critical blocker for Phase 3 (Orchestration) by:

1. **SDS Compiler Service**: Transform entity references into validated, deterministic SDS JSON
2. **Song Creation Flow**: Complete POST /songs with SDS compilation and validation
3. **Blueprint Validation**: Enforce genre-specific BPM, section, and lexicon constraints
4. **Tag Conflict Resolution**: Implement conflict matrix enforcement logic
5. **Cross-Entity Validation**: Verify section matching, genre consistency, and reference integrity
6. **Source Weight Normalization**: Ensure source weights sum to 1.0

---

## Existing Infrastructure (Phase 1-2: 80% Complete)

**Already implemented**:
- Database models: Song, WorkflowRun (full ORM with relationships)
- Repository layer: SongRepository with RLS and entity fetching
- Base services: SongService with basic validation
- API endpoints: /songs CRUD operations
- Validation service: ValidationService with JSON schema support
- Schemas: Complete SDS schema at /schemas/sds.schema.json

**To be implemented (this plan)**:
- SDS Compiler service
- Blueprint constraint validator
- Tag conflict resolver
- Source weight normalizer
- Cross-entity consistency validator
- SDS hashing for determinism verification

---

## Key Architecture Patterns

Following MeatyMusic's layered architecture:
- **Routers**: FastAPI endpoints (app/api/v1/endpoints/)
- **Services**: Business logic (app/services/)
- **Repositories**: Data access with RLS (app/repositories/)
- **Models**: SQLAlchemy ORM (app/models/)
- **Schemas**: Pydantic DTOs (app/schemas/)

---

## Critical Requirements

### Determinism
- Global seed propagation through all operations
- Deterministic hashing for SDS verification
- Reproducible results (same input + seed → same output)

### Validation Layers
1. **JSON Schema**: Structural validation against /schemas/sds.schema.json
2. **Blueprint Constraints**: Genre-specific BPM, sections, lexicon
3. **Tag Conflicts**: Conflict matrix enforcement
4. **Cross-Entity**: Genre matching, section alignment, source citations

### Performance Targets
- SDS compilation: P95 < 500ms
- Full song creation: P95 < 2s
- Database queries: < 5 queries per song creation

---

## Success Criteria

- [ ] Song creation flow fully operational from API to database
- [ ] SDS compilation from entity references works deterministically
- [ ] All validation rules enforced (blueprint, conflicts, cross-entity)
- [ ] Tag conflicts resolved using conflict matrix
- [ ] Source weights normalized to sum to 1.0
- [ ] API returns clear error messages for validation failures
- [ ] 95%+ test coverage on service layer
- [ ] Phase 3 (Orchestration) unblocked

---

## Quick Reference

### Key Files
- **Schemas**: /schemas/sds.schema.json, /schemas/blueprint.schema.json
- **Conflict Matrix**: /taxonomies/conflict_matrix.json (to be created)
- **Blueprint PRD**: docs/project_plans/PRDs/blueprint.prd.md
- **SDS PRD**: docs/project_plans/PRDs/sds.prd.md

### Environment Setup
```bash
# API Development
export PYTHONPATH="$PWD/services/api"
cd services/api

# Run tests
uv run pytest

# Type checking
uv run mypy app
```

---

## Implementation Notes

_Subagents will add notes here as they progress through implementation_

### Phase 1 Notes

**SDS-001: Batch Entity Fetching - COMPLETED** (2025-11-14)

Added `get_with_all_entities_for_sds()` method to `SongRepository`:

**Implementation Details**:
- Location: `services/api/app/repositories/song_repo.py`
- Method: `get_with_all_entities_for_sds(song_id: UUID) -> Optional[dict]`
- Uses single query with `joinedload()` for optimal performance
- Eager loads: style, persona, blueprint, lyrics, producer_notes
- Applies RLS via `get_unified_guard(Song)` pattern
- Returns None if song not found or inaccessible
- Returns dictionary with all entities structured for SDS compilation

**Key Decisions**:
1. Used synchronous methods (not async) to match existing repository patterns
2. Followed existing RLS enforcement pattern with `UnifiedRowGuard`
3. Sources returned as empty list with TODO comment - awaits song_sources association table
4. Takes first lyrics/producer_notes from one-to-many relationships
5. Proper type hints: `Optional[dict]` return type with Dict, Any imports

**Relationship Handling**:
- `Song.style` - many-to-one (optional)
- `Song.persona` - many-to-one (optional)
- `Song.blueprint` - many-to-one (optional)
- `Song.lyrics` - one-to-many (returns list, extracted first)
- `Song.producer_notes` - one-to-many (returns list, extracted first)
- `Song.sources` - many-to-many (TODO: requires song_sources table)

**TODO for Next Phase**:
- Implement song_sources association table for many-to-many relationship
- Add `get_by_song_id()` method to `SourceRepository`
- Update `get_with_all_entities_for_sds()` to load sources via association

**Testing Notes**:
- Syntax validated successfully
- Ready for unit tests in Phase 4

### Phase 2 Notes
(To be populated)

### Phase 3 Notes

**SDS-006 & SDS-007: API Enhancement - COMPLETED** (2025-11-14)

Enhanced `POST /songs` endpoint and added `GET /songs/{id}/sds` endpoint:

**Implementation Details**:

1. **Enhanced POST /songs endpoint**:
   - Location: `services/api/app/api/v1/endpoints/songs.py`
   - Added service dependencies: SDSCompilerService, BlueprintValidatorService, CrossEntityValidator
   - Implemented 5-step compilation and validation flow:
     1. Create song record (await repo.create)
     2. Compile SDS from entity references (sds_compiler.compile_sds)
     3. Validate against blueprint constraints (blueprint_validator.validate_sds_against_blueprint)
     4. Validate cross-entity consistency (cross_entity_validator.validate_sds_consistency)
     5. Store compiled SDS in song.extra_metadata.compiled_sds
   - Rollback pattern: `await repo.delete(song.id)` on any validation failure
   - Comprehensive error handling with clear HTTP status codes
   - Structured logging for all steps using structlog

2. **Added GET /songs/{id}/sds endpoint**:
   - Path: `GET /songs/{song_id}/sds`
   - Query parameter: `recompile: bool = False`
   - Returns cached SDS from `song.extra_metadata.compiled_sds` by default
   - Forces recompilation when `recompile=True`
   - Returns raw SDS dictionary (not wrapped in response model)
   - Proper error handling: 404 for missing song, 400 for compilation errors
   - Logging for cache hits and compilation requests

**Dependency Injection**:
- Location: `services/api/app/api/dependencies.py`
- Added `get_sds_compiler_service()`: Injects all 7 repositories + validation service
- Added `get_blueprint_validator_service()`: Injects blueprint repository
- Added `get_cross_entity_validator()`: No dependencies (stateless)
- Updated `__all__` exports

**Service Exports**:
- Location: `services/api/app/services/__init__.py`
- Added exports for SDSCompilerService, BlueprintValidatorService

**Key Decisions**:

1. **Storage Location**: Compiled SDS stored in `song.extra_metadata.compiled_sds` (JSONB field)
   - Pros: No schema changes needed, easily accessible, versioned with song
   - Cons: Slightly larger song records

2. **Rollback Strategy**: Delete song on validation failure (atomicity)
   - Ensures no partially-validated songs exist in database
   - Clear error messages returned to client
   - All validation errors caught and rolled back

3. **Validation Order**: Blueprint → Cross-entity
   - Blueprint validation first (catches BPM, sections, banned terms)
   - Cross-entity validation second (checks consistency)
   - Both must pass before SDS is stored

4. **Error Messages**: Detailed, actionable error messages
   - "SDS compilation failed: Style specification is required but not found"
   - "Blueprint validation failed: BPM 180 outside blueprint range [80, 140]"
   - "Cross-entity validation failed: Genre mismatch: blueprint 'pop' != style 'rock'"

5. **Logging Strategy**: Structured logging with correlation IDs
   - Events: `song.create_start`, `sds.compile_start`, `sds.blueprint_validation_start`, etc.
   - Context: song_id, sds_hash, error details
   - Enables tracing full request lifecycle

**Sync/Async Pattern**:
- Followed existing codebase pattern: async endpoints calling sync repository methods
- Repository methods are synchronous but called with `await` (FastAPI compatibility)
- Service methods (compile_sds) are synchronous, validators have async methods
- Consistent with existing endpoints in the codebase

**HTTP Status Codes**:
- 201: Song created successfully with compiled SDS
- 200: SDS retrieved successfully
- 400: Validation failures (SDS compilation, blueprint, cross-entity)
- 404: Song or referenced entities not found

**Testing Notes**:
- Syntax validated successfully
- Ready for integration tests in Phase 4
- Test scenarios: successful creation, validation failures, rollback verification

**TODO for Phase 4**:
- Integration tests for complete flow
- Test all validation failure scenarios
- Test rollback behavior
- Test cached vs recompiled SDS
- Performance benchmarks

### Phase 4 Notes
(To be populated)

### Phase 5 Notes

**SDS-012: Algorithm Documentation - COMPLETED** (2025-11-14)

Created comprehensive algorithm documentation at `docs/algorithms/sds-compilation.md`:

**Documentation Contents**:
1. **Overview & Pipeline** - Complete compilation flow diagram showing all stages
2. **SDS Compilation Algorithm** - Step-by-step flow (7 steps) with pseudocode
3. **Source Weight Normalization** - Mathematical formula with 3 worked examples
4. **Tag Conflict Resolution** - Greedy algorithm with example showing tag dropping decisions
5. **Cross-Entity Validation** - 3 validation rules (genre, sections, citations) with flowchart
6. **Blueprint Constraint Enforcement** - 4 constraint types (BPM, sections, banned terms, line counts)
7. **Deterministic Hashing** - SHA-256 with canonical JSON canonicalization and field exclusion
8. **Integration Example** - End-to-end example showing all algorithms working together
9. **Performance Characteristics** - Time/space complexity for all operations
10. **References & Glossary** - Complete technical glossary and related documents

**Key Details**:
- 700+ lines of technical documentation
- 8+ concrete examples showing algorithm execution
- 5+ pseudocode implementations ready for engineering
- Mathematical formulas with notation for weight normalization
- ASCII art flowcharts for validation decision trees
- Determinism verification examples showing reproducibility
- Performance targets and complexity analysis

**Quality**:
- Technical language appropriate for engineers
- All pseudocode includes complete logic, not just sketches
- Every algorithm has worked examples showing inputs and outputs
- Cross-references to implementation files and PRDs
- Proper formatting with code blocks, tables, and diagrams
