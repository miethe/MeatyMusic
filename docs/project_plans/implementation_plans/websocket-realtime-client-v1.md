# Implementation Plan: WebSocket Real-Time Client (WP-N4)

**Complexity**: M (Medium) | **Track**: Standard (Haiku + Sonnet agents)
**Estimated Effort**: 34 story points | **Timeline**: 1 week (5 working days)
**Priority**: HIGH | **Blocking**: UI Feature Completeness
**Target Audience**: Frontend developers, UI engineers

---

## Executive Summary

This implementation plan details the development of a WebSocket real-time client for the MeatyMusic frontend to enable live workflow event streaming and UI updates during Claude Code orchestration execution.

**Current State:**
- Backend: EventPublisher and WebSocket endpoint at `/events` fully operational
- Frontend: 0% complete - no WebSocket client exists

**Target State:**
- WebSocket client with automatic connection lifecycle management
- React hooks for event subscription and progress tracking
- Real-time UI updates in WorkflowStatus component
- Graceful handling of network interruptions with exponential backoff reconnection
- Full event replay capability on reconnect

**Success Criteria:**
- WebSocket connects automatically on workflow page load
- Events stream to UI within 1s of emission
- Auto-reconnects after network interruption (verified in tests)
- UI updates in real-time during workflow execution (verified in integration tests)
- 95%+ test coverage for WebSocket client logic

---

## Implementation Phases

### Phase 1: WebSocket Client Core (Days 1-2)
**Goal**: Implement connection lifecycle management and event subscription system

**Key Components**:
- WebSocket connection manager with singleton pattern
- Connection state tracking (connecting, connected, disconnected, reconnecting)
- Exponential backoff reconnection logic (1s, 2s, 4s, 8s, max 30s)
- Event subscription/unsubscription system
- Message queue for offline buffering

**Deliverables**:
- `apps/web/src/lib/websocket/client.ts` - WebSocket client singleton
- `apps/web/src/lib/websocket/types.ts` - Event type definitions
- Connection state management utilities

**Dependencies**:
- Browser WebSocket API
- UUID library for event tracking
- Date/time utilities

---

### Phase 2: React Hooks (Days 2-3)
**Goal**: Create consumable React hooks for components

**Key Components**:
- `useWorkflowEvents(runId)` - Subscribe to workflow events by run_id
- `useWorkflowProgress(runId)` - Track progress metrics and node status
- `useWorkflowArtifacts(runId)` - Monitor artifact updates in real-time
- Connection status hook (`useWebSocketStatus`)
- Event history hook for debugging

**Deliverables**:
- `apps/web/src/hooks/useWorkflowEvents.ts`
- `apps/web/src/hooks/useWorkflowProgress.ts`
- `apps/web/src/hooks/useWorkflowArtifacts.ts`
- `apps/web/src/hooks/useWebSocketStatus.ts`
- Hook documentation and examples

**Dependencies**:
- WebSocket client core (Phase 1)
- React hooks ecosystem
- React Query for server state sync

---

### Phase 3: UI Integration (Days 3-4)
**Goal**: Integrate real-time updates into existing UI components

**Key Components**:
- Enhanced WorkflowStatus component with live updates
- Real-time node progress display
- Live score updates as validation completes
- Event log panel for debugging
- Connection status badge with reconnection countdown

**Deliverables**:
- Updated `apps/web/src/components/WorkflowStatus.tsx`
- New `apps/web/src/components/WorkflowEventLog.tsx`
- New `apps/web/src/components/ConnectionStatus.tsx`
- Component integration tests

**Dependencies**:
- React hooks (Phase 2)
- Existing UI component library
- Tailwind CSS for styling

---

### Phase 4: Connection Status Indicators (Days 4)
**Goal**: Provide visual feedback for connection state

**Key Components**:
- Connection status badge (connected/disconnecting/reconnecting)
- Reconnection countdown timer
- Error notification display
- Network status detection (online/offline)
- Toast notifications for critical events

**Deliverables**:
- Enhanced ConnectionStatus component
- Error boundary for WebSocket failures
- Notification system integration

**Dependencies**:
- Phase 3 UI components
- Toast notification library
- Navigation/context for global status

---

### Phase 5: Error Handling & Testing (Days 4-5)
**Goal**: Comprehensive error handling and test coverage

**Key Components**:
- Error recovery mechanisms
- Graceful degradation (polling fallback)
- Network interruption simulation
- Test suite: unit, integration, edge cases

**Deliverables**:
- Error handling layer
- Network interruption tests
- WebSocket client unit tests (95%+ coverage)
- Integration tests with mock backend
- E2E test scenarios

**Dependencies**:
- All previous phases
- Jest/Vitest testing framework
- MSW (Mock Service Worker) for WebSocket mocking

---

## Task Breakdown with Estimates

### WebSocket Client Core (Phase 1)

#### Task 1.1: Create WebSocket Client Manager
**Story Points**: 5
**Description**: Implement singleton WebSocket client with connection lifecycle

