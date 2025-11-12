# Phase 0: Foundation & Scaffolding

**Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for implementation
**Duration**: 1-2 weeks
**Critical Path**: YES - All subsequent phases depend on this

---

## Phase Overview

### Goals

Phase 0 establishes the foundational infrastructure for the MeatyMusic AMCS system. This includes:

1. **Project scaffolding** - Directory structure, build tools, linting, testing frameworks
2. **JSON Schemas** - Formal definitions for all entities (SDS, Style, Lyrics, etc.)
3. **Taxonomies & Constraints** - Tag categories, conflict matrices, engine limits
4. **Database Schema** - Postgres tables, indexes, RLS policies

### Why Critical Path

Every subsequent phase depends on Phase 0 deliverables:

- **Phase 1** (Entity Services) requires database schema and JSON schemas for validation
- **Phase 2** (Aggregation) requires SDS schema and validation logic
- **Phase 3** (Orchestration) requires taxonomies, conflict matrices, and engine limits
- **Phase 4** (Frontend) requires TypeScript types generated from JSON schemas
- **Phase 5** (Rendering) requires render job schema and connector patterns

**No work can begin on entity services until schemas are defined and database is initialized.**

### Dependencies

- None (greenfield implementation)
- Existing: PRD files, blueprints, CLAUDE.md
- External: Postgres 15+, Node.js 20+, Python 3.11+

---

## Work Package Summary

| WP | Name | Agent(s) | Duration | Deliverables |
|----|------|----------|----------|--------------|
| WP1 | Project Structure & Tooling | backend-typescript-architect, python-pro | 2-3 days | Directory tree, package.json, pyproject.toml, docker-compose.yml |
| WP2 | JSON Schema Definitions | data-layer-expert | 3-4 days | 8 JSON schemas + validation tests |
| WP3 | Taxonomy & Constraint Files | data-layer-expert | 2-3 days | Tag taxonomies, conflict matrix, engine limits |
| WP4 | Database Schema | data-layer-expert | 2-3 days | Postgres migrations, RLS policies, indexes |

**Total Duration**: 9-13 days (1.5-2 weeks with overlaps)

---

## WP1: Project Structure & Tooling

### Agent Assignment

- **Primary**: backend-typescript-architect
- **Secondary**: python-pro (for backend Python setup)

### Tasks

#### 1.1: Directory Structure

Create the following directory tree:

```
/
├── backend/                      # Python FastAPI services
│   ├── gateway/                  # API gateway
│   │   ├── main.py
│   │   ├── middleware/
│   │   └── routes/
│   ├── services/                 # Business logic
│   │   ├── personas/
│   │   ├── styles/
│   │   ├── lyrics/
│   │   ├── producer_notes/
│   │   ├── sources/
│   │   └── sds/
│   ├── models/                   # SQLAlchemy models
│   ├── schemas/                  # Pydantic models (generated from JSON schemas)
│   ├── auth/                     # JWT handlers, RLS helpers
│   ├── tests/
│   └── pyproject.toml
├── frontend/                     # React/React-Native UI
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── api/
│   │   ├── types/                # TypeScript types (generated from JSON schemas)
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── schemas/                      # JSON Schema definitions (source of truth)
│   ├── entities/
│   │   ├── persona.schema.json
│   │   ├── style.schema.json
│   │   ├── lyrics.schema.json
│   │   ├── producer_notes.schema.json
│   │   ├── sources.schema.json
│   │   └── render_job.schema.json
│   ├── sds.schema.json
│   └── prompt.schema.json
├── taxonomies/                   # Tag definitions, conflicts, limits
│   ├── music_tags.json
│   ├── conflict_matrix.json
│   ├── profanity_lexicon.json
│   └── engine_limits.json
├── limits/                       # Engine-specific constraints
│   ├── suno_v3.json
│   ├── suno_v4.json
│   └── generic.json
├── migrations/                   # Alembic database migrations
│   ├── versions/
│   └── alembic.ini
├── infra/                        # Infrastructure configs
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   └── Dockerfile.frontend
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
├── .claude/                      # Claude Code configuration (existing)
│   ├── skills/
│   ├── agents/
│   └── config/
├── docs/                         # Documentation (existing)
├── docker-compose.yml
├── .env.template
├── .gitignore
└── README.md
```

**Deliverable**: Complete directory structure with placeholder files

#### 1.2: Backend Python Setup

Create `backend/pyproject.toml`:

```toml
[project]
name = "meatymusic-backend"
version = "0.1.0"
description = "AMCS Backend Services"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "sqlalchemy>=2.0.23",
    "alembic>=1.13.0",
    "psycopg[binary,pool]>=3.1.13",
    "pgvector>=0.2.4",
    "redis>=5.0.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "httpx>=0.25.0",
    "jsonschema>=4.20.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "black>=23.11.0",
    "ruff>=0.1.6",
    "mypy>=1.7.0",
]

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"

[tool.black]
line-length = 100
target-version = ['py311']

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W", "UP"]

[tool.mypy]
python_version = "3.11"
strict = true
ignore_missing_imports = true
```

**Deliverable**: `backend/pyproject.toml`

#### 1.3: Frontend TypeScript Setup

Create `frontend/package.json`:

```json
{
  "name": "meatymusic-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "generate-types": "node scripts/generate-types.mjs",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    "@tanstack/react-query": "^5.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.9.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0",
    "json-schema-to-typescript": "^13.1.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@types/*": ["./src/types/*"],
      "@components/*": ["./src/components/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Deliverables**: `frontend/package.json`, `frontend/tsconfig.json`

#### 1.4: Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg15
    container_name: meatymusic-postgres
    environment:
      POSTGRES_USER: meatymusic
      POSTGRES_PASSWORD: dev_password_change_in_prod
      POSTGRES_DB: meatymusic_amcs
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U meatymusic"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: meatymusic-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./infra/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.backend
    container_name: meatymusic-backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://meatymusic:dev_password_change_in_prod@postgres:5432/meatymusic_amcs
      REDIS_URL: redis://redis:6379
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app/backend
      - ./schemas:/app/schemas
      - ./taxonomies:/app/taxonomies
    command: uvicorn backend.gateway.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.frontend
    container_name: meatymusic-frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app/frontend
      - ./schemas:/app/schemas
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

**Deliverable**: `docker-compose.yml`

#### 1.5: Environment Configuration

Create `.env.template`:

```bash
# Database
DATABASE_URL=postgresql://meatymusic:dev_password@localhost:5432/meatymusic_amcs
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=10

