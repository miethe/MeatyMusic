# Phase 2 Context: Infrastructure Preservation

**Phase**: Phase 2 - Infrastructure Preservation
**Duration**: 5-7 days
**Status**: Not Yet Started
**Last Updated**: 2025-11-12
**Current Branch**: feat/project-init (commit 755580c)

## Phase Summary

Validate all copied infrastructure from MeatyPrompts works correctly in MeatyMusic context, update configuration for AMCS naming conventions, establish database schema foundation with initial migrations, and verify the observability stack (OpenTelemetry, structured logging, distributed tracing).

## Current State

### Git Status
```
Branch: feat/project-init
Latest commit: 755580c - docs: fix context organization
Main branch: main (commit 5dc6a35 - plan: setup artifacts for project development)
Status: Clean working tree (no uncommitted changes)
```

### Phase Prerequisites
- Phase 1 (Repository Setup): COMPLETE
  - Monorepo structure created
  - Infrastructure copied from MeatyPrompts
  - Domain code removed
  - All CI/CD pipelines verified

### Environment Setup
- Backend service: `/services/api` (FastAPI, SQLAlchemy, OpenTelemetry)
- Frontend service: `/apps/web` (Next.js, React, TypeScript)
- PostgreSQL: Supports pgvector extension
- Redis: Cache and queue support
- Observability: OpenTelemetry with console exporter (optional OTLP)

## Key Scope Items

### Backend Configuration Changes
**File**: `/services/api/app/core/config.py`
- SERVICE_NAME: "meatyprompts-api" → "meatymusic-api"
- POSTGRES_DB: "meatyprompts" → "meatymusic"
- All other patterns preserved (multi-tenancy, RLS, caching)

**File**: `/services/api/main.py`
- title: → "MeatyMusic AMCS API"
- description: → "Agentic Music Creation System"
- Preserve: Tracing, middleware stack, health endpoints

### Frontend Configuration Changes
**File**: `/apps/web/next.config.js`
- NEXT_PUBLIC_APP_NAME: "MeatyMusic"
- NEXT_PUBLIC_API_URL: http://localhost:8000 (default)
- Preserve: OpenTelemetry instrumentation hook

**File**: `/apps/web/src/lib/api/client.ts`
- baseURL: Use NEXT_PUBLIC_API_URL
- X-Service-Name: "meatymusic-web"
- Preserve: Interceptors (auth, error handling, logging, trace propagation)

### Database Schema
**File**: `/services/api/alembic/versions/001_initial_schema.py`
New migration creates foundational tables:
- `tenants` - Multi-tenancy support
- `users` - User accounts and authentication
- `user_preferences` - User settings storage

Note: AMCS-specific tables (Song, Style, Lyrics, Persona, etc.) added in Phase 3.

### Infrastructure Setup
**File**: `/docker-compose.yml`
Services:
- postgres:16 with pgvector (port 5432)
- redis:7-alpine (port 6379)
- api service (port 8000, depends on postgres + redis)

## Verification Checklist

### Backend
- [ ] `/services/api/main.py` starts without import errors
- [ ] `curl http://localhost:8000/health` returns 200
- [ ] Logs show "OpenTelemetry initialized"
- [ ] Structured JSON logs include trace IDs

### Frontend
- [ ] `pnpm build` completes without errors
- [ ] Home page loads: `http://localhost:3000`
- [ ] Dashboard loads: `http://localhost:3000/dashboard`
- [ ] Browser console shows telemetry initialization

### Database & Cache
- [ ] PostgreSQL connects on port 5432
- [ ] `alembic upgrade head` completes successfully
- [ ] Tables exist: tenants, users, user_preferences
- [ ] Redis connects and responds to PING

### Observability
- [ ] Traces logged with consistent trace IDs
- [ ] Frontend API calls include trace context headers
- [ ] Backend receives X-Trace-ID in request logs
- [ ] Spans exported to console (OTLP optional)

## Configuration Reference

### Backend Environment Variables
```
SERVICE_NAME=meatymusic-api
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meatymusic
REDIS_URL=redis://localhost:6379
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 (optional)
OTEL_SERVICE_NAME=meatymusic-api
```

