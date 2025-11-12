# Phase 1 Context: Repository Setup & Cleanup

**Phase**: 1 of 7 - Repository Setup & Cleanup
**Status**: In Progress (0%)
**Last Updated**: 2025-11-12

## Phase Scope

Copy MeatyPrompts infrastructure as-is → Remove domain code → Establish clean baseline

**Duration**: 3-5 days
**Key Activities**: Structure setup, infrastructure copy, domain cleanup, validation

## Current State

### What's Done
- Tracking infrastructure initialized
- Ready to begin MeatyPrompts analysis

### What's Next
1. Analyze MeatyPrompts repository structure
2. Create monorepo root structure
3. Copy infrastructure files
4. Begin domain code removal

### Active Work
- Phase 1 initialization complete
- Awaiting structure analysis of MeatyPrompts source

## Key Implementation Decisions

None yet - to be documented as decisions are made

## Technical Patterns Used

### Infrastructure Copy Strategy
- **Approach**: Direct copy of infrastructure, defer customization to Phase 2
- **Rationale**: Minimize risk, establish known-good baseline
- **Files**: Root configs, `.github/`, `.claude/`, `docker/`, build configs

### Domain Cleanup Strategy
- **Search Terms**: "prompt", "template", "MP", "MeatyPrompts"
- **Scope**: Models, routes, components, types, test fixtures
- **Preserve**: Infrastructure, build configs, dev tooling

## Gotchas and Learnings

### To Watch For
- **pnpm workspace**: Ensure all package dependencies resolve correctly
- **Docker volumes**: PostgreSQL/Redis data persistence across restarts
- **Python deps**: Poetry lock file may need regeneration after cleanup
- **Type safety**: Remove MP types but don't break shared type infrastructure

### Known Issues
None yet - to be populated during implementation

## Key File Locations

### MeatyPrompts Source
```
/Users/miethe/dev/homelab/development/meatyprompts/
├── apps/web/                   # Frontend application
├── packages/                   # Shared packages
├── backend/                    # FastAPI backend
├── .github/workflows/          # CI/CD pipelines
├── .claude/                    # Claude Code config
├── docker/                     # Docker Compose setup
└── [root configs]              # turbo.json, pnpm-workspace.yaml, etc.
```

### MeatyMusic Target
```
/Users/miethe/dev/homelab/development/MeatyMusic/
├── [same structure as source]
└── docs/project_plans/impl_tracking/bootstrap-phase-1/
    ├── progress/phase-1-progress.md
    └── context/phase-1-context.md
```

## Quick Reference Commands

### Structure Analysis
```bash
# Analyze MeatyPrompts structure
cd /Users/miethe/dev/homelab/development/meatyprompts
tree -L 2 -I 'node_modules|dist|.next|__pycache__|.venv'

# Find domain-specific code
grep -r "prompt" --include="*.py" --include="*.ts" --include="*.tsx" backend/ apps/ packages/
```

### Workspace Setup
```bash
# Initialize pnpm workspace
cd /Users/miethe/dev/homelab/development/MeatyMusic
pnpm install

# Verify workspace
pnpm list -r

# Build all packages
pnpm build
```

### Backend Validation
```bash
# Install Python dependencies
cd backend
poetry install

# Start backend
poetry run uvicorn app.main:app --reload

# Run tests
poetry run pytest
```

### Frontend Validation
```bash
# Start dev server
cd apps/web
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Docker Validation
```bash
# Start all services
docker compose up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f
```

## Integration Points

### Infrastructure Dependencies
- **pnpm workspace**: Root `pnpm-workspace.yaml` defines package structure
- **Turborepo**: `turbo.json` defines build pipeline and task dependencies
- **Docker Compose**: `docker-compose.yml` orchestrates services
- **CI/CD**: `.github/workflows/` defines automated checks

### Service Integration
- **Backend ↔ Database**: PostgreSQL via SQLAlchemy/Alembic
- **Backend ↔ Cache**: Redis for queues and caching
- **Frontend ↔ Backend**: REST API + WebSocket for events
- **Shared Packages**: `packages/ui/`, `packages/config/`, `packages/tsconfig/`

## Success Validation

### Phase 1 Complete When
- ✅ Monorepo structure matches MeatyPrompts
- ✅ `pnpm build` succeeds across all packages
- ✅ Backend starts without errors
- ✅ Docker services start and connect
- ✅ CI/CD pipelines pass
- ✅ Zero references to MP domain terms in codebase

### Verification Commands
```bash
# Full validation
pnpm install && pnpm build && pnpm type-check && pnpm lint
cd backend && poetry install && poetry run pytest
docker compose up -d && docker compose ps
grep -r "prompt\|template" --include="*.py" --include="*.ts" --include="*.tsx" backend/ apps/ packages/ | grep -v node_modules
```

## Reference Documents

- **Bootstrap Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md`
- **AMCS Overview**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/amcs-overview.md`
- **Progress Tracker**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/impl_tracking/bootstrap-phase-1/progress/phase-1-progress.md`

## Phase Boundaries

### Out of Scope for Phase 1
- Schema/entity implementation (Phase 3)
- AMCS-specific customization (Phase 2)
- Workflow skills (Phase 4-5)
- UI customization (Phase 6)

### Hand-off to Phase 2
- Clean, functional monorepo
- All infrastructure validated
- Domain code removed
- Ready for AMCS schema implementation