```typescript
// Expected interface
interface WebSocketClient {
  connect(): Promise<void>
  disconnect(): void
  isConnected(): boolean
  subscribe(runId: string, callback: (event: WorkflowEvent) => void): Unsubscribe
  unsubscribe(runId: string): void
  send(message: any): void
  getConnectionState(): ConnectionState
  on(event: ConnectionEvent, callback: (data: any) => void): Unsubscribe
}
```

**Acceptance Criteria**:
- Client connects to WebSocket endpoint via environment variable
- Connection state transitions are correct
- Exponential backoff reconnection works
- No memory leaks from repeated connect/disconnect cycles
- Singleton pattern prevents multiple connections

**Tasks**:
- Set up client.ts with WebSocket API wrapper
- Implement connection state machine
- Add exponential backoff logic
- Implement subscription registry
- Add connection pooling (single connection for all subscribers)

---

#### Task 1.2: Create Event Type Definitions
**Story Points**: 2
**Description**: Define TypeScript interfaces for all workflow events

```typescript
// Expected types
interface WorkflowEvent {
  ts: string
  run_id: string
  node: WorkflowNode
  phase: 'start' | 'end' | 'fail'
  duration_ms: number
  metrics: Record<string, any>
  issues: ValidationIssue[]
}

enum WorkflowNode {
  PLAN = 'PLAN',
  STYLE = 'STYLE',
  LYRICS = 'LYRICS',
  PRODUCER = 'PRODUCER',
  COMPOSE = 'COMPOSE',
  VALIDATE = 'VALIDATE',
  FIX = 'FIX',
  RENDER = 'RENDER',
  REVIEW = 'REVIEW'
}
```

**Acceptance Criteria**:
- All event types match backend schema
- Type safety for event handling
- Optional fields handled correctly
- IDE autocomplete works

**Tasks**:
- Extract event schema from backend API types
- Create comprehensive type definitions
- Export types for consumer usage
- Add type guards for runtime validation

---

#### Task 1.3: Implement Message Queuing
**Story Points**: 3
**Description**: Handle offline scenarios with message buffering

**Acceptance Criteria**:
- Messages queued when offline
- Queue flushed on reconnect
- Max queue size enforced (prevent memory exhaustion)
- FIFO ordering maintained

**Tasks**:
- Create in-memory message queue
- Implement queue-on-disconnect logic
- Add flush-on-reconnect mechanism
- Handle queue overflow gracefully

---

### React Hooks (Phase 2)

#### Task 2.1: useWorkflowEvents Hook
**Story Points**: 5
**Description**: Subscribe to workflow events for a specific run

```typescript
// Expected usage
const { events, isLoading, error } = useWorkflowEvents(runId)

// Hook should:
// - Subscribe on mount, unsubscribe on unmount
// - Maintain event history
// - Provide loading/error states
// - Support cleanup
```

**Acceptance Criteria**:
- Hook subscribes on mount, unsubscribes on unmount
- Events accumulated in array
- Loading state reflects connection status
- Error state captures subscription failures
- Memory cleanup prevents leaks

**Tasks**:
- Create hook with subscription logic
- Implement event accumulation
- Add loading/error state management
- Write cleanup handlers
- Add event history limit

---

#### Task 2.2: useWorkflowProgress Hook
**Story Points**: 5
**Description**: Track workflow progress and node status updates

```typescript
// Expected usage
const progress = useWorkflowProgress(runId)
// Returns: {
//   currentNode: string,
//   nodesCompleted: string[],
//   nodesFailed: string[],
//   nodesInProgress: string[],
//   scores: Record<string, number>,
//   issues: ValidationIssue[]
// }
```

**Acceptance Criteria**:
- Tracks current executing node
- Accumulates completed/failed/in-progress nodes
- Updates scores in real-time
- Provides issues list
- Recomputes on each event

**Tasks**:
- Parse events into progress state
- Implement node tracking logic
- Calculate score aggregations
- Provide convenience methods
- Memoize expensive computations

---

#### Task 2.3: useWorkflowArtifacts Hook
**Story Points**: 4
**Description**: Monitor artifact generation and updates

**Acceptance Criteria**:
- Tracks artifacts by node name
- Updates as they're generated
- Provides access to latest versions
- Handles missing/incomplete artifacts

**Tasks**:
- Design artifact storage structure
- Implement artifact accumulation
- Add artifact versioning
- Provide convenience accessors

---

#### Task 2.4: useWebSocketStatus Hook
**Story Points**: 3
**Description**: Global WebSocket connection status

```typescript
const status = useWebSocketStatus()
// Returns: {
//   isConnected: boolean,
//   state: 'connected' | 'connecting' | 'disconnected' | 'reconnecting',
//   reconnectAttempt: number,
//   lastConnected: Date | null,
//   error: Error | null
// }
```

**Acceptance Criteria**:
- Reflects actual connection state
- Updates on state changes
- Provides reconnect attempt count
- Available globally

