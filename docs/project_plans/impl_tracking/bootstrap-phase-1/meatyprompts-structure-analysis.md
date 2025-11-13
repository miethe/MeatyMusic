# MeatyPrompts Structure Analysis

**Phase**: 1A-1 - Repository Structure Analysis
**Date**: 2025-11-12
**Purpose**: Document MeatyPrompts repository structure to inform MeatyMusic bootstrap copy strategy

## Executive Summary

MeatyPrompts is a well-structured monorepo with clean separation between infrastructure (reusable) and domain code (prompts-specific). The architecture follows modern best practices:

- **Backend**: FastAPI service with layered architecture (models → repositories → services → routes)
- **Frontend**: Next.js 14 (App Router) with Zustand state management
- **Monorepo**: pnpm workspaces with shared packages
- **Infrastructure Quality**: High - comprehensive observability, caching, security, and DevOps

**Key Finding**: ~70% of the codebase is reusable infrastructure; ~30% is domain-specific and needs removal/replacement.

---

## 1. Directory Tree Analysis

### Root Structure

```
meatyprompts/
├── .claude/                      [INFRA] Claude Code configuration
├── .github/workflows/            [INFRA] CI/CD pipelines
├── apps/                         [MIXED] Application layer
│   ├── mobile/                   [DOMAIN] React Native app (low priority)
│   ├── web/                      [MIXED] Next.js web app
│   └── web-old/                  [SKIP] Deprecated
├── config/                       [MIXED] Model provider configs (adapt)
├── docs/                         [DOMAIN] MeatyPrompts documentation
├── infra/                        [INFRA] Docker, docker-compose, Makefile
├── monitoring/                   [INFRA] Grafana dashboards, alerts
├── packages/                     [INFRA] Shared TypeScript packages
│   ├── api/                      [INFRA] API client
│   ├── store/                    [INFRA] Zustand store utilities
│   ├── tokens/                   [INFRA] Design tokens
│   └── ui/                       [INFRA] Component library
├── scripts/                      [MIXED] Utility scripts
├── services/                     [MIXED] Backend services
│   └── api/                      [MIXED] FastAPI service
├── package.json                  [INFRA] Root workspace config
├── pnpm-workspace.yaml           [INFRA] Workspace definition
└── [Various config files]        [INFRA] Root configs
```

### Backend Structure (services/api/)

```
services/api/
├── alembic/                      [INFRA] Database migrations framework
├── app/
│   ├── api/                      [MIXED] Route handlers
│   │   ├── endpoints/            [DOMAIN] 90% prompt/template routes
│   │   ├── deps.py               [INFRA] FastAPI dependencies
│   │   └── v1/                   [DOMAIN] Legacy routes
│   ├── core/                     [INFRA] 95% reusable
│   │   ├── cache*.py             [INFRA] Multi-tier caching system
│   │   ├── config.py             [INFRA] Pydantic settings
│   │   ├── dependencies.py       [INFRA] DI container
│   │   ├── logging.py            [INFRA] Structured logging
│   │   ├── pagination.py         [INFRA] Pagination utilities
│   │   └── security/             [INFRA] Auth utilities
│   ├── db/                       [MIXED]
│   │   ├── models/               [DOMAIN] ORM models (90% domain)
│   │   ├── session.py            [INFRA] DB session management
│   │   ├── logging.py            [INFRA] Query logging
│   │   └── functions/            [INFRA] DB utilities
│   ├── enums/                    [DOMAIN] Business enums
│   ├── middleware/               [INFRA] HTTP middleware
│   ├── models/                   [DOMAIN] SQLAlchemy ORM models
│   ├── monitoring/               [INFRA] Prometheus metrics
│   ├── observability/            [INFRA] OpenTelemetry tracing
│   ├── repositories/             [DOMAIN] Data access layer
│   ├── schemas/                  [DOMAIN] Pydantic models
│   ├── security/                 [INFRA] Row-level security
│   ├── services/                 [DOMAIN] Business logic
│   ├── tests/                    [DOMAIN] Test suite
│   ├── utils/                    [INFRA] Utility functions
│   ├── errors.py                 [INFRA] Error handling
│   ├── main.py                   [INFRA] App factory (needs adaptation)
│   └── utils.py                  [INFRA] Common utilities
├── auth/                         [INFRA] Clerk authentication
├── config/                       [MIXED] Model configs (adapt)
├── Dockerfile                    [INFRA] Container definition
├── pyproject.toml                [INFRA] Python dependencies
└── pytest.ini                    [INFRA] Test configuration
```

### Frontend Structure (apps/web/)

