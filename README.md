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

### Running Locally

**Backend:**
```bash
cd services/api
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd apps/web
pnpm dev
```

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
```

### Database Migrations

```bash
cd infra
make migrate                          # Run migrations
make migrate-create MSG="description" # Create new migration
make migrate-down                     # Rollback
```

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

See [LICENSE](./LICENSE) for details.

## Status

**Pre-implementation (Design Phase)**

Currently in Phase 1: Bootstrap implementation from MeatyPrompts infrastructure.
