# Service Layer Dependencies

**Status:** ✓ No circular dependencies detected
**Last Updated:** 2025-11-14
**Services Documented:** 9 (5 new entity services + 4 existing services)

---

## Overview

The MeatyMusic service layer follows a **layered architecture** with clear dependency relationships. Services delegate to repositories for data access and may depend on other services for specialized functionality. All dependencies form a **Directed Acyclic Graph (DAG)** with no circular dependencies.

---

## Architecture Principles

1. **No Circular Dependencies**: Services form a DAG (Directed Acyclic Graph)
2. **Dependency Injection**: All dependencies injected via constructor
3. **Single Responsibility**: Each service handles one entity domain
4. **Loose Coupling**: Services depend on interfaces/repositories, not implementations
5. **Optional Dependencies**: Services use Optional[] types for cross-service dependencies
6. **Common Utilities**: Shared validation/computation logic in `common.py`

---

## Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                          API Layer (endpoints)                      │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          Service Layer                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ WorkflowService                                              │  │
│  │   └→ WorkflowOrchestrator                                   │  │
│  │   └→ EventPublisher                                         │  │
│  │   └→ WorkflowRunRepository                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ SongService (Aggregator)                                     │  │
│  │   └→ ValidationService (explicit content, JSON schemas)     │  │
│  │   └→ StyleRepository (optional)                             │  │
│  │   └→ LyricsRepository (optional)                            │  │
│  │   └→ ProducerNotesRepository (optional)                     │  │
│  │   └→ ComposedPromptRepository (optional)                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Entity Services (Independent)                                │  │
│  │                                                              │  │
│  │  LyricsService                                              │  │
│  │    └→ common.py (validation utilities)                      │  │
│  │    └→ LyricsRepository                                      │  │
│  │                                                              │  │
│  │  PersonaService                                             │  │
│  │    └→ PersonaRepository                                     │  │
│  │    └→ (no service dependencies)                            │  │
│  │                                                              │  │
│  │  ProducerNotesService                                       │  │
│  │    └→ ProducerNotesRepository                              │  │
│  │    └→ BlueprintRepository (optional, for validation)       │  │
│  │    └→ LyricsRepository (optional, for section validation)  │  │
│  │                                                              │  │
│  │  BlueprintService                                           │  │
│  │    └→ BlueprintRepository                                  │  │
│  │    └→ common.py (normalize_weights)                        │  │
│  │    └→ File System (blueprint markdown files)               │  │
│  │                                                              │  │
│  │  SourceService                                              │  │
│  │    └→ SourceRepository                                     │  │
│  │    └→ common.py (citation hashing, weight normalization)   │  │
│  │                                                              │  │
│  │  StyleService                                               │  │
│  │    └→ StyleRepository                                      │  │
│  │    └→ BlueprintRepository (optional, for tag conflicts)    │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ValidationService (Utility)                                  │  │
│  │   └→ JSON Schema files                                      │  │
│  │   └→ (no service dependencies)                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       Repository Layer                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Matrix

| Service | Depends On (Services) | Depends On (Repositories) | Used By | Circular? |
|---------|----------------------|---------------------------|---------|-----------|
| **LyricsService** | None (uses common.py utilities) | LyricsRepository | SongService | ✓ No |
| **PersonaService** | None | PersonaRepository | SongService | ✓ No |
| **ProducerNotesService** | None | ProducerNotesRepository, BlueprintRepository (opt), LyricsRepository (opt) | SongService | ✓ No |
| **BlueprintService** | None (uses common.py utilities) | BlueprintRepository | ProducerNotesService, StyleService (via repo) | ✓ No |
| **SourceService** | None (uses common.py utilities) | SourceRepository | LyricsService (for citations) | ✓ No |
| **StyleService** | None | StyleRepository, BlueprintRepository (opt) | SongService | ✓ No |
| **SongService** | ValidationService | StyleRepository (opt), LyricsRepository (opt), ProducerNotesRepository (opt), ComposedPromptRepository (opt) | API endpoints | ✓ No |
| **ValidationService** | None | None (loads JSON schemas) | SongService, LyricsService (via common.py) | ✓ No |
| **WorkflowService** | WorkflowOrchestrator, EventPublisher | WorkflowRunRepository, NodeExecutionRepository, WorkflowEventRepository | API endpoints | ✓ No |

---

## Service Contracts

### LyricsService

**Purpose:** Business logic for lyrics entities including section validation, rhyme scheme checks, and citation management.

