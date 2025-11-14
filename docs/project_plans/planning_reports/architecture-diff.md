# Architecture Comparison: MeatyPrompts vs MeatyMusic AMCS

## Overview

This document compares the MeatyPrompts and MeatyMusic AMCS architectures to highlight similarities and differences, justifying the bootstrap approach. The comparison clarifies what was inherited (infrastructure), what was adapted (naming/config), and what was designed new (domain).

---

## 1. Identical Infrastructure (70% Overlap)

### 1.1 Technology Stack

Both projects standardize on the same tech stack for rapid development and team alignment:

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Backend** | Python | 3.12+ | Async, type-hinted |
| | FastAPI | 0.100+ | Modern async web framework |
| | SQLAlchemy | 2.0+ | Async ORM with type hints |
| | PostgreSQL | 15+ | With pgvector for embeddings |
| | Redis | 7+ | Caching and queues |
| | Alembic | 1.12+ | Database versioning |
| **Frontend** | Node.js | 20+ | JavaScript runtime |
| | TypeScript | 5.4+ | Strict type checking |
| | Next.js | 14+ | React framework with SSR |
| | React | 18.3+ | Component library |
| | Tailwind CSS | 3.4+ | Utility-first styling |
| | Zustand | 4.5+ | Lightweight state management |
| | React Query | 5.5+ | Server state management |
| **Observability** | OpenTelemetry | Latest | Distributed tracing |
| | Prometheus | Latest | Metrics collection |
| | Grafana | Latest | Metrics visualization |
| | Jaeger | Latest | Trace backend |
| **DevOps** | Docker | Latest | Containerization |
| | Docker Compose | 2.0+ | Local orchestration |
| | GitHub Actions | Latest | CI/CD automation |

### 1.2 Architectural Patterns

Both projects follow the same architectural patterns, ensuring consistency:

**Backend**:
- **Layered Architecture**: Router → Service → Repository → Database
- **Dependency Injection**: Container pattern for service initialization
- **Row-Level Security (RLS)**: PostgreSQL policies for multi-tenancy
- **Async/Await**: Non-blocking I/O throughout
- **Type Hints**: Strict typing with mypy validation
- **Structured Logging**: JSON logs with correlation IDs
- **Error Handling**: Consistent error schemas and responses
- **Middleware Stack**: Logging, CORS, rate limiting, tracing

**Frontend**:
- **Component-Based**: Reusable, composable React components
- **Monorepo Structure**: pnpm workspaces with shared packages
- **Design System**: Design tokens for consistent theming
- **State Management**: Zustand for app state, React Query for server state
- **TypeScript**: Strict type safety for frontend code
- **Testing**: Jest for unit tests, Playwright for E2E
- **Accessibility**: WCAG 2.1 AA compliance with Radix UI

**DevOps**:
- **Infrastructure as Code**: Docker Compose for local development
- **Health Checks**: Service-level health endpoints
- **Multi-tier Deployment**: Development, staging, production
- **CI/CD Pipeline**: GitHub Actions with automated tests
- **Observability First**: Logging, metrics, traces from day one

### 1.3 Database Schema Foundation

Both projects use PostgreSQL with similar foundational schemas:

```sql
-- Common tables in both projects

-- User/Tenant isolation
CREATE TABLE tenants (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail pattern
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY,
  tenant_id BIGINT REFERENCES tenants(id),
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  action VARCHAR(50),
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Versioning pattern
CREATE TABLE entity_versions (
  id BIGINT PRIMARY KEY,
  entity_id VARCHAR(255),
  version INT,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.4 Security & Authentication

Both projects implement the same authentication pattern:

- **JWT Tokens**: Signed JWT for stateless authentication
- **Clerk Integration**: External identity provider
- **Role-Based Access Control**: User roles and permissions
- **Context Propagation**: User ID and tenant ID in request context
- **Rate Limiting**: Per-user, per-endpoint limits
- **CORS Configuration**: Origin-based access control

### 1.5 Observability Infrastructure

Both projects implement comprehensive observability:

**Logging**:
- Structured JSON logging
- Correlation IDs for request tracing
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging middleware

**Metrics**:
- Prometheus format
- Custom metrics for domain events
- Histogram for latency tracking
- Counter for operation counts

**Tracing**:
- OpenTelemetry SDK
- Jaeger for backend storage
- Automatic span generation
- Custom span attributes

**Monitoring**:
- Grafana dashboards
- Alert rules for critical errors
- Service health monitoring
- Resource utilization tracking

---

## 2. Different Domain Models (30% Custom)

### 2.1 MeatyPrompts Domain

**Core Entities**:

```typescript
// Prompt: The creative artifact
interface Prompt {
  id: UUID;
  tenant_id: UUID;
  title: string;
  content: string;              // Raw prompt text
  model: string;                // Claude, GPT-4, etc.
  temperature: number;
  max_tokens: number;
  tags: string[];
  created_at: DateTime;
  updated_at: DateTime;
}

