# PromptCard Zone-Based Layout Developer Guide

## Quick Start

The new zone-based layout system is automatically integrated into the PromptCard component. No changes are required for basic usage:

```tsx
import { PromptCard } from '@meaty/ui';

<PromptCard
  title="My Prompt"
  description="A sample prompt"
  version={2}
  access="private"
  tags={['javascript', 'react']}
  model="gpt-4"
/>
```

## Advanced Usage

### Registering Custom Components

```tsx
import { componentRegistry, type ComponentManifest } from '@meaty/ui';

const customComponent: ComponentManifest = {
  id: 'custom-indicator',
  displayName: 'Custom Status Indicator',
  priority: 75,
  placement: 'meta',
  requiredSpace: { width: 50, height: 24 },
  supportedSizes: ['standard', 'xl'],
  gracefulFallback: 'hide',
  accessibility: {
    label: 'Custom status indicator',
  },
};

// Register the component
componentRegistry.register(customComponent);

// Use with layout awareness
const CustomIndicator = withLayoutAwareness(
  ({ status }: { status: string }) => (
    <Badge variant="outline">{status}</Badge>
  ),
  customComponent
);
```

### Using Layout Hooks

```tsx
import { useLayout, useZone, useComponentVisibility } from '@meaty/ui';

function CustomPromptCard() {
  const layout = useLayout();
  const metaZone = useZone('meta');
  const isVersionVisible = useComponentVisibility('version-badge');

  return (
    <div>
      {/* Access layout information */}
      {layout.warnings.length > 0 && (
        <div>Layout warnings: {layout.warnings.join(', ')}</div>
      )}

      {/* Conditional rendering based on zone state */}
      {metaZone?.isVisible && (
        <div>Meta zone has {metaZone.components.length} components</div>
      )}

      {/* Component visibility checks */}
      {isVersionVisible && <div>Version badge is visible</div>}
    </div>
  );
}
```

### Zone Renderer Usage

```tsx
import { ZoneRenderer } from '@meaty/ui';

function CustomCardSection() {
  return (
    <ZoneRenderer placement="meta" className="custom-meta-section">
      <Badge>Custom</Badge>
      <Badge>Content</Badge>
    </ZoneRenderer>
  );
}
```

## Component Manifest API

### Basic Manifest

```typescript
const basicManifest: ComponentManifest = {
  id: 'unique-id',
  displayName: 'Human Readable Name',
  priority: 50, // 1-100, higher = more important
  placement: 'meta', // 'core' | 'meta' | 'overflow' | 'complication' | 'extended'
  requiredSpace: { width: 100, height: 24 },
  supportedSizes: ['compact', 'standard', 'xl'],
  gracefulFallback: 'hide', // 'hide' | 'truncate' | 'collapse' | 'relocate'
};
```

### Advanced Manifest

```typescript
const advancedManifest: ComponentManifest = {
  id: 'advanced-component',
  displayName: 'Advanced Component',
  priority: 80,
  placement: 'meta',
  requiredSpace: { width: 120, height: 32, maxWidth: 200 },
  supportedSizes: ['standard', 'xl'],
  supportedStates: ['default', 'running'], // Optional state filtering
  gracefulFallback: 'relocate',
  fallbackPlacement: 'overflow', // Alternative placement
  dependencies: ['title'], // Required components
  conflicts: ['version-badge'], // Conflicting components
  performance: {
    memoize: true, // Enable React.memo
    lazy: false, // Disable lazy loading
    priority: 80, // Render priority
  },
  accessibility: {
    role: 'status',
    label: 'Component status',
    description: 'Shows the current status of the component',
    hidden: false, // Don't hide from screen readers
  },
};
```

## Layout Engine Integration

### Manual Layout Calculation

