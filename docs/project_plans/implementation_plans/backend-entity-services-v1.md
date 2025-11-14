# Implementation Plan: Missing Entity Services (WP-N6)

**Plan Version**: 1.0
**Created**: 2025-11-14
**Complexity Level**: Medium (M)
**Track**: Standard
**Estimated Effort**: 21 Story Points
**Timeline**: 2 weeks (1-week critical path with parallelization)
**Target Completion**: 2025-11-28

---

## Executive Summary

This implementation plan addresses WP-N6 from NEXT-STEPS-REPORT.md: the creation of 5 missing entity services that provide business logic, transaction management, and validation for the MeatyMusic API.

**Current State**: API endpoints bypass the service layer and call repositories directly, missing complex validation, transaction management, and domain logic.

**Desired State**: Complete service layer with business logic, proper error handling, and integration with existing repositories.

**Impact**:
- Enables complex orchestration workflows (VALIDATE, FIX nodes)
- Improves code maintainability and testability
- Provides transaction boundaries for multi-step operations
- Centralizes business logic validation

**Assigned Agents**:
- `python-backend-engineer` - Primary implementation
- `backend-architect` - Architecture validation
- `data-layer-expert` - Data access patterns and optimization

---

## Complexity Assessment

### Classification: **MEDIUM (M)**

**Factors**:
- **Components**: 5 services (lyrics, persona, producer_notes, blueprint, source)
- **Task Count**: 18-22 tasks (implementation + tests + integration)
- **Duration**: 2 weeks (1 week critical path with parallelization)
- **Dependencies**: Moderate (services depend on repos, but largely independent of each other)
- **Risk Level**: Low-to-Medium (patterns exist, clear requirements)

**Complexity Breakdown**:
- 5 services × 3 story points (implementation) = 15 SP
- Testing infrastructure + integration = 4 SP
- API endpoint updates + documentation = 2 SP
- **Total: 21 Story Points**

### Scoring Rationale

**Factors Increasing Complexity**:
- Multiple validation rules per service (section validation, normalization)
- Integration with external systems (MCP, blueprints)
- Citation management and hashing (determinism requirements)
- Transaction management across multiple operations

**Factors Decreasing Complexity**:
- Clear patterns from existing services (style_service.py, song_service.py)
- All repositories already exist and are tested
- Schemas and models already defined
- Well-documented requirements in PRDs

---

## Workflow Track: Standard

The **Standard Track** is appropriate for this Medium complexity project. It includes:

1. **Phase 1**: Requirements analysis and service architecture design
2. **Phase 2**: Parallel implementation of services (with dependency mapping)
3. **Phase 3**: Risk assessment and mitigation planning
4. **Phase 4**: Layer sequencing and service orchestration
5. **Phase 5**: Testing and integration validation
6. **Phase 6**: API endpoint updates and documentation

### Key Activities by Track

**Haiku-Powered Agents** (All Phases):
- Story creation and acceptance criteria
- Effort estimation
- Linear task formatting
- Validation checking

**Sonnet-Powered Agents** (Standard Track):
- Dependency mapping between services
- Risk assessment and mitigation
- Layer sequencing for MeatyMusic architecture
- Service interface design

**Opus-Powered Agents** (Full Track Only):
- Not applicable for this project

---

## Requirements Analysis

### From NEXT-STEPS-REPORT.md (WP-N6)

**Services to Implement**:

1. **lyrics_service.py**
   - Section validation
   - Rhyme scheme parsing and validation
   - Citation management (pinned hashes for determinism)
   - Explicit content filtering

2. **persona_service.py**
   - Influence normalization (remove named artists on public release)
   - Vocal range validation
   - Delivery style conflict detection
   - Default style/lyrics application

3. **producer_notes_service.py**
   - Structure validation (section alignment with lyrics)
   - Blueprint alignment checks (tempo, instrumentation)
   - Hook count validation
   - Mix settings validation

4. **blueprint_service.py**
   - Genre blueprint loading from files
   - Rubric configuration and validation
   - Constraint validation (tempo ranges, required sections)
   - Tag conflict matrix loading

5. **source_service.py**
   - MCP server integration and discovery
   - Chunk retrieval with pinned content hashes
   - Allow/deny list enforcement
   - Weight normalization

### From PRD-REQUIREMENTS-SUMMARY.md

**Key Requirements**:
- Transaction management for atomic operations
- DTO transformation (database models → API responses)
- Business logic validation before persistence
- Integration with existing repositories
- Error handling with ErrorResponse envelope
- Proper logging for observability
- Determinism support (seed propagation, pinned retrieval)

### MeatyMusic Architecture Layer Sequencing

Services fit into the MeatyMusic layered architecture:

```
┌─────────────────────────────────────┐
│ API Layer (endpoints)               │
├─────────────────────────────────────┤
│ Service Layer (business logic) ← WP-N6 Implementation
├─────────────────────────────────────┤
│ Repository Layer (data access)      │ (Already exists)
├─────────────────────────────────────┤
│ Model Layer (entities)              │ (Already exists)
├─────────────────────────────────────┤
│ Database Layer (PostgreSQL)         │ (Already exists)
└─────────────────────────────────────┘
```

---

## Phase Breakdown

### Phase 1: Service Infrastructure & Patterns (1 day)

**Goal**: Establish shared patterns and utilities for all services

**Tasks**:

| ID | Task | Owner | Effort | Status |
|----|------|-------|--------|--------|
| 1.1 | Create base service class with transaction support | backend-architect | 2 SP | Planned |
| 1.2 | Define service dependency injection patterns | python-backend-engineer | 1 SP | Planned |
| 1.3 | Create shared validation utilities | python-backend-engineer | 1 SP | Planned |
| 1.4 | Document service contract patterns | backend-architect | 1 SP | Planned |

**Deliverables**:
- `/services/api/app/services/base_service.py` - Abstract base class with transaction context
- `/services/api/app/services/common.py` - Shared validation, DTO transformation utilities
- Service interface documentation in `/services/api/app/services/README.md`

**Acceptance Criteria**:
- [ ] Base service class provides transaction boundary management
- [ ] Shared utilities include citation validation, normalization functions
- [ ] All services can inherit from base class
- [ ] Error handling is consistent across services

---

### Phase 2: Parallel Service Implementation (5 days)

**Goal**: Implement all 5 services with business logic and validation

Services can be implemented in parallel as they have minimal cross-dependencies:

#### Service 1: LyricsService (2 SP)

**Location**: `/services/api/app/services/lyrics_service.py`

**Responsibilities**:
- Section validation (verify section_order contains at least one "Chorus")
- Rhyme scheme parsing and validation
- Citation management with SHA-256 hashing for determinism
- Syllable counting and validation per line
- Explicit content filtering (apply profanity filter if explicit_allowed=False)
- Source citation weight normalization

