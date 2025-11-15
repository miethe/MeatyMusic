# WebSocket Real-Time Client - Working Context

**Purpose:** Token-efficient context cache for all subagents working on WebSocket implementation

---

## Current State

**Branch:** claude/websocket-realtime-client-v1-execution-01B9tpLhTpa5BS5kS8oFtRSm
**Last Commit:** af5d8d0 (initial state)
**Current Phase:** Phase 0 - Infrastructure Setup
**Current Task:** Setting up tracking and preparing for Phase 1

---

## Key Decisions

### Architecture Decisions
- **Singleton WebSocket Client**: Single connection shared across all subscribing components to reduce network overhead and simplify state management
- **React Hooks API**: Idiomatic React pattern for subscription lifecycle management (auto mount/unmount cleanup)
- **Exponential Backoff Reconnection**: 1s, 2s, 4s, 8s, max 30s to respect backend load and prevent thundering herd
- **Event Deduplication**: Using sequence numbers if provided by backend to prevent duplicate UI updates
- **Memory Limits**: 1000 event limit per run to prevent memory exhaustion during long workflows

### MP Pattern Alignment
- **Import from @meaty/ui only**: No direct Radix imports
- **React Query for data fetching**: Existing pattern
- **Error boundaries**: Around new WebSocket components
- **TypeScript strict mode**: No `any` types
- **Accessibility**: WCAG 2.1 AA compliance

---

## Important Learnings

(Will be populated as implementation progresses)

---

## Quick Reference

### Environment Setup

```bash
# Frontend dev server
pnpm --filter "./apps/web" dev

# Run tests
pnpm --filter "./apps/web" test

# Type checking
pnpm --filter "./apps/web" typecheck

# Linting
pnpm --filter "./apps/web" lint

# Build
pnpm --filter "./apps/web" build
```

### WebSocket Backend Endpoint

**URL**: `/events` (WebSocket endpoint)
**Protocol**: WebSocket
**Events Schema**: WorkflowEvent (see implementation plan)

```typescript
interface WorkflowEvent {
  ts: string
  run_id: string
  node: WorkflowNode
  phase: 'start' | 'end' | 'fail'
  duration_ms: number
  metrics: Record<string, any>
  issues: ValidationIssue[]
}
```

### Key Files Reference

**WebSocket Core**:
- Client: `apps/web/src/lib/websocket/client.ts`
- Types: `apps/web/src/lib/websocket/types.ts`
- Tests: `apps/web/src/lib/websocket/__tests__/client.test.ts`

**React Hooks**:
- Events Hook: `apps/web/src/hooks/useWorkflowEvents.ts`
- Progress Hook: `apps/web/src/hooks/useWorkflowProgress.ts`
- Artifacts Hook: `apps/web/src/hooks/useWorkflowArtifacts.ts`
- Status Hook: `apps/web/src/hooks/useWebSocketStatus.ts`

**Components**:
- WorkflowStatus: `apps/web/src/components/WorkflowStatus.tsx` (existing, to be enhanced)
- EventLog: `apps/web/src/components/WorkflowEventLog.tsx` (new)
- ConnectionStatus: `apps/web/src/components/ConnectionStatus.tsx` (new)
- ErrorBoundary: `apps/web/src/components/ErrorBoundary.tsx` (new)

---

## Implementation Scope

**From Plan Executive Summary**:
- Backend: EventPublisher and WebSocket endpoint at `/events` fully operational ✓
- Frontend: 0% complete - no WebSocket client exists (starting state)
- Target: WebSocket client with automatic connection lifecycle, React hooks, real-time UI updates, graceful error handling, event replay

**Success Criteria** (from plan):
1. WebSocket connects automatically on workflow page load
2. Events stream to UI within 1s of emission
3. Auto-reconnects after network interruption (verified in tests)
4. UI updates in real-time during workflow execution
5. 95%+ test coverage for WebSocket client logic

---

## Phase Overview

### Phase 1: WebSocket Client Core (Days 1-2)
- WebSocket connection manager singleton
- Connection state tracking
- Exponential backoff reconnection
- Event subscription/unsubscription
- Message queue for offline buffering

### Phase 2: React Hooks (Days 2-3)
- useWorkflowEvents(runId) - Subscribe to events
- useWorkflowProgress(runId) - Track progress metrics
- useWorkflowArtifacts(runId) - Monitor artifacts
- useWebSocketStatus() - Global connection status

### Phase 3: UI Integration (Days 3-4)
- Enhanced WorkflowStatus with real-time updates
- WorkflowEventLog for debugging
- ConnectionStatus badge with countdown
- Component integration tests

### Phase 4: Connection Status Indicators (Day 4)
- Network status detection (online/offline)
- Error boundary for WebSocket failures
- Toast notifications for critical events

