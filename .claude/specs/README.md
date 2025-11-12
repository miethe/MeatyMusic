# CLAUDE.md Specification System

**Purpose**: Token-optimized specs for generating CLAUDE.md files

## File Structure

| File | Purpose | Size | Usage |
|------|---------|------|-------|
| `claude-fundamentals-spec.md` | Generic patterns across all projects | ~250 lines | Base layer |
| `meatymusic-spec.md` | MeatyMusic AMCS-specific patterns | ~420 lines | Project layer |
| `doc-policy-spec.md` | Documentation policy (compressed) | ~250 lines | Policy layer |

## Composition Pattern

```
CLAUDE.md = fundamentals + project-specific + doc-policy
```

**Example Usage:**

```markdown
# Generate CLAUDE.md for MeatyMusic
1. Load claude-fundamentals-spec.md (generic patterns)
2. Load meatymusic-spec.md (AMCS architecture)
3. Load doc-policy-spec.md (documentation rules)
4. Compose → output CLAUDE.md
```

## When to Use Which Spec

**claude-fundamentals-spec.md** → Generic patterns:
- Task management (TodoWrite)
- Agent delegation
- Documentation vs AI artifacts
- Tone/style preferences
- Git workflow
- Professional objectivity

**meatymusic-spec.md** → Project-specific:
- AMCS workflow patterns (PLAN → STYLE → LYRICS → ...)
- Determinism requirements (seed propagation, pinned retrieval)
- Blueprint & rubric system
- Workflow node contracts
- Policy guards (content, citations)
- Performance targets (P95 latency, pass rate, repro rate)
- Observability requirements

**doc-policy-spec.md** → Documentation rules:
- Allowed/prohibited docs
- Directory structure
- Naming conventions
- Frontmatter requirements
- Tracking patterns

## Token Efficiency

- **Format**: Tables, decision trees, shorthand notation
- **Focus**: Dense, structured, AI-optimized content
- **Target**: ~250 lines per spec (meatymusic-spec is ~420 due to domain complexity)