```
apps/web/
├── src/
│   ├── app/                      [MIXED] Next.js routes
│   │   ├── (app)/                [DOMAIN] 90% prompt routes
│   │   ├── (auth)/               [INFRA] Sign-in/up
│   │   ├── (dashboard)/          [DOMAIN] Dashboard
│   │   ├── (marketing)/          [DOMAIN] Landing page
│   │   └── api/                  [INFRA] API routes
│   ├── components/               [DOMAIN] 80% domain components
│   │   ├── editor/               [DOMAIN] Prompt editor
│   │   ├── prompts/              [DOMAIN] Prompt UI
│   │   ├── collections/          [DOMAIN] Collection UI
│   │   ├── layouts/              [INFRA] Layout components
│   │   ├── modals/               [DOMAIN] Modal dialogs
│   │   └── shared/               [INFRA] Reusable components
│   ├── contexts/                 [MIXED] React contexts
│   ├── hooks/                    [MIXED] Custom hooks
│   │   ├── queries/              [DOMAIN] React Query hooks
│   │   ├── mutations/            [DOMAIN] Mutation hooks
│   │   └── [base hooks]          [INFRA] Generic hooks
│   ├── lib/                      [MIXED] Utilities
│   │   ├── api/                  [INFRA] API client
│   │   ├── auth/                 [INFRA] Clerk integration
│   │   ├── validation/           [INFRA] Validation framework
│   │   └── [domain libs]         [DOMAIN] Business logic
│   ├── stores/                   [DOMAIN] Zustand stores
│   ├── types/                    [DOMAIN] TypeScript types
│   └── styles/                   [INFRA] Global styles
├── e2e/                          [DOMAIN] Playwright tests
├── next.config.js                [INFRA] Next.js config
├── tailwind.config.ts            [INFRA] Tailwind config
└── package.json                  [INFRA] Dependencies
```

### Shared Packages (packages/)

```
packages/
├── api/                          [INFRA] TypeScript API client
│   └── src/
│       └── client.ts             [INFRA] HTTP client wrapper
├── store/                        [INFRA] Zustand utilities
│   └── src/
│       └── create-store.ts       [INFRA] Store factory
├── tokens/                       [INFRA] Design tokens
│   └── src/
│       ├── colors.ts             [INFRA] Color palette
│       └── spacing.ts            [INFRA] Spacing scale
└── ui/                           [INFRA] Component library
    └── src/
        ├── button.tsx            [INFRA] Base components
        ├── card.tsx              [INFRA] Base components
        ├── modal.tsx             [INFRA] Base components
        └── theme/                [INFRA] Theme configuration
```

---

## 2. Copy Strategy Matrix

### Legend
- **AS-IS**: Copy without modification
- **ADAPT**: Copy and modify for MeatyMusic domain
- **SKIP**: Don't copy (domain-specific or deprecated)
- **NEW**: Create new for MeatyMusic

### Root Level

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `.github/workflows/` | `.github/workflows/` | ADAPT | Reuse CI/CD structure, update names | None | P0 |
| `.gitignore` | `.gitignore` | AS-IS | Universal ignore patterns | None | P0 |
| `.pre-commit-config.yaml` | `.pre-commit-config.yaml` | AS-IS | Linting hooks | None | P1 |
| `package.json` | `package.json` | ADAPT | Update project name, keep structure | None | P0 |
| `pnpm-workspace.yaml` | `pnpm-workspace.yaml` | AS-IS | Workspace config | None | P0 |
| `commitlint.config.js` | `commitlint.config.js` | AS-IS | Commit conventions | None | P1 |
| `infra/` | `infra/` | ADAPT | Reuse Docker setup, update names | None | P0 |
| `monitoring/` | `monitoring/` | AS-IS | Grafana/Prometheus setup | `infra/` | P1 |
| `docs/` | `docs/` | SKIP | MeatyPrompts-specific | N/A | N/A |
| `config/models/` | `config/engines/` | NEW | Music engine configs (Suno, etc.) | None | P1 |
| `scripts/` | `scripts/` | ADAPT | Keep infra scripts, remove domain | None | P2 |

### Backend (services/api/)

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `services/api/pyproject.toml` | `services/api/pyproject.toml` | ADAPT | Update deps, keep structure | None | P0 |
| `services/api/Dockerfile` | `services/api/Dockerfile` | AS-IS | Generic Python service | None | P0 |
| `services/api/pytest.ini` | `services/api/pytest.ini` | AS-IS | Test config | None | P1 |
| `services/api/alembic/` | `services/api/alembic/` | AS-IS | Migration framework | `app/db/` | P0 |
| `services/api/alembic.ini` | `services/api/alembic.ini` | AS-IS | Alembic config | `alembic/` | P0 |

#### Core Infrastructure

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `app/core/config.py` | `app/core/config.py` | ADAPT | Update settings classes | None | P0 |
| `app/core/async_database.py` | `app/core/async_database.py` | AS-IS | Async DB utilities | None | P0 |
| `app/core/auth.py` | `app/core/auth.py` | AS-IS | Clerk integration | None | P0 |
| `app/core/database.py` | `app/core/database.py` | AS-IS | DB setup | None | P0 |
| `app/core/dependencies.py` | `app/core/dependencies.py` | AS-IS | FastAPI DI | None | P0 |
| `app/core/logging.py` | `app/core/logging.py` | AS-IS | Structured logging | None | P0 |
| `app/core/pagination.py` | `app/core/pagination.py` | AS-IS | Pagination utilities | None | P0 |
| `app/core/cache*.py` (15 files) | `app/core/cache*.py` | AS-IS | Multi-tier caching | `REDIS_URL` | P0 |
| `app/core/cdn_service.py` | `app/core/cdn_service.py` | AS-IS | CDN integration | `cache*.py` | P1 |
| `app/core/security/` | `app/core/security/` | AS-IS | Security utilities | None | P0 |
| `app/core/benchmark.py` | `app/core/benchmark.py` | AS-IS | Performance testing | None | P2 |

