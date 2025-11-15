# Frontend State Management V1 - Working Context

**Purpose:** Token-efficient context for resuming work across AI turns

**Last Updated:** 2025-11-15

---

## Current State

**Branch:** claude/frontend-state-management-v1-execution-01XXs6htHYsDRWiXAYDW7U97
**Last Commit:** f4be860 (clean state)
**Current Task:** Setting up tracking infrastructure

**Phase Status:**
- Phase 0: ✅ Complete (tracking setup)
- Phase 1: ⏳ Pending (foundation)
- Phase 2: ⏳ Pending (stores)
- Phase 3: ⏳ Pending (integration)
- Phase 4: ⏳ Pending (testing)

---

## Key Decisions

### Architecture
- **Store Pattern:** Zustand v4 with middleware composition
- **Middleware Stack:** devtools → queryIntegration → apiSync → localStorage
- **State Normalization:** Use Map<string, T> for entity storage (O(1) lookup)
- **Optimistic Updates:** Separate staged state from committed state for easy rollback
- **Persistence:** localStorage with 300ms debounce

### Integration Patterns
- **React Query:** Queries sync to store on success, mutations use optimistic updates
- **WebSocket:** Auto-subscribe to events, trigger store invalidation
- **Multi-Tab:** localStorage events for cross-tab sync with conflict resolution

### Testing Strategy
- **Unit Tests:** >70% coverage for store logic, actions, selectors
- **Integration Tests:** localStorage, React Query sync, WebSocket events, multi-tab
- **Test Framework:** Vitest (existing in MeatyMusic)

---

## Implementation Plan Reference

**Full Plan:** `docs/project_plans/implementation_plans/frontend-state-management-v1.md`

**Key Sections:**
- Lines 163-323: Songs Store specification
- Lines 325-456: Workflows Store specification
- Lines 458-593: Entities Store specification
- Lines 595-757: Integration specifications
- Lines 760-889: Task breakdown

**Success Criteria:** Lines 924-972

---

## Existing Infrastructure

### Store Package (`packages/store/`)
- ✅ Zustand v4 setup
- ✅ localStorage middleware (existing)
- ✅ API sync middleware (existing)
- ✅ Preferences store (reference pattern)
- ✅ Onboarding store (reference pattern)

### API Client (`apps/web/src/lib/api/`)
- ✅ React Query hooks
- ✅ Type-safe API methods
- ✅ Error handling

### WebSocket (WP-N4 - to be integrated)
- ⏳ WebSocket client (completed in WP-N4)
- ⏳ Event subscription hooks

---

## Quick Reference

### Environment Setup

```bash
# Install dependencies
pnpm install

# Web dev server
pnpm --filter "./apps/web" dev

# Run tests
pnpm --filter "./packages/store" test

# Type check
pnpm --filter "./packages/store" typecheck
```

### Key Files to Reference

**Existing Patterns:**
- `packages/store/src/stores/preferencesStore.ts` - Reference store implementation
- `packages/store/src/middleware/localStorageMiddleware.ts` - Persistence pattern
- `packages/store/src/middleware/apiSyncMiddleware.ts` - API sync pattern

**New Files (to create):**
- `packages/store/src/types.ts` - Expand with domain types
- `packages/store/src/stores/songsStore.ts` - Songs CRUD store
- `packages/store/src/stores/workflowsStore.ts` - Workflows tracking
- `packages/store/src/stores/entitiesStore.ts` - Entity caching

---

## Phase Scope Summary

### Phase 1: Foundation (3 SP)
Create type definitions, query integration middleware, and multi-tab sync middleware.

**Success Metric:** All middleware composes correctly with existing stack.

### Phase 2: Stores (5 SP)
Implement three domain stores with full CRUD, filters, pagination, and optimistic updates.

**Success Metric:** All stores persist to localStorage and hydrate on reload.

### Phase 3: Integration (3 SP)
Create React Query integration hooks and WebSocket sync hooks.

**Success Metric:** Queries sync to stores, mutations use optimistic updates, WebSocket events trigger updates.

### Phase 4: Testing (2 SP)
Write unit and integration tests for all stores, middleware, and integration hooks.

**Success Metric:** >70% test coverage, all tests passing.

---

## Important Learnings

### From Implementation Plan
- **Gotcha:** Don't store large objects in localStorage (10MB quota)
- **Gotcha:** Don't update store during render (causes infinite loops)
- **Gotcha:** Always cleanup WebSocket subscriptions on unmount
- **Gotcha:** Check for localStorage availability (SSR compatibility)

### From MeatyPrompts Patterns
- **Pattern:** DTOs separate from ORM models
- **Pattern:** ErrorResponse envelope for all errors
- **Pattern:** Cursor pagination with `{ items, pageInfo }`
- **Pattern:** Telemetry spans named `{route}.{operation}`

---

## Risk Mitigation

### localStorage Quota
- Monitor usage, warn at 80%
- Implement LRU eviction for entity caches
- Clear old workflow runs (>30 days)

### Optimistic Conflicts
- Queue mutations serially if affecting same entity
- Track optimisticId for rollback
- Log conflicts for debugging

### WebSocket Event Storms
- Debounce store updates (batch events)
- Limit event history per run (last 100)
- Auto-unsubscribe on unmount

---

## Next Session Checklist

When resuming work:
1. Read latest section of this context file
2. Check progress file for current task status
3. Review any new commits since last session
4. Continue from current task in checklist
5. Update both files at end of session