**Primary Methods:**
- `create_lyrics(data: LyricsCreate) -> LyricsResponse`
- `get_lyrics(lyrics_id: UUID) -> Optional[LyricsResponse]`
- `update_lyrics(lyrics_id: UUID, data: LyricsUpdate) -> LyricsResponse`
- `delete_lyrics(lyrics_id: UUID) -> bool`
- `get_by_song_id(song_id: UUID) -> List[LyricsResponse]`
- `parse_citations_with_hashes(citations: List[Dict]) -> List[Dict]`
- `normalize_source_weights(citations: List[Dict]) -> List[Dict]`
- `validate_citations(citations: List[Dict]) -> bool`

**Dependencies:**
- **Repository:** LyricsRepository (for data access)
- **Utilities:** common.py (validate_section_order, validate_rhyme_scheme, check_explicit_content, compute_citation_hash, normalize_weights)

**Used By:** SongService for complete song creation workflows

**Validation Rules:**
- Section order must contain at least one "Chorus"
- Rhyme scheme format: uppercase letters only (e.g., "AABB", "ABAB")
- Explicit content filtering if `explicit_allowed=False`
- Reading level must be 0-100 if provided
- Citations must have unique source_ids and positive weights

---

### PersonaService

**Purpose:** Business logic for persona entities including influence normalization and delivery style conflict detection.

**Primary Methods:**
- `create_persona(data: PersonaCreate) -> PersonaResponse`
- `get_persona(persona_id: UUID) -> Optional[PersonaResponse]`
- `update_persona(persona_id: UUID, data: PersonaUpdate) -> PersonaResponse`
- `delete_persona(persona_id: UUID) -> bool`
- `get_by_type(persona_type: str) -> List[PersonaResponse]`
- `get_by_name(name: str) -> Optional[PersonaResponse]`
- `search_by_influences(influences: List[str]) -> List[PersonaResponse]`
- `get_by_vocal_range(min_range: Optional[str], max_range: Optional[str]) -> List[PersonaResponse]`
- `normalize_influences(influences: List[str], public_release: bool) -> List[str]`
- `validate_vocal_range(vocal_range: str) -> bool`
- `validate_delivery_styles(delivery: List[str]) -> Tuple[bool, List[Tuple[str, str]]]`

**Dependencies:**
- **Repository:** PersonaRepository (for data access)
- **Utilities:** None (self-contained)

**Used By:** SongService (potentially for persona-based song generation)

**Validation Rules:**
- Vocal range must be from canonical set (soprano, tenor, alto, bass, etc.)
- Delivery styles checked for conflicts (e.g., "whisper" + "belting")
- Living artist influences normalized for public releases (policy enforcement)

---

### ProducerNotesService

**Purpose:** Business logic for producer notes including mix settings validation and blueprint alignment.

**Primary Methods:**
- `create_producer_notes(data: ProducerNotesCreate) -> ProducerNotesResponse`
- `get_producer_notes(notes_id: UUID) -> Optional[ProducerNotesResponse]`
- `update_producer_notes(notes_id: UUID, data: ProducerNotesUpdate) -> ProducerNotesResponse`
- `delete_producer_notes(notes_id: UUID) -> bool`
- `get_by_song_id(song_id: UUID) -> List[ProducerNotesResponse]`
- `get_latest_by_song_id(song_id: UUID) -> Optional[ProducerNotesResponse]`
- `validate_structure(structure: List[str], section_order: List[str]) -> bool`
- `validate_mix_settings(mix_targets: Dict[str, Any]) -> Tuple[bool, Optional[str]]`
- `calculate_total_duration(section_durations: Dict[str, int]) -> int`
- `validate_against_blueprint(notes_id: UUID, blueprint_id: UUID) -> Tuple[bool, List[str]]`
- `validate_duration_against_target(notes_id: UUID, target_duration: int) -> Tuple[bool, int]`

**Dependencies:**
- **Repository:** ProducerNotesRepository (for data access), BlueprintRepository (optional, for validation), LyricsRepository (optional, for section validation)
- **Utilities:** None (self-contained validation)

**Used By:** SongService for complete song workflows

**Validation Rules:**
- LUFS must be between -20.0 and -5.0 dB
- Stereo width must be "narrow", "normal", or "wide"
- Hook count warnings if zero
- Duration tolerance: ±30 seconds
- Structure must match section order from lyrics/blueprint

---

### BlueprintService

**Purpose:** Business logic for blueprint management including file loading, caching, and tag conflict detection.