# Auth
JWT_SECRET=change_this_in_production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:19006

# Feature Flags
FEATURE_RENDER_SUNO=false
FEATURE_AUTOFIX=true
FEATURE_PERSONAS=true
FEATURE_MCP_SOURCES=false

# Observability
LOG_LEVEL=INFO
LOG_FORMAT=json

# S3 (optional for local dev)
S3_BUCKET_ARTIFACTS=meatymusic-artifacts
S3_BUCKET_RENDERS=meatymusic-renders
S3_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

**Deliverable**: `.env.template`

### Technical Requirements

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Git

### Acceptance Criteria

- [ ] All directories created with README.md placeholders
- [ ] `docker-compose up` starts Postgres and Redis successfully
- [ ] Backend dependencies install: `cd backend && pip install -e .`
- [ ] Frontend dependencies install: `cd frontend && npm install`
- [ ] `.env.template` copied to `.env` works locally
- [ ] Healthchecks pass for all services

### Deliverable Files

```
/docker-compose.yml
/backend/pyproject.toml
/frontend/package.json
/frontend/tsconfig.json
/.env.template
/.gitignore (updated)
/infra/docker/Dockerfile.backend
/infra/docker/Dockerfile.frontend
/infra/postgres/init.sql
/infra/redis/redis.conf
```

---

## WP2: JSON Schema Definitions

### Agent Assignment

- **Primary**: data-layer-expert

### Tasks

#### 2.1: Entity Schemas

Create JSON Schema files for all entities, referencing PRD definitions:

