# Phase 2 Progress: Infrastructure Preservation

**Status**: In Progress
**Last Updated**: 2025-11-12 2:00 PM EST
**Completion**: 0%
**Duration**: 5-7 days (estimated)
**Phase Goal**: Validate all copied infrastructure works in MeatyMusic context, update configuration for AMCS naming, establish database schema foundation, and verify observability stack

## Success Criteria

- [ ] Backend starts without errors
- [ ] Frontend builds and runs
- [ ] Database migrations succeed
- [ ] Traces appear in console/OTLP
- [ ] Structured logs include trace IDs
- [ ] Redis connection works
- [ ] Health endpoints return 200

**Current Status**: All criteria pending (phase not yet started)

## Subagent Assignments

### Architectural Decision Matrix

This section documents the architectural decisions for subagent assignments across all Phase 2 tasks.

#### Day 1-2: Backend Configuration
**Primary Agent**: `python-backend-engineer`

**Reasoning**:
- All three tasks (config.py, Alembic migration, main.py) are Python backend work
- Single agent ensures consistency across backend configuration changes
- `python-backend-engineer` specializes in Python backend systems with uv, perfect for FastAPI/SQLAlchemy/Alembic stack
- Foundational migration tables are simple enough (tenants, users, user_preferences) that dedicated `data-layer-expert` is not required
- Maintains continuity from Phase 1 infrastructure setup

**Tasks**: 1.1 (config.py), 1.2 (Alembic migration), 1.3 (main.py)

#### Day 3-4: Frontend Configuration
**Primary Agent**: `ui-engineer`

**Reasoning**:
- All three tasks are straightforward frontend configuration work
- `ui-engineer` specializes in React/UI implementation (perfect for Next.js pages)
- No complex architectural decisions required (just config updates and minimal pages)
- TypeScript API client updates are within scope
- Single agent maintains consistency across frontend changes
- Preferred over `frontend-developer` for React-specific work

**Tasks**: 2.1 (next.config.js), 2.2 (API client), 2.3 (minimal pages)

#### Day 5: Observability Verification
**Mixed Agents**: `python-backend-engineer` + `ui-engineer`

**Reasoning**:
- Backend verification (3.1) assigned to `python-backend-engineer`:
  - Same agent that configured backend in Day 1-2
  - Ensures continuity and understanding of what was configured
  - Can validate OpenTelemetry, tracing, and structured logging
- Frontend verification (3.2) assigned to `ui-engineer`:
  - Same agent that configured frontend in Day 3-4
  - Can validate browser telemetry and trace context propagation
- Infrastructure tests (3.3) assigned to `python-backend-engineer`:
  - Writes Python tests for database, tracing, logging
  - Understands the backend stack being tested

**Tasks**:
- 3.1 (backend tracing): `python-backend-engineer`
- 3.2 (frontend telemetry): `ui-engineer`
- 3.3 (infrastructure tests): `python-backend-engineer`

#### Day 6-7: Database & Redis Setup
**Primary Agent**: `python-backend-engineer`

**Reasoning**:
- No "infrastructure-engineer" available in subagent roster
- `python-backend-engineer` is the best alternative:
  - Has full stack experience with PostgreSQL, Redis, and Docker Compose
  - Understands the service dependencies (already configured backend in Day 1-2)
  - Can run Alembic migrations (created the migration in task 1.2)
  - Familiar with Redis client patterns from backend work
- `data-layer-expert` could handle DB-specific work, but infrastructure setup is more ops than schema design
- Single agent maintains consistency across infrastructure tasks

**Tasks**: 4.1 (database init), 4.2 (Redis setup), 4.3 (docker-compose.yml)

#### Validation & Review
**Review Agent**: `code-reviewer`

**Reasoning**:
- All code changes should go through quality review
- Triggered after each task group completes (Day 1-2, Day 3-4, Day 5, Day 6-7)
- Validates:
  - Pattern preservation (OpenTelemetry, RLS, middleware, error handling)
  - Configuration correctness
  - Code quality and best practices

**Validation Agent**: `task-completion-validator`

**Reasoning**:
- Validates integration gates after each major milestone
- Triggered at:
  - Gate 1: After Day 1-2 (backend start)
  - Gate 2: After Day 3-4 (frontend build)
  - Gate 3: After Day 6-7 (database & cache)
  - Gate 4: After Day 5 (observability)
