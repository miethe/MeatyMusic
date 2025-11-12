# MeatyMusic AMCS Project Spec

**Version**: 1.0
**Purpose**: MeatyMusic AMCS-specific patterns
**Token Target**: ~200 lines
**Format**: Dense, structured, AI-optimized

---

## Prime Directives

| Principle | Implementation |
|-----------|---------------|
| **Determinism** | Same inputs + seed → same outputs |
| **Workflow Contracts** | PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → (FIX)* → RENDER → REVIEW |
| **Constraint Fidelity** | Always satisfy blueprint/rubric + policy before render |
| **DTO Separation** | Services return DTOs only, never ORM models |
| **Error Standard** | `ErrorResponse` envelope everywhere |
| **Pagination** | Cursor-based `{ items, pageInfo }` |
| **UI Discipline** | Import UI only from `@meaty/ui`, never direct Radix |
| **Observability** | OpenTelemetry spans + structured JSON logs |
| **Traceability** | Every decision carries provenance, hashes, and scores |
| **Agent Orchestration** | Always delegate to specialized agents |

---

## Architecture Layers

### Layer Responsibilities

| Layer | Owns | Returns | Example |
|-------|------|---------|---------|
| **Router** | HTTP, validation, auth | Response envelope | `POST /api/songs` |
| **Service** | Business logic, DTOs | DTOs only | `SongService.create()` |
| **Repository** | DB I/O, RLS, queries | ORM models | `SongRepository.find()` |
| **DB** | Data storage, RLS | Raw data | PostgreSQL + pgvector + RLS |

### Workflow Node Pattern

```
Workflow Node (Claude Code Skill)
  ↓
Input: SDS + Node Inputs
  ↓
Processing: Deterministic logic (seeded)
  ↓
Output: Artifacts + Citations + Scores
  ↓
Storage: /runs/{song_id}/{run_id}/{node}/
```

### Data Flow

```
HTTP Request → Gateway → Orchestrator → Workflow Nodes
                                            ↓
                            Artifacts + Citations + Scores
                                            ↓
                            Storage (S3 + Postgres)
                                            ↓
Response ← Gateway ← Orchestrator
```

### Critical Rules

- ✗ NEVER mix DTO/ORM in one module
- ✗ NEVER do DB I/O in services
- ✗ NEVER return ORM models from services
- ✗ NEVER break determinism (use seed, pinned retrieval)
- ✓ Repository owns ALL DB queries
- ✓ Service maps ORM→DTO
- ✓ Router handles HTTP envelope
- ✓ All workflows emit citations + hashes
- ✓ All decisions follow blueprint constraints

---

## Package Structure

```
apps/
├── web/              # Next.js App Router, Clerk auth, React Query
│   ├── app/          # App Router pages (songs, styles, lyrics, workflows)
│   ├── components/   # UI components (imports from @meaty/ui)
│   ├── hooks/        # React hooks
│   └── lib/          # Utilities
└── mobile/           # Expo/RN (imports from @meaty/ui)

services/
└── api/              # FastAPI 3.12, SQLAlchemy, Alembic, Postgres
    ├── app/
    │   ├── api/      # Routers (HTTP layer)
    │   ├── services/ # Business logic (DTO layer)
    │   ├── repositories/ # DB access (ORM layer)
    │   ├── schemas/  # Pydantic DTOs (SDS, Style, Lyrics, etc.)
    │   ├── models/   # SQLAlchemy ORM
    │   ├── core/     # Auth, config, observability
    │   └── main.py   # FastAPI app

packages/
├── ui/               # Shared components (Radix wrappers)
│   ├── src/          # Component implementations
│   └── stories/      # Storybook documentation
├── tokens/           # CSS variables (Tailwind v4 @theme)
└── core/             # Shared business logic

.claude/
├── skills/           # Workflow node implementations
│   ├── plan/
│   ├── style/
│   ├── lyrics/
│   ├── producer/
│   ├── compose/
│   ├── validate/
│   ├── fix/
│   ├── render/
│   └── review/
```