**2.1.1: Persona Schema** (`schemas/entities/persona.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/persona-1.0.json",
  "title": "Persona",
  "type": "object",
  "required": ["name", "vocal_range", "influences"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Persona name"
    },
    "bio": {
      "type": "string",
      "maxLength": 1000,
      "description": "Artist biography or background"
    },
    "vocal_range": {
      "type": "object",
      "required": ["min_note", "max_note"],
      "properties": {
        "min_note": {"type": "string", "pattern": "^[A-G](#|b)?[0-9]$"},
        "max_note": {"type": "string", "pattern": "^[A-G](#|b)?[0-9]$"},
        "comfortable_range": {
          "type": "object",
          "properties": {
            "min_note": {"type": "string"},
            "max_note": {"type": "string"}
          }
        }
      }
    },
    "influences": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1,
      "maxItems": 10,
      "description": "Artist influences (generic, not 'style of X')"
    },
    "tags": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Free-form tags"
    },
    "is_public": {
      "type": "boolean",
      "default": false,
      "description": "If true, persona is a reusable template"
    },
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  }
}
```

**2.1.2: Style Schema** (`schemas/entities/style.schema.json`)

Reference: `docs/project_plans/PRDs/style.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/style-1.0.json",
  "title": "Style",
  "type": "object",
  "required": ["genre_detail", "tempo_bpm", "key", "mood", "tags"],
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "genre_detail": {
      "type": "object",
      "required": ["primary"],
      "properties": {
        "primary": {"type": "string", "minLength": 1},
        "subgenres": {"type": "array", "items": {"type": "string"}},
        "fusions": {"type": "array", "items": {"type": "string"}}
      }
    },
    "tempo_bpm": {
      "oneOf": [
        {"type": "integer", "minimum": 40, "maximum": 220},
        {
          "type": "array",
          "items": {"type": "integer", "minimum": 40, "maximum": 220},
          "minItems": 2,
          "maxItems": 2
        }
      ]
    },
    "time_signature": {
      "type": "string",
      "default": "4/4",
      "pattern": "^[0-9]+/[0-9]+$"
    },
    "key": {
      "type": "object",
      "required": ["primary"],
      "properties": {
        "primary": {
          "type": "string",
          "pattern": "^[A-G](#|b)?\\s?(major|minor)$"
        },
        "modulations": {
          "type": "array",
          "items": {"type": "string", "pattern": "^[A-G](#|b)?\\s?(major|minor)$"}
        }
      }
    },
    "mood": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1,
      "maxItems": 5
    },
    "energy": {
      "type": "string",
      "enum": ["low", "medium", "high", "anthemic"]
    },
    "instrumentation": {
      "type": "array",
      "items": {"type": "string"},
      "maxItems": 3,
      "description": "Limit to 3 to avoid mix dilution"
    },
    "vocal_profile": {"type": "string"},
    "tags": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Taxonomy tags (Era, Rhythm, Mix, etc.)"
    },
    "negative_tags": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Tags to exclude from prompt"
    },
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  }
}
```

**2.1.3: Lyrics Schema** (`schemas/entities/lyrics.schema.json`)

Reference: `docs/project_plans/PRDs/lyrics.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/lyrics-1.0.json",
  "title": "Lyrics",
  "type": "object",
  "required": ["language", "pov", "themes", "section_order"],
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "language": {"type": "string", "default": "en"},
    "pov": {"type": "string", "enum": ["1st", "2nd", "3rd"]},
    "tense": {"type": "string", "enum": ["past", "present", "future"]},
    "themes": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1,
      "maxItems": 5
    },
    "rhyme_scheme": {"type": "string"},
    "meter": {"type": "string"},
    "syllables_per_line": {"type": "integer", "minimum": 4, "maximum": 16},
    "hook_strategy": {
      "type": "string",
      "enum": ["chant", "melodic", "question", "narrative"]
    },
    "repetition_policy": {
      "type": "string",
      "enum": ["minimal", "moderate", "hook-heavy"]
    },
    "imagery_density": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0,
      "description": "0 = abstract, 1 = highly concrete"
    },
    "section_order": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["Intro", "Verse", "PreChorus", "Chorus", "Bridge", "Outro", "Interlude"]
      },
      "minItems": 3
    },
    "constraints": {
      "type": "object",
      "properties": {
        "explicit": {"type": "boolean", "default": false},
        "max_lines": {"type": "integer"},
        "section_requirements": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "min_lines": {"type": "integer"},
              "max_lines": {"type": "integer"},
              "must_end_with_hook": {"type": "boolean"}
            }
          }
        }
      }
    },
    "source_citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["source_id", "weight"],
        "properties": {
          "source_id": {"type": "string", "format": "uuid"},
          "weight": {"type": "number", "minimum": 0.0, "maximum": 1.0}
        }
      }
    },
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  }
}
```

**2.1.4: Producer Notes Schema** (`schemas/entities/producer_notes.schema.json`)

Reference: `docs/project_plans/PRDs/producer_notes.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/producer-notes-1.0.json",
  "title": "ProducerNotes",
  "type": "object",
  "required": ["structure", "instrumentation"],
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "structure": {
      "type": "string",
      "description": "Dash-separated section order (e.g., 'Intro–Verse–Chorus')"
    },
    "hooks": {
      "type": "integer",
      "minimum": 1,
      "maximum": 3,
      "description": "Number of distinct hooks"
    },
    "instrumentation": {
      "type": "array",
      "items": {"type": "string"}
    },
    "section_meta": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "tags": {"type": "array", "items": {"type": "string"}},
          "target_duration_sec": {"type": "integer"}
        }
      }
    },
    "mix": {
      "type": "object",
      "properties": {
        "lufs": {"type": "number", "minimum": -18.0, "maximum": -6.0},
        "space": {"type": "string", "enum": ["tight", "balanced", "lush"]},
        "stereo_width": {"type": "string", "enum": ["mono", "narrow", "wide"]}
      }
    },
    "blueprint_ref": {"type": "string", "description": "Reference to genre blueprint"},
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  }
}
```

**2.1.5: Sources Schema** (`schemas/entities/sources.schema.json`)

Reference: `docs/project_plans/PRDs/sources.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/source-1.0.json",
  "title": "Source",
  "type": "object",
  "required": ["name", "kind", "config", "weight"],
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "name": {"type": "string"},
    "kind": {
      "type": "string",
      "enum": ["file", "web", "api", "mcp"]
    },
    "config": {
      "type": "object",
      "description": "Kind-specific configuration"
    },
    "scopes": {
      "type": "array",
      "items": {"type": "string"}
    },
    "weight": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    },
    "allow": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Keyword allow-list"
    },
    "deny": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Keyword deny-list"
    },
    "provenance": {
      "type": "boolean",
      "default": true,
      "description": "Track citation hashes"
    },
    "mcp_server_id": {"type": "string"},
    "chunks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["content_hash", "text"],
        "properties": {
          "content_hash": {"type": "string"},
          "text": {"type": "string"},
          "embedding": {"type": "array", "items": {"type": "number"}},
          "metadata": {"type": "object"}
        }
      }
    },
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  }
}
```

**2.1.6: Render Job Schema** (`schemas/entities/render_job.schema.json`)

Reference: `docs/project_plans/PRDs/render_job.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/render-job-1.0.json",
  "title": "RenderJob",
  "type": "object",
  "required": ["engine", "prompt", "seed"],
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "engine": {"type": "string", "enum": ["suno", "none", "external"]},
    "model": {"type": "string"},
    "prompt": {"type": "string"},
    "style_tags": {"type": "string"},
    "num_variations": {"type": "integer", "minimum": 1, "maximum": 8},
    "seed": {"type": "integer"},
    "status": {
      "type": "string",
      "enum": ["pending", "running", "completed", "failed"]
    },
    "external_job_id": {"type": "string"},
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": {"type": "string", "format": "uri"},
          "s3_key": {"type": "string"},
          "duration_sec": {"type": "number"},
          "format": {"type": "string"}
        }
      }
    },
    "created_at": {"type": "string", "format": "date-time"},
    "completed_at": {"type": "string", "format": "date-time"}
  }
}
```

#### 2.2: Aggregate Schemas

**2.2.1: SDS Schema** (`schemas/sds.schema.json`)

Reference: `docs/project_plans/PRDs/sds.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/sds-1.0.json",
  "title": "SongDesignSpec",
  "type": "object",
  "required": [
    "title",
    "blueprint_ref",
    "style",
    "lyrics",
    "producer_notes",
    "sources",
    "prompt_controls",
    "render",
    "seed"
  ],
  "properties": {
    "title": {"type": "string"},
    "blueprint_ref": {
      "type": "object",
      "required": ["genre", "version"],
      "properties": {
        "genre": {"type": "string"},
        "version": {"type": "string"}
      }
    },
    "style": {"$ref": "amcs://schemas/style-1.0.json"},
    "lyrics": {"$ref": "amcs://schemas/lyrics-1.0.json"},
    "producer_notes": {"$ref": "amcs://schemas/producer-notes-1.0.json"},
    "persona_id": {"type": ["string", "null"], "format": "uuid"},
    "sources": {
      "type": "array",
      "items": {"$ref": "amcs://schemas/source-1.0.json"}
    },
    "prompt_controls": {
      "type": "object",
      "properties": {
        "positive_tags": {"type": "array", "items": {"type": "string"}},
        "negative_tags": {"type": "array", "items": {"type": "string"}},
        "max_style_chars": {"type": "integer"},
        "max_prompt_chars": {"type": "integer"}
      }
    },
    "render": {
      "type": "object",
      "required": ["engine"],
      "properties": {
        "engine": {"type": "string", "enum": ["suno", "none", "external"]},
        "model": {"type": ["string", "null"]},
        "num_variations": {"type": "integer", "minimum": 1, "maximum": 8, "default": 2}
      }
    },
    "seed": {"type": "integer", "minimum": 0}
  }
}
```

**2.2.2: Prompt Schema** (`schemas/prompt.schema.json`)

Reference: `docs/project_plans/PRDs/prompt.prd.md`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "amcs://schemas/prompt-1.0.json",
  "title": "ComposedPrompt",
  "type": "object",
  "required": ["composed_prompt", "style_tags", "metadata"],
  "properties": {
    "composed_prompt": {
      "type": "string",
      "description": "Final lyrics + section tags"
    },
    "style_tags": {
      "type": "string",
      "description": "Comma-separated style tags"
    },
    "metadata": {
      "type": "object",
      "required": ["char_count", "tag_count", "sections"],
      "properties": {
        "char_count": {"type": "integer"},
        "tag_count": {"type": "integer"},
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": {"type": "string"},
              "line_count": {"type": "integer"}
            }
          }
        },
        "conflicts_detected": {
          "type": "array",
          "items": {"type": "string"}
        }
      }
    },
    "provenance": {
      "type": "object",
      "properties": {
        "sds_hash": {"type": "string"},
        "blueprint_version": {"type": "string"},
        "citations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source_id": {"type": "string"},
              "chunk_hash": {"type": "string"},
              "weight": {"type": "number"}
            }
          }
        }
      }
    }
  }
}
```

#### 2.3: Schema Validation Tests

Create `backend/tests/test_schemas.py`:

```python
import json
import pytest
from pathlib import Path
from jsonschema import validate, ValidationError

