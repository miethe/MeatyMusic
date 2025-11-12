# ModelDisplay Components

A comprehensive set of components for displaying model information with rich metadata, deprecation warnings, and accessibility features. These components work alongside the ModelPicker to provide various ways to present model data throughout the MeatyPrompts application.

## Components

### ModelChip

Compact model representation with provider logo, status indicators, and capability badges.

```tsx
import { ModelChip } from '@meaty/ui';

<ModelChip
  model={model}
  variant="default" // 'default' | 'compact' | 'detailed'
  size="default" // 'sm' | 'default' | 'lg'
  showProvider={true}
  showStatus={true}
  showCapabilities={false}
  showPricing={false}
  interactive={false}
  onClick={() => console.log('Selected')}
  onRemove={() => console.log('Removed')}
/>
```

**Features:**
- Provider logo display with fallback
- Status badges (Active, Beta, Deprecated)
- Capability icons with tooltips
- Price tier indicators
- Removable variant with X button
- Keyboard navigation support
- Multiple sizes and variants

### ModelTooltip

Rich hover information display with comprehensive model metadata.

```tsx
import { ModelTooltip } from '@meaty/ui';

<ModelTooltip
  model={model}
  side="top" // 'top' | 'right' | 'bottom' | 'left'
  align="center" // 'start' | 'center' | 'end'
  showFullDetails={true}
  showMetrics={false}
>
  <button>Hover for info</button>
</ModelTooltip>
```

**Features:**
- Comprehensive model metadata
- Performance metrics display
- Capability matrix with icons
- Provider information and links
- Responsive content sizing
- Delayed show/hide for better UX

### ModelCard

Detailed model information display for comprehensive model browsing.

```tsx
import { ModelCard } from '@meaty/ui';

<ModelCard
  model={model}
  variant="default" // 'default' | 'compact' | 'detailed'
  showActions={true}
  showMetrics={false}
  showSuggestions={false}
  onSelect={() => console.log('Selected')}
  onFavorite={() => console.log('Favorited')}
  onCompare={() => console.log('Compare')}
/>
```

**Features:**
- Detailed model information layout
- Interactive capability grid
- Performance benchmarks
- Action buttons (select, favorite, compare)
- Related model suggestions
- Responsive design
- User ratings display

### ModelDeprecationWarning

Visual deprecation indicators with migration guidance.

```tsx
import { ModelDeprecationWarning } from '@meaty/ui';

<ModelDeprecationWarning
  model={deprecatedModel}
  variant="banner" // 'inline' | 'banner' | 'modal'
  severity="warning" // 'notice' | 'warning' | 'critical'
  showAlternatives={true}
  showTimeline={true}
  onDismiss={() => console.log('Dismissed')}
  onMigrate={(modelId) => console.log('Migrate to', modelId)}
/>
```

**Features:**
- Multiple severity levels with styling
- Timeline visualization
- Alternative model recommendations
- Migration guidance and links
- Dismissible notifications
- Urgency indicators based on EOL dates

## Usage Examples

### Basic Model Display

```tsx
// Simple chip display
<ModelChip model={model} showProvider showStatus />

// Interactive chip with removal
<ModelChip
  model={model}
  interactive
  showProvider
  showCapabilities
  onClick={handleSelect}
  onRemove={handleRemove}
/>
```

### Rich Model Information

```tsx
// Tooltip with detailed info
<ModelTooltip model={model} showFullDetails showMetrics>
  <ModelChip model={model} interactive />
</ModelTooltip>

// Comprehensive card view
<ModelCard
  model={model}
  variant="detailed"
  showActions
  showMetrics
  showSuggestions
  onSelect={handleSelect}
  onFavorite={handleFavorite}
  onCompare={handleCompare}
/>
```

### Deprecation Handling