**Tasks**:
- Create global status hook
- Wire to WebSocket client events
- Add context provider for app
- Implement hook consumer

---

### UI Integration (Phase 3)

#### Task 3.1: Update WorkflowStatus Component
**Story Points**: 8
**Description**: Enhance component with real-time updates

**Current State**:
- Displays workflow run status
- Shows node list with states
- Displays metrics panel

**Enhanced State**:
- Real-time node progress updates
- Live score calculations
- Event log integration
- Animated state transitions
- Loading indicators

**Acceptance Criteria**:
- Component re-renders on each event
- Node progress animates smoothly
- Scores update without refetch
- Event log scrolls automatically
- Performance: 60fps updates

**Tasks**:
- Integrate useWorkflowEvents hook
- Integrate useWorkflowProgress hook
- Add real-time score display
- Implement event log panel
- Add loading/error states
- Performance optimization

---

#### Task 3.2: Create WorkflowEventLog Component
**Story Points**: 4
**Description**: Display raw event stream for debugging

**Features**:
- Scrollable event list (newest last)
- Timestamp, node name, phase, duration
- Collapsible metric details
- Issue/error highlighting
- Clear button
- Max 100 events (auto-trim oldest)

**Acceptance Criteria**:
- All events visible and readable
- Timestamps formatted correctly
- Scrolls to newest on update
- Error events highlighted
- Performance: handles 100+ events

**Tasks**:
- Create event log component
- Implement virtualization for performance
- Add formatting/styling
- Implement trim logic
- Add debugging features

---

#### Task 3.3: Create ConnectionStatus Component
**Story Points**: 5
**Description**: Visual connection state indicator

**Features**:
- Badge showing connection state
- Animated dot for active states
- Reconnection countdown
- Error message display
- Click to force reconnect

**Acceptance Criteria**:
- Shows correct state always
- Animates smoothly
- Countdown accurate to 1s
- Error messages clear
- Accessible (ARIA labels)

**Tasks**:
- Create component structure
- Implement status badge
- Add animations
- Implement countdown timer
- Add error display
- Add accessibility features

---

### Connection Status Indicators (Phase 4)

#### Task 4.1: Network Status Detection
**Story Points**: 2
**Description**: Detect online/offline status

**Acceptance Criteria**:
- Detects browser online/offline events
- Updates WebSocket behavior accordingly
- Prevents unnecessary reconnect attempts
- Handles transitions gracefully

**Tasks**:
- Implement navigator.onLine checking
- Listen to online/offline events
- Integrate with WebSocket client
- Test offline scenarios

---

#### Task 4.2: Error Boundary & Recovery
**Story Points**: 3
**Description**: Handle WebSocket failures gracefully

**Acceptance Criteria**:
- Caught errors don't crash app
- User sees helpful error messages
- Recovery options provided
- Error logging for debugging

**Tasks**:
- Create error boundary component
- Implement error logging
- Add recovery UI
- Test error scenarios

---

#### Task 4.3: Notification System Integration
**Story Points**: 3
**Description**: Toast notifications for important events

**Events to Notify**:
- Connection lost
- Connection restored
- Reconnection failures (after 3 attempts)
- Run completion
- Critical errors

**Acceptance Criteria**:
- Notifications non-intrusive
- Dismissible
- Auto-clear after 5s
- Stacking handled
- Accessible

**Tasks**:
- Integration with notification system
- Event → notification mapping
- Styling and positioning
- Accessibility features

---

### Error Handling & Testing (Phase 5)

#### Task 5.1: Unit Tests - WebSocket Client
**Story Points**: 8
**Description**: Comprehensive unit tests (95%+ coverage)

**Test Coverage**:
- Connection lifecycle (connect, disconnect, reconnect)
- Exponential backoff timing
- Event subscription/unsubscription
- Message queuing
- Connection state transitions
- Error scenarios
- Edge cases

**Acceptance Criteria**:
- 95%+ code coverage
- All critical paths tested
- Mocks isolate dependencies
- Fast execution (<2s)

**Tasks**:
- Set up test environment (Jest/Vitest)
- Write connection tests
- Write subscription tests
- Write queue tests
- Write backoff tests
- Add edge case tests
- Generate coverage report

---

#### Task 5.2: Integration Tests - React Hooks
**Story Points**: 6
**Description**: Test hooks with mock WebSocket backend

**Test Scenarios**:
- Hook mounting/unmounting
- Event subscription
- State updates
- Error handling
- Cleanup logic

**Acceptance Criteria**:
- All hooks tested
- Mock backend reliable
- Tests run in <5s
- No memory leaks

**Tasks**:
- Set up React Testing Library
- Create mock WebSocket server
- Write hook tests
- Implement memory leak detection
- Add async handling

---

#### Task 5.3: Network Interruption Tests
**Story Points**: 5
**Description**: Simulate real-world network conditions

