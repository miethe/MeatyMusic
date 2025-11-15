# E2E Tests - WebSocket Real-Time Client

Comprehensive end-to-end tests for the MeatyMusic WebSocket real-time client using Playwright.

## Overview

This test suite validates the complete workflow experience from a user's perspective, covering:

- **WebSocket Connection Lifecycle**: Connection, reconnection, and error handling
- **Real-Time Event Streaming**: Event display, latency, and ordering
- **Component Integration**: All UI components working together
- **Performance**: Latency, memory usage, frame rate, and bundle size
- **Accessibility**: Keyboard navigation, screen readers, ARIA compliance
- **Mobile Responsiveness**: Touch interactions and viewport adaptation

## Test Structure

```
e2e/
├── workflows.spec.ts        # Main workflow E2E scenarios (25+ tests)
├── performance.spec.ts      # Performance validation tests (15+ tests)
├── integration.spec.ts      # Integration validation tests (20+ tests)
├── fixtures/
│   └── workflow-events.ts   # Mock event data generators
├── utils/
│   └── websocket-mock.ts    # WebSocket mocking utilities
└── README.md               # This file
```

## Test Coverage

### Workflows (workflows.spec.ts)

**Scenario 1: Connection Lifecycle**
- WebSocket connects when page loads
- Shows connecting state during initial connection
- Maintains connection throughout workflow

**Scenario 2: Real-Time Event Streaming**
- Displays events in real-time
- Updates progress as workflow advances
- Events appear within 1 second
- Shows node transitions (PLAN → STYLE → LYRICS, etc.)

**Scenario 3: Auto-Reconnection**
- Shows reconnecting status on connection drop
- Auto-reconnects after network restoration
- Handles multiple reconnection attempts

**Scenario 4: Workflow Completion**
- Receives final event on completion
- Displays final artifacts
- Shows success notification

**Scenario 5: Error Handling**
- Displays errors when workflow fails
- Shows error details
- Handles WebSocket connection failures gracefully

**Scenario 6: Event Log Functionality**
- Accumulates events in log
- Displays timestamps
- Shows event node and phase

**Scenario 7: Accessibility**
- Proper ARIA labels
- Keyboard navigable
- Screen reader announcements

**Scenario 8: Mobile Responsiveness**
- Displays correctly on mobile
- Handles touch interactions

### Performance (performance.spec.ts)

**Event Display Latency**
- Events display within 1s (target: <1000ms)
- Handles rapid event streams without lag
- Maintains low latency throughout workflow

**Memory Usage**
- Memory under 50MB for 1000 events
- No memory leaks during reconnections
- Efficient event log virtualization

**Frame Rate / Rendering**
- Maintains 60fps during updates
- No layout thrashing (CLS < 0.1)
- Smooth scrolling in event log

**Network Performance**
- Handles slow network gracefully
- Queues events during reconnection

**Initial Page Load**
- DOM loads within 3s
- First Contentful Paint < 1.8s
- Time to Interactive < 5s

### Integration (integration.spec.ts)

**Full Workflow Integration**
- Complete workflow from start to finish
- State consistency across components
- Error handling integration

**Component Interoperability**
- WorkflowStatus ↔ EventLog sync
- ConnectionStatus updates based on state
- Metrics propagation from events
- Artifacts display after completion

**Navigation and Routing**
- Maintains connection on navigation
- Browser back/forward buttons
- Page refresh handling

**Data Persistence**
- Event history after reconnection
- Scroll position restoration
- State persistence in URL

**Real-Time Updates**
- All components update on new events
- Multiple simultaneous updates
- Efficient debouncing

**Error Recovery**
- Recovery from WebSocket errors
- Error boundary UI

**Accessibility Integration**
- Complete keyboard navigation
- ARIA live regions
- Axe accessibility audit

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm --filter "./apps/web" exec playwright install --with-deps
```

### Run All Tests

```bash
# Run all E2E tests
pnpm --filter "./apps/web" test:e2e

# Run with UI mode (interactive)
pnpm --filter "./apps/web" test:e2e:ui
```

### Run Specific Test Files

```bash
# Workflow tests only
pnpm --filter "./apps/web" exec playwright test e2e/workflows.spec.ts

# Performance tests only
pnpm --filter "./apps/web" exec playwright test e2e/performance.spec.ts

# Integration tests only
pnpm --filter "./apps/web" exec playwright test e2e/integration.spec.ts
```

### Run Specific Browsers

```bash
# Chrome only
pnpm --filter "./apps/web" exec playwright test --project=chromium

# Firefox only
pnpm --filter "./apps/web" exec playwright test --project=firefox

# Safari only
pnpm --filter "./apps/web" exec playwright test --project=webkit

# Mobile Chrome
pnpm --filter "./apps/web" exec playwright test --project=mobile-chrome
```

### Debug Mode

```bash
# Debug with Playwright Inspector
pnpm --filter "./apps/web" exec playwright test --debug

