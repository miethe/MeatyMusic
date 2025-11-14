# Backend Entity Services v1 - All Phases Progress Tracker

**Plan:** docs/project_plans/implementation_plans/backend-entity-services-v1.md
**Started:** 2025-11-14
**Last Updated:** 2025-11-14
**Status:** In Progress - Critical Bug Fixed

## ⚠️ CRITICAL FIX APPLIED (2025-11-14)

**Issue**: Services were awaiting synchronous repository methods
**Impact**: Would cause `TypeError: object is not awaitable` at runtime
**Fix**: Removed all `await` from repo calls, changed AsyncSession → Session
**Files Fixed**: 5 service files (base, lyrics, persona, producer_notes, source)
**Commit**: 9f71698 - "fix(services): resolve critical sync/async mismatch"

---

## Executive Summary

Implementing 5 missing entity services (lyrics, persona, producer_notes, blueprint, source) with business logic, transaction management, and validation for the MeatyMusic API.

**Total Story Points:** 32 SP (21 SP critical path with parallelization)
**Timeline:** 2 weeks
**Target Completion:** 2025-11-28

---

## Completion Status

### Success Criteria
- [ ] All 5 services implemented with full CRUD and business logic
- [ ] Service base class with transaction support
- [ ] Shared validation utilities in common.py
- [ ] All services properly inherit from base class
- [ ] No direct database access from services
- [ ] All business logic at service layer (not in endpoints)
- [ ] Unit test coverage ≥80% for service layer (85+ tests)
- [ ] Integration tests for cross-service interactions (20+ tests)
- [ ] Determinism tests passing (99%+ reproducibility)
- [ ] All API endpoints updated to use services
- [ ] Error handling consistent across endpoints
- [ ] API contracts remain unchanged (backward compatible)
- [ ] Documentation complete with examples
- [ ] All 5 quality gates passing

---

## Phase 1: Service Infrastructure & Patterns (5 SP)

**Status:** ✅ COMPLETE
**Completed:** 2025-11-14

### Tasks

#### N6-1: Base Service Class (2 SP)
- **Status:** ✅ Complete
- **Priority:** P0 (Blocking)
- **Subagent:** backend-architect
- **Description:** Create BaseService abstract class with transaction support
- **Files:** `/services/api/app/services/base_service.py`
- **Acceptance Criteria:**
  - [x] Transaction context manager implemented
  - [x] Error handling with structured logging
  - [x] DTO conversion helpers
  - [x] Repository injection pattern
- **Completed:** 2025-11-14
- **Notes:** Unblocked all Phase 2 tasks

#### N6-2: Shared Validation Utilities (1 SP)
- **Status:** ✅ Complete
- **Priority:** P0 (Blocking)
- **Subagent:** data-layer-expert
- **Description:** Create common.py with shared validation functions
- **Files:** `/services/api/app/services/common.py`
- **Acceptance Criteria:**
  - [x] Citation hash computation (SHA-256)
  - [x] Rhyme scheme validators
  - [x] Weight normalization utilities
  - [x] Profanity filter integration
- **Completed:** 2025-11-14
- **Determinism:** 100% reproducibility achieved (exceeds 99% requirement)
- **Notes:** Unblocked all Phase 2 tasks

#### N6-3: DTO Transformation Helpers (1 SP)
- **Status:** ✅ Complete
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Model→Schema conversion utilities
- **Files:** `/services/api/app/services/common.py`
- **Acceptance Criteria:**
  - [x] Model to response DTO conversion
  - [x] Error response formatting
  - [x] Pagination helpers (offset + cursor)
- **Completed:** 2025-11-14
- **Notes:** Ready for API integration (Phase 5)

#### N6-4: Service Documentation (1 SP)
- **Status:** ✅ Complete
- **Priority:** P2
- **Subagent:** documentation-writer
- **Description:** Document service patterns and contracts
- **Files:** `/services/api/app/services/README.md` (2,224 lines)
- **Acceptance Criteria:**
  - [x] Service contract template defined
  - [x] Dependency injection examples
  - [x] Error handling patterns documented