#### Database & ORM

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `app/db/session.py` | `app/db/session.py` | AS-IS | Session management | None | P0 |
| `app/db/logging.py` | `app/db/logging.py` | AS-IS | Query logging | None | P0 |
| `app/db/__init__.py` | `app/db/__init__.py` | AS-IS | DB exports | `session.py` | P0 |
| `app/db/rls.py` | `app/db/rls.py` | AS-IS | Row-level security | None | P0 |
| `app/db/models/` | `app/db/models/` | SKIP | Prompt domain models | N/A | N/A |
| `app/models/` | `app/models/` | SKIP | ORM models for prompts | N/A | N/A |

#### Middleware & Observability

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `app/middleware/rate_limiter.py` | `app/middleware/rate_limiter.py` | AS-IS | Rate limiting | None | P0 |
| `app/middleware/correlation.py` | `app/middleware/correlation.py` | AS-IS | Request correlation | None | P0 |
| `app/middleware/request_logger.py` | `app/middleware/request_logger.py` | AS-IS | Request logging | None | P0 |
| `app/middleware/cdn_headers.py` | `app/middleware/cdn_headers.py` | AS-IS | CDN headers | None | P1 |
| `app/observability/tracing.py` | `app/observability/tracing.py` | AS-IS | OpenTelemetry | None | P0 |
| `app/monitoring/` | `app/monitoring/` | AS-IS | Prometheus metrics | None | P1 |

#### Application Layer

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `app/main.py` | `app/main.py` | ADAPT | Update routes, keep structure | All | P0 |
| `app/errors.py` | `app/errors.py` | AS-IS | Error handlers | None | P0 |
| `app/utils.py` | `app/utils.py` | AS-IS | Utility functions | None | P0 |
| `app/utils/` | `app/utils/` | AS-IS | Utility modules | None | P1 |
| `app/enums/` | `app/enums/` | SKIP | Business enums | N/A | N/A |
| `app/schemas/` | `app/schemas/` | SKIP | Pydantic schemas | N/A | N/A |
| `app/repositories/` | `app/repositories/` | SKIP | Repository pattern | N/A | N/A |
| `app/services/` | `app/services/` | SKIP | Business logic | N/A | N/A |
| `app/api/` | `app/api/` | SKIP | Route handlers | N/A | N/A |
| `app/api/deps.py` | `app/api/deps.py` | AS-IS | FastAPI dependencies | `core/` | P0 |

#### Authentication

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `auth/` | `auth/` | AS-IS | Clerk provider | None | P0 |
| `app/security/` | `app/security/` | AS-IS | RLS implementation | None | P0 |

#### Testing

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `app/tests/fixtures/` | `app/tests/fixtures/` | ADAPT | Reuse fixtures structure | None | P1 |
| `app/tests/` (rest) | `app/tests/` | SKIP | Domain-specific tests | N/A | N/A |

### Frontend (apps/web/)

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `apps/web/package.json` | `apps/web/package.json` | ADAPT | Update name, keep deps | None | P0 |
| `apps/web/next.config.js` | `apps/web/next.config.js` | AS-IS | Generic Next.js config | None | P0 |
| `apps/web/tailwind.config.ts` | `apps/web/tailwind.config.ts` | AS-IS | Tailwind setup | `packages/tokens/` | P0 |
| `apps/web/tsconfig.json` | `apps/web/tsconfig.json` | AS-IS | TypeScript config | None | P0 |
| `apps/web/.eslintrc.json` | `apps/web/.eslintrc.json` | AS-IS | ESLint rules | None | P1 |

#### App Structure

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `src/app/layout.tsx` | `src/app/layout.tsx` | ADAPT | Update branding | None | P0 |
| `src/app/(auth)/` | `src/app/(auth)/` | AS-IS | Sign-in/up routes | `lib/auth/` | P0 |
| `src/app/(app)/` | `src/app/(app)/` | SKIP | Domain routes | N/A | N/A |
| `src/app/api/health/` | `src/app/api/health/` | AS-IS | Health check | None | P1 |
| `src/middleware.ts` | `src/middleware.ts` | AS-IS | Auth middleware | None | P0 |

#### Components

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `src/components/layouts/` | `src/components/layouts/` | ADAPT | Reuse layout, update nav | `packages/ui/` | P0 |
| `src/components/shared/` | `src/components/shared/` | AS-IS | Generic components | None | P1 |
| `src/components/skeletons/` | `src/components/skeletons/` | AS-IS | Loading states | None | P1 |
| `src/components/[domain]/` | `src/components/[domain]/` | SKIP | Prompt-specific UI | N/A | N/A |