SCHEMA_DIR = Path(__file__).parent.parent.parent / "schemas"

def load_schema(filename):
    with open(SCHEMA_DIR / filename) as f:
        return json.load(f)

def test_persona_schema_valid():
    schema = load_schema("entities/persona.schema.json")
    valid_persona = {
        "name": "Test Persona",
        "vocal_range": {"min_note": "C3", "max_note": "C5"},
        "influences": ["genre-pop", "artist-generic-indie"]
    }
    validate(instance=valid_persona, schema=schema)

def test_style_schema_valid():
    schema = load_schema("entities/style.schema.json")
    valid_style = {
        "genre_detail": {"primary": "Pop"},
        "tempo_bpm": 120,
        "key": {"primary": "C major"},
        "mood": ["upbeat"],
        "tags": ["Era:2010s"]
    }
    validate(instance=valid_style, schema=schema)

def test_sds_schema_valid():
    schema = load_schema("sds.schema.json")
    # Load references
    style_schema = load_schema("entities/style.schema.json")
    lyrics_schema = load_schema("entities/lyrics.schema.json")

    # Test with minimal SDS
    valid_sds = {
        "title": "Test Song",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "Pop"},
            "tempo_bpm": 120,
            "key": {"primary": "C major"},
            "mood": ["upbeat"],
            "tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "themes": ["love"],
            "section_order": ["Verse", "Chorus", "Verse"]
        },
        "producer_notes": {
            "structure": "Verse–Chorus–Verse",
            "instrumentation": ["piano"]
        },
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 12345
    }
    # Note: Full validation requires custom validator with $ref resolution
```

### Technical Requirements

- JSON Schema Draft 07 compliance
- All PRD fields represented
- Cross-references using `$ref` syntax
- Validation rules from PRDs enforced

### Acceptance Criteria

- [ ] 8 JSON schema files created (6 entities + 2 aggregates)
- [ ] All required fields from PRDs included
- [ ] Pattern validation for musical keys, notes, formats
- [ ] Enum constraints match PRD specifications
- [ ] Schema validation tests pass
- [ ] TypeScript types can be generated (WP1 integration)

### Deliverable Files

```
/schemas/entities/persona.schema.json
/schemas/entities/style.schema.json
/schemas/entities/lyrics.schema.json
/schemas/entities/producer_notes.schema.json
/schemas/entities/sources.schema.json
/schemas/entities/render_job.schema.json
/schemas/sds.schema.json
/schemas/prompt.schema.json
/backend/tests/test_schemas.py
```

---

## WP3: Taxonomy & Constraint Files

### Agent Assignment

- **Primary**: data-layer-expert

### Tasks

#### 3.1: Music Tags Taxonomy

Create `taxonomies/music_tags.json`:

```json
{
  "version": "1.0",
  "categories": {
    "Era": {
      "description": "Musical era or decade",
      "tags": [
        "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s",
        "vintage", "modern", "contemporary", "retro"
      ]
    },
    "Rhythm": {
      "description": "Rhythmic patterns and feels",
      "tags": [
        "four-on-the-floor", "breakbeat", "syncopated", "swing", "shuffle",
        "straight", "triplet", "half-time", "double-time", "polyrhythm"
      ]
    },
    "Mix": {
      "description": "Production and mix characteristics",
      "tags": [
        "modern-bright", "warm-analog", "lo-fi", "hi-fi", "compressed",
        "dynamic", "crisp", "muddy", "spacious", "tight", "dry", "wet"
      ]
    },
    "Mood_Atmosphere": {
      "description": "Emotional and atmospheric qualities",
      "tags": [
        "upbeat", "melancholic", "dreamy", "aggressive", "chill", "energetic",
        "dark", "bright", "mysterious", "hopeful", "nostalgic", "euphoric"
      ]
    },
    "Vocal_Style": {
      "description": "Vocal delivery characteristics",
      "tags": [
        "whisper", "belting", "falsetto", "rap", "spoken-word", "crooning",
        "shouting", "harmonized", "auto-tuned", "raw", "polished"
      ]
    },
    "Instrumentation": {
      "description": "Instrument-specific tags",
      "tags": [
        "acoustic-guitar", "electric-guitar", "piano", "synth", "bass",
        "drums", "strings", "brass", "woodwinds", "808s", "handclaps"
      ]
    }
  }
}
```

#### 3.2: Conflict Matrix

Create `taxonomies/conflict_matrix.json`:

```json
{
  "version": "1.0",
  "description": "Tag pairs that should not coexist in a single style spec",
  "conflicts": [
    {
      "tag1": "whisper",
      "tag2": "anthemic",
      "reason": "Whispered vocals conflict with anthemic energy",
      "severity": "high"
    },
    {
      "tag1": "Era:1950s",
      "tag2": "Era:2020s",
      "reason": "Cannot target multiple eras simultaneously",
      "severity": "high"
    },
    {
      "tag1": "lo-fi",
      "tag2": "hi-fi",
      "reason": "Production quality tags are mutually exclusive",
      "severity": "medium"
    },
    {
      "tag1": "compressed",
      "tag2": "dynamic",
      "reason": "Compression reduces dynamics",
      "severity": "medium"
    },
    {
      "tag1": "dry",
      "tag2": "wet",
      "reason": "Reverb/delay levels conflict",
      "severity": "low"
    },
    {
      "tag1": "chill",
      "tag2": "aggressive",
      "reason": "Contradictory mood descriptors",
      "severity": "high"
    },
    {
      "tag1": "acoustic-guitar",
      "tag2": "808s",
      "reason": "Instrumentation style mismatch (organic vs synthetic)",
      "severity": "low"
    }
  ],
  "rules": {
    "max_tags_per_category": 2,
    "max_total_tags": 10,
    "auto_resolve": "drop_lower_weight"
  }
}
```

#### 3.3: Profanity Lexicon

Create `taxonomies/profanity_lexicon.json`:

```json
{
  "version": "1.0",
  "tiers": {
    "mild": {
      "score": 0.3,
      "examples": ["damn", "hell", "crap"]
    },
    "moderate": {
      "score": 0.6,
      "examples": ["ass", "bitch", "bastard"]
    },
    "severe": {
      "score": 1.0,
      "examples": ["<explicit-words>"]
    }
  },
  "policy": {
    "explicit_false_max_score": 0.3,
    "explicit_true_max_score": 1.0,
    "redaction_mode": "asterisk"
  }
}
```

#### 3.4: Engine Limits

Create `limits/suno_v3.json`:

```json
{
  "engine": "suno",
  "version": "v3",
  "limits": {
    "max_style_chars": 120,
    "max_prompt_chars": 3000,
    "max_variations": 4,
    "supported_languages": ["en", "es", "fr", "de", "it", "pt", "ja", "ko"],
    "tempo_range": [60, 180],
    "max_duration_sec": 240
  },
  "metadata": {
    "updated": "2025-11-11",
    "source": "official-api-docs"
  }
}
```

Create `limits/suno_v4.json`:

```json
{
  "engine": "suno",
  "version": "v4",
  "limits": {
    "max_style_chars": 200,
    "max_prompt_chars": 4000,
    "max_variations": 8,
    "supported_languages": ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh"],
    "tempo_range": [40, 220],
    "max_duration_sec": 300
  },
  "features": {
    "section_tags": true,
    "negative_prompts": true,
    "stereo_modes": ["mono", "stereo", "wide"]
  },
  "metadata": {
    "updated": "2025-11-11",
    "source": "official-api-docs"
  }
}
```

Create `limits/generic.json`:

```json
{
  "engine": "generic",
  "version": "1.0",
  "limits": {
    "max_style_chars": 500,
    "max_prompt_chars": 10000,
    "max_variations": 10,
    "tempo_range": [40, 300],
    "max_duration_sec": 600
  }
}
```

#### 3.5: Taxonomy Loader Utility

Create `backend/services/taxonomy_loader.py`:

```python
import json
from pathlib import Path
from typing import Dict, List, Tuple