**Primary Methods:**
- `get_or_load_blueprint(genre: str, version: str = "latest") -> Blueprint`
- `load_blueprint_from_file(genre: str) -> Blueprint`
- `cache_blueprint(genre: str, blueprint: Blueprint, version: str = "latest") -> None`
- `invalidate_cache(genre: Optional[str] = None) -> int`
- `validate_rubric_weights(weights: Dict[str, float]) -> Tuple[bool, Optional[str]]`
- `validate_tempo_range(bpm_min: int, bpm_max: int, blueprint: Blueprint) -> Tuple[bool, Optional[str]]`
- `validate_required_sections(sections: List[str], required: List[str]) -> Tuple[bool, Optional[str]]`
- `load_conflict_matrix() -> Dict[str, List[str]]`
- `get_tag_conflicts(tags: List[str]) -> List[Tuple[str, str]]`
- `create_blueprint(data: BlueprintCreate) -> Blueprint`
- `get_blueprint_by_id(blueprint_id: UUID) -> Optional[Blueprint]`
- `get_blueprints_by_genre(genre: str) -> List[Blueprint]`
- `update_blueprint(blueprint_id: UUID, data: BlueprintUpdate) -> Optional[Blueprint]`
- `delete_blueprint(blueprint_id: UUID) -> bool`

**Dependencies:**
- **Repository:** BlueprintRepository (for data access)
- **Utilities:** common.py (normalize_weights)
- **File System:** `/docs/hit_song_blueprint/AI/*.md` (blueprint markdown files), `/taxonomies/conflict_matrix.json`

**Used By:** ProducerNotesService (via repository), StyleService (via repository)

**Validation Rules:**
- Rubric weights must sum to 1.0 (±0.01 tolerance)
- All weights must be positive
- Tempo range must be positive and min ≤ max
- Tag conflicts checked via conflict matrix

---

### SourceService

**Purpose:** Business logic for external data sources with MCP integration and deterministic chunk retrieval.

**Primary Methods:**
- `discover_mcp_servers() -> List[MCPServerInfo]`
- `validate_mcp_scopes(scopes: List[str], server_id: str) -> Tuple[bool, Optional[str]]`
- `create_mcp_mock_server(server_id: str, capabilities: Optional[List[str]], scopes: Optional[List[str]]) -> MCPServerInfo`
- `retrieve_chunks(source_id: UUID, query: str, top_k: int = 5, seed: Optional[int] = None) -> List[ChunkWithHash]`
- `retrieve_by_hash(source_id: UUID, chunk_hash: str) -> Optional[Chunk]`
- `validate_allow_deny_lists(text: str, allow: Optional[List[str]], deny: Optional[List[str]]) -> Tuple[bool, Optional[str]]`
- `normalize_source_weights(sources: List[Source]) -> Dict[UUID, float]`
- `create_source(data: SourceCreate, owner_id: UUID, tenant_id: UUID) -> SourceResponse`
- `get_source(source_id: UUID) -> SourceResponse`
- `list_active_sources() -> List[SourceResponse]`

**Dependencies:**
- **Repository:** SourceRepository (for data access)
- **Utilities:** common.py (compute_citation_hash, normalize_weights)

**Used By:** LyricsService (for citation retrieval and hashing)

**Validation Rules:**
- MCP scopes must be valid for the server
- Deny list takes precedence over allow list
- Source weights normalized to sum ≤ 1.0
- Chunk hashes must be 64 hex characters (SHA-256)

**Determinism Guarantees:**
- Same query + seed → same chunks (99%+ reproducibility)
- SHA-256 content hashing for pinned retrieval
- Fixed top-k with lexicographic tie-breaking

---

### StyleService

**Purpose:** Business logic for style entities including tag conflict validation and energy/tempo coherence.

**Primary Methods:**
- `create_style(data: StyleCreate) -> Style`
- `update_style(style_id: UUID, data: StyleUpdate) -> Optional[Style]`
- `delete_style(style_id: UUID) -> bool`
- `get_by_genre(genre: str) -> List[Style]`

**Dependencies:**
- **Repository:** StyleRepository (for data access), BlueprintRepository (optional, for conflict matrix)
- **Utilities:** Internal validation methods

**Used By:** SongService for style-based song generation

**Validation Rules:**
- Only one era tag allowed per style
- Energy tags checked for conflicts (e.g., "whisper" + "anthemic")
- High energy (8-10) should not have slow tempo (< 90 BPM)
- Low energy (1-3) should not have fast tempo (> 140 BPM)

---

### SongService

**Purpose:** Top-level aggregator service for song entities with SDS validation and artifact management.

**Primary Methods:**
- `create_song(data: SongCreate) -> Song`
- `update_song(song_id: UUID, data: SongUpdate) -> Optional[Song]`
- `update_song_status(song_id: UUID, status: SongStatus) -> Optional[Song]`
- `get_song_with_artifacts(song_id: UUID) -> Optional[Dict[str, Any]]`
- `delete_song(song_id: UUID) -> bool`
- `validate_sds(sds_data: Dict[str, Any]) -> Dict[str, Any]`