**Scenarios**:
- Connection drops mid-event
- Reconnection after 5s, 30s, 60s
- Multiple rapid reconnects
- Message loss and recovery
- Offline mode

**Acceptance Criteria**:
- All scenarios handled
- No infinite loops
- Recovery confirmed
- Queue properly managed

**Tasks**:
- Create network simulation utilities
- Write interruption tests
- Test recovery logic
- Validate queue flushing
- Test offline mode

---

#### Task 5.4: Component Integration Tests
**Story Points**: 4
**Description**: Test components with real hook usage

**Components Tested**:
- WorkflowStatus with live events
- ConnectionStatus state transitions
- WorkflowEventLog event display
- Error boundary error handling

**Acceptance Criteria**:
- Components render correctly
- Real-time updates work
- Error states handled
- Performance acceptable

**Tasks**:
- Write component tests
- Mock WebSocket data
- Test state updates
- Verify rendering
- Check accessibility

---

#### Task 5.5: E2E Test Scenarios
**Story Points**: 5
**Description**: End-to-end workflow tests

**Scenarios**:
- User navigates to workflow page → WebSocket connects
- Workflow starts → events stream in real-time
- Connection drops → auto-reconnect triggered
- Workflow completes → final event received
- Network comes back online → queue flushed

**Acceptance Criteria**:
- All scenarios pass
- Timing assertions met (<1s for event display)
- No flaky tests
- Clear failure messages

**Tasks**:
- Set up E2E test framework (Playwright)
- Write scenario tests
- Implement timing assertions
- Add failure diagnostics
- Run in CI/CD

---

## Dependency Map

### Internal Dependencies

```
Phase 1 (WebSocket Client Core)
├── Task 1.1: WebSocket Client Manager
│   └── No dependencies
├── Task 1.2: Event Type Definitions
│   └── No dependencies
└── Task 1.3: Message Queuing
    └── Task 1.1 (WebSocket Client Manager)

Phase 2 (React Hooks) - DEPENDS ON Phase 1
├── Task 2.1: useWorkflowEvents
│   └── Task 1.1, Task 1.2
├── Task 2.2: useWorkflowProgress
│   └── Task 2.1 (useWorkflowEvents)
├── Task 2.3: useWorkflowArtifacts
│   └── Task 2.1 (useWorkflowEvents)
└── Task 2.4: useWebSocketStatus
    └── Task 1.1

Phase 3 (UI Integration) - DEPENDS ON Phase 2
├── Task 3.1: Update WorkflowStatus
│   └── Task 2.1, Task 2.2
├── Task 3.2: Create WorkflowEventLog
│   └── Task 2.1
└── Task 3.3: Create ConnectionStatus
    └── Task 2.4

Phase 4 (Status Indicators) - PARALLELIZABLE WITH Phase 3
├── Task 4.1: Network Status Detection
│   └── Task 1.1
├── Task 4.2: Error Boundary
│   └── Task 1.1
└── Task 4.3: Notifications
    └── Task 3.3

Phase 5 (Testing) - DEPENDS ON ALL PREVIOUS
├── Task 5.1: Unit Tests (WebSocket)
│   └── Task 1.1, Task 1.2, Task 1.3
├── Task 5.2: Integration Tests (Hooks)
│   └── Phase 2 Tasks
├── Task 5.3: Network Interruption
│   └── Task 1.1, Task 1.3
├── Task 5.4: Component Tests
│   └── Phase 3 Tasks
└── Task 5.5: E2E Tests
    └── All phases
```

### External Dependencies

- **Backend API**: EventPublisher at `/events` (READY)
- **React**: v18+ with hooks support (AVAILABLE)
- **Tailwind CSS**: Styling (AVAILABLE)
- **Jest/Vitest**: Testing (AVAILABLE)
- **React Testing Library**: Component testing (AVAILABLE)
- **Playwright**: E2E testing (AVAILABLE)
- **Browser WebSocket API**: Native (AVAILABLE)

---

## Architecture & Design Patterns

### WebSocket Client Architecture

```
┌─────────────────────────────────────────────┐
│           React Components (UI)             │
│  (WorkflowStatus, ConnectionStatus, etc)    │
└────────────────────┬────────────────────────┘
                     │ consume
                     ▼
┌─────────────────────────────────────────────┐
│            Custom React Hooks               │
│  (useWorkflowEvents, useWorkflowProgress)   │
└────────────────────┬────────────────────────┘
                     │ use
                     ▼
┌─────────────────────────────────────────────┐
│       WebSocket Client Singleton            │
│  (connect, subscribe, reconnect logic)      │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│    Browser WebSocket API / Network          │
└─────────────────────────────────────────────┘
```

### Event Flow

```
Backend Event Emission
       ↓
WebSocket Network Transport
       ↓
WebSocket Client receives
       ↓
Stores in subscription callbacks
       ↓
React hook state updates
       ↓
Component re-render
       ↓
User sees real-time update
```

### Error Handling Strategy