**Key Methods**:
```python
class LyricsService:
    async def create_lyrics(data: LyricsCreate) -> Lyrics
    async def update_lyrics(lyrics_id: UUID, data: LyricsUpdate) -> Lyrics
    async def validate_sections(section_order: List[str]) -> bool
    async def validate_rhyme_scheme(text: str, scheme: str) -> bool
    async def parse_citations_with_hashes(citations: List[Citation]) -> List[CitationWithHash]
    async def normalize_source_weights(citations: List[Citation]) -> List[Citation]
    async def validate_explicit_content(text: str, explicit_allowed: bool) -> bool
```

**Business Logic**:
- Section validation: Chorus must appear at least once
- Citation tracking: Store SHA-256 hash of each source chunk for reproducibility
- Profanity filtering: Apply filter if explicit_allowed=False (integration with validation_service)
- Weight normalization: Ensure source_citations weights sum to ≤1.0

**Testing Strategy**:
- Unit tests for each validation method
- Integration tests for create/update with multiple citations
- Determinism tests: Same lyrics + seed produce identical citation hashes

---

#### Service 2: PersonaService (2 SP)

**Location**: `/services/api/app/services/persona_service.py`

**Responsibilities**:
- Influence normalization (remove named living artists on public_release=True)
- Vocal range validation (soprano, alto, tenor, baritone, etc.)
- Delivery style conflict detection (warn on "whisper" + "belting")
- Default style/lyrics application to songs
- Policy enforcement (disallow_named_style_of flag)

**Key Methods**:
```python
class PersonaService:
    async def create_persona(data: PersonaCreate) -> Persona
    async def update_persona(persona_id: UUID, data: PersonaUpdate) -> Persona
    async def normalize_influences(influences: List[str], public_release: bool) -> List[str]
    async def validate_vocal_range(vocal_range: str) -> bool
    async def validate_delivery_styles(delivery: List[str]) -> bool
    async def apply_persona_defaults(persona_id: UUID, song_id: UUID) -> Song
```

**Business Logic**:
- Influence normalization: If public_release=True, convert "style of [Artist]" → "[Artist]-inspired sound"
- Vocal range validation: Verify against canonical ranges (soprano, mezzo-soprano, alto, tenor, baritone, bass)
- Delivery conflict detection: Flag incompatible delivery styles (whisper + belting)
- Policy enforcement: If disallow_named_style_of=True, reject "style of [Living Artist]" in any context

**Testing Strategy**:
- Unit tests for normalization logic
- Integration tests for persona application to songs
- Policy violation detection tests

---

#### Service 3: ProducerNotesService (2 SP)

**Location**: `/services/api/app/services/producer_notes_service.py`

**Responsibilities**:
- Structure validation (verify sections match lyrics section_order)
- Blueprint alignment checks (instrumentation vs style, hooks per structure)
- Hook count validation (warn if zero)
- Mix settings validation (LUFS, stereo width)
- Target duration calculation and validation

**Key Methods**:
```python
class ProducerNotesService:
    async def create_producer_notes(data: ProducerNotesCreate) -> ProducerNotes
    async def update_producer_notes(notes_id: UUID, data: ProducerNotesUpdate) -> ProducerNotes
    async def validate_structure(structure: str, section_order: List[str]) -> bool
    async def validate_against_blueprint(notes: ProducerNotes, blueprint_id: UUID) -> bool
    async def validate_mix_settings(mix: MixSettings) -> bool
    async def calculate_total_duration(section_meta: Dict[str, SectionMeta]) -> int
    async def align_with_style(notes: ProducerNotes, style_id: UUID) -> bool
```

**Business Logic**:
- Structure alignment: All sections in section_meta must appear in structure
- Blueprint validation: Hooks count ≥ minimum for blueprint genre
- Mix validation: LUFS in range [-20.0, -5.0], stereo_width in [narrow, normal, wide]
- Duration validation: Sum of section durations ±30s from total target duration

**Testing Strategy**:
- Unit tests for each validation method
- Integration tests with lyrics and blueprint
- Boundary condition tests (zero hooks, misaligned sections)

---

#### Service 4: BlueprintService (2 SP)

**Location**: `/services/api/app/services/blueprint_service.py`

**Responsibilities**:
- Genre blueprint loading from `/docs/hit_song_blueprint/AI/` directory
- Rubric configuration (weights, thresholds) validation
- Constraint validation (tempo ranges, required sections, banned terms)
- Tag conflict matrix loading from `/taxonomies/conflict_matrix.json`
- Blueprint caching for performance

**Key Methods**:
```python
class BlueprintService:
    async def get_or_load_blueprint(genre: str, version: str) -> Blueprint
    async def validate_blueprint_rules(rules: BlueprintRules) -> bool
    async def validate_rubric_weights(weights: Dict[str, float]) -> bool
    async def validate_tempo_range(bpm_min: int, bpm_max: int, blueprint: Blueprint) -> bool
    async def get_tag_conflicts(tags: List[str]) -> List[Tuple[str, str]]
    async def load_conflict_matrix() -> Dict[str, List[str]]
    async def validate_required_sections(sections: List[str], required: List[str]) -> bool
```

**Business Logic**:
- Blueprint loading: Read from markdown files and cache in memory/Redis
- Rubric validation: Weights must sum to 1.0 (normalized in UI)
- Constraint validation: Tempo ranges honored, required sections enforced
- Conflict matrix: Load from JSON, validate against style tags

**Testing Strategy**:
- Unit tests for blueprint loading and validation
- Integration tests with style service (use blueprint in tag validation)
- Cache invalidation tests
- Schema conformance tests

---

#### Service 5: SourceService (2 SP)

**Location**: `/services/api/app/services/source_service.py`

**Responsibilities**:
- MCP server discovery and integration
- Chunk retrieval with pinned content hashes for determinism
- Allow/deny list enforcement
- Weight normalization across multiple sources
- Provenance tracking (source ID, chunk hash, timestamp)

**Key Methods**:
```python
class SourceService:
    async def create_source(data: SourceCreate) -> Source
    async def discover_mcp_servers() -> List[MCPServerInfo]
    async def retrieve_chunks(source_id: UUID, query: str, top_k: int = 5) -> List[ChunkWithHash]
    async def retrieve_by_hash(source_id: UUID, chunk_hash: str) -> Optional[Chunk]
    async def validate_allow_deny_lists(text: str, allow: List[str], deny: List[str]) -> bool
    async def normalize_source_weights(sources: List[Source]) -> List[Source]
    async def validate_mcp_scopes(scopes: List[str], server_id: str) -> bool
```