#### Hooks & Utilities

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `src/hooks/[generic]` | `src/hooks/[generic]` | AS-IS | useDebounce, useAsync, etc. | None | P1 |
| `src/hooks/queries/` | `src/hooks/queries/` | SKIP | React Query hooks | N/A | N/A |
| `src/hooks/mutations/` | `src/hooks/mutations/` | SKIP | Mutation hooks | N/A | N/A |
| `src/lib/api/` | `src/lib/api/` | ADAPT | API client, update routes | `packages/api/` | P0 |
| `src/lib/auth/` | `src/lib/auth/` | AS-IS | Clerk utilities | None | P0 |
| `src/lib/validation/` | `src/lib/validation/` | AS-IS | Validation framework | None | P1 |
| `src/lib/formatters/` | `src/lib/formatters/` | AS-IS | Date, number formatters | None | P1 |
| `src/lib/errors/` | `src/lib/errors/` | AS-IS | Error handling | None | P1 |
| `src/lib/telemetry/` | `src/lib/telemetry/` | AS-IS | Analytics tracking | None | P1 |
| `src/lib/routes/` | `src/lib/routes/` | ADAPT | Route constants | None | P1 |
| `src/lib/sidebar/` | `src/lib/sidebar/` | ADAPT | Sidebar config | None | P1 |
| `src/lib/[domain]/` | `src/lib/[domain]/` | SKIP | Business logic | N/A | N/A |

#### State & Types

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `src/stores/` | `src/stores/` | SKIP | Zustand stores | N/A | N/A |
| `src/types/` | `src/types/` | SKIP | TypeScript types | N/A | N/A |
| `src/contexts/` | `src/contexts/` | SKIP | React contexts | N/A | N/A |

#### Styles

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `src/styles/globals.css` | `src/styles/globals.css` | AS-IS | Tailwind base styles | None | P0 |

### Shared Packages

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `packages/api/` | `packages/api/` | ADAPT | Update API routes | None | P0 |
| `packages/store/` | `packages/store/` | AS-IS | Store utilities | None | P1 |
| `packages/tokens/` | `packages/tokens/` | ADAPT | Update design tokens | None | P0 |
| `packages/ui/` | `packages/ui/` | AS-IS | Component library | `tokens/` | P0 |
| `packages/tsconfig.base.json` | `packages/tsconfig.base.json` | AS-IS | Shared TS config | None | P0 |

### Claude Code Configuration

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `.claude/settings.json` | `.claude/settings.json` | ADAPT | Update project name | None | P0 |
| `.claude/agents/` | `.claude/agents/` | ADAPT | Reuse agent structure | None | P1 |
| `.claude/commands/` | `.claude/commands/` | ADAPT | Reuse command structure | None | P1 |
| `.claude/skills/` | `.claude/skills/` | AS-IS | Reusable skills | None | P1 |
| `.claude/config/` | `.claude/config/` | ADAPT | Update configs | None | P1 |
| `.claude/specs/` | `.claude/specs/` | SKIP | Domain templates | N/A | N/A |
| `.claude/templates/` | `.claude/templates/` | ADAPT | Reuse template structure | None | P1 |

### DevOps & Monitoring

| Source Path | Destination Path | Strategy | Reasoning | Dependencies | Priority |
|-------------|------------------|----------|-----------|--------------|----------|
| `infra/docker-compose.yml` | `infra/docker-compose.yml` | ADAPT | Update service names | None | P0 |
| `infra/Dockerfile` | `infra/Dockerfile` | AS-IS | Generic service | None | P0 |
| `infra/Makefile` | `infra/Makefile` | ADAPT | Update targets | None | P1 |
| `monitoring/dashboards/` | `monitoring/dashboards/` | ADAPT | Update dashboard configs | None | P1 |
| `monitoring/alerts/` | `monitoring/alerts/` | ADAPT | Update alert rules | None | P1 |

---

## 3. Domain Code Identification

### Backend Domain Code (TO REMOVE)

#### Models (app/db/models/, app/models/)
- `prompt.py` - Prompt ORM model
- `prompt_version.py` - Versioning
- `prompt_blocks.py` - Block composition
- `prompt_runs.py` - Execution history
- `prompt_provenance.py` - Lineage tracking
- `collection.py` - Prompt collections
- `context.py` - Context management
- `agent.py` - Agent definitions
- `snippet.py` - Reusable snippets
- `filter_preset.py` - Saved filters
- `model_catalog.py` - Model metadata (adapt)
- `prompt_model_target.py` - Model targeting

#### Schemas (app/schemas/)
- All 40+ schemas are domain-specific
- Exception: `user.py`, `pagination.py` (keep)

#### Repositories (app/repositories/)
- All 30+ repositories are domain-specific
- Exception: `base.py`, `cache_aware_base.py` (keep)

