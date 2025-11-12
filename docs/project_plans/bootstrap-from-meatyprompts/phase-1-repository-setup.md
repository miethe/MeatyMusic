# Phase 1: Repository Setup & Cleanup (3-5 days)

**Timeline**: 3-5 days
**Effort**: 15 story points
**Dependencies**: None
**Team**: python-backend-engineer, ui-engineer, prd-writer, code-reviewer

---

## Goals

- Create MeatyMusic repository structure
- Import foundational infrastructure from MeatyPrompts
- Remove domain-specific MeatyPrompts code
- Establish clean baseline

## Tasks

### Day 1: Repository Initialization

1. **Create monorepo structure**:
   ```bash
   mkdir -p services/api/{app,alembic,tests}
   mkdir -p apps/web/src/{app,components,lib,hooks,stores}
   mkdir -p packages/{ui,tokens,api,store}
   mkdir -p .claude/{agents,skills,config,specs}
   mkdir -p schemas taxonomies limits
   mkdir -p docs/{project_plans/PRDs,hit_song_blueprint/AI}
   ```

2. **Copy root configuration** (as-is):
   - `/package.json` - Workspace configuration
   - `/.npmrc` - pnpm settings
   - `/.gitignore` - Git ignore patterns
   - `/.pre-commit-config.yaml` - Pre-commit hooks
   - `/pyproject.toml` - Python project config

3. **Copy infrastructure directories** (as-is):
   - `/infra/` - Infrastructure code
   - `/monitoring/` - Grafana dashboards
   - `/.github/workflows/` - CI/CD pipelines

### Day 2: Backend Infrastructure

1. **Copy backend core** (as-is):
   ```
   /services/api/pyproject.toml
   /services/api/alembic.ini
   /services/api/app/core/
   /services/api/app/observability/
   /services/api/app/middleware/
   /services/api/app/db/
   /services/api/app/utils/
   ```

2. **Copy base patterns** (as-is):
   ```
   /services/api/app/repositories/base.py
   /services/api/app/repositories/cache_aware_base.py
   /services/api/app/schemas/base.py
   /services/api/app/errors.py
   /services/api/app/enums/
   ```

3. **Copy security infrastructure** (as-is):
   ```
   /services/api/app/core/security/
   /services/api/app/security/
   ```

### Day 3: Frontend Infrastructure

1. **Copy shared packages** (as-is):
   ```
   /packages/ui/ - Component library
   /packages/tokens/ - Design tokens
   /packages/api/ - API types
   /packages/store/ - State management utilities
   ```

2. **Copy frontend foundation** (as-is):
   ```
   /apps/web/package.json
   /apps/web/next.config.js
   /apps/web/tsconfig.json
   /apps/web/tailwind.config.ts
   /apps/web/postcss.config.js
   /apps/web/src/lib/api/
   /apps/web/src/lib/auth/
   /apps/web/src/lib/errors/
   /apps/web/src/lib/telemetry/
   /apps/web/src/lib/formatters/
   /apps/web/src/contexts/
   /apps/web/src/hooks/queries/
   /apps/web/src/hooks/mutations/
   /apps/web/src/styles/
   ```

### Day 4: Claude Code Integration

1. **Copy Claude Code foundation** (as-is):
   ```
   /.claude/settings.json - Permissions, hooks
   /.claude/config/ - Agent configurations
   /.claude/templates/ - Spec templates
   /.claude/hooks/ - Git hooks
   /.claude/scripts/ - Utility scripts
   ```

2. **Copy reusable agents** (adapt descriptions):
   ```
   /.claude/agents/dev-team/python-backend-engineer.md
   /.claude/agents/dev-team/ui-engineer-enhanced.md
   /.claude/agents/reviewers/code-reviewer.md
   /.claude/agents/pm/prd-writer.md
   ```

3. **Create CLAUDE.md** (new):
   - Project overview
   - North star principles
   - Workflow node descriptions
   - PRD references

### Day 5: Cleanup & Documentation

1. **Remove MeatyPrompts domain code**:
   - Delete `/services/api/app/models/` (keep base.py)
   - Delete `/services/api/app/repositories/*_repo.py` (keep base.py, cache_aware_base.py)
   - Delete `/services/api/app/services/` (keep exceptions.py)
   - Delete `/services/api/app/api/endpoints/` (keep deps.py)
   - Delete `/apps/web/src/components/prompts/`
   - Delete `/apps/web/src/components/editor/`

2. **Create placeholder files**:
   ```python
   # /services/api/app/models/__init__.py
   """AMCS domain models - to be implemented in Phase 3."""

   # /services/api/app/repositories/__init__.py
   """AMCS repositories - to be implemented in Phase 3."""

   # /services/api/app/services/__init__.py
   """AMCS services - to be implemented in Phase 3."""
   ```

3. **Update documentation**:
   - Create `/docs/bootstrap-migration-log.md`
   - Document what was copied, what was removed, what needs implementation
   - Create `/docs/architecture-diff.md` comparing MeatyPrompts vs AMCS

## Agent Assignments

- **Repository Setup**: python-backend-engineer, ui-engineer
- **Documentation**: prd-writer
- **Review**: code-reviewer

## Deliverables

- Clean MeatyMusic repository with foundational infrastructure
- No domain-specific MeatyPrompts code
- All infrastructure patterns preserved
- Migration log documenting changes

## Success Criteria

- [x] Repository structure matches monorepo pattern
- [x] Backend can start (even with no endpoints)
- [x] Frontend can build (even with minimal pages)
- [x] Tests run (even if none pass yet)
- [x] Claude Code agents can load

## Key Files Created

### New Files
- `/docs/bootstrap-migration-log.md` - What was copied/removed/needs implementation
- `/docs/architecture-diff.md` - MeatyPrompts vs AMCS comparison
- `/services/api/app/models/__init__.py` - Placeholder
- `/services/api/app/repositories/__init__.py` - Placeholder
- `/services/api/app/services/__init__.py` - Placeholder

### Copied As-Is
- All infrastructure: core, observability, middleware, security
- All shared packages: ui, tokens, api, store
- Claude Code configuration and agents
- CI/CD pipelines and monitoring

### Deleted
- All MeatyPrompts domain models
- All MeatyPrompts repositories (except base patterns)
- All MeatyPrompts services
- All MeatyPrompts API endpoints (except deps)
- All MeatyPrompts UI components

---

**Next Phase**: [Phase 2: Infrastructure Preservation](./phase-2-infrastructure-preservation.md)
**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
