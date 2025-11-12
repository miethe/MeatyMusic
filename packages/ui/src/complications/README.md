# PromptCard Complications System

## 🎯 Overview

The PromptCard Complications System provides a watch-face inspired slot system for adding micro-widgets around the PromptCard without modifying the core component. This system enables extensibility for future features like badges, indicators, charts, and other contextual information while maintaining clean separation of concerns.

## 🏗️ Architecture

### Core Components

1. **ComplicationProvider** - Context provider that manages card state and complications lifecycle
2. **ComplicationSlots** - Renders complications in their designated positions with error boundaries
3. **ComplicationWrapper** - Individual complication container with error isolation
4. **Type System** - Comprehensive TypeScript definitions for type safety

### Slot Positions

The system provides 7 strategic positions around the card:

```
┌─────────────────────┐
│ TL              TR  │  TL = topLeft, TR = topRight
│                     │
│EL      Card      ER │  EL = edgeLeft, ER = edgeRight
│                     │
│ BL              BR  │  BL = bottomLeft, BR = bottomRight
└─────────────────────┘
         Footer
```

### Design Principles

- **Non-intrusive**: Complications don't affect card's intrinsic dimensions
- **Performance-first**: Lazy loading, memoization, and error isolation
- **Accessibility-native**: WCAG 2.1 AA compliance with proper ARIA labels
- **Responsive**: Adapts to card size variants (compact, standard, xl)
- **Error-resilient**: Individual error boundaries per slot powered by `react-error-boundary`

## 🔌 Plugin Registration

Complications can be registered globally using a plugin-style API. Registered
complications are merged with any provided directly to the `ComplicationProvider`.

```ts
import {
  registerComplication,
  registerDefaultComplication,
} from '@meaty/ui/complications';

registerDefaultComplication('topRight', { component: MyDefault });

const unregister = registerComplication('topRight', { component: MyOverride });
// later
unregister();
```

The system uses `react-error-boundary` to isolate failures and provide sensible
fallbacks for each slot.

## 🚀 Quick Start

### Basic Usage

```tsx
import { PromptCard } from '@meaty/ui';
import { BadgeComplication } from '@meaty/ui/complications/examples';

<PromptCard
  title="My Prompt"
  complications={{
    topRight: {
      component: BadgeComplication,
      supportedSizes: ['standard', 'xl'],
      maxDimensions: { width: 32, height: 32 }
    }
  }}
  // ... other props
/>
```

### Creating Custom Complications

```tsx
import { ComplicationProps, withComplicationMemo } from '@meaty/ui/complications';

function MyComplication({ cardId, cardState, slot }: ComplicationProps) {
  return (
    <div className="custom-complication">
      {/* Your complication content */}
    </div>
  );
}

// Export with memoization for performance
export const MyMemoizedComplication = withComplicationMemo(MyComplication);
```

### Advanced Configuration

```tsx
<PromptCard
  complications={{
    topLeft: {
      component: StatusBadge,
      supportedSizes: ['compact', 'standard', 'xl'],
      supportedStates: ['default', 'running'],
      maxDimensions: { width: 48, height: 48 },
      requiresAnimations: false,
      performance: {
        lazy: true,
        memoize: true,
        priority: 90
      }
    },
    footer: {
      component: MetricsBar,
      supportedSizes: ['xl'],
      supportedStates: ['default'],
      maxDimensions: { width: 400, height: 32 }
    }
  }}
  complicationConfig={{
    enabled: true,
    maxComplications: 3,
    errorStrategy: 'fallback',
    monitoring: { logPerformance: true }
  }}
  onComplicationError={(slot, error) => console.error(`Error in ${slot}:`, error)}
/>
```

## 📚 API Reference

### Types

#### `SlotPosition`
```tsx
type SlotPosition =
  | 'topLeft' | 'topRight'
  | 'bottomLeft' | 'bottomRight'
  | 'edgeLeft' | 'edgeRight'
  | 'footer';
```

#### `SlotConfig`
```tsx
interface SlotConfig {
  component: ComponentType<ComplicationProps>;
  supportedSizes?: CardSize[];
  supportedStates?: CardState[];
  maxDimensions?: { width?: number; height?: number };
  requiresAnimations?: boolean;
  errorFallback?: ComponentType<ComplicationErrorProps>;
  performance?: {
    lazy?: boolean;
    memoize?: boolean;
    priority?: number;
  };
}
```

#### `ComplicationProps`
```tsx
interface ComplicationProps {
  cardId: string;
  cardState: CardState;
  cardSize: CardSize;
  cardTitle: string;
  slot: SlotPosition;
  isFocused: boolean;
  isVisible: boolean;
  lastStateChange: Date;
  features: {
    animations: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
  'aria-label'?: string;
}
```

### Hooks

#### `useComplicationContext()`
Access card context from within a complication component:

```tsx
function MyComplication() {
  const { cardId, cardState, cardSize } = useComplicationContext();
  // Use context data...
}
```

#### `useComplicationVisibility()`
Determine if a complication should render based on conditions:

```tsx
function ConditionalComplication() {
  const isVisible = useComplicationVisibility(
    ['standard', 'xl'], // supportedSizes
    ['default', 'running'], // supportedStates
    false // requiresAnimations
  );

  if (!isVisible) return null;
  // Render complication...
}
```

#### `useSlotManager()`
Access slot management functions for dynamic complications:

```tsx
function DynamicComplication() {
  const slotManager = useSlotManager();

  // Get effective slots based on current context
  const activeSlots = slotManager.getEffectiveSlots(context);

  // Report errors
  slotManager.reportError('topLeft', new Error('Something went wrong'), errorInfo);
}
```

### Utility Components

