# Bootstrap Implementation Plan: MeatyMusic AMCS from MeatyPrompts

**Version:** 1.0
**Date:** 2025-11-11
**Status:** Planning
**Estimated Timeline:** 6-8 weeks vs 14-18 weeks from scratch

---

## Executive Summary

### Why Bootstrap vs Build From Scratch

MeatyPrompts is a production-ready prompt management platform with 70-80% infrastructure overlap with MeatyMusic AMCS requirements. Both systems share:

- **Core Architecture**: FastAPI + Python backend, Next.js 14 + React frontend, PostgreSQL + pgvector, Redis
- **Infrastructure Patterns**: Router → Service → Repository → DB (strictly enforced)
- **Observability**: OpenTelemetry tracing, structured logging, metrics
- **Authentication**: Multi-tenancy, row-level security, user context
- **Developer Tooling**: Claude Code integration, monorepo with pnpm, comprehensive testing

**Key Insight**: MeatyPrompts manages Prompts with version control, metadata, and execution tracking. MeatyMusic AMCS manages Songs with workflow orchestration, artifact validation, and deterministic composition. The domain models differ, but the infrastructure patterns are identical.

### Time/Effort Savings

| Aspect | Build From Scratch | Bootstrap | Savings |
|--------|-------------------|-----------|---------|
| Backend Infrastructure | 4-5 weeks | 1 week | 75% |
| Database Setup | 2-3 weeks | 3-5 days | 70% |
| Observability | 2 weeks | 2 days | 85% |
| Frontend Foundation | 3-4 weeks | 1-2 weeks | 60% |
| Claude Code Integration | 1-2 weeks | 3-5 days | 70% |
| **Total** | **14-18 weeks** | **6-8 weeks** | **65%** |

### Risk Assessment

**Low Risk**:
- Infrastructure reuse (proven in production)
- Architectural patterns (battle-tested)
- Observability and error handling (mature)

**Medium Risk**:
- Domain model migration (Prompt → Song entities)
- UI component adaptation (prompt editor → workflow dashboard)
- Workflow orchestration (new skill-based system)

**Mitigation**:
- Incremental migration with parallel validation
- Preserve MeatyPrompts infrastructure patterns
- Feature flags for gradual rollout

*For detailed risk analysis, see: [Risk & Validation Guide](./bootstrap-from-meatyprompts/risk-and-validation.md)*

---

## Technology Stack Alignment

### What Transfers 1:1 (95-100% reuse)

**Backend Infrastructure**:
- Configuration management, database connection pool, structured logging
- OpenTelemetry tracing, middleware (request logging, correlation, rate limiting)
- Base repository with RLS, security context management, error handling hierarchy
- Database migration framework (Alembic)

**Frontend Infrastructure**:
- API client utilities, error handling, Clerk authentication
- OpenTelemetry browser tracing, React Query patterns
- Shared UI component library (`/packages/ui/`), design tokens (`/packages/tokens/`)

**Shared Infrastructure**:
- Claude Code configuration (`.claude/`), CI/CD pipelines (`.github/workflows/`)
- Monitoring dashboards and alerts (`/monitoring/`), Infrastructure as code (`/infra/`)

### What Needs Adaptation (60-80% reuse)

**Backend Services**: Replace prompt operations with song workflow operations
**Frontend Components**: Transform prompt CRUD to workflow step CRUD
**Claude Code Skills**: Adapt to PLAN/STYLE/LYRICS/PRODUCER/COMPOSE nodes

### What Needs New Implementation (0-20% reuse)

**AMCS-Specific**: Song entity models, workflow orchestrator, validation service, genre blueprints, tag conflict matrix, workflow visualizer UI

*For complete file mapping, see: [Migration Guide](./bootstrap-from-meatyprompts/migration-guide.md)*

---

## Implementation Phases

### Phase Overview

