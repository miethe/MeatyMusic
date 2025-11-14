# Backend Entity Services v1 - Working Context

**Purpose:** Token-efficient context for resuming work across AI turns

---

## Current State

**Branch:** claude/backend-entity-services-v1-delegation-01JbHGa2z9cyFHeXRrr5VFtA
**Last Commit:** c09afb2 docs: clean-up
**Current Phase:** Phase 0 - Initialization
**Current Task:** Setting up tracking infrastructure

---

## Key Architecture Decisions

### MeatyMusic Layered Architecture
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

**Pattern:** router → service → repository → DB

### Service Implementation Strategy

1. **Phase 1 Foundation**: BaseService + common utilities MUST be complete before any service implementation
2. **Phase 2 Parallelization**: All 5 services can be implemented in parallel once Phase 1 is done
3. **Determinism Critical**: Citation hashing and source retrieval must be 100% deterministic
4. **Transaction Boundaries**: All multi-step operations must use transaction context from BaseService

---

## Key Decisions

- **Architecture:** Following MeatyMusic layered architecture (DB→Repo→Service→API)
- **Parallelization:** Phase 2 services implemented in parallel by different subagents
- **Determinism:** SHA-256 hashing for citations with fixed top-k retrieval
- **Testing:** ≥80% coverage requirement with 85+ unit tests and 20+ integration tests
- **Documentation:** All docs delegated to documentation-writer subagent
- **MCP Integration:** Mock server for testing, graceful fallback for unavailable servers

---

## Critical Path Items

**Blockers for Phase 2:**
1. N6-1: BaseService class (backend-architect) - 2 SP
2. N6-2: Shared validation utilities (data-layer-expert) - 1 SP

**Blockers for MVP:**
- N6-19: Determinism tests (data-layer-expert) - MUST pass with 99%+ reproducibility

---

## Subagent Assignments

### backend-architect
- Phase 1: N6-1 (BaseService), N6-9 (BlueprintService init), N6-10 (BlueprintService validation)
- Phase 3: N6-16 (Blueprint unit tests)
- Phase 4: N6-21 (Dependencies), N6-22 (Layer validation)

### data-layer-expert
- Phase 1: N6-2 (Shared validation utilities)
- Phase 2: N6-6 (Lyrics citations), N6-11 (SourceService MCP), N6-12 (SourceService chunks)
- Phase 3: N6-17 (Source unit tests), N6-19 (Determinism tests - CRITICAL)

### python-backend-engineer
- Phase 1: N6-3 (DTO helpers)
- Phase 2: N6-5 (LyricsService core), N6-7 (PersonaService), N6-8 (ProducerNotesService)
- Phase 3: N6-13, N6-14, N6-15 (Unit tests), N6-18 (Integration tests), N6-20 (Coverage)
- Phase 5: N6-23 through N6-27 (API endpoint updates)

### documentation-writer
- Phase 1: N6-4 (Service documentation)
- Phase 6: N6-28 (Docstrings), N6-29 (README), N6-30 (Integration guide)

---

## Important Learnings

*(Will be updated as implementation progresses)*

---

## Quick Reference

### Environment Setup
```bash
# API Service
export PYTHONPATH="$PWD/services/api"
cd services/api

# Run tests
uv run pytest app/tests/test_*_service.py -v

# Type checking
uv run mypy app

# Coverage
uv run pytest --cov=app/services --cov-report=term-missing
```

### Key File Locations

**Service Layer:**
- Base: `services/api/app/services/base_service.py`
- Common: `services/api/app/services/common.py`
- Services: `services/api/app/services/{entity}_service.py`

**Repository Layer (existing):**
- Repos: `services/api/app/repositories/{entity}_repo.py`

**Schemas (existing):**
- DTOs: `services/api/app/schemas/{entity}.py`

**Models (existing):**
- ORM: `services/api/app/models/{entity}.py`

**API Endpoints (to update):**
- Routes: `services/api/app/api/v1/endpoints/{entity}.py`

**Tests:**
- Unit: `services/api/app/tests/test_{entity}_service.py`
- Integration: `services/api/tests/integration_test_services.py`
- Determinism: `tests/determinism/test_service_determinism.py`

**Documentation:**
- Service README: `services/api/app/services/README.md`
- Integration guide: `docs/backend-service-layer-guide.md`

---

## Phase Scope Summary

**Phase 1 (1-2 days):** Service infrastructure foundation
- BaseService abstract class with transaction support
- Shared validation utilities (hashing, normalization)
- DTO transformation helpers
- Service pattern documentation

**Phase 2 (2-5 days):** Parallel service implementation
- LyricsService: Section validation, citations, explicit content
- PersonaService: Influence normalization, vocal range, policy enforcement
- ProducerNotesService: Structure validation, blueprint alignment
- BlueprintService: Loading from markdown, caching, constraint validation
- SourceService: MCP integration, deterministic chunk retrieval

**Phase 3 (5-7 days):** Testing and validation
- 85+ unit tests across all services
- 20+ integration tests for cross-service interactions
- Determinism validation (CRITICAL for MVP)
- Coverage analysis (≥80% target)

**Phase 4 (7-8 days):** Layer sequencing
- Document service dependencies
- Validate layered architecture compliance
- Ensure no circular dependencies

**Phase 5 (8-10 days):** API integration
- Update all 5 endpoint modules to use services
- Verify backward compatibility
- Ensure error handling consistency

**Phase 6 (10-12 days):** Documentation
- Comprehensive docstrings in all services
- Update service layer README
- Create integration guide for developers

---

## Success Metrics

**MVP Definition:** All 5 services implemented with business logic, comprehensive testing (≥80% coverage), API integration, and determinism validation passing.

**Key Gates:**
1. ✅ Code Quality: No circular dependencies, SonarQube A rating
2. ✅ Test Coverage: ≥80% service layer, 85+ unit tests, 20+ integration tests
3. ✅ Determinism: 99%+ reproducibility on citation hashing
4. ✅ Performance: <10ms added latency per operation
5. ✅ Architecture: Proper layer separation (DB→Repo→Service→API)

---

## Risk Mitigation Status

**High-Risk Items:**
1. **Citation hash determinism** - SHA-256 with fixed algorithm in common.py
2. **MCP server availability** - Mock implementation for testing
3. **Blueprint loading performance** - In-memory caching strategy

**Monitoring:**
- Determinism tests MUST pass before deployment
- Performance baseline tracked during Phase 3
- Architecture validation in Phase 4

---

## Latest Status (2025-11-14)

**Completed:**
- Progress tracking file created
- Context file initialized
- Subagent assignments mapped

**In Progress:**
- Phase 1 delegation preparation

**Next Steps:**
- Begin Phase 1: Delegate to backend-architect (N6-1) and data-layer-expert (N6-2)
- Set up parallel work streams once Phase 1 blockers cleared
- Monitor determinism requirements throughout implementation