**Business Logic**:
- MCP integration: Query MCP servers for chunk retrieval
- Pinned retrieval: Each chunk identified by content hash (SHA-256) for reproducibility
- Allow/deny enforcement: Filter chunks against allow/deny lists
- Weight normalization: Ensure weights sum to 1.0
- Provenance tracking: Include source_id, chunk_hash, timestamp in citations

**Testing Strategy**:
- Unit tests for allow/deny validation
- Integration tests with MCP server mocking
- Determinism tests: Same query + hash returns identical chunk
- Weight normalization tests

---

### Phase 3: Testing & Validation (3 days)

**Goal**: Comprehensive testing of all services with focus on determinism and integration

**Tasks**:

| ID | Task | Owner | Effort | Status |
|----|------|-------|--------|--------|
| 3.1 | Create unit tests for all services (85+ tests) | python-backend-engineer | 3 SP | Planned |
| 3.2 | Create integration tests for service interactions | python-backend-engineer | 2 SP | Planned |
| 3.3 | Create determinism validation tests | data-layer-expert | 1 SP | Planned |
| 3.4 | Run test coverage analysis (target ≥80%) | python-backend-engineer | 1 SP | Planned |

**Test Files to Create**:
- `/services/api/app/tests/test_lyrics_service.py` (15+ tests)
- `/services/api/app/tests/test_persona_service.py` (12+ tests)
- `/services/api/app/tests/test_producer_notes_service.py` (12+ tests)
- `/services/api/app/tests/test_blueprint_service.py` (15+ tests)
- `/services/api/app/tests/test_source_service.py` (12+ tests)
- `/services/api/tests/integration_test_services.py` (integration tests)

**Acceptance Criteria**:
- [ ] All unit tests pass (85+ tests)
- [ ] Code coverage ≥80% for service layer
- [ ] Integration tests validate cross-service interactions
- [ ] Determinism tests pass (same input → same output)
- [ ] No flaky tests (run 5× with consistent results)

---

### Phase 4: Service Layer Sequencing (1 day)

**Goal**: Validate services fit into MeatyMusic architecture and workflow

**Tasks**:

| ID | Task | Owner | Effort | Status |
|----|------|-------|--------|--------|
| 4.1 | Map service interdependencies | backend-architect | 1 SP | Planned |
| 4.2 | Validate layer sequencing (DB → Repo → Service → API) | backend-architect | 1 SP | Planned |
| 4.3 | Document service contract interfaces | backend-architect | 1 SP | Planned |

**Deliverables**:
- Dependency graph (services → repositories → models)
- Layer sequencing diagram
- Service interface documentation

**Acceptance Criteria**:
- [ ] No circular dependencies between services
- [ ] Each service has clear, defined contract
- [ ] Services properly delegate to repositories
- [ ] Transaction boundaries are clear

---

### Phase 5: API Endpoint Integration (2 days)

**Goal**: Update API endpoints to use services instead of direct repository calls

**Tasks**:

| ID | Task | Owner | Effort | Status |
|----|------|-------|--------|--------|
| 5.1 | Update lyrics endpoints to use lyrics_service | python-backend-engineer | 1 SP | Planned |
| 5.2 | Update personas endpoints to use persona_service | python-backend-engineer | 1 SP | Planned |
| 5.3 | Update producer_notes endpoints to use producer_notes_service | python-backend-engineer | 1 SP | Planned |
| 5.4 | Update blueprints endpoints to use blueprint_service | python-backend-engineer | 1 SP | Planned |
| 5.5 | Update sources endpoints to use source_service | python-backend-engineer | 1 SP | Planned |

**Files to Update**:
- `/services/api/app/api/v1/endpoints/lyrics.py`
- `/services/api/app/api/v1/endpoints/personas.py`
- `/services/api/app/api/v1/endpoints/producer_notes.py`
- `/services/api/app/api/v1/endpoints/blueprints.py`
- `/services/api/app/api/v1/endpoints/sources.py`

**Pattern Change**:
```python
# Before (direct repo call)
@router.post("")
async def create_lyrics(
    lyrics_data: LyricsCreate,
    repo: LyricsRepository = Depends(get_lyrics_repository),
) -> LyricsResponse:
    lyrics = await repo.create(lyrics_data.model_dump())
    return LyricsResponse.model_validate(lyrics)

# After (via service)
@router.post("")
async def create_lyrics(
    lyrics_data: LyricsCreate,
    service: LyricsService = Depends(get_lyrics_service),
) -> LyricsResponse:
    lyrics = await service.create_lyrics(lyrics_data)
    return LyricsResponse.model_validate(lyrics)
```

**Acceptance Criteria**:
- [ ] All endpoints updated to use services
- [ ] Business logic validation enforced at service layer
- [ ] Error handling consistent across endpoints
- [ ] API contracts remain unchanged (backward compatible)

---

### Phase 6: Documentation & Cleanup (1 day)

**Goal**: Document services and update project documentation

**Tasks**:

| ID | Task | Owner | Effort | Status |
|----|------|-------|--------|--------|
| 6.1 | Document each service with docstrings | python-backend-engineer | 1 SP | Planned |
| 6.2 | Update README files with service patterns | backend-architect | 1 SP | Planned |
| 6.3 | Create service integration guide | backend-architect | 1 SP | Planned |

**Deliverables**:
- Comprehensive docstrings in all service files
- `/services/api/app/services/README.md` update
- `/docs/backend-service-layer-guide.md` - Integration guide for future developers

**Acceptance Criteria**:
- [ ] All public methods have docstrings
- [ ] Service patterns documented clearly
- [ ] Integration guide covers all 5 services
- [ ] Examples provided for common operations

---

## Dependency Mapping

### Service Dependencies

```
┌─────────────────────────────────────────────┐
│ lyrics_service                              │
│ - depends on: lyrics_repo, sources          │
│ - used by: LYRICS workflow node, API        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ persona_service                             │
│ - depends on: persona_repo, style_repo      │
│ - used by: Persona workflow, API            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ producer_notes_service                      │
│ - depends on: producer_notes_repo, blueprint_service, style_repo
│ - used by: PRODUCER workflow node, API      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ blueprint_service                           │
│ - depends on: blueprint_repo, filesystem    │
│ - used by: All validation nodes, API        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ source_service                              │
│ - depends on: source_repo, MCP integration  │
│ - used by: LYRICS workflow node, API        │
└─────────────────────────────────────────────┘
```

### Execution Sequence

**Parallel Execution** (Services 1-5 can be developed in parallel):