### Frontend Environment Variables
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=MeatyMusic
NODE_ENV=development
```

## Key Files & Locations

### Backend
- Config: `/services/api/app/core/config.py`
- Main entry: `/services/api/main.py`
- Migrations: `/services/api/alembic/versions/`
- Tests: `/services/api/tests/test_infrastructure.py`

### Frontend
- Config: `/apps/web/next.config.js`
- API client: `/apps/web/src/lib/api/client.ts`
- Pages: `/apps/web/src/app/page.tsx`, `/apps/web/src/app/dashboard/page.tsx`

### Infrastructure
- Docker Compose: `/docker-compose.yml`
- Database init: Alembic migrations in `/services/api/alembic/versions/`

## Patterns to Preserve

### OpenTelemetry Stack
- Console exporter (logs) enabled by default
- OTLP exporter configurable via env var
- Trace ID propagation through middleware
- Structured logging with trace context

### Authentication & Security
- Clerk integration (JWT validation)
- Row-Level Security (RLS) via PostgreSQL policies
- CORS configuration
- Rate limiting middleware

### Error Handling
- ErrorResponse envelope for all errors
- Structured error logging
- Proper HTTP status codes
- Client-friendly error messages

### Caching Strategy
- Redis for session storage
- Redis for distributed cache
- Connection pooling configured
- Graceful degradation if Redis unavailable

## Common Tasks During Phase 2

### Start Backend
```bash
cd /Users/miethe/dev/homelab/development/MeatyMusic/services/api
uvicorn main:app --reload
```

### Start Frontend
```bash
cd /Users/miethe/dev/homelab/development/MeatyMusic/apps/web
pnpm dev
```

### Run Migrations
```bash
cd /Users/miethe/dev/homelab/development/MeatyMusic/services/api
alembic upgrade head
```

### Start Docker Services
```bash
cd /Users/miethe/dev/homelab/development/MeatyMusic
docker-compose up -d postgres redis
```

### Verify Services
```bash
# Backend health
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000

# Database
psql -U postgres -h localhost -d meatymusic -c "SELECT 1"

# Redis
redis-cli ping
```

## Success Criteria (From Phase Plan)

All of these must be met for Phase 2 completion:

1. Backend starts without errors
2. Frontend builds and runs
3. Database migrations succeed
4. Traces appear in console/OTLP
5. Structured logs include trace IDs
6. Redis connection works
7. Health endpoints return 200

## Important Gotchas & Learnings

### Seed Propagation
- AMCS requires deterministic output (same seed = same result)
- Ensure all random/seeded operations pass seed through workflow
- Document seed handling in each skill

### Configuration Naming
- Use "meatymusic" consistently (not "MeatyMusic" or "MEATY_MUSIC")
- Service names: kebab-case (meatymusic-api, meatymusic-web)
- Database/env names: snake_case (POSTGRES_DB, REDIS_URL)

### Migration Strategy
- Phase 2 creates only foundational tables (tenants, users, user_preferences)
- Domain tables (Song, Style, Lyrics, etc.) created in Phase 3
- Use Alembic revision comments to track domain phase

### OpenTelemetry Best Practices
- Initialize tracing early in app startup
- Propagate trace ID through all service layers
- Include trace ID in all structured logs
- Test trace context propagation end-to-end

## Next Steps After Phase 2

Phase 3 (Domain Model Migration) will:
- Create SQLAlchemy models for Song, Style, Lyrics, Persona, ProducerNotes, Blueprint, ComposedPrompt
- Implement repository layer with CRUD operations
- Create API endpoints for domain entities
- Add frontend forms and pages for workflow UI
- Integrate with Claude Code skills

---

**Phase 2 Plan**: [phase-2-infrastructure-preservation.md](../../docs/project_plans/bootstrap-from-meatyprompts/phase-2-infrastructure-preservation.md)
**Progress Tracker**: [phase-2-infrastructure-preservation-progress.md](../progress/phase-2-infrastructure-preservation-progress.md)
**CLAUDE.md**: [/CLAUDE.md](../../CLAUDE.md)