```
Connection Error
       ↓
Exponential Backoff (1s, 2s, 4s, 8s, 30s)
       ↓
Max 30s wait? → Show error, allow manual retry
       ↓
Connection restored
       ↓
Flush message queue
       ↓
Resume normal operation
```

---

## Risk Assessment

### High Risks

#### 1. WebSocket Connection Instability
**Risk**: Frequent disconnections in production environments
**Impact**: Real-time updates unreliable, user frustration
**Probability**: Medium
**Mitigation**:
- Implement robust exponential backoff with jitter
- Add network status detection (online/offline)
- Test with various network conditions (3G, WiFi dropouts)
- Implement fallback polling mechanism
- Monitor connection metrics in production

**Contingency**: If stability cannot be achieved, fall back to polling at 2s intervals

---

#### 2. Message Loss During Reconnection
**Risk**: Events published while disconnected are lost
**Impact**: Users miss workflow updates
**Probability**: High
**Mitigation**:
- Implement event replay from database on reconnect
- Store events in browser IndexedDB as backup
- Include sequence numbers for ordering verification
- Request event history on reconnect

**Contingency**: Re-fetch run status via API if events missing

---

#### 3. Memory Leaks from Subscriptions
**Risk**: Unbounded event accumulation or uncleaned subscriptions
**Impact**: App slowdown, crashes on long sessions
**Probability**: Medium
**Mitigation**:
- Strict memory limits (max 1000 events per run)
- Implement automatic cleanup on unmount
- Use weak references where possible
- Monitor heap usage in tests
- Implement event deduplication

**Contingency**: Implement aggressive cleanup; drop oldest events

---

#### 4. Race Conditions in State Updates
**Risk**: Concurrent events cause inconsistent UI state
**Impact**: Display shows incorrect information
**Probability**: Medium
**Mitigation**:
- Use sequence numbers from events
- Implement idempotent state updates
- Queue events for sequential processing
- Add state validation checks
- Comprehensive testing with rapid events

**Contingency**: Resort to API refetch if state inconsistency detected

---

### Medium Risks

#### 5. Performance with High Event Rate
**Risk**: Rapid events (>10/s) cause UI lag
**Impact**: Janky UI, poor user experience
**Probability**: Low (backend unlikely to emit >10/s)
**Mitigation**:
- Batch event updates (100ms window)
- Use React.memo for component memoization
- Virtualize long event lists
- Monitor frame rate in tests
- Implement debouncing for computed state

---

#### 6. Browser Compatibility
**Risk**: WebSocket not supported in older browsers
**Impact**: Feature doesn't work for some users
**Probability**: Low (MVP targets modern browsers)
**Mitigation**:
- Feature detection at startup
- Graceful degradation to polling
- Document browser requirements
- Test on target browser matrix

---

### Low Risks

#### 7. TypeScript Type Safety
**Risk**: Runtime type errors from server schema changes
**Impact**: Crashes or incorrect behavior
**Probability**: Low
**Mitigation**:
- Type guards for all event data
- Runtime schema validation (zod or similar)
- Keep backend/frontend types synchronized
- Version WebSocket protocol

---

## MeatyMusic Architecture Alignment

### Layered Architecture Mapping

This feature integrates primarily with the **API** and **UI** layers:

```
Database Layer
├── workflow_runs (state tracking)
├── workflow_events (event persistence)
└── node_executions (artifact storage)

Service Layer
├── workflow_service (orchestration)
└── workflow_run_service (run management)

Repository Layer
├── workflow_run_repo
└── workflow_event_repo

API Layer
├── WebSocket endpoint: /events (EXISTING)
├── REST endpoints: /songs/{id}/runs
└── Event schema validation

Frontend Layer (THIS IMPLEMENTATION)
├── WebSocket Client (client.ts)
├── React Hooks (useWorkflowEvents, etc)
├── Components (WorkflowStatus, ConnectionStatus)
└── Event processing logic
```

### Determinism & Event Traceability

Per CLAUDE.md requirements:
- All events include: `ts`, `run_id`, `node`, `phase`, `duration_ms`, `metrics`, `issues`
- Events stored in database for audit trail
- Replay capability for troubleshooting
- Full traceability of workflow execution

This implementation assumes events are already deterministic at generation (backend responsibility).

---

## Quality Gates

### Code Quality

- **Linting**: ESLint passes (no warnings)
- **Type Safety**: TypeScript strict mode, no `any`
- **Formatting**: Prettier consistency
- **Accessibility**: WCAG 2.1 AA for indicators and notifications

### Testing Gates

- **Unit Test Coverage**: 95%+ for WebSocket client
- **Integration Coverage**: 85%+ for React hooks
- **Component Coverage**: 80%+ for UI components
- **E2E Coverage**: 100% of user workflows

### Performance Gates

- **Event Display Latency**: <1s from emission to UI update
- **Memory**: <50MB heap for 1000 events
- **Frame Rate**: 60fps during updates (measured via DevTools)
- **Bundle Size**: <50KB additional (minified + gzipped)