#### Services (app/services/)
- All 40+ services are domain-specific
- Exception: `token_counter_service.py` (adapt)

#### API Routes (app/api/)
- `prompts.py` - Prompt CRUD
- `prompt_versions.py` - Version management
- `prompt_blocks.py` - Block management
- `prompt_runs.py` - Execution
- `prompt_provenance.py` - Provenance
- `prompt_share.py` - Sharing
- `prompt_export.py` - Export
- `prompt_metrics.py` - Metrics
- `collections.py` - Collections
- `contexts.py` - Contexts
- `agents.py` - Agents
- `snippets.py` - Snippets
- `filter_presets.py` - Filters
- `activity.py` - Activity feed
- `analytics.py` - Analytics
- `dashboard.py` - Dashboard
- `catalog.py` - Model catalog (adapt)
- `imex.py` - Import/export (adapt)
- Keep: `auth.py`, `users.py`, `tokens.py`

#### Enums (app/enums/)
- `prompt.py` - Prompt types, statuses
- All domain-specific

### Frontend Domain Code (TO REMOVE)

#### Routes (src/app/(app)/)
- `prompts/` - Prompt management
- `collections/` - Collection views
- `contexts/` - Context management
- `agents/` - Agent vault
- `runs/` - Run history
- `templates/` - Template library
- `analytics/` - Analytics dashboard
- `dashboard/` - Main dashboard
- `models/` - Model catalog (adapt)
- `import/` - Import wizard (adapt)

#### Components (src/components/)
- `prompts/` - Prompt UI (150+ files)
- `collections/` - Collection UI
- `contexts/` - Context UI
- `AgentVault/` - Agent UI
- `runs/` - Run UI
- `templates/` - Template UI
- `analytics/` - Analytics UI
- `dashboard/` - Dashboard UI
- `editor/` - Prompt editor (100+ files)
- `execution/` - Execution UI
- `import-export/` - Import/export UI
- `modals/` - Domain modals
- Keep: `layouts/`, `shared/`, `skeletons/`

#### Hooks (src/hooks/)
- `queries/` - All React Query hooks (40+)
- `mutations/` - All mutation hooks (30+)
- `execution/` - Execution hooks
- Keep: Generic hooks (useDebounce, useAsync, etc.)

#### Lib (src/lib/)
- `editor/` - Editor utilities
- `blocks/` - Block system
- `autocomplete/` - Autocomplete system
- `variables/` - Variable system
- Keep: `api/`, `auth/`, `validation/`, `formatters/`, `errors/`, `telemetry/`

#### State (src/stores/, src/contexts/)
- All Zustand stores (10+)
- All React contexts (8+)

#### Types (src/types/)
- All TypeScript types (30+ files)
- Keep: Generic utility types

---

## 4. Integration Points

### Backend Integration Flow

```
HTTP Request
  ↓
Middleware Stack
  ├── CORSMiddleware
  ├── CorrelationMiddleware (request ID)
  ├── RequestLoggerMiddleware (observability)
  ├── RLSMiddleware (row-level security)
  ├── RateLimitMiddleware
  └── CDNHeadersMiddleware
  ↓
FastAPI Router
  ↓
Endpoint Handler (app/api/)
  ↓
Dependency Injection (app/api/deps.py)
  ├── get_db() → Database session
  ├── get_current_user() → User from Clerk JWT
  ├── require_tenant() → Tenant from RLS
  └── get_cache_manager() → Cache instance
  ↓
Service Layer (app/services/)
  ↓
Repository Layer (app/repositories/)
  ├── CacheAwareBase → L1/L2 caching
  └── Base → Raw DB queries
  ↓
Database (PostgreSQL)
  ├── RLS policies (tenant isolation)
  ├── pgvector extension
  └── Alembic migrations
```

### Frontend Integration Flow

```
User Interaction
  ↓
React Component (src/components/)
  ↓
Custom Hook (src/hooks/)
  ├── useQuery → GET requests
  ├── useMutation → POST/PUT/DELETE
  └── useAsync → Async operations
  ↓
API Client (src/lib/api/)
  ├── fetch wrapper
  ├── error handling
  └── auth headers (Clerk)
  ↓
Backend API (services/api/)
```

### Key Integration Points

#### Authentication (Clerk)
- **Backend**: `auth/providers/clerk.py` validates JWT
- **Frontend**: `src/lib/auth/` wraps Clerk SDK
- **Flow**: Frontend gets JWT → Backend validates → RLS sets tenant

#### Caching (Redis + Memory)
- **Backend**: `app/core/cache_manager.py` orchestrates L1/L2
- **Invalidation**: Tag-based via `cache_invalidation.py`
- **Warming**: Startup warming via `cache_warming_service.py`

#### Observability
- **Tracing**: OpenTelemetry in `app/observability/tracing.py`
- **Logging**: Structlog in `app/core/logging.py`
- **Metrics**: Prometheus in `app/monitoring/`

#### Database
- **ORM**: SQLAlchemy 2.0 async
- **Migrations**: Alembic
- **RLS**: Postgres row-level security in `app/db/rls.py`
- **Tenancy**: `current_tenant()` function enforces isolation

