# Complications System Test Suite

This directory contains comprehensive tests for the PromptCard Complications system.

## Test Files

### Core Tests
- `types.test.ts` - Type definitions and TypeScript safety
- `context.test.tsx` - Full context provider test suite
- `ComplicationSlots.test.tsx` - Complete slot system tests
- `../../components/PromptCard/__tests__/PromptCard.complications.test.tsx` - Full integration tests

### Example Complication Tests
- `examples/__tests__/MetricComplication.test.tsx`
- `examples/__tests__/SparklineComplication.test.tsx`
- `examples/__tests__/StatusComplication.test.tsx`

## Test Coverage

The test suite covers all acceptance criteria:

### ✅ Unit Tests (Vitest + React Testing Library)
- [x] Card accepts complications prop with slot mappings
- [x] Seven slots render in correct positions
- [x] Empty slots render nothing (no placeholder)
- [x] Complications receive card context (id, state, size)
- [x] Error boundary catches complication failures
- [x] Performance: Adding complications doesn't trigger re-render of card body

### ✅ Integration Tests
- [x] Complication mounting/unmounting
- [x] Context provider functionality
- [x] Slot content respects card size variant constraints

### ✅ Accessibility Tests
- [x] Complications have proper ARIA labels (axe testing)
- [x] Screen reader announcement verification

## Running Tests

```bash
# Run all tests in the UI package
pnpm --filter "./packages/ui" test
```

## Test Components Used

### Mock Complications
- `BadgeComplication` - Simple badge indicator
- `StatusComplication` - Card state indicator
- `AnimatedComplication` - Animation preference respector
- `ErrorComplication` - Throws errors for error boundary testing
- `SlowComplication` - Performance testing

### Testing Utilities
- Type guards and validation
- Context providers and hooks
- Error boundaries
- Performance monitoring
- Memory management

## Known Issues

The comprehensive test files may cause memory issues in Jest due to:
1. Complex React component trees
2. Heavy use of useEffect and state updates
3. Large number of test cases running sequentially

## Architecture Coverage

Tests verify:
- **Layered Architecture**: Context → Slots → Components
- **Error Isolation**: Individual complication failures don't break card
- **Performance**: Memoization and lazy loading
- **Accessibility**: ARIA labels, screen reader support, focus management
- **Responsive**: Size constraints, state filtering, animation preferences
- **Type Safety**: TypeScript type definitions and runtime validation