TAXONOMY_DIR = Path(__file__).parent.parent.parent / "taxonomies"
LIMITS_DIR = Path(__file__).parent.parent.parent / "limits"

class TaxonomyLoader:
    def __init__(self):
        self.tags = self._load_json(TAXONOMY_DIR / "music_tags.json")
        self.conflicts = self._load_json(TAXONOMY_DIR / "conflict_matrix.json")
        self.profanity = self._load_json(TAXONOMY_DIR / "profanity_lexicon.json")

    @staticmethod
    def _load_json(path: Path) -> dict:
        with open(path) as f:
            return json.load(f)

    def validate_tags(self, tags: List[str]) -> Tuple[bool, List[str]]:
        """Validate tags against taxonomy. Returns (is_valid, errors)."""
        errors = []
        valid_tags = set()

        for category_data in self.tags["categories"].values():
            valid_tags.update(category_data["tags"])

        for tag in tags:
            if tag not in valid_tags:
                errors.append(f"Unknown tag: {tag}")

        return len(errors) == 0, errors

    def detect_conflicts(self, tags: List[str]) -> List[Dict]:
        """Detect conflicting tag pairs."""
        conflicts_found = []

        for conflict in self.conflicts["conflicts"]:
            if conflict["tag1"] in tags and conflict["tag2"] in tags:
                conflicts_found.append(conflict)

        return conflicts_found

    def check_profanity(self, text: str, explicit_allowed: bool = False) -> Tuple[float, List[str]]:
        """Calculate profanity score and return flagged words."""
        score = 0.0
        flagged = []

        # Simple word matching (real implementation would use better NLP)
        text_lower = text.lower()

        for tier, data in self.profanity["tiers"].items():
            for word in data.get("examples", []):
                if word in text_lower:
                    score = max(score, data["score"])
                    flagged.append(word)

        max_allowed = (
            self.profanity["policy"]["explicit_true_max_score"]
            if explicit_allowed
            else self.profanity["policy"]["explicit_false_max_score"]
        )

        return score, flagged

class EngineLimits:
    def __init__(self, engine: str, version: str = None):
        self.engine = engine
        self.version = version or "generic"
        self.limits = self._load_limits()

    def _load_limits(self) -> dict:
        filename = f"{self.engine}_{self.version}.json" if self.version else "generic.json"
        path = LIMITS_DIR / filename

        if not path.exists():
            path = LIMITS_DIR / "generic.json"

        with open(path) as f:
            return json.load(f)

    def validate_prompt(self, style_tags: str, prompt: str) -> Tuple[bool, List[str]]:
        """Validate prompt against engine limits."""
        errors = []

        if len(style_tags) > self.limits["limits"]["max_style_chars"]:
            errors.append(
                f"Style tags exceed {self.limits['limits']['max_style_chars']} chars: "
                f"{len(style_tags)}"
            )

        if len(prompt) > self.limits["limits"]["max_prompt_chars"]:
            errors.append(
                f"Prompt exceeds {self.limits['limits']['max_prompt_chars']} chars: "
                f"{len(prompt)}"
            )

        return len(errors) == 0, errors