### Reliability Gates

- **Connection Stability**: Auto-reconnect succeeds within 30s
- **Event Ordering**: Events displayed in chronological order
- **No Memory Leaks**: Heap stable after 1000 mount/unmount cycles
- **Network Resilience**: Handles 3s+ disconnections

---

## Task Sequencing (Critical Path)

### Week 1 Schedule (Fast Track)

**Day 1 (Mon)**:
- Morning: Task 1.1 (WebSocket Client Manager)
- Afternoon: Task 1.2 (Event Type Definitions), Task 1.3 (Message Queuing)
- EOD: Phase 1 complete and unit tested

**Day 2 (Tue)**:
- Morning: Task 2.1 (useWorkflowEvents), Task 2.2 (useWorkflowProgress)
- Afternoon: Task 2.3 (useWorkflowArtifacts), Task 2.4 (useWebSocketStatus)
- EOD: Phase 2 complete with hook tests

**Day 3 (Wed)**:
- Morning: Task 3.1 (Update WorkflowStatus), Task 3.2 (EventLog)
- Afternoon: Task 3.3 (ConnectionStatus), Task 4.1-4.3 (Status Indicators)
- EOD: Phase 3-4 complete

**Day 4 (Thu)**:
- Full day: Task 5.1-5.3 (Unit, Integration, Network tests)
- EOD: All tests written

**Day 5 (Fri)**:
- Morning: Task 5.4-5.5 (E2E tests)
- Afternoon: Bug fixes, test adjustments, final validation
- EOD: All acceptance criteria met, ready for review

**Buffer**: Days 4-5 reserved for testing and adjustment (typical 40% testing overhead)

---

## Deliverables Checklist

### Code Deliverables

- [ ] `/apps/web/src/lib/websocket/client.ts` - WebSocket client (400-500 LOC)
- [ ] `/apps/web/src/lib/websocket/types.ts` - Event type definitions (150-200 LOC)
- [ ] `/apps/web/src/hooks/useWorkflowEvents.ts` (100-150 LOC)
- [ ] `/apps/web/src/hooks/useWorkflowProgress.ts` (150-200 LOC)
- [ ] `/apps/web/src/hooks/useWorkflowArtifacts.ts` (100-150 LOC)
- [ ] `/apps/web/src/hooks/useWebSocketStatus.ts` (80-120 LOC)
- [ ] Updated `/apps/web/src/components/WorkflowStatus.tsx` (refactored)
- [ ] `/apps/web/src/components/WorkflowEventLog.tsx` (200-250 LOC)
- [ ] `/apps/web/src/components/ConnectionStatus.tsx` (150-200 LOC)
- [ ] `/apps/web/src/components/ErrorBoundary.tsx` (100-150 LOC)

### Test Deliverables

- [ ] `/apps/web/src/lib/websocket/__tests__/client.test.ts` (500+ LOC)
- [ ] `/apps/web/src/hooks/__tests__/useWorkflowEvents.test.ts` (300+ LOC)
- [ ] `/apps/web/src/hooks/__tests__/useWorkflowProgress.test.ts` (250+ LOC)
- [ ] `/apps/web/src/components/__tests__/WorkflowStatus.test.tsx` (400+ LOC)
- [ ] `/apps/web/e2e/workflows.spec.ts` (E2E tests)

### Documentation Deliverables

- [ ] WebSocket Client API documentation
- [ ] React Hook usage guide with examples
- [ ] Component integration guide
- [ ] Troubleshooting guide for connection issues
- [ ] Architecture decision record

### Configuration

- [ ] Environment variable for WebSocket URL
- [ ] Feature flag for WebSocket (with polling fallback)
- [ ] Test configuration for mock WebSocket server

---

## Linear Import Data

### Epic
```
Name: WebSocket Real-Time Client Implementation
Description: Enable live workflow event streaming for MeatyMusic frontend
Status: To Do
Priority: High
Estimate: 34
Target Date: 2025-11-21
```

### Tasks (by phase)

#### Phase 1: WebSocket Client Core

| Task ID | Title | Estimate | Priority | Dependencies | Labels |
|---------|-------|----------|----------|--------------|--------|
| WS-1.1 | Create WebSocket Client Manager | 5 | High | None | backend, client |
| WS-1.2 | Create Event Type Definitions | 2 | High | WS-1.1 | types, api |
| WS-1.3 | Implement Message Queuing | 3 | High | WS-1.1 | client, resilience |

#### Phase 2: React Hooks

| Task ID | Title | Estimate | Priority | Dependencies | Labels |
|---------|-------|----------|----------|--------------|--------|
| WS-2.1 | Create useWorkflowEvents Hook | 5 | High | WS-1.1, WS-1.2 | hooks, frontend |
| WS-2.2 | Create useWorkflowProgress Hook | 5 | High | WS-2.1 | hooks, state |
| WS-2.3 | Create useWorkflowArtifacts Hook | 4 | Medium | WS-2.1 | hooks, artifacts |
| WS-2.4 | Create useWebSocketStatus Hook | 3 | Medium | WS-1.1 | hooks, status |

