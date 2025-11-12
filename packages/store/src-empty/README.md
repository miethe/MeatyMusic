# Zustand State Management

This directory will contain MeatyMusic AMCS client-side state stores in Phase 5:

## Planned Stores

### Entity Stores
- **songStore.ts** - Song entity state and operations
- **styleStore.ts** - Style specification state
- **lyricsStore.ts** - Lyrics entity state
- **personaStore.ts** - Persona profile state
- **sourcesStore.ts** - External source registry state

### Workflow Stores
- **workflowStore.ts** - Active workflow execution state
- **eventStore.ts** - Real-time event stream management
- **validationStore.ts** - Validation results and feedback

### UI Stores
- **uiStore.ts** - UI state (modals, sidebars, etc.)
- **preferencesStore.ts** - User preferences (already exists in infrastructure)

## Implementation Reference

See:
- Phase 5 implementation plan: `/docs/project_plans/impl_tracking/bootstrap-phase-5/`
- Store infrastructure examples: `/packages/store/store/dist/`

## Infrastructure Available

The store package already includes:
- Zustand as state management library
- LocalStorage persistence middleware
- API sync middleware
- DevTools integration
- TypeScript support

Domain stores will implement:
- Optimistic updates for better UX
- API synchronization
- Cache invalidation strategies
- Real-time event subscription
- Normalized state structure
