# MeatyMusic

**Agentic Music Creation System (AMCS)**

A deterministic, constraint-driven music composition system that transforms structured creative intent into validated musical artifacts.

## Overview

MeatyMusic is an AI-powered music creation platform that converts Song Design Specifications (SDS) into complete, production-ready music compositions with full traceability and reproducibility.

### Key Features

- **Deterministic Composition**: Same inputs + seed = same outputs
- **Constraint-Driven**: Honors genre blueprints, rubrics, and policy guards
- **Multi-Stage Workflow**: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → RENDER
- **Full Traceability**: Every decision carries provenance, hashes, and scores
- **Pluggable Engines**: Swappable render connectors (Suno, etc.)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- pnpm 10+
- Docker & Docker Compose
- PostgreSQL 15+ (with pgvector)
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MeatyMusic.git
cd MeatyMusic

# Install dependencies
pnpm install

# Set up Python environment
cd services/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .

# Set up environment variables
cp infra/.env.docker.example infra/.env.docker
# Edit .env.docker with your credentials
```

### Running with Docker

```bash
cd infra
make setup    # Initial setup
make build    # Build containers
make up       # Start all services
```

Access the application:
- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Architecture

### Monorepo Structure

```
MeatyMusic/
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   ├── ui/               # Shared component library
│   ├── tokens/           # Design tokens
│   ├── api/              # API client
│   └── store/            # State management utilities
├── services/
│   └── api/              # FastAPI backend service
├── infra/                # Docker, Kubernetes, Terraform
├── monitoring/           # Grafana & Prometheus configs
├── docs/                 # Documentation
└── schemas/              # JSON schemas
```

### Tech Stack

**Backend:**
- FastAPI + Uvicorn
- SQLAlchemy 2.0 (async)
- PostgreSQL 16 (pgvector)
- Redis 7
- Alembic migrations
- OpenTelemetry observability

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Zustand state management
- React Query

**DevOps:**
- Docker Compose
- GitHub Actions CI/CD
- Prometheus + Grafana

## Development

### Quick Start for Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/MeatyMusic.git
   cd MeatyMusic
   pnpm install
   ```

2. **Backend Setup**
   ```bash
   cd services/api
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .
   cp .env.example .env
   ```

3. **Start Infrastructure**
   ```bash
   cd infra
   docker-compose up -d meatymusic-postgres meatymusic-redis
   ```

4. **Run Backend**
   ```bash
   cd services/api
   source .venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Run Frontend (new terminal)**
   ```bash
   cd apps/web
   pnpm dev
   ```

Access:
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Frontend: http://localhost:3000

### Running Tests

```bash
# All tests
pnpm test

# Backend tests
cd services/api
pytest

# Frontend tests
cd apps/web
pnpm test

# E2E tests
cd apps/web
pnpm test:e2e
```

### Type Checking

```bash
# Backend
cd services/api
mypy app

# Frontend
pnpm typecheck
```

### Linting

```bash
# Backend
cd services/api
ruff check --fix

# Frontend
pnpm lint
```

### Database Migrations

```bash
cd infra
make migrate                          # Run migrations
make migrate-create MSG="description" # Create new migration
make migrate-down                     # Rollback
```

### Development Workflow

1. **Read First**: Review [CLAUDE.md](./CLAUDE.md) for architecture and constraints
2. **Check PRDs**: Identify relevant PRDs in `docs/project_plans/PRDs/`
3. **Review Blueprints**: For music-specific work, check `docs/hit_song_blueprint/`
4. **Implement**: Follow architectural patterns and constraints
5. **Test**: Write tests for new functionality
6. **Document**: Update docstrings and READMEs as needed

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - AI agent instructions and project overview
- **[PRDs](./docs/project_plans/PRDs/)** - Product requirement documents
- **[Hit Song Blueprints](./docs/hit_song_blueprint/)** - Genre-specific composition rules
- **[Architecture](./docs/architecture/)** - System design documentation

## Workflow

1. **Input**: Create Song Design Spec (SDS) with creative intent
2. **PLAN**: System expands SDS into ordered work targets
3. **STYLE**: Generate style specification with genre constraints
4. **LYRICS**: Create lyrics with citations and structural rules
5. **PRODUCER**: Generate arrangement and mix guidance
6. **COMPOSE**: Build final prompt within model limits
7. **VALIDATE**: Score against rubric with auto-fix loops
8. **RENDER**: Submit to music engine (optional)
9. **REVIEW**: Finalize artifacts with provenance

## Key Concepts

- **SDS (Song Design Spec)**: JSON aggregating all entity specs
- **Blueprint/Rubric**: Genre rules + scoring weights/thresholds
- **Determinism**: Fixed seed + pinned retrieval + low temperature
- **Policy Guards**: Profanity filters, PII redaction, artist normalization
- **Provenance**: Every source chunk tracked with hash citations

## Deployment

### Production Build

```bash
# Build frontend
pnpm --filter "./apps/web" build

# Build backend
cd services/api
pip install -e .

# Build Docker images
cd infra
make build
```

### Environment Variables

Configure via `.env` files:
- `infra/.env.docker` - Docker environment
- `services/api/.env` - Backend configuration
- `apps/web/.env.local` - Frontend configuration

See `.env.example` files for required variables.

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000
```

## Project Structure

```
MeatyMusic/
├── apps/
│   └── web/                  # Next.js web application
├── packages/
│   ├── ui/                   # Shared React component library
│   ├── tokens/               # Design tokens (colors, spacing, etc.)
│   ├── api/                  # Typed API client for frontend
│   └── store/                # Zustand state management stores
├── services/
│   └── api/                  # FastAPI backend service
├── infra/
│   ├── docker-compose.yml    # Service orchestration
│   ├── Makefile              # Development commands
│   └── migrations/           # Database migrations
├── docs/
│   ├── project_plans/        # PRDs and implementation plans
│   ├── hit_song_blueprint/   # Genre-specific composition rules
│   └── architecture/         # System design documentation
├── schemas/                  # JSON schemas for entities
└── CLAUDE.md                 # AI agent instructions
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Commit message conventions
- Issue reporting guidelines

## Resources

- **Primary Reference**: [CLAUDE.md](./CLAUDE.md) - Complete project overview
- **Architecture**: [amcs-overview.md](./docs/amcs-overview.md) - System design
- **Product Requirements**: [docs/project_plans/PRDs/](./docs/project_plans/PRDs/)
- **Music Composition**: [Hit Song Blueprints](./docs/hit_song_blueprint/)
- **Getting Started**: [Getting Started Guide](./docs/development/getting-started.md)

## Troubleshooting

### Common Issues

**Backend won't start**
- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Check `.env` file exists and has correct settings
- Verify database migrations: `alembic current`

**Frontend won't build**
- Clear cache: `rm -rf .next node_modules && pnpm install`
- Check Node version: `node --version` (requires 20+)
- Verify TypeScript: `pnpm typecheck`

**Database connection issues**
- Check Docker network: `docker network ls`
- View PostgreSQL logs: `docker logs meatymusic-postgres`
- Verify connection string in `.env`

See [Troubleshooting Guide](./docs/development/troubleshooting.md) for more solutions.

## License

See [LICENSE](./LICENSE) for details.

## Status

**Bootstrap Phase 1: Infrastructure Complete**

- Phase 1A: Repository setup from MeatyPrompts
- Phase 1B: Infrastructure validation
- Phase 1C: Configuration and secrets
- Phase 1D: Documentation updates (current)
- Phase 2: Database schema and migrations (next)

See [Implementation Plans](./docs/project_plans/) for detailed phases.