#### State Management
- **Backend**: Stateless (cache for performance)
- **Frontend**: Zustand stores + React Query cache

---

## 5. Risk Assessment

### High Risk (Potential Blockers)

#### 1. Tight Coupling in main.py
**Issue**: `app/main.py` has hardcoded route imports for prompt domain

**Impact**: Must carefully remove prompt routes without breaking app startup

**Mitigation**:
- Create new `app/main.py` from scratch using MeatyPrompts structure
- Import only infrastructure middleware
- Add new routes incrementally

**Risk Level**: HIGH

---

#### 2. Database Model Dependencies
**Issue**: Many infra tables have foreign keys to prompt tables

**Impact**: Can't drop prompt tables without cascade issues

**Mitigation**:
- Create fresh Alembic migration history
- Start with clean schema
- Copy only tenant/user models

**Risk Level**: HIGH

---

#### 3. Shared Enums/Constants
**Issue**: Enums scattered across codebase, mixed infra/domain

**Impact**: Hard to identify what to keep

**Mitigation**:
- Audit all enums manually
- Keep only HTTP status, auth enums
- Create new domain enums for music

**Risk Level**: MEDIUM

---

### Medium Risk (Need Attention)

#### 4. Cache Key Namespaces
**Issue**: Cache keys hardcoded with "prompt", "template" prefixes

**Impact**: Need global search/replace

**Mitigation**:
- Grep for cache key patterns
- Update namespaces to "song", "style", etc.
- Test cache operations thoroughly

**Risk Level**: MEDIUM

---

#### 5. Frontend Component Dependencies
**Issue**: Layout components import prompt-specific components

**Impact**: Can't reuse layouts without refactor

**Mitigation**:
- Extract pure layout from `src/components/layouts/`
- Remove prompt-specific nav items
- Create new MeatyMusic navigation

**Risk Level**: MEDIUM

---

#### 6. API Client URL Hardcoding
**Issue**: Frontend API client has hardcoded `/prompts/` routes

**Impact**: Need to update all API calls

**Mitigation**:
- Create new route constants
- Update API client methods
- Use codegen for type safety

**Risk Level**: MEDIUM

---

### Low Risk (Easy to Handle)

#### 7. Documentation References
**Issue**: Docs reference prompt concepts

**Impact**: Confusing during development

**Mitigation**:
- Delete entire `docs/` directory
- Start with fresh docs

**Risk Level**: LOW

---

#### 8. Environment Variables
**Issue**: `.env.example` has prompt-specific vars

**Impact**: Misleading for new devs

**Mitigation**:
- Create new `.env.example`
- Keep only infra vars (DB, Redis, Clerk)

**Risk Level**: LOW

---

#### 9. Test Fixtures
**Issue**: Test fixtures create prompt data

**Impact**: Tests won't run without adaptation

**Mitigation**:
- Skip copying test suite initially
- Create new fixtures as needed

**Risk Level**: LOW

---

### Dependencies to Update

#### Python Dependencies (pyproject.toml)
**Keep**:
- FastAPI, Uvicorn
- SQLAlchemy, Alembic, psycopg2
- Pydantic, pydantic-settings
- Redis, structlog, OpenTelemetry
- pytest, httpx

**Remove**:
- (None - all are generic)

**Add**:
- `suno-python` (when available)
- `pydub` or similar for audio processing

---

#### TypeScript Dependencies (package.json)
**Keep**:
- Next.js, React, React Query
- Zustand, Tailwind CSS
- Clerk, Zod
- Playwright

**Remove**:
- (None - all are generic)

**Add**:
- Audio player components (e.g., `wavesurfer.js`)
- Music notation libraries (if needed)

---

### Configuration Files to Update

#### Backend
- `pyproject.toml` - Update project name
- `app/core/config.py` - Update `PROJECT_NAME` default
- `alembic.ini` - Update comments
- `.env.example` - Remove domain vars

#### Frontend
- `package.json` - Update name, description
- `next.config.js` - Update app name
- `tailwind.config.ts` - Update theme (optional)

#### CI/CD
- `.github/workflows/*.yml` - Update workflow names, paths
- `infra/docker-compose.yml` - Update service names

---

## 6. File Count Estimates

### Infrastructure (Reusable)

| Category | Files | Lines of Code (est.) |
|----------|-------|---------------------|
| Backend Core | 40 | 12,000 |
| Backend Middleware | 5 | 800 |
| Backend Observability | 5 | 1,200 |
| Backend Auth | 3 | 500 |
| Frontend Layouts | 10 | 1,500 |
| Frontend Lib (Generic) | 20 | 3,000 |
| Shared Packages | 30 | 4,000 |
| DevOps | 15 | 2,000 |
| Claude Config | 20 | 1,000 |
| **Total** | **148** | **26,000** |

### Domain (To Remove/Replace)