// Template: Reusable prompt pattern
interface Template {
  id: UUID;
  tenant_id: UUID;
  name: string;
  structure: object;            // Template structure
  variables: Variable[];
  created_at: DateTime;
}

// Collection: Organized prompts
interface Collection {
  id: UUID;
  tenant_id: UUID;
  name: string;
  description: string;
  prompts: UUID[];              // Prompt IDs
  created_at: DateTime;
}

// Run: Execution history
interface Run {
  id: UUID;
  prompt_id: UUID;
  status: "pending" | "running" | "completed" | "failed";
  result: object;
  execution_time_ms: number;
  created_at: DateTime;
}
```

**Domain Workflows**:
1. Create prompt (text entry)
2. Apply template (variable substitution)
3. Organize into collections (folder structure)
4. Execute prompt (generate output)
5. Track runs (history and metrics)

**Key Characteristics**:
- Text-focused (prompts as strings)
- Execution-oriented (runs and outputs)
- Template-driven (variable substitution)
- Linear workflows (create → template → execute)

### 2.2 MeatyMusic AMCS Domain

**Core Entities**:

```typescript
// Song: Compositional unit
interface Song {
  id: UUID;
  tenant_id: UUID;
  title: string;
  sds: SongDesignSpec;          // Complete specification
  status: SongStatus;
  audio_assets?: AudioAsset[];
  created_at: DateTime;
  updated_at: DateTime;
}

// Style: Genre and mood specification
interface Style {
  id: UUID;
  genre: Genre;
  bpm_min: number;
  bpm_max: number;
  key: MusicalKey;
  mood: string[];
  instrumentation: string[];
  tags: Tag[];                  // With conflict matrix
  constraints: Constraint[];
  created_at: DateTime;
}

// Lyrics: Section-structured with citations
interface Lyrics {
  id: UUID;
  song_id: UUID;
  sections: Section[];          // Verse, Chorus, Bridge, etc.
  rhyme_scheme: RhymeScheme;
  profanity_score: number;
  citations: Citation[];        // Source attribution
  created_at: DateTime;
}

// Persona: Reusable artist profile
interface Persona {
  id: UUID;
  tenant_id: UUID;
  name: string;
  vocal_range: VocalRange;
  influences: string[];
  style_traits: StyleTrait[];
  created_at: DateTime;
}

// ProducerNotes: Arrangement and mix guidance
interface ProducerNotes {
  id: UUID;
  song_id: UUID;
  arrangement: ArrangementSection[];
  mix_targets: MixTarget[];
  instrumentation_notes: string;
  created_at: DateTime;
}

// Blueprint: Genre algorithms and rubrics
interface Blueprint {
  id: UUID;
  genre: Genre;
  tempo_range: TempoRange;
  structure_pattern: StructurePattern;
  lexicon: string[];
  scoring_weights: ScoringWeight[];
  conflict_matrix: ConflictRule[];
  created_at: DateTime;
}

// ComposedPrompt: Render-ready prompt
interface ComposedPrompt {
  id: UUID;
  song_id: UUID;
  prompt_text: string;
  metadata: PromptMetadata;
  score: number;                // Rubric score
  character_count: number;
  created_at: DateTime;
}