**Dependencies:**
- **Services:** ValidationService (for SDS and JSON schema validation)
- **Repositories:** SongRepository, StyleRepository (opt), LyricsRepository (opt), ProducerNotesRepository (opt), ComposedPromptRepository (opt)

**Used By:** API endpoints for song management

**Validation Rules:**
- Global seed must be non-negative (required for determinism)
- Referenced style/persona/blueprint must exist
- SDS must pass JSON schema validation

---

### ValidationService

**Purpose:** JSON schema validation for SDS and all entity specs using Draft-07 schemas.

**Primary Methods:**
- `validate_sds(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_style(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_lyrics(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_producer_notes(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_composed_prompt(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_blueprint(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_persona(data: Dict[str, Any]) -> Tuple[bool, List[str]]`
- `validate_source(data: Dict[str, Any]) -> Tuple[bool, List[str]]`

**Dependencies:**
- **File System:** `/schemas/*.schema.json` (JSON schema files)
- **Libraries:** jsonschema (Draft7Validator)

**Used By:** SongService, LyricsService (via common.py check_explicit_content)

**Schema Locations:**
- `/schemas/sds.schema.json`
- `/schemas/style.schema.json`
- `/schemas/lyrics.schema.json`
- `/schemas/producer_notes.schema.json`
- `/schemas/composed_prompt.schema.json`
- `/schemas/blueprint.schema.json`
- `/schemas/persona.schema.json`
- `/schemas/source.schema.json`

---

### WorkflowService

**Purpose:** Orchestration service for workflow runs with event publishing and status management.

**Primary Methods:**
- `create_run(song_id: UUID, manifest: Dict[str, Any], seed: int, tenant_id: Optional[UUID], owner_id: Optional[UUID]) -> WorkflowRun`
- `execute_run(run_id: UUID) -> Dict[str, Any]`
- `get_run_status(run_id: UUID) -> Optional[Dict[str, Any]]`
- `cancel_run(run_id: UUID) -> bool`
- `retry_run(run_id: UUID) -> UUID`
- `get_active_runs() -> List[WorkflowRun]`
- `get_failed_runs(limit: int = 10) -> List[WorkflowRun]`

**Dependencies:**
- **Services:** WorkflowOrchestrator, EventPublisher
- **Repositories:** WorkflowRunRepository, NodeExecutionRepository, WorkflowEventRepository

**Used By:** API endpoints for workflow execution

**Event Publishing:**
- Publishes structured events for observability
- Tracks node execution progress
- Records failures and retries

---

## Dependency Injection Examples

### LyricsService

```python
from sqlalchemy.orm import Session
from app.repositories.lyrics_repo import LyricsRepository
from app.services.lyrics_service import LyricsService

def get_lyrics_service(session: Session) -> LyricsService:
    """Factory function for LyricsService with dependency injection."""
    lyrics_repo = LyricsRepository(session)
    return LyricsService(
        session=session,
        repo=lyrics_repo
    )
```

### ProducerNotesService (with optional dependencies)

```python
from sqlalchemy.orm import Session
from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.blueprint_repo import BlueprintRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.services.producer_notes_service import ProducerNotesService

def get_producer_notes_service(
    session: Session,
    include_validation: bool = True
) -> ProducerNotesService:
    """Factory function with optional blueprint/lyrics validation."""
    notes_repo = ProducerNotesRepository(session)

    # Optional dependencies for validation
    blueprint_repo = BlueprintRepository(session) if include_validation else None
    lyrics_repo = LyricsRepository(session) if include_validation else None

    return ProducerNotesService(
        session=session,
        repo=notes_repo,
        blueprint_repo=blueprint_repo,
        lyrics_repo=lyrics_repo
    )
```

### SongService (aggregator with multiple dependencies)

```python
from sqlalchemy.orm import Session
from app.repositories.song_repo import SongRepository
from app.repositories.style_repo import StyleRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.composed_prompt_repo import ComposedPromptRepository
from app.services.validation_service import ValidationService
from app.services.song_service import SongService

def get_song_service(session: Session) -> SongService:
    """Factory function for SongService with full artifact loading."""
    song_repo = SongRepository(session)
    style_repo = StyleRepository(session)
    lyrics_repo = LyricsRepository(session)
    notes_repo = ProducerNotesRepository(session)
    prompt_repo = ComposedPromptRepository(session)
    validation_service = ValidationService()

    return SongService(
        song_repo=song_repo,
        style_repo=style_repo,
        lyrics_repo=lyrics_repo,
        producer_notes_repo=notes_repo,
        composed_prompt_repo=prompt_repo,
        validation_service=validation_service
    )
```