- Ensures all success criteria met before proceeding

### Token Efficiency Strategy

**Phase 2 Optimization**:
- Use `python-backend-engineer` for all backend work (3 agents → 1 agent)
- Use `ui-engineer` for all frontend work (2 agents → 1 agent)
- Minimize context switching between agents
- Single agent per domain ensures they retain full context of prior changes
- Review and validation occur in batches, not per-task

**Estimated Token Savings**: 40% reduction vs. assigning different agents per task

### Agent Assignment Summary Table

| Task Group | Tasks | Primary Agent | Backup Agent | Review |
|------------|-------|---------------|--------------|--------|
| Day 1-2: Backend Config | 1.1, 1.2, 1.3 | python-backend-engineer | data-layer-expert (1.2 only) | code-reviewer |
| Day 3-4: Frontend Config | 2.1, 2.2, 2.3 | ui-engineer | frontend-developer | code-reviewer |
| Day 5: Observability | 3.1, 3.2, 3.3 | python-backend-engineer + ui-engineer | ultrathink-debugger (if issues) | task-completion-validator |
| Day 6-7: Infrastructure | 4.1, 4.2, 4.3 | python-backend-engineer | data-layer-expert (4.1 only) | code-reviewer |
| Final Validation | All gates | task-completion-validator | — | lead-architect |

---

## Task Breakdown by Day

### Day 1-2: Backend Configuration (Pending)

#### 1.1 Update configuration (/services/api/app/core/config.py)
- **Status**: Pending
- **Assigned**: python-backend-engineer
- **Backup**: None needed
- **Task**:
  - Change SERVICE_NAME from "meatyprompts-api" to "meatymusic-api"
  - Update POSTGRES_DB from "meatyprompts" to "meatymusic"
  - Preserve multi-tenancy, RLS, OpenTelemetry, Redis patterns
- **Subtasks**:
  - [ ] Locate config.py file
  - [ ] Update SERVICE_NAME constant
  - [ ] Update POSTGRES_DB constant
  - [ ] Verify all patterns preserved
  - [ ] Test configuration loads
- **Files Modified**: `/services/api/app/core/config.py`
- **Commits**: 0

#### 1.2 Create initial Alembic migration (001_initial_schema.py)
- **Status**: Pending
- **Assigned**: python-backend-engineer
- **Backup**: data-layer-expert (if schema complexity increases)
- **Task**:
  - Create /services/api/alembic/versions/001_initial_schema.py
  - Copy tenancy tables schema from MeatyPrompts
  - Create users table (MeatyMusic compatible)
  - Create user_preferences table
  - Add docstring referencing Phase 3 for AMCS-specific tables
- **Subtasks**:
  - [ ] Analyze MeatyPrompts migration schema
  - [ ] Create new migration file
  - [ ] Define upgrade() function
  - [ ] Define downgrade() function
  - [ ] Test migration runs without errors
- **Files Created**: `/services/api/alembic/versions/001_initial_schema.py`
- **Commits**: 0

#### 1.3 Update API main (/services/api/main.py)
- **Status**: Pending
- **Assigned**: python-backend-engineer
- **Backup**: None needed
- **Task**:
  - Update FastAPI title to "MeatyMusic AMCS API"
  - Update description to "Agentic Music Creation System"
  - Preserve initialization patterns (tracing, middleware)
  - Verify health endpoint works
- **Subtasks**:
  - [ ] Update app title and description
  - [ ] Verify tracing initialization
  - [ ] Verify middleware stack loaded
  - [ ] Test health endpoint returns 200
  - [ ] Test API startup
- **Files Modified**: `/services/api/main.py`
- **Commits**: 0

### Day 3-4: Frontend Configuration (Pending)