- **Completed:** 2025-11-14
- **Notes:** Primary reference for Phase 2 implementations

---

## Phase 2: Parallel Service Implementation (13 SP)

**Status:** Not Started
**Target:** Day 2-5
**Note:** All services can be implemented in parallel

### Tasks

#### N6-5: LyricsService - Core Implementation (2 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** python-backend-engineer
- **Description:** Implement LyricsService with CRUD and basic validation
- **Files:** `/services/api/app/services/lyrics_service.py`
- **Acceptance Criteria:**
  - [ ] Create, read, update, delete methods
  - [ ] Section validation (at least one Chorus)
  - [ ] Rhyme scheme validation
  - [ ] Reading level validation
  - [ ] Explicit content filtering logic
- **Dependencies:** N6-1, N6-2

#### N6-6: LyricsService - Citation Management (1 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** data-layer-expert
- **Description:** Citation hash management and determinism
- **Files:** `/services/api/app/services/lyrics_service.py`
- **Acceptance Criteria:**
  - [ ] Citation hash computation (SHA-256)
  - [ ] Pinned retrieval by hash
  - [ ] Citation weight normalization
  - [ ] Determinism verification
- **Dependencies:** N6-5, N6-2

#### N6-7: PersonaService (2 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** python-backend-engineer
- **Description:** Implement PersonaService with influence normalization
- **Files:** `/services/api/app/services/persona_service.py`
- **Acceptance Criteria:**
  - [ ] Create, read, update, delete methods
  - [ ] Influence normalization for public_release
  - [ ] Vocal range validation
  - [ ] Delivery style conflict detection
  - [ ] Policy enforcement (disallow_named_style_of)
- **Dependencies:** N6-1, N6-2

#### N6-8: ProducerNotesService (2 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** python-backend-engineer
- **Description:** Implement ProducerNotesService with structure validation
- **Files:** `/services/api/app/services/producer_notes_service.py`
- **Acceptance Criteria:**
  - [ ] Create, read, update, delete methods
  - [ ] Section alignment validation with lyrics
  - [ ] Hook count validation
  - [ ] Mix settings validation (LUFS, stereo width)
  - [ ] Duration calculation and validation
- **Dependencies:** N6-1, N6-2

#### N6-9: BlueprintService - Initialization (1 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** backend-architect
- **Description:** Blueprint loading and caching
- **Files:** `/services/api/app/services/blueprint_service.py`
- **Acceptance Criteria:**
  - [ ] Load blueprints from markdown files
  - [ ] In-memory caching
  - [ ] Genre lookup by version
  - [ ] Cache invalidation handling
- **Dependencies:** N6-1

#### N6-10: BlueprintService - Validation (1 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** backend-architect
- **Description:** Blueprint constraint validation
- **Files:** `/services/api/app/services/blueprint_service.py`
- **Acceptance Criteria:**
  - [ ] Rubric weights validation (sum to 1.0)
  - [ ] Tempo range validation
  - [ ] Required sections enforcement
  - [ ] Tag conflict matrix loading
  - [ ] Banned terms check
- **Dependencies:** N6-9, N6-2

#### N6-11: SourceService - MCP Integration (2 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** data-layer-expert
- **Description:** MCP server discovery and integration
- **Files:** `/services/api/app/services/source_service.py`
- **Acceptance Criteria:**
  - [ ] MCP server discovery mechanism
  - [ ] Server capability querying
  - [ ] Scope validation
  - [ ] Error handling for unavailable servers
  - [ ] Mock server for testing
- **Dependencies:** N6-1

#### N6-12: SourceService - Chunk Retrieval (1 SP)
- **Status:** Pending
- **Priority:** P0 (Critical)
- **Subagent:** data-layer-expert
- **Description:** Deterministic chunk retrieval with pinned hashes
- **Files:** `/services/api/app/services/source_service.py`
- **Acceptance Criteria:**
  - [ ] Chunk retrieval by hash (pinned)
  - [ ] Allow/deny list enforcement
  - [ ] Relevance scoring optional (use lexicographic sort)
  - [ ] Fixed top-k retrieval
  - [ ] Provenance tracking