| Phase | Title | Timeline | Effort | Status | Details |
|-------|-------|----------|--------|--------|---------|
| 1 | Repository Setup & Cleanup | 3-5 days | 15 pts | Not Started | [Phase 1 Details →](./bootstrap-from-meatyprompts/phase-1-repository-setup.md) |
| 2 | Infrastructure Preservation | 5-7 days | 21 pts | Not Started | [Phase 2 Details →](./bootstrap-from-meatyprompts/phase-2-infrastructure-preservation.md) |
| 3 | Domain Model Migration | 10-15 days | 34 pts | Not Started | [Phase 3 Details →](./bootstrap-from-meatyprompts/phase-3-domain-model-migration.md) |
| 4 | Workflow Orchestration | 15-20 days | 55 pts | Not Started | [Phase 4 Details →](./bootstrap-from-meatyprompts/phase-4-workflow-orchestration.md) |
| 5 | UI Adaptation | 10-15 days | 34 pts | Not Started | [Phase 5 Details →](./bootstrap-from-meatyprompts/phase-5-ui-adaptation.md) |
| **Total** | | **6-8 weeks** | **159 pts** | | |

### Phase Summaries

#### Phase 1: Repository Setup & Cleanup (3-5 days)
**Goals**: Create MeatyMusic repository structure, import foundational infrastructure, remove domain-specific code, establish clean baseline.

**Key Deliverables**:
- Monorepo structure with services/api, apps/web, packages
- Copied infrastructure: core, observability, middleware, security
- Removed MeatyPrompts domain models, services, and components
- Migration log documenting all changes

**Success Criteria**: Backend can start, frontend can build, tests run, Claude Code agents load

[→ Full Phase 1 Details](./bootstrap-from-meatyprompts/phase-1-repository-setup.md)

---

#### Phase 2: Infrastructure Preservation (5-7 days)
**Goals**: Validate all copied infrastructure works, update configuration for AMCS naming, establish database schema foundation, verify observability stack.

**Key Deliverables**:
- Updated configuration (service name, database name)
- Initial Alembic migration (tenants, users, preferences)
- Working backend API with health endpoints
- Docker Compose for local development (Postgres + Redis)

**Success Criteria**: Backend starts without errors, frontend builds and runs, database migrations succeed, traces appear in logs

[→ Full Phase 2 Details](./bootstrap-from-meatyprompts/phase-2-infrastructure-preservation.md)

---

#### Phase 3: Domain Model Migration (10-15 days)
**Goals**: Implement AMCS entity models (Style, Lyrics, Producer Notes, Song, Run), create repositories following base patterns, create service layer, implement JSON schema validation.

**Key Deliverables**:
- Complete entity models (5 core models + relationships)
- Repository layer for all entities (following BaseRepository pattern)
- Service layer with business logic and validation
- JSON schemas for all entities
- Alembic migrations for all tables

**Success Criteria**: All models created, repositories follow base pattern, services enforce business rules, tests pass >80% coverage

[→ Full Phase 3 Details](./bootstrap-from-meatyprompts/phase-3-domain-model-migration.md)

---

#### Phase 4: Workflow Orchestration (15-20 days)
**Goals**: Create Claude Code skills for workflow nodes, implement graph runner (orchestrator), build validation and auto-fix logic, create event streaming system.

**Key Deliverables**:
- Claude Code skills for all 9 workflow nodes (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, RENDER, REVIEW)
- Workflow orchestrator with parallel execution support
- Event publishing system with WebSocket API
- Validation and auto-fix logic (max 3 iterations)

**Success Criteria**: All skills functional, orchestrator executes complete workflow, events stream correctly, determinism verified (same seed → same output)

[→ Full Phase 4 Details](./bootstrap-from-meatyprompts/phase-4-workflow-orchestration.md)

---

#### Phase 5: UI Adaptation (10-15 days)
**Goals**: Create workflow dashboard, build song creation flow, adapt component library to AMCS domain, implement real-time workflow visualization.

**Key Deliverables**:
- Workflow visualizer component with real-time updates
- Song creation form with SDS validation
- Real-time workflow dashboard
- Artifact viewers (Style, Lyrics, Producer Notes, Prompt)
- WebSocket integration for live events

**Success Criteria**: Workflow graph displays correctly, real-time updates work, song creation flow works end-to-end, accessibility score >90

[→ Full Phase 5 Details](./bootstrap-from-meatyprompts/phase-5-ui-adaptation.md)

---

## Supporting Documentation

### Migration & Integration
- [**Migration Guide**](./bootstrap-from-meatyprompts/migration-guide.md) - File-by-file guidance on what to copy, adapt, delete, or create new
- [**Risk & Validation**](./bootstrap-from-meatyprompts/risk-and-validation.md) - Risk mitigation, testing strategy, validation gates

