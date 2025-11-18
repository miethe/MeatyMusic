# Infrastructure Setup Guide

This guide covers setting up the MeatyMusic AMCS infrastructure components: PostgreSQL, Redis, and Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Python 3.11+ (for verification scripts)
- Node.js 18+ and pnpm (for frontend)

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script from the project root:

```bash
./scripts/setup-infrastructure.sh
```

This script will:
1. Check Docker is running
2. Start PostgreSQL with pgvector
3. Start Redis
4. Run Alembic migrations
5. Verify all tables and RLS policies
6. Test Redis operations

### Option 2: Manual Setup

#### Step 1: Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check service status
docker-compose ps
```

#### Step 2: Wait for Services to be Ready

PostgreSQL:
```bash
# Wait for PostgreSQL to accept connections
docker-compose exec postgres pg_isready -U mm_user -d meaty_music_dev
```

Redis:
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
# Expected output: PONG
```

#### Step 3: Run Database Migrations

```bash
cd services/api
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 270ea5bb498b, initial_schema
```

#### Step 4: Verify Database Tables

```bash
docker-compose exec postgres psql -U mm_user -d meaty_music_dev -c "\dt"
```

Expected tables:
- `tenants`
- `users`
- `user_preferences`

Check RLS policies:
```bash
docker-compose exec postgres psql -U mm_user -d meaty_music_dev -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
```

Expected policies:
- `tenant_isolation_policy` on `users`
- `tenant_isolation_policy` on `user_preferences`

#### Step 5: Verify Infrastructure

Run the verification script:

```bash
python3 scripts/verify-infrastructure.py
```

## Docker Compose Configuration

### Services

The `docker-compose.yml` includes:

#### PostgreSQL (postgres)
- **Image**: `pgvector/pgvector:pg16`
- **Port**: `5432`
- **Database**: `meaty_music_dev`
- **User**: `mm_user`
- **Extensions**: pgvector for embeddings
- **Health Check**: `pg_isready` with 5 retries

#### Redis (redis)
- **Image**: `redis:7.2-alpine`
- **Port**: `6379`
- **Persistence**: AOF enabled
- **Memory**: 256MB with LRU eviction
- **Health Check**: `redis-cli ping` with 5 retries

#### API (api)
- **Build**: From `services/api/Dockerfile`
- **Port**: `8000`
- **Dependencies**: postgres, redis
- **Health Check**: `/healthz` endpoint

#### Web (web)
- **Build**: From `apps/web/Dockerfile`
- **Port**: `3000`
- **Dependencies**: api
- **Health Check**: `/api/health` endpoint

#### Migrations (migrations)
- **Purpose**: One-time migration runner
- **Command**: `alembic upgrade head`
- **Dependencies**: postgres
- **Restart**: No (runs once)

### Volumes

- `postgres_data`: PostgreSQL data directory
- `redis_data`: Redis persistence files

### Networks

- `meatymusic`: Bridge network for all services

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_DB=meaty_music_dev
POSTGRES_USER=mm_user
POSTGRES_PASSWORD=secure_dev_pw
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# API
API_PORT=8000

# Web
WEB_PORT=3000

# Clerk Authentication (optional for infrastructure testing)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Environment
ENVIRONMENT=development
NODE_ENV=development

# Observability
OBS_TRACING_ENABLED=true
OBS_TELEMETRY_ENABLED=true
OBS_LOG_JSON_FORMAT=true
OBS_LOG_LEVEL=INFO
OBS_OTEL_EXPORTER_TYPE=console
```

### Optional Variables

```bash
# Dev Auth Bypass (for testing without Clerk)
DEV_AUTH_BYPASS_ENABLED=false
DEV_AUTH_BYPASS_SECRET=dev_secret_123
DEV_AUTH_BYPASS_USER_ID=user_test123

# OpenTelemetry OTLP Export
OBS_OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

## Database Schema

The initial migration creates the foundational tables for multi-tenancy:

### Tables

#### tenants
- `id` (String, PK)
- `name` (String, unique)
- `slug` (String, unique)
- `display_name` (String)
- `description` (Text)
- `is_active` (Boolean)
- `is_trial` (Boolean)
- `trial_ends_at` (DateTime)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### users
- `id` (String, PK)
- `tenant_id` (String, FK → tenants)
- `clerk_user_id` (String, unique)
- `email` (String, unique)
- `first_name` (String)
- `last_name` (String)
- `username` (String, unique)
- `is_active` (Boolean)
- `email_verified` (Boolean)
- `last_login_at` (DateTime)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### user_preferences
- `id` (String, PK)
- `user_id` (String, FK → users)
- `preferences` (JSONB)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Row-Level Security (RLS)