```
Week 1, Day 1-2:
  └─ Phase 1: Service Infrastructure (base class, utilities)

Week 1, Day 2-5:
  ├─ Phase 2a: LyricsService
  ├─ Phase 2b: PersonaService (parallel)
  ├─ Phase 2c: ProducerNotesService (parallel)
  ├─ Phase 2d: BlueprintService (parallel)
  └─ Phase 2e: SourceService (parallel)

Week 1, Day 5 - Week 2, Day 2:
  └─ Phase 3: Testing & Validation (interdependent on Phase 2)

Week 2, Day 2-3:
  └─ Phase 4: Service Layer Sequencing

Week 2, Day 3-4:
  └─ Phase 5: API Endpoint Integration

Week 2, Day 4-5:
  └─ Phase 6: Documentation
```

**Critical Path**:
- Phase 1 (1 day) → Phase 2 (3 days parallel) → Phase 3 (1 day) = 5 days minimum

---

## Risk Assessment

### High-Risk Items

#### 1. Determinism in Source Retrieval

**Risk**: Source chunks retrieved with different hashes on re-run (non-deterministic)

**Probability**: Medium (20-30%)

**Impact**: Violates core MeatyMusic determinism requirement, breaks reproducibility tests

**Mitigation**:
- Use content hash (SHA-256) as pinned identifier, not relevance score
- Fixed top-k retrieval (no dynamic trimming)
- Lexicographic sorting for tie-breaking
- Comprehensive determinism unit tests for SourceService
- Integration tests with MCP mocking

**Responsibility**: data-layer-expert

**Timeline**: Complete determinism tests by end of Phase 3

---

#### 2. Citation Hash Computation

**Risk**: Citation hashes computed differently in lyrics_service vs validation/compose nodes

**Probability**: Low (10-15%)

**Impact**: Breaks citation tracking and provenance

**Mitigation**:
- Define citation hash computation in shared utilities (common.py)
- Use consistent SHA-256 algorithm across all services
- Unit tests for hash stability
- Integration tests comparing service vs node execution

**Responsibility**: data-layer-expert

**Timeline**: Complete by end of Phase 1

---

#### 3. Blueprint Loading Performance

**Risk**: Blueprint loading from markdown files is slow, impacts workflow latency

**Probability**: Low (10%)

**Impact**: Violates latency gate (P95 ≤60s for Plan→Prompt)

**Mitigation**:
- Cache blueprints in memory after first load
- Pre-load common genre blueprints on startup
- Monitor blueprint_service performance in tests
- Consider moving to database if latency becomes issue

**Responsibility**: backend-architect, data-layer-expert

**Timeline**: Monitor during Phase 3 testing

---

#### 4. MCP Server Integration Reliability

**Risk**: MCP server integration fails or is unavailable during testing

**Probability**: Medium (25%)

**Impact**: Source service tests cannot run, blocks Phase 3

**Mitigation**:
- Create mock MCP server for testing
- Implement graceful fallback for missing MCP
- Unit tests use mocked retrieval
- Integration tests use both mock and real servers (if available)

**Responsibility**: python-backend-engineer

**Timeline**: Complete mock implementation by start of Phase 3

---

### Medium-Risk Items

#### 5. Cross-Service Validation Consistency

**Risk**: Different services validate the same constraint differently

**Probability**: Medium (20%)

**Impact**: Inconsistent behavior across API, confusing for clients

**Mitigation**:
- Centralize shared validation in common.py
- Establish validation contracts in service documentation
- Comprehensive integration tests
- Code reviews across services

**Responsibility**: backend-architect

**Timeline**: Complete by Phase 4

---

#### 6. Transaction Boundary Clarity

**Risk**: Services don't properly manage transactions, leading to partial failures

**Probability**: Low (10%)

**Impact**: Data corruption, inconsistent state

**Mitigation**:
- Define clear transaction boundaries in base_service.py
- Unit tests for rollback scenarios
- Integration tests for multi-step operations

**Responsibility**: data-layer-expert

**Timeline**: Complete by Phase 3

---

### Low-Risk Items

#### 7. Backward Compatibility

**Risk**: API endpoint changes break existing clients

**Probability**: Very Low (5%)

**Impact**: Client integration failures

**Mitigation**:
- Maintain identical API contracts (services called internally only)
- Comprehensive integration tests
- Document any contract changes

**Responsibility**: python-backend-engineer

**Timeline**: Verify during Phase 5

---

## Effort Estimation Breakdown

### Story Point Allocation

| Phase | Component | SP | Complexity | Dependency |
|-------|-----------|----|----|-----------|
| 1 | Base service infrastructure | 5 | Low | None |
| 2a | LyricsService | 3 | Medium | Phase 1 |
| 2b | PersonaService | 2 | Low | Phase 1 |
| 2c | ProducerNotesService | 2 | Low | Phase 1 |
| 2d | BlueprintService | 3 | Medium | Phase 1 |
| 2e | SourceService | 3 | High | Phase 1 |
| 3 | Testing & Validation | 7 | Medium | Phase 2 |
| 4 | Layer Sequencing | 2 | Low | Phase 3 |
| 5 | API Integration | 3 | Low | Phase 4 |
| 6 | Documentation | 2 | Low | Phase 5 |
| **Total** | | **32 SP** | | |

**Adjusted Estimate (with parallelization)**:
- Sequential baseline: 32 SP = 8 weeks @ 4 SP/week
- With parallelization: 21 SP critical path = ~1.5 weeks @ 4 SP/week
- **Target: 2 weeks with full team parallelization**

---

## Linear Task Breakdown

### Epic: Missing Entity Services (WP-N6)

```
WP-N6: Missing Entity Services
├── Phase 1: Service Infrastructure
│   ├── [READY] N6-1: Base Service Class (2 SP)
│   ├── [READY] N6-2: Shared Validation Utilities (1 SP)
│   ├── [READY] N6-3: DTO Transformation Helpers (1 SP)
│   └── [READY] N6-4: Service Documentation (1 SP)
│
├── Phase 2: Service Implementation (Parallel)
│   ├── [READY] N6-5: LyricsService - Core Implementation (2 SP)
│   ├── [READY] N6-6: LyricsService - Citation Management (1 SP)
│   ├── [READY] N6-7: PersonaService (2 SP)
│   ├── [READY] N6-8: ProducerNotesService (2 SP)
│   ├── [READY] N6-9: BlueprintService - Initialization (1 SP)
│   ├── [READY] N6-10: BlueprintService - Validation (1 SP)
│   ├── [READY] N6-11: SourceService - MCP Integration (2 SP)
│   └── [READY] N6-12: SourceService - Chunk Retrieval (1 SP)
│
├── Phase 3: Testing & Validation
│   ├── [READY] N6-13: Unit Tests - LyricsService (1 SP)
│   ├── [READY] N6-14: Unit Tests - PersonaService (1 SP)
│   ├── [READY] N6-15: Unit Tests - ProducerNotesService (1 SP)
│   ├── [READY] N6-16: Unit Tests - BlueprintService (1 SP)
│   ├── [READY] N6-17: Unit Tests - SourceService (1 SP)
│   ├── [READY] N6-18: Integration Tests - Service Interactions (2 SP)
│   ├── [READY] N6-19: Determinism Tests - Citation Hashing (1 SP)
│   └── [READY] N6-20: Coverage Analysis & Report (1 SP)
│
├── Phase 4: Service Layer Sequencing
│   ├── [READY] N6-21: Document Interdependencies (1 SP)
│   └── [READY] N6-22: Layer Validation (1 SP)
│
├── Phase 5: API Integration
│   ├── [READY] N6-23: Update Lyrics Endpoints (1 SP)
│   ├── [READY] N6-24: Update Personas Endpoints (1 SP)
│   ├── [READY] N6-25: Update ProducerNotes Endpoints (1 SP)
│   ├── [READY] N6-26: Update Blueprints Endpoints (1 SP)
│   └── [READY] N6-27: Update Sources Endpoints (1 SP)
│
└── Phase 6: Documentation
    ├── [READY] N6-28: Service Docstrings & Comments (1 SP)
    ├── [READY] N6-29: Update README (1 SP)
    └── [READY] N6-30: Integration Guide (1 SP)
```