### Phase 5: Error Handling & Testing (Days 4-5)
- Comprehensive unit tests (95%+ coverage)
- Integration tests with mock backend
- Network interruption simulation
- E2E test scenarios

---

## Dependencies

### External Dependencies (Ready)
- Backend API: EventPublisher at `/events` ✓
- React: v18+ with hooks support ✓
- Tailwind CSS: Styling ✓
- Jest/Vitest: Testing framework ✓
- React Testing Library: Component testing ✓
- Playwright: E2E testing ✓
- Browser WebSocket API: Native ✓

### Internal Dependencies
- Phase 2 depends on Phase 1 complete
- Phase 3 depends on Phase 2 complete
- Phase 4 can partially overlap with Phase 3
- Phase 5 depends on all previous phases

---

## Risk Mitigation Notes

### High Risks to Watch
1. **Connection Instability**: Implement robust exponential backoff with jitter, test various network conditions
2. **Message Loss During Reconnection**: Implement event replay from database, store events in IndexedDB as backup
3. **Memory Leaks**: Strict 1000 event limit, automatic cleanup on unmount, monitor heap usage
4. **Race Conditions**: Use sequence numbers, idempotent state updates, queue events for sequential processing

### Contingency Plans
- Connection instability → Fall back to polling at 2s intervals
- Message loss → Re-fetch run status via API if events missing
- Memory leaks → Aggressive cleanup, drop oldest events
- Race conditions → API refetch if state inconsistency detected

---

## Quality Gates

### Code Quality (Must Pass)
- ESLint passes (no warnings)
- TypeScript strict mode, no `any`
- Prettier formatting consistent
- WCAG 2.1 AA for indicators/notifications

### Testing Gates (Must Pass)
- Unit test coverage: 95%+ for WebSocket client
- Integration coverage: 85%+ for React hooks
- Component coverage: 80%+ for UI components
- E2E coverage: 100% of user workflows

### Performance Gates (Must Pass)
- Event display latency: <1s from emission to UI
- Memory: <50MB heap for 1000 events
- Frame rate: 60fps during updates
- Bundle size: <50KB additional (minified + gzipped)

---

## Session Notes

### Session 1 (2025-11-15)
- Created tracking infrastructure
- Set up progress and context files
- Explored existing codebase structure

**CRITICAL DISCOVERY: Partial Implementation Already Exists!**

**Existing Components:**
1. ✅ `hooks/useWorkflowWebSocket.ts` - Basic WebSocket hook with auto-reconnect
   - Has connection lifecycle management
   - Has basic exponential backoff (3s delay, max 5 attempts)
   - Integrates with workflowStore
   - Missing: Singleton pattern, message queuing, advanced features

2. ✅ `stores/workflowStore.ts` - Zustand store for workflow state
   - Tracks active runs, connection state, node status, events
   - Has all needed state management hooks
   - Well-structured for enhancement

3. ✅ `components/workflow/WorkflowStatus.tsx` - Status display component
   - Shows status badge, progress bar, metrics, scores
   - Missing: Real-time event log, advanced features

4. ✅ `types/api/events.ts` - Comprehensive event type definitions
   - All event types defined (RunStarted, NodeCompleted, etc.)
   - Type guards available
   - Matches backend schema

**What's Missing (to meet plan requirements):**

**Phase 1 Gaps:**
- Singleton WebSocket client pattern (currently hook-based)
- Message queuing for offline scenarios
- More sophisticated reconnection (max 30s vs current 3s fixed)
- Event deduplication

**Phase 2 Gaps:**
- useWorkflowProgress hook (derive from store state)
- useWorkflowArtifacts hook (monitor artifact updates)
- useWebSocketStatus hook (separate connection status)

**Phase 3 Gaps:**
- WorkflowEventLog component (debugging panel)
- ConnectionStatus component (connection badge)
- Enhanced WorkflowStatus with real-time updates

**Phase 4 Gaps:**
- Network status detection (navigator.onLine)
- Error boundary component
- Toast notification integration

**Phase 5 Gaps:**
- All testing (unit, integration, E2E)

**Implementation Strategy:**
- ENHANCE existing code rather than replace
- ADD missing components
- REFACTOR for plan architecture alignment
- ADD comprehensive testing

**Next: Begin delegation to subagents for enhancements and additions**

---

## Important Constraints

1. **Delegate ALL work to subagents** - orchestrator role only
2. **Documentation MUST use @documentation-writer** - no other agent writes docs
3. **NO reports, summaries, or extra artifacts** - only what's in the plan
4. **Brief observation notes allowed** - in this file only, for context across turns
5. **Update context at end of each turn** - not loaded in full, just reviewed for current status

---

**Last Updated**: 2025-11-15
**Next Review**: After Phase 1 Task 1.1 completion
