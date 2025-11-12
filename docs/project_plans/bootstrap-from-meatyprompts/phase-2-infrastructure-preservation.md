# Phase 2: Infrastructure Preservation (5-7 days)

**Timeline**: 5-7 days
**Effort**: 21 story points
**Dependencies**: Phase 1 complete
**Team**: python-backend-engineer, ui-engineer, infrastructure-engineer, code-reviewer

---

## Goals

- Validate all copied infrastructure works in MeatyMusic context
- Update configuration for AMCS naming
- Establish database schema foundation
- Verify observability stack

## Tasks

### Day 1-2: Backend Configuration

1. **Update configuration** (`/services/api/app/core/config.py`):
   ```python
   # Change service name
   SERVICE_NAME = "meatymusic-api"  # was: meatyprompts-api

   # Update database name
   POSTGRES_DB = "meatymusic"  # was: meatyprompts

   # Preserve all patterns:
   # - Multi-tenancy support
   # - Row-level security
   # - OpenTelemetry settings
   # - Redis configuration
   ```

2. **Create initial Alembic migration**:
   ```python
   # /services/api/alembic/versions/001_initial_schema.py
   """Initial AMCS schema.

   Creates foundational tables for multi-tenancy and users.
   AMCS-specific tables will be added in Phase 3.
   """

   def upgrade():
       # Copy tenancy tables from MeatyPrompts
       op.create_table('tenants', ...)
       op.create_table('users', ...)
       op.create_table('user_preferences', ...)
   ```

3. **Update API main** (`/services/api/main.py`):
   ```python
   from fastapi import FastAPI
   from app.core.config import settings
   from app.core.database import engine
   from app.observability.tracing import init_tracing

   app = FastAPI(
       title="MeatyMusic AMCS API",
       description="Agentic Music Creation System",
       version="0.1.0"
   )

   # Initialize tracing (preserve pattern)
   init_tracing(app, engine)

   # Add middleware (preserve pattern)
   # - TraceIdMiddleware
   # - CorrelationMiddleware
   # - RequestLoggerMiddleware
   ```

### Day 3-4: Frontend Configuration

1. **Update Next.js configuration** (`/apps/web/next.config.js`):
   ```javascript
   module.exports = {
     // Preserve OpenTelemetry instrumentation
     experimental: {
       instrumentationHook: true,
     },

     // Update API URL
     env: {
       NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
       NEXT_PUBLIC_APP_NAME: 'MeatyMusic',
     },
   }
   ```

2. **Update API client** (`/apps/web/src/lib/api/client.ts`):
   ```typescript
   // Preserve axios interceptors for:
   // - Authentication token injection
   // - Error handling
   // - Request/response logging
   // - Trace ID propagation

   const apiClient = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL,
     headers: {
       'X-Service-Name': 'meatymusic-web',
     },
   })
   ```

3. **Create minimal pages**:
   ```typescript
   // /apps/web/src/app/page.tsx
   export default function HomePage() {
     return <div>MeatyMusic AMCS - Coming Soon</div>
   }

   // /apps/web/src/app/dashboard/page.tsx
   export default function DashboardPage() {
     return <div>Dashboard - Coming Soon</div>
   }
   ```

### Day 5: Observability Verification

1. **Verify tracing**:
   - Start backend: `cd services/api && uvicorn main:app --reload`
   - Verify OpenTelemetry exports to console/OTLP
   - Verify trace IDs in logs

2. **Verify frontend telemetry**:
   - Start frontend: `cd apps/web && pnpm dev`
   - Verify browser spans
   - Verify API calls include trace context

3. **Test infrastructure**:
   ```python
   # /services/api/tests/test_infrastructure.py
   def test_database_connection():
       """Verify database connection works."""

   def test_tracing_enabled():
       """Verify OpenTelemetry is configured."""

   def test_logging_structured():
       """Verify structured logging works."""
   ```

### Day 6-7: Database & Redis Setup

1. **Database initialization**:
   ```bash
   # Start PostgreSQL with pgvector
   docker-compose up -d postgres

   # Run migrations
   cd services/api
   alembic upgrade head
   ```

2. **Redis setup**:
   ```bash
   # Start Redis
   docker-compose up -d redis

   # Verify connection
   python -c "from app.core.cache import redis_client; print(redis_client.ping())"
   ```

3. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: pgvector/pgvector:pg16
       environment:
         POSTGRES_DB: meatymusic
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data

     api:
       build: ./services/api
       environment:
         DATABASE_URL: postgresql://postgres:postgres@postgres:5432/meatymusic
         REDIS_URL: redis://redis:6379
       ports:
         - "8000:8000"
       depends_on:
         - postgres
         - redis

   volumes:
     postgres_data:
     redis_data:
   ```

## Agent Assignments

- **Backend**: python-backend-engineer
- **Frontend**: ui-engineer
- **DevOps**: infrastructure-engineer
- **Review**: code-reviewer

## Deliverables

- Working backend API with health endpoints
- Working frontend with minimal pages
- Database migrations for foundational tables
- Docker Compose for local development
- Observability verified (logs, traces)

## Success Criteria

- [x] Backend starts without errors
- [x] Frontend builds and runs
- [x] Database migrations succeed
- [x] Traces appear in console/OTLP
- [x] Structured logs include trace IDs
- [x] Redis connection works
- [x] Health endpoints return 200

## Verification Commands

### Backend Health Check
```bash
cd services/api
uvicorn main:app --reload

# In another terminal
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### Frontend Build Check
```bash
cd apps/web
pnpm dev

# In another terminal
curl http://localhost:3000
# Expected: HTML response with "MeatyMusic"
```

### Database Migration Check
```bash
cd services/api
alembic current
# Expected: Shows current revision

alembic upgrade head
# Expected: No errors, migrations applied
```

### Observability Check
```bash
# Start backend and check logs
cd services/api && uvicorn main:app --reload

# Look for:
# - Trace IDs in log output
# - OpenTelemetry initialization message
# - Structured JSON logs
```

## Key Configuration Changes

### Updated Files
- `/services/api/app/core/config.py` - Service name, database name
- `/services/api/main.py` - App title, description
- `/apps/web/next.config.js` - App name, API URL
- `/apps/web/src/lib/api/client.ts` - Service name header
- `/docker-compose.yml` - Created with postgres, redis, api services

### Preserved Patterns
- **OpenTelemetry**: Full tracing stack preserved
- **Row-Level Security**: Security context and guards
- **Middleware Stack**: Request logging, correlation, rate limiting
- **Error Handling**: ErrorResponse envelope
- **Authentication**: Clerk integration patterns
- **Caching**: Redis client and patterns

## Infrastructure Validation Gates

### Gate 1: Backend Start
- [ ] Backend starts without import errors
- [ ] Health endpoint responds
- [ ] OpenTelemetry initializes
- [ ] Structured logging works

### Gate 2: Frontend Build
- [ ] Frontend builds without errors
- [ ] Pages load in browser
- [ ] API client configured correctly
- [ ] Telemetry initialized

### Gate 3: Database & Cache
- [ ] PostgreSQL accepts connections
- [ ] Alembic migrations run
- [ ] Redis accepts connections
- [ ] Docker Compose services start

---

**Previous Phase**: [Phase 1: Repository Setup](./phase-1-repository-setup.md)
**Next Phase**: [Phase 3: Domain Model Migration](./phase-3-domain-model-migration.md)
**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