// Run: Workflow execution history
interface Run {
  id: UUID;
  song_id: UUID;
  workflow_nodes: WorkflowNode[];  // PLAN, STYLE, LYRICS, etc.
  overall_score: number;
  status: WorkflowStatus;
  artifacts: Artifact[];
  events: WorkflowEvent[];
  created_at: DateTime;
}
```

**Domain Workflows**:
1. **PLAN**: Expand SDS into work targets
2. **STYLE**: Generate genre-constrained style spec
3. **LYRICS**: Create structured lyrics with citations
4. **PRODUCER**: Generate arrangement and mix notes
5. **COMPOSE**: Merge artifacts into render prompt
6. **VALIDATE**: Score against rubric
7. **FIX** (loop): Auto-fix low scores
8. **RENDER** (optional): Submit to music engine
9. **REVIEW**: Finalize and archive

**Key Characteristics**:
- Music-centric (genre, tempo, key, structure)
- Deterministic (seed-driven, pinned retrieval)
- Multi-stage composition (9 nodes)
- Constraint-driven (blueprints, rubrics, conflict matrix)
- Fully traceable (citations, provenance hashes, scores)

### 2.3 Domain Comparison Matrix

| Aspect | MeatyPrompts | MeatyMusic AMCS | Difference |
|--------|--------------|-----------------|-----------|
| **Primary Input** | Text prompt | Song Design Spec (JSON) | Text vs structured format |
| **Output Type** | Text completion | Music + metadata + scores | Single vs multi-artifact |
| **Workflow Length** | 1-2 steps | 9 steps with loops | Simple vs complex |
| **State Tracking** | Runs and outputs | Runs + nodes + artifacts | Granular vs coarse |
| **Determinism** | Optional | Required (seed-based) | Random vs reproducible |
| **Constraints** | None | Blueprints + rubrics | Free vs governed |
| **Versioning** | Template-based | Full artifact versioning | Template vs instance |
| **Traceability** | Execution logs | Hashes + citations + scores | Basic vs comprehensive |
| **Validation** | Output checking | Rubric scoring + auto-fix | Manual vs automated |
| **Integration** | OpenAI/Claude | Suno + future engines | API vs proprietary |
| **Multi-tenancy** | Tenant-scoped | Tenant-scoped | Same pattern |

---

## 3. Shared Architectural Concepts

### 3.1 Multi-Tenancy

Both systems are fully multi-tenant:

```typescript
// Every query filters by tenant_id
const userPrompts = await db
  .query(Prompt)
  .filter(Prompt.tenant_id == current_user.tenant_id)
  .all();
```

- Row-level security enforced by PostgreSQL
- Tenant ID in JWT token
- Request context propagation
- Audit trails segregated by tenant

### 3.2 Async-First Architecture

Both use async/await throughout:

```python
# Backend: Async database operations
async def get_song(song_id: UUID) -> Song:
    async with session() as db:
        result = await db.execute(
            select(Song).where(Song.id == song_id)
        )
        return result.scalar_one_or_none()

// Frontend: Async API calls with React Query
const { data: song } = useQuery(
  ['song', songId],
  () => api.getSong(songId),
  { staleTime: 1000 * 60 * 5 }
);
```

- Non-blocking I/O
- Efficient resource utilization
- Better concurrent request handling
- Improved latency metrics

### 3.3 Structured Error Handling

Both implement consistent error schemas:

```typescript
interface APIError {
  code: string;                 // "VALIDATION_ERROR", "NOT_FOUND", etc.
  message: string;
  details?: {
    field?: string;
    constraint?: string;
    value?: any;
  };
  request_id: string;           // For tracing
  timestamp: DateTime;
}

// HTTP Status mapping
400: Validation errors
404: Resource not found
409: Conflict (e.g., duplicate)
429: Rate limited
500: Server error
```

### 3.4 Testing Strategy

Both projects use similar testing approach:

```
Unit Tests (50%):
- Service logic
- Repository functions
- Utility functions

Integration Tests (30%):
- Database operations
- API endpoint contracts
- Middleware behavior