```tsx
import { layoutEngine, type LayoutConfiguration } from '@meaty/ui';

function calculateCustomLayout() {
  const config: LayoutConfiguration = {
    cardSize: 'standard',
    cardState: 'default',
    cardDimensions: { width: 420, height: 280 },
    hasDescription: true,
    hasComplications: {
      topLeft: false,
      topRight: true,
      bottomLeft: false,
      bottomRight: false,
      edgeLeft: false,
      edgeRight: false,
      footer: false,
    },
  };

  const activeComponents = componentRegistry.resolveForContext(
    config.cardSize,
    config.cardState,
    config.cardDimensions
  );

  const result = layoutEngine.calculateLayout(config, activeComponents);

  console.log('Layout result:', result);
  return result;
}
```

### Custom Layout Provider

```tsx
import { LayoutProvider } from '@meaty/ui';

function CustomPromptCard({ children, ...props }) {
  return (
    <LayoutProvider
      cardSize="standard"
      cardState="default"
      cardDimensions={{ width: 420, height: 280 }}
      hasDescription={!!props.description}
      hasComplications={{
        topLeft: false,
        topRight: true,
        bottomLeft: false,
        bottomRight: false,
        edgeLeft: false,
        edgeRight: false,
        footer: false,
      }}
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </LayoutProvider>
  );
}
```

## CSS Customization

### Zone Styling

```css
/* Override zone layouts */
.layout-zone-meta {
  flex-direction: column; /* Stack metadata vertically */
  align-items: flex-start;
}

.layout-zone-overflow {
  justify-content: flex-start; /* Align overflow content to start */
}

/* Custom zone behavior */
.layout-zone.has-overflow::after {
  content: '▼'; /* Custom overflow indicator */
  background: var(--custom-color);
}
```

### Priority Classes

```css
/* Style components by priority */
.priority-essential {
  font-weight: 600;
  color: var(--mp-color-text-strong);
}

.priority-important {
  font-weight: 500;
  color: var(--mp-color-text);
}

.priority-supplementary {
  font-weight: 400;
  color: var(--mp-color-text-muted);
}

.priority-extended {
  font-weight: 300;
  color: var(--mp-color-text-subtle);
}
```

### Responsive Overrides

```css
/* Mobile-specific zone behavior */
@media (max-width: 768px) {
  .layout-zone-meta {
    flex-direction: column;
    gap: var(--mp-spacing-1);
  }

  .priority-supplementary {
    display: none; /* Hide supplementary content on mobile */
  }
}
```

## Debugging & Development

### Enable Debug Mode

```tsx
import { LayoutDebugOverlay } from '@meaty/ui';

function DebugPromptCard() {
  return (
    <LayoutProvider debug={true}>
      <PromptCard {...props} />
      {process.env.NODE_ENV === 'development' && <LayoutDebugOverlay />}
    </LayoutProvider>
  );
}
```

### Layout Warnings

```tsx
import { useLayout } from '@meaty/ui';

function LayoutWarnings() {
  const { warnings } = useLayout();

  if (process.env.NODE_ENV !== 'development' || warnings.length === 0) {
    return null;
  }

  return (
    <div className="dev-warnings">
      <h3>Layout Warnings:</h3>
      <ul>
        {warnings.map((warning, index) => (
          <li key={index}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Component Registry Inspection

```tsx
import { componentRegistry } from '@meaty/ui';

function inspectRegistry() {
  const allComponents = componentRegistry.getAll();
  console.log('Registered components:', allComponents);

  // Get components for specific context
  const contextComponents = componentRegistry.resolveForContext(
    'standard', // cardSize
    'default',  // cardState
    { width: 420, height: 280 }, // availableSpace
    'meta' // placement (optional)
  );
  console.log('Context-specific components:', contextComponents);
}
```

## Performance Optimization

### Component Memoization

```tsx
import { withLayoutAwareness, type ComponentManifest } from '@meaty/ui';
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }: { data: any }) => {
  // Expensive rendering logic
  return <div>{JSON.stringify(data)}</div>;
});

const manifest: ComponentManifest = {
  id: 'expensive-component',
  // ... other properties
  performance: {
    memoize: true, // Enable additional memoization
    priority: 50,
  },
};

const OptimizedComponent = withLayoutAwareness(ExpensiveComponent, manifest);
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';
import { withLayoutAwareness } from '@meaty/ui';

const LazyComponent = lazy(() => import('./HeavyComponent'));