#### Phase 3: UI Integration

| Task ID | Title | Estimate | Priority | Dependencies | Labels |
|---------|-------|----------|----------|--------------|--------|
| WS-3.1 | Update WorkflowStatus Component | 8 | High | WS-2.1, WS-2.2 | components, ui |
| WS-3.2 | Create WorkflowEventLog Component | 4 | Medium | WS-2.1 | components, debug |
| WS-3.3 | Create ConnectionStatus Component | 5 | High | WS-2.4 | components, status |

#### Phase 4: Status Indicators

| Task ID | Title | Estimate | Priority | Dependencies | Labels |
|---------|-------|----------|----------|--------------|--------|
| WS-4.1 | Network Status Detection | 2 | Medium | WS-1.1 | resilience |
| WS-4.2 | Error Boundary & Recovery | 3 | High | WS-1.1 | error-handling |
| WS-4.3 | Notification Integration | 3 | Medium | WS-3.3 | ui, notifications |

#### Phase 5: Testing & Error Handling

| Task ID | Title | Estimate | Priority | Dependencies | Labels |
|---------|-------|----------|----------|--------------|--------|
| WS-5.1 | Unit Tests - WebSocket Client | 8 | High | All Phase 1 | testing, qa |
| WS-5.2 | Integration Tests - React Hooks | 6 | High | All Phase 2 | testing, qa |
| WS-5.3 | Network Interruption Tests | 5 | High | WS-1.1, WS-1.3 | testing, qa |
| WS-5.4 | Component Integration Tests | 4 | High | All Phase 3 | testing, qa |
| WS-5.5 | E2E Test Scenarios | 5 | High | All phases | testing, qa, e2e |

---

## Success Criteria Verification

### Functional Requirements Checklist

- [ ] WebSocket client connects automatically when WorkflowStatus component mounts
- [ ] Events stream to UI within 1 second of emission (verified with timestamps)
- [ ] Auto-reconnect works after network interruption (tested with 3s+ disconnect)
- [ ] UI updates in real-time during workflow execution (visual confirmation + test)
- [ ] No console errors or warnings during normal operation
- [ ] Connection status displayed accurately in UI
- [ ] Events replay from database on reconnect
- [ ] Event ordering maintained (chronological)

### Performance Criteria Checklist

- [ ] Event display latency <1s (measured with performance.now())
- [ ] Memory usage <50MB for 1000 events
- [ ] Frame rate 60fps during updates (DevTools verification)
- [ ] Bundle size increase <50KB minified+gzipped
- [ ] WebSocket client responds <100ms to subscribe/unsubscribe

### Test Coverage Checklist

- [ ] WebSocket client: 95%+ coverage
- [ ] React hooks: 85%+ coverage
- [ ] Components: 80%+ coverage
- [ ] All critical paths tested
- [ ] All error scenarios tested
- [ ] Network interruption scenarios tested (5 scenarios)
- [ ] Edge cases covered (large event counts, rapid events, etc)

### Code Quality Checklist

- [ ] ESLint passes, no warnings
- [ ] TypeScript strict mode, no `any`
- [ ] Prettier formatting consistent
- [ ] No unused imports or variables
- [ ] Meaningful variable names
- [ ] JSDoc comments for public APIs
- [ ] Clean Git history (semantic commits)

### User Experience Checklist

- [ ] Connection status always visible
- [ ] Error messages clear and actionable
- [ ] Auto-reconnect transparent to user
- [ ] No jarring visual updates
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Mobile-friendly (responsive)

---

## Sign-Off Criteria

**Ready for Merge When**:
1. All code deliverables complete
2. All tests pass (100% of test suite)
3. Code review approved (2+ reviewers)
4. Integration test with real backend passes
5. Performance benchmarks within targets
6. Documentation complete and reviewed
7. No open blockers or critical issues

**Ready for Release When**:
1. Merged to main branch
2. Staging deployment verified
3. E2E tests pass in staging
4. Accessibility audit passed
5. Product owner sign-off
6. Release notes prepared

---

## Monitoring & Observability

### Metrics to Track

**Development**:
- Lines of code written (target: 2000-2500 total)
- Test coverage percentage (target: >90%)
- Bug count (target: <5 critical, <10 medium)

**Runtime**:
- WebSocket connection success rate (target: >99%)
- Average event latency (target: <500ms)
- Auto-reconnect success rate (target: >99%)
- Memory usage (target: <50MB)

### Logging Strategy

```typescript
// Example logging in WebSocket client
logger.debug('WebSocket connecting', { url, attempt })
logger.info('WebSocket connected', { duration_ms })
logger.warn('WebSocket reconnecting', { attempt, delay_ms })
logger.error('WebSocket connection failed', { error, attempt })

// Example in React hooks
logger.debug('useWorkflowEvents subscribed', { runId })
logger.debug('useWorkflowEvents received event', { runId, node, phase })
logger.error('useWorkflowEvents subscription failed', { runId, error })
```