### Workflow Architecture
All workflow nodes (PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX, RENDER, REVIEW) follow deterministic principles:
- **Global seed**: Every node uses run seed or `seed + node_idx`
- **Pinned retrieval**: Only source chunks with logged hashes
- **Model limits**: Obey engine character limits
- **Low-variance settings**: temperature ≤0.3, fixed top-p

---

## Success Metrics

### Code Reuse Target

| Category | Target Reuse | Notes |
|----------|-------------|-------|
| Backend Infrastructure | 95% | config, db, observability, middleware |
| Base Patterns | 95% | repositories, security, errors |
| Frontend Infrastructure | 85% | api client, auth, telemetry, hooks |
| UI Components | 60% | shared components, layout |
| Claude Code | 70% | agents, skill patterns |
| **Overall** | **80%** | Weighted average |

### Acceptance Gates (Release Promotion)

- **Gate A**: Rubric pass ≥ 95% on 200-song synthetic test set
- **Gate B**: Determinism reproducibility ≥ 99% (same SDS + seed → identical outputs)
- **Gate C**: Security audit clean (MCP allow-list, RLS verification)
- **Gate D**: Latency P95 ≤ 60s (Plan→Prompt, excluding render)

*For detailed metrics and validation strategy, see: [Risk & Validation Guide](./bootstrap-from-meatyprompts/risk-and-validation.md)*

---

## Next Actions

### Immediate First Steps (Week 1)

1. **Day 1: Repository Setup**
   - Create MeatyMusic repository
   - Copy root configuration files
   - Set up monorepo structure
   - Initialize git, pnpm

2. **Day 2: Backend Foundation**
   - Copy backend infrastructure
   - Copy base patterns
   - Remove domain-specific code
   - Update configuration for MeatyMusic

3. **Day 3: Frontend Foundation**
   - Copy shared packages
   - Copy frontend infrastructure
   - Remove domain-specific components
   - Update API client configuration

4. **Day 4: Claude Code Setup**
   - Copy .claude/ directory
   - Adapt agent descriptions
   - Create CLAUDE.md
   - Test agent loading

5. **Day 5: Validation**
   - Verify backend starts
   - Verify frontend builds
   - Run infrastructure tests
   - Document migration log

### Decision Points

**Week 1 Gate**: Infrastructure Validated
→ **Decision**: Proceed to Phase 2 or revisit infrastructure

**Week 2 Gate**: Database & Services Ready
→ **Decision**: Proceed to Phase 3 or fix infrastructure issues

**Week 4 Gate**: Domain Models Complete
→ **Decision**: Proceed to Phase 4 or refine models

**Week 7 Gate**: Orchestration Working
→ **Decision**: Proceed to Phase 5 or fix orchestration

**Week 9 Gate**: UI Complete
→ **Decision**: Launch MVP or iterate

---

## Quick Reference

### Phase Navigation
- [Phase 1: Repository Setup →](./bootstrap-from-meatyprompts/phase-1-repository-setup.md)
- [Phase 2: Infrastructure Preservation →](./bootstrap-from-meatyprompts/phase-2-infrastructure-preservation.md)
- [Phase 3: Domain Model Migration →](./bootstrap-from-meatyprompts/phase-3-domain-model-migration.md)
- [Phase 4: Workflow Orchestration →](./bootstrap-from-meatyprompts/phase-4-workflow-orchestration.md)
- [Phase 5: UI Adaptation →](./bootstrap-from-meatyprompts/phase-5-ui-adaptation.md)

### Supporting Guides
- [Migration Guide →](./bootstrap-from-meatyprompts/migration-guide.md)
- [Risk & Validation →](./bootstrap-from-meatyprompts/risk-and-validation.md)

### Key Principles
1. **Preserve Patterns**: Keep MeatyPrompts architectural patterns intact
2. **Incremental Migration**: Validate each phase before proceeding
3. **Feature Flags**: Enable gradual rollout of new functionality
4. **Determinism First**: Same inputs + seed → same outputs (99% reproducibility)

---

**Project Status**: Pre-implementation (design phase)
**Primary Reference**: `docs/amcs-overview.md`
**Last Updated**: 2025-11-11

**Token Efficiency**: This optimized structure reduces single-file token load by 84% (1894 lines → 300 lines parent + targeted phase files)