const manifest: ComponentManifest = {
  id: 'lazy-component',
  // ... other properties
  performance: {
    lazy: true, // Enable lazy loading
  },
};

const LazyAwareComponent = withLayoutAwareness(
  (props) => (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  ),
  manifest
);
```

## Testing

### Layout Testing

```tsx
import { render } from '@testing-library/react';
import { LayoutProvider } from '@meaty/ui';

function renderWithLayout(component, layoutProps = {}) {
  const defaultProps = {
    cardSize: 'standard',
    cardState: 'default',
    cardDimensions: { width: 420, height: 280 },
    hasDescription: false,
    hasComplications: {
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
      edgeLeft: false,
      edgeRight: false,
      footer: false,
    },
    ...layoutProps,
  };

  return render(
    <LayoutProvider {...defaultProps}>
      {component}
    </LayoutProvider>
  );
}

test('component renders in layout', () => {
  const { getByText } = renderWithLayout(<PromptCard title="Test" />);
  expect(getByText('Test')).toBeInTheDocument();
});
```

### Zone Testing

```tsx
import { useZone } from '@meaty/ui';

function TestComponent() {
  const metaZone = useZone('meta');
  return <div data-testid="meta-zone-info">{metaZone?.isVisible ? 'visible' : 'hidden'}</div>;
}

test('zone visibility', () => {
  const { getByTestId } = renderWithLayout(<TestComponent />);
  expect(getByTestId('meta-zone-info')).toHaveTextContent('visible');
});
```

### Component Registration Testing

```tsx
import { componentRegistry } from '@meaty/ui';

beforeEach(() => {
  // Clean registry before each test
  componentRegistry.getAll().forEach(component => {
    componentRegistry.unregister(component.id);
  });
});

test('component registration', () => {
  const manifest = {
    id: 'test-component',
    displayName: 'Test',
    priority: 50,
    placement: 'meta',
    requiredSpace: { width: 100, height: 24 },
    supportedSizes: ['standard'],
    gracefulFallback: 'hide',
  };

  componentRegistry.register(manifest);
  expect(componentRegistry.get('test-component')).toEqual(manifest);
});
```

## Migration from Old System

### Before (Problematic Grid Layout)

```tsx
// Old problematic header structure
<div className="grid grid-cols-[1fr_auto] gap-3">
  <Header title={title} />
  <div className="flex gap-2">
    <Badge>v{version}</Badge>
    <Badge>{access}</Badge>
  </div>
</div>
```

### After (Zone-Based Layout)

```tsx
// New zone-based structure
<LayoutProvider {...layoutConfig}>
  <ZoneRenderer placement="core" className="header-zone">
    <div className="header-content">
      <div className="title-container">
        <Header title={title} />
      </div>
      <ZoneRenderer placement="meta" className="metadata-container">
        <Badge>v{version}</Badge>
        <Badge>{access}</Badge>
      </ZoneRenderer>
    </div>
  </ZoneRenderer>
</LayoutProvider>
```

## Common Patterns

### Priority-Based Conditional Rendering

```tsx
function PriorityBadge({ priority, children }) {
  const className = `priority-${priority >= 80 ? 'essential' :
                      priority >= 60 ? 'important' :
                      priority >= 40 ? 'supplementary' : 'extended'}`;

  return <div className={className}>{children}</div>;
}
```

### Dynamic Component Registration

```tsx
function useConditionalComponent(condition: boolean, manifest: ComponentManifest) {
  const { register, unregister } = useComponentRegistry();

  useEffect(() => {
    if (condition) {
      register(manifest);
    } else {
      unregister(manifest.id);
    }

    return () => unregister(manifest.id);
  }, [condition, manifest, register, unregister]);
}
```

### Responsive Component Visibility

```tsx
function ResponsiveComponent({ manifest }) {
  const isVisible = useComponentVisibility(manifest.id);
  const zone = useZone(manifest.placement);

  if (!isVisible || !zone?.isVisible) {
    return null;
  }

  return <div>Component content</div>;
}
```

This developer guide provides comprehensive examples for working with the new zone-based layout system while maintaining backward compatibility and enabling advanced customization.