# Debug specific test
pnpm --filter "./apps/web" exec playwright test e2e/workflows.spec.ts:10 --debug
```

### Generate HTML Report

```bash
# After test run
pnpm --filter "./apps/web" exec playwright show-report
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Manual workflow dispatch

### GitHub Actions Workflow

The `.github/workflows/e2e-tests.yml` workflow includes:

1. **e2e-tests**: Tests on Chrome, Firefox, Safari
2. **e2e-mobile**: Tests on mobile viewports
3. **performance-tests**: Performance validation
4. **integration-tests**: Integration validation
5. **test-summary**: Aggregated results and PR comments

### Artifacts

Failed tests automatically upload:
- HTML test reports
- Screenshots of failures
- Videos of test runs
- Trace files for debugging

## WebSocket Mocking

### Mock Event Streams

The `fixtures/workflow-events.ts` module provides:

- `generateWorkflowEvents(runId)`: Complete workflow event sequence
- `generateFailedWorkflowEvents(runId)`: Workflow with failure
- `generateRapidEvents(runId, count)`: Rapid events for performance testing

### Mock WebSocket Client

The `utils/websocket-mock.ts` module provides:

- `mockWebSocket(page, events, options)`: Inject WebSocket mock
- `sendMockEvent(page, event)`: Send additional events
- `dropWebSocketConnection(page)`: Simulate connection drop
- `restoreWebSocketConnection(page)`: Restore connection

### Example Usage

```typescript
import { test, expect } from '@playwright/test';
import { generateWorkflowEvents } from './fixtures/workflow-events';
import { mockWebSocket } from './utils/websocket-mock';

test('should display events', async ({ page }) => {
  const events = generateWorkflowEvents('test-run-123');
  await mockWebSocket(page, events, { eventDelay: 100 });

  await page.goto('/songs/song-123/workflow/run-123');

  await expect(page.getByText(/PLAN/i)).toBeVisible();
});
```

## Performance Targets

| Metric | Target | Measured In |
|--------|--------|-------------|
| Event Display Latency | < 1s | milliseconds |
| Memory Usage (1000 events) | < 50MB | megabytes |
| Frame Rate | ≥ 60fps | frames/second |
| Bundle Size Increase | < 50KB | kilobytes (gzipped) |
| First Contentful Paint | < 1.8s | milliseconds |
| Cumulative Layout Shift | < 0.1 | CLS score |

## Best Practices

### Selector Strategy

1. **Prefer semantic selectors**:
   - `page.getByRole('status')`
   - `page.getByText(/connected/i)`
   - `page.getByLabel('Connection status')`

2. **Use data-testid for stability** (when semantic selectors aren't available):
   - `page.locator('[data-testid="event-log"]')`

3. **Avoid brittle selectors**:
   - ❌ `.className-abc123`
   - ❌ `div > div > span`

### Wait Strategies

1. **Use explicit waits**:
   ```typescript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

2. **Wait for network idle**:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Avoid hard timeouts** (except when necessary):
   ```typescript
   // ❌ Bad
   await page.waitForTimeout(5000);

   // ✅ Good
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

### Test Isolation

Each test should:
- Start with a clean state
- Not depend on other tests
- Clean up after itself
- Use unique test data

### Debugging Failed Tests

1. **Check screenshots**: `apps/web/test-results/`
2. **View trace**: `pnpm exec playwright show-trace trace.zip`
3. **Run with --debug**: `pnpm exec playwright test --debug`
4. **Check CI artifacts**: Download from GitHub Actions

## Troubleshooting

### Tests are flaky

- Increase timeouts for slow operations
- Use proper wait strategies (not `waitForTimeout`)
- Check for race conditions in async operations
- Verify selectors are stable

### WebSocket mock not working

- Ensure `mockWebSocket` is called before `page.goto`
- Check browser console for errors
- Verify event format matches expected structure

### Performance tests failing

- Run on a consistent environment (CI or local)
- Close other applications to free resources
- Check if targets are realistic for hardware

### Tests timeout in CI

- Increase timeout in playwright.config.ts
- Check if webServer is starting correctly
- Verify network access is not blocked

## Contributing

When adding new E2E tests:

1. Follow existing test structure and naming
2. Use fixtures for mock data
3. Add descriptive test names and comments
4. Update this README with new scenarios
5. Ensure tests pass locally before committing
6. Verify tests pass in CI

## Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [WebSocket Real-Time Client Implementation Plan](../../../docs/project_plans/implementation_plans/websocket-realtime-client-v1.md)
- [Component Test Documentation](../src/components/workflow/__tests__/README.md)
- [Testing Strategy](../../../docs/testing-strategy.md)

## Support

For questions or issues:
- Check existing test examples in this directory
- Review Playwright documentation
- Ask in team chat or create an issue

---

**Last Updated**: 2025-11-15
**Phase**: 5 - End-to-End Testing & Final Validation
**Test Count**: ~60 E2E tests across 3 suites