---

## AMCS Core Entities

### Song Design Spec (SDS)

**Purpose**: Single JSON that ties all entities together

```typescript
interface SongDesignSpec {
  song_id: string;
  run_id: string;
  seed: number;
  theme: ThemeEntity;
  persona?: PersonaEntity;
  style_preferences?: StylePreferencesEntity;
  lyrics_constraints?: LyricsConstraintsEntity;
  producer_notes_constraints?: ProducerNotesConstraintsEntity;
  constraints: ConstraintsEntity;
  sources?: SourceEntity[];
}
```

### Workflow Artifacts

| Artifact | Node | Schema | Storage |
|----------|------|--------|---------|
| Style Spec | STYLE | `StyleSpec` | `/runs/{song_id}/{run_id}/style/` |
| Lyrics | LYRICS | `Lyrics` | `/runs/{song_id}/{run_id}/lyrics/` |
| Producer Notes | PRODUCER | `ProducerNotes` | `/runs/{song_id}/{run_id}/producer/` |
| Composed Prompt | COMPOSE | `ComposedPrompt` | `/runs/{song_id}/{run_id}/compose/` |
| Validation Scores | VALIDATE | `ValidationScores` | `/runs/{song_id}/{run_id}/validate/` |
| Render Job | RENDER | `RenderJob` | `/runs/{song_id}/{run_id}/render/` |

---

## Determinism Requirements

### Global Seed Propagation

```python
# Every node uses the run seed or seed+node_idx
def style_node(sds: SongDesignSpec, node_idx: int):
    node_seed = sds.seed + node_idx
    random.seed(node_seed)
    # ... deterministic logic
```

### Pinned Retrieval

- Only use source chunks whose hashes are logged in citations
- Fixed top-k
- Lexicographic tie-breaks
- No random sampling

### Model Limits

- Obey engine character limits (Suno: 3000 chars)
- Parameter constraints from `/limits/{engine}.json`

### Conflict Matrix

- Reject contradictory tags (e.g., "whisper" + "anthemic")
- Located in `/taxonomies/conflict_matrix.json`

### Decoding

- Low-variance settings (temperature ≤0.3, fixed top-p)
- No top-k sampling

---

## Blueprint & Rubric System

### Hit Song Blueprints

**Location**: `docs/hit_song_blueprint/AI/`

| Blueprint | Purpose | Key Patterns |
|-----------|---------|--------------|
| `pop_blueprint.md` | Pop genre rules | Hook density, singability, structure |
| `country_blueprint.md` | Country genre rules | Storytelling, instrumentation, vocal style |
| `hiphop_blueprint.md` | Hip-hop genre rules | Flow, rhyme density, production |
| `rock_blueprint.md` | Rock genre rules | Energy, instrumentation, dynamics |
| `general_fingerprint.md` | Cross-genre patterns | Universal hit principles |
| `comparative_matrix.md` | Genre comparison | Similarities and differences |

### Rubric Scoring

```python
# Validation metrics
scores = {
    "hook_density": 0.85,      # 0-1 scale
    "singability": 0.90,
    "rhyme_tightness": 0.75,
    "section_completeness": 1.0,
    "profanity_score": 0.0,    # 0 = clean
    "total": 0.85              # Weighted average
}

# Pass threshold
PASS_THRESHOLD = 0.80
```

---

## Policy Guards

### Content Policy

- No public release with "style of <living artist>"
- Redact PII
- Profanity obeys `constraints.explicit`
- Source access only via allowed MCP scopes

### Citation Requirements

All source chunks must include:
- `source_hash`: SHA-256 of chunk content
- `source_id`: MCP source identifier
- `chunk_idx`: Index within source
- `retrieval_score`: Relevance score

---

## Workflow Node Contracts

### Standard Node Interface

```python
# Input
class NodeInput:
    sds: SongDesignSpec
    node_idx: int
    prev_artifacts: dict[str, Any]

# Output
class NodeOutput:
    artifacts: dict[str, Any]
    citations: list[Citation]
    scores: dict[str, float]
    events: list[Event]
```