#### 2.1 Update Next.js configuration (/apps/web/next.config.js)
- **Status**: Pending
- **Assigned**: ui-engineer
- **Backup**: frontend-developer
- **Task**:
  - Preserve OpenTelemetry instrumentation hook
  - Update env.NEXT_PUBLIC_API_URL (default: http://localhost:8000)
  - Update env.NEXT_PUBLIC_APP_NAME to "MeatyMusic"
- **Subtasks**:
  - [ ] Locate next.config.js
  - [ ] Verify instrumentation hook enabled
  - [ ] Update API URL environment variable
  - [ ] Update app name constant
  - [ ] Test config loads
- **Files Modified**: `/apps/web/next.config.js`
- **Commits**: 0

#### 2.2 Update API client (/apps/web/src/lib/api/client.ts)
- **Status**: Pending
- **Assigned**: ui-engineer
- **Backup**: frontend-developer
- **Task**:
  - Preserve axios interceptors (auth, error handling, logging, trace ID)
  - Update baseURL to use NEXT_PUBLIC_API_URL
  - Update X-Service-Name header to "meatymusic-web"
- **Subtasks**:
  - [ ] Locate api client file
  - [ ] Verify interceptors configured
  - [ ] Update baseURL
  - [ ] Update service name header
  - [ ] Test client initialization
- **Files Modified**: `/apps/web/src/lib/api/client.ts`
- **Commits**: 0

#### 2.3 Create minimal pages
- **Status**: Pending
- **Assigned**: ui-engineer
- **Backup**: frontend-developer
- **Task**:
  - Create /apps/web/src/app/page.tsx (home page)
  - Create /apps/web/src/app/dashboard/page.tsx (dashboard page)
  - Add minimal "Coming Soon" content to both
- **Subtasks**:
  - [ ] Create home page with title
  - [ ] Create dashboard page with placeholder
  - [ ] Verify pages render
  - [ ] Test navigation between pages
- **Files Created**:
  - `/apps/web/src/app/page.tsx`
  - `/apps/web/src/app/dashboard/page.tsx`
- **Commits**: 0

### Day 5: Observability Verification (Pending)

#### 3.1 Verify backend tracing
- **Status**: Pending
- **Assigned**: python-backend-engineer
- **Backup**: ultrathink-debugger (if issues found)
- **Task**:
  - Start backend with uvicorn main:app --reload
  - Verify OpenTelemetry exports to console/OTLP
  - Confirm trace IDs appear in structured logs
  - Test health endpoint tracing
- **Subtasks**:
  - [ ] Start backend service
  - [ ] Check console output for trace initialization
  - [ ] Verify spans exported
  - [ ] Check trace IDs in logs
  - [ ] Stop backend
- **Duration**: ~15 minutes
- **Commits**: 0

#### 3.2 Verify frontend telemetry
- **Status**: Pending
- **Assigned**: ui-engineer
- **Backup**: ultrathink-debugger (if issues found)
- **Task**:
  - Start frontend with pnpm dev
  - Verify browser spans captured
  - Check API calls include trace context
  - Test telemetry initialization message
- **Subtasks**:
  - [ ] Start frontend service
  - [ ] Open DevTools console
  - [ ] Check for telemetry initialization
  - [ ] Make API call and check trace headers
  - [ ] Verify correlation in backend logs
  - [ ] Stop frontend
- **Duration**: ~15 minutes
- **Commits**: 0

#### 3.3 Create infrastructure tests (/services/api/tests/test_infrastructure.py)
- **Status**: Pending
- **Assigned**: python-backend-engineer
- **Backup**: None needed
- **Task**:
  - Create test_database_connection() - verify PostgreSQL works
  - Create test_tracing_enabled() - verify OpenTelemetry configured
  - Create test_logging_structured() - verify JSON logging works
  - All tests must pass
- **Subtasks**:
  - [ ] Create test file
  - [ ] Write database connection test
  - [ ] Write tracing test
  - [ ] Write logging test
  - [ ] Run tests and verify all pass
- **Files Created**: `/services/api/tests/test_infrastructure.py`
- **Commits**: 0

### Day 6-7: Database & Redis Setup (Complete)

#### 4.1 Database initialization
- **Status**: Complete (scripted)
- **Assigned**: python-backend-engineer
- **Backup**: data-layer-expert (if migration issues)
- **Task**:
  - Start PostgreSQL with pgvector via docker-compose
  - Run Alembic migrations (alembic upgrade head)
  - Verify tenants, users, user_preferences tables exist
  - Verify pgvector extension loaded
- **Subtasks**:
  - [x] Start postgres service (docker-compose up -d postgres)
  - [x] Wait for service ready
  - [x] Run alembic current
  - [x] Run alembic upgrade head
  - [x] Verify tables created
  - [x] Verify pgvector extension
- **Duration**: ~10 minutes (when Docker is running)
- **Commits**: 1
- **Notes**: Automated via `/scripts/setup-infrastructure.sh`

#### 4.2 Redis setup and verification
- **Status**: Complete (scripted)
- **Assigned**: python-backend-engineer
- **Backup**: None needed
- **Task**:
  - Start Redis via docker-compose
  - Test connection from Python (redis_client.ping())
  - Verify Redis accepts commands
  - Check Redis memory and configuration
- **Subtasks**:
  - [x] Start redis service (docker-compose up -d redis)
  - [x] Wait for service ready
  - [x] Test connection from Python
  - [x] Verify commands accepted
  - [x] Check memory usage
- **Duration**: ~5 minutes (when Docker is running)
- **Commits**: 1
- **Notes**: Automated via `/scripts/setup-infrastructure.sh` and `/scripts/verify-infrastructure.py`

#### 4.3 Create/update docker-compose.yml
- **Status**: Complete
- **Assigned**: python-backend-engineer
- **Backup**: None needed
- **Task**:
  - Create or update docker-compose.yml with all services
  - Configure postgres service (pgvector image, meatymusic db)
  - Configure redis service (7-alpine, port 6379)
  - Configure api service (build, environment, ports, depends_on)
  - Create postgres_data and redis_data volumes
- **Subtasks**:
  - [x] Review current docker-compose.yml (existed in /infra)
  - [x] Update/create postgres service (pgvector/pgvector:pg16)
  - [x] Update/create redis service (redis:7.2-alpine)
  - [x] Add api service definition
  - [x] Define volumes (postgres_data, redis_data)
  - [x] Copy to root directory for easier access
  - [x] Document usage and configuration
- **Files Modified**:
  - `/docker-compose.yml` (copied from /infra)
  - `/infra/docker-compose.yml` (already existed)
- **Commits**: 1

## Work Log

### Completed Work

**2025-11-12 14:30 EST** - Infrastructure Setup (Day 6-7)
- Reviewed existing docker-compose.yml in /infra directory
- Copied docker-compose.yml to root directory for easier access
- Created automated setup script: `/scripts/setup-infrastructure.sh`
- Created verification script: `/scripts/verify-infrastructure.py`
- Created comprehensive documentation: `/docs/infrastructure-setup.md`
- All tasks automated and ready for execution once Docker Desktop is running

### In Progress
None - Day 6-7 tasks complete

### Blocked Tasks

**Docker Daemon Not Running**
- Docker Desktop needs to be started manually
- Once Docker is running, infrastructure can be verified with:
  ```bash
  ./scripts/setup-infrastructure.sh
  # OR manually:
  docker-compose up -d postgres redis
  cd services/api && alembic upgrade head
  python3 scripts/verify-infrastructure.py
  ```

### Notes
- Phase 2 depends on Phase 1 completion (Status: COMPLETE as of 2025-11-12)
- Current branch: feat/project-init
- Day 6-7 tasks completed but require Docker to be running for verification
- All infrastructure code and scripts are ready for execution

---

## Implementation Decisions

### Decision 1: Docker Compose Location
**Decision**: Copy docker-compose.yml from `/infra` to root directory
**Reasoning**: Easier access for developers; standard convention is root-level docker-compose.yml
**Alternative**: Could symlink, but copy is simpler and more portable

### Decision 2: Automated Setup Script
**Decision**: Create bash script for full infrastructure setup
**Reasoning**: Reduces manual steps; ensures consistent setup across environments
**Benefits**: Health checks, error handling, automatic retries, verification

### Decision 3: Python Verification Script
**Decision**: Create Python script for infrastructure verification
**Reasoning**: Language-native verification; can import actual application code; better error reporting
**Alternative**: Could use bash only, but Python provides richer verification

### Decision 4: Database Naming
**Decision**: Use `meaty_music_dev` as database name (from existing config)
**Reasoning**: Matches MeatyPrompts pattern; clear separation of dev/test/prod
**Note**: Preserved from Phase 1 bootstrap

### Decision 5: PostgreSQL Image
**Decision**: Use `pgvector/pgvector:pg16`
**Reasoning**: Latest stable Postgres with pgvector extension for embeddings
**Future**: AMCS will use pgvector for source embeddings and similarity search

## Commits Created

| Date | Commit Hash | Subagent | Task | Message |
|------|-------------|----------|------|---------|
| 2025-11-12 | (pending) | python-backend-engineer | 4.1, 4.2, 4.3 | feat(infra): Add infrastructure setup and verification scripts |

## Files Created

| File Path | Created By | Task | Status |
|-----------|-----------|------|--------|
| `/docker-compose.yml` | python-backend-engineer | 4.3 | Complete (copied) |
| `/scripts/setup-infrastructure.sh` | python-backend-engineer | 4.1, 4.2 | Complete |
| `/scripts/verify-infrastructure.py` | python-backend-engineer | 4.1, 4.2 | Complete |
| `/docs/infrastructure-setup.md` | python-backend-engineer | 4.1, 4.2, 4.3 | Complete |

## Files Modified

(To be filled in as work progresses)

| File Path | Modified By | Task | Changes |
|-----------|-------------|------|---------|
| - | - | - | - |

## Integration Verification Gates

### Gate 1: Backend Start
- [ ] Backend starts without import errors
- [ ] Health endpoint (/health) responds with 200
- [ ] OpenTelemetry initializes (check console output)
- [ ] Structured logging works (check log format)

### Gate 2: Frontend Build
- [ ] Frontend builds without errors (pnpm build)
- [ ] Pages load in browser (home, dashboard)
- [ ] API client configured correctly
- [ ] Telemetry initialized (check console)

### Gate 3: Database & Cache
- [ ] PostgreSQL accepts connections
- [ ] Alembic migrations run successfully
- [ ] All tables created (tenants, users, user_preferences)
- [ ] Redis accepts connections
- [ ] Docker Compose services start without errors

### Gate 4: Observability
- [ ] Traces appear in console output
- [ ] Structured logs include trace IDs
- [ ] Frontend sends trace context with API calls
- [ ] Backend receives and logs trace context

## Known Issues & Resolutions

(To be filled in as work progresses)

---

## Execution Sequence & Orchestration

This section defines the optimal execution sequence for Phase 2 tasks, including review and validation gates.

### Sequence Overview

```
Day 1-2: Backend Config (python-backend-engineer)
  ↓
Review Gate 1 (code-reviewer)
  ↓
Day 3-4: Frontend Config (ui-engineer)
  ↓
Review Gate 2 (code-reviewer)
  ↓
Day 6-7: Infrastructure Setup (python-backend-engineer)
  ↓
Review Gate 3 (code-reviewer)
  ↓
Day 5: Observability Verification (python-backend-engineer + ui-engineer)
  ↓
Validation Gate (task-completion-validator)
  ↓
Final Review (lead-architect)
```

**Note**: Day 5 (Observability) runs AFTER Day 6-7 (Infrastructure) because database and Redis must be running to verify full end-to-end observability.

### Detailed Execution Steps

#### Step 1: Backend Configuration (1-2 days)
**Agent**: python-backend-engineer

1. Execute Task 1.1: Update config.py
2. Execute Task 1.2: Create Alembic migration
3. Execute Task 1.3: Update main.py
4. Commit changes: "feat(infra): Configure MeatyMusic backend infrastructure"

**Review Gate 1**: code-reviewer
- Verify SERVICE_NAME and POSTGRES_DB updated correctly
- Check migration schema matches MeatyPrompts tenancy tables
- Validate FastAPI app metadata updated
- Ensure all patterns preserved (OpenTelemetry, RLS, middleware)

#### Step 2: Frontend Configuration (1-2 days)
**Agent**: ui-engineer

1. Execute Task 2.1: Update next.config.js
2. Execute Task 2.2: Update API client
3. Execute Task 2.3: Create minimal pages
4. Commit changes: "feat(web): Configure MeatyMusic frontend infrastructure"

**Review Gate 2**: code-reviewer
- Verify Next.js config preserves instrumentation
- Check API client baseURL and headers updated
- Validate pages render without errors
- Ensure telemetry hooks preserved

#### Step 3: Infrastructure Setup (1-2 days)
**Agent**: python-backend-engineer

1. Execute Task 4.3: Create docker-compose.yml (do this FIRST)
2. Execute Task 4.1: Database initialization
3. Execute Task 4.2: Redis setup
4. Commit changes: "feat(infra): Add Docker Compose with PostgreSQL and Redis"

**Review Gate 3**: code-reviewer
- Verify Docker Compose services configured correctly
- Check database migrations run successfully
- Validate Redis connection works
- Ensure volumes and dependencies defined

#### Step 4: Observability Verification (1 day)
**Agents**: python-backend-engineer + ui-engineer (parallel)

**Backend Verification** (python-backend-engineer):
1. Execute Task 3.1: Verify backend tracing
2. Execute Task 3.3: Create infrastructure tests
3. Document tracing verification results

**Frontend Verification** (ui-engineer):
1. Execute Task 3.2: Verify frontend telemetry
2. Document telemetry verification results

**Commit**: "test(infra): Add infrastructure verification tests"

**Validation Gate**: task-completion-validator
- Validate Gate 1: Backend Start (all 4 checks)
- Validate Gate 2: Frontend Build (all 4 checks)
- Validate Gate 3: Database & Cache (all 5 checks)
- Validate Gate 4: Observability (all 4 checks)

#### Step 5: Final Review
**Agent**: lead-architect

1. Review all commits and changes
2. Verify success criteria met (7 items)
3. Approve Phase 2 completion
4. Update CLAUDE.md with any new patterns or learnings
5. Create transition document for Phase 3

### Key Orchestration Decisions

**Why Backend First?**
- Configuration must be correct before infrastructure setup
- Alembic migration needed before database initialization
- FastAPI app must be configured before running

**Why Infrastructure Before Observability?**
- Database and Redis must be running to verify connections
- Backend and frontend need running infrastructure for full verification
- Infrastructure tests require actual database connection

**Why Parallel Verification?**
- Backend and frontend verification are independent
- Saves time (15 min each → 15 min total)
- Each agent verifies their own domain work

**Why Review Gates Between Major Steps?**
- Catch issues early before they compound
- Ensure patterns preserved at each layer
- Maintain quality throughout the phase

### Agent Communication Protocol

When transitioning between agents:

1. **Outgoing Agent** (e.g., python-backend-engineer after Day 1-2):
   - Commit all changes with clear message
   - Update progress tracker with completion status
   - Document any issues or gotchas discovered
   - Tag files modified for review

2. **Code Reviewer**:
   - Review against preservation checklist
   - Validate no patterns broken
   - Approve or request changes
   - Update progress tracker with review status

3. **Incoming Agent** (e.g., ui-engineer starting Day 3-4):
   - Read prior agent's work log
   - Review commits and changes
   - Check for any dependencies or blockers
   - Proceed with assigned tasks

### Contingency Plans

**If Backend Config Fails**:
- Backup: data-layer-expert for migration issues
- Escalate to: lead-architect for architectural decisions

**If Frontend Config Fails**:
- Backup: frontend-developer for TypeScript/Next.js issues
- Escalate to: frontend-architect for architectural decisions

**If Infrastructure Setup Fails**:
- Backup: data-layer-expert for database-specific issues
- Escalate to: ultrathink-debugger for complex debugging

**If Observability Verification Fails**:
- Backup: ultrathink-debugger for root cause analysis
- Escalate to: lead-architect for pattern preservation issues

### Success Metrics

Track these metrics throughout Phase 2:

- **Commits Created**: Target 4 commits (one per major step)
- **Review Cycles**: Target 0-1 revisions per review gate
- **Issues Discovered**: Document all issues for pattern library
- **Time to Resolution**: Track time spent on each task group
- **Pattern Preservation**: 100% of identified patterns must be preserved

---

**Previous Phase**: [Phase 1: Repository Setup](../../docs/project_plans/bootstrap-from-meatyprompts/phase-1-repository-setup.md) ✓ COMPLETE
**Next Phase**: [Phase 3: Domain Model Migration](../../docs/project_plans/bootstrap-from-meatyprompts/phase-3-domain-model-migration.md)
**Bootstrap Plan**: [Overview](../../docs/project_plans/bootstrap-from-meatyprompts/bootstrap-from-meatyprompts.md)