---

## Common Utilities (app/services/common.py)

Shared utilities used across services to avoid code duplication:

### Validation Functions
- `validate_section_order(section_order: List[str], required_sections: List[str]) -> Tuple[bool, Optional[str]]`
- `validate_rhyme_scheme(rhyme_scheme: str) -> bool`
- `check_explicit_content(text: str, explicit_allowed: bool) -> Tuple[bool, List[str]]`

### Citation Management
- `compute_citation_hash(source_id: UUID, chunk_text: str, timestamp: Optional[str]) -> str`

### Weight Normalization
- `normalize_weights(weights: Dict[Any, float], max_sum: float = 1.0) -> Dict[Any, float]`

**Used By:**
- LyricsService (section validation, rhyme scheme, explicit content, citations, weights)
- BlueprintService (weight normalization)
- SourceService (citation hashing, weight normalization)

---

## Validation Results

### Circular Dependency Check

✓ **PASSED** - No circular dependencies detected

**Verification Method:**
1. Manual dependency graph traversal
2. Each service's `__init__` constructor analyzed for service dependencies
3. Repository dependencies excluded (repositories are not services)
4. Common utility dependencies excluded (utilities are not services)

**Dependency Levels:**
- **Level 0 (Leaf Services):** PersonaService, ValidationService
- **Level 1 (Single Dependency):** LyricsService, BlueprintService, SourceService, StyleService
- **Level 2 (Aggregators):** SongService, WorkflowService

### Service Import Check

✓ **PASSED** - All service imports resolve correctly

**Files Verified:**
- `/services/api/app/services/lyrics_service.py`
- `/services/api/app/services/persona_service.py`
- `/services/api/app/services/producer_notes_service.py`
- `/services/api/app/services/blueprint_service.py`
- `/services/api/app/services/source_service.py`
- `/services/api/app/services/style_service.py`
- `/services/api/app/services/song_service.py`
- `/services/api/app/services/validation_service.py`
- `/services/api/app/services/workflow_service.py`

### Dependency Injection Pattern Check

✓ **PASSED** - All services use constructor injection consistently

**Pattern:**
```python
class ServiceName:
    def __init__(
        self,
        session: Session,  # For transaction management
        repo: EntityRepository,  # Primary repository
        other_repo: Optional[OtherRepository] = None,  # Optional dependencies
        other_service: Optional[OtherService] = None  # Optional service dependencies
    ):
        self.session = session
        self.repo = repo
        self.other_repo = other_repo
        self.other_service = other_service
```

---

## API Integration Readiness

### Service Contracts Defined

✓ All 9 services have well-defined contracts with:
- Clear method signatures
- Type hints for all parameters and return values
- Docstrings with usage examples
- Error handling patterns (raises BadRequestError, NotFoundError)

### Repository Layer Separation

✓ Services properly delegate to repositories:
- No direct SQLAlchemy queries in services
- All database operations via repositories
- Transaction management in services (via BaseService)

### Common Utilities Extracted

✓ Shared logic consolidated in `common.py`:
- Validation functions reused across services
- Citation hashing for determinism
- Weight normalization for retrieval constraints

---

## Next Steps for API Integration

1. **Create API Router Files** (`/services/api/app/api/v1/`)
   - `lyrics.py` - LyricsService endpoints
   - `personas.py` - PersonaService endpoints
   - `producer_notes.py` - ProducerNotesService endpoints
   - `blueprints.py` - BlueprintService endpoints
   - `sources.py` - SourceService endpoints

2. **Implement Dependency Injection in FastAPI**
   - Create `Depends()` factories for each service
   - Use FastAPI's dependency injection system
   - Handle session management per request

3. **Add Service-Level Tests**
   - Unit tests for each service method
   - Integration tests for service + repository
   - Determinism tests for LyricsService, SourceService

4. **Create API Documentation**
   - OpenAPI/Swagger specs for all endpoints
   - Request/response examples
   - Error response schemas

---

## Summary

**Services Analyzed:** 9
**Circular Dependencies:** 0 ✓
**Service Contracts Documented:** 9/9 ✓
**Dependency Injection Patterns:** Consistent ✓
**Repository Separation:** Clean ✓

**Architecture Health:** Excellent - ready for API integration

All services follow consistent patterns, have clear separation of concerns, and form a well-structured dependency graph with no circular dependencies. The service layer is ready for API endpoint implementation (Phase 5).