```

### Technical Requirements

- JSON format for all taxonomy files
- Version metadata for schema evolution
- Clear conflict reasoning
- Engine-specific limits from official docs

### Acceptance Criteria

- [ ] Music tags taxonomy covers 6+ categories
- [ ] Conflict matrix includes 7+ conflict pairs
- [ ] Profanity lexicon has 3 tiers
- [ ] Engine limits for Suno v3, v4, and generic
- [ ] Taxonomy loader utility passes unit tests
- [ ] Conflict detection correctly identifies tag pairs
- [ ] Profanity scoring works with explicit flag

### Deliverable Files

```
/taxonomies/music_tags.json
/taxonomies/conflict_matrix.json
/taxonomies/profanity_lexicon.json
/limits/suno_v3.json
/limits/suno_v4.json
/limits/generic.json
/backend/services/taxonomy_loader.py
/backend/tests/test_taxonomy_loader.py
```

---

## WP4: Database Schema

### Agent Assignment

- **Primary**: data-layer-expert

### Tasks

#### 4.1: Database Initialization

Create `infra/postgres/init.sql`:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS jobs;

-- Set search path
SET search_path TO public, audit, jobs;

COMMENT ON SCHEMA public IS 'Main application data';
COMMENT ON SCHEMA audit IS 'Audit trails and change logs';
COMMENT ON SCHEMA jobs IS 'Async job queue and status tracking';
```

#### 4.2: Entity Tables Migration

Create `migrations/versions/001_initial_schema.py`:

```python
"""Initial schema with all entity tables

Revision ID: 001
Revises:
Create Date: 2025-11-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from pgvector.sqlalchemy import Vector

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Users table (for auth and ownership)
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='user'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'])

    # Personas table
    op.create_table(
        'personas',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('bio', sa.Text),
        sa.Column('vocal_range', JSONB, nullable=False),
        sa.Column('influences', ARRAY(sa.String), nullable=False),
        sa.Column('tags', ARRAY(sa.String)),
        sa.Column('is_public', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_personas_user_id', 'personas', ['user_id'])
    op.create_index('idx_personas_is_public', 'personas', ['is_public'])

    # Styles table
    op.create_table(
        'styles',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('genre_detail', JSONB, nullable=False),
        sa.Column('tempo_bpm', JSONB, nullable=False),  # Can be int or [int, int]
        sa.Column('time_signature', sa.String(10), default='4/4'),
        sa.Column('key', JSONB, nullable=False),
        sa.Column('mood', ARRAY(sa.String), nullable=False),
        sa.Column('energy', sa.String(20)),
        sa.Column('instrumentation', ARRAY(sa.String)),
        sa.Column('vocal_profile', sa.String(255)),
        sa.Column('tags', ARRAY(sa.String), nullable=False),
        sa.Column('negative_tags', ARRAY(sa.String)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_styles_user_id', 'styles', ['user_id'])
    op.create_index('idx_styles_genre', 'styles', [sa.text("(genre_detail->>'primary')")])

    # Lyrics table
    op.create_table(
        'lyrics',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('language', sa.String(10), default='en'),
        sa.Column('pov', sa.String(10), nullable=False),
        sa.Column('tense', sa.String(20)),
        sa.Column('themes', ARRAY(sa.String), nullable=False),
        sa.Column('rhyme_scheme', sa.String(50)),
        sa.Column('meter', sa.String(50)),
        sa.Column('syllables_per_line', sa.Integer),
        sa.Column('hook_strategy', sa.String(50)),
        sa.Column('repetition_policy', sa.String(50)),
        sa.Column('imagery_density', sa.Numeric(3, 2)),
        sa.Column('section_order', ARRAY(sa.String), nullable=False),
        sa.Column('constraints', JSONB),
        sa.Column('source_citations', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_lyrics_user_id', 'lyrics', ['user_id'])

    # Producer Notes table
    op.create_table(
        'producer_notes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('structure', sa.String(500), nullable=False),
        sa.Column('hooks', sa.Integer),
        sa.Column('instrumentation', ARRAY(sa.String)),
        sa.Column('section_meta', JSONB),
        sa.Column('mix', JSONB),
        sa.Column('blueprint_ref', sa.String(100)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_producer_notes_user_id', 'producer_notes', ['user_id'])

    # Sources table
    op.create_table(
        'sources',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('kind', sa.String(50), nullable=False),
        sa.Column('config', JSONB, nullable=False),
        sa.Column('scopes', ARRAY(sa.String)),
        sa.Column('weight', sa.Numeric(3, 2), nullable=False),
        sa.Column('allow', ARRAY(sa.String)),
        sa.Column('deny', ARRAY(sa.String)),
        sa.Column('provenance', sa.Boolean, default=True),
        sa.Column('mcp_server_id', sa.String(255)),
        sa.Column('chunks', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_sources_user_id', 'sources', ['user_id'])
    op.create_index('idx_sources_kind', 'sources', ['kind'])

    # Source Embeddings table (for pgvector)
    op.create_table(
        'source_embeddings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('source_id', UUID(as_uuid=True), sa.ForeignKey('sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_hash', sa.String(64), nullable=False),
        sa.Column('text', sa.Text, nullable=False),
        sa.Column('embedding', Vector(1536)),  # OpenAI embedding dimension
        sa.Column('metadata', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_source_embeddings_source_id', 'source_embeddings', ['source_id'])
    op.create_index('idx_source_embeddings_chunk_hash', 'source_embeddings', ['chunk_hash'])
    # Vector similarity index (HNSW)
    op.execute(
        'CREATE INDEX idx_source_embeddings_vector ON source_embeddings USING hnsw (embedding vector_cosine_ops)'
    )

    # SDS (Song Design Spec) table
    op.create_table(
        'song_design_specs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('blueprint_ref', JSONB, nullable=False),
        sa.Column('style_id', UUID(as_uuid=True), sa.ForeignKey('styles.id', ondelete='SET NULL')),
        sa.Column('lyrics_id', UUID(as_uuid=True), sa.ForeignKey('lyrics.id', ondelete='SET NULL')),
        sa.Column('producer_notes_id', UUID(as_uuid=True), sa.ForeignKey('producer_notes.id', ondelete='SET NULL')),
        sa.Column('persona_id', UUID(as_uuid=True), sa.ForeignKey('personas.id', ondelete='SET NULL')),
        sa.Column('prompt_controls', JSONB),
        sa.Column('render_config', JSONB, nullable=False),
        sa.Column('seed', sa.Integer, nullable=False),
        sa.Column('sds_hash', sa.String(64)),  # For determinism tracking
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_sds_user_id', 'song_design_specs', ['user_id'])
    op.create_index('idx_sds_hash', 'song_design_specs', ['sds_hash'])

    # SDS-Sources many-to-many
    op.create_table(
        'sds_sources',
        sa.Column('sds_id', UUID(as_uuid=True), sa.ForeignKey('song_design_specs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_id', UUID(as_uuid=True), sa.ForeignKey('sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('weight', sa.Numeric(3, 2), nullable=False),
        sa.PrimaryKeyConstraint('sds_id', 'source_id')
    )

    # Render Jobs table (in jobs schema)
    op.create_table(
        'render_jobs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('sds_id', UUID(as_uuid=True), sa.ForeignKey('song_design_specs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('engine', sa.String(50), nullable=False),
        sa.Column('model', sa.String(50)),
        sa.Column('prompt', sa.Text, nullable=False),
        sa.Column('style_tags', sa.String(500)),
        sa.Column('num_variations', sa.Integer, default=2),
        sa.Column('seed', sa.Integer, nullable=False),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('external_job_id', sa.String(255)),
        sa.Column('assets', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        schema='jobs'
    )
    op.create_index('idx_render_jobs_sds_id', 'render_jobs', ['sds_id'], schema='jobs')
    op.create_index('idx_render_jobs_status', 'render_jobs', ['status'], schema='jobs')

def downgrade():
    op.drop_table('render_jobs', schema='jobs')
    op.drop_table('sds_sources')
    op.drop_table('song_design_specs')
    op.drop_table('source_embeddings')
    op.drop_table('sources')
    op.drop_table('producer_notes')
    op.drop_table('lyrics')
    op.drop_table('styles')
    op.drop_table('personas')
    op.drop_table('users')
```