```tsx
// Inline deprecation indicator
{model.deprecation && (
  <ModelDeprecationWarning model={model} variant="inline" />
)}

// Banner warning with actions
<ModelDeprecationWarning
  model={model}
  variant="banner"
  showAlternatives
  onMigrate={handleMigration}
  onDismiss={handleDismiss}
/>

// Modal dialog for critical deprecations
<ModelDeprecationWarning
  model={model}
  variant="modal"
  severity="critical"
  showTimeline
  showAlternatives
/>
```

### Model Gallery

```tsx
const ModelGallery = ({ models }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {models.map(model => (
      <div key={model.id}>
        {model.deprecation && (
          <ModelDeprecationWarning model={model} variant="banner" />
        )}
        <ModelCard
          model={model}
          showActions
          onSelect={() => selectModel(model.id)}
        />
      </div>
    ))}
  </div>
);
```

## Accessibility Features

### Keyboard Navigation
- All interactive components support Tab navigation
- Enter/Space keys activate buttons
- Delete/Backspace keys remove chips
- Escape key dismisses warnings

### Screen Reader Support
- Comprehensive ARIA labels and descriptions
- Semantic HTML structure
- Role attributes for custom controls
- Descriptive text for complex UI elements

### Visual Accessibility
- High contrast color compliance
- Focus indicators on all interactive elements
- Clear visual hierarchy
- Appropriate text sizing and spacing

## TypeScript Support

All components are fully typed with comprehensive interfaces:

```tsx
interface ModelChipProps {
  model: EnhancedModel;
  variant?: 'default' | 'compact' | 'detailed';
  size?: 'sm' | 'default' | 'lg';
  showProvider?: boolean;
  showStatus?: boolean;
  showCapabilities?: boolean;
  showPricing?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}
```

## Styling and Theming

Components follow the MeatyPrompts design system:

- Uses design tokens from `@meaty/tokens`
- Supports light/dark theme variants
- Consistent spacing and typography
- Responsive design patterns
- CVA (Class Variance Authority) for variant management

## Performance Considerations

### Optimizations
- React.memo for expensive re-renders
- Lazy loading of heavy tooltip content
- Efficient hover state management
- Memoized expensive calculations

### Best Practices
- Use appropriate variant for context
- Enable virtualization for large lists
- Lazy load metrics when not immediately needed
- Debounce hover interactions

## Integration with ModelPicker

These components are designed to work seamlessly with the ModelPicker:

```tsx
import { ModelPicker, ModelChip, ModelTooltip } from '@meaty/ui';

// Display selected models as chips
const SelectedModels = ({ selectedModels, onRemove }) => (
  <div className="flex flex-wrap gap-2">
    {selectedModels.map(model => (
      <ModelTooltip key={model.id} model={model}>
        <ModelChip
          model={model}
          showProvider
          onRemove={() => onRemove(model.id)}
        />
      </ModelTooltip>
    ))}
  </div>
);
```

## Testing

Comprehensive test coverage includes:

- Unit tests for all components
- Accessibility testing with jest-axe
- Interaction testing with user-event
- Visual regression testing in Storybook
- Keyboard navigation testing

Run tests:
```bash
npm test ModelDisplay
```

## Migration from Legacy Components

If upgrading from previous model display components:

1. **Replace ModelBadge** → Use `ModelChip` with appropriate props
2. **Replace ModelInfo** → Use `ModelTooltip` or `ModelCard`
3. **Replace DeprecationBanner** → Use `ModelDeprecationWarning`
4. **Update imports** → Import from `@meaty/ui`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Accessibility tools and screen readers
- Keyboard-only navigation support

## Contributing

When adding new features:

1. Update TypeScript interfaces
2. Add comprehensive tests
3. Update Storybook documentation
4. Follow accessibility guidelines
5. Test with screen readers
6. Verify responsive design

## Related Components

- **ModelPicker**: Main model selection interface
- **ModelFilter**: Advanced filtering capabilities
- **Badge**: Status and category indicators
- **Card**: Layout foundation for ModelCard
- **Tooltip**: Information display foundation
- **Avatar**: Provider logo display