### Task Details (Linear-Compatible Format)

#### Phase 1 Tasks

**N6-1: Base Service Class**
- **Status**: Ready
- **Story Points**: 2
- **Priority**: P0 (Blocking)
- **Assigned To**: backend-architect
- **Description**: Create `BaseService` abstract class with transaction support
- **Acceptance Criteria**:
  - [ ] Transaction context manager implemented
  - [ ] Error handling with structured logging
  - [ ] DTO conversion helpers
  - [ ] Repository injection pattern
- **Links**: Blocks all Phase 2 tasks

**N6-2: Shared Validation Utilities**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P0 (Blocking)
- **Assigned To**: data-layer-expert
- **Description**: Create `common.py` with shared validation functions
- **Acceptance Criteria**:
  - [ ] Citation hash computation (SHA-256)
  - [ ] Rhyme scheme validators
  - [ ] Weight normalization utilities
  - [ ] Profanity filter integration
- **Links**: Blocks all Phase 2 tasks

**N6-3: DTO Transformation Helpers**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Model→Schema conversion utilities
- **Acceptance Criteria**:
  - [ ] Model to response DTO conversion
  - [ ] Error response formatting
  - [ ] Pagination helpers
- **Links**: Used by API integration (Phase 5)

**N6-4: Service Documentation**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P2
- **Assigned To**: backend-architect
- **Description**: Document service patterns and contracts
- **Acceptance Criteria**:
  - [ ] Service contract template defined
  - [ ] Dependency injection examples
  - [ ] Error handling patterns documented
- **Links**: Reference for other phases

---

#### Phase 2 Tasks (Implementation - Can be parallelized)

**N6-5: LyricsService - Core Implementation**
- **Status**: Ready
- **Story Points**: 2
- **Priority**: P0 (Critical)
- **Assigned To**: python-backend-engineer
- **Description**: Implement `LyricsService` with CRUD and basic validation
- **Acceptance Criteria**:
  - [ ] Create, read, update, delete methods
  - [ ] Section validation (at least one Chorus)
  - [ ] Rhyme scheme validation
  - [ ] Reading level validation
  - [ ] Explicit content filtering logic
- **Subtasks**:
  - [ ] Create class and basic methods
  - [ ] Implement section validation
  - [ ] Implement rhyme scheme validation
  - [ ] Implement explicit content filtering
- **Dependencies**: N6-1, N6-2
- **Links**: Used by N6-13 (unit tests), N6-23 (API integration)

**N6-6: LyricsService - Citation Management**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P0 (Critical)
- **Assigned To**: data-layer-expert
- **Description**: Citation hash management and determinism
- **Acceptance Criteria**:
  - [ ] Citation hash computation (SHA-256)
  - [ ] Pinned retrieval by hash
  - [ ] Citation weight normalization
  - [ ] Determinism verification
- **Dependencies**: N6-5, N6-2
- **Links**: Used by N6-19 (determinism tests), LYRICS workflow node

**N6-7: PersonaService**
- **Status**: Ready
- **Story Points**: 2
- **Priority**: P0 (Critical)
- **Assigned To**: python-backend-engineer
- **Description**: Implement `PersonaService` with influence normalization
- **Acceptance Criteria**:
  - [ ] Create, read, update, delete methods
  - [ ] Influence normalization for public_release
  - [ ] Vocal range validation
  - [ ] Delivery style conflict detection
  - [ ] Policy enforcement (disallow_named_style_of)
- **Dependencies**: N6-1, N6-2
- **Links**: Used by N6-14 (unit tests), N6-24 (API integration)

**N6-8: ProducerNotesService**
- **Status**: Ready
- **Story Points**: 2
- **Priority**: P0 (Critical)
- **Assigned To**: python-backend-engineer
- **Description**: Implement `ProducerNotesService` with structure validation
- **Acceptance Criteria**:
  - [ ] Create, read, update, delete methods
  - [ ] Section alignment validation with lyrics
  - [ ] Hook count validation
  - [ ] Mix settings validation (LUFS, stereo width)
  - [ ] Duration calculation and validation
- **Dependencies**: N6-1, N6-2
- **Links**: Used by N6-15 (unit tests), N6-25 (API integration)

**N6-9: BlueprintService - Initialization**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P0 (Critical)
- **Assigned To**: backend-architect
- **Description**: Blueprint loading and caching
- **Acceptance Criteria**:
  - [ ] Load blueprints from markdown files
  - [ ] In-memory caching
  - [ ] Genre lookup by version
  - [ ] Cache invalidation handling
- **Dependencies**: N6-1
- **Links**: Used by N6-10, N6-16 (unit tests), N6-26 (API integration)

**N6-10: BlueprintService - Validation**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P0 (Critical)
- **Assigned To**: backend-architect
- **Description**: Blueprint constraint validation
- **Acceptance Criteria**:
  - [ ] Rubric weights validation (sum to 1.0)
  - [ ] Tempo range validation
  - [ ] Required sections enforcement
  - [ ] Tag conflict matrix loading
  - [ ] Banned terms check
- **Dependencies**: N6-9, N6-2
- **Links**: Used by N6-16 (unit tests), workflow validation

**N6-11: SourceService - MCP Integration**
- **Status**: Ready
- **Story Points**: 2
- **Priority**: P0 (Critical)
- **Assigned To**: data-layer-expert
- **Description**: MCP server discovery and integration
- **Acceptance Criteria**:
  - [ ] MCP server discovery mechanism
  - [ ] Server capability querying
  - [ ] Scope validation
  - [ ] Error handling for unavailable servers
  - [ ] Mock server for testing