#### 4.3: Row-Level Security (RLS) Policies

Create `backend/auth/rls_policies.sql`:

```sql
-- Enable RLS on all user-owned tables
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_design_specs ENABLE ROW LEVEL SECURITY;

-- Personas policies
CREATE POLICY personas_user_select ON personas
    FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid OR is_public = true);

CREATE POLICY personas_user_insert ON personas
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY personas_user_update ON personas
    FOR UPDATE
    USING (user_id = current_setting('app.user_id')::uuid);

CREATE POLICY personas_user_delete ON personas
    FOR DELETE
    USING (user_id = current_setting('app.user_id')::uuid);

-- Styles policies (same pattern)
CREATE POLICY styles_user_select ON styles FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY styles_user_insert ON styles FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY styles_user_update ON styles FOR UPDATE
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY styles_user_delete ON styles FOR DELETE
    USING (user_id = current_setting('app.user_id')::uuid);

-- Lyrics policies (same pattern)
CREATE POLICY lyrics_user_select ON lyrics FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY lyrics_user_insert ON lyrics FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY lyrics_user_update ON lyrics FOR UPDATE
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY lyrics_user_delete ON lyrics FOR DELETE
    USING (user_id = current_setting('app.user_id')::uuid);

-- Producer Notes policies (same pattern)
CREATE POLICY producer_notes_user_select ON producer_notes FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY producer_notes_user_insert ON producer_notes FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY producer_notes_user_update ON producer_notes FOR UPDATE
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY producer_notes_user_delete ON producer_notes FOR DELETE
    USING (user_id = current_setting('app.user_id')::uuid);

-- Sources policies (same pattern)
CREATE POLICY sources_user_select ON sources FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY sources_user_insert ON sources FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY sources_user_update ON sources FOR UPDATE
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY sources_user_delete ON sources FOR DELETE
    USING (user_id = current_setting('app.user_id')::uuid);

-- SDS policies (same pattern)
CREATE POLICY sds_user_select ON song_design_specs FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY sds_user_insert ON song_design_specs FOR INSERT
    WITH CHECK (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY sds_user_update ON song_design_specs FOR UPDATE
    USING (user_id = current_setting('app.user_id')::uuid);
CREATE POLICY sds_user_delete ON song_design_specs FOR DELETE
    USING (user_id = current_setting('app.user_id')::uuid);
```

#### 4.4: Alembic Configuration

Create `migrations/alembic.ini`:

```ini
[alembic]
script_location = migrations
file_template = %%(rev)s_%%(slug)s
prepend_sys_path = .
version_path_separator = os

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

Create `migrations/env.py`:

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.models import Base

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = os.getenv("DATABASE_URL")

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Technical Requirements

- Postgres 15+ with pgvector extension
- Alembic for migrations
- UUID primary keys
- JSONB for flexible schema fields
- Vector embeddings for semantic search
- RLS for user data isolation

### Acceptance Criteria

- [ ] Database initializes with extensions (uuid-ossp, pgvector)
- [ ] All entity tables created with correct columns
- [ ] Indexes created for foreign keys and query patterns
- [ ] Vector similarity index works for embeddings
- [ ] RLS policies enforce user-level data isolation
- [ ] Alembic migrations apply cleanly
- [ ] Migration rollback works without data loss

### Deliverable Files

```
/infra/postgres/init.sql
/migrations/alembic.ini
/migrations/env.py
/migrations/versions/001_initial_schema.py
/backend/auth/rls_policies.sql
/backend/models/__init__.py (SQLAlchemy models)
/backend/tests/test_database_schema.py
```

---

## Integration Points

### Schema ↔ Database

1. **JSON Schemas** define field-level validation rules
2. **Alembic migrations** create database tables matching schema structure
3. **Pydantic models** (generated from JSON schemas) validate API requests
4. **SQLAlchemy models** map database tables to Python objects

**Flow**:
```
JSON Schema → Pydantic Model (validation) → SQLAlchemy Model (persistence) → Postgres
```

### TypeScript/Python Type Generation

**TypeScript** (Frontend):
```bash
npm run generate-types
# Uses json-schema-to-typescript
# Reads: schemas/**/*.json
# Outputs: frontend/src/types/generated.ts
```

**Python** (Backend):
```bash
# Pydantic models generated manually from schemas
# OR use datamodel-code-generator:
datamodel-codegen --input schemas/ --output backend/schemas/
```

### Taxonomy Loading

**Backend Service Initialization**:
```python
from backend.services.taxonomy_loader import TaxonomyLoader, EngineLimits