Both `users` and `user_preferences` have RLS enabled with tenant isolation policies:

```sql
-- Users can only see users in their tenant
CREATE POLICY tenant_isolation_policy ON users
USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE));

-- User preferences isolated via user's tenant
CREATE POLICY tenant_isolation_policy ON user_preferences
USING (user_id IN (
    SELECT id FROM users
    WHERE tenant_id::text = current_setting('app.current_tenant_id', TRUE)
));
```

## Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
1. Start Docker Desktop: `open -a Docker`
2. Wait 30-60 seconds for Docker to initialize
3. Verify: `docker ps`

### PostgreSQL Connection Failed

**Error**: `could not connect to server`

**Solution**:
1. Check PostgreSQL is running: `docker-compose ps postgres`
2. Check health: `docker-compose exec postgres pg_isready -U mm_user`
3. View logs: `docker-compose logs postgres`
4. Restart: `docker-compose restart postgres`

### Migration Failed

**Error**: `alembic.util.exc.CommandError`

**Solution**:
1. Check database connection: `docker-compose exec postgres psql -U mm_user -d meaty_music_dev -c "SELECT 1;"`
2. Check Alembic config: `cd services/api && alembic current`
3. View migration SQL: `alembic upgrade head --sql`
4. Reset database: `docker-compose down -v && docker-compose up -d postgres`

### Redis Connection Failed

**Error**: `redis.exceptions.ConnectionError`

**Solution**:
1. Check Redis is running: `docker-compose ps redis`
2. Test connection: `docker-compose exec redis redis-cli ping`
3. View logs: `docker-compose logs redis`
4. Restart: `docker-compose restart redis`

### Port Already in Use

**Error**: `port is already allocated`

**Solution**:
1. Check what's using the port: `lsof -i :5432` (or :6379, :8000, :3000)
2. Stop the conflicting service
3. Or change the port in `.env`:
   ```bash
   POSTGRES_PORT=5433
   REDIS_PORT=6380
   API_PORT=8001
   WEB_PORT=3001
   ```

## Verification Checklist

After setup, verify:

- [ ] Docker Desktop is running
- [ ] PostgreSQL accepts connections on port 5432
- [ ] Redis accepts connections on port 6379
- [ ] Alembic migrations ran successfully
- [ ] Tables `tenants`, `users`, `user_preferences` exist
- [ ] RLS policies are enabled on `users` and `user_preferences`
- [ ] Indexes created correctly
- [ ] Redis SET/GET operations work
- [ ] All services show "healthy" status: `docker-compose ps`

## Next Steps

After infrastructure is verified:

1. **Start the API**:
   ```bash
   cd services/api
   uvicorn main:app --reload
   ```

2. **Access API Documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Test Health Endpoint**:
   ```bash
   curl http://localhost:8000/healthz
   ```

4. **Start the Frontend** (optional):
   ```bash
   cd apps/web
   pnpm dev
   ```

5. **Access Web App**:
   - Frontend: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard

## Reference

- **Docker Compose File**: `/docker-compose.yml`
- **Alembic Migrations**: `/services/api/alembic/versions/`
- **API Configuration**: `/services/api/app/core/config.py`
- **Setup Script**: `/scripts/setup-infrastructure.sh`
- **Verification Script**: `/scripts/verify-infrastructure.py`

## Phase 2 Day 6-7 Deliverables

This infrastructure setup completes Phase 2 Day 6-7 tasks:

### Task 6.1: Docker Compose Configuration ✓
- Created comprehensive `docker-compose.yml` in root and `infra/`
- Configured PostgreSQL 16 with pgvector
- Configured Redis 7 with persistence
- Added health checks for all services
- Configured proper volumes and networking

### Task 6.2: Database Initialization ✓
- Created setup script to start PostgreSQL
- Automated Alembic migration execution
- Verification of table creation
- Verification of RLS policies

### Task 6.3: Redis Setup and Verification ✓
- Configured Redis with proper persistence
- Created Redis connection testing
- Automated SET/GET operation verification

All subtasks completed and documented for manual execution.