| Category | Files | Lines of Code (est.) |
|----------|-------|---------------------|
| Backend Models | 20 | 3,000 |
| Backend Schemas | 40 | 4,000 |
| Backend Repositories | 30 | 5,000 |
| Backend Services | 40 | 8,000 |
| Backend Routes | 35 | 6,000 |
| Frontend Routes | 50 | 5,000 |
| Frontend Components | 200 | 25,000 |
| Frontend Hooks | 70 | 7,000 |
| Frontend Lib (Domain) | 40 | 6,000 |
| Frontend State | 20 | 3,000 |
| Frontend Types | 30 | 2,000 |
| Tests | 150 | 15,000 |
| **Total** | **725** | **89,000** |

### Summary
- **Infrastructure**: ~23% of files, ~23% of code
- **Domain**: ~77% of files, ~77% of code
- **Copy Strategy**: AS-IS (148 files), ADAPT (50 files), SKIP (725 files)

---

## 7. Copy Execution Plan

### Phase 1: Monorepo Foundation (Day 1)

**Order**:
1. Root config files (package.json, pnpm-workspace.yaml, .gitignore)
2. Shared packages (ui, tokens, store, api)
3. DevOps (infra/, .github/workflows/)

**Validation**:
- `pnpm install` succeeds
- `pnpm build` (packages) succeeds
- Docker Compose starts

---

### Phase 2: Backend Infrastructure (Day 2-3)

**Order**:
1. Core (config, logging, database, auth)
2. Middleware (rate limiting, correlation, logging)
3. Observability (tracing, monitoring)
4. Caching (cache_manager, warming, invalidation)
5. Database (session, RLS, Alembic)

**Validation**:
- Backend starts without domain routes
- Health check endpoint responds
- Auth validates test JWT
- Cache connects to Redis

---

### Phase 3: Frontend Infrastructure (Day 4-5)

**Order**:
1. App structure (layout, middleware)
2. Auth routes (sign-in, sign-up)
3. Shared components (layouts, skeletons)
4. Lib utilities (api, auth, validation, errors)

**Validation**:
- Frontend starts
- Auth flow works (sign-in redirects)
- Layout renders
- API client makes test request

---

### Phase 4: Claude Code Setup (Day 6)

**Order**:
1. Settings.json
2. Agents
3. Commands
4. Skills
5. Templates

**Validation**:
- Claude Code loads project
- Skills execute
- Commands work

---

## 8. Adaptation Checklist

### Global Search/Replace

| Find | Replace | Scope |
|------|---------|-------|
| `MeatyPrompts` | `MeatyMusic` | All files |
| `meatyprompts` | `meatymusic` | All files |
| `prompt` | `song` | Variable/function names (selective) |
| `template` | `style` | Variable/function names (selective) |
| `collection` | `playlist` | Variable/function names (selective) |
| `execution` | `render` | Variable/function names (selective) |

**Warning**: Use selective replace for code, not comments/strings

---

### Backend Adaptations

#### app/core/config.py
```python
# Line 229
PROJECT_NAME: str = "MeatyMusic"

# Add new settings
SUNO_API_KEY: str | None = None
SUNO_API_URL: str = "https://api.suno.ai"
RENDER_ENABLED: bool = False  # Feature flag
```

#### app/main.py
```python
# Remove all prompt route imports
# Add new music routes (Phase 2+)
from app.api import songs, styles, lyrics, ...
```

---

### Frontend Adaptations

#### apps/web/package.json
```json
{
  "name": "meatymusic-web",
  "description": "MeatyMusic Web Application"
}
```

#### src/lib/routes/routes.ts
```typescript
export const ROUTES = {
  SONGS: '/songs',
  STYLES: '/styles',
  LYRICS: '/lyrics',
  // ... new routes
}
```

---

### Docker Adaptations

#### infra/docker-compose.yml
```yaml
services:
  meatymusic-api:
    build: ../services/api
    environment:
      - PROJECT_NAME=MeatyMusic

  meatymusic-web:
    build: ../apps/web
```

---

### CI/CD Adaptations

#### .github/workflows/test.yml
```yaml
name: MeatyMusic Tests

on:
  push:
    branches: [main, feat/*]

jobs:
  backend-tests:
    name: Backend Tests
    # ... update paths
```

---

## 9. Integration Testing Plan

### Backend Integration Tests

**Test**: Health check
```bash
curl http://localhost:8000/healthz
# Expected: {"status": "ok"}
```

**Test**: Auth (with test JWT)
```bash
curl -H "Authorization: Bearer $TEST_JWT" http://localhost:8000/me
# Expected: User object
```

**Test**: Cache
```bash
# Start Redis
docker-compose up -d redis

# Check cache connectivity
curl http://localhost:8000/api/v1/health/cache
# Expected: {"status": "healthy", "L1": true, "L2": true}
```

**Test**: Database
```bash
# Run migrations
cd services/api && alembic upgrade head

# Check DB connectivity
curl http://localhost:8000/_int/tenancy/ping
# Expected: {"tenant_id": null}
```

---

### Frontend Integration Tests