### Node Execution Pattern

```
1. Load SDS + prev artifacts
2. Apply deterministic logic (seeded)
3. Emit artifacts + citations
4. Compute scores (if VALIDATE node)
5. Persist to /runs/{song_id}/{run_id}/{node}/
6. Emit events for observability
```

---

## Error Handling

### ErrorResponse Envelope

```python
# FastAPI (Python)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {...},
    "trace_id": "..."
  }
}
```

### Error Codes

| Code | HTTP | Use Case |
|------|------|----------|
| `VALIDATION_ERROR` | 400 | Invalid SDS or constraints |
| `BLUEPRINT_VIOLATION` | 422 | Failed rubric scoring |
| `CONFLICT_ERROR` | 409 | Tag conflicts detected |
| `RENDER_FAILURE` | 500 | External engine error |

---

## Observability

### OpenTelemetry Spans

**Naming**: `{workflow}.{node}`

```python
@tracer.start_as_current_span("song_creation.style")
def style_node(sds: SongDesignSpec):
    span = trace.get_current_span()
    span.set_attribute("song_id", sds.song_id)
    span.set_attribute("run_id", sds.run_id)
    span.set_attribute("seed", sds.seed)
    # ... implementation
```

### Structured Logging

```python
logger.info({
    "message": "Style spec created",
    "trace_id": trace_id,
    "span_id": span_id,
    "song_id": song_id,
    "run_id": run_id,
    "node": "STYLE",
    "duration_ms": duration,
    "scores": scores
})
```

---

## Performance Targets (MVP)

| Metric | Target | Gate |
|--------|--------|------|
| Plan→Prompt Latency | P95 ≤ 60s | Gate D |
| Rubric Pass Rate | ≥ 95% | Gate A |
| Repro Rate | ≥ 99% | Gate B |
| Security | Zero high-severity | Gate C |

---

## Testing Patterns

### Determinism Tests

```python
# Same SDS + seed must produce identical outputs
def test_determinism():
    sds = create_sds(seed=42)

    output1 = run_workflow(sds)
    output2 = run_workflow(sds)

    assert output1 == output2  # Exact match
```

### Rubric Compliance Tests

```python
# Validate against blueprint scoring thresholds
def test_rubric_compliance():
    sds = create_pop_sds()

    output = run_workflow(sds)
    scores = output["validate"]["scores"]

    assert scores["total"] >= 0.80
    assert scores["hook_density"] >= 0.75
```

### Policy Tests

```python
# Ensure policy guards work
def test_profanity_filter():
    sds = create_sds(constraints={"explicit": False})

    output = run_workflow(sds)
    lyrics = output["lyrics"]["text"]

    assert profanity_score(lyrics) == 0.0
```

---

## References

### Documentation

- **Primary**: `docs/amcs-overview.md`
- **PRDs**: `docs/project_plans/PRDs/`
- **Blueprints**: `docs/hit_song_blueprint/AI/`
- **Schemas**: `/schemas/`
- **Taxonomies**: `/taxonomies/`

### Key Files

- `CLAUDE.md` - Agent instructions
- `schemas/sds.json` - Song Design Spec schema
- `taxonomies/conflict_matrix.json` - Tag conflicts
- `limits/suno.json` - Engine limits

---

## Summary

MeatyMusic AMCS is a deterministic, constraint-driven music composition system. All workflows follow strict contracts with seeded execution, citation tracking, and rubric validation. Architecture follows layered patterns with DTO separation, cursor pagination, and comprehensive observability.

**Key Patterns**:
- Determinism: Same inputs + seed → same outputs
- Workflow: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → (FIX)* → RENDER → REVIEW
- Traceability: Citations + hashes + scores for all decisions
- Constraint Fidelity: Blueprint + policy compliance before render
- Layered Architecture: Router → Service → Repository → DB
- Observability: OpenTelemetry + structured logs