#### `withComplicationMemo()`
Higher-order component for performance optimization:

```tsx
const OptimizedComplication = withComplicationMemo(MyComplication);
```

#### `ComplicationWrapper`
Container component with error boundaries:

```tsx
<ComplicationWrapper slot="topRight" className="custom-wrapper">
  <MyComplication />
</ComplicationWrapper>
```

## 🎨 CSS Architecture

### Custom Properties

The system uses CSS custom properties for theming and responsive behavior:

```css
:root {
  --mp-z-complications: 10;
  --mp-spacing-1: 4px;
  --mp-spacing-2: 8px;
  --mp-spacing-3: 12px;
  --mp-spacing-4: 16px;
  /* ... */
}
```

### Slot Classes

Each slot has specific positioning classes:

- `.slotTopLeft`, `.slotTopRight` - Corner positions with transform-origin
- `.slotEdgeLeft`, `.slotEdgeRight` - Vertically centered edge positions
- `.slotBottomLeft`, `.slotBottomRight` - Bottom corner positions
- `.slotFooter` - Full-width bottom position

### Responsive Modifiers

Card size variants apply different constraints:

```css
.compact .slotTopLeft {
  max-width: 32px;
  max-height: 32px;
}

.xl .slotTopLeft {
  max-width: 64px;
  max-height: 64px;
}
```

## 🧪 Testing

### Unit Tests

Test individual complications with mock context:

```tsx
import { render } from '@testing-library/react';
import { ComplicationProvider } from '@meaty/ui/complications';

test('renders badge complication', () => {
  render(
    <ComplicationProvider
      cardId="test-card"
      cardState="default"
      cardSize="standard"
      cardTitle="Test Card"
    >
      <BadgeComplication text="Test" variant="success" />
    </ComplicationProvider>
  );
  // Assertions...
});
```

### Integration Tests

Test complications within full PromptCard context:

```tsx
test('complications render in correct slots', () => {
  render(
    <PromptCard
      title="Test Prompt"
      complications={{
        topRight: { component: TestComplication }
      }}
    />
  );

  expect(screen.getByTestId('complication-topRight')).toBeInTheDocument();
});
```

### Accessibility Tests

Ensure complications meet WCAG standards:

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

test('complications are accessible', async () => {
  const { container } = render(<PromptCardWithComplications />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🔧 Development Tools

### Debug Mode

Enable debug mode to visualize slot boundaries:

```tsx
<PromptCard
  complications={myComplications}
  complicationConfig={{ debug: true }}
/>
```

### Mock Complications

Use built-in mock complications for development:

```tsx
import { createMockComplicationSet } from '@meaty/ui/complications';

const mockComplications = createMockComplicationSet();
```

### Performance Monitoring

Enable performance monitoring:

```tsx
<PromptCard
  complicationConfig={{
    monitoring: {
      logPerformance: true,
      renderTimeThreshold: 16 // ms
    }
  }}
/>
```

## 📋 Constraints & Limitations

### Slot Dimensions

Maximum recommended dimensions per slot:

| Slot | Max Width | Max Height | Use Case |
|------|-----------|------------|----------|
| Corner slots | 48px | 48px | Badges, status icons |
| Edge slots | 32px | 120px | Vertical indicators |
| Footer slot | 400px | 40px | Horizontal metrics |

### Performance Considerations

- Maximum 7 complications per card (one per slot)
- Lazy loading recommended for complex complications
- Memoization required for frequently re-rendering complications
- Error boundaries isolate failures to individual slots

### Browser Support

- Modern browsers with CSS Grid and Flexbox support
- CSS custom properties (IE 11+ with polyfill)
- ES2018+ for JavaScript features

## 🛠️ Migration Guide

### From Previous Versions

If migrating from a custom complications implementation:

1. **Update imports**:
   ```tsx
   // Old
   import { CustomBadge } from './components/CustomBadge';

   // New
   import { BadgeComplication } from '@meaty/ui/complications/examples';
   ```

2. **Update prop structure**:
   ```tsx
   // Old
   <PromptCard
     badge={{ text: "NEW", position: "top-right" }}
   />

   // New
   <PromptCard
     complications={{
       topRight: {
         component: (props) => <BadgeComplication {...props} text="NEW" />
       }
     }}
   />
   ```

3. **Update CSS classes**:
   ```css
   /* Old */
   .custom-badge { position: absolute; top: -8px; right: -8px; }

   /* New - use slot classes */
   .my-complication { /* positioning handled by slot classes */ }
   ```

## 🤝 Contributing

### Adding New Slot Positions

To add new slot positions, update:

1. `SlotPosition` type in `types.ts`
2. `SLOT_CLASSES` mapping in `ComplicationSlots.tsx`
3. CSS positioning in `complications.module.css`
4. Documentation and examples

### Creating Complication Examples

Follow the pattern in `examples/BadgeComplication.tsx`:

1. Create the base component
2. Add memoization with `withComplicationMemo`
3. Export preset configurations
4. Document usage and constraints
5. Add Storybook stories

### Performance Guidelines

- Always use `React.memo` for pure complications
- Implement lazy loading for heavy components
- Use `useComplicationVisibility` for conditional rendering
- Profile render performance with provided monitoring tools

## 📖 Further Reading

- [Component Architecture ADR](../../../docs/architecture/ADRs/prompt-card-complications.md)
- [Accessibility Guidelines](../../../docs/accessibility/complications.md)
- [Performance Optimization Guide](../../../docs/performance/complications.md)
- [Storybook Documentation](http://localhost:6006/?path=/story/components-promptcard-complications)

---

*This documentation is for PromptCard Complications System v1.0.0. For the latest updates, see the [changelog](./CHANGELOG.md).*