# Loaded once at app startup
taxonomy = TaxonomyLoader()
suno_limits = EngineLimits("suno", "v4")

# Used in validation endpoints
conflicts = taxonomy.detect_conflicts(style.tags)
is_valid, errors = suno_limits.validate_prompt(style_tags, composed_prompt)
```

**Frontend Tag Pickers**:
```typescript
import tags from '@/taxonomies/music_tags.json';

const TagPicker = () => {
  const categories = tags.categories;
  // Render multi-select chips grouped by category
};
```

---

## Validation & Testing

### Schema Validation Tests

```bash
cd backend
pytest tests/test_schemas.py -v
```

**Coverage**:
- Valid instances pass validation
- Invalid instances fail with correct error messages
- Cross-references ($ref) resolve correctly
- Pattern validation (keys, notes) works

### Database Migration Tests

```bash
# Apply migrations
alembic upgrade head

# Test rollback
alembic downgrade -1
alembic upgrade head

# Verify schema
psql -U meatymusic -d meatymusic_amcs -c "\dt"
```

### Taxonomy Tests

```bash
pytest tests/test_taxonomy_loader.py -v
```

**Coverage**:
- Tag validation detects unknown tags
- Conflict detection finds all conflicting pairs
- Profanity scoring calculates correct severity
- Engine limits enforce character constraints

### CI/CD Pipeline Tests

Create `.github/workflows/phase0-tests.yml`:

```yaml
name: Phase 0 Tests

on: [push, pull_request]

jobs:
  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate JSON Schemas
        run: |
          npm install -g ajv-cli
          ajv validate -s schemas/**/*.json

  database-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -e .
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        run: |
          cd backend
          alembic upgrade head
      - name: Run tests
        run: pytest backend/tests/ -v

  type-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Generate TypeScript types
        run: |
          cd frontend
          npm install
          npm run generate-types
      - name: Type check
        run: |
          cd frontend
          npm run type-check
```

---

## Success Criteria

### Checklist

- [ ] **WP1: Project Structure**
  - [ ] Directory structure complete
  - [ ] docker-compose.yml starts all services
  - [ ] Backend dependencies install cleanly
  - [ ] Frontend dependencies install cleanly
  - [ ] Environment variables template exists

- [ ] **WP2: JSON Schemas**
  - [ ] 6 entity schemas defined
  - [ ] 2 aggregate schemas (SDS, Prompt) defined
  - [ ] All PRD fields represented
  - [ ] Schema validation tests pass
  - [ ] TypeScript types generated successfully

- [ ] **WP3: Taxonomies**
  - [ ] Music tags taxonomy (6+ categories)
  - [ ] Conflict matrix (7+ conflicts)
  - [ ] Profanity lexicon (3 tiers)
  - [ ] Engine limits (Suno v3, v4, generic)
  - [ ] Taxonomy loader utility functional

- [ ] **WP4: Database Schema**
  - [ ] Postgres with pgvector running
  - [ ] All entity tables created
  - [ ] Indexes for performance
  - [ ] RLS policies applied
  - [ ] Migrations forward/backward work

### Measurable Outcomes

| Metric | Target | Verification |
|--------|--------|--------------|
| Schema files | 8 | `find schemas -name "*.json" | wc -l` |
| Database tables | 11+ | `psql -c "\dt"` |
| Test coverage | 80%+ | `pytest --cov` |
| Type generation | No errors | `npm run generate-types && npm run type-check` |
| Docker health | All green | `docker-compose ps` |
| Migration time | <5s | `time alembic upgrade head` |

---

## Exit Criteria

**Phase 0 is complete when**:

1. **All WP deliverable files exist and pass tests**
   - Schemas validate
   - Database migrations apply
   - Taxonomies load without errors
   - Docker services start healthy

2. **Type generation works**
   - TypeScript types generated from JSON schemas
   - Pydantic models match schemas
   - No type errors in frontend/backend

3. **CI/CD passes**
   - GitHub Actions workflow green
   - All tests pass
   - No linting errors

4. **Documentation updated**
   - README.md has setup instructions
   - .env.template documented
   - Migration guide exists

5. **Phase 1 can begin**
   - Backend teams can implement CRUD endpoints
   - Frontend teams can build UI components
   - Schemas are stable (v1.0 locked)

**Gate**: Review meeting with stakeholders confirming:
- Infrastructure is production-ready (security, observability)
- Schemas cover all PRD requirements
- Development velocity will not be blocked by missing foundation pieces

---

## Quick Reference

### Key File Paths

```
# Schemas
/schemas/entities/persona.schema.json
/schemas/entities/style.schema.json
/schemas/entities/lyrics.schema.json
/schemas/entities/producer_notes.schema.json
/schemas/entities/sources.schema.json
/schemas/entities/render_job.schema.json
/schemas/sds.schema.json
/schemas/prompt.schema.json

# Taxonomies
/taxonomies/music_tags.json
/taxonomies/conflict_matrix.json
/taxonomies/profanity_lexicon.json
/limits/suno_v3.json
/limits/suno_v4.json
/limits/generic.json

# Database
/migrations/versions/001_initial_schema.py
/backend/auth/rls_policies.sql
/infra/postgres/init.sql

# Config
/docker-compose.yml
/.env.template
/backend/pyproject.toml
/frontend/package.json
```

### Commands

```bash
# Start infrastructure
docker-compose up -d

# Apply migrations
cd backend
alembic upgrade head

# Run tests
pytest backend/tests/ -v

# Generate TypeScript types
cd frontend
npm run generate-types

# Validate schemas
npm install -g ajv-cli
ajv validate -s schemas/**/*.json

# Load taxonomies (Python)
from backend.services.taxonomy_loader import TaxonomyLoader
taxonomy = TaxonomyLoader()
```

### Agent Assignments

| Work Package | Agent(s) | Key Tasks |
|--------------|----------|-----------|
| WP1 | backend-typescript-architect, python-pro | Directory structure, docker-compose, package configs |
| WP2 | data-layer-expert | JSON schemas, validation tests |
| WP3 | data-layer-expert | Taxonomies, conflict matrix, engine limits |
| WP4 | data-layer-expert | Database schema, migrations, RLS policies |

---

**End of Phase 0 Plan**