- **Dependencies**: N6-1
- **Links**: Used by N6-12, N6-17 (unit tests), N6-27 (API integration)

**N6-12: SourceService - Chunk Retrieval**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P0 (Critical)
- **Assigned To**: data-layer-expert
- **Description**: Deterministic chunk retrieval with pinned hashes
- **Acceptance Criteria**:
  - [ ] Chunk retrieval by hash (pinned)
  - [ ] Allow/deny list enforcement
  - [ ] Relevance scoring optional (use lexicographic sort)
  - [ ] Fixed top-k retrieval
  - [ ] Provenance tracking
- **Dependencies**: N6-11, N6-2
- **Links**: Used by N6-17 (unit tests), LYRICS workflow node

---

#### Phase 3 Tasks (Testing & Validation)

**N6-13: Unit Tests - LyricsService**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Comprehensive unit tests for LyricsService
- **Acceptance Criteria**:
  - [ ] ≥15 unit tests
  - [ ] >80% code coverage
  - [ ] All validation methods tested
  - [ ] Edge cases covered (empty sections, etc.)
  - [ ] All tests pass consistently
- **Dependencies**: N6-5, N6-6
- **Test File**: `/services/api/app/tests/test_lyrics_service.py`

**N6-14: Unit Tests - PersonaService**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Comprehensive unit tests for PersonaService
- **Acceptance Criteria**:
  - [ ] ≥12 unit tests
  - [ ] >80% code coverage
  - [ ] Influence normalization tests
  - [ ] Policy enforcement tests
  - [ ] All tests pass consistently
- **Dependencies**: N6-7
- **Test File**: `/services/api/app/tests/test_persona_service.py`

**N6-15: Unit Tests - ProducerNotesService**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Comprehensive unit tests for ProducerNotesService
- **Acceptance Criteria**:
  - [ ] ≥12 unit tests
  - [ ] >80% code coverage
  - [ ] Section alignment tests
  - [ ] Duration validation tests
  - [ ] All tests pass consistently
- **Dependencies**: N6-8
- **Test File**: `/services/api/app/tests/test_producer_notes_service.py`

**N6-16: Unit Tests - BlueprintService**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: backend-architect
- **Description**: Comprehensive unit tests for BlueprintService
- **Acceptance Criteria**:
  - [ ] ≥15 unit tests
  - [ ] >80% code coverage
  - [ ] Blueprint loading tests
  - [ ] Constraint validation tests
  - [ ] Cache behavior tests
  - [ ] All tests pass consistently
- **Dependencies**: N6-9, N6-10
- **Test File**: `/services/api/app/tests/test_blueprint_service.py`

**N6-17: Unit Tests - SourceService**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: data-layer-expert
- **Description**: Comprehensive unit tests for SourceService
- **Acceptance Criteria**:
  - [ ] ≥12 unit tests
  - [ ] >80% code coverage
  - [ ] Allow/deny validation tests
  - [ ] Chunk retrieval tests (with mock MCP)
  - [ ] Determinism tests for pinned hashes
  - [ ] All tests pass consistently
- **Dependencies**: N6-11, N6-12
- **Test File**: `/services/api/app/tests/test_source_service.py`

**N6-18: Integration Tests - Service Interactions**
- **Status**: Ready
- **Story Points**: 2
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Cross-service integration tests
- **Acceptance Criteria**:
  - [ ] Service dependency tests (e.g., ProducerNotes with Blueprint)
  - [ ] Multi-step operation tests
  - [ ] Error propagation tests
  - [ ] Transaction rollback tests
  - [ ] ≥20 integration tests
- **Dependencies**: All Phase 2 tasks
- **Test File**: `/services/api/tests/integration_test_services.py`

**N6-19: Determinism Tests - Citation Hashing**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P0 (Blocking MVP)
- **Assigned To**: data-layer-expert
- **Description**: Determinism validation for lyrics citations
- **Acceptance Criteria**:
  - [ ] Same lyrics + seed → identical citation hashes
  - [ ] Hash stability across 10 runs
  - [ ] Pinned retrieval produces reproducible chunks
  - [ ] ≥10 determinism tests
- **Dependencies**: N6-6, N6-12
- **Test File**: `/tests/determinism/test_service_determinism.py`
- **Acceptance Gate**: Blocks deployment

**N6-20: Coverage Analysis & Report**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Generate test coverage report and identify gaps
- **Acceptance Criteria**:
  - [ ] Coverage report generated
  - [ ] Service layer coverage ≥80%
  - [ ] Critical paths (determinism) 100% covered
  - [ ] Gap report created
- **Links**: Informs additional testing

---

#### Phase 4 Tasks (Layer Sequencing)

**N6-21: Document Interdependencies**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: backend-architect
- **Description**: Map and document service dependencies
- **Acceptance Criteria**:
  - [ ] Dependency graph created
  - [ ] No circular dependencies
  - [ ] Service contracts documented
  - [ ] Dependency documentation in README
- **Deliverable**: Dependency diagram + documentation

**N6-22: Layer Validation**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: backend-architect
- **Description**: Validate layer sequencing (DB→Repo→Service→API)
- **Acceptance Criteria**:
  - [ ] All services properly delegate to repos
  - [ ] No business logic in repos
  - [ ] No direct DB access from services
  - [ ] Transaction boundaries clear
- **Validation Method**: Code review + architecture validation

---

#### Phase 5 Tasks (API Integration)

**N6-23: Update Lyrics Endpoints**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Integrate LyricsService into API endpoints
- **Acceptance Criteria**:
  - [ ] All endpoints use service instead of repo
  - [ ] Business logic enforced at service layer
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
  - [ ] Existing tests still pass
- **File**: `/services/api/app/api/v1/endpoints/lyrics.py`

**N6-24: Update Personas Endpoints**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Integrate PersonaService into API endpoints
- **Acceptance Criteria**:
  - [ ] All endpoints use service
  - [ ] Influence normalization applied
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
  - [ ] Existing tests still pass
- **File**: `/services/api/app/api/v1/endpoints/personas.py`

**N6-25: Update ProducerNotes Endpoints**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Integrate ProducerNotesService into API endpoints
- **Acceptance Criteria**:
  - [ ] All endpoints use service
  - [ ] Structure validation enforced
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
  - [ ] Existing tests still pass
- **File**: `/services/api/app/api/v1/endpoints/producer_notes.py`

**N6-26: Update Blueprints Endpoints**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Integrate BlueprintService into API endpoints
- **Acceptance Criteria**:
  - [ ] All endpoints use service
  - [ ] Blueprint loading working
  - [ ] Constraint validation applied
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
- **File**: `/services/api/app/api/v1/endpoints/blueprints.py`