- **Dependencies:** N6-11, N6-2

---

## Phase 3: Testing & Validation (9 SP)

**Status:** Not Started
**Target:** Week 1 Day 5 - Week 2 Day 2

### Tasks

#### N6-13: Unit Tests - LyricsService (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Comprehensive unit tests for LyricsService
- **Files:** `/services/api/app/tests/test_lyrics_service.py`
- **Acceptance Criteria:**
  - [ ] ≥15 unit tests
  - [ ] >80% code coverage
  - [ ] All validation methods tested
  - [ ] Edge cases covered
  - [ ] All tests pass consistently
- **Dependencies:** N6-5, N6-6

#### N6-14: Unit Tests - PersonaService (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Comprehensive unit tests for PersonaService
- **Files:** `/services/api/app/tests/test_persona_service.py`
- **Acceptance Criteria:**
  - [ ] ≥12 unit tests
  - [ ] >80% code coverage
  - [ ] Influence normalization tests
  - [ ] Policy enforcement tests
  - [ ] All tests pass consistently
- **Dependencies:** N6-7

#### N6-15: Unit Tests - ProducerNotesService (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Comprehensive unit tests for ProducerNotesService
- **Files:** `/services/api/app/tests/test_producer_notes_service.py`
- **Acceptance Criteria:**
  - [ ] ≥12 unit tests
  - [ ] >80% code coverage
  - [ ] Section alignment tests
  - [ ] Duration validation tests
  - [ ] All tests pass consistently
- **Dependencies:** N6-8

#### N6-16: Unit Tests - BlueprintService (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** backend-architect
- **Description:** Comprehensive unit tests for BlueprintService
- **Files:** `/services/api/app/tests/test_blueprint_service.py`
- **Acceptance Criteria:**
  - [ ] ≥15 unit tests
  - [ ] >80% code coverage
  - [ ] Blueprint loading tests
  - [ ] Constraint validation tests
  - [ ] Cache behavior tests
  - [ ] All tests pass consistently
- **Dependencies:** N6-9, N6-10

#### N6-17: Unit Tests - SourceService (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** data-layer-expert
- **Description:** Comprehensive unit tests for SourceService
- **Files:** `/services/api/app/tests/test_source_service.py`
- **Acceptance Criteria:**
  - [ ] ≥12 unit tests
  - [ ] >80% code coverage
  - [ ] Allow/deny validation tests
  - [ ] Chunk retrieval tests (with mock MCP)
  - [ ] Determinism tests for pinned hashes
  - [ ] All tests pass consistently
- **Dependencies:** N6-11, N6-12

#### N6-18: Integration Tests - Service Interactions (2 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Cross-service integration tests
- **Files:** `/services/api/tests/integration_test_services.py`
- **Acceptance Criteria:**
  - [ ] Service dependency tests
  - [ ] Multi-step operation tests
  - [ ] Error propagation tests
  - [ ] Transaction rollback tests
  - [ ] ≥20 integration tests
- **Dependencies:** All Phase 2 tasks

#### N6-19: Determinism Tests - Citation Hashing (1 SP)
- **Status:** Pending
- **Priority:** P0 (Blocking MVP)
- **Subagent:** data-layer-expert
- **Description:** Determinism validation for lyrics citations
- **Files:** `/tests/determinism/test_service_determinism.py`
- **Acceptance Criteria:**
  - [ ] Same lyrics + seed → identical citation hashes
  - [ ] Hash stability across 10 runs
  - [ ] Pinned retrieval produces reproducible chunks
  - [ ] ≥10 determinism tests
- **Dependencies:** N6-6, N6-12
- **Notes:** CRITICAL - blocks deployment