**Test**: App starts
```bash
cd apps/web && pnpm dev
# Visit http://localhost:3000
# Expected: Login page
```

**Test**: Auth flow
```bash
# Click "Sign In"
# Expected: Clerk modal opens
# Sign in with test account
# Expected: Redirect to dashboard
```

**Test**: API communication
```bash
# In browser console
fetch('/api/health').then(r => r.json())
// Expected: {"status": "ok"}
```

---

### End-to-End Integration Tests

**Test**: Full stack auth
```bash
# Playwright test
pnpm test:e2e --grep "auth flow"
```

**Test**: API + Frontend
```bash
# Create test song via API
# Verify it appears in frontend list
```

---

## 10. Next Steps (Hand-off to Phase 1A-2)

### Immediate Actions

1. **Review this analysis** with team
2. **Approve copy strategy** (AS-IS / ADAPT / SKIP decisions)
3. **Set up target directory structure** in MeatyMusic repo
4. **Begin Phase 1A-2**: Execute monorepo creation

---

### Open Questions

1. **Do we copy mobile app?**
   - Recommendation: SKIP for MVP, focus on web
   - Can add later using same infrastructure

2. **Do we keep model catalog code?**
   - Recommendation: ADAPT
   - Replace model providers with music engines (Suno, etc.)

3. **Do we copy monitoring dashboards?**
   - Recommendation: YES (ADAPT)
   - Update metrics to music domain (render time, audio quality, etc.)

4. **Do we copy test suite?**
   - Recommendation: SKIP initially
   - Copy test infrastructure (fixtures, helpers)
   - Write new tests as we build features

---

## 11. Success Criteria

### Phase 1A-1 Complete When:

- [x] Complete directory tree documented
- [x] Copy strategy table created (150+ entries)
- [x] Domain code identified (725 files)
- [x] Integration points documented
- [x] Risk assessment with mitigations
- [x] File count estimates provided
- [x] Hand-off to Phase 1A-2 ready

### Phase 1A Complete When:

- [ ] Monorepo created (Phase 1A-2)
- [ ] Infrastructure copied (Phase 1A-3)
- [ ] Basic integration tests pass (Phase 1A-4)
- [ ] Documentation updated (Phase 1A-5)

---

## Appendix A: Key Files Reference

### Must-Copy Files (P0 - Critical)

**Backend**:
- `services/api/app/core/config.py` - Settings
- `services/api/app/core/dependencies.py` - DI
- `services/api/app/core/database.py` - DB setup
- `services/api/app/core/logging.py` - Logging
- `services/api/app/core/auth.py` - Auth
- `services/api/app/db/session.py` - Sessions
- `services/api/app/db/rls.py` - Row-level security
- `services/api/app/middleware/*.py` - All middleware
- `services/api/app/observability/*.py` - All observability

**Frontend**:
- `apps/web/src/app/layout.tsx` - Root layout
- `apps/web/src/middleware.ts` - Auth middleware
- `apps/web/src/lib/api/` - API client
- `apps/web/src/lib/auth/` - Auth utilities
- `apps/web/src/components/layouts/` - Layout components

**Shared**:
- `packages/ui/` - Component library
- `packages/tokens/` - Design tokens
- `packages/api/` - API types

**DevOps**:
- `infra/docker-compose.yml` - Docker setup
- `.github/workflows/` - CI/CD

---

## Appendix B: Complexity Estimates

### Backend Complexity

| Component | Complexity | Reason |
|-----------|------------|--------|
| Core | Low | Well-abstracted, minimal domain coupling |
| Caching | Medium | Complex but self-contained, good docs |
| Auth | Low | Clerk handles heavy lifting |
| Database | Medium | RLS requires understanding, Alembic well-structured |
| Middleware | Low | Standard FastAPI patterns |
| Observability | Medium | OpenTelemetry setup, but pre-configured |

### Frontend Complexity

| Component | Complexity | Reason |
|-----------|------------|--------|
| Layouts | Low | Clean separation from domain |
| Auth | Low | Clerk integration straightforward |
| API Client | Medium | Need to update all routes |
| Components | Low | Shadcn/UI abstracts complexity |
| State | Medium | Zustand patterns, but need new stores |

---

## Appendix C: Technology Stack

### Backend
- **Language**: Python 3.12+
- **Framework**: FastAPI 0.115+
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: PostgreSQL 15+ (with pgvector)
- **Cache**: Redis 7+
- **Migrations**: Alembic
- **Auth**: Clerk
- **Observability**: OpenTelemetry, Structlog, Prometheus
- **Testing**: pytest, pytest-asyncio

### Frontend
- **Language**: TypeScript 5.9+
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3
- **Components**: Shadcn/UI
- **State**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Auth**: Clerk
- **Testing**: Playwright, Jest

### DevOps
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Grafana, Prometheus
- **Package Manager**: pnpm (monorepo)

---

## Document Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-12 | Claude (System Architect) | Initial analysis created |

---

**Status**: Ready for Phase 1A-2 (Monorepo Creation)