**N6-27: Update Sources Endpoints**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P1
- **Assigned To**: python-backend-engineer
- **Description**: Integrate SourceService into API endpoints
- **Acceptance Criteria**:
  - [ ] All endpoints use service
  - [ ] MCP integration working
  - [ ] Allow/deny enforcement applied
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
- **File**: `/services/api/app/api/v1/endpoints/sources.py`

---

#### Phase 6 Tasks (Documentation)

**N6-28: Service Docstrings & Comments**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P2
- **Assigned To**: python-backend-engineer
- **Description**: Comprehensive docstrings and inline comments
- **Acceptance Criteria**:
  - [ ] All public methods documented
  - [ ] Complex logic commented
  - [ ] Type hints throughout
  - [ ] Examples in docstrings
- **Files**: All service files

**N6-29: Update README**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P2
- **Assigned To**: backend-architect
- **Description**: Update `/services/api/app/services/README.md`
- **Acceptance Criteria**:
  - [ ] Service patterns documented
  - [ ] Usage examples provided
  - [ ] Architecture diagram included
  - [ ] Troubleshooting guide
- **File**: `/services/api/app/services/README.md`

**N6-30: Integration Guide**
- **Status**: Ready
- **Story Points**: 1
- **Priority**: P2
- **Assigned To**: backend-architect
- **Description**: Create developer integration guide
- **Acceptance Criteria**:
  - [ ] Step-by-step integration walkthrough
  - [ ] All 5 services covered
  - [ ] Common patterns documented
  - [ ] Testing strategy documented
- **File**: `/docs/backend-service-layer-guide.md`

---

## Acceptance Criteria & Quality Gates

### Functional Acceptance Criteria

#### Service Layer Completeness
- [ ] All 5 services implemented with full CRUD and business logic
- [ ] Service base class with transaction support
- [ ] Shared validation utilities in common.py
- [ ] All services properly inherit from base class
- [ ] No direct database access from services

#### Business Logic Implementation
- [ ] **LyricsService**: Section validation, rhyme scheme parsing, citation hashing
- [ ] **PersonaService**: Influence normalization, vocal range validation, delivery conflict detection
- [ ] **ProducerNotesService**: Structure validation, blueprint alignment, duration calculation
- [ ] **BlueprintService**: Blueprint loading, rubric validation, constraint enforcement
- [ ] **SourceService**: MCP integration, pinned chunk retrieval, allow/deny enforcement

#### API Integration
- [ ] All endpoints updated to use services
- [ ] Business logic enforced at service layer (not in endpoints)
- [ ] Error handling consistent across all endpoints
- [ ] API contracts remain unchanged (backward compatible)
- [ ] All existing endpoint tests pass

#### Error Handling
- [ ] Service errors raised as exceptions with clear messages
- [ ] API layer converts exceptions to ErrorResponse envelopes
- [ ] Structured logging for all errors
- [ ] Graceful fallbacks for optional operations (e.g., missing MCP)

#### Documentation
- [ ] All public methods have docstrings with examples
- [ ] Service integration patterns documented
- [ ] Architecture diagram showing layer separation
- [ ] Developer guide for adding new services

### Quality Gates

#### Gate 1: Code Quality
- [ ] All services implement `BaseService` correctly
- [ ] No circular dependencies between services
- [ ] SonarQube quality gate passing (A rating)
- [ ] No critical security issues identified

#### Gate 2: Test Coverage
- [ ] Unit test coverage ≥80% for service layer
- [ ] ≥85 unit tests total (15+ per service)
- [ ] ≥20 integration tests for cross-service scenarios
- [ ] All tests passing consistently (5 runs each)

#### Gate 3: Determinism (CRITICAL)
- [ ] Citation hashes stable across 10 runs with same input
- [ ] Source chunk retrieval reproducible (pinned hashes)
- [ ] Persona influence normalization deterministic
- [ ] All determinism tests passing

#### Gate 4: Performance
- [ ] Service layer adds <10ms latency per operation
- [ ] Blueprint loading cached (<5ms after first load)
- [ ] Database queries properly indexed
- [ ] No N+1 query problems

#### Gate 5: Architecture Compliance
- [ ] Services properly layer above repositories
- [ ] Business logic separation clear
- [ ] Transaction boundaries properly defined
- [ ] Error propagation follows established patterns

---

## Success Criteria

### MVP Definition
**Minimal Viable Product**: All 5 services implemented with business logic, comprehensive testing, and API integration.

**MVP Acceptance**:
- ✅ All services implemented and passing tests
- ✅ Coverage ≥80% on service layer
- ✅ All API endpoints using services
- ✅ Determinism tests passing (99%+ reproducibility)
- ✅ Documentation complete
- ✅ All 4 quality gates passing

### Release Criteria
1. Code review approved by backend-architect
2. All acceptance criteria met
3. All quality gates passing
4. Documentation complete and reviewed
5. Performance baseline established
6. Merged to main branch

---

## Resource Requirements

### Team Composition

| Role | Count | Weeks | Capacity | Tasks |
|------|-------|-------|----------|-------|
| python-backend-engineer | 1 | 2 | 4 SP/week | Implementation, endpoint updates, basic tests |
| backend-architect | 1 | 2 | 3 SP/week | Design, layer validation, documentation |
| data-layer-expert | 1 | 2 | 4 SP/week | Citations, determinism, MCP integration |

**Total**: 3 engineers, 6 engineer-weeks

### Infrastructure Requirements

**Development**:
- Docker environment (already setup)
- PostgreSQL + Redis (already setup)
- MCP server mock implementation

**Testing**:
- Test database instance
- Pytest with coverage plugin
- Mock MCP server implementation

**Monitoring**:
- Structured logging (structlog)
- Performance profiling
- CI/CD pipeline (GitHub Actions)

---

## Timeline & Milestones

### Week 1

**Day 1-2: Phase 1 (Service Infrastructure)**
- Create BaseService class with transaction support
- Create shared validation utilities
- Document service patterns
- **Deliverable**: All 5 services can inherit from base class

**Day 2-5: Phase 2 (Service Implementation)**
- Implement LyricsService
- Implement PersonaService (parallel)
- Implement ProducerNotesService (parallel)
- Implement BlueprintService (parallel)
- Implement SourceService (parallel)
- **Deliverable**: All 5 services feature-complete

### Week 2

**Day 1-2: Phase 3 (Testing & Validation)**
- Unit tests for all services (85+ tests)
- Integration tests for service interactions
- Determinism validation tests
- Coverage analysis and report
- **Deliverable**: All tests passing, coverage ≥80%

**Day 2-3: Phase 4 (Layer Sequencing)**
- Map service interdependencies
- Validate layer architecture
- Document service contracts
- **Deliverable**: Architecture validation complete