#### N6-20: Coverage Analysis & Report (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Generate test coverage report and identify gaps
- **Acceptance Criteria:**
  - [ ] Coverage report generated
  - [ ] Service layer coverage ≥80%
  - [ ] Critical paths (determinism) 100% covered
  - [ ] Gap report created

---

## Phase 4: Service Layer Sequencing (2 SP)

**Status:** Not Started
**Target:** Week 2 Day 2-3

### Tasks

#### N6-21: Document Interdependencies (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** backend-architect
- **Description:** Map and document service dependencies
- **Acceptance Criteria:**
  - [ ] Dependency graph created
  - [ ] No circular dependencies
  - [ ] Service contracts documented
  - [ ] Dependency documentation in README

#### N6-22: Layer Validation (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** backend-architect
- **Description:** Validate layer sequencing (DB→Repo→Service→API)
- **Acceptance Criteria:**
  - [ ] All services properly delegate to repos
  - [ ] No business logic in repos
  - [ ] No direct DB access from services
  - [ ] Transaction boundaries clear

---

## Phase 5: API Endpoint Integration (5 SP)

**Status:** Not Started
**Target:** Week 2 Day 3-4

### Tasks

#### N6-23: Update Lyrics Endpoints (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Integrate LyricsService into API endpoints
- **Files:** `/services/api/app/api/v1/endpoints/lyrics.py`
- **Acceptance Criteria:**
  - [ ] All endpoints use service instead of repo
  - [ ] Business logic enforced at service layer
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
  - [ ] Existing tests still pass

#### N6-24: Update Personas Endpoints (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Integrate PersonaService into API endpoints
- **Files:** `/services/api/app/api/v1/endpoints/personas.py`
- **Acceptance Criteria:**
  - [ ] All endpoints use service
  - [ ] Influence normalization applied
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
  - [ ] Existing tests still pass

#### N6-25: Update ProducerNotes Endpoints (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Integrate ProducerNotesService into API endpoints
- **Files:** `/services/api/app/api/v1/endpoints/producer_notes.py`
- **Acceptance Criteria:**
  - [ ] All endpoints use service
  - [ ] Structure validation enforced
  - [ ] Error handling consistent
  - [ ] API contracts unchanged
  - [ ] Existing tests still pass

#### N6-26: Update Blueprints Endpoints (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Integrate BlueprintService into API endpoints
- **Files:** `/services/api/app/api/v1/endpoints/blueprints.py`
- **Acceptance Criteria:**
  - [ ] All endpoints use service
  - [ ] Blueprint loading working
  - [ ] Constraint validation applied
  - [ ] Error handling consistent
  - [ ] API contracts unchanged

#### N6-27: Update Sources Endpoints (1 SP)
- **Status:** Pending
- **Priority:** P1
- **Subagent:** python-backend-engineer
- **Description:** Integrate SourceService into API endpoints
- **Files:** `/services/api/app/api/v1/endpoints/sources.py`
- **Acceptance Criteria:**
  - [ ] All endpoints use service
  - [ ] MCP integration working
  - [ ] Allow/deny enforcement applied
  - [ ] Error handling consistent
  - [ ] API contracts unchanged

---

## Phase 6: Documentation & Cleanup (3 SP)

**Status:** Not Started
**Target:** Week 2 Day 4-5

### Tasks

#### N6-28: Service Docstrings & Comments (1 SP)
- **Status:** Pending
- **Priority:** P2
- **Subagent:** documentation-writer
- **Description:** Comprehensive docstrings and inline comments
- **Files:** All service files
- **Acceptance Criteria:**
  - [ ] All public methods documented
  - [ ] Complex logic commented
  - [ ] Type hints throughout
  - [ ] Examples in docstrings

#### N6-29: Update README (1 SP)
- **Status:** Pending
- **Priority:** P2
- **Subagent:** documentation-writer
- **Description:** Update service layer README
- **Files:** `/services/api/app/services/README.md`
- **Acceptance Criteria:**
  - [ ] Service patterns documented
  - [ ] Usage examples provided
  - [ ] Architecture diagram included
  - [ ] Troubleshooting guide