### Debugging Support

- Event log component for user-visible debugging
- Browser DevTools integration
- Performance profiling support
- Memory snapshot capabilities
- Connection state inspection via console API

---

## Implementation Notes

### Key Design Decisions

1. **Singleton Pattern for WebSocket**: Ensures single connection regardless of number of components subscribing to events. Simplifies state management and reduces network overhead.

2. **React Hooks API**: Provides idiomatic React pattern. Hooks manage subscription lifecycle automatically (mount/unmount). Enables code reuse across components.

3. **Exponential Backoff Reconnection**: Respects backend load, prevents thundering herd on service restart. Max 30s prevents indefinite waiting.

4. **Event Deduplication**: Prevents duplicate updates if events arrive out of order or are retransmitted. Uses sequence numbers if provided by backend.

5. **Graceful Degradation**: If WebSocket unavailable, feature flag enables fallback to polling. Doesn't break app, just reduces real-time capability.

6. **Memory Limits**: Prevents unbounded event accumulation from causing memory exhaustion. 1000 event limit per run is reasonable for typical 10-minute workflows.

### Testing Strategy

- **Unit tests**: WebSocket client in isolation (mock all I/O)
- **Integration tests**: React hooks with mock backend events
- **Component tests**: Components rendering and updating correctly
- **E2E tests**: Full workflow from real backend
- **Network tests**: Simulate realistic network conditions

### Accessibility Considerations

- Connection status indicator has ARIA labels
- Notifications have screen reader announcements
- Error messages clear and actionable
- Keyboard navigation for interactive elements
- Color not sole indicator of state (use icons + text)

---

## Future Enhancements (Post-MVP)

1. **Event Filtering**: Allow users to filter events by node or phase
2. **Event Search**: Search historical events
3. **Custom Notifications**: User-defined alerts for specific events
4. **Performance Analytics**: Track workflow latency trends
5. **Multi-Run Tracking**: Monitor multiple workflows simultaneously
6. **Mobile App Support**: WebSocket client for React Native

---

## References

- **Backend WebSocket API**: `/events` endpoint (EventPublisher)
- **Event Schema**: WorkflowEvent in PRD-REQUIREMENTS-SUMMARY.md
- **Orchestration Workflow**: NEXT-STEPS-REPORT.md WP-N4
- **Frontend Architecture**: website_app.prd.md
- **Testing Framework**: Jest/Vitest configuration in apps/web

---

## Document Metadata

**Created**: 2025-11-14
**Version**: 1.0
**Status**: Ready for Implementation
**Assigned To**: Frontend Developer (1 engineer)
**Sprint**: Week of 2025-11-18
**Estimated Duration**: 5 working days
**Review Frequency**: Daily standup, EOD status updates

**Approval**:
- [ ] Tech Lead
- [ ] Product Owner
- [ ] Frontend Lead
- [ ] QA Lead

---

## Appendix A: File Structure

```
apps/web/src/
├── lib/
│   ├── websocket/
│   │   ├── client.ts                    # Main WebSocket client
│   │   ├── types.ts                     # Event type definitions
│   │   └── __tests__/
│   │       └── client.test.ts           # WebSocket tests
│   │
│   └── api/
│       └── (existing API client)
│
├── hooks/
│   ├── useWorkflowEvents.ts             # Event subscription hook
│   ├── useWorkflowProgress.ts           # Progress tracking hook
│   ├── useWorkflowArtifacts.ts          # Artifact updates hook
│   ├── useWebSocketStatus.ts            # Connection status hook
│   └── __tests__/
│       ├── useWorkflowEvents.test.ts
│       ├── useWorkflowProgress.test.ts
│       ├── useWorkflowArtifacts.test.ts
│       └── useWebSocketStatus.test.ts
│
├── components/
│   ├── WorkflowStatus.tsx               # Enhanced with real-time
│   ├── WorkflowEventLog.tsx             # New: event log display
│   ├── ConnectionStatus.tsx             # New: connection indicator
│   ├── ErrorBoundary.tsx                # New: error handling
│   └── __tests__/
│       ├── WorkflowStatus.test.tsx
│       ├── WorkflowEventLog.test.tsx
│       ├── ConnectionStatus.test.tsx
│       └── ErrorBoundary.test.tsx
│
└── contexts/
    └── WebSocketContext.tsx             # Global status context

e2e/
└── workflows.spec.ts                   # E2E tests
```

---

## Appendix B: Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/events
NEXT_PUBLIC_WS_RECONNECT_ENABLED=true
NEXT_PUBLIC_WS_MAX_RECONNECT_DELAY=30000
NEXT_PUBLIC_WS_EVENT_HISTORY_LIMIT=1000
```

---

**End of Implementation Plan**