**Day 3-4: Phase 5 (API Integration)**
- Update all 5 endpoint modules
- Verify backward compatibility
- Performance baseline testing
- **Deliverable**: All endpoints using services

**Day 4-5: Phase 6 (Documentation)**
- Service docstrings and comments
- Update README with patterns
- Create integration guide
- Final cleanup and polish
- **Deliverable**: Documentation complete and reviewed

### Milestone Dates

| Milestone | Target Date | Criteria |
|-----------|-------------|----------|
| Phase 1 Complete | 2025-11-15 | Infrastructure ready for implementation |
| Phase 2 Complete | 2025-11-20 | All services feature-complete |
| Phase 3 Complete | 2025-11-22 | Tests passing, coverage verified |
| Phase 4 Complete | 2025-11-24 | Architecture validated |
| Phase 5 Complete | 2025-11-26 | API fully integrated |
| Phase 6 Complete | 2025-11-28 | Documentation done, ready for release |

---

## File Locations & Deliverables

### Service Files (to be created)

- `/home/user/MeatyMusic/services/api/app/services/base_service.py` - Base service class
- `/home/user/MeatyMusic/services/api/app/services/common.py` - Shared utilities
- `/home/user/MeatyMusic/services/api/app/services/lyrics_service.py` - Lyrics business logic
- `/home/user/MeatyMusic/services/api/app/services/persona_service.py` - Persona business logic
- `/home/user/MeatyMusic/services/api/app/services/producer_notes_service.py` - Producer notes business logic
- `/home/user/MeatyMusic/services/api/app/services/blueprint_service.py` - Blueprint management
- `/home/user/MeatyMusic/services/api/app/services/source_service.py` - Source retrieval

### Test Files (to be created)

- `/home/user/MeatyMusic/services/api/app/tests/test_lyrics_service.py`
- `/home/user/MeatyMusic/services/api/app/tests/test_persona_service.py`
- `/home/user/MeatyMusic/services/api/app/tests/test_producer_notes_service.py`
- `/home/user/MeatyMusic/services/api/app/tests/test_blueprint_service.py`
- `/home/user/MeatyMusic/services/api/app/tests/test_source_service.py`
- `/home/user/MeatyMusic/services/api/tests/integration_test_services.py`
- `/home/user/MeatyMusic/tests/determinism/test_service_determinism.py`

### Documentation Files (to be created/updated)

- `/home/user/MeatyMusic/services/api/app/services/README.md` - Updated with new patterns
- `/home/user/MeatyMusic/docs/backend-service-layer-guide.md` - Integration guide

### Endpoint Files (to be updated)

- `/home/user/MeatyMusic/services/api/app/api/v1/endpoints/lyrics.py`
- `/home/user/MeatyMusic/services/api/app/api/v1/endpoints/personas.py`
- `/home/user/MeatyMusic/services/api/app/api/v1/endpoints/producer_notes.py`
- `/home/user/MeatyMusic/services/api/app/api/v1/endpoints/blueprints.py`
- `/home/user/MeatyMusic/services/api/app/api/v1/endpoints/sources.py`

---

## Known Constraints & Dependencies

### External Dependencies
- PostgreSQL 15 (already running)
- Redis (already running)
- MCP server specification (must be defined)
- Blueprint markdown files (must exist in `/docs/hit_song_blueprint/AI/`)

### Internal Dependencies
- Repository layer must be fully functional (already is)
- Schema definitions must be complete (already are)
- Validation service must be available (exists)

### Critical Path Items
- BaseService class (blocks all services)
- Shared validation utilities (blocks all services)
- MCP mock for testing SourceService

---

## Risk & Mitigation Summary

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|-----------|-------|
| Citation hash instability | 20% | HIGH | Determinism tests, fixed algorithm | data-layer-expert |
| MCP integration unavailable | 25% | MEDIUM | Mock implementation | python-backend-engineer |
| Blueprint loading slow | 10% | MEDIUM | Caching, pre-load | backend-architect |
| Cross-service inconsistency | 20% | MEDIUM | Shared validation | backend-architect |
| Transaction boundary issues | 10% | MEDIUM | Design in Phase 1 | data-layer-expert |

---

## Monitoring & Observability

### Metrics to Track

**Implementation Progress**:
- Services completed (0/5 → 5/5)
- Tests passing (0% → 100%)
- Code coverage trend (→ 80%)
- Tasks completed per day

**Quality Metrics**:
- Code review feedback count
- Bug discovered (should be <5)
- Performance impact (target: <10ms added latency)
- Test execution time (target: <30s)

### Logging Strategy

All services use structured logging via `structlog`:
```python
import structlog
logger = structlog.get_logger(__name__)

logger.info(
    "service.operation",
    entity_id=str(entity_id),
    operation="create",
    status="success"
)
```

---

## Sign-Off & Approval

**Plan Owner**: Implementation Planning Orchestrator
**Created**: 2025-11-14
**Status**: Ready for Execution

**Required Approvals**:
- [ ] Technical Lead (backend-architect)
- [ ] Product Owner
- [ ] QA Lead

**Approved By**: [To be filled]
**Date**: [To be filled]

---

## Appendix: Service Template

All services should follow this template:

```python
"""Service layer for [Entity] entity business logic.

This module implements business logic for [Entity] operations including
[key responsibilities].
"""

from typing import Optional, List
from uuid import UUID
import structlog

from app.repositories.[entity]_repo import [Entity]Repository
from app.schemas.[entity] import [Entity]Create, [Entity]Update, [Entity]Response
from app.models.[entity] import [Entity]
from .base_service import BaseService

logger = structlog.get_logger(__name__)


class [Entity]Service(BaseService):
    """Service for [entity]-related operations with business logic validation."""

    def __init__(
        self,
        repo: [Entity]Repository,
        # Optional dependencies
    ):
        """Initialize the service."""
        super().__init__()
        self.repo = repo

    async def create_[entity](self, data: [Entity]Create) -> [Entity]:
        """Create a new [entity] with validation."""
        # Validation logic

        async with self.transaction():
            entity = await self.repo.create(data)
            logger.info("entity.created", id=str(entity.id))
            return entity

    async def update_[entity](self, id: UUID, data: [Entity]Update) -> Optional[[Entity]]:
        """Update an existing [entity]."""
        # Validation logic

        async with self.transaction():
            entity = await self.repo.update(id, data)
            logger.info("entity.updated", id=str(id))
            return entity

    async def delete_[entity](self, id: UUID) -> bool:
        """Delete a [entity]."""
        async with self.transaction():
            success = await self.repo.delete(id)
            if success:
                logger.info("entity.deleted", id=str(id))
            return success
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Next Review**: Upon Phase 1 Completion