#### N6-30: Integration Guide (1 SP)
- **Status:** Pending
- **Priority:** P2
- **Subagent:** documentation-writer
- **Description:** Create developer integration guide
- **Files:** `/docs/backend-service-layer-guide.md`
- **Acceptance Criteria:**
  - [ ] Step-by-step integration walkthrough
  - [ ] All 5 services covered
  - [ ] Common patterns documented
  - [ ] Testing strategy documented

---

## Quality Gates

### Gate 1: Code Quality
- [ ] All services implement BaseService correctly
- [ ] No circular dependencies between services
- [ ] SonarQube quality gate passing (A rating)
- [ ] No critical security issues identified

### Gate 2: Test Coverage
- [ ] Unit test coverage ≥80% for service layer
- [ ] ≥85 unit tests total (15+ per service)
- [ ] ≥20 integration tests for cross-service scenarios
- [ ] All tests passing consistently (5 runs each)

### Gate 3: Determinism (CRITICAL)
- [ ] Citation hashes stable across 10 runs with same input
- [ ] Source chunk retrieval reproducible (pinned hashes)
- [ ] Persona influence normalization deterministic
- [ ] All determinism tests passing

### Gate 4: Performance
- [ ] Service layer adds <10ms latency per operation
- [ ] Blueprint loading cached (<5ms after first load)
- [ ] Database queries properly indexed
- [ ] No N+1 query problems

### Gate 5: Architecture Compliance
- [ ] Services properly layer above repositories
- [ ] Business logic separation clear
- [ ] Transaction boundaries properly defined
- [ ] Error propagation follows established patterns

---

## Work Log

### 2025-11-14 - Session 1

**Started:** Phase execution orchestration

**Subagents Planned:**
- backend-architect: N6-1, N6-9, N6-10, N6-16, N6-21, N6-22
- data-layer-expert: N6-2, N6-6, N6-11, N6-12, N6-17, N6-19
- python-backend-engineer: N6-3, N6-5, N6-7, N6-8, N6-13, N6-14, N6-15, N6-18, N6-20, N6-23, N6-24, N6-25, N6-26, N6-27
- documentation-writer: N6-4, N6-28, N6-29, N6-30

**Next Steps:**
- Create context file
- Begin Phase 1 delegation

---

## Decisions Log

- **[2025-11-14]** Using documentation-writer for all documentation tasks (N6-4, N6-28, N6-29, N6-30)
- **[2025-11-14]** Phase 2 services will be implemented in parallel to maximize efficiency
- **[2025-11-14]** Determinism tests (N6-19) marked as P0 blocking - critical for MVP

---

## Files to Create

### Service Files
- `/services/api/app/services/base_service.py`
- `/services/api/app/services/common.py`
- `/services/api/app/services/lyrics_service.py`
- `/services/api/app/services/persona_service.py`
- `/services/api/app/services/producer_notes_service.py`
- `/services/api/app/services/blueprint_service.py`
- `/services/api/app/services/source_service.py`

### Test Files
- `/services/api/app/tests/test_lyrics_service.py`
- `/services/api/app/tests/test_persona_service.py`
- `/services/api/app/tests/test_producer_notes_service.py`
- `/services/api/app/tests/test_blueprint_service.py`
- `/services/api/app/tests/test_source_service.py`
- `/services/api/tests/integration_test_services.py`
- `/tests/determinism/test_service_determinism.py`

### Documentation Files
- `/services/api/app/services/README.md` (update)
- `/docs/backend-service-layer-guide.md` (create)

### Endpoint Files to Update
- `/services/api/app/api/v1/endpoints/lyrics.py`
- `/services/api/app/api/v1/endpoints/personas.py`
- `/services/api/app/api/v1/endpoints/producer_notes.py`
- `/services/api/app/api/v1/endpoints/blueprints.py`
- `/services/api/app/api/v1/endpoints/sources.py`