E2E Tests (20%):
- Complete workflows
- UI interactions
- Authentication flows
```

### 3.5 Deployment Pipeline

Both use Docker Compose locally, Kubernetes in production:

```yaml
Development:
  - Docker Compose for local development
  - Hot reload for code changes
  - Shared database and Redis

Staging:
  - Full Docker Compose stack
  - Environment parity with production
  - Smoke tests and E2E runs

Production:
  - Kubernetes deployment
  - Auto-scaling and load balancing
  - Persistent storage and backups
```

---

## 4. Architectural Trade-Offs

### 4.1 Why Bootstrap from MeatyPrompts?

**Pros**:
- Proven infrastructure (validated in production)
- Reduced setup time and risk
- Familiar patterns for team
- Faster path to infrastructure validation
- DevOps tooling already established

**Cons**:
- Requires removing irrelevant domain code
- Potential for carrying over anti-patterns
- Initial larger codebase to navigate

**Verdict**: **Worth it** - Infrastructure is 70% of the work; domain is only 30%.

### 4.2 Why NOT Reuse MeatyPrompts Domain?

**Pros**:
- Faster initial development
- Could reuse repository patterns

**Cons**:
- MeatyPrompts models don't fit music composition
- Prompts ≠ Lyrics, Templates ≠ Blueprints
- Constraint systems are different
- Would require significant refactoring
- Technical debt from irrelevant patterns

**Verdict**: **Clean slate** - Domain requirements are too different.

### 4.3 Why Monorepo?

**Pros**:
- Shared code (UI components, design tokens)
- Unified versioning and CI/CD
- Easier refactoring across packages
- Simpler dependency management
- Better for team collaboration

**Cons**:
- Larger repository
- Harder to separate concerns
- Complexity for deployment

**Verdict**: **Monorepo is correct** - Frontend and backend are tightly coupled.

---

## 5. Future Architecture Evolutions

### 5.1 Planned (Phase 3+)

```
MeatyMusic v2:
├── Suno render connector
├── Claude Code skill orchestration
├── MCP server integration for sources
├── Vector embeddings for semantic search
└── Advanced analytics
```

### 5.2 Potential (Phase 5+)

```
MeatyMusic v3:
├── Multi-engine render support
├── Real-time collaboration
├── Advanced versioning and branching
├── Custom rubric builder UI
└── Plugin marketplace
```

### 5.3 Long-term Vision

- Standard music composition API
- Pluggable render engines
- Community blueprints and sources
- Analytics and insights platform

---

## 6. Alignment Checklist

### Infrastructure

- [x] Same technology stack (FastAPI, Next.js, PostgreSQL, Redis)
- [x] Identical architectural patterns (layered, async, DI)
- [x] Shared security model (JWT, Clerk, RLS)
- [x] Consistent observability (logs, metrics, traces)
- [x] Same deployment approach (Docker Compose local, K8s prod)

### Patterns

- [x] Multi-tenancy enforcement
- [x] Async-first design
- [x] Structured error handling
- [x] Consistent testing strategy
- [x] Type safety (Python, TypeScript)

### Differences (by Design)

- [x] Domain models are different (music vs prompts)
- [x] Workflow complexity is different (9 nodes vs 2)
- [x] Validation approach is different (rubric vs basic)
- [x] Traceability requirements are different (hashes+citations)

---

## 7. Key Takeaways

1. **Infrastructure** (70%) - Inherited from MeatyPrompts, proven and stable
2. **Domain** (30%) - Designed from scratch for AMCS requirements
3. **Patterns** - Shared architectural principles for consistency
4. **Risk** - Minimal; infrastructure validated, domain is greenfield
5. **Timeline** - Infrastructure enables rapid Phase 2 domain implementation

---

## References

- [Bootstrap Migration Log](./bootstrap-migration-log.md) - Details of bootstrap process
- [CLAUDE.md](../CLAUDE.md) - Complete project architecture
- [Getting Started Guide](./development/getting-started.md) - Developer onboarding
- [PRDs](./project_plans/PRDs/) - Domain specifications

---

**Last Updated**: 2025-11-12
**Review Date**: After Phase 2 completion (database schema)
